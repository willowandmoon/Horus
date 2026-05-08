export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    accountStatus: string;
}

export interface CreateUserData {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
}