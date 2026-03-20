import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Shield, ShieldAlert, CheckCircle,
  AlertTriangle, Calendar, Users, FileText, HardHat, Flame,
  ClipboardList, Eye, Activity, Award, Clock, Target, Zap,
  BarChart3, PieChart as PieChartIcon, RefreshCw, Download, Filter, LucideIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { User } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import Breadcrumbs from '../components/Breadcrumbs';
import toast from 'react-hot-toast';

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
  <div
    className="stagger-item"
    style={{ animationDelay: delay }}
  >
    <div style={{
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.3rem 0.6rem',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.2)',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
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
    loadDashboardData();
    const timeout = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timeout);
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
      const ats = safeParse('ats_history');
      const trainings = safeParse('training_history');
      const permits = safeParse('work_permits_history');
      const inspections = safeParse('inspections_history');
      const riskMatrices = safeParse('risk_matrix_history');
      const aiCamera = safeParse('ai_camera_history');

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Días sin accidentes
      const lastAccident = accidents.length > 0
        ? new Date(Math.max(...accidents.map(a => new Date(a.date || a.createdAt || 0).getTime())))
        : null;
      const daysWithoutAccidents = lastAccident
        ? Math.floor((new Date().getTime() - lastAccident.getTime()) / (1000 * 60 * 60 * 24))
        : 365;

      // Tasa de accidentabilidad
      const accidentsThisMonth = accidents.filter(a => {
        const d = new Date(a.date || a.createdAt || 0);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;

      const accidentsLastMonth = accidents.filter(a => {
        const d = new Date(a.date || a.createdAt || 0);
        return d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear;
      }).length;

      const accidentRate = accidentsThisMonth * 100;
      const accidentTrend = accidentsLastMonth > 0
        ? ((accidentsThisMonth - accidentsLastMonth) / accidentsLastMonth) * 100
        : 0;

      // Cumplimiento de capacitaciones
      const totalTrainings = trainings.length;
      const completedTrainings = trainings.filter(t => t.status === 'completed' || t.completed).length;
      const trainingCompletion = totalTrainings > 0
        ? Math.round((completedTrainings / totalTrainings) * 100)
        : 0;

      // Cumplimiento de EPP
      const totalDetections = aiCamera.length;
      const compliantDetections = aiCamera.filter(a => a.ppeComplete === true).length;
      const ppeCompliance = totalDetections > 0
        ? Math.round((compliantDetections / totalDetections) * 100)
        : 100;

      // Permisos activos
      const activePermits = permits.filter(p => {
        const endDate = new Date(p.endDate || 0);
        return endDate > new Date();
      }).length;

      // Inspecciones completadas
      const inspectionsCompleted = inspections.filter(i => {
        const d = new Date(i.date || 0);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;

      // Estado de matriz de riesgos
      const riskMatrixStatus = {
        low: riskMatrices.filter(m => m.riskLevel === 'low' || m.riskLevel === 'bajo').length,
        medium: riskMatrices.filter(m => m.riskLevel === 'medium' || m.riskLevel === 'medio').length,
        high: riskMatrices.filter(m => m.riskLevel === 'high' || m.riskLevel === 'alto').length,
        critical: riskMatrices.filter(m => m.riskLevel === 'critical' || m.riskLevel === 'crítico').length
      };

      // Estadísticas mensuales
      const monthlyStats: MonthlyStat[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthName = date.toLocaleDateString('es-AR', { month: 'short' });

        const monthAccidents = accidents.filter(a => {
          const d = new Date(a.date || a.createdAt || 0);
          return d.getMonth() === month && d.getFullYear() === year;
        }).length;

        const monthInspections = inspections.filter(i => {
          const d = new Date(i.date || 0);
          return d.getMonth() === month && d.getFullYear() === year;
        }).length;

        const monthTrainings = trainings.filter(t => {
          const d = new Date(t.date || t.createdAt || 0);
          return d.getMonth() === month && d.getFullYear() === year;
        }).length;

        monthlyStats.push({
          month: monthName,
          accidents: monthAccidents,
          inspections: monthInspections,
          trainings: monthTrainings
        });
      }

      setKpis({
        accidentRate,
        accidentTrend,
        complianceRate: 0,
        trainingCompletion,
        ppeCompliance,
        activePermits,
        daysWithoutAccidents,
        inspectionsCompleted,
        riskMatrixStatus,
        monthlyStats,
        topRisks: [],
        alerts: []
      });
    } catch (error) {
      console.error('[DASHBOARD] Error loading data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
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

      {/* Profile Completion Banner */}
      <ProfileCompletionBanner />

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <KPICard
          icon={ShieldAlert}
          title="Tasa de Accidentes"
          value={kpis.accidentRate.toFixed(1)}
          trend={kpis.accidentTrend}
          gradient={CARD_GRADIENTS.red}
          delay="0.1s"
        />
        <KPICard
          icon={CheckCircle}
          title="Cumplimiento Capacitaciones"
          value={`${kpis.trainingCompletion}%`}
          gradient={CARD_GRADIENTS.green}
          delay="0.2s"
        />
        <KPICard
          icon={HardHat}
          title="Cumplimiento EPP"
          value={`${kpis.ppeCompliance}%`}
          gradient={CARD_GRADIENTS.blue}
          delay="0.3s"
        />
        <KPICard
          icon={Clock}
          title="Días sin Accidentes"
          value={kpis.daysWithoutAccidents}
          gradient={CARD_GRADIENTS.purple}
          delay="0.4s"
        />
        <KPICard
          icon={ClipboardList}
          title="Permisos Activos"
          value={kpis.activePermits}
          gradient={CARD_GRADIENTS.orange}
          delay="0.5s"
        />
        <KPICard
          icon={Eye}
          title="Inspecciones este Mes"
          value={kpis.inspectionsCompleted}
          gradient={CARD_GRADIENTS.cyan}
          delay="0.6s"
        />
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Monthly Stats Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
            Estadísticas Mensuales
          </h3>
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
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
            Estado de Matrices de Riesgo
          </h3>
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
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
          Actividad Reciente
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
