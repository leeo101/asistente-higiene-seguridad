/**
 * Tipos oficiales para el Protocolo de Ergonomía Laboral
 * Conforme a la Resolución S.R.T. N° 886/15 (Anexo I)
 * Superintendencia de Riesgos del Trabajo — República Argentina
 */

export type ErgonomicsRiskLevel = 'Nivel 1 (Aceptable)' | 'Nivel 2 (Moderado)' | 'Nivel 3 (No Aceptable)';

export type ErgonomicsRiskFactorKey =
  | '1_levantamiento'
  | '2_empuje'
  | '3_transporte'
  | '4_bipedestacion'
  | '5_movimientos_repetitivos'
  | '6_posturas_forzadas'
  | '7_vibraciones_mano_brazo'
  | '8_vibraciones_cuerpo_entero'
  | '9_confort_termico'
  | '10_estres_contacto';

export interface Planilla1Item {
  id: ErgonomicsRiskFactorKey;
  numero: number;
  nombre: string;
  planillaDerivada: string;
  presente: boolean;
  requierePlanilla2: boolean;
  criterioSrt: string;
  observaciones?: string;
}

export interface Planilla2NioshData {
  pesoCargaKg: number;
  distanciaHCm: number; // Distancia horizontal (25 a 63 cm)
  distanciaVCm: number; // Altura vertical (0 a 175 cm)
  desplazamientoDCm: number; // Recorrido vertical (25 a 175 cm)
  anguloTorsionDeg: number; // Asimetría (0 a 135 grados)
  frecuenciaLiftsMin: number; // Levantamientos por minuto
  duracionHoras: number; // 1, 2 u 8 hs
  calidadAgarre: 'Bueno' | 'Regular' | 'Malo';
  // Resultados calculados
  lprKg: number; // Límite de Peso Recomendado
  indiceLevantamiento: number; // IL = Peso / LPR
  multiplicadores: {
    HM: number;
    VM: number;
    DM: number;
    AM: number;
    FM: number;
    CM: number;
  };
  nivelRiesgo: ErgonomicsRiskLevel;
}

export interface Planilla2RepetitiveData {
  evaluado: boolean;
  cicloMenor30s: boolean;
  movimientosRepetitivosMas50Porciento: boolean;
  fuerzaPercibida: 'Baja' | 'Moderada' | 'Alta';
  pausasAdecuadas: boolean;
  nivelRiesgo: ErgonomicsRiskLevel;
  observaciones?: string;
}

export interface Planilla2PosturesData {
  evaluado: boolean;
  flexionTroncoMayor20: boolean;
  brazosElevadosHombro: boolean;
  cuclillasOArrodilladoMas2h: boolean;
  giroCuelloInclinacion: boolean;
  nivelRiesgo: ErgonomicsRiskLevel;
  observaciones?: string;
}

export interface Planilla3ActionMeasure {
  id: string;
  factorRiesgo: string;
  medidaPropuesta: string;
  tipoMedida: 'Ingeniería' | 'Administrativa / Organizacional' | 'Capacitación' | 'EPP';
  plazo: string;
  responsable: string;
  estado: 'Pendiente' | 'En Progreso' | 'Cumplida';
}

export interface ErgonomicsAssessmentProtocol {
  id?: string;
  // I. Datos del Empleador (Res. SRT 886/15)
  cuit: string;
  empresa: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  art?: string;
  afiliadoArt?: string;

  // II. Puesto y Tarea
  sector: string;
  puesto: string;
  descripcionTarea: string;
  trabajadoresVarones: number;
  trabajadoresMujeres: number;
  duracionJornadaHoras: number;

  // III. Instrumental y Evaluador
  profesionalNombre?: string;
  profesionalMatricula?: string;
  fechaEvaluacion: string;

  // IV. Planilla 1 (10 factores de riesgo)
  planilla1: Record<ErgonomicsRiskFactorKey, boolean>;
  planilla1Observaciones?: Record<string, string>;

  // V. Planilla 2 (Evaluaciones específicas)
  calculoLevantamiento: Planilla2NioshData;
  repetitivos?: Planilla2RepetitiveData;
  posturas?: Planilla2PosturesData;

  // VI. Planilla 3 (Matriz de medidas)
  medidasAccion: Planilla3ActionMeasure[];

  // VII. Dictamen final
  nivelRiesgoGlobal: ErgonomicsRiskLevel;
  riesgo: 'Tolerable' | 'Moderado' | 'Alto'; // Compatibilidad retroactiva
  conclusiones: string;
  recomendaciones: string;

  // Firmas
  operatorSignature?: string;
  supervisorSignature?: string;
  professionalSignature?: string;
}
