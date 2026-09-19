/**
 * Tipos oficiales para el módulo de Espacios Confinados
 * Homologado con la Resolución S.R.T. N° 953/10 y Resolución MTEySS N° 295/03 Anexo IV
 */

export type GasStratum = 'piso' | 'medio' | 'techo' | 'general';

export interface AtmosphericGasReading {
  stratum?: GasStratum;
  time?: string;
  o2: number; // Porcentaje volumen (19.5% - 23.5% admisible)
  lel: number; // Porcentaje del Límite Inferior de Explosividad (LEL <= 10%)
  co: number; // Monóxido de carbono en ppm (CMP = 25 ppm según Res. 295/03)
  h2s: number; // Sulfuro de hidrógeno en ppm (CMP = 10 ppm según Res. 295/03)
  co2?: number; // Dióxido de carbono en ppm (CMP = 5000 ppm)
  voc?: number; // Compuestos orgánicos volátiles (ppm)
}

export type AtmosphericStatus = 'APROBADO_SEGURO' | 'ALERTA_VENTILACION' | 'CRITICO_PROHIBIDO_INGRESO';

export interface AtmosphericEvaluationResult {
  status: AtmosphericStatus;
  isSafeToEnter: boolean;
  warnings: string[];
  recommendations: string[];
  details: {
    o2Status: 'DEFICIENTE' | 'NORMAL' | 'ENRIQUECIDO';
    lelStatus: 'SEGURO' | 'PELIGROSO';
    coStatus: 'SEGURO' | 'SUPERA_CMP';
    h2sStatus: 'SEGURO' | 'SUPERA_CMP';
  };
}

export interface ConfinedSpaceWorker {
  id: string;
  name: string;
  dni: string;
  role: 'entrant' | 'attendant' | 'supervisor' | 'rescue';
  medicalAptitudeOk: boolean;
  entryTime?: string;
  exitTime?: string;
  signature?: string;
}

export interface ConfinedSpaceIsolationLoto {
  valvesClosedAndLocked: boolean;
  blindFlangesInstalled: boolean;
  electricalLockoutApplied: boolean;
  linesPurgedAndCleaned: boolean;
  mechanicalDrivesDeenergized: boolean;
  notes?: string;
}

export interface ConfinedSpaceVentilation {
  type: 'natural' | 'forced_positive' | 'forced_negative' | 'push_pull';
  isOperatingContinuously: boolean;
  airflowRateM3h?: number;
  airChangesPerHour?: number;
  sufficientVentilation: boolean;
}

export interface ConfinedSpaceRescueEquipment {
  tripodAndWinchAvailable: boolean;
  fullBodyHarnessClassAorE: boolean;
  retractableLifeline: boolean;
  standbySCBAAvailable: boolean;
  directCommunicationTested: boolean;
  firstAidKitReady: boolean;
}

export interface ConfinedSpaceInstrumentData {
  brand: string;
  model: string;
  serialNumber: string;
  calibrationDate: string;
  bumpTestVerified: boolean;
  gasPatternType?: string;
}

export interface ConfinedSpacePermitProtocol {
  id: string;
  permitNumber: string;
  // Datos de la empresa y establecimiento (Res. SRT 953/10)
  cuit: string;
  companyName: string;
  establishmentAddress: string;
  art: string;
  sector: string;
  workDescription: string;
  // Identificación del espacio confinado
  spaceName: string;
  spaceType: 'tank' | 'vessel' | 'silo' | 'pit' | 'tunnel' | 'sewer' | 'manhole' | 'other';
  internalVolumeM3?: number;
  accessType: string;
  // Vigencia estricta
  date: string;
  validFromTime: string;
  validUntilTime: string;
  isPermitActive: boolean;
  // Instrumentación
  instrument: ConfinedSpaceInstrumentData;
  // Evaluaciones atmosféricas (inicial y continuas / estratificadas)
  initialReadings: AtmosphericGasReading;
  continuousReadings?: AtmosphericGasReading[];
  atmosphericEvaluation: AtmosphericEvaluationResult;
  // Medidas de seguridad y prevención obligatorias
  isolation: ConfinedSpaceIsolationLoto;
  ventilation: ConfinedSpaceVentilation;
  rescue: ConfinedSpaceRescueEquipment;
  // Personal involucrado
  workers: ConfinedSpaceWorker[];
  attendantName: string; // Vigía exterior permanente
  supervisorName: string; // Supervisor habilitante
  professionalName: string; // Responsable HyS
  professionalLicense: string;
  // Dictamen final
  isAuthorizedToEnter: boolean;
  finalObservations?: string;
  supervisorSignature?: string;
  attendantSignature?: string;
  professionalSignature?: string;
  createdAt?: string;
}
