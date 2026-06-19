"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/src/app/dashboard/_components/LogoutButton";

interface NavItem {
    label: string;
    href: string;
    activeBg: string;
    activeFg: string;
    icon: React.ReactNode;
}

export default function FloatingSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const items: NavItem[] = [
        {
            label: "Dashboard",
            href: "/dashboard",
            activeBg: "bg-[#FDF2B2]", // Soft yellow
            activeFg: "text-[#5C4D04]",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
            ),
        },
        {
            label: "Perfil",
            href: "/profile",
            activeBg: "bg-[#FCE7F3]", // Soft pink
            activeFg: "text-[#831843]",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
            ),
        },
        {
            label: "Perfil Médico",
            href: "/medical",
            activeBg: "bg-[#E8F5E9]", // Soft green
            activeFg: "text-[#1B5E20]",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
            ),
        },
        {
            label: "Archivos",
            href: "/archivos",
            activeBg: "bg-[#E3F2FD]", // Soft blue
            activeFg: "text-[#0D47A1]",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
            ),
        },
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Cabecera / Logo */}
            <div className="flex items-center gap-3 px-2 mb-8">
                <img src="/gato.png" alt="Logo" className="w-9 h-9 object-contain" />
                <span className="text-[#1C1917] font-black tracking-widest text-lg uppercase">Horus</span>
            </div>

            {/* Enlaces de Navegación */}
            <nav className="flex flex-col gap-2 flex-1">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[20px] text-sm font-bold tracking-wide transition-all duration-300 ${
                                isActive
                                    ? `${item.activeBg} ${item.activeFg} shadow-sm`
                                    : "text-[#8D99AE] hover:text-[#1C1917] hover:bg-[#F2F1EC]/80"
                            }`}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Botón de Logout */}
            <div className="border-t border-[#E4E2DC] pt-4 mt-auto">
                <LogoutButton />
            </div>
        </div>
    );

    return (
        <>
            {/* ── Botón hamburguesa flotante móvil (oculto en escritorio) ── */}
            <div className="lg:hidden fixed top-5 left-5 z-40">
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-12 h-12 bg-white border border-[#E4E2DC] text-[#1C1917] rounded-2xl shadow-md flex items-center justify-center hover:scale-105 transition-transform outline-none cursor-pointer"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            </div>

            {/* ── Sidebar Estacionario para Escritorio (Oculto en móvil) ── */}
            <aside className="hidden lg:flex fixed left-5 top-5 bottom-5 w-64 bg-white border border-[#E4E2DC] rounded-[32px] p-6 shadow-xl z-30">
                {sidebarContent}
            </aside>

            {/* ── Sidebar Deslizable para Móvil (Overlay) ── */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    {/* Fondo oscuro traslúcido */}
                    <div
                        className="fixed inset-0 bg-[#1C1917]/20 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Contenedor del panel lateral deslizable */}
                    <div className="relative flex flex-col w-72 max-w-[80%] h-[95vh] bg-white border border-[#E4E2DC] rounded-[32px] m-auto ml-4 shadow-2xl p-6 transition-transform duration-300 ease-out z-50">
                        {/* Botón para cerrar */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F2F1EC] text-[#1C1917] flex items-center justify-center hover:bg-[#E4E2DC] transition-colors outline-none cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    );
}
