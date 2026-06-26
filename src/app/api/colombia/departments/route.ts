import { NextResponse } from "next/server";

export const revalidate = 86400; // cache 24h

export async function GET() {
    const res = await fetch("https://api-colombia.com/api/v1/Department", {
        next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json([], { status: 502 });
    const data = await res.json();
    const departments = (data as { id: number; name: string }[])
        .map(d => ({ id: d.id, name: d.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));
    return NextResponse.json(departments);
}
