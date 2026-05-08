import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "@/src/shared/lib/cookie.lib";

const PROTECTED_ROUTES = ["/dashboard", "/profile", "/emergency"];
const AUTH_ROUTES      = ["/login", "/register"];

// Verifica el access token sin usar jsonwebtoken (incompatible con Edge Runtime).
// La cookie es httpOnly y solo el servidor puede emitirla, por lo que
// comprobar estructura + expiración es suficiente para el routing del proxy.
function isAccessTokenValid(token: string): boolean {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return false;

        const raw     = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(raw));

        if (payload.type !== "access") return false;
        if (!payload.exp || Date.now() / 1000 > payload.exp) return false;

        return true;
    } catch {
        return false;
    }
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken  = request.cookies.get(COOKIE_NAMES.accessToken)?.value;

    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

    const isAuthenticated = !!accessToken && isAccessTokenValid(accessToken);

    // Ruta protegida sin sesión válida → intentar renovar el token
    if (isProtected && !isAuthenticated) {
        const next       = request.nextUrl.pathname + request.nextUrl.search;
        const refreshUrl = new URL("/api/auth/refresh", request.url);
        refreshUrl.searchParams.set("next", next);
        return NextResponse.redirect(refreshUrl);
    }

    // Ya autenticado → redirigir al dashboard para evitar mostrar login/register
    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
