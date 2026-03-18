import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, FlaskConical, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const GHS_PICTOGRAMS = {
    explosive: { icon: '🧨', name: 'Explosivo', color: '#dc2626' },
    flammable: { icon: '🔥', name: 'Inflamable', color: '#dc2626' },
    oxidizing: { icon: '🔥', name: 'Comburente', color: '#dc2626' },
    corrosive: { icon: '🧪', name: 'Corrosivo', color: '#dc2626' },
    toxic: { icon: '💀', name: 'Tóxico', color: '#dc2626' },
    harmful: { icon: '⚠️', name: 'Nocivo', color: '#f59e0b' },
    irritant: { icon: '⚠️', name: 'Irritante', color: '#f59e0b' }
};

export default function ChemicalSafetyHistory() {
    useDocumentTitle('Productos Químicos');
    const navigate = useNavigate();

    const [chemicals, setChemicals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('chemical_safety_db') || '[]');
        setChemicals(stored);
    }, []);

    const filteredChemicals = chemicals.filter(chem => {
        const matchesSearch = chem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            chem.casNumber?.includes(searchTerm) ||
                            chem.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || chem.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const stats = {
        total: chemicals.length,
        activos: chemicals.filter(c => c.status === 'active').length,
        criticos: chemicals.filter(c => c.pictograms?.some(p => ['toxic', 'corrosive', 'explosive'].includes(p))).length
    };

    const CATEGORIES = [
        { id: 'all', name: 'Todos', icon: '📦' },
        { id: 'fisico', name: 'Físico', icon: '🔥' },
        { id: 'salud', name: 'Salud', icon: '🏥' },
        { id: 'ambiental', name: 'Ambiental', icon: '🌍' }
    ];

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/chemical-safety')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-full)', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Productos Químicos</h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{stats.total} productos • {stats.criticos} críticos</p>
                    </div>
                </div>
                <button onClick={() => navigate('/chemical-safety')} className="btn-primary" style={{ margin: 0, padding: '0.75rem 1.25rem' }}>
                    Nuevo Producto
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<FlaskConical size={20} />} />
                <StatCard label="Activos" value={stats.activos} color="#16a34a" icon={<CheckCircle2 size={20} />} />
                <StatCard label="Críticos" value={stats.criticos} color="#dc2626" icon={<AlertTriangle size={20} />} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, CAS, proveedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none' }}
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Chemicals Grid */}
            {filteredChemicals.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <FlaskConical size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>No hay productos químicos registrados</p>
                    <button onClick={() => navigate('/chemical-safety')} className="btn-primary" style={{ marginTop: '1rem' }}>
                        Agregar Primer Producto
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {filteredChemicals.map(chem => (
                        <ChemicalCard key={chem.id} chemical={chem} onClick={() => navigate(`/chemical-safety/${chem.id}`)} />
                    ))}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color, icon }) {
    return (
        <div className="card" style={{ padding: '1.25rem', background: 'var(--gradient-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</span>
                <div style={{ color }}>{icon}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color }}>{value}</div>
        </div>
    );
}

function ChemicalCard({ chemical, onClick }) {
    const primaryPicto = chemical.pictograms?.[0];
    const pictoConfig = primaryPicto ? GHS_PICTOGRAMS[primaryPicto] : null;
    const hazardLevel = chemical.pictograms?.some(p => ['toxic', 'corrosive', 'explosive'].includes(p)) 
        ? { color: '#dc2626', label: 'Crítico' }
        : chemical.pictograms?.some(p => ['flammable', 'harmful', 'irritant'].includes(p))
        ? { color: '#f59e0b', label: 'Precaución' }
        : { color: '#16a34a', label: 'Bajo' };

    return (
        <div onClick={onClick} className="card" style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ width: '56px', height: '56px', background: `${hazardLevel.color}20`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    {pictoConfig?.icon || '⚗️'}
                </div>
                <span style={{ padding: '0.35rem 0.75rem', background: `${hazardLevel.color}20`, color: hazardLevel.color, borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 800 }}>
                    {hazardLevel.label}
                </span>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700 }}>{chemical.name}</h3>
            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                CAS: {chemical.casNumber || 'N/A'}
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {chemical.location || 'Sin ubicación'} • {chemical.quantity || '0'} {chemical.unit || ''}
            </p>
            {chemical.pictograms?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {chemical.pictograms.slice(0, 4).map((p, i) => (
                        <span key={i} style={{ fontSize: '1.25rem' }}>{GHS_PICTOGRAMS[p]?.icon || '⚠️'}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
