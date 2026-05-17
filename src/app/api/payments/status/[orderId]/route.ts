import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/src/infrastructure/database/prisma/client";

export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "No autenticado" },
                { status: 401 }
            );
        }

        const order = await prisma.order.findUnique({
            where: { id: params.orderId },
            select: {
                id:          true,
                reference:   true,
                status:      true,
                totalAmount: true,
                currency:    true,
                createdAt:   true,
                userId:      true,
                product: {
                    select: { name: true, productType: true },
                },
                payment: {
                    select: {
                        status:  true,
                        paidAt:  true,
                    },
                },
                subscription: {
                    select: {
                        status:    true,
                        startDate: true,
                        endDate:   true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { success: false, message: "Orden no encontrada" },
                { status: 404 }
            );
        }

        // Verificar que la orden pertenece al usuario
        if (order.userId !== userId) {
            return NextResponse.json(
                { success: false, message: "Sin permisos para ver esta orden" },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { success: true, data: order },
            { status: 200 }
        );

    } catch (error) {
        console.error("[ORDER_STATUS_ERROR]", error);
        return NextResponse.json(
            { success: false, message: "Error consultando la orden" },
            { status: 500 }
        );
    }
}