import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function NetworkBadge() {
  const isOnline = useNetworkStatus();
  const [showBadge, setShowBadge] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBadge(true);
      setStatusText('Sin conexión - Guardado local activo');
      setWasOffline(true);
    } else {
      if (wasOffline) {
        // Solo mostrar "Conexión restaurada" si realmente estuvo offline
        setStatusText('✅ Conexión restaurada');
        const timer = setTimeout(() => setShowBadge(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, wasOffline]);

  if (!showBadge) return null;

  return (
    <div style={{




      background: isOnline ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)'













    }} className="fixed bottom-[80px] left-[50%] transform-[translateX(-50%)] text-[#fff] p-[0.6rem_1.2rem] rounded-[50px] flex items-center gap-[0.6rem] text-[0.85rem] font-[700] box-shadow-[0_4px_12px_rgba(0,0,0,0.2)] z-[9999] pointer-events-[none] backdrop-filter-[blur(4px)] animation-[slideUp_0.3s_ease-out]">
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            {statusText}
        </div>);

}