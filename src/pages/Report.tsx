import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ArrowLeft, Save, Printer, Building2, User, Calendar,
    CheckCircle2, AlertCircle, TriangleAlert,
    Share2, FileText, ShieldCheck, Camera,
    ShieldAlert, MapPin, Info
} from 'lucide-react';
 import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import CompanyLogo from '../components/CompanyLogo';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

export default function Report(): React.ReactElement | null {
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
        // Load inspection data and update history if not already final
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            setInspectionData(inspection);

            // Update history with latest inspection data and mark as final
            const historyRaw = localStorage.getItem('inspections_history');
            const history = historyRaw ? JSON.parse(historyRaw) : [];

            const existingIndex = history.findIndex(item => item.id === inspection.id);
            if (existingIndex >= 0) {
                // Update with latest changes even if already final
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
            <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center' }}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Datos no encontrados</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '400px' }}>
                    No se ha podido recuperar la información del relevamiento actual. 
                    Por favor, regrese a la lista de control e intente nuevamente.
                </p>
                <button 
                    onClick={() => navigate('/checklist')}
                    className="btn-primary"
                    style={{ padding: '0.8rem 2rem' }}
                >
                    Volver a la Lista
                </button>
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
                text={`📋 Informe de Inspección\n🏗️ Obra: ${inspectionData.name}\n📅 Fecha: ${new Date(inspectionData.date).toLocaleDateString('es-AR')}\n⚠️ Hallazgos: ${findingCount}\n\nGenerado con Asistente H&S`}
                elementIdToPrint="pdf-content"
            />

            {/* PRINTABLE AREA */}
            <div id="pdf-content" className="bg-white text-black p-4 md:p-12 shadow-sm border border-slate-200 rounded-2xl print-area print:mb-0 print:border-none print:shadow-none"
                style={{ borderTop: findingCount > 0 ? '12px solid #dc2626' : '12px solid #2563eb' }}>
                {/* Header Tripartito HSE */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.5rem', width: '100%' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de Gestión HSE</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: findingCount > 0 ? '#dc2626' : '#2563eb' }}>
                            {findingCount > 0 ? `⚠ ${findingCount} HALLAZGO${findingCount > 1 ? 'S' : ''} DETECTADO${findingCount > 1 ? 'S' : ''}` : '✓ SIN HALLAZGOS CRÍTICOS'}
                        </p>
                    </div>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.9rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>INFORME DE INSPECCIÓN</h1>
                        <div style={{ marginTop: '0.3rem', background: findingCount > 0 ? '#dc2626' : '#2563eb', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                            PROTOCOLO DE RELEVAMIENTO GENERAL DE RIESGOS
                        </div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <CompanyLogo style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }} />
                    </div>
                </div>

                {/* Grilla de datos */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Building2 size={12}/> REFERENCIA / OBRA</span>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginTop: '0.2rem' }}>{inspectionData.name || '-'}</div>
                        </div>
                        <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12}/> FECHA</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{new Date(inspectionData.date).toLocaleDateString('es-AR')}</div>
                        </div>
                        <div style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12}/> UBICACIÓN</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{inspectionData.location || '-'}</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#ffffff' }}>
                        <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={12}/> PROFESIONAL ACTUANTE</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{professional?.name || 'No especificado'}</div>
                        </div>
                        <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.4rem 1rem', background: findingCount > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${findingCount > 0 ? '#fca5a5' : '#86efac'}`, borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>HALLAZGOS</span>
                                <div style={{ fontWeight: 900, fontSize: '1.5rem', color: findingCount > 0 ? '#dc2626' : '#16a34a', lineHeight: 1 }}>{findingCount}</div>
                            </div>
                            <div style={{ padding: '0.4rem 0.8rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 900, fontSize: '0.65rem', color: '#2563eb' }}>FINALIZADO</div>
                        </div>
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
                            {(() => {
                                const categories = [
                                    { items: ['e1', 'e2'] },
                                    { items: ['L1', 'L2'] },
                                    { items: ['p1', 'p2'] },
                                    { items: ['o1', 'o2'] },
                                    { items: ['s1', 's2'] }
                                ];
                                const allItems = categories.flatMap(c => c.items);
                                const total = allItems.length;
                                const okCount = allItems.filter(id => inspectionData.responses?.[id] === 'ok').length;
                                return Math.round((okCount / total) * 100) || 0;
                            })()}%
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6B778C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cumplimiento</div>
                    </div>
                    <div className="card md:col-span-2" style={{ padding: '1.2rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#6B778C', marginBottom: '0.3rem' }}>PROFESIONAL ACTUANTE</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--color-primary)', fontWeight: 900 }}>{professional?.name || 'No especificado'}</div>
                        {professional?.license && <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B778C' }}>MATRÍCULA: {professional.license}</div>}
                    </div>
                </div>

                {/* Header de sección - Resumen */}
                <div style={{ background: '#1e293b', padding: '0.6rem 1rem', borderRadius: '6px 6px 0 0', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <ShieldCheck size={15} color="#86efac" />
                    <span style={{ fontWeight: 900, fontSize: '0.78rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>RESUMEN DE INSPECCIÓN POR ÁREAS</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem', border: '1px solid #cbd5e1', borderRadius: '0 0 6px 6px', padding: '0.8rem', background: '#f8fafc' }}>
                    {[
                        { name: 'Extintores y Protección', id: 'extintores', items: ['e1', 'e2'] },
                        { name: 'Riesgo Eléctrico', id: 'electrico', items: ['L1', 'L2'] },
                        { name: 'EPP', id: 'epp', items: ['p1', 'p2'] },
                        { name: 'Orden y Limpieza', id: 'orden', items: ['o1', 'o2'] },
                        { name: 'Señalización y Evacuación', id: 'senyalizacion', items: ['s1', 's2'] }
                    ].map(cat => {
                        const total = cat.items.length;
                        const ok = cat.items.filter(id => inspectionData.responses?.[id] === 'ok').length;
                        // For fail, we check responses OR if there's an observation for this item
                        const fail = cat.items.filter(id => {
                            const isResponseFail = inspectionData.responses?.[id] === 'fail';
                            const hasObservation = inspectionData.observations?.some(o => o.itemId === id);
                            return isResponseFail || hasObservation;
                        }).length;
                        
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
                                <div style={{ fontSize: '0.75rem', color: '#6B778C', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#00875A' }}>✓ {ok} OK</span>
                                    <span style={{ color: fail > 0 ? '#ef4444' : '#6B778C', fontWeight: fail > 0 ? 900 : 800 }}>
                                        {fail > 0 ? '✕' : ''} {fail} Fallos
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* IPER - Header oscuro */}
                {riskAssessment && riskAssessment.length > 0 && (
                    <div style={{ pageBreakInside: 'avoid', marginBottom: '1.5rem', border: '1px solid #fde68a', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ background: '#1e293b', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldAlert size={15} color="#fbbf24" />
                            <span style={{ fontWeight: 900, fontSize: '0.78rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>EVALUACIÓN DE RIESGOS PREVIA (IPER)</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
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

                {/* Hallazgos - Header oscuro */}
                <div style={{ background: '#1e293b', padding: '0.6rem 1rem', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <TriangleAlert size={15} color="#fca5a5" />
                    <span style={{ fontWeight: 900, fontSize: '0.78rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>DETALLE DE HALLAZGOS Y DESVÍOS</span>
                    {findingCount > 0 && <span style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900 }}>{findingCount} HALLAZGO{findingCount > 1 ? 'S' : ''}</span>}
                </div>

                {findings.length > 0 ? (
                    <div style={{ overflowX: 'auto', marginBottom: '1.5rem', border: '1px solid #fca5a5', borderRadius: '0 0 6px 6px' }}>
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

                {/* Registro fotográfico */}
                {inspectionData.photos && inspectionData.photos.length > 0 && (
                    <div style={{ marginTop: '1.5rem', pageBreakBefore: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ background: '#334155', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Camera size={15} color="#fff" />
                            <span style={{ fontWeight: 900, fontSize: '0.78rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>REGISTRO FOTOGRÁFICO GENERAL DE LA VISITA</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.2rem', padding: '1rem', background: '#f8fafc' }}>
                            {inspectionData.photos.map((photo, index) => (
                                <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', padding: '0.8rem', background: '#f8fafc', pageBreakInside: 'avoid', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    <img src={photo} alt={`Evidencia ${index + 1}`} style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '12px', marginBottom: '0.8rem' }} />
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, textAlign: 'center', color: '#6B778C', textTransform: 'uppercase', letterSpacing: '1px' }}>Evidencia Fotográfica #{index + 1}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Firmas Enterprise */}
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', pageBreakInside: 'avoid', display: 'flex', gap: '1rem', paddingBottom: '1rem' }}>
                    {showSignatures.operator && (
                        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Firma original</span>
                            </div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>OPERADOR / RESPONSABLE</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Firma y Aclaración</p>
                        </div>
                    )}
                    {showSignatures.supervisor && (
                        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>Firma original</span>
                            </div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#1e293b' }}>SUPERVISOR / JEFE DE OBRA</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#64748b' }}>Validación de Auditoría</p>
                        </div>
                    )}
                    {showSignatures.professional && (
                        <div style={{ flex: 1, border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '6px', padding: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ height: '60px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderBottom: '1px solid #86efac', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                {professional?.signature ? (
                                    <img src={professional.signature} alt="Firma Profesional" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: '0.6rem', color: '#86efac' }}>Sello y Firma Digital</span>
                                )}
                            </div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.7rem', color: '#166534' }}>PROFESIONAL ACTUANTE H&S</p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#15803d', fontWeight: 600 }}>{professional?.name || 'Especialista H&S'}</p>
                            {professional?.license && <p style={{ margin: '2px 0 0', fontSize: '0.6rem', color: '#16a34a' }}>Mat: {professional.license}</p>}
                        </div>
                    )}
                </div>
                <PdfBrandingFooter />
            </div>
        </div>
    );
}
