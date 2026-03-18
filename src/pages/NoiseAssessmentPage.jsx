import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Plus, Search, Filter, Download, CheckCircle2,
    XCircle, Clock, User, Users, Calendar, AlertTriangle,
    Volume2, Activity, BarChart3, Eye, Trash2, Edit3
} from 'lucide-react';
import CompanyLogo from '../components/CompanyLogo';

// Límites según ISO 9612
const NOISE_LIMITS = {
    actionLevel: 80,
    actionLevelHigh: 85,
    limitValue: 87,
    peakAction: 135,
    peakLimit: 140
};

const MEASUREMENT_TYPES = [
    { id: 'personal', name: 'Dosimetría Personal', icon: '👤' },
    { id: 'area', name: 'Medición de Área', icon: '📍' },
    { id: 'peak', name: 'Ruido de Impacto', icon: '💥' },
    { id: 'octave', name: 'Análisis Octavas', icon: '🎵' }
];

const HEARING_PROTECTION = [
    { id: 'earplugs', name: 'Tapones de espuma', nrr: 29 },
    { id: 'earmuffs', name: 'Orejeras', nrr: 25 },
    { id: 'dual', name: 'Protección dual', nrr: 35 }
];

export default function NoiseAssessmentPage() {
    const navigate = useNavigate();
    const [measurements, setMeasurements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const [newMeasurement, setNewMeasurement] = useState({
        workerName: '',
        type: 'personal',
        date: new Date().toISOString().split('T')[0],
        location: '',
        task: '',
        duration: '',
        levels: { lavg: '', lmax: '', lmin: '', lpeak: '', lex8h: '' },
        hearingProtection: '',
        observations: '',
        technician: ''
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        
        const saved = localStorage.getItem('noise_assessment_db');
        if (saved) setMeasurements(JSON.parse(saved));
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const saveMeasurements = (data) => {
        localStorage.setItem('noise_assessment_db', JSON.stringify(data));
        setMeasurements(data);
    };

    const handleAddMeasurement = () => {
        if (!newMeasurement.workerName || !newMeasurement.levels.lavg) return;
        
        const measurement = {
            ...newMeasurement,
            id: `NA-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: calculateRiskLevel(parseFloat(newMeasurement.levels.lavg) || 0)
        };

        saveMeasurements([measurement, ...measurements]);
        setShowAddModal(false);
        resetForm();
    };

    const resetForm = () => {
        setNewMeasurement({
            workerName: '',
            type: 'personal',
            date: new Date().toISOString().split('T')[0],
            location: '',
            task: '',
            duration: '',
            levels: { lavg: '', lmax: '', lmin: '', lpeak: '', lex8h: '' },
            hearingProtection: '',
            observations: '',
            technician: ''
        });
    };

    const calculateRiskLevel = (level) => {
        if (level >= NOISE_LIMITS.limitValue) return { level: 'critical', color: '#dc2626', label: 'CRÍTICO' };
        if (level >= NOISE_LIMITS.actionLevelHigh) return { level: 'high', color: '#f59e0b', label: 'ALTO' };
        if (level >= NOISE_LIMITS.actionLevel) return { level: 'medium', color: '#eab308', label: 'MEDIO' };
        return { level: 'low', color: '#16a34a', label: 'BAJO' };
    };

    const deleteMeasurement = (id) => {
        if (confirm('¿Eliminar esta medición?')) {
            saveMeasurements(measurements.filter(m => m.id !== id));
        }
    };

    const filteredMeasurements = measurements.filter(m =>
        m.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: measurements.length,
        critical: measurements.filter(m => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'critical').length,
        avgLevel: measurements.length > 0 
            ? (measurements.reduce((sum, m) => sum + (parseFloat(m.levels.lavg) || 0), 0) / measurements.length).toFixed(1)
            : 0
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: isMobile ? '80px' : '2rem' }}>
            {/* Header */}
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: isMobile ? '1rem' : '1.5rem',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    maxWidth: '1400px',
                    margin: '0 auto'
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
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900 }}>
                            <Volume2 size={isMobile ? 20 : 24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            Evaluación de Ruido
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            ISO 9612 • {measurements.length} mediciones
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                        style={{
                            width: 'auto',
                            margin: 0,
                            padding: '0.75rem 1.25rem',
                            display: isMobile ? 'none' : 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        Nueva Medición
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: '1rem',
                padding: isMobile ? '1rem' : '1.5rem',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<Activity size={20} />} />
                <StatCard label="Críticas" value={stats.critical} color="#dc2626" icon={<AlertTriangle size={20} />} />
                <StatCard label="Promedio dB" value={stats.avgLevel} color="#8b5cf6" icon={<Volume2 size={20} />} />
            </div>

            {/* Search & Add Button Mobile */}
            {isMobile && (
                <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                        style={{
                            width: 'auto',
                            margin: 0,
                            padding: '0 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Plus size={20} />
                    </button>
                </div>
            )}

            {/* Measurements List */}
            <div style={{
                padding: isMobile ? '0 1rem' : '0 1.5rem',
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
            }}>
                {filteredMeasurements.length === 0 ? (
                    <EmptyState onAdd={() => setShowAddModal(true)} isMobile={isMobile} />
                ) : (
                    filteredMeasurements.map(m => (
                        <MeasurementCard
                            key={m.id}
                            measurement={m}
                            riskLevel={calculateRiskLevel(parseFloat(m.levels.lavg) || 0)}
                            onView={() => setSelectedMeasurement(m)}
                            onDelete={() => deleteMeasurement(m.id)}
                            isMobile={isMobile}
                        />
                    ))
                )}
            </div>

            {/* Modal de Agregar - Full Screen */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'var(--color-background)',
                    zIndex: 9999,
                    overflow: 'auto'
                }}>
                    <div style={{
                        background: 'var(--color-surface)',
                        borderBottom: '1px solid var(--color-border)',
                        padding: '1rem',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <button
                            onClick={() => setShowAddModal(false)}
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
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Nueva Medición de Ruido</h2>
                    </div>
                    <div style={{ padding: '1rem', maxWidth: '700px', margin: '0 auto' }}>
                        <AddMeasurementForm
                            measurement={newMeasurement}
                            setMeasurement={setNewMeasurement}
                            onSave={() => {
                                handleAddMeasurement();
                                setShowAddModal(false);
                            }}
                            onCancel={() => setShowAddModal(false)}
                            MEASUREMENT_TYPES={MEASUREMENT_TYPES}
                            HEARING_PROTECTION={HEARING_PROTECTION}
                        />
                    </div>
                </div>
            )}

            {/* Modal de Detalle */}
            {selectedMeasurement && (
                <DetailModal
                    measurement={selectedMeasurement}
                    onClose={() => setSelectedMeasurement(null)}
                    isMobile={isMobile}
                />
            )}
        </div>
    );
}

// Componentes
function StatCard({ label, value, color, icon }) {
    return (
        <div className="card" style={{
            padding: '1.25rem',
            background: 'var(--gradient-card)',
            border: '1px solid var(--glass-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div>
            </div>
        </div>
    );
}

function MeasurementCard({ measurement, riskLevel, onView, onDelete, isMobile }) {
    return (
        <div className="card" style={{
            padding: isMobile ? '1rem' : '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderLeft: `4px solid ${riskLevel.color}`
        }}>
            <div style={{
                width: isMobile ? '56px' : '64px',
                height: isMobile ? '56px' : '64px',
                background: `${riskLevel.color}15`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${riskLevel.color}`,
                flexShrink: 0
            }}>
                <Volume2 size={isMobile ? 20 : 24} color={riskLevel.color} />
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
                    {parseFloat(measurement.levels.lavg) || 0}
                </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                        {measurement.workerName}
                    </h3>
                    <span style={{
                        padding: '0.25rem 0.65rem',
                        background: `${riskLevel.color}15`,
                        color: riskLevel.color,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                    }}>
                        {riskLevel.label}
                    </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.5rem' : '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <span>📅 {new Date(measurement.date).toLocaleDateString()}</span>
                    <span>📍 {measurement.location || 'Sin ubicación'}</span>
                    <span>⏱️ {measurement.duration ? `${measurement.duration}h` : '-'}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={onView} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-primary)' }}>
                    <Eye size={isMobile ? 16 : 18} />
                </button>
                <button onClick={onDelete} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={isMobile ? 16 : 18} />
                </button>
            </div>
        </div>
    );
}

function EmptyState({ onAdd, isMobile }) {
    return (
        <div style={{
            padding: isMobile ? '3rem 1rem' : '4rem 2rem',
            textAlign: 'center',
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-2xl)',
            border: '2px dashed var(--color-border)'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 1.5rem',
                background: 'var(--color-background)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Volume2 size={40} color="var(--color-text-muted)" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Sin Mediciones</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                Comenzá a evaluar la exposición al ruido según ISO 9612
            </p>
            <button onClick={onAdd} className="btn-primary" style={{ width: 'auto', margin: 0 }}>
                <Plus size={20} style={{ marginRight: '0.5rem' }} />
                Primera Medición
            </button>
        </div>
    );
}

function AddMeasurementForm({ measurement, setMeasurement, onSave, onCancel, MEASUREMENT_TYPES, HEARING_PROTECTION }) {
    const handleLevelChange = (field, value) => {
        setMeasurement({ ...measurement, levels: { ...measurement.levels, [field]: value } });
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
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
                    <input type="number" step="0.5" value={measurement.duration} onChange={(e) => setMeasurement({ ...measurement, duration: e.target.value })} style={inputStyle} placeholder="4" />
                </div>
                <div>
                    <label style={labelStyle}>Técnico</label>
                    <input type="text" value={measurement.technician} onChange={(e) => setMeasurement({ ...measurement, technician: e.target.value })} style={inputStyle} placeholder="Nombre" />
                </div>
            </div>

            {/* Niveles */}
            <div style={{ marginTop: '1.5rem' }}>
                <label style={labelStyle}>Niveles de Ruido (dB)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    <LevelInput label="Lavg (Promedio)" value={measurement.levels.lavg} onChange={(v) => handleLevelChange('lavg', v)} placeholder="85" />
                    <LevelInput label="Lmax (Máximo)" value={measurement.levels.lmax} onChange={(v) => handleLevelChange('lmax', v)} placeholder="95" />
                    <LevelInput label="Lmin (Mínimo)" value={measurement.levels.lmin} onChange={(v) => handleLevelChange('lmin', v)} placeholder="70" />
                    <LevelInput label="Lpeak (Pico)" value={measurement.levels.lpeak} onChange={(v) => handleLevelChange('lpeak', v)} placeholder="130" />
                    <LevelInput label="Lex 8h" value={measurement.levels.lex8h} onChange={(v) => handleLevelChange('lex8h', v)} placeholder="82" />
                </div>
            </div>

            {/* Protección */}
            <div style={{ marginTop: '1.5rem' }}>
                <label style={labelStyle}>Protección Auditiva</label>
                <select value={measurement.hearingProtection} onChange={(e) => setMeasurement({ ...measurement, hearingProtection: e.target.value })} style={inputStyle}>
                    <option value="">Sin protección</option>
                    {HEARING_PROTECTION.map(hp => (
                        <option key={hp.id} value={hp.id}>{hp.name} (NRR: {hp.nrr})</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingBottom: '2rem' }}>
                <button onClick={onCancel} style={{ flex: 1, padding: '0.85rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={onSave} className="btn-primary" style={{ flex: 1 }}>Guardar Medición</button>
            </div>
        </div>
    );
}

function LevelInput({ label, value, onChange, placeholder }) {
    return (
        <div>
            <label style={{ ...labelStyle, fontSize: '0.75rem' }}>{label}</label>
            <input type="number" step="0.1" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, padding: '0.6rem 0.75rem', fontSize: '0.9rem' }} placeholder={placeholder} />
        </div>
    );
}

function DetailModal({ measurement, onClose, isMobile }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="card" style={{ width: isMobile ? '100%' : '100%', maxWidth: isMobile ? '100%' : '600px', maxHeight: isMobile ? '90vh' : '90vh', overflow: 'auto', margin: isMobile ? 0 : 'auto', borderRadius: isMobile ? '20px 20px 0 0' : 'var(--radius-2xl)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Detalle de Medición</h2>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}><XCircle size={24} /></button>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem' }}>
                    <Volume2 size={40} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{parseFloat(measurement.levels.lavg) || 0} <span style={{ fontSize: '1.5rem' }}>dB(A)</span></div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{measurement.workerName}</div>
                </div>
                <button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>Cerrar</button>
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', transition: 'all var(--transition-fast)', boxSizing: 'border-box' };
