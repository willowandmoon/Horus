import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/infrastructure/database/prisma/client";

export async function GET(request: NextRequest) {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ hasSubscription: false, types: [] }, { status: 401 });

    const subs = await prisma.subscription.findMany({
        where: { userId, status: "ACTIVE", endDate: { gt: new Date() } },
        include: { product: { select: { productType: true } } },
    });

    const types = subs.map(s => s.product.productType);
    return NextResponse.json({ hasSubscription: types.length > 0, types });
}
