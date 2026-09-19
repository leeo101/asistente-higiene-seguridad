/**
 * Tipos e interfaces oficiales para el Protocolo de Medición de Ruido
 * en el Ambiente Laboral — Resolución S.R.T. N° 85/12
 * (Decreto 351/79 Anexo V y Resolución MTEySS N° 295/03 Anexo V)
 */

export type NoiseType = 'Continuo' | 'Intermitente' | 'De Impacto / Impulsivo';
export type NoiseMeasurementType = 'personal' | 'area' | 'peak' | 'octave';
export type NoiseInstrumentType = 'Sonómetro Integrador Clase 1' | 'Sonómetro Integrador Clase 2' | 'Dosímetro Personal';

export interface NoiseCalibratorData {
  marca: string;
  modelo: string;
  numeroSerie: string;
  nivelCalibracionDb: number; // Ej: 94.0 dB o 114.0 dB
  frecuenciaHz?: number; // 1000 Hz
}

export interface NoiseInstrumentData {
  tipo: NoiseInstrumentType;
  marca: string;
  modelo: string;
  numeroSerie: string;
  fechaCalibracionLaboratorio: string; // YYYY-MM-DD
  laboratorioCalibracion?: string;
  certificadoNro?: string;
  calibrador: NoiseCalibratorData;
  verificacionInicialDb: number; // Calibración in-situ antes de medir (ej: 94.0)
  verificacionFinalDb: number; // Calibración in-situ después de medir (ej: 94.1)
}

export interface NoiseLevelsData {
  lavg: number; // Nivel continuo equivalente LAeq o Lavg (dBA)
  lmax?: number; // Nivel máximo en dBA
  lmin?: number; // Nivel mínimo en dBA
  lpeak?: number; // Nivel pico en dBC Peak (máx 140 dB Peak)
  lex8h: number; // Nivel diario equivalente normalizado a 8 horas (dBA)
  dosis: number; // Dosis diaria de ruido (%)
  ruidoFondoDb?: number; // Medición con máquina/fuente apagada
  ruidoFondoValido?: boolean; // Diferencia >= 3 dB
}

export interface NoiseHearingProtectionData {
  usaEPP: boolean;
  tipoEPP: 'Tapones de espuma / silicona' | 'Orejeras / Auriculares de copa' | 'Protección Dual (Tapón + Copa)' | 'Sin EPP';
  marcaModelo?: string;
  nrr_snr: number; // Valor nominal de atenuación en dB
  factorDesclasificacion?: number; // Por defecto 0.70 o 0.75 según norma
  nivelEfectivoAtenuado: number; // Nivel estimado al oído del trabajador
  atenuacionAdecuada: boolean; // Si el nivel efectivo está entre 70 y 80 dBA
  sobreprotegido?: boolean; // Si nivel atenuado < 70 dBA (dificulta comunicación)
}

export interface NoiseOctaveBandsData {
  f63?: number;
  f125?: number;
  f250?: number;
  f500?: number;
  f1000?: number;
  f2000?: number;
  f4000?: number;
  f8000?: number;
}

export interface NoiseAssessmentProtocol {
  id: string;
  // Datos del Empleador y Establecimiento
  razonSocial: string;
  cuit: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  sector: string;
  puestoTrabajo: string;
  tarea: string;
  trabajadorNombre: string;
  trabajadorCuil?: string;
  trabajadoresExpuestosPuesto: number;
  
  // Relevamiento
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  duracionJornadaHoras: number; // Jornada habitual (ej: 8 hs)
  duracionMedicionHoras: number; // Tiempo de corrida de la medición
  tipoRuido: NoiseType;
  tipoMedicion: NoiseMeasurementType;
  
  // Equipamiento
  instrument: NoiseInstrumentData;
  
  // Niveles
  levels: NoiseLevelsData;
  
  // EPP Auditivo
  hearingProtection: NoiseHearingProtectionData;
  
  // Espectro de Frecuencias
  octaves?: NoiseOctaveBandsData;
  
  // Evaluación y Recomendaciones
  observations?: string;
  medidasCorrectivas?: string[];
  dictamen: 'CONFORME' | 'ALERTA (80-85 dBA)' | 'SUPERA LMPE (>85 dBA)';
  
  // Responsables y Firmas
  technician: string;
  technicianLicense?: string;
  operatorSignature?: string;
  supervisorSignature?: string;
  professionalSignature?: string;
  professionalStamp?: string;
  showSignatures?: {
    operator: boolean;
    professional: boolean;
    supervisor: boolean;
  };
  
  createdAt: string;
  updatedAt?: string;
}

export interface NoiseEvaluationMetrics {
  tiempoPermitidoHoras: number;
  dosisDiariaPercent: number;
  lex8h: number;
  limiteExcedido: boolean;
  nivelAccionAlcanzado: boolean;
  calibracionLaboratorioVencida: boolean;
  derivaCalibracionInSituExcedida: boolean;
  ruidoFondoInvalido: boolean;
  correccionFondoDb: number;
  nivelCorregidoLaeq: number;
  eppAtenuacionAdecuada: boolean;
  dictamenGeneral: 'CONFORME' | 'ALERTA (80-85 dBA)' | 'SUPERA LMPE (>85 dBA)' | 'MEDICIÓN INVÁLIDA (FONDO/CALIBRACIÓN)';
  recomendacionesAutomaticas: string[];
}
