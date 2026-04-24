
import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

/**
 * InstallBanner – Muestra un banner para instalar la PWA en el celular.
 * Detecta el evento `beforeinstallprompt` del navegador.
 */
export default function InstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIosPrompt, setIsIosPrompt] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // No mostrar si ya fue descartado antes o si ya está instalado
        if (localStorage.getItem('pwa_banner_dismissed') === 'true') return;
        
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) return;

        // Detect iOS
        const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase());
        const isSafari = /safari/.test(navigator.userAgent.toLowerCase()) && !/chrome|crios|fxios/.test(navigator.userAgent.toLowerCase());
        
        if (isIos && isSafari) {
            setIsIosPrompt(true);
            setVisible(true);
            return;
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (isIosPrompt) {
            // En iOS no se puede abrir el prompt automáticamente, solo indicamos qué hacer.
            return;
        }
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
            bottom: '1.2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'calc(100% - 2.4rem)',
            maxWidth: '480px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            borderRadius: '18px',
            padding: '1rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 8px 32px rgba(37,99,235,0.45)',
            animation: 'slideUp 0.4s ease',
        }}>
            <style>{`
            @keyframes slideUp {
                from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `}</style>
            <div style={{
                width: '44px', height: '44px', flexShrink: 0,
                background: 'rgba(255,255,255,0.15)', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Smartphone size={22} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.15rem' }}>
                    Instalá Asistente HYS
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>
                    {isIosPrompt ? (
                        <span>Tocá <strong style={{color:'white'}}>Compartir</strong> y luego <strong style={{color:'white'}}>"Agregar a inicio"</strong></span>
                    ) : (
                        'Accedé sin internet y más rápido desde tu celular'
                    )}
                </div>
            </div>
            {!isIosPrompt && (
                <button
                    onClick={handleInstall}
                    style={{
                        background: 'var(--color-surface)', color: '#2563eb', border: 'none',
                        borderRadius: '10px', padding: '0.5rem 1rem',
                        fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                        flexShrink: 0, whiteSpace: 'nowrap'
                    }}
                >
                    Instalar
                </button>
            )}
            <button
                onClick={handleDismiss}
                style={{
                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer', padding: '0.3rem', flexShrink: 0,
                    display: 'flex', alignItems: 'center'
                }}
            >
                <X size={18} />
            </button>
        </div>
    );
}
