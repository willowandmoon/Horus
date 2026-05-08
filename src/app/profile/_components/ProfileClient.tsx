"use client";

import { useEffect, useRef, useState } from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Profile {
    id: string;
    email: string;
    nfcTagId: string | null;
    createdAt: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    gender: string | null;
    bloodType: string | null;
    identificationNumber: string | null;
    identificationType: string | null;
    photoUrl: string | null;
    phone: string;
    location: string;
}

interface EditForm {
    firstName: string;
    lastName: string;
    phone: string;
    location: string;
    dateOfBirth: string;
    gender: string;
    bloodType: string;
    identificationNumber: string;
    identificationType: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BLOOD_LABELS: Record<string, string> = {
    A_POSITIVE: "A+", A_NEGATIVE: "A-",
    B_POSITIVE: "B+", B_NEGATIVE: "B-",
    AB_POSITIVE: "AB+", AB_NEGATIVE: "AB-",
    O_POSITIVE: "O+", O_NEGATIVE: "O-",
};

const GENDER_LABELS: Record<string, string> = {
    MALE: "Masculino", FEMALE: "Femenino",
    OTHER: "Otro", PREFER_NOT_TO_SAY: "Prefiero no decir",
};

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

function toDateInput(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toISOString().slice(0, 10);
}

function getMemberYear(iso: string): string {
    return new Date(iso).getFullYear().toString();
}

function getHandle(email: string): string {
    return "@" + email.split("@")[0];
}

// ── Iconos ────────────────────────────────────────────────────────────────────

function IconPerson() {
    return (
        <svg className="w-10 h-10 text-[#8D99AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
    );
}

function IconCamera() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
    );
}

function IconEdit() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
    );
}

function IconMail() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
    );
}

function IconPhone() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
        </svg>
    );
}

function IconLocation() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
    );
}

function IconCalendar() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
    );
}

function IconShield() {
    return (
        <svg className="w-5 h-5 text-[#EF233C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
    );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-[#EDF2F4] last:border-0">
            <div className="w-8 h-8 rounded-full bg-[#EDF2F4] flex items-center justify-center text-[#EF233C] shrink-0 mt-0.5">
                {icon}
            </div>
            <div>
                <p className="text-xs text-[#8D99AE]">{label}</p>
                <p className="text-sm font-medium text-[#2B2D42]">{value || "—"}</p>
            </div>
        </div>
    );
}

function StatusChip({ label, value, active }: { label: string; value: string; active?: boolean }) {
    return (
        <div className="bg-[#EDF2F4] rounded-xl p-3">
            <p className="text-xs text-[#8D99AE] mb-0.5">{label}</p>
            <p className={`text-sm font-semibold ${active ? "text-green-500" : "text-[#2B2D42]"}`}>{value}</p>
        </div>
    );
}

function FieldInput({
    label, name, value, onChange, type = "text", children,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    type?: string;
    children?: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-xs text-[#8D99AE] font-medium block mb-1">{label}</label>
            {children ?? (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full border border-[#EDF2F4] rounded-xl px-4 py-2.5 text-sm text-[#2B2D42] outline-none focus:border-[#EF233C] transition-colors bg-white"
                />
            )}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ProfileClient({ userId }: { userId: string }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<EditForm>({
        firstName: "", lastName: "", phone: "", location: "",
        dateOfBirth: "", gender: "", bloodType: "",
        identificationNumber: "", identificationType: "",
    });
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Silencia warning de userId no usado — se usa implícitamente para invalidar caché si se expande
    void userId;

    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((data: Profile) => {
                setProfile(data);
                setForm({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    location: data.location,
                    dateOfBirth: toDateInput(data.dateOfBirth),
                    gender: data.gender ?? "",
                    bloodType: data.bloodType ?? "",
                    identificationNumber: data.identificationNumber ?? "",
                    identificationType: data.identificationType ?? "",
                });
            })
            .finally(() => setLoading(false));
    }, []);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSave() {
        setSaving(true);
        await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...form,
                dateOfBirth: form.dateOfBirth || null,
                gender: form.gender || null,
                bloodType: form.bloodType || null,
                identificationNumber: form.identificationNumber || null,
                identificationType: form.identificationType || null,
            }),
        });
        setProfile((prev) =>
            prev
                ? {
                      ...prev,
                      ...form,
                      dateOfBirth: form.dateOfBirth || null,
                      gender: form.gender || null,
                      bloodType: form.bloodType || null,
                  }
                : prev
        );
        setEditing(false);
        setSaving(false);
    }

    async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        const fd = new FormData();
        fd.append("photo", file);
        const res = await fetch("/api/profile/photo", { method: "POST", body: fd });
        const { photoUrl } = await res.json() as { photoUrl: string };
        setProfile((prev) => (prev ? { ...prev, photoUrl } : prev));
        setUploadingPhoto(false);
        // Limpia el input para permitir subir el mismo archivo dos veces
        e.target.value = "";
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="bg-white rounded-2xl h-52 shadow-sm" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl h-56 shadow-sm" />
                    <div className="bg-white rounded-2xl h-56 shadow-sm" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <p className="text-sm text-[#8D99AE]">No se pudo cargar el perfil. Intenta recargar la página.</p>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Tarjeta de cabecera ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Banner rojo */}
                <div className="h-28 bg-[#EF233C]" />

                <div className="px-6 pb-6 -mt-10">
                    <div className="flex items-end justify-between gap-4">
                        {/* Avatar con botón de cámara */}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-[#2B2D42] overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
                                {profile.photoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={profile.photoUrl}
                                        alt="Foto de perfil"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <IconPerson />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#EF233C] text-white flex items-center justify-center hover:bg-[#D90429] transition-colors disabled:opacity-60 shadow"
                                title="Cambiar foto"
                            >
                                {uploadingPhoto ? (
                                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                    </svg>
                                ) : (
                                    <IconCamera />
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoChange}
                            />
                        </div>

                        {/* Botón editar (solo en modo visualización) */}
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EF233C] text-white text-sm font-semibold hover:bg-[#D90429] transition-colors self-end"
                            >
                                <IconEdit />
                                Editar perfil
                            </button>
                        )}
                    </div>

                    {/* Nombre y meta */}
                    <div className="mt-3">
                        <h2 className="text-xl font-bold text-[#2B2D42]">
                            {profile.firstName} {profile.lastName}
                        </h2>
                        <p className="text-sm text-[#8D99AE]">
                            {getHandle(profile.email)} · Miembro desde {getMemberYear(profile.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Modo edición ─────────────────────────────────────────────── */}
            {editing && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-sm font-bold text-[#2B2D42] uppercase tracking-wide mb-5">Editar información</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldInput label="Nombre" name="firstName" value={form.firstName} onChange={handleChange} />
                        <FieldInput label="Apellido" name="lastName" value={form.lastName} onChange={handleChange} />
                        <FieldInput label="Teléfono" name="phone" value={form.phone} onChange={handleChange} type="tel" />
                        <FieldInput label="Ciudad / Ubicación" name="location" value={form.location} onChange={handleChange} />
                        <FieldInput label="Fecha de nacimiento" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} type="date" />
                        <FieldInput label="Número de identificación" name="identificationNumber" value={form.identificationNumber} onChange={handleChange} />
                        <FieldInput label="Tipo de identificación" name="identificationType" value={form.identificationType} onChange={handleChange}>
                            <select
                                name="identificationType"
                                value={form.identificationType}
                                onChange={handleChange}
                                className="w-full border border-[#EDF2F4] rounded-xl px-4 py-2.5 text-sm text-[#2B2D42] outline-none focus:border-[#EF233C] transition-colors bg-white"
                            >
                                <option value="">Selecciona un tipo</option>
                                <option value="CC">CC — Cédula de Ciudadanía</option>
                                <option value="TI">TI — Tarjeta de Identidad</option>
                                <option value="RC">RC — Registro Civil de Nacimiento</option>
                                <option value="CE">CE — Cédula de Extranjería</option>
                                <option value="PA">PA — Pasaporte</option>
                                <option value="PEP">PEP — Permiso Especial de Permanencia</option>
                                <option value="PPT">PPT — Permiso por Protección Temporal</option>
                                <option value="NIT">NIT — Número de Identificación Tributaria</option>
                            </select>
                        </FieldInput>

                        <FieldInput label="Género" name="gender" value={form.gender} onChange={handleChange}>
                            <select
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                                className="w-full border border-[#EDF2F4] rounded-xl px-4 py-2.5 text-sm text-[#2B2D42] outline-none focus:border-[#EF233C] transition-colors bg-white"
                            >
                                <option value="">Sin especificar</option>
                                <option value="MALE">Masculino</option>
                                <option value="FEMALE">Femenino</option>
                                <option value="OTHER">Otro</option>
                                <option value="PREFER_NOT_TO_SAY">Prefiero no decir</option>
                            </select>
                        </FieldInput>

                        <FieldInput label="Tipo de sangre" name="bloodType" value={form.bloodType} onChange={handleChange}>
                            <select
                                name="bloodType"
                                value={form.bloodType}
                                onChange={handleChange}
                                className="w-full border border-[#EDF2F4] rounded-xl px-4 py-2.5 text-sm text-[#2B2D42] outline-none focus:border-[#EF233C] transition-colors bg-white"
                            >
                                <option value="">Sin especificar</option>
                                {Object.entries(BLOOD_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </FieldInput>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-[#EF233C] text-white text-sm font-semibold hover:bg-[#D90429] transition-colors disabled:opacity-60"
                        >
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl border border-[#EDF2F4] text-sm font-medium text-[#8D99AE] hover:text-[#2B2D42] hover:border-[#8D99AE] transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* ── Tarjetas de información (solo en modo visualización) ───────── */}
            {!editing && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información personal */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="text-xs font-bold text-[#2B2D42] uppercase tracking-wide mb-1">Información Personal</h3>
                        <div className="mt-3">
                            <InfoRow icon={<IconMail />} label="Email" value={profile.email} />
                            <InfoRow icon={<IconPhone />} label="Teléfono" value={profile.phone} />
                            <InfoRow icon={<IconLocation />} label="Ubicación" value={profile.location} />
                            <InfoRow icon={<IconCalendar />} label="Fecha de nacimiento" value={formatDate(profile.dateOfBirth)} />
                            {profile.gender && (
                                <InfoRow
                                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>}
                                    label="Género"
                                    value={GENDER_LABELS[profile.gender] ?? profile.gender}
                                />
                            )}
                            {profile.bloodType && (
                                <InfoRow
                                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>}
                                    label="Tipo de sangre"
                                    value={BLOOD_LABELS[profile.bloodType] ?? profile.bloodType}
                                />
                            )}
                        </div>
                    </div>

                    {/* Mi manilla Horus */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="text-xs font-bold text-[#2B2D42] uppercase tracking-wide mb-4">Mi Manilla Horus</h3>

                        <div className="flex items-center gap-3 p-4 border border-[#EDF2F4] rounded-xl mb-4">
                            <IconShield />
                            <div>
                                <p className="text-sm font-bold text-[#2B2D42]">Horus Pro · Negro</p>
                                <p className="text-xs text-[#8D99AE]">
                                    ID: {profile.nfcTagId ?? "No registrada"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <StatusChip label="NFC" value="Activo" active />
                            <StatusChip label="GPS" value="Activo" active />
                            <StatusChip label="Batería" value="85%" />
                            <StatusChip label="Firmware" value="v2.4.1" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
