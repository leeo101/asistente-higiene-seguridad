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

export default function MapPropertiesPanel({ element, onUpdate, onDelete, onDuplicate }) {
    if (!element) return (
        <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖊️</div>
            Seleccioná un elemento para ver sus propiedades
        </div>
    );

    const canFill = ['rect', 'circle', 'filled_rect'].includes(element.type);
    const canRotate = ['icon', 'text'].includes(element.type);
    const sw = element.strokeWidth || 3;
    const op = element.opacity != null ? element.opacity : 1;

    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                Propiedades
            </div>

            {/* Color trazo */}
            {element.type !== 'text' && (
                <div style={{ marginBottom: '0.75rem' }}>
                    <label style={LBL}>Color de Trazo</label>
                    <div style={ROW}>
                        <input type="color" value={element.color || '#374151'}
                            onChange={e => onUpdate({ color: e.target.value })}
                            style={{ width: 40, height: 32, borderRadius: 6, border: '1px solid var(--color-border)', cursor: 'pointer', padding: 2 }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{element.color || '#374151'}</span>
                    </div>
                </div>
            )}

            {/* Color texto */}
            {element.type === 'text' && (
                <div style={{ marginBottom: '0.75rem' }}>
                    <label style={LBL}>Color de Texto</label>
                    <input type="color" value={element.color || '#0f172a'}
                        onChange={e => onUpdate({ color: e.target.value })}
                        style={{ width: 40, height: 32, borderRadius: 6, border: '1px solid var(--color-border)', cursor: 'pointer', padding: 2 }} />
                </div>
            )}

            {/* Color relleno */}
            {canFill && (
                <div style={{ marginBottom: '0.75rem' }}>
                    <label style={LBL}>Color de Relleno</label>
                    <div style={ROW}>
                        <input type="checkbox" checked={!!element.fillColor}
                            onChange={e => onUpdate({ fillColor: e.target.checked ? '#3b82f620' : null })} />
                        {element.fillColor && (
                            <input type="color" value={element.fillColor?.slice(0, 7) || '#3b82f6'}
                                onChange={e => onUpdate({ fillColor: e.target.value + '40' })}
                                style={{ width: 40, height: 32, borderRadius: 6, border: '1px solid var(--color-border)', cursor: 'pointer', padding: 2 }} />
                        )}
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{element.fillColor ? 'Con relleno' : 'Sin relleno'}</span>
                    </div>
                </div>
            )}

            {/* Grosor línea */}
            {!['icon', 'text'].includes(element.type) && (
                <div style={{ marginBottom: '0.75rem' }}>
                    <label style={LBL}>Grosor de Línea</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 5, 8].map(w => (
                            <button key={w} onClick={() => onUpdate({ strokeWidth: w })} style={BTN(sw === w)}>
                                {w}px
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Estilo línea */}
            {['line', 'rect', 'circle', 'arrow', 'polyline'].includes(element.type) && (
                <div style={{ marginBottom: '0.75rem' }}>
                    <label style={LBL}>Estilo de Línea</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => onUpdate({ lineStyle: 'solid' })} style={BTN(element.lineStyle !== 'dashed')}>Sólida</button>
                        <button onClick={() => onUpdate({ lineStyle: 'dashed' })} style={BTN(element.lineStyle === 'dashed')}>Punteada</button>
                    </div>
                </div>
            )}

            {/* Opacidad */}
            <div style={{ marginBottom: '0.75rem' }}>
                <label style={LBL}>Opacidad — {Math.round(op * 100)}%</label>
                <input type="range" min="0.1" max="1" step="0.05" value={op}
                    onChange={e => onUpdate({ opacity: parseFloat(e.target.value) })}
                    style={{ width: '100%' }} />
            </div>

            {/* Rotación */}
            {canRotate && (
                <div style={{ marginBottom: '0.75rem' }}>
                    <label style={LBL}>Rotación — {element.rotation || 0}°</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[-90, -45, 0, 45, 90].map(deg => (
                            <button key={deg} onClick={() => onUpdate({ rotation: (deg + 360) % 360 })} style={BTN((element.rotation || 0) === deg, '#6366f1')}>
                                {deg}°
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Acciones */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => onUpdate({ locked: !element.locked })}
                    style={{ ...BTN(element.locked, '#f59e0b'), display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', padding: '8px' }}>
                    {element.locked ? <><Unlock size={14} /> Desbloquear</> : <><Lock size={14} /> Bloquear</>}
                </button>
                <button onClick={onDuplicate}
                    style={{ ...BTN(false), display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', padding: '8px' }}>
                    <Copy size={14} /> Duplicar
                </button>
                <button onClick={onDelete}
                    style={{ ...BTN(false, '#ef4444'), display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', padding: '8px', background: '#fef2f2', color: '#ef4444', borderColor: '#fca5a5' }}>
                    <Trash2 size={14} /> Eliminar
                </button>
            </div>
        </div>
    );
}
