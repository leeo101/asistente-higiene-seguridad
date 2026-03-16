import React, { useRef } from 'react';
import { ArrowLeft, Printer, Download, MapPin, Calendar, Clock, TriangleAlert, User, FileText, CheckCircle2 } from 'lucide-react';

export default function AccidentPdfGenerator({ report, onBack }) {
    // Obtener logo de empresa
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';
    const componentRef = useRef();

    const safeNombre = (report?.victimaNombre || 'Sin_Nombre').replace(/\s+/g, '_');
    const safeFecha = report?.fecha || new Date().toISOString().split('T')[0];

    const handlePrint = () => {
        window.print();
    };

    const getSeverityLabel = (sev) => {
        if (sev === 'Leve') return { color: '#3b82f6', text: 'Leve (Sin baja)' };
        if (sev === 'Moderado') return { color: '#fbbf24', text: 'Moderado (Con baja)' };
        if (sev === 'Grave') return { color: '#f97316', text: 'Grave' };
        if (sev === 'Mortal') return { color: '#dc2626', text: 'Mortal' };
        return { color: '#64748b', text: sev };
    };

    const sev = getSeverityLabel(report.gravedad);

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header controls (not printed) */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Generar Informe</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={handlePrint} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Printer size={18} /> Imprimir / PDF
                    </button>
                </div>
            </div>

            {/* Printable Document Area */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                {/* A4 Paper simulation container */}
                <div
                    id="pdf-content"
                    className="pdf-container card print-area"
                    ref={componentRef}
                    style={{
                        width: '100%', maxWidth: '210mm', minHeight: '297mm',
                        padding: '20mm', background: '#ffffff', color: '#000000',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* CSS for print mode */}
                    <style type="text/css" media="print">
                        {`
                            @page { size: A4 portrait; margin: 15mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            .no-print { display: none !important; }
                            .print-area { 
                                box-shadow: none !important; 
                                margin: 0 !important; 
                                padding: 10mm !important; 
                                width: 100% !important; 
                                max-width: none !important; 
                                border: 1px solid #1e293b !important;
                                border-radius: 0 !important; 
                            }
                        `}
                    </style>

                    {/* Document Header */}
                    <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '24pt', color: '#1e293b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                                Investigación de Accidente
                            </h1>
                            <div style={{ display: 'flex', gap: '1.5rem', color: '#475569', fontSize: '10pt' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FileText size={14} /> Ref: INV-{report?.id?.toString().slice(-6) || '000000'}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> Generado: {new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                        {/* Right side box (Severity) */}
                        <div style={{ background: `${sev.color}15`, border: `2px solid ${sev.color}`, padding: '0.6rem 1.2rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Gravedad</div>
                            <div style={{ color: sev.color, fontWeight: 800, fontSize: '12pt' }}>{sev.text}</div>
                        </div>
                    </div>

                    {/* Section 1: Datos Generales */}
                    <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                        <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', fontWeight: 800, color: '#1e293b', fontSize: '11pt', borderLeft: '4px solid #3b82f6', marginBottom: '0.8rem' }}>
                            1. DATOS DEL SINIESTRO
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '10pt' }}>
                            <div><strong style={{ color: '#64748b' }}>Empresa / Razón Social:</strong> {report?.empresa || 'N/A'}</div>
                            <div><strong style={{ color: '#64748b' }}>Ubicación / Sector:</strong> {report?.ubicacion || 'N/A'}</div>
                            <div><strong style={{ color: '#64748b' }}>Fecha del Accidente:</strong> {report?.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString() : 'N/A'}</div>
                            <div><strong style={{ color: '#64748b' }}>Hora Estimada:</strong> {report?.hora || 'No especificada'}</div>
                        </div>
                    </div>

                    {/* Section 2: Datos del Accidentado */}
                    <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                        <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', fontWeight: 800, color: '#1e293b', fontSize: '11pt', borderLeft: '4px solid #3b82f6', marginBottom: '0.8rem' }}>
                            2. DATOS DEL ACCIDENTADO
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '10pt', marginBottom: '0.8rem' }}>
                            <div><strong style={{ color: '#64748b' }}>Nombre y Apellido:</strong> {report?.victimaNombre || 'N/A'}</div>
                            <div><strong style={{ color: '#64748b' }}>DNI / CUIL:</strong> {report?.victimaDni || 'N/A'}</div>
                            <div><strong style={{ color: '#64748b' }}>Puesto de Trabajo:</strong> {report?.victimaPuesto || 'N/A'}</div>
                            <div><strong style={{ color: '#64748b' }}>Antigüedad:</strong> {report?.victimaAntiguedad || 'N/A'}</div>
                        </div>
                        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.8rem', borderRadius: '6px', fontSize: '10pt' }}>
                            <div style={{ marginBottom: '0.3rem' }}><strong style={{ color: '#e11d48' }}>Tipo de Lesión:</strong> {report?.lesion || 'No especificada'}</div>
                            <div><strong style={{ color: '#e11d48' }}>Parte del Cuerpo Afectada:</strong> {report?.parteCuerpo || 'No especificada'}</div>
                        </div>
                    </div>

                    {/* Section 3: Descripción y Testigos */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', fontWeight: 800, color: '#1e293b', fontSize: '11pt', borderLeft: '4px solid #3b82f6', marginBottom: '0.8rem' }}>
                            3. DESCRIPCIÓN DEL HECHO
                        </div>
                        <p style={{ fontSize: '10pt', lineHeight: 1.6, color: '#334155', margin: '0 0 1rem 0', whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                            {report?.descripcionHecho || 'Sin descripción detallada.'}
                        </p>

                        {report.testigos && report.testigos.length > 0 && report.testigos.some(t => t.nombre) && (
                            <div style={{ marginTop: '1rem' }}>
                                <strong style={{ fontSize: '10pt', color: '#1e293b' }}>Testigos Intervinientes:</strong>
                                <ul style={{ fontSize: '9.5pt', color: '#475569', paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                                    {report?.testigos?.filter(t => t.nombre).map((t, idx) => (
                                        <li key={idx} style={{ marginBottom: '0.4rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            <strong>{t.nombre}:</strong> "{t.declaracion}"
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Section 4: Análisis Causal (5 Porqués) */}
                    <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                        <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', fontWeight: 800, color: '#1e293b', fontSize: '11pt', borderLeft: '4px solid #8b5cf6', marginBottom: '0.8rem' }}>
                            4. ANÁLISIS CUALITATIVO (MÉTODO "5 PORQUÉS")
                        </div>
                        <div style={{ fontSize: '10pt', marginBottom: '0.5rem' }}>
                            <strong style={{ color: '#dc2626' }}>Problema / Efecto:</strong> {report.problemaCentral || 'No definido'}
                        </div>
                        <div style={{ marginLeft: '1rem', borderLeft: '2px solid #cbd5e1', paddingLeft: '1rem' }}>
                            {report?.porques && report.porques.map((pq, idx) => {
                                if (!pq) return null;
                                return (
                                    <div key={idx} style={{ fontSize: '9.5pt', marginBottom: '0.5rem', color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                        <strong style={{ color: '#64748b' }}>Por qué {idx + 1}:</strong> {pq}
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: '0.8rem', padding: '0.6rem', background: '#f8fafc', border: '1px dashed #94a3b8', fontSize: '9.5pt', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            <strong style={{ color: '#1e293b' }}>Causa Raíz Identificada:</strong> {report.porques?.filter(p => p).reverse()[0] || 'No determinada'}
                        </div>
                    </div>

                    {/* Section 5: Plan de Acción */}
                    <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                        <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', fontWeight: 800, color: '#1e293b', fontSize: '11pt', borderLeft: '4px solid #10b981', marginBottom: '0.8rem' }}>
                            5. MEDIDAS PREVENTIVAS / CORRECTIVAS
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                                    <th style={{ padding: '0.5rem', textAlign: 'left', width: '50%' }}>Acción a Implementar</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'left', width: '25%' }}>Responsable</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'left', width: '25%' }}>Fecha Límite</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report?.medidas && report.medidas.length > 0 && report.medidas.some(m => m.accion) ? (
                                    report.medidas.filter(m => m.accion).map((m, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', pageBreakInside: 'avoid' }}>
                                            <td style={{ padding: '0.6rem 0.5rem', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{m.accion}</td>
                                            <td style={{ padding: '0.6rem 0.5rem', color: '#475569', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{m.responsable || '-'}</td>
                                            <td style={{ padding: '0.6rem 0.5rem', color: '#475569' }}>
                                                {m.fechaLimite ? new Date(m.fechaLimite + 'T12:00:00Z').toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No se definieron medidas correctivas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Signatures Area */}
                    <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'space-around', gap: '2rem', pageBreakInside: 'avoid' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px dashed #94a3b8', height: '40px', marginBottom: '0.5rem' }}></div>
                            <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700 }}>Firma Accidentado / Testigo</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px dashed #94a3b8', height: '40px', marginBottom: '0.5rem' }}></div>
                            <div style={{ fontSize: '9pt', color: '#64748b', fontWeight: 700 }}>Responsable Higiene y Seguridad</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
