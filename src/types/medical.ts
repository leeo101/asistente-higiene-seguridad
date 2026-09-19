/**
 * Tipos e interfaces para el Módulo de Aptitudes Médicas Laborales
 * Resolución S.R.T. N° 37/2010 (Exámenes Médicos en Salud) y Ley N° 19.587
 */

export type MedicalExamType = 
  | 'preocupacional'        // Art. 2° Examen Preocupacional o de Ingreso
  | 'periodico'             // Art. 3° Examen Periódico de Salud Ocupacional (ESOP)
  | 'transferencia'         // Art. 4° Previo a una Transferencia de Actividad
  | 'ausencia_prolongada'   // Art. 5° Posterior a Ausencias Prolongadas
  | 'egreso';               // Art. 6° De Egreso o Terminación de la Relación Laboral

export type MedicalFitnessVerdict = 
  | 'apto'                      // Apto sin restricciones ni preexistencias
  | 'apto_con_preexistencias'   // Apto con patologías preexistentes registradas ante la ART
  | 'apto_con_restricciones'    // Apto con limitaciones operativas para ciertas tareas
  | 'no_apto'                   // No reúne las condiciones psicofísicas requeridas
  | 'no_apto_temporario';       // Cuadro agudo reversible que posterga el dictamen final

export interface HighRiskClearance {
  allowHeight: boolean;         // Habilitado para Trabajo en Altura (> 2 m - Res. SRT 61/23)
  allowConfined: boolean;       // Habilitado para Espacios Confinados (Res. SRT 953/10)
  allowMachinery: boolean;      // Habilitado para Autoelevadores / Maquinaria Pesada / Clark (Dec. 351/79)
  allowElectrical: boolean;     // Habilitado para Trabajos con Tensión / Riesgo Eléctrico (Dec. 351/79 Cap. 14)
  allowNightShift?: boolean;    // Habilitado para Turnos Nocturnos y Trabajo Solitario
}

export interface MedicalRecord extends HighRiskClearance {
  id: string;
  workerName: string;
  dni: string;                  // DNI o CUIL
  jobTitle: string;             // Puesto de trabajo / Tarea
  company: string;              // Razón social patronal
  cuitEmpresa?: string;         // CUIT del empleador
  artNombre?: string;           // ART aseguradora
  examType: MedicalExamType;
  examDate: string;             // Fecha de realización del examen
  expirationDate: string;       // Fecha de vencimiento de la aptitud
  result: MedicalFitnessVerdict;
  clinic: string;               // Centro evaluador / Clínica laboral
  doctor: string;               // Médico evaluador otorgante
  doctorLicense?: string;       // Matrícula nacional o provincial del médico laboral
  notes?: string;               // Observaciones generales del informe
  preexistencias?: string;      // Patologías preexistentes asentadas (para deslinde ART)
  restricciones?: string;       // Restricciones operativas específicas indicadas
  estudiosRealizados?: string[]; // Batería de estudios (Rx Tórax, ECG, Espirometría, etc.)
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalEvaluationResult {
  isExpired: boolean;
  daysUntilExpiration: number;
  urgencyStatus: 'vigente' | 'por_vencer' | 'vencido';
  isFitForTask: boolean;
  verdictLabel: string;
  requiresImmediateAction: boolean;
  alerts: string[];
  recommendations: string[];
}
