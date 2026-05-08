export interface JwtAccessPayload {
    sub: string; // user id
    email: string;
    type: 'access';
}

export interface JwtRefreshPayload {
    sub: string; // user id
    type: 'refresh';
}

export type JwtPayload = JwtAccessPayload | JwtRefreshPayload;