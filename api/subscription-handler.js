import createStripeSubscription from './_create-stripe-subscription.js';
import createPaypalSubscription from './_create-paypal-subscription.js';
import { cancelPaypalSubscription } from './_paypal.js';
import verifyPayment from './_verify-payment.js';
import subscriptionHandlerModule, { getLiveUsdToArsRate } from './_subscription-handler.js';
import { verifyToken, setCorsHeaders } from './_verifyToken.js';
import { getGoogleAccessToken, setFirebaseCustomClaims } from './_googleAuth.js';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import Stripe from 'stripe';

async function handleExchangeRate(req, res) {
  const corsOk = setCorsHeaders(req, res);
  if (!corsOk) return;
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const rate = await getLiveUsdToArsRate();
    return res.status(200).json({
      rate,
      usdPrice: 2.0,
      arsPrice: Math.round(2.0 * rate),
      promoUsdPrice: 0.99,
      promoArsPrice: Math.round(0.99 * rate),
      currency: 'ARS',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(200).json({
      rate: 1600,
      usdPrice: 2.0,
      arsPrice: 3200,
      promoUsdPrice: 0.99,
      promoArsPrice: 1584,
      currency: 'ARS',
      updatedAt: new Date().toISOString()
    });
  }
}

async function handleCancelSubscription(req, res) {
  const corsOk = setCorsHeaders(req, res);
  if (!corsOk) return;
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const user = await verifyToken(req, res);
  if (!user) return;
  const uid = user.uid;

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).project_id;
      const accessToken = await getGoogleAccessToken();
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/data/subscriptionData`;

      // Read current subscriptionId & provider to cancel at gateway if active
      try {
        const resDoc = await fetch(firestoreUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (resDoc.ok) {
          const docData = await resDoc.json();
          const subId = docData.fields?.subscriptionId?.stringValue;
          const provider = docData.fields?.provider?.stringValue;

          if (subId && provider === 'mercadopago' && process.env.MP_ACCESS_TOKEN) {
            try {
              const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
              const preApproval = new PreApproval(mpClient);
              await preApproval.update({ id: subId, body: { status: 'cancelled' } });
            } catch (mpErr) {
              console.warn('[CancelSub] MP PreApproval cancel warning:', mpErr.message);
            }
          } else if (subId && provider === 'paypal' && process.env.PAYPAL_CLIENT_ID) {
            try {
              await cancelPaypalSubscription(subId);
            } catch (ppErr) {
              console.warn('[CancelSub] PayPal cancel warning:', ppErr.message);
            }
          } else if (subId && provider === 'stripe' && process.env.STRIPE_SECRET_KEY && subId.startsWith('sub_')) {
            try {
              const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
              await stripe.subscriptions.cancel(subId);
            } catch (stErr) {
              console.warn('[CancelSub] Stripe cancel warning:', stErr.message);
            }
          }
        }
      } catch (e) {
        console.warn('[CancelSub] Lookup warning:', e.message);
      }

      const patchUrl = `${firestoreUrl}?updateMask.fieldPaths=status&updateMask.fieldPaths=autoRenew&updateMask.fieldPaths=updatedAt`;
      await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            status: { stringValue: 'inactive' },
            autoRenew: { stringValue: 'false' },
            updatedAt: { integerValue: String(Date.now()) }
          }
        })
      });
      await setFirebaseCustomClaims(uid, { isPro: false });
    }
    return res.status(200).json({ success: true, message: 'Débito automático y suscripción cancelados.' });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    return res.status(500).json({ error: 'Error al cancelar la suscripción' });
  }
}

export default async function handler(req, res) {
  const url = req.url || '';
  if (url.includes('exchange-rate')) return handleExchangeRate(req, res);
  if (url.includes('create-paypal-subscription')) return createPaypalSubscription(req, res);
  if (url.includes('create-stripe-subscription')) return createStripeSubscription(req, res);
  if (url.includes('verify-payment')) return verifyPayment(req, res);
  if (url.includes('cancel-subscription')) return handleCancelSubscription(req, res);
  return subscriptionHandlerModule(req, res);
}
