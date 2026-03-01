import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function run() {
    try {
        const link = await admin.auth().generatePasswordResetLink('enzorodriguez31@gmail.com');
        console.log("Got link:", link);
        const urlObj = new URL(link);
        console.log("oobCode:", urlObj.searchParams.get('oobCode'));
    } catch (e) {
        console.error(e);
    }
}
run();
