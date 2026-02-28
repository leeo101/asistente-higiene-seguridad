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
                            <p style="color: #64748b; font-size: 14px; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Tu Código de Verificación</p>
                            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; display: inline-block; border: 1px dashed #cbd5e1;">
                                <span style="font-size: 36px; font-weight: 800; color: #1e3a8a; letter-spacing: 8px; font-family: monospace;">${code}</span>
                            </div>
                        </div>

                        <p style="color: #475569; line-height: 1.6; font-size: 16px; text-align: center;">
                            O si lo prefieres, puedes acceder directamente haciendo clic en el siguiente botón:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">Restablecer Contraseña</a>
                        </div>

                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px;">
                            <strong>¿No solicitaste este cambio?</strong><br>
                            Puedes ignorar este correo de forma segura. El código y el enlace expirarán en 1 hora por tu seguridad.
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
