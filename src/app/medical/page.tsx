"use client";

import { useEffect, useState } from "react";
import LogoutButton from "@/src/app/dashboard/_components/LogoutButton";
import FloatingSidebar from "@/src/components/FloatingSidebar";

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
    route: string;
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

interface MedicalProfileData {
    allergies: Allergy[];
    chronicConditions: ChronicCondition[];
    medications: Medication[];
    medicalHistory: MedicalHistoryItem[];
}

type MedicalProfilePayload =
    | {
          type: "condition";
          data: {
              conditionName: string;
              severity: string;
              status: string;
              notes: string | null;
          };
      }
    | {
          type: "allergy";
          data: {
              allergenName: string;
              allergyType: string;
              severity: string;
              reactionDescription: string | null;
          };
      }
    | {
          type: "medication";
          data: {
              customMedicationName: string;
              dosage: string | null;
              frequency: string | null;
              route: string;
              purpose: string | null;
              isCurrent: boolean;
          };
      }
    | {
          type: "history";
          data: {
              eventName: string;
              eventType: string;
              location: string | null;
              outcome: string | null;
          };
      };

export default function MedicalProfilePage() {
    const [data, setData] = useState<MedicalProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"general" | "allergies" | "medications" | "history">("general");

    // Form modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Form field states
    // Allergy
    const [allergenName, setAllergenName] = useState("");
    const [allergyType, setAllergyType] = useState("OTHER");
    const [allergySeverity, setAllergySeverity] = useState("MILD");
    const [reactionDescription, setReactionDescription] = useState("");

    // Condition
    const [conditionName, setConditionName] = useState("");
    const [conditionSeverity, setConditionSeverity] = useState("MILD");
    const [conditionStatus, setConditionStatus] = useState("ACTIVE");
    const [conditionNotes, setConditionNotes] = useState("");

    // Medication
    const [customMedicationName, setCustomMedicationName] = useState("");
    const [dosage, setDosage] = useState("");
    const [frequency, setFrequency] = useState("");
    const [route, setRoute] = useState("ORAL");
    const [purpose, setPurpose] = useState("");
    const [isCurrent, setIsCurrent] = useState(true);

    // History
    const [eventName, setEventName] = useState("");
    const [eventType, setEventType] = useState("OTHER");
    const [location, setLocation] = useState("");
    const [outcome, setOutcome] = useState("");

    const refreshData = () => {
        setLoading(true);
        fetch("/api/medical-profile")
            .then((r) => {
                if (!r.ok) {
                    window.location.href = "/login";
                    throw new Error("No autorizado");
                }
                return r.json();
            })
            .then((res: MedicalProfileData) => {
                setData(res);
            })
            .catch((err) => console.error("Error loading medical profile:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetch("/api/medical-profile")
            .then((r) => {
                if (!r.ok) {
                    window.location.href = "/login";
                    throw new Error("No autorizado");
                }
                return r.json();
            })
            .then((res: MedicalProfileData) => {
                setData(res);
            })
            .catch((err) => console.error("Error loading medical profile:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        let payload: MedicalProfilePayload;

        if (activeTab === "general") {
            payload = {
                type: "condition",
                data: {
                    conditionName,
                    severity: conditionSeverity,
                    status: conditionStatus,
                    notes: conditionNotes || null,
                },
            };
        } else if (activeTab === "allergies") {
            payload = {
                type: "allergy",
                data: {
                    allergenName,
                    allergyType,
                    severity: allergySeverity,
                    reactionDescription: reactionDescription || null,
                },
            };
        } else if (activeTab === "medications") {
            payload = {
                type: "medication",
                data: {
                    customMedicationName,
                    dosage: dosage || null,
                    frequency: frequency || null,
                    route,
                    purpose: purpose || null,
                    isCurrent,
                },
            };
        } else {
            payload = {
                type: "history",
                data: {
                    eventName,
                    eventType,
                    location: location || null,
                    outcome: outcome || null,
                },
            };
        }

        try {
            const res = await fetch("/api/medical-profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Error al guardar el registro");
            }

            // Reset fields
            if (activeTab === "general") {
                setConditionName("");
                setConditionSeverity("MILD");
                setConditionStatus("ACTIVE");
                setConditionNotes("");
            } else if (activeTab === "allergies") {
                setAllergenName("");
                setAllergyType("OTHER");
                setAllergySeverity("MILD");
                setReactionDescription("");
            } else if (activeTab === "medications") {
                setCustomMedicationName("");
                setDosage("");
                setFrequency("");
                setRoute("ORAL");
                setPurpose("");
                setIsCurrent(true);
            } else if (activeTab === "history") {
                setEventName("");
                setEventType("OTHER");
                setLocation("");
                setOutcome("");
            }

            setIsModalOpen(false);
            refreshData();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Ocurrió un error inesperado";
            setFormError(message);
        } finally {
            setSubmitting(false);
        }
    };

    function getSeverityStyles(severity: string) {
        const sev = severity.toUpperCase();
        if (sev === "LIFE_THREATENING" || sev === "CRITICAL" || sev === "SEVERE") {
            return "bg-[#E62B34] text-white";
        } else if (sev === "MODERATE") {
            return "bg-[#FDF2B2] text-[#5C4D04] border border-[#F5D76E]/30";
        } else {
            // MILD
            return "bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]/30";
        }
    }

    function getSeverityLabel(severity: string) {
        const sev = severity.toUpperCase();
        if (sev === "LIFE_THREATENING") return "Riesgo de Vida";
        if (sev === "SEVERE") return "Grave";
        if (sev === "MODERATE") return "Moderado";
        if (sev === "MILD") return "Leve";
        return severity;
    }

    function getRouteLabel(route: string) {
        const r = route.toUpperCase();
        if (r === "ORAL") return "Vía Oral";
        if (r === "INJECTION") return "Inyección";
        if (r === "TOPICAL") return "Tópico";
        if (r === "INHALATION") return "Inhalación";
        return route;
    }

    if (loading && !data) {
        return (
            <div className="min-h-screen flex flex-col lg:flex-row bg-[#F2F1EC] text-[#1C1917]">
                {/* ── Barra superior móvil ── */}
                <header className="lg:hidden flex items-center justify-between bg-white border-b border-[#E4E2DC] px-6 py-4 shrink-0">
                    <div className="flex items-center gap-2.5 ml-14">
                        <img src="/gato.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="text-[#1C1917] font-black tracking-widest text-sm uppercase">Horus</span>
                    </div>
                </header>
                <FloatingSidebar />
                <main className="flex-1 lg:pl-80 p-6 md:p-10 overflow-y-auto w-full max-w-[1400px] mx-auto space-y-4 animate-pulse">
                    <div className="h-10 w-48 bg-white rounded-xl" />
                    <div className="h-4 w-64 bg-white rounded-xl" />
                    <div className="bg-white rounded-[32px] h-32 shadow-sm border border-[#E4E2DC]" />
                    <div className="bg-white rounded-[24px] h-60 shadow-sm border border-[#E4E2DC]" />
                </main>
            </div>
        );
    }

    const { allergies = [], chronicConditions = [], medications = [], medicalHistory = [] } = data || {};

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#F2F1EC] text-[#1C1917]">
            {/* ── Barra superior móvil ── */}
            <header className="lg:hidden flex items-center justify-between bg-white border-b border-[#E4E2DC] px-6 py-4 shrink-0">
                <div className="flex items-center gap-2.5 ml-14">
                    <img src="/gato.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-[#1C1917] font-black tracking-widest text-sm uppercase">Horus</span>
                </div>
                <LogoutButton compact />
            </header>

            {/* ── Sidebar Flotante ── */}
            <FloatingSidebar />

            {/* ── Main content area ─────────────────────────────────────────── */}
            <main className="flex-1 lg:pl-80 p-6 md:p-10 overflow-y-auto w-full max-w-[1400px] mx-auto">
                {/* Encabezado del Perfil Médico */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-[#1C1917]">Perfil Médico</h1>
                        <p className="text-sm text-[#8D99AE] font-semibold mt-1">Información e historial de salud estructurado</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#FAD957] hover:bg-[#F3C63F] text-[#482D00] font-bold py-3 px-5 rounded-2xl transition-all duration-300 shadow-sm flex items-center gap-2 self-start sm:self-center border-none cursor-pointer text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Agregar {activeTab === "general" ? "Condición" : activeTab === "allergies" ? "Alergia" : activeTab === "medications" ? "Medicina" : "Historial"}</span>
                    </button>
                </div>

                {/* ── Tabs Navigation ──────────────────────────────────────────── */}
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-[#E4E2DC] shadow-sm mb-8 text-xs font-bold text-[#8D99AE] justify-around max-w-lg">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-300 cursor-pointer border-none text-center ${
                            activeTab === "general" ? "bg-[#1C1917] text-white shadow-sm" : "bg-transparent text-[#8D99AE] hover:text-[#1C1917]"
                        }`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab("allergies")}
                        className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-300 cursor-pointer border-none text-center ${
                            activeTab === "allergies" ? "bg-[#1C1917] text-white shadow-sm" : "bg-transparent text-[#8D99AE] hover:text-[#1C1917]"
                        }`}
                    >
                        Alergias
                    </button>
                    <button
                        onClick={() => setActiveTab("medications")}
                        className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-300 cursor-pointer border-none text-center ${
                            activeTab === "medications" ? "bg-[#1C1917] text-white shadow-sm" : "bg-transparent text-[#8D99AE] hover:text-[#1C1917]"
                        }`}
                    >
                        Medicina
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-300 cursor-pointer border-none text-center ${
                            activeTab === "history" ? "bg-[#1C1917] text-white shadow-sm" : "bg-transparent text-[#8D99AE] hover:text-[#1C1917]"
                        }`}
                    >
                        Historial
                    </button>
                </div>

                {/* Grid Responsivo para Web de Escritorio */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Columna Principal: Listado de Tarjetas */}
                    <div className="xl:col-span-2 space-y-4">
                        {/* ── TAB 1: General (Condiciones Crónicas) ────────────────────── */}
                        {activeTab === "general" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-[#1C1917] px-1">Condiciones Crónicas</h3>
                                {chronicConditions.length === 0 ? (
                                    <p className="text-sm text-[#8D99AE] font-semibold text-center py-12 bg-white rounded-[24px] border border-[#E4E2DC]">
                                        No se registran condiciones crónicas activas.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {chronicConditions.map((c) => (
                                            <div key={c.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E4E2DC] flex flex-col gap-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-base font-bold text-[#1C1917]">{c.conditionName}</h4>
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${getSeverityStyles(c.severity || "MILD")}`}>
                                                        {getSeverityLabel(c.severity || "MILD")}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#8D99AE] font-bold">Estado: <span className="text-[#1C1917]">{c.status}</span></p>
                                                {c.notes && <p className="text-sm text-[#1C1917] mt-1 italic font-medium">{c.notes}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 2: Alergias ──────────────────────────────────────────── */}
                        {activeTab === "allergies" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-[#1C1917] px-1">Alergias Registradas</h3>
                                {allergies.length === 0 ? (
                                    <p className="text-sm text-[#8D99AE] font-semibold text-center py-12 bg-white rounded-[24px] border border-[#E4E2DC]">
                                        No se registran alergias conocidas.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {allergies.map((a) => (
                                            <div key={a.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E4E2DC] flex flex-col gap-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-base font-bold text-[#E62B34]">{a.allergenName}</h4>
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${getSeverityStyles(a.severity)}`}>
                                                        {getSeverityLabel(a.severity)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#8D99AE] font-bold">Tipo: <span className="text-[#1C1917]">{a.allergyType}</span></p>
                                                {a.reactionDescription && (
                                                    <p className="text-sm text-[#1C1917] mt-1 font-medium bg-[#F2F1EC]/40 p-3 rounded-xl border border-[#E4E2DC]/50">
                                                        Reacción: {a.reactionDescription}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 3: Medicamentos ──────────────────────────────────────── */}
                        {activeTab === "medications" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-[#1C1917] px-1">Medicamentos Activos</h3>
                                {medications.length === 0 ? (
                                    <p className="text-sm text-[#8D99AE] font-semibold text-center py-12 bg-white rounded-[24px] border border-[#E4E2DC]">
                                        No se registran tratamientos médicos farmacológicos.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {medications.map((m) => (
                                            <div key={m.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E4E2DC] flex flex-col gap-3">
                                                <div className="flex justify-between items-center gap-2">
                                                    <h4 className="text-base font-bold text-[#1C1917]">{m.name}</h4>
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${m.isCurrent ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-gray-100 text-gray-500"}`}>
                                                        {m.isCurrent ? "Activo" : "Inactivo"}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-[#8D99AE] bg-[#F2F1EC]/40 p-3 rounded-xl border border-[#E4E2DC]/50">
                                                    <div>Dosis: <span className="text-[#1C1917] font-bold">{m.dosage || "—"}</span></div>
                                                    <div>Frecuencia: <span className="text-[#1C1917] font-bold">{m.frequency || "—"}</span></div>
                                                    <div className="col-span-2 mt-1">Vía: <span className="text-[#1C1917] font-bold">{getRouteLabel(m.route)}</span></div>
                                                </div>
                                                {m.purpose && (
                                                    <p className="text-xs text-[#8D99AE] font-bold border-t border-[#E4E2DC] pt-2">
                                                        Propósito: <span className="text-[#1C1917] font-normal">{m.purpose}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 4: Historial Clínico ──────────────────────────────────── */}
                        {activeTab === "history" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-[#1C1917] px-1">Historial de Eventos</h3>
                                {medicalHistory.length === 0 ? (
                                    <p className="text-sm text-[#8D99AE] font-semibold text-center py-12 bg-white rounded-[24px] border border-[#E4E2DC]">
                                        No hay registros de cirugías o internaciones anteriores.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {medicalHistory.map((h) => (
                                            <div key={h.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E4E2DC] flex flex-col gap-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-base font-bold text-[#1C1917]">{h.eventName}</h4>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E3F2FD] text-[#0D47A1] uppercase shrink-0">
                                                        {h.eventType}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-[#8D99AE] font-semibold space-y-1 bg-[#F2F1EC]/40 p-3 rounded-xl border border-[#E4E2DC]/50 mt-1">
                                                    {h.location && <p>Lugar: <span className="text-[#1C1917] font-bold">{h.location}</span></p>}
                                                    {h.outcome && <p>Resultado: <span className="text-[#1C1917] font-bold">{h.outcome}</span></p>}
                                                    <p>Fecha: <span className="text-[#1C1917] font-bold">{new Date(h.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span></p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Columna Lateral: Estado de Salud / Info General */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-[#E4E2DC]">
                            <h3 className="text-base font-extrabold text-[#1C1917] uppercase tracking-wide mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#96C979]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                </svg>
                                Resumen Médico
                            </h3>
                            <p className="text-xs text-[#8D99AE] font-semibold mb-4 leading-relaxed">
                                Este panel resume tu perfil médico estructurado para personal de emergencia y doctores.
                            </p>
                            <div className="space-y-3.5">
                                <div className="flex items-center justify-between text-sm border-b border-[#F2F1EC] pb-2">
                                    <span className="font-semibold text-[#8D99AE]">Alergias</span>
                                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${allergies.length > 0 ? "bg-[#FCE7F3] text-[#831843]" : "bg-[#F2F1EC] text-[#8D99AE]"}`}>{allergies.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm border-b border-[#F2F1EC] pb-2">
                                    <span className="font-semibold text-[#8D99AE]">Condiciones</span>
                                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${chronicConditions.length > 0 ? "bg-[#FDF2B2] text-[#5C4D04]" : "bg-[#F2F1EC] text-[#8D99AE]"}`}>{chronicConditions.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm border-b border-[#F2F1EC] pb-2">
                                    <span className="font-semibold text-[#8D99AE]">Medicamentos</span>
                                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${medications.length > 0 ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-[#F2F1EC] text-[#8D99AE]"}`}>{medications.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-[#8D99AE]">Eventos Clínicos</span>
                                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${medicalHistory.length > 0 ? "bg-[#E3F2FD] text-[#0D47A1]" : "bg-[#F2F1EC] text-[#8D99AE]"}`}>{medicalHistory.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Modal de Carga Manual ─────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-[#1C1917]/30 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => {
                            setIsModalOpen(false);
                            setFormError(null);
                        }}
                    />

                    {/* Modal Container */}
                    <div className="relative bg-white border border-[#E4E2DC] rounded-[32px] w-full max-w-lg shadow-2xl p-6 md:p-8 z-50 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#1C1917]">
                                {activeTab === "general" && "Agregar Condición Crónica"}
                                {activeTab === "allergies" && "Agregar Alergia"}
                                {activeTab === "medications" && "Agregar Medicamento"}
                                {activeTab === "history" && "Agregar Registro de Historial"}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setFormError(null);
                                }}
                                className="w-8 h-8 rounded-full bg-[#F2F1EC] text-[#1C1917] flex items-center justify-center hover:bg-[#E4E2DC] transition-colors outline-none border-none cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Error Message */}
                        {formError && (
                            <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-xs font-bold mb-4">
                                {formError}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {activeTab === "general" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Nombre de la Condición *</label>
                                        <input
                                            type="text"
                                            required
                                            value={conditionName}
                                            onChange={(e) => setConditionName(e.target.value)}
                                            placeholder="Ej. Hipertensión Arterial"
                                            className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Severidad</label>
                                            <select
                                                value={conditionSeverity}
                                                onChange={(e) => setConditionSeverity(e.target.value)}
                                                className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                            >
                                                <option value="MILD">Leve</option>
                                                <option value="MODERATE">Moderada</option>
                                                <option value="SEVERE">Grave</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Estado</label>
                                            <select
                                                value={conditionStatus}
                                                onChange={(e) => setConditionStatus(e.target.value)}
                                                className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                            >
                                                <option value="ACTIVE">Activo</option>
                                                <option value="MANAGED">Controlado</option>
                                                <option value="IN_REMISSION">En Remisión</option>
                                                <option value="RESOLVED">Resuelto</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Notas adicionales</label>
                                        <textarea
                                            value={conditionNotes}
                                            onChange={(e) => setConditionNotes(e.target.value)}
                                            placeholder="Detalles sobre el diagnóstico o manejo"
                                            className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50 h-24 resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === "allergies" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Alergeno / Sustancia *</label>
                                        <input
                                            type="text"
                                            required
                                            value={allergenName}
                                            onChange={(e) => setAllergenName(e.target.value)}
                                            placeholder="Ej. Penicilina, Nueces, Polen"
                                            className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Tipo de Alergia</label>
                                            <select
                                                value={allergyType}
                                                onChange={(e) => setAllergyType(e.target.value)}
                                                className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                            >
                                                <option value="MEDICATION">Medicamento</option>
                                                <option value="FOOD">Alimento</option>
                                                <option value="ENVIRONMENTAL">Ambiental</option>
                                                <option value="OTHER">Otro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Severidad</label>
                                            <select
                                                value={allergySeverity}
                                                onChange={(e) => setAllergySeverity(e.target.value)}
                                                className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                            >
                                                <option value="MILD">Leve</option>
                                                <option value="MODERATE">Moderada</option>
                                                <option value="SEVERE">Grave</option>
                                                <option value="LIFE_THREATENING">Riesgo de Vida</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Descripción de la Reacción</label>
                                        <textarea
                                            value={reactionDescription}
                                            onChange={(e) => setReactionDescription(e.target.value)}
                                            placeholder="Ej. Erupción cutánea, dificultad respiratoria..."
                                            className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50 h-24 resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === "medications" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Nombre del Medicamento *</label>
                                        <input
                                            type="text"
                                            required
                                            value={customMedicationName}
                                            onChange={(e) => setCustomMedicationName(e.target.value)}
                                            placeholder="Ej. Enalapril"
                                            className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Dosis</label>
                                            <input
                                                type="text"
                                                value={dosage}
                                                onChange={(e) => setDosage(e.target.value)}
                                                placeholder="Ej. 10 mg"
                                                className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Frecuencia</label>
                                            <input
                                                type="text"
                                                value={frequency}
                                                onChange={(e) => setFrequency(e.target.value)}
                                                placeholder="Ej. Cada 12 horas"
                                                className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Vía de Administración</label>
                                            <select
                                                value={route}
                                                onChange={(e) => setRoute(e.target.value)}
                                                className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                            >
                                                <option value="ORAL">Vía Oral</option>
                                                <option value="INJECTION">Inyección</option>
                                                <option value="TOPICAL">Tópico</option>
                                                <option value="INHALATION">Inhalación</option>
                                                <option value="OTHER">Otra</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Estado del Tratamiento</label>
                                            <select
                                                value={isCurrent ? "true" : "false"}
                                                onChange={(e) => setIsCurrent(e.target.value === "true")}
                                                className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                            >
                                                <option value="true">Activo</option>
                                                <option value="false">Inactivo</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Propósito / Indicación</label>
                                        <input
                                            type="text"
                                            value={purpose}
                                            onChange={(e) => setPurpose(e.target.value)}
                                            placeholder="Ej. Controlar la presión arterial"
                                            className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === "history" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Nombre del Evento *</label>
                                        <input
                                            type="text"
                                            required
                                            value={eventName}
                                            onChange={(e) => setEventName(e.target.value)}
                                            placeholder="Ej. Apendicectomía, Vacuna Covid-19"
                                            className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Tipo de Evento</label>
                                            <select
                                                value={eventType}
                                                onChange={(e) => setEventType(e.target.value)}
                                                className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                            >
                                                <option value="SURGERY">Cirugía</option>
                                                <option value="HOSPITALIZATION">Hospitalización</option>
                                                <option value="VACCINATION">Vacunación</option>
                                                <option value="INJURY">Lesión / Fractura</option>
                                                <option value="OTHER">Otro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Lugar / Clínica</label>
                                            <input
                                                type="text"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                placeholder="Ej. Clínica Valle del Lili"
                                                className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-1.5">Resultado / Evolución</label>
                                        <input
                                            type="text"
                                            value={outcome}
                                            onChange={(e) => setOutcome(e.target.value)}
                                            placeholder="Ej. Recuperación completa, Sin secuelas"
                                            className="w-full rounded-2xl border border-[#E4E2DC] bg-[#F2F1EC]/40 px-4 py-3 text-sm font-semibold text-[#1C1917] placeholder-[#8D99AE]/70 focus:outline-none focus:ring-2 focus:ring-[#FAD957]/50"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Submit buttons */}
                            <div className="flex gap-4 pt-4 border-t border-[#E4E2DC] mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setFormError(null);
                                    }}
                                    disabled={submitting}
                                    className="flex-1 bg-[#F2F1EC] hover:bg-[#E4E2DC] text-[#1C1917] font-bold py-3 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center cursor-pointer border-none"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-[#FAD957] hover:bg-[#F3C63F] text-[#482D00] font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                    ) : (
                                        "Guardar"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
