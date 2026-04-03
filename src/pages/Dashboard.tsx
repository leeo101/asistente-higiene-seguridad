import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Shield, ShieldAlert, CheckCircle,
  AlertTriangle, Calendar, Users, FileText, HardHat, Flame,
  ClipboardList, Eye, Activity, Award, Clock, Target, Zap,
  BarChart3, PieChart as PieChartIcon, RefreshCw, Download, Filter, LucideIcon,
  AlertCircle, BookOpen
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { User } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import Breadcrumbs from '../components/Breadcrumbs';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

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
  icon: LucideIcon;
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
  blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  orange: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  cyan: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'  
};

const KPICard: React.FC<KPICardProps> = ({ icon: Icon, title, value, trend, gradient, delay }) => (
  <div className="stagger-item" style={{ animationDelay: delay }}>
    <div
      style={{
        padding: '1.5rem',
        borderRadius: '20px',
        background: gradient,
        color: '#ffffff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Icon size={28} opacity={0.9} />
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontWeight: 700 }}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{value}</div>
    </div>
  </div>
);

// Skeleton loader for KPI cards
const KPISkeleton: React.FC = () => (
  <div style={{ padding: '1.5rem', borderRadius: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', overflow: 'hidden', position: 'relative' }}>
    <style>{`
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .shimmer-line {
        background: var(--color-border);
        border-radius: 8px;
        overflow: hidden;
        position: relative;
      }
      .shimmer-line::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
        animation: shimmer 1.4s infinite;
      }
    `}</style>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div className="shimmer-line" style={{ width: 32, height: 32, borderRadius: '8px' }} />
      <div className="shimmer-line" style={{ width: 56, height: 24, borderRadius: '20px' }} />
    </div>
    <div className="shimmer-line" style={{ width: '60%', height: 14, marginBottom: '0.5rem' }} />
    <div className="shimmer-line" style={{ width: '40%', height: 36 }} />
  </div>
);

// Skeleton for full chart card
const ChartSkeleton: React.FC = () => (
  <div className="card" style={{ padding: '1.5rem' }}>
    <div className="shimmer-line" style={{ width: '45%', height: 20, marginBottom: '1.5rem', borderRadius: '8px', background: 'var(--color-border)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', animation: 'shimmer 1.4s infinite' }} />
    </div>
    {[40, 70, 55, 85, 60, 75].map((h, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ width: `${h}%`, height: 12, borderRadius: 8, background: 'var(--color-border)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', animation: `shimmer 1.4s ${i * 0.1}s infinite` }} />
        </div>
      </div>
    ))}
  </div>
);

// Animated counter for days without accidents
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
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
      }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  const color = value >= 180 ? '#10b981' : value >= 30 ? '#f59e0b' : '#ef4444';
  const label = value >= 180 ? '🏆 Excelente' : value >= 30 ? '⚠️ Atención' : '🚨 Riesgo';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>{display}</div>
      <div style={{ marginTop: '0.3rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.8rem', borderRadius: '20px', background: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  );
};

export default function Dashboard(): React.ReactElement {
  const navigate = useNavigate();
  const { currentUser } = useAuth() as { currentUser: User | null };
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
    alerts: []
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');

  useEffect(() => {
    setLoading(true);
    loadDashboardData();
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

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Period filter helper
      const inPeriod = (dateVal: unknown): boolean => {
        const d = new Date((dateVal as string) || 0);
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
      const lastAccident = accidents.length > 0
        ? new Date(Math.max(...accidents.map(a => new Date(a.date as string || a.createdAt as string || 0).getTime())))
        : null;
      const daysWithoutAccidents = lastAccident
        ? Math.floor((now.getTime() - lastAccident.getTime()) / (1000 * 60 * 60 * 24))
        : 365;

      // Tasa de accidentabilidad (period-filtered)
      const accidentsThisPeriod = accidents.filter(a => inPeriod(a.date || a.createdAt)).length;
      const accidentsLastMonth = accidents.filter(a => {
        const d = new Date(a.date as string || a.createdAt as string || 0);
        return d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear;
      }).length;
      const accidentRate = accidentsThisPeriod * 100;
      const accidentTrend = accidentsLastMonth > 0
        ? ((accidentsThisPeriod - accidentsLastMonth) / accidentsLastMonth) * 100
        : 0;

      // Cumplimiento de capacitaciones
      const totalTrainings = trainings.length;
      const completedTrainings = trainings.filter(t => t.status === 'completed' || t.completed).length;
      const trainingCompletion = totalTrainings > 0 ? Math.round((completedTrainings / totalTrainings) * 100) : 0;

      // Cumplimiento de EPP
      const totalDetections = aiCamera.length;
      const compliantDetections = aiCamera.filter(a => a.ppeComplete === true).length;
      const ppeCompliance = totalDetections > 0 ? Math.round((compliantDetections / totalDetections) * 100) : 100;

      // Permisos activos
      const activePermits = permits.filter(p => new Date((p.endDate as string | number) || 0) > now).length;

      // Inspecciones completadas (period-filtered)
      const inspectionsCompleted = inspections.filter(i => inPeriod(i.date)).length;

      // Top riesgos críticos
      const topRisks = riskMatrices
        .filter(m => ['high', 'alto', 'critical', 'crítico'].includes(m.riskLevel as string))
        .slice(0, 5)
        .map(m => ({
          name: (m.process || m.task || 'Riesgo sin nombre') as string,
          level: (m.riskLevel || 'Alto') as string,
          category: (m.category || 'General') as string
        }));

      // Alertas
      const alerts: AlertItem[] = [];
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      permits.forEach(p => {
        const endDate = new Date(p.endDate as string || 0);
        if (endDate > now && endDate < threeDaysLater) {
          alerts.push({ id: `permit-${p.id}`, type: 'warning', message: `Permiso de trabajo #${p.id} vence pronto`, date: endDate.toLocaleDateString() });
        }
      });
      trainings.filter(t => t.status === 'pending' || !t.completed).forEach(t => {
        alerts.push({ id: `training-${t.id}`, type: 'info', message: `Capacitación pendiente: ${t.title || t.name}`, date: new Date(t.date as string || 0).toLocaleDateString() });
      });

      const complianceRate = Math.round((trainingCompletion + ppeCompliance) / 2);

      const riskMatrixStatus = {
        low: riskMatrices.filter(m => ['low', 'bajo'].includes(m.riskLevel as string)).length,
        medium: riskMatrices.filter(m => ['medium', 'medio'].includes(m.riskLevel as string)).length,
        high: riskMatrices.filter(m => ['high', 'alto'].includes(m.riskLevel as string)).length,
        critical: riskMatrices.filter(m => ['critical', 'crítico'].includes(m.riskLevel as string)).length
      };

      // Monthly stats — # of slots depends on period
      const numSlots = selectedPeriod === 'week' ? 7 : selectedPeriod === 'quarter' ? 12 : 6;
      const monthlyStats: MonthlyStat[] = [];
      for (let i = numSlots - 1; i >= 0; i--) {
        const date = selectedPeriod === 'week'
          ? new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          : new Date(currentYear, currentMonth - i, 1);
        const slotMonth = date.getMonth();
        const slotYear = date.getFullYear();
        const label = selectedPeriod === 'week'
          ? date.toLocaleDateString('es-AR', { weekday: 'short' })
          : date.toLocaleDateString('es-AR', { month: 'short' });

        const slotFilter = (d: Date) => selectedPeriod === 'week'
          ? d.toDateString() === date.toDateString()
          : d.getMonth() === slotMonth && d.getFullYear() === slotYear;

        monthlyStats.push({
          month: label,
          accidents: accidents.filter(a => slotFilter(new Date(a.date as string || a.createdAt as string || 0))).length,
          inspections: inspections.filter(a => slotFilter(new Date(a.date as string || 0))).length,
          trainings: trainings.filter(a => slotFilter(new Date(a.date as string || a.createdAt as string || 0))).length
        });
      }

      setKpis({ accidentRate, accidentTrend, complianceRate, trainingCompletion, ppeCompliance, activePermits, daysWithoutAccidents, inspectionsCompleted, riskMatrixStatus, monthlyStats, topRisks, alerts });
      setLoading(false);
    } catch (error) {
      console.error('[DASHBOARD] Error loading data:', error);
      setLoading(false);
    }
  };

  // Loading state is now inline (skeleton) — no full-page spinner needed

  return (
    <div className="container" style={{ paddingTop: '6rem', paddingBottom: '3rem' }}>
      <Breadcrumbs />

      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, margin: '0 0 0.5rem', color: 'var(--color-text)' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Vista general de tu sistema de gestión
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button
            onClick={() => navigate('/reports')}
            style={{
              padding: '0.7rem 1.2rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Download size={18} /> Exportar
          </button>
          <button
            onClick={() => navigate('/management-report')}
            className="btn-primary"
            style={{
              padding: '0.7rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FileText size={18} /> Reporte Mensual
          </button>
        </div>
      </div>

      {/* Header */}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {loading ? (
          <> {[...Array(7)].map((_, i) => <KPISkeleton key={i} />)} </>
        ) : (
          <>
            <KPICard icon={Activity} title="Incidentes este Período" value={kpis.accidentRate} trend={kpis.accidentTrend} gradient={CARD_GRADIENTS.red} delay="0.1s" />
            <KPICard icon={Target} title="Tasa de Cumplimiento" value={`${kpis.complianceRate}%`} gradient={CARD_GRADIENTS.cyan} delay="0.2s" />
            <KPICard icon={CheckCircle} title="Cumplimiento Capacitaciones" value={`${kpis.trainingCompletion}%`} gradient={CARD_GRADIENTS.green} delay="0.2s" />
            <KPICard icon={HardHat} title="Cumplimiento EPP" value={`${kpis.ppeCompliance}%`} gradient={CARD_GRADIENTS.blue} delay="0.3s" />

            {/* Special: Animated days-without-accidents card */}
            <div className="stagger-item" style={{ animationDelay: '0.4s' }}>
              <div
                style={{ padding: '1.5rem', borderRadius: '20px', background: CARD_GRADIENTS.purple, color: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', textAlign: 'center' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.8rem', opacity: 0.9 }}>
                  <Clock size={22} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Días sin Accidentes</span>
                </div>
                <AnimatedCounter value={kpis.daysWithoutAccidents} />
              </div>
            </div>

            <KPICard icon={ClipboardList} title="Permisos Activos" value={kpis.activePermits} gradient={CARD_GRADIENTS.orange} delay="0.5s" />
            <KPICard icon={Eye} title="Inspecciones en el Período" value={kpis.inspectionsCompleted} gradient={CARD_GRADIENTS.cyan} delay="0.6s" />
          </>
        )}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {loading ? <><ChartSkeleton /><ChartSkeleton /></> : (<>

        {/* Monthly Stats Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>Estadísticas</h3>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['week', 'month', 'quarter'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid var(--color-border)',
                    background: selectedPeriod === p ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: selectedPeriod === p ? '#fff' : 'var(--color-text-muted)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Trimestre'}
                </button>
              ))}
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
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="accidents" stroke={CHART_COLORS.danger} fill={CHART_COLORS.danger} fillOpacity={0.2} name="Accidentes" />
              <Area type="monotone" dataKey="inspections" stroke={CHART_COLORS.success} fill={CHART_COLORS.success} fillOpacity={0.2} name="Inspecciones" />
              <Area type="monotone" dataKey="trainings" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.2} name="Capacitaciones" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Matrix Status */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>Estado de Matrices de Riesgo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Bajo', value: kpis.riskMatrixStatus.low || 0 },
                  { name: 'Medio', value: kpis.riskMatrixStatus.medium || 0 },
                  { name: 'Alto', value: kpis.riskMatrixStatus.high || 0 },
                  { name: 'Crítico', value: kpis.riskMatrixStatus.critical || 0 }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill={CHART_COLORS.success} />
                <Cell fill={CHART_COLORS.warning} />
                <Cell fill={CHART_COLORS.danger} />
                <Cell fill={CHART_COLORS.purple} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        </>)}
      </div>

      {/* Top Risks & Alerts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Top Risks */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={20} color="var(--color-danger)" /> Principales Riesgos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {kpis.topRisks.length > 0 ? (
              kpis.topRisks.map((risk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{risk.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{risk.category}</div>
                  </div>
                  <div style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {risk.level}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No se detectan riesgos críticos</p>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Zap size={20} color="var(--color-warning)" /> Alertas y Notificaciones
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {kpis.alerts.length > 0 ? (
              kpis.alerts.map((alert) => (
                <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', padding: '0.8rem', background: alert.type === 'warning' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', border: `1px solid ${alert.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)'}` }}>
                  <div style={{ color: alert.type === 'warning' ? '#f59e0b' : '#3b82f6', marginTop: '0.2rem' }}>
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{alert.message}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Para el: {alert.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Sin alertas pendientes</p>
            )}
          </div>
        </div>

        {/* Novedades Normativas */}
        <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid #8b5cf6' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookOpen size={20} color="#8b5cf6" /> Novedades Normativas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', padding: '0.8rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <div style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#8b5cf6', color: '#fff', fontSize: '0.65rem', fontWeight: 800, marginTop: '0.2rem' }}>2026</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Res. SRT 30/2023 (Estrés Térmico)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Reemplaza Res. 295/03. Nuevos VLA/VLE y requisitos de aclimatación aplicados.</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', padding: '0.8rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <div style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#8b5cf6', color: '#fff', fontSize: '0.65rem', fontWeight: 800, marginTop: '0.2rem' }}>2025</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Res. SIyC 18/25 (EPP)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Nuevo certificado AR y trazabilidad QR exigible. Módulo EPP actualizado.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', padding: '0.8rem', background: 'var(--color-background)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <div style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--color-text-muted)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, marginTop: '0.2rem' }}>2024</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Res. SRT 48/2025 y Anteriores</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Derogación protocolos COVID-19 y actualización de Baremo aprobadas.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
          Resumen de Actividad
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {kpis.monthlyStats.length > 0 ? (
            kpis.monthlyStats.slice(-5).reverse().map((stat, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--color-background)',
                  borderRadius: '12px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: CHART_COLORS.primary + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: CHART_COLORS.primary
                }}>
                  <BarChart3 size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                    {stat.month}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {stat.accidents} accidentes • {stat.inspections} inspecciones • {stat.trainings} capacitaciones
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
