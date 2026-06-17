"use client";

import React, { useEffect, useRef, useState } from "react";

// ── Paths exactos del diseño original ────────────────────────────────────────
const PATHS = {
    blob:   "M48 6c18 0 38 9 42 28s-7 38-24 47-44 9-54-8S2 36 16 20 30 6 48 6Z",
    star:   "M50 4l11 26 28 3-21 19 6 28-24-14-24 14 6-28L11 33l28-3z",
    cross:  "M38 6h24v32h32v24H62v32H38V62H6V38h32z",
    heart:  "M50 86C18 64 8 44 8 28 8 14 18 6 30 6c8 0 16 5 20 13 4-8 12-13 20-13 12 0 22 8 22 22 0 16-10 36-42 58Z",
    flower: "M50 8c8-6 22-2 22 12 14-2 22 12 14 22 8 8 2 24-12 22-2 14-22 14-24 0-14 2-22-14-12-22-6-10 2-24 14-22 2-14 18-18 22-12Z",
    burst:  "M50 4l8 22 22-12-12 22 22 8-22 8 12 22-22-12-8 22-8-22-22 12 12-22-22-8 22-8-12-22 22 12z",
} as const;

const FILLS = {
    pink:   "#FAB2D3",
    yellow: "#FAD957",
    blue:   "#A5CCF4",
    green:  "#96C979",
} as const;

type ShapeKind = keyof typeof PATHS;
type ShapeColor = keyof typeof FILLS;

// ── Componente individual de shape ────────────────────────────────────────────
function EmotionShape({
    kind,
    color,
    size,
    rotate = 0,
}: {
    kind: ShapeKind;
    color: ShapeColor;
    size: number;
    rotate?: number;
}) {
    const [eyeRy, setEyeRy] = useState(8);
    const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
    const ref = useRef<SVGSVGElement>(null);

    // Parpadeo cada 4.5s
    useEffect(() => {
        const blink = () => {
            setEyeRy(0.5);
            setTimeout(() => setEyeRy(8), 120);
        };
        const id = setInterval(blink, 4500 + Math.random() * 2000);
        return () => clearInterval(id);
    }, []);

    // Ojos siguen el mouse
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.hypot(dx, dy);
            const maxDist = 4;
            const factor = dist > 0 ? Math.min(maxDist, dist / 30) : 0;
            setPupilOffset({ x: (dx / dist) * factor || 0, y: (dy / dist) * factor || 0 });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const fill = FILLS[color];
    const path = PATHS[kind];

    return (
        <svg
            ref={ref}
            viewBox="0 0 100 100"
            width={size}
            height={size}
            style={{ transform: `rotate(${rotate}deg)`, display: "block" }}
        >
            <path d={path} fill={fill} />
            {/* Ojos */}
            <g>
                <ellipse
                    cx={40 + pupilOffset.x}
                    cy={46 + pupilOffset.y}
                    rx={6}
                    ry={eyeRy}
                    fill="#1A1512"
                    style={{ transition: "ry 0.08s" }}
                />
                <ellipse
                    cx={60 + pupilOffset.x}
                    cy={46 + pupilOffset.y}
                    rx={6}
                    ry={eyeRy}
                    fill="#1A1512"
                    style={{ transition: "ry 0.08s" }}
                />
                {eyeRy > 1 && (
                    <>
                        <circle cx={42 + pupilOffset.x} cy={43 + pupilOffset.y} r={2} fill="#fff" />
                        <circle cx={62 + pupilOffset.x} cy={43 + pupilOffset.y} r={2} fill="#fff" />
                    </>
                )}
            </g>
        </svg>
    );
}

// ── Configuración de la escena: posiciones dispersas ─────────────────────────
const SCENE: Array<{
    kind: ShapeKind;
    color: ShapeColor;
    size: number;
    rotate: number;
    top: string;
    left: string;
    animation: string;
}> = [
    { kind: "blob",   color: "yellow", size: 160, rotate: 15,  top: "8%",  left: "52%",  animation: "animate-float-slow" },
    { kind: "star",   color: "pink",   size: 120, rotate: -10, top: "55%", left: "14%",  animation: "animate-float-medium" },
    { kind: "heart",  color: "pink",   size: 110, rotate: 6,   top: "12%", left: "20%",  animation: "animate-float-fast" },
    { kind: "blob",   color: "blue",   size: 130, rotate: -8,  top: "62%", left: "58%",  animation: "animate-float-medium" },
    { kind: "cross",  color: "green",  size: 100, rotate: 8,   top: "38%", left: "72%",  animation: "animate-float-slow" },
    { kind: "flower", color: "yellow", size: 95,  rotate: -20, top: "80%", left: "28%",  animation: "animate-float-fast" },
    { kind: "burst",  color: "green",  size: 85,  rotate: 30,  top: "30%", left: "36%",  animation: "animate-float-medium" },
    { kind: "blob",   color: "pink",   size: 75,  rotate: -5,  top: "72%", left: "76%",  animation: "animate-float-slow" },
];

// ── Panel de blobs para la columna derecha ────────────────────────────────────
export default function InteractiveBlobs() {
    return (
        <div className="w-full h-full relative overflow-hidden bg-[#F9F6ED] select-none">
            {SCENE.map((item, i) => (
                <div
                    key={i}
                    className={`absolute ${item.animation} drop-shadow-sm`}
                    style={{ top: item.top, left: item.left }}
                >
                    <EmotionShape
                        kind={item.kind}
                        color={item.color}
                        size={item.size}
                        rotate={item.rotate}
                    />
                </div>
            ))}
        </div>
    );
}

// ── Exports individuales para usarlos inline en las pages ─────────────────────
export function InlineShape({
    kind,
    color,
    size,
    rotate = 0,
    className = "",
}: {
    kind: ShapeKind;
    color: ShapeColor;
    size: number;
    rotate?: number;
    className?: string;
}) {
    return (
        <div className={`inline-flex pointer-events-none select-none ${className}`}>
            <EmotionShape kind={kind} color={color} size={size} rotate={rotate} />
        </div>
    );
}
