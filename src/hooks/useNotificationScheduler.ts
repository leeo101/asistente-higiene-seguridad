import { useEffect, useRef } from 'react';
import { useExpiryNotifications } from './useExpiryNotifications';
import {
    getPermissionStatus,
    requestNotificationPermission,
    scheduleExpiryNotifications,
} from '../services/notificationService';
import { Capacitor } from '@capacitor/core';

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
 * En nativo (APK) siempre intenta — no bloquea por permiso en el check inicial
 * ya que el permiso nativo es verificado de forma async.
 */
export function useNotificationScheduler() {
    const { all } = useExpiryNotifications();
    const hasRun = useRef(false);

    useEffect(() => {
        if (alreadyCheckedToday() && hasRun.current) return;
        if (!all || all.length === 0) return;

        // On web, check permission synchronously first
        if (!Capacitor.isNativePlatform()) {
            if (getPermissionStatus() !== 'granted') return;
        }

        const timer = setTimeout(async () => {
            try {
                // On native, permission check is async — request if needed
                if (Capacitor.isNativePlatform()) {
                    const perm = await requestNotificationPermission();
                    if (perm !== 'granted') return;
                }

                const sent = await scheduleExpiryNotifications(all);
                hasRun.current = true;
                markCheckedToday();

                if (sent > 0) {
                    console.info(`[HYS Notifs] ${sent} notificación(es) enviadas.`);
                } else {
                    console.info('[HYS Notifs] Sin vencimientos pendientes hoy.');
                }
            } catch (e) {
                console.warn('[HYS Notifs] Error al enviar notificaciones:', e);
            }
        }, 5000); // 5 segundos para que la app cargue completamente

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [all.length]);
}
