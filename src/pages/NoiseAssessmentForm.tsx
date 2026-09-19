import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Volume2, Save, Eye, Printer, Share2, Pencil,
  CheckCircle2, AlertTriangle, ShieldCheck, Headphones, Award,
  Building2, Clock, Calendar, Activity, Info
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import NoiseAssessmentPdf from '../components/NoiseAssessmentPdf';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';
import { evaluateFullNoiseProtocolSRT85 } from '../utils/srtProtocols';

const NOISE_LIMITS = {
  actionLevel: 80,
  actionLevelHigh: 85,
  limitValue: 87,
  peakAction: 135,
  peakLimit: 140
};

const HEARING_PROTECTORS = [
  { id: 'tapones_espuma', name: 'Tapones de espuma expansible (NRR 29 dB)', nrr: 29, tipo: 'Tapones de espuma / silicona' },
  { id: 'tapones_silicona', name: 'Tapones premoldeados de silicona (NRR 25 dB)', nrr: 25, tipo: 'Tapones de espuma / silicona' },
  { id: 'orejeras_copa', name: 'Orejeras / Auriculares de copa (NRR 25 dB)', nrr: 25, tipo: 'Orejeras / Auriculares de copa' },
  { id: 'orejeras_alta', name: 'Orejeras de alta atenuación para casco (NRR 30 dB)', nrr: 30, tipo: 'Orejeras / Auriculares de copa' },
  { id: 'dual', name: 'Protección dual (Tapón + Copa) (NRR 35 dB)', nrr: 35, tipo: 'Protección Dual (Tapón + Copa)' }
];

export default function NoiseAssessmentForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Protocolo de Ruido' : 'Nuevo Protocolo de Ruido — Res. SRT 85/12');

  const [measurement, setMeasurement] = useState<any>({
    empresa: '',
    razonSocial: '',
    cuit: '',
    sector: '',
    location: '',
    puestoTrabajo: '',
    task: '',
    tarea: '',
    workerName: '',
    trabajadorNombre: '',
    trabajadorCuil: '',
    trabajadoresExpuestosPuesto: 1,
    type: 'personal',
    tipoRuido: 'Continuo',
    date: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    horaFin: '16:00',
    duracionJornadaHoras: 8,
    duration: 8,
    duracionMedicionHoras: 8,
    levels: {
      lavg: 85,
      lmax: '',
      lmin: '',
      lpeak: '',
      lex8h: 85,
      dose: 100
    },
    backgroundNoise: '',
    ruidoFondoDb: '',
    instrument: {
      tipo: 'Sonómetro Integrador Clase 1',
      model: '',
      serial: '',
      lastCalibration: '',
      calibrador: {
        marca: '',
        modelo: '',
        numeroSerie: '',
        nivelCalibracionDb: 94.0
      },
      verificacionInicialDb: 94.0,
      verificacionFinalDb: 94.0
    },
    hearingProtection: {
      usaEPP: true,
      tipoEPP: 'Tapones de espuma / silicona',
      marcaModelo: '',
      nrr_snr: 25,
      factorDesclasificacion: 0.70,
      nivelEfectivoAtenuado: 72.4,
      atenuacionAdecuada: true
    },
    observations: '',
    technician: '',
    technicianLicense: '',
    operatorSignature: '',
    supervisorSignature: '',
    professionalSignature: '',
    showSignatures: { operator: true, professional: true, supervisor: true }
  });

  const [professional, setProfessional] = useState<any>({
    name: '',
    license: '',
    signature: null,
    stamp: null
  });

  const setShowSignatures = (updater: any) => {
    setMeasurement((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = measurement.showSignatures || { operator: true, professional: true, supervisor: true };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.editData) {
      const ed = location.state.editData;
      setMeasurement({
        ...ed,
        empresa: ed.empresa || ed.razonSocial || '',
        razonSocial: ed.razonSocial || ed.empresa || '',
        sector: ed.sector || ed.location || '',
        puestoTrabajo: ed.puestoTrabajo || ed.task || ed.tarea || '',
        workerName: ed.workerName || ed.trabajadorNombre || '',
        trabajadorNombre: ed.trabajadorNombre || ed.workerName || '',
        duracionJornadaHoras: ed.duracionJornadaHoras || ed.duration || 8,
        instrument: {
          tipo: ed.instrument?.tipo || 'Sonómetro Integrador Clase 1',
          model: ed.instrument?.model || ed.equipment || '',
          serial: ed.instrument?.serial || '',
          lastCalibration: ed.instrument?.lastCalibration || '',
          calibrador: ed.instrument?.calibrador || { marca: '', modelo: '', numeroSerie: '', nivelCalibracionDb: 94.0 },
          verificacionInicialDb: ed.instrument?.verificacionInicialDb ?? 94.0,
          verificacionFinalDb: ed.instrument?.verificacionFinalDb ?? 94.0
        },
        hearingProtection: typeof ed.hearingProtection === 'object' ? ed.hearingProtection : {
          usaEPP: !!ed.hearingProtection,
          tipoEPP: 'Tapones de espuma / silicona',
          marcaModelo: typeof ed.hearingProtection === 'string' ? ed.hearingProtection : '',
          nrr_snr: 25,
          factorDesclasificacion: 0.70,
          nivelEfectivoAtenuado: 72.4,
          atenuacionAdecuada: true
        },
        operatorSignature: ed.operatorSignature || '',
        supervisorSignature: ed.supervisorSignature || ed.signature || '',
        signature: ed.signature || ed.supervisorSignature || '',
        showSignatures: ed.showSignatures || { operator: true, professional: true, supervisor: true }
      });
      setIsEdit(true);
    }
  }, [location.state]);

  useEffect(() => {
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
      if (!measurement.technician) {
        setMeasurement((prev: any) => ({
          ...prev,
          technician: prev.technician || data.name || '',
          technicianLicense: prev.technicianLicense || data.license || ''
        }));
      }
    } else {
      setProfessional((prev: any) => ({ ...prev, signature, stamp }));
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Evaluación en tiempo real con el motor Res. SRT 85/12
  const evalMetrics = useMemo(() => {
    const laeqVal = parseFloat(measurement.levels?.lavg) || 0;
    const fondoVal = parseFloat(measurement.ruidoFondoDb || measurement.backgroundNoise || 0);
    const jHs = Number(measurement.duracionJornadaHoras) || Number(measurement.duration) || 8;

    return evaluateFullNoiseProtocolSRT85({
      laeq: laeqVal,
      duracionJornadaHoras: jHs,
      duracionMedicionHoras: Number(measurement.duracionMedicionHoras) || jHs,
      ruidoFondoDb: fondoVal > 0 ? fondoVal : undefined,
      instrument: {
        fechaCalibracionLaboratorio: measurement.instrument?.lastCalibration,
        verificacionInicialDb: Number(measurement.instrument?.verificacionInicialDb),
        verificacionFinalDb: Number(measurement.instrument?.verificacionFinalDb)
      },
      hearingProtection: {
        usaEPP: measurement.hearingProtection?.usaEPP,
        nrr_snr: Number(measurement.hearingProtection?.nrr_snr),
        factorDesclasificacion: measurement.hearingProtection?.factorDesclasificacion ?? 0.70
      }
    });
  }, [
    measurement.levels?.lavg,
    measurement.duracionJornadaHoras,
    measurement.duracionMedicionHoras,
    measurement.ruidoFondoDb,
    measurement.backgroundNoise,
    measurement.instrument,
    measurement.hearingProtection
  ]);

  // Sincronizar niveles calculados automáticamente
  useEffect(() => {
    setMeasurement((prev: any) => ({
      ...prev,
      levels: {
        ...prev.levels,
        lex8h: evalMetrics.lex8h,
        dose: evalMetrics.dosisDiariaPercent
      },
      hearingProtection: {
        ...prev.hearingProtection,
        nivelEfectivoAtenuado: prev.hearingProtection?.nrr_snr
          ? Math.max(0, Math.round((evalMetrics.nivelCorregidoLaeq - ((Number(prev.hearingProtection.nrr_snr) - 7) * 0.70)) * 10) / 10)
          : evalMetrics.nivelCorregidoLaeq,
        atenuacionAdecuada: evalMetrics.eppAtenuacionAdecuada
      }
    }));
  }, [evalMetrics.lex8h, evalMetrics.dosisDiariaPercent, evalMetrics.nivelCorregidoLaeq, evalMetrics.eppAtenuacionAdecuada]);

  const handleSave = () => {
    if (!measurement.workerName && !measurement.trabajadorNombre) {
      toast.error('Por favor indique el nombre del trabajador evaluado (*)');
      return;
    }
    if (!measurement.levels.lavg) {
      toast.error('Por favor ingrese el nivel sonoro LAeq (*)');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('noise_assessments_db') || '[]');
    let updated;

    const entryToSave = {
      ...measurement,
      id: isEdit ? (measurement.id || `NA-${Date.now()}`) : `NA-${Date.now()}`,
      createdAt: measurement.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      razonSocial: measurement.empresa || measurement.razonSocial || 'Empresa Sin Nombre',
      empresa: measurement.empresa || measurement.razonSocial || 'Empresa Sin Nombre',
      sector: measurement.sector || measurement.location || 'General',
      location: measurement.sector || measurement.location || 'General',
      puestoTrabajo: measurement.puestoTrabajo || measurement.task || 'Puesto General',
      task: measurement.puestoTrabajo || measurement.task || 'Puesto General',
      workerName: measurement.workerName || measurement.trabajadorNombre || 'Trabajador',
      trabajadorNombre: measurement.workerName || measurement.trabajadorNombre || 'Trabajador',
      duration: measurement.duracionJornadaHoras || 8,
      status: {
        level: evalMetrics.limiteExcedido ? 'critical' : evalMetrics.nivelAccionAlcanzado ? 'warning' : 'normal',
        color: evalMetrics.limiteExcedido ? '#dc2626' : evalMetrics.nivelAccionAlcanzado ? '#d97706' : '#16a34a',
        label: evalMetrics.dictamenGeneral
      },
      dictamen: evalMetrics.dictamenGeneral,
      evalMetrics: evalMetrics,
      professionalSignature: measurement.professionalSignature || professional.signature,
      professionalName: measurement.professionalName || professional.name,
      professionalLicense: measurement.professionalLicense || professional.license,
      professionalStamp: measurement.professionalStamp || professional.stamp,
      showSignatures: measurement.showSignatures || { operator: true, professional: true, supervisor: true }
    };

    if (isEdit) {
      updated = saved.map((n: any) => n.id === measurement.id ? entryToSave : n);
      toast.success('Protocolo de ruido actualizado correctamente');
    } else {
      updated = [entryToSave, ...saved];
      toast.success('Protocolo de ruido guardado en el historial');
    }

    localStorage.setItem('noise_assessments_db', JSON.stringify(updated));
    navigate('/noise-assessment');
  };

  return (
    <ModuleFormLayout>
      <ModuleFormToolbar
        title={isEdit ? 'Editar Protocolo de Ruido' : 'Nuevo Protocolo de Ruido'}
        subtitle="Resolución S.R.T. N° 85/12 • Dec. 351/79 Anexo V"
        icon={<Volume2 size={32} color="#ffffff" />}
      />

      <ModuleFormDocument id="pdf-content">
        {/* SECCIÓN 1: DATOS DEL ESTABLECIMIENTO */}
        <ModuleFormSection title="1. Datos del Establecimiento y Puesto Evaluado" icon={<Building2 />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Razón Social / Obra *</label>
              <input
                type="text"
                value={measurement.empresa}
                onChange={(e) => setMeasurement({ ...measurement, empresa: e.target.value, razonSocial: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
                placeholder="Nombre de la empresa..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">C.U.I.T. N° *</label>
              <input
                type="text"
                value={measurement.cuit}
                onChange={(e) => setMeasurement({ ...measurement, cuit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
                placeholder="Ej: 30-12345678-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Sector / Área *</label>
              <input
                type="text"
                value={measurement.sector}
                onChange={(e) => setMeasurement({ ...measurement, sector: e.target.value, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
                placeholder="Ej: Sala de Compresores, Taller..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Puesto de Trabajo / Tarea *</label>
              <input
                type="text"
                value={measurement.puestoTrabajo}
                onChange={(e) => setMeasurement({ ...measurement, puestoTrabajo: e.target.value, task: e.target.value, tarea: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
                placeholder="Ej: Operador de Torno, Amolador..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Trabajador Evaluado *</label>
              <input
                type="text"
                value={measurement.workerName}
                onChange={(e) => setMeasurement({ ...measurement, workerName: e.target.value, trabajadorNombre: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
                placeholder="Nombre y Apellido del operario..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">CUIL del Trabajador</label>
              <input
                type="text"
                value={measurement.trabajadorCuil}
                onChange={(e) => setMeasurement({ ...measurement, trabajadorCuil: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
                placeholder="Ej: 20-35123456-7"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Trabajadores Expuestos en el Puesto</label>
              <input
                type="number"
                min="1"
                value={measurement.trabajadoresExpuestosPuesto}
                onChange={(e) => setMeasurement({ ...measurement, trabajadoresExpuestosPuesto: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm text-center focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Jornada Habitual de Trabajo (hs)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                value={measurement.duracionJornadaHoras}
                onChange={(e) => setMeasurement({ ...measurement, duracionJornadaHoras: Number(e.target.value), duration: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm text-center focus:border-amber-500"
              />
            </div>
          </div>
        </ModuleFormSection>

        {/* SECCIÓN 2: INSTRUMENTAL Y VERIFICACIÓN ACÚSTICA */}
        <ModuleFormSection title="2. Instrumental Utilizado y Verificación In-Situ (Res. SRT 85/12)" icon={<Award />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Instrumental</label>
              <select
                value={measurement.instrument.tipo}
                onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, tipo: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
              >
                <option value="Sonómetro Integrador Clase 1">Sonómetro Integrador Clase 1</option>
                <option value="Sonómetro Integrador Clase 2">Sonómetro Integrador Clase 2</option>
                <option value="Dosímetro Personal">Dosímetro Personal de Ruido</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Marca y Modelo</label>
              <input
                type="text"
                value={measurement.instrument.model}
                onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, model: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
                placeholder="Ej: Casella CEL-630 / Quest Edge"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">N° de Serie</label>
              <input
                type="text"
                value={measurement.instrument.serial}
                onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, serial: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
                placeholder="S/N: 123456"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Calibración Periódica Laboratorio</label>
              <input
                type="date"
                value={measurement.instrument.lastCalibration}
                onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, lastCalibration: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Calibración In-Situ Inicial (dB)</label>
              <input
                type="number"
                step="0.1"
                value={measurement.instrument.verificacionInicialDb}
                onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, verificacionInicialDb: Number(e.target.value) } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm text-center focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Calibración In-Situ Final (dB)</label>
              <input
                type="number"
                step="0.1"
                value={measurement.instrument.verificacionFinalDb}
                onChange={(e) => setMeasurement({ ...measurement, instrument: { ...measurement.instrument, verificacionFinalDb: Number(e.target.value) } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm text-center focus:border-amber-500"
              />
            </div>
          </div>

          {/* Alertas de Instrumental */}
          {evalMetrics.calibracionLaboratorioVencida && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>Certificado de calibración de laboratorio con más de 24 meses. Se requiere calibración periódica con patrones trazables a INTI/SAC.</span>
            </div>
          )}

          {evalMetrics.derivaCalibracionInSituExcedida && (
            <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>La deriva entre la verificación inicial y final supera 0.5 dB. La medición puede ser objetada según Res. SRT 85/12.</span>
            </div>
          )}
        </ModuleFormSection>

        {/* SECCIÓN 3: NIVELES SONOROS Y EVALUACIÓN NORMATIVA */}
        <ModuleFormSection title="3. Parámetros Acústicos y Evaluación Res. SRT 85/12" icon={<Activity />}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Medición</label>
              <select
                value={measurement.type}
                onChange={(e) => setMeasurement({ ...measurement, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
              >
                <option value="personal">Dosimetría Personal</option>
                <option value="area">Medición de Área / Puesto Fijo</option>
                <option value="peak">Ruido de Impacto</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Ruido</label>
              <select
                value={measurement.tipoRuido}
                onChange={(e) => setMeasurement({ ...measurement, tipoRuido: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
              >
                <option value="Continuo">Continuo</option>
                <option value="Intermitente">Intermitente</option>
                <option value="De Impacto / Impulsivo">De Impacto / Impulsivo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nivel Medido LAeq (dB(A)) *</label>
              <input
                type="number"
                step="0.1"
                value={measurement.levels.lavg}
                onChange={(e) => setMeasurement({ ...measurement, levels: { ...measurement.levels, lavg: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-amber-400 font-black text-base text-center focus:border-amber-500"
                placeholder="Ej: 87.5"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ruido de Fondo (dB(A))</label>
              <input
                type="number"
                step="0.1"
                value={measurement.ruidoFondoDb || measurement.backgroundNoise}
                onChange={(e) => setMeasurement({ ...measurement, ruidoFondoDb: e.target.value, backgroundNoise: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm text-center focus:border-amber-500"
                placeholder="Con fuente apagada"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nivel Pico Lpeak (dB(C))</label>
              <input
                type="number"
                step="0.1"
                value={measurement.levels.lpeak || ''}
                onChange={(e) => setMeasurement({ ...measurement, levels: { ...measurement.levels, lpeak: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm text-center focus:border-amber-500"
                placeholder="Límite 140 dBC Peak"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nivel Máximo Lmax (dB(A))</label>
              <input
                type="number"
                step="0.1"
                value={measurement.levels.lmax || ''}
                onChange={(e) => setMeasurement({ ...measurement, levels: { ...measurement.levels, lmax: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm text-center focus:border-amber-500"
                placeholder="dB(A)"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nivel Mínimo Lmin (dB(A))</label>
              <input
                type="number"
                step="0.1"
                value={measurement.levels.lmin || ''}
                onChange={(e) => setMeasurement({ ...measurement, levels: { ...measurement.levels, lmin: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm text-center focus:border-amber-500"
                placeholder="dB(A)"
              />
            </div>
          </div>

          {evalMetrics.ruidoFondoInvalido && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>Diferencia entre ruido total y ruido de fondo menor a 3 dB. Medición NO VÁLIDA según Resolución S.R.T. N° 85/12.</span>
            </div>
          )}

          {/* Tarjeta de Resultados Normativos Res. 85/12 */}
          <div className="mt-6 p-5 rounded-2xl border bg-slate-900/60 shadow-lg" style={{
            borderColor: evalMetrics.limiteExcedido ? '#ef4444' : evalMetrics.nivelAccionAlcanzado ? '#f59e0b' : '#10b981'
          }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-700/60 pb-4 mb-4">
              <div>
                <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider block">Nivel Continuo Equivalente</span>
                <div className="flex items-baseline gap-2">
                  <span style={{
                    color: evalMetrics.limiteExcedido ? '#ef4444' : evalMetrics.nivelAccionAlcanzado ? '#f59e0b' : '#10b981'
                  }} className="text-3xl font-black">
                    {evalMetrics.nivelCorregidoLaeq} <span className="text-base font-bold">dB(A)</span>
                  </span>
                  {evalMetrics.correccionFondoDb > 0 && (
                    <span className="text-xs text-slate-400 italic">(Corregido por fondo -{evalMetrics.correccionFondoDb} dB)</span>
                  )}
                </div>
              </div>

              <div className="text-white px-3.5 py-1.5 rounded-full font-black text-xs uppercase shadow-md flex items-center gap-1.5" style={{
                background: evalMetrics.limiteExcedido ? '#ef4444' : evalMetrics.nivelAccionAlcanzado ? '#f59e0b' : '#10b981'
              }}>
                {evalMetrics.limiteExcedido ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                {evalMetrics.dictamenGeneral}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-semibold">Nivel Diario LEX,8h</span>
                <span className="text-lg font-black text-white">{evalMetrics.lex8h} dB(A)</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-semibold">Dosis Diaria Calculada</span>
                <span style={{ color: evalMetrics.dosisDiariaPercent > 100 ? '#ef4444' : '#10b981' }} className="text-lg font-black">
                  {evalMetrics.dosisDiariaPercent}%
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-semibold">Tiempo Máx. Permitido</span>
                <span className="text-lg font-black text-amber-400">{evalMetrics.tiempoPermitidoHoras} hs</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-semibold">Límite Legal (8h)</span>
                <span className="text-lg font-black text-slate-300">85 dB(A)</span>
              </div>
            </div>
          </div>
        </ModuleFormSection>

        {/* SECCIÓN 4: PROTECCIÓN AUDITIVA (EPP) */}
        <ModuleFormSection title="4. Evaluación y Atenuación de Protectores Auditivos (IRAM 4060)" icon={<Headphones />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Protector Auditivo Seleccionado</label>
              <select
                value={measurement.hearingProtection?.tipoEPP}
                onChange={(e) => {
                  const selected = HEARING_PROTECTORS.find(p => p.tipo === e.target.value) || HEARING_PROTECTORS[0];
                  setMeasurement({
                    ...measurement,
                    hearingProtection: {
                      ...measurement.hearingProtection,
                      tipoEPP: e.target.value,
                      nrr_snr: selected.nrr
                    }
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
              >
                <option value="Tapones de espuma / silicona">Tapones de espuma / silicona</option>
                <option value="Orejeras / Auriculares de copa">Orejeras / Auriculares de copa</option>
                <option value="Protección Dual (Tapón + Copa)">Protección Dual (Tapón + Copa)</option>
                <option value="Sin EPP">Sin EPP</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Marca / Modelo de Protector</label>
              <input
                type="text"
                value={measurement.hearingProtection?.marcaModelo || ''}
                onChange={(e) => setMeasurement({
                  ...measurement,
                  hearingProtection: { ...measurement.hearingProtection, marcaModelo: e.target.value }
                })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
                placeholder="Ej: 3M 1110 / Libus L-320"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Atenuación Nominal NRR / SNR (dB)</label>
              <input
                type="number"
                value={measurement.hearingProtection?.nrr_snr || 25}
                onChange={(e) => setMeasurement({
                  ...measurement,
                  hearingProtection: { ...measurement.hearingProtection, nrr_snr: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm text-center focus:border-amber-500"
              />
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs text-slate-400 font-bold block">Nivel Sonoro Estimado al Oído del Trabajador:</span>
              <span className="text-xl font-black text-emerald-400">
                {measurement.hearingProtection?.nivelEfectivoAtenuado || 70} dB(A)
              </span>
              <span className="text-xs text-slate-400 ml-2 font-medium">(Fórmula desclasificada: LAeq - (NRR - 7) × 0.70)</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-black ${
              measurement.hearingProtection?.atenuacionAdecuada
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {measurement.hearingProtection?.atenuacionAdecuada ? 'ATENUACIÓN ADECUADA (≤ 80 dBA)' : 'ATENUACIÓN INSUFICIENTE'}
            </div>
          </div>
        </ModuleFormSection>

        {/* SECCIÓN 5: OBSERVACIONES Y RECOMENDACIONES */}
        <ModuleFormSection title="5. Conclusiones y Medidas de Control" icon={<Info />}>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Observaciones del Relevamiento</label>
            <textarea
              value={measurement.observations}
              onChange={(e) => setMeasurement({ ...measurement, observations: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm min-h-[90px] focus:border-amber-500"
              placeholder="Describa particularidades de la operación, ciclos de marcha, fuentes de ruido acústico secundario..."
            />
          </div>

          {evalMetrics.recomendacionesAutomaticas.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/60">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block mb-2">
                Medidas Preventivas Exigidas por Resolución S.R.T. N° 85/12:
              </span>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300 font-medium">
                {evalMetrics.recomendacionesAutomaticas.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Especialista / Técnico Responsable</label>
            <input
              type="text"
              value={measurement.technician}
              onChange={(e) => setMeasurement({ ...measurement, technician: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:border-amber-500"
              placeholder="Nombre y Apellido del profesional actuante"
            />
          </div>
        </ModuleFormSection>

        {/* SECCIÓN 6: FIRMAS Y VALIDACIÓN */}
        <ModuleFormSection title="6. Firmas y Validación Oficial" icon={<CheckCircle2 />}>
          <div className="p-4 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-700 shadow-lg space-y-3 mb-6 no-print">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm shadow-inner">
                ✍️
              </div>
              <div>
                <span className="text-amber-400 text-xs font-black uppercase tracking-wider block">
                  Visibilidad de Firmas en el Protocolo Oficial
                </span>
                <span className="text-slate-400 text-[11px] font-medium block">
                  Selecciona las firmas reglamentarias a incluir en el Anexo I
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 flex-wrap pt-1">
              {[
                { id: 'operator', label: 'Trabajador Evaluado', color: '#2563eb', icon: '👤' },
                { id: 'professional', label: 'Especialista H&S', color: '#9333ea', icon: '🛡️' },
                { id: 'supervisor', label: 'Responsable de la Empresa', color: '#059669', icon: '📋' }
              ].map((sig) => {
                const isChecked = !!showSignatures[sig.id as keyof typeof showSignatures];
                return (
                  <button
                    type="button"
                    key={sig.id}
                    onClick={() => setShowSignatures((s: any) => ({ ...s, [sig.id]: !isChecked }))}
                    style={{
                      backgroundColor: isChecked ? sig.color : '#1e293b',
                      color: '#ffffff',
                      border: isChecked ? 'none' : '1px solid #334155'
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all">
                    <CheckCircle2 size={13} className={isChecked ? 'text-white' : 'text-slate-600'} />
                    <span>{sig.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-6">
            {showSignatures.operator && (
              <div className="p-5 bg-slate-900/30 border border-slate-700/60 rounded-2xl">
                <SignatureCanvas
                  onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                  initialImage={measurement.operatorSignature}
                  title="Firma del Trabajador Evaluado"
                />
              </div>
            )}

            {showSignatures.professional && (
              <div className="p-5 bg-slate-900/30 border border-slate-700/60 rounded-2xl">
                <SignatureCanvas
                  onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                  initialImage={measurement.professionalSignature || professional.signature}
                  title="Firma de Especialista H&S"
                />
              </div>
            )}

            {showSignatures.supervisor && (
              <div className="p-5 bg-slate-900/30 border border-slate-700/60 rounded-2xl">
                <SignatureCanvas
                  onSave={(sig) => setMeasurement((prev: any) => ({ ...prev, supervisorSignature: sig || '', signature: sig || '' }))}
                  initialImage={measurement.supervisorSignature || measurement.signature}
                  title="Firma de Responsable / Empresa"
                />
              </div>
            )}
          </div>
        </ModuleFormSection>
      </ModuleFormDocument>

      <ModuleActionBar
        actions={[
          { id: 'save', label: 'GUARDAR PROTOCOLO', icon: <Save />, variant: 'primary', onClick: () => requirePro(handleSave) },
          { id: 'share', label: 'COMPARTIR', icon: <Share2 />, variant: 'secondary', onClick: () => requirePro(() => setShowShareModal(true)) },
          { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer />, variant: 'secondary', onClick: () => requirePro(() => window.print()) },
          { id: 'cancel', label: 'VOLVER', icon: <ArrowLeft />, variant: 'danger', onClick: () => navigate('/noise-assessment') }
        ]}
      />

      <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Protocolo de Medición de Ruido — Res. SRT 85/12"
        text={`🔊 Protocolo de Ruido (Res. SRT 85/12)\n🏢 Empresa: ${measurement.empresa}\n👤 Trabajador: ${measurement.workerName}\n📈 Nivel LAeq: ${measurement.levels?.lavg} dB(A)\n📊 Dictamen: ${evalMetrics.dictamenGeneral}`}
        rawMessage={`Protocolo de Ruido - ${measurement.empresa || measurement.workerName}`}
        fileName={`Ruido_${measurement.empresa || measurement.workerName || 'Protocolo'}.pdf`}
      />

      {/* Vista previa oculta para impresión y generación de PDF */}
      <div className="print-only fixed left-[-9999px] top-0 opacity-[0.01] pointer-events-none" id="pdf-content">
        <NoiseAssessmentPdf data={{
          ...measurement,
          professionalSignature: measurement.professionalSignature || professional.signature,
          professionalName: professional.name,
          professionalLicense: professional.license,
          professionalStamp: measurement.professionalStamp || professional.stamp,
          id: measurement.id || Date.now().toString(),
          createdAt: measurement.createdAt || new Date().toISOString()
        }} />
      </div>
    </ModuleFormLayout>
  );
}