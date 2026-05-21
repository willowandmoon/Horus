import { GoogleGenerativeAI } from "@google/generative-ai";

export async function correctOcrTextWithGemini(text: string): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (process.env.USE_AI_CORRECTION === "false") {
    console.log("\n[Gemini] Corrección por IA deshabilitada por config (USE_AI_CORRECTION=false).\n");
    return text;
  }

  if (!GEMINI_API_KEY) {
    console.warn("\n[Gemini] No GEMINI_API_KEY provista, saltando corrección IA.\n");
    return text;
  }

  try {
    console.log("\n[Gemini] Iniciando corrección de OCR con Gemini...");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // You can also consider using gemini-1.5-flash for speed or gemini-1.5-pro for better reasoning
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Eres un asistente médico experto. A continuación te presentaré un texto extraído mediante OCR de un documento médico (análisis, historia clínica, receta, etc).
El texto extraído puede contener errores ortotipográficos típicos de OCR (como confundir '0' con 'O', '1' con 'l', espacios mal colocados, palabras partidas).

Tu trabajo es:
1. Reconstruir las palabras rotas.
2. Corregir formato y caracteres mal interpretados siempre que sea obvio.
3. Mantener el significado original, los números y las fechas EXACTAMENTE como están, no inventes valores de presión, ni de glucosa ni fechas.
4. Entregar SOLAMENTE el texto corregido sin saludos, resúmenes ni aclaraciones tuyas.
5. NO incluyas emojis, íconos, estrellas, adornos ni ningún otro símbolo decorativo en tu respuesta. Solo texto limpio.

Texto original del OCR:
"""
${text}
"""
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const correctedText = response.text();

    if (!correctedText) {
      console.warn("\n[Gemini] Respuesta vacía de IA. Fallback al original.\n");
      return text;
    }

    console.log("[Gemini] Corrección exitosa.\n");
    return correctedText.trim();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n[Gemini] Error crítico capturado:", errorMessage);
    console.log("[Gemini] Aplicando Fallback: Devolviendo OCR original.\n");
    
    // Fallback original para no romper la ejecución
    return text;
  }
}
