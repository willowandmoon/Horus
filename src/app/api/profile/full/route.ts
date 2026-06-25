import { NextResponse } from "next/server";
import { getAuthCookies } from "@/src/shared/lib/cookie.lib";
import { verifyAccessToken } from "@/src/shared/lib/jwt.lib";
import { prisma } from "@/src/infrastructure/database/prisma/client";

async function getUserId(): Promise<string | null> {
    const { accessToken } = await getAuthCookies();
    if (!accessToken) return null;
    try { return verifyAccessToken(accessToken).sub; } catch { return null; }
}

export async function GET() {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Tu sesión ha expirado o no has iniciado sesión. Por favor, vuelve a ingresar." }, { status: 401 });

    const [personalInfo, privacySettings] = await Promise.all([
        prisma.personalInformation.findUnique({
            where: { userId },
            select: { firstName: true, lastName: true, dateOfBirth: true, bloodType: true, photoUrl: true },
        }),
        prisma.privacySettings.findUnique({
            where: { userId },
            select: {
                showBloodType: true, showAllergies: true, showMedications: true,
                showChronicConditions: true, showEmergencyContacts: true, showMedicalHistory: true,
            },
        }),
    ]);

    return NextResponse.json({ personalInfo, privacySettings });
}
