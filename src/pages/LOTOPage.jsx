import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Plus, Search, CheckCircle2, XCircle,
    Clock, Lock, FileText, Eye, Trash2
} from 'lucide-react';

const LOTO_STATUS = {
    draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
    pending: { label: 'PENDIENTE', color: '#f59e0b', bg: '#fffbeb' },
    active: { label: 'ACTIVO', color: '#16a34a', bg: '#f0fdf4' },
    completed: { label: 'COMPLETADO', color: '#3b82f6', bg: '#eff6ff' }
};

export default function LOTOPage() {
    const navigate = useNavigate();
    const [procedures, setProcedures] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProcedure, setSelectedProcedure] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        
        const saved = localStorage.getItem('loto_procedures_db');
        if (saved) setProcedures(JSON.parse(saved));
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const saveProcedures = (data) => {
        localStorage.setItem('loto_procedures_db', JSON.stringify(data));
        setProcedures(data);
    };

    const startLOTO = (id) => {
        const updated = procedures.map(p => p.id === id ? { ...p, status: 'active' } : p);
        saveProcedures(updated);
    };

    const completeLOTO = (id) => {
        const updated = procedures.map(p => p.id === id ? { ...p, status: 'completed', completedAt: new Date().toISOString() } : p);
        saveProcedures(updated);
    };

    const deleteProcedure = (id) => {
        if (confirm('¿Eliminar este procedimiento LOTO?')) {
            saveProcedures(procedures.filter(p => p.id !== id));
        }
    };

    const filteredProcedures = procedures.filter(p =>
        p.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: procedures.length,
        active: procedures.filter(p => p.status === 'active').length,
        pending: procedures.filter(p => p.status === 'pending').length,
        completed: procedures.filter(p => p.status === 'completed').length
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: isMobile ? '80px' : '2rem' }}>
            {/* Header */}
            <div style={{
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                padding: isMobile ? '1rem' : '1.5rem',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900 }}>
                            <Lock size={isMobile ? 20 : 24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            LOTO - Lockout/Tagout
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            OSHA 1910.147 • {stats.active} activos
                        </p>
                    </div>
                    <button onClick={() => navigate('/loto/new')} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0.75rem 1.25rem', display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} strokeWidth={2.5} />
                        Nuevo Procedimiento
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem', padding: isMobile ? '1rem' : '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<FileText size={20} />} />
                <StatCard label="Activos" value={stats.active} color="#16a34a" icon={<Lock size={20} />} />
                <StatCard label="Pendientes" value={stats.pending} color="#f59e0b" icon={<Clock size={20} />} />
                <StatCard label="Completados" value={stats.completed} color="#8b5cf6" icon={<CheckCircle2 size={20} />} />
            </div>

            {/* Search & Add Mobile */}
            {isMobile && (
                <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '0.95rem' }} />
                    </div>
                    <button onClick={() => navigate('/loto/new')} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={20} />
                    </button>
                </div>
            )}

            {/* Procedures List */}
            <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredProcedures.length === 0 ? (
                    <EmptyState onAdd={() => navigate('/loto/new')} isMobile={isMobile} />
                ) : (
                    filteredProcedures.map(p => (
                        <ProcedureCard
                            key={p.id}
                            procedure={p}
                            statusConfig={LOTO_STATUS[p.status] || LOTO_STATUS.pending}
                            onStart={() => startLOTO(p.id)}
                            onComplete={() => completeLOTO(p.id)}
                            onView={() => setSelectedProcedure(p)}
                            onDelete={() => deleteProcedure(p.id)}
                            isMobile={isMobile}
                        />
                    ))
                )}
            </div>

            {selectedProcedure && (
                <DetailModal
                    procedure={selectedProcedure}
                    onClose={() => setSelectedProcedure(null)}
                    isMobile={isMobile}
                />
            )}
        </div>
    );
}

function StatCard({ label, value, color, icon }) {
    return (
        <div className="card" style={{ padding: '1.25rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div>
            </div>
        </div>
    );
}

function ProcedureCard({ procedure, statusConfig, onStart, onComplete, onView, onDelete, isMobile }) {
    return (
        <div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${statusConfig.color}` }}>
            <div style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', background: `${statusConfig.color}15`, borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${statusConfig.color}`, flexShrink: 0 }}>
                <Lock size={isMobile ? 20 : 24} color={statusConfig.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>{procedure.equipmentName}</h3>
                    <span style={{ padding: '0.25rem 0.65rem', background: statusConfig.bg, color: statusConfig.color, borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>{statusConfig.label}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.5rem' : '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <span>📍 {procedure.location || 'Sin ubicación'}</span>
                    <span>👤 {procedure.supervisor || 'Sin supervisor'}</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {procedure.status === 'pending' && <button onClick={onStart} style={{ padding: '0.5rem', background: '#16a34a', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><Lock size={isMobile ? 16 : 18} /></button>}
                {procedure.status === 'active' && <button onClick={onComplete} style={{ padding: '0.5rem', background: '#3b82f6', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><CheckCircle2 size={isMobile ? 16 : 18} /></button>}
                <button onClick={onView} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-primary)' }}><Eye size={isMobile ? 16 : 18} /></button>
                <button onClick={onDelete} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={isMobile ? 16 : 18} /></button>
            </div>
        </div>
    );
}

function EmptyState({ onAdd, isMobile }) {
    return (
        <div style={{ padding: isMobile ? '3rem 1rem' : '4rem 2rem', textAlign: 'center', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', border: '2px dashed var(--color-border)' }}>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'var(--color-background)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={40} color="var(--color-text-muted)" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Sin Procedimientos LOTO</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Creá procedimientos de Lockout/Tagout según OSHA 1910.147</p>
            <button onClick={onAdd} className="btn-primary" style={{ width: 'auto', margin: 0 }}><Plus size={20} style={{ marginRight: '0.5rem' }} />Primer Procedimiento</button>
        </div>
    );
}

function DetailModal({ procedure, onClose, isMobile }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="card" style={{ width: isMobile ? '100%' : '100%', maxWidth: isMobile ? '100%' : '600px', maxHeight: isMobile ? '90vh' : '90vh', overflow: 'auto', margin: isMobile ? 0 : 'auto', borderRadius: isMobile ? '20px 20px 0 0' : 'var(--radius-2xl)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Detalle LOTO</h2>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}><XCircle size={24} /></button>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem' }}>
                    <Lock size={40} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 100, color: 'var(--color-text)' }}>{procedure.equipmentName}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{procedure.location}</div>
                </div>
                <button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>Cerrar</button>
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-input-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500, outline: 'none', boxSizing: 'border-box' };
