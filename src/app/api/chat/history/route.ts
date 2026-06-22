import { NextRequest, NextResponse } from "next/server";
import { getAuthCookies } from "@/src/shared/lib/cookie.lib";
import { verifyAccessToken } from "@/src/shared/lib/jwt.lib";

const AI_URL    = process.env.HORUS_AI_URL    ?? "http://localhost:3001";
const AI_SECRET = process.env.HORUS_AI_SECRET ?? "";

export async function GET(req: NextRequest) {
    try {
        // Get userId from JWT cookie
        const { accessToken } = await getAuthCookies();
        if (!accessToken) return NextResponse.json({ logs: [] }, { status: 401 });
        const { sub: userId } = verifyAccessToken(accessToken);

        const res = await fetch(`${AI_URL}/chat/history?userId=${encodeURIComponent(userId)}`, {
            headers: { "Authorization": `Bearer ${AI_SECRET}` },
            cache: "no-store",
        });
        if (!res.ok) return NextResponse.json({ logs: [] }, { status: 502 });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e) {
        console.error("chat/history proxy error:", e);
        return NextResponse.json({ logs: [] }, { status: 500 });
    }
}
