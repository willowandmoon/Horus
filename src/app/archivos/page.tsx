"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import FloatingSidebar from "@/src/components/FloatingSidebar";

const DISPLAY = "var(--font-space-grotesk), system-ui, sans-serif";
const SANS = "var(--font-dm-sans), system-ui, sans-serif";

const C = {
  bg: "#F2F1EC",
  card: "#FFFFFF",
  primary: "#1A1512",
  muted: "#8D99AE",
  mutedBg: "#F0EBE3",
  border: "#E4E2DC",
  green: "#22C55E",
  red: "#EF4444",
};

// ── Enum maps ─────────────────────────────────────────────────────────────────
const BLOOD_LABEL: Record<string, string> = {
  A_POSITIVE: "A+", A_NEGATIVE: "A-", B_POSITIVE: "B+", B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+", AB_NEGATIVE: "AB-", O_POSITIVE: "O+", O_NEGATIVE: "O-",
};
const GENDER_LABEL: Record<string, string> = {
  MALE: "Masculino", FEMALE: "Femenino", OTHER: "Otro", PREFER_NOT_TO_SAY: "Prefiero no decir",
};
const ALLERGY_TYPE_LABEL: Record<string, string> = {
  MEDICATION: "Medicamento", FOOD: "Alimento", ENVIRONMENTAL: "Ambiental", OTHER: "Otro",
};
const ALLERGY_SEV_LABEL: Record<string, string> = {
  MILD: "Leve", MODERATE: "Moderada", SEVERE: "Severa", LIFE_THREATENING: "Crítica",
};
const COND_SEV_LABEL: Record<string, string> = {
  MILD: "Leve", MODERATE: "Moderada", SEVERE: "Severa",
};
const COND_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activa", MANAGED: "Controlada", IN_REMISSION: "En remisión", RESOLVED: "Resuelta",
};
const ROUTE_LABEL: Record<string, string> = {
  ORAL: "Oral", INJECTION: "Inyección", TOPICAL: "Tópico", INHALATION: "Inhalación", OTHER: "Otro",
};
const EVENT_TYPE_LABEL: Record<string, string> = {
  SURGERY: "Cirugía", HOSPITALIZATION: "Hospitalización", VACCINATION: "Vacunación",
  INJURY: "Lesión", OTHER: "Otro",
};

// ── Review types ──────────────────────────────────────────────────────────────
interface ReviewAllergy {
  _id: string; _included: boolean; _expanded: boolean;
  allergenName: string; allergyType: string; severity: string; reactionDescription: string;
}
interface ReviewCondition {
  _id: string; _included: boolean; _expanded: boolean;
  conditionName: string; severity: string; status: string; notes: string;
}
interface ReviewMedication {
  _id: string; _included: boolean; _expanded: boolean;
  customMedicationName: string; dosage: string; frequency: string; route: string; purpose: string;
}
interface ReviewHistory {
  _id: string; _included: boolean; _expanded: boolean;
  eventType: string; eventName: string; location: string; outcome: string;
}
interface ReviewPersonalInfo {
  bloodType: string; gender: string;
  _includeBloodType: boolean; _includeGender: boolean;
}
interface ReviewState {
  personalInfo: ReviewPersonalInfo | null;
  allergies: ReviewAllergy[];
  conditions: ReviewCondition[];
  medications: ReviewMedication[];
  history: ReviewHistory[];
}

function buildReviewState(raw: any): ReviewState {
  let id = 0;
  const nextId = () => String(++id);
  const personalInfo: ReviewPersonalInfo | null =
    raw?.personalInfo?.bloodType || raw?.personalInfo?.gender
      ? {
          bloodType: raw.personalInfo.bloodType || "",
          gender: raw.personalInfo.gender || "",
          _includeBloodType: !!raw.personalInfo.bloodType,
          _includeGender: !!raw.personalInfo.gender,
        }
      : null;
  return {
    personalInfo,
    allergies: (raw?.allergies || []).map((a: any) => ({
      _id: nextId(), _included: true, _expanded: false,
      allergenName: a.allergenName || "",
      allergyType: a.allergyType || "OTHER",
      severity: a.severity || "MILD",
      reactionDescription: a.reactionDescription || "",
    })),
    conditions: (raw?.chronicConditions || []).map((c: any) => ({
      _id: nextId(), _included: true, _expanded: false,
      conditionName: c.conditionName || "",
      severity: c.severity || "MILD",
      status: c.status || "ACTIVE",
      notes: c.notes || "",
    })),
    medications: (raw?.medications || []).map((m: any) => ({
      _id: nextId(), _included: true, _expanded: false,
      customMedicationName: m.customMedicationName || "",
      dosage: m.dosage || "",
      frequency: m.frequency || "",
      route: m.route || "ORAL",
      purpose: m.purpose || "",
    })),
    history: (raw?.medicalHistory || []).map((h: any) => ({
      _id: nextId(), _included: true, _expanded: false,
      eventType: h.eventType || "OTHER",
      eventName: h.eventName || "",
      location: h.location || "",
      outcome: h.outcome || "",
    })),
  };
}

function hasAnyData(raw: any): boolean {
  return !!(
    raw?.personalInfo?.bloodType || raw?.personalInfo?.gender ||
    raw?.allergies?.length || raw?.chronicConditions?.length ||
    raw?.medications?.length || raw?.medicalHistory?.length
  );
}

function countIncluded(state: ReviewState): number {
  return (
    (state.personalInfo
      ? (state.personalInfo._includeBloodType ? 1 : 0) + (state.personalInfo._includeGender ? 1 : 0)
      : 0) +
    state.allergies.filter((a) => a._included).length +
    state.conditions.filter((c) => c._included).length +
    state.medications.filter((m) => m._included).length +
    state.history.filter((h) => h._included).length
  );
}

type FieldStatus = "new" | "exists" | "conflict";

function getFieldStatus(extracted: string, existing?: string | null): FieldStatus {
  if (!existing) return "new";
  return extracted === existing ? "exists" : "conflict";
}

function buildConfirmPayload(
  state: ReviewState,
  existingProfile: { bloodType?: string | null; gender?: string | null },
) {
  const pi = state.personalInfo;
  const btStatus  = pi?.bloodType ? getFieldStatus(pi.bloodType, existingProfile.bloodType) : "new";
  const genStatus = pi?.gender    ? getFieldStatus(pi.gender,    existingProfile.gender)    : "new";
  return {
    personalInfo: pi
      ? {
          ...(pi._includeBloodType  && pi.bloodType && btStatus  === "new" ? { bloodType: pi.bloodType } : {}),
          ...(pi._includeGender     && pi.gender    && genStatus === "new" ? { gender:    pi.gender    } : {}),
        }
      : null,
    allergies: state.allergies
      .filter((a) => a._included)
      .map(({ _id, _included, _expanded, ...rest }) => rest),
    chronicConditions: state.conditions
      .filter((c) => c._included)
      .map(({ _id, _included, _expanded, ...rest }) => rest),
    medications: state.medications
      .filter((m) => m._included)
      .map(({ _id, _included, _expanded, ...rest }) => rest),
    medicalHistory: state.history
      .filter((h) => h._included)
      .map(({ _id, _included, _expanded, ...rest }) => rest),
  };
}

// ── ChipSelector ──────────────────────────────────────────────────────────────
function ChipSelector({
  value, options, labelMap, onChange, color,
}: {
  value: string; options: string[]; labelMap: Record<string, string>;
  onChange: (v: string) => void; color: string;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            fontFamily: SANS, fontSize: 11, fontWeight: 700,
            padding: "4px 10px", borderRadius: 20,
            backgroundColor: value === opt ? color : "transparent",
            border: `1.5px solid ${value === opt ? color : "#C8C2B6"}`,
            color: value === opt ? "#fff" : "#888",
            cursor: "pointer",
          }}
        >
          {labelMap[opt] || opt}
        </button>
      ))}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
function SectionHeader({ title, included, total, color }: {
  title: string; included: number; total: number; color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 12 }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 700, color: C.primary }}>{title}</span>
      <span style={{
        fontFamily: SANS, fontSize: 11, fontWeight: 700,
        backgroundColor: color + "22", color, borderRadius: 20, padding: "2px 10px",
      }}>
        {included}/{total} incluidos
      </span>
    </div>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────────────────
function Checkmark() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ToggleCheck({ included, onToggle }: { included: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${included ? C.green : "#C8C2B6"}`,
        backgroundColor: included ? C.green : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", padding: 0,
      }}
    >
      {included && <Checkmark />}
    </button>
  );
}

// ── ItemRow ───────────────────────────────────────────────────────────────────
function ItemRow({
  included, onToggle, title, subtitle, expanded, onExpand, children,
}: {
  included: boolean; onToggle: () => void;
  title: string; subtitle?: string;
  expanded: boolean; onExpand: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: C.card, borderRadius: 16, marginBottom: 8,
      opacity: included ? 1 : 0.5,
      border: `1.5px solid ${included ? C.green + "44" : "#C8C2B6"}`,
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 10 }}>
        <ToggleCheck included={included} onToggle={onToggle} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 400, color: C.muted, marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        <button
          onClick={onExpand}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            backgroundColor: C.mutedBg, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            {expanded ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
          </svg>
        </button>
      </div>
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 14px", backgroundColor: C.bg }}>
          {children}
        </div>
      )}
    </div>
  );
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 400, color: C.muted, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

function FieldInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        fontFamily: SANS, fontSize: 13, fontWeight: 500, color: C.primary,
        width: "100%", padding: "8px 12px", borderRadius: 10,
        border: `1.5px solid ${C.border}`, backgroundColor: C.card,
        outline: "none", boxSizing: "border-box",
      }}
    />
  );
}

function PersonalToggleRow({ included, onToggle, label, value, status }: {
  included: boolean; onToggle: () => void; label: string; value: string; status: FieldStatus;
}) {
  const disabled = status === "exists" || status === "conflict";
  const borderColor =
    status === "conflict" ? "#F97316" :
    status === "exists"   ? C.muted + "66" :
    included              ? C.green + "44" : "#C8C2B6";

  return (
    <div style={{
      backgroundColor: C.card, borderRadius: 16, marginBottom: 8,
      opacity: disabled ? 0.7 : included ? 1 : 0.5,
      border: `1.5px solid ${borderColor}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 10 }}>
        <ToggleCheck included={included && !disabled} onToggle={disabled ? () => {} : onToggle} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 400, color: C.muted }}>{label}</div>
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.primary }}>{value}</div>
        </div>
        {status === "exists" && (
          <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: C.muted, backgroundColor: C.mutedBg, borderRadius: 20, padding: "3px 8px", whiteSpace: "nowrap" }}>
            Ya guardado
          </span>
        )}
        {status === "conflict" && (
          <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: "#F97316", backgroundColor: "#FFF7ED", borderRadius: 20, padding: "3px 8px", whiteSpace: "nowrap" }}>
            ⚠ Conflicto
          </span>
        )}
      </div>
      {status === "conflict" && (
        <div style={{ borderTop: `1px solid #FED7AA`, padding: "8px 14px", backgroundColor: "#FFF7ED" }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: "#C2410C" }}>
            El documento indica <strong>{value}</strong>, pero tu perfil ya tiene un valor distinto. No se puede sobreescribir desde aquí.
          </div>
        </div>
      )}
    </div>
  );
}

// ── MedicalReviewModal ────────────────────────────────────────────────────────
function MedicalReviewModal({ structuredData, normalizedMedications, userId, onClose, onSaved }: {
  structuredData: any;
  normalizedMedications: Record<string, string>;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, setState] = useState<ReviewState>(() => buildReviewState(structuredData));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingProfile, setExistingProfile] = useState<{ bloodType?: string | null; gender?: string | null }>({});

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((profile) => {
        const bt = profile?.bloodType ?? null;
        const gen = profile?.gender ?? null;
        setExistingProfile({ bloodType: bt, gender: gen });
        // Auto-deselect fields that already exist in profile or conflict
        setState((s) => {
          if (!s.personalInfo) return s;
          return {
            ...s,
            personalInfo: {
              ...s.personalInfo,
              _includeBloodType: s.personalInfo.bloodType ? getFieldStatus(s.personalInfo.bloodType, bt)  === "new" : false,
              _includeGender:    s.personalInfo.gender    ? getFieldStatus(s.personalInfo.gender,    gen) === "new" : false,
            },
          };
        });
      })
      .catch(() => {});
  }, []);

  const included = countIncluded(state);

  function patchAllergy(id: string, p: Partial<ReviewAllergy>) {
    setState((s) => ({ ...s, allergies: s.allergies.map((a) => (a._id === id ? { ...a, ...p } : a)) }));
  }
  function patchCondition(id: string, p: Partial<ReviewCondition>) {
    setState((s) => ({ ...s, conditions: s.conditions.map((c) => (c._id === id ? { ...c, ...p } : c)) }));
  }
  function patchMedication(id: string, p: Partial<ReviewMedication>) {
    setState((s) => ({ ...s, medications: s.medications.map((m) => (m._id === id ? { ...m, ...p } : m)) }));
  }
  function patchHistory(id: string, p: Partial<ReviewHistory>) {
    setState((s) => ({ ...s, history: s.history.map((h) => (h._id === id ? { ...h, ...p } : h)) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = buildConfirmPayload(state, existingProfile);
      await fetch("/api/medical-history/confirmExtraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, structuredData: payload, normalizedMedications }),
      });
      setSaved(true);
      setTimeout(onSaved, 1400);
    } catch {
      setSaving(false);
    }
  }

  const totalItems =
    (state.personalInfo ? (state.personalInfo.bloodType ? 1 : 0) + (state.personalInfo.gender ? 1 : 0) : 0) +
    state.allergies.length + state.conditions.length + state.medications.length + state.history.length;

  if (saved) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(26,21,18,0.45)", padding: "20px" }}>
        <div style={{ backgroundColor: C.bg, borderRadius: 28, padding: "48px 24px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.green + "22", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 6 }}>¡Datos guardados!</div>
          <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 400, color: C.muted }}>Tu perfil médico ha sido actualizado.</div>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(26,21,18,0.45)", padding: "20px" }} onClick={onClose}>
        <div style={{ backgroundColor: C.bg, borderRadius: 28, padding: "32px 20px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 8 }}>Sin datos encontrados</div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: C.muted, marginBottom: 24 }}>No se detectaron datos médicos en este documento.</div>
          <button onClick={onClose} style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: C.primary, padding: "13px 32px", borderRadius: 14, backgroundColor: C.mutedBg, border: "none", cursor: "pointer" }}>Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(26,21,18,0.45)", padding: "20px" }}>
      <div style={{ backgroundColor: C.bg, borderRadius: 28, width: "100%", maxWidth: 560, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 14px" }}>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: C.primary }}>Revisar datos extraídos</div>
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 400, color: C.muted, marginTop: 2 }}>Selecciona qué datos guardar en tu perfil</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.mutedBg, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>

          {state.personalInfo && (
            <>
              {(() => {
                const btStatus  = state.personalInfo.bloodType ? getFieldStatus(state.personalInfo.bloodType, existingProfile.bloodType) : "new";
                const genStatus = state.personalInfo.gender    ? getFieldStatus(state.personalInfo.gender,    existingProfile.gender)    : "new";
                const actionable = (state.personalInfo.bloodType && btStatus === "new" ? 1 : 0) + (state.personalInfo.gender && genStatus === "new" ? 1 : 0);
                const includedCount = (state.personalInfo._includeBloodType && btStatus === "new" ? 1 : 0) + (state.personalInfo._includeGender && genStatus === "new" ? 1 : 0);
                if (actionable === 0 && (state.personalInfo.bloodType || state.personalInfo.gender)) {
                  return (
                    <div style={{ marginBottom: 10, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 700, color: C.primary }}>Información personal</span>
                      <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: C.muted, backgroundColor: C.mutedBg, borderRadius: 20, padding: "2px 10px" }}>Ya en tu perfil</span>
                    </div>
                  );
                }
                return <SectionHeader title="Información personal" included={includedCount} total={actionable} color="#7C3AED" />;
              })()}

              {state.personalInfo.bloodType && (
                <PersonalToggleRow
                  included={state.personalInfo._includeBloodType}
                  onToggle={() => setState((s) => ({ ...s, personalInfo: s.personalInfo ? { ...s.personalInfo, _includeBloodType: !s.personalInfo._includeBloodType } : null }))}
                  label="Tipo de sangre"
                  value={BLOOD_LABEL[state.personalInfo.bloodType] || state.personalInfo.bloodType}
                  status={getFieldStatus(state.personalInfo.bloodType, existingProfile.bloodType)}
                />
              )}
              {state.personalInfo.gender && (
                <PersonalToggleRow
                  included={state.personalInfo._includeGender}
                  onToggle={() => setState((s) => ({ ...s, personalInfo: s.personalInfo ? { ...s.personalInfo, _includeGender: !s.personalInfo._includeGender } : null }))}
                  label="Género"
                  value={GENDER_LABEL[state.personalInfo.gender] || state.personalInfo.gender}
                  status={getFieldStatus(state.personalInfo.gender, existingProfile.gender)}
                />
              )}
            </>
          )}

          {state.allergies.length > 0 && (
            <>
              <SectionHeader title="Alergias" included={state.allergies.filter((a) => a._included).length} total={state.allergies.length} color="#EF4444" />
              {state.allergies.map((a) => (
                <ItemRow key={a._id} included={a._included} onToggle={() => patchAllergy(a._id, { _included: !a._included })} title={a.allergenName || "Alergia sin nombre"} subtitle={`${ALLERGY_TYPE_LABEL[a.allergyType] || a.allergyType} · ${ALLERGY_SEV_LABEL[a.severity] || a.severity}`} expanded={a._expanded} onExpand={() => patchAllergy(a._id, { _expanded: !a._expanded })}>
                  <FieldWrap label="Nombre del alérgeno"><FieldInput value={a.allergenName} onChange={(v) => patchAllergy(a._id, { allergenName: v })} /></FieldWrap>
                  <FieldWrap label="Tipo"><ChipSelector value={a.allergyType} options={["MEDICATION","FOOD","ENVIRONMENTAL","OTHER"]} labelMap={ALLERGY_TYPE_LABEL} onChange={(v) => patchAllergy(a._id, { allergyType: v })} color="#EF4444" /></FieldWrap>
                  <FieldWrap label="Severidad"><ChipSelector value={a.severity} options={["MILD","MODERATE","SEVERE","LIFE_THREATENING"]} labelMap={ALLERGY_SEV_LABEL} onChange={(v) => patchAllergy(a._id, { severity: v })} color="#EF4444" /></FieldWrap>
                  <FieldWrap label="Descripción de la reacción"><FieldInput value={a.reactionDescription} onChange={(v) => patchAllergy(a._id, { reactionDescription: v })} placeholder="Ej: urticaria, anafilaxia…" /></FieldWrap>
                </ItemRow>
              ))}
            </>
          )}

          {state.conditions.length > 0 && (
            <>
              <SectionHeader title="Condiciones crónicas" included={state.conditions.filter((c) => c._included).length} total={state.conditions.length} color="#F97316" />
              {state.conditions.map((c) => (
                <ItemRow key={c._id} included={c._included} onToggle={() => patchCondition(c._id, { _included: !c._included })} title={c.conditionName || "Condición sin nombre"} subtitle={`${COND_STATUS_LABEL[c.status] || c.status} · ${COND_SEV_LABEL[c.severity] || c.severity}`} expanded={c._expanded} onExpand={() => patchCondition(c._id, { _expanded: !c._expanded })}>
                  <FieldWrap label="Nombre de la condición"><FieldInput value={c.conditionName} onChange={(v) => patchCondition(c._id, { conditionName: v })} /></FieldWrap>
                  <FieldWrap label="Severidad"><ChipSelector value={c.severity} options={["MILD","MODERATE","SEVERE"]} labelMap={COND_SEV_LABEL} onChange={(v) => patchCondition(c._id, { severity: v })} color="#F97316" /></FieldWrap>
                  <FieldWrap label="Estado"><ChipSelector value={c.status} options={["ACTIVE","MANAGED","IN_REMISSION","RESOLVED"]} labelMap={COND_STATUS_LABEL} onChange={(v) => patchCondition(c._id, { status: v })} color="#F97316" /></FieldWrap>
                  <FieldWrap label="Notas"><FieldInput value={c.notes} onChange={(v) => patchCondition(c._id, { notes: v })} placeholder="Notas adicionales…" /></FieldWrap>
                </ItemRow>
              ))}
            </>
          )}

          {state.medications.length > 0 && (
            <>
              <SectionHeader title="Medicamentos" included={state.medications.filter((m) => m._included).length} total={state.medications.length} color="#3B82F6" />
              {state.medications.map((m) => (
                <ItemRow key={m._id} included={m._included} onToggle={() => patchMedication(m._id, { _included: !m._included })} title={m.customMedicationName || "Medicamento sin nombre"} subtitle={[m.dosage, m.frequency].filter(Boolean).join(" · ")} expanded={m._expanded} onExpand={() => patchMedication(m._id, { _expanded: !m._expanded })}>
                  <FieldWrap label="Nombre del medicamento"><FieldInput value={m.customMedicationName} onChange={(v) => patchMedication(m._id, { customMedicationName: v })} /></FieldWrap>
                  <FieldWrap label="Dosis"><FieldInput value={m.dosage} onChange={(v) => patchMedication(m._id, { dosage: v })} placeholder="Ej: 500mg" /></FieldWrap>
                  <FieldWrap label="Frecuencia"><FieldInput value={m.frequency} onChange={(v) => patchMedication(m._id, { frequency: v })} placeholder="Ej: cada 8 horas" /></FieldWrap>
                  <FieldWrap label="Vía"><ChipSelector value={m.route} options={["ORAL","INJECTION","TOPICAL","INHALATION","OTHER"]} labelMap={ROUTE_LABEL} onChange={(v) => patchMedication(m._id, { route: v })} color="#3B82F6" /></FieldWrap>
                  <FieldWrap label="Propósito"><FieldInput value={m.purpose} onChange={(v) => patchMedication(m._id, { purpose: v })} placeholder="Ej: control de presión" /></FieldWrap>
                </ItemRow>
              ))}
            </>
          )}

          {state.history.length > 0 && (
            <>
              <SectionHeader title="Historial médico" included={state.history.filter((h) => h._included).length} total={state.history.length} color="#8B5CF6" />
              {state.history.map((h) => (
                <ItemRow key={h._id} included={h._included} onToggle={() => patchHistory(h._id, { _included: !h._included })} title={h.eventName || EVENT_TYPE_LABEL[h.eventType] || h.eventType} subtitle={EVENT_TYPE_LABEL[h.eventType] || h.eventType} expanded={h._expanded} onExpand={() => patchHistory(h._id, { _expanded: !h._expanded })}>
                  <FieldWrap label="Tipo de evento"><ChipSelector value={h.eventType} options={["SURGERY","HOSPITALIZATION","VACCINATION","INJURY","OTHER"]} labelMap={EVENT_TYPE_LABEL} onChange={(v) => patchHistory(h._id, { eventType: v })} color="#8B5CF6" /></FieldWrap>
                  <FieldWrap label="Nombre del evento"><FieldInput value={h.eventName} onChange={(v) => patchHistory(h._id, { eventName: v })} /></FieldWrap>
                  <FieldWrap label="Lugar"><FieldInput value={h.location} onChange={(v) => patchHistory(h._id, { location: v })} placeholder="Ej: Hospital General" /></FieldWrap>
                  <FieldWrap label="Resultado"><FieldInput value={h.outcome} onChange={(v) => patchHistory(h._id, { outcome: v })} placeholder="Ej: recuperación completa" /></FieldWrap>
                </ItemRow>
              ))}
            </>
          )}

          <div style={{ height: 16 }} />
        </div>

        {/* Bottom bar */}
        <div style={{ padding: "12px 16px 20px", borderTop: `1px solid ${C.border}`, backgroundColor: C.card, display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, fontFamily: SANS, fontSize: 15, fontWeight: 700, color: C.primary, padding: "13px 0", borderRadius: 14, backgroundColor: C.mutedBg, border: "none", cursor: "pointer" }}
          >
            Descartar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || included === 0}
            style={{ flex: 2, fontFamily: SANS, fontSize: 15, fontWeight: 700, color: "#fff", padding: "13px 0", borderRadius: 14, backgroundColor: included === 0 ? "#C8C2B6" : C.primary, border: "none", cursor: saving || included === 0 ? "not-allowed" : "pointer", opacity: saving ? 0.8 : 1 }}
          >
            {saving ? "Guardando…" : `Guardar ${included} dato${included !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── File type helpers ─────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, { bg: string; fg: string; label: string }> = {
  pdf:   { bg: "#FAB2D3", fg: "#7A0038", label: "PDF" },
  image: { bg: "#FAD957", fg: "#482D00", label: "Imagen" },
  word:  { bg: "#A5CCF4", fg: "#0D3A6E", label: "Word" },
  json:  { bg: "#96C979", fg: "#1A3C12", label: "JSON" },
  text:  { bg: "#C4B5FD", fg: "#4C1D95", label: "Texto" },
  other: { bg: C.mutedBg, fg: C.muted,   label: "Archivo" },
};

function getTypeKey(fileType: string): keyof typeof TYPE_COLOR {
  const t = (fileType ?? "").toLowerCase();
  if (t.includes("pdf")) return "pdf";
  if (t.includes("png") || t.includes("jpg") || t.includes("jpeg") || t.includes("gif") || t.includes("webp") || t.includes("image")) return "image";
  if (t.includes("doc") || t.includes("word")) return "word";
  if (t.includes("json")) return "json";
  if (t.includes("text") || t.includes("txt") || t.includes("csv")) return "text";
  return "other";
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === "pdf") return (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
  if (type === "image") return (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
  if (type === "json") return (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    </svg>
  );
  return (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
    </svg>
  );
}

interface DocumentItem {
  fileUrl: string;
  publicId: string;
  resourceType: string;
  extractedText: string;
  fileType: string;
  uploadedAt: string;
  filename?: string;
}

function safeDate(raw: string | undefined | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function getFilename(doc: DocumentItem): string {
  if (doc.filename && doc.filename.trim()) return doc.filename;
  try {
    const segments = (doc.publicId ?? doc.fileUrl ?? "").split("/");
    const last = segments[segments.length - 1] ?? "";
    return decodeURIComponent(last) || "Documento";
  } catch {
    return "Documento";
  }
}

// ── DisclaimerModal ───────────────────────────────────────────────────────────
function DisclaimerModal({ file, onConfirm, onCancel }: {
  file: File; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(26,21,18,0.5)", padding: "20px" }} onClick={onCancel}>
      <div style={{ backgroundColor: C.card, borderRadius: 28, width: "100%", maxWidth: 480, padding: "28px 28px 32px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.mutedBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={28} height={28} fill="none" viewBox="0 0 24 24" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <button onClick={onCancel} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.mutedBg, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.primary, marginBottom: 12 }}>Aviso importante</div>
        <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 400, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>
          HORUS actúa como plataforma de almacenamiento y análisis. No verificamos la exactitud de los documentos médicos subidos.<br /><br />
          Al continuar, confirmas que:<br />
          • Eres el titular o tienes autorización para subir este documento.<br />
          • La información es real y tuya.<br />
          • El análisis con IA es orientativo y no reemplaza criterio médico.<br /><br />
          <strong style={{ fontFamily: SANS, fontWeight: 700, color: C.primary }}>HORUS no se hace responsable del contenido ni del uso que se dé a la información extraída.</strong>
        </div>

        {/* File preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: C.mutedBg, borderRadius: 12, padding: "10px 14px", marginBottom: 20 }}>
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
          <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: C.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, fontFamily: SANS, fontSize: 15, fontWeight: 700, color: C.muted, padding: "14px 0", borderRadius: 16, backgroundColor: C.mutedBg, border: "none", cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ flex: 1, fontFamily: SANS, fontSize: 15, fontWeight: 700, color: "#fff", padding: "14px 0", borderRadius: 16, backgroundColor: C.primary, border: "none", cursor: "pointer" }}>
            Entiendo, subir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DeleteModal ───────────────────────────────────────────────────────────────
function DeleteModal({ doc, onConfirm, onCancel, deleting }: {
  doc: DocumentItem; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  const name = getFilename(doc);
  const typeKey = getTypeKey(doc.fileType);
  const typeMeta = TYPE_COLOR[typeKey];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(26,21,18,0.5)", padding: "20px" }} onClick={onCancel}>
      <div style={{ backgroundColor: C.card, borderRadius: 28, width: "100%", maxWidth: 480, padding: "28px 28px 32px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={26} height={26} fill="none" viewBox="0 0 24 24" stroke={C.red} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <button onClick={onCancel} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.mutedBg, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.primary, marginBottom: 10 }}>Eliminar archivo</div>
        <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 400, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>
          Esta acción eliminará el archivo de forma permanente y{" "}
          <strong style={{ fontFamily: SANS, fontWeight: 700, color: C.primary }}>no se puede deshacer.</strong>
          <br /><br />
          Los datos médicos extraídos de este documento{" "}
          <strong style={{ fontFamily: SANS, fontWeight: 700, color: C.primary }}>no serán eliminados</strong>{" "}
          de tu perfil.
        </div>

        {/* File preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: C.mutedBg, borderRadius: 12, padding: "10px 14px", marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: typeMeta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: typeMeta.fg }}>
            <FileTypeIcon type={typeKey} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: C.muted }}>{typeMeta.label} · {safeDate(doc.uploadedAt)}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} disabled={deleting} style={{ flex: 1, fontFamily: SANS, fontSize: 15, fontWeight: 700, color: C.muted, padding: "14px 0", borderRadius: 16, backgroundColor: C.mutedBg, border: "none", cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, fontFamily: SANS, fontSize: 15, fontWeight: 700, color: "#fff", padding: "14px 0", borderRadius: 16, backgroundColor: C.red, border: "none", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ArchivosPage() {
  const [userId, setUserId] = useState<string>("");
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewPayload, setReviewPayload] = useState<{
    structuredData: any;
    normalizedMedications: Record<string, string>;
    publicId: string;
    resourceType: string;
  } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback((uid: string) => {
    setLoading(true);
    fetch(`/api/medical-history?userId=${uid}`)
      .then((r) => r.json())
      .then((data) => {
        const all: DocumentItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.documents)
          ? data.documents
          : [];
        // Filter out IDs the client knows were deleted this session.
        // Cloudinary's search index can lag a minute or two after deletion,
        // so a freshly-deleted file may briefly reappear on re-fetch.
        const ghostIds = new Set<string>(
          JSON.parse(sessionStorage.getItem("deletedDocIds") ?? "[]")
        );
        setDocs(all.filter((d) => !ghostIds.has(d.publicId)));
      })
      .catch(() => setError("No se pudieron cargar los documentos."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setUserId(data.id);
          fetchDocs(data.id);
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => { window.location.href = "/login"; });
  }, [fetchDocs]);

  async function upload(file: File) {
    if (!userId) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    try {
      const res = await fetch("/api/medical-history/uploadDocuments", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error ?? "Error al subir el archivo");
      }
      const data = await res.json();
      fetchDocs(userId);
      if (data?.structuredData && hasAnyData(data.structuredData)) {
        // publicId lives in the last document of the updatedRecord spread
        const lastDoc = Array.isArray(data.documents) ? data.documents[data.documents.length - 1] : null;
        setReviewPayload({
          structuredData: data.structuredData,
          normalizedMedications: data.normalizedMedications ?? {},
          publicId: lastDoc?.publicId ?? "",
          resourceType: lastDoc?.resourceType ?? "raw",
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al procesar el archivo");
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const doc = deleteTarget;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/medical-history?publicId=${encodeURIComponent(doc.publicId)}&userId=${encodeURIComponent(userId)}&resourceType=${encodeURIComponent(doc.resourceType || 'raw')}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Persist the deleted ID so that re-fetches within this session
      // don't show the file while Cloudinary's search index catches up.
      const ghosts: string[] = JSON.parse(sessionStorage.getItem("deletedDocIds") ?? "[]");
      ghosts.push(doc.publicId);
      sessionStorage.setItem("deletedDocIds", JSON.stringify(ghosts));
      setDocs((prev) => prev.filter((d) => d.publicId !== doc.publicId));
      setDeleteTarget(null);
    } catch {
      setError("No se pudo eliminar el archivo. Inténtalo de nuevo.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setPendingFile(file);
  }

  const lastUploaded = docs.reduce<string | null>((acc, d) => {
    if (!acc) return d.uploadedAt ?? null;
    return new Date(d.uploadedAt) > new Date(acc) ? d.uploadedAt : acc;
  }, null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg, color: C.primary }}>
      <FloatingSidebar />

      <main className="pl-20 px-5 pt-8 pb-16 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8 pl-0 lg:pl-2">
          <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: C.primary, margin: 0 }}>
            Mis archivos
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 400, color: C.muted, marginTop: 4, marginBottom: 0 }}>
            Documentos y reportes médicos digitalizados
          </p>
        </div>

        {/* Stats */}
        {docs.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8">
            <div style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 20px" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#FDF2B2", color: "#5C4D04", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /><path d="M2 10h20" />
                </svg>
              </span>
              <div>
                <p style={{ fontFamily: SANS, fontSize: 11, color: C.muted, margin: 0 }}>Total</p>
                <p style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.primary, margin: 0 }}>{docs.length}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 20px" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#E3F2FD", color: "#0D47A1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </span>
              <div>
                <p style={{ fontFamily: SANS, fontSize: 11, color: C.muted, margin: 0 }}>Último subido</p>
                <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.primary, margin: 0 }}>{safeDate(lastUploaded)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Upload zone */}
          <div className="xl:col-span-1 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{
                borderRadius: 28,
                border: `2px dashed ${dragOver ? "#FAD957" : C.border}`,
                backgroundColor: dragOver ? "#FDF2B2" : C.card,
                padding: "32px 20px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                textAlign: "center", cursor: uploading ? "default" : "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                backgroundColor: dragOver ? "#FAD957" : C.mutedBg,
                color: dragOver ? "#482D00" : C.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                {uploading ? (
                  <svg style={{ width: 28, height: 28, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25} />
                    <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" opacity={0.75} />
                  </svg>
                ) : (
                  <svg style={{ width: 28, height: 28 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25v-10.5A2.25 2.25 0 0 0 17.25 4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                )}
              </div>
              <p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: C.primary, margin: "0 0 4px" }}>
                {uploading ? "Procesando documento…" : dragOver ? "Suelta aquí" : "Subir documento"}
              </p>
              <p style={{ fontFamily: SANS, fontSize: 12, fontWeight: 400, color: C.muted, margin: 0 }}>
                {uploading ? "Extrayendo y analizando con IA…" : "PDF, imagen, Word, JSON, TXT · máx 25 MB"}
              </p>
              <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.json,.txt,.csv" className="hidden" onChange={onFileChange} />
            </div>

            {error && (
              <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 16, padding: "12px 16px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <svg style={{ width: 16, height: 16, color: C.red, flexShrink: 0, marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: C.red }}>{error}</span>
              </div>
            )}

            <div style={{ backgroundColor: "#FDF2B2", border: "1px solid rgba(250,217,87,0.4)", borderRadius: 24, padding: "16px 20px" }}>
              <p style={{ fontFamily: DISPLAY, fontSize: 11, fontWeight: 700, color: "#5C4D04", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>IA activa</p>
              <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: "#5C4D04", lineHeight: 1.5, margin: 0 }}>
                Cada archivo es analizado por IA para extraer datos médicos. Podrás revisar y confirmar qué guardar antes de que se añadan a tu perfil.
              </p>
            </div>
          </div>

          {/* Document list */}
          <div className="xl:col-span-2">
            <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: C.muted, marginBottom: 16, paddingLeft: 4 }}>
              Documentos recientes
            </p>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ backgroundColor: C.card, borderRadius: 24, height: 96, border: `1px solid ${C.border}` }} className="animate-pulse" />
                ))}
              </div>
            ) : docs.length === 0 ? (
              <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 28, padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <span style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.mutedBg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: C.muted }}>
                  <svg style={{ width: 28, height: 28 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /><path d="M2 10h20" />
                  </svg>
                </span>
                <p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: C.primary, margin: "0 0 6px" }}>Sin documentos aún</p>
                <p style={{ fontFamily: SANS, fontSize: 13, color: C.muted, maxWidth: 260, margin: 0 }}>
                  Sube tu primer documento médico usando el panel de la izquierda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {docs.map((doc, idx) => {
                  const typeKey = getTypeKey(doc.fileType);
                  const typeMeta = TYPE_COLOR[typeKey];
                  const name = getFilename(doc);
                  return (
                    <div
                      key={doc.publicId || idx}
                      style={{
                        backgroundColor: C.card, borderRadius: 24,
                        border: `1px solid ${C.border}`,
                        padding: 16, display: "flex", gap: 14, alignItems: "flex-start",
                        overflow: "hidden",
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        backgroundColor: typeMeta.bg, color: typeMeta.fg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <FileTypeIcon type={typeKey} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: typeMeta.bg, color: typeMeta.fg, display: "inline-block", marginBottom: 4 }}>
                          {typeMeta.label}
                        </span>
                        <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.primary, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {name}
                        </p>
                        <p style={{ fontFamily: SANS, fontSize: 11, color: C.muted, margin: 0 }}>
                          {safeDate(doc.uploadedAt)}
                        </p>
                        {doc.extractedText && (
                          <p style={{ fontFamily: SANS, fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
                            {doc.extractedText.slice(0, 120)}
                          </p>
                        )}
                      </div>

                      {/* Actions: download + delete only (no eye button) */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                        <a
                          href={`/api/files/download?id=${btoa(doc.publicId)}`}
                          title="Descargar"
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.mutedBg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, textDecoration: "none" }}
                        >
                          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </a>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          title="Eliminar"
                          style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#FEF2F2", border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center", color: C.red, cursor: "pointer", padding: 0 }}
                        >
                          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {pendingFile && (
        <DisclaimerModal
          file={pendingFile}
          onConfirm={() => { upload(pendingFile); setPendingFile(null); }}
          onCancel={() => setPendingFile(null)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          doc={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {reviewPayload && (
        <MedicalReviewModal
          structuredData={reviewPayload.structuredData}
          normalizedMedications={reviewPayload.normalizedMedications}
          userId={userId}
          onClose={async () => {
            // Delete the Cloudinary file since the user discarded the review
            const { publicId, resourceType } = reviewPayload;
            setReviewPayload(null);
            if (publicId) {
              // Remove from local list and ghost list immediately so it doesn't reappear on refetch
              setDocs(prev => prev.filter(d => d.publicId !== publicId));
              const ghosts: string[] = JSON.parse(sessionStorage.getItem("deletedDocIds") ?? "[]");
              if (!ghosts.includes(publicId)) {
                ghosts.push(publicId);
                sessionStorage.setItem("deletedDocIds", JSON.stringify(ghosts));
              }
              try {
                await fetch(
                  `/api/medical-history?publicId=${encodeURIComponent(publicId)}&userId=${encodeURIComponent(userId)}&resourceType=${encodeURIComponent(resourceType || "raw")}`,
                  { method: "DELETE" }
                );
              } catch {}
            }
          }}
          onSaved={() => setReviewPayload(null)}
        />
      )}
    </div>
  );
}
