import React from 'react';
import { Sparkles, ShieldAlert, HardHat, Lightbulb, Gavel } from 'lucide-react';

export default function AiAdvisorPdfGenerator({ data }) {
    if (!data) return null;

    const personalData = JSON.parse(localStorage.getItem('personalData') || '{}');
    const signature = JSON.parse(localStorage.getItem('signatureStampData') || 'null');
    const profName = personalData.fullName || 'Profesional Responsable';
    const profTitle = personalData.profession || 'Lic. en Higiene y Seguridad';
    const profMat = personalData.license || '-------';

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container report-print print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '20mm', background: '#ffffff', color: '#1e293b',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '10pt'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 15mm; }
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
                    `}
                </style>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '24pt', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <Sparkles size={32} /> ASISTENTE H&S
                        </h1>
                        <p style={{ margin: 0, fontSize: '10pt', color: '#475569', textTransform: 'uppercase' }}>Análisis de Seguridad con Inteligencia Artificial</p>
                    </div>
                </div>

                {/* Info Block */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '9pt', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tarea Analizada</p>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '14pt', color: '#0f172a', lineHeight: 1.4 }}>{data.task}</p>
                    <p style={{ margin: '0.8rem 0 0', fontSize: '9pt', color: '#64748b' }}>Fecha de consulta: {new Date(data.date).toLocaleString()}</p>
                </div>

                {/* Analysis Sections */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    {data.riesgos?.length > 0 && (
                        <div style={{ pageBreakInside: 'avoid' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '0.8rem', borderBottom: '2px solid #fecaca', paddingBottom: '0.5rem' }}>
                                <ShieldAlert size={20} /> <h3 style={{ margin: 0, fontSize: '12pt', fontWeight: 800 }}>Riesgos Detectados</h3>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '10pt', lineHeight: 1.5 }}>
                                {data.riesgos.map((item, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{item}</li>)}
                            </ul>
                        </div>
                    )}

                    {data.epp?.length > 0 && (
                        <div style={{ pageBreakInside: 'avoid' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', marginBottom: '0.8rem', borderBottom: '2px solid #bfdbfe', paddingBottom: '0.5rem' }}>
                                <HardHat size={20} /> <h3 style={{ margin: 0, fontSize: '12pt', fontWeight: 800 }}>EPP Recomendado</h3>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '10pt', lineHeight: 1.5 }}>
                                {data.epp.map((item, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{item}</li>)}
                            </ul>
                        </div>
                    )}

                    {data.recomendaciones?.length > 0 && (
                        <div style={{ pageBreakInside: 'avoid' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.8rem', borderBottom: '2px solid #a7f3d0', paddingBottom: '0.5rem' }}>
                                <Lightbulb size={20} /> <h3 style={{ margin: 0, fontSize: '12pt', fontWeight: 800 }}>Medidas Preventivas</h3>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '10pt', lineHeight: 1.5 }}>
                                {data.recomendaciones.map((item, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{item}</li>)}
                            </ul>
                        </div>
                    )}

                    {data.normativa?.length > 0 && (
                        <div style={{ pageBreakInside: 'avoid' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', marginBottom: '0.8rem', borderBottom: '2px solid #ddd6fe', paddingBottom: '0.5rem' }}>
                                <Gavel size={20} /> <h3 style={{ margin: 0, fontSize: '12pt', fontWeight: 800 }}>Marco Legal (Argentina)</h3>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#334155', fontSize: '10pt', lineHeight: 1.5 }}>
                                {data.normativa.map((item, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Signature Row */}
                <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid' }}>
                    <div style={{ width: '250px', textAlign: 'center' }}>
                         {signature?.signature || signature?.stamp ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', height: '60px' }}>
                                {signature.signature && <img src={signature.signature} alt="Firma" style={{ maxWidth: '100px', maxHeight: '60px' }} />}
                                {signature.stamp && <img src={signature.stamp} alt="Sello" style={{ maxWidth: '60px', maxHeight: '60px' }} />}
                            </div>
                        ) : (
                            <div style={{ height: '60px' }}></div>
                        )}
                        <div style={{ borderBottom: '1px solid #1e293b', height: '10px', marginBottom: '5px' }}></div>
                        <div style={{ fontSize: '9pt', color: '#1e293b', fontWeight: 'bold' }}>{profName.toUpperCase()}</div>
                        <div style={{ fontSize: '8pt', color: '#64748b' }}>{profTitle}</div>
                        <div style={{ fontSize: '8pt', color: '#64748b' }}>Mat: {profMat}</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
