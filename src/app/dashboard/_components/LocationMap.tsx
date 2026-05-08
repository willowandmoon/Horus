"use client";

import React, { useEffect, useState } from "react";

interface GeoData {
    city: string;
    country: string;
    lat: number;
    lon: number;
    precise: boolean;
}

type Status = "idle" | "loading" | "ready" | "denied" | "unavailable";

function IconLocation() {
    return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
        </svg>
    );
}

async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; country: string }> {
    try {
        const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { "Accept-Language": "es" } }
        );
        const data = await res.json();
        const city =
            data.address?.suburb        ??
            data.address?.neighbourhood ??
            data.address?.city          ??
            data.address?.town          ??
            data.address?.village       ??
            data.address?.municipality  ??
            "Ubicación detectada";
        return { city, country: data.address?.country ?? "" };
    } catch {
        return { city: "Ubicación detectada", country: "" };
    }
}

export default function LocationMap() {
    const [geo,    setGeo]    = useState<GeoData | null>(null);
    const [status, setStatus] = useState<Status>("idle");

    // Carga el script de spline-viewer
    useEffect(() => {
        if (!document.querySelector('script[data-spline-map]')) {
            const s = document.createElement("script");
            s.type = "module";
            s.src  = "https://unpkg.com/@splinetool/viewer@1.12.92/build/spline-viewer.js";
            s.dataset.splineMap = "true";
            document.head.appendChild(s);
        }

        // Oculta el badge de Spline
        const hideBadge = () => {
            document.querySelectorAll("spline-viewer").forEach((el) => {
                const root = (el as Element & { shadowRoot: ShadowRoot | null }).shadowRoot;
                if (root && !root.querySelector("#no-badge-map")) {
                    const style = document.createElement("style");
                    style.id = "no-badge-map";
                    style.textContent = `[part="logo"],#logo,.logo,a[href*="spline"]{display:none!important}`;
                    root.appendChild(style);
                }
            });
        };
        const t1 = setTimeout(hideBadge, 800);
        const t2 = setTimeout(hideBadge, 2500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    function requestGps() {
        setStatus("loading");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                const { city, country } = await reverseGeocode(lat, lon);
                setGeo({ lat, lon, city, country, precise: true });
                setStatus("ready");
            },
            (err) => {
                setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }

    useEffect(() => {
        if (!navigator.geolocation) {
            Promise.resolve().then(() => setStatus("unavailable"));
            return;
        }
        navigator.permissions.query({ name: "geolocation" }).then((result) => {
            if (result.state === "granted") requestGps();
        }).catch(() => requestGps());
    }, []);

    const mapsUrl    = geo ? `https://www.google.com/maps?q=${geo.lat},${geo.lon}` : "#";
    const displayLat = geo ? `${Math.abs(geo.lat).toFixed(5)}° ${geo.lat >= 0 ? "N" : "S"}` : "—";
    const displayLon = geo ? `${Math.abs(geo.lon).toFixed(5)}° ${geo.lon >= 0 ? "E" : "W"}` : "—";

    return (
        <div className="relative w-full h-96 rounded-xl overflow-hidden flex items-center justify-center">

            {/* ── Fondo: animación Spline ────────────────────────────────── */}
            <div className="absolute inset-0 z-0">
                {React.createElement("spline-viewer", {
                    url: "https://prod.spline.design/0ixXRYHzRjQMO6cT/scene.splinecode",
                    "events-target": "none",
                    style: {
                        width: "120%", height: "120%", display: "block",
                        transform: "translate(-8.33%, -8.33%) scale(1.15)",
                        transformOrigin: "center center",
                    },
                })}
            </div>

            {/* ── Blur suave encima del fondo ────────────────────────────── */}
            <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-[#0b0f1a]/30" />

            {/* ── Estado: solicitando permiso ────────────────────────────── */}
            {status === "idle" && (
                <div className="flex flex-col items-center gap-3 text-center px-6 z-20">
                    <div className="w-10 h-10 rounded-full bg-[#EF233C] flex items-center justify-center">
                        <IconLocation />
                    </div>
                    <p className="text-sm font-semibold text-white">Activa tu ubicación real</p>
                    <p className="text-xs text-white/60 max-w-55">
                        Necesitamos acceso al GPS de tu dispositivo para mostrar tu posición exacta.
                    </p>
                    <button
                        onClick={requestGps}
                        className="px-4 py-2 rounded-xl bg-[#EF233C] text-white text-xs font-semibold hover:bg-[#D90429] transition-colors"
                    >
                        Permitir ubicación GPS
                    </button>
                </div>
            )}

            {/* ── Estado: cargando ───────────────────────────────────────── */}
            {status === "loading" && (
                <div className="flex flex-col items-center gap-2 z-20">
                    <div className="w-8 h-8 rounded-full border-2 border-[#EF233C] border-t-transparent animate-spin"/>
                    <p className="text-xs text-white/70">Obteniendo ubicación GPS...</p>
                </div>
            )}

            {/* ── Estado: ubicación lista ────────────────────────────────── */}
            {status === "ready" && geo && (
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex flex-col items-center group cursor-pointer z-20"
                    title="Ver en Google Maps"
                >
                    <div className="absolute top-0 w-36 h-36 rounded-full border-2 border-[#EF233C]/40 bg-[#EF233C]/10 -translate-y-12 pointer-events-none"/>
                    <div className="w-10 h-10 rounded-full bg-[#EF233C] flex items-center justify-center shadow-lg z-10 group-hover:scale-110 transition-transform">
                        <IconLocation />
                    </div>
                    <div className="mt-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow text-center z-10 group-hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <p className="text-xs font-semibold text-[#2B2D42]">
                                {geo.city}{geo.country ? `, ${geo.country}` : ""}
                            </p>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${geo.precise ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                                {geo.precise ? "GPS" : "IP"}
                            </span>
                        </div>
                        <p className="text-[10px] text-[#8D99AE]">{displayLat}, {displayLon}</p>
                        <p className="text-[10px] text-[#EF233C] font-medium mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver en Google Maps →
                        </p>
                    </div>
                </a>
            )}

            {/* ── Estado: permiso denegado ───────────────────────────────── */}
            {status === "denied" && (
                <div className="flex flex-col items-center gap-2 text-center px-6 z-20">
                    <p className="text-sm font-semibold text-white">Permiso bloqueado</p>
                    <p className="text-xs text-white/60 max-w-60">
                        Tu navegador tiene la ubicación bloqueada. Ve a{" "}
                        <strong className="text-white">Configuración del sitio → Ubicación</strong> y cámbiala a <strong className="text-white">Permitir</strong>, luego recarga la página.
                    </p>
                    <button
                        onClick={() => setStatus("idle")}
                        className="px-3 py-1.5 rounded-lg border border-[#EF233C] text-[#EF233C] text-xs font-medium hover:bg-[#EF233C]/10 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* ── Estado: no disponible ──────────────────────────────────── */}
            {status === "unavailable" && (
                <div className="flex flex-col items-center gap-2 text-center px-6 z-20">
                    <p className="text-sm font-semibold text-white">GPS no disponible</p>
                    <p className="text-xs text-white/60">Tu dispositivo no soporta geolocalización.</p>
                </div>
            )}
        </div>
    );
}
