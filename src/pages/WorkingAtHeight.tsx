import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardHat, AlertTriangle, Plus, Search,
  FileText, Eye, Edit3, Trash2, CheckCircle2,
  XCircle, Clock, User, Users, Calendar,
  Shield, ArrowDown, Ruler, Anchor, CheckSquare,
  BarChart3, AlertCircle, Activity, Layers, Share2, ArrowLeft } from
'lucide-react';
import ShareModal from '../components/ShareModal';
import WorkingAtHeightPdf from '../components/WorkingAtHeightPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import { usePaywall } from '../hooks/usePaywall';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';

// Límites según OSHA 1926.501 y normas internacionales
const HEIGHT_LIMITS = {
  general: { min: 1.8, unit: 'm', name: 'Altura General (OSHA)' },
  construction: { min: 1.8, unit: 'm', name: 'Construcción (OSHA 1926)' },
  scaffolding: { min: 3.0, unit: 'm', name: 'Andamios' },
  steel: { min: 2.4, unit: 'm', name: 'Estructuras de Acero' },
  ladder: { min: 1.2, unit: 'm', name: 'Escaleras Fijas' }
};

// Tipos de trabajo en altura
const WORK_TYPES = [
{ id: 'scaffolding', name: 'Andamios', icon: '🏗️' },
{ id: 'ladder', name: 'Escalera', icon: '🪜' },
{ id: 'roof', name: 'Techos', icon: '🏠' },
{ id: 'platform', name: 'Plataforma', icon: '📦' },
{ id: 'lift', name: 'Elevador/Aerial', icon: '⬆️' },
{ id: 'structure', name: 'Estructura', icon: '🔩' },
{ id: 'edge', name: 'Borde', icon: '⬇️' },
{ id: 'opening', name: 'Abertura', icon: '⭕' },
{ id: 'other', name: 'Otro', icon: '📍' }];


// Equipamiento de protección contra caídas
const FALL_PROTECTION = [
{ id: 'harness', name: 'Arnés de Cuerpo', icon: '🦺', required: true },
{ id: 'lanyard', name: 'Cabo de Vida', icon: '🔗', required: true },
{ id: 'shock_absorber', name: 'Absorbedor Impacto', icon: '〰️', required: true },
{ id: 'anchor', name: 'Punto de Anclaje', icon: '🔩', required: true },
{ id: 'lifeline', name: 'Línea de Vida', icon: '➰', required: false },
{ id: 'retrieval', name: 'Sistema Rescate', icon: '🎣', required: false },
{ id: 'guardrail', name: 'Baranda', icon: '🚧', required: false },
{ id: 'net', name: 'Red de Seguridad', icon: '🕸️', required: false },
{ id: 'helmet', name: 'Casco con Barbiquejo', icon: '⛑️', required: true },
{ id: 'gloves', name: 'Guantes', icon: '🧤', required: true }];


// Factores de riesgo
const RISK_FACTORS = [
{ id: 'wind', name: 'Viento Fuerte', icon: '💨', threshold: '≥ 40 km/h' },
{ id: 'rain', name: 'Lluvia', icon: '🌧️', threshold: 'Superficie mojada' },
{ id: 'ice', name: 'Hielo/Nieve', icon: '❄️', threshold: 'Superficie resbaladiza' },
{ id: 'heat', name: 'Calor Extremo', icon: '🔥', threshold: '≥ 35°C' },
{ id: 'night', name: 'Trabajo Nocturno', icon: '🌙', threshold: 'Visibilidad reducida' },
{ id: 'fatigue', name: 'Fatiga', icon: '😴', threshold: 'Turno extendido' },
{ id: 'height', name: 'Altura Elevada', icon: '📏', threshold: '≥ 6 metros' },
{ id: 'unstable', name: 'Superficie Inestable', icon: '⚠️', threshold: 'Base irregular' }];


// Estados del permiso
const PERMIT_STATUS = {
  draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
  pending: { label: 'PENDIENTE', color: '#f59e0b', bg: '#fffbeb' },
  active: { label: 'ACTIVO', color: '#16a34a', bg: '#f0fdf4' },
  suspended: { label: 'SUSPENDIDO', color: '#dc2626', bg: '#fef2f2' },
  completed: { label: 'COMPLETADO', color: '#3b82f6', bg: '#eff6ff' },
  expired: { label: 'EXPIRADO', color: '#9ca3af', bg: '#f9fafb' }
};

export default function WorkingAtHeight(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const [permits, setPermits] = useState([]);
  const [activePermits, setActivePermits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [activeTab, setActiveTab] = useState('permits');
  const [shareItem, setShareItem] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });
  const { isPro } = usePaywall();

  const [newPermit, setNewPermit] = useState({
    id: '',
    workerName: '',
    workType: '',
    location: '',
    workDescription: '',
    height: '',
    duration: '',
    riskFactors: [],
    fallProtection: [],
    anchorPoints: [],
    rescuePlan: '',
    weatherCheck: false,
    equipmentCheck: false,
    training: false,
    supervisor: '',
    status: 'draft',
    validFrom: '',
    validUntil: '',
    createdAt: '',
    authorizedAt: '',
    completedAt: '',
    observations: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = () => {
      const savedPermits = localStorage.getItem('working_height_permits_db');
      const savedActive = localStorage.getItem('working_height_active_db');
      if (savedPermits) setPermits(JSON.parse(savedPermits));
      if (savedActive) setActivePermits(JSON.parse(savedActive));
    };

    loadData();

    const handleStorageChange = (e) => {
      if (e.key === 'working_height_permits_db' || e.key === 'working_height_active_db') {
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

  const savePermits = (data) => {
    localStorage.setItem('working_height_permits_db', JSON.stringify(data));
    setPermits(data);
  };

  const saveActivePermits = (data) => {
    localStorage.setItem('working_height_active_db', JSON.stringify(data));
    setActivePermits(data);
  };

  const handleCreatePermit = () => {
    navigate('/working-at-height/new');
  };

  const authorizePermit = (permitId) => {
    const p = permits.find((p) => p.id === permitId);
    if (!p) return;

    const now = new Date().toISOString();
    const validUntil = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    const authorizedPermit = {
      ...p,
      status: 'active',
      authorizedAt: now,
      validFrom: now,
      validUntil
    };

    const updatedPermits = permits.map((p) =>
    p.id === permitId ? authorizedPermit : p
    );
    savePermits(updatedPermits);

    const updatedActive = [authorizedPermit, ...activePermits];
    saveActivePermits(updatedActive);
  };

  const suspendPermit = (permitId) => {
    const updatedPermits = permits.map((p) =>
    p.id === permitId ? { ...p, status: 'suspended' } : p
    );
    savePermits(updatedPermits);
    saveActivePermits(activePermits.filter((p) => p.id !== permitId));
  };

  const completePermit = (permitId) => {
    const updatedPermits = permits.map((p) =>
    p.id === permitId ? {
      ...p,
      status: 'completed',
      completedAt: new Date().toISOString()
    } : p
    );
    savePermits(updatedPermits);
    saveActivePermits(activePermits.filter((p) => p.id !== permitId));
  };

  const deletePermit = (id) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      savePermits(permits.filter((p) => p.id !== confirmModal.payload));
      saveActivePermits(activePermits.filter((p) => p.id !== confirmModal.payload));
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredPermits = permits.filter((p) => {
    const matchesSearch = p.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: permits.length,
    active: activePermits.length,
    pending: permits.filter((p) => p.status === 'pending').length,
    completed: permits.filter((p) => p.status === 'completed').length,
    workTypes: permits.reduce((acc, p) => {
      if (p.workType) acc[p.workType] = (acc[p.workType] || 0) + 1;
      return acc;
    }, {}),
    avgHeight: permits.length > 0 ?
    (permits.reduce((sum, p) => sum + (parseFloat(p.height) || 0), 0) / permits.length).toFixed(1) :
    0
  };

  return (
    <div className="container pb-[6rem]">
            <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Permiso Altura - ${shareItem?.location || ''}`}
        text={shareItem ? `🧗 Permiso de Trabajo en Altura\n📍 Ubicación: ${shareItem.location}\n👷 Trabajador: ${shareItem.workerName}\n📅 Fecha: ${new Date(shareItem.createdAt || Date.now()).toLocaleDateString('es-AR')}` : ''}
        rawMessage={shareItem ? `🧗 Permiso de Trabajo en Altura\n📍 Ubicación: ${shareItem.location}\n👷 Trabajador: ${shareItem.workerName}\n📅 Fecha: ${new Date(shareItem.createdAt || Date.now()).toLocaleDateString('es-AR')}\n\nGenerado con Asistente H&S` : ''}
        elementIdToPrint="pdf-content"
        fileName={`Altura_${shareItem?.location || 'Sin_Nombre'}.pdf`} />
      

            <div className="fixed left-[0] opacity-[0.01] top-[0] pointer-events-[none]">
                {shareItem && <WorkingAtHeightPdf data={shareItem} />}
            </div>
            
            <div className="no-print mb-8">
                <PremiumHeader
          title="Trabajo en Altura"
          subtitle={`OSHA 1926.501 • ${activePermits.length} activos`}
          icon={<HardHat size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        
                <div className="flex justify-space-between items-center flex-wrap gap-[1rem] mt-[1rem]">
                    <></>
                    <div className="flex gap-[0.75rem] flex-wrap">
                        <button
              onClick={handleCreatePermit} className="w-[auto] m-[0] flex items-center gap-[0.5rem] p-[0.75rem_1.25rem] bg-[linear-gradient(135deg,_#10b981_0%,_#059669_100%)] text-[#ffffff] border-none rounded-[8px] font-[700] cursor-pointer box-shadow-[0_4px_15px_rgba(16,_185,_129,_0.3)] transition-[all_0.2s_ease]">
















              
                            <Plus size={20} strokeWidth={3} /> Nuevo Permiso
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
          icon={<FileText size={24} />}
          label="Total Permisos"
          value={stats.total}
          color="#3B82F6"
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)" />
        
                <StatCard
          icon={<CheckCircle2 size={24} />}
          label="Trabajos Activos"
          value={stats.active}
          color="#16a34a"
          gradient="linear-gradient(135deg, #16a34a, #059669)" />
        
                <StatCard
          icon={<Ruler size={24} />}
          label="Altura Promedio"
          value={`${stats.avgHeight}m`}
          color="#f59e0b"
          gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
        
                <StatCard
          icon={<CheckSquare size={24} />}
          label="Completados"
          value={stats.completed}
          color="#8b5cf6"
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
        
            </div>

            {/* Tabs — línea inferior estilo profesional */}
            <div className="tab-underline-container">
                <button
          className={`tab-underline${activeTab === 'permits' ? ' active' : ''}`}
          onClick={() => setActiveTab('permits')}>
          
                    <FileText size={16} />
                    Permisos
                    <span className="tab-count">{permits.length}</span>
                </button>
                <button
          className={`tab-underline${activeTab === 'active' ? ' active' : ''}`}
          onClick={() => setActiveTab('active')}>
          
                    <CheckCircle2 size={16} />
                    Activos
                    <span className="tab-count">{activePermits.length}</span>
                    {activePermits.length > 0 &&
          <span className="absolute top-[6px] right-[6px] w-[8px] h-[8px] bg-[#ef4444] rounded-[50%]" />








          }
                </button>
                <button
          className={`tab-underline${activeTab === 'limits' ? ' active' : ''}`}
          onClick={() => setActiveTab('limits')}>
          
                    <Activity size={16} />
                    Límites de Seguridad
                </button>
            </div>


            {/* Content by Tab */}
            {activeTab === 'permits' &&
      <>
                    {/* Search & Filters */}
                    <div className="flex gap-[1rem] mb-[1.5rem] flex-wrap">




          
                        <div className="flex-[1] min-width-[280px] relative">
                            <Search
              size={20}
              color="var(--color-text-muted)" className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] pointer-events-[none]" />







            
                            <input
              type="text"
              placeholder="Buscar por trabajador, ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.85rem_1rem_0.85rem_3rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.95rem] font-[500] outline-[none]" />











            
                        </div>

                        <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)} className="p-[0.85rem_1.25rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.9rem] font-[600] outline-[none] cursor-pointer">











            
                            <option value="all">Todos los Estados</option>
                            {Object.entries(PERMIT_STATUS).map(([key, value]) =>
            <option key={key} value={key}>{value.label}</option>
            )}
                        </select>
                    </div>

                    {/* Permits List */}
                    {filteredPermits.length === 0 ?
        <EmptyStateIllustrated
          title="Sin Permisos de Trabajo en Altura"
          description="Todavía no hay permisos creados. Creá el primero para gestionar la seguridad según OSHA 1.8m."
          icon={<HardHat />} /> :


        <div className="flex flex-col gap-3">
                            {filteredPermits.map((permit) =>
          <PermitCard
            key={permit.id}
            permit={permit}
            statusConfig={PERMIT_STATUS[permit.status] || PERMIT_STATUS.draft}
            onAuthorize={() => authorizePermit(permit.id)}
            onSuspend={() => suspendPermit(permit.id)}
            onComplete={() => completePermit(permit.id)}
            onView={() => setSelectedPermit(permit)}
            onEdit={() => navigate('/working-at-height/new', { state: { editData: permit } })}
            onShare={() => requirePro(() => setShareItem(permit))}
            onDelete={() => deletePermit(permit.id)} />

          )}
                        </div>
        }
                </>
      }

            {activeTab === 'active' &&
      <ActivePermitsList
        activePermits={activePermits}
        onComplete={completePermit}
        onSuspend={suspendPermit}
        onView={setSelectedPermit}
        onShare={(permit) => requirePro(() => setShareItem(permit))} />

      }

            {activeTab === 'limits' &&
      <HeightLimitsPanel limits={HEIGHT_LIMITS} fallProtection={FALL_PROTECTION} />
      }

            {/* Modal de Detalle */}
            {selectedPermit &&
      <PermitDetailModal
        permit={selectedPermit}
        statusConfig={PERMIT_STATUS[selectedPermit.status] || PERMIT_STATUS.draft}
        onClose={() => setSelectedPermit(null)}
        WORK_TYPES={WORK_TYPES}
        FALL_PROTECTION={FALL_PROTECTION}
        RISK_FACTORS={RISK_FACTORS}
        HEIGHT_LIMITS={HEIGHT_LIMITS} />

      }

            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar permiso?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}

// Componentes Auxiliares
function StatCard({ icon, label, value, color, gradient }) {
  return (
    <div className="card p-[1.25rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border-subtle)] relative overflow-[hidden]">





      
            <div style={{





        background: gradient


      }} className="absolute top-[-20px] right-[-20px] w-[80px] h-[80px] rounded-[50%] opacity-[0.1]" />
            <div className="flex items-center gap-[0.75rem] mb-[0.75rem]">
                <div style={{


          background: gradient,




          boxShadow: `0 4px 15px ${color}40`
        }} className="w-[48px] h-[48px] rounded-[var(--radius-lg)] flex items-center justify-center">
                    {React.cloneElement(icon, { color: '#ffffff', size: 24 })}
                </div>
            </div>
            <div className="text-[2rem] font-[900] text-[var(--color-text)] line-height-[1]">
                {value}
            </div>
            <div className="text-[0.85rem] font-[600] text-[var(--color-text-muted)]">
                {label}
            </div>
        </div>);

}

function PermitCard({ permit, statusConfig, onAuthorize, onSuspend, onComplete, onView, onEdit, onShare, onDelete }) {
  const workType = WORK_TYPES.find((t) => t.id === permit.workType);
  const isExpired = permit.validUntil && new Date(permit.validUntil) < new Date();
  const heightRisk = parseFloat(permit.height) >= 6 ? 'high' : parseFloat(permit.height) >= 3 ? 'medium' : 'low';
  const riskColor = heightRisk === 'high' ? '#dc2626' : heightRisk === 'medium' ? '#f59e0b' : '#16a34a';

  return (
    <div className="card p-[1.25rem] flex items-center gap-[1rem] transition-[all_var(--transition-fast)]" style={{





      borderLeft: `4px solid ${isExpired ? '#9ca3af' : statusConfig.color}`
    }}>
            {/* Icono con altura */}
            <div style={{


        background: `${riskColor}15`,






        border: `2px solid ${riskColor}`
      }} className="w-[64px] h-[64px] rounded-[var(--radius-xl)] flex flex-col items-center justify-center flex-shrink-[0]">
                <ArrowDown size={20} color={riskColor} strokeWidth={2.5} />
                <span className="text-[1.1rem] font-[900] text-[var(--color-text)] line-height-[1]">
                    {permit.height}m
                </span>
            </div>

            {/* Información */}
            <div className="flex-[1] min-width-[0]">
                <div className="flex items-center gap-[0.75rem] mb-[0.5rem]">
                    <h3 className="m-[0] text-[1.1rem] font-[800] text-[var(--color-text)] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">







            
                        {workType?.icon} {permit.workerName}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase shrink-0" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
                        {isExpired ? 'EXPIRADO' : statusConfig.label}
                    </span>
                </div>
                <div className="flex flex-wrap gap-[1rem] text-[0.85rem] text-[var(--color-text-muted)] font-[500]">






          
                    <span className="flex items-center gap-[0.35rem]">
                        <HardHat size={14} />
                        {permit.location || 'Sin ubicación'}
                    </span>
                    <span className="flex items-center gap-[0.35rem]">
                        <Shield size={14} />
                        {permit.fallProtection?.filter((p) => p.checked).length || 0} EPPs
                    </span>
                    <span className="flex items-center gap-[0.35rem]">
                        <Calendar size={14} />
                        {permit.validUntil ? new Date(permit.validUntil).toLocaleDateString('es-AR') : '-'}
                    </span>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-[0.5rem]">
                {permit.status === 'pending' &&
        <button
          onClick={onAuthorize}











          title="Autorizar Permiso" className="p-[0.6rem_0.75rem] bg-[#16a34a] border-none rounded-[var(--radius-md)] cursor-pointer text-[#fff] font-[700] text-[0.8rem] transition-[all_var(--transition-fast)]">
          
                        <CheckCircle2 size={18} />
                        </button>
        }
                {permit.status === 'active' &&
        <>
                        <button
            onClick={onSuspend}











            title="Suspender Permiso" className="p-[0.6rem_0.75rem] bg-[#dc2626] border-none rounded-[var(--radius-md)] cursor-pointer text-[#fff] font-[700] text-[0.8rem] transition-[all_var(--transition-fast)]">
            
                            <AlertTriangle size={18} />
                        </button>
                        <button
            onClick={onComplete}











            title="Completar Permiso" className="p-[0.6rem_0.75rem] bg-[#3b82f6] border-none rounded-[var(--radius-md)] cursor-pointer text-[#fff] font-[700] text-[0.8rem] transition-[all_var(--transition-fast)]">
            
                            <CheckSquare size={18} />
                        </button>
                    </>
        }
                <button
          onClick={onEdit}
          className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-500 hover:bg-slate-700 transition-colors"
          title="Editar Permiso">
          
                    <Edit3 size={18} />
                </button>
                <button
          onClick={onShare}









          title="Compartir PDF" className="p-[0.6rem_0.75rem] bg-[#dcfce7] border-[1px_solid_#86efac] rounded-[var(--radius-md)] cursor-pointer text-[#16a34a] transition-[all_var(--transition-fast)]">
          
                    <Share2 size={18} />
                </button>
                <button
          onClick={onDelete}
          className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-red-500 hover:bg-slate-700 transition-colors"
          title="Eliminar">
          
                    <Trash2 size={18} />
                </button>
            </div>
        </div>);

}

function ActivePermitsList({ activePermits, onComplete, onSuspend, onView, onShare }) {
  if (activePermits.length === 0) {
    return (
      <EmptyStateIllustrated
        title="Sin Trabajos Activos"
        description="No hay permisos en curso actualmente. Los permisos autorizados aparecerán aquí."
        icon={<CheckCircle2 />}
        color="#16a34a" />);


  }

  return (
    <div className="flex flex-col gap-4">
            {activePermits.map((permit) => {
        const workType = WORK_TYPES.find((t) => t.id === permit.workType);
        const isExpired = permit.validUntil && new Date(permit.validUntil) as any < (new Date() as any);
        const timeRemaining = permit.validUntil ?
        Math.max(0, Math.floor(((new Date(permit.validUntil) as any) - (new Date() as any)) / (1000 * 60 * 60))) :
        0;
        const heightRisk = parseFloat(permit.height) >= 6 ? 'high' : parseFloat(permit.height) >= 3 ? 'medium' : 'low';
        const riskColor = heightRisk === 'high' ? '#dc2626' : heightRisk === 'medium' ? '#f59e0b' : '#16a34a';

        return (
          <div key={permit.id} className={`bg-slate-900 border-2 rounded-2xl p-6 ${isExpired ? "border-slate-500 bg-slate-800" : riskColor === "#dc2626" ? "border-red-500/50 bg-red-500/5" : riskColor === "#f59e0b" ? "border-amber-500/50 bg-amber-500/5" : "border-emerald-500/50 bg-emerald-500/5"}`}>
                        <div className="flex items-center gap-4">
                            <div style={{


                background: isExpired ?
                'linear-gradient(135deg, #9ca3af, #6b7280)' :
                `linear-gradient(135deg, ${riskColor}, ${riskColor}cc)`







              }} className="w-[72px] h-[72px] rounded-[var(--radius-xl)] flex flex-col items-center justify-center text-[#fff] flex-shrink-[0]">
                                <ArrowDown size={28} strokeWidth={2.5} />
                                <span className="text-[1.25rem] font-[900] line-height-[1]">
                                    {permit.height}m
                                </span>
                            </div>
                            <div className="flex-[1]">
                                <div className="flex items-center gap-[0.75rem] mb-[0.5rem]">
                                    <h3 className="m-0 text-xl font-black">
                                        {workType?.icon} {permit.workerName}
                                    </h3>
                                    {isExpired &&
                  <span className="p-[0.35rem_0.75rem] bg-[#9ca3af] text-[#fff] rounded-[var(--radius-full)] text-[0.7rem] font-[800] uppercase">







                    
                                            EXPIRADO
                                        </span>
                  }
                                </div>
                                <p className="m-[0.25rem_0_0_0] text-[var(--color-text-muted)] text-[0.9rem]">
                                    {permit.location} • Supervisor: {permit.supervisor || 'Sin asignar'}
                                </p>
                                <div className="flex gap-[0.5rem] mt-[0.75rem] flex-wrap">
                                    <span className="p-[0.35rem_0.65rem] bg-[#3b82f6] text-[#fff] rounded-[var(--radius-full)] text-[0.75rem] font-[700]">






                    
                                        <HardHat size={12} className="display-[inline] mr-[4px]" />
                                        {permit.workType ? WORK_TYPES.find((t) => t.id === permit.workType)?.name : 'Sin tipo'}
                                    </span>
                                    {!isExpired &&
                  <span className="p-[0.35rem_0.65rem] bg-[#16a34a] text-[#fff] rounded-[var(--radius-full)] text-[0.75rem] font-[700]">






                    
                                            <Clock size={12} className="display-[inline] mr-[4px]" />
                                            Vence en {timeRemaining}h
                                        </span>
                  }
                                    {permit.fallClearance &&
                  <span style={{

                    background: permit.fallClearance.safe ? '#16a34a' : '#dc2626'




                  }} className="p-[0.35rem_0.65rem] text-[#fff] rounded-[var(--radius-full)] text-[0.75rem] font-[700]">
                                            <Anchor size={12} className="display-[inline] mr-[4px]" />
                                            Clearance: {permit.fallClearance.safe ? 'SEGURO' : 'INSUFICIENTE'}
                                        </span>
                  }
                                </div>
                            </div>
                            <div className="flex gap-[0.5rem] flex-col">
                                <button
                  onClick={() => onView(permit)}
                  className="btn-outline p-[0.6rem_0.75rem]">

                  
                                    <Eye size={18} />
                                </button>
                                <button
                  onClick={() => onShare(permit)}
                  className="btn-outline p-[0.6rem_0.75rem] bg-[#dcfce7] border-color-[#86efac] text-[#16a34a]">






                  
                                    <Share2 size={18} />
                                </button>
                                <button
                  onClick={() => onComplete(permit.id)}
                  className="btn-primary w-[auto] m-[0] p-[0.6rem_1rem] bg-[linear-gradient(135deg,_#3b82f6,_#2563eb)]"






                  disabled={isExpired}>
                  
                                    <CheckSquare size={18} className="mr-[0.35rem]" />
                                    Completar
                                </button>
                            </div>
                        </div>
                    </div>);

      })}
        </div>);

}

function HeightLimitsPanel({ limits, fallProtection }) {
  return (
    <div className="flex flex-col gap-[1.5rem]">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 className="m-[0_0_1.5rem_0] text-[1rem] font-[800]">
                    <Activity size={20} className="display-[inline] mr-[0.5rem]" />
                    Límites de Altura (OSHA 1926.501)
                </h3>
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(250px,_1fr))] gap-[1rem]">
                    {Object.entries(limits).map(([key, limit]: [string, any]) =>
          <div key={key} className="p-[1.25rem] bg-[#eff6ff] border-[1px_solid_#3b82f6] rounded-[var(--radius-xl)]">




            
                            <div className="text-[0.75rem] font-[700] text-[var(--color-text-muted)] uppercase mb-[0.5rem]">
                                {limit.name}
                            </div>
                            <div className="flex items-baseline gap-[0.5rem]">
                                <span className="text-[2.5rem] font-[900] text-[var(--color-text)]">
                                    ≥ {limit.min}{limit.unit}
                                </span>
                            </div>
                            <div className="mt-[0.75rem] text-[0.8rem] text-[var(--color-text-muted)]">
                                <AlertCircle size={14} className="display-[inline] mr-[4px]" />
                                Protección contra caídas requerida
                            </div>
                        </div>
          )}
                </div>
            </div>

            {/* Equipamiento requerido */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800]">
                    <Shield size={20} className="display-[inline] mr-[0.5rem]" />
                    Equipamiento de Protección Contra Caídas
                </h3>
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(200px,_1fr))] gap-[0.75rem]">
                    {fallProtection.filter((fp) => fp.required).map((fp) =>
          <div key={fp.id} className="p-[0.75rem] bg-[#f0fdf4] border-[1px_solid_#16a34a] rounded-[var(--radius-lg)] flex items-center gap-[0.75rem]">







            
                            <span className="text-[2rem]">{fp.icon}</span>
                            <div>
                                <div className="text-[0.85rem] font-[700] text-[var(--color-text)]">
                                    {fp.name}
                                </div>
                                <span className="text-[0.7rem] font-[700] text-[#16a34a] uppercase">
                                    Obligatorio
                                </span>
                            </div>
                        </div>
          )}
                </div>
            </div>

            {/* Factores de riesgo */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800]">
                    <AlertTriangle size={20} className="display-[inline] mr-[0.5rem]" />
                    Factores de Riesgo
                </h3>
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(180px,_1fr))] gap-[0.75rem]">
                    {RISK_FACTORS.map((factor) =>
          <div key={factor.id} className="p-[0.75rem] bg-[#fef2f2] border-[1px_solid_#fecaca] rounded-[var(--radius-lg)]">




            
                            <div className="flex items-center gap-[0.5rem] mb-[0.35rem]">
                                <span className="text-[1.5rem]">{factor.icon}</span>
                                <span className="text-[0.85rem] font-[700] text-[#dc2626]">
                                    {factor.name}
                                </span>
                            </div>
                            <div className="text-[0.75rem] text-[var(--color-text-muted)]">
                                {factor.threshold}
                            </div>
                        </div>
          )}
                </div>
            </div>

            {/* Cálculo de fall clearance */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800]">
                    <Ruler size={20} className="display-[inline] mr-[0.5rem]" />
                    Cálculo de Distancia de Detención
                </h3>
                <div className="p-[1rem] bg-[#f8fafc] border-[1px_solid_#e2e8f0] rounded-[var(--radius-lg)]">




          
                    <div className="flex flex-col gap-[0.5rem] text-[0.9rem]">
                        <div className="flex justify-space-between">
                            <span>Longitud del Cabo (Lanyard):</span>
                            <strong>1.8 m</strong>
                        </div>
                        <div className="flex justify-space-between">
                            <span>Despliegue del Absorbedor:</span>
                            <strong>1.0 m</strong>
                        </div>
                        <div className="flex justify-space-between">
                            <span>Factor de Seguridad:</span>
                            <strong>0.6 m</strong>
                        </div>
                        <div className="flex justify-space-between">
                            <span>Altura del Trabajador:</span>
                            <strong>1.8 m</strong>
                        </div>
                        <div className="border-top-[2px_solid_#3b82f6] pt-[0.5rem] mt-[0.5rem] flex justify-space-between text-[1.1rem]">






              
                            <span className="font-[800]">Distancia Total Requerida:</span>
                            <strong className="text-[#16a34a] text-[1.25rem]">5.2 m</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>);

}

// Modal de Crear Permiso
function CreatePermitModal({ permit, setPermit, onSave, onClose, WORK_TYPES, FALL_PROTECTION, RISK_FACTORS }) {
  const toggleRiskFactor = (factorId) => {
    const current = permit.riskFactors || [];
    const updated = current.includes(factorId) ?
    current.filter((f) => f !== factorId) :
    [...current, factorId];
    setPermit({ ...permit, riskFactors: updated });
  };

  const toggleFallProtection = (equipId) => {
    const current = permit.fallProtection || [];
    const updated = current.includes(equipId) ?
    current.filter((e) => e !== equipId) :
    [...current, equipId];
    setPermit({ ...permit, fallProtection: updated });
  };

  return (
    <div className="modal-fullscreen-overlay" onClick={onClose}>
            <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-auto"
        onClick={(e) => e.stopPropagation()}>
        
                <div className="flex justify-space-between items-center mb-[1.5rem] pb-[1rem] border-bottom-[1px_solid_var(--color-border)]">






          
                    <h2 className="m-0 text-2xl font-black">
                        Nuevo Permiso de Trabajo en Altura
                    </h2>
                    <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
            
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                    {/* Trabajador */}
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Nombre del Trabajador *</label>
                        <input
              type="text"
              value={permit.workerName}
              onChange={(e) => setPermit({ ...permit, workerName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="Nombre completo" />
            
                    </div>

                    {/* Tipo de Trabajo */}
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Tipo de Trabajo</label>
                        <select
              value={permit.workType}
              onChange={(e) => setPermit({ ...permit, workType: e.target.value })}
              style={{ ...inputStyle, boxSizing: 'border-box' } as any}>
              
                            <option value="">Seleccionar tipo</option>
                            {WORK_TYPES.map((type) =>
              <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
              )}
                        </select>
                    </div>

                    {/* Ubicación */}
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Ubicación</label>
                        <input
              type="text"
              value={permit.location}
              onChange={(e) => setPermit({ ...permit, location: e.target.value })}
              style={{ ...inputStyle, boxSizing: 'border-box' } as any}
              placeholder="Ej: Edificio A, Nivel 3" />
            
                    </div>

                    {/* Altura */}
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Altura de Trabajo (metros) *</label>
                        <input
              type="number"
              step="0.1"
              value={permit.height}
              onChange={(e) => setPermit({ ...permit, height: e.target.value })}
              style={{ ...inputStyle, boxSizing: 'border-box' } as any}
              placeholder="Ej: 3.5" />
            
                    </div>

                    {/* Duración */}
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Duración Estimada (horas)</label>
                        <input
              type="number"
              step="0.5"
              value={permit.duration}
              onChange={(e) => setPermit({ ...permit, duration: e.target.value })}
              style={{ ...inputStyle, boxSizing: 'border-box' } as any}
              placeholder="Ej: 4" />
            
                    </div>

                    {/* Supervisor */}
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Supervisor Responsable</label>
                        <input
              type="text"
              value={permit.supervisor}
              onChange={(e) => setPermit({ ...permit, supervisor: e.target.value })}
              style={{ ...inputStyle, boxSizing: 'border-box' } as any}
              placeholder="Nombre del supervisor" />
            
                    </div>
                </div>

                {/* Descripción */}
                <div className="mt-[1rem]">
                    <label className="block mb-2 text-sm font-semibold text-slate-400">Descripción del Trabajo</label>
                    <textarea
            value={permit.workDescription}
            onChange={(e) => setPermit({ ...permit, workDescription: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors min-h-[60px] resize-y"
            placeholder="Describí el trabajo a realizar en altura..." />
          
                </div>

                {/* Factores de Riesgo */}
                <div className="mt-6">
                    <label className="block mb-2 text-sm font-semibold text-slate-400">Factores de Riesgo Presentes</label>
                    <div className="grid grid-template-columns-[repeat(4,_1fr)] gap-[0.5rem]">
                        {RISK_FACTORS.map((factor) =>
            <button
              key={factor.id}
              onClick={() => toggleRiskFactor(factor.id)}
              style={{

                background: permit.riskFactors?.includes(factor.id) ?
                '#fef2f2' :
                'var(--color-background)',
                border: `2px solid ${permit.riskFactors?.includes(factor.id) ? '#dc2626' : 'var(--color-border)'}`







              }} className="p-[0.6rem] rounded-[var(--radius-lg)] cursor-pointer flex flex-col items-center gap-[0.25rem] transition-[all_var(--transition-fast)]">
              
                                <span className="text-[1.25rem]">{factor.icon}</span>
                                <span style={{


                color: permit.riskFactors?.includes(factor.id) ? '#dc2626' : 'var(--color-text-muted)'
              }} className="text-[0.65rem] font-[700]">
                                    {factor.name}
                                </span>
                            </button>
            )}
                    </div>
                </div>

                {/* Equipamiento de Protección */}
                <div className="mt-6">
                    <label className="block mb-2 text-sm font-semibold text-slate-400">Equipamiento de Protección Contra Caídas</label>
                    <div className="grid grid-template-columns-[repeat(3,_1fr)] gap-[0.5rem]">
                        {FALL_PROTECTION.map((fp) =>
            <label
              key={fp.id}
              style={{

                background: permit.fallProtection?.includes(fp.id) ? '#f0fdf4' : 'var(--color-background)',
                border: `2px solid ${permit.fallProtection?.includes(fp.id) ? '#16a34a' : 'var(--color-border)'}`






              }} className="p-[0.6rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center gap-[0.5rem] transition-[all_var(--transition-fast)]">
              
                                <input
                type="checkbox"
                checked={permit.fallProtection?.includes(fp.id)}
                onChange={() => toggleFallProtection(fp.id)} className="w-[18px] h-[18px]" />

              
                                <span className="text-[1.25rem]">{fp.icon}</span>
                                <span style={{


                color: permit.fallProtection?.includes(fp.id) ? '#16a34a' : 'var(--color-text)'
              }} className="text-[0.75rem] font-[600]">
                                    {fp.name}
                                    {fp.required && <span className="text-[#dc2626] ml-[2px]">*</span>}
                                </span>
                            </label>
            )}
                    </div>
                </div>

                {/* Verificaciones */}
                <div className="mt-6">
                    <label className="block mb-2 text-sm font-semibold text-slate-400">Verificaciones Previas</label>
                    <div className="grid grid-template-columns-[1fr_1fr_1fr] gap-[0.75rem]">
                        <label style={{

              background: permit.weatherCheck ? '#f0fdf4' : 'var(--color-background)',
              border: `2px solid ${permit.weatherCheck ? '#16a34a' : 'var(--color-border)'}`





            }} className="p-[0.75rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center gap-[0.5rem]">
                            <input
                type="checkbox"
                checked={permit.weatherCheck}
                onChange={(e) => setPermit({ ...permit, weatherCheck: e.target.checked })} className="w-[20px] h-[20px]" />

              
                            <div>
                                <span className="text-[1.25rem]">🌤️</span>
                                <span className="text-[0.8rem] font-[600] ml-[0.5rem]">
                                    Clima Verificado
                                </span>
                            </div>
                        </label>
                        <label style={{

              background: permit.equipmentCheck ? '#f0fdf4' : 'var(--color-background)',
              border: `2px solid ${permit.equipmentCheck ? '#16a34a' : 'var(--color-border)'}`





            }} className="p-[0.75rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center gap-[0.5rem]">
                            <input
                type="checkbox"
                checked={permit.equipmentCheck}
                onChange={(e) => setPermit({ ...permit, equipmentCheck: e.target.checked })} className="w-[20px] h-[20px]" />

              
                            <div>
                                <span className="text-[1.25rem]">✓</span>
                                <span className="text-[0.8rem] font-[600] ml-[0.5rem]">
                                    Equipo Inspeccionado
                                </span>
                            </div>
                        </label>
                        <label style={{

              background: permit.training ? '#f0fdf4' : 'var(--color-background)',
              border: `2px solid ${permit.training ? '#16a34a' : 'var(--color-border)'}`





            }} className="p-[0.75rem] rounded-[var(--radius-lg)] cursor-pointer flex items-center gap-[0.5rem]">
                            <input
                type="checkbox"
                checked={permit.training}
                onChange={(e) => setPermit({ ...permit, training: e.target.checked })} className="w-[20px] h-[20px]" />

              
                            <div>
                                <span className="text-[1.25rem]">📋</span>
                                <span className="text-[0.8rem] font-[600] ml-[0.5rem]">
                                    Trabajador Capacitado
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex gap-[1rem] mt-[2rem] pt-[1.5rem] border-top-[1px_solid_var(--color-border)]">





          
                    <button
            onClick={onClose}
            className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-slate-300 hover:bg-slate-700 transition-colors">
            
                        Cancelar
                    </button>
                    <button
            onClick={onSave}
            className="btn-primary flex-[1]">

            
                        Crear Permiso
                    </button>
                </div>
            </div>
        </div>);

}

// Modal de Detalle
function PermitDetailModal({ permit, statusConfig, onClose, WORK_TYPES, FALL_PROTECTION, RISK_FACTORS, HEIGHT_LIMITS }) {
  const workType = WORK_TYPES.find((t) => t.id === permit.workType);
  const isExpired = permit.validUntil && new Date(permit.validUntil) < new Date();

  return (
    <div
      className="modal-fullscreen-overlay"
      onClick={onClose}>
      
            <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-auto"
        onClick={(e) => e.stopPropagation()}>
        
                {/* Header */}
                <div style={{

          background: `${statusConfig.bg}`,
          borderBottom: `2px solid ${statusConfig.color}`




        }} className="p-[1.5rem] flex justify-space-between items-center mb-[1.5rem]">
                    <div className="flex items-center gap-4">
                        <div style={{


              background: `linear-gradient(135deg, ${isExpired ? '#9ca3af' : statusConfig.color}, ${isExpired ? '#6b7280' : statusConfig.color}cc)`






            }} className="w-[64px] h-[64px] rounded-[var(--radius-xl)] flex flex-col items-center justify-center text-[#fff]">
                            <ArrowDown size={24} strokeWidth={2.5} />
                            <span className="text-[1.25rem] font-[900] line-height-[1]">
                                {permit.height}m
                            </span>
                        </div>
                        <div>
                            <h2 className="m-0 text-2xl font-black">
                                {workType?.icon} {permit.workerName}
                            </h2>
                            <p className="m-[0.25rem_0_0_0] text-[var(--color-text-muted)] text-[0.9rem]">
                                {permit.location || 'Sin ubicación'} • {isExpired ? 'EXPIRADO' : statusConfig.label}
                            </p>
                        </div>
                    </div>
                    <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
            
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Información del trabajo */}
                <div className="mb-6">
                    <h3 className="text-sm font-extrabold mb-3 uppercase">
                        Información del Trabajo
                    </h3>
                    <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                        <InfoDetail label="Tipo" value={workType?.name || '-'} />
                        <InfoDetail label="Supervisor" value={permit.supervisor || '-'} />
                        <InfoDetail label="Duración" value={permit.duration ? `${permit.duration} horas` : '-'} />
                        <InfoDetail label="Válido Hasta" value={permit.validUntil ? new Date(permit.validUntil).toLocaleString() : '-'} />
                    </div>
                </div>

                {/* Factores de riesgo */}
                {permit.riskFactors?.length > 0 &&
        <div className="mb-6">
                        <h3 className="text-sm font-extrabold mb-3 uppercase">
                            Factores de Riesgo
                        </h3>
                        <div className="flex flex-wrap gap-[0.5rem]">
                            {permit.riskFactors.map((factorId) => {
              const factor = RISK_FACTORS.find((f) => f.id === factorId);
              return (
                <span key={factorId} className="p-[0.5rem_0.85rem] bg-[#fef2f2] border-[1px_solid_#fecaca] rounded-[var(--radius-full)] text-[0.8rem] font-[700] text-[#dc2626] flex items-center gap-[0.35rem]">










                  
                                        <span>{factor?.icon}</span>
                                        {factor?.name} ({factor?.threshold})
                                    </span>);

            })}
                        </div>
                    </div>
        }

                {/* Equipamiento */}
                <div className="mb-6">
                    <h3 className="text-sm font-extrabold mb-3 uppercase">
                        Equipamiento de Protección
                    </h3>
                    <div className="grid grid-template-columns-[repeat(3,_1fr)] gap-[0.5rem]">
                        {permit.fallProtection?.map((fpId) => {
              const fp = FALL_PROTECTION.find((f) => f.id === fpId);
              return (
                <span key={fpId} className="p-[0.5rem] bg-[#f0fdf4] border-[1px_solid_#16a34a] rounded-[var(--radius-lg)] text-[0.8rem] font-[600] flex items-center gap-[0.35rem]">









                  
                                    <span>{fp?.icon}</span>
                                    {fp?.name}
                                </span>);

            })}
                    </div>
                </div>

                {/* Fall clearance */}
                {permit.fallClearance &&
        <div style={{

          background: permit.fallClearance.safe ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${permit.fallClearance.safe ? '#16a34a' : '#dc2626'}`


        }} className="p-[1rem] rounded-[var(--radius-xl)] mb-[1.5rem]">
                        <h3 style={{



            color: permit.fallClearance.safe ? '#16a34a' : '#dc2626'



          }} className="text-[0.9rem] font-[800] mb-[0.75rem] flex items-center gap-[0.5rem]">
                            <Anchor size={18} />
                            ANÁLISIS DE FALL CLEARANCE
                        </h3>
                        <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                            <div>
                                <div className="text-[0.75rem] text-[var(--color-text-muted)] mb-[0.25rem]">
                                    Distancia Requerida
                                </div>
                                <div className="text-[1.5rem] font-[900] text-[var(--color-text)]">
                                    {permit.fallClearance.required}m
                                </div>
                            </div>
                            <div>
                                <div className="text-[0.75rem] text-[var(--color-text-muted)] mb-[0.25rem]">
                                    Distancia Disponible
                                </div>
                                <div style={{ color: permit.fallClearance.safe ? '#16a34a' : '#dc2626' }} className="text-[1.5rem] font-[900]">
                                    {permit.fallClearance.available}m
                                </div>
                            </div>
                        </div>
                        <div style={{


            background: permit.fallClearance.safe ? '#16a34a' : '#dc2626'





          }} className="mt-[0.75rem] p-[0.5rem] text-[#fff] rounded-[var(--radius-lg)] text-center font-[800] text-[0.9rem]">
                            {permit.fallClearance.safe ? '✓ DISTANCIA DE DETENCIÓN SUFICIENTE' : '⚠️ DISTANCIA DE DETENCIÓN INSUFICIENTE - PELIGRO DE CAÍDA'}
                        </div>
                    </div>
        }

                {/* Verificaciones */}
                <div className="grid grid-template-columns-[1fr_1fr_1fr] gap-[0.75rem] mb-[1.5rem]">




          
                    <CheckItem label="Clima Verificado" checked={permit.weatherCheck} />
                    <CheckItem label="Equipo Inspeccionado" checked={permit.equipmentCheck} />
                    <CheckItem label="Trabajador Capacitado" checked={permit.training} />
                </div>

                {/* Observaciones */}
                {permit.observations &&
        <div className="p-[1rem] bg-[var(--color-background)] rounded-[var(--radius-lg)] mb-[1.5rem]">




          
                        <h4 className="m-[0_0_0.5rem_0] text-[0.85rem] font-[700]">
                            Observaciones
                        </h4>
                        <p className="m-[0] text-[0.9rem] text-[var(--color-text)] line-height-[1.6]">
                            {permit.observations}
                        </p>
                    </div>
        }

                {/* Alerta OSHA */}
                <div className="p-[1rem] bg-[#fef3c7] border-[1px_solid_#f59e0b] rounded-[var(--radius-lg)] mb-[1.5rem] flex gap-[0.75rem]">







          
                    <AlertTriangle size={20} color="#d97706" className="flex-shrink-[0]" />
                    <div>
                        <h4 className="m-[0_0_0.25rem_0] text-[0.85rem] font-[700] text-[#d97706]">
                            OSHA 1926.501
                        </h4>
                        <p className="m-[0] text-[0.8rem] text-[#92400e] line-height-[1.5]">
                            Protección contra caídas requerida para trabajos ≥ 1.8m (6 pies). Verificar anclajes y equipo antes de comenzar.
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

function CheckItem({ label, checked }) {
  return (
    <div style={{

      background: checked ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${checked ? '#16a34a' : '#fecaca'}`




    }} className="p-[0.75rem] rounded-[var(--radius-lg)] flex items-center gap-[0.5rem]">
            {checked ?
      <CheckCircle2 size={18} color="#16a34a" /> :

      <XCircle size={18} color="#dc2626" />
      }
            <span style={{


        color: checked ? '#16a34a' : '#dc2626'
      }} className="text-[0.8rem] font-[600]">
                {label}
            </span>
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

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  marginBottom: '0.5rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-input-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '0.95rem',
  fontWeight: 500,
  outline: 'none',
  transition: 'all var(--transition-fast)',
  boxSizing: 'border-box' as any
};