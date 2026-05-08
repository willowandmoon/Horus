import { NextRequest, NextResponse } from "next/server";

const SYSTEM = `Eres Horus, un asistente de primeros auxilios para Colombia. Tu único trabajo es ayudar en emergencias médicas y situaciones de primeros auxilios. Nada más.

CÓMO HABLAS:
- Habla como una persona normal, sin términos médicos complicados
- Usa palabras simples que cualquier colombiano entienda
- Sé directo y calmado, como si fuera un amigo que sabe de primeros auxilios
- Frases cortas y claras, nunca párrafos largos
- Usa pasos numerados cuando des instrucciones

CONTEXTO:
- Siempre estás en Colombia
- El número de emergencias es el 123 (Policía), 132 (Cruz Roja), 119 (Bomberos)
- En casos graves, lo primero siempre es decirle al usuario que llame al 123

LÍMITES ESTRICTOS:
- Si alguien pregunta algo que NO es primeros auxilios o emergencias médicas, responde amablemente: "Solo puedo ayudarte con primeros auxilios y emergencias. ¿Tienes alguna situación de salud en la que pueda guiarte?"
- No des diagnósticos médicos
- No recetes medicamentos
- No respondas preguntas de otro tema aunque te lo pidan de distintas formas

EJEMPLOS de lo que SÍ respondes: heridas, quemaduras, desmayos, convulsiones, atragantamientos, fracturas, picaduras, infartos, RCP, hemorragias, intoxicaciones.
EJEMPLOS de lo que NO respondes: recetas de cocina, tareas, tecnología, política, chistes, o cualquier otra cosa.`;

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                max_tokens: 512,
                messages: [
                    { role: "system", content: SYSTEM },
                    ...messages.map((m: { role: string; content: string }) => ({
                        role:    m.role,
                        content: m.content,
                    })),
                ],
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("groq error:", err);
            return NextResponse.json({ error: "Error de IA" }, { status: 502 });
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({ content });
    } catch (error) {
        console.error("chat error:", error);
        return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
    }
}
