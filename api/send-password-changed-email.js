import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Credentials', true)
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email requerido' });
        }

        const { data, error } = await resend.emails.send({
            from: 'Asistente HYS <soporte@asistentehs.com>',
            to: email,
            subject: 'Tu contraseña ha sido actualizada - Asistente HYS',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                        <img src="https://asistentehs.com/logo.png" alt="Asistente HYS" style="width: 80px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Seguridad de Cuenta</h1>
                    </div>
                    
                    <div style="padding: 40px 30px; background-color: #ffffff;">
                        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700;">Hola,</h2>
                        <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                            Te informamos que la contraseña de tu cuenta en el <strong>Asistente de Higiene y Seguridad</strong> ha sido modificada exitosamente hace unos momentos.
                        </p>
                        
                        <div style="margin: 35px 0; padding: 20px; background-color: #f1f5f9; border-radius: 12px; border-left: 4px solid #10b981;">
                            <p style="color: #334155; margin: 0; font-size: 15px; font-weight: 500;">
                                Ya puedes iniciar sesión en cualquier momento utilizando tu nueva clave de acceso.
                            </p>
                        </div>

                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px;">
                            <strong>¿No fuiste tú quien hizo este cambio?</strong><br>
                            Si no autorizaste este cambio, por favor contáctanos de inmediato a <a href="mailto:soporte@asistentehs.com" style="color: #2563eb; text-decoration: none;">soporte@asistentehs.com</a> para proteger tu cuenta y revertir la acción.
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

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error sending password changed notification:", error);
        return res.status(500).json({ error: 'Error al enviar notificación.' });
    }
}
