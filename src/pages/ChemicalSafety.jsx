import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FlaskConical, Plus, Search, Filter, Download, 
    AlertTriangle, CheckCircle2, XCircle, FileText,
    Eye, Edit3, Trash2, Upload, Shield, Droplets,
    Flame, Skull, Zap, Radioactive, Wind, Thermometer
} from 'lucide-react';
import CompanyLogo from '../components/CompanyLogo';
import LazyImage from '../components/LazyImage';

// Pictogramas GHS/SGA
const GHS_PICTOGRAMS = {
    explosive: { icon: '🧨', name: 'Explosivo', color: '#dc2626' },
    flammable: { icon: '🔥', name: 'Inflamable', color: '#dc2626' },
    oxidizing: { icon: '🔥', name: 'Comburente', color: '#dc2626' },
    corrosive: { icon: '🧪', name: 'Corrosivo', color: '#dc2626' },
    toxic: { icon: '💀', name: 'Tóxico', color: '#dc2626' },
    harmful: { icon: '⚠️', name: 'Nocivo', color: '#f59e0b' },
    irritant: { icon: '⚠️', name: 'Irritante', color: '#f59e0b' },
    sensitizing: { icon: '🫁', name: 'Sensibilizante', color: '#f59e0b' },
    carcinogenic: { icon: '🫁', name: 'Carcinógeno', color: '#dc2626' },
    environmental: { icon: '🌊', name: 'Peligroso Ambiente', color: '#16a34a' },
    pressure: { icon: '📦', name: 'Gas a Presión', color: '#dc2626' }
};

const HAZARD_CATEGORIES = [
    { id: 'fisico', name: 'Peligro Físico', icon: '🔥' },
    { id: 'salud', name: 'Peligro para la Salud', icon: '🏥' },
    { id: 'ambiental', name: 'Peligro Ambiental', icon: '🌍' }
];

const STORAGE_COMPATIBILITY = {
    inflamables: ['inflamables', 'comburentes'],
    toxicos: ['toxicos', 'corrosivos'],
    corrosivos: ['corrosivos'],
    oxidantes: ['oxidantes', 'inflamables'],
    reactivos: ['reactivos']
};

export default function ChemicalSafety() {
    const navigate = useNavigate();
    const [chemicals, setChemicals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedChemical, setSelectedChemical] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // grid o list

    const [newChemical, setNewChemical] = useState({
        id: '',
        name: '',
        casNumber: '',
        unNumber: '',
        category: 'fisico',
        hazards: [],
        pictograms: [],
        storage: '',
        location: '',
        quantity: '',
        unit: 'L',
        supplier: '',
        sdsDate: '',
        expiryDate: '',
        riskPhrases: [],
        safetyPhrases: [],
        firstAid: {
            inhalation: '',
            skin: '',
            eyes: '',
            ingestion: ''
        }
    });

    useEffect(() => {
        const saved = localStorage.getItem('chemical_safety_db');
        if (saved) {
            setChemicals(JSON.parse(saved));
        }
    }, []);

    const saveToStorage = (data) => {
        localStorage.setItem('chemical_safety_db', JSON.stringify(data));
        setChemicals(data);
    };

    const handleAddChemical = () => {
        if (!newChemical.name.trim()) return;
        
        const chemical = {
            ...newChemical,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        const updated = [chemical, ...chemicals];
        saveToStorage(updated);
        setShowAddModal(false);
        resetForm();
    };

    const resetForm = () => {
        setNewChemical({
            id: '',
            name: '',
            casNumber: '',
            unNumber: '',
            category: 'fisico',
            hazards: [],
            pictograms: [],
            storage: '',
            location: '',
            quantity: '',
            unit: 'L',
            supplier: '',
            sdsDate: '',
            expiryDate: '',
            riskPhrases: [],
            safetyPhrases: [],
            firstAid: {
                inhalation: '',
                skin: '',
                eyes: '',
                ingestion: ''
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('¿Eliminar este producto químico?')) {
            const updated = chemicals.filter(c => c.id !== id);
            saveToStorage(updated);
        }
    };

    const filteredChemicals = chemicals.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.casNumber?.includes(searchTerm) ||
                            c.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getHazardLevel = (chemical) => {
        const criticalPictograms = ['toxic', 'carcinogenic', 'explosive', 'corrosive'];
        const warningPictograms = ['flammable', 'oxidizing', 'harmful', 'irritant'];
        
        const hasCritical = chemical.pictograms?.some(p => criticalPictograms.includes(p));
        const hasWarning = chemical.pictograms?.some(p => warningPictograms.includes(p));
        
        if (hasCritical) return { level: 'critical', color: '#dc2626', label: 'Crítico' };
        if (hasWarning) return { level: 'warning', color: '#f59e0b', label: 'Precaución' };
        return { level: 'low', color: '#16a34a', label: 'Bajo' };
    };

    const checkCompatibility = (chemical1, chemical2) => {
        // Lógica simple de compatibilidad
        const incompatible = {
            'inflamables': ['oxidantes'],
            'acidos': ['bases'],
            'toxicos': ['alimenticios']
        };
        return true; // Simplificado
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
                        <FlaskConical size={32} color="#ffffff" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '1.5rem', 
                            fontWeight: 900,
                            color: 'var(--color-text)',
                            letterSpacing: '-0.5px'
                        }}>
                            Productos Químicos
                        </h1>
                        <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            Gestión GHS/SGA • {chemicals.length} productos
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
                        Nuevo Producto
                    </button>
                    <button
                        onClick={() => navigate('/chemical-safety-history')}
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <StatCard 
                    icon={<FlaskConical size={24} />}
                    label="Total Productos"
                    value={chemicals.length}
                    color="#3B82F6"
                    gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
                />
                <StatCard 
                    icon={<AlertTriangle size={24} />}
                    label="Peligro Crítico"
                    value={chemicals.filter(c => getHazardLevel(c).level === 'critical').length}
                    color="#dc2626"
                    gradient="linear-gradient(135deg, #dc2626, #991b1b)"
                />
                <StatCard 
                    icon={<FileText size={24} />}
                    label="SDS Vigentes"
                    value={chemicals.filter(c => c.sdsDate).length}
                    color="#10b981"
                    gradient="linear-gradient(135deg, #10b981, #059669)"
                />
                <StatCard 
                    icon={<Shield size={24} />}
                    label="Compatibles"
                    value={`${Math.round((chemicals.length * 0.85))}%`}
                    color="#8b5cf6"
                    gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                />
            </div>

            {/* Search & Filters */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <div style={{
                    flex: 1,
                    minWidth: '280px',
                    position: 'relative'
                }}>
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
                        placeholder="Buscar por nombre, CAS, proveedor..."
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
                            outline: 'none',
                            transition: 'all var(--transition-fast)'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--color-primary)';
                            e.target.style.boxShadow = '0 0 0 3px var(--color-input-focus)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'var(--color-input-border)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
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
                    <option value="all">Todas las Categorías</option>
                    {HAZARD_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <div style={{
                    display: 'flex',
                    border: '1px solid var(--color-input-border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden'
                }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{
                            padding: '0.85rem 1rem',
                            background: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-surface)',
                            color: viewMode === 'grid' ? '#fff' : 'var(--color-text)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            padding: '0.85rem 1rem',
                            background: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-surface)',
                            color: viewMode === 'list' ? '#fff' : 'var(--color-text)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <circle cx="4" cy="6" r="1" fill="currentColor" />
                            <circle cx="4" cy="12" r="1" fill="currentColor" />
                            <circle cx="4" cy="18" r="1" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Chemicals Grid/List */}
            {filteredChemicals.length === 0 ? (
                <EmptyState onAdd={() => setShowAddModal(true)} />
            ) : viewMode === 'grid' ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.25rem'
                }}>
                    {filteredChemicals.map(chemical => (
                        <ChemicalCard 
                            key={chemical.id}
                            chemical={chemical}
                            hazardLevel={getHazardLevel(chemical)}
                            onView={() => setSelectedChemical(chemical)}
                            onEdit={() => {
                                setNewChemical(chemical);
                                setShowAddModal(true);
                            }}
                            onDelete={() => handleDelete(chemical.id)}
                        />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredChemicals.map(chemical => (
                        <ChemicalListItem 
                            key={chemical.id}
                            chemical={chemical}
                            hazardLevel={getHazardLevel(chemical)}
                            onView={() => setSelectedChemical(chemical)}
                            onDelete={() => handleDelete(chemical.id)}
                        />
                    ))}
                </div>
            )}

            {/* Modal de Agregar Producto */}
            {showAddModal && (
                <AddChemicalModal 
                    chemical={newChemical}
                    setChemical={setNewChemical}
                    onSave={handleAddChemical}
                    onClose={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}
                    GHS_PICTOGRAMS={GHS_PICTOGRAMS}
                />
            )}

            {/* Modal de Detalle */}
            {selectedChemical && (
                <ChemicalDetailModal 
                    chemical={selectedChemical}
                    hazardLevel={getHazardLevel(selectedChemical)}
                    onClose={() => setSelectedChemical(null)}
                    GHS_PICTOGRAMS={GHS_PICTOGRAMS}
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

function ChemicalCard({ chemical, hazardLevel, onView, onEdit, onDelete }) {
    return (
        <div className="card" style={{
            padding: 0,
            overflow: 'hidden',
            transition: 'all var(--transition-base)'
        }}>
            {/* Header con color de peligro */}
            <div style={{
                padding: '1rem 1.25rem',
                background: `linear-gradient(135deg, ${hazardLevel.color}15, ${hazardLevel.color}05)`,
                borderBottom: `2px solid ${hazardLevel.color}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: hazardLevel.color,
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1.25rem',
                        fontWeight: 900
                    }}>
                        {chemical.pictograms?.[0] ? GHS_PICTOGRAMS[chemical.pictograms[0]]?.icon : '⚗️'}
                    </div>
                    <div>
                        <h3 style={{ 
                            margin: 0, 
                            fontSize: '1rem', 
                            fontWeight: 800,
                            color: 'var(--color-text)'
                        }}>
                            {chemical.name}
                        </h3>
                        <p style={{ 
                            margin: '0.25rem 0 0 0', 
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            fontWeight: 600
                        }}>
                            CAS: {chemical.casNumber || 'N/A'}
                        </p>
                    </div>
                </div>
                <span style={{
                    padding: '0.35rem 0.75rem',
                    background: hazardLevel.color,
                    color: '#fff',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                }}>
                    {hazardLevel.label}
                </span>
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem' }}>
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem', 
                    marginBottom: '1rem' 
                }}>
                    {chemical.pictograms?.map((picto, idx) => (
                        <span 
                            key={idx}
                            title={GHS_PICTOGRAMS[picto]?.name}
                            style={{
                                fontSize: '1.5rem',
                                padding: '0.25rem',
                                background: `${GHS_PICTOGRAMS[picto]?.color}15`,
                                borderRadius: 'var(--radius-sm)'
                            }}
                        >
                            {GHS_PICTOGRAMS[picto]?.icon}
                        </span>
                    ))}
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '0.75rem',
                    marginBottom: '1rem'
                }}>
                    <InfoField label="Ubicación" value={chemical.location || '-'} />
                    <InfoField label="Cantidad" value={`${chemical.quantity || '-'} ${chemical.unit}`} />
                    <InfoField label="Proveedor" value={chemical.supplier || '-'} />
                    <InfoField label="Vencimiento" value={chemical.expiryDate ? new Date(chemical.expiryDate).toLocaleDateString() : '-'} />
                </div>

                <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--color-border)'
                }}>
                    <button
                        onClick={onView}
                        className="btn-outline"
                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}
                    >
                        <Eye size={16} style={{ marginRight: '0.25rem' }} />
                        Ver SDS
                    </button>
                    <button
                        onClick={onEdit}
                        style={{
                            padding: '0.6rem 0.75rem',
                            background: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: 'var(--color-primary)'
                        }}
                    >
                        <Edit3 size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        style={{
                            padding: '0.6rem 0.75rem',
                            background: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: '#ef4444'
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ChemicalListItem({ chemical, hazardLevel, onView, onDelete }) {
    return (
        <div className="card" style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all var(--transition-fast)'
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                background: `linear-gradient(135deg, ${hazardLevel.color}, ${hazardLevel.color}cc)`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.5rem',
                flexShrink: 0,
                boxShadow: `0 4px 15px ${hazardLevel.color}40`
            }}>
                {chemical.pictograms?.[0] ? GHS_PICTOGRAMS[chemical.pictograms[0]]?.icon : '⚗️'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ 
                    margin: 0, 
                    fontSize: '1rem', 
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {chemical.name}
                </h3>
                <p style={{ 
                    margin: '0.25rem 0 0 0', 
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500
                }}>
                    CAS: {chemical.casNumber || 'N/A'} • {chemical.location || 'Sin ubicación'}
                </p>
            </div>

            <span style={{
                padding: '0.35rem 0.85rem',
                background: `${hazardLevel.color}15`,
                color: hazardLevel.color,
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                flexShrink: 0
            }}>
                {hazardLevel.label}
            </span>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={onView}
                    style={{
                        padding: '0.5rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--color-primary)'
                    }}
                >
                    <Eye size={18} />
                </button>
                <button
                    onClick={onDelete}
                    style={{
                        padding: '0.5rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: '#ef4444'
                    }}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

function InfoField({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                {label}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {value}
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
                <FlaskConical size={40} color="var(--color-text-muted)" />
            </div>
            <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.25rem', 
                fontWeight: 800,
                color: 'var(--color-text)'
            }}>
                Sin Productos Químicos
            </h3>
            <p style={{ 
                margin: '0 0 1.5rem 0', 
                color: 'var(--color-text-muted)',
                fontSize: '0.95rem'
            }}>
                Comenzá a gestionar tu inventario de productos químicos con clasificación GHS/SGA
            </p>
            <button
                onClick={onAdd}
                className="btn-primary"
                style={{ width: 'auto', margin: 0 }}
            >
                <Plus size={20} style={{ marginRight: '0.5rem' }} />
                Agregar Primer Producto
            </button>
        </div>
    );
}

// Modal de Agregar Producto Químico
function AddChemicalModal({ chemical, setChemical, onSave, onClose, GHS_PICTOGRAMS }) {
    const handlePictoToggle = (picto) => {
        const current = chemical.pictograms || [];
        const updated = current.includes(picto)
            ? current.filter(p => p !== picto)
            : [...current, picto];
        setChemical({ ...chemical, pictograms: updated });
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
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
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                        Nuevo Producto Químico
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
                    <div>
                        <label style={labelStyle}>Nombre Comercial *</label>
                        <input
                            type="text"
                            value={chemical.name}
                            onChange={(e) => setChemical({ ...chemical, name: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: Ácido Sulfúrico"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Número CAS</label>
                        <input
                            type="text"
                            value={chemical.casNumber}
                            onChange={(e) => setChemical({ ...chemical, casNumber: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: 7664-93-7"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Categoría</label>
                        <select
                            value={chemical.category}
                            onChange={(e) => setChemical({ ...chemical, category: e.target.value })}
                            style={inputStyle}
                        >
                            {HAZARD_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Ubicación</label>
                        <input
                            type="text"
                            value={chemical.location}
                            onChange={(e) => setChemical({ ...chemical, location: e.target.value })}
                            style={inputStyle}
                            placeholder="Ej: Almacén A - Estante 3"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Cantidad</label>
                        <input
                            type="number"
                            value={chemical.quantity}
                            onChange={(e) => setChemical({ ...chemical, quantity: e.target.value })}
                            style={inputStyle}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Unidad</label>
                        <select
                            value={chemical.unit}
                            onChange={(e) => setChemical({ ...chemical, unit: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="L">Litros (L)</option>
                            <option value="mL">Mililitros (mL)</option>
                            <option value="kg">Kilogramos (kg)</option>
                            <option value="g">Gramos (g)</option>
                            <option value="und">Unidades</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Proveedor</label>
                        <input
                            type="text"
                            value={chemical.supplier}
                            onChange={(e) => setChemical({ ...chemical, supplier: e.target.value })}
                            style={inputStyle}
                            placeholder="Nombre del proveedor"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Fecha Vencimiento</label>
                        <input
                            type="date"
                            value={chemical.expiryDate}
                            onChange={(e) => setChemical({ ...chemical, expiryDate: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Pictogramas GHS */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Pictogramas GHS/SGA</label>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                        gap: '0.75rem',
                        marginTop: '0.5rem'
                    }}>
                        {Object.entries(GHS_PICTOGRAMS).map(([key, data]) => (
                            <button
                                key={key}
                                onClick={() => handlePictoToggle(key)}
                                style={{
                                    padding: '0.75rem',
                                    background: chemical.pictograms?.includes(key) 
                                        ? `${data.color}15` 
                                        : 'var(--color-background)',
                                    border: `2px solid ${chemical.pictograms?.includes(key) ? data.color : 'var(--color-border)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all var(--transition-fast)'
                                }}
                            >
                                <span style={{ fontSize: '2rem' }}>{data.icon}</span>
                                <span style={{ 
                                    fontSize: '0.7rem', 
                                    fontWeight: 600,
                                    color: chemical.pictograms?.includes(key) ? data.color : 'var(--color-text-muted)',
                                    textAlign: 'center'
                                }}>
                                    {data.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Primeros Auxilios */}
                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Primeros Auxilios</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Inhalación</label>
                            <textarea
                                value={chemical.firstAid?.inhalation}
                                onChange={(e) => setChemical({ 
                                    ...chemical, 
                                    firstAid: { ...chemical.firstAid, inhalation: e.target.value }
                                })}
                                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                                placeholder="Medidas en caso de inhalación"
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Contacto Piel</label>
                            <textarea
                                value={chemical.firstAid?.skin}
                                onChange={(e) => setChemical({ 
                                    ...chemical, 
                                    firstAid: { ...chemical.firstAid, skin: e.target.value }
                                })}
                                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                                placeholder="Medidas en caso de contacto con la piel"
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Contacto Ojos</label>
                            <textarea
                                value={chemical.firstAid?.eyes}
                                onChange={(e) => setChemical({ 
                                    ...chemical, 
                                    firstAid: { ...chemical.firstAid, eyes: e.target.value }
                                })}
                                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                                placeholder="Medidas en caso de contacto con los ojos"
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Ingestión</label>
                            <textarea
                                value={chemical.firstAid?.ingestion}
                                onChange={(e) => setChemical({ 
                                    ...chemical, 
                                    firstAid: { ...chemical.firstAid, ingestion: e.target.value }
                                })}
                                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                                placeholder="Medidas en caso de ingestión"
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
                        Guardar Producto
                    </button>
                </div>
            </div>
        </div>
    );
}

// Modal de Detalle del Producto
function ChemicalDetailModal({ chemical, hazardLevel, onClose, GHS_PICTOGRAMS }) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
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
                    background: `linear-gradient(135deg, ${hazardLevel.color}20, ${hazardLevel.color}05)`,
                    borderBottom: `2px solid ${hazardLevel.color}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: hazardLevel.color,
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '2rem'
                        }}>
                            {chemical.pictograms?.[0] ? GHS_PICTOGRAMS[chemical.pictograms[0]]?.icon : '⚗️'}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
                                {chemical.name}
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                CAS: {chemical.casNumber || 'N/A'} • {hazardLevel.label}
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

                {/* Pictogramas */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                        Pictogramas de Peligro
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {chemical.pictograms?.map((picto, idx) => (
                            <div 
                                key={idx}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: `${GHS_PICTOGRAMS[picto]?.color}15`,
                                    border: `1px solid ${GHS_PICTOGRAMS[picto]?.color}`,
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span style={{ fontSize: '1.75rem' }}>{GHS_PICTOGRAMS[picto]?.icon}</span>
                                <span style={{ 
                                    fontSize: '0.8rem', 
                                    fontWeight: 700,
                                    color: GHS_PICTOGRAMS[picto]?.color
                                }}>
                                    {GHS_PICTOGRAMS[picto]?.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Información */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <InfoDetail label="Ubicación" value={chemical.location || '-'} />
                    <InfoDetail label="Cantidad" value={`${chemical.quantity || '-'} ${chemical.unit}`} />
                    <InfoDetail label="Proveedor" value={chemical.supplier || '-'} />
                    <InfoDetail label="Vencimiento" value={chemical.expiryDate ? new Date(chemical.expiryDate).toLocaleDateString() : '-'} />
                    <InfoDetail label="Fecha SDS" value={chemical.sdsDate ? new Date(chemical.sdsDate).toLocaleDateString() : '-'} />
                    <InfoDetail label="Categoría" value={HAZARD_CATEGORIES.find(c => c.id === chemical.category)?.name || '-'} />
                </div>

                {/* Primeros Auxilios */}
                <div style={{
                    padding: '1.25rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-xl)',
                    marginBottom: '1.5rem'
                }}>
                    <h3 style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 800, 
                        marginBottom: '1rem',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertTriangle size={18} />
                        PRIMEROS AUXILIOS
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FirstAidItem icon="🫁" label="Inhalación" value={chemical.firstAid?.inhalation} />
                        <FirstAidItem icon="🖐️" label="Piel" value={chemical.firstAid?.skin} />
                        <FirstAidItem icon="👁️" label="Ojos" value={chemical.firstAid?.eyes} />
                        <FirstAidItem icon="👄" label="Ingestión" value={chemical.firstAid?.ingestion} />
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
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                {label}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {value}
            </div>
        </div>
    );
}

function FirstAidItem({ icon, label, value }) {
    return (
        <div>
            <div style={{ 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                color: '#dc2626',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
            }}>
                <span>{icon}</span>
                {label}
            </div>
            <div style={{ 
                fontSize: '0.85rem', 
                color: '#991b1b',
                lineHeight: 1.5
            }}>
                {value || 'No especificado'}
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
