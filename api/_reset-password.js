import { setCorsHeaders } from './_cors.js';

/**
 * Este endpoint fue reemplazado por el flujo nativo de Firebase Auth.
 * El restablecimiento de contraseña se hace directamente desde el cliente
 * con confirmPasswordReset() de firebase/auth, usando el oobCode del email.
 * 
 * Este handler existe solo para evitar un 404 si alguien llama a esta ruta,
 * y deja un log de auditoría claro.
 */
export default async function handler(req, res) {
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    console.warn('[SECURITY] Deprecated endpoint /api/reset-password called from:', req.headers.origin || req.ip);

    return res.status(410).json({
        error: 'Este endpoint fue reemplazado. El restablecimiento de contraseña se maneja directamente con Firebase Auth.',
        code: 'ENDPOINT_DEPRECATED'
    });
}
