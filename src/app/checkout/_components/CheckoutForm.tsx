"use client";

import { useEffect, useState } from "react";
import Spinner from "@/src/components/Spinner";

export interface ShippingAddress {
    fullName: string;
    phone: string;
    street: string;
    neighborhood?: string;
    city: string;
    department: string;
    zip?: string;
    instructions?: string;
}

export interface Customization {
    braceletColor?: string;
    cardFrontUrl?: string;
    cardBackUrl?: string;
    cardFrontB64?: string;
    cardBackB64?: string;
}

interface CheckoutFormProps {
    productId: string;
    userId: string;
    createOrder: (input: {
        productId: string;
        shippingAddress: ShippingAddress;
        customization?: Customization;
    }) => Promise<{ initPoint?: string; orderId?: string; error?: string }>;
}

interface ColombiaOption { id: number; name: string }

const INPUT =
    "w-full rounded-xl border border-[#E4E2DC] bg-[#FAFAF8] px-4 py-3 text-sm text-[#1A1512] placeholder:text-[#C4BDB7] focus:outline-none focus:border-[#1A1512] focus:ring-2 focus:ring-[#1A1512]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed";
const SELECT =
    "w-full rounded-xl border border-[#E4E2DC] bg-[#FAFAF8] px-4 py-3 text-sm text-[#1A1512] focus:outline-none focus:border-[#1A1512] focus:ring-2 focus:ring-[#1A1512]/10 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const LABEL = "block text-[10px] font-bold text-[#1A1512] uppercase tracking-[0.1em] mb-1.5";
const SECTION_TITLE = "text-[10px] font-bold text-[#8D99AE] uppercase tracking-[0.12em] mb-5 flex items-center gap-2";

export default function CheckoutForm({ productId, userId: _userId, createOrder }: CheckoutFormProps) {
    const [form, setForm] = useState<ShippingAddress>({
        fullName: "", phone: "+57 ", street: "", neighborhood: "",
        city: "", department: "", zip: "", instructions: "",
    });
    const [customization, setCustomization] = useState<Customization | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [uploadStep, setUploadStep] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Colombia geo data from API
    const [departments, setDepartments] = useState<ColombiaOption[]>([]);
    const [cities, setCities] = useState<ColombiaOption[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingCities, setLoadingCities] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem("horus_customization");
            if (raw) setCustomization(JSON.parse(raw));
        } catch {}
    }, []);

    useEffect(() => {
        fetch("/api/colombia/departments")
            .then(r => r.json())
            .then((d: ColombiaOption[]) => setDepartments(d))
            .catch(() => {})
            .finally(() => setLoadingDepts(false));
    }, []);

    const handleDepartmentChange = async (deptId: number, deptName: string) => {
        setSelectedDeptId(deptId);
        setForm(p => ({ ...p, department: deptName, city: "" }));
        setCities([]);
        setLoadingCities(true);
        try {
            const res = await fetch(`/api/colombia/cities?departmentId=${deptId}`);
            const data: ColombiaOption[] = await res.json();
            setCities(data);
        } catch {}
        setLoadingCities(false);
    };

    const set = (field: keyof ShippingAddress, value: string) =>
        setForm(p => ({ ...p, [field]: value }));

    async function uploadWithOrderId(b64: string, orderId: string, side: "front" | "back"): Promise<void> {
        try {
            const blob = await fetch(b64).then(r => r.blob());
            const file = new File([blob], `${side}.jpg`, { type: "image/jpeg" });
            const fd = new FormData();
            fd.append("file", file);
            fd.append("orderId", orderId);
            fd.append("side", side);
            await fetch("/api/customization/upload", { method: "POST", body: fd });
        } catch (err) {
            console.error("[Upload imagen orden]", err);
        }
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setUploadStep("Creando orden...");

        const cleanCustomization = customization
            ? { braceletColor: customization.braceletColor }
            : undefined;

        const result = await createOrder({
            productId,
            shippingAddress: {
                fullName:     form.fullName.trim(),
                phone:        form.phone.trim(),
                street:       form.street.trim(),
                neighborhood: form.neighborhood?.trim() || undefined,
                city:         form.city.trim(),
                department:   form.department.trim(),
                zip:          form.zip?.trim() || undefined,
                instructions: form.instructions?.trim() || undefined,
            },
            customization: cleanCustomization,
        });

        if (result?.error || !result?.initPoint) {
            setError(result?.error ?? "No se pudo iniciar el pago.");
            setLoading(false);
            setUploadStep(null);
            return;
        }

        const orderId = result.orderId;
        if (orderId) {
            if (customization?.cardFrontB64) {
                setUploadStep("Subiendo diseño frontal...");
                await uploadWithOrderId(customization.cardFrontB64, orderId, "front");
            }
            if (customization?.cardBackB64) {
                setUploadStep("Subiendo diseño trasero...");
                await uploadWithOrderId(customization.cardBackB64, orderId, "back");
            }
        }

        sessionStorage.removeItem("horus_customization");
        setUploadStep("Redirigiendo a Mercado Pago...");
        window.location.href = result.initPoint;
    };

    const hasImages = customization?.cardFrontB64 || customization?.cardBackB64;
    const hasColor  = customization?.braceletColor;

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">

            {/* Customization preview */}
            {(hasImages || hasColor) && (
                <div className="bg-white rounded-2xl border border-[#E4E2DC] p-5 shadow-sm">
                    <p className={SECTION_TITLE}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                        Personalización
                    </p>
                    {hasColor && (
                        <div className="flex items-center gap-2.5 mb-3">
                            <span className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: customization!.braceletColor }} />
                            <span className="text-sm font-semibold text-[#1A1512]">Color: {customization!.braceletColor}</span>
                        </div>
                    )}
                    {hasImages && (
                        <div className="flex items-center gap-3 flex-wrap">
                            {customization?.cardFrontB64 && (
                                <div className="relative">
                                    <img src={customization.cardFrontB64} alt="Frontal" className="w-16 h-10 rounded-lg object-cover border border-[#E4E2DC]" />
                                    <span className="absolute -bottom-1 -right-1 text-[9px] bg-[#1A1512] text-white px-1.5 py-0.5 rounded-full font-bold">F</span>
                                </div>
                            )}
                            {customization?.cardBackB64 && (
                                <div className="relative">
                                    <img src={customization.cardBackB64} alt="Trasero" className="w-16 h-10 rounded-lg object-cover border border-[#E4E2DC]" />
                                    <span className="absolute -bottom-1 -right-1 text-[9px] bg-[#1A1512] text-white px-1.5 py-0.5 rounded-full font-bold">T</span>
                                </div>
                            )}
                            <p className="text-xs text-[#8D99AE]">Las imágenes se subirán al confirmar el pago</p>
                        </div>
                    )}
                </div>
            )}

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-[#E4E2DC] p-6 shadow-sm">
                <p className={SECTION_TITLE}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    Datos de contacto
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className={LABEL}>Nombre completo</label>
                        <input className={INPUT} placeholder="Juan Camilo García" required value={form.fullName}
                            onChange={e => set("fullName", e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={LABEL}>Teléfono / WhatsApp</label>
                        <input className={INPUT} placeholder="+57 300 123 4567" type="tel" required value={form.phone}
                            onChange={e => {
                                const val = e.target.value;
                                if (!val.startsWith("+57")) set("phone", "+57 ");
                                else set("phone", val);
                            }} /></div>
                </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl border border-[#E4E2DC] p-6 shadow-sm">
                <p className={SECTION_TITLE}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    Dirección de entrega
                </p>
                <div className="grid gap-4">
                    <div>
                        <label className={LABEL}>Dirección</label>
                        <input className={INPUT} placeholder="Calle 123 # 45–67" required value={form.street}
                            onChange={e => set("street", e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL}>Barrio / Urbanización <span className="normal-case font-normal text-[#C4BDB7]">(opcional)</span></label>
                        <input className={INPUT} placeholder="El Poblado" value={form.neighborhood ?? ""}
                            onChange={e => set("neighborhood", e.target.value)} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={LABEL}>Departamento</label>
                            <div className="relative">
                                <select
                                    className={SELECT}
                                    required
                                    value={selectedDeptId ?? ""}
                                    disabled={loadingDepts}
                                    onChange={e => {
                                        const id = Number(e.target.value);
                                        const name = departments.find(d => d.id === id)?.name ?? "";
                                        handleDepartmentChange(id, name);
                                    }}
                                >
                                    <option value="">{loadingDepts ? "Cargando..." : "Selecciona"}</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <ChevronDown />
                            </div>
                        </div>
                        <div>
                            <label className={LABEL}>Ciudad / Municipio</label>
                            <div className="relative">
                                <select
                                    className={SELECT}
                                    required
                                    value={cities.find(c => c.name === form.city)?.id ?? ""}
                                    disabled={!selectedDeptId || loadingCities}
                                    onChange={e => {
                                        const name = cities.find(c => c.id === Number(e.target.value))?.name ?? "";
                                        set("city", name);
                                    }}
                                >
                                    <option value="">
                                        {loadingCities ? "Cargando..." : !selectedDeptId ? "Selecciona depto." : "Selecciona ciudad"}
                                    </option>
                                    {cities.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className={LABEL}>Código postal <span className="normal-case font-normal text-[#C4BDB7]">(opcional)</span></label>
                        <input className={INPUT} placeholder="050001" value={form.zip ?? ""}
                            onChange={e => set("zip", e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL}>Instrucciones de entrega <span className="normal-case font-normal text-[#C4BDB7]">(opcional)</span></label>
                        <textarea className={`${INPUT} resize-none`} rows={2}
                            placeholder="Apto 302, portería izquierda, tocar timbre..."
                            value={form.instructions ?? ""}
                            onChange={e => set("instructions", e.target.value)} />
                    </div>
                </div>
            </div>

            {error && (
                <div className="text-sm text-[#C0392B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-5 py-3 font-semibold">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl py-4 text-white font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xl hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1A1512 0%, #2D2319 100%)" }}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-3">
                        <Spinner size={18} />
                        {uploadStep ?? "Procesando..."}
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-3">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#FAD957" strokeWidth="1.5"/>
                            <path d="M8 12h8M14 9l3 3-3 3" stroke="#FAD957" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Pagar con Mercado Pago
                    </span>
                )}
            </button>
        </form>
    );
}

function ChevronDown() {
    return (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8D99AE]">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
        </span>
    );
}
