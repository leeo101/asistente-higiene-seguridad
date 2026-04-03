import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    HardHat, AlertTriangle, Plus, Search, 
    FileText, Eye, Edit3, Trash2, CheckCircle2, 
    XCircle, Clock, User, Users, Calendar,
    Shield, ArrowDown, Ruler, Anchor, CheckSquare,
    BarChart3, AlertCircle, Activity, Layers, Share2
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import WorkingAtHeightPdf from '../components/WorkingAtHeightPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import { usePaywall } from '../hooks/usePaywall';

// Límites según OSHA 1926.501 y normas internacionales
const HEIGHT_LIMITS = {
    general: { min: 1.8, unit: 'm', name: 'Altura General (OSHA)' },
    construction: { min: 1.8, unit: 'm', name: 'Construcción (OSHA 1926)' },
    scaffolding: { min: 3.0, unit: 'm', name: 'Andamios' },
    steel: { min: 2.4, unit: 'm', name: 'Estructuras de Acero' },
    ladder: { min: 1.2, unit: 'm', name: 'Escaleras Fijas' }
};

// Tipos de trabajo en altura
const WORK_TYPES = [
    { id: 'scaffolding', name: 'Andamios', icon: '🏗️' },
    { id: 'ladder', name: 'Escalera', icon: '🪜' },
    { id: 'roof', name: 'Techos', icon: '🏠' },
    { id: 'platform', name: 'Plataforma', icon: '📦' },
    { id: 'lift', name: 'Elevador/Aerial', icon: '⬆️' },
    { id: 'structure', name: 'Estructura', icon: '🔩' },
    { id: 'edge', name: 'Borde', icon: '⬇️' },
    { id: 'opening', name: 'Abertura', icon: '⭕' },
    { id: 'other', name: 'Otro', icon: '📍' }
];

// Equipamiento de protección contra caídas
const FALL_PROTECTION = [
    { id: 'harness', name: 'Arnés de Cuerpo', icon: '🦺', required: true },
    { id: 'lanyard', name: 'Cabo de Vida', icon: '🔗', required: true },
    { id: 'shock_absorber', name: 'Absorbedor Impacto', icon: '〰️', required: true },
    { id: 'anchor', name: 'Punto de Anclaje', icon: '🔩', required: true },
    { id: 'lifeline', name: 'Línea de Vida', icon: '➰', required: false },
    { id: 'retrieval', name: 'Sistema Rescate', icon: '🎣', required: false },
    { id: 'guardrail', name: 'Baranda', icon: '🚧', required: false },
    { id: 'net', name: 'Red de Seguridad', icon: '🕸️', required: false },
    { id: 'helmet', name: 'Casco con Barbiquejo', icon: '⛑️', required: true },
    { id: 'gloves', name: 'Guantes', icon: '🧤', required: true }
];

// Factores de riesgo
const RISK_FACTORS = [
    { id: 'wind', name: 'Viento Fuerte', icon: '💨', threshold: '≥ 40 km/h' },
    { id: 'rain', name: 'Lluvia', icon: '🌧️', threshold: 'Superficie mojada' },
    { id: 'ice', name: 'Hielo/Nieve', icon: '❄️', threshold: 'Superficie resbaladiza' },
    { id: 'heat', name: 'Calor Extremo', icon: '🔥', threshold: '≥ 35°C' },
    { id: 'night', name: 'Trabajo Nocturno', icon: '🌙', threshold: 'Visibilidad reducida' },
    { id: 'fatigue', name: 'Fatiga', icon: '😴', threshold: 'Turno extendido' },
    { id: 'height', name: 'Altura Elevada', icon: '📏', threshold: '≥ 6 metros' },
    { id: 'unstable', name: 'Superficie Inestable', icon: '⚠️', threshold: 'Base irregular' }
];

// Estados del permiso
const PERMIT_STATUS = {
    draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
    pending: { label: 'PENDIENTE', color: '#f59e0b', bg: '#fffbeb' },
    active: { label: 'ACTIVO', color: '#16a34a', bg: '#f0fdf4' },
    suspended: { label: 'SUSPENDIDO', color: '#dc2626', bg: '#fef2f2' },
    completed: { label: 'COMPLETADO', color: '#3b82f6', bg: '#eff6ff' },
    expired: { label: 'EXPIRADO', color: '#9ca3af', bg: '#f9fafb' }
};

export default function WorkingAtHeight(): React.ReactElement | null {
    const navigate = useNavigate();
    const [permits, setPermits] = useState([]);
    const [activePermits, setActivePermits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPermit, setSelectedPermit] = useState(null);
    const [activeTab, setActiveTab] = useState('permits');
    const [shareItem, setShareItem] = useState(null);
    const { isPro, requirePro } = usePaywall();

    const [newPermit, setNewPermit] = useState({
        id: '',
        workerName: '',
        workType: '',
        location: '',
        workDescription: '',
        height: '',
        duration: '',
        riskFactors: [],
        fallProtection: [],
        anchorPoints: [],
        rescuePlan: '',
        weatherCheck: false,
        equipmentCheck: false,
        training: false,
        supervisor: '',
        status: 'draft',
        validFrom: '',
        validUntil: '',
        createdAt: '',
        authorizedAt: '',
        completedAt: '',
        observations: ''
    });

    useEffect(() => {
        const loadData = () => {
            const savedPermits = localStorage.getItem('working_height_permits_db');
            const savedActive = localStorage.getItem('working_height_active_db');
            if (savedPermits) setPermits(JSON.parse(savedPermits));
            if (savedActive) setActivePermits(JSON.parse(savedActive));
        };

        loadData();

        const handleStorageChange = (e) => {
            if (e.key === 'working_height_permits_db' || e.key === 'working_height_active_db') {
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

    const savePermits = (data) => {
        localStorage.setItem('working_height_permits_db', JSON.stringify(data));
        setPermits(data);
    };

    const saveActivePermits = (data) => {
        localStorage.setItem('working_height_active_db', JSON.stringify(data));
        setActivePermits(data);
    };

    const handleCreatePermit = () => {
        navigate('/working-at-height/new');
    };

    const authorizePermit = (permitId) => {
        const p = permits.find(p => p.id === permitId);
        if (!p) return;

        const now = new Date().toISOString();
        const validUntil = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

        const authorizedPermit = {
            ...p,
            status: 'active',
            authorizedAt: now,
            validFrom: now,
            validUntil
        };

        const updatedPermits = permits.map(p => 
            p.id === permitId ? authorizedPermit : p
        );
        savePermits(updatedPermits);

        const updatedActive = [authorizedPermit, ...activePermits];
        saveActivePermits(updatedActive);
    };

    const suspendPermit = (permitId) => {
        const updatedPermits = permits.map(p => 
            p.id === permitId ? { ...p, status: 'suspended' } : p
        );
        savePermits(updatedPermits);
        saveActivePermits(activePermits.filter(p => p.id !== permitId));
    };

    const completePermit = (permitId) => {
        const updatedPermits = permits.map(p => 
            p.id === permitId ? { 
                ...p, 
                status: 'completed',
                completedAt: new Date().toISOString()
            } : p
        );
        savePermits(updatedPermits);
        saveActivePermits(activePermits.filter(p => p.id !== permitId));
    };

    const deletePermit = (id) => {
        if (confirm('¿Eliminar este permiso de trabajo en altura?')) {
            savePermits(permits.filter(p => p.id !== id));
            saveActivePermits(activePermits.filter(p => p.id !== id));
        }
    };

    const filteredPermits = permits.filter(p => {
        const matchesSearch = p.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.location?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Estadísticas
    const stats = {
        total: permits.length,
        active: activePermits.length,
        pending: permits.filter(p => p.status === 'pending').length,
        completed: permits.filter(p => p.status === 'completed').length,
        workTypes: permits.reduce((acc, p) => {
            if (p.workType) acc[p.workType] = (acc[p.workType] || 0) + 1;
            return acc;
        }, {}),
        avgHeight: permits.length > 0 
            ? (permits.reduce((sum, p) => sum + (parseFloat(p.height) || 0), 0) / permits.length).toFixed(1)
            : 0
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <ShareModal
                isOpen={!!shareItem}
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Permiso Altura - ${shareItem?.location || ''}`}
                text={shareItem ? `🧗 Permiso de Trabajo en Altura\n📍 Ubicación: ${shareItem.location}\n👷 Trabajador: ${shareItem.workerName}\n📅 Fecha: ${new Date(shareItem.createdAt || Date.now()).toLocaleDateString('es-AR')}` : ''}
                rawMessage={shareItem ? `🧗 Permiso de Trabajo en Altura\n📍 Ubicación: ${shareItem.location}\n👷 Trabajador: ${shareItem.workerName}\n📅 Fecha: ${new Date(shareItem.createdAt || Date.now()).toLocaleDateString('es-AR')}\n\nGenerado con Asistente H&S` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Altura_${shareItem?.location || 'Sin_Nombre'}.pdf`}
            />

            <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
                {shareItem && <WorkingAtHeightPdf data={shareItem} />}
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
                        <HardHat size={32} color="#ffffff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '1.5rem', 
                            fontWeight: 900,
                            color: 'var(--color-text)',
                            letterSpacing: '-0.5px'
                        }}>
                            Trabajo en Altura
                        </h1>
                        <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            OSHA 1926.501 • {activePermits.length} activos
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleCreatePermit}
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
                        Nuevo Permiso
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
                    label="Total Permisos"
                    value={stats.total}
                    color="#3B82F6"
                    gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
                />
                <StatCard 
                    icon={<CheckCircle2 size={24} />}
                    label="Trabajos Activos"
                    value={stats.active}
                    color="#16a34a"
                    gradient="linear-gradient(135deg, #16a34a, #059669)"
                />
                <StatCard 
                    icon={<Ruler size={24} />}
                    label="Altura Promedio"
                    value={`${stats.avgHeight}m`}
                    color="#f59e0b"
                    gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                />
                <StatCard 
                    icon={<CheckSquare size={24} />}
                    label="Completados"
                    value={stats.completed}
                    color="#8b5cf6"
                    gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                />
            </div>

            {/* Tabs — línea inferior estilo profesional */}
            <div className="tab-underline-container">
                <button
                    className={`tab-underline${activeTab === 'permits' ? ' active' : ''}`}
                    onClick={() => setActiveTab('permits')}
                >
                    <FileText size={16} />
                    Permisos
                    <span className="tab-count">{permits.length}</span>
                </button>
                <button
                    className={`tab-underline${activeTab === 'active' ? ' active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    <CheckCircle2 size={16} />
                    Activos
                    <span className="tab-count">{activePermits.length}</span>
                    {activePermits.length > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '8px',
                            height: '8px',
                            background: '#ef4444',
                            borderRadius: '50%',
                        }} />
                    )}
                </button>
                <button
                    className={`tab-underline${activeTab === 'limits' ? ' active' : ''}`}
                    onClick={() => setActiveTab('limits')}
                >
                    <Activity size={16} />
                    Límites de Seguridad
                </button>
            </div>


            {/* Content by Tab */}
            {activeTab === 'permits' && (
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
                                placeholder="Buscar por trabajador, ubicación..."
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
                            {Object.entries(PERMIT_STATUS).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Permits List */}
                    {filteredPermits.length === 0 ? (
                        <EmptyStateIllustrated 
                            title="Sin Permisos de Trabajo en Altura"
                            description="Todavía no hay permisos creados. Creá el primero para gestionar la seguridad según OSHA 1.8m."
                            onAction={handleCreatePermit}
                            icon={<HardHat />}
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredPermits.map(permit => (
                                <PermitCard 
                                    key={permit.id}
                                    permit={permit}
                                    statusConfig={PERMIT_STATUS[permit.status] || PERMIT_STATUS.draft}
                                    onAuthorize={() => authorizePermit(permit.id)}
                                    onSuspend={() => suspendPermit(permit.id)}
                                    onComplete={() => completePermit(permit.id)}
                                    onView={() => setSelectedPermit(permit)}
                                    onEdit={() => navigate('/working-at-height/new', { state: { editData: permit } })}
                                    onShare={() => requirePro(() => setShareItem(permit))}
                                    onDelete={() => deletePermit(permit.id)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'active' && (
                <ActivePermitsList 
                    activePermits={activePermits}
                    onComplete={completePermit}
                    onSuspend={suspendPermit}
                    onView={setSelectedPermit}
                    onShare={(permit) => requirePro(() => setShareItem(permit))}
                />
            )}

            {activeTab === 'limits' && (
                <HeightLimitsPanel limits={HEIGHT_LIMITS} fallProtection={FALL_PROTECTION} />
            )}

            {/* Modal de Detalle */}
            {selectedPermit && (
                <PermitDetailModal 
                    permit={selectedPermit}
                    statusConfig={PERMIT_STATUS[selectedPermit.status] || PERMIT_STATUS.draft}
                    onClose={() => setSelectedPermit(null)}
                    WORK_TYPES={WORK_TYPES}
                    FALL_PROTECTION={FALL_PROTECTION}
                    RISK_FACTORS={RISK_FACTORS}
                    HEIGHT_LIMITS={HEIGHT_LIMITS}
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

function PermitCard({ permit, statusConfig, onAuthorize, onSuspend, onComplete, onView, onEdit, onShare, onDelete }) {
    const workType = WORK_TYPES.find(t => t.id === permit.workType);
    const isExpired = permit.validUntil && new Date(permit.validUntil) < new Date();
    const heightRisk = parseFloat(permit.height) >= 6 ? 'high' : parseFloat(permit.height) >= 3 ? 'medium' : 'low';
    const riskColor = heightRisk === 'high' ? '#dc2626' : heightRisk === 'medium' ? '#f59e0b' : '#16a34a';

    return (
        <div className="card" style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all var(--transition-fast)',
            borderLeft: `4px solid ${isExpired ? '#9ca3af' : statusConfig.color}`
        }}>
            {/* Icono con altura */}
            <div style={{
                width: '64px',
                height: '64px',
                background: `${riskColor}15`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `2px solid ${riskColor}`
            }}>
                <ArrowDown size={20} color={riskColor} strokeWidth={2.5} />
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
                    {permit.height}m
                </span>
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
                        {workType?.icon} {permit.workerName}
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
                        {isExpired ? 'EXPIRADO' : statusConfig.label}
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
                        <HardHat size={14} />
                        {permit.location || 'Sin ubicación'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Shield size={14} />
                        {permit.fallProtection?.filter(p => p.checked).length || 0} EPPs
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} />
                        {permit.validUntil ? new Date(permit.validUntil).toLocaleDateString('es-AR') : '-'}
                    </span>
                </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {permit.status === 'pending' && (
                    <button
                        onClick={onAuthorize}
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
                        title="Autorizar Permiso"
                    >
                        <CheckCircle2 size={18} />
                    </button>
                )}
                {permit.status === 'active' && (
                    <>
                        <button
                            onClick={onSuspend}
                            style={{
                                padding: '0.6rem 0.75rem',
                                background: '#dc2626',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                transition: 'all var(--transition-fast)'
                            }}
                            title="Suspender Permiso"
                        >
                            <AlertTriangle size={18} />
                        </button>
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
                            title="Completar Permiso"
                        >
                            <CheckSquare size={18} />
                        </button>
                    </>
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
                    title="Editar Permiso"
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

function ActivePermitsList({ activePermits, onComplete, onSuspend, onView, onShare }) {
    if (activePermits.length === 0) {
        return (
            <EmptyStateIllustrated 
                title="Sin Trabajos Activos"
                description="No hay permisos en curso actualmente. Los permisos autorizados aparecerán aquí."
                icon={<CheckCircle2 />}
                color="#16a34a"
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activePermits.map(permit => {
                const workType = WORK_TYPES.find(t => t.id === permit.workType);
                const isExpired = permit.validUntil && (new Date(permit.validUntil) as any) < (new Date() as any);
                const timeRemaining = permit.validUntil 
                    ? Math.max(0, Math.floor(((new Date(permit.validUntil) as any) - (new Date() as any)) / (1000 * 60 * 60)))
                    : 0;
                const heightRisk = parseFloat(permit.height) >= 6 ? 'high' : parseFloat(permit.height) >= 3 ? 'medium' : 'low';
                const riskColor = heightRisk === 'high' ? '#dc2626' : heightRisk === 'medium' ? '#f59e0b' : '#16a34a';

                return (
                    <div key={permit.id} className="card" style={{
                        padding: '1.5rem',
                        border: isExpired ? '2px solid #9ca3af' : `2px solid ${riskColor}`,
                        background: isExpired ? '#f9fafb' : `${riskColor}05`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                background: isExpired 
                                    ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                                    : `linear-gradient(135deg, ${riskColor}, ${riskColor}cc)`,
                                borderRadius: 'var(--radius-xl)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                flexShrink: 0
                            }}>
                                <ArrowDown size={28} strokeWidth={2.5} />
                                <span style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>
                                    {permit.height}m
                                </span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>
                                        {workType?.icon} {permit.workerName}
                                    </h3>
                                    {isExpired && (
                                        <span style={{
                                            padding: '0.35rem 0.75rem',
                                            background: '#9ca3af',
                                            color: '#fff',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase'
                                        }}>
                                            EXPIRADO
                                        </span>
                                    )}
                                </div>
                                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    {permit.location} • Supervisor: {permit.supervisor || 'Sin asignar'}
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                    <span style={{
                                        padding: '0.35rem 0.65rem',
                                        background: '#3b82f6',
                                        color: '#fff',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.75rem',
                                        fontWeight: 700
                                    }}>
                                        <HardHat size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        {permit.workType ? WORK_TYPES.find(t => t.id === permit.workType)?.name : 'Sin tipo'}
                                    </span>
                                    {!isExpired && (
                                        <span style={{
                                            padding: '0.35rem 0.65rem',
                                            background: '#16a34a',
                                            color: '#fff',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            Vence en {timeRemaining}h
                                        </span>
                                    )}
                                    {permit.fallClearance && (
                                        <span style={{
                                            padding: '0.35rem 0.65rem',
                                            background: permit.fallClearance.safe ? '#16a34a' : '#dc2626',
                                            color: '#fff',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            <Anchor size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            Clearance: {permit.fallClearance.safe ? 'SEGURO' : 'INSUFICIENTE'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                <button
                                    onClick={() => onView(permit)}
                                    className="btn-outline"
                                    style={{ padding: '0.6rem 0.75rem' }}
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => onShare(permit)}
                                    className="btn-outline"
                                    style={{ 
                                        padding: '0.6rem 0.75rem',
                                        background: '#dcfce7',
                                        borderColor: '#86efac',
                                        color: '#16a34a'
                                    }}
                                >
                                    <Share2 size={18} />
                                </button>
                                <button
                                    onClick={() => onComplete(permit.id)}
                                    className="btn-primary"
                                    style={{ 
                                        width: 'auto', 
                                        margin: 0, 
                                        padding: '0.6rem 1rem',
                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                    }}
                                    disabled={isExpired}
                                >
                                    <CheckSquare size={18} style={{ marginRight: '0.35rem' }} />
                                    Completar
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function HeightLimitsPanel({ limits, fallProtection }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    <Activity size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Límites de Altura (OSHA 1926.501)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {Object.entries(limits).map(([key, limit]: [string, any]) => (
                        <div key={key} style={{
                            padding: '1.25rem',
                            background: '#eff6ff',
                            border: '1px solid #3b82f6',
                            borderRadius: 'var(--radius-xl)'
                        }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                {limit.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text)' }}>
                                    ≥ {limit.min}{limit.unit}
                                </span>
                            </div>
                            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                Protección contra caídas requerida
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Equipamiento requerido */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    <Shield size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Equipamiento de Protección Contra Caídas
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {fallProtection.filter(fp => fp.required).map(fp => (
                        <div key={fp.id} style={{
                            padding: '0.75rem',
                            background: '#f0fdf4',
                            border: '1px solid #16a34a',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <span style={{ fontSize: '2rem' }}>{fp.icon}</span>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                    {fp.name}
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                                    Obligatorio
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Factores de riesgo */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    <AlertTriangle size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Factores de Riesgo
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {RISK_FACTORS.map(factor => (
                        <div key={factor.id} style={{
                            padding: '0.75rem',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 'var(--radius-lg)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{factor.icon}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dc2626' }}>
                                    {factor.name}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {factor.threshold}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cálculo de fall clearance */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    <Ruler size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Cálculo de Distancia de Detención
                </h3>
                <div style={{
                    padding: '1rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-lg)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Longitud del Cabo (Lanyard):</span>
                            <strong>1.8 m</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Despliegue del Absorbedor:</span>
                            <strong>1.0 m</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Factor de Seguridad:</span>
                            <strong>0.6 m</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Altura del Trabajador:</span>
                            <strong>1.8 m</strong>
                        </div>
                        <div style={{ 
                            borderTop: '2px solid #3b82f6', 
                            paddingTop: '0.5rem',
                            marginTop: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '1.1rem'
                        }}>
                            <span style={{ fontWeight: 800 }}>Distancia Total Requerida:</span>
                            <strong style={{ color: '#16a34a', fontSize: '1.25rem' }}>5.2 m</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Modal de Crear Permiso
function CreatePermitModal({ permit, setPermit, onSave, onClose, WORK_TYPES, FALL_PROTECTION, RISK_FACTORS }) {
    const toggleRiskFactor = (factorId) => {
        const current = permit.riskFactors || [];
        const updated = current.includes(factorId)
            ? current.filter(f => f !== factorId)
            : [...current, factorId];
        setPermit({ ...permit, riskFactors: updated });
    };

    const toggleFallProtection = (equipId) => {
        const current = permit.fallProtection || [];
        const updated = current.includes(equipId)
            ? current.filter(e => e !== equipId)
            : [...current, equipId];
        setPermit({ ...permit, fallProtection: updated });
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
                        Nuevo Permiso de Trabajo en Altura
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
                    {/* Trabajador */}
                    <div>
                        <label style={labelStyle}>Nombre del Trabajador *</label>
                        <input
                            type="text"
                            value={permit.workerName}
                            onChange={(e) => setPermit({ ...permit, workerName: e.target.value })}
                            style={inputStyle}
                            placeholder="Nombre completo"
                        />
                    </div>

                    {/* Tipo de Trabajo */}
                    <div>
                        <label style={labelStyle}>Tipo de Trabajo</label>
                        <select
                            value={permit.workType}
                            onChange={(e) => setPermit({ ...permit, workType: e.target.value })}
                            style={{ ...inputStyle, boxSizing: 'border-box' } as any}
                        >
                            <option value="">Seleccionar tipo</option>
                            {WORK_TYPES.map(type => (
                                <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Ubicación */}
                    <div>
                        <label style={labelStyle}>Ubicación</label>
                        <input
                            type="text"
                            value={permit.location}
                            onChange={(e) => setPermit({ ...permit, location: e.target.value })}
                            style={{ ...inputStyle, boxSizing: 'border-box' } as any}
                            placeholder="Ej: Edificio A, Nivel 3"
                        />
                    </div>

                    {/* Altura */}
                    <div>
                        <label style={labelStyle}>Altura de Trabajo (metros) *</label>
                        <input
                            type="number"
                            step="0.1"
                            value={permit.height}
                            onChange={(e) => setPermit({ ...permit, height: e.target.value })}
                            style={{ ...inputStyle, boxSizing: 'border-box' } as any}
                            placeholder="Ej: 3.5"
                        />
                    </div>

                    {/* Duración */}
                    <div>
                        <label style={labelStyle}>Duración Estimada (horas)</label>
                        <input
                            type="number"
                            step="0.5"
                            value={permit.duration}
                            onChange={(e) => setPermit({ ...permit, duration: e.target.value })}
                            style={{ ...inputStyle, boxSizing: 'border-box' } as any}
                            placeholder="Ej: 4"
                        />
                    </div>

                    {/* Supervisor */}
                    <div>
                        <label style={labelStyle}>Supervisor Responsable</label>
                        <input
                            type="text"
                            value={permit.supervisor}
                            onChange={(e) => setPermit({ ...permit, supervisor: e.target.value })}
                            style={{ ...inputStyle, boxSizing: 'border-box' } as any}
                            placeholder="Nombre del supervisor"
                        />
                    </div>
                </div>

                {/* Descripción */}
                <div style={{ marginTop: '1rem' }}>
                    <label style={labelStyle}>Descripción del Trabajo</label>
                    <textarea
                        value={permit.workDescription}
                        onChange={(e) => setPermit({ ...permit, workDescription: e.target.value })}
                        style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                        placeholder="Describí el trabajo a realizar en altura..."
                    />
                </div>

                {/* Factores de Riesgo */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Factores de Riesgo Presentes</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                        {RISK_FACTORS.map(factor => (
                            <button
                                key={factor.id}
                                onClick={() => toggleRiskFactor(factor.id)}
                                style={{
                                    padding: '0.6rem',
                                    background: permit.riskFactors?.includes(factor.id) 
                                        ? '#fef2f2' 
                                        : 'var(--color-background)',
                                    border: `2px solid ${permit.riskFactors?.includes(factor.id) ? '#dc2626' : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>{factor.icon}</span>
                                <span style={{ 
                                    fontSize: '0.65rem', 
                                    fontWeight: 700,
                                    color: permit.riskFactors?.includes(factor.id) ? '#dc2626' : 'var(--color-text-muted)'
                                }}>
                                    {factor.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Equipamiento de Protección */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Equipamiento de Protección Contra Caídas</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {FALL_PROTECTION.map(fp => (
                            <label 
                                key={fp.id}
                                style={{
                                    padding: '0.6rem',
                                    background: permit.fallProtection?.includes(fp.id) ? '#f0fdf4' : 'var(--color-background)',
                                    border: `2px solid ${permit.fallProtection?.includes(fp.id) ? '#16a34a' : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={permit.fallProtection?.includes(fp.id)}
                                    onChange={() => toggleFallProtection(fp.id)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '1.25rem' }}>{fp.icon}</span>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 600,
                                    color: permit.fallProtection?.includes(fp.id) ? '#16a34a' : 'var(--color-text)'
                                }}>
                                    {fp.name}
                                    {fp.required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Verificaciones */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Verificaciones Previas</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <label style={{
                            padding: '0.75rem',
                            background: permit.weatherCheck ? '#f0fdf4' : 'var(--color-background)',
                            border: `2px solid ${permit.weatherCheck ? '#16a34a' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <input
                                type="checkbox"
                                checked={permit.weatherCheck}
                                onChange={(e) => setPermit({ ...permit, weatherCheck: e.target.checked })}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <div>
                                <span style={{ fontSize: '1.25rem' }}>🌤️</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                                    Clima Verificado
                                </span>
                            </div>
                        </label>
                        <label style={{
                            padding: '0.75rem',
                            background: permit.equipmentCheck ? '#f0fdf4' : 'var(--color-background)',
                            border: `2px solid ${permit.equipmentCheck ? '#16a34a' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <input
                                type="checkbox"
                                checked={permit.equipmentCheck}
                                onChange={(e) => setPermit({ ...permit, equipmentCheck: e.target.checked })}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <div>
                                <span style={{ fontSize: '1.25rem' }}>✓</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                                    Equipo Inspeccionado
                                </span>
                            </div>
                        </label>
                        <label style={{
                            padding: '0.75rem',
                            background: permit.training ? '#f0fdf4' : 'var(--color-background)',
                            border: `2px solid ${permit.training ? '#16a34a' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <input
                                type="checkbox"
                                checked={permit.training}
                                onChange={(e) => setPermit({ ...permit, training: e.target.checked })}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <div>
                                <span style={{ fontSize: '1.25rem' }}>📋</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                                    Trabajador Capacitado
                                </span>
                            </div>
                        </label>
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
                        Crear Permiso
                    </button>
                </div>
            </div>
        </div>
    );
}

// Modal de Detalle
function PermitDetailModal({ permit, statusConfig, onClose, WORK_TYPES, FALL_PROTECTION, RISK_FACTORS, HEIGHT_LIMITS }) {
    const workType = WORK_TYPES.find(t => t.id === permit.workType);
    const isExpired = permit.validUntil && new Date(permit.validUntil) < new Date();

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
                            background: `linear-gradient(135deg, ${isExpired ? '#9ca3af' : statusConfig.color}, ${isExpired ? '#6b7280' : statusConfig.color}cc)`,
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                        }}>
                            <ArrowDown size={24} strokeWidth={2.5} />
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>
                                {permit.height}m
                            </span>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                                {workType?.icon} {permit.workerName}
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                {permit.location || 'Sin ubicación'} • {isExpired ? 'EXPIRADO' : statusConfig.label}
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

                {/* Información del trabajo */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Información del Trabajo
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <InfoDetail label="Tipo" value={workType?.name || '-'} />
                        <InfoDetail label="Supervisor" value={permit.supervisor || '-'} />
                        <InfoDetail label="Duración" value={permit.duration ? `${permit.duration} horas` : '-'} />
                        <InfoDetail label="Válido Hasta" value={permit.validUntil ? new Date(permit.validUntil).toLocaleString() : '-'} />
                    </div>
                </div>

                {/* Factores de riesgo */}
                {permit.riskFactors?.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                            Factores de Riesgo
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {permit.riskFactors.map(factorId => {
                                const factor = RISK_FACTORS.find(f => f.id === factorId);
                                return (
                                    <span key={factorId} style={{
                                        padding: '0.5rem 0.85rem',
                                        background: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        color: '#dc2626',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                    }}>
                                        <span>{factor?.icon}</span>
                                        {factor?.name} ({factor?.threshold})
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Equipamiento */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Equipamiento de Protección
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {permit.fallProtection?.map(fpId => {
                            const fp = FALL_PROTECTION.find(f => f.id === fpId);
                            return (
                                <span key={fpId} style={{
                                    padding: '0.5rem',
                                    background: '#f0fdf4',
                                    border: '1px solid #16a34a',
                                    borderRadius: 'var(--radius-lg)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                }}>
                                    <span>{fp?.icon}</span>
                                    {fp?.name}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Fall clearance */}
                {permit.fallClearance && (
                    <div style={{
                        padding: '1rem',
                        background: permit.fallClearance.safe ? '#f0fdf4' : '#fef2f2',
                        border: `2px solid ${permit.fallClearance.safe ? '#16a34a' : '#dc2626'}`,
                        borderRadius: 'var(--radius-xl)',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 800, 
                            marginBottom: '0.75rem',
                            color: permit.fallClearance.safe ? '#16a34a' : '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Anchor size={18} />
                            ANÁLISIS DE FALL CLEARANCE
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    Distancia Requerida
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>
                                    {permit.fallClearance.required}m
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                    Distancia Disponible
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: permit.fallClearance.safe ? '#16a34a' : '#dc2626' }}>
                                    {permit.fallClearance.available}m
                                </div>
                            </div>
                        </div>
                        <div style={{
                            marginTop: '0.75rem',
                            padding: '0.5rem',
                            background: permit.fallClearance.safe ? '#16a34a' : '#dc2626',
                            color: '#fff',
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '0.9rem'
                        }}>
                            {permit.fallClearance.safe ? '✓ DISTANCIA DE DETENCIÓN SUFICIENTE' : '⚠️ DISTANCIA DE DETENCIÓN INSUFICIENTE - PELIGRO DE CAÍDA'}
                        </div>
                    </div>
                )}

                {/* Verificaciones */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                }}>
                    <CheckItem label="Clima Verificado" checked={permit.weatherCheck} />
                    <CheckItem label="Equipo Inspeccionado" checked={permit.equipmentCheck} />
                    <CheckItem label="Trabajador Capacitado" checked={permit.training} />
                </div>

                {/* Observaciones */}
                {permit.observations && (
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
                            {permit.observations}
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
                            OSHA 1926.501
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
                            Protección contra caídas requerida para trabajos ≥ 1.8m (6 pies). Verificar anclajes y equipo antes de comenzar.
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

function CheckItem({ label, checked }) {
    return (
        <div style={{
            padding: '0.75rem',
            background: checked ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${checked ? '#16a34a' : '#fecaca'}`,
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        }}>
            {checked ? (
                <CheckCircle2 size={18} color="#16a34a" />
            ) : (
                <XCircle size={18} color="#dc2626" />
            )}
            <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: 600,
                color: checked ? '#16a34a' : '#dc2626'
            }}>
                {label}
            </span>
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
