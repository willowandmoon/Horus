import { redirect } from "next/navigation";
import { authGuard } from "@/src/shared/lib/auth.guard";
import { prisma } from "@/src/infrastructure/database/prisma/client";
import TiendaClient from "./_components/TiendaClient";

export const metadata = {
    title: "Tienda · Horus Braslet",
    description: "Elige tu producto Horus y completa tu suscripcion.",
};

export default async function StorePage() {
    try {
        await authGuard();
    } catch {
        redirect("/login");
    }

    const authData = await authGuard();

    const [products, personalInfo, emergencyContacts, orders, activeSubscriptions] = await Promise.all([
        prisma.product.findMany({
            where: { isActive: true, productType: { in: ["BRACELET", "CARD"] } },
            orderBy: { price: "asc" },
        }),
        prisma.personalInformation.findUnique({
            where: { userId: authData.sub },
            select: { firstName: true, lastName: true, bloodType: true, identificationNumber: true },
        }),
        prisma.emergencyContact.findMany({
            where: { userId: authData.sub, isActive: true },
            orderBy: { priorityOrder: "asc" },
            take: 1,
            select: { fullName: true, phonePrimary: true },
        }),
        prisma.order.findMany({
            where: { userId: authData.sub },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
                id:            true,
                reference:     true,
                status:        true,
                totalAmount:   true,
                currency:      true,
                createdAt:     true,
                braceletColor: true,
                cardFrontUrl:  true,
                cardBackUrl:   true,
                product:      { select: { name: true, productType: true } },
                payment:      { select: { status: true, paidAt: true } },
                subscription: { select: { status: true, endDate: true } },
            },
        }),
        prisma.subscription.findMany({
            where: { userId: authData.sub, status: "ACTIVE", endDate: { gt: new Date() } },
            include: { product: { select: { productType: true } } },
        }),
    ]);

    const userData = {
        id: authData.sub,
        name: personalInfo
            ? `${personalInfo.firstName} ${personalInfo.lastName}`.trim().substring(0, 20)
            : "USUARIO DE PRUEBA",
        bloodType: personalInfo?.bloodType || "N/A",
        idNumber: personalInfo?.identificationNumber || "1234567890",
        emergencyContact: emergencyContacts[0]?.phonePrimary || "NO REGISTRADO",
        emergencyName: emergencyContacts[0]?.fullName || "CONTACTO",
    };

    const activeSubTypes = activeSubscriptions.map(s => s.product.productType);
    const profileComplete = !!(
        personalInfo?.identificationNumber &&
        personalInfo?.bloodType &&
        emergencyContacts.length > 0
    );

    const serializedProducts = products.map((p) => ({ ...p, price: Number(p.price) }));

    const serializedOrders = orders.map((o) => ({
        ...o,
        totalAmount: Number(o.totalAmount),
        createdAt:   o.createdAt.toISOString(),
        payment: o.payment
            ? { ...o.payment, paidAt: o.payment.paidAt?.toISOString() ?? null }
            : null,
        subscription: o.subscription
            ? { ...o.subscription, endDate: o.subscription.endDate?.toISOString() ?? null }
            : null,
    }));

    return (
        <TiendaClient
            products={serializedProducts}
            userData={userData}
            orders={serializedOrders}
            activeSubTypes={activeSubTypes}
            profileComplete={profileComplete}
        />
    );
}
