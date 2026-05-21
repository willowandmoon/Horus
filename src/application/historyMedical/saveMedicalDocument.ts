import { uploadMedicalDocument } from '@/src/infrastructure/cloudinary/cloudinary';
import { extractTextFromPDF } from '@/src/infrastructure/pdf/pdfExtractor';
import { extractTextFromImage } from '@/src/infrastructure/ocr/tesseractOcr';
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
    const isPdf = mime.includes('pdf') || resourceType === 'raw' || (options?.filename || '').toLowerCase().endsWith('.pdf');
    const isImage = mime.startsWith('image') || resourceType === 'image' || (options?.filename || '').toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);

    // Extraer texto: PDF -> pdf-parse, Imagen -> Tesseract OCR
    let extractedText = '';
    if (isPdf) {
      extractedText = await extractTextFromPDF(fileBuffer);
    } else if (isImage) {
      extractedText = await extractTextFromImage(fileBuffer);
    }

    // Post-procesamiento con Inteligencia Artificial
    let finalCleanText = await correctOcrTextWithGemini(extractedText);

    // Construir el documento para insertar en el registro del usuario
    const documentItem: DocumentItem = {
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      extractedText: finalCleanText,
      fileType: isPdf ? 'pdf' : 'image',
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
