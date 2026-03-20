import React from 'react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, ArrowDown, Eye, Trash2, Printer } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import WorkingAtHeightPdf from '../components/WorkingAtHeightPdf';

const WORK_TYPES = [{ id: 'scaffolding', name: 'Andamios', icon: '🏗️' }, { id: 'ladder', name: 'Escalera', icon: '🪜' }, { id: 'roof', name: 'Techos', icon: '🏠' }, { id: 'platform', name: 'Plataforma', icon: '📦' }, { id: 'lift', name: 'Elevador', icon: '⬆️' }, { id: 'structure', name: 'Estructura', icon: '🔩' }];
const PRIORITY = { critical: { label: 'CRÍTICA', color: '#dc2626', days: 3 }, high: { label: 'ALTA', color: '#f59e0b', days: 7 }, medium: { label: 'MEDIA', color: '#3b82f6', days: 15 }, low: { label: 'BAJA', color: '#16a34a', days: 30 } };
const STATUS = { draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' }, open: { label: 'ABIERTA', color: '#dc2626', bg: '#fef2f2' }, in_progress: { label: 'EN PROGRESO', color: '#3b82f6', bg: '#eff6ff' }, completed: { label: 'COMPLETADA', color: '#16a34a', bg: '#f0fdf4' } };

export default function WorkingAtHeightPage(): React.ReactElement | null {
        const [permits, setPermits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        const saved = localStorage.getItem('working_at_height_permits');
        if (saved) setPermits(JSON.parse(saved));
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const save = (data) => { localStorage.setItem('working_at_height_permits', JSON.stringify(data)); setPermits(data); };
    const updateStatus = (id, s) => save(permits.map(p => p.id === id ? { ...p, status: s } : p));
    const del = (id) => { if (confirm('¿Eliminar?')) save(permits.filter(p => p.id !== id)); };
    const filtered = permits.filter(p => p.workerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const stats = { total: permits.length, open: permits.filter(p => p.status === 'open' || p.status === 'in_progress').length, completed: permits.filter(p => p.status === 'completed').length, critical: permits.filter(p => p.priority === 'critical' && p.status !== 'completed').length };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: isMobile ? '80px' : '2rem' }}>
            <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: isMobile ? '1rem' : '1.5rem', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900 }}><ArrowDown size={isMobile ? 20 : 24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Trabajo en Altura</h1>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>OSHA 1926.501 • {stats.open} activos</p>
                    </div>
                    <button onClick={() => navigate('/working-at-height/new')} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0.75rem 1.25rem', display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={20} strokeWidth={2.5} />Nuevo Permiso</button>
                </div>
            </div>
            <div style={{ marginTop: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem', padding: isMobile ? '1rem' : '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<ArrowDown size={20} />} />
                <StatCard label="Activos" value={stats.open} color="#f59e0b" icon={<Clock size={20} />} />
                <StatCard label="Críticos" value={stats.critical} color="#dc2626" icon={<AlertTriangle size={20} />} />
                <StatCard label="Completados" value={stats.completed} color="#16a34a" icon={<CheckCircle2 size={20} />} />
            </div>
            {isMobile && (<div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.75rem' }}><div style={{ flex: 1, position: 'relative' }}><Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '0.95rem' }} /></div><button onClick={() => navigate('/working-at-height/new')} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></button></div>)}
            <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.length === 0 ? <EmptyState onAdd={() => navigate('/working-at-height/new')} isMobile={isMobile} /> : filtered.map(p => (<PermitCard key={p.id} permit={p} statusConfig={STATUS[p.status] || STATUS.open} priorityConfig={PRIORITY[p.priority] || PRIORITY.medium} onStart={() => updateStatus(p.id, 'in_progress')} onComplete={() => updateStatus(p.id, 'completed')} onView={() => setSelected(p)} onDelete={() => del(p.id)} isMobile={isMobile} />))}
            </div>
            </div>
            {selected && <DetailModal permit={selected} onClose={() => setSelected(null)} isMobile={isMobile} onPrint={() => setShowShareModal(true)} />}

            <ShareModal 
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Permiso de Trabajo"
                fileName={`Permiso_Altura_${selected?.workerName || 'Sin_Nombre'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <WorkingAtHeightPdf data={selected} />
            </div>
        </div>
    );
}
function StatCard({ label, value, color, icon }) { return (<div className="card" style={{ padding: '1.25rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{icon}</div><div><div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</div><div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div></div></div>); }
function PermitCard({ permit, statusConfig, priorityConfig, onStart, onComplete, onView, onDelete, isMobile }) { return (<div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${statusConfig.color}` }}><div style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', background: `${priorityConfig.color}15`, borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px solid ${priorityConfig.color}`, flexShrink: 0 }}><span style={{ fontSize: '1.25rem' }}>{priorityConfig.icon}</span><span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, color: 'var(--color-text)' }}>{permit.height}m</span></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}><h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>{WORK_TYPES.find(t => t.id === permit.workType)?.icon} {permit.workerName}</h3><span style={{ padding: '0.25rem 0.65rem', background: statusConfig.bg, color: statusConfig.color, borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>{statusConfig.label}</span></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.5rem' : '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><span>📍 {permit.location || '-'}</span><span>📏 {permit.height}m</span><span>👤 {permit.supervisor || '-'}</span></div></div><div style={{ display: 'flex', gap: '0.5rem' }}>{permit.status === 'open' && <button onClick={onStart} style={{ padding: '0.5rem', background: '#3b82f6', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><Clock size={isMobile ? 16 : 18} /></button>}{permit.status === 'in_progress' && <button onClick={onComplete} style={{ padding: '0.5rem', background: '#16a34a', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><CheckCircle2 size={isMobile ? 16 : 18} /></button>}<button onClick={onView} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-primary)' }}><Eye size={isMobile ? 16 : 18} /></button><button onClick={onDelete} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={isMobile ? 16 : 18} /></button></div></div>); }
function EmptyState({ onAdd, isMobile }) { return (<div style={{ padding: isMobile ? '3rem 1rem' : '4rem 2rem', textAlign: 'center', background: 'var(--gradient-card)', borderRadius: 'var(--radius-2xl)', border: '2px dashed var(--color-border)' }}><div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'var(--color-background)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowDown size={40} color="var(--color-text-muted)" /></div><h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Sin Permisos</h3><p style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Creá permisos de trabajo en altura según OSHA 1926.501</p><button onClick={onAdd} className="btn-primary" style={{ width: 'auto', margin: 0 }}><Plus size={20} style={{ marginRight: '0.5rem' }} />Primer Permiso</button></div>); }
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
                    <ArrowDown size={40} color="#dc2626" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{permit.height}<span style={{ fontSize: '1.5rem' }}>m</span></div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{permit.workerName}</div>
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
