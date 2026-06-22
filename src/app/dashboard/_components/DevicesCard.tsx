"use client";

const DEVICES = [
    {
        name: "Manilla Horus S1",
        detail: "Vinculada · Bluetooth",
        battery: 78,
        status: "Conectado",
        lastSeen: "Ahora mismo",
    },
];

function BatteryIcon({ pct }: { pct: number }) {
    const color = pct > 40 ? "#22C55E" : pct > 20 ? "#F59E0B" : "#EF4444";
    return (
        <div className="flex items-center gap-1.5">
            <div className="w-14 h-2 bg-[#F0EBE3] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color }}>{pct}%</span>
        </div>
    );
}

export default function DevicesCard() {
    return (
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E4E2DC]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#F0EBE3] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#1A1512]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
                    </svg>
                </div>
                <h2 className="text-xs font-extrabold text-[#1A1512] uppercase tracking-wide">Dispositivos Vinculados</h2>
            </div>

            {DEVICES.map((d, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                    {/* Device icon */}
                    <div className="w-11 h-11 rounded-2xl bg-[#1A1512] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-sm font-bold text-[#1A1512] truncate">{d.name}</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
                        </div>
                        <p className="text-[11px] text-[#8D99AE] mb-1.5">{d.detail} · {d.lastSeen}</p>
                        <BatteryIcon pct={d.battery} />
                    </div>
                </div>
            ))}

            {/* No-add notice */}
            <p className="text-[10px] text-[#8D99AE]/60 mt-3 pt-3 border-t border-[#E4E2DC]">
                La vinculación de nuevos dispositivos se realiza desde la app móvil.
            </p>
        </div>
    );
}
