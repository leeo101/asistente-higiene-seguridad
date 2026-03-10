import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

async function initialize() {
    let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
    const serviceAccount = JSON.parse(rawKey);
    if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    return { db: admin.firestore(), auth: admin.auth() };
}

async function run() {
    const { db, auth } = await initialize();
    const emails = process.argv.slice(2);

    if (emails.length === 0) {
        console.log("Usage: node scripts/activate-auth.js email1 email2 ...");
        return;
    }

    for (const email of emails) {
        try {
            console.log(`\nProcessing: ${email}`);
            const userRecord = await auth.getUserByEmail(email);
            const uid = userRecord.uid;
            console.log(`Found in Auth! UID: ${uid}`);

            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + 1);

            const subData = {
                status: 'active',
                expiry: String(expiry.getTime()),
                updatedAt: Date.now(),
                manualActivation: true
            };

            await db.collection('users').doc(uid).collection('data').doc('subscriptionData').set(subData, { merge: true });

            console.log(`SUCCESS: ${email} activated until ${expiry.toLocaleDateString()}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`NOT FOUND in Auth: ${email}`);
            } else {
                console.error(`Error processing ${email}:`, error.message);
            }
        }
    }
}

run().then(() => process.exit(0));
