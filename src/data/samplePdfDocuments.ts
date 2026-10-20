import type { GroundingProtocol } from '../types/grounding';
import type { PPEReceiptData } from '../components/PPEReceiptPdfGenerator';

export const SAMPLE_GROUNDING_PROTOCOL: GroundingProtocol = {
  id: 'PAT-2026-900-042',
  razonSocial: 'Logística & Distribución Sudamericana S.A.',
  cuit: '30-71458920-4',
  artNombre: 'Provincia ART',
  establecimiento: 'Centro de Distribución Troncal Norte',
  direccion: 'Ruta Panamericana Km 38.5, Colectora Oeste',
  localidad: 'Tortuguitas (Malvinas Argentinas)',
  provincia: 'Buenos Aires',
  actividadPrincipal: 'Almacenamiento, logística y estiba pesada (CIIU 521020)',
  tipoInstalacion: 'Industrial',
  fechaMedicion: '2026-03-15',
  fechaVencimiento: '2027-03-15',

  profesionalNombre: 'Lic. Ignacio M. Rossi',
  profesionalMatricula: 'COPIME MAT-7482',
  profesionalTitulo: 'Licenciado en Higiene y Seguridad en el Trabajo',
  colegioProfesional: 'Colegio Profesional de Ingeniería Mecánica y Electricista',

  instrumentoMarca: 'Megabras / Sonel',
  instrumentoModelo: 'EM-4058 Telurímetro Digital de 4 Bornes',
  instrumentoNroSerie: 'MG-889421',
  instrumentoFechaCalibracion: '2026-01-10',
  instrumentoCertificadoNro: 'INTI-CAL-2026-0418',
  instrumentoLaboratorio: 'Laboratorio de Metrología Eléctrica INTI / IRAM',

  tensionSuministro: '380 V Trifásica + Neutro / 220 V 50 Hz',
  esquemaConexionTierra: 'TT',
  tipoAcometida: 'Subterránea',
  potenciaContratadaKw: '250',
  transformadorPropio: true,
  estadoSuelo: 'Normal',
  tensionSeguridadContacto: 24,

  jabalinas: [
    {
      id: 'jab-1',
      codigo: 'PAT-01',
      ubicacion: 'Cámara N° 1 - Tablero General Principal (TGP)',
      tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
      resistenciaMedida: 2.45,
      resistenciaMaximaAdmisible: 10.0,
      camaraInspeccion: true,
      borneDesconexion: true,
      estadoFisico: 'Bueno',
      conforme: true,
      observaciones: 'Cámara de mampostería limpia, puente seccionador ajustado con grasa conductiva neutra.'
    },
    {
      id: 'jab-2',
      codigo: 'PAT-02',
      ubicacion: 'Cámara N° 2 - Tablero Seccional Sala de Carga de Baterías',
      tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
      resistenciaMedida: 3.12,
      resistenciaMaximaAdmisible: 10.0,
      camaraInspeccion: true,
      borneDesconexion: true,
      estadoFisico: 'Bueno',
      conforme: true,
      observaciones: 'Conexión equipotencial de extractor antiexplosivo verificada.'
    },
    {
      id: 'jab-3',
      codigo: 'PAT-03',
      ubicacion: 'Cámara N° 3 - Grupo Electrógeno de Emergencia (250 kVA)',
      tipoElectrodo: 'Malla de Puesta a Tierra',
      resistenciaMedida: 1.85,
      resistenciaMaximaAdmisible: 10.0,
      camaraInspeccion: true,
      borneDesconexion: true,
      estadoFisico: 'Bueno',
      conforme: true,
      observaciones: 'Malla perimetral de 4 jabalinas interconectadas con cable desnudo 50 mm².'
    },
    {
      id: 'jab-4',
      codigo: 'PAT-04',
      ubicacion: 'Cámara N° 4 - Tablero Nave de Racks e Iluminación LED',
      tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
      resistenciaMedida: 4.30,
      resistenciaMaximaAdmisible: 10.0,
      camaraInspeccion: true,
      borneDesconexion: true,
      estadoFisico: 'Bueno',
      conforme: true,
      observaciones: 'Borna de latón roscada en correcto estado sin sulfatación.'
    }
  ],

  continuidadMasas: [
    {
      id: 'cm-1',
      codigo: 'CM-01',
      elemento: 'Gabinete metálico Tablero General de Distribución',
      ubicacion: 'Sala de Máquinas',
      resistenciaContinuidad: 0.12,
      continuidadConforme: true,
      observaciones: 'Conductor de protección PE verde-amarillo 16 mm².'
    },
    {
      id: 'cm-2',
      codigo: 'CM-02',
      elemento: 'Estructuras Metálicas de Racks Dinámicos (Columnas)',
      ubicacion: 'Nave de Almacenamiento A',
      resistenciaContinuidad: 0.28,
      continuidadConforme: true,
      observaciones: 'Puentes de masa abulonados y equipotenciales verificados.'
    },
    {
      id: 'cm-3',
      codigo: 'CM-03',
      elemento: 'Cargadores de Batería de Autoelevadores Eléctricos',
      ubicacion: 'Sector de Carga de Flota',
      resistenciaContinuidad: 0.15,
      continuidadConforme: true,
      observaciones: 'Chasis aterrizado correctamente a borne central.'
    }
  ],

  diferenciales: [
    {
      id: 'dif-1',
      codigo: 'ID-01',
      tableroUbicacion: 'Tablero General - Circuito Tomas Sala de Control',
      circuitoProtegido: 'Tomas de Corriente 220V',
      corrienteSensibilidadMa: 30,
      tiempoDisparoMs: 24,
      pulsadorTestFunciona: true,
      conforme: true,
      observaciones: 'Disparo verificado con simulador de falla HT Italia (< 200 ms exigido).'
    },
    {
      id: 'dif-2',
      codigo: 'ID-02',
      tableroUbicacion: 'Tablero Seccional Taller de Mantenimiento',
      circuitoProtegido: 'Herramientas Eléctricas Portátiles',
      corrienteSensibilidadMa: 30,
      tiempoDisparoMs: 28,
      pulsadorTestFunciona: true,
      conforme: true,
      observaciones: 'Dispositivo bipolar tipo AC 40A / 30mA en conformidad.'
    }
  ],

  fotos: [],
  cumpleNormativa: true,
  conclusiones: 'La totalidad de los valores de resistencia de puesta a tierra medidos se encuentran sensiblemente por debajo del límite de 10 Ω exigido por la Reglamentación AEA 90364 y la Res. SRT 900/15. La instalación cuenta con continuidad eléctrica garantizada de masas y corte automático por disyuntores diferenciales en tiempo reglamentario.',
  recomendaciones: [
    'Mantener el programa anual de verificación y limpieza preventiva de cámaras de inspección.',
    'Prohibir la conexión de equipos sin conductor de puesta a tierra con ficha de 3 patas normalizada IRAM 2073.',
    'Efectuar una nueva medición integral antes del vencimiento (15/03/2027).'
  ],
  plazoAdecuacionDias: 0,
  createdAt: '2026-03-15T10:00:00.000Z',
  updatedAt: '2026-03-15T11:30:00.000Z'
};

export const SAMPLE_FIRE_LOAD_DATA = {
  id: 'CF-2026-0089',
  razonSocial: 'Metalúrgica & Maquinarias Industriales S.R.L.',
  cuit: '30-68945123-8',
  establecimiento: 'Planta de Fabricación y Almacén General',
  direccion: 'Parque Industrial Pilar, Lote 42',
  localidad: 'Pilar, Buenos Aires',
  art: 'La Segunda ART',
  sector: 'Nave N° 2 - Depósito de Insumos, Maderas y Plásticos',
  superficie: 850,
  actividadResumen: 'Almacenamiento de materia prima, palets de madera, piezas plásticas y embalajes de cartón',
  riesgo: 'R3', // Muy Combustible
  ventilacion: 'natural',
  materiales: [
    { nombre: 'Palets de Madera de Pino / Eucalipto', pesoKg: 12000, poderCalorificoKcalKg: 4400 },
    { nombre: 'Cajas de Cartón Corrugado de Embalaje', pesoKg: 4500, poderCalorificoKcalKg: 4000 },
    { nombre: 'Polietileno de Embalaje (Film Stretch)', pesoKg: 1800, poderCalorificoKcalKg: 10000 },
    { nombre: 'Aceite Lubricante Mineral en Tambores', pesoKg: 800, poderCalorificoKcalKg: 10000 }
  ],
  metricas: {
    cargaTermicaTotalMcal: 97800,
    cargaTermicaTotalKcal: 97800000,
    maderaEquivalenteKg: 22227.27,
    cargaFuegoKgM2: 26.15,
    clasificacionRiesgo: 'R3',
    resistenciaFuegoRequerida: 'F60',
    minExtintores: 5,
    potencialExtintorNominal: '2A:10BC',
    requiereRedHidrantes: true,
    requiereRociadoresAutomaticos: false
  },
  conclusiones: 'Para el Sector de Incendio evaluado de 850 m², se determinó una Carga de Fuego ponderada de 26.15 kg/m² de madera equivalente. Conforme al Anexo VII del Decreto 351/79, la estructura divisoria debe certificar resistencia al fuego F60 (60 minutos de retardo al colapso) y una dotación mínima de 5 extintores ABC con potencial 2A:10BC distribuidos a distancias máximas de recorrido no superiores a 20 metros.'
};

export const SAMPLE_ATS_DATA = {
  id: 'ATS-2026-ALT-104',
  empresa: 'Constructora del Plata S.A.',
  cuit: '30-70984120-1',
  obra: 'Edificio Torre Libertador - Piso 14',
  tarea: 'Montaje de Paneles de Vidrio en Fachada Continua (Trabajo en Altura)',
  fecha: '2026-04-02',
  capatazNombre: 'Esteban R. Morales',
  operatorSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M10 30 Q 30 10 60 25 T 110 20" stroke="%230f172a" stroke-width="2" fill="none"/></svg>',
  capatazSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M10 20 Q 40 35 70 15 T 110 30" stroke="%230f172a" stroke-width="2" fill="none"/></svg>',
  professionalSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M15 25 Q 45 5 80 20 T 115 15" stroke="%231e3a8a" stroke-width="2" fill="none"/></svg>',
  professionalName: 'Lic. Carla Fernández',
  professionalLicense: 'Mat. Nac. 6289',
  epps: [
    'Casco de Seguridad para Altura Clase B con barbijoque de 3 puntos (IRAM 3620)',
    'Arnés Anticaídas Integral de 5 puntos (IRAM 3622-1)',
    'Cabo de Vida Doble en "Y" con Amortiguador de Impacto / Disipador de Energía',
    'Línea de Vida Vertical con Dispositivo Anticaídas Deslizante (Cero Fallas)',
    'Calzado de Seguridad con Puntera de Acero y Suela Antideslizante (IRAM 3610)',
    'Guantes de Vaqueta / Nitrilo Anticorte Nivel 4 (IRAM 3607)'
  ],
  tareas: [
    {
      id: 1,
      paso: '1. Inspección Previa de Elementos de Anclaje y EPP',
      riesgo: 'Uso de arneses con costuras desgastadas o puntos de anclaje no certificados (< 22 kN)',
      control: 'Checklist previo obligatorio. Verificación visual de costuras, mosquetones de doble traba y punto de anclaje homologado.',
      nivelRiesgo: 'Alto',
      normativa: 'Res. SRT 61/23 · Dec. 911/96 Art. 54'
    },
    {
      id: 2,
      paso: '2. Delimitación y Vallado de Zona Inferior en Planta Baja',
      riesgo: 'Caída de herramientas u objetos a nivel de suelo / peatones',
      control: 'Cerramiento perimetral con malla naranja y cartel de "Peligro: Trabajo en Altura". Retención de herramientas con drizas elásticas al arnés.',
      nivelRiesgo: 'Crítico',
      normativa: 'Dec. 911/96 Art. 21 y 57'
    },
    {
      id: 3,
      paso: '3. Izaje y Colocación de Módulos Vidriados con Ventosa de Vacío',
      riesgo: 'Desprendimiento de carga, ráfagas de viento mayores a 30 km/h, caída a distinto nivel',
      control: 'Monitoreo de anemómetro in situ. El operario debe permanecer permanentemente anclado a la línea de vida independiente. Se calculó DLC = 4.80 m (Espacio libre debajo: 6.20 m - APTO).',
      nivelRiesgo: 'Crítico',
      normativa: 'Res. SRT 61/23 Art. 8 y 9'
    }
  ],
  checklist: [
    { id: 1, categoria: 'Entorno', pregunta: '¿La velocidad del viento es inferior a 30 km/h y sin riesgo de tormenta eléctrica?', estado: 'SI' },
    { id: 2, categoria: 'EPP Altura', pregunta: '¿El arnés integral y cabo amortiguador poseen sello IRAM vigente?', estado: 'SI' },
    { id: 3, categoria: 'Anclaje', pregunta: '¿El punto de sujeción estructural resiste al menos 22 kN (2200 kgf) por persona?', estado: 'SI' },
    { id: 4, categoria: 'Cálculo DLC', pregunta: '¿La distancia libre de caída calculada garantiza no golpear obstáculos inferiores?', estado: 'SI' }
  ]
};

export const SAMPLE_PPE_RECEIPT_DATA: { items: any[]; receiptData: PPEReceiptData } = {
  receiptData: {
    razonSocial: 'Transportes & Logística del Centro S.A.',
    cuit: '30-71984250-8',
    direccion: 'Av. Industrial 450, Centro de Cargas',
    localidad: 'Rosario, Santa Fe',
    trabajadorNombre: 'Marcelo Gómez',
    trabajadorDni: '34.892.145',
    puestoTrabajo: 'Operador de Autoelevador y Estiba Pesada',
    observaciones: 'El trabajador recibe los EPP nuevos y certificados bajo norma IRAM. Se brinda instrucción sobre uso, limpieza, inspección diaria y guarda.',
    professionalName: 'Lic. Ignacio M. Rossi',
    professionalLicense: 'Mat. H&S 7482'
  },
  items: [
    {
      id: 1,
      tipo: 'Calzado de Seguridad',
      marca: 'Funcional / Voran',
      modelo: 'Hero Ultralight S3',
      normaIram: 'IRAM 3610 / ISO 20345',
      fechaEntrega: '2026-03-01',
      vidaUtilMeses: 12,
      firma: 'Marcelo Gómez'
    },
    {
      id: 2,
      tipo: 'Protección Craneana (Casco)',
      marca: 'MSA',
      modelo: 'V-Gard Clase B Tipo 1',
      normaIram: 'IRAM 3620',
      fechaEntrega: '2026-03-01',
      vidaUtilMeses: 24,
      firma: 'Marcelo Gómez'
    },
    {
      id: 3,
      tipo: 'Protección Ocular',
      marca: '3M',
      modelo: 'Virtua Transparente Antirrayadura',
      normaIram: 'IRAM 3630 / ANSI Z87.1',
      fechaEntrega: '2026-03-01',
      vidaUtilMeses: 6,
      firma: 'Marcelo Gómez'
    },
    {
      id: 4,
      tipo: 'Chaleco de Alta Visibilidad',
      marca: 'Steelpro',
      modelo: 'Flúor Naranja con bandas reflectivas 3M',
      normaIram: 'IRAM 3859',
      fechaEntrega: '2026-03-01',
      vidaUtilMeses: 12,
      firma: 'Marcelo Gómez'
    }
  ]
};
