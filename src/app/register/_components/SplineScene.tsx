"use client";

import React, { useEffect } from "react";

export default function SplineScene() {
    useEffect(() => {
        if (!document.querySelector('script[data-spline]')) {
            const s = document.createElement("script");
            s.type = "module";
            s.src = "https://unpkg.com/@splinetool/viewer@1.12.92/build/spline-viewer.js";
            s.dataset.spline = "true";
            document.head.appendChild(s);
        }
    }, []);

    return React.createElement("spline-viewer", {
        url: "https://prod.spline.design/Li6ihQJLJiJkNiMx/scene.splinecode",
        style: { width: "100%", height: "100%", display: "block" },
    });
}
