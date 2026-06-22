import React from 'react';
import { Weight, AlertTriangle } from 'lucide-react';
import { Crane } from '@phosphor-icons/react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function LiftingPdfGenerator({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    const loadPercentage = parseFloat(data.loadWeight) / parseFloat(data.equipmentCapacity) * 100;
    const isCritical = loadPercentage >= 75;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container card print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '15mm 20mm', background: '#ffffff', color: '#000000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '12px',
                    boxSizing: 'border-box', margin: '0 auto',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
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
                            padding: 10mm !important;
                            width: 100% !important;
                            max-width: none !important;
                            border-top: 12px solid #2563eb !important;
                            border-radius: 0 !important;
                        }
                        .gradient-header {
                            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                        }
                    `}
                </style>

                {/* Header - Mejorado visualmente */}
                <div className="gradient-header" style={{ 
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    color: '#ffffff'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ 
                                background: 'rgba(255,255,255,0.2)', 
                                padding: '8px', 
                                borderRadius: '8px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <Crane size={28} color="#38bdf8" />
                            </div>
                            <div>
                                <h1 style={{ 
                                    margin: 0, 
                                    fontSize: '20pt', 
                                    fontWeight: 900, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '-0.5px',
                                    lineHeight: 1
                                }}>
                                    PLAN DE IZAJE SEGURO
                                </h1>
                                <p style={{ 
                                    margin: '4px 0 0 0', 
                                    fontSize: '9pt', 
                                    color: '#cbd5e1',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    PERMISO DE TRABAJO CRÍTICO
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ marginLeft: '20px', flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <CompanyLogo 
                            style={{
                                height: '45px',
                                width: 'auto',
                                objectFit: 'contain',
                                maxWidth: '140px',
                                background: '#ffffff',
                                padding: '8px',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        />
                        <div style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Doc. Controlado</div>
                    </div>
                </div>

                {/* Main Info */}
                <div style={{ 
                    background: isCritical ? '#fef2f2' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                    padding: '1.2rem', 
                    border: `1px solid ${isCritical ? '#fca5a5' : '#e2e8f0'}`, 
                    borderRadius: '10px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '1.5rem' 
                }}>
                    <div>
                        <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UBICACIÓN / ÁREA</span>
                        <h2 style={{ margin: '0.2rem 0', fontSize: '16pt', fontWeight: 900, color: '#0f172a' }}>{data.location || 'N/A'}</h2>
                        <span style={{ fontSize: '10pt', fontWeight: 700, color: '#334155' }}>Equipo: {data.equipment}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                            background: isCritical ? '#ef4444' : '#10b981', 
                            color: '#ffffff', 
                            padding: '0.5rem 1.2rem', 
                            borderRadius: '20px', 
                            fontWeight: 800, 
                            fontSize: '9pt',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            letterSpacing: '0.5px'
                        }}>
                            {isCritical ? 'IZAJE CRÍTICO (>75%)' : 'IZAJE ESTÁNDAR'}
                        </span>
                    </div>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>FECHA Y HORA</span>
                        <span style={{ fontSize: '11pt', fontWeight: 800, color: '#0f172a' }}>{data.date ? new Date(data.date).toLocaleDateString('es-AR') : ''} {data.time}</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>VELOCIDAD DEL VIENTO</span>
                        <span style={{ fontSize: '11pt', fontWeight: 800, color: '#0f172a' }}>{data.windSpeed} km/h</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>OPERADOR DEL EQUIPO</span>
                        <span style={{ fontSize: '11pt', fontWeight: 800, color: '#0f172a' }}>{data.personnel?.operator || '-'}</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>RIGGER / SEÑALERO</span>
                        <span style={{ fontSize: '11pt', fontWeight: 800, color: '#0f172a' }}>{data.personnel?.rigger || '-'}</span>
                    </div>
                </div>

                {/* Calculation */}
                <div style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: '10px',  }}>
                    <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '0.8rem 1rem', color: '#ffffff' }}>
                        <h3 style={{ margin: 0, fontSize: '10.5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Weight size={18} /> CÁLCULO DE CARGA
                        </h3>
                    </div>
                    <table style={{ tableLayout: 'fixed', wordBreak: 'break-word', overflowWrap: 'break-word',  width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                        <tbody>
                            <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <td style={{ borderBottom: '1px solid #e2e8f0', padding: '0.8rem 1rem', fontWeight: 700, width: '60%', background: '#f8fafc', color: '#334155' }}>Peso Total a Izar (Carga + Aparejos)</td>
                                <td style={{ borderBottom: '1px solid #e2e8f0', padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{data.loadWeight} kg</td>
                            </tr>
                            <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <td style={{ borderBottom: '1px solid #e2e8f0', padding: '0.8rem 1rem', fontWeight: 700, background: '#f8fafc', color: '#334155' }}>Capacidad de la Grúa al Radio Máx</td>
                                <td style={{ borderBottom: '1px solid #e2e8f0', padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{data.equipmentCapacity} kg</td>
                            </tr>
                            <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <td style={{ padding: '0.8rem 1rem', fontWeight: 800, background: isCritical ? '#fee2e2' : '#f0fdf4', color: isCritical ? '#b91c1c' : '#16a34a' }}>Porcentaje de Capacidad de Uso</td>
                                <td style={{ padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 900, background: isCritical ? '#fee2e2' : '#f0fdf4', color: isCritical ? '#b91c1c' : '#16a34a', fontSize: '11pt' }}>{loadPercentage ? loadPercentage.toFixed(1) : 0}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Checklist */}
                <div style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: '10px',  }}>
                    <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '0.8rem 1rem', color: '#ffffff' }}>
                        <h3 style={{ margin: 0, fontSize: '10.5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            VERIFICACIÓN DE SEGURIDAD
                        </h3>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, background: '#ffffff' }}>
                        {[
                            { key: 'groundStable', label: 'Terreno Firme y Nivelado (Apoyos extendidos al 100%)' },
                            { key: 'areaIsolated', label: 'Área Delimitada y Señalizada' },
                            { key: 'weatherGood', label: 'Condiciones Climáticas Favorables (Sin tormenta)' },
                            { key: 'powerLinesClear', label: 'Distancia Segura a Líneas Eléctricas' },
                            { key: 'elementsInspected', label: 'Elementos de Izaje Inspeccionados y Operativos' }
                        ].map((item, idx) => {
                            const isChecked = data.checklist?.[item.key];
                            return (
                                <li key={idx} style={{ 
                                    padding: '0.8rem 1rem', 
                                    borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    fontSize: '9.5pt',
                                    color: '#334155',
                                    background: isChecked ? '#f8fafc' : '#ffffff'
                                }}>
                                    <div style={{ 
                                        width: '18px', height: '18px', borderRadius: '4px',
                                        background: isChecked ? '#10b981' : '#f1f5f9',
                                        border: `1px solid ${isChecked ? '#10b981' : '#cbd5e1'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {isChecked && <span style={{ color: '#fff', fontSize: '12px', lineHeight: 1 }}>✓</span>}
                                    </div>
                                    <span style={{ fontWeight: isChecked ? 600 : 400 }}>{item.label}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: '#f8fafc' }}>
                    <span style={{ fontSize: '8pt', fontWeight: 800, display: 'block', marginBottom: '0.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OBSERVACIONES</span>
                    <p style={{ margin: 0, fontSize: '9.5pt', color: '#334155', lineHeight: 1.5 }}>{data.observations || 'Sin observaciones.'}</p>
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
            <PdfBrandingFooter />

            </div>
        </div>
    );
}
