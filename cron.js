import cron from 'node-cron';
import admin from 'firebase-admin';
import { Resend } from 'resend';

function getDaysLeft(dateStr, lifespanMonths = 0) {
    if (!dateStr) return null;
    const base = new Date(dateStr);
    if (isNaN(base.getTime())) return null;
    if (lifespanMonths) {
        base.setMonth(base.getMonth() + Number(lifespanMonths));
    }
    return Math.ceil((base.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export const initCronJobs = () => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[CRON] RESEND_API_KEY no configurada. Las notificaciones automáticas por correo no funcionarán.');
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('[CRON] Inicializando tareas programadas (node-cron)...');

    // Ejecutar todos los días a las 08:00 AM (hora del servidor)
    cron.schedule('0 8 * * *', async () => {
        console.log('[CRON] Ejecutando revisión diaria de vencimientos generales...');
        try {
            if (!admin.apps.length) {
                console.error('[CRON] Firebase Admin no está inicializado.');
                return;
            }

            const db = admin.firestore();
            const usersSnapshot = await db.collection('users').get();
            let notificationsSent = 0;

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const email = userData.email;
                if (!email) continue;

                const dataRef = db.collection('users').doc(userDoc.id).collection('data');
                const alerts = [];

                const fetchItems = async (key) => {
                    const snap = await dataRef.doc(key).get();
                    return snap.exists ? (snap.data().items || []) : [];
                };

                const ppeItems = await fetchItems('ppe_items');
                ppeItems.forEach(item => {
                    const daysLeft = getDaysLeft(item.purchaseDate, item.lifeMonths ?? 12);
                    if (daysLeft !== null && daysLeft <= 30) alerts.push({ type: 'EPP', label: item.type, daysLeft, isExpired: daysLeft < 0 });
                });

                const extinguishers = await fetchItems('extinguishers_inventory');
                extinguishers.forEach(ext => {
                    if (ext.ultimaCarga) {
                        const daysLeft = getDaysLeft(ext.ultimaCarga, 12);
                        if (daysLeft !== null && daysLeft <= 30) alerts.push({ type: 'Extintor (Recarga)', label: `Chapa #${ext.chapa}`, daysLeft, isExpired: daysLeft < 0 });
                    }
                    if (ext.ultimaPH) {
                        const daysLeft = getDaysLeft(ext.ultimaPH, 60);
                        if (daysLeft !== null && daysLeft <= 30) alerts.push({ type: 'Extintor (PH)', label: `Chapa #${ext.chapa}`, daysLeft, isExpired: daysLeft < 0 });
                    }
                });

                const contractors = await fetchItems('contractors_data');
                contractors.forEach(c => {
                    if (c.documentExpiresAt) {
                        const daysLeft = getDaysLeft(c.documentExpiresAt);
                        if (daysLeft !== null && daysLeft <= 15) alerts.push({ type: 'Contratista', label: `Doc. Principal de ${c.name}`, daysLeft, isExpired: daysLeft < 0 });
                    }
                });

                const workers = await fetchItems('workers_data');
                workers.forEach(w => {
                    if (w.artExpiresAt) {
                        const daysLeft = getDaysLeft(w.artExpiresAt);
                        if (daysLeft !== null && daysLeft <= 15) alerts.push({ type: 'Trabajador', label: `ART de ${w.name}`, daysLeft, isExpired: daysLeft < 0 });
                    }
                    if (w.lifeInsuranceExpiresAt) {
                        const daysLeft = getDaysLeft(w.lifeInsuranceExpiresAt);
                        if (daysLeft !== null && daysLeft <= 15) alerts.push({ type: 'Trabajador', label: `Seguro de Vida de ${w.name}`, daysLeft, isExpired: daysLeft < 0 });
                    }
                });

                const capas = await fetchItems('ehs_capa_db');
                capas.forEach(c => {
                    if (c.status !== 'Cerrada' && c.targetDate) {
                        const daysLeft = getDaysLeft(c.targetDate);
                        if (daysLeft !== null && daysLeft <= 7) alerts.push({ type: 'Acción Correctiva', label: c.title || 'CAPA Pendiente', daysLeft, isExpired: daysLeft < 0 });
                    }
                });

                const trainings = await fetchItems('training_history');
                trainings.forEach(t => {
                    if (t.nextTrainingDate) {
                        const daysLeft = getDaysLeft(t.nextTrainingDate);
                        if (daysLeft !== null && daysLeft <= 15) alerts.push({ type: 'Capacitación', label: t.topic || 'Re-entrenamiento', daysLeft, isExpired: daysLeft < 0 });
                    }
                });

                if (alerts.length > 0) {
                    let html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                            <div style="background-color: #ef4444; color: #ffffff; padding: 20px; text-align: center;">
                                <h2 style="margin: 0;">⚠️ Tienes ${alerts.length} alertas de vencimiento</h2>
                            </div>
                            <div style="padding: 20px;">
                                <p>Hola ${userData.name || 'Usuario'},</p>
                                <p>El sistema ha detectado los siguientes elementos próximos a vencer o ya vencidos:</p>
                                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                                    <thead>
                                        <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                                            <th style="padding: 10px; text-align: left;">Categoría</th>
                                            <th style="padding: 10px; text-align: left;">Elemento</th>
                                            <th style="padding: 10px; text-align: left;">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    alerts.forEach(a => {
                        const stateText = a.isExpired ? `<span style="color:#ef4444; font-weight:bold;">Vencido hace ${Math.abs(a.daysLeft)} días</span>` : `<span style="color:#f59e0b; font-weight:bold;">Vence en ${a.daysLeft} días</span>`;
                        html += `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px;"><strong>${a.type}</strong></td>
                                <td style="padding: 10px;">${a.label}</td>
                                <td style="padding: 10px;">${stateText}</td>
                            </tr>
                        `;
                    });

                    html += `
                                    </tbody>
                                </table>
                                <div style="margin-top: 30px; text-align: center;">
                                    <a href="https://asistentehs.com" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Revisar en el Sistema</a>
                                </div>
                            </div>
                            <div style="background-color: #f8fafc; padding: 15px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
                                Este es un aviso automático generado por Asistente HS.
                            </div>
                        </div>
                    `;

                    if (process.env.RESEND_API_KEY) {
                        try {
                            await resend.emails.send({
                                from: 'Asistente HYS <soporte@asistentehs.com>',
                                to: email,
                                subject: `⚠️ Alerta Diaria: ${alerts.length} vencimientos detectados`,
                                html: html
                            });
                            notificationsSent++;
                            console.log(`[CRON] Correo enviado a ${email} (${alerts.length} elementos).`);
                        } catch (emailErr) {
                            console.error(`[CRON] Error enviando correo a ${email}:`, emailErr);
                        }
                    }
                }
            }

            console.log(`[CRON] Revisión completada. Usuarios notificados: ${notificationsSent}`);

        } catch (error) {
            console.error('[CRON] Error crítico ejecutando la revisión:', error);
        }
    });
};
