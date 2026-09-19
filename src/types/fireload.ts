/**
 * Tipos oficiales para el Estudio Técnico de Carga de Fuego y Extintores
 * Según Decreto PEN N° 351/79 Anexo VII (Capítulo 18: Protección contra Incendios)
 * y Normas IRAM 3517-1 / IRAM 3517-2
 */

export type FireRiskLevel = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

export type FireVentilationType = 'natural' | 'sin_ventilacion';

export interface FireMaterialItem {
  nombre: string;
  peso: number; // en kg
  poderCalorifico: number; // en kcal/kg (madera patrón: 4400 kcal/kg)
  totalKcal?: number;
}

export interface FireExtinctionCondition {
  codigo: string; // ej. 'E1', 'E2', 'E4'
  nombre: string;
  aplica: boolean;
  descripcion: string;
}

export interface FireLoadEvaluationMetrics {
  cargaTermicaTotalKcal: number;
  cargaTermicaTotalMcal: number;
  cargaTermicaTotalMJ: number;
  maderaEquivalenteKg: number;
  cargaFuegoKgM2: number;
  clasificacionRiesgo: FireRiskLevel;
  ventilacion: FireVentilationType;
  resistenciaFuegoRequerida: string; // 'F30' | 'F60' | 'F90' | 'F120' | 'F180' | 'F180+'
  minExtintores: number;
  potencialExtintorClaseA: string; // ej. '1A', '2A', '3A', '6A', '10A'
  potencialExtintorClaseB: string; // ej. '6B', '10B', '20B', '40B'
  potencialExtintorNominal: string; // ej. '2A-10B:C'
  distanciaMaximaRecorridoMetros: number; // 20m para A, 15m para B
  requiereRedHidrantes: boolean; // Condición E1
  requiereRociadoresAutomaticos: boolean; // Condición E2
  condicionesAplicables: FireExtinctionCondition[];
  recomendacionesTecnicas: string[];
}

export interface FireLoadAssessmentProtocol {
  id: string | number;
  fecha: string;
  normativa: string; // 'Decreto 351/79 Anexo VII'

  // Datos del Establecimiento
  cuit: string;
  razonSocial: string;
  direccion: string;
  localidad: string;
  art?: string;
  establecimiento?: string;

  // Sector de Incendio
  sector: string;
  superficie: number; // en m2
  alturaMediaMetros?: number;
  ventilacion: FireVentilationType;
  actividadGrupo: string;
  actividadResumen?: string;
  descripcionActividad?: string;
  riesgo: FireRiskLevel;

  // Materiales e Inventario
  materiales: FireMaterialItem[];

  // Resultados
  metricas: FireLoadEvaluationMetrics;
  conclusion?: string;

  // Firmas
  evaluador?: string;
  professionalName?: string;
  professionalLicense?: string;
  professionalSignature?: string | null;
  professionalStamp?: string | null;
  operatorSignature?: string | null;
  supervisorSignature?: string | null;
  showSignatures?: {
    operator: boolean;
    professional: boolean;
    supervisor: boolean;
  };
}
