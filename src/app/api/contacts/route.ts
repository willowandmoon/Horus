import { NextRequest, NextResponse } from "next/server";
import { getAuthCookies } from "@/src/shared/lib/cookie.lib";
import { verifyAccessToken } from "@/src/shared/lib/jwt.lib";
import { prisma } from "@/src/infrastructure/database/prisma/client";

export const dynamic = "force-dynamic";

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

    try {
        const contacts = await prisma.emergencyContact.findMany({
            where: { userId, isActive: true },
            orderBy: { priorityOrder: "asc" },
        });

        const mapped = contacts.map((c) => ({
            id: c.id,
            name: c.fullName,
            relation: c.relationship,
            phone: c.phonePrimary,
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json({ error: "Error al obtener contactos" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Tu sesión ha expirado o no has iniciado sesión. Por favor, vuelve a ingresar." }, { status: 401 });

    try {
        const { name, relation, phone } = await req.json();
        if (!name?.trim() || !phone?.trim()) {
            return NextResponse.json({ error: "Nombre y teléfono son requeridos" }, { status: 400 });
        }

        const lastContact = await prisma.emergencyContact.findFirst({
            where: { userId },
            orderBy: { priorityOrder: "desc" },
        });
        const nextPriority = lastContact ? lastContact.priorityOrder + 1 : 1;

        const contact = await prisma.emergencyContact.create({
            data: {
                userId,
                fullName: name.trim(),
                relationship: relation?.trim() ?? "",
                phonePrimary: phone.trim(),
                priorityOrder: nextPriority,
            },
        });

        return NextResponse.json({
            id: contact.id,
            name: contact.fullName,
            relation: contact.relationship,
            phone: contact.phonePrimary,
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating contact:", error);
        return NextResponse.json({ error: "Error al crear contacto" }, { status: 500 });
    }
}
