import React, { useRef } from 'react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function TrainingExamPdfGenerator({ data }: { data: any }): React.ReactElement | null {
    const componentRef = useRef<HTMLDivElement>(null);
    const preguntas = data.preguntas || [];

    return (
        <div id="pdf-content" className="pdf-container print-area" ref={componentRef} style={{ width: '210mm', minHeight: '297mm', padding: '15mm', background: '#ffffff', color: '#1e293b', boxSizing: 'border-box', margin: '0 auto', fontSize: '10pt', fontFamily: 'Helvetica, Arial, sans-serif' }}>
            <style type="text/css" media="print">
                {`
                    @page { size: A4 portrait; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                    .print-area { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; border-top: none !important; border-radius: 0 !important; min-height: auto !important; height: auto !important; }
                `}
            </style>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: '0 0 0.2rem 0', color: '#0f172a', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase' }}>Evaluación de Capacitación</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Cuestionario de Comprensión</p>
                </div>
                <CompanyLogo style={{ height: '35px', objectFit: 'contain' }} />
            </div>

            {/* Info Box */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', background: '#f8fafc' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TEMA EVALUADO</span>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{data.tema || '-'}</div>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>FECHA</span>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                            {data.fecha ? new Date(data.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>INSTRUCTOR</span>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{data.expositor || '-'}</div>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>EMPRESA</span>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{data.empresa || 'Aplicable al sitio'}</div>
                    </div>
                </div>
            </div>

            {/* Alumno Box */}
            <div style={{ border: '1px solid #0f172a', padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <span style={{ fontWeight: 800, lineHeight: 1 }}>APELLIDO Y NOMBRES:</span>
                    <div style={{ flex: 1, borderBottom: '1px solid #64748b' }}></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'flex-end' }}>
                        <span style={{ fontWeight: 800, lineHeight: 1 }}>DNI:</span>
                        <div style={{ flex: 1, borderBottom: '1px solid #64748b' }}></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'flex-end' }}>
                        <span style={{ fontWeight: 800, lineHeight: 1 }}>PUESTO:</span>
                        <div style={{ flex: 1, borderBottom: '1px solid #64748b' }}></div>
                    </div>
                </div>
            </div>

            {/* Preguntas */}
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>Desarrollo del Examen</h3>
                {preguntas.length > 0 ? (
                    preguntas.map((p: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: '2rem' }}>
                            <p style={{ fontWeight: 700, margin: '0 0 1rem 0', fontSize: '0.95rem' }}>{idx + 1}. {p.texto}</p>
                            <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '1.5rem' }}></div>
                            <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '1.5rem' }}></div>
                            <div style={{ borderBottom: '1px solid #cbd5e1' }}></div>
                        </div>
                    ))
                ) : (
                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ fontWeight: 700, margin: '0 0 1rem 0' }}>1. </p>
                        <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '1.5rem' }}></div>
                        <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '1.5rem' }}></div>
                    </div>
                )}
            </div>

            {/* Firma Alumno e Instructor */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                <div style={{ width: '40%', textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.5rem' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem' }}>Firma del Evaluado</p>
                    </div>
                </div>
                <div style={{ width: '40%', textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.5rem' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem' }}>Firma del Instructor</p>
                    </div>
                    <div style={{ position: 'absolute', transform: 'translateY(-120%) translateX(20%)', opacity: 0.8 }}>
                        {data.signature && <img src={data.signature} style={{ maxHeight: '60px' }} alt="Firma" />}
                        {data.professionalStamp && <img src={data.professionalStamp} style={{ maxHeight: '60px', marginLeft: '10px' }} alt="Sello" />}
                    </div>
                </div>
            </div>
            
            <div style={{ marginTop: '3rem' }}>
                <div style={{ border: '2px solid #0f172a', display: 'inline-flex', alignItems: 'flex-end', padding: '0.5rem 1rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>NOTA / RESULTADO: </span>
                    <span style={{ display: 'inline-block', width: '100px', borderBottom: '1px solid #0f172a', marginLeft: '0.5rem' }}></span>
                </div>
            </div>

            <PdfBrandingFooter />
        </div>
    );
}
