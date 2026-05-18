import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const nodemailer = require("nodemailer") as typeof import("nodemailer");
const PDFDocument = require("pdfkit") as typeof import("pdfkit");

export interface OrderEmailPayload {
    to: string;
    from: string;
    orderId: string;
    userId: string;
    reference: string;
    productName: string;
    productType: string;
    totalAmount: number;
    currency: string;
    createdAt: Date;
    shipping: {
        street: string;
        city: string;
        department: string;
        zip?: string | null;
    };
}

const DEFAULT_TO = "emma122120063a@gmail.com";

const BRAND = {
    dark: "#2B2D42",
    accent: "#D90429",
    light: "#EDF2F4",
    muted: "#8D99AE",
    border: "#E5E7EB",
};

const FONT_DIR = resolve(process.cwd(), "assets", "fonts", "roboto");
const ROBOTO_REGULAR = resolve(FONT_DIR, "Roboto-Regular.ttf");
const ROBOTO_BOLD = resolve(FONT_DIR, "Roboto-Bold.ttf");

function formatCurrency(value: number, currency: string) {
    return `${value.toLocaleString("es-CO")} ${currency}`;
}

function resolveFonts(doc: InstanceType<typeof PDFDocument>) {
    const hasRoboto = existsSync(ROBOTO_REGULAR) && existsSync(ROBOTO_BOLD);
    if (hasRoboto) {
        doc.registerFont("Roboto", ROBOTO_REGULAR);
        doc.registerFont("Roboto-Bold", ROBOTO_BOLD);
        return { regular: "Roboto", bold: "Roboto-Bold" };
    }

    return { regular: "Helvetica", bold: "Helvetica-Bold" };
}

function drawTableRow(
    doc: InstanceType<typeof PDFDocument>,
    x: number,
    y: number,
    width: number,
    label: string,
    value: string,
    isStriped: boolean,
    fonts: { regular: string; bold: string }
) {
    const rowHeight = 24;
    const labelWidth = Math.round(width * 0.38);

    doc.save();
    doc.fillColor(isStriped ? BRAND.light : "#FFFFFF");
    doc.rect(x, y, width, rowHeight).fill();
    doc.restore();

    doc.strokeColor(BRAND.border).lineWidth(0.5).rect(x, y, width, rowHeight).stroke();

    doc.fillColor(BRAND.dark)
        .font(fonts.bold)
        .fontSize(10)
        .text(label, x + 10, y + 7, { width: labelWidth - 12 });

    doc.fillColor(BRAND.dark)
        .font(fonts.regular)
        .fontSize(10)
        .text(value, x + labelWidth, y + 7, { width: width - labelWidth - 12 });

    return y + rowHeight;
}

export async function generateReceiptPdfBuffer(payload: OrderEmailPayload): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 48 });
        const chunks: Buffer[] = [];
        const fonts = resolveFonts(doc);

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const pageWidth = doc.page.width;
        const margin = doc.page.margins.left;
        const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;

        // Header
        doc.save();
        doc.fillColor(BRAND.dark).rect(0, 0, pageWidth, 86).fill();
        doc.fillColor("#FFFFFF")
            .font(fonts.bold)
            .fontSize(20)
            .text("Horus Braslet", margin, 26);
        doc.fillColor("#E5E7EB")
            .font(fonts.regular)
            .fontSize(10)
            .text("Confirmacion de compra", margin, 54);
        doc.restore();

        let cursorY = 110;

        // Meta
        doc.fillColor(BRAND.dark).font(fonts.bold).fontSize(12).text("Datos de la orden", margin, cursorY);
        cursorY += 18;
        cursorY = drawTableRow(doc, margin, cursorY, contentWidth, "Orden", payload.reference, true, fonts);
        cursorY = drawTableRow(doc, margin, cursorY, contentWidth, "ID Orden", payload.orderId, false, fonts);
        cursorY = drawTableRow(doc, margin, cursorY, contentWidth, "ID Usuario", payload.userId, true, fonts);
        cursorY = drawTableRow(
            doc,
            margin,
            cursorY,
            contentWidth,
            "Fecha",
            payload.createdAt.toLocaleString("es-CO"),
            false,
            fonts
        );

        cursorY += 18;

        // Producto
        doc.fillColor(BRAND.dark).font(fonts.bold).fontSize(12).text("Detalle del producto", margin, cursorY);
        cursorY += 18;
        cursorY = drawTableRow(doc, margin, cursorY, contentWidth, "Producto", payload.productName, true, fonts);
        cursorY = drawTableRow(doc, margin, cursorY, contentWidth, "Tipo", payload.productType, false, fonts);
        cursorY = drawTableRow(
            doc,
            margin,
            cursorY,
            contentWidth,
            "Total",
            formatCurrency(payload.totalAmount, payload.currency),
            true,
            fonts
        );

        cursorY += 18;

        // Envio
        doc.fillColor(BRAND.dark).font(fonts.bold).fontSize(12).text("Direccion de envio", margin, cursorY);
        cursorY += 18;
        cursorY = drawTableRow(doc, margin, cursorY, contentWidth, "Calle", payload.shipping.street, true, fonts);
        cursorY = drawTableRow(
            doc,
            margin,
            cursorY,
            contentWidth,
            "Ciudad",
            `${payload.shipping.city} - ${payload.shipping.department}`,
            false,
            fonts
        );
        cursorY = drawTableRow(
            doc,
            margin,
            cursorY,
            contentWidth,
            "Codigo postal",
            payload.shipping.zip ?? "N/A",
            true,
            fonts
        );

        // Footer
        const footerY = doc.page.height - 80;
        doc.fillColor(BRAND.accent).rect(margin, footerY, contentWidth, 1).fill();
        doc.fillColor(BRAND.muted)
            .font(fonts.regular)
            .fontSize(9)
            .text("Gracias por confiar en Horus Braslet. Tu compra esta confirmada.", margin, footerY + 12);

        doc.end();
    });
}

function createTransport() {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT ?? 465);
    const secure = String(process.env.EMAIL_SECURE ?? "true") === "true";
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
    });
}

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload) {
    const transport = createTransport();
    if (!transport) {
        console.warn("[EMAIL] Falta configurar SMTP (EMAIL_HOST, EMAIL_USER, EMAIL_PASS).");
        return;
    }

    const pdfBuffer = await generateReceiptPdfBuffer(payload);
    const recipient = payload.to || process.env.EMAIL_TO || DEFAULT_TO;

    await transport.sendMail({
        from: payload.from,
        to: recipient,
        subject: "Confirmacion de compra - Horus Braslet",
        text: `Tu compra fue confirmada. Orden: ${payload.reference}. Total: ${formatCurrency(payload.totalAmount, payload.currency)}.`,
        attachments: [
            {
                filename: "comprobante-horus.pdf",
                content: pdfBuffer,
                contentType: "application/pdf",
            },
        ],
    });
}
