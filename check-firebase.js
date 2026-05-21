import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

console.log("Starting Firebase Admin check...");
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in env");
    process.exit(1);
}

try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (serviceAccount.private_key) {
        console.log("Before replace, private_key starts with:", serviceAccount.private_key.substring(0, 50));
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        console.log("After replace, private_key starts with:", serviceAccount.private_key.substring(0, 50));
    }
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin successfully initialized!");
    
    const db = admin.firestore();
    console.log("Firestore client created successfully!");
} catch (error) {
    console.error("Firebase Admin initialization error:", error);
}
