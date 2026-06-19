import { prisma } from "@/src/infrastructure/database/prisma/client";

async function main() {
    await prisma.product.upsert({
        where: { name: "Horus Bracelet" },
        update: {},
        create: {
            name: "Horus Bracelet",
            productType: "BRACELET",
            description:
                "Manilla NFC personalizable con chip NTAG216. Acceso inmediato a tu perfil médico desde cualquier celular.",
            price: 149900,
            currency: "COP",
            billingCycle: "ANNUAL",
        },
    });

    await prisma.product.upsert({
        where: { name: "Horus Card" },
        update: {},
        create: {
            name: "Horus Card",
            productType: "CARD",
            description:
                "Tarjeta NFC del tamaño de una cédula. Perfecta para cartera o bolsillo. Mismo perfil médico que la manilla.",
            price: 149900,
            currency: "COP",
            billingCycle: "ANNUAL",
        },
    });

    console.log("Seed ejecutado correctamente");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });