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

// PATCH /api/medical-profile/[id]  body: { type, data }
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const { type, data } = await req.json();

    try {
        if (type === "allergy") {
            const item = await prisma.allergy.findUnique({ where: { id } });
            if (!item || item.userId !== userId) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
            const updated = await prisma.allergy.update({
                where: { id },
                data: {
                    allergenName: data.allergenName,
                    allergyType: data.allergyType,
                    severity: data.severity,
                    reactionDescription: data.reactionDescription ?? null,
                    isActive: data.isActive ?? item.isActive,
                },
            });
            return NextResponse.json(updated);
        }
        if (type === "condition") {
            const item = await prisma.chronicCondition.findUnique({ where: { id } });
            if (!item || item.userId !== userId) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
            const updated = await prisma.chronicCondition.update({
                where: { id },
                data: {
                    conditionName: data.conditionName,
                    severity: data.severity ?? null,
                    status: data.status,
                    notes: data.notes ?? null,
                },
            });
            return NextResponse.json(updated);
        }
        if (type === "medication") {
            const item = await prisma.userMedication.findUnique({ where: { id } });
            if (!item || item.userId !== userId) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
            const updated = await prisma.userMedication.update({
                where: { id },
                data: {
                    customMedicationName: data.name,
                    dosage: data.dosage ?? null,
                    frequency: data.frequency ?? null,
                    isCurrent: data.isCurrent ?? item.isCurrent,
                },
            });
            return NextResponse.json({ id: updated.id, name: updated.customMedicationName, dosage: updated.dosage, frequency: updated.frequency, isCurrent: updated.isCurrent });
        }
        return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
    } catch (err) {
        console.error("[medical-profile PATCH]", err);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

// DELETE /api/medical-profile/[id]?type=allergy|condition|medication
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const type = req.nextUrl.searchParams.get("type");

    try {
        if (type === "allergy") {
            const item = await prisma.allergy.findUnique({ where: { id } });
            if (!item || item.userId !== userId) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
            await prisma.allergy.delete({ where: { id } });
            return NextResponse.json({ ok: true });
        }
        if (type === "condition") {
            const item = await prisma.chronicCondition.findUnique({ where: { id } });
            if (!item || item.userId !== userId) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
            await prisma.chronicCondition.delete({ where: { id } });
            return NextResponse.json({ ok: true });
        }
        if (type === "medication") {
            const item = await prisma.userMedication.findUnique({ where: { id } });
            if (!item || item.userId !== userId) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
            await prisma.userMedication.delete({ where: { id } });
            return NextResponse.json({ ok: true });
        }
        return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
    } catch (err) {
        console.error("[medical-profile DELETE]", err);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
