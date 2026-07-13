import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Key, AlertTriangle, Plus, Search,
  FileText, Eye, Edit3, Trash2, CheckCircle2,
  XCircle, Clock, User, Calendar,
  Shield, Zap, Settings, AlertCircle,
  TrendingUp, BarChart3, Activity, Share2, ArrowLeft } from
'lucide-react';
import ShareModal from '../components/ShareModal';
import LOTOPdf from '../components/LOTOPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';

// Tipos de energía según OSHA 1910.147
const ENERGY_TYPES = [
{ id: 'electrical', name: 'Eléctrica', icon: '⚡', color: '#fbbf24' },
{ id: 'mechanical', name: 'Mecánica', icon: '🔧', color: '#6b7280' },
{ id: 'hydraulic', name: 'Hidráulica', icon: '💧', color: '#3b82f6' },
{ id: 'pneumatic', name: 'Neumática', icon: '💨', color: '#9ca3af' },
{ id: 'chemical', name: 'Química', icon: '🧪', color: '#10b981' },
{ id: 'thermal', name: 'Térmica', icon: '🔥', color: '#ef4444' },
{ id: 'gravitational', name: 'Gravitacional', icon: '⬇️', color: '#8b5cf6' },
{ id: 'radiation', name: 'Radiación', icon: '☢️', color: '#f59e0b' }];


// Tipos de dispositivos LOTO
const LOTO_DEVICES = [
{ id: 'padlock', name: 'Candado', icon: '🔒' },
{ id: 'hasp', name: 'Grampa Múltiple', icon: '📎' },
{ id: 'breaker_lock', name: 'Bloqueo Interruptor', icon: '⚡' },
{ id: 'valve_lock', name: 'Bloqueo Válvula', icon: '🔩' },
{ id: 'plug_lock', name: 'Bloqueo Enchufe', icon: '🔌' },
{ id: 'tagout', name: 'Etiqueta', icon: '🏷️' }];


// Estados de un procedimiento LOTO
const LOTO_STATUS = {
  active: { label: 'ACTIVO', color: '#16a34a', bg: '#f0fdf4' },
  pending: { label: 'PENDIENTE', color: '#f59e0b', bg: '#fffbeb' },
  completed: { label: 'COMPLETADO', color: '#3b82f6', bg: '#eff6ff' },
  suspended: { label: 'SUSPENDIDO', color: '#6b7280', bg: '#f3f4f6' },
  emergency: { label: 'EMERGENCIA', color: '#dc2626', bg: '#fef2f2' }
};

// Pasos del procedimiento LOTO (OSHA 1910.147)
const LOTO_STEPS = [
{ id: 1, name: 'Preparación', description: 'Identificar equipos y energías' },
{ id: 2, name: 'Notificación', description: 'Informar a personal afectado' },
{ id: 3, name: 'Apagado', description: 'Detener equipo normalmente' },
{ id: 4, name: 'Aislamiento', description: 'Bloquear fuentes de energía' },
{ id: 5, name: 'LOTO', description: 'Colocar candados y etiquetas' },
{ id: 6, name: 'Disipación', description: 'Liberar energía residual' },
{ id: 7, name: 'Verificación', description: 'Confirmar aislamiento (Try-out)' }];


// Pasos de reactivación
const REACTIVATION_STEPS = [
{ id: 1, name: 'Inspección', description: 'Verificar equipo y área' },
{ id: 2, name: 'Remoción LOTO', description: 'Quitar candados y etiquetas' },
{ id: 3, name: 'Notificación', description: 'Informar al personal' },
{ id: 4, name: 'Reactivación', description: 'Restaurar energía' }];


export default function LOTOManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const [procedures, setProcedures] = useState<any[]>([]);
  const [activeLOTOs, setActiveLOTOs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [activeTab, setActiveTab] = useState('procedures');
  const [shareItem, setShareItem] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  const [newProcedure, setNewProcedure] = useState({
    id: '',
    equipmentName: '',
    equipmentId: '',
    location: '',
    department: '',
    energyTypes: [],
    lotoDevices: [],
    authorizedWorkers: [],
    steps: LOTO_STEPS.map((s) => ({ ...s, completed: false, completedBy: '', completedAt: '' })),
    reactivationSteps: REACTIVATION_STEPS.map((s) => ({ ...s, completed: false })),
    status: 'pending',
    createdAt: '',
    startedAt: '',
    completedAt: '',
    observations: '',
    photos: []
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = () => {
      const savedProcedures = localStorage.getItem('loto_procedures_db');
      const savedActiveLOTOs = localStorage.getItem('loto_active_db');
      if (savedProcedures) setProcedures(JSON.parse(savedProcedures));
      if (savedActiveLOTOs) setActiveLOTOs(JSON.parse(savedActiveLOTOs));
    };

    loadData();

    const handleStorageChange = (e) => {
      if (e.key === 'loto_procedures_db' || e.key === 'loto_active_db') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const params = new URLSearchParams(window.location.search);
    if (params.get('created')) {
      loadData();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const saveProcedures = (data) => {
    localStorage.setItem('loto_procedures_db', JSON.stringify(data));
    setProcedures(data);
  };

  const saveActiveLOTOs = (data) => {
    localStorage.setItem('loto_active_db', JSON.stringify(data));
    setActiveLOTOs(data);
  };

  const handleCreateProcedure = () => {
    navigate('/loto/new');
  };

  const resetForm = () => {
    setNewProcedure({
      id: '',
      equipmentName: '',
      equipmentId: '',
      location: '',
      department: '',
      energyTypes: [],
      lotoDevices: [],
      authorizedWorkers: [],
      steps: LOTO_STEPS.map((s) => ({ ...s, completed: false, completedBy: '', completedAt: '' })),
      reactivationSteps: REACTIVATION_STEPS.map((s) => ({ ...s, completed: false })),
      status: 'pending',
      createdAt: '',
      startedAt: '',
      completedAt: '',
      observations: '',
      photos: []
    });
  };

  const startLOTO = (procedureId) => {
    const procedure = procedures.find((p) => p.id === procedureId);
    if (!procedure) return;

    const activeLOTO = {
      ...procedure,
      startedAt: new Date().toISOString(),
      status: 'active'
    };

    const updatedProcedures = procedures.map((p) =>
    p.id === procedureId ? { ...p, status: 'active' } : p
    );
    saveProcedures(updatedProcedures);

    const updatedActive = [activeLOTO, ...activeLOTOs];
    saveActiveLOTOs(updatedActive);
  };

  const completeLOTO = (procedureId) => {
    const updatedProcedures = procedures.map((p) =>
    p.id === procedureId ? {
      ...p,
      status: 'completed',
      completedAt: new Date().toISOString()
    } : p
    );
    saveProcedures(updatedProcedures);

    const updatedActive = activeLOTOs.filter((l) => l.id !== procedureId);
    saveActiveLOTOs(updatedActive);
  };

  const deleteProcedure = (id) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      saveProcedures(procedures.filter((p) => p.id !== confirmModal.payload));
      saveActiveLOTOs(activeLOTOs.filter((l) => l.id !== confirmModal.payload));
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredProcedures = procedures.filter((p) => {
    const matchesSearch = p.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: procedures.length,
    active: activeLOTOs.length,
    pending: procedures.filter((p) => p.status === 'pending').length,
    completed: procedures.filter((p) => p.status === 'completed').length,
    energyTypes: procedures.reduce((acc, p) => {
      p.energyTypes?.forEach((et) => {
        acc[et] = (acc[et] || 0) + 1;
      });
      return acc;
    }, {})
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-24 pt-24 md:pt-28 min-h-screen">
            <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Procedimiento LOTO - ${shareItem?.equipmentName || ''}`}
        text={shareItem ? `🔒 Procedimiento LOTO\n⚙️ Equipo: ${shareItem.equipmentName}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${new Date(shareItem.createdAt).toLocaleDateString('es-AR')}` : ''}
        rawMessage={shareItem ? `🔒 Procedimiento LOTO\n⚙️ Equipo: ${shareItem.equipmentName}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${new Date(shareItem.createdAt).toLocaleDateString('es-AR')}` : ''}
        elementIdToPrint="pdf-content"
        fileName={`LOTO_${shareItem?.equipmentName || 'Procedimiento'}.pdf`} />
      

            <div className="fixed left-[0] opacity-[0.01] top-[0] pointer-events-[none]">
                {shareItem && <LOTOPdf data={shareItem} />}
            </div>
            <PremiumHeader
        title="Lockout/Tagout (LOTO)"
        subtitle={`OSHA 1910.147 • ${activeLOTOs.length} activos`}
        icon={<Lock size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
      

            <div className="flex gap-[1rem] mb-[1.5rem] mt-[1.5rem]">
                <></>
            </div>

            <div className="mb-8 flex gap-4 flex-wrap mt-6">
                <button
                    onClick={() => navigate('/loto/new')}
                    className="px-6 py-3 text-white rounded-xl font-bold text-base flex items-center gap-2 cursor-pointer transition-all hover:opacity-90"
                    style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                >
                    <Plus size={20} strokeWidth={2.5} color="#ffffff" />
                    Nuevo Procedimiento LOTO
                </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
          icon={<FileText size={24} />}
          label="Total Procedimientos"
          value={stats.total}
          color="#3B82F6"
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)" />
        
                <StatCard
          icon={<Lock size={24} />}
          label="LOTO Activos"
          value={stats.active}
          color="#16a34a"
          gradient="linear-gradient(135deg, #16a34a, #059669)" />
        
                <StatCard
          icon={<Clock size={24} />}
          label="Pendientes"
          value={stats.pending}
          color="#f59e0b"
          gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
        
                <StatCard
          icon={<CheckCircle2 size={24} />}
          label="Completados"
          value={stats.completed}
          color="#8b5cf6"
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
        
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b-2 border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto no-scrollbar">
                <TabButton
          active={activeTab === 'procedures'}
          onClick={() => setActiveTab('procedures')}
          icon={<FileText size={18} />}
          label="Procedimientos"
          count={procedures.length} />
        
                <TabButton
          active={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
          icon={<Lock size={18} />}
          label="LOTO Activos"
          count={activeLOTOs.length}
          badge={activeLOTOs.length} />
        
                <TabButton
          active={activeTab === 'energy'}
          onClick={() => setActiveTab('energy')}
          icon={<Zap size={18} />}
          label="Tipos de Energía" />
        
            </div>

            {/* Content by Tab */}
            {activeTab === 'procedures' &&
      <>
                    {/* Search & Filters */}
                    <div className="flex gap-4 mb-6 flex-wrap">
                        <div className="flex-1 min-w-[280px] relative">
                            <Search
              size={20}
              color="var(--color-text-muted)"
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            
                            <input
              type="text"
              placeholder="Buscar por equipo, ubicación, departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors" />
            
                        </div>

                        <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold outline-none cursor-pointer focus:border-blue-500 transition-colors appearance-none">
            
                            <option value="all">Todos los Estados</option>
                            {Object.entries(LOTO_STATUS).map(([key, value]) =>
            <option key={key} value={key}>{value.label}</option>
            )}
                        </select>
                    </div>

                    {/* Procedures List */}
                    {filteredProcedures.length === 0 ?
        <EmptyStateIllustrated
          title="Sin Procedimientos LOTO"
          description="Creá procedimientos de Lockout/Tagout según OSHA 1910.147 para control de energías peligrosas."
          icon={<Lock />} /> :


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProcedures.map((procedure) =>
          <ProcedureCard
            key={procedure.id}
            procedure={procedure}
            statusConfig={LOTO_STATUS[procedure.status] || LOTO_STATUS.pending}
            onStart={() => startLOTO(procedure.id)}
            onComplete={() => completeLOTO(procedure.id)}
            onView={() => setSelectedProcedure(procedure)}
            onEdit={() => navigate('/loto/new', { state: { editData: procedure } })}
            onShare={() => setShareItem(procedure)}
            onDelete={() => deleteProcedure(procedure.id)} />

          )}
                        </div>
        }
                </>
      }

            {activeTab === 'active' &&
      <ActiveLOTOList
        activeLOTOs={activeLOTOs}
        onComplete={completeLOTO}
        onView={setSelectedProcedure} />

      }

            {activeTab === 'energy' &&
      <EnergyTypesPanel stats={stats} ENERGY_TYPES={ENERGY_TYPES} />
      }

            {/* Modal de Crear Procedimiento */}
            {showAddModal &&
      <CreateProcedureModal
        procedure={newProcedure}
        setProcedure={setNewProcedure}
        onSave={handleCreateProcedure}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        ENERGY_TYPES={ENERGY_TYPES}
        LOTO_DEVICES={LOTO_DEVICES}
        LOTO_STEPS={LOTO_STEPS} />

      }

            {/* Modal de Detalle */}
            {selectedProcedure &&
      <ProcedureDetailModal
        procedure={selectedProcedure}
        statusConfig={LOTO_STATUS[selectedProcedure.status] || LOTO_STATUS.pending}
        onClose={() => setSelectedProcedure(null)}
        ENERGY_TYPES={ENERGY_TYPES}
        LOTO_DEVICES={LOTO_DEVICES} />

      }

            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar procedimiento?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}

// Componentes Auxiliares
function StatCard({ icon, label, value, color, gradient }) {
  return (
    <div 
      style={{ 
        backgroundColor: 'var(--color-surface, #ffffff)', 
        border: `2px solid ${color}40`,
        boxShadow: `0 4px 18px ${color}08`,
        borderRadius: '16px',
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        transition: 'all 0.2s ease'
      }} 
      className="card hover:translate-y-[-2px] hover:shadow-md"
    >
      <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-5" style={{ background: gradient }} />
      <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: gradient, boxShadow: `0 4px 15px ${color}30` }}>
              {React.cloneElement(icon, { color: '#ffffff', size: 24 })}
          </div>
      </div>
      <div style={{ color: 'var(--color-text, #0f172a)' }} className="text-3xl font-black leading-none mt-2">
          {value}
      </div>
      <div style={{ color: 'var(--color-text-muted, #64748b)' }} className="text-xs font-bold uppercase tracking-wider">
          {label}
      </div>
    </div>);

}

function TabButton({ active, onClick, icon, label, count, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm cursor-pointer transition-colors relative border-none ${active ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
      
            {icon}
            {label}
            {count !== undefined &&
      <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {count}
                </span>
      }
            {badge > 0 &&
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[0.7rem] font-black">
                    {badge}
                </span>
      }
        </button>);

}

function ProcedureCard({ procedure, statusConfig, onStart, onComplete, onView, onEdit, onShare, onDelete }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 relative overflow-hidden" style={{ borderTop: `4px solid ${statusConfig.color}` }}>
            {/* Header: Status and Icon */}
            <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${statusConfig.color}15` }}>
                    <Lock size={20} color={statusConfig.color} strokeWidth={2.5} />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase shrink-0" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3 className="m-0 text-base font-black leading-snug whitespace-nowrap overflow-hidden text-ellipsis mb-2 text-black dark:text-white">
                    {procedure.equipmentName}
                </h3>
                
                <div className="flex flex-col gap-1.5 text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                        <Settings size={13} className="text-slate-700 dark:text-slate-300" />
                        {procedure.location || 'Sin ubicación'}
                    </span>
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                        <Zap size={13} className="text-slate-700 dark:text-slate-300" />
                        {procedure.energyTypes?.length || 0} energías
                    </span>
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                        <Calendar size={13} className="text-slate-700 dark:text-slate-300" />
                        {new Date(procedure.createdAt).toLocaleDateString('es-AR')}
                    </span>
                </div>
            </div>

            {/* Actions at the bottom */}
            <div className="flex gap-2 justify-end items-center pt-3 border-t border-slate-100 dark:border-slate-700/50">
                {procedure.status === 'pending' &&
                <button
                  onClick={onStart}
                  style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }}
                  className="p-2 rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center"
                  title="Iniciar LOTO">
                                <Lock size={15} />
                            </button>
                }
                {procedure.status === 'active' &&
                <button
                  onClick={onComplete}
                  style={{ backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }}
                  className="p-2 rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center"
                  title="Completar LOTO">
                                <CheckCircle2 size={15} />
                            </button>
                }
                <button
                  onClick={onEdit}
                  style={{ backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }}
                  className="p-2 rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center"
                  title="Editar Procedimiento">
                            <Edit3 size={15} />
                </button>
                <button
                  onClick={onShare}
                  style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }}
                  className="p-2 rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center"
                  title="Compartir PDF">
                            <Share2 size={15} />
                </button>
                <button
                  onClick={onDelete}
                  style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }}
                  className="p-2 rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center"
                  title="Eliminar">
                            <Trash2 size={15} />
                </button>
            </div>
        </div>
  );
}

function ActiveLOTOList({ activeLOTOs, onComplete, onView }) {
  if (activeLOTOs.length === 0) {
    return (
      <EmptyStateIllustrated
        title="Sin LOTOs Activos"
        description="Todos los procedimientos están completados o no hay ninguno iniciado actualmente."
        icon={<CheckCircle2 />}
        color="#16a34a" />);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLOTOs.map((loto) =>
      <div key={loto.id} className="bg-white dark:bg-slate-800 border-2 border-green-500 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md relative overflow-hidden">
                    {/* Header: Title & pulsating status */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 animate-pulse">
                            <Lock size={20} strokeWidth={2.5} />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase shrink-0 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                            LOTO ACTIVO
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="m-0 text-base font-black leading-snug whitespace-nowrap overflow-hidden text-ellipsis mb-2 text-black dark:text-white">
                            {loto.equipmentName}
                        </h3>
                        <p className="m-0 text-xs font-bold flex flex-col gap-1" style={{ color: 'var(--color-text)' }}>
                            <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                                <Settings size={13} className="text-slate-700 dark:text-slate-300" />
                                {loto.location}
                            </span>
                            <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                                <Calendar size={13} className="text-slate-700 dark:text-slate-300" />
                                Iniciado: {new Date(loto.startedAt).toLocaleString('es-AR')}
                            </span>
                        </p>
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                            {loto.energyTypes?.map((et) => {
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

                    {/* Actions */}
                    <div className="flex gap-2 justify-end items-center pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <button
                          onClick={() => onView(loto)}
                          style={{ backgroundColor: '#3b82f6', color: '#ffffff', border: 'none' }}
                          className="p-2 rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center"
                          title="Ver Detalles">
                            <Eye size={15} />
                        </button>
                        <button
                          onClick={() => onComplete(loto.id)}
                          style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none' }}
                          className="p-2 rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center"
                          title="Completar LOTO">
                            <CheckCircle2 size={15} />
                        </button>
                    </div>
                </div>
            )}
        </div>
  );
}

function EnergyTypesPanel({ stats, ENERGY_TYPES }) {
  const maxCount = Math.max(...(Object.values(stats.energyTypes || { default: 1 }) as any[]), 1);

  return (
    <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
                <h3 className="m-0 mb-6 text-base font-black text-slate-800 dark:text-slate-100">
                    Energía por Tipo
                </h3>
                {Object.entries(stats.energyTypes || {}).length === 0 ?
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                        No hay datos registrados
                    </p> :

        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                        {Object.entries(stats.energyTypes).map(([typeId, count]) => {
            const energyType = ENERGY_TYPES.find((e) => e.id === typeId);
            const percentage = (count as any) / maxCount * 100;

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
                                </div>);

          })}
                    </div>
        }
            </div>

            {/* Referencia de tipos de energía */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
                <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800]">
                    Tipos de Energía (OSHA 1910.147)
                </h3>
                <div className="grid grid-template-columns-[repeat(auto-fill,_minmax(150px,_1fr))] gap-[0.75rem]">
                    {ENERGY_TYPES.map((type) =>
          <div key={type.id} style={{

            background: `${type.color}10`,
            border: `1px solid ${type.color}30`


          }} className="p-[0.75rem] rounded-[var(--radius-lg)] text-center">
                            <span className="text-[2.5rem] block mb-[0.5rem]">{type.icon}</span>
                            <span className="text-[0.85rem] font-[700] text-[var(--color-text)]">
                                {type.name}
                            </span>
                        </div>
          )}
                </div>
            </div>
        </div>);

}

// Modal de Crear Procedimiento
function CreateProcedureModal({ procedure, setProcedure, onSave, onClose, ENERGY_TYPES, LOTO_DEVICES, LOTO_STEPS }) {
  const toggleEnergyType = (typeId) => {
    const current = procedure.energyTypes || [];
    const updated = current.includes(typeId) ?
    current.filter((t) => t !== typeId) :
    [...current, typeId];
    setProcedure({ ...procedure, energyTypes: updated });
  };

  const toggleLOTODevice = (deviceId) => {
    const current = procedure.lotoDevices || [];
    const updated = current.includes(deviceId) ?
    current.filter((d) => d !== deviceId) :
    [...current, deviceId];
    setProcedure({ ...procedure, lotoDevices: updated });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div
        className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}>
        
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700 p-6 sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md z-10">
                    <h2 className="m-0 text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                        Nuevo Procedimiento LOTO
                    </h2>
                    <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 border-none rounded-xl cursor-pointer transition-colors">
            
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
                    {/* Equipo */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre del Equipo *</label>
                        <input
              type="text"
              value={procedure.equipmentName}
              onChange={(e) => setProcedure({ ...procedure, equipmentName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-[0.95rem] font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 box-border"
              placeholder="Ej: Compresor Principal" />
            
                    </div>

                    {/* ID Equipo */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ID Equipo</label>
                        <input
              type="text"
              value={procedure.equipmentId}
              onChange={(e) => setProcedure({ ...procedure, equipmentId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-[0.95rem] font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 box-border"
              placeholder="Ej: COMP-001" />
            
                    </div>

                    {/* Ubicación */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Ubicación</label>
                        <input
              type="text"
              value={procedure.location}
              onChange={(e) => setProcedure({ ...procedure, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-[0.95rem] font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 box-border"
              placeholder="Ej: Sala de Máquinas" />
            
                    </div>

                    {/* Departamento */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Departamento</label>
                        <input
              type="text"
              value={procedure.department}
              onChange={(e) => setProcedure({ ...procedure, department: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-[0.95rem] font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 box-border"
              placeholder="Ej: Mantenimiento" />
            
                    </div>
                </div>

                {/* Tipos de Energía */}
                <div className="mt-6 px-6">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tipos de Energía a Aislar</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {ENERGY_TYPES.map((type) =>
            <button
              key={type.id}
              onClick={() => toggleEnergyType(type.id)}
              style={{

                background: procedure.energyTypes?.includes(type.id) ?
                `${type.color}20` :
                'var(--color-background)',
                border: `2px solid ${procedure.energyTypes?.includes(type.id) ? type.color : 'var(--color-border)'}`







              }} className="p-[0.75rem] rounded-[var(--radius-lg)] cursor-pointer flex flex-col items-center gap-[0.5rem] transition-[all_var(--transition-fast)]">
              
                                <span className="text-3xl">{type.icon}</span>
                                <span style={{


                color: procedure.energyTypes?.includes(type.id) ? type.color : 'var(--color-text-muted)'
              }} className="text-[0.75rem] font-[700]">
                                    {type.name}
                                </span>
                            </button>
            )}
                    </div>
                </div>

                {/* Dispositivos LOTO */}
                <div className="mt-6 px-6">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Dispositivos LOTO Requeridos</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {LOTO_DEVICES.map((device) =>
            <button
              key={device.id}
              onClick={() => toggleLOTODevice(device.id)}
              style={{

                background: procedure.lotoDevices?.includes(device.id) ?
                'var(--color-primary)' :
                'var(--color-background)',
                color: procedure.lotoDevices?.includes(device.id) ? '#fff' : 'var(--color-text)',
                border: `2px solid ${procedure.lotoDevices?.includes(device.id) ? 'var(--color-primary)' : 'var(--color-border)'}`







              }} className="p-[0.75rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center gap-[0.5rem] font-[600] transition-[all_var(--transition-fast)]">
              
                                <span className="text-[1.5rem]">{device.icon}</span>
                                <span className="text-[0.85rem]">{device.name}</span>
                            </button>
            )}
                    </div>
                </div>

                {/* Pasos del Procedimiento */}
                <div className="mt-6 px-6">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pasos del Procedimiento (OSHA 1910.147)</label>
                    <div className="flex flex-col gap-2">
                        {LOTO_STEPS.map((step, idx) =>
            <div key={step.id} className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl flex items-center gap-4">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">
                                    {step.id}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-[0.95rem] text-slate-800 dark:text-slate-100">{step.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.description}</div>
                                </div>
                            </div>
            )}
                    </div>
                </div>

                {/* Observaciones */}
                <div className="mt-6 px-6">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Observaciones Adicionales</label>
                    <textarea
            value={procedure.observations}
            onChange={(e) => setProcedure({ ...procedure, observations: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-[0.95rem] font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-h-[80px] resize-y box-border"
            placeholder="Información adicional sobre el procedimiento..." />
          
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 p-6">
                    <button
            onClick={onClose}
            className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            
                        Cancelar
                    </button>
                    <button
            onClick={onSave}
            className="flex-1 py-3 bg-blue-600 text-white border-none rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition-colors">
            
                        Crear Procedimiento
                    </button>
                </div>
            </div>
        </div>);

}

// Modal de Detalle
function ProcedureDetailModal({ procedure, statusConfig, onClose, ENERGY_TYPES, LOTO_DEVICES }) {
  return (
    <div
      className="modal-fullscreen-overlay"
      onClick={onClose}>
      
            <div
        className="bg-white dark:bg-slate-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}>
        
                {/* Header */}
                <div className="p-6 flex justify-between items-center mb-6 sticky top-0 z-10 rounded-t-3xl backdrop-blur-md" style={{ background: statusConfig.bg, borderBottom: `2px solid ${statusConfig.color}` }}>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${statusConfig.color}, ${statusConfig.color}cc)` }}>
                            <Lock size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="m-0 text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                {procedure.equipmentName}
                            </h2>
                            <p className="m-0 mt-1 text-slate-500 dark:text-slate-400 text-sm">
                                {procedure.location || 'Sin ubicación'} • {statusConfig.label}
                            </p>
                        </div>
                    </div>
                    <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 border-none rounded-xl cursor-pointer transition-colors">
            
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Tipos de Energía */}
                <div className="mb-6 px-6">
                    <h3 className="text-sm font-black mb-3 uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Tipos de Energía
                    </h3>
                    <div className="flex flex-wrap gap-[0.5rem]">
                        {procedure.energyTypes?.map((typeId) => {
              const type = ENERGY_TYPES.find((t) => t.id === typeId);
              return (
                <span key={typeId} style={{

                  background: `${type?.color}20`,
                  color: type?.color






                }} className="p-[0.5rem_0.85rem] rounded-[var(--radius-full)] text-[0.8rem] font-[700] flex items-center gap-[0.35rem]">
                                    <span>{type?.icon}</span>
                                    {type?.name}
                                </span>);

            })}
                    </div>
                </div>

                {/* Dispositivos LOTO */}
                <div className="mb-6 px-6">
                    <h3 className="text-sm font-black mb-3 uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Dispositivos LOTO
                    </h3>
                    <div className="flex flex-wrap gap-[0.5rem]">
                        {procedure.lotoDevices?.map((deviceId) => {
              const device = LOTO_DEVICES.find((d) => d.id === deviceId);
              return (
                <span key={deviceId} className="p-[0.5rem_0.85rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-lg)] text-[0.8rem] font-[600] flex items-center gap-[0.35rem]">









                  
                                    <span>{device?.icon}</span>
                                    {device?.name}
                                </span>);

            })}
                    </div>
                </div>

                {/* Pasos LOTO */}
                <div className="mb-6 px-6">
                    <h3 className="text-sm font-black mb-3 uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Pasos del Procedimiento
                    </h3>
                    <div className="flex flex-col gap-2">
                        {LOTO_STEPS.map((step: any, idx) =>
            <div key={step.id} className={`px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl flex items-center gap-4 ${step.completed ? 'opacity-60' : 'opacity-100'}`}>
                                <div style={{


                background: step.completed ? '#16a34a' : 'var(--color-primary)'







              }} className="w-[32px] h-[32px] text-[#fff] rounded-[50%] flex items-center justify-center font-[900] text-[0.9rem]">
                                    {step.completed ? <CheckCircle2 size={18} /> : step.id}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-[0.95rem] text-slate-800 dark:text-slate-100">{step.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.description}</div>
                                    {step.completed &&
                <div className="text-[0.75rem] text-[#16a34a] mt-[0.25rem]">
                                            Completado por {step.completedBy} el {new Date(step.completedAt).toLocaleString()}
                                        </div>
                }
                                </div>
                            </div>
            )}
                    </div>
                </div>

                {/* Información adicional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 px-6">
                    <InfoDetail label="ID Equipo" value={procedure.equipmentId || '-'} />
                    <InfoDetail label="Departamento" value={procedure.department || '-'} />
                    <InfoDetail label="Creado" value={new Date(procedure.createdAt).toLocaleString()} />
                    {procedure.startedAt &&
          <InfoDetail label="Iniciado" value={new Date(procedure.startedAt).toLocaleString()} />
          }
                    {procedure.completedAt &&
          <InfoDetail label="Completado" value={new Date(procedure.completedAt).toLocaleString()} />
          }
                </div>

                {/* Observaciones */}
                {procedure.observations &&
        <div className="p-[1rem] bg-[var(--color-background)] rounded-[var(--radius-lg)] mb-[1.5rem]">




          
                        <h4 className="m-[0_0_0.5rem_0] text-[0.85rem] font-[700]">
                            Observaciones
                        </h4>
                        <p className="m-[0] text-[0.9rem] text-[var(--color-text)] line-height-[1.6]">
                            {procedure.observations}
                        </p>
                    </div>
        }

                {/* Alerta OSHA */}
                <div className="p-[1rem] bg-[#fef3c7] border-[1px_solid_#f59e0b] rounded-[var(--radius-lg)] mb-[1.5rem] flex gap-[0.75rem]">







          
                    <AlertTriangle size={20} color="#d97706" className="flex-shrink-[0]" />
                    <div>
                        <h4 className="m-[0_0_0.25rem_0] text-[0.85rem] font-[700] text-[#d97706]">
                            OSHA 1910.147
                        </h4>
                        <p className="m-[0] text-[0.8rem] text-[#92400e] line-height-[1.5]">
                            Este procedimiento debe seguir estrictamente los requisitos de OSHA para el control de energía peligrosa (Lockout/Tagout).
                        </p>
                    </div>
                </div>

                <button
          onClick={onClose}
          className="btn-primary w-[100%]">

          
                    Cerrar
                </button>
            </div>
        </div>);

}

function InfoDetail({ label, value }) {
  return (
    <div>
            <div className="text-[0.7rem] font-[700] text-[var(--color-text-muted)] uppercase mb-[0.25rem]">
                {label}
            </div>
            <div className="text-[0.95rem] font-[600] text-[var(--color-text)]">
                {value}
            </div>
        </div>);

}