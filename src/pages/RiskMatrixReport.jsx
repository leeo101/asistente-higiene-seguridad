import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, Download, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

export default function RiskMatrixReport() {
    const navigate = useNavigate();
    const [matrix, setMatrix] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);
    const [showSignatures, setShowSignatures] = useState({
        operator: true,
        supervisor: true,
        professional: true
    });

    useEffect(() => {
        const current = localStorage.getItem('current_risk_matrix');
        const prof = localStorage.getItem('personalData');
        const sig = localStorage.getItem('signatureStampData');

        if (current) setMatrix(JSON.parse(current));
        if (prof) setProfile(JSON.parse(prof));
        if (sig) setSignature(JSON.parse(sig));
    }, []);

    if (!matrix) return <div className="container">Cargando...</div>;

    const getRiskLevel = (p, s) => {
        const product = p * s;
        if (product <= 4) return { label: 'Bajo', color: '#10b981' };
        if (product <= 9) return { label: 'Moderado', color: '#f59e0b' };
        return { label: 'Crítico', color: '#ef4444' };
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/history')} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft size={20} /> Volver a Historial
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

            <div className="card report-print" style={{ padding: '2rem' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1.5rem', marginBottom: '2rem', gap: '1rem' }} className="flex-col sm:flex-row">
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '1.8rem' }}>Matriz de Evaluación de Riesgos</h1>
                        <p style={{ margin: 0, fontWeight: 700 }}>{matrix.name}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{matrix.location}</p>
                    </div>
                    <div className="md:text-right">
                        <p style={{ margin: 0, fontWeight: 600 }}>ID: #{matrix.id.toString().slice(-6)}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Fecha: {new Date(matrix.date).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Professional Info */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }} className="flex-col sm:flex-row">
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Responsable de Evaluación</h4>
                        <p style={{ margin: 0, fontWeight: 700 }}>{profile?.name || matrix.responsable}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>{profile?.profession}</p>
                    </div>
                    <div style={{ flex: 1 }} className="md:text-right">
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Marco Legal</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Ley 19.587 de Higiene y Seguridad</p>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Decreto 351/79</p>
                    </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto w-full mb-8">
                    <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', fontSize: '0.75rem' }}>Tarea / Proceso</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', fontSize: '0.75rem' }}>Tipo</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', fontSize: '0.75rem' }}>Peligro / Riesgo</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', fontSize: '0.75rem' }}>Efecto Probable</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'center', fontSize: '0.75rem', width: '30px' }}>Exp</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'center', fontSize: '0.75rem', width: '30px' }}>P</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'center', fontSize: '0.75rem', width: '30px' }}>S</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'center', fontSize: '0.75rem', width: '60px' }}>Nivel</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '0.8rem', textAlign: 'left', fontSize: '0.75rem' }}>Medidas de Control</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.rows.map((row, i) => {
                                const level = getRiskLevel(row.probability, row.severity);
                                return (
                                    <tr key={i}>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', fontSize: '0.75rem' }}>{row.task}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', fontSize: '0.75rem' }}>{row.hazardType}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', fontSize: '0.75rem' }}>{row.hazard}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', fontSize: '0.75rem' }}>{row.probableEffect}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center', fontSize: '0.75rem' }}>{row.exposedCount}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem' }}>{row.probability}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem' }}>{row.severity}</td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', textAlign: 'center' }}>
                                            <div style={{ color: level.color, fontWeight: 800, fontSize: '0.7rem' }}>{level.label}</div>
                                        </td>
                                        <td style={{ border: '1px solid #e2e8f0', padding: '0.6rem', fontSize: '0.75rem' }}>{row.controls}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary / Conclusion Area */}
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

                <div className="flex flex-row justify-around items-start w-full gap-8 mt-10">
                    {showSignatures.operator && (
                        <div className="flex-1 flex flex-col items-center pt-24 text-center">
                            <div className="w-full border-t-2 border-slate-400 border-dashed mb-3"></div>
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">OPERADOR</p>
                            <p className="text-[0.8rem] font-black uppercase text-black leading-none min-h-[0.8rem]">Aclaración y Firma</p>
                        </div>
                    )}

                    {showSignatures.supervisor && (
                        <div className="flex-1 flex flex-col items-center pt-24 text-center">
                            <div className="w-full border-t-2 border-slate-400 border-dashed mb-3"></div>
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">SUPERVISOR</p>
                            <p className="text-[0.8rem] font-black uppercase text-black leading-none min-h-[0.8rem]">Aclaración y Firma</p>
                        </div>
                    )}

                    {showSignatures.professional && (
                        <div className="flex-1 flex flex-col items-center text-center">
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: '1px dashed var(--color-border)', borderRadius: '4px', minHeight: '90px', background: 'white', padding: '0.5rem', width: '100%' }}>
                                {signature?.signature ? (
                                    <img src={signature.signature} alt="Firma" style={{ height: '40px', maxWidth: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ height: '40px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#999' }}>Sin Firma</div>
                                )}
                            </div>
                            <div className="print:block hidden w-full border-t-2 border-slate-400 border-dashed mt-8 mb-3"></div>
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">PROFESIONAL ACTUANTE</p>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem' }}>{profile?.name}</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Mat: {profile?.license}</p>
                        </div>
                    )}
                </div>

                {/* Stamp if available */}
                {showSignatures.professional && signature?.stamp && (
                    <div style={{ position: 'absolute', bottom: '40px', left: '40px', opacity: 0.8 }}>
                        <img src={signature.stamp} alt="Sello" style={{ maxWidth: '100px' }} />
                    </div>
                )}
            </div>

        </div>
    );
}
