import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Leaf, Shield, AlertTriangle, Clock, CheckCircle2, User, MapPin, Activity, Droplets, Wind, Thermometer, Sun, Eye, Printer, Share2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import EnvironmentalPdf from '../components/EnvironmentalPdf';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';

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
    const [measurement, setMeasurement] = useState({
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

    const handleSave = () => {
        if (!measurement.stationName || !measurement.location) {
            toast.error('Por favor complete los campos obligatorios (*)');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('environmental_measurements_db') || '[]');
        let updated;

        if (isEdit) {
            updated = saved.map((m: any) => m.id === (measurement as any).id ? measurement : m);
            toast.success('Registro ambiental actualizado');
        } else {
            const newMeasurement = {
                ...measurement,
                id: `ENV-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: 'normal'
            };
            updated = [newMeasurement, ...saved];
            toast.success('Registro ambiental guardado');
        }

        localStorage.setItem('environmental_measurements_db', JSON.stringify(updated));
        navigate('/environmental');
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
                        <Leaf size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {isEdit ? 'Editar Monitoreo Ambiental' : 'Nuevo Monitoreo Ambiental'}
                    </h1>
                </div>
                {/* Header Buttons Removed as they are now in the floating bar */}
            </div>

            <main style={{ padding: '3.5rem 1.5rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
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
                    <div style={{ marginTop: '2.5rem' }}>
                        <SignatureCanvas 
                            onSave={(sig) => setMeasurement({ ...measurement, signature: sig || '' })}
                            initialImage={measurement.signature}
                            label="Firma del Técnico Responsable"
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

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <EnvironmentalPdf data={{ ...measurement, id: (measurement as any).id || Date.now().toString(), createdAt: (measurement as any).createdAt || new Date().toISOString() }} />
            </div>
        </div>
    );
}

