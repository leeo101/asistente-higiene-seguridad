import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}

const db = admin.firestore();
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-8644102194347274-021115-95fc0f02072be336a791b34e4cfbee7f-183552286' });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query } = req;
        const topic = query.topic || query.type;
        const id = query.id || (req.body && req.body.data && req.body.data.id);

        console.log(`Webhook received: Topic=${topic}, ID=${id}`);

        if (topic === 'payment' || topic === 'payment.created' || topic === 'payment.updated') {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id });

            if (paymentData.status === 'approved') {
                const userId = paymentData.external_reference;
                console.log(`Payment approved for user: ${userId}`);

                if (userId) {
                    const userRef = db.collection('users').doc(userId).collection('data').doc('subscriptionData');
                    const userDoc = await userRef.get();

                    let currentExpiry = 0;
                    if (userDoc.exists) {
                        currentExpiry = parseInt(userDoc.data().expiry || '0', 10);
                    }

                    const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                    baseDate.setMonth(baseDate.getMonth() + 1);
                    const newExpiry = baseDate.getTime();

                    await userRef.set({
                        status: 'active',
                        expiry: String(newExpiry),
                        updatedAt: Date.now(),
                        lastPaymentId: id
                    }, { merge: true });

                    console.log(`User ${userId} updated to PRO until ${new Date(newExpiry).toLocaleDateString()}`);
                }
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
