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
        fullName?: string | null;
        phone?: string | null;
        street: string;
        neighborhood?: string | null;
        city: string;
        department: string;
        zip?: string | null;
        instructions?: string | null;
    };
}

const DEFAULT_TO = "emma122120063a@gmail.com";

// Horus brand palette
const BRAND = {
    dark:   "#1A1512",
    gold:   "#FAD957",
    cream:  "#F2F1EC",
    muted:  "#8D99AE",
    border: "#E4E2DC",
    white:  "#FFFFFF",
};

const FONT_DIR    = resolve(process.cwd(), "assets", "fonts", "roboto");
const ROBOTO      = resolve(FONT_DIR, "Roboto-Regular.ttf");
const ROBOTO_BOLD = resolve(FONT_DIR, "Roboto-Bold.ttf");
const LOGO_PATH   = resolve(process.cwd(), "public", "logos-horus-4.png");

function formatCurrency(value: number, currency: string) {
    return `$${value.toLocaleString("es-CO")} ${currency}`;
}

function resolveFonts(doc: InstanceType<typeof PDFDocument>) {
    if (existsSync(ROBOTO) && existsSync(ROBOTO_BOLD)) {
        doc.registerFont("R",  ROBOTO);
        doc.registerFont("RB", ROBOTO_BOLD);
        return { r: "R", b: "RB" };
    }
    return { r: "Helvetica", b: "Helvetica-Bold" };
}

function tableRow(
    doc: InstanceType<typeof PDFDocument>,
    x: number, y: number, w: number,
    label: string, value: string,
    shade: boolean,
    fonts: { r: string; b: string }
) {
    const h = 26, lw = Math.round(w * 0.38);
    doc.save()
        .fillColor(shade ? BRAND.cream : BRAND.white)
        .rect(x, y, w, h).fill()
        .restore();
    doc.strokeColor(BRAND.border).lineWidth(0.4).rect(x, y, w, h).stroke();
    doc.fillColor(BRAND.muted).font(fonts.b).fontSize(9.5).text(label, x + 10, y + 8, { width: lw - 12 });
    doc.fillColor(BRAND.dark).font(fonts.r).fontSize(9.5).text(value, x + lw, y + 8, { width: w - lw - 12 });
    return y + h;
}

function sectionHeader(
    doc: InstanceType<typeof PDFDocument>,
    x: number, y: number, w: number,
    title: string,
    fonts: { r: string; b: string }
) {
    doc.fillColor(BRAND.gold).rect(x, y + 2, 3, 13).fill();
    doc.fillColor(BRAND.dark).font(fonts.b).fontSize(11).text(title, x + 11, y + 1);
    return y + 22;
}

export async function generateReceiptPdfBuffer(payload: OrderEmailPayload): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc    = new PDFDocument({ size: "A4", margin: 48, compress: true });
        const chunks: Buffer[] = [];
        const fonts  = resolveFonts(doc);

        doc.on("data",  (c: Buffer) => chunks.push(c));
        doc.on("end",   () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const pw = doc.page.width;
        const m  = doc.page.margins.left;
        const cw = pw - m * 2;

        /* ── HEADER ── */
        doc.fillColor(BRAND.dark).rect(0, 0, pw, 96).fill();
        doc.fillColor(BRAND.gold).rect(0, 93, pw, 3).fill();

        if (existsSync(LOGO_PATH)) {
            doc.image(LOGO_PATH, m, 20, { height: 52, fit: [52, 52] });
        }

        const textX = existsSync(LOGO_PATH) ? m + 64 : m;
        doc.fillColor(BRAND.white).font(fonts.b).fontSize(22).text("HORUS", textX, 22);
        doc.fillColor(BRAND.gold).font(fonts.r).fontSize(10).text("Confirmación de compra", textX, 50);

        /* ── ORDEN ── */
        let y = 118;
        y = sectionHeader(doc, m, y, cw, "Datos de la orden", fonts);
        y = tableRow(doc, m, y, cw, "Referencia",  payload.reference,                         true,  fonts);
        y = tableRow(doc, m, y, cw, "ID de orden", payload.orderId,                           false, fonts);
        y = tableRow(doc, m, y, cw, "Fecha",       payload.createdAt.toLocaleString("es-CO"), true,  fonts);

        y += 20;

        /* ── PRODUCTO ── */
        y = sectionHeader(doc, m, y, cw, "Detalle del producto", fonts);
        y = tableRow(doc, m, y, cw, "Producto", payload.productName,                               true,  fonts);
        y = tableRow(doc, m, y, cw, "Tipo",     payload.productType,                               false, fonts);
        y = tableRow(doc, m, y, cw, "Total",    formatCurrency(payload.totalAmount, payload.currency), true, fonts);

        y += 20;

        /* ── ENVÍO ── */
        y = sectionHeader(doc, m, y, cw, "Dirección de envío", fonts);
        if (payload.shipping.fullName)
            y = tableRow(doc, m, y, cw, "Destinatario", payload.shipping.fullName, true,  fonts);
        if (payload.shipping.phone)
            y = tableRow(doc, m, y, cw, "Teléfono",     payload.shipping.phone,    false, fonts);
        y = tableRow(doc, m, y, cw, "Dirección", payload.shipping.street, !payload.shipping.phone, fonts);
        if (payload.shipping.neighborhood)
            y = tableRow(doc, m, y, cw, "Barrio", payload.shipping.neighborhood, false, fonts);
        y = tableRow(doc, m, y, cw, "Ciudad", `${payload.shipping.city}, ${payload.shipping.department}`, false, fonts);
        if (payload.shipping.zip)
            y = tableRow(doc, m, y, cw, "Código postal",   payload.shipping.zip,          true,  fonts);
        if (payload.shipping.instructions)
            y = tableRow(doc, m, y, cw, "Instrucciones",   payload.shipping.instructions, false, fonts);

        /* ── FOOTER ── */
        const fy = doc.page.height - 72;
        doc.fillColor(BRAND.dark).rect(0, fy, pw, 72).fill();
        doc.fillColor(BRAND.gold).rect(0, fy, pw, 2).fill();
        doc.fillColor(BRAND.white).font(fonts.b).fontSize(10).text("Gracias por confiar en HORUS", m, fy + 16);
        doc.fillColor(BRAND.muted).font(fonts.r).fontSize(9)
            .text("Tu compra está confirmada. Pronto recibirás tu dispositivo.", m, fy + 32);
        doc.fillColor(BRAND.muted).font(fonts.r).fontSize(8).text("horus.co  ·  soporte@horus.co", m, fy + 50);

        doc.end();
    });
}

function createTransport() {
    const host   = process.env.EMAIL_HOST;
    const port   = Number(process.env.EMAIL_PORT ?? 465);
    const secure = String(process.env.EMAIL_SECURE ?? "true") === "true";
    const user   = process.env.EMAIL_USER;
    const pass   = process.env.EMAIL_PASS;
    if (!host || !user || !pass) return null;
    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
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
        from:    payload.from,
        to:      recipient,
        subject: `Tu pedido HORUS está confirmado — ${payload.reference}`,
        html: `
            <div style="font-family:sans-serif;background:#F2F1EC;padding:32px">
                <div style="max-width:520px;margin:0 auto;background:#1A1512;border-radius:16px;overflow:hidden">
                    <div style="padding:28px 32px;border-bottom:3px solid #FAD957">
                        <p style="color:#FAD957;font-size:11px;letter-spacing:0.2em;margin:0 0 4px">HORUS</p>
                        <h1 style="color:#FFFFFF;font-size:20px;margin:0">Compra confirmada</h1>
                    </div>
                    <div style="padding:28px 32px">
                        <p style="color:#8D99AE;font-size:13px;margin:0 0 8px">Hola ${payload.shipping.fullName ?? ""},</p>
                        <p style="color:#F2F1EC;font-size:14px;margin:0 0 20px">
                            Tu pedido <strong style="color:#FAD957">${payload.reference}</strong> ha sido confirmado.
                        </p>
                        <div style="background:#2D2319;border-radius:10px;padding:16px 20px;margin-bottom:20px">
                            <p style="color:#8D99AE;font-size:11px;margin:0 0 6px;letter-spacing:0.1em">TOTAL PAGADO</p>
                            <p style="color:#FAD957;font-size:24px;font-weight:bold;margin:0">
                                ${formatCurrency(payload.totalAmount, payload.currency)}
                            </p>
                        </div>
                        <p style="color:#8D99AE;font-size:12px;margin:0">
                            Adjunto encontrarás el comprobante de tu compra en PDF.
                        </p>
                    </div>
                    <div style="padding:16px 32px;border-top:1px solid #2D2319">
                        <p style="color:#4A4440;font-size:11px;margin:0">HORUS · soporte@horus.co</p>
                    </div>
                </div>
            </div>
        `,
        attachments: [{
            filename:    `comprobante-horus-${payload.reference}.pdf`,
            content:     pdfBuffer,
            contentType: "application/pdf",
        }],
    });
}
