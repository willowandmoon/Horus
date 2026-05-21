import { NextResponse } from 'next/server';
import { saveMedicalDocument } from '@/src/application/historyMedical/saveMedicalDocument';

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

    // Ensure the file is a File/Blob-like object with arrayBuffer
    if (typeof fileEntry === 'string' || typeof fileEntry.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'file must be uploaded as form-data file' }, { status: 400 });
    }

    const file = fileEntry as File;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || undefined;
    const mimeType = file.type || undefined;

    const updatedRecord = await saveMedicalDocument(fileBuffer, userId, { filename, mimeType });

    return NextResponse.json(updatedRecord, { status: 201 });
  } catch (error: Omit<Error, never> | unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
