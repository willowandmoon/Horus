import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/src/presentation/auth/dto/login.dto";
import { validate } from "@/src/presentation/auth/validators/auth.validator";
import { AuthRepositoryImpl } from "@/src/infrastructure/repositories/auth.repository.impl";
import { loginUseCase } from "@/src/application/auth/login.use-case";
import { setAuthCookies } from "@/src/shared/lib/cookie.lib";
import { AppError } from "@/src/shared/errors/app.error";

const repository = new AuthRepositoryImpl();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = validate(loginSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { message: "Datos inválidos", errors: validation.errors },
                { status: 422 }
            );
        }

        const { user, accessToken, refreshToken } = await loginUseCase(
            repository,
            validation.data
        );

        const response = NextResponse.json(
            { message: "Inicio de sesión exitoso", user },
            { status: 200 }
        );

        return setAuthCookies(response, accessToken, refreshToken);

    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { message: error.message, code: error.code },
                { status: error.statusCode }
            );
        }

        console.error("[LOGIN_ERROR]", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}