import { NextResponse } from 'next/server';
import { MedicalHistoryScraper } from '@/src/infrastructure/medical-history/scraper/scraper';
import type { StructuredMedicalData } from '@/src/infrastructure/ai/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, structuredData, normalizedMedications } = body as {
      userId: string;
      structuredData: StructuredMedicalData;
      normalizedMedications?: Record<string, string>;
    };

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }
    if (!structuredData) {
      return NextResponse.json({ error: 'structuredData es requerido' }, { status: 400 });
    }

    const scraper = new MedicalHistoryScraper();
    await scraper.saveStructuredData(userId, structuredData, normalizedMedications ?? {});

    return NextResponse.json({ ok: true });
  } catch (error: Omit<Error, never> | unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[confirmExtraction] Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
