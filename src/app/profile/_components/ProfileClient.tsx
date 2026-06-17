"use client";

import { useEffect, useRef, useState } from "react";

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

function getAgeString(dobStr: string | null): string {
    if (!dobStr) return "";
    const birthDate = new Date(dobStr);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return ` · ${age} años`;
}

function toDateInput(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toISOString().slice(0, 10);
}

function getInitials(firstName: string, lastName: string): string {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return (f + l).toUpperCase() || "US";
}

// ── Icons ───────────────────────────────────────────────────────────────────

function IconMail() {
    return (
        <svg className="w-5 h-5 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
    );
}

function IconPhone() {
    return (
        <svg className="w-5 h-5 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
        </svg>
    );
}

function IconLocation() {
    return (
        <svg className="w-5 h-5 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
    );
}

function IconBlood() {
    return (
        <svg className="w-5 h-5 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75c-3.176-2.584-6.75-6.75-6.75-10.125a6.75 6.75 0 0 1 13.5 0c0 3.375-3.574 7.541-6.75 10.125Z" />
        </svg>
    );
}

function IconCalendar() {
    return (
        <svg className="w-5 h-5 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
    );
}

function IconCamera() {
    return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
    );
}

// ── Horizontal card list row ────────────────────────────────────────────────
function PersonalInfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-4 bg-white rounded-[24px] px-5 py-4 shadow-sm border border-[#E4E2DC] hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-full bg-[#F2F1EC] flex items-center justify-center shrink-0 border border-[#E4E2DC]">
                {icon}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-xs text-[#8D99AE] font-medium">{label}</span>
                <span className="text-sm font-semibold text-[#1C1917] truncate">{value || "—"}</span>
            </div>
        </div>
    );
}
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
        try {
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
        } finally {
            setSaving(false);
        }
    }

    async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        const fd = new FormData();
        fd.append("photo", file);
        try {
            const res = await fetch("/api/profile/photo", { method: "POST", body: fd });
            const { photoUrl } = await res.json() as { photoUrl: string };
            setProfile((prev) => (prev ? { ...prev, photoUrl } : prev));
        } finally {
            setUploadingPhoto(false);
            e.target.value = "";
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="bg-white rounded-[32px] h-60 shadow-sm" />
                <div className="space-y-4">
                    <div className="bg-white rounded-[24px] h-16 shadow-sm" />
                    <div className="bg-white rounded-[24px] h-16 shadow-sm" />
                    <div className="bg-white rounded-[24px] h-16 shadow-sm" />
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start w-full">
            {/* Columna Izquierda: Tarjeta de Perfil (Avatar y Nombre) - Siempre Visible */}
            <div className="xl:col-span-1">
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E4E2DC] flex flex-col items-center text-center relative">
                    {/* Avatar initials with Camera Overlay */}
                    <div className="relative mb-4">
                        <div className="w-[100px] h-[100px] rounded-full bg-pink text-pink-foreground flex items-center justify-center text-3xl font-extrabold shadow-inner border border-[#E4E2DC] overflow-hidden">
                            {profile.photoUrl ? (
                                <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                getInitials(profile.firstName, profile.lastName)
                           )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1C1917] flex items-center justify-center hover:bg-black transition-colors disabled:opacity-60 shadow border-none cursor-pointer text-white"
                            title="Subir foto"
                        >
                            {uploadingPhoto ? (
                                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
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

                    {/* Name and Handle */}
                    <h2 className="text-2xl font-black text-[#1C1917]">
                        {profile.firstName} {profile.lastName}
                    </h2>
                    <span className="text-sm text-[#8D99AE] font-semibold mb-5 block">
                        {profile.email}
                    </span>

                    {/* Edit Profile Button (solo visible si no estamos editando) */}
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-2 bg-[#1C1917] text-white hover:bg-black text-sm font-bold px-6 py-3 rounded-full transition-all shadow-md active:scale-95 border-none cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                            Editar perfil
                        </button>
                    )}
                </div>
            </div>

            {/* Columna Derecha: Vista de Info o Formulario de Edición */}
            <div className="xl:col-span-2">
                {!editing ? (
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-[#1C1917] px-1">Información personal</h3>

                        <PersonalInfoCard icon={<IconMail />} label="Email" value={profile.email} />
                        <PersonalInfoCard icon={<IconPhone />} label="Teléfono" value={profile.phone} />
                        <PersonalInfoCard icon={<IconLocation />} label="Ubicación" value={profile.location} />
                        <PersonalInfoCard icon={<IconBlood />} label="Tipo de sangre" value={BLOOD_LABELS[profile.bloodType ?? ""] ?? "—"} />
                        <PersonalInfoCard
                            icon={<IconCalendar />}
                            label="Fecha de nacimiento"
                            value={profile.dateOfBirth ? `${profile.dateOfBirth.slice(0, 10)}${getAgeString(profile.dateOfBirth)}` : "—"}
                        />
                    </div>
                ) : (
                    /* Edit Form Container */
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#E4E2DC] space-y-6">
                        <h3 className="text-lg font-black text-[#1C1917]">Editar información</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-[#8D99AE] font-bold block mb-1">Nombre</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-[#E4E2DC] focus:border-[#FAD957] rounded-xl px-4 py-3 text-sm text-[#1C1917] outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[#8D99AE] font-bold block mb-1">Apellido</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-[#E4E2DC] focus:border-[#FAD957] rounded-xl px-4 py-3 text-sm text-[#1C1917] outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[#8D99AE] font-bold block mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-[#E4E2DC] focus:border-[#FAD957] rounded-xl px-4 py-3 text-sm text-[#1C1917] outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[#8D99AE] font-bold block mb-1">Ciudad / Ubicación</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-[#E4E2DC] focus:border-[#FAD957] rounded-xl px-4 py-3 text-sm text-[#1C1917] outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[#8D99AE] font-bold block mb-1">Fecha de nacimiento</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-[#E4E2DC] focus:border-[#FAD957] rounded-xl px-4 py-3 text-sm text-[#1C1917] outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-[#8D99AE] font-bold block mb-1">Tipo de sangre</label>
                                <select
                                    name="bloodType"
                                    value={form.bloodType}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-[#E4E2DC] focus:border-[#FAD957] rounded-xl px-4 py-3 text-sm text-[#1C1917] outline-none transition-colors"
                                >
                                    <option value="">Sin especificar</option>
                                    {Object.entries(BLOOD_LABELS).map(([key, val]) => (
                                        <option key={key} value={key}>{val}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs text-[#8D99AE] font-bold block mb-1">Género</label>
                                <select
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-[#E4E2DC] focus:border-[#FAD957] rounded-xl px-4 py-3 text-sm text-[#1C1917] outline-none transition-colors"
                                >
                                    <option value="">Sin especificar</option>
                                    {Object.entries(GENDER_LABELS).map(([key, val]) => (
                                        <option key={key} value={key}>{val}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 bg-[#1C1917] hover:bg-black text-white text-sm font-bold py-3.5 rounded-full transition-all disabled:opacity-50 border-none cursor-pointer"
                            >
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                            <button
                                onClick={() => setEditing(false)}
                                disabled={saving}
                                className="flex-1 border border-black/10 hover:bg-[#F2F1EC] text-sm font-bold py-3.5 rounded-full transition-all text-[#8D99AE] bg-white cursor-pointer"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
