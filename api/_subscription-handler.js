import { MercadoPagoConfig, Preference, Payment, PreApproval } from 'mercadopago';
import { sendAppMail } from './_mailer.js';
import { getGoogleAccessToken, setFirebaseCustomClaims, getFirebaseUidByEmail } from './_googleAuth.js';
import { setCorsHeaders, verifyToken } from './_verifyToken.js';
import { isOriginAllowed } from './_cors.js';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// ── Cotización en vivo USD -> ARS (con caché de 30 min y doble fuente oficial) ──
let cachedUsdRate = null;
let cachedUsdRateExpiry = 0;

export async function getLiveUsdToArsRate() {
    const now = Date.now();
    if (cachedUsdRate && now < cachedUsdRateExpiry) {
        return cachedUsdRate;
    }

    const dollarType = (process.env.MP_DOLLAR_TYPE || 'oficial').toLowerCase(); // 'oficial', 'blue', 'bolsa', 'tarjeta'

    // Fuente 1: DolarApi.com
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`https://dolarapi.com/v1/dolares/${dollarType}`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
            const data = await res.json();
            const venta = Number(data?.venta || data?.compra);
            if (venta && venta > 100) {
                cachedUsdRate = venta;
                cachedUsdRateExpiry = now + 30 * 60 * 1000;
                return venta;
            }
        }
    } catch (e) {
        console.warn('[ExchangeRate] DolarApi fallback:', e.message);
    }

    // Fuente 2: Bluelytics API
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch('https://api.bluelytics.com.ar/v2/latest', { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
            const data = await res.json();
            const rateObj = dollarType === 'blue' ? data?.blue : data?.oficial;
            const venta = Number(rateObj?.value_sell || rateObj?.value_avg);
            if (venta && venta > 100) {
                cachedUsdRate = venta;
                cachedUsdRateExpiry = now + 30 * 60 * 1000;
                return venta;
            }
        }
    } catch (e) {
        console.warn('[ExchangeRate] Bluelytics fallback:', e.message);
    }

    // Fallback seguro si ambas APIs externas no responden
    return cachedUsdRate || Number(process.env.MP_USD_FALLBACK_RATE) || 1600;
}

export default async function handler(req, res) {
    // 🔐 Enable secure CORS configuration
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { query } = req;
    const topic = query.topic || query.type || req.body?.type || req.body?.topic || (req.body?.action && req.body.action.startsWith('payment') ? 'payment' : null);
    const webhookId = query.id || query['data.id'] || (req.body && req.body.data && req.body.data.id) || (req.body && req.body.id);

    // DISTINGUISH BETWEEN WEBHOOK AND CREATE SUBSCRIPTION / PREFERENCE
    if (webhookId || topic) {
        // --- WEBHOOK LOGIC (PAYMENTS & PREAPPROVAL SUBSCRIPTIONS) ---
        try {
            console.log(`Webhook received: Topic=${topic}, ID=${webhookId}`);
            if (!webhookId) {
                return res.status(200).send('No ID');
            }

            const topicStr = String(topic || '').toLowerCase();
            const isPreapprovalTopic = topicStr.includes('preapproval') || topicStr.includes('subscription_preapproval');
            const isPaymentTopic = !topic || topicStr.includes('payment');

            let approvedUserId = null;
            let payerEmail = null;
            let isAuthorized = false;
            let isAutoRenew = false;

            if (isPreapprovalTopic) {
                const preApproval = new PreApproval(client);
                const preData = await preApproval.get({ id: webhookId });
                if (preData.status === 'authorized') {
                    isAuthorized = true;
                    isAutoRenew = true;
                    approvedUserId = preData.external_reference;
                    payerEmail = preData.payer_email;
                }
            } else if (isPaymentTopic) {
                const payment = new Payment(client);
                const paymentData = await payment.get({ id: webhookId });
                if (paymentData.status === 'approved') {
                    isAuthorized = true;
                    isAutoRenew = Boolean(paymentData.metadata?.auto_renew || paymentData.point_of_interaction?.type === 'SUBSCRIPTIONS');
                    approvedUserId = paymentData.external_reference;
                    payerEmail = paymentData.payer?.email || paymentData.additional_info?.payer?.email;
                }
            }

            if (isAuthorized) {
                let userId = approvedUserId;
                console.log(`Authorized MP event for external_reference: ${userId}`);

                if (!userId || userId === 'guest') {
                    if (payerEmail) {
                        console.log(`Searching Firebase UID for payer email: ${payerEmail}`);
                        userId = await getFirebaseUidByEmail(payerEmail);
                        console.log(`Found UID: ${userId}`);
                    }
                }

                if (userId && userId !== 'guest') {
                    const projectId = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).project_id;
                    const accessToken = await getGoogleAccessToken();
                    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/data/subscriptionData`;
                    
                    // 1. Get current subscription data
                    const userDocRes = await fetch(firestoreUrl, { 
                        headers: { Authorization: `Bearer ${accessToken}` } 
                    });
                    
                    let currentExpiry = 0;
                    let lastPaymentId = null;
                    if (userDocRes.ok) {
                        const docData = await userDocRes.json();
                        if (docData.fields?.lastPaymentId?.stringValue) {
                            lastPaymentId = docData.fields.lastPaymentId.stringValue;
                        }
                        if (docData.fields?.expiry?.stringValue) {
                            currentExpiry = parseInt(docData.fields.expiry.stringValue, 10);
                        }
                    }

                    // 🔒 IDEMPOTENCY GUARD
                    if (lastPaymentId && String(lastPaymentId) === String(webhookId)) {
                        console.log(`[Webhook] El evento ID ${webhookId} ya fue procesado para el usuario ${userId}.`);
                        return res.status(200).send('Event already processed');
                    }

                    // 2. Calculate new expiry
                    const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                    baseDate.setMonth(baseDate.getMonth() + 1);
                    const newExpiry = String(baseDate.getTime());

                    // 3. Update subscription data via REST
                    const patchUrl = `${firestoreUrl}?updateMask.fieldPaths=status&updateMask.fieldPaths=expiry&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=lastPaymentId&updateMask.fieldPaths=provider&updateMask.fieldPaths=autoRenew&updateMask.fieldPaths=paymentMethod`;
                    const payload = {
                        fields: {
                            status: { stringValue: 'active' },
                            expiry: { stringValue: newExpiry },
                            updatedAt: { integerValue: String(Date.now()) },
                            lastPaymentId: { stringValue: String(webhookId) },
                            provider: { stringValue: 'mercadopago' },
                            autoRenew: { stringValue: isAutoRenew ? 'true' : 'false' },
                            paymentMethod: { stringValue: 'card_auto_debit' }
                        }
                    };

                    await fetch(patchUrl, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    // 4. Update Custom Claims in Firebase Auth
                    await setFirebaseCustomClaims(userId, { isPro: true });

                    console.log(`User ${userId} updated to PRO until ${new Date(parseInt(newExpiry, 10)).toLocaleDateString()}`);
                }
            }
            return res.status(200).send('OK');
        } catch (error) {
            console.error('Webhook error:', error);
            return res.status(200).send('Error processed');
        }
    } else {
        // --- CREATE SUBSCRIPTION (PREAPPROVAL AUTO-DEBIT OR CARD PREFERENCE IN ARS) ---
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        // 🔐 Requiere autenticación de usuario para crear suscripción
        const user = await verifyToken(req, res);
        if (!user) return;

        try {
            const { planId, promo, billingMode = 'recurring' } = req.body || {};
            const userId = user.uid;
            const email = user.email || req.body?.email;
            const CYBER_MONDAY_DEADLINE = new Date('2026-11-07T17:00:00-03:00').getTime();
            const isCyberMonday = promo === 'cybermonday' && Date.now() <= CYBER_MONDAY_DEADLINE;

            // Conversión dinámica diaria de USD ($2.00 o $0.99 promo) a Pesos Argentinos (ARS)
            const usdAmount = isCyberMonday ? 0.99 : 2.00;
            const exchangeRate = await getLiveUsdToArsRate();
            const amountArs = Math.round(usdAmount * exchangeRate);

            let planTitle = isCyberMonday
                ? `Asistente H&S – Plan Profesional (USD $${usdAmount} / $${amountArs.toLocaleString('es-AR')} ARS)`
                : `Asistente H&S – Plan Profesional PRO (USD $${usdAmount.toFixed(2)} — Débito Mensual)`;

            if (planId === 'student') {
                planTitle = isCyberMonday ? 'Asistente H&S – Plan Estudiante (Oferta)' : 'Asistente H&S – Plan Estudiante (Débito Mensual)';
            } else if (planId === 'enterprise' || planId === 'consultora') {
                planTitle = isCyberMonday ? 'Asistente H&S – Plan Consultora (Oferta)' : 'Asistente H&S – Plan Consultora (Débito Mensual)';
            }

            const requestOrigin = req.headers.origin;
            const PRODUCTION_URL = 'https://asistentehs.com';
            const baseUrl = (requestOrigin && isOriginAllowed(requestOrigin)) ? requestOrigin : PRODUCTION_URL;

            let initPoint = null;
            let subId = null;

            // 1. Intentar crear Suscripción de Débito Automático con Tarjeta (PreApproval) si billingMode === 'recurring'
            if (billingMode !== 'single' && email) {
                try {
                    const preApproval = new PreApproval(client);
                    const preResult = await preApproval.create({
                        body: {
                            reason: planTitle,
                            external_reference: userId || 'guest',
                            payer_email: email,
                            auto_recurring: {
                                frequency: 1,
                                frequency_type: 'months',
                                transaction_amount: amountArs,
                                currency_id: 'ARS'
                            },
                            back_url: `${baseUrl}/subscribe?status=approved&provider=mercadopago`,
                            status: 'pending'
                        }
                    });
                    if (preResult && preResult.init_point) {
                        initPoint = preResult.init_point;
                        subId = preResult.id;
                    }
                } catch (preErr) {
                    console.warn('[MP PreApproval] Fallback a Checkout de Tarjeta en ARS:', preErr.message);
                }
            }

            // 2. Fallback o modo de 1 mes: Checkout con Tarjeta de Débito/Crédito en ARS
            if (!initPoint) {
                const preference = new Preference(client);
                const result = await preference.create({
                    body: {
                        items: [
                            {
                                id: planId || 'pro_subscription',
                                title: planTitle,
                                description: `Suscripción mensual con tarjeta de débito o crédito a ${planTitle}.`,
                                quantity: 1,
                                unit_price: amountArs,
                                currency_id: 'ARS',
                            }
                        ],
                        payment_methods: {
                            excluded_payment_types: [
                                { id: 'ticket' },
                                { id: 'atm' }
                            ],
                            installments: 1
                        },
                        back_urls: {
                            success: `${baseUrl}/subscribe?status=approved&provider=mercadopago`,
                            failure: `${baseUrl}/subscribe?status=failed`,
                            pending: `${baseUrl}/subscribe?status=pending`
                        },
                        external_reference: userId || 'guest',
                        notification_url: `${baseUrl}/api/mercadopago-webhook`,
                        auto_return: 'approved',
                        statement_descriptor: 'ASISTENTE HY&S',
                    }
                });
                initPoint = result.init_point;
                subId = result.id;
            }

            if (email) {
                try {
                    await sendAppMail({
                        to: email,
                        subject: '¡Casi eres PRO! - Asistente H&S',
                        html: `
                            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                                    <img src="https://asistentehs.com/logo.png" alt="Asistente HYS" style="width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Asistente H&S PRO</h1>
                                </div>
                                <div style="padding: 40px 30px; background-color: #ffffff;">
                                    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">¡Hola!</h2>
                                    <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                                        Hemos notado que has iniciado el proceso para activar tu versión <strong>PRO</strong> del Asistente de Higiene y Seguridad. ¡Excelente decisión!
                                    </p>
                                    <div style="background-color: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;">
                                        <h3 style="color: #1e3a8a; margin-top: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Beneficios que te esperan:</h3>
                                        <ul style="color: #475569; margin: 15px 0 0; padding-left: 20px; line-height: 1.8;">
                                            <li>Generación de informes ilimitados.</li>
                                            <li>Cámara IA para detección de riesgos avanzada.</li>
                                            <li>Descarga de PDFs profesionales con tu firma.</li>
                                            <li>Soporte prioritario.</li>
                                        </ul>
                                    </div>
                                    <p style="color: #475569; line-height: 1.6; font-size: 16px; text-align: center;">
                                        Si cerraste la ventana de pago, puedes volver a intentarlo haciendo clic en el siguiente botón:
                                    </p>
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${baseUrl}/subscribe" style="display: inline-block; padding: 16px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">Finalizar Suscripción</a>
                                    </div>
                                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px;">
                                        Si ya completaste el pago, tu cuenta se activará automáticamente en unos momentos.<br>
                                        ¡Gracias por confiar en nosotros!
                                    </p>
                                </div>
                                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #64748b; font-size: 12px; margin: 0;">© 2026 Asistente de Higiene y Seguridad.</p>
                                </div>
                            </div>
                        `
                    });
                } catch (err) {
                    console.error("Error sending subscription notification:", err);
                }
            }
            return res.status(200).json({
                id: subId,
                init_point: initPoint,
                usdAmount,
                exchangeRate,
                amountArs
            });
        } catch (error) {
            console.error("MP Error:", error);
            return res.status(500).json({ error: 'Error al crear la preferencia', details: error.message });
        }
    }
}
