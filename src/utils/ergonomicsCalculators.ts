/**
  Calculadoras Ergonométricas Avanzadas (Res. SRT 886/15)
  - Ecuación de NIOSH para Levantamiento Manual de Cargas
  - Evaluación RULA (Rapid Upper Limb Assessment)
  - Evaluación REBA (Rapid Entire Body Assessment)
 */

export interface NIOSHInput {
  loadWeightKg: number;           // Peso de la carga en kg
  horizontalDistanceCm: number;    // Distancia horizontal H (cm)
  verticalDistanceCm: number;      // Distancia vertical V (cm)
  verticalTravelCm: number;        // Desplazamiento D (cm)
  asymmetryAngleDeg: number;       // Ángulo de asimetría A (grados)
  frequencyLiftsPerMin: number;    // Frecuencia (levantamientos/min)
  durationHours: number;           // Duración (1, 2 o 8 hs)
  couplingQuality: 'Buena' | 'Regular' | 'Mala'; // Agarre
}

export interface NIOSHResult {
  rwlKg: number;                   // Límite de Peso Recomendado (Recommended Weight Limit)
  liftingIndex: number;            // Índice de Levantamiento (LI = Peso / RWL)
  riskLevel: 'Bajo (Aceptable)' | 'Moderado (Incrementado)' | 'Alto (Peligroso)';
  multipliers: {
    HM: number; // Factor Distancia Horizontal
    VM: number; // Factor Altura Vertical
    DM: number; // Factor Desplazamiento
    AM: number; // Factor Asimetría
    FM: number; // Factor Frecuencia
    CM: number; // Factor Agarre
  };
  recommendations: string[];
}

/**
  Calcula el Límite de Peso Recomendado (RWL) y el Índice de Levantamiento (LI) de NIOSH
 */
export function calculateNIOSH(input: NIOSHInput): NIOSHResult {
  const LC = 23; // Carga Constante Estándar NIOSH (23 kg)

  // HM = 25 / H
  const H = Math.max(input.horizontalDistanceCm, 25);
  const HM = Number(Math.min(25 / H, 1.0).toFixed(2));

  // VM = 1 - 0.003 * |V - 75|
  const V = input.verticalDistanceCm;
  const VM = Number(Math.max(1 - 0.003 * Math.abs(V - 75), 0).toFixed(2));

  // DM = 0.82 + 4.5 / D
  const D = Math.max(input.verticalTravelCm, 25);
  const DM = Number(Math.min(0.82 + 4.5 / D, 1.0).toFixed(2));

  // AM = 1 - 0.0032 * A
  const A = input.asymmetryAngleDeg;
  const AM = Number(Math.max(1 - 0.0032 * A, 0).toFixed(2));

  // FM (Aproximación por frecuencia)
  let FM = 1.0;
  if (input.frequencyLiftsPerMin >= 10) FM = 0.5;
  else if (input.frequencyLiftsPerMin >= 5) FM = 0.7;
  else if (input.frequencyLiftsPerMin >= 2) FM = 0.85;
  else if (input.frequencyLiftsPerMin >= 0.5) FM = 0.94;

  // CM (Factor de Agarre)
  let CM = 1.0;
  if (input.couplingQuality === 'Regular') CM = 0.95;
  if (input.couplingQuality === 'Mala') CM = 0.90;

  // RWL = LC * HM * VM * DM * AM * FM * CM
  const rwlKg = Number((LC * HM * VM * DM * AM * FM * CM).toFixed(2));
  const liftingIndex = Number((input.loadWeightKg / (rwlKg || 1)).toFixed(2));

  let riskLevel: NIOSHResult['riskLevel'] = 'Bajo (Aceptable)';
  const recommendations: string[] = [];

  if (liftingIndex > 3.0) {
    riskLevel = 'Alto (Peligroso)';
    recommendations.push('El Índice de Levantamiento supera 3.0. Riesgo crítico de lesión lumbar. Se requiere asistencia mecánica inmediata (elevador, montacargas).');
  } else if (liftingIndex > 1.0) {
    riskLevel = 'Moderado (Incrementado)';
    recommendations.push('El Índice de Levantamiento supera 1.0. Reducir la distancia horizontal, fraccionar la carga o utilizar levantamiento en equipo.');
  } else {
    recommendations.push('Condiciones de levantamiento dentro de límites biomecánicos seguros.');
  }

  return {
    rwlKg,
    liftingIndex,
    riskLevel,
    multipliers: { HM, VM, DM, AM, FM, CM },
    recommendations
  };
}
