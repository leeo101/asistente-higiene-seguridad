import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ArrowLeft, Printer, Share2, CheckCircle2, Building2, MapPin, User, Briefcase, Activity, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import CompanyLogo from '../components/CompanyLogo';
import { usePaywall } from '../hooks/usePaywall';
import { toast } from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

export default function ErgonomicsReport(): React.ReactElement | null {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);
    const [showShare, setShowShare] = useState(false);
    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    useEffect(() => {
        const id = searchParams.get('id');
        const history = JSON.parse(localStorage.getItem('ergonomics_history') || '[]');
        const found = history.find(item => item.id === id);
        if (found) setData(found);

        const savedProfile = localStorage.getItem('personalData');
        if (savedProfile) setProfile(JSON.parse(savedProfile));

        const sig = localStorage.getItem('signatureStampData');
        if (sig) setSignature(JSON.parse(sig));
    }, [searchParams]);

    if (!data) return <div className="container">Estudio no encontrado</div>;

    const handlePrint = () => requirePro(() => window.print());

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <ShareModal
                isOpen={showShare}
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Protocolo Ergonómico – ${data.empresa}`}
                text={`📋 Protocolo de Ergonomía\n🏗️ Empresa: ${data.empresa}\n🪑 Puesto: ${data.puesto}\n📍 Sector: ${data.sector}\n⚠️ Nivel de Riesgo: ${data.riesgo || 'N/A'}\n\nGenerado con Asistente H&S`}
                rawMessage={`📋 Protocolo de Ergonomía\n🏗️ Empresa: ${data.empresa}\n🪑 Puesto: ${data.puesto}\n📍 Sector: ${data.sector}\n⚠️ Nivel de Riesgo: ${data.riesgo || 'N/A'}\n\nGenerado con Asistente H&S`}
                elementIdToPrint="pdf-content"
                fileName={`Ergonomia_${data.empresa}.pdf`}
            />
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
                <button
                    onClick={() => navigate('/ergonomics')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={24} /> Volver
                </button>
            </div>

            <div id="pdf-content" className="report-print print:p-0 print:m-0 print:border-none print:shadow-none print:min-h-0" style={{
                background: 'white',
                color: '#1e293b',
                padding: '12mm 15mm',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                minHeight: '29.7cm',
                height: 'auto',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '9pt',
                borderTop: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '12px solid #dc2626' : '12px solid #2563eb'
            }}>
                {/* Header Tripartito HSE */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.5rem', width: '100%' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '#dc2626' : '#2563eb' }}>Doc. Ergonomía Laboral</p>
                    </div>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.2rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>ERGONOMÍA</h1>
                        <div style={{ marginTop: '0.3rem', background: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '#dc2626' : '#3b82f6', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                            PROTOCOLO — RES. SRT N° 886/15
                        </div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <CompanyLogo style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }} />
                    </div>
                </div>

                {/* I – Datos del Establecimiento */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ background: '#1e293b', padding: '0.6rem 1rem' }}>
                        <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>I — DATOS DEL ESTABLECIMIENTO</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Building2 size={12}/> EMPRESA / RAZÓN SOCIAL</span>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginTop: '0.2rem' }}>{data.empresa || '-'}</div>
                        </div>
                        <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12}/> SECTOR</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{data.sector || '-'}</div>
                        </div>
                        <div style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Briefcase size={12}/> PUESTO DE TRABAJO</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{data.puesto || '-'}</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#ffffff' }}>
                        <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>FECHA DE EVALUACIÓN</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.2rem' }}>{data.id ? new Date(parseInt(data.id)).toLocaleDateString('es-AR') : '-'}</div>
                        </div>
                        <div style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={12}/> PROFESIONAL EVALUADOR</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.2rem' }}>{profile?.name || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* II – Factores de Riesgo */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ background: '#1e293b', padding: '0.6rem 1rem' }}>
                        <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>II — PLANILLA 1: IDENTIFICACIÓN DE FACTORES DE RIESGO ERGONÓMICO</span>
                    </div>
                    <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', background: '#ffffff' }}>
                        {Object.entries(data.planilla1).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', borderRadius: '6px', background: val ? '#eff6ff' : '#f8fafc', border: val ? '1px solid #bfdbfe' : '1px solid #e2e8f0' }}>
                                <div style={{ width: '20px', height: '20px', border: val ? '2px solid #2563eb' : '2px solid #cbd5e1', borderRadius: '4px', background: val ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {val ? <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 900 }}>✓</span> : null}
                                </div>
                                <span style={{ fontSize: '0.78rem', fontWeight: val ? 700 : 600, color: val ? '#1e40af' : '#94a3b8', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* III – Levantamiento de Cargas */}
                {data.planilla1.levantamientoCarga && (
                    <div style={{ border: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '1.5px solid #fca5a5' : '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                        <div style={{ background: '#1e293b', padding: '0.6rem 1rem' }}>
                            <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>III — PLANILLA 2.A: EVALUACIÓN DE LEVANTAMIENTO DE CARGAS</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#ffffff' }}>
                            <div style={{ padding: '1rem', borderRight: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Activity size={12}/> PESO EFECTIVO MANIPULADO</span>
                                <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#0f172a', marginTop: '0.3rem' }}>{data.calculoLevantamiento?.peso} <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>kg</span></div>
                            </div>
                            <div style={{ padding: '1rem', background: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '#fef2f2' : '#f0fdf4' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={12}/> NIVEL DE RIESGO DETERMINADO</span>
                                <div style={{ marginTop: '0.3rem' }}>
                                    <span style={{ padding: '0.3rem 1rem', background: data.riesgo === 'Moderado' || data.riesgo === 'Alto' ? '#dc2626' : '#16a34a', color: '#fff', borderRadius: '8px', fontWeight: 900, fontSize: '1rem' }}>
                                        {data.riesgo}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* IV – Recomendaciones */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ background: '#1e293b', padding: '0.6rem 1rem' }}>
                        <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IV — RECOMENDACIONES DE ACCIÓN</span>
                    </div>
                    <div style={{ padding: '1rem', minHeight: '80px', fontSize: '0.85rem', color: '#334155', fontWeight: 600, lineHeight: 1.6, background: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                        {data.recomendaciones || 'No se registran recomendaciones específicas para este puesto de trabajo en el momento de la evaluación.'}
                    </div>
                </div>

                {/* Selector de firmas (no imprime) */}
                <div className="no-print" style={{ marginBottom: '1.5rem', padding: '0.8rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>INCLUIR FIRMAS:</span>
                    {[['operator', 'Operador'], ['supervisor', 'Supervisor'], ['professional', 'Profesional']].map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                            <input type="checkbox" checked={showSignatures[key]} onChange={e => setShowSignatures(s => ({ ...s, [key]: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                            {label}
                        </label>
                    ))}
                </div>

                {/* Firmas Enterprise */}
                <div style={{ paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid', display: 'flex', gap: '1rem', paddingBottom: '1rem' }}>
                    {showSignatures.operator && (
                        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Firma original</span>
                            </div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>OPERADOR / TRABAJADOR</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Toma de conocimiento</p>
                        </div>
                    )}
                    {showSignatures.supervisor && (
                        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Firma original</span>
                            </div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>SUPERVISOR / EMPLEADOR</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Firma Autorizada</p>
                        </div>
                    )}
                    {showSignatures.professional && (
                        <div style={{ flex: 1, border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #86efac', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                {signature?.signature ? (
                                    <img src={signature.signature} alt="Firma Profesional" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: '0.6rem', color: '#86efac' }}>Sello y Firma Digital</span>
                                )}
                            </div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#166534' }}>PROFESIONAL ACTUANTE</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#15803d', fontWeight: 600 }}>{profile?.name || 'Especialista H&S'}</p>
                            {profile?.license && <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#16a34a' }}>Mat: {profile.license}</p>}
                        </div>
                    )}
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
