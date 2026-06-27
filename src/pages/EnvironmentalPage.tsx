import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar, AlertTriangle, Leaf, Eye, Trash2, Activity, Droplets, Wind } from 'lucide-react';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import ConfirmModal from '../components/ConfirmModal';

const MONITORING_TYPES = [{ id: 'air', name: 'Calidad de Aire', icon: '💨' }, { id: 'water', name: 'Calidad de Agua', icon: '💧' }, { id: 'noise', name: 'Ruido', icon: '🔊' }, { id: 'waste', name: 'Residuos', icon: '♻️' }, { id: 'emissions', name: 'Emisiones', icon: '🏭' }, { id: 'soil', name: 'Suelo', icon: '🌱' }];
const STATUS = { normal: { label: 'NORMAL', color: '#16a34a', bg: '#f0fdf4' }, warning: { label: 'PRECAUCIÓN', color: '#f59e0b', bg: '#fffbeb' }, critical: { label: 'CRÍTICO', color: '#dc2626', bg: '#fef2f2' } };

export default function EnvironmentalPage(): React.ReactElement | null {
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {const h = () => setIsMobile(window.innerWidth < 768);h();window.addEventListener('resize', h);const s = localStorage.getItem('environmental_measurements_db');if (s) setMeasurements(JSON.parse(s));return () => window.removeEventListener('resize', h);}, []);
  const save = (d: any[]) => {localStorage.setItem('environmental_measurements_db', JSON.stringify(d));setMeasurements(d);};
  const del = (id: string) => {setConfirmModal({ isOpen: true, payload: id });};
  const executeDelete = () => {if (confirmModal.payload) save(measurements.filter((m: any) => m.id !== confirmModal.payload));setConfirmModal({ isOpen: false, payload: null });};
  const filtered = measurements.filter((m) => m.stationName.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = { total: measurements.length, normal: measurements.filter((m) => m.status === 'normal').length, warning: measurements.filter((m) => m.status === 'warning').length, critical: measurements.filter((m) => m.status === 'critical').length };

  return (
    <div style={{ paddingBottom: isMobile ? '80px' : '2rem' }} className="min-h-[100vh] bg-[var(--color-background)]">
            <div style={{ padding: isMobile ? '1rem' : '1.5rem' }} className="bg-[var(--color-surface)] border-bottom-[1px_solid_var(--color-border)] sticky top-[0] z-[100] backdrop-filter-[blur(20px)]">
                <div className="flex items-center gap-[1rem] max-w-[1400px] m-[0_auto]">
                    <></>
                    <div className="flex-[1]">
                        <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} className="m-[0] font-[900]"><Leaf size={isMobile ? 20 : 24} className="display-[inline] mr-[0.5rem] vertical-align-[middle]" />Monitoreo Ambiental</h1>
                        <p className="m-[0.25rem_0_0_0] text-[0.85rem] text-[var(--color-text-muted)]">ISO 14001 • {measurements.length} mediciones</p>
                    </div>
                    <button onClick={() => navigate('/environmental/new')} className="btn-primary w-[auto] m-[0] p-[0.75rem_1.25rem] flex items-center gap-[0.5rem]"><Plus size={20} strokeWidth={2.5} />{!isMobile && 'Nueva Medición'}</button>
                </div>
            </div>
            <div style={{ marginTop: isMobile ? '1rem' : '1.5rem' }}>
            <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', padding: isMobile ? '1rem' : '1.5rem' }} className="grid gap-[1rem] max-w-[1400px] m-[0_auto]">
                <StatCard label="Total" value={stats.total} color="#3B82F6" icon={<Activity size={20} />} />
                <StatCard label="Normales" value={stats.normal} color="#16a34a" icon={<CheckCircle2 size={20} />} />
                <StatCard label="Precaución" value={stats.warning} color="#f59e0b" icon={<AlertTriangle size={20} />} />
                <StatCard label="Críticas" value={stats.critical} color="#dc2626" icon={<AlertTriangle size={20} />} />
            </div>
            {isMobile && <div className="p-[0_1rem_1rem] flex gap-[0.75rem]"><div className="flex-[1] relative"><Search size={18} color="var(--color-text-muted)" className="absolute left-4 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.75rem_1rem_0.75rem_2.5rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[0.95rem]" /></div><button onClick={() => navigate('/environmental/new')} className="btn-primary w-[auto] m-[0] p-[0_1rem] flex items-center justify-center"><Plus size={20} /></button></div>}
            <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }} className="max-w-[1400px] m-[0_auto] flex flex-col gap-[0.75rem]">
                {filtered.length === 0 ?
          <EmptyStateIllustrated
            title="Sin Mediciones"
            description="Registrá mediciones de monitoreo ambiental según ISO 14001 para control de impacto."
            onAction={() => navigate('/environmental/new')}
            icon={<Leaf />} /> :

          filtered.map((m) => <MeasurementCard key={m.id} measurement={m} statusConfig={(STATUS as any)[m.status] || STATUS.normal} onView={() => setSelected(m)} onDelete={() => del(m.id)} isMobile={isMobile} />)}
            </div>
            </div>
            {selected && <DetailModal measurement={selected} onClose={() => setSelected(null)} isMobile={isMobile} />}
            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar medición?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}
function StatCard({ label, value, color, icon }: any) {return <div className="card p-[1.25rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border-subtle)] flex items-center gap-[1rem]"><div style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }} className="w-[48px] h-[48px] rounded-[var(--radius-lg)] flex items-center justify-center text-[#fff]">{icon}</div><div><div className="text-[0.85rem] font-[600] text-[var(--color-text-muted)]">{label}</div><div className="text-[2rem] font-[900] text-[var(--color-text)] line-height-[1]">{value}</div></div></div>;}
function MeasurementCard({ measurement, statusConfig, onView, onDelete, isMobile }: any) {return <div className="card flex items-center gap-[1rem]" style={{ padding: isMobile ? '1rem' : '1.25rem', borderLeft: `4px solid ${statusConfig.color}` }}><div style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', background: `${statusConfig.color}15`, border: `2px solid ${statusConfig.color}` }} className="rounded-[var(--radius-xl)] flex items-center justify-center flex-shrink-[0]"><span className="text-[1.75rem]">{(MONITORING_TYPES.find((t: any) => t.id === measurement.monitoringType) as any)?.icon || '🌍'}</span></div><div className="flex-[1] min-width-[0]"><div className="flex items-center gap-[0.5rem] mb-[0.5rem] flex-wrap"><h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem' }} className="m-[0] font-[800] text-[var(--color-text)]">{measurement.stationName}</h3><span style={{ background: statusConfig.bg, color: statusConfig.color }} className="p-[0.25rem_0.65rem] rounded-[var(--radius-full)] text-[0.7rem] font-[800] uppercase">{statusConfig.label}</span></div><div style={{ gap: isMobile ? '0.5rem' : '1rem' }} className="flex flex-wrap text-[0.85rem] text-[var(--color-text-muted)]"><span>🌍 {(MONITORING_TYPES.find((t: any) => t.id === measurement.monitoringType) as any)?.name || 'Ambiental'}</span><span>📅 {new Date(measurement.createdAt).toLocaleDateString('es-AR')}</span><span>👤 {measurement.technician || '-'}</span></div></div><div className="flex gap-[0.5rem]"><button onClick={onView} className="p-[0.5rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[var(--color-primary)]"><Eye size={isMobile ? 16 : 18} /></button><button onClick={onDelete} className="p-[0.5rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-md)] cursor-pointer text-[#ef4444]"><Trash2 size={isMobile ? 16 : 18} /></button></div></div>;}

function DetailModal({ measurement, onClose, isMobile }: any) {return <div style={{ alignItems: isMobile ? 'flex-end' : 'center', padding: isMobile ? '1rem' : '1.5rem' }} onClick={onClose} className="fixed inset-[0] bg-[rgba(0,0,0,0.7)] backdrop-filter-[blur(8px)] z-[9999] flex justify-center box-sizing-[border-box]"><div className="card w-[100%] max-w-[600px] max-height-[85vh] overflow-[auto] m-[0] box-sizing-[border-box] flex flex-col" style={{ borderRadius: isMobile ? '28px' : 'var(--radius-2xl)' }} onClick={(e) => e.stopPropagation()}><div className="flex justify-space-between items-center mb-[1.5rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)]"><h2 className="m-[0] text-[1.25rem] font-[900]">Detalle</h2><button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><XCircle size={24} /></button></div><div className="text-center p-[1.5rem] bg-[#f8fafc] rounded-[var(--radius-xl)] mb-[1.5rem]"><Leaf size={40} color="#10b981" className="mb-[0.5rem]" /><div className="text-[1.5rem] font-[900] text-[var(--color-text)]">{measurement.stationName}</div><div className="text-[0.9rem] text-[var(--color-text-muted)] mt-[0.5rem]">{measurement.location}</div></div><button onClick={onClose} className="btn-primary w-[100%]">Cerrar</button></div></div>;}