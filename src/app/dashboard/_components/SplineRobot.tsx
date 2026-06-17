"use client";
import React, { useEffect } from "react";

export default function SplineRobot() {
    useEffect(() => {
        if (!document.querySelector('script[data-spline]')) {
            const s = document.createElement("script");
            s.type = "module";
            s.src = "https://unpkg.com/@splinetool/viewer@1.12.92/build/spline-viewer.js";
            s.dataset.spline = "true";
            document.head.appendChild(s);
        }

        const hideBadge = () => {
            document.querySelectorAll("spline-viewer").forEach((el) => {
                const root = (el as HTMLElement).shadowRoot;
                if (root && !root.querySelector("#no-badge")) {
                    const style = document.createElement("style");
                    style.id = "no-badge";
                    style.textContent = `[part="logo"],#logo,.logo,a[href*="spline"]{display:none!important}`;
                    root.appendChild(style);
                }
            });
        };
        hideBadge();
        const t1 = setTimeout(hideBadge, 800);
        const t2 = setTimeout(hideBadge, 2500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        // overflow:hidden aquí para que el canvas no salga del panel
        <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
            {React.createElement("spline-viewer", {
                url: "https://prod.spline.design/UCZ948cVeHGCd0YL/scene.splinecode",
                "events-target": "none",
                style: {
                    width: "100%",
                    height: "100%",
                    display: "block",
                    // El robot está al borde izquierdo del frame de Spline.
                    // scale(0.72) aleja la cámara, translateX(28%) compensa el offset
                    // para centrarlo dentro del panel.
                    transform: "translateX(-20%) scale(0.55) scaleX(-1)",
                    transformOrigin: "center center",
                },
            })}
        </div>
    );
}
