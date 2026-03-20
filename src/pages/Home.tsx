import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  ClipboardList, PlusCircle, History, User, Users, Settings,
  Flame, BarChart3, ChevronRight, Plus, Gavel, Siren,
  Accessibility, Lock, UserPlus, LogIn, Sparkles,
  Camera, CalendarCheck, Shield, Cpu, Lightbulb, ThermometerSun, Map,
  ShieldCheck, TriangleAlert, KeySquare, ScrollText, Bot, ClipboardCheck, FileText, HardHat, ShieldAlert, PenTool,
  ArrowRight, Activity, BookOpen, Calendar as CalendarIcon, Search, TrendingUp, Star,
  Volume2, ArrowDown, RefreshCw, Leaf, Tent, LucideIcon,
  FlaskConical, CheckCircle2, Droplets
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getCountryNormativa } from '../data/legislationData';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import StarryBackground from '../components/StarryBackground';
import OnboardingModal from '../components/OnboardingModal';
import StickyCtaBanner from '../components/StickyCtaBanner';
import StatsBar from '../components/StatsBar';
import NewsWidget from '../components/NewsWidget';

// Tipos
interface StatItem {
  label: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  grad: string;
  key: string;
}

interface QuickLink {
  to: string;
  icon: React.ReactElement;
  label: string;
  sub: string;
  color: string;
  bg: string;
  premium: boolean;
}

interface WorkItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  type: string;
}

interface DailyInsight {
  category: string;
  title: string;
  content: string;
}

interface PersonalData {
  name: string;
  profession?: string;
  country?: string;
}

const typeColors: Record<string, { bg: string; text: string; icon: React.ReactElement }> = {
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

let userCountry = 'argentina';
try {
  const savedData = localStorage.getItem('personalData');
  if (savedData) {
    const parsed = JSON.parse(savedData);
    userCountry = parsed.country?.toLowerCase() || 'argentina';
  }
} catch (error) {
  console.error('[HOME] Error parsing personalData:', error);
}

const getRegSub = (module: string): string => {
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
  }
  return 'Referencia Normativa Local';
};

const quickLinks: QuickLink[] = [
  { to: '/ats', icon: <ShieldCheck size={26} />, label: 'ATS', sub: 'Análisis Trabajo Seguro', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true },
  { to: '/ai-advisor', icon: <Bot size={26} />, label: 'Asesor IA', sub: 'Consultas de Seguridad', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', premium: true },
  { to: '/ai-camera', icon: <Camera size={26} />, label: 'Cámara IA', sub: 'Detección EPP', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true },
  { to: '/emergency-bot', icon: <Siren size={26} />, label: 'Emergencias', sub: 'Chatbot 24/7', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true },
  { to: '/extinguisher-ai', icon: <Flame size={26} />, label: 'Extintores IA', sub: 'Reconocimiento', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true },
  { to: '/training-management', icon: <Users size={26} />, label: 'Capacitar', sub: 'Planillas y Asistencia', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true },
  { to: '/fire-load', icon: <Flame size={26} />, label: 'Carga Fuego', sub: getRegSub('fire'), color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true },
  { to: '/checklists', icon: <ClipboardList size={26} />, label: 'Checklists', sub: 'Herramientas y Equipos', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', premium: true },
  { to: '/ppe-tracker', icon: <HardHat size={26} />, label: 'Control EPP', sub: 'Vencimientos', color: '#10b981', bg: 'rgba(16,185,129,0.08)', premium: true },
  { to: '/ergonomics', icon: <Accessibility size={26} />, label: 'Ergonomía', sub: getRegSub('ergo'), color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true },
  { to: '/thermal-stress', icon: <ThermometerSun size={26} />, label: 'Estrés Térmico', sub: getRegSub('thermal'), color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true },
  { to: '/lighting', icon: <Lightbulb size={26} />, label: 'Iluminación', sub: getRegSub('lighting'), color: '#eab308', bg: 'rgba(234,179,8,0.1)', premium: true },
  { to: '/reports', icon: <ScrollText size={26} />, label: 'Informes', sub: 'Técnicos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true },
  { to: '/accident-investigation', icon: <Siren size={26} />, label: 'Investigación', sub: 'Accidentes / Árbol', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true },
  { to: '/legislation', icon: <Gavel size={26} />, label: 'Legislación', sub: 'Biblioteca Legal', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true },
  { to: '/risk-maps', icon: <Map size={26} />, label: 'Mapas', sub: 'Croquis de Riesgos', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true },
  { to: '/extinguishers', icon: <Flame size={26} />, label: 'Matafuegos', sub: 'Control y Vencimientos', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true },
  { to: '/work-permit', icon: <KeySquare size={26} />, label: 'Permisos', sub: 'Tareas Críticas', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', premium: true },
  { to: '/ai-general-camera', icon: <ShieldAlert size={26} />, label: 'Riesgos IA', sub: 'Análisis de Entorno', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', premium: true },
  { to: '/drills', icon: <Siren size={26} />, label: 'Simulacros', sub: 'Actas de Evacuación', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true },
  { to: '/stop-cards', icon: <TriangleAlert size={26} />, label: 'Tarjetas STOP', sub: 'Observaciones', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true },
  { to: '/audit', icon: <ClipboardCheck size={26} />, label: 'Auditorías', sub: 'Control Interno y EHS', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true },
  { to: '/capa', icon: <CheckCircle2 size={26} />, label: 'CAPA', sub: 'Acciones Correctivas', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true },
  { to: '/chemical-safety', icon: <FlaskConical size={26} />, label: 'Seguridad Química', sub: 'Gestión de Sustancias y SGA', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true },
  { to: '/noise-assessment', icon: <Volume2 size={26} />, label: 'Ruido', sub: 'Evaluación de Niveles Sonoros', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true },
  { to: '/environmental', icon: <Droplets size={26} />, label: 'Medio Ambiente', sub: 'Monitoreo y Control', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true },
  { to: '/confined-space', icon: <Tent size={26} />, label: 'Espacios Confinados', sub: 'Permisos y Control', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true },
  { to: '/working-at-height', icon: <HardHat size={26} />, label: 'Trabajo en Altura', sub: 'Permisos y EPP Crítico', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true },
  { to: '/loto', icon: <Lock size={26} />, label: 'LOTO', sub: 'Bloqueo y Etiquetado', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true },
];

// Counter hook
function useCounter(target: number, duration = 1800): number {
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

interface CounterItemProps {
  value: number;
  label: string;
  suffix?: string;
}

const CounterItem: React.FC<CounterItemProps> = ({ value, label, suffix = '' }) => {
  const count = useCounter(value);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-hero-text)', lineHeight: 1 }}>
        {count.toLocaleString('es-AR')}{suffix}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--color-hero-subtext)', fontWeight: 600, marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
};

export default function Home(): React.ReactElement {
  const navigate = useNavigate();
  const { currentUser } = useAuth() as { currentUser: FirebaseUser | null };
  const { syncPulse } = useSync();
  const { isPro, daysRemaining } = usePaywall();

  const typeColors: Record<string, { bg: string, text: string, icon: React.ReactElement }> = {
    'ATS': { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', icon: <ShieldCheck size={20} /> },
    'Carga Fuego': { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', icon: <Flame size={20} /> },
    'Inspección': { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', icon: <ClipboardCheck size={20} /> },
    'Matriz': { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', icon: <TriangleAlert size={20} /> },
    'Informe': { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', icon: <ScrollText size={20} /> },
    'Checklist': { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', icon: <ClipboardList size={20} /> },
    'Iluminación': { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', icon: <Lightbulb size={20} /> },
    'Permiso': { bg: 'rgba(37, 99, 235, 0.1)', text: '#1d4ed8', icon: <KeySquare size={20} /> },
    'Eval. Riesgo': { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', icon: <TriangleAlert size={20} /> },
    'Accidente': { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', icon: <Siren size={20} /> },
  };
  
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [daysLeft, setDaysLeft] = useState<number | typeof Infinity | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [stats, setStats] = useState<StatItem[]>([
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
  const [recentWorks, setRecentWorks] = useState<WorkItem[]>([]);
  const [userName, setUserName] = useState<string>('Profesional');
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null);

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
        const parsed = JSON.parse(savedData) as PersonalData;
        let name = parsed.name || 'Profesional';
        if (parsed.profession) {
          const prof = parsed.profession.toLowerCase();
          if (prof.includes('lic')) name = `Lic. ${name}`;
          else if (prof.includes('téc')) name = `Téc. ${name}`;
          else if (prof.includes('ing')) name = `Ing. ${name}`;
        }
        setUserName(name);
      }

      setIsSubscribed(isPro());
      setDaysLeft(daysRemaining());
    }

    const loadStats = (): void => {
      const newStats = stats.map(stat => {
        try {
          const history = localStorage.getItem(stat.key);
          const count = history ? JSON.parse(history).length : 0;
          return { ...stat, value: count };
        } catch (e) {
          console.error(`[HOME] Error parsing ${stat.key}:`, e);
          return { ...stat, value: 0 };
        }
      });
      setStats(newStats);
    };

    const loadRecent = (): void => {
      try {
        const safeParse = (key: string) => {
          try {
            return JSON.parse(localStorage.getItem(key) || '[]');
          } catch (e) {
            console.error(`[HOME] Error parsing ${key}:`, e);
            return [];
          }
        };

        const ats = safeParse('ats_history');
        const fire = safeParse('fireload_history');
        const insp = safeParse('inspections_history');
        const matrix = safeParse('risk_matrix_history');
        const reports = safeParse('reports_history');
        const tools = safeParse('tool_checklists_history');
        const lighting = safeParse('lighting_history');
        const accidents = safeParse('accident_history');
        const permits = safeParse('work_permits_history');
        const riskAssessments = safeParse('risk_assessment_history');

        const combined: WorkItem[] = [
          ...ats.map((a: any) => ({ id: a.id, title: a.empresa, subtitle: a.obra, date: a.fecha, type: 'ATS' })),
          ...fire.map((f: any) => ({ id: f.id, title: f.empresa, subtitle: f.sector, date: f.createdAt, type: 'Carga Fuego' })),
          ...insp.map((i: any) => ({ id: i.id, title: i.name, subtitle: i.location, date: i.date, type: 'Inspección' })),
          ...matrix.map((m: any) => ({ id: m.id, title: m.name, subtitle: m.location, date: m.createdAt, type: 'Matriz' })),
          ...reports.map((r: any) => ({ id: r.id, title: r.title, subtitle: r.company, date: r.createdAt, type: 'Informe' })),
          ...tools.map((t: any) => ({ id: t.id, title: t.equipo, subtitle: t.empresa, date: t.fecha, type: 'Checklist' })),
          ...lighting.map((l: any) => ({ id: l.id, title: l.empresa, subtitle: l.sector, date: l.date, type: 'Iluminación' })),
          ...permits.map((p: any) => ({ id: p.id, title: p.empresa, subtitle: p.obra, date: p.createdAt, type: 'Permiso' })),
          ...riskAssessments.map((r: any) => ({ id: r.id, title: r.name, subtitle: r.location, date: r.date || r.createdAt, type: 'Eval. Riesgo' })),
          ...accidents.map((acc: any) => ({ id: acc.id, title: acc.victimaNombre, subtitle: acc.empresa, date: acc.date, type: 'Accidente' })),
        ]
        .filter(item => item.date || item.fecha || item.createdAt)
        .sort((a, b) => new Date(b.date || b.fecha || b.createdAt || 0).getTime() - new Date(a.date || a.fecha || a.createdAt || 0).getTime())
        .slice(0, 4);

        setRecentWorks(combined);
      } catch (error) {
        console.error('[HOME] Error loading recent works:', error);
        setRecentWorks([]);
      }
    };

    const loadDailyInsight = async (): Promise<void> => {
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

    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, [syncPulse, currentUser]);

  return (
    <div className="page-transition" style={{ paddingBottom: '4rem' }}>
      {!currentUser && <StickyCtaBanner />}

      {/* HERO BANNER */}
      <div className="home-hero-banner" style={{
        padding: 'clamp(7rem, 12vw, 8.5rem) 1.2rem 3rem',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '0',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        width: '100%',
        boxSizing: 'border-box',
        background: '#0f172a'
      }}>
        <StarryBackground />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
            <div className="stagger-item" style={{ animationDelay: '0.1s' }}>
              <p style={{ color: 'var(--color-hero-accent)', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                {currentUser ? 'Dashboard Profesional' : 'Inteligencia Artificial H&S'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1rem' }}>
                <img src="/logo.png" alt="Logo de Asistente HYS" style={{ width: '64px', height: '64px', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))' }} />
                <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, color: 'var(--color-hero-text)', margin: 0, lineHeight: 0.9, letterSpacing: '-2px', fontFamily: 'var(--font-heading)' }}>
                  {currentUser ? (
                    <span>{userName} {isSubscribed && <Sparkles size={28} color="#f59e0b" fill="#f59e0b" />}</span>
                  ) : 'Asistente HYS'}
                </h1>
              </div>
              <p style={{ color: 'var(--color-hero-subtext)', fontSize: '1.2rem', marginTop: '1.5rem', fontWeight: 500, maxWidth: '550px', lineHeight: 1.6 }}>
                {currentUser
                  ? 'Gestioná riesgos, ATS y cumplimiento normativo con IA.'
                  : 'Creá ATS, Carga de Fuego e Informes Técnicos en minutos. Validado por normativa de Argentina, Chile, Bolivia, Paraguay y Uruguay.'}
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

          {/* Stats for logged users */}
          {currentUser && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '1.8rem' }}>
              {stats.map((stat, i) => (
                <div key={i}
                  onClick={() => navigate('/history')}
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
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  <div style={{ color: 'var(--color-primary)', marginBottom: '0.6rem', opacity: 0.9 }}>
                    {/* @ts-ignore */}
                    {React.cloneElement(stat.icon, { size: 24 })}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.4rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Social Proof */}
          {!currentUser && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', padding: '1.5rem 1rem 0', flexWrap: 'wrap' }}>
              <CounterItem value={1240} label="Profesionales registrados" suffix="+" />
              <CounterItem value={8500} label="Reportes generados" suffix="+" />
              <CounterItem value={11} label="Módulos disponibles" suffix="" />
            </div>
          )}

          {/* Daily Insight */}
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


      {/* Features Grid - Visible to visitors */}
      {!currentUser && (
        <div id="tools" style={{ marginTop: '2.5rem' }}>
          <h2 style={{
            fontSize: 'clamp(1.3rem, 4vw, 1.5rem)',
            fontWeight: 900,
            textAlign: 'center',
            marginBottom: '0.4rem',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Todo lo que necesitás en una sola App
          </h2>
          <p style={{
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            11+ módulos profesionales con IA, gratis para usar
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '1rem'
          }}>
            {quickLinks.map((link, i) => (
              <Link
                key={i}
                to={link.to}
                className="card stagger-item"
                style={{
                  textDecoration: 'none',
                  padding: '1.5rem',
                  borderRadius: '20px',
                  background: link.bg,
                  border: `2px solid ${link.color}20`,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  animationDelay: `${0.1 + (i * 0.03)}s`
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = link.color;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = `${link.color}20`;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '14px',
                    background: link.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: link.color
                  }}>
                    {link.icon}
                  </div>
                  {link.premium && (
                    <div style={{
                      padding: '0.25rem 0.6rem',
                      background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                      borderRadius: '20px',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      PRO
                    </div>
                  )}
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {link.label}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {link.sub}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  color: link.color,
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  <span>Acceder</span>
                  <ChevronRight size={16} />
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: '4rem', maxWidth: '800px', margin: '4rem auto 0' }}>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 4vw, 1.5rem)',
              fontWeight: 900,
              textAlign: 'center',
              marginBottom: '2rem',
              color: 'var(--color-text)'
            }}>
              Preguntas Frecuentes
            </h2>
            <FaqSection />
          </div>
        </div>
      )}


      {/* Dashboard for Logged Users */}
      {currentUser && (
        <div style={{ marginTop: '2.5rem', maxWidth: '1200px', margin: '2.5rem auto 0', padding: '0 1rem' }}>
          
          {/* Professional Tools Grid */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.3rem, 4vw, 1.5rem)',
              fontWeight: 900,
              marginBottom: '1.5rem',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <Star size={24} fill="#f59e0b" color="#f59e0b" />
              Herramientas Profesionales
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: '1rem'
            }}>
              {quickLinks.map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  className="card stagger-item"
                  style={{
                    textDecoration: 'none',
                    padding: '1.2rem',
                    borderRadius: '20px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    animationDelay: `${0.1 + (i * 0.03)}s`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = link.color;
                    e.currentTarget.style.boxShadow = `0 10px 20px ${link.color}15`;
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: link.color + '15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: link.color,
                    flexShrink: 0
                  }}>
                    {link.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {link.label}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {link.sub}
                    </p>
                  </div>
                  <ChevronRight size={18} color="var(--color-text-muted)" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Works */}
          {recentWorks.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: 'clamp(1.3rem, 4vw, 1.5rem)',
                fontWeight: 900,
                marginBottom: '1.5rem',
                color: 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <History size={24} color="var(--color-primary)" />
                Trabajos Recientes
              </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentWorks.map((work, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{
                  width: '45px',
                  height: '45px',
                  background: typeColors[work.type]?.bg || 'rgba(59,130,246,0.1)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: typeColors[work.type]?.text || '#3b82f6',
                  flexShrink: 0
                }}>
                  {typeColors[work.type]?.icon || <FileText size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {work.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                    <span>{work.subtitle}</span>
                    <span>•</span>
                    <span>{new Date(work.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      background: typeColors[work.type]?.bg || 'rgba(59,130,246,0.1)',
                      color: typeColors[work.type]?.text || '#3b82f6',
                      borderRadius: '20px',
                      fontSize: '0.7rem',
                      fontWeight: 700
                    }}>
                      {work.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/history')}
                  style={{
                    padding: '0.6rem 1rem',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  Ver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      )}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}

// FAQ Component
function FaqSection(): React.ReactElement {
  const [open, setOpen] = React.useState<number | null>(null);
  const savedData = localStorage.getItem('personalData');
  let userCountry = 'argentina';
  try {
    if (savedData) {
      const parsed = JSON.parse(savedData);
      userCountry = parsed.country?.toLowerCase() || 'argentina';
    }
  } catch (e) {}

  const items = [
    { q: '¿Qué países están soportados?', a: 'Asistente HYS está totalmente legalizado para Argentina, Chile, Bolivia, Paraguay y Uruguay. Los cálculos y el Asesor IA se adaptan automáticamente a la normativa de tu país seleccionado al registrarte.' },
    { q: '¿Es realmente gratis?', a: 'Sí. Podés usar todos los módulos de cálculo, ATS, matrices, asesor IA y cámara sin pagar nada. El plan PRO agrega la impresión/PDF y el historial en nube.' },
    {
      q: userCountry === 'argentina' ? '¿Cumple con la normativa argentina?' : '¿Cumple con la normativa local?',
      a: userCountry === 'argentina'
        ? 'Los cálculos están basados en la Ley 19.587, el Dec. 351/79, resoluciones SRT y normativas vigentes.'
        : `Los cálculos y módulos están adaptados a las normativas vigentes de ${userCountry.charAt(0).toUpperCase() + userCountry.slice(1)}.`
    },
    { q: '¿Mis datos están seguros?', a: 'Sí. Usamos Firebase (Google) para autenticación y almacenamiento cifrado. Nunca compartimos tus datos con terceros.' },
    { q: '¿Funciona en el celular?', a: 'Perfecto. Está optimizada para mobile y podés instalarla directamente en tu pantalla de inicio como una app nativa.' },
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
