"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

// Reemplaza <Link> entre login y register.
// Detecta la dirección de navegación y la escribe en el body para que
// globals.css aplique el deslizamiento correcto.
export default function AuthNavLink({
    href,
    children,
    className,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    const router = useRouter();
    const animating = useRef(false);

    function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
        e.preventDefault();
        if (animating.current) return;
        animating.current = true;

        // login → register: desliza a la izquierda; register → login: a la derecha
        const dir = href.includes("register") ? "left" : "right";
        document.body.setAttribute("data-auth-dir", dir);
        document.body.classList.add("auth-page-exit");

        setTimeout(() => {
            document.body.classList.remove("auth-page-exit");
            animating.current = false;
            router.push(href);
        }, 360);
    }

    return (
        <a href={href} onClick={handleClick} className={className}>
            {children}
        </a>
    );
}
