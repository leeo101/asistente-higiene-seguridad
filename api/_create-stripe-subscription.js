import Stripe from 'stripe';
import { setCorsHeaders } from './_cors.js';

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

    if (!stripe) {
        console.error('Missing STRIPE_SECRET_KEY in environment variables');
        return res.status(500).json({ error: 'Falta configurar STRIPE_SECRET_KEY en el servidor' });
    }

    try {
        const { userId, email, planId } = req.body || {};

        let amount = 600; // default pro = $6.00
        let planName = 'Plan Profesional';

        if (planId === 'student') {
            amount = 200; // $2.00
            planName = 'Plan Estudiante';
        } else if (planId === 'enterprise') {
            amount = 2500; // $25.00
            planName = 'Plan Empresa';
        } else if (planId === 'pro') {
            amount = 600; // $6.00
            planName = 'Plan Profesional';
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
