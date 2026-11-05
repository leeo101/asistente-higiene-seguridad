import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function initializeFirebase() {
    let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!rawKey) {
        throw new Error('Falta FIREBASE_SERVICE_ACCOUNT_KEY en el archivo .env');
    }
    if (rawKey.startsWith("'") && rawKey.endsWith("'")) {
        rawKey = rawKey.slice(1, -1);
    }
    const serviceAccount = JSON.parse(rawKey);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    return { db: admin.firestore(), auth: admin.auth() };
}

export function buildCyberMondayText(userName = 'Colega') {
    const cleanName = userName && userName.trim() ? userName.trim() : 'Colega';
    const promoUrl = 'https://asistentehs.com/subscribe?promo=cybermonday';

    return `Hola ${cleanName},

Como ya tenés tu cuenta registrada en Asistente de Higiene y Seguridad, durante las próximas 48 horas por el Cyber Monday habilitamos un beneficio exclusivo para que puedas volver a ingresar y utilizar todas las herramientas PRO por solo 0,99 USD este mes (precio habitual: 2,00 USD).

Con tu cuenta PRO tenés acceso completo a:
- Generación de PDFs A4 con tu propio logo y firma profesional.
- Protocolos oficiales SRT: Ruido (85/12), Iluminación (84/12), PAT (900/15), RGRL y Carga de Fuego (Dec. 351/79).
- Cámara de Riesgos y Asesor con IA para detección de EPP y redacción de ATS.
- Firmas digitales por código QR y WhatsApp para capacitaciones y entregas de EPP.

Podés activar el beneficio ingresando con tu cuenta desde este enlace:
${promoUrl}

Si tenés alguna consulta, podés responder directamente a este correo.

Saludos cordiales,
Equipo de Asistente de Higiene y Seguridad Laboral
https://asistentehs.com`;
}

export function buildCyberMondayHtml(userName = 'Colega') {
    const cleanName = userName && userName.trim() ? userName.trim() : 'Colega';
    const promoUrl = 'https://asistentehs.com/subscribe?promo=cybermonday';
    const logoUrl = 'https://asistentehs.com/logo.png';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asistente de Higiene y Seguridad - Beneficio Cyber Monday</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        
        <!-- Encabezado con el Logo Nuevo HYS -->
        <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #2563eb;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 16px auto;">
                    <tr>
                        <td style="background-color: #ffffff; padding: 12px 22px; border-radius: 14px;">
                            <img src="${logoUrl}" width="160" alt="Asistente H&S" style="width: 160px; max-width: 160px; height: auto; display: block; border: 0; outline: none; text-decoration: none;">
                        </td>
                    </tr>
                </table>
                <div style="color: #93c5fd; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
                    Especial Cyber Monday • Usuarios Registrados
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 23px; font-weight: 800; line-height: 1.3;">
                    Volvé a potenciar tu gestión profesional
                </h1>
            </td>
        </tr>

        <!-- Contenido Principal -->
        <tr>
            <td style="padding: 34px 28px; background-color: #ffffff;">
                <h2 style="color: #0f172a; margin: 0 0 14px 0; font-size: 19px; font-weight: 700;">
                    Hola, ${cleanName}:
                </h2>
                
                <p style="color: #334155; line-height: 1.65; font-size: 15px; margin: 0 0 20px 0;">
                    Vimos que ya tenés tu cuenta registrada en el <strong>Asistente de Higiene y Seguridad</strong>. Con motivo del <strong>Cyber Monday</strong>, habilitamos una propuesta especial para que puedas reingresar y aprovechar todas las herramientas completas de la plataforma.
                </p>

                <!-- Tarjeta de Beneficio Cyber Monday -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 12px; margin: 24px 0;">
                    <tr>
                        <td style="padding: 20px 22px; text-align: center;">
                            <div style="color: #1e40af; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                                Beneficio Cyber Monday • Válido por 48 horas
                            </div>
                            <div style="margin: 8px 0;">
                                <span style="color: #94a3b8; font-size: 17px; text-decoration: line-through; margin-right: 8px;">
                                    2,00 USD
                                </span>
                                <span style="color: #0f172a; font-size: 32px; font-weight: 800;">
                                    0,99 USD
                                </span>
                            </div>
                            <div style="color: #475569; font-size: 13px;">
                                Exclusivo para cuentas ya registradas • Mercado Pago (ARS) o Stripe
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Lista de herramientas (sin logos extras) -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 22px; margin: 22px 0;">
                    <h3 style="color: #1e3a8a; margin: 0 0 12px 0; font-size: 15px; font-weight: 700;">
                        Todo lo que desbloqueás hoy en tu cuenta:
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14.5px; line-height: 1.8;">
                        <li><strong>PDFs A4 con tu Logo y Matrícula:</strong> Informes profesionales listos para presentar ante la ART o tus clientes.</li>
                        <li><strong>Protocolos Oficiales SRT:</strong> Ruido (85/12), Iluminación (84/12), PAT (900/15), RGRL y Carga de Fuego (Dec. 351/79).</li>
                        <li><strong>Cámara de Riesgos y Asesor IA:</strong> Relevamiento fotográfico de EPP y generación de ATS en segundos.</li>
                        <li><strong>Firmas por QR y WhatsApp:</strong> Registro digital de capacitaciones y entregas de EPP desde el celular.</li>
                    </ul>
                </div>

                <!-- Botón de acceso -->
                <div style="text-align: center; margin: 30px 0 22px 0;">
                    <a href="${promoUrl}" style="display: inline-block; padding: 15px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15.5px;">
                        Ingresar a mi cuenta con el beneficio
                    </a>
                    <p style="color: #64748b; font-size: 12.5px; margin: 10px 0 0 0;">
                        Al ingresar con tu correo registrado se aplica automáticamente el valor de 0,99 USD.
                    </p>
                </div>

                <p style="color: #64748b; font-size: 13px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin: 26px 0 0 0; text-align: center;">
                    Si tenés alguna consulta, podés responder directamente a este correo.
                </p>
            </td>
        </tr>

        <!-- Pie de correo limpio (sin imagen adjunta ni logo roto) -->
        <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #475569; font-size: 12.5px; font-weight: 700; margin: 0 0 4px 0;">
                    Asistente de Higiene y Seguridad Laboral
                </p>
                <p style="color: #94a3b8; font-size: 11.5px; margin: 0;">
                    © 2026 Asistente H&amp;S • <a href="https://asistentehs.com" style="color: #64748b; text-decoration: none;">asistentehs.com</a>
                </p>
            </td>
        </tr>

    </table>
</body>
</html>`;
}

async function getNonProUsers(auth, db) {
    let allUsers = [];
    let nextPageToken;

    do {
        const result = await auth.listUsers(1000, nextPageToken);
        allUsers = allUsers.concat(result.users);
        nextPageToken = result.pageToken;
    } while (nextPageToken);

    const nonProUsers = [];
    const proUsers = [];

    for (const user of allUsers) {
        if (!user.email) continue;

        const hasCustomClaimPro = Boolean(user.customClaims && user.customClaims.isPro === true);

        let hasActiveFirestoreSub = false;
        let subDetails = null;
        try {
            const subDoc = await db.collection('users').doc(user.uid).collection('data').doc('subscriptionData').get();
            if (subDoc.exists) {
                const data = subDoc.data();
                subDetails = data;
                const expiry = parseInt(data?.expiry || '0', 10);
                if (data?.status === 'active' && expiry > Date.now()) {
                    hasActiveFirestoreSub = true;
                }
            }
        } catch {
            // Ignorar error puntual de lectura
        }

        if (hasCustomClaimPro || hasActiveFirestoreSub) {
            const expiry = parseInt(subDetails?.expiry || '0', 10);
            const daysLeft = expiry ? Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            proUsers.push({
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                hasCustomClaimPro,
                status: subDetails?.status || 'sin_doc',
                expiryDate: expiry ? new Date(expiry).toLocaleDateString('es-AR') : 'Sin vencimiento / Vitalicio',
                daysLeft,
                provider: subDetails?.provider || 'custom_claim',
                lastSignIn: user.metadata?.lastSignInTime,
                createdAt: user.metadata?.creationTime
            });
        } else {
            nonProUsers.push({
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0]
            });
        }
    }

    return { total: allUsers.length, proUsers, nonProUsers };
}

async function sendCampaignEmail(toEmail, userName) {
    const subject = 'Beneficio Cyber Monday en tu cuenta de Asistente H&S';

    const info = await transporter.sendMail({
        from: `"Asistente Higiene y Seguridad" <${process.env.EMAIL_USER}>`,
        replyTo: process.env.EMAIL_USER,
        to: toEmail,
        subject,
        text: buildCyberMondayText(userName),
        html: buildCyberMondayHtml(userName)
    });

    return info;
}

const args = process.argv.slice(2);
const testIndex = args.indexOf('--test');
const sendAll = args.includes('--send-all');
const dryRun = args.includes('--dry-run');

async function main() {
    const { db, auth } = await initializeFirebase();
    console.log('Escaneando usuarios registrados en Firebase Auth...');
    const { total, proUsers, nonProUsers } = await getNonProUsers(auth, db);

    console.log(`\n📊 Resumen de Firebase Auth:`);
    console.log(`   - Total registrados: ${total}`);
    console.log(`   - Usuarios YA PRO (se excluyen): ${proUsers.length}`);
    console.log(`   - Usuarios SIN PRO (destinatarios de la oferta): ${nonProUsers.length}\n`);

    if (dryRun) {
        console.log('👑 Lista de usuarios PRO:');
        proUsers.forEach((u, i) => console.log(`   ${i + 1}. ${u.email} (${u.name}) | Vence: ${u.expiryDate} (${u.daysLeft !== null ? u.daysLeft + ' días' : 'Vitalicio'}) | Origen: ${u.provider} | Último ingreso: ${u.lastSignIn}`));
        console.log('\n📋 Lista de destinatarios (Sin PRO):');
        nonProUsers.forEach((u, i) => console.log(`   ${i + 1}. ${u.email} (${u.name})`));
        process.exit(0);
    }

    if (testIndex !== -1 && args[testIndex + 1]) {
        const testEmail = args[testIndex + 1];
        console.log(`📧 Enviando correo de PRUEBA a: ${testEmail}...`);
        const res = await sendCampaignEmail(testEmail, 'Enzo');
        console.log(`✅ Correo de prueba enviado con éxito (MessageID: ${res?.messageId || 'OK'})`);
        process.exit(0);
    }

    if (sendAll) {
        console.log(`🚀 Iniciando envío masivo a ${nonProUsers.length} usuarios sin PRO...\n`);
        let sent = 0;
        let failed = 0;

        for (const u of nonProUsers) {
            try {
                await sendCampaignEmail(u.email, u.name);
                sent++;
                console.log(`✅ [${sent}/${nonProUsers.length}] Enviado a: ${u.email}`);
                await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
                failed++;
                console.error(`❌ Error enviando a ${u.email}:`, err.message);
            }
        }

        console.log(`\n🎉 Campaña finalizada: ${sent} enviados, ${failed} fallidos.`);
        process.exit(0);
    }

    console.log('Uso:');
    console.log('  node scripts/send-cybermonday-email.js --test email@ejemplo.com');
    console.log('  node scripts/send-cybermonday-email.js --dry-run');
    console.log('  node scripts/send-cybermonday-email.js --send-all');
    process.exit(0);
}

main().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
