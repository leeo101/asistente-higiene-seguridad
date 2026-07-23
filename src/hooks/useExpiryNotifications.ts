import { useState, useEffect, useCallback } from 'react';

export interface ExpiryNotification {
  id: string;
  type: 'ppe' | 'extinguisher' | 'contractor' | 'worker' | 'capa' | 'training' | 'audit' | 'medical' | 'drill' | 'permit';
  label: string;
  responsible?: string;
  daysLeft: number;
  isExpired: boolean;
  itemId: number | string;
}

function getDaysLeft(dateStr: string, lifespanMonths?: number): number | null {
  if (!dateStr) return null;
  const base = new Date(dateStr);
  if (isNaN(base.getTime())) return null;
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

    // Helper para convertir fecha base + meses
    const addMonths = (dateStr: string, months: number): string => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      d.setMonth(d.getMonth() + Number(months));
      return d.toISOString().split('T')[0];
    };

    // ─── EPP ────────────────────────────────────────────
    try {
      const ppe = JSON.parse(localStorage.getItem('ppe_items') || '[]');
      ppe.forEach((item: any) => {
        const expDate = item.vencimiento || item.expirationDate || (item.purchaseDate ? addMonths(item.purchaseDate, item.lifeMonths ?? 12) : null);
        if (expDate) {
          const daysLeft = getDaysLeft(expDate);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `ppe-${item.id}`,
              type: 'ppe',
              label: `EPP: ${item.type || item.tipo || 'Elemento'} (${item.responsible || item.trabajador || 'Personal'})`,
              responsible: item.responsible || item.trabajador,
              daysLeft,
              isExpired: daysLeft <= 0,
              itemId: item.id,
            });
          }
        }
      });
    } catch { /* ignore */ }

    // ─── Extintores ──────────────────────────────────────
    try {
      const extinguishers = JSON.parse(localStorage.getItem('extinguishers_inventory') || '[]');
      extinguishers.forEach((ext: any) => {
        // Recarga
        const recargaExp = ext.vencimientoRecarga || ext.vencimiento || (ext.ultimaCarga ? addMonths(ext.ultimaCarga, 12) : null);
        if (recargaExp) {
          const daysLeft = getDaysLeft(recargaExp);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `ext-recharge-${ext.id}`,
              type: 'extinguisher',
              label: `Extintor N° ${ext.numero || ext.chapa || ext.id} (${ext.ubicacion || ext.sector || 'Sin ubicación'}) — Recarga`,
              daysLeft,
              isExpired: daysLeft <= 0,
              itemId: ext.id,
            });
          }
        }
        // Prueba Hidráulica
        const phExp = ext.vencimientoPH || (ext.ultimaPH ? addMonths(ext.ultimaPH, 60) : null);
        if (phExp) {
          const daysLeft = getDaysLeft(phExp);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `ext-pressure-${ext.id}`,
              type: 'extinguisher',
              label: `Extintor N° ${ext.numero || ext.chapa || ext.id} (${ext.ubicacion || ext.sector || 'Sin ubicación'}) — P. Hidráulica`,
              daysLeft,
              isExpired: daysLeft <= 0,
              itemId: ext.id,
            });
          }
        }
      });
    } catch { /* ignore */ }

    // ─── Contratistas ────────────────────────────────────
    try {
      const contractors = JSON.parse(localStorage.getItem('contractors_data') || '[]');
      contractors.forEach((c: any) => {
        const exp = c.documentExpiresAt || c.vencimiento;
        if (exp) {
          const daysLeft = getDaysLeft(exp);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `ctr-${c.id}`,
              type: 'contractor',
              label: `Contratista: ${c.name || c.empresa} — Doc. Principal`,
              daysLeft,
              isExpired: daysLeft <= 0,
              itemId: c.id,
            });
          }
        }
      });
    } catch { /* ignore */ }

    // ─── Trabajadores Contratistas ───────────────────────
    try {
      const workers = JSON.parse(localStorage.getItem('workers_data') || '[]');
      workers.forEach((w: any) => {
        const artExp = w.artExpiresAt || w.vencimientoART;
        if (artExp) {
          const daysLeft = getDaysLeft(artExp);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `wrk-art-${w.id}`,
              type: 'worker',
              label: `Trabajador: ${w.name || w.nombre} — Vto. ART`,
              daysLeft,
              isExpired: daysLeft <= 0,
              itemId: w.id,
            });
          }
        }
        const lifeExp = w.lifeInsuranceExpiresAt || w.vencimientoSeguro;
        if (lifeExp) {
          const daysLeft = getDaysLeft(lifeExp);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `wrk-ins-${w.id}`,
              type: 'worker',
              label: `Trabajador: ${w.name || w.nombre} — Seguro de Vida`,
              daysLeft,
              isExpired: daysLeft <= 0,
              itemId: w.id,
            });
          }
        }
      });
    } catch { /* ignore */ }

    // ─── CAPA (Acciones Correctivas) ────────────────────────
    try {
      const capas = JSON.parse(localStorage.getItem('ehs_capa_db') || '[]');
      capas.forEach((c: any) => {
        if (c.status !== 'Cerrada') {
          const exp = c.targetDate || c.vencimiento || c.fechaLimite;
          if (exp) {
            const daysLeft = getDaysLeft(exp);
            if (daysLeft !== null && daysLeft <= 30) {
              items.push({
                id: `capa-${c.id}`,
                type: 'capa',
                label: `CAPA: ${c.title || c.titulo || 'Acción Correctiva'}`,
                responsible: c.responsible || c.responsable,
                daysLeft,
                isExpired: daysLeft <= 0,
                itemId: c.id,
              });
            }
          }
        }
      });
    } catch { /* ignore */ }

    // ─── Capacitaciones ──────────────────────────────────────
    try {
      const trainings = JSON.parse(localStorage.getItem('training_history') || '[]');
      trainings.forEach((t: any) => {
        const exp = t.nextTrainingDate || t.vencimiento;
        if (exp) {
          const daysLeft = getDaysLeft(exp);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `trn-${t.id}`,
              type: 'training',
              label: `Capacitación: ${t.topic || t.tema || 'Pendiente'}`,
              daysLeft,
              isExpired: daysLeft <= 0,
              itemId: t.id,
            });
          }
        }
      });
    } catch { /* ignore */ }

    // ─── Auditorías ──────────────────────────────────────────
    try {
      const audits = JSON.parse(localStorage.getItem('ehs_audits_db') || '[]');
      audits.forEach((a: any) => {
        if (a.status === 'planned' || a.status === 'Pendiente') {
          const exp = a.scheduledDate || a.fecha;
          if (exp) {
            const daysLeft = getDaysLeft(exp);
            if (daysLeft !== null && daysLeft <= 30) {
              items.push({
                id: `aud-${a.id}`,
                type: 'audit',
                label: `Auditoría: ${a.title || a.titulo || 'Programada'}`,
                responsible: a.leadAuditor || a.auditor,
                daysLeft,
                isExpired: daysLeft <= 0,
                itemId: a.id,
              });
            }
          }
        }
      });
    } catch { /* ignore */ }

    // ─── Aptitudes Médicas ───────────────────────────────────
    try {
      const medical = JSON.parse(localStorage.getItem('ehs_medical_db') || '[]');
      medical.forEach((m: any) => {
        const exp = m.expirationDate || m.vencimiento;
        if (exp) {
          const daysLeft = getDaysLeft(exp);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `med-${m.id}`,
              type: 'medical',
              label: `Aptitud Médica: ${m.workerName || m.trabajador || 'Trabajador'}`,
              daysLeft,
              isExpired: daysLeft <= 0,
              itemId: m.id,
            });
          }
        }
      });
    } catch { /* ignore */ }

    // ─── Simulacros (Vencimiento Anual) ─────────────────────────
    try {
      const drills = JSON.parse(localStorage.getItem('drills_history') || '[]');
      drills.forEach((d: any) => {
        const exp = d.vencimiento || (d.fecha ? addMonths(d.fecha, 12) : null);
        if (exp) {
          const daysLeft = getDaysLeft(exp);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `drill-${d.id}`,
              type: 'drill',
              label: `Simulacro Anual: ${d.empresa || d.sector || 'Establecimiento'}`,
              daysLeft,
              isExpired: daysLeft <= 0,
              itemId: d.id,
            });
          }
        }
      });
    } catch { /* ignore */ }

    // ─── Permisos de Trabajo ──────────────────────────────
    try {
      const permits = JSON.parse(localStorage.getItem('work_permits_history') || '[]');
      permits.forEach((p: any) => {
        const exp = p.endDate || p.vencimiento || p.fechaFin;
        if (exp) {
          const daysLeft = getDaysLeft(exp);
          if (daysLeft !== null && daysLeft <= 30) {
            items.push({
              id: `permit-${p.id}`,
              type: 'permit',
              label: `Permiso PT-${String(p.id).slice(-4)} ${p.spaceName || p.empresa ? `(${p.spaceName || p.empresa})` : ''}`,
              daysLeft,
              isExpired: daysLeft <= 0,
              itemId: p.id,
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
    // Las notificaciones permanecen activas en la campana hasta solucionar el vencimiento real
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    // Almacenar sólo vista temporal en sesión activa
    const ids = notifications.map(n => n.id);
    setDismissed(new Set(ids));
  }, [notifications]);

  // Las notificaciones de vencimiento real siempre se muestran en el botón de notificaciones hasta ser solucionadas
  return { notifications, all: notifications, dismiss, dismissAll, refresh };
}
