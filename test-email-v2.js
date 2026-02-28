import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'asistente.hs.soporte@gmail.com',
        pass: process.env.EMAIL_PASS || 'bslx yhce ffli lmoc'
    }
});

console.log('--- DIAGNÓSTICO DE CORREO ---');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'asistente.hs.soporte@gmail.com');
console.log('Probando verificación...');

try {
    const success = await transporter.verify();
    if (success) {
        console.log('✅ Servidor de correo listo para enviar mensajes');
    }
} catch (error) {
    console.error('❌ Error de conexión:', error);
}

process.exit();
