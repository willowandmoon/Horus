import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

export async function getHistory() {
  const client = await clientPromise;
  const db = client.db("MedicalRecords");

  return db.collection("history_medical").find().toArray();
}

export async function createHistory(data: any) {
  const client = await clientPromise;
  const db = client.db("MedicalRecords");

  const result = await db.collection("history_medical").insertOne({
    userId: data.userId,
    type: data.type,
    description: data.description,
    diagnosis: data.diagnosis,
    treatment: data.treatment,
    doctor: data.doctor,
    documents: data.documents || [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

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