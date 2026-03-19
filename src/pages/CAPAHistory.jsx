import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Search, ClipboardCheck, Calendar, User,
    AlertTriangle, CheckCircle2, Clock, Target, Share2, Printer, Trash2
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import CAPAPdf from '../components/CAPAPdf';

const CAPA_TYPES = [
    { id: 'corrective', name: 'Acción Correctiva', icon: '🔧' },
    { id: 'preventive', name: 'Acción Preventiva', icon: '🛡️' },
    { id: 'improvement', name: 'Mejora Continua', icon: '📈' },
    { id: 'containment', name: 'Contención', icon: '🚨' }
];

const CAPA_STATUS = {
    draft: { label: 'BORRADOR', color: '#6b7280' },
    open: { label: 'ABIERTA', color: '#dc2626' },
    analysis: { label: 'EN ANÁLISIS', color: '#f59e0b' },
    in_progress: { label: 'EN PROGRESO', color: '#3b82f6' },
    review: { label: 'EN REVISIÓN', color: '#8b5cf6' },
    completed: { label: 'COMPLETADA', color: '#16a34a' },
    closed: { label: 'CERRADA', color: '#059669' }
};

const PRIORITY = {
    critical: { label: 'CRÍTICA', color: '#dc2626', icon: '🔴' },
    high: { label: 'ALTA', color: '#f59e0b', icon: '🟠' },
    medium: { label: 'MEDIA', color: '#3b82f6', icon: '🔵' },
    low: { label: 'BAJA', color: '#16a34a', icon: '🟢' }
};

export default function CAPAHistory() {
    useDocumentTitle('Historial CAPA');
    
    const [capas, setCapas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('ehs_capa_db') || '[]');
        setCapas(stored);
    }, []);

    const filteredCapas = capas.filter(capa => {
        const matchesSearch = capa.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            capa.responsible?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || capa.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: capas.length,
        open: capas.filter(c => c.status === 'open' || c.status === 'in_progress').length,
        completed: capas.filter(c => c.status === 'completed' || c.status === 'closed').length,
        overdue: capas.filter(c => c.dueDate && new Date(c.dueDate) < new Date() && c.status !== 'closed').length
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <ShareModal
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Acción CAPA - ${shareItem?.title || shareItem?.description?.slice(0, 20) || ''}...`}
                text={shareItem ? `🛡️ Acción Correctiva / Preventiva (CAPA)\n📝 Hallazgo: ${shareItem.title || shareItem.description}\n📍 Origen: ${shareItem.source}\n📅 Fecha: ${shareItem.date}` : ''}
                elementIdToPrint="pdf-content"
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <CAPAPdf data={shareItem} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/capa')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-full)', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Historial CAPA</h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{stats.total} registros • {stats.open} abiertas</p>
                    </div>
                </div>
                <button onClick={() => navigate('/capa/new')} className="btn-primary" style={{ margin: 0, padding: '0.75rem 1.25rem' }}>
                    Nueva CAPA
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<ClipboardCheck size={20} />} />
                <StatCard label="Abiertas" value={stats.open} color="#f59e0b" icon={<Clock size={20} />} />
                <StatCard label="Cerradas" value={stats.completed} color="#16a34a" icon={<CheckCircle2 size={20} />} />
                <StatCard label="Vencidas" value={stats.overdue} color="#dc2626" icon={<AlertTriangle size={20} />} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por título, responsable..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none' }}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
                >
                    <option value="all">Todos los Estados</option>
                    {Object.entries(CAPA_STATUS).map(([key, value]) => (
                        <option key={key} value={key}>{value.label}</option>
                    ))}
                </select>
            </div>

            {/* CAPA List */}
            {filteredCapas.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <ClipboardCheck size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>No hay CAPA registradas</p>
                    <button onClick={() => navigate('/capa/new')} className="btn-primary" style={{ marginTop: '1rem' }}>
                        Crear Primera CAPA
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredCapas.map(capa => (
                        <CapaCard 
                            key={capa.id} 
                            capa={capa} 
                            onEdit={() => navigate(`/capa/new`, { state: { editData: capa } })}
                            onShare={() => setShareItem(capa)}
                        />
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

function CapaCard({ capa, onEdit, onShare }) {
    const statusConfig = CAPA_STATUS[capa.status] || CAPA_STATUS.draft;
    const capaType = CAPA_TYPES.find(t => t.id === (capa.capaType || capa.type));
    const priorityConfig = PRIORITY[capa.priority] || PRIORITY.medium;
    const isOverdue = capa.dueDate && new Date(capa.dueDate) < new Date() && capa.status !== 'closed';

    return (
        <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', background: `${priorityConfig.color}20`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        {priorityConfig.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>{capaType?.icon} {capa.title || capa.description}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {capaType?.name} • {capa.responsible || 'Sin responsable'} {isOverdue && <span style={{ color: '#dc2626', fontWeight: 700 }}> • ⚠️ Vencida</span>}
                        </p>
                    </div>
                </div>
                <span style={{ padding: '0.35rem 0.75rem', background: `${statusConfig.color}20`, color: statusConfig.color, borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {statusConfig.label}
                </span>
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
