"use client";
import { useEffect, useState, useRef } from "react";

interface GeoData { city: string; country: string; lat: number; lon: number; }

async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; country: string }> {
    try {
        const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { "Accept-Language": "es" } }
        );
        const data = await res.json();
        const city =
            data.address?.suburb ?? data.address?.neighbourhood ??
            data.address?.city   ?? data.address?.town ??
            data.address?.village ?? "Ubicación detectada";
        return { city, country: data.address?.country ?? "" };
    } catch {
        return { city: "Ubicación detectada", country: "" };
    }
}

function buildMapHtml(lat: number, lon: number): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#EBF4FF; overflow:hidden; }
  #map { width:100vw; height:100vh; }
  /* Blue tint over the tiles */
  .leaflet-tile-pane { filter: saturate(0.55) brightness(1.05) hue-rotate(195deg); }
  /* Pulse marker */
  .horus-dot { position:relative; width:24px; height:24px; }
  .horus-dot .ring {
    position:absolute; inset:-8px; border-radius:50%;
    background:rgba(59,130,246,0.25);
    animation: pulse-ring 2s ease-out infinite;
  }
  .horus-dot .ring2 {
    position:absolute; inset:-16px; border-radius:50%;
    background:rgba(59,130,246,0.1);
    animation: pulse-ring 2s ease-out infinite 0.6s;
  }
  .horus-dot .core {
    position:absolute; inset:4px; border-radius:50%;
    background:#3B82F6;
    border:3px solid white;
    box-shadow:0 2px 12px rgba(59,130,246,0.7);
  }
  @keyframes pulse-ring {
    0%   { transform:scale(0.5); opacity:0.8; }
    100% { transform:scale(2.2); opacity:0; }
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const map = L.map('map', {
  zoomControl: false,
  attributionControl: false,
  dragging: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  touchZoom: false,
  keyboard: false,
}).setView([${lat}, ${lon}], 15);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd', maxZoom: 20,
}).addTo(map);

const icon = L.divIcon({
  html: '<div class="horus-dot"><div class="ring2"></div><div class="ring"></div><div class="core"></div></div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
L.marker([${lat}, ${lon}], { icon }).addTo(map);
</script>
</body>
</html>`;
}

export default function LocationMap() {
    const [geo,    setGeo]    = useState<GeoData | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "denied">("idle");
    const blobUrlRef = useRef<string | null>(null);

    function requestGps() {
        if (!navigator.geolocation) { setStatus("denied"); return; }
        setStatus("loading");
        navigator.geolocation.getCurrentPosition(
            async pos => {
                const { latitude: lat, longitude: lon } = pos.coords;
                const { city, country } = await reverseGeocode(lat, lon);
                // Revoke previous blob
                if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
                const html  = buildMapHtml(lat, lon);
                const blob  = new Blob([html], { type: "text/html" });
                blobUrlRef.current = URL.createObjectURL(blob);
                setGeo({ lat, lon, city, country });
                setStatus("ready");
            },
            err => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "idle"),
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
        );
    }

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.permissions.query({ name: "geolocation" as PermissionName })
            .then(r => { if (r.state === "granted") requestGps(); })
            .catch(() => requestGps());
        return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ minHeight: 280, background: "#EBF4FF" }}>

            {/* Leaflet iframe */}
            {status === "ready" && blobUrlRef.current && (
                <iframe
                    src={blobUrlRef.current}
                    title="Ubicación"
                    className="absolute inset-0 w-full h-full border-0"
                    sandbox="allow-scripts"
                />
            )}

            {/* Dot grid placeholder while no location */}
            {status !== "ready" && (
                <div className="absolute inset-0" style={{
                    background: "#EBF4FF",
                    backgroundImage: "radial-gradient(circle, #BFDBFE 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                }} />
            )}

            {/* Gradient scrim */}
            {status === "ready" && (
                <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(59,130,246,0.18), transparent)" }} />
            )}

            {/* Idle */}
            {status === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 text-center p-6">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: "#3B82F6" }}>
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                            <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
                        </svg>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#1E40AF" }}>Activa tu ubicación</p>
                    <p className="text-xs" style={{ color: "#60A5FA" }}>Necesitamos acceso al GPS para mostrarte en el mapa.</p>
                    <button onClick={requestGps}
                        className="px-5 py-2 rounded-xl text-white text-xs font-bold hover:opacity-80 transition-opacity"
                        style={{ background: "#3B82F6" }}>
                        Permitir GPS
                    </button>
                </div>
            )}

            {status === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
                    <p className="text-xs font-medium" style={{ color: "#60A5FA" }}>Obteniendo ubicación…</p>
                </div>
            )}

            {/* Location badge */}
            {status === "ready" && geo && (
                <div className="absolute bottom-3 left-3 z-10">
                    <a href={`https://www.google.com/maps?q=${geo.lat},${geo.lon}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 shadow-md hover:shadow-lg transition-shadow"
                        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: "#3B82F6" }}>
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold" style={{ color: "#1E40AF" }}>
                                {geo.city}{geo.country ? `, ${geo.country}` : ""}
                            </p>
                            <p className="text-[10px]" style={{ color: "#60A5FA" }}>Ver en Google Maps →</p>
                        </div>
                    </a>
                </div>
            )}

            {status === "denied" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 text-center p-6">
                    <p className="text-sm font-bold" style={{ color: "#1E40AF" }}>Ubicación bloqueada</p>
                    <p className="text-xs max-w-56" style={{ color: "#60A5FA" }}>
                        Ve a Configuración del sitio → Ubicación → Permitir, luego recarga.
                    </p>
                    <button onClick={() => setStatus("idle")} className="text-xs font-semibold mt-1 hover:opacity-70 transition-opacity" style={{ color: "#3B82F6" }}>
                        Reintentar
                    </button>
                </div>
            )}
        </div>
    );
}
