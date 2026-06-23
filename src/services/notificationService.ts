// ─── Notification Service ───────────────────────────────────────────────────
// Gestiona permisos y disparo de notificaciones nativas del sistema operativo.

const APP_ICON = '/favicon-180.png';
const APP_BADGE = '/favicon-32.png';
const APP_NAME = 'Asistente HYS';

import { messaging, db } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';

export type NotifPermission = 'granted' | 'denied' | 'default' | 'unsupported';


/** Retorna el estado actual del permiso de notificaciones */
export function getPermissionStatus(): NotifPermission {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission as NotifPermission;
}

/** Solicita permiso al usuario para mostrar notificaciones */
export async function requestNotificationPermission(): Promise<NotifPermission> {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result as NotifPermission;
}

/** Retorna true si las notificaciones están bloqueadas manualmente */
export function isNotificationDenied(): boolean {
    return typeof Notification !== 'undefined' && Notification.permission === 'denied';
}

const VAPID_KEY = 'BP7GtLUGNUkD3SKfdXD2mbou3KXh-9PiRVNIZ1-EEnYz9e62vnC-Hng8vWZxN7sNVZ5_Hp22gP6rBGaCgiwePvs';

export async function requestAndSaveToken(uid: string) {
    try {
        const msg = messaging();
        if (!msg) return; // No soportado

        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.log('Permiso de notificaciones denegado.');
            return;
        }

        const token = await getToken(msg, { vapidKey: VAPID_KEY });
        if (token) {
            console.log('FCM Token obtenido. Guardando en Firestore...', token);
            await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
                token,
                updatedAt: Date.now()
            });
        } else {
            console.log('No se pudo obtener el FCM token.');
        }

        onMessage(msg, (payload) => {
            console.log('[Foreground] Notificación recibida:', payload);
            sendNotification({
                title: payload.notification?.title || 'Notificación',
                body: payload.notification?.body || '',
                tag: payload.data?.tag,
                url: payload.data?.url
            });
        });

    } catch (e) {
        console.error('Error al registrar notificaciones push:', e);
    }
}


export interface NotificationPayload {
    title: string;
    body: string;
    tag?: string;
    url?: string;
    icon?: string;
    badge?: string;
    urgency?: 'expired' | 'warning' | 'info';
}

/**
 * Dispara una notificación nativa del sistema.
 * Usa el Service Worker si está disponible (requerido en algunos navegadores).
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission !== 'granted') return false;

    const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon ?? APP_ICON,
        badge: payload.badge ?? APP_BADGE,
        tag: payload.tag ?? 'hys-notif',
        data: { url: payload.url ?? '/' },
        requireInteraction: payload.urgency === 'expired',
        silent: false,
    };

    try {
        // Intentar via Service Worker (mejor soporte en mobile)
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(payload.title, options);
            return true;
        }
        // Fallback directo
        new Notification(payload.title, options);
        return true;
    } catch (e) {
        console.warn('[NotifService] Error al enviar notificación:', e);
        return false;
    }
}

// ─── Claves de localStorage para controlar envíos ──────────────────────────

const SENT_TODAY_KEY = 'hys_notifs_sent_date';
const SENT_IDS_KEY = 'hys_notifs_sent_ids';

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0]; // "2024-01-15"
}

/** Retorna los IDs de notificaciones ya enviadas hoy */
export function getSentTodayIds(): Set<string> {
    const today = getTodayKey();
    const savedDate = localStorage.getItem(SENT_TODAY_KEY);
    if (savedDate !== today) {
        // Nuevo día → limpiar
        localStorage.setItem(SENT_TODAY_KEY, today);
        localStorage.setItem(SENT_IDS_KEY, JSON.stringify([]));
        return new Set();
    }
    try {
        const raw = localStorage.getItem(SENT_IDS_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch {
        return new Set();
    }
}

/** Marca un ID de notificación como ya enviado hoy */
export function markAsSentToday(id: string): void {
    const today = getTodayKey();
    localStorage.setItem(SENT_TODAY_KEY, today);
    const sent = getSentTodayIds();
    sent.add(id);
    localStorage.setItem(SENT_IDS_KEY, JSON.stringify([...sent]));
}

// ─── Tipos de categoría → URL de destino ──────────────────────────────────

const TYPE_URLS: Record<string, string> = {
    ppe: '/contractors',
    extinguisher: '/extinguishers',
    contractor: '/contractors',
    worker: '/contractors',
};

const TYPE_EMOJI: Record<string, string> = {
    ppe: '🦺',
    extinguisher: '🧯',
    contractor: '🏢',
    worker: '👷',
};

export interface ExpiryItem {
    id: string;
    type: string;
    label: string;
    daysLeft: number;
    isExpired: boolean;
}

/**
 * Envía notificaciones de vencimiento para los items dados.
 * Solo envía cada ID una vez por día.
 */
export async function scheduleExpiryNotifications(items: ExpiryItem[]): Promise<number> {
    if (Notification.permission !== 'granted') return 0;

    const sentToday = getSentTodayIds();
    let sent = 0;

    for (const item of items) {
        if (sentToday.has(item.id)) continue;

        const emoji = TYPE_EMOJI[item.type] ?? '⚠️';
        const url = TYPE_URLS[item.type] ?? '/';

        const title = item.isExpired
            ? `❌ Vencido — ${APP_NAME}`
            : `⚠️ Vencimiento próximo — ${APP_NAME}`;

        const body = item.isExpired
            ? `${emoji} ${item.label} — Vencido hace ${Math.abs(item.daysLeft)} día${Math.abs(item.daysLeft) !== 1 ? 's' : ''}`
            : `${emoji} ${item.label} — Vence en ${item.daysLeft} día${item.daysLeft !== 1 ? 's' : ''}`;

        const ok = await sendNotification({
            title,
            body,
            tag: item.id,
            url,
            urgency: item.isExpired ? 'expired' : 'warning',
        });

        if (ok) {
            markAsSentToday(item.id);
            sent++;
            // Pausa entre notificaciones para no saturar
            await new Promise(r => setTimeout(r, 400));
        }
    }

    return sent;
}

/** Envía una notificación de prueba */
export async function sendTestNotification(): Promise<boolean> {
    return sendNotification({
        title: `🔔 Notificaciones activas — ${APP_NAME}`,
        body: 'Las alertas de vencimiento te llegarán automáticamente cada día.',
        tag: 'hys-test',
        url: '/settings',
        urgency: 'info',
    });
}

// ─── Scheduling por fecha/hora (calendario) ───────────────────────────────

const activeTimers = new Map<string, NodeJS.Timeout | number>();

/**
 * Cancela un recordatorio programado.
 */
export function cancelReminder(id: string): void {
    if (activeTimers.has(id)) {
        clearTimeout(activeTimers.get(id) as number);
        activeTimers.delete(id);
    }
}

/**
 * Programa un recordatorio para una fecha y hora específicas.
 * @param id - ID único del evento.
 * @param date - Formato YYYY-MM-DD
 * @param time - Formato HH:MM
 * @param title - Título del evento
 */
export function scheduleReminder(id: string, date: string, time: string, title: string): void {
    if (getPermissionStatus() !== 'granted') return;
    
    cancelReminder(id);
    if (!date || !time) return;

    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const targetDate = new Date(year, month - 1, day, hour, minute);
    const delay = targetDate.getTime() - Date.now();
    
    const MAX_TIMEOUT = 2147483647; // Máximo timeout soportado (~24.8 días)

    if (delay > 0 && delay < MAX_TIMEOUT) {
        const timerId = setTimeout(async () => {
            await sendNotification({
                title: `📅 Recordatorio de Seguridad — ${APP_NAME}`,
                body: `${time} hs — ${title}`,
                tag: `reminder-${id}`,
                url: '/calendar',
                urgency: 'info'
            });
            activeTimers.delete(id);
        }, delay);
        activeTimers.set(id, timerId);
    }
}

/**
 * Carga todos los eventos desde localStorage y los programa.
 */
export function initializeSchedules(events: any[]): void {
    for (const timerId of activeTimers.values()) {
        clearTimeout(timerId as number);
    }
    activeTimers.clear();
    
    if (!Array.isArray(events)) return;
    
    events.forEach(event => {
        const eventId = event.id || `${event.date}-${event.time}-${event.title}`;
        scheduleReminder(eventId, event.date, event.time, event.title);
    });
}

