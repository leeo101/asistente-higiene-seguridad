import { Resend } from 'resend';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
    } catch (error) {
        console.error("Firebase Admin initialization error in forgot-password:", error);
    }
}

const resend = new Resend(process.env.RESEND_API_KEY);

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

        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY env var. Cannot generate Firebase token.");
        }

        // Generate password reset link using Firebase Admin SDK
        const actionCodeSettings = {
            url: `https://${req.headers.host}/reset-password`,
            handleCodeInApp: false,
        };

        let resetLink;
        try {
            resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
        } catch (authErr) {
            console.error("Error generating Firebase link:", authErr);
            return res.status(400).json({ error: "Usuario no encontrado o error en Firebase." });
        }

        const { data, error } = await resend.emails.send({
            from: 'Asistente H&S <soporte@asistentehs.com>',
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
                        
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">Restablecer Contraseña</a>
                        </div>

                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px;">
                            <strong>¿No solicitaste este cambio?</strong><br>
                            Puedes ignorar este correo de forma segura. El enlace expirará pronto por tu seguridad.
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
            error: 'Error al procesar la solicitud.',
            details: error.message
        });
    }
}
