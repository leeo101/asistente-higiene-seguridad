import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Credentials', true)
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return res.status(200).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email, name } = req.body;
        if (!email || !name) return res.status(400).json({ error: 'Email y nombre requeridos' });

        const { data, error } = await resend.emails.send({
            from: 'Asistente HYS <soporte@asistentehs.com>',
            to: email,
            subject: '¡Bienvenido al Asistente HYS!',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                        <img src="https://asistentehs.com/logo.png" alt="Asistente HYS" style="width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Asistente H&S</h1>
                    </div>
                    
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">¡Hola, ${name}!</h2>
                        <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                            Es un gusto saludarte. Gracias por unirte a nuestra comunidad de profesionales de Higiene y Seguridad Laboral.
                        </p>
                        <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                            Ya puedes empezar a potenciar tu trabajo con nuestras herramientas inteligentes de campo:
                        </p>
                        
                        <div style="margin: 30px 0; padding: 20px; background-color: #f1f5f9; border-radius: 12px;">
                            <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 15px;">
                                <li style="margin-bottom: 10px;"><strong>Cámara de Riesgos IA:</strong> Detección automática de EPP y peligros.</li>
                                <li style="margin-bottom: 10px;"><strong>Asesor de Seguridad:</strong> Consultas técnicas con IA basadas en normativa argentina.</li>
                                <li style="margin-bottom: 10px;"><strong>Gestión de Reportes:</strong> Generación de ATS, informes y cálculo de carga de fuego.</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin: 40px 0;">
                            <a href="https://asistentehs.com" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">Entrar al Panel</a>
                        </div>

                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px; text-align: center;">
                            Este es un correo automático (v2.5 - Dominio Oficial), por favor no respondas a esta dirección.<br>
                            &copy; 2026 Asistente de Higiene y Seguridad.
                        </p>
                    </div>
                </div>
            `
        });

        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Correo de bienvenida enviado' });
    } catch (err) {
        console.error("Welcome Email Error:", err);
        return res.status(500).json({ error: err.message });
    }
}
