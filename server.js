import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Resend } from 'resend';

dotenv.config();

// Require Firebase Admin (already in dependencies)
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}

const db = admin.apps.length ? admin.firestore() : null;

// Constants
// ==========================================
// UNIFIED SERVER (API + STATIC) 
// ==========================================
const app = express()

// ==========================================
// SECURITY HEADERS (HELMET)
// ==========================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.gstatic.com", "https://firebase.googleapis.com", "https://apis.google.com"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "img-src": ["'self'", "data:", "https:", "blob:"],
            "connect-src": ["'self'", "https://firebase.googleapis.com", "https://firestore.googleapis.com", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "wss:", "ws:", "https://generativelanguage.googleapis.com"],
            "media-src": ["'self'", "blob:"],
            "object-src": ["'none'"],
            "base-uri": ["'self'"],
            "form-action": ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false, // Often needed for Firebase/Google assets
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));


// CORS — mismo criterio que funciones serverless (api/_cors.js)
function isOriginAllowed(origin) {
    if (!origin) return true;
    const allowedOrigins = [
        'https://asistentehs.com',
        'https://www.asistentehs.com',
        'http://localhost:5173',
        'http://localhost:4173',
        'https://asistentehs-b594e.web.app',
        'https://asistentehs-b594e.firebaseapp.com',
        'http://localhost',
        'https://localhost',
        'capacitor://localhost'
    ];
    return (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://[::1]:') ||
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)
    );
}

app.use(cors({
    origin: function (origin, callback) {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
        return callback(new Error('Origen no autorizado.'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key']
}))
app.use(express.json({ limit: '50mb' })) // Increase limit for images
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// ==========================================
// RATE LIMITING CONFIGURATION
// ==========================================

// General API limiter - 100 requests per minute
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: 'Demasiadas peticiones, intenta de nuevo en un minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/scan-models' // Diagnostic endpoint excluded
});

// Strict limiter for authentication endpoints - 5 requests per minute
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: { error: 'Demasiados intentos. Por seguridad, espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.body?.email || req.ip
});

// AI endpoints limiter - 20 requests per minute (to control costs)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    message: { error: 'Has excedido el límite de peticiones a la IA. Espera un minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use verified UID from Firebase token (set by verifyFirebaseToken middleware).
        // This cannot be spoofed by the client unlike req.body.uid.
        return req.user?.uid || req.ip;
    }
});

// Email endpoints limiter - 3 requests per minute (prevent spam)
const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 requests per 15 minutes
    message: { error: 'Demasiados emails solicitados. Espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.body?.email || req.ip
});

// Admin endpoints limiter - 10 requests per minute
const adminLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: { error: 'Demasiadas peticiones administrativas.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply general limiter to all API routes
app.use('/api', generalLimiter);

// Extra Security Middleware
app.use((req, res, next) => {
    // No cachear respuestas de API
    if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});


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

// Firebase Auth Verification Middleware
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn(`[SECURITY] Blocked unauthenticated AI API request from ${req.ip}`);
        return res.status(401).json({ error: 'Falta el token de autenticación (Unauthorized)' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        if (!admin.apps.length) throw new Error("Firebase Admin no inicializado en servidor");
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken; // Guardamos los datos del usuario verificado en la petición
        next();
    } catch (error) {
        console.error('[SECURITY] Invalid Firebase Token:', error.message);
        return res.status(403).json({ error: 'Token inválido o expirado (Forbidden)' });
    }
};

// Payment endpoint - moderate limiter
app.post('/api/create-subscription', adminLimiter, async (req, res) => {
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

app.post('/api/analyze-image', aiLimiter, verifyFirebaseToken, async (req, res) => {
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

        const base64Data = image.split(',')[1];
        if (!base64Data || base64Data.length < 10) {
            return res.status(400).json({ error: 'La imagen enviada no es válida o está vacía.' });
        }
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Analiza detalladamente esta imagen de un entorno laboral y verifica el uso de Elementos de Protección Personal (EPP) y la existencia de riesgos evidentes. IMPORTANTE: Todas las respuestas, descripciones de riesgos y etiquetas de las cajas delimitadoras de las detecciones deben ser entregadas obligatoriamente en idioma español.`;

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                personDetected: { type: SchemaType.BOOLEAN },
                helmetUsed: { type: SchemaType.BOOLEAN },
                shoesUsed: { type: SchemaType.BOOLEAN },
                glovesUsed: { type: SchemaType.BOOLEAN },
                clothingUsed: { type: SchemaType.BOOLEAN },
                ppeComplete: { type: SchemaType.BOOLEAN },
                foundRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                detections: { 
                    type: SchemaType.ARRAY, 
                    items: { 
                        type: SchemaType.OBJECT,
                        properties: {
                            label: { type: SchemaType.STRING },
                            box_2d: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } }
                        },
                        required: ["label", "box_2d"]
                    } 
                }
            },
            required: ["personDetected", "helmetUsed", "shoesUsed", "glovesUsed", "clothingUsed", "ppeComplete", "foundRisks", "detections"]
        };

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            },
        };

        let result;
        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest"
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
                    safetySettings,
                    systemInstruction: "Eres un experto prevencionista de riesgos laborales. Analiza las imágenes de los puestos de trabajo para detectar uso de EPP y riesgos. Identifica cajas delimitadoras [ymin, xmin, ymax, xmax] normalizadas de 0 a 1000. OBLIGATORIAMENTE todas las etiquetas (label) de las detecciones, riesgos (foundRisks) y textos deben estar en ESPAÑOL (por ejemplo: 'Casco de seguridad', 'Calzado de seguridad', 'Guantes de seguridad', 'Chaleco reflectivo', 'Sin casco', 'Sin chaleco', 'Riesgo eléctrico', etc.). Jamás utilices términos en inglés como 'Helmet', 'Safety Vest', 'Gloves', 'Shoes' o 'Workwear'.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
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
        const parsedData = JSON.parse(responseText);
        res.json(parsedData);

    } catch (error) {
        console.error("Error analyzing image:", error.message);
        res.status(500).json({ error: 'Error analizando la imagen' });
    }
});

// ==========================================
// AI CONTRACTOR DOCUMENT ANALYSIS (Gemini)
// ==========================================
app.post('/api/analyze-contractor-doc', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[ERROR] Missing GEMINI_API_KEY environment variable.");
            return res.status(500).json({ error: 'Falta la API Key de Gemini en el backend' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = image.split(',')[1];
        if (!base64Data || base64Data.length < 10) {
            return res.status(400).json({ error: 'La imagen enviada no es válida o está vacía.' });
        }
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Analiza este documento (puede ser DNI, Certificado de cobertura ART, Seguro de Vida, etc.). Extrae la siguiente información y devuélvela estrictamente estructurada.`;

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                documentType: { type: SchemaType.STRING, description: "DNI, ART, SEGURO, OTRO" },
                name: { type: SchemaType.STRING, description: "Nombre completo de la persona o de la empresa contratista" },
                idNumber: { type: SchemaType.STRING, description: "Número de DNI, CUIT o CUIL extraído" },
                expiryDate: { type: SchemaType.STRING, description: "Fecha de vencimiento en formato YYYY-MM-DD. Si no tiene vencimiento, omitir o dejar vacío." }
            },
            required: ["documentType", "name", "idNumber"]
        };

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            },
        };

        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest"
        ];

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "Eres un experto en lectura de documentos laborales y de identidad. Extraes información precisa ignorando ruido visual. Siempre respondes con fechas en YYYY-MM-DD y números de ID limpios.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });

                const fetchPromise = model.generateContent([prompt, imagePart]);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout local de 25s')), 25000)
                );

                result = await Promise.race([fetchPromise, timeoutPromise]);
                if (result) break;
            } catch (error) {
                lastError = error;
                continue;
            }
        }

        if (!result) {
            console.error("[RECOVERY] Todos los modelos fallaron. Último error:", lastError?.message);
            return res.status(500).json({ error: 'Todos los modelos de IA fallaron' });
        }
        const responseText = result.response.text();
        const parsedData = JSON.parse(responseText);
        res.json(parsedData);

    } catch (error) {
        console.error("Error analyzing contractor doc:", error.message);
        res.status(500).json({ error: 'Error analizando el documento' });
    }
});

app.post('/api/daily-insight', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { country = 'argentina' } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                title: { type: SchemaType.STRING },
                content: { type: SchemaType.STRING },
                category: { type: SchemaType.STRING }
            },
            required: ["title", "content", "category"]
        };

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: `Actúa como un Asesor Senior en Higiene y Seguridad Laboral en ${country}. Genera un "Consejo del Día" breve y profesional. Devuelve obligatoriamente la categoría "Normativa", "Técnico", "Prevención" o "IA".`,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });

        const prompt = `Genera un consejo útil y novedoso aplicable en ${country}. Sea conciso (máximo 140 caracteres el contenido).`;

        const result = await model.generateContent(prompt);
        const parsedData = JSON.parse(result.response.text());

        res.json(parsedData);
    } catch (error) {
        console.error("Error generating daily insight:", error.message);
        res.status(500).json({ error: 'Error generando el consejo diario' });
    }
});

app.post('/api/ai-advisor', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { taskDescription, country = 'argentina' } = req.body;
        if (!taskDescription) return res.status(400).json({ error: 'Falta la descripción de la tarea' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest"
        ];

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                task: { type: SchemaType.STRING },
                riesgos: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                epp: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                recomendaciones: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                normativa: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["task", "riesgos", "epp", "recomendaciones", "normativa"]
        };

        const prompt = `Analiza la siguiente tarea o situación laboral: "${taskDescription}". Identifica riesgos, EPPs necesarios, medidas preventivas y la normativa.`;

        let result;
        for (const modelName of models) {
            try {
                console.log(`[AI ADVISOR] Intentando con ${modelName}...`);
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: `Actúa como un Consultor Senior en Seguridad Laboral de ${country}. Cita SIEMPRE leyes específicas al crear el análisis (ej. Ley 19587 si es Argentina).`,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
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

        const parsedData = JSON.parse(result.response.text());
        res.json(parsedData);

    } catch (error) {
        console.error("Error in AI Advisor:", error.message);
        res.status(500).json({ error: 'Error procesando la consulta' });
    }
});

// ==========================================
// AI EXTINGUISHER VISION (Gemini)
// ==========================================
app.post('/api/analyze-extinguisher', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Analiza esta imagen y verifica si contiene un extintor de incendios (matafuegos). Si NO hay un extintor en la imagen, debes establecer "extinguisherDetected" en false. Si HAY un extintor, establece "extinguisherDetected" en true, identifica su tipo (ABC, CO2, Agua, Espuma, o K), lee la etiqueta para encontrar la capacidad (ej. 5kg, 10kg), el estado ("vigente" o "vencido"), la fecha de último control (lastCheck) y la de próximo vencimiento (nextCheck). También incluye algunas recomendaciones de seguridad. Usa formato YYYY-MM-DD para las fechas si las encuentras, o null si no se pueden leer.`;
        
        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                extinguisherDetected: { type: SchemaType.BOOLEAN },
                type: { type: SchemaType.STRING },
                confidence: { type: SchemaType.NUMBER },
                capacity: { type: SchemaType.STRING },
                status: { type: SchemaType.STRING },
                lastCheck: { type: SchemaType.STRING },
                nextCheck: { type: SchemaType.STRING },
                recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["extinguisherDetected", "type", "confidence", "capacity", "status", "recommendations"]
        };

        const imagePart = { inlineData: { data: base64Data, mimeType } };

        const models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-2.5-flash",
            "gemini-flash-latest"
        ];

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                process.stdout.write(`[AI EXTINGUISHER] Intentando con ${modelName}... `);
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: "Eres un inspector experto en extintores y seguridad contra incendios. Si en la imagen aparece el rostro de una persona o no hay un extintor claramente visible, recházala indicando que no hay extintor. Siempre responde en español.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
                
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 25s expiro')), 25000));
                result = await Promise.race([model.generateContent([prompt, imagePart]), timeoutPromise]);
                if (result) {
                    console.log("ÉXITO ✅");
                    break;
                }
            } catch (err) {
                lastError = err;
                console.log(`FALLÓ ❌ (${err.message})`);
                continue;
            }
        }

        if (!result) {
            throw new Error(lastError?.message || 'Modelos fallaron');
        }

        res.json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error("Error analyzing extinguisher:", error.message);
        res.status(500).json({ error: 'Error en análisis de extintor', details: error.message });
    }
});

// ==========================================
// AI ATS GENERATOR (Gemini)
// ==========================================
app.post('/api/ai-ats-generator', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { taskTitle, country = 'argentina' } = req.body;
        if (!taskTitle) return res.status(400).json({ error: 'Falta el título de la tarea' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest"
        ];

        const responseSchema = {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    paso: { type: SchemaType.STRING },
                    riesgo: { type: SchemaType.STRING },
                    control: { type: SchemaType.STRING }
                },
                required: ["paso", "riesgo", "control"]
            }
        };

        const prompt = `Genera un Análisis de Trabajo Seguro (ATS) cronológico de 4 a 8 pasos para: "${taskTitle}".`;

        let result;
        for (const modelName of models) {
            try {
                console.log(`[AI ATS] Intentando con ${modelName}...`);
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: `Eres supervisor de prevención de riesgos en ${country}. Debes generar los ATS paso a paso basados en las normas locales.`,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
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

        const parsedData = JSON.parse(result.response.text());
        res.json(parsedData);

    } catch (error) {
        console.error("Error in AI ATS Generator:", error.message);
        res.status(500).json({ error: 'Error generando el ATS' });
    }
});

// ==========================================
// AI REPORT CONCLUSION GENERATOR (Gemini)
// ==========================================
app.post('/api/ai-report-conclusion', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { reportType, reportData, country = 'argentina' } = req.body;
        if (!reportType || !reportData) return res.status(400).json({ error: 'Faltan datos del reporte' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.5-flash", "gemini-flash-latest"];

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                conclusion: { type: SchemaType.STRING }
            },
            required: ["conclusion"]
        };

        const prompt = `Analiza los siguientes datos de reporte "${reportType}":\n${JSON.stringify(reportData)}\n\nEscribe la conclusión en un objeto JSON con la llave "conclusion", considerando normativas de ${country}.`;

        let result;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: `Actúa como un perito consultor en Seguridad Laboral (${country}). Redacta conclusiones de reportes formales cortas (2 a 4 párrafos).`,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
                result = await model.generateContent(prompt);
                if (result) break;
            } catch (err) { continue; }
        }
        if (!result) throw new Error('Todos los modelos fallaron');
        res.json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error("Error in AI Conclusion:", error.message);
        res.status(500).json({ error: 'Error generando la conclusión' });
    }
});

// ==========================================
// AI LEGAL SUMMARY (Gemini)
// ==========================================
app.post('/api/ai-legal-summary', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { leyTitle, leyDescription, country = 'argentina' } = req.body;
        if (!leyTitle) return res.status(400).json({ error: 'Faltan datos de la normativa' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.5-flash", "gemini-flash-latest"];

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                summary: { type: SchemaType.STRING }
            },
            required: ["summary"]
        };

        const prompt = `Realiza un resumen de puntos principales en viñetas para la norma operativa "${leyTitle}".\nDescripción corta: "${leyDescription}"`;

        let result;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: `Experto legislativo y abogado de Prevención Riesgos (${country}). Resume leyes y normas aplicables usando markdown de manera fácil de comprender para el trabajador de campo.`,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
                result = await model.generateContent(prompt);
                if (result) break;
            } catch (err) { continue; }
        }
        if (!result) throw new Error('Modelos fallaron');
        res.json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error("Error in AI Legal Summary:", error.message);
        res.status(500).json({ error: 'Error generando resumen' });
    }
});

// ==========================================
// AI GENERAL RISKS VISION (Gemini)
// ==========================================
app.post('/api/ai-stopcard', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { transcript, country = 'argentina' } = req.body;
        if (!transcript) return res.status(400).json({ error: 'Falta transcripción' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.5-flash", "gemini-flash-latest"];

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                type: { type: SchemaType.STRING },
                location: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                actionTaken: { type: SchemaType.STRING }
            },
            required: ["type", "location", "description", "actionTaken"]
        };

        const prompt = `Analiza este reporte de voz de un inspector de seguridad: "${transcript}". Extrae e infiere los datos para una Tarjeta STOP. Clasifícalo en uno de estos: "Condición Insegura", "Acto Inseguro", "Casi Accidente", "Acto Seguro". Extrae la ubicación si se menciona. Da una descripción profesional del hallazgo. Si menciona qué hizo al respecto, ponlo en actionTaken.`;

        let result;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: `Eres un asistente de seguridad laboral en ${country}. Transformas notas de voz informales en reportes estructurados.`,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
                result = await model.generateContent(prompt);
                if (result) break;
            } catch (err) { continue; }
        }
        if (!result) throw new Error('Modelos fallaron');
        res.json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error("Error in AI StopCard:", error.message);
        res.status(500).json({ error: 'Error procesando nota de voz' });
    }
});

// ==========================================
// AI GENERAL RISKS VISION (Gemini)
// ==========================================
app.post('/api/analyze-general-risks', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Analiza detalladamente esta imagen de un entorno laboral para detección general de evidentes riesgos laborales. IMPORTANTE: Todas las respuestas, descripciones de riesgos, recomendaciones y etiquetas de las cajas delimitadoras de las detecciones deben ser entregadas obligatoriamente en idioma español.`;
        
        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                personDetected: { type: SchemaType.BOOLEAN },
                generalAssessment: { type: SchemaType.STRING },
                foundRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                detections: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            label: { type: SchemaType.STRING },
                            box_2d: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } }
                        },
                        required: ["label", "box_2d"]
                    }
                }
            },
            required: ["personDetected", "generalAssessment", "foundRisks", "recommendations", "detections"]
        };

        const imagePart = { inlineData: { data: base64Data, mimeType } };

        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest"
        ];

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                process.stdout.write(`[AI GENERAL RISKS] Intentando con ${modelName}... `);
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: "Detector maestro de riesgos en ESPAÑOL. Encuentra condiciones subestándar (desorden, máquinas sin guardia, extintores bloqueados). OBLIGATORIAMENTE todas las etiquetas (labels), riesgos (foundRisks), recomendaciones (recommendations) y evaluaciones (generalAssessment) deben estar completamente en ESPAÑOL (por ejemplo: 'Riesgo de tropiezo', 'Extintor bloqueado', 'Obstrucción en vía de escape', 'Falta de protección de máquina'). Jamás utilices inglés para los labels o descripciones.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
                
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 25s local expiro')), 25000));
                result = await Promise.race([model.generateContent([prompt, imagePart]), timeoutPromise]);
                if (result) {
                    console.log("ÉXITO ✅");
                    break;
                }
            } catch (err) {
                lastError = err;
                console.log(`FALLÓ ❌ (${err.message})`);
                continue;
            }
        }

        if (!result) {
            throw new Error(lastError?.message || 'Todos los modelos de visión de riesgos fallaron');
        }

        res.json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error("Error analyzing general risks:", error.message);
        res.status(500).json({ error: 'Error en análisis de riesgos', details: error.message });
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

// Password reset - strict limiter (security critical)
app.post('/api/forgot-password', authLimiter, async (req, res) => {
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

// ==========================================
// REGISTRATION REQUESTS API (Firestore)
// ==========================================

app.post('/api/register-request', async (req, res) => {
    try {
        const { name, email, profession, phone } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
        }

        if (!db) {
            console.error('[DATABASE] Firestore not initialized.');
            return res.status(500).json({ error: 'Error interno en la base de datos.' });
        }

        const newRequest = {
            name,
            email,
            profession: profession || '',
            phone: phone || '',
            status: 'pending',
            date: new Date().toISOString()
        };

        const docRef = await db.collection('registration_requests').add(newRequest);
        res.status(201).json({ message: 'Solicitud enviada correctamente', id: docRef.id });
    } catch (error) {
        console.error("Error saving registration request to Firestore:", error);
        res.status(500).json({ error: 'Error al conectar con la base de datos' });
    }
});

app.get('/api/admin/requests', adminLimiter, isAdmin, async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: 'Firestore no inicializado' });
        
        const snapshot = await db.collection('registration_requests')
            .orderBy('date', 'desc')
            .get();
        
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(requests);
    } catch (error) {
        console.error("Error reading registration requests from Firestore:", error.message);
        res.status(500).json({ error: 'Error al leer las solicitudes' });
    }
});

app.delete('/api/admin/requests/:id', adminLimiter, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!db) return res.status(500).json({ error: 'Firestore no inicializado' });
        
        await db.collection('registration_requests').doc(id).delete();
        res.json({ message: 'Solicitud eliminada' });
    } catch (error) {
        console.error("Error deleting registration request from Firestore:", error);
        res.status(500).json({ error: 'Error al eliminar la solicitud' });
    }
});


// Welcome email - email limiter (prevent spam)
app.post('/api/welcome-email', emailLimiter, async (req, res) => {
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

// Inicializar tareas programadas en segundo plano (Cron Jobs)
import('./cron.js').then(module => {
    module.initCronJobs();
}).catch(err => console.error("[CRON] Error cargando cron.js", err));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

app.post('/api/send-expiry-email', async (req, res) => {
    const { email, name, notifications } = req.body;
    if (!email || !notifications || notifications.length === 0) return res.status(400).json({ error: 'Faltan datos' });
    try {
        let html = '<div style="font-family: Arial; padding: 20px;"><h2 style="color: #ef4444;">?? Alertas de Vencimiento</h2><p>Hola ' + (name || '') + ',</p><p>Te informamos sobre los siguientes vencimientos cr�ticos:</p><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #f8fafc;"><th style="padding: 10px; text-align: left;">Tipo</th><th style="padding: 10px; text-align: left;">Elemento</th><th style="padding: 10px; text-align: left;">Estado</th></tr></thead><tbody>';
        notifications.forEach(n => { html += '<tr><td style="padding: 10px; border-bottom: 1px solid #ddd;">' + n.type.toUpperCase() + '</td><td style="padding: 10px; border-bottom: 1px solid #ddd;">' + n.label + '</td><td style="padding: 10px; border-bottom: 1px solid #ddd; color: ' + (n.isExpired ? '#ef4444' : '#f59e0b') + '">' + (n.isExpired ? 'Vencido hace ' + Math.abs(n.daysLeft) + ' d�as' : 'Vence en ' + n.daysLeft + ' d�as') + '</td></tr>'; });
        html += '</tbody></table><p style="margin-top: 30px;"><a href="https://asistentehs.com" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ingresar al Sistema</a></p></div>';
        if (process.env.RESEND_API_KEY) { await resend.emails.send({ from: 'Asistente HYS <soporte@asistentehs.com>', to: email, subject: '?? Tienes ' + notifications.length + ' alertas de vencimiento', html }); } else { console.log('Sin RESEND_API_KEY, correo simulado', html); }
        res.status(200).json({ success: true });
    } catch (e) { console.error('Error email:', e); res.status(500).json({ error: 'Server error' }); }
});

