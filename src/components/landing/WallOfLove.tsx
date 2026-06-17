import React from 'react';
import { Star, CheckCircle, ShieldCheck } from '@phosphor-icons/react';

export default function WallOfLove() {
    const testimonials = [
        {
            name: "Juan Pérez",
            role: "Supervisor de Obra",
            content: "Antes tardaba 40 minutos en hacer un ATS de espacios confinados, ahora lo hago en la obra desde el celular mientras reviso el área.",
            rating: 5
        },
        {
            name: "María Gómez",
            role: "Ing. en Higiene y Seguridad",
            content: "La función de Carga de Fuego es increíble. Me ahorró horas de cálculos y formato en Excel. Lo recomiendo 100%.",
            rating: 5
        },
        {
            name: "Carlos R.",
            role: "Técnico H&S",
            content: "Llevar el registro de las capacitaciones y reportes con las firmas digitalizadas me solucionó la vida en las auditorías.",
            rating: 5
        }
    ];

    return (
        <div style={{ padding: '4rem 1.2rem', background: '#020617', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Logos / Compliance Marquee */}
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>
                        Diseñado bajo normativas internacionales
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: 'clamp(1rem, 5vw, 4rem)', 
                        flexWrap: 'wrap',
                        opacity: 0.6,
                        filter: 'grayscale(100%)'
                    }}>
                        {['ISO 14001', 'ISO 45001', 'SRT / LEY 19.587', 'NFPA 10'].map(norm => (
                            <div key={norm} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>
                                <ShieldCheck size={24} color="#60a5fa" />
                                {norm}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Testimonials */}
                <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: '3rem', fontFamily: 'var(--font-heading)' }}>
                    Profesionales que ya no usan papel.
                </h2>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '1.5rem' 
                }}>
                    {testimonials.map((t, i) => (
                        <div key={i} className="glass-card-premium stagger-up" style={{ 
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            marginTop: i % 2 === 0 ? '0' : '2rem'
                        }}>
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                                {[...Array(t.rating)].map((_, idx) => (
                                    <Star key={idx} size={16} weight="fill" color="#f59e0b" />
                                ))}
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: 1.6, margin: 0, flex: 1 }}>
                                "{t.content}"
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                <div 
                                    translate="no" 
                                    className="notranslate" 
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem', flexShrink: 0 }}
                                >
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {t.name} <CheckCircle weight="fill" color="#3b82f6" size={14} />
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                        {t.role}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
