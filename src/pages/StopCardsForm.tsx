import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ArrowLeft, Save, AlertTriangle, MapPin, Camera, User, Mic, MicOff, Sparkles, Search } from 'lucide-react';
import PremiumHeader from '../components/PremiumHeader';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import { usePaywall } from '../hooks/usePaywall';
import { auth } from '../firebase';
import AnimatedPage from '../components/AnimatedPage';

export default function StopCardsForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev: any) => ({ ...prev, photoBase64: reader.result }));
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

      recognition.onresult = async (event: any) => {
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

          setFormData((prev: any) => ({
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

      recognition.onerror = () => {
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
      history = history.map((item: any) => item.id === editData.id ? formData : item);
    } else {
      history.unshift(formData);
    }

    localStorage.setItem('stop_cards_history', JSON.stringify(history));
    syncCollection('stop_cards_history', history);

    toast.success(editData ? 'Tarjeta STOP actualizada' : 'Tarjeta STOP guardada');
    navigate('/stop-cards');
  };

  return (
    <AnimatedPage>
      <div className="container page-transition min-h-screen pb-16 pt-4">
        <main className="max-w-[1000px] mx-auto">
          <div className="no-print mb-6">
            <PremiumHeader
              title={editData ? 'Editar Tarjeta STOP' : 'Nueva Tarjeta STOP'}
              subtitle="Reporte de condiciones o actos inseguros"
              icon={<AlertTriangle size={32} color="#ffffff" />}
              color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 mb-6 flex-wrap">
            {!editData && (
              <button
                onClick={handleVoiceDictation}
                disabled={isListening || isProcessingAI}
                style={{
                  backgroundColor: isListening ? '#ef4444' : '#8b5cf6',
                  color: '#ffffff',
                  boxShadow: isListening ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border-none cursor-pointer">
                {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
                <span>{isListening ? 'Escuchando...' : 'Completar con Voz'}</span>
                {!isListening && <Sparkles size={14} />}
              </button>
            )}

            <button 
              onClick={() => navigate('/stop-cards')}
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all border-none cursor-pointer">
              <Search size={16} /> Ver Historial
            </button>
          </div>

          {/* Tarjeta Limpia de Formulario sin fondo negro forzado */}
          <div className={`p-8 md:p-10 bg-white dark:bg-slate-800 border-t-4 border-amber-500 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 ${isProcessingAI ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            <h2 className="text-xl m-0 mb-6 flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold">
              <AlertTriangle size={24} /> Datos del Hallazgo
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="form-group">
                <label className="font-bold mb-2 block text-slate-700 dark:text-slate-200 text-sm">Fecha</label>
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-colors" 
                />
              </div>

              <div className="form-group">
                <label className="font-bold mb-2 block text-slate-700 dark:text-slate-200 text-sm">Hora</label>
                <input 
                  type="time" 
                  name="time" 
                  value={formData.time} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-colors" 
                />
              </div>
            </div>

            <div className="form-group mb-6">
              <label className="font-bold mb-2 block text-slate-700 dark:text-slate-200 text-sm">Tipo de Observación</label>
              <select 
                name="type" 
                value={formData.type} 
                onChange={handleChange} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-colors font-bold">
                <option value="Condición Insegura">Condición Insegura</option>
                <option value="Acto Inseguro">Acto Inseguro</option>
                <option value="Casi Accidente">Casi Accidente</option>
                <option value="Acto Seguro">Acto Seguro (Positivo)</option>
              </select>
            </div>

            <div className="form-group mb-6">
              <label className="flex items-center gap-1.5 font-bold mb-2 text-slate-700 dark:text-slate-200 text-sm">
                <MapPin size={18} className="text-amber-500" /> Ubicación / Sector
              </label>
              <input 
                type="text" 
                name="location" 
                value={formData.location} 
                onChange={handleChange} 
                placeholder="Ej. Taller principal, Línea 2..." 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-colors" 
              />
            </div>

            <div className="form-group mb-6">
              <label className="flex items-center gap-1.5 font-bold mb-2 text-slate-700 dark:text-slate-200 text-sm">
                <AlertTriangle size={18} className="text-amber-500" /> Descripción del Hallazgo
              </label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows={3} 
                placeholder="Describí exactamente qué viste..." 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-colors resize-y"
              />
            </div>

            <div className="form-group mb-6">
              <label className="font-bold mb-2 block text-slate-700 dark:text-slate-200 text-sm">Acción Inmediata Tomada (opcional)</label>
              <textarea 
                name="actionTaken" 
                value={formData.actionTaken} 
                onChange={handleChange} 
                rows={2} 
                placeholder="Ej. Se detuvo la tarea, se limpió el área..." 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-colors resize-y"
              />
            </div>

            <div className="form-group mb-6">
              <label className="flex items-center gap-1.5 font-bold mb-2 text-slate-700 dark:text-slate-200 text-sm">
                <User size={18} className="text-amber-500" /> Reportado por
              </label>
              <input 
                type="text" 
                name="observer" 
                value={formData.observer} 
                onChange={handleChange} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-colors" 
              />
            </div>

            <div className="form-group mb-4">
              <label className="flex items-center gap-1.5 font-bold mb-2 text-slate-700 dark:text-slate-200 text-sm">
                <Camera size={18} className="text-amber-500" /> Evidencia Fotográfica (Opcional)
              </label>
              <div className="flex items-center gap-6 mt-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer flex items-center gap-2 font-extrabold text-xs shadow-md transition-all">
                  <Camera size={18} /> Capturar o Subir Foto
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                </label>
                {formData.photoBase64 && (
                  <img src={formData.photoBase64} alt="Evidencia" className="w-[80px] h-[80px] object-cover rounded-xl border-2 border-emerald-500 shadow-md" />
                )}
              </div>
            </div>
          </div>
        </main>

        <div className="no-print floating-action-bar">
          <button
            onClick={(e) => { e.preventDefault(); requirePro(handleSave); }}
            style={{ backgroundColor: '#059669', color: '#ffffff' }}
            className="btn-floating-action font-extrabold flex items-center gap-2 shadow-lg">
            <Save size={18} /> {editData ? 'ACTUALIZAR TARJETA' : 'GUARDAR TARJETA'}
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
}