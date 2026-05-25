import React from 'react';
import { Timer, Users, Target } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';

export default function EvacuationPdfGenerator({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm', background: '#ffffff', color: '#000000',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '10pt',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { box-shadow: none !important; margin: 0 !important; padding: 5mm !important; width: 100% !important; max-width: none !important; border: none !important; border-radius: 0 !important; min-height: auto !important; height: auto !important; }
                    `}
                </style>

                {/* Modern Gradient Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    margin: '-15mm -15mm 15mm -15mm',
                    padding: '15mm',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '4px solid #38bdf8'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '12px' }}>
                            <Timer size={32} color="#38bdf8" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.5px' }}>REPORTE TÉCNICO</h1>
                            <p style={{ margin: '4px 0 0 0', fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>CÁLCULO TEÓRICO DE EVACUACIÓN</p>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                        <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                    </div>
                </div>

                {/* Main Info */}
                <div style={{ background: '#f8fafc', padding: '1.2rem', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', letterSpacing: '1px' }}>SECTOR / EDIFICIO</span>
                        <h2 style={{ margin: '4px 0', fontSize: '1.6rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>{data.sector || 'N/A'}</h2>
                    </div>
                    <div style={{ textAlign: 'right', background: '#f1f5f9', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block', letterSpacing: '1px', marginBottom: '4px' }}>FECHA DE EVALUACIÓN</span>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{data.date ? new Date(data.date).toLocaleDateString('es-AR') : '-'}</span>
                    </div>
                </div>

                {/* Calculation Parameters */}
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 900, borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#0f172a' }}>
                    1. PARÁMETROS DE CÁLCULO UTILIZADOS
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '4px' }}>POBLACIÓN ESTIMADA (N)</span>
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0f172a' }}>{data.peopleCount} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>personas</span></span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '4px' }}>ANCHO DE SALIDAS (A)</span>
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0f172a' }}>{data.exitWidth} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>m</span></span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '4px' }}>DISTANCIA MÁX. (D)</span>
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0f172a' }}>{data.maxDistance} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>m</span></span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '4px' }}>VELOCIDAD MARCHA (V)</span>
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0f172a' }}>{data.walkingSpeed} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>m/s</span></span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px', gridColumn: '1 / -1' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block', color: '#64748b', marginBottom: '4px' }}>FLUJO ESPECÍFICO (k)</span>
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0f172a' }}>{data.specificFlow} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>personas / (m·s)</span></span>
                    </div>
                </div>

                {/* Results */}
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 900, borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#0f172a' }}>
                    2. RESULTADOS DEL CÁLCULO
                </h3>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.8rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#475569' }}>Tiempo de Desplazamiento Teórico (D / V)</span>
                        <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a' }}>{data.travelTime} seg</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.8rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#475569' }}>Tiempo de Paso por Puertas (N / (A·k))</span>
                        <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a' }}>{data.flowTime} seg</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '1.2rem', background: '#ecfdf5', borderRadius: '8px', border: '2px solid #a7f3d0' }}>
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', color: '#065f46' }}>Tiempo Total de Evacuación</span>
                        <span style={{ fontWeight: 900, fontSize: '1.8rem', color: '#059669' }}>{data.calculatedTime} seg</span>
                    </div>
                </div>

                {/* Observations */}
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 900, borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#0f172a' }}>
                    3. CONCLUSIONES Y OBSERVACIONES
                </h3>
                <div style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.2rem', minHeight: '80px', background: '#ffffff' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>{data.observations || 'Sin observaciones registradas.'}</p>
                </div>

                {/* Signatures */}
                <PdfSignatures 
                    data={data} 
                    box1={data.showSignatures?.operator !== false ? {
                        title: 'EVALUADOR TÉCNICO',
                        subtitle: (data.evaluator || 'Firma del Evaluador').toUpperCase(),
                        signatureUrl: data.evaluatorSignature || data.signatures?.evaluator || null,
                        isProfessional: false
                    } : null}
                    box2={data.showSignatures?.professional !== false ? {
                        title: 'PROFESIONAL H&S',
                        subtitle: (data.professionalName || 'Firma de Especialista').toUpperCase(),
                        signatureUrl: data.professionalSignature || null,
                        stampUrl: data.professionalStamp || null,
                        isProfessional: true,
                        license: data.professionalLicense || null
                    } : null}
                    box3={data.showSignatures?.supervisor !== false ? {
                        title: 'RESPONSABLE SECTOR',
                        subtitle: 'Firma de Responsable',
                        signatureUrl: data.supervisorSignature || data.signatures?.manager || null,
                        isProfessional: false
                    } : null}
                />

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.65rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                    Documento generado por Asistente HYS | simulador teórico de evacuación basado en modelos estándar de dinámica peatonal.
                </div>
            </div>
        </div>
    );
}
