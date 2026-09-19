/**
 * Tipos oficiales para el Módulo de Sustancias y Contaminantes Químicos
 * Conforme a la Resolución MTEySS N° 295/03 Anexo IV (Límites de Exposición a Contaminantes Químicos)
 * y Resolución S.R.T. N° 801/15 (Sistema Globalmente Armonizado SGA / GHS)
 * República Argentina
 */

export type GHSWordSignal = 'PELIGRO' | 'ATENCIÓN' | 'SIN CLASIFICAR';

export type CarcinogenicityClassification =
  | 'A1 (Carcinógeno humano confirmado)'
  | 'A2 (Sospechoso en humanos)'
  | 'A3 (Animal confirmado)'
  | 'A4 (No clasificable en humanos)'
  | 'A5 (No sospechoso)'
  | 'No clasificado';

export type ExposureAssessmentResult =
  | 'Conforme (IE < 0.50)'
  | 'Nivel de Acción (0.50 ≤ IE ≤ 1.0)'
  | 'No Conforme / Supera CMP (IE > 1.0)';

export interface NFPA704Diamond {
  health: number; // 0-4 (Azul - Salud)
  flammability: number; // 0-4 (Rojo - Inflamabilidad)
  instability: number; // 0-4 (Amarillo - Inestabilidad)
  special?: 'W' | 'OX' | 'SA' | 'COR' | 'BIO' | 'CRYO' | ''; // Blanco - Riesgo Especial
}

export interface ChemicalSubstanceReference {
  id: string;
  nombreQuimico: string;
  nombreComercial?: string;
  casNumber: string;
  unNumber?: string;
  cmpPpm?: number;
  cmpMgM3?: number;
  cmpCptPpm?: number;
  cmpCptMgM3?: number;
  cmpCPpm?: number;
  cmpCMgM3?: number;
  viaDermica: boolean;
  sensibilizante: boolean;
  carcinogenicidad: CarcinogenicityClassification;
  bei?: string;
  sinonimos?: string[];
}

export interface ChemicalAgentAssessment {
  id?: string;
  // I. Datos del Empleador y Establecimiento (Ley 19.587)
  cuit: string;
  empresa: string;
  direccion?: string;
  localidad?: string;
  art?: string;
  sector: string;
  puesto: string;
  fechaMuestreo: string;
  profesionalNombre?: string;
  profesionalMatricula?: string;

  // II. Identificación de la Sustancia
  name: string; // Nombre de la sustancia / producto
  nombreComercial?: string;
  casNumber?: string;
  unNumber?: string;
  supplier?: string;
  estadoFisico: 'Líquido' | 'Vapor / Gas' | 'Polvo / Partículas' | 'Aerosol / Niebla' | 'Sólido';
  storage?: string;
  location?: string;
  quantity?: string;
  unit?: string;

  // III. Clasificación SGA / GHS (Res. SRT 801/15)
  signalWord: GHSWordSignal;
  pictograms: string[]; // Lista de códigos: explosive, flammable, oxidizing, corrosive, toxic, harmful, irritant, sensitizing, carcinogenic, environmental, pressure
  hazardStatements: string[]; // Frases H (ej. H225, H315)
  precautionaryStatements: string[]; // Frases P (ej. P210, P280)
  nfpa704: NFPA704Diamond;

  // IV. Límites Higiénicos Res. MTEySS 295/03 Anexo IV
  unidadMedicion: 'ppm' | 'mg/m3';
  cmp: number; // Concentración Máxima Permisible (8 hs / 40 hs semanales)
  cmpCpt?: number; // Cortos Períodos de Tiempo (15 min)
  cmpC?: number; // Techo / Ceiling
  viaDermica: boolean; // Notación Dérmica (absorción cutánea)
  sensibilizante: boolean;
  carcinogenicidad: CarcinogenicityClassification;
  bei?: string; // Índice Biológico de Exposición

  // V. Medición y Monitoreo Ambiental
  concentracionMedida: number; // Concentración ambiental hallada en el puesto
  duracionMuestreoMinutos?: number;
  metodoMuestreo?: string;
  instrumento?: string;
  indiceExposicion: number; // IE = concentracionMedida / cmp
  dictamenExposicion: ExposureAssessmentResult;

  // VI. Medidas Preventivas, EPP y Primeros Auxilios
  ppe: {
    gloves: boolean;
    mask: boolean;
    goggles: boolean;
    apron: boolean;
    especificaciones?: string;
  };
  firstAid: {
    inhalation?: string;
    skin?: string;
    eyes?: string;
    ingestion?: string;
  };
  recomendaciones?: string;
  conclusiones?: string;

  // Firmas
  operatorSignature?: string;
  supervisorSignature?: string;
  professionalSignature?: string;
  showSignatures?: {
    operator: boolean;
    supervisor: boolean;
    professional: boolean;
  };
}

export interface ChemicalMixtureComponent {
  nombre: string;
  concentracionMedida: number;
  cmp: number;
  unidad: 'ppm' | 'mg/m3';
  organoBlanco: string;
}

export interface ChemicalMixtureEvaluation {
  componentes: ChemicalMixtureComponent[];
  indiceEfectoAditivo: number; // Em = sum(Ci / CMPi)
  superaLimiteAditivo: boolean;
  dictamen: 'Mezcla Conforme (Em ≤ 1.0)' | 'Mezcla Crítica / Supera Límite Aditivo (Em > 1.0)';
  recomendaciones: string[];
}
