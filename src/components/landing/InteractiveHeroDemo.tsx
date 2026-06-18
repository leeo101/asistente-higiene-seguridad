import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, FileText, Sparkle as Sparkles, Robot, FilePdf, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

const DEMO_TASKS = [
  {
    input: 'Soldadura en espacio confinado nivel C',
    riskLevel: '🔴 ALTO RIESGO',
    riskColor: '#f87171',
    riskBg: 'rgba(248,113,113,0.2)',
    steps: [
      { step: '01', text: 'Riesgo de asfixia / atmósfera peligrosa (explosividad)', done: true },
      { step: '02', text: 'Uso de equipo SCBA y traje ignífugo obligatorio', done: true },
      { step: '03', text: 'Permiso de trabajo en espacio confinado firmado', done: true },
    ],
  },
  {
    input: 'Trabajo eléctrico en tablero de 380V',
    riskLevel: '🔴 ALTO RIESGO',
    riskColor: '#f87171',
    riskBg: 'rgba(248,113,113,0.2)',
    steps: [
      { step: '01', text: 'Riesgo de electrocución — aplicar LOTO antes de intervenir', done: true },
      { step: '02', text: 'EPP dieléctrico: guantes, casco y calzado aislante', done: true },
      { step: '03', text: 'Señalizar y aislar el área con vallas y carteles', done: true },
    ],
  },
  {
    input: 'Cambio de cubierta en andamio colgante',
    riskLevel: '🟠 RIESGO MEDIO',
    riskColor: '#fb923c',
    riskBg: 'rgba(251,146,60,0.2)',
    steps: [
      { step: '01', text: 'Riesgo de caída a distinto nivel — arnés y cabo doble', done: true },
      { step: '02', text: 'Verificar carga máxima del andamio y estado de cables', done: true },
      { step: '03', text: 'Delimitar área inferior con cinta y vigía asignado', done: true },
    ],
  },
];

type Phase = 'idle' | 'typing' | 'analyzing' | 'done';

export default function InteractiveHeroDemo() {
    const [inputValue, setInputValue] = useState('');
    const [manualInput, setManualInput] = useState('');
    const [phase, setPhase] = useState<Phase>('idle');
    const [demoIndex, setDemoIndex] = useState(0);
    const [currentTask, setCurrentTask] = useState(DEMO_TASKS[0]);
    const navigate = useNavigate();

    // Auto-demo cycle
    useEffect(() => {
        let charIdx = 0;
        let timeouts: ReturnType<typeof setTimeout>[] = [];

        const demo = DEMO_TASKS[demoIndex];
        const text = demo.input;

        setPhase('typing');
        setInputValue('');

        const typeChar = () => {
            if (charIdx <= text.length) {
                setInputValue(text.slice(0, charIdx));
                charIdx++;
                const t = setTimeout(typeChar, 40);
                timeouts.push(t);
            } else {
                // Done typing → start analyzing
                const t1 = setTimeout(() => {
                    setPhase('analyzing');
                    const t2 = setTimeout(() => {
                        setCurrentTask(demo);
                        setPhase('done');
                        // Wait 4s then restart with next demo
                        const t3 = setTimeout(() => {
                            setDemoIndex(prev => (prev + 1) % DEMO_TASKS.length);
                        }, 4000);
                        timeouts.push(t3);
                    }, 1800);
                    timeouts.push(t2);
                }, 500);
                timeouts.push(t1);
            }
        };

        typeChar();
        return () => timeouts.forEach(clearTimeout);
    }, [demoIndex]);

    // Manual input overrides auto-demo
    const handleManualGenerate = () => {
        if (!manualInput.trim()) return;
        setInputValue(manualInput);
        setPhase('analyzing');
        setTimeout(() => {
            setCurrentTask({
                ...DEMO_TASKS[0],
                input: manualInput,
            });
            setPhase('done');
        }, 1500);
    };

    const handleReset = () => {
        setManualInput('');
        setPhase('idle');
        setDemoIndex(prev => (prev + 1) % DEMO_TASKS.length);
    };

    return (
        <div className="glass-mockup" style={{
            animation: 'float 6s ease-in-out infinite',
            padding: '1.4rem',
            maxWidth: '420px',
            width: '100%',
            background: 'rgba(10, 15, 30, 0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
            backdropFilter: 'blur(24px)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Top glow */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.7), rgba(59,130,246,0.7), transparent)',
                pointerEvents: 'none',
            }} />

            {/* Header bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Robot size={18} color="white" weight="fill" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>Asistente IA H&S</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', animation: 'pulse-soft 2s ease infinite' }} />
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', fontWeight: 600 }}>En línea · Normativa actualizada 2024</span>
                    </div>
                </div>
                <div style={{ padding: '0.2rem 0.6rem', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '20px', color: '#c084fc', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                    DEMO
                </div>
            </div>

            {/* Input area */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Ej. Trabajo en caliente en refinería…"
                    value={phase === 'idle' ? manualInput : (manualInput || inputValue)}
                    onChange={e => { setManualInput(e.target.value); }}
                    onKeyDown={e => e.key === 'Enter' && handleManualGenerate()}
                    style={{
                        width: '100%', padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(0,0,0,0.35)',
                        color: 'white', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                        fontStyle: phase === 'typing' ? 'italic' : 'normal',
                    }}
                />
                {/* Cursor when typing */}
                {phase === 'typing' && (
                    <span style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        color: '#a78bfa', fontWeight: 900, animation: 'pulse-soft 0.8s ease infinite',
                    }}>|</span>
                )}
            </div>

            {/* Analyzing state */}
            {phase === 'analyzing' && (
                <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', animation: 'fadeInUp 0.3s ease' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : '#34d399',
                                animation: `pulse-soft 1s ease ${i * 0.2}s infinite`,
                            }} />
                        ))}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.2rem' }}>Analizando normativa…</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Cruzando Dec. 351/79 + SRT</div>
                    </div>
                    <div style={{ width: '85%', height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', animation: 'slideRight 1.2s infinite linear', borderRadius: '2px' }} />
                    </div>
                </div>
            )}

            {/* Result state */}
            {phase === 'done' && (
                <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', padding: '0.6rem 0.8rem', borderRadius: '10px', background: `${currentTask.riskBg}`, border: `1px solid ${currentTask.riskColor}30` }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Tarea analizada</div>
                            {currentTask.input.length > 32 ? currentTask.input.slice(0, 32) + '…' : currentTask.input}
                        </div>
                        <span style={{ background: currentTask.riskBg, color: currentTask.riskColor, border: `1px solid ${currentTask.riskColor}30`, borderRadius: '20px', fontSize: '0.62rem', fontWeight: 900, padding: '0.2rem 0.5rem', flexShrink: 0, marginLeft: '0.5rem', whiteSpace: 'nowrap' }}>
                            {currentTask.riskLevel}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.1rem' }}>
                        {currentTask.steps.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.55rem 0.8rem', borderRadius: '9px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)', animation: `fadeInUp 0.4s ease ${i * 0.1}s both` }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#34d399', background: 'rgba(16,185,129,0.15)', borderRadius: '5px', padding: '0.1rem 0.35rem', flexShrink: 0, marginTop: '1px' }}>{s.step}</span>
                                <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.82)', fontWeight: 500, flex: 1, lineHeight: 1.35 }}>{s.text}</span>
                                <CheckCircle size={13} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} weight="fill" />
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button onClick={() => navigate('/login', { state: { view: 'register' } })} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'white', color: '#0f172a', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 14px rgba(255,255,255,0.15)' }}>
                            <FilePdf size={15} weight="fill" /> Exportar PDF
                        </button>
                        <button onClick={handleReset} style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'}>
                            Otra ↺
                        </button>
                    </div>
                </div>
            )}

            {/* Idle / ready state — only shows briefly at beginning */}
            {phase === 'typing' && inputValue === '' && (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>
                    <Sparkles size={20} color="#a78bfa" weight="fill" style={{ display: 'block', margin: '0 auto 0.5rem' }} />
                    La IA detecta riesgos automáticamente
                </div>
            )}

            <style>{`
                @keyframes slideRight {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(250%); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
