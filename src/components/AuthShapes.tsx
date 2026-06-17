"use client";

import { useEffect, useRef, useState } from "react";

// ── Paths SVG exactos del diseño con nuevas formas divertidas ──────────────────
const PATHS = {
    blob:   "M48 6c18 0 38 9 42 28s-7 38-24 47-44 9-54-8S2 36 16 20 30 6 48 6Z",
    star:   "M50 4l11 26 28 3-21 19 6 28-24-14-24 14 6-28L11 33l28-3z",
    cross:  "M38 6h24v32h32v24H62v32H38V62H6V38h32z",
    heart:  "M50 86C18 64 8 44 8 28 8 14 18 6 30 6c8 0 16 5 20 13 4-8 12-13 20-13 12 0 22 8 22 22 0 16-10 36-42 58Z",
    flower: "M50 8c8-6 22-2 22 12 14-2 22 12 14 22 8 8 2 24-12 22-2 14-22 14-24 0-14 2-22-14-12-22-6-10 2-24 14-22 2-14 18-18 22-12Z",
    burst:  "M50 4l8 22 22-12-12 22 22 8-22 8 12 22-22-12-8 22-8-22-22 12 12-22-22-8 22-8-12-22 22 12z",
    donut:  "M50 15a35 35 0 1 0 35 35 35 35 0 0 0-35-35Zm0 50a15 15 0 1 1 15-15 15 15 0 0 1-15 15Z",
    cloud:  "M25 60a15 15 0 0 1 10-26 20 20 0 0 1 37-5 15 15 0 0 1 18 16 15 15 0 0 1-15 15H25Z",
    moon:   "M30 15a35 35 0 0 0 45 45 35 35 0 1 1-45-45Z",
};

const FILLS = {
    pink:   "#FAB2D3",
    yellow: "#FAD957",
    blue:   "#A5CCF4",
    green:  "#96C979",
    purple: "#D4B5FF",
    orange: "#FFC3A0",
    teal:   "#8FE3DE",
};

type ShapeKind = keyof typeof PATHS;
type ShapeColor = keyof typeof FILLS;

// ── Un solo bichito con ojos animados ─────────────────────────────────────────
function Bichito({
    kind,
    color,
    size,
    rotate = 0,
    isFrozen = false,
}: {
    kind: ShapeKind;
    color: ShapeColor;
    size: number;
    rotate?: number;
    isFrozen?: boolean;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [blink, setBlink] = useState(false);
    const [pupil, setPupil] = useState({ x: 0, y: 0 });

    // Parpadeo automático (solo si no está congelado / durmiendo)
    useEffect(() => {
        if (isFrozen) return;
        const delay = 2000 + Math.random() * 3000;
        const timer = setTimeout(function tick() {
            setBlink(true);
            setTimeout(() => setBlink(false), 130);
            setTimeout(tick, 3500 + Math.random() * 3000);
        }, delay);
        return () => clearTimeout(timer);
    }, [isFrozen]);

    // Pupilas siguen mouse (solo si no está congelado / durmiendo)
    useEffect(() => {
        if (isFrozen) return;
        const onMove = (e: MouseEvent) => {
            const el = svgRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const d = Math.hypot(dx, dy) || 1;
            const max = 3.5;
            const f = Math.min(max, d / 28);
            setPupil({ x: (dx / d) * f, y: (dy / d) * f });
        };
        window.addEventListener("mousemove", onMove, { passive: true });
        return () => window.removeEventListener("mousemove", onMove);
    }, [isFrozen]);

    const isDonut = kind === "donut";
    const isMoon = kind === "moon";
    const eyeY = isDonut ? 30 : isMoon ? 60 : 46;
    const eyeXLeft = isDonut ? 43 : isMoon ? 26 : 40;
    const eyeXRight = isDonut ? 57 : isMoon ? 38 : 60;
    const eyeRadiusX = (isDonut || isMoon) ? 4.5 : 6;

    // Ojos cerrados si está congelado
    const ry = isFrozen ? 0.3 : blink ? 0.4 : (isDonut || isMoon) ? 5.5 : 7.5;

    const scaleFactor = (isDonut || isMoon) ? 0.7 : 1;

    return (
        <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            width={size}
            height={size}
            style={{ 
                transform: `rotate(${rotate}deg)`, 
                display: "block", 
                overflow: "visible",
                transition: "opacity 0.25s, filter 0.25s",
                opacity: isFrozen ? 0.75 : 1,
                filter: isFrozen ? "grayscale(10%) contrast(90%)" : "none",
            }}
        >
            {/* Sombra suave */}
            <filter id={`shadow-${kind}-${color}`}>
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#00000020" />
            </filter>
            <path
                d={PATHS[kind]}
                fill={FILLS[color]}
                filter={`url(#shadow-${kind}-${color})`}
            />

            {/* Ojo izquierdo */}
            <ellipse cx={eyeXLeft + pupil.x * scaleFactor} cy={eyeY + pupil.y * scaleFactor} rx={eyeRadiusX} ry={ry} fill="#1A1512" />
            {!blink && !isFrozen && <circle cx={eyeXLeft + 1.5 + pupil.x * scaleFactor} cy={eyeY - 1.5 + pupil.y * scaleFactor} r={isDonut || isMoon ? 1.2 : 2} fill="white" />}
            {/* Ojo derecho */}
            <ellipse cx={eyeXRight + pupil.x * scaleFactor} cy={eyeY + pupil.y * scaleFactor} rx={eyeRadiusX} ry={ry} fill="#1A1512" />
            {!blink && !isFrozen && <circle cx={eyeXRight + 1.5 + pupil.x * scaleFactor} cy={eyeY - 1.5 + pupil.y * scaleFactor} r={isDonut || isMoon ? 1.2 : 2} fill="white" />}
        </svg>
    );
}

// ── Lista de figuras y posiciones iniciales con nuevos bichitos y colores ─────
const SHAPES = [
    { kind: "blob" as const,   color: "yellow" as const, size: 160, rotate: 12,  top: "2%",   left: "35%"   },
    { kind: "heart" as const,  color: "pink" as const,   size: 110, rotate: -35, top: "6%",   left: "91%"   },
    { kind: "donut" as const,  color: "purple" as const, size: 130, rotate: 20,  top: "12%",  left: "62%"   },
    { kind: "blob" as const,   color: "blue" as const,   size: 150, rotate: -18, top: "20%",  left: "44%"   },
    { kind: "cloud" as const,  color: "teal" as const,   size: 115, rotate: 10,  top: "26%",  left: "83%"   },
    { kind: "flower" as const, color: "orange" as const, size: 105, rotate: -22, top: "33%",  left: "52%"   },
    { kind: "burst" as const,  color: "green" as const,  size: 80,  rotate: 35,  top: "39%",  left: "94%"   },
    { kind: "moon" as const,   color: "yellow" as const, size: 90,  rotate: -6,  top: "46%",  left: "70%"   },
    { kind: "donut" as const,  color: "pink" as const,   size: 125, rotate: 15,  top: "53%",  left: "38%"   },
    { kind: "heart" as const,  color: "orange" as const, size: 90,  rotate: -12, top: "59%",  left: "87%"   },
    { kind: "star" as const,   color: "blue" as const,   size: 110, rotate: 42,  top: "64%",  left: "59%"   },
    { kind: "cloud" as const,  color: "purple" as const, size: 125, rotate: 30,  top: "70%",  left: "93%"   },
    { kind: "cross" as const,  color: "teal" as const,   size: 85,  rotate: -15, top: "78%",  left: "47%"   },
    { kind: "blob" as const,   color: "orange" as const, size: 120, rotate: 25,  top: "84%",  left: "76%"   },
    { kind: "moon" as const,   color: "pink" as const,   size: 75,  rotate: -20, top: "91%",  left: "96%"   },
    { kind: "star" as const,   color: "green" as const,  size: 100, rotate: -25, top: "94%",  left: "62%"   },
    { kind: "blob" as const,   color: "pink" as const,   size: 110, rotate: 15,  top: "15%",  left: "8%"    },
    { kind: "heart" as const,  color: "yellow" as const, size: 90,  rotate: -8,  top: "75%",  left: "12%"   },
];

interface PhysicsShape {
    el: HTMLDivElement | null;
    x: number;
    y: number;
    pctX: number;
    pctY: number;
    vx: number;
    vy: number;
    radius: number;
    mass: number;
    rotate: number;
    angularVelocity: number;
    kind: ShapeKind;
    color: ShapeColor;
    size: number;
    isFrozen: boolean;
}

// ── Panel derecho completo con simulación física real de rebotes ──────────────
export default function AuthShapes() {
    const containerRef = useRef<HTMLDivElement>(null);
    const physicsShapes = useRef<PhysicsShape[]>([]);
    
    // Estado local para notificar a React de los congelamientos y actualizar ojos a sleepy
    const [freezeState, setFreezeState] = useState<Record<number, boolean>>({});

    // Información del arrastre táctil / mouse
    const dragInfo = useRef<{
        index: number | null;
        offsetX: number;
        offsetY: number;
        lastX: number;
        lastY: number;
        vx: number;
        vy: number;
    }>({ index: null, offsetX: 0, offsetY: 0, lastX: 0, lastY: 0, vx: 0, vy: 0 });

    const handlePointerDown = (index: number, clientX: number, clientY: number) => {
        const shape = physicsShapes.current[index];
        if (!shape) return;
        dragInfo.current = {
            index,
            offsetX: clientX - shape.x,
            offsetY: clientY - shape.y,
            lastX: clientX,
            lastY: clientY,
            vx: 0,
            vy: 0,
        };
        shape.vx = 0;
        shape.vy = 0;
    };

    const toggleFreeze = (index: number) => {
        const shape = physicsShapes.current[index];
        if (!shape) return;
        shape.isFrozen = !shape.isFrozen;
        shape.vx = 0;
        shape.vy = 0;
        shape.angularVelocity = 0;
        setFreezeState(prev => ({ ...prev, [index]: shape.isFrozen }));
    };

    // Inicializar estructuras de física síncronamente
    if (physicsShapes.current.length === 0) {
        physicsShapes.current = SHAPES.map(s => {
            const leftPct = parseFloat(s.left) / 100;
            const topPct = parseFloat(s.top) / 100;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.08 + Math.random() * 0.12; // Movimiento original inicial más lento
            return {
                el: null,
                x: 0,
                y: 0,
                pctX: leftPct,
                pctY: topPct,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: s.size / 2,
                mass: s.size,
                rotate: s.rotate,
                angularVelocity: (Math.random() - 0.5) * 0.04, // Rotación inicial más lenta
                kind: s.kind,
                color: s.color,
                size: s.size,
                isFrozen: false,
            };
        });
    }

    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return;

        const container = containerRef.current;
        let width = container.clientWidth || window.innerWidth;
        let height = container.clientHeight || window.innerHeight;

        // Convertir porcentajes a coordenadas físicas reales iniciales
        physicsShapes.current.forEach(shape => {
            if (shape.x === 0 && shape.y === 0) {
                shape.x = shape.pctX * width;
                shape.y = shape.pctY * height;
            }
        });

        // Manejar redimensionado de ventana
        const handleResize = () => {
            const newWidth = container.clientWidth || window.innerWidth;
            const newHeight = container.clientHeight || window.innerHeight;
            physicsShapes.current.forEach(shape => {
                shape.x = (shape.x / width) * newWidth;
                shape.y = (shape.y / height) * newHeight;
            });
            width = newWidth;
            height = newHeight;
        };
        window.addEventListener("resize", handleResize);

        // Controladores globales de movimiento del ratón / toque
        const handleMove = (clientX: number, clientY: number) => {
            const info = dragInfo.current;
            if (info.index === null) return;
            const shape = physicsShapes.current[info.index];
            if (!shape) return;

            shape.x = clientX - info.offsetX;
            shape.y = clientY - info.offsetY;

            info.vx = clientX - info.lastX;
            info.vy = clientY - info.lastY;
            info.lastX = clientX;
            info.lastY = clientY;
        };

        const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
            }
        };

        const handleUp = () => {
            const info = dragInfo.current;
            if (info.index === null) return;
            const shape = physicsShapes.current[info.index];
            if (shape) {
                // Lanzamiento inercial con velocidad de fricción
                const maxSpeed = 7; // Límite de velocidad más lento
                shape.vx = Math.max(-maxSpeed, Math.min(maxSpeed, info.vx * 0.7));
                shape.vy = Math.max(-maxSpeed, Math.min(maxSpeed, info.vy * 0.7));
                shape.angularVelocity = (Math.random() - 0.5) * 0.15;
            }
            info.index = null;
        };

        window.addEventListener("mousemove", onMouseMove, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        window.addEventListener("mouseup", handleUp);
        window.addEventListener("touchend", handleUp);

        let animId: number;

        const loop = () => {
            const shapes = physicsShapes.current;

            // 1. Mover formas, aplicar fricción (desaceleración suave) y rebotar en bordes
            for (let i = 0; i < shapes.length; i++) {
                const s = shapes[i];

                // Si está congelado, mantener inmóvil
                if (s.isFrozen) {
                    s.vx = 0;
                    s.vy = 0;
                    s.angularVelocity = 0;
                    continue;
                }

                // Si se está arrastrando
                if (i === dragInfo.current.index) {
                    s.x = Math.max(s.radius, Math.min(width - s.radius, s.x));
                    s.y = Math.max(s.radius, Math.min(height - s.radius, s.y));
                    s.rotate += s.angularVelocity;
                    continue;
                }

                // Aplicar fricción ambiental (desaceleración progresiva)
                s.vx *= 0.985;
                s.vy *= 0.985;
                s.angularVelocity *= 0.98;

                // Movimiento
                s.x += s.vx;
                s.y += s.vy;
                s.rotate += s.angularVelocity;

                // Drift ambiental muy sutil si se detiene por completo (para mantenerlo "vivo" flotando)
                const currentSpeed = Math.hypot(s.vx, s.vy);
                if (currentSpeed < 0.05) {
                    const angle = Math.random() * Math.PI * 2;
                    s.vx = Math.cos(angle) * 0.08;
                    s.vy = Math.sin(angle) * 0.08;
                }

                // Rebote en bordes horizontales
                if (s.x - s.radius < 0) {
                    s.x = s.radius;
                    s.vx = Math.abs(s.vx) * 0.85; // Rebote amortiguado
                } else if (s.x + s.radius > width) {
                    s.x = width - s.radius;
                    s.vx = -Math.abs(s.vx) * 0.85;
                }

                // Rebote en bordes verticales
                if (s.y - s.radius < 0) {
                    s.y = s.radius;
                    s.vy = Math.abs(s.vy) * 0.85;
                } else if (s.y + s.radius > height) {
                    s.y = height - s.radius;
                    s.vy = -Math.abs(s.vy) * 0.85;
                }
            }

            // 2. Colisión física de rebotes elásticos entre formas
            for (let i = 0; i < shapes.length; i++) {
                for (let j = i + 1; j < shapes.length; j++) {
                    const s1 = shapes[i];
                    const s2 = shapes[j];

                    const dx = s2.x - s1.x;
                    const dy = s2.y - s1.y;
                    const dist = Math.hypot(dx, dy);
                    const minDist = s1.radius + s2.radius;

                    if (dist < minDist) {
                        const overlap = minDist - dist;
                        const nx = dx / (dist || 1);
                        const ny = dy / (dist || 1);

                        const s1Dragged = i === dragInfo.current.index;
                        const s2Dragged = j === dragInfo.current.index;

                        // Si alguno de los dos está congelado, actúa como pared inmóvil
                        const s1Frozen = s1.isFrozen;
                        const s2Frozen = s2.isFrozen;

                        if (s1Dragged || s2Dragged || s1Frozen || s2Frozen) {
                            // Si se arrastra, empuja al otro con la inercia del ratón
                            if (s1Dragged && !s2Dragged) {
                                s2.x += nx * overlap;
                                s2.y += ny * overlap;
                                
                                const vx1 = dragInfo.current.vx;
                                const vy1 = dragInfo.current.vy;
                                const k = (vx1 - s2.vx) * nx + (vy1 - s2.vy) * ny;
                                if (k > 0) {
                                    s2.vx += k * nx * 1.0; // Rebote más suave
                                    s2.vy += k * ny * 1.0;
                                    s2.angularVelocity += (Math.random() - 0.5) * 0.05;
                                }
                            } else if (!s1Dragged && s2Dragged) {
                                s1.x -= nx * overlap;
                                s1.y -= ny * overlap;
                                
                                const vx2 = dragInfo.current.vx;
                                const vy2 = dragInfo.current.vy;
                                const k = (s1.vx - vx2) * nx + (s1.vy - vy2) * ny;
                                if (k > 0) {
                                    s1.vx -= k * nx * 1.0;
                                    s1.vy -= k * ny * 1.0;
                                    s1.angularVelocity += (Math.random() - 0.5) * 0.05;
                                }
                            }
                            // Si uno está congelado y el otro no
                            else if (s1Frozen && !s2Frozen) {
                                s2.x += nx * overlap;
                                s2.y += ny * overlap;
                                // Rebota contra el congelado inmóvil
                                const k = -s2.vx * nx - s2.vy * ny;
                                if (k > 0) {
                                    s2.vx += 2 * k * nx * 0.8;
                                    s2.vy += 2 * k * ny * 0.8;
                                }
                            } else if (!s1Frozen && s2Frozen) {
                                s1.x -= nx * overlap;
                                s1.y -= ny * overlap;
                                const k = s1.vx * nx + s1.vy * ny;
                                if (k > 0) {
                                    s1.vx -= 2 * k * nx * 0.8;
                                    s1.vy -= 2 * k * ny * 0.8;
                                }
                            }
                            continue;
                        }

                        // Colisión elástica amortiguada estándar
                        const totalMass = s1.mass + s2.mass;
                        const ratio1 = s2.mass / totalMass;
                        const ratio2 = s1.mass / totalMass;

                        s1.x -= nx * overlap * ratio1;
                        s1.y -= ny * overlap * ratio1;
                        s2.x += nx * overlap * ratio2;
                        s2.y += ny * overlap * ratio2;

                        const k = (s1.vx - s2.vx) * nx + (s1.vy - s2.vy) * ny;
                        if (k > 0) {
                            const impulse = (1.8 * k) / totalMass; // Coeficiente de restitución de 0.8 para choques más lentos

                            s1.vx -= impulse * s2.mass * nx;
                            s1.vy -= impulse * s2.mass * ny;
                            s2.vx += impulse * s1.mass * nx;
                            s2.vy += impulse * s1.mass * ny;

                            s1.angularVelocity += (Math.random() - 0.5) * 0.02;
                            s2.angularVelocity += (Math.random() - 0.5) * 0.02;
                        }
                    }
                }
            }

            // 3. Aplicar posiciones al DOM usando translate3d (GPU)
            for (let i = 0; i < shapes.length; i++) {
                const s = shapes[i];
                if (s.el) {
                    s.el.style.left = "0px";
                    s.el.style.top = "0px";
                    s.el.style.transform = `translate3d(${s.x - s.radius}px, ${s.y - s.radius}px, 0) rotate(${s.rotate}deg)`;
                }
            }

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("mouseup", handleUp);
            window.removeEventListener("touchend", handleUp);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                inset: 0,
                background: "#F2F1EC",
                overflow: "hidden",
            }}
        >
            {SHAPES.map((s, i) => {
                const isFrozen = freezeState[i] || false;
                return (
                    <div
                        key={i}
                        ref={el => {
                            if (physicsShapes.current[i]) {
                                physicsShapes.current[i].el = el;
                            }
                        }}
                        style={{
                            position: "absolute",
                            top: s.top,
                            left: s.left,
                            userSelect: "none",
                            willChange: "transform",
                            cursor: isFrozen ? "pointer" : "grab",
                            touchAction: "none",
                            zIndex: isFrozen ? 5 : 1,
                        }}
                        onMouseDown={e => {
                            e.preventDefault();
                            handlePointerDown(i, e.clientX, e.clientY);
                        }}
                        onTouchStart={e => {
                            const touch = e.touches[0];
                            handlePointerDown(i, touch.clientX, touch.clientY);
                        }}
                        onDoubleClick={() => toggleFreeze(i)}
                        title="Doble clic para congelar/dormir o descongelar"
                    >
                        <Bichito
                            kind={s.kind}
                            color={s.color}
                            size={s.size}
                            rotate={s.rotate}
                            isFrozen={isFrozen}
                        />
                    </div>
                );
            })}
        </div>
    );
}
