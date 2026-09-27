import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Flame, Lightbulb, Zap,
  Speaker, FileText, HeartPulse, Clock, ArrowRight, Building2, CheckCircle2,
  Calendar, RefreshCw, ChevronRight, Filter
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';

export interface ExpirationItem {
  id: string;
  category: 'extintores' | 'iluminacion' | 'ruido' | 'pat' | 'rgrl' | 'medico' | 'capa' | 'permiso';
  categoryLabel: string;
  title: string;
  subtitle: string;
  empresa: string;
  expirationDate: string;
  daysRemaining: number;
  status: 'expired' | 'warning' | 'ok';
  actionUrl: string;
  actionLabel: string;
}

export default function CommandCenterDashboard(): React.ReactElement {
  const navigate = useNavigate();
  const { activeCompany, isAllCompanies } = useCompany();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'expired' | 'warning'>('all');

  const allExpirations = useMemo(() => {
    const list: ExpirationItem[] = [];
    const now = new Date();
    const safeParse = (key: string) => {
      try {
        return JSON.parse(localStorage.getItem(key) || '[]');
      } catch {
        return [];
      }
    };

    // Filter by activeCompany helper
    const matchesCompany = (empName?: string) => {
      if (isAllCompanies || !activeCompany) return true;
      if (!empName) return true;
      return empName.toLowerCase().includes(activeCompany.name.toLowerCase()) ||
        activeCompany.name.toLowerCase().includes(empName.toLowerCase());
    };

    // 1. Extintores
    const extintores = safeParse('extintores_db');
    extintores.forEach((ext: any) => {
      const emp = ext.empresa || ext.cliente || '';
      if (!matchesCompany(emp)) return;

      const dateStr = ext.vencimientoCarga || ext.fechaVencimiento;
      if (dateStr) {
        const expDate = new Date(dateStr);
        const days = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (days <= 45) {
          list.push({
            id: `ext-${ext.id || ext.nroEquipo}`,
            category: 'extintores',
            categoryLabel: 'Matafuegos / Extintores',
            title: `Extintor Nº ${ext.nroEquipo || ext.identificacion || 'S/N'} (${ext.tipo || 'ABC'})`,
            subtitle: `Ubicación: ${ext.ubicacion || ext.sector || 'Planta'}`,
            empresa: emp || 'General',
            expirationDate: dateStr,
            daysRemaining: days,
            status: days < 0 ? 'expired' : 'warning',
            actionUrl: '/extintores',
            actionLabel: 'Ver Extintores'
          });
        }
      }
    });

    // 2. Protocolos de Puesta a Tierra (Res. 900/15) — Vencimiento anual
    const patList = safeParse('grounding_protocols_db');
    patList.forEach((pat: any) => {
      const emp = pat.razonSocial || pat.empresa || '';
      if (!matchesCompany(emp)) return;

      const dateStr = pat.fechaVencimiento || (() => {
        if (!pat.fechaMedicion) return null;
        const d = new Date(pat.fechaMedicion);
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split('T')[0];
      })();

      if (dateStr) {
        const expDate = new Date(dateStr);
        const days = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (days <= 45) {
          list.push({
            id: `pat-${pat.id}`,
            category: 'pat',
            categoryLabel: 'Puesta a Tierra (Res. 900/15)',
            title: `Protocolo PAT: ${emp || 'Establecimiento'}`,
            subtitle: `${pat.establecimiento || pat.direccion || 'Medición anual'}`,
            empresa: emp || 'General',
            expirationDate: dateStr,
            daysRemaining: days,
            status: days < 0 ? 'expired' : 'warning',
            actionUrl: '/grounding',
            actionLabel: 'Renovar Medición'
          });
        }
      }
    });

    // 3. Protocolos de Iluminación (Res. 84/12) — Vencimiento anual
    const lightingList = safeParse('lighting_history');
    lightingList.forEach((luz: any) => {
      const emp = luz.empresa || luz.company || '';
      if (!matchesCompany(emp)) return;

      const baseDate = luz.fechaMedicion || luz.date || luz.createdAt;
      if (baseDate) {
        const expDate = new Date(baseDate);
        expDate.setFullYear(expDate.getFullYear() + 1);
        const dateStr = expDate.toISOString().split('T')[0];
        const days = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (days <= 45) {
          list.push({
            id: `luz-${luz.id}`,
            category: 'iluminacion',
            categoryLabel: 'Iluminación (Res. 84/12)',
            title: `Protocolo Luxometría: ${luz.establecimiento || emp || 'Planta'}`,
            subtitle: `Puntos ensayados: ${luz.puntos?.length || luz.measurements?.length || 1}`,
            empresa: emp || 'General',
            expirationDate: dateStr,
            daysRemaining: days,
            status: days < 0 ? 'expired' : 'warning',
            actionUrl: '/lighting',
            actionLabel: 'Nueva Medición'
          });
        }
      }
    });

    // 4. Protocolos de Ruido (Res. 85/12) — Vencimiento anual
    const noiseList = safeParse('noise_history') || safeParse('noise_protocols_db');
    noiseList.forEach((ruido: any) => {
      const emp = ruido.empresa || ruido.razonSocial || '';
      if (!matchesCompany(emp)) return;

      const baseDate = ruido.fechaMedicion || ruido.date || ruido.createdAt;
      if (baseDate) {
        const expDate = new Date(baseDate);
        expDate.setFullYear(expDate.getFullYear() + 1);
        const dateStr = expDate.toISOString().split('T')[0];
        const days = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (days <= 45) {
          list.push({
            id: `ruido-${ruido.id}`,
            category: 'ruido',
            categoryLabel: 'Ruido Laboral (Res. 85/12)',
            title: `Protocolo Acústico: ${emp || 'Sector'}`,
            subtitle: `Evaluación de NSCE / Dosis`,
            empresa: emp || 'General',
            expirationDate: dateStr,
            daysRemaining: days,
            status: days < 0 ? 'expired' : 'warning',
            actionUrl: '/noise-assessment',
            actionLabel: 'Actualizar Ruido'
          });
        }
      }
    });

    // 5. Aptitudes Médicas (Periódicos / Apto Calor Res. 30/23)
    const medicalList = safeParse('medical_aptitudes_db');
    medicalList.forEach((med: any) => {
      const emp = med.empresa || '';
      if (!matchesCompany(emp)) return;

      if (med.expirationDate) {
        const expDate = new Date(med.expirationDate);
        const days = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (days <= 45) {
          list.push({
            id: `med-${med.id}`,
            category: 'medico',
            categoryLabel: 'Salud Ocupacional',
            title: `Examen Periódico: ${med.workerName || 'Trabajador'}`,
            subtitle: `DNI: ${med.workerDni || '-'} | Puesto: ${med.jobPosition || '-'}`,
            empresa: emp || 'General',
            expirationDate: med.expirationDate,
            daysRemaining: days,
            status: days < 0 ? 'expired' : 'warning',
            actionUrl: '/medical',
            actionLabel: 'Ver Legajo'
          });
        }
      }
    });

    // 6. Acciones Correctivas CAPA
    const capas = safeParse('capas_db');
    capas.forEach((capa: any) => {
      const emp = capa.empresa || '';
      if (!matchesCompany(emp)) return;

      if (capa.targetDate && capa.status !== 'completed') {
        const expDate = new Date(capa.targetDate);
        const days = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (days <= 30) {
          list.push({
            id: `capa-${capa.id}`,
            category: 'capa',
            categoryLabel: 'Plan CAPA',
            title: `Medida de Adecuación: ${capa.title || 'Desvío pendiente'}`,
            subtitle: `Responsable: ${capa.responsible || 'Asignado'}`,
            empresa: emp || 'General',
            expirationDate: capa.targetDate,
            daysRemaining: days,
            status: days < 0 ? 'expired' : 'warning',
            actionUrl: '/capa',
            actionLabel: 'Gestionar CAPA'
          });
        }
      }
    });

    // Sort by urgency: most expired first
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [activeCompany, isAllCompanies]);

  const expiredCount = allExpirations.filter(e => e.daysRemaining < 0).length;
  const warningCount = allExpirations.filter(e => e.daysRemaining >= 0).length;

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'expired') return allExpirations.filter(e => e.daysRemaining < 0);
    if (selectedFilter === 'warning') return allExpirations.filter(e => e.daysRemaining >= 0);
    return allExpirations;
  }, [allExpirations, selectedFilter]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'extintores': return <Flame size={16} className="text-orange-500" />;
      case 'iluminacion': return <Lightbulb size={16} className="text-yellow-500" />;
      case 'ruido': return <Speaker size={16} className="text-blue-500" />;
      case 'pat': return <Zap size={16} className="text-amber-500" />;
      case 'medico': return <HeartPulse size={16} className="text-emerald-500" />;
      case 'capa': return <AlertTriangle size={16} className="text-rose-500" />;
      default: return <FileText size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 backdrop-blur-md shadow-2xl relative overflow-hidden mb-8">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-5 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <ShieldAlert size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white m-0 tracking-tight">
                Centro de Mando & Semáforo Legal de Vencimientos
              </h2>
              {activeCompany && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                  <Building2 size={12} /> {activeCompany.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">
              Vigilancia legal en tiempo real: Matafuegos, Protocolos SRT (Luz, Ruido, PAT), Salud y Planes CAPA.
            </p>
          </div>
        </div>

        {/* Global Traffic Light Badges */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto mt-2 sm:mt-0">
          <button
            type="button"
            onClick={() => setSelectedFilter(selectedFilter === 'expired' ? 'all' : 'expired')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              expiredCount > 0
                ? selectedFilter === 'expired'
                  ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            {expiredCount} Vencidos
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter(selectedFilter === 'warning' ? 'all' : 'warning')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              warningCount > 0
                ? selectedFilter === 'warning'
                  ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {warningCount} Próximos
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Todos ({allExpirations.length})
          </button>
        </div>
      </div>

      {/* Grid of Expiration Cards */}
      <div className="mt-5 relative z-10">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
              <ShieldCheck size={26} />
            </div>
            <h4 className="text-sm font-black text-white m-0">¡Todo al día y en regla legal!</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md m-0">
              No se detectaron protocolos legales ni extintores con plazos vencidos en la empresa seleccionada.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map(item => {
              const isExpired = item.daysRemaining < 0;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isExpired
                      ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/70 shadow-sm'
                      : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        {getCategoryIcon(item.category)}
                        {item.categoryLabel}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black rounded-md ${
                          isExpired
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isExpired
                          ? `Venció hace ${Math.abs(item.daysRemaining)} d`
                          : `Vence en ${item.daysRemaining} d`}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-white m-0 line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 m-0 line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                      <Calendar size={11} /> {item.expirationDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(item.actionUrl)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-blue-500/30"
                    >
                      {item.actionLabel}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
