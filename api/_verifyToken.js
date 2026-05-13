import admin from 'firebase-admin';

// ============================================================
// PRODUCTION ALLOWED ORIGINS
// ============================================================
const ALLOWED_ORIGINS = [
    'https://asistentehs-b594e.web.app',
    'https://asistentehs-b594e.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:4173',
];

/**
 * Sets CORS headers, restricting access to known production origins only.
 * Returns false and sends 403 if the origin is not allowed.
 */
export function setCorsHeaders(req, res) {
    const origin = req.headers?.origin;

    // Allow same-origin requests (no Origin header, e.g. server-to-server or curl in dev)
    if (!origin) {
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        return true;
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Vary', 'Origin');
        return true;
    }

    // Unauthorized origin
    console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
    res.status(403).json({ error: 'Origen no autorizado.' });
    return false;
}

// ============================================================
// FIREBASE ADMIN INIT
// ============================================================
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('[Firebase Admin] Initialized successfully.');
        } else {
            console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY not set. Auth disabled.');
        }
    } catch (error) {
        console.error('[Firebase Admin] Initialization error:', error.message);
    }
}

// ============================================================
// PER-USER RATE LIMITING (in-memory, per serverless instance)
// ============================================================
// Note: Vercel serverless instances are ephemeral and don't share memory.
// This still provides meaningful protection against burst abuse within a single warm instance.
const userRequestCounts = new Map(); // uid -> { count, resetAt }
const AI_RATE_LIMIT = 20;           // max requests per window
const RATE_WINDOW_MS = 60 * 1000;   // 1-minute window

function checkUserRateLimit(uid) {
    const now = Date.now();
    const record = userRequestCounts.get(uid);

    if (!record || now > record.resetAt) {
        // First request or window expired — start fresh
        userRequestCounts.set(uid, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }

    if (record.count >= AI_RATE_LIMIT) {
        return false; // Rate limit exceeded
    }

    record.count += 1;
    return true;
}

// Clean up stale entries periodically to avoid memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [uid, record] of userRequestCounts.entries()) {
        if (now > record.resetAt) {
            userRequestCounts.delete(uid);
        }
    }
}, RATE_WINDOW_MS * 2);

// ============================================================
// MAIN AUTH + RATE LIMIT VERIFICATION
// ============================================================

/**
 * Verifies the Firebase ID token from the Authorization header,
 * then applies per-user rate limiting.
 * Returns the decoded token on success, or sends an error response and returns null.
 */
export async function verifyToken(req, res) {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[AUTH] Missing or malformed Authorization header.');
        res.status(401).json({ error: 'No autorizado: falta el token de autenticación.' });
        return null;
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!admin.apps.length) {
        console.warn('[AUTH] Firebase Admin not initialized — blocking request.');
        res.status(503).json({ error: 'Servicio no disponible: autenticación no configurada.' });
        return null;
    }

    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error('[AUTH] Token verification failed:', error.message);
        res.status(403).json({ error: 'Token inválido o expirado.' });
        return null;
    }

    // Apply per-user rate limiting
    const uid = decodedToken.uid;
    if (!checkUserRateLimit(uid)) {
        console.warn(`[RATE LIMIT] User ${uid} exceeded AI request limit.`);
        res.status(429).json({
            error: `Límite de ${AI_RATE_LIMIT} consultas por minuto alcanzado. Esperá un momento.`
        });
        return null;
    }

    return decodedToken;
}
