import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, FileText, Sparkle as Sparkles, SpinnerGap, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

export default function InteractiveHeroDemo() {
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
    const navigate = useNavigate();

    const handleGenerate = () => {
        if (!inputValue.trim()) return;
        setStatus('loading');
        setTimeout(() => {
            setStatus('done');
        }, 1500); // 1.5s fake AI generation
    };

    return (
        <div className="glass-mockup" style={{ 
            padding: '1.4rem', 
            transition: 'all 0.4s ease', 
            maxWidth: '420px', 
            width: '100%',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
            backdropFilter: 'blur(20px)'
        }}>
            
            {status === 'idle' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg,#c084fc,#a855f7)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Sparkles size={24} color="white" weight="fill" />
                    </div>
                    <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Prueba la IA ahora</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '0 0 1.5rem', lineHeight: 1.4 }}>
                        Escribe una tarea y mira cómo la IA detecta los riesgos automáticamente.
                    </p>
                    
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <input 
                            type="text" 
                            placeholder="Ej. Soldadura en andamio..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(0,0,0,0.3)',
                                color: 'white',
                                fontSize: '0.95rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    
                    <button 
                        onClick={handleGenerate}
                        disabled={!inputValue.trim()}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            background: inputValue.trim() ? 'linear-gradient(to right, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                            color: inputValue.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: '1rem',
                            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Sparkles size={18} weight="bold" /> Generar Magia
                    </button>
                </div>
            )}

            {status === 'loading' && (
                <div style={{ textAlign: 'center', padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <SpinnerGap size={40} color="#a855f7" className="spin-animation" weight="bold" />
                    <div>
                        <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.3rem' }}>Analizando normativa...</div>
                        <div style={{ color: '#c084fc', fontSize: '0.8rem', fontWeight: 600 }}>IA Procesando la tarea: "{inputValue}"</div>
                    </div>
                    <div style={{ width: '80%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #a855f7)', animation: 'slideRight 1s infinite linear' }} />
                    </div>
                </div>
            )}

            {status === 'done' && (
                <div className="fade-in">
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', paddingBottom: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#1e40af,#3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}><ShieldCheck size={20} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: 'white', fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.2 }}>Análisis de Trabajo Seguro</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginTop: '0.1rem' }}>⚡ Generado por IA en 1.5s</div>
                        </div>
                        <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900, padding: '0.2rem 0.6rem', flexShrink: 0 }}>✓ Listo</span>
                    </div>

                    {/* Task info row */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tarea Analizada</div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>{inputValue}</div>
                        </div>
                        <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.65rem', fontWeight: 900, padding: '0.25rem 0.6rem', borderRadius: '20px', flexShrink: 0 }}>🔴 ALTO RIESGO</span>
                    </div>

                    {/* Steps list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem' }}>
                        {[
                            { step: '01', text: 'Riesgo de caída a distinto nivel (Gravedad: Alta)', done: true },
                            { step: '02', text: 'Uso obligatorio de arnés y cabo de vida doble', done: true },
                            { step: '03', text: 'Inscripción en permiso de trabajo en altura', done: false },
                        ].map(s => (
                            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.8rem', borderRadius: '8px', background: s.done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${s.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: 900, color: s.done ? '#34d399' : 'rgba(255,255,255,0.3)', background: s.done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.1rem 0.35rem', flexShrink: 0 }}>{s.step}</span>
                                <span style={{ fontSize: '0.78rem', color: s.done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)', fontWeight: 500, flex: 1, lineHeight: 1.3 }}>{s.text}</span>
                                {s.done && <CheckCircle size={14} color="#34d399" style={{ flexShrink: 0 }} />}
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => navigate('/login', { state: { view: 'register' } })}
                        style={{
                            width: '100%',
                            padding: '0.9rem',
                            borderRadius: '10px',
                            background: 'white',
                            color: '#0f172a',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 14px rgba(255,255,255,0.2)'
                        }}
                    >
                        Exportar a PDF <ArrowRight weight="bold" />
                    </button>
                </div>
            )}

            <style>{`
                @keyframes slideRight {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .spin-animation {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
                .fade-in {
                    animation: fadeIn 0.4s ease forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
