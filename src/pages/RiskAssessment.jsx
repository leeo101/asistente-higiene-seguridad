import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, Info, Zap, ShieldAlert, Activity } from 'lucide-react';

export default function RiskAssessment() {
    const navigate = useNavigate();
    const [risk, setRisk] = useState({
        probabilidad: 1,
        consecuencia: 1,
        nivel: 'Bajo',
        medida: ''
    });

    useEffect(() => {
        calculateRisk();
    }, [risk.probabilidad, risk.consecuencia]);

    const calculateRisk = () => {
        const p = risk.probabilidad;
        const c = risk.consecuencia;
        const valor = p * c;
        let nivel = 'Bajo';
        let color = '#10b981'; // green

        // Fine-tuned risk levels for 5x5 matrix
        if (valor > 15) {
            nivel = 'INTOLERABLE';
            color = '#ef4444';
        } else if (valor >= 10) {
            nivel = 'Alto';
            color = '#f97316';
        } else if (valor >= 5) {
            nivel = 'Moderado';
            color = '#fbbf24';
        }

        setRisk(prev => ({ ...prev, nivel, color, valor }));
    };


    const handleSave = () => {
        navigate('/checklist'); // Return to checklist loop
    };

    return (
        <div className="container" style={{ maxWidth: '600px', paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Evaluación de Riesgos</h1>
            </div>

            {/* Intuitive Risk Meter (Gauge) */}
            <div className="card" style={{ padding: '2rem 1.5rem', marginBottom: '2rem', textAlign: 'center', overflow: 'hidden' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <Activity size={18} color="var(--color-primary)" /> Medidor de Nivel de Riesgo
                </h3>

                <div style={{ position: 'relative', width: '240px', margin: '0 auto' }}>
                    {/* Gauge SVG */}
                    <svg viewBox="0 0 100 55" style={{ width: '100%', height: 'auto' }}>
                        {/* Background Arc */}
                        <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                        {/* Status Arcs (Colored Segments) */}
                        <path d="M 10 50 A 40 40 0 0 1 25 25" fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
                        <path d="M 25 25 A 40 40 0 0 1 50 10" fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
                        <path d="M 50 10 A 40 40 0 0 1 75 25" fill="none" stroke="#f97316" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
                        <path d="M 75 25 A 40 40 0 0 1 90 50" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" opacity="0.4" />

                        {/* Labels around the arc */}
                        <text x="12" y="55" fontSize="4" fill="#666" fontWeight="bold">BAJO</text>
                        <text x="80" y="55" fontSize="4" fill="#666" fontWeight="bold">ALTO</text>
                        <text x="50" y="7" fontSize="5" fill={risk.color} fontWeight="bold" textAnchor="middle">{risk.nivel}</text>
                    </svg>

                    {/* The Needle */}
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '50%',
                        width: '4px',
                        height: '90px',
                        background: '#374151',
                        borderRadius: '4px',
                        transformOrigin: 'bottom center',
                        // Map risk value (1-25) to degrees (-90 to 90)
                        transform: `translateX(-50%) rotate(${((risk.valor - 1) / 24) * 180 - 90}deg)`,
                        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        zIndex: 2
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-5px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '0',
                            height: '0',
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderBottom: '10px solid #374151'
                        }} />
                    </div>
                    {/* Pivot point */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '20px',
                        height: '20px',
                        background: '#fff',
                        border: '4px solid #374151',
                        borderRadius: '50%',
                        zIndex: 3
                    }} />
                </div>

                <div style={{ marginTop: '2.5rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: risk.color, lineHeight: 1 }}>{risk.valor}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>Valor de Riesgo Obtenido</div>
                </div>
            </div>

            {/* Selection Controls */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>
                        <Zap size={18} color="#fbbf24" /> Probabilidad de Ocurrencia
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(v => (
                            <button
                                key={v}
                                onClick={() => setRisk({ ...risk, probabilidad: v })}
                                style={{
                                    flex: 1,
                                    height: '45px',
                                    borderRadius: '12px',
                                    border: `2px solid ${risk.probabilidad === v ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    background: risk.probabilidad === v ? 'var(--color-primary-light)' : 'var(--color-surface)',
                                    color: risk.probabilidad === v ? 'var(--color-primary)' : 'var(--color-text)',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>
                        <ShieldAlert size={18} color="#ef4444" /> Severidad de la Consecuencia
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(v => (
                            <button
                                key={v}
                                onClick={() => setRisk({ ...risk, consecuencia: v })}
                                style={{
                                    flex: 1,
                                    height: '45px',
                                    borderRadius: '12px',
                                    border: `2px solid ${risk.consecuencia === v ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    background: risk.consecuencia === v ? 'var(--color-primary-light)' : 'var(--color-surface)',
                                    color: risk.consecuencia === v ? 'var(--color-primary)' : 'var(--color-text)',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', fontWeight: 600 }}>
                    <Info size={18} color="var(--color-primary)" /> Medida Preventiva / Control
                </label>
                <textarea
                    rows={4}
                    value={risk.medida}
                    onChange={(e) => setRisk({ ...risk, medida: e.target.value })}
                    placeholder="Escriba aquí las acciones para reducir o controlar este riesgo..."
                    style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-hover)',
                        fontSize: '0.9rem',
                        resize: 'none'
                    }}
                />
            </div>

            <button
                className="btn-primary"
                onClick={handleSave}
                style={{
                    width: '100%',
                    padding: '1.2rem',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.8rem',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    boxShadow: '0 8px 24px rgba(30, 64, 175, 0.3)',
                    marginTop: '1rem'
                }}
            >
                <Save size={24} /> Guardar Evaluación de Riesgo
            </button>
        </div>
    );
}
