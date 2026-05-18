import { db } from "./firebase";
import {
  HistoryMedical,
  HistoryMedicalCreate,
  HistoryMedicalUpdate,
} from "@../../../src/types/historyMedical";

const HISTORY_COLLECTION = "history_medical";

export const historyRepository = {
  async create(data: HistoryMedicalCreate): Promise<HistoryMedical> {
    try {
      const now = new Date();
      const docRef = await db.collection(HISTORY_COLLECTION).add({
        ...data,
        createdAt: now,
        updatedAt: now,
      });
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as HistoryMedical;
    } catch (error) {
      console.error("Error creating history medical:", error);
      throw new Error("Failed to create history medical");
    }
  },

  async findById(id: string): Promise<HistoryMedical | null> {
    try {
      const docRef = db.collection(HISTORY_COLLECTION).doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as HistoryMedical;
    } catch (error) {
      console.error(`Error finding history medical by id ${id}:`, error);
      throw new Error("Failed to find history medical");
    }
  },

  async findByUserId(userId: string): Promise<HistoryMedical[]> {
    try {
      const snapshot = await db
        .collection(HISTORY_COLLECTION)
        .where("userId", "==", userId)
        .get();
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as HistoryMedical)
      );
    } catch (error) {
      console.error(
        `Error finding history medical by user id ${userId}:`,
        error
      );
      throw new Error("Failed to find history medical by user");
    }
  },

  async update(
    id: string,
    data: HistoryMedicalUpdate
  ): Promise<HistoryMedical | null> {
    try {
      const docRef = db.collection(HISTORY_COLLECTION).doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return null;
      }
      const now = new Date();
      await docRef.update({
        ...data,
        updatedAt: now,
      });
      const updatedDoc = await docRef.get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as HistoryMedical;
    } catch (error) {
      console.error(`Error updating history medical ${id}:`, error);
      throw new Error("Failed to update history medical");
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const docRef = db.collection(HISTORY_COLLECTION).doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return false;
      }
      await docRef.delete();
      return true;
    } catch (error) {
      console.error(`Error deleting history medical ${id}:`, error);
      throw new Error("Failed to delete history medical");
    }
  },
};