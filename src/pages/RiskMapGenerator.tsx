import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import html2canvas from 'html2canvas';
import {
    ArrowLeft, Save, Trash2, Printer, Image as ImageIcon,
    ZoomIn, ZoomOut, Download, Share2, Eye, EyeOff,
    Maximize2, HelpCircle, Layers, MousePointer2, Move
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import RiskMapPdfGenerator from '../components/RiskMapPdfGenerator';
import MapPropertiesPanel from '../components/MapPropertiesPanel';
import MapHelpPanel from '../components/MapHelpPanel';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import { SAFETY_ICONS } from '../data/mapIcons';

// ─── Layer helpers ─────────────────────────────────────────────────────────
const getLayer = (el) => {
    if (['line', 'rect', 'circle', 'arrow', 'polyline'].includes(el.type)) return 'structure';
    if (el.type === 'icon') return 'signage';
    return 'annotations';
};

export default function RiskMapGenerator(): React.ReactElement | null {
    useDocumentTitle('Creador de Mapas de Riesgo');
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();
    const { requirePro } = usePaywall();
    const editData = location.state?.editData;
    const containerRef = useRef(null);

    // ─── Meta ───────────────────────────────────────────────────────────────
    const [meta, setMeta] = useState({
        empresa: editData?.empresa || '',
        sector: editData?.sector || '',
        fecha: editData?.fecha || new Date().toISOString().split('T')[0]
    });

    // ─── Canvas state ───────────────────────────────────────────────────────
    const [elements, setElements] = useState(editData?.elements || []);
    const [backgroundImage, setBackgroundImage] = useState(editData?.backgroundImage || null);
    const [history, setHistory] = useState([editData?.elements || []]);
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
        'Fuego (Rojos)': Object.values(SAFETY_ICONS).filter(i => i.type === 'fire'),
        'Riesgos (Amarillos)': Object.values(SAFETY_ICONS).filter(i => i.type === 'warning'),
        'Escape (Verdes)': Object.values(SAFETY_ICONS).filter(i => i.type === 'escape'),
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
        return { x: snap((clientX - rect.left) / zoom), y: snap((clientY - rect.top) / zoom) };
    };

    const addToHistory = (newEls) => {
        const h = history.slice(0, historyIndex + 1);
        h.push(newEls);
        if (h.length > 50) h.shift();
        setHistory(h);
        setHistoryIndex(h.length - 1);
        setElements(newEls);
    };

    const undo = () => { if (historyIndex > 0) { const i = historyIndex - 1; setHistoryIndex(i); setElements(history[i]); } };
    const redo = () => { if (historyIndex < history.length - 1) { const i = historyIndex + 1; setHistoryIndex(i); setElements(history[i]); } };

    const selectedElement = elements.find(e => e.id === selectedElementId) || null;
    const visibleElements = elements.filter(el => layers[getLayer(el)]);

    // ─── Zoom on wheel ───────────────────────────────────────────────────────
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (e) => {
            e.preventDefault();
            setZoom(z => Math.min(3, Math.max(0.2, z + (e.deltaY < 0 ? 0.1 : -0.1))));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    // ─── Keyboard ────────────────────────────────────────────────────────────
    useEffect(() => {
        const down = (e) => {
            if (e.shiftKey) setIsOrthoMode(true);
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); undo(); }
                if (e.key === 'y') { e.preventDefault(); redo(); }
                return;
            }
            if (e.key === 's' && !editingTextId) setSelectedTool('select');
            if (e.key === 'h' && !editingTextId) setSelectedTool('pan');
            if (e.key === '=' || e.key === '+') setZoom(z => Math.min(3, z + 0.1));
            if (e.key === '-') setZoom(z => Math.max(0.2, z - 0.1));
            if (editingTextId) return;
            if (selectedElementId) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    addToHistory(elements.filter(el => el.id !== selectedElementId));
                    setSelectedElementId(null);
                }
                if (e.key === 'r' || e.key === 'R') {
                    addToHistory(elements.map(el => el.id === selectedElementId ? { ...el, rotation: ((el.rotation || 0) + 45) % 360 } : el));
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
        const up = (e) => { if (!e.shiftKey) setIsOrthoMode(false); };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, [selectedElementId, elements, editingTextId, historyIndex, history, polylinePoints]);

    // ─── Mouse handlers ──────────────────────────────────────────────────────
    const handleCanvasMouseDown = (e) => {
        const { x, y } = getCoords(e);
        const drawTools = ['ARROW_LINE', 'LINE', 'RECTANGLE', 'CIRCLE'];
        if (drawTools.includes(selectedTool)) {
            setDrawingShape({ type: selectedTool, startX: x, startY: y, endX: x, endY: y });
        }
    };

    const handleElementMouseDown = (e, id, elX, elY) => {
        e.stopPropagation();
        if (selectedTool !== 'select') return;
        if (elements.find(el => el.id === id)?.locked) return;
        setSelectedElementId(id);
        setIsDragging(true);
        const { x, y } = getCoords(e);
        setDragOffset({ x: x - elX, y: y - elY });
    };

    const applyOrtho = (x, y, sx, sy) => {
        if (isOrthoMode || false) {
            const dx = Math.abs(x - sx), dy = Math.abs(y - sy);
            return dx > dy ? { x, y: sy } : { x: sx, y };
        }
        return { x, y };
    };

    const handleCanvasMouseMove = (e) => {
        let { x, y } = getCoords(e);
        setCursorPos({ x: Math.round(x), y: Math.round(y) });

        if (drawingShape) {
            const ortho = (isOrthoMode || e.shiftKey);
            if (ortho) {
                const dx = Math.abs(x - drawingShape.startX), dy = Math.abs(y - drawingShape.startY);
                if (dx > dy) y = drawingShape.startY; else x = drawingShape.startX;
            }
            setDrawingShape(p => ({ ...p, endX: x, endY: y }));
            return;
        }

        if (polylinePoints.length > 0) {
            setPolylinePreview({ x, y });
        }

        if (!isDragging || !selectedElementId) return;
        setElements(els => els.map(el =>
            el.id === selectedElementId && !['arrow', 'line', 'rect', 'circle', 'polyline'].includes(el.type)
                ? { ...el, x: x - dragOffset.x, y: y - dragOffset.y } : el
        ));
    };

    const handleCanvasMouseUp = () => {
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
        if (isDragging) { setIsDragging(false); return; }
        const { x, y } = getCoords(e);

        // Polyline tool
        if (selectedTool === 'POLYLINE') {
            setPolylinePoints(pts => [...pts, { x, y }]);
            return;
        }

        // Check hit elements
        let clicked = null;
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (!layers[getLayer(el)]) continue;
            if (['line', 'rect', 'circle', 'arrow', 'polyline'].includes(el.type)) continue;
            const sz = 24;
            if (x >= el.x - sz && x <= el.x + sz && y >= el.y - sz && y <= el.y + sz) { clicked = el; break; }
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

    // ─── Properties panel updates ────────────────────────────────────────────
    const handleUpdateSelected = (patch) => {
        addToHistory(elements.map(el => el.id === selectedElementId ? { ...el, ...patch } : el));
    };
    const handleDeleteSelected = () => {
        addToHistory(elements.filter(el => el.id !== selectedElementId));
        setSelectedElementId(null);
    };
    const handleDuplicateSelected = () => {
        if (!selectedElement) return;
        const newEl = { ...selectedElement, id: Date.now(), x: (selectedElement.x || 0) + 30, y: (selectedElement.y || 0) + 30 };
        if (newEl.startX !== undefined) { newEl.startX += 30; newEl.startY += 30; newEl.endX += 30; newEl.endY += 30; }
        addToHistory([...elements, newEl]);
        setSelectedElementId(newEl.id);
    };

    // ─── Other actions ───────────────────────────────────────────────────────
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setBackgroundImage(ev.target.result);
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

    const fitToScreen = () => { setZoom(0.6); };

    const handleTextDoubleClick = (id, text) => {
        if (selectedTool !== 'select') return;
        setEditingTextId(id); setTextInputValue(text);
    };
    const handleTextSave = () => {
        if (editingTextId) { setElements(els => els.map(el => el.id === editingTextId ? { ...el, text: textInputValue || 'Texto vacío' } : el)); setEditingTextId(null); }
    };

    const doSave = () => {
        if (!meta.empresa || !meta.sector) { toast.error('Completá Empresa y Sector antes de guardar.'); return; }
        
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
        hist = editData ? hist.map(it => it.id === editData.id ? mapData : it) : [mapData, ...hist];
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
            a.href = canvas.toDataURL('image/png'); a.click();
            toast.success('PNG exportado.', { id: 'exp' });
        } catch { toast.error('Error al exportar.', { id: 'exp' }); }
    });

    // ─── SVG element rendering ───────────────────────────────────────────────
    const renderSvgElement = (el) => {
        const isSel = el.id === selectedElementId;
        const dashArr = el.lineStyle === 'dashed' ? '10,5' : 'none';
        const stroke = isSel ? '#3b82f6' : el.color;
        const sw = el.strokeWidth || 3;
        const selProps = { style: { pointerEvents: 'stroke' as any, cursor: 'pointer' }, onPointerDown: (e) => { e.stopPropagation(); setSelectedElementId(el.id); } };

        if (el.type === 'rect') {
            const rx = Math.min(el.startX, el.endX), ry = Math.min(el.startY, el.endY);
            return <rect key={el.id} x={rx} y={ry} width={Math.abs(el.endX - el.startX)} height={Math.abs(el.endY - el.startY)}
                stroke={stroke} strokeWidth={isSel ? sw + 2 : sw} strokeDasharray={dashArr}
                fill={el.fillColor || 'transparent'} opacity={el.opacity ?? 1} {...selProps} />;
        }
        if (el.type === 'circle') {
            const cx = (el.startX + el.endX) / 2, cy = (el.startY + el.endY) / 2;
            const rx = Math.abs(el.endX - el.startX) / 2, ry = Math.abs(el.endY - el.startY) / 2;
            return <ellipse key={el.id} cx={cx} cy={cy} rx={rx || 1} ry={ry || 1}
                stroke={stroke} strokeWidth={isSel ? sw + 2 : sw} strokeDasharray={dashArr}
                fill={el.fillColor || 'transparent'} opacity={el.opacity ?? 1} {...selProps} />;
        }
        if (el.type === 'polyline') {
            const pts = el.points.map(p => `${p.x},${p.y}`).join(' ');
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
        const dx = drawingShape.endX - drawingShape.startX, dy = drawingShape.endY - drawingShape.startY;
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
    const toolBtnStyle = (active, color = 'var(--color-primary)') => ({
        padding: '6px 10px', borderRadius: 7, border: '1px solid var(--color-border)',
        background: active ? color : 'var(--color-surface)',
        color: active ? '#fff' : 'var(--color-text)',
        cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s'
    });

    const gridBg = isBlueprintMode
        ? 'linear-gradient(to right,#1e293b 1px,transparent 1px),linear-gradient(to bottom,#1e293b 1px,transparent 1px)'
        : 'linear-gradient(to right,#cbd5e1 1px,transparent 1px),linear-gradient(to bottom,#cbd5e1 1px,transparent 1px)';

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="container" style={{ paddingBottom: '5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <ShareModal 
                isOpen={showShareModal}
                open={showShareModal} 
                onClose={() => setShowShareModal(false)}
                title="Compartir Mapa de Riesgos"
                text={`🗺️ Mapa: ${meta.empresa}\n📍 Sector: ${meta.sector}\n⚠️ Elementos: ${elements.length}\n\nAsistente HYS`}
                rawMessage={`🗺️ Mapa: ${meta.empresa}\n📍 Sector: ${meta.sector}\n⚠️ Elementos: ${elements.length}\n\nAsistente HYS`}
                elementIdToPrint="pdf-content" 
                fileName={`Mapa_${meta.empresa}.pdf`}
            />

            {/* Clear Canvas Confirm Modal */}
            {showClearConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'var(--color-surface)',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '400px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <Trash2 size={32} />
                        </div>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>
                            ¿Borrar todo el mapa?
                        </h2>
                        <p style={{ margin: '0 0 2rem 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                            Esta acción eliminará todos los elementos y el plano base. No se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                style={{
                                    flex: 1, padding: '0.8rem', borderRadius: '10px',
                                    border: '1px solid var(--color-border)', background: 'transparent',
                                    color: 'var(--color-text)', fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmClearCanvas}
                                style={{
                                    flex: 1, padding: '0.8rem', borderRadius: '10px',
                                    border: 'none', background: '#ef4444', color: 'white',
                                    fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                Sí, borrar todo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating actions */}
            <div className="no-print floating-action-bar">
                <button onClick={handleSave} className="btn-floating-action" style={{ background: '#36B37E', color: '#fff' }}><Save size={18} /> GUARDAR</button>
                <button onClick={() => requirePro(() => setShowShareModal(true))} className="btn-floating-action" style={{ background: '#0052CC', color: '#fff' }}><Share2 size={18} /> COMPARTIR</button>
                <button onClick={() => requirePro(() => window.print())} className="btn-floating-action" style={{ background: '#FF8B00', color: '#fff' }}><Printer size={18} /> IMPRIMIR</button>
                <button onClick={handleExportPNG} className="btn-floating-action" style={{ background: '#9C27B0', color: '#fff' }}><Download size={18} /> PNG</button>
            </div>

            <div className="no-print">
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button onClick={() => navigate('/#tools')} style={{ padding: '0.4rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}><ArrowLeft size={18} /></button>
                        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{editData ? 'Editar Mapa' : 'Editor de Mapa de Riesgos'}</h1>
                    </div>
                    <button onClick={clearCanvas} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, padding: '0.5rem 1rem' }}><Trash2 size={15} /> Borrar Todo</button>
                </div>

                {/* Metadata bar */}
                <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 180px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Empresa / Cliente</label>
                        <input type="text" value={meta.empresa} onChange={e => setMeta({ ...meta, empresa: e.target.value })} placeholder="Ej. Planta Modelo" style={{ padding: '0.5rem', width: '100%' }} />
                    </div>
                    <div style={{ flex: '1 1 180px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Sector / Planta</label>
                        <input type="text" value={meta.sector} onChange={e => setMeta({ ...meta, sector: e.target.value })} placeholder="Ej. Nave 1 - Producción" style={{ padding: '0.5rem', width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button className="btn-outline" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.8rem' }}
                            onClick={() => document.getElementById('bg-upload').click()}>
                            <ImageIcon size={15} /> Subir Plano Base
                        </button>
                        <input type="file" id="bg-upload" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        {backgroundImage && <button className="btn-outline" style={{ margin: 0, padding: '0.5rem 0.7rem', fontSize: '0.75rem' }} onClick={() => setBackgroundImage(null)}>✕ Quitar fondo</button>}
                    </div>
                </div>

                {/* ─── Main 3-column layout ─── */}
                <div style={{ display: 'flex', gap: '0.75rem', minHeight: '680px', flexWrap: 'wrap' }}>

                    {/* ── LEFT SIDEBAR ── */}
                    <div className="card" style={{ width: '100%', maxWidth: 270, flex: '0 0 270px', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Tab bar */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                            {[['icons', '🔴 Íconos'], ['layers', '☰ Capas'], ['help', '❓ Ayuda']].map(([id, label]) => (
                                <button key={id} onClick={() => setActiveLeftTab(id)}
                                    style={{
                                        flex: 1, padding: '0.6rem 0.3rem', fontSize: '0.68rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                                        background: activeLeftTab === id ? 'var(--color-surface)' : 'var(--color-background)',
                                        color: activeLeftTab === id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        borderBottom: activeLeftTab === id ? '2px solid var(--color-primary)' : '2px solid transparent'
                                    }}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {/* ── ICONS TAB ── */}
                            {activeLeftTab === 'icons' && (
                                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Pro Settings */}
                                    <div style={{ background: 'var(--color-background)', padding: '0.75rem', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.6rem' }}>Ajustes PRO</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 700, marginBottom: '0.3rem' }}>Estilo de Línea</div>
                                                <div style={{ display: 'flex', gap: 2 }}>
                                                    <button onClick={() => setLineStyle('solid')} style={toolBtnStyle(lineStyle === 'solid')}>Sólida</button>
                                                    <button onClick={() => setLineStyle('dashed')} style={toolBtnStyle(lineStyle === 'dashed')}>Punteada</button>
                                                </div>
                                            </div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                                                <input type="checkbox" checked={isBlueprintMode} onChange={e => setIsBlueprintMode(e.target.checked)} /> Modo Blueprint
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                                                <input type="checkbox" checked={showDimensions} onChange={e => setShowDimensions(e.target.checked)} /> Dimensiones en vivo
                                            </label>
                                        </div>
                                    </div>

                                    {/* Tools */}
                                    <div style={{ background: 'var(--color-background)', padding: '0.75rem', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.6rem' }}>Herramientas</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                            <button onClick={() => setSelectedTool('select')} style={toolBtnStyle(selectedTool === 'select')} title="Selección (S)"><MousePointer2 size={13} /> Selec.</button>
                                            <button onClick={() => setSelectedTool('pan')} style={toolBtnStyle(selectedTool === 'pan')} title="Paneo (H)"><Move size={13} /> Paneo</button>
                                            <button onClick={() => setSelectedTool('LINE')} style={toolBtnStyle(selectedTool === 'LINE', '#374151')} title="Línea/Pared">╱ Línea</button>
                                            <button onClick={() => setSelectedTool('RECTANGLE')} style={toolBtnStyle(selectedTool === 'RECTANGLE', '#374151')} title="Rectángulo">▭ Rect.</button>
                                            <button onClick={() => setSelectedTool('CIRCLE')} style={toolBtnStyle(selectedTool === 'CIRCLE', '#374151')} title="Círculo/Elipse">○ Círculo</button>
                                            <button onClick={() => { setSelectedTool('POLYLINE'); setPolylinePoints([]); }} style={toolBtnStyle(selectedTool === 'POLYLINE', '#374151')} title="Polilínea (Esc para terminar)">⟍ Polilínea</button>
                                            <button onClick={() => setSelectedTool('ARROW_LINE')} style={toolBtnStyle(selectedTool === 'ARROW_LINE', '#2563eb')} title="Ruta de Escape">→ Flecha</button>
                                            <button onClick={() => setSelectedTool('TEXT_LABEL')} style={toolBtnStyle(selectedTool === 'TEXT_LABEL', '#4f46e5')} title="Texto">T Texto</button>
                                        </div>
                                        {selectedTool === 'POLYLINE' && polylinePoints.length > 0 && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'rgba(59,130,246,0.08)', padding: '6px 8px', borderRadius: 6 }}>
                                                ✏️ {polylinePoints.length} nodo(s) — doble clic o Esc para terminar
                                            </div>
                                        )}
                                    </div>

                                    {/* Icon Library */}
                                    {Object.entries(categories).map(([cat, icons]) => (
                                        <div key={cat}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>{cat}</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                                                {icons.map(icon => (
                                                    <button key={icon.id} onClick={() => setSelectedTool(icon.id)} title={icon.label}
                                                        style={{
                                                            padding: '0.4rem', borderRadius: 7, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            border: selectedTool === icon.id ? `2px solid ${icon.color}` : '1px solid var(--color-border)',
                                                            background: selectedTool === icon.id ? `${icon.color}18` : 'transparent', cursor: 'pointer', transition: 'all 0.15s'
                                                        }}>
                                                        <div style={{ width: 20, height: 20, color: icon.color }} dangerouslySetInnerHTML={{ __html: icon.svg }} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Keyboard hints */}
                                    <div style={{ background: 'var(--color-background)', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.68rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                                        <strong>Atajos:</strong><br />
                                        S — Seleccionar &nbsp;|&nbsp; H — Paneo<br />
                                        Ctrl+Z / Ctrl+Y — Deshacer/Rehacer<br />
                                        Shift — Líneas rectas (Ortho)<br />
                                        R — Rotar &nbsp;|&nbsp; Supr — Borrar<br />
                                        Rueda — Zoom
                                    </div>
                                </div>
                            )}

                            {/* ── LAYERS TAB ── */}
                            {activeLeftTab === 'layers' && (
                                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>Visibilidad de Capas</div>
                                    {[
                                        { id: 'structure', label: '🏗️ Estructura', desc: 'Líneas, rectángulos, círculos, polilíneas, flechas' },
                                        { id: 'signage', label: '⚠️ Señalética', desc: 'Íconos ISO: extintor, salida, riesgo eléctrico, etc.' },
                                        { id: 'annotations', label: '✏️ Anotaciones', desc: 'Etiquetas de texto, indicadores de posición' },
                                    ].map(layer => (
                                        <div key={layer.id} style={{ padding: '0.75rem', background: 'var(--color-background)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <strong style={{ fontSize: '0.75rem' }}>{layer.label}</strong>
                                                <button onClick={() => setLayers(l => ({ ...l, [layer.id]: !l[layer.id] }))}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: layers[layer.id] ? 'var(--color-primary)' : 'var(--color-text-muted)', padding: '2px 4px' }}>
                                                    {layers[layer.id] ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{layer.desc}</div>
                                            <div style={{ marginTop: '0.3rem', fontSize: '0.68rem', fontWeight: 700, color: layers[layer.id] ? '#16a34a' : '#6b7280' }}>
                                                {layers[layer.id] ? '👁 Visible' : '🚫 Oculta'}
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.06)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                        💡 Las capas ocultas <strong>no se borran</strong>. Solo están invisibles en el canvas. Se guardan normalmente.
                                    </div>
                                </div>
                            )}

                            {/* ── HELP TAB ── */}
                            {activeLeftTab === 'help' && <MapHelpPanel />}
                        </div>
                    </div>

                    {/* ── CANVAS AREA ── */}
                    <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 300 }}>
                        {/* Canvas toolbar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={undo} title="Deshacer (Ctrl+Z)" disabled={historyIndex <= 0}
                                    style={{ ...toolBtnStyle(false), opacity: historyIndex <= 0 ? 0.4 : 1 }}>
                                    ↩ Desha.
                                </button>
                                <button onClick={redo} title="Rehacer (Ctrl+Y)" disabled={historyIndex >= history.length - 1}
                                    style={{ ...toolBtnStyle(false), opacity: historyIndex >= history.length - 1 ? 0.4 : 1 }}>
                                    ↪ Reha.
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <button onClick={() => setIsSnapToGrid(!isSnapToGrid)} style={toolBtnStyle(isSnapToGrid, '#0284c7')} title="Imán de cuadrícula">
                                    🧲 Imán
                                </button>
                                <button onClick={() => setIsOrthoMode(!isOrthoMode)} style={toolBtnStyle(isOrthoMode)} title="Modo ortogonal (también Shift)">
                                    📐 Ortho
                                </button>
                                <button onClick={fitToScreen} style={toolBtnStyle(false)} title="Ajustar a pantalla">
                                    <Maximize2 size={13} /> Ajustar
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
                                    <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} style={{ ...toolBtnStyle(false), padding: '5px 7px' }}><ZoomOut size={14} /></button>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                                    <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} style={{ ...toolBtnStyle(false), padding: '5px 7px' }}><ZoomIn size={14} /></button>
                                </div>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div className="card"
                            ref={containerRef}
                            style={{
                                flex: 1, overflow: 'hidden', background: isBlueprintMode ? '#0f172a' : '#e2e8f0', position: 'relative',
                                cursor: selectedTool === 'pan' ? 'grab' : selectedTool === 'select' ? 'default' : 'crosshair', padding: 0, minHeight: 500,
                                touchAction: 'none' // Crucial for mobile drawing!
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
                                    width: 4000, height: 4000, position: 'absolute', transformOrigin: '0 0',
                                    transform: `scale(${zoom})`,
                                    backgroundColor: isBlueprintMode ? '#0f172a' : '#e2e8f0',
                                    backgroundSize: '20px 20px', backgroundImage: gridBg
                                }}>

                                {backgroundImage && (
                                    <img src={backgroundImage} alt="Fondo" style={{
                                        position: 'absolute', top: 100, left: 100,
                                        opacity: isBlueprintMode ? 0.3 : 0.6, maxWidth: 2000,
                                        filter: isBlueprintMode ? 'invert(1) grayscale(1)' : 'none', pointerEvents: 'none'
                                    }} />
                                )}

                                {/* Icons and Text (HTML layer) */}
                                {visibleElements.map(el => {
                                    if (el.type === 'icon') {
                                        const iconDef = SAFETY_ICONS[el.iconId];
                                        if (!iconDef) return null;
                                        const isSel = el.id === selectedElementId;
                                        return (
                                            <div key={el.id}
                                                onMouseDown={e => handleElementMouseDown(e, el.id, el.x, el.y)}
                                                style={{
                                                    position: 'absolute', left: el.x, top: el.y, width: 40, height: 40,
                                                    transform: `translate(-50%,-50%) rotate(${el.rotation || 0}deg)`,
                                                    background: isBlueprintMode ? '#1e293b' : '#fff', borderRadius: 5,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: isSel ? '2px dashed #3b82f6' : `2px solid ${iconDef.color}`,
                                                    color: el.color || iconDef.color, cursor: el.locked ? 'not-allowed' : 'move',
                                                    opacity: el.opacity ?? 1, zIndex: isSel ? 100 : 10
                                                }}
                                                dangerouslySetInnerHTML={{ __html: iconDef.svg }} />
                                        );
                                    }
                                    if (el.type === 'text') {
                                        const isSel = el.id === selectedElementId;
                                        const isEd = editingTextId === el.id;
                                        return (
                                            <div key={el.id}
                                                onMouseDown={e => !isEd && handleElementMouseDown(e, el.id, el.x, el.y)}
                                                onDoubleClick={() => handleTextDoubleClick(el.id, el.text)}
                                                style={{
                                                    position: 'absolute', left: el.x, top: el.y, transform: `translate(-50%,-50%) rotate(${el.rotation || 0}deg)`,
                                                    padding: '3px 7px', fontSize: 15, fontWeight: 800, color: el.color || '#0f172a',
                                                    whiteSpace: 'nowrap', opacity: el.opacity ?? 1,
                                                    border: isSel ? '1px dashed #3b82f6' : '1px solid transparent',
                                                    cursor: el.locked ? 'not-allowed' : 'move', zIndex: isSel ? 100 : 10,
                                                    background: isSel ? 'rgba(59,130,246,0.05)' : 'transparent'
                                                }}>
                                                {isEd
                                                    ? <input autoFocus value={textInputValue} onChange={e => setTextInputValue(e.target.value)}
                                                        onBlur={handleTextSave} onKeyDown={e => e.key === 'Enter' && handleTextSave()}
                                                        style={{ background: 'white', border: '1px solid #3b82f6', color: 'black', fontWeight: 800, fontSize: 15 }} />
                                                    : el.text}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}

                                {/* SVG vector layer */}
                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 50, pointerEvents: 'none' }}>
                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                            <polygon points="0 0,10 3.5,0 7" fill="context-stroke" />
                                        </marker>
                                    </defs>
                                    <g style={{ pointerEvents: 'all' }}>
                                        {visibleElements.filter(el => ['line', 'rect', 'circle', 'arrow', 'polyline'].includes(el.type)).map(renderSvgElement)}
                                    </g>

                                    {/* Drawing preview */}
                                    {drawingShape && (() => {
                                        const c = 'var(--color-primary)', da = '8,4';
                                        if (drawingShape.type === 'RECTANGLE') {
                                            const rx = Math.min(drawingShape.startX, drawingShape.endX), ry = Math.min(drawingShape.startY, drawingShape.endY);
                                            return <rect x={rx} y={ry} width={Math.abs(drawingShape.endX - drawingShape.startX)} height={Math.abs(drawingShape.endY - drawingShape.startY)} stroke={c} strokeWidth="2" fill="transparent" strokeDasharray={da} />;
                                        }
                                        if (drawingShape.type === 'CIRCLE') {
                                            const cx = (drawingShape.startX + drawingShape.endX) / 2, cy = (drawingShape.startY + drawingShape.endY) / 2;
                                            const rx = Math.abs(drawingShape.endX - drawingShape.startX) / 2, ry = Math.abs(drawingShape.endY - drawingShape.startY) / 2;
                                            return <ellipse cx={cx} cy={cy} rx={rx || 1} ry={ry || 1} stroke={c} strokeWidth="2" fill="transparent" strokeDasharray={da} />;
                                        }
                                        return <line x1={drawingShape.startX} y1={drawingShape.startY} x2={drawingShape.endX} y2={drawingShape.endY} stroke={c} strokeWidth="2" strokeDasharray={da} markerEnd={drawingShape.type === 'ARROW_LINE' ? 'url(#arrowhead)' : ''} />;
                                    })()}

                                    {/* Polyline in progress */}
                                    {polylinePoints.length > 0 && (() => {
                                        const pts = polylinePoints.map(p => `${p.x},${p.y}`).join(' ');
                                        const preview = polylinePreview ? `${polylinePoints[polylinePoints.length - 1].x},${polylinePoints[polylinePoints.length - 1].y} ${polylinePreview.x},${polylinePreview.y}` : '';
                                        return (
                                            <g>
                                                <polyline points={pts} stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="none" fill="none" />
                                                {polylinePreview && <line x1={polylinePoints[polylinePoints.length - 1].x} y1={polylinePoints[polylinePoints.length - 1].y} x2={polylinePreview.x} y2={polylinePreview.y} stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="6,4" />}
                                                {polylinePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--color-primary)" />)}
                                            </g>
                                        );
                                    })()}
                                </svg>

                                {/* Live dimension tooltip */}
                                {drawingShape && showDimensions && (
                                    <div style={{
                                        position: 'absolute', left: drawingShape.endX + 12, top: drawingShape.endY - 28,
                                        background: 'rgba(15,23,42,0.85)', color: '#fff', padding: '3px 10px', borderRadius: 6,
                                        fontSize: 11, fontWeight: 700, zIndex: 1000, pointerEvents: 'none', backdropFilter: 'blur(4px)'
                                    }}>
                                        {getDimLabel()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.75rem',
                            background: isBlueprintMode ? '#0f172a' : 'var(--color-surface)', borderRadius: 8, fontSize: '0.7rem',
                            color: isBlueprintMode ? '#94a3b8' : 'var(--color-text-muted)', border: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '0.25rem'
                        }}>
                            <span>X: <strong>{cursorPos.x}</strong> &nbsp;Y: <strong>{cursorPos.y}</strong> &nbsp;(px @ {Math.round(zoom * 100)}%)</span>
                            <span>{elements.length} elemento{elements.length !== 1 ? 's' : ''} en el mapa</span>
                            <span>Herramienta: <strong>{selectedTool}</strong></span>
                        </div>
                    </div>

                    {/* ── RIGHT PROPERTIES PANEL ── */}
                    <div className="card" style={{ width: '100%', maxWidth: 215, flex: '0 0 215px', padding: 0, overflowY: 'auto' }}>
                        <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                            Panel de Objeto
                        </div>
                        <MapPropertiesPanel
                            element={selectedElement}
                            onUpdate={handleUpdateSelected}
                            onDelete={handleDeleteSelected}
                            onDuplicate={handleDuplicateSelected} />
                    </div>
                </div>
            </div>

            <AdBanner />

            <div className="print-only">
                <RiskMapPdfGenerator data={{ ...meta, elements, backgroundImage }} onBack={() => { }} onShare={() => setShowShareModal(true)} />
            </div>
        </div>
    );
}
