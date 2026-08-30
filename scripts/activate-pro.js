import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

async function initialize() {
    let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
    const serviceAccount = JSON.parse(rawKey);
    if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return { db: admin.firestore(), auth: admin.auth() };
}

async function activate(emails) {
    const { db, auth } = await initialize();

    for (const email of emails) {
        console.log(`\nActivating PRO for: ${email}`);
        try {
            const user = await auth.getUserByEmail(email);
            const uid = user.uid;
            console.log(`User found: UID = ${uid}`);

            // 1. Set Custom Claims
            await auth.setCustomUserClaims(uid, { isPro: true });
            console.log(`Custom claim { isPro: true } set.`);

            // 2. Set Firestore subscriptionData
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + 1);

            await db.collection('users').doc(uid).collection('data').doc('subscriptionData').set({
                status: 'active',
                expiry: String(expiry.getTime()),
                updatedAt: Date.now(),
                provider: 'manual_activation',
                manualActivation: true
            }, { merge: true });

            console.log(`SUCCESS: ${email} is now PRO until ${expiry.toLocaleDateString()}`);
        } catch (error) {
            console.error(`Error activating ${email}:`, error.message);
        }
    }
}

const targetEmails = process.argv.slice(2);
if (targetEmails.length === 0) {
    console.log("Usage: node scripts/activate-pro.js email@example.com");
    process.exit(1);
}
await activate(targetEmails);
process.exit(0);

