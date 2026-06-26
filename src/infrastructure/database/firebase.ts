import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let db: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    let credential;
    
    // 1. Try to load from Base64 env var
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8");
      credential = admin.credential.cert(JSON.parse(decoded));
    } 
    // 2. Try to load from stringified JSON env var
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
    } 
    // 3. Try to load from individual env vars
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });
    } 
    // 4. Fallback to local file (safely, without crashing Vercel if missing)
    else {
      const localPath = path.join(process.cwd(), "src", "config", "horus-64e3b-firebase-adminsdk-fbsvc-d821810d1c.json");
      if (fs.existsSync(localPath)) {
        const localCert = JSON.parse(fs.readFileSync(localPath, "utf8"));
        credential = admin.credential.cert(localCert);
      }
    }

    if (credential) {
      admin.initializeApp({ credential });
    } else {
      console.warn("No Firebase credentials provided. Attempting default initialization.");
      admin.initializeApp();
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
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

