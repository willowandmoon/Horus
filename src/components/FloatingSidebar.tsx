"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

function IconDashboard() {
    return (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
        </svg>
    );
}

function IconProfile() {
    return (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx={12} cy={7} r={4} />
        </svg>
    );
}

function IconFiles() {
    return (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            <path d="M2 10h20" />
        </svg>
    );
}

function IconLogout() {
    return (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

export default function FloatingSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const items: NavItem[] = [
        { label: "Dashboard", href: "/dashboard", icon: <IconDashboard /> },
        { label: "Perfil",    href: "/profile",   icon: <IconProfile /> },
        { label: "Archivos",  href: "/archivos",  icon: <IconFiles /> },
    ];

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    }

    return (
        <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1 bg-[#191512] rounded-[28px] px-2 py-3 shadow-2xl">
            {/* Logo */}
            <div className="mb-2 flex items-center justify-center w-9 h-9">
                <img src="/gato.png" alt="Horus" className="w-7 h-7 object-contain opacity-80" />
            </div>

            <div className="w-5 h-px bg-white/10 mb-1" />

            {/* Nav items */}
            {items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        className={`relative group w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200
                            ${isActive
                                ? "bg-[#FAD957] text-[#1A1512]"
                                : "text-white/40 hover:text-white/80 hover:bg-white/8"
                            }`}
                    >
                        {item.icon}
                        {/* Tooltip */}
                        <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#191512] border border-white/10 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
                            {item.label}
                        </span>
                    </Link>
                );
            })}

            <div className="w-5 h-px bg-white/10 mt-1 mb-1" />

            {/* Logout */}
            <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="group relative w-10 h-10 rounded-2xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-white/8 transition-all duration-200 cursor-pointer border-none bg-transparent"
            >
                <IconLogout />
                <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-[#191512] border border-white/10 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg">
                    Cerrar sesión
                </span>
            </button>
        </aside>
    );
}
