import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  ClipboardText, House, ClockCounterClockwise, User, Users, GearSix,
  Fire, ChartBar, CaretRight, Plus, Gavel, Siren,
  PersonArmsSpread, Lock, UserPlus, SignIn,
  Camera, CalendarCheck, Shield, Cpu, Lightbulb, ThermometerHot, MapTrifold,
  ShieldCheck, Warning, Key, Scroll, Robot, FileText, HardHat, ShieldWarning, Pen,
  ArrowRight, X, SignOut, CalendarBlank,
  ChatText, Sun, Moon, Star, ChartPieSlice,
  CreditCard, Crown, Image as ImageIconPh, UploadSimple,
  CheckCircle, Info, Bell, Pulse as Activity,
  Tent, Drop as Droplets, SpeakerHigh, Flask, MagnifyingGlass, TrendUp as TrendingUp, Truck, Crane, Timer, Sparkle
} from '@phosphor-icons/react';
import { User as FirebaseUser } from 'firebase/auth';
import { getCountryNormativa } from '../data/legislationData';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import AnimatedPage from '../components/AnimatedPage';
import AdBanner from '../components/AdBanner';
import StarryBackground from '../components/StarryBackground';
import StickyCtaBanner from '../components/StickyCtaBanner';
import StatsBar from '../components/StatsBar';
import NewsWidget from '../components/NewsWidget';

// Landing components — lazy porque solo se renderizan para usuarios no autenticados
const InteractiveHeroDemo = lazy(() => import('../components/landing/InteractiveHeroDemo'));
const WallOfLove = lazy(() => import('../components/landing/WallOfLove'));
const BeforeAndAfter = lazy(() => import('../components/landing/BeforeAndAfter'));
const RoiCalculator = lazy(() => import('../components/landing/RoiCalculator'));
const StatsShowcase = lazy(() => import('../components/landing/StatsShowcase'));
const FeaturesShowcase = lazy(() => import('../components/landing/FeaturesShowcase'));
const ModulesGrid = lazy(() => import('../components/landing/ModulesGrid'));
const PricingDark = lazy(() => import('../components/landing/PricingDark'));
const FaqAndCtaDark = lazy(() => import('../components/landing/FaqAndCtaDark'));

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
  'ATS': { bg: 'rgba(16,185,129,0.12)', text: '#10b981', icon: <ChartBar weight="duotone" size={18} /> },
  'Carga Fuego': { bg: 'rgba(249,115,22,0.12)', text: '#f97316', icon: <Fire weight="duotone" size={18} /> },
  'Inspección': { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', icon: <ClipboardText weight="duotone" size={18} /> },
  'Matriz': { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6', icon: <ShieldWarning weight="duotone" size={18} /> },
  'Informe': { bg: 'rgba(236,72,153,0.12)', text: '#ec4899', icon: <FileText weight="duotone" size={18} /> },
  'Checklist': { bg: 'rgba(20,184,166,0.12)', text: '#14b8a6', icon: <ClipboardText weight="duotone" size={18} /> },
  'Iluminación': { bg: 'rgba(234,179,8,0.12)', text: '#eab308', icon: <Lightbulb weight="duotone" size={18} /> },
  'Permiso': { bg: 'rgba(37,99,235,0.12)', text: '#2563eb', icon: <HardHat weight="duotone" size={18} /> },
  'Eval. Riesgo': { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', icon: <Shield weight="duotone" size={18} /> },
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
  { to: '/ai-advisor', icon: <Robot weight="duotone" size={26} />, label: 'Asesor IA', sub: 'Consultas de Seguridad', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', premium: true, category: 'ia', featured: true, badge: 'IA' },
  { to: '/ats', icon: <ShieldCheck weight="duotone" size={26} />, label: 'ATS', sub: 'Análisis Trabajo Seguro', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'docs', featured: true },
  { to: '/audit', icon: <ClipboardText weight="duotone" size={26} />, label: 'Auditorías', sub: 'Control Interno y EHS', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'management' },
  { to: '/ai-camera-manager', icon: <Camera weight="duotone" size={26} />, label: 'Cámara IA', sub: 'Detección EPP', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'ia', featured: true, badge: 'IA' },
  { to: '/capa', icon: <CheckCircle weight="duotone" size={26} />, label: 'CAPA', sub: 'Acciones Correctivas', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'management' },
  { to: '/training-management', icon: <Users weight="duotone" size={26} />, label: 'Capacitar', sub: 'Planillas y Asistencia', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'management' },
  { to: '/fire-load', icon: <Fire weight="duotone" size={26} />, label: 'Carga Fuego', sub: getRegSub('fire'), color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true, category: 'specific' },
  { to: '/toolbox-talk', icon: <ChatText weight="duotone" size={26} />, label: 'Charlas 5 Min', sub: 'Registro de Capacitación Diaria', color: '#0052CC', bg: 'rgba(0,82,204,0.1)', premium: true, category: 'management', badge: 'Nuevo', featured: true },
  { to: '/checklists', icon: <ClipboardText weight="duotone" size={26} />, label: 'Checklists', sub: 'Herramientas y Equipos', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', premium: true, category: 'docs' },
  { to: '/ppe-tracker', icon: <HardHat weight="duotone" size={26} />, label: 'Control EPP', sub: 'Vencimientos', color: '#10b981', bg: 'rgba(16,185,129,0.08)', premium: true, category: 'management' },
  { to: '/ergonomics', icon: <PersonArmsSpread weight="duotone" size={26} />, label: 'Ergonomía', sub: getRegSub('ergo'), color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'specific' },
  { to: '/confined-space', icon: <Tent weight="duotone" size={26} />, label: 'Espacios Confinados', sub: 'Permisos y Control', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'critical' },
  { to: '/thermal-stress', icon: <ThermometerHot weight="duotone" size={26} />, label: 'Estrés Térmico', sub: getRegSub('thermal'), color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true, category: 'specific' },
  { to: '/extinguisher-ai', icon: <Fire weight="duotone" size={26} />, label: 'Extintores IA', sub: 'Reconocimiento', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'ia', badge: 'IA' },
  { to: '/lighting', icon: <Lightbulb weight="duotone" size={26} />, label: 'Iluminación', sub: getRegSub('lighting'), color: '#eab308', bg: 'rgba(234,179,8,0.1)', premium: true, category: 'specific' },
  { to: '/reports', icon: <Scroll weight="duotone" size={26} />, label: 'Informes', sub: 'Técnicos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'docs' },
  { to: '/accident-investigation', icon: <Siren weight="duotone" size={26} />, label: 'Investigación', sub: 'Accidentes / Árbol', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management' },
  { to: '/safety-kpis', icon: <ChartPieSlice weight="duotone" size={26} />, label: 'KPIs Seguridad', sub: 'Índices de Siniestralidad y Estadísticas', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', badge: 'Nuevo', featured: true },
  { to: '/legislation', icon: <Gavel weight="duotone" size={26} />, label: 'Legislación', sub: 'Biblioteca Legal', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'docs' },
  { to: '/loto', icon: <Lock weight="duotone" size={26} />, label: 'LOTO', sub: 'Bloqueo y Etiquetado', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'critical' },
  { to: '/risk-maps-history', icon: <MapTrifold weight="duotone" size={26} />, label: 'Mapas', sub: 'Croquis de Riesgos', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'docs' },
  { to: '/extintores', icon: <Fire weight="duotone" size={26} />, label: 'Matafuegos', sub: 'Control y Vencimientos', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'management' },
  { to: '/environmental', icon: <Droplets weight="duotone" size={26} />, label: 'Medio Ambiente', sub: 'Monitoreo y Control', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'specific' },
  { to: '/work-permit', icon: <Key weight="duotone" size={26} />, label: 'Permisos', sub: 'Tareas Críticas', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', premium: true, category: 'critical', featured: true },
  { to: '/ai-general-camera-manager', icon: <ShieldWarning weight="duotone" size={26} />, label: 'Riesgos IA', sub: 'Análisis de Entorno', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', premium: true, category: 'ia', badge: 'IA' },
  { to: '/noise-assessment', icon: <SpeakerHigh weight="duotone" size={26} />, label: 'Ruido', sub: 'Evaluación de Niveles Sonoros', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'specific' },
  { to: '/chemical-safety', icon: <Flask weight="duotone" size={26} />, label: 'Seguridad Química', sub: 'Gestión de Sustancias y SGA', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'specific' },
  { to: '/drills', icon: <Siren weight="duotone" size={26} />, label: 'Simulacros', sub: 'Actas de Evacuación', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management' },
  { to: '/stop-cards', icon: <Warning weight="duotone" size={26} />, label: 'Tarjetas STOP', sub: 'Observaciones', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management' },
  { to: '/working-at-height', icon: <HardHat weight="duotone" size={26} />, label: 'Trabajo en Altura', sub: 'Permisos y EPP Crítico', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'critical' },
  { to: '/lifting-form', icon: <Crane weight="duotone" size={26} />, label: 'Izaje y Grúas', sub: 'Plan de Izaje Crítico', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'critical' },
  { to: '/fleet-form', icon: <Truck weight="duotone" size={26} />, label: 'Flota y Vehículos', sub: 'Inspección Pre-Operacional', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'management' },
  { to: '/evacuation-history', icon: <Timer weight="duotone" size={26} />, label: 'Simulador de Evacuación', sub: 'Cálculo de Tiempos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'specific' },
  { to: '/legajos', icon: <FileText weight="duotone" size={26} />, label: 'Legajos Técnicos', sub: 'Decreto 351/79', color: '#eab308', bg: 'rgba(234,179,8,0.1)', premium: true, category: 'management', badge: 'Nuevo', featured: true }
].sort((a, b) => a.label.localeCompare(b.label, 'es-AR'));

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

// Typewriter hook for hero headline
function useTypewriter(words: string[], speed = 80, pause = 2000) {
  const [displayed, setDisplayed] = React.useState('');
  const [wordIdx, setWordIdx] = React.useState(0);
  const [charIdx, setCharIdx] = React.useState(0);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    const current = words[wordIdx];
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), speed);
      return () => clearTimeout(t);
    }
    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx(w => (w + 1) % words.length);
    }
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  React.useEffect(() => {
    setDisplayed(words[wordIdx].slice(0, charIdx));
  }, [charIdx, wordIdx, words]);

  return displayed;
}

export default function Home(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth() as { currentUser: FirebaseUser | null };
  const { syncPulse } = useSync();
  const { isPro, daysRemaining } = usePaywall();

  const heroWords = ['ATS', 'Carga de Fuego', 'Auditorías', 'Matrices de Riesgo', 'Capacitaciones'];
  const typedWord = useTypewriter(heroWords);

  const typeColors: Record<string, { bg: string, text: string, icon: React.ReactElement }> = {
    'ATS': { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', icon: <ShieldCheck weight="duotone" size={20} /> },
    'Carga Fuego': { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', icon: <Fire weight="duotone" size={20} /> },
    'Inspección': { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', icon: <ClipboardText weight="duotone" size={20} /> },
    'Matriz': { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', icon: <Warning weight="duotone" size={20} /> },
    'Informe': { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', icon: <Scroll weight="duotone" size={20} /> },
    'Checklist': { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', icon: <ClipboardText weight="duotone" size={20} /> },
    'Iluminación': { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', icon: <Lightbulb weight="duotone" size={20} /> },
    'Permiso': { bg: 'rgba(37, 99, 235, 0.1)', text: '#1d4ed8', icon: <Key weight="duotone" size={20} /> },
    'Eval. Riesgo': { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', icon: <Warning weight="duotone" size={20} /> },
    'Accidente': { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', icon: <Siren weight="duotone" size={20} /> },
  };
  
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [daysLeft, setDaysLeft] = useState<number | typeof Infinity | null>(null);
  const [stats, setStats] = useState<StatItem[]>([
    { label: 'Accidentes', value: 0, icon: <Siren weight="duotone" />, color: '#ef4444', grad: 'linear-gradient(135deg,#ef4444,#b91c1c)', key: 'accident_history' },
    { label: 'ATS', value: 0, icon: <ShieldCheck weight="duotone" />, color: '#10b981', grad: 'linear-gradient(135deg,#10b981,#059669)', key: 'ats_history' },
    { label: 'Carga Fuego', value: 0, icon: <Fire weight="duotone" />, color: '#f97316', grad: 'linear-gradient(135deg,#f97316,#ea580c)', key: 'fireload_history' },
    { label: 'Checklists', value: 0, icon: <ClipboardText weight="duotone" />, color: '#14b8a6', grad: 'linear-gradient(135deg,#14b8a6,#0d9488)', key: 'tool_checklists_history' },
    { label: 'Iluminación', value: 0, icon: <Lightbulb weight="duotone" />, color: '#eab308', grad: 'linear-gradient(135deg,#eab308,#ca8a04)', key: 'lighting_history' },
    { label: 'Informes', value: 0, icon: <Scroll weight="duotone" />, color: '#ec4899', grad: 'linear-gradient(135deg,#ec4899,#db2777)', key: 'reports_history' },
    { label: 'Inspecciones', value: 0, icon: <ClipboardText weight="duotone" />, color: '#3b82f6', grad: 'linear-gradient(135deg,#3b82f6,#2563eb)', key: 'inspections_history' },
    { label: 'Matrices', value: 0, icon: <Warning weight="duotone" />, color: '#8b5cf6', grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', key: 'risk_matrix_history' },
    { label: 'Permisos', value: 0, icon: <Key weight="duotone" />, color: '#2563eb', grad: 'linear-gradient(135deg,#2563eb,#1d4ed8)', key: 'work_permits_history' },
  ]);
  const [recentWorks, setRecentWorks] = useState<WorkItem[]>([]);
  const [userName, setUserName] = useState<string>('Profesional');
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);

  const handleRecentWorkClick = (type: string) => {
    const typeRoutes: Record<string, string> = {
      'ATS': '/ats',
      'Carga Fuego': '/fire-load',
      'Inspección': '/history', // fallback to history for inspections
      'Matriz': '/risk-matrix-history',
      'Informe': '/reports',
      'Checklist': '/tool-inspection-history',
      'Iluminación': '/lighting',
      'Permiso': '/work-permit',
      'Eval. Riesgo': '/risk-assessment-history',
      'Accidente': '/accident-investigation'
    };
    const route = typeRoutes[type] || '/';
    navigate(route);
  };

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
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      setIsSubscribed(isPro);
      setDaysLeft(daysRemaining);

      if (currentUser?.email === 'enzorodriguez31@gmail.com') {
        if (!localStorage.getItem('saw_gift_modal')) {
          setShowRewardModal(true);
        }
      }
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

        const combined: any[] = [
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
      const fallbackInsight = {
        title: "Revisá tus permisos de trabajo",
        content: "Recordá que los permisos de trabajo en altura vencen diariamente. Verificá que todos estén firmados por el supervisor antes de iniciar la jornada.",
        category: "Seguridad Preventiva"
      };

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

        const response = await fetch(`${API_BASE_URL}/api/daily-insight`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.insight) {
            setDailyInsight(data.insight);
            localStorage.setItem('daily_insight_cache', JSON.stringify({ date: today, data: data.insight }));
            return;
          }
        }
        
        // If we reach here, API didn't return a valid insight
        setDailyInsight(fallbackInsight);
      } catch (err) {
        console.error("Error fetching daily insight:", err);
        setDailyInsight(fallbackInsight);
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

    if (location.state?.scrollTo) {
      setTimeout(() => {
        const el = document.getElementById(`module-${location.state.scrollTo}`);
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }, 100);
    }
  }, [syncPulse, currentUser, location]);

  return (
    <AnimatedPage>
    <div className="page-transition" style={{ paddingBottom: '4rem' }}>

      {!currentUser && <StickyCtaBanner />}

      {/* HERO BANNER / DASHBOARD HEADER */}
      {!currentUser ? (
        <div 
          className="home-hero-banner" 
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
          }}
          style={{
            padding: 'clamp(8rem, 12vw, 10rem) 1.2rem 6rem',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            width: '100%',
            boxSizing: 'border-box',
            background: 'radial-gradient(circle at top right, #1e3a8a, #020617)'
          }}
        >
          <div className="glow-cursor" style={{
            position: 'absolute',
            top: 'var(--mouse-y, 0)',
            left: 'var(--mouse-x, 0)',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 50%)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 0,
            transition: 'opacity 0.3s ease'
          }} />

          <StarryBackground />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: isMobile ? '2rem' : '4rem', alignItems: 'center' }}>
            <div className="stagger-item" style={{ animationDelay: '0.1s', textAlign: isMobile ? 'center' : 'left' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '100px', marginBottom: '2rem' }}>
                <ShieldCheck size={16} color="#60a5fa" />
                <span style={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>Plataforma H&S con IA</span>
              </div>
              <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 900, color: 'white', margin: '0 0 1.5rem', lineHeight: 1.1, letterSpacing: '-2px', fontFamily: 'var(--font-heading)' }}>
                Creá tus{' '}
                <span style={{ background: 'linear-gradient(to right, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', minWidth: '5ch' }}>
                  {typedWord}<span style={{ animation: 'pulse-soft 0.8s ease-in-out infinite', opacity: 1, color: '#60a5fa' }}>|</span>
                </span>
                {' '}en minutos.{' '}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', marginBottom: '2.5rem', fontWeight: 500, maxWidth: '540px', lineHeight: 1.65 }}>
                La plataforma de Higiene y Seguridad con IA que redacta, calcula y genera PDFs profesionales. Validado por la normativa de toda la región.
              </p>
              <div className="hero-buttons stagger-item" style={{ animationDelay: '0.3s', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                <button onClick={() => navigate('/login', { state: { view: 'register' } })} className="glow-button hover-lift" style={{ padding: '1.1rem 2.5rem', fontSize: '1.1rem' }}>
                  Generar mi primer ATS Gratis <ArrowRight size={20} style={{ display: 'inline', verticalAlign: 'middle', margin: '-2px 0 0 0.5rem' }} />
                </button>
                <button onClick={() => {
                  const demoInput = document.querySelector('.glass-mockup input') as HTMLInputElement;
                  if (demoInput) demoInput.focus();
                }} style={{ padding: '1.1rem 2.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(12px)', fontSize: '1.1rem', transition: 'all 0.3s ease' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  Ver Demo de IA
                </button>
              </div>
              {/* Social proof avatars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                <div style={{ display: 'flex' }}>
                  {['#3b82f6','#10b981','#a855f7','#f97316','#ec4899'].map((c, i) => (
                    <div key={i} style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${c}, ${c}99)`,
                      border: '2px solid rgba(2,6,23,0.8)',
                      marginLeft: i === 0 ? 0 : '-10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 900, fontSize: '0.75rem',
                      flexShrink: 0,
                    }}>{['J','M','C','L','R'][i]}</div>
                  ))}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: '1px', marginBottom: '2px' }}>
                    {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#fbbf24', fontSize: '11px' }}>★</span>)}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 500 }}>
                    +1,240 profesionales ya la usan
                  </span>
                </div>
              </div>

              {/* Stats inline */}
              <div style={{ display: 'flex', gap: isMobile ? '1.5rem' : '2.5rem', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
                <CounterItem value={1240} label="Profesionales" suffix="+" />
                <CounterItem value={8500} label="Reportes" suffix="+" />
                <CounterItem value={5} label="Países" suffix="" />
              </div>
            </div>
            
            {/* Interactive Hero Demo */}
            <div className="stagger-item hidden-mobile" style={{ animationDelay: '0.4s', perspective: '1000px' }}>
              <Suspense fallback={<div style={{ height: '300px' }} />}>
                <InteractiveHeroDemo />
              </Suspense>
            </div>
          </div>
        </div>
      ) : (
        /* DASHBOARD HERO BANNER */
        <div style={{ padding: 'clamp(8rem, 10vw, 9rem) 1.2rem 2rem', background: 'var(--color-hero-bg)', borderBottom: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
          <StarryBackground />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
            <div className="stagger-item" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '100px', marginBottom: '2rem', backdropFilter: 'blur(8px)' }}>
                <Shield size={14} color="#60a5fa" weight="bold" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1px' }}>Dashboard Privado</span>
              </div>
              
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '1.5rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '1.5rem',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(12px)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: '-50%', left: '-10%', width: '150px', height: '150px',
                  background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', pointerEvents: 'none'
                }}/>
                <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '18px', padding: '12px', flexShrink: 0, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                  <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                    Hola, {userName} {isSubscribed && <Crown size={24} color="#f59e0b" weight="fill" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.5rem', filter: 'drop-shadow(0 2px 8px rgba(245,158,11,0.4))' }}/>}
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', margin: '0.4rem 0 0', fontWeight: 500 }}>
                    Tu centro de control de Higiene y Seguridad con IA.
                  </p>
                </div>
              </div>
            </div>

            {/* --- BENTO GRID DASHBOARD --- */}
            <div className="bento-container stagger-item" style={{ animationDelay: '0.2s' }}>
              
              {/* BENTO 1: Bienvenido & Daily Insight (bento-main) */}
              <div className="bento-item bento-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1 }}>
                      Resumen Diario
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '0.4rem 0 0' }}>
                      Actividad y consejos de tu asistente IA
                    </p>
                  </div>
                  <Sparkle size={32} weight="duotone" color="#a855f7" />
                </div>
                
                {currentUser && dailyInsight ? (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', display: 'block' }}>Tip IA · {dailyInsight.category}</span>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{dailyInsight.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{dailyInsight.content}</p>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Cargando análisis diario...</span>
                  </div>
                )}
              </div>

              {/* BENTO 2: Accesos Rápidos Top 4 (bento-quick) */}
              {!isMobile && (
                <div className="bento-item bento-quick" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={18} color="#f59e0b" weight="fill" /> Favoritos y Más Usados
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', flex: 1 }}>
                    {quickLinks.filter(l => l.featured).slice(0, 4).map((link, i) => (
                      <div key={i} onClick={() => navigate(link.to)} className="hover-glow" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ color: link.color, marginBottom: '0.5rem' }}>
                          {/* @ts-ignore */}
                          {React.cloneElement(link.icon, { size: 24 })}
                        </div>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{link.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BENTO 3: Historial y Actividad Reciente (bento-recent) */}
              {!isMobile && (
                <div className="bento-item bento-recent" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ClockCounterClockwise size={18} color="#3b82f6" /> Recientes
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
                    {recentWorks.length > 0 ? recentWorks.slice(0, 4).map((work, i) => {
                      const tColor = typeColors[work.type] || typeColors['ATS'];
                      return (
                        <div key={i} onClick={() => handleRecentWorkClick(work.type)} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} className="hover-scale">
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: tColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tColor.text, flexShrink: 0 }}>
                            {tColor.icon}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{work.title}</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '2px' }}>{work.type} • {new Date(work.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', margin: 'auto' }}>No hay actividad reciente</div>
                    )}
                  </div>
                </div>
              )}

              {/* BENTO 4: Indicadores KPI (bento-stats) */}
              <div className="bento-item bento-stats" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(249,115,22,0.05) 100%)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ChartPieSlice size={18} color="#ef4444" /> KPIs Rápidos
                </h3>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', justifyContent: 'center' }}>
                  {stats.filter(s => ['ATS', 'Accidentes', 'Permisos'].includes(s.label)).slice(0,3).map((stat, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* @ts-ignore */}
                        {React.cloneElement(stat.icon, { size: 16, color: stat.color })}
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600 }}>{stat.label}</span>
                      </div>
                      <span style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem' }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* --- FIN BENTO GRID --- */}
          </div>
        </div>
      )}


      {/* Marketing Landing Content - Primary for visitors */}
      {!currentUser && (
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando...</div>}>
          <div style={{ marginTop: '0' }}>
          <StatsShowcase />
          <ModulesGrid />
          <FeaturesShowcase />
          <WallOfLove />
          <BeforeAndAfter />
          <RoiCalculator />
          <PricingDark onStart={() => navigate('/login', { state: { view: 'register' } })} />
          <FaqAndCtaDark />
          </div>
        </Suspense>
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
              </div>

              {/* Categories Tabs */}
              <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.2rem 0.2rem 0.7rem 0.2rem' }}>
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
              gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(110px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: isMobile ? '0.6rem' : '1.5rem',
              gridAutoRows: 'auto'
            }}>
              {filteredLinks.length > 0 ? filteredLinks.map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  id={`module-${link.to.replace('/', '')}`}
                  className="card"
                  style={{
                    textDecoration: 'none',
                    padding: isMobile ? '1rem 0.4rem' : '1.5rem 1rem',
                    borderRadius: isMobile ? '16px' : '24px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: isMobile ? '0.5rem' : '0.8rem',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: isMobile ? '140px' : '180px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = `${link.color}50`;
                    e.currentTarget.style.boxShadow = `0 12px 30px ${link.color}15`;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.background = `linear-gradient(145deg, ${link.bg}, var(--color-surface-hover))`;
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.background = 'var(--color-surface)';
                  }}
                >
                  {/* Badge */}
                  {link.badge && (
                    <div style={{
                      position: 'absolute',
                      top: isMobile ? '0.5rem' : '0.8rem',
                      right: isMobile ? '0.5rem' : '0.8rem',
                      background: `linear-gradient(135deg, ${link.color}, ${link.color}cc)`,
                      color: '#fff',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '100px',
                      fontSize: isMobile ? '0.55rem' : '0.65rem',
                      fontWeight: 800,
                      boxShadow: `0 2px 10px ${link.color}30`,
                      zIndex: 2
                    }}>
                      {link.badge}
                    </div>
                  )}

                  <div className={`premium-icon-box ${link.category === 'ia' ? 'ai-magic-box' : ''}`} style={{
                    width: isMobile ? '38px' : '56px',
                    height: isMobile ? '38px' : '56px',
                    color: link.color,
                    flexShrink: 0,
                    marginBottom: '0.1rem'
                  }}>
                    {React.cloneElement(link.icon as React.ReactElement<any>, { 
                      size: isMobile ? 22 : 30, 
                      className: `${link.category === 'ia' ? 'ai-magic-icon' : 'icon-glow-soft'}` 
                    })}
                  </div>
                  
                  <div style={{ width: '100%', padding: '0 0.2rem' }}>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '0.8rem' : '0.95rem', fontWeight: 800, color: 'var(--color-text)', wordBreak: 'break-word', hyphens: 'auto', lineHeight: 1.2, textAlign: 'center' }}>
                      {link.label}
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: isMobile ? '0.65rem' : '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.3, opacity: 0.8, wordBreak: 'break-word', hyphens: 'auto' }}>
                      {link.sub}
                    </p>
                  </div>
                </Link>
              )) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
                  <MagnifyingGlass size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
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
                <ClockCounterClockwise weight="duotone" size={24} color="var(--color-primary)" />
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
                  gap: '1.2rem',
                  transition: 'all 0.2s ease',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-hover)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-hover)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
                }}
                onClick={() => handleRecentWorkClick(work.type)}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: typeColors[work.type]?.bg || 'rgba(59,130,246,0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: typeColors[work.type]?.text || '#3b82f6',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${typeColors[work.type]?.bg || 'rgba(59,130,246,0.1)'}`
                }}>
                  {typeColors[work.type]?.icon || <FileText size={22} weight="duotone" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {work.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                    <span>{work.subtitle}</span>
                    <span>•</span>
                    <span>{new Date(work.date).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
                <div style={{
                  padding: '0.3rem 0.8rem',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  {work.type} <ArrowRight size={16} weight="bold" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      )}
      {/* Removed legacy onboarding modal in favor of MarketingLanding */}

      {/* Special Reward Modal */}
      {showRewardModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '450px', width: '90%', padding: '2.5rem', textAlign: 'center', position: 'relative', border: '2px solid #f59e0b', background: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Crown size={64} color="#f59e0b" weight="fill" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--color-text)' }}>¡Gracias por tu sugerencia!</h2>
            <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
              En agradecimiento por ayudarnos a mejorar la plataforma, te hemos otorgado <strong>30 días de acceso PRO totalmente gratis</strong>. <br/><br/>
              ¡Disfrutá de todas las funciones premium!
            </p>
            <button 
              onClick={() => {
                localStorage.setItem('saw_gift_modal', 'true');
                setShowRewardModal(false);
              }}
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)' }}
              className="hover-lift"
            >
              ¡Excelente, gracias!
            </button>
          </div>
        </div>
      )}

    </div>
    </AnimatedPage>
  );
}

// FAQ Component — Premium Accordion
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
    { q: '¿Es realmente gratis?', a: 'Sí, la carga de datos y el uso de los módulos es 100% gratuito e ilimitado. Podés completar ATS, hacer mediciones y cargar registros sin pagar. El plan PRO solo es necesario si deseás exportar esos resultados a PDF profesional, compartirlos por WhatsApp o sincronizarlos en la nube.' },
    { q: '¿Puedo usar la IA gratis?', a: '¡Sí! Podés usar la Cámara IA y el Asesor IA de forma gratuita para ver los resultados y análisis en tiempo real en tu pantalla. La versión PRO te permite incluir esos hallazgos en reportes exportables y compartirlos.' },
    {
      q: userCountry === 'argentina' ? '¿Cumple con la normativa argentina?' : '¿Cumple con la normativa local?',
      a: userCountry === 'argentina'
        ? 'Los cálculos están basados en la Ley 19.587, el Dec. 351/79, resoluciones SRT y normativas vigentes.'
        : `Los cálculos y módulos están adaptados a las normativas vigentes de ${userCountry.charAt(0).toUpperCase() + userCountry.slice(1)}.`
    },
    { q: '¿Mis datos están seguros?', a: 'Sí. Usamos Firebase (Google) para autenticación y almacenamiento cifrado. Tu información está protegida y bajo tu control.' },
    { q: '¿Funciona en el celular?', a: 'Perfecto. Está optimizada para mobile y podés instalarla directamente en tu pantalla de inicio como una app nativa (PWA).' },
    { q: '¿Cómo cancelo la suscripción PRO?', a: 'En cualquier momento desde tu perfil, en la sección Suscripción. No hay contratos de permanencia ni cargos ocultos.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: open === i ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--color-border)',
            background: open === i ? 'rgba(59,130,246,0.04)' : 'var(--color-surface)',
            transition: 'all 0.25s ease',
            boxShadow: open === i ? '0 4px 20px rgba(59,130,246,0.08)' : 'none',
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              padding: '1.1rem 1.4rem',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: open === i ? 'var(--color-primary)' : 'var(--color-text)',
              transition: 'color 0.2s',
              minHeight: '48px',
            }}
          >
            <span style={{ flex: 1 }}>{item.q}</span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: open === i ? 'var(--color-primary)' : 'rgba(59,130,246,0.08)',
                border: `1px solid ${open === i ? 'var(--color-primary)' : 'rgba(59,130,246,0.15)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.3s ease',
              }}
            >
              <span
                style={{
                  fontSize: '1.1rem',
                  color: open === i ? 'white' : 'var(--color-primary)',
                  lineHeight: 1,
                  display: 'block',
                  transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                  transition: 'transform 0.3s ease',
                  fontWeight: 300,
                }}
              >
                +
              </span>
            </div>
          </button>
          <div
            style={{
              maxHeight: open === i ? '300px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                padding: '0 1.4rem 1.2rem',
                fontSize: '0.9rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.7,
                borderTop: '1px solid var(--color-border)',
                paddingTop: '1rem',
              }}
            >
              {item.a}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
