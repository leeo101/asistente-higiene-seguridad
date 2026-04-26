import React from 'react';
import { ArrowLeft, Printer, MapPin, Calendar, Clock, TriangleAlert, User, FileText, Building2, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function AccidentPdfGenerator({ report, onBack, isHeadless = false }: { report: any, onBack?: any, isHeadless?: boolean }): React.ReactElement | null {

    const getSeverityStyle = (sev: any) => {
        if (sev === 'Leve') return { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', borderTop: '#3b82f6', label: 'LEVE — Sin Baja' };
        if (sev === 'Moderado') return { color: '#b45309', bg: '#fffbeb', border: '#fde68a', borderTop: '#f59e0b', label: 'MODERADO — Con Baja' };
        if (sev === 'Grave') return { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', borderTop: '#f97316', label: 'GRAVE — Internación' };
        if (sev === 'Mortal') return { color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', borderTop: '#dc2626', label: 'MORTAL' };
        return { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', borderTop: '#64748b', label: sev };
    };

    const sev = getSeverityStyle(report?.gravedad);

    // Obtener firma profesional desde localStorage
    let actSignature: string | null = null;
    let actName: string | null = null;
    let actLic: string | null = null;
    try {
        const lsStamp = localStorage.getItem('signatureStampData');
        const legacySig = localStorage.getItem('capturedSignature');
        const lsPersonal = localStorage.getItem('personalData');
        if (lsStamp) actSignature = JSON.parse(lsStamp).signature;
        else if (legacySig) actSignature = legacySig;
        if (lsPersonal) {
            const pd = JSON.parse(lsPersonal);
            actName = pd.name;
            actLic = pd.license;
        }
    } catch (e) { }

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {!isHeadless && (
                <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={onBack} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Informe de Investigación</h1>
                    </div>
                    <button onClick={() => window.print()} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Printer size={18} /> Imprimir / PDF
                    </button>
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div
                    id="pdf-content"
                    className="pdf-container print-area"
                    style={{
                        width: '100%', maxWidth: '210mm', minHeight: '297mm',
                        padding: '12mm 15mm', background: '#ffffff', color: '#1e293b',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                        boxSizing: 'border-box', fontSize: '9pt',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        borderTop: `12px solid ${sev.borderTop}`
                    }}
                >
                    <style type="text/css" media="print">
                        {`
                            @page { size: A4 portrait; margin: 10mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                            .no-print { display: none !important; }
                            .print-area {
                                box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                                width: 100% !important; max-width: none !important;
                                border-top: 12px solid ${sev.borderTop} !important;
                                border-radius: 0 !important; min-height: auto !important;
                            }
                        `}
                    </style>

                    {/* Header Tripartito HSE */}
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.5rem', width: '100%' }}>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: sev.color }}>
                                ⚠ {sev.label}
                            </p>
                        </div>

                        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.7rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>INVESTIGACIÓN</h1>
                            <h2 style={{ margin: '0.1rem 0 0', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', lineHeight: 1, color: '#334155' }}>DE ACCIDENTE LABORAL</h2>
                            <div style={{ marginTop: '0.4rem', background: sev.borderTop, color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em' }}>
                                RES. SRT 7/2026 — DEC. 549/2025 — ÁRBOL DE CAUSAS
                            </div>
                        </div>

                        <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <CompanyLogo style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }} />
                            <div style={{ background: sev.bg, border: `1px solid ${sev.border}`, borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textAlign: 'center' }}>
                                <div style={{ color: '#475569' }}>Ref: INV-{report?.id?.toString().slice(-6) || '000000'}</div>
                                <div style={{ color: '#94a3b8' }}>Generado: {new Date().toLocaleDateString('es-AR')}</div>
                            </div>
                        </div>
                    </div>

                    {/* 1 - Datos del Siniestro */}
                    <div style={{ border: `1.5px solid ${sev.border}`, borderRadius: '6px', marginBottom: '1.2rem', overflow: 'hidden' }}>
                        <div style={{ background: '#1e293b', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TriangleAlert size={14} color={sev.borderTop} />
                            <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>1 — DATOS DEL SINIESTRO</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Building2 size={11}/> EMPRESA / RAZÓN SOCIAL</span>
                                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', marginTop: '0.2rem' }}>{report?.empresa || '-'}</div>
                            </div>
                            <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={11}/> FECHA</span>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{report?.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}</div>
                            </div>
                            <div style={{ padding: '0.7rem 1rem' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={11}/> HORA</span>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{report?.hora || 'N/E'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#ffffff' }}>
                            <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={11}/> UBICACIÓN / SECTOR</span>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{report?.ubicacion || '-'}</div>
                            </div>
                            <div style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <span style={{ padding: '0.4rem 1rem', background: sev.bg, border: `1.5px solid ${sev.border}`, borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', color: sev.color }}>{sev.label}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2 - Datos del Accidentado */}
                    <div style={{ border: '1px solid #fca5a5', borderRadius: '6px', marginBottom: '1.2rem', overflow: 'hidden' }}>
                        <div style={{ background: '#1e293b', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={14} color="#fca5a5" />
                            <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>2 — DATOS DEL ACCIDENTADO</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>NOMBRE Y APELLIDO</span>
                                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', marginTop: '0.2rem' }}>{report?.victimaNombre || '-'}</div>
                            </div>
                            <div style={{ padding: '0.7rem 1rem' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>DNI / CUIL</span>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{report?.victimaDni || '-'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>PUESTO DE TRABAJO</span>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{report?.victimaPuesto || '-'}</div>
                            </div>
                            <div style={{ padding: '0.7rem 1rem' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>ANTIGÜEDAD EN PUESTO</span>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{report?.victimaAntiguedad || '-'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fef2f2', padding: '0.7rem 1rem', gap: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>TIPO DE LESIÓN</span>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#991b1b', marginTop: '0.2rem' }}>{report?.lesion || 'No especificada'}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>PARTE DEL CUERPO AFECTADA</span>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#991b1b', marginTop: '0.2rem' }}>{report?.parteCuerpo || 'No especificada'}</div>
                            </div>
                        </div>
                    </div>

                    {/* 3 - Descripción del Hecho */}
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.2rem', overflow: 'hidden' }}>
                        <div style={{ background: '#1e293b', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={14} color="#fff" />
                            <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>3 — DESCRIPCIÓN DEL HECHO</span>
                        </div>
                        <div style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', lineHeight: 1.6, color: '#334155', fontWeight: 600, background: '#f8fafc', whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                            {report?.descripcionHecho || 'Sin descripción detallada.'}
                        </div>

                        {report?.testigos?.some(t => t.nombre) && (
                            <div style={{ borderTop: '1px solid #e2e8f0', padding: '0.9rem 1rem', background: '#fff' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>TESTIGOS INTERVINIENTES</div>
                                {report.testigos.filter(t => t.nombre).map((t, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.4rem', alignItems: 'flex-start', padding: '0.4rem 0.6rem', background: '#f8fafc', borderRadius: '4px', borderLeft: '3px solid #94a3b8' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: '#1e293b', minWidth: '120px' }}>{t.nombre}:</span>
                                        <span style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>"{t.declaracion}"</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4 - Análisis Causal 5 Porqués */}
                    <div style={{ border: '1px solid #ddd6fe', borderRadius: '6px', marginBottom: '1.2rem', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                        <div style={{ background: '#1e293b', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Search size={14} color="#c4b5fd" />
                            <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>4 — ANÁLISIS CAUSAL — MÉTODO "5 PORQUÉS"</span>
                        </div>

                        <div style={{ padding: '0.8rem 1rem', background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase' }}>PROBLEMA / EFECTO FINAL</span>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#4c1d95', marginTop: '0.2rem' }}>{report?.problemaCentral || 'No definido'}</div>
                        </div>

                        <div style={{ padding: '0.8rem 1rem', background: '#ffffff' }}>
                            {report?.porques?.filter(p => p).map((pq, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem', paddingLeft: `${idx * 12}px` }}>
                                    <div style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: idx === (report.porques.filter(p => p).length - 1) ? '#7c3aed' : '#e2e8f0', border: '2px solid ' + (idx === (report.porques.filter(p => p).length - 1) ? '#7c3aed' : '#cbd5e1'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.65rem', color: idx === (report.porques.filter(p => p).length - 1) ? '#fff' : '#64748b', flexShrink: 0 }}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>¿Por qué? (Nivel {idx + 1})</span>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>{pq}</div>
                                    </div>
                                </div>
                            ))}

                            {report?.porques?.filter(p => p).length > 0 && (
                                <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.8rem', background: '#f5f3ff', border: '1.5px dashed #8b5cf6', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase' }}>✓ CAUSA RAÍZ IDENTIFICADA</span>
                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#4c1d95', marginTop: '0.2rem' }}>
                                        {[...report.porques].filter(p => p).reverse()[0]}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5 - Plan de Acción */}
                    <div style={{ border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                        <div style={{ background: '#1e293b', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={14} color="#86efac" />
                            <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>5 — PLAN DE ACCIÓN CORRECTIVA / PREVENTIVA</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                            <thead>
                                <tr style={{ background: '#f0fdf4' }}>
                                    <th style={{ padding: '0.5rem 0.8rem', textAlign: 'left', fontWeight: 800, color: '#166534', width: '50%', border: '1px solid #bbf7d0', fontSize: '0.65rem', textTransform: 'uppercase' }}>Acción a Implementar</th>
                                    <th style={{ padding: '0.5rem 0.8rem', textAlign: 'left', fontWeight: 800, color: '#166534', width: '25%', border: '1px solid #bbf7d0', fontSize: '0.65rem', textTransform: 'uppercase' }}>Responsable</th>
                                    <th style={{ padding: '0.5rem 0.8rem', textAlign: 'center', fontWeight: 800, color: '#166534', width: '25%', border: '1px solid #bbf7d0', fontSize: '0.65rem', textTransform: 'uppercase' }}>Fecha Límite</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report?.medidas?.filter(m => m.accion).length > 0 ? (
                                    report.medidas.filter(m => m.accion).map((m, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f0fdf4', pageBreakInside: 'avoid' }}>
                                            <td style={{ padding: '0.5rem 0.8rem', border: '1px solid #dcfce7', fontWeight: 600, color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.accion}</td>
                                            <td style={{ padding: '0.5rem 0.8rem', border: '1px solid #dcfce7', color: '#475569', fontWeight: 600 }}>{m.responsable || '-'}</td>
                                            <td style={{ padding: '0.5rem 0.8rem', border: '1px solid #dcfce7', color: '#475569', textAlign: 'center' }}>
                                                {m.fechaLimite ? new Date(m.fechaLimite + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', border: '1px solid #dcfce7' }}>No se definieron medidas correctivas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Firmas */}
                    <div style={{ paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid', display: 'flex', gap: '1rem', paddingBottom: '1rem', justifyContent: 'center' }}>
                        <div style={{ flex: '0 1 32%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Firma original</span>
                            </div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>ACCIDENTADO / TESTIGO</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Declaración y firma</p>
                        </div>

                        <div style={{ flex: '0 1 32%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Firma original</span>
                            </div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>SUPERVISOR / EMPLEADOR</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Validación del informe</p>
                        </div>

                        <div style={{ flex: '0 1 32%', border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #86efac', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                {actSignature ? (
                                    <img src={actSignature} alt="Firma Profesional" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: '0.6rem', color: '#86efac' }}>Sello y Firma Digital</span>
                                )}
                            </div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#166534' }}>PROFESIONAL ACTUANTE H&S</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#15803d', fontWeight: 600 }}>{actName || 'Especialista H&S'}</p>
                            {actLic && <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#16a34a' }}>Mat: {actLic}</p>}
                        </div>
                    </div>

                    <PdfBrandingFooter />
                </div>
            </div>
        </div>
    );
}
