import React, { useState, useEffect, useMemo } from 'react';
import {
  Siren, Shield, Plus, Search, Calendar, AlertTriangle,
  FileText, CheckCircle2, Users, Map, Edit3, Trash2,
  Eye, Share2, Download, Clock, Activity, AlertCircle, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import PremiumHeader from '../components/PremiumHeader';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import ConfirmModal from '../components/ConfirmModal';
import ShareModal from '../components/ShareModal';
import EvacuationPdfGenerator from '../components/EvacuationPdfGenerator';
import { downloadCSV } from '../services/exportCsv';
import toast from 'react-hot-toast';

export default function EmergencyPlan(): React.ReactElement | null {
  const { currentUser } = useAuth();
  const { syncCollection } = useSync();
  const [plans, setPlans] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    facility: '',
    lastUpdate: new Date().toISOString().split('T')[0],
    nextDrill: '',
    brigadeLeader: '',
    status: 'active',
    emergencyContacts: '',
    peopleCount: '50',
    exitWidth: '1.2',
    maxDistance: '30'
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const data = localStorage.getItem('ehs_emergency_plans');
    if (data) {
      try { setPlans(JSON.parse(data)); } catch (e) {}
    } else {
      // Seed default sample plans if empty
      const defaultPlans = [
        {
          id: 'EMP-101',
          title: 'Plan de Evacuación y Respuesta a Emergencias',
          facility: 'Planta Industrial Principal',
          lastUpdate: new Date().toISOString().split('T')[0],
          nextDrill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          brigadeLeader: 'Ing. Carlos Mendoza',
          status: 'active',
          emergencyContacts: 'Bomberos: 100 | Ambulancia: 107 | Defensa Civil: 103',
          peopleCount: '120',
          exitWidth: '2.4',
          maxDistance: '45'
        }
      ];
      setPlans(defaultPlans);
      localStorage.setItem('ehs_emergency_plans', JSON.stringify(defaultPlans));
    }
  }, []);

  const handleSave = () => {
    if (!formData.title || !formData.facility) {
      toast.error('Por favor complete el título y la instalación.');
      return;
    }

    const newRecord = {
      ...formData,
      id: formData.id || `EMP-${Date.now()}`
    };

    let updated;
    if (formData.id) {
      updated = plans.map((p) => (p.id === formData.id ? newRecord : p));
      toast.success('Plan de Emergencia actualizado correctamente');
    } else {
      updated = [newRecord, ...plans];
      toast.success('Plan de Emergencia registrado exitosamente');
    }

    setPlans(updated);
    localStorage.setItem('ehs_emergency_plans', JSON.stringify(updated));
    syncCollection('ehs_emergency_plans', updated);
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      facility: '',
      lastUpdate: new Date().toISOString().split('T')[0],
      nextDrill: '',
      brigadeLeader: '',
      status: 'active',
      emergencyContacts: '',
      peopleCount: '50',
      exitWidth: '1.2',
      maxDistance: '30'
    });
  };

  const executeDelete = () => {
    if (confirmModal.payload) {
      const updated = plans.filter((p) => p.id !== confirmModal.payload);
      setPlans(updated);
      localStorage.setItem('ehs_emergency_plans', JSON.stringify(updated));
      syncCollection('ehs_emergency_plans', updated);
      toast.success('Plan de emergencia eliminado correctamente');
    }
    setConfirmModal({ isOpen: false, payload: null });
  };

  const handleExportCSV = () => {
    const rows = filteredPlans.map((item) => ({
      'ID Plan': item.id || '',
      'Título del Plan': item.title || '',
      'Instalación / Sector': item.facility || '',
      'Líder de Brigada': item.brigadeLeader || '',
      'Estado': item.status === 'active' ? 'Vigente' : 'En Revisión',
      'Última Revisión': item.lastUpdate || '',
      'Próximo Simulacro': item.nextDrill || '',
      'Contactos de Emergencia': item.emergencyContacts || ''
    }));
    downloadCSV(rows, `Planes_Emergencia_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('📊 Planes de Emergencia exportados');
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const title = String(p.title || '').toLowerCase();
      const facility = String(p.facility || '').toLowerCase();
      const leader = String(p.brigadeLeader || '').toLowerCase();
      const term = String(searchTerm || '').toLowerCase();

      const matchesSearch = title.includes(term) || facility.includes(term) || leader.includes(term);
      if (!matchesSearch) return false;

      if (filterStatus === 'active') return p.status === 'active';
      if (filterStatus === 'review') return p.status === 'review';
      if (filterStatus === 'upcoming') {
        if (!p.nextDrill) return false;
        const drillDate = new Date(p.nextDrill).getTime();
        const now = Date.now();
        return drillDate >= now && drillDate <= now + 60 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [plans, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((p) => p.status === 'active').length;
    const review = plans.filter((p) => p.status === 'review').length;
    const upcomingDrills = plans.filter((p) => {
      if (!p.nextDrill) return false;
      const drillDate = new Date(p.nextDrill).getTime();
      return drillDate >= Date.now() && drillDate <= Date.now() + 60 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, active, review, upcomingDrills };
  }, [plans]);

  const columns = [
    {
      header: 'Título / Instalación',
      accessor: 'title',
      sortable: true,
      render: (item: any) => (
        <div>
          <div style={{ color: '#000000', fontWeight: '900', fontSize: '14px', lineHeight: '1.2' }}>
            {item.title}
          </div>
          <div style={{ color: '#1e293b', fontWeight: '800', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Map size={12} className="text-amber-500" /> {item.facility}
          </div>
        </div>
      )
    },
    {
      header: 'Última Revisión',
      accessor: 'lastUpdate',
      sortable: true,
      render: (item: any) => (
        <span style={{ color: '#000000', fontWeight: '800', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} className="text-blue-500" />
          {item.lastUpdate ? new Date(item.lastUpdate).toLocaleDateString('es-AR') : '-'}
        </span>
      )
    },
    {
      header: 'Líder de Brigada',
      accessor: 'brigadeLeader',
      render: (item: any) => (
        <span style={{ color: '#1e293b', fontWeight: '800', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Users size={13} className="text-purple-500" />
          {item.brigadeLeader || 'No asignado'}
        </span>
      )
    },
    {
      header: 'Próximo Simulacro',
      accessor: 'nextDrill',
      render: (item: any) => (
        <span style={{ color: item.nextDrill ? '#9333ea' : '#64748b', fontWeight: '900', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={13} />
          {item.nextDrill ? new Date(item.nextDrill).toLocaleDateString('es-AR') : 'Sin fecha'}
        </span>
      )
    },
    {
      header: 'Estado',
      accessor: 'status',
      render: (item: any) => {
        const isActive = item.status === 'active';
        return (
          <span style={{
            backgroundColor: isActive ? '#f0fdf4' : '#fffbeb',
            color: isActive ? '#15803d' : '#b45309',
            border: `1px solid ${isActive ? '#bbf7d0' : '#fde68a'}`,
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: '900',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isActive ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            {isActive ? 'Vigente' : 'En Revisión'}
          </span>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Botón Editar (Ámbar Sólido) */}
          <button
            onClick={() => {
              setFormData(item);
              setShowForm(true);
            }}
            title="Editar Plan de Emergencia"
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Edit3 size={12} /> Editar
          </button>

          {/* Botón Ver (Azul Sólido) */}
          <button
            onClick={() => setSelectedPlan(item)}
            title="Ver Detalle de Plan"
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={12} /> Ver
          </button>

          {/* Botón PDF / Compartir (Esmeralda Sólido) */}
          <button
            onClick={() => setShareItem(item)}
            title="Exportar PDF o Compartir"
            style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Share2 size={12} /> PDF
          </button>

          {/* Botón Eliminar (Rojo Sólido) */}
          <button
            onClick={() => setConfirmModal({ isOpen: true, payload: item.id })}
            title="Eliminar Plan"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Plan de Emergencia - ${shareItem?.title || ''}`}
          text={shareItem ? `🚨 Plan de Emergencias & Evacuación\n🏢 Instalación: ${shareItem.facility}\n👨‍🚒 Líder: ${shareItem.brigadeLeader}\n📅 Última Revisión: ${shareItem.lastUpdate}` : ''}
          rawMessage={shareItem ? `🚨 Plan de Emergencias & Evacuación\n🏢 Instalación: ${shareItem.facility}\n👨‍🚒 Líder: ${shareItem.brigadeLeader}\n📅 Última Revisión: ${shareItem.lastUpdate}` : ''}
          elementIdToPrint="pdf-content"
          fileName={`Plan_Emergencia_${shareItem?.facility || 'Documento'}.pdf`}
        />

        <div className="fixed left-0 opacity-0 top-0 pointer-events-none">
          {shareItem && <EvacuationPdfGenerator data={shareItem} />}
        </div>

        <PremiumHeader
          title="Planes de Emergencia y Evacuación"
          subtitle="Gestión de roles, brigadas de respuesta y cronograma de simulacros • Ley 19.587 / Res. 343/11"
          icon={<Siren size={36} color="#ffffff" />}
          color="linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)"
        />

        {/* Tarjetas resumen KPI Estilo Aptitudes Médicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => setFilterStatus('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
            }`}>
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Planes</span>
              <FileText size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          </div>

          <div
            onClick={() => setFilterStatus('active')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
            }`}>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Planes Vigentes</span>
              <CheckCircle2 size={18} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</div>
          </div>

          <div
            onClick={() => setFilterStatus('review')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'review'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
            }`}>
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">En Revisión</span>
              <AlertTriangle size={18} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.review}</div>
          </div>

          <div
            onClick={() => setFilterStatus('upcoming')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'upcoming'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-purple-400'
            }`}>
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Próximos Simulacros</span>
              <Clock size={18} />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.upcomingDrills}</div>
          </div>
        </div>

        {/* Toolbar de Acciones con Botones de Colores Vibrantes */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { id: 'all', label: 'Todos los Planes', bg: '#2563eb', activeBg: '#1d4ed8' },
              { id: 'active', label: '✅ Vigentes', bg: '#059669', activeBg: '#047857' },
              { id: 'review', label: '⏳ En Revisión', bg: '#d97706', activeBg: '#b45309' },
              { id: 'upcoming', label: '🚨 Próximos Simulacros', bg: '#9333ea', activeBg: '#7e22ce' }
            ].map((tab) => {
              const isSelected = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  style={{
                    backgroundColor: isSelected ? tab.activeBg : tab.bg,
                    color: '#ffffff',
                    boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 6px rgba(0,0,0,0.12)',
                    transform: isSelected ? 'scale(1.04)' : 'none',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}>
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none' }}
              className="px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors cursor-pointer">
              <Download size={16} /> Exportar Excel / CSV
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                resetForm();
                setShowForm(true);
              }}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
              className="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-emerald-700 transition-colors cursor-pointer">
              <Plus size={16} /> Nuevo Plan
            </button>
          </div>
        </div>

        {/* Modal Formulario de Alta / Edición */}
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700 mb-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Map className="text-red-500" /> {formData.id ? 'Editar Plan de Emergencia' : 'Nuevo Plan de Emergencia'}
                </h3>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Título del Plan</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Plan de Evacuación Sede Central"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Instalación / Sector</label>
                  <input
                    type="text"
                    value={formData.facility}
                    onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
                    placeholder="Ej: Planta Industrial N° 1"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Líder de Brigada</label>
                  <input
                    type="text"
                    value={formData.brigadeLeader}
                    onChange={(e) => setFormData({ ...formData, brigadeLeader: e.target.value })}
                    placeholder="Ej: Ing. Carlos Mendoza"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none">
                    <option value="active">Vigente</option>
                    <option value="review">En Revisión</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha de Última Revisión</label>
                  <input
                    type="date"
                    value={formData.lastUpdate}
                    onChange={(e) => setFormData({ ...formData, lastUpdate: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Próximo Simulacro</label>
                  <input
                    type="date"
                    value={formData.nextDrill}
                    onChange={(e) => setFormData({ ...formData, nextDrill: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contactos de Emergencia (Bomberos, Ambulancia, etc.)</label>
                  <textarea
                    value={formData.emergencyContacts}
                    onChange={(e) => setFormData({ ...formData, emergencyContacts: e.target.value })}
                    rows={2}
                    placeholder="Bomberos: 100 | Ambulancia: 107 | Defensa Civil: 103"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-extrabold text-xs transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{ backgroundColor: '#059669', color: '#ffffff' }}
                  className="flex-1 py-3 rounded-xl font-extrabold text-xs transition-colors shadow-md cursor-pointer hover:bg-emerald-700">
                  Guardar Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Visualización de Detalle */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-700 mb-4">
                <div>
                  <span className="text-xs font-black uppercase text-red-500 tracking-wider">Plan de Emergencias</span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white m-0">{selectedPlan.title}</h3>
                </div>
                <button onClick={() => setSelectedPlan(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block">Instalación / Sector</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedPlan.facility}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block">Líder de Brigada</span>
                    <span className="font-black text-slate-900 dark:text-white">{selectedPlan.brigadeLeader || 'No asignado'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block">Estado</span>
                    <span className={`font-black ${selectedPlan.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedPlan.status === 'active' ? '✅ Vigente' : '⏳ En Revisión'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block">Última Revisión</span>
                    <span className="font-black text-slate-900 dark:text-white">{selectedPlan.lastUpdate ? new Date(selectedPlan.lastUpdate).toLocaleDateString('es-AR') : '-'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block">Próximo Simulacro</span>
                    <span className="font-black text-purple-600">{selectedPlan.nextDrill ? new Date(selectedPlan.nextDrill).toLocaleDateString('es-AR') : 'Sin fecha'}</span>
                  </div>
                </div>
                {selectedPlan.emergencyContacts && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase block">Contactos de Emergencia</span>
                    <span className="font-bold text-red-900 dark:text-red-200">{selectedPlan.emergencyContacts}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-extrabold text-xs transition-colors cursor-pointer">
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const planToShare = selectedPlan;
                    setSelectedPlan(null);
                    setShareItem(planToShare);
                  }}
                  style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                  className="flex-1 py-3 rounded-xl font-extrabold text-xs transition-colors shadow-md cursor-pointer hover:bg-emerald-700 flex items-center justify-center gap-2">
                  <Share2 size={16} /> Exportar PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table Estilo Aptitudes Médicas */}
        {filteredPlans.length === 0 ? (
          <EmptyStateIllustrated
            title="Sin Planes de Emergencia"
            description="Comenzá a registrar los planes de emergencia, roles de brigada y simulacros organizacionales."
            icon={<Siren />}
          />
        ) : (
          <DataTable
            data={filteredPlans}
            columns={columns}
            searchPlaceholder="Buscar por título, instalación, líder de brigada..."
          />
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, payload: null })}
          onConfirm={executeDelete}
          title="¿Eliminar plan de emergencia?"
          message="Esta acción eliminará el plan de emergencia permanentemente."
          iconEmoji="🗑️"
        />
      </div>
    </AnimatedPage>
  );
}