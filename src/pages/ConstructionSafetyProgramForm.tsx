import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardHat, ArrowLeft, Save, Building,
  ShieldCheck, AlertTriangle, FileText, CheckCircle2, ChevronRight,
  Eye, Printer, X, ZoomIn, ZoomOut, RotateCcw, Plus, Trash2, Wrench, GraduationCap, Camera, PenTool
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import PhotoAttachments from '../components/PhotoAttachments';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import {
  ConstructionProgramData,
  DEFAULT_CONSTRUCTION_STAGES,
  ConstructionStage,
  CAUSALES_CATALOG,
  DEFAULT_REQUIRED_PPE,
  DEFAULT_TRAINING_PLAN,
  DEFAULT_OBRADOR_INFRA,
  ConstructionReasons
} from '../data/constructionSafetyData';
import { printElementAsDocument } from '../utils/pdfHelper';
import ConstructionSafetyProgramPdf from '../components/ConstructionSafetyProgramPdf';
import toast from 'react-hot-toast';

export default function ConstructionSafetyProgramForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const [step, setStep] = useState<number>(1);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 0.45 : 1));
  const [programNumber] = useState(`OBRA-${Date.now().toString().slice(-6)}`);
  const [avisoObraNumber, setAvisoObraNumber] = useState('');
  const [resolutionType, setResolutionType] = useState<'res_51_97' | 'res_35_98' | 'res_319_99'>('res_51_97');

  const [contractorName, setContractorName] = useState(activeCompany?.name || '');
  const [contractorCuit, setContractorCuit] = useState(activeCompany?.cuit || '');
  const [artName, setArtName] = useState(activeCompany?.art || '');
  const [comitenteName, setComitenteName] = useState('');
  const [comitenteCuit, setComitenteCuit] = useState('');
  const [directorObraName, setDirectorObraName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Buenos Aires');
  const [siteSurfaceM2, setSiteSurfaceM2] = useState<number>(500);
  const [estimatedWorkers, setEstimatedWorkers] = useState<number>(15);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedDurationMonths, setEstimatedDurationMonths] = useState<number>(6);
  const [workType, setWorkType] = useState<'edificacion' | 'infraestructura' | 'demolicion' | 'montaje_industrial' | 'mantenimiento_319' | 'otra'>('edificacion');

  // Causales Res. SRT 51/97, 550/11, 503/14, 35/98
  const [reasons, setReasons] = useState<ConstructionReasons>({
    excavationDeep: true,
    heightWork: true,
    demolition: false,
    largeSurface: false,
    highVoltage: false,
    confinedSpacesOrTunnels: false,
    submuracionApuntalamiento: false,
    movimientoSuelos503: true,
    liftingAndCranes: false,
    subcontractorsCoordination: false
  });

  // Etapas constructivas
  const [stages, setStages] = useState<ConstructionStage[]>(DEFAULT_CONSTRUCTION_STAGES);
  const [newStageName, setNewStageName] = useState('');
  const [newStageNorm, setNewStageNorm] = useState('Dec. 911/96');
  const [newStageRisk, setNewStageRisk] = useState('');
  const [newStageMeasure, setNewStageMeasure] = useState('');

  // EPP, Capacitación, Infraestructura de Obrador y Fotos Generales
  const [requiredPpe, setRequiredPpe] = useState<string[]>(DEFAULT_REQUIRED_PPE);
  const [trainingPlan, setTrainingPlan] = useState<string[]>(DEFAULT_TRAINING_PLAN);
  const [obradorInfra] = useState<string[]>(DEFAULT_OBRADOR_INFRA);
  const [sitePhotos, setSitePhotos] = useState<string[]>([]);

  // Servicio de HyS
  const [professionalName, setProfessionalName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [weeklyVisitHours, setWeeklyVisitHours] = useState<number>(5);
  const [emergencyClinic, setEmergencyClinic] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('0800-333-1234');
  const [meetingPoint, setMeetingPoint] = useState('Acceso principal de obra / Sector señalizado');
  const [notes, setNotes] = useState('');

  // Firmas Digitales (Formato ATS con Firma Profesional en el Medio)
  const [operatorSignature, setOperatorSignature] = useState<string>('');
  const [professionalSignature, setProfessionalSignature] = useState<string>('');
  const [professionalStamp, setProfessionalStamp] = useState<string>('');
  const [supervisorSignature, setSupervisorSignature] = useState<string>('');
  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    professional: true,
    supervisor: true
  });

  useEffect(() => {
    try {
      const lsPersonal = localStorage.getItem('personalData');
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        if (pd.name || pd.fullName) setProfessionalName(prev => prev || pd.name || pd.fullName);
        if (pd.license || pd.matricula) setEnrollmentNumber(prev => prev || pd.license || pd.matricula);
      }
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        if (parsed.signature) setProfessionalSignature(parsed.signature);
        if (parsed.stamp) setProfessionalStamp(parsed.stamp);
      } else if (legacySig) {
        setProfessionalSignature(legacySig);
      }
    } catch {}
  }, []);

  const toggleStage = (id: string) => {
    setStages(prev => prev.map(s => (s.id === id ? { ...s, included: !s.included } : s)));
  };

  const updateStagePhotos = (id: string, photos: string[]) => {
    setStages(prev => prev.map(s => (s.id === id ? { ...s, photos } : s)));
  };

  const handleAddCustomStage = () => {
    if (!newStageName.trim()) {
      toast.error('Ingresa el nombre de la etapa constructiva.');
      return;
    }
    const customStage: ConstructionStage = {
      id: `stage_custom_${Date.now()}`,
      name: `${stages.length + 1}. ${newStageName.trim()}`,
      risks: newStageRisk.trim() ? [newStageRisk.trim()] : ['Riesgo operativo propio de la tarea en obra'],
      preventiveMeasures: newStageMeasure.trim() ? [newStageMeasure.trim()] : ['Supervisión técnica permanente y uso obligatorio de EPP'],
      applicableStandards: newStageNorm.trim() || 'Dec. 911/96',
      included: true,
      photos: []
    };
    setStages(prev => [...prev, customStage]);
    setNewStageName('');
    setNewStageRisk('');
    setNewStageMeasure('');
    toast.success('Etapa constructiva agregada al programa');
  };

  const togglePpeItem = (item: string) => {
    setRequiredPpe(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleTrainingItem = (item: string) => {
    setTrainingPlan(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const selectAllReasons = (val: boolean) => {
    const next: any = {};
    CAUSALES_CATALOG.forEach(c => {
      next[c.id] = val;
    });
    setReasons(next);
  };

  const activeReasonsCount = CAUSALES_CATALOG.filter(c => (reasons as any)[c.id]).length;
  const activeStagesCount = stages.filter(s => s.included).length;

  const handleSave = () => {
    if (!contractorName.trim() || !siteAddress.trim() || !professionalName.trim()) {
      toast.error('Completa los campos obligatorios (Contratista, Dirección de Obra y Profesional HyS).');
      return;
    }

    const newProgram: ConstructionProgramData = {
      id: `prog_${Date.now()}`,
      companyId: activeCompany?.id,
      programNumber,
      avisoObraNumber,
      resolutionType,
      contractorName,
      contractorCuit,
      artName,
      comitenteName,
      comitenteCuit,
      directorObraName,
      siteAddress,
      city,
      province,
      siteSurfaceM2,
      estimatedWorkers,
      startDate,
      estimatedDurationMonths,
      workType,
      reasons,
      stages,
      requiredPpe,
      trainingPlan,
      obradorInfra,
      sitePhotos,
      hygieneService: {
        professionalName,
        enrollmentNumber,
        weeklyVisitHours,
        emergencyClinic,
        emergencyPhone,
        meetingPoint
      },
      operatorSignature,
      professionalSignature,
      professionalStamp,
      supervisorSignature,
      showSignatures,
      notes,
      status: 'submitted_to_art',
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem('construction_safety_programs_db');
    let list: ConstructionProgramData[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) {}
    }
    list.unshift(newProgram);
    localStorage.setItem('construction_safety_programs_db', JSON.stringify(list));

    toast.success('Programa de seguridad de obra confeccionado con éxito');
    navigate('/construction-safety-program');
  };

  const currentProgramData: ConstructionProgramData = {
    id: 'prog_draft',
    companyId: activeCompany?.id,
    programNumber,
    avisoObraNumber,
    resolutionType,
    contractorName: contractorName || 'Constructora',
    contractorCuit: contractorCuit || '30-00000000-0',
    artName,
    comitenteName: comitenteName || 'Comitente',
    comitenteCuit,
    directorObraName,
    siteAddress: siteAddress || 'Dirección de Obra',
    city,
    province,
    siteSurfaceM2,
    estimatedWorkers,
    startDate,
    estimatedDurationMonths,
    workType,
    reasons,
    stages,
    requiredPpe,
    trainingPlan,
    obradorInfra,
    sitePhotos,
    hygieneService: {
      professionalName: professionalName || 'Profesional H&S',
      enrollmentNumber,
      weeklyVisitHours,
      emergencyClinic,
      emergencyPhone,
      meetingPoint
    },
    operatorSignature,
    professionalSignature,
    professionalStamp,
    supervisorSignature,
    showSignatures,
    notes,
    status: 'submitted_to_art',
    createdAt: new Date().toISOString()
  };

  return (
    <AnimatedPage>
      <div
        className="container pb-24 min-h-screen flex flex-col"
        style={{ paddingTop: '7rem' }}
      >
        <PremiumHeader
          title="Confección de Programa de Seguridad de Obra"
          subtitle="Generador reglamentario para presentación formal ante la ART bajo Decreto 911/96 y Resoluciones SRT 51/97, 35/98, 319/99, 550/11 y 503/14"
          badge="Dec. 911/96 & Res. SRT"
          icon={<HardHat size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)"
          onBack={() => navigate('/construction-safety-program')}
        />

        <div className="max-w-4xl w-full mx-auto mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <button
              type="button"
              onClick={() => navigate('/construction-safety-program')}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-amber-500 text-xs font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} /> Volver al listado de programas
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Eye size={15} /> Vista Previa A4 en Vivo
              </button>
              <button
                type="button"
                onClick={() => printElementAsDocument('pdf-construction-program-form', `Programa_Seguridad_${contractorName || 'Obra'}`)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer size={15} /> Imprimir / PDF
              </button>
            </div>
          </div>

          {/* Indicador de Pasos Interactivo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 bg-white dark:bg-slate-800/90 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            {[
              { num: 1, label: 'Datos de Obra', sub: 'Comitente y ART' },
              { num: 2, label: 'Aviso y Causales', sub: `${activeReasonsCount} seleccionadas` },
              { num: 3, label: 'Etapas y Riesgos', sub: `${activeStagesCount} etapas activas` },
              { num: 4, label: 'Servicio HyS y EPP', sub: 'Capacitación y Firma' }
            ].map(s => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setStep(s.num)}
                  style={{ padding: '0.6rem 0.75rem' }}
                  className={`flex items-center gap-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-md shadow-amber-500/20'
                      : isDone
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/70 hover:border-amber-500/40'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      isActive
                        ? 'bg-white text-amber-600'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isDone ? '✓' : s.num}
                  </span>
                  <div className="min-w-0">
                    <div className={`text-xs font-extrabold truncate ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                      {s.label}
                    </div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {s.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ==================== STEP 1: DATOS DE LA OBRA ==================== */}
          {step === 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Building className="text-amber-500" size={20} />
                  1. Encuadre Normativo, Sujetos Intervinientes y Datos de la Obra
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Definí el tipo de programa según resolución SRT y completá los datos del contratista, comitente y ubicación.
                </p>
              </div>

              {/* Selector de Encuadre SRT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                  Encuadre Reglamentario del Programa (SRT) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'res_51_97',
                      title: 'Resolución SRT 51/97',
                      desc: 'Contratista Principal o Empleador en Obra de Construcción'
                    },
                    {
                      id: 'res_35_98',
                      title: 'Resolución SRT 35/98',
                      desc: 'Programa Único de Obra (Comitente / Coordinación de Subcontratistas)'
                    },
                    {
                      id: 'res_319_99',
                      title: 'Resolución SRT 319/99',
                      desc: 'Obras Repetitivas y de Corta Duración (hasta 7 días corridos)'
                    }
                  ].map(opt => {
                    const active = resolutionType === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setResolutionType(opt.id as any)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          active
                            ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">{opt.title}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${active ? 'bg-amber-500 border-amber-500 text-white font-bold' : 'border-slate-400'}`}>
                            {active ? '✓' : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 leading-snug">{opt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Empresa Constructora / Contratista *
                  </label>
                  <input
                    type="text"
                    value={contractorName}
                    onChange={e => setContractorName(e.target.value)}
                    placeholder="Razón Social del Constructor"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    CUIT del Contratista
                  </label>
                  <input
                    type="text"
                    value={contractorCuit}
                    onChange={e => setContractorCuit(e.target.value)}
                    placeholder="30-XXXXXXXX-X"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Aseguradora de Riesgos del Trabajo (ART)
                  </label>
                  <input
                    type="text"
                    value={artName}
                    onChange={e => setArtName(e.target.value)}
                    placeholder="Ej. Prevención ART, Provincia ART, Asociart..."
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    N° de Aviso de Obra ART (Opcional)
                  </label>
                  <input
                    type="text"
                    value={avisoObraNumber}
                    onChange={e => setAvisoObraNumber(e.target.value)}
                    placeholder="Ej. AO-2026-004891"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Comitente / Propietario de la Obra *
                  </label>
                  <input
                    type="text"
                    value={comitenteName}
                    onChange={e => setComitenteName(e.target.value)}
                    placeholder="Persona física o jurídica contratante"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    CUIT del Comitente
                  </label>
                  <input
                    type="text"
                    value={comitenteCuit}
                    onChange={e => setComitenteCuit(e.target.value)}
                    placeholder="30-XXXXXXXX-X"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Director de Obra / Representante Técnico
                  </label>
                  <input
                    type="text"
                    value={directorObraName}
                    onChange={e => setDirectorObraName(e.target.value)}
                    placeholder="Arq. / Ing. Director de Obra"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tipología Constructiva
                  </label>
                  <select
                    value={workType}
                    onChange={e => setWorkType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="edificacion">Edificación Civil / Vivienda / Comercial</option>
                    <option value="infraestructura">Obra Vial / Infraestructura / Redes</option>
                    <option value="montaje_industrial">Montaje Industrial / Naves Metálicas</option>
                    <option value="demolicion">Demolición y Movimiento de Suelos</option>
                    <option value="mantenimiento_319">Mantenimiento / Corta Duración (Res. 319/99)</option>
                    <option value="otra">Otra Obra de Ingeniería</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Dirección Exacta y Ubicación de la Obra *
                  </label>
                  <input
                    type="text"
                    value={siteAddress}
                    onChange={e => setSiteAddress(e.target.value)}
                    placeholder="Calle, Número, Lote, Parque Industrial o Kilómetro de Ruta"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Localidad / Partido
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Ej. Tigre, La Plata, Rosario, Córdoba"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Provincia / Jurisdicción
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Superficie Cubierta / Intervenida Estimada (m²)
                  </label>
                  <input
                    type="number"
                    value={siteSurfaceM2}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setSiteSurfaceM2(val);
                      if (val > 1000) {
                        setReasons(prev => ({ ...prev, largeSurface: true }));
                      }
                    }}
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Personal Estimado en Pico de Obra (Operarios)
                  </label>
                  <input
                    type="number"
                    value={estimatedWorkers}
                    onChange={e => setEstimatedWorkers(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Fecha Probable de Inicio de Obra
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Plazo de Ejecución Estimado (Meses)
                  </label>
                  <input
                    type="number"
                    value={estimatedDurationMonths}
                    onChange={e => setEstimatedDurationMonths(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  Siguiente: Aviso y Causales <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 2: CAUSALES DE AVISO DE OBRA ==================== */}
          {step === 2 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" size={20} />
                    2. Causales de Aviso de Obra y Exigibilidad (Res. SRT 51/97, 550/11 & 503/14)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hacé clic sobre cada condición presente en la obra para incluir su exigencia legal y técnica en el Programa:
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {activeReasonsCount} de {CAUSALES_CATALOG.length} activas
                  </span>
                  <button
                    type="button"
                    onClick={() => selectAllReasons(true)}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                    className="rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white font-bold transition-colors cursor-pointer"
                  >
                    Marcar todas
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAllReasons(false)}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                    className="rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-500 hover:text-white font-bold transition-colors cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {CAUSALES_CATALOG.map(item => {
                  const isSelected = Boolean((reasons as any)[item.id]);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setReasons(prev => ({ ...prev, [item.id]: !(prev as any)[item.id] }))}
                      className={`group relative rounded-2xl p-4 cursor-pointer transition-all duration-200 select-none ${
                        isSelected
                          ? 'border-2 border-amber-500 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-emerald-500/10 dark:from-amber-500/20 dark:via-slate-800 dark:to-emerald-950/30 shadow-lg shadow-amber-500/10 scale-[1.005]'
                          : 'border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:border-amber-500/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Icono Checkbox Visual de Alto Contraste */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-amber-500 to-emerald-500 text-white shadow-md shadow-amber-500/30 scale-105'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 group-hover:border group-hover:border-amber-400'
                          }`}
                        >
                          <CheckCircle2 size={18} strokeWidth={isSelected ? 2.8 : 1.8} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <span
                              className={`text-xs sm:text-sm font-extrabold transition-colors ${
                                isSelected
                                  ? 'text-amber-600 dark:text-amber-300'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {item.label}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                  isSelected
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-200 border-amber-500/40'
                                    : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-transparent'
                                }`}
                              >
                                {item.norm}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isSelected
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : 'bg-slate-200 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {isSelected ? '✓ Incluida' : 'No aplica'}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 m-0 leading-relaxed">
                            {item.desc}
                          </p>

                          {/* Bloque desplegable con la exigencia técnica cuando está activa */}
                          {isSelected && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                              <ShieldCheck size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <strong className="font-extrabold uppercase tracking-wide text-[10px] text-emerald-600 dark:text-emerald-400 block">
                                  Medida Reglamentaria Incorporada al PDF:
                                </strong>
                                <span>{item.requirement}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  Siguiente: Etapas y Riesgos <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 3: ETAPAS CONSTRUCTIVAS ==================== */}
          {step === 3 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="text-amber-500" size={20} />
                    3. Matriz de Etapas Constructivas, Riesgos y Medidas Preventivas
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hacé clic para activar o desactivar las etapas que integran el cronograma de obra:
                  </p>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                  {activeStagesCount} de {stages.length} etapas incluidas
                </span>
              </div>

              <div className="space-y-4">
                {stages.map(st => (
                  <div
                    key={st.id}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      st.included
                        ? 'border-amber-500/80 bg-amber-500/5 dark:bg-amber-950/15 shadow-md'
                        : 'border-slate-200 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-900/30 opacity-65 hover:opacity-95'
                    }`}
                  >
                    <div
                      onClick={() => toggleStage(st.id)}
                      className="flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            st.included
                              ? 'bg-amber-500 text-white font-bold shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                          }`}
                        >
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {st.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                          {st.applicableStandards}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            st.included
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {st.included ? 'Activa' : 'Omitida'}
                        </span>
                      </div>
                    </div>

                    {st.included && (
                      <div className="mt-3.5 space-y-3 pl-2 sm:pl-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-rose-500/10 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-500/30">
                            <strong className="text-rose-700 dark:text-rose-300 block mb-1.5 text-[11px] uppercase tracking-wider">
                              ⚠️ Riesgos Identificados:
                            </strong>
                            <ul className="list-disc pl-4 text-slate-700 dark:text-slate-200 space-y-1 text-[11px]">
                              {st.risks.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-emerald-500/10 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30">
                            <strong className="text-emerald-700 dark:text-emerald-300 block mb-1.5 text-[11px] uppercase tracking-wider">
                              🛡️ Medidas Preventivas Obligatorias:
                            </strong>
                            <ul className="list-disc pl-4 text-slate-700 dark:text-slate-200 space-y-1 text-[11px]">
                              {st.preventiveMeasures.map((m, i) => (
                                <li key={i}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Fotos de la Etapa Constructiva */}
                        <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80">
                          <PhotoAttachments
                            photos={st.photos || []}
                            onChange={newPhotos => updateStagePhotos(st.id, newPhotos)}
                            maxPhotos={4}
                            label={`Fotos de Evidencia — ${st.name}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Agregar Etapa Constructiva Personalizada */}
              <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Plus size={15} className="text-amber-500" />
                  Agregar Etapa o Tarea Específica Personalizada
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={newStageName}
                    onChange={e => setNewStageName(e.target.value)}
                    placeholder="Nombre de la etapa (ej. Pilotaje profundo / Montaje de ascensor)"
                    className="text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={newStageNorm}
                    onChange={e => setNewStageNorm(e.target.value)}
                    placeholder="Norma aplicable (ej. Dec. 911/96)"
                    className="text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={newStageRisk}
                    onChange={e => setNewStageRisk(e.target.value)}
                    placeholder="Riesgo principal de esta etapa"
                    className="text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={newStageMeasure}
                    onChange={e => setNewStageMeasure(e.target.value)}
                    placeholder="Medida preventiva obligatoria"
                    className="text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomStage}
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Incorporar Etapa al Programa
                </button>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  Siguiente: Servicio HyS y EPP <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 4: SERVICIO HYS, EPP, CAPACITACION Y GUARDADO ==================== */}
          {step === 4 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="text-amber-500" size={20} />
                  4. Servicio de Higiene y Seguridad, EPP, Capacitaciones y Cierre
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Completá los datos del profesional actuante, centro médico ART, nómina de EPP, fotos de relevamiento y plan de capacitación.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Profesional de HyS Responsable *
                  </label>
                  <input
                    type="text"
                    value={professionalName}
                    onChange={e => setProfessionalName(e.target.value)}
                    placeholder="Nombre y Apellido del Licenciado / Ingeniero"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Matrícula Profesional / Registro Habilitante *
                  </label>
                  <input
                    type="text"
                    value={enrollmentNumber}
                    onChange={e => setEnrollmentNumber(e.target.value)}
                    placeholder="Ej. Mat. COPIME 12345 / CPSH / CIE"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Horas Semanales de Visita en Obra (Res. SRT 231/96 Art. 2)
                  </label>
                  <input
                    type="number"
                    value={weeklyVisitHours}
                    onChange={e => setWeeklyVisitHours(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Sugerido según Res. 231/96 para {estimatedWorkers} operarios: {estimatedWorkers <= 15 ? '3 a 5 hs/sem' : estimatedWorkers <= 50 ? '5 a 10 hs/sem' : '10 a 20 hs/sem'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Centro Médico Asistencial ART para Urgencias
                  </label>
                  <input
                    type="text"
                    value={emergencyClinic}
                    onChange={e => setEmergencyClinic(e.target.value)}
                    placeholder="Clínica / Sanatorio de derivación rápida"
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Teléfono de Emergencias Médicas ART (24 hs)
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Punto de Encuentro de Evacuación en Obra
                  </label>
                  <input
                    type="text"
                    value={meetingPoint}
                    onChange={e => setMeetingPoint(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Selección de EPP Obligatorios y Plan de Capacitación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Wrench size={15} className="text-amber-500" />
                    EPP Obligatorios en Obra (Res. SRT 299/11)
                  </h3>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {DEFAULT_REQUIRED_PPE.map((item, idx) => {
                      const active = requiredPpe.includes(item);
                      return (
                        <div
                          key={idx}
                          onClick={() => togglePpeItem(item)}
                          className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 cursor-pointer transition-all ${
                            active
                              ? 'border-amber-500/60 bg-amber-500/10 text-slate-900 dark:text-slate-100 font-semibold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${active ? 'text-amber-500' : 'text-slate-400'}`} />
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-emerald-500" />
                    Plan de Capacitación en Obra (Dec. 911/96)
                  </h3>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {DEFAULT_TRAINING_PLAN.map((item, idx) => {
                      const active = trainingPlan.includes(item);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleTrainingItem(item)}
                          className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 cursor-pointer transition-all ${
                            active
                              ? 'border-emerald-500/60 bg-emerald-500/10 text-slate-900 dark:text-slate-100 font-semibold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${active ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Relevamiento Fotográfico General de Predio, Obrador y Croquis */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                <PhotoAttachments
                  photos={sitePhotos}
                  onChange={setSitePhotos}
                  maxPhotos={6}
                  label="Relevamiento Fotográfico de Predio, Obrador, Vallado y Croquis"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Observaciones Técnicas Particulares y Compromiso de Cumplimiento
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Detalles sobre subcontratistas, permisos de trabajo diarios (ATS), coordinación de gremios o requerimientos específicos del comitente..."
                  className="w-full text-xs px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* ── Bloque de Firmas Digitales Formato ATS (con la Firma del Profesional en el Medio) ── */}
              <div className="pt-5 border-t-2 border-slate-200 dark:border-slate-700 space-y-5">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                    <PenTool size={16} className="text-emerald-500" />
                    <span>Incluir Firmas Digitales en el Documento (Formato ATS)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'operator' as const, label: 'Contratista / Empleador (Izq.)' },
                      { key: 'professional' as const, label: 'Profesional HyS (Centro ⭐)' },
                      { key: 'supervisor' as const, label: 'Director de Obra / Comitente (Der.)' }
                    ].map(({ key, label }) => {
                      const active = showSignatures[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setShowSignatures(prev => ({ ...prev, [key]: !prev[key] }))}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <CheckCircle2 size={14} className={active ? 'text-emerald-500' : 'text-slate-400'} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Paneles de Dibujo Digital (Orden: Izquierda = Contratista, Centro = Profesional HyS, Derecha = Director/Comitente) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  {showSignatures.operator && (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col justify-between">
                      <SignatureCanvas
                        label={`Firma Contratista (${contractorName || 'Empleador'})`}
                        initialImage={operatorSignature || null}
                        onSave={sig => setOperatorSignature(sig || '')}
                      />
                    </div>
                  )}

                  {showSignatures.professional && (
                    <div className="p-3 rounded-xl border-2 border-emerald-500/70 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-md flex flex-col justify-between relative">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white self-center mb-2">
                        ⭐ Firma Central • Profesional H&S
                      </span>
                      <SignatureCanvas
                        label={`Firma Profesional HyS (${professionalName || 'Responsable HyS'})`}
                        initialImage={professionalSignature || null}
                        onSave={sig => setProfessionalSignature(sig || '')}
                      />
                    </div>
                  )}

                  {showSignatures.supervisor && (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col justify-between">
                      <SignatureCanvas
                        label={`Firma Director de Obra / Comitente (${directorObraName || comitenteName || 'Dirección'})`}
                        initialImage={supervisorSignature || null}
                        onSave={sig => setSupervisorSignature(sig || '')}
                      />
                    </div>
                  )}
                </div>

                {/* Vista Previa en Vivo del Bloque de Firmas ATS */}
                <div className="p-4 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-inner">
                  <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-center mb-1">
                    Vista Previa del Bloque de Firmas en el PDF (Firma del Profesional Ubicada en el Medio)
                  </div>
                  <PdfSignatures
                    data={currentProgramData}
                    compact={true}
                    hideFooter={true}
                    box1={{
                      title: 'RESPONSABLE CONTRATISTA / EMPLEADOR',
                      subtitle: (contractorName || 'Representante Empleador').toUpperCase(),
                      signatureUrl: operatorSignature || null,
                      isProfessional: false,
                      license: contractorCuit || undefined
                    }}
                    box2={{
                      title: 'PROFESIONAL DE HIGIENE Y SEGURIDAD',
                      subtitle: (professionalName || 'Firma y Sello Profesional').toUpperCase(),
                      signatureUrl: professionalSignature || null,
                      stampUrl: professionalStamp || null,
                      isProfessional: true,
                      license: enrollmentNumber || 'A designar'
                    }}
                    box3={{
                      title: 'DIRECTOR DE OBRA / SUPERVISIÓN COMITENTE',
                      subtitle: (directorObraName || comitenteName || 'Dirección de Obra').toUpperCase(),
                      signatureUrl: supervisorSignature || null,
                      isProfessional: false,
                      license: artName ? `ART ${artName}` : undefined
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Anterior
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <Eye size={16} /> Previa A4
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      printElementAsDocument('pdf-construction-program-form', `Programa_Seguridad_${contractorName || 'Obra'}`);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <Printer size={16} /> Imprimir / PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-colors cursor-pointer"
                  >
                    <Save size={16} /> Finalizar y Guardar Programa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Previsualización A4 Realista */}
        {previewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-[960px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700/80 bg-slate-800/90 select-none">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                      Vista Previa A4 • Programa de Seguridad de Obra
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                      {contractorName || 'Constructora'} • Decreto 911/96 & Res. SRT 51/97, 35/98, 319/99
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1 bg-slate-700/60 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.max(0.35, z - 0.1))}
                      className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                      title="Reducir Zoom"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span className="text-[11px] font-bold px-1.5 min-w-[38px] text-center text-slate-200">
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.min(1.5, z + 0.1))}
                      className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                      title="Aumentar Zoom"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(typeof window !== 'undefined' && window.innerWidth < 640 ? 0.45 : 1)}
                      className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                      title="Restablecer Zoom"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => printElementAsDocument('pdf-construction-program-preview', `Programa_Seguridad_${contractorName || 'Obra'}`)}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Printer size={15} /> <span className="hidden sm:inline">Imprimir / </span>Guardar PDF
                    </button>
                    <button
                      onClick={() => setPreviewModalOpen(false)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                      title="Cerrar vista previa"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-2 sm:p-6 bg-slate-950/70 flex justify-center items-start">
                <div
                  style={{
                    zoom: previewZoom,
                    transformOrigin: 'top center'
                  }}
                  className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300"
                >
                  <ConstructionSafetyProgramPdf
                    data={currentProgramData}
                    customId="pdf-construction-program-preview"
                  />
                </div>
              </div>

              <div className="px-4 sm:px-6 py-3 border-t border-slate-700/80 bg-slate-800/90 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate">Normativa Oficial SRT • Dec. 911/96, Res. 51/97, 35/98, 319/99, 550/11 y 503/14</span>
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenedor Offscreen para Impresión Directa */}
        <div className="ats-pdf-offscreen">
          <ConstructionSafetyProgramPdf
            data={currentProgramData}
            customId="pdf-construction-program-form"
          />
        </div>
      </div>
    </AnimatedPage>
  );
}
