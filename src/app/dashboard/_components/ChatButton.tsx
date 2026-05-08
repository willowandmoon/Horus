"use client";
import { useState } from "react";
import ChatModal from "./ChatModal";

export default function ChatButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-sm border border-transparent hover:bg-violet-50 hover:border-violet-200 hover:shadow-md transition-all duration-300 min-h-[160px] w-full text-left cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/>
                    </svg>
                    <p className="text-xs text-[#8D99AE] font-medium uppercase tracking-wide">Chat de Asistencia</p>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-1">
                    <p className="text-2xl font-bold text-[#2B2D42]">Asistente IA</p>
                    <p className="text-sm text-[#8D99AE]">Primeros auxilios guiados por inteligencia artificial con voz</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-violet-500 mt-auto">
                    <span>Abrir chat</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                    </svg>
                </div>
            </button>

            {open && <ChatModal onClose={() => setOpen(false)} />}
        </>
    );
}
