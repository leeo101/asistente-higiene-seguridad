import { setCorsHeaders } from './_cors.js';
import jwt from 'jsonwebtoken';

export { setCorsHeaders };

// ============================================================
// FIREBASE JWT MANUAL VERIFICATION (Zero Heavy Dependencies)
// ============================================================
let cachedCerts = null;
let certsExpiry = 0;

async function fetchGooglePublicKeysWithRetry(retries = 2) {
    const now = Date.now();
    if (cachedCerts && now < certsExpiry) {
        return cachedCerts;
    }
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            const response = await fetch(
                'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                cachedCerts = data;
                certsExpiry = now + (60 * 60 * 1000); // 1 hora
                return cachedCerts;
            }
        } catch (error) {
            console.warn(`[AUTH] Intento ${attempt + 1} falló al obtener claves de Google:`, error.message);
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 400));
            }
        }
    }
    
    // Si la descarga falló pero ya teníamos claves en caché, conservarlas (no romper el servicio)
    if (cachedCerts) {
        console.warn('[AUTH] Usando claves públicas en caché como fallback de emergencia.');
        return cachedCerts;
    }
    
    return null;
}

// ============================================================
// PER-USER RATE LIMITING (in-memory, per serverless instance)
// ============================================================
const userRequestCounts = new Map();
const AI_RATE_LIMIT = 10; // Máximo 10 consultas por minuto por usuario para proteger costos de API
const RATE_WINDOW_MS = 60 * 1000;   

function checkUserRateLimit(uid) {
    const now = Date.now();
    const record = userRequestCounts.get(uid);

    if (!record || now > record.resetAt) {
        userRequestCounts.set(uid, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }

    if (record.count >= AI_RATE_LIMIT) {
        return false;
    }

    record.count += 1;
    return true;
}

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
export async function verifyToken(req, res) {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[AUTH] Missing or malformed Authorization header.');
        res.status(401).json({ error: 'No autorizado: falta el token de autenticación.' });
        return null;
    }

    const idToken = authHeader.split('Bearer ')[1];

    let decodedHeader;
    try {
        decodedHeader = jwt.decode(idToken, { complete: true });
    } catch (e) {
        console.error('[AUTH] Invalid token format:', e);
        res.status(403).json({ error: 'Token inválido o malformado.' });
        return null;
    }

    if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
        res.status(403).json({ error: 'Token inválido: falta KID.' });
        return null;
    }

    const publicKeys = await fetchGooglePublicKeysWithRetry();
    if (!publicKeys) {
        console.error('[AUTH] No se pudieron obtener las claves públicas de Google para verificar el JWT.');
        res.status(503).json({ error: 'Servicio de autenticación no disponible temporalmente. Intenta nuevamente en unos segundos.' });
        return null;
    }

    const cert = publicKeys[decodedHeader.header.kid];
    if (!cert) {
        res.status(403).json({ error: 'Token inválido: firma desconocida.' });
        return null;
    }

    let decodedToken;
    try {
        let projectId = 'asistentehs-b594e';
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            try {
                let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
                if (rawKey.startsWith("'") && rawKey.endsWith("'")) rawKey = rawKey.slice(1, -1);
                const serviceAccount = JSON.parse(rawKey);
                if (serviceAccount.project_id) {
                    projectId = serviceAccount.project_id;
                }
            } catch (e) {
                console.error('[AUTH] Error parsing FIREBASE_SERVICE_ACCOUNT_KEY for token validation:', e.message);
            }
        }
        const verifyOptions = {
            algorithms: ['RS256'],
            audience: projectId,
            issuer: `https://securetoken.google.com/${projectId}`
        };
        decodedToken = jwt.verify(idToken, cert, verifyOptions);
    } catch (error) {
        console.error('[AUTH] Token verification failed:', error.message);
        res.status(403).json({ error: 'Token expirado o inválido.' });
        return null;
    }

    // Apply per-user rate limiting
    const uid = decodedToken.user_id || decodedToken.uid || decodedToken.sub;
    if (!uid) {
        res.status(403).json({ error: 'Token no contiene un ID de usuario válido.' });
        return null;
    }

    if (!checkUserRateLimit(uid)) {
        console.warn(`[RATE LIMIT] User ${uid} exceeded AI request limit.`);
        res.status(429).json({
            error: `Límite de ${AI_RATE_LIMIT} consultas por minuto alcanzado. Esperá un momento.`
        });
        return null;
    }

    return { ...decodedToken, uid }; // normalize uid
}
