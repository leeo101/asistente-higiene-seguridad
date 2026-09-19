import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, ArrowDown, Shield, AlertTriangle, Clock, CheckCircle2, XCircle, X, User, MapPin, Ruler, Eye, Printer, Share2, Pencil, HardHat,
  Wind, Anchor, Sparkles, Building2, FileText
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import WorkingAtHeightPdf from '../components/WorkingAtHeightPdf';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { ModuleFormLayout, ModuleFormDocument, ModuleFormSection, ModuleActionBar, ModuleFormToolbar } from '../components/module';
import WorkerMedicalChecker from '../components/WorkerMedicalChecker';
import { validateWorkerMedicalStatus } from '../utils/workerValidation';
import {
  OFFICIAL_HEIGHT_REGULATORY_LIMITS,
  calculateFallClearanceDistance,
  evaluateHeightWorkSafety
} from '../utils/srtProtocols';
import type { AnchorCertificationType } from '../types/workingAtHeight';

const WORK_TYPES = [
  { id: 'scaffolding', name: 'Andamios Tubulares / Multidireccionales', icon: '🏗️' },
  { id: 'ladder', name: 'Escaleras de Mano / Fijas', icon: '🪜' },
  { id: 'roof', name: 'Techos y Cubiertas Frágiles', icon: '🏠' },
  { id: 'platform', name: 'Plataformas Elevadoras (PEMP)', icon: '📦' },
  { id: 'lift', name: 'Guindolas / Silletas Suspendidas', icon: '⬆️' },
  { id: 'structure', name: 'Montaje de Estructuras Metálicas', icon: '🔩' },
  { id: 'rope_access', name: 'Acceso por Cuerdas / Vertical', icon: '🧗' },
  { id: 'other', name: 'Otro Trabajo en Altura', icon: '📍' }
];

const ANCHOR_TYPES: { id: AnchorCertificationType; label: string; minKn: number }[] = [
  { id: 'certified_structural_22kn', label: 'Estructural Certificado (≥ 22 kN / 5000 lbs)', minKn: 22 },
  { id: 'engineered_lifeline', label: 'Línea de Vida Horizontal/Vertical Certificada', minKn: 22 },
  { id: 'temporary_strap', label: 'Faja de Anclaje Textil IRAM/EN Certificada', minKn: 22 },
  { id: 'untested_unapproved', label: 'Punto No Ensayado / Improvisado (PROHIBIDO)', minKn: 0 }
];

export default function WorkingAtHeightForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Permiso en Altura PTSA' : 'Permiso de Trabajo en Altura Res. SRT 61/23');

  // Inicializar estado con datos patronales y parámetros técnicos
  const [permit, setPermit] = useState<any>(() => {
    const edit = location.state?.editData;
    if (edit) return edit;

    let defaultEmpresa = '';
    let defaultCuit = '';
    let defaultAddress = '';
    let defaultArt = '';
    try {
      const savedPersonal = localStorage.getItem('personalData');
      if (savedPersonal) {
        const pd = JSON.parse(savedPersonal);
        defaultEmpresa = pd.companyName || pd.empresa || '';
        defaultCuit = pd.cuit || '';
        defaultAddress = pd.address || pd.domicilio || '';
        defaultArt = pd.art || '';
      }
    } catch (e) {}

    return {
      id: '',
      cuit: defaultCuit,
      companyName: defaultEmpresa,
      establishmentAddress: defaultAddress,
      art: defaultArt,
      sector: '',
      workerName: '',
      workerDni: '',
      workType: 'scaffolding',
      location: '',
      height: '4.5',
      duration: 'Turno Mañana (08:00 a 14:00 hs)',
      priority: 'medium',
      supervisor: '',
      description: '',
      medicalFitness: true,
      rescuePlan: 'Procedimiento de descenso asistido con pértiga y línea de tracción rápida.',
      rescuePlanDefined: true,
      // Memoria de cálculo DLC
      lanyardLength: '1.80',
      deceleratorDistance: '1.20',
      workerHeight: '1.50',
      safetyMargin: '1.00',
      anchorFactor: 1, // 0 = sobre cabeza, 1 = pecho, 2 = pies
      // Anclaje
      anchorType: 'certified_structural_22kn' as AnchorCertificationType,
      anchorCapacityKn: 22,
      // Inspección pre-uso arnés
      harnessCheck: {
        webbingFreeOfCutsOrBurns: true,
        stitchingIntact: true,
        dRingUndamaged: true,
        bucklesOperateCorrectly: true,
        impactIndicatorNotTripped: true,
        lanyardDoubleWithAbsorber: true
      },
      // Clima
      weather: {
        windSpeedKmh: 18,
        hasRainOrThunderstorm: false,
        isSurfaceSlippery: false
      },
      ppe: {
        harness: true,
        lanyard: true,
        helmet: true,
        lifeline: false
      },
      observations: '',
      signature: '',
      operatorSignature: '',
      professionalSignature: '',
      supervisorSignature: '',
      showSignatures: { operator: true, professional: true, supervisor: true }
    };
  });

  const [professional, setProfessional] = useState<any>({
    name: '',
    license: '',
    signature: null,
    stamp: null
  });

  const setShowSignatures = (updater: any) => {
    setPermit((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = permit.showSignatures || { operator: true, professional: true, supervisor: true };

  useEffect(() => {
    window.scrollTo(0, 0);
    const savedData = localStorage.getItem('personalData');
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');

    let signature = legacySignature || null;
    let stamp = null;
    if (savedSigData) {
      try {
        const parsed = JSON.parse(savedSigData);
        signature = parsed.signature || signature;
        stamp = parsed.stamp || null;
      } catch (e) {
        console.error('Error parsing signatureStampData', e);
      }
    }

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setProfessional({
          name: data.name || '',
          license: data.license || '',
          signature: signature,
          stamp: stamp
        });
      } catch (e) {
        console.error('Error parsing personalData', e);
        setProfessional((prev: any) => ({ ...prev, signature, stamp }));
      }
    } else {
      setProfessional((prev: any) => ({ ...prev, signature, stamp }));
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    if (location.state?.editData) setIsEdit(true);
    return () => window.removeEventListener('resize', handleResize);
  }, [location.state]);

  // Cálculo en vivo de la Distancia Libre de Caída (DLC)
  const workHeightNum = parseFloat(permit.height) || 0;
  const liveClearance = calculateFallClearanceDistance({
    lanyardLengthM: parseFloat(permit.lanyardLength) || 1.8,
    deceleratorDistanceM: parseFloat(permit.deceleratorDistance) || 1.2,
    workerHeightM: parseFloat(permit.workerHeight) || 1.5,
    safetyMarginM: parseFloat(permit.safetyMargin) || 1.0,
    availableFallHeightM: workHeightNum
  }, permit.anchorFactor || 1);

  // Evaluación integral en vivo de seguridad
  const liveSafety = evaluateHeightWorkSafety({
    workHeightMeters: workHeightNum,
    medicalFitnessOk: permit.medicalFitness,
    anchorCapacityKn: Number(permit.anchorCapacityKn) || 0,
    anchorType: permit.anchorType,
    clearance: liveClearance,
    harness: permit.harnessCheck || {
      webbingFreeOfCutsOrBurns: true,
      stitchingIntact: true,
      dRingUndamaged: true,
      bucklesOperateCorrectly: true,
      impactIndicatorNotTripped: true,
      lanyardDoubleWithAbsorber: true
    },
    weather: permit.weather || {
      windSpeedKmh: 15,
      hasRainOrThunderstorm: false,
      isSurfaceSlippery: false
    },
    rescuePlanDefined: permit.rescuePlanDefined
  });

  const handleGenerateConclusions = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      let text = `DICTAMEN TÉCNICO DE HABILITACIÓN PARA TRABAJO EN ALTURA (RES. S.R.T. N° 61/23 & DEC. 911/96):\n\n`;

      if (liveSafety.isAuthorized) {
        text += `1. EVALUACIÓN DE DISTANCIA LIBRE DE CAÍDA (DLC): CONFORME Y SEGURA.\n`;
        text += `La altura de trabajo disponible (${workHeightNum} m) supera la DLC requerida (${liveClearance.requiredClearanceM} m) con un margen libre de seguridad de ${liveClearance.safetyMarginRemainingM} m hasta el suelo.\n\n`;
        text += `2. CONDICIONES OPERATIVAS Y ELEMENTOS DE PROTECCIÓN:\n`;
        text += `- Punto de anclaje verificado tipo ${permit.anchorType} con resistencia nominal certificada ≥ 22 kN (5000 lbs).\n`;
        text += `- Inspección pre-uso del arnés de cuerpo completo IRAM 3622-1 aprobada, sin cortes ni activación de testigo de impacto.\n`;
        text += `- Cabo doble en "Y" con absorbedor de energía de impacto para enganche continuo 100% permanente.\n`;
        text += `- Condiciones climáticas admisibles (viento ${permit.weather?.windSpeedKmh || 18} km/h ≤ 35 km/h, sin precipitaciones).\n`;
        text += `- Plan de rescate en altura conocido por el personal para evitar trauma por suspensión.\n\n`;
        text += `CONCLUSIÓN: Se autoriza la ejecución de las tareas en altura para el operario ${permit.workerName || 'designado'} durante el presente turno de trabajo.`;
      } else {
        text += `1. EVALUACIÓN TÉCNICA: NO CONFORME / TRABAJO EN ALTURA NO HABILITADO.\n`;
        liveSafety.criticalBlockers.forEach(b => {
          text += `🛑 BLOQUEO CRÍTICO: ${b}\n`;
        });
        text += `\nACCIONES CORRECTIVAS INMEDIATAS:\n`;
        text += `- No iniciar tareas por encima de 2.00 metros hasta subsanar las condiciones señaladas.\n`;
        if (!liveClearance.isClearanceSafe) {
          text += `- Utilizar línea de vida autorretráctil o elevar el anclaje para reducir la distancia libre requerida.\n`;
        }
      }

      setPermit((prev: any) => ({ ...prev, observations: text }));
      setIsGeneratingAi(false);
      toast.success('Conclusiones técnicas generadas conforme a Res. SRT 61/23');
    }, 400);
  };

  const handleSave = () => {
    if (!permit.workerName || !permit.supervisor || !permit.height) {
      toast.error('Por favor complete los campos obligatorios (*): Operario, Supervisor y Altura.');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('working_at_height_permits_db') || '[]');
    let updated;

    const saveObj = {
      ...permit,
      cuit: permit.cuit || '',
      companyName: permit.companyName || '',
      establishmentAddress: permit.establishmentAddress || permit.location || '',
      art: permit.art || '',
      dlcRequired: liveClearance.requiredClearanceM,
      isClearanceSafe: liveClearance.isClearanceSafe,
      isAuthorized: liveSafety.isAuthorized,
      signature: permit.supervisorSignature || permit.signature || '',
      supervisorSignature: permit.supervisorSignature || permit.signature || ''
    };

    if (isEdit) {
      updated = saved.map((p: any) => p.id === permit.id ? saveObj : p);
      toast.success('Permiso PTSA actualizado');
    } else {
      const newEntry = {
        ...saveObj,
        id: `ALT-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: liveSafety.isAuthorized ? 'active' : 'pending'
      };
      updated = [newEntry, ...saved];
      toast.success('Permiso PTSA generado con éxito');
    }

    localStorage.setItem('working_at_height_permits_db', JSON.stringify(updated));
    navigate('/working-at-height');
  };

  return (
    <div className="container min-h-[100vh] pb-[8rem]">
      <ModuleFormLayout>
        <ModuleFormToolbar
          title={isEdit ? 'Editar Permiso PTSA' : 'Permiso Trabajo en Altura — Res. S.R.T. N° 61/23'}
          subtitle="Protocolo Oficial de Prevención de Caídas, Anclajes 22 kN y Cálculo de DLC"
          icon={<Shield size={36} color="#ffffff" />}
        />

        <ModuleFormDocument>
          {/* Sección 1: Datos Patronales y Establecimiento */}
          <ModuleFormSection title="1. Identificación Patronal y del Establecimiento" icon={<Building2 size={20} />}>
            <div style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }} className="grid gap-[1rem] mb-[1.5rem]">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">C.U.I.T. de la Empresa *</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.cuit || ''}
                  onChange={(e) => setPermit({ ...permit, cuit: e.target.value })}
                  placeholder="30-XXXXXXXX-X"
                />
              </div>
              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Razón Social / Empleador *</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.companyName || ''}
                  onChange={(e) => setPermit({ ...permit, companyName: e.target.value })}
                  placeholder="Ej: Constructora del Plata S.A."
                />
              </div>
              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Domicilio de la Obra / Establecimiento</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.establishmentAddress || ''}
                  onChange={(e) => setPermit({ ...permit, establishmentAddress: e.target.value })}
                  placeholder="Av. Corrientes 1500, CABA"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">A.R.T.</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.art || ''}
                  onChange={(e) => setPermit({ ...permit, art: e.target.value })}
                  placeholder="Prevención ART"
                />
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 2: Datos de la Tarea y Operario */}
          <ModuleFormSection title="2. Tarea en Altura, Operario y Salud Ocupacional" icon={<User size={20} />}>
            <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1rem] mb-[1.5rem]">
              <div>
                <WorkerMedicalChecker
                  value={permit.workerName}
                  riskType="height"
                  label="Operario Asignado a Tarea en Altura *"
                  placeholder="Nombre y apellido o DNI..."
                  onChange={(val) => setPermit((prev: any) => ({ ...prev, workerName: val }))}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">D.N.I. del Operario</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.workerDni || ''}
                  onChange={(e) => setPermit({ ...permit, workerDni: e.target.value })}
                  placeholder="Ej: 34.567.890"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Sistema / Tarea en Altura</label>
                <select
                  className="input-professional"
                  value={permit.workType}
                  onChange={(e) => setPermit({ ...permit, workType: e.target.value })}
                >
                  {WORK_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Ubicación / Sector de la Obra *</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.location}
                  onChange={(e) => setPermit({ ...permit, location: e.target.value })}
                  placeholder="Ej: Fachada Este - Piso 5"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Altura de Caída Libre Disponible (m) *</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-professional font-black text-lg"
                  value={permit.height}
                  onChange={(e) => setPermit({ ...permit, height: e.target.value })}
                  placeholder="Ej: 4.5"
                />
                <span className="text-[10px] text-slate-500 font-bold mt-0.5 block">
                  Obligatorio a partir de 2.00 m (Dec. 911/96 Art. 54)
                </span>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Supervisor de Trabajo Habilitante *</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.supervisor}
                  onChange={(e) => setPermit({ ...permit, supervisor: e.target.value })}
                  placeholder="Nombre del supervisor o capataz..."
                />
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 3: Calculadora en Vivo de Distancia Libre de Caída (DLC) */}
          <ModuleFormSection title="3. Memoria de Cálculo de Distancia Libre de Caída (DLC)" icon={<Ruler size={20} />}>
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-600 block mb-2">
                Fórmula Técnica Oficial: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-amber-900">DLC = L_cabo + D_absorbedor + H_operario + Margen</code>
              </span>
              <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }} className="grid gap-[0.75rem]">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block mb-1 text-[11px] font-black text-slate-700">LONGITUD CABO (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    className="input-professional font-bold"
                    value={permit.lanyardLength}
                    onChange={(e) => setPermit({ ...permit, lanyardLength: e.target.value })}
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">Máx. 1.80m IRAM</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block mb-1 text-[11px] font-black text-slate-700">ELONGACIÓN ABSORBEDOR (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    className="input-professional font-bold"
                    value={permit.deceleratorDistance}
                    onChange={(e) => setPermit({ ...permit, deceleratorDistance: e.target.value })}
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">Típico 1.20m</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block mb-1 text-[11px] font-black text-slate-700">ESTATURA OPERARIO (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    className="input-professional font-bold"
                    value={permit.workerHeight}
                    onChange={(e) => setPermit({ ...permit, workerHeight: e.target.value })}
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">Argolla a pies (~1.50m)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block mb-1 text-[11px] font-black text-slate-700">MARGEN LIBRE SUELO (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    className="input-professional font-bold"
                    value={permit.safetyMargin}
                    onChange={(e) => setPermit({ ...permit, safetyMargin: e.target.value })}
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">Mínimo 1.00m</span>
                </div>
              </div>
            </div>

            {/* Resultado de la Distancia Libre de Caída en Vivo */}
            <div className={`p-4 rounded-xl border mb-6 transition-all ${
              liveClearance.isClearanceSafe
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  {liveClearance.isClearanceSafe ? (
                    <CheckCircle2 size={20} className="text-emerald-700" />
                  ) : (
                    <XCircle size={20} className="text-rose-700" />
                  )}
                  <span>DLC REQUERIDA: {liveClearance.requiredClearanceM} m | DISPONIBLE: {workHeightNum} m</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase text-white ${
                  liveClearance.isClearanceSafe ? 'bg-emerald-700' : 'bg-rose-700'
                }`}>
                  {liveClearance.isClearanceSafe ? 'ESPACIO LIBRE SEGURO' : 'DISTANCIA INSUFICIENTE'}
                </span>
              </div>
              <p className="text-xs font-semibold leading-relaxed m-0">{liveClearance.recommendation}</p>
              {liveClearance.warning && (
                <p className="text-xs font-bold text-rose-800 mt-2 m-0">{liveClearance.warning}</p>
              )}
            </div>
          </ModuleFormSection>

          {/* Sección 4: Anclajes Certificados y Check pre-uso de Arnés */}
          <ModuleFormSection title="4. Punto de Anclaje (22 kN) y Verificación de Arnés" icon={<Anchor size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Anclaje */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-black text-xs text-slate-800 uppercase mb-3 flex items-center gap-1.5">
                  <Anchor size={15} className="text-amber-700" />
                  Punto de Anclaje (Res. SRT 61/23 e IRAM 3626)
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-600 uppercase">Tipo de Anclaje</label>
                    <select
                      className="input-professional text-xs"
                      value={permit.anchorType}
                      onChange={(e) => setPermit({ ...permit, anchorType: e.target.value })}
                    >
                      {ANCHOR_TYPES.map((a) => (
                        <option key={a.id} value={a.id}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-600 uppercase">Capacidad Certificada (kN)</label>
                    <input
                      type="number"
                      className="input-professional"
                      value={permit.anchorCapacityKn}
                      onChange={(e) => setPermit({ ...permit, anchorCapacityKn: e.target.value })}
                    />
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">
                      Mínimo legal obligatorio: 22 kN (5000 lbf / 2260 kg)
                    </span>
                  </div>
                </div>
              </div>

              {/* Check Arnés */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-black text-xs text-slate-800 uppercase mb-3 flex items-center gap-1.5">
                  <Shield size={15} className="text-emerald-700" />
                  Inspección Pre-Uso de Arnés (IRAM 3622-1)
                </h4>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.harnessCheck?.webbingFreeOfCutsOrBurns || false}
                      onChange={(e) => setPermit({ ...permit, harnessCheck: { ...permit.harnessCheck, webbingFreeOfCutsOrBurns: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Cintas textiles libres de cortes, quemaduras o abrasión</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.harnessCheck?.stitchingIntact || false}
                      onChange={(e) => setPermit({ ...permit, harnessCheck: { ...permit.harnessCheck, stitchingIntact: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Costuras de seguridad intactas sin hilos sueltos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.harnessCheck?.impactIndicatorNotTripped || false}
                      onChange={(e) => setPermit({ ...permit, harnessCheck: { ...permit.harnessCheck, impactIndicatorNotTripped: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Testigo de caída NO activado (arnés sin impacto previo)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.harnessCheck?.lanyardDoubleWithAbsorber || false}
                      onChange={(e) => setPermit({ ...permit, harnessCheck: { ...permit.harnessCheck, lanyardDoubleWithAbsorber: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Cabo doble en "Y" con absorbedor (100% enganche continuo)</span>
                  </label>
                </div>
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 5: Clima y Plan de Rescate en Altura */}
          <ModuleFormSection title="5. Clima y Plan de Rescate (Res. SRT 61/23 Art. 9)" icon={<Wind size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-black text-xs text-slate-800 uppercase mb-3 flex items-center gap-1.5">
                  <Wind size={15} className="text-blue-700" />
                  Condiciones Meteorológicas
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-600 uppercase">Velocidad del Viento (km/h)</label>
                    <input
                      type="number"
                      className="input-professional"
                      value={permit.weather?.windSpeedKmh || ''}
                      onChange={(e) => setPermit({ ...permit, weather: { ...permit.weather, windSpeedKmh: parseFloat(e.target.value) || 0 } })}
                    />
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">
                      Límite legal: máx. 35 km/h. Suspender tareas si se supera.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.weather?.hasRainOrThunderstorm || false}
                      onChange={(e) => setPermit({ ...permit, weather: { ...permit.weather, hasRainOrThunderstorm: e.target.checked } })}
                      className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span className="text-rose-700">Lluvia o Tormenta Eléctrica activa (PROHIBIDO TRABAJAR)</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-black text-xs text-slate-800 uppercase mb-3 flex items-center gap-1.5">
                  <Shield size={15} className="text-amber-700" />
                  Plan de Rescate y Trauma por Suspensión
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.rescuePlanDefined || false}
                      onChange={(e) => setPermit({ ...permit, rescuePlanDefined: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Procedimiento de rescate definido y medios disponibles in-situ</span>
                  </label>
                  <textarea
                    className="input-professional text-xs min-h-[70px]"
                    value={permit.rescuePlan || ''}
                    onChange={(e) => setPermit({ ...permit, rescuePlan: e.target.value })}
                    placeholder="Detallar medios de descenso rápido, pértiga, escalera o brigada interna..."
                  />
                </div>
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 6: Conclusiones y Dictamen */}
          <ModuleFormSection title="6. Conclusiones y Dictamen Técnico Oficial" icon={<FileText size={20} />}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-600">Redacción formal según criterios de la Res. SRT 61/23:</span>
              <button
                type="button"
                onClick={handleGenerateConclusions}
                disabled={isGeneratingAi}
                className="btn-outline flex items-center gap-1.5 text-xs py-1 px-3 bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                <Sparkles size={14} className="text-amber-600" />
                <span>{isGeneratingAi ? 'Redactando...' : 'Generar Conclusiones Automáticas'}</span>
              </button>
            </div>
            <textarea
              className="input-professional min-h-[140px] font-mono text-xs leading-relaxed"
              value={permit.observations || ''}
              onChange={(e) => setPermit({ ...permit, observations: e.target.value })}
              placeholder="El dictamen técnico fundamentará la habilitación del trabajo en altura según cálculo de DLC, anclaje de 22 kN y condiciones climáticas..."
            />
          </ModuleFormSection>

          {/* Sección 7: Firmas Tripartitas */}
          <div className="mt-8">
            <ModuleFormSection title="7. Firmas Reglamentarias Tripartitas" icon={<Pencil size={20} />}>
              <div className="no-print mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3 items-center">
                <div className="text-slate-700 font-extrabold text-xs uppercase tracking-wider">
                  Firmas a incluir en el Permiso de Trabajo:
                </div>
                <div className="flex gap-4 flex-wrap justify-center text-xs font-bold">
                  {[
                    { id: 'operator', label: 'Operario en Altura' },
                    { id: 'professional', label: 'Responsable HyS' },
                    { id: 'supervisor', label: 'Supervisor de Trabajo' }
                  ].map((sig) => {
                    const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                    return (
                      <label
                        key={sig.id}
                        className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                        />
                        <span>{sig.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Visualización de los bloques de firmas */}
              <div className="mb-6">
                <PdfSignatures
                  data={{
                    ...permit,
                    professionalSignature: professional.signature,
                    professionalName: professional.name,
                    professionalLicense: professional.license,
                    professionalStamp: professional.stamp
                  }}
                  box1={
                    showSignatures.operator
                      ? {
                          title: 'OPERARIO AUTORIZADO',
                          subtitle: (permit.workerName || 'Trabajador en Altura').toUpperCase(),
                          signatureUrl: permit.operatorSignature || permit.signature || null,
                          isProfessional: false
                        }
                      : null
                  }
                  box2={
                    showSignatures.professional
                      ? {
                          title: 'RESPONSABLE HIGIENE Y SEGURIDAD',
                          subtitle: (professional.name || 'Especialista HyS').toUpperCase(),
                          signatureUrl: permit.professionalSignature || professional.signature || null,
                          stampUrl: permit.professionalStamp || professional.stamp || null,
                          isProfessional: true,
                          license: professional.license
                        }
                      : null
                  }
                  box3={
                    showSignatures.supervisor
                      ? {
                          title: 'SUPERVISOR HABILITANTE',
                          subtitle: (permit.supervisor || 'Supervisor de Trabajo').toUpperCase(),
                          signatureUrl: permit.supervisorSignature || null,
                          isProfessional: false
                        }
                      : null
                  }
                />
              </div>

              {/* Dibujo interactivo de firmas */}
              <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                {showSignatures.operator && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Firma del Operario:</label>
                    <SignatureCanvas
                      onSave={(sig) => setPermit((prev: any) => ({ ...prev, operatorSignature: sig || '', signature: sig || '' }))}
                      initialImage={permit.operatorSignature || permit.signature}
                      label="Firma del Operario"
                    />
                  </div>
                )}

                {showSignatures.professional && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Firma Especialista HyS:</label>
                    <SignatureCanvas
                      onSave={(sig) => setPermit((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                      initialImage={permit.professionalSignature || professional.signature}
                      label="Firma de HyS"
                    />
                  </div>
                )}

                {showSignatures.supervisor && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Firma del Supervisor:</label>
                    <SignatureCanvas
                      onSave={(sig) => setPermit((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                      initialImage={permit.supervisorSignature}
                      label="Firma del Supervisor"
                    />
                  </div>
                )}
              </div>
            </ModuleFormSection>
          </div>
        </ModuleFormDocument>
      </ModuleFormLayout>

      <ModuleActionBar
        actions={[
          { id: 'cancel', label: 'VOLVER', icon: <ArrowLeft size={18} />, variant: 'secondary', onClick: () => navigate(-1) },
          { id: 'share', label: 'COMPARTIR', icon: <Share2 size={18} />, variant: 'info', onClick: () => setShowShareModal(true) },
          { id: 'save', label: 'GENERAR PERMISO PTSA', icon: <Save size={18} />, variant: 'primary', onClick: (e: any) => { e.preventDefault(); requirePro(handleSave); } }
        ]}
      />

      <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Permiso de Trabajo Seguro en Altura (PTSA)"
        text={`Permiso PTSA Res. SRT 61/23: ${permit.workerName || 'Operario'}`}
        rawMessage={`Permiso PTSA Res. SRT 61/23: ${permit.workerName || 'Operario'}`}
        fileName={`Permiso_PTSA_${permit.workerName ? permit.workerName.replace(/\s+/g, '_') : 'Altura'}.pdf`}
      />

      <div className="print-only fixed left-0 opacity-[0.01] top-0 pointer-events-none">
        <WorkingAtHeightPdf data={{ ...permit, createdAt: permit.createdAt || new Date().toISOString() }} />
      </div>
    </div>
  );
}