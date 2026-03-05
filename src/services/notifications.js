/**
 * notifications.js — Utilidad para notificaciones push del navegador y scheduling local
 */

const activeTimers = new Map();

/**
 * Solicita permiso de notificaciones al usuario.
 * Retorna true si es otorgado.
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
}

export function hasNotificationPermission() {
    return 'Notification' in window && Notification.permission === 'granted';
}

export function isNotificationDenied() {
    return 'Notification' in window && Notification.permission === 'denied';
}

/**
 * Muestra una notificación inmediata.
 */
export function showNotification(title, body) {
    if (hasNotificationPermission()) {
        new Notification(title, { body, icon: '/logo192.png', badge: '/logo192.png' });
    }
}

/**
 * Programa un recordatorio para una fecha y hora específicas.
 * @param {string} id - ID único del evento.
 * @param {string} date - Formato YYYY-MM-DD
 * @param {string} time - Formato HH:MM
 * @param {string} title - Título del evento
 */
export function scheduleReminder(id, date, time, title) {
    if (!hasNotificationPermission()) return;

    // Clear existing for this event if any
    cancelReminder(id);

    if (!date || !time) return;

    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    // Create Date object considering local timezone
    const targetDate = new Date(year, month - 1, day, hour, minute);
    const delay = targetDate.getTime() - Date.now();

    // Limit to generic Max Timeout (~24.8 days)
    const MAX_TIMEOUT = 2147483647;

    if (delay > 0 && delay < MAX_TIMEOUT) {
        const timerId = setTimeout(() => {
            showNotification('Recordatorio de Seguridad', `${time} hs - ${title}`);
            activeTimers.delete(id);
        }, delay);
        activeTimers.set(id, timerId);
    }
}

/**
 * Cancela una notificación programada por ID.
 */
export function cancelReminder(id) {
    if (activeTimers.has(id)) {
        clearTimeout(activeTimers.get(id));
        activeTimers.delete(id);
    }
}

/**
 * Carga todos los eventos desde localStorage y los programa
 */
export function initializeSchedules(events) {
    // Clear everything
    for (const timerId of activeTimers.values()) {
        clearTimeout(timerId);
    }
    activeTimers.clear();

    if (!Array.isArray(events)) return;

    events.forEach(event => {
        const eventId = event.id || `${event.date}-${event.time}-${event.title}`;
        scheduleReminder(eventId, event.date, event.time, event.title);
    });
}
