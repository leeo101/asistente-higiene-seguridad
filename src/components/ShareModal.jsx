import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

/**
 * ShareModal – redes sociales y portapapeles.
 *
 * Props:
 *   open    {boolean}  – mostrar/ocultar
 *   onClose {function} – callback para cerrar
 *   title   {string}   – título del documento (Ej: "Checklist – Edificio Central")
 *   text    {string}   – texto a compartir (resumen del reporte)
 */
export default function ShareModal({ open, onClose, title = '', text = '' }) {
    const [copied, setCopied] = useState(false);
    if (!open) return null;

    const encoded = encodeURIComponent(text);
    const subject = encodeURIComponent(title);
    const url = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');

    const options = [
        {
            label: 'WhatsApp',
            icon: '📱',
            color: '#25D366',
            bg: '#dcfce7',
            url: `https://wa.me/?text=${encoded}`,
        },
        {
            label: 'LinkedIn',
            icon: '🔗',
            color: '#0077b5',
            bg: '#e0f2fe',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        },
        {
            label: 'Facebook',
            icon: '👥',
            color: '#1877f2',
            bg: '#e7f3ff',
            url: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        },
        {
            label: 'Telegram',
            icon: '✈️',
            color: '#229ED9',
            bg: '#e0f2fe',
            url: `https://t.me/share/url?url=${url}&text=${encoded}`,
        },
        {
            label: 'Twitter / X',
            icon: '𝕏',
            color: '#000',
            bg: '#f1f5f9',
            url: `https://twitter.com/intent/tweet?text=${encoded}`,
        },
        {
            label: 'Email',
            icon: '📧',
            color: '#6366f1',
            bg: '#eef2ff',
            url: `mailto:?subject=${subject}&body=${encoded}`,
        },
    ];

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch { /* fallback silencioso */ }
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff', borderRadius: '24px', padding: '2rem',
                    maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: '#f1f5f9', border: 'none', borderRadius: '50%',
                        width: '32px', height: '32px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <X size={16} />
                </button>

                <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem', fontWeight: 900 }}>
                    Compartir
                </h2>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.8rem', color: '#94a3b8', wordBreak: 'break-word' }}>
                    {title}
                </p>

                {/* Social buttons grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
                    {options.map(opt => (
                        <a
                            key={opt.label}
                            href={opt.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.7rem',
                                padding: '0.9rem 1rem', background: opt.bg,
                                borderRadius: '14px', border: `1.5px solid ${opt.color}30`,
                                textDecoration: 'none', color: opt.color,
                                fontWeight: 800, fontSize: '0.85rem',
                                transition: 'transform 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                            {opt.label}
                        </a>
                    ))}
                </div>

                {/* Clipboard button */}
                <button
                    onClick={handleCopy}
                    style={{
                        width: '100%', padding: '0.9rem',
                        background: copied ? '#dcfce7' : '#f8fafc',
                        border: `1.5px solid ${copied ? '#86efac' : '#e2e8f0'}`,
                        borderRadius: '14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.6rem', fontWeight: 800, fontSize: '0.85rem',
                        color: copied ? '#16a34a' : '#475569', transition: 'all 0.2s'
                    }}
                >
                    {copied
                        ? <><Check size={16} /> ¡Copiado al portapapeles!</>
                        : <><Copy size={16} /> Copiar texto del reporte</>
                    }
                </button>
            </div>
        </div>
    );
}
