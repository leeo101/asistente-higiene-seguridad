import crypto from 'crypto';
import nodemailer from 'nodemailer';

// In Serverless, memory state resets between function invocations. 
// A real database should be used here. We will use a fallback logic or global if needed, 
// though this isn't strictly persistent across different edge nodes.
const resetTokens = new Map();

// Vercel Serverless Function for Forgot Password
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email } = req.body;

        // Simulating user lookup
        if (email !== "asistente.hs.soporte@gmail.com") {
            return res.status(404).json({ error: 'Usuario no encontrado. Asegúrese de ingresar el correo registrado.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
        resetTokens.set(token, { email, code, expires: Date.now() + 3600000 }); // 1 hr expiration

        // Set up Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetLink = `https://${req.headers.host}/reset-password?token=${token}`;

        const mailOptions = {
            from: { name: 'Asistente HYS', address: process.env.EMAIL_USER },
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
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({
            message: 'Correo enviado. Revisa tu bandeja de entrada.'
        });

    } catch (error) {
        console.error("Mail Error:", error);
        return res.status(500).json({ error: 'Error al enviar el correo, verifique la configuración SMTP' });
    }
}
