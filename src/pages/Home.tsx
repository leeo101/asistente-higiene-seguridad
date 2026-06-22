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
  { to: '/ai-advisor',               icon: <Robot weight="duotone" size={26} />,          label: 'Asesor IA',             sub: 'Consultas de Seguridad',                     color: '#a855f7', bg: 'rgba(168,85,247,0.1)',    premium: true, category: 'ia',         featured: true, badge: 'IA',    norm: 'ISO 45001' },
  { to: '/ats',                       icon: <ShieldCheck weight="duotone" size={26} />,    label: 'ATS',                   sub: 'Análisis Trabajo Seguro',                    color: '#10b981', bg: 'rgba(16,185,129,0.1)',   premium: true, category: 'docs',       featured: true,                norm: 'ISO 45001' },
  { to: '/audit',                     icon: <ClipboardText weight="duotone" size={26} />,  label: 'Auditorías',            sub: 'Control Interno y EHS',                      color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   premium: true, category: 'management',                        norm: 'ISO 45001' },
  { to: '/ai-camera-manager',         icon: <Camera weight="duotone" size={26} />,         label: 'Cámara IA',             sub: 'Detección EPP',                              color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)',   premium: true, category: 'ia',         featured: true, badge: 'IA',    norm: 'ISO 45001' },
  { to: '/capa',                      icon: <CheckCircle weight="duotone" size={26} />,    label: 'CAPA',                  sub: 'Acciones Correctivas',                       color: '#10b981', bg: 'rgba(16,185,129,0.1)',   premium: true, category: 'management',                        norm: 'ISO 9001' },
  { to: '/training-management',       icon: <Users weight="duotone" size={26} />,          label: 'Capacitar',             sub: 'Planillas y Asistencia',                     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   premium: true, category: 'management',                        norm: 'ISO 45001' },
  { to: '/fire-load',                 icon: <Fire weight="duotone" size={26} />,           label: 'Carga Fuego',           sub: getRegSub('fire'),                            color: '#f97316', bg: 'rgba(249,115,22,0.1)',   premium: true, category: 'specific',                          norm: 'NFPA 13' },
  { to: '/toolbox-talk',              icon: <ChatText weight="duotone" size={26} />,       label: 'Charlas 5 Min',         sub: 'Registro de Capacitación Diaria',            color: '#0052CC', bg: 'rgba(0,82,204,0.1)',     premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'ISO 45001' },
  { to: '/checklists',                icon: <ClipboardText weight="duotone" size={26} />,  label: 'Checklists',            sub: 'Herramientas y Equipos',                     color: '#14b8a6', bg: 'rgba(20,184,166,0.1)',   premium: true, category: 'docs',                              norm: 'ISO 45001' },
  { to: '/ppe-tracker',               icon: <HardHat weight="duotone" size={26} />,        label: 'Control EPP',           sub: 'Vencimientos',                               color: '#10b981', bg: 'rgba(16,185,129,0.08)',  premium: true, category: 'management',                        norm: 'ISO 45001' },
  { to: '/ergonomics',                icon: <PersonArmsSpread weight="duotone" size={26} />, label: 'Ergonomía',           sub: getRegSub('ergo'),                            color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   premium: true, category: 'specific',                          norm: 'ISO 9241' },
  { to: '/confined-space',            icon: <Tent weight="duotone" size={26} />,           label: 'Espacios Confinados',   sub: 'Permisos y Control',                         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   premium: true, category: 'critical',                          norm: 'OSHA 1910' },
  { to: '/thermal-stress',            icon: <ThermometerHot weight="duotone" size={26} />, label: 'Estrés Térmico',        sub: getRegSub('thermal'),                         color: '#f97316', bg: 'rgba(249,115,22,0.1)',   premium: true, category: 'specific',                          norm: 'ISO 7933' },
  { to: '/extinguisher-ai',           icon: <Fire weight="duotone" size={26} />,           label: 'Extintores IA',         sub: 'Reconocimiento',                             color: '#dc2626', bg: 'rgba(220,38,38,0.1)',    premium: true, category: 'ia',                         badge: 'IA',    norm: 'NFPA 10' },
  { to: '/lighting',                  icon: <Lightbulb weight="duotone" size={26} />,      label: 'Iluminación',           sub: getRegSub('lighting'),                        color: '#eab308', bg: 'rgba(234,179,8,0.1)',    premium: true, category: 'specific',                          norm: 'ISO 8995' },
  { to: '/reports',                   icon: <Scroll weight="duotone" size={26} />,         label: 'Informes',              sub: 'Técnicos',                                   color: '#ec4899', bg: 'rgba(236,72,153,0.1)',   premium: true, category: 'docs',                              norm: 'ISO 45001' },
  { to: '/accident-investigation',    icon: <Siren weight="duotone" size={26} />,          label: 'Investigación',         sub: 'Accidentes / Árbol',                         color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    premium: true, category: 'management',                        norm: 'ISO 45001' },
  { to: '/safety-kpis',               icon: <ChartPieSlice weight="duotone" size={26} />,  label: 'KPIs Seguridad',        sub: 'Índices de Siniestralidad y Estadísticas',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'ISO 45001' },
  { to: '/legislation',               icon: <Gavel weight="duotone" size={26} />,          label: 'Legislación',           sub: 'Biblioteca Legal',                           color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   premium: true, category: 'docs',                              norm: 'Legal' },
  { to: '/loto',                      icon: <Lock weight="duotone" size={26} />,           label: 'LOTO',                  sub: 'Bloqueo y Etiquetado',                       color: '#dc2626', bg: 'rgba(220,38,38,0.1)',    premium: true, category: 'critical',                          norm: 'OSHA 1910' },
  { to: '/risk-maps-history',         icon: <MapTrifold weight="duotone" size={26} />,     label: 'Mapas',                 sub: 'Croquis de Riesgos',                         color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   premium: true, category: 'docs',                              norm: 'ISO 31000' },
  { to: '/extintores',                icon: <Fire weight="duotone" size={26} />,           label: 'Matafuegos',            sub: 'Control y Vencimientos',                     color: '#dc2626', bg: 'rgba(220,38,38,0.1)',    premium: true, category: 'management',                        norm: 'NFPA 10' },
  { to: '/environmental',             icon: <Droplets weight="duotone" size={26} />,       label: 'Medio Ambiente',        sub: 'Monitoreo y Control',                        color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)',   premium: true, category: 'specific',                          norm: 'ISO 14001' },
  { to: '/work-permit',               icon: <Key weight="duotone" size={26} />,            label: 'Permisos',              sub: 'Tareas Críticas',                            color: '#2563eb', bg: 'rgba(37,99,235,0.1)',    premium: true, category: 'critical',   featured: true,                norm: 'ISO 45001' },
  { to: '/ai-general-camera-manager', icon: <ShieldWarning weight="duotone" size={26} />,  label: 'Riesgos IA',            sub: 'Análisis de Entorno',                        color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',    premium: true, category: 'ia',                         badge: 'IA',    norm: 'ISO 31000' },
  { to: '/noise-assessment',          icon: <SpeakerHigh weight="duotone" size={26} />,    label: 'Ruido',                 sub: 'Evaluación de Niveles Sonoros',              color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   premium: true, category: 'specific',                          norm: 'ISO 9612' },
  { to: '/chemical-safety',           icon: <Flask weight="duotone" size={26} />,          label: 'Seguridad Química',     sub: 'Gestión de Sustancias y SGA',                color: '#ec4899', bg: 'rgba(236,72,153,0.1)',   premium: true, category: 'specific',                          norm: 'GHS/SGA' },
  { to: '/drills',                    icon: <Siren weight="duotone" size={26} />,          label: 'Simulacros',            sub: 'Actas de Evacuación',                        color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    premium: true, category: 'management',                        norm: 'ISO 45001' },
  { to: '/stop-cards',                icon: <Warning weight="duotone" size={26} />,        label: 'Tarjetas STOP',         sub: 'Observaciones',                              color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    premium: true, category: 'management',                        norm: 'ISO 45001' },
  { to: '/working-at-height',         icon: <HardHat weight="duotone" size={26} />,        label: 'Trabajo en Altura',     sub: 'Permisos y EPP Crítico',                     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   premium: true, category: 'critical',                          norm: 'ISO 45001' },
  { to: '/lifting-form',              icon: <Crane weight="duotone" size={26} />,          label: 'Izaje y Grúas',         sub: 'Plan de Izaje Crítico',                      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   premium: true, category: 'critical',                          norm: 'ASME B30' },
  { to: '/fleet-form',                icon: <Truck weight="duotone" size={26} />,          label: 'Flota y Vehículos',     sub: 'Inspección Pre-Operacional',                 color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)',   premium: true, category: 'management',                        norm: 'ISO 39001' },
  { to: '/evacuation-history',        icon: <Timer weight="duotone" size={26} />,          label: 'Simulador de Evacuación', sub: 'Cálculo de Tiempos',                       color: '#ec4899', bg: 'rgba(236,72,153,0.1)',   premium: true, category: 'specific',                          norm: 'NFPA 101' },
  { to: '/legajos',                   icon: <FileText weight="duotone" size={26} />,       label: 'Legajos Técnicos',      sub: 'Decreto 351/79',                             color: '#eab308', bg: 'rgba(234,179,8,0.1)',    premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'Dec. 351' },
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
        'Accidente': '/accident-investigation',
      };
      const recentPaths = new Set<string>();
      const safeParse2 = (key: string) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
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
        ...safeParse2('accident_history').map((acc: any) => ({ date: acc.date, type: 'Accidente' })),
      ];
      allItems.forEach(item => {
        if (item.date && new Date(item.date).getTime() >= oneWeekAgo) {
          const path = typeToPath[item.type];
          if (path) recentPaths.add(path);
        }
      });
      setRecentModulePaths(recentPaths);
    } catch { /* silently ignore */ }

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

      {/* FIXED TOP NAV FOR GUESTS */}
      {!currentUser && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 8000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.8rem 1.2rem',
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.2rem', color: 'white', letterSpacing: '-0.5px' }}>
            <ShieldCheck weight="duotone" size={24} color="#60a5fa" />
            <span style={{ display: isMobile ? 'none' : 'inline' }}>Asistente H&S</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={() => navigate('/login')} 
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              Iniciar sesión
            </button>
            <button 
              onClick={() => navigate('/login', { state: { view: 'register' } })} 
              className="glow-button" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.95rem', borderRadius: '8px' }}
            >
              Registrarse
            </button>
          </div>
        </div>
      )}

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
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '100px', marginBottom: '2rem', backdropFilter: isMobile ? 'none' : 'blur(8px)' }}>
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
                backdropFilter: isMobile ? 'none' : 'blur(12px)',
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

            {/* --- BENTO GRID — COMMAND CENTER --- */}
            <div className="bento-container stagger-item" style={{ animationDelay: '0.2s' }}>

              {/* ── TILE 1: Daily AI Insight (bento-main) ── */}
              <div className="bento-item bento-main">
                {/* Ambient glow blob */}
                <div style={{
                  position: 'absolute', top: '-30%', right: '-10%',
                  width: '220px', height: '220px',
                  background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
                  pointerEvents: 'none', filter: isMobile ? 'none' : 'blur(20px)'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', position: 'relative', zIndex: 1 }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '100px', padding: '0.25rem 0.7rem', marginBottom: '0.7rem' }}>
                      <Sparkle size={12} color="#c084fc" weight="fill" />
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '1px' }}>IA · Hoy</span>
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                      Resumen Diario
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', margin: '0.3rem 0 0', fontWeight: 500 }}>
                      Consejos y análisis de tu asistente
                    </p>
                  </div>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Robot size={22} weight="duotone" color="#c084fc" />
                  </div>
                </div>

                <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                  {currentUser && dailyInsight ? (
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.2rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {dailyInsight.category}
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{dailyInsight.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{dailyInsight.content}</p>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                        <Sparkle size={24} weight="duotone" />
                        <span style={{ fontSize: '0.8rem' }}>Cargando análisis diario...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total docs stat pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Documentos', value: stats.reduce((a, s) => a + s.value, 0), color: '#a855f7' },
                      { label: 'Esta semana', value: recentWorks.filter(w => new Date(w.date).getTime() > Date.now() - 7*24*60*60*1000).length, color: '#60a5fa' },
                    ].map((pill) => (
                      <div key={pill.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(0,0,0,0.3)', border: `1px solid ${pill.color}30`, borderRadius: '100px', padding: '0.2rem 0.65rem' }}>
                        <span style={{ color: pill.color, fontWeight: 900, fontSize: '0.9rem' }}>{pill.value}</span>
                        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontWeight: 600 }}>{pill.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── TILE 2: Safety Score Gauge (bento-score) ── */}
              <div className="bento-item bento-score">
                {/* Ambient glow */}
                <div style={{ position: 'absolute', bottom: '-20%', left: '50%', transform: 'translateX(-50%)', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', pointerEvents: 'none', filter: isMobile ? 'none' : 'blur(25px)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Shield size={16} color="#34d399" weight="duotone" />
                    Score H&amp;S
                  </h3>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Este mes</span>
                </div>

                {(() => {
                  const totalDocs  = stats.reduce((a, s) => a + s.value, 0);
                  const accidents  = stats.find(s => s.label === 'Accidentes')?.value ?? 0;
                  const permisos   = stats.find(s => s.label === 'Permisos')?.value ?? 0;
                  // Score: base 60 + docs bonus (hasta 30) - accidents penalty + permits bonus
                  const raw = Math.min(100, Math.max(0,
                    60 + Math.min(totalDocs * 3, 30) - accidents * 8 + Math.min(permisos * 2, 10)
                  ));
                  const score = totalDocs === 0 ? 0 : raw;
                  // SVG arc: r=45, circumference=283
                  const gaugeOffset = 283 - (283 * score / 100);
                  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                  const scoreLabel = score >= 80 ? 'Excelente' : score >= 50 ? 'En Progreso' : score === 0 ? 'Sin datos' : 'Atención';
                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', position: 'relative', zIndex: 1 }}>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle className="gauge-track" cx="60" cy="60" r="45" strokeWidth="8" />
                          <circle
                            className="gauge-fill"
                            cx="60" cy="60" r="45"
                            strokeWidth="8"
                            stroke={scoreColor}
                            style={{ '--gauge-offset': gaugeOffset } as React.CSSProperties}
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div style={{ position: 'absolute', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</div>
                          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>/ 100</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: scoreColor }}>{scoreLabel}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem' }}>
                          {totalDocs} doc{totalDocs !== 1 ? 's' : ''} registrados
                        </div>
                      </div>
                      {accidents > 0 && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '100px', padding: '0.2rem 0.6rem' }}>
                          <Warning size={12} color="#ef4444" weight="fill" />
                          <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700 }}>{accidents} accidente{accidents !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* ── TILE 3: KPIs con Sparklines (bento-kpi) ── */}
              <div className="bento-item bento-kpi">
                <h3 style={{ margin: '0 0 0.9rem 0', fontSize: '0.95rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ChartPieSlice size={16} color="#f59e0b" weight="duotone" />
                  KPIs Rápidos
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                  {stats.filter(s => ['ATS', 'Permisos', 'Checklists'].includes(s.label)).map((stat, i) => {
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
                      } catch { return [0,0,0,0,0,0,0]; }
                    };
                    const points = buildSparkline(stat.key);
                    const maxP = Math.max(...points, 1);
                    const W = 80, H = 28;
                    const svgPoints = points.map((v, idx) =>
                      `${(idx / 6) * W},${H - (v / maxP) * (H - 4)}`
                    ).join(' ');
                    const pathD = `M ${svgPoints.split(' ').map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p}`).join(' ').replace(/^M /, '')}`;
                    const areaD = `${pathD} L ${W},${H} L 0,${H} Z`;

                    return (
                      <div key={stat.key} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '0.6rem 0.8rem' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 16, color: stat.color })}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{stat.label}</div>
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── TILE 4: Activity Timeline (bento-timeline) ── */}
              {!isMobile && (
              <div className="bento-item bento-timeline">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Activity size={16} color="#60a5fa" weight="duotone" />
                    Actividad Reciente
                  </h3>
                  {recentWorks.length > 0 && (
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                      {recentWorks.length} entradas
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {/* Vertical line */}
                  {recentWorks.length > 0 && (
                    <div style={{ position: 'absolute', left: '4px', top: '5px', bottom: '5px', width: '1px', background: 'linear-gradient(to bottom, rgba(59,130,246,0.4), transparent)', borderRadius: '1px' }} />
                  )}
                  {recentWorks.length > 0 ? recentWorks.slice(0, 4).map((work, i) => {
                    const tc = typeColors[work.type] || typeColors['ATS'];
                    return (
                      <div
                        key={i}
                        onClick={() => handleRecentWorkClick(work.type)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem 0.5rem 0.5rem 0', cursor: 'pointer', borderRadius: '10px', transition: 'background 0.2s', marginBottom: i < 3 ? '0.2rem' : 0 }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Dot on the timeline */}
                        <div style={{ paddingLeft: '0px', paddingTop: '3px', flexShrink: 0 }}>
                          <div className="timeline-dot" style={{ color: tc.text, marginLeft: '0' }} />
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {work.title || 'Sin título'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1px' }}>
                            <span style={{ fontSize: '0.65rem', color: tc.text, fontWeight: 700, background: `${tc.text}18`, borderRadius: '4px', padding: '0 4px' }}>{work.type}</span>
                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                              {new Date(work.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', gap: '0.5rem', padding: '1rem' }}>
                      <ClockCounterClockwise size={28} weight="duotone" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sin actividad reciente</span>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* ── TILE 5: Quick Access (bento-quick) ── */}
              {!isMobile && (
              <div className="bento-item bento-quick">
                <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Star size={16} color="#f59e0b" weight="fill" />
                  Acceso Rápido
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.6rem', flex: 1 }}>
                  {quickLinks.filter(l => l.featured).slice(0, 6).map((link, i) => {
                    const hexToRgb = (hex: string) => {
                      const m = hex.replace('#','').match(/.{2}/g);
                      if (!m) return '59 130 246';
                      return `${parseInt(m[0],16)} ${parseInt(m[1],16)} ${parseInt(m[2],16)}`;
                    };
                    return (
                      <div
                        key={link.to}
                        className="bento-quick-card"
                        style={{ '--card-accent-rgb': hexToRgb(link.color) } as React.CSSProperties}
                        onClick={() => navigate(link.to)}
                      >
                        <div style={{ color: link.color }}>
                          {React.cloneElement(link.icon as React.ReactElement<any>, { size: 26 })}
                        </div>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.2 }}>{link.label}</div>
                        {link.norm && (
                          <span style={{ fontSize: '0.58rem', color: `${link.color}aa`, fontWeight: 700, background: `${link.color}15`, borderRadius: '4px', padding: '1px 5px' }}>
                            {link.norm}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              )}

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
                    className={activeCategory === cat.id ? 'cat-pill-active' : ''}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '100px',
                      border: '1px solid',
                      borderColor: activeCategory === cat.id ? 'transparent' : 'var(--color-border)',
                      background: activeCategory === cat.id ? undefined : 'transparent',
                      color: activeCategory === cat.id ? undefined : 'var(--color-text-muted)',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      minHeight: 'auto',
                      boxShadow: 'none',
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
              gap: isMobile ? '0.6rem' : '1.2rem',
              gridAutoRows: 'auto'
            }}>
              {filteredLinks.length > 0 ? filteredLinks.map((link, i) => {
                // Convert hex color to RGB triplet for CSS custom property
                const hexToRgb = (hex: string) => {
                  const m = hex.replace('#','').match(/.{2}/g);
                  if (!m) return '59 130 246';
                  return `${parseInt(m[0],16)} ${parseInt(m[1],16)} ${parseInt(m[2],16)}`;
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
                      minHeight: isMobile ? '130px' : '175px',
                    } as React.CSSProperties}
                    onMouseMove={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
                      e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = `rgba(${accentRgb} / 0.45)`;
                      e.currentTarget.style.background = `linear-gradient(150deg, ${link.bg}, var(--color-surface))`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.background = 'var(--color-surface)';
                    }}
                  >
                    {/* Top-right area: badge + recent dot */}
                    <div style={{
                      position: 'absolute',
                      top: isMobile ? '0.45rem' : '0.7rem',
                      right: isMobile ? '0.45rem' : '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 2,
                    }}>
                      {moduleCounts[link.to] > 0 && (
                        <span style={{
                          background: 'rgba(255,255,255,0.08)',
                          color: 'var(--color-text-muted)',
                          padding: '2px 6px',
                          borderRadius: '100px',
                          fontSize: isMobile ? '0.6rem' : '0.65rem',
                          fontWeight: 700,
                          border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                          {moduleCounts[link.to]}
                        </span>
                      )}
                      {isRecent && <span className="module-recent-dot" title="Usado esta semana" />}
                      {link.badge && (
                        <span style={{
                          background: `linear-gradient(135deg, ${link.color}, ${link.color}cc)`,
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '100px',
                          fontSize: isMobile ? '0.52rem' : '0.62rem',
                          fontWeight: 800,
                          letterSpacing: '0.3px',
                          boxShadow: `0 2px 8px rgba(${accentRgb} / 0.35)`,
                          lineHeight: 1.4,
                        }}>
                          {link.badge}
                        </span>
                      )}
                    </div>

                    {/* Icon */}
                    <div className={`premium-icon-box ${link.category === 'ia' ? 'ai-magic-box' : ''}`} style={{
                      width: isMobile ? '40px' : '54px',
                      height: isMobile ? '40px' : '54px',
                      color: link.color,
                      flexShrink: 0,
                    }}>
                      {React.cloneElement(link.icon as React.ReactElement<any>, {
                        size: isMobile ? 22 : 28,
                        className: link.category === 'ia' ? 'ai-magic-icon' : 'icon-glow-soft',
                      })}
                    </div>

                    {/* Label + subtitle */}
                    <div style={{ width: '100%', padding: '0 0.15rem' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: isMobile ? '0.78rem' : '0.92rem',
                        fontWeight: 800,
                        color: 'var(--color-text)',
                        wordBreak: 'break-word',
                        hyphens: 'auto',
                        lineHeight: 1.2,
                        textAlign: 'center',
                      }}>
                        {link.label}
                      </h3>
                      {!isMobile && (
                        <p style={{
                          margin: '0.2rem 0 0',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.3,
                          opacity: 0.8,
                          wordBreak: 'break-word',
                          hyphens: 'auto',
                        }}>
                          {link.sub}
                        </p>
                      )}
                    </div>

                    {/* Normative badge — bottom, only on desktop */}
                    {!isMobile && link.norm && (
                      <span
                        className="module-norm-badge"
                        style={{ '--card-accent-rgb': accentRgb } as React.CSSProperties}
                      >
                        {link.norm}
                      </span>
                    )}
                  </Link>
                );
              }) : (
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
