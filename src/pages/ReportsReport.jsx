import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, FileText, Calendar, MapPin, User, Building } from 'lucide-react';

export default function ReportsReport() {
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);

    useEffect(() => {
        const current = localStorage.getItem('current_report');
        const prof = localStorage.getItem('personalData');
        const sig = localStorage.getItem('signatureStampData');

        if (current) setReport(JSON.parse(current));
        if (prof) setProfile(JSON.parse(prof));
        if (sig) setSignature(JSON.parse(sig));
    }, []);

    if (!report) return <div className="container">Cargando...</div>;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/reports')} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft size={20} /> Volver a Formulario
                </button>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={handlePrint} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Printer size={18} /> Imprimir / PDF
                    </button>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Share2 size={18} /> Compartir
                    </button>
                </div>
            </div>

            <div className="card report-print" style={{
                padding: '3rem',
                minHeight: '29.7cm',
                background: '#ffffff',
                color: '#1e293b',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                {/* Header with Professional Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-primary)', paddingBottom: '2rem', marginBottom: '2.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '2rem', fontWeight: 800 }}>{report.title}</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {report.template === 'general' ? 'Informe Técnico de Higiene y Seguridad' :
                                report.template === 'accident' ? 'Registro de Accidente Laboral' :
                                    report.template === 'training' ? 'Registro de Capacitación de Personal' :
                                        report.template === 'rgrl' ? 'Relevamiento General de Riesgos Laborales' : 'Entrega de Elementos de Protección Personal'}
                        </p>
                    </div>
                    {profile && (
                        <div style={{ textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: '#1e293b' }}>{profile.name}</p>
                            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#475569' }}>{profile.profession}</p>
                            {profile.license && <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Mat: {profile.license}</p>}
                        </div>
                    )}
                </div>

                {/* Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Building size={20} color="var(--color-primary)" />
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Empresa</p>
                            <p style={{ margin: 0, fontWeight: 600 }}>{report.company}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <MapPin size={20} color="var(--color-primary)" />
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Ubicación</p>
                            <p style={{ margin: 0, fontWeight: 600 }}>{report.location || 'N/A'}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Calendar size={20} color="var(--color-primary)" />
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Fecha</p>
                            <p style={{ margin: 0, fontWeight: 600 }}>{new Date(report.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Special Template Data */}
                {(report.template === 'training' || report.template === 'accident') && (
                    <div style={{ marginBottom: '2.5rem', padding: '1.5rem', borderLeft: '4px solid var(--color-primary)', background: '#f0f7ff', color: '#1e293b' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)' }}>Datos del Registro</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {report.template === 'training' && (
                                <>
                                    <p style={{ margin: 0 }}><strong>Tema:</strong> {report.extraFields.topic}</p>
                                    <p style={{ margin: 0 }}><strong>Duración:</strong> {report.extraFields.duration} minutos</p>
                                </>
                            )}
                            {report.template === 'accident' && (
                                <>
                                    <p style={{ margin: 0 }}><strong>Hora:</strong> {report.extraFields.eventTime}</p>
                                    <p style={{ margin: 0 }}><strong>Afectado:</strong> {report.extraFields.affectedPerson}</p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div style={{ marginBottom: '3rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1.05rem', color: '#1e293b' }}>
                    {report.content || 'Sin contenido adicional registrado.'}
                </div>

                {/* Personnel List Table */}
                {(report.template === 'training' || report.template === 'epp') && report.personnel && report.personnel.length > 0 && (
                    <div style={{ marginBottom: '4rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            Personal Interviniente / Firmas
                        </h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9' }}>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', color: '#475569' }}>Nombre y Apellido</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', color: '#475569' }}>DNI / CUIL</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', width: '250px', color: '#475569' }}>Firma</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.personnel.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', color: '#1e293b' }}>{p.name}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', color: '#1e293b' }}>{p.dni}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', height: '65px', verticalAlign: 'bottom', textAlign: 'center' }}>
                                            <div style={{ borderTop: '1px dotted #000', width: '80%', margin: '0 auto', fontSize: '0.7rem', color: '#64748b' }}>
                                                Firma del Trabajador
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Signature Area */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '2rem' }}>
                    {/* Stamp */}
                    <div style={{ height: '120px', display: 'flex', alignItems: 'center' }}>
                        {signature?.stamp && (
                            <img src={signature.stamp} alt="Sello" style={{ maxWidth: '140px', opacity: 0.9 }} />
                        )}
                    </div>

                    {/* Professional Signature */}
                    <div style={{ textAlign: 'center', width: '300px' }}>
                        {signature?.signature ? (
                            <img src={signature.signature} alt="Firma" style={{ maxWidth: '220px', maxHeight: '120px', marginBottom: '0.5rem' }} />
                        ) : (
                            <div style={{ height: '100px' }}></div>
                        )}
                        <div style={{ borderTop: '2px solid #000', paddingTop: '0.8rem' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{profile?.name || report.responsable}</p>
                            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#475569' }}>Responsable de Higiene y Seguridad</p>
                            {profile?.license && (
                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                                    Matrícula: <span style={{ color: 'var(--color-primary)' }}>{profile.license}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Legal */}
                <div style={{ position: 'absolute', bottom: '30px', left: '0', width: '100%', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                    Documento generado por Asistente de Higiene y Seguridad - Conforme a Ley 19.587
                </div>
            </div>

            <style>
                {`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    .report-print { border: none !important; box-shadow: none !important; width: 21cm !important; margin: 0 auto !important; position: relative !important; }
                    .card { border: none !important; }
                }
                `}
            </style>
        </div>
    );
}
