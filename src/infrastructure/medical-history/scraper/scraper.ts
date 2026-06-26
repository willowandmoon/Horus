// 1. Tus imports actuales
import { PrismaClient } from '@/src/generated/client';
import { correctOcrText, structureMedicalText, normalizeMedicationNames, StructuredMedicalData as StructuredMedicalText } from '@/src/infrastructure/ai/openai';

// 2. IMPORTANTE: Necesitamos el driver de PostgreSQL/Neon que configuró tu equipo
import { Pool } from 'pg'; 
import { PrismaPg } from '@prisma/adapter-pg';

// 3. Inicializamos el pool de conexión usando tu variable de entorno
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 4. Instanciamos Prisma PASÁNDOLE el argumento que TypeScript te exige (1 argument)
const prisma = new PrismaClient({ adapter });

export class MedicalHistoryScraper {
  
  /**
   * Pipeline: Corrige el texto de Firebase ➔ Lo estructura con IA ➔ Lo guarda en Postgres
   */
  async processFirebaseText(userId: string, firebaseOcrText: string): Promise<void> {
    try {
      console.log(`[Scraper] Iniciando pipeline para el usuario: ${userId}`);

      // Sub-paso A: Corregir errores ortográficos del OCR usando la función existente
      const cleanText = await correctOcrText(firebaseOcrText);

      // Sub-paso B: Enviar el texto limpio a la nueva función para obtener el JSON estructurado
      const structuredJson = await structureMedicalText(cleanText);
      
      // Sub-paso C: Normalizar nombres de medicamentos extraídos
      let normalizedMedications: Record<string, string> = {};
      if (structuredJson.medications && structuredJson.medications.length > 0) {
        const rawNames = structuredJson.medications.map((m) => m.customMedicationName).filter(Boolean) as string[];
        if (rawNames.length > 0) {
          normalizedMedications = await normalizeMedicationNames(rawNames);
        }
      }

      // Sub-paso D: Guardar de forma transaccional en PostgreSQL con Prisma
      await this.saveToPostgres(userId, structuredJson, normalizedMedications);

      console.log(`[Scraper] Todo el historial clínico se ha sincronizado correctamente.`);
    } catch (error) {
      console.error(`[Scraper Error] Error en el pipeline del usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Guarda datos estructurados ya revisados por el usuario (llamado desde confirmExtraction).
   */
  async saveStructuredData(userId: string, data: StructuredMedicalText, normalizedMedications: Record<string, string>): Promise<void> {
    return this.saveToPostgres(userId, data, normalizedMedications);
  }

  /**
   * Guarda el JSON estructurado respetando las relaciones del esquema de Prisma
   */
  private async saveToPostgres(userId: string, data: StructuredMedicalText, normalizedMedications: Record<string, string>): Promise<void> {
    const nowColombia = new Date(Date.now() - 5 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      
      // 1. Información Personal (Relación 1:1)
      if (data.personalInfo && (data.personalInfo.bloodType || data.personalInfo.gender)) {
        await tx.personalInformation.upsert({
          where: { userId: userId },
          update: {
            bloodType: data.personalInfo.bloodType || undefined,
            gender: data.personalInfo.gender || undefined,
            updatedAt: nowColombia,
          },
          create: {
            userId: userId,
            firstName: "Completar", 
            lastName: "Completar",  
            bloodType: data.personalInfo.bloodType || null,
            gender: data.personalInfo.gender || null,
            createdAt: nowColombia,
            updatedAt: nowColombia,
          }
        });
      }

      // 2. Alergias (Relación 1:N)
      if (data.explicitNoAllergies === true) {
        await tx.allergy.updateMany({
          where: { userId: userId, isActive: true },
          data: { isActive: false, updatedAt: nowColombia }
        });
      }

      if (data.allergies && data.allergies.length > 0) {
        const existingAllergies = await tx.allergy.findMany({
          where: { userId: userId }
        });
        const existingAllergenNames = new Set(
          existingAllergies.map(a => a.allergenName.toLowerCase().trim())
        );

        const seenAllergenNamesInBatch = new Set();
        const allergiesToInsert = [];

        for (const a of data.allergies) {
          if (!a.allergenName) continue;
          
          // Separar por comas y limpiar los espacios
          const splitNames = String(a.allergenName).split(',').map((name: string) => name.trim()).filter(Boolean);
          
          for (const name of splitNames) {
            const nameLower = name.toLowerCase().trim();
            if (!existingAllergenNames.has(nameLower) && !seenAllergenNamesInBatch.has(nameLower)) {
              seenAllergenNamesInBatch.add(nameLower);
              allergiesToInsert.push({
                userId: userId,
                allergenName: name,
                allergyType: a.allergyType || "OTHER" as any,
                severity: a.severity || "MILD" as any,
                reactionDescription: a.reactionDescription || null,
                createdAt: nowColombia,
                updatedAt: nowColombia,
              });
            }
          }
        }

        if (allergiesToInsert.length > 0) {
          await tx.allergy.createMany({ data: allergiesToInsert });
        }
      }

      // 3. Condiciones Crónicas (Relación 1:N)
      if (data.chronicConditions && data.chronicConditions.length > 0) {
        const existingConditions = await tx.chronicCondition.findMany({
          where: { userId: userId }
        });
        const existingConditionNames = new Set(
          existingConditions.map(c => c.conditionName.toLowerCase().trim())
        );

        const seenConditionNamesInBatch = new Set();
        const conditionsToInsert = [];

        for (const c of data.chronicConditions) {
          if (!c.conditionName) continue;

          const nameLower = c.conditionName.toLowerCase().trim();
          if (!existingConditionNames.has(nameLower) && !seenConditionNamesInBatch.has(nameLower)) {
            seenConditionNamesInBatch.add(nameLower);
            conditionsToInsert.push({
              userId: userId,
              conditionName: c.conditionName,
              severity: c.severity || null,
              status: c.status || 'ACTIVE',
              notes: c.notes || null,
              createdAt: nowColombia,
              updatedAt: nowColombia,
            });
          }
        }

        if (conditionsToInsert.length > 0) {
          await tx.chronicCondition.createMany({ data: conditionsToInsert });
        }
      }

      // 4. Medicamentos (Relación 1:N y Catálogo)
      if (data.explicitNoMedications === true) {
        await tx.userMedication.updateMany({
          where: { userId: userId, isCurrent: true },
          data: { isCurrent: false, updatedAt: nowColombia }
        });
      }

      if (data.medications && data.medications.length > 0) {
        const existingMedications = await tx.userMedication.findMany({
          where: { userId: userId }
        });
        const existingMedNames = new Set(
          existingMedications.map(m => (m.customMedicationName || '').toLowerCase().trim())
        );

        const seenMedNamesInBatch = new Set();

        for (const m of data.medications) {
          if (!m.customMedicationName) continue;

          const rawName = m.customMedicationName;
          const rawNameLower = rawName.toLowerCase().trim();
          if (existingMedNames.has(rawNameLower) || seenMedNamesInBatch.has(rawNameLower)) {
            // Ya tiene registrado este medicamento, evitamos duplicarlo
            continue;
          }
          seenMedNamesInBatch.add(rawNameLower);

          const genericName = normalizedMedications[rawName] || rawName.toLowerCase();

          // Asegurar que el medicamento base existe en el catálogo
          const catalogEntry = await tx.medicationCatalog.upsert({
            where: { genericName: genericName },
            update: {}, // No hacer nada si ya existe
            create: { 
              genericName: genericName,
              createdAt: nowColombia 
            }
          });

          // Crear la relación en user_medications conectando al catálogo
          await tx.userMedication.create({
            data: {
              userId: userId,
              medicationId: catalogEntry.id,
              customMedicationName: rawName,
              dosage: m.dosage || null,
              frequency: m.frequency || null,
              route: m.route || 'ORAL',
              purpose: m.purpose || null,
              isCurrent: true,
              createdAt: nowColombia,
              updatedAt: nowColombia,
            }
          });
        }
      }

      // 5. Historial de Eventos (Relación 1:N)
      if (data.medicalHistory && data.medicalHistory.length > 0) {
        const existingHistory = await tx.medicalHistory.findMany({
          where: { userId: userId }
        });
        const existingHistoryKeys = new Set(
          existingHistory.map(h => `${h.eventType}_${h.eventName.toLowerCase().trim()}`)
        );

        const seenHistoryKeysInBatch = new Set();
        const historyToInsert = [];

        for (const h of data.medicalHistory) {
          if (!h.eventName) continue;

          const key = `${h.eventType}_${h.eventName.toLowerCase().trim()}`;
          if (!existingHistoryKeys.has(key) && !seenHistoryKeysInBatch.has(key)) {
            seenHistoryKeysInBatch.add(key);
            historyToInsert.push({
              userId: userId,
              eventType: h.eventType || "OTHER" as any,
              eventName: h.eventName,
              location: h.location || null,
              outcome: h.outcome || null,
              createdAt: nowColombia,
              updatedAt: nowColombia,
            });
          }
        }

        if (historyToInsert.length > 0) {
          await tx.medicalHistory.createMany({ data: historyToInsert });
        }
      }
    }, {
      maxWait: 15000, // 15 seconds para conectar (Neon cold starts)
      timeout: 30000, // 30 seconds para completar la transacción
    });
  }
}