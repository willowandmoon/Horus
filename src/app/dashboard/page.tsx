import { redirect } from "next/navigation";
import { authGuard } from "@/src/shared/lib/auth.guard";
import { AuthRepositoryImpl } from "@/src/infrastructure/repositories/auth.repository.impl";
import LogoutButton from "./_components/LogoutButton";
import LocationMap from "./_components/LocationMap";
import WeatherCard from "./_components/WeatherCard";
import ChatButton from "./_components/ChatButton";
import QrPermissionsCard from "./_components/QrPermissionsCard";
import NotificationsCard from "./_components/NotificationsCard";
import DevicesCard from "./_components/DevicesCard";
import FloatingSidebar from "@/src/components/FloatingSidebar";

function IconPhone() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
        </svg>
    );
}

const EMERGENCY_LINES = [
    { name: "Policía Nacional", number: "123", bg: "bg-[#1C1917]" },
    { name: "Bomberos",         number: "119", bg: "bg-[#EF7926]" },
    { name: "Cruz Roja",        number: "132", bg: "bg-[#E62B34]" },
    { name: "Defensa Civil",    number: "144", bg: "bg-[#8D99AE]" },
    { name: "GAULA",            number: "165", bg: "bg-[#1C1917]" },
];

function EmergencyLines() {
    return (
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E4E2DC]">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
                    </svg>
                </div>
                <h2 className="text-xs font-extrabold text-[#1C1917] uppercase tracking-wide">Líneas de Emergencia</h2>
            </div>
            <div className="space-y-0">
                {EMERGENCY_LINES.map(e => (
                    <div key={e.number} className="flex items-center justify-between py-2.5 border-b border-[#E4E2DC] last:border-0">
                        <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 ${e.bg}`}>
                                <IconPhone />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-[#1C1917]">{e.name}</p>
                                <p className="text-[10px] text-[#8D99AE]">{e.number}</p>
                            </div>
                        </div>
                        <a href={`tel:${e.number}`} title={`Llamar al ${e.number}`}
                            className="text-[#8D99AE] hover:text-[#E62B34] transition-colors p-1">
                            <IconPhone />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    let firstName = "Usuario";
    let userId    = "";

    try {
        const session    = await authGuard();
        const repository = new AuthRepositoryImpl();
        const user       = await repository.findById(session.sub);
        if (user) firstName = user.firstName;
        userId = session.sub;
    } catch {
        redirect("/login");
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#F2F1EC] text-[#1C1917]">

            {/* ── Mobile top bar ── */}
            <header className="lg:hidden flex items-center justify-between bg-white border-b border-[#E4E2DC] px-6 py-4 shrink-0">
                <div className="flex items-center gap-2.5 ml-14">
                    <img src="/gato.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-[#1C1917] font-black tracking-widest text-sm uppercase">Horus</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#96C979] animate-pulse" />
                        <span className="text-xs text-[#8D99AE] font-bold">Conectada</span>
                    </div>
                    <LogoutButton compact />
                </div>
            </header>

            {/* ── Floating left sidebar ── */}
            <FloatingSidebar />

            {/* ── Main content ── */}
            <main className="flex-1 pl-24 pr-6 py-8 md:pr-10 md:py-10 overflow-y-auto w-full max-w-[1700px] mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-[#1C1917] tracking-tight">Dashboard</h1>
                        <p className="text-[#8D99AE] text-sm mt-1 font-semibold">
                            Hola, <span className="font-bold text-[#1C1917]">{firstName}</span>
                            {" "}· Monitorea tu manilla Horus en tiempo real
                        </p>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="hidden sm:flex items-center gap-2 bg-white rounded-2xl px-4 py-2 border border-[#E4E2DC] shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-[#96C979] animate-pulse" />
                            <span className="text-sm font-bold text-[#1C1917]">Manilla conectada</span>
                        </div>
                        <div className="hidden lg:block">
                            <LogoutButton />
                        </div>
                    </div>
                </div>

                {/*
                 * Bento grid — 5 columnas en xl
                 * Columna izquierda (3/5): Asistente IA + Mapa GPS
                 * Columna derecha  (2/5): mini stats · QR · Notifs · Devices · Emergencias
                 */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

                    {/* ── LEFT (3 cols) ── */}
                    <div className="xl:col-span-3 flex flex-col gap-5">
                        <ChatButton userId={userId} />

                        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-[#E4E2DC] flex flex-col">
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#E62B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
                                    </svg>
                                    <h2 className="text-xs font-extrabold text-[#1C1917] uppercase tracking-wide">Ubicación en vivo</h2>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-[#8D99AE] font-semibold">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                    </svg>
                                    Actualizado recientemente
                                </div>
                            </div>
                            <div className="w-full min-h-[300px]">
                                <LocationMap />
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT (2 cols) ── */}
                    <div className="xl:col-span-2 flex flex-col gap-5">

                        {/* Mini stats: Weather + Heart rate */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="min-h-[128px]">
                                <WeatherCard />
                            </div>
                            <div className="bg-white rounded-[24px] p-4 shadow-sm border border-[#E4E2DC] flex flex-col justify-between min-h-[128px]">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-lg bg-[#FFF0F0] flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-[#E62B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
                                        </svg>
                                    </div>
                                    <p className="text-[9px] text-[#8D99AE] font-semibold uppercase tracking-wider">Salud</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[#1A1512]">
                                        98 <span className="text-sm font-semibold text-[#8D99AE]">bpm</span>
                                    </p>
                                    <p className="text-[10px] text-[#8D99AE] mt-0.5">Frec. cardíaca</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                                    <span className="text-[10px] text-[#22C55E] font-semibold">Normal</span>
                                </div>
                            </div>
                        </div>

                        <QrPermissionsCard userId={userId} />
                        <NotificationsCard />
                        <DevicesCard />
                        <EmergencyLines />
                    </div>
                </div>
            </main>
        </div>
    );
}
