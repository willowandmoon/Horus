"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ChatMsg {
    id: string;
    role: "user" | "assistant";
    text: string;
}

interface ConvLog {
    id: string;
    started_at?: { _seconds?: number };
    summary?: string;
    main_topics?: string[];
    alert_level?: string;
    message_count?: number;
    requires_follow_up?: boolean;
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG      = "#F2F1EC";
const CARD    = "#FFFFFF";
const PRIMARY = "#1A1512";
const MUTED   = "#8D99AE";
const MBG     = "#F0EBE3";
const BORDER  = "#E4E2DC";
const GREEN   = "#22C55E";
const sw      = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const SUGGESTIONS = [
    "¿Qué hago si alguien pierde el conocimiento?",
    "¿Cómo tratar una quemadura leve?",
    "Reporte de salud del día",
];

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
    const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/);
    return parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (/^\*[^*]+\*$/.test(part))     return <em key={i}>{part.slice(1, -1)}</em>;
        if (/^`[^`]+`$/.test(part))       return (
            <code key={i} style={{ fontFamily: "monospace", fontSize: "0.85em", background: "rgba(0,0,0,0.08)", borderRadius: 3, padding: "0 3px" }}>
                {part.slice(1, -1)}
            </code>
        );
        return part;
    });
}

function Markdown({ text, isUser }: { text: string; isUser: boolean }) {
    const color = isUser ? "#FFF" : PRIMARY;
    const lines = text.split("\n");
    const nodes: React.ReactNode[] = [];

    lines.forEach((line, i) => {
        if (line === "") { nodes.push(<div key={i} style={{ height: 5 }} />); return; }
        if (line.startsWith("### ")) { nodes.push(<p key={i} style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 2 }}>{renderInline(line.slice(4))}</p>); return; }
        if (line.startsWith("## "))  { nodes.push(<p key={i} style={{ fontWeight: 800, fontSize: 14, color, marginBottom: 2 }}>{renderInline(line.slice(3))}</p>); return; }
        if (line.startsWith("# "))   { nodes.push(<p key={i} style={{ fontWeight: 900, fontSize: 15, color, marginBottom: 4 }}>{renderInline(line.slice(2))}</p>); return; }
        if (/^[-*] /.test(line)) {
            nodes.push(
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2, alignItems: "flex-start" }}>
                    <span style={{ color: isUser ? "rgba(255,255,255,0.6)" : MUTED, marginTop: 1 }}>•</span>
                    <span style={{ flex: 1, color }}>{renderInline(line.slice(2))}</span>
                </div>
            ); return;
        }
        if (/^\d+\. /.test(line)) {
            const num = line.match(/^(\d+)/)?.[1];
            nodes.push(
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2, alignItems: "flex-start" }}>
                    <span style={{ color: isUser ? "rgba(255,255,255,0.6)" : MUTED, minWidth: 16 }}>{num}.</span>
                    <span style={{ flex: 1, color }}>{renderInline(line.replace(/^\d+\.\s/, ""))}</span>
                </div>
            ); return;
        }
        nodes.push(<p key={i} style={{ color, marginBottom: 2, lineHeight: 1.55 }}>{renderInline(line)}</p>);
    });

    return <div style={{ fontSize: 14 }}>{nodes}</div>;
}

// ── Welcome ────────────────────────────────────────────────────────────────────
function WelcomeScreen({ onSuggest }: { onSuggest: (t: string) => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-5 py-8 px-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ background: MBG }}>
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
                        {msg.text && (
                    <div className={`rounded-2xl px-4 py-3 ${isUser ? "rounded-br-sm" : "rounded-bl-sm"}`}
                        style={{
                            background: isUser ? PRIMARY : CARD,
                            boxShadow: isUser ? "none" : "0 1px 4px rgba(0,0,0,0.07)",
                        }}>
                        <Markdown text={msg.text} isUser={isUser} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── History overlay ────────────────────────────────────────────────────────────
const ALERT_STYLES: Record<string, { bg: string; color: string }> = {
    Urgente:  { bg: "#FEE2E2", color: "#B91C1C" },
    Moderado: { bg: "#FEF3C7", color: "#92400E" },
    Normal:   { bg: "#DCFCE7", color: "#166534" },
};

function HistoryOverlay({ onClose }: { onClose: () => void }) {
    const [logs, setLogs]       = useState<ConvLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/chat/history", { cache: "no-store" })
            .then(r => r.json())
            .then(d => setLogs(d.logs ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const fmtDate = (log: ConvLog) => {
        const s = log.started_at?._seconds;
        if (!s) return "—";
        return new Date(s * 1000).toLocaleDateString("es-CO", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    return (
        <div className="absolute inset-0 z-30 flex flex-col" style={{ background: BG }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0"
                style={{ background: CARD, borderColor: BORDER }}>
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={PRIMARY} strokeWidth={1.8} {...sw}>
                    <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                <p className="flex-1 text-base font-bold" style={{ color: PRIMARY }}>Historial</p>
                <button onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ background: MBG, color: MUTED }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...sw}>
                        <path d="M6 18 18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-2 border-[#E4E2DC] border-t-[#8D99AE] rounded-full animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth={1} {...sw}>
                            <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        <p className="text-sm font-semibold" style={{ color: PRIMARY }}>Sin conversaciones aún</p>
                        <p className="text-xs" style={{ color: MUTED }}>Las conversaciones finalizadas aparecerán aquí</p>
                    </div>
                ) : (
                    logs.map(log => {
                        const alert = ALERT_STYLES[log.alert_level ?? "Normal"] ?? ALERT_STYLES.Normal;
                        return (
                            <div key={log.id} className="rounded-[20px] p-4 border" style={{ background: CARD, borderColor: BORDER }}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-semibold" style={{ color: MUTED }}>{fmtDate(log)}</p>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{ background: alert.bg, color: alert.color }}>
                                        {log.alert_level ?? "Normal"}
                                    </span>
                                </div>
                                {log.summary && (
                                    <p className="text-sm leading-snug mb-2" style={{ color: PRIMARY }}>{log.summary}</p>
                                )}
                                {log.main_topics && log.main_topics.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {log.main_topics.map(t => (
                                            <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                style={{ background: MBG, color: MUTED }}>{t}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: BORDER }}>
                                    <span className="text-[10px]" style={{ color: MUTED }}>{log.message_count ?? 0} mensajes</span>
                                    {log.requires_follow_up && (
                                        <span className="text-[10px] font-bold" style={{ color: "#F59E0B" }}>· Requiere seguimiento</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ── Main ChatModal ─────────────────────────────────────────────────────────────
export default function ChatModal({ onClose, userId }: { onClose: () => void; userId?: string }) {
    const [sessionId,   setSessionId]   = useState<string | null>(null);
    const [initError,   setInitError]   = useState(false);
    const [messages,    setMessages]    = useState<ChatMsg[]>([]);
    const [input,       setInput]       = useState("");
    const [typing,      setTyping]      = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    const bottomRef    = useRef<HTMLDivElement>(null);
    const inputRef     = useRef<HTMLInputElement>(null);
    const sessionIdRef = useRef<string | null>(null); // ref copy to use in async callbacks

    // End session on close — only if a session was actually started
    const handleClose = useCallback(() => {
        const sid = sessionIdRef.current;
        if (sid) {
            fetch("/api/chat/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: sid }),
            }).catch(() => {});
        }
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (!historyOpen) inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !historyOpen) handleClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handleClose, historyOpen]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typing]);

    // Init session lazily on first message, then send it
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || !userId) return;

        setMessages(prev => [...prev, { id: `${Date.now()}-u`, role: "user", text }]);
        setInput("");
        setTyping(true);

        try {
            // Get or create session
            let sid = sessionIdRef.current;
            if (!sid) {
                setInitError(false);
                const initRes  = await fetch("/api/chat/init", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }),
                });
                const initData = await initRes.json();
                if (!initData.sessionId) { setInitError(true); setTyping(false); return; }
                sid = initData.sessionId;
                sessionIdRef.current = sid;
                setSessionId(sid);
            }

            const res   = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: sid, message: text }),
            });
            const data  = await res.json();
            const reply = data.content ?? "Lo siento, hubo un error.";
            setMessages(prev => [...prev, { id: `${Date.now()}-a`, role: "assistant", text: reply }]);
        } catch {
            setMessages(prev => [...prev, { id: `${Date.now()}-e`, role: "assistant", text: "Error de conexión con el agente." }]);
        } finally {
            setTyping(false);
        }
    }, [userId]);

    const handleSend = () => { if (input.trim()) sendMessage(input); };
    const canSend = !!input.trim();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative z-10 w-full max-w-xl h-[90vh] rounded-3xl overflow-hidden flex shadow-2xl"
                onClick={e => e.stopPropagation()}>

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
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: initError ? "#EF4444" : GREEN }} />
                                <span className="text-[11px] font-semibold" style={{ color: initError ? "#EF4444" : GREEN }}>
                                    {initError ? "Sin conexión" : "Listo"}
                                </span>
                            </div>
                        </div>
                        {/* History */}
                        <button onClick={() => setHistoryOpen(true)} title="Historial"
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                            style={{ background: MBG, color: MUTED }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...sw}>
                                <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                            </svg>
                        </button>
                        {/* Close — prominent */}
                        <button onClick={handleClose} title="Cerrar chat"
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                            style={{ background: PRIMARY, color: "#FFF" }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...sw}>
                                <path d="M6 18 18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    {/* Init error */}
                    {initError && (
                        <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                            No se pudo conectar con el agente IA. Verifica que ia-personalizada-horus corre en el puerto 3001.
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {messages.length === 0 && !typing && (
                            <WelcomeScreen onSuggest={sendMessage} />
                        )}
                        {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
                        {typing && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1" style={{ background: CARD }}>
                                    {[0, 150, 300].map(d => (
                                        <span key={d} className="w-2 h-2 rounded-full animate-bounce"
                                            style={{ background: MUTED, animationDelay: `${d}ms` }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* End chat button */}
                    {sessionId && messages.length > 0 && (
                        <div className="px-4 pt-2 shrink-0 flex justify-center">
                            <button onClick={handleClose}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-70"
                                style={{ background: "#FEE2E2", color: "#B91C1C" }}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...sw}>
                                    <path d="M6 18 18 6M6 6l12 12"/>
                                </svg>
                                Terminar chat
                            </button>
                        </div>
                    )}

                    {/* Input bar */}
                    <div className="px-4 py-3 flex items-center gap-2 shrink-0 border-t" style={{ background: CARD, borderColor: BORDER }}>
                        {/* Text input */}
                        <div className="flex-1 rounded-2xl px-4 py-2 flex items-center" style={{ background: BG }}>
                            <input ref={inputRef} type="text" value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                                placeholder="Escribe algo..."
                                disabled={typing}
                                className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50 placeholder-[#8D99AE]"
                                style={{ color: PRIMARY }} />
                        </div>

                        {/* Send */}
                        <button onClick={handleSend} disabled={typing || !canSend}
                            title="Enviar"
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all hover:opacity-80 disabled:opacity-30"
                            style={{ background: PRIMARY, color: "#FFF" }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...sw}>
                                <path d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"/>
                            </svg>
                        </button>
                    </div>

                    {/* History overlay */}
                    {historyOpen && <HistoryOverlay onClose={() => setHistoryOpen(false)} />}
                </div>
            </div>
        </div>
    );
}
