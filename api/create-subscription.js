import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
        const { userId, email } = req.body;
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
                        title: 'Asistente HYS – Versión PRO',
                        description: 'Acceso completo: informes, PDF, compartir, Cámara IA y más. Suscripción mensual.',
                        quantity: 1,
                        unit_price: 5.00,
                        currency_id: 'USD',
                    }
                ],
                back_urls: {
                    success: `${baseUrl}/subscription?status=approved`,
                    failure: `${baseUrl}/subscription?status=failed`,
                    pending: `${baseUrl}/subscription?status=pending`
                },
                auto_return: 'approved',
                statement_descriptor: 'ASISTENTE HY&S PRO',
                external_reference: userId || 'guest',
            }
        });

        // Enviar correo de notificación si hay un email disponible
        if (email) {
            try {
                await resend.emails.send({
                    from: 'Asistente HYS <soporte@asistentehs.com>',
                    to: email,
                    subject: '¡Casi eres PRO! - Asistente HYS',
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
                                    <a href="${baseUrl}/subscription" style="display: inline-block; padding: 16px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">Finalizar Suscripción</a>
                                </div>

                                <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px;">
                                    Si ya completaste el pago, tu cuenta se activará automáticamente en unos momentos.<br>
                                    ¡Gracias por confiar en nosotros!
                                </p>
                            </div>
                            
                            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="color: #64748b; font-size: 12px; margin: 0;">
                                    © 2026 Asistente de Higiene y Seguridad.
                                </p>
                            </div>
                        </div>
                    `
                });
            } catch (err) {
                console.error("Error sending subscription notification:", err);
            }
        }

        return res.status(200).json({ id: result.id, init_point: result.init_point });
    } catch (error) {
        console.error("MP Error:", error);
        return res.status(500).json({ error: 'Error al crear la preferencia', details: error.message });
    }
}
