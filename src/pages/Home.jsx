import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ClipboardList, PlusCircle, History, User, Settings,
    Flame, ShieldAlert, BarChart3, ChevronRight, Plus, FileText, Gavel,
    Accessibility, AlertTriangle, Lock, UserPlus, LogIn, Sparkles,
    Camera, CalendarCheck, Shield, Cpu, Lightbulb
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import AdBanner from '../components/AdBanner';

const typeColors = {
    'ATS': { bg: 'rgba(16,185,129,0.12)', text: '#10b981', icon: <BarChart3 size={18} /> },
    'Carga Fuego': { bg: 'rgba(249,115,22,0.12)', text: '#f97316', icon: <Flame size={18} /> },
    'Inspección': { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', icon: <ClipboardList size={18} /> },
    'Matriz': { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6', icon: <ShieldAlert size={18} /> },
    'Informe': { bg: 'rgba(236,72,153,0.12)', text: '#ec4899', icon: <FileText size={18} /> },
    'Checklist': { bg: 'rgba(20,184,166,0.12)', text: '#14b8a6', icon: <ClipboardList size={18} /> },
};

const quickLinks = [
    { to: '/ats', icon: <BarChart3 size={26} />, label: 'ATS', sub: 'Análisis Trabajo Seguro', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { to: '/fire-load', icon: <Flame size={26} />, label: 'Carga Fuego', sub: 'Dec. 351/79', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    { to: '/risk-matrix', icon: <ShieldAlert size={26} />, label: 'Matrices', sub: 'Riesgo Laboral', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { to: '/ergonomics', icon: <Accessibility size={26} />, label: 'Ergonomía', sub: 'Res. SRT 886/15', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { to: '/reports', icon: <FileText size={26} />, label: 'Informes', sub: 'Técnicos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    { to: '/legislation', icon: <Gavel size={26} />, label: 'Legislación', sub: 'Biblioteca Legal', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { to: '/lighting', icon: <Lightbulb size={26} />, label: 'Iluminación', sub: 'Dec. 351/79', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
    { to: '/ai-camera', icon: <Camera size={26} />, label: 'Cámara IA', sub: 'Detección EPP', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { to: '/ai-advisor', icon: <Sparkles size={26} />, label: 'Asesor IA', sub: 'Consultas de Seguridad', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { to: '/checklists', icon: <ClipboardList size={26} />, label: 'Checklists', sub: 'Herramientas y Equipos', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
];

export default function Home() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncPulse } = useSync();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [daysLeft, setDaysLeft] = useState(null);
    const [stats, setStats] = useState([
        { label: 'Inspecciones', value: 0, icon: <ClipboardList />, color: '#3b82f6', grad: 'linear-gradient(135deg,#3b82f6,#2563eb)', key: 'inspections_history' },
        { label: 'ATS', value: 0, icon: <BarChart3 />, color: '#10b981', grad: 'linear-gradient(135deg,#10b981,#059669)', key: 'ats_history' },
        { label: 'Checklists', value: 0, icon: <ClipboardList />, color: '#14b8a6', grad: 'linear-gradient(135deg,#14b8a6,#0d9488)', key: 'tool_checklists_history' },
        { label: 'Carga Fuego', value: 0, icon: <Flame />, color: '#f97316', grad: 'linear-gradient(135deg,#f97316,#ea580c)', key: 'fireload_history' },
        { label: 'Matrices', value: 0, icon: <ShieldAlert />, color: '#8b5cf6', grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', key: 'risk_matrix_history' },
        { label: 'Informes', value: 0, icon: <FileText />, color: '#ec4899', grad: 'linear-gradient(135deg,#ec4899,#db2777)', key: 'reports_history' },
    ]);
    const [recentWorks, setRecentWorks] = useState([]);
    const [userName, setUserName] = useState('Profesional');

    useEffect(() => { }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('personalData');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                let name = parsed.name || 'Profesional';
                if (parsed.profession) {
                    const prof = parsed.profession.toLowerCase();
                    if (prof.includes('lic')) name = `Lic. ${name}`;
                    else if (prof.includes('téc')) name = `Téc. ${name}`;
                    else if (prof.includes('ing')) name = `Ing. ${name}`;
                }
                setUserName(name);
            }
            const status = localStorage.getItem('subscriptionStatus');
            const expiry = parseInt(localStorage.getItem('subscriptionExpiry') || '0', 10);
            if (status === 'active') {
                if (!expiry || Date.now() <= expiry) {
                    setIsSubscribed(true);
                    if (expiry) {
                        const days = Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
                        setDaysLeft(days);
                    }
                } else {
                    // Expired — clear
                    localStorage.removeItem('subscriptionStatus');
                    localStorage.removeItem('subscriptionExpiry');
                }
            }
        }

        const loadStats = () => {
            const newStats = stats.map(stat => {
                const history = localStorage.getItem(stat.key);
                const count = history ? JSON.parse(history).length : 0;
                return { ...stat, value: count };
            });
            setStats(newStats);
        };

        const loadRecent = () => {
            const ats = JSON.parse(localStorage.getItem('ats_history') || '[]');
            const fire = JSON.parse(localStorage.getItem('fireload_history') || '[]');
            const insp = JSON.parse(localStorage.getItem('inspections_history') || '[]');
            const matrix = JSON.parse(localStorage.getItem('risk_matrix_history') || '[]');
            const reports = JSON.parse(localStorage.getItem('reports_history') || '[]');
            const tools = JSON.parse(localStorage.getItem('tool_checklists_history') || '[]');

            const combined = [
                ...ats.map(a => ({ id: a.id, title: a.empresa, subtitle: a.obra, date: a.fecha, type: 'ATS' })),
                ...fire.map(f => ({ id: f.id, title: f.empresa, subtitle: f.sector, date: f.createdAt, type: 'Carga Fuego' })),
                ...insp.map(i => ({ id: i.id, title: i.name, subtitle: i.location, date: i.date, type: 'Inspección' })),
                ...matrix.map(m => ({ id: m.id, title: m.name, subtitle: m.location, date: m.createdAt, type: 'Matriz' })),
                ...reports.map(r => ({ id: r.id, title: r.title, subtitle: r.company, date: r.createdAt, type: 'Informe' })),
                ...tools.map(t => ({ id: t.id, title: t.equipo, subtitle: t.empresa, date: t.fecha, type: 'Checklist' })),
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
            setRecentWorks(combined);
        };

        loadStats();
        loadRecent();
    }, [syncPulse]);

    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* ── HERO BANNER ── */}
            <div style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0ea5e9 100%)',
                padding: '5.5rem 1.5rem 2.5rem',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '0'
            }}>
                {/* decorative circles */}
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 0.3rem' }}>
                                {currentUser ? 'Bienvenido de vuelta' : 'Potenciá tu trabajo con IA'}
                            </p>
                            <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-1px' }}>
                                {currentUser ? `${userName} 👋` : 'Asistente de Higiene y Seguridad'}
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginTop: '1rem', fontWeight: 400, maxWidth: '500px' }}>
                                {currentUser
                                    ? 'Dashboard de Gestión de Riesgos'
                                    : 'Cálculos normativos, reportes inteligentes y asesoría legal con Inteligencia Artificial. Todo en un solo lugar.'}
                            </p>
                        </div>
                        {!currentUser && (
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '2rem', width: '100%', maxWidth: '450px' }}>
                                <button onClick={() => navigate('/login', { state: { view: 'register' } })}
                                    style={{ flex: 2, padding: '1rem 1.5rem', borderRadius: '12px', border: 'none', background: '#fff', color: '#2563eb', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', transition: 'transform 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    Comenzar Gratis
                                </button>
                                <button onClick={() => navigate('/login', { state: { view: 'login' } })}
                                    style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)', fontSize: '1rem' }}>
                                    Ingresar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* STATS ROW inside hero */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.8rem', marginTop: '1.8rem' }}>
                        {stats.map((stat, i) => (
                            <div key={i}
                                onClick={() => {
                                    if (stat.key === 'ats_history') navigate('/ats-history');
                                    else if (stat.key === 'fireload_history') navigate('/fire-load-history');
                                    else if (stat.key === 'reports_history') navigate('/reports');
                                    else if (stat.key === 'risk_matrix_history') navigate('/risk-matrix');
                                    else navigate('/history');
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.12)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '14px',
                                    padding: '0.9rem 0.6rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    transition: 'transform 0.2s, background 0.2s',
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                            >
                                <div style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '0.3rem' }}>
                                    {React.cloneElement(stat.icon, { size: 20 })}
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stat.value}</div>
                                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.2rem' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Pro/Free Banner ── */}
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1rem' }}>
                {isSubscribed ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: '16px', padding: '1rem 1.5rem', marginTop: '1.5rem',
                    }}>
                        <div style={{ width: '42px', height: '42px', background: 'rgba(16,185,129,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={22} color="#10b981" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>Asistente HYS <span style={{ color: '#10b981' }}>PRO</span> activo ✓</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                {daysLeft !== null ? `Vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}` : 'Todas las funciones habilitadas.'}
                            </p>
                        </div>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                    </div>
                ) : (
                    <Link to="/subscribe" style={{ textDecoration: 'none' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            background: 'linear-gradient(135deg,rgba(37,99,235,0.08),rgba(14,165,233,0.06))',
                            border: '1px solid rgba(37,99,235,0.25)',
                            borderRadius: '16px', padding: '1rem 1.5rem', marginTop: '1.5rem',
                            cursor: 'pointer', transition: 'transform 0.2s',
                        }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ width: '42px', height: '42px', background: 'rgba(37,99,235,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Cpu size={22} color="var(--color-primary)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Activar Asistente HYS PRO <ChevronRight size={16} color="var(--color-primary)" />
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Habilitá impresiones, PDF e historial completo.</p>
                            </div>
                            <span style={{ background: 'var(--color-primary)', color: 'white', fontSize: '0.7rem', fontWeight: 900, padding: '0.3rem 0.7rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                $5/mes
                            </span>
                        </div>
                    </Link>
                )}

                {/* ── FEATURES SHOWCASE (Only for new users) ── */}
                {!currentUser && (
                    <div style={{ marginTop: '3rem', padding: '0 1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, textAlign: 'center', marginBottom: '2rem' }}>Todo lo que necesitás en una sola App</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                                <Sparkles size={24} color="#f59e0b" style={{ marginBottom: '1rem' }} />
                                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Asesoría Legal con IA</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                                    Consultá normativas argentinas (Ley 19587, Dec 351/79) y recibí recomendaciones preventivas al instante.
                                </p>
                            </div>
                            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #06b6d4' }}>
                                <Camera size={24} color="#06b6d4" style={{ marginBottom: '1rem' }} />
                                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Cámara de Riesgos</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                                    Detectá automáticamente la falta de casco, guantes o calzado de seguridad usando solo la cámara de tu celular.
                                </p>
                            </div>
                            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #f97316' }}>
                                <Flame size={24} color="#f97316" style={{ marginBottom: '1rem' }} />
                                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Cálculos Normativos</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                                    Carga de fuego, niveles de iluminación y matrices de riesgo personalizadas con protocolos listos para imprimir.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <AdBanner />

                {/* ── NEW INSPECTION (CTA) ── */}
                <Link to="/create-inspection" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '1.2rem',
                        background: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
                        borderRadius: '18px', padding: '1.3rem 1.5rem', marginTop: '1.5rem',
                        cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
                        position: 'relative', overflow: 'hidden',
                    }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.45)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.35)'; }}
                    >
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                        <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <PlusCircle size={28} color="white" />
                        </div>
                        <div style={{ flex: 1, zIndex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>Nueva Inspección</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Crear y sincronizar en la nube</p>
                        </div>
                        <ChevronRight size={22} color="rgba(255,255,255,0.7)" />
                    </div>
                </Link>

                {/* ── QUICK ACCESS GRID ── */}
                <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.3px' }}>Accesos Rápidos</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.9rem' }}>
                        {quickLinks.map((item, i) => (
                            <Link key={i} to={item.to} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    background: 'var(--color-surface)',
                                    borderRadius: '16px',
                                    padding: '1.1rem 0.8rem',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                    gap: '0.6rem',
                                    border: '1px solid var(--color-border)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                                    minHeight: '110px', justifyContent: 'center',
                                }}
                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${item.color}30`; e.currentTarget.style.borderColor = item.color + '60'; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                                >
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '14px',
                                        background: item.bg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: item.color,
                                        transition: 'transform 0.2s',
                                    }}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)' }}>{item.label}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>{item.sub}</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── RECENT ACTIVITY ── */}
                <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Actividad Reciente</h3>
                        {recentWorks.length > 0 && (
                            <Link to="/history" style={{ fontSize: '0.82rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                Ver todo <ChevronRight size={14} />
                            </Link>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                        {recentWorks.length > 0 ? (
                            recentWorks.map((work, i) => {
                                const tc = typeColors[work.type] || typeColors['Inspección'];
                                return (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '14px', padding: '0.9rem 1rem',
                                        transition: 'transform 0.2s',
                                    }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateX(4px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}
                                    >
                                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: tc.bg, color: tc.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {tc.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{work.title || '—'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.1rem', alignItems: 'center' }}>
                                                <span style={{ background: tc.bg, color: tc.text, padding: '0.1rem 0.5rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700 }}>{work.type}</span>
                                                {work.subtitle && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{work.subtitle}</span>}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                            {new Date(work.date || work.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2.5rem', border: '1.5px dashed var(--color-border)', borderRadius: '16px', opacity: 0.6 }}>
                                <History size={36} style={{ marginBottom: '0.8rem', opacity: 0.4 }} />
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>No hay actividad reciente</p>
                                <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Comenzá creando una nueva inspección</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
