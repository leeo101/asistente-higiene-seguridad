import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, RefreshCw, Eye, Trash2, Target, Printer } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import CAPAPdf from '../components/CAPAPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';

const CAPA_TYPES = [{ id: 'corrective', name: 'Correctiva', icon: '🔧' }, { id: 'preventive', name: 'Preventiva', icon: '🛡️' }, { id: 'improvement', name: 'Mejora', icon: '📈' }, { id: 'containment', name: 'Contención', icon: '🚨' }];
const PRIORITY = { critical: { label: 'CRÍTICA', color: '#dc2626', days: 3, icon: '🔴' }, high: { label: 'ALTA', color: '#f59e0b', days: 7, icon: '🟠' }, medium: { label: 'MEDIA', color: '#3b82f6', days: 15, icon: '🔵' }, low: { label: 'BAJA', color: '#16a34a', days: 30, icon: '🟢' } };
const STATUS = { draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' }, open: { label: 'ABIERTA', color: '#dc2626', bg: '#fef2f2' }, in_progress: { label: 'EN PROGRESO', color: '#3b82f6', bg: '#eff6ff' }, completed: { label: 'COMPLETADA', color: '#16a34a', bg: '#f0fdf4' } };

export default function CAPAPage(): React.ReactElement | null {
    const navigate = useNavigate();
    const [capas, setCapas] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<any>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); h(); window.addEventListener('resize', h); const s = localStorage.getItem('ehs_capa_db'); if (s) setCapas(JSON.parse(s)); return () => window.removeEventListener('resize', h); }, []);
    const save = (d: any[]) => { localStorage.setItem('ehs_capa_db', JSON.stringify(d)); setCapas(d); };
    const updateStatus = (id: string, s: string) => save(capas.map((c: any) => c.id === id ? { ...c, status: s } : c));
    const del = (id: string) => { if (confirm('¿Eliminar?')) save(capas.filter((c: any) => c.id !== id)); };
    const filtered = capas.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.responsible?.toLowerCase().includes(searchTerm.toLowerCase()));
    const stats = { total: capas.length, open: capas.filter(c => c.status === 'open' || c.status === 'in_progress').length, completed: capas.filter(c => c.status === 'completed').length, critical: capas.filter(c => c.priority === 'critical' && c.status !== 'completed').length };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: isMobile ? '80px' : '2rem' }}>
            <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: isMobile ? '1rem' : '1.5rem', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900 }}><RefreshCw size={isMobile ? 20 : 24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />CAPA</h1>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Acciones Correctivas/Preventivas • {stats.open} abiertas</p>
                    </div>
                    <button onClick={() => navigate('/capa/new')} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0.75rem 1.25rem', display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={20} strokeWidth={2.5} />Nueva CAPA</button>
                </div>
            </div>
            <div style={{ marginTop: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem', padding: isMobile ? '1rem' : '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<RefreshCw size={20} />} />
                <StatCard label="Abiertas" value={stats.open} color="#f59e0b" icon={<Clock size={20} />} />
                <StatCard label="Críticas" value={stats.critical} color="#dc2626" icon={<AlertTriangle size={20} />} />
                <StatCard label="Completadas" value={stats.completed} color="#16a34a" icon={<CheckCircle2 size={20} />} />
            </div>
            {isMobile && (<div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.75rem' }}><div style={{ flex: 1, position: 'relative' }}><Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '0.95rem' }} /></div><button onClick={() => navigate('/capa/new')} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></button></div>)}
            <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.length === 0 ? (
                    <EmptyStateIllustrated 
                        title="Sin Acciones CAPA"
                        description="Creá Acciones Correctivas/Preventivas para el proceso de mejora continua y control de riesgos."
                        onAction={() => navigate('/capa/new')}
                        icon={<RefreshCw />}
                    />
                ) : filtered.map(c => (<CapaCard key={c.id} capa={c} statusConfig={(STATUS as any)[c.status] || STATUS.open} priorityConfig={(PRIORITY as any)[c.priority] || PRIORITY.medium} onStart={() => updateStatus(c.id, 'in_progress')} onComplete={() => updateStatus(c.id, 'completed')} onView={() => setSelected(c)} onDelete={() => del(c.id)} isMobile={isMobile} />))}
            </div>
            </div>
            {selected && <DetailModal capa={selected} onClose={() => setSelected(null)} isMobile={isMobile} onPrint={() => setShowShareModal(true)} />}

            {/* @ts-ignore */}
            <ShareModal 
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Acción Correctiva/Preventiva"
                fileName={`CAPA_${selected?.title || 'Sin_Titulo'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <CAPAPdf data={selected} />
            </div>
        </div>
    );
}
function StatCard({ label, value, color, icon }: any) { return (<div className="card" style={{ padding: '1.25rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{icon}</div><div><div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</div><div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div></div></div>); }
function CapaCard({ capa, statusConfig, priorityConfig, onStart, onComplete, onView, onDelete, isMobile }: any) { return (<div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${statusConfig.color}` }}><div style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', background: `${priorityConfig.color}15`, borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px solid ${priorityConfig.color}`, flexShrink: 0 }}><span style={{ fontSize: '1.5rem' }}>{priorityConfig.icon}</span></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}><h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>{(CAPA_TYPES.find((t: any) => t.id === capa.capaType) as any)?.icon} {capa.title}</h3><span style={{ padding: '0.25rem 0.65rem', background: statusConfig.bg, color: statusConfig.color, borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>{statusConfig.label}</span></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.5rem' : '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><span>👤 {capa.responsible || '-'}</span><span>📅 {capa.dueDate ? new Date(capa.dueDate).toLocaleDateString('es-AR') : '-'}</span><span>⏱️ {(PRIORITY as any)[capa.priority]?.days || '-'} días</span></div></div><div style={{ display: 'flex', gap: '0.5rem' }}>{capa.status === 'open' && <button onClick={onStart} style={{ padding: '0.5rem', background: '#3b82f6', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><Clock size={isMobile ? 16 : 18} /></button>}{capa.status === 'in_progress' && <button onClick={onComplete} style={{ padding: '0.5rem', background: '#16a34a', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><CheckCircle2 size={isMobile ? 16 : 18} /></button>}<button onClick={onView} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-primary)' }}><Eye size={isMobile ? 16 : 18} /></button><button onClick={onDelete} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={isMobile ? 16 : 18} /></button></div></div>); }
function DetailModal({ capa, onClose, isMobile, onPrint }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="card" style={{ width: isMobile ? '100%' : '100%', maxWidth: isMobile ? '100%' : '600px', maxHeight: isMobile ? '90vh' : '90vh', overflow: 'auto', margin: isMobile ? 0 : 'auto', borderRadius: isMobile ? '20px 20px 0 0' : 'var(--radius-2xl)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Detalle CAPA</h2>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}>
                        <XCircle size={24} />
                    </button>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--color-background)', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                    <RefreshCw size={40} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{capa.title}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{capa.responsible}</div>
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
