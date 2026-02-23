import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, Download, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ErgonomicsReport() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);
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

    const handlePrint = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        const status = localStorage.getItem('subscriptionStatus');
        if (status !== 'active') {
            navigate('/subscribe');
            return;
        }
        window.print();
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
                <button
                    onClick={() => navigate('/ergonomics')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={24} /> Volver
                </button>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={handlePrint} className="btn-secondary" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Printer size={18} /> IMPRIMIR
                    </button>
                    <button className="btn-primary" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Share2 size={18} /> COMPARTIR
                    </button>
                </div>
            </div>

            <div className="report-print" style={{
                background: 'white',
                color: '#1a1a1a',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                minHeight: '29.7cm',
                fontFamily: 'Arial, sans-serif'
            }}>
                {/* Header Legal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '30px', gap: '20px' }} className="flex-col md:flex-row">
                    <div>
                        <h1 style={{ margin: 0, fontSize: '22px', textTransform: 'uppercase' }}>Protocolo de Ergonomía</h1>
                        <p style={{ margin: '5px 0 0', fontSize: '14px', fontWeight: 'bold' }}>Resolución SRT N° 886/15</p>
                    </div>
                    <div style={{ textAlign: 'right' }} className="md:text-right">
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>Estudio Ergonómico</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Fecha: {new Date(parseInt(data.id)).toLocaleDateString()}</div>
                    </div>
                </div>

                {/* Datos Empresa */}
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ background: '#f5f5f5', padding: '10px 15px', fontWeight: 'bold', marginBottom: '15px', borderLeft: '4px solid #3b82f6' }}>
                        I - DATOS DEL ESTABLECIMIENTO
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px', border: '1px solid #ddd', width: '30%', fontWeight: 'bold' }}>Empresa / Razón Social:</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{data.empresa}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Sector:</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{data.sector}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Puesto de Trabajo:</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{data.puesto}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Planilla 1 */}
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ background: '#f5f5f5', padding: '10px 15px', fontWeight: 'bold', marginBottom: '15px', borderLeft: '4px solid #3b82f6' }}>
                        II - PLANILLA 1: IDENTIFICACIÓN DE FACTORES DE RIESGO
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[12px]">
                        {Object.entries(data.planilla1).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px' }}>
                                <div style={{
                                    width: '18px', height: '18px', border: '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {val ? 'X' : ''}
                                </div>
                                <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Planilla 2.A (Si existe) */}
                {data.planilla1.levantamientoCarga && (
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ background: '#f5f5f5', padding: '10px 15px', fontWeight: 'bold', marginBottom: '15px', borderLeft: '4px solid #3b82f6' }}>
                            III - PLANILLA 2.A: EVALUACIÓN DE LEVANTAMIENTO DE CARGAS
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', width: '40%' }}>Peso Efectivo Manipulado:</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{data.calculoLevantamiento.peso} kg</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>Nivel de Riesgo Determinado:</td>
                                    <td style={{ padding: '8px', border: '1px solid #ddd', color: data.riesgo === 'Moderado' ? '#e11d48' : '#16a34a', fontWeight: 'bold' }}>
                                        {data.riesgo}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Recomendaciones */}
                <div style={{ marginBottom: '50px' }}>
                    <div style={{ background: '#f5f5f5', padding: '10px 15px', fontWeight: 'bold', marginBottom: '15px', borderLeft: '4px solid #3b82f6' }}>
                        IV - RECOMENDACIONES DE ACCIÓN
                    </div>
                    <div style={{ minHeight: '100px', border: '1px solid #ddd', padding: '15px', fontSize: '13px' }}>
                        {data.recomendaciones || 'No se registran recomendaciones específicas.'}
                    </div>
                </div>

                {/* Firmas */}
                <div className="no-print mt-10 mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 justify-between items-center text-xs font-bold text-slate-700">
                    <div>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-4">
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

                <div className="flex flex-col sm:flex-row justify-around items-start w-full gap-8 mt-10">
                    {showSignatures.operator && (
                        <div className="flex-1 flex flex-col items-center pt-16 sm:pt-20 text-center w-full">
                            <div className="w-full border-t-2 border-slate-400 border-dashed mb-3"></div>
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">OPERADOR</p>
                            <p className="text-[0.8rem] font-black uppercase text-black leading-none min-h-[0.8rem]">Aclaración y Firma</p>
                        </div>
                    )}

                    {showSignatures.supervisor && (
                        <div className="flex-1 flex flex-col items-center pt-16 sm:pt-20 text-center w-full">
                            <div className="w-full border-t-2 border-slate-400 border-dashed mb-3"></div>
                            <p className="text-[0.65rem] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">SUPERVISOR / EMPLEADOR</p>
                            <p className="text-[0.8rem] font-black uppercase text-black leading-none min-h-[0.8rem]">Firma Autorizada</p>
                        </div>
                    )}

                    {showSignatures.professional && (
                        <div className="flex-1 flex flex-col items-center text-center w-full mt-8 sm:mt-0">
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
                    <div style={{ position: 'absolute', bottom: '60px', left: '60px', opacity: 0.8 }}>
                        <img src={signature.stamp} alt="Sello" style={{ maxWidth: '90px' }} />
                    </div>
                )}
            </div>
        </div>
    );
}
