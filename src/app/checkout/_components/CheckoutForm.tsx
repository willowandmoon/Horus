"use client";

import { useMemo, useState } from "react";
import { COLOMBIA_DEPARTMENTS, COLOMBIA_CITIES_BY_DEPARTMENT } from "../_data/colombia";

export interface ShippingAddress {
    street: string;
    city: string;
    department: string;
    zip?: string;
}

interface CheckoutFormProps {
    productId: string;
    createOrder: (input: { productId: string; shippingAddress: ShippingAddress }) => Promise<{
        initPoint?: string;
        error?: string;
    }>;
}

export default function CheckoutForm({ productId, createOrder }: CheckoutFormProps) {
    const [form, setForm] = useState<ShippingAddress>({
        street: "",
        city: "",
        department: "",
        zip: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cityOptions = useMemo(() => {
        if (!form.department) return [];
        return COLOMBIA_CITIES_BY_DEPARTMENT[form.department] ?? [];
    }, [form.department]);

    const onChange = (field: keyof ShippingAddress, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const onDepartmentChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            department: value,
            city: prev.department === value ? prev.city : "",
        }));
    };

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const result = await createOrder({
            productId,
            shippingAddress: {
                street: form.street.trim(),
                city: form.city.trim(),
                department: form.department.trim(),
                zip: form.zip?.trim() || undefined,
            },
        });

        if (result?.initPoint) {
            window.location.href = result.initPoint;
            return;
        }

        setError(result?.error ?? "No se pudo iniciar el pago.");
        setLoading(false);
    };

    return (
        <form onSubmit={onSubmit} className="bg-white border border-[#EDF2F4] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2B2D42]">Direccion de envio</h3>
            <p className="text-sm text-[#8D99AE] mt-1">
                Confirma la direccion para enviar tu dispositivo Horus.
            </p>

            <div className="mt-6 grid gap-4">
                <label className="text-sm text-[#2B2D42] font-medium">
                    Direccion
                    <input
                        value={form.street}
                        onChange={(event) => onChange("street", event.target.value)}
                        required
                        className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#2B2D42] focus:outline-none focus:ring-2 focus:ring-[#EF233C]/40"
                        placeholder="Calle 123 #45-67"
                    />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-[#2B2D42] font-medium">
                        Departamento
                        <input
                            list="department-list"
                            value={form.department}
                            onChange={(event) => onDepartmentChange(event.target.value)}
                            required
                            className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#2B2D42] focus:outline-none focus:ring-2 focus:ring-[#EF233C]/40"
                            placeholder="Selecciona departamento"
                        />
                        <datalist id="department-list">
                            {COLOMBIA_DEPARTMENTS.map((department) => (
                                <option key={department} value={department} />
                            ))}
                        </datalist>
                    </label>
                    <label className="text-sm text-[#2B2D42] font-medium">
                        Ciudad
                        <input
                            list="city-list"
                            value={form.city}
                            onChange={(event) => onChange("city", event.target.value)}
                            required
                            className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#2B2D42] focus:outline-none focus:ring-2 focus:ring-[#EF233C]/40"
                            placeholder={form.department ? "Selecciona ciudad" : "Selecciona departamento"}
                            disabled={!form.department}
                        />
                        <datalist id="city-list">
                            {cityOptions.map((city) => (
                                <option key={city} value={city} />
                            ))}
                        </datalist>
                    </label>
                </div>
                <label className="text-sm text-[#2B2D42] font-medium">
                    Codigo postal (opcional)
                    <input
                        value={form.zip ?? ""}
                        onChange={(event) => onChange("zip", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#2B2D42] focus:outline-none focus:ring-2 focus:ring-[#EF233C]/40"
                        placeholder="110111"
                    />
                </label>
            </div>

            {error && (
                <div className="mt-4 text-sm text-[#EF233C] bg-[#FEE2E2] border border-[#FECACA] rounded-xl px-4 py-2">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-[#EF233C] text-white py-3 text-sm font-semibold hover:bg-[#D90429] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
            </button>
        </form>
    );
}
