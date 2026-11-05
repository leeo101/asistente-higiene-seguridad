import nodemailer from 'nodemailer';

let transporterInstance = null;

export function getMailTransporter() {
    if (!transporterInstance) {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('[MAILER] Missing EMAIL_USER or EMAIL_PASS in environment variables.');
        }
        transporterInstance = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    return transporterInstance;
}

export async function sendAppMail({ to, subject, html, text }) {
    const transporter = getMailTransporter();
    const fromAddress = `"Asistente Higiene y Seguridad" <${process.env.EMAIL_USER}>`;

    const mailOptions = {
        from: fromAddress,
        replyTo: process.env.EMAIL_USER,
        to,
        subject,
        html,
        text: text || undefined
    };

    return transporter.sendMail(mailOptions);
}
