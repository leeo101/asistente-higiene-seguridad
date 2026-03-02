import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Printer, Building2, User, Calendar,
    CheckCircle2, AlertCircle, Info, Pencil, AlertTriangle,
    ChevronRight, Share2, FileText, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';

export default function Report() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const [showShare, setShowShare] = useState(false);
    const [inspectionData, setInspectionData] = useState(null);
    const [professional, setProfessional] = useState(null);
    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    useEffect(() => {
        // Load inspection data
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            setInspectionData(inspection);

            const historyRaw = localStorage.getItem('inspections_history');
            const history = historyRaw ? JSON.parse(historyRaw) : [];

            if (!history.find(item => item.id === inspection.id)) {
                const updatedHistory = [{ ...inspection, status: 'Finalizada' }, ...history];
                localStorage.setItem('inspections_history', JSON.stringify(updatedHistory));
            }
        }

        // Load professional data
        const savedData = localStorage.getItem('personalData');
        const savedSigData = localStorage.getItem('signatureStampData');
        const legacySignature = localStorage.getItem('capturedSignature');

        let signature = legacySignature || null;
        if (savedSigData) {
            const parsed = JSON.parse(savedSigData);
            signature = parsed.signature || signature;
        }

        if (savedData) {
            const data = JSON.parse(savedData);
            setProfessional({
                name: data.name || 'Profesional',
                license: data.license || '',
                signature: signature
            });
        }
    }, []);

    const handlePrint = () => requirePro(() => window.print());

    if (!inspectionData) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
                <p>Cargando datos del reporte...</p>
            </div>
        );
    }

    const findings = inspectionData.observations || [];
    const findingCount = findings.length;

    return (
        <div className="container" style={{ paddingBottom: '5rem', maxWidth: '1000px' }}>
            {/* Action Bar (No Print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Informe de Inspección</h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ID #{inspectionData.id?.toString().slice(-6)}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => requirePro(() => setShowShare(true))} className="btn-outline" style={{ padding: '0.6rem 1rem', borderRadius: '10px' }}>
                        <Share2 size={18} /> <span className="header-title">Compartir</span>
                    </button>
                    <button onClick={handlePrint} className="btn-primary" style={{ margin: 0, padding: '0.6rem 1.2rem', borderRadius: '10px', width: 'auto' }}>
                        <Printer size={18} /> <span className="header-title">Imprimir PDF</span>
                    </button>
                </div>
            </div>

            <ShareModal
                open={showShare}
                onClose={() => setShowShare(false)}
                title="Informe de Inspección"
                text={`📋 Informe de Inspección\n🏗️ Obra: ${inspectionData.name}\n📅 Fecha: ${new Date(inspectionData.date).toLocaleDateString()}\n⚠️ Hallazgos: ${findingCount}\n\nGenerado con Asistente H&S`}
            />

            {/* PRINTABLE AREA */}
            <div className="bg-white text-black p-4 md:p-12 shadow-sm border border-slate-200 rounded-2xl print-area">
                {/* Header Section */}
                <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--color-primary)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                            <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-primary)', fontWeight: 900 }}>ASISTENTE H&S</h2>
                        </div>
                        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#172B4D' }}>INFORME TÉCNICO DE INSPECCIÓN</h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B778C' }}>Protocolo de Relevamiento General de Riesgos</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                        <p style={{ margin: '0 0 0.2rem 0' }}><strong>Fecha:</strong> {new Date(inspectionData.date).toLocaleDateString('es-AR')}</p>
                        <p style={{ margin: '0 0 0.2rem 0' }}><strong>Referencia:</strong> {inspectionData.name}</p>
                        <p style={{ margin: 0 }}><strong>Ubicación:</strong> {inspectionData.location || '-'}</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="card" style={{ padding: '1rem', textAlign: 'center', background: '#f8fafc' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#172B4D' }}>{findingCount}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B778C', textTransform: 'uppercase' }}>Hallazgos</div>
                    </div>
                    <div className="card" style={{ padding: '1rem', textAlign: 'center', background: '#f8fafc' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: findingCount > 0 ? '#DE350B' : '#00875A' }}>
                            {findingCount > 0 ? 'CRÍTICO' : 'CONFORME'}
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B778C', textTransform: 'uppercase' }}>Estado General</div>
                    </div>
                    <div className="card md:col-span-2" style={{ padding: '1rem', background: '#f8fafc' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Profesional Actuante:</div>
                        <div style={{ fontSize: '0.95rem', color: 'var(--color-primary)', fontWeight: 800 }}>{professional?.name || 'No especificado'}</div>
                    </div>
                </div>

                {/* Findings Table */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={20} color="#FF991F" /> Detalle de Hallazgos y No Conformidades
                </h3>

                {findings.length > 0 ? (
                    <div style={{ overflowX: 'auto', marginBottom: '2.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9' }}>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left' }}>#</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left' }}>Categoría / Item</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left' }}>Descripción del Hallazgo</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'center' }}>Severidad</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'center' }}>Evidencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {findings.map((obs, i) => (
                                    <tr key={i} style={{ pageBreakInside: 'avoid' }}>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', fontWeight: 700, color: '#6B778C' }}>{i + 1}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem' }}>
                                            <div style={{ fontWeight: 800, color: '#172B4D' }}>{obs.category}</div>
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            {obs.description}
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 900,
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '12px',
                                                background: obs.severity === 'Crítica' ? '#fee2e2' : '#fef9c3',
                                                color: obs.severity === 'Crítica' ? '#dc2626' : '#ca8a04',
                                                border: `1px solid ${obs.severity === 'Crítica' ? '#fca5a5' : '#fde047'}`
                                            }}>
                                                {obs.severity?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.5rem', textAlign: 'center' }}>
                                            {obs.photo ? (
                                                <img src={obs.photo} alt="Evidencia" style={{ maxHeight: '60px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => window.open(obs.photo, '_blank')} />
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Sin foto</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', marginBottom: '2rem' }}>
                        <CheckCircle2 size={32} style={{ marginBottom: '0.5rem', opacity: 0.7 }} />
                        <p style={{ margin: 0, fontWeight: 700 }}>No se detectaron hallazgos durante la inspección.</p>
                        <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>El sector cumple con las condiciones mínimas de seguridad.</p>
                    </div>
                )}

                {/* Signatures Section */}
                <div style={{ marginTop: '4rem' }}>
                    <h3 className="no-print" style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1.5rem', color: '#6B778C' }}>VALIDACIÓN DEL REPORTE</h3>

                    <div className="no-print mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center text-xs font-bold text-slate-700">
                        <div className="text-center">INCLUIR FIRMAS:</div>
                        <div className="flex gap-4 flex-wrap justify-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={showSignatures.operator} onChange={e => setShowSignatures(s => ({ ...s, operator: e.target.checked }))} className="w-4 h-4 accent-blue-600" /> Operador
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={showSignatures.supervisor} onChange={e => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))} className="w-4 h-4 accent-blue-600" /> Supervisor
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={showSignatures.professional} onChange={e => setShowSignatures(s => ({ ...s, professional: e.target.checked }))} className="w-4 h-4 accent-blue-600" /> Profesional
                            </label>
                        </div>
                    </div>

                    <div className="signature-container-row mt-10" style={{ pageBreakInside: 'avoid' }}>
                        {showSignatures.operator && (
                            <div className="signature-item-box">
                                <div className="signature-line" style={{ borderTop: '2px dashed #94a3b8', width: '80%', margin: '0 auto 10px auto' }}></div>
                                <p className="text-[0.65rem] font-black uppercase text-slate-400 mb-1">OPERADOR</p>
                                <p className="text-[0.8rem] font-black text-black">Aclaración y Firma</p>
                            </div>
                        )}

                        {showSignatures.supervisor && (
                            <div className="signature-item-box">
                                <div className="signature-line" style={{ borderTop: '2px dashed #94a3b8', width: '80%', margin: '0 auto 10px auto' }}></div>
                                <p className="text-[0.65rem] font-black uppercase text-slate-400 mb-1">SUPERVISOR</p>
                                <p className="text-[0.8rem] font-black text-black">Validación de Inspección</p>
                            </div>
                        )}

                        {showSignatures.professional && (
                            <div className="signature-item-box">
                                {professional?.signature ? (
                                    <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                        <img src={professional.signature} alt="Firma Profesional" style={{ maxHeight: '100%', maxWidth: '120px' }} />
                                    </div>
                                ) : (
                                    <div className="signature-line" style={{ borderTop: '2px dashed #94a3b8', width: '80%', margin: '0 auto 10px auto' }}></div>
                                )}
                                <p className="text-[0.65rem] font-black uppercase text-slate-400 mb-1">PROFESIONAL H&S</p>
                                <p className="text-[0.8rem] font-black text-black">{professional?.name}</p>
                                {professional?.license && <p className="text-[0.6rem] font-bold text-slate-500">MP: {professional.license}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Print Info */}
                <div className="print-only" style={{ marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1rem', textAlign: 'center', fontSize: '0.6rem', color: '#94a3b8' }}>
                    Este documento ha sido generado mediante el Asistente Digital H&S. La información contenida es de carácter confidencial y técnico.
                </div>
            </div>
        </div>
    );
}
