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

    // Cloudinary is the source of truth for file existence.
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
    const userId     = searchParams.get('userId');
    const publicId   = searchParams.get('publicId');
    const resourceType = (searchParams.get('resourceType') || 'raw') as 'raw' | 'image' | 'video';

    if (!userId || !publicId) {
      return NextResponse.json({ error: 'userId and publicId are required' }, { status: 400 });
    }

    // Try the known resource_type first, then fall back to the other two.
    // cloudinary.uploader.destroy() returns { result: 'ok' } on success,
    // { result: 'not found' } when the type is wrong — it does NOT throw.
    const typesToTry: Array<'raw' | 'image' | 'video'> = [
      resourceType,
      ...(['raw', 'image', 'video'] as const).filter(t => t !== resourceType),
    ];

    let deleted = false;
    for (const rt of typesToTry) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (cloudinary.uploader.destroy as any)(publicId, { resource_type: rt, invalidate: true });
      if (res?.result === 'ok') { deleted = true; break; }
    }

    if (!deleted) {
      console.warn(`[DELETE] Cloudinary file not found for publicId: ${publicId}`);
    }

    // Only mark Firebase when Cloudinary confirmed the deletion.
    // Firebase stores the transcription and is never used to decide file visibility —
    // Cloudinary search is the sole source of truth for what files exist.
    if (deleted) {
      try {
        await medicalRecordsRepository.markDocumentDeleted(userId, publicId);
      } catch {
        // best-effort — don't block the response
      }
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
