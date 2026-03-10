import React, { useRef } from 'react';
import { ArrowLeft, Printer, Users, Calendar, MapPin, Clock, BookOpen, Briefcase } from 'lucide-react';

export default function TrainingPdfGenerator({ training, onBack }) {
    const componentRef = useRef();

    const safeTema = (training?.tema || 'Capacitacion').replace(/\s+/g, '_');
    const safeFecha = training?.fecha || new Date().toISOString().split('T')[0];

    const handlePrint = () => {
        window.print();
    };

    const isLandscape = (training?.asistentes?.length || 0) > 20;

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
                    className="pdf-container card print-area"
                    ref={componentRef}
                    style={{
                        width: isLandscape ? '297mm' : '210mm',
                        minHeight: isLandscape ? '210mm' : '297mm',
                        padding: '15mm', background: '#ffffff', color: '#000000',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                        boxSizing: 'border-box'
                    }}
                >
                    <style type="text/css" media="print">
                        {`
                            @page { 
                                size: A4 ${isLandscape ? 'landscape' : 'portrait'}; 
                                margin: 10mm; 
                            }
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
                    <div style={{ display: 'flex', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '20px' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <h1 style={{ margin: '0 0 5px 0', fontSize: '18pt', color: '#1e293b', fontWeight: 900, textTransform: 'uppercase' }}>
                                Planilla de Asistencia a Capacitación
                            </h1>
                            <p style={{ margin: 0, fontSize: '10pt', color: '#475569' }}>
                                Registro obligatorio de inducción y entrenamiento en Higiene y Seguridad
                            </p>
                        </div>
                    </div>

                    {/* Training Metadata Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '10pt' }}>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', fontWeight: 'bold', width: '20%' }}>Tema dictado:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', width: '30%', fontWeight: 'bold' }}>{training.tema}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', fontWeight: 'bold', width: '20%' }}>Fecha:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', width: '30%' }}>
                                    {training?.fecha ? new Date(training.fecha + 'T12:00:00Z').toLocaleDateString() : 'N/A'}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', fontWeight: 'bold' }}>Expositor / Instructor:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{training.expositor}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', fontWeight: 'bold' }}>Duración (Hs):</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{training.duracion}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', fontWeight: 'bold' }}>Lugar / Sector:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{training.ubicacion || 'No especificado'}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', fontWeight: 'bold' }}>Razón Social:</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{training.empresa || 'Aplicable'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <p style={{ fontSize: '9pt', color: '#334155', textAlign: 'justify', marginBottom: '15px' }}>
                        Los abajo firmantes declaran haber recibido, comprendido e internalizado la capacitación en materia de Higiene y Seguridad Laboral
                        sobre el tema detallado arriba, recibiendo respuesta satisfactoria a las consultas realizadas y comprometiéndose a aplicar
                        las normativas y procedimientos en sus labores diarias.
                    </p>

                    {/* Attendees Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '30px' }}>
                        <thead>
                            <tr style={{ background: '#e2e8f0' }}>
                                <th style={{ border: '1px solid #94a3b8', padding: '8px 4px', width: '5%', textAlign: 'center' }}>N°</th>
                                <th style={{ border: '1px solid #94a3b8', padding: '8px', width: '35%', textAlign: 'left' }}>Apellido y Nombres</th>
                                <th style={{ border: '1px solid #94a3b8', padding: '8px', width: '15%', textAlign: 'center' }}>DNI / CUIL</th>
                                <th style={{ border: '1px solid #94a3b8', padding: '8px', width: '25%', textAlign: 'left' }}>Puesto de Trabajo</th>
                                <th style={{ border: '1px solid #94a3b8', padding: '8px', width: '20%', textAlign: 'center' }}>Firma</th>
                            </tr>
                        </thead>
                        <tbody>
                            {training?.asistentes?.map((asist, idx) => (
                                <tr key={idx}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px 4px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 'bold' }}>{asist.nombre}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{asist.dni}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{asist.puesto}</td>
                                    {/* Empty cell for physical signature */}
                                    <td style={{ border: '1px solid #cbd5e1', padding: '20px 8px', textAlign: 'center' }}></td>
                                </tr>
                            ))}
                            {/* Fill with a few empty rows if less than 5 people to make sheet look complete */}
                            {Array.from({ length: Math.max(0, 5 - (training?.asistentes?.length || 0)) }).map((_, i) => (
                                <tr key={`empty-${i}`}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '20px 8px' }}></td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '20px 8px' }}></td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '20px 8px' }}></td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '20px 8px' }}></td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '20px 8px' }}></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Instructor / Responsible Signature Area */}
                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid' }}>
                        <div style={{ width: '250px', textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px solid #64748b', height: '40px', marginBottom: '5px' }}></div>
                            <div style={{ fontSize: '9pt', color: '#1e293b', fontWeight: 'bold' }}>{training?.expositor || '-'}</div>
                            <div style={{ fontSize: '8pt', color: '#64748b' }}>Firma y Aclaración Instructor</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
