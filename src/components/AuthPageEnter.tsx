"use client";

// Solo provee el id="auth-page" que el CSS usa para las animaciones de entrada/salida.
// La animación de entrada está definida en globals.css y se aplica automáticamente.
export default function AuthPageEnter({ children }: { children: React.ReactNode }) {
    return (
        <div id="auth-page">
            {children}
        </div>
    );
}
