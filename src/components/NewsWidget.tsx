
import React, { useState, useEffect } from 'react';
import { Newspaper, ChevronRight, ExternalLink, BellRing } from 'lucide-react';

const NEWS_BY_COUNTRY = {
    argentina: [
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
    ],
    chile: [
        {
            id: 1,
            title: "Actualización de Protocolos MINSAL",
            description: "Revisa las últimas actualizaciones sobre el Protocolo de Vigilancia de Riesgos Psicosociales en el Trabajo.",
            date: "Hace 3 días",
            tag: "MINSAL",
            link: "https://www.minsal.cl"
        },
        {
            id: 2,
            title: "Nueva Guía Técnica de Manejo Manual de Carga",
            description: "La SUSESO ha publicado una actualización de la guía técnica para la evaluación de riesgos de manejo manual de carga.",
            date: "Hace 1 semana",
            tag: "Ley 20.949",
            link: "https://www.suseso.cl"
        },
        {
            id: 3,
            title: "Prevención en el uso de Citostáticos",
            description: "Nuevas directrices técnicas para la protección de trabajadores expuestos a citostáticos en centros de salud.",
            date: "Novedad",
            tag: "Técnico",
            link: "https://www.ispch.cl"
        }
    ],
    bolivia: [
        {
            id: 1,
            title: "Campaña Nacional de Seguridad",
            description: "El Ministerio de Trabajo lanza campaña para reducir accidentes en el sector construcción.",
            date: "Hace 2 días",
            tag: "MIN TRABAJO",
            link: "https://www.mintrabajo.gob.bo/"
        },
        {
            id: 2,
            title: "Inspecciones en Santa Cruz",
            description: "Autoridades intensifican controles preventivos en establecimientos industriales de la región.",
            date: "Hace 1 semana",
            tag: "Prevención",
            link: "https://www.mintrabajo.gob.bo/"
        }
    ],
    paraguay: [
        {
            id: 1,
            title: "Avances en Salud Laboral",
            description: "MTESS presenta avances en la protección de la salud y seguridad de los trabajadores paraguayos.",
            date: "Hace 4 días",
            tag: "MTESS",
            link: "https://www.mtess.gov.py/"
        },
        {
            id: 2,
            title: "Capacitación de Seguridad",
            description: "Jornadas técnicas para empresas del sector servicios sobre prevención de incendios.",
            date: "Hace 1 semana",
            tag: "Técnico",
            link: "https://www.mtess.gov.py/"
        }
    ],
    uruguay: [
        {
            id: 1,
            title: "Nuevos lineamientos en Altura",
            description: "La IGTSS actualiza criterios de seguridad para el uso de andamios y plataformas elevadoras.",
            date: "Hace 3 días",
            tag: "IGTSS",
            link: "https://www.gub.uy/ministerio-trabajo-seguridad-social/"
        },
        {
            id: 2,
            title: "Semana de la Seguridad",
            description: "Actividades de sensibilización nacional bajo el marco del Decreto 406/88.",
            date: "Hace 1 semana",
            tag: "MTSS",
            link: "https://www.gub.uy/ministerio-trabajo-seguridad-social/"
        }
    ],
    generic: [
        {
            id: 1,
            title: "Tendencias Globales en Seguridad 4.0",
            description: "Cómo la IA y el IoT están transformando la gestión de riesgos en la industria moderna.",
            date: "Hace 2 días",
            tag: "Innovación",
            link: "#"
        },
        {
            id: 2,
            title: "Importancia de la Salud Mental en el Trabajo",
            description: "Nuevos estudios destacan el impacto de la prevención de riesgos psicosociales en la productividad.",
            date: "Hace 1 semana",
            tag: "Salud",
            link: "#"
        }
    ]
};

export default function NewsWidget() {
    const savedData = localStorage.getItem('personalData');
    const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
    const NEWS_ITEMS = NEWS_BY_COUNTRY[userCountry] || NEWS_BY_COUNTRY.generic;

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
