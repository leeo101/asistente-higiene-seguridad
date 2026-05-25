import React, { useState, useEffect } from 'react';
import { Smartphone, X, Share } from 'lucide-react';

/**
 * InstallBanner – Muestra un banner para instalar la PWA en el celular.
 * Detecta el evento `beforeinstallprompt` del navegador.
 */
export default function InstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIosPrompt, setIsIosPrompt] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('pwa_banner_dismissed') === 'true') return;
        
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return;

        const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase());
        const isSafari = /safari/.test(navigator.userAgent.toLowerCase()) && !/chrome|crios|fxios/.test(navigator.userAgent.toLowerCase());
        
        if (isIos && isSafari) {
            setIsIosPrompt(true);
            setVisible(true);
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (isIosPrompt) return;
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setVisible(false);
            localStorage.setItem('pwa_banner_dismissed', 'true');
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setVisible(false);
        localStorage.setItem('pwa_banner_dismissed', 'true');
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            width: 'calc(100% - 2.4rem)',
            maxWidth: '480px',
            background: 'rgba(30, 58, 138, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '24px',
            padding: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.2rem',
            boxShadow: '0 12px 40px rgba(37,99,235,0.4)',
            border: '1px solid rgba(255,255,255,0.15)',
            animation: 'slideUpBounce 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <style>{`
            @keyframes slideUpBounce {
                0%   { opacity: 0; transform: translateX(-50%) translateY(40px); }
                70%  { transform: translateX(-50%) translateY(-5px); }
                100% { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            .install-btn:hover {
                transform: scale(1.05);
            }
        `}</style>
            <div style={{
                width: '48px', height: '48px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))', 
                borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <Smartphone size={24} color="#60a5fa" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                    Instalá Asistente HYS
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {isIosPrompt ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            Tocá <Share size={14} color="#fff" /> y elegí <strong style={{color:'white'}}>"Agregar a inicio"</strong>
                        </div>
                    ) : (
                        'Acceso sin internet, más rápido y seguro.'
                    )}
                </div>
            </div>
            {!isIosPrompt && (
                <button
                    className="install-btn"
                    onClick={handleInstall}
                    style={{
                        background: '#3b82f6', color: '#ffffff', border: 'none',
                        borderRadius: '12px', padding: '0.6rem 1.2rem',
                        fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                        flexShrink: 0, whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.5)',
                        transition: 'transform 0.2s ease'
                    }}
                >
                    Instalar
                </button>
            )}
            <button
                onClick={handleDismiss}
                style={{
                    background: 'transparent', border: 'none', color: '#94a3b8',
                    cursor: 'pointer', padding: '0.4rem', flexShrink: 0,
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.2s ease',
                    borderRadius: '50%'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
                <X size={20} />
            </button>
        </div>
    );
}
