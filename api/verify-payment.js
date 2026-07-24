import Stripe from 'stripe';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { verifyToken, setCorsHeaders } from './_verifyToken.js';
import { getGoogleAccessToken } from './_googleAuth.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const mpClient = process.env.MP_ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN }) : null;

export default async function handler(req, res) {
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const decodedUser = await verifyToken(req, res);
    if (!decodedUser) return;

    try {
        const { payment_id, session_id } = req.body || {};
        const uid = decodedUser.uid;

        // Verify Stripe Payment
        if (session_id && stripe) {
            const session = await stripe.checkout.sessions.retrieve(session_id);
            if (session.payment_status === 'paid' || session.status === 'complete') {
                const oneMonthFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;
                
                // Update Firestore
                if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                    try {
                        const projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).project_id;
                        const accessToken = await getGoogleAccessToken();
                        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/data/subscriptionData?updateMask.fieldPaths=status&updateMask.fieldPaths=expiry&updateMask.fieldPaths=provider`;
                        
                        await fetch(firestoreUrl, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                fields: {
                                    status: { stringValue: 'active' },
                                    expiry: { stringValue: oneMonthFromNow.toString() },
                                    provider: { stringValue: 'stripe' }
                                }
                            })
                        });
                    } catch (fsErr) {
                        console.error('Error updating firestore via REST:', fsErr);
                    }
                }

                return res.status(200).json({ success: true, isPro: true });
            }
        }

        // Verify MercadoPago Payment
        if (payment_id && mpClient) {
            const payment = new Payment(mpClient);
            const paymentInfo = await payment.get({ id: payment_id });
            if (paymentInfo.status === 'approved') {
                const oneMonthFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;
                
                if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                    try {
                        const projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).project_id;
                        const accessToken = await getGoogleAccessToken();
                        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/data/subscriptionData?updateMask.fieldPaths=status&updateMask.fieldPaths=expiry&updateMask.fieldPaths=provider`;
                        
                        await fetch(firestoreUrl, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                fields: {
                                    status: { stringValue: 'active' },
                                    expiry: { stringValue: oneMonthFromNow.toString() },
                                    provider: { stringValue: 'mercadopago' }
                                }
                            })
                        });
                    } catch (fsErr) {
                        console.error('Error updating firestore via REST:', fsErr);
                    }
                }

                return res.status(200).json({ success: true, isPro: true });
            }
        }

        return res.status(400).json({ error: 'Pago no verificado o pendiente.' });
    } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(500).json({ error: 'Error al verificar el pago.', details: error.message });
    }
}
