import Stripe from 'stripe';
import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago';
import { verifyToken, setCorsHeaders } from './_verifyToken.js';
import { getGoogleAccessToken, setFirebaseCustomClaims } from './_googleAuth.js';
import { verifyPaypalPayment } from './_paypal.js';

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
        const { payment_id, collection_id, session_id, preapproval_id, paypal_subscription_id, paypal_order_id } = req.body || {};
        const mpPaymentId = payment_id || collection_id;
        const uid = decodedUser.uid;
        const userEmail = (decodedUser.email || '').toLowerCase().trim();

        const getFirestoreSubData = async (projectId, accessToken) => {
            const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/data/subscriptionData`;
            const resDoc = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
            if (!resDoc.ok) return { currentExpiry: 0, lastPaymentId: null };
            const docData = await resDoc.json();
            return {
                lastPaymentId: docData.fields?.lastPaymentId?.stringValue || null,
                currentExpiry: docData.fields?.expiry?.stringValue ? parseInt(docData.fields.expiry.stringValue, 10) : 0
            };
        };

        // 0. Verify PayPal Subscription or Order ($2.00 USD)
        if ((paypal_subscription_id || paypal_order_id) && process.env.PAYPAL_CLIENT_ID) {
            const ppResult = await verifyPaypalPayment({
                subscriptionId: paypal_subscription_id,
                orderId: paypal_order_id
            });

            if (ppResult.approved) {
                const isOwner =
                    (!ppResult.customId || ppResult.customId === 'guest' || ppResult.customId === uid) ||
                    (userEmail && ppResult.payerEmail && userEmail === ppResult.payerEmail);

                if (!isOwner) {
                    console.warn(`[SECURITY] Intento de reclamar pago PayPal ajeno (${ppResult.referenceId}) por uid=${uid}`);
                    return res.status(403).json({ error: 'Este pago de PayPal no corresponde a tu cuenta.' });
                }

                let newExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;

                if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                    try {
                        const projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).project_id;
                        const accessToken = await getGoogleAccessToken();
                        const { currentExpiry, lastPaymentId } = await getFirestoreSubData(projectId, accessToken);

                        if (lastPaymentId && String(lastPaymentId) === String(ppResult.referenceId)) {
                            return res.status(200).json({ success: true, isPro: true, autoRenew: ppResult.autoRenew, expiry: currentExpiry || newExpiry, alreadyProcessed: true });
                        }

                        const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                        baseDate.setMonth(baseDate.getMonth() + 1);
                        newExpiry = baseDate.getTime();

                        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/data/subscriptionData?updateMask.fieldPaths=status&updateMask.fieldPaths=expiry&updateMask.fieldPaths=provider&updateMask.fieldPaths=lastPaymentId&updateMask.fieldPaths=autoRenew&updateMask.fieldPaths=paymentMethod&updateMask.fieldPaths=subscriptionId&updateMask.fieldPaths=updatedAt`;

                        await fetch(firestoreUrl, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                fields: {
                                    status: { stringValue: 'active' },
                                    expiry: { stringValue: newExpiry.toString() },
                                    provider: { stringValue: 'paypal' },
                                    lastPaymentId: { stringValue: String(ppResult.referenceId) },
                                    autoRenew: { stringValue: ppResult.autoRenew ? 'true' : 'false' },
                                    paymentMethod: { stringValue: ppResult.autoRenew ? 'card_auto_debit' : 'card' },
                                    subscriptionId: { stringValue: String(ppResult.referenceId) },
                                    updatedAt: { integerValue: String(Date.now()) }
                                }
                            })
                        });

                        await setFirebaseCustomClaims(uid, { isPro: true });
                    } catch (fsErr) {
                        console.error('Error updating firestore for PayPal via REST:', fsErr);
                    }
                }

                return res.status(200).json({ success: true, isPro: true, autoRenew: ppResult.autoRenew, expiry: newExpiry });
            }
        }

        // 1. Verify Stripe Subscription Payment (Automatic Monthly Card Debit)
        if (session_id && stripe) {
            const session = await stripe.checkout.sessions.retrieve(session_id);
            if (session.payment_status === 'paid' || session.status === 'complete') {
                // 🔒 Ownership check: session must belong to the authenticated user
                const sessionUid = session.client_reference_id;
                const sessionEmail = (session.customer_email || session.customer_details?.email || '').toLowerCase().trim();
                const isOwner = (sessionUid && sessionUid !== 'guest' && sessionUid === uid) ||
                                (userEmail && sessionEmail && userEmail === sessionEmail);

                if (!isOwner) {
                    console.warn(`[SECURITY] Intento de reclamar sesión de Stripe ajena (${session_id}) por uid=${uid}`);
                    return res.status(403).json({ error: 'Esta sesión de pago no corresponde a tu cuenta.' });
                }

                let newExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;

                // Update Firestore with idempotency guard
                if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                    try {
                        const projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).project_id;
                        const accessToken = await getGoogleAccessToken();
                        const { currentExpiry, lastPaymentId } = await getFirestoreSubData(projectId, accessToken);

                        if (lastPaymentId && String(lastPaymentId) === String(session_id)) {
                            return res.status(200).json({ success: true, isPro: true, autoRenew: true, expiry: currentExpiry || newExpiry, alreadyProcessed: true });
                        }

                        const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                        baseDate.setMonth(baseDate.getMonth() + 1);
                        newExpiry = baseDate.getTime();

                        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/data/subscriptionData?updateMask.fieldPaths=status&updateMask.fieldPaths=expiry&updateMask.fieldPaths=provider&updateMask.fieldPaths=lastPaymentId&updateMask.fieldPaths=autoRenew&updateMask.fieldPaths=paymentMethod&updateMask.fieldPaths=subscriptionId&updateMask.fieldPaths=updatedAt`;
                        
                        await fetch(firestoreUrl, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                fields: {
                                    status: { stringValue: 'active' },
                                    expiry: { stringValue: newExpiry.toString() },
                                    provider: { stringValue: 'stripe' },
                                    lastPaymentId: { stringValue: String(session_id) },
                                    autoRenew: { stringValue: 'true' },
                                    paymentMethod: { stringValue: 'card_auto_debit' },
                                    subscriptionId: { stringValue: String(session.subscription || session_id) },
                                    updatedAt: { integerValue: String(Date.now()) }
                                }
                            })
                        });

                        // Set custom claims
                        await setFirebaseCustomClaims(uid, { isPro: true });
                    } catch (fsErr) {
                        console.error('Error updating firestore via REST:', fsErr);
                    }
                }

                return res.status(200).json({ success: true, isPro: true, autoRenew: true, expiry: newExpiry });
            }
        }

        // 2. Verify MercadoPago PreApproval (Adhesión de Tarjeta - Débito Automático Mensual)
        if (preapproval_id && mpClient) {
            const preApproval = new PreApproval(mpClient);
            const preInfo = await preApproval.get({ id: preapproval_id });
            if (preInfo.status === 'authorized' || preInfo.status === 'active') {
                const extRef = preInfo.external_reference;
                const payerEmail = (preInfo.payer_email || '').toLowerCase().trim();
                const isOwner = (extRef && extRef !== 'guest' && extRef === uid) ||
                                (userEmail && payerEmail && userEmail === payerEmail);

                if (!isOwner && extRef && extRef !== 'guest') {
                    console.warn(`[SECURITY] Intento de reclamar PreApproval MP ajeno (${preapproval_id}) por uid=${uid}`);
                    return res.status(403).json({ error: 'Esta suscripción no corresponde a tu cuenta.' });
                }

                let newExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;

                if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                    try {
                        const projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).project_id;
                        const accessToken = await getGoogleAccessToken();
                        const { currentExpiry, lastPaymentId } = await getFirestoreSubData(projectId, accessToken);

                        if (lastPaymentId && String(lastPaymentId) === String(preapproval_id)) {
                            return res.status(200).json({ success: true, isPro: true, autoRenew: true, expiry: currentExpiry || newExpiry, alreadyProcessed: true });
                        }

                        const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                        baseDate.setMonth(baseDate.getMonth() + 1);
                        newExpiry = baseDate.getTime();

                        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/data/subscriptionData?updateMask.fieldPaths=status&updateMask.fieldPaths=expiry&updateMask.fieldPaths=provider&updateMask.fieldPaths=lastPaymentId&updateMask.fieldPaths=autoRenew&updateMask.fieldPaths=paymentMethod&updateMask.fieldPaths=subscriptionId&updateMask.fieldPaths=updatedAt`;

                        await fetch(firestoreUrl, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                fields: {
                                    status: { stringValue: 'active' },
                                    expiry: { stringValue: newExpiry.toString() },
                                    provider: { stringValue: 'mercadopago' },
                                    lastPaymentId: { stringValue: String(preapproval_id) },
                                    autoRenew: { stringValue: 'true' },
                                    paymentMethod: { stringValue: 'card_auto_debit' },
                                    subscriptionId: { stringValue: String(preapproval_id) },
                                    updatedAt: { integerValue: String(Date.now()) }
                                }
                            })
                        });

                        await setFirebaseCustomClaims(uid, { isPro: true });
                    } catch (fsErr) {
                        console.error('Error updating firestore for preapproval via REST:', fsErr);
                    }
                }

                return res.status(200).json({ success: true, isPro: true, autoRenew: true, expiry: newExpiry });
            }
        }

        // Verify MercadoPago Payment
        if (mpPaymentId && mpClient) {
            const payment = new Payment(mpClient);
            const paymentInfo = await payment.get({ id: mpPaymentId });
            if (paymentInfo.status === 'approved') {
                // 🔒 Ownership check: payment must belong to the authenticated user
                const extRef = paymentInfo.external_reference;
                const payerEmail = (paymentInfo.payer?.email || paymentInfo.additional_info?.payer?.email || '').toLowerCase().trim();
                const isOwner = (extRef && extRef !== 'guest' && extRef === uid) ||
                                (userEmail && payerEmail && userEmail === payerEmail);

                if (!isOwner && extRef && extRef !== 'guest') {
                    console.warn(`[SECURITY] Intento de reclamar pago MP ajeno (${mpPaymentId}) por uid=${uid}`);
                    return res.status(403).json({ error: 'Este comprobante de pago no corresponde a tu cuenta.' });
                }

                let newExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
                
                if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                    try {
                        const projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).project_id;
                        const accessToken = await getGoogleAccessToken();
                        const { currentExpiry, lastPaymentId } = await getFirestoreSubData(projectId, accessToken);

                        if (lastPaymentId && String(lastPaymentId) === String(mpPaymentId)) {
                            return res.status(200).json({ success: true, isPro: true, expiry: currentExpiry || newExpiry, alreadyProcessed: true });
                        }

                        const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                        baseDate.setMonth(baseDate.getMonth() + 1);
                        newExpiry = baseDate.getTime();

                        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/data/subscriptionData?updateMask.fieldPaths=status&updateMask.fieldPaths=expiry&updateMask.fieldPaths=provider&updateMask.fieldPaths=lastPaymentId&updateMask.fieldPaths=updatedAt`;
                        
                        await fetch(firestoreUrl, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                fields: {
                                    status: { stringValue: 'active' },
                                    expiry: { stringValue: newExpiry.toString() },
                                    provider: { stringValue: 'mercadopago' },
                                    lastPaymentId: { stringValue: String(mpPaymentId) },
                                    updatedAt: { integerValue: String(Date.now()) }
                                }
                            })
                        });

                        // Set custom claims
                        await setFirebaseCustomClaims(uid, { isPro: true });
                    } catch (fsErr) {
                        console.error('Error updating firestore via REST:', fsErr);
                    }
                }

                return res.status(200).json({ success: true, isPro: true, expiry: newExpiry });
            }
        }

        return res.status(400).json({ error: 'Pago no verificado o pendiente.' });
    } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(500).json({ error: 'Error al verificar el pago.', details: error.message });
    }
}
