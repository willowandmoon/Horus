"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}
type FormErrors = Partial<Record<keyof FormState | "general", string>>;

function getStrength(pw: string): { score: number; label: string; color: string } {
    if (!pw) return { score: 0, label: "", color: "#E8E4DE" };
    let s = 0;
    if (pw.length >= 8)           s++;
    if (/[A-Z]/.test(pw))         s++;
    if (/[0-9]/.test(pw))         s++;
    if (/[^A-Za-z0-9]/.test(pw))  s++;
    return [
        { score: 1, label: "Muy débil",  color: "#EF4444" },
        { score: 2, label: "Débil",      color: "#F97316" },
        { score: 3, label: "Buena",      color: "#FAD957" },
        { score: 4, label: "Fuerte",     color: "#96C979" },
    ][Math.max(s - 1, 0)];
}

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#B0A89F" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    ) : (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#B0A89F" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    );
}

// ── Estilos compartidos ───────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(8px)",
    borderRadius: "16px",
    padding: "9px 16px 10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
    border: "none",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
};
const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    color: "#A09890",
    fontFamily: "inherit",
    letterSpacing: "0.02em",
};
const inputStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A1512",
    fontFamily: "inherit",
    padding: 0,
    width: "100%",
};

// ── Campo individual ──────────────────────────────────────────────────────────
function Field({
    label, name, type, placeholder, value, onChange, onBlur, error, suffix, autoComplete,
}: {
    label: string; name: string; type: string; placeholder: string;
    value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: () => void; error?: string; suffix?: React.ReactNode; autoComplete?: string;
}) {
    return (
        <div>
            <div style={{ ...cardStyle, ...(error ? { boxShadow: "0 0 0 1.5px #EF4444, 0 2px 8px rgba(0,0,0,0.05)" } : {}) }}>
                <label style={labelStyle}>{label}</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                        name={name} type={type} placeholder={placeholder}
                        value={value} onChange={onChange} onBlur={onBlur}
                        autoComplete={autoComplete}
                        style={{ ...inputStyle, flex: 1 }}
                    />
                    {suffix}
                </div>
            </div>
            {error && (
                <p style={{ color: "#EF4444", fontSize: "11px", fontWeight: 600, marginTop: "4px", paddingLeft: "6px" }}>
                    {error}
                </p>
            )}
        </div>
    );
}

// ── Formulario principal ──────────────────────────────────────────────────────
export default function RegisterForm() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
    const [errors, setErrors] = useState<FormErrors>({});
    const [emailTouched, setEmailTouched] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        setErrors(p => ({ ...p, [name]: undefined }));
    }

    function validate(): FormErrors {
        const e: FormErrors = {};
        if (!form.firstName.trim()) e.firstName = "El nombre es requerido";
        if (!form.lastName.trim()) e.lastName = "El apellido es requerido";
        if (!form.email.trim()) e.email = "El correo es requerido";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Formato inválido";
        if (!form.password) e.password = "La contraseña es requerida";
        else if (form.password.length < 8) e.password = "Mínimo 8 caracteres";
        if (!form.confirmPassword) e.confirmPassword = "Confirma tu contraseña";
        else if (form.password !== form.confirmPassword) e.confirmPassword = "Las contraseñas no coinciden";
        return e;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setEmailTouched(true);
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        setErrors({});
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (res.ok) router.push("/dashboard");
            else {
                const d = await res.json();
                setErrors({ general: d.message || "Error al registrarse" });
            }
        } catch {
            setErrors({ general: "Error de conexión. Inténtalo de nuevo." });
        } finally {
            setLoading(false);
        }
    }

    const { score, label: strengthLabel, color: strengthColor } = getStrength(form.password);
    const confirmMatch = form.confirmPassword ? form.password === form.confirmPassword : null;

    return (
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {errors.general && (
                <div style={{ background: "#FEF2F2", borderRadius: "16px", padding: "12px 18px", color: "#DC2626", fontSize: "13px", fontWeight: 600 }}>
                    {errors.general}
                </div>
            )}

            {/* Nombre + Apellido en grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label="Nombre" name="firstName" type="text" placeholder="xxx"
                    value={form.firstName} onChange={handleChange} error={errors.firstName} autoComplete="given-name" />
                <Field label="Apellido" name="lastName" type="text" placeholder="xxx"
                    value={form.lastName} onChange={handleChange} error={errors.lastName} autoComplete="family-name" />
            </div>

            {/* Correo */}
            <Field
                label="Correo" name="email" type="email" placeholder="tu@correo.com"
                value={form.email} onChange={handleChange}
                onBlur={() => setEmailTouched(true)}
                error={errors.email}
                autoComplete="email"
                suffix={emailTouched && form.email && !errors.email ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#96C979" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                ) : undefined}
            />

            {/* Contraseña */}
            <div>
                <Field
                    label="Contraseña" name="password"
                    type={showPw ? "text" : "password"} placeholder="••••••••"
                    value={form.password} onChange={handleChange} error={errors.password}
                    autoComplete="new-password"
                    suffix={
                        <button type="button" onClick={() => setShowPw(v => !v)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0, flexShrink: 0 }}>
                            <EyeIcon open={showPw} />
                        </button>
                    }
                />
                {form.password && (
                    <div style={{ marginTop: "8px", paddingLeft: "4px" }}>
                        <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{
                                    flex: 1, height: "4px", borderRadius: "99px",
                                    background: i <= score ? strengthColor : "#E4E0D9",
                                    transition: "background 0.3s",
                                }} />
                            ))}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: strengthColor }}>{strengthLabel}</span>
                    </div>
                )}
            </div>

            {/* Confirmar contraseña */}
            <Field
                label="Confirmar contraseña" name="confirmPassword"
                type={showConfirm ? "text" : "password"} placeholder="••••••••"
                value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
                autoComplete="new-password"
                suffix={
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        {confirmMatch === true && (
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#96C979" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        )}
                        {confirmMatch === false && (
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        )}
                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
                            <EyeIcon open={showConfirm} />
                        </button>
                    </div>
                }
            />

            {/* Espacio reservado para mantener el diseño limpio */}
            <div style={{ height: "16px" }} />

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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "4px",
                    letterSpacing: "0.01em",
                    transition: "opacity 0.15s, transform 0.1s",
                    opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                onMouseDown={e => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            >
                {loading ? (
                    <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                            <circle opacity={0.25} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                            <path opacity={0.75} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Creando cuenta...
                    </>
                ) : "Crear cuenta →"}
            </button>
        </form>
    );
}
