import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, ShieldCheck, Accessibility, ShieldAlert } from 'lucide-react';

export default function ErgonomicsReport() {
    const navigate = useNavigate();
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
                <div style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '22px', textTransform: 'uppercase' }}>Protocolo de Ergonomía</h1>
                        <p style={{ margin: '5px 0 0', fontSize: '14px', fontWeight: 'bold' }}>Resolución SRT N° 886/15</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                        {Object.entries(data.planilla1).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px' }}>
                                <div style={{
                                    width: '18px', height: '18px', border: '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center'
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

                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', gap: '2rem', marginTop: '60px' }}>
                    {showSignatures.operator && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', items: 'center', paddingTop: '80px', textAlign: 'center' }}>
                            <div style={{ width: '100%', borderTop: '2px dashed #94a3b8', marginBottom: '10px' }}></div>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>OPERADOR</p>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>Aclaración y Firma</p>
                        </div>
                    )}

                    {showSignatures.supervisor && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', items: 'center', paddingTop: '80px', textAlign: 'center' }}>
                            <div style={{ width: '100%', borderTop: '2px dashed #94a3b8', marginBottom: '10px' }}></div>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>SUPERVISOR / EMPLEADOR</p>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>Firma Autorizada</p>
                        </div>
                    )}

                    {showSignatures.professional && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', items: 'center', textAlign: 'center' }}>
                            <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #e2e8f0', borderRadius: '4px', padding: '5px', width: '100%' }}>
                                {signature?.signature ? (
                                    <img src={signature.signature} alt="Firma" style={{ height: '50px', maxWidth: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ fontSize: '10px', color: '#999' }}>Sin Firma Digitada</div>
                                )}
                            </div>
                            <div style={{ width: '100%', borderTop: '2px dashed #94a3b8', marginTop: '10px', marginBottom: '10px' }}></div>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>PROFESIONAL ACTUANTE</p>
                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{profile?.name}</div>
                            <div style={{ fontSize: '11px' }}>Mat.: {profile?.license}</div>
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
