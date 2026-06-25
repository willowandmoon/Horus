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

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Tu sesión ha expirado o no has iniciado sesión. Por favor, vuelve a ingresar." }, { status: 401 });

    try {
        const { id } = await params;
        const { name, relation, phone } = await req.json();

        const existing = await prisma.emergencyContact.findUnique({
            where: { id },
        });

        if (!existing || existing.userId !== userId) {
            return NextResponse.json({ error: "El contacto no fue encontrado o no tienes permiso para acceder a él." }, { status: 404 });
        }

        const updated = await prisma.emergencyContact.update({
            where: { id },
            data: {
                fullName: name.trim(),
                relationship: relation?.trim() ?? "",
                phonePrimary: phone.trim(),
            },
        });

        return NextResponse.json({
            id: updated.id,
            name: updated.fullName,
            relation: updated.relationship,
            phone: updated.phonePrimary,
        });
    } catch (error) {
        console.error("Error updating contact:", error);
        return NextResponse.json({ error: "Error al actualizar contacto" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Tu sesión ha expirado o no has iniciado sesión. Por favor, vuelve a ingresar." }, { status: 401 });

    try {
        const { id } = await params;

        const existing = await prisma.emergencyContact.findUnique({
            where: { id },
        });

        if (!existing || existing.userId !== userId) {
            return NextResponse.json({ error: "El contacto no fue encontrado o no tienes permiso para acceder a él." }, { status: 404 });
        }

        await prisma.emergencyContact.delete({
            where: { id },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting contact:", error);
        return NextResponse.json({ error: "Error al eliminar contacto" }, { status: 500 });
    }
}
