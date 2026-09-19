import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Zap, Save, Eye, Printer, Share2, Plus, Trash2,
  CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, Sparkles, Building2,
  Gauge, HelpCircle
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import ShareModal from '../components/ShareModal';
import GroundingProtocolPdf from '../components/GroundingProtocolPdf';
import { usePaywall } from '../hooks/usePaywall';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleActionBar,
} from '../components/module';
import type {
  GroundingProtocol,
  JabalinaMeasurement,
  ContinuityPoint,
  DifferentialTest,
  ElectrodeType,
  GroundingSystemType,
  SoilCondition
} from '../types/grounding';
import { evaluateFullGroundingProtocol } from '../utils/srtProtocols';

const DEFAULT_JABALINA: Omit<JabalinaMeasurement, 'id'> = {
  codigo: 'PAT-01',
  ubicacion: 'Tablero General Principal',
  tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
  resistenciaMedida: 4.2,
  resistenciaMaximaAdmisible: 10,
  camaraInspeccion: true,
  borneDesconexion: true,
  estadoFisico: 'Bueno',
  conforme: true,
  observaciones: 'Cámara accesible y borne ajustado'
};

export default function GroundingProtocolForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isEdit, setIsEdit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useDocumentTitle(isEdit ? 'Editar Protocolo Res. 900/15' : 'Nuevo Protocolo Res. 900/15');

  const [protocol, setProtocol] = useState<GroundingProtocol>({
    id: `PAT-${Date.now()}`,
    razonSocial: '',
    cuit: '',
    artNombre: '',
    establecimiento: '',
    tipoInstalacion: 'Industrial',
    direccion: '',
    localidad: '',
    provincia: 'Buenos Aires',
    actividadPrincipal: '',
    fechaMedicion: new Date().toISOString().split('T')[0],
    fechaVencimiento: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    })(),
    profesionalNombre: '',
    profesionalMatricula: '',
    profesionalTitulo: 'Lic. en Higiene y Seguridad en el Trabajo',
    colegioProfesional: '',
    instrumentoMarca: 'Megger / CEM',
    instrumentoModelo: 'DET-4TD / DT-5300B',
    instrumentoNroSerie: 'MG-884210',
    instrumentoFechaCalibracion: new Date().toISOString().split('T')[0],
    instrumentoCertificadoNro: 'CAL-2025-900',
    instrumentoLaboratorio: 'Laboratorio de Metrología Eléctrica Trazable INTI / SAC',
    tensionSuministro: '380 V Trifásico + Neutro / 220 V',
    esquemaConexionTierra: 'TT',
    tipoAcometida: 'Subterránea',
    potenciaContratadaKw: '25 kW',
    transformadorPropio: false,
    estadoSuelo: 'Húmedo',
    tensionSeguridadContacto: 50,
    jabalinas: [
      {
        id: '1',
        codigo: 'PAT-01',
        ubicacion: 'Tablero General (Ingreso de Acometida)',
        tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
        resistenciaMedida: 3.8,
        resistenciaMaximaAdmisible: 10,
        camaraInspeccion: true,
        borneDesconexion: true,
        estadoFisico: 'Bueno',
        conforme: true,
        observaciones: 'Conexión abulonada en buen estado'
      }
    ],
    continuidadMasas: [
      {
        id: '1',
        codigo: 'CM-01',
        elemento: 'Carcasa Metálica Tablero General',
        ubicacion: 'Sala Eléctrica',
        resistenciaContinuidad: 0.15,
        continuidadConforme: true,
        observaciones: 'Conductor de protección PE 10mm²'
      },
      {
        id: '2',
        codigo: 'CM-02',
        elemento: 'Estructura Metálica de Nave / Columnas',
        ubicacion: 'Nave de Producción',
        resistenciaContinuidad: 0.28,
        continuidadConforme: true,
        observaciones: 'Soldadura exotérmica a pilar'
      }
    ],
    diferenciales: [
      {
        id: '1',
        codigo: 'ID-01',
        tableroUbicacion: 'Tablero Seccional Iluminación',
        circuitoProtegido: 'Luminarias y Tomas de Oficinas',
        corrienteSensibilidadMa: 30,
        tiempoDisparoMs: 26,
        pulsadorTestFunciona: true,
        conforme: true,
        observaciones: 'Disparo inmediato conforme norma'
      }
    ],
    fotos: [],
    cumpleNormativa: true,
    conclusiones: '',
    recomendaciones: [],
    plazoAdecuacionDias: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Cargar datos previos si es edición o perfil del usuario
  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.editData) {
      setProtocol(location.state.editData);
      setIsEdit(true);
      return;
    }

    try {
      const savedPersonal = localStorage.getItem('personalData');
      if (savedPersonal) {
        const pd = JSON.parse(savedPersonal);
        setProtocol(prev => ({
          ...prev,
          profesionalNombre: pd.name || prev.profesionalNombre,
          profesionalMatricula: pd.license || prev.profesionalMatricula,
          profesionalTitulo: pd.profession || prev.profesionalTitulo,
          razonSocial: pd.company || prev.razonSocial,
          cuit: pd.cuit || prev.cuit,
          direccion: pd.address || prev.direccion
        }));
      }
    } catch (e) {
      console.error('[GROUNDING FORM] Error parsing personalData:', e);
    }
  }, [location.state]);

  // Actualizar fecha de vencimiento al cambiar fecha de medición
  const handleFechaMedicionChange = (fecha: string) => {
    try {
      const d = new Date(fecha);
      d.setFullYear(d.getFullYear() + 1);
      const vencimiento = d.toISOString().split('T')[0];
      setProtocol(prev => ({ ...prev, fechaMedicion: fecha, fechaVencimiento: vencimiento }));
    } catch {
      setProtocol(prev => ({ ...prev, fechaMedicion: fecha }));
    }
  };

  // Evaluación en tiempo real
  const evaluation = evaluateFullGroundingProtocol(protocol);

  // Manejo de Jabalinas
  const addJabalina = () => {
    const nextIdx = protocol.jabalinas.length + 1;
    const newJ: JabalinaMeasurement = {
      id: Date.now().toString(),
      codigo: `PAT-${nextIdx < 10 ? '0' + nextIdx : nextIdx}`,
      ubicacion: '',
      tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
      resistenciaMedida: 5.0,
      resistenciaMaximaAdmisible: protocol.esquemaConexionTierra === 'TT' ? 40 : 10,
      camaraInspeccion: true,
      borneDesconexion: true,
      estadoFisico: 'Bueno',
      conforme: true,
      observaciones: ''
    };
    setProtocol(prev => ({ ...prev, jabalinas: [...prev.jabalinas, newJ] }));
  };

  const updateJabalina = (id: string, field: keyof JabalinaMeasurement, value: any) => {
    setProtocol(prev => ({
      ...prev,
      jabalinas: prev.jabalinas.map(j => {
        if (j.id !== id) return j;
        const updated = { ...j, [field]: value };
        if (field === 'resistenciaMedida' || field === 'resistenciaMaximaAdmisible') {
          const max = field === 'resistenciaMaximaAdmisible' ? Number(value) : updated.resistenciaMaximaAdmisible;
          const val = field === 'resistenciaMedida' ? Number(value) : updated.resistenciaMedida;
          updated.conforme = val <= max;
        }
        return updated;
      })
    }));
  };

  const removeJabalina = (id: string) => {
    setProtocol(prev => ({ ...prev, jabalinas: prev.jabalinas.filter(j => j.id !== id) }));
  };

  // Manejo de Continuidad de Masas
  const addContinuidad = () => {
    const nextIdx = protocol.continuidadMasas.length + 1;
    const newM: ContinuityPoint = {
      id: Date.now().toString(),
      codigo: `CM-${nextIdx < 10 ? '0' + nextIdx : nextIdx}`,
      elemento: '',
      ubicacion: '',
      resistenciaContinuidad: 0.2,
      continuidadConforme: true,
      observaciones: ''
    };
    setProtocol(prev => ({ ...prev, continuidadMasas: [...prev.continuidadMasas, newM] }));
  };

  const updateContinuidad = (id: string, field: keyof ContinuityPoint, value: any) => {
    setProtocol(prev => ({
      ...prev,
      continuidadMasas: prev.continuidadMasas.map(m => {
        if (m.id !== id) return m;
        const updated = { ...m, [field]: value };
        if (field === 'resistenciaContinuidad') {
          updated.continuidadConforme = Number(value) <= 1.0;
        }
        return updated;
      })
    }));
  };

  const removeContinuidad = (id: string) => {
    setProtocol(prev => ({ ...prev, continuidadMasas: prev.continuidadMasas.filter(m => m.id !== id) }));
  };

  // Manejo de Diferenciales
  const addDiferencial = () => {
    const nextIdx = protocol.diferenciales.length + 1;
    const newD: DifferentialTest = {
      id: Date.now().toString(),
      codigo: `ID-${nextIdx < 10 ? '0' + nextIdx : nextIdx}`,
      tableroUbicacion: '',
      circuitoProtegido: '',
      corrienteSensibilidadMa: 30,
      tiempoDisparoMs: 25,
      pulsadorTestFunciona: true,
      conforme: true,
      observaciones: ''
    };
    setProtocol(prev => ({ ...prev, diferenciales: [...prev.diferenciales, newD] }));
  };

  const updateDiferencial = (id: string, field: keyof DifferentialTest, value: any) => {
    setProtocol(prev => ({
      ...prev,
      diferenciales: prev.diferenciales.map(d => {
        if (d.id !== id) return d;
        const updated = { ...d, [field]: value };
        if (field === 'tiempoDisparoMs' || field === 'pulsadorTestFunciona') {
          const t = field === 'tiempoDisparoMs' ? Number(value) : updated.tiempoDisparoMs;
          const p = field === 'pulsadorTestFunciona' ? Boolean(value) : updated.pulsadorTestFunciona;
          updated.conforme = t > 0 && t <= 200 && p;
        }
        return updated;
      })
    }));
  };

  const removeDiferencial = (id: string) => {
    setProtocol(prev => ({ ...prev, diferenciales: prev.diferenciales.filter(d => d.id !== id) }));
  };

  // Carga Rápida de Plantilla Típica
  const loadTypicalTemplate = () => {
    setProtocol(prev => ({
      ...prev,
      jabalinas: [
        {
          id: '1',
          codigo: 'PAT-01',
          ubicacion: 'Tablero General Principal (Acometida)',
          tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
          resistenciaMedida: 3.4,
          resistenciaMaximaAdmisible: 10,
          camaraInspeccion: true,
          borneDesconexion: true,
          estadoFisico: 'Bueno',
          conforme: true,
          observaciones: 'Jabalina normalizada 5/8" x 1.5m'
        },
        {
          id: '2',
          codigo: 'PAT-02',
          ubicacion: 'Sala de Compresores / Fuerza Motriz',
          tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
          resistenciaMedida: 4.8,
          resistenciaMaximaAdmisible: 10,
          camaraInspeccion: true,
          borneDesconexion: true,
          estadoFisico: 'Bueno',
          conforme: true,
          observaciones: 'Cámara con tapa de fundición'
        }
      ],
      continuidadMasas: [
        {
          id: '1',
          codigo: 'CM-01',
          elemento: 'Puerta y Chasis Tablero General Principal',
          ubicacion: 'Sala de Tableros',
          resistenciaContinuidad: 0.12,
          continuidadConforme: true,
          observaciones: 'Puente de masa con colilla flexible de cobre'
        },
        {
          id: '2',
          codigo: 'CM-02',
          elemento: 'Chasis Motor Compresor de Aire N° 1',
          ubicacion: 'Sala de Máquinas',
          resistenciaContinuidad: 0.22,
          continuidadConforme: true,
          observaciones: 'Cable PE verde-amarillo 4mm²'
        },
        {
          id: '3',
          codigo: 'CM-03',
          elemento: 'Estructura Metálica Nave Central (Columna C3)',
          ubicacion: 'Planta Fabril',
          resistenciaContinuidad: 0.35,
          continuidadConforme: true,
          observaciones: 'Continuidad a la estructura metálica verificada'
        },
        {
          id: '4',
          codigo: 'CM-04',
          elemento: 'Toma Corriente Uso General Oficinas (Pin de Tierra)',
          ubicacion: 'Administración',
          resistenciaContinuidad: 0.18,
          continuidadConforme: true,
          observaciones: 'Borne de tierra conectado'
        }
      ],
      diferenciales: [
        {
          id: '1',
          codigo: 'ID-01',
          tableroUbicacion: 'Tablero General Principal',
          circuitoProtegido: 'Circuito Cabecera Iluminación',
          corrienteSensibilidadMa: 30,
          tiempoDisparoMs: 24,
          pulsadorTestFunciona: true,
          conforme: true,
          observaciones: 'Disparo instantáneo conforme AEA'
        },
        {
          id: '2',
          codigo: 'ID-02',
          tableroUbicacion: 'Tablero Seccional Oficinas',
          circuitoProtegido: 'Tomas de Computación e Informática',
          corrienteSensibilidadMa: 30,
          tiempoDisparoMs: 28,
          pulsadorTestFunciona: true,
          conforme: true,
          observaciones: 'Disyuntor superinmunizado operando correctamente'
        }
      ]
    }));
    toast.success('Plantilla industrial precargada con éxito');
  };

  // Generar conclusiones automáticas
  const handleAutoConclusions = () => {
    const isOk = evaluation.isFullyCompliant;
    let text = isOk
      ? `Se concluye que la instalación eléctrica del establecimiento "${protocol.razonSocial || 'analizado'}" CUMPLE con las condiciones reglamentarias de seguridad eléctrica respecto a la Resistencia de Puesta a Tierra y Continuidad de las Masas establecidas en el Anexo I de la Resolución S.R.T. N° 900/15 y la Reglamentación AEA 90364.\n\nLos valores de puesta a tierra registrados presentan un promedio de ${evaluation.promedioResistenciaOhms} Ω (siendo el valor máximo registrado de ${evaluation.maxResistenciaMedida} Ω, inferior al límite admisible legal). La tensión presunta de contacto calculada es de ${evaluation.tensionContactoPresuntaMaxVolts} V (límite de seguridad: ${protocol.tensionSeguridadContacto || 50} V). Asimismo, la totalidad de los circuitos ensayados cuentan con conductor de protección PE continuo (≤ 1.0 Ω) y los interruptores diferenciales verificados responden con tiempos de corte inferiores a los 200 milisegundos admisibles.`
      : `Se concluye que la instalación eléctrica del establecimiento "${protocol.razonSocial || 'analizado'}" PRESENTA DESVÍOS Y NO CONFORMIDADES frente a las exigencias del Anexo I de la Resolución S.R.T. N° 900/15 y la Reglamentación AEA 90364 (Dictamen: ${evaluation.dictamenGeneral}, Estado: ${evaluation.estadoInstalacion}).\n\nSe detectaron puntos con resistencia de puesta a tierra superior a los límites máximos admisibles, tensión de contacto presunta excedida (${evaluation.tensionContactoPresuntaMaxVolts} V) y/o falta de continuidad del conductor de protección en masas metálicas. Se establece un plazo perentorio de ${protocol.plazoAdecuacionDias || 30} días para la ejecución de las medidas correctivas señaladas a continuación para restablecer las condiciones seguras de operación.`;

    setProtocol(prev => ({
      ...prev,
      cumpleNormativa: isOk,
      conclusiones: text,
      recomendaciones: evaluation.autoRecommendations
    }));
    toast.success('Conclusiones redactadas automáticamente según mediciones');
  };

  // Guardar protocolo
  const handleSave = () => {
    if (!protocol.razonSocial || !protocol.cuit) {
      toast.error('Por favor complete la Razón Social y CUIT del establecimiento');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('grounding_protocols_db') || '[]');
    const recordToSave: GroundingProtocol = {
      ...protocol,
      cumpleNormativa: evaluation.isFullyCompliant,
      updatedAt: new Date().toISOString()
    };

    let updated;
    if (isEdit) {
      updated = saved.map((p: GroundingProtocol) => p.id === protocol.id ? recordToSave : p);
      toast.success('Protocolo Res. 900/15 actualizado');
    } else {
      updated = [recordToSave, ...saved];
      toast.success('Protocolo Res. 900/15 guardado');
    }

    localStorage.setItem('grounding_protocols_db', JSON.stringify(updated));
    navigate('/grounding');
  };

  return (
    <ModuleFormLayout>
      <ModuleFormToolbar
        onBack={() => navigate('/grounding')}
        title={isEdit ? 'Editar Protocolo Res. 900/15' : 'Nuevo Protocolo de Puesta a Tierra'}
        subtitle="Medición de PAT y Continuidad de Masas · Res. SRT 900/15"
        icon={<Zap size={22} className="text-amber-500" />}
      />

      <div className="max-w-5xl mx-auto px-4 pt-4 flex items-center justify-between">
        <div className="text-xs text-slate-500 font-mono">ID: {protocol.id}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
          >
            <Eye size={15} />
            <span>{showPreview ? 'Ocultar PDF' : 'Vista Previa'}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save size={15} />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Banner informativo y botón de plantilla rápida */}
        <div className="bg-gradient-to-r from-blue-900/90 to-indigo-900/90 text-white rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30">
              <Zap size={28} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Protocolo Obligatorio Res. SRT 900/15
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black tracking-wide">
                  VALIDEZ ANUAL
                </span>
              </h2>
              <p className="text-xs text-blue-100 max-w-2xl">
                Genere el informe técnico con validez legal exigido por la Superintendencia de Riesgos del Trabajo, inspectores municipales y aseguradoras (ART).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadTypicalTemplate}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Sparkles size={16} className="text-amber-300" />
            Cargar Plantilla Tipo
          </button>
        </div>

        {/* Semáforo de Evaluación en Vivo */}
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          evaluation.isFullyCompliant
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-3">
            {evaluation.isFullyCompliant ? (
              <ShieldCheck size={32} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <ShieldAlert size={32} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
            )}
            <div>
              <div className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Dictamen: {evaluation.dictamenGeneral}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  evaluation.isFullyCompliant ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {evaluation.estadoInstalacion}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {evaluation.jabalinasConformes} de {evaluation.totalJabalinas} jabalinas aptas · {evaluation.masasConformes} de {evaluation.totalMasas} masas continuas · {evaluation.diferencialesConformes} de {evaluation.totalDiferenciales} disyuntores ensayados.
              </div>
              {evaluation.calibracionVencida && (
                <div className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">
                  ⚠️ Certificado de calibración de instrumental con más de 24 meses de antigüedad.
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-2 md:pt-0 md:pl-4">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Promedio PAT</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{evaluation.promedioResistenciaOhms} Ω</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Máximo</span>
              <span className={`text-xl font-black ${evaluation.maxResistenciaMedida > (protocol.esquemaConexionTierra === 'TT' ? 40 : 10) ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                {evaluation.maxResistenciaMedida} Ω
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Tensión Uc</span>
              <span className={`text-xl font-black ${evaluation.tensionContactoExcedida ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                {evaluation.tensionContactoPresuntaMaxVolts} V
              </span>
              <span className="text-[9px] text-slate-400 block font-mono">Máx: {protocol.tensionSeguridadContacto || 50}V</span>
            </div>
          </div>
        </div>

        {/* Sección 1: Datos Generales */}
        <ModuleFormSection title="1. Datos del Establecimiento y Profesional" icon={<Building2 size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Razón Social *</label>
              <input
                type="text"
                value={protocol.razonSocial}
                onChange={e => setProtocol(p => ({ ...p, razonSocial: e.target.value }))}
                placeholder="Ej: Industrias Metalúrgicas S.A."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CUIT *</label>
              <input
                type="text"
                value={protocol.cuit}
                onChange={e => setProtocol(p => ({ ...p, cuit: e.target.value }))}
                placeholder="30-12345678-9"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Establecimiento / Sucursal</label>
              <input
                type="text"
                value={protocol.establecimiento || ''}
                onChange={e => setProtocol(p => ({ ...p, establecimiento: e.target.value }))}
                placeholder="Planta Principal / Nave 2"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ART Afiliada</label>
              <input
                type="text"
                value={protocol.artNombre || ''}
                onChange={e => setProtocol(p => ({ ...p, artNombre: e.target.value }))}
                placeholder="Ej: Provincia ART / La Segunda"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Instalación</label>
              <select
                value={protocol.tipoInstalacion || 'Industrial'}
                onChange={e => setProtocol(p => ({
                  ...p,
                  tipoInstalacion: e.target.value as any,
                  tensionSeguridadContacto: e.target.value === 'Obra en Construcción (Dec. 911/96)' ? 24 : p.tensionSeguridadContacto
                }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="Industrial">Industrial (Manufactura, Talleres, Depósitos)</option>
                <option value="Comercial">Comercial / Administrativa (Oficinas, Locales)</option>
                <option value="Obra en Construcción (Dec. 911/96)">Obra en Construcción (Dec. 911/96 - UL 24V)</option>
                <option value="Hospitalaria / Crítica">Hospitalaria / Crítica (Salas de grupo 2, Quirófanos)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Actividad Principal</label>
              <input
                type="text"
                value={protocol.actividadPrincipal}
                onChange={e => setProtocol(p => ({ ...p, actividadPrincipal: e.target.value }))}
                placeholder="Fabricación de autopartes"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dirección del Establecimiento</label>
              <input
                type="text"
                value={protocol.direccion}
                onChange={e => setProtocol(p => ({ ...p, direccion: e.target.value }))}
                placeholder="Av. Industrial 1450, Parque Industrial"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Localidad y Provincia</label>
              <input
                type="text"
                value={`${protocol.localidad ? protocol.localidad + ', ' : ''}${protocol.provincia}`}
                onChange={e => setProtocol(p => ({ ...p, localidad: e.target.value }))}
                placeholder="Pilar, Buenos Aires"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha de Medición</label>
              <input
                type="date"
                value={protocol.fechaMedicion}
                onChange={e => handleFechaMedicionChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha de Vencimiento (12 meses)</label>
              <input
                type="date"
                value={protocol.fechaVencimiento}
                onChange={e => setProtocol(p => ({ ...p, fechaVencimiento: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Profesional Actuante</label>
              <input
                type="text"
                value={protocol.profesionalNombre}
                onChange={e => setProtocol(p => ({ ...p, profesionalNombre: e.target.value }))}
                placeholder="Ing. / Lic. Juan Pérez"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Matrícula Profesional</label>
              <input
                type="text"
                value={protocol.profesionalMatricula}
                onChange={e => setProtocol(p => ({ ...p, profesionalMatricula: e.target.value }))}
                placeholder="COPIME / CIPBA N° 12345"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        </ModuleFormSection>

        {/* Sección 2: Instrumento de Medición y Sistema Eléctrico */}
        <ModuleFormSection title="2. Telurímetro y Características Eléctricas" icon={<Gauge size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Marca y Modelo del Telurímetro</label>
              <input
                type="text"
                value={`${protocol.instrumentoMarca} ${protocol.instrumentoModelo}`}
                onChange={e => {
                  const parts = e.target.value.split(' ');
                  setProtocol(p => ({ ...p, instrumentoMarca: parts[0] || '', instrumentoModelo: parts.slice(1).join(' ') || '' }));
                }}
                placeholder="Megger DET-4TD"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">N° de Serie</label>
              <input
                type="text"
                value={protocol.instrumentoNroSerie}
                onChange={e => setProtocol(p => ({ ...p, instrumentoNroSerie: e.target.value }))}
                placeholder="SN-1029384"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha de Calibración</label>
              <input
                type="date"
                value={protocol.instrumentoFechaCalibracion}
                onChange={e => setProtocol(p => ({ ...p, instrumentoFechaCalibracion: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">N° Certificado Calibración</label>
              <input
                type="text"
                value={protocol.instrumentoCertificadoNro || ''}
                onChange={e => setProtocol(p => ({ ...p, instrumentoCertificadoNro: e.target.value }))}
                placeholder="INTI-CAL-2025-900"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Laboratorio Calibrador</label>
              <input
                type="text"
                value={protocol.instrumentoLaboratorio || ''}
                onChange={e => setProtocol(p => ({ ...p, instrumentoLaboratorio: e.target.value }))}
                placeholder="Laboratorio INTI / Red SAC Trazable"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Esquema de Tierra (Régimen de Neutro)</label>
              <select
                value={protocol.esquemaConexionTierra}
                onChange={e => setProtocol(p => ({ ...p, esquemaConexionTierra: e.target.value as GroundingSystemType }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-blue-600"
              >
                <option value="TT">Esquema TT (Tierra independiente - Estándar Argentina)</option>
                <option value="TN-S">Esquema TN-S (Neutro y protección separados)</option>
                <option value="TN-C">Esquema TN-C (Neutro y protección combinados PEN)</option>
                <option value="IT">Esquema IT (Neutro aislado - Hospitales / Industrias continuas)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tensión Seguridad de Contacto UL</label>
              <select
                value={protocol.tensionSeguridadContacto || 50}
                onChange={e => setProtocol(p => ({ ...p, tensionSeguridadContacto: Number(e.target.value) as 24 | 50 }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value={50}>50 V - Locales secos / condiciones normales (AEA 90364-4-41)</option>
                <option value={24}>24 V - Locales húmedos, mojados, obras o áreas críticas (AEA / Dec. 911/96)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tensión de Suministro</label>
              <input
                type="text"
                value={protocol.tensionSuministro}
                onChange={e => setProtocol(p => ({ ...p, tensionSuministro: e.target.value }))}
                placeholder="380 V Trifásica / 220 V Monofásica"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estado del Suelo</label>
              <select
                value={protocol.estadoSuelo}
                onChange={e => setProtocol(p => ({ ...p, estadoSuelo: e.target.value as SoilCondition }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Húmedo">Húmedo (Óptima resistividad)</option>
                <option value="Normal">Normal</option>
                <option value="Seco">Seco</option>
                <option value="Rocoso">Rocoso / Arenoso</option>
              </select>
            </div>
          </div>
        </ModuleFormSection>

        {/* Sección 3: Tabla de Puesta a Tierra (Jabalinas / Mallas) */}
        <ModuleFormSection
          title="3. Tabla 1: Medición de Resistencia de Puesta a Tierra"
          icon={<Zap size={20} />}
        >
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={addJabalina}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Agregar Jabalina / Malla
            </button>
          </div>
          <div className="space-y-3">
            {protocol.jabalinas.map((j, idx) => {
              const maxAllowed = j.resistenciaMaximaAdmisible || (protocol.esquemaConexionTierra === 'TT' ? 40 : 10);
              const isOk = j.resistenciaMedida <= maxAllowed;
              return (
                <div
                  key={j.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isOk ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700' : 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-900'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Punto</label>
                      <input
                        type="text"
                        value={j.codigo}
                        onChange={e => updateJabalina(j.id, 'codigo', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Ubicación / Sector</label>
                      <input
                        type="text"
                        value={j.ubicacion}
                        onChange={e => updateJabalina(j.id, 'ubicacion', e.target.value)}
                        placeholder="Tablero General de Fuerza Motriz"
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Valor (Ω)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={j.resistenciaMedida}
                          onChange={e => updateJabalina(j.id, 'resistenciaMedida', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs font-black rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center"
                        />
                        <span className="absolute right-2 top-1 text-[10px] text-slate-400">Ω</span>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Límite (Ω)</label>
                      <input
                        type="number"
                        value={j.resistenciaMaximaAdmisible}
                        onChange={e => updateJabalina(j.id, 'resistenciaMaximaAdmisible', parseFloat(e.target.value) || 10)}
                        className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-3 sm:pt-0">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                        isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isOk ? 'CONFORME' : 'SUPERA'}
                      </span>
                      {protocol.jabalinas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeJabalina(j.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fila secundaria: Detalles de la jabalina */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Tipo de Electrodo:</span>
                      <select
                        value={j.tipoElectrodo}
                        onChange={e => updateJabalina(j.id, 'tipoElectrodo', e.target.value as ElectrodeType)}
                        className="w-full p-1 text-[11px] rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      >
                        <option value="Jabalina Cobre/Acero (Hincada)">Jabalina Cobre/Acero</option>
                        <option value="Malla de Puesta a Tierra">Malla de Puesta a Tierra</option>
                        <option value="Anillo Perimetral">Anillo Perimetral</option>
                        <option value="Placa de Puesta a Tierra">Placa de Puesta a Tierra</option>
                        <option value="Electrodo de Fundación">Electrodo de Fundación</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={j.camaraInspeccion}
                          onChange={e => updateJabalina(j.id, 'camaraInspeccion', e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">Cámara Inspección</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={j.borneDesconexion}
                          onChange={e => updateJabalina(j.id, 'borneDesconexion', e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">Borne / Seccionador</span>
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-500 block">Observaciones:</span>
                      <input
                        type="text"
                        value={j.observaciones || ''}
                        onChange={e => updateJabalina(j.id, 'observaciones', e.target.value)}
                        placeholder="Ej: Cámara limpia, bulón apretado"
                        className="w-full p-1 text-[11px] rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ModuleFormSection>

        {/* Sección 4: Tabla de Continuidad de Masas (AEA 90364) */}
        <ModuleFormSection
          title="4. Tabla 2: Verificación de Continuidad de las Masas"
          icon={<ShieldCheck size={20} />}
        >
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={addContinuidad}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Agregar Masa / Equipo
            </button>
          </div>
          <div className="space-y-2">
            {protocol.continuidadMasas.map((m, idx) => {
              const isOk = m.resistenciaContinuidad <= 1.0;
              return (
                <div
                  key={m.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Código</label>
                    <input
                      type="text"
                      value={m.codigo}
                      onChange={e => updateContinuidad(m.id, 'codigo', e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Masa / Equipo Ensayado</label>
                    <input
                      type="text"
                      value={m.elemento}
                      onChange={e => updateContinuidad(m.id, 'elemento', e.target.value)}
                      placeholder="Carcasa Tablero Seccional 1"
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Ubicación</label>
                    <input
                      type="text"
                      value={m.ubicacion}
                      onChange={e => updateContinuidad(m.id, 'ubicacion', e.target.value)}
                      placeholder="Nave de Fabricación"
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">R. Masa (≤ 1.0 Ω)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={m.resistenciaContinuidad}
                        onChange={e => updateContinuidad(m.id, 'resistenciaContinuidad', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs font-black rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center"
                      />
                      <span className="absolute right-2 top-1 text-[10px] text-slate-400">Ω</span>
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-end gap-1 pt-2 sm:pt-0">
                    <span className={`w-3 h-3 rounded-full ${isOk ? 'bg-emerald-500' : 'bg-red-500'}`} title={isOk ? 'Conforme' : 'Defectuosa'} />
                    {protocol.continuidadMasas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContinuidad(m.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ModuleFormSection>

        {/* Sección 5: Interruptores Diferenciales */}
        <ModuleFormSection
          title="5. Tabla 3: Ensayo de Interruptores Diferenciales"
          icon={<Gauge size={20} />}
        >
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={addDiferencial}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Agregar Disyuntor
            </button>
          </div>
          <div className="space-y-2">
            {protocol.diferenciales.map((d, idx) => {
              const tiempoOk = d.tiempoDisparoMs > 0 && d.tiempoDisparoMs <= 200;
              const isOk = tiempoOk && d.pulsadorTestFunciona;
              return (
                <div
                  key={d.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Código</label>
                    <input
                      type="text"
                      value={d.codigo}
                      onChange={e => updateDiferencial(d.id, 'codigo', e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Tablero</label>
                    <input
                      type="text"
                      value={d.tableroUbicacion}
                      onChange={e => updateDiferencial(d.id, 'tableroUbicacion', e.target.value)}
                      placeholder="Tablero Seccional 1"
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Circuito Protegido</label>
                    <input
                      type="text"
                      value={d.circuitoProtegido}
                      onChange={e => updateDiferencial(d.id, 'circuitoProtegido', e.target.value)}
                      placeholder="Tomas generales taller"
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">T. Disparo (≤ 200 ms)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={d.tiempoDisparoMs}
                        onChange={e => updateDiferencial(d.id, 'tiempoDisparoMs', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs font-black rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center"
                      />
                      <span className="absolute right-2 top-1 text-[10px] text-slate-400">ms</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-2 sm:pt-0">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={d.pulsadorTestFunciona}
                        onChange={e => updateDiferencial(d.id, 'pulsadorTestFunciona', e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Test (T)</span>
                    </label>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                      isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isOk ? 'OK' : 'FALLA'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDiferencial(d.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </ModuleFormSection>

        {/* Sección 6: Conclusiones y Recomendaciones Asistidas */}
        <ModuleFormSection
          title="6. Conclusiones y Medidas de Adecuación"
          icon={<CheckCircle2 size={20} />}
        >
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={handleAutoConclusions}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles size={15} />
              Redactar Conclusiones Automáticas
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Dictamen Técnico y Conclusiones del Profesional
              </label>
              <textarea
                rows={5}
                value={protocol.conclusiones}
                onChange={e => setProtocol(p => ({ ...p, conclusiones: e.target.value }))}
                placeholder="Presione 'Redactar Conclusiones Automáticas' o escriba aquí el dictamen técnico de conformidad legal conforme Res. SRT 900/15..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed"
              />
            </div>

            {/* Recomendaciones sugeridas */}
            {protocol.recomendaciones.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1">
                  Recomendaciones Técnicas Detectadas:
                </span>
                <ul className="list-disc pl-4 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  {protocol.recomendaciones.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ModuleFormSection>

        {/* Vista previa integrada en modal/colapsable */}
        {showPreview && (
          <div className="mt-8 border-t-2 border-slate-300 dark:border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye size={18} className="text-blue-500" /> Vista Previa del Protocolo Oficial PDF (Res. SRT 900/15)
              </h3>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer size={15} /> Imprimir / Exportar PDF
              </button>
            </div>
            <div className="bg-slate-200 dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700 overflow-x-auto shadow-inner">
              <GroundingProtocolPdf data={protocol} />
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
              onClick: () => navigate('/grounding')
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
              label: isEdit ? 'Actualizar Protocolo' : 'Guardar Protocolo Res. 900/15',
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
