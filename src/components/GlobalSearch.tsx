import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, ArrowRight, ShieldCheck, Flame, ClipboardList,
  AlertTriangle, ScrollText, Lightbulb, KeySquare, Bot,
  HardHat, Users, Siren, Map, Accessibility, Scale, Camera,
  ShieldAlert, ThermometerSun, Shield, Plus, Zap, CheckCircle, 
  MessageSquare, PieChart, Lock, Droplets, Volume2, Beaker, 
  ArrowUp, Truck, Timer, FileText
} from 'lucide-react';

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
interface GlobalSearchProps { onClose: () => void; }

// ─── Módulos ──────────────────────────────────────────────────────────────────
const MODULES = [
  { nav: '/ai-advisor',             icon: <Bot size={17}/>,              label: 'Asesor IA',                   sub: 'Consultas de Seguridad', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  { nav: '/ats',                    icon: <ShieldCheck size={17}/>,     label: 'ATS',                         sub: 'Análisis Trabajo Seguro', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { nav: '/audit',                  icon: <ClipboardList size={17}/>,   label: 'Auditorías',                  sub: 'Control Interno y EHS', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { nav: '/ai-camera-manager',      icon: <Camera size={17}/>,           label: 'Cámara IA',                   sub: 'Detección EPP', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  { nav: '/capa',                   icon: <CheckCircle size={17}/>,      label: 'CAPA',                        sub: 'Acciones Correctivas', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { nav: '/training-management',    icon: <Users size={17}/>,            label: 'Capacitar',                   sub: 'Planillas y Asistencia', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { nav: '/fire-load',              icon: <Flame size={17}/>,            label: 'Carga Fuego',                 sub: 'Dec. 351/79', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { nav: '/toolbox-talk',           icon: <MessageSquare size={17}/>,    label: 'Charlas 5 Min',               sub: 'Registro de Capacitación Diaria', color: '#0052CC', bg: 'rgba(0,82,204,0.1)' },
  { nav: '/checklists',             icon: <ClipboardList size={17}/>,    label: 'Checklists',                  sub: 'Herramientas y Equipos', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  { nav: '/ppe-tracker',            icon: <HardHat size={17}/>,          label: 'Control EPP',                 sub: 'Vencimientos', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  { nav: '/ergonomics',             icon: <Accessibility size={17}/>,    label: 'Ergonomía',                   sub: 'Res. SRT 886', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { nav: '/confined-space',         icon: <ShieldAlert size={17}/>,      label: 'Espacios Confinados',         sub: 'Permisos y Control', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { nav: '/thermal-stress',         icon: <ThermometerSun size={17}/>,   label: 'Estrés Térmico',              sub: 'Carga Térmica', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { nav: '/extinguisher-ai',        icon: <Flame size={17}/>,            label: 'Extintores IA',               sub: 'Reconocimiento', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  { nav: '/lighting',               icon: <Lightbulb size={17}/>,        label: 'Iluminación',                 sub: 'Mediciones', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  { nav: '/reports',                icon: <ScrollText size={17}/>,       label: 'Informes',                    sub: 'Técnicos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  { nav: '/accident-investigation', icon: <Siren size={17}/>,            label: 'Investigación',               sub: 'Accidentes / Árbol', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { nav: '/safety-kpis',            icon: <PieChart size={17}/>,         label: 'KPIs Seguridad',              sub: 'Índices de Siniestralidad', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { nav: '/legislation',            icon: <Scale size={17}/>,            label: 'Legislación',                 sub: 'Biblioteca Legal', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { nav: '/loto',                   icon: <Lock size={17}/>,             label: 'LOTO',                        sub: 'Bloqueo y Etiquetado', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  { nav: '/risk-maps-history',      icon: <Map size={17}/>,              label: 'Mapas',                       sub: 'Croquis de Riesgos', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { nav: '/extintores',             icon: <Flame size={17}/>,            label: 'Matafuegos',                  sub: 'Control y Vencimientos', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  { nav: '/environmental',          icon: <Droplets size={17}/>,         label: 'Medio Ambiente',              sub: 'Monitoreo y Control', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  { nav: '/work-permit',            icon: <KeySquare size={17}/>,        label: 'Permisos',                    sub: 'Tareas Críticas', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  { nav: '/ai-general-camera-manager', icon: <ShieldAlert size={17}/>,   label: 'Riesgos IA',                  sub: 'Análisis de Entorno', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
  { nav: '/noise-assessment',       icon: <Volume2 size={17}/>,          label: 'Ruido',                       sub: 'Evaluación de Niveles Sonoros', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { nav: '/chemical-safety',        icon: <Beaker size={17}/>,           label: 'Seguridad Química',           sub: 'Gestión de Sustancias y SGA', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  { nav: '/drills',                 icon: <Siren size={17}/>,            label: 'Simulacros',                  sub: 'Actas de Evacuación', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { nav: '/stop-cards',             icon: <AlertTriangle size={17}/>,    label: 'Tarjetas STOP',               sub: 'Observaciones', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { nav: '/working-at-height',      icon: <ArrowUp size={17}/>,          label: 'Trabajo en Altura',           sub: 'Permisos y EPP Crítico', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { nav: '/lifting-form',           icon: <Truck size={17}/>,            label: 'Izaje y Grúas',               sub: 'Plan de Izaje Crítico', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { nav: '/fleet-form',             icon: <Truck size={17}/>,            label: 'Flota y Vehículos',           sub: 'Inspección Pre-Operacional', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  { nav: '/evacuation-history',     icon: <Timer size={17}/>,            label: 'Simulador de Evacuación',     sub: 'Cálculo de Tiempos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  { nav: '/legajos',                icon: <FileText size={17}/>,         label: 'Legajos Técnicos',            sub: 'Decreto 351/79', color: '#eab308', bg: 'rgba(234,179,8,0.1)' }
];

// ─── Acciones Rápidas ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { nav: '/ats',         label: 'Nuevo ATS',               color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <Plus size={16}/> },
  { nav: '/work-permit', label: 'Nuevo Permiso de Trabajo', color: '#2563eb', bg: 'rgba(37,99,235,0.12)',  icon: <Plus size={16}/> },
  { nav: '/fire-load',   label: 'Nueva Carga de Fuego',    color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: <Plus size={16}/> },
  { nav: '/drills/new',      label: 'Nuevo Simulacro',         color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <Plus size={16}/> },
  { nav: '/stop-cards/new',  label: 'Nueva Tarjeta STOP',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <Plus size={16}/> },
  { nav: '/ai-advisor',  label: 'Consultar Asesor IA',     color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: <Zap size={16}/> },
];

// ─── Fuentes de Historial ─────────────────────────────────────────────────────
const SOURCES = [
  { key:'ats_history',            label:'ATS',          color:'#10b981', bg:'rgba(16,185,129,0.1)',  icon:<ShieldCheck size={15}/>,    nav:'/ats',          titleField:'empresa', subtitleField:'obra',    dateField:'fecha' },
  { key:'fireload_history',       label:'Carga Fuego',  color:'#f97316', bg:'rgba(249,115,22,0.1)',  icon:<Flame size={15}/>,          nav:'/fire-load',    titleField:'empresa', subtitleField:'sector',  dateField:'createdAt' },
  { key:'tool_checklists_history', label:'Checklist',   color:'#14b8a6', bg:'rgba(20,184,166,0.1)', icon:<ClipboardList size={15}/>,  nav:'/checklists',   titleField:'equipo',  subtitleField:'empresa', dateField:'fecha' },
  { key:'lighting_history',       label:'Iluminación',  color:'#eab308', bg:'rgba(234,179,8,0.1)',   icon:<Lightbulb size={15}/>,      nav:'/lighting-history',     titleField:'empresa', subtitleField:'sector',  dateField:'date' },
  { key:'work_permits_history',   label:'Permiso',      color:'#2563eb', bg:'rgba(37,99,235,0.1)',   icon:<KeySquare size={15}/>,      nav:'/work-permit-history',  titleField:'empresa', subtitleField:'tarea',   dateField:'createdAt' },
  { key:'training_history',       label:'Capacitación', color:'#3b82f6', bg:'rgba(59,130,246,0.1)',  icon:<Users size={15}/>,          nav:'/training-history',     titleField:'tema',    subtitleField:'empresa', dateField:'fecha' },
  { key:'reports_history',        label:'Informe',      color:'#ec4899', bg:'rgba(236,72,153,0.1)',  icon:<ScrollText size={15}/>,     nav:'/history',              titleField:'title',   subtitleField:'company', dateField:'createdAt' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function GlobalSearch({ onClose }: GlobalSearchProps): React.ReactElement {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CmdItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Build search results ─────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); setActiveIdx(0); return; }
    
    const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const q = normalizeText(query);
    const found: CmdItem[] = [];

    MODULES.forEach(mod => {
      if (normalizeText(`${mod.label} ${mod.sub}`).includes(q)) {
        found.push({ key:`m-${mod.nav}`, id:'nav', nav:mod.nav, color:mod.color, bg:mod.bg, icon:mod.icon, label:'Módulo', title:mod.label, subtitle:mod.sub, date:null, isModule:true });
      }
    });

    SOURCES.forEach(src => {
      try {
        const items: any[] = JSON.parse(localStorage.getItem(src.key) || '[]');
        items.forEach(item => {
          const title = item[src.titleField] || '';
          const subtitle = src.subtitleField ? (item[src.subtitleField] || '') : '';
          if (normalizeText(`${title} ${subtitle}`).includes(q)) {
            found.push({ key:`h-${src.key}-${item.id||item.fecha}`, id:item.id||item.fecha, nav:src.nav, color:src.color, bg:src.bg, icon:src.icon, label:src.label, title:title||'—', subtitle, date:item[src.dateField], isModule:false });
          }
        });
      } catch { /* skip malformed */ }
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
  useEffect(() => { itemRefs.current[activeIdx]?.scrollIntoView({ block: 'nearest' }); }, [activeIdx]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const totalItems = query.length < 2 ? QUICK_ACTIONS.length : results.length;
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => (i + 1) % totalItems); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => (i - 1 + totalItems) % totalItems); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const nav = query.length < 2 ? QUICK_ACTIONS[activeIdx]?.nav : results[activeIdx]?.nav;
      if (nav) { navigate(nav); onClose(); }
    }
  }, [query, results, activeIdx, totalItems, navigate, onClose]);

  const go = (nav: string) => { navigate(nav); onClose(); };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'max(3.5rem, 8vh) 1rem 1rem', overflowY:'auto' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width:'100%', maxWidth:'620px', borderRadius:'24px', overflow:'hidden', boxShadow:'0 40px 120px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)', background:'var(--glass-thick, rgba(255,255,255,0.92))', backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)', animation:'cmdIn 0.2s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* ── Input ─────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.85rem', padding:'1.1rem 1.4rem', borderBottom:'1px solid var(--glass-border)' }}>
          <Search size={22} strokeWidth={2.5} color="var(--color-primary)" style={{ flexShrink:0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar módulo, registro o acción…"
            aria-label="Buscar módulo, registro o acción"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:'1.05rem', color:'var(--color-text)', fontWeight:600, fontFamily:'inherit', minWidth:0 }}
          />
          {query ? (
            <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)', display:'flex', padding:'0.25rem', borderRadius:'6px', flexShrink:0 }}>
              <X size={18} />
            </button>
          ) : (
            <kbd style={kbdStyle}>ESC</kbd>
          )}
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div style={{ maxHeight:'min(460px, 60vh)', overflowY:'auto', overscrollBehavior:'contain' }}>

          {/* Empty state → Quick Actions + Module Grid */}
          {query.length < 2 && (
            <div>
              <SectionLabel text="⚡ Acciones Rápidas" />
              {QUICK_ACTIONS.map((qa, i) => (
                <div
                  key={qa.label}
                  ref={el => { itemRefs.current[i] = el; }}
                  onClick={() => go(qa.nav)}
                  onMouseEnter={() => setActiveIdx(i)}
                  style={{ display:'flex', alignItems:'center', gap:'0.9rem', padding:'0.78rem 1.4rem', cursor:'pointer', background: activeIdx===i ? 'var(--color-surface-hover)' : 'transparent', transition:'background 0.1s', borderBottom:'1px solid var(--glass-border-subtle)' }}
                >
                  <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:qa.bg, color:qa.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {qa.icon}
                  </div>
                  <span style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--color-text)', flex:1 }}>{qa.label}</span>
                  {activeIdx===i && <ArrowRight size={16} color="var(--color-text-muted)" />}
                </div>
              ))}

              <SectionLabel text="📂 Módulos" />
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px, 1fr))', gap:'0.5rem', padding:'0.75rem 1.4rem 1.1rem' }}>
                {MODULES.slice(0, 9).map(mod => (
                  <button
                    key={mod.nav}
                    onClick={() => go(mod.nav)}
                    style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.6rem 0.85rem', background:'var(--color-background)', border:'1px solid var(--glass-border-subtle)', borderRadius:'12px', cursor:'pointer', transition:'all 0.15s', textAlign:'left', color:'var(--color-text)' }}
                    onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = mod.color; (e.currentTarget as HTMLButtonElement).style.background = mod.bg; }}
                    onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--glass-border-subtle)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-background)'; }}
                  >
                    <span style={{ color:mod.color, flexShrink:0 }}>{mod.icon}</span>
                    <span style={{ fontSize:'0.77rem', fontWeight:700, lineHeight:1.3 }}>{mod.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {query.length >= 2 && results.length === 0 && (
            <div style={{ padding:'2.5rem', textAlign:'center', color:'var(--color-text-muted)' }}>
              <Search size={42} strokeWidth={1} style={{ opacity:0.15, display:'block', margin:'0 auto 0.75rem' }} />
              <p style={{ margin:0, fontWeight:700, fontSize:'0.95rem' }}>Sin resultados para "{query}"</p>
              <p style={{ margin:'0.4rem 0 0', fontSize:'0.8rem', opacity:0.6 }}>Probá con otro término</p>
            </div>
          )}

          {query.length >= 2 && results.length > 0 && (() => {
            const mods = results.filter(r => r.isModule);
            const hist = results.filter(r => !r.isModule);
            let gi = 0;
            return (
              <>
                {mods.length > 0 && <><SectionLabel text={`Módulos (${mods.length})`} />{mods.map(item => { const idx=gi++; return <ResultRow key={item.key} item={item} idx={idx} activeIdx={activeIdx} onHover={setActiveIdx} onSelect={() => go(item.nav)} itemRefs={itemRefs}/>; })}</>}
                {hist.length > 0 && <><SectionLabel text={`Historial (${hist.length})`} />{hist.map(item => { const idx=gi++; return <ResultRow key={item.key} item={item} idx={idx} activeIdx={activeIdx} onHover={setActiveIdx} onSelect={() => go(item.nav)} itemRefs={itemRefs}/>; })}</>}
              </>
            );
          })()}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.65rem 1.4rem', borderTop:'1px solid var(--glass-border)', background:'var(--color-background)' }}>
          <div style={{ display:'flex', gap:'1.25rem', fontSize:'0.7rem', color:'var(--color-text-muted)', fontWeight:600 }}>
            <span><kbd style={kbdStyle}>↑↓</kbd> navegar</span>
            <span><kbd style={kbdStyle}>↵</kbd> abrir</span>
            <span><kbd style={kbdStyle}>ESC</kbd> cerrar</span>
          </div>
          <span style={{ fontSize:'0.65rem', fontWeight:800, color:'var(--color-text-muted)', opacity:0.45, letterSpacing:'0.05em' }}>Ctrl + K</span>
        </div>
      </div>

      <style>{`
        @keyframes cmdIn {
          from { opacity:0; transform: translateY(-16px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)     scale(1);    }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ padding:'0.5rem 1.4rem 0.2rem', fontSize:'0.68rem', fontWeight:800, color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', borderTop:'1px solid var(--glass-border-subtle)' }}>
      {text}
    </div>
  );
}

function ResultRow({ item, idx, activeIdx, onHover, onSelect, itemRefs }: {
  item: CmdItem; idx: number; activeIdx: number;
  onHover:(i:number)=>void; onSelect:()=>void;
  itemRefs: React.MutableRefObject<(HTMLDivElement|null)[]>;
}) {
  const active = idx === activeIdx;
  return (
    <div
      ref={el => { itemRefs.current[idx] = el; }}
      onClick={onSelect}
      onMouseEnter={() => onHover(idx)}
      style={{ display:'flex', alignItems:'center', gap:'0.9rem', padding:'0.75rem 1.4rem', cursor:'pointer', background: active ? 'var(--color-surface-hover)' : 'transparent', transition:'background 0.1s', borderBottom:'1px solid var(--glass-border-subtle)' }}
    >
      <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:item.bg, color:item.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {item.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:'0.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--color-text)' }}>{item.title}</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginTop:'0.12rem' }}>
          <span style={{ background:item.bg, color:item.color, padding:'0.05rem 0.42rem', borderRadius:'20px', fontSize:'0.62rem', fontWeight:800, flexShrink:0 }}>{item.label}</span>
          {item.subtitle && <span style={{ fontSize:'0.73rem', color:'var(--color-text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.subtitle}</span>}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexShrink:0 }}>
        {item.date && <span style={{ fontSize:'0.68rem', color:'var(--color-text-muted)' }}>{new Date(item.date).toLocaleDateString('es-AR')}</span>}
        {active && <ArrowRight size={16} color="var(--color-text-muted)" />}
      </div>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  background:'var(--color-surface)', border:'1px solid var(--color-border)',
  borderRadius:'5px', padding:'0.1rem 0.38rem', fontSize:'0.68rem',
  fontWeight:800, fontFamily:'inherit', marginRight:'0.22rem',
};
