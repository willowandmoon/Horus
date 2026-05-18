export interface HistoryMedical {
  id: string;
  userId: string;
  type: string;
  description: string;
  diagnosis: string;
  treatment: string;
  doctor: string;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type HistoryMedicalCreate = Omit<
  HistoryMedical,
  'id' | 'createdAt' | 'updatedAt'
>;
export type HistoryMedicalUpdate = Partial<HistoryMedicalCreate>;

export interface MedicalDocument {
  id: string;
  userId: string;
  document: {
    url: string;
    publicId: string;
  };
  extractedText: string;
  createdAt: Date;
}

export type MedicalDocumentCreate = Omit<MedicalDocument, 'id' | 'createdAt'>;
