import React, { useRef } from 'react';
import { ArrowLeft, Printer, Calendar, MapPin, CheckSquare, Clock, Users, Flame } from 'lucide-react';

export default function DrillPdfGenerator({ report, onBack }) {
    // Obtener logo de empresa
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';
    const componentRef = useRef();

    const safeEmpresa = (report?.empresa || 'Empresa').replace(/\s+/g, '_');
    const safeFecha = report?.fecha || new Date().toISOString().split('T')[0];

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header controls (not printed) */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Previsualización del Acta</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={handlePrint} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Printer size={18} /> Imprimir / Exportar PDF
                    </button>
                </div>
            </div>

            {/* Printable Document Area */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div
                    id="pdf-content"
                    className="pdf-container card print-area"
                    ref={componentRef}
                    style={{
                        width: '100%', maxWidth: '210mm', minHeight: '297mm',
                        padding: '15mm 20mm', background: '#ffffff', color: '#000000',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                        boxSizing: 'border-box', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
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
                                border: 1px solid #1e293b !important;
                                border-radius: 0 !important; 
                            }
                        `}
                    </style>

                    {/* Document Header */}
                    <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '20pt', color: '#1e293b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                                ACTA DE SIMULACRO DE EVACUACIÓN
                            </h1>
                            <div style={{ display: 'flex', gap: '1.5rem', color: '#475569', fontSize: '10pt' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><strong>Empresa:</strong> {report?.empresa || 'N/A'}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><strong>Fecha:</strong> {report?.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <p style={{ fontSize: '10pt', color: '#334155', textAlign: 'justify', marginBottom: '20px', lineHeight: '1.6' }}>
                        En cumplimiento con la legislación vigente en materia de Higiene y Seguridad Laboral
                        y el Plan de Contingencias de la organización, se certifica la realización de un
                        simulacro práctico de evacuación, registrándose los siguientes parámetros estructurales y de comportamiento.
                    </p>

                    {/* Hipótesis and Timing */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '8px 12px', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', fontSize: '10pt', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e293b' }}>
                                <Flame size={16} color="#ef4444" /> HIPÓTESIS DEL EVENTO
                            </div>
                            <div style={{ padding: '12px', fontSize: '10pt' }}>
                                <div style={{ marginBottom: '8px' }}><strong>Tipo de Emergencia:</strong> {report?.hipotesis || 'N/A'}</div>
                                <div><strong>Sector/Foco de Origen:</strong> {report?.origen || 'N/A'}</div>
                                <div style={{ marginTop: '8px' }}><strong>Hora de Alarma:</strong> {report?.hora || '--:--'} hs</div>
                            </div>
                        </div>

                        <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '8px 12px', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', fontSize: '10pt', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e293b' }}>
                                <Clock size={16} color="#3b82f6" /> DESPLIEGUE TEMPORAL
                            </div>
                            <div style={{ padding: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '9pt', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Tiempo Total Evacuación</div>
                                <div style={{ fontSize: '28pt', fontWeight: 900, color: '#dc2626', lineHeight: 1, margin: '8px 0' }}>
                                    {report?.tiempoVisual || '00:00'}
                                </div>
                                <div style={{ fontSize: '9pt', color: '#475569' }}>Minutos : Segundos</div>
                            </div>
                        </div>
                    </div>

                    {/* Población y Vías */}
                    <div style={{ marginBottom: '1.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ background: '#f1f5f9', padding: '8px 12px', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', fontSize: '10pt', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Users size={16} color="#8b5cf6" /> POBLACIÓN Y ESTADÍSTICAS
                        </div>
                        <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '10pt' }}>
                            <div><strong>Personas Evacuadas:</strong> <span style={{ fontSize: '12pt', fontWeight: 900 }}>{report?.evacuados || '-'}</span></div>
                            <div><strong>Heridos Simulados:</strong> <span style={{ fontSize: '12pt', fontWeight: 900, color: (report?.heridosSimulados || 0) > 0 ? '#ef4444' : '#1e293b' }}>{report?.heridosSimulados || '0'}</span></div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <strong>Puntos de Encuentro Utilizados:</strong>
                                <p style={{ margin: '4px 0 0 0', background: '#f8fafc', padding: '8px', borderLeft: '3px solid #cbd5e1', minHeight: '30px' }}>
                                    {report?.puntosEncuentro || 'No registrados'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Evaluación Checklist */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>
                            EVALUACIÓN DEL DESEMPEÑO
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                            <tbody>
                                <tr style={{ pageBreakInside: 'avoid' }}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', width: '50%' }}>¿La alarma fue perfectamente audible en todos los sectores afectados?</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                                        {report?.alarmaSonó === 'Sí' ? 'SÍ, Audible' : (report?.alarmaSonó || '-')}
                                    </td>
                                </tr>
                                <tr style={{ pageBreakInside: 'avoid' }}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc' }}>¿Se cumplieron los roles de emergencia (guías, líderes de encuentro)?</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                                        {report?.rolCumplido || '-'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Observaciones */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>
                            OBSERVACIONES Y OPORTUNIDADES DE MEJORA
                        </div>
                        <div style={{
                            border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', minHeight: '100px',
                            fontSize: '10pt', background: '#fefce8', color: '#422006'
                        }}>
                            {report?.observaciones ? report.observaciones : 'No se registraron observaciones o desvíos técnicos durante el ejercicio.'}
                        </div>
                    </div>

                    {/* Signatures Area */}
                    <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid' }}>
                        <div style={{ width: '45%', textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px solid #1e293b', height: '50px', marginBottom: '5px' }}></div>
                            <div style={{ fontSize: '10pt', color: '#1e293b', fontWeight: 'bold' }}>{report?.evaluador || '-'}</div>
                            <div style={{ fontSize: '8pt', color: '#64748b' }}>Responsable Higiene y Seguridad</div>
                        </div>
                        <div style={{ width: '45%', textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px solid #1e293b', height: '50px', marginBottom: '5px' }}></div>
                            <div style={{ fontSize: '10pt', color: '#1e293b', fontWeight: 'bold' }}>Representante Empresa</div>
                            <div style={{ fontSize: '8pt', color: '#64748b' }}>Firma y Aclaración</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
