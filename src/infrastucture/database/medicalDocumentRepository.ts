import { db } from './firebase';
import {
  MedicalDocument,
  MedicalDocumentCreate,
} from '@../../../src/types/historyMedical';

const MEDICAL_DOCUMENTS_COLLECTION = 'medical_documents';

export const medicalDocumentRepository = {
  async create(data: MedicalDocumentCreate): Promise<MedicalDocument> {
    try {
      const now = new Date();
      const docRef = await db.collection(MEDICAL_DOCUMENTS_COLLECTION).add({
        ...data,
        createdAt: now,
      });
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as MedicalDocument;
    } catch (error) {
      console.error('Error creating medical document:', error);
      throw new Error('Failed to create medical document');
    }
  },
};
