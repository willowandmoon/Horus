"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormState {
    email: string;
    password: string;
}

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
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

export default function LoginForm() {
    const router = useRouter();

    const [form, setForm] = useState<FormState>({ email: "", password: "" });
    const [errors, setErrors] = useState<FormErrors>({});
    const [emailTouched, setEmailTouched] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const emailLiveError: string | undefined = (() => {
        if (!emailTouched || !form.email) return undefined;
        if (!form.email.includes("@")) return "El correo debe contener @";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Formato de correo inválido";
        return undefined;
    })();

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setEmailTouched(true);

        const newErrors: FormErrors = {};
        if (!form.email.trim()) newErrors.email = "El correo es requerido";
        else if (emailLiveError) newErrors.email = emailLiveError;
        if (!form.password) newErrors.password = "La contraseña es requerida";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                router.push("/dashboard");
            } else {
                const data = await res.json();
                setErrors({ general: data.message || "Correo o contraseña incorrectos" });
            }
        } catch {
            setErrors({ general: "Error de conexión. Inténtalo de nuevo." });
        } finally {
            setLoading(false);
        }
    }

    const activeEmailError = emailLiveError ?? errors.email;

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {errors.general && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                    {errors.general}
                </div>
            )}

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
                        onBlur={() => setEmailTouched(true)}
                        autoComplete="email"
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
                    />
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
                        autoComplete="current-password"
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
            </div>

            {/* ¿Olvidaste tu contraseña? */}
            <div className="flex justify-end -mt-1">
                <a
                    href="#"
                    className="text-xs text-[#EF233C] hover:text-[#D90429] transition-colors font-medium"
                >
                    ¿Olvidaste tu contraseña?
                </a>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#EF233C] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#D90429] disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
        </form>
    );
}
