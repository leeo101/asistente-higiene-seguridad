import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, AlertTriangle, ShieldCheck, Flame, HeartPulse, 
  FileText, Users, ArrowRight, Search, Clock, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export interface AlertItemUnified {
  id: string;
  module: 'extinguisher' | 'medical' | 'permit' | 'capa' | 'contractor';
  title: string;
  subtitle: string;
  categoryName: string;
  expirationDate: string;
  daysRemaining: number;
  status: 'expired' | 'warning' | 'ok';
  link: string;
}

export default function UnifiedAlertsHub(): React.ReactElement {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState<AlertItemUnified[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    loadAllAlerts();
  }, [currentUser]);

  const loadAllAlerts = () => {
    const collectedAlerts: AlertItemUnified[] = [];
    const now = new Date();

    // 1. Extintores / Matafuegos
    try {
      const extintores = JSON.parse(localStorage.getItem('extintores_db') || '[]');
      extintores.forEach((item: any) => {
        if (item.vencimientoCarga) {
          const expDate = new Date(item.vencimientoCarga);
          const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 30) {
            collectedAlerts.push({
              id: `ext-${item.id}`,
              module: 'extinguisher',
              title: `Extintor ${item.nroEquipo || item.tipo || 'Matafuego'}`,
              subtitle: `Ubicación: ${item.ubicacion || item.sector || 'Planta'} — Patente/Nº: ${item.nroEquipo || 'S/N'}`,
              categoryName: 'Matafuegos',
              expirationDate: item.vencimientoCarga,
              daysRemaining: diffDays,
              status: diffDays < 0 ? 'expired' : 'warning',
              link: '/extintores'
            });
          }
        }
      });
    } catch (e) {
      console.warn("Error cargando alertas de extintores", e);
    }

    // 2. Aptitudes Médicas
    try {
      const medical = JSON.parse(localStorage.getItem('medical_aptitudes_db') || '[]');
      medical.forEach((item: any) => {
        if (item.expirationDate) {
          const expDate = new Date(item.expirationDate);
          const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 30) {
            collectedAlerts.push({
              id: `med-${item.id}`,
              module: 'medical',
              title: `Aptitud Médica: ${item.workerName || 'Empleado'}`,
              subtitle: `DNI: ${item.workerDni || '-'} | Puesto: ${item.jobPosition || '-'}`,
              categoryName: 'Aptitud Médica',
              expirationDate: item.expirationDate,
              daysRemaining: diffDays,
              status: diffDays < 0 ? 'expired' : 'warning',
              link: '/medical'
            });
          }
        }
      });
    } catch (e) {
      console.warn("Error cargando alertas médicas", e);
    }

    // 3. CAPA / Acciones Correctivas
    try {
      const capas = JSON.parse(localStorage.getItem('capas_db') || '[]');
      capas.forEach((item: any) => {
        if (item.targetDate && item.status !== 'completed') {
          const expDate = new Date(item.targetDate);
          const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 15) {
            collectedAlerts.push({
              id: `capa-${item.id}`,
              module: 'capa',
              title: `CAPA: ${item.title || 'Acción Correctiva'}`,
              subtitle: `Origen: ${item.origin || 'Auditoría'} | Responsable: ${item.responsible || 'Asignado'}`,
              categoryName: 'Acciones CAPA',
              expirationDate: item.targetDate,
              daysRemaining: diffDays,
              status: diffDays < 0 ? 'expired' : 'warning',
              link: '/capa'
            });
          }
        }
      });
    } catch (e) {
      console.warn("Error cargando alertas CAPA", e);
    }

    // 4. Permisos de Trabajo Crítico
    try {
      const permits = JSON.parse(localStorage.getItem('work_permits_db') || '[]');
      permits.forEach((item: any) => {
        if (item.fechaVencimiento || item.fecha) {
          const expDate = new Date(item.fechaVencimiento || item.fecha);
          const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 7) {
            collectedAlerts.push({
              id: `permit-${item.id}`,
              module: 'permit',
              title: `Permiso de Trabajo: ${item.tipoPermiso || item.obra || 'Tarea Crítica'}`,
              subtitle: `Empresa: ${item.empresa || '-'} | Ubicación: ${item.obra || '-'}`,
              categoryName: 'Permisos',
              expirationDate: item.fechaVencimiento || item.fecha,
              daysRemaining: diffDays,
              status: diffDays < 0 ? 'expired' : 'warning',
              link: '/permits-history'
            });
          }
        }
      });
    } catch (e) {
      console.warn("Error cargando alertas de permisos", e);
    }

    // Ordenar por urgencia (vencidos primero, luego menor cantidad de días)
    collectedAlerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
    setAlerts(collectedAlerts);
  };

  const expiredCount = alerts.filter(a => a.daysRemaining < 0).length;
  const warningCount = alerts.filter(a => a.daysRemaining >= 0 && a.daysRemaining <= 30).length;

  const filteredAlerts = alerts.filter(alert => {
    const matchesTab = activeTab === 'all' || alert.module === activeTab;
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="mb-8 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-md relative overflow-hidden transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 shrink-0">
            <Bell size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-xl font-black text-slate-900 dark:text-slate-100">
                Centro Unificado de Alertas y Vencimientos
              </h2>
              {expiredCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500 text-white animate-bounce">
                  {expiredCount} VENCIDOS
                </span>
              )}
            </div>
            <p className="m-0 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Monitoreo predictivo de recargas, aptitudes médicas, permisos y acciones en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllAlerts}
            title="Actualizar Alertas"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer border-none transition-colors">
            <RefreshCw size={16} />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs cursor-pointer border-none transition-colors">
            {isCollapsed ? 'Ver Panel (' + alerts.length + ')' : 'Contraer'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase text-red-600 dark:text-red-400 tracking-wider">Vencidos Críticos</div>
                <div className="text-2xl font-black text-red-600 dark:text-red-400">{expiredCount} <span className="text-xs font-normal">elementos</span></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase text-amber-600 dark:text-amber-400 tracking-wider">Vencen ≤ 30 Días</div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{warningCount} <span className="text-xs font-normal">elementos</span></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Total Registrados</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{alerts.length} <span className="text-xs font-normal">alertas activas</span></div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex gap-1.5 overflow-x-auto pb-1 slim-scrollbar max-w-full">
              {[
                { id: 'all', label: 'Todas las Alertas', icon: <Bell size={14} /> },
                { id: 'extinguisher', label: 'Matafuegos', icon: <Flame size={14} /> },
                { id: 'medical', label: 'Aptitudes Médicas', icon: <HeartPulse size={14} /> },
                { id: 'capa', label: 'CAPA', icon: <CheckCircle2 size={14} /> },
                { id: 'permit', label: 'Permisos', icon: <FileText size={14} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    backgroundColor: activeTab === tab.id ? '#2563eb' : undefined,
                    color: activeTab === tab.id ? '#ffffff' : undefined
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer border-none flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'shadow-md shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por equipo, persona..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Alert List */}
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <ShieldCheck size={40} className="mx-auto text-emerald-500 mb-2 opacity-80" />
              <h4 className="m-0 text-sm font-extrabold text-slate-800 dark:text-slate-200">¡Todo en Orden!</h4>
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400 mt-1">
                No hay alertas ni vencimientos pendientes bajo el criterio seleccionado.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1 slim-scrollbar">
              {filteredAlerts.map(item => {
                const isExpired = item.daysRemaining < 0;
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:shadow-sm ${
                      isExpired
                        ? 'bg-red-500/5 border-red-500/20 dark:bg-red-950/20'
                        : 'bg-amber-500/5 border-amber-500/20 dark:bg-amber-950/20'
                    }`}>
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isExpired ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {item.module === 'extinguisher' && <Flame size={20} />}
                        {item.module === 'medical' && <HeartPulse size={20} />}
                        {item.module === 'capa' && <CheckCircle2 size={20} />}
                        {item.module === 'permit' && <FileText size={20} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isExpired ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {isExpired ? `VENCIDO HACE ${Math.abs(item.daysRemaining)} DÍAS` : `VENCE EN ${item.daysRemaining} DÍAS`}
                          </span>
                        </div>
                        <p className="m-0 text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(item.link)}
                      style={{
                        backgroundColor: isExpired ? '#dc2626' : '#d97706',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 14px',
                        fontSize: '11px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        boxShadow: isExpired ? '0 2px 6px rgba(220, 38, 38, 0.3)' : '0 2px 6px rgba(217, 119, 6, 0.3)'
                      }}>
                      Gestionar <ArrowRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
