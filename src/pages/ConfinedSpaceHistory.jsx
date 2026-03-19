import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Package, AlertTriangle, CheckCircle2, Clock, Thermometer, Droplets, Share2, Printer, Trash2
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';

const PERMIT_STATUS = {
    active: { label: 'ACTIVO', color: '#16a34a' },
    pending: { label: 'PENDIENTE', color: '#f59e0b' },
    completed: { label: 'COMPLETADO', color: '#3b82f6' },
    cancelled: { label: 'CANCELADO', color: '#dc2626' }
};

export default function ConfinedSpaceHistory() {
    useDocumentTitle('Espacios Confinados');
    const navigate = useNavigate();

    const [permits, setPermits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('confined_space_permits_db') || '[]');
        setPermits(stored);
    }, []);

    const filteredPermits = permits.filter(permit => {
        const matchesSearch = permit.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            permit.entrySupervisor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            permit.spaceName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || permit.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: permits.length,
        active: permits.filter(p => p.status === 'active').length,
        completed: permits.filter(p => p.status === 'completed').length
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <ShareModal
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Espacio Confinado - ${shareItem?.spaceName || ''}`}
                text={shareItem ? `🕳️ Permiso Ingreso Espacio Confinado\n🆔 Espacio: ${shareItem.spaceName}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${new Date(shareItem.createdAt).toLocaleDateString()}` : ''}
                elementIdToPrint="pdf-content"
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <ConfinedSpacePdf data={shareItem} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/confined-space')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-full)', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Espacios Confinados</h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{stats.total} permisos • {stats.active} activos</p>
                    </div>
                </div>
                <button onClick={() => navigate('/confined-space/new')} className="btn-primary" style={{ margin: 0, padding: '0.75rem 1.25rem' }}>
                    Nuevo Permiso
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<Package size={20} />} />
                <StatCard label="Activos" value={stats.active} color="#16a34a" icon={<CheckCircle2 size={20} />} />
                <StatCard label="Completados" value={stats.completed} color="#3b82f6" icon={<Clock size={20} />} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" placeholder="Buscar por ubicación, supervisor, espacio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                    <option value="all">Todos los Estados</option>
                    {Object.entries(PERMIT_STATUS).map(([key, value]) => (<option key={key} value={key}>{value.label}</option>))}
                </select>
            </div>

            {filteredPermits.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Package size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>No hay permisos registrados</p>
                    <button onClick={() => navigate('/confined-space/new')} className="btn-primary" style={{ marginTop: '1rem' }}>Crear Primer Permiso</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredPermits.map(permit => (
                        <PermitCard 
                            key={permit.id} 
                            permit={permit} 
                            onEdit={() => navigate(`/confined-space/new`, { state: { editData: permit } })}
                            onShare={() => setShareItem(permit)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color, icon }) {
    return (<div className="card" style={{ padding: '1.25rem', background: 'var(--gradient-card)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}><span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</span><div style={{ color }}>{icon}</div></div><div style={{ fontSize: '2rem', fontWeight: 900, color }}>{value}</div></div>);
}

function PermitCard({ permit, onEdit, onShare }) {
    const statusConfig = PERMIT_STATUS[permit.status] || PERMIT_STATUS.pending;
    return (
        <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', background: `${statusConfig.color}20`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusConfig.color }}><Package size={24} /></div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>{permit.spaceName || 'Sin nombre'}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{permit.entrySupervisor || 'Sin supervisor'} • {permit.createdAt ? new Date(permit.createdAt).toLocaleDateString() : 'Sin fecha'}</p>
                    </div>
                </div>
                <span style={{ padding: '0.35rem 0.75rem', background: `${statusConfig.color}20`, color: statusConfig.color, borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800 }}>{statusConfig.label}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button onClick={onEdit} className="btn-secondary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>Ver / Editar</button>
                <button onClick={onShare} style={{ padding: '0.6rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Share2 size={16} />
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>PDF</span>
                </button>
            </div>
        </div>
    );
}
