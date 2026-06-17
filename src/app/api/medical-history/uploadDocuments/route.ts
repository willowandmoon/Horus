import { NextResponse } from 'next/server';
import { saveMedicalDocument } from '@/src/application/historyMedical/saveMedicalDocument';
import { MedicalHistoryScraper } from '@/src/infrastructure/medical-history/scraper/scraper';

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

    // 1. Se ejecuta la lógica para guardar en Firebase y extraer texto.
    const updatedRecord = await saveMedicalDocument(fileBuffer, userId, { filename, mimeType });

    // 2. Se extrae el texto OCR de forma segura y tipada.
    const latestDocument = updatedRecord.documents[updatedRecord.documents.length - 1];
    const firebaseOcrText = latestDocument?.extractedText || '';

    if (firebaseOcrText && firebaseOcrText.trim() !== '') {
      console.log(`[API Bridge] Documento subido con éxito. Enviando texto OCR al Scraper para el usuario: ${userId}`);
      
      // 3. El pipeline del scraper se ejecuta de forma segura.
      try {
        const scraper = new MedicalHistoryScraper();
        await scraper.processFirebaseText(userId, firebaseOcrText);
      } catch (scraperError) {
        console.error('[API Bridge] Error en el scraper al procesar la información médica con IA:', scraperError);
        // No arrojamos el error para evitar que la subida del documento falle
      }
    } else {
      console.warn('[API Bridge] El documento se guardó pero no se detectó texto OCR para procesar.');
    }

    return NextResponse.json(updatedRecord, { status: 201 });
  } catch (error: Omit<Error, never> | unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
