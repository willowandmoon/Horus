"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import SplineRobot from "./SplineRobot";

// ── Types ──────────────────────────────────────────────────────────────────────
type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface ChatMsg {
    id: string;
    role: "user" | "assistant";
    text: string;
    media?: { uri: string; type: "image" | "pdf" | "docx"; name?: string };
}

interface SREvent { results: ArrayLike<ArrayLike<{ transcript: string }>>; }
interface SR {
    lang: string; continuous: boolean; interimResults: boolean;
    onresult: ((e: SREvent) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    onstart: (() => void) | null;
    start(): void; stop(): void;
}
interface Win extends Window {
    SpeechRecognition?: new () => SR;
    webkitSpeechRecognition?: new () => SR;
}

// ── Design tokens (match mobile theme) ────────────────────────────────────────
const BG      = "#F2F1EC";
const CARD    = "#FFFFFF";
const PRIMARY = "#1A1512";
const MUTED   = "#8D99AE";
const MBG     = "#F0EBE3";
const BORDER  = "#E4E2DC";
const GREEN   = "#22C55E";

const sw = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

// ── Suggestion chips (welcome screen) ─────────────────────────────────────────
const SUGGESTIONS = [
    "¿Qué hago si alguien pierde el conocimiento?",
    "¿Cómo tratar una quemadura leve?",
    "Reporte de salud del día",
];

// ── Welcome screen ─────────────────────────────────────────────────────────────
function WelcomeScreen({ onSuggest }: { onSuggest: (t: string) => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-5 py-8 px-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: MBG }}>
                <img src="/gato.png" alt="Horus" className="w-14 h-14 object-contain" />
            </div>
            <div className="text-center">
                <p className="text-base font-bold" style={{ color: PRIMARY }}>Hola, soy Horus</p>
                <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: MUTED }}>
                    Tu asistente de primeros auxilios y salud. ¿En qué puedo ayudarte?
                </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
                {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => onSuggest(s)}
                        className="text-left text-sm px-4 py-2.5 rounded-2xl font-medium border transition-shadow hover:shadow-md"
                        style={{ background: CARD, color: PRIMARY, borderColor: BORDER }}>
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMsg }) {
    const isUser = msg.role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[82%]">
                {msg.media?.type === "image" && (
                    <img src={msg.media.uri} alt="Imagen"
                        className={`rounded-2xl max-h-48 object-cover block mb-1.5 ${isUser ? "ml-auto" : ""}`} />
                )}
                {(msg.text || msg.media?.type === "pdf" || msg.media?.type === "docx") && (
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "rounded-br-sm" : "rounded-bl-sm"}`}
                        style={{
                            background: isUser ? PRIMARY : CARD,
                            color: isUser ? "#FFF" : PRIMARY,
                            boxShadow: isUser ? "none" : "0 1px 4px rgba(0,0,0,0.07)",
                        }}>
                        {(msg.media?.type === "pdf" || msg.media?.type === "docx") && (
                            <div className="flex items-center gap-2 mb-2 opacity-80">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...sw}>
                                    <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                <span className="text-xs font-semibold truncate">{msg.media?.name ?? "Documento"}</span>
                            </div>
                        )}
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Attach option button ───────────────────────────────────────────────────────
function AttachOption({ label, iconPath, bgColor, onClick }: {
    label: string; iconPath: React.ReactNode; bgColor: string; onClick: () => void;
}) {
    return (
        <button onClick={onClick}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors hover:opacity-80"
            style={{ ["--hover-bg" as string]: MBG }}
            onMouseEnter={e => (e.currentTarget.style.background = MBG)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: bgColor + "22" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={bgColor} strokeWidth={1.8} {...sw}>
                    {iconPath}
                </svg>
            </div>
            <span className="text-sm font-medium" style={{ color: PRIMARY }}>{label}</span>
        </button>
    );
}

// ── Voice mode overlay ─────────────────────────────────────────────────────────
function VoiceModeOverlay({
    onClose, externalAudioRef,
}: {
    onClose: () => void;
    externalAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
}) {
    const [state, setState] = useState<VoiceState>("idle");
    const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
    const recRef = useRef<SR | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [msgs]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handleClose = () => {
        recRef.current?.stop();
        externalAudioRef.current?.pause();
        externalAudioRef.current = null;
        onClose();
    };

    const startListening = () => {
        const w = window as Win;
        const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
        if (!SR) return;
        const rec = new SR();
        rec.lang = "es-CO"; rec.continuous = false; rec.interimResults = false;
        rec.onstart = () => setState("listening");
        rec.onresult = async (e) => {
            const transcript = e.results[0][0].transcript;
            setMsgs(prev => [...prev, { role: "user", text: transcript }]);
            setState("processing");

            try {
                const history = msgs.map(m => ({ role: m.role, content: m.text }));
                history.push({ role: "user", content: transcript });

                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: history }),
                });
                const data = await res.json();
                const reply = data.content ?? "Lo siento, hubo un error.";
                setMsgs(prev => [...prev, { role: "assistant", text: reply }]);

                setState("speaking");
                const ttsRes = await fetch("/api/tts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: reply }),
                });
                if (ttsRes.ok) {
                    const blob = await ttsRes.blob();
                    const url = URL.createObjectURL(blob);
                    externalAudioRef.current?.pause();
                    const audio = new Audio(url);
                    externalAudioRef.current = audio;
                    audio.onended = () => { URL.revokeObjectURL(url); setState("idle"); };
                    audio.onerror = () => setState("idle");
                    await audio.play();
                } else {
                    setState("idle");
                }
            } catch {
                setState("idle");
            }
        };
        rec.onend = () => { if (state === "listening") setState("idle"); };
        rec.onerror = () => setState("idle");
        recRef.current = rec;
        rec.start();
    };

    const handleOrbPress = () => {
        if (state === "idle") startListening();
        else if (state === "listening") { recRef.current?.stop(); setState("idle"); }
        else if (state === "speaking") {
            externalAudioRef.current?.pause();
            externalAudioRef.current = null;
            setState("idle");
        }
    };

    const statusText = {
        idle: "Toca para hablar",
        listening: "Escuchando...",
        processing: "Procesando...",
        speaking: "Hablando...",
    }[state];

    const orbAnim = {
        idle: "orbIdle 2.5s ease-in-out infinite",
        listening: "orbListen 0.7s ease-in-out infinite",
        processing: "orbSpin 1.2s linear infinite",
        speaking: "orbSpeak 0.9s ease-in-out infinite",
    }[state];

    return (
        <div className="absolute inset-0 z-30 flex flex-col"
            style={{ background: "rgba(13,14,26,0.97)", backdropFilter: "blur(8px)" }}>

            {/* Close */}
            <div className="flex justify-between items-center px-5 pt-5 pb-3 shrink-0">
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Modo de Voz
                </p>
                <button onClick={handleClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                    style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...sw}>
                        <path d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-2 space-y-3">
                {msgs.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
                            Toca el orbe azul para comenzar
                        </p>
                    </div>
                )}
                {msgs.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                            style={{
                                background: m.role === "user" ? "rgba(255,255,255,0.12)" : "rgba(59,130,246,0.18)",
                                color: m.role === "user" ? "rgba(255,255,255,0.85)" : "rgba(147,197,253,0.95)",
                                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            }}>
                            {m.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Orb + status */}
            <div className="flex flex-col items-center gap-6 py-8 shrink-0">
                <button onClick={handleOrbPress} disabled={state === "processing"}
                    className="relative w-24 h-24 rounded-full flex items-center justify-center disabled:cursor-not-allowed"
                    style={{
                        background: state === "listening"
                            ? "radial-gradient(circle, #60a5fa, #2563eb)"
                            : state === "speaking"
                            ? "radial-gradient(circle, #34d399, #059669)"
                            : "radial-gradient(circle, #3b82f6, #1d4ed8)",
                        animation: orbAnim,
                        boxShadow: state === "idle"
                            ? "0 0 30px rgba(59,130,246,0.35)"
                            : state === "listening"
                            ? "0 0 40px rgba(96,165,250,0.6)"
                            : state === "speaking"
                            ? "0 0 40px rgba(52,211,153,0.6)"
                            : "0 0 30px rgba(59,130,246,0.4)",
                    }}>
                    {state === "processing" ? (
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} {...sw}
                            style={{ animation: "orbSpin 1.2s linear infinite" }}>
                            <path d="M4 12a8 8 0 0 1 16 0" strokeLinecap="round" />
                        </svg>
                    ) : state === "speaking" ? (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8} {...sw}>
                            <path d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8} {...sw}>
                            <path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                    )}
                </button>

                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>{statusText}</p>
            </div>

            {/* CSS keyframes */}
            <style>{`
                @keyframes orbIdle   { 0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.07);opacity:1} }
                @keyframes orbListen { 0%,100%{transform:scale(1)}25%{transform:scale(1.14)}75%{transform:scale(.96)} }
                @keyframes orbSpin   { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
                @keyframes orbSpeak  { 0%,100%{transform:scale(1)}50%{transform:scale(1.1)} }
            `}</style>
        </div>
    );
}

// ── History overlay ────────────────────────────────────────────────────────────
function HistoryOverlay({ messages, onClose }: { messages: ChatMsg[]; onClose: () => void }) {
    return (
        <div className="absolute inset-0 z-30 flex flex-col" style={{ background: BG }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ background: CARD, borderColor: BORDER }}>
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={PRIMARY} strokeWidth={1.8} {...sw}>
                    <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <p className="flex-1 text-base font-bold" style={{ color: PRIMARY }}>Historial de la sesión</p>
                <button onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                    style={{ background: MBG, color: MUTED }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...sw}>
                        <path d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth={1} {...sw}>
                            <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <p className="font-semibold text-sm" style={{ color: PRIMARY }}>Sin conversaciones aún</p>
                        <p className="text-xs" style={{ color: MUTED }}>Los mensajes de esta sesión aparecerán aquí</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: MUTED }}>
                            Sesión actual · {messages.length} mensajes
                        </p>
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                                    style={{
                                        background: m.role === "user" ? PRIMARY : CARD,
                                        color: m.role === "user" ? "#FFF" : PRIMARY,
                                        borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                        boxShadow: m.role === "assistant" ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
                                    }}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main ChatModal ─────────────────────────────────────────────────────────────
export default function ChatModal({ onClose, userId }: { onClose: () => void; userId?: string }) {
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput]       = useState("");
    const [typing, setTyping]     = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [pendingMedia, setPendingMedia] = useState<{
        file: File; preview?: string; type: "image" | "pdf" | "docx";
    } | null>(null);
    const [showAttach, setShowAttach]     = useState(false);
    const [voiceModeOn, setVoiceModeOn]   = useState(false);
    const [historyOpen, setHistoryOpen]   = useState(false);

    const bottomRef   = useRef<HTMLDivElement>(null);
    const inputRef    = useRef<HTMLInputElement>(null);
    const audioRef    = useRef<HTMLAudioElement | null>(null);
    const cameraRef   = useRef<HTMLInputElement>(null);
    const galleryRef  = useRef<HTMLInputElement>(null);
    const docRef      = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typing]);

    useEffect(() => {
        if (!voiceModeOn && !historyOpen) inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !voiceModeOn && !historyOpen) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, voiceModeOn, historyOpen]);

    // ── TTS ────────────────────────────────────────────────────────────────────
    const speakText = useCallback(async (text: string) => {
        try {
            setSpeaking(true);
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error("tts");
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            audioRef.current?.pause();
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
            audio.onerror = () => setSpeaking(false);
            await audio.play();
        } catch {
            setSpeaking(false);
        }
    }, []);

    // ── Send message ────────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (
        text: string,
        mediaFile?: File,
        mediaType?: "image" | "pdf" | "docx",
        mediaPreview?: string,
    ) => {
        if (!text.trim() && !mediaFile) return;

        const displayText = text || (mediaType === "image" ? "Analiza esta imagen médica." : "Analiza este documento médico.");

        const userMsg: ChatMsg = {
            id: `${Date.now()}-u`,
            role: "user",
            text: displayText,
            media: mediaFile ? {
                uri: mediaPreview ?? URL.createObjectURL(mediaFile),
                type: mediaType ?? "image",
                name: mediaFile.name,
            } : undefined,
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setPendingMedia(null);
        setTyping(true);

        try {
            let msgText = displayText;

            // OCR for images
            if (mediaFile && mediaType === "image") {
                try {
                    const form = new FormData();
                    form.append("image", mediaFile);
                    const ocrRes  = await fetch("/api/ocr", { method: "POST", body: form });
                    const ocrData = await ocrRes.json();
                    if (ocrData.text) msgText += `\n\n[Texto extraído de imagen]: ${ocrData.text}`;
                } catch {}
            }

            // Build message history for API
            const history = messages.map(m => ({ role: m.role, content: m.text }));
            history.push({ role: "user", content: msgText });

            const res  = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history }),
            });
            const data  = await res.json();
            const reply = data.content ?? "Lo siento, hubo un error.";

            setMessages(prev => [...prev, { id: `${Date.now()}-a`, role: "assistant", text: reply }]);
            speakText(reply);
        } catch {
            setMessages(prev => [...prev, { id: `${Date.now()}-e`, role: "assistant", text: "Error de conexión." }]);
        } finally {
            setTyping(false);
        }
    }, [messages, speakText]);

    const handleSendOrMic = () => {
        if (input.trim() || pendingMedia) {
            sendMessage(input, pendingMedia?.file, pendingMedia?.type, pendingMedia?.preview);
        } else {
            setVoiceModeOn(true);
        }
    };

    // ── File helpers ────────────────────────────────────────────────────────────
    const handleImageFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = e => setPendingMedia({ file, preview: e.target?.result as string, type: "image" });
        reader.readAsDataURL(file);
        setShowAttach(false);
    };

    const handleDocFile = (file: File) => {
        const ext  = file.name.split(".").pop()?.toLowerCase();
        const type = ext === "pdf" ? "pdf" : "docx";
        setPendingMedia({ file, type });
        setShowAttach(false);
    };

    const hasSend = input.trim() || pendingMedia;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal container */}
            <div
                className="relative z-10 w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden flex shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Left panel: Spline (dark) ── */}
                <div className="hidden md:block w-[40%] shrink-0 bg-[#0d0e1a] relative">
                    <div className="absolute inset-0 z-10"><SplineRobot /></div>
                    {speaking && (
                        <div className="absolute bottom-9 w-full flex justify-center pointer-events-none z-20">
                            <div className="flex gap-1 items-end h-6">
                                {[5, 9, 13, 9, 5].map((h, i) => (
                                    <span key={i} className="w-0.5 rounded-full" style={{
                                        height: `${h}px`, background: GREEN,
                                        animation: `speakBar .6s ease-in-out infinite alternate`,
                                        animationDelay: `${i * 100}ms`,
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-4 w-full text-center pointer-events-none z-20">
                        <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
                            Asistente Horus
                        </p>
                    </div>
                </div>

                {/* ── Right panel: Chat (light, matches mobile) ── */}
                <div className="flex-1 flex flex-col min-w-0 relative" style={{ background: BG }}>

                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3.5 shrink-0 border-b"
                        style={{ background: CARD, borderColor: BORDER }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                            style={{ background: MBG }}>
                            <img src="/gato.png" alt="Horus" className="w-7 h-7 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold leading-tight" style={{ color: PRIMARY }}>Horus · IA</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />
                                <span className="text-[11px] font-semibold" style={{ color: GREEN }}>En línea</span>
                            </div>
                        </div>
                        {/* History button */}
                        <button onClick={() => setHistoryOpen(true)} title="Historial"
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                            style={{ background: MBG, color: MUTED }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...sw}>
                                <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </button>
                        {/* Close */}
                        <button onClick={onClose} title="Cerrar chat"
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                            style={{ background: MBG, color: MUTED }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...sw}>
                                <path d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages list */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {messages.length === 0 && !typing && (
                            <WelcomeScreen onSuggest={t => sendMessage(t)} />
                        )}
                        {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
                        {typing && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1"
                                    style={{ background: CARD }}>
                                    {[0, 150, 300].map(d => (
                                        <span key={d} className="w-2 h-2 rounded-full animate-bounce"
                                            style={{ background: MUTED, animationDelay: `${d}ms` }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Pending media strip */}
                    {pendingMedia && (
                        <div className="mx-4 mb-2 flex items-center gap-2.5 rounded-2xl px-3 py-2"
                            style={{ background: MBG }}>
                            {pendingMedia.preview ? (
                                <img src={pendingMedia.preview} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                            ) : (
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: BORDER }}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth={1.8} {...sw}>
                                        <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                </div>
                            )}
                            <p className="flex-1 text-xs font-medium truncate" style={{ color: PRIMARY }}>
                                {pendingMedia.file.name}
                            </p>
                            <button onClick={() => setPendingMedia(null)}
                                className="transition-opacity hover:opacity-70" style={{ color: MUTED }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...sw}>
                                    <path d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Input bar */}
                    <div className="px-4 py-3 flex items-center gap-2 shrink-0 border-t"
                        style={{ background: CARD, borderColor: BORDER }}>

                        {/* Hidden file inputs */}
                        <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />
                        <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />
                        <input ref={docRef}     type="file" accept=".pdf,.doc,.docx" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleDocFile(f); e.target.value = ""; }} />

                        {/* Attach (+ button) */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setShowAttach(v => !v)}
                                className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                                style={{ background: MBG, color: PRIMARY }}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...sw}>
                                    <path d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </button>

                            {showAttach && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowAttach(false)} />
                                    <div className="absolute bottom-11 left-0 z-20 rounded-2xl shadow-xl p-2 min-w-[200px]"
                                        style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                                        <AttachOption
                                            label="Tomar foto" bgColor="#3B82F6"
                                            iconPath={<path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />}
                                            onClick={() => { cameraRef.current?.click(); }}
                                        />
                                        <AttachOption
                                            label="Elegir de galería" bgColor="#22C55E"
                                            iconPath={<><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></>}
                                            onClick={() => { galleryRef.current?.click(); }}
                                        />
                                        <AttachOption
                                            label="Adjuntar PDF o Word" bgColor={PRIMARY}
                                            iconPath={<path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />}
                                            onClick={() => { docRef.current?.click(); }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Text input pill */}
                        <div className="flex-1 rounded-2xl px-4 py-2 flex items-center" style={{ background: BG }}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendOrMic()}
                                placeholder="Escribe algo..."
                                disabled={typing}
                                className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50 placeholder-[#8D99AE]"
                                style={{ color: PRIMARY }}
                            />
                        </div>

                        {/* Send / Mic button */}
                        <button
                            onClick={handleSendOrMic}
                            disabled={typing}
                            title={hasSend ? "Enviar" : "Modo de voz"}
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all hover:opacity-80 disabled:opacity-40"
                            style={{
                                background: hasSend ? PRIMARY : MBG,
                                color: hasSend ? "#FFF" : PRIMARY,
                            }}>
                            {hasSend ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...sw}>
                                    <path d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...sw}>
                                    <path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* ── Voice Mode overlay (covers full modal) ── */}
                    {voiceModeOn && (
                        <VoiceModeOverlay
                            onClose={() => setVoiceModeOn(false)}
                            externalAudioRef={audioRef}
                        />
                    )}

                    {/* ── History overlay ── */}
                    {historyOpen && (
                        <HistoryOverlay messages={messages} onClose={() => setHistoryOpen(false)} />
                    )}
                </div>
            </div>

            {/* Global keyframe for speaking bars */}
            <style>{`
                @keyframes speakBar { from{transform:scaleY(.5)}to{transform:scaleY(1.2)} }
            `}</style>
        </div>
    );
}
