import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
    console.time('resend-call');
    console.log('--- DIAGNÓSTICO DE LATENCIA RESEND ---');
    console.log('Enviando a: leeo1010@live.com.ar');

    try {
        const result = await resend.emails.send({
            from: 'Asistente HYS <soporte@asistentehs.com>',
            to: 'leeo1010@live.com.ar',
            subject: 'Test de Latencia',
            html: '<p>Probando tiempo de respuesta...</p>'
        });
        console.timeEnd('resend-call');
        console.log('Resultado:', result);
    } catch (error) {
        console.timeEnd('resend-call');
        console.error('Error:', error);
    }
}

test();
