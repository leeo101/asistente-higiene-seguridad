import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import {
    ArrowLeft, Save, MousePointer2, Type, Move, Trash2, Printer,
    Image as ImageIcon, ZoomIn, ZoomOut, Download, TriangleAlert, ThermometerSun,
    Share2, CheckCircle2
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import RiskMapPdfGenerator from '../components/RiskMapPdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

import { SAFETY_ICONS } from '../data/mapIcons';

export default function RiskMapGenerator() {
    useDocumentTitle('Creador de Mapas de Riesgo');
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();

    const editData = location.state?.editData;

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Metadata
    const [meta, setMeta] = useState({
        empresa: editData?.empresa || '',
        sector: editData?.sector || '',
        fecha: editData?.fecha || new Date().toISOString().split('T')[0]
    });

    // Canvas State
    const [elements, setElements] = useState(editData?.elements || []); // List of dropped icons/texts
    const [backgroundImage, setBackgroundImage] = useState(editData?.backgroundImage || null); // Data URL of the uploaded floorplan

    // Editor State
    const [selectedTool, setSelectedTool] = useState('select'); // 'select', id of icon, 'text'
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isOrthoMode, setIsOrthoMode] = useState(false); // AutoCAD style precision
    const [isSnapToGrid, setIsSnapToGrid] = useState(true); // Magnetic grid
    const [isPanning, setIsPanning] = useState(false);
    const [lastTouch, setLastTouch] = useState(null);

    // Temporary text editing
    const [editingTextId, setEditingTextId] = useState(null);
    const [textInputValue, setTextInputValue] = useState('');

    // Vector drawing state
    const [drawingShape, setDrawingShape] = useState(null); // { type, startX, startY, endX, endY }

    const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'report'
    const [showShareModal, setShowShareModal] = useState(false);

    // History for Undo/Redo
    const [history, setHistory] = useState([editData?.elements || []]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Pro Features
    const [lineStyle, setLineStyle] = useState('solid'); // 'solid', 'dashed'
    const [isBlueprintMode, setIsBlueprintMode] = useState(false);
    const [showDimensions, setShowDimensions] = useState(true);

    // Categories for the sidebar
    const categories = {
        'Trazado Estructural': [SAFETY_ICONS.LINE, SAFETY_ICONS.RECTANGLE],
        'Rutas y Señales': [SAFETY_ICONS.YOU_ARE_HERE, SAFETY_ICONS.ARROW_LINE],
        'Fuego (Rojos)': Object.values(SAFETY_ICONS).filter(i => i.type === 'fire'),
        'Riesgos (Amarillos)': Object.values(SAFETY_ICONS).filter(i => i.type === 'warning'),
        'Escape (Verdes)': Object.values(SAFETY_ICONS).filter(i => i.type === 'escape')
    };

    // --- CANVAS INTERACTIONS ---

    const getCoordinates = (e) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) / zoom,
            y: (clientY - rect.top) / zoom
        };
    };

    const handleCanvasClick = (e) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        // Calculate true X/Y considering zoom
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        // If clicking on an empty area while dragging, just stop dragging
        if (isDragging) {
            setIsDragging(false);
            return;
        }

        // Check if we clicked on an existing element to select it
        // We do this by checking reverse order (top to bottom)
        let clickedElement = null;
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            const size = 32; // Default icon size hit test
            // Rough bounding box hit test
            if (x >= el.x - size / 2 && x <= el.x + size / 2 && y >= el.y - size / 2 && y <= el.y + size / 2) {
                // For text, bounding box depends on text length, but we use a fixed hit area for simplicity or calculate roughly
                clickedElement = el;
                break;
            }
        }

        if (clickedElement) {
            if (selectedTool === 'select') {
                setSelectedElementId(clickedElement.id);
            }
            return;
        }

        // If no element clicked, deselect current
        setSelectedElementId(null);
        setEditingTextId(null); // close any open text edits

        // Add new element if a tool is active
        if (selectedTool && selectedTool !== 'select' && !['ARROW_LINE', 'LINE', 'RECTANGLE'].includes(selectedTool)) {
            if (selectedTool === 'TEXT_LABEL') {
                const newId = Date.now();
                setElements([...elements, {
                    id: newId, type: 'text', text: 'Doble clic para editar',
                    x, y, color: '#0f172a', rotation: 0
                }]);
                setSelectedElementId(newId);
                setSelectedTool('select');
            } else {
                const iconDef = SAFETY_ICONS[selectedTool];
                if (iconDef) {
                    addToHistory([...elements, {
                        id: Date.now(), type: 'icon', iconId: iconDef.id,
                        x, y, color: iconDef.color, rotation: 0
                    }]);
                    // Don't deselect tool, allow placing multiple
                }
            }
        }
    };

    const addToHistory = (newElements) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newElements);
        if (newHistory.length > 30) newHistory.shift(); // Limit history
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setElements(newElements);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setElements(history[prevIndex]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setElements(history[nextIndex]);
        }
    };

    const handleCanvasMouseDown = (e) => {
        const { x, y } = getCoordinates(e);

        if (['ARROW_LINE', 'LINE', 'RECTANGLE'].includes(selectedTool)) {
            setDrawingShape({ type: selectedTool, startX: x, startY: y, endX: x, endY: y });
        }
    };

    // Dragging Logic
    const handleElementMouseDown = (e, id, elX, elY) => {
        e.stopPropagation(); // prevent canvas click
        if (selectedTool !== 'select') return;

        setSelectedElementId(id);
        setIsDragging(true);

        const { x, y } = getCoordinates(e);
        setDragOffset({ x: x - elX, y: y - elY });
    };

    const handleCanvasMouseMove = (e) => {
        let { x, y } = getCoordinates(e);

        // Snap to Grid (AutoCAD style)
        if (isSnapToGrid) {
            x = Math.round(x / 20) * 20;
            y = Math.round(y / 20) * 20;
        }

        if (drawingShape) {
            let finalX = x;
            let finalY = y;

            // Ortho Mode Logic (AutoCAD style)
            if (isOrthoMode || e.shiftKey) {
                const dx = Math.abs(x - drawingShape.startX);
                const dy = Math.abs(y - drawingShape.startY);
                if (dx > dy) {
                    finalY = drawingShape.startY;
                } else {
                    finalX = drawingShape.startX;
                }
            }

            setDrawingShape(prev => ({ ...prev, endX: finalX, endY: finalY }));
            return;
        }

        if (!isDragging || !selectedElementId) return;

        setElements(elements.map(el =>
            el.id === selectedElementId && !['arrow', 'line', 'rect'].includes(el.type) ? { ...el, x: x - dragOffset.x, y: y - dragOffset.y } : el
        ));
    };

    const handleCanvasMouseUp = () => {
        if (drawingShape) {
            const dx = drawingShape.endX - drawingShape.startX;
            const dy = drawingShape.endY - drawingShape.startY;
            // Solo añadir si trazó un vector real (movimiento > 10px)
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                // Determine true element type internally based on tool
                let elementType = 'arrow';
                let elementColor = SAFETY_ICONS[drawingShape.type]?.color || '#000';

                if (drawingShape.type === 'LINE') elementType = 'line';
                if (drawingShape.type === 'RECTANGLE') elementType = 'rect';

                addToHistory([...elements, {
                    id: Date.now(),
                    type: elementType,
                    startX: drawingShape.startX,
                    startY: drawingShape.startY,
                    endX: drawingShape.endX,
                    endY: drawingShape.endY,
                    color: elementColor,
                    lineStyle: lineStyle
                }]);
            }
            setDrawingShape(null);
        }
        setIsDragging(false);
    };

    // Keyboard controls for selected element
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.shiftKey) setIsOrthoMode(true);

            // Undo/Redo Shortcuts
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    undo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    redo();
                }
                return;
            }

            if (editingTextId) return; // Don't intercept if typing in input

            if (selectedElementId) {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    addToHistory(elements.filter(el => el.id !== selectedElementId));
                    setSelectedElementId(null);
                } else if (e.key === 'r' || e.key === 'R') {
                    // Rotate 45 degrees
                    addToHistory(elements.map(el =>
                        el.id === selectedElementId ? { ...el, rotation: ((el.rotation || 0) + 45) % 360 } : el
                    ));
                }
            }
        };
        const handleKeyUp = (e) => {
            if (!e.shiftKey) setIsOrthoMode(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedElementId, elements, editingTextId]);

    // Handle Background Image Upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setBackgroundImage(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const clearCanvas = () => {
        if (window.confirm('¿Borrar todo el mapa actual? Se perderán los cambios no guardados.')) {
            setElements([]);
            setBackgroundImage(null);
            setSelectedElementId(null);
        }
    };

    // Text Editing
    const handleTextDoubleClick = (id, currentText) => {
        if (selectedTool !== 'select') return;
        setEditingTextId(id);
        setTextInputValue(currentText);
    };

    const handleTextSave = () => {
        if (editingTextId) {
            setElements(elements.map(el =>
                el.id === editingTextId ? { ...el, text: textInputValue || 'Texto vacío' } : el
            ));
            setEditingTextId(null);
        }
    };

    // Real Save Logic
    const handleSave = () => {
        if (!meta.empresa || !meta.sector) {
            toast.error('Complete la Empresa y el Sector antes de guardar.');
            return;
        }

        const mapData = {
            id: editData?.id || Date.now(),
            ...meta,
            elements,
            backgroundImage,
            createdAt: editData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        let history = JSON.parse(localStorage.getItem('risk_map_history') || '[]');

        if (editData) {
            history = history.map(item => item.id === editData.id ? mapData : item);
        } else {
            history.unshift(mapData);
        }

        localStorage.setItem('risk_map_history', JSON.stringify(history));
        syncCollection('risk_map_history', history);

        toast.success(editData ? 'Mapa de riesgos actualizado correctamente.' : 'Mapa de riesgos guardado correctamente.');
        navigate('/risk-map-history');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPNG = async () => {
        if (!containerRef.current) return;

        toast.loading('Generando imagen de alta resolución...', { id: 'exporting' });

        try {
            // Find the scalable area (the one with 4000px)
            const scalableArea = containerRef.current.querySelector('div[style*="width: 4000px"]');
            if (!scalableArea) throw new Error('No se pudo encontrar el área de dibujo');

            // Temporarily reset zoom to 1 for high res capture or keep current?
            // High res usually means capturing the whole 4000x4000 or at least the used area.
            // For now, let's capture what's visible at a good scale.

            const canvas = await html2canvas(scalableArea, {
                useCORS: true,
                scale: 2, // Higher resolution
                backgroundColor: isBlueprintMode ? '#0f172a' : '#ffffff',
                logging: false,
                width: 2000, // Limit to a reasonable large size
                height: 1500
            });

            const link = document.createElement('a');
            link.download = `Mapa_Riesgos_${meta.empresa || 'HYS'}_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            toast.success('Imagen exportada correctamente', { id: 'exporting' });
        } catch (err) {
            console.error(err);
            toast.error('Error al exportar PNG', { id: 'exporting' });
        }
    };


    return (
        <div className="container" style={{ paddingBottom: '6rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <ShareModal
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
                title="Compartir Mapa de Riesgos"
                text={`🗺️ Mapa de Riesgos: ${meta.empresa}\n📍 Sector: ${meta.sector}\n⚠️ Elementos: ${elements.length}\n\nEnviado desde Asistente HYS`}
            />

            {/* Floating Action Bar Premium */}
            <div className="no-print floating-action-bar">
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Save size={18} /> GUARDAR
                </button>
                <button
                    onClick={() => setShowShareModal(true)}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={handlePrint}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: '#ffffff' }}
                >
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
                <button
                    onClick={handleExportPNG}
                    className="btn-floating-action"
                    style={{ background: '#9C27B0', color: '#ffffff' }}
                >
                    <Download size={18} /> EXPORTAR PNG
                </button>
            </div>

            <div className="no-print">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/')} style={{ padding: '0.4rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%', color: 'var(--color-text)' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{editData ? 'Editar Mapa de Riesgos' : 'Creador de Mapas de Riesgo'}</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={clearCanvas} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, padding: '0.5rem 1rem' }}>
                            <Trash2 size={16} /> Borrar Todo
                        </button>
                    </div>
                </div>

                {/* Top Toolbar: Metadata */}
                <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', background: 'var(--color-surface)' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Empresa / Cliente</label>
                        <input type="text" value={meta.empresa} onChange={e => setMeta({ ...meta, empresa: e.target.value })} placeholder="Ej. Planta Modelo" style={{ padding: '0.6rem', width: '100%' }} />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Sector / Planta</label>
                        <input type="text" value={meta.sector} onChange={e => setMeta({ ...meta, sector: e.target.value })} placeholder="Ej. Nave 1 - Producción" style={{ padding: '0.6rem', width: '100%' }} />
                    </div>
                    <div>
                        <button className="btn-outline" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }} onClick={() => document.getElementById('bg-upload').click()}>
                            <ImageIcon size={16} /> Subir Plano Base
                        </button>
                        <input type="file" id="bg-upload" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    </div>
                </div>

                {/* Main Design Area */}
                <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: '600px', height: '100%', flexWrap: 'wrap' }}>

                    {/* Left Sidebar: Tools & Library */}
                    <div className="card" style={{ width: '100%', maxWidth: '280px', flex: '1 0 280px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', maxHeight: '100%' }}>

                        {/* Pro Settings */}
                        <div style={{ display: 'block', background: 'var(--color-background)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.75rem', fontWeight: 800 }}>
                                AJUSTES PRO
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>Estilo de Línea</label>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        <button
                                            onClick={() => setLineStyle('solid')}
                                            style={{ flex: 1, padding: '6px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px 0 0 6px', background: lineStyle === 'solid' ? 'var(--color-primary)' : 'var(--color-surface)', color: lineStyle === 'solid' ? '#fff' : 'var(--color-text)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                                        >SÓLIDA</button>
                                        <button
                                            onClick={() => setLineStyle('dashed')}
                                            style={{ flex: 1, padding: '6px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '0 6px 6px 0', background: lineStyle === 'dashed' ? 'var(--color-primary)' : 'var(--color-surface)', color: lineStyle === 'dashed' ? '#fff' : 'var(--color-text)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                                        >PUNTEADA</button>
                                    </div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                    <input type="checkbox" checked={isBlueprintMode} onChange={e => setIsBlueprintMode(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                                    Modo Blueprint (Dark)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                    <input type="checkbox" checked={showDimensions} onChange={e => setShowDimensions(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                                    Dimensiones en Vivo
                                </label>
                            </div>
                        </div>

                        {/* Icon Library */}
                        <div>
                            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.8rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem' }}>
                                Pictogramas ISO
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {Object.entries(categories).map(([categoryName, icons]) => (
                                    <div key={categoryName}>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text)', margin: '0 0 0.5rem 0', opacity: 0.8 }}>{categoryName}</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                            {icons.map(icon => (
                                                <button
                                                    key={icon.id}
                                                    onClick={() => setSelectedTool(icon.id)}
                                                    style={{
                                                        padding: '0.5rem', borderRadius: '8px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: selectedTool === icon.id ? `2px solid ${icon.color}` : '1px solid var(--color-border)',
                                                        background: selectedTool === icon.id ? `${icon.color}15` : 'transparent',
                                                        cursor: 'pointer', transition: 'all 0.2s ease'
                                                    }}
                                                    title={icon.label}
                                                >
                                                    <div style={{ width: '24px', height: '24px', color: icon.color }} dangerouslySetInnerHTML={{ __html: icon.svg }} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', background: 'var(--color-background)', padding: '1rem', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                            <strong>Controles:</strong><br />
                            • Ctrl+Z / Ctrl+Y: Historial<br />
                            • Shift: Modo Recto<br />
                            • R: Rotar selección
                        </div>
                    </div>

                    {/* Right Area: Workspace Canvas */}
                    <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '300px' }}>

                        {/* Controls Toolbar */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '2px', marginRight: '0.5rem' }}>
                                <button onClick={undo} disabled={historyIndex <= 0} className="btn-outline" style={{ padding: '0.4rem', borderTopRightRadius: 0, borderBottomRightRadius: 0, opacity: historyIndex <= 0 ? 0.4 : 1 }} title="Deshacer (Ctrl+Z)"><ArrowLeft size={16} /></button>
                                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="btn-outline" style={{ padding: '0.4rem', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, opacity: historyIndex >= history.length - 1 ? 0.4 : 1 }} title="Rehacer (Ctrl+Y)"><Share2 size={16} style={{ transform: 'scaleX(-1)' }} /></button>
                            </div>

                            <button onClick={() => setIsSnapToGrid(!isSnapToGrid)} className={`btn-outline ${isSnapToGrid ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, background: isSnapToGrid ? '#0284c7' : 'var(--color-surface)', color: isSnapToGrid ? '#fff' : 'var(--color-text)', borderRadius: '6px' }}>IMÁN</button>
                            <button onClick={() => setIsOrthoMode(!isOrthoMode)} className={`btn-outline ${isOrthoMode ? 'active' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 800, background: isOrthoMode ? 'var(--color-primary)' : 'var(--color-surface)', color: isOrthoMode ? '#fff' : 'var(--color-text)', borderRadius: '6px' }}>ORTO</button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem' }}>
                                <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.4))} className="btn-outline" style={{ padding: '0.4rem' }}><ZoomOut size={16} /></button>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, minWidth: '45px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(Math.min(zoom + 0.2, 3))} className="btn-outline" style={{ padding: '0.4rem' }}><ZoomIn size={16} /></button>
                            </div>
                        </div>

                        {/* Interactive Canvas Plane */}
                        <div
                            className="card"
                            ref={containerRef}
                            style={{
                                flex: 1, overflow: 'hidden', background: isBlueprintMode ? '#0f172a' : '#e2e8f0',
                                position: 'relative', cursor: selectedTool === 'select' ? 'default' : 'crosshair',
                                padding: 0
                            }}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                            onMouseDown={handleCanvasMouseDown}
                            onTouchStart={handleCanvasMouseDown}
                            onTouchMove={handleCanvasMouseMove}
                            onTouchEnd={handleCanvasMouseUp}
                            onClick={handleCanvasClick}
                        >
                            <div style={{
                                width: '4000px', height: '4000px', position: 'absolute', transformOrigin: '0 0',
                                transform: `scale(${zoom})`,
                                backgroundColor: isBlueprintMode ? '#0f172a' : '#e2e8f0',
                                backgroundSize: '20px 20px',
                                backgroundImage: `linear-gradient(to right, ${isBlueprintMode ? '#1e293b' : '#cbd5e1'} 1px, transparent 1px), linear-gradient(to bottom, ${isBlueprintMode ? '#1e293b' : '#cbd5e1'} 1px, transparent 1px)`
                            }}>
                                {backgroundImage && (
                                    <img src={backgroundImage} alt="Fondo" style={{ position: 'absolute', top: '100px', left: '100px', opacity: isBlueprintMode ? 0.3 : 0.6, maxWidth: '2000px', filter: isBlueprintMode ? 'invert(1) grayscale(1)' : 'none', pointerEvents: 'none' }} />
                                )}

                                {/* Live Dimensions Overlay */}
                                {drawingShape && showDimensions && (
                                    <div style={{
                                        position: 'absolute', left: drawingShape.endX + 10, top: drawingShape.endY - 25,
                                        background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: '4px',
                                        fontSize: '11px', fontWeight: 'bold', zIndex: 1000, pointerEvents: 'none'
                                    }}>
                                        {(() => {
                                            const dx = drawingShape.endX - drawingShape.startX;
                                            const dy = drawingShape.endY - drawingShape.startY;
                                            const dist = Math.sqrt(dx * dx + dy * dy);
                                            return `${(dist / 40).toFixed(2)} m`;
                                        })()}
                                    </div>
                                )}

                                {/* Elements Layer */}
                                {elements.map((el) => {
                                    const isSelected = el.id === selectedElementId;
                                    if (el.type === 'icon') {
                                        const iconDef = SAFETY_ICONS[el.iconId];
                                        return iconDef ? (
                                            <div key={el.id} onMouseDown={(e) => handleElementMouseDown(e, el.id, el.x, el.y)}
                                                style={{
                                                    position: 'absolute', left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                                                    width: '40px', height: '40px', background: isBlueprintMode ? '#1e293b' : '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: isSelected ? '2px dashed #3b82f6' : `2px solid ${iconDef.color}`, color: iconDef.color, cursor: 'move', zIndex: isSelected ? 100 : 10
                                                }} dangerouslySetInnerHTML={{ __html: iconDef.svg }} />
                                        ) : null;
                                    }
                                    if (el.type === 'text') {
                                        const isEditing = editingTextId === el.id;
                                        return (
                                            <div key={el.id} onMouseDown={(e) => !isEditing && handleElementMouseDown(e, el.id, el.x, el.y)} onDoubleClick={() => handleTextDoubleClick(el.id, el.text)}
                                                style={{
                                                    position: 'absolute', left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                                                    padding: '4px 8px', fontSize: '16px', fontWeight: 800, color: el.color, whiteSpace: 'nowrap',
                                                    border: isSelected ? '1px dashed #3b82f6' : '1px solid transparent', cursor: 'move', zIndex: isSelected ? 100 : 10
                                                }}>
                                                {isEditing ? <input autoFocus value={textInputValue} onChange={e => setTextInputValue(e.target.value)} onBlur={handleTextSave} onKeyDown={e => e.key === 'Enter' && handleTextSave()} style={{ background: 'white', border: '1px solid #3b82f6', color: 'black', fontWeight: 800 }} /> : el.text}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}

                                {/* SVG Layer for Vectors */}
                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 }}>
                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                            <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" />
                                        </marker>
                                    </defs>
                                    {elements.filter(el => ['line', 'rect', 'arrow'].includes(el.type)).map(el => {
                                        const isSelected = el.id === selectedElementId;
                                        const dash = el.lineStyle === 'dashed' ? "10,5" : "none";
                                        const color = isSelected ? '#3b82f6' : el.color;
                                        const strokeW = isSelected ? 5 : 3;

                                        if (el.type === 'rect') {
                                            const rx = Math.min(el.startX, el.endX);
                                            const ry = Math.min(el.startY, el.endY);
                                            return <rect key={el.id} x={rx} y={ry} width={Math.abs(el.endX - el.startX)} height={Math.abs(el.endY - el.startY)} stroke={color} strokeWidth={strokeW} fill="transparent" strokeDasharray={dash} style={{ pointerEvents: 'stroke', cursor: 'pointer' }} onMouseDown={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }} />;
                                        }
                                        return <line key={el.id} x1={el.startX} y1={el.startY} x2={el.endX} y2={el.endY} stroke={color} strokeWidth={strokeW} strokeDasharray={dash} markerEnd={el.type === 'arrow' ? "url(#arrowhead)" : ""} style={{ pointerEvents: 'stroke', cursor: 'pointer' }} onMouseDown={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }} />;
                                    })}

                                    {/* Drawing Preview */}
                                    {drawingShape && (() => {
                                        const dash = "8,4";
                                        const color = "var(--color-primary)";
                                        if (drawingShape.type === 'RECTANGLE') {
                                            const rx = Math.min(drawingShape.startX, drawingShape.endX);
                                            const ry = Math.min(drawingShape.startY, drawingShape.endY);
                                            return <rect x={rx} y={ry} width={Math.abs(drawingShape.endX - drawingShape.startX)} height={Math.abs(drawingShape.endY - drawingShape.startY)} stroke={color} strokeWidth="2" fill="transparent" strokeDasharray={dash} />;
                                        }
                                        return <line x1={drawingShape.startX} y1={drawingShape.startY} x2={drawingShape.endX} y2={drawingShape.endY} stroke={color} strokeWidth="3" strokeDasharray={dash} markerEnd={drawingShape.type === 'ARROW_LINE' ? "url(#arrowhead)" : ""} />;
                                    })()}
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="print-only">
                    <RiskMapPdfGenerator mapData={{ ...meta, elements, backgroundImage }} onBack={() => { }} />
                </div>
            </div>
        </div>
    );
}
