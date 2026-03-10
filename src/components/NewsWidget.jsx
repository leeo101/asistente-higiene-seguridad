import React, { useState, useEffect } from 'react';
import { Newspaper, ChevronRight, ExternalLink, BellRing } from 'lucide-react';

const NEWS_ITEMS = [
    {
        id: 1,
        title: "Nuevos valores de la cuota fija de ART",
        description: "La Superintendencia de Riesgos del Trabajo actualizó el valor de la suma fija con destino al FFEP.",
        date: "Hace 2 días",
        tag: "SRT",
        link: "https://www.argentina.gob.ar/srt"
    },
    {
        id: 2,
        title: "Recordatorio: Relevamiento Anual",
        description: "Recordá presentar en término el Relevamiento de Agentes de Riesgo (RAR) para evitar intimaciones de tu ART.",
        date: "Hace 1 semana",
        tag: "Normativa",
        link: "https://www.argentina.gob.ar/srt"
    },
    {
        id: 3,
        title: "Actualización Protocolo de Ergonomía",
        description: "Revisá los nuevos lineamientos de la Res. 886/15 sobre medición de levantamiento manual de cargas.",
        date: "Novedad",
        tag: "Técnico",
        link: "https://www.argentina.gob.ar/srt"
    }
];

export default function NewsWidget() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % NEWS_ITEMS.length);
        }, 8000); // Rotates every 8 seconds
        return () => clearInterval(timer);
    }, []);

    const currentNews = NEWS_ITEMS[currentIndex];

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BellRing size={20} color="#f59e0b" /> Novedades Normativas
                </h3>
            </div>

            <div className="card" style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(245,158,11,0.05) 100%)',
                border: '1.5px solid rgba(245,158,11,0.2)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                        background: 'rgba(245,158,11,0.15)',
                        color: '#f59e0b',
                        padding: '0.8rem',
                        borderRadius: '12px',
                        flexShrink: 0
                    }}>
                        <Newspaper size={24} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                            <span style={{
                                background: '#f59e0b',
                                color: '#fff',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.6rem',
                                borderRadius: '20px',
                                textTransform: 'uppercase'
                            }}>
                                {currentNews.tag}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                {currentNews.date}
                            </span>
                        </div>

                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)' }}>
                            {currentNews.title}
                        </h4>

                        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                            {currentNews.description}
                        </p>

                        <a
                            href={currentNews.link}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: 'var(--color-primary)',
                                textDecoration: 'none'
                            }}
                        >
                            Leer más <ExternalLink size={14} />
                        </a>
                    </div>
                </div>

                {/* Progress Indicators */}
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '1.2rem' }}>
                    {NEWS_ITEMS.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            style={{
                                width: idx === currentIndex ? '16px' : '6px',
                                height: '6px',
                                borderRadius: '4px',
                                background: idx === currentIndex ? '#f59e0b' : 'rgba(245,158,11,0.2)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
