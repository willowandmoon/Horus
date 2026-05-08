import {AuthRepository} from "@/src/domain/auth/auth.repository";
import {
    verifyRefreshToken,
    signAccessToken,
    signRefreshToken
} from "@/src/shared/lib/jwt.lib";
import {InvalidTokenError, UserNotFoundError} from "@/src/shared/errors/auth.errors";

export interface RefreshResult {
    accessToken:  string;
    refreshToken: string; // Nuevo refresh token rotado
}

export async function refreshTokenUseCase(
    repository: AuthRepository,
    currentRefreshToken: string | undefined
): Promise<RefreshResult> {

    if (!currentRefreshToken) throw new InvalidTokenError();

    let payload;
    try {
        payload = verifyRefreshToken(currentRefreshToken);
    } catch {
        throw new InvalidTokenError();
    }

    const user = await repository.findById(payload.sub);
    if (!user) throw new UserNotFoundError();

    const accessToken  = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken(user.id);

    return {
        accessToken,
        refreshToken,
    };
}