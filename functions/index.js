const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });
const { MercadoPagoConfig, Preference } = require("mercadopago");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require("nodemailer");

setGlobalOptions({ maxInstances: 10, region: "us-central1" });

// ==========================================
// MERCADO PAGO FUNCTION
// ==========================================
exports.createSubscription = onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const client = new MercadoPagoConfig({
                accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-8644102194347274-021115-95fc0f02072be336a791b34e4cfbee7f-183552286'
            });
            const preference = new Preference(client);

            const response = await preference.create({
                body: {
                    items: [
                        {
                            id: 'premium-sub',
                            title: 'Suscripción Mensual Asistente HS Premium',
                            quantity: 1,
                            unit_price: 10,
                            currency_id: 'USD'
                        }
                    ],
                    back_urls: {
                        success: 'https://asistentehs-b594e.web.app/subscribe?status=approved',
                        failure: 'https://asistentehs-b594e.web.app/subscribe',
                        pending: 'https://asistentehs-b594e.web.app/subscribe'
                    }
                }
            });

            res.json({ init_point: response.init_point });
        } catch (error) {
            logger.error("Error creating Mercado Pago preference", error);
            res.status(500).json({ error: error.message });
        }
    });
});

// ==========================================
// GEMINI AI FUNCTION
// ==========================================
exports.analyzeImage = onRequest({ timeoutSeconds: 300, memory: "1GiB" }, (req, res) => {
    return cors(req, res, async () => {
        try {
            const { image } = req.body;
            if (!image) return res.status(400).json({ error: 'No se envió imagen' });

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

            const genAI = new GoogleGenerativeAI(apiKey);
            const safetySettings = [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ];

            const models = [
                "gemini-2.0-flash",
                "gemini-1.5-flash-latest",
                "gemini-1.5-pro-latest",
                "gemini-1.5-flash"
            ];

            let result;
            let lastError;
            for (const modelName of models) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
                    result = await model.generateContent([prompt, imagePart]);
                    if (result) break;
                } catch (err) {
                    lastError = err;
                    continue;
                }
            }

            if (!result) throw lastError || new Error('Todos los modelos fallaron');

            const responseText = result.response.text();

            let cleanedJson = responseText.trim();
            if (cleanedJson.startsWith('```json')) {
                cleanedJson = cleanedJson.replace(/```json/, '').replace(/```$/, '').trim();
            } else if (cleanedJson.startsWith('```')) {
                cleanedJson = cleanedJson.replace(/```/, '').replace(/```$/, '').trim();
            }

            const parsedData = JSON.parse(cleanedJson);
            res.json(parsedData);
        } catch (error) {
            logger.error("Error analyzing image", error);
            res.status(500).json({ error: error.message });
        }
    });
});

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.forgotPassword = onRequest((req, res) => {
    return cors(req, res, async () => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email requerido' });

        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

            const { data, error } = await resend.emails.send({
                from: 'Asistente HYS <soporte@asistentehs.com>',
                to: email,
                subject: 'Código de Seguridad - Asistente HYS',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                            <img src="https://asistentehs.com/logo.png" alt="Asistente HYS" style="width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Asistente H&S</h1>
                        </div>
                        
                        <div style="padding: 40px 30px; background-color: #ffffff;">
                            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Hola,</h2>
                            <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                                Has solicitado restablecer tu contraseña en el <strong>Asistente de Higiene y Seguridad</strong>.
                            </p>
                            
                            <div style="margin: 35px 0; text-align: center;">
                                <p style="color: #64748b; font-size: 14px; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Tu Código de Verificación</p>
                                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; display: inline-block; border: 1px dashed #cbd5e1;">
                                    <span style="font-size: 36px; font-weight: 800; color: #1e3a8a; letter-spacing: 8px; font-family: monospace;">${code}</span>
                                </div>
                            </div>

                            <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                                Usa este código en la aplicación para verificar tu identidad y establecer una nueva contraseña.
                            </p>
                            
                            <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px;">
                                <strong>¿No solicitaste este cambio?</strong><br>
                                Puedes ignorar este correo de forma segura. El código expirará en breve por tu seguridad.
                            </p>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 12px; margin: 0;">
                                © 2026 Asistente de Higiene y Seguridad. Todos los derechos reservados.
                            </p>
                        </div>
                    </div>
                `
            });

            if (error) throw error;

            res.json({
                message: 'Código de recuperación enviado a tu correo.'
            });
        } catch (error) {
            logger.error("Error sending forgot password email via Resend", error);
            res.status(500).json({ error: error.message });
        }
    });
});
