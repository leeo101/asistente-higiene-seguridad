import React from 'react';
import { Lightbulb, Calculator, FileText, Layout, Sun } from 'lucide-react';

export default function LightingPdfGenerator({ data }) {
    if (!data) return null;

    const { empresa, fecha, sector, descripcionActividad, tipoTarea, luxRequerido, mediciones, results, conclusion } = data;
    const meds = mediciones || [];

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

                {/* Header Sequence */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control HYS</p>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#1e293b' }}>ESTUDIO</h1>
                        <p style={{ margin: 0, color: '#eab308', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.25rem' }}>Niveles de Iluminación</p>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>PÁGINA</div>
                        <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b' }}>01 / 01</div>
                    </div>
                </div>

                {/* Primary Info Box */}
                <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', borderBottom: '2px solid #e2e8f0', width: '100%' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>EMPRESA / CLIENTE</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{empresa || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>FECHA DE MEDICIÓN</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{fecha ? new Date(fecha).toLocaleDateString() : '-'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%' }}>
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>SECTOR EVALUADO</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{sector || '-'}</span>
                        </div>
                        <div style={{ padding: '0.8rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>DESCRIPCIÓN TAREAS</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{descripcionActividad || '-'}</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layout size={20} color="#2563eb" /> Requerimiento Legal (Dec 351/79)
                    </h3>
                    <div style={{ border: '2px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: '#f8fafc', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Tipo de Tarea Visual</div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{tipoTarea || '-'}</div>
                        </div>
                        <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Sun size={28} color="#eab308" />
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Ilum. Mínima (Lux)</div>
                                <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#2563eb' }}>{luxRequerido || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lightbulb size={20} color="#eab308" /> Mediciones Obtenidas
                    </h3>
                    <div style={{ border: '2px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', background: '#f8fafc', padding: '0.8rem', borderBottom: '2px solid #e2e8f0', fontWeight: 800, fontSize: '0.75rem', color: '#64748b' }}>
                            <div>Punto Exacto / Puesto de Trabajo</div>
                            <div style={{ textAlign: 'center' }}>Lux Medido</div>
                        </div>
                        {meds.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>No hay mediciones registradas.</div>
                        ) : (
                            meds.map((m, idx) => (
                                <div key={m.id || idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '0.8rem', padding: '0.8rem', borderBottom: idx === meds.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                    <div style={{ fontWeight: 700, color: '#334155' }}>{m.ubicacion || '-'}</div>
                                    <div style={{ fontWeight: 900, textAlign: 'center', color: '#1e293b' }}>{m.luxMedido}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{ pageBreakInside: 'avoid', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calculator size={20} color="#2563eb" /> Evaluación Normativa
                    </h3>
                    <div style={{ border: `2px solid ${results?.cumplePromedio ? '#10b981' : '#ef4444'}`, borderRadius: '10px', padding: '1.2rem', background: results?.cumplePromedio ? '#f0fdf4' : '#fef2f2', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Promedio Registrado</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: results?.cumplePromedio ? '#16a34a' : '#dc2626' }}>{results?.promedioLux || 0} <span style={{ fontSize: '1rem', fontWeight: 700 }}>Lux</span></div>
                        </div>
                        <div style={{ flex: 1, borderLeft: `2px solid ${results?.cumplePromedio ? '#bbf7d0' : '#fecaca'}`, paddingLeft: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#475569', fontWeight: 600 }}>Dec 351/79 Req:</span>
                                <span style={{ fontWeight: 800, color: '#1e293b' }}>{luxRequerido || 0} Lux</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#475569', fontWeight: 600 }}>Puntos que Cumplen:</span>
                                <span style={{ fontWeight: 800, color: '#16a34a' }}>{results?.puntosCumplen || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: '#475569', fontWeight: 600 }}>Puntos Deficientes:</span>
                                <span style={{ fontWeight: 800, color: (results?.puntosNoCumplen || 0) > 0 ? '#dc2626' : '#1e293b' }}>{results?.puntosNoCumplen || 0}</span>
                            </div>
                        </div>
                        <div style={{ padding: '0.8rem 1.5rem', background: results?.cumplePromedio ? '#16a34a' : '#dc2626', color: '#ffffff', borderRadius: '30px', fontWeight: 900, letterSpacing: '1px' }}>
                            {results?.cumplePromedio ? 'CUMPLE' : 'NO CUMPLE'}
                        </div>
                    </div>
                </div>

                {conclusion && (
                    <div style={{ pageBreakInside: 'avoid', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.2rem', background: '#fafafa', marginBottom: '2rem' }}>
                        <h3 style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#1e293b', fontWeight: 800 }}>
                            <FileText size={18} color="#2563eb" /> Conclusión Profesional
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {conclusion}
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid', borderTop: '2px solid #e2e8f0' }}>
                    <div style={{ textAlign: 'center', width: '35%' }}>
                        <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {data.professionalSignature && <img src={data.professionalSignature} alt="Firma Profesional" style={{ height: '100%', objectFit: 'contain' }} />}
                        </div>
                        <div style={{ borderTop: '2px solid #1e293b', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', color: '#1e293b' }}>{(data.professionalName || 'PROFESIONAL HYS').toUpperCase()}</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Mat.: {data.professionalLicense || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
