"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import SplineRobot from "./SplineRobot";

type Tab = "chat" | "voice" | "history" | "photo" | "file" | "ocr";
type Message = { role: "user" | "assistant"; content: string };

interface SREvent { results: ArrayLike<ArrayLike<{ transcript: string }>>; }
interface SR {
    lang: string; continuous: boolean; interimResults: boolean;
    onresult: ((e: SREvent) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start(): void; stop(): void;
}
interface SpeechWindow extends Window {
    SpeechRecognition?: new () => SR;
    webkitSpeechRecognition?: new () => SR;
}

const STORAGE_KEY = "horus_chat_history";
function saveHistory(msgs: Message[]) { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs)); } catch {} }
function loadHistory(): Message[] { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; } }

const INITIAL_MSG: Message = {
    role: "assistant",
    content: "¡Hola! Soy Horus, tu asistente de primeros auxilios. Estoy aquí para guiarte en emergencias médicas con instrucciones claras y seguras. ¿En qué puedo ayudarte?",
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "chat", label: "Chat", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/></svg> },
    { id: "voice", label: "Voz", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"/></svg> },
    { id: "history", label: "Historial", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg> },
    { id: "photo", label: "Foto", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"/></svg> },
    { id: "file", label: "Archivo", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg> },
    { id: "ocr", label: "OCR", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6"/></svg> },
];

export default function ChatModal({ onClose, userId }: { onClose: () => void; userId?: string }) {
    const [activeTab, setActiveTab] = useState<Tab>("chat");

    // Chat state
    const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    const [speaking, setSpeaking] = useState(false);

    // Voice tab state
    const [voiceListening, setVoiceListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState("");
    const [voiceResponse, setVoiceResponse] = useState("");
    const [voiceLoading, setVoiceLoading] = useState(false);

    // Photo tab state
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoResult, setPhotoResult] = useState<string | null>(null);
    const [photoLoading, setPhotoLoading] = useState(false);

    // File tab state
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadResult, setUploadResult] = useState<"idle" | "loading" | "success" | "error">("idle");

    // OCR tab state
    const [ocrFile, setOcrFile] = useState<File | null>(null);
    const [ocrResult, setOcrResult] = useState<string | null>(null);
    const [ocrLoading, setOcrLoading] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<SR | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

    useEffect(() => {
        if (activeTab === "chat") inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, activeTab]);

    const speakWithElevenLabs = useCallback(async (text: string) => {
        try {
            setSpeaking(true);
            const res = await fetch("/api/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error("voice api");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            audioRef.current?.pause();
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
            audio.onerror = () => setSpeaking(false);
            await audio.play();
        } catch {
            setSpeaking(false);
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
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: next }),
            });
            const data = await res.json();
            const reply = data.content ?? "Lo siento, hubo un error. Por favor intenta de nuevo.";
            const updated: Message[] = [...next, { role: "assistant", content: reply }];
            setMessages(updated);
            saveHistory(updated);
            speakWithElevenLabs(reply);
        } catch {
            setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Por favor intenta de nuevo." }]);
        } finally {
            setLoading(false);
        }
    }, [loading, messages, speakWithElevenLabs]);

    const makeSR = () => {
        const w = window as SpeechWindow;
        return w.SpeechRecognition || w.webkitSpeechRecognition || null;
    };

    const toggleVoiceInput = () => {
        const SR = makeSR();
        if (!SR) return;
        if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
        const rec = new SR();
        rec.lang = "es-CO"; rec.continuous = false; rec.interimResults = false;
        rec.onresult = (e: SREvent) => sendMessage(e.results[0][0].transcript);
        rec.onend = () => setListening(false);
        rec.onerror = () => setListening(false);
        rec.start();
        recognitionRef.current = rec;
        setListening(true);
    };

    const startVoiceConversation = () => {
        const SR = makeSR();
        if (!SR) return;
        const rec = new SR();
        rec.lang = "es-CO"; rec.continuous = false; rec.interimResults = false;
        rec.onresult = async (e: SREvent) => {
            const transcript = e.results[0][0].transcript;
            setVoiceTranscript(transcript);
            setVoiceLoading(true);
            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: [INITIAL_MSG, { role: "user", content: transcript }] }),
                });
                const data = await res.json();
                const reply = data.content ?? "Lo siento, hubo un error.";
                setVoiceResponse(reply);
                await speakWithElevenLabs(reply);
            } catch {
                setVoiceResponse("Error de conexión.");
            } finally {
                setVoiceLoading(false);
            }
        };
        rec.onend = () => setVoiceListening(false);
        rec.onerror = () => setVoiceListening(false);
        rec.start();
        setVoiceListening(true);
        setVoiceTranscript("");
        setVoiceResponse("");
    };

    const handlePhotoAnalyze = async () => {
        if (!photoFile) return;
        setPhotoLoading(true);
        setPhotoResult(null);
        try {
            const form = new FormData();
            form.append("image", photoFile);
            const res = await fetch("/api/ocr", { method: "POST", body: form });
            const data = await res.json();
            const text = data.text || "No se detectó texto en la imagen.";
            setPhotoResult(text);
            const next: Message[] = [...messages, { role: "user", content: `Analiza este contenido extraído de una imagen:\n\n${text}` }];
            setMessages(next);
            setLoading(true);
            const chatRes = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: next }),
            });
            const chatData = await chatRes.json();
            const reply = chatData.content ?? "Texto procesado correctamente.";
            setMessages([...next, { role: "assistant", content: reply }]);
        } catch {
            setPhotoResult("Error al procesar la imagen.");
        } finally {
            setPhotoLoading(false);
            setLoading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!uploadFile || !userId) return;
        setUploadResult("loading");
        try {
            const form = new FormData();
            form.append("file", uploadFile);
            form.append("userId", userId);
            const res = await fetch("/api/medical-history/uploadDocuments", { method: "POST", body: form });
            setUploadResult(res.ok ? "success" : "error");
        } catch {
            setUploadResult("error");
        }
    };

    const handleOcr = async () => {
        if (!ocrFile) return;
        setOcrLoading(true);
        setOcrResult(null);
        try {
            const form = new FormData();
            form.append("image", ocrFile);
            const res = await fetch("/api/ocr", { method: "POST", body: form });
            const data = await res.json();
            setOcrResult(data.text ?? "No se pudo extraer texto.");
        } catch {
            setOcrResult("Error al procesar la imagen.");
        } finally {
            setOcrLoading(false);
        }
    };

    const history = loadHistory();

    const UploadZone = ({ file, accept, label, sublabel, onChange, icon }: {
        file: File | null; accept: string; label: string; sublabel?: string;
        onChange: (f: File) => void; icon: React.ReactNode;
    }) => (
        <label className="block w-full cursor-pointer">
            <div className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all ${
                file ? "border-[#EF233C]/40 bg-[#EF233C]/5" : "border-white/20 hover:border-white/40"
            }`}>
                {file ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-[#EF233C]">{icon}</div>
                        <p className="text-white/80 text-sm font-medium truncate max-w-full">{file.name}</p>
                        <p className="text-white/40 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                ) : (
                    <>
                        <div className="text-white/30 flex justify-center mb-3">{icon}</div>
                        <p className="text-white/50 text-sm">{label}</p>
                        {sublabel && <p className="text-white/30 text-xs mt-1">{sublabel}</p>}
                    </>
                )}
            </div>
            <input type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
        </label>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div
                className="relative z-10 w-full max-w-4xl h-[90vh] bg-[#1a1c2a] rounded-3xl overflow-hidden flex shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Left panel — Spline robot */}
                <div className="hidden md:block w-[42%] shrink-0 bg-[#0d0e1a] relative">
                    <div className="absolute inset-0 z-10">
                        <SplineRobot />
                    </div>
                    <div className="absolute bottom-5 w-full flex flex-col items-center gap-2 z-20 pointer-events-none">
                        {speaking && (
                            <div className="flex gap-1 items-end h-5">
                                {[6, 10, 14, 10, 6].map((h, i) => (
                                    <span key={i} className="w-0.5 rounded-full bg-[#EF233C]"
                                        style={{ height: `${h}px`, animation: "pulse 0.6s ease-in-out infinite alternate", animationDelay: `${i * 100}ms` }} />
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-white/20 font-medium tracking-widest uppercase">Asistente Horus</p>
                    </div>
                </div>

                {/* Right panel */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Tab bar */}
                    <div className="flex items-center border-b border-white/10 shrink-0 px-3 pt-3 overflow-x-auto">
                        <div className="flex gap-0.5 flex-1">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                        activeTab === tab.id
                                            ? "bg-white/10 text-white border-b-2 border-[#EF233C] -mb-px"
                                            : "text-white/35 hover:text-white/60 hover:bg-white/5"
                                    }`}
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 pl-2 pb-1">
                            {speaking && (
                                <button onClick={stopSpeaking}
                                    className="flex items-center gap-1 text-xs text-[#EF233C] hover:text-red-400 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                                    Detener
                                </button>
                            )}
                            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                    </div>

                    {/* ── CHAT tab ── */}
                    {activeTab === "chat" && (
                        <>
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                                            m.role === "user" ? "bg-[#EF233C] text-white rounded-br-sm" : "bg-white/10 text-white/90 rounded-bl-sm"
                                        }`}>{m.content}</div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-1">
                                            {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>
                            <div className="px-5 py-2 bg-[#EF233C]/10 border-t border-[#EF233C]/20 shrink-0">
                                <p className="text-xs text-[#EF233C]/80 text-center">⚠️ En emergencias graves llama al <strong>123</strong> (Colombia) · <strong>112</strong> (Europa)</p>
                            </div>
                            <div className="px-5 py-4 border-t border-white/10 flex gap-2 shrink-0">
                                <button onClick={toggleVoiceInput} title={listening ? "Detener grabación" : "Hablar"}
                                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                                        listening ? "bg-[#EF233C] text-white scale-110 shadow-lg shadow-[#EF233C]/30" : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white"
                                    }`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"/></svg>
                                </button>
                                <input ref={inputRef} type="text" value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                                    placeholder="Describe la emergencia o tu pregunta..."
                                    disabled={loading}
                                    className="flex-1 bg-white/[0.08] text-white placeholder-white/30 rounded-full px-4 py-2 text-sm outline-none focus:bg-white/[0.12] border border-transparent focus:border-white/20 transition-all disabled:opacity-50"
                                />
                                <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
                                    className="shrink-0 w-10 h-10 rounded-full bg-[#EF233C] text-white flex items-center justify-center hover:bg-[#d91e36] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"/></svg>
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── VOICE tab ── */}
                    {activeTab === "voice" && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8 overflow-y-auto">
                            <div className="text-center">
                                <h3 className="text-white font-bold text-lg mb-1">Conversación por Voz</h3>
                                <p className="text-white/40 text-sm">Habla con Horus usando ElevenLabs AI</p>
                            </div>
                            <button onClick={startVoiceConversation} disabled={voiceListening || voiceLoading}
                                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    voiceListening ? "bg-[#EF233C] scale-110 shadow-2xl shadow-[#EF233C]/40 animate-pulse"
                                        : voiceLoading ? "bg-white/10 cursor-not-allowed"
                                        : "bg-white/10 hover:bg-[#EF233C]/20 hover:scale-105 cursor-pointer"
                                }`}>
                                {voiceLoading
                                    ? <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <svg className={`w-10 h-10 ${voiceListening ? "text-white" : "text-white/60"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"/></svg>
                                }
                            </button>
                            <p className="text-white/50 text-sm">
                                {voiceListening ? "Escuchando..." : voiceLoading ? "Procesando..." : "Toca para hablar"}
                            </p>
                            {voiceTranscript && (
                                <div className="w-full max-w-sm bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wide font-semibold mb-2">Tú dijiste</p>
                                    <p className="text-white/80 text-sm">{voiceTranscript}</p>
                                </div>
                            )}
                            {voiceResponse && (
                                <div className="w-full max-w-sm bg-[#EF233C]/10 rounded-2xl p-4 border border-[#EF233C]/20">
                                    <p className="text-[10px] text-[#EF233C]/60 uppercase tracking-wide font-semibold mb-2">Horus respondió</p>
                                    <p className="text-white/80 text-sm">{voiceResponse}</p>
                                    {speaking && (
                                        <div className="flex gap-1 items-end h-4 mt-3">
                                            {[4, 8, 12, 8, 4].map((h, i) => (
                                                <span key={i} className="w-0.5 rounded-full bg-[#EF233C]"
                                                    style={{ height: `${h}px`, animation: "pulse 0.5s ease-in-out infinite alternate", animationDelay: `${i * 80}ms` }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── HISTORY tab ── */}
                    {activeTab === "history" && (
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                                    <svg className="w-14 h-14 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                                    <p className="text-white/40 text-sm">Sin historial en esta sesión</p>
                                    <p className="text-white/25 text-xs">Inicia una conversación en el Chat</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-white/40 text-xs uppercase tracking-wide font-semibold">Sesión actual · {history.length} mensajes</p>
                                        <button
                                            onClick={() => { sessionStorage.removeItem(STORAGE_KEY); setMessages([INITIAL_MSG]); }}
                                            className="text-xs text-[#EF233C]/60 hover:text-[#EF233C] transition-colors">
                                            Limpiar
                                        </button>
                                    </div>
                                    {history.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                                                m.role === "user" ? "bg-[#EF233C]/40 text-white rounded-br-sm" : "bg-white/5 text-white/70 rounded-bl-sm"
                                            }`}>{m.content}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PHOTO tab ── */}
                    {activeTab === "photo" && (
                        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
                            <div className="text-center">
                                <h3 className="text-white font-bold text-base mb-1">Analizar Foto</h3>
                                <p className="text-white/40 text-sm">Sube una foto para que Horus la analice con OCR + IA</p>
                            </div>
                            {photoPreview ? (
                                <div className="relative">
                                    <img src={photoPreview} alt="Preview" className="w-full max-h-44 rounded-2xl object-contain bg-white/5" />
                                    <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); setPhotoResult(null); }}
                                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors text-xs">✕</button>
                                </div>
                            ) : (
                                <UploadZone file={photoFile} accept="image/*" label="Toca para seleccionar foto" onChange={f => {
                                    setPhotoFile(f); setPhotoResult(null);
                                    const r = new FileReader(); r.onload = ev => setPhotoPreview(ev.target?.result as string); r.readAsDataURL(f);
                                }}
                                icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"/></svg>}
                                />
                            )}
                            {photoFile && (
                                <button onClick={handlePhotoAnalyze} disabled={photoLoading}
                                    className="w-full py-3 rounded-2xl bg-[#EF233C] text-white font-semibold text-sm hover:bg-[#d91e36] transition-colors disabled:opacity-50">
                                    {photoLoading ? "Analizando..." : "Analizar con OCR + IA"}
                                </button>
                            )}
                            {photoResult && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wide font-semibold mb-2">Texto extraído</p>
                                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{photoResult}</p>
                                    <p className="text-[10px] text-white/30 mt-2">La respuesta de Horus aparece en la pestaña Chat</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── FILE tab ── */}
                    {activeTab === "file" && (
                        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
                            <div className="text-center">
                                <h3 className="text-white font-bold text-base mb-1">Subir Documento</h3>
                                <p className="text-white/40 text-sm">Sube archivos a tu historial médico</p>
                            </div>
                            {!userId ? (
                                <div className="bg-yellow-500/10 rounded-2xl p-4 border border-yellow-500/20 text-center">
                                    <p className="text-yellow-400 text-sm">Inicia sesión para subir documentos</p>
                                </div>
                            ) : (
                                <>
                                    <UploadZone file={uploadFile} accept="*" label="Toca para seleccionar archivo" sublabel="PDF, Word, imágenes y más"
                                        onChange={f => { setUploadFile(f); setUploadResult("idle"); }}
                                        icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>}
                                    />
                                    {uploadFile && uploadResult !== "success" && (
                                        <button onClick={handleFileUpload} disabled={uploadResult === "loading"}
                                            className="w-full py-3 rounded-2xl bg-[#EF233C] text-white font-semibold text-sm hover:bg-[#d91e36] transition-colors disabled:opacity-50">
                                            {uploadResult === "loading" ? "Subiendo..." : "Subir al historial médico"}
                                        </button>
                                    )}
                                    {uploadResult === "success" && (
                                        <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20 text-center">
                                            <p className="text-green-400 font-semibold text-sm">Documento subido correctamente</p>
                                            <button onClick={() => { setUploadFile(null); setUploadResult("idle"); }}
                                                className="text-white/40 text-xs mt-2 hover:text-white/60 transition-colors block mx-auto">
                                                Subir otro
                                            </button>
                                        </div>
                                    )}
                                    {uploadResult === "error" && (
                                        <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20 text-center">
                                            <p className="text-red-400 text-sm">Error al subir. Inténtalo de nuevo.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── OCR tab ── */}
                    {activeTab === "ocr" && (
                        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
                            <div className="text-center">
                                <h3 className="text-white font-bold text-base mb-1">Extracción de Texto (OCR)</h3>
                                <p className="text-white/40 text-sm">Extrae texto de imágenes con IA</p>
                            </div>
                            <UploadZone file={ocrFile} accept="image/*" label="Selecciona una imagen con texto"
                                onChange={f => { setOcrFile(f); setOcrResult(null); }}
                                icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6"/></svg>}
                            />
                            {ocrFile && (
                                <button onClick={handleOcr} disabled={ocrLoading}
                                    className="w-full py-3 rounded-2xl bg-[#EF233C] text-white font-semibold text-sm hover:bg-[#d91e36] transition-colors disabled:opacity-50">
                                    {ocrLoading ? "Extrayendo texto..." : "Extraer texto con OCR"}
                                </button>
                            )}
                            {ocrResult && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] text-white/40 uppercase tracking-wide font-semibold">Texto extraído</p>
                                        <button onClick={() => navigator.clipboard?.writeText(ocrResult ?? "")}
                                            className="text-xs text-white/40 hover:text-white transition-colors">Copiar</button>
                                    </div>
                                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{ocrResult}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
