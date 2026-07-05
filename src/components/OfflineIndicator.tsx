import React from 'react';
import { useOffline } from '../hooks/useOffline';
import { WifiOff, CheckCircle } from 'lucide-react';
import { CloudArrowUp } from '@phosphor-icons/react';

/**
 * Banner que muestra el estado de conexión offline/online
 * Se muestra automáticamente cuando el usuario pierde conexión
 */
export default function OfflineIndicator() {
  const isOffline = useOffline();
  const [wasOffline, setWasOffline] = React.useState(false);
  const [showRestored, setShowRestored] = React.useState(false);
  const [queueCount, setQueueCount] = React.useState(0);

  // Read queue count from localStorage
  React.useEffect(() => {
    const readQueue = () => {
      try {
        const q = JSON.parse(localStorage.getItem('hys_offline_queue') || '[]');
        setQueueCount(q.length);
      } catch { setQueueCount(0); }
    };
    readQueue();
    window.addEventListener('storage', readQueue);
    return () => window.removeEventListener('storage', readQueue);
  }, []);

  React.useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // Solo mostrar si realmente estuvo offline
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  // No mostrar nada si está online y no viene de estar offline
  if (!isOffline && !showRestored) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{














        background: isOffline ?
        'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' :
        'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        border: isOffline ?
        '2px solid #f59e0b' :
        '2px solid #10b981'
      }} className="fixed top-[16px] left-[50%] transform-[translateX(-50%)] z-[9999] w-[90%] max-w-[500px] p-[1rem_1.2rem] rounded-[12px] flex items-center gap-[0.8rem] box-shadow-[0_8px_32px_rgba(0,0,0,0.15)] animation-[slideDown_0.3s_ease-out]">
      
            <style>
                {`
                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translate(-50%, -20px);
                        }
                        to {
                            opacity: 1;
                            transform: translate(-50%, 0);
                        }
                    }
                    @keyframes slideUp {
                        from {
                            opacity: 1;
                            transform: translate(-50%, 0);
                        }
                        to {
                            opacity: 0;
                            transform: translate(-50%, -20px);
                        }
                    }
                `}
            </style>

            {isOffline ?
      <>
                    <div className="w-[36px] h-[36px] rounded-[50%] bg-[#f59e0b] flex items-center justify-center flex-shrink-[0]">








          
                        <WifiOff size={20} color="#ffffff" strokeWidth={2.5} />
                    </div>
                    <div className="flex-[1]">
                        <p className="m-[0] font-[800] text-[0.9rem] text-[#92400e] line-height-[1.3]">
                            📴 Sin conexión
                        </p>
                        <p className="m-[0.2rem_0_0_0] text-[0.8rem] text-[#78350f] line-height-[1.4]">
                          {queueCount > 0
                            ? `${queueCount} elemento${queueCount !== 1 ? 's' : ''} en cola — se sincronizan al reconectar`
                            : 'Tus cambios se guardarán localmente'
                          }
                        </p>
                    </div>
                </> :

      <>
                    <div className="w-[36px] h-[36px] rounded-[50%] bg-[#10b981] flex items-center justify-center flex-shrink-[0]">








          
                        <CheckCircle size={20} color="#ffffff" strokeWidth={2.5} />
                    </div>
                    <div className="flex-[1]">
                        <p className="m-[0] font-[800] text-[0.9rem] text-[#065f46] line-height-[1.3]">





            
                            ✅ Conexión restaurada
                        </p>
                        <p className="m-[0.2rem_0_0_0] text-[0.8rem] text-[#047857] line-height-[1.4]">




            
                            Tus datos se sincronizaron correctamente
                        </p>
                    </div>
                </>
      }
        </div>);

}