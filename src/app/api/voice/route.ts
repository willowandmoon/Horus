import { NextRequest, NextResponse } from "next/server";

// Voz Lizy (Sweet, Charming and Captivating) de ElevenLabs.
// Se puede sobreescribir con ELEVENLABS_VOICE_ID en .env.
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "rrErIO88ehxTnspOjKvf";

export async function POST(req: NextRequest) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "ELEVENLABS_API_KEY no configurada" }, { status: 500 });
    }

    const { text } = await req.json();
    if (!text) {
        return NextResponse.json({ error: "texto requerido" }, { status: 400 });
    }

    const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
            method: "POST",
            headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_turbo_v2_5",
                voice_settings: {
                    stability: 0.12,          // muy bajo → efecto etéreo y flotante
                    similarity_boost: 0.95,   // muy alto → mantiene el carácter único
                    style: 0.80,              // alta expresividad → suena mágico/soñador
                    use_speaker_boost: true,
                },
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
    }

    const audio = await res.arrayBuffer();

    return new NextResponse(audio, {
        headers: {
            "Content-Type": "audio/mpeg",
            // Cache de 1 hora — el mismo mensaje no genera múltiples llamadas a la API
            "Cache-Control": "public, max-age=3600",
        },
    });
}
