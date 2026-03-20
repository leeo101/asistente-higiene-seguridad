import React, { useRef, useMemo } from 'react';
import { ArrowLeft, Printer, Map as MapIcon } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import { SAFETY_ICONS } from '../data/mapIcons';

export default function RiskMapPdfGenerator({ data }: { data: any }): React.ReactElement | null {
// logo code removed


    const componentRef = useRef();

        
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

    const { autoScale } = React.useMemo(() => {
        let maxX = 800; // default assumptions
        let maxY = 600;

        if (mapData?.backgroundImage) {
            maxX = Math.max(maxX, 1200);
            maxY = Math.max(maxY, 800);
        }

        mapData?.elements?.forEach(el => {
            if (el.x) { maxX = Math.max(maxX, el.x + 100); }
            if (el.y) { maxY = Math.max(maxY, el.y + 100); }
            if (el.startX) { maxX = Math.max(maxX, Math.max(el.startX, el.endX) + 100); }
            if (el.startY) { maxY = Math.max(maxY, Math.max(el.startY, el.endY) + 100); }
        });

        // A4 Printable approximate pixel width (Landscape) is 1050x650
        const scaleX = 1050 / (maxX + 50);
        const scaleY = 650 / (maxY + 50);
        const scale = Math.min(scaleX, scaleY, 1);

        return { autoScale: scale };
    }, [mapData]);
    return (
        <div className="container" style={{ paddingBottom: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10, flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>PrevisualizaciÃ³n del Mapa de Riesgos</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onShare} className="btn-secondary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Compartir PDF
                    </button>
                    <button onClick={handlePrint} className="btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Printer size={18} /> Imprimir / Exportar A4
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                {/* A4 Landscape Print Area */}
                <div
                    id="pdf-content"
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
                                min-height: 190mm !important;
                                display: block !important;
                            }
                            .company-logo {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                            }
                        `}
                    </style>

                    {/* Canvas Area (Image snapshot) */}
                    <div style={{ height: '140mm', width: '100%', border: '2px solid #1e293b', position: 'relative', overflow: 'hidden', background: '#f8fafc', backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)', backgroundSize: '10px 10px', flexShrink: 0 }}>

                        {/* Scalable Container ensuring 1:1 render fidelity then shrunk to fit A4 */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0,
                            width: '4000px', height: '4000px',
                            pointerEvents: 'none',
                            transformOrigin: 'top left',
                            transform: `scale(${autoScale})`
                        }}>
                            {mapData?.backgroundImage && (
                                <img src={mapData.backgroundImage} alt="Plano GuÃ­a" style={{ position: 'absolute', top: '100px', left: '100px', opacity: 0.8, maxWidth: '2000px', maxHeight: 'none' }} />
                            )}

                            {/* Emulate SVG Layers as HTML Divs to PREVENT Chrome SVG Print Culling bugs */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4000px', height: '4000px', pointerEvents: 'none', zIndex: 2 }}>
                                {mapData?.elements?.filter(el => ['arrow', 'line', 'rect'].includes(el.type)).map(el => {
                                    const commonStyle = {
                                        position: 'absolute',
                                        zIndex: 2,
                                        WebkitPrintColorAdjust: 'exact',
                                        printColorAdjust: 'exact',
                                        pointerEvents: 'none'
                                    };

                                    const isDashed = el.lineStyle === 'dashed';

                                    if (el.type === 'line' || el.type === 'arrow') {
                                        const length = Math.sqrt(Math.pow(el.endX - el.startX, 2) + Math.pow(el.endY - el.startY, 2));
                                        const angle = Math.atan2(el.endY - el.startY, el.endX - el.startX) * 180 / Math.PI;

                                        return (
                                            <div key={el.id} style={{
                                                ...commonStyle, left: el.startX, top: el.startY, width: `${length}px`, height: '4px',
                                                backgroundColor: isDashed ? 'transparent' : (el.color || '#0f172a'),
                                                backgroundImage: isDashed ? `linear-gradient(to right, ${el.color || '#0f172a'} 50%, transparent 50%)` : 'none',
                                                backgroundSize: isDashed ? '12px 100%' : 'auto',
                                                transformOrigin: '0% 50%',
                                                transform: `translateY(-50%) rotate(${angle}deg)`, borderRadius: '2px'
                                            }}>
                                                {el.type === 'arrow' && (
                                                    <div style={{
                                                        position: 'absolute', right: '-2px', top: '50%', transform: 'translateY(-50%)',
                                                        width: 0, height: 0, borderTop: '6px solid transparent',
                                                        borderBottom: '6px solid transparent', borderLeft: `10px solid ${el.color || '#0f172a'}`
                                                    }} />
                                                )}
                                            </div>
                                        );
                                    }

                                    if (el.type === 'rect') {
                                        const rx = Math.min(el.startX, el.endX);
                                        const ry = Math.min(el.startY, el.endY);
                                        const rw = Math.abs(el.endX - el.startX);
                                        const rh = Math.abs(el.endY - el.startY);

                                        return (
                                            <div key={el.id} style={{
                                                ...commonStyle, left: rx, top: ry, width: rw, height: rh,
                                                border: `4px ${isDashed ? 'dashed' : 'solid'} ${el.color || '#0f172a'}`, backgroundColor: 'transparent', boxSizing: 'border-box'
                                            }} />
                                        );
                                    }
                                    return null;
                                })}
                            </div>

                            {/* Render Icons and Text */}
                            {mapData?.elements?.map((el) => {
                                if (el.type === 'icon' && SAFETY_ICONS[el.iconId]) {
                                    const iconDef = SAFETY_ICONS[el.iconId];
                                    return (
                                        <div
                                            key={el.id}
                                            style={{
                                                position: 'absolute', left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                                                width: '40px', height: '40px', background: '#ffffff', borderRadius: '4px',
                                                border: `3px solid ${iconDef.color}`, color: iconDef.color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                zIndex: 5
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
                                                fontSize: '18px', fontWeight: 800, color: el.color, whiteSpace: 'nowrap',
                                                background: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: '4px',
                                                zIndex: 10
                                            }}
                                        >
                                            {el.text}
                                        </div>
                                    );
                                }
                                return null;
                            })}
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

                        {/* RÃ³tulo Oficial */}
                        <div style={{ border: '2px solid #1e293b', display: 'flex', flexDirection: 'column', fontSize: '8pt', background: '#f8fafc', overflow: 'hidden' }}>
                            <div style={{
                                padding: '4px 6px',
                                display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold',
                                background: isEvacuation ? '#16a34a' : 'transparent',
                                color: isEvacuation ? '#ffffff' : 'inherit',
                                borderBottom: '1px solid #1e293b'
                            }}>
                                <MapIcon size={14} color={isEvacuation ? '#ffffff' : 'currentColor'} />
                                {isEvacuation ? 'DIAGRAMA DE EVACUACIÃ“N' : 'MAPA DE RIESGOS INTEGRAL'}
                            </div>
                            <div style={{ flex: 1, padding: '4px 6px', display: 'grid', gridTemplateColumns: '1fr', gap: '2px' }}>
                                <div><strong>Empresa:</strong> {mapData?.empresa || 'N/A'}</div>
                                <div><strong>Sector:</strong> {mapData?.sector || 'N/A'}</div>
                                <div><strong>Fecha:</strong> {mapData?.fecha ? new Date(mapData.fecha + 'T12:00:00Z').toLocaleDateString() : 'N/A'}</div>
                            </div>
                            <div style={{ padding: '4px 6px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'center', background: 'white' }}>
                                <CompanyLogo
                                    style={{ maxHeight: '35px', maxWidth: '100%', objectFit: 'contain' }}
                                />
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
