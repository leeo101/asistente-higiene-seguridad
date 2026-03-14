import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, PieChart, TrendingUp, Users, ShieldAlert, Award, Lock, ChevronLeft, ArrowRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import StatsBar from '../components/StatsBar';

export default function Analytics() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { isPro } = usePaywall();

    const [stats, setStats] = useState({
        total: 0,
        thisMonth: 0,
        topClients: [],
        monthlyActivity: [],
        distribution: []
    });

    const [loading, setLoading] = useState(true);

    const moduleColors = {
        'ATS': '#10b981',
        'Fuego': '#f97316',
        'Inspección': '#3b82f6',
        'Matriz': '#8b5cf6',
        'Informe': '#ec4899',
        'Checklist': '#14b8a6',
        'Iluminación': '#eab308',
        'Permiso': '#2563eb'
    };

    useEffect(() => {
        // Aggregate all data
        const loadData = () => {
            const getParsed = (key) => JSON.parse(localStorage.getItem(key) || '[]');

            const ats = getParsed('ats_history').map(i => ({ date: i.fecha, client: i.empresa, type: 'ATS' }));
            const fire = getParsed('fireload_history').map(i => ({ date: i.createdAt, client: i.empresa, type: 'Fuego' }));
            const insp = getParsed('inspections_history').map(i => ({ date: i.date, client: i.name, type: 'Inspección' }));
            const matrix = getParsed('risk_matrix_history').map(i => ({ date: i.createdAt, client: i.name, type: 'Matriz' }));
            const reports = getParsed('reports_history').map(i => ({ date: i.createdAt, client: i.company, type: 'Informe' }));
            const tools = getParsed('tool_checklists_history').map(i => ({ date: i.fecha, client: i.empresa, type: 'Checklist' }));
            const lighting = getParsed('lighting_history').map(i => ({ date: i.date, client: i.empresa, type: 'Iluminación' }));
            const permits = getParsed('work_permits_history').map(i => ({ date: i.createdAt, client: i.empresa, type: 'Permiso' }));

            const allItems = [...ats, ...fire, ...insp, ...matrix, ...reports, ...tools, ...lighting, ...permits]
                .filter(i => i.date); // Must have date to be valid

            // Calculate Totals
            const total = allItems.length;

            // Current Month
            const now = new Date();
            const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            let thisMonth = 0;

            // Monthly grouping (Last 6 months)
            const monthsMap = {};
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthsMap[k] = { label: d.toLocaleDateString('es-AR', { month: 'short' }), count: 0, raw: k };
            }

            // Dist grouping and Client grouping
            const distMap = {};
            const clientMap = {};

            allItems.forEach(item => {
                const d = new Date(item.date);
                if (isNaN(d.getTime())) return;

                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (monthKey === currentMonthStr) thisMonth++;
                if (monthsMap[monthKey]) monthsMap[monthKey].count++;

                distMap[item.type] = (distMap[item.type] || 0) + 1;

                if (item.client && item.client.trim() !== '') {
                    const c = item.client.trim().toUpperCase();
                    clientMap[c] = (clientMap[c] || 0) + 1;
                }
            });

            // Format Maps to Arrays
            const maxActivity = Math.max(...Object.values(monthsMap).map(m => m.count), 1);
            const monthlyActivity = Object.values(monthsMap).map(m => ({
                ...m,
                height: (m.count / maxActivity) * 100 // Percentage for CSS height
            }));

            // Build chart data for last 7 days (Daily Activity)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - (6 - i));
                return {
                    dateStr: d.toISOString().split('T')[0],
                    display: d.toLocaleDateString('es-ES', { weekday: 'short' }),
                    registros: 0
                };
            });

            allItems.forEach(item => {
                const d = new Date(item.date);
                if (isNaN(d.getTime())) return;
                const dateStr = d.toISOString().split('T')[0];
                const dayEntry = last7Days.find(day => day.dateStr === dateStr);
                if (dayEntry) {
                    dayEntry.registros += 1;
                }
            });

            const distributionArr = Object.entries(distMap)
                .map(([type, count]) => ({ type, count, color: moduleColors[type] || '#64748b' }))
                .sort((a, b) => b.count - a.count)
                .map(item => ({ ...item, percentage: ((item.count / total) * 100).toFixed(1) }));

            const topClientsArr = Object.entries(clientMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // top 5

            setStats({
                total,
                thisMonth,
                monthlyActivity,
                dailyActivity: last7Days,
                distribution: distributionArr,
                topClients: topClientsArr,
                maxActivity // to scale the Y axis
            });

            // simulate short loading for animation effect
            setTimeout(() => setLoading(false), 300);
        };

        if (currentUser) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    if (!currentUser) {
        return (
            <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Iniciá sesión</h2>
                <p>Las estadísticas globales requieren guardar el historial de tu usuario.</p>
                <button onClick={() => navigate('/login')} className="btn-primary" style={{ marginTop: '1rem' }}>Ir al Login</button>
            </div>
        );
    }

    // -- UPSELL PAYWALL GUARD --
    if (!isPro()) {
        return (
            <div style={{ paddingBottom: '4rem' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
                    padding: '5.5rem 1.5rem 3rem',
                    color: 'white',
                    textAlign: 'center',
                    borderBottomLeftRadius: '30px',
                    borderBottomRightRadius: '30px'
                }}>
                    <BarChart3 size={48} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.5rem', letterSpacing: '-0.5px' }}>
                        Estadísticas Globales
                    </h1>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: '1.05rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                        Monitoreá tu productividad, distribución de riesgos y la carga laboral mensual desde un solo lugar.
                    </p>
                </div>

                <div style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '-3rem auto 0', position: 'relative' }}>
                    <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', border: '2px solid rgba(37,99,235,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <div style={{ width: '60px', height: '60px', background: 'rgba(37,99,235,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Lock size={30} color="#2563eb" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Función Exclusiva PRO</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                            El cruce de datos y análisis global requiere acceso ilimitado a todos tus historiales de inspección y herramientas avanzadas.
                        </p>
                        <button
                            onClick={() => navigate('/subscribe')}
                            style={{
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                color: 'white', border: 'none', padding: '1rem 2rem',
                                borderRadius: '14px', fontSize: '1rem', fontWeight: 800,
                                cursor: 'pointer', boxShadow: '0 8px 20px rgba(37,99,235,0.4)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Activar HYS PRO — $2/mes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // -- PRO USER DASHBOARD --
    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{
                background: 'var(--color-surface)',
                padding: '5.5rem 1.5rem 2rem',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={28} color="var(--color-primary)" />
                            Analytics
                        </h1>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Resumen de actividad y productividad global</p>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>
                <StatsBar />

                {/* Top Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                            <div style={{ background: 'rgba(37,99,235,0.1)', padding: '0.5rem', borderRadius: '10px' }}><BarChart3 size={20} color="#2563eb" /></div>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Total Generados</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
                            {loading ? '-' : stats.total}
                        </div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '10px' }}><Award size={20} color="#10b981" /></div>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Este Mes</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
                            {loading ? '-' : `+${stats.thisMonth}`}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                    {/* Activity Chart CSS */}
                    <div className="card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Actividad Mensual (Últimos 6 Meses)</h3>
                        <div className="chart-container">
                            {!loading && stats.monthlyActivity.map((month, idx) => (
                                <div key={idx} className="chart-bar-wrap">
                                    <div className="chart-tooltip">{month.count} reportes</div>
                                    <div className="chart-bar" style={{ height: `${Math.max(month.height, 4)}%` }}></div>
                                    <div className="chart-label" style={{ textTransform: 'capitalize' }}>{month.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Daily Activity Area Chart */}
                    <div className="card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem', borderRadius: '10px', color: '#3b82f6' }}>
                                <Activity size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Actividad Diaria</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Registros de los últimos 7 días</p>
                            </div>
                        </div>
                        <div style={{ height: '220px', width: '100%', marginLeft: '-15px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.dailyActivity || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRegistros" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                                    <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                        itemStyle={{ color: 'var(--color-primary)' }}
                                    />
                                    <Area type="monotone" dataKey="registros" name="Registros" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRegistros)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Module Distribution */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <PieChart size={18} color="var(--color-primary)" /> Distribución
                        </h3>

                        {!loading && stats.total > 0 ? (
                            <>
                                <div className="distribution-bar">
                                    {stats.distribution.map((dist, i) => (
                                        <div
                                            key={i}
                                            className="dist-segment"
                                            style={{ width: `${dist.percentage}%`, background: dist.color }}
                                            title={`${dist.type}: ${dist.count} (${dist.percentage}%)`}
                                        ></div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {stats.distribution.slice(0, 5).map((dist, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: dist.color }}></div>
                                                <span style={{ fontWeight: 600 }}>{dist.type}</span>
                                            </div>
                                            <span style={{ color: 'var(--color-text-muted)' }}>{dist.count} ({dist.percentage}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '2rem' }}>Sin datos aún.</p>
                        )}
                    </div>

                    {/* Top Clients */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={18} color="var(--color-primary)" /> Top Empresas
                        </h3>

                        {!loading && stats.topClients.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {stats.topClients.map((client, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(0,0,0,0.05)',
                                            color: i === 0 ? 'white' : 'var(--color-text-muted)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: '0.85rem'
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700, fontSize: '0.95rem' }}>
                                            {client.name}
                                        </div>
                                        <div style={{ background: 'var(--color-background)', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>
                                            {client.count} tests
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '2rem' }}>Agregá empresa o cliente a tus reportes para verlos aquí.</p>
                        )}
                    </div>
                </div>
            </div>

            <AdBanner />
        </div>
    );
}
