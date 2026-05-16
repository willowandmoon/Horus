import cloudinary from "@/src/infrastucture/database/cloudinary";
import { extractPdfText } from "@/src/infrastucture/pdf/pdfExtractor";
import { saveMedicalDocumentUseCase } from "@/src/application/historyMedical/saveMedicalDocument";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return Response.json(
        { error: "File and userId are required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ¡NUEVO! Extrae texto AQUÍ, con logs para debug
    console.log("Buffer length:", buffer.length);
    const extractedText = await extractPdfText(buffer);
    console.log("Texto extraído:", extractedText?.slice(0, 100));  // Preview

    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploadedFile = await cloudinary.uploader.upload(base64File, {
      folder: `medical-records/${userId}`,
      resource_type: "auto"
    });

    // ¡NUEVO! Pasa extractedText al use case (evita null)
    await saveMedicalDocumentUseCase({
      userId,
      url: uploadedFile.secure_url,
      publicId: uploadedFile.public_id,
      extractedText: extractedText || "Texto no extraíble (PDF escaneado/corrupto)"  // ← ¡Aquí!
    });

    return Response.json({
      message: "Document uploaded and saved successfully",
      extractedText: extractedText?.slice(0, 100)  // Para verificar en respuesta
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}