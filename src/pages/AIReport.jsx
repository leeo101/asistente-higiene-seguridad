import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, Download, CheckCircle2, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import { toast } from 'react-hot-toast';

export default function AIReport() {
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
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Informe IA – ${company}`}
                text={`🤖 INFORME DE INSPECCIÓN IA\n\n🏗️ Empresa: ${company}\n📍 Ubicación: ${location}\n📅 Fecha: ${data ? new Date(data.date).toLocaleString() : ''}\n⚠️ Estado: ${data?.analysis?.ppeComplete ? '✅ EPP Completo' : '⚠️ Falta EPP / Peligro'}\n\nGenerado con Asistente HYS`}
            />
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/ai-camera')} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft size={20} /> Volver a Cámara
                </button>
            </div>

            <div className="card report-print print:mb-0 print:border-none print:shadow-none print:min-h-0" style={{
                padding: '3rem',
                minHeight: '29.7cm',
                height: 'auto',
                background: '#ffffff',
                color: '#1e293b',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-primary)', paddingBottom: '2rem', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: 800 }}>INFORME</h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase' }}>Sistema de Detección de Riesgos y EPP</p>
                    </div>
                    {profile && (
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{profile.name}</p>
                            <p style={{ margin: '0.1rem 0', fontSize: '0.8rem', color: '#64748b' }}>{profile.profession}</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Mat: {profile.license}</p>
                        </div>
                    )}
                </div>

                {/* Info Block */}
                <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 mb-10 bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Empresa</p>
                        <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="no-print"
                            style={{ margin: 0, padding: '0.2rem 0', fontWeight: 600, fontSize: '0.9rem', border: 'none', borderBottom: '1px solid #e2e8f0', background: 'transparent' }}
                        />
                        <p className="print-only" style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{company}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Fecha del Escaneo</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{new Date(data.date).toLocaleString()}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Ubicación</p>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="no-print"
                            style={{ margin: 0, padding: '0.2rem 0', fontWeight: 600, fontSize: '0.9rem', border: 'none', borderBottom: '1px solid #e2e8f0', background: 'transparent' }}
                        />
                        <p className="print-only" style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{location}</p>
                    </div>
                </div>

                {/* Evidence Photo */}
                <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'inline-block', border: '4px solid #fff', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                        <img src={data.image} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }} />
                        {/* Simplified Overlay for Report */}
                        {data.analysis.ppeComplete ? (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(16, 185, 129, 0.9)', color: '#fff', fontSize: '0.8rem', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', border: '2px solid #fff' }}>✓ EPP O.K.</div>
                        ) : (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', fontSize: '0.8rem', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', border: '2px solid #fff' }}>⚠️ FALTA EPP</div>
                        )}
                    </div>
                    <p style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>Captura fotográfica del sistema de inspección ocular</p>
                </div>

                {/* Analysis Results */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>Evaluación de EPP Detectada</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4">
                        {[
                            { label: 'Casco de Seguridad', pass: data.analysis.helmetUsed },
                            { label: 'Calzado de Seguridad', pass: data.analysis.shoesUsed },
                            { label: 'Guantes de Trabajo', pass: data.analysis.glovesUsed },
                            { label: 'Ropa / Chaleco Reflectivo', pass: data.analysis.clothingUsed },
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '0.8rem', borderRadius: '8px', background: item.pass ? '#f0fdf4' : '#fef2f2', border: `1px solid ${item.pass ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '0.8rem', color: item.pass ? '#15803d' : '#b91c1c' }}>
                                {item.pass ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.label}: {item.pass ? 'CUMPLE' : 'FALTA'}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: data.analysis.ppeComplete ? '#f0fdf4' : '#fff7ed', border: `1px solid ${data.analysis.ppeComplete ? '#bbf7d0' : '#ffedd5'}`, display: 'flex', alignItems: 'center', gap: '0.8rem', color: data.analysis.ppeComplete ? '#15803d' : '#c2410c' }}>
                        {data.analysis.ppeComplete ? <ShieldCheck /> : <AlertTriangle />}
                        <span style={{ fontWeight: 800 }}>ESTADO GENERAL: {data.analysis.ppeComplete ? 'ADECUADO' : 'REQUIERE ATENCIÓN INMEDIATA'}</span>
                    </div>
                </div>

                {/* Findings Legend (Numbered) */}
                {data.analysis.detections && data.analysis.detections.length > 0 && (
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>Leyenda de Hallazgos</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3">
                            {data.analysis.detections.map((det, i) => {
                                const isRisk = det.label.toLowerCase().includes('riesgo');
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.9rem' }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            background: isRisk ? '#ef4444' : '#3b82f6', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: '0.75rem', flexShrink: 0
                                        }}>
                                            {i + 1}
                                        </div>
                                        <span style={{ color: '#475569' }}>{det.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Additional Findings */}
                {data.analysis.foundRisks.length > 0 && (
                    <div style={{ marginBottom: '3rem' }}>
                        <h4 style={{ color: '#b91c1c', marginBottom: '0.8rem' }}>Riesgos y Observaciones Adicionales:</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e293b' }}>
                            {data.analysis.foundRisks.map((risk, i) => (
                                <li key={i} style={{ marginBottom: '0.4rem' }}>{risk}</li>
                            ))}
                        </ul>
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

                <div className="signature-container-row mt-10">
                    {showSignatures.operator && (
                        <div className="signature-item-box">
                            <div className="signature-line"></div>
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">TRABAJADOR / OPERADOR</p>
                            <p className="text-[0.8rem] font-black uppercase text-black leading-none min-h-[0.8rem]">Aclaración y Firma</p>
                        </div>
                    )}

                    {showSignatures.supervisor && (
                        <div className="signature-item-box">
                            <div className="signature-line"></div>
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">SUPERVISOR / TESTIGO</p>
                            <p className="text-[0.8rem] font-black uppercase text-black leading-none min-h-[0.8rem]">Aclaración y Firma</p>
                        </div>
                    )}

                    {showSignatures.professional && (
                        <div className="signature-item-box">
                            {signature?.signature || signature?.stamp ? (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', height: '60px' }}>
                                    {signature.signature && <img src={signature.signature} alt="Firma" style={{ maxWidth: '100px', maxHeight: '60px' }} />}
                                    {signature.stamp && <img src={signature.stamp} alt="Sello" style={{ maxWidth: '60px', maxHeight: '60px' }} />}
                                </div>
                            ) : (
                                <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem' }}>Sin Firma</div>
                            )}
                            <div className="signature-line"></div>
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">PROFESIONAL ACTUANTE</p>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem' }}>{profile?.name}</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Mat: {profile?.license}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
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
                `}
            </style>
        </div>
    );
}
