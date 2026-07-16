import { setCorsHeaders } from './_cors.js';

// Note: This needs to share state with forgot-password if it's purely in-memory.
// In a serverless environment like Vercel, this usually requires a DB like Redis or Mongo.
// Since we don't have one set up, we will accept any valid-looking token for the mock.
export default async function handler(req, res) {
    // 🔐 Enable secure CORS configuration
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        // Simulate password reset logic (due to lack of persistent DB setup across Vercel lambdas)
        if (token.length > 10) {
            return res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
        } else {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

    } catch (error) {
        console.error("Reset Error:", error);
        return res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
}
