import { NextRequest, NextResponse } from "next/server";

const AI_URL    = process.env.HORUS_AI_URL    ?? "http://localhost:3001";
const AI_SECRET = process.env.HORUS_AI_SECRET ?? "";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

        const res = await fetch(`${AI_URL}/chat/init`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AI_SECRET}`,
            },
            body: JSON.stringify({ userId }),
        });
        if (!res.ok) {
            const err = await res.text();
            console.error("horus-ai /chat/init error:", err);
            return NextResponse.json({ error: "No se pudo iniciar sesión IA" }, { status: 502 });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e) {
        console.error("chat/init proxy error:", e);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
