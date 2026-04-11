import React from 'react';
import { AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

const TYPE_MAP = {
    personal: 'Dosimetría Personal',
    area: 'Medición de Área',
    peak: 'Ruido de Impacto',
    octave: 'Análisis Octavas'
};

export default function NoiseAssessmentPdf({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    const level = parseFloat(data.levels?.lavg || 0);
    const isCritical = level > 85;

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
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900 }}>PLANILLA DE MEDICIÓN DE RUIDO</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#666' }}>CONFORME A RES. SRT 85/12</p>
                    </div>
                    <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                </div>

                {/* Main Results */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', padding: '1.5rem', border: '2px solid #000', borderRadius: '8px', background: isCritical ? '#fff5f5' : '#f0fdf4' }}>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#666', display: 'block' }}>NIVEL SONORO CONTINUO EQUIVALENTE (NSCE)</span>
                        <div style={{ fontSize: '3rem', fontWeight: 900, color: isCritical ? '#c53030' : '#166534' }}>{level} dBA</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isCritical ? '#c53030' : '#166534' }}>
                            {isCritical ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                            <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>{isCritical ? 'SUPERA LMPE' : 'CONFORME'}</span>
                         </div>
                         <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem' }}>* Límite Máximo Permitido para 8hs: 85 dBA</p>
                    </div>
                </div>

                {/* Location & Conditions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1.5px solid #000', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>TRABAJADOR / PUESTO</span>
                        <span style={{ fontWeight: 700 }}>{data.workerName || 'N/A'}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>FECHA</span>
                        <span style={{ fontWeight: 700 }}>{data.date ? new Date(data.date).toLocaleDateString('es-AR') : 'N/A'}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>UBICACIÓN / SECTOR</span>
                        <span style={{ fontWeight: 700 }}>{data.location || 'No especificada'}</span>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>RUIDO TIPO</span>
                        <span style={{ fontWeight: 700 }}>{TYPE_MAP[data.type] || 'Continuo'}</span>
                    </div>
                </div>

                {/* Equipment Check */}
                <div style={{ marginBottom: '1.5rem', border: '1px solid #ddd', padding: '0.8rem', borderRadius: '6px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={16} /> DATOS DEL INSTRUMENTAL
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                        <div><span style={{ color: '#666' }}>Decibelímetro:</span> <strong>{data.equipment || 'No especificado'}</strong></div>
                        <div><span style={{ color: '#666' }}>Tarea Evaluada:</span> <strong>{data.task || 'N/A'}</strong></div>
                        <div><span style={{ color: '#666' }}>Duración:</span> <strong>{data.duration || '0'} hs</strong></div>
                    </div>
                </div>

                {/* Recommendations */}
                <div style={{ marginBottom: '1.5rem', border: '1px solid #000', padding: '0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', marginBottom: '0.4rem' }}>OBSERVACIONES / MEDIDAS DE CONTROL</span>
                    <div style={{ fontSize: '0.85rem' }}>{data.observations || 'Se recomienda el uso obligatorio de protección auditiva y realizar rotación de personal para limitar exposición.'}</div>
                </div>

                {/* Signatures */}
                <div style={{ marginTop: 'auto', paddingTop: '3rem', display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid', gap: '3rem', paddingBottom: '2rem' }}>
                    <div style={{ flex: 1, maxWidth: '240px', textAlign: 'center' }}>
                        <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '2px solid #1e293b', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Firma original</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>TRABAJADOR / PUESTO</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b' }}>Firma y Aclaración</p>
                    </div>

                    <div style={{ flex: 1, maxWidth: '240px', textAlign: 'center' }}>
                        <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '2px solid #1e293b', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
                            {data.capatazSignature ? (
                                <img src={data.capatazSignature} alt="Firma Supervisor" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Firma digital / original</span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>RESPONSABLE DEL ÁREA</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b' }}>Aprobación</p>
                    </div>

                    <div style={{ flex: 1, maxWidth: '240px', textAlign: 'center' }}>
                        <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '2px solid #1e293b', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
                            {data.professionalSignature || data.signature ? (
                                <img src={data.professionalSignature || data.signature} alt="Firma Profesional" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Sello y Firma original</span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>PROFESIONAL DE S&H</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b' }}>
                            {data.professionalName || 'Firma y Sello'}
                        </p>
                        {(data.professionalLicense || data.license) && (
                            <p style={{ margin: 0, fontSize: '0.6rem', color: '#64748b' }}>Mat: {data.professionalLicense || data.license}</p>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.6rem', color: '#999', textAlign: 'center' }}>
                    ESTA PLANILLA TIENE VALIDEZ LEGAL SEGÚN LOS PROTOCOLOS DE LA SUPERINTENDENCIA DE RIESGOS DEL TRABAJO (SRT).
                </div>
            </div>
        </div>
    );
}
