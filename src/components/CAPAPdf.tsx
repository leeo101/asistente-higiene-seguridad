import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, Clipboard, User, Calendar, RefreshCw } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function CAPAPdf({ data }: { data: any }): React.ReactElement | null {
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

    const isCritical = data.priority === 'critical';

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
                    borderTop: isCritical ? '12px solid #dc2626' : '12px solid #2563eb'
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
                            border-top: ${isCritical ? '12px solid #dc2626' : '12px solid #2563eb'} !important; border-radius: 0 !important; 
                            min-height: auto !important; height: auto !important;
                        }
                    `}
                </style>

                {/* Header Sequence */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.8rem', width: '100%' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: isCritical ? '#dc2626' : '#2563eb' }}>Doc. Mejora Continua</p>
                    </div>

                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>CAPA</h1>
                        <div style={{ marginTop: '0.3rem', background: isCritical ? '#dc2626' : '#3b82f6', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                            ACCIÓN CORRECTIVA / PREVENTIVA
                        </div>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <CompanyLogo
                            style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }}
                        />
                    </div>
                </div>

                {/* Título de la Acción & ID */}
                <div style={{ border: isCritical ? '2px solid #fecaca' : '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.5rem', width: '100%', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', background: isCritical ? '#fef2f2' : '#f8fafc', borderBottom: isCritical ? '2px solid #fecaca' : '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isCritical ? '#dc2626' : '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <RefreshCw size={14} /> IDENTIFICADOR ÚNICO DE ACCIÓN: #CAPA-{data.id?.slice(0, 8) || 'N/A'}
                            </span>
                            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#0f172a', marginTop: '0.4rem' }}>{data.title || data.description || 'Sin título'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ padding: '0.3rem 0.8rem', background: data.status === 'completed' ? '#dcfce7' : '#f1f5f9', color: data.status === 'completed' ? '#16a34a' : '#1e293b', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'inline-block' }}>
                                ESTADO: {data.status?.toUpperCase() || 'ABIERTO'}
                            </span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', background: '#ffffff' }}>
                        <div style={{ flex: '1', padding: '0.8rem 1rem', borderRight: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={12}/> ORIGEN / FUENTE</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{data.source || 'Auditoría / Inspección'}</div>
                        </div>
                        <div style={{ flex: '1', padding: '0.8rem 1rem', borderRight: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12}/> FECHA APERTURA</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{data.date || '-'}</div>
                        </div>
                        <div style={{ flex: '1', padding: '0.8rem 1rem', borderRight: '1px solid #cbd5e1', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12}/> FECHA LÍMITE</span>
                            <div style={{ fontWeight: 900, fontSize: '0.9rem', color: isCritical ? '#dc2626' : '#0f172a', marginTop: '0.2rem' }}>{data.dueDate || data.date || '-'}</div>
                        </div>
                        <div style={{ flex: '1', padding: '0.8rem 1rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={12}/> RESPONSABLE ASIGNADO</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{data.responsible || 'No asignado'}</div>
                        </div>
                    </div>
                </div>

                {/* Análisis e Implementación */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ border: '1px solid #cbd5e1', padding: '1.2rem', borderRadius: '6px', background: '#ffffff' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#475569', display: 'block', marginBottom: '0.6rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.3rem', textTransform: 'uppercase' }}>1. DESCRIPCIÓN DEL HALLAZGO / DESVIACIÓN TÉCNICA</span>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {data.description || 'No se ingresó una descripción detallada del hallazgo.'}
                        </p>
                    </div>
                    <div style={{ border: '1px solid #cbd5e1', padding: '1.2rem', borderRadius: '6px', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#475569', display: 'block', marginBottom: '0.6rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.3rem', textTransform: 'uppercase' }}>2. ACCIÓN DE TRATAMIENTO INMEDIATO</span>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {data.immediateAction || 'Se procedió al bloqueo preventivo e interrupción temporal de la actividad para contener la amenaza inminente asociada.'}
                        </p>
                    </div>
                </div>

                {/* Plan de Acción Definitivo */}
                <div style={{ marginBottom: '2rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1.2rem', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', fontWeight: 900, color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                        <ShieldCheck size={18} /> 3. PLAN DE ACCIÓN DEFINITIVO (RESOLUCIÓN DE RAÍZ)
                    </h3>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064e3b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {data.plan || 'El plan definitivo no fue documentado al momento de la exportación del PDF.'}
                    </div>
                </div>

                {/* Firmas de Responsabilidad */}
                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid', display: 'flex', gap: '1rem', paddingBottom: '1rem', justifyContent: 'center' }}>
                    
                    <div style={{ flex: '0 1 32%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Gestión en sistema</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>RESPONSABLE DE EJECUCIÓN</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Aceptación de acción delegada</p>
                    </div>

                    <div style={{ flex: '0 1 32%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Original</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>SUPERVISOR ÁREA</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Verificación y conformidad</p>
                    </div>

                    <div style={{ flex: '0 1 32%', border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #86efac', paddingBottom: '0.25rem', marginBottom: '0.5rem', position: 'relative' }}>
                            {actSignature ? (
                                <img src={actSignature} alt="Firma Profesional" style={{ maxHeight: '50px', objectFit: 'contain', zIndex: 2 }} />
                            ) : (
                                <span style={{ fontSize: '0.6rem', color: '#86efac' }}>Sello y Firma Digital</span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#166534' }}>AUTORIDAD HSE</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#15803d', fontWeight: 600 }}>
                            {actName || 'Especialista a cargo'}
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
