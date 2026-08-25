import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Key, AlertTriangle, Plus, Search,
  FileText, Eye, Edit3, Trash2, CheckCircle2,
  XCircle, Clock, User, Calendar,
  Shield, Zap, Settings, AlertCircle,
  TrendingUp, BarChart3, Activity, Share2, ArrowLeft, QrCode, Layers
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import LOTOPdf from '../components/LOTOPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import AnimatedPage from '../components/AnimatedPage';
import { usePaywall } from '../hooks/usePaywall';

// Tipos de energía según OSHA 1910.147
const ENERGY_TYPES = [
  { id: 'electrical', name: 'Eléctrica', icon: '⚡', color: '#fbbf24' },
  { id: 'mechanical', name: 'Mecánica', icon: '🔧', color: '#6b7280' },
  { id: 'hydraulic', name: 'Hidráulica', icon: '💧', color: '#3b82f6' },
  { id: 'pneumatic', name: 'Neumática', icon: '💨', color: '#9ca3af' },
  { id: 'chemical', name: 'Química', icon: '🧪', color: '#10b981' },
  { id: 'thermal', name: 'Térmica', icon: '🔥', color: '#ef4444' },
  { id: 'gravitational', name: 'Gravitacional', icon: '⬇️', color: '#8b5cf6' },
  { id: 'radiation', name: 'Radiación', icon: '☢️', color: '#f59e0b' }
];

// Tipos de dispositivos LOTO
const LOTO_DEVICES = [
  { id: 'padlock', name: 'Candado', icon: '🔒' },
  { id: 'hasp', name: 'Grampa Múltiple', icon: '📎' },
  { id: 'breaker_lock', name: 'Bloqueo Interruptor', icon: '⚡' },
  { id: 'valve_lock', name: 'Bloqueo Válvula', icon: '🔩' },
  { id: 'plug_lock', name: 'Bloqueo Enchufe', icon: '🔌' },
  { id: 'tagout', name: 'Etiqueta', icon: '🏷️' }
];

// Estados de un procedimiento LOTO
const LOTO_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'ACTIVO', color: '#16a34a', bg: '#f0fdf4' },
  pending: { label: 'PENDIENTE', color: '#d97706', bg: '#fffbeb' },
  completed: { label: 'COMPLETADO', color: '#2563eb', bg: '#eff6ff' },
  suspended: { label: 'SUSPENDIDO', color: '#6b7280', bg: '#f3f4f6' },
  emergency: { label: 'EMERGENCIA', color: '#dc2626', bg: '#fef2f2' }
};

export default function LOTOManager(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  useDocumentTitle('Procedimientos LOTO');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncing, syncCollection } = useSync();

  const [procedures, setProcedures] = useState<any[]>([]);
  const [activeLOTOs, setActiveLOTOs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'procedures' | 'active' | 'energy'>('procedures');
  const [shareItem, setShareItem] = useState<any>(null);
  const [qrModal, setQrModal] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  const loadData = () => {
    try {
      const savedProcedures = localStorage.getItem('loto_procedures_db');
      const savedActiveLOTOs = localStorage.getItem('loto_active_db');
      if (savedProcedures) setProcedures(JSON.parse(savedProcedures));
      if (savedActiveLOTOs) setActiveLOTOs(JSON.parse(savedActiveLOTOs));
    } catch (e) {
      console.error('[LOTO] Error loading data:', e);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'loto_procedures_db' || e.key === 'loto_active_db') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncing]);

  const saveProcedures = (data: any[]) => {
    setProcedures(data);
    try {
      localStorage.setItem('loto_procedures_db', JSON.stringify(data));
      syncCollection('loto_procedures_db', data);
    } catch (e) {}
  };

  const deleteProcedure = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = procedures.filter((p) => p.id !== confirmModal.payload);
      saveProcedures(updated);
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const startLOTO = (procedureId: string) => {
    const procedure = procedures.find((p) => p.id === procedureId);
    if (!procedure) return;

    const newActiveLOTO = {
      ...procedure,
      lotoId: `LOTO-${Date.now().toString().slice(-6)}`,
      status: 'active',
      startedAt: new Date().toISOString()
    };

    const updatedActive = [newActiveLOTO, ...activeLOTOs];
    setActiveLOTOs(updatedActive);
    localStorage.setItem('loto_active_db', JSON.stringify(updatedActive));

    const updatedProcedures = procedures.map((p) =>
      p.id === procedureId ? { ...p, status: 'active' } : p
    );
    saveProcedures(updatedProcedures);
  };

  const completeLOTO = (lotoId: string) => {
    const updatedActive = activeLOTOs.filter((l) => l.id !== lotoId && l.lotoId !== lotoId);
    setActiveLOTOs(updatedActive);
    localStorage.setItem('loto_active_db', JSON.stringify(updatedActive));

    const updatedProcedures = procedures.map((p) =>
      p.id === lotoId ? { ...p, status: 'completed', completedAt: new Date().toISOString() } : p
    );
    saveProcedures(updatedProcedures);
  };

  const stats = useMemo(() => {
    const total = procedures.length;
    const active = activeLOTOs.length;
    const pending = procedures.filter((p) => p.status === 'pending').length;
    const completed = procedures.filter((p) => p.status === 'completed').length;

    const energyTypes: Record<string, number> = {};
    procedures.forEach((p) => {
      p.energyTypes?.forEach((type: string) => {
        energyTypes[type] = (energyTypes[type] || 0) + 1;
      });
    });

    return { total, active, pending, completed, energyTypes };
  }, [procedures, activeLOTOs]);

  const filteredProcedures = useMemo(() => {
    return procedures.filter((p) => {
      if (!p) return false;
      const searchStr = `${p.equipmentName || ''} ${p.equipmentId || ''} ${p.location || ''} ${p.department || ''}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [procedures, searchTerm, filterStatus]);

  if (selectedProcedure) {
    return (
      <AnimatedPage>
        <div className="container pb-20 min-h-screen pt-4">
          <div className="no-print flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedProcedure(null)}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Procedimiento LOTO — {selectedProcedure.equipmentName}</h1>
            <button
              onClick={() => setShareItem(selectedProcedure)}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Share2 size={16} /> Compartir PDF
            </button>
          </div>
          <LOTOPdf data={selectedProcedure} />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        {/* Header idéntico a Aptitudes Médicas */}
        <PremiumHeader
          title="Procedimientos LOTO (Lockout/Tagout)"
          subtitle="Control de energías peligrosas y bloqueo de seguridad según norma OSHA 1910.147"
          icon={<Lock size={36} color="#ffffff" />}
        />

        {/* Top Summary Cards (KPIs) idéntico a Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setActiveTab('procedures')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'procedures'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Procedimientos</span>
              <FileText size={20} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
            <span className="text-[11px] text-slate-500">Documentados OSHA</span>
          </div>

          <div
            onClick={() => setActiveTab('active')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">LOTO Activos</span>
              <Lock size={20} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</div>
            <span className="text-[11px] text-slate-500">Bloqueados en planta</span>
          </div>

          <div className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pendientes</span>
              <Clock size={20} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</div>
            <span className="text-[11px] text-slate-500">En preparación</span>
          </div>

          <div className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completados</span>
              <CheckCircle2 size={20} />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.completed}</div>
            <span className="text-[11px] text-slate-500">Energía liberada</span>
          </div>
        </div>

        {/* Toolbar & Search Bar Section */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Input de Búsqueda */}
            <div className="relative flex-1 min-w-[240px] h-[38px]">
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
                placeholder="Buscar por equipo, ubicación, depto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Botón Nuevo Procedimiento SUPER COMPACTO INLINE idéntico a Aptitudes Médicas */}
            <button
              onClick={() => requirePro(() => navigate('/loto/new'))}
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
              <span>Nuevo Procedimiento</span>
            </button>
          </div>

          {/* Filter Tabs idénticos a Aptitudes Médicas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab('procedures')}
              style={{
                backgroundColor: activeTab === 'procedures' ? '#2563eb' : '#ffffff',
                color: activeTab === 'procedures' ? '#ffffff' : '#334155',
                border: activeTab === 'procedures' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Procedimientos ({procedures.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                backgroundColor: activeTab === 'active' ? '#059669' : '#ffffff',
                color: activeTab === 'active' ? '#ffffff' : '#334155',
                border: activeTab === 'active' ? '1px solid #059669' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              LOTO Activos ({activeLOTOs.length})
            </button>
            <button
              onClick={() => setActiveTab('energy')}
              style={{
                backgroundColor: activeTab === 'energy' ? '#8b5cf6' : '#ffffff',
                color: activeTab === 'energy' ? '#ffffff' : '#334155',
                border: activeTab === 'energy' ? '1px solid #8b5cf6' : '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Tipos de Energía
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'procedures' && (
            <div className="flex flex-col gap-3">
              {filteredProcedures.length === 0 ? (
                <EmptyStateIllustrated
                  title="Sin Procedimientos LOTO"
                  description="Creá procedimientos de Lockout/Tagout según OSHA 1910.147 para control de energías peligrosas."
                  icon={<Lock />}
                />
              ) : (
                filteredProcedures.map((procedure) => (
                  <ProcedureCardItem
                    key={procedure.id || Math.random()}
                    procedure={procedure}
                    statusConfig={LOTO_STATUS[procedure.status] || LOTO_STATUS.pending}
                    onStart={() => startLOTO(procedure.id)}
                    onComplete={() => completeLOTO(procedure.id)}
                    onView={() => setSelectedProcedure(procedure)}
                    onEdit={() => navigate('/loto/new', { state: { editData: procedure } })}
                    onQR={() => setQrModal(procedure)}
                    onShare={() => setShareItem(procedure)}
                    onDelete={() => deleteProcedure(procedure.id)}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <ActiveLOTOList
              activeLOTOs={activeLOTOs}
              onComplete={completeLOTO}
              onView={setSelectedProcedure}
            />
          )}

          {activeTab === 'energy' && (
            <EnergyTypesPanel stats={stats} ENERGY_TYPES={ENERGY_TYPES} />
          )}
        </div>

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

              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                <QrCode size={28} />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white m-0">Procedimiento LOTO Verificado</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                  {qrModal.equipmentName || 'Equipo'} ({qrModal.location || 'Ubicación General'})
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl inline-block border border-slate-200 shadow-sm">
                <QRCodeSVG value={`${window.location.origin}/v/${currentUser?.uid || 'pub'}/loto/${qrModal.id}?print=true`} size={180} />
              </div>

              <p className="text-xs text-slate-400">
                Escaneá este código QR para auditar la tarjeta de bloqueo y etiqueta LOTO OSHA 1910.147 en tiempo real.
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

        {/* Modal de Compartir / Impresión PDF */}
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Procedimiento LOTO - ${shareItem?.equipmentName || ''}`}
          text={shareItem ? `🔒 Procedimiento LOTO OSHA 1910.147\n⚙️ Equipo: ${shareItem.equipmentName}\n📍 Ubicación: ${shareItem.location || 'Planta'}\n📅 Fecha: ${new Date(shareItem.createdAt || Date.now()).toLocaleDateString('es-AR')}` : ''}
          rawMessage={shareItem ? `🔒 Procedimiento LOTO OSHA 1910.147\n⚙️ Equipo: ${shareItem.equipmentName}\n📍 Ubicación: ${shareItem.location || 'Planta'}\n📅 Fecha: ${new Date(shareItem.createdAt || Date.now()).toLocaleDateString('es-AR')}` : ''}
          elementIdToPrint="pdf-content"
          fileName={`LOTO_${shareItem?.equipmentName || 'Equipo'}.pdf`}
        />

        <div className="ats-pdf-offscreen">
          {shareItem && <LOTOPdf data={shareItem} />}
        </div>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar procedimiento LOTO?"
          message="Esta acción no se puede deshacer y borrará la ficha de bloqueo."
          iconEmoji="🗑️"
        />
      </div>
    </AnimatedPage>
  );
}

// Tarjeta de Procedimiento LOTO con Botones Sólidos de Colores idénticos a Aptitudes Médicas
function ProcedureCardItem({ procedure, statusConfig, onStart, onComplete, onView, onEdit, onQR, onShare, onDelete }: any) {
  return (
    <div
      className="card p-[1.25rem] flex flex-col md:flex-row md:items-center justify-between gap-[1rem] transition-all bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
      style={{ borderLeft: `4px solid ${statusConfig.color}` }}
    >
      {/* Icon & Details */}
      <div className="flex items-center gap-[1rem] flex-1 min-w-0">
        <div style={{ background: `${statusConfig.color}15`, border: `2px solid ${statusConfig.color}` }} className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center flex-shrink-0">
          <Lock size={24} color={statusConfig.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[0.5rem] mb-[0.35rem] flex-wrap">
            <h3 className="m-0 text-[1.1rem] font-[800] text-slate-900 dark:text-white truncate">{procedure.equipmentName || 'Equipo Sin Nombre'}</h3>
            <span style={{ background: statusConfig.bg, color: statusConfig.color }} className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {statusConfig.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-[0.75rem] text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Settings size={14} />
              Ubicación: {procedure.location || 'Sin ubicación'}
            </span>
            <span className="flex items-center gap-1">
              <Zap size={14} />
              {procedure.energyTypes?.length || 0} Energía(s)
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(procedure.createdAt || Date.now()).toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* Botones Sólidos y Coloridos idénticos a Aptitudes Médicas */}
      <div className="flex items-center gap-[6px] flex-wrap">
        {/* Botón Editar con fondo Ámbar/Amarillo sólido */}
        <button
          onClick={onEdit}
          title="Editar Procedimiento"
          style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '5px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)' }}
        >
          <Edit3 size={12} /> Editar
        </button>

        {/* Botón Ver con fondo Azul sólido */}
        <button
          onClick={onView}
          title="Ver Ficha LOTO y Generar PDF"
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

function ActiveLOTOList({ activeLOTOs, onComplete, onView }: any) {
  if (activeLOTOs.length === 0) {
    return (
      <EmptyStateIllustrated
        title="Sin LOTOs Activos"
        description="Todos los procedimientos están completados o no hay ninguno iniciado actualmente."
        icon={<CheckCircle2 />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeLOTOs.map((loto: any) => (
        <div key={loto.id} className="bg-white dark:bg-slate-800 border-2 border-green-500 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 animate-pulse">
              <Lock size={20} strokeWidth={2.5} />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase shrink-0 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              LOTO ACTIVO
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="m-0 text-base font-black leading-snug whitespace-nowrap overflow-hidden text-ellipsis mb-2 text-black dark:text-white">
              {loto.equipmentName}
            </h3>
            <div className="flex flex-col gap-1 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Settings size={13} />
                {loto.location || 'Planta'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                Iniciado: {new Date(loto.startedAt || Date.now()).toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {loto.energyTypes?.map((et: string) => {
                const energyType = ENERGY_TYPES.find((e) => e.id === et);
                return (
                  <span key={et} className="px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold flex items-center gap-0.5" style={{ background: `${energyType?.color}15`, color: energyType?.color }}>
                    <span>{energyType?.icon}</span>
                    {energyType?.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end items-center pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <button
              onClick={() => onView(loto)}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none' }}
              className="p-2 rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center"
              title="Ver Detalles"
            >
              <Eye size={15} />
            </button>
            <button
              onClick={() => onComplete(loto.id)}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
              className="p-2 rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center"
              title="Completar LOTO"
            >
              <CheckCircle2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EnergyTypesPanel({ stats, ENERGY_TYPES }: any) {
  const maxCount = Math.max(...(Object.values(stats.energyTypes || { default: 1 }) as any[]), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
        <h3 className="m-0 mb-6 text-base font-black text-slate-800 dark:text-slate-100">
          Energía por Tipo (OSHA 1910.147)
        </h3>
        {Object.entries(stats.energyTypes || {}).length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No hay datos registrados
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {Object.entries(stats.energyTypes).map(([typeId, count]) => {
              const energyType = ENERGY_TYPES.find((e: any) => e.id === typeId);
              const percentage = ((count as any) / maxCount) * 100;

              return (
                <div key={typeId} className="p-4 rounded-xl border" style={{ background: `${energyType?.color}10`, borderColor: `${energyType?.color}30` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">{energyType?.icon}</span>
                    <div>
                      <div className="text-xs font-bold uppercase" style={{ color: energyType?.color }}>
                        {energyType?.name}
                      </div>
                      <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                        {count as any}
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${energyType?.color}30` }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%`, background: energyType?.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
        <h3 className="m-0 mb-4 text-base font-extrabold text-slate-900 dark:text-white">
          Tipos de Energía Normados (OSHA 1910.147)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ENERGY_TYPES.map((type: any) => (
            <div key={type.id} style={{ background: `${type.color}10`, borderColor: `${type.color}30` }} className="p-3 rounded-xl border flex items-center gap-2">
              <span className="text-2xl">{type.icon}</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{type.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}