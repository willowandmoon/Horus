import { z } from 'zod';

export interface RegisterDto {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
}

export const registerSchema = z
    .object({
        email: z
            .string({ error: "El correo es requerido" })
            .email("El correo no tiene un formato válido")
            .toLowerCase(),

        password: z
            .string({ error: "La contraseña es requerida" })
            .min(8, "La contraseña debe tener al menos 8 caracteres")
            .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
            .regex(/[0-9]/, "Debe contener al menos un número"),

        confirmPassword: z.string({
            error: "Debes confirmar tu contraseña",
        }),

        firstName: z
            .string({ error: "El nombre es requerido" })
            .min(2, "El nombre debe tener al menos 2 caracteres")
            .max(50, "El nombre no puede superar los 50 caracteres")
            .trim(),

        lastName: z
            .string({ error: "El apellido es requerido" })
            .min(2, "El apellido debe tener al menos 2 caracteres")
            .max(50, "El apellido no puede superar los 50 caracteres")
            .trim(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path:    ["confirmPassword"],
    });

export type RegisterInput = z.infer<typeof registerSchema>;