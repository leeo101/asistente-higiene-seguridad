import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Truck, ArrowLeft, Save, Eye, Printer, Share2, CheckCircle2,
  AlertOctagon, AlertTriangle, User, Calendar, Clock, Gauge,
  Shield, MapPin, Pencil, Award, Check, X, ShieldAlert, Sparkles
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useCompany } from '../contexts/CompanyContext';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import { safeGetLocalStorage } from '../utils/storageHelper';
import { printElementAsDocument } from '../utils/pdfHelper';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import ForkliftInspectionPdf from '../components/ForkliftInspectionPdf';
import ShareModal from '../components/ShareModal';
import {
  ForkliftVehicle,
  ForkliftDriver,
  ForkliftDailyCheck,
  DAILY_INSPECTION_ITEMS,
  DEFAULT_FORKLIFT_VEHICLES,
  DEFAULT_FORKLIFT_DRIVERS
} from '../data/forkliftSrt960Data';

export default function ForkliftDailyCheckForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCompany } = useCompany();
  const { requirePro } = usePaywall();

  useDocumentTitle('Checklist Pre-operacional de Autoelevador - Res. SRT 960/15');

  // Estados de datos maestros
  const [vehicles, setVehicles] = useState<ForkliftVehicle[]>([]);
  const [drivers, setDrivers] = useState<ForkliftDriver[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Estados del formulario de check
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'manana' | 'tarde' | 'noche'>('manana');
  const [startHours, setStartHours] = useState<number>(0);
  const [sectorLocation, setSectorLocation] = useState('');
  const [observations, setObservations] = useState('');
  const [responses, setResponses] = useState<{ [itemId: string]: 'conforme' | 'no_conforme' | 'no_aplica' }>({});

  // Firmas y autorizaciones
  const [showSignatures, setShowSignatures] = useState({
    driver: true,
    supervisor: true,
    professional: true
  });
  const [driverSignature, setDriverSignature] = useState<string | null>(null);
  const [supervisorSignature, setSupervisorSignature] = useState<string | null>(null);
  const [professionalSignature, setProfessionalSignature] = useState<string | null>(null);
  const [professionalStamp, setProfessionalStamp] = useState<string | null>(null);
  const [professionalName, setProfessionalName] = useState('');
  const [professionalLicense, setProfessionalLicense] = useState('');
  const [professionalRole, setProfessionalRole] = useState('Profesional de Higiene y Seguridad');

  // Modales
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Responsive listener
  useEffect(() => {
    const checkResize = () => setIsMobile(window.innerWidth < 768);
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

  // Carga inicial de datos maestros y firmas
  useEffect(() => {
    const rawV = safeGetLocalStorage<ForkliftVehicle[]>('forklift_vehicles_db', DEFAULT_FORKLIFT_VEHICLES);
    const rawD = safeGetLocalStorage<ForkliftDriver[]>('forklift_drivers_db', DEFAULT_FORKLIFT_DRIVERS);
    setVehicles(rawV);
    setDrivers(rawD);

    // Seleccionar vehículo inicial (si vino por location state o el primero)
    const passedVehId = location.state?.vehicleId;
    const targetVeh = rawV.find(v => v.id === passedVehId) || rawV[0];
    if (targetVeh) {
      setSelectedVehicleId(targetVeh.id);
      setStartHours(targetVeh.currentHours || 100);
      setSectorLocation(targetVeh.sectorLocation || 'Depósito Central');
    }

    if (rawD.length > 0) {
      setSelectedDriverId(rawD[0].id);
    }

    // Inicializar respuestas en 'conforme' por defecto
    const initialResponses: { [key: string]: 'conforme' } = {};
    DAILY_INSPECTION_ITEMS.forEach(item => {
      initialResponses[item.id] = 'conforme';
    });
    setResponses(initialResponses);

    // Cargar perfil profesional
    const savedData = safeGetLocalStorage('personalData', null);
    const savedSigData = safeGetLocalStorage('signature_stamp_data', null);
    const legacySig = safeGetLocalStorage('digital_signature', null);

    let sig = legacySig || null;
    let stp = null;
    if (savedSigData) {
      try {
        const parsed = JSON.parse(savedSigData);
        sig = parsed?.signature || sig;
        stp = parsed?.stamp || null;
      } catch {
        if (savedSigData.startsWith('data:')) sig = savedSigData;
      }
    }

    if (savedData) {
      try {
        const pd = JSON.parse(savedData);
        const userProf = pd?.profession || pd?.profesion || '';
        const defaultRole = (userProf.toLowerCase().includes('técnico') || userProf.toLowerCase().includes('tecnico'))
          ? 'Técnico en Higiene y Seguridad'
          : 'Profesional de Higiene y Seguridad';

        setProfessionalName(pd?.name || pd?.fullName || '');
        setProfessionalLicense(pd?.license || pd?.matricula || '');
        setProfessionalRole(defaultRole);
        setProfessionalSignature(sig);
        setProfessionalStamp(stp);
      } catch {}
    } else {
      setProfessionalSignature(sig);
      setProfessionalStamp(stp);
    }
  }, [location.state]);

  // Selección de vehículo actual
  const currentVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Selección de conductor actual
  const currentDriver = useMemo(() => {
    return drivers.find(d => d.id === selectedDriverId) || drivers[0];
  }, [drivers, selectedDriverId]);

  // Detección de fallas críticas y cálculo de KPIs
  const kpis = useMemo(() => {
    let conformities = 0;
    let nonConformities = 0;
    let naCount = 0;
    let hasCriticalFailure = false;
    const criticalFailures: string[] = [];

    DAILY_INSPECTION_ITEMS.forEach(item => {
      const state = responses[item.id] || 'conforme';
      if (state === 'conforme') conformities++;
      else if (state === 'no_conforme') {
        nonConformities++;
        if (item.isCritical) {
          hasCriticalFailure = true;
          criticalFailures.push(item.title);
        }
      } else {
        naCount++;
      }
    });

    const evaluated = conformities + nonConformities;
    const complianceRate = evaluated > 0 ? Math.round((conformities / evaluated) * 100) : 100;

    return {
      conformities,
      nonConformities,
      naCount,
      hasCriticalFailure,
      criticalFailures,
      complianceRate
    };
  }, [responses]);

  // Cambio de respuesta para un ítem
  const handleItemChange = (itemId: string, status: 'conforme' | 'no_conforme' | 'no_aplica') => {
    setResponses(prev => ({ ...prev, [itemId]: status }));
  };

  // Marcar todos conformes con 1 clic
  const handleMarkAllConforme = () => {
    const allConforme: { [key: string]: 'conforme' } = {};
    DAILY_INSPECTION_ITEMS.forEach(item => {
      allConforme[item.id] = 'conforme';
    });
    setResponses(allConforme);
    toast.success('Todos los puntos de control marcados como CONFORME');
  };

  // Guardar check preoperacional
  const handleSave = () => {
    if (!currentVehicle) {
      toast.error('Seleccione un autoelevador válido');
      return;
    }
    if (!currentDriver) {
      toast.error('Seleccione un conductor habilitado');
      return;
    }

    const checkResult = kpis.hasCriticalFailure 
      ? 'bloqueado_fuera_de_servicio' 
      : kpis.nonConformities > 0 
        ? 'aprobado_con_observacion' 
        : 'aprobado';

    const newCheck: ForkliftDailyCheck = {
      id: `check-${Date.now()}`,
      companyId: activeCompany?.id,
      vehicleId: currentVehicle.id,
      vehicleCode: currentVehicle.internalCode,
      driverId: currentDriver.id,
      driverName: currentDriver.fullName,
      driverCuil: currentDriver.cuil,
      date: date || new Date().toISOString().split('T')[0],
      shift: shift,
      startHours: Number(startHours) || currentVehicle.currentHours || 0,
      responses: responses,
      observations: observations,
      hasCriticalFailure: kpis.hasCriticalFailure,
      result: checkResult,
      driverSignatureName: currentDriver.fullName,
      driverSignature: driverSignature || undefined,
      supervisorSignatureName: professionalName || 'Supervisor / Higiene y Seguridad',
      supervisorSignature: supervisorSignature || professionalSignature || undefined,
      resolved: !kpis.hasCriticalFailure,
      createdAt: new Date().toISOString()
    };

    // 1. Guardar en checklist db
    const savedChecks = safeGetLocalStorage<ForkliftDailyCheck[]>('forklift_daily_checks_db', []);
    const updatedChecks = [newCheck, ...savedChecks];
    localStorage.setItem('forklift_daily_checks_db', JSON.stringify(updatedChecks));

    // 2. Si hay falla crítica, inmovilizar el autoelevador en el padrón inmediatamente (Art. 6)
    const savedVehicles = safeGetLocalStorage<ForkliftVehicle[]>('forklift_vehicles_db', vehicles);
    const updatedVehicles = savedVehicles.map(v => {
      if (v.id === currentVehicle.id) {
        return {
          ...v,
          currentHours: Number(startHours) || v.currentHours,
          status: kpis.hasCriticalFailure ? ('fuera_de_servicio' as const) : v.status
        };
      }
      return v;
    });
    localStorage.setItem('forklift_vehicles_db', JSON.stringify(updatedVehicles));

    if (kpis.hasCriticalFailure) {
      toast.error(
        '¡EQUIPO BLOQUEADO! Detección de no conformidad en ítem crítico. Inmovilizado según Res. SRT 960/15 Art. 6.',
        { duration: 6000 }
      );
    } else {
      toast.success('Checklist pre-operacional guardado exitosamente.');
    }

    navigate('/autoelevadores');
  };

  // Impresión directa
  const handleDirectPrint = async () => {
    setIsPrinting(true);
    const toastId = toast.loading('Preparando impresión de planilla oficial...');
    try {
      await new Promise(r => setTimeout(r, 400));
      const targetId = document.getElementById('pdf-sheet-forklift') ? 'pdf-sheet-forklift' : 'pdf-content-forklift';
      const element = document.getElementById(targetId);
      if (!element) throw new Error('Elemento de impresión no encontrado');
      await printElementAsDocument(targetId, `Checklist_${currentVehicle?.internalCode || 'AE'}_${date}`, false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('[ForkliftCheckForm] Error al imprimir:', err);
      toast.dismiss(toastId);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  // Objeto preparado para renderizar en PDF
  const pdfPayload = useMemo(() => ({
    id: `CHK-${Date.now()}`,
    vehicleCode: currentVehicle?.internalCode || 'AE-01',
    driverName: currentDriver?.fullName || 'Conductor',
    driverCuil: currentDriver?.cuil || '',
    date: date,
    shift: shift,
    startHours: startHours,
    sectorLocation: sectorLocation,
    responses: responses,
    observations: observations,
    hasCriticalFailure: kpis.hasCriticalFailure,
    complianceRate: kpis.complianceRate,
    showSignatures: showSignatures,
    driverSignature: driverSignature,
    supervisorSignature: supervisorSignature,
    supervisorName: 'Supervisión de Turno',
    professionalSignature: professionalSignature,
    professionalStamp: professionalStamp,
    professionalName: professionalName,
    professionalLicense: professionalLicense,
    professionalRole: professionalRole,
    companyName: activeCompany?.name
  }), [
    currentVehicle, currentDriver, date, shift, startHours, sectorLocation,
    responses, observations, kpis, showSignatures, driverSignature,
    supervisorSignature, professionalSignature, professionalStamp,
    professionalName, professionalLicense, professionalRole, activeCompany
  ]);

  return (
    <>
      <ModuleFormLayout>
        <ModuleFormToolbar
          title="Checklist Pre-operacional Diario"
          subtitle="Verificación obligatoria previa al turno de trabajo — Resolución S.R.T. N° 960/15 Art. 6"
          icon={<Truck size={20} className="text-amber-500" />}
          onBack={() => navigate('/autoelevadores')}
        />

        <ModuleFormDocument>
          {/* Alerta de bloqueo preventivo inmediato si existe falla crítica */}
          {kpis.hasCriticalFailure && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100 flex items-start gap-3.5 shadow-lg shadow-rose-500/10 animate-pulse">
              <AlertOctagon size={24} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-sm uppercase tracking-wide text-rose-700 dark:text-rose-300">
                  INMOVILIZACIÓN OBLIGATORIA DEL EQUIPO (ART. 6 RES. SRT 960/15)
                </h4>
                <p className="text-xs mt-1 font-semibold leading-relaxed">
                  Se ha detectado no conformidad en al menos un componente crítico ({kpis.criticalFailures.join(', ')}).
                  El autoelevador no puede ser operado hasta su intervención y liberación por servicio técnico habilitado.
                </p>
              </div>
            </div>
          )}

          {/* Sección 1: Selección de Equipo, Conductor y Turno */}
          <ModuleFormSection title="Datos Operativos del Turno" icon={<Calendar size={18} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              {/* Autoelevador */}
              <div>
                <label className="flex items-center gap-1.5 mb-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Truck size={14} className="text-amber-500" /> Autoelevador (*)
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    const v = vehicles.find(x => x.id === e.target.value);
                    if (v) {
                      setStartHours(v.currentHours || 100);
                      setSectorLocation(v.sectorLocation || 'Depósito Central');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.internalCode} — {v.brand} {v.model} ({v.capacityKg} kg)
                    </option>
                  ))}
                </select>
                {currentVehicle && (
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Horómetro registrado: <strong>{currentVehicle.currentHours} hs</strong> | {currentVehicle.sectorLocation}
                  </p>
                )}
              </div>

              {/* Conductor Habilitado */}
              <div>
                <label className="flex items-center gap-1.5 mb-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <User size={14} className="text-blue-500" /> Conductor Habilitado (*)
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-800 dark:text-white shadow-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} (DNI {d.dni})
                    </option>
                  ))}
                </select>
                {currentDriver && (
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    CUIL {currentDriver.cuil} | Carnet: <span className="font-mono text-emerald-600 font-bold">{currentDriver.licenseNumber}</span>
                  </p>
                )}
              </div>

              {/* Turno, Fecha y Horómetro */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Fecha del Control
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Turno
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="manana">☀️ Mañana</option>
                    <option value="tarde">⛅ Tarde</option>
                    <option value="noche">🌙 Noche</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-1 mb-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <Gauge size={12} className="text-amber-500" /> Horómetro Inicio de Turno (hs)
                  </label>
                  <input
                    type="number"
                    value={startHours}
                    onChange={(e) => setStartHours(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 2: Checklist Pre-operacional Táctil */}
          <ModuleFormSection 
            title="Puntos de Control Técnico (Res. SRT 960/15)" 
            icon={<CheckCircle2 size={18} />}
          >
            {/* Barra de estado y acción rápida */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-sm">
                  {kpis.complianceRate}%
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Cumplimiento del Checklist: {kpis.conformities} Conformes de {DAILY_INSPECTION_ITEMS.length}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {kpis.nonConformities > 0 
                      ? `${kpis.nonConformities} desvío(s) detectado(s)` 
                      : 'Todos los ítems verificados conformes'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMarkAllConforme}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Check size={14} className="stroke-[3]" />
                Marcar Todos Conformes
              </button>
            </div>

            {/* Listado de ítems responsive */}
            <div className="space-y-3">
              {DAILY_INSPECTION_ITEMS.map((item, idx) => {
                const status = responses[item.id] || 'conforme';
                const isFail = status === 'no_conforme';
                const isNa = status === 'no_aplica';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isFail
                        ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 dark:border-rose-800/80 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400 font-mono">#{idx + 1}</span>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                          {item.title}
                        </span>
                        {item.isCritical && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-300">
                            Ítem Crítico (Art. 6)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                        {item.description}
                      </p>
                    </div>

                    {/* Segmented selector responsive */}
                    <div className="grid grid-cols-3 sm:flex w-full sm:w-auto bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1 h-fit shrink-0">
                      <button
                        type="button"
                        onClick={() => handleItemChange(item.id, 'conforme')}
                        className={`flex-1 sm:flex-initial py-2 sm:py-1 px-3 text-center text-[11px] font-black rounded-lg border cursor-pointer uppercase transition-all whitespace-nowrap flex items-center justify-center ${
                          status === 'conforme'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900'
                        }`}
                      >
                        ✓ CONFORME
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemChange(item.id, 'no_conforme')}
                        className={`flex-1 sm:flex-initial py-2 sm:py-1 px-3 text-center text-[11px] font-black rounded-lg border cursor-pointer uppercase transition-all whitespace-nowrap flex items-center justify-center ${
                          status === 'no_conforme'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900'
                        }`}
                      >
                        ✗ DESVÍO
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemChange(item.id, 'no_aplica')}
                        className={`flex-1 sm:flex-initial py-2 sm:py-1 px-2.5 text-center text-[11px] font-black rounded-lg border cursor-pointer uppercase transition-all whitespace-nowrap flex items-center justify-center ${
                          status === 'no_aplica'
                            ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                            : 'bg-transparent text-slate-500 border-transparent hover:text-slate-900'
                        }`}
                      >
                        • N/A
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Observaciones */}
            <div className="mt-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Observaciones del Turno / Evidencias o Hallazgos Detectados:
              </label>
              <textarea
                rows={3}
                placeholder="Detalle cualquier desvío, ruido anómalo, estado de mangueras, baterías o advertencias para el próximo turno..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </ModuleFormSection>

          {/* Sección 3: Firmas y Autorizaciones Digitales (Idéntico a ATS) */}
          <ModuleFormSection title="Firmas y Autorizaciones Reglamentarias" icon={<Pencil size={18} />}>
            {/* Switches de firmas a incluir en el documento */}
            <div className="no-print mb-6 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-3 items-center">
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                INCLUIR FIRMAS EN LA PLANILLA OFICIAL:
              </span>
              <div className="flex gap-2 flex-wrap justify-center">
                {[
                  { id: 'driver', label: 'Conductor Habilitado' },
                  { id: 'professional', label: professionalRole },
                  { id: 'supervisor', label: 'Supervisión / Responsable Planta' }
                ].map((sig) => {
                  const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                  return (
                    <button
                      key={sig.id}
                      type="button"
                      onClick={() => setShowSignatures(prev => ({ ...prev, [sig.id]: !isChecked }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isChecked
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500 shadow-xs'
                          : 'bg-transparent text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                        isChecked ? 'bg-blue-600 text-white' : 'border border-slate-400'
                      }`}>
                        {isChecked && <Check size={10} className="stroke-[3]" />}
                      </div>
                      {sig.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vista previa viva del recuadro de firmas (Idéntica a ATS) */}
            <div className="mb-6">
              <PdfSignatures
                data={pdfPayload}
                compact={false}
                box1={showSignatures.driver ? {
                  title: 'CONDUCTOR HABILITADO',
                  subtitle: (currentDriver?.fullName || 'Firma de Conductor').toUpperCase(),
                  signatureUrl: driverSignature,
                  isProfessional: false
                } : null}
                box2={showSignatures.professional ? {
                  title: professionalRole.toUpperCase(),
                  subtitle: (professionalName || 'Firma y Sello').toUpperCase(),
                  signatureUrl: professionalSignature,
                  stampUrl: professionalStamp,
                  isProfessional: true,
                  license: professionalLicense
                } : null}
                box3={showSignatures.supervisor ? {
                  title: 'SUPERVISIÓN / RESPONSABLE PLANTA',
                  subtitle: 'Aprobación de Turno',
                  signatureUrl: supervisorSignature,
                  isProfessional: false
                } : null}
              />
              <PdfBrandingFooter />
            </div>

            {/* Lienzos interactivos para firmar digitalmente */}
            <div className="no-print mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showSignatures.driver && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <SignatureCanvas
                    label={`Firma de ${currentDriver?.fullName || 'Conductor'}`}
                    initialImage={driverSignature || undefined}
                    onSave={(sig) => setDriverSignature(sig || null)}
                    height={130}
                  />
                </div>
              )}

              {showSignatures.professional && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <SignatureCanvas
                    label={`Firma y Sello de ${professionalRole}`}
                    initialImage={professionalSignature || undefined}
                    onSave={(sig) => setProfessionalSignature(sig || null)}
                    height={130}
                  />
                </div>
              )}

              {showSignatures.supervisor && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <SignatureCanvas
                    label="Firma de Supervisión / Responsable de Turno"
                    initialImage={supervisorSignature || undefined}
                    onSave={(sig) => setSupervisorSignature(sig || null)}
                    height={130}
                  />
                </div>
              )}
            </div>
          </ModuleFormSection>
        </ModuleFormDocument>

        {/* Barra de acción inferior flotante */}
        <ModuleActionBar
          actions={[
            {
              id: 'save',
              label: isMobile ? 'GUARDAR' : 'GUARDAR REGISTRO',
              icon: <Save size={18} />,
              variant: 'primary',
              onClick: () => requirePro(handleSave)
            },
            {
              id: 'preview',
              label: isMobile ? 'PREVIA' : 'PREVISUALIZAR',
              icon: <Eye size={18} />,
              variant: 'info',
              onClick: () => setShowPreviewModal(true)
            },
            {
              id: 'print',
              label: isMobile ? 'IMPRIMIR' : 'IMPRIMIR PLANILLA',
              icon: <Printer size={18} />,
              variant: 'warning',
              onClick: () => requirePro(handleDirectPrint)
            },
            {
              id: 'share',
              label: 'COMPARTIR',
              icon: <Share2 size={18} />,
              variant: 'secondary',
              onClick: () => requirePro(() => setShowShareModal(true))
            }
          ]}
        />
      </ModuleFormLayout>

      {/* Modal de Previsualización A4 en Vivo */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[960px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-800/90 select-none shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Truck size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                    Planilla de Control Pre-operacional (Res. SRT 960/15)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Formato A4 oficial idéntico al documento final impreso
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
                <ForkliftInspectionPdf
                  data={pdfPayload}
                  vehicle={currentVehicle}
                  driver={currentDriver}
                  customId="preview-pdf-forklift"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor offscreen para renderizado de impresión directa oficial */}
      <div className="ats-pdf-offscreen" id="pdf-content-forklift">
        <ForkliftInspectionPdf
          data={pdfPayload}
          vehicle={currentVehicle}
          driver={currentDriver}
          customId="pdf-sheet-forklift"
        />
      </div>

      {/* Modal para Compartir */}
      <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`Check Pre-operacional - ${currentVehicle?.internalCode || 'AE'} (${date})`}
        text={`📋 Control Pre-operacional Res. SRT 960/15\n🚜 Autoelevador: ${currentVehicle?.internalCode || ''}\n👤 Conductor: ${currentDriver?.fullName || ''}\n📅 Fecha: ${date}\n✅ Resultado: ${kpis.hasCriticalFailure ? 'BLOQUEADO' : 'APROBADO'}`}
        rawMessage={`Control Pre-operacional Res. SRT 960/15 - Autoelevador: ${currentVehicle?.internalCode} - Resultado: ${kpis.hasCriticalFailure ? 'BLOQUEADO' : 'APROBADO'}`}
        elementIdToPrint="pdf-sheet-forklift"
        fileName={`Checklist_${currentVehicle?.internalCode || 'AE'}_${date}.pdf`}
      />
    </>
  );
}
