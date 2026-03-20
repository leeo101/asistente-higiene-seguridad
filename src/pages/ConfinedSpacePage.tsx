import React from 'react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, Tent, Eye, Trash2, Wind, Droplets, Printer } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';

const PERMIT_STATUS = {
    draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
    pending: { label: 'PENDIENTE', color: '#f59e0b', bg: '#fffbeb' },
    active: { label: 'ACTIVO', color: '#16a34a', bg: '#f0fdf4' },
    completed: { label: 'COMPLETADO', color: '#3b82f6', bg: '#eff6ff' }
};

export default function ConfinedSpacePage(): React.ReactElement | null {
        const [permits, setPermits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPermit, setSelectedPermit] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        const saved = localStorage.getItem('confined_space_permits_db');
        if (saved) setPermits(JSON.parse(saved));
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const savePermits = (data) => { localStorage.setItem('confined_space_permits_db', JSON.stringify(data)); setPermits(data); };

    const updateStatus = (id, status) => { savePermits(permits.map(p => p.id === id ? { ...p, status } : p)); };
    const deletePermit = (id) => { if (confirm('¿Eliminar este permiso?')) savePermits(permits.filter(p => p.id !== id)); };

    const filtered = permits.filter(p => p.spaceName.toLowerCase().includes(searchTerm.toLowerCase()) || p.location?.toLowerCase().includes(searchTerm.toLowerCase()));
    const stats = { total: permits.length, active: permits.filter(p => p.status === 'active').length, pending: permits.filter(p => p.status === 'pending').length, completed: permits.filter(p => p.status === 'completed').length };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: isMobile ? '80px' : '2rem' }}>
            <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: isMobile ? '1rem' : '1.5rem', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900 }}><Tent size={isMobile ? 20 : 24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Espacios Confinados</h1>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>OSHA 1910.146 • {stats.active} activos</p>
                    </div>
                    <button onClick={() => navigate('/confined-space/new')} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0.75rem 1.25rem', display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={20} strokeWidth={2.5} />Nuevo Permiso</button>
                </div>
            </div>

            <div style={{ marginTop: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem', padding: isMobile ? '1rem' : '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<Tent size={20} />} />
                <StatCard label="Activos" value={stats.active} color="#16a34a" icon={<CheckCircle2 size={20} />} />
                <StatCard label="Pendientes" value={stats.pending} color="#f59e0b" icon={<Clock size={20} />} />
                <StatCard label="Completados" value={stats.completed} color="#8b5cf6" icon={<CheckCircle2 size={20} />} />
            </div>

            {isMobile && (
                <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '0.95rem' }} />
                    </div>
                    <button onClick={() => navigate('/confined-space/new')} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></button>
                </div>
            )}

            <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.length === 0 ? <EmptyState onAdd={() => navigate('/confined-space/new')} isMobile={isMobile} /> : filtered.map(p => (
                    <PermitCard key={p.id} permit={p} statusConfig={PERMIT_STATUS[p.status] || PERMIT_STATUS.pending} onStart={() => updateStatus(p.id, 'active')} onComplete={() => updateStatus(p.id, 'completed')} onView={() => setSelectedPermit(p)} onDelete={() => deletePermit(p.id)} isMobile={isMobile} />
                ))}
            </div>

            </div>

            {selectedPermit && <DetailModal permit={selectedPermit} onClose={() => setSelectedPermit(null)} isMobile={isMobile} onPrint={() => setShowShareModal(true)} />}

            <ShareModal 
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Permiso de Ingreso"
                fileName={`Permiso_${selectedPermit?.spaceName || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <ConfinedSpacePdf data={selectedPermit} />
            </div>
        </div>
    );
}

function StatCard({ label, value, color, icon }) {
    return (<div className="card" style={{ padding: '1.25rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{icon}</div><div><div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</div><div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div></div></div>);
}

function PermitCard({ permit, statusConfig, onStart, onComplete, onView, onDelete, isMobile }) {
    return (
        <div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${statusConfig.color}` }}>
            <div style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', background: `${statusConfig.color}15`, borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${statusConfig.color}`, flexShrink: 0 }}><Tent size={isMobile ? 20 : 24} color={statusConfig.color} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>{permit.spaceName}</h3>
                    <span style={{ padding: '0.25rem 0.65rem', background: statusConfig.bg, color: statusConfig.color, borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>{statusConfig.label}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.5rem' : '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <span>📍 {permit.location || 'Sin ubicación'}</span>
                    <span>👤 {permit.worker || 'Sin trabajador'}</span>
                    <span>👁️ {permit.attendant || 'Sin vigía'}</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {permit.status === 'pending' && <button onClick={onStart} style={{ padding: '0.5rem', background: '#16a34a', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><CheckCircle2 size={isMobile ? 16 : 18} /></button>}
                {permit.status === 'active' && <button onClick={onComplete} style={{ padding: '0.5rem', background: '#3b82f6', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><CheckCircle2 size={isMobile ? 16 : 18} /></button>}
                <button onClick={onView} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-primary)' }}><Eye size={isMobile ? 16 : 18} /></button>
                <button onClick={onDelete} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={isMobile ? 16 : 18} /></button>
            </div>
        </div>
    );
}

function EmptyState({ onAdd, isMobile }) {
    return (<div style={{ padding: isMobile ? '3rem 1rem' : '4rem 2rem', textAlign: 'center', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', border: '2px dashed var(--color-border)' }}><div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'var(--color-background)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tent size={40} color="var(--color-text-muted)" /></div><h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Sin Permisos</h3><p style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Creá permisos de espacio confinado según OSHA 1910.146</p><button onClick={onAdd} className="btn-primary" style={{ width: 'auto', margin: 0 }}><Plus size={20} style={{ marginRight: '0.5rem' }} />Primer Permiso</button></div>);
}

function DetailModal({ permit, onClose, isMobile, onPrint }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="card" style={{ width: isMobile ? '100%' : '100%', maxWidth: isMobile ? '100%' : '600px', maxHeight: isMobile ? '90vh' : '90vh', overflow: 'auto', margin: isMobile ? 0 : 'auto', borderRadius: isMobile ? '20px 20px 0 0' : 'var(--radius-2xl)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Detalle del Permiso</h2>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}>
                        <XCircle size={24} />
                    </button>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--color-background)', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                    <Tent size={40} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{permit.spaceName}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{permit.location}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', padding: '1rem 0' }}>
                    <button 
                        onClick={onPrint} 
                        style={{ 
                            flex: 1, 
                            padding: '1rem', 
                            background: 'var(--color-surface)', 
                            border: '1px solid var(--color-primary)', 
                            borderRadius: 'var(--radius-lg)', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Printer size={18} />
                        Imprimir / PDF
                    </button>
                    <button onClick={onClose} className="btn-primary" style={{ flex: 1, margin: 0 }}>Cerrar</button>
                </div>
            </div>
        </div>
    );
}

