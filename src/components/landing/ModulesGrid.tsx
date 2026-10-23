import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, Fire, Cpu, FirstAid, Eye, FileText,
  ChartBar, GraduationCap, Lock, HardHat, ClipboardText,
  Lightning, ArrowRight, Lightbulb, SpeakerHigh, Truck,
  Crane, Tent, Wind, Package, Archive, Gavel, Warning,
  Robot, ThermometerHot, Pulse, MapTrifold,
  MagnifyingGlass, CheckCircle, Sparkle
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

const allModules: ModuleItem[] = [
  // ── PROTOCOLOS OFICIALES SRT / LEGALES ──
  {
    name: 'Puesta a Tierra',
    norm: 'Res. SRT 900/15',
    desc: 'Medición de jabalinas, continuidad de masas, telurímetro e informe oficial con cálculo de resistencia.',
    category: 'srt',
    color: '#f59e0b',
    gradient: 'rgba(245,158,11,0.12)',
    icon: <Lightning size={26} weight="duotone" />,
    tag: 'Oficial SRT',
    featured: true,
  },
  {
    name: 'Ruido Laboral',
    norm: 'Res. SRT 85/12',
    desc: 'Protocolo de ruido continuo y de impacto, cálculo de NSCE, dosimetrías y curvas de atenuación NRR.',
    category: 'srt',
    color: '#8b5cf6',
    gradient: 'rgba(139,92,246,0.12)',
    icon: <SpeakerHigh size={26} weight="duotone" />,
    tag: 'Oficial SRT',
    featured: true,
  },
  {
    name: 'Iluminación Laboral',
    norm: 'Res. SRT 84/12',
    desc: 'Planilla oficial de luxometría según exigencia visual, cálculo de valor medio E y relación E_min / E_med.',
    category: 'srt',
    color: '#eab308',
    gradient: 'rgba(234,179,8,0.12)',
    icon: <Lightbulb size={26} weight="duotone" />,
    tag: 'Oficial SRT',
    featured: true,
  },
  {
    name: 'Autoelevadores',
    norm: 'Res. SRT 960/15',
    desc: 'Carnet habilitante Anexo I, checklist pre-operacional diario, inspección técnica y control de horas.',
    category: 'srt',
    color: '#d97706',
    gradient: 'rgba(217,119,6,0.12)',
    icon: <Truck size={26} weight="duotone" />,
    tag: 'Nuevo 2026',
    featured: true,
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
    featured: true,
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
    featured: true,
  },
  {
    name: 'Ventilación y Renovaciones',
    norm: 'Dec. 351/79 Cap. 11',
    desc: 'Cálculo de caudales mínimos de inyección y extracción, renovación de aire por volumen y operarios.',
    category: 'srt',
    color: '#0d9488',
    gradient: 'rgba(13,148,136,0.12)',
    icon: <Wind size={26} weight="duotone" />,
    tag: 'Dec. 351/79',
  },

  // ── TAREAS DE ALTO RIESGO & PERMISOS ──
  {
    name: 'Trabajo en Altura',
    norm: 'Res. SRT 61/23',
    desc: 'Permiso PTSA, cálculo de Distancia Libre de Caída (DLC), factor de caída y verificación de anclajes 22 kN.',
    category: 'riesgo',
    color: '#f59e0b',
    gradient: 'rgba(245,158,11,0.12)',
    icon: <HardHat size={26} weight="duotone" />,
    tag: 'Res. 61/23',
    featured: true,
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
    featured: true,
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
    featured: true,
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

  // ── IA, PLANOS & DOCUMENTACIÓN AVANZADA ──
  {
    name: 'Asesor Legal & Técnico IA',
    norm: 'ISO 45001 & Ley 19.587',
    desc: 'Consultas instantáneas 24/7 entrenadas en la legislación argentina, decretos y normas IRAM/NFPA.',
    category: 'ia_cad',
    color: '#a855f7',
    gradient: 'rgba(168,85,247,0.12)',
    icon: <Robot size={26} weight="duotone" />,
    tag: 'IA Avanzada',
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
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

  // ── GESTIÓN EHS, CAMPO & AUDITORÍA ──
  {
    name: 'ATS / JSA Digital',
    norm: 'ISO 45001',
    desc: 'Análisis de Trabajo Seguro con sugerencias automáticas de peligros, medidas de control y firma QR remota.',
    category: 'gestion',
    color: '#10b981',
    gradient: 'rgba(16,185,129,0.12)',
    icon: <ShieldCheck size={26} weight="duotone" />,
    tag: 'Firma QR',
    featured: true,
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
    featured: true,
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

interface ModulesGridProps {
  onStart?: () => void;
}

export default function ModulesGrid({ onStart }: ModulesGridProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'srt' | 'riesgo' | 'ia_cad' | 'gestion'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [hovered, setHovered] = useState<number | null>(null);

  const handleAction = () => {
    if (onStart) {
      onStart();
    } else {
      navigate('/login', { state: { view: 'register' } });
    }
  };

  const filteredModules = useMemo(() => {
    return allModules.filter(m => {
      const matchCategory = selectedCategory === 'todos' || m.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.norm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const categories = [
    { id: 'todos', label: 'Todos los Módulos (+45)', badge: `${allModules.length}` },
    { id: 'srt', label: 'Protocolos Oficiales SRT', badge: '11' },
    { id: 'riesgo', label: 'Tareas de Alto Riesgo', badge: '9' },
    { id: 'ia_cad', label: 'IA, Planos CAD & Dossier', badge: '6' },
    { id: 'gestion', label: 'Gestión EHS & Terreno', badge: '6' },
  ];

  return (
    <section id="modulos" className="py-24 px-4 sm:px-8 bg-gradient-to-b from-[#020617] via-[#050b1d] to-[#020617] relative overflow-hidden">
      {/* Glow de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkle size={14} weight="fill" />
            <span>Suite Integral de Higiene, Seguridad y Medio Ambiente</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Más de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">45 Módulos Especializados</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Desde los protocolos oficiales exigidos por la SRT hasta permisos de alto riesgo, planos arquitectónicos y asistencia por inteligencia artificial.
          </p>
        </div>

        {/* Barra de Filtros & Búsqueda */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900/60 p-2 sm:p-3 rounded-2xl border border-white/10 backdrop-blur-md">
          {/* Categorías */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
            {categories.map((c) => {
              const active = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-2 ${
                    active
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                      : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/10'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${active ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'}`}>
                    {c.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Buscador de Módulos */}
          <div className="relative w-full lg:w-72 shrink-0">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por norma o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Cuadrícula de Módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredModules.map((mod, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="relative p-5 rounded-2xl border transition-all flex flex-col justify-between group overflow-hidden bg-slate-900/70 hover:bg-slate-900/90"
              style={{
                borderColor: hovered === i ? `${mod.color}50` : 'rgba(255, 255, 255, 0.08)',
                transform: hovered === i ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hovered === i ? `0 16px 32px ${mod.color}15` : 'none',
              }}
            >
              {/* Glow en hover */}
              {hovered === i && (
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
                  <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                    {mod.name}
                  </h3>
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
          ))}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <p className="text-base font-bold text-white">No se encontraron módulos con ese criterio.</p>
            <p className="text-xs">Probá con palabras como "ruido", "altura", "SRT", "fuego" o "extintor".</p>
          </div>
        )}

        {/* CTA Inferior */}
        <div className="text-center pt-6">
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
