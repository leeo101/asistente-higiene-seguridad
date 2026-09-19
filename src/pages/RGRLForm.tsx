import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ClipboardCheck, Save, Eye, Printer, Plus, Trash2,
  CheckCircle2, AlertTriangle, Sparkles, Building2, ShieldCheck,
  Check, X, Minus, Filter, UserCheck, Share2
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import RGRLPdf from '../components/RGRLPdf';
import SignatureCanvas from '../components/SignatureCanvas';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';
import type { RGRLSurvey, RGRLItem, RGRLAnnexType, RGRLItemStatus } from '../types/rgrl';
import {
  getDefaultQuestionsForAnnex,
  calculateRGRLMetrics,
  generatePlanRegularizacion
} from '../utils/rgrlEngine';
import {
  evaluateRgrlSurveySafety,
  OFFICIAL_RGRL_REGULATORY_CRITERIA
} from '../utils/srtProtocols';

export default function RGRLForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const { requirePro } = usePaywall();
  const [isEdit, setIsEdit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [filterItemState, setFilterItemState] = useState<'ALL' | 'NO_CUMPLE' | 'CUMPLE' | 'NO_APLICA'>('ALL');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useDocumentTitle(isEdit ? 'Editar RGRL Res. 463/09' : 'Nuevo Relevamiento RGRL Res. 463/09');

  const [survey, setSurvey] = useState<RGRLSurvey>(() => {
    let defCompany = '';
    let defCuit = '';
    let defAddress = '';
    let defArt = 'Prevención ART';
    let defProName = '';
    let defProLic = '';

    try {
      const savedCompany = localStorage.getItem('companyData');
      const savedPersonal = localStorage.getItem('personalData');
      if (savedCompany) {
        const c = JSON.parse(savedCompany);
        defCompany = c.name || '';
        defCuit = c.cuit || '';
        defAddress = c.address || '';
        defArt = c.art || defArt;
      } else if (savedPersonal) {
        const p = JSON.parse(savedPersonal);
        defCompany = p.company || '';
        defCuit = p.cuit || '';
        defAddress = p.address || '';
        defProName = p.name || '';
        defProLic = p.license || '';
      }
    } catch (e) {}

    const initialItems = getDefaultQuestionsForAnnex('anexo1_351');

    return {
      id: `RGRL-${Date.now()}`,
      razonSocial: defCompany,
      cuit: defCuit,
      establecimientoNombre: 'Planta Principal',
      direccion: defAddress,
      localidad: '',
      provincia: 'Buenos Aires',
      artNombre: defArt,
      nroPoliza: '',
      ciiuActividad: '292900 - Fabricación de maquinaria de uso especial',
      cantidadTrabajadores: 25,
      superficieM2: 1200,
      anexo: 'anexo1_351',
      fechaRelevamiento: new Date().toISOString().split('T')[0],
      profesionalHySNombre: defProName,
      profesionalHySMatricula: defProLic,
      empleadorResponsable: '',
      items: initialItems,
      planRegularizacion: [],
      porcentajeCumplimiento: 100,
      estadoGeneral: 'Óptimo (≥ 90%)',
      observacionesGenerales: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  // Cargar datos previos si es edición o perfil del usuario
  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.editData) {
      setSurvey(location.state.editData);
      setIsEdit(true);
      return;
    }

    try {
      const savedPersonal = localStorage.getItem('personalData');
      if (savedPersonal) {
        const pd = JSON.parse(savedPersonal);
        setSurvey(prev => ({
          ...prev,
          profesionalHySNombre: prev.profesionalHySNombre || pd.name || '',
          profesionalHySMatricula: prev.profesionalHySMatricula || pd.license || '',
          razonSocial: prev.razonSocial || pd.company || '',
          cuit: prev.cuit || pd.cuit || '',
          direccion: prev.direccion || pd.address || ''
        }));
      }
    } catch (e) {
      console.error('[RGRL FORM] Error parsing personalData:', e);
    }
  }, [location.state]);

  // Cambiar Anexo
  const handleAnnexChange = (newAnnex: RGRLAnnexType) => {
    if (newAnnex === survey.anexo) return;
    const newQuestions = getDefaultQuestionsForAnnex(newAnnex);
    setSurvey(prev => ({
      ...prev,
      anexo: newAnnex,
      items: newQuestions,
      planRegularizacion: []
    }));
    toast.success(`Cuestionario actualizado para ${newAnnex === 'anexo2_911' ? 'Construcción (Dec. 911)' : newAnnex === 'anexo3_617' ? 'Agro (Dec. 617)' : 'Industria y Servicios (Dec. 351)'}`);
  };

  // Actualizar estado de una pregunta
  const handleStatusChange = (itemId: string, newStatus: RGRLItemStatus) => {
    setSurvey(prev => {
      const updatedItems = prev.items.map(it => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          estado: newStatus,
          observacion: newStatus === 'NO_CUMPLE' && !it.observacion ? 'Requiere adecuación conforme normativa.' : it.observacion
        };
      });

      const metrics = calculateRGRLMetrics(updatedItems);
      const plan = generatePlanRegularizacion(metrics.itemsNoCumple);

      return {
        ...prev,
        items: updatedItems,
        planRegularizacion: plan,
        porcentajeCumplimiento: metrics.porcentajeCumplimiento,
        estadoGeneral: metrics.estadoGeneral
      };
    });
  };

  // Actualizar observación de un ítem
  const handleObservationChange = (itemId: string, obs: string) => {
    setSurvey(prev => {
      const updatedItems = prev.items.map(it => it.id === itemId ? { ...it, observacion: obs } : it);
      const metrics = calculateRGRLMetrics(updatedItems);
      const plan = generatePlanRegularizacion(metrics.itemsNoCumple);
      return {
        ...prev,
        items: updatedItems,
        planRegularizacion: plan
      };
    });
  };

  // Marcar todo como Cumple
  const handleMarkAllCumple = () => {
    setSurvey(prev => {
      const updatedItems = prev.items.map(it => ({ ...it, estado: 'CUMPLE' as RGRLItemStatus }));
      return {
        ...prev,
        items: updatedItems,
        planRegularizacion: [],
        porcentajeCumplimiento: 100,
        estadoGeneral: 'Óptimo (≥ 90%)'
      };
    });
    toast.success('Todas las preguntas marcadas como CUMPLE');
  };

  // Cargar ejemplo típico con desvíos habituales
  const handleLoadTypicalSample = () => {
    setSurvey(prev => {
      const updatedItems = prev.items.map(it => {
        if (it.codigo === '5.1' || it.codigo === '9.4' || it.codigo === '6.4') {
          return {
            ...it,
            estado: 'NO_CUMPLE' as RGRLItemStatus,
            observacion: it.codigo === '5.1'
              ? 'Protocolo de puesta a tierra vencido, requiere medición anual.'
              : it.codigo === '9.4'
              ? 'Falta implementar Programa de Ergonomía Integrado Res. 886/15.'
              : 'Pendiente realizar el segundo simulacro de evacuación anual.'
          };
        }
        return { ...it, estado: 'CUMPLE' as RGRLItemStatus };
      });

      const metrics = calculateRGRLMetrics(updatedItems);
      const plan = generatePlanRegularizacion(metrics.itemsNoCumple);

      return {
        ...prev,
        items: updatedItems,
        planRegularizacion: plan,
        porcentajeCumplimiento: metrics.porcentajeCumplimiento,
        estadoGeneral: metrics.estadoGeneral
      };
    });
    toast.success('Ejemplo cargado con desvíos normativos típicos');
  };

  // Generador de Diagnóstico Anual con IA
  const handleGenerateAiConclusion = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const evalRes = evaluateRgrlSurveySafety(survey);
      let text = `INFORME TÉCNICO DE RELEVAMIENTO GENERAL DE RIESGOS LABORALES (R.G.R.L.)\n`;
      text += `Marco Reglamentario: ${OFFICIAL_RGRL_REGULATORY_CRITERIA.resolutionMap[survey.anexo || 'anexo1_351']}.\n`;
      text += `Establecimiento: ${survey.razonSocial || 'Empresa'} — C.U.I.T. ${survey.cuit || 'S/N'}.\n`;
      text += `Fecha del Relevamiento: ${survey.fechaRelevamiento ? new Date(survey.fechaRelevamiento).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}.\n\n`;

      text += `1. DIAGNÓSTICO GENERAL DE CUMPLIMIENTO:\n`;
      text += `- Porcentaje de Cumplimiento Legal: ${evalRes.compliancePercent}% (${evalRes.estadoGeneral}).\n`;
      text += `- Cantidad de ítems conformes (CUMPLE): ${evalRes.cumpleCount}.\n`;
      text += `- Cantidad de desvíos detectados (NO CUMPLE): ${evalRes.noCumpleCount}.\n`;
      text += `- Cantidad de ítems no aplicables: ${evalRes.noAplicaCount}.\n\n`;

      if (evalRes.criticalDeficiencies.length > 0) {
        text += `2. NO CONFORMIDADES DE PRIORIDAD CRÍTICA:\n`;
        evalRes.criticalDeficiencies.forEach(c => {
          text += `  • [Ítem ${c.codigo}] ${c.pregunta} (${c.normativa}).\n`;
          if (c.observacion) text += `    Desvío constatado: ${c.observacion}\n`;
        });
        text += `\n`;
      }

      text += `3. PLAN DE REGULARIZACIÓN Y ACCIONES RECOMENDADAS:\n`;
      if (survey.planRegularizacion && survey.planRegularizacion.length > 0) {
        text += `- Se ha formalizado un cronograma con ${survey.planRegularizacion.length} medidas correctivas con plazos perentorios.\n`;
        text += `- Priorizar en los próximos 30 días la subsanación de riesgos eléctricos (Res. SRT 900/15) y medios de escape.\n`;
      } else {
        text += `- No se registraron desvíos normativos. Mantener la vigencia de los protocolos anuales y capacitaciones periódicas.\n`;
      }

      text += `\n4. DECLARACIÓN JURADA:\n`;
      text += `- El presente informe cumple con lo establecido en la Resolución S.R.T. N° 463/09, 529/09 y 74/10 para su oportuna presentación ante la A.R.T. ${survey.artNombre || ''}.`;

      setSurvey(prev => ({
        ...prev,
        observacionesGenerales: text
      }));
      setIsGeneratingAi(false);
      toast.success('Dictamen técnico anual generado conforme a normativa SRT');
    }, 600);
  };

  // Guardar
  const handleSave = () => {
    if (!survey.razonSocial || !survey.cuit) {
      toast.error('Complete Razón Social y CUIT del establecimiento');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('rgrl_surveys_db') || '[]');
    const metrics = calculateRGRLMetrics(survey.items);
    const toSave: RGRLSurvey = {
      ...survey,
      porcentajeCumplimiento: metrics.porcentajeCumplimiento,
      estadoGeneral: metrics.estadoGeneral,
      updatedAt: new Date().toISOString()
    };

    let updated;
    if (isEdit) {
      updated = saved.map((s: RGRLSurvey) => s.id === survey.id ? toSave : s);
      toast.success('Relevamiento RGRL actualizado');
    } else {
      updated = [toSave, ...saved];
      toast.success('Relevamiento RGRL guardado con éxito');
    }

    localStorage.setItem('rgrl_surveys_db', JSON.stringify(updated));
    navigate('/rgrl');
  };

  const liveEvaluation = evaluateRgrlSurveySafety(survey);
  const metrics = calculateRGRLMetrics(survey.items);

  // Filtrado de preguntas para visualización rápida
  const filteredItems = survey.items.filter(it => {
    if (filterItemState === 'ALL') return true;
    return it.estado === filterItemState;
  });

  // Agrupar preguntas filtradas por sección
  const sections = Array.from(new Set(filteredItems.map(it => it.seccion)));

  return (
    <div className="min-h-[100vh] bg-[var(--color-background)] pb-[8rem] pt-24">
      <ModuleFormLayout className="no-print">
        <ModuleFormToolbar
          onBack={() => navigate('/rgrl')}
          title={isEdit ? 'Editar Relevamiento RGRL' : 'Nuevo Relevamiento General (RGRL)'}
          subtitle="Resolución S.R.T. N° 463/09 · Declaración Jurada Anual ante ART"
          icon={<ClipboardCheck size={28} className="text-blue-500" />}
        />

        {/* Live Safety Assessment Banner */}
        <div className="mb-6 p-4 rounded-2xl border transition-all duration-300 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {liveEvaluation.compliancePercent >= 90 ? (
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
                  <CheckCircle2 size={28} />
                </div>
              ) : liveEvaluation.compliancePercent >= 75 ? (
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black">
                  <AlertTriangle size={28} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-black">
                  <AlertTriangle size={28} />
                </div>
              )}
              <div>
                <h4 className="m-0 text-base font-black uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                  DIAGNÓSTICO LEGAL: {liveEvaluation.estadoGeneral} ({liveEvaluation.compliancePercent}%)
                </h4>
                <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
                  {liveEvaluation.cumpleCount} conformidades · {liveEvaluation.noCumpleCount} no conformidades · {liveEvaluation.noAplicaCount} no aplican.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllCumple}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check size={14} />
                Marcar Todo Cumple
              </button>
              <button
                type="button"
                onClick={handleLoadTypicalSample}
                className="px-3 py-1.5 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles size={14} />
                Ejemplo Desvíos
              </button>
            </div>
          </div>

          {liveEvaluation.criticalDeficiencies.length > 0 && (
            <div className="mt-3 pt-3 border-t border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex flex-col gap-1">
              <span className="font-bold">⚠️ Desvíos de alta criticidad en seguridad y vida laboral:</span>
              {liveEvaluation.criticalDeficiencies.map((cd, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-black">✗ [Ítem {cd.codigo}]</span>
                  <span>{cd.pregunta} ({cd.normativa})</span>
                </div>
              ))}
            </div>
          )}

          {liveEvaluation.recommendations.length > 0 && (
            <div className="mt-2 text-xs text-slate-400 flex flex-col gap-1">
              {liveEvaluation.recommendations.map((rec, idx) => (
                <div key={idx}>• {rec}</div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Sección 1: Datos de la Empresa y la ART */}
          <ModuleFormSection title="1. Datos de la Empresa, Establecimiento y ART" icon={<Building2 size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Razón Social *</label>
                <input
                  type="text"
                  value={survey.razonSocial}
                  onChange={e => setSurvey(s => ({ ...s, razonSocial: e.target.value }))}
                  placeholder="Ej: Metalgas Argentina S.A."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CUIT Patronal *</label>
                <input
                  type="text"
                  value={survey.cuit}
                  onChange={e => setSurvey(s => ({ ...s, cuit: e.target.value }))}
                  placeholder="30-71234567-8"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Aseguradora (ART) *</label>
                <input
                  type="text"
                  value={survey.artNombre}
                  onChange={e => setSurvey(s => ({ ...s, artNombre: e.target.value }))}
                  placeholder="Prevención ART / Federación Patronal"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">N° de Contrato / Póliza</label>
                <input
                  type="text"
                  value={survey.nroPoliza || ''}
                  onChange={e => setSurvey(s => ({ ...s, nroPoliza: e.target.value }))}
                  placeholder="P-948210"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cantidad de Trabajadores</label>
                <input
                  type="number"
                  value={survey.cantidadTrabajadores}
                  onChange={e => setSurvey(s => ({ ...s, cantidadTrabajadores: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha de Relevamiento</label>
                <input
                  type="date"
                  value={survey.fechaRelevamiento}
                  onChange={e => setSurvey(s => ({ ...s, fechaRelevamiento: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dirección del Establecimiento</label>
                <input
                  type="text"
                  value={survey.direccion}
                  onChange={e => setSurvey(s => ({ ...s, direccion: e.target.value }))}
                  placeholder="Calle 10 N° 450, Parque Industrial"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Localidad y Provincia</label>
                <input
                  type="text"
                  value={`${survey.localidad ? survey.localidad + ', ' : ''}${survey.provincia}`}
                  onChange={e => setSurvey(s => ({ ...s, localidad: e.target.value }))}
                  placeholder="Avellaneda, Buenos Aires"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Profesional HyS Actuante</label>
                <input
                  type="text"
                  value={survey.profesionalHySNombre}
                  onChange={e => setSurvey(s => ({ ...s, profesionalHySNombre: e.target.value }))}
                  placeholder="Lic. / Ing. Juan Pérez"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Matrícula Profesional</label>
                <input
                  type="text"
                  value={survey.profesionalHySMatricula}
                  onChange={e => setSurvey(s => ({ ...s, profesionalHySMatricula: e.target.value }))}
                  placeholder="Mat. Ley 19.587 N° 5840"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Responsable por la Empresa</label>
                <input
                  type="text"
                  value={survey.empleadorResponsable}
                  onChange={e => setSurvey(s => ({ ...s, empleadorResponsable: e.target.value }))}
                  placeholder="Titular / Gerente General"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 2: Selector de Anexo */}
          <ModuleFormSection title="2. Selección del Anexo Oficial (Actividad)" icon={<ShieldCheck size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleAnnexChange('anexo1_351')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  survey.anexo === 'anexo1_351'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs uppercase text-blue-600 dark:text-blue-400">Anexo I</div>
                <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">Decreto 351/79</div>
                <div className="text-[11px] text-slate-500 mt-1">Industrias, Comercio y Empresas de Servicios</div>
              </button>

              <button
                type="button"
                onClick={() => handleAnnexChange('anexo2_911')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  survey.anexo === 'anexo2_911'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs uppercase text-amber-600 dark:text-amber-400">Anexo II</div>
                <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">Decreto 911/96</div>
                <div className="text-[11px] text-slate-500 mt-1">Industria de la Construcción y Obras Civiles</div>
              </button>

              <button
                type="button"
                onClick={() => handleAnnexChange('anexo3_617')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  survey.anexo === 'anexo3_617'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs uppercase text-emerald-600 dark:text-emerald-400">Anexo III</div>
                <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">Decreto 617/97</div>
                <div className="text-[11px] text-slate-500 mt-1">Actividad Agropecuaria y Forestal</div>
              </button>
            </div>
          </ModuleFormSection>

          {/* Sección 3: Cuestionario RGRL por Secciones */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/10 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={14} /> Filtro de Preguntas:
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'ALL', label: `Todos (${survey.items.length})` },
                  { id: 'NO_CUMPLE', label: `Solo NO CUMPLE (${metrics.noCumpleCount})`, color: 'text-rose-500' },
                  { id: 'CUMPLE', label: `Solo CUMPLE (${metrics.cumpleCount})`, color: 'text-emerald-500' },
                  { id: 'NO_APLICA', label: `Solo N/A (${metrics.noAplicaCount})` }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterItemState(f.id as any)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      filterItemState === f.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {sections.map((secName, secIdx) => {
              const secItems = filteredItems.filter(it => it.seccion === secName);
              return (
                <ModuleFormSection key={secIdx} title={secName} icon={<CheckCircle2 size={18} />}>
                  <div className="space-y-3">
                    {secItems.map(item => {
                      const isNoCumple = item.estado === 'NO_CUMPLE';
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all ${
                            item.estado === 'CUMPLE'
                              ? 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                              : item.estado === 'NO_CUMPLE'
                              ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-900/50'
                              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-70'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono font-bold text-xs text-slate-700 dark:text-slate-300 flex-shrink-0">
                                {item.codigo}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                                  {item.pregunta}
                                </p>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                  ⚖️ Ref: {item.normativa}
                                </span>
                              </div>
                            </div>

                            {/* Botones rápidos de estado */}
                            <div className="flex items-center gap-1 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, 'CUMPLE')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  item.estado === 'CUMPLE'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50'
                                }`}
                              >
                                CUMPLE
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, 'NO_CUMPLE')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  item.estado === 'NO_CUMPLE'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50'
                                }`}
                              >
                                NO CUMPLE
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, 'NO_APLICA')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  item.estado === 'NO_APLICA'
                                    ? 'bg-slate-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                N/A
                              </button>
                            </div>
                          </div>

                          {/* Campo de desvío y observación si es NO CUMPLE */}
                          {isNoCumple && (
                            <div className="mt-2.5 pt-2 border-t border-red-200 dark:border-red-900/40">
                              <label className="block text-[11px] font-bold text-red-800 dark:text-red-300 mb-1">
                                Observación del Desvío e Incumplimiento detectado:
                              </label>
                              <input
                                type="text"
                                value={item.observacion || ''}
                                onChange={e => handleObservationChange(item.id, e.target.value)}
                                placeholder="Describa el desvío observado en campo..."
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ModuleFormSection>
              );
            })}
          </div>

          {/* Sección 4: Plan de Regularización / Adecuación ante la ART */}
          {survey.planRegularizacion.length > 0 && (
            <ModuleFormSection
              title={`4. Plan de Regularización ante la ART (${survey.planRegularizacion.length} Desvíos)`}
              icon={<AlertTriangle size={20} className="text-amber-500" />}
            >
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  La siguiente tabla se genera automáticamente con los puntos marcados como "NO CUMPLE" y forma parte del cronograma de regularización de la DDJJ.
                </p>
                {survey.planRegularizacion.map((plan, idx) => (
                  <div
                    key={plan.id || idx}
                    className="p-3 bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono font-bold text-xs">
                        Ítem {plan.codigo}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {plan.descripcionIncumplimiento}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Medida Correctiva</label>
                        <input
                          type="text"
                          value={plan.medidaCorrectiva}
                          onChange={e => {
                            const val = e.target.value;
                            setSurvey(prev => ({
                              ...prev,
                              planRegularizacion: prev.planRegularizacion.map((p, i) => i === idx ? { ...p, medidaCorrectiva: val } : p)
                            }));
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha Límite</label>
                        <input
                          type="date"
                          value={plan.fechaLimite}
                          onChange={e => {
                            const val = e.target.value;
                            setSurvey(prev => ({
                              ...prev,
                              planRegularizacion: prev.planRegularizacion.map((p, i) => i === idx ? { ...p, fechaLimite: val } : p)
                            }));
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ModuleFormSection>
          )}

          {/* Sección 5: Diagnóstico y Dictamen Técnico Anual */}
          <ModuleFormSection title="5. Diagnóstico Técnico y Dictamen Anual para la ART" icon={<Sparkles size={20} className="text-blue-500" />}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase text-slate-400">Observaciones Generales y Declaración Jurada</span>
              <button
                type="button"
                onClick={handleGenerateAiConclusion}
                disabled={isGeneratingAi}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <Sparkles size={14} className={isGeneratingAi ? 'animate-spin' : ''} />
                {isGeneratingAi ? 'Generando...' : 'Generar Dictamen con IA / Res. SRT 463'}
              </button>
            </div>
            <textarea
              value={survey.observacionesGenerales || ''}
              onChange={e => setSurvey(prev => ({ ...prev, observacionesGenerales: e.target.value }))}
              placeholder="Describa el diagnóstico general, conclusiones del relevamiento, compromisos de la empresa y plazos acordados con la ART..."
              className="w-full min-h-[140px] px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed"
            />
          </ModuleFormSection>

          {/* Vista previa integrada en modal/colapsable */}
          {showPreview && (
            <div className="mt-8 border-t-2 border-slate-300 dark:border-slate-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye size={18} className="text-blue-500" /> Vista Previa de la Planilla Oficial RGRL PDF (Res. SRT 463/09)
                </h3>
                <button
                  type="button"
                  onClick={() => requirePro(() => window.print())}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={15} /> Imprimir / Exportar PDF
                </button>
              </div>
              <div className="bg-slate-200 dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700 overflow-x-auto shadow-inner">
                <RGRLPdf data={survey} />
              </div>
            </div>
          )}
        </div>
      </ModuleFormLayout>

      <ModuleActionBar
        actions={[
          {
            id: 'cancel',
            label: 'Volver',
            icon: <ArrowLeft size={16} />,
            variant: 'secondary',
            onClick: () => navigate('/rgrl')
          },
          {
            id: 'share',
            label: 'Compartir',
            icon: <Share2 size={16} />,
            variant: 'secondary',
            onClick: () => requirePro(() => setShowShareModal(true))
          },
          {
            id: 'preview',
            label: showPreview ? 'Ocultar PDF' : 'Vista Previa PDF',
            icon: <Eye size={16} />,
            variant: 'info',
            onClick: () => setShowPreview(!showPreview)
          },
          {
            id: 'save',
            label: isEdit ? 'Actualizar RGRL' : 'Guardar RGRL Res. 463/09',
            icon: <Save size={16} />,
            variant: 'primary',
            onClick: (e: any) => { e.preventDefault(); requirePro(handleSave); }
          }
        ]}
      />

      <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Relevamiento RGRL Res. SRT 463/09"
        text={`RGRL de ${survey.razonSocial || 'la empresa'} con ${metrics.porcentajeCumplimiento}% de cumplimiento normativo.`}
        rawMessage={`Relevamiento General de Riesgos Laborales: ${survey.razonSocial}`}
        fileName={`RGRL_${survey.razonSocial || 'Empresa'}_Res463.pdf`}
      />

      <div className="print-only fixed left-0 opacity-[0.01] top-0 pointer-events-none">
        <RGRLPdf data={survey} />
      </div>
    </div>
  );
}
