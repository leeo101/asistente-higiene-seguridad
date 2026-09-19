import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, Tent, ClipboardCheck, CheckCircle2,
  Eye, Printer, Share2, AlertTriangle, XCircle,
  User, Users, Shield, Wind, Droplets, Thermometer,
  Activity, ShieldCheck, AlertCircle, Plus, Trash2, Pencil, X, Check,
  Sparkles, Wrench, Building2, MapPin, Clock, FileText
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import ConfinedSpacePdf from '../components/ConfinedSpacePdf';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { ModuleFormLayout, ModuleFormDocument, ModuleFormSection, ModuleActionBar, ModuleFormToolbar } from '../components/module';
import { validateWorkerMedicalStatus } from '../utils/workerValidation';
import WorkerMedicalChecker from '../components/WorkerMedicalChecker';
import {
  OFFICIAL_CONFINED_SPACE_ATMOSPHERIC_LIMITS,
  evaluateAtmosphericConditions,
  evaluateConfinedSpaceReadiness
} from '../utils/srtProtocols';
import type { AtmosphericGasReading, GasStratum } from '../types/confinedSpace';

// Tipos de recintos confinados
const CONFINED_SPACE_TYPES = [
  { id: 'tank', name: 'Tanque de Almacenamiento', icon: '🛢️' },
  { id: 'vessel', name: 'Recipiente a Presión / Reactor', icon: '📦' },
  { id: 'silo', name: 'Silo / Tolva', icon: '🏭' },
  { id: 'pit', name: 'Fosa / Pozo Profundo', icon: '⬇️' },
  { id: 'tunnel', name: 'Túnel / Conducto Subterráneo', icon: '🚇' },
  { id: 'sewer', name: 'Alcantarilla / Red Pluvial', icon: '🕳️' },
  { id: 'manhole', name: 'Cámara de Inspección / Manhole', icon: '⭕' },
  { id: 'other', name: 'Otro Recinto Confinado', icon: '📍' }
];

const POTENTIAL_HAZARDS = [
  { id: 'atmospheric', name: 'Atmosférico Peligroso', icon: '💨' },
  { id: 'engulfment', name: 'Atrapamiento / Hundimiento', icon: '🌊' },
  { id: 'configuration', name: 'Configuración Interna Atrapante', icon: '📐' },
  { id: 'electrical', name: 'Riesgo Eléctrico / Tensión', icon: '⚡' },
  { id: 'mechanical', name: 'Piezas Móviles / Mecánico', icon: '🔧' },
  { id: 'thermal', name: 'Estrés Térmico (Calor/Frío)', icon: '🔥' },
  { id: 'noise', name: 'Ruido y Resonancia', icon: '🔊' },
  { id: 'fall', name: 'Caída de Altura / Desnivel', icon: '⬇️' },
  { id: 'chemical', name: 'Contacto con Químicos / Corrosivo', icon: '🧪' },
  { id: 'biological', name: 'Agentes Biológicos / Aguas Servidas', icon: '🦠' }
];

const STRATA_OPTIONS: { id: GasStratum; label: string; desc: string }[] = [
  { id: 'general', label: 'General / Puntos Múltiples', desc: 'Muestreo global preliminar' },
  { id: 'piso', label: 'Piso / Fondo (Gases Pesados)', desc: 'Crítico para H2S (densidad 1.19), CO2, vapores de hidrocarburos' },
  { id: 'medio', label: 'Centro / Altura Respiración', desc: 'Crítico para CO (densidad 0.97, similar al aire)' },
  { id: 'techo', label: 'Techo / Superior (Gases Livianos)', desc: 'Crítico para Metano CH4 (densidad 0.55), Hidrógeno' }
];

export default function ConfinedSpaceForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Permiso Espacio Confinado' : 'Permiso Espacio Confinado Res. SRT 953/10');

  // Inicializar estado con datos patronales y normativos
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
      spaceName: '',
      spaceType: 'tank',
      internalVolumeM3: '',
      location: '',
      department: '',
      description: '',
      duration: 'Jornada Continua (Máx. 8 horas)',
      createdAt: new Date().toISOString(),
      hazards: ['atmospheric'],
      team: {
        entrants: [],
        attendant: '',
        supervisor: '',
        rescue: 'Servicio de Intervención Rápida Interno'
      },
      instrument: {
        brand: 'Industrial Scientific / RAE',
        model: 'Ventis Pro 5 / QRAE 3',
        serialNumber: 'SN-2024-',
        calibrationDate: new Date().toISOString().split('T')[0],
        bumpTestVerified: true
      },
      gasMonitoring: {
        o2: '20.9',
        lel: '0',
        co: '0',
        h2s: '0',
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        stratum: 'general' as GasStratum
      },
      isolation: {
        valvesClosedAndLocked: true,
        blindFlangesInstalled: true,
        electricalLockoutApplied: true,
        linesPurgedAndCleaned: true,
        mechanicalDrivesDeenergized: true
      },
      ventilation: {
        natural: false,
        forced: true,
        extractive: false,
        continuous: true
      },
      rescue: {
        tripodAndWinchAvailable: true,
        fullBodyHarnessClassAorE: true,
        retractableLifeline: true,
        standbySCBAAvailable: true,
        directCommunicationTested: true
      },
      observations: '',
      operatorName: '',
      operatorSignature: '',
      supervisorName: '',
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

    if (location.state?.editData) {
      setIsEdit(true);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [location.state]);

  // Evaluación en tiempo real de la atmósfera (Res. SRT 953/10 y Res. 295/03)
  const currentAtmosphericEvaluation = evaluateAtmosphericConditions({
    o2: parseFloat(permit.gasMonitoring?.o2) || 0,
    lel: parseFloat(permit.gasMonitoring?.lel) || 0,
    co: parseFloat(permit.gasMonitoring?.co) || 0,
    h2s: parseFloat(permit.gasMonitoring?.h2s) || 0,
    stratum: permit.gasMonitoring?.stratum || 'general'
  });

  const toggleHazard = (hazardId: string) => {
    const updated = permit.hazards?.includes(hazardId)
      ? permit.hazards.filter((h: string) => h !== hazardId)
      : [...(permit.hazards || []), hazardId];
    setPermit({ ...permit, hazards: updated });
  };

  const addTeamMember = (role: string, name: string) => {
    if (role === 'entrant') {
      setPermit({
        ...permit,
        team: { ...permit.team, entrants: [...(permit.team?.entrants || []), name] }
      });
    } else {
      setPermit({
        ...permit,
        team: { ...permit.team, [role]: name }
      });
    }
  };

  // Generador inteligente de conclusiones técnicas
  const handleGenerateConclusions = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const isAtmSafe = currentAtmosphericEvaluation.isSafeToEnter;
      const gas = permit.gasMonitoring;
      const spaceName = permit.spaceName || 'recinto confinado';

      let text = `DICTAMEN TÉCNICO DE HABILITACIÓN PARA ESPACIOS CONFINADOS (RES. S.R.T. N° 953/10):\n\n`;

      if (isAtmSafe) {
        text += `1. EVALUACIÓN ATMOSFÉRICA PRE-INGRESO: APROBADA Y SEGURA.\n`;
        text += `Los parámetros medidos con detector calibrado in-situ arrojan O2: ${gas.o2}%, LEL: ${gas.lel}%, CO: ${gas.co} ppm (CMP ≤ 25 ppm Res. 295/03), H2S: ${gas.h2s} ppm (CMP ≤ 10 ppm Res. 295/03) en estrato ${gas.stratum ? gas.stratum.toUpperCase() : 'GENERAL'}. La atmósfera es respirable y no explosiva.\n\n`;
        text += `2. CONDICIONES OPERATIVAS Y MEDIDAS DE CONTROL:\n`;
        text += `- Se verificó el enclavamiento y bloqueo LOTO de tuberías, bridas ciegas y corte de energía motriz en ${spaceName}.\n`;
        text += `- Se mantiene ventilación mecánica forzada continua y monitoreo permanente durante la permanencia de los trabajadores.\n`;
        text += `- El Vigía exterior permanente (Standby) permanece apostado en la boca de acceso con comunicación radial ininterrumpida y prohibición taxativa de ingreso.\n`;
        text += `- Sistema de rescate exterior listo (trípode, malacate retráctil y arnés integral).\n\n`;
        text += `CONCLUSIÓN: Se autoriza el ingreso de los trabajadores habilitados para la tarea designada con vigencia única para el presente turno.`;
      } else {
        text += `1. EVALUACIÓN ATMOSFÉRICA PRE-INGRESO: NO CONFORME / PROHIBICIÓN DE INGRESO.\n`;
        text += `Parámetros medidos: O2: ${gas.o2}%, LEL: ${gas.lel}%, CO: ${gas.co} ppm, H2S: ${gas.h2s} ppm.\n`;
        currentAtmosphericEvaluation.warnings.forEach(w => {
          text += `- ALERTA CRÍTICA: ${w}\n`;
        });
        text += `\nACCIONES CORRECTIVAS INMEDIATAS:\n`;
        text += `- Forzar ventilación mecánica continua durante 30 minutos.\n`;
        text += `- Reevaluar la estratificación (piso, centro y techo) antes de emitir cualquier habilitación.\n`;
        text += `- Prohibido el ingreso de personal bajo las condiciones actuales (Res. SRT 953/10).`;
      }

      setPermit((prev: any) => ({ ...prev, observations: text }));
      setIsGeneratingAi(false);
      toast.success('Conclusiones técnicas generadas conforme a Res. SRT 953/10');
    }, 400);
  };

  const handleSave = () => {
    if (!permit.spaceName || !permit.team?.attendant || !permit.team?.supervisor) {
      toast.error('Complete los campos obligatorios (*): Nombre del recinto, Vigía exterior y Supervisor.');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('confined_space_permits_db') || '[]');
    let updated;

    const saveObj = {
      ...permit,
      cuit: permit.cuit || '',
      companyName: permit.companyName || '',
      establishmentAddress: permit.establishmentAddress || permit.location || '',
      art: permit.art || '',
      signature: permit.supervisorSignature || permit.signature || '',
      supervisorSignature: permit.supervisorSignature || permit.signature || '',
      atmosphericStatus: currentAtmosphericEvaluation.status,
      isSafeToEnter: currentAtmosphericEvaluation.isSafeToEnter
    };

    if (isEdit) {
      updated = saved.map((p: any) => p.id === permit.id ? saveObj : p);
      toast.success('Permiso PTSEC actualizado');
    } else {
      const newEntry = {
        ...saveObj,
        id: `CS-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: currentAtmosphericEvaluation.isSafeToEnter ? 'active' : 'pending'
      };
      updated = [newEntry, ...saved];
      toast.success('Permiso PTSEC generado con éxito');
    }

    localStorage.setItem('confined_space_permits_db', JSON.stringify(updated));
    navigate('/confined-space');
  };

  return (
    <div className="container min-h-[100vh] pb-[8rem]">
      <ModuleFormLayout>
        <ModuleFormToolbar
          title={isEdit ? 'Editar Permiso PTSEC' : 'Permiso Espacios Confinados — Res. S.R.T. N° 953/10'}
          subtitle="Protocolo Oficial de Ingreso Seguro, Evaluación Atmosférica y Control LOTO"
          icon={<Tent size={36} color="#ffffff" />}
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
                  placeholder="Ej: Acindar S.A. / Cervecería Quilmes"
                />
              </div>
              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Domicilio del Establecimiento / Planta</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.establishmentAddress || ''}
                  onChange={(e) => setPermit({ ...permit, establishmentAddress: e.target.value })}
                  placeholder="Ruta 9 Km 280, Parque Industrial"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Aseguradora de Riesgos del Trabajo (A.R.T.)</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.art || ''}
                  onChange={(e) => setPermit({ ...permit, art: e.target.value })}
                  placeholder="Prevención ART / La Segunda"
                />
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 2: Identificación del Recinto Confinado */}
          <ModuleFormSection title="2. Recinto Confinado y Tarea Planificada" icon={<ClipboardCheck size={20} />}>
            <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1rem] mb-[1.5rem]">
              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Nombre / Identificación del Espacio *</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.spaceName}
                  onChange={(e) => setPermit({ ...permit, spaceName: e.target.value })}
                  placeholder="Ej: Tanque de Almacenamiento T-101 / Fosa Decantadora N° 2"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Tipo de Recinto Confinado</label>
                <select
                  className="input-professional"
                  value={permit.spaceType}
                  onChange={(e) => setPermit({ ...permit, spaceType: e.target.value })}
                >
                  {CONFINED_SPACE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Sector / Ubicación Interna *</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.location}
                  onChange={(e) => setPermit({ ...permit, location: e.target.value })}
                  placeholder="Ej: Nave 4, Sector Tanques"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Volumen Interno Estimado (m³)</label>
                <input
                  type="number"
                  className="input-professional"
                  value={permit.internalVolumeM3 || ''}
                  onChange={(e) => setPermit({ ...permit, internalVolumeM3: e.target.value })}
                  placeholder="Ej: 85"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Vigencia del Permiso (Turno / Horas)</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.duration || ''}
                  onChange={(e) => setPermit({ ...permit, duration: e.target.value })}
                  placeholder="Ej: Turno Mañana (08:00 a 14:00 hs)"
                />
              </div>
              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Descripción de la Tarea a Ejecutar</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.description}
                  onChange={(e) => setPermit({ ...permit, description: e.target.value })}
                  placeholder="Limpieza de sedimentos, inspección no destructiva por ultrasonido, cambio de empaquetaduras..."
                />
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 3: Instrumental de Medición Multigás */}
          <ModuleFormSection title="3. Instrumental Detector Multigás Certificado" icon={<Activity size={20} />}>
            <div style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)' }} className="grid gap-[1rem] mb-[1.5rem]">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Marca</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.instrument?.brand || ''}
                  onChange={(e) => setPermit({ ...permit, instrument: { ...permit.instrument, brand: e.target.value } })}
                  placeholder="Industrial Scientific"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Modelo</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.instrument?.model || ''}
                  onChange={(e) => setPermit({ ...permit, instrument: { ...permit.instrument, model: e.target.value } })}
                  placeholder="Ventis Pro 5"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">N° de Serie</label>
                <input
                  type="text"
                  className="input-professional"
                  value={permit.instrument?.serialNumber || ''}
                  onChange={(e) => setPermit({ ...permit, instrument: { ...permit.instrument, serialNumber: e.target.value } })}
                  placeholder="SN-982143"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Fecha Calibración</label>
                <input
                  type="date"
                  className="input-professional"
                  value={permit.instrument?.calibrationDate || ''}
                  onChange={(e) => setPermit({ ...permit, instrument: { ...permit.instrument, calibrationDate: e.target.value } })}
                />
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 4: Monitoreo Atmosférico en Vivo con Estratificación */}
          <ModuleFormSection title="4. Monitoreo Atmosférico Oficial (Res. SRT 953/10 y Res. 295/03)" icon={<Wind size={20} />}>
            <div className="mb-4">
              <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase">Nivel / Estratificación de la Medición:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {STRATA_OPTIONS.map((stratum) => (
                  <button
                    key={stratum.id}
                    type="button"
                    onClick={() => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, stratum: stratum.id } })}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      permit.gasMonitoring?.stratum === stratum.id
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">{stratum.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{stratum.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)' }} className="grid gap-[1rem] mb-[1.5rem]">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block mb-1 text-xs font-black text-slate-700">OXÍGENO (O₂ %)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-professional font-black text-lg"
                  value={permit.gasMonitoring?.o2 ?? ''}
                  onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, o2: e.target.value } })}
                  placeholder="20.9"
                />
                <span className="text-[10px] font-bold text-slate-500 mt-1 block">Límite: 19.5% – 23.5%</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block mb-1 text-xs font-black text-slate-700">INFLAMABILIDAD (LEL %)</label>
                <input
                  type="number"
                  step="1"
                  className="input-professional font-black text-lg"
                  value={permit.gasMonitoring?.lel ?? ''}
                  onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, lel: e.target.value } })}
                  placeholder="0"
                />
                <span className="text-[10px] font-bold text-slate-500 mt-1 block">Límite: ≤ 10% LEL</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block mb-1 text-xs font-black text-slate-700">MONÓXIDO (CO ppm)</label>
                <input
                  type="number"
                  step="1"
                  className="input-professional font-black text-lg"
                  value={permit.gasMonitoring?.co ?? ''}
                  onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, co: e.target.value } })}
                  placeholder="0"
                />
                <span className="text-[10px] font-bold text-slate-500 mt-1 block">CMP Argentina: ≤ 25 ppm</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block mb-1 text-xs font-black text-slate-700">SULFÍDRICO (H₂S ppm)</label>
                <input
                  type="number"
                  step="1"
                  className="input-professional font-black text-lg"
                  value={permit.gasMonitoring?.h2s ?? ''}
                  onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, h2s: e.target.value } })}
                  placeholder="0"
                />
                <span className="text-[10px] font-bold text-slate-500 mt-1 block">CMP Argentina: ≤ 10 ppm</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block mb-1 text-xs font-black text-slate-700">HORA CONTROL</label>
                <input
                  type="time"
                  className="input-professional font-bold"
                  value={permit.gasMonitoring?.time || ''}
                  onChange={(e) => setPermit({ ...permit, gasMonitoring: { ...permit.gasMonitoring, time: e.target.value } })}
                />
                <span className="text-[10px] font-bold text-slate-500 mt-1 block">Monitoreo continuo</span>
              </div>
            </div>

            {/* Panel de Dictamen Atmosférico en Vivo */}
            <div className={`p-4 rounded-xl border mb-6 transition-all ${
              currentAtmosphericEvaluation.isSafeToEnter
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : currentAtmosphericEvaluation.status === 'CRITICO_PROHIBIDO_INGRESO'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  {currentAtmosphericEvaluation.isSafeToEnter ? (
                    <CheckCircle2 size={20} className="text-emerald-700" />
                  ) : (
                    <XCircle size={20} className="text-rose-700" />
                  )}
                  <span>ESTADO ATMOSFÉRICO: {currentAtmosphericEvaluation.status}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase text-white ${
                  currentAtmosphericEvaluation.isSafeToEnter ? 'bg-emerald-700' : 'bg-rose-700'
                }`}>
                  {currentAtmosphericEvaluation.isSafeToEnter ? 'HABILITADO PARA INGRESO' : 'NO HABILITADO / PROHIBIDO'}
                </span>
              </div>

              {currentAtmosphericEvaluation.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {currentAtmosphericEvaluation.warnings.map((w, idx) => (
                    <div key={idx} className="text-xs font-bold text-rose-800 flex items-start gap-1.5">
                      <span>•</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 text-xs font-semibold text-slate-700 space-y-0.5 border-t border-slate-200/60 pt-2">
                {currentAtmosphericEvaluation.recommendations.map((r, idx) => (
                  <div key={idx}>{r}</div>
                ))}
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 5: Verificación de Aislamiento LOTO y Ventilación */}
          <ModuleFormSection title="5. Aislamiento LOTO y Ventilación Forzada (Res. SRT 953/10)" icon={<Wrench size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* LOTO */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-black text-xs text-slate-800 uppercase mb-3 flex items-center gap-1.5">
                  <Wrench size={15} className="text-amber-700" />
                  Bloqueo, Enclavamiento y Purga (LOTO)
                </h4>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.isolation?.valvesClosedAndLocked || false}
                      onChange={(e) => setPermit({ ...permit, isolation: { ...permit.isolation, valvesClosedAndLocked: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Válvulas de fluidos cerradas y bloqueadas con candado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.isolation?.blindFlangesInstalled || false}
                      onChange={(e) => setPermit({ ...permit, isolation: { ...permit.isolation, blindFlangesInstalled: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Bridas ciegas / desconexión física de tuberías instaladas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.isolation?.electricalLockoutApplied || false}
                      onChange={(e) => setPermit({ ...permit, isolation: { ...permit.isolation, electricalLockoutApplied: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Corte y enclavamiento de energía motriz / eléctrica (LOTO)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.isolation?.linesPurgedAndCleaned || false}
                      onChange={(e) => setPermit({ ...permit, isolation: { ...permit.isolation, linesPurgedAndCleaned: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Recinto y cañerías purgadas, desgasificadas y lavadas</span>
                  </label>
                </div>
              </div>

              {/* Ventilación y Rescate */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-black text-xs text-slate-800 uppercase mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-700" />
                  Ventilación y Rescate sin Ingreso Asistido
                </h4>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.ventilation?.forced || false}
                      onChange={(e) => setPermit({ ...permit, ventilation: { ...permit.ventilation, forced: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Ventilación mecánica forzada continua en funcionamiento</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.rescue?.tripodAndWinchAvailable || false}
                      onChange={(e) => setPermit({ ...permit, rescue: { ...permit.rescue, tripodAndWinchAvailable: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Trípode con malacate de izaje y cable de acero certificado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.rescue?.fullBodyHarnessClassAorE || false}
                      onChange={(e) => setPermit({ ...permit, rescue: { ...permit.rescue, fullBodyHarnessClassAorE: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Arnés integral clase E/A y cabo de rescate colocado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permit.rescue?.directCommunicationTested || false}
                      onChange={(e) => setPermit({ ...permit, rescue: { ...permit.rescue, directCommunicationTested: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Canal de comunicación directa radial o visual probado</span>
                  </label>
                </div>
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 6: Personal Asignado y Roles Reglamentarios */}
          <ModuleFormSection title="6. Personal Asignado y Roles (Res. SRT 953/10)" icon={<Users size={20} />}>
            <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[1.5rem] mb-[2rem]">
              <div>
                <label className="block mb-2 text-xs font-bold text-slate-700 uppercase">Entrante(s) Autorizado(s) con Apto Médico</label>
                <div className="flex gap-[0.5rem] mb-[0.5rem]">
                  <input
                    id="entrant-input"
                    type="text"
                    className="input-professional"
                    placeholder="Nombre completo y DNI..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          addTeamMember('entrant', val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('entrant-input') as HTMLInputElement;
                      const val = input.value.trim();
                      if (val) {
                        addTeamMember('entrant', val);
                        input.value = '';
                      }
                    }}
                    className="p-[0_0.75rem] h-[48px] rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {permit.team?.entrants?.map((entrant: string, idx: number) => {
                    const med = validateWorkerMedicalStatus(entrant, 'confined');
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border flex items-center justify-between gap-2"
                        style={{
                          background: med.status === 'apto' ? '#f0fdf4' : '#fffbeb',
                          borderColor: med.status === 'apto' ? '#86efac' : '#fde68a'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">{entrant}</span>
                          <span className="text-[11px] font-bold text-slate-600">({med.message})</span>
                        </div>
                        <Trash2
                          size={16}
                          onClick={() => {
                            const updated = permit.team.entrants.filter((_: any, i: number) => i !== idx);
                            setPermit({ ...permit, team: { ...permit.team, entrants: updated } });
                          }}
                          className="cursor-pointer text-rose-500 hover:text-rose-700 shrink-0"
                        />
                      </div>
                    );
                  })}
                  {(!permit.team?.entrants || permit.team.entrants.length === 0) && (
                    <div className="text-xs text-slate-400 italic">No se agregaron entrantes aún.</div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-amber-900 uppercase">
                      Vigía Exterior Permanente (Standby) *
                    </label>
                    <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                      NO DEBE INGRESAR
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input-professional"
                    value={permit.team?.attendant || ''}
                    onChange={(e) => setPermit({ ...permit, team: { ...permit.team, attendant: e.target.value } })}
                    placeholder="Nombre completo del Vigía..."
                  />
                  <span className="text-[10px] text-amber-800 font-semibold block mt-1">
                    Obligatorio: Permanecer en el acceso durante toda la maniobra sin abandonar el puesto.
                  </span>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-bold text-slate-700 uppercase">Supervisor de Entrada Autorizante *</label>
                  <input
                    type="text"
                    className="input-professional"
                    value={permit.team?.supervisor || ''}
                    onChange={(e) => setPermit({ ...permit, team: { ...permit.team, supervisor: e.target.value } })}
                    placeholder="Nombre del Supervisor habilitante..."
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-bold text-slate-700 uppercase">Equipo de Rescate Externo</label>
                  <input
                    type="text"
                    className="input-professional"
                    value={permit.team?.rescue || ''}
                    onChange={(e) => setPermit({ ...permit, team: { ...permit.team, rescue: e.target.value } })}
                    placeholder="Brigada interna / Bomberos / Rescate especializado"
                  />
                </div>
              </div>
            </div>
          </ModuleFormSection>

          {/* Sección 7: Conclusiones y Dictamen */}
          <ModuleFormSection title="7. Conclusiones y Dictamen Técnico Oficial" icon={<FileText size={20} />}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-600">Redacción formal según criterios de la Res. SRT 953/10:</span>
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
              placeholder="El dictamen técnico fundamentará la habilitación o rechazo del ingreso según mediciones atmosféricas, verificación LOTO y sistema de rescate..."
            />
          </ModuleFormSection>

          {/* Sección 8: Firmas Reglamentarias Tripartitas */}
          <div className="mt-8">
            <ModuleFormSection title="8. Firmas Reglamentarias Tripartitas" icon={<Pencil size={20} />}>
              <div className="no-print mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3 items-center">
                <div className="text-slate-700 font-extrabold text-xs uppercase tracking-wider">
                  Firmas a incluir en el Permiso de Trabajo:
                </div>
                <div className="flex gap-4 flex-wrap justify-center text-xs font-bold">
                  {[
                    { id: 'operator', label: 'Vigía Standby Exterior' },
                    { id: 'professional', label: 'Responsable HyS' },
                    { id: 'supervisor', label: 'Supervisor Habilitante' }
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
                          title: 'VIGÍA EXTERIOR PERMANENTE',
                          subtitle: (permit.team?.attendant || 'Vigía Standby').toUpperCase(),
                          signatureUrl: permit.operatorSignature || null,
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
                          subtitle: (permit.team?.supervisor || 'Supervisor Autorizante').toUpperCase(),
                          signatureUrl: permit.supervisorSignature || permit.signature || null,
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
                    <label className="text-xs font-bold text-slate-600 uppercase">Firma del Vigía Exterior:</label>
                    <SignatureCanvas
                      onSave={(sig) => setPermit((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                      initialImage={permit.operatorSignature}
                      label="Firma de Vigía Exterior"
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
                      onSave={(sig) => setPermit((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                      initialImage={permit.supervisorSignature || permit.signature}
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
          { id: 'save', label: 'GENERAR PERMISO PTSEC', icon: <Save size={18} />, variant: 'primary', onClick: (e: any) => { e.preventDefault(); requirePro(handleSave); } }
        ]}
      />

      <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Permiso de Ingreso a Espacio Confinado (PTSEC)"
        text={`Permiso PTSEC Res. SRT 953/10: ${permit.spaceName}`}
        rawMessage={`Permiso PTSEC Res. SRT 953/10: ${permit.spaceName}`}
        fileName={`Permiso_PTSEC_${permit.spaceName ? permit.spaceName.replace(/\s+/g, '_') : 'Espacio_Confinado'}.pdf`}
      />

      <div className="print-only fixed left-0 opacity-[0.01] top-0 pointer-events-none">
        <ConfinedSpacePdf data={{ ...permit, createdAt: permit.createdAt || new Date().toISOString() }} />
      </div>
    </div>
  );
}