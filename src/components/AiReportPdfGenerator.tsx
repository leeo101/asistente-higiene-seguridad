import React from 'react';
import { ShieldCheck, TriangleAlert, Info } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

export default function AiReportPdfGenerator({ item }: { item: any }): React.ReactElement | null {
// function body start

    if (!item) return null;

    const data = item;
    const company = data.company || 'Empresa Local';
    const profile = JSON.parse(localStorage.getItem('personalData') || 'null');
    const signature = JSON.parse(localStorage.getItem('signatureStampData') || 'null');

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
                        .company-logo {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    `}
                </style>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '24pt', fontWeight: 900 }}>INFORME AI</h1>
                        <p style={{ margin: 0, fontSize: '10pt', color: '#475569', textTransform: 'uppercase' }}>Inspección Visual de Seguridad</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            height: '50px',
                            minWidth: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            marginBottom: '0.5rem'
                        }}>
                            <CompanyLogo
                                style={{
                                    height: '100%',
                                    width: 'auto',
                                    maxWidth: '150px',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: 700 }}>
                            {new Date(data.date).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* Info Block */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '8pt', color: '#64748b' }}>Tipo</p>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '10pt', color: 'var(--color-primary)' }}>
                            {data.type === 'general_risks' ? 'RIESGOS GENERALES' : 'VERIFICAR EPP'}
                        </p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '8pt', color: '#64748b' }}>Empresa / Planta</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '10pt' }}>{company}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '8pt', color: '#64748b' }}>Fecha</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '10pt' }}>{new Date(data.date).toLocaleString()}</p>
                    </div>
                </div>

                {/* Evidence Photo */}
                <div style={{ marginBottom: '2rem', textAlign: 'center', pageBreakInside: 'avoid' }}>
                    <div style={{ width: '100%', maxWidth: '350px', height: '250px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', margin: '0 auto', background: '#f1f5f9' }}>
                        <img src={data.image} alt="Evidencia" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                </div>

                {/* Analysis Results */}
                <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                    <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b', fontSize: '12pt' }}>
                        {data.type === 'general_risks' ? 'Resumen de Riesgos Detectados' : 'Evaluación de EPP Detectada'}
                    </h3>

                    {data.type !== 'general_risks' ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {[
                                    { label: 'Casco de Seguridad', pass: data.analysis?.helmetUsed },
                                    { label: 'Calzado de Seguridad', pass: data.analysis?.shoesUsed },
                                    { label: 'Guantes de Trabajo', pass: data.analysis?.glovesUsed },
                                    { label: 'Ropa Reflectiva', pass: data.analysis?.clothingUsed },
                                ].map((item, i) => (
                                    <div key={i} style={{ padding: '0.8rem', borderRadius: '8px', background: item.pass ? '#f0fdf4' : '#fef2f2', border: `1px solid ${item.pass ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '0.8rem', color: item.pass ? '#15803d' : '#b91c1c' }}>
                                        {item.pass ? <ShieldCheck size={18} /> : <TriangleAlert size={18} />}
                                        <span style={{ fontWeight: 700, fontSize: '9pt' }}>{item.label}: {item.pass ? 'CUMPLE' : 'FALTA'}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: data.analysis?.ppeComplete ? '#f0fdf4' : '#fff7ed', border: `1px solid ${data.analysis?.ppeComplete ? '#bbf7d0' : '#ffedd5'}`, display: 'flex', alignItems: 'center', gap: '0.8rem', color: data.analysis?.ppeComplete ? '#15803d' : '#c2410c' }}>
                                {data.analysis?.ppeComplete ? <ShieldCheck size={20} /> : <TriangleAlert size={20} />}
                                <span style={{ fontWeight: 800, fontSize: '10pt' }}>ESTADO: {data.analysis?.ppeComplete ? 'ADECUADO' : 'REQUIERE ATENCIÓN'}</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '1rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                                <Info size={18} />
                                <span style={{ fontWeight: 800, fontSize: '10pt' }}>EVALUACIÓN GENERAL</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '9pt', lineHeight: '1.5' }}>{data.analysis?.generalAssessment || 'Análisis ambiental completado.'}</p>
                        </div>
                    )}
                </div>

                {data.type !== 'general_risks' && data.analysis?.foundRisks?.length > 0 && (
                    <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                        <h4 style={{ color: '#b91c1c', marginBottom: '0.8rem', fontSize: '11pt' }}>Riesgos Adicionales:</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e293b', fontSize: '10pt' }}>
                            {data.analysis.foundRisks.map((risk, i) => (
                                <li key={i} style={{ marginBottom: '0.3rem' }}>{risk}</li>
                            ))}
                        </ul>
                    </div>
                )}

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
                        <div style={{ fontSize: '9pt', color: '#1e293b', fontWeight: 'bold' }}>{profile?.name || 'Profesional Actuante'}</div>
                        <div style={{ fontSize: '8pt', color: '#64748b' }}>Mat: {profile?.license || '-'}</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
