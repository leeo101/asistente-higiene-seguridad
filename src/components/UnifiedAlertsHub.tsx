import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  ShieldCheck,
  Flame,
  HeartPulse,
  FileText,
  ArrowRight,
  Search,
  Clock,
  CheckCircle2,
  RefreshCw,
  QrCode,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export interface AlertItemUnified {
  id: string;
  module: 'extinguisher' | 'medical' | 'permit' | 'capa' | 'asset';
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
    now.setHours(0, 0, 0, 0);

    // 1. Extintores / Matafuegos (ambas claves usadas en el sistema)
    try {
      const ext1 = JSON.parse(localStorage.getItem('extintores_db') || '[]');
      const ext2 = JSON.parse(localStorage.getItem('extinguishers_inventory') || '[]');
      const combinedExt = [...(Array.isArray(ext1) ? ext1 : []), ...(Array.isArray(ext2) ? ext2 : [])];
      const seenExt = new Set<string>();

      combinedExt.forEach((item: any) => {
        const keyId = String(item.id || item.nroEquipo || item.chapa || Math.random());
        if (seenExt.has(keyId)) return;
        seenExt.add(keyId);

        const dateStr = item.vencimientoCarga || item.vencimiento;
        if (dateStr) {
          const expDate = new Date(dateStr);
          if (!isNaN(expDate.getTime())) {
            const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 30) {
              collectedAlerts.push({
                id: `ext-${keyId}`,
                module: 'extinguisher',
                title: `Extintor ${item.nroEquipo || item.chapa || item.tipo || 'Matafuego'}`,
                subtitle: `Ubicación: ${item.ubicacion || item.sector || 'Planta'} • Tipo: ${item.tipo || 'ABC'}`,
                categoryName: 'Matafuegos',
                expirationDate: String(dateStr).slice(0, 10),
                daysRemaining: diffDays,
                status: diffDays < 0 ? 'expired' : 'warning',
                link: '/extintores'
              });
            }
          }
        }
      });
    } catch (e) {
      console.warn('Error cargando alertas de extintores', e);
    }

    // 2. Aptitudes Médicas (ambas claves)
    try {
      const med1 = JSON.parse(localStorage.getItem('medical_aptitudes_db') || '[]');
      const med2 = JSON.parse(localStorage.getItem('ehs_medical_db') || '[]');
      const combinedMed = [...(Array.isArray(med1) ? med1 : []), ...(Array.isArray(med2) ? med2 : [])];
      const seenMed = new Set<string>();

      combinedMed.forEach((item: any) => {
        const keyId = String(item.id || item.workerDni || item.dni || item.workerName || Math.random());
        if (seenMed.has(keyId)) return;
        seenMed.add(keyId);

        if (item.expirationDate) {
          const expDate = new Date(item.expirationDate);
          if (!isNaN(expDate.getTime())) {
            const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 30) {
              collectedAlerts.push({
                id: `med-${keyId}`,
                module: 'medical',
                title: `Aptitud Médica: ${item.workerName || 'Trabajador'}`,
                subtitle: `DNI: ${item.workerDni || item.dni || '-'} • Puesto: ${item.jobPosition || item.position || '-'}`,
                categoryName: 'Aptitud Médica',
                expirationDate: String(item.expirationDate).slice(0, 10),
                daysRemaining: diffDays,
                status: diffDays < 0 ? 'expired' : 'warning',
                link: '/medical'
              });
            }
          }
        }
      });
    } catch (e) {
      console.warn('Error cargando alertas médicas', e);
    }

    // 3. CAPA / Acciones Correctivas
    try {
      const cap1 = JSON.parse(localStorage.getItem('capas_db') || '[]');
      const cap2 = JSON.parse(localStorage.getItem('ehs_capa_db') || '[]');
      const combinedCap = [...(Array.isArray(cap1) ? cap1 : []), ...(Array.isArray(cap2) ? cap2 : [])];
      const seenCap = new Set<string>();

      combinedCap.forEach((item: any) => {
        const keyId = String(item.id || item.title || Math.random());
        if (seenCap.has(keyId)) return;
        seenCap.add(keyId);

        const target = item.targetDate || item.vencimiento || item.fechaLimite;
        if (target && item.status !== 'completed' && item.status !== 'Cerrada') {
          const expDate = new Date(target);
          if (!isNaN(expDate.getTime())) {
            const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 15) {
              collectedAlerts.push({
                id: `capa-${keyId}`,
                module: 'capa',
                title: `CAPA: ${item.title || item.titulo || 'Acción Correctiva'}`,
                subtitle: `Responsable: ${item.responsible || item.responsable || 'Asignado'}`,
                categoryName: 'Acciones CAPA',
                expirationDate: String(target).slice(0, 10),
                daysRemaining: diffDays,
                status: diffDays < 0 ? 'expired' : 'warning',
                link: '/capa-manager'
              });
            }
          }
        }
      });
    } catch (e) {
      console.warn('Error cargando alertas CAPA', e);
    }

    // 4. Permisos de Trabajo Crítico
    try {
      const perm1 = JSON.parse(localStorage.getItem('work_permits_db') || '[]');
      const perm2 = JSON.parse(localStorage.getItem('work_permits_history') || '[]');
      const combinedPerm = [...(Array.isArray(perm1) ? perm1 : []), ...(Array.isArray(perm2) ? perm2 : [])];
      const seenPerm = new Set<string>();

      combinedPerm.forEach((item: any) => {
        const keyId = String(item.id || Math.random());
        if (seenPerm.has(keyId)) return;
        seenPerm.add(keyId);

        const dStr = item.fechaVencimiento || item.endDate || item.fecha;
        if (dStr) {
          const expDate = new Date(dStr);
          if (!isNaN(expDate.getTime())) {
            const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            if (diffDays >= -7 && diffDays <= 7) {
              collectedAlerts.push({
                id: `permit-${keyId}`,
                module: 'permit',
                title: `Permiso: ${item.tipoPermiso || item.workType || item.obra || 'Tarea Crítica'}`,
                subtitle: `Empresa/Sector: ${item.empresa || item.location || item.obra || '-'}`,
                categoryName: 'Permisos',
                expirationDate: String(dStr).slice(0, 10),
                daysRemaining: diffDays,
                status: diffDays < 0 ? 'expired' : 'warning',
                link: '/work-permit'
              });
            }
          }
        }
      });
    } catch (e) {
      console.warn('Error cargando alertas de permisos', e);
    }

    // 5. Activos QR con Mantenimiento Pendiente o Fuera de Servicio
    try {
      const assets = JSON.parse(localStorage.getItem('ehs_assets') || '[]');
      if (Array.isArray(assets)) {
        assets.forEach((a: any) => {
          if (a.status === 'Requiere Mantenimiento' || a.status === 'Fuera de Servicio') {
            const isOut = a.status === 'Fuera de Servicio';
            collectedAlerts.push({
              id: `ast-${a.id}`,
              module: 'asset',
              title: `${a.name} (${a.id})`,
              subtitle: `Ubicación: ${a.location} • Estado: ${a.status}`,
              categoryName: 'Activos QR',
              expirationDate: a.lastInspection || new Date().toISOString().slice(0, 10),
              daysRemaining: isOut ? -1 : 3,
              status: isOut ? 'expired' : 'warning',
              link: '/asset-scanner'
            });
          }
        });
      }
    } catch (e) {
      console.warn('Error cargando alertas de activos QR', e);
    }

    collectedAlerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
    setAlerts(collectedAlerts);
  };

  const expiredCount = alerts.filter((a) => a.daysRemaining < 0).length;
  const warningCount = alerts.filter((a) => a.daysRemaining >= 0 && a.daysRemaining <= 30).length;

  const filteredAlerts = alerts.filter((alert) => {
    const matchesTab = activeTab === 'all' || alert.module === activeTab;
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)'
      }}
      className="mb-6 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border shadow-sm relative overflow-hidden transition-all"
    >
      {/* Top Header */}
      <div
        style={{ borderColor: 'var(--color-border)' }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5 pb-4 border-b"
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)' }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
          >
            <Bell size={22} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="m-0 text-base sm:text-lg font-black" style={{ color: 'var(--color-text)' }}>
                Centro Unificado de Alertas y Vencimientos
              </h2>
              {expiredCount > 0 && (
                <span
                  style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide"
                >
                  {expiredCount} Críticos / Vencidos
                </span>
              )}
            </div>
            <p className="m-0 text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Monitoreo en tiempo real de extintores, aptitudes médicas, activos QR, permisos y acciones CAPA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={loadAllAlerts}
            title="Actualizar Alertas"
            style={{
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)',
              padding: '0.5rem 0.7rem',
              borderRadius: '0.75rem',
              borderWidth: '1px',
              borderStyle: 'solid',
              minHeight: 'unset'
            }}
            className="cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
          >
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)',
              padding: '0.5rem 0.9rem',
              borderRadius: '0.75rem',
              borderWidth: '1px',
              borderStyle: 'solid',
              minHeight: 'unset'
            }}
            className="font-black text-xs cursor-pointer hover:border-blue-500 transition-colors"
          >
            {isCollapsed ? `Expandir (${alerts.length})` : 'Contraer'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.25)'
              }}
              className="p-3.5 rounded-2xl border flex items-center gap-3"
            >
              <div
                style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#ef4444' }}>
                  Vencidos / Fuera de Servicio
                </div>
                <div className="text-xl font-black" style={{ color: '#ef4444' }}>
                  {expiredCount} <span className="text-xs font-semibold">ítems</span>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                borderColor: 'rgba(245, 158, 11, 0.25)'
              }}
              className="p-3.5 rounded-2xl border flex items-center gap-3"
            >
              <div
                style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              >
                <Clock size={20} />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#d97706' }}>
                  Atención Próxima (≤ 30d)
                </div>
                <div className="text-xl font-black" style={{ color: '#d97706' }}>
                  {warningCount} <span className="text-xs font-semibold">ítems</span>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderColor: 'rgba(16, 185, 129, 0.25)'
              }}
              className="p-3.5 rounded-2xl border flex items-center gap-3"
            >
              <div
                style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#10b981' }}>
                  Total Monitoreado
                </div>
                <div className="text-xl font-black" style={{ color: '#10b981' }}>
                  {alerts.length} <span className="text-xs font-semibold">alertas activas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'all', label: 'Todas', icon: <Bell size={14} /> },
                { id: 'asset', label: 'Activos QR', icon: <QrCode size={14} /> },
                { id: 'extinguisher', label: 'Matafuegos', icon: <Flame size={14} /> },
                { id: 'medical', label: 'Aptitudes Médicas', icon: <HeartPulse size={14} /> },
                { id: 'capa', label: 'CAPA', icon: <CheckCircle2 size={14} /> },
                { id: 'permit', label: 'Permisos', icon: <FileText size={14} /> }
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      backgroundColor: isSelected ? '#2563eb' : 'var(--color-background)',
                      color: isSelected ? '#ffffff' : 'var(--color-text)',
                      borderColor: isSelected ? '#2563eb' : 'var(--color-border)',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.75rem',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      minHeight: 'unset'
                    }}
                    className="text-xs font-black cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap"
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-64">
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                placeholder="Buscar alerta, equipo o sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '34px',
                  paddingRight: searchQuery ? '30px' : '12px',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  marginBottom: 0,
                  borderRadius: '0.75rem',
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
                className="border focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    minHeight: 'unset',
                    color: '#64748b',
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Alert List */}
          {filteredAlerts.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)'
              }}
              className="text-center py-8 px-4 rounded-2xl border border-dashed"
            >
              <ShieldCheck size={36} className="mx-auto text-emerald-500 mb-2" />
              <h4 className="m-0 text-sm font-black" style={{ color: 'var(--color-text)' }}>
                ¡Todo en Orden!
              </h4>
              <p className="m-0 text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                No hay alertas ni vencimientos pendientes bajo el filtro seleccionado.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredAlerts.map((item) => {
                const isExpired = item.daysRemaining < 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: isExpired ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                      borderColor: isExpired ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'
                    }}
                    className="p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <div
                        style={{
                          backgroundColor: isExpired ? '#ef4444' : '#f59e0b',
                          color: '#ffffff'
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      >
                        {item.module === 'extinguisher' && <Flame size={19} />}
                        {item.module === 'medical' && <HeartPulse size={19} />}
                        {item.module === 'capa' && <CheckCircle2 size={19} />}
                        {item.module === 'permit' && <FileText size={19} />}
                        {item.module === 'asset' && <QrCode size={19} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-black text-xs sm:text-sm truncate" style={{ color: 'var(--color-text)' }}>
                            {item.title}
                          </span>
                          <span
                            style={{
                              backgroundColor: isExpired ? '#dc2626' : '#d97706',
                              color: '#ffffff'
                            }}
                            className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider"
                          >
                            {item.module === 'asset'
                              ? isExpired
                                ? 'FUERA DE SERVICIO'
                                : 'MANTENIMIENTO'
                              : isExpired
                              ? `VENCIDO HACE ${Math.abs(item.daysRemaining)}D`
                              : `VENCE EN ${item.daysRemaining}D`}
                          </span>
                        </div>
                        <p className="m-0 text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(item.link)}
                      style={{
                        backgroundColor: isExpired ? '#dc2626' : '#d97706',
                        color: '#ffffff',
                        border: 'none',
                        padding: '7px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        borderRadius: '0.65rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        minHeight: 'unset'
                      }}
                      className="w-full sm:w-auto shrink-0"
                    >
                      Gestionar <ArrowRight size={13} />
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
