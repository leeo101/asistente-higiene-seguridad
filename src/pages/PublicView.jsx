import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicDoc } from '../services/cloudSync';
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

    useEffect(() => {
        const loadDoc = async () => {
            try {
                const data = await fetchPublicDoc(uid, cat, id);
                if (data) {
                    setDocData(data);
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

    return (
        <div style={{ background: 'var(--color-background)', minHeight: '100vh', paddingBottom: '4rem' }}>
            <div className="no-print" style={{ 
                padding: '1rem', 
                background: 'var(--color-surface)', 
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Vista de Documento</span>
                </div>
                <button 
                    onClick={() => window.print()}
                    style={{ 
                        background: 'var(--color-primary)', 
                        color: 'white', 
                        border: 'none', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                    }}
                >
                    <Printer size={16} /> Imprimir / PDF
                </button>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
                <div id="pdf-content">
                    {renderGenerator()}
                </div>
            </div>

            <div className="no-print" style={{ textAlign: 'center', marginTop: '2rem', padding: '0 1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Este documento fue generado con <strong>Asistente HYS</strong>.<br />
                    Para mayor seguridad, verifique siempre la fecha de emisión.
                </p>
            </div>
        </div>
    );
}
