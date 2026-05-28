import { uploadMedicalDocument } from '@/src/infrastructure/cloudinary/cloudinary';
import { extractTextFromPDF } from '@/src/infrastructure/pdf/pdfExtractor';
import { extractTextFromImage } from '@/src/infrastructure/ocr/tesseractOcr';
import { extractTextFromWord } from '@/src/infrastructure/word/wordExtractor';
import { correctOcrTextWithGemini } from '@/src/infrastructure/ai/gemini';
import { medicalRecordsRepository } from '@/src/infrastructure/database/medicalRecordsRepository';
import { DocumentItem, UserMedicalRecord } from '@/src/types/historyMedical';

export async function saveMedicalDocument(
  fileBuffer: Buffer,
  userId: string,
  options?: { filename?: string; mimeType?: string }
): Promise<UserMedicalRecord> {
  try {
    console.log(`\n[saveMedicalDocument] Iniciando caso de uso para userId: ${userId}\n`);
    
    // Subir a Cloudinary dentro de la carpeta del usuario
    const uploadResult = await uploadMedicalDocument(fileBuffer, userId, options?.filename);
    if (!uploadResult) {
      throw new Error('Failed to upload document to Cloudinary: no result returned.');
    }

    // Determinar tipo de archivo: preferir mimeType, fallback a Cloudinary resource_type
    const mime = (options?.mimeType || '').toLowerCase();
    const resourceType = (uploadResult && (uploadResult.resource_type || '')).toLowerCase();
    const filenameLow = (options?.filename || '').toLowerCase();
    
    // Mejorar la aserción de PDF vs WORD priorizando la extensión del archivo, 
    // usualmente el mime type en formData puede decir `application/octet-stream`
    const isWord = mime.includes('word') || mime.includes('msword') || filenameLow.match(/\.(docx|doc)$/);
    const isImage = mime.startsWith('image') || resourceType === 'image' || filenameLow.match(/\.(jpg|jpeg|png|webp)$/);
    const isPdf = !isWord && !isImage && (mime.includes('pdf') || filenameLow.endsWith('.pdf'));
    const isJson = mime.includes('json') || filenameLow.endsWith('.json');
    const isText = mime.includes('text') || filenameLow.match(/\.(txt|csv|md)$/);

    // Extraer texto dependiendo del tipo de archivo
    let extractedText = '';
    let fileType = 'unknown';

    if (isPdf) {
      extractedText = await extractTextFromPDF(fileBuffer);
      fileType = 'pdf';
    } else if (isImage) {
      extractedText = await extractTextFromImage(fileBuffer);
      fileType = 'image';
    } else if (isWord) {
      extractedText = await extractTextFromWord(fileBuffer);
      fileType = 'word';
    } else if (isJson || isText) {
      extractedText = fileBuffer.toString('utf-8');
      fileType = isJson ? 'json' : 'text';
    } else {
      // Para cualquier otro archivo (Excel, Powerpoint, videos, etc.)
      // No extraemos texto ni forzamos utf-8 para no mandar datos ilegibles a la IA.
      extractedText = '';
      
      const match = filenameLow.match(/\.([a-z0-9]+)$/);
      fileType = match ? match[1] : 'other';
    }

    // Post-procesamiento con Inteligencia Artificial
    let finalCleanText = extractedText;
    if (extractedText.trim().length > 0) {
      finalCleanText = await correctOcrTextWithGemini(extractedText);
    }

    // Construir el documento para insertar en el registro del usuario
    const documentItem: DocumentItem = {
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      extractedText: finalCleanText,
      fileType: fileType,
      uploadedAt: new Date(),
    };

    // Agregar el documento al arreglo `documents[]` del usuario (crea el documento si no existe)
    const updatedRecord = await medicalRecordsRepository.addDocumentToUser(userId, documentItem);

    if (!updatedRecord) {
      throw new Error('Failed to attach document to user record');
    }

    return updatedRecord as UserMedicalRecord;
  } catch (error) {
    console.error('Error in saveMedicalDocument use case:', error);
    throw error;
  }
}
