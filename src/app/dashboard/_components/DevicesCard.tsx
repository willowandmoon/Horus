"use client";
import { useState, useEffect } from "react";

interface UserDevice { id: string; type: "BRACELET" | "SMARTWATCH" | "CARD"; identifier: string | null; registeredAt: string; }
interface Session { id: string; deviceName: string | null; deviceModel: string | null; osVersion: string | null; lastActive: string; }

const DEVICE_LABELS: Record<string, string> = {
    BRACELET:   "Manilla Horus",
    SMARTWATCH: "Reloj Horus",
    CARD:       "Tarjeta Horus",
};

function relTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 2)  return "Ahora mismo";
    if (m < 60) return `Hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Hace ${h} h`;
    return `Hace ${Math.floor(h / 24)} día${Math.floor(h / 24) > 1 ? "s" : ""}`;
}

export default function DevicesCard() {
    const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
    const [sessions, setSessions]       = useState<Session[]>([]);
    const [loading, setLoading]         = useState(true);

    useEffect(() => {
        fetch("/api/devices")
            .then(r => r.json())
            .then(d => { setUserDevices(d.userDevices ?? []); setSessions(d.sessions ?? []); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const isEmpty = !loading && userDevices.length === 0 && sessions.length === 0;

    return (
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E4E2DC]">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#F0EBE3] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
                    </svg>
                </div>
                <h2 className="text-xs font-extrabold text-[#1A1512] uppercase tracking-wide">Dispositivos Vinculados</h2>
            </div>

            {loading ? (
                <div className="py-4 flex justify-center">
                    <div className="w-5 h-5 border-2 border-[#E4E2DC] border-t-[#8D99AE] rounded-full animate-spin" />
                </div>
            ) : isEmpty ? (
                <div className="py-4 text-center">
                    <p className="text-xs text-[#8D99AE]">Sin dispositivos vinculados</p>
                    <p className="text-[11px] text-[#8D99AE]/60 mt-1">Vincula uno desde la app móvil</p>
                </div>
            ) : (
                <>
                    {userDevices.map(d => (
                        <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-[#E4E2DC] last:border-0">
                            <div className="w-11 h-11 rounded-2xl bg-[#1A1512] flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <p className="text-sm font-bold text-[#1A1512] truncate">{DEVICE_LABELS[d.type] ?? d.type}</p>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
                                </div>
                                <p className="text-[11px] text-[#8D99AE]">
                                    {d.identifier ? `ID: ${d.identifier.slice(0, 14)}` : "Vinculado"} · Bluetooth
                                </p>
                                <p className="text-[10px] text-[#8D99AE]/70 mt-0.5">
                                    Desde {new Date(d.registeredAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {sessions.map(s => {
                        const isSmartwatch = s.deviceModel?.toLowerCase().includes("gwear") || 
                                             s.deviceModel?.toLowerCase().includes("wear") || 
                                             s.deviceModel?.toLowerCase().includes("watch") ||
                                             s.deviceName?.toLowerCase().includes("wear") || 
                                             s.deviceName?.toLowerCase().includes("watch");
                        
                        const displayName = isSmartwatch 
                            ? "Reloj Horus" 
                            : (s.deviceModel ?? s.deviceName ?? "Sesión activa");

                        return (
                            <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-[#E4E2DC] last:border-0">
                                <div className="w-11 h-11 rounded-2xl bg-[#F0EBE3] flex items-center justify-center shrink-0">
                                    {isSmartwatch ? (
                                        <svg className="w-5 h-5 text-[#8D99AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 6V2h6v4M9 18v4h6v-4" stroke="currentColor" />
                                            <rect x="6" y="6" width="12" height="12" rx="3" stroke="currentColor" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-[#8D99AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <p className="text-sm font-bold text-[#1A1512] truncate">{displayName}</p>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
                                    </div>
                                    <p className="text-[11px] text-[#8D99AE]">
                                        {isSmartwatch && s.deviceModel ? `${s.deviceModel} · ` : ""}
                                        {s.osVersion ? `OS: ${s.osVersion}` : "App Horus"} · {relTime(s.lastActive)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

            <p className="text-[10px] text-[#8D99AE]/60 mt-3 pt-3 border-t border-[#E4E2DC]">
                La vinculación de nuevos dispositivos se realiza desde la app móvil.
            </p>
        </div>
    );
}
