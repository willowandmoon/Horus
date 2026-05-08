import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/src/shared/lib/cookie.lib";

export async function POST() {
    const response = NextResponse.json(
        { message: "Sesión cerrada correctamente" },
        { status: 200 }
    );

    return clearAuthCookies(response);
}