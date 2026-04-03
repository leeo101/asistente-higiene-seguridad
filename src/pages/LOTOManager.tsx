import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Lock, Key, AlertTriangle, Plus, Search,
    FileText, Eye, Edit3, Trash2, CheckCircle2,
    XCircle, Clock, User, Calendar,
    Shield, Zap, Settings, AlertCircle,
    TrendingUp, BarChart3, Activity, Share2
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import LOTOPdf from '../components/LOTOPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';

// Tipos de energía según OSHA 1910.147
const ENERGY_TYPES = [
    { id: 'electrical', name: 'Eléctrica', icon: '⚡', color: '#fbbf24' },
    { id: 'mechanical', name: 'Mecánica', icon: '🔧', color: '#6b7280' },
    { id: 'hydraulic', name: 'Hidráulica', icon: '💧', color: '#3b82f6' },
    { id: 'pneumatic', name: 'Neumática', icon: '💨', color: '#9ca3af' },
    { id: 'chemical', name: 'Química', icon: '🧪', color: '#10b981' },
    { id: 'thermal', name: 'Térmica', icon: '🔥', color: '#ef4444' },
    { id: 'gravitational', name: 'Gravitacional', icon: '⬇️', color: '#8b5cf6' },
    { id: 'radiation', name: 'Radiación', icon: '☢️', color: '#f59e0b' }
];

// Tipos de dispositivos LOTO
const LOTO_DEVICES = [
    { id: 'padlock', name: 'Candado', icon: '🔒' },
    { id: 'hasp', name: 'Grampa Múltiple', icon: '📎' },
    { id: 'breaker_lock', name: 'Bloqueo Interruptor', icon: '⚡' },
    { id: 'valve_lock', name: 'Bloqueo Válvula', icon: '🔩' },
    { id: 'plug_lock', name: 'Bloqueo Enchufe', icon: '🔌' },
    { id: 'tagout', name: 'Etiqueta', icon: '🏷️' }
];

// Estados de un procedimiento LOTO
const LOTO_STATUS = {
    active: { label: 'ACTIVO', color: '#16a34a', bg: '#f0fdf4' },
    pending: { label: 'PENDIENTE', color: '#f59e0b', bg: '#fffbeb' },
    completed: { label: 'COMPLETADO', color: '#3b82f6', bg: '#eff6ff' },
    suspended: { label: 'SUSPENDIDO', color: '#6b7280', bg: '#f3f4f6' },
    emergency: { label: 'EMERGENCIA', color: '#dc2626', bg: '#fef2f2' }
};

// Pasos del procedimiento LOTO (OSHA 1910.147)
const LOTO_STEPS = [
    { id: 1, name: 'Preparación', description: 'Identificar equipos y energías' },
    { id: 2, name: 'Notificación', description: 'Informar a personal afectado' },
    { id: 3, name: 'Apagado', description: 'Detener equipo normalmente' },
    { id: 4, name: 'Aislamiento', description: 'Bloquear fuentes de energía' },
    { id: 5, name: 'LOTO', description: 'Colocar candados y etiquetas' },
    { id: 6, name: 'Disipación', description: 'Liberar energía residual' },
    { id: 7, name: 'Verificación', description: 'Confirmar aislamiento (Try-out)' }
];

// Pasos de reactivación
const REACTIVATION_STEPS = [
    { id: 1, name: 'Inspección', description: 'Verificar equipo y área' },
    { id: 2, name: 'Remoción LOTO', description: 'Quitar candados y etiquetas' },
    { id: 3, name: 'Notificación', description: 'Informar al personal' },
    { id: 4, name: 'Reactivación', description: 'Restaurar energía' }
];

export default function LOTOManager(): React.ReactElement | null {
    const navigate = useNavigate();
    const [procedures, setProcedures] = useState<any[]>([]);
    const [activeLOTOs, setActiveLOTOs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedProcedure, setSelectedProcedure] = useState(null);
    const [activeTab, setActiveTab] = useState('procedures');
    const [shareItem, setShareItem] = useState(null);

    const [newProcedure, setNewProcedure] = useState({
        id: '',
        equipmentName: '',
        equipmentId: '',
        location: '',
        department: '',
        energyTypes: [],
        lotoDevices: [],
        authorizedWorkers: [],
        steps: LOTO_STEPS.map(s => ({ ...s, completed: false, completedBy: '', completedAt: '' })),
        reactivationSteps: REACTIVATION_STEPS.map(s => ({ ...s, completed: false })),
        status: 'pending',
        createdAt: '',
        startedAt: '',
        completedAt: '',
        observations: '',
        photos: []
    });

    useEffect(() => {
        const loadData = () => {
            const savedProcedures = localStorage.getItem('loto_procedures_db');
            const savedActiveLOTOs = localStorage.getItem('loto_active_db');
            if (savedProcedures) setProcedures(JSON.parse(savedProcedures));
            if (savedActiveLOTOs) setActiveLOTOs(JSON.parse(savedActiveLOTOs));
        };

        loadData();

        const handleStorageChange = (e) => {
            if (e.key === 'loto_procedures_db' || e.key === 'loto_active_db') {
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

    const saveProcedures = (data) => {
        localStorage.setItem('loto_procedures_db', JSON.stringify(data));
        setProcedures(data);
    };

    const saveActiveLOTOs = (data) => {
        localStorage.setItem('loto_active_db', JSON.stringify(data));
        setActiveLOTOs(data);
    };

    const handleCreateProcedure = () => {
        navigate('/loto/new');
    };

    const resetForm = () => {
        setNewProcedure({
            id: '',
            equipmentName: '',
            equipmentId: '',
            location: '',
            department: '',
            energyTypes: [],
            lotoDevices: [],
            authorizedWorkers: [],
            steps: LOTO_STEPS.map(s => ({ ...s, completed: false, completedBy: '', completedAt: '' })),
            reactivationSteps: REACTIVATION_STEPS.map(s => ({ ...s, completed: false })),
            status: 'pending',
            createdAt: '',
            startedAt: '',
            completedAt: '',
            observations: '',
            photos: []
        });
    };

    const startLOTO = (procedureId) => {
        const procedure = procedures.find(p => p.id === procedureId);
        if (!procedure) return;

        const activeLOTO = {
            ...procedure,
            startedAt: new Date().toISOString(),
            status: 'active'
        };

        const updatedProcedures = procedures.map(p => 
            p.id === procedureId ? { ...p, status: 'active' } : p
        );
        saveProcedures(updatedProcedures);

        const updatedActive = [activeLOTO, ...activeLOTOs];
        saveActiveLOTOs(updatedActive);
    };

    const completeLOTO = (procedureId) => {
        const updatedProcedures = procedures.map(p => 
            p.id === procedureId ? { 
                ...p, 
                status: 'completed',
                completedAt: new Date().toISOString()
            } : p
        );
        saveProcedures(updatedProcedures);

        const updatedActive = activeLOTOs.filter(l => l.id !== procedureId);
        saveActiveLOTOs(updatedActive);
    };

    const deleteProcedure = (id) => {
        if (confirm('¿Eliminar este procedimiento LOTO?')) {
            saveProcedures(procedures.filter(p => p.id !== id));
            saveActiveLOTOs(activeLOTOs.filter(l => l.id !== id));
        }
    };

    const filteredProcedures = procedures.filter(p => {
        const matchesSearch = p.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.department?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Estadísticas
    const stats = {
        total: procedures.length,
        active: activeLOTOs.length,
        pending: procedures.filter(p => p.status === 'pending').length,
        completed: procedures.filter(p => p.status === 'completed').length,
        energyTypes: procedures.reduce((acc, p) => {
            p.energyTypes?.forEach(et => {
                acc[et] = (acc[et] || 0) + 1;
            });
            return acc;
        }, {})
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Procedimiento LOTO - ${shareItem?.equipmentName || ''}`}
                text={shareItem ? `🔒 Procedimiento LOTO\n⚙️ Equipo: ${shareItem.equipmentName}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${new Date(shareItem.createdAt).toLocaleDateString('es-AR')}` : ''}
                rawMessage={shareItem ? `🔒 Procedimiento LOTO\n⚙️ Equipo: ${shareItem.equipmentName}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${new Date(shareItem.createdAt).toLocaleDateString('es-AR')}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`LOTO_${shareItem?.equipmentName || 'Procedimiento'}.pdf`}
            />

            <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
                {shareItem && <LOTOPdf data={shareItem} />}
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
                        background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)'
                    }}>
                        <Lock size={32} color="#ffffff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '1.5rem', 
                            fontWeight: 900,
                            color: 'var(--color-text)',
                            letterSpacing: '-0.5px'
                        }}>
                            Lockout/Tagout (LOTO)
                        </h1>
                        <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            OSHA 1910.147 • {activeLOTOs.length} activos
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/loto/new')}
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
                        Nuevo Procedimiento
                    </button>
                    <button
                        onClick={() => navigate('/loto/history')}
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
                    icon={<FileText size={24} />}
                    label="Total Procedimientos"
                    value={stats.total}
                    color="#3B82F6"
                    gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
                />
                <StatCard 
                    icon={<Lock size={24} />}
                    label="LOTO Activos"
                    value={stats.active}
                    color="#16a34a"
                    gradient="linear-gradient(135deg, #16a34a, #059669)"
                />
                <StatCard 
                    icon={<Clock size={24} />}
                    label="Pendientes"
                    value={stats.pending}
                    color="#f59e0b"
                    gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                />
                <StatCard 
                    icon={<CheckCircle2 size={24} />}
                    label="Completados"
                    value={stats.completed}
                    color="#8b5cf6"
                    gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
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
                    active={activeTab === 'procedures'}
                    onClick={() => setActiveTab('procedures')}
                    icon={<FileText size={18} />}
                    label="Procedimientos"
                    count={procedures.length}
                />
                <TabButton 
                    active={activeTab === 'active'}
                    onClick={() => setActiveTab('active')}
                    icon={<Lock size={18} />}
                    label="LOTO Activos"
                    count={activeLOTOs.length}
                    badge={activeLOTOs.length}
                />
                <TabButton 
                    active={activeTab === 'energy'}
                    onClick={() => setActiveTab('energy')}
                    icon={<Zap size={18} />}
                    label="Tipos de Energía"
                />
            </div>

            {/* Content by Tab */}
            {activeTab === 'procedures' && (
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
                                placeholder="Buscar por equipo, ubicación, departamento..."
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
                            {Object.entries(LOTO_STATUS).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Procedures List */}
                    {filteredProcedures.length === 0 ? (
                        <EmptyStateIllustrated 
                            title="Sin Procedimientos LOTO"
                            description="Creá procedimientos de Lockout/Tagout según OSHA 1910.147 para control de energías peligrosas."
                            onAction={() => setShowAddModal(true)}
                            icon={<Lock />}
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredProcedures.map(procedure => (
                                <ProcedureCard 
                                    key={procedure.id}
                                    procedure={procedure}
                                    statusConfig={LOTO_STATUS[procedure.status] || LOTO_STATUS.pending}
                                    onStart={() => startLOTO(procedure.id)}
                                    onComplete={() => completeLOTO(procedure.id)}
                                    onView={() => setSelectedProcedure(procedure)}
                                    onEdit={() => navigate('/loto/new', { state: { editData: procedure } })}
                                    onShare={() => setShareItem(procedure)}
                                    onDelete={() => deleteProcedure(procedure.id)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'active' && (
                <ActiveLOTOList 
                    activeLOTOs={activeLOTOs}
                    onComplete={completeLOTO}
                    onView={setSelectedProcedure}
                />
            )}

            {activeTab === 'energy' && (
                <EnergyTypesPanel stats={stats} ENERGY_TYPES={ENERGY_TYPES} />
            )}

            {/* Modal de Crear Procedimiento */}
            {showAddModal && (
                <CreateProcedureModal 
                    procedure={newProcedure}
                    setProcedure={setNewProcedure}
                    onSave={handleCreateProcedure}
                    onClose={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}
                    ENERGY_TYPES={ENERGY_TYPES}
                    LOTO_DEVICES={LOTO_DEVICES}
                    LOTO_STEPS={LOTO_STEPS}
                />
            )}

            {/* Modal de Detalle */}
            {selectedProcedure && (
                <ProcedureDetailModal 
                    procedure={selectedProcedure}
                    statusConfig={LOTO_STATUS[selectedProcedure.status] || LOTO_STATUS.pending}
                    onClose={() => setSelectedProcedure(null)}
                    ENERGY_TYPES={ENERGY_TYPES}
                    LOTO_DEVICES={LOTO_DEVICES}
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

function TabButton({ active, onClick, icon, label, count, badge }: any) {
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
            {badge > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 900
                }}>
                    {badge}
                </span>
            )}
        </button>
    );
}

function ProcedureCard({ procedure, statusConfig, onStart, onComplete, onView, onEdit, onShare, onDelete }) {
    return (
        <div className="card" style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all var(--transition-fast)',
            borderLeft: `4px solid ${statusConfig.color}`
        }}>
            {/* Icono de estado */}
            <div style={{
                width: '56px',
                height: '56px',
                background: `${statusConfig.color}15`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <Lock size={28} color={statusConfig.color} strokeWidth={2.5} />
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
                        {procedure.equipmentName}
                    </h3>
                    <span style={{
                        padding: '0.35rem 0.75rem',
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        flexShrink: 0
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
                        <Settings size={14} />
                        {procedure.location || 'Sin ubicación'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Zap size={14} />
                        {procedure.energyTypes?.length || 0} energías
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} />
                        {new Date(procedure.createdAt).toLocaleDateString('es-AR')}
                    </span>
                </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {procedure.status === 'pending' && (
                    <button
                        onClick={onStart}
                        style={{
                            padding: '0.6rem 0.75rem',
                            background: '#16a34a',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            transition: 'all var(--transition-fast)'
                        }}
                        title="Iniciar LOTO"
                    >
                        <Lock size={18} />
                    </button>
                )}
                {procedure.status === 'active' && (
                    <button
                        onClick={onComplete}
                        style={{
                            padding: '0.6rem 0.75rem',
                            background: '#3b82f6',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            transition: 'all var(--transition-fast)'
                        }}
                        title="Completar LOTO"
                    >
                        <CheckCircle2 size={18} />
                    </button>
                )}
                <button
                    onClick={onEdit}
                    style={{
                        padding: '0.6rem 0.75rem',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--color-primary)',
                        transition: 'all var(--transition-fast)'
                    }}
                    title="Editar Procedimiento"
                >
                    <Edit3 size={18} />
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



function ActiveLOTOList({ activeLOTOs, onComplete, onView }) {
    if (activeLOTOs.length === 0) {
        return (
            <EmptyStateIllustrated 
                title="Sin LOTOs Activos"
                description="Todos los procedimientos están completados o no hay ninguno iniciado actualmente."
                icon={<CheckCircle2 />}
                color="#16a34a"
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeLOTOs.map(loto => (
                <div key={loto.id} className="card" style={{
                    padding: '1.25rem',
                    border: '2px solid #16a34a',
                    background: '#f0fdf4'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'linear-gradient(135deg, #16a34a, #059669)',
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            flexShrink: 0,
                            animation: 'pulse 2s infinite'
                        }}>
                            <Lock size={32} strokeWidth={2.5} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>
                                {loto.equipmentName}
                            </h3>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                {loto.location} • Iniciado: {new Date(loto.startedAt).toLocaleString()}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                {loto.energyTypes?.map(et => {
                                    const energyType = ENERGY_TYPES.find(e => e.id === et);
                                    return (
                                        <span key={et} style={{
                                            padding: '0.35rem 0.65rem',
                                            background: `${energyType?.color}20`,
                                            color: energyType?.color,
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}>
                                            <span>{energyType?.icon}</span>
                                            {energyType?.name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => onView(loto)}
                                className="btn-outline"
                                style={{ padding: '0.6rem 0.75rem' }}
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                onClick={() => onComplete(loto.id)}
                                className="btn-primary"
                                style={{ 
                                    width: 'auto', 
                                    margin: 0, 
                                    padding: '0.6rem 1rem',
                                    background: 'linear-gradient(135deg, #16a34a, #059669)'
                                }}
                            >
                                <CheckCircle2 size={18} style={{ marginRight: '0.35rem' }} />
                                Completar
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EnergyTypesPanel({ stats, ENERGY_TYPES }) {
    const maxCount = Math.max(...(Object.values(stats.energyTypes || { default: 1 }) as any[]), 1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    Energía por Tipo
                </h3>
                {Object.entries(stats.energyTypes || {}).length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                        No hay datos registrados
                    </p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {Object.entries(stats.energyTypes).map(([typeId, count]) => {
                            const energyType = ENERGY_TYPES.find(e => e.id === typeId);
                            const percentage = ((count as any) / maxCount) * 100;
                            
                            return (
                                <div key={typeId} style={{
                                    padding: '1rem',
                                    background: `${energyType?.color}10`,
                                    border: `1px solid ${energyType?.color}30`,
                                    borderRadius: 'var(--radius-lg)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '2rem' }}>{energyType?.icon}</span>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: energyType?.color, textTransform: 'uppercase' }}>
                                                {energyType?.name}
                                            </div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text)' }}>
                                                {count as any}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        height: '6px',
                                        background: `${energyType?.color}30`,
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            height: '100%',
                                            background: energyType?.color,
                                            borderRadius: '3px',
                                            transition: 'width var(--transition-base)'
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Referencia de tipos de energía */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    Tipos de Energía (OSHA 1910.147)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {ENERGY_TYPES.map(type => (
                        <div key={type.id} style={{
                            padding: '0.75rem',
                            background: `${type.color}10`,
                            border: `1px solid ${type.color}30`,
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center'
                        }}>
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>{type.icon}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                {type.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Modal de Crear Procedimiento
function CreateProcedureModal({ procedure, setProcedure, onSave, onClose, ENERGY_TYPES, LOTO_DEVICES, LOTO_STEPS }) {
    const toggleEnergyType = (typeId) => {
        const current = procedure.energyTypes || [];
        const updated = current.includes(typeId)
            ? current.filter(t => t !== typeId)
            : [...current, typeId];
        setProcedure({ ...procedure, energyTypes: updated });
    };

    const toggleLOTODevice = (deviceId) => {
        const current = procedure.lotoDevices || [];
        const updated = current.includes(deviceId)
            ? current.filter(d => d !== deviceId)
            : [...current, deviceId];
        setProcedure({ ...procedure, lotoDevices: updated });
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
                        Nuevo Procedimiento LOTO
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
                    {/* Equipo */}
                    <div>
                        <label style={labelStyle}>Nombre del Equipo *</label>
                        <input
                            type="text"
                            value={procedure.equipmentName}
                            onChange={(e) => setProcedure({ ...procedure, equipmentName: e.target.value })}
                            style={{ ...inputStyle, boxSizing: 'border-box' } as any}
                            placeholder="Ej: Compresor Principal"
                        />
                    </div>

                    {/* ID Equipo */}
                    <div>
                        <label style={labelStyle}>ID Equipo</label>
                        <input
                            type="text"
                            value={procedure.equipmentId}
                            onChange={(e) => setProcedure({ ...procedure, equipmentId: e.target.value })}
                            style={{ ...inputStyle, boxSizing: 'border-box' } as any}
                            placeholder="Ej: COMP-001"
                        />
                    </div>

                    {/* Ubicación */}
                    <div>
                        <label style={labelStyle}>Ubicación</label>
                        <input
                            type="text"
                            value={procedure.location}
                            onChange={(e) => setProcedure({ ...procedure, location: e.target.value })}
                            style={{ ...inputStyle, boxSizing: 'border-box' } as any}
                            placeholder="Ej: Sala de Máquinas"
                        />
                    </div>

                    {/* Departamento */}
                    <div>
                        <label style={labelStyle}>Departamento</label>
                        <input
                            type="text"
                            value={procedure.department}
                            onChange={(e) => setProcedure({ ...procedure, department: e.target.value })}
                            style={{ ...inputStyle, boxSizing: 'border-box' } as any}
                            placeholder="Ej: Mantenimiento"
                        />
                    </div>
                </div>

                {/* Tipos de Energía */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Tipos de Energía a Aislar</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                        {ENERGY_TYPES.map(type => (
                            <button
                                key={type.id}
                                onClick={() => toggleEnergyType(type.id)}
                                style={{
                                    padding: '0.75rem',
                                    background: procedure.energyTypes?.includes(type.id) 
                                        ? `${type.color}20` 
                                        : 'var(--color-background)',
                                    border: `2px solid ${procedure.energyTypes?.includes(type.id) ? type.color : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                <span style={{ fontSize: '2rem' }}>{type.icon}</span>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700,
                                    color: procedure.energyTypes?.includes(type.id) ? type.color : 'var(--color-text-muted)'
                                }}>
                                    {type.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dispositivos LOTO */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Dispositivos LOTO Requeridos</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        {LOTO_DEVICES.map(device => (
                            <button
                                key={device.id}
                                onClick={() => toggleLOTODevice(device.id)}
                                style={{
                                    padding: '0.75rem',
                                    background: procedure.lotoDevices?.includes(device.id) 
                                        ? 'var(--color-primary)' 
                                        : 'var(--color-background)',
                                    color: procedure.lotoDevices?.includes(device.id) ? '#fff' : 'var(--color-text)',
                                    border: `2px solid ${procedure.lotoDevices?.includes(device.id) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 600,
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{device.icon}</span>
                                <span style={{ fontSize: '0.85rem' }}>{device.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pasos del Procedimiento */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Pasos del Procedimiento (OSHA 1910.147)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {LOTO_STEPS.map((step, idx) => (
                            <div key={step.id} style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: 'var(--color-primary)',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    fontSize: '0.9rem'
                                }}>
                                    {step.id}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{step.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{step.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Observaciones */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Observaciones Adicionales</label>
                    <textarea
                        value={procedure.observations}
                        onChange={(e) => setProcedure({ ...procedure, observations: e.target.value })}
                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' } as any}
                        placeholder="Información adicional sobre el procedimiento..."
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
                        Crear Procedimiento
                    </button>
                </div>
            </div>
        </div>
    );
}

// Modal de Detalle
function ProcedureDetailModal({ procedure, statusConfig, onClose, ENERGY_TYPES, LOTO_DEVICES }) {
    return (
        <div 
            className="modal-fullscreen-overlay"
            onClick={onClose}
        >
            <div 
                className="card"
                style={{
                    width: '100%',
                    maxWidth: '800px',
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
                            color: '#fff'
                        }}>
                            <Lock size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                                {procedure.equipmentName}
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                {procedure.location || 'Sin ubicación'} • {statusConfig.label}
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

                {/* Tipos de Energía */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Tipos de Energía
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {procedure.energyTypes?.map(typeId => {
                            const type = ENERGY_TYPES.find(t => t.id === typeId);
                            return (
                                <span key={typeId} style={{
                                    padding: '0.5rem 0.85rem',
                                    background: `${type?.color}20`,
                                    color: type?.color,
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                }}>
                                    <span>{type?.icon}</span>
                                    {type?.name}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Dispositivos LOTO */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Dispositivos LOTO
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {procedure.lotoDevices?.map(deviceId => {
                            const device = LOTO_DEVICES.find(d => d.id === deviceId);
                            return (
                                <span key={deviceId} style={{
                                    padding: '0.5rem 0.85rem',
                                    background: 'var(--color-background)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-lg)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                }}>
                                    <span>{device?.icon}</span>
                                    {device?.name}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Pasos LOTO */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Pasos del Procedimiento
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {LOTO_STEPS.map((step: any, idx) => (
                            <div key={step.id} style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                opacity: step.completed ? 0.6 : 1
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: step.completed ? '#16a34a' : 'var(--color-primary)',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    fontSize: '0.9rem'
                                }}>
                                    {step.completed ? <CheckCircle2 size={18} /> : step.id}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{step.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{step.description}</div>
                                    {step.completed && (
                                        <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>
                                            Completado por {step.completedBy} el {new Date(step.completedAt).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Información adicional */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <InfoDetail label="ID Equipo" value={procedure.equipmentId || '-'} />
                    <InfoDetail label="Departamento" value={procedure.department || '-'} />
                    <InfoDetail label="Creado" value={new Date(procedure.createdAt).toLocaleString()} />
                    {procedure.startedAt && (
                        <InfoDetail label="Iniciado" value={new Date(procedure.startedAt).toLocaleString()} />
                    )}
                    {procedure.completedAt && (
                        <InfoDetail label="Completado" value={new Date(procedure.completedAt).toLocaleString()} />
                    )}
                </div>

                {/* Observaciones */}
                {procedure.observations && (
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
                            {procedure.observations}
                        </p>
                    </div>
                )}

                {/* Alerta OSHA */}
                <div style={{
                    padding: '1rem',
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    gap: '0.75rem'
                }}>
                    <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>
                            OSHA 1910.147
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
                            Este procedimiento debe seguir estrictamente los requisitos de OSHA para el control de energía peligrosa (Lockout/Tagout).
                        </p>
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
    boxSizing: 'border-box'
};
