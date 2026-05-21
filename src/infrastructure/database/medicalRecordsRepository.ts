import { db, admin } from './firebase';
import { DocumentItem, UserMedicalRecord } from '@/src/types/historyMedical';

const MEDICAL_RECORDS_COLLECTION = 'medical_records';

export const medicalRecordsRepository = {
  async ensureUserRecord(userId: string) {
    const userRef = db.collection(MEDICAL_RECORDS_COLLECTION).doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      await userRef.set({ documents: [], updatedAt: new Date() });
    }
  },

  async getUserRecord(userId: string): Promise<UserMedicalRecord | null> {
    try {
      const docRef = db.collection(MEDICAL_RECORDS_COLLECTION).doc(userId);
      const doc = await docRef.get();
      if (!doc.exists) return null;
      
      const payload = doc.data() as { documents?: DocumentItem[], updatedAt?: Date | { toDate: () => Date } } | undefined;
      const data = payload || {};
      
      return {
        documents: data.documents || [],
        updatedAt: data.updatedAt ? ('toDate' in data.updatedAt ? data.updatedAt.toDate() : data.updatedAt) : new Date(),
      };
    } catch (error) {
      console.error(`Error getting medical record for user ${userId}:`, error);
      throw new Error('Failed to get medical record');
    }
  },

  async getDocumentsByUserId(userId: string): Promise<DocumentItem[]> {
    const record = await this.getUserRecord(userId);
    if (!record) return [];
    return record.documents || [];
  },

  async addDocumentToUser(userId: string, document: DocumentItem) {
    const userRef = db.collection(MEDICAL_RECORDS_COLLECTION).doc(userId);
    try {
      const result = await db.runTransaction(async (tx) => {
        const userDoc = await tx.get(userRef);
        const now = new Date();

        // If user document does not exist, create it automatically
        if (!userDoc.exists) {
          tx.set(userRef, { documents: [ { ...document, uploadedAt: document.uploadedAt || now } ], updatedAt: now });
          return { documents: [ { ...document, uploadedAt: document.uploadedAt || now } ], updatedAt: now } as UserMedicalRecord;
        }

        const payload = userDoc.data() as { documents?: DocumentItem[] } | undefined;
        const documents = payload?.documents || [];
        const docItem = { ...document, uploadedAt: document.uploadedAt || now };
        documents.push(docItem);

        tx.update(userRef, { documents, updatedAt: now });
        return { documents, updatedAt: now } as UserMedicalRecord;
      });
      return result;
    } catch (error) {
      console.error(`Error adding document for user ${userId}:`, error);
      throw new Error('Failed to add document to user record');
    }
  },
};

export default medicalRecordsRepository;
