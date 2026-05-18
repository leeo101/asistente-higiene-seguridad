import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
// Fix the private key newlines
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function run() {
  try {
    const userRecord = await auth.getUserByEmail('enzorodriguez31@gmail.com');
    console.log('User UID:', userRecord.uid);

    // Fetch user documents under users/{uid}/data
    const collections = [
      'personalData',
      'signatureStampData',
      'companyLogo',
      'showCompanyLogo'
    ];

    for (const coll of collections) {
      const docRef = db.collection('users').doc(userRecord.uid).collection('data').doc(coll);
      const snap = await docRef.get();
      if (snap.exists) {
        console.log(`\n--- Document: ${coll} ---`);
        const data = snap.data();
        // truncate base64 string if too long for cleaner logs
        const cleanData = { ...data };
        for (const k in cleanData) {
          if (typeof cleanData[k] === 'string' && cleanData[k].startsWith('data:image')) {
            cleanData[k] = cleanData[k].substring(0, 50) + '... (truncated base64)';
          }
        }
        console.log(JSON.stringify(cleanData, null, 2));
      } else {
        console.log(`Document ${coll} does not exist`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
