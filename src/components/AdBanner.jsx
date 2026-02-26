import React, { useState, useEffect } from 'react';
import { ExternalLink, ShieldCheck, Tag } from 'lucide-react';

const MOCK_ADS = [
    {
        title: "Pack de Protectores 3M",
        desc: "Equipamiento profesional con 20% de descuento para matriculados.",
        link: "https://www.3m.com.ar",
        tag: "Patrocinado",
        icon: <ShieldCheck size={20} color="#2563EB" />
    },
    {
        title: "Curso: Res. 886/15",
        desc: "Capacitación online en Ergonomía. Inicia este lunes. ¡Inscribite!",
        link: "https://www.srt.gob.ar",
        tag: "Formación",
        icon: <Tag size={20} color="#10b981" />
    },
    {
        title: "Software Gestión H&S",
        desc: "Digitalizá tus planillas y reportes con nuestra suite premium.",
        link: "#",
        tag: "Software",
        icon: <ShieldCheck size={20} color="#8b5cf6" />
    }
];

export default function AdBanner({ placement = 'general' }) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [currentAd, setCurrentAd] = useState(null);

    useEffect(() => {
        const status = localStorage.getItem('subscriptionStatus');
        setIsSubscribed(status === 'active');

        // Pick a random ad
        const randomAd = MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)];
        setCurrentAd(randomAd);
    }, []);

    if (isSubscribed || !currentAd) return null;

    const isSidebar = placement === 'sidebar';

    return (
        <div
            className="card"
            style={{
                background: isSidebar ? 'rgba(37, 99, 235, 0.03)' : '#ffffff',
                border: isSidebar ? '1px dashed var(--color-border)' : '1px solid var(--color-border)',
                padding: isSidebar ? '0.6rem' : '1.2rem',
                margin: isSidebar ? '0.5rem 0' : '2rem 0',
                display: 'flex',
                flexDirection: isSidebar ? 'column' : 'row',
                alignItems: isSidebar ? 'flex-start' : 'center',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: 'var(--color-background)',
                padding: '2px 8px',
                fontSize: '0.6rem',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                borderRadius: '0 0 0 8px',
                textTransform: 'uppercase'
            }}>
                Anuncio
            </div>

            <div style={{
                width: isSidebar ? '32px' : '48px',
                height: isSidebar ? '32px' : '48px',
                borderRadius: '8px',
                background: 'var(--color-background)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {currentAd.icon}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <h5 style={{ margin: 0, fontSize: isSidebar ? '0.85rem' : '1rem', fontWeight: 800 }}>{currentAd.title}</h5>
                    <span style={{
                        fontSize: '0.65rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(37, 99, 235, 0.1)',
                        color: 'var(--color-primary)',
                        fontWeight: 700
                    }}>
                        {currentAd.tag}
                    </span>
                </div>
                <p style={{ margin: 0, fontSize: isSidebar ? '0.75rem' : '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                    {currentAd.desc}
                </p>
            </div>

            <a
                href={currentAd.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
                style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    width: isSidebar ? '100%' : 'auto',
                    marginTop: isSidebar ? '0.5rem' : 0,
                    borderRadius: '6px'
                }}
            >
                Ver más <ExternalLink size={12} style={{ marginLeft: '4px' }} />
            </a>
        </div>
    );
}
