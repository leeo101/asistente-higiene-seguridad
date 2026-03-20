import React from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, User, Calendar, MapPin } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

export default function AuditPdf({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '10pt',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { box-shadow: none !important; margin: 0 !important; padding: 5mm !important; width: 100% !important; max-width: none !important; border: none !important; border-radius: 0 !important; }
                    `}
                </style>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>INFORME DE AUDITORÍA EHS</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#666' }}>SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD OCUPACIONAL</p>
                    </div>
                    <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                </div>

                {/* Audit Title Card */}
                <div style={{ background: '#1e293b', color: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>TÍTULO DE LA AUDITORÍA</div>
                    <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.5rem', fontWeight: 900 }}>{data.auditTitle || data.title}</h2>
                    <div style={{ marginTop: '0.8rem', display: 'flex', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <Calendar size={16} /> {data.date || data.scheduledDate}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <MapPin size={16} /> {data.location}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <User size={16} /> {data.leadAuditor}
                        </div>
                    </div>
                </div>

                {/* Summary / Scope */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '6px' }}>
                         <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#666', display: 'block', marginBottom: '0.4rem' }}>OBJETIVO Y ALCANCE</span>
                         <p style={{ margin: 0, fontSize: '0.85rem' }}>{data.scope || 'Verificar el cumplimiento de los procedimientos internos de EHS y la normativa legal vigente (Ley 19.587).'} </p>
                    </div>
                    <div style={{ border: '1px solid #ddd', padding: '0.8rem', borderRadius: '6px' }}>
                         <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#666', display: 'block', marginBottom: '0.4rem' }}>METODOLOGÍA</span>
                         <p style={{ margin: 0, fontSize: '0.85rem' }}>Entrevistas, observación directa en campo y revisión de registros documentales.</p>
                    </div>
                </div>

                {/* Results Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 900, borderBottom: '2px solid #000', paddingBottom: '0.4rem', marginBottom: '1rem' }}>RESUMEN DE RESULTADOS</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                        <div>
                             <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 900 }}>HALLAZGOS PRINCIPALES:</h4>
                             <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{data.findings || 'No se detectaron desviaciones críticas durante la auditoría. Se mantienen los estándares de seguridad establecidos.'}</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                 <span style={{ fontWeight: 700 }}>Conformidades:</span>
                                 <span style={{ color: '#16a34a', fontWeight: 900 }}>{data.conformities || '10'}</span>
                             </div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                 <span style={{ fontWeight: 700 }}>No Conformidades:</span>
                                 <span style={{ color: '#dc2626', fontWeight: 900 }}>{data.nonConformities || '0'}</span>
                             </div>
                             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                 <span style={{ fontWeight: 700 }}>Oportunidades Mejora:</span>
                                 <span style={{ color: '#3b82f6', fontWeight: 900 }}>{data.opportunities || '2'}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Conclusion */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1.5px solid #000' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, display: 'block', marginBottom: '0.5rem' }}>CONCLUSIÓN FINAL DEL AUDITOR</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontStyle: 'italic' }}>{data.conclusion || 'La auditoría concluye que el sistema de gestión es eficaz, aunque requiere ajustes menores en el seguimiento de acciones preventivas.'}</p>
                </div>

                {/* Signatures */}
                <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '2px solid #333', paddingTop: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '70px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block' }}>AUDITADO / RESPONSABLE ÁREA</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>
                             {data.signature && <img src={data.signature} alt="Firma Auditor" style={{ maxHeight: '100%', objectFit: 'contain' }} />}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block' }}>AUDITOR LÍDER (EHS)</span>
                        <span style={{ fontSize: '0.6rem', color: '#666' }}>Matrícula Profesional: {data.license || '..........'}</span>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.6rem', color: '#999', textAlign: 'center' }}>
                    ESTE INFORME ES CONFIDENCIAL Y PARA USO EXCLUSIVO DE LA DIRECCIÓN Y EL DEPARTAMENTO DE EHS.
                </div>
            </div>
        </div>
    );
}
