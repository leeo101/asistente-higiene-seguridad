const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
// SECURITY: Only allow requests from our own domains
const cors = require("cors")({
    origin: [
        'https://asistentehs.com',
        'https://asistentehs-b594e.web.app',
        'https://asistentehs-b594e.firebaseapp.com',
        'http://localhost:5173',   // dev
        'http://localhost:4173'    // preview
    ]
});
const { MercadoPagoConfig, Preference } = require("mercadopago");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();

setGlobalOptions({ 
    maxInstances: 10, 
    region: "us-central1",
    secrets: ["RESEND_API_KEY", "MP_ACCESS_TOKEN", "GEMINI_API_KEY"]
});

// ==========================================
// MERCADO PAGO FUNCTION
// ==========================================
exports.createSubscription = onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            // SECURITY: Require authenticated user
            const authHeader = req.headers.authorization || '';
            if (!authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No autorizado' });
            }
            const idToken = authHeader.split('Bearer ')[1];
            try {
                await admin.auth().verifyIdToken(idToken);
            } catch (e) {
                return res.status(401).json({ error: 'Token inválido' });
            }

            const mpToken = process.env.MP_ACCESS_TOKEN;
            if (!mpToken) return res.status(500).json({ error: 'Configuración de pago no disponible' });

            const client = new MercadoPagoConfig({ accessToken: mpToken });
            const preference = new Preference(client);

            const response = await preference.create({
                body: {
                    items: [{
                        id: 'premium-sub',
                        title: 'Suscripción Mensual Asistente HS Premium',
                        quantity: 1,
                        unit_price: 10,
                        currency_id: 'USD'
                    }],
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
            res.status(500).json({ error: 'Error al crear preferencia de pago' });
        }
    });
});

// ==========================================
// GEMINI AI FUNCTION
// ==========================================
exports.analyzeImage = onRequest({ timeoutSeconds: 300, memory: "1GiB" }, (req, res) => {
    return cors(req, res, async () => {
        try {
            // SECURITY: Require authenticated user
            const authHeader = req.headers.authorization || '';
            if (!authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No autorizado' });
            }
            const idToken = authHeader.split('Bearer ')[1];
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
            } catch (e) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            // Optional: only allow PRO users
            if (!decodedToken.isPro && !decodedToken.admin) {
                // Allow anyway but log for monitoring
                logger.info(`analyzeImage called by non-pro user: ${decodedToken.uid}`);
            }

            const { image } = req.body;
            if (!image) return res.status(400).json({ error: 'No se envió imagen' });

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return res.status(500).json({ error: 'Servicio de IA no disponible' });

            const genAI = new GoogleGenerativeAI(apiKey);
            const safetySettings = [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ];

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
    "helmetUsed": true/false,
    "shoesUsed": true/false,
    "glovesUsed": true/false,
    "clothingUsed": true/false,
    "ppeComplete": true/false,
    "foundRisks": ["Descripción del riesgo 1", "Riesgo 2"],
    "detections": [
        {"label": "Casco", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Calzado", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Guantes", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Riesgo: [Nombre]", "box_2d": [ymin, xmin, ymax, xmax]}
    ]
}
Importante: Las coordenadas [ymin, xmin, ymax, xmax] deben estar normalizadas de 0 a 1000.`;

            const imagePart = { inlineData: { data: base64Data, mimeType } };
            const models = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-1.5-flash"];

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
            res.status(500).json({ error: 'Error al analizar la imagen' });
        }
    });
});

// ==========================================
// PREDICTIVE ACCIDENTS AI
// ==========================================
exports.predictAccidents = onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            // SECURITY: Require authenticated user
            const authHeader = req.headers.authorization || '';
            if (!authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No autorizado' });
            }
            try {
                await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
            } catch (e) {
                return res.status(401).json({ error: 'Token inválido' });
            }

            const { historyData } = req.body;
            if (!historyData || !Array.isArray(historyData)) {
                return res.status(400).json({ error: 'historyData array requerido' });
            }

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key_for_build");
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
Sos un experto analista en higiene y seguridad laboral. Analizá el siguiente historial de accidentes de una empresa y hacé una predicción para el mes próximo.
Historial de accidentes provisto:
${JSON.stringify(historyData.slice(0, 50), null, 2)}

Devolvé tu análisis en formato JSON estricto con la siguiente estructura:
{
  "prediccionPrincipal": "Texto resumen de la predicción principal",
  "zonasRiesgo": ["Zona 1", "Zona 2"],
  "tareasCriticas": ["Tarea 1", "Tarea 2"],
  "recomendaciones": ["Rec 1", "Rec 2"]
}`;

            const result = await model.generateContent(prompt);
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
            logger.error("Error predicting accidents", error);
            res.status(500).json({ error: 'Error al generar predicción' });
        }
    });
});

// ==========================================
// EMERGENCY CHATBOT
// ==========================================
exports.emergencyChat = onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const { message, context, companyContext } = req.body;
            if (!message) return res.status(400).json({ error: 'Mensaje requerido' });

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key_for_build");
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            let systemPrompt = `Sos EmergencyBot, un asistente virtual experto en emergencias, higiene y seguridad (H&S) para trabajadores en Argentina. Respondé de forma CLARA, DIRECTA y TRANQUILIZADORA.
Usa viñetas o listas numeradas si hay pasos a seguir.
Si es una emergencia crítica, remarcá primero "LLAMAR AL 911" o números locales (107 SAME, 100 Bomberos).`;

            if (companyContext) {
                systemPrompt += `\n\nATENCIÓN: Tenés acceso a la siguiente información específica de la empresa del usuario. Úsala para responder mejor a sus dudas sobre recursos internos (ej: dónde hay extintores, qué EPP tienen, accidentes previos):
${companyContext}`;
            }

            const prompt = `Contexto de la emergencia seleccionada por el usuario: ${context}
            
Mensaje del usuario: ${message}`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] }
            });
            
            res.json({ response: result.response.text() });
        } catch (error) {
            logger.error("Error emergency chat", error);
            res.status(500).json({ error: 'Error al procesar el mensaje' });
        }
    });
});

// ==========================================
// VISION ATS
// ==========================================
exports.visionAts = onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            // SECURITY: Require authenticated user
            const authHeader = req.headers.authorization || '';
            if (!authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No autorizado' });
            }
            try {
                await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
            } catch (e) {
                return res.status(401).json({ error: 'Token inválido' });
            }

            const { imageBase64 } = req.body;
            if (!imageBase64) return res.status(400).json({ error: 'Imagen requerida' });

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key_for_build");
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Sos un prevencionista de riesgos laborales. Analizá esta imagen del lugar de trabajo y generá un Análisis de Trabajo Seguro (ATS).
Devolvé UNICAMENTE un JSON array válido con los pasos a seguir, donde cada objeto tenga esta estructura:
[
  { "paso": "Descripción del paso", "riesgo": "Riesgo asociado", "control": "Medida preventiva", "nivelRiesgo": "Bajo|Medio|Alto" }
]`;

            const imagePart = {
                inlineData: {
                    data: imageBase64.split(',')[1] || imageBase64,
                    mimeType: "image/jpeg"
                }
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
            logger.error("Error vision ats", error);
            res.status(500).json({ error: 'Error al analizar la imagen para ATS' });
        }
    });
});

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key_for_build");

// In-memory rate limiter: max 3 requests per email per 10 minutes
const forgotPasswordRateLimit = new Map();

exports.forgotPassword = onRequest((req, res) => {
    return cors(req, res, async () => {
        const { email } = req.body;
        if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email requerido' });

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email inválido' });

        // SECURITY: Rate limiting - max 3 attempts per email per 10 minutes
        const now = Date.now();
        const key = email.toLowerCase();
        const attempts = forgotPasswordRateLimit.get(key) || [];
        const recentAttempts = attempts.filter(t => now - t < 10 * 60 * 1000);
        if (recentAttempts.length >= 3) {
            return res.status(429).json({ error: 'Demasiados intentos. Esperá 10 minutos.' });
        }
        recentAttempts.push(now);
        forgotPasswordRateLimit.set(key, recentAttempts);

        try {
            // SECURITY: Verify email belongs to a registered Firebase user
            let userRecord;
            try {
                userRecord = await admin.auth().getUserByEmail(email);
            } catch (e) {
                // Don't reveal if email exists or not (prevents user enumeration)
                logger.info(`forgotPassword: email not found or error: ${email}`);
                return res.json({ message: 'Si el correo está registrado, recibirás un código.' });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = now + 10 * 60 * 1000; // 10 minutes

            // SECURITY: Store code server-side in Firestore with expiry
            await admin.firestore()
                .collection('passwordResetCodes')
                .doc(userRecord.uid)
                .set({ code, expiresAt, email: email.toLowerCase() });

            const { data, error } = await resend.emails.send({
                from: 'Asistente HYS <soporte@asistentehs.com>',
                to: email,
                subject: 'Código de Seguridad - Asistente HYS',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                            <img src="https://asistentehs.com/logo.png" alt="Asistente HYS" style="width: 80px; height: auto; margin-bottom: 20px;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Asistente H&amp;S</h1>
                        </div>
                        <div style="padding: 40px 30px; background-color: #ffffff;">
                            <h2 style="color: #0f172a; margin-top: 0;">Hola,</h2>
                            <p style="color: #475569; line-height: 1.6;">Has solicitado restablecer tu contraseña en el <strong>Asistente de Higiene y Seguridad</strong>.</p>
                            <div style="margin: 35px 0; text-align: center;">
                                <p style="color: #64748b; font-size: 14px; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Tu Código de Verificación</p>
                                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; display: inline-block; border: 1px dashed #cbd5e1;">
                                    <span style="font-size: 36px; font-weight: 800; color: #1e3a8a; letter-spacing: 8px; font-family: monospace;">${code}</span>
                                </div>
                                <p style="color: #ef4444; font-size: 13px; margin-top: 12px;">Expira en 10 minutos</p>
                            </div>
                            <p style="color: #94a3b8; font-size: 14px; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px;">
                                <strong>¿No solicitaste este cambio?</strong><br>Ignorá este correo. El código expira automáticamente.
                            </p>
                        </div>
                        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 12px; margin: 0;">&copy; 2026 Asistente de Higiene y Seguridad.</p>
                        </div>
                    </div>
                `
            });

            if (error) throw error;
            res.json({ message: 'Si el correo está registrado, recibirás un código.' });
        } catch (error) {
            logger.error("Error sending forgot password email", error);
            res.status(500).json({ error: 'Error al enviar el correo' });
        }
    });
});

// ==========================================
// EXPIRY NOTIFICATIONS CRON JOB
// ==========================================
exports.checkExpirationsJob = onSchedule("every day 08:00", async (event) => {
    logger.info("Iniciando checkExpirationsJob (8:00 AM)...");
    
    function getDaysLeft(dateStr, lifespanMonths) {
        if (!dateStr) return null;
        const base = new Date(dateStr);
        if (isNaN(base.getTime())) return null;
        if (lifespanMonths) {
            base.setMonth(base.getMonth() + Number(lifespanMonths));
        }
        // Normalize today to start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        base.setHours(0, 0, 0, 0);
        
        return Math.ceil((base.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    try {
        const usersSnapshot = await admin.firestore().collection("users").get();
        if (usersSnapshot.empty) {
            logger.info("No hay usuarios registrados.");
            return;
        }

        let totalMessages = 0;

        for (const userDoc of usersSnapshot.docs) {
            const uid = userDoc.id;
            
            // Buscar tokens del usuario
            const tokensSnapshot = await admin.firestore().collection("users").doc(uid).collection("fcmTokens").get();
            if (tokensSnapshot.empty) continue; // No tiene dispositivos registrados para push
            
            const tokens = tokensSnapshot.docs.map(doc => doc.data().token).filter(t => t);
            if (tokens.length === 0) continue;

            const notificationsToSend = [];

            // 1. REVISAR EXTINTORES
            const extDoc = await admin.firestore().collection("users").doc(uid).collection("data").doc("extinguishers_inventory").get();
            if (extDoc.exists) {
                const items = extDoc.data().items || [];
                for (const ext of items) {
                    if (ext.ultimaCarga) {
                        const daysLeft = getDaysLeft(ext.ultimaCarga, 12);
                        if (daysLeft === 0 || daysLeft === 7) {
                            notificationsToSend.push({
                                title: daysLeft === 0 ? "¡Extintor Vencido!" : "Extintor próximo a vencer",
                                body: `El extintor #${ext.chapa} (${ext.ubicacion || 'sin ubicación'}) ${daysLeft === 0 ? 'venció HOY' : 'vence en 7 días'} (Recarga).`,
                                url: "/extinguishers"
                            });
                        }
                    }
                    if (ext.ultimaPH) {
                        const daysLeft = getDaysLeft(ext.ultimaPH, 60);
                        if (daysLeft === 0 || daysLeft === 7) {
                            notificationsToSend.push({
                                title: daysLeft === 0 ? "¡Extintor Vencido!" : "Extintor próximo a vencer",
                                body: `El extintor #${ext.chapa} (${ext.ubicacion || 'sin ubicación'}) ${daysLeft === 0 ? 'venció HOY' : 'vence en 7 días'} (P. Hidráulica).`,
                                url: "/extinguishers"
                            });
                        }
                    }
                }
            }

            // (Se podrían agregar más chequeos para contratistas, EPP, etc. aquí usando el mismo patrón)
            
            // 2. CONTRATISTAS
            const contractorsDoc = await admin.firestore().collection("users").doc(uid).collection("data").doc("contractors_data").get();
            if (contractorsDoc.exists) {
                const items = contractorsDoc.data().items || [];
                for (const c of items) {
                    if (c.documentExpiresAt) {
                        const daysLeft = getDaysLeft(c.documentExpiresAt, 0);
                        if (daysLeft === 0 || daysLeft === 7) {
                            notificationsToSend.push({
                                title: daysLeft === 0 ? "¡Documentación Vencida!" : "Documentación próxima a vencer",
                                body: `La documentación principal del contratista ${c.name} ${daysLeft === 0 ? 'venció HOY' : 'vence en 7 días'}.`,
                                url: "/contractors"
                            });
                        }
                    }
                }
            }

            // 3. PERSONAL DE CONTRATISTAS
            const workersDoc = await admin.firestore().collection("users").doc(uid).collection("data").doc("workers_data").get();
            if (workersDoc.exists) {
                const items = workersDoc.data().items || [];
                for (const w of items) {
                    if (w.artExpiresAt) {
                        const daysLeft = getDaysLeft(w.artExpiresAt, 0);
                        if (daysLeft === 0 || daysLeft === 7) {
                            notificationsToSend.push({
                                title: daysLeft === 0 ? "¡ART Vencida!" : "ART próxima a vencer",
                                body: `La ART de ${w.name} ${daysLeft === 0 ? 'venció HOY' : 'vence en 7 días'}.`,
                                url: "/contractors"
                            });
                        }
                    }
                    if (w.lifeInsuranceExpiresAt) {
                        const daysLeft = getDaysLeft(w.lifeInsuranceExpiresAt, 0);
                        if (daysLeft === 0 || daysLeft === 7) {
                            notificationsToSend.push({
                                title: daysLeft === 0 ? "¡Seguro Vencido!" : "Seguro próximo a vencer",
                                body: `El Seguro de Vida de ${w.name} ${daysLeft === 0 ? 'venció HOY' : 'vence en 7 días'}.`,
                                url: "/contractors"
                            });
                        }
                    }
                }
            }

            // 4. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)
            const ppeDoc = await admin.firestore().collection("users").doc(uid).collection("data").doc("ppe_items").get();
            if (ppeDoc.exists) {
                const items = ppeDoc.data().items || [];
                for (const ppe of items) {
                    if (ppe.purchaseDate && ppe.lifeMonths) {
                        const daysLeft = getDaysLeft(ppe.purchaseDate, ppe.lifeMonths);
                        if (daysLeft === 0 || daysLeft === 7) {
                            notificationsToSend.push({
                                title: daysLeft === 0 ? "¡EPP Vencido!" : "EPP próximo a vencer",
                                body: `El equipo ${ppe.type || ppe.name} entregado a ${ppe.assignedTo || 'alguien'} ${daysLeft === 0 ? 'venció HOY' : 'vence en 7 días'} y requiere recambio.`,
                                url: "/ppe-tracker"
                            });
                        }
                    }
                }
            }

            // 5. CAPACITACIONES (Vencen al año)
            const trainDoc = await admin.firestore().collection("users").doc(uid).collection("data").doc("training_history").get();
            if (trainDoc.exists) {
                const items = trainDoc.data().items || [];
                for (const t of items) {
                    if (t.fecha) {
                        const daysLeft = getDaysLeft(t.fecha, 12);
                        if (daysLeft === 0 || daysLeft === 7) {
                            notificationsToSend.push({
                                title: daysLeft === 0 ? "¡Capacitación Vencida!" : "Renovación de Capacitación",
                                body: `La capacitación "${t.tema}" dictada el ${t.fecha} cumple 1 año ${daysLeft === 0 ? 'HOY' : 'en 7 días'}. Considerar renovación.`,
                                url: "/training"
                            });
                        }
                    }
                }
            }

            // 6. SIMULACROS (Vencen al año)
            const drillDoc = await admin.firestore().collection("users").doc(uid).collection("data").doc("drills_history").get();
            if (drillDoc.exists) {
                const items = drillDoc.data().items || [];
                for (const d of items) {
                    if (d.fecha) {
                        const daysLeft = getDaysLeft(d.fecha, 12);
                        if (daysLeft === 0 || daysLeft === 7) {
                            notificationsToSend.push({
                                title: daysLeft === 0 ? "¡Simulacro Vencido!" : "Simulacro Anual Próximo",
                                body: `El simulacro en ${d.empresa || 'la empresa'} realizado el ${d.fecha} cumple 1 año ${daysLeft === 0 ? 'HOY' : 'en 7 días'}.`,
                                url: "/drills"
                            });
                        }
                    }
                }
            }

            // 7. CALENDARIO DE SEGURIDAD (Eventos)
            const calendarDoc = await admin.firestore().collection("users").doc(uid).collection("data").doc("safety_calendar_events").get();
            if (calendarDoc.exists) {
                const items = calendarDoc.data().items || [];
                for (const ev of items) {
                    if (ev.date) {
                        const daysLeft = getDaysLeft(ev.date, 0);
                        if (daysLeft === 0 || daysLeft === 1) { // 1 día antes y el mismo día
                            notificationsToSend.push({
                                title: daysLeft === 0 ? "¡Evento de Hoy!" : "Evento Mañana",
                                body: `${ev.title}. ${daysLeft === 0 ? 'Hoy' : 'Mañana'}.`,
                                url: "/calendar"
                            });
                        }
                    }
                }
            }

            // Enviar notificaciones si hay alguna
            if (notificationsToSend.length > 0) {
                for (const notif of notificationsToSend) {
                    const message = {
                        notification: {
                            title: notif.title,
                            body: notif.body
                        },
                        data: {
                            url: notif.url,
                            tag: "hys-push"
                        },
                        tokens: tokens
                    };
                    
                    const response = await admin.messaging().sendEachForMulticast(message);
                    logger.info(`Notificaciones enviadas al usuario ${uid}: ${response.successCount} exitosas, ${response.failureCount} fallidas.`);
                    totalMessages += response.successCount;
                }
            }
        }
        
        logger.info(`checkExpirationsJob finalizado. Total mensajes enviados: ${totalMessages}`);
    } catch (error) {
        logger.error("Error en checkExpirationsJob", error);
    }
});

// ==========================================
// WEEKLY SUMMARY EMAIL CRON JOB
// ==========================================
exports.weeklySummaryEmail = onSchedule("0 9 * * 1", async (event) => { // Every Monday at 9:00 AM
    logger.info("Iniciando weeklySummaryEmail...");
    try {
        const usersSnapshot = await admin.firestore().collection("users").get();
        if (usersSnapshot.empty) return;

        let sentCount = 0;
        for (const userDoc of usersSnapshot.docs) {
            const uid = userDoc.id;
            const userData = userDoc.data();
            const email = userData.email;
            
            if (!email) continue;
            // Only send to pro users (if you track that, else to all for now)
            
            const { data, error } = await resend.emails.send({
                from: 'Asistente HYS <soporte@asistentehs.com>',
                to: email,
                subject: 'Tu Resumen Semanal de H&S',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 12px;">
                        <h2 style="color: #1e3a8a;">Resumen Semanal de Seguridad</h2>
                        <p>Hola,</p>
                        <p>Aquí tienes el resumen de tu gestión de Higiene y Seguridad de la última semana. Accede a la plataforma para ver más detalles y predicciones de riesgos actualizadas.</p>
                        <div style="margin-top: 20px; padding: 15px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <p style="margin:0;">✅ Entrá a tu <strong>Asistente HYS</strong> para revisar alertas críticas.</p>
                        </div>
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">Asistente HYS - 2026</p>
                    </div>
                `
            });
            if (!error) sentCount++;
        }
        logger.info(`weeklySummaryEmail enviado a ${sentCount} usuarios.`);
    } catch (error) {
        logger.error("Error en weeklySummaryEmail", error);
    }
});

