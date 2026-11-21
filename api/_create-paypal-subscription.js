import { setCorsHeaders, verifyToken } from './_verifyToken.js';
import { isOriginAllowed } from './_cors.js';
import { createPaypalCheckout } from './_paypal.js';

export default async function handler(req, res) {
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 🔐 Requiere usuario autenticado
    const user = await verifyToken(req, res);
    if (!user) return;

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        if (process.env.PAYPAL_PAYMENT_LINK) {
            return res.status(200).json({ url: process.env.PAYPAL_PAYMENT_LINK });
        }
        console.error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in environment variables');
        return res.status(500).json({ error: 'Falta configurar PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en el servidor' });
    }

    try {
        const { planId, promo, billingMode = 'recurring' } = req.body || {};
        const userId = user.uid;
        const email = user.email || req.body?.email;
        const CYBER_MONDAY_DEADLINE = new Date('2026-11-07T17:00:00-03:00').getTime();
        const isCyberMonday = promo === 'cybermonday' && Date.now() <= CYBER_MONDAY_DEADLINE;

        const usdAmount = isCyberMonday ? 0.99 : 2.00;
        let planName = isCyberMonday
            ? 'Asistente H&S - Plan Profesional PRO (Oferta)'
            : 'Asistente H&S - Plan Profesional PRO (Acceso Total)';

        if (planId === 'student') {
            planName = 'Asistente H&S - Plan Estudiante';
        } else if (planId === 'enterprise' || planId === 'consultora') {
            planName = 'Asistente H&S - Plan Consultora';
        }

        const requestOrigin = req.headers.origin;
        const PRODUCTION_URL = 'https://asistentehs.com';
        const baseUrl = (requestOrigin && isOriginAllowed(requestOrigin)) ? requestOrigin : PRODUCTION_URL;

        const checkout = await createPaypalCheckout({
            userId,
            email,
            usdAmount,
            planName,
            baseUrl,
            billingMode
        });

        return res.status(200).json({ url: checkout.url, id: checkout.id, type: checkout.type });
    } catch (error) {
        console.error('PayPal Session Error:', error);
        return res.status(500).json({ error: 'Error al crear la suscripción con PayPal', details: error.message });
    }
}
