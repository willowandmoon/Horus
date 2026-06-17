import { redirect } from "next/navigation";
import { authGuard } from "@/src/shared/lib/auth.guard";
import LogoutButton from "@/src/app/dashboard/_components/LogoutButton";
import ProfileClient from "./_components/ProfileClient";
import FloatingSidebar from "@/src/components/FloatingSidebar";

export default async function ProfilePage() {
    let userId = "";

    try {
        const session = await authGuard();
        userId = session.sub;
    } catch {
        redirect("/login");
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#F2F1EC] text-[#1C1917]">
            {/* ── Barra superior móvil ── */}
            <header className="lg:hidden flex items-center justify-between bg-white border-b border-[#E4E2DC] px-6 py-4 shrink-0">
                <div className="flex items-center gap-2.5 ml-14">
                    <img src="/gato.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-[#1C1917] font-black tracking-widest text-sm uppercase">Horus</span>
                </div>
                <LogoutButton compact />
            </header>

            {/* ── Sidebar Flotante ── */}
            <FloatingSidebar />

            {/* ── Main ── */}
            <main className="flex-1 lg:pl-80 p-6 md:p-10 overflow-y-auto w-full max-w-[1400px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-[#1C1917]">Mi Perfil</h1>
                    <p className="text-sm text-[#8D99AE] font-semibold mt-1">Configura tus datos de salud y contacto</p>
                </div>
                <ProfileClient userId={userId} />
            </main>
        </div>
    );
}
