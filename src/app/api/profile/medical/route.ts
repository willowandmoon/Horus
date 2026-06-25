import { NextRequest, NextResponse } from "next/server";
import { getAuthCookies } from "@/src/shared/lib/cookie.lib";
import { verifyAccessToken } from "@/src/shared/lib/jwt.lib";
import { prisma } from "@/src/infrastructure/database/prisma/client";

export const dynamic = "force-dynamic";

async function getSessionUserId(): Promise<string | null> {
    const { accessToken } = await getAuthCookies();
    if (!accessToken) return null;
    try { return verifyAccessToken(accessToken).sub; }
    catch { return null; }
}

export async function GET() {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Tu sesión ha expirado o no has iniciado sesión. Por favor, vuelve a ingresar." }, { status: 401 });

    const mp = await prisma.medicalProfile.findUnique({ where: { userId } });
    return NextResponse.json({
        heightCm:          mp?.heightCm != null ? Number(mp.heightCm) : null,
        weightKg:          mp?.weightKg != null ? Number(mp.weightKg) : null,
        organDonor:        mp?.organDonor ?? false,
        insuranceProvider: mp?.insuranceProvider ?? null,
    });
}

export async function PUT(req: NextRequest) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Tu sesión ha expirado o no has iniciado sesión. Por favor, vuelve a ingresar." }, { status: 401 });

    const { heightCm, weightKg, organDonor, insuranceProvider } = await req.json();

    await prisma.medicalProfile.upsert({
        where: { userId },
        create: {
            userId,
            heightCm:          heightCm   ? Number(heightCm)   : null,
            weightKg:          weightKg   ? Number(weightKg)   : null,
            organDonor:        organDonor ?? false,
            insuranceProvider: insuranceProvider?.trim() || null,
        },
        update: {
            ...(heightCm          !== undefined && { heightCm:          heightCm   ? Number(heightCm)   : null }),
            ...(weightKg          !== undefined && { weightKg:          weightKg   ? Number(weightKg)   : null }),
            ...(organDonor        !== undefined && { organDonor }),
            ...(insuranceProvider !== undefined && { insuranceProvider: insuranceProvider?.trim() || null }),
        },
    });

    return NextResponse.json({ ok: true });
}
