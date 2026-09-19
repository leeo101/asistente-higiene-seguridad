/**
 * Tipos e interfaces para el Módulo de Investigación de Accidentes de Trabajo e Incidentes
 * Resolución S.R.T. N° 475/2006, Ley N° 24.557, Resolución S.R.T. N° 503/2014 y Método del Árbol de Causas
 */

export type AccidentSeverity = 'Leve' | 'Moderado' | 'Grave' | 'Mortal';

export type AccidentType = 
  | 'accidente_trabajo'      // Accidente típico en ocasión o por el hecho del trabajo
  | 'in_itinere'             // Accidente en el trayecto directo domicilio-trabajo
  | 'incidente_sin_lesion';  // Cuasi-accidente o incidente de alto potencial (HIPPO)

export type ControlHierarchy = 
  | 'eliminacion'            // 1. Eliminación física del peligro
  | 'sustitucion'            // 2. Sustitución por material o proceso menos peligroso
  | 'ingenieria'             // 3. Aislamiento / Guardas / Encerramientos / Ventilación
  | 'administrativo'         // 4. Procedimientos, capacitación, señalización, rotación
  | 'epp';                   // 5. Elementos de Protección Personal (Res. SRT 299/11)

export type CauseNodeType = 
  | 'hecho'                  // Hecho objetivo y constatable
  | 'acto_inseguro'          // Práctica o desviación operacional subestándar
  | 'condicion_subestandar'  // Peligro físico o ambiental no controlado
  | 'factor_personal'        // Falta de conocimiento, aptitud o motivación
  | 'factor_organizacional'; // Falla en supervisión, mantenimiento, procedimiento o gestión

export interface CauseTreeNode {
  id: string;
  level: number;             // Nivel en la cadena causal (1: Inmediato a 5: Raíz)
  tipo: CauseNodeType;
  descripcion: string;
  esCausaRaiz?: boolean;
}

export interface CorrectiveActionCAPA {
  id?: string;
  accion: string;
  jerarquia: ControlHierarchy;
  responsable: string;
  fechaLimite: string;
  estado?: 'pendiente' | 'en_curso' | 'implementada';
  verificacionEficacia?: string;
}

export interface WitnessStatement {
  nombre: string;
  dni?: string;
  puesto?: string;
  declaracion: string;
}

export interface EnvironmentalConditionsChecklist {
  iluminacionDeficiente: boolean;
  ordenLimpiezaDeficiente: boolean;
  pisoResbaladizo: boolean;
  ruidoElevado: boolean;
  eppAusenteOInadecuado: boolean;
  ventilacionInsuficiente: boolean;
  faltaGuardaProteccion: boolean;
  senializacionInadecuada?: boolean;
  intervencionConTension?: boolean;
  trabajoEnAlturaSinArnes?: boolean;
}

export interface SiniestralityIndicators {
  hhtTotal: number;           // Horas Hombre Trabajadas (período considerado)
  dotacionExpuesta: number;   // Total de trabajadores expuestos en nómina
  diasIltEstimados: number;   // Días de Incapacidad Laboral Temporaria (baja)
  indiceFrecuencia: number;   // IF = (Accidentes con baja * 1.000.000) / HHT
  indiceGravedad: number;     // IG = (Días perdidos * 1.000.000) / HHT
  indiceIncidencia: number;   // II = (Accidentes con baja * 1.000) / Dotación
}

export interface AccidentInvestigationProtocol {
  id: string;
  tipoAccidente: AccidentType;
  gravedad: AccidentSeverity;
  
  // Datos Patronales y Establecimiento
  empresa: string;
  cuitEmpresa?: string;
  artNombre?: string;
  numeroSiniestro?: string;    // N° de denuncia formal ante la ART
  centroMedico?: string;
  establecimiento?: string;
  ubicacion: string;           // Sector, área o coordenadas exactas
  
  // Temporalidad
  fecha: string;               // YYYY-MM-DD
  hora: string;                // HH:mm
  tiempoEnPuestoAlMomento?: string; // Horas trabajadas en la jornada previo al hecho
  
  // Datos del Trabajador Afectado
  victimaNombre: string;
  victimaDni: string;          // DNI o CUIL
  victimaPuesto: string;
  victimaAntiguedad: string;
  victimaEdad?: string;
  capacitadoEnRiesgo?: boolean;
  aptoMedicoVigente?: boolean; // Verificado bajo Res. SRT 37/10
  
  // Clasificación Codificada SRT / OIT
  formaAccidente?: string;     // Forma de producción (Caída, Atrapamiento, etc.)
  agenteMaterial?: string;     // Agente que produjo la lesión o contacto
  parteCuerpo: string;         // Zona anatómica general
  parteCuerpoEspecifica?: string;
  lesion: string;              // Naturaleza de la lesión clínica
  mecanismoAccidente?: string; // Breve síntesis cinemática
  
  // Investigación de Campo
  descripcionHecho: string;
  condicionesAmbientales: EnvironmentalConditionsChecklist;
  testigos: WitnessStatement[];
  fotos: string[];
  
  // Análisis Causal (Método del Árbol de Causas)
  problemaCentral: string;
  porques: string[];
  arbolCausas?: CauseTreeNode[];
  causaRaizIdentificada?: string;
  
  // Plan de Acción CAPA
  medidas: CorrectiveActionCAPA[];
  
  // Indicadores de Siniestralidad (Res. SRT 503/14)
  hhtTotal: string;
  diasIltEstimados: string;
  dotacionExpuesta?: string;
  
  // Firmas Legales
  showSignatures?: {
    operator?: boolean;
    professional?: boolean;
    supervisor?: boolean;
  };
  operatorSignature?: string;
  professionalSignature?: string;
  supervisorSignature?: string;
  signature?: string;
  professionalName?: string;
  professionalLicense?: string;
  professionalStamp?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface AccidentEvaluationResult {
  requiresImmediateSrtNotification: boolean; // Obligatorio por Res. SRT 475/06 para Graves y Mortales
  hasRootCause: boolean;
  hasCapaAction: boolean;
  hasEngineeringControls: boolean;
  indicators: SiniestralityIndicators;
  alerts: string[];
  recommendations: string[];
}
