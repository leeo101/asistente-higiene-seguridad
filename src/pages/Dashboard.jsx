import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Shield, ShieldAlert, CheckCircle,
    AlertTriangle, Calendar, Users, FileText, HardHat, Flame,
    ClipboardList, Eye, Activity, Award, Clock, Target, Zap,
    BarChart3, PieChart as PieChartIcon, RefreshCw, Download, Filter
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import toast from 'react-hot-toast';

// Colores modernos para gráficos
const CHART_COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    purple: '#8b5cf6'
};

// Gradientes para tarjetas
const CARD_GRADIENTS = {
    blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    orange: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    cyan: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncPulse } = useSync();

    const [kpis, setKpis] = useState({
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

    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    useEffect(() => {
        loadDashboardData();
        // Timeout de seguridad para evitar loading infinito
        const timeout = setTimeout(() => setLoading(false), 3000);
        return () => clearTimeout(timeout);
    }, [syncPulse, selectedPeriod]);

    const loadDashboardData = () => {
        try {
            // Cargar datos de localStorage
            const accidents = JSON.parse(localStorage.getItem('accident_history') || '[]');
            const ats = JSON.parse(localStorage.getItem('ats_history') || '[]');
            const trainings = JSON.parse(localStorage.getItem('training_history') || '[]');
            const permits = JSON.parse(localStorage.getItem('work_permits_history') || '[]');
            const inspections = JSON.parse(localStorage.getItem('inspections_history') || '[]');
            const riskMatrices = JSON.parse(localStorage.getItem('risk_matrix_history') || '[]');
            const aiCamera = JSON.parse(localStorage.getItem('ai_camera_history') || '[]');

            // Calcular días sin accidentes
            const lastAccident = accidents.length > 0 
                ? new Date(Math.max(...accidents.map(a => new Date(a.date || a.createdAt))))
                : null;
            const daysWithoutAccidents = lastAccident 
                ? Math.floor((new Date() - lastAccident) / (1000 * 60 * 60 * 24))
                : 365; // Si no hay accidentes, mostrar 365

            // Calcular tasa de accidentabilidad (por cada 100 trabajadores)
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const accidentsThisMonth = accidents.filter(a => {
                const d = new Date(a.date || a.createdAt);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).length;
            
            const accidentsLastMonth = accidents.filter(a => {
                const d = new Date(a.date || a.createdAt);
                return d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear;
            }).length;

            const accidentRate = accidentsThisMonth * 100; // Asumiendo 100 trabajadores base
            const accidentTrend = accidentsLastMonth > 0 
                ? ((accidentsThisMonth - accidentsLastMonth) / accidentsLastMonth) * 100 
                : 0;

            // Calcular cumplimiento de capacitaciones
            const totalTrainings = trainings.length;
            const completedTrainings = trainings.filter(t => t.status === 'completed' || t.completed).length;
            const trainingCompletion = totalTrainings > 0 
                ? Math.round((completedTrainings / totalTrainings) * 100) 
                : 0;

            // Calcular cumplimiento de EPP (de IA Camera)
            const totalDetections = aiCamera.length;
            const compliantDetections = aiCamera.filter(a => a.ppeComplete === true).length;
            const ppeCompliance = totalDetections > 0 
                ? Math.round((compliantDetections / totalDetections) * 100) 
                : 100;

            // Permisos activos
            const activePermits = permits.filter(p => {
                const endDate = new Date(p.endDate);
                return endDate > new Date();
            }).length;

            // Inspecciones completadas este mes
            const inspectionsCompleted = inspections.filter(i => {
                const d = new Date(i.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).length;

            // Estado de matriz de riesgos
            const riskMatrixStatus = {
                low: riskMatrices.filter(m => m.riskLevel === 'low' || m.riskLevel === 'bajo').length,
                medium: riskMatrices.filter(m => m.riskLevel === 'medium' || m.riskLevel === 'medio').length,
                high: riskMatrices.filter(m => m.riskLevel === 'high' || m.riskLevel === 'alto').length,
                critical: riskMatrices.filter(m => m.riskLevel === 'critical' || m.riskLevel === 'crítico').length
            };

            // Estadísticas mensuales (últimos 6 meses)
            const monthlyStats = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(currentYear, currentMonth - i, 1);
                const month = date.getMonth();
                const year = date.getFullYear();
                const monthName = date.toLocaleDateString('es-AR', { month: 'short' });

                const monthAccidents = accidents.filter(a => {
                    const d = new Date(a.date || a.createdAt);
                    return d.getMonth() === month && d.getFullYear() === year;
                }).length;

                const monthInspections = inspections.filter(i => {
                    const d = new Date(i.date);
                    return d.getMonth() === month && d.getFullYear() === year;
                }).length;

                const monthATS = ats.filter(a => {
                    const d = new Date(a.fecha);
                    return d.getMonth() === month && d.getFullYear() === year;
                }).length;

                monthlyStats.push({
                    name: monthName,
                    accidentes: monthAccidents,
                    inspecciones: monthInspections,
                    ats: monthATS
                });
            }

            // Top riesgos identificados
            const allRisks = [];
            riskMatrices.forEach(m => {
                if (m.risks) {
                    m.risks.forEach(r => {
                        allRisks.push(typeof r === 'string' ? r : r.name || r.description);
                    });
                }
            });

            const riskCounts = {};
            allRisks.forEach(risk => {
                if (risk) {
                    const normalized = risk.toLowerCase();
                    riskCounts[normalized] = (riskCounts[normalized] || 0) + 1;
                }
            });

            const topRisks = Object.entries(riskCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));

            // Alertas
            const alerts = [];
            
            // Alerta: EPP bajo cumplimiento
            if (ppeCompliance < 80) {
                alerts.push({
                    type: 'warning',
                    title: 'Bajo cumplimiento de EPP',
                    message: `Solo ${ppeCompliance}% de cumplimiento detectado`,
                    icon: <AlertTriangle size={20} />
                });
            }

            // Alerta: Permisos por vencer
            const expiringPermits = permits.filter(p => {
                const endDate = new Date(p.endDate);
                const daysLeft = Math.floor((endDate - new Date()) / (1000 * 60 * 60 * 24));
                return daysLeft >= 0 && daysLeft <= 7;
            }).length;

            if (expiringPermits > 0) {
                alerts.push({
                    type: 'info',
                    title: 'Permisos por vencer',
                    message: `${expiringPermits} permiso(s) vence(n) en 7 días`,
                    icon: <Clock size={20} />
                });
            }

            // Alerta: Capacitaciones pendientes
            const pendingTrainings = trainings.filter(t => t.status === 'pending' || !t.completed).length;
            if (pendingTrainings > 0) {
                alerts.push({
                    type: 'info',
                    title: 'Capacitaciones pendientes',
                    message: `${pendingTrainings} capacitación(es) sin completar`,
                    icon: <Calendar size={20} />
                });
            }

            // Actualizar estado
            setKpis({
                accidentRate,
                accidentTrend,
                complianceRate: Math.round((inspectionsCompleted / Math.max(1, inspections.length)) * 100),
                trainingCompletion,
                ppeCompliance,
                activePermits,
                daysWithoutAccidents,
                inspectionsCompleted,
                riskMatrixStatus,
                monthlyStats,
                topRisks,
                alerts
            });

            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setLoading(false);
        }
    };

    const getTrendIcon = (value) => {
        if (value > 0) return <TrendingUp size={16} className="text-red-500" />;
        if (value < 0) return <TrendingDown size={16} className="text-green-500" />;
        return <Activity size={16} />;
    };

    const getTrendColor = (value, inverse = false) => {
        if (inverse) {
            return value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500';
        }
        return value > 0 ? 'text-red-500' : value < 0 ? 'text-green-500' : 'text-gray-500';
    };

    const getKPIColor = (value, type) => {
        if (type === 'percentage') {
            if (value >= 90) return 'text-green-500';
            if (value >= 70) return 'text-yellow-500';
            return 'text-red-500';
        }
        return 'text-blue-500';
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '60vh' 
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Activity size={48} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-transition" style={{ padding: '1rem', paddingTop: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Banner de bienvenida para nuevos usuarios */}
            <ProfileCompletionBanner />

            {/* Header */}
            <div style={{
                marginBottom: '2rem',
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                        fontWeight: 900,
                        margin: 0,
                        marginTop: '0.5rem',
                        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        Dashboard de Seguridad
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                        Métricas y KPIs en tiempo real
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['week', 'month', 'year'].map(period => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: selectedPeriod === period ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: selectedPeriod === period ? 'var(--color-primary)' : 'transparent',
                                color: selectedPeriod === period ? 'white' : 'var(--color-text)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards Principales */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                {/* Días sin accidentes */}
                <div className="card kpi-card" style={{
                    padding: 'clamp(1rem, 2vw, 1.25rem)',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                        <Calendar size={120} />
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                            <Shield size={20} />
                            <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontWeight: 600 }}>Días sin accidentes</span>
                        </div>
                        <div style={{ fontSize: 'clamp(2rem, 6vw, 2.5rem)', fontWeight: 900, lineHeight: 1 }}>
                            {kpis.daysWithoutAccidents}
                        </div>
                        <div style={{ fontSize: 'clamp(0.7rem, 2vw, 0.75rem)', marginTop: '0.5rem', opacity: 0.8 }}>
                            ¡Seguí así! 🎉
                        </div>
                    </div>
                </div>

                {/* Tasa de accidentabilidad */}
                <div className="card kpi-card" style={{
                    padding: 'clamp(1rem, 2vw, 1.25rem)',
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontWeight: 600 }}>
                        <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                        Tasa de accidentabilidad
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, color: getKPIColor(kpis.accidentRate, 'rate') }}>
                            {kpis.accidentRate.toFixed(1)}
                        </span>
                        <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.875rem)', color: 'var(--color-text-muted)' }}>por 100 trabajadores</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: 'clamp(0.7rem, 2vw, 0.75rem)', color: getTrendColor(kpis.accidentTrend) }}>
                        {getTrendIcon(kpis.accidentTrend)}
                        <span>{kpis.accidentTrend >= 0 ? '+' : ''}{kpis.accidentTrend.toFixed(1)}% vs mes anterior</span>
                    </div>
                </div>

                {/* Cumplimiento de EPP */}
                <div className="card kpi-card" style={{
                    padding: 'clamp(1rem, 2vw, 1.25rem)',
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontWeight: 600 }}>
                        <HardHat size={20} style={{ color: '#3b82f6' }} />
                        Cumplimiento de EPP
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, color: getKPIColor(kpis.ppeCompliance, 'percentage') }}>
                            {kpis.ppeCompliance}%
                        </span>
                    </div>
                    <div style={{ marginTop: '0.5rem', background: 'var(--color-background)', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${kpis.ppeCompliance}%`,
                            background: kpis.ppeCompliance >= 90 ? '#10b981' : kpis.ppeCompliance >= 70 ? '#eab308' : '#ef4444',
                            height: '100%',
                            transition: 'width 0.5s ease'
                        }} />
                    </div>
                </div>

                {/* Capacitaciones completadas */}
                <div className="card kpi-card" style={{
                    padding: 'clamp(1rem, 2vw, 1.25rem)',
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontWeight: 600 }}>
                        <Users size={20} style={{ color: '#8b5cf6' }} />
                        Capacitaciones
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, color: getKPIColor(kpis.trainingCompletion, 'percentage') }}>
                            {kpis.trainingCompletion}%
                        </span>
                        <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.875rem)', color: 'var(--color-text-muted)' }}>completadas</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', background: 'var(--color-background)', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${kpis.trainingCompletion}%`,
                            background: kpis.trainingCompletion >= 90 ? '#10b981' : kpis.trainingCompletion >= 70 ? '#eab308' : '#ef4444',
                            height: '100%',
                            transition: 'width 0.5s ease'
                        }} />
                    </div>
                </div>
            </div>

            {/* Secondary KPIs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <div className="card" style={{
                    padding: '1rem',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Permisos Activos
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2563eb' }}>
                        {kpis.activePermits}
                    </div>
                </div>

                <div className="card" style={{
                    padding: '1rem',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Inspecciones este mes
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#14b8a6' }}>
                        {kpis.inspectionsCompleted}
                    </div>
                </div>

                <div className="card" style={{
                    padding: '1rem',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Riesgos Críticos
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ef4444' }}>
                        {kpis.riskMatrixStatus.critical || 0}
                    </div>
                </div>

                <div className="card" style={{
                    padding: '1rem',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Alertas
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f97316' }}>
                        {kpis.alerts.length}
                    </div>
                </div>
            </div>

            {/* Gráficos y Alertas */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                {/* Gráfico de tendencia */}
                <div className="card" style={{
                    padding: 'clamp(1rem, 2vw, 1.25rem)',
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', fontWeight: 800, color: 'var(--color-text)' }}>
                        Tendencia Mensual
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={kpis.monthlyStats}>
                            <defs>
                                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorInsp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
                            <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                            <Tooltip 
                                contentStyle={{ 
                                    background: 'var(--color-surface)', 
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    color: 'var(--color-text)'
                                }} 
                            />
                            <Legend />
                            <Area type="monotone" dataKey="accidentes" stroke="#ef4444" fillOpacity={1} fill="url(#colorAcc)" />
                            <Area type="monotone" dataKey="inspecciones" stroke="#14b8a6" fillOpacity={1} fill="url(#colorInsp)" />
                            <Area type="monotone" dataKey="ats" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInsp)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Alertas */}
                <div className="card" style={{
                    padding: 'clamp(1rem, 2vw, 1.25rem)',
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', fontWeight: 800, color: 'var(--color-text)' }}>
                        Alertas y Notificaciones
                    </h3>
                    {kpis.alerts.length === 0 ? (
                        <div style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: 'var(--color-text-muted)'
                        }}>
                            <CheckCircle size={48} style={{ margin: '0 auto 1rem', color: '#10b981' }} />
                            <p>¡Todo en orden! No hay alertas pendientes.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {kpis.alerts.map((alert, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        background: alert.type === 'warning' ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.1)',
                                        border: `1px solid ${alert.type === 'warning' ? 'rgba(239,68,68,0.3)' : 'rgba(37,99,235,0.3)'}`,
                                        display: 'flex',
                                        gap: '0.75rem',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <div style={{ color: alert.type === 'warning' ? '#ef4444' : '#3b82f6', flexShrink: 0 }}>
                                        {alert.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 'clamp(0.85rem, 2vw, 0.9rem)', marginBottom: '0.25rem', color: 'var(--color-text)' }}>
                                            {alert.title}
                                        </div>
                                        <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.8rem)', color: 'var(--color-text-muted)' }}>
                                            {alert.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Riesgos */}
            {kpis.topRisks.length > 0 && (
                <div className="card" style={{
                    padding: 'clamp(1rem, 2vw, 1.25rem)',
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)',
                    marginBottom: '1.5rem'
                }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', fontWeight: 800, color: 'var(--color-text)' }}>
                        Top 5 Riesgos Identificados
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.75rem' }}>
                        {kpis.topRisks.map((risk, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: 'var(--color-background)',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.875rem)', color: 'var(--color-text)' }}>
                                    {risk.name}
                                </div>
                                <div style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    background: 'rgba(239,68,68,0.1)',
                                    color: '#ef4444',
                                    fontWeight: 700,
                                    fontSize: 'clamp(0.7rem, 2vw, 0.75rem)'
                                }}>
                                    {risk.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Matriz de Riesgos Status */}
            {(kpis.riskMatrixStatus.low || kpis.riskMatrixStatus.medium || kpis.riskMatrixStatus.high || kpis.riskMatrixStatus.critical) && (
                <div className="card" style={{
                    padding: 'clamp(1rem, 2vw, 1.25rem)',
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border)'
                }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', fontWeight: 800, color: 'var(--color-text)' }}>
                        Estado de Matrices de Riesgo
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                        gap: '1rem'
                    }}>
                        {[
                            { label: 'Bajos', value: kpis.riskMatrixStatus.low, color: '#10b981' },
                            { label: 'Medios', value: kpis.riskMatrixStatus.medium, color: '#eab308' },
                            { label: 'Altos', value: kpis.riskMatrixStatus.high, color: '#f97316' },
                            { label: 'Críticos', value: kpis.riskMatrixStatus.critical, color: '#ef4444' },
                        ].map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: 'var(--color-background)',
                                    border: `2px solid ${item.color}30`,
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, color: item.color }}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
