// Calculadores de Higiene Industrial y Evaluación de Normativas (Res. SRT 295/03, 30/2023, Dec. 351/79 Anexo IV)

export interface HearingProtectorItem {
  id: string;
  brand: string;
  model: string;
  type: 'earplugs' | 'earmuffs' | 'dual';
  nrr: number;
  snr: number;
}

export const COMMERCIAL_HEARING_PROTECTORS: HearingProtectorItem[] = [
  { id: '3m_1110', brand: '3M', model: '1110 / 1100 (Tapón de Espuma)', type: 'earplugs', nrr: 29, snr: 37 },
  { id: '3m_1270', brand: '3M', model: '1270 (Tapón de Silicona Reutilizable)', type: 'earplugs', nrr: 25, snr: 25 },
  { id: '3m_peltor_opt105', brand: '3M Peltor', model: 'Optime 105 (Orejera Copa)', type: 'earmuffs', nrr: 30, snr: 35 },
  { id: '3m_peltor_x4a', brand: '3M Peltor', model: 'X4A (Orejera Alta Atenuación)', type: 'earmuffs', nrr: 27, snr: 33 },
  { id: 'libus_l340', brand: 'Libus', model: 'L-340 (Tapón de Espuma)', type: 'earplugs', nrr: 32, snr: 36 },
  { id: 'libus_l300', brand: 'Libus', model: 'L-300 (Orejera Copa)', type: 'earmuffs', nrr: 26, snr: 29 },
  { id: 'moldex_spark', brand: 'Moldex', model: 'SparkPlugs (Tapón de Espuma)', type: 'earplugs', nrr: 33, snr: 35 },
  { id: 'msa_left_right', brand: 'MSA', model: 'Left/Right High (Orejera)', type: 'earmuffs', nrr: 28, snr: 31 },
  { id: 'dual_standard', brand: 'Genérico', model: 'Protección Dual (Tapón NRR 29 + Orejera NRR 25)', type: 'dual', nrr: 34, snr: 39 }
];

export interface DetailedNoiseAttenuationResult {
  originalLeq: number;
  effectiveLeq: number;
  attenuationDb: number;
  protectionRating: 'sobreproteccion' | 'optima' | 'aceptable' | 'insuficiente';
  noiseDosePercent: number;
  methodUsed: 'nrr_osha' | 'snr_iso';
  isDual: boolean;
  effectiveNrr: number;
  message: string;
  recommendation: string;
}

export function calculateAdvancedNoiseAttenuation(
  leq: number,
  nrr: number = 0,
  snr: number = 0,
  exposureHours: number = 8,
  method: 'nrr_osha' | 'snr_iso' = 'nrr_osha',
  isDual: boolean = false,
  secondaryNrr: number = 0
): DetailedNoiseAttenuationResult {
  if (!leq || leq <= 0) {
    return {
      originalLeq: 0,
      effectiveLeq: 0,
      attenuationDb: 0,
      protectionRating: 'optima',
      noiseDosePercent: 0,
      methodUsed: method,
      isDual,
      effectiveNrr: 0,
      message: 'Ingrese el nivel Leq en dBA para evaluar la atenuación del EPP.',
      recommendation: 'A la espera de datos de medición.'
    };
  }

  // NRR Dual calculation according to OSHA standard: max(NRR1, NRR2) + 5
  let effectiveNrr = nrr;
  if (isDual) {
    const mainNrr = Math.max(nrr, secondaryNrr);
    effectiveNrr = mainNrr + 5;
  }

  let attenuationDb = 0;
  if (method === 'nrr_osha') {
    // OSHA / Res SRT 295/03 formula: Derating = (NRR - 7) / 2
    attenuationDb = effectiveNrr > 7 ? (effectiveNrr - 7) / 2 : 0;
  } else {
    // ISO 4869-2 SNR formula with 3 dB safety derating factor
    attenuationDb = snr > 3 ? (snr - 3) : 0;
  }

  const effectiveLeq = Math.max(0, parseFloat((leq - attenuationDb).toFixed(1)));

  // Calculate Noise Dose Percentage: Dose% = (T / 8) * 10^((Leq_efectivo - 85)/10) * 100
  const doseRatio = (exposureHours / 8) * Math.pow(10, (effectiveLeq - 85) / 10);
  const noiseDosePercent = parseFloat((doseRatio * 100).toFixed(1));

  let protectionRating: 'sobreproteccion' | 'optima' | 'aceptable' | 'insuficiente' = 'optima';
  let message = '';
  let recommendation = '';

  if (effectiveLeq < 70) {
    protectionRating = 'sobreproteccion';
    message = `⚠️ SOBREPROTECCIÓN AUDITIVA: Nivel efectivo en oído = ${effectiveLeq} dB(A).`;
    recommendation = 'La atenuación es excesiva (<70 dBA). Puede dificultar la comunicación verbal y la audición de alarmas de emergencia. Se sugiere un EPP con menor NRR (18-24 dB).';
  } else if (effectiveLeq <= 79.9) {
    protectionRating = 'optima';
    message = `🟢 PROTECCIÓN ÓPTIMA: Nivel efectivo en oído = ${effectiveLeq} dB(A) (Dosis diaria: ${noiseDosePercent}%).`;
    recommendation = 'El EPP auditivo brinda un nivel de confort y protección idóneo (rango ideal 70-79 dBA).';
  } else if (effectiveLeq <= 84.9) {
    protectionRating = 'aceptable';
    message = `🟡 PROTECCIÓN ACEPTABLE / NIVEL DE ACCIÓN: Nivel efectivo en oído = ${effectiveLeq} dB(A).`;
    recommendation = 'Protección adecuada dentro del límite preventivo. Se sugiere mantener inspección periódica de los protectores.';
  } else {
    protectionRating = 'insuficiente';
    message = `🔴 PROTECCIÓN INSUFICIENTE: Nivel efectivo en oído = ${effectiveLeq} dB(A) excede los 85 dB(A).`;
    recommendation = 'El EPP provisto no atenúa lo suficiente el ruido del sector. Se requiere un protector de mayor NRR (≥29 dB) o implementar Doble Protección (Tapón + Orejera).';
  }

  return {
    originalLeq: leq,
    effectiveLeq,
    attenuationDb: parseFloat(attenuationDb.toFixed(1)),
    protectionRating,
    noiseDosePercent,
    methodUsed: method,
    isDual,
    effectiveNrr,
    message,
    recommendation
  };
}

export interface NoiseEvaluationResult {
  status: 'normal' | 'warning' | 'exceeded' | 'peak_exceeded';
  effectiveLevel: number;
  message: string;
  recommendation: string;
}

export function evaluateNoiseExposure(
  lavg: number,
  lpeak: number = 0,
  hearingProtectionNrr: number = 0
): NoiseEvaluationResult {
  if (!lavg || lavg <= 0) {
    return {
      status: 'normal',
      effectiveLevel: 0,
      message: 'Ingrese el nivel dBA Lavg / Lex,8h para evaluar.',
      recommendation: 'Sin mediciones registradas.'
    };
  }

  const adv = calculateAdvancedNoiseAttenuation(lavg, hearingProtectionNrr);
  
  if (lpeak >= 140) {
    return {
      status: 'peak_exceeded',
      effectiveLevel: adv.effectiveLeq,
      message: `🔴 NIVEL PICO CRÍTICO: ${lpeak} dBC (Límite Máximo Absoluto: 140 dBC).`,
      recommendation: 'Trabajo suspendido de inmediato. Requiere aislamiento acústico estructural y EPP dual obligatorio.'
    };
  }

  if (adv.effectiveLeq >= 85) {
    return {
      status: 'exceeded',
      effectiveLevel: adv.effectiveLeq,
      message: adv.message,
      recommendation: adv.recommendation
    };
  }

  if (adv.effectiveLeq >= 80) {
    return {
      status: 'warning',
      effectiveLevel: adv.effectiveLeq,
      message: adv.message,
      recommendation: adv.recommendation
    };
  }

  return {
    status: 'normal',
    effectiveLevel: adv.effectiveLeq,
    message: adv.message,
    recommendation: adv.recommendation
  };
}

export interface LightingEvaluationResult {
  status: 'cumple' | 'insuficiente';
  minRequiredLux: number;
  measuredLux: number;
  deficitLux: number;
  message: string;
  recommendation: string;
}

const VISUAL_TASKS_LIMITS: Record<string, { label: string; minLux: number }> = {
  exteriores: { label: 'Áreas exteriores generales y patios', minLux: 20 },
  circulacion: { label: 'Zonas de circulación, pasillos y escaleras', minLux: 100 },
  simples: { label: 'Tareas visuales simples (Depósitos, vestuarios)', minLux: 200 },
  moderadas: { label: 'Distinción moderada de detalles (Oficinas, lectura general)', minLux: 500 },
  finos: { label: 'Distinción de detalles finos (Dibujo, inspección fina)', minLux: 1000 },
  muy_finos: { label: 'Detalles muy finos (Relojería, electrónica, microcirugía)', minLux: 2000 }
};

export function evaluateLightingLevel(
  taskCategory: string,
  measuredLux: number
): LightingEvaluationResult {
  const task = VISUAL_TASKS_LIMITS[taskCategory] || { label: 'Tarea General', minLux: 300 };
  const minRequiredLux = task.minLux;

  if (measuredLux >= minRequiredLux) {
    return {
      status: 'cumple',
      minRequiredLux,
      measuredLux,
      deficitLux: 0,
      message: `🟢 CUMPLE NORMATIVA (Dec. 351/79 Anexo IV): ${measuredLux} Lux registrado (Mínimo exigido: ${minRequiredLux} Lux).`,
      recommendation: 'Nivel de iluminación adecuado para el tipo de tarea visual.'
    };
  }

  const deficitLux = minRequiredLux - measuredLux;
  return {
    status: 'insuficiente',
    minRequiredLux,
    measuredLux,
    deficitLux,
    message: `🔴 ILUMINACIÓN INSUFICIENTE: ${measuredLux} Lux registrado (Exigido: ${minRequiredLux} Lux). Déficit: ${deficitLux} Lux.`,
    recommendation: `Se requiere incrementar la iluminación en al menos ${deficitLux} Lux. Considerar la instalación de luminarias LED suplementarias o limpieza de artefactos.`
  };
}

export interface ThermalEvaluationResult {
  status: 'normal' | 'alerta' | 'excedido';
  vle: number;
  vla: number;
  workRestRegime: string;
  message: string;
  recommendation: string;
}

export function evaluateThermalStressWBGT(
  workload: 'liviano' | 'moderado' | 'pesado',
  wbgtMeasured: number
): ThermalEvaluationResult {
  if (!wbgtMeasured || wbgtMeasured <= 0) {
    return {
      status: 'normal',
      vle: 0,
      vla: 0,
      workRestRegime: 'Continuo (100% trabajo)',
      message: 'Ingrese la temperatura TGBH / WBGT (°C) para evaluar.',
      recommendation: 'Sin datos de medición.'
    };
  }

  // Res. SRT 30/2023 límites por carga de trabajo
  const limits = {
    liviano: { vle: 29.0, vla: 27.5 },
    moderado: { vle: 26.7, vla: 25.2 },
    pesado: { vle: 25.0, vla: 23.5 }
  }[workload] || { vle: 26.7, vla: 25.2 };

  const { vle, vla } = limits;

  if (wbgtMeasured > vle + 3) {
    return {
      status: 'excedido',
      vle,
      vla,
      workRestRegime: '🚨 TRABAJO SUSPENDIDO / EXTREMO',
      message: `🔴 ESTRÉS TÉRMICO CRÍTICO: TGBH de ${wbgtMeasured}°C supera por más de 3°C el VLE (${vle}°C).`,
      recommendation: 'Suspender tareas de inmediato. Implementar refrigeración forzada, sombra y pausas prolongadas en ambiente climatizado.'
    };
  }

  if (wbgtMeasured > vle) {
    let regime = '50% Trabajo / 50% Descanso cada hora';
    if (wbgtMeasured > vle + 1.5) {
      regime = '25% Trabajo / 75% Descanso cada hora';
    }
    return {
      status: 'excedido',
      vle,
      vla,
      workRestRegime: regime,
      message: `⚠️ SUPERA LÍMITE PERMISIBLE (VLE Res. SRT 30/2023): TGBH de ${wbgtMeasured}°C (Límite VLE: ${vle}°C).`,
      recommendation: `Aplicar régimen de dosificación de esfuerzo: ${regime}. Hidratación constante con agua fresca y sales minerales.`
    };
  }

  if (wbgtMeasured >= vla) {
    return {
      status: 'alerta',
      vle,
      vla,
      workRestRegime: '75% Trabajo / 25% Descanso cada hora',
      message: `🟡 ZONA DE ACCIÓN PREVENTIVA (VLA Res. 30/2023): TGBH de ${wbgtMeasured}°C (VLA: ${vla}°C).`,
      recommendation: 'Régimen sugerido: 75% Trabajo / 25% Descanso. Proveer agua potable fresca a libre disposición a <15m del puesto.'
    };
  }

  return {
    status: 'normal',
    vle,
    vla,
    workRestRegime: 'Continuo (100% Trabajo)',
    message: `🟢 DENTRO DE NORMA: TGBH de ${wbgtMeasured}°C es inferior al Nivel de Acción (${vla}°C).`,
    recommendation: 'Condiciones térmicas seguras para jornada continua.'
  };
}
