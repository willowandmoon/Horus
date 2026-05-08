import { NextResponse } from "next/server";
import { authGuard } from "@/src/shared/lib/auth.guard";
import { AppError } from "@/src/shared/errors/app.error";

// Backend-only example: protected endpoint that returns dashboard info.
// If the access token is expired/missing -> returns 401.
export async function GET() {
    try {
        const session = await authGuard();

        return NextResponse.json(
            {
                message: "Dashboard info",
                user: {
                    id: session.sub,
                    email: session.email,
                },
                serverTime: new Date().toISOString(),
            },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { message: error.message, code: error.code },
                { status: error.statusCode }
            );
        }

        console.error("[DASHBOARD_INFO_ERROR]", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

