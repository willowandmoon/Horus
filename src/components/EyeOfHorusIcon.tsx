/**
 * Ícono del Ojo de Horus — logo oficial de Horus Braslet.
 * Usa la imagen original ojo.png ubicada en /public.
 */
export default function EyeOfHorusIcon({ className }: { className?: string }) {
    return (
        <img
            src="/ojo.png"
            alt="Ojo de Horus — Horus Braslet"
            className={className}
        />
    );
}
