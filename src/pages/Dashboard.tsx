import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  TrendUp, TrendDown, Shield, ShieldWarning, CheckCircle,
  Warning as AlertTriangle, CalendarBlank as Calendar, Users, FileText, HardHat, Fire as Flame, Leaf,
  ClipboardText as ClipboardList, Eye, Pulse as Activity, Trophy as Award, Clock, Target, Lightning as Zap,
  ChartBar as BarChart3, ChartPieSlice as PieChartIcon, ArrowsClockwise as RefreshCw, DownloadSimple as Download, Funnel as Filter,
  WarningCircle as AlertCircle, Icon } from
'@phosphor-icons/react';
import AnimatedPage from '../components/AnimatedPage';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { User } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import Breadcrumbs from '../components/Breadcrumbs';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import DailyNewsWidget from '../components/DailyNewsWidget';
import DailyAIInsight from '../components/DailyAIInsight';
import { Heartbeat } from '@phosphor-icons/react';


// Tipos
interface KPIData {
  accidentRate: number;
  accidentTrend: number;
  complianceRate: number;
  trainingCompletion: number;
  ppeCompliance: number;
  activePermits: number;
  daysWithoutAccidents: number;
  inspectionsCompleted: number;
  riskMatrixStatus: Record<string, number>;
  monthlyStats: MonthlyStat[];
  topRisks: RiskItem[];
  alerts: AlertItem[];
  indiceFrecuencia: number;
  indiceGravedad: number;
}

interface MonthlyStat {
  month: string;
  accidents: number;
  inspections: number;
  trainings: number;
}

interface RiskItem {
  name: string;
  level: string;
  category: string;
}

interface AlertItem {
  id: string;
  type: string;
  message: string;
  date: string;
}

interface KPICardProps {
  icon: Icon;
  title: string;
  value: string | number;
  trend?: number;
  gradient: string;
  delay: string;
}

interface HistoryItem {
  id: string;
  date?: string;
  fecha?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface CombinedWorkItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  type: string;
}

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  grad: string;
  key: string;
}

const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6'
};

const CARD_GRADIENTS = {
  blue: 'linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(37, 99, 235, 0.85) 100%)',
  green: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(5, 150, 105, 0.85) 100%)',
  orange: 'linear-gradient(135deg, rgba(245, 158, 11, 0.85) 0%, rgba(217, 119, 6, 0.85) 100%)',
  red: 'linear-gradient(135deg, rgba(239, 68, 68, 0.85) 0%, rgba(220, 38, 38, 0.85) 100%)',
  purple: 'linear-gradient(135deg, rgba(139, 92, 246, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%)',
  cyan: 'linear-gradient(135deg, rgba(6, 182, 212, 0.85) 0%, rgba(8, 145, 178, 0.85) 100%)'
};

const KPICard: React.FC<KPICardProps> = ({ icon: Icon, title, value, trend, gradient, delay }) =>
<div className="stagger-item" style={{ animationDelay: delay }}>
    <div
    className="p-6 rounded-3xl text-white shadow-xl backdrop-blur-md border border-white/20 transition-all duration-300 transform will-change-transform hover:-translate-y-1.5 hover:shadow-2xl"
    style={{ background: gradient }}>
    
      <div className="flex items-center justify-between mb-4">
        <Icon size={28} className="opacity-90" />
        {trend !== undefined &&
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/25 text-xs font-bold">
            {trend >= 0 ? <TrendUp weight="bold" size={14} /> : <TrendDown weight="bold" size={14} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
      }
      </div>
      <div className="text-sm font-medium opacity-90 mb-2">{title}</div>
      <div className="text-4xl font-black leading-none tracking-tight">{value}</div>
    </div>
  </div>;


// Skeleton loader for KPI cards
const KPISkeleton: React.FC = () =>
<div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden relative shadow-sm">
    <div className="flex justify-between mb-4">
      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
      <div className="w-16 h-6 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
    </div>
    <div className="w-3/5 h-3.5 mb-2 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
    <div className="w-2/5 h-9 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
  </div>;


// Skeleton for full chart card
const ChartSkeleton: React.FC = () =>
<div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
    <div className="w-5/12 h-5 mb-6 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
    {[40, 70, 55, 85, 60, 75].map((h, i) =>
  <div key={i} className="flex items-end gap-2 mb-2">
        <div style={{ width: `${h}%` }} className="h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
  )}
  </div>;


// Animated counter for days without accidents
const AnimatedCounter: React.FC<{value: number;}> = ({ value }) => {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const duration = 1200;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
        if (value >= 30) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 9999
          });
        }
      } else
      setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  const label = value >= 180 ? '🏆 Excelente' : value >= 30 ? '⚠️ Atención' : '🚨 Riesgo';
  return (
    <div className="text-center">
      <div className="text-6xl font-black leading-none tracking-tighter drop-shadow-md">{display}</div>
      <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/25 text-xs font-extrabold tracking-wide uppercase">
        {label}
      </div>
    </div>);

};

export default function Dashboard(): React.ReactElement {
  const navigate = useNavigate();
  const { currentUser } = useAuth() as {currentUser: User | null;};
  const { syncPulse } = useSync();

  const [kpis, setKpis] = useState<KPIData>({
    accidentRate: 0,
    accidentTrend: 0,
    complianceRate: 0,
    trainingCompletion: 0,
    ppeCompliance: 0,
    activePermits: 0,
    daysWithoutAccidents: 0,
    inspectionsCompleted: 0,
    riskMatrixStatus: {},
    monthlyStats: [],
    topRisks: [],
    alerts: [],
    indiceFrecuencia: 0,
    indiceGravedad: 0
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    setLoading(true);
    loadDashboardData();
    return () => window.removeEventListener('resize', handleResize);
  }, [syncPulse, selectedPeriod]);

  const loadDashboardData = (): void => {
    try {
      const safeParse = (key: string): HistoryItem[] => {
        try {
          return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
          console.error(`[DASHBOARD] Error parsing ${key}:`, e);
          return [];
        }
      };

      const accidents = safeParse('accident_history');
      const trainings = safeParse('training_history');
      const permits = safeParse('work_permits_history');
      const inspections = safeParse('inspections_history');
      const riskMatrices = safeParse('risk_matrix_history');
      const aiCamera = safeParse('ai_camera_history');
      const ehsKpis = safeParse('ehs_kpi_data');
      const medicalAptitudes = safeParse('ehs_medical_db');

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Period filter helper
      const inPeriod = (dateVal: unknown): boolean => {
        const d = new Date(dateVal as string || 0);
        if (selectedPeriod === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= weekAgo;
        }
        if (selectedPeriod === 'quarter') {
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          return d >= quarterAgo;
        }
        // default: month
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      };

      // Días sin accidentes
      const lastAccident = accidents.length > 0 ?
      new Date(Math.max(...accidents.map((a) => new Date(a.date as string || a.createdAt as string || 0).getTime()))) :
      null;
      const daysWithoutAccidents = lastAccident ?
      Math.floor((now.getTime() - lastAccident.getTime()) / (1000 * 60 * 60 * 24)) :
      365;

      // Tasa de accidentabilidad (period-filtered)
      const accidentsThisPeriod = accidents.filter((a) => inPeriod(a.date || a.createdAt)).length;
      const accidentsLastMonth = accidents.filter((a) => {
        const d = new Date(a.date as string || a.createdAt as string || 0);
        return d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear;
      }).length;
      const accidentRate = accidentsThisPeriod * 100;
      const accidentTrend = accidentsLastMonth > 0 ?
      (accidentsThisPeriod - accidentsLastMonth) / accidentsLastMonth * 100 :
      0;

      // Official KPIs
      let indiceFrecuencia = 0;
      let indiceGravedad = 0;
      if (ehsKpis && ehsKpis.length > 0) {
        // Sort by period
        const sorted = [...ehsKpis].sort((a: any, b: any) => a.period.localeCompare(b.period));
        const latestKpi = sorted[sorted.length - 1] as any;

        const horas = latestKpi.horasTrabajadas || 0;
        const conBaja = latestKpi.accidentesConBaja || 0;
        const sinBaja = latestKpi.accidentesSinBaja || 0;
        const dias = latestKpi.diasPerdidos || 0;
        const total = conBaja + sinBaja;

        indiceFrecuencia = horas > 0 ? parseFloat((total * 1_000_000 / horas).toFixed(2)) : 0;
        indiceGravedad = horas > 0 ? parseFloat((dias * 1_000 / horas).toFixed(2)) : 0;
      }

      // Cumplimiento de capacitaciones
      const totalTrainings = trainings.length;
      const completedTrainings = trainings.filter((t) => t.status === 'completed' || t.completed).length;
      const trainingCompletion = totalTrainings > 0 ? Math.round(completedTrainings / totalTrainings * 100) : 0;

      // Cumplimiento de EPP
      const totalDetections = aiCamera.length;
      const compliantDetections = aiCamera.filter((a) => a.ppeComplete === true).length;
      const ppeCompliance = totalDetections > 0 ? Math.round(compliantDetections / totalDetections * 100) : 100;

      // Permisos activos
      const activePermits = permits.filter((p) => new Date(p.endDate as string | number || 0) > now).length;

      // Inspecciones completadas (period-filtered)
      const inspectionsCompleted = inspections.filter((i) => inPeriod(i.date)).length;

      // Top riesgos críticos
      const topRisks = riskMatrices.
      filter((m) => ['high', 'alto', 'critical', 'crítico'].includes(m.riskLevel as string)).
      slice(0, 5).
      map((m) => ({
        name: (m.process || m.task || 'Riesgo sin nombre') as string,
        level: (m.riskLevel || 'Alto') as string,
        category: (m.category || 'General') as string
      }));

      // Alertas
      const alerts: AlertItem[] = [];
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      permits.forEach((p) => {
        const endDate = new Date(p.endDate as string || 0);
        if (endDate > now && endDate < threeDaysLater) {
          alerts.push({ id: `permit-${p.id}`, type: 'warning', message: `Permiso de trabajo #${p.id} vence pronto`, date: endDate.toLocaleDateString('es-AR') });
        }
      });
      trainings.filter((t) => t.status === 'pending' || !t.completed).forEach((t) => {
        alerts.push({ id: `training-${t.id}`, type: 'info', message: `Capacitación pendiente: ${t.title || t.name}`, date: new Date(t.date as string || 0).toLocaleDateString('es-AR') });
      });
      medicalAptitudes.forEach((m: any) => {
        const expDate = new Date(m.expirationDate as string || 0);
        if (expDate > now && expDate < thirtyDaysLater) {
          alerts.push({ id: `medical-${m.id}`, type: 'warning', message: `Aptitud Médica de ${m.workerName} vence pronto`, date: expDate.toLocaleDateString('es-AR') });
        } else if (expDate < now) {
          alerts.push({ id: `medical-${m.id}`, type: 'danger', message: `Aptitud Médica de ${m.workerName} VENCIDA`, date: expDate.toLocaleDateString('es-AR') });
        }
      });

      const complianceRate = Math.round((trainingCompletion + ppeCompliance) / 2);

      const riskMatrixStatus = {
        low: riskMatrices.filter((m) => ['low', 'bajo'].includes(m.riskLevel as string)).length,
        medium: riskMatrices.filter((m) => ['medium', 'medio'].includes(m.riskLevel as string)).length,
        high: riskMatrices.filter((m) => ['high', 'alto'].includes(m.riskLevel as string)).length,
        critical: riskMatrices.filter((m) => ['critical', 'crítico'].includes(m.riskLevel as string)).length
      };

      // Monthly stats — # of slots depends on period
      const numSlots = selectedPeriod === 'week' ? 7 : selectedPeriod === 'quarter' ? 12 : 6;
      const monthlyStats: MonthlyStat[] = [];
      for (let i = numSlots - 1; i >= 0; i--) {
        const date = selectedPeriod === 'week' ?
        new Date(now.getTime() - i * 24 * 60 * 60 * 1000) :
        new Date(currentYear, currentMonth - i, 1);
        const slotMonth = date.getMonth();
        const slotYear = date.getFullYear();
        const label = selectedPeriod === 'week' ?
        date.toLocaleDateString('es-AR', { weekday: 'short' }) :
        date.toLocaleDateString('es-AR', { month: 'short' });

        const slotFilter = (d: Date) => selectedPeriod === 'week' ?
        d.toDateString() === date.toDateString() :
        d.getMonth() === slotMonth && d.getFullYear() === slotYear;

        monthlyStats.push({
          month: label,
          accidents: accidents.filter((a) => slotFilter(new Date(a.date as string || a.createdAt as string || 0))).length,
          inspections: inspections.filter((a) => slotFilter(new Date(a.date as string || 0))).length,
          trainings: trainings.filter((a) => slotFilter(new Date(a.date as string || a.createdAt as string || 0))).length
        });
      }

      setKpis({ accidentRate, accidentTrend, complianceRate, trainingCompletion, ppeCompliance, activePermits, daysWithoutAccidents, inspectionsCompleted, riskMatrixStatus, monthlyStats, topRisks, alerts, indiceFrecuencia, indiceGravedad });
      setLoading(false);
    } catch (error) {
      console.error('[DASHBOARD] Error loading data:', error);
      setLoading(false);
    }
  };

  // Loading state is now inline (skeleton) — no full-page spinner needed

  return (
    <AnimatedPage>
      <div className={`container mx-auto px-4 ${isMobile ? 'pt-28 pb-12' : 'pt-24 pb-12'}`}>
        <Breadcrumbs />

      {/* ── Header ── */}
      <div className={`mb-8 flex ${isMobile ? 'flex-col items-stretch' : 'flex-row items-center justify-between'} gap-4`}>
        <div>
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-black text-slate-900 dark:text-white m-0 mb-1 leading-tight tracking-tight`}>
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 m-0 font-medium">
            Vista general de tu sistema de gestión
          </p>
        </div>

        {/* Action buttons */}
        <div className={`flex gap-3 ${isMobile ? 'w-full' : 'w-auto items-stretch'}`}>
          {/* Export button */}
          <button
              onClick={() => window.print()}
              className={`flex-1 sm:flex-none h-11 px-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-blue-500 hover:text-blue-500`}>
              
            <Download size={17} weight="bold" />
            <span>Exportar</span>
          </button>

          {/* Monthly Report button */}
          <button
              onClick={() => navigate('/management-report')}
              className={`flex-1 sm:flex-none h-11 px-5 bg-gradient-to-br from-blue-500 to-indigo-500 border-none rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 hover:brightness-110`}>
              
            <FileText size={17} weight="bold" />
            <span>{isMobile ? 'Reporte' : 'Reporte Mensual'}</span>
          </button>
        </div>
      </div>
      {/* ── / Header ── */}

      {/* Salud del Sistema & IA Insight */}
      {!loading &&
        <div className="mb-8 flex flex-col gap-6">
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-5'}`}>
            
            {/* Health Score Bar */}
            <div className={`p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm flex flex-col justify-center ${isMobile ? 'col-span-1' : 'col-span-2'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="m-0 text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Heartbeat size={24} weight="fill" className={kpis.complianceRate > 85 ? 'text-green-500' : kpis.complianceRate > 60 ? 'text-yellow-500' : 'text-red-500'} />
                  Salud del Sistema
                </h3>
                <span className={`text-2xl font-black ${kpis.complianceRate > 85 ? 'text-green-500' : kpis.complianceRate > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {kpis.complianceRate}%
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${kpis.complianceRate > 85 ? 'bg-green-500' : kpis.complianceRate > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${kpis.complianceRate}%` }} />
                
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                Basado en cumplimiento de EPP, capacitaciones e incidentes.
              </p>
            </div>

            {/* Daily AI Insight */}
            <div className={`${isMobile ? 'col-span-1' : 'col-span-3'}`}>
                <DailyAIInsight
                healthScore={kpis.complianceRate}
                alertsCount={kpis.alerts.length}
                criticalRisksCount={kpis.riskMatrixStatus.critical || 0} />
              
            </div>
          </div>
        </div>
        }

      
      {/* 🚀 Accesos Rápidos */}
      <div className="mb-8">
        <h3 className="m-0 mb-4 text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Zap size={20} className="text-blue-500" /> Accesos Rápidos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => navigate('/accident-investigation')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-red-500 transition-all group">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} weight="fill" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Investigación</span>
          </button>
          
          <button onClick={() => navigate('/environmental-incidents')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-green-500 transition-all group">
            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Leaf size={24} weight="fill" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Ambientales</span>
          </button>

          <button onClick={() => navigate('/ppe-tracker')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all group">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HardHat size={24} weight="fill" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Control EPP</span>
          </button>

          <button onClick={() => navigate('/capa-manager')} className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-500 transition-all group">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList size={24} weight="fill" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Sistema CAPA</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5 mb-8">
        {loading ?
          <> {[...Array(7)].map((_, i) => <KPISkeleton key={i} />)} </> :

          <>
            <KPICard icon={Activity} title="Índice Frecuencia (IF)" value={kpis.indiceFrecuencia} trend={kpis.accidentTrend} gradient={CARD_GRADIENTS.red} delay="0.1s" />
            <KPICard icon={AlertTriangle} title="Índice Gravedad (IG)" value={kpis.indiceGravedad} gradient={CARD_GRADIENTS.orange} delay="0.1s" />
            <KPICard icon={Target} title="Tasa de Cumplimiento" value={`${kpis.complianceRate}%`} gradient={CARD_GRADIENTS.cyan} delay="0.2s" />
            <KPICard icon={CheckCircle} title="Cumplimiento Capacitaciones" value={`${kpis.trainingCompletion}%`} gradient={CARD_GRADIENTS.green} delay="0.2s" />
            <KPICard icon={HardHat} title="Cumplimiento EPP" value={`${kpis.ppeCompliance}%`} gradient={CARD_GRADIENTS.blue} delay="0.3s" />

            {/* Special: Animated days-without-accidents card */}
            <div className="stagger-item animation-delay-[0.4s]">
              <div
                className="p-6 rounded-[20px] text-white backdrop-blur-md border border-white/20 transition-all duration-300 text-center shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1.5" style={{ background: CARD_GRADIENTS.purple }}>
                <div className="flex items-center justify-center gap-[0.5rem] mb-[0.8rem] opacity-[0.9]">
                  <Clock size={22} />
                  <span className="text-[0.85rem] font-[700]">Días sin Accidentes</span>
                </div>
                <AnimatedCounter value={kpis.daysWithoutAccidents} />
              </div>
            </div>

            <KPICard icon={ClipboardList} title="Permisos Activos" value={kpis.activePermits} gradient={CARD_GRADIENTS.orange} delay="0.5s" />
            <KPICard icon={Eye} title="Inspecciones en el Período" value={kpis.inspectionsCompleted} gradient={CARD_GRADIENTS.cyan} delay="0.6s" />
          </>
        }
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-5 mb-8">

        {loading ? <><ChartSkeleton /><ChartSkeleton /></> : <>

        {/* Monthly Stats Chart */}
        <div className="card p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-[1.5rem] flex-wrap gap-[0.5rem]">
            <h3 className="m-[0] text-[1.1rem] font-[800] text-[var(--color-text)]">Estadísticas</h3>
            <div className="flex gap-[0.4rem]">
              {(['week', 'month', 'quarter'] as const).map((p) =>
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p)}
                    style={{



                      background: selectedPeriod === p ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: selectedPeriod === p ? '#fff' : 'var(--color-text-muted)'




                    }} className="p-[0.3rem_0.75rem] rounded-[20px] border-[1px_solid_var(--color-border)] font-[700] text-[0.75rem] cursor-pointer transition-[all_0.2s]">
                    
                  {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Trimestre'}
                </button>
                  )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={kpis.monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }} />
                  
              <Legend />
              <Area type="monotone" dataKey="accidents" stroke={CHART_COLORS.danger} fill={CHART_COLORS.danger} fillOpacity={0.2} name="Accidentes" />
              <Area type="monotone" dataKey="inspections" stroke={CHART_COLORS.success} fill={CHART_COLORS.success} fillOpacity={0.2} name="Inspecciones" />
              <Area type="monotone" dataKey="trainings" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.2} name="Capacitaciones" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Matrix Status */}
        <div className="card p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm">
          <h3 className="m-[0_0_1.5rem] text-[1.1rem] font-[800] text-[var(--color-text)]">Estado de Matrices de Riesgo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                    data={[
                    { name: 'Bajo', value: kpis.riskMatrixStatus.low || 0 },
                    { name: 'Medio', value: kpis.riskMatrixStatus.medium || 0 },
                    { name: 'Alto', value: kpis.riskMatrixStatus.high || 0 },
                    { name: 'Crítico', value: kpis.riskMatrixStatus.critical || 0 }]
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value">
                    
                <Cell fill={CHART_COLORS.success} />
                <Cell fill={CHART_COLORS.warning} />
                <Cell fill={CHART_COLORS.danger} />
                <Cell fill={CHART_COLORS.purple} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        </>}
      </div>

      {/* Top Risks & Alerts */}
      <div className={`grid gap-6 mb-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {/* Top Risks */}
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm">
          <h3 className="m-0 mb-6 text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" /> Principales Riesgos
          </h3>
          <div className="flex flex-col gap-3">
            {kpis.topRisks.length > 0 ?
              kpis.topRisks.map((risk, i) =>
              <div key={i} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{risk.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{risk.category}</div>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-red-500 text-white text-[10px] font-black uppercase tracking-wider">
                    {risk.level}
                  </div>
                </div>
              ) :

              <p className="text-center p-4 text-slate-500 dark:text-slate-400 text-sm">No se detectan riesgos críticos</p>
              }
          </div>
        </div>

        {/* Alerts */}
        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm">
          <h3 className="m-0 mb-6 text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Zap size={20} className="text-yellow-500" /> Alertas y Notificaciones
          </h3>
          <div className="flex flex-col gap-3">
            {kpis.alerts.length > 0 ?
              kpis.alerts.map((alert) =>
              <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-xl border ${alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30'}`}>
                  <div className={`mt-0.5 ${alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`}>
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{alert.message}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Para el: {alert.date}</div>
                  </div>
                </div>
              ) :

              <p className="text-center p-4 text-slate-500 dark:text-slate-400 text-sm">Sin alertas pendientes</p>
              }
          </div>
        </div>

        {/* Novedades Normativas Dinámicas */}
        <DailyNewsWidget />
      </div>

      {/* Recent Activity */}
      <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm">
        <h3 className="m-0 mb-6 text-lg font-extrabold text-slate-800 dark:text-slate-100">
          Resumen de Actividad
        </h3>
        <div className="flex flex-col gap-4">
          {kpis.monthlyStats.length > 0 ?
            kpis.monthlyStats.slice(-5).reverse().map((stat, index) =>
            <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <BarChart3 size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{stat.month}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {stat.accidents} accidentes • {stat.inspections} inspecciones • {stat.trainings} capacitaciones
                  </div>
                </div>
              </div>
            ) :

            <div className="text-center p-8 text-slate-500 dark:text-slate-400">
              <Activity size={48} className="opacity-20 mb-4 mx-auto" />
              <p>No hay actividad reciente</p>
            </div>
            }
        </div>
      </div>
      
      </div>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </AnimatedPage>);

}