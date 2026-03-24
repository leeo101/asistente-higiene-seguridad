import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Upload, PenTool } from 'lucide-react';

interface SignatureCanvasProps {
    onSave: (dataUrl: string | null) => void;
    initialImage?: string | null;
    label?: string;
    height?: number;
}

export default function SignatureCanvas({ 
    onSave, 
    initialImage = null, 
    label = "Firma", 
    height = 150 
}: SignatureCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const [image, setImage] = useState<string | null>(initialImage);
    const [strokeWidth, setStrokeWidth] = useState(2);

    useEffect(() => {
        setImage(initialImage);
        if (initialImage) setHasContent(true);
    }, [initialImage]);

    const getPos = (e: any, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas || image) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { x, y } = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing || image) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { x, y } = getPos(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasContent(true);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const dataUrl = canvasRef.current?.toDataURL();
        if (dataUrl) onSave(dataUrl);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        setImage(null);
        setHasContent(false);
        onSave(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setImage(result);
                setHasContent(true);
                onSave(result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            {label && (
                <label style={{ 
                    display: 'block', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    color: 'var(--color-text-muted)', 
                    textTransform: 'uppercase', 
                    marginBottom: '0.5rem' 
                }}>
                    {label}
                </label>
            )}
            
            <div style={{
                position: 'relative', 
                border: '2px dashed var(--color-border)',
                borderRadius: '12px', 
                background: 'var(--color-surface)', 
                height: `${height}px`, 
                touchAction: 'none', 
                overflow: 'hidden'
            }}>
                {image ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img src={image} alt="Firma" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255,255,255,0.8)', padding: '0.25rem', borderRadius: '50%', cursor: 'pointer' }} onClick={clearCanvas}>
                            <Trash2 size={16} color="#ef4444" />
                        </div>
                    </div>
                ) : (
                    <>
                        {!hasContent && (
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                pointerEvents: 'none', gap: '0.5rem', color: '#94a3b8', zIndex: 0
                            }}>
                                <PenTool size={18} />
                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Dibujá aquí tu firma</span>
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={height}
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                cursor: 'crosshair', 
                                display: 'block',
                                position: 'relative',
                                zIndex: 1
                            }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
                            onTouchMove={(e) => { e.preventDefault(); draw(e); }}
                            onTouchEnd={stopDrawing}
                        />
                    </>
                )}
            </div>

            {!image && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.75rem', padding: '0 0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Grosor:</span>
                    <input
                        type="range" min={1} max={6} step={0.5}
                        value={strokeWidth}
                        onChange={e => setStrokeWidth(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                    />
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button 
                    type="button"
                    onClick={clearCanvas} 
                    className="btn-secondary" 
                    style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                        padding: '0.5rem'
                    }}
                >
                    <Trash2 size={16} /> Limpiar
                </button>
                <label 
                    className="btn-secondary" 
                    style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.5rem', 
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '0.5rem'
                    }}
                >
                    <Upload size={16} /> Subir Imagen
                    <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                </label>
            </div>
        </div>
    );
}
