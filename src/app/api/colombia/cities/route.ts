import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const departmentId = request.nextUrl.searchParams.get("departmentId");
    if (!departmentId) return NextResponse.json([], { status: 400 });

    const res = await fetch(
        `https://api-colombia.com/api/v1/Department/${departmentId}/cities`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json([], { status: 502 });
    const data = await res.json();
    const cities = (data as { id: number; name: string }[])
        .map(c => ({ id: c.id, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));
    return NextResponse.json(cities);
}
