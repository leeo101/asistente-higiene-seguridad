import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, ArrowLeft, Save, ShieldCheck, AlertTriangle,
  Activity, CheckCircle2, User, Calendar, ShieldAlert, Check,
  Printer, Award, Download, Eye, X
} from 'lucide-react';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import ArcFlashPdfGenerator from '../components/ArcFlashPdfGenerator';
import { printElementAsDocument, generatePdfBlob } from '../utils/pdfHelper';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import {
  ArcFlashPermitData, calculateArcFlash, PPE_CATEGORY_DESCRIPTIONS
} from '../data/arcFlashData';
import toast from 'react-hot-toast';

export default function ArcFlashPermitForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const printRef = useRef<HTMLDivElement>(null);

  const [permitNumber] = useState('ELEC-' + Date.now().toString().slice(-6));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [panelOrEquipmentTag, setPanelOrEquipmentTag] = useState('');
  const [substationOrLocation, setSubstationOrLocation] = useState(activeCompany?.name || '');
  const [nominalVoltageV, setNominalVoltageV] = useState<number>(380);
  const [isLiveWork, setIsLiveWork] = useState(true);

  // Parámetros de arco
  const [shortCircuitKa, setShortCircuitKa] = useState<number>(15);
  const [clearingTimeSeconds, setClearingTimeSeconds] = useState<number>(0.1);
  const [workingDistanceCm, setWorkingDistanceCm] = useState<number>(45);

  // Verificaciones Res. SRT 3068/14
  const [checklist, setChecklist] = useState({
    justificationLiveWorkDocumented: true,
    electricallySafeWorkConditionEvaluated: true,
    insulatedTools1000vInspected: true,
    dielectricGlovesClassVerified: true,
    voltageDetectorCalibrated: true,
    arcFlashSuitCertified: true,
    rescueHookAvailable: true,
    trainedPersonnelCertified: true
  });

  const [gloveClass, setGloveClass] = useState<any>('0');
  const [gloveLastTestDate, setGloveLastTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [leadElectrician, setLeadElectrician] = useState('');
  const [electricianLicense, setElectricianLicense] = useState('');
  const [safetySupervisor, setSafetySupervisor] = useState('');
  const [supervisorLicense, setSupervisorLicense] = useState('');
  const [plantManager, setPlantManager] = useState('');
  const [plantManagerSector, setPlantManagerSector] = useState('Mantenimiento Eléctrico');
  const [notes, setNotes] = useState('');
  const [electricianSig, setElectricianSig] = useState<string | null>(null);
  const [supervisorSig, setSupervisorSig] = useState<string | null>(null);
  const [plantManagerSig, setPlantManagerSig] = useState<string | null>(null);
  const [professionalStamp, setProfessionalStamp] = useState<string | null>(null);
  const [professionalTitle, setProfessionalTitle] = useState('PROFESIONAL HIGIENE Y SEGURIDAD');
  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Precargar datos y firma digital del Profesional H&S desde localStorage (igual que ATS)
  useEffect(() => {
    try {
      const savedPersonal = localStorage.getItem('personalData');
      if (savedPersonal) {
        const parsed = JSON.parse(savedPersonal);
        const fullName = parsed.fullName || parsed.name || '';
        const license = parsed.license || parsed.matricula || '';
        const title = parsed.profession || parsed.title || parsed.specialty || 'PROFESIONAL HIGIENE Y SEGURIDAD';
        if (fullName) setSafetySupervisor(prev => prev || fullName);
        if (license) setSupervisorLicense(prev => prev || license);
        if (title) setProfessionalTitle(title.toUpperCase());
      }
      const savedSigStamp = localStorage.getItem('signatureStampData');
      if (savedSigStamp) {
        const parsed = JSON.parse(savedSigStamp);
        if (parsed.signature) setSupervisorSig(parsed.signature);
        if (parsed.stamp) setProfessionalStamp(parsed.stamp);
      } else {
        const legacySig = localStorage.getItem('capturedSignature');
        if (legacySig) setSupervisorSig(legacySig);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Cálculo en tiempo real
  const calcResult = useMemo(() => {
    return calculateArcFlash(nominalVoltageV, shortCircuitKa, clearingTimeSeconds, workingDistanceCm);
  }, [nominalVoltageV, shortCircuitKa, clearingTimeSeconds, workingDistanceCm]);

  const checklistItems = [
    { k: 'justificationLiveWorkDocumented', label: 'Justificación formal de imposibilidad de desenergizar documentada', law: 'Res. SRT 3068/14 Art. 3' },
    { k: 'electricallySafeWorkConditionEvaluated', label: 'Evaluación de condición de trabajo eléctricamente segura completada', law: 'NFPA 70E Art. 120' },
    { k: 'insulatedTools1000vInspected', label: 'Herramientas de mano aisladas 1000V certificadas IRAM/IEC 60900', law: 'IRAM 2404 / IEC 60900' },
    { k: 'dielectricGlovesClassVerified', label: 'Guantes dieléctricos ensayados con protectores de cuero en uso', law: 'IRAM 3604 / ASTM D120' },
    { k: 'voltageDetectorCalibrated', label: 'Detector de tensión acústico/óptico verificado antes de iniciar', law: 'IEC 61243-1' },
    { k: 'arcFlashSuitCertified', label: 'Ropa y careta resistente al arco certificada según valor cal/cm²', law: 'NFPA 70E Tabla 130.7' },
    { k: 'rescueHookAvailable', label: 'Pértiga de rescate y salvamento dieléctrica accesible al pie', law: 'Res. SRT 3068/14 Art. 8' },
    { k: 'trainedPersonnelCertified', label: 'Personal electricista habilitado formalmente según Res. SRT 3068/14', law: 'Res. SRT 3068/14 Art. 4' }
  ];

  const totalChecks = checklistItems.length;
  const completedChecks = checklistItems.filter(item => (checklist as any)[item.k]).length;
  const allCompleted = completedChecks === totalChecks;

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  const ppeDesc = (PPE_CATEGORY_DESCRIPTIONS as any)[calcResult.category];

  // Construcción en tiempo real del objeto de permiso para vista previa e impresión A4
  const currentPermitObject: ArcFlashPermitData = useMemo(() => ({
    id: 'af_preview',
    companyId: activeCompany?.id,
    permitNumber,
    date,
    startTime,
    endTime,
    panelOrEquipmentTag: panelOrEquipmentTag.trim() || 'TABLERO GENERAL / CELDA',
    substationOrLocation: substationOrLocation.trim() || activeCompany?.name || 'SALA ELÉCTRICA PRINCIPAL',
    nominalVoltageV,
    isLiveWork,
    shortCircuitKa,
    clearingTimeSeconds,
    workingDistanceCm,
    calculatedIncidentEnergyCalCm2: calcResult.incidentEnergy,
    arcFlashBoundaryMeters: calcResult.boundaryMeters,
    ppeCategory: calcResult.category,
    checklist,
    gloveClass,
    gloveLastTestDate,
    leadElectrician,
    safetySupervisor,
    electricianLicense: electricianLicense.trim() || undefined,
    supervisorLicense: supervisorLicense.trim() || undefined,
    plantManager: plantManager.trim() || undefined,
    plantManagerSector: plantManagerSector.trim() || undefined,
    electricianSignature: electricianSig,
    supervisorSignature: supervisorSig,
    plantManagerSignature: plantManagerSig,
    professionalStamp,
    professionalTitle,
    showSignatures,
    status: 'active',
    notes: notes.trim() || undefined,
    createdAt: new Date().toISOString()
  }), [
    activeCompany, permitNumber, date, startTime, endTime, panelOrEquipmentTag,
    substationOrLocation, nominalVoltageV, isLiveWork, shortCircuitKa,
    clearingTimeSeconds, workingDistanceCm, calcResult, checklist, gloveClass,
    gloveLastTestDate, leadElectrician, safetySupervisor, electricianLicense,
    supervisorLicense, plantManager, plantManagerSector, electricianSig,
    supervisorSig, plantManagerSig, professionalStamp, professionalTitle,
    showSignatures, notes
  ]);

  // Función de impresión directa o descarga en PDF oficial de alta definición (estilo ATS)
  const handlePrintPDF = async (downloadOnly: boolean = false) => {
    const sanitizedTag = (panelOrEquipmentTag || 'Tablero').replace(/\s+/g, '_');
    const fileName = `Permiso_Arco_Electrico_${permitNumber}_${sanitizedTag}.pdf`;
    const targetId = showPreviewModal && !downloadOnly ? 'pdf-content-arc-flash-preview' : 'pdf-content-arc-flash-form';

    if (downloadOnly) {
      const loadingToast = toast.loading('Generando documento PDF oficial...');
      try {
        const blob = await generatePdfBlob('pdf-content-arc-flash-form', false);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        toast.success('Permiso descargado en PDF correctamente', { id: loadingToast });
      } catch (err) {
        console.error(err);
        toast.error('Error al generar el PDF', { id: loadingToast });
      }
    } else {
      await printElementAsDocument(targetId, `Permiso de Trabajo con Tensión ${permitNumber}`, false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!panelOrEquipmentTag.trim() || !leadElectrician.trim() || !safetySupervisor.trim()) {
      toast.error('Completa los campos requeridos (Tablero, Electricista y Supervisor HyS).');
      return;
    }

    if (calcResult.category === 'prohibited') {
      toast.error('¡Peligro extremo! La energía excede 40 cal/cm². La norma prohíbe el trabajo con tensión.');
      return;
    }

    const newPermit: ArcFlashPermitData = {
      ...currentPermitObject,
      id: 'af_' + Date.now(),
      panelOrEquipmentTag: panelOrEquipmentTag.trim(),
      substationOrLocation: substationOrLocation.trim(),
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem('arc_flash_permits_db');
    let list: ArcFlashPermitData[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (err) {}
    }
    list.unshift(newPermit);
    localStorage.setItem('arc_flash_permits_db', JSON.stringify(list));

    toast.success('Permiso eléctrico emitido exitosamente');
    navigate('/arc-flash');
  };

  return (
    <AnimatedPage>
      <div className="container pb-[6rem] min-h-[100vh] flex flex-col pt-4">
        <PremiumHeader
          title="Nuevo Permiso con Tensión / Arc Flash"
          subtitle="Evaluación de energía incidente, frontera de arco eléctrico y categoría de EPP bajo NFPA 70E"
          badge="NFPA 70E & Res. SRT 3068/14"
          icon={<Zap size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)"
          onBack={() => navigate('/arc-flash')}
        />

        <div className="max-w-4xl mx-auto w-full px-2 sm:px-4 mt-6">
          {/* Barra Superior con botón Volver */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/arc-flash')}
              style={{
                color: '#334155',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                minHeight: 'unset',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <ArrowLeft size={16} /> Volver a permisos de arco eléctrico
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* ========================================================
                BLOQUE 1: Identificación del Equipo Eléctrico y Horario
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Zap size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    1. Identificación del Equipo Eléctrico y Horario
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Datos del tablero o celda a intervenir y horario habilitado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    N° de Permiso
                  </label>
                  <input
                    type="text"
                    value={permitNumber}
                    readOnly
                    style={{ backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Fecha de Ejecución *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                      Inicio
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                      Fin
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Tablero / Celda / Equipo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. TGBT-01, Celda C-3 MT"
                    value={panelOrEquipmentTag}
                    onChange={e => setPanelOrEquipmentTag(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-2">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Subestación / Sector de Planta
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Subestación Transformadora N° 2 - Nave Principal"
                    value={substationOrLocation}
                    onChange={e => setSubstationOrLocation(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 2: Calculadora Arc Flash IEEE 1584 / NFPA 70E
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Activity size={22} />
                </div>
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                    2. Calculadora de Energía Incidente de Arco Eléctrico (NFPA 70E / IEEE 1584)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                    Parámetros del cortocircuito y tiempo de despeje para determinar el nivel de protección
                  </p>
                </div>
              </div>

              {/* 4 Inputs de la fórmula */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Tensión (V)
                  </label>
                  <input
                    type="number"
                    value={nominalVoltageV}
                    onChange={e => setNominalVoltageV(Number(e.target.value))}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-extrabold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Ej. 380V (BT) ó 13200V</span>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Cortocircuito (kA)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={shortCircuitKa}
                    onChange={e => setShortCircuitKa(parseFloat(e.target.value) || 0)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-extrabold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Icc presunta en barras</span>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Apertura (seg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={clearingTimeSeconds}
                    onChange={e => setClearingTimeSeconds(parseFloat(e.target.value) || 0)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-extrabold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tiempo disparo relé/fusible</span>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Distancia (cm)
                  </label>
                  <input
                    type="number"
                    value={workingDistanceCm}
                    onChange={e => setWorkingDistanceCm(Number(e.target.value))}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-extrabold px-3 py-2.5 border rounded-xl focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">45 cm (BT) / 90 cm (MT)</span>
                </div>
              </div>

              {/* Tarjeta de Resultados de Alta Legibilidad */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #f59e0b',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.12)'
                }}
                className="p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span style={{ color: '#92400e' }} className="text-xs font-extrabold uppercase tracking-wider">
                      Resultado del Análisis de Arco Eléctrico (IEEE 1584 / NFPA 70E)
                    </span>
                  </div>
                  <span
                    style={{
                      backgroundColor: calcResult.category === 'prohibited' ? '#fee2e2' : '#fef3c7',
                      color: calcResult.category === 'prohibited' ? '#991b1b' : '#92400e',
                      border: '1px solid currentColor'
                    }}
                    className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                  >
                    {calcResult.category === 'prohibited' ? '⛔ TRABAJO PROHIBIDO' : 'CATEGORÍA ' + calcResult.category}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Energía Incidente */}
                  <div
                    style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
                    className="p-4 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span style={{ color: '#78350f' }} className="block text-[11px] font-bold uppercase tracking-wider">
                        Energía Incidente Calculada
                      </span>
                      <div style={{ color: '#b45309' }} className="text-3xl font-black mt-1">
                        {calcResult.incidentEnergy} <span className="text-base font-bold">cal/cm²</span>
                      </div>
                      <span style={{ color: '#92400e' }} className="text-[11px] font-medium block mt-0.5">
                        {calcResult.incidentEnergy <= 1.2 ? 'Por debajo del umbral de quemadura de 2° grado' : 'Requiere protección térmica ignífuga'}
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-lg">
                      🔥
                    </div>
                  </div>

                  {/* Frontera de Arco */}
                  <div
                    style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                    className="p-4 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span style={{ color: '#14532d' }} className="block text-[11px] font-bold uppercase tracking-wider">
                        Frontera de Arco (Límite 1.2 cal/cm²)
                      </span>
                      <div style={{ color: '#15803d' }} className="text-3xl font-black mt-1">
                        {calcResult.boundaryMeters} <span className="text-base font-bold">metros</span>
                      </div>
                      <span style={{ color: '#166534' }} className="text-[11px] font-medium block mt-0.5">
                        Distancia mínima sin EPP ignífugo
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      🛡️
                    </div>
                  </div>
                </div>

                {/* Especificación de EPP requerida */}
                <div
                  style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                  className="p-4 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#0f172a' }} className="text-xs font-black uppercase tracking-wider">
                      Equipamiento de Protección Personal (EPP) Requerido:
                    </span>
                  </div>
                  <p style={{ color: '#1e293b' }} className="text-xs font-semibold leading-relaxed m-0">
                    {ppeDesc?.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 3: Medidas Obligatorias Res. SRT 3068/14 y NFPA 70E
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                      3. Medidas Obligatorias Res. SRT 3068/14 y NFPA 70E
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Verificación obligatoria de las 8 condiciones de seguridad previas a la maniobra
                    </p>
                  </div>
                </div>

                {/* Live Verification Counter Badge */}
                <div
                  style={{
                    backgroundColor: allCompleted ? '#dcfce7' : '#fef3c7',
                    color: allCompleted ? '#166534' : '#92400e',
                    border: allCompleted ? '1.5px solid #86efac' : '1.5px solid #fde68a',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {allCompleted ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{completedChecks} de {totalChecks} Verificadas ({Math.round((completedChecks / totalChecks) * 100)}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: ((completedChecks / totalChecks) * 100) + '%',
                    backgroundColor: allCompleted ? '#10b981' : '#f59e0b'
                  }}
                />
              </div>

              {/* Lista Interactiva de Checklist Res. 3068/14 */}
              <div className="space-y-3">
                {checklistItems.map(item => {
                  const isChecked = Boolean((checklist as any)[item.k]);

                  return (
                    <div
                      key={item.k}
                      onClick={() => toggleCheck(item.k)}
                      style={{
                        backgroundColor: isChecked ? '#f0fdf4' : '#ffffff',
                        border: isChecked ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                        boxShadow: isChecked ? '0 4px 12px rgba(16, 185, 129, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                      className="group hover:border-emerald-400"
                    >
                      {/* Check icon + text */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Custom Checkbox Pill */}
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '8px',
                            backgroundColor: isChecked ? '#10b981' : '#ffffff',
                            border: isChecked ? 'none' : '2px solid #94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isChecked && <Check size={16} color="#ffffff" strokeWidth={3} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              color: isChecked ? '#064e3b' : '#1e293b',
                              fontWeight: isChecked ? 800 : 600,
                              fontSize: '13px',
                              margin: 0,
                              lineHeight: 1.4
                            }}
                          >
                            {item.label}
                          </p>
                          <span
                            style={{ color: isChecked ? '#059669' : '#94a3b8', fontSize: '11px', fontWeight: 600 }}
                            className="block mt-0.5"
                          >
                            Norma aplicable: {item.law}
                          </span>
                        </div>
                      </div>

                      {/* Right Status Badge */}
                      <div className="flex-shrink-0">
                        <span
                          style={{
                            backgroundColor: isChecked ? '#d1fae5' : '#f1f5f9',
                            color: isChecked ? '#047857' : '#64748b',
                            border: isChecked ? '1px solid #86efac' : '1px solid #cbd5e1',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isChecked ? '✓ Cumple' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guantes y ensayo de rigidez */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Clase de Guantes Dieléctricos
                  </label>
                  <select
                    value={gloveClass}
                    onChange={e => setGloveClass(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  >
                    <option value="00">Clase 00 (Hasta 500 V)</option>
                    <option value="0">Clase 0 (Hasta 1.000 V)</option>
                    <option value="1">Clase 1 (Hasta 7.500 V)</option>
                    <option value="2">Clase 2 (Hasta 17.000 V)</option>
                    <option value="3">Clase 3 (Hasta 26.500 V)</option>
                    <option value="4">Clase 4 (Hasta 36.000 V)</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Fecha Último Ensayo Rigidez Dieléctrica (&lt; 6 meses)
                  </label>
                  <input
                    type="date"
                    value={gloveLastTestDate}
                    onChange={e => setGloveLastTestDate(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================
                BLOQUE 4: Personal Habilitado, Autorizaciones y Firmas
               ======================================================== */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <Award size={22} />
                  </div>
                  <div>
                    <h2 style={{ color: '#0f172a' }} className="text-base font-extrabold m-0 dark:text-white">
                      4. Personal Habilitado, Autorizaciones y Firmas Digitalizadas
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 font-medium">
                      Validación formal y firmas digitalizadas estilo ATS para el permiso de trabajo con tensión
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    background: '#ecfdf5',
                    color: '#047857',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    border: '1px solid #a7f3d0'
                  }}
                >
                  Firma Profesional Precargada
                </span>
              </div>

              {/* Selector de visibilidad de cajas de firma (igual que ATS y Aptitudes Médicas) */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase' }}>
                  INCLUIR FIRMAS EN EL DOCUMENTO:
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={showSignatures.operator}
                    onChange={e => setShowSignatures(s => ({ ...s, operator: e.target.checked }))}
                    style={{ accentColor: '#2563eb', width: '15px', height: '15px' }}
                  />
                  Electricista Habilitado
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={showSignatures.supervisor}
                    onChange={e => setShowSignatures(s => ({ ...s, supervisor: e.target.checked }))}
                    style={{ accentColor: '#2563eb', width: '15px', height: '15px' }}
                  />
                  Emisor / Autorizante de Planta
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: '#047857' }}>
                  <input
                    type="checkbox"
                    checked={showSignatures.professional}
                    onChange={e => setShowSignatures(s => ({ ...s, professional: e.target.checked }))}
                    style={{ accentColor: '#059669', width: '15px', height: '15px' }}
                  />
                  Profesional H&S (Con sello y matrícula)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Electricista Habilitado */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <User size={16} className="text-blue-600" />
                    1. Electricista Habilitado
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez (O en blanco para obra)"
                      value={leadElectrician}
                      onChange={e => setLeadElectrician(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">Matrícula / Habilitación BT-MT</label>
                    <input
                      type="text"
                      placeholder="Ej. Mat. COPIME 12345"
                      value={electricianLicense}
                      onChange={e => setElectricianLicense(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                </div>

                {/* 2. Emisor / Autorizante de Planta */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <CheckCircle2 size={16} className="text-purple-600" />
                    2. Emisor de Planta
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">Jefe Mant. / Operaciones</label>
                    <input
                      type="text"
                      placeholder="Ej. Roberto Díaz"
                      value={plantManager}
                      onChange={e => setPlantManager(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label style={{ color: '#475569' }} className="block text-[11px] font-bold mb-1">Sector / Área</label>
                    <input
                      type="text"
                      placeholder="Ej. Jefatura de Mantenimiento"
                      value={plantManagerSector}
                      onChange={e => setPlantManagerSector(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                </div>

                {/* 3. Profesional H&S (Destacado en esmeralda como en ATS) */}
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    3. Profesional H&S
                  </div>
                  <div>
                    <label style={{ color: '#065f46' }} className="block text-[11px] font-bold mb-1">Nombre Profesional *</label>
                    <input
                      type="text"
                      placeholder="Ej. Lic. / Téc. en Higiene y Seguridad"
                      value={safetySupervisor}
                      onChange={e => setSafetySupervisor(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#6ee7b7' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ color: '#065f46' }} className="block text-[11px] font-bold mb-1">Matrícula Profesional (Ley 19.587)</label>
                    <input
                      type="text"
                      placeholder="Ej. Mat. N° MP.4457"
                      value={supervisorLicense}
                      onChange={e => setSupervisorLicense(e.target.value)}
                      style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#6ee7b7' }}
                      className="w-full text-xs font-semibold px-3 py-2 border rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label style={{ color: '#334155' }} className="block text-xs font-bold mb-1.5 uppercase tracking-wider dark:text-slate-300">
                    Instrucciones Particulares de Maniobra
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Secuencia de apertura de seccionadores, colocación de candados LOTO, uso de tapetes dieléctricos o precauciones con terceros..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                    className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* PIZARRAS INTERACTIVAS DE FIRMA DIGITAL EN EL CONTENIDO (IGUAL QUE ATS) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {showSignatures.operator && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <SignatureCanvas
                      label="Firma Electricista Habilitado (Opcional — en blanco si firma en obra)"
                      initialImage={electricianSig || null}
                      onSave={sig => setElectricianSig(sig || null)}
                    />
                  </div>
                )}

                {showSignatures.supervisor && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <SignatureCanvas
                      label="Firma Emisor / Autorizante de Planta (Opcional)"
                      initialImage={plantManagerSig || null}
                      onSave={sig => setPlantManagerSig(sig || null)}
                    />
                  </div>
                )}

                {showSignatures.professional && (
                  <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-300">
                    <SignatureCanvas
                      label="Firma Digital del Profesional H&S"
                      initialImage={supervisorSig || null}
                      onSave={sig => setSupervisorSig(sig || null)}
                    />
                  </div>
                )}
              </div>

              {/* VISTA PREVIA EN VIVO DEL CUADRO DE FIRMAS OFICIAL (IDÉNTICO A ATS) */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.25rem'
                  }}
                >
                  Vista Previa en Vivo del Cuadro de Firmas en el Permiso Impreso:
                </div>
                <PdfSignatures
                  data={{
                    ...currentPermitObject,
                    showSignatures,
                    professionalSignature: supervisorSig,
                    professionalStamp: professionalStamp,
                    professionalName: safetySupervisor,
                    professionalLicense: supervisorLicense,
                    professionalTitle: professionalTitle
                  }}
                  box1={
                    showSignatures.operator
                      ? {
                          title: 'ELECTRICISTA HABILITADO (EJECUTANTE)',
                          subtitle: (leadElectrician || 'FIRMA EN OBRA / ACLARACIÓN').toUpperCase(),
                          signatureUrl: electricianSig || null,
                          license: electricianLicense ? `Hab. ${electricianLicense}` : null,
                          isProfessional: false
                        }
                      : null
                  }
                  box2={
                    showSignatures.supervisor
                      ? {
                          title: 'EMISOR / AUTORIZANTE DE PLANTA',
                          subtitle: (
                            plantManager
                              ? `${plantManager}${plantManagerSector ? ` (${plantManagerSector})` : ''}`
                              : 'JEFE DE MANTENIMIENTO / OPERACIONES'
                          ).toUpperCase(),
                          signatureUrl: plantManagerSig || null,
                          isProfessional: false
                        }
                      : null
                  }
                  box3={
                    showSignatures.professional
                      ? {
                          title: professionalTitle || 'PROFESIONAL HIGIENE Y SEGURIDAD',
                          subtitle: (safetySupervisor || 'FIRMA Y SELLO PROFESIONAL').toUpperCase(),
                          signatureUrl: supervisorSig || null,
                          stampUrl: professionalStamp || null,
                          isProfessional: true,
                          license: supervisorLicense || null,
                          profession: professionalTitle || null
                        }
                      : null
                  }
                  compact={true}
                  hideFooter={true}
                />
              </div>
            </div>

            {/* ========================================================
                Botones de Envío, Vista Previa A4 e Impresión PDF
               ======================================================== */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200 dark:border-slate-700 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/arc-flash')}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  minHeight: 'unset'
                }}
              >
                Cancelar
              </button>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Botón Vista Previa A4 */}
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset'
                  }}
                >
                  <Eye size={16} />
                  <span>Vista Previa A4</span>
                </button>

                {/* Botón Imprimir (Abre diálogo nativo con plantilla A4 mejorada) */}
                <button
                  type="button"
                  onClick={() => handlePrintPDF(false)}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  <Printer size={16} />
                  <span>Imprimir Permiso</span>
                </button>

                {/* Botón Descargar PDF */}
                <button
                  type="button"
                  onClick={() => handlePrintPDF(true)}
                  style={{
                    backgroundColor: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)'
                  }}
                >
                  <Download size={16} />
                  <span>Descargar PDF</span>
                </button>

                {/* Botón Guardar / Emitir */}
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: 'unset',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
                  }}
                >
                  <Save size={16} />
                  <span>Emitir Permiso</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* CONTENEDOR A4 OFFSCREEN PARA IMPRESIÓN Y DESCARGA PDF DIRECTA */}
        <div
          className="ats-pdf-offscreen"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '210mm',
            backgroundColor: '#ffffff',
            zIndex: -1
          }}
          ref={printRef}
        >
          <ArcFlashPdfGenerator
            permit={currentPermitObject}
            companyName={activeCompany?.name}
            pdfElementId="pdf-content-arc-flash-form"
          />
        </div>

        {/* MODAL DE VISTA PREVIA A4 OFICIAL */}
        {showPreviewModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1.25rem',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '210mm',
                background: '#0f172a',
                color: '#ffffff',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Zap size={18} color="#fbbf24" />
                <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>
                  Vista Previa Oficial A4 — Permiso {permitNumber}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handlePrintPDF(false)}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={15} /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintPDF(true)}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} /> Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.65rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              style={{
                width: '100%',
                maxWidth: '210mm',
                background: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
                borderRadius: '0 0 12px 12px',
                overflow: 'hidden'
              }}
            >
              <ArcFlashPdfGenerator
                permit={currentPermitObject}
                companyName={activeCompany?.name}
                pdfElementId="pdf-content-arc-flash-preview"
              />
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
