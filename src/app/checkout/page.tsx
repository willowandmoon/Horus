import Link from "next/link";
import { redirect } from "next/navigation";
import EyeOfHorusIcon from "@/src/components/EyeOfHorusIcon";
import { authGuard } from "@/src/shared/lib/auth.guard";
import { prisma } from "@/src/infrastructure/database/prisma/client";
import CheckoutForm, { ShippingAddress } from "./_components/CheckoutForm";

export const metadata = {
    title: "Checkout · Horus Braslet",
    description: "Completa tu pago con Mercado Pago.",
};

interface CheckoutPageProps {
    searchParams: Promise<{ productId?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
    const { productId } = await searchParams;

    if (!productId) {
        redirect("/tienda");
    }

    try {
        await authGuard();
    } catch {
        redirect("/login");
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product || !product.isActive) {
        redirect("/tienda");
    }

    const createOrder = async (input: { productId: string; shippingAddress: ShippingAddress }) => {
        "use server";

        const session = await authGuard();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

        if (!baseUrl) {
            return { error: "Falta configurar NEXT_PUBLIC_APP_URL." };
        }

        const response = await fetch(`${baseUrl}/api/payments/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": session.sub,
                "x-user-email": session.email,
            },
            body: JSON.stringify(input),
            cache: "no-store",
        });

        const payload = await response.json();
        if (!response.ok) {
            return { error: payload?.message ?? "No se pudo crear la orden." };
        }

        const isTestToken = (process.env.MP_ACCESS_TOKEN ?? "").startsWith("TEST-");
        const initPoint = isTestToken
            ? payload?.data?.sandboxUrl ?? payload?.data?.initPoint
            : payload?.data?.initPoint ?? payload?.data?.sandboxUrl;
        if (!initPoint) {
            return { error: "No se recibio la URL de pago." };
        }

        return { initPoint };
    };

    return (
        <div className="min-h-screen bg-[#EDF2F4]">
            <header className="flex items-center justify-between px-6 md:px-10 py-6 bg-white border-b border-[#EDF2F4]">
                <div className="flex items-center gap-3">
                    <EyeOfHorusIcon className="w-7 h-7" />
                    <div>
                        <p className="text-xs text-[#8D99AE] uppercase tracking-[0.2em]">Checkout</p>
                        <h1 className="text-lg font-bold text-[#2B2D42]">Horus Braslet</h1>
                    </div>
                </div>
                <Link
                    href="/tienda"
                    className="text-sm font-semibold text-[#EF233C] hover:text-[#D90429] transition-colors"
                >
                    Volver a la tienda
                </Link>
            </header>

            <main className="px-6 md:px-10 py-10">
                <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="bg-white border border-[#EDF2F4] rounded-2xl p-6 shadow-sm h-fit">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#8D99AE]">Resumen</p>
                        <h2 className="text-2xl font-semibold text-[#2B2D42] mt-2">{product.name}</h2>
                        <p className="text-sm text-[#8D99AE] mt-2">
                            {product.description ?? "Dispositivo Horus con tecnologia NFC y suscripcion anual."}
                        </p>
                        <div className="mt-6 border-t border-[#EDF2F4] pt-6 space-y-2">
                            <div className="flex items-center justify-between text-sm text-[#8D99AE]">
                                <span>Producto</span>
                                <span className="text-[#2B2D42] font-semibold">{product.productType}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-[#8D99AE]">
                                <span>Suscripcion</span>
                                <span className="text-[#2B2D42] font-semibold">Anual</span>
                            </div>
                            <div className="flex items-center justify-between text-lg font-bold text-[#2B2D42] pt-3">
                                <span>Total</span>
                                <span>
                                    ${Number(product.price).toLocaleString("es-CO")}
                                    <span className="text-sm font-medium text-[#8D99AE]"> COP</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <CheckoutForm productId={product.id} createOrder={createOrder} />
                </div>
            </main>
        </div>
    );
}
