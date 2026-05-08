import { AppError } from "./app.error";

export class EmailAlreadyExistsError extends AppError {
    constructor() {
        super("Este email ya está registrado", 400, "EMAIL_ALREADY_EXISTS");
    }
}

export class InvalidCredentialsError extends AppError {
    constructor() {
        super("Correo o contraseña incorrectos", 401, "INVALID_CREDENTIALS");
    }
}

export class InvalidTokenError extends AppError {
    constructor() {
        super("Token inválido o expirado", 401, "INVALID_TOKEN");
    }
}

export class UserNotFoundError extends AppError {
    constructor() {
        super("Usuario no encontrado", 404, "USER_NOT_FOUND");
    }
}