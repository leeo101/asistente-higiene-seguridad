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

async function searchDeep(db, emails) {
    const usersSnapshot = await db.collection('users').get();

    for (const email of emails) {
        let found = false;
        console.log(`\nSearching for: ${email}`);

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;

            // Try common subcollections / documents
            const subDocs = ['personalData', 'info', 'subscriptionData'];

            for (const docName of subDocs) {
                const doc = await db.collection('users').doc(userId).collection('data').doc(docName).get();
                if (doc.exists) {
                    const data = doc.data();
                    const foundEmail = (data.email || data.info?.email || data.personalData?.email)?.toLowerCase();

                    if (foundEmail === email.toLowerCase()) {
                        console.log(`MATCH! Found in user ${userId}, doc ${docName}`);

                        const expiry = new Date();
                        expiry.setMonth(expiry.getMonth() + 1);

                        await db.collection('users').doc(userId).collection('data').doc('subscriptionData').set({
                            status: 'active',
                            expiry: String(expiry.getTime()),
                            updatedAt: Date.now(),
                            manualActivation: true
                        }, { merge: true });

                        console.log(`SUCCESS: ${email} activated.`);
                        found = true;
                        break;
                    }
                }
            }
            if (found) break;
        }
        if (!found) console.log(`NOT FOUND: ${email}`);
    }
}

const db = await initialize();
const targetEmails = process.argv.slice(2);
await searchDeep(db, targetEmails);
process.exit(0);
