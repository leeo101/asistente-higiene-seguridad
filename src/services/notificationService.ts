// ─── Notification Service ───────────────────────────────────────────────────
// Gestiona permisos y disparo de notificaciones nativas del sistema operativo.

const APP_ICON = '/favicon-180.png';
const APP_BADGE = '/favicon-180.png'; // fallback — favicon-32 no existe
const APP_NAME = 'Asistente HYS';

import { getMessagingInstance, db } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export type NotifPermission = 'granted' | 'denied' | 'default' | 'unsupported';

/** Retorna el estado actual del permiso de notificaciones */
export function getPermissionStatus(): NotifPermission {
    if (Capacitor.isNativePlatform()) {
        // En nativo siempre optimista — real check is async
        return 'granted';
    }
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission as NotifPermission;
}

/** Solicita permiso al usuario para mostrar notificaciones */
export async function requestNotificationPermission(): Promise<NotifPermission> {
    if (Capacitor.isNativePlatform()) {
        try {
            let status = await PushNotifications.checkPermissions();
            if (status.receive === 'prompt') {
                status = await PushNotifications.requestPermissions();
            }
            return status.receive === 'granted' ? 'granted' : 'denied';
        } catch {
            return 'unsupported';
        }
    }
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result as NotifPermission;
}

/** Retorna true si las notificaciones están bloqueadas manualmente */
export function isNotificationDenied(): boolean {
    if (Capacitor.isNativePlatform()) return false;
    return typeof Notification !== 'undefined' && Notification.permission === 'denied';
}

const VAPID_KEY = 'BP7GtLUGNUkD3SKfdXD2mbou3KXh-9PiRVNIZ1-EEnYz9e62vnC-Hng8vWZxN7sNVZ5_Hp22gP6rBGaCgiwePvs';

// Guard to prevent duplicate registration
let _pushRegistered = false;

export async function requestAndSaveToken(uid: string) {
    if (_pushRegistered) return;
    _pushRegistered = true;

    try {
        if (Capacitor.isNativePlatform()) {
            // ── Android/iOS via Capacitor ──────────────────────────────────────
            let permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }
            if (permStatus.receive !== 'granted') {
                console.log('[HYS Push] Permiso denegado en móvil.');
                _pushRegistered = false;
                return;
            }

            await PushNotifications.removeAllListeners();

            // Token registration
            await PushNotifications.addListener('registration', async (token) => {
                console.log('[HYS Push] Token nativo:', token.value);
                try {
                    await setDoc(doc(db, 'users', uid, 'fcmTokens', token.value), {
                        token: token.value,
                        platform: 'android',
                        updatedAt: Date.now()
                    });
                } catch (e) {
                    console.error('[HYS Push] Error guardando token:', e);
                }
            });

            await PushNotifications.addListener('registrationError', (error) => {
                console.error('[HYS Push] Error de registro:', error.error);
                _pushRegistered = false;
            });

            // Foreground push received → show local notification
            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('[HYS Push] Notificación recibida (foreground):', notification);
                // Show it as a local notification since FCM doesn't auto-show in foreground on Android
                sendNativeLocalNotification({
                    title: notification.title || 'Asistente HYS',
                    body: notification.body || '',
                    tag: notification.data?.tag || 'hys-push',
                    url: notification.data?.url || '/'
                });
            });

            // Notification tap → navigate
            await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                const url = action.notification.data?.url;
                if (url && typeof window !== 'undefined') {
                    window.location.hash = url;
                }
            });

            await PushNotifications.register();

        } else {
            // ── Web / PWA ──────────────────────────────────────────────────────
            const msg = await getMessagingInstance();
            if (!msg) {
                console.log('[HYS Push] Firebase Messaging no soportado.');
                return;
            }

            const permission = await requestNotificationPermission();
            if (permission !== 'granted') {
                console.log('[HYS Push] Permiso denegado en web.');
                _pushRegistered = false;
                return;
            }

            const token = await getToken(msg, { vapidKey: VAPID_KEY });
            if (token) {
                console.log('[HYS Push] FCM Token web obtenido.');
                await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
                    token,
                    platform: 'web',
                    updatedAt: Date.now()
                });
            }

            // Foreground messages
            onMessage(msg, (payload) => {
                console.log('[HYS Push] Notificación foreground:', payload);
                sendNotification({
                    title: payload.notification?.title || 'Notificación',
                    body: payload.notification?.body || '',
                    tag: payload.data?.tag,
                    url: payload.data?.url
                });
            });
        }
    } catch (e) {
        console.error('[HYS Push] Error al registrar push:', e);
        _pushRegistered = false;
    }
}

// ─── Local notification helpers ──────────────────────────────────────────────

export interface NotificationPayload {
    title: string;
    body: string;
    tag?: string;
    url?: string;
    icon?: string;
    badge?: string;
    urgency?: 'expired' | 'warning' | 'info';
}

function sendNativeLocalNotification(payload: { title: string; body: string; tag: string; url: string }) {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(payload.title, {
                    body: payload.body,
                    icon: APP_ICON,
                    badge: APP_BADGE,
                    tag: payload.tag,
                    data: { url: payload.url },
                    requireInteraction: false,
                });
            });
        } else {
            new Notification(payload.title, {
                body: payload.body,
                icon: APP_ICON,
            });
        }
    } catch (e) {
        console.warn('[HYS Push] Error mostrando notificación local:', e);
    }
}

/**
 * Dispara una notificación nativa del sistema.
 * Usa el Service Worker si está disponible (requerido en algunos navegadores).
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
        // En nativo las notificaciones llegan via FCM — aquí solo es foreground
        sendNativeLocalNotification({
            title: payload.title,
            body: payload.body,
            tag: payload.tag ?? 'hys-notif',
            url: payload.url ?? '/'
        });
        return true;
    }

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
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(payload.title, options);
            return true;
        }
        new Notification(payload.title, options);
        return true;
    } catch (e) {
        console.warn('[HYS Notifs] Error al enviar notificación:', e);
        return false;
    }
}

// ─── Claves de localStorage para controlar envíos ────────────────────────────

const SENT_TODAY_KEY = 'hys_notifs_sent_date';
const SENT_IDS_KEY = 'hys_notifs_sent_ids';

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
}

export function getSentTodayIds(): Set<string> {
    const today = getTodayKey();
    const savedDate = localStorage.getItem(SENT_TODAY_KEY);
    if (savedDate !== today) {
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

export function markAsSentToday(id: string): void {
    const today = getTodayKey();
    localStorage.setItem(SENT_TODAY_KEY, today);
    const sent = getSentTodayIds();
    sent.add(id);
    localStorage.setItem(SENT_IDS_KEY, JSON.stringify([...sent]));
}

// ─── Tipos de categoría → URL de destino ─────────────────────────────────────

const TYPE_URLS: Record<string, string> = {
    ppe: '/ppe-tracker',
    extinguisher: '/extintores',
    contractor: '/contractors',
    worker: '/contractors',
    checklist: '/checklists',
};

const TYPE_EMOJI: Record<string, string> = {
    ppe: '🦺',
    extinguisher: '🧯',
    contractor: '🏢',
    worker: '👷',
    checklist: '📋',
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
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return 0;

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
            await new Promise(r => setTimeout(r, 400));
        }
    }

    return sent;
}

/** Envía una notificación de prueba */
export async function sendTestNotification(): Promise<boolean> {
    return sendNotification({
        title: `🔔 Notificaciones activas — ${APP_NAME}`,
        body: 'Las alertas de vencimiento te llegarán automáticamente.',
        tag: 'hys-test',
        url: '/settings',
        urgency: 'info',
    });
}

// ─── Scheduling por fecha/hora (calendario) ──────────────────────────────────

const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function cancelReminder(id: string): void {
    if (activeTimers.has(id)) {
        clearTimeout(activeTimers.get(id));
        activeTimers.delete(id);
    }
}

export function scheduleReminder(id: string, date: string, time: string, title: string): void {
    cancelReminder(id);
    if (!date || !time) return;

    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const targetDate = new Date(year, month - 1, day, hour, minute);
    const delay = targetDate.getTime() - Date.now();

    const MAX_TIMEOUT = 2147483647;

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

export function initializeSchedules(events: any[]): void {
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
