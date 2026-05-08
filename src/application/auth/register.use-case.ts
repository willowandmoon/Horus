import bcrypt from 'bcryptjs';
import {AuthRepository} from "@/src/domain/auth/auth.repository";
import {RegisterInput} from "@/src/presentation/auth/dto/register.dto";
import {signAccessToken, signRefreshToken} from "@/src/shared/lib/jwt.lib";
import {EmailAlreadyExistsError} from "@/src/shared/errors/auth.errors";

const SALT_ROUNDS = 10;

export interface RegisterResult {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    accessToken: string;
    refreshToken: string;
}

export async function registerUseCase(
    repository: AuthRepository,
    input: RegisterInput
): Promise<RegisterResult> {

    const exists = await repository.emailExists(input.email);
    if (exists) throw new EmailAlreadyExistsError();

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await repository.create({
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
    });

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