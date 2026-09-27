/**
 * Tipos oficiales para el Módulo 16: Plan de Capacitación Anual
 * Normativa: Ley 19.587 Art. 9, Decreto 351/79 Cap. 21 (Arts. 208-214), Res. SRT 905/15.
 */

export type TrainingCategory =
  | 'Seguridad e Higiene'
  | 'Emergencias'
  | 'Ergonomía'
  | 'Medio Ambiente'
  | 'Riesgo Eléctrico'
  | 'Sustancias Químicas'
  | 'Primeros Auxilios'
  | 'Trabajo en Altura'
  | 'Espacios Confinados'
  | 'General';

export type MandatoryTopicKey =
  | 'incendio_evacuacion'
  | 'primeros_auxilios'
  | 'epp'
  | 'electrico'
  | 'ergonomia'
  | 'quimico';

export interface MandatoryTopicDefinition {
  key: MandatoryTopicKey;
  title: string;
  legalBasis: string;
  keywords: string[];
}

export const MANDATORY_TRAINING_TOPICS: MandatoryTopicDefinition[] = [
  {
    key: 'incendio_evacuacion',
    title: 'Prevención de Incendios, Rol de Evacuación y Extintores',
    legalBasis: 'Dec. 351/79 Art. 208 & Cap. 18',
    keywords: ['incendio', 'fuego', 'extintor', 'evacuación', 'evacuacion', 'rol de evacuacion', 'matafuego', 'brigada', 'alarma']
  },
  {
    key: 'primeros_auxilios',
    title: 'Primeros Auxilios Básicos y Resucitación Cardiopulmonar (RCP)',
    legalBasis: 'Dec. 351/79 Art. 209 & Res. SRT 905/15',
    keywords: ['primeros auxilios', 'rcp', 'hemorragia', 'desfibrilador', 'dea', 'socorrismo', 'botiquín', 'botiquin', 'atragantamiento', 'heimlich']
  },
  {
    key: 'epp',
    title: 'Selección, Uso, Cuidado y Limitaciones de EPP',
    legalBasis: 'Res. SRT 299/11 Art. 3 & Dec. 351/79 Cap. 19',
    keywords: ['epp', 'protección personal', 'proteccion personal', 'casco', 'arnés', 'arnes', 'calzado de seguridad', 'guantes', 'anteojos de seguridad']
  },
  {
    key: 'electrico',
    title: 'Riesgo Eléctrico y Cinco Reglas de Oro (LOTO)',
    legalBasis: 'Dec. 351/79 Anexo VI & Res. SRT 592/04',
    keywords: ['eléctrico', 'electrico', 'cinco reglas de oro', 'reglas de oro', 'loto', 'bloqueo y etiquetado', 'arco eléctrico', 'tableros', 'alta tensión']
  },
  {
    key: 'ergonomia',
    title: 'Ergonomía, Posturas de Trabajo y Manejo Manual de Cargas',
    legalBasis: 'Res. SRT 886/15 & Res. MTEySS 295/03',
    keywords: ['ergonomía', 'ergonomia', 'levantamiento', 'cargas', 'pausas activas', 'posturas', 'trastornos musculoesqueléticos', 'faja', 'biomecánica']
  },
  {
    key: 'quimico',
    title: 'Riesgo Químico, Fichas de Seguridad (FDS) y Sistema SGA',
    legalBasis: 'Res. SRT 801/15 & Res. MTEySS 295/03 Anexo IV',
    keywords: ['químico', 'quimico', 'sga', 'ghs', 'fds', 'msds', 'sustancias peligrosas', 'tóxico', 'toxico', 'inflamable', 'pictogramas']
  }
];

export interface TrainingAttendee {
  nombre: string;
  dni: string;
  puesto?: string;
  nota?: string | number;
  firma?: boolean | string | null;
  asistio?: boolean;
}

export interface TrainingSession {
  id?: string | number;
  fecha: string;
  tema: string;
  tipoCapacitacion: TrainingCategory | string;
  duracion: string | number; // horas (ej: "1.5" o 1.5)
  expositor: string;
  matriculaExpositor?: string;
  lugar?: string;
  empresa?: string;
  cuit?: string;
  objetivo?: string;
  temario?: string;
  asistentes: TrainingAttendee[];
  evaluacionEficacia?: boolean;
  notaMinimaAprobacion?: number;
  firmaDisertante?: string | null;
  firmaSupervisor?: string | null;
}

export interface TrainingComplianceResult {
  dictamen: 'CONFORME' | 'OBSERVADO' | 'NO CONFORME';
  totalAttendees: number;
  passedAttendees: number;
  failedAttendees: number;
  passRatePercent: number;
  averageScore: number;
  manHours: number;
  durationHours: number;
  hasMatricula: boolean;
  hasSignatures: boolean;
  detectedMandatoryTopic: MandatoryTopicKey | null;
  alerts: string[];
  recommendations: string[];
}

export interface AnnualPlanCompliance {
  dictamen: 'CONFORME' | 'OBSERVADO' | 'NO CONFORME';
  totalSessions: number;
  totalManHours: number;
  averageHoursPerWorker: number;
  coveredMandatoryTopics: MandatoryTopicKey[];
  missingMandatoryTopics: MandatoryTopicKey[];
  coveragePercent: number;
  alerts: string[];
  recommendations: string[];
}
