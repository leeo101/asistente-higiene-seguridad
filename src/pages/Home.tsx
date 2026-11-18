import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
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
  Tent, Drop as Droplets, SpeakerHigh, Flask, MagnifyingGlass, TrendUp as TrendingUp, Truck, Crane, Timer, Sparkle, Lightning, Wind, Package, Archive } from
'@phosphor-icons/react';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { getCountryNormativa } from '../data/legislationData';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePaywall } from '../hooks/usePaywall';
import { API_BASE_URL } from '../config';
import { auth, db } from '../firebase';
import AnimatedPage from '../components/AnimatedPage';
import StarryBackground from '../components/StarryBackground';
import StickyCtaBanner from '../components/StickyCtaBanner';
import CommandCenterDashboard from '../components/CommandCenterDashboard';
import { safeJsonParse, safeGetLocalStorage } from '../utils/storageHelper';

// Marketing Landing para usuarios no autenticados
const MarketingLanding = lazy(() => import('../components/landing/MarketingLanding'));

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

const personalDataObj = safeGetLocalStorage<Record<string, any>>('personalData', {});
const userCountry = personalDataObj.country?.toLowerCase() || 'argentina';

const getRegSub = (module: string): string => {
  const norms: any = getCountryNormativa(userCountry);
  return norms[module] || 'Referencia Normativa Local';
};

const quickLinks: QuickLink[] = [
{ to: '/ai-advisor', icon: <Robot weight="duotone" size={26} />, label: 'Asesor IA', sub: 'Consultas, normativa y análisis con IA', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', premium: true, category: 'ia', featured: true, badge: 'IA', norm: 'ISO 45001' },
{ to: '/ats', icon: <ShieldCheck weight="duotone" size={26} />, label: 'ATS', sub: 'Análisis de Trabajo Seguro — IPERC', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'docs', featured: true, norm: 'ISO 45001' },
{ to: '/audit', icon: <ClipboardText weight="duotone" size={26} />, label: 'Auditorías', sub: 'Auditorías internas ISO 45001 / EHS', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/ai-camera-manager', icon: <Camera weight="duotone" size={26} />, label: 'Cámara IA', sub: 'Detección de EPP en tiempo real', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'ia', featured: true, badge: 'IA', norm: 'ISO 45001' },
{ to: '/capa', icon: <CheckCircle weight="duotone" size={26} />, label: 'CAPA', sub: 'Acciones Correctivas, Preventivas y de Mejora', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'management', norm: 'ISO 9001' },
{ to: '/training-management', icon: <Users weight="duotone" size={26} />, label: 'Capacitar', sub: 'Gestión de Capacitaciones y Asistencia', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/fire-load', icon: <Fire weight="duotone" size={26} />, label: 'Carga Fuego', sub: 'Estudio Oficial Dec. 351/79 Anexo VII — Madera Eq., RF y Extintores', color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true, category: 'specific', featured: true, badge: 'Dec. 351/79', norm: 'Dec. 351/79' },
{ to: '/toolbox-talk', icon: <ChatText weight="duotone" size={26} />, label: 'Charlas 5 Min', sub: 'Toolbox Talks — Registro y Firmas Digitales', color: '#0052CC', bg: 'rgba(0,82,204,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'ISO 45001' },
{ to: '/checklists', icon: <ClipboardText weight="duotone" size={26} />, label: 'Checklists', sub: 'Inspección de Herramientas, Equipos y Áreas', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', premium: true, category: 'docs', norm: 'ISO 45001' },
{ to: '/ppe-tracker', icon: <HardHat weight="duotone" size={26} />, label: 'Control EPP', sub: 'Constancia Oficial Res. 299/11 y Trazabilidad AR', color: '#10b981', bg: 'rgba(16,185,129,0.08)', premium: true, category: 'management', featured: true, badge: 'Res. 299/11', norm: 'Res. 299/11' },
{ to: '/ergonomics', icon: <PersonArmsSpread weight="duotone" size={26} />, label: 'Ergonomía', sub: 'Protocolo Oficial Planillas 1 y 2 — Res. SRT 886/15', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'specific', featured: true, badge: 'Res. 886/15', norm: 'Res. 886/15' },
{ to: '/confined-space', icon: <Tent weight="duotone" size={26} />, label: 'Espacios Confinados', sub: 'Permiso Oficial PTSEC Res. SRT 953/10, Monitoreo Gases y LOTO', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'critical', featured: true, badge: 'Res. SRT 953/10', norm: 'Res. SRT 953/10' },
{ to: '/thermal-stress', icon: <ThermometerHot weight="duotone" size={26} />, label: 'Estrés Térmico', sub: 'Protocolo Oficial Carga Térmica (TGBH) y Frío — Res. 295/03 y SRT 30/23', color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true, category: 'specific', featured: true, badge: 'Res. 295/03 & 30/23', norm: 'Res. 295/03' },
{ to: '/extinguisher-ai', icon: <Fire weight="duotone" size={26} />, label: 'Extintores IA', sub: 'Identificación y diagnóstico con IA', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'ia', badge: 'IA', norm: 'NFPA 10' },
{ to: '/lighting', icon: <Lightbulb weight="duotone" size={26} />, label: 'Iluminación', sub: 'Protocolo Oficial Luxometría — Res. SRT 84/12', color: '#eab308', bg: 'rgba(234,179,8,0.1)', premium: true, category: 'specific', featured: true, badge: 'Res. 84/12', norm: 'Res. 84/12' },
{ to: '/reports', icon: <Scroll weight="duotone" size={26} />, label: 'Informes', sub: 'Informes Técnicos y Memorias de Cálculo', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'docs', norm: 'ISO 45001' },
{ to: '/accident-investigation', icon: <Siren weight="duotone" size={26} />, label: 'Investigación', sub: 'Árbol de Causas y Análisis de Accidentes', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/safety-kpis', icon: <ChartPieSlice weight="duotone" size={26} />, label: 'KPIs Seguridad', sub: 'IF, IG, IA — Indicadores de Siniestralidad', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'ISO 45001' },
{ to: '/legislation', icon: <Gavel weight="duotone" size={26} />, label: 'Legislación', sub: 'Normativa actualizada por país y sector', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'docs', norm: 'Legal' },
{ to: '/loto', icon: <Lock weight="duotone" size={26} />, label: 'LOTO', sub: 'Bloqueo y Etiquetado — Dec. 351/79 (5 Reglas de Oro) y OSHA 1910', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'critical', featured: true, badge: 'Dec. 351 & OSHA', norm: 'Dec. 351/79' },
{ to: '/risk-maps-history', icon: <MapTrifold weight="duotone" size={26} />, label: 'Mapas', sub: 'Mapas de Riesgos y Planos de Evacuación', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'docs', norm: 'ISO 31000' },
{ to: '/extintores', icon: <Fire weight="duotone" size={26} />, label: 'Matafuegos', sub: 'Inventario, Recarga y Vencimientos', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', premium: true, category: 'management', norm: 'NFPA 10' },
{ to: '/mensajes', icon: <ChatText weight="duotone" size={26} />, label: 'Mensajería Pro', sub: 'Chat entre profesionales H&S', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'management', badge: 'PRO', norm: 'ISO 45001' },
{ to: '/environmental', icon: <Droplets weight="duotone" size={26} />, label: 'Medio Ambiente', sub: 'Monitoreo Ambiental — ISO 14001', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'specific', norm: 'ISO 14001' },
{ to: '/work-permit', icon: <Key weight="duotone" size={26} />, label: 'Permisos', sub: 'Permisos de Trabajo en Tareas de Alto Riesgo', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', premium: true, category: 'critical', featured: true, norm: 'ISO 45001' },
{ to: '/ai-general-camera-manager', icon: <ShieldWarning weight="duotone" size={26} />, label: 'Riesgos IA', sub: 'Detección de riesgos en el entorno con IA', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', premium: true, category: 'ia', badge: 'IA', norm: 'ISO 31000' },
{ to: '/noise-assessment', icon: <SpeakerHigh weight="duotone" size={26} />, label: 'Ruido', sub: 'Protocolo Oficial Ruido Laboral — Res. SRT 85/12', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', premium: true, category: 'specific', featured: true, badge: 'Res. 85/12', norm: 'Res. 85/12' },
{ to: '/asset-scanner', icon: <Sparkle weight="duotone" size={26} />, label: 'Escáner QR', sub: 'Control de activos con códigos QR', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'management', badge: 'PRO', norm: 'ISO 45001' },
{ to: '/chemical-safety', icon: <Flask weight="duotone" size={26} />, label: 'Seguridad Química', sub: 'Estudio Oficial Contaminantes Res. 295/03 Anexo IV & SGA Res. 801/15', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'specific', featured: true, badge: 'Res. 295/03 & 801/15', norm: 'Res. 295/03' },
{ to: '/drills', icon: <Siren weight="duotone" size={26} />, label: 'Simulacros', sub: 'Actas, Planillas y Estadísticas de Simulacros', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/stop-cards', icon: <Warning weight="duotone" size={26} />, label: 'Tarjetas STOP', sub: 'Observaciones Preventivas en Campo', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', norm: 'ISO 45001' },
{ to: '/working-at-height', icon: <HardHat weight="duotone" size={26} />, label: 'Trabajo en Altura', sub: 'Permiso Oficial PTSA Res. SRT 61/23, Cálculo DLC y Anclaje 22 kN', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'critical', featured: true, badge: 'Res. SRT 61/23', norm: 'Res. SRT 61/23' },
{ to: '/lifting-form', icon: <Crane weight="duotone" size={26} />, label: 'Izaje y Grúas', sub: 'Plan de Izaje, Riggers y Pre-check de Grúas', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'critical', norm: 'ASME B30' },
{ to: '/fleet-form', icon: <Truck weight="duotone" size={26} />, label: 'Flota y Vehículos', sub: 'Check Pre-operacional — ISO 39001', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', premium: true, category: 'management', norm: 'ISO 39001' },
{ to: '/evacuation-history', icon: <Timer weight="duotone" size={26} />, label: 'Simulador de Evacuación', sub: 'Simulación de Tiempos de Evacuación', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', premium: true, category: 'specific', norm: 'NFPA 101' },
{ to: '/legajos', icon: <FileText weight="duotone" size={26} />, label: 'Legajos Técnicos', sub: 'Legajos Profesionales — Dec. 351/79', color: '#eab308', bg: 'rgba(234,179,8,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'Dec. 351' },
{ to: '/medical', icon: <Activity weight="duotone" size={26} />, label: 'Aptitudes Médicas', sub: 'Preocupacionales, Periódicos y Egreso', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'Res. 37/10' },
{ to: '/incident-heatmap', icon: <MapTrifold weight="duotone" size={26} />, label: 'Mapa Calor', sub: 'Mapa de Calor de Incidentes y Accidentes', color: '#f97316', bg: 'rgba(249,115,22,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'ISO 31000' },
{ to: '/emergency-plan', icon: <Siren weight="duotone" size={26} />, label: 'Plan de Emergencias', sub: 'Brigadas, Roles y Plan de Respuesta', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'Ley 19587' },
{ to: '/contractor-matrix', icon: <Users weight="duotone" size={26} />, label: 'Matriz Contratistas', sub: 'Homologación y Garita de Contratistas', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', premium: true, category: 'management', featured: true, badge: 'Nuevo', norm: 'Ley 19587' },
{ to: '/grounding', icon: <Lightning weight="duotone" size={26} />, label: 'Puesta a Tierra', sub: 'Protocolo Oficial de PAT y Masas — Res. SRT 900/15', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'critical', featured: true, badge: 'Res. 900', norm: 'Res. 900/15' },
{ to: '/rgrl', icon: <ClipboardText weight="duotone" size={26} />, label: 'RGRL Anual', sub: 'Relevamiento General de Riesgos Laborales — Res. SRT 463/09, 529/09 y 74/10', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', premium: true, category: 'management', featured: true, badge: 'Res. SRT 463', norm: 'Res. SRT 463/09' },
{ to: '/rar', icon: <Activity weight="duotone" size={26} />, label: 'Nómina RAR', sub: 'Agentes de Riesgo SRT y Cancerígenos — Res. SRT 37/10 y 81/19', color: '#10b981', bg: 'rgba(16,185,129,0.1)', premium: true, category: 'management', featured: true, badge: 'Res. SRT 37', norm: 'Res. SRT 37/10' },

// 8 Nuevos Módulos Suite Integral
{ to: '/hot-work', icon: <Fire weight="duotone" size={26} />, label: 'Trabajo en Caliente', sub: 'Permiso Oficial NFPA 51B, Radio 11m, LEL y Vigía de Fuego', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'critical', featured: true, badge: 'NFPA 51B', norm: 'NFPA 51B' },
{ to: '/construction-safety-program', icon: <HardHat weight="duotone" size={26} />, label: 'Programa de Seguridad Obra', sub: 'Confección Reglamentaria ART — Dec. 911/96 y Res. SRT 51/97, 35/98', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'specific', featured: true, badge: 'Dec. 911/96', norm: 'Dec. 911/96' },
{ to: '/hazardous-waste', icon: <Flask weight="duotone" size={26} />, label: 'Residuos Peligrosos', sub: 'Libro Oficial, Corrientes Y/R, Acopio y Manifiestos — Ley 24.051', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', premium: true, category: 'specific', featured: true, badge: 'Ley 24.051', norm: 'Ley 24.051' },
{ to: '/excavations', icon: <Warning weight="duotone" size={26} />, label: 'Excavaciones y Zanjas', sub: 'Estabilidad de Taludes (A, B, C), Entibados >1.2m — Dec. 911/96 & OSHA 1926', color: '#d97706', bg: 'rgba(217,119,6,0.1)', premium: true, category: 'critical', featured: true, badge: 'Dec. 911/96', norm: 'Dec. 911/96' },
{ to: '/atex', icon: <Lightning weight="duotone" size={26} />, label: 'Atmósferas Explosivas (ATEX)', sub: 'Zonificación 0, 1, 2 / 20, 21, 22 e Inventario Equipos Ex — IEC 60079', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'specific', featured: true, badge: 'IEC 60079', norm: 'IEC 60079' },
{ to: '/first-aid-aed', icon: <Activity weight="duotone" size={26} />, label: 'Primeros Auxilios y DEA', sub: 'Cardioprotección Ley 27.159, Botiquines y Atenciones Menores', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', premium: true, category: 'management', featured: true, badge: 'Ley 27.159', norm: 'Ley 27.159' },
{ to: '/arc-flash', icon: <Lightning weight="duotone" size={26} />, label: 'Arco Eléctrico (Arc Flash)', sub: 'Cálculo de Energía Incidente (cal/cm²), EPP y Tensión — NFPA 70E & Res. SRT 3068/14', color: '#eab308', bg: 'rgba(234,179,8,0.1)', premium: true, category: 'critical', featured: true, badge: 'NFPA 70E', norm: 'NFPA 70E' },
{ to: '/industrial-environment', icon: <Droplets weight="duotone" size={26} />, label: 'Efluentes y Emisiones', sub: 'Monitoreo Ambiental en Chimeneas y Vertidos — Ley 25.675 & Dec. 351/79', color: '#0d9488', bg: 'rgba(13,148,136,0.1)', premium: true, category: 'specific', featured: true, badge: 'Ley 25.675', norm: 'Ley 25.675' },
{ to: '/forklifts', icon: <Truck weight="duotone" size={26} />, label: 'Autoelevadores (SRT 960)', sub: 'Carnet Anexo I, Check Pre-op y Mantenimiento — Res. SRT 960/15', color: '#d97706', bg: 'rgba(217,119,6,0.1)', premium: true, category: 'critical', featured: true, badge: 'Res. 960/15', norm: 'Res. SRT 960/15' },
{ to: '/legal-matrix', icon: <Gavel weight="duotone" size={26} />, label: 'Matriz Legal (ISO 45001)', sub: 'Evaluación de Conformidad Legal — ISO 45001 Cl. 9.1.2 & Ley 19.587', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', premium: true, category: 'management', featured: true, badge: 'ISO 45001', norm: 'ISO 45001' },
{ to: '/ventilation', icon: <Wind weight="duotone" size={26} />, label: 'Ventilación (Dec. 351)', sub: 'Cálculo de Caudales y Renovaciones — Dec. 351/79 Cap. 11 y Anexo III', color: '#0d9488', bg: 'rgba(13,148,136,0.1)', premium: true, category: 'specific', featured: true, badge: 'Dec. 351/79', norm: 'Dec. 351/79' },
{ to: '/pts', icon: <FileText weight="duotone" size={26} />, label: 'Procedimientos (PTS)', sub: 'Biblioteca y Generador de POETS/SOP — ISO 45001 y Ley 19.587', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', premium: true, category: 'docs', featured: true, badge: 'ISO 45001', norm: 'ISO 45001' },
{ to: '/racks', icon: <Package weight="duotone" size={26} />, label: 'Racks (IRAM 38500)', sub: 'Inspección de Estanterías y Deformaciones — IRAM 38500 y EN 15635', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', premium: true, category: 'critical', featured: true, badge: 'IRAM 38500', norm: 'IRAM 38500' },
{ to: '/dossier', icon: <Archive weight="duotone" size={26} />, label: 'Dossier ZIP', sub: 'Exportador de Legajo Único en ZIP para ART y Auditorías', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', premium: true, category: 'docs', featured: true, badge: 'ZIP', norm: 'ART / SRT' }].
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
      <div className="text-[1.8rem] font-[900] text-[var(--color-hero-text)] leading-[]">
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
  const { t, language, selectedFramework, countryNorms, adaptText } = useLanguage();

  const heroWords = ['ATS', 'Carga de Fuego', 'Auditorías', 'Matrices de Riesgo', 'Capacitaciones'];
  const typedWord = useTypewriter(heroWords);

  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [daysLeft, setDaysLeft] = useState<number | typeof Infinity | null>(null);
  const [isInspectorMode, setIsInspectorMode] = useState<boolean>(() => {
    return localStorage.getItem('inspector_mode') === 'true';
  });

  const handleToggleInspectorMode = () => {
    setIsInspectorMode(prev => {
      const next = !prev;
      localStorage.setItem('inspector_mode', String(next));
      return next;
    });
  };

  const localizedQuickLinks = useMemo(() => {
    return quickLinks.map((link) => ({
      ...link,
      label: adaptText(link.label),
      sub: adaptText(link.sub),
      badge: link.badge ? adaptText(link.badge) : undefined,
      norm: link.norm === 'Legal' ? countryNorms.general : (link.norm ? adaptText(link.norm) : undefined)
    }));
  }, [language, selectedFramework, countryNorms, adaptText]);

  const filteredQuickLinks = useMemo(() => {
    if (!isInspectorMode) return localizedQuickLinks;
    const allowed = ['/ats', '/checklists', '/work-permit', '/ai-camera-manager', '/ai-general-camera-manager'];
    return localizedQuickLinks.filter(link => allowed.includes(link.to));
  }, [isInspectorMode, localizedQuickLinks]);

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
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('user_favorite_modules');
      return saved ? JSON.parse(saved) : ['/ats', '/work-permit', '/checklists', '/extintores'];
    } catch {
      return ['/ats', '/work-permit', '/checklists', '/extintores'];
    }
  });

  const toggleFavorite = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const updated = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path];
      try {
        localStorage.setItem('user_favorite_modules', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving favorites:', err);
      }
      return updated;
    });
  };

  const categories = useMemo(() => {
    const cats = new Set(filteredQuickLinks.map(l => l.category));
    return Array.from(cats);
  }, [filteredQuickLinks]);

  const handleRecentWorkClick = (type: string) => {
    const typeRoutes: Record<string, string> = {
      'ATS': '/ats',
      'Carga Fuego': '/fire-load',
      'Inspección': '/history',
      'Matriz': '/risk-matrix-history',
      'Informe': '/reports',
      'Checklist': '/checklists',
      'Iluminación': '/lighting',
      'Permiso': '/work-permit',
      'Eval. Riesgo': '/risk-assessment-history',
      'Accidente': '/accident-investigation'
    };
    const route = typeRoutes[type] || '/';
    navigate(route);
  };

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

      const parsed = safeGetLocalStorage<Record<string, any>>('personalData', {});
      if (parsed.name || parsed.profession) {
        let name = parsed.name || 'Profesional';
        if (parsed.profession) {
          const prof = parsed.profession.toLowerCase();
          if (prof.includes('lic')) name = `Lic. ${name}`; else
          if (prof.includes('téc')) name = `Téc. ${name}`; else
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
          const raw = localStorage.getItem(stat.key);
          const list = safeJsonParse<any[]>(raw, []);
          const count = Array.isArray(list) ? list.length : 0;
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

    const CURATED_HOME_INSIGHTS: DailyInsight[] = [
      {
        category: "Trabajo en Altura • Res. SRT 61/23",
        title: "Verificación de Distancia Libre de Caída (DLC)",
        content: "Antes de autorizar tareas sobre 2 metros, validá que el punto de anclaje soporte 22 kN y que el amortiguador de impacto tenga margen suficiente sobre el nivel inferior."
      },
      {
        category: "Riesgo Eléctrico • Res. SRT 900/15",
        title: "Continuidad de Masas y Disyuntores Diferenciales",
        content: "En tableros de obra y planta, exigí prueba mensual del botón de test en diferenciales (≤ 30 mA) y protocolo vigente de puesta a tierra menor a 10 Ω."
      },
      {
        category: "Gestión de EPP • Res. SRT 299/11",
        title: "Trazabilidad de Certificación Sello S / IRAM",
        content: "Toda entrega de protección personal debe registrar lote, marca y certificación oficial en la planilla individual firmada por el trabajador para validez ante ART."
      },
      {
        category: "Protección Contra Incendios • Dec. 351/79",
        title: "Control de Carga de Fuego y Extintores",
        content: "Verificá que los matafuegos tengan control trimestral vigente, manómetro en zona operativa, precinto intacto y pasillo de acceso libre de obstrucciones."
      },
      {
        category: "Espacios Confinados • Res. SRT 953/10",
        title: "Monitoreo Atmosférico Previo al Ingreso",
        content: "Nunca autorices el ingreso sin medir primero Oxígeno (19.5% a 23.5%), LEL (< 10%) y gases tóxicos (CO / H2S), manteniendo vigía permanente en el exterior."
      },
      {
        category: "Bloqueo LOTO • Dec. 351/79 & OSHA 1910",
        title: "Las 5 Reglas de Oro en Mantenimiento",
        content: "Corte efectivo de fuente, bloqueo mecánico con candado personal, verificación de energía residual cero, puesta a tierra y señalización antes de intervenir equipos."
      }
    ];

    const loadDailyInsight = async (): Promise<void> => {
      const defaultInsight = CURATED_HOME_INSIGHTS[new Date().getDate() % CURATED_HOME_INSIGHTS.length];

      try {
        const today = new Date().toDateString();
        const cached = localStorage.getItem('daily_insight_cache');
        const parsedCache = safeJsonParse<{ date?: string; data?: any } | null>(cached, null);
        if (
          parsedCache &&
          parsedCache.date === today &&
          parsedCache.data &&
          parsedCache.data.title !== 'IA y Seguridad Laboral'
        ) {
          setDailyInsight(parsedCache.data);
          return;
        }

        const token = await auth.currentUser?.getIdToken(true);
        const response = await fetch(`${API_BASE_URL}/api/daily-insight`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const insightObj = data.insight || (data.title && data.content ? data : null);
          if (insightObj && insightObj.title !== 'IA y Seguridad Laboral') {
            setDailyInsight(insightObj);
            localStorage.setItem('daily_insight_cache', JSON.stringify({ date: today, data: insightObj }));
            return;
          }
        }

        setDailyInsight(defaultInsight);
        localStorage.setItem('daily_insight_cache', JSON.stringify({ date: today, data: defaultInsight }));
      } catch (err) {
        console.error("Error fetching daily insight:", err);
        setDailyInsight(defaultInsight);
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
        '/extintores': 'extinguishers_inventory',
        '/capa': 'ehs_capa_db',
        '/audit': 'ehs_audits_db',
        '/confined-space': 'confined_space_permits_db',
        '/thermal-stress': 'thermal_history',
        '/noise-assessment': 'noise_assessments_db',
        '/chemical-safety': 'chemical_safety_db',
        '/drills': 'drills_history',
        '/stop-cards': 'stop_cards_history',
        '/working-at-height': 'working_height_permits_db',
        '/lifting-form': 'lifting_plans_db',
        '/fleet-form': 'fleet_inspections_db',
        '/training-management': 'training_history',
        '/toolbox-talk': 'ehs_toolbox_talks',
        '/evacuation-history': 'evacuation_simulator_db',
        '/medical': 'ehs_medical_db'
      };
      const counts: Record<string, number> = {};
      for (const [route, key] of Object.entries(routeToKey)) {
        try {
          const raw = localStorage.getItem(key);
          const list = safeJsonParse<any[]>(raw, []);
          counts[route] = Array.isArray(list) ? list.length : 0;
        } catch {
          counts[route] = 0;
        }
      }
      counts['/legajos'] = 0;
      setModuleCounts(counts);

      if (currentUser) {
        getDocs(collection(db, 'users', currentUser.uid, 'legajos'))
          .then((snapshot) => {
            setModuleCounts((prev) => ({
              ...prev,
              '/legajos': snapshot.size
            }));
          })
          .catch((err) => console.error("Error counting legajos:", err));
      }
    };

    loadStats();
    loadRecent();
    loadDailyInsight();
    loadModuleCounts();

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

  if (!currentUser) {
    return (
      <AnimatedPage>
        <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Cargando...</div>}>
          <MarketingLanding
            onStart={() => navigate('/login', { state: { view: 'register' } })}
            onLogin={() => navigate('/login')}
          />
        </Suspense>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
    <div className="page-transition pb-[4rem]">

        <div className="p-[clamp(8rem,_10vw,_9rem)_1.2rem_2rem] bg-[var(--color-hero-bg)] border-b border-[] relative overflow-[hidden]">
          <StarryBackground />
          <div className="relative z-[1] max-w-[1200px] m-[0_auto]">
            <style>{`
              @keyframes pulse-glow {
                0%, 100% { filter: drop-shadow(0 0 2px var(--score-glow-color, rgba(16,185,129,0.2))); }
                50% { filter: drop-shadow(0 0 10px var(--score-glow-color, rgba(16,185,129,0.45))); }
              }
              .gauge-fill-glow {
                animation: pulse-glow 2.5s infinite ease-in-out;
              }
            `}</style>
            <div className="stagger-item animation-delay-[0.1s]">
              <div className="flex items-center justify-between gap-[0.6rem] flex-wrap mb-[1.2rem]">
                <div className="flex items-center gap-[0.6rem] flex-wrap">
                  <div style={{ backdropFilter: isMobile ? 'none' : 'blur(8px)' }} className="inline-flex items-center gap-[0.5rem] p-[0.4rem_0.8rem] bg-[rgba(59,130,246,0.18)] border border-[rgba(59,130,246,0.35)] rounded-full">
                    <Shield size={14} color="#60a5fa" weight="bold" />
                    <span className="text-[0.73rem] font-extrabold text-[#93c5fd] uppercase tracking-wider">{t('home.private_dashboard')}</span>
                  </div>
                  <div
                    onClick={() => navigate('/legislation')}
                    style={{ backdropFilter: isMobile ? 'none' : 'blur(8px)' }}
                    className="inline-flex items-center gap-[0.5rem] p-[0.4rem_0.85rem] bg-[rgba(16,185,129,0.18)] border border-[rgba(16,185,129,0.38)] rounded-full cursor-pointer hover:bg-[rgba(16,185,129,0.28)] transition-colors"
                    title="Ver biblioteca legal del país activo"
                  >
                    <Gavel size={14} color="#34d399" weight="bold" />
                    <span className="text-[0.73rem] font-extrabold text-[#6ee7b7] uppercase tracking-wider">
                      {countryNorms.flag} {countryNorms.name} · {countryNorms.general} / {countryNorms.decree}
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs font-bold text-slate-200">
                  <CalendarBlank size={14} weight="duotone" color="#60a5fa" />
                  <span className="capitalize">
                    {new Date().toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              
              <div
                style={{ backdropFilter: isMobile ? 'none' : 'blur(14px)' }}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-[rgba(15,23,42,0.55)] border border-[rgba(255,255,255,0.14)] p-5 sm:p-6 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] relative overflow-hidden"
              >
                <div className="absolute top-[-50%] left-[-10%] w-[240px] h-[240px] bg-[radial-gradient(circle,_rgba(59,130,246,0.22)_0%,_transparent_70%)] pointer-events-none" />
                <div className="absolute bottom-[-40%] right-[-5%] w-[220px] h-[220px] bg-[radial-gradient(circle,_rgba(16,185,129,0.16)_0%,_transparent_70%)] pointer-events-none" />

                <div className="flex items-center gap-4 sm:gap-5 relative z-[1] min-w-0">
                  <div className="w-[86px] sm:w-[110px] h-[56px] sm:h-[64px] bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center justify-center shrink-0">
                    <img src="/logo.png?v=3" alt="Logo" className="w-full h-full object-contain filter-[drop-shadow(0_4px_10px_rgba(0,0,0,0.45))]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                        ● Panel Operativo Activo
                      </span>
                      {personalDataObj?.license && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-black uppercase tracking-wider">
                          Mat. {personalDataObj.license}
                        </span>
                      )}
                    </div>
                    <h1
                      style={{ color: '#ffffff', marginBottom: 0 }}
                      className="text-[clamp(1.45rem,_3.5vw,_2.2rem)] font-black !text-white m-0 leading-tight tracking-tight flex items-center gap-2 flex-wrap"
                    >
                      <span>{t('home.hello')}, {userName}</span>
                      {isSubscribed && (
                        <Crown
                          size={24}
                          color="#fbbf24"
                          weight="fill"
                          className="inline align-middle filter-[drop-shadow(0_2px_8px_rgba(245,158,11,0.5))]"
                        />
                      )}
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm m-[0.35rem_0_0] font-medium">
                      {t('home.subtitle')}
                    </p>
                  </div>
                </div>

                {/* Botonera de Creación Rápida 1-Clic en el Banner */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 relative z-[1] shrink-0">
                  {[
                    { label: '+ Nuevo ATS', to: '/ats', icon: <ShieldCheck size={16} weight="duotone" />, bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.45)', text: '#6ee7b7' },
                    { label: '+ Checklist', to: '/checklists', icon: <ClipboardText size={16} weight="duotone" />, bg: 'rgba(20,184,166,0.2)', border: 'rgba(20,184,166,0.45)', text: '#5eead4' },
                    { label: '+ Permiso', to: '/work-permit', icon: <Key size={16} weight="duotone" />, bg: 'rgba(59,130,246,0.22)', border: 'rgba(59,130,246,0.45)', text: '#93c5fd' },
                    { label: '✨ Asesor IA', to: '/ai-advisor', icon: <Robot size={16} weight="duotone" />, bg: 'rgba(168,85,247,0.24)', border: 'rgba(168,85,247,0.5)', text: '#d8b4fe' },
                  ].map((btn) => (
                    <button
                      key={btn.to}
                      type="button"
                      onClick={() => navigate(btn.to)}
                      style={{ background: btn.bg, borderColor: btn.border, color: btn.text }}
                      className="px-3.5 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-125 transition-all shadow-sm"
                    >
                      {btn.icon}
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bento-container stagger-item animation-delay-[0.2s]">
              {/* TARJETA 1: RESUMEN DIARIO IA + RADAR OPERATIVO */}
              <div className="bento-item bento-main">
                <div style={{ filter: isMobile ? 'none' : 'blur(20px)' }} className="absolute top-[-30%] right-[-10%] w-[220px] h-[220px] bg-[radial-gradient(circle,_rgba(168,85,247,0.22)_0%,_transparent_70%)] pointer-events-none" />

                <div className="flex justify-between items-start gap-3 mb-3.5 relative z-[1]">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.4)] rounded-full px-3 py-1 mb-2">
                      <Sparkle size={12} color="#d8b4fe" weight="fill" />
                      <span className="text-[0.65rem] font-black text-[#d8b4fe] uppercase tracking-wider">{t('home.ai_today')}</span>
                    </div>
                    <h2 style={{ color: '#ffffff' }} className="text-[clamp(1.25rem,_2.2vw,_1.55rem)] font-black !text-white m-0 leading-tight">
                      {t('home.daily_summary')}
                    </h2>
                    <p className="text-slate-300 text-xs m-[0.25rem_0_0] font-medium">
                      {t('home.daily_subtitle')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const tips: DailyInsight[] = [
                        {
                          category: "Trabajo en Altura • Res. SRT 61/23",
                          title: "Verificación de Distancia Libre de Caída (DLC)",
                          content: "Antes de autorizar tareas sobre 2 metros, validá que el punto de anclaje soporte 22 kN y que el amortiguador de impacto tenga margen suficiente sobre el nivel inferior."
                        },
                        {
                          category: "Riesgo Eléctrico • Res. SRT 900/15",
                          title: "Continuidad de Masas y Disyuntores Diferenciales",
                          content: "En tableros de obra y planta, exigí prueba mensual del botón de test en diferenciales (≤ 30 mA) y protocolo vigente de puesta a tierra menor a 10 Ω."
                        },
                        {
                          category: "Gestión de EPP • Res. SRT 299/11",
                          title: "Trazabilidad de Certificación Sello S / IRAM",
                          content: "Toda entrega de protección personal debe registrar lote, marca y certificación oficial en la planilla individual firmada por el trabajador para validez ante ART."
                        },
                        {
                          category: "Protección Contra Incendios • Dec. 351/79",
                          title: "Control de Carga de Fuego y Extintores",
                          content: "Verificá que los matafuegos tengan control trimestral vigente, manómetro en zona operativa, precinto intacto y pasillo de acceso libre de obstrucciones."
                        },
                        {
                          category: "Espacios Confinados • Res. SRT 953/10",
                          title: "Monitoreo Atmosférico Previo al Ingreso",
                          content: "Nunca autorices el ingreso sin medir primero Oxígeno (19.5% a 23.5%), LEL (< 10%) y gases tóxicos (CO / H2S), manteniendo vigía permanente en el exterior."
                        },
                        {
                          category: "Bloqueo LOTO • Dec. 351/79 & OSHA 1910",
                          title: "Las 5 Reglas de Oro en Mantenimiento",
                          content: "Corte efectivo de fuente, bloqueo mecánico con candado personal, verificación de energía residual cero, puesta a tierra y señalización antes de intervenir equipos."
                        }
                      ];
                      const currentIdx = tips.findIndex((item) => item.title === dailyInsight?.title);
                      const nextTip = tips[(currentIdx + 1) % tips.length];
                      setDailyInsight(nextTip);
                      localStorage.setItem('daily_insight_cache', JSON.stringify({ date: new Date().toDateString(), data: nextTip }));
                    }}
                    title="Ver otro consejo técnico normativo"
                    className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/35 text-purple-200 text-[11px] font-black flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                  >
                    <Sparkle size={14} weight="fill" color="#d8b4fe" />
                    <span>Otro Consejo</span>
                  </button>
                </div>

                {/* Bloque de Consejo Técnico IA */}
                <div className="relative z-[1] mb-3.5">
                  {currentUser && dailyInsight ? (
                    <div className="bg-[rgba(15,23,42,0.65)] p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[0.68rem] text-[#d8b4fe] font-black uppercase tracking-wider bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-400/25">
                          {dailyInsight.category}
                        </span>
                        <Robot size={18} weight="duotone" color="#c084fc" />
                      </div>
                      <h4 style={{ color: '#ffffff' }} className="m-0 text-sm sm:text-[0.95rem] font-extrabold !text-white leading-snug">
                        {dailyInsight.title}
                      </h4>
                      <p className="m-0 text-xs sm:text-[0.82rem] text-slate-300 leading-relaxed">
                        {dailyInsight.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => navigate('/ai-advisor')}
                          className="flex-1 min-w-[130px] px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/45 border border-purple-400/35 text-purple-100 text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Robot size={14} weight="duotone" />
                          <span>Consultar Asesor IA</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/toolbox-talk')}
                          className="flex-1 min-w-[130px] px-3 py-1.5 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 border border-blue-400/35 text-blue-100 text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <ChatText size={14} weight="duotone" />
                          <span>Armar Charla 5 Min</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[rgba(0,0,0,0.2)] rounded-2xl border border-white/10 p-5 flex items-center justify-center min-h-[110px]">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Sparkle size={24} weight="duotone" />
                        <span className="text-xs font-semibold">Cargando análisis diario...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Radar Operativo 2x2 (aprovecha el espacio inferior del Resumen Diario) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-auto relative z-[1]">
                  {[
                    {
                      label: 'Docs Totales',
                      value: stats.reduce((a, s) => a + s.value, 0),
                      color: '#c084fc',
                      sub: 'En historial'
                    },
                    {
                      label: 'Esta Semana',
                      value: recentWorks.filter((w) => new Date(w.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
                      color: '#60a5fa',
                      sub: 'Últimos 7 días'
                    },
                    {
                      label: 'Módulos Activos',
                      value: Object.values(moduleCounts).filter((c) => c > 0).length || stats.filter((s) => s.value > 0).length,
                      color: '#34d399',
                      sub: 'Con registros'
                    },
                    {
                      label: 'Inspecciones',
                      value: (stats.find((s) => s.label === 'Checklists')?.value || 0) + (stats.find((s) => s.label === 'Inspecciones')?.value || 0),
                      color: '#fbbf24',
                      sub: 'Campo y Check'
                    }
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="bg-[rgba(15,23,42,0.55)] border border-white/10 rounded-xl p-2.5 flex flex-col justify-between"
                    >
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 truncate">
                        {metric.label}
                      </span>
                      <div className="flex items-baseline justify-between gap-1 mt-1">
                        <span style={{ color: metric.color }} className="text-lg font-black leading-none">
                          {metric.value}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 truncate">
                          {metric.sub}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TARJETA 2: SCORE H&S + DESGLOSE DE CUMPLIMIENTO */}
              <div className="bento-item bento-score">
                <div style={{ filter: isMobile ? 'none' : 'blur(25px)' }} className="absolute bottom-[-20%] left-[50%] transform-[translateX(-50%)] w-[180px] h-[180px] bg-[radial-gradient(circle,_rgba(16,185,129,0.22)_0%,_transparent_70%)] pointer-events-none" />

                <div className="flex justify-between items-center mb-2.5 relative z-[1]">
                  <h3 style={{ color: '#ffffff' }} className="m-0 text-[0.95rem] font-extrabold !text-white flex items-center gap-1.5">
                    <Shield size={17} color="#34d399" weight="duotone" />
                    <span>Score H&amp;S</span>
                  </h3>
                  <span className="text-[0.65rem] text-emerald-300 bg-emerald-500/15 border border-emerald-400/25 px-2 py-0.5 rounded-full font-extrabold">
                    Este mes
                  </span>
                </div>

                {(() => {
                  const totalDocs = stats.reduce((a, s) => a + s.value, 0);
                  const accidents = stats.find((s) => s.label === 'Accidentes')?.value ?? 0;
                  const permisos = stats.find((s) => s.label === 'Permisos')?.value ?? 0;
                  const atsCount = stats.find((s) => s.label === 'ATS')?.value ?? 0;
                  const checkCount = stats.find((s) => s.label === 'Checklists')?.value ?? 0;
                  const raw = Math.min(100, Math.max(0,
                    60 + Math.min(totalDocs * 3, 30) - accidents * 8 + Math.min(permisos * 2, 10)
                  ));
                  const score = totalDocs === 0 ? 0 : raw;
                  const gaugeOffset = 283 - 283 * score / 100;
                  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                  const scoreLabel = score >= 80 ? 'Excelente' : score >= 50 ? 'En Progreso' : score === 0 ? 'Sin datos' : 'Atención';

                  const prevPct = Math.min(100, (atsCount + permisos) * 25);
                  const checkPct = Math.min(100, checkCount * 35);
                  const zeroAccPct = accidents === 0 ? 100 : Math.max(25, 100 - accidents * 25);

                  return (
                    <div className="flex-1 flex flex-col justify-between gap-3 relative z-[1]">
                      <div className="flex items-center gap-3.5">
                        <div style={{ '--score-glow-color': scoreColor } as React.CSSProperties} className="relative inline-flex items-center justify-center gauge-fill-glow shrink-0">
                          <svg width="78" height="78" viewBox="0 0 120 120">
                            <circle className="gauge-track" cx="60" cy="60" r="45" strokeWidth="9" />
                            <circle
                              className="gauge-fill"
                              cx="60" cy="60" r="45"
                              strokeWidth="9"
                              stroke={scoreColor}
                              style={{ '--gauge-offset': gaugeOffset } as React.CSSProperties}
                              transform="rotate(-90 60 60)"
                            />
                          </svg>
                          <div className="absolute text-center flex flex-col items-center justify-center">
                            <div style={{ color: scoreColor }} className="text-[1.35rem] font-black leading-none">{score}</div>
                            <div className="text-[0.55rem] text-slate-300 font-bold uppercase">/ 100</div>
                          </div>
                        </div>

                        <div className="text-left flex flex-col justify-center min-w-0">
                          <div style={{ color: scoreColor }} className="text-base font-black leading-tight">{scoreLabel}</div>
                          <div className="text-xs text-slate-300 mt-0.5 font-semibold">
                            {totalDocs} doc{totalDocs !== 1 ? 's' : ''} registrados
                          </div>
                          {accidents > 0 ? (
                            <button
                              type="button"
                              onClick={() => navigate('/accident-investigation')}
                              className="inline-flex items-center gap-1 bg-rose-500/20 border border-rose-400/35 rounded-full px-2.5 py-0.5 mt-1.5 w-fit cursor-pointer hover:bg-rose-500/30 transition-colors"
                            >
                              <Warning size={11} color="#fda4af" weight="fill" />
                              <span className="text-[0.65rem] text-rose-200 font-extrabold">
                                {accidents} accidente{accidents !== 1 ? 's' : ''}
                              </span>
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/35 rounded-full px-2.5 py-0.5 mt-1.5 w-fit">
                              <CheckCircle size={11} color="#6ee7b7" weight="fill" />
                              <span className="text-[0.65rem] text-emerald-200 font-extrabold">0 Accidentes</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mini barras de desglose del Score */}
                      <div className="bg-[rgba(15,23,42,0.55)] border border-white/10 rounded-xl p-2.5 flex flex-col gap-1.5">
                        {[
                          { label: 'Prevención (ATS / Permisos)', pct: prevPct, color: '#10b981' },
                          { label: 'Control Campo (Checklists)', pct: checkPct, color: '#38bdf8' },
                          { label: 'Índice Siniestralidad', pct: zeroAccPct, color: accidents === 0 ? '#10b981' : '#f59e0b' }
                        ].map((bar) => (
                          <div key={bar.label} className="flex flex-col gap-0.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-300">
                              <span className="truncate">{bar.label}</span>
                              <span style={{ color: bar.color }} className="font-black">{bar.pct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                              <div
                                style={{ width: `${bar.pct}%`, background: bar.color }}
                                className="h-full rounded-full transition-all duration-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* TARJETA 3: KPIs RÁPIDOS INTERACTIVOS (GRILLA DE 6 INDICADORES CLAVE) */}
              <div className="bento-item bento-kpi">
                <div className="flex items-center justify-between mb-2.5 relative z-[1]">
                  <h3 style={{ color: '#ffffff' }} className="m-0 text-[0.95rem] font-extrabold !text-white flex items-center gap-1.5">
                    <ChartPieSlice size={17} color="#fbbf24" weight="duotone" />
                    <span>KPIs Rápidos</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/safety-kpis')}
                    className="text-[10px] font-extrabold text-amber-300 hover:text-amber-200 bg-amber-500/15 border border-amber-400/25 px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
                  >
                    Ver Estadísticas →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 relative z-[1]">
                  {[
                    { label: 'ATS', count: stats.find((s) => s.label === 'ATS')?.value ?? 0, to: '/ats', color: '#10b981', icon: <ShieldCheck size={16} weight="duotone" /> },
                    { label: 'Checklists', count: stats.find((s) => s.label === 'Checklists')?.value ?? 0, to: '/checklists', color: '#14b8a6', icon: <ClipboardText size={16} weight="duotone" /> },
                    { label: 'Permisos', count: stats.find((s) => s.label === 'Permisos')?.value ?? 0, to: '/work-permit', color: '#60a5fa', icon: <Key size={16} weight="duotone" /> },
                    { label: 'Informes', count: stats.find((s) => s.label === 'Informes')?.value ?? 0, to: '/reports', color: '#f472b6', icon: <FileText size={16} weight="duotone" /> },
                    { label: 'Carga Fuego', count: stats.find((s) => s.label === 'Carga Fuego')?.value ?? 0, to: '/fire-load', color: '#fb923c', icon: <Fire size={16} weight="duotone" /> },
                    { label: 'Matafuegos', count: moduleCounts['/extintores'] ?? 0, to: '/extintores', color: '#f87171', icon: <Fire size={16} weight="duotone" /> }
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      onClick={() => navigate(kpi.to)}
                      className="bg-[rgba(15,23,42,0.58)] hover:bg-[rgba(30,41,59,0.8)] border border-white/10 hover:border-white/25 rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div
                          style={{ background: `${kpi.color}22`, color: kpi.color }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        >
                          {kpi.icon}
                        </div>
                        <span
                          style={{ color: kpi.color }}
                          className="text-xl font-black leading-none tracking-tight"
                        >
                          {kpi.count}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-2">
                        <span className="text-[11px] font-bold text-slate-200 truncate">{kpi.label}</span>
                        <CaretRight size={11} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TARJETA 4: ACTIVIDAD RECIENTE MEJORADA */}
              <div className="bento-item bento-timeline">
                <div className="flex items-center justify-between gap-2 mb-3 relative z-[1]">
                  <div className="flex items-center gap-2">
                    <h3 style={{ color: '#ffffff' }} className="m-0 text-[0.95rem] font-extrabold !text-white flex items-center gap-1.5">
                      <Activity size={17} color="#60a5fa" weight="duotone" />
                      <span>Actividad Reciente</span>
                    </h3>
                    {recentWorks.length > 0 && (
                      <span className="text-[0.65rem] text-blue-200 bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 rounded-full font-extrabold">
                        {recentWorks.length} entradas
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/history')}
                    className="text-[11px] font-extrabold text-blue-300 hover:text-white bg-blue-500/15 hover:bg-blue-500/30 border border-blue-400/30 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                  >
                    Ver Historial →
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-2 relative z-[1]">
                  {recentWorks.length > 0 ? (
                    recentWorks.slice(0, 4).map((work, i) => {
                      const tc = typeColors[work.type] || typeColors['ATS'];
                      return (
                        <div
                          key={i}
                          onClick={() => handleRecentWorkClick(work.type)}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[rgba(15,23,42,0.55)] hover:bg-[rgba(30,41,59,0.85)] border border-white/10 hover:border-blue-400/35 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              style={{ background: tc.bg, color: tc.text }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                            >
                              {tc.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-white text-xs sm:text-[0.82rem] font-extrabold truncate">
                                {work.title || 'Documento sin título'}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span
                                  style={{ color: tc.text, background: `${tc.text}22` }}
                                  className="text-[10px] font-black uppercase rounded px-1.5 py-0.2"
                                >
                                  {work.type}
                                </span>
                                {work.subtitle && (
                                  <span className="text-[11px] text-slate-300 font-medium truncate max-w-[180px]">
                                    • {work.subtitle}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-slate-300 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                              {new Date(work.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </span>
                            <CaretRight size={14} className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 p-4 bg-[rgba(15,23,42,0.4)] rounded-2xl border border-white/10">
                      <ClockCounterClockwise size={28} weight="duotone" />
                      <span className="text-xs font-bold">Sin actividad reciente registrada</span>
                    </div>
                  )}
                </div>
              </div>

              {/* TARJETA 5: MIS FAVORITOS Y ACCESOS RÁPIDOS FIJADOS (12 COLUMNAS COMPLETAS) */}
              <div className="bento-item bento-quick">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-3 relative z-[1]">
                  <div className="flex items-center gap-2">
                    <h3 style={{ color: '#ffffff' }} className="m-0 text-[0.95rem] font-extrabold !text-white flex items-center gap-1.5">
                      <Star size={17} color="#fbbf24" weight="fill" />
                      <span>{t('home.my_favorites')}</span>
                    </h3>
                    <span className="text-[0.65rem] text-amber-200 bg-amber-500/20 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-extrabold">
                      {favorites.length} {t('home.pinned')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      document.getElementById('pro-vault-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[11px] font-extrabold text-indigo-200 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/30 px-3 py-1 rounded-full cursor-pointer transition-colors"
                  >
                    Ver todos los módulos ({localizedQuickLinks.length}) ↓
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 flex-1 relative z-[1]">
                  {(localizedQuickLinks.filter((l) => favorites.includes(l.to)).length > 0
                    ? localizedQuickLinks.filter((l) => favorites.includes(l.to)).slice(0, 8)
                    : localizedQuickLinks.filter((l) => l.featured).slice(0, 8)
                  ).map((link) => {
                    const hexToRgb = (hex: string) => {
                      const m = hex.replace('#', '').match(/.{2}/g);
                      if (!m) return '59 130 246';
                      return `${parseInt(m[0], 16)} ${parseInt(m[1], 16)} ${parseInt(m[2], 16)}`;
                    };
                    const count = moduleCounts[link.to] || 0;
                    return (
                      <div
                        key={link.to}
                        className="bento-quick-card relative group"
                        style={{
                          '--card-accent-rgb': hexToRgb(link.color),
                          padding: '0.75rem 0.55rem',
                          background: 'rgba(15,23,42,0.58)',
                          borderColor: 'rgba(255,255,255,0.12)'
                        } as React.CSSProperties}
                        onClick={() => navigate(link.to)}
                      >
                        {count > 0 && (
                          <span
                            style={{ background: `${link.color}30`, color: link.color, borderColor: `${link.color}50` }}
                            className="absolute top-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.2 rounded-full border"
                          >
                            {count}
                          </span>
                        )}
                        <div
                          style={{ color: link.color, background: `${link.color}18` }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                        >
                          {React.cloneElement(link.icon as React.ReactElement<any>, { size: 20 })}
                        </div>
                        <div className="text-white font-extrabold text-xs leading-tight truncate w-full">
                          {link.label}
                        </div>
                        {link.norm && (
                          <span
                            style={{ color: link.color, background: `${link.color}18` }}
                            className="text-[10px] font-bold rounded px-1.5 py-0.5 truncate max-w-full"
                          >
                            {link.norm}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[2.5rem] max-w-[1200px] m-[2.5rem_auto_0] p-[0_1rem]">
          {/* Centro de Mando Ejecutivo & Semáforo de Vencimientos */}
          <CommandCenterDashboard />

          <div id="pro-vault-section" className="mb-[4rem]">
            <div className="flex flex-col gap-[1.5rem] mb-[2rem]" style={{ minWidth: 0 }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[1rem]">
                <div>
                  <h2 className="text-[clamp(1.5rem,_4vw,_2rem)] font-[900] m-[0] text-[var(--color-text)] flex items-center gap-[0.6rem] tracking-[] flex-wrap">
                    <Star size={28} weight="fill" color="#f59e0b" />
                    <span>{t('home.pro_vault')}</span>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {countryNorms.flag} {countryNorms.name} ({countryNorms.general})
                    </span>
                  </h2>
                  <p className="m-[0.3rem_0_0] text-[var(--color-text-muted)] text-[0.95rem]">
                    {t('home.pro_vault_sub')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-[0.6rem] mb-[1.5rem] relative z-[5] no-print w-full">
                {/* Categorías y Modo Campo */}
                <div className="flex flex-nowrap gap-[0.6rem] overflow-x-auto pb-[0.2rem] hide-scrollbar items-center w-full" style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}>
                  <button
                    onClick={() => setActiveCategory('all')}
                    style={{ scrollSnapAlign: 'start' }}
                    className={`whitespace-nowrap px-[1.1rem] py-[0.55rem] rounded-[100px] font-[800] text-[0.85rem] transition-all flex-shrink-0 cursor-pointer border-[1px] ${activeCategory === 'all' ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[0_4px_15px_rgba(59,130,246,0.35)] -translate-y-0.5' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] hover:border-[rgba(59,130,246,0.3)] shadow-xs'}`}>
                    {t('home.cat_all')}
                  </button>

                  <button
                    onClick={() => setActiveCategory('fav')}
                    style={{ scrollSnapAlign: 'start' }}
                    className={`whitespace-nowrap px-[1.1rem] py-[0.55rem] rounded-[100px] font-[800] text-[0.85rem] transition-all flex-shrink-0 cursor-pointer border-[1px] flex items-center gap-1.5 ${activeCategory === 'fav' ? 'bg-amber-500 text-white border-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.35)] -translate-y-0.5' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-amber-400 shadow-xs'}`}>
                    <Star size={14} weight="fill" className="text-amber-400" />
                    <span>{t('home.cat_fav')} ({favorites.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory('new')}
                    style={{ scrollSnapAlign: 'start' }}
                    className={`whitespace-nowrap px-[1.1rem] py-[0.55rem] rounded-[100px] font-[800] text-[0.85rem] transition-all flex-shrink-0 cursor-pointer border-[1px] flex items-center gap-1.5 ${activeCategory === 'new' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-[0_4px_15px_rgba(59,130,246,0.35)] -translate-y-0.5' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] shadow-xs'}`}>
                    <span>{t('home.cat_new')}</span>
                  </button>

                  {categories.includes('docs') && <button onClick={() => setActiveCategory('docs')} style={{ scrollSnapAlign: 'start' }} className={`whitespace-nowrap px-[1.1rem] py-[0.55rem] rounded-[100px] font-[800] text-[0.85rem] transition-all flex-shrink-0 cursor-pointer border-[1px] ${activeCategory === 'docs' ? 'bg-[#10b981] text-white border-[#10b981] shadow-[0_4px_15px_rgba(16,185,129,0.35)] -translate-y-0.5' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] shadow-xs'}`}>{t('home.cat_docs')}</button>}
                  {categories.includes('critical') && <button onClick={() => setActiveCategory('critical')} style={{ scrollSnapAlign: 'start' }} className={`whitespace-nowrap px-[1.1rem] py-[0.55rem] rounded-[100px] font-[800] text-[0.85rem] transition-all flex-shrink-0 cursor-pointer border-[1px] ${activeCategory === 'critical' ? 'bg-[#ef4444] text-white border-[#ef4444] shadow-[0_4px_15px_rgba(239,68,68,0.35)] -translate-y-0.5' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] shadow-xs'}`}>{t('home.cat_critical')}</button>}
                  {categories.includes('specific') && <button onClick={() => setActiveCategory('specific')} style={{ scrollSnapAlign: 'start' }} className={`whitespace-nowrap px-[1.1rem] py-[0.55rem] rounded-[100px] font-[800] text-[0.85rem] transition-all flex-shrink-0 cursor-pointer border-[1px] ${activeCategory === 'specific' ? 'bg-[#f59e0b] text-white border-[#f59e0b] shadow-[0_4px_15px_rgba(245,158,11,0.35)] -translate-y-0.5' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] shadow-xs'}`}>{t('home.cat_specific')}</button>}
                  {categories.includes('management') && <button onClick={() => setActiveCategory('management')} style={{ scrollSnapAlign: 'start' }} className={`whitespace-nowrap px-[1.1rem] py-[0.55rem] rounded-[100px] font-[800] text-[0.85rem] transition-all flex-shrink-0 cursor-pointer border-[1px] ${activeCategory === 'management' ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-[0_4px_15px_rgba(59,130,246,0.35)] -translate-y-0.5' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] shadow-xs'}`}>{t('home.cat_management')}</button>}
                  {categories.includes('ia') && <button onClick={() => setActiveCategory('ia')} style={{ scrollSnapAlign: 'start' }} className={`whitespace-nowrap px-[1.1rem] py-[0.55rem] rounded-[100px] font-[800] text-[0.85rem] transition-all flex-shrink-0 cursor-pointer border-[1px] ${activeCategory === 'ia' ? 'bg-[#a855f7] text-white border-[#a855f7] shadow-[0_4px_15px_rgba(168,85,247,0.35)] -translate-y-0.5' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] shadow-xs'}`}>{t('home.cat_ia')}</button>}
                  
                  <button 
                    onClick={handleToggleInspectorMode}
                    style={{ scrollSnapAlign: 'start' }}
                    className={`flex items-center gap-[0.5rem] px-[1.1rem] py-[0.55rem] rounded-[100px] font-[800] text-[0.85rem] transition-all flex-shrink-0 cursor-pointer border-[1px] outline-none ${isInspectorMode ? 'bg-[#10b981] text-white border-[#10b981] shadow-[0_4px_15px_rgba(16,185,129,0.35)] transform translate-y-[-2px]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] hover:border-[rgba(16,185,129,0.3)] hover:translate-y-[-1px] shadow-sm'}`}
                  >
                    <span>{t('home.field_mode')}</span>
                    <div className={`relative w-[30px] h-[18px] rounded-full transition-colors ${isInspectorMode ? 'bg-[rgba(255,255,255,0.4)]' : 'bg-[rgba(100,116,139,0.3)]'}`}>
                      <div className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-[white] transition-transform ${isInspectorMode ? 'translate-x-[12px]' : 'translate-x-[0px]'} shadow-[0_1px_3px_rgba(0,0,0,0.3)]`} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(110px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: isMobile ? '0.6rem' : '1.2rem'
            }} className="grid grid-auto-rows-[auto]">
              {filteredQuickLinks
                .filter((link) => {
                  if (activeCategory === 'fav') return favorites.includes(link.to);
                  if (activeCategory === 'new') {
                    return (
                      ['/forklifts', '/grounding', '/noise-assessment', '/lighting', '/legal-matrix', '/ventilation', '/pts', '/racks', '/dossier', '/toolbox-talk', '/rgrl', '/rar', '/working-at-height', '/ppe-tracker', '/arc-flash', '/atex'].includes(link.to) ||
                      link.badge === 'Nuevo'
                    );
                  }
                  if (activeCategory !== 'all' && link.category !== activeCategory) return false;
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    link.label.toLowerCase().includes(q) ||
                    link.sub.toLowerCase().includes(q) ||
                    (link.norm && link.norm.toLowerCase().includes(q))
                  );
                })
                .length > 0 ? (
                filteredQuickLinks
                  .filter((link) => {
                    if (activeCategory === 'fav') return favorites.includes(link.to);
                    if (activeCategory === 'new') {
                      return (
                        ['/forklifts', '/grounding', '/noise-assessment', '/lighting', '/legal-matrix', '/ventilation', '/pts', '/racks', '/dossier', '/toolbox-talk', '/rgrl', '/rar', '/working-at-height', '/ppe-tracker', '/arc-flash', '/atex'].includes(link.to) ||
                        link.badge === 'Nuevo'
                      );
                    }
                    if (activeCategory !== 'all' && link.category !== activeCategory) return false;
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      link.label.toLowerCase().includes(q) ||
                      link.sub.toLowerCase().includes(q) ||
                      (link.norm && link.norm.toLowerCase().includes(q))
                    );
                  })
                  .map((link, i) => {
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
                      padding: isMobile ? '0.8rem 0.35rem' : '1.4rem 1rem',
                      borderRadius: isMobile ? '16px' : '20px',
                      background: 'var(--color-surface)',
                      border: `1px solid var(--color-border)`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: isMobile ? '0.4rem' : '0.65rem',
                      height: '100%',
                      minHeight: isMobile ? '118px' : '175px'
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
                    
                    {/* Top-right area: favorite star + badge + count */}
                    <div style={{
                      top: isMobile ? '0.4rem' : '0.65rem',
                      right: isMobile ? '0.4rem' : '0.65rem'
                    }} className="absolute flex items-center gap-[4px] z-[3]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(e, link.to);
                        }}
                        title={favorites.includes(link.to) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                        className="transition-all cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95"
                        style={{
                          width: isMobile ? '24px' : '26px',
                          height: isMobile ? '24px' : '26px',
                          minHeight: 'unset',
                          minWidth: 'unset',
                          padding: 0,
                          borderRadius: '50%',
                          border: favorites.includes(link.to)
                            ? '1px solid rgba(245, 158, 11, 0.5)'
                            : '1px solid rgba(148, 163, 184, 0.3)',
                          background: favorites.includes(link.to)
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(255, 255, 255, 0.85)',
                          color: favorites.includes(link.to) ? '#f59e0b' : '#64748b',
                          boxShadow: favorites.includes(link.to)
                            ? '0 2px 6px rgba(245, 158, 11, 0.25)'
                            : '0 1px 3px rgba(0, 0, 0, 0.08)',
                          opacity: 1,
                          cursor: 'pointer'
                        }}
                      >
                        <Star
                          size={isMobile ? 12 : 13}
                          weight={favorites.includes(link.to) ? 'fill' : 'bold'}
                          color={favorites.includes(link.to) ? '#f59e0b' : '#64748b'}
                        />
                      </button>

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
                      }} className="text-[#fff] p-[2px_6px] rounded-[100px] font-[800] tracking-[] leading-[]">
                          {link.badge}
                        </span>
                      }
                    </div>

                    {/* Icon */}
                    <div className={`premium-icon-box  shrink-0 ${link.category === 'ia' ? 'ai-magic-box' : ''}`} style={{
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
                        fontSize: isMobile ? '0.72rem' : '0.92rem',
                        margin: 0,
                        fontWeight: 800,
                        color: 'var(--color-text)',
                        wordBreak: 'break-word',
                        hyphens: 'auto',
                        lineHeight: 1.15,
                        textAlign: 'center',
                        width: '100%'
                      }}>
                        {link.label}
                      </h3>
                      <p style={{
                        margin: '0.2rem 0 0',
                        fontSize: isMobile ? '0.65rem' : '0.75rem',
                        lineHeight: '1.3',
                        color: 'var(--color-text-muted)',
                        opacity: 0.8,
                        wordBreak: 'break-word',
                        hyphens: 'auto'
                      }}>
                        {link.sub}
                      </p>
                    </div>

                    {/* Normative badge — bottom */}
                    {link.norm &&
                    <span
                      className="module-norm-badge"
                      style={{ '--card-accent-rgb': accentRgb } as React.CSSProperties}>
                      
                        {link.norm}
                      </span>
                    }
                  </Link>);

              })) : (
              <div className="grid-column-[1_/_-1] text-center p-[4rem_0] text-[var(--color-text-muted)]">
                  <MagnifyingGlass size={48} className="opacity-[0.2] mb-[1rem]" />
                  <h3 className="m-[0] text-[1.2rem] font-[700]">No se encontraron herramientas</h3>
                  <p className="m-[0.5rem_0_0] text-[0.9rem]">Probá con otro término de búsqueda.</p>
                </div>
              )}
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
                className="card p-[1.2rem] flex items-center gap-[1.2rem] transition-[all_0.2s_ease] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[16px] cursor-pointer shadow-[]"












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
                }} className="w-[48px] h-[48px] rounded-[12px] flex items-center justify-center shrink-0">
                  {typeColors[work.type]?.icon || <FileText size={22} weight="duotone" />}
                </div>
                <div className="flex-[1] min-w-0">
                  <h3 className="m-[0] text-[1rem] font-[700] text-[var(--color-text)] whitespace- overflow-[hidden] text-overflow-[ellipsis]">
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
      {/* Removed legacy onboarding modal in favor of MarketingLanding */}

    </div>
    </AnimatedPage>);

}