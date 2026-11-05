import Stripe from 'stripe';
import { setCorsHeaders, verifyToken } from './_verifyToken.js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export default async function handler(req, res) {
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 🔐 Requiere usuario autenticado para evitar generación masiva de sesiones de cobro
    const user = await verifyToken(req, res);
    if (!user) return;

    if (!stripe) {
        console.error('Missing STRIPE_SECRET_KEY in environment variables');
        return res.status(500).json({ error: 'Falta configurar STRIPE_SECRET_KEY en el servidor' });
    }

    try {
        const { planId, promo } = req.body || {};
        const userId = user.uid;
        const email = user.email || req.body?.email;
        const CYBER_MONDAY_DEADLINE = new Date('2026-11-07T17:00:00-03:00').getTime();
        const isCyberMonday = promo === 'cybermonday' && Date.now() <= CYBER_MONDAY_DEADLINE;

        let amount = isCyberMonday ? 99 : 200; // $0.99 USD Cyber Monday promo vs $2.00 USD default
        let planName = isCyberMonday
            ? 'Plan Profesional PRO - Oferta Cyber Monday'
            : 'Plan Profesional (Acceso Total)';

        if (planId === 'student') {
            amount = isCyberMonday ? 99 : 200;
            planName = isCyberMonday ? 'Plan Estudiante - Oferta Cyber Monday' : 'Plan Estudiante';
        } else if (planId === 'enterprise' || planId === 'consultora') {
            amount = isCyberMonday ? 99 : 200;
            planName = isCyberMonday ? 'Plan Consultora - Oferta Cyber Monday' : 'Plan Consultora';
        }

        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: email || undefined,
            client_reference_id: userId || 'guest',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Asistente H&S - ${planName}`,
                            description: 'Suscripción mensual a la plataforma de Higiene y Seguridad.',
                        },
                        unit_amount: amount,
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/subscribe?status=approved&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/subscribe?status=cancelled`,
        });

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe Session Error:', error);
        return res.status(500).json({ error: 'Error al crear la sesión de Checkout de Stripe', details: error.message });
    }
}
