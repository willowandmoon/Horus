// Unified medical records types for Firestore document `medical_records/{userId}`

export interface DocumentItem {
  fileUrl: string; // secure URL from Cloudinary
  publicId: string; // Cloudinary public_id
  extractedText: string; // extracted text for PDFs, empty string for images
  fileType: 'pdf' | 'image' | string;
  uploadedAt: Date;
}

export interface UserMedicalRecord {
  // Stored as document id = userId in collection `medical_records`
  documents: DocumentItem[];
  updatedAt: Date;
}

export type UserMedicalRecordCreate = Partial<UserMedicalRecord>;

