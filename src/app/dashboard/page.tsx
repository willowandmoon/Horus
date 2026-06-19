import { redirect } from "next/navigation";
import { authGuard } from "@/src/shared/lib/auth.guard";
import { AuthRepositoryImpl } from "@/src/infrastructure/repositories/auth.repository.impl";
import LogoutButton from "./_components/LogoutButton";
import LocationMap from "./_components/LocationMap";
import ContactsPanel from "./_components/ContactsPanel";
import WeatherCard from "./_components/WeatherCard";
import ChatButton from "./_components/ChatButton";
import FloatingSidebar from "@/src/components/FloatingSidebar";

function IconPhone()    { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>; }
function IconLocation() { return <svg className="w-4 h-4 text-[#E62B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>; }
function IconClock()    { return <svg className="w-4 h-4 text-[#8D99AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>; }

function EmergencyRow({ name, number, bg }: { name: string; number: string; bg: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-[#E4E2DC] last:border-0">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${bg}`}>
                    <IconPhone />
                </div>
                <div>
                    <p className="text-sm font-semibold text-[#1C1917]">{name}</p>
                    <p className="text-xs text-[#8D99AE]">{number}</p>
                </div>
            </div>
            <a
                href={`tel:${number}`}
                className="text-[#8D99AE] hover:text-[#E62B34] transition-colors"
                title={`Llamar al ${number}`}
            >
                <IconPhone />
            </a>
        </div>
    );
}

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
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#F2F1EC] text-[#1C1917]">
            {/* ── Barra superior móvil (limpia e integrada) ── */}
            <header className="lg:hidden flex items-center justify-between bg-white border-b border-[#E4E2DC] px-6 py-4 shrink-0">
                <div className="flex items-center gap-2.5 ml-14">
                    <img src="/gato.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-[#1C1917] font-black tracking-widest text-sm uppercase">Horus</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#96C979] animate-pulse"/>
                        <span className="text-xs text-[#8D99AE] font-bold">Conectada</span>
                    </div>
                    <LogoutButton compact />
                </div>
            </header>

            {/* ── Sidebar Flotante Izquierdo ── */}
            <FloatingSidebar />

            {/* ── Main Content Area ── */}
            <main className="flex-1 pl-20 p-6 md:p-10 overflow-y-auto w-full max-w-[1400px] mx-auto">
                {/* Encabezado del Dashboard */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-[#1C1917]">Dashboard</h1>
                        <p className="text-[#8D99AE] text-sm mt-1 font-semibold">
                            Hola, <span className="font-bold text-[#1C1917]">{firstName}</span> · Monitorea tu manilla Horus en tiempo real
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2.5 bg-white rounded-2xl px-4 py-2 border border-[#E4E2DC] shadow-sm self-start">
                        <span className="w-2 h-2 rounded-full bg-[#96C979] animate-pulse"/>
                        <span className="text-sm font-bold text-[#1C1917]">Manilla conectada</span>
                    </div>
                </div>

                {/* Grid Superior: Chatbot IA y Clima */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <ChatButton />
                    <WeatherCard />
                </div>

                {/* Grid Principal: Mapa GPS y Paneles de Emergencia/Contactos */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Panel del Mapa (2 columnas de ancho en pantallas grandes) */}
                    <div className="xl:col-span-2 bg-white rounded-[32px] p-6 shadow-sm border border-[#E4E2DC] flex flex-col min-h-[450px]">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <IconLocation />
                                <h2 className="text-sm font-extrabold text-[#1C1917] uppercase tracking-wide">Ubicación en vivo</h2>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#8D99AE] font-semibold">
                                <IconClock />
                                Actualizado recientemente
                            </div>
                        </div>
                        <div className="flex-1 w-full relative min-h-[350px]">
                            <LocationMap />
                        </div>
                    </div>

                    {/* Columna Derecha: Emergencias y Contactos Personales */}
                    <div className="flex flex-col gap-6">
                        {/* Líneas de Emergencia Oficiales */}
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#E4E2DC]">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-4 h-4 text-[#E62B34]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>
                                <h2 className="text-sm font-extrabold text-[#1C1917] uppercase tracking-wide">Líneas de Emergencia</h2>
                            </div>
                            <div className="flex flex-col">
                                <EmergencyRow name="Policía Nacional"  number="123" bg="bg-[#1C1917]" />
                                <EmergencyRow name="Bomberos"          number="119" bg="bg-[#EF7926]" />
                                <EmergencyRow name="Cruz Roja"         number="132" bg="bg-[#E62B34]" />
                                <EmergencyRow name="Defensa Civil"     number="144" bg="bg-[#8D99AE]" />
                                <EmergencyRow name="GAULA"             number="165" bg="bg-[#1C1917]" />
                            </div>
                        </div>

                        {/* Contactos de Emergencia Personales */}
                        <ContactsPanel />
                    </div>
                </div>
            </main>
        </div>
    );
}
