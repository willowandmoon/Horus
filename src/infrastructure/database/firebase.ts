import admin from "firebase-admin";
import serviceAccount from "@/src/config/horus-64e3b-firebase-adminsdk-fbsvc-06eb372da6.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

export { db, admin };
