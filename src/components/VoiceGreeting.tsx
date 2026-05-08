"use client";

import { useEffect } from "react";

interface Props {
    message: string;
    delayMs?: number;
}

// Voces ordenadas de mejor a peor para el efecto dulce/etéreo tipo Lumalee.
// El selector recorre la lista y usa la primera que encuentre en el dispositivo.
const SWEET_VOICE_PRIORITY = [
    "Microsoft Laura",      // Windows es-ES — la más dulce disponible
    "Microsoft Helena",     // Windows es-ES — segunda opción femenina
    "Microsoft Aria",       // Windows — neural, muy dulce
    "Microsoft Jenny",      // Windows — joven y clara
    "Microsoft Zira",       // Windows — femenina clásica
    "Samantha",             // macOS — suave y clara
    "Karen",                // macOS — tono agradable
    "Monica",               // macOS es-ES
    "Microsoft Sabina",     // Windows es-MX
    "Google español",       // Android/Chrome
    "Alice",                // varios sistemas
    "Fiona",                // macOS
    "Victoria",             // macOS
];

function getSweetVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    // 1. Busca por nombre exacto en la lista de prioridad
    for (const name of SWEET_VOICE_PRIORITY) {
        const match = voices.find(v => v.name.includes(name));
        if (match) return match;
    }
    // 2. Cualquier voz femenina en español
    const spanishF = voices.find(v =>
        v.lang.startsWith("es") && /female|aria|zira|helena|sabina|lucia|paulina|monica/i.test(v.name)
    );
    if (spanishF) return spanishF;
    // 3. Cualquier voz en español
    const spanish = voices.find(v => v.lang.startsWith("es"));
    if (spanish) return spanish;
    // 4. Último recurso: primera voz disponible
    return voices[0] ?? null;
}

export default function VoiceGreeting({ message, delayMs = 700 }: Props) {
    useEffect(() => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        let timer: ReturnType<typeof setTimeout>;

        const speak = () => {
            const voices = window.speechSynthesis.getVoices();
            const voice  = getSweetVoice(voices);

            const utterance    = new SpeechSynthesisUtterance(message);
            utterance.pitch    = 1.80;  // muy agudo → efecto estrellita Lumalee
            utterance.rate     = 0.82;  // lento y soñador
            utterance.volume   = 1;
            if (voice) utterance.voice = voice;

            timer = setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, delayMs);
        };

        // Chrome bloquea speechSynthesis sin gesto del usuario.
        // Esperamos el primer click/toque y hablamos inmediatamente después.
        let spoken = false;

        const onInteraction = () => {
            if (spoken) return;
            spoken = true;
            document.removeEventListener("click",     onInteraction);
            document.removeEventListener("keydown",   onInteraction);
            document.removeEventListener("touchstart", onInteraction);

            if (window.speechSynthesis.getVoices().length > 0) {
                speak();
            } else {
                window.speechSynthesis.onvoiceschanged = () => {
                    speak();
                    window.speechSynthesis.onvoiceschanged = null;
                };
            }
        };

        document.addEventListener("click",      onInteraction, { once: true });
        document.addEventListener("keydown",    onInteraction, { once: true });
        document.addEventListener("touchstart", onInteraction, { once: true });

        return () => {
            clearTimeout(timer);
            document.removeEventListener("click",      onInteraction);
            document.removeEventListener("keydown",    onInteraction);
            document.removeEventListener("touchstart", onInteraction);
            window.speechSynthesis.cancel();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
