import admin from "firebase-admin";
import serviceAccount from "@/src/config/horus-64e3b-firebase-adminsdk-fbsvc-06eb372da6.json";

let db: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK with cert:", error);
    try {
      admin.initializeApp();
    } catch (fallbackError) {
      console.error("Failed to fallback initialize Firebase Admin:", fallbackError);
    }
  }
}

try {
  db = admin.firestore();
} catch (error) {
  console.error("Failed to get Firestore instance, creating a dummy placeholder:", error);
  db = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false, data: () => null }),
        set: async () => {},
        update: async () => {},
      })
    }),
    runTransaction: async (cb: (transaction: unknown) => Promise<unknown>) => cb({
      get: async () => ({ exists: false, data: () => null }),
      set: async () => {},
      update: async () => {},
    })
  } as unknown as admin.firestore.Firestore;
}

export { db, admin };

