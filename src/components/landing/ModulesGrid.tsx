import React, { useState } from 'react';
import {
  ShieldCheck, Fire, FirstAid, Eye, FileText,
  GraduationCap, Lock, HardHat, ClipboardText,
  Lightning, ArrowRight, Lightbulb, SpeakerHigh, Truck,
  Crane, Tent, Wind, Package, Archive, Gavel, Warning,
  Robot, ThermometerHot, Pulse, MapTrifold,
  CheckCircle, Sparkle, CaretDown
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

interface ModuleItem {
  name: string;
  norm: string;
  desc: string;
  category: 'srt' | 'riesgo' | 'ia_cad' | 'gestion';
  color: string;
  gradient: string;
  icon: React.ReactElement;
  tag?: string;
  featured?: boolean;
}

// ── LOS 4 MÓDULOS MÁS UTILIZADOS ──
const topModules: ModuleItem[] = [
  {
    name: 'ATS / JSA Digital',
    norm: 'ISO 45001 & SRT',
    desc: 'Análisis de Trabajo Seguro con sugerencias automáticas de peligros, medidas de control preventivas y firma digital QR.',
    category: 'gestion',
    color: '#10b981',
    gradient: 'rgba(16,185,129,0.12)',
    icon: <ShieldCheck size={26} weight="duotone" />,
    tag: 'Más Utilizado',
    featured: true,
  },
  {
    name: 'Puesta a Tierra',
    norm: 'Res. SRT 900/15',
    desc: 'Medición de jabalinas, continuidad de masas, telurímetro e informe oficial con cálculo automático de resistencia.',
    category: 'srt',
    color: '#f59e0b',
    gradient: 'rgba(245,158,11,0.12)',
    icon: <Lightning size={26} weight="duotone" />,
    tag: 'Oficial SRT',
    featured: true,
  },
  {
    name: 'Iluminación Laboral',
    norm: 'Res. SRT 84/12',
    desc: 'Planilla oficial de luxometría según exigencia visual de puestos, cálculo de valor medio E y relación E_min / E_med.',
    category: 'srt',
    color: '#eab308',
    gradient: 'rgba(234,179,8,0.12)',
    icon: <Lightbulb size={26} weight="duotone" />,
    tag: 'Oficial SRT',
    featured: true,
  },
  {
    name: 'Ruido Laboral',
    norm: 'Res. SRT 85/12',
    desc: 'Protocolo de ruido continuo y de impacto, cálculo de NSCE, dosimetrías y curvas de atenuación NRR de protectores auditivos.',
    category: 'srt',
    color: '#8b5cf6',
    gradient: 'rgba(139,92,246,0.12)',
    icon: <SpeakerHigh size={26} weight="duotone" />,
    tag: 'Oficial SRT',
    featured: true,
  },
];

// ── LOS +28 MÓDULOS ESPECIALIZADOS RESTANTES ──
const otherModules: ModuleItem[] = [
  {
    name: 'Autoelevadores',
    norm: 'Res. SRT 960/15',
    desc: 'Carnet habilitante Anexo I, checklist pre-operacional diario, inspección técnica y control de horas.',
    category: 'srt',
    color: '#d97706',
    gradient: 'rgba(217,119,6,0.12)',
    icon: <Truck size={26} weight="duotone" />,
    tag: 'Res. 960/15',
  },
  {
    name: 'Trabajo en Altura',
    norm: 'Res. SRT 61/23',
    desc: 'Permiso PTSA, cálculo de Distancia Libre de Caída (DLC), factor de caída y verificación de anclajes 22 kN.',
    category: 'riesgo',
    color: '#f59e0b',
    gradient: 'rgba(245,158,11,0.12)',
    icon: <HardHat size={26} weight="duotone" />,
    tag: 'Res. 61/23',
  },
  {
    name: 'Carga de Fuego',
    norm: 'Dec. 351/79 Anexo VII',
    desc: 'Cálculo de madera equivalente, masa combustible, poder calorífico, potencial extintor y RF requerida.',
    category: 'gestion',
    color: '#f97316',
    gradient: 'rgba(249,115,22,0.12)',
    icon: <Fire size={26} weight="duotone" />,
    tag: 'Dec. 351/79',
  },
  {
    name: 'Bloqueo y Etiquetado LOTO',
    norm: 'OSHA 1910.147',
    desc: 'Procedimiento de desenergización de fuentes (eléctrica, hidráulica, neumática) y las 5 Reglas de Oro.',
    category: 'riesgo',
    color: '#dc2626',
    gradient: 'rgba(220,38,38,0.12)',
    icon: <Lock size={26} weight="duotone" />,
    tag: '5 Reglas de Oro',
  },
  {
    name: 'Espacios Confinados',
    norm: 'Res. SRT 953/10',
    desc: 'Permiso PTSEC, medición de gases (O2, CO, H2S, LEL), ventilación forzada y control de vigías.',
    category: 'riesgo',
    color: '#d97706',
    gradient: 'rgba(217,119,6,0.12)',
    icon: <Tent size={26} weight="duotone" />,
    tag: 'Res. 953/10',
  },
  {
    name: 'Constancia Entrega EPP',
    norm: 'Res. SRT 299/11',
    desc: 'Constancia oficial de entrega de elementos de protección personal con firma digital del operario.',
    category: 'srt',
    color: '#10b981',
    gradient: 'rgba(16,185,129,0.12)',
    icon: <HardHat size={26} weight="duotone" />,
    tag: 'Oficial SRT',
  },
  {
    name: 'Ergonomía Laboral',
    norm: 'Res. SRT 886/15',
    desc: 'Identificación inicial de factores de riesgo, Planilla 1, Planilla 2 y métodos NAM / RULA / REBA.',
    category: 'srt',
    color: '#3b82f6',
    gradient: 'rgba(59,130,246,0.12)',
    icon: <Pulse size={26} weight="duotone" />,
    tag: 'Oficial SRT',
  },
  {
    name: 'Planos de Evacuación CAD',
    norm: 'ISO 7010 & IRAM 10005',
    desc: 'Editor 2D de layout arquitectónico, colocación de matafuegos, rutas de salida y teléfonos de emergencia.',
    category: 'ia_cad',
    color: '#10b981',
    gradient: 'rgba(16,185,129,0.12)',
    icon: <MapTrifold size={26} weight="duotone" />,
    tag: 'CAD 2D',
  },
  {
    name: 'Asesor Legal & Técnico IA',
    norm: 'ISO 45001 & Ley 19.587',
    desc: 'Consultas instantáneas 24/7 entrenadas en la legislación argentina, decretos y normas IRAM/NFPA.',
    category: 'ia_cad',
    color: '#a855f7',
    gradient: 'rgba(168,85,247,0.12)',
    icon: <Robot size={26} weight="duotone" />,
    tag: 'IA Avanzada',
  },
  {
    name: 'RGRL Anual para ART',
    norm: 'Res. SRT 463/09',
    desc: 'Relevamiento General de Riesgos Laborales para presentar ante la aseguradora (Dec. 351, 911 y 617).',
    category: 'srt',
    color: '#2563eb',
    gradient: 'rgba(37,99,235,0.12)',
    icon: <ClipboardText size={26} weight="duotone" />,
    tag: 'Oficial ART',
  },
  {
    name: 'Nómina RAR',
    norm: 'Res. SRT 37/10',
    desc: 'Relevamiento de Agentes de Riesgo, personal expuesto, códigos ESOP y registro de cancerígenos.',
    category: 'srt',
    color: '#10b981',
    gradient: 'rgba(16,185,129,0.12)',
    icon: <Pulse size={26} weight="duotone" />,
    tag: 'Oficial SRT',
  },
  {
    name: 'Carga Térmica y Frío',
    norm: 'Res. SRT 30/23 & 295/03',
    desc: 'Protocolo de estrés térmico, índice TGBH, régimen de trabajo/descanso y aclimatación de operarios.',
    category: 'srt',
    color: '#f97316',
    gradient: 'rgba(249,115,22,0.12)',
    icon: <ThermometerHot size={26} weight="duotone" />,
    tag: 'Oficial SRT',
  },
  {
    name: 'Matriz Legal EHS',
    norm: 'ISO 45001 Cl. 9.1.2',
    desc: 'Evaluación periódica de cumplimiento de legislación nacional, provincial y resoluciones SRT.',
    category: 'srt',
    color: '#6366f1',
    gradient: 'rgba(99,102,241,0.12)',
    icon: <Gavel size={26} weight="duotone" />,
    tag: 'ISO 45001',
  },
  {
    name: 'Ventilación y Renovaciones',
    norm: 'Dec. 351/79 Cap. 11',
    desc: 'Cálculo de caudales mínimos de inyección y extracción, renovación de aire por volumen y operarios.',
    category: 'srt',
    color: '#0d9488',
    gradient: 'rgba(139,92,246,0.12)',
    icon: <Wind size={26} weight="duotone" />,
    tag: 'Dec. 351/79',
  },
  {
    name: 'Trabajo en Caliente',
    norm: 'NFPA 51B',
    desc: 'Permiso para soldadura y corte, radio preventivo de 11 metros, explosimetría y guardia de cenizas.',
    category: 'riesgo',
    color: '#ef4444',
    gradient: 'rgba(239,68,68,0.12)',
    icon: <Fire size={26} weight="duotone" />,
    tag: 'NFPA 51B',
  },
  {
    name: 'Arco Eléctrico (Arc Flash)',
    norm: 'NFPA 70E / Res. 3068/14',
    desc: 'Cálculo de energía incidente (cal/cm²), límites de aproximación segura y selección de EPP ignífugo.',
    category: 'riesgo',
    color: '#eab308',
    gradient: 'rgba(234,179,8,0.12)',
    icon: <Lightning size={26} weight="duotone" />,
    tag: 'NFPA 70E',
  },
  {
    name: 'Excavaciones y Zanjas',
    norm: 'Dec. 911/96 & OSHA 1926',
    desc: 'Estabilidad de taludes Tipo A, B, C, verificación de entibados > 1.2 m, rampas y vías de escape.',
    category: 'riesgo',
    color: '#f97316',
    gradient: 'rgba(249,115,22,0.12)',
    icon: <Warning size={26} weight="duotone" />,
    tag: 'Dec. 911/96',
  },
  {
    name: 'Izajes y Grúas',
    norm: 'ASME B30 & ISO 4309',
    desc: 'Plan de izaje crítico, capacidad neta, radio de operación, inspección de eslingas y riggers.',
    category: 'riesgo',
    color: '#f59e0b',
    gradient: 'rgba(245,158,11,0.12)',
    icon: <Crane size={26} weight="duotone" />,
    tag: 'ASME B30',
  },
  {
    name: 'Racks y Almacenaje',
    norm: 'IRAM 38500 / EN 15635',
    desc: 'Inspección técnica de estanterías industriales, clasificación de daños (Verde/Ámbar/Rojo) y sobrecargas.',
    category: 'riesgo',
    color: '#d97706',
    gradient: 'rgba(217,119,6,0.12)',
    icon: <Package size={26} weight="duotone" />,
    tag: 'IRAM 38500',
  },
  {
    name: 'Atmósferas Explosivas ATEX',
    norm: 'IEC 60079 & Dec. 351',
    desc: 'Zonificación de áreas peligrosas (Zonas 0, 1, 2 para gases y 20, 21, 22 para polvos) e inventario Ex.',
    category: 'riesgo',
    color: '#dc2626',
    gradient: 'rgba(220,38,38,0.12)',
    icon: <Lightning size={26} weight="duotone" />,
    tag: 'ATEX',
  },
  {
    name: 'Cámara IA Visión EPP',
    norm: 'Visión Computacional',
    desc: 'Detección automática de uso de casco, chaleco reflectivo, barbijo y condiciones inseguras en fotos.',
    category: 'ia_cad',
    color: '#0ea5e9',
    gradient: 'rgba(14,165,233,0.12)',
    icon: <Eye size={26} weight="duotone" />,
    tag: 'Visión IA',
  },
  {
    name: 'Charlas de 5 Min con IA',
    norm: 'ISO 45001',
    desc: 'Generador de Toolbox Talks adaptado al trabajo diario con registro de asistencia y firma táctil.',
    category: 'ia_cad',
    color: '#3b82f6',
    gradient: 'rgba(59,130,246,0.12)',
    icon: <GraduationCap size={26} weight="duotone" />,
    tag: 'IA Rápida',
  },
  {
    name: 'Dossier ZIP para ART',
    norm: 'Auditorías EHS',
    desc: 'Descarga en un solo archivo comprimido toda la carpeta legal, mediciones y constancias de la empresa.',
    category: 'ia_cad',
    color: '#6366f1',
    gradient: 'rgba(99,102,241,0.12)',
    icon: <Archive size={26} weight="duotone" />,
    tag: 'Dossier Digital',
  },
  {
    name: 'Editor de Informes A4',
    norm: 'Memoria Técnica',
    desc: 'Editor profesional estilo Word con vista previa exacta de hoja A4, membrete propio y sin cortes de página.',
    category: 'ia_cad',
    color: '#ec4899',
    gradient: 'rgba(236,72,153,0.12)',
    icon: <FileText size={26} weight="duotone" />,
    tag: 'A4 Vectorial',
  },
  {
    name: 'Inventario de Extintores',
    norm: 'IRAM 3517 / NFPA 10',
    desc: 'Control de tarjetas, prueba hidráulica, vencimientos por código QR e inspecciones trimestrales.',
    category: 'gestion',
    color: '#dc2626',
    gradient: 'rgba(220,38,38,0.12)',
    icon: <Fire size={26} weight="duotone" />,
    tag: 'QR Activos',
  },
  {
    name: 'Investigación de Accidentes',
    norm: 'Árbol de Causas',
    desc: 'Análisis sistemático de siniestros, método de los 5 Porqués, diagrama de Ishikawa y plan de acción.',
    category: 'gestion',
    color: '#ef4444',
    gradient: 'rgba(239,68,68,0.12)',
    icon: <FirstAid size={26} weight="duotone" />,
    tag: 'ISO 45001',
  },
  {
    name: 'Procedimientos PTS / SOP',
    norm: 'POETS Operativos',
    desc: 'Redacción estandarizada de procedimientos seguros de trabajo con matriz de responsabilidades.',
    category: 'gestion',
    color: '#6366f1',
    gradient: 'rgba(99,102,241,0.12)',
    icon: <FileText size={26} weight="duotone" />,
    tag: 'SOP EHS',
  },
  {
    name: 'Auditorías e Inspecciones',
    norm: 'Checklists EHS',
    desc: 'Plantillas para industria, obras, minería y agro con fotos de evidencia y plan de acción CAPA.',
    category: 'gestion',
    color: '#3b82f6',
    gradient: 'rgba(59,130,246,0.12)',
    icon: <ClipboardText size={26} weight="duotone" />,
    tag: 'CAPA',
  },
];

const featuredOtherBadges = [
  'Autoelevadores (960/15)',
  'Trabajo en Altura (61/23)',
  'Carga de Fuego',
  'Bloqueo LOTO',
  'Espacios Confinados (953/10)',
  'Ergonomía (886/15)',
  'Planos CAD 2D',
  'Asesor Legal IA'
];

interface ModulesGridProps {
  onStart?: () => void;
}

export default function ModulesGrid({ onStart }: ModulesGridProps) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const handleAction = () => {
    if (onStart) {
      onStart();
    } else {
      navigate('/login', { state: { view: 'register' } });
    }
  };

  const renderCard = (mod: ModuleItem, i: number) => {
    const isHovered = hovered === i;
    return (
      <div
        key={i}
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
        className="relative p-5 rounded-2xl border transition-all flex flex-col justify-between group overflow-hidden bg-slate-900/70 hover:bg-slate-900/90"
        style={{
          borderColor: isHovered ? `${mod.color}50` : 'rgba(255, 255, 255, 0.08)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered ? `0 16px 32px ${mod.color}15` : 'none',
        }}
      >
        {/* Glow en hover */}
        {isHovered && (
          <div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40"
            style={{ background: mod.color }}
          />
        )}

        <div className="space-y-3 relative z-10">
          {/* Cabecera de la tarjeta: Icono + Normativa */}
          <div className="flex items-start justify-between gap-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105"
              style={{
                background: `${mod.color}18`,
                borderColor: `${mod.color}35`,
                color: mod.color,
              }}
            >
              {mod.icon}
            </div>

            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full border tracking-wide uppercase"
              style={{
                background: `${mod.color}15`,
                borderColor: `${mod.color}35`,
                color: mod.color,
              }}
            >
              {mod.norm}
            </span>
          </div>

          {/* Título y Descripción */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-blue-300 transition-colors">
                {mod.name}
              </h3>
              {mod.tag && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {mod.tag}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mt-1.5 line-clamp-3">
              {mod.desc}
            </p>
          </div>
        </div>

        {/* Pie de tarjeta: Tag y Botón de acción */}
        <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs relative z-10">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <CheckCircle size={13} className="text-emerald-400" weight="fill" />
            PDF & Firma QR
          </span>

          <button
            onClick={handleAction}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
          >
            <span>Probar</span>
            <ArrowRight size={13} weight="bold" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section id="modulos" className="py-20 px-4 sm:px-8 bg-gradient-to-b from-[#020617] via-[#050b1d] to-[#020617] relative overflow-hidden">
      {/* Glow de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkle size={14} weight="fill" />
            <span>Suite Integral de Higiene, Seguridad y Medio Ambiente</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Módulos Principales <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">+30 Herramientas EHS</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Desde los protocolos oficiales exigidos por la SRT hasta permisos de alto riesgo, planos arquitectónicos y asistencia por inteligencia artificial.
          </p>
        </div>

        {/* Cuadrícula de los 4 Módulos Más Utilizados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {topModules.map((mod, i) => renderCard(mod, i))}
        </div>

        {/* Banner / Card para los +28 Módulos Adicionales */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md transition-all shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold">
                <Sparkle size={13} weight="fill" />
                <span>+28 Módulos Especializados Disponibles</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Todos los protocolos oficiales, permisos críticos y herramientas de gestión
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                Autoelevadores (960/15), Trabajo en Altura (61/23), Carga de Fuego, LOTO, Espacios Confinados, Ergonomía (886/15), Planos de Evacuación CAD, Asesor IA y más.
              </p>

              {/* Chips rápidos */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
                {featuredOtherBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium"
                  >
                    {badge}
                  </span>
                ))}
                <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold">
                  +20 más
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 text-blue-200 hover:text-white border border-blue-500/40 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
              >
                <span>{showAll ? 'Ocultar catálogo (+28)' : 'Ver todos los módulos (+28)'}</span>
                <CaretDown size={16} className={`transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Grilla expandible de los 28 módulos restantes */}
          {showAll && (
            <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Catálogo completo de módulos (+28 adicionales)
                </span>
                <button
                  onClick={() => setShowAll(false)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer bg-transparent border-none"
                >
                  Colapsar vista
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {otherModules.map((mod, i) => renderCard(mod, i + 100))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Inferior */}
        <div className="text-center pt-4">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 border border-white/10 p-4 sm:p-5 rounded-2xl shadow-xl">
            <div className="text-center sm:text-left">
              <h4 className="text-sm sm:text-base font-extrabold text-white">¿Querés probar todos estos módulos en tu próximo servicio?</h4>
              <p className="text-xs text-slate-400">Creá tu cuenta gratis en menos de 1 minuto sin ingresar tarjeta de crédito.</p>
            </div>
            <button
              onClick={handleAction}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer border-none shrink-0"
            >
              <span>Comenzar Ahora Gratis</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
