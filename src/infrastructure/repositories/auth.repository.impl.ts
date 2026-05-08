import {prisma} from "@/src/infrastructure/database/prisma/client";
import {AuthRepository} from "@/src/domain/auth/auth.repository";
import {AuthUser, CreateUserData} from "@/src/domain/auth/auth.entity";

export class AuthRepositoryImpl implements AuthRepository {

    async findByEmail(email: string) {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id:           true,
                email:        true,
                passwordHash: true,
                accountStatus: true,
                personalInfo: {
                    select: { firstName: true, lastName: true },
                },
            },
        });

        if (!user || !user.personalInfo) return null;

        return {
            id:            user.id,
            email:         user.email,
            passwordHash:  user.passwordHash,
            accountStatus: user.accountStatus,
            firstName:     user.personalInfo.firstName,
            lastName:      user.personalInfo.lastName,
        };
    }

    async findById(id: string): Promise<AuthUser | null> {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id:            true,
                email:         true,
                accountStatus: true,
                personalInfo: {
                    select: { firstName: true, lastName: true },
                },
            },
        });

        if (!user || !user.personalInfo) return null;

        return {
            id:            user.id,
            email:         user.email,
            accountStatus: user.accountStatus,
            firstName:     user.personalInfo.firstName,
            lastName:      user.personalInfo.lastName,
        };
    }

    async create(data: CreateUserData): Promise<AuthUser> {
        const user = await prisma.user.create({
            data: {
                email:        data.email,
                passwordHash: data.passwordHash,
                personalInfo: {
                    create: {
                        firstName: data.firstName,
                        lastName:  data.lastName,
                    },
                },
                // Crea configuración de privacidad por defecto al registrarse
                privacySettings: {
                    create: {},
                },
            },
            select: {
                id:            true,
                email:         true,
                accountStatus: true,
                personalInfo: {
                    select: { firstName: true, lastName: true },
                },
            },
        });

        return {
            id:            user.id,
            email:         user.email,
            accountStatus: user.accountStatus,
            firstName:     user.personalInfo!.firstName,
            lastName:      user.personalInfo!.lastName,
        };
    }

    async emailExists(email: string): Promise<boolean> {
        const count = await prisma.user.count({ where: { email } });
        return count > 0;
    }
}