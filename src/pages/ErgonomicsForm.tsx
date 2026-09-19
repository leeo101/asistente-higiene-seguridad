import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ChevronRight, ChevronLeft, Save, Accessibility, AlertCircle, Building2,
  Sparkles, Loader2, Printer, CheckCircle2, Circle, Plus, Trash2, ShieldCheck,
  Activity, Users, FileText, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
} from '../components/module';
import { getErrorMessage } from '../utils/errorUtils';
import ErgonomicsPdfGenerator from '../components/ErgonomicsPdfGenerator';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import {
  OFFICIAL_PLANILLA1_FACTORS,
  calculateNioshSrt886,
  evaluateFullErgonomicsProtocol
} from '../utils/srtProtocols';
import type {
  ErgonomicsRiskFactorKey,
  Planilla3ActionMeasure
} from '../types/ergonomics';

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
  const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);

  // Perfil del usuario
  useEffect(() => {
    window.scrollTo(0, 0);
    const savedProfile = localStorage.getItem('personalData');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Error al parsear personalData', e);
      }
    }

    const sig = localStorage.getItem('signatureStampData');
    if (sig) {
      try {
        setSignature(JSON.parse(sig));
      } catch (e) {
        console.error('Error al parsear signatureStampData', e);
      }
    }
  }, []);

  // Inicializar estado del formulario
  const [formData, setFormData] = useState<any>(() => {
    if (editData) return editData;

    const savedProfile = localStorage.getItem('personalData');
    let defaultEmpresa = '';
    let defaultCuit = '';
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        defaultEmpresa = parsed.companyName || parsed.empresa || '';
        defaultCuit = parsed.cuit || '';
      } catch (e) {}
    }

    // Inicializar planilla 1 con los 10 factores
    const initialPlanilla1: Record<string, boolean> = {};
    OFFICIAL_PLANILLA1_FACTORS.forEach(f => {
      initialPlanilla1[f.id] = false;
    });

    return {
      cuit: defaultCuit,
      empresa: defaultEmpresa,
      direccion: '',
      localidad: '',
      art: '',
      sector: '',
      puesto: '',
      descripcionTarea: '',
      trabajadoresVarones: 1,
      trabajadoresMujeres: 0,
      duracionJornadaHoras: 8,
      fechaEvaluacion: new Date().toISOString().split('T')[0],
      planilla1: initialPlanilla1,
      calculoLevantamiento: {
        pesoCargaKg: 10,
        distanciaHCm: 35,
        distanciaVCm: 75,
        desplazamientoDCm: 50,
        anguloTorsionDeg: 0,
        frecuenciaLiftsMin: 1,
        duracionHoras: 1,
        calidadAgarre: 'Bueno'
      },
      medidasAccion: [] as Planilla3ActionMeasure[],
      conclusiones: '',
      recomendaciones: '',
      operatorSignature: '',
      supervisorSignature: ''
    };
  });

  // Cálculo en vivo de NIOSH
  const liveNiosh = calculateNioshSrt886(formData.calculoLevantamiento);

  // Evaluación integral en vivo
  const liveEvaluation = evaluateFullErgonomicsProtocol({
    planilla1: formData.planilla1,
    calculoLevantamiento: formData.calculoLevantamiento
  });

  // Generar o actualizar medidas automáticas de Planilla 3 si están vacías
  const handleGenerateDefaultMeasures = () => {
    if (liveEvaluation.medidasSugeridas.length > 0) {
      setFormData((prev: any) => ({
        ...prev,
        medidasAccion: liveEvaluation.medidasSugeridas
      }));
      toast.success('Medidas de acción preventivas cargadas automáticamente');
    } else {
      toast('No se detectaron factores de riesgo que requieran medidas');
    }
  };

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

    const finalReport = {
      ...formData,
      id,
      nivelRiesgoGlobal: liveEvaluation.nivelRiesgoGlobal,
      riesgo: liveEvaluation.riesgoRetro,
      calculoLevantamiento: {
        ...formData.calculoLevantamiento,
        lprKg: liveNiosh.lprKg,
        indiceLevantamiento: liveNiosh.indiceLevantamiento,
        multiplicadores: liveNiosh.multiplicadores,
        nivelRiesgo: liveNiosh.nivelRiesgo
      },
      conclusiones: formData.conclusiones || liveEvaluation.conclusionesAutomaticas.join('\n\n'),
      recomendaciones: formData.recomendaciones || liveEvaluation.conclusionesAutomaticas.slice(1).join('\n')
    };

    if (editData) {
      history = history.map((item: any) => (item.id === editData.id ? finalReport : item));
    } else {
      history.unshift(finalReport);
    }

    localStorage.setItem('ergonomics_history', JSON.stringify(history));
    syncCollection('ergonomics_history', history);

    toast.success(editData ? 'Estudio ergonómico actualizado correctamente.' : 'Estudio ergonómico guardado con éxito.');
    navigate('/ergonomics');
  };

  const handleGenerateConclusion = async () => {
    setIsGeneratingConclusion(true);
    const loadingToast = toast.loading('Redactando dictamen técnico con IA...');
    try {
      const token = await auth.currentUser?.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/api/ai-report-conclusion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reportType: 'Estudio de Ergonomía Res SRT 886/15',
          reportData: {
            empresa: formData.empresa,
            cuit: formData.cuit,
            sector: formData.sector,
            puesto: formData.puesto,
            descripcionTarea: formData.descripcionTarea,
            factoresRiesgo: formData.planilla1,
            calculoLevantamiento: liveNiosh,
            nivelRiesgoGlobal: liveEvaluation.nivelRiesgoGlobal,
            medidasAccion: formData.medidasAccion
          }
        })
      });

      if (!res.ok) throw new Error('Error al conectar con la IA');
      const data = await res.json();
      setFormData((prev: any) => ({
        ...prev,
        conclusiones: data.conclusion || prev.conclusiones,
        recomendaciones: data.conclusion || prev.recomendaciones
      }));
      toast.success('Dictamen técnico redactado con éxito ✨', { id: loadingToast });
    } catch (error) {
      // Fallback local determinístico conforme a la SRT
      setFormData((prev: any) => ({
        ...prev,
        conclusiones: liveEvaluation.conclusionesAutomaticas.join('\n\n'),
        recomendaciones: liveEvaluation.conclusionesAutomaticas.slice(1).join('\n')
      }));
      toast.success('Conclusiones normativas generadas localmente.', { id: loadingToast });
    } finally {
      setIsGeneratingConclusion(false);
    }
  };

  return (
    <ModuleFormLayout>
      {/* Componente PDF fuera de pantalla para captura / impresión */}
      <div className="ats-pdf-offscreen" aria-hidden="true">
        <ErgonomicsPdfGenerator
          data={{
            ...formData,
            nivelRiesgoGlobal: liveEvaluation.nivelRiesgoGlobal,
            riesgo: liveEvaluation.riesgoRetro,
            calculoLevantamiento: {
              ...formData.calculoLevantamiento,
              lprKg: liveNiosh.lprKg,
              indiceLevantamiento: liveNiosh.indiceLevantamiento,
              multiplicadores: liveNiosh.multiplicadores,
              nivelRiesgo: liveNiosh.nivelRiesgo
            }
          }}
          profile={profile}
          signature={signature}
          showSignatures={showSignatures}
        />
      </div>

      <div className="pt-24 no-print"></div>

      <ModuleFormToolbar
        title={editData ? 'Editar Protocolo de Ergonomía' : 'Nuevo Protocolo de Ergonomía'}
        subtitle="Resolución S.R.T. N° 886/15 • Planillas 1, 2 y 3"
        icon={<Accessibility size={36} color="#ffffff" />}
        steps={['1. Datos Generales', '2. Planilla 1', '3. Planilla 2', '4. Planilla 3 y Dictamen']}
        currentStep={step}
        onStepClick={(s) => {
          setStep(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onBack={() => navigate('/ergonomics')}
      />

      <div className="my-6 z-10 no-print" />

      <ModuleFormDocument>
        {/* PASO 1: DATOS PATRONALES Y PUESTO */}
        {step === 1 && (
          <ModuleFormSection title="I — Datos del Establecimiento y Puesto de Trabajo" icon={<Building2 />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Empresa / Razón Social *
                </label>
                <input
                  className="module-form-input"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Ej: Logística Central S.A."
                />
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  C.U.I.T. N° *
                </label>
                <input
                  className="module-form-input font-mono"
                  value={formData.cuit}
                  onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                  placeholder="30-XXXXXXXX-X"
                />
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  A.R.T. Contratada
                </label>
                <input
                  className="module-form-input"
                  value={formData.art}
                  onChange={(e) => setFormData({ ...formData, art: e.target.value })}
                  placeholder="Ej: Asociart, Prevención ART..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Sector / Nave *
                </label>
                <input
                  className="module-form-input"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  placeholder="Ej: Depósito, Línea de Envasado..."
                />
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Puesto de Trabajo *
                </label>
                <input
                  className="module-form-input"
                  value={formData.puesto}
                  onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                  placeholder="Ej: Operario de Paletizado"
                />
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Fecha del Relevamiento
                </label>
                <input
                  type="date"
                  className="module-form-input"
                  value={formData.fechaEvaluacion}
                  onChange={(e) => setFormData({ ...formData, fechaEvaluacion: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Operarios Varones Expuestos
                </label>
                <input
                  type="number"
                  min="0"
                  className="module-form-input"
                  value={formData.trabajadoresVarones}
                  onChange={(e) => setFormData({ ...formData, trabajadoresVarones: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Operarias Mujeres Expuestas
                </label>
                <input
                  type="number"
                  min="0"
                  className="module-form-input"
                  value={formData.trabajadoresMujeres}
                  onChange={(e) => setFormData({ ...formData, trabajadoresMujeres: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Duración Jornada (Horas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  className="module-form-input"
                  value={formData.duracionJornadaHoras}
                  onChange={(e) => setFormData({ ...formData, duracionJornadaHoras: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                Descripción Detallada de Tareas y Ciclos de Trabajo
              </label>
              <textarea
                rows={3}
                className="module-form-input"
                value={formData.descripcionTarea}
                onChange={(e) => setFormData({ ...formData, descripcionTarea: e.target.value })}
                placeholder="Describa los movimientos, pesos habituales manipulados, herramientas empleadas y descansos del ciclo..."
              />
            </div>

            <div className="flex justify-center w-full">
              <button
                onClick={handleNext}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-extrabold shadow-lg hover:opacity-90 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Continuar a Planilla 1 <ChevronRight size={18} />
              </button>
            </div>
          </ModuleFormSection>
        )}

        {/* PASO 2: PLANILLA 1 IDENTIFICACIÓN DE FACTORES */}
        {step === 2 && (
          <ModuleFormSection title="II — Planilla 1: Identificación de Factores de Riesgo (Res. SRT 886/15)" icon={<AlertCircle />}>
            <p className="text-[0.95rem] text-[var(--color-text-muted)] mb-6 font-[600]">
              Marque la presencia de cada factor de riesgo ergonómico en el puesto. Si el factor está presente, la normativa SRT determina la necesidad de profundizar con la <strong>Planilla 2</strong> correspondiente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {OFFICIAL_PLANILLA1_FACTORS.map((factor) => {
                const isSelected = Boolean(formData.planilla1[factor.id]);
                return (
                  <div
                    key={factor.id}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        planilla1: {
                          ...formData.planilla1,
                          [factor.id]: !isSelected
                        }
                      });
                    }}
                    className="p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 select-none hover:shadow-md"
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface)',
                      borderColor: isSelected ? '#10b981' : 'var(--color-border)',
                      boxShadow: isSelected ? '0 4px 15px rgba(16, 185, 129, 0.15)' : 'none'
                    }}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle2 size={24} className="text-emerald-500" />
                      ) : (
                        <Circle size={24} className="text-slate-300 dark:text-slate-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <span className="font-extrabold text-sm text-[var(--color-text)]">
                          {factor.numero}. {factor.nombre}
                        </span>
                        {factor.requierePlanilla2 && (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            {factor.planillaDerivada}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] m-0 leading-relaxed font-medium">
                        {factor.criterioSrt}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-3">
                <ShieldCheck size={28} className="text-emerald-500" />
                <div>
                  <h4 className="text-sm font-extrabold text-[var(--color-text)] m-0">
                    Factores Identificados: {liveEvaluation.factoresIdentificadosCount} de 10
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] m-0 font-medium">
                    {liveEvaluation.factoresRequierenPlanilla2.length > 0
                      ? `Requiere Planilla 2 para: ${liveEvaluation.factoresRequierenPlanilla2.join(', ')}`
                      : 'No se detectaron factores que requieran Planilla 2'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase block">Riesgo Inicial Estimado</span>
                <span className={`text-sm font-black px-3 py-1 rounded-full ${
                  liveEvaluation.nivelRiesgoGlobal.includes('Nivel 3') ? 'bg-rose-100 text-rose-700' :
                  liveEvaluation.nivelRiesgoGlobal.includes('Nivel 2') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {liveEvaluation.nivelRiesgoGlobal}
                </span>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap justify-center w-full">
              <button
                onClick={handleBack}
                style={{ background: 'linear-gradient(135deg, #64748b, #475569)', color: 'white', border: 'none' }}
                className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                <ChevronLeft size={18} /> Atrás
              </button>
              <button
                onClick={handleNext}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                Continuar a Planilla 2 <ChevronRight size={18} />
              </button>
            </div>
          </ModuleFormSection>
        )}

        {/* PASO 3: PLANILLA 2 EVALUACIÓN ESPECÍFICA (NIOSH) */}
        {step === 3 && (
          <ModuleFormSection title="III — Planilla 2.A: Evaluación de Levantamiento de Cargas (Ecuación NIOSH)" icon={<Activity />}>
            {formData.planilla1['1_levantamiento'] ? (
              <div className="space-y-6">
                {/* Resumen de Métricas NIOSH */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                      Peso Real Manipulado
                    </span>
                    <div className="text-3xl font-black text-blue-900 dark:text-blue-200">
                      {liveNiosh.pesoCargaKg} <span className="text-sm font-bold text-slate-500">kg</span>
                    </div>
                    {liveNiosh.pesoCargaKg > 25 && (
                      <p className="text-rose-600 text-xs font-black mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> Excede el límite de 25 kg
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">
                      Límite de Peso Recomendado (LPR)
                    </span>
                    <div className="text-3xl font-black text-purple-900 dark:text-purple-200">
                      {liveNiosh.lprKg} <span className="text-sm font-bold text-slate-500">kg</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Capacidad biomecánica segura
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    liveNiosh.nivelRiesgo.includes('Nivel 3') ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/30' :
                    liveNiosh.nivelRiesgo.includes('Nivel 2') ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/30' :
                    'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest block text-slate-600">
                      Índice de Levantamiento (IL)
                    </span>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {liveNiosh.indiceLevantamiento}
                    </div>
                    <span className="text-xs font-black uppercase block mt-1">
                      {liveNiosh.nivelRiesgo}
                    </span>
                  </div>
                </div>

                {/* Parámetros Operativos de NIOSH */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-wider text-[var(--color-text)] m-0">
                    Variables de Entrada para la Ecuación NIOSH (Res. SRT 886/15)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                        Peso Efectivo de la Carga (kg) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="module-form-input font-bold"
                        value={formData.calculoLevantamiento.pesoCargaKg}
                        onChange={(e) => setFormData({
                          ...formData,
                          calculoLevantamiento: { ...formData.calculoLevantamiento, pesoCargaKg: Number(e.target.value) }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                        Distancia Horizontal H (cm)
                      </label>
                      <input
                        type="number"
                        min="25"
                        max="63"
                        className="module-form-input"
                        value={formData.calculoLevantamiento.distanciaHCm}
                        onChange={(e) => setFormData({
                          ...formData,
                          calculoLevantamiento: { ...formData.calculoLevantamiento, distanciaHCm: Number(e.target.value) }
                        })}
                      />
                      <span className="text-[10px] text-[var(--color-text-muted)] block mt-1">
                        Desde el punto medio de los tobillos a las manos (25 a 63 cm).
                      </span>
                    </div>

                    <div>
                      <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                        Altura Vertical Inicial V (cm)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="175"
                        className="module-form-input"
                        value={formData.calculoLevantamiento.distanciaVCm}
                        onChange={(e) => setFormData({
                          ...formData,
                          calculoLevantamiento: { ...formData.calculoLevantamiento, distanciaVCm: Number(e.target.value) }
                        })}
                      />
                      <span className="text-[10px] text-[var(--color-text-muted)] block mt-1">
                        Altura de las manos desde el suelo al iniciar (óptimo = 75 cm).
                      </span>
                    </div>

                    <div>
                      <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                        Desplazamiento Vertical D (cm)
                      </label>
                      <input
                        type="number"
                        min="25"
                        max="175"
                        className="module-form-input"
                        value={formData.calculoLevantamiento.desplazamientoDCm}
                        onChange={(e) => setFormData({
                          ...formData,
                          calculoLevantamiento: { ...formData.calculoLevantamiento, desplazamientoDCm: Number(e.target.value) }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                        Ángulo de Asimetría / Torsión A (grados)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="135"
                        className="module-form-input"
                        value={formData.calculoLevantamiento.anguloTorsionDeg}
                        onChange={(e) => setFormData({
                          ...formData,
                          calculoLevantamiento: { ...formData.calculoLevantamiento, anguloTorsionDeg: Number(e.target.value) }
                        })}
                      />
                      <span className="text-[10px] text-[var(--color-text-muted)] block mt-1">
                        Giro de tronco sin mover los pies (0° a 135°).
                      </span>
                    </div>

                    <div>
                      <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                        Frecuencia de Levantamientos (por minuto)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="15"
                        className="module-form-input"
                        value={formData.calculoLevantamiento.frecuenciaLiftsMin}
                        onChange={(e) => setFormData({
                          ...formData,
                          calculoLevantamiento: { ...formData.calculoLevantamiento, frecuenciaLiftsMin: Number(e.target.value) }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                        Calidad de Agarre (Acoplamiento)
                      </label>
                      <select
                        className="module-form-input"
                        value={formData.calculoLevantamiento.calidadAgarre}
                        onChange={(e) => setFormData({
                          ...formData,
                          calculoLevantamiento: { ...formData.calculoLevantamiento, calidadAgarre: e.target.value }
                        })}
                      >
                        <option value="Bueno">Bueno (Asas ergonómicas o agarre confortable)</option>
                        <option value="Regular">Regular (Asas pequeñas o agarre forzado)</option>
                        <option value="Malo">Malo (Cajas sin asas, bordes afilados, inestables)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                        Duración de la Tarea en la Jornada
                      </label>
                      <select
                        className="module-form-input"
                        value={formData.calculoLevantamiento.duracionHoras}
                        onChange={(e) => setFormData({
                          ...formData,
                          calculoLevantamiento: { ...formData.calculoLevantamiento, duracionHoras: Number(e.target.value) }
                        })}
                      >
                        <option value={1}>Corta duración (≤ 1 hora diaria)</option>
                        <option value={2}>Moderada duración (1 a 2 horas diarias)</option>
                        <option value={8}>Larga duración (&gt; 2 horas diarias)</option>
                      </select>
                    </div>
                  </div>

                  {/* Factores Multiplicadores Calculados */}
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">HM</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{liveNiosh.multiplicadores.HM}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">VM</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{liveNiosh.multiplicadores.VM}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">DM</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{liveNiosh.multiplicadores.DM}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">AM</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{liveNiosh.multiplicadores.AM}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">FM</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{liveNiosh.multiplicadores.FM}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">CM</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{liveNiosh.multiplicadores.CM}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                <Accessibility size={44} className="mx-auto mb-3 text-slate-400 opacity-60" />
                <h4 className="text-base font-extrabold text-[var(--color-text)] mb-1">
                  Levantamiento de cargas no seleccionado en Planilla 1
                </h4>
                <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto m-0">
                  Si el puesto implica manipulación manual de cargas ≥ 3 kg, active el factor en la Planilla 1 para habilitar la evaluación biomecánica NIOSH.
                </p>
              </div>
            )}

            <div className="flex gap-4 flex-wrap justify-center w-full mt-8">
              <button
                onClick={handleBack}
                style={{ background: 'linear-gradient(135deg, #64748b, #475569)', color: 'white', border: 'none' }}
                className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                <ChevronLeft size={18} /> Atrás
              </button>
              <button
                onClick={handleNext}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                Continuar a Planilla 3 <ChevronRight size={18} />
              </button>
            </div>
          </ModuleFormSection>
        )}

        {/* PASO 4: PLANILLA 3 MATRIZ DE MEDIDAS, CONCLUSIONES Y FIRMAS */}
        {step === 4 && (
          <ModuleFormSection title="IV — Planilla 3: Matriz de Medidas Preventivas y Dictamen" icon={<FileText />}>
            {/* Cabecera Planilla 3 */}
            <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
              <div>
                <h4 className="text-sm font-black text-[var(--color-text)] m-0 uppercase tracking-wide">
                  Medidas de Intervención Ergonómica (Res. SRT 886/15)
                </h4>
                <p className="text-xs text-[var(--color-text-muted)] m-0 font-medium">
                  Jerarquía de controles: Ingeniería, Rediseño Organizacional y Capacitación.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateDefaultMeasures}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
              >
                <RefreshCw size={14} /> Cargar Medidas Sugeridas SRT
              </button>
            </div>

            {/* Lista de Medidas */}
            <div className="space-y-3 mb-6">
              {(formData.medidasAccion && formData.medidasAccion.length > 0) ? (
                formData.medidasAccion.map((med: Planilla3ActionMeasure, idx: number) => (
                  <div key={med.id || idx} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                    <div className="md:col-span-2">
                      <span className="text-[10px] font-black uppercase text-blue-600 block">{med.factorRiesgo}</span>
                      <input
                        className="module-form-input text-xs mt-1"
                        value={med.medidaPropuesta}
                        onChange={(e) => {
                          const updated = [...formData.medidasAccion];
                          updated[idx].medidaPropuesta = e.target.value;
                          setFormData({ ...formData, medidasAccion: updated });
                        }}
                        placeholder="Descripción de la medida..."
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Tipo</span>
                      <select
                        className="module-form-input text-xs mt-1"
                        value={med.tipoMedida}
                        onChange={(e) => {
                          const updated = [...formData.medidasAccion];
                          updated[idx].tipoMedida = e.target.value as any;
                          setFormData({ ...formData, medidasAccion: updated });
                        }}
                      >
                        <option value="Ingeniería">Ingeniería</option>
                        <option value="Administrativa / Organizacional">Administrativa / Org.</option>
                        <option value="Capacitación">Capacitación</option>
                        <option value="EPP">EPP</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Plazo / Resp.</span>
                      <input
                        className="module-form-input text-xs mt-1"
                        value={med.plazo}
                        onChange={(e) => {
                          const updated = [...formData.medidasAccion];
                          updated[idx].plazo = e.target.value;
                          setFormData({ ...formData, medidasAccion: updated });
                        }}
                        placeholder="Ej: 30 días"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        className="module-form-input text-xs mt-1 flex-1"
                        value={med.responsable}
                        onChange={(e) => {
                          const updated = [...formData.medidasAccion];
                          updated[idx].responsable = e.target.value;
                          setFormData({ ...formData, medidasAccion: updated });
                        }}
                        placeholder="Responsable"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.medidasAccion.filter((_: any, i: number) => i !== idx);
                          setFormData({ ...formData, medidasAccion: updated });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
                  No hay medidas agregadas aún. Puedes presionar "Cargar Medidas Sugeridas SRT" o agregar una manualmente.
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const newMeasure: Planilla3ActionMeasure = {
                    id: `med_${Date.now()}`,
                    factorRiesgo: 'Ergonomía General',
                    medidaPropuesta: '',
                    tipoMedida: 'Ingeniería',
                    plazo: '60 días',
                    responsable: 'Servicio HyS',
                    estado: 'Pendiente'
                  };
                  setFormData({
                    ...formData,
                    medidasAccion: [...(formData.medidasAccion || []), newMeasure]
                  });
                }}
                className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> Agregar Medida de Acción
              </button>
            </div>

            {/* Conclusiones Técnicas y Dictamen */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                <label className="font-extrabold text-sm text-[var(--color-text)] m-0">
                  V — Dictamen y Conclusiones Técnicas Oficiales
                </label>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow hover:opacity-90"
                  onClick={handleGenerateConclusion}
                  disabled={isGeneratingConclusion}
                >
                  {isGeneratingConclusion ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {isGeneratingConclusion ? 'REDACTANDO...' : 'REDACTAR CON IA'}
                </button>
              </div>
              <textarea
                rows={4}
                className="module-form-input"
                value={formData.conclusiones}
                onChange={(e) => setFormData({ ...formData, conclusiones: e.target.value, recomendaciones: e.target.value })}
                placeholder="Dictamen técnico del profesional habilitado, encuadre normativo en Res. SRT 886/15 y recomendaciones ergonómicas..."
              />
            </div>

            {/* Firmas y Autorizaciones */}
            <div className="mb-8">
              <label className="font-extrabold text-sm text-[var(--color-text)] block mb-3">
                VI — Firmas y Validación Institucional
              </label>
              <div className="flex flex-wrap gap-4 mb-4">
                <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={showSignatures.operator}
                    onChange={(e) => setShowSignatures({ ...showSignatures, operator: e.target.checked })}
                  />
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                      showSignatures.operator ? 'bg-emerald-500' : 'border border-slate-400'
                    }`}
                  >
                    {showSignatures.operator && <CheckCircle2 size={12} />}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Operador / Trabajador</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={showSignatures.supervisor}
                    onChange={(e) => setShowSignatures({ ...showSignatures, supervisor: e.target.checked })}
                  />
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                      showSignatures.supervisor ? 'bg-emerald-500' : 'border border-slate-400'
                    }`}
                  >
                    {showSignatures.supervisor && <CheckCircle2 size={12} />}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Supervisor / Empleador</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={showSignatures.professional}
                    onChange={(e) => setShowSignatures({ ...showSignatures, professional: e.target.checked })}
                  />
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                      showSignatures.professional ? 'bg-emerald-500' : 'border border-slate-400'
                    }`}
                  >
                    {showSignatures.professional && <CheckCircle2 size={12} />}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Profesional Actuante</span>
                </label>
              </div>

              {/* Paneles interactivos de firma */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--color-border)]">
                {showSignatures.operator && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border rounded-xl">
                    <SignatureCanvas
                      onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                      initialImage={formData.operatorSignature}
                      label="Firma del Operador / Trabajador"
                    />
                  </div>
                )}
                {showSignatures.supervisor && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border rounded-xl">
                    <SignatureCanvas
                      onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                      initialImage={formData.supervisorSignature}
                      label="Firma del Supervisor / Empleador"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Barra de Acciones */}
            <div className="flex flex-row gap-3 justify-between w-full mt-8 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={handleBack}
                style={{ background: 'linear-gradient(135deg, #64748b, #475569)', color: 'white', border: 'none' }}
                className="flex-1 min-w-[90px] px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-extrabold text-xs shadow hover:opacity-90 cursor-pointer"
              >
                <ChevronLeft size={16} /> ATRÁS
              </button>

              <button
                type="button"
                onClick={() => requirePro(handleSave)}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                className="flex-1 min-w-[110px] px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-lg hover:opacity-90 cursor-pointer"
              >
                <Save size={16} /> GUARDAR ESTUDIO
              </button>

              <button
                type="button"
                onClick={handlePrint}
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none' }}
                className="flex-1 min-w-[100px] px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-lg hover:opacity-90 cursor-pointer"
              >
                <Printer size={16} /> IMPRIMIR PDF
              </button>
            </div>
          </ModuleFormSection>
        )}
      </ModuleFormDocument>
    </ModuleFormLayout>
  );
}