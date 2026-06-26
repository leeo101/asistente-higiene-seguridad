import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, ClipboardCheck, Eye, Trash2, Printer, FileText } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import AuditPdf from '../components/AuditPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import ConfirmModal from '../components/ConfirmModal';

const AUDIT_TYPES = [{ id: 'internal', name: 'Interna', icon: '📋' }, { id: 'external', name: 'Externa', icon: '🏢' }, { id: 'certification', name: 'Certificación', icon: '📜' }, { id: 'surveillance', name: 'Seguimiento', icon: '👁️' }];
const STATUS = { draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' }, planned: { label: 'PLANIFICADA', color: '#3b82f6', bg: '#eff6ff' }, in_progress: { label: 'EN CURSO', color: '#f59e0b', bg: '#fffbeb' }, completed: { label: 'COMPLETADA', color: '#16a34a', bg: '#f0fdf4' } };

export default function AuditPage(): React.ReactElement | null {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {const h = () => setIsMobile(window.innerWidth < 768);h();window.addEventListener('resize', h);const s = localStorage.getItem('ehs_audits_db');if (s) setAudits(JSON.parse(s));return () => window.removeEventListener('resize', h);}, []);
  const save = (d: any[]) => {localStorage.setItem('ehs_audits_db', JSON.stringify(d));setAudits(d);};
  const updateStatus = (id: string, s: string) => save(audits.map((a: any) => a.id === id ? { ...a, status: s } : a));
  const del = (id: string) => {setConfirmModal({ isOpen: true, payload: id });};
  const executeDelete = () => {if (confirmModal.payload) save(audits.filter((a: any) => a.id !== confirmModal.payload));setConfirmModal({ isOpen: false, payload: null });};
  const filtered = audits.filter((a) => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = { total: audits.length, inProgress: audits.filter((a) => a.status === 'in_progress').length, completed: audits.filter((a) => a.status === 'completed').length, planned: audits.filter((a) => a.status === 'planned').length };

  return (
    <div style={{ paddingBottom: isMobile ? '80px' : '2rem' }} className="min-h-[100vh] bg-[var(--color-background)]">
            <div style={{ padding: isMobile ? '1rem' : '1.5rem' }} className="bg-[var(--color-surface)] border-bottom-[1px_solid_var(--color-border)] sticky top-[0] z-[100] backdrop-filter-[blur(20px)]">
                <div className="flex items-center gap-[1rem] max-w-[1400px] m-[0_auto]">
                    <></>
                    <div className="flex-[1]">
                        <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} className="m-[0] font-[900]"><ClipboardCheck size={isMobile ? 20 : 24} className="display-[inline] mr-[0.5rem] vertical-align-[middle]" />Auditorías EHS</h1>
                        <p className="m-[0.25rem_0_0_0] text-[0.85rem] text-[var(--color-text-muted)]">ISO 45001 • {stats.inProgress} en curso</p>
                    </div>
                    <button onClick={() => navigate('/audit/new')} style={{ display: isMobile ? 'none' : 'flex' }} className="w-[auto] m-[0] p-[0.75rem_1.5rem] items-center gap-[0.5rem] rounded-[16px] bg-[#36B37E] text-[#fff] border-none font-[800] text-[1rem] cursor-pointer box-shadow-[0_4px_15px_rgba(54,179,126,0.3)] white-space-[nowrap]"><Plus size={20} strokeWidth={2.5} />Nueva Auditoría</button>
                </div>
            </div>
            <div style={{ marginTop: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', padding: isMobile ? '1rem' : '1.5rem' }} className="grid gap-[1rem] max-w-[1400px] m-[0_auto]">
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<ClipboardCheck size={20} />} />
                <StatCard label="En Curso" value={stats.inProgress} color="#f59e0b" icon={<Clock size={20} />} />
                <StatCard label="Planificadas" value={stats.planned} color="#3b82f6" icon={<Calendar size={20} />} />
                <StatCard label="Completadas" value={stats.completed} color="#16a34a" icon={<CheckCircle2 size={20} />} />
            </div>
            {isMobile && <div className="p-[0_1rem_1rem] flex gap-[0.75rem]"><div className="flex-[1] relative"><Search size={18} color="var(--color-text-muted)" className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)]" /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.75rem_1rem_0.75rem_2.5rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[0.95rem]" /></div><button onClick={() => navigate('/audit/new')} className="w-[auto] m-[0] p-[0_1rem] flex items-center justify-center rounded-[16px] bg-[#22c55e] text-[#fff] border-none cursor-pointer box-shadow-[0_4px_15px_rgba(34,197,94,0.3)]"><Plus size={20} /></button></div>}
            <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }} className="max-w-[1400px] m-[0_auto] flex flex-col gap-[0.75rem]">
                {filtered.length === 0 ?
          <EmptyStateIllustrated
            title="Sin Auditorías"
            description="Planificá y gestioná auditorías ISO o internas para asegurar el cumplimiento normativo."
            icon={<FileText />} /> :

          filtered.map((a) => <AuditCard key={a.id} audit={a} statusConfig={(STATUS as any)[a.status] || STATUS.planned} onStart={() => updateStatus(a.id, 'in_progress')} onComplete={() => updateStatus(a.id, 'completed')} onView={() => setSelected(a)} onDelete={() => del(a.id)} isMobile={isMobile} />)}
            </div>
            </div>
            {selected && <DetailModal audit={selected} onClose={() => setSelected(null)} isMobile={isMobile} onPrint={() => setShowShareModal(true)} />}

            {/* @ts-ignore */}
            <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Informe de Auditoría"
        fileName={`Auditoria_${selected?.title || 'Sin_Titulo'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <AuditPdf data={selected} />
            </div>
            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar auditoría?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}
function StatCard({ label, value, color, icon }: any) {return <div className="card p-[1.25rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border-subtle)] flex items-center gap-[1rem]"><div style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }} className="w-[48px] h-[48px] rounded-[var(--radius-lg)] flex items-center justify-center text-[#fff]">{icon}</div><div><div className="text-[0.85rem] font-[600] text-[var(--color-text-muted)]">{label}</div><div className="text-[2rem] font-[900] text-[var(--color-text)] line-height-[1]">{value}</div></div></div>;}
function AuditCard({ audit, statusConfig, onStart, onComplete, onView, onDelete, isMobile }: any) {return <div className="card flex items-center gap-[1rem]" style={{ padding: isMobile ? '1rem' : '1.25rem', borderLeft: `4px solid ${statusConfig.color}` }}><div style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', background: `${statusConfig.color}15`, border: `2px solid ${statusConfig.color}` }} className="rounded-[var(--radius-xl)] flex items-center justify-center flex-shrink-[0]"><ClipboardCheck size={isMobile ? 20 : 24} color={statusConfig.color} /></div><div className="flex-[1] min-width-[0]"><div className="flex items-center gap-[0.5rem] mb-[0.5rem] flex-wrap"><h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem' }} className="m-[0] font-[800] text-[var(--color-text)]">{AUDIT_TYPES.find((t: any) => t.id === audit.auditType)?.icon} {audit.title}</h3><span style={{ background: statusConfig.bg, color: statusConfig.color }} className="p-[0.25rem_0.65rem] rounded-[var(--radius-full)] text-[0.7rem] font-[800] uppercase">{statusConfig.label}</span></div><div style={{ gap: isMobile ? '0.5rem' : '1rem' }} className="flex flex-wrap text-[0.85rem] text-[var(--color-text-muted)]"><span>👤 {audit.auditor || '-'}</span><span>📍 {audit.location || '-'}</span><span>📅 {audit.date ? new Date(audit.date).toLocaleDateString('es-AR') : '-'}</span></div></div><div className="flex gap-[0.5rem]">{audit.status === 'planned' && <button onClick={onStart} className="p-[0.5rem] bg-[#3b82f6] border-none rounded-[var(--radius-md)] cursor-pointer text-[#fff]"><Clock size={isMobile ? 16 : 18} /></button>}{audit.status === 'in_progress' && <button onClick={onComplete} className="p-[0.5rem] bg-[#16a34a] border-none rounded-[var(--radius-md)] cursor-pointer text-[#fff]"><CheckCircle2 size={isMobile ? 16 : 18} /></button>}<button onClick={onView} className="p-[0.5rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[var(--color-primary)]"><Eye size={isMobile ? 16 : 18} /></button><button onClick={onDelete} className="p-[0.5rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[#ef4444]"><Trash2 size={isMobile ? 16 : 18} /></button></div></div>;}

function DetailModal({ audit, onClose, isMobile, onPrint }: any) {
  return (
    <div style={{ alignItems: isMobile ? 'flex-end' : 'center', padding: isMobile ? '1rem' : '1.5rem' }} onClick={onClose} className="fixed inset-[0] bg-[rgba(0,0,0,0.7)] backdrop-filter-[blur(8px)] z-[9999] flex justify-center box-sizing-[border-box]">
            <div className="card w-[100%] max-w-[600px] max-height-[85vh] overflow-[auto] m-[0] box-sizing-[border-box] flex flex-col" style={{ borderRadius: isMobile ? '28px' : 'var(--radius-2xl)' }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-space-between items-center mb-[1.5rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)]">
                    <h2 className="m-[0] text-[1.25rem] font-[900]">Detalle de Auditoría</h2>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>
                <div className="text-center p-[1.5rem] bg-[var(--color-background)] rounded-[var(--radius-xl)] mb-[1.5rem] border-[1px_solid_var(--color-border)]">
                    <ClipboardCheck size={40} color="#8b5cf6" className="mb-[0.5rem]" />
                    <div className="text-[1.5rem] font-[900] text-[var(--color-text)]">{audit.title}</div>
                    <div className="text-[0.9rem] text-[var(--color-text-muted)] mt-[0.5rem]">{audit.auditor}</div>
                </div>

                <div className="flex gap-[1rem] p-[1rem_0]">
                    <button
            onClick={onPrint} className="flex-[1] p-[1rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-primary)] rounded-[var(--radius-lg)] font-[700] cursor-pointer text-[var(--color-primary)] flex items-center justify-center gap-[0.5rem]">














            
                        <Printer size={18} />
                        Imprimir / PDF
                    </button>
                    <button onClick={onClose} className="btn-primary flex-[1] m-[0]">Cerrar</button>
                </div>
            </div>
        </div>);

}