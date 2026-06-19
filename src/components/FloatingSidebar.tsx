"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/src/app/dashboard/_components/LogoutButton";

interface NavItem { label: string; href: string; activeBg: string; activeFg: string; icon: React.ReactNode; }

export default function FloatingSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const items: NavItem[] = [
        { label: "Dashboard", href: "/dashboard", activeBg: "bg-[#FDF2B2]", activeFg: "text-[#5C4D04]",
          icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
        { label: "Perfil", href: "/profile", activeBg: "bg-[#FCE7F3]", activeFg: "text-[#831843]",
          icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg> },
        { label: "Archivos", href: "/archivos", activeBg: "bg-[#E3F2FD]", activeFg: "text-[#0D47A1]",
          icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg> },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-2 mb-8">
                <img src="/gato.png" alt="Logo" className="w-9 h-9 object-contain" />
                <span className="text-[#1C1917] font-black tracking-widest text-lg uppercase">Horus</span>
            </div>
            <nav className="flex flex-col gap-2 flex-1">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link key={item.label} href={item.href} onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[20px] text-sm font-bold tracking-wide transition-all duration-300 ${isActive ? `${item.activeBg} ${item.activeFg} shadow-sm` : "text-[#8D99AE] hover:text-[#1C1917] hover:bg-[#F2F1EC]/80"}`}>
                            <span className="shrink-0">{item.icon}</span>{item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-[#E4E2DC] pt-4 mt-auto"><LogoutButton /></div>
        </div>
    );

    return (
        <>
            <div className="lg:hidden fixed top-5 left-5 z-40">
                <button onClick={() => setIsOpen(true)} className="w-12 h-12 bg-white border border-[#E4E2DC] rounded-2xl shadow-md flex items-center justify-center hover:scale-105 transition-transform outline-none cursor-pointer">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                </button>
            </div>
            <aside className="hidden lg:flex fixed left-5 top-5 bottom-5 w-64 bg-white border border-[#E4E2DC] rounded-[32px] p-6 shadow-xl z-30">{sidebarContent}</aside>
            {isOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-[#1C1917]/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className="relative flex flex-col w-72 max-w-[80%] h-[95vh] bg-white border border-[#E4E2DC] rounded-[32px] m-auto ml-4 shadow-2xl p-6 z-50">
                        <button onClick={() => setIsOpen(false)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F2F1EC] flex items-center justify-center hover:bg-[#E4E2DC] transition-colors outline-none cursor-pointer">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    );
}
