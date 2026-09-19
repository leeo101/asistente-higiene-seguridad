/**
 * Tipos e interfaces oficiales para el Protocolo de Medición de
 * Iluminación en el Ambiente Laboral — Resolución S.R.T. N° 84/12
 * Anexo I (Dec. 351/79 Anexo IV e IRAM AADL J 20-06)
 */

export type LightingSourceType = 'Natural' | 'Artificial' | 'Mixta';
export type LightingFixtureType = 'LED' | 'Fluorescente' | 'Incandescente / Halógena' | 'Vapor de Sodio' | 'Mercurio Halogenado' | 'Otro';

export interface LightingPointMeasurement {
  id: string;
  codigoPunto: string; // Ej: P1, P2, P3
  sector: string; // Ej: Nave de Producción, Oficina Técnica
  puestoTrabajo: string; // Ej: Torno CNC, Escritorio Administrativo
  tareaVisual: string; // Ej: Inspección fina, Lectura general
  alturaPlanoTrabajoM: number; // Ej: 0.80 m (altura sobre nivel de piso)
  tipoIluminacion: LightingSourceType;
  tipoLuminaria?: LightingFixtureType;
  luxRequeridoNorma: number; // Ej: 500 Lux segun Dec. 351/79
  luxMedido: number; // Valor medido con luxómetro
  conformeNivel: boolean; // luxMedido >= luxRequeridoNorma
  observaciones?: string;
}

export interface LightingInstrument {
  marca: string;
  modelo: string;
  numeroSerie: string;
  fechaCalibracion: string; // YYYY-MM-DD
  laboratorioCalibracion?: string;
  certificadoCalibracionNro?: string;
}

export interface LightingProtocolSRT84 {
  id: string;
  // Datos del Empleador / Razón Social
  razonSocial: string;
  cuit: string;
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal?: string;
  actividadPrincipal?: string;

  // Datos del Relevamiento
  fechaMedicion: string;
  horaInicio?: string;
  horaFin?: string;
  condicionMeteorologica?: 'Despejado' | 'Parcialmente Nublado' | 'Nublado' | 'Lluvia';

  // Instrumental
  instrumento: LightingInstrument;

  // Dimensiones del Local (para índice de cavidad / grilla si aplica)
  largoLocalM?: number;
  anchoLocalM?: number;
  alturaMontajeLuminariasM?: number;

  // Mediciones
  puntos: LightingPointMeasurement[];

  // Conclusión Técnica y Profesional
  conclusionTecnica: string;
  recomendaciones: string[];
  
  // Datos del Profesional actuante
  profesionalNombre: string;
  profesionalMatricula: string;
  profesionalTitulo?: string;

  createdAt: string;
  updatedAt: string;
}

export interface LightingAuditMetrics {
  totalPuntos: number;
  puntosConformes: number;
  puntosDeficientes: number;
  porcentajeConformidad: number;
  iluminanciaMedia: number; // Emed
  iluminanciaMinima: number; // Emin
  iluminanciaMaxima: number; // Emax
  factorUniformidad: number; // U = Emin / Emed
  uniformidadConforme: boolean; // U >= 0.50 según IRAM / SRT 84/12
  calibracionVencida: boolean;
  dictamenGeneral: 'CONFORME' | 'DEFICIENTE' | 'OBSERVADO (UNIFORMIDAD)';
}
