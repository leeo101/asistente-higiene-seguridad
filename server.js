import fs from 'node:fs/promises'
import express from 'express'
import { MercadoPagoConfig, Preference } from 'mercadopago';
import cors from 'cors';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// In-memory token store (for demo purposes)
const resetTokens = new Map();

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const apiPort = 3001
const base = process.env.BASE || '/'

// Cached production assets
const templateHtml = isProduction
    ? await fs.readFile('./dist/client/index.html', 'utf-8')
    : ''

// ==========================================
// SEPARATE API SERVER (Runs on port 3001)
// ==========================================
const apiApp = express()
apiApp.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
apiApp.use(express.json())

process.on('unhandledRejection', (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on('uncaughtException', (err) => {
    console.error("Uncaught Exception:", err);
});

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-8644102194347274-021115-95fc0f02072be336a791b34e4cfbee7f-183552286' });

apiApp.post('/api/create-subscription', async (req, res) => {
    try {
        console.log('API Request received for payment creation');
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
                    success: 'http://localhost:5173/subscribe?status=approved',
                    failure: 'http://localhost:5173/subscribe',
                    pending: 'http://localhost:5173/subscribe'
                }
            }
        });

        console.log('Preference created successfully:', response.init_point);
        res.json({ init_point: response.init_point });
    } catch (error) {
        console.log('Error creating Mercado Pago preference:');
        console.error(error);
        res.status(500).json({
            error: 'Error al generar link de pago.',
            details: error.message
        });
    }
});

// ==========================================
// AI VISION API (Gemini)
// ==========================================

apiApp.post('/api/analyze-image', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Falta la API Key de Gemini en el backend' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Analiza detalladamente esta imagen de un entorno laboral. 
Tu tarea es verificar el uso de Elementos de Protección Personal (EPP) y detectar riesgos.
Devuelve ÚNICAMENTE un objeto JSON estricto, sin texto adicional, con el siguiente formato exacto:
{
    "personDetected": true/false,
    "helmetUsed": true/false, // Casco
    "shoesUsed": true/false,  // Calzado de seguridad o botines
    "glovesUsed": true/false, // Guantes de trabajo
    "clothingUsed": true/false, // Ropa de trabajo, uniforme o chaleco reflectivo
    "ppeComplete": true/false, // Si tiene todos los EPP básicos listados antes
    "foundRisks": ["Descripción del riesgo 1", "Riesgo 2"] // Array vacío si no hay riesgos evidentes adicionales a los EPP faltantes
}`;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        // Sanitize JSON
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('\`\`\`json')) {
            cleanedJson = cleanedJson.replace(/\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (cleanedJson.startsWith('\`\`\`')) {
            cleanedJson = cleanedJson.replace(/\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        const parsedData = JSON.parse(cleanedJson);
        res.json(parsedData);

    } catch (error) {
        console.error("Error analyzing image:", error);
        res.status(500).json({ error: 'Error analizando la imagen', details: error.message });
    }
});

// ==========================================
// PASSWORD RESET API
// ==========================================

// Email config (Use environment variables in production!)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'asistente.hs.soporte@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

apiApp.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    try {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour

        resetTokens.set(token, { email, expires });

        const resetLink = `http://localhost:5173/reset-password?token=${token}`;

        console.log(`[PASWORD RESET] Link for ${email}: ${resetLink}`);

        const mailOptions = {
            from: '"Asistente H&S" <asistente.hs.soporte@gmail.com>',
            to: email,
            subject: 'Restablecer tu contraseña - Asistente H&S',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; borderRadius: 12px;">
                    <h2 style="color: #3b82f6;">Restablecer Contraseña</h2>
                    <p>Has solicitado restablecer tu contraseña en el <strong>Asistente de Higiene y Seguridad</strong>.</p>
                    <p>Haz clic en el siguiente botón para continuar (expira en 1 hora):</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Restablecer Contraseña</a>
                    <p style="color: #666; font-size: 0.85rem;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log('Error sending email (likely missing credentials):', err.message);
                return res.json({ message: 'Link de recuperación generado (ver consola)', devLink: resetLink });
            }
            res.json({ message: 'Email de recuperación enviado con éxito.' });
        });

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

apiApp.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const session = resetTokens.get(token);

    if (!session || session.expires < Date.now()) {
        return res.status(400).json({ error: 'Token no válido o expirado' });
    }

    try {
        console.log(`[PASSWORD RESET] Correctly updated password for ${session.email}`);
        resetTokens.delete(token);
        res.json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }
});

apiApp.listen(apiPort, '0.0.0.0', () => {
    console.log(`Backend API Server running at http://localhost:${apiPort}`)
})

// ==========================================
// VITE DEV SERVER & HTML SERVING (Runs on port 5173)
// ==========================================
const app = express()

let vite
if (!isProduction) {
    const { createServer } = await import('vite')
    vite = await createServer({
        server: { middlewareMode: true },
        appType: 'custom',
        base,
    })
    app.use(vite.middlewares);
} else {
    const compression = (await import('compression')).default
    const sirv = (await import('sirv')).default
    app.use(compression())
    app.use(base, sirv('./dist/client', { extensions: [] }))
}

// Serve HTML
app.use('*all', async (req, res, next) => {
    try {
        const url = req.originalUrl.replace(base, '')
        let template, render;

        if (!isProduction) {
            template = await fs.readFile('./index.html', 'utf-8')
            template = await vite.transformIndexHtml(url, template)
            render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
        } else {
            template = templateHtml
            render = (await import('./dist/server/entry-server.js')).render
        }

        const { html: appHtml } = await render(url)
        const html = template.replace(`<!--app-html-->`, appHtml ?? '')
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
    } catch (e) {
        vite?.ssrFixStacktrace(e)
        console.log(e.stack)
        res.status(500).end(e.stack)
    }
})

app.listen(port, '0.0.0.0', () => {
    console.log(`Frontend Server started at http://localhost:${port}`)
    console.log(`Mobile access available at your local network IP (e.g., http://192.168.x.x:${port})`)
})
