import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, ShieldCheck, Accessibility, ShieldAlert } from 'lucide-react';

export default function ErgonomicsReport() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const id = searchParams.get('id');
        const history = JSON.parse(localStorage.getItem('ergonomics_history') || '[]');
        const found = history.find(item => item.id === id);
        if (found) setData(found);

        const savedProfile = localStorage.getItem('personalData');
        if (savedProfile) setProfile(JSON.parse(savedProfile));
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '100px' }}>
                    <div style={{ width: '40%', borderTop: '1px solid #333', textAlign: 'center', paddingTop: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{profile?.name || 'Firma Profesional'}</div>
                        <div style={{ fontSize: '12px' }}>{profile?.profession || 'Responsable H&S'}</div>
                        <div style={{ fontSize: '11px' }}>Mat.: {profile?.license || '-----------'}</div>
                    </div>
                    <div style={{ width: '40%', borderTop: '1px solid #333', textAlign: 'center', paddingTop: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Firma Empleador</div>
                        <div style={{ fontSize: '12px' }}>Representante Establecimiento</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
