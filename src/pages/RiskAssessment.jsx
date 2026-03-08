import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Activity, ShieldAlert, AlertCircle } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';

// SVG Animated Gauge
const Gauge = ({ score, color }) => {
    const maxScore = 9;
    const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));

    // SVG parameters
    const cx = 120;
    const cy = 120;
    const radius = 100;
    const strokeWidth = 18;

    // Circumference of half circle = pi * r
    const dashArray = Math.PI * radius;
    // Dash offset = dashArray - (dashArray * percentage / 100)
    const dashOffset = dashArray - (dashArray * percentage / 100);

    return (
        <div style={{ position: 'relative', width: '240px', height: '150px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="240" height="130" viewBox="0 0 240 130" style={{ overflow: 'visible' }}>
                {/* Background Arc */}
                <path
                    d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                {/* Active Arc */}
                <path
                    d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    style={{
                        transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease'
                    }}
                />
            </svg>
            <div style={{
                position: 'absolute',
                bottom: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                width: '100%'
            }}>
                <div style={{
                    fontSize: '3.5rem',
                    lineHeight: '1',
                    fontWeight: 900,
                    color: color,
                    transition: 'color 0.5s ease',
                    textShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    {score}
                </div>
            </div>
        </div>
    );
};

export default function RiskAssessment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();

    // Project Data State
    const [projectData, setProjectData] = useState({
        id: '',
        name: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
    });

    const [probability, setProbability] = useState(1);
    const [severity, setSeverity] = useState(1);
    const [riskLevel, setRiskLevel] = useState({ label: 'Bajo', color: '#10b981', action: 'Riesgo aceptable. No requiere medidas adicionales.', bg: '#d1fae5' });

    useEffect(() => {
        // Init from editData
        if (location.state?.editData) {
            const data = location.state.editData;
            setProjectData({
                id: data.id,
                name: data.name || '',
                location: data.location || '',
                date: data.date || data.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            });
            setProbability(data.probability || 1);
            setSeverity(data.severity || 1);
        }
    }, [location.state]);

    useEffect(() => {
        const score = probability * severity;
        if (score <= 2) {
            setRiskLevel({ label: 'Bajo', color: '#10b981', action: 'Riesgo aceptable. No requiere medidas adicionales.', bg: 'rgba(16, 185, 129, 0.1)' });
        } else if (score <= 4) {
            setRiskLevel({ label: 'Moderado', color: '#f59e0b', action: 'Requiere seguimiento. Implementar medidas de control administrativas.', bg: 'rgba(245, 158, 11, 0.1)' });
        } else if (score <= 6) {
            setRiskLevel({ label: 'Alto', color: '#f97316', action: 'Riesgo importante. Requiere medidas de ingeniería inmediatas.', bg: 'rgba(249, 115, 22, 0.1)' });
        } else {
            setRiskLevel({ label: 'Crítico', color: '#ef4444', action: 'PELIGRO INMINENTE. Detener la tarea hasta mitigar el riesgo.', bg: 'rgba(239, 68, 68, 0.1)' });
        }
    }, [probability, severity]);

    const handleSave = async () => {
        requirePro(async () => {
            if (!projectData.name) {
                toast.error('Ingresá el nombre o descripción de la tarea.');
                return;
            }

            const entryId = projectData.id || Date.now().toString();
            const entry = {
                id: entryId,
                name: projectData.name,
                location: projectData.location,
                date: projectData.date,
                probability,
                severity,
                score: probability * severity,
                riskLabel: riskLevel.label,
                createdAt: new Date().toISOString()
            };

            const history = JSON.parse(localStorage.getItem('risk_assessment_history') || '[]');

            let updated;
            if (projectData.id) {
                // Update existing
                updated = history.map(h => h.id === entryId ? { ...h, ...entry } : h);
            } else {
                // Add new
                updated = [entry, ...history];
            }

            await syncCollection('risk_assessment_history', updated);
            localStorage.setItem('risk_assessment_history', JSON.stringify(updated));
            toast.success('Evaluación de riesgo guardada con éxito');

            // Navigate to history instead of /observation
            navigate('/risk-assessment-history');
        });
    };

    const probabilityOptions = [
        { value: 1, label: 'Remota', desc: 'Poco probable' },
        { value: 2, label: 'Ocasional', desc: 'Puede ocurrir' },
        { value: 3, label: 'Frecuente', desc: 'Ocurre seguido' }
    ];

    const severityOptions = [
        { value: 1, label: 'Leve', desc: 'Lesión menor' },
        { value: 2, label: 'Grave', desc: 'Incapacidad' },
        { value: 3, label: 'Fatal', desc: 'Daño extremo' }
    ];



    return (
        <div className="container" style={{ maxWidth: '850px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.6rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Evaluación de Riesgo</h1>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Matriz IPER: Probabilidad × Severidad</p>
                </div>
            </div>

            {/* ─── PROJECT DATA ─── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem', marginBottom: '2rem'
            }}>
                {[
                    { label: 'TAREA / ACTIVIDAD', key: 'name', placeholder: 'Ej: Trabajo en altura' },
                    { label: 'UBICACIÓN / ÁREA', key: 'location', placeholder: 'Ej: Sector principal' },
                ].map(f => (
                    <div key={f.key} style={{
                        background: 'var(--color-surface)', borderRadius: '14px', padding: '1.2rem',
                        border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
                            {f.label}
                        </label>
                        <input
                            type="text" value={projectData[f.key]}
                            onChange={e => setProjectData({ ...projectData, [f.key]: e.target.value })}
                            placeholder={f.placeholder}
                            style={{ margin: 0, border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', outline: 'none', width: '100%' }}
                        />
                    </div>
                ))}
            </div>

            {/* Main Score Card */}
            <div className="card" style={{
                textAlign: 'center',
                marginBottom: '2rem',
                background: 'linear-gradient(145deg, var(--color-surface), var(--color-surface-hover))',
                border: '1px solid var(--color-border)',
                boxShadow: '0 8px 30px -5px rgba(0,0,0,0.05)',
                borderRadius: '20px',
                padding: '2.5rem 1.5rem 2rem 1.5rem'
            }}>
                <Gauge score={probability * severity} color={riskLevel.color} />
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '999px',
                        background: riskLevel.bg,
                        color: riskLevel.color,
                        fontWeight: 800,
                        fontSize: '1.3rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        transition: 'all 0.4s ease',
                        border: `1px solid ${riskLevel.color}40`
                    }}>
                        Nivel {riskLevel.label}
                    </div>
                </div>
            </div>

            {/* Selectors Grid */}
            <div className="grid-2-cols" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Probability Segment */}
                <div className="card" style={{ margin: 0, borderRadius: '20px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', fontWeight: 700 }}>
                        <div style={{ padding: '0.4rem', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px' }}>
                            <Activity size={20} color="var(--color-primary)" />
                        </div>
                        Probabilidad
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {probabilityOptions.map(opt => (
                            <div
                                key={opt.value}
                                onClick={() => setProbability(opt.value)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${probability === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    background: probability === opt.value ? 'rgba(37, 99, 235, 0.03)' : 'var(--color-surface)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: probability === opt.value ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none',
                                    transform: probability === opt.value ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 700, color: probability === opt.value ? 'var(--color-primary)' : 'var(--color-text)', fontSize: '1.05rem', transition: 'color 0.2s' }}>
                                        {opt.label}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                        {opt.desc}
                                    </div>
                                </div>
                                <div style={{
                                    width: '32px', height: '32px',
                                    borderRadius: '50%',
                                    background: probability === opt.value ? 'var(--color-primary)' : 'var(--color-background)',
                                    color: probability === opt.value ? 'white' : 'var(--color-text-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '0.9rem',
                                    transition: 'all 0.2s ease',
                                    border: probability === opt.value ? 'none' : '1px solid var(--color-border)'
                                }}>
                                    {opt.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Severity Segment */}
                <div className="card" style={{ margin: 0, borderRadius: '20px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', fontWeight: 700 }}>
                        <div style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                            <ShieldAlert size={20} color="var(--color-danger)" />
                        </div>
                        Severidad
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {severityOptions.map(opt => (
                            <div
                                key={opt.value}
                                onClick={() => setSeverity(opt.value)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${severity === opt.value ? 'var(--color-danger)' : 'var(--color-border)'}`,
                                    background: severity === opt.value ? 'rgba(239, 68, 68, 0.03)' : 'var(--color-surface)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: severity === opt.value ? '0 4px 12px rgba(239, 68, 68, 0.15)' : 'none',
                                    transform: severity === opt.value ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 700, color: severity === opt.value ? 'var(--color-danger)' : 'var(--color-text)', fontSize: '1.05rem', transition: 'color 0.2s' }}>
                                        {opt.label}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                        {opt.desc}
                                    </div>
                                </div>
                                <div style={{
                                    width: '32px', height: '32px',
                                    borderRadius: '50%',
                                    background: severity === opt.value ? 'var(--color-danger)' : 'var(--color-background)',
                                    color: severity === opt.value ? 'white' : 'var(--color-text-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '0.9rem',
                                    transition: 'all 0.2s ease',
                                    border: severity === opt.value ? 'none' : '1px solid var(--color-border)'
                                }}>
                                    {opt.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Box */}
            <div className="card" style={{
                border: '1px solid var(--color-border)',
                borderLeft: `8px solid ${riskLevel.color}`,
                background: riskLevel.bg,
                borderRadius: '16px',
                padding: '1.5rem',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '2.5rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ background: 'var(--color-surface)', borderRadius: '50%', padding: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <AlertCircle size={28} color={riskLevel.color} />
                    </div>
                    <div style={{ paddingTop: '0.2rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: riskLevel.color, fontSize: '1.15rem', fontWeight: 800 }}>Acción Recomendada</h4>
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text)', fontWeight: 500 }}>{riskLevel.action}</p>
                    </div>
                </div>
            </div>

            {/* Footer Button */}
            <button
                onClick={handleSave}
                className="btn-primary"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    padding: '1.2rem',
                    fontSize: '1.1rem',
                    borderRadius: '16px',
                    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    fontWeight: 700,
                    width: '100%'
                }}
            >
                <Save size={22} /> Guardar Evaluación
            </button>
        </div>
    );
}
