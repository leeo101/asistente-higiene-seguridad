import cron from 'node-cron';
import admin from 'firebase-admin';
import { Resend } from 'resend';

export const initCronJobs = () => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[CRON] RESEND_API_KEY no configurada. Las notificaciones automáticas por correo no funcionarán.');
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('[CRON] Inicializando tareas programadas (node-cron)...');

    // Ejecutar todos los días a las 08:00 AM (hora del servidor)
    cron.schedule('0 8 * * *', async () => {
        console.log('[CRON] Ejecutando revisión diaria de extintores (Vencimientos a 30 días)...');
        try {
            if (!admin.apps.length) {
                console.error('[CRON] Firebase Admin no está inicializado.');
                return;
            }

            const db = admin.firestore();
            
            // Buscar en todas las subcolecciones 'extintores' de la BD
            const extintoresSnapshot = await db.collectionGroup('extintores').get();
            
            const today = new Date();
            let notificationsSent = 0;
            const userAlerts = {};

            extintoresSnapshot.forEach(doc => {
                const ext = doc.data();
                const userId = doc.ref.parent.parent?.id; // ID del usuario dueño del equipo
                
                if (!userId || !ext.vencimientoRecarga) return;

                const vto = new Date(ext.vencimientoRecarga + 'T12:00:00Z');
                
                // Calcular días restantes
                const diffDays = Math.ceil((vto.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                // Si faltan exactamente entre 1 y 30 días para vencer
                if (diffDays > 0 && diffDays <= 30) {
                    // Solo alertar si no se mandó una alerta recientemente (en los últimos 28 días)
                    const lastAlert = ext.alertSentAt ? new Date(ext.alertSentAt).getTime() : 0;
                    if (today.getTime() - lastAlert > (1000 * 60 * 60 * 24 * 28)) {
                        if (!userAlerts[userId]) userAlerts[userId] = [];
                        userAlerts[userId].push({ id: doc.id, ref: doc.ref, ...ext });
                    }
                }
            });

            // Enviar un solo correo resumen por cada usuario con equipos por vencer
            for (const userId of Object.keys(userAlerts)) {
                const userDoc = await db.collection('users').doc(userId).get();
                if (!userDoc.exists) continue;
                
                const userData = userDoc.data();
                const email = userData.email;
                if (!email) continue;

                const extintores = userAlerts[userId];
                
                let html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
                        <div style="background-color: #ef4444; color: #ffffff; padding: 20px; text-align: center;">
                            <h2 style="margin: 0; font-size: 20px;">⚠️ Alerta de Vencimiento de Matafuegos</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p style="font-size: 16px;">Hola ${userData.name || ''},</p>
                            <p style="font-size: 15px; color: #475569;">Te informamos que los siguientes <strong>${extintores.length} extintores</strong> están a punto de vencer en los próximos 30 días y requieren recarga o inspección:</p>
                            
                            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                                        <th style="padding: 12px 8px; text-align: left; color: #0f172a;">Chapa / Empresa</th>
                                        <th style="padding: 12px 8px; text-align: left; color: #0f172a;">Ubicación</th>
                                        <th style="padding: 12px 8px; text-align: left; color: #0f172a;">Vencimiento</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;

                for (const ext of extintores) {
                    const vtoFormateado = new Date(ext.vencimientoRecarga + 'T12:00:00Z').toLocaleDateString('es-AR');
                    const emp = ext.empresa ? ` (${ext.empresa})` : '';
                    html += `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px 8px;"><strong>${ext.numero || ext.chapa || 'S/N'}</strong><br><span style="color: #64748b; font-size: 12px;">${emp}</span></td>
                            <td style="padding: 12px 8px; color: #475569;">${ext.ubicacion || 'N/A'}</td>
                            <td style="padding: 12px 8px; color: #dc2626; font-weight: bold;">${vtoFormateado}</td>
                        </tr>
                    `;
                    // Registrar que se envió la alerta para no volver a enviar mañana
                    await ext.ref.update({ alertSentAt: new Date().toISOString() });
                }

                html += `
                                </tbody>
                            </table>
                            <div style="margin-top: 30px; text-align: center;">
                                <a href="https://asistentehs.com" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ingresar al Sistema</a>
                            </div>
                        </div>
                        <div style="background-color: #f8fafc; padding: 15px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
                            Este es un aviso automático generado por Asistente HS.<br>
                            Si deseas deshabilitar estas alertas, contacta a soporte.
                        </div>
                    </div>
                `;

                if (process.env.RESEND_API_KEY) {
                    try {
                        await resend.emails.send({
                            from: 'Asistente HYS <soporte@asistentehs.com>',
                            to: email,
                            subject: `⚠️ Alerta: ${extintores.length} extintor(es) por vencer`,
                            html: html
                        });
                        notificationsSent++;
                        console.log(`[CRON] Correo de alerta enviado a ${email} (${extintores.length} extintores).`);
                    } catch (emailErr) {
                        console.error(`[CRON] Error enviando correo a ${email}:`, emailErr);
                    }
                }
            }

            console.log(`[CRON] Revisión completada. Usuarios notificados: ${notificationsSent}`);

        } catch (error) {
            console.error('[CRON] Error crítico ejecutando la revisión:', error);
        }
    });
};
