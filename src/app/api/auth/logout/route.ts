import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/src/shared/lib/cookie.lib";

export async function POST() {
    const response = NextResponse.json(
        { message: "Sesión cerrada correctamente" },
        { status: 200 }
    );
    return clearAuthCookies(response);
}

// GET: visitar /api/auth/logout en el navegador limpia la sesión y redirige a /login
export async function GET(req: Request) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    return clearAuthCookies(response);
}