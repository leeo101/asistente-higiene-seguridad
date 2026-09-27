/**
 * Tipos oficiales para el Módulo 15: Permisos de Trabajo (PT) y Análisis de Trabajo Seguro (ATS)
 * Normativa: Decreto 351/79, Decreto 911/96, Res. SRT 953/10, Res. SRT 61/23, Res. SRT 37/10.
 */

export type CriticalWorkType =
  | 'altura'
  | 'caliente'
  | 'confinado'
  | 'electrico'
  | 'excavacion'
  | 'izaje'
  | 'quimico'
  | 'general';

export type WorkPermitStatus =
  | 'Borrador'
  | 'Pendiente Supervisor'
  | 'Pendiente EHS'
  | 'Aprobado'
  | 'Rechazado'
  | 'Vencido';

export type PermitVerdict = 'LIBERADO' | 'CONDICIONADO' | 'BLOQUEADO';

export interface WorkPermitChecklistItem {
  id: string | number;
  pregunta: string;
  estado: 'Cumple' | 'No Cumple' | 'N/A' | string;
  criticidad?: 'critico' | 'mayor' | 'menor';
  observaciones?: string;
}

export interface WorkPermitWorker {
  id: string | number;
  nombre: string;
  dni: string;
  firma?: boolean;
  aptoMedicoVigente?: boolean;
  medicalExpiry?: string;
}

export interface WorkPermitData {
  id?: string | number | null;
  numeroPermiso: string;
  empresa: string;
  obra: string;
  fecha: string;
  tipoPermiso: CriticalWorkType | string;
  validezDesde: string;
  validezHasta: string;
  checklist: WorkPermitChecklistItem[];
  personal: WorkPermitWorker[];
  eppRequeridos: string[];
  lotoId?: string;
  observacionesGenerales?: string;
  estado: WorkPermitStatus | string;
  operatorSignature?: string | null;
  supervisorSignature?: string | null;
  professionalSignature?: string | null;
  professionalName?: string;
  professionalLicense?: string;
  showSignatures?: {
    operator: boolean;
    supervisor: boolean;
    professional: boolean;
  };
}

export interface WorkPermitAuditResult {
  verdict: PermitVerdict;
  isApproved: boolean;
  isBlocked: boolean;
  isConditioned: boolean;
  validityHours: number;
  isShiftExceeded: boolean;
  totalControls: number;
  compliantControls: number;
  criticalNonCompliances: string[];
  regularNonCompliances: string[];
  hasRequiredSignatures: boolean;
  missingSignatures: string[];
  medicalFitnessAlerts: string[];
  alerts: string[];
  recommendations: string[];
}

export type ControlHierarchyType =
  | 'Eliminacion'
  | 'Sustitucion'
  | 'Ingenieria'
  | 'Administrativo'
  | 'EPP';

export type RiskLevelType = 'Bajo' | 'Medio' | 'Alto' | 'Critico';

export interface ATSStepItem {
  id?: number;
  paso: string;
  riesgo: string;
  control: string;
  nivelRiesgo?: RiskLevelType | string;
  normativa?: string;
  jerarquiaControl?: ControlHierarchyType | string;
  realizado?: boolean;
}

export interface ATSSurvey {
  id?: string | number;
  empresa?: string;
  cuit?: string;
  obra?: string;
  tarea?: string;
  fecha?: string;
  capatazNombre?: string;
  tareas?: ATSStepItem[];
  checklist?: Array<{
    id: string | number;
    categoria: string;
    pregunta: string;
    estado: string;
    observaciones?: string;
  }>;
  epps?: string[];
  fotos?: string[];
  operatorSignature?: string | null;
  capatazSignature?: string | null;
  professionalSignature?: string | null;
  professionalName?: string;
  professionalLicense?: string;
}

export interface ATSAuditResult {
  dictamen: 'CONFORME' | 'OBSERVADO' | 'NO CONFORME';
  totalSteps: number;
  stepsWithControls: number;
  criticalRisksCount: number;
  engineeringControlsCount: number;
  administrativeControlsCount: number;
  ppeControlsCount: number;
  engineeringRatio: number;
  hasSignatures: boolean;
  alerts: string[];
  recommendations: string[];
}
