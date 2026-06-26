import { mp }     from "@/src/infrastructure/payments/mercadopago.client";
import { prisma } from "@/src/infrastructure/database/prisma/client";
import { AppError } from "@/src/shared/errors/app.error";
import type { Product, Subscription, Order } from "@/src/generated/client";

export interface CreateOrderInput {
    productId: string;
    userId: string;
    userEmail: string;
    appUrl: string;
    shippingAddress: {
        fullName?:     string;
        phone?:        string;
        street:        string;
        neighborhood?: string;
        city:          string;
        department:    string;
        zip?:          string;
        instructions?: string;
    };
    customization?: {
        braceletColor?: string;
        cardFrontUrl?:  string;
        cardBackUrl?:   string;
    };
}

export interface CreateOrderResult {
    orderId:      string;
    reference:    string;
    preferenceId: string | undefined;
    initPoint:    string | undefined;
    sandboxUrl:   string | undefined;
}

export async function createOrderService(input: CreateOrderInput): Promise<CreateOrderResult> {
    const { productId, userId, userEmail, appUrl, shippingAddress, customization } = input;

    const product: Product | null = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive)
        throw new AppError("Producto no encontrado", 404, "PRODUCT_NOT_FOUND");

    const activeSubscription: Subscription | null = await prisma.subscription.findFirst({
        where: {
            userId,
            status:  "ACTIVE",
            endDate: { gt: new Date() },
            product: { productType: product.productType },
        },
    });
    if (activeSubscription)
        throw new AppError(
            `Ya tienes una suscripción activa de ${product.productType === "CARD" ? "tarjeta" : "manilla"}`,
            409,
            "SUBSCRIPTION_ACTIVE"
        );

    // Si tiene el OTRO tipo activo → precio de upgrade $30.000
    const otherType = product.productType === "CARD" ? "BRACELET" : "CARD";
    const hasOtherType = await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", endDate: { gt: new Date() }, product: { productType: otherType } },
    });
    const upgradePrice = 30000;
    const finalPrice   = hasOtherType ? upgradePrice : Number(product.price);

    const openOrders = await prisma.order.findMany({
        where: { userId, productId, status: { in: ["PENDING", "PAYMENT_PENDING"] } },
        orderBy: { createdAt: "desc" },
        include: { payment: true },
    });

    const [latestOrder, ...olderOrders] = openOrders;

    if (olderOrders.length > 0) {
        const ids = olderOrders.map(o => o.id);
        await prisma.$transaction([
            prisma.payment.updateMany({ where: { orderId: { in: ids } }, data: { status: "VOIDED" } }),
            prisma.order.updateMany(  { where: { id:      { in: ids } }, data: { status: "CANCELLED" } }),
        ]);
    }

    const shippingData = {
        shippingFullName:     shippingAddress.fullName      ?? null,
        shippingPhone:        shippingAddress.phone         ?? null,
        shippingStreet:       shippingAddress.street,
        shippingNeighborhood: shippingAddress.neighborhood  ?? null,
        shippingCity:         shippingAddress.city,
        shippingDepartment:   shippingAddress.department,
        shippingZip:          shippingAddress.zip           ?? null,
        shippingInstructions: shippingAddress.instructions  ?? null,
    };

    let order: Order;
    if (latestOrder) {
        order = await prisma.order.update({
            where: { id: latestOrder.id },
            data: {
                status: "PENDING",
                totalAmount: finalPrice,
                currency: "COP",
                ...shippingData,
                braceletColor: customization?.braceletColor ?? null,
                cardFrontUrl:  customization?.cardFrontUrl  ?? null,
                cardBackUrl:   customization?.cardBackUrl   ?? null,
            },
        });
    } else {
        const reference = `horus-${userId.slice(0, 8)}-${Date.now()}`;
        order = await prisma.order.create({
            data: {
                userId, productId, reference,
                status: "PENDING",
                totalAmount: finalPrice,
                currency: "COP",
                ...shippingData,
                braceletColor: customization?.braceletColor ?? null,
                cardFrontUrl:  customization?.cardFrontUrl  ?? null,
                cardBackUrl:   customization?.cardBackUrl   ?? null,
            },
        });
    }

    const successUrl      = new URL(`/payment/success?orderId=${order.id}`, appUrl).toString();
    const failureUrl      = new URL(`/payment/error?orderId=${order.id}`,   appUrl).toString();
    const pendingUrl      = new URL(`/payment/pending?orderId=${order.id}`,  appUrl).toString();
    const notificationUrl = new URL("/api/payments/webhook", appUrl).toString();

    type PreferenceBody = {
        external_reference: string;
        items: { id: string; title: string; description?: string; quantity: number; unit_price: number; currency_id: string }[];
        payer: { email: string };
        back_urls: { success: string; failure: string; pending: string };
        notification_url?: string;
        statement_descriptor: string;
        auto_return?: "approved";
    };

    const isProduction = appUrl.startsWith("https://");

    const preferenceBody: PreferenceBody = {
        external_reference: order.reference,
        items: [{
            id: product.id, title: product.name,
            description: product.description ?? product.name,
            quantity: 1, unit_price: finalPrice, currency_id: "COP",
        }],
        payer: { email: userEmail },
        back_urls: { success: successUrl, failure: failureUrl, pending: pendingUrl },
        statement_descriptor: "HORUS BRACELET",
    };

    if (isProduction) {
        preferenceBody.notification_url = notificationUrl;
        preferenceBody.auto_return = "approved";
    }

    const preference: { id?: string; init_point?: string; sandbox_init_point?: string } =
        await mp.preferences.create({ body: preferenceBody });

    await prisma.payment.upsert({
        where: { orderId: order.id },
        update: { status: "PENDING", paymentMethod: "CARD", amount: finalPrice, currency: "COP", mpReference: order.reference },
        create: { orderId: order.id, userId, paymentMethod: "CARD", status: "PENDING", amount: finalPrice, currency: "COP", mpReference: order.reference },
    });

    return {
        orderId:      order.id,
        reference:    order.reference,
        preferenceId: preference.id,
        initPoint:    preference.init_point,
        sandboxUrl:   preference.sandbox_init_point,
    };
}
