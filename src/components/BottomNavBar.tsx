"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

export default function BottomNavBar() {
    const pathname = usePathname();

    const items: NavItem[] = [
        {
            label: "Inicio",
            href: "/dashboard",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            label: "Monitor",
            href: "/dashboard#monitor",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                </svg>
            ),
        },
        {
            label: "ID",
            href: "/dashboard#id",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M7 8h10M7 12h6M7 16h8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            label: "IA",
            href: "/dashboard#ia",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            label: "Archivos",
            href: "/archivos",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            label: "Perfil",
            href: "/profile",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[460px]">
            <nav className="flex items-center justify-around bg-[#1A1512] border border-[#ffffff]/10 rounded-[32px] px-3 py-2.5 shadow-2xl backdrop-blur-md">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href.startsWith("/dashboard") && pathname === "/dashboard" && item.label === "Inicio");
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex flex-col items-center gap-1.5 group outline-none"
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    isActive
                                        ? "bg-[#FAD957] text-[#482D00] scale-110 shadow-lg"
                                        : "text-[#8D99AE] group-hover:text-white group-hover:bg-white/5"
                                }`}
                            >
                                {item.icon}
                            </div>
                            <span
                                className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
                                    isActive ? "text-white" : "text-[#8D99AE] group-hover:text-white"
                                }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
