export default function Spinner({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}
        >
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.2" />
            <path
                d="M12 2 A10 10 0 0 1 22 12"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
    );
}
