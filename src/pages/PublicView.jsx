import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicDoc, fetchPublicLogo } from '../services/cloudSync';
import { FileText, ArrowLeft, Loader2, AlertTriangle, Printer, Download } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

// PDF Generators
import ATSPdfGenerator from '../components/ATSPdfGenerator';
import AiReportPdfGenerator from '../components/AiReportPdfGenerator';
import WorkPermitPdfGenerator from '../components/WorkPermitPdfGenerator';
import FireLoadPdfGenerator from '../components/FireLoadPdfGenerator';
import RiskMatrixPdfGenerator from '../components/RiskMatrixPdfGenerator';
import LightingPdfGenerator from '../components/LightingPdfGenerator';
import ChecklistPdfGenerator from '../components/ChecklistPdfGenerator';
import AccidentPdfGenerator from '../components/AccidentPdfGenerator';
import TrainingPdfGenerator from '../components/TrainingPdfGenerator';
import ExtinguisherPdfGenerator from '../components/ExtinguisherPdfGenerator';
import ThermalStressPdfGenerator from '../components/ThermalStressPdfGenerator';
import DrillPdfGenerator from '../components/DrillPdfGenerator';
import StopCardPdfGenerator from '../components/StopCardPdfGenerator';
import RiskAssessmentPdfGenerator from '../components/RiskAssessmentPdfGenerator';

export default function PublicView() {
    const { uid, cat, id } = useParams();
    const navigate = useNavigate();
    const [docData, setDocData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPrintMode, setIsPrintMode] = useState(false);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('print') === 'true') {
            setIsPrintMode(true);
        }
    }, []);

    useEffect(() => {
        const loadDoc = async () => {
            try {
                const data = await fetchPublicDoc(uid, cat, id);
                if (data) {
                    setDocData(data);
                    
                    // Fetch owner's logo settings for consistency
                    try {
                        const logoData = await fetchPublicLogo(uid);
                        if (logoData && logoData.logo) {
                            window.sharedLogoData = logoData;
                        }
                    } catch (logoErr) {
                        console.warn('Could not fetch shared logo:', logoErr);
                    }

                    // auto-print if flag is set
                    const searchParams = new URLSearchParams(window.location.search);
                    if (searchParams.get('print') === 'true') {
                        setTimeout(() => {
                            window.print();
                        }, 1000); // Wait for content to stabilize
                    }
                } else {
                    setError('Documento no encontrado o expirado.');
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar el documento.');
            } finally {
                setLoading(false);
            }
        };
        loadDoc();
    }, [uid, cat, id]);

    if (loading) return <LoadingScreen />;

    if (error) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', marginTop: '5rem' }}>
                <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontWeight: 800 }}>{error}</h2>
                <button 
                    onClick={() => navigate('/')} 
                    className="btn-primary" 
                    style={{ marginTop: '2rem', marginInline: 'auto' }}
                >
                    Ir al Inicio
                </button>
            </div>
        );
    }

    const renderGenerator = () => {
        switch (cat) {
            case 'ats': return <ATSPdfGenerator atsData={docData} />;
            case 'camera': return <AiReportPdfGenerator item={docData} />;
            case 'permit': return <WorkPermitPdfGenerator data={docData} />;
            case 'fireload': return <FireLoadPdfGenerator docData={docData} />;
            case 'matrix': return <RiskMatrixPdfGenerator data={docData} />;
            case 'lighting': return <LightingPdfGenerator docData={docData} />;
            case 'checklist': return <ChecklistPdfGenerator docData={docData} />;
            case 'accident': return <AccidentPdfGenerator data={docData} />;
            case 'training': return <TrainingPdfGenerator data={docData} />;
            case 'extinguisher': return <ExtinguisherPdfGenerator data={docData} />;
            case 'thermal': return <ThermalStressPdfGenerator data={docData} />;
            case 'drill': return <DrillPdfGenerator data={docData} />;
            case 'stopcard': return <StopCardPdfGenerator data={docData} />;
            case 'riskassessment': return <RiskAssessmentPdfGenerator docData={docData} />;
            default: return <div>Categoría no soportada.</div>;
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Asistente HYS - ${docData.tema || docData.company || docData.equipo || 'Documento'}`,
            text: `Revisá este documento de Higiene y Seguridad: ${docData.tema || docData.company || ''}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Enlace copiado al portapapeles');
        }
    };

    return (
        <div style={{ background: isPrintMode ? '#fff' : 'var(--color-background)', minHeight: '100vh', paddingBottom: '4rem' }}>
            {!isPrintMode && (
                <div className="no-print" style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'var(--glass-bg)', 
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    boxShadow: 'var(--glass-shadow)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            background: '#ffffff',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            padding: '5px'
                        }}>
                            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--color-text)', letterSpacing: '-0.3px' }}>Asistente HYS</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Documento Verificado</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button 
                            onClick={handleShare}
                            style={{ 
                                background: 'rgba(59, 130, 246, 0.1)', 
                                color: 'var(--color-primary)', 
                                border: '1px solid rgba(59, 130, 246, 0.2)', 
                                padding: '0.5rem', 
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Compartir enlace"
                        >
                            <Download size={18} />
                        </button>
                        <button 
                            onClick={() => window.print()}
                            style={{ 
                                background: 'var(--color-primary)', 
                                color: 'white', 
                                border: 'none', 
                                padding: '0.5rem 1.2rem', 
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
                            }}
                        >
                            <Printer size={18} /> <span className="hidden-mobile">PDF</span>
                        </button>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
                <div style={{ 
                    background: 'var(--color-surface)',
                    borderRadius: '24px',
                    padding: '2rem',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
                    border: '1px solid var(--color-border)',
                    position: 'relative'
                }}>
                    {/* Decorative verify badge */}
                    <div className="no-print" style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        opacity: 0.1,
                        pointerEvents: 'none'
                    }}>
                        <FileText size={80} />
                    </div>

                    <div id="pdf-content">
                        {renderGenerator()}
                    </div>
                </div>
            </div>

            <div className="no-print" style={{ textAlign: 'center', marginTop: '3rem', padding: '0 2rem' }}>
                <p style={{ 
                    fontSize: '0.78rem', 
                    color: 'var(--color-text-muted)', 
                    lineHeight: 1.6,
                    fontWeight: 500,
                    maxWidth: '400px',
                    margin: '0 auto'
                }}>
                    Este documento es una copia auténtica generada mediante <strong>Asistente HYS</strong>.<br />
                    Escanee el código QR original para verificar la integridad de la información.
                </p>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', opacity: 0.5 }}>
                    <Shield size={20} />
                    <KeySquare size={20} />
                    <Activity size={20} />
                </div>
            </div>
        </div>
    );
}

const Shield = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const KeySquare = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.4 2.7a2.5 2.5 0 0 1 3.4 0l4.5 4.5a2.5 2.5 0 0 1 0 3.4l-11 11.1L2 22l.3-7.3 10.1-12z"/></svg>;
const Activity = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
