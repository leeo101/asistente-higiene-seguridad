import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ClipboardCheck, Plus, Search, 
    FileText, Eye, Edit3, Trash2, CheckCircle2, 
    XCircle, Clock, User, Calendar,
    Shield, TrendingUp, AlertTriangle, BarChart3,
    Activity, CheckSquare, Target, Layers,
    Zap, AlertCircle, RefreshCw, ThumbsUp, Share2
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import CAPAPdf from '../components/CAPAPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';

// Form styles
const labelStyle = { 
    display: 'block', 
    fontSize: '0.8rem', 
    fontWeight: 700, 
    marginBottom: '0.4rem', 
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
};

const inputStyle = { 
    width: '100%', 
    padding: '0.75rem', 
    borderRadius: 'var(--radius-lg)', 
    border: '1px solid var(--color-border)', 
    background: 'var(--color-background)', 
    color: 'var(--color-text)', 
    fontSize: '0.9rem', 
    outline: 'none',
    boxSizing: 'border-box' as const
};

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

export default function CAPAManager(): React.ReactElement | null {
    const navigate = useNavigate();
    const [capas, setCapas] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCapa, setSelectedCapa] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [showActionModal, setShowActionModal] = useState(false);
    const [currentCapaForAction, setCurrentCapaForAction] = useState(null);
    const [shareItem, setShareItem] = useState(null);

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
        navigate('/capa/new');
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
        saveCapas(updated);
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
            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Acción CAPA - ${shareItem?.title || ''}`}
                text={shareItem ? `🛡️ Acción CAPA\n📝 Hallazgo: ${shareItem.title}\n📍 Origen: ${shareItem.source}\n📅 Fecha: ${shareItem.originDate}` : ''}
                rawMessage={shareItem ? `🛡️ Acción CAPA\n📝 Hallazgo: ${shareItem.title}\n📍 Origen: ${shareItem.source}\n📅 Fecha: ${shareItem.originDate}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`CAPA_${shareItem?.title.replace(/\s+/g, '_') || 'Accion'}.pdf`}
            />

            <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
                {shareItem && <CAPAPdf data={shareItem} />}
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
                        onClick={() => navigate('/capa/new')}
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
                        onClick={() => navigate('/history')}
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
                gap: '0.25rem',
                marginBottom: '2rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--glass-border)',
                padding: '0.35rem',
                borderRadius: 'var(--radius-full)',
                width: 'fit-content',
                boxShadow: 'var(--glass-shadow)',
                backdropFilter: 'blur(20px)'
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
                <EmptyStateIllustrated 
                    title="Sin Acciones CAPA"
                    description="Registrá y hacé seguimiento de acciones correctivas y preventivas para la mejora continua."
                    onAction={() => setShowAddModal(true)}
                    icon={<RefreshCw />}
                />
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
                            onEdit={() => navigate('/capa/new', { state: { editData: capa } })}
                            onShare={() => setShareItem(capa)}
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
                    onSave={saveCapas}
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
        <div className="capa-stat-card" style={{
            padding: '1.5rem',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            borderRadius: 'var(--radius-2xl)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer'
        }}>
            <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '120px',
                height: '120px',
                background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
                borderRadius: '50%',
                pointerEvents: 'none'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    background: gradient,
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 24px ${color}30`
                }}>
                    {React.cloneElement(icon, { color: '#ffffff', size: 22 })}
                </div>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1, letterSpacing: '-1px', marginBottom: '0.25rem' }}>
                {value}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                padding: '0.6rem 1.25rem',
                background: active ? 'var(--glass-thick)' : 'transparent',
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                border: active ? '1px solid var(--glass-border-subtle)' : '1px solid transparent',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                boxShadow: active ? 'var(--glass-shadow)' : 'none',
                backdropFilter: active ? 'blur(10px)' : 'none'
            }}
        >
            {icon}
            <span>{label}</span>
            {count !== undefined && (
                <span style={{
                    padding: '0.15rem 0.4rem',
                    background: active ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-background)',
                    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    marginLeft: '0.25rem'
                }}>
                    {count}
                </span>
            )}
        </button>
    );
}

function CapaCard({ capa, statusConfig, priorityConfig, capaType, onUpdateStatus, onView, onEdit, onShare, onAddAction, onDelete }) {
    const isOverdue = capa.dueDate && new Date(capa.dueDate) < new Date() && capa.status !== 'closed';
    const daysUntilDue = capa.dueDate ? Math.ceil((new Date(capa.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <div className="capa-card" style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            borderRadius: 'var(--radius-2xl)',
            borderLeft: `5px solid ${isOverdue ? '#dc2626' : statusConfig.color}`
        }}>
            {/* Priority & Type Icon */}
            <div style={{
                width: '56px',
                height: '56px',
                background: `${priorityConfig.color}10`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1.5px solid ${priorityConfig.color}40`,
                boxShadow: `0 4px 12px ${priorityConfig.color}15`
            }}>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{priorityConfig.icon}</span>
            </div>

            {/* Information */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-primary)', background: 'rgba(var(--color-primary-rgb), 0.08)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--color-primary-rgb), 0.12)' }}>
                        {capa.id}
                    </span>
                    <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.1rem', 
                        fontWeight: 900,
                        color: 'var(--color-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '-0.3px'
                    }}>
                        {capaType?.icon} {capa.title}
                    </h3>
                    <span style={{
                        padding: '0.3rem 0.75rem',
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        border: `1px solid ${statusConfig.color}25`
                    }}>
                        {statusConfig.label}
                    </span>
                    {isOverdue && (
                        <span style={{
                            padding: '0.3rem 0.75rem',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#dc2626',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <AlertTriangle size={11} />
                            VENCIDA
                        </span>
                    )}
                </div>
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '1rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 700
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={13} color="var(--color-primary)" />
                        {capa.responsible || 'Sin asignar'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} color="var(--color-primary)" />
                        {capa.dueDate ? new Date(capa.dueDate).toLocaleDateString('es-AR') : 'Sin fecha'}
                    </span>
                    {daysUntilDue !== null && daysUntilDue >= 0 && (
                        <span style={{ 
                            color: daysUntilDue <= 3 ? '#dc2626' : daysUntilDue <= 7 ? '#f59e0b' : '#16a34a',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            background: daysUntilDue <= 3 ? 'rgba(220, 38, 38, 0.08)' : daysUntilDue <= 7 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(22, 163, 74, 0.08)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-sm)'
                        }}>
                            {daysUntilDue === 0 ? 'Vence hoy' : daysUntilDue === 1 ? 'Vence mañana' : `Vence en ${daysUntilDue} días`}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.4rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '0.75rem', flexShrink: 0 }}>
                <button
                    onClick={onEdit}
                    style={{
                        padding: '0.6rem',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: 'var(--color-primary)',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--glass-shadow)'
                    }}
                    title="Editar CAPA"
                >
                    <Edit3 size={16} />
                </button>
                {capa.status === 'open' && (
                    <button
                        onClick={() => onUpdateStatus(capa.id, 'in_progress')}
                        style={{
                            padding: '0.6rem 0.85rem',
                            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            border: 'none',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                        title="Iniciar"
                    >
                        <Clock size={14} />
                        <span>Iniciar</span>
                    </button>
                )}
                {capa.status === 'in_progress' && (
                    <button
                        onClick={onAddAction}
                        style={{
                            padding: '0.6rem 0.85rem',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                        title="Agregar Acción"
                    >
                        <Plus size={14} />
                        <span>Acción</span>
                    </button>
                )}
                <button
                    onClick={onView}
                    style={{
                        padding: '0.6rem',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--glass-shadow)'
                    }}
                    title="Ver detalle"
                >
                    <Eye size={16} />
                </button>
                <button
                    onClick={onShare}
                    style={{
                        padding: '0.6rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: '#10b981',
                        transition: 'all 0.2s'
                    }}
                    title="Compartir PDF"
                >
                    <Share2 size={16} />
                </button>
                <button
                    onClick={onDelete}
                    style={{
                        padding: '0.6rem',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        color: '#ef4444',
                        transition: 'all 0.2s'
                    }}
                    title="Eliminar"
                >
                    <Trash2 size={16} />
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
        <div className="modal-fullscreen-overlay modal-overlay-glass" onClick={onClose}>
            <div className="modal-fullscreen-content modal-glass" style={{ maxWidth: '680px', padding: '2rem', border: '1px solid var(--glass-border)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border-subtle)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <RefreshCw size={20} className="animate-spin-slow" color="var(--color-primary)" />
                        Nueva Acción CAPA
                    </h2>
                    <button onClick={onClose} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.08)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={20} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Título *</label>
                        <input type="text" value={capa.title} onChange={(e) => setCapa({ ...capa, title: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)' }} placeholder="Ej: Fugas detectadas en sector de químicos" />
                    </div>
                    <div>
                        <label style={labelStyle}>Tipo de Acción *</label>
                        <select value={capa.capaType} onChange={(e) => setCapa({ ...capa, capaType: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)' }}>
                            {CAPA_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Origen</label>
                        <select value={capa.source} onChange={(e) => setCapa({ ...capa, source: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)' }}>
                            {CAPA_SOURCES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Prioridad</label>
                        <select value={capa.priority} onChange={(e) => setCapa({ ...capa, priority: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)' }}>
                            {Object.entries(PRIORITY).map(([k, v]: [string, any]) => <option key={k} value={k}>{v.icon} {v.label} ({v.days} días)</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Fecha Límite</label>
                        <input type="date" value={capa.dueDate} onChange={(e) => setCapa({ ...capa, dueDate: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)' }} />
                    </div>
                    <div>
                        <label style={labelStyle}>Responsable</label>
                        <input type="text" value={capa.responsible} onChange={(e) => setCapa({ ...capa, responsible: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)' }} placeholder="Nombre del responsable" />
                    </div>
                    <div>
                        <label style={labelStyle}>Proceso Relacionado</label>
                        <input type="text" value={capa.relatedProcess} onChange={(e) => setCapa({ ...capa, relatedProcess: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)' }} placeholder="Ej: Gestión de Compras" />
                    </div>
                </div>
                <div style={{ marginTop: '1.25rem' }}>
                    <label style={labelStyle}>Descripción del Problema *</label>
                    <textarea value={capa.problemStatement} onChange={(e) => setCapa({ ...capa, problemStatement: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, minHeight: '80px', background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)', paddingTop: '0.75rem' }} placeholder="Describí claramente el problema o no conformidad detectada..." />
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label style={labelStyle}>Descripción Adicional</label>
                    <textarea value={capa.description} onChange={(e) => setCapa({ ...capa, description: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, minHeight: '60px', background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)', paddingTop: '0.75rem' }} placeholder="Información complementaria..." />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border-subtle)' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-muted)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>Cancelar</button>
                    <button onClick={onSave} className="btn-primary" style={{ flex: 1, margin: 0, padding: '0.85rem', fontWeight: 800 }}>Crear CAPA</button>
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
        <div className="modal-fullscreen-overlay modal-overlay-glass" onClick={onClose}>
            <div className="modal-fullscreen-content modal-glass" style={{ maxWidth: '720px', padding: 0, border: '1px solid var(--glass-border)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', background: `linear-gradient(135deg, ${statusConfig.bg}, rgba(var(--color-surface-rgb), 0.95))`, borderBottom: `2.5px solid ${statusConfig.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '56px', height: '56px', background: `linear-gradient(135deg, ${priorityConfig.color}, ${priorityConfig.color}cc)`, borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 8px 20px ${priorityConfig.color}25` }}>
                            <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{priorityConfig.icon}</span>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-primary)', background: 'rgba(var(--color-primary-rgb), 0.08)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--color-primary-rgb), 0.15)' }}>{capa.id}</span>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>{capaType?.icon} {capa.title}</h2>
                            </div>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>{capaType?.name} • {statusConfig.label}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.08)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={22} /></button>
                </div>

                <div style={{ padding: '2rem', maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
                    {/* Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem', padding: '1rem 1.25rem', background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)', borderRadius: 'var(--radius-xl)' }}>
                        <InfoDetail label="Origen" value={capa.source ? CAPA_SOURCES.find(s => s.id === capa.source)?.name : '-'} />
                        <InfoDetail label="Responsable" value={capa.responsible || '-'} />
                        <InfoDetail label="Prioridad" value={<span style={{ color: priorityConfig.color, fontWeight: 900 }}>{priorityConfig.icon} {priorityConfig.label}</span>} />
                        <InfoDetail label="Fecha Límite" value={capa.dueDate ? new Date(capa.dueDate).toLocaleDateString('es-AR') : '-'} />
                        {isOverdue && <InfoDetail label="Estado" value={<span style={{ color: '#dc2626', fontWeight: 900 }}>⚠️ VENCIDA</span>} />}
                    </div>

                    {/* Problem Statement */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>Declaración del Problema</h3>
                        <div style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.12)', borderRadius: 'var(--radius-xl)' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.6, fontWeight: 600 }}>{capa.problemStatement || 'No especificado'}</p>
                        </div>
                    </div>

                    {/* Root Cause Analysis (5 Whys Preview) */}
                    {capa.rootCause && (capa.rootCause.why1 || capa.rootCause.finalCause) && (
                        <div style={{ marginBottom: '1.75rem' }}>
                            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>Análisis de Causa Raíz (5 Porqués)</h3>
                            <div className="capa-why-container">
                                <div className="capa-why-timeline" />
                                {[1, 2, 3, 4, 5].map(num => capa.rootCause[`why${num}`] && (
                                    <div key={num} className="capa-why-node">
                                        <div className="capa-why-badge">{num}</div>
                                        <div style={{ fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.7rem', marginBottom: '0.15rem' }}>{num}° Porqué</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>{capa.rootCause[`why${num}`]}</div>
                                    </div>
                                ))}
                                {capa.rootCause.finalCause && (
                                    <div className="capa-why-node capa-why-final-container" style={{ marginTop: '0.5rem' }}>
                                        <div className="capa-why-badge" style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }}>✓</div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.15rem', letterSpacing: '0.5px' }}>Causa Raíz Final</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)' }}>{capa.rootCause.finalCause}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {capa.actions && capa.actions.length > 0 && (
                        <div style={{ marginBottom: '1.75rem' }}>
                            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>Acciones del Plan ({capa.actions.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {capa.actions.map((action, idx) => (
                                    <div key={action.id} style={{ padding: '0.85rem 1.25rem', background: action.status === 'completed' ? 'rgba(16, 185, 129, 0.04)' : 'var(--color-background)', border: `1px solid ${action.status === 'completed' ? '#10b981' : 'var(--glass-border-subtle)'}`, borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '28px', height: '28px', background: action.status === 'completed' ? '#10b981' : 'rgba(var(--color-primary-rgb), 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', color: action.status === 'completed' ? '#fff' : 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 900, flexShrink: 0, justifyContent: 'center' }}>{idx + 1}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{action.description}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Responsable: {action.responsible || 'N/A'} • Vence: {action.dueDate ? new Date(action.dueDate).toLocaleDateString('es-AR') : 'N/A'}</div>
                                            </div>
                                            <span style={{ padding: '0.25rem 0.6rem', background: action.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: action.status === 'completed' ? '#10b981' : '#f59e0b', borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: 900, border: `1px solid ${action.status === 'completed' ? '#10b98130' : '#f59e0b30'}` }}>{action.status === 'completed' ? 'COMPLETADA' : 'PENDIENTE'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    {capa.timeline && capa.timeline.length > 0 && (
                        <div style={{ marginBottom: '1.75rem' }}>
                            <button onClick={() => setShowTimeline(!showTimeline)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.85rem', outline: 'none' }}>
                                <Clock size={16} />
                                <span>{showTimeline ? 'Ocultar' : 'Ver'} Historial del Proceso ({capa.timeline.length})</span>
                            </button>
                            {showTimeline && (
                                <div style={{ marginTop: '0.75rem', padding: '1.25rem', background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)', borderRadius: 'var(--radius-xl)' }}>
                                    {capa.timeline.map((event, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: idx < capa.timeline.length - 1 ? '1px solid var(--glass-border-subtle)' : 'none' }}>
                                            <div style={{ width: '10px', height: '10px', background: 'var(--color-primary)', borderRadius: '50%', marginTop: '5px', flexShrink: 0, boxShadow: '0 0 8px var(--color-primary)' }} />
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{event.event}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{new Date(event.date).toLocaleString()} • {event.user}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Change Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '1.5rem' }}>
                        {capa.status === 'draft' && <button onClick={() => onUpdateStatus(capa.id, 'open')} className="btn-primary" style={{ flex: 'auto', margin: 0, padding: '0.75rem 1.25rem', fontWeight: 800 }}>Abrir CAPA</button>}
                        {capa.status === 'open' && <button onClick={() => onUpdateStatus(capa.id, 'in_progress')} className="btn-primary" style={{ flex: 'auto', margin: 0, padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', fontWeight: 800 }}>Iniciar</button>}
                        {capa.status === 'in_progress' && <button onClick={() => onUpdateStatus(capa.id, 'review')} className="btn-primary" style={{ flex: 'auto', margin: 0, padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', fontWeight: 800 }}>Enviar a Revisión</button>}
                        {capa.status === 'review' && <button onClick={() => onUpdateStatus(capa.id, 'completed')} className="btn-primary" style={{ flex: 'auto', margin: 0, padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #16a34a, #059669)', fontWeight: 800 }}>Completar</button>}
                        {capa.status === 'completed' && <button onClick={() => onUpdateStatus(capa.id, 'closed')} className="btn-primary" style={{ flex: 'auto', margin: 0, padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #059669, #047857)', fontWeight: 800 }}>Cerrar CAPA</button>}
                    </div>

                    <button onClick={onClose} style={{ width: '100%', padding: '0.85rem', background: 'var(--color-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>Cerrar Vista</button>
                </div>
            </div>
        </div>
    );
}

// Modal de Acción
function CreateActionModal({ capa, onSave, onClose, CONTROL_HIERARCHY }) {
    const [action, setAction] = useState({ description: '', responsible: '', dueDate: '', controlType: '', expectedResult: '' });

    return (
        <div className="modal-fullscreen-overlay modal-overlay-glass" onClick={onClose}>
            <div className="modal-fullscreen-content modal-glass" style={{ maxWidth: '580px', padding: '2rem', border: '1px solid var(--glass-border)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border-subtle)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} color="var(--color-primary)" />
                        Nueva Acción en Plan
                    </h2>
                    <button onClick={onClose} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.08)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={20} /></button>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Descripción de la Acción *</label>
                    <textarea value={action.description} onChange={(e) => setAction({ ...action, description: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, minHeight: '80px', background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)', paddingTop: '0.75rem' }} placeholder="Describí la acción a implementar..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                        <label style={labelStyle}>Responsable</label>
                        <input type="text" value={action.responsible} onChange={(e) => setAction({ ...action, responsible: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)' }} />
                    </div>
                    <div>
                        <label style={labelStyle}>Fecha Límite</label>
                        <input type="date" value={action.dueDate} onChange={(e) => setAction({ ...action, dueDate: e.target.value })} className="capa-focus-glow" style={{ ...inputStyle, background: 'var(--color-background)', border: '1px solid var(--glass-border-subtle)' }} />
                    </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Tipo de Control (Jerarquía)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {CONTROL_HIERARCHY.map(ctrl => {
                            const isActive = action.controlType === ctrl.id;
                            return (
                                <button 
                                    key={ctrl.id} 
                                    onClick={() => setAction({ ...action, controlType: ctrl.id })} 
                                    style={{ 
                                        padding: '0.6rem 0.4rem', 
                                        background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-background)', 
                                        border: `1.5px solid ${isActive ? '#10b981' : 'var(--glass-border-subtle)'}`, 
                                        borderRadius: 'var(--radius-xl)', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        gap: '0.25rem',
                                        transition: 'all 0.2s',
                                        boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                                    }}
                                >
                                    <span style={{ fontSize: '1.4rem' }}>{ctrl.icon}</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: isActive ? '#10b981' : 'var(--color-text-muted)' }}>{ctrl.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '1.25rem' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-muted)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>Cancelar</button>
                    <button onClick={() => onSave(action)} className="btn-primary" style={{ flex: 1, margin: 0, padding: '0.85rem', fontWeight: 800 }}>Agregar Acción</button>
                </div>
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

