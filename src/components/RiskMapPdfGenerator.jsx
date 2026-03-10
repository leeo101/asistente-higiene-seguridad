import React, { useRef } from 'react';
import { ArrowLeft, Printer, Map as MapIcon } from 'lucide-react';
import { SAFETY_ICONS } from '../data/mapIcons';

export default function RiskMapPdfGenerator({ mapData, onBack }) {
    const componentRef = useRef();

    const safeEmpresa = (mapData?.empresa || 'Empresa').replace(/\s+/g, '_');
    const safeFecha = mapData?.fecha || new Date().toISOString().split('T')[0];

    const handlePrint = () => {
        window.print();
    };

    // Determine if it's an Evacuation Diagram based on placed elements
    const isEvacuation = mapData?.elements?.some(el =>
        el.type === 'arrow' || (el.type === 'icon' && el.iconId === 'YOU_ARE_HERE')
    );

    // Extract unique ISO icons used in this map specifically for the legend
    const usedIconsMap = {};
    if (mapData?.elements) {
        mapData.elements.forEach(el => {
            if (el.type === 'icon' && SAFETY_ICONS[el.iconId]) {
                usedIconsMap[el.iconId] = SAFETY_ICONS[el.iconId];
            }
        });
    }
    const legendIcons = Object.values(usedIconsMap);

    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Previsualización del Mapa de Riesgos</h1>
                </div>
                <button onClick={handlePrint} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Printer size={18} /> Imprimir / Exportar A4
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                {/* A4 Landscape Print Area */}
                <div
                    className="pdf-container card print-area"
                    ref={componentRef}
                    style={{
                        width: '100%', maxWidth: '297mm', minHeight: '210mm', // A4 Landscape
                        padding: '10mm', background: '#ffffff', color: '#000000',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                        boxSizing: 'border-box', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        display: 'flex', flexDirection: 'column'
                    }}
                >
                    <style type="text/css" media="print">
                        {`
                            @page { size: A4 landscape; margin: 10mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            .no-print { display: none !important; }
                            .print-area { 
                                box-shadow: none !important; 
                                margin: 0 !important; 
                                padding: 10mm !important; 
                                width: 100% !important; 
                                max-width: none !important; 
                                border: 2px solid #1e293b !important;
                                border-radius: 0 !important; 
                                height: 100% !important;
                            }
                        `}
                    </style>

                    {/* Canvas Area (Image snapshot) */}
                    <div style={{ flex: 1, border: '2px solid #1e293b', position: 'relative', overflow: 'hidden', background: '#f8fafc', backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)', backgroundSize: '10px 10px' }}>

                        {/* Static render of the elements based on saved coordinates */}
                        {/* Using explicit 4000px boundaries makes sure print layout engines don't collapse absolutely positioned wrappers */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4000px', height: '4000px', pointerEvents: 'none' }}>
                            {mapData?.backgroundImage && (
                                <img src={mapData.backgroundImage} alt="Plano" style={{ position: 'absolute', top: '100px', left: '100px', opacity: 0.8, maxWidth: '2000px', maxHeight: 'none' }} />
                            )}
                            {mapData?.elements?.map((el) => {
                                if (el.type === 'icon' && SAFETY_ICONS[el.iconId]) {
                                    const iconDef = SAFETY_ICONS[el.iconId];
                                    return (
                                        <div
                                            key={el.id}
                                            style={{
                                                position: 'absolute', left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                                                width: '40px', height: '40px', background: '#ffffff', borderRadius: '4px',
                                                border: `2px solid ${iconDef.color}`, color: iconDef.color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            dangerouslySetInnerHTML={{ __html: iconDef.svg }}
                                        />
                                    );
                                }
                                if (el.type === 'text') {
                                    return (
                                        <div
                                            key={el.id}
                                            style={{
                                                position: 'absolute', left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                                                fontSize: '16px', fontWeight: 800, color: el.color, whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {el.text}
                                        </div>
                                    );
                                }
                                return null;
                            })}

                            {/* SVG Layer for Vectors */}
                            <svg width="4000" height="4000" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 0, left: 0, width: '4000px', height: '4000px', pointerEvents: 'none', overflow: 'visible' }}>
                                <defs>
                                    <marker id="pdf-arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                        <polygon points="0 0, 6 2, 0 4" fill="#2563eb" />
                                    </marker>
                                </defs>
                                {mapData?.elements?.filter(el => ['arrow', 'line', 'rect'].includes(el.type)).map(el => {
                                    const commonProps = {
                                        key: el.id,
                                        stroke: el.color || '#0f172a'
                                    };

                                    if (el.type === 'arrow') {
                                        return <line {...commonProps} x1={el.startX} y1={el.startY} x2={el.endX} y2={el.endY} strokeWidth="3" markerEnd="url(#pdf-arrowhead)" />;
                                    }
                                    if (el.type === 'line') {
                                        return <line {...commonProps} x1={el.startX} y1={el.startY} x2={el.endX} y2={el.endY} strokeWidth="3" strokeLinecap="round" />;
                                    }
                                    if (el.type === 'rect') {
                                        const rx = Math.min(el.startX, el.endX);
                                        const ry = Math.min(el.startY, el.endY);
                                        const rw = Math.abs(el.endX - el.startX);
                                        const rh = Math.abs(el.endY - el.startY);
                                        return <rect {...commonProps} x={rx} y={ry} width={rw} height={rh} strokeWidth="2" fill="transparent" />;
                                    }
                                    return null;
                                })}
                            </svg>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 250px', gap: '10px', marginTop: '10px', height: '100px' }}>

                        {/* Legend */}
                        <div style={{ border: '1px solid #1e293b', padding: '8px', fontSize: '9pt', overflow: 'hidden' }}>
                            <strong style={{ display: 'block', marginBottom: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>REFERENCIAS (Norma ISO 7010 / IRAM)</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px' }}>
                                {legendIcons.map(icon => (
                                    <div key={icon.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '16px', height: '16px', border: `1px solid ${icon.color}`, color: icon.color, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: icon.svg }} />
                                        <span>{icon.label}</span>
                                    </div>
                                ))}
                                {legendIcons.length === 0 && <span style={{ color: '#64748b' }}>No se han utilizado pictogramas normalizados en este plano.</span>}
                            </div>
                        </div>

                        {/* Rótulo Oficial */}
                        <div style={{ border: '2px solid #1e293b', display: 'flex', flexDirection: 'column', fontSize: '8pt', background: '#f8fafc', overflow: 'hidden' }}>
                            <div style={{
                                padding: '4px 6px',
                                display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold',
                                background: isEvacuation ? '#16a34a' : 'transparent',
                                color: isEvacuation ? '#ffffff' : 'inherit',
                                borderBottom: '1px solid #1e293b'
                            }}>
                                <MapIcon size={14} color={isEvacuation ? '#ffffff' : 'currentColor'} />
                                {isEvacuation ? 'DIAGRAMA DE EVACUACIÓN' : 'MAPA DE RIESGOS INTEGRAL'}
                            </div>
                            <div style={{ flex: 1, padding: '4px 6px', display: 'grid', gridTemplateColumns: '1fr', gap: '2px' }}>
                                <div><strong>Empresa:</strong> {mapData?.empresa || 'N/A'}</div>
                                <div><strong>Sector:</strong> {mapData?.sector || 'N/A'}</div>
                                <div><strong>Fecha:</strong> {mapData?.fecha ? new Date(mapData.fecha + 'T12:00:00Z').toLocaleDateString() : 'N/A'}</div>
                            </div>
                            <div style={{ borderTop: '1px solid #1e293b', padding: '4px 6px', textAlign: 'center', background: '#ffffff' }}>
                                <div style={{ height: '20px' }}></div> {/* Signature space */}
                                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '2px' }}>
                                    <strong style={{ fontSize: '7pt' }}>Firma Profesional RyS</strong>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
