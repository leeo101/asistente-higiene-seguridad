export interface ArcFlashPermitData {
  id: string;
  companyId?: string;
  permitNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  panelOrEquipmentTag: string;
  substationOrLocation: string;
  nominalVoltageV: number; // Ej. 380 V, 13200 V
  isLiveWork: boolean; // Trabajo con tensión o proximidad
  
  // Parámetros Arc Flash
  shortCircuitKa: number; // Corriente de cortocircuito (kA)
  clearingTimeSeconds: number; // Tiempo de apertura relé/fusible
  workingDistanceCm: number; // Distancia de trabajo típica (45 - 60 cm)
  calculatedIncidentEnergyCalCm2: number; // cal/cm2
  arcFlashBoundaryMeters: number; // Frontera de arco (m)
  ppeCategory: 1 | 2 | 3 | 4 | 'prohibited';

  // Verificaciones Res. SRT 3068/14
  checklist: {
    justificationLiveWorkDocumented: boolean;
    electricallySafeWorkConditionEvaluated: boolean;
    insulatedTools1000vInspected: boolean;
    dielectricGlovesClassVerified: boolean;
    voltageDetectorCalibrated: boolean;
    arcFlashSuitCertified: boolean;
    rescueHookAvailable: boolean; // Pértiga de salvamento
    trainedPersonnelCertified: boolean;
  };

  gloveClass: '00' | '0' | '1' | '2' | '3' | '4';
  gloveLastTestDate: string;
  leadElectrician: string;
  safetySupervisor: string;
  electricianLicense?: string;
  supervisorLicense?: string;
  plantManager?: string;
  electricianSignature?: string | null;
  supervisorSignature?: string | null;
  plantManagerSignature?: string | null;
  status: 'active' | 'completed' | 'suspended';
  notes?: string;
  createdAt: string;
}

export function calculateArcFlash(voltageV: number, kA: number, clearingSeconds: number, distanceCm: number) {
  // Modelo simplificado estándar IEEE 1584 / NFPA 70E para baja/media tensión
  // E = 4.184 * 10^(k1 + k2 + 1.081 * log10(Ia) + 0.0011 * G) * (t / 0.2) * (610^x / D^x)
  // Aproximación paramétrica robusta:
  const distInches = Math.max(12, distanceCm / 2.54);
  const factor = (voltageV <= 1000) ? 1.0 : 1.25;
  const incidentEnergy = Math.max(0.1, Number((factor * 0.7 * kA * clearingSeconds * Math.pow(18 / distInches, 2)).toFixed(2)));
  
  // Arc Flash Boundary (distancia a 1.2 cal/cm2)
  const boundaryMeters = Number((Math.sqrt(incidentEnergy / 1.2) * (distanceCm / 100)).toFixed(2));

  let category: 1 | 2 | 3 | 4 | 'prohibited' = 1;
  if (incidentEnergy <= 4) category = 1;
  else if (incidentEnergy <= 8) category = 2;
  else if (incidentEnergy <= 25) category = 3;
  else if (incidentEnergy <= 40) category = 4;
  else category = 'prohibited';

  return { incidentEnergy, boundaryMeters, category };
}

export const PPE_CATEGORY_DESCRIPTIONS = {
  1: { minCal: 4, desc: 'Camisa y pantalón ignífugos (AR), careta facial con mentonera y gafas de seguridad.', bg: 'bg-emerald-100 text-emerald-800' },
  2: { minCal: 8, desc: 'Ropa resistente al arco mín. 8 cal/cm², careta arco facial completa con balaclava (pasamontañas ignífugo).', bg: 'bg-blue-100 text-blue-800' },
  3: { minCal: 25, desc: 'Traje completo para arco eléctrico con capucha/escafandra cerrada mín. 25 cal/cm².', bg: 'bg-amber-100 text-amber-800' },
  4: { minCal: 40, desc: 'Traje multicapa pesado para arco mín. 40 cal/cm² con escafandra panorámica y guantes dieléctricos.', bg: 'bg-rose-100 text-rose-800' },
  prohibited: { minCal: 999, desc: '¡PELIGRO EXTREMO! Energía > 40 cal/cm². Prohibido el trabajo con tensión. Se debe desenergizar obligatoriamente.', bg: 'bg-red-600 text-white font-bold' }
};
