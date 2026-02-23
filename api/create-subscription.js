import { MercadoPagoConfig, Preference } from 'mercadopago';

// Vercel Serverless Function for Mercado Pago Subscriptions
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-3860010994191089-021817-aeecdbf839baea7dfbc52acde2364024-2275601956' });
        const preference = new Preference(client);

        // Define base url for success/failure redirects based on the host
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'pro_subscription',
                        title: 'Modo Profesional (Suscripción Anual)',
                        description: 'Acceso total a Ergonomía, Matriz de Riesgos y Reportes Avanzados.',
                        quantity: 1,
                        unit_price: 15,
                        currency_id: 'ARS', // Adapt to required currency
                    }
                ],
                back_urls: {
                    success: `${baseUrl}/subscribe?success=true`,
                    failure: `${baseUrl}/subscribe?success=false`,
                    pending: `${baseUrl}/subscribe?success=pending`
                },
                auto_return: 'approved',
                statement_descriptor: 'ASISTENTE HY&S PRO',
                external_reference: req.body.userId || 'guest',
            }
        });

        return res.status(200).json({ id: result.id, init_point: result.init_point });
    } catch (error) {
        console.error("MP Error:", error);
        return res.status(500).json({ error: 'Error al crear la preferencia', details: error.message });
    }
}
