import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai";
import { 
  BloodType, 
  Gender, 
  AllergyType, 
  AllergySeverity, 
  ConditionSeverity, 
  ConditionStatus, 
  MedicationRoute, 
  MedicalHistoryEventType 
} from "@/src/generated/client";

export interface StructuredMedicalData {
  personalInfo?: {
    bloodType?: BloodType | null;
    gender?: Gender | null;
  } | null;
  explicitNoAllergies?: boolean;
  explicitNoMedications?: boolean;
  allergies?: Array<{
    allergenName?: string;
    allergyType?: AllergyType;
    severity?: AllergySeverity;
    reactionDescription?: string | null;
  }>;
  chronicConditions?: Array<{
    conditionName?: string;
    severity?: ConditionSeverity | null;
    status?: ConditionStatus;
    notes?: string | null;
  }>;
  medications?: Array<{
    customMedicationName?: string;
    dosage?: string | null;
    frequency?: string | null;
    route?: MedicationRoute;
    purpose?: string | null;
  }>;
  medicalHistory?: Array<{
    eventType?: MedicalHistoryEventType;
    eventName?: string;
    location?: string | null;
    outcome?: string | null;
  }>;
}

async function generateContentWithRetry(
  genAI: GoogleGenerativeAI,
  primaryModel: string,
  prompt: string
): Promise<GenerateContentResult> {
  const models = [primaryModel, "gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"];
  let lastError: unknown = null;

  for (const modelName of models) {
    let delay = 2000;
    const maxRetries = 3;
    console.log(`[Gemini] Intentando generar contenido con el modelo: ${modelName}`);

    for (let i = 0; i < maxRetries; i++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result;
      } catch (error: unknown) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        const isRetryable = 
          errorMessage.includes("503") || 
          errorMessage.includes("429") || 
          errorMessage.includes("Service Unavailable") || 
          errorMessage.includes("ResourceExhausted") || 
          errorMessage.includes("high demand") ||
          errorMessage.includes("Quota exceeded") ||
          errorMessage.includes("fetch failed");

        const isDailyQuotaExceeded = 
          errorMessage.includes("GenerateRequestsPerDay") || 
          errorMessage.includes("limit: 20") || 
          errorMessage.includes("limit: 1500");

        if (isDailyQuotaExceeded) {
          console.warn(`[Gemini] Cuota diaria agotada para ${modelName}. Pasando al modelo de respaldo...`);
          break;
        }

        if (isRetryable && i < maxRetries - 1) {
          let backoffDelay = delay;
          const match = errorMessage.match(/Please retry in ([\d.]+)s/i);
          if (match) {
            const seconds = parseFloat(match[1]);
            backoffDelay = Math.ceil((seconds + 1.5) * 1000);
            console.warn(`[Gemini] Límite alcanzado para ${modelName}. Esperando ${seconds}s recomendados por Google...`);
          } else {
            console.warn(`[Gemini] Error temporal en ${modelName} (${errorMessage.trim()}). Reintentando en ${delay}ms... (Intento ${i + 1}/${maxRetries})`);
          }
          
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          delay *= 2;
        } else {
          console.warn(`[Gemini] El modelo ${modelName} falló de forma persistente. Probando siguiente modelo de respaldo.`);
          break;
        }
      }
    }
  }

  throw lastError || new Error("Todos los modelos de Gemini fallaron.");
}

export async function correctOcrTextWithGemini(text: string): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (process.env.USE_AI_CORRECTION === "false") {
    console.log("\n[Gemini] Corrección por IA deshabilitada por config.\n");
    return text;
  }

  if (!GEMINI_API_KEY) {
    console.warn("\n[Gemini] No GEMINI_API_KEY provista, saltando corrección IA.\n");
    return text;
  }

  try {
    console.log("\n[Gemini] Iniciando corrección de OCR...");
    
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

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const result = await generateContentWithRetry(genAI, "gemini-2.5-flash", prompt);
    
    const correctedText = result.response.text();
    console.log("[Gemini] Corrección exitosa.\n");
    return correctedText.trim();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n[Gemini] Error crítico capturado:", errorMessage);
    console.log("[Gemini] Aplicando Fallback: Devolviendo OCR original.\n");
    return text;
  }
}

export async function structureMedicalTextWithGemini(cleanText: string): Promise<StructuredMedicalData> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error("[Gemini] No se encontró la GEMINI_API_KEY necesaria para estructurar el historial.");
  }

  try {
    console.log("[Gemini] Iniciando estructuración sintáctica a JSON...");

    const prompt = `
Actúas como un extractor de datos médicos profesional. Tu objetivo es transformar el texto de un historial clínico en un objeto JSON estrictamente estructurado.

REGLAS OBLIGATORIAS DE ENUMS (Respeta mayúsculas y guiones bajos exactos):
- bloodType: A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE.
- gender: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY.
- allergyType: MEDICATION, FOOD, ENVIRONMENTAL, OTHER.
- severity (Alergias): MILD, MODERATE, SEVERE, LIFE_THREATENING.
- severity (Condiciones Crónicas): MILD, MODERATE, SEVERE.
- status (Condiciones Crónicas): ACTIVE, MANAGED, IN_REMISSION, RESOLVED.
- route (Medicamentos): ORAL, INJECTION, TOPICAL, INHALATION, OTHER.
- eventType (Historial Clínico): SURGERY, HOSPITALIZATION, VACCINATION, INJURY, OTHER.

Estructura JSON requerida:
{
  "personalInfo": { "bloodType": "ENUM o null", "gender": "ENUM o null" },
  "explicitNoAllergies": boolean,
  "explicitNoMedications": boolean,
  "allergies": [
    { "allergenName": "string", "allergyType": "ENUM", "severity": "ENUM", "reactionDescription": "string o null" }
  ],
  "chronicConditions": [
    { "conditionName": "string", "severity": "ENUM o null", "status": "ENUM", "notes": "string o null" }
  ],
  "medications": [
    { "customMedicationName": "string", "dosage": "string o null", "frequency": "string o null", "route": "ENUM", "purpose": "string o null" }
  ],
  "medicalHistory": [
    { "eventType": "ENUM", "eventName": "string", "location": "string o null", "outcome": "string o null" }
  ]
}

REGLAS ADICIONALES DE EXTRACCIÓN:
- explicitNoAllergies: Pon true únicamente si el texto del documento indica de manera explícita que el paciente no tiene ninguna alergia o que las alergias son negadas (por ejemplo: 'alergias: negadas', 'sin alergias', 'niega alergias', 'no tiene alergias conocidas'). Si el documento simplemente no menciona el tema de las alergias o no hay información sobre ellas, debe ser false.
- explicitNoMedications: Pon true únicamente si el texto del documento indica de manera explícita que el paciente no toma ningún medicamento, no tiene tratamiento farmacológico activo o que los medicamentos son negados (por ejemplo: 'medicamentos: negados', 'no toma medicamentos', 'sin medicamentos actuales', 'niega fármacos'). Si el documento simplemente no menciona el tema o no contiene esa información, debe ser false.

REGLAS CRÍTICAS DE CALIDAD:
1. Si no encuentras datos reales y comprensibles para una sección, deja su arreglo vacío []. 
2. IGNORA ABSOLUTAMENTE cualquier texto que parezca basura de OCR, letras sueltas sin sentido (ej. "Pet cer vas", "cers de q ols"). Solo extrae información que tenga sentido médico real.
3. No inventes datos ni deduzcas enfermedades a partir de texto ininteligible bajo ninguna circunstancia.
4. En la sección de 'medicalHistory', si identificas que un mismo evento médico está descrito simultáneamente como una hospitalización y como una cirugía (por ejemplo: 'Hospitalización por cesárea' y 'Cesárea', o 'Hospitalización por apendicectomía' y 'Apendicectomía'), no crees registros redundantes para ambos. Registra únicamente el evento de forma general y simplificada como SURGERY (ej. 'Cesárea' o 'Apendicectomía') en lugar de detallar la hospitalización asociada, para evitar duplicidades en el historial médico.

DEVUELVE ÚNICAMENTE EL JSON. NO INCLUYAS BLOQUES DE MARKDOWN (NO PONGAS \`\`\`json NI NADA ANTES O DESPUÉS DEL CÓDIGO JSON). 

Texto médico a procesar:
"""
${cleanText}
"""
`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const result = await generateContentWithRetry(genAI, "gemini-2.5-flash", prompt);
    let jsonString = result.response.text();
    
    // Limpieza de seguridad por si la IA devuelve markdown
    const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
      jsonString = match[1];
    } else {
      jsonString = jsonString.replace(/```/g, "").trim();
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("[Gemini Error] Error al estructurar el texto:", error);
    throw error;
  }
}

export async function normalizeMedicationNamesWithGemini(medicationNames: string[]): Promise<Record<string, string>> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.warn("\n[Gemini] No GEMINI_API_KEY provista, saltando normalización de medicamentos.\n");
    return {};
  }

  if (!medicationNames || medicationNames.length === 0) {
    return {};
  }

  try {
    console.log(`[Gemini] Iniciando normalización de ${medicationNames.length} medicamentos...`);

    const prompt = `
Actúas como un farmacéutico experto. Te daré una lista de nombres de medicamentos ingresados por usuarios o extraídos por OCR.
Tu objetivo es identificar el principio activo genérico principal para cada uno de ellos, corregir errores ortográficos y devolver un mapeo exacto en JSON.
Ejemplo: "salbutamol inhalador" -> "salbutamol", "tylenol 500mg" -> "paracetamol", "aspirjna" -> "ácido acetilsalicílico".

Lista de medicamentos originales:
${JSON.stringify(medicationNames, null, 2)}

Devuelve ÚNICAMENTE un objeto JSON donde las claves sean exactamente los nombres originales provistos arriba, y los valores sean los nombres genéricos normalizados en minúsculas. No incluyas bloques de markdown como \`\`\`json.
`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const result = await generateContentWithRetry(genAI, "gemini-2.5-flash", prompt);
    let jsonString = result.response.text();
    
    // Limpieza de seguridad por si la IA devuelve markdown
    const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
      jsonString = match[1];
    } else {
      jsonString = jsonString.replace(/```/g, "").trim();
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("[Gemini Error] Error al normalizar medicamentos:", error);
    // Return empty mapping on error to avoid breaking the pipeline, it will fallback to the raw name
    return {};
  }
}
