import { NextRequest, NextResponse } from "next/server";
import { mp }                        from "@/src/infrastructure/payments/mercadopago.client";
import { prisma }                    from "@/src/infrastructure/database/prisma/client";
import type { Prisma } from "@/src/generated/client";
import { sendOrderConfirmationEmail } from "@/src/infrastructure/email/order-confirmation";

export const runtime = "nodejs";

type OrderWithProduct = Prisma.OrderGetPayload<{
    include: { product: true; payment: true; user: { select: { email: true } } };
}>;

interface MercadoPagoPayment {
    id?: string | number;
    status?: string;
    external_reference?: string | null;
    [key: string]: unknown;
}

export async function POST(request: NextRequest) {
    try {
        const body: unknown = await request.json();

        console.log("[WEBHOOK] MercadoPago notificación:", JSON.stringify(body));

        // MercadoPago envía diferentes tipos de notificaciones
        const { type, data } = body as { type?: string; data?: { id?: string | number } };

        // Solo procesamos notificaciones de pagos
        if (type !== "payment") {
            return NextResponse.json({ received: true });
        }

        const paymentId = (data as { id?: string | number })?.id;
        if (!paymentId) {
            return NextResponse.json({ received: true });
        }

        // 1. Consultar el pago en MercadoPago
        const mpPayment = await mp.payment.get({ id: paymentId });
        const mpPayload = ((mpPayment as { response?: unknown })?.response ?? mpPayment) as unknown as MercadoPagoPayment;

        const status    = mpPayload.status;             // approved, rejected, pending
        const reference = mpPayload.external_reference; // nuestra referencia de orden

        if (!reference) {
            return NextResponse.json({ received: true });
        }

        // 2. Buscar la orden por referencia
        const order = await prisma.order.findUnique({
            where:   { reference },
            include: { payment: true, product: true, user: { select: { email: true } } },
        });

        if (!order) {
            console.error("[WEBHOOK] Orden no encontrada:", reference);
            return NextResponse.json({ received: true });
        }

        // 3. Actualizar según el estado de MercadoPago
        if (status === "approved") {
            await handleApprovedPayment(order, mpPayload, String(paymentId));
        } else if (status === "rejected") {
            await handleRejectedPayment(order, mpPayload, String(paymentId));
        } else if (status === "pending" || status === "in_process") {
            await handlePendingPayment(order, String(paymentId));
        }

        // MercadoPago necesita siempre 200
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error: unknown) {
        console.error("[WEBHOOK_ERROR]", error);
        // Siempre 200 para que MP no reintente indefinidamente
        return NextResponse.json({ received: true }, { status: 200 });
    }
}

// Pago aprobado

async function handleApprovedPayment(order: OrderWithProduct, mpData: MercadoPagoPayment, paymentId: string) {
    // Actualizar el pago
    await prisma.payment.update({
        where: { orderId: order.id },
        data: {
            status:             "APPROVED",
            mpTransactionId:    String(paymentId),        // ID de MercadoPago
            mpResponse:         JSON.parse(JSON.stringify(mpData)),
            paidAt:             new Date(),
        },
    });

    // Actualizar la orden
    await prisma.order.update({
        where: { id: order.id },
        data:  { status: "PAID" },
    });

    // Crear la suscripción anual
    const startDate = new Date();
    const endDate   = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // +1 año

    await prisma.subscription.upsert({
        where: { orderId: order.id },
        update: {
            status: "ACTIVE",
            startDate,
            endDate,
            autoRenew: true,
        },
        create: {
            userId:     order.userId,
            orderId:    order.id,
            productId:  order.productId,
            status:     "ACTIVE",
            startDate,
            endDate,
            autoRenew:  true,
        },
    });

    try {
        const buyerEmail = order.user?.email ?? process.env.EMAIL_TO ?? "emma122120063a@gmail.com";
        await sendOrderConfirmationEmail({
            to: buyerEmail,
            from: process.env.EMAIL_FROM ?? "emma122120063a@gmail.com",
            orderId: order.id,
            userId: order.userId,
            reference: order.reference,
            productName: order.product?.name ?? "Horus Braslet",
            productType: order.product?.productType ?? "BRACELET",
            totalAmount: Number(order.totalAmount),
            currency: order.currency,
            createdAt: order.createdAt,
            shipping: {
                fullName:     order.shippingFullName,
                phone:        order.shippingPhone,
                street:       order.shippingStreet,
                neighborhood: order.shippingNeighborhood,
                city:         order.shippingCity,
                department:   order.shippingDepartment,
                zip:          order.shippingZip,
                instructions: order.shippingInstructions,
            },
        });
    } catch (error) {
        console.error("[EMAIL_ERROR]", error);
    }

    console.log(`[WEBHOOK] Pago aprobado — Orden: ${order.reference} | Usuario: ${order.userId}`);
}

// Pago rechazado

async function handleRejectedPayment(order: OrderWithProduct, mpData: MercadoPagoPayment, paymentId: string) {
    await prisma.payment.update({
        where: { orderId: order.id },
        data: {
            status:             "DECLINED",
            mpTransactionId:    paymentId,
            mpResponse:         JSON.parse(JSON.stringify(mpData)),
        },
    });

    await prisma.order.update({
        where: { id: order.id },
        data:  { status: "CANCELLED" },
    });

    console.log(`[WEBHOOK] Pago rechazado — Orden: ${order.reference}`);
}

// Pago pendiente

async function handlePendingPayment(order: OrderWithProduct, paymentId: string) {
    await prisma.payment.update({
        where: { orderId: order.id },
        data: {
            status:             "PENDING",
            mpTransactionId:    paymentId,
        },
    });

    await prisma.order.update({
        where: { id: order.id },
        data:  { status: "PAYMENT_PENDING" },
    });

    console.log(`[WEBHOOK] Pago pendiente — Orden: ${order.reference}`);
}