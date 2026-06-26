"use client";
import { useState, useEffect, useCallback } from "react";

interface Notif {
    id:        string;
    title:     string;
    body:      string;
    type:      "qr_scan" | "health_alert" | "info";
    read:      boolean;
    timestamp: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function relativeTime(iso: string | null): string {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1)  return "Ahora mismo";
    if (m < 60) return `Hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Hace ${h} h`;
    return `Hace ${Math.floor(h / 24)} día${Math.floor(h / 24) > 1 ? "s" : ""}`;
}

const TYPE_COLORS: Record<Notif["type"], string> = {
    qr_scan:      "#8B5CF6",
    health_alert: "#F59E0B",
    info:         "#3B82F6",
};

const TYPE_LABELS: Record<Notif["type"], string> = {
    qr_scan:      "Escaneo QR",
    health_alert: "Alerta salud",
    info:         "Info",
};

// ── Icons ──────────────────────────────────────────────────────────────────────
function QrIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"/>
            <path d="M6.75 6.75h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"/>
        </svg>
    );
}

function HeartIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
        </svg>
    );
}

function InfoIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>
        </svg>
    );
}

function NotifIcon({ type }: { type: Notif["type"] }) {
    return type === "qr_scan" ? <QrIcon /> : type === "health_alert" ? <HeartIcon /> : <InfoIcon />;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function NotificationsCard() {
    const [notifs, setNotifs]   = useState<Notif[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(false);

    const load = useCallback(async (isManual = false) => {
        if (isManual) setLoading(true);
        try {
            const res  = await fetch("/api/notifications", { cache: "no-store" });
            const data = await res.json() as { notifications: Notif[] };
            setNotifs(data.notifications ?? []);
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        // Refresh every 60 s so QR scan notifications appear quickly
        const id = setInterval(() => load(false), 60_000);
        return () => clearInterval(id);
    }, [load]);

    const markRead = async (id: string) => {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
        } catch {}
    };

    const dismiss = (id: string) => {
        setNotifs(prev => prev.filter(n => n.id !== id));
    };

    const unread = notifs.filter(n => !n.read).length;

    return (
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E4E2DC]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F0EBE3] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
                        </svg>
                    </div>
                    <h2 className="text-xs font-extrabold text-[#1A1512] uppercase tracking-wide">Notificaciones</h2>
                    {unread > 0 && (
                        <span className="text-[10px] bg-[#EF4444] text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
                            {unread}
                        </span>
                    )}
                </div>
                <button onClick={() => load(true)} title="Actualizar"
                    className="text-[#8D99AE] hover:text-[#1A1512] transition-colors p-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                    </svg>
                </button>
            </div>

            {/* Body */}
            {loading ? (
                <div className="py-5 flex justify-center">
                    <div className="w-5 h-5 border-2 border-[#E4E2DC] border-t-[#8D99AE] rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="py-4 text-center">
                    <p className="text-xs text-[#EF4444] mb-2">Error al cargar notificaciones</p>
                    <button onClick={() => load()} className="text-xs text-[#8D99AE] hover:text-[#1A1512] transition-colors">
                        Reintentar
                    </button>
                </div>
            ) : notifs.length === 0 ? (
                <div className="py-5 text-center">
                    <p className="text-xs text-[#8D99AE]">Sin notificaciones</p>
                    <p className="text-[11px] text-[#8D99AE]/60 mt-1">
                        Aparecerán aquí los escaneos del QR y alertas de salud
                    </p>
                </div>
            ) : (
                <div className="space-y-0 max-h-[280px] overflow-y-auto pr-1">
                    {notifs.map(n => {
                        const color = TYPE_COLORS[n.type];
                        return (
                            <div
                                key={n.id}
                                onClick={() => !n.read && markRead(n.id)}
                                className={`flex items-start gap-3 py-2.5 border-b border-[#E4E2DC] last:border-0 group cursor-pointer ${
                                    n.read ? "opacity-60" : ""
                                }`}>
                                {/* Type dot */}
                                <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                                        style={{ background: color + "18", color }}>
                                        <NotifIcon type={n.type} />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-xs font-semibold truncate ${n.read ? "text-[#8D99AE]" : "text-[#1A1512]"}`}>
                                            {n.title}
                                        </p>
                                        {!n.read && (
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: color }} />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-[#8D99AE] leading-snug mt-0.5">{n.body}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                                            style={{ background: color + "18", color }}>
                                            {TYPE_LABELS[n.type]}
                                        </span>
                                        <span className="text-[10px] text-[#8D99AE]/70">{relativeTime(n.timestamp)}</span>
                                    </div>
                                </div>

                                {/* Dismiss */}
                                <button
                                    onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8D99AE] hover:text-[#1A1512] p-0.5 shrink-0 mt-0.5">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 18 18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
