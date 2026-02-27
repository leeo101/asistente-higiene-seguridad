import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, AlertTriangle, ShieldCheck, Flame, Zap, Leaf, Activity, Brain, Wrench, Share2, Printer } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';

const HAZARD_TYPES = [
    { value: '', label: 'Seleccionar...', icon: null, color: '#94a3b8' },
    { value: 'Físico', label: 'Físico', icon: <Zap size={12} />, color: '#3b82f6' },
    { value: 'Químico', label: 'Químico', icon: <Flame size={12} />, color: '#f59e0b' },
    { value: 'Biológico', label: 'Biológico', icon: <Leaf size={12} />, color: '#10b981' },
    { value: 'Ergonómico', label: 'Ergonómico', icon: <Activity size={12} />, color: '#8b5cf6' },
    { value: 'Psicosocial', label: 'Psicosocial', icon: <Brain size={12} />, color: '#ec4899' },
    { value: 'Mecánico', label: 'Mecánico', icon: <Wrench size={12} />, color: '#6366f1' },
    { value: 'Eléctrico', label: 'Eléctrico', icon: <Zap size={12} />, color: '#f97316' },
];

const PROB_LABELS = ['', 'Baja', 'Media', 'Alta', 'Muy Alta'];
const SEV_LABELS = ['', 'Leve', 'Moderada', 'Grave', 'Crítica'];

const getRiskLevel = (p, s) => {
    const val = p * s;
    if (val <= 4) return { label: 'BAJO', bg: '#dcfce7', color: '#16a34a', border: '#86efac', score: val };
    if (val <= 9) return { label: 'MODERADO', bg: '#fef9c3', color: '#ca8a04', border: '#fde047', score: val };
    return { label: 'CRÍTICO', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', score: val };
};

const emptyRow = () => ({
    id: Date.now() + Math.random(),
    task: '', hazardType: '', hazard: '', probableEffect: '',
    exposedCount: 1, probability: 1, severity: 1, controls: ''
});

export default function RiskMatrix() {
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const [projectData, setProjectData] = useState({
        name: '', location: '',
        date: new Date().toISOString().split('T')[0],
        responsable: ''
    });
    const [rows, setRows] = useState([emptyRow()]);
    const [showShare, setShowShare] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('personalData');
        if (saved) {
            const p = JSON.parse(saved);
            setProjectData(prev => ({ ...prev, responsable: p.name || '' }));
        }
    }, []);

    const addRow = () => setRows([...rows, emptyRow()]);
    const removeRow = (id) => { if (rows.length > 1) setRows(rows.filter(r => r.id !== id)); };
    const updateRow = (id, field, value) => setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));

    const handleSave = async () => {
        requirePro(async () => {
            if (!projectData.name) { alert('Ingresá el nombre de la obra / proyecto.'); return; }
            const entry = { id: Date.now(), ...projectData, rows, createdAt: new Date().toISOString() };
            const history = JSON.parse(localStorage.getItem('risk_matrix_history') || '[]');
            const updated = [entry, ...history];
            await syncCollection('risk_matrix_history', updated);
            localStorage.setItem('current_risk_matrix', JSON.stringify(entry));
            navigate('/risk-matrix-report');
        });
    };

    const summary = {
        bajo: rows.filter(r => getRiskLevel(r.probability, r.severity).label === 'BAJO').length,
        moderado: rows.filter(r => getRiskLevel(r.probability, r.severity).label === 'MODERADO').length,
        critico: rows.filter(r => getRiskLevel(r.probability, r.severity).label === 'CRÍTICO').length,
    };

    return (
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '2rem 1rem', paddingBottom: '8rem' }}>
            <ShareModal
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Matriz de Riesgos – ${projectData.name}`}
                text={`📋 Matriz de Riesgos\n🏗️ Proyecto: ${projectData.name}\n📍 Ubicación: ${projectData.location}\n👷 Responsable: ${projectData.responsable}\n\nGenerado con Asistente HYS`}
            />

            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: 'white' }}
                >
                    <Save size={18} /> GUARDAR
                </button>
                <button
                    onClick={() => requirePro(() => setShowShare(true))}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: 'white' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => requirePro(() => window.print())}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: 'white' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>

            {/* ─── HEADER ─── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '2rem', background: '#fff', borderRadius: '20px',
                padding: '1.5rem 2rem', border: '1px solid #e2e8f0',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <button onClick={() => navigate('/')} style={{
                        padding: '0.6rem', background: '#f1f5f9', borderRadius: '12px',
                        border: 'none', cursor: 'pointer', display: 'flex', color: '#475569'
                    }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <AlertTriangle size={28} color="#f59e0b" /> Matriz de Riesgos
                        </h1>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Ley 19.587 / Dec. 351/79 - HYS
                        </p>
                    </div>
                </div>
                <button onClick={handleSave} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #36B37E, #00875A)',
                    color: 'white', borderRadius: '50px', border: 'none',
                    fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(54,179,126,0.35)'
                }}>
                    <Save size={16} /> GUARDAR Y GENERAR PDF
                </button>
            </div>

            {/* ─── PROJECT DATA ─── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem', marginBottom: '2rem'
            }}>
                {[
                    { label: 'OBRA / PROYECTO', key: 'name', placeholder: 'Ej: Edificio Central' },
                    { label: 'UBICACIÓN', key: 'location', placeholder: 'Ej: Planta Norte' },
                    { label: 'RESPONSABLE HYS', key: 'responsable', placeholder: 'Profesional actuante' },
                ].map(f => (
                    <div key={f.key} style={{
                        background: '#fff', borderRadius: '14px', padding: '1.2rem',
                        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
                            {f.label}
                        </label>
                        <input
                            type="text" value={projectData[f.key]}
                            onChange={e => setProjectData({ ...projectData, [f.key]: e.target.value })}
                            placeholder={f.placeholder}
                            style={{ margin: 0, border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', outline: 'none', width: '100%' }}
                        />
                    </div>
                ))}
                <div style={{
                    background: '#fff', borderRadius: '14px', padding: '1.2rem',
                    border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>FECHA</label>
                    <input type="date" value={projectData.date}
                        onChange={e => setProjectData({ ...projectData, date: e.target.value })}
                        style={{ margin: 0, border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', outline: 'none', width: '100%' }} />
                </div>
            </div>

            {/* ─── SUMMARY CARDS ─── */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {[
                    { label: 'Riesgos Bajos', count: summary.bajo, bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
                    { label: 'Riesgos Moderados', count: summary.moderado, bg: '#fef9c3', color: '#ca8a04', border: '#fde047' },
                    { label: 'Riesgos Críticos', count: summary.critico, bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
                    { label: 'Total Evaluados', count: rows.length, bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
                ].map(s => (
                    <div key={s.label} style={{
                        flex: '1 1 140px', background: s.bg, border: `2px solid ${s.border}`,
                        borderRadius: '16px', padding: '1.2rem', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.3rem' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ─── RISK ROWS ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {rows.map((row, idx) => {
                    const level = getRiskLevel(row.probability, row.severity);
                    const hazardInfo = HAZARD_TYPES.find(h => h.value === row.hazardType) || HAZARD_TYPES[0];
                    return (
                        <div key={row.id} style={{
                            background: '#fff', borderRadius: '18px',
                            border: `2px solid ${level.border}`,
                            padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                            position: 'relative'
                        }}>
                            {/* Row Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <span style={{
                                        background: '#f1f5f9', color: '#64748b', borderRadius: '8px',
                                        padding: '0.3rem 0.7rem', fontWeight: 900, fontSize: '0.75rem'
                                    }}>#{idx + 1}</span>
                                    <span style={{
                                        background: level.bg, color: level.color, border: `1.5px solid ${level.border}`,
                                        borderRadius: '20px', padding: '0.3rem 1rem',
                                        fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'
                                    }}>
                                        {level.label} · {level.score}
                                    </span>
                                    {row.hazardType && (
                                        <span style={{
                                            background: hazardInfo.color + '18', color: hazardInfo.color,
                                            border: `1.5px solid ${hazardInfo.color}40`,
                                            borderRadius: '20px', padding: '0.3rem 0.9rem',
                                            fontWeight: 800, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem'
                                        }}>
                                            {hazardInfo.icon} {row.hazardType}
                                        </span>
                                    )}
                                </div>
                                <button onClick={() => removeRow(row.id)} style={{
                                    background: '#fee2e2', border: 'none', borderRadius: '8px',
                                    color: '#dc2626', cursor: 'pointer', padding: '0.4rem 0.6rem', display: 'flex'
                                }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Row Fields - Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Tarea / Proceso</label>
                                    <textarea value={row.task} onChange={e => updateRow(row.id, 'task', e.target.value)}
                                        placeholder="Describa la tarea o proceso..." style={textareaStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Tipo de Peligro</label>
                                    <select value={row.hazardType} onChange={e => updateRow(row.id, 'hazardType', e.target.value)} style={selectStyle}>
                                        {HAZARD_TYPES.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Peligro / Riesgo Identificado</label>
                                    <textarea value={row.hazard} onChange={e => updateRow(row.id, 'hazard', e.target.value)}
                                        placeholder="¿Qué puede causar daño?" style={textareaStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Efecto Probable</label>
                                    <textarea value={row.probableEffect} onChange={e => updateRow(row.id, 'probableEffect', e.target.value)}
                                        placeholder="Ej: Laceración, Hipoacusia..." style={textareaStyle} />
                                </div>
                            </div>

                            {/* Scoring Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 2fr', gap: '1rem', alignItems: 'start' }}>
                                <div>
                                    <label style={labelStyle}>Expuestos</label>
                                    <input type="number" value={row.exposedCount} min="0"
                                        onChange={e => updateRow(row.id, 'exposedCount', parseInt(e.target.value) || 0)}
                                        style={{ ...selectStyle, textAlign: 'center' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Probabilidad (P)</label>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {[1, 2, 3, 4].map(v => (
                                            <button key={v} onClick={() => updateRow(row.id, 'probability', v)} style={{
                                                flex: 1, padding: '0.5rem 0.2rem', borderRadius: '8px', border: '2px solid',
                                                borderColor: row.probability === v ? '#6366f1' : '#e2e8f0',
                                                background: row.probability === v ? '#6366f1' : '#f8fafc',
                                                color: row.probability === v ? 'white' : '#64748b',
                                                fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px'
                                            }}>
                                                <span style={{ fontSize: '1rem' }}>{v}</span>
                                                <span style={{ fontSize: '0.55rem', textAlign: 'center', lineHeight: 1 }}>{PROB_LABELS[v]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Severidad (S)</label>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {[1, 2, 3, 4].map(v => (
                                            <button key={v} onClick={() => updateRow(row.id, 'severity', v)} style={{
                                                flex: 1, padding: '0.5rem 0.2rem', borderRadius: '8px', border: '2px solid',
                                                borderColor: row.severity === v ? '#f59e0b' : '#e2e8f0',
                                                background: row.severity === v ? '#f59e0b' : '#f8fafc',
                                                color: row.severity === v ? 'white' : '#64748b',
                                                fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px'
                                            }}>
                                                <span style={{ fontSize: '1rem' }}>{v}</span>
                                                <span style={{ fontSize: '0.55rem', textAlign: 'center', lineHeight: 1 }}>{SEV_LABELS[v]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Medidas de Control</label>
                                    <textarea value={row.controls} onChange={e => updateRow(row.id, 'controls', e.target.value)}
                                        placeholder="EPP, capacitación, procedimientos..." style={textareaStyle} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── ADD ROW BUTTON ─── */}
            <button onClick={addRow} style={{
                width: '100%', padding: '1rem', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.6rem', borderRadius: '14px',
                border: '2px dashed #cbd5e1', background: '#f8fafc',
                color: '#64748b', fontWeight: 800, fontSize: '0.85rem',
                cursor: 'pointer', marginBottom: '2rem', transition: 'all 0.2s'
            }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.background = '#eef2ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#f8fafc'; }}
            >
                <Plus size={18} /> AGREGAR NUEVA EVALUACIÓN DE RIESGO
            </button>

            {/* ─── LEGEND ─── */}
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1.2rem', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Guía de Valoración (P × S)
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                        { range: '1 – 4', label: 'BAJO', desc: 'Riesgo tolerable', bg: '#dcfce7', color: '#16a34a' },
                        { range: '5 – 9', label: 'MODERADO', desc: 'Requiere control', bg: '#fef9c3', color: '#ca8a04' },
                        { range: '10 – 16', label: 'CRÍTICO', desc: 'Acción inmediata', bg: '#fee2e2', color: '#dc2626' },
                    ].map(l => (
                        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: '32px', height: '20px', background: l.bg, border: `1.5px solid ${l.color}40`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: l.color }}>{l.label[0]}</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}><strong style={{ color: l.color }}>{l.label}</strong> ({l.range}): {l.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Shared micro-styles ───
const labelStyle = {
    display: 'block', fontSize: '0.65rem', fontWeight: 900,
    color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem'
};
const textareaStyle = {
    width: '100%', minHeight: '72px', padding: '0.6rem 0.8rem', margin: 0,
    background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '0.82rem', resize: 'vertical', color: '#0f172a', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box'
};
const selectStyle = {
    width: '100%', padding: '0.6rem 0.8rem', margin: 0,
    background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '0.82rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box'
};
