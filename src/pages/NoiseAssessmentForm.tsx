import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Volume2, Save, Eye, Printer, Share2, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import NoiseAssessmentPdf from '../components/NoiseAssessmentPdf';
import PdfSignatures from '../components/PdfSignatures';
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
    const [measurement, setMeasurement] = useState<any>({
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
        signature: '',
        operatorSignature: '',
        supervisorSignature: '',
        professionalSignature: '',
        showSignatures: { operator: true, professional: true, supervisor: true }
    });

    const [professional, setProfessional] = useState<any>({
        name: '',
        license: '',
        signature: null,
        stamp: null
    });

    const setShowSignatures = (updater: any) => {
        setMeasurement((prev: any) => {
            const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
            return { ...prev, showSignatures: updated };
        });
    };

    const showSignatures = measurement.showSignatures || { operator: true, professional: true, supervisor: true };

    useEffect(() => {
        if (location.state?.editData) {
            const ed = location.state.editData;
            setMeasurement({
                ...ed,
                operatorSignature: ed.operatorSignature || '',
                supervisorSignature: ed.supervisorSignature || ed.signature || '',
                signature: ed.signature || ed.supervisorSignature || '',
                showSignatures: ed.showSignatures || { operator: true, professional: true, supervisor: true }
            });
            setIsEdit(true);
        }
    }, [location.state]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);

        const savedData = localStorage.getItem('personalData');
        const savedSigData = localStorage.getItem('signatureStampData');
        const legacySignature = localStorage.getItem('capturedSignature');

        let signature = legacySignature || null;
        let stamp = null;
        if (savedSigData) {
            const parsed = JSON.parse(savedSigData);
            signature = parsed.signature || signature;
            stamp = parsed.stamp || null;
        }

        if (savedData) {
            const data = JSON.parse(savedData);
            setProfessional({
                name: data.name || '',
                license: data.license || '',
                signature: signature,
                stamp: stamp
            });
        } else {
            setProfessional((prev: any) => ({ ...prev, signature, stamp }));
        }

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

        const newEntry = {
            ...measurement,
            id: `NA-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: calculateRiskLevel(parseFloat(measurement.levels.lavg) || 0),
            professionalSignature: measurement.professionalSignature || professional.signature,
            professionalName: measurement.professionalName || professional.name,
            professionalLicense: measurement.professionalLicense || professional.license,
            professionalStamp: measurement.professionalStamp || professional.stamp,
            showSignatures: measurement.showSignatures || { operator: true, professional: true, supervisor: true }
        };

        if (isEdit) {
            const entryToSave = {
                ...measurement,
                professionalSignature: measurement.professionalSignature || professional.signature,
                professionalName: measurement.professionalName || professional.name,
                professionalLicense: measurement.professionalLicense || professional.license,
                professionalStamp: measurement.professionalStamp || professional.stamp,
            };
            updated = saved.map((n: any) => n.id === (measurement as any).id ? entryToSave : n);
            toast.success('Medición actualizada');
        } else {
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

                    {/* Firmas y Autorizaciones */}
                    <div style={{ marginTop: '3rem', borderTop: '2px dashed var(--color-border)', paddingTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Pencil size={20} /> Firmas y Aprobaciones de la Medición
                        </h3>

                        <div className="no-print mb-8 p-6 bg-slate-50/5 border border-[var(--color-border)] rounded-xl w-full flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center text-sm font-bold text-slate-700" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>
                            <div className="text-center" style={{ color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 700 }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <input type="checkbox" checked={showSignatures.operator} onChange={e => setShowSignatures((s: any) => ({ ...s, operator: e.target.checked }))} className="w-5 h-5 accent-blue-600" /> Trabajador Evaluado
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <input type="checkbox" checked={showSignatures.professional} onChange={e => setShowSignatures((s: any) => ({ ...s, professional: e.target.checked }))} className="w-5 h-5 accent-blue-600" /> Especialista H&S
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <input type="checkbox" checked={showSignatures.supervisor} onChange={e => setShowSignatures((s: any) => ({ ...s, supervisor: e.target.checked }))} className="w-5 h-5 accent-blue-600" /> Responsable / Auditor
                                </label>
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <PdfSignatures
                                data={{
                                    ...measurement,
                                    professionalSignature: professional.signature,
                                    professionalName: professional.name,
                                    professionalLicense: professional.license,
                                    professionalStamp: professional.stamp
                                }}
                                box1={showSignatures.operator ? {
                                    title: 'TRABAJADOR EVALUADO',
                                    subtitle: 'Firma y Aclaración',
                                    signatureUrl: measurement.operatorSignature || null,
                                    isProfessional: false
                                } : null}
                                box2={showSignatures.professional ? {
                                    title: 'ESPECIALISTA H&S',
                                    subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                                    signatureUrl: measurement.professionalSignature || professional.signature || null,
                                    stampUrl: measurement.professionalStamp || professional.stamp || null,
                                    isProfessional: true,
                                    license: professional.license
                                } : null}
                                box3={showSignatures.supervisor ? {
                                    title: 'RESPONSABLE / AUDITOR',
                                    subtitle: 'Aprobación / Autoridad',
                                    signatureUrl: measurement.supervisorSignature || measurement.signature || null,
                                    isProfessional: false
                                } : null}
                            />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)]" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '2rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                            {showSignatures.operator && (
                                <SignatureCanvas 
                                    onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                    initialImage={measurement.operatorSignature}
                                    label="Firma de Trabajador Evaluado"
                                />
                            )}
                            
                            {showSignatures.professional && (
                                <SignatureCanvas 
                                    onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                    initialImage={measurement.professionalSignature || professional.signature}
                                    label="Firma de Especialista H&S"
                                />
                            )}

                            {showSignatures.supervisor && (
                                <SignatureCanvas 
                                    onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                                    initialImage={measurement.supervisorSignature || measurement.signature}
                                    label="Firma de Responsable / Auditor"
                                />
                            )}
                        </div>
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
                <NoiseAssessmentPdf data={{
                    ...measurement,
                    professionalSignature: measurement.professionalSignature || professional.signature,
                    professionalName: professional.name,
                    professionalLicense: professional.license,
                    professionalStamp: measurement.professionalStamp || professional.stamp,
                    id: (measurement as any).id || Date.now().toString(),
                    createdAt: (measurement as any).createdAt || new Date().toISOString()
                }} />
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

