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

    // 1. Upload to Cloudinary + save OCR text to Firebase
    const updatedRecord = await saveMedicalDocument(fileBuffer, userId, { filename, mimeType });

    // 2. Extract OCR text from the saved document
    const latestDocument = updatedRecord.documents[updatedRecord.documents.length - 1];
    const ocrText = latestDocument?.extractedText || '';

    let structuredData = null;
    let normalizedMedications: Record<string, string> = {};

    if (ocrText.trim() !== '') {
      console.log(`[API] Extrayendo datos estructurados para revisión del usuario: ${userId}`);
      try {
        const scraper = new MedicalHistoryScraper();
        const result = await scraper.extractStructuredData(ocrText);
        structuredData = result.structuredData;
        normalizedMedications = result.normalizedMedications;
      } catch (scraperError) {
        console.error('[API] Error extrayendo datos con IA:', scraperError);
        // Non-fatal — return the upload result without structured data
      }
    } else {
      console.warn('[API] Documento guardado sin texto OCR detectable.');
    }

    // 3. Return file record + AI-extracted data for user review (NOT saved to PostgreSQL yet)
    return NextResponse.json(
      { ...updatedRecord, structuredData, normalizedMedications },
      { status: 201 },
    );
  } catch (error: Omit<Error, never> | unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
