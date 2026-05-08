import Link from "next/link";
import RegisterForm from "./_components/RegisterForm";
import SplineScene from "./_components/SplineScene";
import EyeOfHorusIcon from "@/src/components/EyeOfHorusIcon";
import VoiceGreeting from "@/src/components/VoiceGreeting";

export const metadata = {
    title: "Crear cuenta · Horus Braslet",
    description: "Únete a la red de protección inteligente con tecnología NFC.",
};

export default function RegisterPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#07080e]">
            <VoiceGreeting message="Bienvenido a Horus Braslet. Crea tu cuenta y protege a los que más quieres." />

            {/* ── Animación de fondo completa ───────────────────────────────── */}
            <div className="absolute inset-0 z-0">
                <SplineScene />
            </div>

            {/* ── Overlay oscuro de izquierda a derecha ─────────────────────── */}
            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                    background: "linear-gradient(to right, rgba(7,8,14,0.58) 0%, rgba(7,8,14,0.38) 40%, rgba(7,8,14,0.08) 65%, rgba(7,8,14,0.0) 100%)",
                }}
            />

            {/* ── Header ───────────────────────────────────────────────────── */}
            <header className="relative z-10 flex items-center px-8 lg:px-14 py-6">
                <div className="flex items-center gap-3">
                    <EyeOfHorusIcon className="w-8 h-6" />
                    <span className="text-white font-bold tracking-widest text-sm uppercase">
                        Horus Braslet
                    </span>
                </div>
            </header>

            {/* ── Formulario ────────────────────────────────────────────────── */}
            <div className="relative z-10 flex items-center min-h-[calc(100vh-80px)]">
                <div className="w-full lg:w-[46%] px-8 lg:px-14 xl:px-20 py-8 flex flex-col justify-center">
                    <p className="text-[#EF233C] text-xs font-semibold uppercase tracking-[0.22em] mb-5">
                        Registro
                    </p>
                    <h1 className="text-4xl lg:text-[3.25rem] font-bold text-white leading-[1.15] mb-3">
                        Crea tu<br className="hidden sm:block" /> cuenta
                    </h1>
                    <p className="text-[#8D99AE] text-sm mb-9 leading-relaxed max-w-sm">
                        Únete a la red de protección inteligente con tecnología NFC y GPS.
                    </p>

                    <RegisterForm />

                    <p className="text-center text-sm text-[#8D99AE] mt-7">
                        ¿Ya tienes cuenta?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-[#EF233C] hover:text-[#D90429] transition-colors"
                        >
                            Inicia Sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
