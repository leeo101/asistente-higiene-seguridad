import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Stethoscope, Save, Eye, Printer, Plus, Trash2,
  CheckCircle2, Sparkles, Building2, UserPlus, ShieldCheck,
  Search, X, Check, AlertCircle, AlertTriangle, FileSpreadsheet,
  FileCheck2, Wand2
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import RARPdf from '../components/RARPdf';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';
import type { RARSurvey, WorkerExposure } from '../types/rar';
import {
  SRT_RISK_AGENTS_CATALOG,
  JOB_POSITION_PRESETS,
  calculateRARStats,
  getAgentByCode,
  validateCuilFormat,
  getRecommendedMedicalExams
} from '../utils/rarCatalog';
import { evaluateRarProtocolSafety } from '../utils/srtProtocols';

export default function RARForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEdit, setIsEdit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Nómina RAR Res. 37/10' : 'Nueva Nómina de Expuestos (RAR)');

  const [survey, setSurvey] = useState<RARSurvey>({
    id: `RAR-${Date.now()}`,
    razonSocial: '',
    cuit: '',
    establecimientoNombre: 'Planta Industrial',
    establecimientoNumero: '001',
    direccion: '',
    localidad: '',
    provincia: 'Buenos Aires',
    artNombre: 'Prevención ART',
    nroPoliza: '',
    ciiuActividad: '281100 - Fabricación de maquinaria industrial',
    fechaRelevamiento: new Date().toISOString().split('T')[0],
    fechaVigenciaHasta: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    })(),
    profesionalNombre: '',
    profesionalMatricula: '',
    empleadorResponsable: '',
    trabajadores: [
      {
        id: '1',
        cuil: '20-35894120-7',
        nombre: 'Carlos Martínez',
        puesto: 'Soldador / Armador Metálico',
        sector: 'Taller de Soldadura',
        fechaIngreso: '2021-03-15',
        agentesCodigos: ['80001', '80003', '40001', '90001'],
        horasExposicionDiaria: 8,
        diasExposicionSemanal: 5,
        eppAdecuado: true,
        observaciones: 'Utiliza máscara fotosensible y protección auditiva'
      },
      {
        id: '2',
        cuil: '20-38491024-3',
        nombre: 'Diego Navarro',
        puesto: 'Conductor de Autoelevador',
        sector: 'Logística / Almacén',
        fechaIngreso: '2022-06-01',
        agentesCodigos: ['80001', '80005'],
        horasExposicionDiaria: 8,
        diasExposicionSemanal: 5,
        eppAdecuado: true,
        observaciones: 'Asiento ergonómico con suspensión neumática'
      }
    ],
    conclusionTecnica: '',
    observaciones: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
          profesionalNombre: pd.name || prev.profesionalNombre,
          profesionalMatricula: pd.license || prev.profesionalMatricula,
          razonSocial: pd.company || prev.razonSocial,
          cuit: pd.cuit || prev.cuit,
          direccion: pd.address || prev.direccion
        }));
      }
    } catch (e) {
      console.error('[RAR FORM] Error parsing personalData:', e);
    }
  }, [location.state]);

  // Manejo de Trabajadores
  const addWorker = () => {
    const newW: WorkerExposure = {
      id: Date.now().toString(),
      cuil: '',
      nombre: '',
      puesto: 'Operario de Producción',
      sector: 'Planta',
      fechaIngreso: new Date().toISOString().split('T')[0],
      agentesCodigos: ['80001'],
      horasExposicionDiaria: 8,
      diasExposicionSemanal: 5,
      eppAdecuado: true,
      observaciones: ''
    };
    setSurvey(prev => ({ ...prev, trabajadores: [...prev.trabajadores, newW] }));
  };

  const removeWorker = (id: string) => {
    setSurvey(prev => ({ ...prev, trabajadores: prev.trabajadores.filter(w => w.id !== id) }));
  };

  const updateWorker = (id: string, field: keyof WorkerExposure, value: any) => {
    setSurvey(prev => ({
      ...prev,
      trabajadores: prev.trabajadores.map(w => w.id === id ? { ...w, [field]: value } : w)
    }));
  };

  // Asignar preset por puesto
  const handleApplyPreset = (workerId: string, presetPuesto: string) => {
    const preset = JOB_POSITION_PRESETS.find(p => p.puesto === presetPuesto);
    if (!preset) return;

    setSurvey(prev => ({
      ...prev,
      trabajadores: prev.trabajadores.map(w => {
        if (w.id !== workerId) return w;
        return {
          ...w,
          puesto: preset.puesto,
          sector: preset.sector,
          agentesCodigos: preset.agentesSugeridos,
          horasExposicionDiaria: preset.horasDefault
        };
      })
    }));
    toast.success(`Riesgos precargados para ${preset.puesto}`);
  };

  // Toggle de un agente para un trabajador
  const toggleAgentForWorker = (workerId: string, agentCode: string) => {
    setSurvey(prev => ({
      ...prev,
      trabajadores: prev.trabajadores.map(w => {
        if (w.id !== workerId) return w;
        const current = w.agentesCodigos || [];
        const exists = current.includes(agentCode);
        const updated = exists ? current.filter(c => c !== agentCode) : [...current, agentCode];
        return { ...w, agentesCodigos: updated };
      })
    }));
  };

  // Cargar cuadrilla tipo completa
  const handleLoadTypicalCrew = () => {
    const crew: WorkerExposure[] = [
      {
        id: '1',
        cuil: '20-33458912-4',
        nombre: 'Matías Rodríguez',
        puesto: 'Soldador / Armador Metálico',
        sector: 'Taller de Soldadura',
        fechaIngreso: '2020-04-10',
        agentesCodigos: ['80001', '80003', '40001', '90001'],
        horasExposicionDiaria: 8,
        diasExposicionSemanal: 5,
        eppAdecuado: true,
        observaciones: 'Soldadura MIG-MAG en cabina'
      },
      {
        id: '2',
        cuil: '20-36781249-1',
        nombre: 'Esteban Morales',
        puesto: 'Operario de Pintura / Soplete',
        sector: 'Cabina de Pintura',
        fechaIngreso: '2021-08-15',
        agentesCodigos: ['40002', '90001'], // 40002 es cancerígeno Res. 81/19
        horasExposicionDiaria: 6,
        diasExposicionSemanal: 5,
        eppAdecuado: true,
        observaciones: 'Semimáscara c/cartuchos químicos 3M'
      },
      {
        id: '3',
        cuil: '20-31849201-9',
        nombre: 'Gonzalo Fernández',
        puesto: 'Conductor de Autoelevador',
        sector: 'Logística / Almacén',
        fechaIngreso: '2019-11-20',
        agentesCodigos: ['80001', '80005'],
        horasExposicionDiaria: 8,
        diasExposicionSemanal: 5,
        eppAdecuado: true,
        observaciones: 'Control de vibraciones de cuerpo entero'
      },
      {
        id: '4',
        cuil: '20-39401827-6',
        nombre: 'Lucas Benítez',
        puesto: 'Operario de Depósito / Picking',
        sector: 'Expedición',
        fechaIngreso: '2023-02-01',
        agentesCodigos: ['90002', '90003'],
        horasExposicionDiaria: 8,
        diasExposicionSemanal: 5,
        eppAdecuado: true,
        observaciones: 'Levantamiento de cajas de hasta 20kg'
      },
      {
        id: '5',
        cuil: '27-34891024-8',
        nombre: 'Valeria Soria',
        puesto: 'Personal Administrativo / Oficina',
        sector: 'Administración',
        fechaIngreso: '2022-01-10',
        agentesCodigos: [],
        horasExposicionDiaria: 8,
        diasExposicionSemanal: 5,
        eppAdecuado: true,
        observaciones: 'Sin exposición a factores de riesgo'
      }
    ];

    setSurvey(prev => ({ ...prev, trabajadores: crew }));
    toast.success('Cuadrilla tipo con 5 perfiles industriales cargada');
  };

  // Generador inteligente de Conclusiones y Dictamen Técnico
  const handleGenerateConclusion = () => {
    const evalData = evaluateRarProtocolSafety(survey);
    const lines: string[] = [
      `El presente relevamiento de agentes de riesgo comprende a una dotación de ${evalData.totalTrabajadores} trabajadores del establecimiento ${survey.establecimientoNombre || ''}.`,
      `Se identificaron ${evalData.trabajadoresExpuestos} operario(s) con exposición efectiva a factores de riesgo normados en el Decreto 658/96 (${evalData.porcentajeExpuestos}% de la nómina), mientras que ${evalData.trabajadoresNoExpuestos} operarios no presentan exposición nociva.`
    ];

    if (evalData.cancerigenosDetectados.length > 0) {
      lines.push(
        `Se detectó exposición a sustancias y agentes cancerígenos alcanzados por la Resolución S.R.T. N° 81/19 (${evalData.cancerigenosDetectados.map(c => `${c.nombre} [${c.codigo}]`).join(', ')}), por lo que se tramitará la inscripción correspondiente en el Registro SVRC.`
      );
    }

    if (evalData.examenesMedicosConsolidados.length > 0) {
      lines.push(
        `Se remite la presente a la Aseguradora de Riesgos del Trabajo (${survey.artNombre}) para coordinar el cronograma de Exámenes Médicos Periódicos (Res. S.R.T. 37/10), requiriéndose como prioritarios: ${evalData.examenesMedicosConsolidados.slice(0, 3).map(e => `${e.examen} (${e.cantidadTrabajadores} trabajadores)`).join(', ')}.`
      );
    }

    lines.push('Todos los puestos con exposición cuentan con EPP homologado bajo Res. SRT 299/11.');

    setSurvey(prev => ({ ...prev, conclusionTecnica: lines.join('\n\n') }));
    toast.success('Conclusiones técnicas generadas automáticamente');
  };

  // Guardar
  const handleSave = () => {
    if (!survey.razonSocial || !survey.cuit) {
      toast.error('Complete Razón Social y CUIT de la empresa');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('rar_surveys_db') || '[]');
    const toSave: RARSurvey = {
      ...survey,
      updatedAt: new Date().toISOString()
    };

    let updated;
    if (isEdit) {
      updated = saved.map((s: RARSurvey) => s.id === survey.id ? toSave : s);
      toast.success('Nómina RAR actualizada con éxito');
    } else {
      updated = [toSave, ...saved];
      toast.success('Nómina RAR guardada con éxito');
    }

    localStorage.setItem('rar_surveys_db', JSON.stringify(updated));
    navigate('/rar');
  };

  const stats = useMemo(() => calculateRARStats(survey.trabajadores || []), [survey.trabajadores]);
  const evaluation = useMemo(() => evaluateRarProtocolSafety(survey), [survey]);

  return (
    <ModuleFormLayout>
      <ModuleFormToolbar
        onBack={() => navigate('/rar')}
        title={isEdit ? 'Editar Nómina RAR' : 'Nueva Nómina de Expuestos (RAR)'}
        subtitle="Resolución S.R.T. N° 37/10 y Res. S.R.T. N° 81/19 · Exámenes Médicos en Salud"
        icon={<Stethoscope size={22} className="text-emerald-600" />}
      />

      <div className="max-w-5xl mx-auto px-4 pt-4 flex items-center justify-between">
        <div className="text-xs text-slate-500 font-mono">ID: {survey.id}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
          >
            <Eye size={15} />
            <span>{showPreview ? 'Ocultar PDF' : 'Vista Previa PDF'}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save size={15} />
            <span>Guardar Nómina</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Banner Informativo Normativo */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-400/20 text-emerald-300 rounded-lg border border-emerald-400/30">
              <Stethoscope size={28} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Nómina de Expuestos Res. SRT 37/10 y Res. SRT 81/19
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black tracking-wide">
                  EXÁMENES PERIÓDICOS ART
                </span>
              </h2>
              <p className="text-xs text-emerald-100 max-w-2xl">
                Relevamiento oficial de trabajadores y agentes de riesgo (Dec. 658/96) para la coordinación y realización de los Exámenes Médicos Periódicos ante la A.R.T.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLoadTypicalCrew}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles size={14} className="text-amber-300" />
            Cargar Cuadrilla Tipo
          </button>
        </div>

        {/* Resumen en Vivo y Validación de Cumplimiento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/20 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center font-black">
              <span className="text-base leading-none">{stats.porcentajeExpuestos}%</span>
              <span className="text-[7.5px] uppercase tracking-wider opacity-90 mt-0.5">Expuestos</span>
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-900 dark:text-slate-100">
                {stats.trabajadoresExpuestos} de {stats.totalTrabajadores} trabajadores
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                {stats.trabajadoresNoExpuestos} operarios sin agentes declarados
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-900 dark:text-slate-100">
                {evaluation.examenesMedicosConsolidados.length} Estudios Requeridos
              </div>
              <div className="text-[11px] text-slate-500">
                Para coordinar en conjunto con la ART
              </div>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border shadow-xs flex items-center gap-3 ${
            evaluation.requiereRegistroCancerigenos
              ? 'border-rose-300 bg-rose-50/80 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
          }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black ${
              evaluation.requiereRegistroCancerigenos ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="text-xs font-black uppercase">
                {evaluation.requiereRegistroCancerigenos ? 'Registro SVRC Activo' : 'Sin Cancerígenos'}
              </div>
              <div className="text-[11px] opacity-80">
                {evaluation.requiereRegistroCancerigenos
                  ? `${stats.trabajadoresConCancerigenos} operario(s) c/ Res. SRT 81/19`
                  : 'No se detectaron agentes cancerígenos'}
              </div>
            </div>
          </div>
        </div>

        {/* Alertas Normativas si existen desvíos */}
        {evaluation.alertasNormativas.length > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800 dark:text-amber-100">
              <AlertCircle size={16} /> Alertas de Validación para Presentación Electrónica ante la ART:
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {evaluation.alertasNormativas.map((alt, i) => (
                <li key={i}>{alt}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sección 1: Datos de la Empresa y la ART */}
        <ModuleFormSection title="1. Datos del Establecimiento y Aseguradora (A.R.T.)" icon={<Building2 size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Razón Social *</label>
              <input
                type="text"
                value={survey.razonSocial}
                onChange={e => setSurvey(s => ({ ...s, razonSocial: e.target.value }))}
                placeholder="Ej: Metalúrgica San Martín S.A."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">C.U.I.T. Patronal *</label>
              <input
                type="text"
                value={survey.cuit}
                onChange={e => setSurvey(s => ({ ...s, cuit: e.target.value }))}
                placeholder="30-71948210-3"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Aseguradora (A.R.T.) *</label>
              <input
                type="text"
                value={survey.artNombre}
                onChange={e => setSurvey(s => ({ ...s, artNombre: e.target.value }))}
                placeholder="Prevención ART / Provincia ART"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">N° Póliza / Afiliación</label>
              <input
                type="text"
                value={survey.nroPoliza}
                onChange={e => setSurvey(s => ({ ...s, nroPoliza: e.target.value }))}
                placeholder="POL-884910"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Establecimiento / Planta</label>
              <input
                type="text"
                value={survey.establecimientoNombre}
                onChange={e => setSurvey(s => ({ ...s, establecimientoNombre: e.target.value }))}
                placeholder="Planta Principal"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">N° Establecimiento SRT</label>
              <input
                type="text"
                value={survey.establecimientoNumero || '001'}
                onChange={e => setSurvey(s => ({ ...s, establecimientoNumero: e.target.value }))}
                placeholder="001"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dirección y Localidad</label>
              <input
                type="text"
                value={survey.direccion}
                onChange={e => setSurvey(s => ({ ...s, direccion: e.target.value }))}
                placeholder="Ruta 8 Km 60, Pilar, Buenos Aires"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Profesional HyS</label>
              <input
                type="text"
                value={survey.profesionalNombre}
                onChange={e => setSurvey(s => ({ ...s, profesionalNombre: e.target.value }))}
                placeholder="Ing. / Lic. Juan Pérez"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Matrícula Profesional</label>
              <input
                type="text"
                value={survey.profesionalMatricula}
                onChange={e => setSurvey(s => ({ ...s, profesionalMatricula: e.target.value }))}
                placeholder="Mat. COPIME N° 12345"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Representante Legal / Titular</label>
              <input
                type="text"
                value={survey.empleadorResponsable}
                onChange={e => setSurvey(s => ({ ...s, empleadorResponsable: e.target.value }))}
                placeholder="Nombre del Director / Apoderado"
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
          </div>
        </ModuleFormSection>

        {/* Sección 2: Nómina de Trabajadores */}
        <ModuleFormSection title={`2. Nómina de Trabajadores Expuestos (${survey.trabajadores.length})`} icon={<UserPlus size={20} />}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-500">
              Complete los operarios y marque los códigos de agentes SRT aplicables a su tarea.
            </span>
            <button
              type="button"
              onClick={addWorker}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={15} />
              Agregar Trabajador
            </button>
          </div>

          <div className="space-y-4">
            {survey.trabajadores.map((w, idx) => {
              const cuilCheck = validateCuilFormat(w.cuil);
              const workerExams = getRecommendedMedicalExams(w.agentesCodigos || []);

              return (
                <div
                  key={w.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-xs space-y-3"
                >
                  {/* Fila principal del trabajador */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-1 text-center font-mono font-bold text-xs text-slate-400">
                      #{idx + 1}
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">C.U.I.L. *</label>
                      <input
                        type="text"
                        value={w.cuil}
                        onChange={e => updateWorker(w.id, 'cuil', e.target.value)}
                        placeholder="20-35894120-7"
                        className={`w-full px-2 py-1 text-xs font-mono font-bold rounded border ${
                          w.cuil && !cuilCheck.isValid
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                        }`}
                      />
                      {w.cuil && !cuilCheck.isValid && (
                        <span className="text-[10px] text-rose-600 block mt-0.5">
                          {cuilCheck.message}
                        </span>
                      )}
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Apellido y Nombre *</label>
                      <input
                        type="text"
                        value={w.nombre}
                        onChange={e => updateWorker(w.id, 'nombre', e.target.value)}
                        placeholder="Pérez, Juan Carlos"
                        className="w-full px-2 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Preset Rápido de Puesto</label>
                      <select
                        value={w.puesto}
                        onChange={e => handleApplyPreset(w.id, e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold"
                      >
                        <option value="">-- Asignar Preset --</option>
                        {JOB_POSITION_PRESETS.map(p => (
                          <option key={p.puesto} value={p.puesto}>{p.puesto}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {survey.trabajadores.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWorker(w.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Eliminar de la nómina"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fila secundaria: Puesto, Sector, Horas y EPP */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Puesto Específico:</span>
                      <input
                        type="text"
                        value={w.puesto}
                        onChange={e => updateWorker(w.id, 'puesto', e.target.value)}
                        placeholder="Soldador TIG"
                        className="w-full p-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Sector / Área:</span>
                      <input
                        type="text"
                        value={w.sector}
                        onChange={e => updateWorker(w.id, 'sector', e.target.value)}
                        placeholder="Taller Metalúrgico"
                        className="w-full p-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Exposición Diaria:</span>
                      <select
                        value={w.horasExposicionDiaria}
                        onChange={e => updateWorker(w.id, 'horasExposicionDiaria', parseInt(e.target.value) || 8)}
                        className="w-full p-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      >
                        <option value={8}>8 horas diarias (Jornada completa)</option>
                        <option value={6}>6 horas diarias (Insalubre / Turno)</option>
                        <option value={4}>4 horas diarias (Parcial)</option>
                        <option value={2}>2 horas diarias (Ocasional)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={w.eppAdecuado}
                          onChange={e => updateWorker(w.id, 'eppAdecuado', e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">EPP Res. 299/11</span>
                      </label>
                    </div>
                  </div>

                  {/* Selector de Agentes de Riesgo SRT */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Agentes de Riesgo SRT Declarados (Haga clic para activar/desactivar):
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {w.agentesCodigos.length} activos
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {SRT_RISK_AGENTS_CATALOG.map(ag => {
                        const isActive = (w.agentesCodigos || []).includes(ag.codigo);
                        return (
                          <button
                            key={ag.codigo}
                            type="button"
                            onClick={() => toggleAgentForWorker(w.id, ag.codigo)}
                            className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                              isActive
                                ? ag.esCancerigeno
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                            title={`${ag.nombre} (${ag.criterioExposicion})`}
                          >
                            <span className="font-mono font-bold text-[9.5px]">{ag.codigo}</span>
                            <span>{ag.nombre.split('(')[0]}</span>
                            {ag.esCancerigeno && <span title="Cancerígeno Res. SRT 81/19">☣️</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Batería de Estudios Periódicos para este operario */}
                  {workerExams.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <Stethoscope size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">Estudios Periódicos Requeridos: </span>
                        <span>{workerExams.join(' · ')}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ModuleFormSection>

        {/* Sección 3: Conclusiones y Dictamen Técnico */}
        <ModuleFormSection title="3. Conclusiones y Dictamen Técnico ante la ART" icon={<FileCheck2 size={20} />}>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Dictamen para la coordinación de exámenes periódicos y remisión a la ART.
              </span>
              <button
                type="button"
                onClick={handleGenerateConclusion}
                className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Wand2 size={14} /> Redactar Conclusiones Automáticas
              </button>
            </div>
            <textarea
              rows={4}
              value={survey.conclusionTecnica || ''}
              onChange={e => setSurvey(s => ({ ...s, conclusionTecnica: e.target.value }))}
              placeholder="Dictamen técnico y detalle de la presentación ante la Aseguradora de Riesgos del Trabajo..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-sans"
            />
          </div>
        </ModuleFormSection>

        {/* Vista previa integrada en modal/colapsable */}
        {showPreview && (
          <div className="mt-8 border-t-2 border-slate-300 dark:border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye size={18} className="text-emerald-500" /> Vista Previa de la Planilla Oficial RAR PDF (Res. SRT 37/10)
              </h3>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={15} /> Imprimir / Exportar PDF
              </button>
            </div>
            <div className="bg-slate-200 dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700 overflow-x-auto shadow-inner">
              <RARPdf data={survey} />
            </div>
          </div>
        )}

        {/* Barra de Acciones Flotante */}
        <ModuleActionBar
          actions={[
            {
              id: 'cancel',
              label: 'Volver',
              icon: <ArrowLeft size={16} />,
              variant: 'secondary',
              onClick: () => navigate('/rar')
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
              label: isEdit ? 'Actualizar Nómina' : 'Guardar Nómina RAR',
              icon: <Save size={16} />,
              variant: 'primary',
              onClick: handleSave
            }
          ]}
        />
      </div>
    </ModuleFormLayout>
  );
}

