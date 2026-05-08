"use client";
import { useEffect, useState } from "react";

type WeatherState =
    | { status: "loading" }
    | { status: "error";   href: string }
    | { status: "ok"; temperature: number; weathercode: number; windspeed: number; city: string; href: string };

function describeWeather(code: number): { label: string; emoji: string } {
    if (code === 0)  return { label: "Despejado",            emoji: "☀️" };
    if (code <= 2)   return { label: "Mayormente despejado", emoji: "🌤️" };
    if (code <= 3)   return { label: "Nublado",              emoji: "☁️" };
    if (code <= 48)  return { label: "Neblina",              emoji: "🌫️" };
    if (code <= 55)  return { label: "Llovizna",             emoji: "🌦️" };
    if (code <= 67)  return { label: "Lluvia",               emoji: "🌧️" };
    if (code <= 77)  return { label: "Nieve",                emoji: "❄️" };
    if (code <= 82)  return { label: "Chubascos",            emoji: "🌧️" };
    return                  { label: "Tormenta",             emoji: "⛈️" };
}

export default function WeatherCard() {
    const [state, setState] = useState<WeatherState>({ status: "loading" });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState({ status: "error", href: "https://www.windy.com" });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async ({ coords: { latitude: lat, longitude: lon } }) => {
                const href = `https://www.windy.com/?${lat},${lon},10`;
                try {
                    const [wRes, gRes] = await Promise.all([
                        fetch(
                            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto`
                        ),
                        fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                            { headers: { "Accept-Language": "es" } }
                        ),
                    ]);
                    const w = await wRes.json();
                    const g = await gRes.json();
                    setState({
                        status:      "ok",
                        temperature: Math.round(w.current.temperature_2m),
                        weathercode: w.current.weathercode,
                        windspeed:   Math.round(w.current.windspeed_10m),
                        city:        g.address?.city ?? g.address?.town ?? g.address?.village ?? "Tu ubicación",
                        href,
                    });
                } catch {
                    setState({ status: "error", href });
                }
            },
            () => setState({ status: "error", href: "https://www.windy.com" })
        );
    }, []);

    const href = state.status !== "loading" ? state.href : undefined;
    const { label, emoji } = state.status === "ok" ? describeWeather(state.weathercode) : { label: "", emoji: "" };

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!href}
            className="bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-sm border border-transparent hover:bg-sky-50 hover:border-sky-200 hover:shadow-md transition-all duration-300 cursor-pointer h-full min-h-[160px] no-underline"
        >
            <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"/>
                </svg>
                <p className="text-xs text-[#8D99AE] font-medium uppercase tracking-wide">Pronóstico de Clima</p>
            </div>

            {state.status === "loading" && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-7 h-7 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
                </div>
            )}

            {state.status === "error" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                    <span className="text-4xl">🌍</span>
                    <p className="text-sm text-[#8D99AE]">Activa la ubicación para ver el clima</p>
                </div>
            )}

            {state.status === "ok" && (
                <>
                    <div className="flex items-center gap-4">
                        <span className="text-5xl leading-none">{emoji}</span>
                        <div>
                            <p className="text-3xl font-bold text-[#2B2D42]">{state.temperature}°C</p>
                            <p className="text-sm text-[#8D99AE]">{label}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-auto">
                        <span className="font-semibold text-[#2B2D42]">{state.city}</span>
                        <span className="flex items-center gap-1 text-sky-500 font-medium">
                            Ver en Windy
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
                        </span>
                    </div>
                </>
            )}
        </a>
    );
}
