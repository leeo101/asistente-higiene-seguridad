import React from 'react';
import { Trash2, Copy, Lock, Unlock, Settings, FlipHorizontal, FlipVertical, Ruler, ArrowUpDown, RotateCw } from 'lucide-react';

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
  flipX?: boolean;
  flipY?: boolean;
  width?: number;
  height?: number;
  steps?: number;
  direction?: 'UP' | 'DOWN';
  text?: string;
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

  const canFill = ['rect', 'circle', 'filled_rect', 'column', 'chair', 'table', 'sink', 'cabinet'].includes(element.type);
  const canRotate = ['icon', 'text', 'door', 'stairs', 'window', 'column', 'chair', 'table', 'sink', 'cabinet'].includes(element.type);
  const sw = element.strokeWidth || 3;
  const op = element.opacity != null ? element.opacity : 1;

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <Settings size={14} className="text-indigo-500" />
        <span className="text-[0.7rem] font-black tracking-wider uppercase text-indigo-500">
          Propiedades ({element.type.toUpperCase()})
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

      {/* Controles de Tamaño para Iconos / Loguitos de Seguridad */}
      {element.type === 'icon' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>📏 Tamaño del Loguito</label>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706', background: '#d9770615', padding: '2px 8px', borderRadius: 6 }}>
              {element.width || 22}px
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 mb-2.5">
            {[
              { label: 'Mini', sz: 16 },
              { label: 'Chico', sz: 20 },
              { label: 'Ideal', sz: 24 },
              { label: 'Medio', sz: 28 },
              { label: 'Grande', sz: 36 }
            ].map(({ label, sz }) => (
              <button
                key={sz}
                type="button"
                onClick={() => onUpdate({ width: sz, height: sz })}
                style={BTN((element.width || 22) === sz, '#d97706')}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="12"
            max="44"
            step="2"
            value={element.width || 22}
            onChange={(e) => {
              const sz = parseInt(e.target.value);
              onUpdate({ width: sz, height: sz });
            }}
            style={{ width: '100%', accentColor: '#d97706', height: 6, cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            <span>12px (Diminuto)</span>
            <span>22px (Recomendado)</span>
            <span>44px (Máx)</span>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ ...LBL, marginBottom: 0 }}>🔄 Rotación — {element.rotation || 0}°</label>
            <button 
              type="button" 
              onClick={() => onUpdate({ rotation: (((element.rotation || 0) + 90) % 360) })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', fontSize: '0.66rem', fontWeight: 800,
                borderRadius: 6, border: '1px solid #6366f1',
                background: '#6366f115', color: '#6366f1', cursor: 'pointer'
              }}
              title="Girar 90 grados en sentido horario"
            >
              <RotateCw size={11} /> +90°
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[0, 90, 180, 270].map((deg) => (
              <button key={deg} onClick={() => onUpdate({ rotation: deg })} 
                style={BTN((element.rotation || 0) === deg, '#6366f1')}>
                {deg}°
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controles para Puertas */}
      {element.type === 'door' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🚪 Apertura y Sentido de Giro</label>
          
          <div className="mb-2">
            <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
              Batiente (Hacia adentro / afuera):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                type="button"
                onClick={() => onUpdate({ flipY: false })} 
                style={BTN(!element.flipY, '#0284c7')}
                title="Apertura hacia el interior de la habitación"
              >
                Hacia Adentro
              </button>
              <button 
                type="button"
                onClick={() => onUpdate({ flipY: true })} 
                style={BTN(!!element.flipY, '#0284c7')}
                title="Apertura hacia el exterior (vía de escape / emergencia)"
              >
                Hacia Afuera
              </button>
            </div>
          </div>

          <div className="mb-2">
            <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
              Bisagra (Mano de apertura):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                type="button"
                onClick={() => onUpdate({ flipX: false })} 
                style={BTN(!element.flipX, '#0284c7')}
                title="Bisagra colocada en el poste izquierdo"
              >
                Bisagra Izq.
              </button>
              <button 
                type="button"
                onClick={() => onUpdate({ flipX: true })} 
                style={BTN(!!element.flipX, '#0284c7')}
                title="Bisagra colocada en el poste derecho"
              >
                Bisagra Der.
              </button>
            </div>
          </div>

          <label style={LBL}>Ancho de Hoja</label>
          <div className="grid grid-cols-4 gap-1">
            {[30, 40, 48, 60].map((w) => (
              <button key={w} onClick={() => onUpdate({ width: w, height: w })} style={BTN((element.width || 40) === w, '#0284c7')}>
                {(w / 40).toFixed(1)}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controles para Escaleras */}
      {element.type === 'stairs' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🪜 Sentido de Circulación</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button 
              onClick={() => onUpdate({ direction: 'UP' })} 
              style={BTN(element.direction !== 'DOWN', '#2563eb')}
            >
              ⬆️ SUBE
            </button>
            <button 
              onClick={() => onUpdate({ direction: 'DOWN' })} 
              style={BTN(element.direction === 'DOWN', '#2563eb')}
            >
              ⬇️ BAJA
            </button>
          </div>
          <label style={LBL}>Cantidad de Huellas (Peldaños)</label>
          <div className="grid grid-cols-5 gap-1">
            {[6, 8, 10, 12, 16].map((st) => (
              <button key={st} onClick={() => onUpdate({ steps: st })} style={BTN((element.steps || 8) === st, '#475569')}>
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controles para Cotas de Dimensión */}
      {element.type === 'dimension' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>📏 Texto de Cota</label>
          <input 
            type="text" 
            value={element.text || ''} 
            onChange={(e) => onUpdate({ text: e.target.value })} 
            placeholder="Ej: 3.50 m"
            className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
          />
        </div>
      )}

      {/* Controles de Dimensión para Rectángulo */}
      {element.type === 'rect' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>📐 Dimensiones del Sector</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[0.68rem] text-slate-500 font-bold block mb-1">Ancho (m)</span>
              <input 
                type="number" 
                step="0.1" 
                min="0.5"
                value={((Math.abs(element.endX - element.startX)) / 40).toFixed(1)} 
                onChange={(e) => {
                  const valM = parseFloat(e.target.value) || 1;
                  const newWidthPx = valM * 40;
                  onUpdate({ endX: element.startX + (element.endX >= element.startX ? newWidthPx : -newWidthPx) });
                }} 
                className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              />
            </div>
            <div>
              <span className="text-[0.68rem] text-slate-500 font-bold block mb-1">Largo (m)</span>
              <input 
                type="number" 
                step="0.1" 
                min="0.5"
                value={((Math.abs(element.endY - element.startY)) / 40).toFixed(1)} 
                onChange={(e) => {
                  const valM = parseFloat(e.target.value) || 1;
                  const newHeightPx = valM * 40;
                  onUpdate({ endY: element.startY + (element.endY >= element.startY ? newHeightPx : -newHeightPx) });
                }} 
                className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              />
            </div>
          </div>
        </div>
      )}

            {/* Nombre / Etiqueta Interior para Mobiliario */}
      {['chair', 'table', 'sink', 'cabinet'].includes(element.type) && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🏷️ Nombre / Etiqueta Interior</label>
          <input
            type="text"
            value={element.label ?? (element.type === 'chair' ? 'Silla' : element.type === 'table' ? 'Mesa' : element.type === 'sink' ? 'Bacha' : 'Archivador')}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Texto visible en el interior"
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 6,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              marginTop: 4
            }}
          />
        </div>
      )}

      {/* Controles para Bacha */}
      {element.type === 'sink' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🚰 Tamaño de Bacha</label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Compacta', w: 30, h: 24 },
              { label: 'Estándar', w: 36, h: 30 },
              { label: 'Doble/Cocina', w: 54, h: 32 }
            ].map(({ label, w, h }) => (
              <button 
                key={label} 
                type="button"
                onClick={() => onUpdate({ width: w, height: h })} 
                style={BTN((element.width || 36) === w, '#0284c7')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controles para Archivador / Mueble de Papeles */}
      {element.type === 'cabinet' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🗄️ Tipo de Archivador / Mueble</label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Fichero 2C', w: 36, h: 24 },
              { label: 'Archivador 4C', w: 44, h: 28 },
              { label: 'Armario Papeles', w: 60, h: 30 }
            ].map(({ label, w, h }) => (
              <button 
                key={label} 
                type="button"
                onClick={() => onUpdate({ width: w, height: h })} 
                style={BTN((element.width || 44) === w, '#475569')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controles para Sillas */}
      {element.type === 'chair' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🪑 Tamaño de Silla</label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Compacta', sz: 24 },
              { label: 'Estándar', sz: 28 },
              { label: 'Ejecutiva', sz: 34 }
            ].map(({ label, sz }) => (
              <button 
                key={sz} 
                onClick={() => onUpdate({ width: sz, height: sz })} 
                style={BTN((element.width || 28) === sz, '#475569')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controles para Mesas */}
      {element.type === 'table' && (
        <div style={{ background: 'var(--color-background)', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <label style={LBL}>🪵 Configuración de Mesa</label>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <button 
              type="button"
              onClick={() => onUpdate({ tableShape: 'rect', width: 70, height: 40 })} 
              style={BTN(element.tableShape !== 'round', '#475569')}
            >
              Rectangular
            </button>
            <button 
              type="button"
              onClick={() => onUpdate({ tableShape: 'round', width: 48, height: 48 })} 
              style={BTN(element.tableShape === 'round', '#475569')}
            >
              Redonda
            </button>
          </div>
          <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
            Dimensiones:
          </span>
          <div className="grid grid-cols-3 gap-1">
            {element.tableShape === 'round' ? (
              [
                { label: '1.0m', w: 40, h: 40 },
                { label: '1.2m', w: 48, h: 48 },
                { label: '1.5m', w: 60, h: 60 }
              ].map(({ label, w, h }) => (
                <button key={w} onClick={() => onUpdate({ width: w, height: h })} style={BTN((element.width || 48) === w, '#475569')}>
                  {label}
                </button>
              ))
            ) : (
              [
                { label: '1.2x0.8m', w: 50, h: 32 },
                { label: '1.8x1.0m', w: 70, h: 40 },
                { label: '2.4x1.2m', w: 96, h: 48 }
              ].map(({ label, w, h }) => (
                <button key={w} onClick={() => onUpdate({ width: w, height: h })} style={BTN((element.width || 70) === w, '#475569')}>
                  {label}
                </button>
              ))
            )}
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