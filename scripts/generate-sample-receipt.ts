import { writeFile, mkdir } from "node:fs/promises";
import { generateReceiptPdfBuffer, OrderEmailPayload } from "@/src/infrastructure/email/order-confirmation";

async function main() {
    const payload: OrderEmailPayload = {
        to: "emma122120063a@gmail.com",
        from: "emma122120063a@gmail.com",
        orderId: "sample-order",
        userId: "sample-user",
        reference: "horus-sample-0001",
        productName: "Horus Bracelet",
        productType: "BRACELET",
        totalAmount: 299000,
        currency: "COP",
        createdAt: new Date(),
        shipping: {
            street: "Calle 123 #45-67",
            city: "Bogota",
            department: "Cundinamarca",
            zip: "110111",
        },
    };

    const pdfBuffer = await generateReceiptPdfBuffer(payload);
    await mkdir("tmp", { recursive: true });
    await writeFile("tmp/receipt-sample.pdf", pdfBuffer);
    console.log("PDF generado en tmp/receipt-sample.pdf");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
