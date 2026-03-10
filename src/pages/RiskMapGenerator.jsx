import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

    // Temporary text editing
    const [editingTextId, setEditingTextId] = useState(null);
    const [textInputValue, setTextInputValue] = useState('');

    // Vector drawing state
    const [drawingShape, setDrawingShape] = useState(null); // { type, startX, startY, endX, endY }

    const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'report'
    const [showShareModal, setShowShareModal] = useState(false);

    // Categories for the sidebar
    const categories = {
        'Trazado Estructural': [SAFETY_ICONS.LINE, SAFETY_ICONS.RECTANGLE],
        'Rutas y Señales': [SAFETY_ICONS.YOU_ARE_HERE, SAFETY_ICONS.ARROW_LINE],
        'Fuego (Rojos)': Object.values(SAFETY_ICONS).filter(i => i.type === 'fire'),
        'Riesgos (Amarillos)': Object.values(SAFETY_ICONS).filter(i => i.type === 'warning'),
        'Escape (Verdes)': Object.values(SAFETY_ICONS).filter(i => i.type === 'escape')
    };

    // --- CANVAS INTERACTIONS ---

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
                    setElements([...elements, {
                        id: Date.now(), type: 'icon', iconId: iconDef.id,
                        x, y, color: iconDef.color, rotation: 0
                    }]);
                    // Don't deselect tool, allow placing multiple
                }
            }
        }
    };

    const handleCanvasMouseDown = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;

        if (['ARROW_LINE', 'LINE', 'RECTANGLE'].includes(selectedTool)) {
            setDrawingShape({ type: selectedTool, startX: mouseX, startY: mouseY, endX: mouseX, endY: mouseY });
        }
    };

    // Dragging Logic
    const handleElementMouseDown = (e, id, elX, elY) => {
        e.stopPropagation(); // prevent canvas click
        if (selectedTool !== 'select') return;

        setSelectedElementId(id);
        setIsDragging(true);

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;

        setDragOffset({ x: mouseX - elX, y: mouseY - elY });
    };

    const handleCanvasMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;

        if (drawingShape) {
            setDrawingShape(prev => ({ ...prev, endX: mouseX, endY: mouseY }));
            return;
        }

        if (!isDragging || !selectedElementId) return;

        const newX = mouseX - dragOffset.x;
        const newY = mouseY - dragOffset.y;

        setElements(elements.map(el =>
            el.id === selectedElementId && !['arrow', 'line', 'rect'].includes(el.type) ? { ...el, x: newX, y: newY } : el
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

                setElements([...elements, {
                    id: Date.now(),
                    type: elementType,
                    startX: drawingShape.startX,
                    startY: drawingShape.startY,
                    endX: drawingShape.endX,
                    endY: drawingShape.endY,
                    color: elementColor
                }]);
            }
            setDrawingShape(null);
        }
        setIsDragging(false);
    };

    // Keyboard controls for selected element
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (editingTextId) return; // Don't intercept if typing in input

            if (selectedElementId) {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    setElements(elements.filter(el => el.id !== selectedElementId));
                    setSelectedElementId(null);
                } else if (e.key === 'r') {
                    // Rotate 45 degrees
                    setElements(elements.map(el =>
                        el.id === selectedElementId ? { ...el, rotation: (el.rotation + 45) % 360 } : el
                    ));
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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
                <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: '600px', height: '100%' }}>

                    {/* Left Sidebar: Tools & Library */}
                    <div className="card" style={{ width: '280px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>

                        {/* Primary Tools */}
                        <div style={{ display: 'block' }}>
                            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.8rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem' }}>
                                Herramientas de Selección
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setSelectedTool('select')}
                                    style={{ padding: '0.6rem', borderRadius: '8px', border: selectedTool === 'select' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: selectedTool === 'select' ? 'rgba(59,130,246,0.1)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                                    <MousePointer2 size={24} color={selectedTool === 'select' ? 'var(--color-primary)' : 'var(--color-text)'} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Seleccionar</span>
                                </button>
                                <button
                                    onClick={() => setSelectedTool('TEXT_LABEL')}
                                    style={{ padding: '0.6rem', borderRadius: '8px', border: selectedTool === 'TEXT_LABEL' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: selectedTool === 'TEXT_LABEL' ? 'rgba(59,130,246,0.1)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                                    <Type size={24} color={selectedTool === 'TEXT_LABEL' ? 'var(--color-primary)' : 'var(--color-text)'} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Texto Libre</span>
                                </button>
                            </div>
                        </div>

                        {/* Icon Library (ISO) */}
                        <div>
                            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.8rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem' }}>
                                Galería de Pictogramas (ISO)
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
                                                        cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
                                                    }}
                                                    title={icon.label}
                                                >
                                                    {/* Render raw SVG from config */}
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
                            • Clic para añadir (Herramienta activa)<br />
                            • Seleccionar + Arrastrar para mover<br />
                            • <strong>Supr / Backspace</strong> para borrar<br />
                            • <strong>R</strong> para rotar ícono<br />
                            • Doble clic en texto para editar
                        </div>

                    </div>

                    {/* Right Area: Workspace Canvas */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>

                        {/* Zoom Controls */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.4))} className="btn-outline" style={{ padding: '0.4rem', margin: 0 }} title="Alejar"><ZoomOut size={16} /></button>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, padding: '0.4rem 0.8rem', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                {Math.round(zoom * 100)}%
                            </span>
                            <button onClick={() => setZoom(Math.min(zoom + 0.2, 3))} className="btn-outline" style={{ padding: '0.4rem', margin: 0 }} title="Acercar"><ZoomIn size={16} /></button>
                        </div>

                        {/* Interactive Canvas Plane */}
                        <div
                            className="card"
                            ref={containerRef}
                            style={{
                                flex: 1, overflow: 'hidden', background: '#e2e8f0', // Technical gray background
                                position: 'relative', cursor: selectedTool === 'select' ? 'default' : 'crosshair',
                                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)',
                                padding: 0 // Override .card padding to fix mouse offset
                            }}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                            onMouseDown={handleCanvasMouseDown}
                            onClick={handleCanvasClick}
                        >
                            {/* The Scalable Area */}
                            <div style={{
                                width: '4000px', height: '4000px', position: 'absolute', transformOrigin: '0 0',
                                transform: `scale(${zoom})`,
                                backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)' // Grid pattern
                            }}>
                                {/* Uploaded Background Image */}
                                {backgroundImage && (
                                    <img src={backgroundImage} alt="Plano Guía" style={{ position: 'absolute', top: '100px', left: '100px', opacity: 0.8, maxWidth: '2000px', pointerEvents: 'none' }} />
                                )}

                                {/* Rendered Elements overlay */}
                                {elements.map((el) => {
                                    const isSelected = el.id === selectedElementId;

                                    if (el.type === 'icon') {
                                        const iconDef = SAFETY_ICONS[el.iconId];
                                        if (!iconDef) return null;

                                        return (
                                            <div
                                                key={el.id}
                                                onMouseDown={(e) => handleElementMouseDown(e, el.id, el.x, el.y)}
                                                style={{
                                                    position: 'absolute', left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                                                    width: '40px', height: '40px', background: '#ffffff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: isSelected ? '2px dashed #3b82f6' : `2px solid ${iconDef.color}`,
                                                    color: iconDef.color, cursor: selectedTool === 'select' ? 'move' : 'default',
                                                    boxShadow: isSelected ? '0 0 0 4px rgba(59,130,246,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                                                    zIndex: isSelected ? 100 : 10
                                                }}
                                                dangerouslySetInnerHTML={{ __html: iconDef.svg }}
                                            />
                                        );
                                    }

                                    if (el.type === 'text') {
                                        const isEditing = editingTextId === el.id;

                                        return (
                                            <div
                                                key={el.id}
                                                onMouseDown={(e) => { if (!isEditing) handleElementMouseDown(e, el.id, el.x, el.y); }}
                                                onDoubleClick={() => handleTextDoubleClick(el.id, el.text)}
                                                style={{
                                                    position: 'absolute', left: el.x, top: el.y, transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                                                    padding: '4px 8px', fontSize: '16px', fontWeight: 800, color: el.color, whiteSpace: 'nowrap',
                                                    border: isSelected ? '1px dashed #3b82f6' : '1px solid transparent',
                                                    cursor: selectedTool === 'select' ? 'move' : 'default',
                                                    zIndex: isSelected ? 100 : 10, background: isSelected ? 'rgba(255,255,255,0.8)' : 'transparent',
                                                    userSelect: 'none'
                                                }}
                                            >
                                                {isEditing ? (
                                                    <input
                                                        autoFocus
                                                        value={textInputValue}
                                                        onChange={e => setTextInputValue(e.target.value)}
                                                        onBlur={handleTextSave}
                                                        onKeyDown={e => { if (e.key === 'Enter') handleTextSave(); }}
                                                        style={{ background: 'white', border: '1px solid #3b82f6', color: 'black', outline: 'none', fontWeight: 800, padding: '2px 4px' }}
                                                    />
                                                ) : (
                                                    el.text
                                                )}
                                            </div>
                                        );
                                    }

                                    return null;
                                })}

                                {/* SVG Layer for Vectors */}
                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 }}>
                                    <defs>
                                        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                            <polygon points="0 0, 6 2, 0 4" fill="#2563eb" />
                                        </marker>
                                        <marker id="arrowhead-selected" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                            <polygon points="0 0, 6 2, 0 4" fill="#60a5fa" />
                                        </marker>
                                    </defs>

                                    {/* Render committed vectors */}
                                    {elements.filter(el => ['arrow', 'line', 'rect'].includes(el.type)).map(el => {
                                        const isSelected = el.id === selectedElementId;

                                        const commonProps = {
                                            key: el.id,
                                            stroke: isSelected ? '#60a5fa' : el.color,
                                            strokeWidth: isSelected ? "4" : "2",
                                            strokeDasharray: isSelected ? "8,4" : "none",
                                            style: { pointerEvents: 'stroke', cursor: selectedTool === 'select' ? 'pointer' : 'default' },
                                            onMouseDown: (e) => {
                                                if (selectedTool === 'select') {
                                                    e.stopPropagation();
                                                    setSelectedElementId(el.id);
                                                }
                                            }
                                        };

                                        if (el.type === 'arrow') {
                                            return <line {...commonProps} x1={el.startX} y1={el.startY} x2={el.endX} y2={el.endY}
                                                strokeWidth={isSelected ? "5" : "3"}
                                                markerEnd={`url(#${isSelected ? 'arrowhead-selected' : 'arrowhead'})`} />;
                                        }
                                        if (el.type === 'line') {
                                            return <line {...commonProps} strokeWidth={isSelected ? "4" : "3"} strokeLinecap="round" x1={el.startX} y1={el.startY} x2={el.endX} y2={el.endY} />;
                                        }
                                        if (el.type === 'rect') {
                                            const rx = Math.min(el.startX, el.endX);
                                            const ry = Math.min(el.startY, el.endY);
                                            const rw = Math.abs(el.endX - el.startX);
                                            const rh = Math.abs(el.endY - el.startY);
                                            return <rect {...commonProps} strokeWidth={isSelected ? "3" : "2"} x={rx} y={ry} width={rw} height={rh} fill="transparent" />;
                                        }
                                        return null;
                                    })}

                                    {/* Render currently drawing vector */}
                                    {drawingShape && (() => {
                                        if (drawingShape.type === 'ARROW_LINE') {
                                            return <line x1={drawingShape.startX} y1={drawingShape.startY} x2={drawingShape.endX} y2={drawingShape.endY} stroke="#2563eb" strokeWidth="3" strokeDasharray="8,4" markerEnd="url(#arrowhead)" />;
                                        }
                                        if (drawingShape.type === 'LINE') {
                                            return <line x1={drawingShape.startX} y1={drawingShape.startY} x2={drawingShape.endX} y2={drawingShape.endY} stroke="#0f172a" strokeWidth="3" strokeDasharray="8,4" strokeLinecap="round" />;
                                        }
                                        if (drawingShape.type === 'RECTANGLE') {
                                            const rx = Math.min(drawingShape.startX, drawingShape.endX);
                                            const ry = Math.min(drawingShape.startY, drawingShape.endY);
                                            const rw = Math.abs(drawingShape.endX - drawingShape.startX);
                                            const rh = Math.abs(drawingShape.endY - drawingShape.startY);
                                            return <rect x={rx} y={ry} width={rw} height={rh} stroke="#0f172a" strokeWidth="2" strokeDasharray="8,4" fill="transparent" />;
                                        }
                                    })()}
                                </svg>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden report for direct printing */}
            <div className="print-only">
                <RiskMapPdfGenerator
                    mapData={{
                        ...meta,
                        elements,
                        backgroundImage
                    }}
                    onBack={() => { }}
                />
            </div>
        </div>
    );
}
