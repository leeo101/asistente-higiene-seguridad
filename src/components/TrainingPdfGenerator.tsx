import React, { useRef } from 'react';
import { ArrowLeft, Printer, Users, Calendar, MapPin, Clock, BookOpen, Briefcase, GraduationCap } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function TrainingPdfGenerator({ data, onBack = () => window.history.back(), isHeadless = false }: { data: any, onBack?: () => void, isHeadless?: boolean }): React.ReactElement | null {
    const training = data;
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const isLandscape = (training?.asistentes?.length || 0) > 20;

    // Obtención segura de firma desde personalData
    let actSignature = null;
    let actName = training?.expositor || null;
    let actLic = null;
    
    try {
        const lsPersonal = localStorage.getItem('personalData');
        const lsStamp = localStorage.getItem('signatureStampData');
        const legacySig = localStorage.getItem('capturedSignature');
        
        if (lsStamp) { actSignature = JSON.parse(lsStamp).signature; }
        else if (legacySig) { actSignature = legacySig; }
        
        if (lsPersonal) {
            const pd = JSON.parse(lsPersonal);
            if (!actName || actName === pd.name) {
                actName = pd.name;
                actLic = pd.license;
            }
        }
    } catch(e) {}

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header controls (not printed) */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Previsualización de Planilla</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={handlePrint} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Printer size={18} /> Imprimir / Exportar PDF
                    </button>
                </div>
            </div>

            {/* Printable Document Area */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                <div
                    id="pdf-content"
                    className="pdf-container print-area"
                    ref={componentRef}
                    style={{
                        width: isLandscape ? '297mm' : '210mm',
                        minHeight: isLandscape ? '210mm' : '297mm',
                        padding: '12mm 15mm', background: '#ffffff', color: '#1e293b',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                        boxSizing: 'border-box', margin: '0 auto', fontSize: '9pt',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        borderTop: '12px solid #2563eb'
                    }}
                >
                    <style type="text/css" media="print">
                        {`
                            @page {
                                size: A4 ${isLandscape ? 'landscape' : 'portrait'};
                                margin: 10mm;
                            }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                            .no-print { display: none !important; }
                            .print-area {
                                box-shadow: none !important; margin: 0 !important; padding: 5mm !important; 
                                width: 100% !important; max-width: none !important; 
                                border-top: 12px solid #2563eb !important; border-radius: 0 !important; 
                                min-height: auto !important; height: auto !important;
                            }
                        `}
                    </style>

                    {/* Header Sequence */}
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.8rem', width: '100%' }}>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: '#2563eb' }}>Doc. Reg. Capacitación</p>
                        </div>

                        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.2rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>ENTRENAMIENTO</h1>
                            <div style={{ marginTop: '0.3rem', background: '#3b82f6', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                                PLANILLA OFICIAL DE ASISTENCIA
                            </div>
                        </div>

                        <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <CompanyLogo
                                style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }}
                            />
                        </div>
                    </div>

                    {/* Datos de la Capacitación */}
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.5rem', width: '100%', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <GraduationCap size={14} /> TEMA DICTADO
                            </span>
                            <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#0f172a', marginTop: '0.4rem', lineBreak: 'anywhere' }}>{training.tema || '-'}</div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#ffffff' }}>
                            <div style={{ padding: '0.8rem 1rem', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12}/> FECHA</span>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{training?.fecha ? new Date(training.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : 'N/A'}</div>
                            </div>
                            <div style={{ padding: '0.8rem 1rem', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12}/> DURACIÓN</span>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{training.duracion || 0} Horas</div>
                            </div>
                            <div style={{ padding: '0.8rem 1rem', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12}/> LOCACIÓN</span>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{training.ubicacion || 'No esp.'}</div>
                            </div>
                            <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #cbd5e1' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Briefcase size={12}/> EMPRESA / RAZÓN SOCIAL</span>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{training.empresa || 'Aplicable al sitio'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Texto Legal */}
                    <div style={{ marginBottom: '1.5rem', background: '#f1f5f9', borderLeft: '4px solid #94a3b8', padding: '1rem', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, fontStyle: 'italic', fontWeight: 600 }}>
                            Los abajo firmantes declaran haber recibido, comprendido e internalizado la capacitación técnica impartida en materia de Higiene y Seguridad Laboral 
                            sobre el tema detallado arriba, recibiendo respuesta satisfactoria a las consultas realizadas y comprometiéndose irrevocablemente a aplicar 
                            las normativas preventivas e instrucciones en sus labores diarias para salvaguardar su integridad física y la de sus compañeros.
                        </p>
                    </div>

                    {/* Tabla de Asistentes */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '2rem' }}>
                        <thead>
                            <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                                <th style={{ padding: '0.6rem 0.4rem', width: '5%', textAlign: 'center', fontWeight: 800, border: '1px solid #0f172a' }}>N°</th>
                                <th style={{ padding: '0.6rem 0.8rem', width: '35%', textAlign: 'left', fontWeight: 800, border: '1px solid #0f172a' }}>Apellido y Nombres</th>
                                <th style={{ padding: '0.6rem 0.8rem', width: '15%', textAlign: 'center', fontWeight: 800, border: '1px solid #0f172a' }}>DNI / CUIL</th>
                                <th style={{ padding: '0.6rem 0.8rem', width: '25%', textAlign: 'left', fontWeight: 800, border: '1px solid #0f172a' }}>Puesto de Trabajo</th>
                                <th style={{ padding: '0.6rem 0.8rem', width: '20%', textAlign: 'center', fontWeight: 800, border: '1px solid #0f172a' }}>Firma del Asistente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {training?.asistentes?.map((asist, idx) => (
                                <tr key={idx} style={{ pageBreakInside: 'avoid', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.4rem', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.8rem', fontWeight: 700, color: '#1e293b' }}>{asist.nombre}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.8rem', textAlign: 'center', color: '#334155' }}>{asist.dni}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '0.6rem 0.8rem', color: '#334155' }}>{asist.puesto}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '1rem 0.8rem', textAlign: 'center' }}></td>
                                </tr>
                            ))}
                            {/* Rendimiento de líneas vacías para rellenar */}
                            {Array.from({ length: Math.max(0, 5 - (training?.asistentes?.length || 0)) }).map((_, i) => (
                                <tr key={`empty-${i}`} style={{ pageBreakInside: 'avoid' }}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '1.2rem 0.4rem' }}></td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '1.2rem 0.8rem' }}></td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '1.2rem 0.8rem' }}></td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '1.2rem 0.8rem' }}></td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '1.2rem 0.8rem' }}></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Area de Certificación final y firmas */}
                    <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid', display: 'flex', gap: '1rem', paddingBottom: '1rem', justifyContent: 'center' }}>
                        
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#475569', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>CERTIFICACIÓN DE INSTRUCCIÓN</span>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', fontStyle: 'italic', fontWeight: 600, lineHeight: 1.5, maxWidth: '80%' }}>
                                Por la presente, el instructor certifica que los empleados listados han completado el programa de capacitación, 
                                evaluando satisfactoriamente los contenidos y asumiendo la aptitud requerida.
                            </p>
                        </div>

                        <div style={{ flex: 1, maxWidth: '280px', border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #86efac', paddingBottom: '0.25rem', marginBottom: '0.5rem', position: 'relative' }}>
                                {actSignature ? (
                                    <img src={actSignature} alt="Firma Profesional" style={{ maxHeight: '50px', objectFit: 'contain', zIndex: 2 }} />
                                ) : (
                                    <span style={{ fontSize: '0.6rem', color: '#86efac' }}>Sello y Firma Digital</span>
                                )}
                            </div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#166534' }}>REPRESENTANTE / INSTRUCTOR HSE</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#15803d', fontWeight: 600 }}>
                                {actName}
                            </p>
                            {actLic && (
                                <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#16a34a' }}>Mat: {actLic}</p>
                            )}
                        </div>
                    </div>

                    <PdfBrandingFooter />
                </div>
            </div>
        </div>
    );
}
