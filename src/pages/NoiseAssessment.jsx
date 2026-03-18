import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Volume2, Plus, Search, Filter, Download, 
    AlertTriangle, CheckCircle2, XCircle, FileText,
    Eye, Edit3, Trash2, TrendingUp, Activity,
    Headphones, Ear, Waveform, Gauge, Clock, Calendar,
    User, Users, BarChart3, Shield, AlertCircle
} from 'lucide-react';
import CompanyLogo from '../components/CompanyLogo';

// Límites según ISO 9612 y directivas internacionales
const NOISE_LIMITS = {
    actionLevel: 80,    // Nivel de acción inferior (dB)
    actionLevelHigh: 85, // Nivel de acción superior (dB)
    limitValue: 87,     // Valor límite (dB)
    peakAction: 135,    // Pico de acción (dB)
    peakLimit: 140      // Pico límite (dB)
};

// Niveles de referencia para ejemplos
const NOISE_REFERENCES = [
    { level: 30, description: 'Susurro', icon: '🤫' },
    { level: 60, description: 'Conversación normal', icon: '💬' },
    { level: 80, description: 'Tráfico intenso', icon: '🚗' },
    { level: 85, description: 'Umbral de riesgo', icon: '⚠️' },
    { level: 90, description: 'Taladro industrial', icon: '🔧' },
    { level: 100, description: 'Sierra circular', icon: '🪚' },
    { level: 110, description: 'Martillo neumático', icon: '🔨' },
    { level: 120, description: 'Sirena de emergencia', icon: '🚨' },
    { level: 130, description: 'Umbral del dolor', icon: '😖' },
    { level: 140, description: 'Daño inmediato', icon: '💥' }
];

// Tipos de medición
const MEASUREMENT_TYPES = [
    { id: 'personal', name: 'Dosimetría Personal', icon: '👤' },
    { id: 'area', name: 'Medición de Área', icon: '📍' },
    { id: 'peak', name: 'Ruido de Impacto', icon: '💥' },
    { id: 'octave', name: 'Análisis Octavas', icon: '🎵' }
];

// EPP Auditivo disponible
const HEARING_PROTECTION = [
    { id: 'earplugs', name: 'Tapones de espuma', nrr: 29 },
    { id: 'earmuffs', name: 'Orejeras', nrr: 25 },
    { id: 'dual', name: 'Protección dual', nrr: 35 }
];

export default function NoiseAssessment() {
    const navigate = useNavigate();
    const [measurements, setMeasurements] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState(null);
    const [activeTab, setActiveTab] = useState('measurements'); // measurements, workers, statistics

    const [newMeasurement, setNewMeasurement] = useState({
        id: '',
        workerId: '',
        workerName: '',
        type: 'personal',
        date: new Date().toISOString().split('T')[0],
        time: '',
        location: '',
        task: '',
        duration: '',
        levels: {
            lavg: '', // Nivel promedio (dB)
            lmax: '', // Nivel máximo (dB)
            lmin: '', // Nivel mínimo (dB)
            lpeak: '', // Nivel pico (dB)
            lex8h: ''  // Nivel equivalente 8h (dB)
        },
        hearingProtection: '',
        observations: '',
        equipment: '',
        calibrated: true,
        technician: ''
    });

    useEffect(() => {
        const loadData = () => {
            const savedMeasurements = localStorage.getItem('noise_assessment_db');
            const savedWorkers = localStorage.getItem('noise_workers_db');
            if (savedMeasurements) setMeasurements(JSON.parse(savedMeasurements));
            if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
        };

        loadData();

        const handleStorageChange = (e) => {
            if (e.key === 'noise_assessment_db' || e.key === 'noise_workers_db') {
                loadData();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        const params = new URLSearchParams(window.location.search);
        if (params.get('created')) {
            loadData();
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const saveMeasurements = (data) => {
        localStorage.setItem('noise_assessment_db', JSON.stringify(data));
        setMeasurements(data);
    };

    const saveWorkers = (data) => {
        localStorage.setItem('noise_workers_db', JSON.stringify(data));
        setWorkers(data);
    };

    const handleAddMeasurement = () => {
        if (!newMeasurement.workerName || !newMeasurement.levels.lavg) return;
        
        const measurement = {
            ...newMeasurement,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: calculateRiskLevel(parseFloat(newMeasurement.levels.lavg) || 0)
        };

        const updated = [measurement, ...measurements];
        saveMeasurements(updated);
        setShowAddModal(false);
        resetForm();
    };

    const resetForm = () => {
        setNewMeasurement({
            id: '',
            workerId: '',
            workerName: '',
            type: 'personal',
            date: new Date().toISOString().split('T')[0],
            time: '',
            location: '',
            task: '',
            duration: '',
            levels: {
                lavg: '',
                lmax: '',
                lmin: '',
                lpeak: '',
                lex8h: ''
            },
            hearingProtection: '',
            observations: '',
            equipment: '',
            calibrated: true,
            technician: ''
        });
    };

    const calculateRiskLevel = (level) => {
        if (level >= NOISE_LIMITS.limitValue) return { level: 'critical', color: '#dc2626', label: 'CRÍTICO' };
        if (level >= NOISE_LIMITS.actionLevelHigh) return { level: 'high', color: '#f59e0b', label: 'ALTO' };
        if (level >= NOISE_LIMITS.actionLevel) return { level: 'medium', color: '#eab308', label: 'MEDIO' };
        return { level: 'low', color: '#16a34a', label: 'BAJO' };
    };

    const calculateDose = (level, duration) => {
        // Fórmula de dosis de ruido según OSHA/ISO
        const referenceDuration = 8 * Math.pow(2, (85 - level) / 3);
        const dose = (duration / referenceDuration) * 100;
        return Math.min(dose, 100).toFixed(1);
    };

    const calculateAttenuatedLevel = (level, protectionId) => {
        const protection = HEARING_PROTECTION.find(p => p.id === protectionId);
        if (!protection) return level;
        // Método NRR (Noise Reduction Rating) simplificado
        const attenuation = (protection.nrr - 7) / 2;
        return Math.max(level - attenuation, 0).toFixed(1);
    };

    const filteredMeasurements = measurements.filter(m => {
        const matchesSearch = m.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.task?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || m.type === filterType;
        return matchesSearch && matchesType;
    });

    // Estadísticas
    const stats = {
        total: measurements.length,
        critical: measurements.filter(m => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'critical').length,
        high: measurements.filter(m => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'high').length,
        avgLevel: measurements.length > 0 
            ? (measurements.reduce((sum, m) => sum + (parseFloat(m.levels.lavg) || 0), 0) / measurements.length).toFixed(1)
            : 0,
        workersExposed: new Set(measurements.map(m => m.workerId)).size
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            {/* Header Premium */}
            <div style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'var(--gradient-card)',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                    }}>
                        <Volume2 size={32} color="#ffffff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '1.5rem', 
                            fontWeight: 900,
                            color: 'var(--color-text)',
                            letterSpacing: '-0.5px'
                        }}>
                            Evaluación de Ruido
                        </h1>
                        <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            ISO 9612 • {measurements.length} mediciones
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                        style={{
                            width: 'auto',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem'
                        }}
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        Nueva Medición
                    </button>
                    <button
                        onClick={() => navigate('/noise-history')}
                        className="btn-outline"
                        style={{
                            padding: '0.75rem 1rem'
                        }}
                    >
                        <FileText size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <StatCard 
                    icon={<Activity size={24} />}
                    label="Total Mediciones"
                    value={stats.total}
                    color="#3B82F6"
                    gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
                />
                <StatCard 
                    icon={<AlertTriangle size={24} />}
                    label="Nivel Crítico"
                    value={stats.critical}
                    color="#dc2626"
                    gradient="linear-gradient(135deg, #dc2626, #991b1b)"
                />
                <StatCard 
                    icon={<Gauge size={24} />}
                    label="Promedio dB(A)"
                    value={stats.avgLevel}
                    color="#8b5cf6"
                    gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                />
                <StatCard 
                    icon={<Users size={24} />}
                    label="Trabajadores"
                    value={stats.workersExposed}
                    color="#10b981"
                    gradient="linear-gradient(135deg, #10b981, #059669)"
                />
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                borderBottom: '2px solid var(--color-border)',
                paddingBottom: '0.5rem'
            }}>
                <TabButton 
                    active={activeTab === 'measurements'}
                    onClick={() => setActiveTab('measurements')}
                    icon={<Volume2 size={18} />}
                    label="Mediciones"
                />
                <TabButton 
                    active={activeTab === 'workers'}
                    onClick={() => setActiveTab('workers')}
                    icon={<Users size={18} />}
                    label="Trabajadores"
                />
                <TabButton 
                    active={activeTab === 'statistics'}
                    onClick={() => setActiveTab('statistics')}
                    icon={<BarChart3 size={18} />}
                    label="Estadísticas"
                />
            </div>

            {/* Content by Tab */}
            {activeTab === 'measurements' && (
                <>
                    {/* Search & Filters */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                            <Search 
                                size={20} 
                                color="var(--color-text-muted)"
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none'
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Buscar por trabajador, ubicación, tarea..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem 1rem 0.85rem 3rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-input-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text)',
                                    fontSize: '0.95rem',
                                    fontWeight: 500,
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{
                                padding: '0.85rem 1.25rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-input-border)',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">Todos los Tipos</option>
                            {MEASUREMENT_TYPES.map(type => (
                                <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Measurements List */}
                    {filteredMeasurements.length === 0 ? (
                        <EmptyState onAdd={() => setShowAddModal(true)} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredMeasurements.map(measurement => (
                                <MeasurementCard 
                                    key={measurement.id}
                                    measurement={measurement}
                                    riskLevel={calculateRiskLevel(parseFloat(measurement.levels.lavg) || 0)}
                                    onView={() => setSelectedMeasurement(measurement)}
                                    onDelete={() => {
                                        if (confirm('¿Eliminar esta medición?')) {
                                            saveMeasurements(measurements.filter(m => m.id !== measurement.id));
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'workers' && (
                <WorkersList 
                    workers={workers}
                    measurements={measurements}
                    calculateRiskLevel={calculateRiskLevel}
                />
            )}

            {activeTab === 'statistics' && (
                <StatisticsPanel 
                    measurements={measurements}
                    calculateRiskLevel={calculateRiskLevel}
                    NOISE_LIMITS={NOISE_LIMITS}
                />
            )}

            {/* Modal de Agregar Medición */}
            {showAddModal && (
                <AddMeasurementModal 
                    measurement={newMeasurement}
                    setMeasurement={setNewMeasurement}
                    workers={workers}
                    onSave={handleAddMeasurement}
                    onClose={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}
                    MEASUREMENT_TYPES={MEASUREMENT_TYPES}
                    HEARING_PROTECTION={HEARING_PROTECTION}
                    NOISE_REFERENCES={NOISE_REFERENCES}
                />
            )}

            {/* Modal de Detalle */}
            {selectedMeasurement && (
                <MeasurementDetailModal 
                    measurement={selectedMeasurement}
                    riskLevel={calculateRiskLevel(parseFloat(selectedMeasurement.levels.lavg) || 0)}
                    onClose={() => setSelectedMeasurement(null)}
                    calculateAttenuatedLevel={calculateAttenuatedLevel}
                    HEARING_PROTECTION={HEARING_PROTECTION}
                    NOISE_LIMITS={NOISE_LIMITS}
                />
            )}
        </div>
    );
}

// Componentes Auxiliares
function StatCard({ icon, label, value, color, gradient }) {
    return (
        <div className="card" style={{
            padding: '1.25rem',
            background: 'var(--gradient-card)',
            border: '1px solid var(--glass-border-subtle)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                background: gradient,
                borderRadius: '50%',
                opacity: 0.1
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    background: gradient,
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 15px ${color}40`
                }}>
                    {React.cloneElement(icon, { color: '#ffffff', size: 24 })}
                </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
                {value}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {label}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? '#fff' : 'var(--color-text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all var(--transition-fast)'
            }}
        >
            {icon}
            {label}
        </button>
    );
}

function MeasurementCard({ measurement, riskLevel, onView, onDelete }) {
    return (
        <div className="card" style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all var(--transition-fast)'
        }}>
            {/* Nivel de ruido visual */}
            <div style={{
                width: '64px',
                height: '64px',
                background: `linear-gradient(135deg, ${riskLevel.color}, ${riskLevel.color}cc)`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
                boxShadow: `0 4px 20px ${riskLevel.color}40`
            }}>
                <Volume2 size={24} strokeWidth={2.5} />
                <span style={{ fontSize: '1rem', fontWeight: 900, lineHeight: 1 }}>
                    {parseFloat(measurement.levels.lavg) || 0}
                </span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.9 }}>dB(A)</span>
            </div>

            {/* Información */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.1rem', 
                        fontWeight: 800,
                        color: 'var(--color-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {measurement.workerName}
                    </h3>
                    <span style={{
                        padding: '0.35rem 0.75rem',
                        background: `${riskLevel.color}15`,
                        color: riskLevel.color,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        flexShrink: 0
                    }}>
                        {riskLevel.label}
                    </span>
                </div>
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '1rem',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} />
                        {new Date(measurement.date).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} />
                        {measurement.duration || '-'}h
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Headphones size={14} />
                        {measurement.hearingProtection ? 'Con EPP' : 'Sin EPP'}
                    </span>
                </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={onView}
                    style={{
                        padding: '0.6rem 0.75rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--color-primary)',
                        transition: 'all var(--transition-fast)'
                    }}
                    title="Ver detalle"
                >
                    <Eye size={18} />
                </button>
                <button
                    onClick={onDelete}
                    style={{
                        padding: '0.6rem 0.75rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: '#ef4444',
                        transition: 'all var(--transition-fast)'
                    }}
                    title="Eliminar"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

function EmptyState({ onAdd }) {
    return (
        <div style={{
            padding: '4rem 2rem',
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
            <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.25rem', 
                fontWeight: 800,
                color: 'var(--color-text)'
            }}>
                Sin Mediciones de Ruido
            </h3>
            <p style={{ 
                margin: '0 0 1.5rem 0', 
                color: 'var(--color-text-muted)',
                fontSize: '0.95rem'
            }}>
                Comenzá a evaluar la exposición al ruido según ISO 9612
            </p>
            <button
                onClick={onAdd}
                className="btn-primary"
                style={{ width: 'auto', margin: 0 }}
            >
                <Plus size={20} style={{ marginRight: '0.5rem' }} />
                Primera Medición
            </button>
        </div>
    );
}

function WorkersList({ workers, measurements, calculateRiskLevel }) {
    const workerStats = workers.map(worker => {
        const workerMeasurements = measurements.filter(m => m.workerId === worker.id);
        const avgLevel = workerMeasurements.length > 0
            ? (workerMeasurements.reduce((sum, m) => sum + (parseFloat(m.levels.lavg) || 0), 0) / workerMeasurements.length).toFixed(1)
            : 0;
        const lastMeasurement = workerMeasurements[0]?.date || '-';
        
        return {
            ...worker,
            measurementCount: workerMeasurements.length,
            avgLevel,
            lastMeasurement,
            riskLevel: calculateRiskLevel(parseFloat(avgLevel) || 0)
        };
    });

    if (workers.length === 0) {
        return (
            <div style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                background: 'var(--gradient-card)',
                borderRadius: 'var(--radius-2xl)',
                border: '2px dashed var(--color-border)'
            }}>
                <Users size={48} color="var(--color-text-muted)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                    No hay trabajadores registrados. Agregá mediciones para ver el listado.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {workerStats.map(worker => (
                <div key={worker.id} className="card" style={{
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: `linear-gradient(135deg, ${worker.riskLevel.color}, ${worker.riskLevel.color}cc)`,
                        borderRadius: 'var(--radius-xl)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        flexShrink: 0
                    }}>
                        {worker.workerName?.charAt(0) || 'W'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                            {worker.workerName || 'Sin nombre'}
                        </h3>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {worker.measurementCount} mediciones • Promedio: {worker.avgLevel} dB(A) • Última: {new Date(worker.lastMeasurement).toLocaleDateString()}
                        </p>
                    </div>
                    <span style={{
                        padding: '0.35rem 0.75rem',
                        background: `${worker.riskLevel.color}15`,
                        color: worker.riskLevel.color,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                    }}>
                        {worker.riskLevel.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StatisticsPanel({ measurements, calculateRiskLevel, NOISE_LIMITS }) {
    // Distribución por niveles
    const distribution = {
        low: measurements.filter(m => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'low').length,
        medium: measurements.filter(m => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'medium').length,
        high: measurements.filter(m => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'high').length,
        critical: measurements.filter(m => calculateRiskLevel(parseFloat(m.levels.lavg) || 0).level === 'critical').length
    };

    const maxCount = Math.max(...Object.values(distribution), 1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Gráfico de distribución */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    Distribución por Nivel de Riesgo
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '200px' }}>
                    {Object.entries(distribution).map(([level, count]) => {
                        const config = {
                            low: { color: '#16a34a', label: 'Bajo' },
                            medium: { color: '#eab308', label: 'Medio' },
                            high: { color: '#f59e0b', label: 'Alto' },
                            critical: { color: '#dc2626', label: 'Crítico' }
                        };
                        const height = (count / maxCount) * 100;
                        
                        return (
                            <div key={level} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: '100%',
                                    height: `${height}%`,
                                    background: config[level].color,
                                    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                                    transition: 'height var(--transition-base)',
                                    minHeight: count > 0 ? '20px' : '0'
                                }} />
                                <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: config[level].color }}>
                                        {count}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                        {config[level].label}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Límites de referencia */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    Límites de Referencia (ISO 9612)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <LimitItem 
                        label="Nivel de Acción Inferior"
                        value={`${NOISE_LIMITS.actionLevel} dB(A)`}
                        description="Inicio de programa de conservación auditiva"
                        color="#eab308"
                    />
                    <LimitItem 
                        label="Nivel de Acción Superior"
                        value={`${NOISE_LIMITS.actionLevelHigh} dB(A)`}
                        description="EPP obligatorio"
                        color="#f59e0b"
                    />
                    <LimitItem 
                        label="Valor Límite"
                        value={`${NOISE_LIMITS.limitValue} dB(A)`}
                        description="Exposición máxima permitida"
                        color="#dc2626"
                    />
                    <LimitItem 
                        label="Pico Límite"
                        value={`${NOISE_LIMITS.peakLimit} dB`}
                        description="Nivel de pico máximo"
                        color="#991b1b"
                    />
                </div>
            </div>

            {/* Escala de referencia */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    Escala de Niveles de Ruido
                </h3>
                <div style={{ 
                    height: '40px', 
                    background: 'linear-gradient(to right, #16a34a, #eab308, #f59e0b, #dc2626)',
                    borderRadius: 'var(--radius-lg)',
                    position: 'relative',
                    marginBottom: '1rem'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: `${(NOISE_LIMITS.actionLevel / 140) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        background: '#fff',
                        opacity: 0.8
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: `${(NOISE_LIMITS.actionLevelHigh / 140) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        background: '#fff',
                        opacity: 0.8
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: `${(NOISE_LIMITS.limitValue / 140) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        background: '#fff',
                        opacity: 0.8
                    }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    <span>0 dB</span>
                    <span>{NOISE_LIMITS.actionLevel} dB</span>
                    <span>{NOISE_LIMITS.actionLevelHigh} dB</span>
                    <span>{NOISE_LIMITS.limitValue} dB</span>
                    <span>140 dB</span>
                </div>
            </div>
        </div>
    );
}

function LimitItem({ label, value, description, color }) {
    return (
        <div style={{
            padding: '1rem',
            background: `${color}15`,
            border: `1px solid ${color}`,
            borderRadius: 'var(--radius-lg)'
        }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                {value}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                {description}
            </div>
        </div>
    );
}

// Modal de Agregar Medición
function AddMeasurementModal({ measurement, setMeasurement, workers, onSave, onClose, MEASUREMENT_TYPES, HEARING_PROTECTION, NOISE_REFERENCES }) {
    const handleLevelChange = (field, value) => {
        setMeasurement({
            ...measurement,
            levels: { ...measurement.levels, [field]: value }
        });
    };

    return (
        <div style={{
            className: 'modal-fullscreen-overlay'
        }} onClick={onClose}>
            <div 
                className="card"
                style={{
                    width: '100%',
                    maxWidth: '900px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    margin: 'auto'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                        Nueva Medición de Ruido
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem',
                            background: 'var(--color-background)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: 'var(--color-text)'
                        }}
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Tipo de medición */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Tipo de Medición</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                            {MEASUREMENT_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setMeasurement({ ...measurement, type: type.id })}
                                    style={{
                                        padding: '0.75rem',
                                        background: measurement.type === type.id 
                                            ? 'var(--color-primary)' 
                                            : 'var(--color-background)',
                                        color: measurement.type === type.id ? '#fff' : 'var(--color-text)',
                                        border: `2px solid ${measurement.type === type.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontWeight: 600,
                                        transition: 'all var(--transition-fast)'
                                    }}
                                >
                                    <span>{type.icon}</span>
                                    <span style={{ fontSize: '0.85rem' }}>{type.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trabajador */}
                    <div>
                        <label style={labelStyle}>Trabajador</label>
                        <input
                            type="text"
                            value={measurement.workerName}
                            onChange={(e) => setMeasurement({ ...measurement, workerName: e.target.value })}
                            style={inputStyle}
                            placeholder="Nombre del trabajador"
                        />
                    </div>

                    {/* Fecha */}
                    <div>
                        <label style={labelStyle}>Fecha</label>
                        <input
                            type="date"
                            value={measurement.date}
                            onChange={(e) => setMeasurement({ ...measurement, date: e.target.value })}
                            style={inputStyle}
                        />
                    </div>

                    {/* Ubicación */}
                    <div>
                        <label style={labelStyle}>Ubicación / Área</label>
                        <input
                            type="text"
                            value={measurement.location}
                            onChange={(e) => setMeasurement({ ...measurement, location: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: Planta de Producción"
                        />
                    </div>

                    {/* Tarea */}
                    <div>
                        <label style={labelStyle}>Tarea Evaluada</label>
                        <input
                            type="text"
                            value={measurement.task}
                            onChange={(e) => setMeasurement({ ...measurement, task: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: Operación de sierra"
                        />
                    </div>

                    {/* Duración */}
                    <div>
                        <label style={labelStyle}>Duración de Exposición (horas)</label>
                        <input
                            type="number"
                            step="0.5"
                            value={measurement.duration}
                            onChange={(e) => setMeasurement({ ...measurement, duration: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: 4"
                        />
                    </div>

                    {/* Técnico */}
                    <div>
                        <label style={labelStyle}>Técnico Evaluador</label>
                        <input
                            type="text"
                            value={measurement.technician}
                            onChange={(e) => setMeasurement({ ...measurement, technician: e.target.value })}
                            style={inputStyle}
                            placeholder="Nombre del técnico"
                        />
                    </div>

                    {/* Niveles de ruido */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Niveles de Ruido (dB)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            <LevelInput 
                                label="Lavg (Promedio)"
                                value={measurement.levels.lavg}
                                onChange={(v) => handleLevelChange('lavg', v)}
                                placeholder="Ej: 85"
                            />
                            <LevelInput 
                                label="Lmax (Máximo)"
                                value={measurement.levels.lmax}
                                onChange={(v) => handleLevelChange('lmax', v)}
                                placeholder="Ej: 95"
                            />
                            <LevelInput 
                                label="Lmin (Mínimo)"
                                value={measurement.levels.lmin}
                                onChange={(v) => handleLevelChange('lmin', v)}
                                placeholder="Ej: 70"
                            />
                            <LevelInput 
                                label="Lpeak (Pico)"
                                value={measurement.levels.lpeak}
                                onChange={(v) => handleLevelChange('lpeak', v)}
                                placeholder="Ej: 130"
                            />
                            <LevelInput 
                                label="Lex 8h"
                                value={measurement.levels.lex8h}
                                onChange={(v) => handleLevelChange('lex8h', v)}
                                placeholder="Ej: 82"
                            />
                            <LevelInput 
                                label="Equipo"
                                value={measurement.equipment}
                                onChange={(e) => setMeasurement({ ...measurement, equipment: e.target.value })}
                                placeholder="Sonómetro"
                            />
                        </div>
                    </div>

                    {/* Protección auditiva */}
                    <div>
                        <label style={labelStyle}>Protección Auditiva</label>
                        <select
                            value={measurement.hearingProtection}
                            onChange={(e) => setMeasurement({ ...measurement, hearingProtection: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">Sin protección</option>
                            {HEARING_PROTECTION.map(hp => (
                                <option key={hp.id} value={hp.id}>
                                    {hp.name} (NRR: {hp.nrr})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Calibrado */}
                    <div>
                        <label style={labelStyle}>Equipo Calibrado</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={measurement.calibrated}
                                onChange={(e) => setMeasurement({ ...measurement, calibrated: e.target.checked })}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <span style={{ fontWeight: 600 }}>Certificado de calibración vigente</span>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Observaciones</label>
                        <textarea
                            value={measurement.observations}
                            onChange={(e) => setMeasurement({ ...measurement, observations: e.target.value })}
                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                            placeholder="Condiciones ambientales, observaciones relevantes..."
                        />
                    </div>
                </div>

                {/* Referencia de niveles */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'var(--color-background)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 800 }}>
                        Referencia de Niveles
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                        {NOISE_REFERENCES.slice(0, 6).map(ref => (
                            <div key={ref.level} style={{
                                fontSize: '0.75rem',
                                padding: '0.5rem',
                                background: `${getColorForLevel(ref.level)}15`,
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>{ref.icon}</span>
                                <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>{ref.level} dB</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{ref.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '2rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--color-border)'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.85rem',
                            background: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="btn-primary"
                        style={{ flex: 1 }}
                    >
                        Guardar Medición
                    </button>
                </div>
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
                style={{
                    ...inputStyle,
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.9rem'
                }}
                placeholder={placeholder}
            />
        </div>
    );
}

// Modal de Detalle
function MeasurementDetailModal({ measurement, riskLevel, onClose, calculateAttenuatedLevel, HEARING_PROTECTION, NOISE_LIMITS }) {
    const protection = HEARING_PROTECTION.find(p => p.id === measurement.hearingProtection);
    const attenuatedLevel = protection 
        ? calculateAttenuatedLevel(parseFloat(measurement.levels.lavg) || 0, measurement.hearingProtection)
        : null;

    return (
        <div style={{
            className: 'modal-fullscreen-overlay'
        }} onClick={onClose}>
            <div 
                className="card"
                style={{
                    width: '100%',
                    maxWidth: '700px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    margin: 'auto'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    background: `linear-gradient(135deg, ${riskLevel.color}20, ${riskLevel.color}05)`,
                    borderBottom: `2px solid ${riskLevel.color}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: `linear-gradient(135deg, ${riskLevel.color}, ${riskLevel.color}cc)`,
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                        }}>
                            <Volume2 size={28} strokeWidth={2.5} />
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>
                                {parseFloat(measurement.levels.lavg) || 0}
                            </span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>dB(A)</span>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                                {measurement.workerName}
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                {measurement.location || 'Sin ubicación'} • {riskLevel.label}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem',
                            background: 'var(--color-background)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: 'var(--color-text)'
                        }}
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Niveles */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <LevelDetail label="Lavg (Promedio)" value={`${measurement.levels.lavg || '-'} dB(A)`} />
                    <LevelDetail label="Lmax (Máximo)" value={`${measurement.levels.lmax || '-'} dB(A)`} />
                    <LevelDetail label="Lmin (Mínimo)" value={`${measurement.levels.lmin || '-'} dB(A)`} />
                    <LevelDetail label="Lpeak (Pico)" value={`${measurement.levels.lpeak || '-'} dB`} />
                    <LevelDetail label="Lex 8h" value={`${measurement.levels.lex8h || '-'} dB(A)`} />
                    <LevelDetail label="Duración" value={`${measurement.duration || '-'} horas`} />
                </div>

                {/* Protección auditiva */}
                {protection && (
                    <div style={{
                        padding: '1.25rem',
                        background: '#f0fdf4',
                        border: '1px solid #16a34a',
                        borderRadius: 'var(--radius-xl)',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 800, 
                            marginBottom: '0.75rem',
                            color: '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Headphones size={18} />
                            PROTECCIÓN AUDITIVA
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    Tipo de EPP
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                    {protection.name}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    NRR (Reducción)
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a' }}>
                                    {protection.nrr} dB
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    Nivel sin protección
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                    {measurement.levels.lavg} dB(A)
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    Nivel con protección
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a' }}>
                                    {attenuatedLevel} dB(A)
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Información adicional */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <InfoDetail label="Fecha" value={new Date(measurement.date).toLocaleDateString()} />
                    <InfoDetail label="Tarea" value={measurement.task || '-'} />
                    <InfoDetail label="Equipo" value={measurement.equipment || '-'} />
                    <InfoDetail label="Técnico" value={measurement.technician || '-'} />
                    <InfoDetail label="Calibrado" value={measurement.calibrated ? '✓ Sí' : '✗ No'} />
                </div>

                {/* Observaciones */}
                {measurement.observations && (
                    <div style={{
                        padding: '1rem',
                        background: 'var(--color-background)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '1.5rem'
                    }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700 }}>
                            Observaciones
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                            {measurement.observations}
                        </p>
                    </div>
                )}

                {/* Límites de referencia */}
                <div style={{
                    padding: '1rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.5rem'
                }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#dc2626' }}>
                        <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Límites de Referencia
                    </h4>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Acción: <strong>{NOISE_LIMITS.actionLevel} dB</strong></span>
                        <span style={{ color: 'var(--color-text-muted)' }}>Obligatorio: <strong>{NOISE_LIMITS.actionLevelHigh} dB</strong></span>
                        <span style={{ color: 'var(--color-text-muted)' }}>Límite: <strong>{NOISE_LIMITS.limitValue} dB</strong></span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="btn-primary"
                    style={{ width: '100%' }}
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}

function LevelDetail({ label, value }) {
    return (
        <div style={{
            padding: '0.75rem',
            background: 'var(--color-background)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                {label}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {value}
            </div>
        </div>
    );
}

function InfoDetail({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                {label}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {value}
            </div>
        </div>
    );
}

function getColorForLevel(level) {
    if (level >= 120) return '#dc2626';
    if (level >= 100) return '#f59e0b';
    if (level >= 85) return '#eab308';
    return '#16a34a';
}

const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginBottom: '0.5rem'
};

const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-input-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    fontWeight: 500,
    outline: 'none',
    transition: 'all var(--transition-fast)',
    boxSizing: 'border-box'
};
