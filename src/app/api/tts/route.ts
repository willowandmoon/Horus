import { NextRequest, NextResponse } from "next/server";

const AI_URL    = process.env.HORUS_AI_URL    ?? "http://localhost:3001";
const AI_SECRET = process.env.HORUS_AI_SECRET ?? "";

export async function POST(req: NextRequest) {
    try {
        const { text, voiceId } = await req.json();
        if (!text) return NextResponse.json({ error: "text requerido" }, { status: 400 });

        const res = await fetch(`${AI_URL}/chat/tts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AI_SECRET}`,
            },
            body: JSON.stringify({ text, voiceId }),
        });
        if (!res.ok) {
            return NextResponse.json({ error: "TTS error" }, { status: 502 });
        }
        // ia-personalizada returns { audioBase64: string }
        const { audioBase64 } = await res.json() as { audioBase64: string };
        const buffer = Buffer.from(audioBase64, "base64");
        return new NextResponse(buffer, {
            headers: { "Content-Type": "audio/mpeg" },
        });
    } catch (e) {
        console.error("tts proxy error:", e);
        return NextResponse.json({ error: "Error TTS" }, { status: 500 });
    }
}
