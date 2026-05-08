import Link from "next/link";
import { redirect } from "next/navigation";
import { authGuard } from "@/src/shared/lib/auth.guard";
import { AuthRepositoryImpl } from "@/src/infrastructure/repositories/auth.repository.impl";
import EyeOfHorusIcon from "@/src/components/EyeOfHorusIcon";
import LogoutButton from "./_components/LogoutButton";
import LocationMap from "./_components/LocationMap";
import ContactsPanel from "./_components/ContactsPanel";
import WeatherCard from "./_components/WeatherCard";
import ChatButton from "./_components/ChatButton";

// ── Iconos ────────────────────────────────────────────────────────────────────

function IconPhone()    { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>; }
function IconLocation() { return <svg className="w-4 h-4 text-[#EF233C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>; }
function IconClock()    { return <svg className="w-4 h-4 text-[#8D99AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>; }

// ── Enlace de navegación ──────────────────────────────────────────────────────

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active?: boolean }) {
    return (
        <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${active ? "bg-[#EF233C] text-white" : "text-[#8D99AE] hover:text-white hover:bg-white/5"}`}>
            {icon}
            {label}
        </Link>
    );
}

// ── Fila de emergencia — número colombiano real con enlace tel: ───────────────

function EmergencyRow({ name, number, bg }: { name: string; number: string; bg: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-[#EDF2F4] last:border-0">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${bg}`}>
                    <IconPhone />
                </div>
                <div>
                    <p className="text-sm font-semibold text-[#2B2D42]">{name}</p>
                    <p className="text-xs text-[#8D99AE]">{number}</p>
                </div>
            </div>
            <a
                href={`tel:${number}`}
                className="text-[#8D99AE] hover:text-[#EF233C] transition-colors"
                title={`Llamar al ${number}`}
            >
                <IconPhone />
            </a>
        </div>
    );
}


// ── Página principal del dashboard ────────────────────────────────────────────

export default async function DashboardPage() {
    let firstName = "Usuario";

    try {
        const session    = await authGuard();
        const repository = new AuthRepositoryImpl();
        const user       = await repository.findById(session.sub);
        if (user) firstName = user.firstName;
    } catch {
        redirect("/login");
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* ── Barra superior móvil (visible solo en pantallas pequeñas) ── */}
            <header className="lg:hidden flex items-center justify-between bg-[#1a1c2a] px-4 py-3 shrink-0">
                <div className="flex items-center gap-2.5">
                    <EyeOfHorusIcon className="w-7 h-7" />
                    <span className="text-white font-bold tracking-widest text-xs uppercase">Horus Braslet</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                        <span className="text-xs text-[#8D99AE]">Conectada</span>
                    </div>
                    <LogoutButton compact />
                </div>
            </header>

            {/* ── Sidebar (visible solo en pantallas grandes) ───────────────── */}
            <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#1a1c2a] px-4 py-6">
                <div className="flex items-center gap-2.5 px-2 mb-10">
                    <EyeOfHorusIcon className="w-9 h-7" />
                    <span className="text-white font-bold tracking-widest text-sm uppercase">Horus Braslet</span>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    <NavLink active href="/dashboard" label="Dashboard"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>}
                    />
                    <NavLink href="/profile" label="Perfil"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>}
                    />
                    <NavLink href="/medical" label="Perfil Médico"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/></svg>}
                    />
                    <NavLink href="/store" label="Tienda"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/></svg>}
                    />
                </nav>

                <div className="border-t border-white/10 pt-4">
                    <LogoutButton />
                </div>
            </aside>

            {/* ── Main ─────────────────────────────────────────────────────── */}
            <main className="flex-1 bg-[#EDF2F4] p-4 md:p-8 overflow-y-auto">
                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#2B2D42]">Dashboard</h1>
                        <p className="text-[#8D99AE] text-sm mt-1">
                            Hola, <span className="font-medium text-[#2B2D42]">{firstName}</span> · Monitorea tu manilla Horus Braslet en tiempo real
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm self-start">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                        <span className="text-sm font-medium text-[#2B2D42]">Manilla conectada</span>
                    </div>
                </div>

                {/* Tarjetas principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                    {/* Chat de asistencia */}
                    <ChatButton />

                    {/* Pronóstico de clima */}
                    <WeatherCard />
                </div>

                {/* Contenido principal: mapa + panel derecho */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Mapa con geolocalización GPS del dispositivo */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <IconLocation />
                                <h2 className="text-sm font-bold text-[#2B2D42] uppercase tracking-wide">Ubicación en vivo</h2>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#8D99AE]">
                                <IconClock />
                                Ubicacion
                            </div>
                        </div>
                        <LocationMap />
                    </div>

                    {/* Panel derecho: emergencias + contactos */}
                    <div className="flex flex-col gap-4">
                        {/* Números de emergencia Colombia */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-[#EF233C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>
                                <h2 className="text-sm font-bold text-[#2B2D42] uppercase tracking-wide">Emergencias</h2>
                            </div>
                            <EmergencyRow name="Policía Nacional"  number="123" bg="bg-[#2B2D42]"   />
                            <EmergencyRow name="Bomberos"          number="119" bg="bg-orange-500" />
                            <EmergencyRow name="Cruz Roja"         number="132" bg="bg-[#EF233C]"  />
                            <EmergencyRow name="Defensa Civil"     number="144" bg="bg-[#8D99AE]"  />
                            <EmergencyRow name="GAULA"             number="165" bg="bg-[#2B2D42]"  />
                        </div>

                        {/* Contactos personales de emergencia */}
                        <ContactsPanel />
                    </div>
                </div>
            </main>
        </div>
    );
}
