import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, Clipboard, User, Calendar } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

export default function CAPAPdf({ data }: { data: any }): React.ReactElement | null {
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
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>ACCIÓN CORRECTIVA / PREVENTIVA (CAPA)</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#666' }}>SISTEMA DE GESTIÓN EHS - MEJORA CONTINUA</p>
                    </div>
                    <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                </div>

                {/* Action ID and Title Card */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '2px solid #000', marginBottom: '1.5rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                         <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b' }}>ID ACCIÓN: #CAPA-{data.id?.slice(0, 8)}</span>
                         <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b' }}>ESTADO: {data.status?.toUpperCase() || 'ABIERTA'}</span>
                     </div>
                     <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{data.title || data.description}</h2>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1.5px solid #000', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>ORIGEN / FUENTE</span>
                        <span style={{ fontWeight: 700 }}>{data.source || 'Auditoría Interna'}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>FECHA DE APERTURA</span>
                        <span style={{ fontWeight: 700 }}>{data.date}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>RESPONSABLE</span>
                        <span style={{ fontWeight: 700 }}>{data.responsible || 'No asignado'}</span>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>FECHA LÍMITE</span>
                        <span style={{ fontWeight: 700 }}>{data.dueDate || data.date}</span>
                    </div>
                </div>

                {/* Description & Analysis */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase' }}>1. Descripción del hallazgo o desviación:</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{data.description || 'No se cuenta con descripción detallada.'}</p>
                    </div>
                    <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase' }}>2. Tratamiento / Acción Inmediata:</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{data.immediateAction || 'Se procedió al bloqueo preventivo y corrección instantánea de la desviación observada.'}</p>
                    </div>
                </div>

                {/* Solution Summary */}
                <div style={{ marginBottom: '1.5rem', background: '#f0fdf4', border: '1px solid #16a34a', padding: '1rem', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={18} /> PLAN DE ACCIÓN DEFINITIVO (CORRECTIVA / PREVENTIVA)
                    </h3>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{data.plan || 'No especificado aún'}</div>
                </div>

                {/* Footer Signatures */}
                <div style={{ marginTop: 'auto', borderTop: '2px solid #333', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ height: '60px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block' }}>RESPONSABLE IMPLEMENTACIÓN</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ height: '60px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block' }}>VERIFICADOR (PROFESIONAL)</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}>
                                 {data.signature && <img src={data.signature} alt="Firma Profesional" style={{ maxHeight: '100%', objectFit: 'contain' }} />}
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block' }}>AUTORIDAD DE EHS</span>
                            <span style={{ fontSize: '0.6rem' }}>Licencia N°: {data.license || '..........'}</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.6rem', color: '#64748b', textAlign: 'center' }}>
                    DOCUMENTO OFICIAL DEL SISTEMA DE GESTIÓN DE CALIDAD Y SEGURIDAD INDUSTRIAL. 
                    ESTE REQUISITO ES MANDATORIO PARA LA MEJORA CONTINUA.
                </div>
            </div>
        </div>
    );
}
