import Link from "next/link";
import { redirect } from "next/navigation";
import EyeOfHorusIcon from "@/src/components/EyeOfHorusIcon";
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

    const [products, personalInfo, emergencyContacts] = await Promise.all([
        prisma.product.findMany({
            where: {
                isActive: true,
                productType: { in: ["BRACELET", "CARD"] },
            },
            orderBy: { price: "asc" },
        }),
        prisma.personalInformation.findUnique({
            where: { userId: authData.sub },
            select: { firstName: true, lastName: true, bloodType: true, identificationNumber: true }
        }),
        prisma.emergencyContact.findMany({
            where: { userId: authData.sub, isActive: true },
            orderBy: { priorityOrder: "asc" },
            take: 1,
            select: { fullName: true, phonePrimary: true }
        })
    ]);

    const userData = {
        name: personalInfo ? `${personalInfo.firstName} ${personalInfo.lastName}`.trim().substring(0, 20) : "USUARIO DE PRUEBA",
        bloodType: personalInfo?.bloodType || "N/A",
        idNumber: personalInfo?.identificationNumber || "1234567890",
        emergencyContact: emergencyContacts[0]?.phonePrimary || "NO REGISTRADO",
        emergencyName: emergencyContacts[0]?.fullName || "CONTACTO"
    };

    const serializedProducts = products.map((p) => ({
        ...p,
        price: Number(p.price)
    }));

    return <TiendaClient products={serializedProducts} userData={userData} />;
}

