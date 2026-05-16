import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

export async function getHistory(userId: string) {
  const client = await clientPromise;
  const db = client.db("MedicalRecords");
  // Devuelve el documento del usuario con todos sus historiales
  return db.collection("history_medical").findOne({ userId });
}

export async function createHistory(data: any) {
  const client = await clientPromise;
  const db = client.db("MedicalRecords");
  // Inserta un historial en el array histories del usuario, crea el documento si no existe
  const result = await db.collection<MedicalHistoryModel>("history_medical").updateOne(
    { userId: data.userId },
    {
      $push: {
        histories: {
          type: data.type,
          description: data.description,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          doctor: data.doctor,
          documents: data.documents || [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      $setOnInsert: {
        userId: data.userId
      }
    },
    { upsert: true }
  );
  return result;
}

export async function updateHistory(id: string, data: any) {
  const client = await clientPromise;
  const db = client.db("MedicalRecords");

  const result = await db.collection("history_medical").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...data,
        updatedAt: new Date()
      }
    }
  );

  return result;
}

export async function deleteHistory(id: string) {
  const client = await clientPromise;
  const db = client.db("MedicalRecords");

  const result = await db.collection("history_medical").deleteOne({
    _id: new ObjectId(id)
  });

  return result;
}

export interface MedicalHistoryModel extends Document {
  userId: string;
  histories?: {
    type?: string;
    description?: string;
    diagnosis?: string;
    treatment?: string;
    doctor?: string;
    documents?: {
      url: string;
      publicId: string;
      extractedText: string;
      uploadedAt: Date;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
  }[];
  // Para compatibilidad con saveMedicalDocument
  documents?: {
    url: string;
    publicId: string;
    extractedText: string;
    uploadedAt: Date;
  }[];
  createdAt?: Date;
  type?: string;
  description?: string;
}

export interface SaveMedicalDocumentDTO {
  userId: string;
  url: string;
  publicId: string;
  extractedText: string;
}

export async function saveMedicalDocument(data: SaveMedicalDocumentDTO) {
  const client = await clientPromise;
  const db = client.db("MedicalRecords");

  // Actualiza el registro del usuario (o lo crea si no existe) insertando el documento en su arreglo
  const result = await db.collection<MedicalHistoryModel>("history_medical").updateOne(
    { userId: data.userId },
    {
      $push: {
        documents: {
          url: data.url,
          publicId: data.publicId,
          extractedText: data.extractedText,
          uploadedAt: new Date()
        }
      },
      $setOnInsert: {
        createdAt: new Date(),
        type: "Document Upload",
        description: "User document repository"
      }
    },
    { upsert: true }
  );

  return result;
}