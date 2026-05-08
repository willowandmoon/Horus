import {AuthUser, CreateUserData} from "@/src/domain/auth/auth.entity";

export interface AuthRepository {
    findByEmail(email: string): Promise<AuthUser & { passwordHash: string } | null>;
    findById(id: string):       Promise<AuthUser | null>;
    create(data: CreateUserData): Promise<AuthUser>;
    emailExists(email: string): Promise<boolean>;
}