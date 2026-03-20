import React from 'react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
    Tent, AlertTriangle, Plus, Search, 
    FileText, Eye, Edit3, Trash2, CheckCircle2, 
    XCircle, Clock, User, Users, Calendar,
    Shield, Wind, Droplets, Thermometer, Activity,
    BarChart3, AlertCircle, CheckSquare, XSquare, Share2
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';

// Límites atmosféricos según OSHA 1910.146
const ATMOSPHERIC_LIMITS = {
    oxygen: { min: 19.5, max: 23.5, unit: '%', name: 'Oxígeno' },
    lel: { min: 0, max: 10, unit: '%', name: 'LEL (Inflamables)' },
    h2s: { min: 0, max: 10, unit: 'ppm', name: 'H2S (Sulfuro)' },
    co: { min: 0, max: 35, unit: 'ppm', name: 'CO (Monóxido)' },
    co2: { min: 0, max: 5000, unit: 'ppm', name: 'CO2 (Dióxido)' }
};

// Tipos de espacios confinados
const CONFINED_SPACE_TYPES = [
    { id: 'tank', name: 'Tanque', icon: '🛢️' },
    { id: 'vessel', name: 'Recipiente', icon: '📦' },
    { id: 'silo', name: 'Silo', icon: '🏭' },
    { id: 'pit', name: 'Fosa', icon: '⬇️' },
    { id: 'tunnel', name: 'Túnel', icon: '🚇' },
    { id: 'sewer', name: 'Alcantarilla', icon: '🕳️' },
    { id: 'manhole', name: 'Boca de Visita', icon: '⭕' },
    { id: 'other', name: 'Otro', icon: '📍' }
];

// Roles en espacio confinado (OSHA)
const ROLES = [
    { id: 'entrant', name: 'Entrante', icon: '👤', color: '#3b82f6' },
    { id: 'attendant', name: 'Vigía', icon: '👁️', color: '#f59e0b' },
    { id: 'supervisor', name: 'Supervisor', icon: '👔', color: '#16a34a' },
    { id: 'rescue', name: 'Rescate', icon: '🚑', color: '#dc2626' }
];

// Equipamiento requerido
const EQUIPMENT_CHECKLIST = [
    { id: 'gas_detector', name: 'Detector de Gases', icon: '💨', required: true },
    { id: 'harness', name: 'Arnés de Seguridad', icon: '🦺', required: true },
    { id: 'tripod', name: 'Trípode con Malacate', icon: '🏗️', required: true },
    { id: 'ventilator', name: 'Ventilador', icon: '💨', required: false },
    { id: 'radio', name: 'Radio Comunicación', icon: '📻', required: true },
    { id: 'light', name: 'Iluminación', icon: '💡', required: true },
    { id: 'scba', name: 'ERA (SCBA)', icon: '😷', required: false },
    { id: 'first_aid', name: 'Botiquín Primeros Auxilios', icon: '🏥', required: true },
    { id: 'fire_extinguisher', name: 'Extintor', icon: '🧯', required: true },
    { id: 'barrier', name: 'Barreras/Señalización', icon: '🚧', required: true }
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

// Hazards potenciales
const POTENTIAL_HAZARDS = [
    { id: 'atmospheric', name: 'Atmosférico Peligroso', icon: '💨' },
    { id: 'engulfment', name: 'Atrapamiento', icon: '🌊' },
    { id: 'configuration', name: 'Configuración', icon: '📐' },
    { id: 'electrical', name: 'Eléctrico', icon: '⚡' },
    { id: 'mechanical', name: 'Mecánico', icon: '🔧' },
    { id: 'thermal', name: 'Térmico', icon: '🔥' },
    { id: 'noise', name: 'Ruido', icon: '🔊' },
    { id: 'fall', name: 'Caída', icon: '⬇️' },
    { id: 'chemical', name: 'Químico', icon: '🧪' },
    { id: 'biological', name: 'Biológico', icon: '🦠' }
];

export default function ConfinedSpace(): React.ReactElement | null {
        const [permits, setPermits] = useState([]);
    const [activePermits, setActivePermits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPermit, setSelectedPermit] = useState(null);
    const [activeTab, setActiveTab] = useState('permits');
    const [showAtmosphericModal, setShowAtmosphericModal] = useState(false);
    const [currentPermitForReading, setCurrentPermitForReading] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    const [newPermit, setNewPermit] = useState({
        id: '',
        spaceName: '',
        spaceType: '',
        location: '',
        department: '',
        description: '',
        hazards: [],
        team: {
            entrants: [],
            attendant: '',
            supervisor: '',
            rescue: ''
        },
        equipment: EQUIPMENT_CHECKLIST.map(e => ({ ...e, checked: false })),
        atmosphericReadings: [],
        isolationPoints: [],
        rescueProcedure: '',
        communicationMethod: '',
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
            const savedPermits = localStorage.getItem('confined_space_permits_db');
            const savedActive = localStorage.getItem('confined_space_active_db');
            if (savedPermits) setPermits(JSON.parse(savedPermits));
            if (savedActive) setActivePermits(JSON.parse(savedActive));
        };

        loadData();

        const handleStorageChange = (e) => {
            if (e.key === 'confined_space_permits_db' || e.key === 'confined_space_active_db') {
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
        localStorage.setItem('confined_space_permits_db', JSON.stringify(data));
        setPermits(data);
    };

    const saveActivePermits = (data) => {
        localStorage.setItem('confined_space_active_db', JSON.stringify(data));
        setActivePermits(data);
    };

    const handleCreatePermit = () => {
        if (!newPermit.spaceName.trim()) return;
        
        const permit = {
            ...newPermit,
            id: `CS-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        const updated = [permit, ...permits];
        savePermits(updated);
        setShowAddModal(false);
        resetForm();
    };

    const resetForm = () => {
        setNewPermit({
            id: '',
            spaceName: '',
            spaceType: '',
            location: '',
            department: '',
            description: '',
            hazards: [],
            team: {
                entrants: [],
                attendant: '',
                supervisor: '',
                rescue: ''
            },
            equipment: EQUIPMENT_CHECKLIST.map(e => ({ ...e, checked: false })),
            atmosphericReadings: [],
            isolationPoints: [],
            rescueProcedure: '',
            communicationMethod: '',
            status: 'draft',
            validFrom: '',
            validUntil: '',
            createdAt: '',
            authorizedAt: '',
            completedAt: '',
            observations: ''
        });
    };

    const authorizePermit = (permitId) => {
                if (!permit) return;

        const now = new Date().toISOString();
        const validUntil = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 horas

        const authorizedPermit = {
            ...permit,
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
        if (confirm('¿Eliminar este permiso de espacio confinado?')) {
            savePermits(permits.filter(p => p.id !== id));
            saveActivePermits(activePermits.filter(p => p.id !== id));
        }
    };

    const addAtmosphericReading = (reading) => {
        const updatedPermit = {
            ...currentPermitForReading,
            atmosphericReadings: [...currentPermitForReading.atmosphericReadings, {
                ...reading,
                timestamp: new Date().toISOString(),
                status: evaluateAtmosphere(reading)
            }]
        };

        // Update in permits
        const updatedPermits = permits.map(p => 
            p.id === updatedPermit.id ? updatedPermit : p
        );
        savePermits(updatedPermits);

        // Update in active
        const updatedActive = activePermits.map(p => 
            p.id === updatedPermit.id ? updatedPermit : p
        );
        saveActivePermits(updatedActive);

        setCurrentPermitForReading(updatedPermit);
    };

    const evaluateAtmosphere = (reading) => {
        const limits = ATMOSPHERIC_LIMITS;
        
        if (reading.oxygen < limits.oxygen.min || reading.oxygen > limits.oxygen.max) return 'danger';
        if (reading.lel > limits.lel.max) return 'danger';
        if (reading.h2s > limits.h2s.max) return 'danger';
        if (reading.co > limits.co.max) return 'danger';
        
        if (reading.oxygen < 20.9 || reading.lel > 0 || reading.h2s > 0 || reading.co > 0) return 'warning';
        
        return 'safe';
    };

    const filteredPermits = permits.filter(p => {
        const matchesSearch = p.spaceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        spaceTypes: permits.reduce((acc, p) => {
            if (p.spaceType) acc[p.spaceType] = (acc[p.spaceType] || 0) + 1;
            return acc;
        }, {})
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <ShareModal
                isOpen={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Espacio Confinado - ${shareItem?.spaceName || ''}`}
                text={shareItem ? `🕳️ Permiso Ingreso Espacio Confinado\n🆔 Espacio: ${shareItem.spaceName}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${new Date(shareItem.createdAt).toLocaleDateString()}` : ''}
                elementIdToPrint="pdf-content"
                fileName={`Espacio_Confinado_${shareItem?.spaceName || 'Sin_Nombre'}.pdf`}
            />

            <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
                {shareItem && <ConfinedSpacePdf data={shareItem} />}
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
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
                    }}>
                        <Tent size={32} color="#ffffff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '1.5rem', 
                            fontWeight: 900,
                            color: 'var(--color-text)',
                            letterSpacing: '-0.5px'
                        }}>
                            Espacios Confinados
                        </h1>
                        <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            OSHA 1910.146 • {activePermits.length} activos
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/confined-space-form')}
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
                    <button
                        onClick={() => navigate('/confined-space-history')}
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
                    label="Total Permisos"
                    value={stats.total}
                    color="#3B82F6"
                    gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
                />
                <StatCard 
                    icon={<CheckCircle2 size={24} />}
                    label="Permisos Activos"
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
                    icon={<CheckSquare size={24} />}
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
                    active={activeTab === 'permits'}
                    onClick={() => setActiveTab('permits')}
                    icon={<FileText size={18} />}
                    label="Permisos"
                    count={permits.length}
                />
                <TabButton 
                    active={activeTab === 'active'}
                    onClick={() => setActiveTab('active')}
                    icon={<CheckCircle2 size={18} />}
                    label="Activos"
                    count={activePermits.length}
                    badge={activePermits.length}
                />
                <TabButton 
                    active={activeTab === 'limits'}
                    onClick={() => setActiveTab('limits')}
                    icon={<Activity size={18} />}
                    label="Límites"
                />
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
                                placeholder="Buscar por espacio, ubicación..."
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
                        <EmptyState onAdd={() => setShowAddModal(true)} />
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
                                    onShare={() => setShareItem(permit)}
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
                    onShare={(permit) => setShareItem(permit)}
                    onAddReading={(permit) => {
                        setCurrentPermitForReading(permit);
                        setShowAtmosphericModal(true);
                    }}
                />
            )}

            {activeTab === 'limits' && (
                <AtmosphericLimitsPanel limits={ATMOSPHERIC_LIMITS} />
            )}

            {/* Modal de Crear Permiso */}
            {showAddModal && (
                <CreatePermitModal 
                    permit={newPermit}
                    setPermit={setNewPermit}
                    onSave={handleCreatePermit}
                    onClose={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}
                    CONFINED_SPACE_TYPES={CONFINED_SPACE_TYPES}
                    POTENTIAL_HAZARDS={POTENTIAL_HAZARDS}
                    EQUIPMENT_CHECKLIST={EQUIPMENT_CHECKLIST}
                    ROLES={ROLES}
                />
            )}

            {/* Modal de Detalle */}
            {selectedPermit && (
                <PermitDetailModal 
                    permit={selectedPermit}
                    statusConfig={PERMIT_STATUS[selectedPermit.status] || PERMIT_STATUS.draft}
                    onClose={() => setSelectedPermit(null)}
                    CONFINED_SPACE_TYPES={CONFINED_SPACE_TYPES}
                    POTENTIAL_HAZARDS={POTENTIAL_HAZARDS}
                    EQUIPMENT_CHECKLIST={EQUIPMENT_CHECKLIST}
                    ROLES={ROLES}
                />
            )}

            {/* Modal de Lectura Atmosférica */}
            {showAtmosphericModal && currentPermitForReading && (
                <AtmosphericReadingModal 
                    permit={currentPermitForReading}
                    onSave={addAtmosphericReading}
                    onClose={() => {
                        setShowAtmosphericModal(false);
                        setCurrentPermitForReading(null);
                    }}
                    limits={ATMOSPHERIC_LIMITS}
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

function TabButton({ active, onClick, icon, label, count, badge }) {
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

function PermitCard({ permit, statusConfig, onAuthorize, onSuspend, onComplete, onView, onShare, onDelete }) {
    const spaceType = CONFINED_SPACE_TYPES.find(t => t.id === permit.spaceType);
    const isExpired = permit.validUntil && new Date(permit.validUntil) < new Date();

    return (
        <div className="card" style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all var(--transition-fast)',
            borderLeft: `4px solid ${isExpired ? '#9ca3af' : statusConfig.color}`
        }}>
            {/* Icono */}
            <div style={{
                width: '56px',
                height: '56px',
                background: `${isExpired ? '#9ca3af' : statusConfig.color}15`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <Tent size={28} color={isExpired ? '#9ca3af' : statusConfig.color} strokeWidth={2.5} />
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
                        {spaceType?.icon} {permit.spaceName}
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
                        <Tent size={14} />
                        {permit.location || 'Sin ubicación'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={14} />
                        {permit.team?.entrants?.length || 0} entrantes
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} />
                        {permit.validUntil ? new Date(permit.validUntil).toLocaleDateString() : '-'}
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
                <Tent size={40} color="var(--color-text-muted)" />
            </div>
            <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.25rem', 
                fontWeight: 800,
                color: 'var(--color-text)'
            }}>
                Sin Permisos de Espacio Confinado
            </h3>
            <p style={{ 
                margin: '0 0 1.5rem 0', 
                color: 'var(--color-text-muted)',
                fontSize: '0.95rem'
            }}>
                Creá permisos de entrada según OSHA 1910.146
            </p>
            <button
                onClick={onAdd}
                className="btn-primary"
                style={{ width: 'auto', margin: 0 }}
            >
                <Plus size={20} style={{ marginRight: '0.5rem' }} />
                Primer Permiso
            </button>
        </div>
    );
}

function ActivePermitsList({ activePermits, onComplete, onSuspend, onView, onShare, onAddReading }) {
    if (activePermits.length === 0) {
        return (
            <div style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                background: 'var(--gradient-card)',
                borderRadius: 'var(--radius-2xl)',
                border: '2px dashed var(--color-border)'
            }}>
                <CheckCircle2 size={48} color="#16a34a" style={{ marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>
                    ¡No hay permisos activos!
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                    No hay entradas a espacios confinados en curso.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activePermits.map(permit => {
                const spaceType = CONFINED_SPACE_TYPES.find(t => t.id === permit.spaceType);
                const isExpired = permit.validUntil && new Date(permit.validUntil) < new Date();
                const timeRemaining = permit.validUntil 
                    ? Math.max(0, Math.floor((new Date(permit.validUntil) - new Date()) / (1000 * 60 * 60)))
                    : 0;

                return (
                    <div key={permit.id} className="card" style={{
                        padding: '1.5rem',
                        border: isExpired ? '2px solid #9ca3af' : '2px solid #16a34a',
                        background: isExpired ? '#f9fafb' : '#f0fdf4'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                background: isExpired 
                                    ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                                    : 'linear-gradient(135deg, #16a34a, #059669)',
                                borderRadius: 'var(--radius-xl)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                flexShrink: 0,
                                animation: isExpired ? 'none' : 'pulse 2s infinite'
                            }}>
                                <Tent size={32} strokeWidth={2.5} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>
                                    {timeRemaining}h
                                </span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>
                                        {spaceType?.icon} {permit.spaceName}
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
                                    {permit.location} • Vigía: {permit.team?.attendant || 'Sin asignar'}
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
                                        <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        {permit.team?.entrants?.length || 0} Entrante(s)
                                    </span>
                                    <span style={{
                                        padding: '0.35rem 0.65rem',
                                        background: '#f59e0b',
                                        color: '#fff',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.75rem',
                                        fontWeight: 700
                                    }}>
                                        <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        {permit.atmosphericReadings?.length || 0} Mediciones
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
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                <button
                                    onClick={() => onAddReading(permit)}
                                    className="btn-outline"
                                    style={{ padding: '0.6rem 0.75rem' }}
                                    disabled={isExpired}
                                >
                                    <Wind size={18} />
                                    Medir
                                </button>
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

function AtmosphericLimitsPanel({ limits }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    <Activity size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Límites Atmosféricos (OSHA 1910.146)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {Object.entries(limits).map(([key, limit]) => (
                        <div key={key} style={{
                            padding: '1.25rem',
                            background: key === 'oxygen' ? '#eff6ff' : '#f0fdf4',
                            border: `1px solid ${key === 'oxygen' ? '#3b82f6' : '#16a34a'}`,
                            borderRadius: 'var(--radius-xl)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                    {limit.name}
                                </span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: key === 'oxygen' ? '#3b82f6' : '#16a34a' }}>
                                    {limit.unit}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text)' }}>
                                    {limit.min}
                                </span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                    - {limit.max}
                                </span>
                            </div>
                            {key === 'oxygen' && (
                                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Nivel normal: 20.9%
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Referencia rápida */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800 }}>
                    <AlertTriangle size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Condiciones de Peligro Inmediato
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <DangerItem 
                        condition="Oxígeno < 19.5%"
                        consequence="Hipoxia, pérdida de conciencia"
                        color="#dc2626"
                    />
                    <DangerItem 
                        condition="Oxígeno > 23.5%"
                        consequence="Riesgo de incendio aumentado"
                        color="#dc2626"
                    />
                    <DangerItem 
                        condition="LEL > 10%"
                        consequence="Atmósfera explosiva"
                        color="#dc2626"
                    />
                    <DangerItem 
                        condition="H2S > 10 ppm"
                        consequence="Tóxico, olor a huevo podrido"
                        color="#dc2626"
                    />
                    <DangerItem 
                        condition="CO > 35 ppm"
                        consequence="Veneno silencioso, sin olor"
                        color="#dc2626"
                    />
                </div>
            </div>
        </div>
    );
}

function DangerItem({ condition, consequence, color }) {
    return (
        <div style={{
            padding: '0.75rem',
            background: `${color}10`,
            border: `1px solid ${color}30`,
            borderRadius: 'var(--radius-lg)'
        }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color, marginBottom: '0.25rem' }}>
                {condition}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {consequence}
            </div>
        </div>
    );
}

// Modal de Crear Permiso
function CreatePermitModal({ permit, setPermit, onSave, onClose, CONFINED_SPACE_TYPES, POTENTIAL_HAZARDS, EQUIPMENT_CHECKLIST, ROLES }) {
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleHazard = (hazardId) => {
        const current = permit.hazards || [];
        const updated = current.includes(hazardId)
            ? current.filter(h => h !== hazardId)
            : [...current, hazardId];
        setPermit({ ...permit, hazards: updated });
    };

    const toggleEquipment = (equipId) => {
        const updated = permit.equipment.map(e => 
            e.id === equipId ? { ...e, checked: !e.checked } : e
        );
        setPermit({ ...permit, equipment: updated });
    };

    const addTeamMember = (role, name) => {
        if (role === 'entrant') {
            setPermit({ 
                ...permit, 
                team: { ...permit.team, entrants: [...permit.team.entrants, name] }
            });
        } else {
            setPermit({ 
                ...permit, 
                team: { ...permit.team, [role]: name }
            });
        }
    };

    return (
        <div className="modal-fullscreen-overlay" onClick={onClose}>
            <div
                className="card"
                style={{
                    width: isMobile ? '100%' : '100%',
                    maxWidth: isMobile ? '100%' : '900px',
                    maxHeight: isMobile ? '95vh' : '90vh',
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
                        Nuevo Permiso de Espacio Confinado
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

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                    {/* Nombre del Espacio */}
                    <div style={{ gridColumn: isMobile ? '1 / -1' : undefined }}>
                        <label style={labelStyle}>Nombre del Espacio *</label>
                        <input
                            type="text"
                            value={permit.spaceName}
                            onChange={(e) => setPermit({ ...permit, spaceName: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: Tanque de Almacenamiento T-101"
                        />
                    </div>

                    {/* Tipo de Espacio */}
                    <div>
                        <label style={labelStyle}>Tipo de Espacio</label>
                        <select
                            value={permit.spaceType}
                            onChange={(e) => setPermit({ ...permit, spaceType: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">Seleccionar tipo</option>
                            {CONFINED_SPACE_TYPES.map(type => (
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
                            style={inputStyle}
                            placeholder="Ej: Planta Norte, Sector B"
                        />
                    </div>

                    {/* Departamento */}
                    <div>
                        <label style={labelStyle}>Departamento</label>
                        <input
                            type="text"
                            value={permit.department}
                            onChange={(e) => setPermit({ ...permit, department: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: Mantenimiento"
                        />
                    </div>
                </div>

                {/* Descripción */}
                <div style={{ marginTop: '1rem' }}>
                    <label style={labelStyle}>Descripción del Trabajo</label>
                    <textarea
                        value={permit.description}
                        onChange={(e) => setPermit({ ...permit, description: e.target.value })}
                        style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                        placeholder="Describí el trabajo a realizar..."
                    />
                </div>

                {/* Peligros Potenciales */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Peligros Potenciales</label>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? '0.4rem' : '0.5rem' }}>
                        {POTENTIAL_HAZARDS.map(hazard => (
                            <button
                                key={hazard.id}
                                onClick={() => toggleHazard(hazard.id)}
                                style={{
                                    padding: '0.75rem',
                                    background: permit.hazards?.includes(hazard.id) 
                                        ? '#fef2f2' 
                                        : 'var(--color-background)',
                                    border: `2px solid ${permit.hazards?.includes(hazard.id) ? '#dc2626' : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{hazard.icon}</span>
                                <span style={{ 
                                    fontSize: '0.7rem', 
                                    fontWeight: 700,
                                    color: permit.hazards?.includes(hazard.id) ? '#dc2626' : 'var(--color-text-muted)'
                                }}>
                                    {hazard.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Equipo Requerido */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Equipamiento Requerido</label>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? '0.5rem' : '0.5rem' }}>
                        {permit.equipment.map(equip => (
                            <label 
                                key={equip.id}
                                style={{
                                    padding: '0.75rem',
                                    background: equip.checked ? '#f0fdf4' : 'var(--color-background)',
                                    border: `2px solid ${equip.checked ? '#16a34a' : 'var(--color-border)'}`,
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
                                    checked={equip.checked}
                                    onChange={() => toggleEquipment(equip.id)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '1.25rem' }}>{equip.icon}</span>
                                <span style={{ 
                                    fontSize: '0.8rem', 
                                    fontWeight: 600,
                                    color: equip.checked ? '#16a34a' : 'var(--color-text)'
                                }}>
                                    {equip.name}
                                    {equip.required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Equipo de Trabajo */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Equipo de Trabajo</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Entrante(s)</label>
                            <input
                                type="text"
                                placeholder="Nombre del entrante"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        addTeamMember('entrant', e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                                style={inputStyle}
                            />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {permit.team.entrants.map((entrant, idx) => (
                                    <span key={idx} style={{
                                        padding: '0.35rem 0.65rem',
                                        background: '#3b82f6',
                                        color: '#fff',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.8rem',
                                        fontWeight: 600
                                    }}>
                                        {entrant}
                                        <button
                                            onClick={() => {
                                                const updated = permit.team.entrants.filter((_, i) => i !== idx);
                                                setPermit({ ...permit, team: { ...permit.team, entrants: updated } });
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '4px', padding: 0 }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Vigía (Attendant)</label>
                            <input
                                type="text"
                                value={permit.team.attendant}
                                onChange={(e) => addTeamMember('attendant', e.target.value)}
                                style={inputStyle}
                                placeholder="Nombre del vigía"
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Supervisor</label>
                            <input
                                type="text"
                                value={permit.team.supervisor}
                                onChange={(e) => addTeamMember('supervisor', e.target.value)}
                                style={inputStyle}
                                placeholder="Nombre del supervisor"
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Equipo de Rescate</label>
                            <input
                                type="text"
                                value={permit.team.rescue}
                                onChange={(e) => addTeamMember('rescue', e.target.value)}
                                style={inputStyle}
                                placeholder="Empresa/Equipo de rescate"
                            />
                        </div>
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
function PermitDetailModal({ permit, statusConfig, onClose, CONFINED_SPACE_TYPES, POTENTIAL_HAZARDS, EQUIPMENT_CHECKLIST, ROLES }) {
    const spaceType = CONFINED_SPACE_TYPES.find(t => t.id === permit.spaceType);
    const isExpired = permit.validUntil && new Date(permit.validUntil) < new Date();

    return (
        <div style={{
            className: 'modal-fullscreen-overlay'
        }} onClick={onClose}>
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
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                        }}>
                            <Tent size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                                {spaceType?.icon} {permit.spaceName}
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

                {/* Información del espacio */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Información del Espacio
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <InfoDetail label="Tipo" value={spaceType?.name || '-'} />
                        <InfoDetail label="Departamento" value={permit.department || '-'} />
                        <InfoDetail label="Válido Desde" value={permit.validFrom ? new Date(permit.validFrom).toLocaleString() : '-'} />
                        <InfoDetail label="Válido Hasta" value={permit.validUntil ? new Date(permit.validUntil).toLocaleString() : '-'} />
                    </div>
                </div>

                {/* Peligros */}
                {permit.hazards?.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                            Peligros Identificados
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {permit.hazards.map(hazardId => {
                                const hazard = POTENTIAL_HAZARDS.find(h => h.id === hazardId);
                                return (
                                    <span key={hazardId} style={{
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
                                        <span>{hazard?.icon}</span>
                                        {hazard?.name}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Equipo */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Equipamiento
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {permit.equipment?.filter(e => e.checked).map(equip => (
                            <span key={equip.id} style={{
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
                                <span>{equip.icon}</span>
                                {equip.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Equipo de Trabajo */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Equipo de Trabajo
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                Entrantes ({permit.team?.entrants?.length || 0})
                            </div>
                            {permit.team?.entrants?.map((entrant, idx) => (
                                <div key={idx} style={{
                                    padding: '0.5rem 0.75rem',
                                    background: '#eff6ff',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 600
                                }}>
                                    <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    {entrant}
                                </div>
                            ))}
                        </div>
                        <div>
                            <RoleItem role={ROLES.find(r => r.id === 'attendant')} name={permit.team?.attendant} />
                            <RoleItem role={ROLES.find(r => r.id === 'supervisor')} name={permit.team?.supervisor} />
                            <RoleItem role={ROLES.find(r => r.id === 'rescue')} name={permit.team?.rescue} />
                        </div>
                    </div>
                </div>

                {/* Lecturas atmosféricas */}
                {permit.atmosphericReadings?.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                            Lecturas Atmosféricas ({permit.atmosphericReadings.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {permit.atmosphericReadings.slice(-5).map((reading, idx) => (
                                <div key={idx} style={{
                                    padding: '0.75rem',
                                    background: reading.status === 'safe' ? '#f0fdf4' : reading.status === 'warning' ? '#fffbeb' : '#fef2f2',
                                    border: `1px solid ${reading.status === 'safe' ? '#16a34a' : reading.status === 'warning' ? '#f59e0b' : '#dc2626'}`,
                                    borderRadius: 'var(--radius-lg)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                            {new Date(reading.timestamp).toLocaleString()}
                                        </span>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: 'var(--radius-full)',
                                            background: reading.status === 'safe' ? '#16a34a' : reading.status === 'warning' ? '#f59e0b' : '#dc2626',
                                            color: '#fff'
                                        }}>
                                            {reading.status === 'safe' ? 'SEGURO' : reading.status === 'warning' ? 'PRECAUCIÓN' : 'PELIGRO'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <div>O₂: <strong>{reading.oxygen}%</strong></div>
                                        <div>LEL: <strong>{reading.lel}%</strong></div>
                                        <div>H₂S: <strong>{reading.h2s} ppm</strong></div>
                                        <div>CO: <strong>{reading.co} ppm</strong></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                            OSHA 1910.146
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
                            Permiso requerido para espacios confinados. Verificar atmósfera antes y durante la entrada.
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

function RoleItem({ role, name }) {
    if (!name) return null;
    return (
        <div style={{
            padding: '0.5rem 0.75rem',
            background: `${role?.color}15`,
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: role?.color,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        }}>
            <span>{role?.icon}</span>
            <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>{role?.name}</div>
                <div>{name}</div>
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

// Modal de Lectura Atmosférica
function AtmosphericReadingModal({ permit, onSave, onClose, limits }) {
    const [reading, setReading] = useState({
        oxygen: '',
        lel: '',
        h2s: '',
        co: ''
    });

    const handleSave = () => {
        onSave({
            oxygen: parseFloat(reading.oxygen) || 0,
            lel: parseFloat(reading.lel) || 0,
            h2s: parseFloat(reading.h2s) || 0,
            co: parseFloat(reading.co) || 0
        });
        onClose();
    };

    const getStatus = () => {
        if (reading.oxygen && (reading.oxygen < limits.oxygen.min || reading.oxygen > limits.oxygen.max)) return { status: 'danger', text: 'PELIGRO - OXÍGENO' };
        if (reading.lel && reading.lel > limits.lel.max) return { status: 'danger', text: 'PELIGRO - LEL' };
        if (reading.h2s && reading.h2s > limits.h2s.max) return { status: 'danger', text: 'PELIGRO - H2S' };
        if (reading.co && reading.co > limits.co.max) return { status: 'danger', text: 'PELIGRO - CO' };
        
        if (reading.oxygen && reading.oxygen < 20.9) return { status: 'warning', text: 'PRECAUCIÓN' };
        if (reading.lel && reading.lel > 0) return { status: 'warning', text: 'PRECAUCIÓN' };
        
        return { status: 'safe', text: 'SEGURO' };
    };

    const currentStatus = getStatus();

    return (
        <div style={{
            className: 'modal-fullscreen-overlay'
        }} onClick={onClose}>
            <div 
                className="card"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    margin: 'auto'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>
                        <Wind size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Lectura Atmosférica
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

                {/* Estado actual */}
                <div style={{
                    padding: '1rem',
                    background: currentStatus.status === 'safe' ? '#f0fdf4' : currentStatus.status === 'warning' ? '#fffbeb' : '#fef2f2',
                    border: `2px solid ${currentStatus.status === 'safe' ? '#16a34a' : currentStatus.status === 'warning' ? '#f59e0b' : '#dc2626'}`,
                    borderRadius: 'var(--radius-xl)',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        color: currentStatus.status === 'safe' ? '#16a34a' : currentStatus.status === 'warning' ? '#f59e0b' : '#dc2626'
                    }}>
                        {currentStatus.text}
                    </div>
                </div>

                {/* Campos de lectura */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Oxígeno (O₂) %</label>
                        <input
                            type="number"
                            step="0.1"
                            value={reading.oxygen}
                            onChange={(e) => setReading({ ...reading, oxygen: e.target.value })}
                            style={{
                                ...inputStyle,
                                background: reading.oxygen && (reading.oxygen < limits.oxygen.min || reading.oxygen > limits.oxygen.max) ? '#fef2f2' : 'var(--color-surface)',
                                borderColor: reading.oxygen && (reading.oxygen < limits.oxygen.min || reading.oxygen > limits.oxygen.max) ? '#dc2626' : 'var(--color-input-border)'
                            }}
                            placeholder="20.9"
                        />
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            Rango: {limits.oxygen.min} - {limits.oxygen.max}%
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>LEL %</label>
                        <input
                            type="number"
                            step="0.1"
                            value={reading.lel}
                            onChange={(e) => setReading({ ...reading, lel: e.target.value })}
                            style={{
                                ...inputStyle,
                                background: reading.lel && reading.lel > limits.lel.max ? '#fef2f2' : 'var(--color-surface)',
                                borderColor: reading.lel && reading.lel > limits.lel.max ? '#dc2626' : 'var(--color-input-border)'
                            }}
                            placeholder="0"
                        />
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            Máx: {limits.lel.max}%
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>H₂S (ppm)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={reading.h2s}
                            onChange={(e) => setReading({ ...reading, h2s: e.target.value })}
                            style={{
                                ...inputStyle,
                                background: reading.h2s && reading.h2s > limits.h2s.max ? '#fef2f2' : 'var(--color-surface)',
                                borderColor: reading.h2s && reading.h2s > limits.h2s.max ? '#dc2626' : 'var(--color-input-border)'
                            }}
                            placeholder="0"
                        />
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            Máx: {limits.h2s.max} ppm
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>CO (ppm)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={reading.co}
                            onChange={(e) => setReading({ ...reading, co: e.target.value })}
                            style={{
                                ...inputStyle,
                                background: reading.co && reading.co > limits.co.max ? '#fef2f2' : 'var(--color-surface)',
                                borderColor: reading.co && reading.co > limits.co.max ? '#dc2626' : 'var(--color-input-border)'
                            }}
                            placeholder="0"
                        />
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            Máx: {limits.co.max} ppm
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem'
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
                        onClick={handleSave}
                        className="btn-primary"
                        style={{ flex: 1 }}
                    >
                        Guardar Lectura
                    </button>
                </div>
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
