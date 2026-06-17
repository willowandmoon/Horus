import Link from "next/link";
import RegisterForm from "./_components/RegisterForm";
import AuthShapes from "@/src/components/AuthShapes";

export const metadata = {
    title: "Crear cuenta · Horus",
    description: "Únete a la red de protección inteligente con tecnología NFC.",
};

export default function RegisterPage() {
    return (
        <div style={{
            display: "flex",
            height: "100vh",
            overflow: "hidden",
            background: "#F2F1EC",
            position: "relative",
        }}>
            {/* ── Panel de figuras (fondo completo) ── */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                <AuthShapes />
            </div>

            {/* ── Panel izquierdo ── */}
            <div style={{
                position: "relative",
                zIndex: 10,
                width: "480px",
                minWidth: "480px",
                height: "100vh",
                /* Gradiente: de un solo color (amarillo pastel ultra claro) a transparente, alargado */
                background: "linear-gradient(to right, #FFF8E7 0%, #FFF8E7 20%, rgba(255,248,231,0) 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "0 52px",
                overflowY: "auto",
            }}>
                <div style={{ maxWidth: "360px", display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            width: "38px", height: "38px",
                            background: "#1A1512",
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#FAD957" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                            </svg>
                        </div>
                        <span style={{ fontWeight: 900, letterSpacing: "0.2em", fontSize: "15px", textTransform: "uppercase", color: "#1A1512" }}>
                            Horus
                        </span>
                    </div>

                    {/* Título */}
                    <div>
                        <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#1A1512", lineHeight: 1.05, letterSpacing: "-1px", margin: 0 }}>
                            Crea tu<br />cuenta
                        </h1>
                        <p style={{ fontSize: "14px", color: "#9B928A", fontWeight: 600, marginTop: "10px" }}>
                            Empieza a cuidar tu salud en minutos.
                        </p>
                    </div>

                    <RegisterForm />

                    <p style={{ fontSize: "13px", color: "#9B928A", fontWeight: 600 }}>
                        ¿Ya tienes cuenta?{" "}
                        <Link href="/login" style={{ fontWeight: 800, color: "#1A1512", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
