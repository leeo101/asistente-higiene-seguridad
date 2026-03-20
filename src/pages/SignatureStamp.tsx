import React from 'react';

import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';

import { ArrowLeft, Save, Trash2, Upload, PenTool } from 'lucide-react';
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
        toast.success('Firma y Sello guardados correctamente');
        navigate('/profile');
    };

    const renderCanvasArea = ({ type, canvasRef, image, hasContent, strokeWidth, onStrokeChange }) => (
        <div>
            <div style={{
                position: 'relative', border: '2px dashed var(--color-border)',
                borderRadius: '10px', background: 'white', height: '150px', touchAction: 'none', overflow: 'hidden'
            }}>
                {image ? (
                    <img src={image} alt={type === 'signature' ? 'Firma' : 'Sello'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                    <>
                        {!hasContent && (
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                pointerEvents: 'none', gap: '0.5rem', color: '#94a3b8'
                            }}>
                                <PenTool size={18} />
                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Dibujá aquí con el mouse o dedo</span>
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={150}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.75rem', padding: '0 0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Grosor:</span>
                    <input
                        type="range" min={1} max={6} step={0.5}
                        value={strokeWidth}
                        onChange={e => onStrokeChange(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{
                        width: `${strokeWidth * 4}px`, height: `${strokeWidth * 4}px`,
                        borderRadius: '50%', background: '#1e293b',
                        flexShrink: 0, minWidth: '4px', minHeight: '4px'
                    }} />
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button onClick={() => clearCanvas(type)} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Trash2 size={18} /> Limpiar
                </button>
                <label className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <Upload size={18} /> Subir imagen
                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, type)} />
                </label>
            </div>
        </div>
    );

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Firma y Sello Digital</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Firma Digital</h3>
                    {renderCanvasArea({
                        type: "signature",
                        canvasRef: signatureCanvasRef,
                        image: signatureImage,
                        hasContent: signatureHasContent,
                        strokeWidth: signatureStrokeWidth,
                        onStrokeChange: setSignatureStrokeWidth
                    })}
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Sello Profesional</h3>
                    {renderCanvasArea({
                        type: "stamp",
                        canvasRef: stampCanvasRef,
                        image: stampImage,
                        hasContent: stampHasContent,
                        strokeWidth: stampStrokeWidth,
                        onStrokeChange: setStampStrokeWidth
                    })}
                </div>

                <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 shadow-sm transition-all font-bold" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', width: '100%' }}>
                    <Save size={20} /> Guardar Firma y Sello
                </button>
            </div>
        </div>
    );
}
