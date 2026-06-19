import { NextResponse } from 'next/server';
import { medicalRecordsRepository } from '@/src/infrastructure/database/medicalRecordsRepository';
import cloudinary from '@/src/infrastructure/cloudinary/cloudinary';

export async function POST() {
  return NextResponse.json({ error: 'Creating histories is removed. Use /api/historyMedical/uploadDocuments to upload files.' }, { status: 405 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveFileType(r: any): string {
  const fmt = (r.format || '').toLowerCase();
  if (fmt === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'heic'].includes(fmt)) return 'image';
  if (['doc', 'docx'].includes(fmt)) return 'word';
  if (fmt === 'json') return 'json';
  if (['txt', 'csv', 'md'].includes(fmt)) return 'text';
  if (r.resource_type === 'image') return 'image';
  return fmt || 'other';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId query param is required' }, { status: 400 });
    }

    // Cloudinary is the source of truth — no Firebase involved here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (cloudinary.search as any)
      .expression(`folder:medical-records/${userId}`)
      .sort_by('created_at', 'desc')
      .max_results(200)
      .execute();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs = (result.resources || []).map((r: any) => ({
      publicId: r.public_id,
      fileUrl: r.secure_url,
      resourceType: r.resource_type,
      format: r.format || 'file',
      fileType: resolveFileType(r),
      uploadedAt: r.created_at,
      filename: (r.public_id.split('/').pop() || '').replace(/_\d{13}$/, ''),
      extractedText: '',
    }));

    return NextResponse.json(docs);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const publicId = searchParams.get('publicId');
    if (!userId || !publicId) {
      return NextResponse.json({ error: 'userId and publicId are required' }, { status: 400 });
    }

    // Delete from Cloudinary first, then mark as deleted in Firebase for traceability
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', invalidate: true });
    } catch {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
      } catch {
        // File may already be gone from Cloudinary — still proceed to mark in Firebase
      }
    }

    await medicalRecordsRepository.markDocumentDeleted(userId, publicId);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
