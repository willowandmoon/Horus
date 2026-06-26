"use client";
import { useState } from "react";
import Link from "next/link";
import ChatModal from "./ChatModal";

export default function ChatButton({ userId, hasSubscription }: { userId?: string; hasSubscription?: boolean }) {
    const [open, setOpen] = useState(false);

    if (!hasSubscription) {
        return (
            <div className="w-full bg-white rounded-[28px] p-5 flex items-center gap-4 shadow-sm border border-[#E4E2DC] relative overflow-hidden">
                {/* blurred content */}
                <div className="w-14 h-14 rounded-full bg-[#F0EBE3] flex items-center justify-center shrink-0 overflow-hidden opacity-40 blur-[1px]">
                    <img src="/logos-horus-2.svg" alt="Horus" className="w-11 h-11 object-contain" />
                </div>
                <div className="flex-1 min-w-0 opacity-40 blur-[1px]">
                    <p className="text-base font-bold text-[#1A1512]">Horus · IA</p>
                    <p className="text-sm text-[#8D99AE]">Primeros auxilios, emergencias y consultas médicas</p>
                </div>

                {/* overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-[28px] px-6 text-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-[#FAD957] flex items-center justify-center mb-1">
                        <svg className="w-5 h-5 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-[#1A1512]">IA Horus disponible con suscripción</p>
                    <p className="text-xs text-[#8D99AE]">Adquiere tu manilla o tarjeta Horus para acceder al asistente médico inteligente</p>
                    <Link href="/tienda" className="mt-2 px-4 py-2 rounded-xl bg-[#1A1512] text-white text-xs font-bold hover:opacity-80 transition-opacity">
                        Ver productos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="w-full bg-white rounded-[28px] p-5 flex items-center gap-4 shadow-sm border border-[#E4E2DC] hover:shadow-md transition-all duration-200 cursor-pointer text-left group"
            >
                <div className="w-14 h-14 rounded-full bg-[#F0EBE3] flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="/logos-horus-2.svg" alt="Horus" className="w-11 h-11 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-base font-bold text-[#1A1512]">Horus · IA</p>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                            <span className="text-[11px] font-semibold text-[#22C55E]">En línea</span>
                        </div>
                    </div>
                    <p className="text-sm text-[#8D99AE] leading-snug">
                        Primeros auxilios, emergencias y consultas médicas
                    </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#1A1512] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/>
                    </svg>
                </div>
            </button>

            {open && <ChatModal onClose={() => setOpen(false)} userId={userId} />}
        </>
    );
}
