"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#B8B0A6" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    ) : (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#B8B0A6" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    );
}

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: typeof errors = {};
        if (!email.trim()) errs.email = "El correo es requerido";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Formato inválido";
        if (!password) errs.password = "La contraseña es requerida";
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        setErrors({});
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) router.push("/dashboard");
            else {
                const d = await res.json();
                setErrors({ general: d.message || "Correo o contraseña incorrectos" });
            }
        } catch {
            setErrors({ general: "Error de conexión. Inténtalo de nuevo." });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {errors.general && (
                <div style={{
                    background: "#FEF2F2", borderRadius: "14px",
                    padding: "10px 16px", color: "#DC2626",
                    fontSize: "12px", fontWeight: 600,
                }}>
                    {errors.general}
                </div>
            )}

            {/* ── Campo Correo ── */}
            <div>
                <div style={{
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "16px",
                    padding: "9px 16px 10px",
                    boxShadow: errors.email
                        ? "0 0 0 1.5px #EF4444, 0 2px 8px rgba(0,0,0,0.05)"
                        : "0 2px 10px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
                    display: "flex", flexDirection: "column", gap: "2px",
                }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#A8A09A", letterSpacing: "0.02em" }}>
                        Correo
                    </label>
                    <input
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                        autoComplete="email"
                        style={{
                            background: "transparent", border: "none", outline: "none",
                            fontSize: "15px", fontWeight: 700, color: "#1A1512",
                            fontFamily: "inherit", padding: 0,
                        }}
                    />
                </div>
                {errors.email && <p style={{ color: "#EF4444", fontSize: "11px", fontWeight: 600, marginTop: "4px", paddingLeft: "6px" }}>{errors.email}</p>}
            </div>

            {/* ── Campo Contraseña ── */}
            <div>
                <div style={{
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "16px",
                    padding: "9px 16px 10px",
                    boxShadow: errors.password
                        ? "0 0 0 1.5px #EF4444, 0 2px 8px rgba(0,0,0,0.05)"
                        : "0 2px 10px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
                    display: "flex", flexDirection: "column", gap: "2px",
                }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#A8A09A", letterSpacing: "0.02em" }}>
                        Contraseña
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input
                            type={showPw ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                            autoComplete="current-password"
                            style={{
                                flex: 1, background: "transparent", border: "none", outline: "none",
                                fontSize: "15px", fontWeight: 700, color: "#1A1512",
                                fontFamily: "inherit", padding: 0,
                            }}
                        />
                        <button type="button" onClick={() => setShowPw(v => !v)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
                            <EyeIcon open={showPw} />
                        </button>
                    </div>
                </div>
                {errors.password && <p style={{ color: "#EF4444", fontSize: "11px", fontWeight: 600, marginTop: "4px", paddingLeft: "6px" }}>{errors.password}</p>}
            </div>

            {/* ¿Olvidaste? */}
            <div style={{ textAlign: "right", marginTop: "-2px" }}>
                <a href="#" style={{ fontSize: "12px", fontWeight: 500, color: "#A8A09A", textDecoration: "none" }}>
                    ¿Olvidaste tu contraseña?
                </a>
            </div>

            {/* Botón negro */}
            <button
                type="submit"
                disabled={loading}
                style={{
                    width: "100%",
                    background: "#1A1512",
                    color: "white",
                    border: "none",
                    borderRadius: "100px",
                    padding: "15px 24px",
                    fontSize: "15px",
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "4px",
                    letterSpacing: "0.01em",
                    boxShadow: "0 4px 20px rgba(26,21,18,0.25)",
                    transition: "opacity 0.15s, transform 0.1s",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                onMouseDown={e => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            >
                {loading ? (
                    <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                            <circle opacity={0.25} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                            <path opacity={0.75} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Iniciando...
                    </>
                ) : "Iniciar sesión →"}
            </button>
        </form>
    );
}
