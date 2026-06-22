"use client";
import { useState } from "react";
import ChatModal from "./ChatModal";

const FEATURES = [
    { label: "Chat IA",        emoji: "💬" },
    { label: "Voz ElevenLabs", emoji: "🎙️" },
    { label: "Historial",      emoji: "📋" },
    { label: "Subir Foto",     emoji: "📷" },
    { label: "Archivos",       emoji: "📄" },
    { label: "OCR",            emoji: "🔍" },
];

export default function ChatButton({ userId }: { userId?: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="w-full bg-[#1a1c2a] rounded-[28px] p-6 flex flex-col gap-5 shadow-md border border-white/5 hover:border-[#EF233C]/30 hover:shadow-xl transition-all duration-300 cursor-pointer text-left group"
            >
                {/* Status row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <p className="text-[11px] text-white/40 font-semibold uppercase tracking-widest">Asistente Horus · IA</p>
                    </div>
                    <span className="text-[11px] bg-[#EF233C]/20 text-[#EF233C] font-bold px-2.5 py-1 rounded-full">En línea</span>
                </div>

                {/* Title */}
                <div>
                    <h2 className="text-[1.75rem] font-black text-white leading-tight mb-1">Asistente IA</h2>
                    <p className="text-sm text-white/35 leading-relaxed">
                        Primeros auxilios, emergencias y consultas médicas guiadas por inteligencia artificial con voz
                    </p>
                </div>

                {/* Feature chips */}
                <div className="flex flex-wrap gap-1.5">
                    {FEATURES.map(f => (
                        <span key={f.label}
                            className="flex items-center gap-1.5 text-xs bg-white/[0.07] text-white/45 px-3 py-1 rounded-full border border-white/[0.08] group-hover:border-white/15 group-hover:text-white/60 transition-all">
                            <span>{f.emoji}</span>
                            <span>{f.label}</span>
                        </span>
                    ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-bold text-[#EF233C] group-hover:gap-3 transition-all mt-1">
                    <span>Abrir Asistente</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                    </svg>
                </div>
            </button>

            {open && <ChatModal onClose={() => setOpen(false)} userId={userId} />}
        </>
    );
}
