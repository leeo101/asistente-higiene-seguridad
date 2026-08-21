export interface GHSPictogram {
  code: string; // ej. GHS02
  name: string; // ej. Inflamable
  description: string;
  iconSymbol: string;
}

export const GHS_PICTOGRAMS: Record<string, GHSPictogram> = {
  GHS01: { code: 'GHS01', name: 'Explosivo', description: 'Explosivos inestables o autoreactivos', iconSymbol: '💥' },
  GHS02: { code: 'GHS02', name: 'Inflamable', description: 'Gases, aerosoles, líquidos o sólidos inflamables', iconSymbol: '🔥' },
  GHS03: { code: 'GHS03', name: 'Comburente', description: 'Gases o líquidos comburentes', iconSymbol: '⭕' },
  GHS04: { code: 'GHS04', name: 'Gas a Presión', description: 'Gases comprimidos, licuados o refrigerados', iconSymbol: '🍾' },
  GHS05: { code: 'GHS05', name: 'Corrosivo', description: 'Sustancias corrosivas para la piel o metales', iconSymbol: '🧪' },
  GHS06: { code: 'GHS06', name: 'Toxicidad Aguda', description: 'Venenos o sustancias mortales al ingerir o inhalar', iconSymbol: '☠️' },
  GHS07: { code: 'GHS07', name: 'Nocivo / Irritante', description: 'Irritación cutánea, ocular o toxicidad específica', iconSymbol: '⚠️' },
  GHS08: { code: 'GHS08', name: 'Peligro para la Salud', description: 'Carcinógeno, mutágeno o toxicidad por aspiración', iconSymbol: '🗣️' },
  GHS09: { code: 'GHS09', name: 'Medio Ambiente', description: 'Peligroso para el medio ambiente acuático', iconSymbol: '🐟' }
};

export interface ChemicalItem {
  id: string;
  productName: string;
  casNumber?: string;
  supplier: string;
  signalWord: 'Peligro' | 'Atención' | 'Sin Clasificar';
  pictograms: string[]; // Lista de códigos GHS01..GHS09
  hStatements: string[]; // Frases H (ej. H225)
  pStatements: string[]; // Frases P (ej. P210)
  nfpa704: {
    health: number;      // 0-4
    flammability: number;// 0-4
    instability: number; // 0-4
    special?: string;    // W, OX, SA
  };
}

export function evaluateChemicalRisk(chemical: ChemicalItem): {
  overallRiskLevel: 'Bajo' | 'Moderado' | 'Alto' | 'Extremo';
  recommendedPPE: string[];
  handlingPrecautions: string[];
} {
  const maxNFPA = Math.max(chemical.nfpa704.health, chemical.nfpa704.flammability, chemical.nfpa704.instability);
  let overallRiskLevel: 'Bajo' | 'Moderado' | 'Alto' | 'Extremo' = 'Bajo';

  if (maxNFPA >= 4 || chemical.pictograms.includes('GHS06')) {
    overallRiskLevel = 'Extremo';
  } else if (maxNFPA === 3 || chemical.pictograms.includes('GHS08') || chemical.pictograms.includes('GHS05')) {
    overallRiskLevel = 'Alto';
  } else if (maxNFPA === 2 || chemical.pictograms.includes('GHS02')) {
    overallRiskLevel = 'Moderado';
  }

  const recommendedPPE: string[] = ['Gafas de seguridad con protección lateral'];
  const handlingPrecautions: string[] = ['Manipular en zonas ventiladas'];

  if (chemical.pictograms.includes('GHS05')) {
    recommendedPPE.push('Guantes de nitrilo/butilo resistentes a químicos', 'Traje o delantal impermeable');
    handlingPrecautions.push('Disponer de ducha de emergencia y lavaojos a menos de 10 metros');
  }

  if (chemical.pictograms.includes('GHS02')) {
    handlingPrecautions.push('Mantener alejado del calor, chispas, llamas al descubierto y superficies calientes. No fumar.');
  }

  if (chemical.pictograms.includes('GHS06') || chemical.pictograms.includes('GHS08')) {
    recommendedPPE.push('Respirador con cartuchos para vapores orgánicos/gases ácidos');
  }

  return {
    overallRiskLevel,
    recommendedPPE,
    handlingPrecautions
  };
}
