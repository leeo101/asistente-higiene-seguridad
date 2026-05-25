import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Printer, Share2, Download, CheckCircle2, TriangleAlert, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import { toast } from 'react-hot-toast';

export default function AIReport(): React.ReactElement | null {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const [data, setData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);
    const [company, setCompany] = useState('');
    const [location, setLocation] = useState('');
    const [showShare, setShowShare] = useState(false);
    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    useEffect(() => {
        const current = localStorage.getItem('current_ai_inspection');
        const prof = localStorage.getItem('personalData');
        const sig = localStorage.getItem('signatureStampData');

        if (current) {
            const parsedData = JSON.parse(current);
            setData(parsedData);
            setCompany(parsedData.company || 'Empresa Local');
            setLocation(parsedData.location || 'Planta Principal');
        }
        if (prof) setProfile(JSON.parse(prof));
        if (sig) setSignature(JSON.parse(sig));
    }, []);

    if (!data) return <div className="container">Cargando...</div>;

    const handlePrint = () => requirePro(() => window.print());

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <ShareModal
                isOpen={showShare}
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Informe IA – ${company}`}
                text={`🤖 INFORME DE INSPECCIÓN IA\n\n🏗️ Empresa: ${company}\n📍 Ubicación: ${location}\n📅 Fecha: ${data ? new Date(data.date).toLocaleString() : ''}\n⚠️ Estado: ${data?.analysis?.ppeComplete ? '✅ EPP Completo' : '⚠️ Falta EPP / Peligro'}\n\nGenerado con Asistente HYS`}
                rawMessage={`🤖 INFORME DE INSPECCIÓN IA\n\n🏗️ Empresa: ${company}\n📍 Ubicación: ${location}\n📅 Fecha: ${data ? new Date(data.date).toLocaleString() : ''}\n⚠️ Estado: ${data?.analysis?.ppeComplete ? '✅ EPP Completo' : '⚠️ Falta EPP / Peligro'}\n\nGenerado con Asistente HYS`}
                elementIdToPrint="pdf-content"
                fileName={`Informe_IA_${company?.replace(/\s+/g, '_') || 'Sin_Nombre'}.pdf`}
            />
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/ai-camera')} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft size={20} /> Volver a Cámara
                </button>
            </div>

            <div id="pdf-content" className="card report-print print:p-0 print:m-0 print:border-none print:shadow-none print:min-h-0" style={{
                padding: '3rem',
                minHeight: '29.7cm',
                height: 'auto',
                background: '#ffffff',
                color: '#1e293b',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', borderBottom: '4px solid var(--color-primary)', paddingBottom: '1.5rem', marginBottom: '2rem', width: '100%', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: '#1e293b' }}>Control H&S</p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1.2 }}>
                            Informe de Inspección IA
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Detección de Riesgos y EPP</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <CompanyLogo style={{ height: '45px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }} />
                    </div>
                </div>

                {profile && (
                    <div className="no-print" style={{ marginBottom: '1.5rem', textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                        <p style={{ margin: 0, fontWeight: 700 }}>Profesional: {profile.name} | Mat: {profile.license}</p>
                    </div>
                )}

                {/* Info Block */}
                <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 mb-10 bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Tipo de Inspección</p>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                            {data.type === 'general_risks' ? 'DETECTAR RIESGOS GENERALES' : 'VERIFICAR EPP'}
                        </p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Empresa / Planta</p>
                        <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="no-print"
                            style={{ margin: 0, padding: '0.2rem 0', fontWeight: 600, fontSize: '0.9rem', border: 'none', borderBottom: '1px solid #e2e8f0', background: 'transparent', width: '100%' }}
                        />
                        <p className="print-only" style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{company}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Fecha del Escaneo</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{new Date(data.date).toLocaleString()}</p>
                    </div>
                </div>

                {/* Evidence Photo */}
                <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'inline-block', border: '4px solid #fff', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                        <img src={data.image} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }} />
                        {/* Simplified Overlay for Report */}
                        {data.type === 'general_risks' ? (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(59, 130, 246, 0.9)', color: '#fff', fontSize: '0.8rem', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', border: '2px solid #fff' }}>ANÁLISIS ENTORNO</div>
                        ) : data.analysis?.ppeComplete ? (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(16, 185, 129, 0.9)', color: '#fff', fontSize: '0.8rem', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', border: '2px solid #fff' }}>✓ EPP O.K.</div>
                        ) : (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', fontSize: '0.8rem', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', border: '2px solid #fff' }}>⚠️ FALTA EPP</div>
                        )}
                    </div>
                    <p style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>Captura fotográfica del sistema de inspección ocular</p>
                </div>

                {/* Analysis Results */}
                <div style={{ marginBottom: '2.5rem', pageBreakInside: 'avoid', breakInside: 'avoid' }} className="no-break">
                    <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                        {data.type === 'general_risks' ? 'Resumen de Riesgos Detectados' : 'Evaluación de EPP Detectada'}
                    </h3>

                    {data.type !== 'general_risks' ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4">
                                {[
                                    { label: 'Casco de Seguridad', pass: data.analysis?.helmetUsed },
                                    { label: 'Calzado de Seguridad', pass: data.analysis?.shoesUsed },
                                    { label: 'Guantes de Trabajo', pass: data.analysis?.glovesUsed },
                                    { label: 'Ropa / Chaleco Reflectivo', pass: data.analysis?.clothingUsed },
                                ].map((item, i) => (
                                    <div key={i} style={{ padding: '0.8rem', borderRadius: '8px', background: item.pass ? '#f0fdf4' : '#fef2f2', border: `1px solid ${item.pass ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '0.8rem', color: item.pass ? '#15803d' : '#b91c1c' }}>
                                        {item.pass ? <ShieldCheck size={20} /> : <TriangleAlert size={20} />}
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.label}: {item.pass ? 'CUMPLE' : 'FALTA'}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '8px', background: data.analysis?.ppeComplete ? '#f0fdf4' : '#fff7ed', border: `1px solid ${data.analysis?.ppeComplete ? '#bbf7d0' : '#ffedd5'}`, color: data.analysis?.ppeComplete ? '#15803d' : '#c2410c' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        {data.analysis?.ppeComplete ? <ShieldCheck /> : <TriangleAlert />}
                                        <span style={{ fontWeight: 800 }}>ESTADO GENERAL: {data.analysis?.ppeComplete ? 'ADECUADO' : 'REQUIERE ATENCIÓN INMEDIATA'}</span>
                                    </div>
                                    {data.analysis?.riskLevel && (
                                        <div style={{
                                            padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase',
                                            background: data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#fef2f2' :
                                                        data.analysis.riskLevel.toLowerCase() === 'alto' ? '#fff7ed' :
                                                        data.analysis.riskLevel.toLowerCase() === 'medio' ? '#fefce8' : '#f0fdf4',
                                            color: data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#dc2626' :
                                                   data.analysis.riskLevel.toLowerCase() === 'alto' ? '#ea580c' :
                                                   data.analysis.riskLevel.toLowerCase() === 'medio' ? '#ca8a04' : '#16a34a',
                                            border: `1px solid ${
                                                   data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#fecaca' :
                                                   data.analysis.riskLevel.toLowerCase() === 'alto' ? '#ffedd5' :
                                                   data.analysis.riskLevel.toLowerCase() === 'medio' ? '#fef08a' : '#bbf7d0'}`
                                        }}>
                                            Riesgo: {data.analysis.riskLevel}
                                        </div>
                                    )}
                                </div>

                                {data.analysis?.immediateAction && (
                                    <div style={{ padding: '1.2rem', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fecaca', color: '#be123c' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                                            <TriangleAlert size={18} />
                                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>ACCIÓN INMEDIATA REQUERIDA (24HS)</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{data.analysis.immediateAction}</p>
                                    </div>
                                )}

                                {data.analysis?.applicableLegislation && data.analysis.applicableLegislation.length > 0 && (
                                    <div style={{ padding: '1.2rem', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                                            <ShieldCheck size={18} />
                                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>NORMATIVA APLICABLE (ARG)</span>
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                            {data.analysis.applicableLegislation.map((leg, i) => (
                                                <li key={i}>{leg}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ padding: '1.5rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)' }}>
                                        <Info size={20} />
                                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>EVALUACIÓN GENERAL IA</span>
                                    </div>
                                    {data.analysis?.riskLevel && (
                                        <div style={{
                                            padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase',
                                            background: data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#fef2f2' :
                                                        data.analysis.riskLevel.toLowerCase() === 'alto' ? '#fff7ed' :
                                                        data.analysis.riskLevel.toLowerCase() === 'medio' ? '#fefce8' : '#f0fdf4',
                                            color: data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#dc2626' :
                                                   data.analysis.riskLevel.toLowerCase() === 'alto' ? '#ea580c' :
                                                   data.analysis.riskLevel.toLowerCase() === 'medio' ? '#ca8a04' : '#16a34a',
                                            border: `1px solid ${
                                                   data.analysis.riskLevel.toLowerCase() === 'crítico' ? '#fecaca' :
                                                   data.analysis.riskLevel.toLowerCase() === 'alto' ? '#ffedd5' :
                                                   data.analysis.riskLevel.toLowerCase() === 'medio' ? '#fef08a' : '#bbf7d0'}`
                                        }}>
                                            Riesgo: {data.analysis.riskLevel}
                                        </div>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>{data.analysis?.generalAssessment || 'Análisis ambiental completado.'}</p>
                            </div>

                            {data.analysis?.immediateAction && (
                                <div style={{ padding: '1.2rem', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fecaca', color: '#be123c' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                                        <TriangleAlert size={18} />
                                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>ACCIÓN INMEDIATA REQUERIDA (24HS)</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{data.analysis.immediateAction}</p>
                                </div>
                            )}

                            {data.analysis?.applicableLegislation && data.analysis.applicableLegislation.length > 0 && (
                                <div style={{ padding: '1.2rem', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                                        <ShieldCheck size={18} />
                                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>NORMATIVA APLICABLE (ARG)</span>
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                        {data.analysis.applicableLegislation.map((leg, i) => (
                                            <li key={i}>{leg}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Findings Legend (Numbered) */}
                {data.analysis?.detections && data.analysis.detections.length > 0 && (
                    <div style={{ marginBottom: '2.5rem', pageBreakInside: 'avoid', breakInside: 'avoid' }} className="no-break">
                        <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>Leyenda de Hallazgos en Imagen</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3">
                            {data.analysis.detections.map((det, i) => {
                                const severity = (det.severity || '').toLowerCase();
                                const badgeBg = severity === 'crítico' ? '#ef4444' :
                                                severity === 'alto' ? '#f97316' :
                                                severity === 'medio' ? '#eab308' :
                                                severity === 'bajo' ? '#10b981' : '#3b82f6';
                                
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.9rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            background: badgeBg, color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 900, fontSize: '0.75rem', flexShrink: 0
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ color: '#1e293b', fontWeight: 600 }}>{det.label}</span>
                                            {det.severity && <span style={{ fontSize: '0.7rem', color: badgeBg, fontWeight: 700, textTransform: 'uppercase' }}>{det.severity}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Additional Findings */}
                {(data.analysis?.foundRisks?.length > 0 || data.analysis?.detections?.some(d => d.recommendation)) && (
                    <div style={{ marginBottom: '3rem', pageBreakInside: 'avoid', breakInside: 'avoid' }} className="no-break">
                        <h4 style={{ color: '#b91c1c', borderBottom: '1px solid #fca5a5', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Riesgos y Observaciones Detalladas:</h4>
                        
                        {data.analysis?.foundRisks?.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h5 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.9rem', fontWeight: 700 }}>Riesgos Generales:</h5>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e293b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    {data.analysis.foundRisks.map((risk, i) => (
                                        <li key={`risk-${i}`} style={{ marginBottom: '0.4rem' }}>{risk}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {data.analysis?.detections?.filter(d => d.recommendation).length > 0 && (
                            <div>
                                <h5 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.9rem', fontWeight: 700 }}>Recomendaciones por Hallazgo:</h5>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e293b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    {data.analysis.detections.filter(d => d.recommendation).map((det, i) => (
                                        <li key={`rec-${i}`} style={{ marginBottom: '0.4rem' }}>
                                            <strong>{det.label}:</strong> {det.recommendation}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="no-print mt-10 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center text-xs font-bold text-slate-700">
                    <div className="text-center">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-4 flex-wrap justify-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.operator} onChange={e => setShowSignatures(s => ({ ...s, operator: e.target.checked }))} className="w-4 h-4 accent-red-600" /> Operador
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.supervisor} onChange={e => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))} className="w-4 h-4 accent-red-600" /> Supervisor
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showSignatures.professional} onChange={e => setShowSignatures(s => ({ ...s, professional: e.target.checked }))} className="w-4 h-4 accent-red-600" /> Profesional
                        </label>
                    </div>
                </div>

                <PdfSignatures
                    data={{
                        ...data,
                        professionalSignature: signature?.signature,
                        professionalStamp: signature?.stamp,
                        professionalName: profile?.name,
                        professionalLicense: profile?.license
                    }}
                    box1={showSignatures.operator ? {
                        title: 'TRABAJADOR / OPERADOR',
                        subtitle: 'Aclaración y Firma',
                        signatureUrl: null,
                        isProfessional: false
                    } : null}
                    box3={showSignatures.supervisor ? {
                        title: 'SUPERVISOR / TESTIGO',
                        subtitle: 'Aclaración y Firma',
                        signatureUrl: null,
                        isProfessional: false
                    } : null}
                    box2={showSignatures.professional ? undefined : null}
                />

                {/* Footer Content (Static in report) */}
                <div style={{ position: 'relative', marginTop: '30px', paddingBottom: '30px', width: '100%', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                    Documento de verificación instantánea generado por Asistente HYS.
                </div>
            </div>

            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button onClick={() => toast.success('Los reportes de IA se guardan automáticamente en tu Historial.')} className="btn-floating-action" style={{ background: '#36B37E', color: 'white' }}>
                    <CheckCircle2 size={18} /> GUARDADO
                </button>
                <button onClick={() => requirePro(() => setShowShare(true))} className="btn-floating-action" style={{ background: '#0052CC', color: 'white' }}>
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button onClick={handlePrint} className="btn-floating-action" style={{ background: '#FF8B00', color: 'white' }}>
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>

            <style>
                {`
                .spin { animation: spin 1.5s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                @media print {
                    .report-print {
                        min-height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .no-break {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
                `}
            </style>
        </div>
    );
}
