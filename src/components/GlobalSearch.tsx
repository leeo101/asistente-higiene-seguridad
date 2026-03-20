import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import {
  Search, X, ShieldCheck, Flame, ClipboardList,
  TriangleAlert, ScrollText, Lightbulb, KeySquare,
  FileText, Bot, HardHat, Users, Siren, Map,
  Accessibility, Gavel, Camera, ShieldAlert, ThermometerSun, Shield, LucideIcon
} from 'lucide-react';

// Tipos
interface Module {
  nav: string;
  icon: React.ReactElement;
  label: string;
  sub: string;
  color: string;
  bg: string;
}

interface HistorySource {
  key: string;
  label: string;
  color: string;
  bg: string;
  icon: React.ReactElement;
  nav: string;
  titleField: string;
  subtitleField: string | null;
  dateField: string;
}

interface SearchResult extends Partial<HistorySource> {
  key: string;
  id: string | number;
  title: string;
  subtitle: string;
  date: string | null;
  isModule: boolean;
}

interface GlobalSearchProps {
  onClose: () => void;
}

const MODULES: Module[] = [
  { nav: '/training-management', icon: <Users size={15} />, label: 'Módulo', sub: 'Capacitar / Planillas y Asistencia', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { nav: '/accident-investigation', icon: <Siren size={15} />, label: 'Módulo', sub: 'Investigación Accidentes / Árbol', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { nav: '/ats', icon: <ShieldCheck size={15} />, label: 'Módulo', sub: 'ATS / Análisis Trabajo Seguro', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { nav: '/fire-load', icon: <Flame size={15} />, label: 'Módulo', sub: 'Carga de Fuego / Dec. 351', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { nav: '/extinguishers', icon: <Flame size={15} />, label: 'Módulo', sub: 'Matafuegos / Control y Vencimientos', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  { nav: '/thermal-stress', icon: <ThermometerSun size={15} />, label: 'Módulo', sub: 'Estrés Térmico / TGBH', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { nav: '/drills', icon: <Siren size={15} />, label: 'Módulo', sub: 'Simulacros / Evacuación', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { nav: '/risk-maps', icon: <Map size={15} />, label: 'Módulo', sub: 'Mapas de Riesgo / Croquis', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { nav: '/ergonomics', icon: <Accessibility size={15} />, label: 'Módulo', sub: 'Ergonomía / Res. SRT 886', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { nav: '/reports', icon: <ScrollText size={15} />, label: 'Módulo', sub: 'Informes Técnicos', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  { nav: '/legislation', icon: <Gavel size={15} />, label: 'Módulo', sub: 'Legislación / Biblioteca Legal', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { nav: '/lighting', icon: <Lightbulb size={15} />, label: 'Módulo', sub: 'Iluminación / Mediciones', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  { nav: '/ai-camera', icon: <Camera size={15} />, label: 'Módulo', sub: 'Cámara IA / Detección EPP', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  { nav: '/ai-general-camera', icon: <ShieldAlert size={15} />, label: 'Módulo', sub: 'Riesgos IA / Análisis de Entorno', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
  { nav: '/ai-advisor', icon: <Bot size={15} />, label: 'Módulo', sub: 'Asesor IA / Consultas', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  { nav: '/checklists', icon: <ClipboardList size={15} />, label: 'Módulo', sub: 'Checklists / Herramientas', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  { nav: '/work-permit', icon: <KeySquare size={15} />, label: 'Módulo', sub: 'Permisos de Trabajo', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  { nav: '/risk', icon: <Shield size={15} />, label: 'Módulo', sub: 'Evaluación de Riesgo / IPER', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { nav: '/ppe-tracker', icon: <HardHat size={15} />, label: 'Módulo', sub: 'Control EPP / Entregas', color: '#10b981', bg: 'rgba(16,185,129,0.08)' }
];

const SOURCES: HistorySource[] = [
  {
    key: 'ats_history', label: 'Historial', color: '#10b981', bg: 'rgba(16,185,129,0.1)',
    icon: <ShieldCheck size={15} />, nav: '/ats-history',
    titleField: 'empresa', subtitleField: 'obra', dateField: 'fecha'
  },
  {
    key: 'fireload_history', label: 'Historial', color: '#f97316', bg: 'rgba(249,115,22,0.1)',
    icon: <Flame size={15} />, nav: '/fire-load-history',
    titleField: 'empresa', subtitleField: 'sector', dateField: 'createdAt'
  },
  {
    key: 'inspections_history', label: 'Historial', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',
    icon: <ClipboardList size={15} />, nav: '/history',
    titleField: 'name', subtitleField: 'location', dateField: 'date'
  },
  {
    key: 'risk_matrix_history', label: 'Historial', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',
    icon: <TriangleAlert size={15} />, nav: '/history',
    titleField: 'name', subtitleField: 'location', dateField: 'createdAt'
  },
  {
    key: 'reports_history', label: 'Historial', color: '#ec4899', bg: 'rgba(236,72,153,0.1)',
    icon: <ScrollText size={15} />, nav: '/history',
    titleField: 'title', subtitleField: 'company', dateField: 'createdAt'
  },
  {
    key: 'tool_checklists_history', label: 'Historial', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)',
    icon: <ClipboardList size={15} />, nav: '/checklists-history',
    titleField: 'equipo', subtitleField: 'empresa', dateField: 'fecha'
  },
  {
    key: 'lighting_history', label: 'Historial', color: '#eab308', bg: 'rgba(234,179,8,0.1)',
    icon: <Lightbulb size={15} />, nav: '/lighting-history',
    titleField: 'empresa', subtitleField: 'sector', dateField: 'date'
  },
  {
    key: 'work_permits_history', label: 'Historial', color: '#2563eb', bg: 'rgba(37,99,235,0.1)',
    icon: <KeySquare size={15} />, nav: '/work-permit-history',
    titleField: 'empresa', subtitleField: 'tarea', dateField: 'createdAt'
  },
  {
    key: 'ai_advisor_history', label: 'Historial', color: '#a855f7', bg: 'rgba(168,85,247,0.1)',
    icon: <Bot size={15} />, nav: '/ai-advisor',
    titleField: 'task', subtitleField: null, dateField: 'date'
  },
];

export default function GlobalSearch({ onClose }: GlobalSearchProps): React.ReactElement {
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const found: SearchResult[] = [];

    // Search in App Modules
    MODULES.forEach(mod => {
      const combined = `${mod.label} ${mod.sub}`.toLowerCase();
      if (combined.includes(q)) {
        found.push({
          key: `mod-${mod.nav}`,
          label: mod.label,
          bg: mod.bg,
          color: mod.color,
          icon: mod.icon,
          nav: mod.nav,
          id: 'nav',
          title: mod.sub.split('/')[0].trim(),
          subtitle: mod.sub.includes('/') ? mod.sub.split('/')[1].trim() : '',
          date: null,
          isModule: true
        });
      }
    });

    // Search in History Sources
    SOURCES.forEach(src => {
      try {
        const items = JSON.parse(localStorage.getItem(src.key) || '[]');
        items.forEach(item => {
          const title = item[src.titleField] || '';
          const subtitle = src.subtitleField ? (item[src.subtitleField] || '') : '';
          const combined = `${title} ${subtitle}`.toLowerCase();
          if (combined.includes(q)) {
            found.push({
              ...src,
              id: item.id || item.date,
              title: title || '—',
              subtitle,
              date: item[src.dateField],
              isModule: false
            } as SearchResult);
          }
        });
      } catch { /* skip malformed */ }
    });

    // Sort: Modules first, then History by Date Descending
    found.sort((a, b) => {
      if (a.isModule && !b.isModule) return -1;
      if (!a.isModule && b.isModule) return 1;
      if (a.isModule && b.isModule) return 0;
      if (!a.isModule && !b.isModule && a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });
    setResults(found.slice(0, 15));
  }, [query]);

  const handleSelect = (item: SearchResult): void => {
    navigate(item.nav);
    onClose();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: 'max(4rem, 10vh) 0.75rem 1rem',
      animation: 'fadeIn 0.18s ease',
      overflowY: 'auto'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)', borderRadius: '20px',
          width: '100%', maxWidth: '580px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden'
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 1.2rem', borderBottom: '1px solid var(--color-border)' }}>
          <Search size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar en todos los módulos..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontSize: '1rem',
              color: 'var(--color-text)', fontWeight: 500,
              minWidth: 0
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.3rem', display: 'flex', flexShrink: 0 }}>
              <X size={18} />
            </button>
          )}
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, display: 'none' }} className="search-esc-btn">
            ESC
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 'min(420px, 55vh)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {query.length < 2 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
              Escribí al menos 2 caracteres para buscar...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Search size={36} style={{ opacity: 0.2, marginBottom: '0.8rem', display: 'block', margin: '0 auto 0.8rem' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Sin resultados para "{query}"</p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem' }}>Intentá con otro término</p>
            </div>
          ) : (
            <div>
              <div style={{ padding: '0.6rem 1.2rem 0.2rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((item, i) => (
                <div
                  key={`${item.key}-${item.id}-${i}`}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.8rem 1.2rem', cursor: 'pointer',
                    borderBottom: i < results.length - 1 ? '1px solid var(--color-border)' : 'none',
                    transition: 'background 0.12s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--color-background)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: item.bg, color: item.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.1rem' }}>
                      <span style={{ background: item.bg, color: item.color, padding: '0.05rem 0.45rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.62rem' }}>
                        {item.label}
                      </span>
                      {item.subtitle && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {item.date ? new Date(item.date).toLocaleDateString('es-AR') : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="hidden sm:flex" style={{ padding: '0.6rem 1.2rem', borderTop: '1px solid var(--color-border)', gap: '1rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
          <span>↵ para ir al módulo</span>
          <span>ESC para cerrar</span>
        </div>
      </div>
    </div>
  );
}
