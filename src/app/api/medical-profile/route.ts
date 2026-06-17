import { NextResponse } from "next/server";
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
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    try {
        const [allergies, chronicConditions, medications, medicalHistory] = await Promise.all([
            prisma.allergy.findMany({
                where: { userId },
                orderBy: { allergenName: "asc" },
            }),
            prisma.chronicCondition.findMany({
                where: { userId },
                orderBy: { conditionName: "asc" },
            }),
            prisma.userMedication.findMany({
                where: { userId },
                include: { medication: true },
                orderBy: { createdAt: "desc" },
            }),
            prisma.medicalHistory.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return NextResponse.json({
            allergies,
            chronicConditions,
            medications: medications.map((m) => ({
                id: m.id,
                name: m.customMedicationName || m.medication?.genericName || "Medicamento",
                dosage: m.dosage,
                frequency: m.frequency,
                route: m.route,
                purpose: m.purpose,
                isCurrent: m.isCurrent,
            })),
            medicalHistory,
        });
    } catch (error) {
        console.error("Error fetching medical profile:", error);
        return NextResponse.json({ error: "Error al obtener perfil médico" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    try {
        const body = await request.json();
        const { type, data } = body;

        if (!type || !data) {
            return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
        }

        const now = new Date(Date.now() - 5 * 60 * 60 * 1000); // Colombia timezone

        if (type === "allergy") {
            const newItem = await prisma.allergy.create({
                data: {
                    userId,
                    allergenName: data.allergenName,
                    allergyType: data.allergyType || "OTHER",
                    severity: data.severity || "MILD",
                    reactionDescription: data.reactionDescription || null,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                }
            });
            return NextResponse.json(newItem, { status: 201 });
        } else if (type === "condition") {
            const newItem = await prisma.chronicCondition.create({
                data: {
                    userId,
                    conditionName: data.conditionName,
                    severity: data.severity || null,
                    status: data.status || "ACTIVE",
                    notes: data.notes || null,
                    createdAt: now,
                    updatedAt: now,
                }
            });
            return NextResponse.json(newItem, { status: 201 });
        } else if (type === "medication") {
            const newItem = await prisma.userMedication.create({
                data: {
                    userId,
                    customMedicationName: data.customMedicationName,
                    dosage: data.dosage || null,
                    frequency: data.frequency || null,
                    route: data.route || "ORAL",
                    purpose: data.purpose || null,
                    isCurrent: data.isCurrent !== undefined ? data.isCurrent : true,
                    createdAt: now,
                    updatedAt: now,
                }
            });
            return NextResponse.json(newItem, { status: 201 });
        } else if (type === "history") {
            const newItem = await prisma.medicalHistory.create({
                data: {
                    userId,
                    eventName: data.eventName,
                    eventType: data.eventType || "OTHER",
                    location: data.location || null,
                    outcome: data.outcome || null,
                    createdAt: now,
                    updatedAt: now,
                }
            });
            return NextResponse.json(newItem, { status: 201 });
        } else {
            return NextResponse.json({ error: "Tipo de registro no válido" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error creating medical record:", error);
        return NextResponse.json({ error: "Error al guardar registro médico" }, { status: 500 });
    }
}

