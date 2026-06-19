import Link from "next/link";
import { redirect } from "next/navigation";
import EyeOfHorusIcon from "@/src/components/EyeOfHorusIcon";
import { authGuard } from "@/src/shared/lib/auth.guard";
import { prisma } from "@/src/infrastructure/database/prisma/client";

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

    const products = await prisma.product.findMany({
        where: {
            isActive: true,
            productType: { in: ["BRACELET", "CARD"] },
        },
        orderBy: { price: "asc" },
    });

    return (
        <div className="min-h-screen bg-[#EDF2F4]">
            <header className="flex items-center justify-between px-6 md:px-10 py-6 bg-white border-b border-[#EDF2F4]">
                <div className="flex items-center gap-3">
                    <EyeOfHorusIcon className="w-7 h-7" />
                    <div>
                        <p className="text-xs text-[#8D99AE] uppercase tracking-[0.2em]">Tienda</p>
                        <h1 className="text-lg font-bold text-[#2B2D42]">Horus Braslet</h1>
                    </div>
                </div>
                <Link
                    href="/dashboard"
                    className="text-sm font-semibold text-[#EF233C] hover:text-[#D90429] transition-colors"
                >
                    Volver al dashboard
                </Link>
            </header>

            <main className="px-6 md:px-10 py-10">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#2B2D42]">Elige tu dispositivo</h2>
                        <p className="text-sm text-[#8D99AE] mt-2">
                            Selecciona la manilla o la tarjeta y continua al checkout.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-2xl border border-[#EDF2F4] shadow-sm p-6 flex flex-col gap-4"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-[0.2em] text-[#8D99AE]">
                                        {product.productType}
                                    </p>
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#FEE2E2] text-[#EF233C] font-semibold">
                                        Suscripcion anual
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-[#2B2D42]">{product.name}</h3>
                                    <p className="text-sm text-[#8D99AE] mt-2">
                                        {product.description ?? "Dispositivo Horus con tecnologia NFC."}
                                    </p>
                                </div>
                                <div className="flex items-end justify-between mt-auto">
                                    <div>
                                        <p className="text-xs text-[#8D99AE]">Precio</p>
                                        <p className="text-2xl font-bold text-[#2B2D42]">
                                            ${Number(product.price).toLocaleString("es-CO")}
                                            <span className="text-sm font-medium text-[#8D99AE]"> COP</span>
                                        </p>
                                    </div>
                                    <Link
                                        href={`/checkout?productId=${product.id}`}
                                        className="px-5 py-2.5 rounded-xl bg-[#EF233C] text-white text-sm font-semibold hover:bg-[#D90429] transition-colors"
                                    >
                                        Comprar
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {products.length === 0 && (
                        <div className="bg-white border border-[#EDF2F4] rounded-2xl p-6 text-center text-sm text-[#8D99AE]">
                            No hay productos disponibles en este momento.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

