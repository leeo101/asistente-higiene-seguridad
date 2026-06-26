import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, ArrowRight, ShieldCheck, Flame, ClipboardList,
  AlertTriangle, ScrollText, Lightbulb, KeySquare, Bot,
  HardHat, Users, Siren, Map, Accessibility, Scale, Camera,
  ShieldAlert, ThermometerSun, Shield, Plus, Zap, CheckCircle,
  MessageSquare, PieChart, Lock, Droplets, Volume2, Beaker,
  ArrowUp, Truck, Timer, FileText } from
'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CmdItem {
  key: string;
  id: string | number;
  title: string;
  subtitle: string;
  date: string | null;
  isModule: boolean;
  nav: string;
  color: string;
  bg: string;
  icon: React.ReactElement;
  label: string;
}
interface GlobalSearchProps {onClose: () => void;}

// ─── Módulos ──────────────────────────────────────────────────────────────────
const MODULES = [
{ nav: '/ai-advisor', icon: <Bot size={17} />, label: 'Asesor IA', sub: 'Consultas de Seguridad', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
{ nav: '/ats', icon: <ShieldCheck size={17} />, label: 'ATS', sub: 'Análisis Trabajo Seguro', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
{ nav: '/audit', icon: <ClipboardList size={17} />, label: 'Auditorías', sub: 'Control Interno y EHS', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
{ nav: '/ai-camera-manager', icon: <Camera size={17} />, label: 'Cámara IA', sub: 'Detección EPP', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
{ nav: '/capa', icon: <CheckCircle size={17} />, label: 'CAPA', sub: 'Acciones Correctivas', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
{ nav: '/training-management', icon: <Users size={17} />, label: 'Capacitar', sub: 'Planillas y Asistencia', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
{ nav: '/fire-load', icon: <Flame size={17} />, label: 'Carga Fuego', sub: 'Dec. 351/79', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
{ nav: '/toolbox-talk', icon: <MessageSquare size={17} />, label: 'Charlas 5 Min', sub: 'Registro de Capacitación Diaria', color: '#0052CC', bg: 'rgba(0,82,204,0.1)' },
{ nav: '/checklists', icon: <ClipboardList size={17} />, label: 'Checklists', sub: 'Herramientas y Equipos', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
{ nav: '/ppe-tracker', icon: <HardHat size={17} />, label: 'Control EPP', sub: 'Vencimientos', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
{ nav: '/ergonomics', icon: <Accessibility size={17} />, label: 'Ergonomía', sub: 'Res. SRT 886', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
{ nav: '/confined-space', icon: <ShieldAlert size={17} />, label: 'Espacios Confinados', sub: 'Permisos y Control', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
{ nav: '/thermal-stress', icon: <ThermometerSun size={17} />, label: 'Estrés Térmico', sub: 'Carga Térmica', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
{ nav: '/extinguisher-ai', icon: <Flame size={17} />, label: 'Extintores IA', sub: 'Reconocimiento', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
{ nav: '/lighting', icon: <Lightbulb size={17} />, label: 'Iluminación', sub: 'Mediciones', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
{ nav: '/reports', icon: <ScrollText size={17} />, label: 'Informes', sub: 'Técnicos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
{ nav: '/accident-investigation', icon: <Siren size={17} />, label: 'Investigación', sub: 'Accidentes / Árbol', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
{ nav: '/safety-kpis', icon: <PieChart size={17} />, label: 'KPIs Seguridad', sub: 'Índices de Siniestralidad', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
{ nav: '/legislation', icon: <Scale size={17} />, label: 'Legislación', sub: 'Biblioteca Legal', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
{ nav: '/loto', icon: <Lock size={17} />, label: 'LOTO', sub: 'Bloqueo y Etiquetado', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
{ nav: '/risk-maps-history', icon: <Map size={17} />, label: 'Mapas', sub: 'Croquis de Riesgos', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
{ nav: '/extintores', icon: <Flame size={17} />, label: 'Matafuegos', sub: 'Control y Vencimientos', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
{ nav: '/environmental', icon: <Droplets size={17} />, label: 'Medio Ambiente', sub: 'Monitoreo y Control', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
{ nav: '/work-permit', icon: <KeySquare size={17} />, label: 'Permisos', sub: 'Tareas Críticas', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
{ nav: '/ai-general-camera-manager', icon: <ShieldAlert size={17} />, label: 'Riesgos IA', sub: 'Análisis de Entorno', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
{ nav: '/noise-assessment', icon: <Volume2 size={17} />, label: 'Ruido', sub: 'Evaluación de Niveles Sonoros', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
{ nav: '/chemical-safety', icon: <Beaker size={17} />, label: 'Seguridad Química', sub: 'Gestión de Sustancias y SGA', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
{ nav: '/drills', icon: <Siren size={17} />, label: 'Simulacros', sub: 'Actas de Evacuación', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
{ nav: '/stop-cards', icon: <AlertTriangle size={17} />, label: 'Tarjetas STOP', sub: 'Observaciones', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
{ nav: '/working-at-height', icon: <ArrowUp size={17} />, label: 'Trabajo en Altura', sub: 'Permisos y EPP Crítico', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
{ nav: '/lifting-form', icon: <Truck size={17} />, label: 'Izaje y Grúas', sub: 'Plan de Izaje Crítico', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
{ nav: '/fleet-form', icon: <Truck size={17} />, label: 'Flota y Vehículos', sub: 'Inspección Pre-Operacional', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
{ nav: '/evacuation-history', icon: <Timer size={17} />, label: 'Simulador de Evacuación', sub: 'Cálculo de Tiempos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
{ nav: '/legajos', icon: <FileText size={17} />, label: 'Legajos Técnicos', sub: 'Decreto 351/79', color: '#eab308', bg: 'rgba(234,179,8,0.1)' }];


// ─── Acciones Rápidas ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
{ nav: '/ats', label: 'Nuevo ATS', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <Plus size={16} /> },
{ nav: '/work-permit', label: 'Nuevo Permiso de Trabajo', color: '#2563eb', bg: 'rgba(37,99,235,0.12)', icon: <Plus size={16} /> },
{ nav: '/fire-load', label: 'Nueva Carga de Fuego', color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: <Plus size={16} /> },
{ nav: '/drills/new', label: 'Nuevo Simulacro', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: <Plus size={16} /> },
{ nav: '/stop-cards/new', label: 'Nueva Tarjeta STOP', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: <Plus size={16} /> },
{ nav: '/ai-advisor', label: 'Consultar Asesor IA', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: <Zap size={16} /> }];


// ─── Fuentes de Historial ─────────────────────────────────────────────────────
const SOURCES = [
{ key: 'ats_history', label: 'ATS', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <ShieldCheck size={15} />, nav: '/ats', titleField: 'empresa', subtitleField: 'obra', dateField: 'fecha' },
{ key: 'fireload_history', label: 'Carga Fuego', color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: <Flame size={15} />, nav: '/fire-load', titleField: 'empresa', subtitleField: 'sector', dateField: 'createdAt' },
{ key: 'tool_checklists_history', label: 'Checklist', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', icon: <ClipboardList size={15} />, nav: '/checklists', titleField: 'equipo', subtitleField: 'empresa', dateField: 'fecha' },
{ key: 'lighting_history', label: 'Iluminación', color: '#eab308', bg: 'rgba(234,179,8,0.1)', icon: <Lightbulb size={15} />, nav: '/lighting-history', titleField: 'empresa', subtitleField: 'sector', dateField: 'date' },
{ key: 'work_permits_history', label: 'Permiso', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', icon: <KeySquare size={15} />, nav: '/work-permit-history', titleField: 'empresa', subtitleField: 'tarea', dateField: 'createdAt' },
{ key: 'training_history', label: 'Capacitación', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Users size={15} />, nav: '/training-history', titleField: 'tema', subtitleField: 'empresa', dateField: 'fecha' },
{ key: 'reports_history', label: 'Informe', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: <ScrollText size={15} />, nav: '/history', titleField: 'title', subtitleField: 'company', dateField: 'createdAt' }];


// ─── Component ────────────────────────────────────────────────────────────────
export default function GlobalSearch({ onClose }: GlobalSearchProps): React.ReactElement {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CmdItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {inputRef.current?.focus();}, []);

  // ── Build search results ─────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim() || query.length < 2) {setResults([]);setActiveIdx(0);return;}

    const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const q = normalizeText(query);
    const found: CmdItem[] = [];

    MODULES.forEach((mod) => {
      if (normalizeText(`${mod.label} ${mod.sub}`).includes(q)) {
        found.push({ key: `m-${mod.nav}`, id: 'nav', nav: mod.nav, color: mod.color, bg: mod.bg, icon: mod.icon, label: 'Módulo', title: mod.label, subtitle: mod.sub, date: null, isModule: true });
      }
    });

    SOURCES.forEach((src) => {
      try {
        const items: any[] = JSON.parse(localStorage.getItem(src.key) || '[]');
        items.forEach((item) => {
          const title = item[src.titleField] || '';
          const subtitle = src.subtitleField ? item[src.subtitleField] || '' : '';
          if (normalizeText(`${title} ${subtitle}`).includes(q)) {
            found.push({ key: `h-${src.key}-${item.id || item.fecha}`, id: item.id || item.fecha, nav: src.nav, color: src.color, bg: src.bg, icon: src.icon, label: src.label, title: title || '—', subtitle, date: item[src.dateField], isModule: false });
          }
        });
      } catch {/* skip malformed */}
    });

    found.sort((a, b) => {
      if (a.isModule && !b.isModule) return -1;
      if (!a.isModule && b.isModule) return 1;
      if (!a.isModule && !b.isModule && a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
      return 0;
    });
    setResults(found.slice(0, 12));
    setActiveIdx(0);
  }, [query]);

  // ── Scroll active item into view ─────────────────────────────────────────
  useEffect(() => {itemRefs.current[activeIdx]?.scrollIntoView({ block: 'nearest' });}, [activeIdx]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const totalItems = query.length < 2 ? QUICK_ACTIONS.length : results.length;
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {onClose();return;}
    if (e.key === 'ArrowDown') {e.preventDefault();setActiveIdx((i) => (i + 1) % totalItems);}
    if (e.key === 'ArrowUp') {e.preventDefault();setActiveIdx((i) => (i - 1 + totalItems) % totalItems);}
    if (e.key === 'Enter') {
      e.preventDefault();
      const nav = query.length < 2 ? QUICK_ACTIONS[activeIdx]?.nav : results[activeIdx]?.nav;
      if (nav) {navigate(nav);onClose();}
    }
  }, [query, results, activeIdx, totalItems, navigate, onClose]);

  const go = (nav: string) => {navigate(nav);onClose();};

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div

      onClick={onClose} className="fixed inset-[0] z-[9999] bg-[rgba(0,0,0,0.6)] backdrop-filter-[blur(10px)] webkit-backdrop-filter-[blur(10px)] flex items-start justify-center p-[max(3.5rem,_8vh)_1rem_1rem] overflow-y-[auto]">
      
      <div
        onClick={(e) => e.stopPropagation()} className="w-[100%] max-w-[620px] rounded-[24px] overflow-[hidden] box-shadow-[0_40px_120px_rgba(0,0,0,0.5),_0_0_0_1px_rgba(255,255,255,0.08)] bg-[var(--glass-thick,_rgba(255,255,255,0.92))] backdrop-filter-[blur(40px)] webkit-backdrop-filter-[blur(40px)] animation-[cmdIn_0.2s_cubic-bezier(0.16,1,0.3,1)]">

        
        {/* ── Input ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-[0.85rem] p-[1.1rem_1.4rem] border-bottom-[1px_solid_var(--glass-border)]">
          <Search size={22} strokeWidth={2.5} color="var(--color-primary)" className="flex-shrink-[0]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar módulo, registro o acción…"
            aria-label="Buscar módulo, registro o acción"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown} className="flex-[1] border-none outline-[none] bg-[transparent] text-[1.05rem] text-[var(--color-text)] font-[600] font-family-[inherit] min-width-[0]" />

          
          {query ?
          <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda" className="bg-[none] border-none cursor-pointer text-[var(--color-text-muted)] flex p-[0.25rem] rounded-[6px] flex-shrink-[0]">
              <X size={18} />
            </button> :

          <kbd style={kbdStyle}>ESC</kbd>
          }
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="max-height-[min(460px,_60vh)] overflow-y-[auto] overscroll-behavior-[contain]">

          {/* Empty state → Quick Actions + Module Grid */}
          {query.length < 2 &&
          <div>
              <SectionLabel text="⚡ Acciones Rápidas" />
              {QUICK_ACTIONS.map((qa, i) =>
            <div
              key={qa.label}
              ref={(el) => {itemRefs.current[i] = el;}}
              onClick={() => go(qa.nav)}
              onMouseEnter={() => setActiveIdx(i)}
              style={{ background: activeIdx === i ? 'var(--color-surface-hover)' : 'transparent' }} className="flex items-center gap-[0.9rem] p-[0.78rem_1.4rem] cursor-pointer transition-[background_0.1s] border-bottom-[1px_solid_var(--glass-border-subtle)]">
              
                  <div style={{ background: qa.bg, color: qa.color }} className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-[0]">
                    {qa.icon}
                  </div>
                  <span className="font-[700] text-[0.9rem] text-[var(--color-text)] flex-[1]">{qa.label}</span>
                  {activeIdx === i && <ArrowRight size={16} color="var(--color-text-muted)" />}
                </div>
            )}

              <SectionLabel text="📂 Módulos" />
              <div className="grid grid-template-columns-[repeat(auto-fill,_minmax(155px,_1fr))] gap-[0.5rem] p-[0.75rem_1.4rem_1.1rem]">
                {MODULES.slice(0, 9).map((mod) =>
              <button
                key={mod.nav}
                onClick={() => go(mod.nav)}

                onMouseOver={(e) => {(e.currentTarget as HTMLButtonElement).style.borderColor = mod.color;(e.currentTarget as HTMLButtonElement).style.background = mod.bg;}}
                onMouseOut={(e) => {(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--glass-border-subtle)';(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-background)';}} className="flex items-center gap-[0.6rem] p-[0.6rem_0.85rem] bg-[var(--color-background)] border-[1px_solid_var(--glass-border-subtle)] rounded-[12px] cursor-pointer transition-[all_0.15s] text-left text-[var(--color-text)]">
                
                    <span style={{ color: mod.color }} className="flex-shrink-[0]">{mod.icon}</span>
                    <span className="text-[0.77rem] font-[700] line-height-[1.3]">{mod.label}</span>
                  </button>
              )}
              </div>
            </div>
          }

          {/* Search results */}
          {query.length >= 2 && results.length === 0 &&
          <div className="p-[2.5rem] text-center text-[var(--color-text-muted)]">
              <Search size={42} strokeWidth={1} className="opacity-[0.15] block m-[0_auto_0.75rem]" />
              <p className="m-[0] font-[700] text-[0.95rem]">Sin resultados para "{query}"</p>
              <p className="m-[0.4rem_0_0] text-[0.8rem] opacity-[0.6]">Probá con otro término</p>
            </div>
          }

          {query.length >= 2 && results.length > 0 && (() => {
            const mods = results.filter((r) => r.isModule);
            const hist = results.filter((r) => !r.isModule);
            let gi = 0;
            return (
              <>
                {mods.length > 0 && <><SectionLabel text={`Módulos (${mods.length})`} />{mods.map((item) => {const idx = gi++;return <ResultRow key={item.key} item={item} idx={idx} activeIdx={activeIdx} onHover={setActiveIdx} onSelect={() => go(item.nav)} itemRefs={itemRefs} />;})}</>}
                {hist.length > 0 && <><SectionLabel text={`Historial (${hist.length})`} />{hist.map((item) => {const idx = gi++;return <ResultRow key={item.key} item={item} idx={idx} activeIdx={activeIdx} onHover={setActiveIdx} onSelect={() => go(item.nav)} itemRefs={itemRefs} />;})}</>}
              </>);

          })()}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {!isMobile &&
        <div className="flex items-center justify-space-between p-[0.65rem_1.4rem] border-top-[1px_solid_var(--glass-border)] bg-[var(--color-background)]">
            <div className="flex gap-[1.25rem] text-[0.7rem] text-[var(--color-text-muted)] font-[600]">
              <span><kbd style={kbdStyle}>↑↓</kbd> navegar</span>
              <span><kbd style={kbdStyle}>↵</kbd> abrir</span>
              <span><kbd style={kbdStyle}>ESC</kbd> cerrar</span>
            </div>
            <span className="text-[0.65rem] font-[800] text-[var(--color-text-muted)] opacity-[0.45] letter-spacing-[0.05em]">Ctrl + K</span>
          </div>
        }
      </div>

      <style>{`
        @keyframes cmdIn {
          from { opacity:0; transform: translateY(-16px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)     scale(1);    }
        }
      `}</style>
    </div>);

}

// ─── Sub-components ────────────────────────────────────────────────────────────
function SectionLabel({ text }: {text: string;}) {
  return (
    <div className="p-[0.5rem_1.4rem_0.2rem] text-[0.68rem] font-[800] text-[var(--color-text-muted)] uppercase letter-spacing-[0.07em] border-top-[1px_solid_var(--glass-border-subtle)]">
      {text}
    </div>);

}

function ResultRow({ item, idx, activeIdx, onHover, onSelect, itemRefs



}: {item: CmdItem;idx: number;activeIdx: number;onHover: (i: number) => void;onSelect: () => void;itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;}) {
  const active = idx === activeIdx;
  return (
    <div
      ref={(el) => {itemRefs.current[idx] = el;}}
      onClick={onSelect}
      onMouseEnter={() => onHover(idx)}
      style={{ background: active ? 'var(--color-surface-hover)' : 'transparent' }} className="flex items-center gap-[0.9rem] p-[0.75rem_1.4rem] cursor-pointer transition-[background_0.1s] border-bottom-[1px_solid_var(--glass-border-subtle)]">
      
      <div style={{ background: item.bg, color: item.color }} className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-[0]">
        {item.icon}
      </div>
      <div className="flex-[1] min-width-[0]">
        <div className="font-[700] text-[0.9rem] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis] text-[var(--color-text)]">{item.title}</div>
        <div className="flex items-center gap-[0.45rem] mt-[0.12rem]">
          <span style={{ background: item.bg, color: item.color }} className="p-[0.05rem_0.42rem] rounded-[20px] text-[0.62rem] font-[800] flex-shrink-[0]">{item.label}</span>
          {item.subtitle && <span className="text-[0.73rem] text-[var(--color-text-muted)] overflow-[hidden] text-overflow-[ellipsis] white-space-[nowrap]">{item.subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-[0.4rem] flex-shrink-[0]">
        {item.date && <span className="text-[0.68rem] text-[var(--color-text-muted)]">{new Date(item.date).toLocaleDateString('es-AR')}</span>}
        {active && <ArrowRight size={16} color="var(--color-text-muted)" />}
      </div>
    </div>);

}

const kbdStyle: React.CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: '5px', padding: '0.1rem 0.38rem', fontSize: '0.68rem',
  fontWeight: 800, fontFamily: 'inherit', marginRight: '0.22rem'
};