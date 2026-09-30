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

  // Retrieve professional digital signature stamp & personal credential data
  let actSignature: string | null = null;
  let actStamp: string | null = null;
  let actName: string | null = null;
  let actLic: string | null = null;
  let actTitle: string | null = null;

  try {
    const lsStamp = typeof window !== 'undefined' ? localStorage.getItem('signatureStampData') : null;
    const legacySig = typeof window !== 'undefined' ? localStorage.getItem('capturedSignature') : null;
    const lsPersonal = typeof window !== 'undefined' ? localStorage.getItem('personalData') : null;

    if (lsStamp) {
      const parsed = JSON.parse(lsStamp);
      actSignature = parsed.signature || null;
      actStamp = parsed.stamp || null;
    } else if (legacySig) {
      actSignature = legacySig;
    }

    if (lsPersonal) {
      const pd = JSON.parse(lsPersonal);
      actName = pd.name || pd.fullName || null;
      actLic = pd.license || pd.matricula || null;
      actTitle = pd.profession || pd.profesion || pd.title || pd.titulo || null;
    }
  } catch (e) {}

  if (!actTitle || actTitle === 'Técnico' || actTitle === 'PROFESIONAL') {
    actTitle = 'Técnico Univ. en Higiene y Seguridad Laboral';
  }


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

  // Dynamic SVG viewBox: automatically wraps all drawn elements, centers them, and scales to fill the sheet
  const viewBox = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const addPt = (x?: number, y?: number, pad = 15) => {
      if (typeof x === 'number' && !isNaN(x)) {
        minX = Math.min(minX, x - pad);
        maxX = Math.max(maxX, x + pad);
      }
      if (typeof y === 'number' && !isNaN(y)) {
        minY = Math.min(minY, y - pad);
        maxY = Math.max(maxY, y + pad);
      }
    };

    if (mapData?.backgroundImage) {
      // Add background image bounds only as soft guides, not hard constraints
      addPt(150, 150, 0);
      addPt(950, 650, 0);
    }

    mapData?.elements?.forEach((el: any) => {
      if (typeof el.x === 'number' && typeof el.y === 'number') {
        const rad = Math.max(el.width || 40, el.height || 40) / 2 + 10;
        addPt(el.x, el.y, rad);
      }
      if (typeof el.startX === 'number' && typeof el.startY === 'number') {
        addPt(el.startX, el.startY, 15);
        if (typeof el.endX === 'number' && typeof el.endY === 'number') {
          addPt(el.endX, el.endY, 15);
          // Ensure all 4 corners are covered for rotated rects
          addPt(el.startX, el.endY, 15);
          addPt(el.endX, el.startY, 15);
        }
      }
      if (Array.isArray(el.points)) {
        el.points.forEach((p: any) => addPt(p.x, p.y, 10));
      }
    });

    if (minX === Infinity || maxX === -Infinity || minX === maxX || minY === maxY) {
      minX = 0;
      minY = 0;
      maxX = 800;
      maxY = 500;
    }

    // Safety margins around the drawing
    const margin = 40;
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;

    const width = Math.max(maxX - minX, 100);
    const height = Math.max(maxY - minY, 100);

    return { minX, minY, width, height };
  }, [mapData]);

  const renderPdfSvgElement = (el: any) => {
    const stroke = el.color || '#0f172a';
    const sw = el.strokeWidth || 2.5;
    const dashArr = el.lineStyle === 'dashed' ? '8,4' : 'none';

    if (el.type === 'rect') {
      const rx = Math.min(el.startX, el.endX);
      const ry = Math.min(el.startY, el.endY);
      const rw = Math.abs(el.endX - el.startX);
      const rh = Math.abs(el.endY - el.startY);
      return (
        <rect
          key={el.id}
          x={rx}
          y={ry}
          width={rw}
          height={rh}
          stroke={stroke}
          strokeWidth={sw}
          strokeDasharray={dashArr}
          fill={el.fillColor || 'transparent'}
          opacity={el.opacity ?? 1}
        />
      );
    }

    if (el.type === 'line') {
      return (
        <line
          key={el.id}
          x1={el.startX}
          y1={el.startY}
          x2={el.endX}
          y2={el.endY}
          stroke={stroke}
          strokeWidth={sw}
          strokeDasharray={dashArr}
          opacity={el.opacity ?? 1}
        />
      );
    }

    if (el.type === 'arrow') {
      return (
        <line
          key={el.id}
          x1={el.startX}
          y1={el.startY}
          x2={el.endX}
          y2={el.endY}
          stroke={stroke}
          strokeWidth={sw}
          strokeDasharray={dashArr}
          markerEnd="url(#pdf-arrowhead)"
          opacity={el.opacity ?? 1}
        />
      );
    }

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

    if (el.type === 'chair') {
      const w = el.width || 28;
      const h = el.height || 28;

      return (
        <g key={el.id} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}>
          <rect x={-w / 2} y={-h / 2 + 4} width={w} height={h - 4} rx={4} fill={el.fillColor || '#f1f5f9'} stroke={stroke} strokeWidth={sw} />
          <path d={`M ${-w / 2 + 2} ${-h / 2 + 4} Q 0 ${-h / 2 - 2} ${w / 2 - 2} ${-h / 2 + 4}`} fill="none" stroke={stroke} strokeWidth={sw + 0.8} strokeLinecap="round" />
          <line x1={-w / 2} y1={-h / 2 + 6} x2={-w / 2} y2={h / 2 - 2} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <line x1={w / 2} y1={-h / 2 + 6} x2={w / 2} y2={h / 2 - 2} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <text
            x={0}
            y={2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.max(5, Math.min(8, w * 0.25))}
            fontWeight="bold"
            fill={el.color || '#475569'}
          >
            {el.label || 'Silla'}
          </text>
        </g>
      );
    }

    if (el.type === 'table') {
      const w = el.width || 70;
      const h = el.height || 40;
      const isRound = el.tableShape === 'round';

      return (
        <g key={el.id} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}>
          {isRound ? (
            <>
              <circle cx={0} cy={0} r={w / 2} fill={el.fillColor || '#ffffff'} stroke={stroke} strokeWidth={sw} />
              <circle cx={0} cy={0} r={w / 2 - 4} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="2,2" opacity={0.6} />
              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.max(6, Math.min(9, w * 0.18))}
                fontWeight="bold"
                fill={el.color || '#475569'}
              >
                {el.label || 'Mesa'}
              </text>
            </>
          ) : (
            <>
              <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill={el.fillColor || '#ffffff'} stroke={stroke} strokeWidth={sw} />
              <rect x={-w / 2 + 4} y={-h / 2 + 4} width={w - 8} height={h - 8} rx={2} fill="none" stroke={stroke} strokeWidth={0.8} opacity={0.4} />
              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.max(6, Math.min(9, h * 0.25))}
                fontWeight="bold"
                fill={el.color || '#475569'}
              >
                {el.label || 'Mesa'}
              </text>
            </>
          )}
        </g>
      );
    }

    if (el.type === 'sink') {
      const w = el.width || 36;
      const h = el.height || 30;

      return (
        <g key={el.id} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={el.fillColor || '#f8fafc'} stroke={stroke} strokeWidth={sw} />
          <ellipse cx={0} cy={1} rx={w * 0.35} ry={h * 0.28} fill="#ffffff" stroke={stroke} strokeWidth={sw * 0.75} />
          <circle cx={0} cy={-h / 2 + 4} r={2} fill={stroke} />
          <line x1={0} y1={-h / 2 + 4} x2={0} y2={-h / 2 + 7} stroke={stroke} strokeWidth={sw * 0.8} strokeLinecap="round" />
          <circle cx={0} cy={2} r={1.5} fill={stroke} />
          <text
            x={0}
            y={h / 2 - 5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={6}
            fontWeight="bold"
            fill={el.color || '#475569'}
          >
            {el.label || 'Bacha'}
          </text>
        </g>
      );
    }

    if (el.type === 'cabinet') {
      const w = el.width || 44;
      const h = el.height || 28;

      return (
        <g key={el.id} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={2} fill={el.fillColor || '#f1f5f9'} stroke={stroke} strokeWidth={sw} />
          <line x1={0} y1={-h / 2} x2={0} y2={h / 2} stroke={stroke} strokeWidth={sw * 0.6} strokeDasharray="3,2" />
          <rect x={-w / 4 - 3} y={-h / 2 + 4} width={6} height={2.5} rx={1} fill={stroke} />
          <rect x={w / 4 - 3} y={-h / 2 + 4} width={6} height={2.5} rx={1} fill={stroke} />
          <text
            x={0}
            y={h / 2 - 6}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={6.5}
            fontWeight="bold"
            fill={el.color || '#475569'}
          >
            {el.label || 'Archivador'}
          </text>
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
                  className="pdf-container card print-area"
                  style={{
                    width: '289mm',
                    height: '202mm',
                    maxHeight: '202mm',
                    boxSizing: 'border-box',
                    padding: '4mm 6mm',
                    border: '2px solid #0f172a',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
                  }}
                  ref={componentRef}
                >
                  <style type="text/css" media="print">
                    {`
                      @page { 
                        size: A4 landscape; 
                        margin: 0mm; 
                      }
                      html, body { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        width: 297mm !important;
                        height: 210mm !important;
                        overflow: hidden !important;
                      }
                      .no-print { display: none !important; }
                      .print-area { 
                          box-shadow: none !important; 
                          margin: 0 !important; 
                          padding: 5mm 6mm !important; 
                          width: 297mm !important; 
                          max-width: 297mm !important; 
                          height: 210mm !important;
                          max-height: 210mm !important;
                          min-height: 210mm !important;
                          border: none !important;
                          border-radius: 0 !important; 
                          display: flex !important;
                          flex-direction: column !important;
                          justify-content: space-between !important;
                          box-sizing: border-box !important;
                          overflow: hidden !important;
                          page-break-inside: avoid !important;
                          page-break-after: avoid !important;
                          break-inside: avoid !important;
                          break-after: avoid !important;
                      }
                    `}
                  </style>

                  {/* Top Bar / Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '2px solid #0f172a',
                      paddingBottom: '4px',
                      marginBottom: '4px',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapIcon size={18} color="#0f172a" />
                      <span style={{ fontSize: '11pt', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {isEvacuation ? 'PLANO DE EVACUACIÓN Y SALIDAS DE EMERGENCIA' : 'MAPA DE RIESGOS INTEGRAL'}
                      </span>
                    </div>
                    <div style={{ fontSize: '9pt', color: '#334155', fontWeight: 600 }}>
                      <span>{mapData?.empresa || 'EMPRESA'}</span> {mapData?.sector ? ` | ${mapData.sector}` : ''}
                    </div>
                  </div>

                  {/* Map Canvas Area (Fills maximum available space in A4 sheet) */}
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      width: '100%',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg
                      width="100%"
                      height="100%"
                      viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
                      preserveAspectRatio="xMinYMin meet"
                      style={{ display: 'block', width: '100%', height: '100%' }}
                    >
                      <defs>
                        <marker id="pdf-arrowhead" markerWidth="5" markerHeight="3.5" refX="4.2" refY="1.75" orient="auto">
                          <polygon points="0 0.4, 4.2 1.75, 0 3.1" fill="#0f172a" />
                        </marker>
                      </defs>

                      {/* Plain white background — no grid, clean professional look */}
                      <rect
                        x={viewBox.minX}
                        y={viewBox.minY}
                        width={viewBox.width}
                        height={viewBox.height}
                        fill="#ffffff"
                      />

                      {/* Optional background image (e.g. uploaded blueprint) */}
                      {mapData?.backgroundImage && (
                        <image
                          href={mapData.backgroundImage}
                          x={100}
                          y={100}
                          width={1100}
                          height={700}
                          opacity={0.8}
                          preserveAspectRatio="xMinYMin meet"
                        />
                      )}

                      {/* Architectural & Vector Elements */}
                      {mapData?.elements?.map(renderPdfSvgElement)}

                      {/* Safety / Emergency Icons */}
                      {mapData?.elements?.filter((el: any) => el.type === 'icon' && SAFETY_ICONS[el.iconId]).map((el: any) => {
                        const iconDef = SAFETY_ICONS[el.iconId];
                        const iconSize = el.width || el.size || 22;
                        // Correct fix: inject explicit width/height into the nested <svg> so its
                        // viewport is exactly iconSize×iconSize. Stripping svg tags loses fill/stroke attributes.
                        const rawSvg = (iconDef.svg || '').trim();
                        // Add width+height right after <svg (preserving all other attributes like fill, viewBox)
                        const sizedSvg = rawSvg.startsWith('<svg')
                          ? rawSvg.replace(/^<svg\s/, `<svg width="${iconSize}" height="${iconSize}" `)
                          : rawSvg;
                        const halfSize = iconSize / 2;
                        return (
                          <g
                            key={el.id}
                            transform={`translate(${el.x - halfSize}, ${el.y - halfSize}) rotate(${el.rotation || 0} ${halfSize} ${halfSize})`}
                          >
                            <rect
                              x={0}
                              y={0}
                              width={iconSize}
                              height={iconSize}
                              rx={3}
                              fill="none"
                              stroke="none"
                            />
                            <g dangerouslySetInnerHTML={{ __html: sizedSvg }} />
                          </g>
                        );
                      })}

                      {/* Text Labels */}
                      {mapData?.elements?.filter((el: any) => el.type === 'text').map((el: any) => (
                        <g
                          key={el.id}
                          transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}
                        >
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={el.color || '#0f172a'}
                            fontSize={el.fontSize || 16}
                            fontWeight="bold"
                            style={{ paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: '4px', strokeLinejoin: 'round' }}
                          >
                            {el.text}
                          </text>
                        </g>
                      ))}
                      {/* Emergency Phone Box — top-right corner of the map, in SVG coordinates */}
                      {(() => {
                        const phones = [
                          { label: 'Policía', num: '911' },
                          { label: 'Bomberos', num: '100' },
                          { label: 'Emerg. Médicas', num: '107' },
                          { label: 'Defensa Civil', num: '103' },
                          { label: 'Emerg. Eléctrica', num: '0800-333-3787' },
                          { label: 'Emerg. Gas', num: '0800-333-4444' },
                        ];
                        const boxW = 148;
                        const rowH = 11;
                        const boxH = 16 + phones.length * rowH + 4;
                        // Position in top-right of the viewBox
                        const bx = viewBox.minX + viewBox.width - boxW - 4;
                        const by = viewBox.minY + 4;
                        return (
                          <g key="emergency-box">
                            {/* Background */}
                            <rect x={bx} y={by} width={boxW} height={boxH} rx={3} fill="#fff7f7" stroke="#dc2626" strokeWidth={1.2} />
                            {/* Red header */}
                            <rect x={bx} y={by} width={boxW} height={15} rx={3} fill="#dc2626" />
                            <rect x={bx} y={by + 12} width={boxW} height={4} fill="#dc2626" />
                            <text x={bx + boxW / 2} y={by + 10} textAnchor="middle" fill="white" fontSize={7} fontWeight="bold" fontFamily="Arial,sans-serif">
                              ☎ TELÉFONOS DE EMERGENCIA
                            </text>
                            {/* Phone rows */}
                            {phones.map((p, i) => (
                              <g key={p.num} transform={`translate(${bx + 5}, ${by + 16 + i * rowH})`}>
                                <text x={0} y={8} fill="#334155" fontSize={6.5} fontFamily="Arial,sans-serif">{p.label}:</text>
                                <text x={boxW - 10} y={8} textAnchor="end" fill="#dc2626" fontSize={7} fontWeight="bold" fontFamily="monospace">{p.num}</text>
                              </g>
                            ))}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Footer: Referencias + Rótulo Oficial + Tarjeta Profesional H&S */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) 220px 270px',
                      gap: '6px',
                      marginTop: '4px',
                      height: '96px',
                      maxHeight: '96px',
                      flexShrink: 0,
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Referencias ISO 7010 / IRAM 10005 */}
                    <div
                      style={{
                        border: '2px solid #0f172a',
                        padding: '6px 8px',
                        fontSize: '8.5pt',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          marginBottom: '4px',
                          borderBottom: '1px solid #cbd5e1',
                          paddingBottom: '2px',
                          fontSize: '8pt',
                          letterSpacing: '0.04em',
                          color: '#0f172a'
                        }}
                      >
                        REFERENCIAS (Norma ISO 7010 / IRAM 10005)
                      </strong>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px 14px',
                          overflowY: 'auto',
                          alignItems: 'center'
                        }}
                      >
                        {legendIcons.map((icon) => (
                          <div key={icon.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1.5px solid ${icon.color}`,
                                borderRadius: '3px',
                                padding: '1px',
                                background: '#ffffff'
                              }}
                              dangerouslySetInnerHTML={{ __html: icon.svg }}
                            />
                            <span style={{ fontSize: '7.5pt', fontWeight: 600, color: '#1e293b' }}>{icon.label}</span>
                          </div>
                        ))}
                        {legendIcons.length === 0 && (
                          <span style={{ color: '#64748b', fontSize: '7.5pt', fontStyle: 'italic' }}>
                            No se han insertado pictogramas normalizados en este plano.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rótulo Oficial del Plano */}
                    <div
                      style={{
                        border: '2px solid #0f172a',
                        display: 'grid',
                        gridTemplateRows: 'auto 1fr',
                        fontSize: '7.5pt',
                        background: '#f8fafc',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Header del Rótulo */}
                      <div
                        style={{
                          background: isEvacuation ? '#16a34a' : '#0f172a',
                          color: '#ffffff',
                          padding: '3px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 'bold',
                          fontSize: '8pt',
                          letterSpacing: '0.03em'
                        }}
                      >
                        <MapIcon size={12} color="#ffffff" />
                        <span>{isEvacuation ? 'PLANO DE EVACUACIÓN' : 'MAPA DE RIESGOS'}</span>
                      </div>

                      {/* Datos y Logo de la Empresa */}
                      <div
                        style={{
                          padding: '4px 6px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          lineHeight: 1.2
                        }}
                      >
                        <div>
                          <div><strong>Empresa:</strong> {mapData?.empresa || 'N/A'}</div>
                          <div><strong>Sector:</strong> {mapData?.sector || 'N/A'}</div>
                          <div><strong>Fecha:</strong> {mapData?.fecha ? new Date(mapData.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}</div>
                          <div><strong>Escala:</strong> S/E (Esquemático)</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '2px' }}>
                          <CompanyLogo style={{ maxHeight: '22px', maxWidth: '120px', objectFit: 'contain' }} />
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta Oficial Profesional H&S (Estilo ATS / Checklist / Aptitudes Médicas) */}
                    <div
                      style={{
                        border: '2px solid #86efac',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                        position: 'relative',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Franja superior verde esmeralda */}
                      <div style={{ height: '3px', width: '100%', background: 'linear-gradient(to right, #10b981, #16a34a)' }} />

                      {/* Título de la tarjeta */}
                      <div
                        style={{
                          fontSize: '6.8pt',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          color: '#14532d',
                          letterSpacing: '0.03em',
                          textAlign: 'center',
                          paddingTop: '2px',
                          lineHeight: 1.1
                        }}
                      >
                        PROFESIONAL DE HIGIENE Y SEGURIDAD
                      </div>

                      {/* Contenedor de Firma y Sello Digital */}
                      <div
                        style={{
                          minHeight: '34px',
                          maxHeight: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          borderBottom: '1px dashed #bbf7d0',
                          padding: '1px 5px',
                          backgroundColor: '#ffffff',
                          borderRadius: '3px',
                          margin: '0 4px'
                        }}
                      >
                        {actSignature && (
                          <img
                            src={actSignature}
                            alt="Firma Digital"
                            style={{ maxHeight: '30px', maxWidth: '100px', objectFit: 'contain' }}
                          />
                        )}
                        {actStamp && (
                          <img
                            src={actStamp}
                            alt="Sello Digital"
                            style={{ maxHeight: '30px', maxWidth: '85px', objectFit: 'contain' }}
                          />
                        )}
                        {!actSignature && !actStamp && (
                          <div style={{ fontSize: '6.5pt', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                            Firma / Sello Digital
                          </div>
                        )}
                      </div>

                      {/* Datos y Matrícula del Profesional */}
                      <div
                        style={{
                          padding: '1px 4px 2px 4px',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '1px'
                        }}
                      >
                        <div
                          style={{
                            fontSize: '6.8pt',
                            fontWeight: 900,
                            color: '#14532d',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            lineHeight: 1.1
                          }}
                        >
                          {actName || 'Firma y Sello H&S'}
                        </div>
                        <div
                          style={{
                            fontSize: '5.8pt',
                            fontWeight: 700,
                            color: '#15803d',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            lineHeight: 1.1
                          }}
                        >
                          {actTitle}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '1px' }}>
                          {actLic ? (
                            <span
                              style={{
                                padding: '1px 6px',
                                backgroundColor: '#15803d',
                                color: '#ffffff',
                                borderRadius: '3px',
                                fontWeight: 900,
                                fontSize: '6pt',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase'
                              }}
                            >
                              Mat. N° {actLic}
                            </span>
                          ) : (
                            <span
                              style={{
                                padding: '1px 5px',
                                backgroundColor: '#e2e8f0',
                                color: '#475569',
                                borderRadius: '3px',
                                fontWeight: 800,
                                fontSize: '5.5pt'
                              }}
                            >
                              Mat. Registrada
                            </span>
                          )}
                          <span style={{ fontSize: '5.5pt', color: '#166534', fontWeight: 800 }}>
                            🔒 FIRMA DIGITAL H&amp;S
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    );
}