import React, { useEffect } from 'react';
import { ShieldCheck, Calendar, MapPin, UserCheck, AlertTriangle } from 'lucide-react';

const getRiskLevel = (p, s) => {
    const val = p * s;
    if (val <= 4) return { label: 'BAJO', bg: '#dcfce7', color: '#16a34a' };
    if (val <= 9) return { label: 'MODERADO', bg: '#fef9c3', color: '#ca8a04' };
    return { label: 'CRÍTICO', bg: '#fee2e2', color: '#dc2626' };
};

export default function RiskMatrixPdfGenerator({ data, initialData }) {
    const finalData = data || initialData;
    if (!finalData) return null;

    // Obtener logo de empresa
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';

    // Debug: verificar si el logo existe
    useEffect(() => {
        if (companyLogo && showLogo) {
            console.log('[RiskMatrix] Logo cargado:', companyLogo.substring(0, 50) + '...');
        } else if (!companyLogo) {
            console.log('[RiskMatrix] No hay logo guardado - El usuario debe subirlo desde Perfil > Logo de Empresa');
        } else if (!showLogo) {
            console.log('[RiskMatrix] Logo desactivado por el usuario');
        }
    }, [companyLogo, showLogo]);

    const rows = finalData.rows || [];
    const { name, location, date, responsable, id, createdAt } = finalData;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area border-none shadow-none"
                style={{
                    width: '100%', maxWidth: '297mm', minHeight: '210mm', // Landscape oriented A4
                    padding: '15mm', background: '#ffffff', color: '#000000',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '9pt',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 landscape; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 5mm !important;
                            width: 100% !important;
                            max-width: none !important;
                            border: none !important;
                            border-radius: 0 !important;
                        }
                        img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    `}
                </style>

                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #1e293b', paddingBottom: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sistema de Gestión de Seguridad</p>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2rem', color: '#1e293b', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>MATRIZ DE RIESGOS</h1>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        {companyLogo && showLogo && (
                            <img
                                src={companyLogo}
                                alt="Logo de empresa"
                                style={{
                                    height: '45px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    maxWidth: '140px'
                                }}
                            />
                        )}
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1e293b' }}>MR-{id?.toString().slice(-6) || 'HYS'}</div>
                        </div>
                    </div>
                </div>

                {/* PROJECT INFO */}
                <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '2rem', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', borderBottom: '2px solid #e2e8f0' }}>
                        <div style={{ padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <ShieldCheck size={14} color="#3b82f6" /> PROYECTO / ACTIVIDAD
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{name || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem 1rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <MapPin size={14} color="#f59e0b" /> UBICACIÓN / ÁREA
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{location || '-'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', width: '100%' }}>
                        <div style={{ padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Calendar size={14} color="#10b981" /> FECHA DE EVALUACIÓN
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{date || createdAt ? new Date(date || createdAt).toLocaleDateString() : '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem 1rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <UserCheck size={14} color="#8b5cf6" /> PROFESIONAL / RESPONSABLE
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{responsable || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* MATRIX TABLE */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                        <AlertTriangle size={20} color="#f97316" fill="#fef08a" />
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase' }}>Análisis y Evaluación de Riesgos</h3>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', width: '25%' }}>Tarea / Actividad</th>
                                <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', width: '15%' }}>Peligro / Tipo</th>
                                <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', width: '20%' }}>Efecto Probable</th>
                                <th style={{ padding: '0.8rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', width: '5%' }}>Exp.</th>
                                <th style={{ padding: '0.8rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', width: '10%' }}>P x S = Nivel</th>
                                <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', width: '25%' }}>Controles Propuestos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontWeight: 600 }}>Sin datos evaluados.</td>
                                </tr>
                            ) : rows.map((row, idx) => {
                                const level = getRiskLevel(row.probability || 1, row.severity || 1);
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', pageBreakInside: 'avoid' }}>
                                        <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{row.task}</td>
                                        <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.75rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{row.hazardType}</div>
                                            <div style={{ marginTop: '0.1rem' }}>{row.hazard}</div>
                                        </td>
                                        <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.75rem', color: '#475569', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{row.probableEffect}</td>
                                        <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.8rem', textAlign: 'center', fontWeight: 800, color: '#3b82f6' }}>{row.exposedCount}</td>
                                        <td style={{ padding: '0.6rem 0.8rem' }}>
                                            <div style={{ background: level.bg, color: level.color, padding: '0.4rem 0.2rem', borderRadius: '6px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 900, lineHeight: 1, marginBottom: '2px' }}>{row.probability * row.severity}</span>
                                                <span style={{ fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.05em' }}>{level.label}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.75rem', color: '#166534', fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{row.controls}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* LEGEND SECTION */}
                <div style={{ display: 'flex', gap: '2rem', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem', pageBreakInside: 'avoid' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Interpretación del Nivel de Riesgo (P × S)</p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: '12px', height: '12px', background: '#dcfce7', border: '1px solid #16a34a', borderRadius: '3px' }}></div>
                                <span style={{ fontWeight: 700, color: '#334155' }}>1-4 BAJO (Tolerable)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: '12px', height: '12px', background: '#fef9c3', border: '1px solid #ca8a04', borderRadius: '3px' }}></div>
                                <span style={{ fontWeight: 700, color: '#334155' }}>5-9 MODERADO (Controlar)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: '12px', height: '12px', background: '#fee2e2', border: '1px solid #dc2626', borderRadius: '3px' }}></div>
                                <span style={{ fontWeight: 700, color: '#334155' }}>10-16 CRÍTICO (Acción Inm.)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '2rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', pageBreakInside: 'avoid' }}>
                    Documento de Prevención de Riesgos Laborales
                </div>
            </div>
        </div>
    );
}
