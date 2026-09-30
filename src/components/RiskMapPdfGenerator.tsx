import React, { useRef, useMemo } from 'react';
import { ArrowLeft, Printer, Map as MapIcon } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import { SAFETY_ICONS } from '../data/mapIcons';

export default function RiskMapPdfGenerator({
  data,
  onBack = () => window.history.back(),
  onShare = () => {},
  showProfSignature = true





}: {data: any;onBack?: () => void;onShare?: () => void;showProfSignature?: boolean;}): React.ReactElement | null {
  const mapData = data;
  // logo code removed


  const componentRef = useRef<HTMLDivElement>(null);

  // Retrieve professional digital signature stamp
  let actSignature: string | null = null;
  let actName: string | null = null;
  try {
    const lsStamp = localStorage.getItem('signatureStampData');
    const legacySig = localStorage.getItem('capturedSignature');
    const lsPersonal = localStorage.getItem('personalData');
    if (lsStamp) actSignature = JSON.parse(lsStamp).signature;else
    if (legacySig) actSignature = legacySig;
    if (lsPersonal) {
      actName = JSON.parse(lsPersonal).name;
    }
  } catch (e) {}


  const handlePrint = () => {
    window.print();
  };

  // Determine if it's an Evacuation Diagram based on placed elements
  const isEvacuation = mapData?.elements?.some((el) =>
  el.type === 'arrow' || el.type === 'icon' && el.iconId === 'YOU_ARE_HERE'
  );

  // Extract unique ISO icons used in this map specifically for the legend
  const usedIconsMap = {};
  if (mapData?.elements) {
    mapData.elements.forEach((el) => {
      if (el.type === 'icon' && SAFETY_ICONS[el.iconId]) {
        usedIconsMap[el.iconId] = SAFETY_ICONS[el.iconId];
      }
    });
  }
  const legendIcons = Object.values(usedIconsMap) as any[];

  const { autoScale } = React.useMemo(() => {
    let maxX = 800; // default assumptions
    let maxY = 600;

    if (mapData?.backgroundImage) {
      maxX = Math.max(maxX, 1200);
      maxY = Math.max(maxY, 800);
    }

    mapData?.elements?.forEach((el) => {
      if (el.x) {maxX = Math.max(maxX, el.x + 100);}
      if (el.y) {maxY = Math.max(maxY, el.y + 100);}
      if (el.startX) {maxX = Math.max(maxX, Math.max(el.startX, el.endX) + 100);}
      if (el.startY) {maxY = Math.max(maxY, Math.max(el.startY, el.endY) + 100);}
    });

    // A4 Printable approximate pixel width (Landscape) is 1050x650
    const scaleX = 1050 / (maxX + 50);
    const scaleY = 650 / (maxY + 50);
    const scale = Math.min(scaleX, scaleY, 1);

    return { autoScale: scale };
  }, [mapData]);

  const renderPdfSvgElement = (el: any) => {
    const stroke = el.color || '#0f172a';
    const sw = el.strokeWidth || 2;
    const dashArr = el.lineStyle === 'dashed' ? '8,4' : 'none';

    if (el.type === 'circle') {
      const cx = (el.startX + el.endX) / 2;
      const cy = (el.startY + el.endY) / 2;
      const rx = Math.abs(el.endX - el.startX) / 2;
      const ry = Math.abs(el.endY - el.startY) / 2;
      return (
        <ellipse
          key={el.id}
          cx={cx} cy={cy} rx={rx || 1} ry={ry || 1}
          stroke={stroke} strokeWidth={sw} strokeDasharray={dashArr}
          fill={el.fillColor || 'transparent'} opacity={el.opacity ?? 1}
        />
      );
    }

    if (el.type === 'polyline' && el.points?.length >= 2) {
      const pts = el.points.map((p: any) => `${p.x},${p.y}`).join(' ');
      return (
        <polyline
          key={el.id}
          points={pts}
          stroke={stroke} strokeWidth={sw} strokeDasharray={dashArr}
          fill="none" opacity={el.opacity ?? 1}
        />
      );
    }

    if (el.type === 'dimension') {
      const dx = el.endX - el.startX;
      const dy = el.endY - el.startY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const length = Math.sqrt(dx * dx + dy * dy);
      const midX = (el.startX + el.endX) / 2;
      const midY = (el.startY + el.endY) / 2;
      const distM = (length / 40).toFixed(2);
      const txt = el.text || `${distM} m`;

      return (
        <g key={el.id}>
          <line x1={el.startX} y1={el.startY} x2={el.endX} y2={el.endY} stroke={stroke} strokeWidth={sw} />
          <line x1={el.startX - 5} y1={el.startY - 5} x2={el.startX + 5} y2={el.startY + 5} stroke={stroke} strokeWidth={sw + 1} />
          <line x1={el.endX - 5} y1={el.endY - 5} x2={el.endX + 5} y2={el.endY + 5} stroke={stroke} strokeWidth={sw + 1} />
          <g transform={`translate(${midX}, ${midY}) rotate(${Math.abs(angle) > 90 ? angle + 180 : angle})`}>
            <rect x="-24" y="-14" width="48" height="13" rx="2" fill="#ffffff" stroke={stroke} strokeWidth="0.8" />
            <text x="0" y="-4" textAnchor="middle" fill={stroke} fontSize="9" fontWeight="bold">{txt}</text>
          </g>
        </g>
      );
    }

    if (el.type === 'door') {
      const w = el.width || 40;
      const isOutward = !!el.flipY;
      const isHingeRight = !!el.flipX;

      return (
        <g key={el.id} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}>
          {/* Umbral / Línea de pared */}
          <line x1={0} y1={0} x2={w} y2={0} stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />

          {el.doorType === 'double' ? (
            <>
              <circle cx={0} cy={0} r={2.5} fill={stroke} />
              <circle cx={w} cy={0} r={2.5} fill={stroke} />
              {!isOutward ? (
                <>
                  <line x1={0} y1={0} x2={0} y2={w / 2} stroke={stroke} strokeWidth={sw} />
                  <path d={`M 0 ${w / 2} A ${w / 2} ${w / 2} 0 0 0 ${w / 2} 0`} fill="none" stroke={stroke} strokeWidth={sw * 0.75} strokeDasharray="3,3" />
                  <line x1={w} y1={0} x2={w} y2={w / 2} stroke={stroke} strokeWidth={sw} />
                  <path d={`M ${w} ${w / 2} A ${w / 2} ${w / 2} 0 0 1 ${w / 2} 0`} fill="none" stroke={stroke} strokeWidth={sw * 0.75} strokeDasharray="3,3" />
                </>
              ) : (
                <>
                  <line x1={0} y1={0} x2={0} y2={-w / 2} stroke={stroke} strokeWidth={sw} />
                  <path d={`M 0 ${-w / 2} A ${w / 2} ${w / 2} 0 0 1 ${w / 2} 0`} fill="none" stroke={stroke} strokeWidth={sw * 0.75} strokeDasharray="3,3" />
                  <line x1={w} y1={0} x2={w} y2={-w / 2} stroke={stroke} strokeWidth={sw} />
                  <path d={`M ${w} ${-w / 2} A ${w / 2} ${w / 2} 0 0 0 ${w / 2} 0`} fill="none" stroke={stroke} strokeWidth={sw * 0.75} strokeDasharray="3,3" />
                </>
              )}
            </>
          ) : el.doorType === 'sliding' ? (
            <>
              <line x1={0} y1={0} x2={w} y2={0} stroke="#94a3b8" strokeWidth="2" />
              <line x1={3} y1={isOutward ? -3 : 3} x2={w / 2 + 3} y2={isOutward ? -3 : 3} stroke={stroke} strokeWidth={sw + 1} />
              <line x1={w / 2 - 3} y1={isOutward ? 3 : -3} x2={w - 3} y2={isOutward ? 3 : -3} stroke={stroke} strokeWidth={sw + 1} />
            </>
          ) : (
            <>
              {!isHingeRight ? (
                <>
                  <circle cx={0} cy={0} r={2.5} fill={stroke} />
                  {!isOutward ? (
                    <>
                      <line x1={0} y1={0} x2={0} y2={w} stroke={stroke} strokeWidth={sw} />
                      <path d={`M 0 ${w} A ${w} ${w} 0 0 0 ${w} 0`} fill="none" stroke={stroke} strokeWidth={sw * 0.75} strokeDasharray="4,3" />
                      {el.doorType === 'emergency' && (
                        <rect x={-3} y={w * 0.3} width={6} height={w * 0.4} rx="2" fill="#16a34a" />
                      )}
                    </>
                  ) : (
                    <>
                      <line x1={0} y1={0} x2={0} y2={-w} stroke={stroke} strokeWidth={sw} />
                      <path d={`M 0 ${-w} A ${w} ${w} 0 0 1 ${w} 0`} fill="none" stroke={stroke} strokeWidth={sw * 0.75} strokeDasharray="4,3" />
                      {el.doorType === 'emergency' && (
                        <rect x={-3} y={-w * 0.7} width={6} height={w * 0.4} rx="2" fill="#16a34a" />
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <circle cx={w} cy={0} r={2.5} fill={stroke} />
                  {!isOutward ? (
                    <>
                      <line x1={w} y1={0} x2={w} y2={w} stroke={stroke} strokeWidth={sw} />
                      <path d={`M ${w} ${w} A ${w} ${w} 0 0 1 0 0`} fill="none" stroke={stroke} strokeWidth={sw * 0.75} strokeDasharray="4,3" />
                      {el.doorType === 'emergency' && (
                        <rect x={w - 3} y={w * 0.3} width={6} height={w * 0.4} rx="2" fill="#16a34a" />
                      )}
                    </>
                  ) : (
                    <>
                      <line x1={w} y1={0} x2={w} y2={-w} stroke={stroke} strokeWidth={sw} />
                      <path d={`M ${w} ${-w} A ${w} ${w} 0 0 0 0 0`} fill="none" stroke={stroke} strokeWidth={sw * 0.75} strokeDasharray="4,3" />
                      {el.doorType === 'emergency' && (
                        <rect x={w - 3} y={-w * 0.7} width={6} height={w * 0.4} rx="2" fill="#16a34a" />
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </g>
      );
    }

    if (el.type === 'stairs') {
      const w = el.width || 50;
      const h = el.height || 100;
      const numSteps = el.steps || 8;
      const isUp = el.direction !== 'DOWN';

      return (
        <g key={el.id} transform={`translate(${el.x - w / 2}, ${el.y - h / 2}) rotate(${el.rotation || 0} ${w / 2} ${h / 2})`}>
          {el.stairType === 'spiral' ? (
            <>
              <circle cx={w / 2} cy={h / 2} r={w / 2} fill="#f8fafc" stroke={stroke} strokeWidth={sw} />
              <circle cx={w / 2} cy={h / 2} r={5} fill={stroke} />
              {Array.from({ length: numSteps }).map((_, i) => {
                const ang = (i * 360 / numSteps) * (Math.PI / 180);
                const x2 = w / 2 + (w / 2) * Math.cos(ang);
                const y2 = h / 2 + (h / 2) * Math.sin(ang);
                return <line key={i} x1={w / 2} y1={h / 2} x2={x2} y2={y2} stroke={stroke} strokeWidth="1.2" />;
              })}
            </>
          ) : (
            <>
              <rect x={0} y={0} width={w} height={h} fill="#f8fafc" stroke={stroke} strokeWidth={sw} />
              {Array.from({ length: numSteps - 1 }).map((_, i) => {
                const stepY = ((i + 1) * h) / numSteps;
                return <line key={i} x1={0} y1={stepY} x2={w} y2={stepY} stroke={stroke} strokeWidth="1.2" strokeDasharray={el.stairType === 'ramp' ? '3,3' : 'none'} />;
              })}
              <line x1={w / 2} y1={isUp ? h - 10 : 10} x2={w / 2} y2={isUp ? 15 : h - 15} stroke="#2563eb" strokeWidth="2" />
              <polygon
                points={isUp ? `${w / 2 - 4},18 ${w / 2 + 4},18 ${w / 2},8` : `${w / 2 - 4},${h - 18} ${w / 2 + 4},${h - 18} ${w / 2},${h - 8}`}
                fill="#2563eb"
              />
              <text x={w / 2} y={h / 2} textAnchor="middle" fill="#2563eb" fontSize="9" fontWeight="bold">
                {el.stairType === 'ramp' ? 'RAMPA' : isUp ? 'SUBE' : 'BAJA'}
              </text>
            </>
          )}
        </g>
      );
    }

    if (el.type === 'window') {
      const w = el.width || 50;
      const h = el.height || 14;

      return (
        <g key={el.id} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#e0f2fe" stroke={stroke} strokeWidth={sw} />
          <line x1={-w / 2} y1={0} x2={w / 2} y2={0} stroke={stroke} strokeWidth={sw * 0.8} />
          <line x1={-w / 2} y1={-h / 2} x2={-w / 2} y2={h / 2} stroke={stroke} strokeWidth={sw + 0.5} />
          <line x1={w / 2} y1={-h / 2} x2={w / 2} y2={h / 2} stroke={stroke} strokeWidth={sw + 0.5} />
        </g>
      );
    }

    if (el.type === 'column') {
      const w = el.width || 24;
      const h = el.height || 24;

      return (
        <g key={el.id} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#cbd5e1" stroke={stroke} strokeWidth={sw} />
          <line x1={-w / 2} y1={-h / 2} x2={w / 2} y2={h / 2} stroke={stroke} strokeWidth={sw * 0.75} />
          <line x1={w / 2} y1={-h / 2} x2={-w / 2} y2={h / 2} stroke={stroke} strokeWidth={sw * 0.75} />
        </g>
      );
    }

    return null;
  };

  return (
    <div className="container pb-[3rem] min-h-[100vh] flex flex-col">
            <div className="no-print flex items-center justify-space-between mb-[1.5rem] z-[10] flex-wrap gap-[1rem]">
                <div className="flex items-center gap-[1rem]">
                    <button onClick={onBack} className="p-[0.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] cursor-pointer rounded-[50%] text-[var(--color-text)]">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="m-[0] text-[1.5rem] font-[800]">Previsualización del Mapa de Riesgos</h1>
                </div>
                <div className="flex gap-[0.8rem]">
                    <button onClick={onShare} className="btn-secondary m-[0] flex items-center gap-[0.5rem]">
                        Compartir PDF
                    </button>
                    <button onClick={handlePrint} className="btn-primary m-[0] flex items-center gap-[0.5rem]">
                        <Printer size={18} /> Imprimir / Exportar A4
                    </button>
                </div>
            </div>

            <div className="flex-[1] flex justify-center">
                {/* A4 Landscape Print Area */}
                <div
          id="pdf-content"
          className="pdf-container card print-area w-[100%] max-w-[297mm] min-h-[210mm] p-[10mm] bg-[#ffffff] text-[#000000] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] font-family-['Helvetica_Neue',_Helvetica,_Arial,_sans-serif] flex flex-col"
          ref={componentRef}>







          
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
                    <div className="h-[140mm] w-[100%] border-[2px_solid_#1e293b] relative bg-[#f8fafc] background-image-[linear-gradient(to_right,_#e2e8f0_1px,_transparent_1px),_linear-gradient(to_bottom,_#e2e8f0_1px,_transparent_1px)] background-size-[10px_10px] flex-shrink-[0]">

                        {/* Scalable Container ensuring 1:1 render fidelity then shrunk to fit A4 */}
                        <div style={{




              transform: `scale(${autoScale})`
            }} className="absolute top-[0] left-[0] w-[4000px] h-[4000px] pointer-events-[none] transform-origin-[top_left]">
                            {mapData?.backgroundImage &&
              <img src={mapData.backgroundImage} alt="Plano Guía" className="absolute top-[100px] left-[100px] opacity-[0.8] max-w-[2000px] max-height-[none]" />
              }

                            {/* Emulate SVG Layers as HTML Divs to PREVENT Chrome SVG Print Culling bugs */}
                            <div className="absolute top-[0] left-[0] w-[4000px] h-[4000px] pointer-events-[none] z-[2]">
                                {mapData?.elements?.filter((el: any) => ['arrow', 'line', 'rect'].includes(el.type)).map((el: any) => {
                  const commonStyle: React.CSSProperties = {
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
                        ...commonStyle, left: el.startX, top: el.startY, width: `${length}px`,
                        backgroundColor: isDashed ? 'transparent' : el.color || '#0f172a',
                        backgroundImage: isDashed ? `linear-gradient(to right, ${el.color || '#0f172a'} 50%, transparent 50%)` : 'none',
                        backgroundSize: isDashed ? '12px 100%' : 'auto',

                        transform: `translateY(-50%) rotate(${angle}deg)`
                      }} className="h-[4px] transform-origin-[0%_50%] rounded-[2px]">
                                                {el.type === 'arrow' &&
                        <div style={{


                          borderLeft: `10px solid ${el.color || '#0f172a'}`
                        }} className="absolute right-[-2px] top-[50%] transform-[translateY(-50%)] w-[0] h-[0] border-top-[6px_solid_transparent] border-bottom-[6px_solid_transparent]" />
                        }
                                            </div>);

                  }

                  if (el.type === 'rect') {
                    const rx = Math.min(el.startX, el.endX);
                    const ry = Math.min(el.startY, el.endY);
                    const rw = Math.abs(el.endX - el.startX);
                    const rh = Math.abs(el.endY - el.startY);

                    return (
                      <div key={el.id} style={{
                        ...commonStyle, left: rx, top: ry, width: rw, height: rh,
                        border: `4px ${isDashed ? 'dashed' : 'solid'} ${el.color || '#0f172a'}`
                      }} className="bg-[transparent] box-sizing-[border-box]" />);

                  }
                  return null;
                })}
                            </div>

                            {/* Render Architectural Elements & Vectors (SVG layer for 100% crisp printing) */}
                            <svg className="absolute top-[0] left-[0] w-[4000px] h-[4000px] pointer-events-none z-[3]">
                              {mapData?.elements?.filter((el: any) => ['circle', 'polyline', 'door', 'stairs', 'window', 'column', 'dimension'].includes(el.type)).map(renderPdfSvgElement)}
                            </svg>

                            {/* Render Icons and Text */}
                            {mapData?.elements?.map((el) => {
                if (el.type === 'icon' && SAFETY_ICONS[el.iconId]) {
                  const iconDef = SAFETY_ICONS[el.iconId];
                  return (
                    <div
                      key={el.id}
                      style={{
                        left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,

                        border: `3px solid ${iconDef.color}`, color: iconDef.color


                      }}
                      dangerouslySetInnerHTML={{ __html: iconDef.svg }} className="absolute w-[40px] h-[40px] bg-[#ffffff] rounded-[4px] flex items-center justify-center p-1 z-[5] [&>svg]:w-full [&>svg]:h-full [&>svg]:block overflow-hidden" />);


                }
                if (el.type === 'text') {
                  return (
                    <div
                      key={el.id}
                      style={{
                        left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                        color: el.color


                      }} className="absolute text-[18px] font-[800] white-space-[nowrap] bg-[rgba(255,255,255,0.7)] p-[2px_6px] rounded-[4px] z-[10]">
                      
                      
                                            {el.text}
                                        </div>);

                }
                return null;
              })}
                        </div>
                    </div>
                    <div className="grid grid-template-columns-[minmax(0,_1fr)_250px] gap-[10px] mt-[10px] h-[100px]">

                        {/* Legend */}
                        <div className="border-[1px_solid_#1e293b] p-[8px] text-[9pt]">
                            <strong className="block mb-[6px] border-bottom-[1px_solid_#e2e8f0] pb-[2px]">REFERENCIAS (Norma ISO 7010 / IRAM)</strong>
                            <div className="flex flex-wrap gap-[8px_12px]">                                {legendIcons.map((icon) => (
                                    <div key={icon.id} className="flex items-center gap-[4px]">
                                        <div style={{ border: `1px solid ${icon.color}`, color: icon.color }} dangerouslySetInnerHTML={{ __html: icon.svg }} className="w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center p-[1px] [&>svg]:w-full [&>svg]:h-full [&>svg]:block overflow-hidden" />
                                        <span>{icon.label}</span>
                                    </div>
                                ))}
                                {legendIcons.length === 0 && <span className="text-[#64748b]">No se han utilizado pictogramas normalizados en este plano.</span>}
                            </div>
                        </div>

                        {/* Rótulo Oficial */}
                        <div className="border-[2px_solid_#1e293b] flex flex-col text-[8pt] bg-[#f8fafc]">
                            <div style={{
                                background: isEvacuation ? '#16a34a' : 'transparent',
                                color: isEvacuation ? '#ffffff' : 'inherit'
                            }} className="p-[4px_6px] flex items-center gap-[6px] font-[bold] border-bottom-[1px_solid_#1e293b]">
                                <MapIcon size={14} color={isEvacuation ? '#ffffff' : 'currentColor'} />
                                {isEvacuation ? 'DIAGRAMA DE EVACUACIÓN' : 'MAPA DE RIESGOS INTEGRAL'}
                            </div>
                            <div className="flex-[1] p-[4px_6px] grid grid-template-columns-[1fr] gap-[2px]">
                                <div><strong>Empresa:</strong> {mapData?.empresa || 'N/A'}</div>
                                <div><strong>Sector:</strong> {mapData?.sector || 'N/A'}</div>
                                <div><strong>Fecha:</strong> {mapData?.fecha ? new Date(mapData.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : 'N/A'}</div>
                            </div>
                            <div className="p-[4px_6px] border-top-[1px_solid_#1e293b] flex justify-center bg-[white]">
                                <CompanyLogo style={{ maxHeight: '35px', maxWidth: '140px', objectFit: 'contain' }} />
                            </div>
                            <div className="border-top-[1px_solid_#1e293b] p-[4px_6px] text-center bg-[#ffffff] min-h-[45px] flex flex-col items-center justify-center">
                                {actSignature ?
                                    <img src={actSignature} alt="Firma Profesional" className="max-h-[35px] object-contain" style={{ maxHeight: '35px', objectFit: 'contain' }} /> :
                                    <div className="h-[20px]"></div>
                                }
                                <div className="border-top-[1px_dashed_#94a3b8] pt-[2px] w-[100%]">
                                    <strong className="text-[7pt]">{actName || 'Firma Profesional RyS'}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}