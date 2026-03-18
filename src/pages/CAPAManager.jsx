import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ClipboardCheck, Plus, Search, 
    FileText, Eye, Edit3, Trash2, CheckCircle2, 
    XCircle, Clock, User, Users, Calendar,
    Shield, TrendingUp, AlertTriangle, BarChart3,
    Activity, CheckSquare, Target, Layers,
    Zap, AlertCircle, RefreshCw, ThumbsUp
} from 'lucide-react';

// Tipos de acción CAPA
const CAPA_TYPES = [
    { id: 'corrective', name: 'Acción Correctiva', icon: '🔧', color: '#dc2626', description: 'Eliminar causa de no conformidad detectada' },
    { id: 'preventive', name: 'Acción Preventiva', icon: '🛡️', color: '#3b82f6', description: 'Prevenir ocurrencia de no conformidad potencial' },
    { id: 'improvement', name: 'Mejora Continua', icon: '📈', color: '#10b981', description: 'Mejorar procesos existentes' },
    { id: 'containment', name: 'Contención', icon: '🚨', color: '#f59e0b', description: 'Acción inmediata para contener problema' }
];

// Origen de CAPA
const CAPA_SOURCES = [
    { id: 'audit', name: 'Auditoría', icon: '📋' },
    { id: 'incident', name: 'Incidente/Accidente', icon: '⚠️' },
    { id: 'complaint', name: 'Queja/Reclamo', icon: '📞' },
    { id: 'observation', name: 'Observación', icon: '👁️' },
    { id: 'inspection', name: 'Inspección', icon: '🔍' },
    { id: 'management', name: 'Revisión Dirección', icon: '👔' },
    { id: 'indicator', name: 'Indicadores', icon: '📊' },
    { id: 'other', name: 'Otro', icon: '📍' }
];

// Estados de CAPA
const CAPA_STATUS = {
    draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
    open: { label: 'ABIERTA', color: '#dc2626', bg: '#fef2f2' },
    analysis: { label: 'EN ANÁLISIS', color: '#f59e0b', bg: '#fffbeb' },
    in_progress: { label: 'EN PROGRESO', color: '#3b82f6', bg: '#eff6ff' },
    review: { label: 'EN REVISIÓN', color: '#8b5cf6', bg: '#f5f3ff' },
    completed: { label: 'COMPLETADA', color: '#16a34a', bg: '#f0fdf4' },
    closed: { label: 'CERRADA', color: '#059669', bg: '#ecfdf5' }
};

// Prioridad
const PRIORITY = {
    critical: { label: 'CRÍTICA', color: '#dc2626', icon: '🔴', days: 3 },
    high: { label: 'ALTA', color: '#f59e0b', icon: '🟠', days: 7 },
    medium: { label: 'MEDIA', color: '#3b82f6', icon: '🔵', days: 15 },
    low: { label: 'BAJA', color: '#16a34a', icon: '🟢', days: 30 }
};

// Métodos de análisis de causa raíz
const ROOT_CAUSE_METHODS = [
    { id: '5why', name: '5 Porqués', icon: '❓' },
    { id: 'fishbone', name: 'Diagrama Ishikawa', icon: '🐟' },
    { id: 'fault_tree', name: 'Árbol de Fallas', icon: '🌳' },
    { id: 'taproot', name: 'TapRooT', icon: '🔍' },
    { id: 'other', name: 'Otro', icon: '📝' }
];

// Jerarquía de controles
const CONTROL_HIERARCHY = [
    { id: 'elimination', name: 'Eliminación', icon: '❌', level: 1, effective: 'Más efectivo' },
    { id: 'substitution', name: 'Sustitución', icon: '🔄', level: 2, effective: 'Muy efectivo' },
    { id: 'engineering', name: 'Controles Ingeniería', icon: '⚙️', level: 3, effective: 'Efectivo' },
    { id: 'administrative', name: 'Controles Admin.', icon: '📋', level: 4, effective: 'Moderado' },
    { id: 'ppe', name: 'EPP', icon: '🦺', level: 5, effective: 'Menos efectivo' }
];

export default function CAPAManager() {
    const navigate = useNavigate();
    const [capas, setCapas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCapa, setSelectedCapa] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [showActionModal, setShowActionModal] = useState(false);
    const [currentCapaForAction, setCurrentCapaForAction] = useState(null);

    const [newCapa, setNewCapa] = useState({
        id: '',
        title: '',
        description: '',
        capaType: '',
        source: '',
        priority: 'medium',
        originDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        responsible: '',
        team: [],
        relatedProcess: '',
        problemStatement: '',
        rootCauseMethod: '',
        rootCauseAnalysis: '',
        immediateActions: [],
        correctiveActions: [],
        controlType: '',
        effectivenessCriteria: '',
        status: 'draft',
        createdAt: '',
        openedAt: '',
        completedAt: '',
        closedAt: '',
        observations: ''
    });

    useEffect(() => {
        const loadCapas = () => {
            const savedCapas = localStorage.getItem('ehs_capa_db');
            if (savedCapas) setCapas(JSON.parse(savedCapas));
        };

        loadCapas();

        const handleStorageChange = (e) => {
            if (e.key === 'ehs_capa_db') {
                loadCapas();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        const params = new URLSearchParams(window.location.search);
        if (params.get('created')) {
            loadCapas();
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const saveCapas = (data) => {
        localStorage.setItem('ehs_capa_db', JSON.stringify(data));
        setCapas(data);
    };

    const handleCreateCapa = () => {
        if (!newCapa.title.trim() || !newCapa.capaType) return;
        
        const capa = {
            ...newCapa,
            id: `CAPA-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'open',
            actions: [],
            timeline: [{
                date: new Date().toISOString(),
                event: 'Creada',
                user: 'Usuario'
            }]
        };

        const updated = [capa, ...capas];
        saveCapas(updated);
        setShowAddModal(false);
        resetForm();
    };

    const resetForm = () => {
        setNewCapa({
            id: '',
            title: '',
            description: '',
            capaType: '',
            source: '',
            priority: 'medium',
            originDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            responsible: '',
            team: [],
            relatedProcess: '',
            problemStatement: '',
            rootCauseMethod: '',
            rootCauseAnalysis: '',
            immediateActions: [],
            correctiveActions: [],
            controlType: '',
            effectivenessCriteria: '',
            status: 'draft',
            createdAt: '',
            openedAt: '',
            completedAt: '',
            closedAt: '',
            observations: ''
        });
    };

    const updateCapaStatus = (capaId, status) => {
        const updated = capas.map(c => {
            if (c.id === capaId) {
                const timeline = [...(c.timeline || []), {
                    date: new Date().toISOString(),
                    event: `Estado cambiado a ${CAPA_STATUS[status]?.label}`,
                    user: 'Usuario'
                }];
                return { 
                    ...c, 
                    status,
                    openedAt: status === 'open' ? new Date().toISOString() : c.openedAt,
                    completedAt: status === 'completed' ? new Date().toISOString() : c.completedAt,
                    closedAt: status === 'closed' ? new Date().toISOString() : c.closedAt,
                    timeline
                };
            }
            return c;
        });
        saveCapas(updated);
    };

    const addAction = (capaId, action) => {
        const updated = capas.map(c => {
            if (c.id === capaId) {
                const newAction = {
                    ...action,
                    id: `ACT-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    status: 'pending'
                };
                const actions = [...(c.actions || []), newAction];
                const timeline = [...(c.timeline || []), {
                    date: new Date().toISOString(),
                    event: `Acción agregada: ${action.description}`,
                    user: 'Usuario'
                }];
                return { ...c, actions, timeline };
            }
            return c;
        });
        saveCapdas(updated);
    };

    const updateActionStatus = (capaId, actionId, status) => {
        const updated = capas.map(c => {
            if (c.id === capaId) {
                const actions = (c.actions || []).map(a => 
                    a.id === actionId ? { ...a, status, completedAt: status === 'completed' ? new Date().toISOString() : a.completedAt } : a
                );
                const timeline = [...(c.timeline || []), {
                    date: new Date().toISOString(),
                    event: `Acción ${status}: ${actions.find(a => a.id === actionId)?.description}`,
                    user: 'Usuario'
                }];
                return { ...c, actions, timeline };
            }
            return c;
        });
        saveCapas(updated);
    };

    const deleteCapa = (id) => {
        if (confirm('¿Eliminar esta CAPA?')) {
            saveCapas(capas.filter(c => c.id !== id));
        }
    };

    const filteredCapas = capas.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.responsible?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        const matchesType = filterType === 'all' || c.capaType === filterType;
        const matchesTab = activeTab === 'all' ? true : activeTab === 'open' ? c.status === 'open' || c.status === 'analysis' || c.status === 'in_progress' : c.status === 'completed' || c.status === 'closed';
        return matchesSearch && matchesStatus && matchesType && matchesTab;
    });

    // Estadísticas
    const stats = {
        total: capas.length,
        open: capas.filter(c => c.status === 'open' || c.status === 'analysis' || c.status === 'in_progress').length,
        completed: capas.filter(c => c.status === 'completed' || c.status === 'closed').length,
        overdue: capas.filter(c => c.dueDate && new Date(c.dueDate) < new Date() && c.status !== 'closed').length,
        critical: capas.filter(c => c.priority === 'critical' && c.status !== 'closed').length,
        onTime: capas.filter(c => c.status === 'completed' && c.dueDate && new Date(c.completedAt) <= new Date(c.dueDate)).length,
        effectivenessRate: capas.filter(c => c.status === 'closed').length > 0 
            ? Math.round((capas.filter(c => c.status === 'closed' && c.effectivenessVerified).length / capas.filter(c => c.status === 'closed').length) * 100)
            : 0
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
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                    }}>
                        <RefreshCw size={32} color="#ffffff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '1.5rem', 
                            fontWeight: 900,
                            color: 'var(--color-text)',
                            letterSpacing: '-0.5px'
                        }}>
                            CAPA - Acciones Correctivas/Preventivas
                        </h1>
                        <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            ISO 9001 / ISO 45001 • {stats.open} abiertas
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
                        Nueva CAPA
                    </button>
                    <button
                        onClick={() => navigate('/capa-reports')}
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
                    icon={<FileText size={24} />}
                    label="Total CAPA"
                    value={stats.total}
                    color="#3B82F6"
                    gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
                />
                <StatCard 
                    icon={<Clock size={24} />}
                    label="Abiertas"
                    value={stats.open}
                    color="#f59e0b"
                    gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                />
                <StatCard 
                    icon={<AlertTriangle size={24} />}
                    label="Vencidas"
                    value={stats.overdue}
                    color="#dc2626"
                    gradient="linear-gradient(135deg, #dc2626, #991b1b)"
                />
                <StatCard 
                    icon={<CheckCircle2 size={24} />}
                    label="Cerradas"
                    value={stats.completed}
                    color="#16a34a"
                    gradient="linear-gradient(135deg, #16a34a, #059669)"
                />
            </div>

            {/* Secondary Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tasa de Efectividad</span>
                        <ThumbsUp size={20} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>
                        {stats.effectivenessRate}%
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '0.75rem', overflow: 'hidden' }}>
                        <div style={{ width: `${stats.effectivenessRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '4px' }} />
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Entrega a Tiempo</span>
                        <Target size={20} color="#3b82f6" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3b82f6' }}>
                        {stats.onTime}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        {stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0}% del total
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Críticas Pendientes</span>
                        <Zap size={20} color="#dc2626" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#dc2626' }}>
                        {stats.critical}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        Requieren atención inmediata
                    </div>
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
                    active={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                    icon={<Layers size={18} />}
                    label="Todas"
                    count={capas.length}
                />
                <TabButton 
                    active={activeTab === 'open'}
                    onClick={() => setActiveTab('open')}
                    icon={<Clock size={18} />}
                    label="Abiertas"
                    count={stats.open}
                />
                <TabButton 
                    active={activeTab === 'completed'}
                    onClick={() => setActiveTab('completed')}
                    icon={<CheckCircle2 size={18} />}
                    label="Completadas"
                    count={stats.completed}
                />
            </div>

            {/* Filters */}
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
                        placeholder="Buscar por ID, título, responsable..."
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
                    {Object.entries(CAPA_STATUS).map(([key, value]) => (
                        <option key={key} value={key}>{value.label}</option>
                    ))}
                </select>

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
                    {CAPA_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                    ))}
                </select>
            </div>

            {/* CAPA List */}
            {filteredCapas.length === 0 ? (
                <EmptyState onAdd={() => setShowAddModal(true)} />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredCapas.map(capa => (
                        <CapaCard 
                            key={capa.id}
                            capa={capa}
                            statusConfig={CAPA_STATUS[capa.status] || CAPA_STATUS.draft}
                            priorityConfig={PRIORITY[capa.priority] || PRIORITY.medium}
                            capaType={CAPA_TYPES.find(t => t.id === capa.capaType)}
                            onUpdateStatus={updateCapaStatus}
                            onView={() => setSelectedCapa(capa)}
                            onAddAction={() => {
                                setCurrentCapaForAction(capa);
                                setShowActionModal(true);
                            }}
                            onDelete={() => deleteCapa(capa.id)}
                        />
                    ))}
                </div>
            )}

            {/* Modal de Crear CAPA */}
            {showAddModal && (
                <CreateCapaModal 
                    capa={newCapa}
                    setCapa={setNewCapa}
                    onSave={handleCreateCapa}
                    onClose={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}
                    CAPA_TYPES={CAPA_TYPES}
                    CAPA_SOURCES={CAPA_SOURCES}
                    PRIORITY={PRIORITY}
                    ROOT_CAUSE_METHODS={ROOT_CAUSE_METHODS}
                />
            )}

            {/* Modal de Detalle */}
            {selectedCapa && (
                <CapaDetailModal 
                    capa={selectedCapa}
                    statusConfig={CAPA_STATUS[selectedCapa.status] || CAPA_STATUS.draft}
                    priorityConfig={PRIORITY[selectedCapa.priority] || PRIORITY.medium}
                    capaType={CAPA_TYPES.find(t => t.id === selectedCapa.capaType)}
                    onClose={() => setSelectedCapa(null)}
                    onUpdateStatus={updateCapaStatus}
                    CAPA_TYPES={CAPA_TYPES}
                    CAPA_SOURCES={CAPA_SOURCES}
                    CONTROL_HIERARCHY={CONTROL_HIERARCHY}
                />
            )}

            {/* Modal de Acción */}
            {showActionModal && currentCapaForAction && (
                <CreateActionModal 
                    capa={currentCapaForAction}
                    onSave={(action) => {
                        addAction(currentCapaForAction.id, action);
                        setShowActionModal(false);
                    }}
                    onClose={() => {
                        setShowActionModal(false);
                        setCurrentCapaForAction(null);
                    }}
                    CONTROL_HIERARCHY={CONTROL_HIERARCHY}
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

function CapaCard({ capa, statusConfig, priorityConfig, capaType, onUpdateStatus, onView, onAddAction, onDelete }) {
    const isOverdue = capa.dueDate && new Date(capa.dueDate) < new Date() && capa.status !== 'closed';
    const daysUntilDue = capa.dueDate ? Math.ceil((new Date(capa.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <div className="card" style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all var(--transition-fast)',
            borderLeft: `4px solid ${isOverdue ? '#dc2626' : statusConfig.color}`
        }}>
            {/* Priority & Type Icon */}
            <div style={{
                width: '56px',
                height: '56px',
                background: `${priorityConfig.color}15`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `2px solid ${priorityConfig.color}`
            }}>
                <span style={{ fontSize: '1.5rem' }}>{priorityConfig.icon}</span>
            </div>

            {/* Information */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', background: 'var(--color-background)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)' }}>
                        {capa.id}
                    </span>
                    <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.1rem', 
                        fontWeight: 800,
                        color: 'var(--color-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {capaType?.icon} {capa.title}
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
                    {isOverdue && (
                        <span style={{
                            padding: '0.35rem 0.75rem',
                            background: '#fef2f2',
                            color: '#dc2626',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            <AlertTriangle size={12} />
                            VENCIDA
                        </span>
                    )}
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
                        <User size={14} />
                        {capa.responsible || 'Sin asignar'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} />
                        {capa.dueDate ? new Date(capa.dueDate).toLocaleDateString() : 'Sin fecha'}
                    </span>
                    {daysUntilDue !== null && daysUntilDue >= 0 && (
                        <span style={{ 
                            color: daysUntilDue <= 3 ? '#dc2626' : daysUntilDue <= 7 ? '#f59e0b' : '#16a34a',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                        }}>
                            {daysUntilDue === 0 ? 'Vence hoy' : daysUntilDue === 1 ? 'Vence mañana' : `Vence en ${daysUntilDue} días`}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {capa.status === 'open' && (
                    <button
                        onClick={() => onUpdateStatus(capa.id, 'in_progress')}
                        style={{
                            padding: '0.6rem 0.75rem',
                            background: '#3b82f6',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                        }}
                        title="Iniciar"
                    >
                        <Clock size={18} />
                    </button>
                )}
                {capa.status === 'in_progress' && (
                    <button
                        onClick={onAddAction}
                        style={{
                            padding: '0.6rem 0.75rem',
                            background: '#10b981',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                        }}
                        title="Agregar Acción"
                    >
                        <Plus size={18} />
                    </button>
                )}
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
                <RefreshCw size={40} color="var(--color-text-muted)" />
            </div>
            <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.25rem', 
                fontWeight: 800,
                color: 'var(--color-text)'
            }}>
                Sin CAPA Registradas
            </h3>
            <p style={{ 
                margin: '0 0 1.5rem 0', 
                color: 'var(--color-text-muted)',
                fontSize: '0.95rem'
            }}>
                Creá Acciones Correctivas/Preventivas para mejora continua
            </p>
            <button
                onClick={onAdd}
                className="btn-primary"
                style={{ width: 'auto', margin: 0 }}
            >
                <Plus size={20} style={{ marginRight: '0.5rem' }} />
                Primera CAPA
            </button>
        </div>
    );
}

// Modal de Crear CAPA
function CreateCapaModal({ capa, setCapa, onSave, onClose, CAPA_TYPES, CAPA_SOURCES, PRIORITY, ROOT_CAUSE_METHODS }) {
    return (
        <div className="modal-fullscreen-overlay" onClick={onClose}>
            <div className="modal-fullscreen-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Nueva CAPA</h2>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}><XCircle size={24} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Título *</label><input type="text" value={capa.title} onChange={(e) => setCapa({ ...capa, title: e.target.value })} style={inputStyle} placeholder="Ej: No conformidad en auditoría interna" /></div>
                    <div><label style={labelStyle}>Tipo de Acción *</label><select value={capa.capaType} onChange={(e) => setCapa({ ...capa, capaType: e.target.value })} style={inputStyle}>{CAPA_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}</select></div>
                    <div><label style={labelStyle}>Origen</label><select value={capa.source} onChange={(e) => setCapa({ ...capa, source: e.target.value })} style={inputStyle}>{CAPA_SOURCES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select></div>
                    <div><label style={labelStyle}>Prioridad</label><select value={capa.priority} onChange={(e) => setCapa({ ...capa, priority: e.target.value })} style={inputStyle}>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label} ({v.days} días)</option>)}</select></div>
                    <div><label style={labelStyle}>Fecha Límite</label><input type="date" value={capa.dueDate} onChange={(e) => setCapa({ ...capa, dueDate: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Responsable</label><input type="text" value={capa.responsible} onChange={(e) => setCapa({ ...capa, responsible: e.target.value })} style={inputStyle} placeholder="Nombre del responsable" /></div>
                    <div><label style={labelStyle}>Proceso Relacionado</label><input type="text" value={capa.relatedProcess} onChange={(e) => setCapa({ ...capa, relatedProcess: e.target.value })} style={inputStyle} placeholder="Ej: Gestión de Compras" /></div>
                </div>
                <div style={{ marginTop: '1.5rem' }}><label style={labelStyle}>Descripción del Problema *</label><textarea value={capa.problemStatement} onChange={(e) => setCapa({ ...capa, problemStatement: e.target.value })} style={{ ...inputStyle, minHeight: '100px' }} placeholder="Describí claramente el problema o no conformidad detectada..." /></div>
                <div style={{ marginTop: '1rem' }}><label style={labelStyle}>Descripción Adicional</label><textarea value={capa.description} onChange={(e) => setCapa({ ...capa, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} placeholder="Información complementaria..." /></div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '0.85rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={onSave} className="btn-primary" style={{ flex: 1 }}>Crear CAPA</button>
                </div>
            </div>
        </div>
    );
}

// Modal de Detalle
function CapaDetailModal({ capa, statusConfig, priorityConfig, capaType, onClose, onUpdateStatus, CAPA_TYPES, CAPA_SOURCES, CONTROL_HIERARCHY }) {
    const [showTimeline, setShowTimeline] = useState(false);
    const isOverdue = capa.dueDate && new Date(capa.dueDate) < new Date() && capa.status !== 'closed';

    return (
        <div className="modal-fullscreen-overlay" onClick={onClose}>
            <div className="modal-fullscreen-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '1.5rem', background: `${statusConfig.bg}`, borderBottom: `2px solid ${statusConfig.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '64px', height: '64px', background: `linear-gradient(135deg, ${priorityConfig.color}, ${priorityConfig.color}cc)`, borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <span style={{ fontSize: '2rem' }}>{priorityConfig.icon}</span>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', background: '#fff', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)' }}>{capa.id}</span>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{capaType?.icon} {capa.title}</h2>
                            </div>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{capaType?.name} • {statusConfig.label}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}><XCircle size={24} /></button>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <InfoDetail label="Origen" value={capa.source ? CAPA_SOURCES.find(s => s.id === capa.source)?.name : '-'} />
                    <InfoDetail label="Responsable" value={capa.responsible || '-'} />
                    <InfoDetail label="Prioridad" value={<span style={{ color: priorityConfig.color, fontWeight: 800 }}>{priorityConfig.icon} {priorityConfig.label}</span>} />
                    <InfoDetail label="Fecha Límite" value={capa.dueDate ? new Date(capa.dueDate).toLocaleDateString() : '-'} />
                    {isOverdue && <InfoDetail label="Estado" value={<span style={{ color: '#dc2626', fontWeight: 800 }}>⚠️ VENCIDA</span>} />}
                </div>

                {/* Problem Statement */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Declaración del Problema</h3>
                    <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-lg)' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#991b1b', lineHeight: 1.6 }}>{capa.problemStatement || 'No especificado'}</p>
                    </div>
                </div>

                {/* Actions */}
                {capa.actions && capa.actions.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Acciones ({capa.actions.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {capa.actions.map((action, idx) => (
                                <div key={action.id} style={{ padding: '0.75rem', background: action.status === 'completed' ? '#f0fdf4' : '#f8fafc', border: `1px solid ${action.status === 'completed' ? '#16a34a' : '#e2e8f0'}`, borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '28px', height: '28px', background: action.status === 'completed' ? '#16a34a' : '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 900 }}>{idx + 1}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{action.description}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Responsable: {action.responsible || 'N/A'} • Vence: {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'N/A'}</div>
                                        </div>
                                        <span style={{ padding: '0.25rem 0.5rem', background: action.status === 'completed' ? '#16a34a' : '#f59e0b', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: 800 }}>{action.status === 'completed' ? 'COMPLETADA' : 'PENDIENTE'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline */}
                {capa.timeline && capa.timeline.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <button onClick={() => setShowTimeline(!showTimeline)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                            <Clock size={18} />
                            {showTimeline ? 'Ocultar' : 'Ver'} Línea de Tiempo ({capa.timeline.length})
                        </button>
                        {showTimeline && (
                            <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--color-background)', borderRadius: 'var(--radius-lg)' }}>
                                {capa.timeline.map((event, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: idx < capa.timeline.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                        <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '50%', marginTop: '4px', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{event.event}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(event.date).toLocaleString()} • {event.user}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Status Change Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {capa.status === 'draft' && <button onClick={() => onUpdateStatus(capa.id, 'open')} className="btn-primary" style={{ flex: 'auto', margin: 0, padding: '0.6rem 1rem' }}>Abrir CAPA</button>}
                    {capa.status === 'open' && <button onClick={() => onUpdateStatus(capa.id, 'in_progress')} className="btn-primary" style={{ flex: 'auto', margin: 0, padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>Iniciar</button>}
                    {capa.status === 'in_progress' && <button onClick={() => onUpdateStatus(capa.id, 'review')} className="btn-primary" style={{ flex: 'auto', margin: 0, padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>Enviar a Revisión</button>}
                    {capa.status === 'review' && <button onClick={() => onUpdateStatus(capa.id, 'completed')} className="btn-primary" style={{ flex: 'auto', margin: 0, padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #16a34a, #059669)' }}>Completar</button>}
                    {capa.status === 'completed' && <button onClick={() => onUpdateStatus(capa.id, 'closed')} className="btn-primary" style={{ flex: 'auto', margin: 0, padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #059669, #047857)' }}>Cerrar CAPA</button>}
                </div>

                <button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>Cerrar</button>
            </div>
        </div>
    );
}

// Modal de Acción
function CreateActionModal({ capa, onSave, onClose, CONTROL_HIERARCHY }) {
    const [action, setAction] = useState({ description: '', responsible: '', dueDate: '', controlType: '', expectedResult: '' });

    return (
        <div className="modal-fullscreen-overlay" onClick={onClose}>
            <div className="modal-fullscreen-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}><h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}><Plus size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />Nueva Acción</h2><button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}><XCircle size={24} /></button></div>
                <div style={{ marginBottom: '1rem' }}><label style={labelStyle}>Descripción de la Acción *</label><textarea value={action.description} onChange={(e) => setAction({ ...action, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} placeholder="Describí la acción a implementar..." /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}><div><label style={labelStyle}>Responsable</label><input type="text" value={action.responsible} onChange={(e) => setAction({ ...action, responsible: e.target.value })} style={inputStyle} /></div><div><label style={labelStyle}>Fecha Límite</label><input type="date" value={action.dueDate} onChange={(e) => setAction({ ...action, dueDate: e.target.value })} style={inputStyle} /></div></div>
                <div style={{ marginBottom: '1rem' }}><label style={labelStyle}>Tipo de Control (Jerarquía)</label><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>{CONTROL_HIERARCHY.map(ctrl => (<button key={ctrl.id} onClick={() => setAction({ ...action, controlType: ctrl.id })} style={{ padding: '0.6rem', background: action.controlType === ctrl.id ? '#f0fdf4' : 'var(--color-background)', border: `2px solid ${action.controlType === ctrl.id ? '#16a34a' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}><span style={{ fontSize: '1.5rem' }}>{ctrl.icon}</span><span style={{ fontSize: '0.7rem', fontWeight: 700, color: action.controlType === ctrl.id ? '#16a34a' : 'var(--color-text)' }}>{ctrl.name}</span></button>))}</div></div>
                <div style={{ display: 'flex', gap: '1rem' }}><button onClick={onClose} style={{ flex: 1, padding: '0.85rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button><button onClick={() => onSave(action)} className="btn-primary" style={{ flex: 1 }}>Agregar Acción</button></div>
            </div>
        </div>
    );
}

function InfoDetail({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }}>{typeof value === 'string' ? value : value}</div>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', transition: 'all var(--transition-fast)', boxSizing: 'border-box' };
