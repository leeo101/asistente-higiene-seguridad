import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Upload, PenTool, CheckCircle } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';

export default function SignatureStamp(): React.ReactElement | null {
    const navigate = useNavigate();
    const { syncDocument } = useSync();
    const signatureCanvasRef = useRef(null);
    const stampCanvasRef = useRef(null);
    const [isDrawingSignature, setIsDrawingSignature] = useState(false);
    const [isDrawingStamp, setIsDrawingStamp] = useState(false);
    const [signatureImage, setSignatureImage] = useState(null);
    const [stampImage, setStampImage] = useState(null);
    const [signatureStrokeWidth, setSignatureStrokeWidth] = useState(2);
    const [stampStrokeWidth, setStampStrokeWidth] = useState(2);
    const [signatureHasContent, setSignatureHasContent] = useState(false);
    const [stampHasContent, setStampHasContent] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedData = localStorage.getItem('signatureStampData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setSignatureImage(parsed.signature);
            setStampImage(parsed.stamp);
        }
    }, []);

    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const startDrawing = (e, type) => {
        const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { x, y } = getPos(e, canvas);
        const strokeW = type === 'signature' ? signatureStrokeWidth : stampStrokeWidth;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = strokeW;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (type === 'signature') setIsDrawingSignature(true);
        else setIsDrawingStamp(true);
    };

    const draw = (e, type) => {
        if (type === 'signature' && !isDrawingSignature) return;
        if (type === 'stamp' && !isDrawingStamp) return;
        const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { x, y } = getPos(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (type === 'signature') setSignatureHasContent(true);
        else setStampHasContent(true);
    };

    const stopDrawing = (type) => {
        if (type === 'signature') setIsDrawingSignature(false);
        else setIsDrawingStamp(false);
    };

    const clearCanvas = (type) => {
        const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (type === 'signature') { setSignatureImage(null); setSignatureHasContent(false); }
        else { setStampImage(null); setStampHasContent(false); }
    };

    const handleFileUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (type === 'signature') { setSignatureImage(event.target.result); setSignatureHasContent(true); }
                else { setStampImage(event.target.result); setStampHasContent(true); }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        const data = {
            signature: signatureImage || signatureCanvasRef.current?.toDataURL(),
            stamp: stampImage || stampCanvasRef.current?.toDataURL()
        };
        await syncDocument('signatureStampData', data);
        setSaved(true);
        toast.success('Firma y Sello guardados correctamente');
        setTimeout(() => {
            setSaved(false);
            navigate('/profile');
        }, 800);
    };

    const renderCanvasArea = ({ type, canvasRef, image, hasContent, strokeWidth, onStrokeChange, title, description }) => (
        <div style={{
            background: 'rgba(var(--color-surface-rgb), 0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            padding: '1.5rem',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                <div style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '0.6rem',
                    borderRadius: '12px',
                    color: 'var(--color-primary)',
                    display: 'flex'
                }}>
                    <PenTool size={20} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.05rem' }}>{title}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{description}</p>
                </div>
            </div>

            <div style={{
                position: 'relative',
                border: `2px dashed ${image ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: '14px',
                background: 'white',
                height: '160px',
                touchAction: 'none',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                boxShadow: image ? '0 4px 15px rgba(56, 189, 248, 0.1)' : 'none'
            }}>
                {image ? (
                    <img src={image} alt={type === 'signature' ? 'Firma' : 'Sello'} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', boxSizing: 'border-box' }} />
                ) : (
                    <>
                        {!hasContent && (
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                pointerEvents: 'none', gap: '0.5rem', color: '#94a3b8', flexDirection: 'column'
                            }}>
                                <PenTool size={28} color="#cbd5e1" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Dibujá aquí con el mouse o dedo</span>
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={160}
                            style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
                            onMouseDown={(e) => startDrawing(e, type)}
                            onMouseMove={(e) => draw(e, type)}
                            onMouseUp={() => stopDrawing(type)}
                            onMouseLeave={() => stopDrawing(type)}
                            onTouchStart={(e) => { e.preventDefault(); startDrawing(e, type); }}
                            onTouchMove={(e) => { e.preventDefault(); draw(e, type); }}
                            onTouchEnd={() => stopDrawing(type)}
                        />
                    </>
                )}
            </div>

            {/* Stroke width slider */}
            {!image && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>Grosor:</span>
                    <input
                        type="range" min={1} max={6} step={0.5}
                        value={strokeWidth}
                        onChange={e => onStrokeChange(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{
                        width: `${Math.max(strokeWidth * 3, 4)}px`,
                        height: `${Math.max(strokeWidth * 3, 4)}px`,
                        borderRadius: '50%', background: '#1e293b',
                        flexShrink: 0, transition: 'all 0.2s'
                    }} />
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                <button onClick={() => clearCanvas(type)}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.8rem',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        color: 'var(--color-text)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--color-background)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.color = 'var(--color-text)';
                    }}
                >
                    <Trash2 size={16} /> Limpiar
                </button>
                <label
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.8rem',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '12px',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'}
                >
                    <Upload size={16} /> Subir imagen
                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, type)} />
                </label>
            </div>
        </div>
    );

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '600px', paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '0.6rem',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft size={20}  />
                        </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Firma y Sello Digital</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Dibujá o subí tu firma y sello profesional</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {renderCanvasArea({
                    type: "signature",
                    canvasRef: signatureCanvasRef,
                    image: signatureImage,
                    hasContent: signatureHasContent,
                    strokeWidth: signatureStrokeWidth,
                    onStrokeChange: setSignatureStrokeWidth,
                    title: "Firma Digital",
                    description: "Usada en todos los documentos y reportes"
                })}

                {renderCanvasArea({
                    type: "stamp",
                    canvasRef: stampCanvasRef,
                    image: stampImage,
                    hasContent: stampHasContent,
                    strokeWidth: stampStrokeWidth,
                    onStrokeChange: setStampStrokeWidth,
                    title: "Sello Profesional",
                    description: "Sello oficial del profesional"
                })}

                <button
                    onClick={handleSave}
                    style={{
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem',
                        padding: '1.1rem', width: '100%',
                        background: saved ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #38bdf8, #3b82f6)',
                        color: 'white', border: 'none', borderRadius: '16px',
                        fontSize: '1.05rem', fontWeight: 800, cursor: 'pointer',
                        boxShadow: saved ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 8px 20px rgba(56, 189, 248, 0.3)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                    {saved ? <><CheckCircle size={20} /> ¡Guardado!</> : <><Save size={20} /> Guardar Firma y Sello</>}
                </button>
            </div>
        </div>
    );
}
