import { NextResponse } from 'next/server';
import { medicalRecordsRepository } from '@/src/infrastructure/database/medicalRecordsRepository';

export async function POST() {
  return NextResponse.json({ error: 'Creating histories is removed. Use /api/historyMedical/uploadDocuments to upload files.' }, { status: 405 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId query param is required' }, { status: 400 });
    }
    const docs = await medicalRecordsRepository.getDocumentsByUserId(userId);
    return NextResponse.json(docs);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
