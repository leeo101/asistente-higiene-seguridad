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
    const list = await db.collection('users').doc(uid).collection('data').get();
    console.log('List of documents:');
    list.forEach(doc => {
      console.log(`- ${doc.id}`);
      const data = doc.data();
      // Print fields (excluding large arrays or base64 strings)
      const summary = {};
      for (const k in data) {
        if (Array.isArray(data[k])) {
          summary[k] = `Array of length ${data[k].length}`;
        } else if (typeof data[k] === 'string' && data[k].startsWith('data:image')) {
          summary[k] = `Base64 Image (${data[k].length} chars)`;
        } else {
          summary[k] = data[k];
        }
      }
      console.log(JSON.stringify(summary, null, 2));
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
