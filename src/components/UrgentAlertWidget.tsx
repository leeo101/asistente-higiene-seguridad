// ─── UrgentAlertWidget ────────────────────────────────────────────────────────
// Muestra la alerta más urgente del usuario en la pantalla de inicio.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warning, CheckCircle, ArrowRight, HardHat, Fire, Stethoscope, Key, ClockCountdown } from '@phosphor-icons/react';

interface Alert {
  id: string;
  label: string;
  detail: string;
  daysLeft: number;
  isExpired: boolean;
  url: string;
  icon: React.ReactElement;
  color: string;
}

function getAlerts(): Alert[] {
  const now = Date.now();
  const alerts: Alert[] = [];

  const safeParse = (key: string) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  };

  // EPP Tracker
  const ppe = safeParse('ppe_tracker_items');
  ppe.forEach((item: any) => {
    if (!item.expiryDate) return;
    const exp = new Date(item.expiryDate).getTime();
    const daysLeft = Math.ceil((exp - now) / 86400000);
    if (daysLeft <= 30) {
      alerts.push({
        id: `ppe-${item.id}`,
        label: item.name || 'EPP sin nombre',
        detail: `EPP — ${item.workerName || 'Sin asignar'}`,
        daysLeft,
        isExpired: daysLeft < 0,
        url: '/ppe-tracker',
        icon: <HardHat weight="duotone" size={22} />,
        color: '#f97316'
      });
    }
  });

  // Extintores
  const ext = safeParse('extinguishers_data');
  ext.forEach((item: any) => {
    if (!item.nextInspection && !item.expiryDate) return;
    const dateStr = item.nextInspection || item.expiryDate;
    const exp = new Date(dateStr).getTime();
    const daysLeft = Math.ceil((exp - now) / 86400000);
    if (daysLeft <= 30) {
      alerts.push({
        id: `ext-${item.id || item.codigo}`,
        label: item.codigo || item.location || 'Extintor',
        detail: `Matafuego — ${item.location || item.sector || ''}`,
        daysLeft,
        isExpired: daysLeft < 0,
        url: '/extintores',
        icon: <Fire weight="duotone" size={22} />,
        color: '#ef4444'
      });
    }
  });

  // Aptitudes Médicas
  const medical = safeParse('ehs_medical_db');
  medical.forEach((item: any) => {
    if (!item.expirationDate) return;
    const exp = new Date(item.expirationDate).getTime();
    const daysLeft = Math.ceil((exp - now) / 86400000);
    if (daysLeft <= 30) {
      alerts.push({
        id: `med-${item.id}`,
        label: item.workerName || 'Trabajador',
        detail: `Aptitud Médica`,
        daysLeft,
        isExpired: daysLeft < 0,
        url: '/medical',
        icon: <Stethoscope weight="duotone" size={22} />,
        color: '#8b5cf6'
      });
    }
  });

  // Permisos de Trabajo
  const permits = safeParse('work_permits_history');
  permits.forEach((item: any) => {
    if (!item.endDate) return;
    const exp = new Date(item.endDate).getTime();
    const daysLeft = Math.ceil((exp - now) / 86400000);
    if (daysLeft >= 0 && daysLeft <= 3) {
      alerts.push({
        id: `perm-${item.id}`,
        label: item.workType || 'Permiso de trabajo',
        detail: `Vence pronto`,
        daysLeft,
        isExpired: false,
        url: '/work-permit',
        icon: <Key weight="duotone" size={22} />,
        color: '#2563eb'
      });
    }
  });

  // Ordenar: expirados primero, luego por días restantes
  return alerts.sort((a, b) => {
    if (a.isExpired && !b.isExpired) return -1;
    if (!a.isExpired && b.isExpired) return 1;
    return a.daysLeft - b.daysLeft;
  });
}

export default function UrgentAlertWidget() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const found = getAlerts();
    setAlerts(found);
    // Animate in
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const top = alerts[0];
  const extraCount = alerts.length - 1;

  if (!top) {
    return (
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '16px',
          padding: '0.85rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          cursor: 'default'
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'rgba(16,185,129,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#10b981', flexShrink: 0
        }}>
          <CheckCircle weight="duotone" size={20} />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)' }}>
            ✅ Todo en orden
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            Sin vencimientos próximos ni alertas urgentes
          </div>
        </div>
      </div>
    );
  }

  const isExpired = top.isExpired;
  const bgColor = isExpired
    ? 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.06))'
    : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.06))';
  const borderColor = isExpired ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)';
  const badgeColor = isExpired ? '#ef4444' : top.daysLeft === 0 ? '#f97316' : '#f59e0b';

  return (
    <div
      onClick={() => navigate(top.url)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '0.85rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
        cursor: 'pointer',
        boxShadow: isExpired ? '0 0 20px rgba(239,68,68,0.12)' : '0 0 20px rgba(245,158,11,0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Pulsing dot for expired */}
      {isExpired && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          width: 8, height: 8, borderRadius: '50%',
          background: '#ef4444',
          animation: 'alert-pulse 1.5s infinite',
          boxShadow: '0 0 0 0 rgba(239,68,68,0.4)'
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: '12px',
        background: `${top.color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: top.color, flexShrink: 0
      }}>
        {top.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text)' }}>
            {top.label}
          </span>
          <span style={{
            fontSize: '0.7rem', fontWeight: 800, color: '#fff',
            background: badgeColor, padding: '1px 7px',
            borderRadius: '20px', flexShrink: 0
          }}>
            {isExpired ? `VENCIDO hace ${Math.abs(top.daysLeft)}d` : top.daysLeft === 0 ? 'HOY' : `${top.daysLeft}d`}
          </span>
          {extraCount > 0 && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700,
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface-hover, rgba(0,0,0,0.05))',
              padding: '1px 7px', borderRadius: '20px'
            }}>
              +{extraCount} más
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
          <ClockCountdown size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
          {top.detail}
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />

      <style>{`
        @keyframes alert-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  );
}
