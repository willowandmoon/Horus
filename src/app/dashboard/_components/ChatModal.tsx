"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import SplineRobot from "./SplineRobot";

type Message = { role: "user" | "assistant"; content: string };

interface SR {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onend:   (() => void) | null;
    onerror: (() => void) | null;
    start(): void;
    stop():  void;
}

interface SpeechWindow extends Window {
    SpeechRecognition?:       new () => SR;
    webkitSpeechRecognition?: new () => SR;
}

export default function ChatModal({ onClose }: { onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "¡Hola! Soy Horus, tu asistente de primeros auxilios. Estoy aquí para guiarte en emergencias médicas con instrucciones claras y seguras. ¿En qué puedo ayudarte?",
        },
    ]);
    const [input, setInput]       = useState("");
    const [loading, setLoading]   = useState(false);
    const [listening, setListening] = useState(false);
    const [speaking, setSpeaking]   = useState(false);

    const bottomRef      = useRef<HTMLDivElement>(null);
    const inputRef       = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<SR | null>(null);
    const audioRef       = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const speakText = useCallback(async (text: string) => {
        try {
            setSpeaking(true);
            const res = await fetch("/api/tts", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ text }),
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
            // Fallback: browser TTS
            if (window.speechSynthesis) {
                const utt = new SpeechSynthesisUtterance(text);
                utt.lang = "es-CO";
                utt.onend = () => setSpeaking(false);
                window.speechSynthesis.speak(utt);
            }
        }
    }, []);

    const stopSpeaking = () => {
        audioRef.current?.pause();
        audioRef.current = null;
        window.speechSynthesis?.cancel();
        setSpeaking(false);
    };

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return;
        const next: Message[] = [...messages, { role: "user", content: text }];
        setMessages(next);
        setInput("");
        setLoading(true);
        try {
            const res  = await fetch("/api/chat", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ messages: next }),
            });
            const data  = await res.json();
            const reply = data.content ?? "Lo siento, hubo un error. Por favor intenta de nuevo.";
            setMessages(prev => [...prev, { role: "assistant", content: reply }]);
            speakText(reply);
        } catch {
            setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Por favor intenta de nuevo." }]);
        } finally {
            setLoading(false);
        }
    }, [loading, messages, speakText]);

    const toggleVoiceInput = () => {
        const w  = window as SpeechWindow;
        const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
        if (!SR) return;
        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }
        const rec = new SR();
        rec.lang = "es-CO";
        rec.continuous = false;
        rec.interimResults = false;
        rec.onresult = (e: SpeechRecognitionEvent) => sendMessage(e.results[0][0].transcript);
        rec.onend    = () => setListening(false);
        rec.onerror  = () => setListening(false);
        rec.start();
        recognitionRef.current = rec;
        setListening(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className="relative z-10 w-full max-w-4xl h-[88vh] bg-[#1a1c2a] rounded-3xl overflow-hidden flex shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Left: Spline robot ─────────────────────────────────────── */}
                <div className="hidden md:block w-[54%] shrink-0 bg-[#0d0e1a] relative z-10">
                    {/* Robot — ocupa todo el panel */}
                    <div className="absolute inset-0 z-30">
                        <SplineRobot />
                    </div>

                    {/* Etiqueta + ondas de voz */}
                    <div className="absolute bottom-5 w-full flex flex-col items-center gap-2 z-20">
                        {speaking && (
                            <div className="flex gap-1 items-end h-5">
                                {[6, 10, 14, 10, 6].map((h, i) => (
                                    <span
                                        key={i}
                                        className="w-0.5 rounded-full bg-[#EF233C]"
                                        style={{
                                            height: `${h}px`,
                                            animation: "pulse 0.6s ease-in-out infinite alternate",
                                            animationDelay: `${i * 100}ms`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-white/20 font-medium tracking-widest uppercase">Asistente Horus</p>
                    </div>
                </div>

                {/* ── Right: Chat ────────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <div>
                                <h2 className="text-white font-bold text-sm">Primeros Auxilios · IA</h2>
                                <p className="text-xs text-white/35">Asistencia médica inmediata</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {speaking && (
                                <button
                                    onClick={stopSpeaking}
                                    className="flex items-center gap-1 text-xs text-[#EF233C] hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                                >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                        <rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>
                                    </svg>
                                    Detener voz
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                                        m.role === "user"
                                            ? "bg-[#EF233C] text-white rounded-br-sm"
                                            : "bg-white/10 text-white/90 rounded-bl-sm"
                                    }`}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-1">
                                    {[0, 150, 300].map(delay => (
                                        <span
                                            key={delay}
                                            className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce"
                                            style={{ animationDelay: `${delay}ms` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Emergency banner */}
                    <div className="px-5 py-2 bg-[#EF233C]/10 border-t border-[#EF233C]/20 shrink-0">
                        <p className="text-xs text-[#EF233C]/80 text-center">
                            ⚠️ En emergencias graves llama al <strong>123</strong> (Colombia) · <strong>112</strong> (Europa)
                        </p>
                    </div>

                    {/* Input bar */}
                    <div className="px-5 py-4 border-t border-white/10 flex gap-2 shrink-0">
                        {/* Mic button */}
                        <button
                            onClick={toggleVoiceInput}
                            title={listening ? "Detener grabación" : "Hablar"}
                            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                                listening
                                    ? "bg-[#EF233C] text-white scale-110 shadow-lg shadow-[#EF233C]/30"
                                    : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"/>
                            </svg>
                        </button>

                        {/* Text input */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                            placeholder="Describe la emergencia o tu pregunta..."
                            disabled={loading}
                            className="flex-1 bg-white/8 text-white placeholder-white/30 rounded-full px-4 py-2 text-sm outline-none focus:bg-white/12 border border-transparent focus:border-white/20 transition-all disabled:opacity-50"
                        />

                        {/* Send button */}
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={loading || !input.trim()}
                            className="shrink-0 w-10 h-10 rounded-full bg-[#EF233C] text-white flex items-center justify-center hover:bg-[#d91e36] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
