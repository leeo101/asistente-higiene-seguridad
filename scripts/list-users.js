import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

async function initialize() {
    let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
    const serviceAccount = JSON.parse(rawKey);
    if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return admin.firestore();
}

async function deepScan(db, colRef, depth = 0) {
    if (depth > 2) return;
    const collections = colRef ? await colRef.listCollections() : await db.listCollections();

    for (const col of collections) {
        console.log(`${'  '.repeat(depth)}Collection: ${col.id}`);
        const snapshot = await col.limit(5).get();
        for (const doc of snapshot.docs) {
            console.log(`${'  '.repeat(depth + 1)}Doc: ${doc.id}`);
            const subCols = await doc.ref.listCollections();
            if (subCols.length > 0) {
                await deepScan(db, doc.ref, depth + 1);
            }
        }
    }
}

const db = await initialize();
await deepScan(db);
process.exit(0);
