import React from 'react';

const TOOLS = [
    { id: 'select', icon: '↖', label: 'Selección (S)', desc: 'Selecciona, mueve y edita elementos. Hacé clic en el canvas para colocar íconos. Doble clic para editar textos.' },
    { id: 'pan', icon: '✋', label: 'Paneo (H)', desc: 'Desplaza la vista sin mover elementos. Como "scroll" libre. También funciona con la rueda del mouse.' },
    { id: 'LINE', icon: '╱', label: 'Línea / Pared', desc: 'Dibujá paredes, bordes o divisiones. Arrastrá para trazar. Shift fuerza ángulos de 0°/90°.' },
    { id: 'RECTANGLE', icon: '▭', label: 'Rectángulo / Salón', desc: 'Delimitá salones, oficinas o zonas. Arrastrá en diagonal para definir el área.' },
    { id: 'CIRCLE', icon: '○', label: 'Círculo / Elipse', desc: 'Marcá áreas circulares (tanques, maquinarias redondas). Arrastrá desde el centro.' },
    { id: 'POLYLINE', icon: '⟍', label: 'Polilínea', desc: 'Trazá rutas con múltiples segmentos. Clic para agregar nodos, doble clic para terminar.' },
    { id: 'ARROW_LINE', icon: '→', label: 'Ruta de Escape / Flecha', desc: 'Indicá la dirección de evacuación. Arrastrá para definir dirección.' },
    { id: 'TEXT_LABEL', icon: 'T', label: 'Etiqueta de Texto', desc: 'Añadí notas o nombres de zonas. Hacé clic en el canvas para insertar. Doble clic para editar el texto.' },
];

const SHORTCUTS = [
    { key: 'S', desc: 'Herramienta Seleccionar' },
    { key: 'H', desc: 'Herramienta Paneo' },
    { key: 'Ctrl+Z', desc: 'Deshacer' },
    { key: 'Ctrl+Y', desc: 'Rehacer' },
    { key: 'Shift', desc: 'Modo Ortogonal (líneas rectas)' },
    { key: 'R', desc: 'Rotar elemento seleccionado 45°' },
    { key: 'Supr / Backspace', desc: 'Eliminar elemento seleccionado' },
    { key: 'Rueda del mouse', desc: 'Zoom en el cursor' },
    { key: '+/-', desc: 'Zoom in / Zoom out' },
];

const ICONS_GUIDE = [
    { color: '#dc2626', label: 'Rojo — Equipos contra incendio', items: ['Extintor ABC', 'Hidrante/BIE', 'Pulsador de alarma', 'Prohibido el acceso'] },
    { color: '#eab308', label: 'Amarillo — Riesgos y advertencias', items: ['Riesgo eléctrico', 'Riesgo químico', 'Riesgo biológico', 'Piso resbaladizo', 'EPP obligatorio', 'Tránsito de autoelevadores'] },
    { color: '#16a34a', label: 'Verde — Seguridad y evacuación', items: ['Salida de emergencia', 'Punto de encuentro', 'Primeros auxilios', 'Ducha de emergencia', 'Lavaojos'] },
    { color: '#dc2626', label: 'Rojo — Indicadores de posición', items: ['Usted está aquí'] },
];

const WORKFLOW = [
    '1. Subí un plano o foto del sector como fondo (botón "Subir Plano Base")',
    '2. Usá la herramienta Rectángulo para marcar los salones y zonas',
    '3. Agrega líneas para paredes divisorias',
    '4. Colocá los íconos ISO arrastrándolos del panel izquierdo al canvas',
    '5. Usá flechas (Ruta de Escape) para indicar la dirección de evacuación',
    '6. Agregá etiquetas de texto para nombrar sectores',
    '7. Revisá las capas — podés ocultar capas para validar cada sección',
    '8. Guardá y compartí el mapa desde los botones flotantes',
];

export default function MapHelpPanel() {
    return (
        <div style={{ padding: '0.75rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>

            <div>
                <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Herramientas de Dibujo</h4>
                {TOOLS.map(t => (
                    <div key={t.id} style={{ marginBottom: '0.75rem', padding: '0.6rem', background: 'var(--color-background)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{t.icon}</span>
                            <strong style={{ fontSize: '0.75rem' }}>{t.label}</strong>
                        </div>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{t.desc}</p>
                    </div>
                ))}
            </div>

            <div>
                <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Atajos de Teclado</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        {SHORTCUTS.map(s => (
                            <tr key={s.key}>
                                <td style={{ padding: '4px 6px', fontFamily: 'monospace', background: 'var(--color-background)', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, border: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{s.key}</td>
                                <td style={{ padding: '4px 8px', color: 'var(--color-text-muted)' }}>{s.desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Referencia de Íconos ISO</h4>
                {ICONS_GUIDE.map(g => (
                    <div key={g.label} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                            <div style={{ width: 12, height: 12, borderRadius: 2, background: g.color, flexShrink: 0 }} />
                            <strong style={{ color: g.color }}>{g.label}</strong>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            {g.items.map(it => <li key={it}>{it}</li>)}
                        </ul>
                    </div>
                ))}
            </div>

            <div>
                <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Flujo de Trabajo Recomendado</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {WORKFLOW.map((step, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.6rem', background: 'var(--color-background)', borderRadius: 6, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                            {step}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                💡 <strong>Tip:</strong> Usá el <strong>Modo Blueprint</strong> para una presentación oscura al estilo de planos técnicos. Activalo en "Ajustes PRO" en el panel de íconos.
            </div>
        </div>
    );
}
