import { NextRequest, NextResponse } from "next/server";

const AI_URL    = process.env.HORUS_AI_URL    ?? "http://localhost:3001";
const AI_SECRET = process.env.HORUS_AI_SECRET ?? "";
const headers   = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${AI_SECRET}` });

// POST /api/chat — proxy to ia-personalizada-horus POST /chat/message
export async function POST(req: NextRequest) {
    try {
        const { sessionId, message, mediaBase64, mediaType } = await req.json();
        if (!sessionId || !message) {
            return NextResponse.json({ error: "sessionId y message requeridos" }, { status: 400 });
        }
        const res = await fetch(`${AI_URL}/chat/message`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ sessionId, message, mediaBase64, mediaType }),
        });
        if (!res.ok) {
            const err = await res.text();
            console.error("horus-ai /chat/message error:", err);
            return NextResponse.json({ error: "Error del agente IA" }, { status: 502 });
        }
        const data = await res.json() as { response: string; sessionId: string; timestamp: string };
        return NextResponse.json({ content: data.response });
    } catch (e) {
        console.error("chat proxy error:", e);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
