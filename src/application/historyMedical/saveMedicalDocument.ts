import { saveMedicalDocument } from "@/src/infrastucture/database/historyRepository";

export interface SaveMedicalDocumentDTO {
  userId: string;
  url: string;
  publicId: string;
  extractedText: string;
}

export async function saveMedicalDocumentUseCase(data: SaveMedicalDocumentDTO) {
  return await saveMedicalDocument(data);
}``