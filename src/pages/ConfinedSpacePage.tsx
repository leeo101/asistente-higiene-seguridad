import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, Tent, Eye, Trash2, Wind, Droplets, Printer } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';

const PERMIT_STATUS = {
  draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
  pending: { label: 'PENDIENTE', color: '#f59e0b', bg: '#fffbeb' },
  active: { label: 'ACTIVO', color: '#16a34a', bg: '#f0fdf4' },
  completed: { label: 'COMPLETADO', color: '#3b82f6', bg: '#eff6ff' }
};

export default function ConfinedSpacePage(): React.ReactElement | null {
  const navigate = useNavigate();
  const [permits, setPermits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPermit, setSelectedPermit] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    const saved = localStorage.getItem('confined_space_permits_db');
    if (saved) setPermits(JSON.parse(saved));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const savePermits = (data: any[]) => {localStorage.setItem('confined_space_permits_db', JSON.stringify(data));setPermits(data);};

  const updateStatus = (id: string, status: string) => {savePermits(permits.map((p: any) => p.id === id ? { ...p, status } : p));};
  const deletePermit = (id: string) => {setConfirmModal({ isOpen: true, payload: id });};
  const executeDelete = () => {if (confirmModal.payload) savePermits(permits.filter((p: any) => p.id !== confirmModal.payload));setConfirmModal({ isOpen: false, payload: null });};

  const filtered = permits.filter((p) => p.spaceName.toLowerCase().includes(searchTerm.toLowerCase()) || p.location?.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = { total: permits.length, active: permits.filter((p) => p.status === 'active').length, pending: permits.filter((p) => p.status === 'pending').length, completed: permits.filter((p) => p.status === 'completed').length };

  return (
    <div style={{ paddingBottom: isMobile ? '80px' : '2rem' }} className="min-h-[100vh] bg-[var(--color-background)]">
            <div style={{ padding: isMobile ? '1rem' : '1.5rem' }} className="bg-[var(--color-surface)] border-bottom-[1px_solid_var(--color-border)] sticky top-[0] z-[100] backdrop-filter-[blur(20px)]">
                <div className="flex items-center gap-[1rem] max-w-[1400px] m-[0_auto]">
                    <></>
                    <div className="flex-[1]">
                        <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} className="m-[0] font-[900]"><Tent size={isMobile ? 20 : 24} className="display-[inline] mr-[0.5rem] vertical-align-[middle]" />Espacios Confinados</h1>
                        <p className="m-[0.25rem_0_0_0] text-[0.85rem] text-[var(--color-text-muted)]">OSHA 1910.146 • {stats.active} activos</p>
                    </div>
                    <button onClick={() => navigate('/confined-space/new')} className="btn-primary w-[auto] m-[0] p-[0.75rem_1.25rem] items-center gap-[0.5rem]" style={{ display: isMobile ? 'none' : 'flex' }}><Plus size={20} strokeWidth={2.5} />Nuevo Permiso</button>
                </div>
            </div>

            <div style={{ marginTop: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', padding: isMobile ? '1rem' : '1.5rem' }} className="grid gap-[1rem] max-w-[1400px] m-[0_auto]">
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<Tent size={20} />} />
                <StatCard label="Activos" value={stats.active} color="#16a34a" icon={<CheckCircle2 size={20} />} />
                <StatCard label="Pendientes" value={stats.pending} color="#f59e0b" icon={<Clock size={20} />} />
                <StatCard label="Completados" value={stats.completed} color="#8b5cf6" icon={<CheckCircle2 size={20} />} />
            </div>

            {isMobile &&
        <div className="p-[0_1rem_1rem] flex gap-[0.75rem]">
                    <div className="flex-[1] relative">
                        <Search size={18} color="var(--color-text-muted)" className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)]" />
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.75rem_1rem_0.75rem_2.5rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[0.95rem]" />
                    </div>
                    <button onClick={() => navigate('/confined-space/new')} className="btn-primary w-[auto] m-[0] p-[0_1rem] flex items-center justify-center"><Plus size={20} /></button>
                </div>
        }

            <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }} className="max-w-[1400px] m-[0_auto] flex flex-col gap-[0.75rem]">
                {filtered.length === 0 ?
          <EmptyStateIllustrated
            title="Sin Permisos de Ingreso"
            description="Creá permisos de ingreso a espacios confinados según OSHA 1910.146 para garantizar la seguridad del personal."
            onAction={() => navigate('/confined-space/new')}
            icon={<Tent />} /> :

          filtered.map((p) =>
          <PermitCard key={p.id} permit={p} statusConfig={(PERMIT_STATUS as any)[p.status] || PERMIT_STATUS.pending} onStart={() => updateStatus(p.id, 'active')} onComplete={() => updateStatus(p.id, 'completed')} onView={() => setSelectedPermit(p)} onDelete={() => deletePermit(p.id)} isMobile={isMobile} />
          )}
            </div>

            </div>

            {selectedPermit && <DetailModal permit={selectedPermit} onClose={() => setSelectedPermit(null)} isMobile={isMobile} onPrint={() => setShowShareModal(true)} />}

            {/* @ts-ignore */}
            <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Permiso de Ingreso"
        fileName={`Permiso_${selectedPermit?.spaceName || 'Sin_Nombre'}.pdf`} />
      

            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <ConfinedSpacePdf data={selectedPermit} />
            </div>
            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar permiso?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}

function StatCard({ label, value, color, icon }: any) {
  return <div className="card p-[1.25rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border-subtle)] flex items-center gap-[1rem]"><div style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }} className="w-[48px] h-[48px] rounded-[var(--radius-lg)] flex items-center justify-center text-[#fff]">{icon}</div><div><div className="text-[0.85rem] font-[600] text-[var(--color-text-muted)]">{label}</div><div className="text-[2rem] font-[900] text-[var(--color-text)] line-height-[1]">{value}</div></div></div>;
}

function PermitCard({ permit, statusConfig, onStart, onComplete, onView, onDelete, isMobile }: any) {
  return (
    <div className="card flex items-center gap-[1rem]" style={{ padding: isMobile ? '1rem' : '1.25rem', borderLeft: `4px solid ${statusConfig.color}` }}>
            <div style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', background: `${statusConfig.color}15`, border: `2px solid ${statusConfig.color}` }} className="rounded-[var(--radius-xl)] flex items-center justify-center flex-shrink-[0]"><Tent size={isMobile ? 20 : 24} color={statusConfig.color} /></div>
            <div className="flex-[1] min-width-[0]">
                <div className="flex items-center gap-[0.5rem] mb-[0.5rem] flex-wrap">
                    <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem' }} className="m-[0] font-[800] text-[var(--color-text)]">{permit.spaceName}</h3>
                    <span style={{ background: statusConfig.bg, color: statusConfig.color }} className="p-[0.25rem_0.65rem] rounded-[var(--radius-full)] text-[0.7rem] font-[800] uppercase">{statusConfig.label}</span>
                </div>
                <div style={{ gap: isMobile ? '0.5rem' : '1rem' }} className="flex flex-wrap text-[0.85rem] text-[var(--color-text-muted)]">
                    <span>📍 {permit.location || 'Sin ubicación'}</span>
                    <span>👤 {permit.worker || 'Sin trabajador'}</span>
                    <span>👁️ {permit.attendant || 'Sin vigía'}</span>
                </div>
            </div>
            <div className="flex gap-[0.5rem]">
                {permit.status === 'pending' && <button onClick={onStart} className="p-[0.5rem] bg-[#16a34a] border-none rounded-[var(--radius-md)] cursor-pointer text-[#fff]"><CheckCircle2 size={isMobile ? 16 : 18} /></button>}
                {permit.status === 'active' && <button onClick={onComplete} className="p-[0.5rem] bg-[#3b82f6] border-none rounded-[var(--radius-md)] cursor-pointer text-[#fff]"><CheckCircle2 size={isMobile ? 16 : 18} /></button>}
                <button onClick={onView} className="p-[0.5rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[var(--color-primary)]"><Eye size={isMobile ? 16 : 18} /></button>
                <button onClick={onDelete} className="p-[0.5rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[#ef4444]"><Trash2 size={isMobile ? 16 : 18} /></button>
            </div>
        </div>);

}

function EmptyState({ onAdd, isMobile }: any) {
  return <div style={{ padding: isMobile ? '3rem 1rem' : '4rem 2rem' }} className="text-center bg-[var(--gradient-card)] rounded-[var(--radius-2xl)] border-[2px_dashed_var(--color-border)]"><div className="w-[80px] h-[80px] m-[0_auto_1.5rem] bg-[var(--color-background)] rounded-[50%] flex items-center justify-center"><Tent size={40} color="var(--color-text-muted)" /></div><h3 className="m-[0_0_0.5rem_0] text-[1.25rem] font-[800]">Sin Permisos</h3><p className="m-[0_0_1.5rem_0] text-[var(--color-text-muted)] text-[0.95rem]">Creá permisos de espacio confinado según OSHA 1910.146</p><button onClick={onAdd} className="btn-primary w-[auto] m-[0]"><Plus size={20} className="mr-[0.5rem]" />Primer Permiso</button></div>;
}

function DetailModal({ permit, onClose, isMobile, onPrint }: any) {
  return (
    <div style={{ alignItems: isMobile ? 'flex-end' : 'center', padding: isMobile ? '1rem' : '1.5rem' }} onClick={onClose} className="fixed inset-[0] bg-[rgba(0,0,0,0.7)] backdrop-filter-[blur(8px)] z-[9999] flex justify-center box-sizing-[border-box]">
            <div className="card w-[100%] max-w-[600px] max-height-[85vh] overflow-[auto] m-[0] box-sizing-[border-box] flex flex-col" style={{ borderRadius: isMobile ? '28px' : 'var(--radius-2xl)' }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-space-between items-center mb-[1.5rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)]">
                    <h2 className="m-[0] text-[1.25rem] font-[900]">Detalle del Permiso</h2>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>
                <div className="text-center p-[1.5rem] bg-[var(--color-background)] rounded-[var(--radius-xl)] mb-[1.5rem] border-[1px_solid_var(--color-border)]">
                    <Tent size={40} color="#f59e0b" className="mb-[0.5rem]" />
                    <div className="text-[1.5rem] font-[900] text-[var(--color-text)]">{permit.spaceName}</div>
                    <div className="text-[0.9rem] text-[var(--color-text-muted)] mt-[0.5rem]">{permit.location}</div>
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