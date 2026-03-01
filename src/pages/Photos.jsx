import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Trash2, CheckCircle2, RefreshCw, Upload } from 'lucide-react';

export default function Photos() {
    const navigate = useNavigate();
    const [photos, setPhotos] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const triggerCapture = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Registro Fotográfico</h1>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                multiple
                style={{ display: 'none' }}
            />

            <div style={{
                border: '2px dashed var(--color-border)',
                borderRadius: '16px',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-surface-hover)',
                marginBottom: '2rem',
                cursor: 'pointer',
                padding: '2rem'
            }} onClick={triggerCapture}>
                <Camera size={48} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
                <p style={{ fontWeight: 600, textAlign: 'center' }}>Toca para capturar evidencia</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Podés usar la cámara o elegir de tu galería</p>
            </div>

            {photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {photos.map((photo, index) => (
                        <div key={index} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <img src={photo} alt={`Captura ${index}`} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                            <button
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    padding: '0.4rem',
                                    background: 'rgba(239, 68, 68, 0.9)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onClick={(e) => { e.stopPropagation(); setPhotos(photos.filter((_, i) => i !== index)); }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    className="btn-secondary"
                    onClick={triggerCapture}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <Upload size={20} /> Subir Más
                </button>
                <button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 shadow-sm transition-all font-bold"
                    onClick={() => {
                        // Guardar fotos en la inspección actual si es necesario
                        const current = localStorage.getItem('current_inspection');
                        if (current) {
                            const inspection = JSON.parse(current);
                            inspection.photos = photos;
                            localStorage.setItem('current_inspection', JSON.stringify(inspection));
                        }
                        navigate('/checklist');
                    }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', cursor: 'pointer' }}
                >
                    <CheckCircle2 size={20} /> Guardar Evidencia
                </button>
            </div>
        </div>
    );
}
