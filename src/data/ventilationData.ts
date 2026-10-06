export type WorkplaceActivityType = 'sedentaria' | 'moderada' | 'pesada';

export type RoomEnvironmentType =
  | 'oficinas_aulas'
  | 'deposito_logistica'
  | 'taller_mecanico'
  | 'soldadura_humos'
  | 'cabina_pintura'
  | 'sala_baterias'
  | 'laboratorio_quimico'
  | 'cocina_industrial'
  | 'banos_vestuarios';

export interface VentilationEquipment {
  id: string;
  type: 'extractor_axial' | 'extractor_eolico' | 'extractor_centrifugo' | 'inyector_aire_fresco' | 'abertura_natural';
  tag: string; // Ej: EXT-01
  flowRateM3H: number; // Caudal unitario en m3/h
  quantity: number;
  diameterMm?: number;
  powerHp?: number;
}

export interface AnemometerPoint {
  id: string;
  location: string;
  airVelocityMS: number; // m/s
  co2Ppm?: number; // ppm (400-1000 normal)
  temperatureC?: number;
}

export interface VentilationStudy {
  id: string;
  companyId?: string;
  sectorName: string;
  activityType: WorkplaceActivityType;
  environmentType: RoomEnvironmentType;
  date: string; // YYYY-MM-DD
  evaluatorName: string;
  evaluatorLicense: string;

  // Dimensiones del local
  surfaceM2: number;
  heightM: number;
  volumeM3: number;
  workersCount: number;

  // Equipos y cálculo
  equipments: VentilationEquipment[];
  naturalOpeningsAreaM2: number;

  // Mediciones instrumentales
  measurementPoints: AnemometerPoint[];

  // Métricas calculadas
  cubicMetersPerPerson: number;
  requiredFlowRateByPersonsM3H: number;
  recommendedAirChangesPerHour: number;
  requiredFlowRateByVolumeM3H: number;
  totalRequiredFlowRateM3H: number;
  totalActualFlowRateM3H: number;
  actualAirChangesPerHour: number;
  flowDeficitM3H: number;
  coveragePercent: number;
  isCompliant: boolean;

  recommendations: string;
  status: 'conforme' | 'no_conforme';
  createdAt: string;
}

// ─── TABLA OFICIAL ANEXO III DEC. 351/79: CAUDAL MÍNIMO POR PERSONA (m3/h) ───
export const DEC351_VENTILATION_TABLE = {
  sedentaria: [
    { maxCubicM3: 3, flowPerPerson: 43 },
    { maxCubicM3: 6, flowPerPerson: 29 },
    { maxCubicM3: 9, flowPerPerson: 21 },
    { maxCubicM3: 12, flowPerPerson: 15 },
    { maxCubicM3: Infinity, flowPerPerson: 12 }
  ],
  moderada: [
    { maxCubicM3: 3, flowPerPerson: 65 },
    { maxCubicM3: 6, flowPerPerson: 43 },
    { maxCubicM3: 9, flowPerPerson: 31 },
    { maxCubicM3: 12, flowPerPerson: 23 },
    { maxCubicM3: Infinity, flowPerPerson: 18 }
  ],
  pesada: [
    { maxCubicM3: 3, flowPerPerson: 86 },
    { maxCubicM3: 6, flowPerPerson: 58 },
    { maxCubicM3: 9, flowPerPerson: 42 },
    { maxCubicM3: 12, flowPerPerson: 31 },
    { maxCubicM3: Infinity, flowPerPerson: 24 }
  ]
};

// ─── RENOVACIONES HORARIAS RECOMENDADAS POR TIPO DE AMBIENTE (Ren/h) ───
export const ENVIRONMENT_AIR_CHANGES: Record<RoomEnvironmentType, { label: string; minRenH: number; maxRenH: number; description: string }> = {
  oficinas_aulas: { label: 'Oficinas / Aulas / Control', minRenH: 4, maxRenH: 6, description: 'Ambientes limpios sin generación de contaminantes.' },
  deposito_logistica: { label: 'Depósito / Almacén General', minRenH: 2, maxRenH: 4, description: 'Tránsito de personas y autoelevadores eléctricos.' },
  taller_mecanico: { label: 'Taller Mecánico / Mantenimiento', minRenH: 6, maxRenH: 10, description: 'Gases de combustión y desengrase.' },
  soldadura_humos: { label: 'Sector Soldadura / Humos Metálicos', minRenH: 12, maxRenH: 20, description: 'Emisión continua de óxidos de nitrógeno y partículas metálicas.' },
  cabina_pintura: { label: 'Cabina de Pintura / Barnizado', minRenH: 20, maxRenH: 35, description: 'Solventes orgánicos volátiles y nieblas inflamables.' },
  sala_baterias: { label: 'Sala de Baterías (Autoelevadores)', minRenH: 10, maxRenH: 15, description: 'Desprendimiento de hidrógeno durante la carga.' },
  laboratorio_quimico: { label: 'Laboratorio Químico / Ensayos', minRenH: 10, maxRenH: 15, description: 'Vapores de reactivos y campanas de extracción.' },
  cocina_industrial: { label: 'Cocina Industrial / Comedor', minRenH: 15, maxRenH: 25, description: 'Grasas, vapor de agua y calor metabólico.' },
  banos_vestuarios: { label: 'Baños y Vestuarios de Personal', minRenH: 6, maxRenH: 10, description: 'Extracción continua de olores y humedad.' }
};

/**
 * Motor de Cálculo Oficial Dec. 351/79 Anexo III
 */
export function calcVentilationMetrics(
  surfaceM2: number,
  heightM: number,
  workersCount: number,
  activityType: WorkplaceActivityType,
  environmentType: RoomEnvironmentType,
  equipments: VentilationEquipment[],
  naturalOpeningsAreaM2: number = 0
) {
  const volumeM3 = Math.round(surfaceM2 * heightM * 100) / 100;
  const safeWorkers = Math.max(1, workersCount);
  const cubicMetersPerPerson = Math.round((volumeM3 / safeWorkers) * 100) / 100;

  // 1. Caudal exigido por personas (Tabla Anexo III)
  const tableRows = DEC351_VENTILATION_TABLE[activityType];
  const matched = tableRows.find(r => cubicMetersPerPerson <= r.maxCubicM3) || tableRows[tableRows.length - 1];
  const requiredFlowRateByPersonsM3H = Math.round(safeWorkers * matched.flowPerPerson);

  // 2. Caudal exigido por volumen y renovaciones recomendadas del ambiente
  const recommendedAirChangesPerHour = ENVIRONMENT_AIR_CHANGES[environmentType]?.minRenH || 4;
  const requiredFlowRateByVolumeM3H = Math.round(volumeM3 * recommendedAirChangesPerHour);

  // Caudal total normativo mínimo (el mayor de ambos criterios)
  const totalRequiredFlowRateM3H = Math.max(requiredFlowRateByPersonsM3H, requiredFlowRateByVolumeM3H);

  // 3. Caudal real suministrado por equipos mecánicos
  const mechanicalFlow = equipments.reduce((acc, eq) => acc + (eq.flowRateM3H * eq.quantity), 0);

  // Aporte estimado de ventilación natural si hay aberturas (viento medio 1 m/s en aberturas permeables)
  const naturalFlow = Math.round(naturalOpeningsAreaM2 * 0.5 * 3600); // Caudal aproximado m3/h

  const totalActualFlowRateM3H = Math.round(mechanicalFlow + naturalFlow);

  // Renovaciones horarias reales obtenidas
  const actualAirChangesPerHour = volumeM3 > 0
    ? Math.round((totalActualFlowRateM3H / volumeM3) * 10) / 10
    : 0;

  // Déficit o superávit
  const flowDeficitM3H = Math.max(0, totalRequiredFlowRateM3H - totalActualFlowRateM3H);
  const coveragePercent = totalRequiredFlowRateM3H > 0
    ? Math.round((totalActualFlowRateM3H / totalRequiredFlowRateM3H) * 100)
    : 100;

  const isCompliant = totalActualFlowRateM3H >= totalRequiredFlowRateM3H;

  return {
    volumeM3,
    cubicMetersPerPerson,
    requiredFlowRateByPersonsM3H,
    recommendedAirChangesPerHour,
    requiredFlowRateByVolumeM3H,
    totalRequiredFlowRateM3H,
    totalActualFlowRateM3H,
    actualAirChangesPerHour,
    flowDeficitM3H,
    coveragePercent,
    isCompliant
  };
}

export const DEFAULT_VENTILATION_STUDIES: VentilationStudy[] = [
  {
    id: 'vent-001',
    sectorName: 'Taller de Mecanizado y Soldadura',
    activityType: 'moderada',
    environmentType: 'taller_mecanico',
    date: '2026-10-02',
    evaluatorName: 'Ing. Carlos Mendoza',
    evaluatorLicense: 'COPIME N° 14890',
    surfaceM2: 240,
    heightM: 4.8,
    volumeM3: 1152,
    workersCount: 12,
    equipments: [
      { id: 'eq-1', type: 'extractor_axial', tag: 'EXT-AX-01', flowRateM3H: 4200, quantity: 2, diameterMm: 600, powerHp: 1.5 }
    ],
    naturalOpeningsAreaM2: 4.5,
    measurementPoints: [
      { id: 'p-1', location: 'Puesto Torno Paralelo 1', airVelocityMS: 0.28, co2Ppm: 620, temperatureC: 22.4 },
      { id: 'p-2', location: 'Bahía de Soldadura TIG', airVelocityMS: 0.35, co2Ppm: 710, temperatureC: 23.8 },
      { id: 'p-3', location: 'Mesa de Ajuste y Armado', airVelocityMS: 0.22, co2Ppm: 580, temperatureC: 21.9 }
    ],
    cubicMetersPerPerson: 96,
    requiredFlowRateByPersonsM3H: 216,
    recommendedAirChangesPerHour: 6,
    requiredFlowRateByVolumeM3H: 6912,
    totalRequiredFlowRateM3H: 6912,
    totalActualFlowRateM3H: 16500,
    actualAirChangesPerHour: 14.3,
    flowDeficitM3H: 0,
    coveragePercent: 238,
    isCompliant: true,
    recommendations: 'El sistema de ventilación forzada supera holgadamente el caudal reglamentario del Dec. 351/79. Se recomienda mantener limpios los álabes de los extractores.',
    status: 'conforme',
    createdAt: '2026-10-02'
  },
  {
    id: 'vent-002',
    sectorName: 'Sala de Pintura y Retoque',
    activityType: 'moderada',
    environmentType: 'cabina_pintura',
    date: '2026-09-20',
    evaluatorName: 'Ing. Carlos Mendoza',
    evaluatorLicense: 'COPIME N° 14890',
    surfaceM2: 45,
    heightM: 3.2,
    volumeM3: 144,
    workersCount: 2,
    equipments: [
      { id: 'eq-2', type: 'extractor_centrifugo', tag: 'EXT-EX-01', flowRateM3H: 3200, quantity: 1, diameterMm: 450, powerHp: 2 }
    ],
    naturalOpeningsAreaM2: 0,
    measurementPoints: [
      { id: 'p-1', location: 'Zona de Pulverizado / Pistola', airVelocityMS: 0.42, co2Ppm: 510, temperatureC: 21.0 }
    ],
    cubicMetersPerPerson: 72,
    requiredFlowRateByPersonsM3H: 36,
    recommendedAirChangesPerHour: 20,
    requiredFlowRateByVolumeM3H: 2880,
    totalRequiredFlowRateM3H: 2880,
    totalActualFlowRateM3H: 3200,
    actualAirChangesPerHour: 22.2,
    flowDeficitM3H: 0,
    coveragePercent: 111,
    isCompliant: true,
    recommendations: 'La cabina cumple con las 20 renovaciones horarias mínimas para vapores inflamables. Reemplazar filtros de carbón activado semestralmente.',
    status: 'conforme',
    createdAt: '2026-09-20'
  }
];
