import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ChevronRight, ChevronLeft, ArrowLeft,
  Save, Accessibility, AlertCircle, Info, Building2, Sparkles, Loader2 } from
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

export default function ErgonomicsForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const location = useLocation();
  const editData = location.state?.editData;
  const [step, setStep] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [formData, setFormData] = useState(editData || {
    empresa: '',
    cuit: '',
    sector: '',
    puesto: '',
    descripcionTarea: '',
    planilla1: {
      esfuerzoManual: false,
      levantamientoCarga: false,
      posturasForzadas: false,
      movimientosRepetitivos: false,
      empujeArrastre: false,
      vibraciones: false,
      confortTermico: false,
      bipedestación: false
    },
    calculoLevantamiento: {
      peso: 0,
      asimetria: '0', // 0, 30, 45, 60, 90
      frecuencia: 'baja', // baja, media, alta
      distanciaH: 'cerca', // cerca (<25cm), media (25-50cm), lejos (>50cm)
      altura: 'cintura' // suelo, rodilla, cintura, hombro
    },
    recomendaciones: ''
  });

  const categories = [
  { id: 'esfuerzoManual', label: 'Esfuerzo Manual Intenso' },
  { id: 'levantamientoCarga', label: 'Levantamiento/Descenso de Cargas' },
  { id: 'posturasForzadas', label: 'Posturas Forzadas' },
  { id: 'movimientosRepetitivos', label: 'Movimientos Repetitivos' },
  { id: 'empujeArrastre', label: 'Empuje y Arrastre' },
  { id: 'vibraciones', label: 'Vibraciones Cuerpo/Mano' },
  { id: 'confortTermico', label: 'Confort Térmico' }];


  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

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
    navigate(`/ergonomics-report?id=${id}`, { state: { report } });
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

                    <button onClick={handleNext} className="btn-primary w-full p-4 rounded-xl flex items-center justify-center gap-2 text-base font-bold transition-colors">
                        Siguiente Paso <ChevronRight size={20} />
                    </button>
      </ModuleFormSection>
      }

            {step === 2 &&
      <ModuleFormSection title="Planilla 1: Identificación" icon={<AlertCircle />}>
                    <p className="text-[0.95rem] text-[var(--color-text-muted)] mb-[2rem] font-[600]">
                        Indique la presencia de factores de riesgo en el puesto:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                        {categories.map((cat) =>
          <label
            key={cat.id}
            className="hover:shadow-md transition-all flex items-center gap-[1rem] p-[1.2rem] rounded-[16px] cursor-pointer"
            style={{

              background: formData.planilla1[cat.id] ? 'rgba(54,179,126,0.08)' : 'var(--color-background)',
              border: `2px solid ${formData.planilla1[cat.id] ? '#36B37E' : 'var(--color-border)'}`

            }}>
            
                                <input
              type="checkbox"
              checked={formData.planilla1[cat.id]}
              onChange={(e) => setFormData({
                ...formData,
                planilla1: { ...formData.planilla1, [cat.id]: e.target.checked }
              })} className="w-[22px] h-[22px] m-[0] accent-color-[#36B37E]" />

            
                                <span style={{ color: formData.planilla1[cat.id] ? 'var(--color-text)' : 'var(--color-text-muted)' }} className="text-[0.95rem] font-[700]">{cat.label}</span>
                            </label>
          )}
                    </div>

                    <div className="flex gap-[1rem] flex-wrap">
                        <button onClick={handleBack} className="btn-secondary flex-1 min-w-[120px] p-4 rounded-xl flex items-center justify-center gap-2 font-extrabold transition-colors">
                            <ChevronLeft size={20} /> Atrás
                        </button>
                        <button onClick={handleNext} className="btn-primary flex-[2] min-w-[180px] p-4 rounded-xl flex items-center justify-center gap-2 font-extrabold transition-colors">
                            Siguiente Paso <ChevronRight size={20} />
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

                    <div className="no-print flex gap-[1rem] mt-[2rem] flex-wrap">
                        <button
            onClick={handleBack} className="flex-[1] min-width-[120px] p-[1rem] bg-[transparent] text-[var(--color-text)] border-[2px_solid_var(--color-border)] rounded-[12px] font-[800] flex items-center justify-center gap-[0.5rem] cursor-pointer">

            
                            <ChevronLeft size={20} /> ATRÁS
                        </button>
                    </div>
      </ModuleFormSection>
      }
        </ModuleFormDocument>

        {step === 3 && (
            <ModuleActionBar
                actions={[
                    { id: 'save', label: 'GUARDAR ESTUDIO', icon: <Save />, variant: 'primary', onClick: () => requirePro(handleSave) }
                ]}
            />
        )}
    </ModuleFormLayout>);

}