export async function apiFetch(
    input: RequestInfo,
    init?: RequestInit
): Promise<Response> {

    const isBrowser = typeof window !== "undefined";

    // Single-flight refresh lock (prevents many parallel 401 -> refresh calls).
    // eslint-disable-next-line no-var
    var globalAny = globalThis as unknown as {
        __horus_refresh_in_flight__?: Promise<boolean> | null;
    };

    async function refreshOnce(): Promise<boolean> {
        if (globalAny.__horus_refresh_in_flight__) return globalAny.__horus_refresh_in_flight__;

        globalAny.__horus_refresh_in_flight__ = (async () => {
            const refreshed = await fetch("/api/auth/refresh", {
                method: "POST",
                credentials: "same-origin",
            });
            return refreshed.ok;
        })().finally(() => {
            globalAny.__horus_refresh_in_flight__ = null;
        });

        return globalAny.__horus_refresh_in_flight__;
    }

    let response = await fetch(input, {
        ...init,
        credentials: "same-origin",
    });

    // 2. Access token expirado
    if (response.status === 401) {

        // 3. Llama el endpoint de refresh que ya tienes
        const ok = await refreshOnce();

        if (ok) {
            // 4. Las cookies ya fueron rotadas por tu endpoint
            //    Reintenta la llamada original con los nuevos tokens
            response = await fetch(input, {
                ...init,
                credentials: "same-origin",
            });
        } else {
            // 5. Refresh token también expiró (7 días)
            //    Llama tu endpoint de logout que limpia las cookies
            await fetch("/api/auth/logout", { method: "POST" });

            // Nota: apiFetch es para navegador. Si se importa en server, no redirigimos.
            if (isBrowser) window.location.href = "/login";
        }
    }

    return response;
}