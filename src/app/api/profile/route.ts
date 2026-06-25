import { NextResponse } from "next/server";
import { getAuthCookies } from "@/src/shared/lib/cookie.lib";
import { verifyAccessToken } from "@/src/shared/lib/jwt.lib";
import { prisma } from "@/src/infrastructure/database/prisma/client";

async function getSessionUserId(): Promise<string | null> {
    const { accessToken } = await getAuthCookies();
    if (!accessToken) return null;
    try {
        return verifyAccessToken(accessToken).sub;
    } catch {
        return null;
    }
}

export async function GET() {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Tu sesión ha expirado o no has iniciado sesión. Por favor, vuelve a ingresar." }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            nfcTagId: true,
            createdAt: true,
            personalInfo: {
                select: {
                    firstName: true,
                    lastName: true,
                    dateOfBirth: true,
                    gender: true,
                    bloodType: true,
                    identificationNumber: true,
                    identificationType: true,
                    photoUrl: true,
                    phone: true,
                    location: true,
                },
            },
        },
    });

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({
        id: user.id,
        email: user.email,
        nfcTagId: user.nfcTagId,
        createdAt: user.createdAt,
        firstName: user.personalInfo?.firstName ?? "",
        lastName: user.personalInfo?.lastName ?? "",
        dateOfBirth: user.personalInfo?.dateOfBirth ?? null,
        gender: user.personalInfo?.gender ?? null,
        bloodType: user.personalInfo?.bloodType ?? null,
        identificationNumber: user.personalInfo?.identificationNumber ?? null,
        identificationType: user.personalInfo?.identificationType ?? null,
        photoUrl: user.personalInfo?.photoUrl ?? null,
        phone: user.personalInfo?.phone ?? "",
        location: user.personalInfo?.location ?? "",
    });
}

export async function PUT(req: Request) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Tu sesión ha expirado o no has iniciado sesión. Por favor, vuelve a ingresar." }, { status: 401 });

    const body = await req.json() as {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string | null;
        gender?: string | null;
        bloodType?: string | null;
        identificationNumber?: string | null;
        identificationType?: string | null;
        phone?: string;
        location?: string;
    };

    try {
        await prisma.personalInformation.upsert({
            where: { userId },
            create: {
                userId,
                firstName: body.firstName ?? "",
                lastName: body.lastName ?? "",
                ...(body.dateOfBirth !== undefined && { dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null }),
                ...(body.gender !== undefined && { gender: body.gender as never }),
                ...(body.bloodType !== undefined && { bloodType: body.bloodType as never }),
                ...(body.identificationNumber !== undefined && { identificationNumber: body.identificationNumber }),
                ...(body.identificationType !== undefined && { identificationType: body.identificationType }),
                phone: body.phone ?? "",
                location: body.location ?? "",
            },
            update: {
                ...(body.firstName !== undefined && { firstName: body.firstName }),
                ...(body.lastName !== undefined && { lastName: body.lastName }),
                ...(body.dateOfBirth !== undefined && { dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null }),
                ...(body.gender !== undefined && { gender: body.gender as never }),
                ...(body.bloodType !== undefined && { bloodType: body.bloodType as never }),
                ...(body.identificationNumber !== undefined && { identificationNumber: body.identificationNumber }),
                ...(body.identificationType !== undefined && { identificationType: body.identificationType }),
                ...(body.phone !== undefined && { phone: body.phone }),
                ...(body.location !== undefined && { location: body.location }),
            },
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "El número de identificación ingresado ya se encuentra registrado." },
                { status: 409 }
            );
        }
        console.error("Error al actualizar perfil:", error);
        return NextResponse.json({ error: "Ocurrió un error al actualizar el perfil" }, { status: 500 });
    }

    return NextResponse.json({ message: "Perfil actualizado" });
}
