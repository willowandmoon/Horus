import { NextResponse } from 'next/server';
import { saveMedicalDocument } from '@/src/application/historyMedical/saveMedicalDocument';
import { correctOcrText, structureMedicalText, normalizeMedicationNames } from '@/src/infrastructure/ai/openai';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const fileEntry = formData.get('file');
    const userIdRaw = formData.get('userId');

    const userId = typeof userIdRaw === 'string' ? userIdRaw.trim() : String(userIdRaw || '').trim();
    if (!fileEntry) {
      return NextResponse.json({ error: 'file is required (form-data key: file)' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'userId is required (form-data key: userId)' }, { status: 400 });
    }

    if (typeof fileEntry === 'string' || typeof fileEntry.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'file must be uploaded as form-data file' }, { status: 400 });
    }

    const file = fileEntry as File;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || undefined;
    const mimeType = file.type || undefined;

    // 1. Guardar en Firebase y extraer texto OCR.
    const updatedRecord = await saveMedicalDocument(fileBuffer, userId, { filename, mimeType });

    // 2. Extraer texto OCR del documento recién guardado.
    const latestDocument = updatedRecord.documents[updatedRecord.documents.length - 1];
    const firebaseOcrText = latestDocument?.extractedText || '';

    let structuredData = null;
    let normalizedMedications: Record<string, string> = {};

    if (firebaseOcrText && firebaseOcrText.trim() !== '') {
      console.log(`[API Bridge] Texto OCR extraído. Estructurando con IA para revisión del usuario: ${userId}`);
      try {
        // Estructurar con IA pero NO guardar en Postgres — el cliente revisará y confirmará.
        const cleanText = await correctOcrText(firebaseOcrText);
        structuredData = await structureMedicalText(cleanText);

        if (structuredData?.medications && structuredData.medications.length > 0) {
          const rawNames = structuredData.medications.map((m: any) => m.customMedicationName).filter(Boolean);
          if (rawNames.length > 0) {
            normalizedMedications = await normalizeMedicationNames(rawNames);
          }
        }
      } catch (aiError) {
        console.error('[API Bridge] Error al estructurar con IA:', aiError);
      }
    } else {
      console.warn('[API Bridge] El documento se guardó pero no se detectó texto OCR.');
    }

    return NextResponse.json({ ...updatedRecord, structuredData, normalizedMedications }, { status: 201 });
  } catch (error: Omit<Error, never> | unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
