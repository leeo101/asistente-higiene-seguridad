import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ClipboardList, PlusCircle, History, User, Users, Settings,
    Flame, BarChart3, ChevronRight, Plus, Gavel, Siren,
    Accessibility, Lock, UserPlus, LogIn, Sparkles,
    Camera, CalendarCheck, Shield, Cpu, Lightbulb, ThermometerSun, Map,
    ShieldCheck, TriangleAlert, KeySquare, ScrollText, Bot, ClipboardCheck, FileText, HardHat, ShieldAlert, PenTool,
    ArrowRight, Activity, BookOpen, Calendar as CalendarIcon, Search, TrendingUp
} from 'lucide-react';
import { getCountryNormativa } from '../data/legislationData';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import AdBanner from '../components/AdBanner';
import StarryBackground from '../components/StarryBackground';
import OnboardingModal from '../components/OnboardingModal';
import StickyCtaBanner from '../components/StickyCtaBanner';
import StatsBar from '../components/StatsBar';
import NewsWidget from '../components/NewsWidget';

function FaqSection() {
    const [open, setOpen] = React.useState(null);
    const savedData = localStorage.getItem('personalData');
    const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';

    const items = [
        { q: '¿Qué países están soportados?', a: 'Asistente HYS está totalmente legalizado para Argentina, Chile, Bolivia, Paraguay y Uruguay. Los cálculos y el Asesor IA se adaptan automáticamente a la normativa de tu país seleccionado al registrarte.' },
        { q: '¿Es realmente gratis?', a: 'Sí. Podés usar todos los módulos de cálculo, ATS, matrices, asesor IA y cámara sin pagar nada. El plan PRO agrega la impresión/PDF y el historial en nube.' },
        { 
            q: userCountry === 'argentina' ? '¿Cumple con la normativa argentina?' : '¿Cumple con la normativa local?', 
            a: userCountry === 'argentina' 
                ? 'Los cálculos están basados en la Ley 19.587, el Dec. 351/79, resoluciones SRT y normativas vigentes. Siempre recomendamos verificar cambios normativos recientes.' 
                : userCountry === 'chile'
                ? 'Los cálculos están basados en el DS 594 y la Ley 16.744 de Chile. El asesor IA utiliza el contexto legal de tu región.'
                : `Los cálculos y módulos están adaptados a las normativas vigentes de ${userCountry.charAt(0).toUpperCase() + userCountry.slice(1)} (ej: ${userCountry === 'bolivia' ? 'DL 16998' : userCountry === 'paraguay' ? 'Dec 14390' : 'Dec 406/88'}). El asesor IA utiliza el contexto legal regional.`
        },
        { q: '¿Mis datos están seguros?', a: 'Sí. Usamos Firebase (Google) para autenticación y almacenamiento cifrado. Nunca compartimos tus datos con terceros. Podés leer nuestra Política de Privacidad.' },
        { q: '¿Funciona en el celular?', a: 'Perfecto. Está optimizada para mobile y podés instalarla directamente en tu pantalla de inicio como una app nativa, sin pasar por ninguna tienda.' },
        { q: '¿Cómo cancelo la suscripción PRO?', a: 'En cualquier momento desde tu perfil, en la sección Suscripción. No hay permanencia ni cargos ocultos.' },
    ];
    return (
        <div style={{ marginBottom: '2rem' }}>
            {items.map((item, i) => (
                <div key={i} className="card" style={{ marginBottom: '0.6rem', padding: '0', overflow: 'hidden' }}>
                    <button onClick={() => setOpen(open === i ? null : i)}
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '1rem 1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                        {item.q}
                        <span style={{ flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s', fontSize: '1.3rem', color: 'var(--color-primary)', lineHeight: 1 }}>+</span>
                    </button>
                    {open === i && (
                        <div style={{ padding: '0 1.2rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            {item.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// Animated counter hook
function useCounter(target, duration = 1800) {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
        let start = 0;
        const step = Math.ceil(target / (duration / 30));
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
        }, 30);
        return () => clearInterval(timer);
    }, [target, duration]);
    return count;
}

// Sub-component so useCounter is called at component level (hooks rule)
function CounterItem({ value, label, suffix }) {
    const count = useCounter(value);
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-hero-text)', lineHeight: 1 }}>
                {count.toLocaleString('es-AR')}{suffix}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-hero-subtext)', fontWeight: 600, marginTop: '0.2rem' }}>{label}</div>
        </div>
    );
}

const typeColors = {
    'ATS': { bg: 'rgba(16,185,129,0.12)', text: '#10b981', icon: <BarChart3 size={18} /> },
    'Carga Fuego': { bg: 'rgba(249,115,22,0.12)', text: '#f97316', icon: <Flame size={18} /> },
    'Inspección': { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', icon: <ClipboardList size={18} /> },
    'Matriz': { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6', icon: <ShieldAlert size={18} /> },
    'Informe': { bg: 'rgba(236,72,153,0.12)', text: '#ec4899', icon: <FileText size={18} /> },
    'Checklist': { bg: 'rgba(20,184,166,0.12)', text: '#14b8a6', icon: <ClipboardList size={18} /> },
    'Iluminación': { bg: 'rgba(234,179,8,0.12)', text: '#eab308', icon: <Lightbulb size={18} /> },
    'Permiso': { bg: 'rgba(37,99,235,0.12)', text: '#2563eb', icon: <HardHat size={18} /> },
    'Eval. Riesgo': { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', icon: <Shield size={18} /> },
};

    const savedData = localStorage.getItem('personalData');
    const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';

    const getRegSub = (module) => {
        if (userCountry === 'argentina') {
            if (module === 'fire') return 'Dec. 351/79';
            if (module === 'ergo') return 'Res. SRT 886/15';
            if (module === 'thermal') return 'TGBH Res. 295/03';
            if (module === 'lighting') return 'Dec. 351/79';
        } else if (userCountry === 'chile') {
            if (module === 'fire') return 'DS 594 / Art. 44';
            if (module === 'ergo') return 'Ley 20.949';
            if (module === 'thermal') return 'DS 594';
            if (module === 'lighting') return 'DS 594';
        } else if (userCountry === 'bolivia') {
            if (module === 'fire') return 'DL 16998 / Art. 83';
            if (module === 'ergo') return 'DL 16998';
            if (module === 'thermal') return 'DL 16998 / Art. 54';
            if (module === 'lighting') return 'DL 16998 / Art. 68';
        } else if (userCountry === 'paraguay') {
            if (module === 'fire') return 'Dec 14390 / Art. 147';
            if (module === 'ergo') return 'Dec 14390';
            if (module === 'thermal') return 'Dec 14390 / Art. 210';
            if (module === 'lighting') return 'Dec 14390 / Art. 182';
        } else if (userCountry === 'uruguay') {
            if (module === 'fire') return 'Dec 406/88 / Tít. VII';
            if (module === 'ergo') return 'Dec 406/88';
            if (module === 'thermal') return 'Dec 406/88 / Tít. V';
            if (module === 'lighting') return 'Dec 406/88 / Tít. IV';
        }
        return 'Referencia Normativa Local';
    };

    const quickLinks = [
        { to: '/ats', icon: <ShieldCheck size={26} />, label: 'ATS', sub: 'Análisis Trabajo Seguro', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        { to: '/ai-advisor', icon: <Bot size={26} />, label: 'Asesor IA', sub: 'Consultas de Seguridad', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
        { to: '/ai-camera', icon: <Camera size={26} />, label: 'Cámara IA', sub: 'Detección EPP', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
        { to: '/training-management', icon: <Users size={26} />, label: 'Capacitar', sub: 'Planillas y Asistencia', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
        { to: '/fire-load', icon: <Flame size={26} />, label: 'Carga Fuego', sub: getRegSub('fire'), color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
        { to: '/checklists', icon: <ClipboardList size={26} />, label: 'Checklists', sub: 'Herramientas y Equipos', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
        { to: '/ppe-tracker', icon: <HardHat size={26} />, label: 'Control EPP', sub: 'Vencimientos', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
        { to: '/ergonomics', icon: <Accessibility size={26} />, label: 'Ergonomía', sub: getRegSub('ergo'), color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
        { to: '/thermal-stress', icon: <ThermometerSun size={26} />, label: 'Estrés Térmico', sub: getRegSub('thermal'), color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
        { to: '/lighting', icon: <Lightbulb size={26} />, label: 'Iluminación', sub: getRegSub('lighting'), color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
        { to: '/reports', icon: <ScrollText size={26} />, label: 'Informes', sub: 'Técnicos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
        { to: '/accident-investigation', icon: <Siren size={26} />, label: 'Investigación', sub: 'Accidentes / Árbol', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        { to: '/legislation', icon: <Gavel size={26} />, label: 'Legislación', sub: 'Biblioteca Legal', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        { to: '/risk-maps', icon: <Map size={26} />, label: 'Mapas', sub: 'Croquis de Riesgos', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        { to: '/extinguishers', icon: <Flame size={26} />, label: 'Matafuegos', sub: 'Control y Vencimientos', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
        { to: '/work-permit', icon: <KeySquare size={26} />, label: 'Permisos', sub: 'Tareas Críticas', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
        { to: '/ai-general-camera', icon: <ShieldAlert size={26} />, label: 'Riesgos IA', sub: 'Análisis de Entorno', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
        { to: '/drills', icon: <Siren size={26} />, label: 'Simulacros', sub: 'Actas de Evacuación', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        { to: '/stop-cards', icon: <TriangleAlert size={26} />, label: 'Tarjetas STOP', sub: 'Observaciones', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    ];

export default function Home() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncPulse } = useSync();
    const { isPro, daysRemaining } = usePaywall();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [daysLeft, setDaysLeft] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [stats, setStats] = useState([
        { label: 'Accidentes', value: 0, icon: <Siren />, color: '#ef4444', grad: 'linear-gradient(135deg,#ef4444,#b91c1c)', key: 'accident_history' },
        { label: 'ATS', value: 0, icon: <ShieldCheck />, color: '#10b981', grad: 'linear-gradient(135deg,#10b981,#059669)', key: 'ats_history' },
        { label: 'Carga Fuego', value: 0, icon: <Flame />, color: '#f97316', grad: 'linear-gradient(135deg,#f97316,#ea580c)', key: 'fireload_history' },
        { label: 'Checklists', value: 0, icon: <ClipboardList />, color: '#14b8a6', grad: 'linear-gradient(135deg,#14b8a6,#0d9488)', key: 'tool_checklists_history' },
        { label: 'Iluminación', value: 0, icon: <Lightbulb />, color: '#eab308', grad: 'linear-gradient(135deg,#eab308,#ca8a04)', key: 'lighting_history' },
        { label: 'Informes', value: 0, icon: <ScrollText />, color: '#ec4899', grad: 'linear-gradient(135deg,#ec4899,#db2777)', key: 'reports_history' },
        { label: 'Inspecciones', value: 0, icon: <ClipboardCheck />, color: '#3b82f6', grad: 'linear-gradient(135deg,#3b82f6,#2563eb)', key: 'inspections_history' },
        { label: 'Matrices', value: 0, icon: <TriangleAlert />, color: '#8b5cf6', grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', key: 'risk_matrix_history' },
        { label: 'Permisos', value: 0, icon: <KeySquare />, color: '#2563eb', grad: 'linear-gradient(135deg,#2563eb,#1d4ed8)', key: 'work_permits_history' },
    ]);
    const [recentWorks, setRecentWorks] = useState([]);
    const [userName, setUserName] = useState('Profesional');
    const [dailyInsight, setDailyInsight] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (!currentUser) {
                setUserName('Profesional');
                setIsSubscribed(false);
                setDaysLeft(null);
                setStats(prev => prev.map(s => ({ ...s, value: 0 })));
                setRecentWorks([]);
                return;
            }

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

            // Re-sync with paywall hook
            setIsSubscribed(isPro());
            setDaysLeft(daysRemaining());

            // Onboarding: show once per user account
            if (currentUser) {
                const onboardingKey = `onboarding_done_${currentUser.uid} `;
                if (!localStorage.getItem(onboardingKey)) {
                    setTimeout(() => setShowOnboarding(true), 1000);
                    localStorage.setItem(onboardingKey, '1');
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
            const lighting = JSON.parse(localStorage.getItem('lighting_history') || '[]');
            const accidents = JSON.parse(localStorage.getItem('accident_history') || '[]');

            const combined = [
                ...ats.map(a => ({ id: a.id, title: a.empresa, subtitle: a.obra, date: a.fecha, type: 'ATS' })),
                ...fire.map(f => ({ id: f.id, title: f.empresa, subtitle: f.sector, date: f.createdAt, type: 'Carga Fuego' })),
                ...insp.map(i => ({ id: i.id, title: i.name, subtitle: i.location, date: i.date, type: 'Inspección' })),
                ...matrix.map(m => ({ id: m.id, title: m.name, subtitle: m.location, date: m.createdAt, type: 'Matriz' })),
                ...reports.map(r => ({ id: r.id, title: r.title, subtitle: r.company, date: r.createdAt, type: 'Informe' })),
                ...tools.map(t => ({ id: t.id, title: t.equipo, subtitle: t.empresa, date: t.fecha, type: 'Checklist' })),
                ...lighting.map(l => ({ id: l.id, title: l.empresa, subtitle: l.sector, date: l.date, type: 'Iluminación' })),
                ...JSON.parse(localStorage.getItem('work_permits_history') || '[]').map(p => ({ id: p.id, title: p.empresa, subtitle: p.obra, date: p.createdAt, type: 'Permiso' })),
                ...JSON.parse(localStorage.getItem('risk_assessment_history') || '[]').map(r => ({ id: r.id, title: r.name, subtitle: r.location, date: r.date || r.createdAt, type: 'Eval. Riesgo' })),
                ...accidents.map(acc => ({ id: acc.id, title: acc.victimaNombre, subtitle: acc.empresa, date: acc.date, type: 'Accidente' })),
            ].sort((a, b) => new Date(b.date || b.fecha || b.createdAt) - new Date(a.date || a.fecha || a.createdAt)).slice(0, 4);
            setRecentWorks(combined);
        };

        const loadDailyInsight = async () => {
            try {
                const today = new Date().toDateString();
                const cached = localStorage.getItem('daily_insight_cache');
                if (cached) {
                    const { date, data } = JSON.parse(cached);
                    if (date === today) {
                        setDailyInsight(data);
                        return;
                    }
                }

                const response = await fetch('/api/daily-insight', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    const data = await response.json();
                    setDailyInsight(data);
                    localStorage.setItem('daily_insight_cache', JSON.stringify({ date: today, data }));
                }
            } catch (err) {
                console.error("Error fetching daily insight:", err);
            }
        };

        loadStats();
        loadRecent();
        loadDailyInsight();
    }, [syncPulse, currentUser]);

    return (
        <div className="page-transition" style={{ paddingBottom: '4rem' }}>
            {/* Onboarding modal — solo una vez para usuarios nuevos */}
            {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

            {/* Sticky CTA — solo para visitantes sin cuenta */}
            {!currentUser && <StickyCtaBanner />}

            {/* ── HERO BANNER ── */}
            <div className="home-hero-banner" style={{
                padding: 'clamp(7rem, 12vw, 8.5rem) 1.2rem 3rem',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                width: '100%',
                boxSizing: 'border-box',
                background: '#0f172a' // fallback background
            }}>
                <StarryBackground />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                        <div className="stagger-item" style={{ animationDelay: '0.1s' }}>
                            <p style={{ color: 'var(--color-hero-accent)', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                {currentUser ? 'Dashboard Profesional' : 'Inteligencia Artificial h&s'}
                                {currentUser && !isPro() && JSON.parse(localStorage.getItem('subscriptionData') || '{}').status === 'active' && (
                                    <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 900 }}>
                                        Suscripción Vencida ⚠️
                                    </span>
                                )}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1rem' }}>
                                <img src="/logo.png" alt="Logo de Asistente HYS" style={{ width: '64px', height: '64px', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))' }} />
                                <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, color: 'var(--color-hero-text)', margin: 0, lineHeight: 0.9, letterSpacing: '-2px', fontFamily: 'var(--font-heading)' }}>
                                    {currentUser ? <>{userName} {isSubscribed && <Sparkles size={28} color="#f59e0b" fill="#f59e0b" className="animate-pulse" />}</> : 'Asistente HYS'}
                                </h1>
                            </div>
                            <p style={{ color: 'var(--color-hero-subtext)', fontSize: '1.2rem', marginTop: '1.5rem', fontWeight: 500, maxWidth: '550px', lineHeight: 1.6 }}>
                                {currentUser
                                    ? 'Gestión avanzada de riesgos y cumplimiento normativo potenciado por IA.'
                                    : 'Cálculos técnicos, reportes con validez legal y asesoría inteligente para profesionales de Argentina, Chile, Bolivia, Paraguay y Uruguay.'}
                            </p>
                        </div>
                        {!currentUser && (
                            <div className="hero-buttons stagger-item" style={{ animationDelay: '0.3s', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', width: '100%', maxWidth: '450px' }}>
                                    <button onClick={() => navigate('/login', { state: { view: 'register' } })}
                                        style={{ flex: 2, padding: '1.3rem 2rem', borderRadius: '20px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(59, 130, 246, 0.5)'; }}
                                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.4)'; }}>
                                        Comenzar Ahora - Gratis
                                    </button>
                                <button onClick={() => navigate('/login', { state: { view: 'login' } })}
                                    style={{ flex: 1, padding: '1.3rem 2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', fontSize: '1rem', transition: 'all 0.3s ease' }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                    Ingresar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* STATS ROW inside hero - solo para usuarios logueados */}
                    {currentUser && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '1.8rem' }}>
                            {stats.map((stat, i) => (
                                <div key={i}
                                    onClick={() => {
                                        if (stat.key === 'ats_history') navigate('/ats-history');
                                        else if (stat.key === 'fireload_history') navigate('/fire-load-history');
                                        else if (stat.key === 'reports_history') navigate('/history', { state: { view: 'reports' } });
                                        else if (stat.key === 'risk_matrix_history') navigate('/history', { state: { view: 'matrices' } });
                                        else if (stat.key === 'lighting_history') navigate('/lighting-history');
                                        else if (stat.key === 'work_permits_history') navigate('/work-permit-history');
                                        else if (stat.key === 'tool_checklists_history') navigate('/checklists-history');
                                        else if (stat.key === 'risk_assessment_history') navigate('/risk-assessment-history');
                                        else navigate('/history', { state: { view: 'inspections' } });
                                    }}
                                    className="glass-card stagger-item"
                                    style={{
                                        borderRadius: '24px',
                                        padding: '1.2rem 0.6rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        animationDelay: `${0.4 + (i * 0.05)}s`
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                >
                                    <div style={{ color: 'var(--color-primary)', marginBottom: '0.6rem', opacity: 0.9, filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }}>
                                        {React.cloneElement(stat.icon, { size: 24 })}
                                    </div>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{stat.value}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.4rem' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Social Proof Counter Strip */}
                    {!currentUser && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', padding: '1.5rem 1rem 0', flexWrap: 'wrap' }}>
                            <CounterItem value={1240} label="Profesionales registrados" suffix="+" />
                            <CounterItem value={8500} label="Reportes generados" suffix="+" />
                            <CounterItem value={11} label="Módulos disponibles" suffix="" />
                        </div>
                    )}

                    {/* — DAILY INSIGHT — */}
                    {currentUser && dailyInsight && (
                        <div className="stagger-item" style={{
                            marginTop: '2rem',
                            padding: '1.2rem',
                            borderRadius: '20px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                            animationDelay: '0.8s'
                        }}>
                            <div style={{ background: 'var(--color-primary)', color: 'white', padding: '0.8rem', borderRadius: '15px', display: 'flex' }}>
                                <Sparkles size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Consejo del día · {dailyInsight.category}</span>
                                </div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{dailyInsight.title}</h4>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{dailyInsight.content}</p>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ── STATS BAR — solo usuarios logueados ── */}
            {currentUser && (
                <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1rem' }}>
                    <StatsBar />
                </div>
            )}


                {/* ── LANDING COMPLETA (solo visitantes) ── */}
                {!currentUser && (
                    <div style={{ marginTop: '2.5rem' }}>

                        {/* — FEATURES GRID — */}
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, textAlign: 'center', marginBottom: '0.4rem' }}>
                            Todo lo que necesitás en una sola App
                        </h2>
                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            11 módulos profesionales, gratis para usar
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem', marginBottom: '3rem' }}>
                            {[
                                { 
                                    icon: '✨', 
                                    color: '#f59e0b', 
                                    bg: 'rgba(245,158,11,0.08)', 
                                    title: 'Asesoría Legal con IA', 
                                    desc: userCountry === 'argentina' 
                                        ? 'Consultá normativas argentinas (Ley 19587, Dec 351/79) y recibí recomendaciones preventivas al instante.' 
                                        : `Consultá normativas de ${userCountry.charAt(0).toUpperCase() + userCountry.slice(1)} (${getCountryNormativa(userCountry).general}) y recibí recomendaciones preventivas ajustadas a la legislación local.` 
                                },
                                { icon: '📷', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', title: 'Cámara de Riesgos', desc: 'Detectá automáticamente la falta de casco, guantes o calzado de seguridad con la cámara de tu celular.' },
                                { 
                                    icon: '🔥', 
                                    color: '#f97316', 
                                    bg: 'rgba(249,115,22,0.08)', 
                                    title: 'Cálculo Carga de Fuego', 
                                    desc: userCountry === 'argentina' 
                                        ? 'Calculá la carga de fuego según Dec 351/79. Genera el protocolo oficial listo para presentar.' 
                                        : `Calculá la carga de fuego según ${getCountryNormativa(userCountry).fire}. Genera reportes técnicos listos para presentar.` 
                                },
                                { icon: '💡', color: '#eab308', bg: 'rgba(234,179,8,0.08)', title: 'Iluminación', desc: 'Medición y cálculo de niveles de iluminación con factor de mantenimiento y comparación normativa.' },
                                { icon: '⚠️', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', title: 'Matriz de Riesgo', desc: 'Evaluá peligros con matrices 5x5 personalizadas. Genera reportes PDF automáticamente.' },
                                { icon: '📋', color: '#10b981', bg: 'rgba(16,185,129,0.08)', title: 'ATS — Análisis de Trabajo Seguro', desc: 'Creá ATS por tarea con medidas de control. Listo para firma digital e impresión.' },
                            ].map((f, i) => (
                                <div key={i} className="card" style={{ padding: '1.4rem', borderLeft: `4px solid ${f.color} `, background: 'var(--color-surface)', transition: 'all 0.3s ease' }}
                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = f.bg; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--color-surface)'; }}>
                                    <div style={{ fontSize: '1.8rem', marginBottom: '0.7rem' }}>{f.icon}</div>
                                    <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '0.95rem' }}>{f.title}</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* — CÓMO FUNCIONA — */}
                        <div style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.05),rgba(14,165,233,0.03))', borderRadius: '20px', padding: '2rem 1.5rem', marginBottom: '3rem', border: '1px solid rgba(37,99,235,0.1)' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, textAlign: 'center', marginBottom: '2rem' }}>
                                ¿Cómo funciona?
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                {[
                                    { n: '1', icon: '🎯', title: 'Registrate Gratis', desc: 'Creá tu cuenta en 60 segundos con tu matrícula y datos profesionales.' },
                                    { n: '2', icon: '🛠️', title: 'Usá las Herramientas', desc: 'Accedé a todos los módulos: cálculos, ATS, matrices, legislación y más.' },
                                    { n: '3', icon: '📄', title: 'Descargá tus Reportes', desc: 'Generá PDFs profesionales listos para presentar con tu firma digital.' },
                                ].map((s, i) => (
                                    <div key={i} style={{ textAlign: 'center', padding: '1rem' }}>
                                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 900, fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}>
                                            {s.n}
                                        </div>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                                        <h4 style={{ margin: '0 0 0.4rem', fontWeight: 800, fontSize: '0.95rem' }}>{s.title}</h4>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* — TESTIMONIOS — */}
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, textAlign: 'center', marginBottom: '0.4rem' }}>
                            Lo que dicen los profesionales
                        </h2>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            {'⭐'.repeat(5)}
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem', fontWeight: 600 }}>4.9 / 5 — +1200 profesionales</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem', marginBottom: '3rem' }}>
                            {[
                                { name: 'Ing. Marcos V.', role: 'Técnico en HYS', text: 'La carga de fuego me llevaba horas. Ahora la hago en 5 minutos y el protocolo queda perfecto para entregar.' },
                                { name: 'Lic. Fernanda G.', role: 'Profesional HYS', text: 'El asesor IA me resolvió dudas normativas que tardaba días en aclarar con otros recursos.' },
                                { name: 'Téc. Rodrigo M.', role: 'Técnico en Seguridad', text: 'Uso la cámara IA en obra para verificar EPP al instante. Una herramienta que realmente te cambia el día a día.' },
                            ].map((t, i) => (
                                <div key={i} className="card" style={{ padding: '1.4rem', background: 'var(--color-surface)' }}>
                                    <div style={{ color: '#f59e0b', fontSize: '0.85rem', marginBottom: '0.7rem', letterSpacing: '2px' }}>⭐⭐⭐⭐⭐</div>
                                    <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--color-text)', lineHeight: 1.6, fontStyle: 'italic' }}>
                                        "{t.text}"
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 900, fontSize: '0.9rem', flexShrink: 0 }}>
                                            {t.name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{t.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* — PRECIOS — */}
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, textAlign: 'center', marginBottom: '1.5rem' }}>
                            Planes
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '3rem' }}>
                            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '2px solid var(--color-border)', background: 'var(--color-surface)' }}>
                                <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.3rem' }}>Gratis</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', marginBottom: '1rem' }}>$0</div>
                                {['Todos los cálculos', 'ATS, Matrices, Checklists', 'Asesor IA', 'Cámara de Riesgos', 'Historial básico'].map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span> {f}
                                    </div>
                                ))}
                                <button onClick={() => window.location.href = '/login?view=register'} style={{ marginTop: '1rem', width: '100%', padding: '0.8rem', borderRadius: '10px', border: '2px solid #10b981', background: 'transparent', color: '#10b981', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                                    Comenzar Gratis
                                </button>
                            </div>
                            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '2px solid #2563eb', position: 'relative', overflow: 'hidden', background: 'var(--color-surface)' }}>
                                <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#2563eb', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '20px' }}>RECOMENDADO</div>
                                <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.3rem' }}>PRO</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2563eb', marginBottom: '1rem' }}>$2<span style={{ fontSize: '1rem', fontWeight: 600 }}>/mes</span></div>
                                {['Todo lo del plan Gratis', 'Impresión y PDF ilimitados', 'Firma y sello digital', 'Historial completo en nube', 'Soporte prioritario'].map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#2563eb', fontWeight: 900 }}>✓</span> {f}
                                    </div>
                                ))}
                                <button onClick={() => window.location.href = '/login?view=register'} style={{ marginTop: '1rem', width: '100%', padding: '0.8rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: '#ffffff', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}>
                                    Activar PRO
                                </button>
                            </div>
                        </div>

                        {/* — FAQ — */}
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, textAlign: 'center', marginBottom: '1.5rem' }}>
                            Preguntas Frecuentes
                        </h2>
                        <FaqSection />

                    </div>
                )}


                <AdBanner />

                {/* ── NEW INSPECTION (CTA) — solo usuarios logueados ── */}
                {currentUser && (
                    <Link to="/create-inspection" style={{ textDecoration: 'none' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '1.2rem',
                            background: 'linear-gradient(135deg, rgba(37,99,235,0.95) 0%, rgba(30,58,138,0.95) 100%)',
                            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px', padding: '1.5rem', marginTop: '1.5rem',
                            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 12px 32px rgba(37,99,235,0.3)',
                            position: 'relative', overflow: 'hidden',
                        }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(37,99,235,0.4)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(30,58,138,1) 100%)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.3)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37,99,235,0.95) 0%, rgba(30,58,138,0.95) 100%)'; }}
                        >
                            {/* Decorative background glow */}
                            <div style={{ position: 'absolute', top: '-30px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
                            <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

                            <div style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.1)' }}>
                                <PlusCircle size={28} color="#ffffff" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }} />
                            </div>
                            <div style={{ flex: 1, zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>Nueva Inspección</h4>
                                    <Sparkles size={16} color="#fcd34d" fill="#fcd34d" style={{ animation: 'pulse 2s infinite' }} />
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Comenzá un relevamiento inteligente ahora</p>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                                <ChevronRight size={20} color="#ffffff" strokeWidth={3} />
                            </div>
                        </div>
                    </Link>
                )}

                {/* ── QUICK ACCESS GRID — solo usuarios logueados ── */}
                {currentUser && (
                    <div style={{ marginTop: '2.5rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', fontFamily: 'var(--font-heading)' }}>Herramientas Profesionales</h3>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                            gap: '1.2rem',
                            padding: '0.5rem',
                            marginTop: '0.5rem'
                        }}>
                            {quickLinks.map((item, i) => (
                                <Link key={i} className="stagger-item" to={item.to} style={{ textDecoration: 'none', animationDelay: `${0.1 + (i * 0.03)}s` }}>
                                    <div className="card" style={{
                                        borderRadius: '24px',
                                        padding: '2.2rem 1rem 1.8rem',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                        gap: '1.2rem',
                                        minHeight: '170px', justifyContent: 'center',
                                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.transform = 'translateY(-10px)';
                                        e.currentTarget.style.background = 'var(--color-surface-solid)';
                                        e.currentTarget.style.borderColor = item.color;
                                        e.currentTarget.style.boxShadow = `0 20px 40px ${item.color}15`;
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.background = 'var(--color-surface)';
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                                    }}>
                                        <div style={{
                                            width: '60px', height: '60px', borderRadius: '18px',
                                            background: item.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: item.color,
                                            marginBottom: '0.2rem',
                                            boxShadow: `0 8px 20px ${item.color}20`,
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {React.cloneElement(item.icon, { size: 30 })}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: '1.2', marginBottom: '0.3rem' }}>{item.label}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>{item.sub}</div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── RECENT ACTIVITY — solo usuarios logueados ── */}
                {currentUser && (
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
                                            cursor: 'pointer'
                                        }}
                                            onClick={() => {
                                                if (work.type === 'ATS') navigate('/ats-history');
                                                else if (work.type === 'Carga Fuego') navigate('/fire-load-history');
                                                else if (work.type === 'Inspección') navigate('/history', { state: { view: 'inspections' } });
                                                else if (work.type === 'Matriz') navigate('/history', { state: { view: 'matrices' } });
                                                else if (work.type === 'Informe') navigate('/history', { state: { view: 'reports' } });
                                                else if (work.type === 'Checklist') navigate('/checklists-history');
                                                else if (work.type === 'Iluminación') navigate('/lighting-history');
                                                else if (work.type === 'Permiso') navigate('/work-permit-history');
                                                else if (work.type === 'Eval. Riesgo') navigate('/risk-assessment-history');
                                                else if (work.type === 'Accidente') navigate('/accident-history');
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
                                    <History size={36} color="var(--color-text-muted)" style={{ marginBottom: '0.8rem', opacity: 0.4 }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>No hay actividad reciente</p>
                                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Comenzá creando una nueva inspección</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── SRT NEWS WIDGET ── */}
                <NewsWidget />
        </div>
    );
}
