import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ArrowsClockwise, X } from '@phosphor-icons/react';

export default function PWAReloadPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            // Optional: Check for updates periodically
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    if (!needRefresh) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '5rem',
            right: '1.5rem',
            zIndex: 99999,
            background: 'var(--glass-bg-header, rgba(15, 23, 42, 0.95))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border, rgba(56, 189, 248, 0.3))',
            borderRadius: '16px',
            padding: '1rem',
            width: 'calc(100% - 3rem)',
            maxWidth: '350px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(56, 189, 248, 0.2)',
            animation: 'slideUpBounce 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ 
                        background: 'rgba(56, 189, 248, 0.15)', 
                        padding: '0.5rem', 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8'
                    }}>
                        <ArrowsClockwise size={24} weight="bold" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem', fontWeight: 800 }}>
                            Nueva actualización
                        </h4>
                        <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                            Hay una nueva versión disponible. Actualizá para acceder a las últimas mejoras.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setNeedRefresh(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                    }}
                    title="Cerrar"
                >
                    <X size={18} weight="bold" />
                </button>
            </div>
            
            <button
                onClick={() => updateServiceWorker(true)}
                style={{
                    background: '#38bdf8',
                    color: '#0f172a',
                    border: 'none',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    width: '100%',
                    boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
                    transition: 'transform 0.2s ease, filter 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                Actualizar ahora
            </button>
        </div>
    );
}
