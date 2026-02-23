import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Photos() {
    const navigate = useNavigate();
    const [photos, setPhotos] = useState([]);

    const handleTakePhoto = () => {
        // Mock photo capture
        setPhotos([...photos, `https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=200&h=150`]);
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Registro Fotográfico</h1>
            </div>

            <div style={{
                border: '2px dashed var(--color-border)',
                borderRadius: '16px',
                height: '300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-surface-hover)',
                marginBottom: '2rem',
                cursor: 'pointer'
            }} onClick={handleTakePhoto}>
                <Camera size={48} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
                <p style={{ fontWeight: 600 }}>Toca para capturar evidencia</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Mínimo 1 fotografía recomendada</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {photos.map((photo, index) => (
                    <div key={index} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                        <img src={photo} alt={`Captura ${index}`} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                        <button
                            style={{ position: 'absolute', top: '5px', right: '5px', padding: '0.3rem', background: 'rgba(239, 68, 68, 0.8)', color: 'white', borderRadius: '50%', border: 'none' }}
                            onClick={(e) => { e.stopPropagation(); setPhotos(photos.filter((_, i) => i !== index)); }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    className="btn-secondary"
                    onClick={handleTakePhoto}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <RefreshCw size={20} /> Reintentar
                </button>
                <button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 shadow-sm transition-all font-bold"
                    onClick={() => navigate('/checklist')}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}
                >
                    <CheckCircle2 size={20} /> Guardar Foto
                </button>
            </div>
        </div>
    );
}
