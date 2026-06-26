"use client";

import { useEffect } from "react";

const BRACELET_COLORS = [
  { name: "Negro Ónice",   hex: "#1C1917" },
  { name: "Gris Titanio",  hex: "#8D99AE" },
  { name: "Azul Profundo", hex: "#1A365D" },
  { name: "Rojo Carmesí",  hex: "#9B2C2C" },
  { name: "Blanco Perla",  hex: "#F8F7F4" },
];

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:         { label: "Pendiente",    bg: "#8D99AE1A", text: "#8D99AE" },
  PAYMENT_PENDING: { label: "En proceso",   bg: "#F59E0B1A", text: "#F59E0B" },
  PAID:            { label: "Pagado",       bg: "#22C55E1A", text: "#22C55E" },
  PROCESSING:      { label: "Procesando",   bg: "#3B82F61A", text: "#3B82F6" },
  SHIPPED:         { label: "Enviado",      bg: "#8B5CF61A", text: "#8B5CF6" },
  DELIVERED:       { label: "Entregado",    bg: "#22C55E1A", text: "#22C55E" },
  CANCELLED:       { label: "Cancelado",    bg: "#EF233C1A", text: "#EF233C" },
  REFUNDED:        { label: "Reembolsado",  bg: "#F59E0B1A", text: "#F59E0B" },
};

interface Order {
  id: string;
  reference: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  braceletColor: string | null;
  cardFrontUrl: string | null;
  cardBackUrl: string | null;
  product: { name: string; productType: string } | null;
  payment: { status: string; paidAt: string | null } | null;
  subscription: { status: string; endDate: string | null } | null;
}

interface Props {
  orders: Order[];
  onClose: () => void;
}

export default function OrderHistoryModal({ orders, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[#F0EFE9]">
          <div>
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Historial de compras</h2>
            <p className="text-xs text-[#8D99AE] mt-0.5">
              {orders.length === 0 ? "Sin compras aún" : `${orders.length} orden${orders.length > 1 ? "es" : ""}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F2F1EC] hover:bg-[#E4E2DC] flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-[#1C1917]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-3">
          {orders.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F2F1EC] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#8D99AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#1C1917]">Aún no has comprado</p>
              <p className="text-xs text-[#8D99AE]">Cuando realices tu primera compra aparecerá aquí.</p>
            </div>
          ) : (
            orders.map((order) => {
              const meta     = STATUS[order.status] ?? { label: order.status, bg: "#8D99AE1A", text: "#8D99AE" };
              const isCard   = order.product?.productType === "CARD";
              const colorName = BRACELET_COLORS.find((c) => c.hex === order.braceletColor)?.name;

              return (
                <div
                  key={order.id}
                  className="bg-[#F8F7F4] rounded-[18px] p-5 flex flex-col sm:flex-row sm:items-start gap-4"
                >
                  {/* Ícono */}
                  <div className="w-11 h-11 rounded-xl bg-white border border-[#E4E2DC] flex items-center justify-center flex-shrink-0 shadow-sm">
                    {isCard ? (
                      <svg className="w-5 h-5 text-[#8D99AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                      </svg>
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: order.braceletColor ?? "#1C1917" }}
                      />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    {/* Nombre + badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-[#1C1917]">{order.product?.name ?? "Horus"}</span>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: meta.text, backgroundColor: meta.bg }}
                      >
                        {meta.label}
                      </span>
                      {order.subscription?.status === "ACTIVE" && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-[#22C55E] bg-[#22C55E1A]">
                          Suscripción activa
                        </span>
                      )}
                    </div>

                    {/* Ref + fechas */}
                    <p className="text-[11px] text-[#8D99AE] font-mono truncate">{order.reference}</p>
                    <p className="text-[11px] text-[#8D99AE] mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
                      {order.subscription?.endDate && (
                        <> · <span className="text-[#1C1917] font-medium">Vigente hasta {new Date(order.subscription.endDate).toLocaleDateString("es-CO")}</span></>
                      )}
                    </p>

                    {/* Personalización */}
                    {!isCard && order.braceletColor && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-3 h-3 rounded-full border border-white shadow" style={{ backgroundColor: order.braceletColor }} />
                        <span className="text-[11px] text-[#8D99AE]">{colorName ?? order.braceletColor}</span>
                      </div>
                    )}
                    {isCard && (order.cardFrontUrl || order.cardBackUrl) && (
                      <div className="flex gap-2 mt-2">
                        {order.cardFrontUrl && (
                          <div className="relative">
                            <img src={order.cardFrontUrl} alt="Frontal" className="w-10 h-10 rounded-lg object-cover border border-[#E4E2DC]" />
                            <span className="absolute -bottom-1 -right-1 text-[9px] bg-[#1C1917] text-white px-1 rounded">F</span>
                          </div>
                        )}
                        {order.cardBackUrl && (
                          <div className="relative">
                            <img src={order.cardBackUrl} alt="Trasero" className="w-10 h-10 rounded-lg object-cover border border-[#E4E2DC]" />
                            <span className="absolute -bottom-1 -right-1 text-[9px] bg-[#1C1917] text-white px-1 rounded">T</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Precio */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-[#1C1917]">
                      ${order.totalAmount.toLocaleString("es-CO")}
                      <span className="text-xs font-medium text-[#8D99AE] ml-1">{order.currency}</span>
                    </p>
                    {order.payment?.paidAt && (
                      <p className="text-[11px] text-[#8D99AE] mt-0.5">
                        Pagado {new Date(order.payment.paidAt).toLocaleDateString("es-CO")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
