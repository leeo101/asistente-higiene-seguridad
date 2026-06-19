import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Printer, Share2, Download, CheckCircle2, Info, Building2, User, HelpCircle, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import { toast } from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { getCountryNormativa } from '../data/legislationData';

export default function ReportsReport(): React.ReactElement | null {
  const { requirePro } = usePaywall();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [report, setReport] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);
    const [showShare, setShowShare] = useState(false);
    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    const savedData = localStorage.getItem('personalData');
    const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
    const countryNorms = getCountryNormativa(userCountry);

    useEffect(() => {
        const current = localStorage.getItem('current_report');
        const prof = localStorage.getItem('personalData');
        const sig = localStorage.getItem('signatureStampData');

        if (current) {
            const parsed = JSON.parse(current);
            setReport(parsed);
            if (parsed.showSignatures) {
                setShowSignatures(parsed.showSignatures);
            }
        }
        if (prof) setProfile(JSON.parse(prof));
        if (sig) setSignature(JSON.parse(sig));
    }, []);

    if (!report) return <div className="container">Cargando...</div>;

    const handlePrint = () => requirePro(() => window.print());

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <ShareModal
                isOpen={showShare}
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Informe – ${report.company || ''}`}
                text={`📋 Informe de Higiene y Seguridad\n🏗️ Empresa: ${report.company}\n📍 Ubicación: ${report.location || '-'}\n📅 Fecha: ${new Date(report.date).toLocaleDateString('es-AR')}\n\nGenerado con Asistente H&S`}
                rawMessage={`📋 Informe de Higiene y Seguridad\n🏗️ Empresa: ${report.company}\n📍 Ubicación: ${report.location || '-'}\n📅 Fecha: ${new Date(report.date).toLocaleDateString('es-AR')}\n\nGenerado con Asistente H&S`}
                elementIdToPrint="pdf-content"
                fileName={`Informe_${report.company}.pdf`}
            />
            {/* Control Panel - Absolute Print Hide */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <></>
            </div>

            <div id="pdf-content" className="card report-print" style={{
                padding: '3rem',
                minHeight: '29.7cm',
                height: 'auto',
                paddingBottom: '5rem',
                background: '#ffffff',
                color: '#1e293b',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                {/* Header with Professional Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-primary)', paddingBottom: '2rem', marginBottom: '2.5rem', gap: '1.5rem' }} className="flex-col sm:flex-row">
                    <div style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                        <CompanyLogo style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
                        <div>
                            <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>INFORME</h1>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {report.template === 'general' ? 'Informe Técnico' :
                                    report.template === 'accident' ? 'Registro de Accidente' :
                                        report.template === 'training' ? 'Capacitación de Personal' :
                                            report.template === 'rgrl' ? 'RGRL' : 'EPP'}
                            </p>
                        </div>
                    </div>
                    {profile && (
                        <div style={{ textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }} className="md:text-right md:border-t-0 md:border-l border-[#e2e8f0] pt-4 md:pt-0">
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: '#1e293b' }}>{profile.name}</p>
                            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#475569' }}>{profile.profession}</p>
                            {profile.license && <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Mat: {profile.license}</p>}
                        </div>
                    )}
                </div>

                {/* Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Building2 size={20} color="var(--color-primary)" />
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
                            <p style={{ margin: 0, fontWeight: 600 }}>{new Date(report.date).toLocaleDateString('es-AR')}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area / Observations */}
                <div style={{ marginBottom: '1rem', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>OBSERVACIONES</div>
                <div style={{ marginBottom: '4rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: '1.6', fontSize: '1.05rem', color: '#1e293b', borderTop: '2px solid #f1f5f9', paddingTop: '1rem' }}>
                    {report.content || 'Sin observaciones registradas.'}
                </div>

                {/* Personnel List Table if applicable */}
                {(report.template === 'training' || report.template === 'epp') && report.personnel && report.personnel.length > 0 && (
                    <div style={{ marginBottom: '4rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            Personal Interviniente / Firmas
                        </h4>
                        <div className="overflow-x-auto w-full">
                            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
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
                    </div>
                )}

                {/* Custom visual switches */}
                <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center', marginTop: '2.5rem' }}>
                    <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {[
                            { id: 'operator', label: 'Operador / Empleado' },
                            { id: 'supervisor', label: 'Supervisor / Responsable' },
                            { id: 'professional', label: 'Profesional HYS' }
                        ].map(sig => {
                            const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                            return (
                                <label
                                    key={sig.id}
                                    className="flex items-center gap-2 cursor-pointer select-none"
                                    style={{
                                        padding: '0.55rem 1.1rem',
                                        borderRadius: 'var(--radius-full)',
                                        border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                                        color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',
                                        fontWeight: 750,
                                        fontSize: '0.8rem',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={e => setShowSignatures(s => ({ ...s, [sig.id]: e.target.checked }))}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '4px',
                                        border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                                        background: isChecked ? 'var(--color-primary)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        {isChecked && <CheckCircle2 size={12} color="white" />}
                                    </div>
                                    {sig.label}
                                </label>
                            );
                        })}
                    </div>
                </div>

                <PdfSignatures
                    data={{
                        ...report,
                        professionalSignature: report.signature || signature?.signature,
                        professionalStamp: signature?.stamp,
                        professionalName: profile?.name || report.responsable,
                        professionalLicense: profile?.license
                    }}
                    box1={showSignatures.operator ? {
                        title: 'OPERADOR',
                        subtitle: 'Firma / Aclaración',
                        signatureUrl: report.operatorSignature || null,
                        isProfessional: false
                    } : null}
                    box2={showSignatures.supervisor ? {
                        title: 'SUPERVISOR',
                        subtitle: 'Firma / Aclaración',
                        signatureUrl: report.supervisorSignature || null,
                        isProfessional: false
                    } : null}
                    box3={showSignatures.professional ? {
                        title: 'PROFESIONAL ACTUANTE',
                        subtitle: ((profile?.name || report.responsable) ? 'Firma y Sello' : 'Firma y Sello').toUpperCase(),
                        signatureUrl: report.signature || signature?.signature || null,
                        isProfessional: true,
                        license: profile?.license
                    } : null}
                />

                {/* Footer Legal */}
                <div style={{ width: '100%', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: '3rem', fontStyle: 'italic' }}>
                    Documento generado por Asistente de Higiene y Seguridad - Conforme a {countryNorms.general}
                </div>
                <PdfBrandingFooter />
            </div>

            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button onClick={() => toast.success('Este reporte ya se encuentra guardado en tu historial.')} className="btn-floating-action" style={{ background: '#36B37E', color: 'white' }}>
                    <CheckCircle2 size={18} /> GUARDADO
                </button>
                <button onClick={() => requirePro(() => setShowShare(true))} className="btn-floating-action" style={{ background: '#0052CC', color: 'white' }}>
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button onClick={handlePrint} className="btn-floating-action" style={{ background: '#FF8B00', color: 'white' }}>
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>
        </div>
    );
}
