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
    if (!userId) return NextResponse.json({ devices: [], sessions: [] }, { status: 401 });

    const [allDevices, sessions] = await Promise.all([
        prisma.userDevice.findMany({
            where: { userId },
            select: { id: true, type: true, identifier: true, registeredAt: true },
            orderBy: { registeredAt: "desc" },
        }),
        prisma.deviceSession.findMany({
            where: { userId, isActive: true },
            select: { id: true, deviceName: true, deviceModel: true, osVersion: true, lastActive: true },
            orderBy: { lastActive: "desc" },
            take: 1,
        }),
    ]);

    // Keep only the latest device per type; delete older duplicates from DB
    const seen = new Set<string>();
    const userDevices: typeof allDevices = [];
    const toDelete: string[] = [];
    for (const d of allDevices) {
        if (!seen.has(d.type)) { seen.add(d.type); userDevices.push(d); }
        else toDelete.push(d.id);
    }
    if (toDelete.length > 0) {
        await prisma.userDevice.deleteMany({ where: { id: { in: toDelete } } });
    }

    return NextResponse.json({ userDevices, sessions });
}
