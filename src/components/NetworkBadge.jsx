import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function NetworkBadge() {
    const isOnline = useNetworkStatus();
    const [showBadge, setShowBadge] = useState(false);
    const [statusText, setStatusText] = useState('');

    useEffect(() => {
        if (!isOnline) {
            setShowBadge(true);
            setStatusText('Sin conexión - Guardado local activo');
        } else {
            if (showBadge) {
                // If it just came back online, show the online badge briefly
                setStatusText('Conexión restaurada');
                const timer = setTimeout(() => setShowBadge(false), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [isOnline]);

    if (!showBadge) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '80px', // Above bottom nav
            left: '50%',
            transform: 'translateX(-50%)',
            background: isOnline ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            padding: '0.6rem 1.2rem',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 9999,
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
            animation: 'slideUp 0.3s ease-out'
        }}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            {statusText}
        </div>
    );
}
