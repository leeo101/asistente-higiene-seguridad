import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Camera, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
    {
        icon: <Flame size={28} color="#f97316" />,
        bg: 'rgba(249,115,22,0.1)',
        title: 'Hacé tu primer cálculo',
        desc: 'Calculá la Carga de Fuego de un sector según Dec. 351/79 en minutos.',
        cta: 'Ir a Carga de Fuego',
        path: '/fire-load',
    },
    {
        icon: <Sparkles size={28} color="#f59e0b" />,
        bg: 'rgba(245,158,11,0.1)',
        title: 'Consultá el Asesor IA',
        desc: 'Hacé preguntas sobre normativa argentina y recibí respuestas legales al instante.',
        cta: 'Ir al Asesor IA',
        path: '/ai-advisor',
    },
    {
        icon: <Camera size={28} color="#06b6d4" />,
        bg: 'rgba(6,182,212,0.1)',
        title: 'Probá la Cámara IA',
        desc: 'Sacá una foto en obra y detectá automáticamente si falta EPP.',
        cta: 'Ir a Cámara IA',
        path: '/ai-camera',
    },
];

export default function OnboardingModal({ onClose }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [animating, setAnimating] = useState(false);

    const handleNavigate = (path) => {
        onClose();
        navigate(path);
    };

    const next = () => {
        if (step < STEPS.length - 1) {
            setAnimating(true);
            setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 200);
        } else {
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
        }}>
            <div style={{
                background: 'var(--color-surface, #fff)',
                borderRadius: '24px',
                maxWidth: '440px', width: '100%',
                boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                animation: 'fadeInUp 0.35s ease',
            }}>
                {/* Header gradient */}
                <div style={{
                    background: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
                    padding: '1.8rem 1.8rem 3.5rem',
                    position: 'relative',
                }}>
                    <button onClick={onClose} style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'rgba(255,255,255,0.15)', border: 'none',
                        borderRadius: '50%', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'white',
                    }}>
                        <X size={16} />
                    </button>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 0.4rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        ¡Bienvenido!
                    </p>
                    <h2 style={{ color: '#fff', margin: 0, fontSize: '1.4rem', fontWeight: 900, lineHeight: 1.2 }}>
                        Empezá con Asistente HYS
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0.6rem 0 0', fontSize: '0.88rem' }}>
                        3 cosas que podés hacer ahora mismo
                    </p>
                </div>

                {/* Step indicator dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '-1.2rem', position: 'relative', zIndex: 1 }}>
                    {STEPS.map((_, i) => (
                        <div key={i} onClick={() => setStep(i)} style={{
                            width: i === step ? '24px' : '8px', height: '8px',
                            borderRadius: '4px',
                            background: i === step ? '#fff' : 'rgba(255,255,255,0.4)',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        }} />
                    ))}
                </div>

                {/* Card content */}
                <div style={{
                    padding: '1.5rem 1.8rem 1.8rem',
                    opacity: animating ? 0 : 1,
                    transform: animating ? 'translateY(8px)' : 'translateY(0)',
                    transition: 'all 0.2s',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem',
                    }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: STEPS[step].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {STEPS[step].icon}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>{STEPS[step].title}</h3>
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.5 }}>
                                {STEPS[step].desc}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
                        <button
                            onClick={() => handleNavigate(STEPS[step].path)}
                            className="btn-primary"
                            style={{ flex: 2, padding: '0.8rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                            {STEPS[step].cta} <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={next}
                            style={{ flex: 1, padding: '0.8rem', background: 'var(--color-surface-hover, #f1f5f9)', border: '1px solid var(--color-border, #e2e8f0)', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-text-muted, #64748b)' }}
                        >
                            {step < STEPS.length - 1 ? 'Siguiente' : 'Cerrar'}
                        </button>
                    </div>

                    <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--color-text-muted, #94a3b8)', marginTop: '0.8rem' }}>
                        {step + 1} de {STEPS.length} — Podés cerrar esto en cualquier momento
                    </p>
                </div>
            </div>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
