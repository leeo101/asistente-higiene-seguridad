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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                .spin { animation: spin 1.5s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}
            </style>
        </div>
    );
}
