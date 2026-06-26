import Link from "next/link";
import { redirect } from "next/navigation";
import { authGuard } from "@/src/shared/lib/auth.guard";
import { prisma } from "@/src/infrastructure/database/prisma/client";
import { createOrderService } from "@/src/app/api/payments/create-order/service";
import { AppError } from "@/src/shared/errors/app.error";
import CheckoutForm, { ShippingAddress, Customization } from "./_components/CheckoutForm";

export const metadata = {
    title: "Checkout · Horus",
    description: "Completa tu pago con Mercado Pago.",
};

interface CheckoutPageProps {
    searchParams: Promise<{ productId?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
    const { productId } = await searchParams;
    if (!productId) redirect("/tienda");

    let session!: Awaited<ReturnType<typeof authGuard>>;
    try { session = await authGuard(); } catch { redirect("/login"); }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) redirect("/tienda");

    const createOrder = async (input: {
        productId: string;
        shippingAddress: ShippingAddress;
        customization?: Customization;
    }) => {
        "use server";
        try {
            const s      = await authGuard();
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

            const result = await createOrderService({
                productId:       input.productId,
                userId:          s.sub,
                userEmail:       s.email,
                appUrl,
                shippingAddress: input.shippingAddress,
                customization:   input.customization,
            });

            const isTest   = (process.env.MP_ACCESS_TOKEN ?? "").startsWith("TEST-");
            const initPoint = isTest
                ? (result.sandboxUrl ?? result.initPoint)
                : (result.initPoint  ?? result.sandboxUrl);

            if (!initPoint) return { error: "No se recibió la URL de pago." };
            return { initPoint, orderId: result.orderId };
        } catch (err) {
            if (err instanceof AppError) return { error: err.message };
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[CHECKOUT_CREATE_ORDER]", msg);
            return { error: `Error: ${msg}` };
        }
    };

    const price = Number(product.price).toLocaleString("es-CO");
    const isCard = product.productType === "CARD";

    return (
        <div className="min-h-screen" style={{ background: "#F2F1EC" }}>

            {/* Header */}
            <header className="flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-[#E4E2DC]">
                <div className="flex items-center gap-3">
                    <img src="/logos-horus-2.svg" alt="Horus" className="h-8 w-auto" />
                    <div className="h-5 w-px bg-[#E4E2DC]" />
                    <span className="text-xs font-bold text-[#8D99AE] uppercase tracking-[0.15em]">Checkout seguro</span>
                </div>
                <Link href="/tienda" className="text-sm font-semibold text-[#8D99AE] hover:text-[#1A1512] transition-colors flex items-center gap-1.5">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Volver a la tienda
                </Link>
            </header>

            <main className="px-4 md:px-10 py-8 md:py-12">
                <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1fr_1.1fr]">

                    {/* LEFT — order summary */}
                    <div className="h-fit">
                        <div className="bg-[#1A1512] text-white rounded-3xl p-7 shadow-xl">
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8D99AE] mb-4">Resumen del pedido</p>

                            {/* Product icon + name */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                    {isCard ? (
                                        <svg className="w-7 h-7 text-[#FAD957]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-7 h-7 text-[#FAD957]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-lg leading-tight">{product.name}</p>
                                    <p className="text-sm text-[#8D99AE] mt-0.5">
                                        {product.description ?? "Dispositivo Horus con tecnología NFC"}
                                    </p>
                                </div>
                            </div>

                            {/* Line items */}
                            <div className="space-y-2.5 border-t border-white/10 pt-5">
                                <div className="flex justify-between text-sm text-[#8D99AE]">
                                    <span>Tipo de producto</span>
                                    <span className="text-white font-semibold">{product.productType}</span>
                                </div>
                                <div className="flex justify-between text-sm text-[#8D99AE]">
                                    <span>Suscripción</span>
                                    <span className="text-white font-semibold">Anual</span>
                                </div>
                                <div className="flex justify-between text-sm text-[#8D99AE]">
                                    <span>Tecnología</span>
                                    <span className="text-white font-semibold">NFC</span>
                                </div>
                                <div className="flex justify-between text-sm text-[#8D99AE]">
                                    <span>Garantía</span>
                                    <span className="text-white font-semibold">12 meses</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-end">
                                <span className="text-sm text-[#8D99AE]">Total a pagar</span>
                                <div className="text-right">
                                    <p className="text-3xl font-bold leading-none">${price}</p>
                                    <p className="text-xs text-[#8D99AE] mt-1">COP · Pago único</p>
                                </div>
                            </div>
                        </div>

                        {/* Trust badges */}
                        <div className="mt-5 grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-2xl p-3 text-center border border-[#E4E2DC] shadow-sm">
                                <div className="flex justify-center mb-2">
                                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#1A1512" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                </div>
                                <p className="text-[10px] font-bold text-[#1A1512] uppercase tracking-wide">Pago seguro</p>
                            </div>
                            <div className="bg-white rounded-2xl p-3 text-center border border-[#E4E2DC] shadow-sm">
                                <div className="flex justify-center mb-2">
                                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#1A1512" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                                    </svg>
                                </div>
                                <p className="text-[10px] font-bold text-[#1A1512] uppercase tracking-wide">Envío Colombia</p>
                            </div>
                            <div className="bg-white rounded-2xl p-3 text-center border border-[#E4E2DC] shadow-sm">
                                <div className="flex justify-center mb-2">
                                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#1A1512" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                    </svg>
                                </div>
                                <p className="text-[10px] font-bold text-[#1A1512] uppercase tracking-wide">Compra protegida</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — form */}
                    <CheckoutForm
                        productId={product.id}
                        userId={session!.sub}
                        createOrder={createOrder}
                    />
                </div>
            </main>
        </div>
    );
}
