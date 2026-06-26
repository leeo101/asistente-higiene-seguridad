import React from 'react';
import { Trash2, Copy, Lock, Unlock } from 'lucide-react';

const ROW = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' };
const LBL = { fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' };
const BTN = (active, color = 'var(--color-primary)') => ({
  padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: 6,
  border: '1px solid var(--color-border)', cursor: 'pointer',
  background: active ? color : 'var(--color-surface)',
  color: active ? '#fff' : 'var(--color-text)'
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
    <div className="p-[1.5rem_1rem] text-center text-[var(--color-text-muted)] text-[0.8rem]">
            <div className="text-[2rem] mb-[0.5rem]">🖊️</div>
            Seleccioná un elemento para ver sus propiedades
        </div>);


  const canFill = ['rect', 'circle', 'filled_rect'].includes(element.type);
  const canRotate = ['icon', 'text'].includes(element.type);
  const sw = element.strokeWidth || 3;
  const op = element.opacity != null ? element.opacity : 1;

  return (
    <div className="p-[1rem] flex flex-col gap-[0]">
            <div className="text-[0.75rem] font-[800] text-[var(--color-primary)] uppercase mb-[1rem] border-bottom-[1px_solid_var(--color-border)] pb-[0.5rem]">
                Propiedades
            </div>

            {/* Color trazo */}
            {element.type !== 'text' &&
      <div className="mb-[0.75rem]">
                    <label style={LBL}>Color de Trazo</label>
                    <div style={ROW}>
                        <input type="color" value={element.color || '#374151'}
          onChange={(e) => onUpdate({ color: e.target.value })} className="w-[40] h-[32] rounded-[6] border-[1px_solid_var(--color-border)] cursor-pointer p-[2]" />
          
                        <span className="text-[0.7rem] text-[var(--color-text-muted)]">{element.color || '#374151'}</span>
                    </div>
                </div>
      }

            {/* Color texto */}
            {element.type === 'text' &&
      <div className="mb-[0.75rem]">
                    <label style={LBL}>Color de Texto</label>
                    <input type="color" value={element.color || '#0f172a'}
        onChange={(e) => onUpdate({ color: e.target.value })} className="w-[40] h-[32] rounded-[6] border-[1px_solid_var(--color-border)] cursor-pointer p-[2]" />
        
                </div>
      }

            {/* Color relleno */}
            {canFill &&
      <div className="mb-[0.75rem]">
                    <label style={LBL}>Color de Relleno</label>
                    <div style={ROW}>
                        <input type="checkbox" checked={!!element.fillColor}
          onChange={(e) => onUpdate({ fillColor: e.target.checked ? '#3b82f620' : null })} />
                        {element.fillColor &&
          <input type="color" value={element.fillColor?.slice(0, 7) || '#3b82f6'}
          onChange={(e) => onUpdate({ fillColor: e.target.value + '40' })} className="w-[40] h-[32] rounded-[6] border-[1px_solid_var(--color-border)] cursor-pointer p-[2]" />

          }
                        <span className="text-[0.7rem] text-[var(--color-text-muted)]">{element.fillColor ? 'Con relleno' : 'Sin relleno'}</span>
                    </div>
                </div>
      }

            {/* Grosor línea */}
            {!['icon', 'text'].includes(element.type) &&
      <div className="mb-[0.75rem]">
                    <label style={LBL}>Grosor de Línea</label>
                    <div className="flex gap-[4]">
                        {[1, 2, 3, 5, 8].map((w) =>
          <button key={w} onClick={() => onUpdate({ strokeWidth: w })} style={BTN(sw === w)}>
                                {w}px
                            </button>
          )}
                    </div>
                </div>
      }

            {/* Estilo línea */}
            {['line', 'rect', 'circle', 'arrow', 'polyline'].includes(element.type) &&
      <div className="mb-[0.75rem]">
                    <label style={LBL}>Estilo de Línea</label>
                    <div className="flex gap-[4]">
                        <button onClick={() => onUpdate({ lineStyle: 'solid' })} style={BTN(element.lineStyle !== 'dashed')}>Sólida</button>
                        <button onClick={() => onUpdate({ lineStyle: 'dashed' })} style={BTN(element.lineStyle === 'dashed')}>Punteada</button>
                    </div>
                </div>
      }

            {/* Opacidad */}
            <div className="mb-[0.75rem]">
                <label style={LBL}>Opacidad — {Math.round(op * 100)}%</label>
                <input type="range" min="0.1" max="1" step="0.05" value={op}
        onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })} className="w-[100%]" />
        
            </div>

            {/* Rotación */}
            {canRotate &&
      <div className="mb-[0.75rem]">
                    <label style={LBL}>Rotación — {element.rotation || 0}°</label>
                    <div className="flex gap-[4]">
                        {[-90, -45, 0, 45, 90].map((deg) =>
          <button key={deg} onClick={() => onUpdate({ rotation: (deg + 360) % 360 })} style={BTN((element.rotation || 0) === deg, '#6366f1')}>
                                {deg}°
                            </button>
          )}
                    </div>
                </div>
      }

            {/* Acciones */}
            <div className="border-top-[1px_solid_var(--color-border)] pt-[0.75rem] mt-[0.25rem] flex flex-col gap-[6]">
                <button onClick={() => onUpdate({ locked: !element.locked })}
        style={{ ...BTN(element.locked, '#f59e0b') }} className="flex items-center gap-[6] justify-center p-[8px]">
                    {element.locked ? <><Unlock size={14} /> Desbloquear</> : <><Lock size={14} /> Bloquear</>}
                </button>
                <button onClick={onDuplicate}
        style={{ ...BTN(false) }} className="flex items-center gap-[6] justify-center p-[8px]">
                    <Copy size={14} /> Duplicar
                </button>
                <button onClick={onDelete}
        style={{ ...BTN(false, '#ef4444') }} className="flex items-center gap-[6] justify-center p-[8px] bg-[#fef2f2] text-[#ef4444] border-color-[#fca5a5]">
                    <Trash2 size={14} /> Eliminar
                </button>
            </div>
        </div>);

}