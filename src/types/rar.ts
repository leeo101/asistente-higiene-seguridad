/**
 * Tipos e interfaces para el Relevamiento de Agentes de Riesgo (RAR)
 * y Nómina de Trabajadores Expuestos
 * Resolución S.R.T. N° 37/10 y Decreto 658/96 (Enfermedades Profesionales)
 */

export type RiskAgentCategory = 'Físico' | 'Químico' | 'Biológico' | 'Ergonómico';

export interface RiskAgent {
  codigo: string; // Ej: "80001", "90001"
  nombre: string; // Ej: "Ruido (> 85 dBA)"
  categoria: RiskAgentCategory;
  criterioExposicion: string; // Ej: "Exposición a NSCE > 85 dBA sin atenuación"
  estudiosRequeridos: string[]; // Ej: ["Audiometría tonal bianual", "Examen clínico"]
}

export interface WorkerExposure {
  id: string;
  cuil: string; // DNI / CUIL
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
  observaciones?: string;

  createdAt: string;
  updatedAt: string;
}
