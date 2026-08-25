import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf, Plus, Search, Eye, Edit3, Trash2, CheckCircle2, XCircle, User, Calendar,
  Droplets, Wind, Thermometer, Activity, AlertTriangle, Target, Factory, Share2, QrCode, FileText
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ShareModal from '../components/ShareModal';
import EnvironmentalPdf from '../components/EnvironmentalPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import AnimatedPage from '../components/AnimatedPage';

// Tipos de monitoreo ambiental
const MONITORING_TYPES = [
  { id: 'air', name: 'Calidad de Aire', icon: '💨', color: '#3b82f6' },
  { id: 'water', name: 'Calidad de Agua', icon: '💧', color: '#06b6d4' },
  { id: 'noise', name: 'Ruido Ambiental', icon: '🔊', color: '#f59e0b' },
  { id: 'waste', name: 'Gestión de Residuos', icon: '♻️', color: '#10b981' },
  { id: 'emissions', name: 'Emisiones', icon: '🏭', color: '#6b7280' },
  { id: 'soil', name: 'Calidad de Suelo', icon: '🌱', color: '#84cc16' },
  { id: 'radiation', name: 'Radiación', icon: '☢️', color: '#f97316' },
  { id: 'vibration', name: 'Vibraciones', icon: '📳', color: '#8b5cf6' }
];

// Estados de medición
const MEASUREMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  normal: { label: 'NORMAL', color: '#16a34a', bg: '#f0fdf4' },
  warning: { label: 'PRECAUCIÓN', color: '#f59e0b', bg: '#fffbeb' },
  critical: { label: 'CRÍTICO', color: '#dc2626', bg: '#fef2f2' },
  exceeded: { label: 'EXCEDIDO', color: '#dc2626', bg: '#fef2f2' }
};

export default function EnvironmentalMonitor(): React.ReactElement | null {
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'warning' | 'critical'>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [qrModal, setQrModal] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = () => {
      try {
        const saved = localStorage.getItem('environmental_measurements_db');
        if (saved) {
          const parsed = JSON.parse(saved);
          setMeasurements(Array.isArray(parsed) ? parsed : []);
        } else {
          setMeasurements([]);
        }
      } catch (e) {
        console.error('[ENVIRONMENTAL] Error loading data:', e);
        setMeasurements([]);
      }
    };

    loadData();
  }, []);

  const saveMeasurements = (data: any[]) => {
    try {
      localStorage.setItem('environmental_measurements_db', JSON.stringify(data));
      setMeasurements(data);
    } catch (e) {
      console.error('[ENVIRONMENTAL] Error saving measurements:', e);
    }
  };

  const deleteMeasurement = (id: string) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      saveMeasurements(measurements.filter((m) => m?.id !== confirmModal.payload));
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredMeasurements = useMemo(() => {
    return (measurements || []).filter((m) => {
      if (!m) return false;
      const stationName = String(m.stationName || m.name || '').toLowerCase();
      const locationName = String(m.location || '').toLowerCase();
      const term = String(searchTerm || '').toLowerCase();
      
      const matchesSearch = stationName.includes(term) || locationName.includes(term);
      const matchesType = filterType === 'all' || m.monitoringType === filterType;
      
      let matchesStatus = true;
      if (statusFilter === 'normal') matchesStatus = m.status === 'normal';
      else if (statusFilter === 'warning') matchesStatus = m.status === 'warning';
      else if (statusFilter === 'critical') matchesStatus = m.status === 'critical' || m.status === 'exceeded';

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [measurements, searchTerm, filterType, statusFilter]);

  const metrics = useMemo(() => {
    const total = measurements.length;
    const normal = measurements.filter((m) => m && m.status === 'normal').length;
    const warning = measurements.filter((m) => m && m.status === 'warning').length;
    const critical = measurements.filter((m) => m && (m.status === 'critical' || m.status === 'exceeded')).length;
    return { total, normal, warning, critical };
  }, [measurements]);

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        {/* Header idéntico a Aptitudes Médicas */}
        <PremiumHeader
          title="Monitoreo & Historial Ambiental"
          subtitle="ISO 14001 • Gestión de impacto ambiental, calidad de aire, agua, ruido y efluentes"
          icon={<Leaf size={36} color="#ffffff" />}
        />

        {/* Top Summary Cards (KPIs) idéntico a Aptitudes Médicas */}
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
            <span className="text-[11px] text-slate-500">Requiere acción inmediata</span>
          </div>
        </div>

        {/* Toolbar & Search Bar Section */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-row items-center justify-between gap-3">
            {/* Input de Búsqueda */}
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

            {/* Select Tipo de Monitoreo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer hidden sm:block"
            >
              <option value="all">Todos los Tipos</option>
              {MONITORING_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
              ))}
            </select>

            {/* Botón Nueva Medición SUPER COMPACTO INLINE idéntico a Aptitudes Médicas */}
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

          {/* Filter Tabs idénticos a Aptitudes Médicas */}
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

          {/* Records List con Tarjetas & Botones Sólidos de Colores */}
          <div className="flex flex-col gap-3">
            {filteredMeasurements.length === 0 ? (
              <EmptyStateIllustrated
                title="Sin Mediciones Ambientales"
                description="Registrá mediciones de monitoreo ambiental según ISO 14001 para control de impacto."
                icon={<Leaf />}
              />
            ) : (
              filteredMeasurements.map((m) => (
                <MeasurementCard
                  key={m.id || Math.random()}
                  measurement={m}
                  statusConfig={MEASUREMENT_STATUS[m?.status] || MEASUREMENT_STATUS.normal}
                  monitoringType={MONITORING_TYPES.find((t) => t.id === m?.monitoringType)}
                  onView={() => setSelectedMeasurement(m)}
                  onEdit={() => navigate('/environmental/new', { state: { editData: m } })}
                  onQR={() => setQrModal(m)}
                  onShare={() => setShareItem(m)}
                  onDelete={() => deleteMeasurement(m.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Modal de Detalle */}
        {selectedMeasurement && (
          <MeasurementDetailModal
            measurement={selectedMeasurement}
            statusConfig={MEASUREMENT_STATUS[selectedMeasurement?.status] || MEASUREMENT_STATUS.normal}
            monitoringType={MONITORING_TYPES.find((t) => t.id === selectedMeasurement?.monitoringType)}
            onClose={() => setSelectedMeasurement(null)}
          />
        )}

        {/* Modal QR de Validación idéntico a Aptitudes Médicas */}
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
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                  {qrModal.stationName || qrModal.name} ({qrModal.location || 'Sector Monitoreado'})
                </p>
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

        {/* Componentes de Impresión / PDF */}
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Monitoreo Ambiental - ${shareItem?.stationName || ''}`}
          text={shareItem ? `🌿 Monitoreo Ambiental (ISO 14001)\n📍 Estación: ${shareItem.stationName}\n📅 Fecha: ${new Date(shareItem.measurementDate || shareItem.createdAt || Date.now()).toLocaleDateString('es-AR')}` : ''}
          rawMessage={shareItem ? `🌿 Monitoreo Ambiental (ISO 14001)\n📍 Estación: ${shareItem.stationName}\n📅 Fecha: ${new Date(shareItem.measurementDate || shareItem.createdAt || Date.now()).toLocaleDateString('es-AR')}` : ''}
          elementIdToPrint="pdf-content-list"
          fileName={`Monitoreo_${shareItem?.stationName || 'Ambiental'}.pdf`}
        />

        <div className="ats-pdf-offscreen">
          {shareItem && <EnvironmentalPdf data={shareItem} id="pdf-content-list" />}
        </div>

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

// Componente de Tarjeta con Botones Coloridos e Identidad Visual de Aptitudes Médicas
function MeasurementCard({ measurement, statusConfig, monitoringType, onView, onEdit, onQR, onShare, onDelete }: any) {
  if (!measurement) return null;
  const safeStatus = statusConfig || MEASUREMENT_STATUS.normal;

  return (
    <div className="card p-[1.25rem] flex flex-col md:flex-row md:items-center justify-between gap-[1rem] transition-all bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm" style={{ borderLeft: `4px solid ${safeStatus.color}` }}>
      {/* Icon & Details */}
      <div className="flex items-center gap-[1rem] flex-1 min-w-0">
        <div style={{ background: `${safeStatus.color}15`, border: `2px solid ${safeStatus.color}` }} className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-[1.75rem]">{monitoringType?.icon || '🌍'}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[0.5rem] mb-[0.35rem] flex-wrap">
            <h3 className="m-0 text-[1.1rem] font-[800] text-slate-900 dark:text-white truncate">{measurement.stationName || 'Estación Monitoreada'}</h3>
            <span style={{ background: safeStatus.bg, color: safeStatus.color }} className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {safeStatus.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-[0.75rem] text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Leaf size={14} />
              {monitoringType?.name || 'Ambiental'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(measurement.measurementDate || measurement.date || measurement.createdAt || Date.now()).toLocaleDateString('es-AR')}
            </span>
            <span className="flex items-center gap-1">
              <User size={14} />
              {measurement.technician || 'Sin técnico'}
            </span>
          </div>
        </div>
      </div>

      {/* Botones Sólidos y Coloridos idénticos a Aptitudes Médicas */}
      <div className="flex items-center gap-[6px] flex-wrap">
        {/* Botón Editar con fondo Ámbar/Amarillo sólido */}
        <button
          onClick={onEdit}
          title="Editar Medición"
          style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)' }}
        >
          <Edit3 size={12} /> Editar
        </button>

        {/* Botón Ver con fondo Azul sólido */}
        <button
          onClick={onView}
          title="Ver Detalles"
          style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
        >
          <Eye size={12} /> Ver
        </button>

        {/* Botón QR con fondo Púrpura sólido */}
        <button
          onClick={onQR}
          title="Ver Credencial QR de Validación"
          style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)' }}
        >
          <QrCode size={12} /> QR
        </button>

        {/* Botón Compartir / PDF con fondo Verde sólido */}
        <button
          onClick={onShare}
          title="Compartir Informe PDF"
          style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)' }}
        >
          <Share2 size={12} /> Compartir
        </button>

        {/* Botón Eliminar con fondo Rojo sólido */}
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

// Componente Modal de Detalle
function MeasurementDetailModal({ measurement, statusConfig, monitoringType, onClose }: any) {
  if (!measurement) return null;
  const safeStatus = statusConfig || MEASUREMENT_STATUS.normal;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Leaf size={22} className="text-emerald-500" />
            <h2 className="m-0 text-lg font-extrabold text-slate-900 dark:text-white">Detalle de Monitoreo Ambiental</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 border-none bg-transparent cursor-pointer">
            <XCircle size={24} />
          </button>
        </div>

        <div className="text-center p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <span className="text-3xl mb-1 block">{monitoringType?.icon || '🌍'}</span>
          <div className="text-xl font-black text-slate-900 dark:text-white">{measurement.stationName || 'Estación sin nombre'}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">{measurement.location || 'Sin ubicación geográfica'}</div>
          <span style={{ background: safeStatus.bg, color: safeStatus.color }} className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-black uppercase">
            {safeStatus.label}
          </span>
        </div>

        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-1.5">
            <span className="font-bold text-slate-500">Tipo de Monitoreo:</span>
            <span className="font-extrabold">{monitoringType?.name || 'General'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-1.5">
            <span className="font-bold text-slate-500">Fecha de Medición:</span>
            <span className="font-extrabold">{new Date(measurement.measurementDate || measurement.date || measurement.createdAt || Date.now()).toLocaleDateString('es-AR')}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-1.5">
            <span className="font-bold text-slate-500">Técnico Responsable:</span>
            <span className="font-extrabold">{measurement.technician || 'Sin asignar'}</span>
          </div>
          {measurement.observations && (
            <div className="pt-2">
              <span className="font-bold text-slate-500 block mb-1">Observaciones:</span>
              <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl m-0 font-mono text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed">
                {measurement.observations}
              </p>
            </div>
          )}
        </div>

        <button onClick={onClose} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl border-none cursor-pointer shadow-md transition-colors">
          Cerrar
        </button>
      </div>
    </div>
  );
}