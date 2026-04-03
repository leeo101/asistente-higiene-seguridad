import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, ClipboardCheck, Eye, Trash2, Printer, FileText } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import AuditPdf from '../components/AuditPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';

const AUDIT_TYPES = [{ id: 'internal', name: 'Interna', icon: '📋' }, { id: 'external', name: 'Externa', icon: '🏢' }, { id: 'certification', name: 'Certificación', icon: '📜' }, { id: 'surveillance', name: 'Seguimiento', icon: '👁️' }];
const STATUS = { draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' }, planned: { label: 'PLANIFICADA', color: '#3b82f6', bg: '#eff6ff' }, in_progress: { label: 'EN CURSO', color: '#f59e0b', bg: '#fffbeb' }, completed: { label: 'COMPLETADA', color: '#16a34a', bg: '#f0fdf4' } };

export default function AuditPage(): React.ReactElement | null {
    const navigate = useNavigate();
    const [audits, setAudits] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<any>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); h(); window.addEventListener('resize', h); const s = localStorage.getItem('ehs_audits_db'); if (s) setAudits(JSON.parse(s)); return () => window.removeEventListener('resize', h); }, []);
    const save = (d: any[]) => { localStorage.setItem('ehs_audits_db', JSON.stringify(d)); setAudits(d); };
    const updateStatus = (id: string, s: string) => save(audits.map((a: any) => a.id === id ? { ...a, status: s } : a));
    const del = (id: string) => { if (confirm('¿Eliminar?')) save(audits.filter((a: any) => a.id !== id)); };
    const filtered = audits.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const stats = { total: audits.length, inProgress: audits.filter(a => a.status === 'in_progress').length, completed: audits.filter(a => a.status === 'completed').length, planned: audits.filter(a => a.status === 'planned').length };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', paddingBottom: isMobile ? '80px' : '2rem' }}>
            <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: isMobile ? '1rem' : '1.5rem', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900 }}><ClipboardCheck size={isMobile ? 20 : 24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Auditorías EHS</h1>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>ISO 45001 • {stats.inProgress} en curso</p>
                    </div>
                    <button onClick={() => navigate('/audit/new')} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0.75rem 1.25rem', display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={20} strokeWidth={2.5} />Nueva Auditoría</button>
                </div>
            </div>
            <div style={{ marginTop: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem', padding: isMobile ? '1rem' : '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<ClipboardCheck size={20} />} />
                <StatCard label="En Curso" value={stats.inProgress} color="#f59e0b" icon={<Clock size={20} />} />
                <StatCard label="Planificadas" value={stats.planned} color="#3b82f6" icon={<Calendar size={20} />} />
                <StatCard label="Completadas" value={stats.completed} color="#16a34a" icon={<CheckCircle2 size={20} />} />
            </div>
            {isMobile && (<div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.75rem' }}><div style={{ flex: 1, position: 'relative' }}><Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '0.95rem' }} /></div><button onClick={() => navigate('/audit/new')} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></button></div>)}
            <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.length === 0 ? (
                    <EmptyStateIllustrated 
                        title="Sin Auditorías"
                        description="Planificá y gestioná auditorías ISO o internas para asegurar el cumplimiento normativo."
                        onAction={() => navigate('/audit/new')}
                        icon={<FileText />}
                    />
                ) : filtered.map(a => (<AuditCard key={a.id} audit={a} statusConfig={(STATUS as any)[a.status] || STATUS.planned} onStart={() => updateStatus(a.id, 'in_progress')} onComplete={() => updateStatus(a.id, 'completed')} onView={() => setSelected(a)} onDelete={() => del(a.id)} isMobile={isMobile} />))}
            </div>
            </div>
            {selected && <DetailModal audit={selected} onClose={() => setSelected(null)} isMobile={isMobile} onPrint={() => setShowShareModal(true)} />}

            {/* @ts-ignore */}
            <ShareModal 
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                elementIdToPrint="pdf-content"
                title="Informe de Auditoría"
                fileName={`Auditoria_${selected?.title || 'Sin_Titulo'}.pdf`}
            />

            <div className="print-only" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <AuditPdf data={selected} />
            </div>
        </div>
    );
}
function StatCard({ label, value, color, icon }: any) { return (<div className="card" style={{ padding: '1.25rem', background: 'var(--gradient-card)', border: '1px solid var(--glass-border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ width: '48px', height: '48px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{icon}</div><div><div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</div><div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div></div></div>); }
function AuditCard({ audit, statusConfig, onStart, onComplete, onView, onDelete, isMobile }: any) { return (<div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${statusConfig.color}` }}><div style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', background: `${statusConfig.color}15`, borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${statusConfig.color}`, flexShrink: 0 }}><ClipboardCheck size={isMobile ? 20 : 24} color={statusConfig.color} /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}><h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>{AUDIT_TYPES.find((t: any) => t.id === audit.auditType)?.icon} {audit.title}</h3><span style={{ padding: '0.25rem 0.65rem', background: statusConfig.bg, color: statusConfig.color, borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>{statusConfig.label}</span></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.5rem' : '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><span>👤 {audit.auditor || '-'}</span><span>📍 {audit.location || '-'}</span><span>📅 {audit.date ? new Date(audit.date).toLocaleDateString('es-AR') : '-'}</span></div></div><div style={{ display: 'flex', gap: '0.5rem' }}>{audit.status === 'planned' && <button onClick={onStart} style={{ padding: '0.5rem', background: '#3b82f6', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><Clock size={isMobile ? 16 : 18} /></button>}{audit.status === 'in_progress' && <button onClick={onComplete} style={{ padding: '0.5rem', background: '#16a34a', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#fff' }}><CheckCircle2 size={isMobile ? 16 : 18} /></button>}<button onClick={onView} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-primary)' }}><Eye size={isMobile ? 16 : 18} /></button><button onClick={onDelete} style={{ padding: '0.5rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={isMobile ? 16 : 18} /></button></div></div>); }

function DetailModal({ audit, onClose, isMobile, onPrint }: any) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="card" style={{ width: isMobile ? '100%' : '100%', maxWidth: isMobile ? '100%' : '600px', maxHeight: isMobile ? '90vh' : '90vh', overflow: 'auto', margin: isMobile ? 0 : 'auto', borderRadius: isMobile ? '20px 20px 0 0' : 'var(--radius-2xl)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Detalle de Auditoría</h2>
                    <button onClick={onClose} style={{ padding: '0.5rem', background: 'var(--color-background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}>
                        <XCircle size={24} />
                    </button>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--color-background)', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                    <ClipboardCheck size={40} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{audit.title}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{audit.auditor}</div>
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
