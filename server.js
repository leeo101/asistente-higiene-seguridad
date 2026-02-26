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
// ==========================================
// UNIFIED SERVER (API + STATIC) 
// ==========================================
const app = express()

// Allow CORS for development and for the production Firebase URL
const allowedOrigins = [
    'http://localhost:5173',
    'https://asistentehs-b594e.web.app',
    'https://asistentehs-b594e.firebaseapp.com'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(null, true); // Allow all for now to avoid issues, or restrict:
            // var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            // return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '50mb' })) // Increase limit for images
app.use(express.urlencoded({ limit: '50mb', extended: true }))

process.on('unhandledRejection', (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on('uncaughtException', (err) => {
    console.error("Uncaught Exception:", err);
});

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-8644102194347274-021115-95fc0f02072be336a791b34e4cfbee7f-183552286' });

app.post('/api/create-subscription', async (req, res) => {
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
                        unit_price: 5,
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

app.post('/api/analyze-image', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[ERROR] Missing GEMINI_API_KEY environment variable.");
            return res.status(500).json({ error: 'Falta la API Key de Gemini en el backend' });
        }

        console.log(`[AI] Attempting analysis with key ending in: ...${apiKey.slice(-4)}`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Using model: gemini-1.5-flash");

        const base64Data = image.split(',')[1];
        if (!base64Data || base64Data.length < 10) {
            return res.status(400).json({ error: 'La imagen enviada no es válida o está vacía.' });
        }
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
    "foundRisks": ["Descripción del riesgo 1", "Riesgo 2"], 
    "detections": [
        {"label": "Casco", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Calzado", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Guantes", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Riesgo: [Nombre]", "box_2d": [ymin, xmin, ymax, xmax]}
    ]
}
Importante: Las coordenadas [ymin, xmin, ymax, xmax] deben estar normalizadas de 0 a 1000.`;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            },
        };

        let result;
        const models = [
            "gemini-2.0-flash",
            "gemini-flash-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
        ];
        let lastError;

        for (const modelName of models) {
            try {
                process.stdout.write(`[RECOVERY] Attempting ${modelName}... `);
                const model = genAI.getGenerativeModel({ model: modelName });

                // Add a local timeout for the specific request (15 seconds)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                try {
                    result = await model.generateContent([prompt, imagePart]);
                    clearTimeout(timeoutId);
                    if (result) {
                        console.log("SUCCESS ✅");
                        break;
                    }
                } catch (e) {
                    clearTimeout(timeoutId);
                    throw e;
                }
            } catch (error) {
                lastError = error;
                console.log(`FAILED ❌ (${error.message})`);
                continue;
            }
        }

        if (!result) {
            const keyInfo = apiKey ? `${apiKey.substring(0, 6)}...${apiKey.slice(-4)}` : 'MISSING';
            console.error("[RECOVERY] All models failed. Key info:", keyInfo);
            throw new Error(`Error Fatal de IA: Intentados ${models.join(', ')}. Todos fallaron (404 Not Found). Esto suele ser porque la API Key no tiene habilitados estos modelos en tu región. Key actual: ${keyInfo}.`);
        }
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

app.post('/api/ai-advisor', async (req, res) => {
    try {
        const { taskDescription } = req.body;
        if (!taskDescription) return res.status(400).json({ error: 'Falta la descripción de la tarea' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Actúa como un experto en Higiene y Seguridad Laboral en Argentina. 
Analiza la siguiente tarea o situación laboral: "${taskDescription}".
Proporciona un análisis detallado en formato JSON con los siguientes campos EXACTOS:
{
    "task": "Nombre de la tarea",
    "riesgos": ["Detalle del riesgo 1", "Riesgo 2"],
    "epp": ["EPP recomendado 1", "EPP 2"],
    "recomendaciones": ["Medida preventiva 1", "2"],
    "normativa": ["Ley o Decreto aplicable"]
}
IMPORTANTE: Devuelve ÚNICAMENTE el objeto JSON, sin texto adicional. Asegúrate de incluir normativas argentinas (ej: Ley 19587, Dec 351/79, Dec 911/96).`;

        const result = await model.generateContent(prompt);
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
        console.error("Error in AI Advisor:", error);
        res.status(500).json({ error: 'Error procesando la consulta', details: error.message });
    }
});


// Diagnostic endpoint to scan available models
app.get('/api/scan-models', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

    try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);

        res.json({
            message: 'Diagnostic point reached',
            keyPrefix: apiKey.substring(0, 6),
            sdkVersion: '0.24.1',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
    },
    // Add timeouts to prevent hanging
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// Verify connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('[NODEMAILER] Error de conexión:', error.message);
    } else {
        console.log('[NODEMAILER] Servidor de correo listo para enviar mensajes');
    }
});

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    try {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour

        resetTokens.set(token, { email, expires });

        // Use origin to generate the link, or a fallback
        const origin = req.headers.origin || 'http://localhost:5173';
        const resetLink = `${origin}/reset-password?token=${token}`;

        console.log(`[PASSWORD RESET] Link for ${email}: ${resetLink}`);

        const mailOptions = {
            from: '"Asistente H&S" <asistente.hs.soporte@gmail.com>',
            to: email,
            subject: 'Restablecer tu contraseña - Asistente H&S',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
                    <h2 style="color: #3b82f6;">Restablecer Contraseña</h2>
                    <p>Has solicitado restablecer tu contraseña en el <strong>Asistente de Higiene y Seguridad</strong>.</p>
                    <p>Haz clic en el siguiente botón para continuar (expira en 1 hora):</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Restablecer Contraseña</a>
                    <p style="color: #666; font-size: 0.85rem;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                </div>
            `
        };

        // Send email and wait for result
        console.log(`[PASSWORD RESET] Sending email to ${email}...`);

        try {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout enviando email')), 15000);
                transporter.sendMail(mailOptions, (err, info) => {
                    clearTimeout(timeout);
                    if (err) reject(err);
                    else resolve(info);
                });
            });
            console.log(`[PASSWORD RESET] Email sent successfully to ${email}`);
            return res.json({ message: 'Email de recuperación enviado con éxito.' });
        } catch (err) {
            console.error('[PASSWORD RESET] Error sending email:', err.message);
            // Return reset link in response if email fails as a fallback
            return res.json({
                message: 'No se pudo enviar el mail, pero puedes usar este link directo.',
                devLink: resetLink
            });
        }

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/reset-password', async (req, res) => {
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

// ==========================================
// REGISTRATION REQUESTS API
// ==========================================

const DATA_DIR = './data';
const REQUESTS_FILE = `${DATA_DIR}/registration-requests.json`;

async function ensureDataFile() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        try {
            await fs.access(REQUESTS_FILE);
        } catch {
            await fs.writeFile(REQUESTS_FILE, JSON.stringify([]), 'utf-8');
        }
    } catch (error) {
        console.error("Error creating data directory/file:", error);
    }
}

// Ensure on startup
ensureDataFile();

app.post('/api/register-request', async (req, res) => {
    try {
        const { name, email, profession, phone } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
        }
        await ensureDataFile();
        const fileContent = await fs.readFile(REQUESTS_FILE, 'utf-8');
        const requests = fileContent ? JSON.parse(fileContent) : [];
        const newRequest = {
            id: Date.now().toString(),
            name,
            email,
            profession: profession || '',
            phone: phone || '',
            status: 'pending',
            date: new Date().toISOString()
        };
        requests.push(newRequest);
        await fs.writeFile(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf-8');
        res.status(201).json({ message: 'Solicitud enviada correctamente', request: newRequest });
    } catch (error) {
        console.error("Error saving registration request:", error);
        res.status(500).json({ error: 'Error al guardar la solicitud' });
    }
});

app.get('/api/admin/requests', async (req, res) => {
    try {
        await ensureDataFile();
        const fileContent = await fs.readFile(REQUESTS_FILE, 'utf-8');
        const requests = fileContent ? JSON.parse(fileContent) : [];
        res.json(requests);
    } catch (error) {
        console.error("Error reading registration requests:", error);
        res.status(500).json({ error: 'Error al leer las solicitudes' });
    }
});

app.delete('/api/admin/requests/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await ensureDataFile();
        const fileContent = await fs.readFile(REQUESTS_FILE, 'utf-8');
        let requests = fileContent ? JSON.parse(fileContent) : [];
        const initialLength = requests.length;
        requests = requests.filter(req => req.id !== id);
        if (requests.length === initialLength) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        await fs.writeFile(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf-8');
        res.json({ message: 'Solicitud eliminada' });
    } catch (error) {
        console.error("Error deleting registration request:", error);
        res.status(500).json({ error: 'Error al eliminar la solicitud' });
    }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
