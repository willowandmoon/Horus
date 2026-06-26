"use client";

import { useState, useEffect } from "react";
import FloatingSidebar from "@/src/components/FloatingSidebar";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import OrderHistoryModal from "./OrderHistoryModal";

const BraceletModel = dynamic(() => import("./BraceletModel"), { ssr: false });
const CardModel = dynamic(() => import("./CardModel"), { ssr: false });

const BRACELET_COLORS = [
  { name: "Negro Ónice",   hex: "#1C1917" },
  { name: "Gris Titanio",  hex: "#8D99AE" },
  { name: "Azul Profundo", hex: "#1A365D" },
  { name: "Rojo Carmesí",  hex: "#9B2C2C" },
  { name: "Blanco Perla",  hex: "#F8F7F4" },
];

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

const UPGRADE_PRICE = 30_000;

export default function TiendaClient({
  products,
  userData,
  orders = [],
  activeSubTypes = [],
  profileComplete = false,
}: {
  products: any[];
  userData: any;
  orders?: Order[];
  activeSubTypes?: string[];
  profileComplete?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"BRACELET" | "CARD">("BRACELET");
  const [showHistory, setShowHistory] = useState(false);

  const [braceletColor, setBraceletColor] = useState<string>("#1C1917");
  const [cardFrontPreview, setCardFrontPreview] = useState<string>("");  // raw upload
  const [cardFrontComposed, setCardFrontComposed] = useState<string>(""); // raw + info overlay
  const [cardBackPreview, setCardBackPreview]   = useState<string>("");
  const [cardFrontReady, setCardFrontReady]     = useState(false);
  const [cardBackReady, setCardBackReady]       = useState(false);

  const activeProduct = products.find((p) => p.productType === activeTab);

  // Build card front texture: bg image (optional) + info overlay bottom-right
  function buildCardFrontTexture(bgDataUrl: string | null): Promise<string> {
    // Wait for DM Sans / Space Grotesk to be ready in the browser
    return (typeof document !== "undefined" ? document.fonts.ready : Promise.resolve()).then(() =>
      new Promise((resolve) => {
        const W = 1686, H = 1063;
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d")!;

        if (!ctx.roundRect) {
          (ctx as any).roundRect = function(x: number, y: number, w: number, h: number, r: number) {
            this.moveTo(x + r, y);
            this.lineTo(x + w - r, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r);
            this.lineTo(x + w, y + h - r);
            this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            this.lineTo(x + r, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r);
            this.lineTo(x, y + r);
            this.quadraticCurveTo(x, y, x + r, y);
            this.closePath();
          };
        }

        const drawCover = (img: HTMLImageElement) => {
          const ia = img.width / img.height, ca = W / H;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (ia > ca) { sw = img.height * ca; sx = (img.width - sw) / 2; }
          else         { sh = img.width / ca;  sy = (img.height - sh) / 2; }
          return { sx, sy, sw, sh };
        };

        const draw = (bgImg: HTMLImageElement | null) => {
          // 1. Background
          if (bgImg) {
            const { sx, sy, sw, sh } = drawCover(bgImg);
            ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, W, H);
          } else {
            ctx.fillStyle = "#F2F1EC";
            ctx.fillRect(0, 0, W, H);
          }

          // 2. Info box — bottom-right, bigger, glassmorphism
          const boxW = 510, boxH = 162, boxX = W - boxW - 36, boxY = H - boxH - 36, bR = 16;

          // Blurred region (simulates backdrop-filter: blur)
          if (bgImg) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, bR);
            ctx.clip();
            ctx.filter = "blur(18px)";
            const { sx, sy, sw, sh } = drawCover(bgImg);
            // draw oversized to avoid blur edge artifact
            ctx.drawImage(bgImg, sx, sy, sw, sh, -20, -20, W + 40, H + 40);
            ctx.filter = "none";
            ctx.restore();
          }

          // Frosted glass tint — very subtle, adapts to image brightness
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxW, boxH, bR);
          ctx.clip();
          ctx.fillStyle = bgImg ? "rgba(255,255,255,0.14)" : "rgba(26,21,18,0.55)";
          ctx.fillRect(boxX, boxY, boxW, boxH);
          // Gold left accent bar
          ctx.fillStyle = "#FAD957";
          ctx.fillRect(boxX, boxY + 18, 3, boxH - 36);
          ctx.restore();

          // Thin border
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxW, boxH, bR);
          ctx.strokeStyle = "rgba(255,255,255,0.22)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();

          // Text — DM Sans
          const font = "'DM Sans', 'Space Grotesk', system-ui, sans-serif";
          const tx = boxX + 24, pad = 34;

          ctx.fillStyle = "#FFFFFF";
          ctx.font = `700 30px ${font}`;
          ctx.fillText((userData.name || "—").toUpperCase(), tx, boxY + pad);

          ctx.fillStyle = "rgba(255,255,255,0.65)";
          ctx.font = `400 17px ${font}`;
          ctx.fillText(`${userData.bloodType ?? "—"}  ·  ${userData.idNumber ?? "—"}`, tx, boxY + pad + 36);
          ctx.fillText(`${userData.emergencyName ?? "—"}  ${userData.emergencyContact ?? ""}`, tx, boxY + pad + 62);

          resolve(canvas.toDataURL("image/jpeg", 0.88));
        };

        if (bgDataUrl) {
          const img = new Image();
          img.onload = () => draw(img);
          img.onerror = () => draw(null);
          img.src = bgDataUrl;
        } else {
          draw(null);
        }
      })
    );
  }

  // On mount: generate default composed texture + restore session
  useEffect(() => {
    (async () => {
      try {
        const raw = sessionStorage.getItem("horus_customization");
        const parsed = raw ? JSON.parse(raw) : {};
        if (parsed.braceletColor) setBraceletColor(parsed.braceletColor);
        if (parsed.cardBackB64)   { setCardBackPreview(parsed.cardBackB64); setCardBackReady(true); }
        if (parsed.cardFrontB64) {
          setCardFrontPreview(parsed.cardFrontB64);
          const composed = await buildCardFrontTexture(parsed.cardFrontB64);
          setCardFrontComposed(composed);
          setCardFrontReady(true);
        } else {
          const composed = await buildCardFrontTexture(null);
          setCardFrontComposed(composed);
        }
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function storeImageInSession(file: File, side: "front" | "back") {
    const preview = URL.createObjectURL(file);
    if (side === "front") { setCardFrontPreview(preview); setCardFrontReady(false); }
    else                  { setCardBackPreview(preview);  setCardBackReady(false); }

    try {
      // Compress raw image
      const b64 = await compressToBase64(file);
      const existing = JSON.parse(sessionStorage.getItem("horus_customization") || "{}");
      const key = side === "front" ? "cardFrontB64" : "cardBackB64";
      sessionStorage.setItem("horus_customization", JSON.stringify({ ...existing, [key]: b64 }));

      if (side === "front") {
        setCardFrontPreview(b64);
        const composed = await buildCardFrontTexture(b64);
        setCardFrontComposed(composed);
        // Store composed version (with info) as what gets uploaded
        const withInfo = JSON.parse(sessionStorage.getItem("horus_customization") || "{}");
        sessionStorage.setItem("horus_customization", JSON.stringify({ ...withInfo, cardFrontB64: composed }));
        setCardFrontReady(true);
      } else {
        setCardBackPreview(b64);
        setCardBackReady(true);
      }
    } catch (err) {
      console.error("[Imagen]", err);
    }
  }

  function compressToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const maxW = 1200;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) storeImageInSession(e.target.files[0], "front");
  };
  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) storeImageInSession(e.target.files[0], "back");
  };

  const handleComprar = () => {
    if (!activeProduct) return;
    // Update color in session (images already there)
    try {
      const existing = JSON.parse(sessionStorage.getItem("horus_customization") || "{}");
      if (activeTab === "BRACELET") {
        sessionStorage.setItem("horus_customization", JSON.stringify({ braceletColor }));
      } else {
        // keep existing b64 keys, remove bracelet color
        const { braceletColor: _c, ...rest } = existing;
        sessionStorage.setItem("horus_customization", JSON.stringify(rest));
      }
    } catch {}
    router.push(`/checkout?productId=${activeProduct.id}`);
  };

  const paidOrders = orders.filter((o) => o.status === "PAID" || o.status === "DELIVERED" || o.status === "SHIPPED" || o.status === "PROCESSING");

  return (
    <div className="min-h-screen bg-[#F2F1EC] flex">
      <FloatingSidebar />
      <main className="pl-20 px-5 pt-8 pb-16 w-full max-w-[1400px] mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-[32px] font-bold text-[#1C1917] tracking-tight m-0">
              Tienda Horus
            </h1>
            <p className="font-sans text-sm text-[#8D99AE] mt-1">
              Personaliza tu dispositivo y continúa al checkout
            </p>
          </div>

          {/* Botón historial */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-[#E4E2DC] hover:border-[#1C1917] hover:shadow-sm transition-all text-sm font-semibold text-[#1C1917] shadow-sm relative"
          >
            <svg className="w-4 h-4 text-[#8D99AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            Mis compras
            {orders.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1C1917] text-white text-[10px] font-bold flex items-center justify-center">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Store layout */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* Left: 3D Viewer */}
          <div className="lg:w-2/3 bg-white rounded-[32px] shadow-sm border border-[#E4E2DC] overflow-hidden relative flex flex-col min-h-[500px]">
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

            <div className="flex-1 w-full relative bg-[#F8F7F4] cursor-grab active:cursor-grabbing">
              {activeTab === "BRACELET" ? (
                <BraceletModel color={braceletColor} userData={userData} />
              ) : (
                <CardModel frontUrl={cardFrontComposed} backUrl={cardBackPreview} />
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
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E4E2DC]">
              <h2 className="font-display text-xl font-bold text-[#1C1917] mb-6">Personalización</h2>

              {activeTab === "BRACELET" ? (
                <div>
                  <p className="text-sm font-bold text-[#1C1917] mb-3">Color de la correa</p>
                  <div className="flex flex-wrap gap-3">
                    {BRACELET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setBraceletColor(c.hex)}
                        title={c.name}
                        style={{ backgroundColor: c.hex }}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          braceletColor === c.hex ? "border-[#FAD957] scale-110 shadow-md" : "border-[#E4E2DC] hover:scale-105"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#8D99AE] mt-3">
                    {BRACELET_COLORS.find((c) => c.hex === braceletColor)?.name ?? braceletColor}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-bold text-[#1C1917] mb-3">Diseño Frontal</p>
                    <label className="flex items-center justify-center w-full h-12 rounded-xl border-2 border-dashed border-[#E4E2DC] bg-[#F8F7F4] text-[#8D99AE] hover:border-[#1C1917] hover:text-[#1C1917] transition-all cursor-pointer font-sans text-sm font-semibold relative overflow-hidden">
                      {cardFrontReady
                        ? <span className="text-green-600">✓ Frontal guardado</span>
                        : cardFrontPreview
                          ? <span className="text-[#8D99AE]">Procesando...</span>
                          : <span>Subir foto (Frontal)</span>}
                      {cardFrontReady && <img src={cardFrontPreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleFrontUpload} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1C1917] mb-3">Diseño Trasero</p>
                    <label className="flex items-center justify-center w-full h-12 rounded-xl border-2 border-dashed border-[#E4E2DC] bg-[#F8F7F4] text-[#8D99AE] hover:border-[#1C1917] hover:text-[#1C1917] transition-all cursor-pointer font-sans text-sm font-semibold relative overflow-hidden">
                      {cardBackReady
                        ? <span className="text-green-600">✓ Trasero guardado</span>
                        : cardBackPreview
                          ? <span className="text-[#8D99AE]">Procesando...</span>
                          : <span>Subir foto (Trasero)</span>}
                      {cardBackReady && <img src={cardBackPreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleBackUpload} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {activeProduct && (() => {
              const otherType       = activeProduct.productType === "BRACELET" ? "CARD" : "BRACELET";
              const hasCurrentType  = activeSubTypes.includes(activeProduct.productType);
              const isUpgrade       = activeSubTypes.includes(otherType) && !hasCurrentType;
              const alreadyHasBoth  = activeSubTypes.includes("BRACELET") && activeSubTypes.includes("CARD");
              const displayPrice    = isUpgrade ? UPGRADE_PRICE : Number(activeProduct.price);

              return (
                <div className="bg-[#1C1917] rounded-[24px] p-6 text-white shadow-xl mt-auto">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8D99AE] mb-1">
                    {activeProduct.productType === "BRACELET" ? "Manilla Inteligente" : "Tarjeta NFC"}
                  </p>
                  <h3 className="font-display text-2xl font-bold mb-2">{activeProduct.name}</h3>
                  <p className="text-sm text-[#AFAEA4] mb-6">
                    {activeProduct.description ?? "Dispositivo Horus con tecnología NFC integrada para acceso rápido a tu perfil."}
                  </p>

                  {!profileComplete && !alreadyHasBoth && (
                    <div className="flex items-start gap-2.5 bg-[#FAD957]/10 border border-[#FAD957]/30 rounded-xl px-4 py-3 mb-4">
                      <svg className="w-4 h-4 text-[#FAD957] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                      <p className="text-xs text-[#FAD957] leading-snug">
                        Completa tu perfil (cédula, tipo de sangre y contacto de emergencia) antes de comprar
                      </p>
                    </div>
                  )}

                  <div className="flex items-end justify-between pt-6 border-t border-[#393430]">
                    <div>
                      {isUpgrade && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs line-through text-[#8D99AE]">
                            ${Number(activeProduct.price).toLocaleString("es-CO")}
                          </span>
                          <span className="text-[10px] font-bold bg-[#FAD957] text-[#482D00] px-2 py-0.5 rounded-full">
                            Precio upgrade
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-[#8D99AE] mb-1">{isUpgrade ? "Precio especial" : "Precio total"}</p>
                      <p className="text-[28px] font-bold font-display leading-none">
                        ${displayPrice.toLocaleString("es-CO")}
                        <span className="text-sm font-medium text-[#8D99AE] ml-1">COP</span>
                      </p>
                    </div>
                    {alreadyHasBoth ? (
                      <button disabled className="px-6 py-3 rounded-xl bg-white/10 text-[#8D99AE] text-sm font-bold cursor-not-allowed border border-white/10">
                        Ya tienes ambos
                      </button>
                    ) : !profileComplete ? (
                      <a href="/perfil" className="px-5 py-3 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors border border-white/20 text-center">
                        Completar perfil
                      </a>
                    ) : (
                      <button onClick={handleComprar} className="px-6 py-3 rounded-xl bg-[#FAD957] text-[#482D00] text-sm font-bold hover:bg-[#FCE682] transition-colors shadow-lg">
                        Comprar
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {!activeProduct && (
              <div className="bg-white border border-[#E4E2DC] rounded-[24px] p-6 text-center text-sm text-[#8D99AE]">
                Producto no disponible en tienda en este momento.
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Modal historial */}
      {showHistory && (
        <OrderHistoryModal orders={orders} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
