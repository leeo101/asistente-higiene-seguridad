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
  Tent, Drop as Droplets, SpeakerHigh, Flask, MagnifyingGlass, TrendUp as TrendingUp, Truck, Crane, Timer, Sparkle } from
'@phosphor-icons/react';
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
  norm?: string;
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

const typeColors: Record<string, {bg: string;text: string;icon: React.ReactElement;}> = {
  'ATS': { bg: 'rgba(16,185,129,0.12)', text: '#10b981', icon: <ChartBar weight="duotone" size={18} /> },
  'Carga Fuego': { bg: 'rgba(249,115,22,0.12)', text: '#f97316', icon: <Fire weight="duotone" size={18} /> },
  'Inspección': { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', icon: <ClipboardText weight="duotone" size={18} /> },
  'Matriz': { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6', icon: <ShieldWarning weight="duotone" size={18} /> },
  'Informe': { bg: 'rgba(236,72,153,0.12)', text: '#ec4899', icon: <FileText weight="duotone" size={18} /> },
  'Checklist': { bg: 'rgba(20,184,166,0.12)', text: '#14b8a6', icon: <ClipboardText weight="duotone" size={18} /> },
  'Iluminación': { bg: 'rgba(234,179,8,0.12)', text: '#eab308', icon: <Lightbulb weight="duotone" size={18} /> },
  'Permiso': { bg: 'rgba(37,99,235,0.12)', text: '#2563eb', icon: <HardHat weight="duotone" size={18} /> },
  'Eval. Riesgo': { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', icon: <Shield weight="duotone" size={18} /> }
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
{ to: '/ai-advisor', icon: <Robot weight="duotone" size={26} />, label: 'Asesor IA', sub: 'Consultas de Seguridad', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', premium: true, category: 'ia', featured: true, badge: 'IA', norm: 'ISO 45001' },
{ to: '/ats', icon: <ShieldCheck weight="duotone" size={26} />, label: 'ATS', sub: 'Análisis Trabajo Seguro', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'docs', featured: true, norm: 'ISO 45001' },
{ to: '/audit', icon: <ClipboardText weight="duotone" size={26} />, label: 'Auditorías', sub: 'Control Interno y EHS', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/ai-camera-manager', icon: <Camera weight="duotone" size={26} />, label: 'Cámara IA', sub: 'Detección EPP', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'ia', featured: true, badge: 'IA', norm: 'ISO 45001' },
{ to: '/capa', icon: <CheckCircle weight="duotone" size={26} />, label: 'CAPA', sub: 'Acciones Correctivas', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'management', norm: 'ISO 9001' },
{ to: '/training-management', icon: <Users weight="duotone" size={26} />, label: 'Capacitar', sub: 'Planillas y Asistencia', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/fire-load', icon: <Fire weight="duotone" size={26} />, label: 'Carga Fuego', sub: getRegSub('fire'), color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true, category: 'specific', norm: 'NFPA 13' },
{ to: '/toolbox-talk', icon: <ChatText weight="duotone" size={26} />, label: 'Charlas 5 Min', sub: 'Registro de Capacitación Diaria', color: '#0052CC', bg: 'rgba(0,82,204,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'ISO 45001' },
{ to: '/checklists', icon: <ClipboardText weight="duotone" size={26} />, label: 'Checklists', sub: 'Herramientas y Equipos', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', premium: true, category: 'docs', norm: 'ISO 45001' },
{ to: '/ppe-tracker', icon: <HardHat weight="duotone" size={26} />, label: 'Control EPP', sub: 'Vencimientos', color: '#10b981', bg: 'rgba(16,185,129,0.08)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/ergonomics', icon: <PersonArmsSpread weight="duotone" size={26} />, label: 'Ergonomía', sub: getRegSub('ergo'), color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'specific', norm: 'ISO 9241' },
{ to: '/confined-space', icon: <Tent weight="duotone" size={26} />, label: 'Espacios Confinados', sub: 'Permisos y Control', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'critical', norm: 'OSHA 1910' },
{ to: '/thermal-stress', icon: <ThermometerHot weight="duotone" size={26} />, label: 'Estrés Térmico', sub: getRegSub('thermal'), color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true, category: 'specific', norm: 'ISO 7933' },
{ to: '/extinguisher-ai', icon: <Fire weight="duotone" size={26} />, label: 'Extintores IA', sub: 'Reconocimiento', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'ia', badge: 'IA', norm: 'NFPA 10' },
{ to: '/lighting', icon: <Lightbulb weight="duotone" size={26} />, label: 'Iluminación', sub: getRegSub('lighting'), color: '#eab308', bg: 'rgba(234,179,8,0.1)', premium: true, category: 'specific', norm: 'ISO 8995' },
{ to: '/reports', icon: <Scroll weight="duotone" size={26} />, label: 'Informes', sub: 'Técnicos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'docs', norm: 'ISO 45001' },
{ to: '/accident-investigation', icon: <Siren weight="duotone" size={26} />, label: 'Investigación', sub: 'Accidentes / Árbol', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/safety-kpis', icon: <ChartPieSlice weight="duotone" size={26} />, label: 'KPIs Seguridad', sub: 'Índices de Siniestralidad y Estadísticas', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'ISO 45001' },
{ to: '/legislation', icon: <Gavel weight="duotone" size={26} />, label: 'Legislación', sub: 'Biblioteca Legal', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'docs', norm: 'Legal' },
{ to: '/loto', icon: <Lock weight="duotone" size={26} />, label: 'LOTO', sub: 'Bloqueo y Etiquetado', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'critical', norm: 'OSHA 1910' },
{ to: '/risk-maps-history', icon: <MapTrifold weight="duotone" size={26} />, label: 'Mapas', sub: 'Croquis de Riesgos', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'docs', norm: 'ISO 31000' },
{ to: '/extintores', icon: <Fire weight="duotone" size={26} />, label: 'Matafuegos', sub: 'Control y Vencimientos', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'management', norm: 'NFPA 10' },
{ to: '/environmental', icon: <Droplets weight="duotone" size={26} />, label: 'Medio Ambiente', sub: 'Monitoreo y Control', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'specific', norm: 'ISO 14001' },
{ to: '/work-permit', icon: <Key weight="duotone" size={26} />, label: 'Permisos', sub: 'Tareas Críticas', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', premium: true, category: 'critical', featured: true, norm: 'ISO 45001' },
{ to: '/ai-general-camera-manager', icon: <ShieldWarning weight="duotone" size={26} />, label: 'Riesgos IA', sub: 'Análisis de Entorno', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', premium: true, category: 'ia', badge: 'IA', norm: 'ISO 31000' },
{ to: '/noise-assessment', icon: <SpeakerHigh weight="duotone" size={26} />, label: 'Ruido', sub: 'Evaluación de Niveles Sonoros', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'specific', norm: 'ISO 9612' },
{ to: '/chemical-safety', icon: <Flask weight="duotone" size={26} />, label: 'Seguridad Química', sub: 'Gestión de Sustancias y SGA', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'specific', norm: 'GHS/SGA' },
{ to: '/drills', icon: <Siren weight="duotone" size={26} />, label: 'Simulacros', sub: 'Actas de Evacuación', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/stop-cards', icon: <Warning weight="duotone" size={26} />, label: 'Tarjetas STOP', sub: 'Observaciones', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/working-at-height', icon: <HardHat weight="duotone" size={26} />, label: 'Trabajo en Altura', sub: 'Permisos y EPP Crítico', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'critical', norm: 'ISO 45001' },
{ to: '/lifting-form', icon: <Crane weight="duotone" size={26} />, label: 'Izaje y Grúas', sub: 'Plan de Izaje Crítico', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'critical', norm: 'ASME B30' },
{ to: '/fleet-form', icon: <Truck weight="duotone" size={26} />, label: 'Flota y Vehículos', sub: 'Inspección Pre-Operacional', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'management', norm: 'ISO 39001' },
{ to: '/evacuation-history', icon: <Timer weight="duotone" size={26} />, label: 'Simulador de Evacuación', sub: 'Cálculo de Tiempos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'specific', norm: 'NFPA 101' },
{ to: '/legajos', icon: <FileText weight="duotone" size={26} />, label: 'Legajos Técnicos', sub: 'Decreto 351/79', color: '#eab308', bg: 'rgba(234,179,8,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'Dec. 351' },
{ to: '/medical', icon: <Activity weight="duotone" size={26} />, label: 'Aptitudes Médicas', sub: 'Exámenes Preocupacionales y Periódicos', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'Res. 37/10' },
{ to: '/emergency-plan', icon: <Siren weight="duotone" size={26} />, label: 'Plan de Emergencias', sub: 'Roles, Brigadas y Simulacros', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'Ley 19587' }].
sort((a, b) => a.label.localeCompare(b.label, 'es-AR'));

// Counter hook
function useCounter(target: number, duration = 1800): number {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (duration / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {setCount(target);clearInterval(timer);} else
      setCount(start);
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
    <div className="text-center">
      <div className="text-[1.8rem] font-[900] text-[var(--color-hero-text)] line-height-[1]">
        {count.toLocaleString('es-AR')}{suffix}
      </div>
      <div className="text-[0.72rem] text-[var(--color-hero-subtext)] font-[600] mt-[0.2rem]">{label}</div>
    </div>);

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
      const t = setTimeout(() => setCharIdx((c) => c + 1), speed);
      return () => clearTimeout(t);
    }
    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx((c) => c - 1), speed / 2);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx((w) => (w + 1) % words.length);
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
  const { currentUser } = useAuth() as {currentUser: FirebaseUser | null;};
  const { syncPulse } = useSync();
  const { isPro, daysRemaining } = usePaywall();

  const heroWords = ['ATS', 'Carga de Fuego', 'Auditorías', 'Matrices de Riesgo', 'Capacitaciones'];
  const typedWord = useTypewriter(heroWords);

  const typeColors: Record<string, {bg: string;text: string;icon: React.ReactElement;}> = {
    'ATS': { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', icon: <ShieldCheck weight="duotone" size={20} /> },
    'Carga Fuego': { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', icon: <Fire weight="duotone" size={20} /> },
    'Inspección': { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', icon: <ClipboardText weight="duotone" size={20} /> },
    'Matriz': { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', icon: <Warning weight="duotone" size={20} /> },
    'Informe': { bg: 'rgba(236, 72, 153, 0.1)', text: '#db2777', icon: <Scroll weight="duotone" size={20} /> },
    'Checklist': { bg: 'rgba(20, 184, 166, 0.1)', text: '#0d9488', icon: <ClipboardText weight="duotone" size={20} /> },
    'Iluminación': { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', icon: <Lightbulb weight="duotone" size={20} /> },
    'Permiso': { bg: 'rgba(37, 99, 235, 0.1)', text: '#1d4ed8', icon: <Key weight="duotone" size={20} /> },
    'Eval. Riesgo': { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed', icon: <Warning weight="duotone" size={20} /> },
    'Accidente': { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', icon: <Siren weight="duotone" size={20} /> }
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
  { label: 'Permisos', value: 0, icon: <Key weight="duotone" />, color: '#2563eb', grad: 'linear-gradient(135deg,#2563eb,#1d4ed8)', key: 'work_permits_history' }]
  );
  const [recentWorks, setRecentWorks] = useState<WorkItem[]>([]);
  const [userName, setUserName] = useState<string>('Profesional');
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [recentModulePaths, setRecentModulePaths] = useState<Set<string>>(new Set());
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});

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
  { id: 'specific', label: 'Específicos' }];


  const filteredLinks = quickLinks.filter((link) => {
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
        setStats((prev) => prev.map((s) => ({ ...s, value: 0 })));
        setRecentWorks([]);
        return;
      }

      const savedData = localStorage.getItem('personalData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        let name = parsed.name || 'Profesional';
        if (parsed.profession) {
          const prof = parsed.profession.toLowerCase();
          if (prof.includes('lic')) name = `Lic. ${name}`;else
          if (prof.includes('téc')) name = `Téc. ${name}`;else
          if (prof.includes('ing')) name = `Ing. ${name}`;
        }
        setUserName(name);
      }

      setIsSubscribed(isPro);
      setDaysLeft(daysRemaining);
    }

    const loadStats = (): void => {
      const newStats = stats.map((stat) => {
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
        ...accidents.map((acc: any) => ({ id: acc.id, title: acc.victimaNombre, subtitle: acc.empresa, date: acc.date, type: 'Accidente' }))].

        filter((item) => item.date || item.fecha || item.createdAt).
        sort((a, b) => new Date(b.date || b.fecha || b.createdAt || 0).getTime() - new Date(a.date || a.fecha || a.createdAt || 0).getTime()).
        slice(0, 4);

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

    const loadModuleCounts = () => {
      const routeToKey: Record<string, string> = {
        '/ats': 'ats_history',
        '/fire-load': 'fireload_history',
        '/checklists': 'tool_checklists_history',
        '/lighting': 'lighting_history',
        '/reports': 'reports_history',
        '/work-permit': 'work_permits_history',
        '/accident-investigation': 'accident_history',
        '/extintores': 'extintores_history',
        '/capa': 'capa_history',
        '/audit': 'audit_history',
        '/confined-space': 'confined_space_history',
        '/thermal-stress': 'thermal_history',
        '/noise-assessment': 'noise_history',
        '/chemical-safety': 'chemical_safety_history',
        '/drills': 'drills_history',
        '/stop-cards': 'stop_cards_history',
        '/working-at-height': 'working_height_history',
        '/lifting-form': 'lifting_history',
        '/fleet-form': 'fleet_history',
        '/training-management': 'training_history',
        '/legajos': 'legajos_history'
      };
      const counts: Record<string, number> = {};
      for (const [route, key] of Object.entries(routeToKey)) {
        try {
          const data = localStorage.getItem(key);
          counts[route] = data ? JSON.parse(data).length : 0;
        } catch {
          counts[route] = 0;
        }
      }
      setModuleCounts(counts);
    };

    loadStats();
    loadRecent();
    loadDailyInsight();
    loadModuleCounts();

    // Build set of recently-used module paths (used this week)
    try {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const typeToPath: Record<string, string> = {
        'ATS': '/ats', 'Carga Fuego': '/fire-load', 'Inspección': '/history',
        'Matriz': '/risk-matrix-history', 'Informe': '/reports',
        'Checklist': '/checklists', 'Iluminación': '/lighting',
        'Permiso': '/work-permit', 'Eval. Riesgo': '/risk-assessment-history',
        'Accidente': '/accident-investigation'
      };
      const recentPaths = new Set<string>();
      const safeParse2 = (key: string) => {try {return JSON.parse(localStorage.getItem(key) || '[]');} catch {return [];}};
      const allItems = [
      ...safeParse2('ats_history').map((a: any) => ({ date: a.fecha, type: 'ATS' })),
      ...safeParse2('fireload_history').map((f: any) => ({ date: f.createdAt, type: 'Carga Fuego' })),
      ...safeParse2('inspections_history').map((i: any) => ({ date: i.date, type: 'Inspección' })),
      ...safeParse2('risk_matrix_history').map((m: any) => ({ date: m.createdAt, type: 'Matriz' })),
      ...safeParse2('reports_history').map((r: any) => ({ date: r.createdAt, type: 'Informe' })),
      ...safeParse2('tool_checklists_history').map((t: any) => ({ date: t.fecha, type: 'Checklist' })),
      ...safeParse2('lighting_history').map((l: any) => ({ date: l.date, type: 'Iluminación' })),
      ...safeParse2('work_permits_history').map((p: any) => ({ date: p.createdAt, type: 'Permiso' })),
      ...safeParse2('risk_assessment_history').map((r: any) => ({ date: r.date || r.createdAt, type: 'Eval. Riesgo' })),
      ...safeParse2('accident_history').map((acc: any) => ({ date: acc.date, type: 'Accidente' }))];

      allItems.forEach((item) => {
        if (item.date && new Date(item.date).getTime() >= oneWeekAgo) {
          const path = typeToPath[item.type];
          if (path) recentPaths.add(path);
        }
      });
      setRecentModulePaths(recentPaths);
    } catch {/* silently ignore */}

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
    <div className="page-transition pb-[4rem]">

      {/* FIXED TOP NAV FOR GUESTS */}
      {!currentUser &&
        <div className="fixed top-[0] left-[0] right-[0] z-[8000] flex justify-space-between items-center p-[0.8rem_1.2rem] bg-[rgba(2,_6,_23,_0.85)] backdrop-filter-[blur(12px)] webkit-backdrop-filter-[blur(12px)] border-bottom-[1px_solid_rgba(255,255,255,0.05)]">











          
          <div className="flex items-center gap-[0.5rem] font-[800] text-[1.2rem] text-[white] letter-spacing-[-0.5px]">
            <ShieldCheck weight="duotone" size={24} color="#60a5fa" />
            <span style={{ display: isMobile ? 'none' : 'inline' }}>Asistente H&S</span>
          </div>
          <div className="flex gap-[0.5rem] items-center">
            <button
              onClick={() => navigate('/login')}

              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} className="bg-[transparent] border-[1px_solid_rgba(255,255,255,0.1)] text-[white] font-[600] p-[0.5rem_1rem] rounded-[8px] cursor-pointer transition-[all_0.2s]">
              
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate('/login', { state: { view: 'register' } })}
              className="glow-button p-[0.5rem_1rem] text-[0.95rem] rounded-[8px]">

              
              Registrarse
            </button>
          </div>
        </div>
        }

      {!currentUser && <StickyCtaBanner />}

      {/* HERO BANNER / DASHBOARD HEADER */}
      {!currentUser ?
        <div
          className="home-hero-banner p-[clamp(8rem,_12vw,_10rem)_1.2rem_6rem] relative overflow-[hidden] mb-[0] border-bottom-[1px_solid_rgba(255,255,255,0.05)] w-[100%] box-sizing-[border-box] bg-[radial-gradient(circle_at_top_right,_#1e3a8a,_#020617)]"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
          }}>










          
          <div className="glow-cursor absolute top-[var(--mouse-y,_0)] left-[var(--mouse-x,_0)] w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(168,85,247,0.15)_0%,_rgba(0,0,0,0)_50%)] transform-[translate(-50%,_-50%)] pointer-events-[none] z-[0] transition-[opacity_0.3s_ease]" />










          

          <StarryBackground />
          <div style={{ gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: isMobile ? '2rem' : '4rem' }} className="relative z-[1] max-w-[1200px] m-[0_auto] grid items-center">
            <div className="stagger-item animation-delay-[0.1s]" style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <div className="display-[inline-flex] items-center gap-[0.6rem] p-[0.5rem_1rem] bg-[rgba(59,_130,_246,_0.1)] border-[1px_solid_rgba(59,_130,_246,_0.2)] rounded-[100px] mb-[2rem]">
                <ShieldCheck size={16} color="#60a5fa" />
                <span className="text-[#60a5fa] text-[0.85rem] font-[800] letter-spacing-[1px] uppercase">Plataforma H&S con IA</span>
              </div>
              <h1 className="text-[clamp(2.8rem,_6vw,_4.5rem)] font-[900] text-[white] m-[0_0_1.5rem] line-height-[1.1] letter-spacing-[-2px] font-family-[var(--font-heading)]">
                Creá tus{' '}
                <span className="bg-[linear-gradient(to_right,_#60a5fa,_#a855f7)] webkit-background-clip-[text] webkit-text-fill-color-[transparent] inline-block min-width-[5ch]">
                  {typedWord}<span className="animation-[pulse-soft_0.8s_ease-in-out_infinite] opacity-[1] text-[#60a5fa]">|</span>
                </span>
                {' '}en minutos.{' '}
              </h1>
              <p className="text-[rgba(255,255,255,0.7)] text-[1.2rem] mb-[2.5rem] font-[500] max-w-[540px] line-height-[1.65]">
                La plataforma de Higiene y Seguridad con IA que redacta, calcula y genera PDFs profesionales. Validado por la normativa de toda la región.
              </p>
              <div className="hero-buttons stagger-item animation-delay-[0.3s] flex gap-[1rem] flex-wrap items-center w-[100%]" style={{ justifyContent: isMobile ? 'center' : 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
                <>
                  <button onClick={() => navigate('/login', { state: { view: 'register' } })} className="glow-button hover-lift p-[1.1rem_2.5rem] text-[1.1rem]" style={{ width: isMobile ? '100%' : 'auto' }}>
                    {isMobile ? 'Empezar Gratis' : 'Generar mi primer ATS Gratis'} <ArrowRight size={20} className="display-[inline] vertical-align-[middle] m-[-2px_0_0_0.5rem]" />
                  </button>
                  <button onClick={() => {
                    const demoInput = document.querySelector('.glass-mockup input') as HTMLInputElement;
                    if (demoInput) demoInput.focus();
                  }} style={{ width: isMobile ? '100%' : 'auto' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} className="p-[1.1rem_2.5rem] rounded-[var(--radius-xl)] border-[1px_solid_rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] text-[white] font-[700] cursor-pointer text-[1.1rem] transition-[all_0.3s_ease]">
                    Ver Demo de IA
                  </button>
                </>
              </div>
              {/* Social proof avatars */}
              <div style={{ justifyContent: isMobile ? 'center' : 'flex-start' }} className="flex items-center gap-[0.8rem] mb-[1.5rem]">
                <div className="flex">
                  {['#3b82f6', '#10b981', '#a855f7', '#f97316', '#ec4899'].map((c, i) =>
                  <div key={i} style={{

                    background: `linear-gradient(135deg, ${c}, ${c}99)`,

                    marginLeft: i === 0 ? 0 : '-10px'



                  }} className="w-[36px] h-[36px] rounded-[50%] border-[2px_solid_rgba(2,6,23,0.8)] flex items-center justify-center text-[white] font-[900] text-[0.75rem] flex-shrink-[0]">{['J', 'M', 'C', 'L', 'R'][i]}</div>
                  )}
                </div>
                <div>
                  <div className="flex gap-[1px] mb-[2px]">
                    {[...Array(5)].map((_, i) => <span key={i} className="text-[#fbbf24] text-[11px]">★</span>)}
                  </div>
                  <span className="text-[rgba(255,255,255,0.55)] text-[0.8rem] font-[500]">
                    +1,240 profesionales ya la usan
                  </span>
                </div>
              </div>

              {/* Stats inline */}
              <div style={{ gap: isMobile ? '1.5rem' : '2.5rem', justifyContent: isMobile ? 'center' : 'flex-start' }} className="flex mt-[2rem] border-top-[1px_solid_rgba(255,255,255,0.1)] pt-[2rem] flex-wrap">
                <CounterItem value={1240} label="Profesionales" suffix="+" />
                <CounterItem value={8500} label="Reportes" suffix="+" />
                <CounterItem value={5} label="Países" suffix="" />
              </div>
            </div>
            
            {/* Interactive Hero Demo */}
            <div className="stagger-item hidden-mobile animation-delay-[0.4s] perspective-[1000px]">
              <Suspense fallback={<div className="h-[300px]" />}>
                <InteractiveHeroDemo />
              </Suspense>
            </div>
          </div>
        </div> : (

        /* DASHBOARD HERO BANNER */
        <div className="p-[clamp(8rem,_10vw,_9rem)_1.2rem_2rem] bg-[var(--color-hero-bg)] border-bottom-[1px_solid_var(--color-border)] relative overflow-[hidden]">
          <StarryBackground />
          <div className="relative z-[1] max-w-[1200px] m-[0_auto]">
            <div className="stagger-item animation-delay-[0.1s]">
              <div style={{ backdropFilter: isMobile ? 'none' : 'blur(8px)' }} className="display-[inline-flex] items-center gap-[0.5rem] p-[0.4rem_0.8rem] bg-[rgba(59,130,246,0.15)] border-[1px_solid_rgba(59,130,246,0.3)] rounded-[100px] mb-[2rem]">
                <Shield size={14} color="#60a5fa" weight="bold" />
                <span className="text-[0.75rem] font-[800] text-[#60a5fa] uppercase letter-spacing-[1px]">Dashboard Privado</span>
              </div>
              
              <div style={{






                backdropFilter: isMobile ? 'none' : 'blur(12px)'


              }} className="flex items-center gap-[1.5rem] bg-[rgba(255,255,255,0.03)] border-[1px_solid_rgba(255,255,255,0.08)] p-[1.5rem] rounded-[24px] box-shadow-[0_20px_40px_rgba(0,0,0,0.2)] relative overflow-[hidden]">
                <div className="absolute top-[-50%] left-[-10%] w-[150px] h-[150px] bg-[radial-gradient(circle,_rgba(59,130,246,0.15)_0%,_transparent_70%)] pointer-events-[none]" />


                
                <div className="w-[70px] h-[70px] bg-[linear-gradient(135deg,_rgba(255,255,255,0.1),_rgba(255,255,255,0.02))] border-[1px_solid_rgba(255,255,255,0.2)] rounded-[18px] p-[12px] flex-shrink-[0] box-shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
                  <img src="/logo.png" alt="Logo" className="w-[100%] h-[100%] object-fit-[contain]" />
                </div>
                <div className="relative z-[1]">
                  <h1 className="text-[clamp(1.8rem,_4vw,_2.4rem)] font-[900] text-[white] m-[0] line-height-[1.1] font-family-[var(--font-heading)]">
                    Hola, {userName} {isSubscribed && <Crown size={24} color="#f59e0b" weight="fill" className="display-[inline] vertical-align-[middle] ml-[0.5rem] filter-[drop-shadow(0_2px_8px_rgba(245,158,11,0.4))]" />}
                  </h1>
                  <p className="text-[rgba(255,255,255,0.6)] text-[1.05rem] m-[0.4rem_0_0] font-[500]">
                    Tu centro de control de Higiene y Seguridad con IA.
                  </p>
                </div>
              </div>
            </div>

            {/* --- BENTO GRID — COMMAND CENTER --- */}
            <div className="bento-container stagger-item animation-delay-[0.2s]">

              {/* ── TILE 1: Daily AI Insight (bento-main) ── */}
              <div className="bento-item bento-main">
                {/* Ambient glow blob */}
                <div style={{



                  filter: isMobile ? 'none' : 'blur(20px)'
                }} className="absolute top-[-30%] right-[-10%] w-[220px] h-[220px] bg-[radial-gradient(circle,_rgba(168,85,247,0.2)_0%,_transparent_70%)] pointer-events-[none]" />

                <div className="flex justify-space-between items-start mb-[1.2rem] relative z-[1]">
                  <div>
                    <div className="display-[inline-flex] items-center gap-[0.4rem] bg-[rgba(168,85,247,0.15)] border-[1px_solid_rgba(168,85,247,0.3)] rounded-[100px] p-[0.25rem_0.7rem] mb-[0.7rem]">
                      <Sparkle size={12} color="#c084fc" weight="fill" />
                      <span className="text-[0.65rem] font-[800] text-[#c084fc] uppercase letter-spacing-[1px]">IA · Hoy</span>
                    </div>
                    <h2 className="text-[clamp(1.3rem,_2.5vw,_1.7rem)] font-[900] text-[white] m-[0] line-height-[1.1] font-family-[var(--font-heading)]">
                      Resumen Diario
                    </h2>
                    <p className="text-[rgba(255,255,255,0.55)] text-[0.85rem] m-[0.3rem_0_0] font-[500]">
                      Consejos y análisis de tu asistente
                    </p>
                  </div>
                  <div className="w-[42px] h-[42px] rounded-[14px] bg-[linear-gradient(135deg,_rgba(139,92,246,0.3),_rgba(59,130,246,0.2))] border-[1px_solid_rgba(139,92,246,0.3)] flex items-center justify-center flex-shrink-[0]">
                    <Robot size={22} weight="duotone" color="#c084fc" />
                  </div>
                </div>

                <div className="flex-[1] relative z-[1]">
                  {currentUser && dailyInsight ?
                  <div className="bg-[rgba(0,0,0,0.25)] p-[1.2rem] rounded-[18px] border-[1px_solid_rgba(255,255,255,0.08)] h-[100%] flex flex-col justify-center gap-[0.5rem]">
                      <div className="flex items-center gap-[0.5rem]">
                        <span className="text-[0.65rem] text-[#c084fc] font-[800] uppercase letter-spacing-[1px]">
                          {dailyInsight.category}
                        </span>
                        <div className="flex-[1] h-[1px] bg-[rgba(255,255,255,0.08)]" />
                      </div>
                      <h4 className="m-[0] text-[1rem] font-[800] text-[#fff] line-height-[1.3]">{dailyInsight.title}</h4>
                      <p className="m-[0] text-[0.85rem] text-[rgba(255,255,255,0.65)] line-height-[1.6]">{dailyInsight.content}</p>
                    </div> :

                  <div className="bg-[rgba(0,0,0,0.2)] rounded-[18px] border-[1px_solid_rgba(255,255,255,0.06)] flex-[1] h-[100%] flex items-center justify-center min-h-[100px]">
                      <div className="flex flex-col items-center gap-[0.5rem] text-[rgba(255,255,255,0.3)]">
                        <Sparkle size={24} weight="duotone" />
                        <span className="text-[0.8rem]">Cargando análisis diario...</span>
                      </div>
                    </div>
                  }
                </div>

                {/* Total docs stat pill */}
                <div className="flex items-center gap-[0.5rem] mt-[1rem] relative z-[1]">
                  <div className="flex gap-[0.4rem] flex-wrap">
                    {[
                    { label: 'Documentos', value: stats.reduce((a, s) => a + s.value, 0), color: '#a855f7' },
                    { label: 'Esta semana', value: recentWorks.filter((w) => new Date(w.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length, color: '#60a5fa' }].
                    map((pill) =>
                    <div key={pill.label} style={{ border: `1px solid ${pill.color}30` }} className="display-[inline-flex] items-center gap-[0.3rem] bg-[rgba(0,0,0,0.3)] rounded-[100px] p-[0.2rem_0.65rem]">
                        <span style={{ color: pill.color }} className="font-[900] text-[0.9rem]">{pill.value}</span>
                        <span className="text-[rgba(255,255,255,0.45)] text-[0.7rem] font-[600]">{pill.label}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── TILE 2: Safety Score Gauge (bento-score) ── */}
              <div className="bento-item bento-score">
                {/* Ambient glow */}
                <div style={{ filter: isMobile ? 'none' : 'blur(25px)' }} className="absolute bottom-[-20%] left-[50%] transform-[translateX(-50%)] w-[180px] h-[180px] bg-[radial-gradient(circle,_rgba(16,185,129,0.2)_0%,_transparent_70%)] pointer-events-[none]" />

                <div className="flex justify-space-between items-center mb-[0.5rem] relative z-[1]">
                  <h3 className="m-[0] text-[0.95rem] font-[800] text-[white] flex items-center gap-[0.4rem]">
                    <Shield size={16} color="#34d399" weight="duotone" />
                    Score H&amp;S
                  </h3>
                  <span className="text-[0.65rem] text-[rgba(255,255,255,0.4)] font-[600]">Este mes</span>
                </div>

                {(() => {
                  const totalDocs = stats.reduce((a, s) => a + s.value, 0);
                  const accidents = stats.find((s) => s.label === 'Accidentes')?.value ?? 0;
                  const permisos = stats.find((s) => s.label === 'Permisos')?.value ?? 0;
                  // Score: base 60 + docs bonus (hasta 30) - accidents penalty + permits bonus
                  const raw = Math.min(100, Math.max(0,
                  60 + Math.min(totalDocs * 3, 30) - accidents * 8 + Math.min(permisos * 2, 10)
                  ));
                  const score = totalDocs === 0 ? 0 : raw;
                  // SVG arc: r=45, circumference=283
                  const gaugeOffset = 283 - 283 * score / 100;
                  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                  const scoreLabel = score >= 80 ? 'Excelente' : score >= 50 ? 'En Progreso' : score === 0 ? 'Sin datos' : 'Atención';
                  return (
                    <div className="flex-[1] flex flex-col items-center justify-center gap-[0.5rem] relative z-[1]">
                      <div className="relative display-[inline-flex] items-center justify-center">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle className="gauge-track" cx="60" cy="60" r="45" strokeWidth="8" />
                          <circle
                            className="gauge-fill"
                            cx="60" cy="60" r="45"
                            strokeWidth="8"
                            stroke={scoreColor}
                            style={{ '--gauge-offset': gaugeOffset } as React.CSSProperties}
                            transform="rotate(-90 60 60)" />
                          
                        </svg>
                        <div className="absolute text-center">
                          <div style={{ color: scoreColor }} className="text-[1.8rem] font-[900] line-height-[1]">{score}</div>
                          <div className="text-[0.6rem] text-[rgba(255,255,255,0.5)] font-[700] uppercase letter-spacing-[0.5px]">/ 100</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div style={{ color: scoreColor }} className="text-[0.95rem] font-[800]">{scoreLabel}</div>
                        <div className="text-[0.72rem] text-[rgba(255,255,255,0.45)] mt-[0.2rem]">
                          {totalDocs} doc{totalDocs !== 1 ? 's' : ''} registrados
                        </div>
                      </div>
                      {accidents > 0 &&
                      <div className="display-[inline-flex] items-center gap-[0.3rem] bg-[rgba(239,68,68,0.15)] border-[1px_solid_rgba(239,68,68,0.25)] rounded-[100px] p-[0.2rem_0.6rem]">
                          <Warning size={12} color="#ef4444" weight="fill" />
                          <span className="text-[0.68rem] text-[#ef4444] font-[700]">{accidents} accidente{accidents !== 1 ? 's' : ''}</span>
                        </div>
                      }
                    </div>);

                })()}
              </div>

              {/* ── TILE 3: KPIs con Sparklines (bento-kpi) ── */}
              <div className="bento-item bento-kpi">
                <h3 className="m-[0_0_0.9rem_0] text-[0.95rem] font-[800] text-[white] flex items-center gap-[0.4rem]">
                  <ChartPieSlice size={16} color="#f59e0b" weight="duotone" />
                  KPIs Rápidos
                </h3>
                <div className="flex flex-col gap-[0.6rem] flex-[1]">
                  {stats.filter((s) => ['ATS', 'Permisos', 'Checklists'].includes(s.label)).map((stat, i) => {
                    // Build 7-point sparkline from localStorage weekly data
                    const buildSparkline = (key: string) => {
                      try {
                        const items: any[] = JSON.parse(localStorage.getItem(key) || '[]');
                        const weeks: number[] = Array(7).fill(0);
                        items.forEach((item: any) => {
                          const d = new Date(item.fecha || item.createdAt || item.date || 0);
                          const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
                          if (daysAgo >= 0 && daysAgo < 7) weeks[6 - daysAgo]++;
                        });
                        return weeks;
                      } catch {return [0, 0, 0, 0, 0, 0, 0];}
                    };
                    const points = buildSparkline(stat.key);
                    const maxP = Math.max(...points, 1);
                    const W = 80,H = 28;
                    const svgPoints = points.map((v, idx) =>
                    `${idx / 6 * W},${H - v / maxP * (H - 4)}`
                    ).join(' ');
                    const pathD = `M ${svgPoints.split(' ').map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p}`).join(' ').replace(/^M /, '')}`;
                    const areaD = `${pathD} L ${W},${H} L 0,${H} Z`;

                    return (
                      <div key={stat.key} className="flex items-center gap-[0.7rem] bg-[rgba(0,0,0,0.2)] rounded-[12px] border-[1px_solid_rgba(255,255,255,0.06)] p-[0.6rem_0.8rem]">
                        <div style={{ background: `${stat.color}20` }} className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center flex-shrink-[0]">
                          {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 16, color: stat.color })}
                        </div>
                        <div className="flex-[1] min-width-[0]">
                          <div className="text-[0.75rem] text-[rgba(255,255,255,0.6)] font-[600]">{stat.label}</div>
                        </div>
                        {/* Sparkline */}
                        <svg width={W} height={H} className="sparkline-svg" style={{ color: stat.color, '--sparkline-len': '300', '--spark-delay': `${0.3 + i * 0.1}s` } as React.CSSProperties}>
                          <defs>
                            <linearGradient id={`sg-${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={stat.color} stopOpacity="0.4" />
                              <stop offset="100%" stopColor={stat.color} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={areaD} fill={`url(#sg-${i})`} className="sparkline-area" />
                          <polyline points={svgPoints} className="sparkline-line" />
                        </svg>
                        <div className="kpi-value-glow" style={{ fontSize: '1.4rem', fontWeight: 900, color: stat.color, minWidth: '2ch', textAlign: 'right', '--kpi-delay': `${0.4 + i * 0.1}s` } as React.CSSProperties}>
                          {stat.value}
                        </div>
                      </div>);

                  })}
                </div>
              </div>

              {/* ── TILE 4: Activity Timeline (bento-timeline) ── */}
              {!isMobile &&
              <div className="bento-item bento-timeline">
                <div className="flex justify-space-between items-center mb-[0.8rem]">
                  <h3 className="m-[0] text-[0.95rem] font-[800] text-[white] flex items-center gap-[0.4rem]">
                    <Activity size={16} color="#60a5fa" weight="duotone" />
                    Actividad Reciente
                  </h3>
                  {recentWorks.length > 0 &&
                  <span className="text-[0.65rem] text-[rgba(255,255,255,0.35)] font-[600]">
                      {recentWorks.length} entradas
                    </span>
                  }
                </div>
                <div className="flex-[1] relative flex flex-col gap-[0]">
                  {/* Vertical line */}
                  {recentWorks.length > 0 &&
                  <div className="absolute left-[4px] top-[5px] bottom-[5px] w-[1px] bg-[linear-gradient(to_bottom,_rgba(59,130,246,0.4),_transparent)] rounded-[1px]" />
                  }
                  {recentWorks.length > 0 ? recentWorks.slice(0, 4).map((work, i) => {
                    const tc = typeColors[work.type] || typeColors['ATS'];
                    return (
                      <div
                        key={i}
                        onClick={() => handleRecentWorkClick(work.type)}
                        style={{ marginBottom: i < 3 ? '0.2rem' : 0 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} className="flex items-start gap-[0.75rem] p-[0.5rem_0.5rem_0.5rem_0] cursor-pointer rounded-[10px] transition-[background_0.2s]">
                        
                        {/* Dot on the timeline */}
                        <div className="pl-[0px] pt-[3px] flex-shrink-[0]">
                          <div className="timeline-dot ml-[0]" style={{ color: tc.text }} />
                        </div>
                        <div className="overflow-[hidden] flex-[1]">
                          <div className="text-[white] text-[0.8rem] font-[700] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">
                            {work.title || 'Sin título'}
                          </div>
                          <div className="flex items-center gap-[0.4rem] mt-[1px]">
                            <span style={{ color: tc.text, background: `${tc.text}18` }} className="text-[0.65rem] font-[700] rounded-[4px] p-[0_4px]">{work.type}</span>
                            <span className="text-[0.65rem] text-[rgba(255,255,255,0.3)] font-[500]">
                              {new Date(work.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>);

                  }) :
                  <div className="flex-[1] flex flex-col items-center justify-center text-[rgba(255,255,255,0.25)] gap-[0.5rem] p-[1rem]">
                      <ClockCounterClockwise size={28} weight="duotone" />
                      <span className="text-[0.8rem] font-[600]">Sin actividad reciente</span>
                    </div>
                  }
                </div>
              </div>
              }

              {/* ── TILE 5: Quick Access (bento-quick) ── */}
              {!isMobile &&
              <div className="bento-item bento-quick">
                <h3 className="m-[0_0_0.8rem_0] text-[0.95rem] font-[800] text-[white] flex items-center gap-[0.4rem]">
                  <Star size={16} color="#f59e0b" weight="fill" />
                  Acceso Rápido
                </h3>
                <div className="grid grid-template-columns-[repeat(auto-fill,_minmax(100px,_1fr))] gap-[0.6rem] flex-[1]">
                  {quickLinks.filter((l) => l.featured).slice(0, 6).map((link, i) => {
                    const hexToRgb = (hex: string) => {
                      const m = hex.replace('#', '').match(/.{2}/g);
                      if (!m) return '59 130 246';
                      return `${parseInt(m[0], 16)} ${parseInt(m[1], 16)} ${parseInt(m[2], 16)}`;
                    };
                    return (
                      <div
                        key={link.to}
                        className="bento-quick-card"
                        style={{ '--card-accent-rgb': hexToRgb(link.color) } as React.CSSProperties}
                        onClick={() => navigate(link.to)}>
                        
                        <div style={{ color: link.color }}>
                          {React.cloneElement(link.icon as React.ReactElement<any>, { size: 26 })}
                        </div>
                        <div className="text-[white] font-[700] text-[0.8rem] line-height-[1.2]">{link.label}</div>
                        {link.norm &&
                        <span style={{ color: `${link.color}aa`, background: `${link.color}15` }} className="text-[0.58rem] font-[700] rounded-[4px] p-[1px_5px]">
                            {link.norm}
                          </span>
                        }
                      </div>);

                  })}
                </div>
              </div>
              }

            </div>
            {/* --- FIN BENTO GRID --- */}

          </div>
        </div>)
        }


      {/* Marketing Landing Content - Primary for visitors */}
      {!currentUser &&
        <Suspense fallback={<div className="p-[4rem] text-center text-[var(--color-text-muted)]">Cargando...</div>}>
          <div className="mt-[0]">
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
        }


      {/* Dashboard for Logged Users */}
      {currentUser &&
        <div className="mt-[2.5rem] max-w-[1200px] m-[2.5rem_auto_0] p-[0_1rem]">
          
          {/* Professional Tools Grid */}
          <div className="mb-[4rem]">
            <div className="flex flex-col gap-[1.5rem] mb-[2rem]">
              <div className="flex justify-space-between items-end flex-wrap gap-[1rem]">
                <div>
                  <h2 className="text-[clamp(1.5rem,_4vw,_2rem)] font-[900] m-[0] text-[var(--color-text)] flex items-center gap-[0.6rem] letter-spacing-[-1px]">








                    
                    <Star size={28} fill="#f59e0b" color="#f59e0b" />
                    Bóveda Pro
                  </h2>
                  <p className="m-[0.5rem_0_0] text-[var(--color-text-muted)] text-[0.95rem]">
                    Herramientas y módulos avanzados para tu gestión de seguridad.
                  </p>
                </div>
              </div>

              {/* Categories Tabs */}
              <div className="hide-scrollbar flex gap-[0.5rem] overflow-x-[auto] p-[0.2rem_0.2rem_0.7rem_0.2rem]">
                {categories.map((cat) =>
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`p-[0.55rem_1.15rem] rounded-[100px] border-[1px_solid] font-[600] text-[0.82rem] cursor-pointer white-space-[nowrap] transition-[all_0.25s_cubic-bezier(0.16,_1,_0.3,_1)] min-h-[auto] box-shadow-[none] ${activeCategory === cat.id ? 'cat-pill-active' : ''}`}
                  style={{



                    borderColor: activeCategory === cat.id ? 'transparent' : 'var(--color-border)',
                    background: activeCategory === cat.id ? undefined : 'transparent',
                    color: activeCategory === cat.id ? undefined : 'var(--color-text-muted)'







                  }}>
                  
                    {cat.label}
                  </button>
                )}
              </div>
            </div>

            <div style={{

              gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(110px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: isMobile ? '0.6rem' : '1.2rem'

            }} className="grid grid-auto-rows-[auto]">
              {filteredLinks.length > 0 ? filteredLinks.map((link, i) => {
                // Convert hex color to RGB triplet for CSS custom property
                const hexToRgb = (hex: string) => {
                  const m = hex.replace('#', '').match(/.{2}/g);
                  if (!m) return '59 130 246';
                  return `${parseInt(m[0], 16)} ${parseInt(m[1], 16)} ${parseInt(m[2], 16)}`;
                };
                const accentRgb = hexToRgb(link.color);
                const isRecent = recentModulePaths.has(link.to);
                const staggerDelay = `${Math.min(i * 0.04, 0.6)}s`;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    id={`module-${link.to.replace('/', '')}`}
                    className="module-card module-card-animate"
                    style={{
                      '--stagger-delay': staggerDelay,
                      '--card-accent-rgb': accentRgb,
                      textDecoration: 'none',
                      padding: isMobile ? '1rem 0.5rem' : '1.4rem 1rem',
                      borderRadius: isMobile ? '16px' : '20px',
                      background: 'var(--color-surface)',
                      border: `1px solid var(--color-border)`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: isMobile ? '0.4rem' : '0.65rem',
                      minHeight: isMobile ? '130px' : '175px'
                    } as React.CSSProperties}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
                      e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `rgba(${accentRgb} / 0.45)`;
                      e.currentTarget.style.background = `linear-gradient(150deg, ${link.bg}, var(--color-surface))`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'var(--color-surface)';
                    }}>
                    
                    {/* Top-right area: badge + recent dot */}
                    <div style={{

                      top: isMobile ? '0.45rem' : '0.7rem',
                      right: isMobile ? '0.45rem' : '0.7rem'




                    }} className="absolute flex items-center gap-[4px] z-[2]">
                      {moduleCounts[link.to] > 0 &&
                      <span style={{




                        fontSize: isMobile ? '0.6rem' : '0.65rem'


                      }} className="bg-[rgba(255,255,255,0.08)] text-[var(--color-text-muted)] p-[2px_6px] rounded-[100px] font-[700] border-[1px_solid_rgba(255,255,255,0.05)]">
                          {moduleCounts[link.to]}
                        </span>
                      }
                      {isRecent && <span className="module-recent-dot" title="Usado esta semana" />}
                      {link.badge &&
                      <span style={{
                        background: `linear-gradient(135deg, ${link.color}, ${link.color}cc)`,



                        fontSize: isMobile ? '0.52rem' : '0.62rem',


                        boxShadow: `0 2px 8px rgba(${accentRgb} / 0.35)`

                      }} className="text-[#fff] p-[2px_6px] rounded-[100px] font-[800] letter-spacing-[0.3px] line-height-[1.4]">
                          {link.badge}
                        </span>
                      }
                    </div>

                    {/* Icon */}
                    <div className={`premium-icon-box  flex-shrink-[0] ${link.category === 'ia' ? 'ai-magic-box' : ''}`} style={{
                      width: isMobile ? '40px' : '54px',
                      height: isMobile ? '40px' : '54px',
                      color: link.color

                    }}>
                      {React.cloneElement(link.icon as React.ReactElement<any>, {
                        size: isMobile ? 22 : 28,
                        className: link.category === 'ia' ? 'ai-magic-icon' : 'icon-glow-soft'
                      })}
                    </div>

                    {/* Label + subtitle */}
                    <div className="w-[100%] p-[0_0.15rem]">
                      <h3 style={{

                        fontSize: isMobile ? '0.78rem' : '0.92rem'






                      }} className="m-[0] font-[800] text-[var(--color-text)] word-break-[break-word] hyphens-[auto] line-height-[1.2] text-center">
                        {link.label}
                      </h3>
                      {!isMobile &&
                      <p className="m-[0.2rem_0_0] text-[0.75rem] text-[var(--color-text-muted)] line-height-[1.3] opacity-[0.8] word-break-[break-word] hyphens-[auto]">







                        
                          {link.sub}
                        </p>
                      }
                    </div>

                    {/* Normative badge — bottom, only on desktop */}
                    {!isMobile && link.norm &&
                    <span
                      className="module-norm-badge"
                      style={{ '--card-accent-rgb': accentRgb } as React.CSSProperties}>
                      
                        {link.norm}
                      </span>
                    }
                  </Link>);

              }) :
              <div className="grid-column-[1_/_-1] text-center p-[4rem_0] text-[var(--color-text-muted)]">
                  <MagnifyingGlass size={48} className="opacity-[0.2] mb-[1rem]" />
                  <h3 className="m-[0] text-[1.2rem] font-[700]">No se encontraron herramientas</h3>
                  <p className="m-[0.5rem_0_0] text-[0.9rem]">Probá con otro término de búsqueda.</p>
                </div>
              }
            </div>
          </div>


          {/* Recent Works */}
          {recentWorks.length > 0 &&
          <div className="mb-[3rem]">
              <h2 className="text-[clamp(1.3rem,_4vw,_1.5rem)] font-[900] mb-[1.5rem] text-[var(--color-text)] flex items-center gap-[0.6rem]">







              
                <ClockCounterClockwise weight="duotone" size={24} color="var(--color-primary)" />
                Trabajos Recientes
              </h2>
          <div className="flex flex-col gap-4">
            {recentWorks.map((work, i) =>
              <div
                key={i}
                className="card p-[1.2rem] flex items-center gap-[1.2rem] transition-[all_0.2s_ease] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[16px] cursor-pointer box-shadow-[var(--shadow-sm)]"












                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-hover)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-hover)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
                }}
                onClick={() => handleRecentWorkClick(work.type)}>
                
                <div style={{


                  background: typeColors[work.type]?.bg || 'rgba(59,130,246,0.1)',




                  color: typeColors[work.type]?.text || '#3b82f6',

                  boxShadow: `0 4px 12px ${typeColors[work.type]?.bg || 'rgba(59,130,246,0.1)'}`
                }} className="w-[48px] h-[48px] rounded-[12px] flex items-center justify-center flex-shrink-[0]">
                  {typeColors[work.type]?.icon || <FileText size={22} weight="duotone" />}
                </div>
                <div className="flex-[1] min-width-[0]">
                  <h3 className="m-[0] text-[1rem] font-[700] text-[var(--color-text)] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">
                    {work.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-[0.5rem] text-[0.8rem] text-[var(--color-text-muted)] mt-[0.3rem]">
                    <span>{work.subtitle}</span>
                    <span>•</span>
                    <span>{new Date(work.date).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
                <div className="p-[0.3rem_0.8rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] text-[var(--color-text-muted)] rounded-[100px] text-[0.75rem] font-[700] flex items-center gap-[0.4rem]">










                  
                  {work.type} <ArrowRight size={16} weight="bold" />
                </div>
              </div>
              )}
          </div>
        </div>
          }
        </div>
        }
      {/* Removed legacy onboarding modal in favor of MarketingLanding */}

    </div>
    </AnimatedPage>);

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
    a: userCountry === 'argentina' ?
    'Los cálculos están basados en la Ley 19.587, el Dec. 351/79, resoluciones SRT y normativas vigentes.' :
    `Los cálculos y módulos están adaptados a las normativas vigentes de ${userCountry.charAt(0).toUpperCase() + userCountry.slice(1)}.`
  },
  { q: '¿Mis datos están seguros?', a: 'Sí. Usamos Firebase (Google) para autenticación y almacenamiento cifrado. Tu información está protegida y bajo tu control.' },
  { q: '¿Funciona en el celular?', a: 'Perfecto. Está optimizada para mobile y podés instalarla directamente en tu pantalla de inicio como una app nativa (PWA).' },
  { q: '¿Cómo cancelo la suscripción PRO?', a: 'En cualquier momento desde tu perfil, en la sección Suscripción. No hay contratos de permanencia ni cargos ocultos.' }];


  return (
    <div className="flex flex-col gap-[0.75rem] mb-[2rem]">
      {items.map((item, i) =>
      <div
        key={i}
        style={{


          border: open === i ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--color-border)',
          background: open === i ? 'rgba(59,130,246,0.04)' : 'var(--color-surface)',

          boxShadow: open === i ? '0 4px 20px rgba(59,130,246,0.08)' : 'none'
        }} className="rounded-[16px] overflow-[hidden] transition-[all_0.25s_ease]">
        
          <button
          onClick={() => setOpen(open === i ? null : i)}
          style={{












            color: open === i ? 'var(--color-primary)' : 'var(--color-text)'


          }} className="w-[100%] text-left bg-[none] border-none p-[1.1rem_1.4rem] cursor-pointer flex justify-space-between items-center gap-[1rem] font-[700] text-[0.95rem] transition-[color_0.2s] min-h-[48px]">
          
            <span className="flex-[1]">{item.q}</span>
            <div
            style={{



              background: open === i ? 'var(--color-primary)' : 'rgba(59,130,246,0.08)',
              border: `1px solid ${open === i ? 'var(--color-primary)' : 'rgba(59,130,246,0.15)'}`





            }} className="w-[28px] h-[28px] rounded-[50%] flex items-center justify-center flex-shrink-[0] transition-[all_0.3s_ease]">
            
              <span
              style={{

                color: open === i ? 'white' : 'var(--color-primary)',


                transform: open === i ? 'rotate(45deg)' : 'rotate(0)'


              }} className="text-[1.1rem] line-height-[1] block transition-[transform_0.3s_ease] font-[300]">
              
                +
              </span>
            </div>
          </button>
          <div
          style={{
            maxHeight: open === i ? '300px' : '0'


          }} className="overflow-[hidden] transition-[max-height_0.35s_cubic-bezier(0.16,_1,_0.3,_1)]">
          
            <div className="p-[0_1.4rem_1.2rem] text-[0.9rem] text-[var(--color-text-muted)] line-height-[1.7] border-top-[1px_solid_var(--color-border)] pt-[1rem]">








            
              {item.a}
            </div>
          </div>
        </div>
      )}
    </div>);

}