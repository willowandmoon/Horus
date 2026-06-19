import OpenAI from "openai";
import {
  BloodType,
  Gender,
  AllergyType,
  AllergySeverity,
  ConditionSeverity,
  ConditionStatus,
  MedicationRoute,
  MedicalHistoryEventType,
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

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("[OpenAI] No se encontró OPENAI_API_KEY.");
  return new OpenAI({ apiKey });
}

async function chatWithRetry(
  client: OpenAI,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  maxTokens: number
): Promise<string> {
  const MODEL = "gpt-4o-mini";
  let delay = 2000;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0,
      });
      return res.choices[0]?.message?.content?.trim() ?? "";
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const retryable =
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("rate limit") ||
        msg.includes("overloaded");

      if (retryable && attempt < 2) {
        console.warn(`[OpenAI] Error temporal, reintentando en ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error("[OpenAI] Todos los reintentos fallaron.");
}

export async function correctOcrText(text: string): Promise<string> {
  if (process.env.USE_AI_CORRECTION === "false") {
    console.log("[OpenAI] Corrección por IA deshabilitada por config.");
    return text;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[OpenAI] No OPENAI_API_KEY provista, saltando corrección IA.");
    return text;
  }

  try {
    console.log("[OpenAI] Iniciando corrección de OCR...");
    const client = getClient();

    const result = await chatWithRetry(
      client,
      [
        {
          role: "system",
          content:
            "Eres un asistente médico experto en corrección de texto OCR. " +
            "Corriges errores tipográficos, palabras partidas y caracteres mal interpretados. " +
            "Conservas exactamente los números, fechas y valores clínicos. " +
            "Devuelves SOLO el texto corregido, sin saludos, resúmenes, emojis ni adornos.",
        },
        {
          role: "user",
          content: `Corrige el siguiente texto OCR de un documento médico:\n\n"""\n${text}\n"""`,
        },
      ],
      2048
    );

    console.log("[OpenAI] Corrección exitosa.");
    return result || text;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[OpenAI] Error en corrección OCR:", msg);
    console.log("[OpenAI] Fallback: devolviendo OCR original.");
    return text;
  }
}

export async function structureMedicalText(
  cleanText: string
): Promise<StructuredMedicalData> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("[OpenAI] No se encontró OPENAI_API_KEY.");

  console.log("[OpenAI] Iniciando estructuración a JSON...");
  const client = getClient();

  const result = await chatWithRetry(
    client,
    [
      {
        role: "system",
        content: `Eres un extractor de datos médicos profesional. Transforma texto de historiales clínicos en JSON estructurado.

ENUMS obligatorios (exactos, con mayúsculas y guiones bajos):
- bloodType: A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE
- gender: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY
- allergyType: MEDICATION, FOOD, ENVIRONMENTAL, OTHER
- severity (alergias): MILD, MODERATE, SEVERE, LIFE_THREATENING
- severity (condiciones): MILD, MODERATE, SEVERE
- status (condiciones): ACTIVE, MANAGED, IN_REMISSION, RESOLVED
- route (medicamentos): ORAL, INJECTION, TOPICAL, INHALATION, OTHER
- eventType (historial): SURGERY, HOSPITALIZATION, VACCINATION, INJURY, OTHER

Estructura JSON requerida:
{"personalInfo":{"bloodType":"ENUM o null","gender":"ENUM o null"},"explicitNoAllergies":boolean,"explicitNoMedications":boolean,"allergies":[{"allergenName":"string","allergyType":"ENUM","severity":"ENUM","reactionDescription":"string o null"}],"chronicConditions":[{"conditionName":"string","severity":"ENUM o null","status":"ENUM","notes":"string o null"}],"medications":[{"customMedicationName":"string","dosage":"string o null","frequency":"string o null","route":"ENUM","purpose":"string o null"}],"medicalHistory":[{"eventType":"ENUM","eventName":"string","location":"string o null","outcome":"string o null"}]}

REGLAS:
- explicitNoAllergies: true solo si el texto dice explícitamente "sin alergias", "alergias negadas" o equivalente.
- explicitNoMedications: true solo si el texto dice explícitamente "sin medicamentos", "niega fármacos" o equivalente.
- Arrays vacíos [] si no hay datos reales. Ignora basura OCR sin sentido médico.
- En medicalHistory, si un evento es a la vez hospitalización y cirugía, registra solo la cirugía (SURGERY).
- Devuelve ÚNICAMENTE el JSON, sin bloques markdown.`,
      },
      {
        role: "user",
        content: `Texto médico:\n\n"""\n${cleanText}\n"""`,
      },
    ],
    2048
  );

  let jsonString = result;
  const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    jsonString = match[1];
  } else {
    jsonString = jsonString.replace(/```/g, "").trim();
  }

  return JSON.parse(jsonString);
}

export async function normalizeMedicationNames(
  medicationNames: string[]
): Promise<Record<string, string>> {
  if (!medicationNames || medicationNames.length === 0) return {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[OpenAI] No OPENAI_API_KEY, saltando normalización.");
    return {};
  }

  try {
    console.log(
      `[OpenAI] Normalizando ${medicationNames.length} medicamentos...`
    );
    const client = getClient();

    const result = await chatWithRetry(
      client,
      [
        {
          role: "system",
          content:
            "Eres un farmacéutico experto. Dado un arreglo de nombres de medicamentos (con posibles errores ortográficos o nombres comerciales), " +
            "devuelve un objeto JSON donde cada clave es el nombre original y el valor es el principio activo genérico en minúsculas. " +
            "Ejemplo: {\"tylenol 500mg\":\"paracetamol\",\"aspirjna\":\"ácido acetilsalicílico\"}. " +
            "Devuelve SOLO el JSON, sin markdown.",
        },
        {
          role: "user",
          content: JSON.stringify(medicationNames),
        },
      ],
      512
    );

    let jsonString = result;
    const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
      jsonString = match[1];
    } else {
      jsonString = jsonString.replace(/```/g, "").trim();
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("[OpenAI] Error normalizando medicamentos:", error);
    return {};
  }
}
