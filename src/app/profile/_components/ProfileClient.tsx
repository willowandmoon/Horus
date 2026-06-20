"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";

// ── Fonts ─────────────────────────────────────────────────────────────────────
// DISPLAY (Space Grotesk) → títulos de sección, modal, nombre usuario
// SANS    (DM Sans)       → labels, valores, texto de cuerpo (igual que mobile)
const DISPLAY = "var(--font-space-grotesk), system-ui, sans-serif";
const SANS    = "var(--font-dm-sans), system-ui, sans-serif";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#F2F1EC",
  card:    "#FFFFFF",
  primary: "#1A1512",
  muted:   "#8D99AE",
  mutedBg: "#F0EBE3",
  green:   "#22C55E",
  red:     "#EF4444",
  pink:    "#FAB2D3",
};

// ── Lookup labels ─────────────────────────────────────────────────────────────
const BLOOD: Record<string, string> = {
  A_POSITIVE:"A+", A_NEGATIVE:"A-", B_POSITIVE:"B+", B_NEGATIVE:"B-",
  AB_POSITIVE:"AB+", AB_NEGATIVE:"AB-", O_POSITIVE:"O+", O_NEGATIVE:"O-",
};
const GENDER: Record<string, string> = {
  MALE:"Masculino", FEMALE:"Femenino", OTHER:"Otro", PREFER_NOT_TO_SAY:"Prefiero no decir",
};
const IDTYPE: Record<string, string> = {
  CC:"Cédula de ciudadanía", CE:"Cédula de extranjería",
  PP:"Pasaporte", TI:"Tarjeta de identidad", PPE:"Permiso especial",
};
const ALLERGY_TYPES = [
  { label:"Medicamento", value:"MEDICATION" }, { label:"Alimento",  value:"FOOD" },
  { label:"Ambiental",   value:"ENVIRONMENTAL" }, { label:"Otro", value:"OTHER" },
];
const ALLERGY_SEV = [
  { label:"Leve", value:"MILD" }, { label:"Moderada", value:"MODERATE" },
  { label:"Severa", value:"SEVERE" }, { label:"Riesgo vital", value:"LIFE_THREATENING" },
];
const COND_SEV = [
  { label:"Leve", value:"MILD" }, { label:"Moderada", value:"MODERATE" },
  { label:"Severa", value:"SEVERE" },
];
const COND_STATUS = [
  { label:"Activa", value:"ACTIVE" }, { label:"Controlada", value:"MANAGED" },
  { label:"En remisión", value:"IN_REMISSION" }, { label:"Resuelta", value:"RESOLVED" },
];
const GENDERS = [
  { label:"Masculino", value:"MALE" }, { label:"Femenino", value:"FEMALE" },
  { label:"Otro", value:"OTHER" }, { label:"Prefiero no decir", value:"PREFER_NOT_TO_SAY" },
];
const ID_TYPES = [
  { label:"Cédula de ciudadanía", value:"CC" }, { label:"Cédula de extranjería", value:"CE" },
  { label:"Pasaporte", value:"PP" }, { label:"Tarjeta de identidad", value:"TI" },
  { label:"Permiso especial", value:"PPE" },
];
const BLOOD_OPTS = [
  { label:"A+", value:"A_POSITIVE" }, { label:"A-", value:"A_NEGATIVE" },
  { label:"B+", value:"B_POSITIVE" }, { label:"B-", value:"B_NEGATIVE" },
  { label:"AB+", value:"AB_POSITIVE" }, { label:"AB-", value:"AB_NEGATIVE" },
  { label:"O+", value:"O_POSITIVE" }, { label:"O-", value:"O_NEGATIVE" },
];

// ── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  email: string; firstName: string; lastName: string;
  dateOfBirth: string | null; gender: string | null; bloodType: string | null;
  identificationNumber: string | null; identificationType: string | null;
  photoUrl: string | null;
}
interface MedProfile { heightCm: number | null; weightKg: number | null; organDonor: boolean; insuranceProvider: string | null }
interface Allergy { id: string; allergenName: string; allergyType: string; severity: string; reactionDescription: string | null; isActive: boolean }
interface Condition { id: string; conditionName: string; severity: string | null; status: string; notes: string | null }
interface Medication { id: string; name: string; dosage: string | null; frequency: string | null; isCurrent: boolean }
interface Contact { id: string; name: string; relation: string; phone: string; email?: string }

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const parts = iso.split("T")[0].split("-");
  if (parts.length !== 3) return "—";
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${age} años`;
}
function lbl<T extends { label: string; value: string }>(opts: T[], v?: string | null) {
  return v ? (opts.find(o => o.value === v)?.label ?? v) : "—";
}
function severityColor(s: string) {
  return s === "LIFE_THREATENING" || s === "SEVERE" ? C.red : s === "MODERATE" ? "#F59E0B" : C.green;
}
function condColor(s: string) {
  return s === "ACTIVE" ? C.red : s === "MANAGED" ? "#F59E0B" : C.green;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const sw: React.SVGProps<SVGSVGElement> = {};
function Icon({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...sw}>{children}</svg>;
}
function PencilIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return <Icon size={size}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" stroke={color} /></Icon>;
}
function TrashIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return <Icon size={size}><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={color} /></Icon>;
}
function PhoneIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return <Icon size={size}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.76a16 16 0 0 0 6.29 6.29l1.12-1.84a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z" stroke={color} /></Icon>;
}
function PlusIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return <Icon size={size}><path d="M12 5v14M5 12h14" stroke={color} /></Icon>;
}
function XIcon({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return <Icon size={size}><line x1="18" y1="6" x2="6" y2="18" stroke={color} /><line x1="6" y1="6" x2="18" y2="18" stroke={color} /></Icon>;
}
function ChevronRight({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return <Icon size={size}><path d="m9 18 6-6-6-6" stroke={color} /></Icon>;
}
function UserIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return <Icon size={size}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} /><circle cx="12" cy="7" r="4" stroke={color} /></Icon>;
}
function HeartIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return <Icon size={size}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} /></Icon>;
}
function CameraIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return <Icon size={size}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke={color} /><circle cx="12" cy="13" r="3" stroke={color} /></Icon>;
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 6, paddingBottom: 6 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.mutedBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 11, fontFamily: SANS, color: C.muted }}>{label}</p>
        <p style={{ margin: 0, fontSize: 14, fontFamily: SANS, fontWeight: 700, color: C.primary }}>{value || "—"}</p>
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ background: color + "22", color, fontSize: 11, fontWeight: 700, fontFamily: SANS,
      padding: "3px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>{label}</span>
  );
}

// ── Accordion ─────────────────────────────────────────────────────────────────
function Accordion({ title, icon, open, onToggle, badge, children }: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void;
  badge?: number; children: React.ReactNode;
}) {
  return (
    <div style={{ background: C.card, borderRadius: 20, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <button onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 16,
          background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.mutedBg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ flex: 1, fontSize: 15, fontFamily: DISPLAY, fontWeight: 700, color: C.primary }}>{title}</span>
        {badge !== undefined && badge > 0 && (
          <span style={{ background: C.primary, color: C.card, borderRadius: 10, minWidth: 20,
            height: 20, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, fontFamily: SANS, padding: "0 5px" }}>{badge}</span>
        )}
        <span style={{ color: C.muted, display: "inline-flex", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
          <ChevronRight color={C.muted} size={16} />
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,21,18,0.45)", zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: "28px 28px 0 0", padding: 24, width: "100%",
        maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontFamily: DISPLAY, fontWeight: 700, color: C.primary }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.mutedBg, border: "none", borderRadius: "50%",
            width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <XIcon color={C.primary} size={12} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>{children}</div>
        <div style={{ display: "flex", gap: 12 }}>{footer}</div>
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder, locked }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string;
  placeholder?: string; locked?: boolean;
}) {
  return (
    <div style={{ background: C.card, borderRadius: 16, padding: "10px 16px 12px", opacity: locked ? 0.5 : 1 }}>
      <p style={{ margin: "0 0 2px", fontSize: 11, fontFamily: SANS, color: C.muted }}>{label}</p>
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder ?? "—"}
        disabled={locked}
        style={{ display: "block", width: "100%", border: "none", background: "transparent",
          color: C.primary, fontSize: 15, fontFamily: SANS, outline: "none", boxSizing: "border-box", padding: 0 }} />
    </div>
  );
}

// ── SelectField ───────────────────────────────────────────────────────────────
function SelectField({ label, value, onChange, options, locked }: {
  label: string; value: string; onChange?: (v: string) => void;
  options: { label: string; value: string }[]; locked?: boolean;
}) {
  return (
    <div style={{ background: C.card, borderRadius: 16, padding: "10px 16px 12px", opacity: locked ? 0.5 : 1 }}>
      <p style={{ margin: "0 0 2px", fontSize: 11, fontFamily: SANS, color: C.muted }}>{label}</p>
      <select value={value} onChange={e => onChange?.(e.target.value)} disabled={locked}
        style={{ display: "block", width: "100%", border: "none", background: "transparent",
          color: C.primary, fontSize: 15, fontFamily: SANS, outline: "none", appearance: "none", padding: 0 }}>
        <option value="">Seleccionar</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "4px 0 0", fontSize: 12, fontFamily: SANS, fontWeight: 700, color: C.muted,
    textTransform: "uppercase", letterSpacing: "0.6px" }}>{children}</p>;
}

// ── Sheet buttons ─────────────────────────────────────────────────────────────
function SheetBtns({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving?: boolean }) {
  return (
    <>
      <button onClick={onCancel} disabled={saving}
        style={{ flex: 1, background: C.mutedBg, border: "none", borderRadius: 16, padding: "14px 0",
          fontSize: 14, fontFamily: SANS, fontWeight: 700, color: C.primary, cursor: "pointer" }}>
        Cancelar
      </button>
      <button onClick={onSave} disabled={saving}
        style={{ flex: 1, background: C.primary, border: "none", borderRadius: 16, padding: "14px 0",
          fontSize: 14, fontFamily: SANS, fontWeight: 700, color: "#fff", cursor: "pointer",
          opacity: saving ? 0.7 : 1 }}>
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </>
  );
}

// ── Add button ────────────────────────────────────────────────────────────────
function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 8, background: C.mutedBg, border: "none",
        borderRadius: 12, padding: "10px 14px", fontSize: 13, fontFamily: SANS, fontWeight: 700,
        color: C.primary, cursor: "pointer", alignSelf: "flex-start", marginTop: 4 }}>
      <PlusIcon color={C.primary} size={14} /> {label}
    </button>
  );
}

// ── Row action buttons ────────────────────────────────────────────────────────
const iconBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 10, background: C.mutedBg, border: "none",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

// ── Divider ───────────────────────────────────────────────────────────────────
const divider = <div style={{ height: 1, background: C.mutedBg, margin: "0 0" }} />;

// ════════════════════════════════════════════════════════════════════════════════
// Main component
// ════════════════════════════════════════════════════════════════════════════════
export default function ProfileClient() {
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [medProfile, setMedProfile] = useState<MedProfile>({ heightCm: null, weightKg: null, organDonor: false, insuranceProvider: null });
  const [allergies,  setAllergies]  = useState<Allergy[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [meds,       setMeds]       = useState<Medication[]>([]);
  const [contacts,   setContacts]   = useState<Contact[]>([]);
  const [loading,    setLoading]    = useState(true);

  // ── Accordion ─────────────────────────────────────────────────────────────
  const [open, setOpen] = useState({ personal: true, medical: false, allergies: false, conditions: false, meds: false, contacts: false });
  const toggle = (k: keyof typeof open) => setOpen(p => ({ ...p, [k]: !p[k] }));

  // ── Photo ──────────────────────────────────────────────────────────────────
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── Edit personal modal ───────────────────────────────────────────────────
  const [editOpen,   setEditOpen]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [draft, setDraft] = useState({
    firstName: "", lastName: "", email: "",
    gender: "", identificationType: "", identificationNumber: "",
    bloodType: "",
    heightCm: "", weightKg: "", organDonor: false, insuranceProvider: "",
  });
  const idLocked = !!(profile?.identificationType && profile?.identificationNumber);

  // ── Allergy ───────────────────────────────────────────────────────────────
  const [addAllergyOpen,  setAddAllergyOpen]  = useState(false);
  const [allergyDraft,    setAllergyDraft]    = useState({ allergenName: "", allergyType: "", severity: "", reactionDescription: "" });
  const [savingAllergy,   setSavingAllergy]   = useState(false);
  const [editAllergyItem, setEditAllergyItem] = useState<Allergy | null>(null);
  const [editAllergyDraft, setEditAllergyDraft] = useState({ allergenName: "", allergyType: "", severity: "", reactionDescription: "" });

  // ── Condition ─────────────────────────────────────────────────────────────
  const [addCondOpen,    setAddCondOpen]    = useState(false);
  const [condDraft,      setCondDraft]      = useState({ conditionName: "", severity: "", status: "ACTIVE", notes: "" });
  const [savingCond,     setSavingCond]     = useState(false);
  const [editCondItem,   setEditCondItem]   = useState<Condition | null>(null);
  const [editCondDraft,  setEditCondDraft]  = useState({ conditionName: "", severity: "", status: "ACTIVE", notes: "" });

  // ── Medication ────────────────────────────────────────────────────────────
  const [addMedOpen,   setAddMedOpen]   = useState(false);
  const [medDraft,     setMedDraft]     = useState({ name: "", dosage: "", frequency: "" });
  const [savingMed,    setSavingMed]    = useState(false);
  const [editMedItem,  setEditMedItem]  = useState<Medication | null>(null);
  const [editMedDraft, setEditMedDraft] = useState({ name: "", dosage: "", frequency: "", isCurrent: true });

  // ── Contact ───────────────────────────────────────────────────────────────
  const [addContactOpen,    setAddContactOpen]    = useState(false);
  const [contactDraft,      setContactDraft]      = useState({ name: "", phone: "", relation: "", email: "" });
  const [savingContact,     setSavingContact]     = useState(false);
  const [editContactItem,   setEditContactItem]   = useState<Contact | null>(null);
  const [editContactDraft,  setEditContactDraft]  = useState({ name: "", phone: "", relation: "", email: "" });

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get<Profile>("/api/profile"),
      axios.get<MedProfile>("/api/profile/medical"),
      axios.get<{ allergies: Allergy[]; chronicConditions: Condition[]; medications: Medication[] }>("/api/medical-profile"),
      axios.get<Contact[]>("/api/contacts"),
    ]).then(([p, mp, med, c]) => {
      setProfile(p.data);
      setMedProfile(mp.data);
      setAllergies(med.data.allergies);
      setConditions(med.data.chronicConditions);
      setMeds(med.data.medications);
      setContacts(c.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // ── Photo ──────────────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const { data } = await axios.post<{ photoUrl: string }>("/api/profile/photo", fd);
      setProfile(p => p ? { ...p, photoUrl: data.photoUrl } : p);
    } catch { alert("Error al subir foto"); }
    finally { setUploadingPhoto(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = () => {
    if (!profile) return;
    setDraft({
      firstName: profile.firstName, lastName: profile.lastName, email: profile.email,
      gender: profile.gender ?? "", identificationType: profile.identificationType ?? "",
      identificationNumber: profile.identificationNumber ?? "",
      bloodType: profile.bloodType ?? "",
      heightCm: medProfile.heightCm != null ? String(medProfile.heightCm) : "",
      weightKg: medProfile.weightKg != null ? String(medProfile.weightKg) : "",
      organDonor: medProfile.organDonor,
      insuranceProvider: medProfile.insuranceProvider ?? "",
    });
    setEditOpen(true);
  };

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.firstName.trim() || !draft.lastName.trim()) { alert("Nombre y apellido son requeridos."); return; }
    setSaving(true);
    try {
      await Promise.all([
        axios.put("/api/profile", {
          firstName: draft.firstName.trim(), lastName: draft.lastName.trim(),
          gender: draft.gender || null,
          ...(!idLocked && { identificationType: draft.identificationType || null, identificationNumber: draft.identificationNumber.trim() || null }),
        }),
        axios.put("/api/profile/medical", {
          heightCm: draft.heightCm || null, weightKg: draft.weightKg || null,
          organDonor: draft.organDonor, insuranceProvider: draft.insuranceProvider || null,
        }),
      ]);
      setProfile(p => p ? { ...p, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(),
        gender: draft.gender || null,
        ...(!idLocked && { identificationType: draft.identificationType || null, identificationNumber: draft.identificationNumber.trim() || null }),
      } : p);
      setMedProfile({ heightCm: draft.heightCm ? Number(draft.heightCm) : null,
        weightKg: draft.weightKg ? Number(draft.weightKg) : null,
        organDonor: draft.organDonor, insuranceProvider: draft.insuranceProvider || null });
      setEditOpen(false);
    } catch { alert("Error al guardar."); }
    finally { setSaving(false); }
  };

  // ── Allergy CRUD ──────────────────────────────────────────────────────────
  const handleAddAllergy = async () => {
    if (!allergyDraft.allergenName.trim() || !allergyDraft.allergyType || !allergyDraft.severity) {
      alert("Nombre, tipo y severidad son obligatorios."); return;
    }
    setSavingAllergy(true);
    try {
      const { data } = await axios.post<Allergy>("/api/medical-profile", {
        type: "allergy", data: { allergenName: allergyDraft.allergenName.trim(),
          allergyType: allergyDraft.allergyType, severity: allergyDraft.severity,
          reactionDescription: allergyDraft.reactionDescription.trim() || null },
      });
      setAllergies(p => [data, ...p]);
      setAllergyDraft({ allergenName: "", allergyType: "", severity: "", reactionDescription: "" });
      setAddAllergyOpen(false);
    } catch { alert("Error al guardar."); }
    finally { setSavingAllergy(false); }
  };
  const handleSaveEditAllergy = async () => {
    if (!editAllergyItem) return;
    setSavingAllergy(true);
    try {
      const { data } = await axios.patch<Allergy>(`/api/medical-profile/${editAllergyItem.id}`, {
        type: "allergy", data: { allergenName: editAllergyDraft.allergenName.trim(),
          allergyType: editAllergyDraft.allergyType, severity: editAllergyDraft.severity,
          reactionDescription: editAllergyDraft.reactionDescription.trim() || null },
      });
      setAllergies(p => p.map(a => a.id === editAllergyItem.id ? data : a));
      setEditAllergyItem(null);
    } catch { alert("Error al guardar."); }
    finally { setSavingAllergy(false); }
  };
  const handleDeleteAllergy = async (id: string) => {
    if (!confirm("¿Eliminar esta alergia?")) return;
    await axios.delete(`/api/medical-profile/${id}?type=allergy`).catch(() => alert("Error"));
    setAllergies(p => p.filter(a => a.id !== id));
  };

  // ── Condition CRUD ────────────────────────────────────────────────────────
  const handleAddCond = async () => {
    if (!condDraft.conditionName.trim()) { alert("El nombre es obligatorio."); return; }
    setSavingCond(true);
    try {
      const { data } = await axios.post<Condition>("/api/medical-profile", {
        type: "condition", data: { conditionName: condDraft.conditionName.trim(),
          severity: condDraft.severity || null, status: condDraft.status,
          notes: condDraft.notes.trim() || null },
      });
      setConditions(p => [data, ...p]);
      setCondDraft({ conditionName: "", severity: "", status: "ACTIVE", notes: "" });
      setAddCondOpen(false);
    } catch { alert("Error al guardar."); }
    finally { setSavingCond(false); }
  };
  const handleSaveEditCond = async () => {
    if (!editCondItem) return;
    setSavingCond(true);
    try {
      const { data } = await axios.patch<Condition>(`/api/medical-profile/${editCondItem.id}`, {
        type: "condition", data: { conditionName: editCondDraft.conditionName.trim(),
          severity: editCondDraft.severity || null, status: editCondDraft.status,
          notes: editCondDraft.notes.trim() || null },
      });
      setConditions(p => p.map(c => c.id === editCondItem.id ? data : c));
      setEditCondItem(null);
    } catch { alert("Error al guardar."); }
    finally { setSavingCond(false); }
  };
  const handleDeleteCond = async (id: string) => {
    if (!confirm("¿Eliminar esta condición?")) return;
    await axios.delete(`/api/medical-profile/${id}?type=condition`).catch(() => alert("Error"));
    setConditions(p => p.filter(c => c.id !== id));
  };

  // ── Medication CRUD ───────────────────────────────────────────────────────
  const handleAddMed = async () => {
    if (!medDraft.name.trim()) { alert("El nombre es obligatorio."); return; }
    setSavingMed(true);
    try {
      const { data } = await axios.post<Medication>("/api/medical-profile", {
        type: "medication", data: { customMedicationName: medDraft.name.trim(),
          dosage: medDraft.dosage.trim() || null, frequency: medDraft.frequency.trim() || null },
      });
      setMeds(p => [data, ...p]);
      setMedDraft({ name: "", dosage: "", frequency: "" });
      setAddMedOpen(false);
    } catch { alert("Error al guardar."); }
    finally { setSavingMed(false); }
  };
  const handleSaveEditMed = async () => {
    if (!editMedItem) return;
    setSavingMed(true);
    try {
      const { data } = await axios.patch<Medication>(`/api/medical-profile/${editMedItem.id}`, {
        type: "medication", data: { name: editMedDraft.name.trim(),
          dosage: editMedDraft.dosage.trim() || null, frequency: editMedDraft.frequency.trim() || null,
          isCurrent: editMedDraft.isCurrent },
      });
      setMeds(p => p.map(m => m.id === editMedItem.id ? data : m));
      setEditMedItem(null);
    } catch { alert("Error al guardar."); }
    finally { setSavingMed(false); }
  };
  const handleDeleteMed = async (id: string) => {
    if (!confirm("¿Eliminar este medicamento?")) return;
    await axios.delete(`/api/medical-profile/${id}?type=medication`).catch(() => alert("Error"));
    setMeds(p => p.filter(m => m.id !== id));
  };

  // ── Contact CRUD ──────────────────────────────────────────────────────────
  const handleAddContact = async () => {
    if (!contactDraft.name.trim() || !contactDraft.phone.trim()) { alert("Nombre y teléfono son obligatorios."); return; }
    setSavingContact(true);
    try {
      const { data } = await axios.post<Contact>("/api/contacts", {
        name: contactDraft.name.trim(), phone: contactDraft.phone.trim(),
        relation: contactDraft.relation.trim() || "Contacto",
        email: contactDraft.email.trim() || undefined,
      });
      setContacts(p => [...p, data]);
      setContactDraft({ name: "", phone: "", relation: "", email: "" });
      setAddContactOpen(false);
    } catch { alert("Error al guardar."); }
    finally { setSavingContact(false); }
  };
  const handleSaveEditContact = async () => {
    if (!editContactItem) return;
    setSavingContact(true);
    try {
      const { data } = await axios.put<Contact>(`/api/contacts/${editContactItem.id}`, {
        name: editContactDraft.name.trim(), phone: editContactDraft.phone.trim(),
        relation: editContactDraft.relation.trim() || "Contacto",
        email: editContactDraft.email.trim() || undefined,
      });
      setContacts(p => p.map(c => c.id === editContactItem.id ? data : c));
      setEditContactItem(null);
    } catch { alert("Error al guardar."); }
    finally { setSavingContact(false); }
  };
  const handleDeleteContact = async (id: string) => {
    if (!confirm("¿Eliminar este contacto?")) return;
    await axios.delete(`/api/contacts/${id}`).catch(() => alert("Error"));
    setContacts(p => p.filter(c => c.id !== id));
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const initials = profile ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() : "?";
  const activeAllergies  = allergies.filter(a => a.isActive).length;
  const activeConditions = conditions.filter(c => c.status === "ACTIVE").length;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <p style={{ color: C.muted, fontFamily: SANS, fontSize: 15 }}>Cargando perfil…</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680, margin: "0 auto", paddingBottom: 40 }}>

      {/* ── Avatar card ─────────────────────────────────────────────────────── */}
      <div style={{ background: C.card, borderRadius: 28, padding: "24px 20px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ position: "relative", marginBottom: 4 }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: C.pink,
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {profile?.photoUrl
              ? <Image src={profile.photoUrl} alt="avatar" width={96} height={96} style={{ objectFit: "cover", borderRadius: "50%" }} />
              : <span style={{ fontSize: 32, fontFamily: DISPLAY, fontWeight: 700, color: "#7A1A3A" }}>{initials}</span>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}
            style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: "50%",
              background: C.primary, border: `3px solid ${C.card}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            {uploadingPhoto ? <span style={{ color: "#fff", fontSize: 10 }}>…</span> : <CameraIcon color="#fff" size={14} />}
          </button>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 20, fontFamily: DISPLAY, fontWeight: 700, color: C.primary, letterSpacing: "-0.4px" }}>
          {profile?.firstName} {profile?.lastName}
        </p>
        <p style={{ margin: 0, fontSize: 13, fontFamily: SANS, color: C.muted }}>{profile?.email}</p>
        <button onClick={openEdit}
          style={{ display: "flex", alignItems: "center", gap: 8, background: C.primary, color: "#fff",
            border: "none", borderRadius: 20, padding: "10px 18px", fontSize: 13,
            fontFamily: SANS, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
          <PencilIcon color="#fff" size={14} /> Editar perfil
        </button>
      </div>

      {/* ── Datos personales ─────────────────────────────────────────────────── */}
      <Accordion title="Datos personales" icon={<UserIcon color={C.muted} size={16} />}
        open={open.personal} onToggle={() => toggle("personal")}>
        <InfoRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>} label="Correo" value={profile?.email ?? "—"} />
        {divider}
        <InfoRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>} label="Fecha de nacimiento" value={fmtDate(profile?.dateOfBirth ?? null)} />
        {divider}
        <InfoRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>} label="Género" value={GENDER[profile?.gender ?? ""] || "—"} />
        {divider}
        <InfoRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h2M16 14h2M6 10h.01M6 14h.01"/></svg>} label="Tipo de documento" value={IDTYPE[profile?.identificationType ?? ""] || "—"} />
        {divider}
        <InfoRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h2M16 14h2M6 10h.01M6 14h.01"/></svg>} label="Número de documento" value={profile?.identificationNumber ?? "—"} />
      </Accordion>

      {/* ── Datos médicos ─────────────────────────────────────────────────────── */}
      <Accordion title="Datos médicos" icon={<HeartIcon color={C.muted} size={16} />}
        open={open.medical} onToggle={() => toggle("medical")}>
        <InfoRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>} label="Tipo de sangre" value={BLOOD[profile?.bloodType ?? ""] || "—"} />
        {divider}
        <InfoRow icon={<UserIcon color={C.muted} size={14} />} label="Altura" value={medProfile.heightCm != null ? `${medProfile.heightCm} cm` : "—"} />
        {divider}
        <InfoRow icon={<UserIcon color={C.muted} size={14} />} label="Peso" value={medProfile.weightKg != null ? `${medProfile.weightKg} kg` : "—"} />
        {divider}
        <InfoRow icon={<HeartIcon color={C.muted} size={14} />} label="Donante de órganos" value={medProfile.organDonor ? "Sí" : "No"} />
        {medProfile.insuranceProvider && <>
          {divider}
          <InfoRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h2M16 14h2"/></svg>} label="Aseguradora" value={medProfile.insuranceProvider} />
        </>}
      </Accordion>

      {/* ── Alergias ─────────────────────────────────────────────────────────── */}
      <Accordion title="Alergias" icon={<HeartIcon color={C.muted} size={16} />}
        badge={activeAllergies} open={open.allergies} onToggle={() => toggle("allergies")}>
        {allergies.length === 0
          ? <p style={{ color: C.muted, fontFamily: SANS, fontSize: 13, textAlign: "center", padding: "8px 0" }}>Sin alergias registradas</p>
          : allergies.map((a, i) => (
            <div key={a.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", opacity: a.isActive ? 1 : 0.45 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontFamily: SANS, fontWeight: 700, color: C.primary }}>{a.allergenName}</p>
                  <p style={{ margin: 0, fontSize: 12, fontFamily: SANS, color: C.muted }}>{lbl(ALLERGY_TYPES, a.allergyType)}</p>
                </div>
                <Badge label={lbl(ALLERGY_SEV, a.severity)} color={severityColor(a.severity)} />
                <button onClick={() => { setEditAllergyDraft({ allergenName: a.allergenName, allergyType: a.allergyType, severity: a.severity, reactionDescription: a.reactionDescription ?? "" }); setEditAllergyItem(a); }}
                  style={iconBtnStyle}><PencilIcon color={C.primary} size={14} /></button>
                <button onClick={() => handleDeleteAllergy(a.id)} style={{ ...iconBtnStyle, background: "#EF444422" }}><TrashIcon color={C.red} size={14} /></button>
              </div>
              {i < allergies.length - 1 && divider}
            </div>
          ))
        }
        <AddBtn label="Agregar alergia" onClick={() => setAddAllergyOpen(true)} />
      </Accordion>

      {/* ── Condiciones crónicas ─────────────────────────────────────────────── */}
      <Accordion title="Condiciones crónicas" icon={<HeartIcon color={C.muted} size={16} />}
        badge={activeConditions} open={open.conditions} onToggle={() => toggle("conditions")}>
        {conditions.length === 0
          ? <p style={{ color: C.muted, fontFamily: SANS, fontSize: 13, textAlign: "center", padding: "8px 0" }}>Sin condiciones registradas</p>
          : conditions.map((c, i) => (
            <div key={c.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontFamily: SANS, fontWeight: 700, color: C.primary }}>{c.conditionName}</p>
                  {c.notes && <p style={{ margin: 0, fontSize: 12, fontFamily: SANS, color: C.muted }}>{c.notes}</p>}
                </div>
                <Badge label={lbl(COND_STATUS, c.status)} color={condColor(c.status)} />
                <button onClick={() => { setEditCondDraft({ conditionName: c.conditionName, severity: c.severity ?? "", status: c.status, notes: c.notes ?? "" }); setEditCondItem(c); }}
                  style={iconBtnStyle}><PencilIcon color={C.primary} size={14} /></button>
                <button onClick={() => handleDeleteCond(c.id)} style={{ ...iconBtnStyle, background: "#EF444422" }}><TrashIcon color={C.red} size={14} /></button>
              </div>
              {i < conditions.length - 1 && divider}
            </div>
          ))
        }
        <AddBtn label="Agregar condición" onClick={() => setAddCondOpen(true)} />
      </Accordion>

      {/* ── Medicamentos ─────────────────────────────────────────────────────── */}
      <Accordion title="Medicamentos" icon={<HeartIcon color={C.muted} size={16} />}
        badge={meds.length} open={open.meds} onToggle={() => toggle("meds")}>
        {meds.length === 0
          ? <p style={{ color: C.muted, fontFamily: SANS, fontSize: 13, textAlign: "center", padding: "8px 0" }}>Sin medicamentos registrados</p>
          : meds.map((m, i) => (
            <div key={m.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", opacity: m.isCurrent ? 1 : 0.45 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontFamily: SANS, fontWeight: 700, color: C.primary }}>{m.name}</p>
                  {(m.dosage || m.frequency) && (
                    <p style={{ margin: 0, fontSize: 12, fontFamily: SANS, color: C.muted }}>{[m.dosage, m.frequency].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                {!m.isCurrent && <Badge label="Inactivo" color={C.muted} />}
                <button onClick={() => { setEditMedDraft({ name: m.name, dosage: m.dosage ?? "", frequency: m.frequency ?? "", isCurrent: m.isCurrent }); setEditMedItem(m); }}
                  style={iconBtnStyle}><PencilIcon color={C.primary} size={14} /></button>
                <button onClick={() => handleDeleteMed(m.id)} style={{ ...iconBtnStyle, background: "#EF444422" }}><TrashIcon color={C.red} size={14} /></button>
              </div>
              {i < meds.length - 1 && divider}
            </div>
          ))
        }
        <AddBtn label="Agregar medicamento" onClick={() => setAddMedOpen(true)} />
      </Accordion>

      {/* ── Contactos de emergencia ───────────────────────────────────────────── */}
      <Accordion title="Contactos de emergencia" icon={<PhoneIcon color={C.muted} size={16} />}
        badge={contacts.length} open={open.contacts} onToggle={() => toggle("contacts")}>
        {contacts.length === 0
          ? <p style={{ color: C.muted, fontFamily: SANS, fontSize: 13, textAlign: "center", padding: "8px 0" }}>Sin contactos registrados</p>
          : contacts.map((c, i) => (
            <div key={c.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontFamily: SANS, fontWeight: 700, color: C.primary }}>{c.name}</p>
                  <p style={{ margin: 0, fontSize: 12, fontFamily: SANS, color: C.muted }}>{c.relation}{c.email ? ` · ${c.email}` : ""}</p>
                </div>
                <a href={`tel:${c.phone}`}
                  style={{ width: 34, height: 34, borderRadius: 10, background: "#22C55E22",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, textDecoration: "none" }}>
                  <PhoneIcon color={C.green} size={16} />
                </a>
                <button onClick={() => { setEditContactDraft({ name: c.name, phone: c.phone, relation: c.relation, email: c.email ?? "" }); setEditContactItem(c); }}
                  style={iconBtnStyle}><PencilIcon color={C.primary} size={14} /></button>
                <button onClick={() => handleDeleteContact(c.id)} style={{ ...iconBtnStyle, background: "#EF444422" }}><TrashIcon color={C.red} size={14} /></button>
              </div>
              {i < contacts.length - 1 && divider}
            </div>
          ))
        }
        <AddBtn label="Agregar contacto" onClick={() => setAddContactOpen(true)} />
      </Accordion>

      {/* ══════════════════════════ MODALES ══════════════════════════════════════ */}

      {/* ── Editar perfil ─────────────────────────────────────────────────────── */}
      {editOpen && (
        <Modal title="Editar perfil" onClose={() => !saving && setEditOpen(false)}
          footer={<SheetBtns onCancel={() => setEditOpen(false)} onSave={handleSave} saving={saving} />}>
          <SectionLabel>Datos básicos</SectionLabel>
          <Field label="Nombre *" value={draft.firstName} onChange={v => setDraft(d => ({ ...d, firstName: v }))} />
          <Field label="Apellido *" value={draft.lastName} onChange={v => setDraft(d => ({ ...d, lastName: v }))} />
          <Field label="Correo electrónico" value={draft.email} locked />

          <SectionLabel>Información personal</SectionLabel>
          <SelectField label="Género" value={draft.gender} onChange={v => setDraft(d => ({ ...d, gender: v }))} options={GENDERS} />
          <SectionLabel>Documento {idLocked && "(bloqueado — ya registrado)"}</SectionLabel>
          <SelectField label="Tipo de documento" value={draft.identificationType} onChange={v => setDraft(d => ({ ...d, identificationType: v }))} options={ID_TYPES} locked={idLocked} />
          <Field label="Número de documento" value={draft.identificationNumber} onChange={v => setDraft(d => ({ ...d, identificationNumber: v }))} locked={idLocked} />

          <SectionLabel>Perfil médico</SectionLabel>
          <SelectField label="Tipo de sangre" value={draft.bloodType} onChange={v => setDraft(d => ({ ...d, bloodType: v }))} options={BLOOD_OPTS} locked />
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><Field label="Altura (cm)" value={draft.heightCm} onChange={v => setDraft(d => ({ ...d, heightCm: v }))} placeholder="170" /></div>
            <div style={{ flex: 1 }}><Field label="Peso (kg)" value={draft.weightKg} onChange={v => setDraft(d => ({ ...d, weightKg: v }))} placeholder="65" /></div>
          </div>
          <div style={{ background: C.card, borderRadius: 16, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: 14, fontFamily: SANS, color: C.primary }}>Donante de órganos</p>
            <input type="checkbox" checked={draft.organDonor} onChange={e => setDraft(d => ({ ...d, organDonor: e.target.checked }))}
              style={{ width: 18, height: 18, accentColor: C.primary, cursor: "pointer" }} />
          </div>
          <Field label="Aseguradora" value={draft.insuranceProvider} onChange={v => setDraft(d => ({ ...d, insuranceProvider: v }))} placeholder="Nombre de la EPS / seguro" />
        </Modal>
      )}

      {/* ── Agregar alergia ───────────────────────────────────────────────────── */}
      {addAllergyOpen && (
        <Modal title="Agregar alergia" onClose={() => setAddAllergyOpen(false)}
          footer={<SheetBtns onCancel={() => setAddAllergyOpen(false)} onSave={handleAddAllergy} saving={savingAllergy} />}>
          <Field label="Nombre del alérgeno *" value={allergyDraft.allergenName} onChange={v => setAllergyDraft(d => ({ ...d, allergenName: v }))} placeholder="p. ej. Penicilina" />
          <SelectField label="Tipo *" value={allergyDraft.allergyType} onChange={v => setAllergyDraft(d => ({ ...d, allergyType: v }))} options={ALLERGY_TYPES} />
          <SelectField label="Severidad *" value={allergyDraft.severity} onChange={v => setAllergyDraft(d => ({ ...d, severity: v }))} options={ALLERGY_SEV} />
          <Field label="Descripción de reacción (opcional)" value={allergyDraft.reactionDescription} onChange={v => setAllergyDraft(d => ({ ...d, reactionDescription: v }))} placeholder="p. ej. Urticaria, dificultad respiratoria" />
        </Modal>
      )}

      {/* ── Editar alergia ────────────────────────────────────────────────────── */}
      {editAllergyItem && (
        <Modal title="Editar alergia" onClose={() => setEditAllergyItem(null)}
          footer={<SheetBtns onCancel={() => setEditAllergyItem(null)} onSave={handleSaveEditAllergy} saving={savingAllergy} />}>
          <Field label="Nombre del alérgeno *" value={editAllergyDraft.allergenName} onChange={v => setEditAllergyDraft(d => ({ ...d, allergenName: v }))} />
          <SelectField label="Tipo *" value={editAllergyDraft.allergyType} onChange={v => setEditAllergyDraft(d => ({ ...d, allergyType: v }))} options={ALLERGY_TYPES} />
          <SelectField label="Severidad *" value={editAllergyDraft.severity} onChange={v => setEditAllergyDraft(d => ({ ...d, severity: v }))} options={ALLERGY_SEV} />
          <Field label="Descripción de reacción (opcional)" value={editAllergyDraft.reactionDescription} onChange={v => setEditAllergyDraft(d => ({ ...d, reactionDescription: v }))} />
        </Modal>
      )}

      {/* ── Agregar condición ─────────────────────────────────────────────────── */}
      {addCondOpen && (
        <Modal title="Agregar condición" onClose={() => setAddCondOpen(false)}
          footer={<SheetBtns onCancel={() => setAddCondOpen(false)} onSave={handleAddCond} saving={savingCond} />}>
          <Field label="Nombre de la condición *" value={condDraft.conditionName} onChange={v => setCondDraft(d => ({ ...d, conditionName: v }))} placeholder="p. ej. Diabetes tipo 2" />
          <SelectField label="Severidad" value={condDraft.severity} onChange={v => setCondDraft(d => ({ ...d, severity: v }))} options={COND_SEV} />
          <SelectField label="Estado" value={condDraft.status} onChange={v => setCondDraft(d => ({ ...d, status: v }))} options={COND_STATUS} />
          <Field label="Notas (opcional)" value={condDraft.notes} onChange={v => setCondDraft(d => ({ ...d, notes: v }))} placeholder="Información adicional" />
        </Modal>
      )}

      {/* ── Editar condición ──────────────────────────────────────────────────── */}
      {editCondItem && (
        <Modal title="Editar condición" onClose={() => setEditCondItem(null)}
          footer={<SheetBtns onCancel={() => setEditCondItem(null)} onSave={handleSaveEditCond} saving={savingCond} />}>
          <Field label="Nombre de la condición *" value={editCondDraft.conditionName} onChange={v => setEditCondDraft(d => ({ ...d, conditionName: v }))} />
          <SelectField label="Severidad" value={editCondDraft.severity} onChange={v => setEditCondDraft(d => ({ ...d, severity: v }))} options={COND_SEV} />
          <SelectField label="Estado" value={editCondDraft.status} onChange={v => setEditCondDraft(d => ({ ...d, status: v }))} options={COND_STATUS} />
          <Field label="Notas (opcional)" value={editCondDraft.notes} onChange={v => setEditCondDraft(d => ({ ...d, notes: v }))} />
        </Modal>
      )}

      {/* ── Agregar medicamento ───────────────────────────────────────────────── */}
      {addMedOpen && (
        <Modal title="Agregar medicamento" onClose={() => setAddMedOpen(false)}
          footer={<SheetBtns onCancel={() => setAddMedOpen(false)} onSave={handleAddMed} saving={savingMed} />}>
          <Field label="Nombre del medicamento *" value={medDraft.name} onChange={v => setMedDraft(d => ({ ...d, name: v }))} placeholder="Ej: Metformina" />
          <Field label="Dosis (opcional)" value={medDraft.dosage} onChange={v => setMedDraft(d => ({ ...d, dosage: v }))} placeholder="Ej: 500mg" />
          <Field label="Frecuencia (opcional)" value={medDraft.frequency} onChange={v => setMedDraft(d => ({ ...d, frequency: v }))} placeholder="Ej: Cada 8 horas" />
        </Modal>
      )}

      {/* ── Editar medicamento ────────────────────────────────────────────────── */}
      {editMedItem && (
        <Modal title="Editar medicamento" onClose={() => setEditMedItem(null)}
          footer={<SheetBtns onCancel={() => setEditMedItem(null)} onSave={handleSaveEditMed} saving={savingMed} />}>
          <Field label="Nombre del medicamento *" value={editMedDraft.name} onChange={v => setEditMedDraft(d => ({ ...d, name: v }))} />
          <Field label="Dosis" value={editMedDraft.dosage} onChange={v => setEditMedDraft(d => ({ ...d, dosage: v }))} placeholder="Ej: 500mg" />
          <Field label="Frecuencia" value={editMedDraft.frequency} onChange={v => setEditMedDraft(d => ({ ...d, frequency: v }))} placeholder="Ej: Cada 8 horas" />
          <div style={{ background: C.card, borderRadius: 16, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: 14, fontFamily: SANS, color: C.primary }}>Medicamento activo</p>
            <input type="checkbox" checked={editMedDraft.isCurrent} onChange={e => setEditMedDraft(d => ({ ...d, isCurrent: e.target.checked }))}
              style={{ width: 18, height: 18, accentColor: C.primary, cursor: "pointer" }} />
          </div>
        </Modal>
      )}

      {/* ── Agregar contacto ──────────────────────────────────────────────────── */}
      {addContactOpen && (
        <Modal title="Agregar contacto" onClose={() => setAddContactOpen(false)}
          footer={<SheetBtns onCancel={() => setAddContactOpen(false)} onSave={handleAddContact} saving={savingContact} />}>
          <Field label="Nombre completo *" value={contactDraft.name} onChange={v => setContactDraft(d => ({ ...d, name: v }))} placeholder="Ej: María García" />
          <Field label="Teléfono *" value={contactDraft.phone} onChange={v => setContactDraft(d => ({ ...d, phone: v }))} placeholder="Ej: 3001234567" />
          <Field label="Parentesco / relación" value={contactDraft.relation} onChange={v => setContactDraft(d => ({ ...d, relation: v }))} placeholder="Ej: Mamá, Esposo, Médico" />
          <Field label="Correo (opcional)" value={contactDraft.email} onChange={v => setContactDraft(d => ({ ...d, email: v }))} placeholder="correo@ejemplo.com" />
        </Modal>
      )}

      {/* ── Editar contacto ───────────────────────────────────────────────────── */}
      {editContactItem && (
        <Modal title="Editar contacto" onClose={() => setEditContactItem(null)}
          footer={<SheetBtns onCancel={() => setEditContactItem(null)} onSave={handleSaveEditContact} saving={savingContact} />}>
          <Field label="Nombre completo *" value={editContactDraft.name} onChange={v => setEditContactDraft(d => ({ ...d, name: v }))} />
          <Field label="Teléfono *" value={editContactDraft.phone} onChange={v => setEditContactDraft(d => ({ ...d, phone: v }))} />
          <Field label="Parentesco / relación" value={editContactDraft.relation} onChange={v => setEditContactDraft(d => ({ ...d, relation: v }))} placeholder="Ej: Mamá, Esposo, Médico" />
          <Field label="Correo (opcional)" value={editContactDraft.email} onChange={v => setEditContactDraft(d => ({ ...d, email: v }))} placeholder="correo@ejemplo.com" />
        </Modal>
      )}

    </div>
  );
}
