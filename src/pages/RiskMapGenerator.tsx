import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import html2canvas from 'html2canvas';
import {
  ArrowLeft, Save, Trash2, Printer, Image as ImageIcon,
  ZoomIn, ZoomOut, Download, Share2, Eye, EyeOff,
  Maximize2, HelpCircle, Layers, MousePointer2, Move, Map as MapIcon } from
'lucide-react';
import ShareModal from '../components/ShareModal';
import RiskMapPdfGenerator from '../components/RiskMapPdfGenerator';
import ConfirmModal from '../components/ConfirmModal';
import MapPropertiesPanel from '../components/MapPropertiesPanel';
import MapHelpPanel from '../components/MapHelpPanel';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import { SAFETY_ICONS } from '../data/mapIcons';
import PremiumHeader from '../components/PremiumHeader';

// ─── Layer helpers ─────────────────────────────────────────────────────────
const getLayer = (el) => {

  if (['line', 'rect', 'circle', 'arrow', 'polyline'].includes(el.type)) return 'structure';
  if (el.type === 'icon') return 'signage';
  return 'annotations';
};

export default function RiskMapGenerator(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  useDocumentTitle('Creador de Mapas de Riesgo');
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { syncCollection } = useSync();
  const editData = location.state?.editData;
  const containerRef = useRef(null);

  // ─── Meta ───────────────────────────────────────────────────────────────
  const [meta, setMeta] = useState({
    empresa: editData?.empresa || '',
    sector: editData?.sector || '',
    fecha: editData?.fecha || new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ─── Canvas state ───────────────────────────────────────────────────────
  const [elements, setElements] = useState<any[]>(editData?.elements || []);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(editData?.backgroundImage || null);
  const [history, setHistory] = useState<any[][]>([editData?.elements || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // ─── Editor state ───────────────────────────────────────────────────────
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isOrthoMode, setIsOrthoMode] = useState(false);
  const [isSnapToGrid, setIsSnapToGrid] = useState(true);
  const [drawingShape, setDrawingShape] = useState(null);
  const [polylinePoints, setPolylinePoints] = useState([]);
  const [polylinePreview, setPolylinePreview] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showShareModal, setShowShareModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ─── Panning state ───────────────────────────────────────────────────────
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // ─── View settings ──────────────────────────────────────────────────────
  const [lineStyle, setLineStyle] = useState('solid');
  const [isBlueprintMode, setIsBlueprintMode] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [layers, setLayers] = useState({ structure: true, signage: true, annotations: true });
  const [activeLeftTab, setActiveLeftTab] = useState('icons'); // 'icons' | 'layers' | 'help'

  // ─── Categories ─────────────────────────────────────────────────────────
  const categories = {
    'Estructura': [SAFETY_ICONS.LINE, SAFETY_ICONS.RECTANGLE],
    'Rutas': [SAFETY_ICONS.YOU_ARE_HERE, SAFETY_ICONS.ARROW_LINE, SAFETY_ICONS.TEXT_LABEL],
    'Fuego (Rojos)': Object.values(SAFETY_ICONS).filter((i) => i.type === 'fire'),
    'Riesgos (Amarillos)': Object.values(SAFETY_ICONS).filter((i) => i.type === 'warning'),
    'Escape (Verdes)': Object.values(SAFETY_ICONS).filter((i) => i.type === 'escape')
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const snap = (v) => isSnapToGrid ? Math.round(v / 20) * 20 : v;

  const getCoords = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    // Restamos el panOffset de la coordenada del puntero para que dibuje exactamente donde apunta
    const x = (clientX - rect.left - panOffset.x) / zoom;
    const y = (clientY - rect.top - panOffset.y) / zoom;
    return { x: snap(x), y: snap(y) };
  };

  const addToHistory = (newEls) => {
    const h = history.slice(0, historyIndex + 1);
    h.push(newEls);
    if (h.length > 50) h.shift();
    setHistory(h);
    setHistoryIndex(h.length - 1);
    setElements(newEls);
  };

  const undo = () => {if (historyIndex > 0) {const i = historyIndex - 1;setHistoryIndex(i);setElements(history[i]);}};
  const redo = () => {if (historyIndex < history.length - 1) {const i = historyIndex + 1;setHistoryIndex(i);setElements(history[i]);}};

  const selectedElement = elements.find((e) => e.id === selectedElementId) || null;
  const visibleElements = elements.filter((el) => layers[getLayer(el)]);

  // ─── Zoom on wheel ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      setZoom((z) => Math.min(3, Math.max(0.2, z + (e.deltaY < 0 ? 0.1 : -0.1))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ─── Keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      if (e.shiftKey) setIsOrthoMode(true);
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {e.preventDefault();undo();}
        if (e.key === 'y') {e.preventDefault();redo();}
        return;
      }
      if (e.key === 's' && !editingTextId) setSelectedTool('select');
      if (e.key === 'h' && !editingTextId) setSelectedTool('pan');
      if (e.key === '=' || e.key === '+') setZoom((z) => Math.min(3, z + 0.1));
      if (e.key === '-') setZoom((z) => Math.max(0.2, z - 0.1));
      if (editingTextId) return;
      if (selectedElementId) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          addToHistory(elements.filter((el) => el.id !== selectedElementId));
          setSelectedElementId(null);
        }
        if (e.key === 'r' || e.key === 'R') {
          addToHistory(elements.map((el) => el.id === selectedElementId ? { ...el, rotation: ((el.rotation || 0) + 45) % 360 } : el));
        }
      }
      if (e.key === 'Escape') {
        if (polylinePoints.length > 0) {
          if (polylinePoints.length >= 2) commitPolyline(polylinePoints);
          setPolylinePoints([]);
          setPolylinePreview(null);
        }
        setSelectedTool('select');
      }
    };
    const up = (e) => {if (!e.shiftKey) setIsOrthoMode(false);};
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {window.removeEventListener('keydown', down);window.removeEventListener('keyup', up);};
  }, [selectedElementId, elements, editingTextId, historyIndex, history, polylinePoints]);

  // ─── Mouse handlers ──────────────────────────────────────────────────────
  const handleCanvasMouseDown = (e) => {
    const { x, y } = getCoords(e);

    // Si la herramienta activa es 'pan' o es el botón del medio, paneamos
    if (selectedTool === 'pan' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const drawTools = ['ARROW_LINE', 'LINE', 'RECTANGLE', 'CIRCLE'];
    if (drawTools.includes(selectedTool)) {
      setDrawingShape({ type: selectedTool, startX: x, startY: y, endX: x, endY: y });
    }
  };

  const handleElementMouseDown = (e, id, elX, elY) => {
    e.stopPropagation();
    if (selectedTool !== 'select') return;
    if (elements.find((el) => el.id === id)?.locked) return;
    setSelectedElementId(id);
    setIsDragging(true);
    const { x, y } = getCoords(e);
    setDragOffset({ x: x - elX, y: y - elY });
  };

  const applyOrtho = (x, y, sx, sy) => {
    if (isOrthoMode || false) {
      const dx = Math.abs(x - sx),dy = Math.abs(y - sy);
      return dx > dy ? { x, y: sy } : { x: sx, y };
    }
    return { x, y };
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset((p) => ({ x: p.x + dx, y: p.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    let { x, y } = getCoords(e);
    setCursorPos({ x: Math.round(x), y: Math.round(y) });

    if (drawingShape) {
      const ortho = isOrthoMode || e.shiftKey;
      if (ortho) {
        const dx = Math.abs(x - drawingShape.startX),dy = Math.abs(y - drawingShape.startY);
        if (dx > dy) y = drawingShape.startY;else x = drawingShape.startX;
      }
      setDrawingShape((p) => ({ ...p, endX: x, endY: y }));
      return;
    }

    if (polylinePoints.length > 0) {
      setPolylinePreview({ x, y });
    }

    if (!isDragging || !selectedElementId) return;
    setElements((els) => els.map((el) =>
    el.id === selectedElementId && !['arrow', 'line', 'rect', 'circle', 'polyline'].includes(el.type) ?
    { ...el, x: x - dragOffset.x, y: y - dragOffset.y } : el
    ));
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (drawingShape) {
      const dx = drawingShape.endX - drawingShape.startX;
      const dy = drawingShape.endY - drawingShape.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        let type = 'arrow';
        if (drawingShape.type === 'LINE') type = 'line';
        if (drawingShape.type === 'RECTANGLE') type = 'rect';
        if (drawingShape.type === 'CIRCLE') type = 'circle';
        const color = SAFETY_ICONS[drawingShape.type]?.color || '#374151';
        const newEl = {
          id: Date.now(), type, color, strokeWidth: 3, lineStyle, opacity: 1,
          startX: drawingShape.startX, startY: drawingShape.startY,
          endX: drawingShape.endX, endY: drawingShape.endY
        };
        addToHistory([...elements, newEl]);
      }
      setDrawingShape(null);
    }
    setIsDragging(false);
  };

  const commitPolyline = (pts) => {
    if (pts.length < 2) return;
    addToHistory([...elements, { id: Date.now(), type: 'polyline', points: [...pts], color: '#374151', strokeWidth: 3, lineStyle, opacity: 1 }]);
  };

  const handleCanvasClick = (e) => {
    if (isDragging) {setIsDragging(false);return;}
    const { x, y } = getCoords(e);

    // Polyline tool
    if (selectedTool === 'POLYLINE') {
      setPolylinePoints((pts) => [...pts, { x, y }]);
      return;
    }

    // Check hit elements
    let clicked = null;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (!layers[getLayer(el)]) continue;
      if (['line', 'rect', 'circle', 'arrow', 'polyline'].includes(el.type)) continue;
      const sz = 24;
      if (x >= el.x - sz && x <= el.x + sz && y >= el.y - sz && y <= el.y + sz) {clicked = el;break;}
    }

    if (clicked) {
      if (selectedTool === 'select') setSelectedElementId(clicked.id);
      return;
    }
    setSelectedElementId(null);
    setEditingTextId(null);

    if (!selectedTool || selectedTool === 'select' || selectedTool === 'pan') return;
    if (['ARROW_LINE', 'LINE', 'RECTANGLE', 'CIRCLE', 'POLYLINE'].includes(selectedTool)) return;
    if (selectedTool === 'TEXT_LABEL') {
      const id = Date.now();
      addToHistory([...elements, { id, type: 'text', text: 'Doble clic para editar', x, y, color: '#0f172a', rotation: 0, opacity: 1 }]);
      setSelectedElementId(id);
      setSelectedTool('select');
    } else {
      const icon = SAFETY_ICONS[selectedTool];
      if (icon) addToHistory([...elements, { id: Date.now(), type: 'icon', iconId: icon.id, x, y, color: icon.color, rotation: 0, opacity: 1 }]);
    }
  };

  const handleCanvasDoubleClick = (e) => {
    if (selectedTool === 'POLYLINE' && polylinePoints.length >= 2) {
      commitPolyline(polylinePoints);
      setPolylinePoints([]);
      setPolylinePreview(null);
      setSelectedTool('select');
      return;
    }
  };

  const handleLineStyleChange = (style: string) => {
    setLineStyle(style);
    if (selectedElementId) {
      handleUpdateSelected({ lineStyle: style });
    }
  };

  // ─── Properties panel updates ────────────────────────────────────────────
  const handleUpdateSelected = (patch) => {
    addToHistory(elements.map((el) => el.id === selectedElementId ? { ...el, ...patch } : el));
  };
  const handleDeleteSelected = () => {
    addToHistory(elements.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
  };
  const handleDuplicateSelected = () => {
    if (!selectedElement) return;
    const newEl = { ...selectedElement, id: Date.now(), x: (selectedElement.x || 0) + 30, y: (selectedElement.y || 0) + 30 };
    if (newEl.startX !== undefined) {newEl.startX += 30;newEl.startY += 30;newEl.endX += 30;newEl.endY += 30;}
    addToHistory([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  // ─── Other actions ───────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result;
      if (typeof res === 'string') {
        setBackgroundImage(res);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearCanvas = () => {
    setShowClearConfirm(true);
  };

  const confirmClearCanvas = () => {
    setElements([]);
    setBackgroundImage(null);
    setSelectedElementId(null);
    setShowClearConfirm(false);
  };

  const fitToScreen = () => {setZoom(0.6);};

  const handleTextDoubleClick = (id, text) => {
    if (selectedTool !== 'select') return;
    setEditingTextId(id);setTextInputValue(text);
  };
  const handleTextSave = () => {
    if (editingTextId) {setElements((els) => els.map((el) => el.id === editingTextId ? { ...el, text: textInputValue || 'Texto vacío' } : el));setEditingTextId(null);}
  };

  const doSave = () => {
    if (!meta.empresa || !meta.sector) {toast.error('Completá Empresa y Sector antes de guardar.');return;}

    // ID más robusto (randomUUID o fallback aleatorio)
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return `map_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    };

    const mapData = {
      id: editData?.id || generateId(),
      ...meta,
      elements,
      backgroundImage,
      createdAt: editData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let hist = JSON.parse(localStorage.getItem('risk_map_history') || '[]');
    hist = editData ? hist.map((it) => it.id === editData.id ? mapData : it) : [mapData, ...hist];
    localStorage.setItem('risk_map_history', JSON.stringify(hist));
    syncCollection('risk_map_history', hist);

    if (!currentUser) {
      toast('Mapa guardado localmente (Inicie sesión para respaldar en la nube)', {
        icon: '⚠️',
        duration: 4000
      });
    } else {
      toast.success(editData ? 'Mapa actualizado y sincronizado.' : 'Mapa guardado y sincronizado.');
    }

    navigate('/risk-maps-history');
  };


  const handleSave = () => doSave();

  const handleExportPNG = () => requirePro(async () => {
    if (!containerRef.current) return;
    toast.loading('Generando imagen...', { id: 'exp' });
    try {
      const area = containerRef.current.querySelector('[data-canvas-area]');
      const canvas = await html2canvas(area || containerRef.current, { useCORS: true, scale: 2, backgroundColor: isBlueprintMode ? '#0f172a' : '#fff' });
      const a = document.createElement('a');
      a.download = `Mapa_${meta.empresa || 'HYS'}_${new Date().toISOString().split('T')[0]}.png`;
      a.href = canvas.toDataURL('image/png');a.click();
      toast.success('PNG exportado.', { id: 'exp' });
    } catch {toast.error('Error al exportar.', { id: 'exp' });}
  });

  // ─── SVG element rendering ───────────────────────────────────────────────
  const renderSvgElement = (el) => {
    const isSel = el.id === selectedElementId;
    const dashArr = el.lineStyle === 'dashed' ? '10,5' : 'none';
    const stroke = isSel ? '#3b82f6' : el.color;
    const sw = el.strokeWidth || 3;
    const selProps = { style: { pointerEvents: 'stroke' as any, cursor: 'pointer' }, onPointerDown: (e) => {e.stopPropagation();setSelectedElementId(el.id);} };

    if (el.type === 'rect') {
      const rx = Math.min(el.startX, el.endX),ry = Math.min(el.startY, el.endY);
      return <rect key={el.id} x={rx} y={ry} width={Math.abs(el.endX - el.startX)} height={Math.abs(el.endY - el.startY)}
      stroke={stroke} strokeWidth={isSel ? sw + 2 : sw} strokeDasharray={dashArr}
      fill={el.fillColor || 'transparent'} opacity={el.opacity ?? 1} {...selProps} />;
    }
    if (el.type === 'circle') {
      const cx = (el.startX + el.endX) / 2,cy = (el.startY + el.endY) / 2;
      const rx = Math.abs(el.endX - el.startX) / 2,ry = Math.abs(el.endY - el.startY) / 2;
      return <ellipse key={el.id} cx={cx} cy={cy} rx={rx || 1} ry={ry || 1}
      stroke={stroke} strokeWidth={isSel ? sw + 2 : sw} strokeDasharray={dashArr}
      fill={el.fillColor || 'transparent'} opacity={el.opacity ?? 1} {...selProps} />;
    }
    if (el.type === 'polyline') {
      const pts = el.points.map((p) => `${p.x},${p.y}`).join(' ');
      return <polyline key={el.id} points={pts} stroke={stroke} strokeWidth={isSel ? sw + 2 : sw}
      strokeDasharray={dashArr} fill="none" opacity={el.opacity ?? 1} {...selProps} />;
    }
    // line / arrow
    return <line key={el.id} x1={el.startX} y1={el.startY} x2={el.endX} y2={el.endY}
    stroke={stroke} strokeWidth={isSel ? sw + 2 : sw} strokeDasharray={dashArr}
    markerEnd={el.type === 'arrow' ? 'url(#arrowhead)' : ''}
    opacity={el.opacity ?? 1} {...selProps} />;
  };

  // ─── Drawing preview dimension ────────────────────────────────────────────
  const getDimLabel = () => {
    if (!drawingShape) return null;
    const dx = drawingShape.endX - drawingShape.startX,dy = drawingShape.endY - drawingShape.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (drawingShape.type === 'RECTANGLE') {
      return `${(Math.abs(dx) / 40).toFixed(1)}m × ${(Math.abs(dy) / 40).toFixed(1)}m`;
    }
    if (drawingShape.type === 'CIRCLE') {
      return `r=${((Math.abs(dx) + Math.abs(dy)) / 2 / 40).toFixed(1)}m`;
    }
    return `${(dist / 40).toFixed(2)}m`;
  };

  // ─── Toolbar buttons ──────────────────────────────────────────────────────
  const toolBtnStyle = (active: boolean, color = '#3b82f6') => ({
    padding: '7px 11px',
    borderRadius: 10,
    border: active ? `1.5px solid ${color}` : '1.5px solid var(--color-border)',
    background: active
      ? `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
      : 'var(--color-surface)',
    color: active ? '#fff' : 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '0.72rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    transition: 'all 0.18s',
    boxShadow: active ? `0 2px 8px ${color}44` : 'none',
    transform: 'scale(1)',
  });

  const gridBg = isBlueprintMode
    ? 'linear-gradient(to right,#334155 1px,transparent 1px),linear-gradient(to bottom,#334155 1px,transparent 1px)'
    : 'linear-gradient(to right,#e2e8f0 1px,transparent 1px),linear-gradient(to bottom,#e2e8f0 1px,transparent 1px)';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="container pb-20 min-h-screen flex flex-col">
            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Compartir Mapa de Riesgos"
        text={`🗺️ Mapa: ${meta.empresa}\n📍 Sector: ${meta.sector}\n⚠️ Elementos: ${elements.length}\n\nAsistente HYS`}
        rawMessage={`🗺️ Mapa: ${meta.empresa}\n📍 Sector: ${meta.sector}\n⚠️ Elementos: ${elements.length}\n\nAsistente HYS`}
        elementIdToPrint="pdf-content"
        fileName={`Mapa_${meta.empresa}.pdf`} />
      

            <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearCanvas}
        title="¿Borrar todo el mapa?"
        message="Esta acción eliminará todos los elementos y el plano base. No se puede deshacer."
        iconEmoji="🗑️" />
      



            <div className="no-print flex flex-col gap-6">
                <PremiumHeader
          title={editData ? 'Editar Mapa' : 'Nuevo Mapa'}
          subtitle="Editor de Mapa de Riesgos"
          icon={<MapIcon size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
        

                <div className="flex justify-between items-center flex-wrap gap-4">
                    <></>
                    
                    <button onClick={clearCanvas} className="btn-outline hover-lift flex items-center gap-2 m-0 px-4 py-2 border border-red-500/30 text-red-500 rounded-xl font-bold">
                        <Trash2 size={16} /> Borrar Todo
                    </button>
                </div>

                {/* Metadata bar */}
                <div className="glass-card animate-fade-in p-[1.25rem_1.5rem] flex gap-[1.5rem] flex-wrap items-end border-[1px_solid_var(--glass-border)] rounded-[16px]">
                    <div className="flex-auto min-w-[200px]">
                        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 block">Empresa / Cliente *</label>
                        <input type="text" value={meta.empresa} onChange={(e) => setMeta({ ...meta, empresa: e.target.value })} placeholder="Ej. Planta Modelo" className="p-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-base outline-none transition-all box-border focus:border-indigo-500" />
                    </div>
                    <div className="flex-auto min-w-[200px]">
                        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 block">Sector / Planta *</label>
                        <input type="text" value={meta.sector} onChange={(e) => setMeta({ ...meta, sector: e.target.value })} placeholder="Ej. Nave 1 - Producción" className="p-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-base outline-none transition-all box-border focus:border-indigo-500" />
                    </div>
                    <div className="flex gap-[0.75rem] items-center flex-wrap">
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.85rem 1.25rem',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                            transition: 'all 0.3s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          className="hover-lift m-[0]"
                          onClick={() => document.getElementById('bg-upload').click()}
                        >
                            <ImageIcon size={18} /> Subir Plano Base
                        </button>
                        <input type="file" id="bg-upload" accept="image/*" onChange={handleImageUpload} className="none" />
                        {backgroundImage && (
                          <button
                            style={{
                              padding: '0.75rem 1.25rem',
                              background: '#fef2f2',
                              color: '#ef4444',
                              border: '1px solid #fee2e2',
                              fontWeight: 700,
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            onClick={() => setBackgroundImage(null)}
                          >
                            ✕ Quitar plano
                          </button>
                        )}
                    </div>
                </div>

                {/* ─── Main 3-column layout ─── */}
                <div className="flex gap-[1rem] min-h-[680px] flex-wrap w-[100%]">

                    {/* ── LEFT SIDEBAR ── */}
                    <div className="card flex-auto min-w-[250px] max-w-full p-0 flex flex-col overflow-hidden m-0" style={{ background: 'var(--color-surface)' }}>
                        {/* Tab bar — modern pill style */}
                        <div className="flex p-2 gap-1" style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                            {([['icons', '🎨 Íconos'], ['layers', '☰ Capas'], ['help', '❓ Ayuda']] as [string, string][]).map(([id, label]) =>
              <button key={id} onClick={() => setActiveLeftTab(id)}
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: '0.67rem',
                fontWeight: 800,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s',
                background: activeLeftTab === id
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'transparent',
                color: activeLeftTab === id ? '#fff' : 'var(--color-text-muted)',
                boxShadow: activeLeftTab === id ? '0 2px 8px rgba(59,130,246,0.35)' : 'none',
              }}>
                                    {label}
                                </button>
              )}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* ── ICONS TAB ── */}
                            {activeLeftTab === 'icons' &&
              <div className="p-3 flex flex-col gap-3">

                                    {/* Pro Settings — glassmorphism card */}
                                    <div style={{
                                      background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.05) 100%)',
                                      border: '1.5px solid rgba(99,102,241,0.2)',
                                      borderRadius: 12,
                                      padding: '10px 12px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                          <div style={{
                                            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                                            borderRadius: 6,
                                            width: 20, height: 20,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11
                                          }}>⚙️</div>
                                          <span style={{ fontSize: '0.67rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6366f1' }}>Ajustes PRO</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {/* Estilo de línea — pill toggle */}
                                            <div>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estilo de Línea</div>
                                                <div style={{ display: 'flex', gap: 4, background: 'var(--color-background)', borderRadius: 10, padding: 3 }}>
                                                    {[['solid', 'Sólida', '─'], ['dashed', 'Punteada', '╌']].map(([val, lbl, sym]) => (
                                                      <button key={val} onClick={() => handleLineStyleChange(val)}
                                                        style={{
                                                          flex: 1, padding: '5px 6px',
                                                          borderRadius: 8, border: 'none', cursor: 'pointer',
                                                          fontSize: '0.7rem', fontWeight: 700,
                                                          transition: 'all 0.18s',
                                                          background: lineStyle === val ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                                                          color: lineStyle === val ? '#fff' : 'var(--color-text-muted)',
                                                          boxShadow: lineStyle === val ? '0 2px 6px rgba(59,130,246,0.3)' : 'none',
                                                        }}>{sym} {lbl}</button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Toggle switches modernos */}
                                            {[
                                              { label: '🗺 Modo Blueprint', value: isBlueprintMode, onChange: (v: boolean) => setIsBlueprintMode(v) },
                                              { label: '📐 Dimensiones en vivo', value: showDimensions, onChange: (v: boolean) => setShowDimensions(v) },
                                            ].map(({ label, value, onChange }) => (
                                              <div key={label} onClick={() => onChange(!value)}
                                                style={{
                                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                  cursor: 'pointer', padding: '6px 8px',
                                                  borderRadius: 8,
                                                  background: value ? 'rgba(59,130,246,0.08)' : 'transparent',
                                                  border: value ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                                                  transition: 'all 0.2s',
                                                }}>
                                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: value ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{label}</span>
                                                  {/* Toggle pill */}
                                                  <div style={{
                                                    width: 34, height: 18, borderRadius: 999,
                                                    background: value ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--color-border)',
                                                    position: 'relative', transition: 'all 0.22s',
                                                    flexShrink: 0,
                                                    boxShadow: value ? '0 2px 6px rgba(59,130,246,0.4)' : 'none',
                                                  }}>
                                                    <div style={{
                                                      position: 'absolute', top: 2, left: value ? 18 : 2,
                                                      width: 14, height: 14, borderRadius: '50%',
                                                      background: '#fff',
                                                      transition: 'all 0.22s',
                                                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                                                    }} />
                                                  </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tools — improved grid */}
                                    <div style={{
                                      background: 'var(--color-background)',
                                      border: '1.5px solid var(--color-border)',
                                      borderRadius: 12,
                                      padding: '10px 12px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                          <div style={{
                                            background: 'linear-gradient(135deg, #374151, #1f2937)',
                                            borderRadius: 6, width: 20, height: 20,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11
                                          }}>🛠</div>
                                          <span style={{ fontSize: '0.67rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>Herramientas</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <button onClick={() => setSelectedTool('select')} style={toolBtnStyle(selectedTool === 'select', '#3b82f6')} title="Selección (S)"><MousePointer2 size={13} /> Selec.</button>
                                            <button onClick={() => setSelectedTool('pan')} style={toolBtnStyle(selectedTool === 'pan', '#0284c7')} title="Paneo (H)"><Move size={13} /> Paneo</button>
                                            <button onClick={() => setSelectedTool('LINE')} style={toolBtnStyle(selectedTool === 'LINE', '#475569')} title="Línea/Pared">╱ Línea</button>
                                            <button onClick={() => setSelectedTool('RECTANGLE')} style={toolBtnStyle(selectedTool === 'RECTANGLE', '#475569')} title="Rectángulo">▭ Rect.</button>
                                            <button onClick={() => setSelectedTool('CIRCLE')} style={toolBtnStyle(selectedTool === 'CIRCLE', '#475569')} title="Círculo/Elipse">○ Círculo</button>
                                            <button onClick={() => {setSelectedTool('POLYLINE');setPolylinePoints([]);}} style={toolBtnStyle(selectedTool === 'POLYLINE', '#475569')} title="Polilínea">⟍ Polilínea</button>
                                            <button onClick={() => setSelectedTool('ARROW_LINE')} style={toolBtnStyle(selectedTool === 'ARROW_LINE', '#2563eb')} title="Ruta de Escape">→ Flecha</button>
                                            <button onClick={() => setSelectedTool('TEXT_LABEL')} style={toolBtnStyle(selectedTool === 'TEXT_LABEL', '#7c3aed')} title="Texto">T Texto</button>
                                        </div>
                                        {selectedTool === 'POLYLINE' && polylinePoints.length > 0 &&
                  <div style={{ marginTop: 8, fontSize: '0.7rem', color: '#3b82f6', background: 'rgba(59,130,246,0.08)', padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
                                                ✏️ {polylinePoints.length} nodo(s) — doble clic o Esc para terminar
                                            </div>
                  }
                                    </div>

                                    {/* Icon Library — improved with colored badge */}
                                    {Object.entries(categories).map(([cat, icons]) => {
                                      const catColors: Record<string, string> = {
                                        'Estructura': '#475569',
                                        'Rutas': '#2563eb',
                                        'Fuego (Rojos)': '#dc2626',
                                        'Riesgos (Amarillos)': '#d97706',
                                        'Escape (Verdes)': '#16a34a',
                                      };
                                      const catColor = catColors[cat] || '#64748b';
                                      return (
                <div key={cat} style={{ marginBottom: 2 }}>
                                            <div style={{
                                              fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase',
                                              letterSpacing: '0.07em', marginBottom: 6,
                                              display: 'flex', alignItems: 'center', gap: 5,
                                            }}>
                                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                                              <span style={{ color: catColor }}>{cat}</span>
                                            </div>
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {icons.map((icon) =>
                    <button key={icon.id} onClick={() => setSelectedTool(icon.id)} title={icon.label}
                    style={{
                      border: selectedTool === icon.id ? `2px solid ${icon.color}` : '1.5px solid var(--color-border)',
                      background: selectedTool === icon.id ? `${icon.color}22` : 'var(--color-background)',
                      borderRadius: 8,
                      padding: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      aspectRatio: '1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: selectedTool === icon.id ? `0 2px 8px ${icon.color}44` : 'none',
                      transform: selectedTool === icon.id ? 'scale(1.08)' : 'scale(1)',
                    }}>
                                                        <div style={{ color: icon.color, width: 20, height: 20 }} dangerouslySetInnerHTML={{ __html: icon.svg }} />
                                                    </button>
                    )}
                                            </div>
                                        </div>
                      );
                    })}

                                    {/* Keyboard hints */}
                                    <div style={{
                                      background: 'var(--color-background)',
                                      border: '1.5px solid var(--color-border)',
                                      borderRadius: 10,
                                      padding: '8px 10px',
                                      fontSize: '0.67rem',
                                      color: 'var(--color-text-muted)',
                                      lineHeight: 1.75,
                                    }}>
                                        <div style={{ fontWeight: 800, marginBottom: 3, color: 'var(--color-text)' }}>⌨️ Atajos de teclado</div>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>S — Seleccionar | H — Paneo</span><br />
                                        Ctrl+Z / Ctrl+Y — Deshacer/Rehacer<br />
                                        Shift — Líneas rectas (Ortho)<br />
                                        R — Rotar | Supr — Borrar | Rueda — Zoom
                                    </div>
                                </div>
              }

                            {/* ── LAYERS TAB ── */}
                            {activeLeftTab === 'layers' &&
              <div className="p-[0.75rem] flex flex-col gap-[0.6rem]">
                                    <div className="text-[0.65rem] font-[800] uppercase text-[var(--color-primary)] mb-[0.25rem]">Visibilidad de Capas</div>
                                    {[
                { id: 'structure', label: '🏗️ Estructura', desc: 'Líneas, rectángulos, círculos, polilíneas, flechas' },
                { id: 'signage', label: '⚠️ Señalética', desc: 'Íconos ISO: extintor, salida, riesgo eléctrico, etc.' },
                { id: 'annotations', label: '✏️ Anotaciones', desc: 'Etiquetas de texto, indicadores de posición' }].
                map((layer) =>
                <div key={layer.id} className="p-[0.75rem] bg-[var(--color-background)] rounded-[10] border-[1px_solid_var(--color-border)]">
                                            <div className="flex items-center justify-space-between mb-[0.25rem]">
                                                <strong className="text-[0.75rem]">{layer.label}</strong>
                                                <button onClick={() => setLayers((l) => ({ ...l, [layer.id]: !l[layer.id] }))}
                    style={{ color: layers[layer.id] ? 'var(--color-primary)' : 'var(--color-text-muted)' }} className="bg-[none] border-none cursor-pointer p-[2px_4px]">
                                                    {layers[layer.id] ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                            </div>
                                            <div className="text-[0.68rem] text-[var(--color-text-muted)]">{layer.desc}</div>
                                            <div style={{ color: layers[layer.id] ? '#16a34a' : '#6b7280' }} className="mt-[0.3rem] text-[0.68rem] font-[700]">
                                                {layers[layer.id] ? '👁 Visible' : '🚫 Oculta'}
                                            </div>
                                        </div>
                )}
                                    <div className="p-[0.75rem] bg-[rgba(59,130,246,0.06)] rounded-[8] border-[1px_solid_rgba(59,130,246,0.15)] text-[0.7rem] text-[var(--color-text-muted)]">
                                        💡 Las capas ocultas <strong>no se borran</strong>. Solo están invisibles en el canvas. Se guardan normalmente.
                                    </div>
                                </div>
              }

                            {/* ── HELP TAB ── */}
                            {activeLeftTab === 'help' && <MapHelpPanel />}
                        </div>
                    </div>

                    {/* ── CANVAS AREA ── */}
                    <div className="flex-[3_1_350px] flex flex-col gap-3 min-w-[300px] w-full">
                        {/* Canvas toolbar */}
                        <div className="flex justify-space-between items-center flex-wrap gap-[0.4rem]">
                            <div className="flex gap-[4]">
                                <button onClick={undo} title="Deshacer (Ctrl+Z)" disabled={historyIndex <= 0}
                style={{ ...toolBtnStyle(false), opacity: historyIndex <= 0 ? 0.4 : 1 }}>
                                    ↩ Desha.
                                </button>
                                <button onClick={redo} title="Rehacer (Ctrl+Y)" disabled={historyIndex >= history.length - 1}
                style={{ ...toolBtnStyle(false), opacity: historyIndex >= history.length - 1 ? 0.4 : 1 }}>
                                    ↪ Reha.
                                </button>
                            </div>
                            <div className="flex gap-[4] items-center">
                                <button onClick={() => setIsSnapToGrid(!isSnapToGrid)} style={toolBtnStyle(isSnapToGrid, '#0284c7')} title="Imán de cuadrícula">
                                    🧲 Imán
                                </button>
                                <button onClick={() => setIsOrthoMode(!isOrthoMode)} style={toolBtnStyle(isOrthoMode)} title="Modo ortogonal (también Shift)">
                                    📐 Ortho
                                </button>
                                <button onClick={fitToScreen} style={toolBtnStyle(false)} title="Ajustar a pantalla">
                                    <Maximize2 size={13} /> Ajustar
                                </button>
                                <div className="flex items-center gap-[2] ml-[4]">
                                    <button onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))} style={{ ...toolBtnStyle(false) }} className="p-[5px_7px]"><ZoomOut size={14} /></button>
                                    <span className="text-[0.75rem] font-[800] min-width-[40] text-center">{Math.round(zoom * 100)}%</span>
                                    <button onClick={() => setZoom((z) => Math.min(3, z + 0.1))} style={{ ...toolBtnStyle(false) }} className="p-[5px_7px]"><ZoomIn size={14} /></button>
                                </div>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div className="card flex-[1] overflow-[hidden] relative p-[0] min-h-[500] touch-action-[none]"
            ref={containerRef}
            style={{
              background: isBlueprintMode ? '#0f172a' : '#f1f5f9',
              cursor: selectedTool === 'pan' ? 'grab' : selectedTool === 'select' ? 'default' : 'crosshair',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.08)',
            }}
            onPointerMove={handleCanvasMouseMove}
            onPointerUp={handleCanvasMouseUp}
            onPointerLeave={handleCanvasMouseUp}
            onPointerDown={handleCanvasMouseDown}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}>

                            {/* Infinite canvas */}
                            <div data-canvas-area
              style={{
                transform: `scale(${zoom})`,
                backgroundColor: isBlueprintMode ? '#0f172a' : '#f1f5f9',
                backgroundImage: gridBg,
                backgroundSize: '20px 20px',
              }} className="w-[4000] h-[4000] absolute transform-origin-[0_0]">

                                {backgroundImage &&
                <img src={backgroundImage} alt="Fondo" style={{

                  opacity: isBlueprintMode ? 0.3 : 0.6,
                  filter: isBlueprintMode ? 'invert(1) grayscale(1)' : 'none'
                }} className="absolute top-[100] left-[100] max-w-[2000] pointer-events-[none]" />
                }

                                {/* Icons and Text (HTML layer) */}
                                {visibleElements.map((el) => {
                  if (el.type === 'icon') {
                    const iconDef = SAFETY_ICONS[el.iconId];
                    if (!iconDef) return null;
                    const isSel = el.id === selectedElementId;
                    return (
                      <div key={el.id}
                      onMouseDown={(e) => handleElementMouseDown(e, el.id, el.x, el.y)}
                      style={{
                        left: el.x, top: el.y,
                        transform: `translate(-50%,-50%) rotate(${el.rotation || 0}deg)`,
                        background: isBlueprintMode ? '#1e293b' : '#fff',

                        border: isSel ? '2px dashed #3b82f6' : `2px solid ${iconDef.color}`,
                        color: el.color || iconDef.color, cursor: el.locked ? 'not-allowed' : 'move',
                        opacity: el.opacity ?? 1, zIndex: isSel ? 100 : 10
                      }}
                      dangerouslySetInnerHTML={{ __html: iconDef.svg }} className="absolute w-[40] h-[40] rounded-[5] flex items-center justify-center" />);

                  }
                  if (el.type === 'text') {
                    const isSel = el.id === selectedElementId;
                    const isEd = editingTextId === el.id;
                    return (
                      <div key={el.id}
                      onMouseDown={(e) => !isEd && handleElementMouseDown(e, el.id, el.x, el.y)}
                      onDoubleClick={() => handleTextDoubleClick(el.id, el.text)}
                      style={{
                        left: el.x, top: el.y, transform: `translate(-50%,-50%) rotate(${el.rotation || 0}deg)`,
                        color: el.color || '#0f172a',
                        opacity: el.opacity ?? 1,
                        border: isSel ? '1px dashed #3b82f6' : '1px solid transparent',
                        cursor: el.locked ? 'not-allowed' : 'move', zIndex: isSel ? 100 : 10,
                        background: isSel ? 'rgba(59,130,246,0.05)' : 'transparent'
                      }} className="absolute p-[3px_7px] text-[15] font-[800] white-space-[nowrap]">
                                                {isEd ?
                        <input autoFocus value={textInputValue} onChange={(e) => setTextInputValue(e.target.value)}
                        onBlur={handleTextSave} onKeyDown={(e) => e.key === 'Enter' && handleTextSave()} className="bg-[white] border-[1px_solid_#3b82f6] text-[black] font-[800] text-[15]" /> :

                        el.text}
                                            </div>);

                  }
                  return null;
                })}

                                {/* SVG vector layer */}
                                <svg className="absolute top-[0] left-[0] w-[100%] h-[100%] z-[50] pointer-events-[none]">
                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                            <polygon points="0 0,10 3.5,0 7" fill="context-stroke" />
                                        </marker>
                                    </defs>
                                    <g className="pointer-events-[all]">
                                        {visibleElements.filter((el) => ['line', 'rect', 'circle', 'arrow', 'polyline'].includes(el.type)).map(renderSvgElement)}
                                    </g>

                                    {/* Drawing preview */}
                                    {drawingShape && (() => {
                    const c = 'var(--color-primary)',da = '8,4';
                    if (drawingShape.type === 'RECTANGLE') {
                      const rx = Math.min(drawingShape.startX, drawingShape.endX),ry = Math.min(drawingShape.startY, drawingShape.endY);
                      return <rect x={rx} y={ry} width={Math.abs(drawingShape.endX - drawingShape.startX)} height={Math.abs(drawingShape.endY - drawingShape.startY)} stroke={c} strokeWidth="2" fill="transparent" strokeDasharray={da} />;
                    }
                    if (drawingShape.type === 'CIRCLE') {
                      const cx = (drawingShape.startX + drawingShape.endX) / 2,cy = (drawingShape.startY + drawingShape.endY) / 2;
                      const rx = Math.abs(drawingShape.endX - drawingShape.startX) / 2,ry = Math.abs(drawingShape.endY - drawingShape.startY) / 2;
                      return <ellipse cx={cx} cy={cy} rx={rx || 1} ry={ry || 1} stroke={c} strokeWidth="2" fill="transparent" strokeDasharray={da} />;
                    }
                    return <line x1={drawingShape.startX} y1={drawingShape.startY} x2={drawingShape.endX} y2={drawingShape.endY} stroke={c} strokeWidth="2" strokeDasharray={da} markerEnd={drawingShape.type === 'ARROW_LINE' ? 'url(#arrowhead)' : ''} />;
                  })()}

                                    {/* Polyline in progress */}
                                    {polylinePoints.length > 0 && (() => {
                    const pts = polylinePoints.map((p) => `${p.x},${p.y}`).join(' ');
                    const preview = polylinePreview ? `${polylinePoints[polylinePoints.length - 1].x},${polylinePoints[polylinePoints.length - 1].y} ${polylinePreview.x},${polylinePreview.y}` : '';
                    return (
                      <g>
                                                <polyline points={pts} stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="none" fill="none" />
                                                {polylinePreview && <line x1={polylinePoints[polylinePoints.length - 1].x} y1={polylinePoints[polylinePoints.length - 1].y} x2={polylinePreview.x} y2={polylinePreview.y} stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="6,4" />}
                                                {polylinePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--color-primary)" />)}
                                            </g>);

                  })()}
                                </svg>

                                {/* Live dimension tooltip */}
                                {drawingShape && showDimensions &&
                <div style={{
                  left: drawingShape.endX + 12, top: drawingShape.endY - 28


                }} className="absolute bg-[rgba(15,23,42,0.85)] text-[#fff] p-[3px_10px] rounded-[6] text-[11] font-[700] z-[1000] pointer-events-[none] backdrop-filter-[blur(4px)]">
                                        {getDimLabel()}
                                    </div>
                }
                            </div>
                        </div>

                        {/* Status bar */}
                        <div style={{

              background: isBlueprintMode ? '#0f172a' : 'var(--color-surface)',
              color: isBlueprintMode ? '#94a3b8' : 'var(--color-text-muted)'
            }} className="flex items-center justify-space-between p-[0.35rem_0.75rem] rounded-[8] text-[0.7rem] border-[1px_solid_var(--color-border)] flex-wrap gap-[0.25rem]">
                            <span>X: <strong>{cursorPos.x}</strong> &nbsp;Y: <strong>{cursorPos.y}</strong> &nbsp;(px @ {Math.round(zoom * 100)}%)</span>
                            <span>{elements.length} elemento{elements.length !== 1 ? 's' : ''} en el mapa</span>
                            <span>Herramienta: <strong>{selectedTool}</strong></span>
                        </div>
                    </div>

                    {/* ── RIGHT PROPERTIES PANEL ── */}
                    <div className="card flex-[1_1_200px] min-width-[200px] max-w-[100%] p-[0] overflow-y-[auto] m-[0]">
                        <div className="p-[0.5rem_0.75rem] border-bottom-[1px_solid_var(--color-border)] text-[0.65rem] font-[800] uppercase text-[var(--color-text-muted)]">
                            Panel de Objeto
                        </div>
                        <MapPropertiesPanel
              element={selectedElement}
              onUpdate={handleUpdateSelected}
              onDelete={handleDeleteSelected}
              onDuplicate={handleDuplicateSelected} />
                    </div>
                </div>

                {/* Botonera de acciones inline — sin sobreponerse al lienzo de dibujo */}
                <div className="flex flex-wrap gap-3 justify-center mt-6 py-4 border-t border-slate-200 dark:border-slate-800 w-full">
                    <button
                      onClick={(e) => {e.preventDefault();requirePro(() => handleSave());}}
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16,185,129,0.2)', minWidth: '120px' }}
                      className="glow-button hover-lift px-6 py-3 border-none rounded-xl text-white flex items-center justify-center gap-2 font-bold text-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        <Save size={16} /> GUARDAR
                    </button>
                    <button
                      onClick={() => requirePro(() => setShowShareModal(true))}
                      style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 4px 12px rgba(59,130,246,0.2)', minWidth: '120px' }}
                      className="glow-button hover-lift px-6 py-3 border-none rounded-xl text-white flex items-center justify-center gap-2 font-bold text-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        <Share2 size={16} /> COMPARTIR
                    </button>
                    <button
                      onClick={() => requirePro(() => window.print())}
                      style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', boxShadow: '0 4px 12px rgba(139,92,246,0.2)', minWidth: '120px' }}
                      className="glow-button hover-lift px-6 py-3 border-none rounded-xl text-white flex items-center justify-center gap-2 font-bold text-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        <Printer size={16} /> IMPRIMIR
                    </button>
                    <button
                      onClick={handleExportPNG}
                      style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 12px rgba(245,158,11,0.2)', minWidth: '120px' }}
                      className="glow-button hover-lift px-6 py-3 border-none rounded-xl text-white flex items-center justify-center gap-2 font-bold text-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        <Download size={16} /> PNG
                    </button>
                </div>
            </div>

            <AdBanner />

            <div className="print-only">
                <RiskMapPdfGenerator data={{ ...meta, elements, backgroundImage }} onBack={() => {}} onShare={() => setShowShareModal(true)} />
            </div>
        </div>);

}