import pdfParse from "pdf-parse";

export async function extractPdfText(buffer: Buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("El buffer del PDF está vacío.");
  }
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("Error al extraer el texto del PDF:", error);
    throw new Error("No se pudo extraer el texto del PDF.");
  }
}