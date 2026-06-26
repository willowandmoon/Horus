import { NextRequest, NextResponse } from "next/server";
import { mp }     from "@/src/infrastructure/payments/mercadopago.client";
import { prisma } from "@/src/infrastructure/database/prisma/client";
import { sendOrderConfirmationEmail } from "@/src/infrastructure/email/order-confirmation";

export const runtime = "nodejs";

interface MercadoPagoPayment {
    id?: string | number;
    status?: string;
    external_reference?: string | null;
    [key: string]: unknown;
}

/**
 * POST /api/payments/sync
 * Body: { orderId, mpPaymentId }
 *
 * Llamado desde la success/pending page para sincronizar el estado del pago con MP.
 * Necesario en sandbox (localhost) donde MP no puede enviar el webhook.
 */
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ success: false, message: "No autenticado" }, { status: 401 });
        }

        const body = await request.json() as { orderId?: string; mpPaymentId?: string | number };
        const { orderId, mpPaymentId } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, message: "orderId requerido" }, { status: 400 });
        }

        // Buscar la orden con relaciones
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                payment: true,
                product: true,
                user: { select: { email: true } },
            },
        });

        if (!order || order.userId !== userId) {
            return NextResponse.json({ success: false, message: "Orden no encontrada" }, { status: 404 });
        }

        // Si ya está pagada, no hacer nada
        if (order.status === "PAID") {
            return NextResponse.json({ success: true, status: "PAID", alreadySynced: true });
        }

        // Determinar qué ID de MP usar: el del body (de la URL de redirect) o el guardado en DB
        const paymentIdToSync = mpPaymentId ?? order.payment?.mpTransactionId;

        if (!paymentIdToSync) {
            return NextResponse.json({
                success: true,
                status: order.status,
                message: "Sin ID de pago MP para sincronizar",
            });
        }

        // Consultar pago en MP
        let mpData: MercadoPagoPayment;
        try {
            const mpResult = await mp.payment.get({ id: paymentIdToSync });
            mpData = ((mpResult as { response?: unknown })?.response ?? mpResult) as MercadoPagoPayment;
        } catch (err) {
            console.error("[SYNC] Error consultando MP:", err);
            return NextResponse.json({ success: true, status: order.status });
        }

        const mpStatus = mpData.status;

        if (mpStatus === "approved") {
            // Actualizar pago
            await prisma.payment.update({
                where: { orderId: order.id },
                data: {
                    status:          "APPROVED",
                    mpTransactionId: String(paymentIdToSync),
                    mpResponse:      JSON.parse(JSON.stringify(mpData)),
                    paidAt:          new Date(),
                },
            });

            // Actualizar orden
            await prisma.order.update({
                where: { id: order.id },
                data:  { status: "PAID" },
            });

            // Crear suscripción anual
            const startDate = new Date();
            const endDate   = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);

            await prisma.subscription.upsert({
                where:  { orderId: order.id },
                update: { status: "ACTIVE", startDate, endDate, autoRenew: true },
                create: {
                    userId:    order.userId,
                    orderId:   order.id,
                    productId: order.productId,
                    status:    "ACTIVE",
                    startDate,
                    endDate,
                    autoRenew: true,
                },
            });

            // Enviar email al comprador
            try {
                const buyerEmail = order.user?.email ?? process.env.EMAIL_TO ?? "";
                await sendOrderConfirmationEmail({
                    to:          buyerEmail,
                    from:        process.env.EMAIL_FROM ?? "",
                    orderId:     order.id,
                    userId:      order.userId,
                    reference:   order.reference,
                    productName: order.product?.name ?? "Horus",
                    productType: order.product?.productType ?? "BRACELET",
                    totalAmount: Number(order.totalAmount),
                    currency:    order.currency,
                    createdAt:   order.createdAt,
                    shipping: {
                        street:     order.shippingStreet,
                        city:       order.shippingCity,
                        department: order.shippingDepartment,
                        zip:        order.shippingZip,
                    },
                });
            } catch (emailErr) {
                console.error("[SYNC EMAIL_ERROR]", emailErr);
            }

            console.log(`[SYNC] Pago aprobado sincronizado — Orden: ${order.reference}`);
            return NextResponse.json({ success: true, status: "PAID" });

        } else if (mpStatus === "rejected") {
            await prisma.payment.update({
                where: { orderId: order.id },
                data: {
                    status:          "DECLINED",
                    mpTransactionId: String(paymentIdToSync),
                    mpResponse:      JSON.parse(JSON.stringify(mpData)),
                },
            });
            await prisma.order.update({
                where: { id: order.id },
                data:  { status: "CANCELLED" },
            });
            return NextResponse.json({ success: true, status: "CANCELLED" });

        } else {
            // pending / in_process
            if (order.payment && !order.payment.mpTransactionId) {
                await prisma.payment.update({
                    where: { orderId: order.id },
                    data:  { mpTransactionId: String(paymentIdToSync) },
                });
            }
            await prisma.order.update({
                where: { id: order.id },
                data:  { status: "PAYMENT_PENDING" },
            });
            return NextResponse.json({ success: true, status: "PAYMENT_PENDING" });
        }

    } catch (error) {
        console.error("[SYNC_ERROR]", error);
        return NextResponse.json({ success: false, message: "Error al sincronizar" }, { status: 500 });
    }
}
