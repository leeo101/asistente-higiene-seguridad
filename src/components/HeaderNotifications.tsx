import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, BellSlash, ArrowRight, CheckCircle, Warning, Fire } from '@phosphor-icons/react';
import { useExpiryNotifications, ExpiryNotification } from '../hooks/useExpiryNotifications';
import { requestNotificationPermission, getPermissionStatus, sendTestNotification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { useLocation, useNavigate } from 'react-router-dom';

// ─── Configuración visual por tipo ──────────────────────────────────────────
const TYPE_META: Record<string, { emoji: string; label: string; url: string }> = {
  ppe:          { emoji: '🦺', label: 'EPP',           url: '/ppe-tracker' },
  extinguisher: { emoji: '🧯', label: 'Matafuego',     url: '/extintores' },
  contractor:   { emoji: '🏢', label: 'Contratista',   url: '/contractors' },
  worker:       { emoji: '👷', label: 'Trabajador',    url: '/contractors' },
  capa:         { emoji: '🔧', label: 'CAPA',          url: '/capa' },
  training:     { emoji: '🎓', label: 'Capacitación',  url: '/training-management' },
  audit:        { emoji: '🔍', label: 'Auditoría',     url: '/audit' },
  medical:      { emoji: '⚕️', label: 'Aptitud Méd.',  url: '/medical' },
  drill:        { emoji: '🚨', label: 'Simulacro',     url: '/drills' },
  permit:       { emoji: '🚧', label: 'Permiso PT',    url: '/work-permit' },
};

function urgencyColor(n: ExpiryNotification) {
  if (n.isExpired) return { bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.35)', text: '#fca5a5', badge: '#ef4444' };
  if (n.daysLeft <= 3) return { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: '#fdba74', badge: '#f97316' };
  return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: '#fde68a', badge: '#f59e0b' };
}

export default function HeaderNotifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const { notifications, dismiss, dismissAll } = useExpiryNotifications();
  const [showAlerts, setShowAlerts] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>(() =>
    Capacitor.isNativePlatform() ? 'granted' : getPermissionStatus()
  );
  const [filter, setFilter] = useState<'all' | 'expired' | 'soon'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  // Refresh permission status on focus
  const refreshPermission = useCallback(() => {
    if (!Capacitor.isNativePlatform()) setNotifPermission(getPermissionStatus());
  }, []);

  useEffect(() => {
    refreshPermission();
    window.addEventListener('focus', refreshPermission);
    return () => window.removeEventListener('focus', refreshPermission);
  }, [refreshPermission]);

  // Close on outside click
  useEffect(() => {
    if (!showAlerts) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowAlerts(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAlerts]);

  if (!currentUser) return null;

  const expired = notifications.filter(n => n.isExpired);
  const soon = notifications.filter(n => !n.isExpired);
  const filtered = filter === 'expired' ? expired : filter === 'soon' ? soon : notifications;
  const hasAlerts = notifications.length > 0;

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setShowAlerts(v => !v)}
        style={{
          background: hasAlerts
            ? 'rgba(239,68,68,0.18)'
            : isDashboard ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
          border: hasAlerts
            ? '1px solid rgba(239,68,68,0.6)'
            : isDashboard ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.1)',
          boxShadow: hasAlerts ? '0 0 14px rgba(239,68,68,0.4)' : 'none',
          animation: hasAlerts ? 'bell-shake 3s infinite cubic-bezier(.36,.07,.19,.97) both' : 'none',
        }}
        title={hasAlerts
          ? `${notifications.length} alerta${notifications.length !== 1 ? 's' : ''} de vencimiento`
          : 'Notificaciones'}
        className="p-[0] relative flex-shrink-[0] w-[42px] h-[42px] rounded-[12px] flex items-center justify-center cursor-pointer transition-[all_0.3s_ease]"
      >
        <style>{`
          @keyframes bell-shake {
            0%, 85%, 100% { transform: rotate(0deg); }
            88%, 94% { transform: rotate(-10deg); }
            91%, 97% { transform: rotate(10deg); }
          }
        `}</style>
        <Bell weight={hasAlerts ? 'fill' : 'bold'} size={22} color={hasAlerts ? '#f87171' : '#f59e0b'} />
        {hasAlerts && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: expired.length > 0 ? '#ef4444' : '#f59e0b',
            color: '#fff', borderRadius: '50%',
            width: '18px', height: '18px',
            fontSize: '0.6rem', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--color-hero-bg, #0f172a)',
            boxShadow: `0 0 8px ${expired.length > 0 ? 'rgba(239,68,68,0.7)' : 'rgba(245,158,11,0.7)'}`,
          }}>
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────────── */}
      {showAlerts && (
        <div
          style={{
            position: 'absolute',
            top: '54px',
            right: '0',
            width: '320px',
            borderRadius: '18px',
            padding: '1rem',
            background: 'rgba(8,14,30,0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            zIndex: 100,
            maxHeight: '480px',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              🔔 Alertas de vencimiento
            </span>
            {notifications.length > 0 && (
              <button
                onClick={dismissAll}
                style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* Summary chips */}
          {notifications.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {(['all', 'expired', 'soon'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    flex: 1,
                    padding: '0.3rem 0.2rem',
                    borderRadius: '8px',
                    border: filter === f ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    background: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: filter === f ? '#fff' : 'rgba(255,255,255,0.4)',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {f === 'all' ? `Todos (${notifications.length})` : f === 'expired' ? `❌ Vencidos (${expired.length})` : `⚠️ Próximos (${soon.length})`}
                </button>
              ))}
            </div>
          )}

          {/* Permission prompt */}
          {!Capacitor.isNativePlatform() && notifPermission === 'default' && (
            <div style={{
              marginBottom: '0.8rem', padding: '0.85rem',
              borderRadius: '12px',
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.25)',
            }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', fontWeight: 800 }}>
                🔔 Activar alertas del sistema
              </p>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                Recibí notificaciones de vencimientos aunque la app esté cerrada.
              </p>
              <button
                onClick={async () => {
                  const perm = await requestNotificationPermission();
                  setNotifPermission(perm);
                  if (perm === 'granted') sendTestNotification();
                }}
                style={{
                  width: '100%', padding: '0.55rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                  color: '#0f172a', border: 'none',
                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 900,
                }}
              >
                Activar notificaciones →
              </button>
            </div>
          )}

          {!Capacitor.isNativePlatform() && notifPermission === 'denied' && (
            <div style={{
              marginBottom: '0.8rem', padding: '0.7rem',
              borderRadius: '12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#fca5a5', lineHeight: 1.4, display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                <BellSlash size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                Notificaciones bloqueadas. Habilitá los permisos desde la configuración de tu navegador.
              </p>
            </div>
          )}

          {/* Notification list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.2rem 0' }}>
              <p style={{ fontSize: '1.8rem', margin: '0 0 0.3rem' }}>
                {notifications.length === 0 ? '✅' : '🔍'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, margin: 0 }}>
                {notifications.length === 0 ? 'Sin vencimientos próximos' : 'Sin resultados para este filtro'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {filtered.map((n: ExpiryNotification) => {
                const meta = TYPE_META[n.type] ?? { emoji: '🔔', label: n.type, url: '/' };
                const colors = urgencyColor(n);
                return (
                  <div
                    key={n.id}
                    style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      padding: '0.55rem 0.65rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onClick={() => { navigate(meta.url); setShowAlerts(false); }}
                    title={`Ir a ${meta.label}`}
                  >
                    <span style={{ fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>{meta.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: colors.text, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.label}
                      </p>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.2 }}>
                        {n.isExpired
                          ? `❌ Vencido hace ${Math.abs(n.daysLeft)} día${Math.abs(n.daysLeft) !== 1 ? 's' : ''}`
                          : n.daysLeft === 0 ? '⚠️ Vence hoy'
                          : `⚠️ Vence en ${n.daysLeft} día${n.daysLeft !== 1 ? 's' : ''}`}
                        {n.responsible ? ` · ${n.responsible}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                      title="Descartar"
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '0.1rem', flexShrink: 0 }}
                    >
                      <X weight="bold" size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {!Capacitor.isNativePlatform() && notifPermission === 'granted' && (
            <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => { sendTestNotification(); setShowAlerts(false); }}
                style={{
                  flex: 1, padding: '0.4rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                }}
              >
                Enviar prueba 🔔
              </button>
              <button
                onClick={() => { navigate('/settings'); setShowAlerts(false); }}
                style={{
                  flex: 1, padding: '0.4rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                }}
              >
                Configurar ⚙️
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}