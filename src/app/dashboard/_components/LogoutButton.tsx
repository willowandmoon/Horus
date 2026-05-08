"use client";

// Botón de cierre de sesión — llama al endpoint de logout y redirige al registro.
// La prop `compact` muestra solo el ícono (para la barra móvil).
export default function LogoutButton({ compact }: { compact?: boolean }) {
    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        // Redirección dura para limpiar cualquier estado cacheado del cliente
        window.location.href = "/register";
    }

    if (compact) {
        return (
            <button
                onClick={handleLogout}
                className="p-2 text-[#8D99AE] hover:text-white transition-colors rounded-lg hover:bg-white/5"
                title="Cerrar sesión"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                </svg>
            </button>
        );
    }

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#8D99AE] hover:text-white transition-colors rounded-xl hover:bg-white/5"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
            </svg>
            Cerrar sesión
        </button>
    );
}
