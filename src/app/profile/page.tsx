import { redirect } from "next/navigation";
import { authGuard } from "@/src/shared/lib/auth.guard";
import LogoutButton from "@/src/app/dashboard/_components/LogoutButton";
import ProfileClient from "./_components/ProfileClient";
import FloatingSidebar from "@/src/components/FloatingSidebar";

export default async function ProfilePage() {
    try {
        await authGuard();
    } catch {
        redirect("/login");
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#F2F1EC] text-[#1C1917]">
            {/* ── Barra superior móvil ── */}
            <header className="lg:hidden flex items-center justify-between bg-white border-b border-[#E4E2DC] px-6 py-4 shrink-0">
                <div className="flex items-center gap-2.5 ml-14">
                    <img src="/uploads/profiles/horus-modo-claro.svg" alt="Logo" className="w-9 h-9 object-contain dark:hidden" />
                    <img src="/uploads/profiles/horus-modo-oscuro.svg" alt="Logo" className="hidden w-9 h-9 object-contain dark:block" />
                    <span className="text-[#1C1917] font-black tracking-widest text-sm uppercase dark:text-white">Horus</span>
                </div>
                <LogoutButton compact />
            </header>

            {/* ── Sidebar Flotante ── */}
            <FloatingSidebar />

            {/* ── Main ── */}
            <main className="flex-1 pl-20 p-6 md:p-10 overflow-y-auto w-full max-w-[1400px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-[#1C1917]">Mi Perfil</h1>
                    <p className="text-sm text-[#8D99AE] font-semibold mt-1">Configura tus datos de salud y contacto</p>
                </div>
                <ProfileClient />
            </main>
        </div>
    );
}
