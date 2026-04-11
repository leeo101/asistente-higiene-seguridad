import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ArrowLeft, Save, AlertTriangle, MapPin, Camera, User, Mic, MicOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';

export default function StopCards(): React.ReactElement | null {
    const navigate = useNavigate();
    const location = useLocation();
    const editData = location.state?.editData;

    useDocumentTitle(editData ? 'Editar Tarjeta STOP' : 'Nueva Tarjeta STOP');
    
    const { currentUser } = useAuth();
    const { syncCollection } = useSync();

    const [formData, setFormData] = useState(editData || {
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

    const [isListening, setIsListening] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const { requirePro } = usePaywall();

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

    const handleVoiceDictation = () => {
        requirePro(() => {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                toast.error('Tu navegador no soporta reconocimiento de voz.');
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'es-AR';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                setIsListening(true);
                toast('Escuchando dictado... (Hablá ahora)', { icon: '🎙️' });
            };

            recognition.onresult = async (event) => {
                const transcript = event.results[0][0].transcript;
                setIsListening(false);
                setIsProcessingAI(true);
                toast.loading('Procesando dictado con IA...', { id: 'ai-voice' });

                try {
                    const response = await fetch(`${API_BASE_URL}/api/ai-stopcard`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transcript })
                    });
                    if (!response.ok) throw new Error('Error al conectar con IA');
                    const parsed = await response.json();
                    
                    setFormData(prev => ({
                        ...prev,
                        type: parsed.type || prev.type,
                        location: parsed.location || prev.location,
                        description: parsed.description || prev.description,
                        actionTaken: parsed.actionTaken || prev.actionTaken
                    }));

                    toast.success('Formulario autocompletado con IA', { id: 'ai-voice' });
                } catch (error) {
                    console.error("Error from AI:", error);
                    toast.error('No se pudo procesar la voz con IA. Autocompletá a mano.', { id: 'ai-voice' });
                } finally {
                    setIsProcessingAI(false);
                }
            };

            recognition.onerror = (event) => {
                setIsListening(false);
                toast.error('Error al escuchar. Intentá de nuevo.');
            };

            recognition.start();
        });
    };

    const handleSave = () => {
        if (!formData.location || !formData.description) {
            toast.error("Por favor completá ubicación y descripción.");
            return;
        }

        let history = JSON.parse(localStorage.getItem('stop_cards_history') || '[]');
        
        if (editData) {
            history = history.map(item => item.id === editData.id ? formData : item);
        } else {
            history.unshift(formData);
        }

        localStorage.setItem('stop_cards_history', JSON.stringify(history));
        syncCollection('stop_cards_history', history);

        toast.success(editData ? 'Tarjeta STOP actualizada' : 'Tarjeta STOP guardada');
        navigate('/stop-cards-history');
    };

    return (
        <div className="container page-transition" style={{ paddingBottom: '4rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(editData ? '/stop-cards-history' : '/#tools')} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                    {editData ? 'Editar Tarjeta STOP' : 'Tarjeta STOP'}
                </h1>
                
                {!editData && (
                    <button 
                        onClick={handleVoiceDictation} 
                        disabled={isListening || isProcessingAI}
                        style={{ 
                            marginLeft: 'auto', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: isListening ? '#ef4444' : 'var(--gradient-premium)', color: 'white', 
                            border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(59,130,246,0.3)', transition: 'all 0.2s'
                        }}
                    >
                        {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                        <span className="hidden sm:inline">{isListening ? 'Escuchando...' : 'Completar con Voz'}</span>
                        {!isListening && <Sparkles size={14} />}
                    </button>
                )}
            </div>

            <div className="card" style={{ padding: '1.5rem', opacity: isProcessingAI ? 0.6 : 1, pointerEvents: isProcessingAI ? 'none' : 'all' }}>
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
                    <Save size={20} /> {editData ? 'Actualizar Tarjeta' : 'Guardar Tarjeta STOP'}
                </button>
            </div>
        </div>
    );
}
