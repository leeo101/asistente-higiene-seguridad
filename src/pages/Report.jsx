import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Printer, Building2, User, Calendar,
    CheckCircle2, AlertCircle, Info, Pencil, TriangleAlert,
    ChevronRight, Share2, FileText, ShieldCheck, Camera,
    ShieldAlert
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
    const [riskAssessment, setRiskAssessment] = useState(null);
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

            const existingIndex = history.findIndex(item => item.id === inspection.id);
            if (existingIndex >= 0) {
                history[existingIndex] = { ...inspection, status: 'Finalizada' };
                localStorage.setItem('inspections_history', JSON.stringify(history));
            } else {
                const updatedHistory = [{ ...inspection, status: 'Finalizada' }, ...history];
                localStorage.setItem('inspections_history', JSON.stringify(updatedHistory));
            }
        }

        // Load Risk Assessment (IPER)
        const iper = localStorage.getItem('risk_assessment');
        if (iper) {
            setRiskAssessment(JSON.parse(iper));
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
                    <button onClick={() => navigate('/')} style={{ padding: '0.8rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', cursor: 'pointer', color: 'var(--color-text)', display: 'flex' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Informe de Inspección</h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>ID #{inspectionData.id?.toString().slice(-6)}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={() => requirePro(() => setShowShare(true))} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.2rem', borderRadius: '12px' }}>
                        <Share2 size={18} /> <span>Compartir</span>
                    </button>
                    <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '12px', width: 'auto' }}>
                        <Printer size={18} /> <span>PDF / Imprimir</span>
                    </button>
                </div>
            </div>

            <ShareModal
                open={showShare}
                onClose={() => setShowShare(false)}
                title="Informe de Inspección"
                text={`📋 Informe de Inspección\n🏗️ Obra: ${inspectionData.name}\n📅 Fecha: ${new Date(inspectionData.date).toLocaleDateString()}\n⚠️ Hallazgos: ${findingCount}\n\nGenerado con Asistente H&S`}
                elementIdToPrint="pdf-content"
            />

            {/* PRINTABLE AREA */}
            <div id="pdf-content" className="bg-white text-black p-4 md:p-12 shadow-sm border border-slate-200 rounded-2xl print-area print:mb-0 print:border-none print:shadow-none">
                {/* Header Section */}
                <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--color-primary)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                            <img src="/logo.png" alt="Logo" style={{ height: '40px' }} />
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-primary)', fontWeight: 900 }}>ASISTENTE H&S</h2>
                        </div>
                        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#172B4D' }}>INFORME TÉCNICO DE INSPECCIÓN</h1>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#6B778C', fontWeight: 600 }}>Protocolo de Relevamiento General de Riesgos</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                        <p style={{ margin: '0 0 0.3rem 0' }}><strong>Fecha:</strong> {new Date(inspectionData.date).toLocaleDateString('es-AR')}</p>
                        <p style={{ margin: '0 0 0.3rem 0' }}><strong>Referencia:</strong> {inspectionData.name}</p>
                        <p style={{ margin: 0 }}><strong>Ubicación:</strong> {inspectionData.location || '-'}</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="card" style={{ padding: '1.2rem', textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#172B4D' }}>{findingCount}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B778C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hallazgos</div>
                    </div>
                    <div className="card" style={{ padding: '1.2rem', textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#172B4D' }}>
                            {inspectionData.responses ? Math.round(((Object.values(inspectionData.responses).filter(v => v === 'ok').length) / 10) * 100) : 0}%
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B778C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cumplimiento</div>
                    </div>
                    <div className="card md:col-span-2" style={{ padding: '1.2rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#6B778C', marginBottom: '0.3rem' }}>PROFESIONAL ACTUANTE</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--color-primary)', fontWeight: 900 }}>{professional?.name || 'No especificado'}</div>
                        {professional?.license && <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B778C' }}>MATRÍCULA: {professional.license}</div>}
                    </div>
                </div>

                {/* Checklist Summary Section */}
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#172B4D' }}>
                    <ShieldCheck size={24} color="#00875A" /> Resumen por Categoría
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                    {[
                        { name: 'Extintores y Protección', id: 'extintores', items: ['e1', 'e2'] },
                        { name: 'Riesgo Eléctrico', id: 'electrico', items: ['L1', 'L2'] },
                        { name: 'EPP', id: 'epp', items: ['p1', 'p2'] },
                        { name: 'Orden y Limpieza', id: 'orden', items: ['o1', 'o2'] },
                        { name: 'Señalización y Evacuación', id: 'senyalizacion', items: ['s1', 's2'] }
                    ].map(cat => {
                        const total = cat.items.length;
                        const ok = cat.items.filter(id => inspectionData.responses?.[id] === 'ok').length;
                        const fail = cat.items.filter(id => inspectionData.responses?.[id] === 'fail').length;
                        const na = cat.items.filter(id => inspectionData.responses?.[id] === 'na').length;
                        const percent = Math.round((ok / total) * 100) || 0;

                        return (
                            <div key={cat.id} style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', pageBreakInside: 'avoid' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#172B4D', marginBottom: '0.8rem' }}>{cat.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem', pageBreakInside: 'avoid' }}>
                                    <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? '#00875A' : '#3b82f6', transition: 'width 0.5s ease' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#172B4D' }}>{percent}%</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#6B778C', fontWeight: 700 }}>
                                    <span style={{ color: '#00875A' }}>{ok} OK</span> · <span style={{ color: '#dc2626' }}>{fail} Fallos</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Risk Assessment Integrated Section */}
                {riskAssessment && riskAssessment.length > 0 && (
                    <div style={{ pageBreakInside: 'avoid', marginBottom: '3rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#172B4D' }}>
                            <ShieldAlert size={24} color="#FF991F" /> Evaluación de Riesgos Previa (IPER)
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900 }}>Peligro Identificado</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900 }}>Riesgo Asociado</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 900 }}>Probabilidad / Severidad</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 900 }}>Nivel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riskAssessment.map((risk, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', pageBreakInside: 'avoid' }}>
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>{risk.danger}</td>
                                            <td style={{ padding: '1rem' }}>{risk.risk}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{risk.probability} x {risk.severity}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 900,
                                                    padding: '0.3rem 0.6rem',
                                                    borderRadius: '8px',
                                                    background: risk.score > 15 ? '#fee2e2' : risk.score > 8 ? '#ffedd5' : '#dcfce7',
                                                    color: risk.score > 15 ? '#b91c1c' : risk.score > 8 ? '#9a3412' : '#15803d',
                                                }}>
                                                    {risk.level || (risk.score > 15 ? 'ALTO' : risk.score > 8 ? 'MEDIO' : 'BAJO')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Findings Table */}
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#172B4D' }}>
                    <TriangleAlert size={24} color="#DC2626" /> Detalle de Hallazgos y Desvíos
                </h3>

                {findings.length > 0 ? (
                    <div style={{ overflowX: 'auto', marginBottom: '3rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900, width: '40px' }}>#</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900 }}>Descripción de la Anomalía</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 900 }}>Riesgo</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 900 }}>Acción Correctiva / Responsable</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 900 }}>Evidencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {findings.map((obs, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', pageBreakInside: 'avoid' }}>
                                        <td style={{ padding: '1rem', fontWeight: 800, color: '#6B778C' }}>{i + 1}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 800, color: '#172B4D', marginBottom: '0.2rem' }}>{obs.category}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#444' }}>{obs.description}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 900,
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '8px',
                                                background: obs.severity === 'Crítica' ? '#fee2e2' : obs.severity === 'Moderada' ? '#ffedd5' : '#dcfce7',
                                                color: obs.severity === 'Crítica' ? '#dc2626' : obs.severity === 'Moderada' ? '#9a3412' : '#15803d',
                                                border: '1px solid currentColor'
                                            }}>
                                                {obs.severity?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <strong>Plazo:</strong> {obs.deadline}<br/>
                                                <strong>Responsable:</strong> {obs.assignee || 'A designar'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                {(obs.photos || (obs.photo ? [obs.photo] : [])).map((img, idx) => (
                                                    <img 
                                                        key={idx} 
                                                        src={img} 
                                                        alt="Hallazgo" 
                                                        style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }} 
                                                        onClick={() => window.open(img, '_blank')}
                                                    />
                                                ))}
                                                {!(obs.photos?.length || obs.photo) && <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>Sin fotos</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="card" style={{ padding: '2.5rem', textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', marginBottom: '3rem' }}>
                        <CheckCircle2 size={40} style={{ marginBottom: '0.8rem', opacity: 0.8 }} />
                        <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Relevamiento sin desvíos críticos</p>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: 600 }}>Las condiciones observadas se ajustan a las normativas de seguridad vigentes.</p>
                    </div>
                )}

                {/* Photo Gallery (General Evidence) */}
                {inspectionData.photos && inspectionData.photos.length > 0 && (
                    <div style={{ marginTop: '4rem', pageBreakBefore: 'auto' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#172B4D', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.8rem' }}>
                            <Camera size={24} color="var(--color-primary)" /> Registro Fotográfico General de la Visita
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                            {inspectionData.photos.map((photo, index) => (
                                <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', padding: '0.8rem', background: '#f8fafc', pageBreakInside: 'avoid', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    <img src={photo} alt={`Evidencia ${index + 1}`} style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '12px', marginBottom: '0.8rem' }} />
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, textAlign: 'center', color: '#6B778C', textTransform: 'uppercase', letterSpacing: '1px' }}>Evidencia Fotográfica #{index + 1}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Signatures Section */}
                <div style={{ marginTop: '5rem' }}>
                    <div className="no-print mb-10 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl w-full flex flex-col md:flex-row gap-6 justify-center items-center text-sm font-bold text-blue-900 shadow-sm">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={20}/> CONFIGURAR FIRMAS PARA EL PDF:</div>
                        <div className="flex gap-6 flex-wrap justify-center">
                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                                <input type="checkbox" checked={showSignatures.operator} onChange={e => setShowSignatures(s => ({ ...s, operator: e.target.checked }))} className="w-5 h-5 accent-blue-600" /> Operador
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                                <input type="checkbox" checked={showSignatures.supervisor} onChange={e => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))} className="w-5 h-5 accent-blue-600" /> Supervisor
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                                <input type="checkbox" checked={showSignatures.professional} onChange={e => setShowSignatures(s => ({ ...s, professional: e.target.checked }))} className="w-5 h-5 accent-blue-600" /> Profesional
                            </label>
                        </div>
                    </div>

                    <div className="signature-container-row mt-12" style={{ pageBreakInside: 'avoid', gap: '40px' }}>
                        {showSignatures.operator && (
                            <div className="signature-item-box" style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{ height: '80px' }}></div>
                                <div className="signature-line" style={{ borderTop: '2px solid #172B4D', width: '200px', margin: '0 auto 12px auto' }}></div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#6B778C', textTransform: 'uppercase', marginBottom: '4px' }}>OPERADOR / RESPONSABLE</p>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#172B4D' }}>Firma y Aclaración</p>
                            </div>
                        )}

                        {showSignatures.supervisor && (
                            <div className="signature-item-box" style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{ height: '80px' }}></div>
                                <div className="signature-line" style={{ borderTop: '2px solid #172B4D', width: '200px', margin: '0 auto 12px auto' }}></div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#6B778C', textTransform: 'uppercase', marginBottom: '4px' }}>SUPERVISOR / JEFE DE OBRA</p>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#172B4D' }}>Validación de Auditoría</p>
                            </div>
                        )}

                        {showSignatures.professional && (
                            <div className="signature-item-box" style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {professional?.signature && (
                                        <img src={professional.signature} alt="Firma Profesional" style={{ maxHeight: '70px', maxWidth: '160px', mixBlendMode: 'multiply' }} />
                                    )}
                                </div>
                                <div className="signature-line" style={{ borderTop: '2px solid #172B4D', width: '200px', margin: '0 auto 12px auto' }}></div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#6B778C', textTransform: 'uppercase', marginBottom: '4px' }}>PROFESIONAL ACTUANTE H&S</p>
                                <p style={{ fontSize: '1rem', fontWeight: 900, color: '#172B4D' }}>{professional?.name}</p>
                                {professional?.license && <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B778C' }}>MP: {professional.license}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Print Info */}
                <div className="print-only" style={{ marginTop: '5rem', borderTop: '0.5px solid #cbd5e1', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>
                    Este documento es un registro oficial de inspección generado autónomamente por el sistema Asistente H&S para {professional?.name || 'el profesional actuante'}.
                </div>
            </div>
        </div>
    );
}
