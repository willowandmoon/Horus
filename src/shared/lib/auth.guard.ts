import { verifyAccessToken } from "./jwt.lib";
import { getAuthCookies } from "./cookie.lib";
import { InvalidTokenError } from "../errors/auth.errors";
import type { JwtAccessPayload } from "../types/jwt.types";

export async function authGuard(): Promise<JwtAccessPayload> {
    const { accessToken } = await getAuthCookies();

    if (!accessToken) throw new InvalidTokenError();

    try {
        return verifyAccessToken(accessToken);
    } catch {
        throw new InvalidTokenError();
    }
}