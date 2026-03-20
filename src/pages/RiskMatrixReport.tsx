import React from 'react';

import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import { ArrowLeft, Printer, Share2, TriangleAlert, X, Copy, Check, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import CompanyLogo from '../components/CompanyLogo';
import { usePaywall } from '../hooks/usePaywall';
import { toast } from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { getCountryNormativa } from '../data/legislationData';

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
export default function RiskMatrixReport(): React.ReactElement | null {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const [matrix, setMatrix] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);
    const [showShare, setShowShare] = useState(false);
    const [showSignatures, setShowSignatures] = useState({ operator: true, supervisor: true, professional: true });

    const savedData = localStorage.getItem('personalData');
    const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
    const countryNorms = getCountryNormativa(userCountry);

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

    const handlePrint = () => requirePro(() => window.print());

    return (
        <div className="container" style={{ maxWidth: '1100px' }}>
            <ShareModal
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Matriz de Riesgos – ${matrix.name}`}
                text={`📋 Matriz de Riesgos\n🏗️ Proyecto: ${matrix.name}\n📍 Ubicación: ${matrix.location || '-'}\n📅 Fecha: ${matrix.date}\n👷 Responsable: ${profile?.name || matrix.responsable}\n\n✅ Riesgos evaluados: ${matrix.rows?.length || 0}\n\nGenerado con Asistente H&S`}
                elementIdToPrint="pdf-content"
            />

            {/* ─── Action Bar (no-print) ─── */}
            <div className="no-print" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '2rem', background: 'transparent'
            }}>
                <button onClick={() => navigate('/history')} style={{
                    background: 'transparent', border: 'none', display: 'flex', alignItems: 'center',
                    gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text)', fontWeight: 700
                }}>
                    <ArrowLeft size={18} /> Volver
                </button>
            </div>

            {/* ─── Printable Report ─── */}
            <div id="pdf-content" className="print-area print:mb-0 print:border-none print:shadow-none" style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>

                {/* Report Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', borderBottom: '4px solid #6366f1', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control H&S</p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1.2 }}>
                            Matriz de Valoración de Riesgos
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>ISO 31000 / Estándar HyS</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
                         <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#64748b' }}>
                             <div style={{ fontWeight: 800, color: '#1e293b' }}>ID #{matrix.id?.toString().slice(-6)}</div>
                             <div>{new Date(matrix.date).toLocaleDateString('es-AR')}</div>
                         </div>
                        <CompanyLogo style={{ height: '40px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PROYECTO:</span> <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{matrix.name}</span></div>
                        <div><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>UBICACIÓN:</span> <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{matrix.location || '-'}</span></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <div><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>RESPONSABLE:</span> <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{profile?.name || matrix.responsable}</span></div>
                         <div><span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>NORMATIVA:</span> <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{countryNorms.general}</span></div>
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
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{row.task}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{row.hazardType}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{row.hazard}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{row.probableEffect}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center' }}>{row.exposedCount}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center', fontWeight: 800 }}>{row.probability}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center', fontWeight: 800 }}>{row.severity}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center', fontWeight: 900, color: lv.color, background: lv.bg }}>{row.probability * row.severity}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.4rem', textAlign: 'center' }}>
                                            <span style={{ background: lv.bg, color: lv.color, border: `1px solid ${lv.color}40`, borderRadius: '12px', padding: '0.25rem 0.6rem', fontWeight: 900, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{lv.label}</span>
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{row.controls}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ─── Signature Controls (no-print) ─── */}
                <div className="no-print mt-10 mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center text-xs font-bold text-slate-700">
                    <div className="text-center">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-4 flex-wrap justify-center">
                        {['operator', 'supervisor', 'professional'].map(key => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={showSignatures[key]} onChange={e => setShowSignatures(s => ({ ...s, [key]: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
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
                <PdfBrandingFooter />
            </div>
            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button onClick={() => toast.success('Este reporte ya se encuentra guardado en tu historial.')} className="btn-floating-action" style={{ background: '#36B37E', color: 'white' }}>
                    <CheckCircle2 size={18} /> GUARDADO
                </button>
                <button onClick={() => requirePro(() => setShowShare(true))} className="btn-floating-action" style={{ background: '#0052CC', color: 'white' }}>
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button onClick={handlePrint} className="btn-floating-action" style={{ background: '#FF8B00', color: 'white' }}>
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>
        </div>
    );
}
