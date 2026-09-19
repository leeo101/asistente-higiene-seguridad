import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Lock, Save, Eye, CheckCircle2, Printer, Share2,
  Pencil, Trash2, Check, AlertTriangle, ShieldCheck, Zap, Sparkles, Building2, User
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import LOTOPdf from '../components/LOTOPdf';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { ModuleFormLayout, ModuleFormDocument, ModuleFormSection, ModuleActionBar, ModuleFormToolbar } from '../components/module';
import WorkerMedicalChecker from '../components/WorkerMedicalChecker';
import {
  evaluateLotoProcedureSafety,
  OFFICIAL_LOTO_REGULATORY_CRITERIA
} from '../utils/srtProtocols';
import type { LotoProcedureProtocol, IsolationPoint } from '../types/loto';

const ENERGY_TYPES = [
  { id: 'electrical', name: 'Eléctrica', icon: '⚡', color: '#fbbf24', desc: 'Tensión de red / tableros / motores' },
  { id: 'mechanical', name: 'Mecánica', icon: '🔧', color: '#6b7280', desc: 'Cinética, volantes, poleas, engranajes' },
  { id: 'hydraulic', name: 'Hidráulica', icon: '💧', color: '#3b82f6', desc: 'Fluidos a alta presión / pistones' },
  { id: 'pneumatic', name: 'Neumática', icon: '💨', color: '#9ca3af', desc: 'Aire comprimido / cilindros' },
  { id: 'chemical', name: 'Química', icon: '🧪', color: '#10b981', desc: 'Líneas de gases o fluidos corrosivos' },
  { id: 'thermal', name: 'Térmica', icon: '🔥', color: '#ef4444', desc: 'Vapor de agua, fluidos calientes/fríos' },
  { id: 'gravitational', name: 'Gravitacional', icon: '⬇️', color: '#8b5cf6', desc: 'Masas elevadas, prensas, contrapesos' },
  { id: 'radiation', name: 'Radiación', icon: '☢️', color: '#f59e0b', desc: 'Fuentes ionizantes o campos electromagnéticos' }
];

const LOTO_DEVICES = [
  { id: 'padlock', name: 'Candado de Seguridad', icon: '🔒' },
  { id: 'hasp', name: 'Aldaba Múltiple (Hasp)', icon: '📎' },
  { id: 'breaker_lock', name: 'Bloqueo Disyuntor / Térmica', icon: '⚡' },
  { id: 'valve_lock', name: 'Bloqueo Válvula Esférica/Mariposa', icon: '🔩' },
  { id: 'plug_lock', name: 'Bloqueo de Enchufe / Ficha', icon: '🔌' },
  { id: 'cable_lock', name: 'Bloqueo Universal por Cable', icon: '🪢' },
  { id: 'blind_flange', name: 'Brida Ciega de Aislamiento', icon: '🛑' },
  { id: 'tagout', name: 'Etiqueta / Tarjeta de Peligro', icon: '🏷️' }
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box' as any,
  transition: 'all 0.2s'
};

export default function LOTOForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Procedimiento LOTO' : 'Nuevo Procedimiento LOTO');

  // Inicialización con datos corporativos de la empresa si existen
  const [procedure, setProcedure] = useState<Partial<LotoProcedureProtocol>>(() => {
    let defaultCompany = '';
    let defaultCuit = '';
    let defaultAddress = '';
    let defaultArt = '';

    try {
      const savedCompany = localStorage.getItem('companyData');
      const savedPersonal = localStorage.getItem('personalData');
      if (savedCompany) {
        const c = JSON.parse(savedCompany);
        defaultCompany = c.name || '';
        defaultCuit = c.cuit || '';
        defaultAddress = c.address || '';
        defaultArt = c.art || '';
      } else if (savedPersonal) {
        const p = JSON.parse(savedPersonal);
        defaultCompany = p.company || '';
        defaultCuit = p.cuit || '';
      }
    } catch (e) {}

    return {
      companyName: defaultCompany,
      cuit: defaultCuit,
      establishmentAddress: defaultAddress,
      art: defaultArt,
      sector: '',
      department: '',
      equipmentName: '',
      equipmentTag: '',
      lockoutType: 'individual',
      lockBoxNumber: '',
      location: '',
      energyTypes: ['electrical'],
      lotoDevices: ['padlock', 'breaker_lock', 'tagout'],
      hasElectricalRisk: true,
      fiveGoldenRulesElectrical: {
        corteEfectivo: true,
        bloqueoEnclavamiento: true,
        verificacionAusencia: true,
        puestaATierraCorto: true,
        senalizacionZona: true
      },
      isolationPointsList: [
        { id: 1, name: 'Interruptor Termomagnético Q1', energyType: 'electrical', device: 'breaker_lock', location: 'Tablero Principal TG-01', lockNumber: 'C-01', verified: true }
      ],
      isolationPoints: '',
      zeroEnergyVerification: {
        tested: true,
        method: 'try_start',
        result: 'safe',
        notes: 'Verificado con intento de arranque local en tablero de mando y multímetro (0 V).'
      },
      restorationChecklist: {
        guardsReinstalled: true,
        toolsRemoved: true,
        personnelClear: true,
        locksRemoved: true,
        authorizedRestart: true
      },
      supervisor: '',
      authorizedOperator: '',
      operatorDni: '',
      observations: '',
      status: 'pending',
      isAuthorized: true,
      signature: '',
      operatorSignature: '',
      supervisorSignature: '',
      professionalSignature: '',
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
    setProcedure((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = procedure.showSignatures || { operator: true, professional: true, supervisor: true };

  useEffect(() => {
    if (location.state?.editData) {
      const ed = location.state.editData;
      setProcedure({
        ...ed,
        hasElectricalRisk: ed.hasElectricalRisk ?? (ed.energyTypes || []).includes('electrical'),
        fiveGoldenRulesElectrical: ed.fiveGoldenRulesElectrical || {
          corteEfectivo: true,
          bloqueoEnclavamiento: true,
          verificacionAusencia: true,
          puestaATierraCorto: true,
          senalizacionZona: true
        },
        isolationPointsList: ed.isolationPointsList || [],
        zeroEnergyVerification: ed.zeroEnergyVerification || {
          tested: true,
          method: 'try_start',
          result: 'safe'
        },
        restorationChecklist: ed.restorationChecklist || {
          guardsReinstalled: false,
          toolsRemoved: false,
          personnelClear: false,
          locksRemoved: false,
          authorizedRestart: false
        }
      });
      setIsEdit(true);
    }
  }, [location.state]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    const savedData = localStorage.getItem('personalData');
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');

    let signature = legacySignature || null;
    let stamp = null;
    if (savedSigData) {
      const parsed = JSON.parse(savedSigData);
      signature = parsed.signature || signature;
      stamp = parsed.stamp || null;
    }

    if (savedData) {
      const data = JSON.parse(savedData);
      setProfessional({
        name: data.name || '',
        license: data.license || '',
        signature: signature,
        stamp: stamp
      });
    } else {
      setProfessional((prev: any) => ({ ...prev, signature, stamp }));
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Evaluación en tiempo real según Decreto 351/79 y OSHA 1910.147
  const liveSafety = evaluateLotoProcedureSafety(procedure);

  const toggleEnergy = (id: string) => {
    const current = procedure.energyTypes || [];
    const updated = current.includes(id) ? current.filter((e) => e !== id) : [...current, id];
    const isElec = updated.includes('electrical');
    setProcedure((prev) => ({
      ...prev,
      energyTypes: updated,
      hasElectricalRisk: isElec
    }));
  };

  const toggleDevice = (id: string) => {
    const current = procedure.lotoDevices || [];
    const updated = current.includes(id) ? current.filter((d) => d !== id) : [...current, id];
    setProcedure((prev) => ({ ...prev, lotoDevices: updated }));
  };

  const addIsolationPoint = () => {
    setProcedure((prev: any) => ({
      ...prev,
      isolationPointsList: [
        ...(prev.isolationPointsList || []),
        {
          id: Date.now(),
          name: '',
          energyType: (prev.energyTypes && prev.energyTypes[0]) || 'electrical',
          device: 'padlock',
          location: '',
          lockNumber: '',
          verified: true
        }
      ]
    }));
  };

  const removeIsolationPoint = (id: number | string) => {
    setProcedure((prev: any) => ({
      ...prev,
      isolationPointsList: (prev.isolationPointsList || []).filter((p: any) => p.id !== id)
    }));
  };

  const updateIsolationPoint = (id: number | string, field: string, value: any) => {
    setProcedure((prev: any) => ({
      ...prev,
      isolationPointsList: (prev.isolationPointsList || []).map((p: any) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleGenerateConclusions = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      let text = `PROCEDIMIENTO OPERATIVO ESTÁNDAR DE BLOQUEO Y ETIQUETADO LOTO\n`;
      text += `Normativa de aplicación: Decreto 351/79 (Cap. 14 Anexo VI, Cap. 15) & OSHA 29 CFR 1910.147.\n`;
      text += `Equipo: ${procedure.equipmentName || 'Equipo en planta'} ${procedure.equipmentTag ? `(${procedure.equipmentTag})` : ''}.\n\n`;

      text += `1. PREPARACIÓN Y NOTIFICACIÓN:\n`;
      text += `- Notificar formalmente al personal operativo del sector (${procedure.department || procedure.sector || 'Producción'}) sobre la parada y consignación del equipo.\n`;
      text += `- Identificar los puntos de corte de energías principales y residuales (${(procedure.energyTypes || []).join(', ')}).\n\n`;

      text += `2. DETENCIÓN Y AISLAMIENTO ENERGÉTICO:\n`;
      text += `- Accionar la parada normal del equipo mediante pulsador de control.\n`;
      text += `- Abrir seccionadores, disyuntores y/o cerrar válvulas de alimentación en cada punto de corte.\n\n`;

      if (procedure.hasElectricalRisk || (procedure.energyTypes || []).includes('electrical')) {
        text += `3. APLICACIÓN DE LAS 5 REGLAS DE ORO ELÉCTRICAS (DEC. 351/79 ANEXO VI):\n`;
        text += `  a) Corte visible / efectivo de todas las fuentes de alimentación eléctrica.\n`;
        text += `  b) Bloqueo y enclavamiento mecánico de los aparatos de corte mediante candados de consignación.\n`;
        text += `  c) Verificación y comprobación de ausencia de tensión (0 V) en todas las fases y neutro con voltímetro calibrado.\n`;
        text += `  d) Puesta a tierra y en cortocircuito de los conductores activos.\n`;
        text += `  e) Señalización y delimitación de la zona de trabajo protegida con carteles 'PELIGRO - NO OPERAR'.\n\n`;
      }

      text += `4. DISIPACIÓN DE ENERGÍA RESIDUAL Y VERIFICACIÓN DE ENERGÍA CERO:\n`;
      text += `- Purgar tuberías, descargar condensadores y calzar mecánicamente componentes con riesgo de caída gravitacional.\n`;
      text += `- Prueba obligatoria de intento de arranque local ('Try-Out') comprobando que no existe respuesta motriz ni remanente de presión.\n\n`;

      text += `5. REGLA FUNDAMENTAL DE SEGURIDAD:\n`;
      text += `- Un trabajador = Un candado = Una llave. Queda terminantemente prohibido delegar o retirar candados de terceros.\n`;
      text += `- Para el restablecimiento final se inspeccionará que las guardas estén reinstaladas y el personal fuera de la zona de peligro.`;

      setProcedure((prev) => ({ ...prev, observations: text }));
      setIsGeneratingAi(false);
      toast.success('Procedimiento generado conforme a Dec. 351/79 y OSHA 1910.147');
    }, 600);
  };

  const handleSave = () => {
    if (!procedure.equipmentName || procedure.equipmentName.trim() === '') {
      toast.error('Por favor complete el nombre del equipo a bloquear');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('loto_procedures_db') || '[]');
    let updated;

    const entryToSave = {
      ...procedure,
      id: procedure.id || `LOTO-${Date.now()}`,
      procedureNumber: procedure.procedureNumber || `LOTO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: procedure.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAuthorized: liveSafety.isAuthorized,
      status: liveSafety.isAuthorized ? 'active' : 'pending',
      professionalSignature: procedure.professionalSignature || professional.signature,
      professionalName: procedure.professionalName || professional.name,
      professionalLicense: procedure.professionalLicense || professional.license,
      professionalStamp: procedure.professionalStamp || professional.stamp
    };

    if (isEdit) {
      updated = saved.map((p: any) => (p.id === entryToSave.id ? entryToSave : p));
      toast.success('Procedimiento LOTO actualizado');
    } else {
      updated = [entryToSave, ...saved];
      toast.success('Procedimiento LOTO registrado con éxito');
    }

    localStorage.setItem('loto_procedures_db', JSON.stringify(updated));
    navigate('/loto');
  };

  return (
    <div className="min-h-[100vh] bg-[var(--color-background)] pb-[8rem] pt-24">
      <ModuleFormLayout className="no-print">
        <ModuleFormToolbar
          title={isEdit ? 'Editar Procedimiento LOTO' : 'Nuevo Procedimiento LOTO'}
          subtitle="Consignación y Control de Energías Peligrosas (Dec. 351/79 Cap. 14 y 15 & OSHA 1910.147)"
          icon={<Lock size={36} color="#ffffff" />}
        />

        {/* Live Safety Assessment Banner */}
        <div className="mb-6 p-4 rounded-2xl border transition-all duration-300 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {liveSafety.isAuthorized ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
                  <CheckCircle2 size={24} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-black">
                  <AlertTriangle size={24} />
                </div>
              )}
              <div>
                <h4 className="m-0 text-base font-black uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                  {liveSafety.isAuthorized ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ✓ BLOQUEO AUTORIZADO — ENERGÍA CERO Y REGLAS CONFORMES
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400">
                      🛑 BLOQUEO NO AUTORIZADO — REQUISITOS CRÍTICOS PENDIENTES
                    </span>
                  )}
                </h4>
                <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
                  {liveSafety.isAuthorized
                    ? 'Cumple con el Decreto 351/79 Anexo VI y el estándar OSHA 29 CFR 1910.147 para desenergización segura.'
                    : 'Corrija los impedimentos críticos antes de permitir cualquier contacto mecánico o eléctrico.'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Cumplimiento 5 Reglas</span>
              <span className={`text-lg font-black ${liveSafety.goldenRulesCompliancePercent === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {liveSafety.goldenRulesCompliancePercent}%
              </span>
            </div>
          </div>

          {liveSafety.criticalBlockers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex flex-col gap-1">
              {liveSafety.criticalBlockers.map((blocker, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-black">✗</span>
                  <span>{blocker}</span>
                </div>
              ))}
            </div>
          )}

          {liveSafety.preventiveAlerts.length > 0 && (
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex flex-col gap-1">
              {liveSafety.preventiveAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-black">⚠</span>
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <ModuleFormDocument>
          {/* Identificación Patronal y Empresa */}
          <ModuleFormSection title="1. Identificación de la Empresa y Planta" icon={<Building2 size={20} />}>
            <div style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)' }} className="grid gap-4">
              <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                <label className="block mb-2 text-xs font-bold uppercase text-slate-400">Razón Social / Empresa</label>
                <input
                  type="text"
                  value={procedure.companyName || ''}
                  onChange={(e) => setProcedure({ ...procedure, companyName: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej: Acindar S.A. / Cervecería Quilmes"
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold uppercase text-slate-400">C.U.I.T. Patronal</label>
                <input
                  type="text"
                  value={procedure.cuit || ''}
                  onChange={(e) => setProcedure({ ...procedure, cuit: e.target.value })}
                  style={inputStyle}
                  placeholder="30-XXXXXXXX-X"
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold uppercase text-slate-400">A.R.T.</label>
                <input
                  type="text"
                  value={procedure.art || ''}
                  onChange={(e) => setProcedure({ ...procedure, art: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej: Asociart / La Segunda ART"
                />
              </div>
              <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                <label className="block mb-2 text-xs font-bold uppercase text-slate-400">Dirección del Establecimiento / Planta</label>
                <input
                  type="text"
                  value={procedure.establishmentAddress || ''}
                  onChange={(e) => setProcedure({ ...procedure, establishmentAddress: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej: Ruta 9 Km 280, Parque Industrial"
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold uppercase text-slate-400">Sector / Área</label>
                <input
                  type="text"
                  value={procedure.sector || ''}
                  onChange={(e) => setProcedure({ ...procedure, sector: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej: Sala de Compresores"
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold uppercase text-slate-400">Departamento</label>
                <input
                  type="text"
                  value={procedure.department || ''}
                  onChange={(e) => setProcedure({ ...procedure, department: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej: Mantenimiento Electromecánico"
                />
              </div>
            </div>
          </ModuleFormSection>

          {/* Especificaciones del Equipo y Modalidad LOTO */}
          <ModuleFormSection title="2. Especificaciones del Equipo y Modalidad de Bloqueo" icon={<Lock size={20} />}>
            <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }} className="grid gap-[1.5rem]">
              <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                <label className="block mb-2 text-sm font-semibold text-slate-400">Nombre del Equipo o Máquina *</label>
                <input
                  type="text"
                  value={procedure.equipmentName || ''}
                  onChange={(e) => setProcedure({ ...procedure, equipmentName: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej: Prensa Hidráulica 50T / Compresor de Tornillo Q1"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-400">Código / Tag del Equipo</label>
                <input
                  type="text"
                  value={procedure.equipmentTag || ''}
                  onChange={(e) => setProcedure({ ...procedure, equipmentTag: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej: COMP-01 / PREN-04"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-400">Modalidad de Bloqueo</label>
                <select
                  value={procedure.lockoutType || 'individual'}
                  onChange={(e) => setProcedure({ ...procedure, lockoutType: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="individual">Individual (1 Operario = 1 Candado)</option>
                  <option value="group">Grupal (Caja de Bloqueo / Lockbox)</option>
                </select>
              </div>
              {procedure.lockoutType === 'group' && (
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-400">Nº de Caja de Bloqueo (Lockbox)</label>
                  <input
                    type="text"
                    value={procedure.lockBoxNumber || ''}
                    onChange={(e) => setProcedure({ ...procedure, lockBoxNumber: e.target.value })}
                    style={inputStyle}
                    placeholder="Ej: LOCKBOX-02"
                  />
                </div>
              )}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-400">Ubicación Física</label>
                <input
                  type="text"
                  value={procedure.location || ''}
                  onChange={(e) => setProcedure({ ...procedure, location: e.target.value })}
                  style={inputStyle}
                  placeholder="Ej: Nave 3, lateral Este"
                />
              </div>
              <div style={isMobile ? {} : { gridColumn: 'span 3' }}>
                <WorkerMedicalChecker
                  value={procedure.supervisor || ''}
                  riskType="electrical"
                  label="Supervisor / Encargado de Bloqueo LOTO *"
                  placeholder="Nombre completo o DNI del supervisor..."
                  required={true}
                  onChange={(val) => setProcedure((prev: any) => ({ ...prev, supervisor: val }))}
                />
              </div>
            </div>
          </ModuleFormSection>

          {/* Fuentes de Energía Peligrosas */}
          <ModuleFormSection title="Paso 1: Fuentes de Energía a Bloquear" icon={<Zap size={20} className="text-amber-500" />}>
            <p className="text-xs text-slate-400 mb-3">
              Seleccione todas las fuentes de energía involucradas según OSHA 1910.147. Si selecciona <strong>Eléctrica</strong>, se habilitará la verificación obligatoria de las <strong>Cinco Reglas de Oro</strong> (Dec. 351/79 Anexo VI).
            </p>
            <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }} className="grid gap-3">
              {ENERGY_TYPES.map((type) => {
                const isSelected = (procedure.energyTypes || []).includes(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleEnergy(type.id)}
                    style={{
                      background: isSelected ? `${type.color}15` : 'var(--color-surface)',
                      border: `2px solid ${isSelected ? type.color : 'var(--color-border)'}`,
                      boxShadow: isSelected ? `0 0 15px ${type.color}25` : 'none',
                      transform: isSelected ? 'translateY(-2px)' : 'none'
                    }}
                    className="p-3.5 rounded-xl cursor-pointer flex flex-col items-center gap-1.5 text-center transition-all duration-200"
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span style={{ color: isSelected ? type.color : 'var(--color-text)' }} className="text-xs font-black uppercase tracking-wider">
                      {type.name}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{type.desc}</span>
                  </button>
                );
              })}
            </div>
          </ModuleFormSection>

          {/* Cinco Reglas de Oro Dec. 351/79 Anexo VI */}
          {((procedure.energyTypes || []).includes('electrical') || procedure.hasElectricalRisk) && (
            <ModuleFormSection
              title="Cinco Reglas de Oro de la Electricidad (Decreto 351/79 Anexo VI & AEA 90364)"
              icon={<Zap size={20} className="text-amber-500" />}
            >
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 mb-4">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider m-0">
                  REGLAMENTO NACIONAL OBLIGATORIO PARA TRABAJOS SIN TENSIÓN (ART. 95 AL 102 DEC. 351/79)
                </p>
                <p className="text-xs text-slate-300 mt-1 mb-0">
                  Todas las 5 reglas deben ser verificadas y aplicadas secuencialmente antes de declarar el circuito desenergizado.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'corteEfectivo', title: '1. Corte visible o efectivo', desc: 'Apertura con corte visible de interruptores, seccionadores o extracción de fusibles.' },
                  { key: 'bloqueoEnclavamiento', title: '2. Bloqueo y enclavamiento', desc: 'Colocación física de candados en seccionadores impidiendo su cierre intempestivo.' },
                  { key: 'verificacionAusencia', title: '3. Verificación de ausencia de tensión', desc: 'Comprobación fehaciente (0 V) en todas las fases y neutro con voltímetro calibrado.' },
                  { key: 'puestaATierraCorto', title: '4. Puesta a tierra y cortocircuito', desc: 'Conexión a tierra de las partes activas para drenar posibles retornos inductivos.' },
                  { key: 'senalizacionZona', title: '5. Señalización de la zona de trabajo', desc: 'Delimitación con conos, cadenas y cartelería de advertencia "PELIGRO - NO OPERAR".' }
                ].map((rule) => {
                  const isChecked = !!procedure.fiveGoldenRulesElectrical?.[rule.key as keyof typeof procedure.fiveGoldenRulesElectrical];
                  return (
                    <div
                      key={rule.key}
                      onClick={() => {
                        setProcedure((prev: any) => ({
                          ...prev,
                          fiveGoldenRulesElectrical: {
                            ...(prev.fiveGoldenRulesElectrical || {}),
                            [rule.key]: !prev.fiveGoldenRulesElectrical?.[rule.key]
                          }
                        }));
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500'
                      }`}>
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase">{rule.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{rule.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ModuleFormSection>
          )}

          {/* Dispositivos de Bloqueo Requeridos */}
          <ModuleFormSection title="Paso 2: Dispositivos Físicos de Bloqueo" icon={<Lock size={20} className="text-blue-500" />}>
            <div style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }} className="grid gap-3">
              {LOTO_DEVICES.map((device) => {
                const isSelected = (procedure.lotoDevices || []).includes(device.id);
                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => toggleDevice(device.id)}
                    style={{
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-surface)',
                      border: `2px solid ${isSelected ? '#3b82f6' : 'var(--color-border)'}`,
                      color: isSelected ? '#3b82f6' : 'var(--color-text)'
                    }}
                    className="p-3 rounded-xl cursor-pointer flex items-center gap-2 font-bold text-xs transition-all"
                  >
                    <span className="text-xl">{device.icon}</span>
                    <span>{device.name}</span>
                  </button>
                );
              })}
            </div>
          </ModuleFormSection>

          {/* Puntos de Aislamiento Específicos */}
          <ModuleFormSection title="Puntos de Aislamiento Específicos y Trazabilidad" icon={<ShieldCheck size={20} className="text-blue-500" />}>
            <p className="text-xs text-slate-400 mb-3">
              Detalle cada válvula, interruptor, seccionador o tapón ciego donde se colocará un bloqueo físico con número de candado.
            </p>
            <div className="overflow-x-auto w-full mb-4">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="pb-2 w-1/4">Punto / Válvula / Interruptor</th>
                    <th className="pb-2 w-1/6">Energía</th>
                    <th className="pb-2 w-1/6">Dispositivo</th>
                    <th className="pb-2 w-1/5">Ubicación / N° Candado</th>
                    <th className="pb-2 text-center w-24">¿Bloqueado?</th>
                    <th className="pb-2 text-center w-12">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(procedure.isolationPointsList || []).map((point: IsolationPoint) => (
                    <tr key={point.id} className="border-b border-slate-800 hover:bg-slate-900/20">
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={point.name}
                          onChange={(e) => updateIsolationPoint(point.id, 'name', e.target.value)}
                          style={inputStyle}
                          className="py-1 text-xs"
                          placeholder="Ej: Interruptor Q1 Tablero General"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={point.energyType}
                          onChange={(e) => updateIsolationPoint(point.id, 'energyType', e.target.value)}
                          style={inputStyle}
                          className="py-1 text-xs"
                        >
                          {ENERGY_TYPES.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.icon} {e.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={point.device}
                          onChange={(e) => updateIsolationPoint(point.id, 'device', e.target.value)}
                          style={inputStyle}
                          className="py-1 text-xs"
                        >
                          {LOTO_DEVICES.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.icon} {d.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={point.location}
                          onChange={(e) => updateIsolationPoint(point.id, 'location', e.target.value)}
                          style={inputStyle}
                          className="py-1 text-xs"
                          placeholder="Ej: Lateral derecho (Candado C-01)"
                        />
                      </td>
                      <td className="py-2 text-center">
                        <input
                          type="checkbox"
                          checked={point.verified}
                          onChange={(e) => updateIsolationPoint(point.id, 'verified', e.target.checked)}
                          className="w-4 h-4 cursor-pointer accent-emerald-500"
                        />
                      </td>
                      <td className="py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeIsolationPoint(point.id)}
                          className="p-1 text-rose-500 hover:text-rose-400 bg-transparent border-none cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(procedure.isolationPointsList || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500 text-xs">
                        No se han registrado puntos específicos de aislamiento todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addIsolationPoint}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl font-bold text-xs cursor-pointer transition-colors"
            >
              + Agregar Punto de Aislamiento
            </button>
          </ModuleFormSection>

          {/* Verificación de Energía Cero Residual (Try-Out) */}
          <ModuleFormSection title="Paso 3: Verificación de Energía Cero (Zero Energy State)" icon={<CheckCircle2 size={20} className="text-emerald-500" />}>
            <div
              style={{
                background: procedure.zeroEnergyVerification?.tested ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface)',
                border: `2px solid ${procedure.zeroEnergyVerification?.tested ? '#10b981' : 'var(--color-border)'}`
              }}
              className="p-5 rounded-2xl flex flex-col gap-4 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setProcedure((prev: any) => ({
                      ...prev,
                      zeroEnergyVerification: {
                        ...(prev.zeroEnergyVerification || {}),
                        tested: !prev.zeroEnergyVerification?.tested
                      }
                    }))
                  }
                  className="w-12 h-12 rounded-xl border flex items-center justify-center cursor-pointer transition-all shrink-0"
                  style={{
                    background: procedure.zeroEnergyVerification?.tested ? '#10b981' : 'transparent',
                    borderColor: procedure.zeroEnergyVerification?.tested ? '#10b981' : 'var(--color-border)'
                  }}
                >
                  {procedure.zeroEnergyVerification?.tested ? (
                    <Check size={28} color="#ffffff" strokeWidth={3} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-500" />
                  )}
                </button>
                <div>
                  <h4 className="m-0 text-sm font-black uppercase text-slate-900 dark:text-white">
                    {procedure.zeroEnergyVerification?.tested ? '¡ENERGÍA CERO VERIFICADA Y CONFIRMADA!' : 'CONFIRMAR ESTADO DE ENERGÍA CERO'}
                  </h4>
                  <p className="m-0 text-xs text-slate-400">
                    Es requisito excluyente de la norma OSHA 1910.147 realizar un intento de arranque ('Try-Out') o medición de tensión previa a cualquier intervención física.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase text-slate-400">Método de Verificación Empleado</label>
                  <select
                    value={procedure.zeroEnergyVerification?.method || 'try_start'}
                    onChange={(e) =>
                      setProcedure((prev: any) => ({
                        ...prev,
                        zeroEnergyVerification: {
                          ...(prev.zeroEnergyVerification || {}),
                          method: e.target.value
                        }
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="try_start">Intento de Arranque Local (Pulsador / Try-Out)</option>
                    <option value="tester">Medición de Tensión Residual con Multímetro (0 V)</option>
                    <option value="gauge">Verificación de Presión en Manómetro (0 bar / psi)</option>
                    <option value="bleed_valve">Purga y Despresurización en Válvula de Alivio</option>
                    <option value="visual">Inspección Visual de Desconexión Física Mecánica</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-xs font-bold uppercase text-slate-400">Constatación y Notas de Prueba</label>
                  <input
                    type="text"
                    value={procedure.zeroEnergyVerification?.notes || ''}
                    onChange={(e) =>
                      setProcedure((prev: any) => ({
                        ...prev,
                        zeroEnergyVerification: {
                          ...(prev.zeroEnergyVerification || {}),
                          notes: e.target.value
                        }
                      }))
                    }
                    style={inputStyle}
                    placeholder="Ej: Pulsador accionado sin respuesta; multímetro marcó 0.0 V entre fases."
                  />
                </div>
              </div>
            </div>
          </ModuleFormSection>

          {/* Generador de Instrucciones con IA / Automático */}
          <ModuleFormSection title="Instrucciones Operativas y Procedimiento" icon={<Pencil size={20} />}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase text-slate-400">Secuencia de Pasos y Recomendaciones</span>
              <button
                type="button"
                onClick={handleGenerateConclusions}
                disabled={isGeneratingAi}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <Sparkles size={14} className={isGeneratingAi ? 'animate-spin' : ''} />
                {isGeneratingAi ? 'Generando...' : 'Generar Procedimiento con IA / Dec. 351'}
              </button>
            </div>
            <textarea
              value={procedure.observations || ''}
              onChange={(e) => setProcedure({ ...procedure, observations: e.target.value })}
              style={inputStyle}
              className="min-h-[140px] font-mono text-xs leading-relaxed"
              placeholder="Describa la secuencia de bloqueo, consignación, prueba de energía cero y precauciones especiales..."
            />
          </ModuleFormSection>

          {/* Paso 4: Desbloqueo y Restablecimiento */}
          <ModuleFormSection title="Paso 4: Desbloqueo y Restablecimiento de Energía" icon={<CheckCircle2 size={20} />}>
            <p className="text-xs text-slate-400 mb-3">
              Lista de verificación obligatoria previo al retiro de candados y re-energización del equipo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'guardsReinstalled', label: '¿Se han reinstalado todas las guardas y resguardos mecánicos?' },
                { key: 'toolsRemoved', label: '¿Se han retirado todas las herramientas, cables auxiliares y materiales?' },
                { key: 'personnelClear', label: '¿Todo el personal se encuentra fuera de las zonas y radios de peligro?' },
                { key: 'locksRemoved', label: '¿Se han removido de forma segura todos los candados y etiquetas por sus titulares?' },
                { key: 'authorizedRestart', label: '¿El reinicio y re-energización del equipo está formalmente autorizado?' }
              ].map((item) => {
                const isChecked = !!procedure.restorationChecklist?.[item.key as keyof typeof procedure.restorationChecklist];
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      setProcedure((prev: any) => ({
                        ...prev,
                        restorationChecklist: {
                          ...(prev.restorationChecklist || {}),
                          [item.key]: !prev.restorationChecklist?.[item.key]
                        }
                      }));
                    }}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isChecked ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-900/30 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500'
                    }`}>
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 select-none">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </ModuleFormSection>

          {/* Firmas y Autorizaciones LOTO */}
          <ModuleFormSection title="Firmas y Responsables LOTO" icon={<Pencil size={20} />}>
            <div className="no-print mb-6 p-4 bg-slate-900/20 border border-slate-700/50 rounded-2xl flex flex-col gap-3 items-center">
              <div className="text-slate-400 font-bold text-xs uppercase tracking-wider">Incluir firmas en el documento oficial:</div>
              <div className="flex gap-3 flex-wrap justify-center">
                {[
                  { id: 'operator', label: 'Operario Bloqueador' },
                  { id: 'professional', label: 'Responsable Higiene y Seguridad' },
                  { id: 'supervisor', label: 'Supervisor / Encargado LOTO' }
                ].map((sig) => {
                  const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                  return (
                    <label
                      key={sig.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer select-none transition-all ${
                        isChecked ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-500'}`}>
                        {isChecked && <CheckCircle2 size={12} />}
                      </div>
                      {sig.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <PdfSignatures
                data={{
                  ...procedure,
                  professionalSignature: professional.signature,
                  professionalName: professional.name,
                  professionalLicense: professional.license,
                  professionalStamp: professional.stamp
                }}
                box1={
                  showSignatures.operator
                    ? {
                        title: 'OPERARIO BLOQUEADOR',
                        subtitle: 'Firma y Aclaración (1 Candado)',
                        signatureUrl: procedure.operatorSignature || null,
                        isProfessional: false
                      }
                    : null
                }
                box2={
                  showSignatures.professional
                    ? {
                        title: 'RESPONSABLE HIGIENE Y SEGURIDAD',
                        subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
                        signatureUrl: procedure.professionalSignature || professional.signature || null,
                        stampUrl: procedure.professionalStamp || professional.stamp || null,
                        isProfessional: true,
                        license: professional.license
                      }
                    : null
                }
                box3={
                  showSignatures.supervisor
                    ? {
                        title: 'SUPERVISOR / ENCARGADO LOTO',
                        subtitle: (procedure.supervisor || 'Aprobación Técnica').toUpperCase(),
                        signatureUrl: procedure.supervisorSignature || procedure.signature || null,
                        isProfessional: false
                      }
                    : null
                }
              />
              <PdfBrandingFooter />
            </div>

            <div className="no-print mt-6 pt-6 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
              {showSignatures.operator && (
                <div className="p-4 bg-slate-900/10 border border-slate-700 rounded-xl">
                  <SignatureCanvas
                    onSave={(sig) => setProcedure((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                    initialImage={procedure.operatorSignature}
                    title="Firma del Operario Bloqueador"
                  />
                </div>
              )}
              {showSignatures.professional && (
                <div className="p-4 bg-slate-900/10 border border-slate-700 rounded-xl">
                  <SignatureCanvas
                    onSave={(sig) => setProcedure((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                    initialImage={procedure.professionalSignature || professional.signature}
                    title="Firma del Profesional HyS"
                  />
                </div>
              )}
              {showSignatures.supervisor && (
                <div className="p-4 bg-slate-900/10 border border-slate-700 rounded-xl">
                  <SignatureCanvas
                    onSave={(sig) => setProcedure((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                    initialImage={procedure.supervisorSignature || procedure.signature}
                    title="Firma del Supervisor LOTO"
                  />
                </div>
              )}
            </div>
          </ModuleFormSection>
        </ModuleFormDocument>
      </ModuleFormLayout>

      <ModuleActionBar
        actions={[
          { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer size={18} />, variant: 'warning', onClick: () => requirePro(() => window.print()) },
          { id: 'share', label: 'COMPARTIR', icon: <Share2 size={18} />, variant: 'secondary', onClick: () => requirePro(() => setShowShareModal(true)) },
          { id: 'save', label: 'GUARDAR PROCEDIMIENTO', icon: <Save size={18} />, variant: 'primary', onClick: (e: any) => { e.preventDefault(); requirePro(handleSave); } }
        ]}
      />

      <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Procedimiento LOTO"
        text={`Bloqueo y Etiquetado: ${procedure.equipmentName}`}
        rawMessage={`Bloqueo y Etiquetado: ${procedure.equipmentName}`}
        fileName={`LOTO_${procedure.equipmentName || 'Sin_Nombre'}.pdf`}
      />

      <div className="print-only fixed left-0 opacity-[0.01] top-0 pointer-events-none">
        <LOTOPdf
          data={{
            ...procedure,
            id: procedure.id || Date.now().toString(),
            createdAt: procedure.createdAt || new Date().toISOString()
          }}
        />
      </div>
    </div>
  );
}