import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Leaf, Shield, AlertTriangle, Clock, CheckCircle2, User, MapPin, Activity, Droplets, Wind, Thermometer, Sun, Eye, Printer, Share2, Pencil } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import EnvironmentalPdf from '../components/EnvironmentalPdf';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PremiumHeader from '../components/PremiumHeader';

const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    display: 'block'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.8rem 1rem',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    outline: 'none',
    marginTop: '0.5rem',
    boxSizing: 'border-box' as any
};

const labelSubStyle: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.4rem' };

const MONITORING_TYPES = [
    { id: 'air', name: 'Calidad de Aire', icon: '💨' },
    { id: 'water', name: 'Calidad de Agua', icon: '💧' },
    { id: 'noise', name: 'Ruido Ambiental', icon: '🔊' },
    { id: 'waste', name: 'Residuos', icon: '♻️' },
    { id: 'emissions', name: 'Emisiones', icon: '🏭' },
    { id: 'soil', name: 'Suelo', icon: '🌱' }
];

export default function EnvironmentalForm(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const { isPro, requirePro } = usePaywall();

    useDocumentTitle(isEdit ? 'Editar Monitoreo Ambiental' : 'Nuevo Monitoreo Ambiental');
    const [measurement, setMeasurement] = useState<any>({
        stationName: '',
        monitoringType: 'air',
        location: '',
        technician: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        weather: 'clear',
        parameters: {
            temp: '',
            humidity: '',
            pressure: '',
            co2: '',
            pm25: ''
        },
        instrument: {
            model: '',
            serial: '',
            lastCalibration: ''
        },
        regulatoryLimit: '', // VLE (Valor Límite de Exposición)
        observations: '',
        signature: '',
        operatorSignature: '',
        supervisorSignature: '',
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
        window.scrollTo(0, 0);
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

    const handleSave = () => {
        if (!measurement.stationName || !measurement.location) {
            toast.error('Por favor complete los campos obligatorios (*)');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('environmental_measurements_db') || '[]');
        let updated;

        const newMeasurement = {
            ...measurement,
            id: `ENV-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'normal',
            professionalSignature: measurement.professionalSignature || professional.signature,
            professionalName: measurement.professionalName || professional.name,
            professionalLicense: measurement.professionalLicense || professional.license,
            professionalStamp: measurement.professionalStamp || professional.stamp,
        };

        if (isEdit) {
            const entryToSave = {
                ...measurement,
                professionalSignature: measurement.professionalSignature || professional.signature,
                professionalName: measurement.professionalName || professional.name,
                professionalLicense: measurement.professionalLicense || professional.license,
                professionalStamp: measurement.professionalStamp || professional.stamp,
            };
            updated = saved.map((m: any) => m.id === (measurement as any).id ? entryToSave : m);
            toast.success('Registro ambiental actualizado');
        } else {
            updated = [newMeasurement, ...saved];
            toast.success('Registro ambiental guardado');
        }

        localStorage.setItem('environmental_measurements_db', JSON.stringify(updated));
        navigate('/environmental');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: '2rem' }}>
            <div className="no-print" style={{ padding: '2rem 1.5rem 0', maxWidth: '1000px', margin: '0 auto' }}>
                <PremiumHeader
                    title={isEdit ? 'Editar Monitoreo Ambiental' : 'Nuevo Monitoreo Ambiental'}
                    subtitle="Registro de Parámetros y Condiciones"
                    icon={<Leaf size={32} color="#ffffff" />}
                    color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => navigate('/environmental')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #36B37E 0%, #2A9365 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 15px rgba(54, 179, 126, 0.3)'
                        }}
                    >
                        <ArrowLeft size={18} />
                        VOLVER
                    </button>
                </div>
            </div>

            <main style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                        <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Estación / Punto de Muestreo *</label>
                            <input type="text" value={measurement.stationName} onChange={(e) => setMeasurement({ ...measurement, stationName: e.target.value })} style={inputStyle} placeholder="Ej: Estación Meteorológica E1" />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Monitoreo</label>
                            <select value={measurement.monitoringType} onChange={(e) => setMeasurement({ ...measurement, monitoringType: e.target.value })} style={inputStyle}>
                                {MONITORING_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Ubicación / Coordenadas *</label>
                            <input type="text" value={measurement.location} onChange={(e) => setMeasurement({ ...measurement, location: e.target.value })} style={inputStyle} placeholder="Ej: Planta Alta - Sector Chimeneas" />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha de Medición</label>
                            <input type="date" value={measurement.date} onChange={(e) => setMeasurement({ ...measurement, date: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Hora</label>
                            <input type="time" value={measurement.time} onChange={(e) => setMeasurement({ ...measurement, time: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Técnico Responsable</label>
                            <input type="text" value={measurement.technician} onChange={(e) => setMeasurement({ ...measurement, technician: e.target.value })} style={inputStyle} placeholder="Nombre" />
                        </div>
                        <div>
                            <label style={labelStyle}>Condiciones Climáticas</label>
                            <select value={measurement.weather} onChange={(e) => setMeasurement({ ...measurement, weather: e.target.value })} style={inputStyle}>
                                <option value="clear">☀️ Despejado</option>
                                <option value="cloudy">☁️ Nublado</option>
                                <option value="rainy">🌧️ Lluvia</option>
                                <option value="windy">💨 Viento fuerte</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>Parámetros Registrados</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div style={isMobile ? { gridColumn: 'span 2' } : {}}>
                                <label style={labelSubStyle}>Temperatura (°C)</label>
                                <input type="number" step="0.1" value={measurement.parameters.temp} onChange={(e) => setMeasurement({ ...measurement, parameters: { ...measurement.parameters, temp: e.target.value } })} style={inputStyle} placeholder="0.0" />
                            </div>
                            <div>
                                <label style={labelSubStyle}>Humedad (%)</label>
                                <input type="number" step="1" value={measurement.parameters.humidity} onChange={(e) => setMeasurement({ ...measurement, parameters: { ...measurement.parameters, humidity: e.target.value } })} style={inputStyle} placeholder="0" />
                            </div>
                            <div>
                                <label style={labelSubStyle}>Presión (hPa)</label>
                                <input type="number" step="1" value={measurement.parameters.pressure} onChange={(e) => setMeasurement({ ...measurement, parameters: { ...measurement.parameters, pressure: e.target.value } })} style={inputStyle} placeholder="1013" />
                            </div>
                            {measurement.monitoringType === 'air' && (
                                <>
                                    <div>
                                        <label style={labelSubStyle}>CO2 (ppm)</label>
                                        <input type="number" value={measurement.parameters.co2} onChange={(e) => setMeasurement({ ...measurement, parameters: { ...measurement.parameters, co2: e.target.value } })} style={inputStyle} placeholder="400" />
                                    </div>
                                    <div>
                                        <label style={labelSubStyle}>PM2.5 (µg/m³)</label>
                                        <input type="number" value={measurement.parameters.pm25} onChange={(e) => setMeasurement({ ...measurement, parameters: { ...measurement.parameters, pm25: e.target.value } })} style={inputStyle} placeholder="15" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Equipo de Medición (Res. 295/03)</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Marca / Modelo del Instrumento</label>
                                    <input type="text" value={measurement.instrument.model} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, model: e.target.value } })} style={inputStyle} placeholder="Ej: Anemómetro / Luxómetro / Monitor Térmico" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Número de Serie</label>
                                    <input type="text" value={measurement.instrument.serial} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, serial: e.target.value } })} style={inputStyle} placeholder="S/N" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Última Calibración</label>
                                    <input type="date" value={measurement.instrument.lastCalibration} onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, lastCalibration: e.target.value } })} style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>Límites Normativos</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Valor Límite de Exposición (VLE)</label>
                                    <input type="text" value={measurement.regulatoryLimit} onChange={(e) => setMeasurement({ ...measurement, regulatoryLimit: e.target.value })} style={inputStyle} placeholder="Ej: 500 Lux / 28°C WBGT" />
                                </div>
                                <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                        Referencia: Res. SRT 295/03 y Anexos. Asegúrese de comparar el promedio medido con el límite correspondiente a la jornada.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={labelStyle}>Observaciones y Conclusiones del Monitoreo</label>
                        <textarea 
                            value={measurement.observations} 
                            onChange={(e) => setMeasurement({ ...measurement, observations: e.target.value })} 
                            style={{ ...inputStyle, minHeight: '100px', paddingTop: '0.75rem' }} 
                            placeholder="Describa el estado de las instalaciones, fuentes emisoras detectadas y si se cumple con el VLE..."
                        />
                    </div>
                    {/* Firmas y Autorizaciones */}
                    <div className="card animate-fade-in" style={{ marginTop: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                            <Pencil size={22} style={{ color: 'var(--color-primary)' }} /> Firmas y Aprobaciones del Monitoreo
                        </h3>

                        {/* Custom visual switches */}
                        <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { id: 'operator', label: 'Técnico de Campo' },
                                    { id: 'professional', label: 'Especialista H&S' },
                                    { id: 'supervisor', label: 'Responsable / Auditor' }
                                ].map(sig => {
                                    const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                                    return (
                                        <label
                                            key={sig.id}
                                            className="flex items-center gap-2 cursor-pointer select-none"
                                            style={{
                                                padding: '0.55rem 1.1rem',
                                                borderRadius: 'var(--radius-full)',
                                                border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                                                color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',
                                                fontWeight: 750,
                                                fontSize: '0.8rem',
                                                transition: 'all 0.2s ease',
                                                boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={e => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))}
                                                style={{ display: 'none' }}
                                            />
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '4px',
                                                border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                                                background: isChecked ? 'var(--color-primary)' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                {isChecked && <CheckCircle2 size={12} color="white" />}
                                            </div>
                                            {sig.label}
                                        </label>
                                    );
                                })}
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
                                    title: 'TÉCNICO DE CAMPO',
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
                                    title: 'RESPONSABLE AMBIENTAL',
                                    subtitle: 'Aprobación / Autoridad',
                                    signatureUrl: measurement.supervisorSignature || measurement.signature || null,
                                    isProfessional: false
                                } : null}
                            />
                        </div>

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {showSignatures.operator && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                        initialImage={measurement.operatorSignature}
                                        title="Firma de Técnico de Campo"
                                    />
                                </div>
                            )}
                            
                            {showSignatures.professional && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                        initialImage={measurement.professionalSignature || professional.signature}
                                        title="Firma de Especialista H&S"
                                    />
                                </div>
                            )}

                            {showSignatures.supervisor && (
                                <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <SignatureCanvas 
                                        onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                                        initialImage={measurement.supervisorSignature || measurement.signature}
                                        title="Firma de Responsable / Auditor"
                                    />
                                </div>
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
                    <Save size={18} /> GUARDAR REGISTRO
                </button>
            </div>

            <ShareModal
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Monitoreo Ambiental"
                text={`Monitoreo Ambiental: ${measurement.stationName}`}
                rawMessage={`Monitoreo Ambiental: ${measurement.stationName}`}
                fileName={`Ambiente_${measurement.stationName || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: 0, opacity: 0.01, top: 0 }}>
                <EnvironmentalPdf data={{ ...measurement, id: (measurement as any).id || Date.now().toString(), createdAt: (measurement as any).createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

