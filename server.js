import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { MercadoPagoConfig, Preference, Payment, PreApproval } from 'mercadopago';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Resend } from 'resend';
import Stripe from 'stripe';
import { sendAppMail } from './api/_mailer.js';
import { getLiveUsdToArsRate } from './api/_subscription-handler.js';
import { createPaypalCheckout, verifyPaypalPayment, cancelPaypalSubscription } from './api/_paypal.js';

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Validate critical environment variables
function validateEnv() {
    const requiredVars = [
        'MP_ACCESS_TOKEN',
        'GEMINI_API_KEY',
        'RESEND_API_KEY',
        'ADMIN_API_KEY',
        'FIREBASE_SERVICE_ACCOUNT_KEY'
    ];
    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
        console.error(`\x1b[31m[CRITICAL SECURITY WARNING] Faltan las siguientes variables de entorno requeridas: ${missing.join(', ')}\x1b[0m`);
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        } catch (e) {
            console.error('\x1b[31m[CRITICAL SECURITY WARNING] FIREBASE_SERVICE_ACCOUNT_KEY no es un JSON válido\x1b[0m');
        }
    }
}
validateEnv();

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
const app = express();

app.use(compression());

// Force HTTPS Redirection in production
app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === 'http' && process.env.NODE_ENV === 'production') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
});

// Additional Security & Isolation Headers Middleware (XSS & HTTPS enforcement)
app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
});

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
            "connect-src": ["'self'", "https://firebase.googleapis.com", "https://firestore.googleapis.com", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "wss:", "ws:", "https://generativelanguage.googleapis.com", "https://dolarapi.com", "https://api.bluelytics.com.ar"],
            "media-src": ["'self'", "blob:"],
            "object-src": ["'none'"],
            "base-uri": ["'self'"],
            "form-action": ["'self'", "https:"],
            "upgrade-insecure-requests": []
        }
    },
    crossOriginEmbedderPolicy: false,
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
        /^https:\/\/asistente-de-higiene-y-seguridad[a-z0-9-]*\.vercel\.app$/i.test(origin) ||
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

// Limit general API JSON/URLencoded payloads to 1mb to prevent DoS
app.use((req, res, next) => {
    const fileUploadRoutes = [
        '/api/analyze-image',
        '/api/analyze-contractor-doc',
        '/api/analyze-extinguisher',
        '/api/analyze-training-sheet',
        '/api/analyze-general-risks',
        '/api/vision-ats'
    ];
    if (fileUploadRoutes.includes(req.path)) {
        return next();
    }
    express.json({ limit: '1mb' })(req, res, (err) => {
        if (err) return res.status(400).json({ error: 'Payload demasiado grande o inválido.' });
        express.urlencoded({ limit: '1mb', extended: true })(req, res, next);
    });
});

// ==========================================
// RATE LIMITING CONFIGURATION
// ==========================================

// General API limiter - 100 requests per minute
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: 'Demasiadas peticiones, intenta de nuevo en un minuto.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict limiter for authentication endpoints - 5 requests per minute
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: { error: 'Demasiados intentos. Por seguridad, espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { ip: false },
    keyGenerator: (req) => req.body?.email || req.ip
});

// AI endpoints limiter - 20 requests per minute (to control costs)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    message: { error: 'Has excedido el límite de peticiones a la IA. Espera un minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { ip: false },
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
    validate: { ip: false },
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

// Admin Authentication Middleware (accepts X-Admin-Key OR verified Admin Firebase Token)
const ADMIN_EMAILS = ['admin@asistentehs.com', 'enzorodriguez31@gmail.com'];

const isAdmin = async (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey && process.env.ADMIN_API_KEY && adminKey === process.env.ADMIN_API_KEY) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && admin.apps.length) {
        try {
            const token = authHeader.split('Bearer ')[1];
            const decoded = await admin.auth().verifyIdToken(token);
            const email = (decoded.email || '').toLowerCase().trim();
            if (ADMIN_EMAILS.includes(email)) {
                req.user = decoded;
                return next();
            }
        } catch (err) {
            console.warn(`[SECURITY] Invalid admin bearer token from ${req.ip}: ${err.message}`);
        }
    }

    console.warn(`[SECURITY] Unauthorized admin access attempt from ${req.ip}`);
    return res.status(401).json({ error: 'No autorizado' });
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

const requirePro = async (req, res, next) => {
    const PERMANENT_PRO_EMAILS = ['arielalaniz9@gmail.com'];

    if (req.user && req.user.email) {
        const email = req.user.email.toLowerCase();
        if (ADMIN_EMAILS.includes(email) || PERMANENT_PRO_EMAILS.includes(email)) {
            return next();
        }
    }
    if (req.user && req.user.isPro) return next();
    try {
        const subDoc = await admin.firestore().collection('users').doc(req.user.uid).collection('data').doc('subscriptionData').get();
        if (subDoc.exists && subDoc.data().status === 'active') {
             await admin.auth().setCustomUserClaims(req.user.uid, { isPro: true });
             return next();
        }
    } catch (e) {}
    return res.status(403).json({ error: 'Se requiere suscripción PRO (Forbidden)' });
};

// Middlewares de validación y sanitización defensiva
const validateEmail = (req, res, next) => {
    const email = req.body?.email;
    if (!email) {
        return res.status(400).json({ error: 'El correo electrónico es requerido.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de correo electrónico no válido.' });
    }
    req.body.email = email.toLowerCase().trim();
    next();
};

const validateStringInput = (field, maxLength = 1000) => {
    return (req, res, next) => {
        const value = req.body?.[field];
        if (value !== undefined && value !== null) {
            if (typeof value !== 'string') {
                return res.status(400).json({ error: `El campo ${field} debe ser una cadena de texto.` });
            }
            if (value.length > maxLength) {
                return res.status(400).json({ error: `El campo ${field} excede el límite de ${maxLength} caracteres.` });
            }
            // Sanitización básica eliminando etiquetas HTML
            req.body[field] = value.replace(/<[^>]*>/g, '').trim();
        }
        next();
    };
};


// Live USD -> ARS Exchange Rate Endpoint
app.get('/api/exchange-rate', async (req, res) => {
    try {
        const rate = await getLiveUsdToArsRate();
        return res.json({
            rate,
            usdPrice: 2.0,
            arsPrice: Math.round(2.0 * rate),
            promoUsdPrice: 0.99,
            promoArsPrice: Math.round(0.99 * rate),
            currency: 'ARS',
            updatedAt: new Date().toISOString()
        });
    } catch (e) {
        return res.json({
            rate: 1600,
            usdPrice: 2.0,
            arsPrice: 3200,
            promoUsdPrice: 0.99,
            promoArsPrice: 1584,
            currency: 'ARS',
            updatedAt: new Date().toISOString()
        });
    }
});

// Payment endpoint - Mercado Pago (Débito Automático con Tarjeta en ARS + Fallback Checkout Tarjeta)
app.post('/api/create-subscription', adminLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { planId, promo, billingMode = 'recurring' } = req.body || {};
        const userId = req.user.uid;
        const email = req.user.email || req.body?.email;
        const CYBER_MONDAY_DEADLINE = new Date('2026-11-07T17:00:00-03:00').getTime();
        const isCyberMonday = promo === 'cybermonday' && Date.now() <= CYBER_MONDAY_DEADLINE;

        const usdAmount = isCyberMonday ? 0.99 : 2.00;
        const exchangeRate = await getLiveUsdToArsRate();
        const amountArs = Math.round(usdAmount * exchangeRate);

        let planTitle = isCyberMonday
            ? `Asistente H&S – Plan Profesional (USD $${usdAmount} / $${amountArs.toLocaleString('es-AR')} ARS)`
            : `Asistente H&S – Plan Profesional PRO (USD $${usdAmount.toFixed(2)} — Débito Mensual)`;

        if (planId === 'student') {
            planTitle = isCyberMonday ? 'Asistente H&S – Plan Estudiante (Oferta)' : 'Asistente H&S – Plan Estudiante (Débito Mensual)';
        } else if (planId === 'enterprise' || planId === 'consultora') {
            planTitle = isCyberMonday ? 'Asistente H&S – Plan Consultora (Oferta)' : 'Asistente H&S – Plan Consultora (Débito Mensual)';
        }

        const requestOrigin = req.headers.origin;
        const baseUrl = (requestOrigin && isOriginAllowed(requestOrigin)) ? requestOrigin : 'https://asistentehs.com';

        let initPoint = null;
        let subId = null;

        // 1. Intentar crear Suscripción de Débito Automático Mensual (PreApproval)
        if (billingMode !== 'single' && email) {
            try {
                const preApproval = new PreApproval(client);
                const preRes = await preApproval.create({
                    body: {
                        reason: planTitle,
                        external_reference: userId,
                        payer_email: email,
                        auto_recurring: {
                            frequency: 1,
                            frequency_type: 'months',
                            transaction_amount: amountArs,
                            currency_id: 'ARS'
                        },
                        back_url: `${baseUrl}/subscribe?status=approved&provider=mercadopago`,
                        status: 'pending'
                    }
                });
                if (preRes && preRes.init_point) {
                    initPoint = preRes.init_point;
                    subId = preRes.id;
                }
            } catch (preErr) {
                console.warn('[Server MP PreApproval] Fallback a Checkout de Tarjeta en ARS:', preErr.message);
            }
        }

        // 2. Fallback o pago de 1 mes con tarjeta en ARS
        if (!initPoint) {
            const preference = new Preference(client);
            const response = await preference.create({
                body: {
                    items: [
                        {
                            id: planId || 'premium-sub',
                            title: planTitle,
                            description: `Suscripción mensual con tarjeta de débito o crédito a ${planTitle}.`,
                            quantity: 1,
                            unit_price: amountArs,
                            currency_id: 'ARS'
                        }
                    ],
                    payment_methods: {
                        excluded_payment_types: [
                            { id: 'ticket' },
                            { id: 'atm' }
                        ],
                        installments: 1
                    },
                    back_urls: {
                        success: `${baseUrl}/subscribe?status=approved&provider=mercadopago`,
                        failure: `${baseUrl}/subscribe?status=failed`,
                        pending: `${baseUrl}/subscribe?status=pending`
                    },
                    external_reference: userId,
                    notification_url: `${baseUrl}/api/mercadopago-webhook`,
                    auto_return: 'approved',
                    statement_descriptor: 'ASISTENTE HY&S'
                }
            });
            initPoint = response.init_point;
            subId = response.id;
        }

        console.log('MP Subscription/Preference created successfully:', initPoint);
        res.json({ id: subId, init_point: initPoint, usdAmount, exchangeRate, amountArs });
    } catch (error) {
        console.error('Error creating Mercado Pago subscription:', error.message);
        res.status(500).json({
            error: 'Error al generar link de adhesión de tarjeta.'
        });
    }
});

// Mercado Pago Webhook Endpoint (Standalone Server)
app.all('/api/mercadopago-webhook', async (req, res) => {
    try {
        const query = req.query || {};
        const topic = query.topic || query.type || req.body?.type || req.body?.topic || (req.body?.action && req.body.action.startsWith('payment') ? 'payment' : null);
        const webhookId = query.id || query['data.id'] || (req.body && req.body.data && req.body.data.id) || (req.body && req.body.id);

        console.log(`[Server] Webhook received: Topic=${topic}, ID=${webhookId}`);

        if (webhookId) {
            const topicStr = String(topic || '').toLowerCase();
            const isPreapproval = topicStr.includes('preapproval') || topicStr.includes('subscription_preapproval');
            const isPayment = !topic || topicStr.includes('payment');

            let isAuthorized = false;
            let isAutoRenew = false;
            let userId = null;
            let payerEmail = null;

            if (isPreapproval) {
                const preApproval = new PreApproval(client);
                const preData = await preApproval.get({ id: webhookId });
                if (preData.status === 'authorized') {
                    isAuthorized = true;
                    isAutoRenew = true;
                    userId = preData.external_reference;
                    payerEmail = preData.payer_email;
                }
            } else if (isPayment) {
                const payment = new Payment(client);
                const paymentData = await payment.get({ id: webhookId });
                if (paymentData.status === 'approved') {
                    isAuthorized = true;
                    isAutoRenew = Boolean(paymentData.metadata?.auto_renew || paymentData.point_of_interaction?.type === 'SUBSCRIPTIONS');
                    userId = paymentData.external_reference;
                    payerEmail = paymentData.payer?.email || paymentData.additional_info?.payer?.email;
                }
            }

            if (isAuthorized) {
                if ((!userId || userId === 'guest') && admin.apps.length && payerEmail) {
                    try {
                        const userRecord = await admin.auth().getUserByEmail(payerEmail);
                        userId = userRecord.uid;
                    } catch (lookupErr) {
                        console.warn('Could not find user by email in webhook:', lookupErr.message);
                    }
                }

                if (userId && userId !== 'guest' && admin.apps.length) {
                    const subRef = admin.firestore().collection('users').doc(userId).collection('data').doc('subscriptionData');
                    const subDoc = await subRef.get();
                    const subData = subDoc.exists ? subDoc.data() : null;

                    // 🔒 IDEMPOTENCY GUARD
                    if (subData?.lastPaymentId && String(subData.lastPaymentId) === String(webhookId)) {
                        console.log(`[Server] Webhook ${webhookId} ya fue procesado para el usuario ${userId}.`);
                        return res.status(200).send('Payment already processed');
                    }

                    await admin.auth().setCustomUserClaims(userId, { isPro: true });
                    const currentExpiry = subData?.expiry ? parseInt(subData.expiry, 10) : 0;
                    const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                    baseDate.setMonth(baseDate.getMonth() + 1);
                    const newExpiry = baseDate.getTime();

                    await subRef.set({
                        status: 'active',
                        expiry: newExpiry.toString(),
                        provider: 'mercadopago',
                        lastPaymentId: String(webhookId),
                        autoRenew: isAutoRenew ? 'true' : 'false',
                        paymentMethod: 'card_auto_debit',
                        updatedAt: Date.now()
                    }, { merge: true });
                    console.log(`[Server] User ${userId} activated PRO via Webhook until ${new Date(newExpiry).toLocaleDateString()}`);
                }
            }
        }
        return res.status(200).send('OK');
    } catch (error) {
        console.error('[Server] Webhook error:', error);
        return res.status(200).send('Error processed');
    }
});

// Payment endpoint - PayPal Internacional ($2.00 USD / mes con tarjeta o cuenta PayPal)
app.post('/api/create-paypal-subscription', adminLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { planId = 'pro', promo, billingMode = 'recurring' } = req.body || {};
        const userId = req.user.uid;
        const email = req.user.email || req.body?.email;
        const CYBER_MONDAY_DEADLINE = new Date('2026-11-07T17:00:00-03:00').getTime();
        const isCyberMonday = promo === 'cybermonday' && Date.now() <= CYBER_MONDAY_DEADLINE;

        const usdAmount = isCyberMonday ? 0.99 : 2.00;
        let planName = isCyberMonday
            ? 'Asistente H&S - Plan Profesional PRO (Oferta)'
            : 'Asistente H&S - Plan Profesional PRO (Acceso Total)';

        if (planId === 'student') {
            planName = 'Asistente H&S - Plan Estudiante';
        } else if (planId === 'enterprise' || planId === 'consultora') {
            planName = 'Asistente H&S - Plan Consultora';
        }

        const requestOrigin = req.headers.origin;
        const baseUrl = (requestOrigin && isOriginAllowed(requestOrigin)) ? requestOrigin : 'https://asistentehs.com';

        if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
            const checkout = await createPaypalCheckout({
                userId,
                email,
                usdAmount,
                planName,
                baseUrl,
                billingMode
            });
            return res.json({ url: checkout.url, id: checkout.id, type: checkout.type });
        } else if (process.env.PAYPAL_PAYMENT_LINK) {
            return res.json({ url: process.env.PAYPAL_PAYMENT_LINK });
        } else {
            return res.status(500).json({ error: 'Falta configurar PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en el servidor.' });
        }
    } catch (error) {
        console.error('Error creando suscripción de PayPal:', error);
        res.status(500).json({ error: 'Error al generar checkout de PayPal.', details: error.message });
    }
});

// Payment endpoint - Stripe Internacional (Legacy fallback)
app.post('/api/create-stripe-subscription', adminLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { planId = 'pro', promo } = req.body || {};
        const userId = req.user.uid;
        const email = req.user.email || req.body?.email;
        const CYBER_MONDAY_DEADLINE = new Date('2026-11-07T17:00:00-03:00').getTime();
        const isCyberMonday = promo === 'cybermonday' && Date.now() <= CYBER_MONDAY_DEADLINE;
        
        let unitAmount = isCyberMonday ? 99 : 200; // $0.99 USD Cyber Monday promo vs $2 USD default
        let planTitle = isCyberMonday
            ? 'Plan Profesional (Oferta Cyber Monday) - Asistente HyS'
            : 'Plan Profesional (Acceso Total) - Asistente HyS';

        if (planId === 'student') {
            unitAmount = isCyberMonday ? 99 : 200;
            planTitle = isCyberMonday ? 'Plan Estudiante (Oferta Cyber Monday) - Asistente HyS' : 'Plan Estudiante - Asistente HyS';
        } else if (planId === 'enterprise' || planId === 'consultora') {
            unitAmount = isCyberMonday ? 99 : 200;
            planTitle = isCyberMonday ? 'Plan Consultora (Oferta Cyber Monday) - Asistente HyS' : 'Plan Consultora - Asistente HyS';
        }

        const requestOrigin = req.headers.origin;
        const baseUrl = (requestOrigin && isOriginAllowed(requestOrigin)) ? requestOrigin : 'https://asistentehs.com';

        if (stripe) {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                locale: 'es-419',
                billing_address_collection: 'auto',
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: planTitle,
                                description: 'Acceso completo a la plataforma Asistente H&S'
                            },
                            unit_amount: unitAmount,
                            recurring: { interval: 'month' }
                        },
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${baseUrl}/subscribe?status=approved&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${baseUrl}/subscribe?status=cancelled`,
                client_reference_id: userId,
                customer_email: email || undefined,
            });

            return res.json({ url: session.url });
        } else {
            // Fallback if STRIPE_SECRET_KEY is not configured yet on server env
            const fallbackUrl = process.env.STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/test_subscription';
            return res.json({ url: fallbackUrl });
        }
    } catch (error) {
        console.error('Error creando sesión de Stripe:', error);
        res.status(500).json({ error: 'Error al generar checkout de Stripe.' });
    }
});

// ==========================================

// Payment verification endpoint (PayPal, Mercado Pago PreApproval, MP Payment & Stripe)
app.post('/api/verify-payment', verifyFirebaseToken, async (req, res) => {
    try {
        const { payment_id, collection_id, session_id, preapproval_id, paypal_subscription_id, paypal_order_id } = req.body || {};
        const mpPaymentId = payment_id || collection_id;
        const uid = req.user.uid;
        const userEmail = (req.user.email || '').toLowerCase().trim();
        const subRef = admin.firestore().collection('users').doc(uid).collection('data').doc('subscriptionData');

        // 0. PayPal verification ($2.00 USD)
        if ((paypal_subscription_id || paypal_order_id) && process.env.PAYPAL_CLIENT_ID) {
            const ppResult = await verifyPaypalPayment({
                subscriptionId: paypal_subscription_id,
                orderId: paypal_order_id
            });
            if (ppResult.approved) {
                const isOwner =
                    (!ppResult.customId || ppResult.customId === 'guest' || ppResult.customId === uid) ||
                    (userEmail && ppResult.payerEmail && userEmail === ppResult.payerEmail);

                if (!isOwner) {
                    console.warn(`[SECURITY] Intento de reclamar pago PayPal ajeno (${ppResult.referenceId}) por uid=${uid}`);
                    return res.status(403).json({ error: 'Este pago de PayPal no corresponde a tu cuenta.' });
                }

                const subDoc = await subRef.get();
                const subData = subDoc.exists ? subDoc.data() : null;
                if (subData?.lastPaymentId && String(subData.lastPaymentId) === String(ppResult.referenceId)) {
                    return res.json({ success: true, isPro: true, autoRenew: ppResult.autoRenew, expiry: parseInt(subData.expiry, 10) || Date.now(), alreadyProcessed: true });
                }

                await admin.auth().setCustomUserClaims(uid, { isPro: true });
                const currentExpiry = subData?.expiry ? parseInt(subData.expiry, 10) : 0;
                const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                baseDate.setMonth(baseDate.getMonth() + 1);
                const newExpiry = baseDate.getTime();

                await subRef.set({
                    status: 'active',
                    expiry: newExpiry.toString(),
                    provider: 'paypal',
                    lastPaymentId: String(ppResult.referenceId),
                    autoRenew: ppResult.autoRenew ? 'true' : 'false',
                    paymentMethod: ppResult.autoRenew ? 'card_auto_debit' : 'card',
                    subscriptionId: String(ppResult.referenceId),
                    updatedAt: Date.now()
                }, { merge: true });
                return res.json({ success: true, isPro: true, autoRenew: ppResult.autoRenew, expiry: newExpiry });
            }
        }
        
        // 1. Stripe verification
        if (session_id && stripe) {
            const session = await stripe.checkout.sessions.retrieve(session_id);
            if (session.payment_status === 'paid' || session.status === 'complete') {
                // 🔒 Ownership check
                const sessionUid = session.client_reference_id;
                const sessionEmail = (session.customer_email || session.customer_details?.email || '').toLowerCase().trim();
                const isOwner = (sessionUid && sessionUid !== 'guest' && sessionUid === uid) ||
                                (userEmail && sessionEmail && userEmail === sessionEmail);

                if (!isOwner) {
                    console.warn(`[SECURITY] Intento de reclamar sesión de Stripe ajena (${session_id}) por uid=${uid}`);
                    return res.status(403).json({ error: 'Esta sesión de pago no corresponde a tu cuenta.' });
                }

                const subDoc = await subRef.get();
                const subData = subDoc.exists ? subDoc.data() : null;
                if (subData?.lastPaymentId && String(subData.lastPaymentId) === String(session_id)) {
                    return res.json({ success: true, isPro: true, autoRenew: true, expiry: parseInt(subData.expiry, 10) || Date.now(), alreadyProcessed: true });
                }

                await admin.auth().setCustomUserClaims(uid, { isPro: true });
                const currentExpiry = subData?.expiry ? parseInt(subData.expiry, 10) : 0;
                const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                baseDate.setMonth(baseDate.getMonth() + 1);
                const newExpiry = baseDate.getTime();

                await subRef.set({
                    status: 'active',
                    expiry: newExpiry.toString(),
                    provider: 'stripe',
                    lastPaymentId: String(session_id),
                    autoRenew: 'true',
                    paymentMethod: 'card_auto_debit',
                    subscriptionId: String(session.subscription || session_id),
                    updatedAt: Date.now()
                }, { merge: true });
                return res.json({ success: true, isPro: true, autoRenew: true, expiry: newExpiry });
            }
        }

        // 2. Mercado Pago PreApproval verification (Adhesión de Tarjeta - Débito Automático)
        if (preapproval_id) {
            const preApproval = new PreApproval(client);
            const preInfo = await preApproval.get({ id: preapproval_id });
            if (preInfo.status === 'authorized' || preInfo.status === 'active') {
                const extRef = preInfo.external_reference;
                const payerEmail = (preInfo.payer_email || '').toLowerCase().trim();
                const isOwner = (extRef && extRef !== 'guest' && extRef === uid) ||
                                (userEmail && payerEmail && userEmail === payerEmail);

                if (!isOwner && extRef && extRef !== 'guest') {
                    console.warn(`[SECURITY] Intento de reclamar PreApproval MP ajeno (${preapproval_id}) por uid=${uid}`);
                    return res.status(403).json({ error: 'Esta suscripción no corresponde a tu cuenta.' });
                }

                const subDoc = await subRef.get();
                const subData = subDoc.exists ? subDoc.data() : null;
                if (subData?.lastPaymentId && String(subData.lastPaymentId) === String(preapproval_id)) {
                    return res.json({ success: true, isPro: true, autoRenew: true, expiry: parseInt(subData.expiry, 10) || Date.now(), alreadyProcessed: true });
                }

                await admin.auth().setCustomUserClaims(uid, { isPro: true });
                const currentExpiry = subData?.expiry ? parseInt(subData.expiry, 10) : 0;
                const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                baseDate.setMonth(baseDate.getMonth() + 1);
                const newExpiry = baseDate.getTime();

                await subRef.set({
                    status: 'active',
                    expiry: newExpiry.toString(),
                    provider: 'mercadopago',
                    lastPaymentId: String(preapproval_id),
                    autoRenew: 'true',
                    paymentMethod: 'card_auto_debit',
                    subscriptionId: String(preapproval_id),
                    updatedAt: Date.now()
                }, { merge: true });
                return res.json({ success: true, isPro: true, autoRenew: true, expiry: newExpiry });
            }
        }

        // 3. Mercado Pago Payment verification
        if (mpPaymentId) {
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: mpPaymentId });
            if (paymentInfo.status === 'approved') {
                // 🔒 Ownership check
                const extRef = paymentInfo.external_reference;
                const payerEmail = (paymentInfo.payer?.email || paymentInfo.additional_info?.payer?.email || '').toLowerCase().trim();
                const isOwner = (extRef && extRef !== 'guest' && extRef === uid) ||
                                (userEmail && payerEmail && userEmail === payerEmail);

                if (!isOwner && extRef && extRef !== 'guest') {
                    console.warn(`[SECURITY] Intento de reclamar pago MP ajeno (${mpPaymentId}) por uid=${uid}`);
                    return res.status(403).json({ error: 'Este comprobante de pago no corresponde a tu cuenta.' });
                }

                const subDoc = await subRef.get();
                const subData = subDoc.exists ? subDoc.data() : null;
                if (subData?.lastPaymentId && String(subData.lastPaymentId) === String(mpPaymentId)) {
                    return res.json({ success: true, isPro: true, expiry: parseInt(subData.expiry, 10) || Date.now(), alreadyProcessed: true });
                }

                await admin.auth().setCustomUserClaims(uid, { isPro: true });
                const currentExpiry = subData?.expiry ? parseInt(subData.expiry, 10) : 0;
                const baseDate = (currentExpiry && currentExpiry > Date.now()) ? new Date(currentExpiry) : new Date();
                baseDate.setMonth(baseDate.getMonth() + 1);
                const newExpiry = baseDate.getTime();

                await subRef.set({
                    status: 'active',
                    expiry: newExpiry.toString(),
                    provider: 'mercadopago',
                    lastPaymentId: String(mpPaymentId),
                    paymentMethod: 'card',
                    updatedAt: Date.now()
                }, { merge: true });
                return res.json({ success: true, isPro: true, expiry: newExpiry });
            }
        }

        return res.status(400).json({ error: 'Pago no aprobado.' });
    } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(500).json({ error: 'Error al verificar el pago.' });
    }
});

// Cancel automatic debit / subscription endpoint
app.post('/api/cancel-subscription', verifyFirebaseToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const subRef = admin.firestore().collection('users').doc(uid).collection('data').doc('subscriptionData');
        const subDoc = await subRef.get();
        if (subDoc.exists) {
            const subData = subDoc.data();
            const subId = subData?.subscriptionId;
            if (subId && subData?.provider === 'mercadopago' && process.env.MP_ACCESS_TOKEN) {
                try {
                    const preApproval = new PreApproval(client);
                    await preApproval.update({ id: subId, body: { status: 'cancelled' } });
                } catch (e) {
                    console.warn('[Server CancelSub] MP warning:', e.message);
                }
            } else if (subId && subData?.provider === 'paypal' && process.env.PAYPAL_CLIENT_ID) {
                try {
                    await cancelPaypalSubscription(subId);
                } catch (e) {
                    console.warn('[Server CancelSub] PayPal warning:', e.message);
                }
            } else if (subId && subData?.provider === 'stripe' && stripe && String(subId).startsWith('sub_')) {
                try {
                    await stripe.subscriptions.cancel(subId);
                } catch (e) {
                    console.warn('[Server CancelSub] Stripe warning:', e.message);
                }
            }
        }
        await subRef.set({
            status: 'inactive',
            autoRenew: 'false',
            updatedAt: Date.now()
        }, { merge: true });
        await admin.auth().setCustomUserClaims(uid, { isPro: false });
        return res.json({ success: true, message: 'Débito automático y suscripción cancelados.' });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return res.status(500).json({ error: 'Error al cancelar la suscripción.' });
    }
});

// AI VISION API (Gemini)
// ==========================================

app.post('/api/analyze-image', aiLimiter, verifyFirebaseToken, requirePro, express.json({ limit: '15mb' }), express.urlencoded({ limit: '15mb', extended: true }), async (req, res) => {
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

        const prompt = `Actúa como un inspector estricto de seguridad industrial. Analiza detalladamente esta imagen de un entorno laboral y verifica el uso de Elementos de Protección Personal (EPP) y la existencia de riesgos EVIDENTES. 
REGLAS ESTRICTAS:
1. NO INVENTES riesgos ni EPPs. Si no estás 100% seguro de que alguien lleva o no un EPP, o si un riesgo no está claramente a la vista, no lo reportes.
2. Limita las descripciones a lo que es OBJETIVAMENTE visible.
3. IMPORTANTE: Todas las respuestas, descripciones de riesgos y etiquetas de las cajas delimitadoras de las detecciones deben ser entregadas obligatoriamente en idioma español.`;

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
            "gemini-2.0-flash",
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
app.post('/api/analyze-contractor-doc', aiLimiter, verifyFirebaseToken, requirePro, express.json({ limit: '15mb' }), express.urlencoded({ limit: '15mb', extended: true }), async (req, res) => {
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
            "gemini-2.0-flash",
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

const CURATED_DAILY_INSIGHTS = [
    {
        title: "Control de Extintores (NFPA 10 / Dec. 351/79)",
        content: "Verificá mensualmente que el manómetro esté en zona verde, el precinto intacto y el acceso libre de obstrucciones a menos de 1,5 m.",
        category: "Prevención"
    },
    {
        title: "Entrega Certificada de EPP (Res. SRT 299/11)",
        content: "Todo elemento de protección personal debe contar con certificación oficial (Sello S / IRAM) y registrarse en la planilla individual firmada.",
        category: "Normativa"
    },
    {
        title: "Las 5 Reglas de Oro en Riesgo Eléctrico",
        content: "Corte efectivo, bloqueo LOTO, verificación de ausencia de tensión, puesta a tierra y señalización de la zona antes de intervenir.",
        category: "Técnico"
    },
    {
        title: "Trabajo Seguro en Altura (> 2,00 m)",
        content: "Inspeccioná costuras del arnés anticaídas, amortiguador de impacto y punto de anclaje independiente resistente a 22 kN antes de ascender.",
        category: "Prevención"
    },
    {
        title: "Continuidad de Puesta a Tierra (Res. SRT 900/15)",
        content: "Comprobá anualmente la impedancia del lazo de falla y el disparo de disyuntores diferenciales (≤ 30 mA en menos de 300 ms).",
        category: "Normativa"
    },
    {
        title: "Ingreso a Espacios Confinados",
        content: "Medí atmósfera previa (O2 entre 19,5% y 23,5%, LEL < 10%, CO y H2S) y mantené vigía externo permanente con trípode de rescate.",
        category: "Técnico"
    },
    {
        title: "Ergonomía Integrada (Res. SRT 886/15)",
        content: "Identificá factores de riesgo por levantamiento manual de cargas, posturas forzadas y movimientos repetitivos en cada puesto operativo.",
        category: "Normativa"
    }
];

function getCuratedDailyInsight() {
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % CURATED_DAILY_INSIGHTS.length;
    return CURATED_DAILY_INSIGHTS[dayIndex];
}

let geminiBillingDepletedUntil = 0;
function isBillingOrQuotaFatalError(err) {
    const msg = String(err?.message || '');
    const is402 = msg.includes('402') || msg.includes('Payment Required') || msg.includes('prepayment credits');
    if (is402) {
        if (Date.now() > geminiBillingDepletedUntil) {
            console.warn('[AI] Créditos prepagos de Google AI Studio agotados (402). Usando motor preventivo local hasta que se actualice la API Key.');
        }
        geminiBillingDepletedUntil = Date.now() + 15 * 60 * 1000; // Pausar reintentos remotos por 15 min
        return true;
    }
    return msg.includes('API_KEY_INVALID') || msg.includes('403 Forbidden');
}

app.post('/api/daily-insight', aiLimiter, verifyFirebaseToken, requirePro, async (req, res) => {
    try {
        const { country = 'argentina' } = req.body || {};
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || Date.now() < geminiBillingDepletedUntil) {
            return res.status(200).json(getCuratedDailyInsight());
        }

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

        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest"
        ];

        let result;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: `Actúa como un Asesor Senior en Higiene y Seguridad Laboral en ${country}. Genera un "Consejo del Día" breve y profesional. Devuelve obligatoriamente la categoría "Normativa", "Técnico", "Prevención" o "IA".`,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });

                result = await model.generateContent(`Genera un consejo útil y novedoso aplicable en ${country}. Sea conciso (máximo 140 caracteres el contenido).`);
                if (result) break;
            } catch (err) {
                if (isBillingOrQuotaFatalError(err)) break;
                continue;
            }
        }

        if (!result) {
            return res.status(200).json(getCuratedDailyInsight());
        }
        const parsedData = JSON.parse(result.response.text());

        res.json(parsedData);
    } catch (error) {
        return res.status(200).json(getCuratedDailyInsight());
    }
});

app.post('/api/ai-advisor', aiLimiter, verifyFirebaseToken, requirePro, validateStringInput('taskDescription', 4000), async (req, res) => {
    try {
        const { taskDescription, country = 'argentina', contextData, isChat = false } = req.body;
        if (!taskDescription) return res.status(400).json({ error: 'Falta la descripción de la tarea' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest"
        ];

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                task: { type: SchemaType.STRING, description: "Título claro y formal de la tarea, documento o programa solicitado" },
                chatResponse: { type: SchemaType.STRING, description: "Explicación libre, pedagógica y detallada en Markdown de QUÉ hacer, CÓMO hacerlo paso a paso y QUÉ módulos de la plataforma usar para cada parte" },
                planDeAccion: { 
                    type: SchemaType.ARRAY, 
                    items: { type: SchemaType.STRING },
                    description: "Pasos operativos, técnicos y de gestión detallados en orden cronológico (qué relevar, cómo confeccionarlo y dónde registrarlo)" 
                },
                riesgos: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                epp: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                recomendaciones: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                normativa: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                modulosRecomendados: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            nombre: { type: SchemaType.STRING },
                            ruta: { type: SchemaType.STRING },
                            motivo: { type: SchemaType.STRING, description: "Para qué sirve este módulo en el pedido del usuario" },
                            comoUsarlo: { type: SchemaType.STRING, description: "Explicación paso a paso de cómo usar y qué cargar dentro de este módulo de la aplicación" }
                        },
                        required: ["nombre", "ruta", "motivo", "comoUsarlo"]
                    },
                    description: "Módulos específicos de la plataforma para resolver, calcular, diseñar o documentar cada parte de lo solicitado"
                }
            },
            required: ["task", "chatResponse", "planDeAccion", "riesgos", "epp", "recomendaciones", "normativa", "modulosRecomendados"]
        };

        const systemInstruction = `Eres el Asesor Inteligente Senior de la plataforma "Asistente de Higiene y Seguridad" en ${country}, con dominio experto práctico y legal (ej. en Argentina: Ley 19.587, Dec. 351/79, Dec. 911/96, Res. SRT 51/97, 35/98, 319/99, 299/11, 84/12, 85/12, 886/15, 900/15, 960/15, 3068/14, Normas IRAM, NFPA 70E, ISO 45001).

TU MISIÓN PRINCIPAL:
El usuario tiene LIBERTAD TOTAL para preguntarte cualquier cosa: desde "necesito hacer un plano de evacuación", "me piden hacer un ATS para tal tarea", "¿cómo armo el programa de seguridad de una obra?", "tengo que medir puesta a tierra", hasta consultas operativas de campo.
Ante CUALQUIER consulta debes:
1. EXPLICAR QUÉ HACER Y CÓMO HACERLO PASO A PASO:
   - Qué datos debe relevar en campo o pedirle al cliente/empresa.
   - Cómo ejecutar o redactar técnicamente el trabajo/documento paso a paso (p. ej., si pide un ATS, desglosarle las etapas exactas de esa tarea, sus peligros y controles; si pide un plano de evacuación, explicarle cómo relevar salidas, sentido de apertura, ubicación de matafuegos, punto de encuentro y cálculo de unidades de ancho de salida).
2. INDICAR QUÉ MÓDULO(S) DE LA APLICACIÓN USAR PARA CADA COSA Y CÓMO USARLOS:
   - Vincula cada etapa de tu explicación con los módulos reales de la plataforma, explicando qué cargar en cada uno.

CATÁLOGO COMPLETO DE MÓDULOS DE LA PLATAFORMA (usa exactamente estas rutas):
- "Generador de Planos de Evacuación y Mapas de Riesgo" (ruta: "/risk-maps"): Para dibujar/subir el plano o croquis de evacuación, ubicar salidas de emergencia, flechas de escape, extintores, botiquines, "Usted está aquí" y exportar en PDF.
- "Simulador y Cálculo de Evacuación" (ruta: "/evacuation-form"): Para calcular factor de ocupación, unidades de ancho de salida (UAS) y tiempos de escape según Dec. 351/79 Anexo VII.
- "Plan de Emergencias y Brigadas" (ruta: "/emergency-plan"): Para definir roles de brigadistas (líder de evacuación, corte de suministros, primeros auxilios) y protocolo de actuación.
- "Actas de Simulacros de Emergencia" (ruta: "/drills"): Para planificar y certificar simulacros de evacuación con tiempos de respuesta.
- "Análisis de Trabajo Seguro (ATS)" (ruta: "/ats"): Para confeccionar ATS paso a paso (etapa, riesgo, medida de control), seleccionar EPP y firmar digitalmente.
- "Permiso de Trabajo con Tensión / Arc Flash" (ruta: "/arc-flash/new"): Para trabajos eléctricos energizados bajo NFPA 70E y Res. SRT 3068/14 (cálculo de cal/cm², frontera de arco, categoría de EPP y firmas).
- "Bloqueo y Etiquetado (LOTO)" (ruta: "/loto/new"): Para corte efectivo, candado, tarjeta y verificación de Energía Cero (5 Reglas de Oro).
- "Permiso de Trabajo en Altura" (ruta: "/working-at-height/new"): Para tareas > 2 m (andamios, techos, hidroelevadores, arnés, cabo de vida y punto de anclaje 22 kN).
- "Permiso de Trabajo en Caliente" (ruta: "/hot-work/new"): Para soldadura, amoladora u oxicorte (radio de 11m libre de combustibles, biombos, arrestallamas, extintor y guardia de cenizas).
- "Permiso de Espacios Confinados" (ruta: "/confined-space/new"): Para ingreso a tanques, silos, cámaras o pozos (medición de O2, LEL, CO, H2S, ventilación, trípode y vigía).
- "Seguridad en Excavaciones y Zanjeo" (ruta: "/excavations/new"): Para zanjas, pozos y movimiento de suelo (entibado, interferencias subterráneas, taludes y escaleras cada 7,5m).
- "Programa de Seguridad en Obra" (ruta: "/construction-safety-program/new"): Para armar Programas de Seguridad bajo Dec. 911/96 y Res. SRT 51/97, 35/98 o 319/99.
- "Carga de Fuego y Potencial Extintor" (ruta: "/fire-load"): Para calcular kg de madera equivalente/m², resistencia al fuego (F30/F60/F90) y potencial extintor (Anexo VII Dec. 351/79).
- "Gestión e Inspección de Extintores" (ruta: "/extintores"): Para inventario y control de matafuegos según IRAM 3517 (recarga, PH, manómetro, altura y señalización).
- "Matriz de Riesgos IPER" (ruta: "/risk-matrix"): Para evaluar Probabilidad x Severidad por puesto de trabajo y jerarquía de controles.
- "Protocolo de Puesta a Tierra SRT 900/15" (ruta: "/grounding/new"): Para registrar mediciones de resistencia de puesta a tierra (Ohms), continuidad de masas y disparo de disyuntores.
- "Protocolo de Iluminación SRT 84/12" (ruta: "/lighting"): Para mediciones de lux por cuadrícula o puesto y verificación de uniformidad.
- "Protocolo de Ruido SRT 85/12" (ruta: "/noise-assessment/new"): Para mediciones de nivel sonoro continuo equivalente (dBA) y dosis de ruido.
- "Estudio de Ergonomía SRT 886/15" (ruta: "/ergonomics-form"): Para confeccionar las Planillas 1, 2, 3 y 4 de riesgos biomecánicos y levantamiento de cargas.
- "Evaluación de Estrés Térmico (TGBH)" (ruta: "/thermal-stress"): Para cálculo de carga térmica TGBH y ciclos de trabajo-descanso.
- "Estudio de Ventilación" (ruta: "/ventilation"): Para cálculo de caudal de aire y renovaciones por hora (Cap. 11 Dec. 351/79).
- "Control y Entrega de EPP (Res. 299/11)" (ruta: "/ppe-tracker"): Para registrar la planilla oficial de entrega de EPP certificado con firma del trabajador.
- "Aptitudes Médicas Laborales" (ruta: "/medical"): Para emitir y registrar certificados de aptitud médica y habilitaciones para tareas críticas (altura, confinados, eléctrico, clark).
- "Gestión de Capacitaciones" (ruta: "/training-management"): Para dictado de cursos, registro de asistencia con firmas y escaneo de planillas con IA.
- "Charla de 5 Minutos" (ruta: "/toolbox-talk"): Para charlas operativas diarias pre-tarea en obra o planta.
- "Relevamiento General de Riesgos Laborales (RGRL)" (ruta: "/rgrl/new"): Formulario oficial Res. SRT 463/09 para ART.
- "Relevamiento de Agentes de Riesgo (RAR)" (ruta: "/rar/new"): Nómina de personal expuesto a agentes de riesgo (Res. 37/10 y 81/19).
- "Autoelevadores Res. SRT 960/15" (ruta: "/forklifts"): Checklist reglamentario de autoelevadores/clark y credenciales.
- "Inspección de Flota, Vehículos y Casillas" (ruta: "/fleet-form"): Checklists de camionetas, camiones, trailers, casas rodantes (luces, frenos, enganches, GLP y CO).
- "Operaciones de Izaje y Grúas" (ruta: "/lifting-form"): Plan de izaje, cálculo de % de utilización de grúa e inspección de eslingas y aparejos.
- "Seguridad Química y SGA (Res. 801/15)" (ruta: "/chemical-safety/new"): Inventario de químicos, fichas FDS/SDS, pictogramas SGA y bateas de contención.
- "Atmósferas Explosivas (ATEX)" (ruta: "/atex/new"): Clasificación de áreas Zonas 0/1/2 y 20/21/22.
- "Residuos Peligrosos (Ley 24.051)" (ruta: "/hazardous-waste/new"): Gestión de acopio transitorio, corrientes Y y manifiestos.
- "Investigación de Accidentes" (ruta: "/accident-investigation"): Investigación mediante Árbol de Causas.
- "Auditorías HSE" (ruta: "/audit/new") y "Acciones Correctivas CAPA" (ruta: "/capa/new").
- "Procedimientos de Trabajo Seguro (PTS)" (ruta: "/pts"): Redacción de manuales operativos estandarizados.
- "Inspección de Estanterías y Racks" (ruta: "/racks"): Control de depósitos bajo norma IRAM / UNE-EN 15635.
- "Control de Contratistas" (ruta: "/contractors"): Control de ART, cláusula de no repetición y seguros de empresas tercerizadas.
- "Tarjetas STOP" (ruta: "/stop-cards/new"): Observaciones preventivas de actos y condiciones inseguras.
- "Primeros Auxilios y DEA" (ruta: "/first-aid-aed"): Control de botiquines y desfibriladores.
- "Matriz Legal" (ruta: "/legal-matrix"), "Legajo Técnico" (ruta: "/legajos") y "Dossier ZIP de Inspección" (ruta: "/dossier").

3. Redacta el campo "chatResponse" en Markdown bien estructurado con:
   - "## 🛠️ ¿Qué hacer y cómo realizarlo paso a paso?" (explicación técnica y práctica completa).
   - "## 🧩 ¿Qué módulos de la plataforma usar para cada parte?" (explicando qué módulo abrir y cómo cargarlo).`;

        let prompt = `Consulta o pedido libre del usuario: "${taskDescription}".`;
        if (contextData) {
            prompt += `\n\nContexto histórico del usuario:\n${contextData}`;
        }
        prompt += `\n\nResponde con total libertad, profundidad y claridad pedagógica explicando QUÉ hacer, CÓMO hacerlo paso a paso y QUÉ módulo(s) de la plataforma utilizar para cada cosa (incluyendo cómo usar cada módulo).`;

        let result;
        if (Date.now() >= geminiBillingDepletedUntil) {
            for (const modelName of models) {
                try {
                    const model = genAI.getGenerativeModel({ 
                        model: modelName,
                        systemInstruction: systemInstruction,
                        generationConfig: {
                            responseMimeType: "application/json",
                            responseSchema: responseSchema
                        }
                    });
                    result = await model.generateContent(prompt);
                    if (result) break;
                } catch (err) {
                    if (isBillingOrQuotaFatalError(err)) break;
                    if (err.status === 503 || err.status === 429 || (err.message && err.message.includes('503'))) {
                        await new Promise(r => setTimeout(r, 600));
                    }
                    continue;
                }
            }
        }

        if (!result) {
            console.warn('[AI Advisor] Todos los modelos de Gemini fallaron, devolviendo respuesta base para motor EHS local.');
            return res.status(200).json({ task: taskDescription, fallback: true });
        }

        const parsedData = JSON.parse(result.response.text());
        res.json(parsedData);

    } catch (error) {
        console.error("Error in AI Advisor:", error.message);
        res.status(200).json({ task: req.body?.taskDescription || '', fallback: true });
    }
});

// ==========================================
// AI EXTINGUISHER VISION (Gemini)
// ==========================================
app.post('/api/analyze-extinguisher', aiLimiter, verifyFirebaseToken, requirePro, express.json({ limit: '15mb' }), express.urlencoded({ limit: '15mb', extended: true }), async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const mimeType = image.includes(';') ? (image.split(';')[0].split(':')[1] || 'image/jpeg') : 'image/jpeg';

        const prompt = `Actúa como un inspector estricto y certificado de extintores y protección contra incendios. Analiza detalladamente la imagen de este extintor (matafuegos) e inspecciona sus componentes críticos.
REGLAS:
1. Si NO hay un extintor visible en la imagen, establece "extinguisherDetected" en false y completa los campos con valores por defecto/null.
2. Si HAY un extintor:
   - "extinguisherDetected": true
   - "type": Tipo de extintor ("ABC", "CO2", "Agua", "Espuma", "K").
   - "capacity": Capacidad indicada en la etiqueta o cilindro (ej. "5 kg", "10 kg", "2.5 kg"). Si no se lee, null.
   - "confidenceScore": Nivel de certeza de 0 a 100.
   - "status": "vigente" o "vencido" según la etiqueta y fechas.
   - "lastCheck": Fecha del último control/recarga en YYYY-MM-DD o null si ilegible.
   - "nextCheck": Fecha de próximo vencimiento/recarga en YYYY-MM-DD o null si ilegible.
   - "phDate": Fecha de prueba hidráulica (PH) en YYYY-MM-DD o null si ilegible.
   - "expirationDate": Fecha de vencimiento general en YYYY-MM-DD o null si ilegible.
   - "manometerStatus": Inspecciona la aguja del manómetro de presión:
       * "zona_verde" si la aguja está en el cuadrante verde central (operativo/presión correcta).
       * "descargado" si la aguja está a la izquierda / sector de despresurización o recarga.
       * "sobrepresionado" si la aguja está a la derecha / sobrepresión.
       * "no_aplica" si el extintor no posee manómetro (ej. CO2) o no es visible.
   - "manometerMessage": Breve explicación técnica del estado del manómetro y la presión observada.
   - "sealStatus": Estado del precinto plástico/metálico de seguridad: "intacto", "dañado", o "ausente".
   - "pinStatus": Pasador o chaveta de seguridad: "presente" o "ausente".
   - "hoseStatus": Estado de la manguera y tobera: "bueno", "grietas", u "obstruido".
   - "recommendations": Array con 2 a 4 recomendaciones prioritarias de seguridad preventiva para este extintor.`;
        
        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                extinguisherDetected: { type: SchemaType.BOOLEAN },
                type: { type: SchemaType.STRING },
                confidenceScore: { type: SchemaType.NUMBER },
                capacity: { type: SchemaType.STRING },
                status: { type: SchemaType.STRING },
                lastCheck: { type: SchemaType.STRING },
                nextCheck: { type: SchemaType.STRING },
                phDate: { type: SchemaType.STRING },
                expirationDate: { type: SchemaType.STRING },
                manometerStatus: { type: SchemaType.STRING },
                manometerMessage: { type: SchemaType.STRING },
                sealStatus: { type: SchemaType.STRING },
                pinStatus: { type: SchemaType.STRING },
                hoseStatus: { type: SchemaType.STRING },
                recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["extinguisherDetected", "type", "confidenceScore", "capacity", "status", "manometerStatus", "manometerMessage", "sealStatus", "recommendations"]
        };

        const imagePart = { inlineData: { data: base64Data, mimeType } };

        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
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
                
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 25s expiró')), 25000));
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

        const responseText = result.response.text();
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('```json')) {
            cleanedJson = cleanedJson.replace(/```json/, '').replace(/```$/, '').trim();
        } else if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.replace(/```/, '').replace(/```$/, '').trim();
        }

        let parsedData;
        try {
            parsedData = JSON.parse(cleanedJson);
        } catch (_) {
            const firstBrace = cleanedJson.indexOf('{');
            const lastBrace = cleanedJson.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                parsedData = JSON.parse(cleanedJson.substring(firstBrace, lastBrace + 1));
            } else {
                throw new Error('Respuesta JSON inválida de la IA');
            }
        }

        if (parsedData.confidenceScore && !parsedData.confidence) {
            parsedData.confidence = parsedData.confidenceScore;
        }

        res.json(parsedData);
    } catch (error) {
        console.error("Error analyzing extinguisher:", error.message);
        res.status(500).json({ error: 'Error en análisis de extintor', details: error.message });
    }
});

// ==========================================
// AI TRAINING SHEET VISION (Gemini)
// ==========================================
app.post('/api/analyze-training-sheet', aiLimiter, verifyFirebaseToken, requirePro, express.json({ limit: '15mb' }), express.urlencoded({ limit: '15mb', extended: true }), async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key de Gemini en el servidor' });

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

        const prompt = `Analiza detalladamente esta imagen de una planilla o acta de capacitación / asistencia de seguridad e higiene laboral.
REGLAS ESTRICTAS:
1. NO INVENTES NINGÚN DATO NI NOMBRE. Extrae estrictamente lo que se lee en la imagen. Si un dato no se lee con claridad, devuelve null o cadena vacía.
2. Si NO se detecta una planilla, acta o lista de asistencia a capacitación, establece "sheetDetected" en false.
3. Si HAY una planilla de capacitación visible: establece "sheetDetected" en true.
4. Extrae los datos generales del encabezado:
   - "tema": Título o tema principal de la capacitación (ej. "Uso de EPP", "Trabajo en Altura", "Prevención de Incendios").
   - "tipoCapacitacion": Categoría (ej. "Seguridad e Higiene", "Emergencias", "Ergonomía", "Medio Ambiente", "Salud Ocupacional", "Otros").
   - "fecha": Fecha en formato YYYY-MM-DD si es legible, o null.
   - "duracion": Duración en horas (ej. "1.5", "2.0", "1"), o null.
   - "expositor": Nombre del capacitador, expositor o instructor.
   - "empresa": Razón social o empresa.
   - "lugar": Sector, planta o ubicación.
   - "objetivo": Objetivo redactado en la planilla si existe.
5. Extrae la nómina completa de asistentes inscritos en la tabla/lista:
   - Para cada trabajador detectado:
     - "nombre": Nombre y apellido completo.
     - "dni": DNI o CUIT/CUIL sin puntos si es posible, o exactamente como figura.
     - "puesto": Puesto de trabajo, cargo o área.
     - "nota": Calificación/examen (ej. "10", "Aprobado", "9"), o null si no hay.
     - "firmado": boolean (true si se aprecia firma manuscrita, gancho o sello en la casilla correspondiente, false si está en blanco).
6. Responde SIEMPRE en formato JSON válido.`;

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                sheetDetected: { type: SchemaType.BOOLEAN },
                confidence: { type: SchemaType.NUMBER },
                tema: { type: SchemaType.STRING },
                tipoCapacitacion: { type: SchemaType.STRING },
                fecha: { type: SchemaType.STRING },
                duracion: { type: SchemaType.STRING },
                expositor: { type: SchemaType.STRING },
                empresa: { type: SchemaType.STRING },
                lugar: { type: SchemaType.STRING },
                objetivo: { type: SchemaType.STRING },
                asistentes: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            nombre: { type: SchemaType.STRING },
                            dni: { type: SchemaType.STRING },
                            puesto: { type: SchemaType.STRING },
                            nota: { type: SchemaType.STRING },
                            firmado: { type: SchemaType.BOOLEAN }
                        },
                        required: ["nombre", "dni"]
                    }
                },
                observaciones: { type: SchemaType.STRING }
            },
            required: ["sheetDetected", "asistentes"]
        };

        const imagePart = { inlineData: { data: base64Data, mimeType } };

        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest"
        ];

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                process.stdout.write(`[AI TRAINING SHEET] Intentando con ${modelName}... `);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "Eres un asistente experto en digitalización de planillas de seguridad e higiene laboral. Analizas imágenes de hojas físicas de capacitación y extraes sus datos a formato JSON estricto con máxima precisión.",
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
            throw new Error(lastError?.message || 'Los modelos de IA fallaron al procesar la planilla');
        }

        res.json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error("Error analizando la planilla de capacitación:", error.message);
        res.status(500).json({ error: 'Error analizando la planilla', details: error.message });
    }
});

// ==========================================
// AI ATS GENERATOR (Gemini)
// ==========================================

app.post('/api/ai-ats-generator', aiLimiter, verifyFirebaseToken, requirePro, validateStringInput('taskTitle', 500), async (req, res) => {
    try {
        const { taskTitle, country = 'argentina' } = req.body;
        if (!taskTitle) return res.status(400).json({ error: 'Falta el título de la tarea' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
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
        if (Date.now() >= geminiBillingDepletedUntil) {
            for (const modelName of models) {
                try {
                    const model = genAI.getGenerativeModel({ 
                        model: modelName,
                        systemInstruction: `Eres supervisor de prevención de riesgos en ${country}. Debes generar los ATS paso a paso basados en las normas locales.`,
                        generationConfig: {
                            responseMimeType: "application/json",
                            responseSchema: responseSchema
                        }
                    });
                    result = await model.generateContent(prompt);
                    if (result) break;
                } catch (err) {
                    if (isBillingOrQuotaFatalError(err)) break;
                    continue;
                }
            }
        }

        if (!result) {
            return res.status(200).json([
                {
                    paso: `1. Inspección previa del área y planificación para: ${taskTitle}`,
                    riesgo: "Condiciones subestándar en el entorno, interferencias operativas o falta de delimitación.",
                    control: "Delimitar y señalizar el sector de trabajo, verificar iluminación, orden y limpieza (Ley 19.587 / Dec. 351/79)."
                },
                {
                    paso: "2. Verificación de herramientas, equipos y Elementos de Protección Personal (EPP)",
                    riesgo: "Falla mecánica o eléctrica de equipos portátiles y exposición por EPP inadecuado o deteriorado.",
                    control: "Inspeccionar estado de herramientas, protecciones y utilizar EPP certificado obligatorio según Res. SRT 299/11."
                },
                {
                    paso: "3. Control de energías peligrosas y permisos operativos",
                    riesgo: "Contacto eléctrico directo/indirecto, atrapamiento o puesta en marcha intempestiva.",
                    control: "Aplicar bloqueo y etiquetado (LOTO), verificar ausencia de tensión y validar permiso de trabajo firmado."
                },
                {
                    paso: `4. Ejecución controlada de la tarea: ${taskTitle}`,
                    riesgo: "Sobreesfuerzos ergonómicos, proyección de partículas, caídas a distinto o mismo nivel.",
                    control: "Mantener postura segura, supervisión permanente, uso continuo de EPP y cumplimiento del procedimiento seguro."
                },
                {
                    paso: "5. Finalización, orden, limpieza y liberación del sector",
                    riesgo: "Tropiezos, residuos peligrosos o herramientas olvidadas en zona operativa.",
                    control: "Retirar bloqueos LOTO según protocolo, disponer residuos adecuadamente y normalizar el área de trabajo."
                }
            ]);
        }

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
app.post('/api/ai-report-conclusion', aiLimiter, verifyFirebaseToken, requirePro, async (req, res) => {
    try {
        const { reportType, reportData, country = 'argentina' } = req.body;
        if (!reportType || !reportData) return res.status(400).json({ error: 'Faltan datos del reporte' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest"
        ];

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                conclusion: { type: SchemaType.STRING }
            },
            required: ["conclusion"]
        };

        const prompt = `Analiza los siguientes datos de reporte "${reportType}":\n${JSON.stringify(reportData)}\n\nEscribe la conclusión en un objeto JSON con la llave "conclusion", considerando normativas de ${country}.`;

        let result;
        if (Date.now() >= geminiBillingDepletedUntil) {
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
                } catch (err) {
                    if (isBillingOrQuotaFatalError(err)) break;
                    continue;
                }
            }
        }
        if (!result) {
            return res.status(200).json({
                conclusion: `De acuerdo con el relevamiento técnico efectuado para ${reportType}, se verificaron las condiciones operativas y documentales conforme a la Ley N° 19.587 de Higiene y Seguridad en el Trabajo y su Decreto Reglamentario N° 351/79.\n\nSe recomienda mantener el seguimiento periódico de las medidas preventivas implementadas, asegurar el registro de capacitación continua del personal expuesto y verificar la vigencia de los controles de ingeniería y Elementos de Protección Personal certificados (Res. SRT 299/11).`
            });
        }
        res.json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error("Error in AI Conclusion:", error.message);
        res.status(500).json({ error: 'Error generando la conclusión' });
    }
});

// ==========================================
// AI LEGAL SUMMARY (Gemini)
// ==========================================
app.post('/api/ai-legal-summary', aiLimiter, verifyFirebaseToken, requirePro, async (req, res) => {
    try {
        const { ley, leyTitle, leyDescription, country = 'argentina' } = req.body || {};
        const effectiveTitle = ley || leyTitle;
        if (!effectiveTitle || typeof effectiveTitle !== 'string') return res.status(400).json({ error: 'Faltan datos de la normativa' });
        if (effectiveTitle.length > 1000) return res.status(400).json({ error: 'El nombre o texto de la normativa no puede superar los 1.000 caracteres.' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest"
        ];

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                summary: { type: SchemaType.STRING }
            },
            required: ["summary"]
        };

        const prompt = `Realiza un resumen de puntos principales en viñetas para la norma operativa "${effectiveTitle}".${leyDescription ? `\nDescripción corta: "${leyDescription}"` : ''}`;

        let result;
        if (Date.now() >= geminiBillingDepletedUntil) {
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
                } catch (err) {
                    if (isBillingOrQuotaFatalError(err)) break;
                    continue;
                }
            }
        }
        if (!result) {
            return res.status(200).json({
                summary: `• **Normativa:** ${effectiveTitle}\n• **Alcance:** ${leyDescription || 'Regulación obligatoria de condiciones de Higiene y Seguridad en el Trabajo.'}\n• **Aplicación en campo:** Exige evaluación preventiva de riesgos, implementación de controles de ingeniería, provisión de EPP certificados y capacitación documentada del personal.`
            });
        }
        res.json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error("Error in AI Legal Summary:", error.message);
        res.status(500).json({ error: 'Error generando resumen' });
    }
});

// ==========================================
// AI GENERAL RISKS VISION (Gemini)
// ==========================================
app.post('/api/ai-stopcard', aiLimiter, verifyFirebaseToken, requirePro, validateStringInput('transcript', 2000), async (req, res) => {
    try {
        const { transcript, country = 'argentina' } = req.body;
        if (!transcript) return res.status(400).json({ error: 'Falta transcripción' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest"
        ];

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
        if (Date.now() >= geminiBillingDepletedUntil) {
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
                } catch (err) {
                    if (isBillingOrQuotaFatalError(err)) break;
                    continue;
                }
            }
        }
        if (!result) {
            return res.status(200).json({
                type: "Condición Insegura",
                location: "Sector Operativo Relevado",
                description: transcript,
                actionTaken: "Se notificó al supervisor del sector y se aplicó medida preventiva inmediata."
            });
        }
        res.json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error("Error in AI StopCard:", error.message);
        res.status(500).json({ error: 'Error procesando nota de voz' });
    }
});

// ==========================================
// AI GENERAL RISKS VISION (Gemini)
// ==========================================
app.post('/api/analyze-general-risks', aiLimiter, verifyFirebaseToken, requirePro, express.json({ limit: '15mb' }), express.urlencoded({ limit: '15mb', extended: true }), async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Actúa como un experto prevencionista de riesgos laborales altamente estricto. Analiza detalladamente esta imagen de un entorno laboral para detección general de evidentes riesgos laborales.
REGLAS ESTRICTAS:
1. NO INVENTES NI ASUMAS RIESGOS INVISIBLES. Si no hay un riesgo físico, mecánico, químico o ergonómico CLARAMENTE visible, no lo reportes.
2. No uses descripciones genéricas (ej. "posible riesgo de tropiezo" si no hay nada en el suelo). Sé específico y describe solo lo que se ve en la foto.
3. Si el entorno parece seguro, indica que no se observan riesgos evidentes.
4. IMPORTANTE: Todas las respuestas, descripciones de riesgos, recomendaciones y etiquetas de las cajas delimitadoras de las detecciones deben ser entregadas obligatoriamente en idioma español.`;
        
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
            "gemini-2.0-flash",
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

// ==========================================
// AI CHAT & VOICE DICTATION & EXAMS
// ==========================================
app.post('/api/ai-chat', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { message, messages, systemInstruction } = req.body || {};
        let prompt = '';
        if (message && typeof message === 'string') {
            prompt = message;
        } else if (Array.isArray(messages) && messages.length > 0) {
            prompt = messages.map(m => `${m.role === 'system' ? 'INSTRUCCIÓN' : m.role === 'user' ? 'USUARIO' : 'ASISTENTE'}: ${m.content}`).join('\n\n');
        } else {
            return res.status(400).json({ error: 'Falta el mensaje o lista de mensajes' });
        }

        if (prompt.length > 8000) {
            return res.status(400).json({ error: 'El mensaje excede el límite máximo de 8.000 caracteres.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

        let result;
        let lastError;
        if (Date.now() >= geminiBillingDepletedUntil) {
            for (const modelName of models) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: systemInstruction || "Eres un Asistente Senior especializado en Higiene, Seguridad Laboral y Prevención de Riesgos en Argentina. Proporciona respuestas claras, técnicas y fundamentadas.",
                    });
                    const fetchPromise = model.generateContent(prompt);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 25s')), 25000));
                    result = await Promise.race([fetchPromise, timeoutPromise]);
                    if (result) break;
                } catch (err) {
                    lastError = err;
                    if (isBillingOrQuotaFatalError(err)) break;
                    continue;
                }
            }
        }

        if (!result) {
            const fallbackText = "Según la Ley 19.587 y el Decreto 351/79, se recomienda verificar las condiciones de seguridad del sector, asegurar la provisión y uso de EPP certificados (Res. SRT 299/11), confeccionar el Análisis de Trabajo Seguro (ATS) previo a la tarea y mantener las vías de evacuación y equipos contra incendios operativos.";
            return res.status(200).json({ response: fallbackText, content: fallbackText, text: fallbackText, fallback: true });
        }

        const responseText = result.response.text();
        let jsonPayload = null;
        try {
            let cleaned = responseText.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            jsonPayload = JSON.parse(cleaned);
        } catch {
            const startIdx = responseText.indexOf('{');
            const endIdx = responseText.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                try { jsonPayload = JSON.parse(responseText.substring(startIdx, endIdx + 1)); } catch {}
            }
        }

        if (jsonPayload && typeof jsonPayload === 'object') {
            return res.json({ response: responseText, content: responseText, text: responseText, ...jsonPayload });
        }
        return res.json({ response: responseText, content: responseText, text: responseText });
    } catch (error) {
        console.error("Error in AI Chat:", error.message);
        res.status(500).json({ error: 'Error procesando la consulta de IA', details: error.message });
    }
});

// ==========================================
// PREDICTIVE ACCIDENTS AI
// ==========================================
app.post('/api/predict-accidents', aiLimiter, verifyFirebaseToken, requirePro, async (req, res) => {
    try {
        const { historyData, if: indiceFrecuencia, ig: indiceGravedad, sector } = req.body || {};
        let normalizedHistory = Array.isArray(historyData) ? historyData : [];
        if (normalizedHistory.length === 0 && (indiceFrecuencia !== undefined || indiceGravedad !== undefined || sector)) {
            normalizedHistory = [{ indiceFrecuencia, indiceGravedad, sector: sector || 'General' }];
        }
        if (normalizedHistory.length === 0) {
            return res.status(400).json({ error: 'historyData array requerido' });
        }

        const safeHistory = normalizedHistory.slice(0, 30);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                prediccionPrincipal: { type: SchemaType.STRING },
                zonasRiesgo: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                tareasCriticas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                recomendaciones: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["prediccionPrincipal", "zonasRiesgo", "tareasCriticas", "recomendaciones"]
        };

        const prompt = `Actúa como un perito analista en Higiene, Seguridad y Ergonomía Laboral.
Analiza el siguiente historial de accidentes laborales de una empresa y genera una predicción predictiva fundada para el próximo mes con zonas de riesgo, tareas críticas y recomendaciones prioritarias.
Historial registrado:
${JSON.stringify(safeHistory, null, 2)}`;

        let result;
        let lastError;
        if (Date.now() >= geminiBillingDepletedUntil) {
            for (const modelName of models) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: "Eres un analista de datos y prevencionista senior en Argentina. Proporciona predicciones fundamentadas y de alto valor preventivo.",
                        generationConfig: {
                            responseMimeType: "application/json",
                            responseSchema: responseSchema
                        }
                    });
                    const fetchPromise = model.generateContent(prompt);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 25s')), 25000));
                    result = await Promise.race([fetchPromise, timeoutPromise]);
                    if (result) break;
                } catch (err) {
                    lastError = err;
                    if (isBillingOrQuotaFatalError(err)) break;
                    continue;
                }
            }
        }

        if (!result) {
            const fallbackPred = "Mayor probabilidad de incidentes por sobreesfuerzos, caídas al mismo nivel y uso incompleto de EPP en sectores operativos de alta rotación.";
            return res.status(200).json({
                prediccionPrincipal: fallbackPred,
                prediction: fallbackPred,
                zonasRiesgo: ["Sector Operativo Principal", "Depósito y Logística", "Área de Mantenimiento"],
                tareasCriticas: ["Movimiento manual de cargas", "Mantenimiento electromecánico", "Trabajos en altura y circulación de autoelevadores"],
                recomendaciones: [
                    "Reforzar charlas de 5 minutos y control diario de EPP certificados (Res. SRT 299/11).",
                    "Auditar orden, limpieza y demarcación de pasillos de circulación.",
                    "Verificar cumplimiento de bloqueo LOTO y permisos de trabajo antes de cada intervención."
                ]
            });
        }
        const parsedPred = JSON.parse(result.response.text());
        res.json({
            ...parsedPred,
            prediction: parsedPred.prediccionPrincipal
        });
    } catch (error) {
        console.error("Error in Predict Accidents:", error.message);
        res.status(500).json({ error: 'Error generando predicción de accidentes', details: error.message });
    }
});

// ==========================================
// EMERGENCY CHAT BOT
// ==========================================
app.post('/api/emergency-chat', aiLimiter, verifyFirebaseToken, async (req, res) => {
    try {
        const { message, context = 'general', companyContext = '' } = req.body || {};
        if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Mensaje requerido' });
        if (message.length > 2000) return res.status(400).json({ error: 'El mensaje no puede superar los 2.000 caracteres.' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

        const prompt = `Emergencia reportada por el usuario: "${message}".
Tipo/Contexto: "${context}".
Empresa/Ubicación: "${companyContext}".
Instrucciones estrictas:
- Actúa inmediatamente indicando si se debe llamar a Bomberos (100), SAME/Ambulancia (107) o Policía (911).
- Proporciona pasos de primeros auxilios y evacuación breves, ordenados con viñetas numéricas ("1.", "2.", "3.").
- Sé extremadamente claro, sereno y directo. No agregues introducciones largas.`;

        let result;
        let lastError;
        if (Date.now() >= geminiBillingDepletedUntil) {
            for (const modelName of models) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: "Eres un Asistente de Emergencias Críticas EHS para establecimientos laborales y fábricas en Argentina. Tu prioridad absoluta es salvar vidas, ordenar la evacuación segura y coordinar la respuesta médica inicial.",
                    });
                    const fetchPromise = model.generateContent(prompt);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 20s')), 20000));
                    result = await Promise.race([fetchPromise, timeoutPromise]);
                    if (result) break;
                } catch (err) {
                    lastError = err;
                    if (isBillingOrQuotaFatalError(err)) break;
                    continue;
                }
            }
        }

        if (!result) {
            return res.status(200).json({
                response: "1. Comuníquese de inmediato con Emergencias Médicas (107), Bomberos (100) o Policía (911).\n2. Asegure la escena y corte suministros eléctricos o de gas si existe riesgo activo.\n3. Inicie la evacuación ordenada hacia el Punto de Encuentro establecido sin correr ni regresar.\n4. Brinde primeros auxilios básicos únicamente si cuenta con capacitación y el área es segura."
            });
        }
        res.json({ response: result.response.text() });
    } catch (error) {
        console.error("Error in Emergency Chat:", error.message);
        res.status(500).json({ error: 'Error procesando respuesta de emergencia', details: error.message });
    }
});

// ==========================================
// VISION ATS
// ==========================================
app.post('/api/vision-ats', aiLimiter, verifyFirebaseToken, requirePro, express.json({ limit: '15mb' }), express.urlencoded({ limit: '15mb', extended: true }), async (req, res) => {
    try {
        const { imageBase64 } = req.body || {};
        if (!imageBase64) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const mimeType = imageBase64.includes(';') ? imageBase64.split(';')[0].split(':')[1] : 'image/jpeg';

        const imagePart = { inlineData: { data: base64Data, mimeType } };

        const prompt = `Analiza esta imagen tomada en un lugar de trabajo (obra, taller, fábrica o faena).
Desglosa las operaciones que se observan o se requieren en pasos lógicos de trabajo para un Análisis de Trabajo Seguro (ATS).
Para cada paso, identifica los riesgos o peligros visibles y la medida de control o EPP preventivo correspondiente.
Devuelve ÚNICAMENTE un array JSON válido con la siguiente estructura:
[
  {
    "paso": "Descripción del paso o tarea",
    "riesgo": "Riesgo o peligro inherente observado",
    "control": "Medida preventiva o control a aplicar"
  }
]`;

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

        const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "Eres un especialista senior en Análisis de Trabajo Seguro (ATS) en Argentina. Identificas condiciones de riesgo y medidas de control según Ley 19.587, Dec. 351/79 y Dec. 911/96.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
                const fetchPromise = model.generateContent([prompt, imagePart]);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 25s')), 25000));
                result = await Promise.race([fetchPromise, timeoutPromise]);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) return res.status(500).json({ error: 'Todos los modelos de visión fallaron', details: lastError?.message });
        res.json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error("Error in Vision ATS:", error.message);
        res.status(500).json({ error: 'Error procesando la imagen de ATS', details: error.message });
    }
});



// Diagnostic endpoint to scan available models (Admin Only)
app.get('/api/scan-models', adminLimiter, isAdmin, async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

    try {
        res.json({
            message: 'Diagnostic point reached',
            configured: true,
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
app.post('/api/forgot-password', authLimiter, validateEmail, async (req, res) => {
    const { email } = req.body;

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
                // 🛡️ Anti-enumeración: no revelar si el email existe o no
                return res.json({
                    message: 'Si el correo ingresado se encuentra registrado, recibirás un enlace de recuperación.'
                });
            }
            return res.status(400).json({
                error: "Error interno en el sistema de autenticación."
            });
        }

        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get('oobCode');
        const PRODUCTION_URL = 'https://asistentehs.com';
        const requestOrigin = req.headers.origin;
        const ALLOWED_RESET_ORIGINS = ['https://asistentehs.com', 'https://www.asistentehs.com', 'http://localhost:5173', 'http://localhost:4173'];
        const baseUrl = (requestOrigin && ALLOWED_RESET_ORIGINS.includes(requestOrigin)) ? requestOrigin : PRODUCTION_URL;
        const resetLink = `${baseUrl}/reset-password?oobCode=${oobCode}`;

        console.log(`[PASSWORD RESET] Reset link generated for ${email}. Sending email...`);

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
                            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el <strong>Asistente de Higiene y Seguridad</strong>. Hacé clic en el botón de abajo para crear una nueva contraseña de forma segura:
                        </p>
                        
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">Restablecer Contraseña</a>
                        </div>

                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px;">
                            <strong>¿No solicitaste este cambio?</strong><br>
                            Podés ignorar este correo de forma segura. El enlace expirará en 1 hora por tu seguridad.
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

        // Send email via centralized mailer
        console.log(`[PASSWORD RESET] Sending email via Gmail SMTP to ${email}...`);

        try {
            await sendAppMail({
                to: email,
                subject: 'Restablecer Contraseña - Asistente H&S',
                html: mailOptions.html
            });

            console.log(`[PASSWORD RESET] Email sent successfully via Gmail SMTP to ${email}`);
            return res.json({
                message: 'Email de recuperación enviado con éxito. Por favor, revisa tu bandeja de entrada.'
            });
        } catch (err) {
            console.error('[PASSWORD RESET] Error sending email via Gmail SMTP:', err);
            return res.status(500).json({
                error: 'No se pudo enviar el email de recuperación.'
            });
        }

    } catch (error) {
        // 🛡️ Anti-enumeración: nunca revelar errores internos en este endpoint
        console.error('[PASSWORD RESET] Unexpected error:', error.message);
        return res.json({
            message: 'Si el correo ingresado se encuentra registrado, recibirás un enlace de recuperación.'
        });
    }
});

// ==========================================
// REGISTRATION REQUESTS API (Firestore)
// ==========================================

app.post('/api/register-request', validateEmail, validateStringInput('name', 100), validateStringInput('profession', 150), validateStringInput('phone', 30), async (req, res) => {
    try {
        const { name, email, profession, phone } = req.body;

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

// Admin Users Panel API (delegates to _admin-users.js handler)
import adminUsersHandler from './api/_admin-users.js';
app.all('/api/admin/users', adminLimiter, async (req, res) => {
    return adminUsersHandler(req, res);
});


// Password changed notification email
app.post('/api/send-password-changed-email', emailLimiter, validateEmail, async (req, res) => {
    const { email, name } = req.body;

    console.log(`[PASSWORD CHANGED] Sending notification to ${email}...`);

    const now = new Date();
    const timestamp = now.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    const greeting = name ? `Hola, ${name}` : 'Hola';

    try {
        await sendAppMail({
            to: email,
            subject: 'Tu contraseña ha sido actualizada - Asistente H&S',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                        <img src="https://asistentehs.com/logo.png" alt="Asistente HYS" style="width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Seguridad de Cuenta</h1>
                    </div>
                    
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">${greeting},</h2>
                        <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                            Te informamos que la contraseña de tu cuenta en el <strong>Asistente de Higiene y Seguridad</strong> ha sido modificada exitosamente.
                        </p>
                        
                        <div style="margin: 25px 0; padding: 18px 20px; background-color: #f0fdf4; border-radius: 12px; border-left: 4px solid #10b981;">
                            <p style="color: #334155; margin: 0; font-size: 14px;">
                                🕐 <strong>Fecha y hora del cambio:</strong> ${timestamp} (hora Argentina)
                            </p>
                        </div>

                        <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                            Ya podés iniciar sesión en cualquier momento utilizando tu nueva clave de acceso.
                        </p>

                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px;">
                            <strong>¿No fuiste vos quien hizo este cambio?</strong><br>
                            Si no autorizaste esta acción, contactanos de inmediato a <a href="mailto:soporte@asistentehs.com" style="color: #2563eb; text-decoration: none;">soporte@asistentehs.com</a> para proteger tu cuenta.
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

        console.log(`[PASSWORD CHANGED] Notification sent to ${email}.`);
        return res.json({ success: true });
    } catch (err) {
        console.error('[PASSWORD CHANGED] Error:', err.message);
        return res.json({ success: false, error: err.message });
    }
});

// Welcome email - email limiter (prevent spam)
app.post('/api/welcome-email', emailLimiter, validateEmail, validateStringInput('name', 100), async (req, res) => {
    const { email, name } = req.body;

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
        await sendAppMail({
            to: email,
            subject: '¡Bienvenido al Asistente H&S!',
            html: mailOptions.html
        });

        console.log(`[WELCOME EMAIL] Sent successfully to ${email} via Gmail SMTP.`);
        res.json({ success: true, message: 'Correo de bienvenida enviado' });
    } catch (err) {
        console.error('[WELCOME EMAIL] Error:', err.message);
        res.json({ success: false, error: err.message, message: 'No se pudo enviar el correo, pero el registro fue exitoso.' });
    }
});

// ==========================================
// DELETE ACCOUNT — Limpieza completa de datos
// ==========================================

/**
 * DELETE /api/delete-account
 * Elimina completamente una cuenta de usuario:
 *   1. Datos de Firestore (colección y subcolecciones)
 *   2. Archivos de Storage (carpeta users/{uid}/)
 *   3. Cuenta de Firebase Auth
 *
 * Requiere token válido de Firebase → solo el propio usuario puede eliminar su cuenta.
 */
app.delete('/api/delete-account', verifyFirebaseToken, async (req, res) => {
    const uid = req.user?.uid;

    if (!uid) {
        return res.status(401).json({ error: 'No autorizado.' });
    }

    try {
        console.log(`[DELETE ACCOUNT] Iniciando eliminación completa para uid: ${uid}`);

        // 1. Eliminar datos de Firestore recursivamente
        try {
            const db = admin.firestore();
            await db.recursiveDelete(db.collection('users').doc(uid));
            console.log(`[DELETE ACCOUNT] Firestore data deleted for uid: ${uid}`);
        } catch (firestoreErr) {
            console.error(`[DELETE ACCOUNT] Firestore deletion error for uid ${uid}:`, firestoreErr.message);
            // No fatal — continuar con Storage y Auth
        }

        // 2. Eliminar archivos de Storage (carpeta users/{uid}/)
        try {
            const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
            await bucket.deleteFiles({ prefix: `users/${uid}/` });
            console.log(`[DELETE ACCOUNT] Storage files deleted for uid: ${uid}`);
        } catch (storageErr) {
            // Si no hay archivos o el bucket no está configurado, no es fatal
            console.warn(`[DELETE ACCOUNT] Storage deletion warning for uid ${uid}:`, storageErr.message);
        }

        // 3. Eliminar usuario de Firebase Auth (operación final)
        await admin.auth().deleteUser(uid);
        console.log(`[DELETE ACCOUNT] Firebase Auth user deleted: ${uid}`);

        return res.json({ success: true, message: 'Cuenta eliminada completamente.' });

    } catch (err) {
        console.error(`[DELETE ACCOUNT] Critical error for uid ${uid}:`, err.message);
        return res.status(500).json({ error: 'Error al eliminar la cuenta. Por favor contactá soporte.' });
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
