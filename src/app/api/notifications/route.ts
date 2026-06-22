import { NextResponse } from "next/server";
import { getAuthCookies } from "@/src/shared/lib/cookie.lib";
import { verifyAccessToken } from "@/src/shared/lib/jwt.lib";
import { db } from "@/src/infrastructure/database/firebase";

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
    if (!userId) return NextResponse.json({ notifications: [] }, { status: 401 });

    try {
        const snap = await db
            .collection("notifications")
            .doc(userId)
            .collection("items")
            .orderBy("timestamp", "desc")
            .limit(10)
            .get();

        const notifications = snap.docs.map(d => {
            const data = d.data();
            // Convert Firestore Timestamp to ISO string
            const ts = data.timestamp;
            const timestamp = ts?.toDate?.()?.toISOString?.() ?? ts ?? null;
            return {
                id:        d.id,
                title:     data.title    ?? "",
                body:      data.body     ?? "",
                type:      data.type     ?? "info",
                read:      data.read     ?? false,
                timestamp,
            };
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("notifications route error:", error);
        return NextResponse.json({ notifications: [] });
    }
}

// Mark a notification as read
export async function PATCH(req: Request) {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    try {
        const { id } = await req.json() as { id: string };
        await db
            .collection("notifications")
            .doc(userId)
            .collection("items")
            .doc(id)
            .update({ read: true });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false });
    }
}
