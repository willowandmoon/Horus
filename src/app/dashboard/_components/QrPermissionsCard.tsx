"use client";
import { useState, useEffect } from "react";

// ── 6 medical privacy toggles — match horus-mobile qr-medico.tsx exactly ──────
const PERMISSIONS = [
    { key: "blood",      label: "Tipo de sangre",         apiField: "showBloodType"          },
    { key: "allergies",  label: "Alergias",                apiField: "showAllergies"           },
    { key: "meds",       label: "Medicamentos actuales",   apiField: "showMedications"         },
    { key: "conditions", label: "Condiciones crónicas",    apiField: "showChronicConditions"   },
    { key: "contacts",   label: "Contactos de emergencia", apiField: "showEmergencyContacts"   },
    { key: "notes",      label: "Notas médicas",           apiField: "showMedicalHistory"      },
] as const;

type PermKey = typeof PERMISSIONS[number]["key"];
type Perms = Record<PermKey, boolean>;

const DEFAULTS: Perms = {
    blood:      true,
    allergies:  true,
    meds:       true,
    conditions: true,
    contacts:   true,
    notes:      false,
};

const STORAGE_KEY = "horus_qr_privacy";

export default function QrPermissionsCard({ userId }: { userId: string }) {
    const [perms, setPerms]       = useState<Perms>(DEFAULTS);
    const [mounted, setMounted]   = useState(false);
    const [saving, setSaving]     = useState<PermKey | null>(null);

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
            setPerms(prev => ({ ...prev, ...stored }));
        } catch {}
        setMounted(true);
    }, []);

    const toggle = async (key: PermKey) => {
        const next = { ...perms, [key]: !perms[key] };
        setPerms(next);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}

        // Attempt real API sync (if backend proxy exists)
        const perm = PERMISSIONS.find(p => p.key === key);
        if (!perm) return;
        setSaving(key);
        try {
            await fetch("/api/profile/privacy", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [perm.apiField]: next[key] }),
            });
        } catch {
            // Silent — localStorage already saved the preference
        } finally {
            setSaving(null);
        }
    };

    const qrData = encodeURIComponent(`https://horus.app/emergency/${userId}`);
    const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}&color=1A1512&bgcolor=F2F1EC&margin=4`;

    return (
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E4E2DC]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#F0EBE3] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"/>
                    </svg>
                </div>
                <h2 className="text-xs font-extrabold text-[#1A1512] uppercase tracking-wide">QR de Emergencia</h2>
            </div>

            {/* QR + description */}
            <div className="flex gap-4 mb-5">
                <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="w-[76px] h-[76px] rounded-xl overflow-hidden bg-[#F2F1EC] border border-[#E4E2DC] flex items-center justify-center">
                        {mounted
                            ? <img src={qrUrl} alt="QR Code de emergencia" className="w-full h-full object-contain" />
                            : <div className="w-6 h-6 border-2 border-[#E4E2DC] border-t-[#8D99AE] rounded-full animate-spin" />
                        }
                    </div>
                    <p className="text-[10px] text-[#8D99AE] font-medium">Escanear</p>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1A1512] mb-1">Acceso de emergencia</p>
                    <p className="text-[11px] text-[#8D99AE] leading-relaxed">
                        Primeros auxilios pueden escanear este código para ver tu perfil médico de forma inmediata.
                    </p>
                </div>
            </div>

            {/* Privacy toggles */}
            <div className="border-t border-[#E4E2DC] pt-4">
                <p className="text-[10px] font-extrabold text-[#8D99AE] uppercase tracking-wider mb-3">
                    Privacidad · Datos visibles en el QR
                </p>
                <div className="space-y-3">
                    {PERMISSIONS.map(p => {
                        const on = mounted ? perms[p.key] : DEFAULTS[p.key];
                        return (
                            <div key={p.key} className="flex items-center justify-between gap-3">
                                <span className="text-xs text-[#1A1512] leading-tight">{p.label}</span>
                                <button
                                    onClick={() => toggle(p.key)}
                                    disabled={saving === p.key}
                                    aria-label={`Toggle ${p.label}`}
                                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-60 ${
                                        on ? "bg-[#22C55E]" : "bg-[#E4E2DC]"
                                    }`}
                                >
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                                        on ? "left-[18px]" : "left-0.5"
                                    }`} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
