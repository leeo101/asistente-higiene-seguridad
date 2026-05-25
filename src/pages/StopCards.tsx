import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ArrowLeft, Save, AlertTriangle, MapPin, Camera, User, Mic, MicOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';
import { auth } from '../firebase';

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
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
                        },
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
        <div className="container page-transition" style={{ paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(editData ? '/stop-cards-history' : '/#tools')} style={{ padding: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '50%', cursor: 'pointer', color: 'var(--color-text)' }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                    {editData ? 'Editar Tarjeta STOP' : 'Tarjeta STOP'}
                </h1>
                
                {!editData && (
                    <button 
                        onClick={handleVoiceDictation} 
                        disabled={isListening || isProcessingAI}
                        style={{ 
                            marginLeft: 'auto', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: isListening ? '#ef4444' : 'var(--gradient-premium)', color: 'white', 
                            border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 800, cursor: 'pointer',
                            boxShadow: isListening ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(59,130,246,0.3)', transition: 'all 0.2s'
                        }}
                    >
                        {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                        <span className="hidden sm:inline">{isListening ? 'Escuchando...' : 'Completar con Voz'}</span>
                        {!isListening && <Sparkles size={14} />}
                    </button>
                )}
            </div>

            <div className="card animate-fade-in" style={{ padding: '2.5rem', background: 'rgba(var(--color-surface-rgb), 0.3)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)', opacity: isProcessingAI ? 0.6 : 1, pointerEvents: isProcessingAI ? 'none' : 'all' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                        <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block', color: 'var(--color-text)' }}>Fecha</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-control" style={{ borderRadius: '12px', padding: '0.8rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-background)', width: '100%' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block', color: 'var(--color-text)' }}>Hora</label>
                        <input type="time" name="time" value={formData.time} onChange={handleChange} className="form-control" style={{ borderRadius: '12px', padding: '0.8rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-background)', width: '100%' }} />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block', color: 'var(--color-text)' }}>Tipo de Observación</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="form-control" style={{ borderRadius: '12px', padding: '0.8rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-background)', width: '100%', fontWeight: 600 }}>
                        <option value="Condición Insegura">Condición Insegura</option>
                        <option value="Acto Inseguro">Acto Inseguro</option>
                        <option value="Casi Accidente">Casi Accidente</option>
                        <option value="Acto Seguro">Acto Seguro (Positivo)</option>
                    </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}><MapPin size={18} color="var(--color-primary)" /> Ubicación / Sector</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="form-control" placeholder="Ej. Taller principal, Línea 2..." style={{ borderRadius: '12px', padding: '0.8rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-background)', width: '100%' }} />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}><AlertTriangle size={18} color="#f59e0b" /> Descripción del Hallazgo</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="form-control" rows={3} placeholder="Describí exactamente qué viste..." style={{ borderRadius: '12px', padding: '0.8rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-background)', width: '100%', resize: 'vertical' }}></textarea>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block', color: 'var(--color-text)' }}>Acción Inmediata Tomada (opcional)</label>
                    <textarea name="actionTaken" value={formData.actionTaken} onChange={handleChange} className="form-control" rows={2} placeholder="Ej. Se detuvo la tarea, se limpió el área..." style={{ borderRadius: '12px', padding: '0.8rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-background)', width: '100%', resize: 'vertical' }}></textarea>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}><User size={18} color="var(--color-primary)" /> Reportado por</label>
                    <input type="text" name="observer" value={formData.observer} onChange={handleChange} className="form-control" style={{ borderRadius: '12px', padding: '0.8rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-background)', width: '100%' }} />
                </div>

                <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}><Camera size={18} color="var(--color-primary)" /> Evidencia Fotográfica (Opcional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem', background: 'rgba(30, 41, 59, 0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <label style={{
                            padding: '0.8rem 1.5rem', background: 'var(--color-surface)', border: '1px dashed var(--color-primary)',
                            borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontWeight: 700, color: 'var(--color-primary)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }} className="hover:bg-blue-50/10">
                            <Camera size={20} /> Capturar o Subir
                            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                        </label>
                        {formData.photoBase64 && (
                            <img src={formData.photoBase64} alt="Evidencia" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--color-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        )}
                    </div>
                </div>

                <button onClick={handleSave} className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', borderRadius: '12px', fontWeight: 800, background: 'var(--gradient-premium)' }}>
                    <Save size={20} /> {editData ? 'Actualizar Tarjeta' : 'Guardar Tarjeta STOP'}
                </button>
            </div>
        </div>
    );
}
