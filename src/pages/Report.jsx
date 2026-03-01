import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Printer, Building2, User, Calendar, CheckCircle2, AlertCircle, Info, Pencil, AlertTriangle, ChevronRight, Share2, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';

export default function Report() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { requirePro } = usePaywall();
    const [showShare, setShowShare] = useState(false);
    const [inspectionData, setInspectionData] = useState(null);

    const handlePrint = () => requirePro(() => window.print());

    useEffect(() => {
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            setInspectionData(inspection);

            const historyRaw = localStorage.getItem('inspections_history');
            const history = historyRaw ? JSON.parse(historyRaw) : [];

            // Evitar duplicados si se recarga la página
            if (!history.find(item => item.id === inspection.id)) {
                const updatedHistory = [{ ...inspection, status: 'Finalizada' }, ...history];
                localStorage.setItem('inspections_history', JSON.stringify(updatedHistory));
            }
        }
    }, []);

    if (!inspectionData) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
                <p>Cargando datos del reporte...</p>
            </div>
        );
    }

    const findingCount = inspectionData.observations?.length || 0;

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Resumen de Inspección</h1>
            </div>

            <ShareModal
                open={showShare}
                onClose={() => setShowShare(false)}
                title="Resumen de Inspección"
                text={`📋 Resumen de Inspección\n🏗️ Obra: ${inspectionData.name}\n📅 Fecha: ${new Date(inspectionData.date).toLocaleDateString()}\n⚠️ Hallazgos: ${findingCount}\n\nGenerado con Asistente H&S`}
            />

            <div className="card" style={{ background: 'var(--color-primary)', color: 'white', textAlign: 'center', padding: '2rem' }}>
                <CheckCircle2 size={48} style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0' }}>Inspección Finalizada</h2>
                <p style={{ margin: 0, opacity: 0.9 }}>
                    Obra: {inspectionData.name} - {new Date(inspectionData.date).toLocaleDateString()}
                </p>
                {inspectionData.location && <p style={{ margin: '0.3rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>{inspectionData.location}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '2rem 0' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                        {findingCount === 0 ? '100%' : 'En revisión'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Cumplimiento</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: findingCount > 0 ? '#ef4444' : '#10b981' }}>
                        {findingCount}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Hallazgos</div>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Acciones</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={handlePrint} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Printer size={20} />
                        <span>Generar PDF Profesional</span>
                    </div>
                    <ChevronRight size={18} />
                </button>

                <button onClick={() => requirePro(() => setShowShare(true))} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Share2 size={20} />
                        <span>Compartir / Enviar</span>
                    </div>
                    <ChevronRight size={18} />
                </button>
            </div>

            {findingCount > 0 && (
                <div className="card" style={{ marginTop: '2rem', borderLeft: '4px solid #fbbf24' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <AlertTriangle size={24} color="#fbbf24" style={{ flexShrink: 0 }} />
                        <div>
                            <h4 style={{ margin: '0 0 0.3rem 0' }}>Hallazgos Registrados</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Se han detectado {findingCount} incumplimientos que requieren acción correctiva.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
