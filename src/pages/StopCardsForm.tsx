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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoBase64: reader.result }));
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

          setFormData((prev) => ({
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
      history = history.map((item) => item.id === editData.id ? formData : item);
    } else {
      history.unshift(formData);
    }

    localStorage.setItem('stop_cards_history', JSON.stringify(history));
    syncCollection('stop_cards_history', history);

    toast.success(editData ? 'Tarjeta STOP actualizada' : 'Tarjeta STOP guardada');
    navigate('/stop-cards');
  };

  return (
    <div className="container page-transition min-h-screen bg-slate-950 pb-16">
            <main className="max-w-[1000px] mx-auto">
                <div className="no-print mb-8">
                    <PremiumHeader
            title={editData ? 'Editar Tarjeta STOP' : 'Nueva Tarjeta STOP'}
            subtitle="Reporte de condiciones o actos inseguros"
            icon={<AlertTriangle size={32} color="#ffffff" />}
            color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
          
                    <div className="flex justify-between items-center flex-wrap gap-4 mt-4">
                        <></>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 mt-6 mb-8 flex-wrap">

                    <div className="flex gap-3 flex-wrap">
                        {!editData &&
            <button
              onClick={handleVoiceDictation}
              disabled={isListening || isProcessingAI}
              style={{

                background: isListening ? '#ef4444' : 'var(--gradient-premium)',

                boxShadow: isListening ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(59,130,246,0.3)'
              }} className="p-[0.8rem_1.5rem] flex items-center gap-[0.5rem] text-[white] border-none rounded-[12px] font-[800] cursor-pointer transition-[all_0.2s]">
              
                                {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                                <span className="hidden sm:inline">{isListening ? 'Escuchando...' : 'Completar con Voz'}</span>
                                {!isListening && <Sparkles size={14} />}
                            </button>
            }
                        <button onClick={() => navigate('/stop-cards')} className="flex items-center gap-[0.5rem] p-[0.8rem_1.2rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-primary)] text-[var(--color-primary)] rounded-[12px] text-[0.9rem] font-[700] cursor-pointer">



              
                            <Search size={18} /> Ver Historial
                        </button>
                    </div>
                </div>

                <div className={`card animate-fade-in p-10 bg-slate-900/50 border-t-4 border-amber-500 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${isProcessingAI ? "opacity-60 pointer-events-none" : "opacity-100 pointer-events-auto"}`}>
                    <h2 className="text-xl m-0 mb-6 flex items-center gap-2 text-amber-500 font-extrabold">
                        <AlertTriangle size={24} /> Datos del Hallazgo
                    </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="form-group">
                        <label className="font-bold mb-2 block text-slate-200">Fecha</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 outline-none focus:border-amber-500 transition-colors text-white" />
                    </div>
                    <div className="form-group">
                        <label className="font-bold mb-2 block text-slate-200">Hora</label>
                        <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 outline-none focus:border-amber-500 transition-colors text-white" />
                    </div>
                </div>

                <div className="form-group mb-6">
                    <label className="font-bold mb-2 block text-slate-200">Tipo de Observación</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 outline-none focus:border-amber-500 transition-colors font-semibold text-white">
                        <option value="Condición Insegura">Condición Insegura</option>
                        <option value="Acto Inseguro">Acto Inseguro</option>
                        <option value="Casi Accidente">Casi Accidente</option>
                        <option value="Acto Seguro">Acto Seguro (Positivo)</option>
                    </select>
                </div>

                <div className="form-group mb-6">
                    <label className="flex items-center gap-1.5 font-bold mb-2 text-slate-200"><MapPin size={18} color="var(--color-primary)" /> Ubicación / Sector</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Ej. Taller principal, Línea 2..." className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 outline-none focus:border-amber-500 transition-colors text-white" />
                </div>

                <div className="form-group mb-6">
                    <label className="flex items-center gap-1.5 font-bold mb-2 text-slate-200"><AlertTriangle size={18} color="#f59e0b" /> Descripción del Hallazgo</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describí exactamente qué viste..." className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 outline-none focus:border-amber-500 transition-colors resize-y text-white"></textarea>
                </div>

                <div className="form-group mb-6">
                    <label className="font-bold mb-2 block text-slate-200">Acción Inmediata Tomada (opcional)</label>
                    <textarea name="actionTaken" value={formData.actionTaken} onChange={handleChange} rows={2} placeholder="Ej. Se detuvo la tarea, se limpió el área..." className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 outline-none focus:border-amber-500 transition-colors resize-y text-white"></textarea>
                </div>

                <div className="form-group mb-6">
                    <label className="flex items-center gap-1.5 font-bold mb-2 text-slate-200"><User size={18} color="var(--color-primary)" /> Reportado por</label>
                    <input type="text" name="observer" value={formData.observer} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 outline-none focus:border-amber-500 transition-colors text-white" />
                </div>

                <div className="form-group mb-[2.5rem]">
                    <label className="flex items-center gap-1.5 font-bold mb-2 text-slate-200"><Camera size={18} color="var(--color-primary)" /> Evidencia Fotográfica (Opcional)</label>
                    <div className="flex items-center gap-6 mt-2 bg-slate-800/20 p-4 rounded-xl border border-slate-700/50">
                        <label className="px-6 py-3 bg-slate-900 border border-dashed border-emerald-500 rounded-xl cursor-pointer flex items-center gap-2 font-bold text-emerald-500 transition-all shadow-sm hover:bg-emerald-500/10 hover:bg-blue-50/10">
                            <Camera size={20} /> Capturar o Subir
                            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="none" />
                        </label>
                        {formData.photoBase64 &&
              <img src={formData.photoBase64} alt="Evidencia" className="w-[80px] h-[80px] object-fit-[cover] rounded-[8px] border-[2px_solid_var(--color-primary)] box-shadow-[0_4px_12px_rgba(0,0,0,0.1)]" />
              }
                    </div>
                </div>
                </div>
            </main>

            <div className="no-print floating-action-bar">
                <button
          onClick={(e) => {e.preventDefault();requirePro(handleSave);}}
          className="btn-floating-action bg-[#36B37E] text-[#ffffff]">

          
                    <Save size={18} /> {editData ? 'ACTUALIZAR TARJETA' : 'GUARDAR TARJETA'}
                </button>
            </div>
        </div>);

}