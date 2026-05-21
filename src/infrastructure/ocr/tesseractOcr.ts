import Tesseract from 'tesseract.js';
import sharp from 'sharp';

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  // --- PIPELINE DE PREPROCESAMIENTO CON SHARP ---
  const processedBuffer = await sharp(buffer)
    // 1. Escala de grises: Elimina ruido de colores e información innecesaria de fondo
    .grayscale()
    // 2. Normalización: Maximiza el contraste estirando los valores para abarcar todo el espectro (blanco más blanco, negro más negro)
    .normalize()
    // 3. Redimensionado (upscaling): Agranda la imagen si es pequeña (ayuda enormemente al OCR a detectar bordes)
    .resize({ width: 2500, withoutEnlargement: true })
    // 4. Threshold (Umbralizado): Convierte todo a blanco o negro puro basado en un umbral dinámico (128)
    .threshold(128)
    // 5. Reducción de ruido: Aplica un difuminado ligero por mediana para eliminar puntitos sueltos (sal y pimienta)
    .median(1)
    .toFormat('png')
    .toBuffer();

  // --- CONFIGURACIÓN OPTIMIZADA DE TESSERACT ---
  // Inicializamos eng+spa de forma nativa para documentos médicos/generales.
  const worker = await Tesseract.createWorker("eng+spa"); 
  
  try {
    // Parámetros de precisión para Tesseract (PSM = Page Segmentation Mode)
    // PSM.AUTO es muy superior para leer todo un documento en bloque o capturas
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: '1' // Conservar espacios mejora formato en json
    });

    const { data: { text } } = await worker.recognize(processedBuffer);
    return text.trim();
  } catch (error: Omit<Error, never> | unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('OCR failed:', errorMessage);
    throw new Error(`OCR failed: ${errorMessage}`);
  } finally {
    // Es crítico siempre terminar el worker para evitar fugas de memoria
    await worker.terminate();
  }
}

export default extractTextFromImage;
