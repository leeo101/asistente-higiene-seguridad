/**
 * Tipos e interfaces para el Relevamiento de Agentes de Riesgo (RAR)
 * y Nómina de Trabajadores Expuestos
 * Resolución S.R.T. N° 37/10, Decreto 658/96 (Enfermedades Profesionales)
 * y Resolución S.R.T. N° 81/19 (Sustancias y Agentes Cancerígenos)
 */

export type RiskAgentCategory = 'Físico' | 'Químico' | 'Biológico' | 'Ergonómico';

export interface RiskAgent {
  codigo: string; // Ej: "80001", "40002"
  nombre: string; // Ej: "Ruido (> 85 dBA)"
  categoria: RiskAgentCategory;
  criterioExposicion: string; // Ej: "Exposición a NSCE > 85 dBA sin atenuación"
  estudiosRequeridos: string[]; // Ej: ["Audiometría tonal bianual", "Examen clínico"]
  esCancerigeno?: boolean; // Res. SRT 81/19
  frecuenciaExamen?: 'Semestral' | 'Anual';
  sistemaAfectado?: string; // Ej: 'Auditivo', 'Respiratorio', 'Osteoarticular'
}

export interface WorkerExposure {
  id: string;
  cuil: string; // DNI / CUIL (formato 20-XXXXXXXX-X)
  nombre: string;
  puesto: string;
  sector: string;
  fechaIngreso: string;
  agentesCodigos: string[]; // Array de códigos SRT (ej: ["80001", "90001"])
  horasExposicionDiaria: number;
  diasExposicionSemanal: number;
  eppAdecuado: boolean;
  fechaUltimoExamen?: string;
  observaciones?: string;
}

export interface RARSurvey {
  id: string;
  razonSocial: string;
  cuit: string;
  establecimientoNombre: string;
  establecimientoNumero?: string; // N° de Establecimiento asignado por ART / SRT
  direccion: string;
  localidad: string;
  provincia: string;
  artNombre: string;
  nroPoliza: string;
  ciiuActividad: string;
  fechaRelevamiento: string;
  fechaVigenciaHasta: string;

  profesionalNombre: string;
  profesionalMatricula: string;
  empleadorResponsable: string;

  trabajadores: WorkerExposure[];
  conclusionTecnica?: string;
  observaciones?: string;

  createdAt: string;
  updatedAt: string;
}

export interface RARStats {
  totalTrabajadores: number;
  trabajadoresExpuestos: number;
  trabajadoresNoExpuestos: number;
  porcentajeExpuestos: number;
  conteoPorCategoria: Record<RiskAgentCategory, number>;
  topAgentes: Array<{ codigo: string; nombre: string; cantidad: number }>;
  trabajadoresConCancerigenos: number;
}

export interface RarEvaluationResult {
  isCompliant: boolean;
  totalTrabajadores: number;
  trabajadoresExpuestos: number;
  trabajadoresNoExpuestos: number;
  porcentajeExpuestos: number;
  cancerigenosDetectados: Array<{ codigo: string; nombre: string; trabajadoresAfectados: number }>;
  requiereRegistroCancerigenos: boolean;
  examenesMedicosConsolidados: Array<{ examen: string; cantidadTrabajadores: number }>;
  alertasNormativas: string[];
  recomendaciones: string[];
}

