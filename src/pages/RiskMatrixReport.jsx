import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, Download, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

export default function RiskMatrixReport() {
    const navigate = useNavigate();
    const [matrix, setMatrix] = useState(null);
    const [profile, setProfile] = useState(null);
    const [signature, setSignature] = useState(null);

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
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '1.8rem' }}>Matriz de Evaluación de Riesgos</h1>
                        <p style={{ margin: 0, fontWeight: 700 }}>{matrix.name}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{matrix.location}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>ID: #{matrix.id.toString().slice(-6)}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Fecha: {new Date(matrix.date).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Professional Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Responsable de Evaluación</h4>
                        <p style={{ margin: 0, fontWeight: 700 }}>{profile?.name || matrix.responsable}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>{profile?.profession}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Marco Legal</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Ley 19.587 de Higiene y Seguridad</p>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Decreto 351/79</p>
                    </div>
                </div>

                {/* Matrix Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
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

                {/* Summary / Conclusion Area */}
                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'center', width: '250px' }}>
                        {signature?.signature ? (
                            <img src={signature.signature} alt="Firma" style={{ maxWidth: '180px', maxHeight: '80px', marginBottom: '0.5rem' }} />
                        ) : (
                            <div style={{ height: '80px' }}></div>
                        )}
                        <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{profile?.name}</p>
                            <p style={{ margin: 0, fontSize: '0.8rem' }}>{profile?.profession}</p>
                            {profile?.license && <p style={{ margin: 0, fontSize: '0.8rem' }}>Mat: {profile.license}</p>}
                        </div>
                    </div>
                </div>

                {/* Stamp if available */}
                {signature?.stamp && (
                    <div style={{ position: 'absolute', bottom: '40px', left: '40px', opacity: 0.8 }}>
                        <img src={signature.stamp} alt="Sello" style={{ maxWidth: '100px' }} />
                    </div>
                )}
            </div>

            <style>
                {`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; color: black !important; }
                    .container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    .report-print { border: none !important; box-shadow: none !important; width: 100% !important; padding: 0.5cm !important; }
                    .card { border: none !important; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                }
                `}
            </style>
        </div>
    );
}
