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
        if (email !== "leorodriguezbordon99@gmail.com") {
            return res.status(404).json({ error: 'Usuario no encontrado. Asegúrese de ingresar el correo registrado.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        resetTokens.set(token, { email, expires: Date.now() + 3600000 }); // 1 hr expiration

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
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Asistente H&S - Recuperación de Contraseña',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #3b82f6;">Recuperación de Contraseña</h2>
                    <p>Hola,</p>
                    <p>Has solicitado restablecer tu contraseña para Asistente H&S. Haz clic en el siguiente enlace para crear una nueva:</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Restablecer mi contraseña</a>
                    <p>Si no fuiste tú, simplemente ignora este correo.</p>
                    <p>Saludos,<br>El equipo de Asistente H&S</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Correo enviado. Revisa tu bandeja de entrada.' });

    } catch (error) {
        console.error("Mail Error:", error);
        return res.status(500).json({ error: 'Error al enviar el correo, verifique la configuración SMTP' });
    }
}
