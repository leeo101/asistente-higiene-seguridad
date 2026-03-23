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
import StickyCtaBanner from '../components/StickyCtaBanner';
import StatsBar from '../components/StatsBar';

import NewsWidget from '../components/NewsWidget';
import MarketingLanding from '../components/MarketingLanding';
import ModulePreview from '../components/ModulePreview';


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
  category: string;
  featured?: boolean;
  badge?: string;
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
  const norms: any = getCountryNormativa(userCountry);
  return norms[module] || 'Referencia Normativa Local';
};

const quickLinks: QuickLink[] = [
  { to: '/ats', icon: <ShieldCheck size={26} />, label: 'ATS', sub: 'Análisis Trabajo Seguro', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'docs', featured: true },
  { to: '/ai-advisor', icon: <Bot size={26} />, label: 'Asesor IA', sub: 'Consultas de Seguridad', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', premium: true, category: 'ia', featured: true, badge: 'IA ✨' },
  { to: '/ai-camera', icon: <Camera size={26} />, label: 'Cámara IA', sub: 'Detección EPP', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'ia', featured: true, badge: 'IA ✨' },
  { to: '/emergency-bot', icon: <Siren size={26} />, label: 'Emergencias', sub: 'Chatbot 24/7', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'ia', badge: 'IA ✨' },
  { to: '/extinguisher-ai', icon: <Flame size={26} />, label: 'Extintores IA', sub: 'Reconocimiento', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'ia', badge: 'IA ✨' },
  { to: '/training-management', icon: <Users size={26} />, label: 'Capacitar', sub: 'Planillas y Asistencia', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'management' },
  { to: '/fire-load', icon: <Flame size={26} />, label: 'Carga Fuego', sub: getRegSub('fire'), color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true, category: 'specific' },
  { to: '/checklists', icon: <ClipboardList size={26} />, label: 'Checklists', sub: 'Herramientas y Equipos', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', premium: true, category: 'docs' },
  { to: '/ppe-tracker', icon: <HardHat size={26} />, label: 'Control EPP', sub: 'Vencimientos', color: '#10b981', bg: 'rgba(16,185,129,0.08)', premium: true, category: 'management' },
  { to: '/ergonomics', icon: <Accessibility size={26} />, label: 'Ergonomía', sub: getRegSub('ergo'), color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'specific' },
  { to: '/thermal-stress', icon: <ThermometerSun size={26} />, label: 'Estrés Térmico', sub: getRegSub('thermal'), color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true, category: 'specific' },
  { to: '/lighting', icon: <Lightbulb size={26} />, label: 'Iluminación', sub: getRegSub('lighting'), color: '#eab308', bg: 'rgba(234,179,8,0.1)', premium: true, category: 'specific' },
  { to: '/reports', icon: <ScrollText size={26} />, label: 'Informes', sub: 'Técnicos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'docs' },
  { to: '/accident-investigation', icon: <Siren size={26} />, label: 'Investigación', sub: 'Accidentes / Árbol', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management' },
  { to: '/legislation', icon: <Gavel size={26} />, label: 'Legislación', sub: 'Biblioteca Legal', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'docs' },
  { to: '/risk-maps', icon: <Map size={26} />, label: 'Mapas', sub: 'Croquis de Riesgos', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'docs' },
  { to: '/extinguishers', icon: <Flame size={26} />, label: 'Matafuegos', sub: 'Control y Vencimientos', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'management' },
  { to: '/work-permit', icon: <KeySquare size={26} />, label: 'Permisos', sub: 'Tareas Críticas', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', premium: true, category: 'critical', featured: true },
  { to: '/ai-general-camera', icon: <ShieldAlert size={26} />, label: 'Riesgos IA', sub: 'Análisis de Entorno', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', premium: true, category: 'ia', badge: 'IA ✨' },
  { to: '/drills', icon: <Siren size={26} />, label: 'Simulacros', sub: 'Actas de Evacuación', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management' },
  { to: '/stop-cards', icon: <TriangleAlert size={26} />, label: 'Tarjetas STOP', sub: 'Observaciones', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management' },
  { to: '/audit', icon: <ClipboardCheck size={26} />, label: 'Auditorías', sub: 'Control Interno y EHS', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'management' },
  { to: '/capa', icon: <CheckCircle2 size={26} />, label: 'CAPA', sub: 'Acciones Correctivas', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'management' },
  { to: '/chemical-safety', icon: <FlaskConical size={26} />, label: 'Seguridad Química', sub: 'Gestión de Sustancias y SGA', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'specific' },
  { to: '/noise-assessment', icon: <Volume2 size={26} />, label: 'Ruido', sub: 'Evaluación de Niveles Sonoros', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'specific' },
  { to: '/environmental', icon: <Droplets size={26} />, label: 'Medio Ambiente', sub: 'Monitoreo y Control', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'specific' },
  { to: '/confined-space', icon: <Tent size={26} />, label: 'Espacios Confinados', sub: 'Permisos y Control', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'critical' },
  { to: '/working-at-height', icon: <HardHat size={26} />, label: 'Trabajo en Altura', sub: 'Permisos y EPP Crítico', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'critical' },
  { to: '/loto', icon: <Lock size={26} />, label: 'LOTO', sub: 'Bloqueo y Etiquetado', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'critical' },
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
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'ia', label: 'IA y Automatización' },
    { id: 'docs', label: 'Documentación' },
    { id: 'critical', label: 'Trabajos Críticos' },
    { id: 'management', label: 'Gestión y Auditoría' },
    { id: 'specific', label: 'Específicos' }
  ];

  const filteredLinks = quickLinks.filter(link => {
    const matchesCategory = activeCategory === 'all' || link.category === activeCategory;
    const matchesSearch = link.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          link.sub.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });


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

      setIsSubscribed(isPro);
      setDaysLeft(daysRemaining);
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

  if (!currentUser && activePreview) {
    return <ModulePreview path={activePreview} onBack={() => setActivePreview(null)} />;
  }

  return (
    <div className="page-transition" style={{ paddingBottom: '4rem' }}>

      {!currentUser && <StickyCtaBanner />}

      {/* HERO BANNER / DASHBOARD HEADER */}
      {!currentUser ? (
        <div className="home-hero-banner" style={{
          padding: 'clamp(8rem, 12vw, 10rem) 1.2rem 6rem',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '0',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          width: '100%',
          boxSizing: 'border-box',
          background: 'radial-gradient(circle at top right, #1e3a8a, #020617)'
        }}>
          <StarryBackground />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '4rem', alignItems: 'center' }}>
            <div className="stagger-item" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '100px', marginBottom: '2rem' }}>
                <Sparkles size={16} color="#60a5fa" />
                <span style={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>Plataforma H&S con IA</span>
              </div>
              <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 900, color: 'white', margin: '0 0 1.5rem', lineHeight: 1.1, letterSpacing: '-2px', fontFamily: 'var(--font-heading)' }}>
                El futuro de la prevención <span style={{ background: 'linear-gradient(to right, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ya llegó.</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', marginBottom: '2.5rem', fontWeight: 500, maxWidth: '550px', lineHeight: 1.6 }}>
                Creá ATS, Carga de Fuego e Informes Técnicos en minutos. Validado por la normativa de toda la región.
              </p>
              <div className="hero-buttons stagger-item" style={{ animationDelay: '0.3s', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => navigate('/login', { state: { view: 'register' } })} className="glow-button hover-lift" style={{ padding: '1.1rem 2.5rem', fontSize: '1.1rem' }}>
                  Comenzar Gratis <ArrowRight size={20} style={{ display: 'inline', verticalAlign: 'middle', margin: '-2px 0 0 0.5rem' }} />
                </button>
                <button onClick={() => navigate('/login', { state: { view: 'login' } })} style={{ padding: '1.1rem 2.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(12px)', fontSize: '1.1rem', transition: 'all 0.3s ease' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  Ingresar
                </button>
              </div>
              {/* Stats inline */}
              <div style={{ display: 'flex', gap: '2.5rem', marginTop: '3.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                <CounterItem value={1240} label="Profesionales" suffix="+" />
                <CounterItem value={8500} label="Reportes" suffix="+" />
              </div>
            </div>
            
            {/* The Glass Mockup */}
            <div className="stagger-item hidden-mobile" style={{ animationDelay: '0.4s', perspective: '1000px' }}>
              <div className="glass-mockup" style={{ transform: 'rotateY(-15deg) rotateX(5deg)', transformStyle: 'preserve-3d', padding: '2rem', transition: 'transform 0.5s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'rotateY(0) rotateX(0)' } onMouseOut={e => e.currentTarget.style.transform = 'rotateY(-15deg) rotateX(5deg)' }>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--color-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><ShieldCheck size={24} /></div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>Análisis de Trabajo Seguro</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Generado por IA en 1.2s</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                  <div className="skeleton-text" style={{ width: '100%', background: 'rgba(255,255,255,0.1)' }}></div>
                  <div className="skeleton-text" style={{ width: '80%', background: 'rgba(255,255,255,0.1)' }}></div>
                  <div className="skeleton-text" style={{ width: '90%', background: 'rgba(255,255,255,0.1)', marginBottom: 0 }}></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '1rem', borderRadius: '16px' }}>
                    <CheckCircle2 color="#10b981" size={24} style={{ marginBottom: '0.8rem' }} />
                    <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.9rem' }}>Normativa</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '1rem', borderRadius: '16px' }}>
                    <FileText color="#60a5fa" size={24} style={{ marginBottom: '0.8rem' }} />
                    <div style={{ color: '#60a5fa', fontWeight: 800, fontSize: '0.9rem' }}>PDF Listo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DASHBOARD HERO BANNER */
        <div style={{ padding: 'clamp(6rem, 8vw, 7rem) 1.2rem 2rem', background: 'var(--color-hero-bg)', borderBottom: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
          <StarryBackground />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
            <div className="stagger-item" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', marginBottom: '1.5rem', backdropFilter: 'blur(8px)' }}>
                <Shield size={14} color="#60a5fa" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Dashboard Privado</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px', padding: '10px', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
                  <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                    Hola, {userName} {isSubscribed && <Sparkles size={24} color="#f59e0b" fill="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.5rem' }}/>}
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', margin: '0.5rem 0 0', fontWeight: 500 }}>
                    Gestioná riesgos, ATS y cumplimiento normativo con IA.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats for logged users */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '2.5rem' }}>
              {stats.map((stat, i) => (
                <div key={i}
                  onClick={() => navigate('/history')}
                  className="glass-card stagger-item hover-lift"
                  style={{
                    borderRadius: '20px',
                    padding: '1.2rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    animationDelay: `${0.2 + (i * 0.05)}s`
                  }}
                >
                  <div style={{ color: 'var(--color-primary)', marginBottom: '0.8rem', opacity: 0.9 }}>
                    {/* @ts-ignore */}
                    {React.cloneElement(stat.icon, { size: 24 })}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.5rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
            {/* Daily Insight */}
            {currentUser && dailyInsight && (
              <div className="stagger-item" style={{
                marginTop: '1.5rem',
                padding: '1.2rem',
                borderRadius: '20px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                animationDelay: '0.5s'
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
      )}


      {/* Marketing Landing Content - Primary for visitors */}
      {!currentUser && (
        <div style={{ marginTop: '0' }}>
          <MarketingLanding onStart={() => navigate('/login', { state: { view: 'register' } })} />
          
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
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                    fontWeight: 900,
                    margin: 0,
                    color: 'var(--color-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    letterSpacing: '-1px'
                  }}>
                    <Star size={28} fill="#f59e0b" color="#f59e0b" />
                    Bóveda Pro
                  </h2>
                  <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                    Herramientas y módulos avanzados para tu gestión de seguridad.
                  </p>
                </div>
                
                {/* Search Bar */}
                <div style={{ position: 'relative', minWidth: '250px', flex: '1 1 auto', maxWidth: '400px' }}>
                  <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Buscar herramientas..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem 0.8rem 2.8rem',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--color-text)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.3s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Categories Tabs */}
              <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '100px',
                      border: '1px solid',
                      borderColor: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-border)',
                      background: activeCategory === cat.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      color: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1rem',
              gridAutoRows: 'auto'
            }}>
              {filteredLinks.length > 0 ? filteredLinks.map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  className="card"
                  style={{
                    textDecoration: 'none',
                    padding: '1rem',
                    borderRadius: '16px',
                    background: `linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))`,
                    border: '1px solid var(--color-border)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = `${link.color}50`;
                    e.currentTarget.style.boxShadow = `0 8px 25px ${link.color}15`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = `linear-gradient(145deg, ${link.bg}, rgba(255,255,255,0.02))`;
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.background = `linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))`;
                  }}
                >
                  {/* Badge */}
                  {link.badge && (
                    <div style={{
                      position: 'absolute',
                      top: '0.8rem',
                      right: '0.8rem',
                      background: `linear-gradient(135deg, ${link.color}, ${link.color}cc)`,
                      color: '#fff',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '100px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      boxShadow: `0 2px 10px ${link.color}30`,
                      zIndex: 2
                    }}>
                      {link.badge}
                    </div>
                  )}

                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: link.color + '15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: link.color,
                    flexShrink: 0,
                    border: `1px solid ${link.color}20`
                  }}>
                    {React.cloneElement(link.icon as React.ReactElement<any>, { size: 22 })}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {link.label}
                    </h3>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4, opacity: 0.8 }}>
                      {link.sub}
                    </p>
                  </div>

                  <div style={{ display: 'flex', opacity: 0.4, transition: 'all 0.3s' }} className="chevron-icon">
                    <ChevronRight size={18} color="var(--color-text-muted)" />
                  </div>
                </Link>
              )) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
                  <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>No se encontraron herramientas</h3>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Probá con otro término de búsqueda.</p>
                </div>
              )}
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
      {/* Removed legacy onboarding modal in favor of MarketingLanding */}

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
