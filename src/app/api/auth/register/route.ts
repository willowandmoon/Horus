import { NextRequest, NextResponse } from "next/server";
import { registerSchema} from "@/src/presentation/auth/dto/register.dto";
import { validate } from "@/src/presentation/auth/validators/auth.validator";
import { AuthRepositoryImpl } from "@/src/infrastructure/repositories/auth.repository.impl";
import { registerUseCase } from "@/src/application/auth/register.use-case";
import { setAuthCookies } from "@/src/shared/lib/cookie.lib";
import { AppError } from "@/src/shared/errors/app.error";

const repository = new AuthRepositoryImpl();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = validate(registerSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { message: "Datos inválidos", errors: validation.errors },
                { status: 422 }
            );
        }

        const { user, accessToken, refreshToken } = await registerUseCase(
            repository,
            validation.data
        );

        const response = NextResponse.json(
            {
                message: "Registro exitoso",
                user,
            },
            { status: 201 }
        );

        return setAuthCookies(response, accessToken, refreshToken);

    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { message: error.message, code: error.code },
                { status: error.statusCode }
            );
        }

        console.error("[REGISTER_ERROR]", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}