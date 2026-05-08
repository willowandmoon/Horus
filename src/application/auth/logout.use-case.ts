// El logout no necesita repositorio porque la sesión vive en las cookies
// Solo se eliminan las cookies desde el route.ts con clearAuthCookies
// Este use case existe para mantener consistencia en la arquitectura
// y para cuando en el futuro necesites invalidar tokens en BD (blacklist)

export async function logoutUseCase(): Promise<void> {
    // Aquí en el futuro puedes agregar:
    // - Guardar el token en una blacklist en BD
    // - Registrar el evento en audit logs
    // - Notificar a otros servicios
    return;
}