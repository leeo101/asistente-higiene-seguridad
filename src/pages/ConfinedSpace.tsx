import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate } from 'react-router-dom';
import {
  Tent, AlertTriangle, Plus, Search,
  FileText, Eye, Edit3, Trash2, CheckCircle2,
  XCircle, Clock, User, Users, Calendar,
  Shield, Wind, Droplets, Thermometer, Activity,
  BarChart3, AlertCircle, CheckSquare, XSquare, Share2, ArrowLeft } from
'lucide-react';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';

// Límites atmosféricos según OSHA 1910.146
const ATMOSPHERIC_LIMITS = {
  oxygen: { min: 19.5, max: 23.5, unit: '%', name: 'Oxígeno' },
  lel: { min: 0, max: 10, unit: '%', name: 'LEL (Inflamables)' },
  h2s: { min: 0, max: 10, unit: 'ppm', name: 'H2S (Sulfuro)' },
  co: { min: 0, max: 35, unit: 'ppm', name: 'CO (Monóxido)' },
  co2: { min: 0, max: 5000, unit: 'ppm', name: 'CO2 (Dióxido)' }
};

// Tipos de espacios confinados
const CONFINED_SPACE_TYPES = [
{ id: 'tank', name: 'Tanque', icon: '🛢️' },
{ id: 'vessel', name: 'Recipiente', icon: '📦' },
{ id: 'silo', name: 'Silo', icon: '🏭' },
{ id: 'pit', name: 'Fosa', icon: '⬇️' },
{ id: 'tunnel', name: 'Túnel', icon: '🚇' },
{ id: 'sewer', name: 'Alcantarilla', icon: '🕳️' },
{ id: 'manhole', name: 'Boca de Visita', icon: '⭕' },
{ id: 'other', name: 'Otro', icon: '📍' }];


// Roles en espacio confinado (OSHA)
const ROLES = [
{ id: 'entrant', name: 'Entrante', icon: '👤', color: '#3b82f6' },
{ id: 'attendant', name: 'Vigía', icon: '👁️', color: '#f59e0b' },
{ id: 'supervisor', name: 'Supervisor', icon: '👔', color: '#16a34a' },
{ id: 'rescue', name: 'Rescate', icon: '🚑', color: '#dc2626' }];


// Equipamiento requerido
const EQUIPMENT_CHECKLIST = [
{ id: 'gas_detector', name: 'Detector de Gases', icon: '💨', required: true },
{ id: 'harness', name: 'Arnés de Seguridad', icon: '🦺', required: true },
{ id: 'tripod', name: 'Trípode con Malacate', icon: '🏗️', required: true },
{ id: 'ventilator', name: 'Ventilador', icon: '💨', required: false },
{ id: 'radio', name: 'Radio Comunicación', icon: '📻', required: true },
{ id: 'light', name: 'Iluminación', icon: '💡', required: true },
{ id: 'scba', name: 'ERA (SCBA)', icon: '😷', required: false },
{ id: 'first_aid', name: 'Botiquín Primeros Auxilios', icon: '🏥', required: true },
{ id: 'fire_extinguisher', name: 'Extintor', icon: '🧯', required: true },
{ id: 'barrier', name: 'Barreras/Señalización', icon: '🚧', required: true }];


// Estados del permiso
const PERMIT_STATUS = {
  draft: { label: 'BORRADOR', color: '#6b7280', bg: '#f3f4f6' },
  pending: { label: 'PENDIENTE', color: '#f59e0b', bg: '#fffbeb' },
  active: { label: 'ACTIVO', color: '#16a34a', bg: '#f0fdf4' },
  suspended: { label: 'SUSPENDIDO', color: '#dc2626', bg: '#fef2f2' },
  completed: { label: 'COMPLETADO', color: '#3b82f6', bg: '#eff6ff' },
  expired: { label: 'EXPIRADO', color: '#9ca3af', bg: '#f9fafb' }
};

// Hazards potenciales
const POTENTIAL_HAZARDS = [
{ id: 'atmospheric', name: 'Atmosférico Peligroso', icon: '💨' },
{ id: 'engulfment', name: 'Atrapamiento', icon: '🌊' },
{ id: 'configuration', name: 'Configuración', icon: '📐' },
{ id: 'electrical', name: 'Eléctrico', icon: '⚡' },
{ id: 'mechanical', name: 'Mecánico', icon: '🔧' },
{ id: 'thermal', name: 'Térmico', icon: '🔥' },
{ id: 'noise', name: 'Ruido', icon: '🔊' },
{ id: 'fall', name: 'Caída', icon: '⬇️' },
{ id: 'chemical', name: 'Químico', icon: '🧪' },
{ id: 'biological', name: 'Biológico', icon: '🦠' }];


export default function ConfinedSpace(): React.ReactElement | null {
  const { requirePro } = usePaywall();

  const navigate = useNavigate();
  const [permits, setPermits] = useState([]);
  const [activePermits, setActivePermits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('permits');
  const [showAtmosphericModal, setShowAtmosphericModal] = useState(false);
  const [currentPermitForReading, setCurrentPermitForReading] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  // --- Pre-Entry Checklist State ---
  const PRE_ENTRY_ITEMS = [
  { id: 'pe1', emoji: '💨', label: 'Atmósfera verificada (O₂, LEL, CO, H₂S)', critical: true },
  { id: 'pe2', emoji: '🦺', label: 'Arnés de seguridad y malacate listos', critical: true },
  { id: 'pe3', emoji: '📻', label: 'Comunicación de radio establecida', critical: true },
  { id: 'pe4', emoji: '👁️', label: 'Vigía asignado y en posición', critical: true },
  { id: 'pe5', emoji: '🚨', label: 'Plan de rescate definido y conocido', critical: true },
  { id: 'pe6', emoji: '💡', label: 'Iluminación adecuada instalada', critical: false },
  { id: 'pe7', emoji: '💨', label: 'Ventilación forzada activa (si aplica)', critical: false },
  { id: 'pe8', emoji: '🧯', label: 'Extintor a la vista y operativo', critical: false },
  { id: 'pe9', emoji: '🚧', label: 'Zona delimitada y señalizada', critical: false },
  { id: 'pe10', emoji: '📋', label: 'Permiso de trabajo vigente y firmado', critical: true }];

  const [preEntryChecks, setPreEntryChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(PRE_ENTRY_ITEMS.map((i) => [i.id, false]))
  );
  const preEntryDone = Object.values(preEntryChecks).filter(Boolean).length;
  const criticalItems = PRE_ENTRY_ITEMS.filter((i) => i.critical);
  const allCriticalDone = criticalItems.every((i) => preEntryChecks[i.id]);
  const preEntryPct = Math.round(preEntryDone / PRE_ENTRY_ITEMS.length * 100);
  const semaphoreColor = allCriticalDone && preEntryPct === 100 ? '#10b981' : allCriticalDone ? '#f59e0b' : '#ef4444';
  const semaphoreLabel = allCriticalDone && preEntryPct === 100 ? '✅ AUTORIZADO PARA INGRESAR' : allCriticalDone ? '⚠️ INCOMPLETO — Verificar items opcionales' : '🚫 ENTRADA PROHIBIDA — Items críticos pendientes';

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = () => {

      const savedPermits = localStorage.getItem('confined_space_permits_db');
      const savedActive = localStorage.getItem('confined_space_active_db');
      if (savedPermits) setPermits(JSON.parse(savedPermits));
      if (savedActive) setActivePermits(JSON.parse(savedActive));
    };

    loadData();

    const handleStorageChange = (e) => {
      if (e.key === 'confined_space_permits_db' || e.key === 'confined_space_active_db') {
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
    localStorage.setItem('confined_space_permits_db', JSON.stringify(data));
    setPermits(data);
  };

  const saveActivePermits = (data) => {
    localStorage.setItem('confined_space_active_db', JSON.stringify(data));
    setActivePermits(data);
  };


  const authorizePermit = (permitId) => {
    const permit = permits.find((p) => p.id === permitId);
    if (!permit) return;

    const now = new Date().toISOString();
    const validUntil = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 horas

    const authorizedPermit = {
      ...permit,
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

  const addAtmosphericReading = (reading) => {
    const updatedPermit = {
      ...currentPermitForReading,
      atmosphericReadings: [...currentPermitForReading.atmosphericReadings, {
        ...reading,
        timestamp: new Date().toISOString(),
        status: evaluateAtmosphere(reading)
      }]
    };

    // Update in permits
    const updatedPermits = permits.map((p) =>
    p.id === updatedPermit.id ? updatedPermit : p
    );
    savePermits(updatedPermits);

    // Update in active
    const updatedActive = activePermits.map((p) =>
    p.id === updatedPermit.id ? updatedPermit : p
    );
    saveActivePermits(updatedActive);

    setCurrentPermitForReading(updatedPermit);
  };

  const evaluateAtmosphere = (reading) => {
    const limits = ATMOSPHERIC_LIMITS;

    if (reading.oxygen < limits.oxygen.min || reading.oxygen > limits.oxygen.max) return 'danger';
    if (reading.lel > limits.lel.max) return 'danger';
    if (reading.h2s > limits.h2s.max) return 'danger';
    if (reading.co > limits.co.max) return 'danger';

    if (reading.oxygen < 20.9 || reading.lel > 0 || reading.h2s > 0 || reading.co > 0) return 'warning';

    return 'safe';
  };

  const filteredPermits = permits.filter((p) => {
    const matchesSearch = p.spaceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    spaceTypes: permits.reduce((acc, p) => {
      if (p.spaceType) acc[p.spaceType] = (acc[p.spaceType] || 0) + 1;
      return acc;
    }, {})
  };

  return (
    <div className="container pb-[6rem]">
            <ShareModal
        isOpen={!!shareItem}
        open={!!shareItem}
        onClose={() => setShareItem(null)}
        title={`Espacio Confinado - ${shareItem?.spaceName || ''}`}
        text={shareItem ? `🕳️ Permiso Ingreso Espacio Confinado\n🆔 Espacio: ${shareItem.spaceName}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${new Date(shareItem.createdAt).toLocaleDateString('es-AR')}` : ''}
        rawMessage={shareItem ? `🕳️ Permiso Ingreso Espacio Confinado\n🆔 Espacio: ${shareItem.spaceName}\n📍 Ubicación: ${shareItem.location}\n📅 Fecha: ${new Date(shareItem.createdAt).toLocaleDateString('es-AR')}` : ''}
        elementIdToPrint="pdf-content"
        fileName={`Espacio_Confinado_${shareItem?.spaceName || 'Sin_Nombre'}.pdf`} />
      

            <div className="fixed left-[0] opacity-[0.01] top-[0] pointer-events-[none]">
                {shareItem && <ConfinedSpacePdf data={shareItem} />}
            </div>

            <PremiumHeader
        title="Espacios Confinados"
        subtitle={`OSHA 1910.146 • ${activePermits.length} activos`}
        icon={<Tent size={36} color="#ffffff" />} />
      

            <div className="flex items-center justify-between gap-[1rem] mb-[1.5rem] flex-wrap w-full">
                <div className="flex gap-[1rem] items-center">
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        console.log("Navigating to /confined-space/new");
                        navigate('/confined-space/new');
                    }} 
                    style={{ backgroundColor: '#16a34a', color: '#ffffff', zIndex: 50, position: 'relative' }}
                    className="ml-auto p-[0.8rem_1.5rem] rounded-[12px] border-none font-[800] text-[0.95rem] cursor-pointer flex items-center gap-[0.5rem] shadow-[0_4px_15px_rgba(22,163,74,0.3)] transition-[all_0.2s] whitespace-nowrap"
                >
                    <Plus size={20} color="#ffffff" strokeWidth={2.5} /> Nuevo Permiso
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-[1rem] mb-[2rem]">
        
                <StatCard
          icon={<FileText size={24} />}
          label="Total Permisos"
          value={stats.total}
          color="#3B82F6"
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)" />
        
                <StatCard
          icon={<CheckCircle2 size={24} />}
          label="Permisos Activos"
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
          icon={<CheckSquare size={24} />}
          label="Completados"
          value={stats.completed}
          color="#8b5cf6"
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
        
            </div>

            {/* Tabs */}
            <div className="flex gap-[0.5rem] mb-[1.5rem] border-bottom-[2px_solid_var(--color-border)] pb-[0.5rem] flex-wrap">






        
                <TabButton
          active={activeTab === 'permits'}
          onClick={() => setActiveTab('permits')}
          icon={<FileText size={18} />}
          label="Permisos"
          count={permits.length}
          badge={0} />
        
                <TabButton
          active={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
          icon={<CheckCircle2 size={18} />}
          label="Activos"
          count={activePermits.length}
          badge={activePermits.length} />
        
                <TabButton
          active={activeTab === 'preentry'}
          onClick={() => setActiveTab('preentry')}
          icon={<Shield size={18} />}
          label="Pre-Entrada"
          count={0}
          badge={!allCriticalDone ? 1 : 0} />
        
                <TabButton
          active={activeTab === 'limits'}
          onClick={() => setActiveTab('limits')}
          icon={<Activity size={18} />}
          label="Límites"
          count={0}
          badge={0} />
        
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
              placeholder="Buscar por espacio, ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] py-[0.85rem] pr-[1rem] pl-[2.8rem] rounded-[var(--radius-lg)] border-[1px_solid_var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[0.95rem] font-[500] outline-[none] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />











            
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
          title="Sin Permisos de Espacio Confinado"
          description="Creá permisos de entrada según OSHA 1910.146 para asegurar el ingreso seguro."
          icon={<Shield />} /> :


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
            onEdit={() => navigate('/confined-space/new', { state: { editData: permit } })}
            onShare={() => setShareItem(permit)}
            onDelete={() => deletePermit(permit.id)} />

          )}
                        </div>
        }
                </>
      }

            {activeTab === 'preentry' &&
      <div className="flex flex-col gap-[1.5rem]">
                    {/* Semaphore Panel */}
                    <div style={{

          background: `${semaphoreColor}12`,
          border: `2px solid ${semaphoreColor}`


        }} className="p-[2rem] rounded-[20px] text-center">
                        <div className="text-[3rem] mb-[0.5rem]">
                            {allCriticalDone && preEntryPct === 100 ? '🟢' : allCriticalDone ? '🟡' : '🔴'}
                        </div>
                        <div style={{ color: semaphoreColor }} className="text-[1.1rem] font-[900] mb-[0.5rem]">
                            {semaphoreLabel}
                        </div>
                        <div className="h-[8px] bg-[rgba(0,0,0,0.1)] rounded-[999px] m-[1rem_auto] max-w-[300px] overflow-[hidden]">
                            <div style={{ width: `${preEntryPct}%`, background: semaphoreColor }} className="h-[100%] rounded-[999px] transition-[width_0.5s_ease]" />
                        </div>
                        <div className="text-[0.85rem] text-[var(--color-text-muted)] font-[700]">
                            {preEntryDone} / {PRE_ENTRY_ITEMS.length} verificaciones completadas
                        </div>
                        {preEntryPct === 100 &&
          <button
            onClick={() => setPreEntryChecks(Object.fromEntries(PRE_ENTRY_ITEMS.map((i) => [i.id, false])))} className="mt-[1rem] p-[0.5rem_1.2rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[12px] cursor-pointer text-[0.75rem] font-[700] text-[var(--color-text-muted)]">

            
                                Reiniciar Verificación
                            </button>
          }
                    </div>

                    {/* Checklist Grid */}
                    <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(280px,_1fr))] gap-[0.75rem]">
                        {PRE_ENTRY_ITEMS.map((item) => {
            const done = preEntryChecks[item.id];
            return (
              <button
                key={item.id}
                onClick={() => setPreEntryChecks((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                style={{


                  background: done ? 'rgba(16,185,129,0.08)' : 'var(--color-surface)',
                  border: `2px solid ${done ? '#10b981' : item.critical ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`




                }} className="flex items-center gap-[1rem] p-[1rem_1.2rem] rounded-[14px] cursor-pointer text-left transition-[all_0.2s]">
                
                                    <div style={{


                  background: done ? '#10b981' : 'var(--color-background)',
                  border: `2px solid ${done ? '#10b981' : item.critical ? '#ef4444' : 'var(--color-border)'}`,

                  fontSize: done ? '1rem' : '0.9rem',

                  color: done ? '#fff' : 'inherit'
                }} className="w-[36px] h-[36px] flex-shrink-[0] rounded-[50%] flex items-center justify-center transition-[all_0.25s]">
                                        {done ? '✓' : item.emoji}
                                    </div>
                                    <div>
                                        <div style={{ color: done ? '#10b981' : 'var(--color-text)' }} className="font-[700] text-[0.88rem]">
                                            {item.label}
                                        </div>
                                        <div style={{ color: item.critical ? '#ef4444' : 'var(--color-text-muted)' }} className="text-[0.65rem] font-[700] mt-[0.2rem]">
                                            {item.critical ? '🔴 OBLIGATORIO' : '🟟 Recomendado'}
                                        </div>
                                    </div>
                                </button>);

          })}
                    </div>
                </div>
      }

            {activeTab === 'active' &&
      <ActivePermitsList
        activePermits={activePermits}
        onComplete={completePermit}
        onSuspend={suspendPermit}
        onView={setSelectedPermit}
        onShare={(permit) => setShareItem(permit)}
        onAddReading={(permit) => {
          setCurrentPermitForReading(permit);
          setShowAtmosphericModal(true);
        }} />

      }

            {activeTab === 'limits' &&
      <AtmosphericLimitsPanel limits={ATMOSPHERIC_LIMITS} />
      }


            {/* Modal de Detalle */}
            {selectedPermit &&
      <PermitDetailModal
        permit={selectedPermit}
        statusConfig={PERMIT_STATUS[selectedPermit.status] || PERMIT_STATUS.draft}
        onClose={() => setSelectedPermit(null)}
        CONFINED_SPACE_TYPES={CONFINED_SPACE_TYPES}
        POTENTIAL_HAZARDS={POTENTIAL_HAZARDS}
        EQUIPMENT_CHECKLIST={EQUIPMENT_CHECKLIST}
        ROLES={ROLES} />

      }

            {/* Modal de Lectura Atmosférica */}
            {showAtmosphericModal && currentPermitForReading &&
      <AtmosphericReadingModal
        permit={currentPermitForReading}
        onSave={addAtmosphericReading}
        onClose={() => {
          setShowAtmosphericModal(false);
          setCurrentPermitForReading(null);
        }}
        limits={ATMOSPHERIC_LIMITS} />

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


function StatCard({ icon, label, value, color, gradient }) {
  return (
    <div className="card p-[1.25rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border-subtle)] relative overflow-[hidden]">





      
            <div style={{





        background: gradient


      }} className="absolute top-[-20px] right-[-20px] w-[80px] h-[80px] rounded-[50%] opacity-[0.1]" />
            <div className="flex items-center gap-[0.75rem] mb-[0.5rem]">
                <div style={{


          background: gradient,




          boxShadow: `0 4px 15px ${color}40`
        }} className="w-[40px] h-[40px] rounded-[var(--radius-lg)] flex items-center justify-center">
                    {React.cloneElement(icon, { color: '#ffffff', size: 20 })}
                </div>
            </div>
            <div className="text-[1.5rem] font-[900] text-[var(--color-text)] line-height-[1]">
                {value}
            </div>
            <div className="text-[0.75rem] font-[600] text-[var(--color-text-muted)] line-height-[1.2] mt-[0.2rem]">
                {label}
            </div>
        </div>);

}

function TabButton({ active, onClick, icon, label, count, badge }) {
  return (
    <button
      onClick={onClick}
      style={{




        background: active ? 'var(--color-primary)' : 'transparent',
        color: active ? '#fff' : 'var(--color-text-muted)'







      }} className="flex items-center gap-[0.5rem] p-[0.75rem_1.25rem] border-none rounded-[var(--radius-lg)_var(--radius-lg)_0_0] cursor-pointer font-[700] text-[0.9rem] transition-[all_var(--transition-fast)] relative">
      
            {icon}
            {label}
            {count !== undefined &&
      <span style={{

        background: active ? 'rgba(255,255,255,0.2)' : 'var(--color-background)'



      }} className="p-[0.2rem_0.5rem] rounded-[var(--radius-full)] text-[0.75rem] font-[800]">
                    {count}
                </span>
      }
            {badge > 0 &&
      <span className="absolute top-[-4px] right-[-4px] w-[20px] h-[20px] bg-[#ef4444] text-[#fff] rounded-[50%] flex items-center justify-center text-[0.7rem] font-[900]">













        
                    {badge}
                </span>
      }
        </button>);

}

function PermitCard({ permit, statusConfig, onAuthorize, onSuspend, onComplete, onView, onEdit, onShare, onDelete }: any) {
  const spaceType = CONFINED_SPACE_TYPES.find((t) => t.id === permit.spaceType);
  const isExpired = permit.validUntil && new Date(permit.validUntil) < new Date();

  return (
    <div className="card p-[1.25rem] flex flex-wrap items-center gap-[1rem] transition-[all_var(--transition-fast)]" style={{






      borderLeft: `4px solid ${isExpired ? '#9ca3af' : statusConfig.color}`
    }}>
            {/* Icono */}
            <div style={{
        background: `${isExpired ? '#9ca3af' : statusConfig.color}15`
      }} className="w-[56px] h-[56px] rounded-[var(--radius-xl)] flex items-center justify-center flex-shrink-[0]">
                <Tent size={28} color={isExpired ? '#9ca3af' : statusConfig.color} strokeWidth={2.5} />
            </div>

            <div className="flex-[1_1_200px] min-width-[0]">
                <div className="flex items-center gap-[0.75rem] mb-[0.5rem] flex-wrap">
                    <h3 className="m-[0] text-[1.1rem] font-[800] text-[var(--color-text)] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis] max-w-[calc(100vw_-_200px)]">
                        {spaceType?.icon} {permit.spaceName}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase shrink-0" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
                        {isExpired ? 'EXPIRADO' : statusConfig.label}
                    </span>
                </div>
                <div className="flex flex-wrap gap-[1rem] text-[0.85rem] text-[var(--color-text-muted)] font-[500]">
                    <span className="flex items-center gap-[0.35rem]">
                        <Tent size={14} />
                        {permit.location || 'Sin ubicación'}
                    </span>
                    <span className="flex items-center gap-[0.35rem]">
                        <Users size={14} />
                        {permit.team?.entrants?.length || 0} entrantes
                    </span>
                    <span className="flex items-center gap-[0.35rem]">
                        <Calendar size={14} />
                        {permit.validUntil ? new Date(permit.validUntil).toLocaleDateString('es-AR') : '-'}
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center mt-[1rem] pt-[1rem] border-top-[1px_solid_var(--color-border)]">
                <span className="text-[0.75rem] text-[var(--color-text-muted)] font-[600] flex items-center gap-[0.4rem]">
                    <Clock size={14} /> Creado: {new Date(permit.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-[0.5rem]">
                    {permit.status === 'pending' &&
                        <button
                            onClick={onAuthorize}
                            title="Autorizar Permiso" className="p-[0.6rem] bg-[#16a34a] border-none rounded-[8px] cursor-pointer text-[#fff] shadow-sm hover:-translate-y-0.5 transition-[all_var(--transition-fast)]">
                            <CheckCircle2 size={18} />
                        </button>
                    }
                    {permit.status === 'active' &&
                        <>
                            <button
                                onClick={onSuspend}
                                title="Suspender Permiso" className="p-[0.6rem] bg-[#f59e0b] border-none rounded-[8px] cursor-pointer text-[#fff] shadow-sm hover:-translate-y-0.5 transition-[all_var(--transition-fast)]">
                                <AlertTriangle size={18} />
                            </button>
                            <button
                                onClick={onComplete}
                                title="Completar Permiso" className="p-[0.6rem] bg-[#0ea5e9] border-none rounded-[8px] cursor-pointer text-[#fff] shadow-sm hover:-translate-y-0.5 transition-[all_var(--transition-fast)]">
                                <CheckSquare size={18} />
                            </button>
                        </>
                    }
                    <button
                        onClick={onEdit}
                        className="p-[0.6rem] bg-[#6366f1] border-none rounded-[8px] cursor-pointer text-[#fff] shadow-sm hover:-translate-y-0.5 transition-[all_var(--transition-fast)]"
                        title="Editar Permiso">
                        <Edit3 size={18} />
                    </button>
                    <button
                        onClick={onShare}
                        className="p-[0.6rem] bg-[#8b5cf6] border-none rounded-[8px] cursor-pointer text-[#fff] shadow-sm hover:-translate-y-0.5 transition-[all_var(--transition-fast)]"
                        title="Compartir PDF">
                        <Share2 size={18} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-[0.6rem] bg-[#ef4444] border-none rounded-[8px] cursor-pointer text-[#fff] shadow-sm hover:-translate-y-0.5 transition-[all_var(--transition-fast)]"
                        title="Eliminar">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>);

}

function EmptyState({ onAdd }) {
  return (
    <div className="p-[4rem_2rem] text-center bg-[var(--gradient-card)] rounded-[var(--radius-2xl)] border-[2px_dashed_var(--color-border)]">





      
            <div className="w-[80px] h-[80px] m-[0_auto_1.5rem] bg-[var(--color-background)] rounded-[50%] flex items-center justify-center">








        
                <Tent size={40} color="var(--color-text-muted)" />
            </div>
            <h3 className="m-[0_0_0.5rem_0] text-[1.25rem] font-[800] text-[var(--color-text)]">




        
                Sin Permisos de Espacio Confinado
            </h3>
            <p className="m-[0_0_1.5rem_0] text-[var(--color-text-muted)] text-[0.95rem]">



        
                Creá permisos de entrada según OSHA 1910.146
            </p>
            <button
        onClick={onAdd}
        className="btn-primary w-[auto] m-[0]">

        
                <Plus size={20} className="mr-[0.5rem]" />
                Primer Permiso
            </button>
        </div>);

}

function ActivePermitsList({ activePermits, onComplete, onSuspend, onView, onShare, onAddReading }) {
  if (activePermits.length === 0) {
    return (
      <div className="p-[3rem_2rem] text-center bg-[var(--gradient-card)] rounded-[var(--radius-2xl)] border-[2px_dashed_var(--color-border)]">





        
                <CheckCircle2 size={48} color="#16a34a" className="mb-[1rem]" />
                <h3 className="m-[0_0_0.5rem_0] text-[1.1rem] font-[800]">
                    ¡No hay permisos activos!
                </h3>
                <p className="text-[var(--color-text-muted)] text-[0.95rem]">
                    No hay entradas a espacios confinados en curso.
                </p>
            </div>);

  }

  return (
    <div className="flex flex-col gap-4">
            {activePermits.map((permit) => {
        const spaceType = CONFINED_SPACE_TYPES.find((t) => t.id === permit.spaceType);
        const isExpired = permit.validUntil && new Date(permit.validUntil) < new Date();
        const timeRemaining = permit.validUntil ?
        Math.max(0, Math.floor((new Date(permit.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60))) :
        0;

        return (
          <div key={permit.id} className="card p-[1.5rem] flex flex-wrap items-center gap-[1rem]" style={{





            border: isExpired ? '2px solid #9ca3af' : '2px solid #16a34a',
            background: isExpired ? '#f9fafb' : '#f0fdf4'
          }}>
                        <div className="flex items-center gap-[1rem] flex-wrap w-[100%]">
                            <div style={{


                background: isExpired ?
                'linear-gradient(135deg, #9ca3af, #6b7280)' :
                'linear-gradient(135deg, #16a34a, #059669)',







                animation: isExpired ? 'none' : 'pulse 2s infinite'
              }} className="w-[72px] h-[72px] rounded-[var(--radius-xl)] flex flex-col items-center justify-center text-[#fff] flex-shrink-[0]">
                                <Tent size={32} strokeWidth={2.5} />
                                <span className="text-[0.65rem] font-[700] mt-[2px]">
                                    {timeRemaining}h
                                </span>
                            </div>
                            <div className="flex-[1_1_200px]">
                                <div className="flex items-center gap-[0.75rem] mb-[0.5rem] flex-wrap">
                                    <h3 className="m-0 text-xl font-black">
                                        {spaceType?.icon} {permit.spaceName}
                                    </h3>
                                    {isExpired &&
                  <span className="p-[0.35rem_0.75rem] bg-[#9ca3af] text-[#fff] rounded-[var(--radius-full)] text-[0.7rem] font-[800] uppercase">







                    
                                            EXPIRADO
                                        </span>
                  }
                                </div>
                                <p className="m-[0.25rem_0_0_0] text-[var(--color-text-muted)] text-[0.9rem]">
                                    {permit.location} • Vigía: {permit.team?.attendant || 'Sin asignar'}
                                </p>
                                <div className="flex gap-[0.5rem] mt-[0.75rem] flex-wrap">
                                    <span className="p-[0.35rem_0.65rem] bg-[#3b82f6] text-[#fff] rounded-[var(--radius-full)] text-[0.75rem] font-[700]">






                    
                                        <User size={12} className="display-[inline] mr-[4px]" />
                                        {permit.team?.entrants?.length || 0} Entrante(s)
                                    </span>
                                    <span className="p-[0.35rem_0.65rem] bg-[#f59e0b] text-[#fff] rounded-[var(--radius-full)] text-[0.75rem] font-[700]">






                    
                                        <Eye size={12} className="display-[inline] mr-[4px]" />
                                        {permit.atmosphericReadings?.length || 0} Mediciones
                                    </span>
                                    {!isExpired &&
                  <span className="p-[0.35rem_0.65rem] bg-[#16a34a] text-[#fff] rounded-[var(--radius-full)] text-[0.75rem] font-[700]">






                    
                                            <Clock size={12} className="display-[inline] mr-[4px]" />
                                            Vence en {timeRemaining}h
                                        </span>
                  }
                                </div>
                            </div>
                            <div className="flex gap-[0.5rem] flex-wrap">
                                <button
                  onClick={() => onAddReading(permit)}
                  className="btn-outline p-[0.6rem_0.75rem]"

                  disabled={isExpired}>
                  
                                    <Wind size={18} />
                                    Medir
                                </button>
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

function AtmosphericLimitsPanel({ limits }) {
  return (
    <div className="flex flex-col gap-[1.5rem]">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 className="m-[0_0_1.5rem_0] text-[1rem] font-[800]">
                    <Activity size={20} className="display-[inline] mr-[0.5rem]" />
                    Límites Atmosféricos (OSHA 1910.146)
                </h3>
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(250px,_1fr))] gap-[1rem]">
                    {Object.entries(limits).map(([key, limitVal]: [string, any]) =>
          <div key={key} style={{

            background: key === 'oxygen' ? '#eff6ff' : '#f0fdf4',
            border: `1px solid ${key === 'oxygen' ? '#3b82f6' : '#16a34a'}`

          }} className="p-[1.25rem] rounded-[var(--radius-xl)]">
                            <div className="flex justify-space-between items-center mb-[0.75rem]">
                                <span className="text-[0.75rem] font-[700] text-[var(--color-text-muted)] uppercase">
                                    {limitVal.name}
                                </span>
                                <span style={{ color: key === 'oxygen' ? '#3b82f6' : '#16a34a' }} className="text-[0.7rem] font-[700]">
                                    {limitVal.unit}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-[0.5rem]">
                                <span className="text-[2.5rem] font-[900] text-[var(--color-text)]">
                                    {limitVal.min}
                                </span>
                                <span className="text-[1.5rem] font-[700] text-[var(--color-text-muted)]">
                                    - {limitVal.max}
                                </span>
                            </div>
                            {key === 'oxygen' &&
            <div className="mt-[0.75rem] text-[0.8rem] text-[var(--color-text-muted)]">
                                    <AlertCircle size={14} className="display-[inline] mr-[4px]" />
                                    Nivel normal: 20.9%
                                </div>
            }
                        </div>
          )}
                </div>
            </div>

            {/* Referencia rápida */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 className="m-[0_0_1rem_0] text-[1rem] font-[800]">
                    <AlertTriangle size={20} className="display-[inline] mr-[0.5rem]" />
                    Condiciones de Peligro Inmediato
                </h3>
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(200px,_1fr))] gap-[0.75rem]">
                    <DangerItem
            condition="Oxígeno < 19.5%"
            consequence="Hipoxia, pérdida de conciencia"
            color="#dc2626" />
          
                    <DangerItem
            condition="Oxígeno > 23.5%"
            consequence="Riesgo de incendio aumentado"
            color="#dc2626" />
          
                    <DangerItem
            condition="LEL > 10%"
            consequence="Atmósfera explosiva"
            color="#dc2626" />
          
                    <DangerItem
            condition="H2S > 10 ppm"
            consequence="Tóxico, olor a huevo podrido"
            color="#dc2626" />
          
                    <DangerItem
            condition="CO > 35 ppm"
            consequence="Veneno silencioso, sin olor"
            color="#dc2626" />
          
                </div>
            </div>
        </div>);

}

function DangerItem({ condition, consequence, color }) {
  return (
    <div style={{

      background: `${color}10`,
      border: `1px solid ${color}30`

    }} className="p-[0.75rem] rounded-[var(--radius-lg)]">
            <div style={{ color }} className="text-[0.85rem] font-[800] mb-[0.25rem]">
                {condition}
            </div>
            <div className="text-[0.75rem] text-[var(--color-text-muted)]">
                {consequence}
            </div>
        </div>);

}



// Modal de Detalle
function PermitDetailModal({ permit, statusConfig, onClose, CONFINED_SPACE_TYPES, POTENTIAL_HAZARDS, EQUIPMENT_CHECKLIST, ROLES }) {
  const spaceType = CONFINED_SPACE_TYPES.find((t) => t.id === permit.spaceType);
  const isExpired = permit.validUntil && new Date(permit.validUntil) < new Date();

  return (
    <div className="modal-fullscreen-overlay" onClick={onClose}>
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





            }} className="w-[64px] h-[64px] rounded-[var(--radius-xl)] flex items-center justify-center text-[#fff]">
                            <Tent size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="m-0 text-2xl font-black">
                                {spaceType?.icon} {permit.spaceName}
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

                {/* Información del espacio */}
                <div className="mb-6">
                    <h3 className="text-sm font-extrabold mb-3 uppercase">
                        Información del Espacio
                    </h3>
                    <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                        <InfoDetail label="Tipo" value={spaceType?.name || '-'} />
                        <InfoDetail label="Departamento" value={permit.department || '-'} />
                        <InfoDetail label="Válido Desde" value={permit.validFrom ? new Date(permit.validFrom).toLocaleString() : '-'} />
                        <InfoDetail label="Válido Hasta" value={permit.validUntil ? new Date(permit.validUntil).toLocaleString() : '-'} />
                    </div>
                </div>

                {/* Peligros */}
                {permit.hazards?.length > 0 &&
        <div className="mb-6">
                        <h3 className="text-sm font-extrabold mb-3 uppercase">
                            Peligros Identificados
                        </h3>
                        <div className="flex flex-wrap gap-[0.5rem]">
                            {permit.hazards.map((hazardId) => {
              const hazard = POTENTIAL_HAZARDS.find((h) => h.id === hazardId);
              return (
                <span key={hazardId} className="p-[0.5rem_0.85rem] bg-[#fef2f2] border-[1px_solid_#fecaca] rounded-[var(--radius-full)] text-[0.8rem] font-[700] text-[#dc2626] flex items-center gap-[0.35rem]">










                  
                                        <span>{hazard?.icon}</span>
                                        {hazard?.name}
                                    </span>);

            })}
                        </div>
                    </div>
        }

                {/* Equipo */}
                <div className="mb-6">
                    <h3 className="text-sm font-extrabold mb-3 uppercase">
                        Equipamiento
                    </h3>
                    <div className="grid grid-template-columns-[repeat(3,_1fr)] gap-[0.5rem]">
                        {permit.equipment?.filter((e) => e.checked).map((equip) =>
            <span key={equip.id} className="p-[0.5rem] bg-[#f0fdf4] border-[1px_solid_#16a34a] rounded-[var(--radius-lg)] text-[0.8rem] font-[600] flex items-center gap-[0.35rem]">









              
                                <span>{equip.icon}</span>
                                {equip.name}
                            </span>
            )}
                    </div>
                </div>

                {/* Equipo de Trabajo */}
                <div className="mb-6">
                    <h3 className="text-sm font-extrabold mb-3 uppercase">
                        Equipo de Trabajo
                    </h3>
                    <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                        <div>
                            <div className="text-[0.7rem] font-[700] text-[var(--color-text-muted)] mb-[0.5rem]">
                                Entrantes ({permit.team?.entrants?.length || 0})
                            </div>
                            {permit.team?.entrants?.map((entrant, idx) =>
              <div key={idx} className="p-[0.5rem_0.75rem] bg-[#eff6ff] rounded-[var(--radius-md)] mb-[0.5rem] text-[0.9rem] font-[600]">






                
                                    <User size={14} className="display-[inline] mr-[6px]" />
                                    {entrant}
                                </div>
              )}
                        </div>
                        <div>
                            <RoleItem role={ROLES.find((r) => r.id === 'attendant')} name={permit.team?.attendant} />
                            <RoleItem role={ROLES.find((r) => r.id === 'supervisor')} name={permit.team?.supervisor} />
                            <RoleItem role={ROLES.find((r) => r.id === 'rescue')} name={permit.team?.rescue} />
                        </div>
                    </div>
                </div>

                {/* Lecturas atmosféricas */}
                {permit.atmosphericReadings?.length > 0 &&
        <div className="mb-6">
                        <h3 className="text-sm font-extrabold mb-3 uppercase">
                            Lecturas Atmosféricas ({permit.atmosphericReadings.length})
                        </h3>
                        <div className="flex flex-col gap-[0.5rem]">
                            {permit.atmosphericReadings.slice(-5).map((reading, idx) =>
            <div key={idx} style={{

              background: reading.status === 'safe' ? '#f0fdf4' : reading.status === 'warning' ? '#fffbeb' : '#fef2f2',
              border: `1px solid ${reading.status === 'safe' ? '#16a34a' : reading.status === 'warning' ? '#f59e0b' : '#dc2626'}`

            }} className="p-[0.75rem] rounded-[var(--radius-lg)]">
                                    <div className="flex justify-space-between mb-[0.5rem]">
                                        <span className="text-[0.75rem] font-[700]">
                                            {new Date(reading.timestamp).toLocaleString()}
                                        </span>
                                        <span style={{




                  background: reading.status === 'safe' ? '#16a34a' : reading.status === 'warning' ? '#f59e0b' : '#dc2626'

                }} className="text-[0.7rem] font-[800] p-[0.25rem_0.5rem] rounded-[var(--radius-full)] text-[#fff]">
                                            {reading.status === 'safe' ? 'SEGURO' : reading.status === 'warning' ? 'PRECAUCIÓN' : 'PELIGRO'}
                                        </span>
                                    </div>
                                    <div className="grid grid-template-columns-[repeat(4,_1fr)] gap-[0.5rem] text-[0.85rem]">
                                        <div>O₂: <strong>{reading.oxygen}%</strong></div>
                                        <div>LEL: <strong>{reading.lel}%</strong></div>
                                        <div>H₂S: <strong>{reading.h2s} ppm</strong></div>
                                        <div>CO: <strong>{reading.co} ppm</strong></div>
                                    </div>
                                </div>
            )}
                        </div>
                    </div>
        }

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
                            OSHA 1910.146
                        </h4>
                        <p className="m-[0] text-[0.8rem] text-[#92400e] line-height-[1.5]">
                            Permiso requerido para espacios confinados. Verificar atmósfera antes y durante la entrada.
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

function RoleItem({ role, name }) {
  if (!name) return null;
  return (
    <div style={{

      background: `${role?.color}15`,




      color: role?.color



    }} className="p-[0.5rem_0.75rem] rounded-[var(--radius-md)] mb-[0.5rem] text-[0.9rem] font-[600] flex items-center gap-[0.5rem]">
            <span>{role?.icon}</span>
            <div>
                <div className="text-[0.7rem] font-[700] opacity-[0.8]">{role?.name}</div>
                <div>{name}</div>
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

// Modal de Lectura Atmosférica
function AtmosphericReadingModal({ permit, onSave, onClose, limits }) {
  const [reading, setReading] = useState({
    oxygen: '',
    lel: '',
    h2s: '',
    co: ''
  });

  const handleSave = () => {
    onSave({
      oxygen: parseFloat(reading.oxygen) || 0,
      lel: parseFloat(reading.lel) || 0,
      h2s: parseFloat(reading.h2s) || 0,
      co: parseFloat(reading.co) || 0
    });
    onClose();
  };

  const getStatus = () => {
    const o2 = parseFloat(reading.oxygen);
    const l = parseFloat(reading.lel);
    const h = parseFloat(reading.h2s);
    const c = parseFloat(reading.co);

    if (!isNaN(o2) && (o2 < limits.oxygen.min || o2 > limits.oxygen.max)) return { status: 'danger', text: 'PELIGRO - OXÍGENO' };
    if (!isNaN(l) && l > limits.lel.max) return { status: 'danger', text: 'PELIGRO - LEL' };
    if (!isNaN(h) && h > limits.h2s.max) return { status: 'danger', text: 'PELIGRO - H2S' };
    if (!isNaN(c) && c > limits.co.max) return { status: 'danger', text: 'PELIGRO - CO' };

    if (!isNaN(o2) && o2 < 20.9) return { status: 'warning', text: 'PRECAUCIÓN' };
    if (!isNaN(l) && l > 0) return { status: 'warning', text: 'PRECAUCIÓN' };

    return { status: 'safe', text: 'SEGURO' };
  };

  const currentStatus = getStatus();

  return (
    <div className="modal-fullscreen-overlay" onClick={onClose}>
            <div
        className="card w-[100%] max-w-[500px] m-[auto]"





        onClick={(e) => e.stopPropagation()}>
        
                <div className="flex justify-space-between items-center mb-[1.5rem]">




          
                    <h2 className="m-[0] text-[1.25rem] font-[900]">
                        <Wind size={20} className="display-[inline] mr-[0.5rem]" />
                        Lectura Atmosférica
                    </h2>
                    <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
            
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Estado actual */}
                <div style={{

          background: currentStatus.status === 'safe' ? '#f0fdf4' : currentStatus.status === 'warning' ? '#fffbeb' : '#fef2f2',
          border: `2px solid ${currentStatus.status === 'safe' ? '#16a34a' : currentStatus.status === 'warning' ? '#f59e0b' : '#dc2626'}`



        }} className="p-[1rem] rounded-[var(--radius-xl)] mb-[1.5rem] text-center">
                    <div style={{


            color: currentStatus.status === 'safe' ? '#16a34a' : currentStatus.status === 'warning' ? '#f59e0b' : '#dc2626'
          }} className="text-[1.5rem] font-[900]">
                        {currentStatus.text}
                    </div>
                </div>

                {/* Campos de lectura */}
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[1.5rem]">
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">Oxígeno (O₂) %</label>
                        <input
              type="number"
              step="0.1"
              value={reading.oxygen}
              onChange={(e) => setReading({ ...reading, oxygen: e.target.value })}
              style={{
                ...inputStyle,
                background: reading.oxygen && (reading.oxygen < limits.oxygen.min || reading.oxygen > limits.oxygen.max) ? '#fef2f2' : 'var(--color-surface)',
                borderColor: reading.oxygen && (reading.oxygen < limits.oxygen.min || reading.oxygen > limits.oxygen.max) ? '#dc2626' : 'var(--color-input-border)'
              }}
              placeholder="20.9" />
            
                        <div className="text-[0.7rem] text-[var(--color-text-muted)] mt-[0.25rem]">
                            Rango: {limits.oxygen.min} - {limits.oxygen.max}%
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">LEL %</label>
                        <input
              type="number"
              step="0.1"
              value={reading.lel}
              onChange={(e) => setReading({ ...reading, lel: e.target.value })}
              style={{
                ...inputStyle,
                background: reading.lel && reading.lel > limits.lel.max ? '#fef2f2' : 'var(--color-surface)',
                borderColor: reading.lel && reading.lel > limits.lel.max ? '#dc2626' : 'var(--color-input-border)'
              }}
              placeholder="0" />
            
                        <div className="text-[0.7rem] text-[var(--color-text-muted)] mt-[0.25rem]">
                            Máx: {limits.lel.max}%
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">H₂S (ppm)</label>
                        <input
              type="number"
              step="0.1"
              value={reading.h2s}
              onChange={(e) => setReading({ ...reading, h2s: e.target.value })}
              style={{
                ...inputStyle,
                background: reading.h2s && reading.h2s > limits.h2s.max ? '#fef2f2' : 'var(--color-surface)',
                borderColor: reading.h2s && reading.h2s > limits.h2s.max ? '#dc2626' : 'var(--color-input-border)'
              }}
              placeholder="0" />
            
                        <div className="text-[0.7rem] text-[var(--color-text-muted)] mt-[0.25rem]">
                            Máx: {limits.h2s.max} ppm
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-400">CO (ppm)</label>
                        <input
              type="number"
              step="0.1"
              value={reading.co}
              onChange={(e) => setReading({ ...reading, co: e.target.value })}
              style={{
                ...inputStyle,
                background: reading.co && reading.co > limits.co.max ? '#fef2f2' : 'var(--color-surface)',
                borderColor: reading.co && reading.co > limits.co.max ? '#dc2626' : 'var(--color-input-border)'
              }}
              placeholder="0" />
            
                        <div className="text-[0.7rem] text-[var(--color-text-muted)] mt-[0.25rem]">
                            Máx: {limits.co.max} ppm
                        </div>
                    </div>
                </div>

                <div className="flex gap-[1rem]">


          
                    <button
            onClick={onClose}
            className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-slate-300 hover:bg-slate-700 transition-colors">
            
                        Cancelar
                    </button>
                    <button
            onClick={(e) => {e.preventDefault();handleSave();}}
            className="btn-primary flex-[1]">

            
                        Guardar Lectura
                    </button>
                </div>
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
  boxSizing: 'border-box' as const
};