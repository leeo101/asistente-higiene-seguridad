import admin from 'firebase-admin';

// Initialize Firebase Admin once (shared across warm instances)
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

/**
 * Verifies the Firebase ID token from the Authorization header.
 * Returns the decoded token on success, or sends a 401/403 response and returns null.
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
        console.warn('[AUTH] Firebase Admin not initialized — skipping verification.');
        // In case of missing config, block access to prevent unprotected endpoints
        res.status(503).json({ error: 'Servicio no disponible: autenticación no configurada.' });
        return null;
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('[AUTH] Token verification failed:', error.message);
        res.status(403).json({ error: 'Token inválido o expirado.' });
        return null;
    }
}
