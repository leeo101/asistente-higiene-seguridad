import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ArrowLeft, Save, Play, Square, TimerReset,
  Building2, Flame, Users, FileText, CheckCircle2,
  Clock, Search, Share2, Printer, Plus, Pencil, Siren } from 'lucide-react';
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
import PdfSignatures from '../components/PdfSignatures';
import PdfBrandingFooter from '../components/PdfBrandingFooter';

export default function Drills(): React.ReactElement | null {
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
  const timerRef = useRef(null);

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
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'report'

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
      const parsed = JSON.parse(savedSigData);
      signature = parsed.signature || signature;
      stamp = parsed.stamp || null;
    }

    if (savedData) {
      const data = JSON.parse(savedData);
      setProfessional({
        name: data.name || '',
        license: data.license || '',
        signature: signature,
        stamp: stamp
      });
    } else {
      setProfessional((prev: any) => ({ ...prev, signature, stamp }));
    }
  }, []);



  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeInSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isRunning && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Timer controls
  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeInSeconds(0);
    setFormData((p) => ({ ...p, manualMinutes: '', manualSeconds: '' }));
  };

  // Auto-update manual fields based on timer
  useEffect(() => {
    if (timeInSeconds > 0) {
      const m = Math.floor(timeInSeconds / 60);
      const s = timeInSeconds % 60;
      setFormData((p) => ({
        ...p,
        manualMinutes: m.toString(),
        manualSeconds: s.toString()
      }));
    }
  }, [timeInSeconds]);

  const handleInput = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
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
      id: editData?.id || Date.now(),
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
      history = history.map((item) => item.id === editData.id ? report : item);
    } else {
      history.unshift(report);
    }

    localStorage.setItem('drills_history', JSON.stringify(history));
    syncCollection('drills_history', history);

    toast.success(editData ? 'Simulacro actualizado correctamente.' : 'Simulacro registrado con éxito.');
    navigate('/drills');
  };

  const handleSave = () => doSave();
  const handlePrint = () => requirePro(() => window.print());

  const formatDisplayTime = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
      <ModuleFormLayout>
            <div className="no-print">
                <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title="Compartir Acta de Simulacro"
          text={`🔔 Acta de Simulacro de Evacuación\n🏢 Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏱️ Tiempo: ${formData.manualMinutes}:${formData.manualSeconds}\n\nEnviado desde Asistente HYS`}
          rawMessage={`🔔 Acta de Simulacro de Evacuación\n🏢 Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏱️ Tiempo: ${formData.manualMinutes}:${formData.manualSeconds}\n\nEnviado desde Asistente HYS`}
          elementIdToPrint="pdf-content"
          fileName={`Simulacro_${formData.empresa || 'Registro'}.pdf`} />
        
                <div className="no-print mb-8">
                    <ModuleFormToolbar
            title={editData ? 'Editar Acta de Simulacro' : 'Registro de Simulacro'}
            subtitle="Gestión de Simulacros y Evacuación"
            icon={<Siren />} />
          
                    <div className="flex justify-between items-center flex-wrap gap-4 mt-4">
                        <></>
                    </div>
                </div>

                {/* Cronómetro Flotante */}
                <div className={`card shadow-md rounded-3xl overflow-hidden mb-8 p-6 flex flex-col items-center rounded-3xl transition-all duration-300 ${isRunning ? 'bg-red-50 dark:bg-red-900/10 border-2 border-red-500' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                    <div style={{ color: isRunning ? '#ef4444' : 'var(--color-text-muted)' }} className="text-[0.9rem] font-[800] uppercase letter-spacing-[2px] flex items-center gap-[0.5rem]">
                        <Clock size={16} /> Cronómetro Evacuación
                    </div>
                    <div className={`font-mono font-black text-7xl leading-none my-4 ${isRunning ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
                        {formatDisplayTime(timeInSeconds)}
                    </div>

                    <div className="flex gap-[1rem]">
                        {isRunning ?
            <button onClick={toggleTimer} className="bg-[#ef4444] text-[white] border-none p-[0.8rem_2rem] rounded-[12px] text-[1rem] font-[800] cursor-pointer flex items-center gap-[0.5rem] box-shadow-[0_10px_15px_-3px_rgba(239,_68,_68,_0.4)]">
                                <Square size={18} fill="currentColor" /> Detener Evacuación
                            </button> :

            <button onClick={toggleTimer} className="bg-[#10b981] text-[white] border-none p-[0.8rem_2rem] rounded-[12px] text-[1rem] font-[800] cursor-pointer flex items-center gap-[0.5rem] box-shadow-[0_10px_15px_-3px_rgba(16,_185,_129,_0.4)]">
                                <Play size={18} fill="currentColor" /> {timeInSeconds === 0 ? 'Dar Alarma (Iniciar)' : 'Reanudar'}
                            </button>
            }
                        <button onClick={resetTimer} disabled={isRunning || timeInSeconds === 0} style={{ opacity: isRunning || timeInSeconds === 0 ? 0.5 : 1 }} className="p-[0.8rem] bg-[transparent] border-[1px_solid_var(--color-border)] rounded-[12px] text-[var(--color-text-muted)] cursor-pointer">
                            <TimerReset size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid-2-cols gap-[1.5rem]">
                    <ModuleFormSection title="Datos del Establecimiento" icon={<Building2 />}>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Empresa / Institución</label>
                                <input type="text" value={formData.empresa} onChange={(e) => handleInput('empresa', e.target.value)} placeholder="Ej. Planta Logistic Sur" className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100" />
                            </div>
                            <div className="grid-2-cols gap-[1rem]">
                                <div>
                                    <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Fecha</label>
                                    <input type="date" value={formData.fecha} onChange={(e) => handleInput('fecha', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Hora Evacuación</label>
                                    <input type="time" value={formData.hora} onChange={(e) => handleInput('hora', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </ModuleFormSection>

                    <ModuleFormSection title="Hipótesis de Emergencia" icon={<Flame />}>
                        <div className="grid-2-cols gap-[1rem]">
                            <div>
                                <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Tipo de Emergencia</label>
                                <select value={formData.hipotesis} onChange={(e) => handleInput('hipotesis', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="Incendio">Incendio Estructural</option>
                                    <option value="Sismo">Sismo / Terremoto</option>
                                    <option value="Derrame Químico">Derrame Químico</option>
                                    <option value="Amenaza de Bomba">Amenaza de Bomba</option>
                                    <option value="Fuga de Gas">Fuga de Gas</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Sector de Origen (Foco)</label>
                                <input type="text" value={formData.origen} onChange={(e) => handleInput('origen', e.target.value)} placeholder="Ej. Archivo, Tablero Ppal." />
                            </div>
                        </div>
                    </ModuleFormSection>
                </div>

                    <ModuleFormSection title="Evaluación de la Evacuación" icon={<Users />}>

                        <div className="bg-[var(--color-background)] p-[1rem] rounded-[12px] border-[1px_solid_var(--color-border)] mb-[1rem]">
                            <label className="text-[var(--color-primary)] font-[800] mb-[0.5rem] block">Tiempo Final a Registrar</label>
                            <div className="flex gap-4 items-center">
                                <div className="flex-[1] relative">
                                    <input type="number" min="0" value={formData.manualMinutes} onChange={(e) => handleInput('manualMinutes', e.target.value)} placeholder="Minutos" className="pr-[2rem]" />
                                    <span className="absolute right-[1rem] top-[50%] transform-[translateY(-50%)] text-[var(--color-text-muted)] text-[0.8rem]">m</span>
                                </div>
                                <span className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 dark:text-slate-100">:</span>
                                <div className="flex-[1] relative">
                                    <input type="number" min="0" max="59" value={formData.manualSeconds} onChange={(e) => handleInput('manualSeconds', e.target.value)} placeholder="Segundos" className="pr-[2rem]" />
                                    <span className="absolute right-[1rem] top-[50%] transform-[translateY(-50%)] text-[var(--color-text-muted)] text-[0.8rem]">s</span>
                                </div>
                            </div>
                            <div className="text-[0.75rem] text-[var(--color-text-muted)] mt-[0.5rem]">* Sincronizado con cronómetro superior, pero editable manualmente.</div>
                        </div>

                        <div className="grid-2-cols gap-[1rem] mb-[1rem]">
                            <div>
                                <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Población Evacuada</label>
                                <input type="number" value={formData.evacuados} onChange={(e) => handleInput('evacuados', e.target.value)} placeholder="Cant. aprox" />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Heridos / Rescatados</label>
                                <input type="number" value={formData.heridosSimulados} onChange={(e) => handleInput('heridosSimulados', e.target.value)} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-[1rem] mb-[1rem]">
                            <div>
                                <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Punto(s) de Encuentro Utilizados</label>
                                <textarea value={formData.puntosEncuentro} onChange={(e) => handleInput('puntosEncuentro', e.target.value)} rows={2} placeholder="Ej. PE1 - Estacionamiento Frontal"></textarea>
                            </div>

                            <div className="grid-2-cols gap-[1rem]">
                                <div>
                                    <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">¿La alarma fue audible?</label>
                                    <select value={formData.alarmaSonó} onChange={(e) => handleInput('alarmaSonó', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="Sí">Sí, en todos los sectores</option>
                                        <option value="Regular">Parcial / Bajo Volumen</option>
                                        <option value="No">Falla del sistema (No sonó)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">¿Rol de emergencias activo?</label>
                                    <select value={formData.rolCumplido} onChange={(e) => handleInput('rolCumplido', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="Sí">Sí, se guiaron a salidas</option>
                                        <option value="Con demoras">Brigadistas con fallas de rol</option>
                                        <option value="No">Falta de liderazgo/pánico</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Oportunidades de Mejora / Observaciones Críticas</label>
                                <textarea value={formData.observaciones} onChange={(e) => handleInput('observaciones', e.target.value)} rows={3} placeholder="Ej. Se detectó puerta de emergencia trabada en sector Archivo..."></textarea>
                            </div>
                    </div>
                </ModuleFormSection>

                {/* Firmas y Autorizaciones */}
                <ModuleFormSection title="Firmas y Autorizaciones de Simulacro" icon={<Pencil />}>
                    <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                        <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div className="flex gap-[1rem] flex-wrap justify-center">
                            {[
              { id: 'operator', label: 'Responsable Evacuación' },
              { id: 'professional', label: 'Especialista Higiene y Seguridad' },
              { id: 'supervisor', label: 'Supervisor / Cierre' }].
              map((sig) => {
                const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                return (
                  <label
                    key={sig.id}
                    className="flex items-center gap-2 cursor-pointer select-none p-[0.55rem_1.1rem] rounded-[var(--radius-full)] font-[750] text-[0.8rem] transition-[all_0.2s_ease]"
                    style={{
                      border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                      color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',
                      boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                    }}>
                    
                                        <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} className="none" />

                    
                                        <div style={{
                      border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                      background: isChecked ? 'var(--color-primary)' : 'transparent'
                    }} className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-[all_0.2s_ease]">
                                            {isChecked && <CheckCircle2 size={12} color="white" />}
                                        </div>
                                        {sig.label}
                                    </label>);

              })}
                        </div>
                    </div>

                    {/* On-Sheet Visual Preview of PDF signature blocks */}
                    <div className="mb-[2.5rem]">
                        <PdfSignatures
              data={{
                ...formData,
                professionalSignature: professional.signature,
                professionalName: professional.name,
                professionalLicense: professional.license,
                professionalStamp: professional.stamp
              }}
              box1={showSignatures.operator ? {
                title: 'RESPONSABLE EVACUACIÓN',
                subtitle: 'Brigada / Responsable',
                signatureUrl: formData.operatorSignature || null,
                isProfessional: false
              } : null}
              box2={showSignatures.professional ? {
                title: 'PROFESIONAL H&S',
                subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                signatureUrl: formData.professionalSignature || professional.signature || null,
                stampUrl: formData.professionalStamp || professional.stamp || null,
                isProfessional: true,
                license: professional.license
              } : null}
              box3={showSignatures.supervisor ? {
                title: 'SUPERVISIÓN / CIERRE',
                subtitle: 'Aprobación de Simulacro',
                signatureUrl: formData.supervisorSignature || formData.signature || null,
                isProfessional: false
              } : null} />
            
            <PdfBrandingFooter />
                    </div>

                    {/* Interactive Signature Drawing Pads */}
                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {showSignatures.operator &&
            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                initialImage={formData.operatorSignature}
                title="Firma del Responsable de Evacuación" />
              
                            </div>
            }
                        
                        {showSignatures.professional &&
            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                initialImage={formData.professionalSignature || professional.signature}
                title="Firma de Especialista H&S" />
              
                            </div>
            }

                        {showSignatures.supervisor &&
            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                initialImage={formData.supervisorSignature || formData.signature}
                title="Firma del Supervisor de Cierre" />
              
                            </div>
            }
                    </div>
                </ModuleFormSection>
            </div>

            <ModuleActionBar
              actions={[
                { id: 'save', label: 'GUARDAR', icon: <Save />, variant: 'primary', onClick: () => requirePro(handleSave) },
                { id: 'share', label: 'COMPARTIR', icon: <Share2 />, variant: 'secondary', onClick: () => requirePro(() => setShowShareModal(true)) },
                { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer />, variant: 'secondary', onClick: handlePrint }
              ]}
            />

            {/* PRO upgrade banner for free users */}
            <AdBanner />

            {/* Hidden report for direct printing */}
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
          onBack={() => {}} />
        
            </div>
        </ModuleFormLayout>);

}