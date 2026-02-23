import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, FileText, Calendar, MapPin, User, Building } from 'lucide-react';

export default function ReportsReport() {
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);
    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

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
            {/* Control Panel - Absolute Print Hide */}
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
                paddingBottom: '5rem',
                background: '#ffffff',
                color: '#1e293b',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                {/* Header with Professional Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-primary)', paddingBottom: '2rem', marginBottom: '2.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: 900, tracking: '-1px' }}>CHECK LIST</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {report.template === 'general' ? 'Informe Técnico' :
                                report.template === 'accident' ? 'Registro de Accidente' :
                                    report.template === 'training' ? 'Capacitación de Personal' :
                                        report.template === 'rgrl' ? 'RGRL' : 'EPP'}
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

                {/* Main Content Area / Observations */}
                <div style={{ marginBottom: '1rem', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>OBSERVACIONES</div>
                <div style={{ marginBottom: '4rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1.05rem', color: '#1e293b', borderTop: '2px solid #f1f5f9', paddingTop: '1rem' }}>
                    {report.content || 'Sin observaciones registradas.'}
                </div>

                {/* Personnel List Table if applicable */}
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

                {/* THREE-COLUMN SIGNATURE GRID / CONTROLS */}
                <div className="no-print mt-10 mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 justify-between items-center text-xs font-bold text-slate-700">
                    <div>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.operator} onChange={e => setShowSignatures(s => ({ ...s, operator: e.target.checked }))} className="w-4 h-4 accent-emerald-600" /> Operador
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.supervisor} onChange={e => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))} className="w-4 h-4 accent-emerald-600" /> Supervisor
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.professional} onChange={e => setShowSignatures(s => ({ ...s, professional: e.target.checked }))} className="w-4 h-4 accent-emerald-600" /> Profesional
                        </label>
                    </div>
                </div>

                <div className="signature-grid" style={{
                    marginTop: 'auto',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'flex-start',
                    gap: '2rem',
                    paddingTop: '3rem',
                    borderTop: '2px dashed #e2e8f0'
                }}>
                    {showSignatures.operator && (
                        <div style={{ flex: 1, textAlign: 'center', paddingTop: '60px' }}>
                            <div style={{ borderTop: '2px solid #000', paddingTop: '0.5rem' }}>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#1e293b', textTransform: 'uppercase' }}>OPERADOR</p>
                                <p style={{ margin: '0.1rem 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Firma y DNI</p>
                            </div>
                        </div>
                    )}

                    {showSignatures.supervisor && (
                        <div style={{ flex: 1, textAlign: 'center', paddingTop: '60px' }}>
                            <div style={{ borderTop: '2px solid #000', paddingTop: '0.5rem' }}>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#1e293b', textTransform: 'uppercase' }}>SUPERVISOR / RESPONSABLE</p>
                                <p style={{ margin: '0.1rem 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Firma y DNI</p>
                            </div>
                        </div>
                    )}

                    {showSignatures.professional && (
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                {signature?.signature || signature?.stamp ? (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                                        {signature.signature && <img src={signature.signature} alt="Firma" style={{ maxWidth: '100px', maxHeight: '60px' }} />}
                                        {signature.stamp && <img src={signature.stamp} alt="Sello" style={{ maxWidth: '60px', maxHeight: '60px' }} />}
                                    </div>
                                ) : (
                                    <div style={{ height: '60px' }}></div>
                                )}
                            </div>
                            <div style={{ borderTop: '2px solid #000', paddingTop: '0.5rem' }}>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#1e293b', textTransform: 'uppercase' }}>{profile?.name || report.responsable}</p>
                                <p style={{ margin: '0.1rem 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PROFESIONAL ACTUANTE</p>
                                {profile?.license && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>Mat: {profile.license}</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Legal */}
                <div style={{ width: '100%', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: '3rem', fontStyle: 'italic' }}>
                    Documento generado por Asistente de Higiene y Seguridad - Conforme a Ley 19.587 / Dec. 351/79
                </div>
            </div>

            {/* Accesos Rápidos */}
            <div className="no-print" style={{ textAlign: 'center', marginTop: '3rem' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Reporte de Sistema de Gestión de Higiene y Seguridad</p>
            </div>
        </div>
    );
}
