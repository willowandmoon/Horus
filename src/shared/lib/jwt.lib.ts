import jwt from "jsonwebtoken";
import type { JwtAccessPayload, JwtRefreshPayload } from "../types/jwt.types";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

const ALGORITHM: jwt.Algorithm = "HS256";

export function signAccessToken(payload: Omit<JwtAccessPayload, "type">): string {
    return jwt.sign(
        {...payload, type: "access" } satisfies JwtAccessPayload,
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRY, algorithm: ALGORITHM }
    );
}

export function signRefreshToken(userId: string): string {
    return jwt.sign(
        { sub: userId, type: "refresh" } satisfies JwtRefreshPayload,
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY, algorithm: ALGORITHM }
    );
}

export function verifyAccessToken(token: string): JwtAccessPayload {
    const payload = jwt.verify(token, ACCESS_SECRET, {
        algorithms: [ALGORITHM],
    }) as JwtAccessPayload;

    if (payload.type !== "access") {
        throw new Error("Invalid token type");
    }

    return payload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
    const payload = jwt.verify(token, REFRESH_SECRET, {
        algorithms: [ALGORITHM],
    }) as JwtRefreshPayload;

    if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
    }

    return payload;
}
