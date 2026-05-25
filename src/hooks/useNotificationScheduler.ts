import { useEffect } from 'react';
import { useExpiryNotifications } from './useExpiryNotifications';
import {
    getPermissionStatus,
    scheduleExpiryNotifications,
} from '../services/notificationService';

const LAST_CHECK_KEY = 'hys_notifs_last_check_date';

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
}

function alreadyCheckedToday(): boolean {
    return localStorage.getItem(LAST_CHECK_KEY) === getTodayKey();
}

function markCheckedToday(): void {
    localStorage.setItem(LAST_CHECK_KEY, getTodayKey());
}

/**
 * Hook que dispara notificaciones nativas del sistema una vez al día.
 * Se conecta con useExpiryNotifications y envía alertas para los
 * items que vencen pronto (extintores, EPP, contratistas, trabajadores).
 *
 * Solo se ejecuta si el permiso está concedido y no se revisó hoy.
 */
export function useNotificationScheduler() {
    const { all } = useExpiryNotifications();

    useEffect(() => {
        // Solo actuar si hay permiso y no se revisó hoy
        if (getPermissionStatus() !== 'granted') return;
        if (alreadyCheckedToday()) return;
        if (!all || all.length === 0) return;

        // Pequeña pausa para no disparar notificaciones al instante de cargar
        const timer = setTimeout(async () => {
            try {
                const sent = await scheduleExpiryNotifications(all);
                if (sent > 0) {
                    markCheckedToday();
                    console.info(`[HYS Notifs] ${sent} notificación(es) enviadas`);
                } else {
                    markCheckedToday(); // No había pendientes pero ya revisamos
                }
            } catch (e) {
                console.warn('[HYS Notifs] Error al enviar notificaciones:', e);
            }
        }, 3000); // 3 segundos después de cargar la app

        return () => clearTimeout(timer);
    }, [all]);
}
