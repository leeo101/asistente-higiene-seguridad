import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || 're_LbuBHoYV_MpCW9AmBko1x5nELXXwLERwy');

console.log('--- PRUEBA DE RESEND ---');
console.log('Enviando correo de prueba a onboarding@resend.dev...');

try {
    const { data, error } = await resend.emails.send({
        from: 'Asistente HYS <onboarding@resend.dev>',
        to: 'leeo1010@live.com.ar', // Probamos con el mail del usuario si es el dueño
        subject: 'Prueba de Resend - Asistente HYS',
        html: '<p>Si recibes esto, la migración a Resend ha sido exitosa.</p>'
    });

    if (error) {
        console.error('❌ Error de Resend:', error);
    } else {
        console.log('✅ Correo enviado con éxito. ID:', data.id);
    }
} catch (error) {
    console.error('❌ Error de conexión:', error);
}

process.exit();
