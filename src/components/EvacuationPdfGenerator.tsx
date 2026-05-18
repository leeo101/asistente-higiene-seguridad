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

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>REPORTE TÉCNICO</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#666' }}>CÁLCULO TEÓRICO DE EVACUACIÓN</p>
                    </div>
                    <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                </div>

                {/* Main Info */}
                <div style={{ background: '#f8fafc', padding: '1.2rem', border: '2px solid #cbd5e1', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block' }}>SECTOR / EDIFICIO</span>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>{data.sector || 'N/A'}</h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block' }}>FECHA DE EVALUACIÓN</span>
                        <span style={{ fontWeight: 800 }}>{data.date ? new Date(data.date).toLocaleDateString('es-AR') : '-'}</span>
                    </div>
                </div>

                {/* Calculation Parameters */}
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 900, borderBottom: '1px solid #000', paddingBottom: '0.3rem' }}>
                    1. PARÁMETROS DE CÁLCULO UTILIZADOS
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1.5px solid #000', marginBottom: '2rem' }}>
                    <div style={{ padding: '0.8rem', borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', color: '#64748b' }}>Población Estimada (N)</span>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{data.peopleCount} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>personas</span></span>
                    </div>
                    <div style={{ padding: '0.8rem', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', color: '#64748b' }}>Ancho Total de Salidas (A)</span>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{data.exitWidth} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>m</span></span>
                    </div>
                    <div style={{ padding: '0.8rem', borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', color: '#64748b' }}>Distancia Máxima (D)</span>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{data.maxDistance} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>m</span></span>
                    </div>
                    <div style={{ padding: '0.8rem', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', color: '#64748b' }}>Velocidad de Marcha (V)</span>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{data.walkingSpeed} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>m/s</span></span>
                    </div>
                    <div style={{ padding: '0.8rem', gridColumn: '1 / -1' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', color: '#64748b' }}>Flujo Específico (k)</span>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{data.specificFlow} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>personas / (m·s)</span></span>
                    </div>
                </div>

                {/* Results */}
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 900, borderBottom: '1px solid #000', paddingBottom: '0.3rem' }}>
                    2. RESULTADOS DEL CÁLCULO
                </h3>
                <div style={{ background: '#f1f5f9', border: '1.5px solid #000', padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #94a3b8', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tiempo de Desplazamiento Teórico (D / V)</span>
                        <span style={{ fontWeight: 900, fontSize: '1rem' }}>{data.travelTime} seg</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #94a3b8', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tiempo de Paso por Puertas (N / (A·k))</span>
                        <span style={{ fontWeight: 900, fontSize: '1rem' }}>{data.flowTime} seg</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '1rem', background: '#e2e8f0', borderRadius: '8px', border: '1px solid #94a3b8' }}>
                        <span style={{ fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase' }}>Tiempo Total de Evacuación</span>
                        <span style={{ fontWeight: 900, fontSize: '1.6rem', color: '#166534' }}>{data.calculatedTime} seg</span>
                    </div>
                </div>

                {/* Observations */}
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 900, borderBottom: '1px solid #000', paddingBottom: '0.3rem' }}>
                    3. CONCLUSIONES Y OBSERVACIONES
                </h3>
                <div style={{ marginBottom: '2rem', border: '1.5px solid #000', padding: '1rem', minHeight: '80px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{data.observations || 'Sin observaciones registradas.'}</p>
                </div>

                {/* Signatures */}
                <PdfSignatures 
                    data={data} 
                    box1={{
                        title: 'EVALUADOR H&S',
                        subtitle: 'Aclaración y Firma',
                        signatureUrl: data.signatures?.evaluator || null,
                        isProfessional: false
                    }}
                    box3={{
                        title: 'RESPONSABLE SECTOR',
                        subtitle: 'Aprobación y Cierre',
                        signatureUrl: data.signatures?.manager || null,
                        isProfessional: false
                    }}
                />

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.65rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                    Documento generado por Asistente HYS | simulador teórico de evacuación basado en modelos estándar de dinámica peatonal.
                </div>
            </div>
        </div>
    );
}
