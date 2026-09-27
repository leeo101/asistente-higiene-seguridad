export interface ExcavationPermitData {
  id: string;
  companyId?: string;
  permitNumber: string;
  date: string;
  location: string;
  projectOrSite: string;
  depthMeters: number;
  widthMeters: number;
  lengthMeters: number;
  soilType: 'A' | 'B' | 'C';
  slopeRatio: string; // ej. 1:1, 1.5:1
  shoringType: 'none' | 'timber_shoring' | 'trench_box' | 'sheet_piling' | 'hydraulic';
  requiresShoring: boolean; // true si depth > 1.20m y no hay talud adecuado
  
  checklist: {
    soilClassificationVerified: boolean;
    utilitiesLocated: boolean; // Gas, electricidad
    spoilDistance1m: boolean; // Acopio tierra >= 1m
    safeAccessLadders7m: boolean; // Escaleras cada 7.5m
    machineryDistanceSafe: boolean;
    perimeterBarricades: boolean;
    atmosphereTested: boolean;
    waterControlInstalled: boolean; // Bombeo / drenaje
  };

  operatorName: string;
  supervisorName: string;
  competentPersonName: string; // Persona calificada
  competentPersonSignature?: string;
  supervisorSignature?: string;
  operatorSignature?: string;
  status: 'active' | 'completed' | 'suspended';
  notes?: string;
  createdAt: string;
}

export const SOIL_TYPES_INFO = {
  A: {
    name: 'Tipo A - Arcilla muy firme y cohesiva',
    maxSlope: '3/4 : 1 (53°)',
    ratio: 0.75,
    description: 'Resistencia a compresión simple >= 1.5 tsf (144 kPa). Muy estable.',
    shoringThresholdMeters: 1.20
  },
  B: {
    name: 'Tipo B - Limo, arcilla media y grava angular',
    maxSlope: '1 : 1 (45°)',
    ratio: 1.0,
    description: 'Resistencia entre 0.5 y 1.5 tsf. Estabilidad media susceptible a vibración.',
    shoringThresholdMeters: 1.20
  },
  C: {
    name: 'Tipo C - Suelo arenoso, grava o suelo saturado/sumergido',
    maxSlope: '1.5 : 1 (34°)',
    ratio: 1.5,
    description: 'Resistencia < 0.5 tsf. Inestable, propenso a desmoronamiento inmediato.',
    shoringThresholdMeters: 1.20
  }
};
