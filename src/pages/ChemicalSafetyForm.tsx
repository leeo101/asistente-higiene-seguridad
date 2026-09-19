import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, FlaskConical, Shield, AlertTriangle, Printer, Share2,
  CheckCircle2, Building2, Package, Sparkles, Loader2, RefreshCw, ChevronLeft, ChevronRight,
  MapPin, Activity, HelpCircle
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import ChemicalSafetyPdf from '../components/ChemicalSafetyPdf';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
} from '../components/module';
import {
  COMMON_CHEMICAL_SUBSTANCES,
  evaluateChemicalAgentExposure
} from '../utils/srtProtocols';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';
import type { ChemicalAgentAssessment, CarcinogenicityClassification, GHSWordSignal } from '../types/chemical';

const GHS_PICTOGRAMS_OPTIONS = [
  { id: 'explosive', code: 'GHS01', name: 'Explosivo', icon: '🧨' },
  { id: 'flammable', code: 'GHS02', name: 'Inflamable', icon: '🔥' },
  { id: 'oxidizing', code: 'GHS03', name: 'Comburente', icon: '⭕' },
  { id: 'pressure', code: 'GHS04', name: 'Gas a Presión', icon: '🍾' },
  { id: 'corrosive', code: 'GHS05', name: 'Corrosivo', icon: '🧪' },
  { id: 'toxic', code: 'GHS06', name: 'Toxicidad Aguda', icon: '☠️' },
  { id: 'harmful', code: 'GHS07', name: 'Nocivo / Irritante', icon: '⚠️' },
  { id: 'carcinogenic', code: 'GHS08', name: 'Peligro Salud / Carcinógeno', icon: '🗣️' },
  { id: 'environmental', code: 'GHS09', name: 'Peligro Ambiente', icon: '🐟' }
];

export default function ChemicalSafetyForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const isEdit = Boolean(editData);

  useDocumentTitle(isEdit ? 'Editar Protocolo de Sustancia Química' : 'Nuevo Protocolo Químico');

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<any>(null);
  const [signature, setSignature] = useState<any>(null);
  const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const savedProfile = localStorage.getItem('personalData');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {}
    }

    const sig = localStorage.getItem('signatureStampData');
    if (sig) {
      try {
        setSignature(JSON.parse(sig));
      } catch (e) {}
    }
  }, []);

  const [formData, setFormData] = useState<any>(() => {
    if (editData) return editData;

    const savedProfile = localStorage.getItem('personalData');
    let defaultEmpresa = '';
    let defaultCuit = '';
    if (savedProfile) {
      try {
        const p = JSON.parse(savedProfile);
        defaultEmpresa = p.companyName || p.empresa || '';
        defaultCuit = p.cuit || '';
      } catch (e) {}
    }

    return {
      cuit: defaultCuit,
      empresa: defaultEmpresa,
      art: '',
      sector: '',
      puesto: '',
      fechaMuestreo: new Date().toISOString().split('T')[0],
      name: 'Tolueno (Metilbenceno)',
      nombreComercial: '',
      casNumber: '108-88-3',
      unNumber: '1294',
      supplier: '',
      estadoFisico: 'Líquido',
      storage: 'Armario ignífugo bajo llave',
      location: 'Depósito Químico',
      signalWord: 'PELIGRO' as GHSWordSignal,
      pictograms: ['flammable', 'harmful', 'carcinogenic'],
      hazardStatements: ['H225: Líquido y vapores muy inflamables', 'H304: Puede ser mortal en caso de ingestión'],
      precautionaryStatements: ['P210: Mantener alejado de fuentes de calor y chispas', 'P280: Llevar guantes y protección ocular'],
      nfpa704: {
        health: 2,
        flammability: 3,
        instability: 0,
        special: ''
      },
      unidadMedicion: 'ppm',
      cmp: 50,
      cmpCpt: 0,
      cmpC: 0,
      viaDermica: true,
      sensibilizante: false,
      carcinogenicidad: 'A4 (No clasificable en humanos)' as CarcinogenicityClassification,
      bei: 'Ácido hipúrico en orina (1.6 g/g creatinina al final del turno)',
      concentracionMedida: 22,
      duracionMuestreoMinutos: 480,
      metodoMuestreo: 'Muestreo con tubo de carbón activo y desorción por cromatografía gaseosa (NIOSH 1501)',
      instrumento: 'Bomba gravimétrica personal calibrada',
      ppe: {
        gloves: true,
        mask: true,
        goggles: true,
        apron: false,
        especificaciones: 'Guantes de nitrilo resistente, semimáscara con filtro para vapores orgánicos (A1).'
      },
      firstAid: {
        inhalation: 'Trasladar al aire libre inmediatamente. Suministrar oxígeno si hay disnea.',
        skin: 'Retirar ropa contaminada y lavar profusamente con agua y jabón 15 minutos.',
        eyes: 'Lavar con abundante agua durante 15 minutos manteniendo los párpados separados.',
        ingestion: 'NO provocar el vómito. Requerir asistencia médica urgente.'
      },
      conclusiones: '',
      recomendaciones: '',
      operatorSignature: '',
      supervisorSignature: '',
      showSignatures: { operator: true, supervisor: true, professional: true }
    };
  });

  // Cálculo higiénico en vivo
  const liveExposure = evaluateChemicalAgentExposure({
    cmp: Number(formData.cmp || 0),
    concentracionMedida: Number(formData.concentracionMedida || 0),
    unidadMedicion: formData.unidadMedicion,
    viaDermica: formData.viaDermica,
    carcinogenicidad: formData.carcinogenicidad,
    bei: formData.bei
  });

  // Selección rápida de sustancia precargada
  const handleSelectPreloadedSubstance = (substanceId: string) => {
    const found = COMMON_CHEMICAL_SUBSTANCES.find(s => s.id === substanceId);
    if (!found) return;

    setFormData((prev: any) => ({
      ...prev,
      name: found.nombreQuimico,
      nombreComercial: found.nombreComercial || prev.nombreComercial,
      casNumber: found.casNumber,
      unNumber: found.unNumber || prev.unNumber,
      cmp: prev.unidadMedicion === 'ppm' ? (found.cmpPpm ?? found.cmpMgM3) : (found.cmpMgM3 ?? found.cmpPpm),
      cmpCpt: prev.unidadMedicion === 'ppm' ? (found.cmpCptPpm ?? 0) : (found.cmpCptMgM3 ?? 0),
      viaDermica: found.viaDermica,
      sensibilizante: found.sensibilizante,
      carcinogenicidad: found.carcinogenicidad,
      bei: found.bei || ''
    }));

    toast.success(`Datos de ${found.nombreQuimico} cargados según Res. MTEySS 295/03`);
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
    const history = JSON.parse(localStorage.getItem('chemical_safety_db') || '[]');

    const finalReport = {
      ...formData,
      id,
      indiceExposicion: liveExposure.indiceExposicion,
      dictamenExposicion: liveExposure.dictamenExposicion,
      conclusiones: formData.conclusiones || liveExposure.recomendacionesTecnicas.join('\n\n'),
      recomendaciones: formData.recomendaciones || liveExposure.recomendacionesTecnicas.slice(1).join('\n')
    };

    let updatedHistory;
    if (editData) {
      updatedHistory = history.map((item: any) => (item.id === editData.id ? finalReport : item));
    } else {
      updatedHistory = [finalReport, ...history];
    }

    localStorage.setItem('chemical_safety_db', JSON.stringify(updatedHistory));
    toast.success(editData ? 'Sustancia actualizada con éxito' : 'Sustancia registrada con éxito');
    navigate('/chemical-safety');
  };

  const handleGenerateConclusion = async () => {
    setIsGeneratingConclusion(true);
    const loadingToast = toast.loading('Redactando dictamen higiénico con IA...');
    try {
      const token = await auth.currentUser?.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/api/ai-report-conclusion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reportType: 'Estudio de Contaminantes Químicos Res MTEySS 295/03 Anexo IV',
          reportData: {
            empresa: formData.empresa,
            cuit: formData.cuit,
            sector: formData.sector,
            puesto: formData.puesto,
            sustancia: formData.name,
            cas: formData.casNumber,
            cmp: formData.cmp,
            concentracionMedida: formData.concentracionMedida,
            unidad: formData.unidadMedicion,
            indiceExposicion: liveExposure.indiceExposicion,
            dictamen: liveExposure.dictamenExposicion,
            viaDermica: formData.viaDermica,
            carcinogenicidad: formData.carcinogenicidad
          }
        })
      });

      if (!res.ok) throw new Error('Error de conexión con la IA');
      const data = await res.json();
      setFormData((prev: any) => ({
        ...prev,
        conclusiones: data.conclusion || prev.conclusiones,
        recomendaciones: data.conclusion || prev.recomendaciones
      }));
      toast.success('Dictamen redactado con éxito ✨', { id: loadingToast });
    } catch (e) {
      // Fallback local determinístico según normativa
      setFormData((prev: any) => ({
        ...prev,
        conclusiones: liveExposure.recomendacionesTecnicas.join('\n\n'),
        recomendaciones: liveExposure.recomendacionesTecnicas.slice(1).join('\n')
      }));
      toast.success('Dictamen normativo generado localmente.', { id: loadingToast });
    } finally {
      setIsGeneratingConclusion(false);
    }
  };

  return (
    <ModuleFormLayout>
      {/* Componente PDF fuera de pantalla para captura / impresión */}
      <div className="ats-pdf-offscreen" aria-hidden="true">
        <ChemicalSafetyPdf
          data={{
            ...formData,
            indiceExposicion: liveExposure.indiceExposicion,
            dictamenExposicion: liveExposure.dictamenExposicion
          }}
          professional={profile}
        />
      </div>

      <div className="pt-24 no-print" />

      <ModuleFormToolbar
        title={isEdit ? 'Editar Protocolo Químico' : 'Nuevo Protocolo de Seguridad Química'}
        subtitle="Res. MTEySS 295/03 Anexo IV • Res. SRT 801/15 SGA"
        icon={<FlaskConical size={36} color="#ffffff" />}
        steps={['1. Establecimiento & Sustancia', '2. SGA & NFPA 704', '3. Límites Res. 295/03', '4. EPP & Dictamen']}
        currentStep={step}
        onStepClick={(s) => {
          setStep(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onBack={() => navigate('/chemical-safety')}
      />

      <div className="my-6 z-10 no-print" />

      <ModuleFormDocument>
        {/* PASO 1: ESTABLECIMIENTO Y SUSTANCIA */}
        {step === 1 && (
          <ModuleFormSection title="I — Establecimiento y Sustancia Química" icon={<Building2 />}>
            {/* Precarga de sustancias Res. 295/03 */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 mb-6">
              <span className="text-[0.7rem] font-black uppercase text-indigo-700 dark:text-indigo-300 block mb-2">
                ⚡ Carga Rápida desde Catálogo Oficial Res. MTEySS 295/03:
              </span>
              <div className="flex gap-2 flex-wrap">
                {COMMON_CHEMICAL_SUBSTANCES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectPreloadedSubstance(s.id)}
                    className="px-3 py-1 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    {s.nombreQuimico.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Empresa / Razón Social *
                </label>
                <input
                  className="module-form-input"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Nombre de la empresa"
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
                  placeholder="Aseguradora"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Sector / Nave *
                </label>
                <input
                  className="module-form-input"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  placeholder="Ej: Pintura, Laboratorio, Depósito"
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
                  placeholder="Ej: Operario de Cabina de Pintura"
                />
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Fecha de Muestreo
                </label>
                <input
                  type="date"
                  className="module-form-input"
                  value={formData.fechaMuestreo}
                  onChange={(e) => setFormData({ ...formData, fechaMuestreo: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6">
              <h4 className="text-sm font-black uppercase tracking-wider text-[var(--color-text)] mb-4">
                Identificación de la Sustancia Química
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                    Nombre Químico de la Sustancia *
                  </label>
                  <input
                    className="module-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Tolueno"
                  />
                </div>

                <div>
                  <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                    Número CAS
                  </label>
                  <input
                    className="module-form-input font-mono"
                    value={formData.casNumber}
                    onChange={(e) => setFormData({ ...formData, casNumber: e.target.value })}
                    placeholder="Ej: 108-88-3"
                  />
                </div>

                <div>
                  <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                    Número ONU (UN)
                  </label>
                  <input
                    className="module-form-input font-mono"
                    value={formData.unNumber}
                    onChange={(e) => setFormData({ ...formData, unNumber: e.target.value })}
                    placeholder="Ej: 1294"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                    Estado Físico en el Puesto
                  </label>
                  <select
                    className="module-form-input"
                    value={formData.estadoFisico}
                    onChange={(e) => setFormData({ ...formData, estadoFisico: e.target.value })}
                  >
                    <option value="Líquido">Líquido</option>
                    <option value="Vapor / Gas">Vapor / Gas</option>
                    <option value="Polvo / Partículas">Polvo / Partículas</option>
                    <option value="Aerosol / Niebla">Aerosol / Niebla</option>
                    <option value="Sólido">Sólido</option>
                  </select>
                </div>

                <div>
                  <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                    Proveedor / Fabricante
                  </label>
                  <input
                    className="module-form-input"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Ej: Distribuidora Química S.A."
                  />
                </div>

                <div>
                  <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                    Lugar de Almacenamiento
                  </label>
                  <input
                    className="module-form-input"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    placeholder="Ej: Depósito de Inflamables"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center w-full mt-6">
              <button
                type="button"
                onClick={handleNext}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-extrabold shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                Continuar a SGA & NFPA <ChevronRight size={18} />
              </button>
            </div>
          </ModuleFormSection>
        )}

        {/* PASO 2: SGA / GHS Y DIAMANTE NFPA 704 */}
        {step === 2 && (
          <ModuleFormSection title="II — Clasificación SGA (Res. SRT 801/15) & NFPA 704" icon={<Shield />}>
            {/* Palabra de Advertencia */}
            <div className="mb-6">
              <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                Palabra de Advertencia Oficial (Res. SRT 801/15)
              </label>
              <div className="flex gap-4">
                {(['PELIGRO', 'ATENCIÓN', 'SIN CLASIFICAR'] as GHSWordSignal[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setFormData({ ...formData, signalWord: w })}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                      formData.signalWord === w
                        ? w === 'PELIGRO'
                          ? 'bg-rose-600 text-white shadow-md'
                          : w === 'ATENCIÓN'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-slate-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Pictogramas SGA */}
            <div className="mb-8">
              <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                Pictogramas de Peligro GHS/SGA Aplicables
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {GHS_PICTOGRAMS_OPTIONS.map((pic) => {
                  const isSelected = (formData.pictograms || []).includes(pic.id);
                  return (
                    <div
                      key={pic.id}
                      onClick={() => {
                        const current = formData.pictograms || [];
                        const updated = isSelected
                          ? current.filter((x: string) => x !== pic.id)
                          : [...current, pic.id];
                        setFormData({ ...formData, pictograms: updated });
                      }}
                      className="p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2.5 select-none hover:shadow-sm"
                      style={{
                        background: isSelected ? 'rgba(239, 68, 68, 0.08)' : 'var(--color-surface)',
                        borderColor: isSelected ? '#ef4444' : 'var(--color-border)'
                      }}
                    >
                      <span className="text-xl">{pic.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-xs text-[var(--color-text)] block truncate">
                          {pic.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-rose-600">
                          {pic.code}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diamante NFPA 704 Interactivo */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-8">
              <h4 className="text-sm font-black uppercase tracking-wider text-[var(--color-text)] mb-4">
                Diamante NFPA 704 (Identificación Rápida de Riesgo en Almacenamiento)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div>
                  <label className="text-[0.7rem] font-[800] text-blue-600 uppercase tracking-wider block mb-2">
                    Salud (Azul: 0 a 4)
                  </label>
                  <select
                    className="module-form-input font-bold"
                    value={formData.nfpa704?.health ?? 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      nfpa704: { ...formData.nfpa704, health: Number(e.target.value) }
                    })}
                  >
                    <option value={0}>0 - Sin riesgo</option>
                    <option value={1}>1 - Poco peligroso</option>
                    <option value={2}>2 - Peligroso</option>
                    <option value={3}>3 - Muy peligroso</option>
                    <option value={4}>4 - Mortal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[0.7rem] font-[800] text-rose-600 uppercase tracking-wider block mb-2">
                    Inflamabilidad (Rojo: 0 a 4)
                  </label>
                  <select
                    className="module-form-input font-bold"
                    value={formData.nfpa704?.flammability ?? 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      nfpa704: { ...formData.nfpa704, flammability: Number(e.target.value) }
                    })}
                  >
                    <option value={0}>0 - No arde</option>
                    <option value={1}>1 - Arde &gt; 93°C</option>
                    <option value={2}>2 - Arde &lt; 93°C</option>
                    <option value={3}>3 - Arde &lt; 37°C</option>
                    <option value={4}>4 - Arde &lt; 23°C</option>
                  </select>
                </div>

                <div>
                  <label className="text-[0.7rem] font-[800] text-amber-500 uppercase tracking-wider block mb-2">
                    Inestabilidad (Amarillo: 0 a 4)
                  </label>
                  <select
                    className="module-form-input font-bold"
                    value={formData.nfpa704?.instability ?? 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      nfpa704: { ...formData.nfpa704, instability: Number(e.target.value) }
                    })}
                  >
                    <option value={0}>0 - Estable</option>
                    <option value={1}>1 - Inestable al calor</option>
                    <option value={2}>2 - Cambio violento</option>
                    <option value={3}>3 - Puede detonar</option>
                    <option value={4}>4 - Detona fácil</option>
                  </select>
                </div>

                <div>
                  <label className="text-[0.7rem] font-[800] text-slate-600 uppercase tracking-wider block mb-2">
                    Riesgo Especial (Blanco)
                  </label>
                  <select
                    className="module-form-input font-bold"
                    value={formData.nfpa704?.special || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      nfpa704: { ...formData.nfpa704, special: e.target.value }
                    })}
                  >
                    <option value="">Ninguno</option>
                    <option value="W">W (Reactivo con agua)</option>
                    <option value="OX">OX (Comburente/Oxidante)</option>
                    <option value="SA">SA (Gas asfixiante simple)</option>
                    <option value="COR">COR (Corrosivo)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap justify-center w-full">
              <button
                type="button"
                onClick={handleBack}
                style={{ background: 'linear-gradient(135deg, #64748b, #475569)', color: 'white', border: 'none' }}
                className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                <ChevronLeft size={18} /> Atrás
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                Continuar a Límites Res. 295/03 <ChevronRight size={18} />
              </button>
            </div>
          </ModuleFormSection>
        )}

        {/* PASO 3: LÍMITES HIGIÉNICOS Y MONITOREO RES. 295/03 */}
        {step === 3 && (
          <ModuleFormSection title="III — Límites Higiénicos y Monitoreo Ambiental (Res. MTEySS 295/03 Anexo IV)" icon={<Activity />}>
            {/* Panel de Métricas en Vivo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                  Concentración Medida
                </span>
                <div className="text-3xl font-black text-blue-900 dark:text-blue-200">
                  {formData.concentracionMedida} <span className="text-sm font-bold text-slate-500">{formData.unidadMedicion}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Monitoreo en el puesto
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">
                  C.M.P. Normativo (8 Horas)
                </span>
                <div className="text-3xl font-black text-purple-900 dark:text-purple-200">
                  {formData.cmp} <span className="text-sm font-bold text-slate-500">{formData.unidadMedicion}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Límite Permisible Res. 295/03
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${
                liveExposure.superaCMP ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/30' :
                liveExposure.alcanzaNivelAccion ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/30' :
                'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-widest block text-slate-600">
                  Índice Exposición (IE)
                </span>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  IE = {liveExposure.indiceExposicion}
                </div>
                <span className="text-xs font-black uppercase block mt-1">
                  {liveExposure.dictamenExposicion} ({liveExposure.porcentajeCMP}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Unidad de Medición *
                </label>
                <select
                  className="module-form-input font-bold"
                  value={formData.unidadMedicion}
                  onChange={(e) => setFormData({ ...formData, unidadMedicion: e.target.value })}
                >
                  <option value="ppm">ppm (Partes por millón)</option>
                  <option value="mg/m3">mg/m³ (Miligramos por metro cúbico)</option>
                </select>
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Concentración Máxima Permisible (CMP) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  className="module-form-input font-bold"
                  value={formData.cmp}
                  onChange={(e) => setFormData({ ...formData, cmp: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Concentración Ambiental Medida *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="module-form-input font-black"
                  value={formData.concentracionMedida}
                  onChange={(e) => setFormData({ ...formData, concentracionMedida: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  CMP-CPT (Corto Período - 15 min)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="module-form-input"
                  value={formData.cmpCpt || ''}
                  onChange={(e) => setFormData({ ...formData, cmpCpt: Number(e.target.value) })}
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                  Carcinogenicidad (Res. 295/03)
                </label>
                <select
                  className="module-form-input"
                  value={formData.carcinogenicidad}
                  onChange={(e) => setFormData({ ...formData, carcinogenicidad: e.target.value })}
                >
                  <option value="No clasificado">No clasificado</option>
                  <option value="A1 (Carcinógeno humano confirmado)">A1 - Humano Confirmado</option>
                  <option value="A2 (Sospechoso en humanos)">A2 - Sospechoso en Humanos</option>
                  <option value="A3 (Animal confirmado)">A3 - Animal Confirmado</option>
                  <option value="A4 (No clasificable en humanos)">A4 - No Clasificable</option>
                  <option value="A5 (No sospechoso)">A5 - No Sospechoso</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-rose-600 cursor-pointer"
                    checked={formData.viaDermica}
                    onChange={(e) => setFormData({ ...formData, viaDermica: e.target.checked })}
                  />
                  <div>
                    <span className="text-xs font-black text-rose-600 block">Notación Vía Dérmica (Skin)</span>
                    <span className="text-[10px] text-slate-500">Absorción importante por la piel</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                Índice Biológico de Exposición (BEI) Aplicable
              </label>
              <input
                className="module-form-input"
                value={formData.bei || ''}
                onChange={(e) => setFormData({ ...formData, bei: e.target.value })}
                placeholder="Ej: Ácido hipúrico en orina (1.6 g/g creatinina)"
              />
            </div>

            <div className="flex gap-4 flex-wrap justify-center w-full mt-6">
              <button
                type="button"
                onClick={handleBack}
                style={{ background: 'linear-gradient(135deg, #64748b, #475569)', color: 'white', border: 'none' }}
                className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                <ChevronLeft size={18} /> Atrás
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                className="px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                Continuar a EPP y Firmas <ChevronRight size={18} />
              </button>
            </div>
          </ModuleFormSection>
        )}

        {/* PASO 4: EPP, PRIMEROS AUXILIOS, DICTAMEN Y FIRMAS */}
        {step === 4 && (
          <ModuleFormSection title="IV — EPP, Primeros Auxilios y Dictamen Profesional" icon={<Shield />}>
            {/* EPP */}
            <div className="mb-6">
              <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                Elementos de Protección Personal Específicos
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'mask', label: 'Protección Respiratoria' },
                  { key: 'gloves', label: 'Guantes Químicos' },
                  { key: 'goggles', label: 'Gafas Herméticas' },
                  { key: 'apron', label: 'Traje / Delantal Químico' }
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2.5 p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.ppe?.[item.key]}
                      onChange={(e) => setFormData({
                        ...formData,
                        ppe: { ...formData.ppe, [item.key]: e.target.checked }
                      })}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Primeros Auxilios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  En caso de Inhalación
                </label>
                <textarea
                  rows={2}
                  className="module-form-input text-xs"
                  value={formData.firstAid?.inhalation}
                  onChange={(e) => setFormData({
                    ...formData,
                    firstAid: { ...formData.firstAid, inhalation: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="text-[0.7rem] font-[800] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  En caso de Contacto con la Piel
                </label>
                <textarea
                  rows={2}
                  className="module-form-input text-xs"
                  value={formData.firstAid?.skin}
                  onChange={(e) => setFormData({
                    ...formData,
                    firstAid: { ...formData.firstAid, skin: e.target.value }
                  })}
                />
              </div>
            </div>

            {/* Conclusiones y Dictamen */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                <label className="font-extrabold text-sm text-[var(--color-text)] m-0">
                  Dictamen Higiénico y Recomendaciones (Res. MTEySS 295/03)
                </label>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow hover:opacity-90 cursor-pointer"
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
                placeholder="Dictamen técnico del higienista, cumplimiento del CMP, adecuación de ventilación y medidas preventivas..."
              />
            </div>

            {/* Firmas Digitales */}
            <div className="mb-8">
              <label className="font-extrabold text-sm text-[var(--color-text)] block mb-3">
                Firmas y Validación Institucional
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border rounded-xl">
                  <SignatureCanvas
                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                    initialImage={formData.operatorSignature}
                    label="Firma del Operador / Trabajador"
                  />
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border rounded-xl">
                  <SignatureCanvas
                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                    initialImage={formData.supervisorSignature}
                    label="Firma del Supervisor / Empleador"
                  />
                </div>
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
                <Save size={16} /> GUARDAR SUSTANCIA
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