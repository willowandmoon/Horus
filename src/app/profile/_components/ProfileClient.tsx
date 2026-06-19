"use client";

import { useEffect, useRef, useState } from "react";

// ── Interfaces ────────────────────────────────────────────────────────────────

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

interface Allergy {
    id: string;
    allergenName: string;
    allergyType: string;
    severity: string;
    reactionDescription: string | null;
}

interface ChronicCondition {
    id: string;
    conditionName: string;
    severity: string | null;
    status: string;
    notes: string | null;
}

interface Medication {
    id: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    route: string | null;
    purpose: string | null;
    isCurrent: boolean;
}

interface MedicalHistoryItem {
    id: string;
    eventType: string;
    eventName: string;
    location: string | null;
    outcome: string | null;
    createdAt: string;
}

interface MedicalData {
    allergies: Allergy[];
    chronicConditions: ChronicCondition[];
    medications: Medication[];
    medicalHistory: MedicalHistoryItem[];
}

// ── Lookup tables ─────────────────────────────────────────────────────────────

const BLOOD_LABELS: Record<string, string> = {
    A_POSITIVE: "A+", A_NEGATIVE: "A-",
    B_POSITIVE: "B+", B_NEGATIVE: "B-",
    AB_POSITIVE: "AB+", AB_NEGATIVE: "AB-",
    O_POSITIVE: "O+", O_NEGATIVE: "O-",
};

const GENDER_LABELS: Record<string, string> = {
    MALE: "Masculino",
    FEMALE: "Femenino",
    OTHER: "Otro",
    PREFER_NOT_TO_SAY: "Prefiero no decir",
};

const SEV_COLORS: Record<string, string> = {
    MILD: "bg-green-50 text-green-700 border-green-100",
    MODERATE: "bg-amber-50 text-amber-700 border-amber-100",
    SEVERE: "bg-orange-50 text-orange-700 border-orange-100",
    LIFE_THREATENING: "bg-red-50 text-red-700 border-red-100",
};

const ALLERGY_TYPE_LABELS: Record<string, string> = {
    FOOD: "Alimento",
    DRUG: "Medicamento",
    ENVIRONMENTAL: "Ambiental",
    INSECT: "Insecto",
    LATEX: "Látex",
    PET: "Mascota",
    OTHER: "Otro",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
    SURGERY: "Cirugía",
    HOSPITALIZATION: "Hospitalización",
    DIAGNOSIS: "Diagnóstico",
    PROCEDURE: "Procedimiento",
    EMERGENCY: "Emergencia",
    VACCINATION: "Vacunación",
    LAB_RESULT: "Laboratorio",
    IMAGING: "Imagen diagnóstica",
    CONSULTATION: "Consulta",
    OTHER: "Otro",
};

const ROUTE_LABELS: Record<string, string> = {
    ORAL: "Oral",
    INTRAVENOUS: "Intravenosa",
    INTRAMUSCULAR: "Intramuscular",
    SUBCUTANEOUS: "Subcutánea",
    TOPICAL: "Tópica",
    INHALATION: "Inhalación",
    SUBLINGUAL: "Sublingual",
    RECTAL: "Rectal",
    OPHTHALMIC: "Oftálmica",
    OTIC: "Ótica",
    NASAL: "Nasal",
    OTHER: "Otro",
};

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700 border-green-100",
    MANAGED: "bg-blue-50 text-blue-700 border-blue-100",
    IN_REMISSION: "bg-purple-50 text-purple-700 border-purple-100",
    RESOLVED: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: "Activo",
    MANAGED: "Controlado",
    IN_REMISSION: "En remisión",
    RESOLVED: "Resuelto",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

function getAgeString(dobStr: string | null): string {
    if (!dobStr) return "";
    const birthDate = new Date(dobStr);
    if (isNaN(birthDate.getTime())) return "";
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return ` · ${age} años`;
}

function toDateInput(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

function getInitials(firstName: string, lastName: string): string {
    const f = firstName?.[0] ?? "";
    const l = lastName?.[0] ?? "";
    return (f + l).toUpperCase() || "US";
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8D99AE] mb-3">{children}</p>
    );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center bg-[#F2F1EC] rounded-[20px]">
            <span className="w-12 h-12 rounded-2xl bg-white border border-[#E4E2DC] flex items-center justify-center mb-3 text-[#8D99AE] shadow-sm">
                {icon}
            </span>
            <p className="text-sm font-semibold text-[#1C1917]">{title}</p>
            <p className="text-xs text-[#8D99AE] mt-1 max-w-xs">{subtitle}</p>
        </div>
    );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-4 bg-white rounded-[20px] px-5 py-4 border border-[#E4E2DC] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-[#F2F1EC] border border-[#E4E2DC] flex items-center justify-center shrink-0 text-[#1C1917]">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs text-[#8D99AE] mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-[#1C1917] truncate">{value || "—"}</p>
            </div>
        </div>
    );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconMail() {
    return (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
    );
}

function IconPhone() {
    return (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
        </svg>
    );
}

function IconLocation() {
    return (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
    );
}

function IconBlood() {
    return (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75c-3.176-2.584-6.75-6.75-6.75-10.125a6.75 6.75 0 0 1 13.5 0c0 3.375-3.574 7.541-6.75 10.125Z" />
        </svg>
    );
}

function IconCalendar() {
    return (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
    );
}

function IconCamera() {
    return (
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
    );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-6 w-full">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="bg-white rounded-[28px] h-64 border border-[#E4E2DC]" />
                <div className="xl:col-span-2 space-y-4">
                    <div className="bg-white rounded-[20px] h-16 border border-[#E4E2DC]" />
                    <div className="bg-white rounded-[20px] h-16 border border-[#E4E2DC]" />
                    <div className="bg-white rounded-[20px] h-16 border border-[#E4E2DC]" />
                    <div className="bg-white rounded-[20px] h-16 border border-[#E4E2DC]" />
                </div>
            </div>
        </div>
    );
}

// ── Tab: Personal ─────────────────────────────────────────────────────────────

function PersonalTab({
    profile,
    editing,
    form,
    saving,
    uploadingPhoto,
    onEditClick,
    onCancelEdit,
    onSave,
    onChange,
    onPhotoChange,
    fileInputRef,
}: {
    profile: Profile;
    editing: boolean;
    form: EditForm;
    saving: boolean;
    uploadingPhoto: boolean;
    onEditClick: () => void;
    onCancelEdit: () => void;
    onSave: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start w-full">
            {/* Avatar card */}
            <div className="xl:col-span-1">
                <div className="bg-white rounded-[28px] border border-[#E4E2DC] shadow-sm p-8 flex flex-col items-center text-center">
                    <div className="relative mb-5">
                        <div className="w-24 h-24 rounded-full bg-[#FAB2D3] flex items-center justify-center text-3xl font-black text-[#391628] overflow-hidden border-4 border-white shadow-md">
                            {profile.photoUrl ? (
                                <img src={profile.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                            ) : (
                                getInitials(profile.firstName, profile.lastName)
                            )}
                        </div>
                        {uploadingPhoto && (
                            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-[#1C1917] hover:bg-black border-2 border-white flex items-center justify-center shadow-md transition-colors cursor-pointer disabled:opacity-60"
                            title="Cambiar foto"
                        >
                            <IconCamera />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
                    </div>

                    <h2 className="text-xl font-black font-display text-[#1C1917] leading-tight">
                        {profile.firstName} {profile.lastName}
                    </h2>
                    <p className="text-xs text-[#8D99AE] font-semibold mt-1 mb-5">{profile.email}</p>

                    {!editing && (
                        <button
                            onClick={onEditClick}
                            className="flex items-center gap-2 bg-[#1C1917] hover:bg-black text-white text-sm font-bold px-6 py-3 rounded-full transition-all shadow active:scale-95 border-none cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                            Editar perfil
                        </button>
                    )}
                </div>
            </div>

            {/* Right column */}
            <div className="xl:col-span-2">
                {!editing ? (
                    <div className="space-y-3">
                        <SectionTitle>Información personal</SectionTitle>
                        <InfoCard icon={<IconMail />} label="Email" value={profile.email} />
                        <InfoCard icon={<IconPhone />} label="Teléfono" value={profile.phone} />
                        <InfoCard icon={<IconLocation />} label="Ubicación" value={profile.location} />
                        <InfoCard icon={<IconBlood />} label="Tipo de sangre" value={BLOOD_LABELS[profile.bloodType ?? ""] ?? "—"} />
                        <InfoCard
                            icon={<IconCalendar />}
                            label="Fecha de nacimiento"
                            value={profile.dateOfBirth
                                ? `${formatDate(profile.dateOfBirth)}${getAgeString(profile.dateOfBirth)}`
                                : "—"
                            }
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-[28px] border border-[#E4E2DC] shadow-sm p-6 space-y-5">
                        <SectionTitle>Editar información</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(
                                [
                                    { label: "Nombre", name: "firstName", type: "text" },
                                    { label: "Apellido", name: "lastName", type: "text" },
                                    { label: "Teléfono", name: "phone", type: "tel" },
                                    { label: "Ciudad / Ubicación", name: "location", type: "text" },
                                    { label: "Fecha de nacimiento", name: "dateOfBirth", type: "date" },
                                ] as const
                            ).map(({ label, name, type }) => (
                                <div key={name}>
                                    <label className="text-xs text-[#8D99AE] block mb-1.5">{label}</label>
                                    <input
                                        type={type}
                                        name={name}
                                        value={form[name]}
                                        onChange={onChange}
                                        className="w-full bg-white border border-[#E4E2DC] focus:border-[#FAD957] rounded-xl px-4 py-3 text-sm text-[#1C1917] outline-none transition-colors"
                                    />
                                </div>
                            ))}

                            <div>
                                <label className="text-xs text-[#8D99AE] block mb-1.5">Tipo de sangre</label>
                                <select
                                    name="bloodType"
                                    value={form.bloodType}
                                    onChange={onChange}
                                    className="w-full bg-white border border-[#E4E2DC] focus:border-[#FAD957] rounded-xl px-4 py-3 text-sm text-[#1C1917] outline-none transition-colors"
                                >
                                    <option value="">Sin especificar</option>
                                    {Object.entries(BLOOD_LABELS).map(([key, val]) => (
                                        <option key={key} value={key}>{val}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs text-[#8D99AE] block mb-1.5">Género</label>
                                <select
                                    name="gender"
                                    value={form.gender}
                                    onChange={onChange}
                                    className="w-full bg-white border border-[#E4E2DC] focus:border-[#FAD957] rounded-xl px-4 py-3 text-sm text-[#1C1917] outline-none transition-colors"
                                >
                                    <option value="">Sin especificar</option>
                                    {Object.entries(GENDER_LABELS).map(([key, val]) => (
                                        <option key={key} value={key}>{val}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={onSave}
                                disabled={saving}
                                className="flex-1 bg-[#1C1917] hover:bg-black text-white text-sm font-bold py-3.5 rounded-full transition-all disabled:opacity-50 border-none cursor-pointer"
                            >
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                            <button
                                onClick={onCancelEdit}
                                disabled={saving}
                                className="flex-1 border border-[#E4E2DC] hover:bg-[#F2F1EC] text-[#8D99AE] text-sm font-bold py-3.5 rounded-full transition-all bg-white cursor-pointer"
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

// ── Tab: Medical ──────────────────────────────────────────────────────────────

function MedicalTab({ data }: { data: MedicalData }) {
    return (
        <div className="space-y-8 w-full">
            {/* Allergies */}
            <section>
                <SectionTitle>Alergias</SectionTitle>
                {data.allergies.length === 0 ? (
                    <EmptyState icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 7 7 4 2 6c2 4 5 6 10 6ZM12 12c0-5 5-8 10-6-2 4-5 6-10 6Z" /></svg>} title="Sin alergias registradas" subtitle="No hay alergias documentadas en tu perfil médico." />
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {data.allergies.map((a) => {
                            const sevClass = SEV_COLORS[a.severity] ?? SEV_COLORS.MILD;
                            return (
                                <div key={a.id} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border ${sevClass} group relative cursor-default`}>
                                    <span className="text-sm font-semibold leading-none">{a.allergenName}</span>
                                    {a.allergyType && (
                                        <span className="text-xs opacity-70">
                                            {ALLERGY_TYPE_LABELS[a.allergyType] ?? a.allergyType}
                                        </span>
                                    )}
                                    {a.reactionDescription && (
                                        <div className="absolute bottom-full left-0 mb-2 z-10 hidden group-hover:flex w-56 bg-[#1C1917] text-white text-xs rounded-xl px-3 py-2 shadow-xl pointer-events-none">
                                            {a.reactionDescription}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Chronic conditions */}
            <section>
                <SectionTitle>Condiciones crónicas</SectionTitle>
                {data.chronicConditions.length === 0 ? (
                    <EmptyState icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" /></svg>} title="Sin condiciones registradas" subtitle="No hay condiciones crónicas documentadas en tu historial." />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.chronicConditions.map((c) => {
                            const statusClass = STATUS_COLORS[c.status] ?? STATUS_COLORS.ACTIVE;
                            const sevClass = c.severity ? (SEV_COLORS[c.severity] ?? "") : "";
                            return (
                                <div key={c.id} className="bg-white rounded-[20px] border border-[#E4E2DC] shadow-sm p-5 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold text-[#1C1917] leading-tight">{c.conditionName}</p>
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${statusClass}`}>
                                            {STATUS_LABELS[c.status] ?? c.status}
                                        </span>
                                    </div>
                                    {c.severity && (
                                        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${sevClass}`}>
                                            {c.severity === "MILD" ? "Leve"
                                                : c.severity === "MODERATE" ? "Moderada"
                                                : c.severity === "SEVERE" ? "Severa"
                                                : c.severity === "LIFE_THREATENING" ? "Crítica"
                                                : c.severity}
                                        </span>
                                    )}
                                    {c.notes && (
                                        <p className="text-xs text-[#8D99AE] font-semibold leading-relaxed">{c.notes}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Medications */}
            <section>
                <SectionTitle>Medicamentos</SectionTitle>
                {data.medications.length === 0 ? (
                    <EmptyState icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></svg>} title="Sin medicamentos registrados" subtitle="No hay medicamentos documentados en tu perfil." />
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                        {data.medications.map((m) => (
                            <div
                                key={m.id}
                                className="bg-white rounded-[20px] border border-[#E4E2DC] shadow-sm p-5 min-w-[220px] max-w-[260px] shrink-0 space-y-2.5"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-[#1C1917] leading-tight">{m.name}</p>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${m.isCurrent ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                        {m.isCurrent ? "Activo" : "Previo"}
                                    </span>
                                </div>
                                {m.dosage && (
                                    <p className="text-xs font-semibold text-[#1C1917]">{m.dosage}</p>
                                )}
                                {m.frequency && (
                                    <p className="text-xs text-[#8D99AE]">{m.frequency}</p>
                                )}
                                {m.route && (
                                    <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-[#F2F1EC] text-[#8D99AE] border border-[#E4E2DC]">
                                        {ROUTE_LABELS[m.route] ?? m.route}
                                    </span>
                                )}
                                {m.purpose && (
                                    <p className="text-xs text-[#8D99AE] leading-relaxed line-clamp-2">{m.purpose}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Medical history */}
            <section>
                <SectionTitle>Historial médico</SectionTitle>
                {data.medicalHistory.length === 0 ? (
                    <EmptyState icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>} title="Sin historial registrado" subtitle="Aún no hay eventos médicos registrados en tu historial." />
                ) : (
                    <div className="space-y-3">
                        {data.medicalHistory.map((h, idx) => (
                            <div key={h.id} className="flex gap-4 items-start">
                                {/* Timeline dot */}
                                <div className="flex flex-col items-center shrink-0 mt-1">
                                    <div className="w-8 h-8 rounded-full bg-[#FDF2B2] border border-[#FAD957]/40 flex items-center justify-center text-[#5C4D04] font-bold text-xs">
                                        {idx + 1}
                                    </div>
                                    {idx < data.medicalHistory.length - 1 && (
                                        <div className="w-0.5 h-5 bg-[#E4E2DC] mt-1" />
                                    )}
                                </div>

                                <div className="bg-white rounded-[20px] border border-[#E4E2DC] shadow-sm p-4 flex-1 space-y-1.5">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-[#1C1917] leading-tight">{h.eventName}</p>
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#F2F1EC] text-[#8D99AE] border border-[#E4E2DC] shrink-0">
                                            {EVENT_TYPE_LABELS[h.eventType] ?? h.eventType}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#8D99AE]">{formatDate(h.createdAt)}</p>
                                    {h.location && (
                                        <p className="text-xs font-semibold text-[#1C1917] flex items-center gap-1">
                                            <svg className="w-3 h-3 text-[#8D99AE] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                            </svg>
                                            {h.location}
                                        </p>
                                    )}
                                    {h.outcome && (
                                        <p className="text-xs text-[#8D99AE] font-semibold leading-relaxed">{h.outcome}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProfileClient({ userId }: { userId: string }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<EditForm>({
        firstName: "", lastName: "", phone: "", location: "",
        dateOfBirth: "", gender: "", bloodType: "",
        identificationNumber: "", identificationType: "",
    });
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [activeTab, setActiveTab] = useState<"personal" | "medical">("personal");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    void userId;

    useEffect(() => {
        Promise.all([
            fetch("/api/profile").then((r) => r.json()),
            fetch("/api/medical-profile").then((r) => r.json()),
        ])
            .then(([profileData, medData]) => {
                const p = profileData as Profile;
                setProfile(p);
                setForm({
                    firstName: p.firstName ?? "",
                    lastName: p.lastName ?? "",
                    phone: p.phone ?? "",
                    location: p.location ?? "",
                    dateOfBirth: toDateInput(p.dateOfBirth),
                    gender: p.gender ?? "",
                    bloodType: p.bloodType ?? "",
                    identificationNumber: p.identificationNumber ?? "",
                    identificationType: p.identificationType ?? "",
                });
                setMedicalData({
                    allergies: medData.allergies ?? [],
                    chronicConditions: medData.chronicConditions ?? [],
                    medications: medData.medications ?? [],
                    medicalHistory: medData.medicalHistory ?? [],
                });
            })
            .catch(() => {})
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
                          identificationNumber: form.identificationNumber || null,
                          identificationType: form.identificationType || null,
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
            const data = await res.json() as { photoUrl?: string };
            if (data.photoUrl) {
                setProfile((prev) => (prev ? { ...prev, photoUrl: data.photoUrl! } : prev));
            }
        } finally {
            setUploadingPhoto(false);
            e.target.value = "";
        }
    }

    if (loading) return <LoadingSkeleton />;

    if (!profile) {
        return (
            <p className="text-sm text-[#8D99AE] font-semibold">No se pudo cargar el perfil. Intenta recargar la página.</p>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Tab switcher */}
            <div className="flex gap-2 bg-white border border-[#E4E2DC] rounded-2xl p-1.5 w-fit shadow-sm">
                {(
                    [
                        { key: "personal", label: "Información personal" },
                        { key: "medical", label: "Perfil médico" },
                    ] as const
                ).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border-none outline-none
                            ${activeTab === tab.key
                                ? "bg-[#1C1917] text-white shadow-sm"
                                : "text-[#8D99AE] hover:text-[#1C1917] hover:bg-[#F2F1EC]"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === "personal" ? (
                <PersonalTab
                    profile={profile}
                    editing={editing}
                    form={form}
                    saving={saving}
                    uploadingPhoto={uploadingPhoto}
                    onEditClick={() => setEditing(true)}
                    onCancelEdit={() => setEditing(false)}
                    onSave={handleSave}
                    onChange={handleChange}
                    onPhotoChange={handlePhotoChange}
                    fileInputRef={fileInputRef}
                />
            ) : (
                <MedicalTab
                    data={medicalData ?? {
                        allergies: [],
                        chronicConditions: [],
                        medications: [],
                        medicalHistory: [],
                    }}
                />
            )}
        </div>
    );
}
