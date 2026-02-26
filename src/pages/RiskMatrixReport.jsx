import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, AlertTriangle, X, Copy, Check, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ─── Share Modal ─────────────────────────────────────────────────────
function ShareModal({ open, onClose, matrix }) {
    const [copied, setCopied] = useState(false);
    if (!open || !matrix) return null;

    const text = `📋 Matriz de Riesgos\n🏗️ Proyecto: ${matrix.name}\n📍 Ubicación: ${matrix.location || '-'}\n📅 Fecha: ${matrix.date}\n👷 Responsable: ${matrix.responsable}\n\n✅ Riesgos evaluados: ${matrix.rows?.length || 0}\n\nGenerado con Asistente H&S`;
    const encoded = encodeURIComponent(text);
    const subject = encodeURIComponent(`Matriz de Riesgos – ${matrix.name}`);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const options = [
        {
            label: 'WhatsApp', color: '#25D366', bg: '#dcfce7',
            icon: '📱',
            url: `https://wa.me/?text=${encoded}`
        },
        {
            label: 'Telegram', color: '#229ED9', bg: '#e0f2fe',
            icon: '✈️',
            url: `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encoded}`
        },
        {
            label: 'Twitter / X', color: '#000', bg: '#f1f5f9',
            icon: '𝕏',
            url: `https://twitter.com/intent/tweet?text=${encoded}`
        },
        {
            label: 'Email', color: '#6366f1', bg: '#eef2ff',
            icon: '📧',
            url: `mailto:?subject=${subject}&body=${encoded}`
        },
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div style={{
                background: '#fff', borderRadius: '24px', padding: '2rem',
                maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: '#f1f5f9', border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}><X size={16} /></button>

                <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem', fontWeight: 900 }}>Compartir Reporte</h2>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>{matrix.name}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
                    {options.map(opt => (
                        <a key={opt.label} href={opt.url} target="_blank" rel="noreferrer" style={{
                            display: 'flex', alignItems: 'center', gap: '0.7rem',
                            padding: '0.9rem 1rem', background: opt.bg,
                            borderRadius: '14px', border: `1.5px solid ${opt.color}30`,
                            textDecoration: 'none', color: opt.color,
                            fontWeight: 800, fontSize: '0.85rem',
                            transition: 'transform 0.15s'
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span> {opt.label}
                        </a>
                    ))}
                </div>

                <button onClick={handleCopy} style={{
                    width: '100%', padding: '0.9rem',
                    background: copied ? '#dcfce7' : '#f8fafc',
                    border: `1.5px solid ${copied ? '#86efac' : '#e2e8f0'}`,
                    borderRadius: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.6rem', fontWeight: 800, fontSize: '0.85rem',
                    color: copied ? '#16a34a' : '#475569', transition: 'all 0.2s'
                }}>
                    {copied ? <><Check size={16} /> ¡Copiado al portapapeles!</> : <><Copy size={16} /> Copiar texto del reporte</>}
                </button>
            </div>
        </div>
    );
}

// ─── Visual Risk Grid (Probability × Impact) ───────────────────────
// Rows: Probability (top = high), Columns: Impact (left = low)
// Colors based on ISO 31000 / standard HyS matrix
const MATRIX_GRID = [
    // probability label, [impact colors for: Menor, Crítico, Mayor, Catastrófico]
    { prob: 'Insignif.\nConstante', cells: ['#fef08a', '#fca5a5', '#ef4444', '#dc2626'] },
    { prob: 'Moderado', cells: ['#fef08a', '#fca5a5', '#ef4444', '#dc2626'] },
    { prob: 'Ocasional', cells: ['#86efac', '#fef08a', '#fca5a5', '#ef4444'] },
    { prob: 'Posible', cells: ['#86efac', '#86efac', '#fef08a', '#fca5a5'] },
    { prob: 'Improbable', cells: ['#4ade80', '#86efac', '#86efac', '#fef08a'] },
];
const IMPACT_LABELS = ['Menor', 'Crítica', 'Mayor', 'Catastrófico'];

function RiskMatrixGrid() {
    return (
        <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1rem 0' }}>
                Tabla de Valoración de Riesgos (Probabilidad × Impacto)
            </h3>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                {/* Y-axis label */}
                <div style={{
                    writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                    fontSize: '0.7rem', fontWeight: 800, color: '#64748b',
                    textAlign: 'center', paddingRight: '0.5rem', letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                }}>
                    Probabilidad ↑
                </div>

                <div style={{ flex: 1 }}>
                    {/* Impact headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(4, 1fr)', marginBottom: '2px' }}>
                        <div />
                        {IMPACT_LABELS.map(l => (
                            <div key={l} style={{
                                textAlign: 'center', fontSize: '0.65rem', fontWeight: 800,
                                color: '#64748b', textTransform: 'uppercase', padding: '0.3rem 0.2rem'
                            }}>{l}</div>
                        ))}
                    </div>

                    {/* Matrix rows */}
                    {MATRIX_GRID.map((row, ri) => (
                        <div key={ri} style={{ display: 'grid', gridTemplateColumns: '100px repeat(4, 1fr)', gap: '2px', marginBottom: '2px' }}>
                            <div style={{
                                background: '#f1f5f9', borderRadius: '6px 0 0 6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.4rem', fontSize: '0.6rem', fontWeight: 800,
                                color: '#475569', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2
                            }}>
                                {row.prob}
                            </div>
                            {row.cells.map((color, ci) => (
                                <div key={ci} style={{
                                    background: color, borderRadius: ri === 0 && ci === 3 ? '0 6px 0 0' : ri === MATRIX_GRID.length - 1 && ci === 3 ? '0 0 6px 0' : '0',
                                    height: '36px'
                                }} />
                            ))}
                        </div>
                    ))}

                    {/* X-axis label */}
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>
                        Impacto →
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                {[
                    { color: '#4ade80', label: 'Bajo – Riesgo tolerable' },
                    { color: '#86efac', label: 'Bajo-Moderado' },
                    { color: '#fef08a', label: 'Moderado – Requiere control' },
                    { color: '#fca5a5', label: 'Alto' },
                    { color: '#ef4444', label: 'Crítico – Acción inmediata' },
                    { color: '#dc2626', label: 'Muy Crítico' },
                ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '14px', height: '14px', background: l.color, borderRadius: '3px', border: '1px solid rgba(0,0,0,0.1)' }} />
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Report ────────────────────────────────────────────────────
export default function RiskMatrixReport() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [matrix, setMatrix] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);
    const [showShare, setShowShare] = useState(false);
    const [showSignatures, setShowSignatures] = useState({ operator: true, supervisor: true, professional: true });

    useEffect(() => {
        const current = localStorage.getItem('current_risk_matrix');
        const prof = localStorage.getItem('personalData');
        const sig = localStorage.getItem('signatureStampData');
        if (current) setMatrix(JSON.parse(current));
        if (prof) setProfile(JSON.parse(prof));
        if (sig) setSignature(JSON.parse(sig));
    }, []);

    if (!matrix) return <div className="container">Cargando...</div>;

    const getRiskLevel = (p, s) => {
        const v = p * s;
        if (v <= 4) return { label: 'BAJO', color: '#16a34a', bg: '#dcfce7' };
        if (v <= 9) return { label: 'MODERADO', color: '#ca8a04', bg: '#fef9c3' };
        return { label: 'CRÍTICO', color: '#dc2626', bg: '#fee2e2' };
    };

    const handlePrint = () => {
        if (!currentUser) { navigate('/login'); return; }
        const status = localStorage.getItem('subscriptionStatus');
        if (status !== 'active') { navigate('/subscribe'); return; }
        window.print();
    };

    return (
        <div className="container" style={{ maxWidth: '1100px' }}>
            <ShareModal open={showShare} onClose={() => setShowShare(false)} matrix={matrix} />

            {/* ─── Action Bar (no-print) ─── */}
            <div className="no-print" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '2rem', background: '#fff', borderRadius: '16px',
                padding: '1.2rem 1.5rem', border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
            }}>
                <button onClick={() => navigate('/history')} style={{
                    background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center',
                    gap: '0.5rem', cursor: 'pointer', color: '#475569', fontWeight: 700,
                    fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: '10px'
                }}>
                    <ArrowLeft size={18} /> Volver
                </button>

                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <button onClick={() => setShowShare(true)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                        color: 'white', border: 'none', borderRadius: '50px',
                        fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.35)'
                    }}>
                        <Share2 size={16} /> COMPARTIR
                    </button>
                    <button onClick={handlePrint} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg,#FF8B00,#FF5630)',
                        color: 'white', border: 'none', borderRadius: '50px',
                        fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(255,86,48,0.35)'
                    }}>
                        <Printer size={16} /> IMPRIMIR PDF
                    </button>
                </div>
            </div>

            {/* ─── Printable Report ─── */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>

                {/* Report Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #6366f1', paddingBottom: '1.5rem', marginBottom: '2rem', gap: '1rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.3rem 0', fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <AlertTriangle size={28} color="#f59e0b" /> Evaluación de Riesgos
                        </h1>
                        <p style={{ margin: '0 0 0.2rem 0', fontWeight: 700, color: '#334155', fontSize: '1rem' }}>{matrix.name}</p>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>{matrix.location}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ley 19.587 / Dec. 351/79</p>
                        <p style={{ margin: '0 0 0.2rem 0', fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>ID #{matrix.id?.toString().slice(-6)}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Fecha: {new Date(matrix.date).toLocaleDateString('es-AR')}</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Responsable: <strong>{profile?.name || matrix.responsable}</strong></p>
                    </div>
                </div>

                {/* ─── Visual Risk Grid ─── */}
                <RiskMatrixGrid />

                {/* ─── Data Table ─── */}
                <div style={{ overflowX: 'auto', marginBottom: '2.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['#', 'Tarea / Proceso', 'Tipo', 'Peligro / Riesgo', 'Efecto Probable', 'Exp.', 'P', 'S', 'P×S', 'Nivel', 'Medidas de Control'].map(h => (
                                    <th key={h} style={{ border: '1px solid #e2e8f0', padding: '0.6rem 0.8rem', textAlign: h === '#' || h === 'P' || h === 'S' || h === 'P×S' || h === 'Exp.' ? 'center' : 'left', fontWeight: 800, color: '#475569', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.rows.map((row, i) => {
                                const lv = getRiskLevel(row.probability, row.severity);
                                return (
                                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center', fontWeight: 800, color: '#94a3b8' }}>{i + 1}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem' }}>{row.task}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem' }}>{row.hazardType}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem' }}>{row.hazard}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem' }}>{row.probableEffect}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center' }}>{row.exposedCount}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center', fontWeight: 800 }}>{row.probability}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center', fontWeight: 800 }}>{row.severity}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center', fontWeight: 900, color: lv.color, background: lv.bg }}>{row.probability * row.severity}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.4rem', textAlign: 'center' }}>
                                            <span style={{ background: lv.bg, color: lv.color, border: `1px solid ${lv.color}40`, borderRadius: '12px', padding: '0.25rem 0.6rem', fontWeight: 900, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{lv.label}</span>
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem' }}>{row.controls}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ─── Signature Controls (no-print) ─── */}
                <div className="no-print" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incluir firmas:</span>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        {['operator', 'supervisor', 'professional'].map(key => (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                                <input type="checkbox" checked={showSignatures[key]} onChange={e => setShowSignatures(s => ({ ...s, [key]: e.target.checked }))} style={{ accentColor: '#6366f1', width: '16px', height: '16px' }} />
                                {key === 'operator' ? 'Operador' : key === 'supervisor' ? 'Supervisor' : 'Profesional'}
                            </label>
                        ))}
                    </div>
                </div>

                {/* ─── Signatures ─── */}
                <div className="signature-container-row">
                    {showSignatures.operator && (
                        <div className="signature-item-box">
                            <div className="signature-line" />
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>OPERADOR</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>Aclaración y Firma</p>
                        </div>
                    )}
                    {showSignatures.supervisor && (
                        <div className="signature-item-box">
                            <div className="signature-line" />
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>SUPERVISOR</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>Aclaración y Firma</p>
                        </div>
                    )}
                    {showSignatures.professional && (
                        <div className="signature-item-box">
                            {signature?.signature && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                    <img src={signature.signature} alt="Firma" style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }} />
                                </div>
                            )}
                            <div className="signature-line" />
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>PROFESIONAL ACTUANTE</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{profile?.name}</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Mat: {profile?.license}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
