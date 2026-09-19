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

import type { GroundingProtocol } from '../types/grounding';

export interface GroundingAuditSummary {
  totalJabalinas: number;
  jabalinasConformes: number;
  promedioResistenciaOhms: number;
  maxResistenciaMedida: number;
  totalMasas: number;
  masasConformes: number;
  totalDiferenciales: number;
  diferencialesConformes: number;
  isFullyCompliant: boolean;
  autoRecommendations: string[];
  calibracionVencida: boolean;
}

export function evaluateFullGroundingProtocol(p: Partial<GroundingProtocol>): GroundingAuditSummary {
  const recommendations: string[] = [];
  const jabalinas = p.jabalinas || [];
  const masas = p.continuidadMasas || [];
  const diferenciales = p.diferenciales || [];

  let sumRes = 0;
  let maxRes = 0;
  let jabalinasConformes = 0;

  jabalinas.forEach(j => {
    sumRes += j.resistenciaMedida;
    if (j.resistenciaMedida > maxRes) maxRes = j.resistenciaMedida;
    const maxPermitido = j.resistenciaMaximaAdmisible || (p.esquemaConexionTierra === 'TT' ? 40 : 10);
    if (j.resistenciaMedida <= maxPermitido) {
      jabalinasConformes++;
    } else {
      recommendations.push(`Jabalina ${j.codigo} (${j.ubicacion}): Valor de ${j.resistenciaMedida} Ω supera el máximo de ${maxPermitido} Ω. Instalar electrodo auxiliar o aplicar gel activador de suelo.`);
    }

    if (!j.camaraInspeccion) {
      recommendations.push(`Punto ${j.codigo}: Instalar cámara de inspección normalizada para permitir el mantenimiento periódico.`);
    }
    if (!j.borneDesconexion) {
      recommendations.push(`Punto ${j.codigo}: Instalar borne/seccionador tomamuestra para permitir la medición individual sin desconectar la planta.`);
    }
  });

  const promedioResistenciaOhms = jabalinas.length > 0 ? Number((sumRes / jabalinas.length).toFixed(2)) : 0;

  let masasConformes = 0;
  masas.forEach(m => {
    if (m.resistenciaContinuidad <= 1.0) {
      masasConformes++;
    } else {
      recommendations.push(`Continuidad ${m.codigo} (${m.elemento}): Resistencia de ${m.resistenciaContinuidad} Ω supera el límite de 1.0 Ω. Restablecer conductor de equipotencialidad (PE).`);
    }
  });

  let diferencialesConformes = 0;
  diferenciales.forEach(d => {
    const tiempoOk = d.tiempoDisparoMs > 0 && d.tiempoDisparoMs <= 200;
    const testOk = d.pulsadorTestFunciona;
    if (tiempoOk && testOk) {
      diferencialesConformes++;
    } else {
      if (!tiempoOk) recommendations.push(`Disyuntor ${d.codigo} (${d.tableroUbicacion}): Tiempo de disparo (${d.tiempoDisparoMs} ms) supera los 200 ms admisibles según AEA 90364.`);
      if (!testOk) recommendations.push(`Disyuntor ${d.codigo} (${d.tableroUbicacion}): El botón de test no funciona mecánicamente. Reemplazar interruptor diferencial.`);
    }
  });

  // Verificar fecha de calibración del telurímetro (vigencia 12 o 24 meses)
  let calibracionVencida = false;
  if (p.instrumentoFechaCalibracion) {
    const fechaCal = new Date(p.instrumentoFechaCalibracion);
    const ahora = new Date();
    const difMeses = (ahora.getFullYear() - fechaCal.getFullYear()) * 12 + (ahora.getMonth() - fechaCal.getMonth());
    if (difMeses > 24) {
      calibracionVencida = true;
      recommendations.push('El certificado de calibración del telurímetro tiene más de 24 meses. Se requiere calibración en laboratorio trazable a patrones nacionales (INTI/SAC).');
    }
  }

  const isFullyCompliant = 
    (jabalinas.length === 0 || jabalinasConformes === jabalinas.length) &&
    (masas.length === 0 || masasConformes === masas.length) &&
    (diferenciales.length === 0 || diferencialesConformes === diferenciales.length) &&
    !calibracionVencida;

  return {
    totalJabalinas: jabalinas.length,
    jabalinasConformes,
    promedioResistenciaOhms,
    maxResistenciaMedida: maxRes,
    totalMasas: masas.length,
    masasConformes,
    totalDiferenciales: diferenciales.length,
    diferencialesConformes,
    isFullyCompliant,
    autoRecommendations: Array.from(new Set(recommendations)),
    calibracionVencida
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
