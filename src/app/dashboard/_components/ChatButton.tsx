"use client";
import { useState } from "react";
import ChatModal from "./ChatModal";

export default function ChatButton({ userId }: { userId?: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="w-full bg-white rounded-[28px] p-5 flex items-center gap-4 shadow-sm border border-[#E4E2DC] hover:shadow-md transition-all duration-200 cursor-pointer text-left group"
            >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-[#F0EBE3] flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="/uploads/profiles/horus-modo-claro.svg" alt="Horus" className="w-11 h-11 object-contain dark:hidden" />
                    <img src="/uploads/profiles/horus-modo-oscuro.svg" alt="Horus" className="hidden w-11 h-11 object-contain dark:block" />
                </div>

                {/* Info */}
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

                {/* Chat icon */}
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
