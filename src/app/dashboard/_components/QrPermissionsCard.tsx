"use client";
import { useState, useEffect, useCallback } from "react";

// ── Privacy toggles — exact match from horus-mobile qr-medico.tsx ──────────────
const TOGGLES = [
    { key: "blood",      label: "Tipo de sangre",         desc: "O+",                    apiField: "showBloodType",          icon: "water"    },
    { key: "allergies",  label: "Alergias",                desc: "Severidad y reacción",  apiField: "showAllergies",          icon: "fitness"  },
    { key: "meds",       label: "Medicamentos actuales",   desc: "Dosis y frecuencia",    apiField: "showMedications",        icon: "medical"  },
    { key: "conditions", label: "Condiciones crónicas",    desc: "Solo activas",          apiField: "showChronicConditions",  icon: "heart"    },
    { key: "contacts",   label: "Contactos de emergencia", desc: "Nombre y teléfono",     apiField: "showEmergencyContacts",  icon: "call"     },
    { key: "notes",      label: "Notas médicas",           desc: "Información adicional", apiField: "showMedicalHistory",     icon: "document" },
] as const;

type ToggleKey = typeof TOGGLES[number]["key"];
type PrivacyMap = Record<ToggleKey, boolean>;

const DEFAULTS: PrivacyMap = {
    blood: true, allergies: true, meds: true,
    conditions: true, contacts: true, notes: false,
};

const BLOOD_LABELS: Record<string, string> = {
    A_POSITIVE: "A+", A_NEGATIVE: "A-", B_POSITIVE: "B+", B_NEGATIVE: "B-",
    AB_POSITIVE: "AB+", AB_NEGATIVE: "AB-", O_POSITIVE: "O+", O_NEGATIVE: "O-",
};

function calcAge(dob: string): string {
    const today = new Date();
    const d = new Date(dob + "T00:00:00");
    let age = today.getFullYear() - d.getFullYear();
    if (today.getMonth() < d.getMonth() ||
        (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
    return `${age} años`;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function ToggleIcon({ icon }: { icon: string }) {
    const sw = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
    const paths: Record<string, React.ReactNode> = {
        water:    <path d="M12 2.25a.75.75 0 0 1 .612.318l5.25 7.5A6.75 6.75 0 1 1 5.138 9.57l5.25-7.5A.75.75 0 0 1 12 2.25Z" {...sw} stroke="currentColor" fill="none" viewBox="0 0 24 24" />,
        fitness:  <><path d="M12 4.5v15m7.5-7.5h-15" {...sw} /></>,
        medical:  <><path d="M9 12h6m-3-3v6m-6.75 3h13.5A2.25 2.25 0 0 0 21 15.75V8.25A2.25 2.25 0 0 0 18.75 6H5.25A2.25 2.25 0 0 0 3 8.25v7.5A2.25 2.25 0 0 0 5.25 18Z" {...sw} /></>,
        heart:    <><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" {...sw} /></>,
        call:     <><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" {...sw} /></>,
        document: <><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" {...sw} /></>,
    };
    const p = paths[icon];
    return (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {p}
        </svg>
    );
}

// ── Toggle component (matches mobile) ─────────────────────────────────────────
function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${value ? "bg-[#22C55E]" : "bg-[#E4E2DC]"}`}
        >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${value ? "left-[22px]" : "left-0.5"}`} />
        </button>
    );
}

// ── Main card ──────────────────────────────────────────────────────────────────
export default function QrPermissionsCard({ userId }: { userId: string }) {
    const [privacy, setPrivacy]   = useState<PrivacyMap>(DEFAULTS);
    const [expanded, setExpanded] = useState(false);
    const [fullName, setFullName] = useState("—");
    const [ageLabel, setAgeLabel] = useState("—");
    const [bloodType, setBloodType] = useState("—");
    const [saved, setSaved]       = useState(false);
    const [mounted, setMounted]   = useState(false);

    const appBase     = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.horus.health";
    const emergencyUrl = `${appBase}/emergency/${userId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(emergencyUrl)}&color=1A1512&bgcolor=FFFFFF&margin=6&qzone=2`;

    const load = useCallback(async () => {
        try {
            const res  = await fetch("/api/profile/full");
            const data = await res.json() as {
                personalInfo?: { firstName?: string; lastName?: string; dateOfBirth?: string; bloodType?: string };
                privacySettings?: Partial<Record<string, boolean>>;
            };

            if (data.personalInfo) {
                const { firstName, lastName, dateOfBirth, bloodType: bt } = data.personalInfo;
                if (firstName || lastName) setFullName(`${firstName ?? ""} ${lastName ?? ""}`.trim());
                if (dateOfBirth) setAgeLabel(calcAge(dateOfBirth));
                if (bt) setBloodType(BLOOD_LABELS[bt] ?? bt);
            }
            if (data.privacySettings) {
                setPrivacy(prev => {
                    const next = { ...prev };
                    for (const t of TOGGLES) {
                        const v = data.privacySettings![t.apiField];
                        if (typeof v === "boolean") next[t.key] = v;
                    }
                    return next;
                });
            }
        } catch {}
        setMounted(true);
    }, []);

    useEffect(() => { load(); }, [load]);

    const flip = async (key: ToggleKey) => {
        const next = { ...privacy, [key]: !privacy[key] };
        setPrivacy(next);

        const t = TOGGLES.find(t => t.key === key)!;
        try {
            await fetch("/api/profile/privacy", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [t.apiField]: next[key] }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
        } catch {}
    };

    const handleShare = async () => {
        try {
            await navigator.share({ title: "Mi ID Médico Horus", url: emergencyUrl });
        } catch {
            await navigator.clipboard.writeText(emergencyUrl);
        }
    };

    return (
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E4E2DC]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#F0EBE3] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"/>
                        <path d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"/>
                    </svg>
                </div>
                <h2 className="text-xs font-extrabold text-[#1A1512] uppercase tracking-wide flex-1">QR de Emergencia</h2>
                {saved && (
                    <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        <span className="text-[11px] font-semibold text-[#22C55E]">Guardado</span>
                    </div>
                )}
            </div>

            {/* QR Card (expand/collapse like mobile) */}
            <div className="bg-[#F2F1EC] rounded-[20px] px-5 pt-4 pb-3 mb-4 flex flex-col items-center">

                {/* Expanded: name + meta + QR + buttons */}
                {expanded && (
                    <div className="flex flex-col items-center w-full mb-5">
                        <p className="text-xl font-extrabold text-[#1A1512] tracking-tight">{fullName}</p>
                        <div className="flex items-center gap-2.5 mt-1.5 mb-4">
                            <span className="text-sm text-[#8D99AE]">{ageLabel}</span>
                            <span className="w-1 h-1 rounded-full bg-[#8D99AE]/50" />
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: "#F9D7E8", color: "#7A1A3A" }}>
                                {bloodType}
                            </span>
                        </div>
                        {/* QR — 180px like mobile */}
                        <div className="bg-white rounded-[20px] p-5 shadow-sm">
                            {mounted
                                ? <img src={qrUrl} alt="QR de emergencia" className="w-[180px] h-[180px]" />
                                : <div className="w-[180px] h-[180px] flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-[#E4E2DC] border-t-[#8D99AE] rounded-full animate-spin" />
                                  </div>
                            }
                        </div>
                        {/* Buttons */}
                        <div className="flex gap-3 mt-5 w-full">
                            <button onClick={handleShare}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#1A1512] rounded-[18px] py-3.5 text-white text-sm font-bold hover:opacity-90 transition-opacity">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"/>
                                </svg>
                                Compartir
                            </button>
                            <button onClick={() => navigator.clipboard.writeText(emergencyUrl)}
                                className="flex-1 flex items-center justify-center gap-2 rounded-[18px] py-3.5 text-sm font-bold hover:opacity-90 transition-opacity"
                                style={{ background: "#FEF3C7", color: "#3D2C00" }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"/>
                                </svg>
                                Copiar enlace
                            </button>
                        </div>
                    </div>
                )}

                {/* Collapse/expand toggle */}
                <button onClick={() => setExpanded(v => !v)}
                    className="flex items-center justify-between w-full text-sm font-semibold text-[#8D99AE] hover:text-[#1A1512] transition-colors"
                    style={{ marginTop: expanded ? 4 : 0 }}>
                    <span>{expanded ? "Ocultar QR" : "Ver mi QR de emergencia"}</span>
                    <div className="w-7 h-7 rounded-full bg-[#E4E2DC] flex items-center justify-center transition-transform"
                        style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="m19 9-7 7-7-7"/>
                        </svg>
                    </div>
                </button>
            </div>

            {/* Privacy section title */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-[#1A1512]">Privacidad</p>
                <p className="text-[10px] text-[#8D99AE] font-medium">Datos visibles en el QR</p>
            </div>

            {/* Toggle cards — exact match to mobile toggleCard style */}
            <div className="space-y-2">
                {TOGGLES.map(t => (
                    <div key={t.key} className="flex items-center gap-3 bg-[#F2F1EC] rounded-[20px] px-3.5 py-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E4E2DC] flex items-center justify-center shrink-0 text-[#1A1512]">
                            <ToggleIcon icon={t.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#1A1512] leading-tight">{t.label}</p>
                            <p className="text-[11px] text-[#8D99AE] mt-0.5">{t.desc}</p>
                        </div>
                        <Toggle value={mounted ? privacy[t.key] : DEFAULTS[t.key]} onToggle={() => flip(t.key)} />
                    </div>
                ))}
            </div>
        </div>
    );
}
