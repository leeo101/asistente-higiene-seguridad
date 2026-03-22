import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Lock, AlertTriangle, CheckCircle2, Key, Share2, Printer, Trash2 } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import LOTOPdf from '../components/LOTOPdf';

const LOTO_STATUS = {
    active: { label: 'ACTIVO', color: '#dc2626' },
    completed: { label: 'COMPLETADO', color: '#16a34a' },
    cancelled: { label: 'CANCELADO', color: '#6b7280' }
};

export default function LOTOHistory() {
    useDocumentTitle('LOTO - Bloqueo/Etiquetado');
    const navigate = useNavigate();
    const [procedures, setProcedures] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [shareItem, setShareItem] = useState(null);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('loto_procedures_db') || '[]');
        setProcedures(stored);
    }, []);

    const filteredProcedures = procedures.filter(proc => {
        const matchesSearch = (proc.equipmentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (proc.location || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || proc.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: procedures.length,
        active: procedures.filter(p => p.status === 'active').length,
        completed: procedures.filter(p => p.status === 'completed').length
    };

    const shareText = useMemo(() => {
        if (!shareItem) return '';
        const dateStr = new Date(shareItem.createdAt || Date.now()).toLocaleDateString();
        return `🔐 Bloqueo y Etiquetado (LOTO)\n⚙️ Equipo: ${shareItem.equipmentName}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${dateStr}`;
    }, [shareItem]);

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>
            <ShareModal
                isOpen={!!shareItem}
                onClose={() => setShareItem(null)}
                title={`Bloqueo LOTO - ${shareItem?.equipmentName || ''}`}
                text={shareText}
                elementIdToPrint="pdf-content"
                fileName={`LOTO_${shareItem?.equipmentName || 'Sin_Nombre'}.pdf`}
            />

            <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
                {shareItem && <LOTOPdf data={shareItem} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/loto')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-full)', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>LOTO - Bloqueo/Etiquetado</h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{stats.total} procedimientos • {stats.active} activos</p>
                    </div>
                </div>
                <button onClick={() => navigate('/loto/new')} className="btn-primary" style={{ margin: 0, padding: '0.75rem 1.25rem' }}>
                    Nuevo Procedimiento
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<Lock size={20} />} />
                <StatCard label="Activos" value={stats.active} color="#dc2626" icon={<AlertTriangle size={20} />} />
                <StatCard label="Completados" value={stats.completed} color="#16a34a" icon={<CheckCircle2 size={20} />} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" placeholder="Buscar por equipo, ubicación..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                    <option value="all">Todos los Estados</option>
                    {Object.entries(LOTO_STATUS).map(([key, value]) => (<option key={key} value={key}>{value.label}</option>))}
                </select>
            </div>

            {filteredProcedures.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Lock size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>No hay procedimientos LOTO</p>
                    <button onClick={() => navigate('/loto/new')} className="btn-primary" style={{ marginTop: '1rem' }}>Crear Primer Procedimiento</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredProcedures.map(proc => (
                        <ProcedureCard 
                            key={proc.id} 
                            procedure={proc} 
                            onEdit={() => navigate(`/loto/new`, { state: { editData: proc } })}
                            onShare={() => setShareItem(proc)}
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

function ProcedureCard({ procedure, onEdit, onShare }) {
    const statusConfig = LOTO_STATUS[procedure.status] || LOTO_STATUS.completed;
    return (
        <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', background: `${statusConfig.color}20`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusConfig.color }}><Key size={24} /></div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>{procedure.equipmentName || 'Sin equipo'}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{procedure.location || 'Sin ubicación'} • {procedure.energyTypes?.length || 0} energías</p>
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
