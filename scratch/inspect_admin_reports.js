import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const uid = 'xkBGza84M9VZYXkISqkq39fFWOU2';

async function run() {
  try {
    const collections = [
      'ats_history',
      'fireload_history',
      'risk_matrix_history',
      'reports_history',
      'checklists_history',
      'risk_map_history'
    ];

    for (const coll of collections) {
      const docRef = db.collection('users').doc(uid).collection('data').doc(coll);
      const snap = await docRef.get();
      if (snap.exists) {
        const data = snap.data();
        const items = data.items || [];
        console.log(`\n--- Collection: ${coll} (Items count: ${items.length}) ---`);
        if (items.length > 0) {
          // Print signature fields for the first 2 items
          items.slice(0, 2).forEach((item, idx) => {
            console.log(`\nItem ${idx + 1} ID: ${item.id}`);
            const sigFields = {};
            for (const k in item) {
              if (k.toLowerCase().includes('sig') || k.toLowerCase().includes('firma') || k.toLowerCase().includes('name') || k.toLowerCase().includes('nombre') || k.toLowerCase().includes('auditor') || k.toLowerCase().includes('expositor') || k.toLowerCase().includes('evaluador')) {
                let val = item[k];
                if (typeof val === 'string' && val.startsWith('data:image')) {
                  val = val.substring(0, 50) + '... (base64)';
                }
                sigFields[k] = val;
              }
            }
            console.log(JSON.stringify(sigFields, null, 2));
          });
        }
      } else {
        console.log(`Collection ${coll} does not exist`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
