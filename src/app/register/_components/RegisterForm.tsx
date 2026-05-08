"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface FormState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

// ── Nivel de seguridad de contraseña ─────────────────────────────────────────

interface Strength {
    score: number; // 0–4
    label: string;
    color: string;
    textColor: string;
}

function getStrength(pw: string): Strength {
    if (!pw) return { score: 0, label: "", color: "bg-gray-200", textColor: "" };
    let score = 0;
    if (pw.length >= 8)            score++;
    if (/[A-Z]/.test(pw))          score++;
    if (/[0-9]/.test(pw))          score++;
    if (/[^A-Za-z0-9]/.test(pw))   score++;

    const levels: Strength[] = [
        { score: 1, label: "Muy débil",  color: "bg-red-500",    textColor: "text-red-500"    },
        { score: 2, label: "Débil",      color: "bg-orange-400", textColor: "text-orange-400" },
        { score: 3, label: "Buena",      color: "bg-yellow-400", textColor: "text-yellow-500" },
        { score: 4, label: "Fuerte",     color: "bg-green-500",  textColor: "text-green-600"  },
    ];

    // Si el usuario empezó a escribir, el mínimo visible es nivel 1
    const idx = Math.max(score - 1, 0);
    return { ...levels[idx], score: Math.max(score, 1) };
}

// ── Validación del formulario al enviar ───────────────────────────────────────

function validateForm(data: FormState): FormErrors {
    const errors: FormErrors = {};

    if (!data.firstName.trim())
        errors.firstName = "El nombre es requerido";
    else if (data.firstName.trim().length < 2)
        errors.firstName = "Mínimo 2 caracteres";

    if (!data.lastName.trim())
        errors.lastName = "El apellido es requerido";
    else if (data.lastName.trim().length < 2)
        errors.lastName = "Mínimo 2 caracteres";

    if (!data.email.trim())
        errors.email = "El correo es requerido";
    else if (!data.email.includes("@"))
        errors.email = "El correo debe contener @";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        errors.email = "Formato de correo inválido";

    if (!data.password)
        errors.password = "La contraseña es requerida";
    else if (data.password.length < 8)
        errors.password = "Mínimo 8 caracteres";
    else if (!/[A-Z]/.test(data.password))
        errors.password = "Debe incluir al menos una mayúscula";
    else if (!/[0-9]/.test(data.password))
        errors.password = "Debe incluir al menos un número";

    if (!data.confirmPassword)
        errors.confirmPassword = "Confirma tu contraseña";
    else if (data.password !== data.confirmPassword)
        errors.confirmPassword = "Las contraseñas no coinciden";

    return errors;
}

// ── Iconos ────────────────────────────────────────────────────────────────────

function IconPerson() {
    return (
        <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
    );
}

function IconMail({ hasError }: { hasError?: boolean }) {
    return (
        <svg className={`w-5 h-5 shrink-0 ${hasError ? "text-red-400" : "text-white/50"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
    );
}

function IconLock() {
    return (
        <svg className="w-5 h-5 text-white/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
    );
}

function IconEye({ visible }: { visible: boolean }) {
    return visible ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    );
}

function IconCheck() {
    return (
        <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

function IconX() {
    return (
        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    );
}

// ── Barra visual de seguridad de contraseña ───────────────────────────────────

function StrengthMeter({ password }: { password: string }) {
    if (!password) return null;
    const { score, label, color, textColor } = getStrength(password);

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : "bg-white/15"}`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${textColor}`}>{label}</p>
        </div>
    );
}

// ── Componente principal del formulario ───────────────────────────────────────

export default function RegisterForm() {
    const router = useRouter();

    const [form, setForm] = useState<FormState>({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [emailTouched, setEmailTouched] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    // ── Error de correo en tiempo real (al salir del campo) ──────────────────
    const emailLiveError: string | undefined = (() => {
        if (!emailTouched || !form.email) return undefined;
        if (!form.email.includes("@")) return "El correo debe contener @";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Formato de correo inválido";
        return undefined;
    })();

    // ── Estado de coincidencia de contraseña en tiempo real ──────────────────
    const confirmStatus: "match" | "mismatch" | null = (() => {
        if (!form.confirmPassword) return null;
        return form.password === form.confirmPassword ? "match" : "mismatch";
    })();

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Limpiar el error de envío anterior cuando el usuario edita
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

    function handleEmailBlur() {
        setEmailTouched(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setEmailTouched(true);
        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                router.push("/dashboard");
            } else {
                const data = await res.json();
                setErrors({ general: data.message || "Error al registrarse" });
            }
        } catch {
            setErrors({ general: "Error de conexión. Inténtalo de nuevo." });
        } finally {
            setLoading(false);
        }
    }

    const activeEmailError = emailLiveError ?? errors.email;

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            {errors.general && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                    {errors.general}
                </div>
            )}

            {/* Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-3">
                {(["firstName", "lastName"] as const).map((field) => (
                    <div key={field}>
                        <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors ${errors[field] ? "border-red-400 bg-red-500/10" : "border-white/15 bg-white/8 focus-within:border-[#EF233C]"}`}>
                            <IconPerson />
                            <input
                                name={field}
                                type="text"
                                placeholder={field === "firstName" ? "Nombre" : "Apellido"}
                                value={form[field]}
                                onChange={handleChange}
                                autoComplete="off"
                                className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none min-w-0"
                            />
                        </div>
                        {errors[field] && (
                            <p className="mt-1 text-xs text-red-500 pl-1">{errors[field]}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Email */}
            <div>
                <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors ${activeEmailError ? "border-red-400 bg-red-500/10" : "border-white/15 bg-white/8 focus-within:border-[#EF233C]"}`}>
                    <IconMail hasError={!!activeEmailError} />
                    <input
                        name="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleEmailBlur}
                        autoComplete="off"
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
                    />
                    {emailTouched && form.email && !activeEmailError && (
                        <IconCheck />
                    )}
                </div>
                {activeEmailError && (
                    <p className="mt-1 text-xs text-red-500 pl-1">{activeEmailError}</p>
                )}
            </div>

            {/* Contraseña */}
            <div>
                <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors ${errors.password ? "border-red-400 bg-red-500/10" : "border-white/15 bg-white/8 focus-within:border-[#EF233C]"}`}>
                    <IconLock />
                    <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-white/50 hover:text-white/80 transition-colors"
                        tabIndex={-1}
                    >
                        <IconEye visible={showPassword} />
                    </button>
                </div>
                {errors.password && (
                    <p className="mt-1 text-xs text-red-500 pl-1">{errors.password}</p>
                )}
                <StrengthMeter password={form.password} />
            </div>

            {/* Confirmar contraseña */}
            <div>
                <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors ${
                    confirmStatus === "mismatch" || errors.confirmPassword
                        ? "border-red-400 bg-red-500/10"
                        : confirmStatus === "match"
                        ? "border-green-400 bg-green-500/10"
                        : "border-white/15 bg-white/8 focus-within:border-[#EF233C]"
                }`}>
                    <IconLock />
                    <input
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirmar contraseña"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
                    />
                    {/* icono de match en tiempo real */}
                    {confirmStatus === "match" && <IconCheck />}
                    {confirmStatus === "mismatch" && <IconX />}
                    <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="text-white/50 hover:text-white/80 transition-colors"
                        tabIndex={-1}
                    >
                        <IconEye visible={showConfirm} />
                    </button>
                </div>
                {/* feedback en tiempo real */}
                {confirmStatus === "match" && (
                    <p className="mt-1 text-xs text-green-600 pl-1 flex items-center gap-1">
                        <IconCheck /> Las contraseñas coinciden
                    </p>
                )}
                {confirmStatus === "mismatch" && (
                    <p className="mt-1 text-xs text-red-500 pl-1 flex items-center gap-1">
                        <IconX /> Las contraseñas no coinciden
                    </p>
                )}
                {errors.confirmPassword && !confirmStatus && (
                    <p className="mt-1 text-xs text-red-500 pl-1">{errors.confirmPassword}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-[#EF233C] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#D90429] disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </button>
        </form>
    );
}
