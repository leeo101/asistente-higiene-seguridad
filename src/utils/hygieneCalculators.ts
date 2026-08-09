// Calculadores de Higiene Industrial y Evaluación de Normativas (Res. SRT 295/03, 30/2023, Dec. 351/79 Anexo IV)

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

  // Atenuación efectiva del EPP (fórmula OSHA/ISO: Effective dBA = Lavg - ((NRR - 7) / 2))
  const nrrDerating = hearingProtectionNrr > 7 ? (hearingProtectionNrr - 7) / 2 : 0;
  const effectiveLevel = Math.max(0, parseFloat((lavg - nrrDerating).toFixed(1)));

  if (lpeak >= 140) {
    return {
      status: 'peak_exceeded',
      effectiveLevel,
      message: `🔴 NIVEL PICO CRÍTICO: ${lpeak} dBC (Límite Máximo Absoluto: 140 dBC).`,
      recommendation: 'Trabajo suspendido de inmediato. Requiere aislamiento acústico estructural y EPP dual obligatorio.'
    };
  }

  if (effectiveLevel >= 85) {
    return {
      status: 'exceeded',
      effectiveLevel,
      message: `🔴 RIESGO ELEVADO: Nivel efectivo de ${effectiveLevel} dB(A) excede el Límite Permisible (85 dB(A) / 8hs).`,
      recommendation: 'Obligatorio el uso de protección auditiva de alto NRR (≥29 dB) o doble protección (Tapones + Orejeras), e ingresar al Programa de Conservación de la Audición (PCA).'
    };
  }

  if (effectiveLevel >= 80) {
    return {
      status: 'warning',
      effectiveLevel,
      message: `⚠️ NIVEL DE ACCIÓN: Nivel efectivo de ${effectiveLevel} dB(A) (Nivel de Acción Preventivo 80-84 dB(A)).`,
      recommendation: 'Se sugiere proveer protección auditiva voluntaria/preventiva y realizar audiometrías tonales periódicas.'
    };
  }

  return {
    status: 'normal',
    effectiveLevel,
    message: `🟢 DENTRO DE NORMA: Nivel efectivo de ${effectiveLevel} dB(A) dentro de parámetros seguros (<80 dB(A)).`,
    recommendation: 'No requiere EPP auditivo obligatorio para este nivel de exposición.'
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
