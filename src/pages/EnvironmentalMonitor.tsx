import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Leaf, Plus, Search, 
    FileText, Eye, Edit3, Trash2, CheckCircle2, 
    XCircle, Clock, User, Calendar,
    Droplets, Wind, Thermometer, Activity,
    AlertTriangle, BarChart3, TrendingUp, Target,
    AlertCircle, Recycle, Factory, Cloud, Printer, Share2
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import EnvironmentalPdf from '../components/EnvironmentalPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';

// Tipos de monitoreo ambiental
const MONITORING_TYPES = [
    { id: 'air', name: 'Calidad de Aire', icon: '💨', color: '#3b82f6' },
    { id: 'water', name: 'Calidad de Agua', icon: '💧', color: '#06b6d4' },
    { id: 'noise', name: 'Ruido Ambiental', icon: '🔊', color: '#f59e0b' },
    { id: 'waste', name: 'Gestión de Residuos', icon: '♻️', color: '#10b981' },
    { id: 'emissions', name: 'Emisiones', icon: '🏭', color: '#6b7280' },
    { id: 'soil', name: 'Calidad de Suelo', icon: '🌱', color: '#84cc16' },
    { id: 'radiation', name: 'Radiación', icon: '☢️', color: '#f97316' },
    { id: 'vibration', name: 'Vibraciones', icon: '📳', color: '#8b5cf6' }
];

// Parámetros medibles por tipo
const PARAMETERS = {
    air: [
        { id: 'pm25', name: 'PM2.5', unit: 'μg/m³', limit: 25 },
        { id: 'pm10', name: 'PM10', unit: 'μg/m³', limit: 50 },
        { id: 'co', name: 'CO', unit: 'ppm', limit: 9 },
        { id: 'no2', name: 'NO₂', unit: 'ppb', limit: 100 },
        { id: 'so2', name: 'SO₂', unit: 'ppb', limit: 75 },
        { id: 'o3', name: 'Ozono', unit: 'ppb', limit: 70 }
    ],
    water: [
        { id: 'ph', name: 'pH', unit: 'pH', limit: '6.5-8.5' },
        { id: 'turbidity', name: 'Turbidez', unit: 'NTU', limit: 5 },
        { id: 'bod', name: 'DBO₅', unit: 'mg/L', limit: 50 },
        { id: 'cod', name: 'DQO', unit: 'mg/L', limit: 150 },
        { id: 'tss', name: 'SST', unit: 'mg/L', limit: 30 },
        { id: 'oil', name: 'Aceites y Grasas', unit: 'mg/L', limit: 10 }
    ],
    noise: [
        { id: 'leq', name: 'Leq', unit: 'dB(A)', limit: 65 },
        { id: 'lmax', name: 'Lmax', unit: 'dB(A)', limit: 80 },
        { id: 'lmin', name: 'Lmin', unit: 'dB(A)', limit: null }
    ],
    emissions: [
        { id: 'co2', name: 'CO₂', unit: 'ton/año', limit: null },
        { id: 'nox', name: 'NOx', unit: 'mg/Nm³', limit: 200 },
        { id: 'sox', name: 'SOx', unit: 'mg/Nm³', limit: 150 },
        { id: 'particulates', name: 'Particulados', unit: 'mg/Nm³', limit: 50 }
    ]
};

// Estados de medición
const MEASUREMENT_STATUS = {
    normal: { label: 'NORMAL', color: '#16a34a', bg: '#f0fdf4' },
    warning: { label: 'PRECAUCIÓN', color: '#f59e0b', bg: '#fffbeb' },
    critical: { label: 'CRÍTICO', color: '#dc2626', bg: '#fef2f2' },
    exceeded: { label: 'EXCEDIDO', color: '#991b1b', bg: '#7f1d1d' }
};

// Normativa ambiental
const ENVIRONMENTAL_REGULATIONS = [
    { id: 'iso14001', name: 'ISO 14001:2015', icon: '📋' },
    { id: 'epa', name: 'EPA Standards', icon: '🇺🇸' },
    { id: 'who', name: 'OMS/WHO', icon: '🌍' },
    { id: 'local', name: 'Normativa Local', icon: '📍' }
];

export default function EnvironmentalMonitor(): React.ReactElement | null {
    const navigate = useNavigate();
    const [measurements, setMeasurements] = useState<any[]>([]);
    const [stations, setStations] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState(null);
    const [activeTab, setActiveTab] = useState('measurements');
    const [shareItem, setShareItem] = useState(null);

    const [newMeasurement, setNewMeasurement] = useState({
        id: '',
        stationId: '',
        stationName: '',
        monitoringType: '',
        location: '',
        latitude: '',
        longitude: '',
        measurementDate: new Date().toISOString().split('T')[0],
        measurementTime: '',
        parameters: [],
        status: 'normal',
        weather: {
            temperature: '',
            humidity: '',
            windSpeed: '',
            windDirection: '',
            pressure: ''
        },
        technician: '',
        equipment: '',
        observations: '',
        regulation: ''
    });

    useEffect(() => {
        const loadData = () => {
            const saved = localStorage.getItem('environmental_measurements_db');
            if (saved) setMeasurements(JSON.parse(saved));
        };
        
        loadData();
        
        const handleStorageChange = (e) => {
            if (e.key === 'environmental_measurements_db') {
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
        localStorage.setItem('environmental_measurements_db', JSON.stringify(data));
        setMeasurements(data);
    };

    const saveStations = (data) => {
        localStorage.setItem('environmental_stations_db', JSON.stringify(data));
        setStations(data);
    };

    const handleAddMeasurement = () => {
        if (!newMeasurement.stationName || !newMeasurement.monitoringType) return;
        
        const measurement = {
            ...newMeasurement,
            id: `ENV-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: evaluateStatus(newMeasurement)
        };

        const updated = [measurement, ...measurements];
        saveMeasurements(updated);
        
        // Update stations
        const stationExists = stations.find(s => s.id === newMeasurement.stationId);
        if (!stationExists && newMeasurement.stationId) {
            const updatedStations = [...stations, {
                id: newMeasurement.stationId,
                name: newMeasurement.stationName,
                type: newMeasurement.monitoringType,
                location: newMeasurement.location,
                lastMeasurement: new Date().toISOString()
            }];
            saveStations(updatedStations);
        }

        setShowAddModal(false);
        resetForm();
    };

    const evaluateStatus = (measurement) => {
        const typeParams = PARAMETERS[measurement.monitoringType] || [];
        let hasCritical = false;
        let hasWarning = false;

        measurement.parameters?.forEach(param => {
            const paramDef = typeParams.find(p => p.id === param.parameterId);
            if (paramDef && paramDef.limit) {
                const value = parseFloat(param.value);
                const limit = typeof paramDef.limit === 'string' 
                    ? parseFloat(paramDef.limit.split('-')[1]) 
                    : paramDef.limit;
                
                if (limit && value > limit * 1.5) hasCritical = true;
                else if (limit && value > limit) hasWarning = true;
            }
        });

        if (hasCritical) return 'critical';
        if (hasWarning) return 'warning';
        return 'normal';
    };

    const resetForm = () => {
        setNewMeasurement({
            id: '',
            stationId: '',
            stationName: '',
            monitoringType: '',
            location: '',
            latitude: '',
            longitude: '',
            measurementDate: new Date().toISOString().split('T')[0],
            measurementTime: '',
            parameters: [],
            status: 'normal',
            weather: {
                temperature: '',
                humidity: '',
                windSpeed: '',
                windDirection: '',
                pressure: ''
            },
            technician: '',
            equipment: '',
            observations: '',
            regulation: ''
        });
    };

    const deleteMeasurement = (id) => {
        if (confirm('¿Eliminar esta medición ambiental?')) {
            saveMeasurements(measurements.filter(m => m.id !== id));
        }
    };

    const filteredMeasurements = measurements.filter(m => {
        const matchesSearch = m.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.location?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || m.monitoringType === filterType;
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    // Estadísticas
    const stats = {
        total: measurements.length,
        normal: measurements.filter(m => m.status === 'normal').length,
        warning: measurements.filter(m => m.status === 'warning').length,
        critical: measurements.filter(m => m.status === 'critical').length,
        stations: stations.length,
        complianceRate: measurements.length > 0 
            ? Math.round((measurements.filter(m => m.status === 'normal').length / measurements.length) * 100)
            : 0
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Monitoreo Ambiental - ${shareItem?.stationName || ''}`}
                text={shareItem ? `🌿 Monitoreo Ambiental (Ley 19.587)\n📍 Estación: ${shareItem.stationName}\n📅 Fecha: ${new Date(shareItem.createdAt || Date.now()).toLocaleDateString()}\n👷 Responsable: ${shareItem.technician || '-'}` : ''}
                rawMessage={shareItem ? `🌿 Monitoreo Ambiental (Ley 19.587)\n📍 Estación: ${shareItem.stationName}\n📅 Fecha: ${new Date(shareItem.createdAt || Date.now()).toLocaleDateString()}\n👷 Responsable: ${shareItem.technician || '-'}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Monitoreo_${shareItem?.stationName || 'Sin_Nombre'}.pdf`}
            />

            <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
                {shareItem && <EnvironmentalPdf data={shareItem} />}
            </div>
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
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                    }}>
                        <Leaf size={32} color="#ffffff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '1.5rem', 
                            fontWeight: 900,
                            color: 'var(--color-text)',
                            letterSpacing: '-0.5px'
                        }}>
                            Monitoreo Ambiental
                        </h1>
                        <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            ISO 14001 • {stats.stations} estaciones
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/environmental/new')}
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
                        onClick={() => navigate('/environmental/history')}
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
                    icon={<CheckCircle2 size={24} />}
                    label="Normales"
                    value={stats.normal}
                    color="#16a34a"
                    gradient="linear-gradient(135deg, #16a34a, #059669)"
                />
                <StatCard 
                    icon={<AlertTriangle size={24} />}
                    label="Precaución"
                    value={stats.warning}
                    color="#f59e0b"
                    gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                />
                <StatCard 
                    icon={<XCircle size={24} />}
                    label="Críticas"
                    value={stats.critical}
                    color="#dc2626"
                    gradient="linear-gradient(135deg, #dc2626, #991b1b)"
                />
            </div>

            {/* Compliance Rate */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Target size={24} color="#10b981" />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Tasa de Cumplimiento Ambiental</h3>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Mediciones dentro de límites normativos</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>{stats.complianceRate}%</div>
                    </div>
                </div>
                <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats.complianceRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '6px', transition: 'width 1s ease' }} />
                </div>
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
                    icon={<Activity size={18} />}
                    label="Mediciones"
                    count={measurements.length}
                />
                <TabButton 
                    active={activeTab === 'stations'}
                    onClick={() => setActiveTab('stations')}
                    icon={<Factory size={18} />}
                    label="Estaciones"
                    count={stations.length}
                />
                <TabButton 
                    active={activeTab === 'limits'}
                    onClick={() => setActiveTab('limits')}
                    icon={<Target size={18} />}
                    label="Límites"
                    count={0}
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
                                placeholder="Buscar por estación, ubicación..."
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
                            {MONITORING_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                            ))}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
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
                            <option value="all">Todos los Estados</option>
                            {Object.entries(MEASUREMENT_STATUS).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Measurements List */}
                    {filteredMeasurements.length === 0 ? (
                        <EmptyStateIllustrated 
                            title="Sin Mediciones"
                            description="Registrá mediciones de monitoreo ambiental según ISO 14001 para control de impacto."
                            onAction={() => setShowAddModal(true)}
                            icon={<Leaf />}
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredMeasurements.map(measurement => (
                                <MeasurementCard 
                                    key={measurement.id}
                                    measurement={measurement}
                                    statusConfig={MEASUREMENT_STATUS[measurement.status] || MEASUREMENT_STATUS.normal}
                                    monitoringType={MONITORING_TYPES.find(t => t.id === measurement.monitoringType)}
                                    onView={() => setSelectedMeasurement(measurement)}
                                    onShare={() => setShareItem(measurement)}
                                    onDelete={() => deleteMeasurement(measurement.id)}
                                />
                            ))}
                        </div>
                    )}
                    
                    {/* Botón Nueva Medición (siempre visible) */}
                    {measurements.length > 0 && (
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', paddingBottom: '2rem' }}>
                            <button 
                                onClick={() => setShowAddModal(true)} 
                                className="btn-primary"
                                style={{ width: 'auto', padding: '1rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: 'var(--radius-xl)', boxShadow: '0 10px 25px var(--color-primary)40' }}
                            >
                                <Plus size={24} strokeWidth={2.5} />
                                Nueva Medición
                            </button>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'stations' && (
                <StationsList stations={stations} measurements={measurements} />
            )}

            {activeTab === 'limits' && (
                <LimitsPanel parameters={PARAMETERS} />
            )}

            {/* Modal de Agregar Medición */}
            {showAddModal && (
                <AddMeasurementModal 
                    measurement={newMeasurement}
                    setMeasurement={setNewMeasurement}
                    onSave={handleAddMeasurement}
                    onClose={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}
                    MONITORING_TYPES={MONITORING_TYPES}
                    PARAMETERS={PARAMETERS}
                    ENVIRONMENTAL_REGULATIONS={ENVIRONMENTAL_REGULATIONS}
                    onPrint={() => setShowShareModal(true)}
                />
            )}

            {/* Modal de Detalle */}
            {selectedMeasurement && (
                <MeasurementDetailModal 
                    measurement={selectedMeasurement}
                    statusConfig={MEASUREMENT_STATUS[(selectedMeasurement as any).status] || MEASUREMENT_STATUS.normal}
                    monitoringType={MONITORING_TYPES.find(t => t.id === (selectedMeasurement as any).monitoringType)}
                    onClose={() => setSelectedMeasurement(null)}
                    PARAMETERS={PARAMETERS}
                    setShowShareModal={setShowShareModal}
                />
            )}

            <ShareModal 
                isOpen={showShareModal}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title={selectedMeasurement ? "Protocolo de Monitoreo" : "Borrador de Monitoreo"}
                text={selectedMeasurement ? `🌿 Monitoreo Ambiental - ${selectedMeasurement.stationName}` : "Borrador de Monitoreo"}
                rawMessage={selectedMeasurement ? `🌿 Monitoreo Ambiental - ${selectedMeasurement.stationName}` : "Borrador de Monitoreo"}
                fileName={`Monitoreo_${(selectedMeasurement || newMeasurement)?.stationName || 'Ambiental'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <EnvironmentalPdf data={selectedMeasurement || newMeasurement} />
            </div>
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

function TabButton({ active, onClick, icon, label, count }) {
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
                transition: 'all var(--transition-fast)',
                position: 'relative'
            }}
        >
            {icon}
            {label}
            {count !== undefined && (
                <span style={{
                    padding: '0.2rem 0.5rem',
                    background: active ? 'rgba(255,255,255,0.2)' : 'var(--color-background)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 800
                }}>
                    {count}
                </span>
            )}
        </button>
    );
}

function MeasurementCard({ measurement, statusConfig, monitoringType, onView, onShare, onDelete }) {
    return (
        <div className="card" style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all var(--transition-fast)',
            borderLeft: `4px solid ${statusConfig.color}`
        }}>
            {/* Status Icon */}
            <div style={{
                width: '64px',
                height: '64px',
                background: `${statusConfig.color}15`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `2px solid ${statusConfig.color}`
            }}>
                <span style={{ fontSize: '1.75rem' }}>{monitoringType?.icon || '🌍'}</span>
            </div>

            {/* Information */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.1rem', 
                        fontWeight: 800,
                        color: 'var(--color-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {measurement.stationName}
                    </h3>
                    <span style={{
                        padding: '0.35rem 0.75rem',
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                    }}>
                        {statusConfig.label}
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
                        <Leaf size={14} />
                        {monitoringType?.name || 'Ambiental'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} />
                        {new Date(measurement.measurementDate).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={14} />
                        {measurement.technician || 'Sin técnico'}
                    </span>
                </div>
            </div>

            {/* Actions */}
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
                    onClick={onShare}
                    style={{
                        padding: '0.6rem 0.75rem',
                        background: '#dcfce7',
                        border: '1px solid #86efac',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: '#16a34a',
                        transition: 'all var(--transition-fast)'
                    }}
                    title="Compartir PDF"
                >
                    <Share2 size={18} />
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
                <Leaf size={40} color="var(--color-text-muted)" />
            </div>
            <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.25rem', 
                fontWeight: 800,
                color: 'var(--color-text)'
            }}>
                Sin Mediciones Ambientales
            </h3>
            <p style={{ 
                margin: '0 0 1.5rem 0', 
                color: 'var(--color-text-muted)',
                fontSize: '0.95rem'
            }}>
                Registrá mediciones de monitoreo ambiental según ISO 14001
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

function StationsList({ stations, measurements }) {
    if (stations.length === 0) {
        return (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', border: '2px dashed var(--color-border)' }}>
                <Factory size={48} color="var(--color-text-muted)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>No hay estaciones de monitoreo registradas. Las estaciones se crean automáticamente al registrar mediciones.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {stations.map(station => {
                const stationMeasurements = measurements.filter(m => m.stationId === station.id);
                const lastMeasurement = stationMeasurements[0];
                const typeConfig = MONITORING_TYPES.find(t => t.id === station.type);
                
                return (
                    <div key={station.id} className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: `${typeConfig?.color}15`,
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem'
                            }}>
                                {typeConfig?.icon || '🌍'}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{station.name}</h3>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{typeConfig?.name}</p>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                            📍 {station.location || 'Sin ubicación'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Mediciones: <strong>{stationMeasurements.length}</strong></span>
                            <span style={{ color: 'var(--color-text-muted)' }}>Última: <strong>{lastMeasurement ? new Date(lastMeasurement.measurementDate).toLocaleDateString() : '-'}</strong></span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function LimitsPanel({ parameters }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(parameters).map(([type, params]) => {
                const typeConfig = MONITORING_TYPES.find(t => t.id === type);
                return (
                    <div key={type} className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>{typeConfig?.icon}</span>
                            {typeConfig?.name} - Límites Normativos
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {(params as any[]).map(param => (
                                <div key={param.id} style={{
                                    padding: '0.75rem',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 'var(--radius-lg)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{param.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{param.unit}</span>
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: param.limit ? '#dc2626' : '#6b7280' }}>
                                        {param.limit || 'Sin límite'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Modal de Agregar Medición
function AddMeasurementModal({ measurement, setMeasurement, onSave, onClose, MONITORING_TYPES, PARAMETERS, ENVIRONMENTAL_REGULATIONS, onPrint }) {
    const addParameter = () => {
        setMeasurement({
            ...measurement,
            parameters: [...(measurement.parameters || []), { parameterId: '', value: '', unit: '' }]
        });
    };

    const updateParameter = (index, field, value) => {
        const updated = measurement.parameters.map((p, i) => {
            if (i === index) {
                const paramDef = PARAMETERS[measurement.monitoringType]?.find(par => par.id === value);
                return { 
                    ...p, 
                    [field]: value,
                    unit: field === 'parameterId' && paramDef ? paramDef.unit : p.unit
                };
            }
            return p;
        });
        setMeasurement({ ...measurement, parameters: updated });
    };

    const removeParameter = (index) => {
        const updated = measurement.parameters.filter((_, i) => i !== index);
        setMeasurement({ ...measurement, parameters: updated });
    };

    return (
        <div className="modal-fullscreen-overlay" onClick={onClose}>
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
                        <Leaf size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Nueva Medición Ambiental
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            onClick={onPrint}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-primary)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                color: 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 700
                            }}
                        >
                            <Printer size={18} />
                            Imprimir
                        </button>
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Tipo de Monitoreo */}
                    <div>
                        <label style={labelStyle}>Tipo de Monitoreo *</label>
                        <select
                            value={measurement.monitoringType}
                            onChange={(e) => setMeasurement({ ...measurement, monitoringType: e.target.value, parameters: [] })}
                            style={inputStyle}
                        >
                            <option value="">Seleccionar tipo</option>
                            {MONITORING_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Nombre de Estación */}
                    <div>
                        <label style={labelStyle}>Nombre de Estación/Punto *</label>
                        <input
                            type="text"
                            value={measurement.stationName}
                            onChange={(e) => setMeasurement({ ...measurement, stationName: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: Estación de Aire Norte"
                        />
                    </div>

                    {/* Ubicación */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Ubicación</label>
                        <input
                            type="text"
                            value={measurement.location}
                            onChange={(e) => setMeasurement({ ...measurement, location: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: Planta Industrial, Sector B"
                        />
                    </div>

                    {/* Fecha y Hora */}
                    <div>
                        <label style={labelStyle}>Fecha de Medición</label>
                        <input
                            type="date"
                            value={measurement.measurementDate}
                            onChange={(e) => setMeasurement({ ...measurement, measurementDate: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Hora de Medición</label>
                        <input
                            type="time"
                            value={measurement.measurementTime}
                            onChange={(e) => setMeasurement({ ...measurement, measurementTime: e.target.value })}
                            style={inputStyle}
                        />
                    </div>

                    {/* Técnico */}
                    <div>
                        <label style={labelStyle}>Técnico Responsable</label>
                        <input
                            type="text"
                            value={measurement.technician}
                            onChange={(e) => setMeasurement({ ...measurement, technician: e.target.value })}
                            style={inputStyle}
                            placeholder="Nombre del técnico"
                        />
                    </div>

                    {/* Equipo */}
                    <div>
                        <label style={labelStyle}>Equipo de Medición</label>
                        <input
                            type="text"
                            value={measurement.equipment}
                            onChange={(e) => setMeasurement({ ...measurement, equipment: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: Sonómetro SL-4001"
                        />
                    </div>
                </div>

                {/* Parámetros */}
                {measurement.monitoringType && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <label style={{ ...labelStyle, margin: 0 }}>Parámetros Medidos</label>
                            <button
                                onClick={addParameter}
                                style={{
                                    padding: '0.4rem 0.75rem',
                                    background: 'var(--color-primary)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                }}
                            >
                                <Plus size={14} /> Agregar
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {measurement.parameters?.map((param, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                                    <select
                                        value={param.parameterId}
                                        onChange={(e) => updateParameter(index, 'parameterId', e.target.value)}
                                        style={{ ...inputStyle, marginBottom: 0 }}
                                    >
                                        <option value="">Seleccionar parámetro</option>
                                        {PARAMETERS[measurement.monitoringType]?.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={param.value}
                                        onChange={(e) => updateParameter(index, 'value', e.target.value)}
                                        style={{ ...inputStyle, marginBottom: 0 }}
                                        placeholder="Valor"
                                    />
                                    <button
                                        onClick={() => removeParameter(index)}
                                        style={{
                                            padding: '0.5rem',
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            color: '#dc2626'
                                        }}
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            ))}
                            {(!measurement.parameters || measurement.parameters.length === 0) && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                    No hay parámetros agregados. Hacé clic en "Agregar" para añadir parámetros.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Condiciones Ambientales */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Condiciones Ambientales</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Temperatura (°C)</span>
                            <input
                                type="number"
                                step="0.1"
                                value={measurement.weather.temperature}
                                onChange={(e) => setMeasurement({ ...measurement, weather: { ...measurement.weather, temperature: e.target.value } })}
                                style={{ ...inputStyle, padding: '0.5rem' }}
                            />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Humedad (%)</span>
                            <input
                                type="number"
                                value={measurement.weather.humidity}
                                onChange={(e) => setMeasurement({ ...measurement, weather: { ...measurement.weather, humidity: e.target.value } })}
                                style={{ ...inputStyle, padding: '0.5rem' }}
                            />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Viento (km/h)</span>
                            <input
                                type="number"
                                value={measurement.weather.windSpeed}
                                onChange={(e) => setMeasurement({ ...measurement, weather: { ...measurement.weather, windSpeed: e.target.value } })}
                                style={{ ...inputStyle, padding: '0.5rem' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Observaciones */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Observaciones</label>
                    <textarea
                        value={measurement.observations}
                        onChange={(e) => setMeasurement({ ...measurement, observations: e.target.value })}
                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        placeholder="Observaciones relevantes sobre la medición..."
                    />
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

// Modal de Detalle
function MeasurementDetailModal({ measurement, statusConfig, monitoringType, onClose, PARAMETERS, setShowShareModal }: any) {
    const typeParams = PARAMETERS[measurement.monitoringType] || [];

    return (
        <div className="modal-fullscreen-overlay" onClick={onClose}>
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
                    background: `${statusConfig.bg}`,
                    borderBottom: `2px solid ${statusConfig.color}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: `linear-gradient(135deg, ${statusConfig.color}, ${statusConfig.color}cc)`,
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '2rem'
                        }}>
                            {monitoringType?.icon || '🌍'}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                                {measurement.stationName}
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                {measurement.location || 'Sin ubicación'} • {statusConfig.label}
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

                {/* Parámetros Medidos */}
                {measurement.parameters && measurement.parameters.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                            Parámetros Medidos
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {measurement.parameters.map((param, idx) => {
                                const paramDef = typeParams.find(p => p.id === param.parameterId);
                                const isExceeded = paramDef?.limit && parseFloat(param.value) > paramDef.limit;
                                
                                return (
                                    <div key={idx} style={{
                                        padding: '0.75rem 1rem',
                                        background: isExceeded ? '#fef2f2' : 'var(--color-background)',
                                        border: `1px solid ${isExceeded ? '#fecaca' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{paramDef?.name || param.parameterId}</div>
                                            {paramDef?.limit && (
                                                <div style={{ fontSize: '0.75rem', color: isExceeded ? '#dc2626' : 'var(--color-text-muted)' }}>
                                                    Límite: {paramDef.limit} {paramDef.unit}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: isExceeded ? '#dc2626' : 'var(--color-text)' }}>
                                                {param.value}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {param.unit || paramDef?.unit}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Condiciones Ambientales */}
                {(measurement.weather?.temperature || measurement.weather?.humidity || measurement.weather?.windSpeed) && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                            <Cloud size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Condiciones Ambientales
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            {measurement.weather.temperature && (
                                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                                    <Thermometer size={20} color="#f59e0b" style={{ margin: '0 auto 0.5rem' }} />
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Temperatura</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{measurement.weather.temperature}°C</div>
                                </div>
                            )}
                            {measurement.weather.humidity && (
                                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                                    <Droplets size={20} color="#3b82f6" style={{ margin: '0 auto 0.5rem' }} />
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Humedad</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{measurement.weather.humidity}%</div>
                                </div>
                            )}
                            {measurement.weather.windSpeed && (
                                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                                    <Wind size={20} color="#6b7280" style={{ margin: '0 auto 0.5rem' }} />
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Viento</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{measurement.weather.windSpeed} km/h</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Información Adicional */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <InfoDetail label="Fecha" value={measurement.measurementDate ? new Date(measurement.measurementDate).toLocaleDateString() : '-'} />
                    <InfoDetail label="Hora" value={measurement.measurementTime || '-'} />
                    <InfoDetail label="Técnico" value={measurement.technician || '-'} />
                    <InfoDetail label="Equipo" value={measurement.equipment || '-'} />
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

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => {
                            setShowShareModal(true);
                        }}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-primary)',
                            borderRadius: 'var(--radius-lg)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Printer size={18} />
                        Imprimir / PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="btn-primary"
                        style={{ flex: 1, margin: 0 }}
                    >
                        Cerrar
                    </button>
                </div>
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
    boxSizing: 'border-box' as any
};
