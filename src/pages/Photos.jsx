import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Trash2, ArrowLeft, Save } from 'lucide-react';

export default function Photos() {
    const navigate = useNavigate();
    const [photos, setPhotos] = useState([]);

    const handleCapture = () => {
        const newPhoto = `https://placehold.co/400x300/333/fff?text=Foto+${photos.length + 1}`;
        setPhotos([...photos, { id: Date.now(), url: newPhoto, legend: '' }]);
    };

    const removePhoto = (id) => {
        setPhotos(photos.filter(p => p.id !== id));
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none' }}>
                    <ArrowLeft />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Evidencia Fotográfica</h1>
            </div>

            <button
                onClick={handleCapture}
                style={{ width: '100%', padding: '2rem', border: '2px dashed var(--color-primary)', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderRadius: '12px' }}
            >
                <Camera size={48} />
                <span style={{ fontWeight: 600 }}>Tomar Foto</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {photos.map((photo, index) => (
                    <div key={photo.id} className="card" style={{ padding: '0.5rem', position: 'relative' }}>
                        <img src={photo.url} alt="Evidencia" style={{ width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }} />
                        <input
                            type="text"
                            placeholder="Leyenda..."
                            style={{ fontSize: '0.8rem', padding: '0.4rem', marginBottom: 0 }}
                        />
                        <button
                            onClick={() => removePhoto(photo.id)}
                            style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <button className="btn-primary" onClick={() => navigate(-1)} style={{ marginTop: '2rem' }}>
                <Save size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Guardar Cambios
            </button>
        </div>
    );
}
