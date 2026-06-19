import { NextRequest, NextResponse } from "next/server";
import { z }                         from "zod";
import { mp }                        from "@/src/infrastructure/payments/mercadopago.client";
import { prisma }                    from "@/src/infrastructure/database/prisma/client";
import { AppError }                  from "@/src/shared/errors/app.error";
import type { Product, Subscription, Order } from "@/generated/prisma/client";

const createOrderSchema = z.object({
    productId: z.string().uuid("Producto inválido"),
    shippingAddress: z.object({
        street:     z.string().min(1, "Dirección requerida"),
        city:       z.string().min(1, "Ciudad requerida"),
        department: z.string().min(1, "Departamento requerido"),
        zip:        z.string().optional(),
    }),
});

export async function POST(request: NextRequest) {
    try {
        // 1. Validar body
        const body: unknown = await request.json();
        const validation = createOrderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Datos inválidos",
                    errors:  validation.error.flatten().fieldErrors,
                },
                { status: 422 }
            );
        }

        const { productId, shippingAddress } = validation.data;

        // 2. Verificar usuario autenticado — viene del middleware
        const userId = request.headers.get("x-user-id");
        const userEmail = request.headers.get("x-user-email");

        if (!userId || !userEmail) {
            return NextResponse.json(
                { success: false, message: "No autenticado" },
                { status: 401 }
            );
        }

        // 3. Verificar que el producto existe
        const product: Product | null = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product || !product.isActive) {
            return NextResponse.json(
                { success: false, message: "Producto no encontrado" },
                { status: 404 }
            );
        }

        // 4. Verificar que no tiene suscripción activa
        const activeSubscription: Subscription | null = await prisma.subscription.findFirst({
            where: {
                userId,
                status: "ACTIVE",
                endDate: { gt: new Date() },
            },
        });

        if (activeSubscription) {
            return NextResponse.json(
                { success: false, message: "Ya tienes una suscripción activa" },
                { status: 409 }
            );
        }

        // 5. Reutilizar orden pendiente si ya existe
        const openOrders = await prisma.order.findMany({
            where: {
                userId,
                productId,
                status: { in: ["PENDING", "PAYMENT_PENDING"] },
            },
            orderBy: { createdAt: "desc" },
            include: { payment: true },
        });

        const [latestOrder, ...olderOrders] = openOrders;

        if (olderOrders.length > 0) {
            const olderOrderIds = olderOrders.map((item) => item.id);
            await prisma.$transaction([
                prisma.payment.updateMany({
                    where: { orderId: { in: olderOrderIds } },
                    data: { status: "VOIDED" },
                }),
                prisma.order.updateMany({
                    where: { id: { in: olderOrderIds } },
                    data: { status: "CANCELLED" },
                }),
            ]);
        }

        let order: Order;
        if (latestOrder) {
            order = await prisma.order.update({
                where: { id: latestOrder.id },
                data: {
                    status: "PENDING",
                    totalAmount: product.price,
                    currency: "COP",
                    shippingStreet: shippingAddress.street,
                    shippingCity: shippingAddress.city,
                    shippingDepartment: shippingAddress.department,
                    shippingZip: shippingAddress.zip ?? null,
                },
            });
        } else {
            // Crear referencia única para la orden
            const reference = `horus-${userId.slice(0, 8)}-${Date.now()}`;

            // Crear la orden en BD
            order = await prisma.order.create({
                data: {
                    userId,
                    productId,
                    reference,
                    status: "PENDING",
                    totalAmount: product.price,
                    currency: "COP",
                    shippingStreet: shippingAddress.street,
                    shippingCity: shippingAddress.city,
                    shippingDepartment: shippingAddress.department,
                    shippingZip: shippingAddress.zip ?? null,
                },
            });
        }

        const reference = order.reference;

        // 6. Crear preferencia de pago en MercadoPago
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

        if (!appUrl) {
            return NextResponse.json(
                { success: false, message: "Falta configurar NEXT_PUBLIC_APP_URL" },
                { status: 500 }
            );
        }

        const successUrl = new URL("/payment/success", appUrl);
        successUrl.searchParams.set("orderId", order.id);
        const failureUrl = new URL("/payment/error", appUrl);
        failureUrl.searchParams.set("orderId", order.id);
        const pendingUrl = new URL("/payment/pending", appUrl);
        pendingUrl.searchParams.set("orderId", order.id);
        const notificationUrl = new URL("/api/payments/webhook", appUrl);

        type PreferenceBody = {
            external_reference: string;
            items: Array<{
                id: string;
                title: string;
                description?: string;
                quantity: number;
                unit_price: number;
                currency_id: string;
            }>;
            payer: { email: string };
            back_urls: { success: string; failure: string; pending: string };
            notification_url: string;
            statement_descriptor: string;
            auto_return?: "approved";
        };

        const preferenceBody: PreferenceBody = {
            external_reference: reference,
            items: [
                {
                    id:          product.id,
                    title:       product.name,
                    description: product.description ?? product.name,
                    quantity:    1,
                    unit_price:  Number(product.price),
                    currency_id: "COP",
                },
            ],
            payer: {
                email: userEmail,
            },
            back_urls: {
                success: successUrl.toString(),
                failure: failureUrl.toString(),
                pending: pendingUrl.toString(),
            },
            notification_url: notificationUrl.toString(),
            statement_descriptor: "HORUS BRACELET",
        };

        if (appUrl.startsWith("https://")) {
            preferenceBody.auto_return = "approved";
        }

        const preference: { id?: string; init_point?: string; sandbox_init_point?: string } = await mp.preferences.create({
            body: preferenceBody,
        });

        // 8. Crear o actualizar registro de pago en BD
        await prisma.payment.upsert({
            where: { orderId: order.id },
            update: {
                status: "PENDING",
                paymentMethod: "CARD",
                amount: product.price,
                currency: "COP",
                mpReference: reference,
            },
            create: {
                orderId: order.id,
                userId,
                paymentMethod: "CARD",
                status: "PENDING",
                amount: product.price,
                currency: "COP",
                mpReference: reference,
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    orderId:      order.id,
                    reference,
                    preferenceId: preference.id,               // para el SDK de MercadoPago en el frontend
                    initPoint:    preference.init_point,        // URL de pago — redirige aquí
                    sandboxUrl:   preference.sandbox_init_point, // URL de pruebas
                },
            },
            { status: 201 }
        );

    } catch (error: unknown) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, message: error.message, code: error.code },
                { status: error.statusCode }
            );
        }

        console.error("[CREATE_ORDER_ERROR]", error);
        return NextResponse.json(
            { success: false, message: "Error al crear la orden" },
            { status: 500 }
        );
    }
}