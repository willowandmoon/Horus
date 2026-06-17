import Link from "next/link";
import LoginForm from "./_components/LoginForm";
import AuthShapes from "@/src/components/AuthShapes";

export const metadata = {
    title: "Iniciar sesión · Horus",
    description: "Accede a tu cuenta Horus y protege a los que más quieres.",
};

export default function LoginPage() {
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

            {/* ── Panel izquierdo: formulario con gradiente ── */}
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
                padding: "0 52px 0 44px",
                overflowY: "auto",
            }}>
                <div style={{ maxWidth: "340px", display: "flex", flexDirection: "column", gap: "28px" }}>

                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            width: "36px", height: "36px",
                            background: "#1A1512",
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#FAD957" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                            </svg>
                        </div>
                        <span style={{ fontWeight: 900, letterSpacing: "0.2em", fontSize: "14px", textTransform: "uppercase", color: "#1A1512" }}>
                            Horus
                        </span>
                    </div>

                    {/* Título */}
                    <div>
                        <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#1A1512", lineHeight: 1.05, letterSpacing: "-1px", margin: 0 }}>
                            Bienvenido<br />de vuelta
                        </h1>
                        <p style={{ fontSize: "13px", color: "#9B928A", fontWeight: 500, marginTop: "8px" }}>
                            Monitorea tu salud con tu manilla Horus.
                        </p>
                    </div>

                    <LoginForm />

                    <p style={{ fontSize: "13px", color: "#9B928A", fontWeight: 500 }}>
                        ¿No tienes cuenta?{" "}
                        <Link href="/register" style={{ fontWeight: 700, color: "#1A1512", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                            Regístrate
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
