import { NextRequest, NextResponse } from "next/server";
import { AuthRepositoryImpl } from "@/src/infrastructure/repositories/auth.repository.impl";
import { refreshTokenUseCase } from "@/src/application/auth/refresh-token.use-case";
import {
    clearAuthCookies,
    getAuthCookies,
    setAuthCookies,
} from "@/src/shared/lib/cookie.lib";
import { AppError } from "@/src/shared/errors/app.error";

const repository = new AuthRepositoryImpl();

function normalizeNextPath(rawNext: string | null | undefined): string {
    const fallback = "/dashboard";
    if (!rawNext) return fallback;

    // Prevent open-redirects: only allow same-site relative paths.
    if (!rawNext.startsWith("/")) return fallback;
    if (rawNext.startsWith("//")) return fallback;
    if (rawNext.includes("://")) return fallback;

    return rawNext;
}

// GET is used for browser navigation refresh (middleware redirects here).
export async function GET(request: NextRequest) {
    const nextPath = normalizeNextPath(request.nextUrl.searchParams.get("next"));

    try {
        const { refreshToken: currentRefreshToken } = await getAuthCookies();

        const { accessToken, refreshToken } = await refreshTokenUseCase(
            repository,
            currentRefreshToken
        );

        const response = NextResponse.redirect(new URL(nextPath, request.url));
        return setAuthCookies(response, accessToken, refreshToken);
    } catch {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", nextPath);

        const response = NextResponse.redirect(loginUrl);
        return clearAuthCookies(response);
    }
}

export async function POST() {
    try {

        const { refreshToken: currentRefreshToken } = await getAuthCookies();

        const { accessToken, refreshToken } = await refreshTokenUseCase(
            repository,
            currentRefreshToken
        );

        const response = NextResponse.json(
            { message: "Token renovado" },
            { status: 200 }
        );

        return setAuthCookies(response, accessToken, refreshToken);

    } catch (error) {
        if (error instanceof AppError) {
            const response = NextResponse.json(
                { message: error.message, code: error.code },
                { status: error.statusCode }
            );

            // If refresh is invalid/expired, clear cookies so clients don't keep stale tokens.
            if (error.statusCode === 401) {
                return clearAuthCookies(response);
            }

            return response;
        }

        console.error("[REFRESH_ERROR]", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}