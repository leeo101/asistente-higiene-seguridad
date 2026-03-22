import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ArrowLeft, Save, AlertTriangle, MapPin, Camera, User } from 'lucide-react';

export default function StopCards(): React.ReactElement | null {
    useDocumentTitle('Nueva Tarjeta STOP');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();

    const [formData, setFormData] = useState({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        type: 'Condición Insegura',
        location: '',
        description: '',
        actionTaken: '',
        observer: currentUser?.displayName || currentUser?.email || 'Usuario',
        photoBase64: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photoBase64: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!formData.location || !formData.description) {
            alert("Por favor completá ubicación y descripción.");
            return;
        }

        const history = JSON.parse(localStorage.getItem('stop_cards_history') || '[]');
        const updated = [formData, ...history];
        localStorage.setItem('stop_cards_history', JSON.stringify(updated));
        syncCollection('stop_cards_history', updated);

        navigate('/stop-cards-history');
    };

    return (
        <div className="container page-transition" style={{ paddingBottom: '4rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/#tools')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Tarjeta STOP</h1>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Fecha</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Hora</label>
                        <input type="time" name="time" value={formData.time} onChange={handleChange} className="form-control" />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Tipo de Observación</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="form-control">
                        <option value="Condición Insegura">Condición Insegura</option>
                        <option value="Acto Inseguro">Acto Inseguro</option>
                        <option value="Casi Accidente">Casi Accidente</option>
                        <option value="Acto Seguro">Acto Seguro (Positivo)</option>
                    </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={16} /> Ubicación / Sector</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="form-control" placeholder="Ej. Taller principal, Línea 2..." />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertTriangle size={16} /> Descripción del Hallazgo</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="form-control" rows={3} placeholder="Describí exactamente qué viste..."></textarea>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Acción Inmediata Tomada (opcional)</label>
                    <textarea name="actionTaken" value={formData.actionTaken} onChange={handleChange} className="form-control" rows={2} placeholder="Ej. Se detuvo la tarea, se limpió el área..."></textarea>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={16} /> Reportado por</label>
                    <input type="text" name="observer" value={formData.observer} onChange={handleChange} className="form-control" />
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Camera size={16} /> Evidencia Fotográfica (Opcional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <label style={{
                            padding: '0.8rem 1.2rem', background: 'var(--color-surface)', border: '1px dashed var(--color-border)',
                            borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontWeight: 600, color: 'var(--color-text-muted)'
                        }}>
                            <Camera size={20} /> Capturar o Subir
                            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                        </label>
                        {formData.photoBase64 && (
                            <img src={formData.photoBase64} alt="Evidencia" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--color-primary)' }} />
                        )}
                    </div>
                </div>

                <button onClick={handleSave} className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    <Save size={20} /> Guardar Tarjeta STOP
                </button>
            </div>
        </div>
    );
}
