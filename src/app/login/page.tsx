import Link from "next/link";
import LoginForm from "./_components/LoginForm";
import SplineScene from "./_components/SplineScene";
import EyeOfHorusIcon from "@/src/components/EyeOfHorusIcon";
import VoiceGreeting from "@/src/components/VoiceGreeting";

export const metadata = {
    title: "Iniciar sesión · Horus Braslet",
    description: "Accede a tu cuenta Horus Braslet y protege a los que más quieres.",
};

export default function LoginPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#07080e]">
            <VoiceGreeting message="Hola de nuevo. Inicia sesión para continuar." />

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
                        Acceso Seguro
                    </p>
                    <h1 className="text-4xl lg:text-[3.25rem] font-bold text-white leading-[1.15] mb-3">
                        Bienvenido<br className="hidden sm:block" /> de vuelta
                    </h1>
                    <p className="text-[#8D99AE] text-sm mb-9 leading-relaxed max-w-sm">
                        Ingresa tus credenciales para acceder a tu cuenta y monitorear tu manilla Horus.
                    </p>

                    <LoginForm />

                    <p className="text-center text-sm text-[#8D99AE] mt-7">
                        ¿No tienes cuenta?{" "}
                        <Link
                            href="/register"
                            className="font-semibold text-[#EF233C] hover:text-[#D90429] transition-colors"
                        >
                            Regístrate
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
