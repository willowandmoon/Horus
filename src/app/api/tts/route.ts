import { NextRequest, NextResponse } from "next/server";

// ElevenLabs voice — "Matilda" (warm, clear, multilingual)
const VOICE_ID = "XrExE9yKIg1WjnnlVkGX";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        const res = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_flash_v2_5",
                    output_format: "mp3_22050_32",
                    voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.1 },
                }),
            }
        );

        if (!res.ok) {
            return NextResponse.json({ error: "TTS error" }, { status: 502 });
        }

        const audio = await res.arrayBuffer();
        return new NextResponse(audio, {
            headers: { "Content-Type": "audio/mpeg" },
        });
    } catch (error) {
        console.error("tts error:", error);
        return NextResponse.json({ error: "Error TTS" }, { status: 500 });
    }
}
