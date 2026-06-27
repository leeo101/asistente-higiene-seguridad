import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, ArrowRight } from '@phosphor-icons/react';
import { useExpiryNotifications } from '../hooks/useExpiryNotifications';
import { requestNotificationPermission, getPermissionStatus, sendTestNotification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { useLocation } from 'react-router-dom';

export default function HeaderNotifications() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const { notifications, dismiss, dismissAll } = useExpiryNotifications();
  const [showAlerts, setShowAlerts] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>(() =>
    Capacitor.isNativePlatform() ? 'granted' : getPermissionStatus()
  );

  // Refresh permission status periodically (e.g. after user enables from settings)
  const refreshPermission = useCallback(() => {
    if (!Capacitor.isNativePlatform()) {
      setNotifPermission(getPermissionStatus());
    }
  }, []);

  useEffect(() => {
    // Check on mount and when window regains focus
    refreshPermission();
    window.addEventListener('focus', refreshPermission);
    return () => window.removeEventListener('focus', refreshPermission);
  }, [refreshPermission]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showAlerts) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notif-panel]')) setShowAlerts(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAlerts]);

  if (!currentUser) return null;

  const hasAlerts = notifications.length > 0;

  return (
    <div className="relative" data-notif-panel>
      {/* Bell button */}
      <button
        onClick={() => setShowAlerts((v) => !v)}
        style={{
          background: hasAlerts ? 'rgba(255, 0, 0, 0.2)' : (isDashboard ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)'),
          border: hasAlerts ? '1px solid rgba(255, 0, 0, 0.7)' : (isDashboard ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 23, 42, 0.1)'),
          color: hasAlerts ? '#ff4444' : (isDashboard ? 'rgba(255, 255, 255, 0.7)' : '#64748b'),
          boxShadow: hasAlerts ? '0 0 16px rgba(255, 0, 0, 0.5), inset 0 0 8px rgba(255, 0, 0, 0.2)' : 'none',
          animation: hasAlerts ? 'bell-shake 2s infinite cubic-bezier(.36,.07,.19,.97) both' : 'none'
        }}
        title={hasAlerts ? `${notifications.length} alerta${notifications.length !== 1 ? 's' : ''} de vencimiento` : 'Notificaciones'}
        className="p-[0] relative flex-shrink-[0] w-[48px] h-[48px] rounded-[14px] flex items-center justify-center cursor-pointer transition-[all_0.3s_ease]"
      >
        <style>{`
          @keyframes bell-shake {
            0%, 100% { transform: rotate(0deg); }
            10%, 30%, 50%, 70%, 90% { transform: rotate(-7deg); }
            20%, 40%, 60%, 80% { transform: rotate(7deg); }
          }
        `}</style>
        <Bell weight={hasAlerts ? 'fill' : 'duotone'} size={26} />
        {hasAlerts && (
          <span className="absolute top-[-5px] right-[-5px] bg-[#ef4444] text-[#fff] rounded-[50%] w-[20px] h-[20px] text-[0.65rem] font-[900] flex items-center justify-center border-[2px_solid_var(--color-hero-bg,_#0f172a)] box-shadow-[0_0_8px_rgba(239,68,68,0.7)]">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {showAlerts && (
        <div
          className="absolute top-[54px] right-[0] w-[300px] rounded-[16px] p-[1rem] border-[1px_solid_rgba(255,255,255,0.08)] z-[100] overflow-hidden"
          style={{
            background: 'rgba(8, 14, 30, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            maxHeight: '420px',
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-[0.8rem]">
            <span className="text-[0.75rem] font-[900] text-[rgba(255,255,255,0.8)] uppercase tracking-wider">
              🔔 Notificaciones
            </span>
            {notifications.length > 0 && (
              <button
                onClick={dismissAll}
                className="text-[0.65rem] text-[rgba(255,255,255,0.4)] bg-transparent border-none cursor-pointer font-[700] hover:text-[rgba(255,255,255,0.7)] transition-colors"
              >
                Descartar todo
              </button>
            )}
          </div>

          {/* Permission prompts (web only) */}
          {!Capacitor.isNativePlatform() && notifPermission === 'default' && (
            <div className="mb-[0.8rem] p-[0.8rem] rounded-[12px] bg-[rgba(56,189,248,0.12)] border-[1px_solid_rgba(56,189,248,0.25)]">
              <p className="m-[0_0_0.3rem_0] text-[0.78rem] text-[rgba(255,255,255,0.9)] font-[800]">
                🔔 Activar alertas del sistema
              </p>
              <p className="m-[0_0_0.6rem_0] text-[0.7rem] text-[rgba(255,255,255,0.6)] leading-[1.4]">
                Recibí notificaciones de vencimientos aunque la app esté cerrada.
              </p>
              <button
                onClick={async () => {
                  const perm = await requestNotificationPermission();
                  setNotifPermission(perm);
                  if (perm === 'granted') sendTestNotification();
                }}
                className="w-full p-[0.5rem] rounded-[10px] bg-[#38bdf8] text-[#0f172a] border-none cursor-pointer text-[0.78rem] font-[900] hover:bg-[#7dd3fc] transition-colors"
              >
                Activar ahora →
              </button>
            </div>
          )}

          {!Capacitor.isNativePlatform() && notifPermission === 'denied' && (
            <div className="mb-[0.8rem] p-[0.7rem] rounded-[12px] bg-[rgba(239,68,68,0.1)] border-[1px_solid_rgba(239,68,68,0.2)]">
              <p className="m-[0] text-[0.72rem] text-[#fca5a5] leading-[1.4]">
                🚫 Notificaciones bloqueadas. Habilitá los permisos desde la configuración de tu navegador.
              </p>
            </div>
          )}

          {/* Alert list */}
          {notifications.length === 0 ? (
            <div className="text-center py-[1rem]">
              {notifPermission === 'granted' || Capacitor.isNativePlatform() ? (
                <div>
                  <p className="text-[1.5rem] mb-[0.3rem]">✅</p>
                  <p className="text-[0.78rem] text-[rgba(255,255,255,0.55)] font-[600]">Sin vencimientos próximos</p>
                </div>
              ) : (
                <p className="text-[0.75rem] text-[rgba(255,255,255,0.4)]">No hay alertas pendientes</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-[0.4rem]">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  style={{
                    background: n.isExpired ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)',
                    border: n.isExpired ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(245,158,11,0.2)',
                  }}
                  className="flex items-center gap-[0.5rem] p-[0.5rem_0.6rem] rounded-[10px]"
                >
                  <span style={{ color: n.isExpired ? '#fca5a5' : '#fde68a' }} className="text-[0.75rem] flex-[1] font-[600] leading-[1.3]">
                    {n.type === 'ppe' ? '🦺' : n.type === 'contractor' ? '🏢' : n.type === 'worker' ? '👷' : n.type === 'checklist' ? '📋' : n.type === 'extinguisher' ? '🧯' : n.type === 'audit' ? '🔍' : n.type === 'medical' ? '⚕️' : n.type === 'drill' ? '🚨' : n.type === 'permit' ? '🚧' : n.type === 'capa' ? '🔧' : n.type === 'training' ? '🎓' : '🔔'}{' '}
                    {n.label}
                    <span className="block text-[0.65rem] opacity-[0.75] mt-[0.1rem]">
                      {n.isExpired
                        ? `Vencido hace ${Math.abs(n.daysLeft)} día${Math.abs(n.daysLeft) !== 1 ? 's' : ''}`
                        : `Vence en ${n.daysLeft} día${n.daysLeft !== 1 ? 's' : ''}`}
                      {n.responsible ? ` · ${n.responsible}` : ''}
                    </span>
                  </span>
                  <button
                    onClick={() => dismiss(n.id)}
                    title="Descartar"
                    className="bg-transparent border-none text-[rgba(255,255,255,0.35)] cursor-pointer p-[0.15rem] flex-shrink-[0] hover:text-[rgba(255,255,255,0.7)] transition-colors"
                  >
                    <X weight="bold" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer test button (only web with permission) */}
          {!Capacitor.isNativePlatform() && notifPermission === 'granted' && (
            <button
              onClick={() => { sendTestNotification(); setShowAlerts(false); }}
              className="mt-[0.8rem] w-full p-[0.4rem] rounded-[8px] bg-[rgba(255,255,255,0.05)] border-[1px_solid_rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.4)] cursor-pointer text-[0.65rem] font-[700] hover:bg-[rgba(255,255,255,0.08)] transition-colors flex items-center justify-center gap-[0.3rem]"
            >
              Enviar notificación de prueba
            </button>
          )}
        </div>
      )}
    </div>
  );
}