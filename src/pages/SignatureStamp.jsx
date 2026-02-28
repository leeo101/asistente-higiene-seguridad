import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';

export default function SignatureStamp() {
    const navigate = useNavigate();
    const { syncDocument } = useSync();
    const signatureCanvasRef = useRef(null);
    const stampCanvasRef = useRef(null);
    const [isDrawingSignature, setIsDrawingSignature] = useState(false);
    const [isDrawingStamp, setIsDrawingStamp] = useState(false);
    const [signatureImage, setSignatureImage] = useState(null);
    const [stampImage, setStampImage] = useState(null);

    useEffect(() => {
        const savedData = localStorage.getItem('signatureStampData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setSignatureImage(parsed.signature);
            setStampImage(parsed.stamp);
        }
    }, []);

    const startDrawing = (e, type) => {
        const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        if (type === 'signature') setIsDrawingSignature(true);
        else setIsDrawingStamp(true);
    };

    const draw = (e, type) => {
        if (type === 'signature' && !isDrawingSignature) return;
        if (type === 'stamp' && !isDrawingStamp) return;

        const canvas = type === 'signature' ? signatureCanvasRef.current : stampCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
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
        if (type === 'signature') setSignatureImage(null);
        else setStampImage(null);
    };

    const handleFileUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (type === 'signature') setSignatureImage(event.target.result);
                else setStampImage(event.target.result);
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
                    <div style={{ position: 'relative', border: '2px dashed var(--color-border)', borderRadius: '8px', background: 'white', height: '150px', touchAction: 'none' }}>
                        {signatureImage ? (
                            <img src={signatureImage} alt="Firma" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <canvas
                                ref={signatureCanvasRef}
                                width={500}
                                height={150}
                                style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                                onMouseDown={(e) => startDrawing(e, 'signature')}
                                onMouseMove={(e) => draw(e, 'signature')}
                                onMouseUp={() => stopDrawing('signature')}
                                onMouseLeave={() => stopDrawing('signature')}
                                onTouchStart={(e) => startDrawing(e, 'signature')}
                                onTouchMove={(e) => draw(e, 'signature')}
                                onTouchEnd={() => stopDrawing('signature')}
                            />
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button onClick={() => clearCanvas('signature')} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Trash2 size={18} /> Limpiar
                        </button>
                        <label className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <Upload size={18} /> Subir
                            <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} />
                        </label>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Sello Profesional</h3>
                    <div style={{ position: 'relative', border: '2px dashed var(--color-border)', borderRadius: '8px', background: 'white', height: '150px', touchAction: 'none' }}>
                        {stampImage ? (
                            <img src={stampImage} alt="Sello" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <canvas
                                ref={stampCanvasRef}
                                width={500}
                                height={150}
                                style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                                onMouseDown={(e) => startDrawing(e, 'stamp')}
                                onMouseMove={(e) => draw(e, 'stamp')}
                                onMouseUp={() => stopDrawing('stamp')}
                                onMouseLeave={() => stopDrawing('stamp')}
                                onTouchStart={(e) => startDrawing(e, 'stamp')}
                                onTouchMove={(e) => draw(e, 'stamp')}
                                onTouchEnd={() => stopDrawing('stamp')}
                            />
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button onClick={() => clearCanvas('stamp')} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Trash2 size={18} /> Limpiar
                        </button>
                        <label className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <Upload size={18} /> Subir
                            <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'stamp')} />
                        </label>
                    </div>
                </div>

                <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 shadow-sm transition-all font-bold" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', width: '100%' }}>
                    <Save size={20} /> Guardar Firma y Sello
                </button>
            </div>
        </div>
    );
}
