import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Camera, Trash2, CheckCircle2, RefreshCw, Upload } from 'lucide-react';

export default function Photos(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const { fromObservation, itemId } = location.state || {};
    const [photos, setPhotos] = useState([]);
    const fileInputRef = useRef(null);

    // Load existing photos if any
    useEffect(() => {
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            if (fromObservation && itemId) {
                const obs = inspection.observations?.find(o => o.itemId === itemId);
                if (obs && obs.photos) {
                    setPhotos(obs.photos);
                }
            } else if (inspection.photos) {
                setPhotos(inspection.photos);
            }
        }
    }, [fromObservation, itemId]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files as FileList) as File[];
        let loadedCount = 0;
        const newPhotos = [];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPhotos.push(reader.result as any);
                loadedCount++;
                if (loadedCount === files.length) {
                    setPhotos((prev: any) => [...prev, ...newPhotos]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const triggerCapture = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSave = () => {
        const current = localStorage.getItem('current_inspection');
        if (current) {
            const inspection = JSON.parse(current);
            
            if (fromObservation && itemId) {
                // Attach to specific observation
                if (!inspection.observations) inspection.observations = [];
                const obsIdx = inspection.observations.findIndex(o => o.itemId === itemId);
                if (obsIdx >= 0) {
                    inspection.observations[obsIdx].photos = photos;
                    // Also set the first one as primary for old compatibility
                    inspection.observations[obsIdx].photo = photos[0] || null;
                }
            } else {
                // General evidence
                inspection.photos = photos;
            }
            
            localStorage.setItem('current_inspection', JSON.stringify(inspection));
            console.log('[Photos] Saved to current_inspection. Observations:', inspection.observations?.length);
        }
        navigate('/checklist');
    };

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.8rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', cursor: 'pointer', color: 'var(--color-text)', display: 'flex' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Registro Fotográfico</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {fromObservation ? `Evidencia para Hallazgo #${itemId}` : 'Evidencia general del relevamiento'}
                    </p>
                </div>
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
                border: '2px dashed var(--color-primary)',
                borderRadius: '24px',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(37, 99, 235, 0.03)',
                marginBottom: '2rem',
                cursor: 'pointer',
                padding: '2rem',
                transition: 'all 0.3s ease'
            }} onClick={triggerCapture}>
                <div style={{ background: 'var(--color-primary)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)' }}>
                    <Camera size={32} color="white" />
                </div>
                <p style={{ fontWeight: 800, textAlign: 'center', color: 'var(--color-primary)', fontSize: '1.1rem' }}>Toca para capturar fotos</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>Podés subir múltiples imágenes de evidencia</p>
            </div>

            {photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {photos.map((photo, index) => (
                        <div key={index} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', height: '140px' }}>
                            <img src={photo} alt={`Captura ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    width: '32px', height: '32px',
                                    background: '#ef4444',
                                    color: '#ffffff',
                                    borderRadius: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}
                                onClick={(e) => { e.stopPropagation(); setPhotos(photos.filter((_, i) => i !== index)); }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'var(--color-background)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', zIndex: 100 }}>
                <button
                    className="btn-outline"
                    onClick={triggerCapture}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '12px', fontWeight: 700 }}
                >
                    <Upload size={20} /> AGREGAR MÁS
                </button>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '12px', fontWeight: 800 }}
                >
                    <CheckCircle2 size={20} /> GUARDAR Y VOLVER
                </button>
            </div>
        </div>
    );
}
