import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, MousePointer2, Type, Move, Trash2, Printer,
    Image as ImageIcon, ZoomIn, ZoomOut, Download, AlertTriangle, ThermometerSun
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

import { SAFETY_ICONS } from '../data/mapIcons';

export default function RiskMapGenerator() {
    useDocumentTitle('Creador de Mapas de Riesgo');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Metadata
    const [meta, setMeta] = useState({
        empresa: '',
        sector: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    // Canvas State
    const [elements, setElements] = useState([]); // List of dropped icons/texts
    const [backgroundImage, setBackgroundImage] = useState(null); // Data URL of the uploaded floorplan

    // Editor State
    const [selectedTool, setSelectedTool] = useState('select'); // 'select', id of icon, 'text'
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    // Temporary text editing
    const [editingTextId, setEditingTextId] = useState(null);
    const [textInputValue, setTextInputValue] = useState('');

    // Categories for the sidebar
    const categories = {
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
        if (selectedTool && selectedTool !== 'select') {
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
        if (!isDragging || !selectedElementId || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;

        const newX = mouseX - dragOffset.x;
        const newY = mouseY - dragOffset.y;

        setElements(elements.map(el =>
            el.id === selectedElementId ? { ...el, x: newX, y: newY } : el
        ));
    };

    const handleCanvasMouseUp = () => {
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

    // Mock Save
    const handleSave = () => {
        if (!meta.empresa || !meta.sector) {
            toast.error('Complete la Empresa y el Sector antes de guardar.');
            return;
        }

        toast.success('Mapa guardado temporalmente. Faltan detalles de exportación.');
    };


    return (
        <div className="container" style={{ paddingBottom: '1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} style={{ padding: '0.4rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '50%' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Creador de Mapas de Riesgo</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={clearCanvas} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, padding: '0.5rem 1rem' }}>
                        <Trash2 size={16} /> Borrar Todo
                    </button>
                    <button onClick={handleSave} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, padding: '0.5rem 1rem' }}>
                        <Save size={16} /> Guardar Progreso
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
                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)'
                        }}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
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
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
