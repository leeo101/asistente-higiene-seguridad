import React from 'react';
import { Weight, AlertTriangle } from 'lucide-react';
import { Crane } from '@phosphor-icons/react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';

export default function LiftingPdfGenerator({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    const loadPercentage = parseFloat(data.loadWeight) / parseFloat(data.equipmentCapacity) * 100;
    const isCritical = loadPercentage >= 75;

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
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>PLAN DE IZAJE SEGURO</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#666' }}>PERMISO DE TRABAJO CRÍTICO</p>
                    </div>
                    <CompanyLogo style={{ height: '50px', maxWidth: '150px', objectFit: 'contain' }} />
                </div>

                {/* Main Info */}
                <div style={{ background: '#f8fafc', padding: '1.2rem', border: `2px solid ${isCritical ? '#dc2626' : '#1e293b'}`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', display: 'block' }}>UBICACIÓN / ÁREA</span>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>{data.location || 'N/A'}</h2>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Equipo: {data.equipment}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ background: isCritical ? '#fef2f2' : '#f0fdf4', color: isCritical ? '#dc2626' : '#16a34a', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 900, fontSize: '0.9rem', border: `1px solid ${isCritical ? '#fecaca' : '#bbf7d0'}` }}>
                            {isCritical ? 'IZAJE CRÍTICO (>75%)' : 'IZAJE ESTÁNDAR'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1.5px solid #000', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>FECHA Y HORA</span>
                        <span style={{ fontWeight: 700 }}>{data.date ? new Date(data.date).toLocaleDateString('es-AR') : ''} {data.time}</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>VELOCIDAD DEL VIENTO</span>
                        <span style={{ fontWeight: 700 }}>{data.windSpeed} km/h</span>
                    </div>
                    <div style={{ padding: '0.5rem', borderRight: '1.5px solid #000' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>OPERADOR DEL EQUIPO</span>
                        <span style={{ fontWeight: 700 }}>{data.personnel?.operator || '-'}</span>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, display: 'block' }}>RIGGER / SEÑALERO</span>
                        <span style={{ fontWeight: 700 }}>{data.personnel?.rigger || '-'}</span>
                    </div>
                </div>

                {/* Calculation */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #000', paddingBottom: '0.3rem' }}>
                        <Weight size={18} /> CÁLCULO DE CARGA
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #ddd', padding: '0.5rem', fontWeight: 900, width: '50%', background: '#f1f5f9' }}>Peso Total a Izar (Carga + Aparejos)</td>
                                <td style={{ border: '1px solid #ddd', padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>{data.loadWeight} kg</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #ddd', padding: '0.5rem', fontWeight: 900, background: '#f1f5f9' }}>Capacidad de la Grúa al Radio Máx</td>
                                <td style={{ border: '1px solid #ddd', padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>{data.equipmentCapacity} kg</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #ddd', padding: '0.5rem', fontWeight: 900, background: isCritical ? '#fef2f2' : '#f0fdf4', color: isCritical ? '#dc2626' : '#16a34a' }}>Porcentaje de Capacidad de Uso</td>
                                <td style={{ border: '1px solid #ddd', padding: '0.5rem', textAlign: 'center', fontWeight: 900, color: isCritical ? '#dc2626' : '#16a34a' }}>{loadPercentage ? loadPercentage.toFixed(1) : 0}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Checklist */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 900, borderBottom: '1px solid #000', paddingBottom: '0.3rem' }}>
                        VERIFICACIÓN DE SEGURIDAD
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li style={{ padding: '0.3rem 0', borderBottom: '1px solid #eee' }}>{data.checklist?.groundStable ? '✅' : '❌'} Terreno Firme y Nivelado (Apoyos extendidos al 100%)</li>
                        <li style={{ padding: '0.3rem 0', borderBottom: '1px solid #eee' }}>{data.checklist?.areaIsolated ? '✅' : '❌'} Área Delimitada y Señalizada</li>
                        <li style={{ padding: '0.3rem 0', borderBottom: '1px solid #eee' }}>{data.checklist?.weatherGood ? '✅' : '❌'} Condiciones Climáticas Favorables (Sin tormenta)</li>
                        <li style={{ padding: '0.3rem 0', borderBottom: '1px solid #eee' }}>{data.checklist?.powerLinesClear ? '✅' : '❌'} Distancia Segura a Líneas Eléctricas</li>
                        <li style={{ padding: '0.3rem 0' }}>{data.checklist?.elementsInspected ? '✅' : '❌'} Elementos de Izaje Inspeccionados y Operativos</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '1.5rem', border: '1.5px solid #000', padding: '0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, display: 'block', marginBottom: '0.3rem' }}>OBSERVACIONES</span>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{data.observations || 'Sin observaciones.'}</p>
                </div>

                {/* Signatures */}
                <PdfSignatures 
                    data={data} 
                    box1={data.showSignatures?.operator !== false ? {
                        title: 'OPERADOR DEL EQUIPO',
                        subtitle: (data.personnel?.operator || 'Firma del Operador').toUpperCase(),
                        signatureUrl: data.operatorSignature || data.signatures?.operator || null,
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
                        title: 'SUPERVISOR DE IZAJE',
                        subtitle: (data.personnel?.supervisor || 'Firma del Supervisor').toUpperCase(),
                        signatureUrl: data.supervisorSignature || data.signatures?.supervisor || null,
                        isProfessional: false
                    } : null}
                />

            </div>
        </div>
    );
}
