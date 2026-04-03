import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Volume2, Save, Eye, Printer, Share2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import NoiseAssessmentPdf from '../components/NoiseAssessmentPdf';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';

const NOISE_LIMITS = {
    actionLevel: 80,
    actionLevelHigh: 85,
    limitValue: 87,
    peakAction: 135,
    peakLimit: 140
};

const HEARING_PROTECTION = [
    { id: 'earplugs', name: 'Tapones de espuma', nrr: 29 },
    { id: 'earmuffs', name: 'Orejeras', nrr: 25 },
    { id: 'dual', name: 'Protección dual', nrr: 35 }
];

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--color-text)'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-background)',
    color: 'var(--color-text)',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box' as any,
    transition: 'all 0.2s'
};

export default function NoiseAssessmentForm(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const { requirePro } = usePaywall();

    useDocumentTitle(isEdit ? 'Editar Medición de Ruido' : 'Nueva Medición de Ruido');
    const [measurement, setMeasurement] = useState({
        workerName: '',
        type: 'personal',
        date: new Date().toISOString().split('T')[0],
        location: '',
        task: '',
        duration: '',
        levels: { lavg: '', lmax: '', lmin: '', lpeak: '', lex8h: '' },
        hearingProtection: '',
        observations: '',
        technician: '',
        instrument: {
            model: '',
            serial: '',
            lastCalibration: ''
        },
        backgroundNoise: '',
        signature: ''
    });

    useEffect(() => {
        if (location.state?.editData) {
            setMeasurement(location.state.editData);
            setIsEdit(true);
        }
    }, [location.state]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const calculateRiskLevel = (level: number) => {
        if (level >= NOISE_LIMITS.limitValue) return { level: 'critical', color: '#dc2626', label: 'CRÍTICO' };
        if (level >= NOISE_LIMITS.actionLevelHigh) return { level: 'high', color: '#f59e0b', label: 'ALTO' };
        if (level >= NOISE_LIMITS.actionLevel) return { level: 'medium', color: '#eab308', label: 'MEDIO' };
        return { level: 'low', color: '#16a34a', label: 'BAJO' };
    };

    const handleSave = () => {
        if (!measurement.workerName || !measurement.levels.lavg) {
            toast.error('Por favor complete los campos obligatorios (*)');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('noise_assessments_db') || '[]');
        let updated;

        if (isEdit) {
            updated = saved.map((n: any) => n.id === (measurement as any).id ? measurement : n);
            toast.success('Medición actualizada');
        } else {
            const newEntry = {
                ...measurement,
                id: `NA-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: calculateRiskLevel(parseFloat(measurement.levels.lavg) || 0)
            };
            updated = [newEntry, ...saved];
            toast.success('Medición guardada');
        }
        
        localStorage.setItem('noise_assessments_db', JSON.stringify(updated));
        navigate('/noise-assessment');
    };

    const handleLevelChange = (field: string, value: string) => {
        setMeasurement({ ...measurement, levels: { ...measurement.levels, [field]: value } });
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: '5.5rem',
                zIndex: 100,
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '0.5rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900 }}>
                        <Volume2 size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {isEdit ? 'Editar Medición' : 'Nueva Medición'}
                    </h1>
                </div>
                {/* Header Buttons Removed as they are now in the floating bar */}
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Trabajador *</label>
                            <input type="text" value={measurement.workerName} onChange={(e) => setMeasurement({ ...measurement, workerName: e.target.value })} style={inputStyle} placeholder="Nombre completo" />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha</label>
                            <input type="date" value={measurement.date} onChange={(e) => setMeasurement({ ...measurement, date: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación</label>
                            <input type="text" value={measurement.location} onChange={(e) => setMeasurement({ ...measurement, location: e.target.value })} style={inputStyle} placeholder="Ej: Planta Principal" />
                        </div>
                        <div>
                            <label style={labelStyle}>Tarea</label>
                            <input type="text" value={measurement.task} onChange={(e) => setMeasurement({ ...measurement, task: e.target.value })} style={inputStyle} placeholder="Ej: Operación de sierra" />
                        </div>
                        <div>
                            <label style={labelStyle}>Duración (horas)</label>
                            <input type="number" step="0.5" value={measurement.duration} onChange={(e) => setMeasurement({ ...measurement, duration: e.target.value })} style={inputStyle} placeholder="8" />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Niveles de Ruido (dB)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
                            <LevelInput label="Lavg (Promedio) *" value={measurement.levels.lavg} onChange={(v) => handleLevelChange('lavg', v)} placeholder="85" />
                            <LevelInput label="Lmax" value={measurement.levels.lmax} onChange={(v) => handleLevelChange('lmax', v)} placeholder="95" />
                            <LevelInput label="Lmin" value={measurement.levels.lmin} onChange={(v) => handleLevelChange('lmin', v)} placeholder="70" />
                            <LevelInput label="Lpeak" value={measurement.levels.lpeak} onChange={(v) => handleLevelChange('lpeak', v)} placeholder="130" />
                            <LevelInput label="Lex 8h" value={measurement.levels.lex8h} onChange={(v) => handleLevelChange('lex8h', v)} placeholder="82" />
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <label style={labelStyle}>Protección Auditiva</label>
                        <select value={measurement.hearingProtection} onChange={(e) => setMeasurement({ ...measurement, hearingProtection: e.target.value })} style={inputStyle}>
                            <option value="">Sin protección</option>
                            {HEARING_PROTECTION.map(hp => (
                                <option key={hp.id} value={hp.id}>{hp.name} (NRR: {hp.nrr})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Detalle del Equipo (Res. SRT 85/12)</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Marca y Modelo del Decibelímetro</label>
                                    <input type="text" value={measurement.instrument.model} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, model: e.target.value } })} style={inputStyle} placeholder="Ej: Casella 63x / Quest" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Número de Serie</label>
                                    <input type="text" value={measurement.instrument.serial} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, serial: e.target.value } })} style={inputStyle} placeholder="Ej: S/N 123456" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Última Calibración</label>
                                    <input type="date" value={measurement.instrument.lastCalibration} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, lastCalibration: e.target.value } })} style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Condiciones de Medición</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Ruido de Fondo (dB)</label>
                                    <input type="number" step="0.1" value={measurement.backgroundNoise} onChange={(e) => setMeasurement({ ...measurement, backgroundNoise: e.target.value })} style={inputStyle} placeholder="dB(A)" />
                                </div>
                                <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                        Nota: Según Res. 85/12, si la diferencia entre el ruido total y el de fondo es menor a 3dB, la medición no es válida para el puesto.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <label style={labelStyle}>Observaciones / Conclusiones del Técnico</label>
                        <textarea 
                            value={measurement.observations} 
                            onChange={(e) => setMeasurement({ ...measurement, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '80px', paddingTop: '0.75rem' }} 
                            placeholder="Describa condiciones ambientales, anomalías o recomendaciones..."
                        />
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <label style={labelStyle}>Profesional / Técnico Responsable</label>
                        <input type="text" value={measurement.technician} onChange={(e) => setMeasurement({ ...measurement, technician: e.target.value })} style={inputStyle} placeholder="Nombre y Apellido del Técnico" />
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <SignatureCanvas 
                            onSave={(sig) => setMeasurement({ ...measurement, signature: sig || '' })}
                            initialImage={measurement.signature}
                            label="Firma del Profesional / Técnico"
                        />
                    </div>
                </div>

            </main>

            <div className="no-print floating-action-bar">
                <button
                    onClick={() => requirePro(() => setShowShareModal(true))}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => requirePro(() => window.print())}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: '#ffffff' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Save size={18} /> GUARDAR MEDICIÓN
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Medición de Ruido"
                text={`Evaluación de Ruido - ${measurement.workerName}`}
                rawMessage={`Evaluación de Ruido - ${measurement.workerName}`}
                fileName={`Ruido_${measurement.workerName || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <NoiseAssessmentPdf data={{ ...measurement, id: (measurement as any).id || Date.now().toString(), createdAt: (measurement as any).createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

function LevelInput({ label, value, onChange, placeholder }) {
    return (
        <div>
            <label style={{ ...labelStyle, fontSize: '0.75rem' }}>{label}</label>
            <input 
                type="number" 
                step="0.1" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                style={{ ...inputStyle, padding: '0.6rem 0.75rem', fontSize: '0.9rem' }} 
                placeholder={placeholder} 
            />
        </div>
    );
}

