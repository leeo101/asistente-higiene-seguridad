import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf, Plus, Search, CheckCircle2, XCircle, Clock, User, Calendar,
  AlertTriangle, Eye, Edit3, Trash2, Activity, QrCode, FileText, Share2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import ConfirmModal from '../components/ConfirmModal';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';

const MONITORING_TYPES = [
  { id: 'air', name: 'Calidad de Aire', icon: '💨' },
  { id: 'water', name: 'Calidad de Agua', icon: '💧' },
  { id: 'noise', name: 'Ruido Ambiental', icon: '🔊' },
  { id: 'waste', name: 'Gestión de Residuos', icon: '♻️' },
  { id: 'emissions', name: 'Emisiones', icon: '🏭' },
  { id: 'soil', name: 'Suelo', icon: '🌱' }
];

const STATUS = {
  normal: { label: 'NORMAL', color: '#16a34a', bg: '#f0fdf4' },
  warning: { label: 'PRECAUCIÓN', color: '#f59e0b', bg: '#fffbeb' },
  critical: { label: 'CRÍTICO', color: '#dc2626', bg: '#fef2f2' }
};

export default function EnvironmentalPage(): React.ReactElement | null {
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'warning' | 'critical'>('all');
  const [selected, setSelected] = useState<any>(null);
  const [qrModal, setQrModal] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    const saved = localStorage.getItem('environmental_measurements_db');
    if (saved) {
      try {
        setMeasurements(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const save = (data: any[]) => {
    localStorage.setItem('environmental_measurements_db', JSON.stringify(data));
    setMeasurements(data);
  };

  const del = (id: string) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      save(measurements.filter((m: any) => m.id !== confirmModal.payload));
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const metrics = useMemo(() => {
    const total = measurements.length;
    const normal = measurements.filter((m) => m.status === 'normal').length;
    const warning = measurements.filter((m) => m.status === 'warning').length;
    const critical = measurements.filter((m) => m.status === 'critical').length;
    return { total, normal, warning, critical };
  }, [measurements]);

  const filtered = measurements.filter((m) => {
    const matchesSearch = (m.stationName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Monitoreo & Historial Ambiental"
          subtitle="Gestión de impacto ambiental, calidad de aire, agua, ruido y efluentes conforme a ISO 14001"
          icon={<Leaf size={36} color="#ffffff" />}
        />

        {/* Top Summary Cards (KPIs) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Mediciones</span>
              <Activity size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Puntos monitoreados</span>
          </div>

          <div
            onClick={() => setStatusFilter('normal')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'normal'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Normales / Conformes</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.normal}</div>
            <span className="text-[11px] text-slate-500">Dentro de norma ISO 14001</span>
          </div>

          <div
            onClick={() => setStatusFilter('warning')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">En Precaución</span>
              <AlertTriangle size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.warning}</div>
            <span className="text-[11px] text-slate-500">Cercano al límite permitido</span>
          </div>

          <div
            onClick={() => setStatusFilter('critical')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'critical'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Críticas / Excedidas</span>
              <XCircle size={20} />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.critical}</div>
            <span className="text-[11px] text-slate-500">Requiere acción correctiva</span>
          </div>
        </div>

        {/* Toolbar & Actions */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-row items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs h-[38px]">
              <Search
                size={16}
                className="text-slate-400 pointer-events-none z-10"
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: 0,
                  bottom: 0,
                  marginTop: 'auto',
                  marginBottom: 'auto',
                  display: 'block'
                }}
              />
              <input
                type="text"
                placeholder="Buscar estación o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <button
              onClick={() => navigate('/environmental/new')}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '800',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                height: '34px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
              }}
            >
              <Plus size={14} />
              <span>Nueva Medición</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                backgroundColor: statusFilter === 'all' ? '#2563eb' : '#ffffff',
                color: statusFilter === 'all' ? '#ffffff' : '#334155',
                border: statusFilter === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Todos ({metrics.total})
            </button>
            <button
              onClick={() => setStatusFilter('normal')}
              style={{
                backgroundColor: statusFilter === 'normal' ? '#059669' : '#ffffff',
                color: statusFilter === 'normal' ? '#ffffff' : '#334155',
                border: statusFilter === 'normal' ? '1px solid #059669' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Normales ({metrics.normal})
            </button>
            <button
              onClick={() => setStatusFilter('warning')}
              style={{
                backgroundColor: statusFilter === 'warning' ? '#d97706' : '#ffffff',
                color: statusFilter === 'warning' ? '#ffffff' : '#334155',
                border: statusFilter === 'warning' ? '1px solid #d97706' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Precaución ({metrics.warning})
            </button>
            <button
              onClick={() => setStatusFilter('critical')}
              style={{
                backgroundColor: statusFilter === 'critical' ? '#dc2626' : '#ffffff',
                color: statusFilter === 'critical' ? '#ffffff' : '#334155',
                border: statusFilter === 'critical' ? '1px solid #dc2626' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Críticas ({metrics.critical})
            </button>
          </div>

          {/* Records List */}
          <div className="flex flex-col gap-3">
            {filtered.length === 0 ? (
              <EmptyStateIllustrated
                title="Sin Mediciones Ambientales"
                description="Registrá mediciones de monitoreo ambiental según ISO 14001 para control de impacto."
                onAction={() => navigate('/environmental/new')}
                icon={<Leaf />}
              />
            ) : (
              filtered.map((m) => (
                <MeasurementCard
                  key={m.id}
                  measurement={m}
                  statusConfig={(STATUS as any)[m.status] || STATUS.normal}
                  onView={() => setSelected(m)}
                  onEdit={() => navigate('/environmental/new', { state: { editData: m } })}
                  onQR={() => setQrModal(m)}
                  onDelete={() => del(m.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Modal de Detalle */}
        {selected && (
          <DetailModal measurement={selected} onClose={() => setSelected(null)} />
        )}

        {/* Modal QR */}
        {qrModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative border border-slate-200 dark:border-slate-800 space-y-4">
              <button
                onClick={() => setQrModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent border-none cursor-pointer"
              >
                <XCircle size={24} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <QrCode size={28} />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0">Medición Ambiental Verificada</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">{qrModal.stationName} ({qrModal.location || 'Sector Monitoreado'})</p>
              </div>

              <div className="bg-white p-4 rounded-2xl inline-block border border-slate-200 shadow-sm">
                <QRCodeSVG value={`${window.location.origin}/verify/env_${qrModal.id}`} size={180} />
              </div>

              <p className="text-xs text-slate-400">
                Escaneá este código QR para auditar la medición de impacto ambiental en tiempo real según norma ISO 14001.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setQrModal(null)}
                  style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', flex: 1 }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar medición?"
          message="Esta acción no se puede deshacer."
          iconEmoji="🗑️"
        />
      </div>
    </AnimatedPage>
  );
}

function MeasurementCard({ measurement, statusConfig, onView, onEdit, onQR, onDelete }: any) {
  const monitoringType = MONITORING_TYPES.find((t) => t.id === measurement.monitoringType);
  return (
    <div className="card p-[1.25rem] flex flex-col md:flex-row md:items-center justify-between gap-[1rem] transition-all bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm" style={{ borderLeft: `4px solid ${statusConfig.color}` }}>
      <div className="flex items-center gap-[1rem] flex-1 min-w-0">
        <div style={{ background: `${statusConfig.color}15`, border: `2px solid ${statusConfig.color}` }} className="w-[56px] h-[56px] rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-[1.75rem]">{monitoringType?.icon || '🌍'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="m-0 text-base font-extrabold text-slate-900 dark:text-white truncate">{measurement.stationName}</h3>
            <span style={{ background: statusConfig.bg, color: statusConfig.color }} className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {statusConfig.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1"><Leaf size={14} /> {monitoringType?.name || 'Ambiental'}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(measurement.createdAt || Date.now()).toLocaleDateString('es-AR')}</span>
            <span className="flex items-center gap-1"><User size={14} /> {measurement.technician || 'Sin técnico'}</span>
          </div>
        </div>
      </div>

      {/* Botones Sólidos y Coloridos idénticos a Aptitudes Médicas */}
      <div className="flex items-center gap-[6px] flex-wrap">
        <button
          onClick={onEdit}
          title="Editar Medición"
          style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)' }}
        >
          <Edit3 size={12} /> Editar
        </button>

        <button
          onClick={onView}
          title="Ver Detalles"
          style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
        >
          <Eye size={12} /> Ver
        </button>

        <button
          onClick={onQR}
          title="Ver Credencial QR de Validación"
          style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)' }}
        >
          <QrCode size={12} /> QR
        </button>

        <button
          onClick={onDelete}
          title="Eliminar Registro"
          style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)' }}
        >
          <Trash2 size={12} /> Eliminar
        </button>
      </div>
    </div>
  );
}

function DetailModal({ measurement, onClose }: any) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="m-0 text-lg font-black text-slate-900 dark:text-white">Detalle de Medición</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 border-none bg-transparent cursor-pointer">
            <XCircle size={24} />
          </button>
        </div>
        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl">
          <Leaf size={36} color="#10b981" className="mx-auto mb-2" />
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">{measurement.stationName}</div>
          <div className="text-xs text-slate-500 mt-1">{measurement.location || 'Sin ubicación específica'}</div>
        </div>
        <button onClick={onClose} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl border-none cursor-pointer">
          Cerrar
        </button>
      </div>
    </div>
  );
}