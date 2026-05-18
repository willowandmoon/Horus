import { medicalDocumentRepository } from '@/src/infrastucture/database/medicalDocumentRepository';
import { uploadToCloudinary } from '@/src/infrastucture/database/cloudinary';
import { extractTextFromPDF } from '@/src/infrastucture/pdf/pdfExtractor';
import {
  MedicalDocument,
  MedicalDocumentCreate,
} from '@/src/types/historyMedical';

export async function saveMedicalDocument(
  fileBuffer: Buffer,
  userId: string
): Promise<MedicalDocument> {
  try {
    // Subir a Cloudinary
    const uploadResult = await uploadToCloudinary(fileBuffer);
    if (!uploadResult) {
      throw new Error('Failed to upload document to Cloudinary');
    }

    // Extraer texto del PDF
    const extractedText = await extractTextFromPDF(fileBuffer);

    // Guardar en Firestore
    const documentData: MedicalDocumentCreate = {
      userId,
      document: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
      extractedText,
    };

    const newDocument = await medicalDocumentRepository.create(documentData);
    return newDocument;
  } catch (error) {
    console.error('Error in saveMedicalDocument use case:', error);
    throw new Error('Failed to save medical document');
  }
}