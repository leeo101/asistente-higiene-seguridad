import React from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, User, Calendar, MapPin, ShieldCheck, Flag } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function AuditPdf({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    // Obtención segura de firma desde personalData o del dato en sí
    let actSignature = data.signature || null;
    let actName = data.professionalName || data.leadAuditor || null;
    let actLic = data.license || null;
    
    // Si no trae firmas directas, intentar heredar de localStorage (fallback global pro)
    if (!actSignature) {
        try {
            const lsPersonal = localStorage.getItem('personalData');
            const lsStamp = localStorage.getItem('signatureStampData');
            const legacySig = localStorage.getItem('capturedSignature');
            
            if (lsStamp) { actSignature = JSON.parse(lsStamp).signature; }
            else if (legacySig) { actSignature = legacySig; }
            
            if (lsPersonal) {
                const pd = JSON.parse(lsPersonal);
                actName = actName || pd.name;
                actLic = actLic || pd.license;
            }
        } catch(e) {}
    }

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '12mm 15mm', background: '#ffffff', color: '#1e293b',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '9pt',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    borderTop: '12px solid #2563eb'
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
                            border-top: 12px solid #2563eb !important; border-radius: 0 !important; 
                            min-height: auto !important; height: auto !important;
                        }
                    `}
                </style>

                {/* Header Sequence */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.8rem', width: '100%' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: '#2563eb' }}>Doc. Auditoría Interna</p>
                    </div>

                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>AUDIT</h1>
                        <div style={{ marginTop: '0.3rem', background: '#3b82f6', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                            REPORTE DE AUDITORÍA EHS
                        </div>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <CompanyLogo
                            style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }}
                        />
                    </div>
                </div>

                {/* Titulo y Datos Generales de la Auditoría */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.5rem', width: '100%', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Flag size={14} /> ASPECTO EVALUADO (TÍTULO DE AUDITORÍA)
                        </span>
                        <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#0f172a', marginTop: '0.4rem' }}>{data.auditTitle || data.title || 'Auditoría General'}</div>
                    </div>
                    
                    <div style={{ display: 'flex', background: '#ffffff' }}>
                        <div style={{ flex: '1', padding: '0.8rem 1rem', borderRight: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12}/> FECHA</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{data.date || data.scheduledDate || '-'}</div>
                        </div>
                        <div style={{ flex: '1', padding: '0.8rem 1rem', borderRight: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12}/> ÁREA / LOCACIÓN</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{data.location || '-'}</div>
                        </div>
                        <div style={{ flex: '1', padding: '0.8rem 1rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={12}/> AUDITOR LÍDER</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{actName || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Alcance y Metodología */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '6px', background: '#ffffff' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.3rem' }}>OBJETIVO Y ALCANCE</span>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>{data.scope || 'Verificar el cumplimiento de los procedimientos internos de EHS y la normativa legal vigente aplicable al sector y tareas desarrolladas.'} </p>
                    </div>
                    <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '6px', background: '#ffffff' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.3rem' }}>METODOLOGÍA DE AUDITORÍA</span>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>Entrevistas al personal, observación técnica directa en campo y revisión cruzada de registros documentales (SGSySO).</p>
                    </div>
                </div>

                {/* Resumen Cuantitativo / Cualitativo */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.3rem' }}>
                        <ClipboardCheck size={16} color="#3b82f6" />
                        DESARROLLO Y RESULTADOS DEL RELEVAMIENTO
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.5rem', alignItems: 'stretch' }}>
                        <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '6px', background: '#ffffff' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>HALLAZGOS Y DESVIACIONES DETECTADAS</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {data.findings || '✓ Se constató el cumplimiento general de las normativas de seguridad.\n✓ Uso de EPP conforme al nivel de riesgo.\n✓ No se detectaron desvíos críticos que supongan peligro inminente.'}
                            </p>
                        </div>
                        
                        <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>CONFORMIDADES</span>
                                <span style={{ color: '#ffffff', background: '#10b981', padding: '0.1rem 0.6rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem' }}>{data.conformities || '10'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>NO CONFORMIDADES</span>
                                <span style={{ color: '#ffffff', background: '#ef4444', padding: '0.1rem 0.6rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem' }}>{data.nonConformities || '0'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>OPORT. DE MEJORA</span>
                                <span style={{ color: '#ffffff', background: '#3b82f6', padding: '0.1rem 0.6rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem' }}>{data.opportunities || '2'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conclusion Final */}
                <div style={{ borderLeft: '4px solid #3b82f6', background: '#eff6ff', padding: '1rem 1.5rem', borderRadius: '0 6px 6px 0', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1e3a8a', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>CONCLUSIÓN FINAL DEL AUDITOR</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a', fontStyle: 'italic', fontWeight: 600, lineHeight: 1.5 }}>
                        {data.conclusion || 'La auditoría concluye que el sistema logístico y de producción mantiene condiciones eficaces de seguridad, con requerimientos de ajustes menores en el seguimiento de capacitaciones planificadas.'}
                    </p>
                </div>

                {/* Firmas de Responsabilidad */}
                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid', display: 'flex', gap: '1rem', paddingBottom: '1rem' }}>
                    
                    <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Original</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>RESPONSABLE DEL ÁREA</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Firma de notificación (Auditado)</p>
                    </div>

                    <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Original</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>GERENCIA / DIRECCIÓN</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Toma de conocimiento</p>
                    </div>

                    <div style={{ flex: 1, border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #86efac', paddingBottom: '0.25rem', marginBottom: '0.5rem', position: 'relative' }}>
                            {actSignature ? (
                                <img src={actSignature} alt="Firma Profesional" style={{ maxHeight: '50px', objectFit: 'contain', zIndex: 2 }} />
                            ) : (
                                <span style={{ fontSize: '0.6rem', color: '#86efac' }}>Sello y Firma Digital</span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#166534' }}>AUDITOR LÍDER EHS</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#15803d', fontWeight: 600 }}>
                            {actName || 'Firma de Especialista'}
                        </p>
                        {actLic && (
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#16a34a' }}>Mat: {actLic}</p>
                        )}
                    </div>
                </div>

                {/* Footer informativo */}
                <PdfBrandingFooter />
            </div>
        </div>
    );
}
