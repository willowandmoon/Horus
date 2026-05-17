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

        const { productId } = validation.data;

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

        // 5. Crear referencia única para la orden
        const reference = `horus-${userId.slice(0, 8)}-${Date.now()}`;

        // 6. Crear la orden en BD
        const order: Order = await prisma.order.create({
            data: {
                userId,
                productId,
                reference,
                status:          "PENDING",
                totalAmount:     product.price,
                currency:        "COP"
            },
        });

        // 7. Crear preferencia de pago en MercadoPago
        const preference: { id?: string; init_point?: string; sandbox_init_point?: string } = await mp.preferences.create({
            body: {
                external_reference: reference,         // referencia para el webhook
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
                    success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${order.id}`,
                    failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure?orderId=${order.id}`,
                    pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending?orderId=${order.id}`,
                },
                auto_return:        "approved",
                notification_url:   `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
                statement_descriptor: "HORUS BRACELET",
            },
        });

        // 8. Crear registro de pago en BD
        await prisma.payment.create({
            data: {
                orderId:       order.id,
                userId,
                paymentMethod: "CARD",
                status:        "PENDING",
                amount:        product.price,
                currency:      "COP",
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