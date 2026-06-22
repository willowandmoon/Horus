import { NextRequest, NextResponse } from "next/server";

const AI_URL    = process.env.HORUS_AI_URL    ?? "http://localhost:3001";
const AI_SECRET = process.env.HORUS_AI_SECRET ?? "";

export async function POST(req: NextRequest) {
    try {
        const { sessionId } = await req.json();
        if (!sessionId) return NextResponse.json({ error: "sessionId requerido" }, { status: 400 });

        const res = await fetch(`${AI_URL}/chat/end`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AI_SECRET}`,
            },
            body: JSON.stringify({ sessionId }),
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data);
    } catch (e) {
        console.error("chat/end proxy error:", e);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
