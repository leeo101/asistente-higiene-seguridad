import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Save, Play, Square, Building2, Flame, Users, 
  Clock, Share2, Printer, Siren, RotateCcw
} from 'lucide-react';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';
import ShareModal from '../components/ShareModal';
import DrillPdfGenerator from '../components/DrillPdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import SignatureCanvas from '../components/SignatureCanvas';
import AnimatedPage from '../components/AnimatedPage';

export default function DrillsForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const location = useLocation();
  const editData = location.state?.editData;

  useDocumentTitle(editData ? 'Editar Simulacro' : 'Registro de Simulacro');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncCollection } = useSync();

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [timeInSeconds, setTimeInSeconds] = useState(editData?.tiempoTotalSegundos || 0);
  const timerRef = useRef<any>(null);

  // Form state
  const [formData, setFormData] = useState(editData || {
    empresa: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hipotesis: 'Incendio',
    origen: '',
    manualMinutes: '',
    manualSeconds: '',
    evacuados: '',
    heridosSimulados: '0',
    puntosEncuentro: '',
    viasEscape: '',
    alarmaSonó: 'Sí',
    rolCumplido: 'Sí',
    observaciones: '',
    signature: '',
    operatorSignature: '',
    supervisorSignature: '',
    professionalSignature: '',
    showSignatures: { operator: true, professional: true, supervisor: true }
  });

  const [professional, setProfessional] = useState<any>({
    name: '',
    license: '',
    signature: null,
    stamp: null
  });

  const setShowSignatures = (updater: any) => {
    setFormData((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = formData.showSignatures || { operator: true, professional: true, supervisor: true };
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (editData) {
      setFormData({
        ...editData,
        operatorSignature: editData.operatorSignature || '',
        professionalSignature: editData.professionalSignature || '',
        supervisorSignature: editData.supervisorSignature || editData.signature || '',
        signature: editData.signature || editData.supervisorSignature || '',
        showSignatures: editData.showSignatures || { operator: true, professional: true, supervisor: true }
      });
    }
  }, [editData]);

  useEffect(() => {
    const savedData = localStorage.getItem('personalData');
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');

    let signature = legacySignature || null;
    let stamp = null;
    if (savedSigData) {
      try {
        const parsed = JSON.parse(savedSigData);
        signature = parsed.signature || signature;
        stamp = parsed.stamp || null;
      } catch (e) {}
    }

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setProfessional({
          name: data.name || '',
          license: data.license || '',
          signature: signature,
          stamp: stamp
        });
      } catch (e) {}
    } else {
      setProfessional((prev: any) => ({ ...prev, signature, stamp }));
    }
  }, []);

  // Timer interval effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeInSeconds((prev: number) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Timer controls
  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeInSeconds(0);
    setFormData((p: any) => ({ ...p, manualMinutes: '', manualSeconds: '' }));
  };

  // Auto-update manual fields based on timer
  useEffect(() => {
    if (timeInSeconds > 0) {
      const m = Math.floor(timeInSeconds / 60);
      const s = timeInSeconds % 60;
      setFormData((p: any) => ({
        ...p,
        manualMinutes: m.toString(),
        manualSeconds: s.toString()
      }));
    }
  }, [timeInSeconds]);

  const handleInput = (field: string, value: any) => {
    setFormData((p: any) => ({ ...p, [field]: value }));
  };

  const doSave = () => {
    if (!formData.empresa || !formData.origen) {
      toast.error('Complete la empresa y el origen del siniestro.');
      return;
    }

    const mins = parseInt(formData.manualMinutes || 0);
    const secs = parseInt(formData.manualSeconds || 0);

    if (mins === 0 && secs === 0) {
      toast.error('Debe registrar un tiempo de evacuación válido.');
      return;
    }

    const report = {
      id: editData?.id || Date.now().toString(),
      date: editData?.date || new Date().toISOString(),
      evaluador: editData?.evaluador || currentUser?.displayName || 'Profesional HSE',
      tiempoVisual: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
      tiempoTotalSegundos: mins * 60 + secs,
      ...formData,
      professionalSignature: formData.professionalSignature || professional.signature,
      professionalName: formData.professionalName || professional.name,
      professionalLicense: formData.professionalLicense || professional.license,
      professionalStamp: formData.professionalStamp || professional.stamp
    };

    let history = JSON.parse(localStorage.getItem('drills_history') || '[]');

    if (editData) {
      history = history.map((item: any) => item.id === editData.id ? report : item);
    } else {
      history.unshift(report);
    }

    localStorage.setItem('drills_history', JSON.stringify(history));
    syncCollection('drills_history', history);

    toast.success(editData ? 'Simulacro actualizado correctamente.' : 'Simulacro registrado con éxito.');
    navigate('/drills');
  };

  const handleSave = () => doSave();
  const handlePrint = () => requirePro(() => {
    const el = document.getElementById('pdf-content');
    if (el) {
      document.body.classList.add('printing-isolated');
      el.classList.add('isolated-print-target');
    }
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-isolated');
      if (el) el.classList.remove('isolated-print-target');
    }, 1000);
  });

  const formatDisplayTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatedPage>
      <ModuleFormLayout>
        <div className="no-print">
          <ShareModal
            isOpen={showShareModal}
            open={showShareModal}
            onClose={() => setShowShareModal(false)}
            title="Compartir Acta de Simulacro"
            text={`🔔 Acta de Simulacro de Evacuación\n🏢 Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏱️ Tiempo: ${formData.manualMinutes}:${formData.manualSeconds}\n\nEnviado desde Asistente HYS`}
            rawMessage={`🔔 Acta de Simulacro de Evacuación\n🏢 Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏱️ Tiempo: ${formData.manualMinutes}:${formData.manualSeconds}\n\nEnviado desde Asistente HYS`}
            elementIdToPrint="pdf-content"
            fileName={`Simulacro_${formData.empresa || 'Registro'}.pdf`} 
          />

          <div className="no-print pt-4 mb-6">
            <ModuleFormToolbar
              title={editData ? 'Editar Acta de Simulacro' : 'Registro de Simulacro'}
              subtitle="Gestión y Evaluación de Prácticas de Evacuación"
              icon={<Siren size={32} color="#ffffff" />}
              onBack={() => navigate('/drills')}
            />
          </div>

          {/* Cronómetro Flotante / Evaluador */}
          <div className={`card shadow-lg rounded-3xl overflow-hidden mb-8 p-6 flex flex-col items-center border transition-all duration-300 ${isRunning ? 'bg-red-50 dark:bg-red-950/20 border-red-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
            <div style={{ color: isRunning ? '#ef4444' : 'var(--color-text-muted)' }} className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
              <Clock size={16} /> Cronómetro de Evacuación en Tiempo Real
            </div>
            <div className={`font-mono font-black text-6xl md:text-7xl leading-none my-4 ${isRunning ? 'text-red-600 animate-pulse' : 'text-slate-800 dark:text-slate-100'}`}>
              {formatDisplayTime(timeInSeconds)}
            </div>

            <div className="flex gap-4">
              {isRunning ? (
                <button 
                  type="button"
                  onClick={toggleTimer} 
                  style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                  className="px-6 py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-lg border-none cursor-pointer hover:bg-red-700 transition-all">
                  <Square size={18} fill="currentColor" /> Detener Evacuación
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={toggleTimer} 
                  style={{ backgroundColor: '#059669', color: '#ffffff' }}
                  className="px-6 py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-lg border-none cursor-pointer hover:bg-emerald-700 transition-all">
                  <Play size={18} fill="currentColor" /> {timeInSeconds === 0 ? 'Dar Alarma (Iniciar)' : 'Reanudar'}
                </button>
              )}
              <button 
                type="button"
                onClick={resetTimer} 
                disabled={isRunning || timeInSeconds === 0} 
                style={{ opacity: isRunning || timeInSeconds === 0 ? 0.4 : 1 }} 
                className="p-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 cursor-pointer transition-all">
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <ModuleFormSection title="Datos del Establecimiento" icon={<Building2 />}>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">Empresa / Instalación</label>
                  <input 
                    type="text" 
                    value={formData.empresa} 
                    onChange={(e) => handleInput('empresa', e.target.value)} 
                    placeholder="Ej. Planta Logística Sur" 
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900 dark:text-slate-100" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">Fecha</label>
                    <input 
                      type="date" 
                      value={formData.fecha} 
                      onChange={(e) => handleInput('fecha', e.target.value)} 
                      className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">Hora Evacuación</label>
                    <input 
                      type="time" 
                      value={formData.hora} 
                      onChange={(e) => handleInput('hora', e.target.value)} 
                      className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none" 
                    />
                  </div>
                </div>
              </div>
            </ModuleFormSection>

            <ModuleFormSection title="Hipótesis de Emergencia" icon={<Flame />}>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">Tipo de Emergencia</label>
                  <select 
                    value={formData.hipotesis} 
                    onChange={(e) => handleInput('hipotesis', e.target.value)} 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none font-bold">
                    <option value="Incendio">Incendio Estructural</option>
                    <option value="Sismo">Sismo / Terremoto</option>
                    <option value="Derrame Químico">Derrame Químico</option>
                    <option value="Amenaza de Bomba">Amenaza de Bomba</option>
                    <option value="Fuga de Gas">Fuga de Gas</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">Sector de Origen (Foco)</label>
                  <input 
                    type="text" 
                    value={formData.origen} 
                    onChange={(e) => handleInput('origen', e.target.value)} 
                    placeholder="Ej. Archivo, Tablero Ppal." 
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none" 
                  />
                </div>
              </div>
            </ModuleFormSection>
          </div>

          <ModuleFormSection title="Evaluación de la Evacuación" icon={<Users />}>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 mb-6">
              <label className="text-amber-800 dark:text-amber-300 font-extrabold mb-2 block text-sm">Tiempo Final a Registrar (Minutos : Segundos)</label>
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <input 
                    type="number" 
                    min="0" 
                    value={formData.manualMinutes} 
                    onChange={(e) => handleInput('manualMinutes', e.target.value)} 
                    placeholder="Minutos" 
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white" 
                  />
                </div>
                <span className="text-2xl font-black text-slate-700 dark:text-slate-300">:</span>
                <div className="flex-1 relative">
                  <input 
                    type="number" 
                    min="0" 
                    max="59" 
                    value={formData.manualSeconds} 
                    onChange={(e) => handleInput('manualSeconds', e.target.value)} 
                    placeholder="Segundos" 
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">Población Evacuada</label>
                <input 
                  type="number" 
                  value={formData.evacuados} 
                  onChange={(e) => handleInput('evacuados', e.target.value)} 
                  placeholder="Cantidad aprox." 
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none" 
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">Heridos / Rescatados Simulados</label>
                <input 
                  type="number" 
                  value={formData.heridosSimulados} 
                  onChange={(e) => handleInput('heridosSimulados', e.target.value)} 
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block mb-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">Punto(s) de Encuentro Utilizados</label>
                <textarea 
                  value={formData.puntosEncuentro} 
                  onChange={(e) => handleInput('puntosEncuentro', e.target.value)} 
                  rows={2} 
                  placeholder="Ej. PE1 - Estacionamiento Frontal" 
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">Observaciones / Conclusiones del Auditor</label>
                <textarea 
                  value={formData.observaciones} 
                  onChange={(e) => handleInput('observaciones', e.target.value)} 
                  rows={3} 
                  placeholder="Ej. Se detectó puerta de emergencia trabada en sector Archivo..." 
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Panel de Firmas */}
            <div className="no-print mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6">
              {showSignatures.operator && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <SignatureCanvas
                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                    initialImage={formData.operatorSignature}
                    title="Firma del Responsable" 
                  />
                </div>
              )}

              {showSignatures.professional && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <SignatureCanvas
                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                    initialImage={formData.professionalSignature || professional.signature}
                    title="Firma de Especialista H&S" 
                  />
                </div>
              )}

              {showSignatures.supervisor && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <SignatureCanvas
                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                    initialImage={formData.supervisorSignature || formData.signature}
                    title="Firma Supervisor Cierre" 
                  />
                </div>
              )}
            </div>
          </ModuleFormSection>
        </div>

        <ModuleActionBar
          actions={[
            { id: 'save', label: 'GUARDAR SIMULACRO', icon: <Save size={18} />, variant: 'primary', onClick: () => requirePro(handleSave) },
            { id: 'share', label: 'COMPARTIR', icon: <Share2 size={18} />, variant: 'secondary', onClick: () => requirePro(() => setShowShareModal(true)) },
            { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer size={18} />, variant: 'secondary', onClick: handlePrint }
          ]}
        />

        <AdBanner />

        {/* Informes Ocultos para Impresión */}
        <div className="print-only">
          <DrillPdfGenerator
            report={{
              id: Date.now(),
              date: new Date().toISOString(),
              evaluador: currentUser?.displayName || 'Profesional HSE',
              tiempoVisual: `${parseInt(formData.manualMinutes || 0).toString().padStart(2, '0')}:${parseInt(formData.manualSeconds || 0).toString().padStart(2, '0')}`,
              tiempoTotalSegundos: parseInt(formData.manualMinutes || 0) * 60 + parseInt(formData.manualSeconds || 0),
              ...formData,
              professionalSignature: formData.professionalSignature || professional.signature,
              professionalName: formData.professionalName || professional.name,
              professionalLicense: formData.professionalLicense || professional.license,
              professionalStamp: formData.professionalStamp || professional.stamp
            }}
            onBack={() => {}} 
          />
        </div>
      </ModuleFormLayout>
    </AnimatedPage>
  );
}