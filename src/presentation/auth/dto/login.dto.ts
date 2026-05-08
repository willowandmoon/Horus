import { z } from "zod";

export interface LoginDto {
    email:    string;
    password: string;
}

export const loginSchema = z.object({
    email: z
        .string({ error: "El correo es requerido" })
        .email("El correo no tiene un formato válido")
        .toLowerCase(),

    password: z.string({ error: "La contraseña es requerida" }),
});

export type LoginInput = z.infer<typeof loginSchema>;