import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from '@phosphor-icons/react';

/**
 * Sticky bottom CTA for anonymous visitors.
 * Shows up after scrolling 30% of the page, can be dismissed.
 */
export default function StickyCtaBanner() {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        if (sessionStorage.getItem('sticky_cta_dismissed')) return;

        const handleScroll = () => {
            const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            if (scrolled > 0.18 && !visible) {
                setVisible(true);
                setTimeout(() => setAnimateIn(true), 50);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [visible]);

    const handleDismiss = () => {
        setAnimateIn(false);
        setTimeout(() => {
            setDismissed(true);
            setVisible(false);
        }, 300);
        sessionStorage.setItem('sticky_cta_dismissed', '1');
    };

    if (!visible || dismissed) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            zIndex: 8000,
            padding: '0.9rem 1rem',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            background: 'rgba(2, 6, 23, 0.92)',
            borderTop: '1px solid rgba(59,130,246,0.25)',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            transform: animateIn ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            {/* Glow line at top */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), rgba(168,85,247,0.6), transparent)',
                pointerEvents: 'none',
            }} />

            {/* Live indicator */}
            <div
                style={{
                    width: '8px', height: '8px',
                    borderRadius: '50%',
                    background: '#34d399',
                    flexShrink: 0,
                    boxShadow: '0 0 8px #34d399',
                    animation: 'pulse-soft 2s ease infinite',
                }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>
                    Gratis, sin tarjeta de crédito
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: '0.1rem' }}>
                    ATS, Cálculos y Cámara IA disponibles ahora
                </div>
            </div>

            <button
                onClick={() => navigate('/login', { state: { view: 'register' } })}
                style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.65rem 1.1rem',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                }}
                onMouseOver={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(59,130,246,0.5)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(59,130,246,0.3)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
            >
                Empezar gratis <ArrowRight size={18} weight="bold" />
            </button>

            <button
                onClick={handleDismiss}
                aria-label="Cerrar"
                style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    width: '32px', height: '32px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.5)',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'white';
                }}
                onMouseOut={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                }}
            >
                <X size={14} />
            </button>
        </div>
    );
}
