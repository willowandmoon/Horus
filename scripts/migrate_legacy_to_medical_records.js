#!/usr/bin/env node
/*
  Migration script: consolidate legacy Firestore collections into `medical_records`.

  Usage:
    node scripts/migrate_legacy_to_medical_records.js        # dry-run (migrates but keeps legacy docs)
    node scripts/migrate_legacy_to_medical_records.js --delete  # migrates and deletes legacy docs

  Requirements: the project service account is used from `src/config/horus-64e3b-firebase-adminsdk-fbsvc-06eb372da6.json`.
*/

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'src', 'config', 'horus-64e3b-firebase-adminsdk-fbsvc-06eb372da6.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function toDate(value) {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (value && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return new Date(value);
}

async function migrateHistoryMedical(deleteAfter = false) {
  const col = db.collection('history_medical');
  const snapshot = await col.get();
  console.log(`Found ${snapshot.size} legacy history_medical documents`);
  let migrated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const historyId = doc.id;
    const userId = data.userId;
    if (!userId) {
      console.warn('Skipping history without userId:', historyId);
      continue;
    }

    const now = new Date();

    const newHistory = {
      historyId,
      type: data.type || '',
      description: data.description || '',
      diagnosis: data.diagnosis || '',
      treatment: data.treatment || '',
      doctor: data.doctor || '',
      documents: Array.isArray(data.documents) ? data.documents : [],
      createdAt: data.createdAt ? toDate(data.createdAt) : now,
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : now,
    };

    const userRef = db.collection('medical_records').doc(userId);

    await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) {
        tx.set(userRef, { histories: [newHistory], updatedAt: now });
      } else {
        tx.update(userRef, {
          histories: admin.firestore.FieldValue.arrayUnion(newHistory),
          updatedAt: now,
        });
      }
    });

    migrated++;
    console.log(`Migrated history ${historyId} -> medical_records/${userId}`);

    if (deleteAfter) {
      await col.doc(doc.id).delete();
      console.log(`Deleted legacy history_medical/${doc.id}`);
    }
  }

  return migrated;
}

async function migrateMedicalDocuments(deleteAfter = false) {
  const col = db.collection('medical_documents');
  const snapshot = await col.get();
  console.log(`Found ${snapshot.size} legacy medical_documents documents`);
  let migrated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const userId = data.userId;
    if (!userId) {
      console.warn('Skipping medical_document without userId:', doc.id);
      continue;
    }

    const docItem = {
      pdfUrl: (data.document && (data.document.url || data.document.pdfUrl)) || data.url || '',
      publicId: (data.document && (data.document.publicId || data.document.public_id)) || data.publicId || '',
      extractedText: data.extractedText || '',
      uploadedAt: data.createdAt ? toDate(data.createdAt) : new Date(),
    };

    const targetHistoryId = data.historyId || null;
    const userRef = db.collection('medical_records').doc(userId);
    const now = new Date();

    await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) {
        // create a new history to hold this document
        const generatedHistoryId = db.collection('medical_records').doc().id;
        const newHistory = {
          historyId: generatedHistoryId,
          type: 'imported_documents',
          description: '',
          diagnosis: '',
          treatment: '',
          doctor: '',
          documents: [docItem],
          createdAt: now,
          updatedAt: now,
        };
        tx.set(userRef, { histories: [newHistory], updatedAt: now });
        return;
      }

      const payload = userDoc.data() || {};
      const histories = Array.isArray(payload.histories) ? payload.histories : [];

      if (targetHistoryId) {
        const idx = histories.findIndex((h) => h.historyId === targetHistoryId);
        if (idx !== -1) {
          histories[idx].documents = histories[idx].documents || [];
          histories[idx].documents.push(docItem);
          histories[idx].updatedAt = now;
          tx.update(userRef, { histories, updatedAt: now });
          return;
        }
      }

      // Otherwise create new history and add it
      const generatedHistoryId = db.collection('medical_records').doc().id;
      const newHistory = {
        historyId: generatedHistoryId,
        type: 'imported_documents',
        description: '',
        diagnosis: '',
        treatment: '',
        doctor: '',
        documents: [docItem],
        createdAt: now,
        updatedAt: now,
      };
      tx.update(userRef, { histories: admin.firestore.FieldValue.arrayUnion(newHistory), updatedAt: now });
    });

    migrated++;
    console.log(`Migrated medical_document ${doc.id} -> medical_records/${userId}`);

    if (deleteAfter) {
      await col.doc(doc.id).delete();
      console.log(`Deleted legacy medical_documents/${doc.id}`);
    }
  }

  return migrated;
}

async function main() {
  const args = process.argv.slice(2);
  const deleteAfter = args.includes('--delete');

  console.log('Migration started. deleteAfter=', deleteAfter);
  const hist = await migrateHistoryMedical(deleteAfter);
  const docs = await migrateMedicalDocuments(deleteAfter);
  console.log(`Migration complete. histories: ${hist}, documents: ${docs}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
