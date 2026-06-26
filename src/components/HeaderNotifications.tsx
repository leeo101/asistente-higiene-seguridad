import React, { useState } from 'react';
import { Bell, X } from '@phosphor-icons/react';
import { useExpiryNotifications } from '../hooks/useExpiryNotifications';
import {
  requestNotificationPermission,
  getPermissionStatus,
  sendTestNotification } from
'../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function HeaderNotifications() {
  const { currentUser } = useAuth();
  const { notifications, dismiss, dismissAll } = useExpiryNotifications();
  const [showAlerts, setShowAlerts] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() => getPermissionStatus());

  if (!currentUser) return null;

  return (
    <div className="relative">
            <button
        onClick={() => setShowAlerts((v) => !v)}
        style={{

          background: notifications.length > 0 ? 'rgba(255, 0, 0, 0.25)' : 'rgba(15, 23, 42, 0.05)',
          border: notifications.length > 0 ? '1px solid rgba(255, 0, 0, 0.8)' : '1px solid rgba(15, 23, 42, 0.1)',


          color: notifications.length > 0 ? '#ff4444' : '#64748b',

          boxShadow: notifications.length > 0 ? '0 0 20px rgba(255, 0, 0, 0.7), inset 0 0 10px rgba(255, 0, 0, 0.3)' : 'none',
          animation: notifications.length > 0 ? 'bell-shake 2s infinite cubic-bezier(.36,.07,.19,.97) both' : 'none'
        }}
        title={`${notifications.length} alerta${notifications.length !== 1 ? 's' : ''} de vencimiento`} className="p-[0] relative flex-shrink-[0] w-[48px] h-[48px] rounded-[14px] flex items-center justify-center cursor-pointer transition-[all_0.3s_ease]">
        
                <style>
                    {`
                    @keyframes bell-shake {
                        0%, 100% { transform: rotate(0); }
                        10%, 30%, 50%, 70%, 90% { transform: rotate(-8deg); }
                        20%, 40%, 60%, 80% { transform: rotate(8deg); }
                    }
                    `}
                </style>
                <Bell weight={notifications.length > 0 ? "fill" : "duotone"} size={30} />
                {notifications.length > 0 &&
        <span className="absolute top-[-5px] right-[-5px] bg-[#ef4444] text-[#fff] rounded-[50%] w-[22px] h-[22px] text-[0.7rem] font-[900] flex items-center justify-center border-[2px_solid_var(--color-hero-bg,_#0f172a)] animation-[pulse_2s_infinite] box-shadow-[0_0_8px_rgba(239,_68,_68,_0.8)]">








          
                        {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
        }
            </button>

            {showAlerts &&
      <div className="absolute top-[45px] right-[0] w-[260px] bg-[rgba(0,0,0,0.85)] backdrop-filter-[blur(10px)] rounded-[14px] p-[0.8rem] border-[1px_solid_rgba(239,68,68,0.3)] animation-[slideDown_0.2s_ease] max-height-[300px] overflow-y-[auto] z-[100]">












        
                    {/* Permiso de notificaciones */}
                    {notifPermission === 'default' &&
        <div className="mb-[0.8rem] p-[0.7rem_0.8rem] rounded-[10px] bg-[rgba(56,_189,_248,_0.15)] border-[1px_solid_rgba(56,_189,_248,_0.3)]">
                            <p className="m-[0_0_0.5rem_0] text-[0.75rem] text-[rgba(255,255,255,0.9)] font-[700]">🔔 Activar notificaciones del sistema</p>
                            <p className="m-[0_0_0.6rem_0] text-[0.7rem] text-[rgba(255,255,255,0.65)] line-height-[1.4]">Recibí alertas aunque la app esté cerrada</p>
                            <button
            onClick={async () => {
              const ok = await requestNotificationPermission();
              setNotifPermission(getPermissionStatus());
              if (ok) sendTestNotification();
            }} className="w-[100%] p-[0.5rem] rounded-[8px] bg-[rgba(56,_189,_248,_0.8)] text-[white] border-none cursor-pointer text-[0.78rem] font-[800]">

            
                                Activar ahora
                            </button>
                        </div>
        }

                    {notifPermission === 'denied' &&
        <div className="mb-[0.8rem] p-[0.6rem_0.8rem] rounded-[10px] bg-[rgba(239,68,68,0.12)] border-[1px_solid_rgba(239,68,68,0.25)]">
                            <p className="m-[0] text-[0.72rem] text-[#fca5a5] line-height-[1.4]">🚫 Notificaciones bloqueadas. Habilitá los permisos desde la configuración de tu navegador.</p>
                        </div>
        }

                    {notifications.length === 0 && notifPermission === 'granted' ?
        <div className="text-center text-[rgba(255,255,255,0.6)] text-[0.8rem] p-[0.5rem]">
                            ✅ Sin vencimientos próximos
                        </div> :
        notifications.length === 0 ?
        <div className="text-center text-[rgba(255,255,255,0.5)] text-[0.75rem] p-[0.3rem] mb-[0.5rem]">
                            No hay alertas pendientes
                        </div> :

        <>
                            <div className="flex flex-col gap-[0.5rem] mb-[0.5rem]">
                                <div className="flex justify-space-between items-center">
                                    <span className="text-[0.7rem] font-[800] text-[rgba(255,255,255,0.7)] uppercase">Alertas de Vencimiento</span>
                                    <button onClick={dismissAll} className="text-[0.65rem] text-[rgba(255,255,255,0.5)] bg-[none] border-none cursor-pointer p-[0.1rem_0.3rem] font-[700]">Descartar todo</button>
                                </div>
                            </div>
                            {notifications.map((n: any) =>
          <div key={n.id} style={{ background: n.isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)' }} className="flex items-center gap-[0.5rem] p-[0.4rem_0.5rem] rounded-[8px] mb-[0.3rem]">
                                    <span style={{ color: n.isExpired ? '#fca5a5' : '#fde68a' }} className="text-[0.75rem] flex-[1] font-[600] line-height-[1.3]">
                                        {n.type === 'ppe' ? '🦺' : n.type === 'contractor' ? '🏢' : n.type === 'worker' ? '👷' : '🧯'} {n.label}
                                        <span className="block text-[0.65rem] opacity-[0.8]">
                                            {n.isExpired ? `Vencido hace ${Math.abs(n.daysLeft)}d` : `Vence en ${n.daysLeft}d`}
                                            {n.responsible ? ` · ${n.responsible}` : ''}
                                        </span>
                                    </span>
                                    <button onClick={() => dismiss(n.id)} title="Descartar" className="bg-[none] border-none text-[rgba(255,255,255,0.4)] cursor-pointer p-[0.1rem] text-[0.7rem] flex-shrink-[0]">
                                        <X weight="bold" size={14} />
                                    </button>
                                </div>
          )}
                        </>
        }
                </div>
      }
        </div>);

}