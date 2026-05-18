import admin from "firebase-admin";
import serviceAccount from "../../../horus-64e3b-firebase-adminsdk-fbsvc-4616637f8a.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

const db = admin.firestore();

export { db };