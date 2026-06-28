import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, Plus, Search,
  FileText, Eye, Edit3, Trash2, CheckCircle2,
  XCircle, Clock, User, Calendar,
  Shield, TrendingUp, AlertTriangle, BarChart3,
  Activity, CheckSquare, Target, Layers,
  Zap, AlertCircle, RefreshCw, ThumbsUp, Share2, ArrowLeft } from
'lucide-react';
import ShareModal from '../components/ShareModal';
import CAPAPdf from '../components/CAPAPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';

// Form styles
const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 700,
  marginBottom: '0.4rem',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box' as const
};

// Tipos de acción CAPA
const CAPA_TYPES = [
{ id: 'corrective', name: 'Acción Correctiva', icon: '🔧', color: '#dc2626', description: 'Eliminar causa de no conformidad detectada' },
{ id: 'preventive', name: 'Acción Preventiva', icon: '🛡️', color: '#3b82f6', description: 'Prevenir ocurrencia de no conformidad potencial' },
{ id: 'improvement', name: 'Mejora Continua', icon: '📈', color: '#10b981', description: 'Mejorar procesos existentes' },
{ id: 'containment', name: 'Contención', icon: '🚨', color: '#f59e0b', description: 'Acción inmediata para contener problema' }];


// Origen de CAPA
const CAPA_SOURCES = [
{ id: 'audit', name: 'Auditoría', icon: '📋' },
{ id: 'incident', name: 'Incidente/Accidente', icon: '⚠️' },
{ id: 'complaint', name: 'Queja/Reclamo', icon: '📞' },
{ id: 'observation', name: 'Observación', icon: '👁️' },
{ id: 'inspection', name: 'Inspección', icon: '🔍' },
{ id: 'management', name: 'Revisión Dirección', icon: '👔' },
{ id: 'indicator', name: 'Indicadores', icon: '📊' },
{ id: 'other', name: 'Otro', icon: '📍' }];


// Estados de CAPA
const CAPA_STATUS = {
  draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
  open: { label: 'ABIERTA', color: '#dc2626', bg: '#fef2f2' },
  analysis: { label: 'EN ANÁLISIS', color: '#f59e0b', bg: '#fffbeb' },
  in_progress: { label: 'EN PROGRESO', color: '#3b82f6', bg: '#eff6ff' },
  review: { label: 'EN REVISIÓN', color: '#8b5cf6', bg: '#f5f3ff' },
  completed: { label: 'COMPLETADA', color: '#16a34a', bg: '#f0fdf4' },
  closed: { label: 'CERRADA', color: '#059669', bg: '#ecfdf5' }
};

// Prioridad
const PRIORITY = {
  critical: { label: 'CRÍTICA', color: '#dc2626', icon: '🔴', days: 3 },
  high: { label: 'ALTA', color: '#f59e0b', icon: '🟠', days: 7 },
  medium: { label: 'MEDIA', color: '#3b82f6', icon: '🔵', days: 15 },
  low: { label: 'BAJA', color: '#16a34a', icon: '🟢', days: 30 }
};

// Métodos de análisis de causa raíz
const ROOT_CAUSE_METHODS = [
{ id: '5why', name: '5 Porqués', icon: '❓' },
{ id: 'fishbone', name: 'Diagrama Ishikawa', icon: '🐟' },
{ id: 'fault_tree', name: 'Árbol de Fallas', icon: '🌳' },
{ id: 'taproot', name: 'TapRooT', icon: '🔍' },
{ id: 'other', name: 'Otro', icon: '📝' }];


// Jerarquía de controles
const CONTROL_HIERARCHY = [
{ id: 'elimination', name: 'Eliminación', icon: '❌', level: 1, effective: 'Más efectivo' },
{ id: 'substitution', name: 'Sustitución', icon: '🔄', level: 2, effective: 'Muy efectivo' },
{ id: 'engineering', name: 'Controles Ingeniería', icon: '⚙️', level: 3, effective: 'Efectivo' },
{ id: 'administrative', name: 'Controles Admin.', icon: '📋', level: 4, effective: 'Moderado' },
{ id: 'ppe', name: 'EPP', icon: '🦺', level: 5, effective: 'Menos efectivo' }];


export default function CAPAManager(): React.ReactElement | null {
  const navigate = useNavigate();
  const [capas, setCapas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCapa, setSelectedCapa] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentCapaForAction, setCurrentCapaForAction] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [newCapa, setNewCapa] = useState({
    id: '',
    title: '',
    description: '',
    capaType: '',
    source: '',
    priority: 'medium',
    originDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    responsible: '',
    team: [],
    relatedProcess: '',
    problemStatement: '',
    rootCauseMethod: '',
    rootCauseAnalysis: '',
    immediateActions: [],
    correctiveActions: [],
    controlType: '',
    effectivenessCriteria: '',
    status: 'draft',
    createdAt: '',
    openedAt: '',
    completedAt: '',
    closedAt: '',
    observations: ''
  });

  useEffect(() => {
    const loadCapas = () => {
      const savedCapas = localStorage.getItem('ehs_capa_db');
      if (savedCapas) setCapas(JSON.parse(savedCapas));
    };

    loadCapas();

    const handleStorageChange = (e) => {
      if (e.key === 'ehs_capa_db') {
        loadCapas();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const params = new URLSearchParams(window.location.search);
    if (params.get('created')) {
      loadCapas();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const saveCapas = (data) => {
    localStorage.setItem('ehs_capa_db', JSON.stringify(data));
    setCapas(data);
  };

  const handleCreateCapa = () => {
    navigate('/capa/new');
  };

  const resetForm = () => {
    setNewCapa({
      id: '',
      title: '',
      description: '',
      capaType: '',
      source: '',
      priority: 'medium',
      originDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      responsible: '',
      team: [],
      relatedProcess: '',
      problemStatement: '',
      rootCauseMethod: '',
      rootCauseAnalysis: '',
      immediateActions: [],
      correctiveActions: [],
      controlType: '',
      effectivenessCriteria: '',
      status: 'draft',
      createdAt: '',
      openedAt: '',
      completedAt: '',
      closedAt: '',
      observations: ''
    });
  };

  const updateCapaStatus = (capaId, status) => {
    const updated = capas.map((c) => {
      if (c.id === capaId) {
        const timeline = [...(c.timeline || []), {
          date: new Date().toISOString(),
          event: `Estado cambiado a ${CAPA_STATUS[status]?.label}`,
          user: 'Usuario'
        }];
        return {
          ...c,
          status,
          openedAt: status === 'open' ? new Date().toISOString() : c.openedAt,
          completedAt: status === 'completed' ? new Date().toISOString() : c.completedAt,
          closedAt: status === 'closed' ? new Date().toISOString() : c.closedAt,
          timeline
        };
      }
      return c;
    });
    saveCapas(updated);
  };

  const addAction = (capaId, action) => {
    const updated = capas.map((c) => {
      if (c.id === capaId) {
        const newAction = {
          ...action,
          id: `ACT-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'pending'
        };
        const actions = [...(c.actions || []), newAction];
        const timeline = [...(c.timeline || []), {
          date: new Date().toISOString(),
          event: `Acción agregada: ${action.description}`,
          user: 'Usuario'
        }];
        return { ...c, actions, timeline };
      }
      return c;
    });
    saveCapas(updated);
  };

  const verifyEffectiveness = (capaId) => {
    const updated = capas.map((c) => {
      if (c.id === capaId) {
        const timeline = [...(c.timeline || []), {
          date: new Date().toISOString(),
          event: `Eficacia de la CAPA verificada`,
          user: 'Usuario'
        }];
        return { ...c, effectivenessVerified: true, effectivenessVerificationDate: new Date().toISOString(), timeline };
      }
      return c;
    });
    saveCapas(updated);
  };

  const updateActionStatus = (capaId, actionId, status) => {
    const updated = capas.map((c) => {
      if (c.id === capaId) {
        const actions = (c.actions || []).map((a) =>
        a.id === actionId ? { ...a, status, completedAt: status === 'completed' ? new Date().toISOString() : a.completedAt } : a
        );
        const timeline = [...(c.timeline || []), {
          date: new Date().toISOString(),
          event: `Acción ${status}: ${actions.find((a) => a.id === actionId)?.description}`,
          user: 'Usuario'
        }];
        return { ...c, actions, timeline };
      }
      return c;
    });
    saveCapas(updated);
  };

  const deleteCapa = (id) => {
    setConfirmModal({ isOpen: true, payload: id });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      saveCapas(capas.filter((c) => c.id !== confirmModal.payload));
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const filteredCapas = capas.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.responsible?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesType = filterType === 'all' || c.capaType === filterType;
    const matchesTab = activeTab === 'all' ? true : activeTab === 'open' ? c.status === 'open' || c.status === 'analysis' || c.status === 'in_progress' : c.status === 'completed' || c.status === 'closed';
    return matchesSearch && matchesStatus && matchesType && matchesTab;
  });

  // Estadísticas
  const stats = {
    total: capas.length,
    open: capas.filter((c) => c.status === 'open' || c.status === 'analysis' || c.status === 'in_progress').length,
    completed: capas.filter((c) => c.status === 'completed' || c.status === 'closed').length,
    overdue: capas.filter((c) => c.dueDate && new Date(c.dueDate) < new Date() && c.status !== 'closed').length,
    critical: capas.filter((c) => c.priority === 'critical' && c.status !== 'closed').length,
    onTime: capas.filter((c) => c.status === 'completed' && c.dueDate && new Date(c.completedAt) <= new Date(c.dueDate)).length,
    effectivenessRate: capas.filter((c) => c.status === 'closed').length > 0 ?
    Math.round(capas.filter((c) => c.status === 'closed' && c.effectivenessVerified).length / capas.filter((c) => c.status === 'closed').length * 100) :
    0
  };

  return (
    <div className="container pb-[6rem]">
            <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Acción CAPA - ${shareItem?.title || ''}`}
        text={shareItem ? `🛡️ Acción CAPA\n📝 Hallazgo: ${shareItem.title}\n📍 Origen: ${shareItem.source}\n📅 Fecha: ${shareItem.originDate}` : ''}
        rawMessage={shareItem ? `🛡️ Acción CAPA\n📝 Hallazgo: ${shareItem.title}\n📍 Origen: ${shareItem.source}\n📅 Fecha: ${shareItem.originDate}` : ''}
        elementIdToPrint="pdf-content"
        fileName={`CAPA_${shareItem?.title.replace(/\s+/g, '_') || 'Accion'}.pdf`} />
      

            <div className="fixed left-[0] opacity-[0.01] top-[0] pointer-events-[none]">
                {shareItem && <CAPAPdf data={shareItem} />}
            </div>
            <PremiumHeader
        title="CAPA - Acciones Correctivas"
        subtitle={`ISO 9001 / ISO 45001 • ${stats.open} abiertas`}
        icon={<RefreshCw size={36} color="#ffffff" />} />
      

            <div className="flex items-center justify-space-between gap-[1rem] mt-[1.5rem] mb-[2rem] flex-wrap">
                <div className="flex gap-[1rem] flex-wrap">
                    <></>
                    <button
            onClick={() => navigate('/capa/new')} className="flex items-center gap-[0.8rem] p-[0.8rem_1.5rem] bg-[linear-gradient(135deg,_#36B37E_0%,_#2A9365_100%)] text-[white] border-none rounded-[12px] font-[800] text-[0.95rem] cursor-pointer box-shadow-[0_4px_15px_rgba(54,_179,_126,_0.4)]">
                        <Plus size={20} strokeWidth={2.5} /> NUEVA CAPA
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{

        gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))' : 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1rem' : '2rem'
      }} className="grid">
                <StatCard
          icon={<FileText size={24} />}
          label="Total CAPA"
          value={stats.total}
          color="#3B82F6"
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
          isMobile={isMobile} />
        
                <StatCard
          icon={<Clock size={24} />}
          label="Abiertas"
          value={stats.open}
          color="#f59e0b"
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          isMobile={isMobile} />
        
                <StatCard
          icon={<AlertTriangle size={24} />}
          label="Vencidas"
          value={stats.overdue}
          color="#dc2626"
          gradient="linear-gradient(135deg, #dc2626, #991b1b)"
          isMobile={isMobile} />
        
                <StatCard
          icon={<CheckCircle2 size={24} />}
          label="Cerradas"
          value={stats.completed}
          color="#16a34a"
          gradient="linear-gradient(135deg, #16a34a, #059669)"
          isMobile={isMobile} />
        
            </div>

            {/* Secondary Stats */}
            <div style={{

        gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }} className="grid">
                <div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
                    <div className="flex justify-space-between items-center mb-[0.75rem]">
                        <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }} className="font-[600] text-[var(--color-text-muted)]">Tasa de Efectividad</span>
                        <ThumbsUp size={isMobile ? 18 : 20} color="#10b981" />
                    </div>
                    <div style={{ fontSize: isMobile ? '2rem' : '2.5rem' }} className="font-[900] text-[#10b981]">
                        {stats.effectivenessRate}%
                    </div>
                    <div className="h-[8px] bg-[#e2e8f0] rounded-[4px] mt-[0.75rem] overflow-[hidden]">
                        <div style={{ width: `${stats.effectivenessRate}%` }} className="h-[100%] bg-[linear-gradient(90deg,_#10b981,_#059669)] rounded-[4px]" />
                    </div>
                </div>

                <div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
                    <div className="flex justify-space-between items-center mb-[0.75rem]">
                        <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }} className="font-[600] text-[var(--color-text-muted)]">Entrega a Tiempo</span>
                        <Target size={isMobile ? 18 : 20} color="#3b82f6" />
                    </div>
                    <div style={{ fontSize: isMobile ? '2rem' : '2.5rem' }} className="font-[900] text-[#3b82f6]">
                        {stats.onTime}
                    </div>
                    <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }} className="text-[var(--color-text-muted)] mt-[0.5rem]">
                        {stats.total > 0 ? Math.round(stats.onTime / stats.total * 100) : 0}% del total
                    </div>
                </div>

                <div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
                    <div className="flex justify-space-between items-center mb-[0.75rem]">
                        <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }} className="font-[600] text-[var(--color-text-muted)]">Críticas Pendientes</span>
                        <Zap size={isMobile ? 18 : 20} color="#dc2626" />
                    </div>
                    <div style={{ fontSize: isMobile ? '2rem' : '2.5rem' }} className="font-[900] text-[#dc2626]">
                        {stats.critical}
                    </div>
                    <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }} className="text-[var(--color-text-muted)] mt-[0.5rem]">
                        Requieren atención inmediata
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{

        gap: isMobile ? '0.5rem' : '0.25rem',




        borderRadius: isMobile ? 'var(--radius-2xl)' : 'var(--radius-full)',
        width: isMobile ? '100%' : 'fit-content',
        flexWrap: isMobile ? 'wrap' : 'nowrap'


      }} className="flex mb-[2rem] bg-[var(--color-surface)] border-[1px_solid_var(--glass-border)] p-[0.35rem] box-shadow-[var(--glass-shadow)] backdrop-filter-[blur(20px)]">
                <TabButton
          active={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
          icon={<Layers size={18} />}
          label="Todas"
          count={capas.length} />
        
                <TabButton
          active={activeTab === 'open'}
          onClick={() => setActiveTab('open')}
          icon={<Clock size={18} />}
          label="Abiertas"
          count={stats.open} />
        
                <TabButton
          active={activeTab === 'completed'}
          onClick={() => setActiveTab('completed')}
          icon={<CheckCircle2 size={18} />}
          label="Completadas"
          count={stats.completed} />
        
            </div>

            {/* Filters */}
            <div style={{



        flexDirection: isMobile ? 'column' : 'row'
      }} className="flex gap-[1rem] mb-[1.5rem]">
                <div className="flex-[1] min-width-[280px] relative">
                    <Search
            size={20}
            color="var(--color-text-muted)" className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] pointer-events-[none]" />







          
                    <input
            type="text"
            placeholder="Buscar por ID, título, responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[0.85rem_1rem_0.85rem_3rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.95rem] font-[500] outline-[none]" />











          
                </div>

                <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)} className="p-[0.85rem_1.25rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.9rem] font-[600] outline-[none] cursor-pointer">











          
                    <option value="all">Todos los Estados</option>
                    {Object.entries(CAPA_STATUS).map(([key, value]) =>
          <option key={key} value={key}>{value.label}</option>
          )}
                </select>

                <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)} className="p-[0.85rem_1.25rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.9rem] font-[600] outline-[none] cursor-pointer">











          
                    <option value="all">Todos los Tipos</option>
                    {CAPA_TYPES.map((t) =>
          <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
          )}
                </select>
            </div>

            {/* CAPA List */}
            {filteredCapas.length === 0 ?
      <EmptyStateIllustrated
        title="Sin Acciones CAPA"
        description="Registrá y hacé seguimiento de acciones correctivas y preventivas para la mejora continua."
        icon={<RefreshCw />}
        onAction={() => navigate('/capa/new')}
        actionLabel="Crear Nueva CAPA" /> :


      <div className="flex flex-col gap-3">
                    {filteredCapas.map((capa) =>
        <CapaCard
          key={capa.id}
          capa={capa}
          statusConfig={CAPA_STATUS[capa.status] || CAPA_STATUS.draft}
          priorityConfig={PRIORITY[capa.priority] || PRIORITY.medium}
          capaType={CAPA_TYPES.find((t) => t.id === capa.capaType)}
          onUpdateStatus={updateCapaStatus}
          onView={() => setSelectedCapa(capa)}
          onEdit={() => navigate('/capa/new', { state: { editData: capa } })}
          onShare={() => setShareItem(capa)}
          onAddAction={() => {
            setCurrentCapaForAction(capa);
            setShowActionModal(true);
          }}
          onDelete={() => deleteCapa(capa.id)}
          isMobile={isMobile} />

        )}
                </div>
      }

            {/* Modal de Crear CAPA */}
            {showAddModal &&
      <CreateCapaModal
        capa={newCapa}
        setCapa={setNewCapa}
        onSave={() => {
          saveCapas(newCapa);
          setShowAddModal(false);
          resetForm();
        }}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        CAPA_TYPES={CAPA_TYPES}
        CAPA_SOURCES={CAPA_SOURCES}
        PRIORITY={PRIORITY}
        ROOT_CAUSE_METHODS={ROOT_CAUSE_METHODS} />

      }

            {/* Modal de Detalle */}
            {selectedCapa &&
      <CapaDetailModal
        capa={selectedCapa}
        statusConfig={CAPA_STATUS[selectedCapa.status] || CAPA_STATUS.draft}
        priorityConfig={PRIORITY[selectedCapa.priority] || PRIORITY.medium}
        capaType={CAPA_TYPES.find((t) => t.id === selectedCapa.capaType)}
        onClose={() => setSelectedCapa(null)}
        onUpdateStatus={updateCapaStatus}
        onVerifyEffectiveness={verifyEffectiveness}
        CAPA_TYPES={CAPA_TYPES}
        CAPA_SOURCES={CAPA_SOURCES}
        CONTROL_HIERARCHY={CONTROL_HIERARCHY} />

      }

            {/* Modal de Acción */}
            {showActionModal && currentCapaForAction &&
      <CreateActionModal
        capa={currentCapaForAction}
        onSave={(action) => {
          addAction(currentCapaForAction.id, action);
          setShowActionModal(false);
        }}
        onClose={() => {
          setShowActionModal(false);
          setCurrentCapaForAction(null);
        }}
        CONTROL_HIERARCHY={CONTROL_HIERARCHY} />

      }

            <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, payload: null })}
        onConfirm={executeDelete}
        title="¿Eliminar CAPA?"
        message="Esta acción no se puede deshacer."
        iconEmoji="🗑️" />
      
        </div>);

}

// Componentes Auxiliares
function StatCard({ icon, label, value, color, gradient, isMobile }: any) {
  return (
    <div className="capa-stat-card bg-[var(--glass-bg)] backdrop-filter-[blur(20px)] border-[1px_solid_var(--glass-border)] box-shadow-[var(--glass-shadow)] rounded-[var(--radius-2xl)] relative overflow-[hidden] cursor-pointer" style={{
      padding: isMobile ? '0.75rem' : '1.5rem',








      display: isMobile ? 'flex' : 'block',
      alignItems: isMobile ? 'center' : 'stretch',
      gap: isMobile ? '0.75rem' : '0'
    }}>
            <div style={{





        background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`


      }} className="absolute top-[-30px] right-[-30px] w-[120px] h-[120px] rounded-[50%] pointer-events-[none]" />
            <div style={{ marginBottom: isMobile ? '0' : '1rem' }} className="flex items-center gap-[0.75rem] flex-shrink-[0]">
                <div style={{
          width: isMobile ? '40px' : '48px',
          height: isMobile ? '40px' : '48px',
          background: gradient,




          boxShadow: `0 8px 24px ${color}30`
        }} className="rounded-[var(--radius-xl)] flex items-center justify-center">
                    {React.cloneElement(icon as any, { color: '#ffffff', size: isMobile ? 20 : 22 })}
                </div>
            </div>
            <div className="min-width-[0] flex-[1]">
                <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem'







        }} className="font-[700] text-[var(--color-text-muted)] uppercase letter-spacing-[0.5px] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">
                    {label}
                </div>
                <div style={{
          fontSize: isMobile ? '1.5rem' : '2.25rem',




          marginTop: isMobile ? '0.2rem' : '0'
        }} className="font-[900] text-[var(--color-text)] line-height-[1] letter-spacing-[-1px]">
                    {value}
                </div>
            </div>
        </div>);

}

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      style={{




        background: active ? 'var(--glass-thick)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
        border: active ? '1px solid var(--glass-border-subtle)' : '1px solid transparent',





        boxShadow: active ? 'var(--glass-shadow)' : 'none',
        backdropFilter: active ? 'blur(10px)' : 'none'



      }} className="flex items-center gap-[0.5rem] p-[0.6rem_1.25rem] rounded-[var(--radius-full)] cursor-pointer font-[800] text-[0.85rem] transition-[all_0.2s] flex-[1] justify-center min-width-[fit-content]">
      
            {icon}
            <span>{label}</span>
            {count !== undefined &&
      <span style={{

        background: active ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-background)',
        color: active ? 'var(--color-primary)' : 'var(--color-text-muted)'




      }} className="p-[0.15rem_0.4rem] rounded-[var(--radius-full)] text-[0.7rem] font-[900] ml-[0.25rem]">
                    {count}
                </span>
      }
        </button>);

}

function CapaCard({ capa, statusConfig, priorityConfig, capaType, onUpdateStatus, onView, onEdit, onShare, onAddAction, onDelete, isMobile }: any) {
  const isOverdue = capa.dueDate && new Date(capa.dueDate) < new Date() && capa.status !== 'closed';
  const daysUntilDue = capa.dueDate ? Math.ceil((new Date(capa.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="capa-card flex rounded-[var(--radius-2xl)]" style={{
      padding: isMobile ? '1rem' : '1.25rem 1.5rem',

      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: isMobile ? '1rem' : '1.25rem',

      borderLeft: `5px solid ${isOverdue ? '#dc2626' : statusConfig.color}`
    }}>
            <div style={{ gap: isMobile ? '0.75rem' : '1.25rem' }} className="flex flex-[1] min-width-[0] items-center">
                {/* Priority & Type Icon */}
                <div style={{
          width: isMobile ? '44px' : '56px',
          height: isMobile ? '44px' : '56px',
          background: `${priorityConfig.color}10`,






          border: `1.5px solid ${priorityConfig.color}40`,
          boxShadow: `0 4px 12px ${priorityConfig.color}15`
        }} className="rounded-[var(--radius-xl)] flex flex-col items-center justify-center flex-shrink-[0]">
                    <span style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} className="line-height-[1]">{priorityConfig.icon}</span>
                </div>

            {/* Information */}
            <div className="flex-[1] min-width-[0]">
                <div className="flex items-center gap-[0.75rem] mb-[0.5rem] flex-wrap">
                    <span className="text-[0.7rem] font-[900] text-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),_0.08)] p-[0.25rem_0.5rem] rounded-[var(--radius-md)] border-[1px_solid_rgba(var(--color-primary-rgb),_0.12)]">
                        {capa.id}
                    </span>
                    <h3 className="m-[0] text-[1.1rem] font-[900] text-[var(--color-text)] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis] letter-spacing-[-0.3px]">








              
                        {capaType?.icon} {capa.title}
                    </h3>
                    <span style={{

              background: statusConfig.bg,
              color: statusConfig.color,





              border: `1px solid ${statusConfig.color}25`
            }} className="p-[0.3rem_0.75rem] rounded-[var(--radius-full)] text-[0.65rem] font-[900] uppercase letter-spacing-[0.5px]">
                        {statusConfig.label}
                    </span>
                    {isOverdue &&
            <span className="p-[0.3rem_0.75rem] bg-[rgba(239,_68,_68,_0.08)] text-[#dc2626] rounded-[var(--radius-full)] text-[0.65rem] font-[900] flex items-center gap-[0.25rem] border-[1px_solid_rgba(239,_68,_68,_0.2)]">










              
                            <AlertTriangle size={11} />
                            VENCIDA
                        </span>
            }
                </div>
                <div className="flex flex-wrap gap-[1rem] text-[0.8rem] text-[var(--color-text-muted)] font-[700]">






            
                    <span className="flex items-center gap-[0.35rem]">
                        <User size={13} color="var(--color-primary)" />
                        {capa.responsible || 'Sin asignar'}
                    </span>
                    <span className="flex items-center gap-[0.35rem]">
                        <Calendar size={13} color="var(--color-primary)" />
                        {capa.dueDate ? new Date(capa.dueDate).toLocaleDateString('es-AR') : 'Sin fecha'}
                    </span>
                    {daysUntilDue !== null && daysUntilDue >= 0 &&
            <span style={{
              color: daysUntilDue <= 3 ? '#dc2626' : daysUntilDue <= 7 ? '#f59e0b' : '#16a34a',


              background: daysUntilDue <= 3 ? 'rgba(220, 38, 38, 0.08)' : daysUntilDue <= 7 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(22, 163, 74, 0.08)'


            }} className="font-[800] text-[0.75rem] p-[0.1rem_0.4rem] rounded-[var(--radius-sm)]">
                            {daysUntilDue === 0 ? 'Vence hoy' : daysUntilDue === 1 ? 'Vence mañana' : `Vence en ${daysUntilDue} días`}
                        </span>
            }
                </div>
            </div>
            </div>

            {/* Acciones */}
            <div style={{ borderTop: isMobile ? '1px solid var(--color-border)' : 'none', paddingTop: isMobile ? '0.75rem' : '0', flexWrap: isMobile ? 'wrap' : 'nowrap' }} className="flex gap-[0.4rem]">
                <button
          onClick={onEdit}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.6rem',








            flex: isMobile ? 1 : 'none'


          }}
          title="Editar" className="bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-lg)] cursor-pointer text-[#6366f1] flex items-center justify-center gap-[0.5rem] font-[700]">
          
                    <Edit3 size={16} />
                    {isMobile && 'Editar'}
                </button>
                {capa.status === 'open' &&
        <button
          onClick={() => onUpdateStatus(capa.id, 'in_progress')}














          title="Iniciar" className="p-[0.6rem_0.85rem] bg-[linear-gradient(135deg,_#3b82f6,_#1d4ed8)] border-none rounded-[var(--radius-lg)] cursor-pointer text-[#fff] font-[800] text-[0.75rem] box-shadow-[0_4px_12px_rgba(59,_130,_246,_0.3)] flex items-center gap-[0.25rem]">
          
                        <Clock size={14} />
                        <span>Iniciar</span>
                    </button>
        }
                {capa.status === 'in_progress' &&
        <button
          onClick={onAddAction}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.6rem 0.85rem',










            flex: isMobile ? 1 : 'none'


          }} className="bg-[#3b82f6] border-none rounded-[var(--radius-lg)] cursor-pointer text-[#fff] font-[800] text-[0.75rem] flex items-center justify-center gap-[0.35rem] box-shadow-[0_4px_10px_rgba(59,_130,_246,_0.25)]">
          
                        <Plus size={15} />
                        <span>Acción</span>
                    </button>
        }
                <button
          onClick={onView}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.6rem',








            flex: isMobile ? 1 : 'none'


          }}
          title="Ver Detalles" className="bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-lg)] cursor-pointer text-[var(--color-text)] flex items-center justify-center gap-[0.5rem] font-[700]">
          
                    <Eye size={16} />
                    {isMobile && 'Ver'}
                </button>
                <button
          onClick={onShare}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.6rem',








            flex: isMobile ? 'none' : 'none'
          }}
          title="Compartir CAPA" className="bg-[#dcfce7] border-[1px_solid_#bbf7d0] rounded-[var(--radius-lg)] cursor-pointer text-[#16a34a] flex items-center justify-center">
          
                    <Share2 size={16} />
                </button>
                <button
          onClick={onDelete}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.6rem',








            flex: isMobile ? 'none' : 'none'
          }}
          title="Eliminar" className="bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-lg)] cursor-pointer text-[#ef4444] flex items-center justify-center">
          
                    <Trash2 size={16} />
                </button>
            </div>
        </div>);

}

function EmptyState({ onAdd }) {
  return (
    <div className="p-[4rem_2rem] text-center bg-[var(--gradient-card)] rounded-[var(--radius-2xl)] border-[2px_dashed_var(--color-border)]">





      
            <div className="w-[80px] h-[80px] m-[0_auto_1.5rem] bg-[var(--color-background)] rounded-[50%] flex items-center justify-center">








        
                <RefreshCw size={40} color="var(--color-text-muted)" />
            </div>
            <h3 className="m-[0_0_0.5rem_0] text-[1.25rem] font-[800] text-[var(--color-text)]">




        
                Sin CAPA Registradas
            </h3>
            <p className="m-[0_0_1.5rem_0] text-[var(--color-text-muted)] text-[0.95rem]">



        
                Creá Acciones Correctivas/Preventivas para mejora continua
            </p>
            <button
        onClick={onAdd}
        className="btn-primary w-[auto] m-[0]">

        
                <Plus size={20} className="mr-[0.5rem]" />
                Primera CAPA
            </button>
        </div>);

}

// Modal de Crear CAPA
function CreateCapaModal({ capa, setCapa, onSave, onClose, CAPA_TYPES, CAPA_SOURCES, PRIORITY, ROOT_CAUSE_METHODS }) {
  return (
    <div className="modal-fullscreen-overlay modal-overlay-glass" onClick={onClose}>
            <div className="modal-fullscreen-content modal-glass max-w-[680px] p-[2rem] border-[1px_solid_var(--glass-border)]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-space-between items-center mb-[1.5rem] pb-[1rem] border-bottom-[1px_solid_var(--glass-border-subtle)]">
                    <h2 className="m-[0] text-[1.4rem] font-[900] text-[var(--color-text)] flex items-center gap-[0.5rem]">
                        <RefreshCw size={20} className="animate-spin-slow" color="var(--color-primary)" />
                        Nueva Acción CAPA
                    </h2>
                    <button onClick={onClose} className="p-[0.4rem] bg-[rgba(239,_68,_68,_0.08)] border-none rounded-[var(--radius-md)] cursor-pointer text-[#ef4444] flex items-center justify-center"><XCircle size={20} /></button>
                </div>
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1.25rem]">
                    <div className="grid-column-[1_/_-1]">
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Título *</label>
                        <input type="text" value={capa.title} onChange={(e) => setCapa({ ...capa, title: e.target.value })} className="capa-focus-glow bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)]" style={{ ...inputStyle }} placeholder="Ej: Fugas detectadas en sector de químicos" />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Tipo de Acción *</label>
                        <select value={capa.capaType} onChange={(e) => setCapa({ ...capa, capaType: e.target.value })} className="capa-focus-glow bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)]" style={{ ...inputStyle }}>
                            {CAPA_TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Origen</label>
                        <select value={capa.source} onChange={(e) => setCapa({ ...capa, source: e.target.value })} className="capa-focus-glow bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)]" style={{ ...inputStyle }}>
                            {CAPA_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Prioridad</label>
                        <select value={capa.priority} onChange={(e) => setCapa({ ...capa, priority: e.target.value })} className="capa-focus-glow bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)]" style={{ ...inputStyle }}>
                            {Object.entries(PRIORITY).map(([k, v]: [string, any]) => <option key={k} value={k}>{v.icon} {v.label} ({v.days} días)</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Fecha Límite</label>
                        <input type="date" value={capa.dueDate} onChange={(e) => setCapa({ ...capa, dueDate: e.target.value })} className="capa-focus-glow bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)]" style={{ ...inputStyle }} />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Responsable</label>
                        <input type="text" value={capa.responsible} onChange={(e) => setCapa({ ...capa, responsible: e.target.value })} className="capa-focus-glow bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)]" style={{ ...inputStyle }} placeholder="Nombre del responsable" />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Proceso Relacionado</label>
                        <input type="text" value={capa.relatedProcess} onChange={(e) => setCapa({ ...capa, relatedProcess: e.target.value })} className="capa-focus-glow bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)]" style={{ ...inputStyle }} placeholder="Ej: Gestión de Compras" />
                    </div>
                </div>
                <div className="mt-[1.25rem]">
                    <label className="block mb-2 text-sm font-semibold text-slate-400">Descripción del Problema *</label>
                    <textarea value={capa.problemStatement} onChange={(e) => setCapa({ ...capa, problemStatement: e.target.value })} className="capa-focus-glow min-h-[80px] bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)] pt-[0.75rem]" style={{ ...inputStyle }} placeholder="Describí claramente el problema o no conformidad detectada..." />
                </div>
                <div className="mt-[1rem]">
                    <label className="block mb-2 text-sm font-semibold text-slate-400">Descripción Adicional</label>
                    <textarea value={capa.description} onChange={(e) => setCapa({ ...capa, description: e.target.value })} className="capa-focus-glow min-h-[60px] bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)] pt-[0.75rem]" style={{ ...inputStyle }} placeholder="Información complementaria..." />
                </div>
                <div className="flex gap-[1rem] mt-[1.75rem] pt-[1.25rem] border-top-[1px_solid_var(--glass-border-subtle)]">
                    <button onClick={onClose} className="flex-[1] p-[0.85rem] bg-[transparent] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-lg)] text-[var(--color-text-muted)] font-[800] cursor-pointer transition-[all_0.2s]">Cancelar</button>
                    <button onClick={onSave} className="btn-primary flex-[1] m-[0] p-[0.85rem] font-[800]">Crear CAPA</button>
                </div>
            </div>
        </div>);

}

// Modal de Detalle
function CapaDetailModal({ capa, statusConfig, priorityConfig, capaType, onClose, onUpdateStatus, CAPA_TYPES, CAPA_SOURCES, CONTROL_HIERARCHY, onVerifyEffectiveness }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const isOverdue = capa.dueDate && new Date(capa.dueDate) < new Date() && capa.status !== 'closed';

  return (
    <div className="modal-fullscreen-overlay modal-overlay-glass" onClick={onClose}>
            <div className="modal-fullscreen-content modal-glass max-w-[720px] p-[0] border-[1px_solid_var(--glass-border)] overflow-[hidden]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${statusConfig.bg}, rgba(var(--color-surface-rgb), 0.95))`, borderBottom: `2.5px solid ${statusConfig.color}` }} className="p-[1.5rem_2rem] flex justify-space-between items-center">
                    <div className="flex items-center gap-4">
                        <div style={{ background: `linear-gradient(135deg, ${priorityConfig.color}, ${priorityConfig.color}cc)`, boxShadow: `0 8px 20px ${priorityConfig.color}25` }} className="w-[56px] h-[56px] rounded-[var(--radius-xl)] flex flex-col items-center justify-center text-[#fff]">
                            <span className="text-[1.75rem] line-height-[1]">{priorityConfig.icon}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-[0.5rem] mb-[0.25rem] flex-wrap">
                                <span className="text-[0.65rem] font-[900] text-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),_0.08)] p-[0.25rem_0.5rem] rounded-[var(--radius-md)] border-[1px_solid_rgba(var(--color-primary-rgb),_0.15)]">{capa.id}</span>
                                <h2 className="m-[0] text-[1.3rem] font-[900] text-[var(--color-text)] letter-spacing-[-0.3px]">{capaType?.icon} {capa.title}</h2>
                            </div>
                            <p className="m-[0] text-[var(--color-text-muted)] text-[0.8rem] font-[700]">{capaType?.name} • {statusConfig.label}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-[0.4rem] bg-[rgba(239,_68,_68,_0.08)] border-none rounded-[var(--radius-md)] cursor-pointer text-[#ef4444] flex items-center justify-center"><XCircle size={22} /></button>
                </div>

                <div className="p-[2rem] max-height-[calc(80vh_-_120px)] overflow-y-[auto]">
                    {/* Info Grid */}
                    <div className="grid grid-template-columns-[1fr_1fr] gap-[1.25rem] mb-[1.75rem] p-[1rem_1.25rem] bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)] rounded-[var(--radius-xl)]">
                        <InfoDetail label="Origen" value={capa.source ? CAPA_SOURCES.find((s) => s.id === capa.source)?.name : '-'} />
                        <InfoDetail label="Responsable" value={capa.responsible || '-'} />
                        <InfoDetail label="Prioridad" value={<span style={{ color: priorityConfig.color }} className="font-[900]">{priorityConfig.icon} {priorityConfig.label}</span>} />
                        <InfoDetail label="Fecha Límite" value={capa.dueDate ? new Date(capa.dueDate).toLocaleDateString('es-AR') : '-'} />
                        {isOverdue && <InfoDetail label="Estado" value={<span className="text-[#dc2626] font-[900]">⚠️ VENCIDA</span>} />}
                    </div>

                    {/* Problem Statement */}
                    <div className="mb-[1.75rem]">
                        <h3 className="text-[0.8rem] font-[800] mb-[0.5rem] uppercase text-[var(--color-text-muted)] letter-spacing-[0.5px]">Declaración del Problema</h3>
                        <div className="p-[1.25rem] bg-[rgba(239,_68,_68,_0.03)] border-[1px_solid_rgba(239,_68,_68,_0.12)] rounded-[var(--radius-xl)]">
                            <p className="m-[0] text-[0.9rem] text-[var(--color-text)] line-height-[1.6] font-[600]">{capa.problemStatement || 'No especificado'}</p>
                        </div>
                    </div>

                    {/* Root Cause Analysis (5 Whys Preview) */}
                    {capa.rootCause && (capa.rootCause.why1 || capa.rootCause.finalCause) &&
          <div className="mb-[1.75rem]">
                            <h3 className="text-[0.8rem] font-[800] mb-[0.75rem] uppercase text-[var(--color-text-muted)] letter-spacing-[0.5px]">Análisis de Causa Raíz (5 Porqués)</h3>
                            <div className="capa-why-container">
                                <div className="capa-why-timeline" />
                                {[1, 2, 3, 4, 5].map((num) => capa.rootCause[`why${num}`] &&
              <div key={num} className="capa-why-node">
                                        <div className="capa-why-badge">{num}</div>
                                        <div className="font-[800] text-[var(--color-primary)] uppercase text-[0.7rem] mb-[0.15rem]">{num}° Porqué</div>
                                        <div className="text-[0.85rem] font-[600] text-[var(--color-text)]">{capa.rootCause[`why${num}`]}</div>
                                    </div>
              )}
                                {capa.rootCause.finalCause &&
              <div className="capa-why-node capa-why-final-container mt-[0.5rem]">
                                        <div className="capa-why-badge bg-[#10b981] border-color-[#10b981] text-[#fff]">✓</div>
                                        <div className="text-[0.7rem] font-[900] text-[#10b981] uppercase mb-[0.15rem] letter-spacing-[0.5px]">Causa Raíz Final</div>
                                        <div className="text-[0.95rem] font-[800] text-[var(--color-text)]">{capa.rootCause.finalCause}</div>
                                    </div>
              }
                            </div>
                        </div>
          }

                    {/* Actions */}
                    {capa.actions && capa.actions.length > 0 &&
          <div className="mb-[1.75rem]">
                            <h3 className="text-[0.8rem] font-[800] mb-[0.75rem] uppercase text-[var(--color-text-muted)] letter-spacing-[0.5px]">Acciones del Plan ({capa.actions.length})</h3>
                            <div className="flex flex-col gap-[0.6rem]">
                                {capa.actions.map((action, idx) =>
              <div key={action.id} style={{ background: action.status === 'completed' ? 'rgba(16, 185, 129, 0.04)' : 'var(--color-background)', border: `1px solid ${action.status === 'completed' ? '#10b981' : 'var(--glass-border-subtle)'}` }} className="p-[0.85rem_1.25rem] rounded-[var(--radius-xl)] box-shadow-[var(--shadow-sm)]">
                                        <div className="flex items-center gap-[0.75rem]">
                                            <div style={{ background: action.status === 'completed' ? '#10b981' : 'rgba(var(--color-primary-rgb), 0.1)', color: action.status === 'completed' ? '#fff' : 'var(--color-primary)' }} className="w-[28px] h-[28px] rounded-[50%] flex items-center text-[0.8rem] font-[900] flex-shrink-[0] justify-center">{idx + 1}</div>
                                            <div className="flex-[1] min-width-[0]">
                                                <div className="text-[0.9rem] font-[800] text-[var(--color-text)] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">{action.description}</div>
                                                <div className="text-[0.75rem] text-[var(--color-text-muted)] font-[600]">Responsable: {action.responsible || 'N/A'} • Vence: {action.dueDate ? new Date(action.dueDate).toLocaleDateString('es-AR') : 'N/A'}</div>
                                            </div>
                                            <span style={{ background: action.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: action.status === 'completed' ? '#10b981' : '#f59e0b', border: `1px solid ${action.status === 'completed' ? '#10b98130' : '#f59e0b30'}` }} className="p-[0.25rem_0.6rem] rounded-[var(--radius-full)] text-[0.65rem] font-[900]">{action.status === 'completed' ? 'COMPLETADA' : 'PENDIENTE'}</span>
                                        </div>
                                    </div>
              )}
                            </div>
                        </div>
          }

                    {/* Timeline */}
                    {capa.timeline && capa.timeline.length > 0 &&
          <div className="mb-[1.75rem]">
                            <button onClick={() => setShowTimeline(!showTimeline)} className="flex items-center gap-[0.5rem] bg-[none] border-none cursor-pointer text-[var(--color-primary)] font-[800] text-[0.85rem] outline-[none]">
                                <Clock size={16} />
                                <span>{showTimeline ? 'Ocultar' : 'Ver'} Historial del Proceso ({capa.timeline.length})</span>
                            </button>
                            {showTimeline &&
            <div className="mt-[0.75rem] p-[1.25rem] bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)] rounded-[var(--radius-xl)]">
                                    {capa.timeline.map((event, idx) =>
              <div key={idx} style={{ borderBottom: idx < capa.timeline.length - 1 ? '1px solid var(--glass-border-subtle)' : 'none' }} className="flex gap-[0.75rem] mb-[0.75rem] pb-[0.75rem]">
                                            <div className="w-[10px] h-[10px] bg-[var(--color-primary)] rounded-[50%] mt-[5px] flex-shrink-[0] box-shadow-[0_0_8px_var(--color-primary)]" />
                                            <div>
                                                <div className="text-[0.85rem] font-[700] text-[var(--color-text)]">{event.event}</div>
                                                <div className="text-[0.75rem] text-[var(--color-text-muted)] font-[600]">{new Date(event.date).toLocaleString()} • {event.user}</div>
                                            </div>
                                        </div>
              )}
                                </div>
            }
                        </div>
          }

                    {/* Verificación de Eficacia */}
                    {capa.status === 'closed' &&
          <div style={{ background: capa.effectivenessVerified ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)', border: `1px solid ${capa.effectivenessVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}` }} className="mb-[1.75rem] p-[1.25rem] rounded-[var(--radius-xl)]">
                            <div className="flex justify-space-between items-center">
                                <div>
                                    <h3 style={{ color: capa.effectivenessVerified ? '#10b981' : '#f59e0b' }} className="text-[0.9rem] font-[800] m-[0_0_0.25rem]">
                                        {capa.effectivenessVerified ? 'Eficacia Verificada' : 'Eficacia Pendiente de Verificación'}
                                    </h3>
                                    {capa.effectivenessVerified &&
                <div className="text-[0.75rem] text-[var(--color-text-muted)] font-[600]">
                                            Verificado el {new Date(capa.effectivenessVerificationDate || capa.closedAt).toLocaleDateString('es-AR')}
                                        </div>
                }
                                </div>
                                {!capa.effectivenessVerified &&
              <button onClick={() => onVerifyEffectiveness(capa.id)} className="btn-primary m-[0] p-[0.6rem_1rem] bg-[linear-gradient(135deg,_#10b981,_#059669)] text-[0.8rem]">
                                        Verificar Eficacia
                                    </button>
              }
                            </div>
                        </div>
          }

                    {/* Status Change Buttons */}
                    <div className="flex gap-[0.5rem] flex-wrap mb-[1.5rem] border-top-[1px_solid_var(--glass-border-subtle)] pt-[1.5rem]">
                        {capa.status === 'draft' && <button onClick={() => onUpdateStatus(capa.id, 'open')} className="btn-primary flex-[auto] m-[0] p-[0.75rem_1.25rem] font-[800]">Abrir CAPA</button>}
                        {capa.status === 'open' && <button onClick={() => onUpdateStatus(capa.id, 'in_progress')} className="btn-primary flex-[auto] m-[0] p-[0.75rem_1.25rem] bg-[linear-gradient(135deg,_#3b82f6,_#2563eb)] font-[800]">Iniciar</button>}
                        {capa.status === 'in_progress' && <button onClick={() => onUpdateStatus(capa.id, 'review')} className="btn-primary flex-[auto] m-[0] p-[0.75rem_1.25rem] bg-[linear-gradient(135deg,_#8b5cf6,_#7c3aed)] font-[800]">Enviar a Revisión</button>}
                        {capa.status === 'review' && <button onClick={() => onUpdateStatus(capa.id, 'completed')} className="btn-primary flex-[auto] m-[0] p-[0.75rem_1.25rem] bg-[linear-gradient(135deg,_#16a34a,_#059669)] font-[800]">Completar</button>}
                        {capa.status === 'completed' && <button onClick={() => onUpdateStatus(capa.id, 'closed')} className="btn-primary flex-[auto] m-[0] p-[0.75rem_1.25rem] bg-[linear-gradient(135deg,_#059669,_#047857)] font-[800]">Cerrar CAPA</button>}
                    </div>

                    <button onClick={onClose} className="w-[100%] p-[0.85rem] bg-[var(--color-surface)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-lg)] text-[var(--color-text)] font-[800] cursor-pointer transition-[all_0.2s]">Cerrar Vista</button>
                </div>
            </div>
        </div>);

}

// Modal de Acción
function CreateActionModal({ capa, onSave, onClose, CONTROL_HIERARCHY }) {
  const [action, setAction] = useState({ description: '', responsible: '', dueDate: '', controlType: '', expectedResult: '' });

  return (
    <div className="modal-fullscreen-overlay modal-overlay-glass" onClick={onClose}>
            <div className="modal-fullscreen-content modal-glass max-w-[580px] p-[2rem] border-[1px_solid_var(--glass-border)]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-space-between items-center mb-[1.5rem] pb-[1rem] border-bottom-[1px_solid_var(--glass-border-subtle)]">
                    <h2 className="m-[0] text-[1.25rem] font-[900] text-[var(--color-text)] flex items-center gap-[0.5rem]">
                        <Plus size={20} color="var(--color-primary)" />
                        Nueva Acción en Plan
                    </h2>
                    <button onClick={onClose} className="p-[0.4rem] bg-[rgba(239,_68,_68,_0.08)] border-none rounded-[var(--radius-md)] cursor-pointer text-[#ef4444] flex items-center justify-center"><XCircle size={20} /></button>
                </div>
                <div className="mb-[1.25rem]">
                    <label className="block mb-2 text-sm font-semibold text-slate-400">Descripción de la Acción *</label>
                    <textarea value={action.description} onChange={(e) => setAction({ ...action, description: e.target.value })} className="capa-focus-glow min-h-[80px] bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)] pt-[0.75rem]" style={{ ...inputStyle }} placeholder="Describí la acción a implementar..." />
                </div>
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[1.25rem]">
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Responsable</label>
                        <input type="text" value={action.responsible} onChange={(e) => setAction({ ...action, responsible: e.target.value })} className="capa-focus-glow bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)]" style={{ ...inputStyle }} />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Fecha Límite</label>
                        <input type="date" value={action.dueDate} onChange={(e) => setAction({ ...action, dueDate: e.target.value })} className="capa-focus-glow bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)]" style={{ ...inputStyle }} />
                    </div>
                </div>
                <div className="mb-6">
                    <label className="block mb-2 text-sm font-semibold text-slate-400">Tipo de Control (Jerarquía)</label>
                    <div className="grid grid-template-columns-[repeat(3,_1fr)] gap-[0.5rem]">
                        {CONTROL_HIERARCHY.map((ctrl) => {
              const isActive = action.controlType === ctrl.id;
              return (
                <button
                  key={ctrl.id}
                  onClick={() => setAction({ ...action, controlType: ctrl.id })}
                  style={{

                    background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-background)',
                    border: `1.5px solid ${isActive ? '#10b981' : 'var(--glass-border-subtle)'}`,







                    boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                  }} className="p-[0.6rem_0.4rem] rounded-[var(--radius-xl)] cursor-pointer flex flex-col items-center gap-[0.25rem] transition-[all_0.2s]">
                  
                                    <span className="text-[1.4rem]">{ctrl.icon}</span>
                                    <span style={{ color: isActive ? '#10b981' : 'var(--color-text-muted)' }} className="text-[0.65rem] font-[900]">{ctrl.name}</span>
                                </button>);

            })}
                    </div>
                </div>
                <div className="flex gap-[1rem] border-top-[1px_solid_var(--glass-border-subtle)] pt-[1.25rem]">
                    <button onClick={onClose} className="flex-[1] p-[0.85rem] bg-[transparent] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-lg)] text-[var(--color-text-muted)] font-[800] cursor-pointer transition-[all_0.2s]">Cancelar</button>
                    <button onClick={() => onSave(action)} className="btn-primary flex-[1] m-[0] p-[0.85rem] font-[800]">Agregar Acción</button>
                </div>
            </div>
        </div>);

}

function InfoDetail({ label, value }) {
  return (
    <div>
            <div className="text-[0.7rem] font-[700] text-[var(--color-text-muted)] uppercase mb-[0.25rem]">{label}</div>
            <div className="text-[0.95rem] font-[600] text-[var(--color-text)]">{typeof value === 'string' ? value : value}</div>
        </div>);

}