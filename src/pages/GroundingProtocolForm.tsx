import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Zap, Save, Eye, Printer, Plus, Trash2,
  CheckCircle2, ShieldCheck, ShieldAlert, Sparkles, Building2,
  Gauge, ZoomIn, ZoomOut, RotateCcw, X, PenTool, Camera, ClipboardCheck, HardHat
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import { safeGetLocalStorage } from '../utils/storageHelper';
import GroundingProtocolPdf from '../components/GroundingProtocolPdf';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PhotoAttachments from '../components/PhotoAttachments';
import { printElementAsDocument } from '../utils/pdfHelper';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
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

const VISUAL_INSPECTION_CATALOG = [
  'Conductor de protección PE bicolor (verde-amarillo) presente y continuo en todos los tableros y circuitos (AEA 90364-5-54).',
  'Barra Principal de Puesta a Tierra (BPT) / Colectora accesible y con bornes individualizados ajustados.',
  'Puentes equipotenciales flexibles instalados en puertas batientes y tapas metálicas de tableros eléctricos.',
  'Cámaras de inspección de jabalinas accesibles, limpias y con borne tomamuestra seccionable.',
  'Coordinación efectiva entre interruptores diferenciales (≤ 30 mA) y resistencia de puesta a tierra (Ra × IΔn ≤ UL).',
  'Protección contra contactos directos: contratapas aislantes, cubrebornes y grado IP adecuado en tableros.',
  'Identificación y rotulado reglamentario de circuitos y señalización de Riesgo Eléctrico (IRAM 10005).',
  'Ausencia de conductores de protección utilizados simultáneamente como neutro (prohibición esquema TN-C aguas abajo).'
];

export default function GroundingProtocolForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEdit, setIsEdit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [formPreviewZoom, setFormPreviewZoom] = useState(typeof window !== 'undefined' && window.innerWidth < 640 ? 0.45 : 1);

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
    instrumentoCertificadoNro: 'CAL-2026-900',
    instrumentoLaboratorio: 'Laboratorio de Metrología Eléctrica Trazable INTI / SAC',
    tensionSuministro: '380 V Trifásico + Neutro / 220 V',
    esquemaConexionTierra: 'TT',
    tipoAcometida: 'Subterránea',
    potenciaContratadaKw: '25 kW',
    transformadorPropio: false,
    estadoSuelo: 'Húmedo',
    tensionSeguridadContacto: 50,
    metodoMedicion: 'Telurímetro 3 Polos (Caída de Potencial 62% - IRAM 2281)',
    condicionesClimaticas: 'Soleado · Sin precipitaciones en las últimas 72 hs · 22 °C',
    certificadoAdjunto: true,
    planoEsquemaAdjunto: true,
    verificacionesVisuales: [
      VISUAL_INSPECTION_CATALOG[0],
      VISUAL_INSPECTION_CATALOG[1],
      VISUAL_INSPECTION_CATALOG[2],
      VISUAL_INSPECTION_CATALOG[3],
      VISUAL_INSPECTION_CATALOG[4],
      VISUAL_INSPECTION_CATALOG[5],
      VISUAL_INSPECTION_CATALOG[6],
    ],
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
    evidenciaFotos: [],
    cumpleNormativa: true,
    conclusiones: '',
    recomendaciones: [],
    plazoAdecuacionDias: 30,
    responsableEstablecimientoNombre: '',
    jefeMantenimientoNombre: '',
    operatorSignature: '',
    professionalSignature: '',
    professionalStamp: '',
    supervisorSignature: '',
    showSignatures: {
      operator: true,
      professional: true,
      supervisor: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Cargar datos previos si es edición o perfil del usuario
  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.editData) {
      const ed = location.state.editData as GroundingProtocol;
      setProtocol(prev => ({
        ...prev,
        ...ed,
        verificacionesVisuales: ed.verificacionesVisuales || prev.verificacionesVisuales,
        evidenciaFotos: ed.evidenciaFotos || [],
        showSignatures: ed.showSignatures || { operator: true, professional: true, supervisor: true }
      }));
      setIsEdit(true);
      return;
    }

    try {
      const savedPersonal = localStorage.getItem('personalData');
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      let sig = '';
      let stamp = '';
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        sig = parsed.signature || '';
        stamp = parsed.stamp || '';
      } else if (legacySig) {
        sig = legacySig;
      }

      if (savedPersonal) {
        const pd = JSON.parse(savedPersonal);
        setProtocol(prev => ({
          ...prev,
          profesionalNombre: pd.name || prev.profesionalNombre,
          profesionalMatricula: pd.license || prev.profesionalMatricula,
          profesionalTitulo: pd.profession || prev.profesionalTitulo,
          razonSocial: pd.company || prev.razonSocial,
          cuit: pd.cuit || prev.cuit,
          direccion: pd.address || prev.direccion,
          professionalSignature: sig || prev.professionalSignature,
          professionalStamp: stamp || prev.professionalStamp
        }));
      } else if (sig || stamp) {
        setProtocol(prev => ({
          ...prev,
          professionalSignature: sig || prev.professionalSignature,
          professionalStamp: stamp || prev.professionalStamp
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
      ],
      verificacionesVisuales: [...VISUAL_INSPECTION_CATALOG]
    }));
    toast.success('Plantilla industrial precargada con éxito');
  };

  // Carga Rápida de Plantilla para Obra en Construcción (Dec. 911/96 · UL 24 V)
  const loadConstructionTemplate = () => {
    setProtocol(prev => ({
      ...prev,
      tipoInstalacion: 'Obra en Construcción (Dec. 911/96)',
      tensionSeguridadContacto: 24,
      esquemaConexionTierra: 'TT',
      tipoAcometida: 'Aérea',
      metodoMedicion: 'Telurímetro 3 Polos (Caída de Potencial 62% - IRAM 2281)',
      jabalinas: [
        {
          id: '1',
          codigo: 'PAT-OBR-01',
          ubicacion: 'Tablero Principal de Obra (Pilar Provisorio)',
          tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
          resistenciaMedida: 2.9,
          resistenciaMaximaAdmisible: 10,
          camaraInspeccion: true,
          borneDesconexion: true,
          estadoFisico: 'Bueno',
          conforme: true,
          observaciones: 'Jabalina Cooperweld 5/8" x 1.50m en cámara de inspección señalizada'
        },
        {
          id: '2',
          codigo: 'PAT-OBR-02',
          ubicacion: 'Tablero Seccional Hormigonera / Guinche y Obrador',
          tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
          resistenciaMedida: 3.6,
          resistenciaMaximaAdmisible: 10,
          camaraInspeccion: true,
          borneDesconexion: true,
          estadoFisico: 'Bueno',
          conforme: true,
          observaciones: 'Puesta a tierra suplementaria de maquinaria pesada (Dec. 911/96 Art. 86)'
        }
      ],
      continuidadMasas: [
        {
          id: '1',
          codigo: 'CM-01',
          elemento: 'Gabinete Metálico y Puerta Tablero Principal de Obra',
          ubicacion: 'Acceso de Obra',
          resistenciaContinuidad: 0.14,
          continuidadConforme: true,
          observaciones: 'Malla flexible de cobre en bisagra y barra colectora PE'
        },
        {
          id: '2',
          codigo: 'CM-02',
          elemento: 'Chasis Hormigonera Eléctrica y Sierra Circular de Banco',
          ubicacion: 'Sector Elaboración',
          resistenciaContinuidad: 0.21,
          continuidadConforme: true,
          observaciones: 'Fichas industriales normalizadas IEC 60309 (3P+N+T)'
        },
        {
          id: '3',
          codigo: 'CM-03',
          elemento: 'Estructura Metálica de Contenedor Obrador y Vestuarios',
          ubicacion: 'Sector Obrador',
          resistenciaContinuidad: 0.19,
          continuidadConforme: true,
          observaciones: 'Vinculada al conductor PE de 6 mm² verde-amarillo'
        }
      ],
      diferenciales: [
        {
          id: '1',
          codigo: 'ID-01',
          tableroUbicacion: 'Tablero Principal de Obra',
          circuitoProtegido: 'Tomas Industriales 380V / 220V (Grado IP65)',
          corrienteSensibilidadMa: 30,
          tiempoDisparoMs: 21,
          pulsadorTestFunciona: true,
          conforme: true,
          observaciones: 'Corte instantáneo a 1x IΔn (UL ≤ 24 V conforme Dec. 911/96)'
        },
        {
          id: '2',
          codigo: 'ID-02',
          tableroUbicacion: 'Tablero Seccional Obrador',
          circuitoProtegido: 'Iluminación 24V / Comedor y Oficinas Técnicas',
          corrienteSensibilidadMa: 30,
          tiempoDisparoMs: 23,
          pulsadorTestFunciona: true,
          conforme: true,
          observaciones: 'Operación satisfactoria del botón de prueba T'
        }
      ],
      verificacionesVisuales: [...VISUAL_INSPECTION_CATALOG]
    }));
    toast.success('Plantilla para Obra en Construcción (Dec. 911/96 · UL 24V) cargada');
  };

  const toggleVisualCheck = (item: string) => {
    setProtocol(prev => {
      const current = prev.verificacionesVisuales || [];
      const exists = current.includes(item);
      return {
        ...prev,
        verificacionesVisuales: exists ? current.filter(i => i !== item) : [...current, item]
      };
    });
  };

  // Generar conclusiones automáticas
  const handleAutoConclusions = () => {
    const isOk = evaluation.isFullyCompliant;
    let text = isOk
      ? `Se concluye que la instalación eléctrica del establecimiento "${protocol.razonSocial || 'analizado'}" CUMPLE con las condiciones reglamentarias de seguridad eléctrica respecto a la Resistencia de Puesta a Tierra y Continuidad de las Masas establecidas en el Anexo I de la Resolución S.R.T. N° 900/15 y la Reglamentación AEA 90364.\n\nLos valores de puesta a tierra registrados mediante ${protocol.metodoMedicion || 'telurímetro calibrado'} presentan un promedio de ${evaluation.promedioResistenciaOhms} Ω (siendo el valor máximo registrado de ${evaluation.maxResistenciaMedida} Ω, inferior al límite admisible legal). La tensión presunta de contacto calculada es de ${evaluation.tensionContactoPresuntaMaxVolts} V (límite de seguridad: ${protocol.tensionSeguridadContacto || 50} V). Asimismo, la totalidad de los circuitos ensayados cuentan con conductor de protección PE continuo (≤ 1.0 Ω) y los interruptores diferenciales verificados responden con tiempos de corte inferiores a los 200 milisegundos admisibles.`
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

    const saved = safeGetLocalStorage<any[]>('grounding_protocols_db', []);
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
      <div style={{ paddingTop: '1.5rem' }}>
        <ModuleFormToolbar
          onBack={() => navigate('/grounding')}
          title={isEdit ? 'Editar Protocolo Res. 900/15' : 'Nuevo Protocolo de Puesta a Tierra'}
          subtitle="Medición de PAT y Continuidad de Masas · Res. SRT 900/15"
          icon={<Zap size={22} className="text-amber-500" />}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold bg-slate-200/70 dark:bg-slate-800 px-2.5 py-1 rounded-md">
          ID: {protocol.id}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { setPreviewModalOpen(true); setFormPreviewZoom(1); }}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1px solid #38bdf8'
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer"
          >
            <Eye size={15} />
            <span>Vista Previa A4</span>
          </button>
          <button
            type="button"
            onClick={() => printElementAsDocument('grounding-form-print', `Protocolo_PAT_SRT900_${protocol.razonSocial || 'Borrador'}`)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: '1px solid #34d399'
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer"
          >
            <Printer size={15} />
            <span>Imprimir / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: '1px solid #60a5fa'
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:opacity-95 cursor-pointer"
          >
            <Save size={15} />
            <span>Guardar Protocolo</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Banner informativo de alto contraste y botones de plantillas rápidas */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%)',
            color: '#ffffff',
            border: '1px solid #3b82f6',
            boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.35)'
          }}
          className="rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.22)',
                border: '1px solid rgba(251, 191, 36, 0.5)',
                color: '#fbbf24'
              }}
              className="p-3 rounded-xl shrink-0"
            >
              <Zap size={28} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold flex flex-wrap items-center gap-2" style={{ color: '#ffffff' }}>
                <span>Protocolo Obligatorio Res. SRT 900/15</span>
                <span
                  style={{ background: '#fbbf24', color: '#0f172a' }}
                  className="text-[10px] px-2.5 py-0.5 rounded-full font-black tracking-wide uppercase"
                >
                  VALIDEZ ANUAL (12 MESES)
                </span>
              </h2>
              <p className="text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed" style={{ color: '#dbeafe' }}>
                Genere el informe técnico oficial con validez legal exigido por la Superintendencia de Riesgos del Trabajo (Anexo I y II), inspectores municipales y aseguradoras (ART).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadTypicalTemplate}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0f172a',
                border: '1px solid #fde68a',
                fontWeight: 900
              }}
              className="px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles size={15} />
              <span>Cargar Plantilla Industrial</span>
            </button>
            <button
              type="button"
              onClick={loadConstructionTemplate}
              style={{
                background: 'rgba(255, 255, 255, 0.14)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                fontWeight: 800
              }}
              className="px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-white/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <HardHat size={15} className="text-amber-300" />
              <span>Plantilla Obra (Dec. 911/96)</span>
            </button>
          </div>
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
        <ModuleFormSection title="2. Telurímetro, Metodología de Ensayo y Características Eléctricas" icon={<Gauge size={20} />}>
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
                placeholder="INTI-CAL-2026-900"
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Método de Medición Aplicado</label>
              <select
                value={protocol.metodoMedicion || 'Telurímetro 3 Polos (Caída de Potencial 62% - IRAM 2281)'}
                onChange={e => setProtocol(p => ({ ...p, metodoMedicion: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="Telurímetro 3 Polos (Caída de Potencial 62% - IRAM 2281)">Telurímetro 3 Polos (Caída de Potencial 62% - IRAM 2281)</option>
                <option value="Medición de Impedancia de Lazo de Falla (AEA 90364-6)">Medición de Impedancia de Lazo de Falla (AEA 90364-6)</option>
                <option value="Telurímetro 4 Polos Wenner + Caída de Potencial">Telurímetro 4 Polos Wenner + Caída de Potencial</option>
                <option value="Pinza Telurimétrica Selectiva sin Desconexión">Pinza Telurimétrica Selectiva sin Desconexión</option>
              </select>
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Acometida</label>
              <select
                value={protocol.tipoAcometida || 'Subterránea'}
                onChange={e => setProtocol(p => ({ ...p, tipoAcometida: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Subterránea">Subterránea</option>
                <option value="Aérea">Aérea</option>
                <option value="Mixta">Mixta</option>
              </select>
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
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Condiciones Climáticas y Temp.</label>
              <input
                type="text"
                value={protocol.condicionesClimaticas || ''}
                onChange={e => setProtocol(p => ({ ...p, condicionesClimaticas: e.target.value }))}
                placeholder="Soleado · Sin lluvias en 72 hs · 22 °C"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Documentación Anexa Obligatoria según Art. 2 Res. SRT 900/15 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div
              onClick={() => setProtocol(p => ({ ...p, certificadoAdjunto: p.certificadoAdjunto === false }))}
              className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all select-none ${
                protocol.certificadoAdjunto !== false
                  ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-slate-100'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400'
              }`}
            >
              <CheckCircle2 size={20} className={protocol.certificadoAdjunto !== false ? 'text-emerald-500 shrink-0' : 'text-slate-400 shrink-0'} />
              <div className="text-xs">
                <strong className="block font-extrabold">Adjunta Certificado de Calibración Vigente (Art. 2 Res. 900/15)</strong>
                <span className="text-[11px] opacity-80">Copia del certificado emitido por laboratorio trazable INTI / SAC</span>
              </div>
            </div>

            <div
              onClick={() => setProtocol(p => ({ ...p, planoEsquemaAdjunto: p.planoEsquemaAdjunto === false }))}
              className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all select-none ${
                protocol.planoEsquemaAdjunto !== false
                  ? 'border-blue-500 bg-blue-500/10 text-slate-900 dark:text-slate-100'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400'
              }`}
            >
              <CheckCircle2 size={20} className={protocol.planoEsquemaAdjunto !== false ? 'text-blue-500 shrink-0' : 'text-slate-400 shrink-0'} />
              <div className="text-xs">
                <strong className="block font-extrabold">Adjunta Esquema Unifilar / Croquis de Ubicación de Tomas PAT</strong>
                <span className="text-[11px] opacity-80">Identificación física de los puntos medidos en planta</span>
              </div>
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

        {/* Sección 6: Inspección Visual Reglamentaria (AEA 90364 Parte 6) */}
        <ModuleFormSection
          title="6. Inspección Visual Reglamentaria (AEA 90364 Parte 6 · Anexo I Res. 900/15)"
          icon={<ClipboardCheck size={20} />}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 m-0">
              Seleccione las verificaciones visuales cumplidas en la instalación eléctrica que se incluirán en el protocolo PDF:
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {(protocol.verificacionesVisuales || []).length} de {VISUAL_INSPECTION_CATALOG.length} verificadas
              </span>
              <button
                type="button"
                onClick={() => setProtocol(p => ({ ...p, verificacionesVisuales: [...VISUAL_INSPECTION_CATALOG] }))}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Marcar todas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {VISUAL_INSPECTION_CATALOG.map((item, idx) => {
              const active = (protocol.verificacionesVisuales || []).includes(item);
              return (
                <div
                  key={idx}
                  onClick={() => toggleVisualCheck(item)}
                  className={`p-3 rounded-xl border-2 flex items-start gap-2.5 cursor-pointer transition-all select-none ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:border-emerald-500/50'
                  }`}
                >
                  <CheckCircle2
                    size={18}
                    className={`shrink-0 mt-0.5 ${active ? 'text-emerald-500' : 'text-slate-400'}`}
                  />
                  <span className="text-xs leading-snug">{item}</span>
                </div>
              );
            })}
          </div>
        </ModuleFormSection>

        {/* Sección 7: Registro Fotográfico de Cámaras de Inspección, Telurímetro y Tableros */}
        <ModuleFormSection
          title="7. Registro Fotográfico de Medición, Cámaras de Inspección y Certificado"
          icon={<Camera size={20} />}
        >
          <PhotoAttachments
            photos={protocol.evidenciaFotos || []}
            onChange={photos => setProtocol(p => ({ ...p, evidenciaFotos: photos }))}
            maxPhotos={6}
            label="Adjuntar fotos de la lectura del telurímetro, cámaras de inspección de jabalinas, tableros y certificado de calibración"
          />
        </ModuleFormSection>

        {/* Sección 8: Conclusiones y Recomendaciones Asistidas */}
        <ModuleFormSection
          title="8. Conclusiones y Medidas de Adecuación"
          icon={<CheckCircle2 size={20} />}
        >
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={handleAutoConclusions}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0f172a',
                fontWeight: 900
              }}
              className="px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm hover:opacity-95 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Redactar Conclusiones Automáticas</span>
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

        {/* Sección 9: Firmas Digitales Formato ATS (con Cuadro de Vista Previa y Firma del Profesional en el Medio) */}
        <ModuleFormSection
          title="9. Firmas Digitales del Protocolo (Formato ATS)"
          icon={<PenTool size={20} />}
        >
          <div className="space-y-5">
            {/* Selector de roles visibles y nombres de firmantes */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                  <PenTool size={16} className="text-emerald-500" />
                  <span>Seleccionar Firmantes para el Documento PDF (Res. SRT 900/15)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'operator' as const, label: 'Responsable Establecimiento / Empleador (Izq.)' },
                    { key: 'professional' as const, label: 'Profesional HyS / Matriculado (Centro ⭐)' },
                    { key: 'supervisor' as const, label: 'Jefe de Mantenimiento / Supervisión (Der.)' }
                  ].map(({ key, label }) => {
                    const currentFlags = protocol.showSignatures || { operator: true, professional: true, supervisor: true };
                    const active = currentFlags[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setProtocol(p => {
                            const flags = p.showSignatures || { operator: true, professional: true, supervisor: true };
                            return {
                              ...p,
                              showSignatures: { ...flags, [key]: !flags[key] }
                            };
                          })
                        }
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Aclaración Responsable del Establecimiento / Empleador (Recuadro Izquierdo)
                  </label>
                  <input
                    type="text"
                    value={protocol.responsableEstablecimientoNombre || ''}
                    onChange={e => setProtocol(p => ({ ...p, responsableEstablecimientoNombre: e.target.value }))}
                    placeholder={protocol.razonSocial || 'Nombre y Cargo del Titular / Apoderado'}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Aclaración Jefe de Mantenimiento / Supervisión Técnica (Recuadro Derecho)
                  </label>
                  <input
                    type="text"
                    value={protocol.jefeMantenimientoNombre || ''}
                    onChange={e => setProtocol(p => ({ ...p, jefeMantenimientoNombre: e.target.value }))}
                    placeholder="Ing. / Téc. Jefe de Planta o Mantenimiento Eléctrico"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Pizarras de Dibujo Digital (Izquierda: Empleador, Centro: Profesional HyS, Derecha: Mantenimiento) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {(protocol.showSignatures?.operator ?? true) && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col justify-between">
                  <SignatureCanvas
                    label={`Firma Establecimiento (${protocol.responsableEstablecimientoNombre || protocol.razonSocial || 'Empleador'})`}
                    initialImage={protocol.operatorSignature || protocol.firmaClienteUrl || null}
                    onSave={sig => setProtocol(p => ({ ...p, operatorSignature: sig || '', firmaClienteUrl: sig || '' }))}
                  />
                </div>
              )}

              {(protocol.showSignatures?.professional ?? true) && (
                <div className="p-3 rounded-xl border-2 border-emerald-500/70 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-md flex flex-col justify-between relative">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white self-center mb-2">
                    ⭐ Firma Central • Profesional H&S / Matriculado
                  </span>
                  <SignatureCanvas
                    label={`Firma Profesional (${protocol.profesionalNombre || 'Profesional Actuante'})`}
                    initialImage={protocol.professionalSignature || protocol.firmaProfesionalUrl || null}
                    onSave={sig => setProtocol(p => ({ ...p, professionalSignature: sig || '', firmaProfesionalUrl: sig || '' }))}
                  />
                </div>
              )}

              {(protocol.showSignatures?.supervisor ?? true) && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col justify-between">
                  <SignatureCanvas
                    label={`Firma Mantenimiento / Supervisión (${protocol.jefeMantenimientoNombre || 'Planta'})`}
                    initialImage={protocol.supervisorSignature || null}
                    onSave={sig => setProtocol(p => ({ ...p, supervisorSignature: sig || '' }))}
                  />
                </div>
              )}
            </div>

            {/* Cuadro de Vista Previa en Vivo del Bloque de Firmas Formato ATS */}
            <div className="p-4 rounded-2xl bg-white text-slate-900 border-2 border-slate-300 shadow-inner">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-center mb-1">
                Vista Previa del Cuadro de Firmas en el PDF (Con la Firma del Profesional en el Medio)
              </div>
              <PdfSignatures
                data={protocol}
                compact={true}
                hideFooter={true}
                box1={{
                  title: 'RESPONSABLE DEL ESTABLECIMIENTO / EMPLEADOR',
                  subtitle: (protocol.responsableEstablecimientoNombre || protocol.razonSocial || 'Titular / Apoderado').toUpperCase(),
                  signatureUrl: protocol.operatorSignature || protocol.firmaClienteUrl || null,
                  isProfessional: false,
                  license: protocol.cuit ? `CUIT ${protocol.cuit}` : undefined
                }}
                box2={{
                  title: (protocol.profesionalTitulo || 'PROFESIONAL ACTUANTE HYS / MATRICULADO').toUpperCase(),
                  subtitle: (protocol.profesionalNombre || 'Firma y Sello Profesional').toUpperCase(),
                  signatureUrl: protocol.professionalSignature || protocol.firmaProfesionalUrl || null,
                  stampUrl: protocol.professionalStamp || null,
                  isProfessional: true,
                  license: protocol.profesionalMatricula || 'En trámite'
                }}
                box3={{
                  title: 'JEFE DE MANTENIMIENTO / SUPERVISIÓN TÉCNICA',
                  subtitle: (protocol.jefeMantenimientoNombre || 'Conformidad Técnica de Planta').toUpperCase(),
                  signatureUrl: protocol.supervisorSignature || null,
                  isProfessional: false,
                  license: protocol.artNombre ? `ART ${protocol.artNombre}` : undefined
                }}
              />
            </div>
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
                onClick={() => printElementAsDocument('grounding-form-inline-preview', `Protocolo_PAT_SRT900_${protocol.razonSocial || 'Borrador'}`)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer size={15} /> Imprimir / Exportar PDF
              </button>
            </div>
            <div className="bg-slate-200 dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700 overflow-x-auto shadow-inner">
              <GroundingProtocolPdf data={protocol} customId="grounding-form-inline-preview" />
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
              id: 'previewModal',
              label: 'PREVIA A4',
              icon: <Eye size={16} />,
              variant: 'info',
              onClick: () => { setPreviewModalOpen(true); setFormPreviewZoom(1); }
            },
            {
              id: 'printDirect',
              label: 'IMPRIMIR PDF',
              icon: <Printer size={16} />,
              variant: 'warning',
              onClick: () => {
                printElementAsDocument('grounding-form-print', `Protocolo_PAT_SRT900_${protocol.razonSocial || 'Borrador'}`);
              }
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
      {/* Modal Vista Previa A4 */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 dark:border-slate-700">
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Vista Previa Oficial A4 · Res. SRT 900/15
                </h3>
                <p className="text-xs text-slate-500">
                  {protocol.razonSocial || 'Borrador'} · Medición: {protocol.fechaMedicion}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setFormPreviewZoom(z => Math.max(0.6, z - 0.1))}
                    className="p-1 rounded hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Reducir Zoom"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <span className="text-[11px] font-bold px-1.5 min-w-[42px] text-center text-slate-700 dark:text-slate-200">
                    {Math.round(formPreviewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormPreviewZoom(z => Math.min(1.5, z + 0.1))}
                    className="p-1 rounded hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPreviewZoom(1)}
                    className="p-1 rounded hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Restablecer Zoom"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    printElementAsDocument('grounding-form-preview-modal', `Protocolo_PAT_SRT900_${protocol.razonSocial || 'Borrador'}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={15} /> <span className="hidden sm:inline">Imprimir / </span>Guardar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-200/80 dark:bg-slate-950">
              <div style={{ transform: `scale(${formPreviewZoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }}>
                <GroundingProtocolPdf data={protocol} customId="grounding-form-preview-modal" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor offscreen para impresión aislada directa */}
      <div className="ats-pdf-offscreen" id="grounding-form-print" aria-hidden="true">
        <GroundingProtocolPdf data={protocol} customId="grounding-form-print" />
      </div>

    </ModuleFormLayout>
  );
}
