import bcrypt from "bcryptjs";
import {AuthRepository} from "@/src/domain/auth/auth.repository";
import {LoginInput} from "@/src/presentation/auth/dto/login.dto";
import {signRefreshToken, signAccessToken} from "@/src/shared/lib/jwt.lib";
import {InvalidCredentialsError} from "@/src/shared/errors/auth.errors";

export interface LoginResult {
    user: {
        id:        string;
        email:     string;
        firstName: string;
        lastName:  string;
    };
    accessToken:  string;
    refreshToken: string;
}

export async function loginUseCase(
    repository: AuthRepository,
    input: LoginInput
): Promise<LoginResult> {

    const user = await repository.findByEmail(input.email);

    if (!user) throw new InvalidCredentialsError();

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) throw new InvalidCredentialsError();

    const accessToken  = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken(user.id);

    return {
        user: {
            id:        user.id,
            email:     user.email,
            firstName: user.firstName,
            lastName:  user.lastName,
        },
        accessToken,
        refreshToken,
    };
}