import React from 'react';
import { Trash2, Copy, Lock, Unlock, Settings } from 'lucide-react';

const ROW = { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' };
const LBL = { 
  fontSize: '0.68rem', 
  fontWeight: 800, 
  color: 'var(--color-text-muted)', 
  display: 'block', 
  marginBottom: '0.4rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em'
};

const BTN = (active: boolean, color = '#3b82f6') => ({
  padding: '6px 12px', 
  fontSize: '0.7rem', 
  fontWeight: 700, 
  borderRadius: 8,
  border: active ? `1.5px solid ${color}` : '1.5px solid var(--color-border)', 
  cursor: 'pointer',
  background: active ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` : 'var(--color-surface)',
  color: active ? '#fff' : 'var(--color-text)',
  boxShadow: active ? `0 2px 6px ${color}33` : 'none',
  transition: 'all 0.15s',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export interface MapElement {
  id?: string | number;
  type: string;
  strokeWidth?: number;
  opacity?: number;
  color?: string;
  fillColor?: string | null;
  lineStyle?: string;
  rotation?: number;
  locked?: boolean;
  [key: string]: any;
}

export interface MapPropertiesPanelProps {
  element: MapElement | null;
  onUpdate: (updates: Partial<MapElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function MapPropertiesPanel({ element, onUpdate, onDelete, onDuplicate }: MapPropertiesPanelProps) {
  if (!element) return (
    <div className="p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center min-h-[250px]">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-2xl animate-pulse">🗺️</div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Inspector de Objetos</p>
      <p className="text-[0.7rem] text-slate-400 max-w-[180px] leading-relaxed">Seleccioná un elemento en el mapa para editar sus propiedades</p>
    </div>
  );

  const canFill = ['rect', 'circle', 'filled_rect'].includes(element.type);
  const canRotate = ['icon', 'text'].includes(element.type);
  const sw = element.strokeWidth || 3;
  const op = element.opacity != null ? element.opacity : 1;

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <Settings size={14} className="text-indigo-500" />
        <span className="text-[0.7rem] font-black tracking-wider uppercase text-indigo-500">
          Propiedades ({element.type})
        </span>
      </div>

      {/* Color trazo */}
      {element.type !== 'text' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🎨 Color de Trazo</label>
          <div style={ROW}>
            <div style={{ position: 'relative', width: 44, height: 32, borderRadius: 8, overflow: 'hidden', border: '1.5px solid var(--color-border)' }}>
              <input 
                type="color" 
                value={element.color || '#374151'}
                onChange={(e) => onUpdate({ color: e.target.value })} 
                style={{ position: 'absolute', top: -5, left: -5, width: 54, height: 42, cursor: 'pointer', border: 'none', padding: 0 }}
              />
            </div>
            <span className="text-[0.7rem] font-bold text-slate-500">{element.color || '#374151'}</span>
          </div>
        </div>
      )}

      {/* Color texto */}
      {element.type === 'text' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🎨 Color de Texto</label>
          <div style={ROW}>
            <div style={{ position: 'relative', width: 44, height: 32, borderRadius: 8, overflow: 'hidden', border: '1.5px solid var(--color-border)' }}>
              <input 
                type="color" 
                value={element.color || '#0f172a'}
                onChange={(e) => onUpdate({ color: e.target.value })} 
                style={{ position: 'absolute', top: -5, left: -5, width: 54, height: 42, cursor: 'pointer', border: 'none', padding: 0 }}
              />
            </div>
            <span className="text-[0.7rem] font-bold text-slate-500">{element.color || '#0f172a'}</span>
          </div>
        </div>
      )}

      {/* Color relleno */}
      {canFill && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🧺 Color de Relleno</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Toggle custom checkbox */}
            <div 
              onClick={() => onUpdate({ fillColor: element.fillColor ? null : '#3b82f620' })}
              style={{
                width: 34, height: 18, borderRadius: 999,
                background: element.fillColor ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--color-border)',
                position: 'relative', transition: 'all 0.22s', cursor: 'pointer'
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: element.fillColor ? 18 : 2,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'all 0.22s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
              }} />
            </div>
            {element.fillColor && (
              <div style={{ position: 'relative', width: 44, height: 32, borderRadius: 8, overflow: 'hidden', border: '1.5px solid var(--color-border)' }}>
                <input 
                  type="color" 
                  value={element.fillColor?.slice(0, 7) || '#3b82f6'}
                  onChange={(e) => onUpdate({ fillColor: e.target.value + '40' })} 
                  style={{ position: 'absolute', top: -5, left: -5, width: 54, height: 42, cursor: 'pointer', border: 'none', padding: 0 }}
                />
              </div>
            )}
            <span className="text-[0.7rem] font-bold text-slate-500">{element.fillColor ? 'Con relleno' : 'Sin relleno'}</span>
          </div>
        </div>
      )}

      {/* Grosor línea */}
      {!['icon', 'text'].includes(element.type) && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>📏 Grosor de Línea</label>
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 5, 8].map((w) => (
              <button key={w} onClick={() => onUpdate({ strokeWidth: w })} style={BTN(sw === w)}>
                {w}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estilo línea */}
      {['line', 'rect', 'circle', 'arrow', 'polyline'].includes(element.type) && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>╌ Estilo de Línea</label>
          <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface)', borderRadius: 8, padding: 3 }}>
            <button key="solid" onClick={() => onUpdate({ lineStyle: 'solid' })} 
              style={{ flex: 1, padding: '4px 6px', border: 'none', cursor: 'pointer', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, transition: 'all 0.15s',
                background: element.lineStyle !== 'dashed' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                color: element.lineStyle !== 'dashed' ? '#fff' : 'var(--color-text-muted)' }}>Sólida</button>
            <button key="dashed" onClick={() => onUpdate({ lineStyle: 'dashed' })} 
              style={{ flex: 1, padding: '4px 6px', border: 'none', cursor: 'pointer', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, transition: 'all 0.15s',
                background: element.lineStyle === 'dashed' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                color: element.lineStyle === 'dashed' ? '#fff' : 'var(--color-text-muted)' }}>Punteada</button>
          </div>
        </div>
      )}

      {/* Opacidad */}
      <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
        <label style={LBL}>🌫️ Opacidad — {Math.round(op * 100)}%</label>
        <input 
          type="range" 
          min="0.1" 
          max="1" 
          step="0.05" 
          value={op}
          onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })} 
          style={{ width: '100%', accentColor: '#3b82f6', height: 4, cursor: 'pointer' }}
        />
      </div>

      {/* Rotación */}
      {canRotate && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🔄 Rotación — {element.rotation || 0}°</label>
          <div className="grid grid-cols-5 gap-1">
            {[-90, -45, 0, 45, 90].map((deg) => (
              <button key={deg} onClick={() => onUpdate({ rotation: (deg + 360) % 360 })} 
                style={BTN((element.rotation || 0) === (deg + 360) % 360 || (element.rotation || 0) === deg, '#6366f1')}>
                {deg}°
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Acciones principales */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={() => onUpdate({ locked: !element.locked })}
          style={{ ...BTN(element.locked || false, '#f59e0b'), width: '100%', padding: '8px' }}
        >
          {element.locked ? <><Unlock size={13} className="mr-1.5" /> Desbloquear</> : <><Lock size={13} className="mr-1.5" /> Bloquear posición</>}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onDuplicate}
            style={{ ...BTN(false), border: '1.5px solid var(--color-border)', padding: '8px' }}
          >
            <Copy size={13} className="mr-1.5" /> Duplicar
          </button>
          <button 
            onClick={onDelete}
            style={{ ...BTN(false, '#ef4444'), border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#ef4444', padding: '8px' }}
          >
            <Trash2 size={13} className="mr-1.5" /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}