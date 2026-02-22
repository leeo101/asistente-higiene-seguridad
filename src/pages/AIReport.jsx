import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, ShieldCheck, AlertTriangle, User, Building, MapPin } from 'lucide-react';

export default function AIReport() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);

    useEffect(() => {
        const current = localStorage.getItem('current_ai_inspection');
        const prof = localStorage.getItem('personalData');
        const sig = localStorage.getItem('signatureStampData');

        if (current) setData(JSON.parse(current));
        if (prof) setProfile(JSON.parse(prof));
        if (sig) setSignature(JSON.parse(sig));
    }, []);

    if (!data) return <div className="container">Cargando...</div>;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/ai-camera')} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft size={20} /> Volver a Cámara
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

            <div className="card report-print" style={{
                padding: '3rem',
                minHeight: '29.7cm',
                background: '#ffffff',
                color: '#1e293b',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-primary)', paddingBottom: '2rem', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '1.8rem', fontWeight: 800 }}>Informe de Inspección Visual IA</h1>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem', background: '#f8fafc', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Empresa</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{data.company}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Fecha del Escaneo</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{new Date(data.date).toLocaleString()}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Ubicación</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{data.location}</p>
                    </div>
                </div>

                {/* Evidence Photo */}
                <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'inline-block', border: '4px solid #fff', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                        <img src={data.image} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '450px', display: 'block' }} />
                        {/* Simulated Overlays for Report */}
                        {data.analysis.helmetUsed ? (
                            <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', border: '3px solid #10b981', width: '80px', height: '80px', borderRadius: '50%' }}>
                                <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>CASCO DETECTADO</div>
                            </div>
                        ) : (
                            <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', border: '3px solid #ef4444', width: '80px', height: '80px', borderRadius: '50%' }}>
                                <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>FALTA CASCO</div>
                            </div>
                        )}
                    </div>
                    <p style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>Captura fotográfica del sistema de inspección ocular</p>
                </div>

                {/* Analysis Results */}
                <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>Resultados del Análisis IA</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '8px', background: data.analysis.helmetUsed ? '#f0fdf4' : '#fef2f2', border: `1px solid ${data.analysis.helmetUsed ? '#bbf7d0' : '#fecaca'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: data.analysis.helmetUsed ? '#15803d' : '#b91c1c' }}>
                                {data.analysis.helmetUsed ? <ShieldCheck /> : <AlertTriangle />}
                                <span style={{ fontWeight: 700 }}>Uso de Casco: {data.analysis.helmetUsed ? 'CUMPLE' : 'NO CUMPLE'}</span>
                            </div>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '8px', background: data.analysis.ppeComplete ? '#f0fdf4' : '#fff7ed', border: `1px solid ${data.analysis.ppeComplete ? '#bbf7d0' : '#ffedd5'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: data.analysis.ppeComplete ? '#15803d' : '#c2410c' }}>
                                {data.analysis.ppeComplete ? <ShieldCheck /> : <AlertTriangle />}
                                <span style={{ fontWeight: 700 }}>PPE General: {data.analysis.ppeComplete ? 'ADECUADO' : 'OBSERVADO'}</span>
                            </div>
                        </div>
                    </div>
                </div>

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

                {/* Signature Area */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '4rem' }}>
                    <div style={{ textAlign: 'center', width: '250px' }}>
                        <div style={{ height: '80px', borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Firma del Trabajador</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Aceptación de la observación</p>
                    </div>

                    <div style={{ textAlign: 'center', width: '250px' }}>
                        {signature?.signature ? (
                            <img src={signature.signature} alt="Firma Prof" style={{ maxWidth: '180px', maxHeight: '80px' }} />
                        ) : (
                            <div style={{ height: '80px' }}></div>
                        )}
                        <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{profile?.name}</p>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Responsable Higiene y Seguridad</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ position: 'absolute', bottom: '30px', left: '0', width: '100%', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                    Documento de verificación instantánea generado por Asistente de Higiene y Seguridad.
                </div>
            </div>

            <style>
                {`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; }
                    .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
                    .report-print { height: auto !important; min-height: 0 !important; }
                }
                .spin { animation: spin 1.5s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}
            </style>
        </div>
    );
}
