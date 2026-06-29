import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, RefreshCw, Eye, Trash2, Target, Printer } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import CAPAPdf from '../components/CAPAPdf';
import ConfirmModal from '../components/ConfirmModal';
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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {const h = () => setIsMobile(window.innerWidth < 768);h();window.addEventListener('resize', h);const s = localStorage.getItem('ehs_capa_db');if (s) setCapas(JSON.parse(s));return () => window.removeEventListener('resize', h);}, []);
  const save = (d: any[]) => {localStorage.setItem('ehs_capa_db', JSON.stringify(d));setCapas(d);};
  const updateStatus = (id: string, s: string) => save(capas.map((c: any) => c.id === id ? { ...c, status: s } : c));
  const del = (id: string) => {setConfirmModal({ isOpen: true, payload: id });};
  const executeDelete = () => {if (confirmModal.payload) save(capas.filter((c: any) => c.id !== confirmModal.payload));setConfirmModal({ isOpen: false, payload: null });};
  const filtered = capas.filter((c) => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.responsible?.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = { total: capas.length, open: capas.filter((c) => c.status === 'open' || c.status === 'in_progress').length, completed: capas.filter((c) => c.status === 'completed').length, critical: capas.filter((c) => c.priority === 'critical' && c.status !== 'completed').length };

  return (
    <div style={{ paddingBottom: isMobile ? '80px' : '2rem' }} className="min-h-[100vh] bg-[var(--color-background)]">
            <div style={{ padding: isMobile ? '0.75rem 1rem' : '1.5rem' }} className="bg-[var(--color-surface)] border-bottom-[1px_solid_var(--color-border)] sticky top-[0] z-[100] backdrop-filter-[blur(20px)]">
                <div style={{ gap: isMobile ? '0.75rem' : '1rem' }} className="flex items-center max-w-[1400px] m-[0_auto]">
                    <></>
                    <div className="flex-[1] min-width-[0]">
                        <h1 style={{ fontSize: isMobile ? '1.15rem' : '1.5rem' }} className="m-[0] font-[900] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]"><RefreshCw size={isMobile ? 18 : 24} className="display-[inline] mr-[0.5rem] vertical-align-[middle] flex-shrink-[0]" />CAPA</h1>
                        <p style={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }} className="m-[0.25rem_0_0_0] text-[var(--color-text-muted)] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">Acciones Correctivas/Preventivas • {stats.open} abiertas</p>
                    </div>
                    <button onClick={() => navigate('/capa/new')} className="btn-primary w-[auto] m-[0] p-[0.75rem_1.25rem] items-center gap-[0.5rem] flex-shrink-[0]" style={{ display: isMobile ? 'none' : 'flex' }}><Plus size={20} strokeWidth={2.5} />Nueva CAPA</button>
                </div>
            </div>
            <div style={{ marginTop: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{ gap: isMobile ? '0.75rem' : '1rem', padding: isMobile ? '1rem' : '1.5rem' }} className="grid grid-template-columns-[repeat(auto-fit,_minmax(min(100%,_140px),_1fr))] max-w-[1400px] m-[0_auto]">
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<RefreshCw size={isMobile ? 18 : 20} />} isMobile={isMobile} />
                <StatCard label="Abiertas" value={stats.open} color="#f59e0b" icon={<Clock size={isMobile ? 18 : 20} />} isMobile={isMobile} />
                <StatCard label="Críticas" value={stats.critical} color="#dc2626" icon={<AlertTriangle size={isMobile ? 18 : 20} />} isMobile={isMobile} />
                <StatCard label="Completadas" value={stats.completed} color="#16a34a" icon={<CheckCircle2 size={isMobile ? 18 : 20} />} isMobile={isMobile} />
            </div>
            {isMobile && <div className="p-[0_1rem_1rem] flex gap-[0.75rem]"><div className="flex-[1] relative min-width-[0]"><Search size={16} color="var(--color-text-muted)" className="absolute left-[0.75rem] top-[50%] transform-[translateY(-50%)]" /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.65rem_0.75rem_0.65rem_2.25rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[0.85rem] box-sizing-[border-box]" /></div><button onClick={() => navigate('/capa/new')} className="btn-primary w-[auto] m-[0] p-[0_0.85rem] flex items-center justify-center flex-shrink-[0]"><Plus size={18} /></button></div>}
            <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }} className="max-w-[1400px] m-[0_auto] flex flex-col gap-[0.75rem]">
                {filtered.length === 0 ?
          <EmptyStateIllustrated
            title="Sin Acciones CAPA"
            description="Creá Acciones Correctivas/Preventivas para el proceso de mejora continua y control de riesgos."
            onAction={() => navigate('/capa/new')}
            icon={<RefreshCw />} /> :

          filtered.map((c) => <CapaCard key={c.id} capa={c} statusConfig={(STATUS as any)[c.status] || STATUS.open} priorityConfig={(PRIORITY as any)[c.priority] || PRIORITY.medium} onStart={() => updateStatus(c.id, 'in_progress')} onComplete={() => updateStatus(c.id, 'completed')} onView={() => setSelected(c)} onDelete={() => del(c.id)} isMobile={isMobile} />)}
            </div>
            </div>
            {selected && <DetailModal capa={selected} onClose={() => setSelected(null)} isMobile={isMobile} onPrint={() => setShowShareModal(true)} />}

            {/* @ts-ignore */}
            <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Acción Correctiva/Preventiva"
        fileName={`CAPA_${selected?.title || 'Sin_Titulo'}.pdf`} />
      

            <div className="ats-pdf-offscreen" id="pdf-content" aria-hidden="true">
                <CAPAPdf data={selected} />
            </div>
            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar CAPA?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}
function StatCard({ label, value, color, icon, isMobile }: any) {return <div className="card bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border-subtle)] flex items-center" style={{ padding: isMobile ? '0.75rem' : '1.25rem', gap: isMobile ? '0.6rem' : '1rem' }}><div style={{ width: isMobile ? '36px' : '48px', height: isMobile ? '36px' : '48px', background: `linear-gradient(135deg, ${color}, ${color}cc)` }} className="rounded-[var(--radius-lg)] flex items-center justify-center text-[#fff] flex-shrink-[0]">{icon}</div><div className="min-width-[0]"><div style={{ fontSize: isMobile ? '0.7rem' : '0.85rem' }} className="font-[600] text-[var(--color-text-muted)] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">{label}</div><div style={{ fontSize: isMobile ? '1.25rem' : '2rem', marginTop: isMobile ? '0.15rem' : '0' }} className="font-[900] text-[var(--color-text)] line-height-[1]">{value}</div></div></div>;}
function CapaCard({ capa, statusConfig, priorityConfig, onStart, onComplete, onView, onDelete, isMobile }: any) {return <div className="card flex" style={{ padding: isMobile ? '1rem' : '1.25rem', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '1rem' : '1rem', borderLeft: `4px solid ${statusConfig.color}` }}><div className="flex gap-[1rem] flex-[1] min-width-[0]"><div style={{ width: isMobile ? '44px' : '64px', height: isMobile ? '44px' : '64px', background: `${priorityConfig.color}15`, border: `2px solid ${priorityConfig.color}` }} className="rounded-[var(--radius-xl)] flex flex-col items-center justify-center flex-shrink-[0]"><span style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>{priorityConfig.icon}</span></div><div className="flex-[1] min-width-[0]"><div style={{ marginBottom: isMobile ? '0.5rem' : '0.5rem' }} className="flex items-center gap-[0.5rem] flex-wrap"><h3 style={{ fontSize: isMobile ? '0.95rem' : '1.1rem' }} className="m-[0] font-[800] text-[var(--color-text)]">{(CAPA_TYPES.find((t: any) => t.id === capa.capaType) as any)?.icon} {capa.title}</h3><span style={{ padding: isMobile ? '0.15rem 0.4rem' : '0.25rem 0.65rem', background: statusConfig.bg, color: statusConfig.color, fontSize: isMobile ? '0.65rem' : '0.7rem' }} className="rounded-[var(--radius-full)] font-[800] uppercase">{statusConfig.label}</span></div><div style={{ gap: isMobile ? '0.4rem 0.6rem' : '1rem', fontSize: isMobile ? '0.75rem' : '0.85rem' }} className="flex flex-wrap text-[var(--color-text-muted)]"><span>👤 {capa.responsible || '-'}</span><span>📅 {capa.dueDate ? new Date(capa.dueDate).toLocaleDateString('es-AR') : '-'}</span><span>⏱️ {(PRIORITY as any)[capa.priority]?.days || '-'} días</span></div></div></div><div style={{ gap: isMobile ? '0.5rem' : '0.5rem', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start', borderTop: isMobile ? '1px solid var(--color-border)' : 'none', paddingTop: isMobile ? '0.75rem' : '0' }} className="flex">{capa.status === 'open' && <button onClick={onStart} style={{ padding: isMobile ? '0.5rem 1rem' : '0.5rem', flex: isMobile ? 1 : 'none' }} className="bg-[#3b82f6] border-none rounded-[var(--radius-md)] cursor-pointer text-[#fff] flex justify-center items-center gap-[0.5rem] font-[700]"><Clock size={16} />{isMobile && 'Iniciar'}</button>}{capa.status === 'in_progress' && <button onClick={onComplete} style={{ padding: isMobile ? '0.5rem 1rem' : '0.5rem', flex: isMobile ? 1 : 'none' }} className="bg-[#16a34a] border-none rounded-[var(--radius-md)] cursor-pointer text-[#fff] flex justify-center items-center gap-[0.5rem] font-[700]"><CheckCircle2 size={16} />{isMobile && 'Completar'}</button>}<button onClick={onView} style={{ padding: isMobile ? '0.5rem 1rem' : '0.5rem', flex: isMobile ? 1 : 'none' }} className="bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[var(--color-primary)] flex justify-center items-center gap-[0.5rem] font-[700]"><Eye size={16} />{isMobile && 'Ver'}</button><button onClick={onDelete} style={{ padding: isMobile ? '0.5rem 1rem' : '0.5rem', flex: isMobile ? 'none' : 'none' }} className="bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[#ef4444] flex justify-center items-center"><Trash2 size={16} /></button></div></div>;}
function DetailModal({ capa, onClose, isMobile, onPrint }: any) {
  return (
    <div style={{ alignItems: isMobile ? 'flex-end' : 'center', padding: isMobile ? '1rem' : '1.5rem' }} onClick={onClose} className="fixed inset-[0] bg-[rgba(0,0,0,0.7)] backdrop-filter-[blur(8px)] z-[9999] flex justify-center box-sizing-[border-box]">
            <div className="card w-[100%] max-w-[600px] max-height-[85vh] overflow-[auto] m-[0] box-sizing-[border-box] flex flex-col" style={{ borderRadius: isMobile ? '28px' : 'var(--radius-2xl)' }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-space-between items-center mb-[1.5rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)]">
                    <h2 className="m-[0] text-[1.25rem] font-[900]">Detalle CAPA</h2>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>
                <div className="text-center p-[1.5rem] bg-[var(--color-background)] rounded-[var(--radius-xl)] mb-[1.5rem] border-[1px_solid_var(--color-border)]">
                    <RefreshCw size={40} color="#10b981" className="mb-[0.5rem]" />
                    <div className="text-[1.5rem] font-[900] text-[var(--color-text)]">{capa.title}</div>
                    <div className="text-[0.9rem] text-[var(--color-text-muted)] mt-[0.5rem]">{capa.responsible}</div>
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