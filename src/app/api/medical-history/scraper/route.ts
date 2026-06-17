// src/app/api/medical-history/scrape/route.ts
import { NextResponse } from 'next/server';
import { MedicalHistoryScraper } from '@/src/infrastructure/medical-history/scraper/scraper';

// Instanciamos tu scraper listo para usar
const scraper = new MedicalHistoryScraper();

export async function POST(request: Request) {
  try {
    // 1. Parsear el cuerpo de la petición HTTP POST
    const body = await request.json();
    const { userId, firebaseOcrText } = body;

    // 2. Validaciones defensivas iniciales
    if (!userId) {
      return NextResponse.json({ error: 'El userId es requerido.' }, { status: 400 });
    }
    if (!firebaseOcrText || firebaseOcrText.trim() === '') {
      return NextResponse.json({ error: 'El texto de Firebase no puede estar vacío.' }, { status: 400 });
    }

    console.log(`[API] Petición de scraping recibida para el usuario: ${userId}`);
    
    // 3. Disparar tu pipeline mágico: Corrige con Gemini -> Estructura -> Guarda en Neon
    await scraper.processFirebaseText(userId, firebaseOcrText);

    // 4. Responder con éxito si todo salió bien
    return NextResponse.json({ 
      success: true, 
      message: 'Historial médico procesado y sincronizado en Neon con éxito.' 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('[API Error] Error crítico en el endpoint del scraper:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: 'Error interno del servidor al procesar el historial.',
      details: message 
    }, { status: 500 });
  }
}