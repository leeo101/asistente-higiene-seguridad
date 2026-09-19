/**
 * Tipos e interfaces para el Relevamiento General de Riesgos Laborales (RGRL)
 * Resoluciones S.R.T. N° 463/09, 529/09 y 74/10
 * Superintendencia de Riesgos del Trabajo (Argentina)
 */

export type RGRLAnnexType = 'anexo1_351' | 'anexo2_911' | 'anexo3_617';

export type RGRLItemStatus = 'CUMPLE' | 'NO_CUMPLE' | 'NO_APLICA';

export interface RGRLItem {
  id: string;
  codigo: string; // Ej: "1.1", "2.3"
  seccion: string; // Ej: "Servicio de Higiene y Seguridad", "Instalaciones Eléctricas"
  pregunta: string; // Texto de la exigencia legal
  normativa: string; // Ej: "Dec. 351/79 Cap. 4", "Res. SRT 900/15"
  estado: RGRLItemStatus;
  observacion?: string;
  plazoRegularizacion?: string; // Fecha o plazo si NO CUMPLE
  responsable?: string;
}

export interface RGRLPlanItem {
  id: string;
  codigo: string;
  seccion: string;
  descripcionIncumplimiento: string;
  medidaCorrectiva: string;
  plazoEstimadoDias: number;
  fechaLimite: string;
  responsable: string;
}

export interface RGRLSurvey {
  id: string;
  razonSocial: string;
  cuit: string;
  establecimientoNombre: string;
  direccion: string;
  localidad: string;
  provincia: string;
  artNombre: string;
  nroPoliza?: string;
  ciiuActividad: string; // Código de actividad económica
  cantidadTrabajadores: number;
  superficieM2?: number;
  anexo: RGRLAnnexType;
  fechaRelevamiento: string;
  fechaPresentacionArt?: string;

  // Responsables
  profesionalHySNombre: string;
  profesionalHySMatricula: string;
  empleadorResponsable: string;

  // Cuestionario y Plan
  items: RGRLItem[];
  planRegularizacion: RGRLPlanItem[];

  // Conclusiones
  observacionesGenerales?: string;
  porcentajeCumplimiento: number;
  estadoGeneral: 'Óptimo (≥ 90%)' | 'Aceptable (75-89%)' | 'Crítico (< 75%)';

  createdAt: string;
  updatedAt: string;
}
