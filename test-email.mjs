import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function testEmail() {
    console.log("Testing SMTP with:", process.env.EMAIL_USER);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: { name: 'Asistente HYS Test', address: process.env.EMAIL_USER },
        to: 'asistente.hs.soporte@gmail.com', // Testing send to self
        subject: 'Test Email - SMTP Check',
        text: 'This is a test email to verify SMTP configuration.'
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");
        console.log("Response:", info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

testEmail();
