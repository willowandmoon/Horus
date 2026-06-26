import { NextRequest, NextResponse } from "next/server";
import { z }                         from "zod";
import { AppError }                  from "@/src/shared/errors/app.error";
import { createOrderService }        from "./service";

const createOrderSchema = z.object({
    productId: z.string().uuid("Producto inválido"),
    shippingAddress: z.object({
        fullName:     z.string().optional(),
        phone:        z.string().optional(),
        street:       z.string().min(1, "Dirección requerida"),
        neighborhood: z.string().optional(),
        city:         z.string().min(1, "Ciudad requerida"),
        department:   z.string().min(1, "Departamento requerido"),
        zip:          z.string().optional(),
        instructions: z.string().optional(),
    }),
    customization: z.object({
        braceletColor: z.string().optional(),
        cardFrontUrl:  z.string().url().optional(),
        cardBackUrl:   z.string().url().optional(),
    }).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body       = await request.json() as unknown;
        const validation = createOrderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: "Datos inválidos", errors: validation.error.flatten().fieldErrors },
                { status: 422 }
            );
        }

        const { productId, shippingAddress, customization } = validation.data;

        const userId    = request.headers.get("x-user-id");
        const userEmail = request.headers.get("x-user-email");

        if (!userId || !userEmail)
            return NextResponse.json({ success: false, message: "No autenticado" }, { status: 401 });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

        const result = await createOrderService({
            productId, userId, userEmail, appUrl, shippingAddress, customization,
        });

        return NextResponse.json({ success: true, data: result }, { status: 201 });

    } catch (error: unknown) {
        if (error instanceof AppError)
            return NextResponse.json(
                { success: false, message: error.message, code: error.code },
                { status: error.statusCode }
            );
        console.error("[CREATE_ORDER_ERROR]", error);
        return NextResponse.json({ success: false, message: "Error al crear la orden" }, { status: 500 });
    }
}
