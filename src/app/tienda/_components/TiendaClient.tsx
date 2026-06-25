"use client";

import { useState } from "react";
import FloatingSidebar from "@/src/components/FloatingSidebar";
import Link from "next/link";
import dynamic from "next/dynamic";

const BraceletModel = dynamic(() => import("./BraceletModel"), { ssr: false });
const CardModel = dynamic(() => import("./CardModel"), { ssr: false });

export default function TiendaClient({ products, userData }: { products: any[], userData: any }) {
  const [activeTab, setActiveTab] = useState<"BRACELET" | "CARD">("BRACELET");

  // Customization state
  const [braceletColor, setBraceletColor] = useState<string>("#1C1917");
  const [cardFrontImg, setCardFrontImg] = useState<string>("");
  const [cardBackImg, setCardBackImg] = useState<string>("");

  const activeProduct = products.find(p => p.productType === activeTab);

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCardFrontImg(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCardBackImg(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F1EC] flex">
      <FloatingSidebar />
      <main className="pl-20 px-5 pt-8 pb-16 w-full max-w-[1400px] mx-auto flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-[32px] font-bold text-[#1C1917] tracking-tight m-0">
            Tienda Horus
          </h1>
          <p className="font-sans text-sm text-[#8D99AE] mt-1">
            Personaliza tu dispositivo y continúa al checkout
          </p>
        </div>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* Left: 3D Viewer */}
          <div className="lg:w-2/3 bg-white rounded-[32px] shadow-sm border border-[#E4E2DC] overflow-hidden relative flex flex-col min-h-[500px]">
            {/* Tabs */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-md p-1.5 rounded-full flex gap-1 shadow-sm border border-[#E4E2DC]">
              <button
                onClick={() => setActiveTab("BRACELET")}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === "BRACELET" ? "bg-[#1C1917] text-white shadow-md" : "text-[#8D99AE] hover:text-[#1C1917]"
                }`}
              >
                Manilla
              </button>
              <button
                onClick={() => setActiveTab("CARD")}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === "CARD" ? "bg-[#1C1917] text-white shadow-md" : "text-[#8D99AE] hover:text-[#1C1917]"
                }`}
              >
                Tarjeta
              </button>
            </div>

            {/* 3D Canvas Container */}
            <div className="flex-1 w-full relative bg-[#F8F7F4] cursor-grab active:cursor-grabbing">
              {activeTab === "BRACELET" ? (
                <BraceletModel color={braceletColor} userData={userData} />
              ) : (
                <CardModel frontUrl={cardFrontImg} backUrl={cardBackImg} />
              )}
              <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#E4E2DC] shadow-sm pointer-events-none">
                <svg className="w-4 h-4 text-[#8D99AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.671zM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
                </svg>
                <span className="text-[11px] font-bold text-[#8D99AE] uppercase tracking-wider">Arrastra para rotar</span>
              </div>
            </div>
          </div>

          {/* Right: Customization & Checkout */}
          <div className="lg:w-1/3 flex flex-col gap-6">
            {/* Customization Panel */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E4E2DC]">
              <h2 className="font-display text-xl font-bold text-[#1C1917] mb-6">
                Personalización
              </h2>

              {activeTab === "BRACELET" ? (
                <div>
                  <p className="text-sm font-bold text-[#1C1917] mb-3">Color de la correa</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { name: "Negro Ónice", hex: "#1C1917" },
                      { name: "Gris Titanio", hex: "#8D99AE" },
                      { name: "Azul Profundo", hex: "#1A365D" },
                      { name: "Rojo Carmesí", hex: "#9B2C2C" },
                      { name: "Blanco Perla", hex: "#F8F7F4" }
                    ].map(c => (
                      <button
                        key={c.hex}
                        onClick={() => setBraceletColor(c.hex)}
                        title={c.name}
                        style={{ backgroundColor: c.hex }}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${braceletColor === c.hex ? 'border-[#FAD957] scale-110 shadow-md' : 'border-[#E4E2DC] hover:scale-105'}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-bold text-[#1C1917] mb-3">Diseño Frontal</p>
                    <label className="flex items-center justify-center w-full h-12 rounded-xl border-2 border-dashed border-[#E4E2DC] bg-[#F8F7F4] text-[#8D99AE] hover:border-[#1C1917] hover:text-[#1C1917] transition-all cursor-pointer font-sans text-sm font-semibold">
                      <span>Subir foto (Frontal)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFrontUpload} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1C1917] mb-3">Diseño Trasero</p>
                    <label className="flex items-center justify-center w-full h-12 rounded-xl border-2 border-dashed border-[#E4E2DC] bg-[#F8F7F4] text-[#8D99AE] hover:border-[#1C1917] hover:text-[#1C1917] transition-all cursor-pointer font-sans text-sm font-semibold">
                      <span>Subir foto (Trasero)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleBackUpload} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout Card */}
            {activeProduct && (
              <div className="bg-[#1C1917] rounded-[24px] p-6 text-white shadow-xl mt-auto">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8D99AE] mb-1">
                  {activeProduct.productType === "BRACELET" ? "Manilla Inteligente" : "Tarjeta NFC"}
                </p>
                <h3 className="font-display text-2xl font-bold mb-2">{activeProduct.name}</h3>
                <p className="text-sm text-[#AFAEA4] mb-6">
                  {activeProduct.description ?? "Dispositivo Horus con tecnología NFC integrada para acceso rápido a tu perfil."}
                </p>
                
                <div className="flex items-end justify-between pt-6 border-t border-[#393430]">
                  <div>
                    <p className="text-xs text-[#8D99AE] mb-1">Precio total</p>
                    <p className="text-[28px] font-bold font-display leading-none">
                      ${Number(activeProduct.price).toLocaleString("es-CO")}
                      <span className="text-sm font-medium text-[#8D99AE] ml-1">COP</span>
                    </p>
                  </div>
                  <Link
                    href={`/checkout?productId=${activeProduct.id}`}
                    className="px-6 py-3 rounded-xl bg-[#FAD957] text-[#482D00] text-sm font-bold hover:bg-[#FCE682] transition-colors shadow-lg"
                  >
                    Comprar
                  </Link>
                </div>
              </div>
            )}
            
            {!activeProduct && (
               <div className="bg-white border border-[#E4E2DC] rounded-[24px] p-6 text-center text-sm text-[#8D99AE]">
                 Producto no disponible en tienda en este momento.
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
