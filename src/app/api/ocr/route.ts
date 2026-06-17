import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/src/infrastructure/medical-history/ocr/tesseractOcr";
import { correctOcrTextWithGemini } from "@/src/infrastructure/ai/openai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ninguna imagen. Usa la clave 'image' en el form-data." },
        { status: 400 }
      );
    }

    // Convertir el archivo a Buffer (requerido por API Backend)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call al core OCR reutilizable (ahora con Sharp Pre-processing integrado en la infraestructura)
    const originalText = await extractTextFromImage(buffer);
    
    // Etapa de IA: Corrección inteligente de errores OCR con Gemini
    const correctedText = await correctOcrTextWithGemini(originalText);
    
    // Devolver resultado con ambas versiones
    return NextResponse.json({ 
      success: true, 
      text: correctedText,
      originalOcrData: originalText 
    });
  } catch (error: Omit<Error, never> | unknown) {
    console.error("Error procesando OCR:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error interno procesando OCR", details: errorMessage },
      { status: 500 }
    );
  }
}
