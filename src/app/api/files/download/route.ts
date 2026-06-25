import { NextResponse } from 'next/server';
import cloudinary from '@/src/infrastructure/cloudinary/cloudinary';

const MIME: Record<string, string> = {
  pdf:  'application/pdf',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  webp: 'image/webp',
  csv:  'text/csv',
  json: 'application/json',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt:  'text/plain',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const b64 = searchParams.get('id');
    if (!b64) return NextResponse.json({ error: 'id param required' }, { status: 400 });

    const publicId = Buffer.from(b64, 'base64').toString('utf-8');

    // Find the resource across all types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resource: any;
    let foundRt: 'raw' | 'image' | 'video' | undefined;

    for (const rt of ['raw', 'image', 'video'] as const) {
      try {
        resource = await cloudinary.api.resource(publicId, { resource_type: rt });
        foundRt = rt;
        break;
      } catch {
        // try next resource type
      }
    }

    if (!resource || !foundRt) {
      return NextResponse.json({ error: 'Archivo no encontrado en Cloudinary' }, { status: 404 });
    }

    const fileFormat: string = resource.format || 'bin';
    const filename = (publicId.split('/').pop() || 'archivo').replace(/_\d{13}$/, '');

    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const privateUrl: string = (cloudinary.utils as any).private_download_url(
      publicId,
      fileFormat,
      { resource_type: foundRt, type: 'upload', expires_at: expiresAt, attachment: true },
    );

    const cloudRes = await fetch(privateUrl);
    if (!cloudRes.ok) {
      return NextResponse.json({ error: `Cloudinary devolvió ${cloudRes.status}` }, { status: 502 });
    }

    const buffer = Buffer.from(await cloudRes.arrayBuffer());
    const mimeType = MIME[fileFormat] ?? cloudRes.headers.get('content-type') ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename + '.' + fileFormat)}`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
