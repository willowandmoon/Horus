import { NextResponse } from "next/server";
import { getAuthCookies } from "@/src/shared/lib/cookie.lib";
import { verifyAccessToken } from "@/src/shared/lib/jwt.lib";
import { prisma } from "@/src/infrastructure/database/prisma/client";

async function getUserId(): Promise<string | null> {
    const { accessToken } = await getAuthCookies();
    if (!accessToken) return null;
    try { return verifyAccessToken(accessToken).sub; } catch { return null; }
}

const ALLOWED_FIELDS = [
    "showBloodType", "showAllergies", "showMedications",
    "showChronicConditions", "showEmergencyContacts", "showMedicalHistory",
] as const;

export async function PUT(req: Request) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json() as Record<string, unknown>;
    const update: Partial<Record<typeof ALLOWED_FIELDS[number], boolean>> = {};
    for (const field of ALLOWED_FIELDS) {
        if (field in body && typeof body[field] === "boolean") {
            update[field] = body[field] as boolean;
        }
    }

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: "Sin campos válidos" }, { status: 400 });
    }

    await prisma.privacySettings.upsert({
        where: { userId },
        create: { userId, ...update },
        update,
    });

    return NextResponse.json({ ok: true });
}
