import React, { useState } from 'react';
import { Bell, X } from '@phosphor-icons/react';
import { useExpiryNotifications } from '../hooks/useExpiryNotifications';
import {
    requestNotificationPermission,
    getPermissionStatus,
    sendTestNotification,
} from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function HeaderNotifications() {
    const { currentUser } = useAuth();
    const { notifications, dismiss, dismissAll } = useExpiryNotifications();
    const [showAlerts, setShowAlerts] = useState(false);
    const [notifPermission, setNotifPermission] = useState(() => getPermissionStatus());

    if (!currentUser) return null;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setShowAlerts(v => !v)}
                style={{
                    padding: 0, position: 'relative',
                    background: notifications.length > 0 ? 'rgba(255, 0, 0, 0.25)' : 'rgba(15, 23, 42, 0.05)',
                    border: notifications.length > 0 ? '1px solid rgba(255, 0, 0, 0.8)' : '1px solid rgba(15, 23, 42, 0.1)',
                    width: '36px', height: '36px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: notifications.length > 0 ? '#ff4444' : '#64748b',
                    transition: 'all 0.3s ease',
                    boxShadow: notifications.length > 0 ? '0 0 20px rgba(255, 0, 0, 0.7), inset 0 0 10px rgba(255, 0, 0, 0.3)' : 'none',
                    animation: notifications.length > 0 ? 'bell-shake 2s infinite cubic-bezier(.36,.07,.19,.97) both' : 'none',
                }}
                title={`${notifications.length} alerta${notifications.length !== 1 ? 's' : ''} de vencimiento`}
            >
                <style>
                    {`
                    @keyframes bell-shake {
                        0%, 100% { transform: rotate(0); }
                        10%, 30%, 50%, 70%, 90% { transform: rotate(-8deg); }
                        20%, 40%, 60%, 80% { transform: rotate(8deg); }
                    }
                    `}
                </style>
                <Bell weight={notifications.length > 0 ? "fill" : "duotone"} size={20} />
                {notifications.length > 0 && (
                    <span style={{
                        position: 'absolute', top: '-5px', right: '-5px',
                        background: '#ef4444', color: '#fff',
                        borderRadius: '50%', width: '18px', height: '18px',
                        fontSize: '0.6rem', fontWeight: 900,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--color-hero-bg, #0f172a)',
                        animation: 'pulse 2s infinite',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
                    }}>
                        {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                )}
            </button>

            {showAlerts && (
                <div style={{
                    position: 'absolute',
                    top: '45px',
                    right: 0,
                    width: '260px',
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '14px',
                    padding: '0.8rem',
                    border: '1px solid rgba(239,68,68,0.3)',
                    animation: 'slideDown 0.2s ease',
                    maxHeight: '300px', overflowY: 'auto',
                    zIndex: 100
                }}>
                    {/* Permiso de notificaciones */}
                    {notifPermission === 'default' && (
                        <div style={{ marginBottom: '0.8rem', padding: '0.7rem 0.8rem', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>🔔 Activar notificaciones del sistema</p>
                            <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>Recibí alertas aunque la app esté cerrada</p>
                            <button
                                onClick={async () => {
                                    const ok = await requestNotificationPermission();
                                    setNotifPermission(getPermissionStatus());
                                    if (ok) sendTestNotification();
                                }}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.8)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800 }}
                            >
                                Activar ahora
                            </button>
                        </div>
                    )}

                    {notifPermission === 'denied' && (
                        <div style={{ marginBottom: '0.8rem', padding: '0.6rem 0.8rem', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#fca5a5', lineHeight: 1.4 }}>🚫 Notificaciones bloqueadas. Habilitá los permisos desde la configuración de tu navegador.</p>
                        </div>
                    )}

                    {notifications.length === 0 && notifPermission === 'granted' ? (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', padding: '0.5rem' }}>
                            ✅ Sin vencimientos próximos
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', padding: '0.3rem', marginBottom: '0.5rem' }}>
                            No hay alertas pendientes
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Alertas de Vencimiento</span>
                                    <button onClick={dismissAll} style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem 0.3rem', fontWeight: 700 }}>Descartar todo</button>
                                </div>
                            </div>
                            {notifications.map((n: any) => (
                                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', borderRadius: '8px', background: n.isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', marginBottom: '0.3rem' }}>
                                    <span style={{ fontSize: '0.75rem', flex: 1, color: n.isExpired ? '#fca5a5' : '#fde68a', fontWeight: 600, lineHeight: 1.3 }}>
                                        {n.type === 'ppe' ? '🦺' : n.type === 'contractor' ? '🏢' : n.type === 'worker' ? '👷' : '🧯'} {n.label}
                                        <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.8 }}>
                                            {n.isExpired ? `Vencido hace ${Math.abs(n.daysLeft)}d` : `Vence en ${n.daysLeft}d`}
                                            {n.responsible ? ` · ${n.responsible}` : ''}
                                        </span>
                                    </span>
                                    <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.1rem', fontSize: '0.7rem', flexShrink: 0 }} title="Descartar">
                                        <X weight="bold" size={14} />
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
