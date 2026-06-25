import { NextRequest, NextResponse } from "next/server";
import { getAuthCookies } from "@/src/shared/lib/cookie.lib";
import { verifyAccessToken } from "@/src/shared/lib/jwt.lib";
import { prisma } from "@/src/infrastructure/database/prisma/client";
import fs from "fs/promises";
import path from "path";

async function getSessionUserId(): Promise<string | null> {
    const { accessToken } = await getAuthCookies();
    if (!accessToken) return null;
    try {
        return verifyAccessToken(accessToken).sub;
    } catch {
        return null;
    }
}

const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export async function POST(req: NextRequest) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Tu sesión ha expirado o no has iniciado sesión. Por favor, vuelve a ingresar." }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("photo") as File | null;

    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }

    const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const ext = ALLOWED_EXTS.has(rawExt) ? rawExt : "jpg";
    const filename = `${userId}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    await fs.mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    // Cachebuster para forzar recarga en el cliente cuando el nombre del archivo no cambia
    const photoUrl = `/uploads/profiles/${filename}?v=${Date.now()}`;

    await prisma.personalInformation.update({
        where: { userId },
        data: { photoUrl },
    });

    return NextResponse.json({ photoUrl });
}
