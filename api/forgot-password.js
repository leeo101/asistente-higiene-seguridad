import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const resetTokens = new Map();

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email } = req.body;
        const token = crypto.randomBytes(32).toString('hex');
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        resetTokens.set(token, { email, code, expires: Date.now() + 3600000 });

        const resetLink = `https://${req.headers.host}/reset-password?token=${token}`;

        const { data, error } = await resend.emails.send({
            from: 'Asistente HYS <soporte@asistentehs.com>',
            to: email,
            subject: 'Restablecer tu contraseña - Asistente HYS',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://asistentehs-b594e.web.app/logo.png" alt="Asistente HYS" style="height: 60px; width: auto;">
                    </div>
                    <h2 style="color: #3b82f6; text-align: center;">Tu Código de Seguridad</h2>
                    <p style="text-align: center; font-size: 1.1rem;">Has solicitado restablecer tu contraseña en el <strong>Asistente HYS</strong>.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${code}</span>
                    </div>

                    <p style="text-align: center;">O haz clic en el siguiente botón para continuar directamente:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Restablecer Contraseña</a>
                    </div>
                    <p style="color: #666; font-size: 0.85rem; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">Si no solicitaste este cambio, puedes ignorar este correo. El código expira en 1 hora.</p>
                </div>
            `
        });

        if (error) throw error;

        return res.status(200).json({
            message: 'Correo enviado. Revisa tu bandeja de entrada.'
        });

    } catch (error) {
        console.error("Resend Error:", error);
        return res.status(500).json({
            error: 'Error al enviar el correo.',
            details: error.message
        });
    }
}
