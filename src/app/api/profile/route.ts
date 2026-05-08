import { NextResponse } from "next/server";
import { getAuthCookies } from "@/src/shared/lib/cookie.lib";
import { verifyAccessToken } from "@/src/shared/lib/jwt.lib";
import { prisma } from "@/src/infrastructure/database/prisma/client";
import fs from "fs/promises";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

async function readDb() {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as {
        contacts: unknown[];
        profileExtras: Record<string, { phone: string; location: string }>;
    };
}

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
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
                },
            },
        },
    });

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const db = await readDb();
    const extras = db.profileExtras?.[userId] ?? { phone: "", location: "" };

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
        phone: extras.phone,
        location: extras.location,
    });
}

export async function PUT(req: Request) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
        },
        update: {
            ...(body.firstName !== undefined && { firstName: body.firstName }),
            ...(body.lastName !== undefined && { lastName: body.lastName }),
            ...(body.dateOfBirth !== undefined && { dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null }),
            ...(body.gender !== undefined && { gender: body.gender as never }),
            ...(body.bloodType !== undefined && { bloodType: body.bloodType as never }),
            ...(body.identificationNumber !== undefined && { identificationNumber: body.identificationNumber }),
            ...(body.identificationType !== undefined && { identificationType: body.identificationType }),
        },
    });

    const db = await readDb();
    db.profileExtras ??= {};
    db.profileExtras[userId] = {
        phone: body.phone ?? db.profileExtras[userId]?.phone ?? "",
        location: body.location ?? db.profileExtras[userId]?.location ?? "",
    };
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));

    return NextResponse.json({ message: "Perfil actualizado" });
}
