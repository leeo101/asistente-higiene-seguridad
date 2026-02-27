import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, ShieldCheck, Info, BarChart3, AlertCircle } from 'lucide-react';

export default function RiskAssessment() {
    const navigate = useNavigate();
    const [probability, setProbability] = useState(1);
    const [severity, setSeverity] = useState(1);
    const [riskLevel, setRiskLevel] = useState({ label: 'Bajo', color: '#10b981', action: 'Riesgo aceptable. No requiere medidas adicionales.' });

    useEffect(() => {
        const score = probability * severity;
        if (score <= 2) {
            setRiskLevel({ label: 'Bajo', color: '#10b981', action: 'Riesgo aceptable. No requiere medidas adicionales.' });
        } else if (score <= 4) {
            setRiskLevel({ label: 'Moderado', color: '#f59e0b', action: 'Requiere seguimiento. Implementar medidas de control administrativas.' });
        } else if (score <= 6) {
            setRiskLevel({ label: 'Alto', color: '#f97316', action: 'Riesgo importante. Requiere medidas de ingeniería inmediatas.' });
        } else {
            setRiskLevel({ label: 'Crítico', color: '#ef4444', action: 'PELIGRO INMINENTE. Detener la tarea hasta mitigar el riesgo.' });
        }
    }, [probability, severity]);

    // Gauge Component
    const Gauge = ({ score }) => {
        const maxScore = 9;
        const percentage = (score / maxScore) * 100;
        const rotation = (percentage * 1.8) - 90; // -90 to 90 degrees

        return (
            <div style={{ position: 'relative', width: '200px', height: '110px', margin: '0 auto', overflow: 'hidden' }}>
                <div style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    border: '20px solid var(--color-border)',
                    borderBottomColor: 'transparent',
                    boxSizing: 'border-box',
                    transform: 'rotate(-45deg)'
                }}></div>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    border: '20px solid transparent',
                    borderTopColor: riskLevel.color,
                    borderRightColor: score > 3 ? riskLevel.color : 'transparent',
                    borderBottomColor: 'transparent',
                    boxSizing: 'border-box',
                    transform: 'rotate(-45deg)',
                    transition: 'border-color 0.5s ease'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: riskLevel.color }}>{score}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Puntaje</div>
                </div>
            </div>
        );
    };

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Evaluación de Riesgo</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Matriz probabilidad × severidad</p>
                </div>
            </div>

            <div className="card" style={{ textAlign: 'center' }}>
                <Gauge score={probability * severity} />
                <div style={{ marginTop: '1rem' }}>
                    <h2 style={{ margin: 0, color: riskLevel.color, fontSize: '1.5rem', fontWeight: 800 }}>Nivel: {riskLevel.label}</h2>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={20} color="var(--color-primary)" /> Estimación Probalidad x Severidad
                </h3>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: 700 }}>Probabilidad (1-3)</label>
                        <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{probability}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="1"
                        value={probability}
                        onChange={(e) => setProbability(parseInt(e.target.value))}
                        style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        <span>Remota</span>
                        <span>Ocasional</span>
                        <span>Frecuente</span>
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: 700 }}>Severidad (1-3)</label>
                        <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{severity}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="1"
                        value={severity}
                        onChange={(e) => setSeverity(parseInt(e.target.value))}
                        style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        <span>Leve</span>
                        <span>Grave</span>
                        <span>Fatal</span>
                    </div>
                </div>
            </div>

            <div className="card" style={{ borderLeft: `6px solid ${riskLevel.color}`, background: `${riskLevel.color}10` }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <AlertCircle size={24} color={riskLevel.color} />
                    <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: riskLevel.color }}>Acción Recomendada</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{riskLevel.action}</p>
                    </div>
                </div>
            </div>

            <button onClick={() => navigate('/observation')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Save size={18} /> Continuar al Registro
            </button>
        </div>
    );
}
