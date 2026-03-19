import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, ClipboardCheck, Calendar, User,
    AlertTriangle, CheckCircle2, Clock, Share2, Printer, Trash2
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import AuditPdf from '../components/AuditPdf';

const AUDIT_TYPES = [
    { id: 'internal', name: 'Auditoría Interna', icon: '📋' },
    { id: 'external', name: 'Auditoría Externa', icon: '🏢' },
    { id: 'certification', name: 'Certificación', icon: '📜' },
    { id: 'surveillance', name: 'Seguimiento', icon: '👁️' },
    { id: 'compliance', name: 'Cumplimiento Legal', icon: '⚖️' },
    { id: 'supplier', name: 'Proveedor', icon: '🤝' }
];

const AUDIT_STATUS = {
    draft: { label: 'BORRADOR', color: '#6b7280' },
    planned: { label: 'PLANIFICADA', color: '#3b82f6' },
    in_progress: { label: 'EN CURSO', color: '#f59e0b' },
    completed: { label: 'COMPLETADA', color: '#16a34a' },
    cancelled: { label: 'CANCELADA', color: '#dc2626' }
};

export default function AuditHistory() {
    useDocumentTitle('Historial de Auditorías');
    const navigate = useNavigate();

    const [audits, setAudits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('ehs_audits_db') || '[]');
        setAudits(stored);
    }, []);

    const filteredAudits = audits.filter(audit => {
        const matchesSearch = audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            audit.leadAuditor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            audit.location?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || audit.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: audits.length,
        completed: audits.filter(a => a.status === 'completed').length,
        inProgress: audits.filter(a => a.status === 'in_progress').length,
        planned: audits.filter(a => a.status === 'planned').length
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <ShareModal
                open={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Informe Auditoría - ${shareItem?.auditTitle || shareItem?.title || ''}`}
                text={shareItem ? `📋 Informe de Auditoría EHS\n📌 Título: ${shareItem.auditTitle || shareItem.title}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${shareItem.date || shareItem.scheduledDate}` : ''}
                elementIdToPrint="pdf-content"
            />

            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <AuditPdf data={shareItem} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/audit')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-full)', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Historial de Auditorías</h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{stats.total} registros • {stats.completed} completadas</p>
                    </div>
                </div>
                <button onClick={() => navigate('/audit/new')} className="btn-primary" style={{ margin: 0, padding: '0.75rem 1.25rem' }}>
                    Nueva Auditoría
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<ClipboardCheck size={20} />} />
                <StatCard label="Completadas" value={stats.completed} color="#16a34a" icon={<CheckCircle2 size={20} />} />
                <StatCard label="En Curso" value={stats.inProgress} color="#f59e0b" icon={<Clock size={20} />} />
                <StatCard label="Planificadas" value={stats.planned} color="#3b82f6" icon={<Calendar size={20} />} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por título, auditor, ubicación..."
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
                    {Object.entries(AUDIT_STATUS).map(([key, value]) => (
                        <option key={key} value={key}>{value.label}</option>
                    ))}
                </select>
            </div>

            {/* Audits List */}
            {filteredAudits.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <ClipboardCheck size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>No hay auditorías registradas</p>
                    <button onClick={() => navigate('/audit/new')} className="btn-primary" style={{ marginTop: '1rem' }}>
                        Crear Primera Auditoría
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredAudits.map(audit => (
                        <AuditCard 
                            key={audit.id} 
                            audit={audit} 
                            onEdit={() => navigate(`/audit/new`, { state: { editData: audit } })}
                            onShare={() => setShareItem(audit)}
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

function AuditCard({ audit, onEdit, onShare }) {
    const statusConfig = AUDIT_STATUS[audit.status] || AUDIT_STATUS.draft;
    const auditType = AUDIT_TYPES.find(t => t.id === (audit.auditType || audit.type));

    return (
        <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', background: `${statusConfig.color}20`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusConfig.color, fontSize: '1.5rem' }}>
                        {auditType?.icon || '📋'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>{audit.auditTitle || audit.title}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {audit.location || 'Sin ubicación'} • {audit.leadAuditor || 'Sin auditor'} • {audit.date || (audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString() : 'Sin fecha')}
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
