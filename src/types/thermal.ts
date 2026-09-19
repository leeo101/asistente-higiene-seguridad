/**
 * Tipos oficiales para el Protocolo de Evaluación de Carga Térmica y Estrés por Frío
 * Según Resolución MTEySS N° 295/03 Anexo II, Res. SRT N° 30/2023 y Decreto 351/79 Cap. 8
 */

export type MetabolicWorkload = 'liviano' | 'moderado' | 'pesado' | 'muy_pesado';

export type WorkRestCycle = 'continuo' | '75_25' | '50_50' | '25_75';

export interface ThermalClothingOption {
  id: string;
  label: string;
  cav: number; // Clothing Adjustment Value (°C)
  description: string;
}

export interface ThermalInstrumentData {
  marca: string;
  modelo: string;
  numeroSerie: string;
  fechaCalibracionLaboratorio: string; // ISO date string YYYY-MM-DD
  verificacionInSituPre?: number; // °C verificación antes de medir
  verificacionInSituPost?: number; // °C verificación después de medir
  derivaCalibracionInSitu?: number; // Diferencia absoluta en °C
}

export interface ThermalEnvironmentalData {
  tbh: number; // Temperatura Bulbo Húmedo natural (°C)
  tg: number; // Temperatura de Globo (°C)
  tbs?: number; // Temperatura Bulbo Seco (°C, requerida con carga solar)
  cargaSolar: boolean; // Al aire libre con sol directo
  velocidadViento?: number; // Velocidad del aire m/s
  humedadRelativa?: number; // % HR opcional
}

export interface ThermalWorkerData {
  puesto: string;
  sector: string;
  tarea: string;
  ritmo: MetabolicWorkload;
  ciclo: WorkRestCycle;
  indumentariaId: string;
  cav: number; // Corrección por ropa
  aclimatado: boolean; // 5-14 días con aumento paulatino de carga
  aptaMedica: boolean; // Apto médico específico vigente
  cantTrabajadoresExpuestos?: number;
  duracionJornadaHoras?: number;
}

export interface ColdStressData {
  evaluarFrio: boolean;
  temperaturaAireSeco?: number; // °C
  velocidadVientoKmH?: number; // km/h
  sensacionTermicaViento?: number; // Wind Chill Index (°C)
  tiempoMaximoExposicionMin?: number;
  categoriaRiesgoFrio?: 'Poco Riesgo' | 'Riesgo Moderado' | 'Alto Riesgo (Congelación)' | 'Peligro Extremo';
  requiereProteccionFacial?: boolean;
}

export interface ThermalEvaluationMetrics {
  tgbhMedido: number;
  cavAplicado: number;
  tgbhEfectivo: number;
  vlePermisible: number;
  vlaAccion: number;
  diferenciaConVle: number;
  limiteExcedido: boolean;
  nivelAccionAlcanzado: boolean;
  trabajoCriticoSuspendido: boolean;
  calibracionLaboratorioVencida: boolean;
  regimenRecomendado: string;
  tasaHidratacionMlPorHora: number;
  dictamenGeneral: 'CONFORME' | 'ZONA DE ACCIÓN (VLA)' | 'SUPERA LMPE (VLE)' | 'CRÍTICO / TRABAJO SUSPENDIDO';
  recomendacionesAutomaticas: string[];
}

export interface ThermalAssessmentProtocol {
  id: string | number;
  fecha: string;
  normativa: string; // 'Res. MTEySS 295/03 & Res. SRT 30/2023'

  // Datos de la Empresa y Establecimiento
  cuit: string;
  razonSocial: string;
  direccion: string;
  localidad: string;
  codigoPostal?: string;
  art: string;
  establecimiento?: string;

  // Instrumental y Mediciones
  instrumento: ThermalInstrumentData;
  ambiental: ThermalEnvironmentalData;
  trabajador: ThermalWorkerData;
  frio?: ColdStressData;

  // Resultados
  metricas: ThermalEvaluationMetrics;
  conclusiones?: string;
  medidasPropuestas?: string;

  // Firmas y Profesionales
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
