
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import { X, UserPlus } from 'lucide-react';

/**
 * Sticky bottom CTA for anonymous visitors on mobile.
 * Shows up after 4 seconds, can be dismissed permanently.
 */
export default function StickyCtaBanner() {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Don't show if already dismissed in this session
        if (sessionStorage.getItem('sticky_cta_dismissed')) return;

        const timer = setTimeout(() => setVisible(true), 4000);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        setVisible(false);
        sessionStorage.setItem('sticky_cta_dismissed', '1');
    };

    if (!visible || dismissed) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            zIndex: 8000,
            padding: '0.8rem 1rem',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            boxShadow: '0 -4px 24px rgba(37,99,235,0.4)',
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            animation: 'slideUp 0.4s ease',
            // Only show on mobile (max-width: 640px) via inline trick with className
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>
                    ¡Es 100% gratuito!
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', marginTop: '0.1rem' }}>
                    Calculá, hacé ATS y consultá la IA ahora
                </div>
            </div>
            <button
                onClick={() => navigate('/login', { state: { view: 'register' } })}
                style={{
                    background: 'var(--color-surface)', color: '#2563eb',
                    border: 'none', borderRadius: '12px',
                    padding: '0.65rem 1.1rem',
                    fontWeight: 800, fontSize: '0.85rem',
                    cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    whiteSpace: 'nowrap',
                }}
            >
                <UserPlus size={16} /> Registrarme
            </button>
            <button
                onClick={handleDismiss}
                style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    borderRadius: '50%', width: '32px', height: '32px', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#ffffff', flexShrink: 0,
                }}
            >
                <X size={16} />
            </button>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
