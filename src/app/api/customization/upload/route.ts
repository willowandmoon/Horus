import { NextRequest, NextResponse } from "next/server";
import { uploadOrderImage } from "@/src/infrastructure/cloudinary/cloudinary";
import { prisma } from "@/src/infrastructure/database/prisma/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const fileEntry = formData.get("file");
        const orderId   = formData.get("orderId") as string | null;
        const side      = formData.get("side");

        if (!fileEntry || typeof fileEntry === "string")
            return NextResponse.json({ error: "file requerido (form-data)" }, { status: 400 });
        if (!orderId)
            return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
        if (side !== "front" && side !== "back")
            return NextResponse.json({ error: "side debe ser 'front' o 'back'" }, { status: 400 });

        const file   = fileEntry as File;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload a horus/orders/{orderId}/{side}
        const result = await uploadOrderImage(buffer, orderId, side);

        // Update the order in DB with the URL
        const field = side === "front" ? "cardFrontUrl" : "cardBackUrl";
        await prisma.order.update({
            where: { id: orderId },
            data: { [field]: result.secure_url },
        });

        return NextResponse.json(
            { url: result.secure_url, publicId: result.public_id },
            { status: 200 }
        );
    } catch (err) {
        console.error("[CUSTOMIZATION_UPLOAD_ERROR]", err);
        return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
    }
}
