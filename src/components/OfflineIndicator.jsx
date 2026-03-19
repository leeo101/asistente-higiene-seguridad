import React, { useEffect, useState } from 'react';
import { useOffline } from '../hooks/useOffline';
import { WifiOff, Wifi, CloudOff, CheckCircle } from 'lucide-react';

/**
 * Banner que muestra el estado de conexión offline/online
 * Se muestra automáticamente cuando el usuario pierde conexión
 */
export default function OfflineIndicator() {
    const isOffline = useOffline();
    const [wasOffline, setWasOffline] = React.useState(false);
    const [showRestored, setShowRestored] = React.useState(false);

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
                position: 'fixed',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: '90%',
                maxWidth: '500px',
                padding: '1rem 1.2rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                animation: 'slideDown 0.3s ease-out',
                background: isOffline
                    ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                    : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                border: isOffline
                    ? '2px solid #f59e0b'
                    : '2px solid #10b981'
            }}
        >
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

            {isOffline ? (
                <>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <WifiOff size={20} color="#ffffff" strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{
                            margin: 0,
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            color: '#92400e',
                            lineHeight: 1.3
                        }}>
                            📴 Sin conexión
                        </p>
                        <p style={{
                            margin: '0.2rem 0 0 0',
                            fontSize: '0.8rem',
                            color: '#78350f',
                            lineHeight: 1.4
                        }}>
                            Tus cambios se guardarán localmente
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <CheckCircle size={20} color="#ffffff" strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{
                            margin: 0,
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            color: '#065f46',
                            lineHeight: 1.3
                        }}>
                            ✅ Conexión restaurada
                        </p>
                        <p style={{
                            margin: '0.2rem 0 0 0',
                            fontSize: '0.8rem',
                            color: '#047857',
                            lineHeight: 1.4
                        }}>
                            Tus datos se sincronizaron correctamente
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
