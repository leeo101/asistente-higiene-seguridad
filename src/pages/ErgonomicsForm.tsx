import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ChevronRight, ChevronLeft, ArrowLeft,
  Save, Accessibility, AlertCircle, Info, Building2, Sparkles, Loader2, Printer, Share2, CheckCircle2, Circle } from
'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import Breadcrumbs from '../components/Breadcrumbs';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';
import { getErrorMessage } from '../utils/errorUtils';
import ErgonomicsPdfGenerator from '../components/ErgonomicsPdfGenerator';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';

export default function ErgonomicsForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const location = useLocation();
  const editData = location.state?.editData;
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<any>(null);
  const [signature, setSignature] = useState<any>(null);
  const [showSignatures, setShowSignatures] = useState({ operator: true, supervisor: true, professional: true });

  useEffect(() => {
    window.scrollTo(0, 0);
    const savedProfile = localStorage.getItem('personalData');
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const sig = localStorage.getItem('signatureStampData');
    if (sig) setSignature(JSON.parse(sig));
  }, []);
  const [formData, setFormData] = useState(editData || {
    empresa: '',
    cuit: '',
    sector: '',
    puesto: '',
    descripcionTarea: '',
    planilla1: {
      levantamientoCarga: false,
      transporteCargas: false,
      empujeArrastre: false,
      bipedestacion: false,
      movimientosRepetitivos: false,
      posturasForzadas: false,
      vibracionesManoBrazo: false,
      vibracionesCuerpoEntero: false,
      estresContacto: false,
      estresTermico: false,
    },
    calculoLevantamiento: {
      peso: 0,
      agarre: 'Bueno',
      distanciaH: 25,
      distanciaV: 75,
      frecuencia: 0.2,
      duracion: 1,
      torsion: 0
    },
    recomendaciones: '',
    operatorSignature: '',
    supervisorSignature: ''
  });

  const categories = [
    { id: 'levantamientoCarga', label: 'Levantamiento / Descenso' },
    { id: 'transporteCargas', label: 'Transporte manual de cargas' },
    { id: 'empujeArrastre', label: 'Empuje o arrastre de cargas' },
    { id: 'bipedestacion', label: 'Bipedestación estática' },
    { id: 'movimientosRepetitivos', label: 'Movimientos repetitivos' },
    { id: 'posturasForzadas', label: 'Posturas forzadas' },
    { id: 'vibracionesManoBrazo', label: 'Vibraciones mano-brazo' },
    { id: 'vibracionesCuerpoEntero', label: 'Vibraciones cuerpo entero' },
    { id: 'estresContacto', label: 'Estrés de contacto' },
    { id: 'estresTermico', label: 'Estrés térmico (Frío/Calor)' }
  ];


  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handlePrint = () => {
    requirePro(() => {
      const element = document.getElementById('pdf-content');
      if (!element) {
        toast.error('No se pudo generar el documento para imprimir.');
        return;
      }
      document.body.classList.add('printing-isolated');
      element.classList.add('isolated-print-target');

      const cleanup = () => {
        document.body.classList.remove('printing-isolated');
        element.classList.remove('isolated-print-target');
        window.removeEventListener('afterprint', cleanup);
        window.removeEventListener('focus', cleanup);
      };

      window.addEventListener('afterprint', cleanup);
      window.addEventListener('focus', cleanup);
      setTimeout(cleanup, 1500);
      window.print();
    });
  };

  const handleSave = () => {
    const id = editData?.id || Date.now().toString();
    let history = JSON.parse(localStorage.getItem('ergonomics_history') || '[]');

    // Simulación de riesgo basado en Planilla 1
    let riesgo = 'Tolerable';
    const activeFactors = Object.values(formData.planilla1).filter((v) => v === true).length;
    if (activeFactors > 2 || formData.planilla1.levantamientoCarga && formData.calculoLevantamiento.peso > 25) {
      riesgo = 'Moderado';
    }

    const report = { ...formData, id, riesgo };

    if (editData) {
      history = history.map((item) => item.id === editData.id ? report : item);
    } else {
      history.unshift(report);
    }

    localStorage.setItem('ergonomics_history', JSON.stringify(history));
    syncCollection('ergonomics_history', history);

    toast.success(editData ? 'Estudio actualizado correctamente.' : 'Estudio registrado con éxito.');
    navigate('/ergonomics');
  };

  const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);

  const handleGenerateConclusion = async () => {
    setIsGeneratingConclusion(true);
    const loadingToast = toast.loading('Redactando recomendaciones técnicas...');
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai-report-conclusion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
        },
        body: JSON.stringify({
          reportType: 'Estudio de Ergonomía Res 886/15',
          reportData: {
            empresa: formData.empresa,
            sector: formData.sector,
            puesto: formData.puesto,
            descripcionTarea: formData.descripcionTarea,
            factoresRiesgo: formData.planilla1,
            datosLevantamientoCarga: formData.calculoLevantamiento
          }
        })
      });
      if (!res.ok) throw new Error('Error al conectar con la IA');
      const data = await res.json();
      setFormData((prev) => ({ ...prev, recomendaciones: data.conclusion }));
      toast.success('Recomendaciones generadas con éxito ✨', { id: loadingToast });
    } catch (error) {
      toast.error(`Error al generar: ${getErrorMessage(error)}`, { id: loadingToast });
    } finally {
      setIsGeneratingConclusion(false);
    }
  };

  return (
    <ModuleFormLayout>
        <div className="ats-pdf-offscreen" aria-hidden="true">
            <ErgonomicsPdfGenerator 
                data={{
                    ...formData,
                    riesgo: Object.values(formData.planilla1).filter((v) => v === true).length > 2 || (formData.planilla1.levantamientoCarga && formData.calculoLevantamiento.peso > 25) ? 'Moderado' : 'Tolerable'
                }} 
                profile={profile} 
                signature={signature} 
                showSignatures={showSignatures} 
            />
        </div>
        <div className="pt-24 no-print"></div>
        <ModuleFormToolbar
            title={editData ? 'Editar Estudio Ergonómico' : 'Nuevo Estudio Ergonómico'}
            subtitle="Protocolo Res. SRT 886/15"
            icon={<Accessibility size={36} color="#ffffff" />}
        />

            <div className="my-6 z-10 no-print">
                <></>
            </div>

        <ModuleFormDocument>
            {/* Stepper Header */}
            <div className="flex justify-between mb-8 relative">
                <div className="absolute top-[15px] left-0 w-full h-[2px] bg-slate-200 dark:bg-slate-700 z-0"></div>
                {[1, 2, 3].map((s) =>
        <div key={s} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm z-10 transition-colors ${step >= s ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500"}`}>
                        {s}
                    </div>
        )}
            </div>

            {step === 1 &&
      <ModuleFormSection title="Datos Generales" icon={<Building2 />}>

                    <div className="mb-6">
                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Empresa / Establecimiento</label>
                        <input
            className="module-form-input"
            value={formData.empresa}
            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
            placeholder="Nombre de la empresa" />
          
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Sector</label>
                            <input
              className="module-form-input"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              placeholder="Logística, Planta, etc." />
            
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Puesto de Trabajo</label>
                            <input
              className="module-form-input"
              value={formData.puesto}
              onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
              placeholder="Operario, Administrativo..." />
            
                        </div>
                    </div>

                    <div className="mb-[2.5rem]">
                        <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Descripción de la Tarea</label>
                        <textarea
            className="module-form-input"
            rows={3}
            value={formData.descripcionTarea}
            onChange={(e) => setFormData({ ...formData, descripcionTarea: e.target.value })}
            placeholder="Describa brevemente las acciones realizadas..." />
          
                    </div>

                    <div className="flex justify-center w-full">
                        <button onClick={handleNext} 
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                            className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-extrabold shadow-lg hover:opacity-90 transition-all hover:-translate-y-0.5 cursor-pointer">
                            Siguiente <ChevronRight size={18} />
                        </button>
                    </div>
      </ModuleFormSection>
      }

            {step === 2 &&
      <ModuleFormSection title="Planilla 1: Identificación" icon={<AlertCircle />}>
                    <p className="text-[0.95rem] text-[var(--color-text-muted)] mb-[2rem] font-[600]">
                        Indique la presencia de factores de riesgo en el puesto:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
                        {categories.map((cat) =>
          <div
            key={cat.id}
            onClick={() => setFormData({
              ...formData,
              planilla1: { ...formData.planilla1, [cat.id as keyof typeof formData.planilla1]: !formData.planilla1[cat.id as keyof typeof formData.planilla1] }
            })}
            className="transition-all duration-300 flex flex-col justify-center items-center gap-2 p-3 rounded-[16px] cursor-pointer text-center"
            style={{
              background: formData.planilla1[cat.id as keyof typeof formData.planilla1] ? 'linear-gradient(to bottom right, rgba(16,185,129,0.1), rgba(16,185,129,0.02))' : 'var(--color-surface)',
              border: `1px solid ${formData.planilla1[cat.id as keyof typeof formData.planilla1] ? '#10b981' : 'var(--color-border)'}`,
              boxShadow: formData.planilla1[cat.id as keyof typeof formData.planilla1] ? '0 8px 20px -4px rgba(16,185,129,0.2)' : '0 2px 10px -2px rgba(0,0,0,0.05)',
              transform: formData.planilla1[cat.id as keyof typeof formData.planilla1] ? 'translateY(-2px)' : 'none'
            }}>
                {formData.planilla1[cat.id as keyof typeof formData.planilla1] ? 
                    <CheckCircle2 size={24} color="#10b981" /> : 
                    <Circle size={24} color="var(--color-text-muted)" opacity={0.3} />
                }
                <span style={{ color: formData.planilla1[cat.id as keyof typeof formData.planilla1] ? 'var(--color-text)' : 'var(--color-text-muted)' }} className="text-xs font-bold leading-tight">{cat.label}</span>
          </div>
          )}
                    </div>

                    <div className="flex gap-4 flex-wrap justify-center w-full mt-6">
                        <button onClick={handleBack} 
                            style={{ background: 'linear-gradient(135deg, #64748b, #475569)', color: 'white', border: 'none' }}
                            className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg hover:opacity-90 transition-all hover:-translate-y-0.5 cursor-pointer">
                            <ChevronLeft size={18} /> Atrás
                        </button>
                        <button onClick={handleNext} 
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                            className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg hover:opacity-90 transition-all hover:-translate-y-0.5 cursor-pointer">
                            Siguiente <ChevronRight size={18} />
                        </button>
                    </div>
      </ModuleFormSection>
      }

            {step === 3 &&
      <ModuleFormSection title="Planilla 2.A: Evaluación" icon={<Accessibility />}>
                    {formData.planilla1.levantamientoCarga ?
        <div className="bg-[rgba(59,_130,_246,_0.05)] border-[1px_solid_rgba(59,_130,_246,_0.15)] p-[1.8rem] rounded-[16px] mb-[2.5rem]">
                            <h4 className="m-[0_0_1.5rem_0] text-[1.1rem] font-[800] text-[var(--color-text)]">Levantamiento de Cargas</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Peso Efectivo (kg)</label>
                                    <input
                className="module-form-input"
                type="number"
                value={formData.calculoLevantamiento.peso}
                onChange={(e) => setFormData({
                  ...formData,
                  calculoLevantamiento: { ...formData.calculoLevantamiento, peso: Number(e.target.value) }
                })}
                placeholder="Ej: 15" />
              
                                    {formData.calculoLevantamiento.peso > 25 &&
              <p className="text-[#ef4444] text-[0.75rem] mt-[0.4rem] font-[800] flex items-center gap-[0.3rem]">
                                            <AlertCircle size={12} /> Excede el límite legal de 25 kg
                                        </p>
              }
                                </div>

                                <div>
                                    <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Distancia Horizontal (Cuerpo-Carga)</label>
                                    <select
                className="module-form-input"
                value={formData.calculoLevantamiento.distanciaH}
                onChange={(e) => setFormData({
                  ...formData,
                  calculoLevantamiento: { ...formData.calculoLevantamiento, distanciaH: e.target.value }
                })}>
                
                                        <option value="cerca">Cerca (menos de 25 cm)</option>
                                        <option value="media">Media (25 a 50 cm)</option>
                                        <option value="lejos">Lejos (más de 50 cm)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-[0.5rem]">
                                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Altura de Agarre</label>
                                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(120px,_1fr))] gap-[0.8rem]">
                                    {['Suelo', 'Rodilla', 'Cintura', 'Hombro'].map((h) =>
              <button
                key={h}
                onClick={() => setFormData({
                  ...formData,
                  calculoLevantamiento: { ...formData.calculoLevantamiento, altura: h.toLowerCase() }
                })}
                className="transition-all p-[0.8rem] text-[0.9rem] rounded-[12px] font-[800] cursor-pointer"
                style={{



                  border: `2px solid ${formData.calculoLevantamiento.altura === h.toLowerCase() ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: formData.calculoLevantamiento.altura === h.toLowerCase() ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: formData.calculoLevantamiento.altura === h.toLowerCase() ? 'white' : 'var(--color-text)'


                }}>
                
                                            {h}
                                        </button>
              )}
                                </div>
                            </div>
                        </div> :

        <div className="text-center p-[3rem] border-[2px_dashed_var(--color-border)] bg-[var(--color-background)] rounded-[16px] mb-[2.5rem]">
                            <Info size={40} color="var(--color-text-muted)" className="m-[0_auto_1rem] opacity-[0.5]" />
                            <h4 className="m-[0_0_0.5rem] text-[1.1rem] text-[var(--color-text)]">Evaluación no requerida</h4>
                            <p className="m-[0] text-[0.9rem] text-[var(--color-text-muted)]">
                                No se identificaron riesgos que requieran evaluación detallada.
                            </p>
                        </div>
        }

                    <div className="mb-[2.5rem]">
                        <div className="flex justify-space-between items-center mb-[0.8rem] flex-wrap gap-[1rem]">
                            <label className="m-[0] font-[700] text-[0.95rem] text-[var(--color-text)]">Recomendaciones de Acción</label>
                            <button
              className="no-print p-[0.6rem_1.2rem] bg-[linear-gradient(135deg,_#8B5CF6,_#EC4899)] text-[#ffffff] border-none rounded-[10px] font-[800] text-[0.8rem] flex items-center gap-[0.5rem] box-shadow-[0_4px_15px_rgba(236,72,153,0.3)]"
              onClick={handleGenerateConclusion}
              disabled={isGeneratingConclusion}
              style={{ cursor: isGeneratingConclusion ? 'wait' : 'pointer' }}>
              
                                {isGeneratingConclusion ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {isGeneratingConclusion ? 'REDACTANDO...' : 'REDACTAR CON IA'}
                            </button>
                        </div>
                        <textarea
            rows={4}
            className="module-form-input no-print"
            value={formData.recomendaciones}
            onInput={(e: any) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onChange={(e) => setFormData({ ...formData, recomendaciones: e.target.value })}
            placeholder="Proponga medidas correctivas o ingenieriles..." />
          
                        <div className="print-only whitespace-pre-wrap break-words mt-2 font-semibold">
                            {formData.recomendaciones || 'Sin recomendaciones especificadas.'}
                        </div>
                    </div>

                    <div className="mt-[2.5rem] mb-[2rem] no-print">
                        <div className="flex flex-col mb-[1rem]">
                            <label className="m-[0] font-[700] text-[0.95rem] text-[var(--color-text)]">Firmas y Autorizaciones</label>
                            <div className="text-[var(--color-text)] font-[800] text-[0.75rem] uppercase tracking-wider mt-2 mb-3">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                            <div className="flex flex-wrap gap-4 mb-4">
                                <label className="flex items-center gap-[0.5rem] p-[0.6rem_1rem] bg-[#f8fafc] border-[1px_solid_#e2e8f0] rounded-[8px] cursor-pointer transition-[all_0.2s_ease]">
                                    <input type="checkbox" className="hidden" checked={showSignatures.operator} onChange={(e) => setShowSignatures({...showSignatures, operator: e.target.checked})} />
                                    <div style={{ border: showSignatures.operator ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)', background: showSignatures.operator ? 'var(--color-primary)' : 'transparent' }} className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-[all_0.2s_ease]">
                                        {showSignatures.operator && <CheckCircle2 size={12} color="white" />}
                                    </div>
                                    <span className="text-[0.8rem] font-[700] text-[#1e293b]">Operador / Trabajador</span>
                                </label>
                                <label className="flex items-center gap-[0.5rem] p-[0.6rem_1rem] bg-[#f8fafc] border-[1px_solid_#e2e8f0] rounded-[8px] cursor-pointer transition-[all_0.2s_ease]">
                                    <input type="checkbox" className="hidden" checked={showSignatures.supervisor} onChange={(e) => setShowSignatures({...showSignatures, supervisor: e.target.checked})} />
                                    <div style={{ border: showSignatures.supervisor ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)', background: showSignatures.supervisor ? 'var(--color-primary)' : 'transparent' }} className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-[all_0.2s_ease]">
                                        {showSignatures.supervisor && <CheckCircle2 size={12} color="white" />}
                                    </div>
                                    <span className="text-[0.8rem] font-[700] text-[#1e293b]">Supervisor / Empleador</span>
                                </label>
                                <label className="flex items-center gap-[0.5rem] p-[0.6rem_1rem] bg-[#f8fafc] border-[1px_solid_#e2e8f0] rounded-[8px] cursor-pointer transition-[all_0.2s_ease]">
                                    <input type="checkbox" className="hidden" checked={showSignatures.professional} onChange={(e) => setShowSignatures({...showSignatures, professional: e.target.checked})} />
                                    <div style={{ border: showSignatures.professional ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)', background: showSignatures.professional ? 'var(--color-primary)' : 'transparent' }} className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-[all_0.2s_ease]">
                                        {showSignatures.professional && <CheckCircle2 size={12} color="white" />}
                                    </div>
                                    <span className="text-[0.8rem] font-[700] text-[#1e293b]">Profesional Actuante</span>
                                </label>
                            </div>
                        </div>

                        {/* On-Sheet Visual Preview of PDF signature blocks */}
                        <PdfSignatures
                            data={{
                                ...formData,
                                professionalSignature: signature?.signature,
                                professionalName: profile?.name,
                                professionalLicense: profile?.license
                            }}
                            box1={showSignatures.operator ? {
                                title: 'OPERADOR / TRABAJADOR',
                                subtitle: 'Toma de conocimiento',
                                signatureUrl: formData.operatorSignature || null,
                                isProfessional: false
                            } : null}
                            box2={showSignatures.supervisor ? {
                                title: 'SUPERVISOR / EMPLEADOR',
                                subtitle: 'Firma Autorizada',
                                signatureUrl: formData.supervisorSignature || null,
                                isProfessional: false
                            } : null}
                            box3={showSignatures.professional ? {
                                title: 'PROFESIONAL ACTUANTE',
                                subtitle: (profile?.name || 'Firma y Sello').toUpperCase(),
                                signatureUrl: signature?.signature || null,
                                isProfessional: true,
                                license: profile?.license
                            } : null}
                        />

                        {/* Interactive Signature Drawing Pads */}
                        <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8">
                            {showSignatures.operator && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                                    onSave={(sig) => setFormData((prev) => ({ ...prev, operatorSignature: sig || '' }))}
                                    initialImage={formData.operatorSignature}
                                    label="Firma del Operador / Trabajador" />
                            </div>
                            )}
                            {showSignatures.supervisor && (
                            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                                    onSave={(sig) => setFormData((prev) => ({ ...prev, supervisorSignature: sig || '' }))}
                                    initialImage={formData.supervisorSignature}
                                    label="Firma del Supervisor / Empleador" />
                            </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-row gap-2 justify-between w-full mt-[2.5rem] no-print overflow-x-auto pb-2">
                        <button onClick={handleBack} 
                            style={{ background: 'linear-gradient(135deg, #64748b, #475569)', color: 'white', border: 'none' }}
                            className="flex-1 min-w-[80px] px-2 py-2 rounded-lg flex items-center justify-center gap-1 font-extrabold text-[0.7rem] shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 cursor-pointer">
                            <ChevronLeft size={14} /> ATRÁS
                        </button>
                        
                        <button onClick={() => requirePro(handleSave)}
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                            className="flex-1 min-w-[90px] px-2 py-2 rounded-lg flex items-center justify-center gap-1 font-extrabold text-[0.7rem] shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 cursor-pointer">
                            <Save size={14} /> GUARDAR
                        </button>
                        
                        <button onClick={handlePrint}
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none' }}
                            className="flex-1 min-w-[90px] px-2 py-2 rounded-lg flex items-center justify-center gap-1 font-extrabold text-[0.7rem] shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5 cursor-pointer">
                            <Printer size={14} /> PDF
                        </button>
                        

                    </div>
      </ModuleFormSection>
      }
        </ModuleFormDocument>

    </ModuleFormLayout>);
}