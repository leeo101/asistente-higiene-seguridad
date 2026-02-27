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
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const base64Data = image.split(',')[1];
            const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

            const prompt = `Analiza detalladamente esta imagen de un entorno laboral. 
            Tu tarea es verificar el uso de Elementos de Protección Personal (EPP) y detectar riesgos.
            Devuelve ÚNICAMENTE un objeto JSON estricto, sin texto adicional, con el siguiente formato exacto:
            {
                "personDetected": true/false,
                "helmetUsed": true/false,
                "shoesUsed": true/false,
                "glovesUsed": true/false,
                "clothingUsed": true/false,
                "ppeComplete": true/false,
                "foundRisks": ["Descripción"]
            }`;

            const imagePart = {
                inlineData: { data: base64Data, mimeType }
            };

            const result = await model.generateContent([prompt, imagePart]);
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

// ==========================================
// EMAIL FORGOT PASSWORD (Using Firebase Auth is better, but migrating this for compatibility)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'asistente.hs.soporte@gmail.com',
        pass: process.env.EMAIL_PASS || 'bslx yhce ffli lmoc'
    }
});

exports.forgotPassword = onRequest((req, res) => {
    return cors(req, res, async () => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email requerido' });

        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

            const mailOptions = {
                from: { name: 'Asistente HYS', address: process.env.EMAIL_USER },
                to: email,
                subject: 'Restablecer tu contraseña - Asistente HYS',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px; background-color: #ffffff;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="https://asistentehs-b594e.web.app/logo.png" alt="Asistente HYS" style="height: 60px; width: auto;">
                        </div>
                        <h2 style="color: #3b82f6; text-align: center;">Tu Código de Seguridad</h2>
                        <p style="text-align: center; font-size: 1.1rem;">Has solicitado restablecer tu contraseña en el <strong>Asistente HYS</strong>.</p>
                        
                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${code}</span>
                        </div>

                        <p style="text-align: center;">Usa este código en la aplicación para verificar tu identidad.</p>
                        <p style="color: #666; font-size: 0.85rem; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            res.json({
                message: 'Código de recuperación enviado.',
                code: code
            });
        } catch (error) {
            logger.error("Error sending forgot password email", error);
            res.status(500).json({ error: error.message });
        }
    });
});
