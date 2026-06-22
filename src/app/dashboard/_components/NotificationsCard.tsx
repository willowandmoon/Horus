"use client";
import { useState } from "react";

type Notif = { id: number; title: string; body: string; time: string; color: string; unread: boolean };

const INITIAL: Notif[] = [
    { id: 1, title: "Frecuencia cardíaca elevada",  body: "Se detectó 112 bpm durante 5 min.",   time: "Hace 2 min",  color: "#EF4444", unread: true  },
    { id: 2, title: "Batería de manilla al 20%",    body: "Recuerda cargar tu manilla Horus.",   time: "Hace 18 min", color: "#F59E0B", unread: true  },
    { id: 3, title: "Datos sincronizados",           body: "Historial médico actualizado.",       time: "Hace 1 h",    color: "#22C55E", unread: false },
    { id: 4, title: "Actualización disponible",      body: "Firmware v2.4.1 listo para instalar.",time: "Ayer",        color: "#8D99AE", unread: false },
];

export default function NotificationsCard() {
    const [notifs, setNotifs] = useState(INITIAL);
    const unread = notifs.filter(n => n.unread).length;

    const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
    const dismiss = (id: number) => setNotifs(prev => prev.filter(n => n.id !== id));

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
                        <span className="text-[10px] bg-[#EF4444] text-white font-bold px-1.5 py-0.5 rounded-full leading-none">{unread}</span>
                    )}
                </div>
                {unread > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-[#8D99AE] hover:text-[#1A1512] transition-colors font-medium">
                        Marcar todas leídas
                    </button>
                )}
            </div>

            {notifs.length === 0 ? (
                <div className="py-6 text-center">
                    <p className="text-xs text-[#8D99AE]">Sin notificaciones</p>
                </div>
            ) : (
                <div className="space-y-0">
                    {notifs.map(n => (
                        <div key={n.id} className="flex items-start gap-3 py-2.5 border-b border-[#E4E2DC] last:border-0 group">
                            <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 transition-opacity" style={{ backgroundColor: n.color, opacity: n.unread ? 1 : 0.3 }} />
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold truncate ${n.unread ? "text-[#1A1512]" : "text-[#8D99AE]"}`}>{n.title}</p>
                                <p className="text-[11px] text-[#8D99AE] truncate">{n.body}</p>
                                <p className="text-[10px] text-[#8D99AE]/70 mt-0.5">{n.time}</p>
                            </div>
                            <button onClick={() => dismiss(n.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8D99AE] hover:text-[#1A1512] p-0.5 shrink-0 mt-0.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
