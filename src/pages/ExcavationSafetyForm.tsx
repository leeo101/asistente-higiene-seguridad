import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pickaxe, ArrowLeft, Save, AlertTriangle, ShieldCheck,
  CheckCircle2, Check, Printer, Download, Eye, Share2,
  User, Calendar, MapPin, Layers, Ruler, ShieldAlert,
  Clock, X, Pencil, Award, FileText
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import ExcavationPdf from '../components/ExcavationPdf';
import ShareModal from '../components/ShareModal';
import { printElementAsDocument } from '../utils/pdfHelper';
import { safeGetLocalStorage } from '../utils/storageHelper';
import { ExcavationPermitData, SOIL_TYPES_INFO } from '../data/excavationData';
import toast from 'react-hot-toast';

export default function ExcavationSafetyForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  // Estados del permiso
  const [permitNumber] = useState(`EXC-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [projectOrSite, setProjectOrSite] = useState(activeCompany?.name || '');
  const [depthMeters, setDepthMeters] = useState<number>(1.5);
  const [widthMeters, setWidthMeters] = useState<number>(1.0);
  const [lengthMeters, setLengthMeters] = useState<number>(10.0);
  const [soilType, setSoilType] = useState<'A' | 'B' | 'C'>('B');
  const [shoringType, setShoringType] = useState<any>('trench_box');

  // Puntos críticos de control en terreno (Dec. 911/96 y Res. SRT 550/11)
  const [checklist, setChecklist] = useState({
    utilitiesLocated: true,
    soilClassificationVerified: true,
    spoilDistance1m: true,
    safeAccessLadders7m: true,
    machineryDistanceSafe: true,
    perimeterBarricades: true,
    waterControlInstalled: false,
    atmosphereTested: false
  });

  // Datos de responsables
  const [operatorName, setOperatorName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [competentPersonName, setCompetentPersonName] = useState('');
  const [notes, setNotes] = useState('');

  // Firmas táctiles / digitales
  const [operatorSig, setOperatorSig] = useState<string | null>(null);
  const [supervisorSig, setSupervisorSig] = useState<string | null>(null);
  const [competentSig, setCompetentSig] = useState<string | null>(null);

  // Perfil del profesional heredado de localStorage (igual que en ATS)
  const [professionalName, setProfessionalName] = useState('');
  const [professionalLicense, setProfessionalLicense] = useState('');
  const [professionalRole, setProfessionalRole] = useState('Profesional de Higiene y Seguridad');
  const [professionalSignature, setProfessionalSignature] = useState<string | null>(null);
  const [professionalStamp, setProfessionalStamp] = useState<string | null>(null);

  // Switches para incluir firmas en el documento oficial (Idéntico a ATS)
  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    professional: true,
    supervisor: true
  });

  // Modales de impresión y compartir
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const isDeep = depthMeters > 1.20;
  const soilInfo = SOIL_TYPES_INFO[soilType];

  // Carga automática del perfil profesional y sellos digitales
  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      const lsPersonal = localStorage.getItem('personalData');
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        const name = pd.name || pd.fullName || '';
        const lic = pd.license || pd.matricula || '';
        const prof = pd.profession || pd.profesion || '';

        setProfessionalName(name);
        setProfessionalLicense(lic);
        setCompetentPersonName(prev => prev || name);

        if (prof.toLowerCase().includes('técnico') || prof.toLowerCase().includes('tecnico')) {
          setProfessionalRole('Técnico en Higiene y Seguridad');
        } else {
          setProfessionalRole('Profesional de Higiene y Seguridad');
        }
      }

      // Cargar sello y firma digitalizada guardada
      const lsStamp = localStorage.getItem('signatureStampData') || localStorage.getItem('signature_stamp_data');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        if (parsed.signature) {
          setProfessionalSignature(parsed.signature);
          setCompetentSig(prev => prev || parsed.signature);
        }
        if (parsed.stamp) setProfessionalStamp(parsed.stamp);
      } else {
        const legacySig = localStorage.getItem('capturedSignature') || localStorage.getItem('digital_signature');
        if (legacySig) {
          setProfessionalSignature(legacySig);
          setCompetentSig(prev => prev || legacySig);
        }
      }
    } catch (e) {
      console.warn('Error loading professional data:', e);
    }
  }, []);

  const checklistItems = [
    { key: 'utilitiesLocated', label: 'Interferencias subterráneas sondeadas (Gas, Luz, Agua, Telecomunicaciones)', desc: 'Planos consultados y cateos manuales preventivos antes de ingresar retroexcavadora.', law: 'Dec. 911/96 Art. 140' },
    { key: 'soilClassificationVerified', label: 'Clasificación de suelo y ángulo de reposo verificado en terreno', desc: 'Resistencia cohesiva comprobada. Pendiente de talud compatible con el tipo de suelo.', law: 'Res. SRT 550/11 Art. 3' },
    { key: 'spoilDistance1m', label: 'Acopio de tierra extraída a más de 1.00 m del borde superior de la zanja', desc: 'Previene sobrecarga en la cresta del talud y caída de piedras o terrones al fondo.', law: 'Dec. 911/96 Art. 143' },
    { key: 'safeAccessLadders7m', label: 'Escaleras reglamentarias de egreso rápido cada 7.50 m (sobresalen 1.00 m)', desc: 'Firmemente amarradas y sobresaliendo un metro por encima del nivel de la coronación.', law: 'Dec. 911/96 Art. 147' },
    { key: 'machineryDistanceSafe', label: 'Distancia de seguridad para tránsito y radio de giro de maquinaria pesada', desc: 'Evita colapso por peso o vibración en cercanías del borde de excavación.', law: 'Res. SRT 550/11 Art. 5' },
    { key: 'perimeterBarricades', label: 'Vallado perimetral rígido (1.00 m de altura), rodapié y señalización de advertencia', desc: 'Protección perimetral continua contra caídas de personas y vehículos al pozo.', law: 'Dec. 911/96 Art. 145' },
    { key: 'waterControlInstalled', label: 'Control de agua, napas freáticas y drenajes o bombas de achique disponibles', law: 'Dec. 911/96 Art. 148', desc: 'Verificación de napas freáticas o escorrentías para evitar ablandamiento del fondo.' },
    { key: 'atmosphereTested', label: 'Monitoreo de atmósfera peligrosa / gases pesados en zanjas profundas (> 1.20 m)', desc: 'Control de oxígeno (>19.5%) y gases tóxicos en cercanías de cañerías cloacales o de gas.', law: 'Dec. 911/96 Art. 150' }
  ];

  const totalChecks = checklistItems.length;
  const completedChecks = checklistItems.filter(item => (checklist as any)[item.key]).length;
  const allCompleted = completedChecks === totalChecks;

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  // Payload listo para PDF y vista previa
  const pdfPayload = useMemo(() => ({
    id: permitNumber,
    permitNumber,
    date,
    location,
    projectOrSite: projectOrSite || activeCompany?.name || 'Obra en Construcción',
    companyName: activeCompany?.name || projectOrSite || 'Empresa Principal',
    depthMeters,
    widthMeters,
    lengthMeters,
    soilType,
    shoringType,
    requiresShoring: isDeep,
    checklist,
    operatorName: operatorName || 'Operador de Excavación',
    supervisorName: supervisorName || 'Supervisión de Obra',
    competentPersonName: competentPersonName || professionalName || 'Especialista en Seguridad',
    professionalName: professionalName || competentPersonName,
    professionalLicense: professionalLicense,
    professionalRole: professionalRole,
    professionalStamp: professionalStamp,
    competentPersonSignature: competentSig || professionalSignature,
    supervisorSignature: supervisorSig,
    operatorSignature: operatorSig,
    showSignatures,
    notes,
    createdAt: new Date().toISOString()
  }), [
    permitNumber, date, location, projectOrSite, activeCompany, depthMeters,
    widthMeters, lengthMeters, soilType, shoringType, isDeep, checklist,
    operatorName, supervisorName, competentPersonName, professionalName,
    professionalLicense, professionalRole, professionalStamp, competentSig,
    professionalSignature, supervisorSig, operatorSig, showSignatures, notes
  ]);

  // Impresión directa del documento A4 oficial (con neutralización de offscreen)
  const handleDirectPrint = async () => {
    setIsPrinting(true);
    const toastId = toast.loading('Preparando impresión de permiso oficial...');
    try {
      await new Promise(r => setTimeout(r, 400));
      const targetId = document.getElementById('pdf-sheet-excavation') ? 'pdf-sheet-excavation' : 'pdf-content-excavation';
      const element = document.getElementById(targetId);
      if (!element) throw new Error('Elemento de impresión no encontrado');
      await printElementAsDocument(targetId, `Permiso_Excavacion_${permitNumber}`, false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('[ExcavationForm] Error al imprimir:', err);
      toast.dismiss(toastId);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const finalLocation = location.trim() || 'Obra en Ejecución';
    const finalCompetent = competentPersonName.trim() || professionalName || 'Profesional de Higiene y Seguridad';
    const finalSupervisor = supervisorName.trim() || 'Supervisión de Obra';
    const finalProject = projectOrSite.trim() || activeCompany?.name || 'Obra en Construcción';

    const newPermit: ExcavationPermitData = {
      id: `exc_${Date.now()}`,
      companyId: activeCompany?.id,
      permitNumber,
      date: date || new Date().toISOString().split('T')[0],
      location: finalLocation,
      projectOrSite: finalProject,
      depthMeters: Number(depthMeters) || 1.20,
      widthMeters: Number(widthMeters) || 0.80,
      lengthMeters: Number(lengthMeters) || 5.0,
      soilType,
      slopeRatio: soilInfo.maxSlope,
      shoringType,
      requiresShoring: isDeep,
      checklist,
      operatorName: operatorName.trim() || 'Operador de Excavación',
      supervisorName: finalSupervisor,
      competentPersonName: finalCompetent,
      competentPersonSignature: competentSig || professionalSignature || undefined,
      supervisorSignature: supervisorSig || undefined,
      operatorSignature: operatorSig || undefined,
      status: 'active',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const savedPermits = safeGetLocalStorage<ExcavationPermitData[]>('excavation_permits_db', []);
    const updatedPermits = [newPermit, ...savedPermits];
    localStorage.setItem('excavation_permits_db', JSON.stringify(updatedPermits));

    toast.success('Permiso de excavación guardado exitosamente');
    navigate('/excavations');
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Permiso de Excavaciones y Zanjas"
          subtitle="Habilitación diaria de seguridad, cálculo geotécnico de talud y entibados reglamentarios"
          badge="Dec. 911/96 Cap. 10 & Res. SRT 550/11"
          icon={<Pickaxe size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          onBack={() => navigate('/excavations')}
        />

        <div className="max-w-4xl mx-auto w-full px-2 sm:px-4 mt-6">
          <form onSubmit={handleSave} noValidate className="space-y-6">
            {/* ========================================================
                BLOQUE 1: Datos de la Excavación y Localización
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Pickaxe size={22} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                    1. Datos de la Excavación y Localización
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Identificación de la zanja o pozo, fecha de habilitación y obra
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    N° de Permiso
                  </label>
                  <input
                    type="text"
                    value={permitNumber}
                    readOnly
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Fecha de Habilitación *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Obra / Proyecto
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre de la obra o planta"
                    value={projectOrSite}
                    onChange={e => setProjectOrSite(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ubicación Exacta de la Zanja / Pozo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Frente de obra manzana 4, traza de cañería de gas sector Este"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 2: Dimensiones y Clasificación de Suelo
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                    2. Dimensiones y Clasificación Geotécnica de Suelo
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Cálculo de estabilidad, ángulo de reposo y exigencia reglamentaria de entibado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Profundidad Máxima (metros) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    value={depthMeters}
                    onChange={e => setDepthMeters(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ancho de la Zanja (metros)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    value={widthMeters}
                    onChange={e => setWidthMeters(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Longitud Estimada (metros)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={lengthMeters}
                    onChange={e => setLengthMeters(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold mb-2 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Tipo de Suelo (Clasificación Geotécnica OSHA / Dec. 911/96)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(['A', 'B', 'C'] as const).map(t => {
                      const isSelected = soilType === t;
                      return (
                        <div
                          key={t}
                          onClick={() => setSoilType(t)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-xs ring-1 ring-blue-500'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-black ${isSelected ? 'text-blue-900 dark:text-blue-200' : 'text-slate-900 dark:text-white'}`}>
                              Suelo Tipo {t}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                              Talud: {SOIL_TYPES_INFO[t].maxSlope}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug m-0">
                            {SOIL_TYPES_INFO[t].description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Alerta de exigencia normativa */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  isDeep
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200'
                }`}
              >
                {isDeep ? (
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                ) : (
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                )}
                <div>
                  <strong className="text-xs font-black block">
                    {isDeep
                      ? 'Exigencia Reglamentaria: Profundidad > 1.20 metros'
                      : 'Profundidad Menor a 1.20 metros (Superficial)'}
                  </strong>
                  <p className="text-[11px] mt-0.5 leading-snug m-0 opacity-90">
                    {isDeep
                      ? `Bajo el Decreto 911/96 Art. 142 y Res. SRT 550/11, toda excavación superior a 1.20 m exige entibamiento continuo, tablestacado, caja metálica blindada o un talud con pendiente máxima de ${soilInfo.maxSlope}.`
                      : 'Zanja superficial exenta de entibado obligatorio salvo que existan vibraciones de tránsito pesado o falta de cohesión en las paredes.'}
                  </p>
                </div>
              </div>

              {isDeep && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Sistema de Protección o Entibado a Utilizar *
                  </label>
                  <select
                    value={shoringType}
                    onChange={e => setShoringType(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none"
                  >
                    <option value="trench_box">Caja de Zanja Metálica Blindada (Trench Box)</option>
                    <option value="timber_shoring">Entibado de Madera Continuo con Puntales</option>
                    <option value="sheet_piling">Tablestacado Metálico Hincado</option>
                    <option value="hydraulic">Entibado Hidráulico de Aluminio</option>
                    <option value="sloped_only">Talud a 45° / 34° sin entibado</option>
                  </select>
                </div>
              )}
            </div>

            {/* ========================================================
                BLOQUE 3: Verificaciones de Seguridad Críticas en Terreno
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                      3. Verificaciones de Seguridad Críticas en Terreno
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Control operativo preventivo según Decreto 911/96 y Res. SRT 550/11
                    </p>
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl border font-black text-xs flex items-center gap-1.5 ${
                    allCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300'
                  }`}
                >
                  {allCompleted ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{completedChecks} de {totalChecks} Verificadas ({Math.round((completedChecks / totalChecks) * 100)}%)</span>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: ((completedChecks / totalChecks) * 100) + '%',
                    backgroundColor: allCompleted ? '#10b981' : '#f59e0b'
                  }}
                />
              </div>

              {/* Lista Interactiva de Puntos Críticos */}
              <div className="space-y-2.5">
                {checklistItems.map(item => {
                  const isChecked = Boolean((checklist as any)[item.key]);

                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleCheck(item.key)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                        isChecked
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-700 border-slate-400'
                          }`}
                        >
                          {isChecked && <Check size={14} strokeWidth={3} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold leading-tight m-0 ${isChecked ? 'text-emerald-950 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-100'}`}>
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug m-0 mt-0.5">
                            {item.desc}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            Norma: {item.law}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                          isChecked
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isChecked ? 'VERIFICADO' : 'PENDIENTE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================
                BLOQUE 4: Personal Responsable y Firmas Digitales (Idéntico a ATS)
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Pencil size={22} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                    4. Firmas y Autorizaciones Digitales
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Habilitación de maniobras, selección de roles y firma digitalizada reglamentaria
                  </p>
                </div>
              </div>

              {/* Nombres de los responsables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Operador / Maquinista
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del maquinista"
                    value={operatorName}
                    onChange={e => setOperatorName(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {professionalRole} *
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del especialista HyS"
                    value={competentPersonName}
                    onChange={e => setCompetentPersonName(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Supervisión / Capataz de Obra *
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del supervisor"
                    value={supervisorName}
                    onChange={e => setSupervisorName(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Observaciones Técnicas Adicionales
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Condiciones climáticas, proximidad de lluvias, vibraciones cercanas o turnos especiales..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Switches para incluir firmas en el documento oficial (Idéntico a ATS) */}
              <div className="no-print p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-3 items-center">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                  INCLUIR FIRMAS EN EL PERMISO OFICIAL:
                </span>
                <div className="flex gap-2 flex-wrap justify-center">
                  {[
                    { id: 'operator', label: 'Operador / Maquinista' },
                    { id: 'professional', label: professionalRole },
                    { id: 'supervisor', label: 'Supervisión de Obra / Capataz' }
                  ].map((sig) => {
                    const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                    return (
                      <button
                        key={sig.id}
                        type="button"
                        onClick={() => setShowSignatures(prev => ({ ...prev, [sig.id]: !isChecked }))}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 opacity-60'
                        }`}
                      >
                        {isChecked && <CheckCircle2 size={13} />}
                        <span>{sig.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visualización oficial de firmas (Idéntico a ATS) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900/60 shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Vista Previa Oficial de Firmas (Idéntico a Impresión):
                  </span>
                </div>

                <PdfSignatures
                  data={pdfPayload}
                  hideFooter={true}
                  box1={showSignatures.operator ? {
                    title: 'OPERADOR / MAQUINISTA',
                    subtitle: (operatorName || 'Operador de Excavación').toUpperCase(),
                    signatureUrl: operatorSig || null,
                    isProfessional: false
                  } : null}
                  box2={showSignatures.professional ? {
                    title: (professionalRole || 'PROFESIONAL DE HIGIENE Y SEGURIDAD').toUpperCase(),
                    subtitle: (competentPersonName || professionalName || 'Firma y Sello').toUpperCase(),
                    signatureUrl: competentSig || professionalSignature || null,
                    stampUrl: professionalStamp || null,
                    isProfessional: true,
                    license: professionalLicense || null
                  } : null}
                  box3={showSignatures.supervisor ? {
                    title: 'SUPERVISIÓN / CAPATAZ DE OBRA',
                    subtitle: (supervisorName || 'Aprobación de Frente').toUpperCase(),
                    signatureUrl: supervisorSig || null,
                    isProfessional: false
                  } : null}
                />
              </div>

              {/* Lienzos interactivos de firma táctil / mouse */}
              <div className="pt-2">
                <span className="block text-xs font-black uppercase tracking-wider mb-3 text-slate-700 dark:text-slate-300">
                  Lienzo de Firma Táctil / Digital en Pantalla:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {showSignatures.operator && (
                    <SignatureCanvas
                      title="Firma Operador / Maquinista"
                      onSave={setOperatorSig}
                      initialImage={operatorSig || undefined}
                    />
                  )}

                  {showSignatures.professional && (
                    <SignatureCanvas
                      title={`Firma ${professionalRole}`}
                      onSave={setCompetentSig}
                      initialImage={competentSig || professionalSignature || undefined}
                    />
                  )}

                  {showSignatures.supervisor && (
                    <SignatureCanvas
                      title="Firma Supervisión / Capataz"
                      onSave={setSupervisorSig}
                      initialImage={supervisorSig || undefined}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================
                BARRA DE BOTONES FINAL (Estilo Arco Eléctrico / Aptitudes)
               ======================================================== */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => navigate('/excavations')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-xs hover:border-slate-400 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Cancelar</span>
              </button>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Botón Previa */}
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Eye size={16} />
                  <span>Previsualizar A4</span>
                </button>

                {/* Botón Imprimir */}
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  disabled={isPrinting}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  <Printer size={16} />
                  <span>Imprimir Permiso</span>
                </button>

                {/* Botón Compartir */}
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Share2 size={16} />
                  <span>Compartir</span>
                </button>

                {/* Botón Guardar Permiso */}
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <Save size={16} />
                  <span>Guardar Permiso</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Previsualización A4 en Vivo */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[960px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-800/90 select-none shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Pickaxe size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                    Vista Previa del Permiso de Excavación y Zanjas
                  </h2>
                  <p className="text-xs text-slate-400">
                    Formato A4 oficial idéntico al documento final impreso (Dec. 911/96)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleDirectPrint();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/70 flex justify-center">
              <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
                <ExcavationPdf data={pdfPayload} customId="preview-pdf-excavation" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor offscreen para renderizado de impresión directa */}
      <div className="ats-pdf-offscreen" id="pdf-content-excavation">
        <ExcavationPdf data={pdfPayload} customId="pdf-sheet-excavation" />
      </div>

      {/* Modal para Compartir */}
      <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`Permiso Excavación - ${permitNumber}`}
        text={`📋 Permiso Oficial de Excavaciones y Zanjas\n📌 N°: ${permitNumber}\n📍 Ubicación: ${location}\n📏 Profundidad: ${depthMeters} m\n📅 Fecha: ${date}`}
        rawMessage={`Permiso de Excavaciones y Zanjas ${permitNumber} - Ubicación: ${location} - Profundidad: ${depthMeters} m`}
        elementIdToPrint="pdf-sheet-excavation"
        fileName={`Permiso_Excavacion_${permitNumber}.pdf`}
      />
    </AnimatedPage>
  );
}
