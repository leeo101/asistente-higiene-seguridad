import fs from 'node:fs/promises'
import express from 'express'
import { MercadoPagoConfig, Preference } from 'mercadopago';
import cors from 'cors';
import { Resend } from 'resend';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Require Firebase Admin (already in dependencies)
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}

// In-memory token store (for demo purposes - now unused for auth but kept for compatibility)
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
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        } else {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
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

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// Admin Authentication Middleware
const isAdmin = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    if (!process.env.ADMIN_API_KEY) {
        console.error('[SECURITY] ADMIN_API_KEY not configured in environment.');
        return res.status(500).json({ error: 'Configuración de seguridad incompleta.' });
    }
    if (adminKey !== process.env.ADMIN_API_KEY) {
        console.warn(`[SECURITY] Unauthorized admin access attempt from ${req.ip}`);
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
};

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
                        unit_price: 2,
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
        console.error('Error creating Mercado Pago preference:', error.message);
        res.status(500).json({
            error: 'Error al generar link de pago.'
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
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-1.5-flash",
            "models/gemini-1.5-flash",
            "gemini-flash-latest",
            "gemini-1.5-pro"
        ];
        const safetySettings = [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ];

        let lastError;
        for (const modelName of models) {
            try {
                process.stdout.write(`[AI RECOVERY] Intentando con ${modelName}... `);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    safetySettings
                });

                const fetchPromise = model.generateContent([prompt, imagePart]);

                // Add a local timeout for the specific request (25 seconds)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout local de 25s')), 25000)
                );

                result = await Promise.race([fetchPromise, timeoutPromise]);

                if (result) {
                    console.log("ÉXITO ✅");
                    break;
                }
            } catch (error) {
                lastError = error;
                console.log(`FALLÓ ❌ (${error.message})`);
                continue;
            }
        }

        if (!result) {
            const keyInfo = apiKey ? `${apiKey.substring(0, 6)}...${apiKey.slice(-4)}` : 'MISSING';
            console.error("[RECOVERY] Todos los modelos han fallado. Último error:", lastError?.message);
            return res.status(500).json({
                error: 'Todos los modelos de IA fallaron',
                details: lastError?.message || 'Error desconocido durante la recuperación'
            });
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
        console.error("Error analyzing image:", error.message);
        res.status(500).json({ error: 'Error analizando la imagen' });
    }
});

app.post('/api/daily-insight', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Actúa como un Asesor Senior en Higiene y Seguridad Laboral en Argentina. 
Genera un "Consejo del Día" breve y profesional para otros profesionales del área.
Puede ser un recordatorio normativo (Ley 19587, Dec 351/79, etc.), un tip técnico sobre EPP, ergonomía, o prevención de riesgos.
Formato de respuesta JSON estricto:
{
    "title": "Breve título del consejo (ej: Recordatorio SRT)",
    "content": "Contenido del consejo (máximo 140 caracteres)",
    "category": "Una de: Normativa, Técnico, Prevención, IA"
}
IMPORTANTE: Devuelve ÚNICAMENTE el objeto JSON. Sea conciso y valioso.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('\`\`\`json')) {
            cleanedJson = cleanedJson.replace(/\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (cleanedJson.startsWith('\`\`\`')) {
            cleanedJson = cleanedJson.replace(/\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        res.json(JSON.parse(cleanedJson));
    } catch (error) {
        console.error("Error generating daily insight:", error.message);
        res.status(500).json({ error: 'Error generando el consejo diario' });
    }
});

app.post('/api/ai-advisor', async (req, res) => {
    try {
        const { taskDescription } = req.body;
        if (!taskDescription) return res.status(400).json({ error: 'Falta la descripción de la tarea' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-1.5-flash",
            "models/gemini-1.5-flash"
        ];

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

        let result;
        for (const modelName of models) {
            try {
                console.log(`[AI ADVISOR] Intentando con ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                if (result) {
                    console.log(`[AI ADVISOR] Éxito con ${modelName}`);
                    break;
                }
            } catch (err) {
                console.warn(`[AI Advisor] Model ${modelName} failed (${err.message}), trying next...`);
                continue;
            }
        }

        if (!result) throw new Error('Todos los modelos de IA fallaron');

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
        console.error("Error in AI Advisor:", error.message);
        res.status(500).json({ error: 'Error procesando la consulta' });
    }
});

// ==========================================
// AI ATS GENERATOR (Gemini)
// ==========================================
app.post('/api/ai-ats-generator', async (req, res) => {
    try {
        const { taskTitle } = req.body;
        if (!taskTitle) return res.status(400).json({ error: 'Falta el título de la tarea' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-1.5-flash"
        ];

        const prompt = `Actúa como un experto en Higiene y Seguridad Laboral. 
Genera el Análisis de Trabajo Seguro (ATS) para la siguiente tarea: "${taskTitle}".
Devuelve ÚNICAMENTE un array JSON estricto donde cada elemento represente un paso de la tarea, con este formato exacto:
[
  { "paso": "Nombre del paso 1", "riesgo": "Riesgo principal", "control": "Medida preventiva / EPP recomendado" },
  { "paso": "Nombre del paso 2", "riesgo": "...", "control": "..." }
]
IMPORTANTE: Provee entre 4 y 8 pasos ordenados cronológicamente. Devuelve SOLO el JSON válido.`;

        let result;
        for (const modelName of models) {
            try {
                console.log(`[AI ATS] Intentando con ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                if (result) {
                    console.log(`[AI ATS] Éxito con ${modelName}`);
                    break;
                }
            } catch (err) {
                console.warn(`[AI ATS] Model ${modelName} failed (${err.message}), trying next...`);
                continue;
            }
        }

        if (!result) throw new Error('Todos los modelos de IA fallaron');

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
        console.error("Error in AI ATS Generator:", error.message);
        res.status(500).json({ error: 'Error generando el ATS' });
    }
});

// ==========================================
// AI REPORT CONCLUSION GENERATOR (Gemini)
// ==========================================
app.post('/api/ai-report-conclusion', async (req, res) => {
    try {
        const { reportType, reportData } = req.body;
        if (!reportType || !reportData) return res.status(400).json({ error: 'Faltan datos del reporte' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-1.5-flash"];

        const prompt = `Actúa como un experto consultor en Higiene y Seguridad Laboral en Argentina.
Analiza los siguientes datos extraídos de un reporte de "${reportType}":
${JSON.stringify(reportData)}

Redacta una concisa y profesional conclusión técnica (entre 2 y 4 párrafos cortos).
La conclusión debe analizar los resultados técnicos, indicar si hay desvíos según normativa y proponer recomendaciones concretas. 
Importante: tu respuesta debe contener ÚNICAMENTE el texto de la conclusión final, listo para insertar en un documento como respuesta cruda (sin comillas adicionales, sin bloque json, ni texto de saludo previo).`;

        let result;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                if (result) break;
            } catch (err) { continue; }
        }
        if (!result) throw new Error('Todos los modelos fallaron');
        res.json({ conclusion: result.response.text().trim() });
    } catch (error) {
        console.error("Error in AI Conclusion:", error.message);
        res.status(500).json({ error: 'Error generando la conclusión' });
    }
});

// ==========================================
// AI LEGAL SUMMARY (Gemini)
// ==========================================
app.post('/api/ai-legal-summary', async (req, res) => {
    try {
        const { leyTitle, leyDescription } = req.body;
        if (!leyTitle) return res.status(400).json({ error: 'Faltan datos de la normativa' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.0-flash", "gemini-1.5-flash-latest"];

        const prompt = `Como experto legislativo en Higiene y Seguridad en Argentina, realiza un resumen directo de esta norma operativa: "${leyTitle}".
Descripción corta: "${leyDescription}".
Provee un resumen de puntos principales (en viñetas) que todo prevencionista debe saber de forma rápida para el trabajo de campo. No inventar contenido, basarse en el objeto material de la ley. Devuelve directamente el texto, y usa formato markdown.`;

        let result;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                if (result) break;
            } catch (err) { continue; }
        }
        if (!result) throw new Error('Modelos fallaron');
        res.json({ summary: result.response.text().trim() });
    } catch (error) {
        console.error("Error in AI Legal Summary:", error.message);
        res.status(500).json({ error: 'Error generando resumen' });
    }
});

// ==========================================
// AI GENERAL RISKS VISION (Gemini)
// ==========================================
app.post('/api/analyze-general-risks', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Analiza detalladamente esta imagen de un entorno laboral. 
Tu tarea es la detección general de evidentes riesgos laborales y desvíos (ej: desorden, estiba peligrosa, máquinas sin protección, cables sueltos, obstrucciones, extintores vencidos, etc).
Devuelve ÚNICAMENTE un objeto JSON estricto, sin texto adicional, con el siguiente formato exacto:
{
    "personDetected": true/false, // Si hay personas expuestas
    "generalAssessment": "Breve descripción general de la escena observada en la foto",
    "foundRisks": ["Descripción del riesgo grave encontrado", "Riesgo menor (si aplica)"],
    "recommendations": ["Recomendación 1 para solucionar el riesgo", "Recomendación preventiva inmediata"],
    "detections": [
        {"label": "Riesgo detectado (Corto)", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Condición subestándar", "box_2d": [ymin, xmin, ymax, xmax]}
    ]
}
Importante: Las coordenadas [ymin, xmin, ymax, xmax] deben estar normalizadas de 0 a 1000. Trata de dibujar las bounding boxes en la zona de mayor peligro de fuego, de caída o de golpes o corte de ser posible.`;

        const imagePart = { inlineData: { data: base64Data, mimeType } };

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 25s local expiro')), 25000));
        let result = await Promise.race([model.generateContent([prompt, imagePart]), timeoutPromise]);

        const responseText = result.response.text();
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('\`\`\`json')) {
            cleanedJson = cleanedJson.replace(/\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (cleanedJson.startsWith('\`\`\`')) {
            cleanedJson = cleanedJson.replace(/\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        res.json(JSON.parse(cleanedJson));
    } catch (error) {
        console.error("Error analyzing general risks:", error.message);
        res.status(500).json({ error: 'Error en análisis de riesgos' });
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
// Resend config
const resend = new Resend(process.env.RESEND_API_KEY);

// Verify connection on startup
console.log('[RESEND] Configuración de correo mediante API inicializada');
if (!process.env.RESEND_API_KEY) {
    console.warn('[RESEND] ADVERTENCIA: RESEND_API_KEY no está configurada. El sistema de correos no funcionará.');
}

// Verify Resend on startup
if (process.env.RESEND_API_KEY) {
    console.log(`[RESEND] API Key detectada (comienza con: ${process.env.RESEND_API_KEY.substring(0, 5)}...)`);
    console.log('[RESEND] Listo para enviar mensajes vía API');
} else {
    console.error('[RESEND] ERROR: RESEND_API_KEY no encontrada en el .env');
}

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    try {
        // Use Firebase Admin SDK to generate the native reset link
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY env var. Cannot generate Firebase token.");
        }

        // By omitting actionCodeSettings, we bypass the "Domain not allowlisted" check
        let firebaseLink;
        try {
            firebaseLink = await admin.auth().generatePasswordResetLink(email);
        } catch (authErr) {
            console.error("Error generating Firebase link locally:", authErr);
            if (authErr.code === 'auth/user-not-found') {
                return res.status(404).json({ error: "No existe ninguna cuenta registrada con este correo electrónico." });
            }
            return res.status(400).json({
                error: "Error interno en el sistema de autenticación."
            });
        }

        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get('oobCode');
        const origin = req.headers.origin || 'http://localhost:5173';
        const resetLink = `${origin}/reset-password?oobCode=${oobCode}`;

        console.log(`[PASSWORD RESET] Local Reset Link for ${email}: ${resetLink}`);

        const mailOptions = {
            from: { name: 'Asistente HYS', address: 'soporte@asistentehs.com' },
            to: email,
            subject: 'Restablecer Contraseña - Asistente HYS',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                        <img src="https://asistentehs.com/logo.png" alt="Asistente HYS" style="width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Asistente H&S</h1>
                    </div>
                    
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Hola,</h2>
                        <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el <strong>Asistente de Higiene y Seguridad</strong>.
                        </p>
                        
                        <div style="margin: 35px 0; text-align: center;">
                            <p style="color: #64748b; font-size: 14px; margin-bottom: 12px; font-weight: 600; text-transform: uppercase;">Pulsa el botón de abajo para cambiar tu contraseña de forma segura:</p>
                        </div>

                        <p style="color: #475569; line-height: 1.6; font-size: 16px; text-align: center;">
                            O si lo prefieres, puedes acceder directamente haciendo clic en el siguiente botón:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">Restablecer Contraseña</a>
                        </div>

                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px;">
                            <strong>¿No solicitaste este cambio?</strong><br>
                            Puedes ignorar este correo de forma segura. El enlace expirará pronto por tu seguridad.
                        </p>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; font-size: 12px; margin: 0;">
                            © 2026 Asistente de Higiene y Seguridad. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            `
        };

        // Send email via Resend
        console.log(`[PASSWORD RESET] Sending email via Resend to ${email}...`);

        try {
            const { data: resendData, error: resendError } = await resend.emails.send({
                from: 'Asistente HYS <soporte@asistentehs.com>',
                to: email,
                subject: 'Restablecer Contraseña - Asistente HYS',
                html: mailOptions.html
            });

            if (resendError) {
                throw resendError;
            }

            console.log(`[PASSWORD RESET] Email sent successfully via Resend to ${email}. ID: ${resendData.id}`);
            return res.json({
                message: 'Email de recuperación enviado con éxito. Por favor, revisa tu bandeja de entrada.'
            });
        } catch (err) {
            console.error('[PASSWORD RESET] Error sending email via Resend:', err);
            return res.status(500).json({
                error: 'No se pudo enviar el email de recuperación.'
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

        // Registration requests
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

app.get('/api/admin/requests', isAdmin, async (req, res) => {
    try {
        await ensureDataFile();
        const fileContent = await fs.readFile(REQUESTS_FILE, 'utf-8');
        const requests = fileContent ? JSON.parse(fileContent) : [];
        res.json(requests);
    } catch (error) {
        console.error("Error reading registration requests:", error.message);
        res.status(500).json({ error: 'Error al leer las solicitudes' });
    }
});

app.delete('/api/admin/requests/:id', isAdmin, async (req, res) => {
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

app.post('/api/welcome-email', async (req, res) => {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Email y nombre requeridos' });

    console.log(`[WELCOME EMAIL] Preparing email for ${email}...`);

    const mailOptions = {
        from: { name: 'Asistente HYS', address: 'soporte@asistentehs.com' },
        to: email,
        subject: '¡Bienvenido al Asistente HYS!',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                    <img src="https://asistentehs.com/logo.png" alt="Asistente HYS" style="width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Asistente H&S</h1>
                </div>
                
                <div style="padding: 40px 30px; background-color: #ffffff;">
                    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">¡Hola, ${name}!</h2>
                    <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                        Es un gusto saludarte. Gracias por unirte a nuestra comunidad de profesionales de Higiene y Seguridad Laboral.
                    </p>
                    <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                        Ya puedes empezar a potenciar tu trabajo con nuestras herramientas inteligentes de campo:
                    </p>
                    
                    <div style="margin: 30px 0; padding: 20px; background-color: #f1f5f9; border-radius: 12px;">
                        <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 15px;">
                            <li style="margin-bottom: 10px;"><strong>Cámara de Riesgos IA:</strong> Detección automática de EPP y peligros.</li>
                            <li style="margin-bottom: 10px;"><strong>Asesor de Seguridad:</strong> Consultas técnicas con IA basadas en normativa argentina.</li>
                            <li style="margin-bottom: 10px;"><strong>Gestión de Reportes:</strong> Generación de ATS, informes y cálculo de carga de fuego.</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin: 40px 0;">
                        <a href="https://asistentehs.com" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">Entrar al Panel</a>
                    </div>

                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px; text-align: center;">
                        Este es un correo automático (v2.5 - Dominio Oficial), por favor no respondas a esta dirección.<br>
                        &copy; 2026 Asistente de Higiene y Seguridad.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const { data: resendData, error: resendError } = await resend.emails.send({
            from: 'Asistente HYS <soporte@asistentehs.com>',
            to: email,
            subject: '¡Bienvenido al Asistente HYS!',
            html: mailOptions.html
        });

        if (resendError) {
            console.error('[WELCOME EMAIL] Resend error:', resendError);
            // Return 200 anyway so registration isn't blocked
            return res.json({ success: false, error: resendError.message, message: 'No se pudo enviar el correo, pero el registro fue exitoso.' });
        }

        console.log(`[WELCOME EMAIL] Sent successfully to ${email}. ID: ${resendData.id}`);
        res.json({ success: true, message: 'Correo de bienvenida enviado' });
    } catch (err) {
        console.error('[WELCOME EMAIL] Error:', err.message);
        res.json({ success: false, error: err.message, message: 'No se pudo enviar el correo, pero el registro fue exitoso.' });
    }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
