import React from 'react';
import { Lightbulb, Sun, Layout, FileText, Building2, MapPin, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import { getCountryNormativa } from '../data/legislationData';

export default function LightingPdfGenerator({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    const savedPersonal = localStorage.getItem('personalData');
    const userCountry = savedPersonal ? (JSON.parse(savedPersonal).country || 'argentina') : 'argentina';
    const countryNorms = getCountryNormativa(userCountry);

    // Firma profesional desde localStorage
    let actSignature = data.professionalSignature || null;
    let actName = data.professionalName || null;
    let actLic = data.professionalLicense || null;
    if (!actSignature) {
        try {
            const lsStamp = localStorage.getItem('signatureStampData');
            const legacySig = localStorage.getItem('capturedSignature');
            if (lsStamp) actSignature = JSON.parse(lsStamp).signature;
            else if (legacySig) actSignature = legacySig;
            if (savedPersonal) {
                const pd = JSON.parse(savedPersonal);
                actName = actName || pd.name;
                actLic = actLic || pd.license;
            }
        } catch (e) { }
    }

    const { empresa, fecha, sector, descripcionActividad, tipoTarea, luxRequerido, mediciones, results, conclusion } = data;
    const meds = mediciones || [];
    const cumple = results?.cumplePromedio;

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '12mm 15mm', background: '#ffffff', color: '#1e293b',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '9pt',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    borderTop: cumple ? '12px solid #eab308' : '12px solid #dc2626'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                            width: 100% !important; max-width: none !important;
                            border-top: ${cumple ? '12px solid #eab308' : '12px solid #dc2626'} !important;
                            border-radius: 0 !important; min-height: auto !important; height: auto !important;
                        }
                    `}
                </style>

                {/* Header Tripartito */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.5rem', width: '100%' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: cumple ? '#d97706' : '#dc2626' }}>
                            {cumple ? 'Doc. Estudio de Iluminación' : '⚠ DEFICIENCIA DE ILUMINACIÓN'}
                        </p>
                    </div>

                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>ILUMINACIÓN</h1>
                        <div style={{ marginTop: '0.3rem', background: cumple ? '#eab308' : '#dc2626', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                            ESTUDIO DE NIVELES — {countryNorms.lighting}
                        </div>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <CompanyLogo style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }} />
                    </div>
                </div>

                {/* Datos del establecimiento */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ padding: '0.8rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Building2 size={12}/> EMPRESA / CLIENTE</span>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginTop: '0.2rem' }}>{empresa || '-'}</div>
                        </div>
                        <div style={{ padding: '0.8rem 1rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12}/> FECHA DE MEDICIÓN</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{fecha ? new Date(fecha).toLocaleDateString('es-AR') : '-'}</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#ffffff' }}>
                        <div style={{ padding: '0.8rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12}/> SECTOR EVALUADO</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{sector || '-'}</div>
                        </div>
                        <div style={{ padding: '0.8rem 1rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>DESCRIPCIÓN DE TAREAS</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{descripcionActividad || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Requerimiento legal */}
                <div style={{ border: '1px solid #fde68a', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden', background: '#fffbeb', display: 'flex', gap: 0 }}>
                    <div style={{ flex: 2, padding: '1rem 1.2rem', borderRight: '1px solid #fde68a' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Layout size={12}/> TIPO DE TAREA VISUAL</span>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', marginTop: '0.25rem' }}>{tipoTarea || '-'}</div>
                    </div>
                    <div style={{ flex: 1, padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#fef3c7' }}>
                        <Sun size={28} color="#d97706" />
                        <div>
                            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>ILUM. MÍNIMA EXIGIDA</div>
                            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#d97706', lineHeight: 1 }}>{luxRequerido || 0} <span style={{ fontSize: '0.8rem', color: '#92400e' }}>Lux</span></div>
                        </div>
                    </div>
                </div>

                {/* Tabla de mediciones */}
                <div style={{ marginBottom: '1.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ background: '#1e293b', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lightbulb size={15} color="#fbbf24" />
                        <span style={{ fontWeight: 900, fontSize: '0.78rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PUNTOS DE MEDICIÓN — {meds.length} REGISTRO{meds.length !== 1 ? 'S' : ''}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '0.5rem 0.4rem', width: '5%', textAlign: 'center', fontWeight: 800, color: '#64748b', border: '1px solid #e2e8f0', fontSize: '0.65rem' }}>N°</th>
                                <th style={{ padding: '0.5rem 0.8rem', textAlign: 'left', fontWeight: 800, color: '#64748b', border: '1px solid #e2e8f0', fontSize: '0.65rem' }}>PUNTO / PUESTO DE TRABAJO</th>
                                <th style={{ padding: '0.5rem 0.8rem', width: '18%', textAlign: 'center', fontWeight: 800, color: '#64748b', border: '1px solid #e2e8f0', fontSize: '0.65rem' }}>LUX MEDIDO</th>
                                <th style={{ padding: '0.5rem 0.8rem', width: '15%', textAlign: 'center', fontWeight: 800, color: '#64748b', border: '1px solid #e2e8f0', fontSize: '0.65rem' }}>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meds.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', border: '1px solid #e2e8f0' }}>Sin mediciones registradas</td></tr>
                            ) : meds.map((m, idx) => {
                                const val = parseFloat(m.luxMedido) || 0;
                                const ok = val >= (parseFloat(luxRequerido) || 0);
                                return (
                                    <tr key={m.id || idx} style={{ background: ok ? (idx % 2 === 0 ? '#ffffff' : '#f8fafc') : '#fef2f2', pageBreakInside: 'avoid' }}>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.5rem 0.4rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{idx + 1}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.5rem 0.8rem', fontWeight: 600, color: '#334155' }}>{m.ubicacion || '-'}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.5rem 0.8rem', textAlign: 'center', fontWeight: 900, color: ok ? '#15803d' : '#dc2626', fontSize: '1rem' }}>{m.luxMedido}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.5rem 0.8rem', textAlign: 'center' }}>
                                            {ok
                                                ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 900, fontSize: '0.7rem' }}>✓ OK</span>
                                                : <span style={{ background: '#fecaca', color: '#dc2626', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 900, fontSize: '0.7rem' }}>✗ BAJO</span>
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Evaluación normativa */}
                <div style={{ border: `1.5px solid ${cumple ? '#86efac' : '#fca5a5'}`, borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                    <div style={{ background: cumple ? '#f0fdf4' : '#fef2f2', padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>PROMEDIO REGISTRADO</div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: cumple ? '#16a34a' : '#dc2626', lineHeight: 1 }}>
                                {results?.promedioLux || 0} <span style={{ fontSize: '1rem', fontWeight: 700 }}>Lux</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '120px', padding: '0 1.2rem', borderLeft: `1px solid ${cumple ? '#bbf7d0' : '#fecaca'}` }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.3rem' }}>Req. {countryNorms.lighting.split(' ')[0]}: <strong style={{ color: '#1e293b' }}>{luxRequerido || 0} Lux</strong></div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.3rem' }}>Cumplen: <strong style={{ color: '#16a34a' }}>{results?.puntosCumplen || 0}</strong></div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Deficientes: <strong style={{ color: '#dc2626' }}>{results?.puntosNoCumplen || 0}</strong></div>
                        </div>
                        <div style={{ padding: '0.7rem 1.5rem', background: cumple ? '#16a34a' : '#dc2626', color: '#fff', borderRadius: '8px', fontWeight: 900, fontSize: '1rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {cumple ? <CheckCircle size={20} /> : <AlertTriangle size={20} />} {cumple ? 'CUMPLE' : 'NO CUMPLE'}
                        </div>
                    </div>
                </div>

                {/* Conclusión */}
                {conclusion && (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                        <div style={{ background: '#334155', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FileText size={14} color="#fff" />
                            <span style={{ fontWeight: 900, fontSize: '0.72rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CONCLUSIÓN TÉCNICA PROFESIONAL</span>
                        </div>
                        <div style={{ padding: '0.9rem 1.2rem', fontSize: '0.83rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6, background: '#f8fafc', fontWeight: 600 }}>
                            {conclusion}
                        </div>
                    </div>
                )}

                {/* Firmas */}
                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid', display: 'flex', gap: '1rem', paddingBottom: '1rem', justifyContent: 'center' }}>
                    <div style={{ flex: '0 1 32%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Firma original</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>OPERADOR / RESPONSABLE</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Toma de conocimiento</p>
                    </div>

                    <div style={{ flex: '0 1 32%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Firma original</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>SUPERVISOR H&S</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Aprobación del estudio</p>
                    </div>

                    <div style={{ flex: '0 1 32%', border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #86efac', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                            {actSignature ? (
                                <img src={actSignature} alt="Firma Profesional" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: '0.6rem', color: '#86efac' }}>Sello y Firma Digital</span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#166534' }}>PROFESIONAL ACTUANTE HSE</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#15803d', fontWeight: 600 }}>{actName || 'Especialista H&S'}</p>
                        {actLic && <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#16a34a' }}>Mat: {actLic}</p>}
                    </div>
                </div>

                <PdfBrandingFooter />
            </div>
        </div>
    );
}
