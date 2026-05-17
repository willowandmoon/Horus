import { NextRequest, NextResponse } from "next/server";
import { mp }                        from "@/src/infrastructure/payments/mercadopago.client";
import { prisma }                    from "@/src/infrastructure/database/prisma/client";
import type { Order } from "@/generated/prisma/client";

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
        const mpData    = mpPayment as unknown as MercadoPagoPayment;

        const status    = mpData.status;           // approved, rejected, pending
        const reference = mpData.external_reference; // nuestra referencia de orden

        if (!reference) {
            return NextResponse.json({ received: true });
        }

        // 2. Buscar la orden por referencia
        const order = await prisma.order.findUnique({
            where:   { reference },
            include: { payment: true, product: true },
        });

        if (!order) {
            console.error("[WEBHOOK] Orden no encontrada:", reference);
            return NextResponse.json({ received: true });
        }

        // 3. Actualizar según el estado de MercadoPago
        if (status === "approved") {
            await handleApprovedPayment(order, mpData, String(paymentId));
        } else if (status === "rejected") {
            await handleRejectedPayment(order, mpData, String(paymentId));
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

async function handleApprovedPayment(order: Order, mpData: MercadoPagoPayment, paymentId: string) {
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

    await prisma.subscription.create({
        data: {
            userId:     order.userId,
            orderId:    order.id,
            productId:  order.productId,
            status:     "ACTIVE",
            startDate,
            endDate,
            autoRenew:  true,
        },
    });

    console.log(`[WEBHOOK] Pago aprobado — Orden: ${order.reference} | Usuario: ${order.userId}`);

    // Aquí puedes agregar:
    // → Enviar email de confirmación
    // → Generar orden de envío física
    // → Activar perfil médico completo
}

// Pago rechazado

async function handleRejectedPayment(order: Order, mpData: MercadoPagoPayment, paymentId: string) {
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

async function handlePendingPayment(order: Order, paymentId: string) {
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