import { useState, useEffect, useCallback } from 'react';

export interface ExpiryNotification {
  id: string;
  type: 'ppe' | 'extinguisher';
  label: string;
  responsible?: string;
  daysLeft: number;
  isExpired: boolean;
  itemId: number | string;
}

function getDaysLeft(dateStr: string, lifespanMonths?: number): number | null {
  if (!dateStr) return null;
  const base = new Date(dateStr);
  if (lifespanMonths) {
    base.setMonth(base.getMonth() + Number(lifespanMonths));
  }
  return Math.ceil((base.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function useExpiryNotifications() {
  const [notifications, setNotifications] = useState<ExpiryNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('dismissed_notifications');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  const refresh = useCallback(() => {
    const items: ExpiryNotification[] = [];

    // ─── EPP ────────────────────────────────────────────
    try {
      const ppe = JSON.parse(localStorage.getItem('ppe_items') || '[]');
      ppe.forEach((item: any) => {
        const daysLeft = getDaysLeft(item.purchaseDate, item.lifeMonths ?? 12);
        if (daysLeft !== null && daysLeft <= 30) {
          items.push({
            id: `ppe-${item.id}`,
            type: 'ppe',
            label: item.type,
            responsible: item.responsible,
            daysLeft,
            isExpired: daysLeft < 0,
            itemId: item.id,
          });
        }
      });
    } catch { /* ignore */ }

    // ─── Extintores ──────────────────────────────────────
    try {
      // Sincronizado con la clave real de Extinguishers.tsx
      const extinguishers = JSON.parse(localStorage.getItem('extinguishers_inventory') || '[]');
      extinguishers.forEach((ext: any) => {
        // Vencimiento de Carga (12 meses)
        if (ext.ultimaCarga) {
          const daysLeft = getDaysLeft(ext.ultimaCarga, 12);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `ext-recharge-${ext.id}`,
              type: 'extinguisher',
              label: `Extintor #${ext.chapa} (${ext.ubicacion || 'sin ubicación'}) — Recarga`,
              daysLeft,
              isExpired: daysLeft < 0,
              itemId: ext.id,
            });
          }
        }
        // Vencimiento de Prueba Hidráulica (60 meses)
        if (ext.ultimaPH) {
          const daysLeft = getDaysLeft(ext.ultimaPH, 60);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `ext-pressure-${ext.id}`,
              type: 'extinguisher',
              label: `Extintor #${ext.chapa} (${ext.ubicacion || 'sin ubicación'}) — P. Hidráulica`,
              daysLeft,
              isExpired: daysLeft < 0,
              itemId: ext.id,
            });
          }
        }
      });
    } catch { /* ignore */ }

    setNotifications(items.sort((a, b) => a.daysLeft - b.daysLeft));
  }, []);

  useEffect(() => {
    refresh();
    // Re-check every 5 minutes
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('dismissed_notifications', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    const ids = notifications.map(n => n.id);
    setDismissed(prev => {
      const next = new Set([...prev, ...ids]);
      localStorage.setItem('dismissed_notifications', JSON.stringify([...next]));
      return next;
    });
  }, [notifications]);

  const visible = notifications.filter(n => !dismissed.has(n.id));

  return { notifications: visible, all: notifications, dismiss, dismissAll, refresh };
}
