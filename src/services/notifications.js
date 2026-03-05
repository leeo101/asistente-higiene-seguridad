/**
 * notifications.js — Utilidad para notificaciones push del navegador
 */

/**
 * Solicita permiso de notificaciones al usuario.
 * Retorna: 'granted' | 'denied' | 'default'
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return await Notification.requestPermission();
}

/**
 * Muestra una notificación inmediata (para pruebas / confirmación).
 */
export function showNotification(title, body, icon = '/logo.png') {
    if (Notification.permission !== 'granted') return;
    new Notification(title, { body, icon, badge: '/logo.png' });
}

/**
 * Programa una notificación para X milisegundos en el futuro.
 * Retorna el timeoutId para poder cancelarla.
 */
export function scheduleNotification(title, body, msFromNow, icon = '/logo.png') {
    if (Notification.permission !== 'granted') return null;
    if (msFromNow <= 0) return null;
    // Cap at ~24 days (max reliable setTimeout)
    if (msFromNow > 2073600000) return null;

    const id = setTimeout(() => {
        showNotification(title, body, icon);
    }, msFromNow);
    return id;
}

/**
 * Cancela una notificación programada.
 */
export function cancelNotification(id) {
    if (id !== null && id !== undefined) clearTimeout(id);
}

/**
 * Programa recordatorios para todos los eventos de SafetyCalendar en localStorage.
 * Llama esto al cargar la app o al actualizar eventos.
 */
export function scheduleSafetyCalendarReminders() {
    if (Notification.permission !== 'granted') return;
    try {
        const events = JSON.parse(localStorage.getItem('safety_events') || '[]');
        const now = Date.now();
        events.forEach(event => {
            if (!event.date) return;
            const eventMs = new Date(event.date).getTime();
            // Recordatorio 24h antes
            const reminderMs = eventMs - 24 * 60 * 60 * 1000;
            if (reminderMs > now) {
                scheduleNotification(
                    `📅 Mañana: ${event.title || 'Evento programado'}`,
                    event.description || 'Tenés un evento de seguridad mañana.',
                    reminderMs - now
                );
            }
            // Recordatorio el mismo día a las 8am
            const eventDate = new Date(event.date);
            eventDate.setHours(8, 0, 0, 0);
            const sameDayMs = eventDate.getTime() - now;
            if (sameDayMs > 0) {
                scheduleNotification(
                    `🔔 Hoy: ${event.title || 'Evento de seguridad'}`,
                    event.description || 'Tenés un evento de seguridad hoy.',
                    sameDayMs
                );
            }
        });
    } catch { /* ignore */ }
}
