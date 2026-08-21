/**
  Motor de Protocolos de Higiene y Seguridad según Normativa SRT (Argentina)
  - Res. SRT 900/15: Medición de Puesta a Tierra y Continuidad de Masas
  - Res. SRT 84/12: Medición de Iluminación en Ambiente Laboral (Dec 351/79 Anexo IV)
  - Res. SRT 85/12: Medición de Nivel de Ruido Continuo Equivalente
 */

// ── 1. Res. SRT 900/15 — Puesta a Tierra ───────────────────────────────────
export interface PATMeasurement {
  pointId: string;
  location: string;
  resistanceValueOhms: number;
  maxAllowedOhms?: number; // Por defecto 10 ohms para pat estándar, 2 ohms para pararrayos
  continuityVerified: boolean;
  differentialSwitchTest: boolean; // Prueba de interruptor diferencial (disyuntor 30mA)
}

export interface PATEvaluationResult {
  isCompliant: boolean;
  statusText: 'Conforme' | 'No Conforme (Resistencia Alta)' | 'No Conforme (Falta Continuidad)';
  recommendations: string[];
}

export function evaluatePATMeasurement(measurement: PATMeasurement): PATEvaluationResult {
  const maxAllowed = measurement.maxAllowedOhms || 10;
  const recommendations: string[] = [];

  let isCompliant = true;
  let statusText: PATEvaluationResult['statusText'] = 'Conforme';

  if (measurement.resistanceValueOhms > maxAllowed) {
    isCompliant = false;
    statusText = 'No Conforme (Resistencia Alta)';
    recommendations.push(`La resistencia de puesta a tierra (${measurement.resistanceValueOhms} Ω) supera el límite máximo permisible de ${maxAllowed} Ω (Res. SRT 900/15). Mejorar la jabalina o aplicar mejorador de conductividad de suelo.`);
  }

  if (!measurement.continuityVerified) {
    isCompliant = false;
    statusText = 'No Conforme (Falta Continuidad)';
    recommendations.push('Falta verificar la continuidad del conductor de protección (PE) hasta las masas metálicas. Reparar conexión del cable verde/amarillo.');
  }

  if (!measurement.differentialSwitchTest) {
    recommendations.push('El interruptor diferencial no disparó correctamente durante la prueba de corriente de defecto. Reemplazar disyuntor diferencial de 30mA.');
  }

  return {
    isCompliant,
    statusText,
    recommendations
  };
}

// ── 2. Res. SRT 84/12 — Iluminación (Dec. 351/79 Anexo IV) ─────────────────
export interface LightingRequirement {
  taskCategory: 'Vías de circulación / Pasillos' | 'Depósitos / Tareas Brutas' | 'Oficinas / Tareas Normales' | 'Dibajo / Trabajo Fino' | 'Inspección de Alta Precisión';
  minLuxRequired: number;
}

export const LIGHTING_STANDARDS: Record<LightingRequirement['taskCategory'], number> = {
  'Vías de circulación / Pasillos': 100,
  'Depósitos / Tareas Brutas': 200,
  'Oficinas / Tareas Normales': 300,
  'Dibajo / Trabajo Fino': 500,
  'Inspección de Alta Precisión': 1000
};

export function evaluateLightingMeasurement(
  measuredLuxValues: number[],
  category: LightingRequirement['taskCategory']
) {
  if (measuredLuxValues.length === 0) {
    return { avgLux: 0, minLuxRequired: LIGHTING_STANDARDS[category], isCompliant: false, uniformityRatio: 0 };
  }

  const minLuxRequired = LIGHTING_STANDARDS[category];
  const sum = measuredLuxValues.reduce((a, b) => a + b, 0);
  const avgLux = Math.round(sum / measuredLuxValues.length);
  const minMeasured = Math.min(...measuredLuxValues);
  const uniformityRatio = Number((minMeasured / (avgLux || 1)).toFixed(2));

  const isLuxCompliant = avgLux >= minLuxRequired;
  const isUniformityCompliant = uniformityRatio >= 0.50; // Ratio de uniformidad mínimo según norma

  return {
    avgLux,
    minLuxRequired,
    uniformityRatio,
    isLuxCompliant,
    isUniformityCompliant,
    isCompliant: isLuxCompliant && isUniformityCompliant,
    summaryText: isLuxCompliant
      ? `Iluminación media conforme (${avgLux} lux de ${minLuxRequired} lux requeridos).`
      : `Iluminación insuficiente (${avgLux} lux). Se requieren mínimo ${minLuxRequired} lux según Res. SRT 84/12.`
  };
}

// ── 3. Res. SRT 85/12 — Ruido en Ambiente Laboral ──────────────────────────
export function calculateNoiseDose(samples: Array<{ exposureTimeHours: number; measuredLAeq: number }>): {
  totalDosePercent: number;
  maxAllowedHoursForSingleLAeq: (dB: number) => number;
  isExceeded: boolean;
  recommendations: string;
} {
  // Fórmula de tiempo máximo de exposición en horas para dosis 100% a 85 dBA con tasa de intercambio 3 dBA:
  // T_max = 8 / 2^((L - 85) / 3)
  const maxAllowedHours = (dB: number) => {
    if (dB < 80) return 24;
    return Number((8 / Math.pow(2, (dB - 85) / 3)).toFixed(2));
  };

  let totalDoseFraction = 0;

  samples.forEach(sample => {
    const tMax = maxAllowedHours(sample.measuredLAeq);
    totalDoseFraction += sample.exposureTimeHours / tMax;
  });

  const totalDosePercent = Math.round(totalDoseFraction * 100);
  const isExceeded = totalDosePercent > 100;

  return {
    totalDosePercent,
    maxAllowedHoursForSingleLAeq: maxAllowedHours,
    isExceeded,
    recommendations: isExceeded
      ? `Dosis diaria de ruido EXCEDIDA (${totalDosePercent}% > 100%). Se requiere uso obligatorio de EPP Auditivo (SNR >= 25 dBA) e implementar controles de ingeniería/aislación acústica.`
      : `Dosis diaria de ruido dentro de los límites permisibles (${totalDosePercent}%).`
  };
}
