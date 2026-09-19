/**
  Motor de Protocolos de Higiene y Seguridad según Normativa SRT y MTEySS (Argentina)
  - Res. SRT 900/15: Medición de Puesta a Tierra y Continuidad de Masas
  - Res. SRT 84/12: Medición de Iluminación en Ambiente Laboral (Dec 351/79 Anexo IV)
  - Res. SRT 85/12: Medición de Nivel de Ruido Continuo Equivalente
  - Res. MTEySS 295/03 Anexo II & Res. SRT 30/2023: Estrés Térmico (TGBH) y Estrés por Frío
 */
import type {
  ThermalAssessmentProtocol,
  ThermalEvaluationMetrics,
  ThermalClothingOption,
  ColdStressData,
  WorkRestCycle,
  MetabolicWorkload
} from '../types/thermal';
import type {
  FireLoadAssessmentProtocol,
  FireLoadEvaluationMetrics,
  FireMaterialItem,
  FireRiskLevel,
  FireVentilationType,
  FireExtinctionCondition
} from '../types/fireload';
import type {
  ErgonomicsAssessmentProtocol,
  ErgonomicsRiskFactorKey,
  ErgonomicsRiskLevel,
  Planilla1Item,
  Planilla2NioshData,
  Planilla3ActionMeasure
} from '../types/ergonomics';
import type {
  ChemicalAgentAssessment,
  ChemicalMixtureComponent,
  ChemicalMixtureEvaluation,
  ChemicalSubstanceReference
} from '../types/chemical';
import type {
  AtmosphericGasReading,
  AtmosphericEvaluationResult,
  AtmosphericStatus,
  ConfinedSpaceIsolationLoto,
  ConfinedSpaceVentilation,
  ConfinedSpaceRescueEquipment,
  ConfinedSpacePermitProtocol
} from '../types/confinedSpace';
import type {
  FallClearanceParams,
  FallClearanceResult,
  HarnessPreUseCheck,
  WeatherConditions,
  WorkingAtHeightPermitProtocol,
  AnchorCertificationType
} from '../types/workingAtHeight';
import type {
  LotoProcedureProtocol,
  FiveGoldenRulesElectrical,
  ZeroEnergyVerification,
  IsolationPoint
} from '../types/loto';
import type {
  RGRLSurvey,
  RGRLItem,
  RGRLAnnexType
} from '../types/rgrl';
import type {
  RARSurvey,
  RarEvaluationResult,
  WorkerExposure
} from '../types/rar';
import {
  SRT_RISK_AGENTS_CATALOG,
  getAgentByCode,
  calculateRARStats,
  validateCuilFormat,
  getRecommendedMedicalExams
} from './rarCatalog';
import type {
  MedicalRecord,
  MedicalEvaluationResult,
  MedicalExamType,
  MedicalFitnessVerdict
} from '../types/medical';
import type {
  AccidentSeverity,
  AccidentType,
  ControlHierarchy,
  CauseNodeType,
  CauseTreeNode,
  CorrectiveActionCAPA,
  SiniestralityIndicators,
  AccidentInvestigationProtocol,
  AccidentEvaluationResult
} from '../types/accident';

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

export const OFFICIAL_GROUNDING_REGULATORY_CRITERIA = {
  normasPrincipales: [
    'Resolución S.R.T. N° 900/2015 (Superintendencia de Riesgos del Trabajo)',
    'Reglamentación para la Ejecución de Instalaciones Eléctricas en Inmuebles AEA 90364',
    'Decreto N° 351/79 Anexo VI Capítulo 14 (Instalaciones Eléctricas)',
    'Norma IRAM 2184 / IEC 62305 (Protección contra descargas atmosféricas - Pararrayos)'
  ],
  esquemasPuestaTierra: {
    TT: {
      descripcion: 'Neutro a tierra en transformador y masas a tierra independiente en usuario con interruptor diferencial.',
      maxResistenciaSinDiferencial: 10,
      maxResistenciaConDiferencial: 40,
      tensionSeguridadSeco: 50,
      tensionSeguridadHumedo: 24
    },
    'TN-S': {
      descripcion: 'Conductor neutro (N) y de protección (PE) separados en toda la instalación.',
      maxResistenciaBucle: 10
    },
    'TN-C': {
      descripcion: 'Conductor neutro y protección combinados (PEN). No admitido en locales de pública concurrencia.',
      maxResistenciaBucle: 10
    },
    IT: {
      descripcion: 'Neutro aislado o impedante. Masas a tierra. Obligatorio primer defecto no corte (quirófanos, minas).',
      maxResistencia: 10
    }
  },
  limiteContinuidadMasasOhms: 1.0,
  pararrayosMaxResistenciaOhms: 10.0,
  diferencialMaxTiempoDisparoMs: 200,
  vigenciaProtocoloMeses: 12,
  vigenciaCalibracionMeses: 24
};

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
  tensionContactoPresuntaMaxVolts: number;
  tensionContactoExcedida: boolean;
  dictamenGeneral: 'CONFORME' | 'NO CONFORME' | 'OBSERVADO CON PLAZO DE ADECUACIÓN';
  estadoInstalacion: 'Excelente' | 'Aceptable' | 'Peligro Eléctrico Potencial' | 'Peligro Eléctrico Inminente';
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
    if (j.estadoFisico === 'Malo' || j.estadoFisico === 'Inaccesible') {
      recommendations.push(`Punto ${j.codigo}: El estado físico del electrodo es "${j.estadoFisico}". Realizar adecuación electromecánica inmediata.`);
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
  let tieneFallaGraveDiferencial = false;
  diferenciales.forEach(d => {
    const tiempoOk = d.tiempoDisparoMs > 0 && d.tiempoDisparoMs <= 200;
    const testOk = d.pulsadorTestFunciona;
    if (tiempoOk && testOk) {
      diferencialesConformes++;
    } else {
      if (!tiempoOk) {
        recommendations.push(`Disyuntor ${d.codigo} (${d.tableroUbicacion}): Tiempo de disparo (${d.tiempoDisparoMs} ms) supera los 200 ms admisibles según AEA 90364.`);
        if (d.tiempoDisparoMs > 300 || d.tiempoDisparoMs <= 0) tieneFallaGraveDiferencial = true;
      }
      if (!testOk) {
        recommendations.push(`Disyuntor ${d.codigo} (${d.tableroUbicacion}): El botón de test no funciona mecánicamente. Reemplazar interruptor diferencial.`);
        tieneFallaGraveDiferencial = true;
      }
    }
  });

  // Cálculo de tensión presunta de contacto indirecto Uc = R_pat * I_delta_n
  const maxIdA = diferenciales.length > 0
    ? Math.max(...diferenciales.map(d => (d.corrienteSensibilidadMa || 30) / 1000))
    : 0.03; // 30 mA estándar
  const tensionContactoPresuntaMaxVolts = Number((maxRes * maxIdA).toFixed(1));

  // Tensión de seguridad límite según AEA 90364-4-41 (24V locales húmedos/mojados u obras, 50V locales secos)
  const tensionLimite = p.tensionSeguridadContacto || (p.tipoInstalacion === 'Obra en Construcción (Dec. 911/96)' ? 24 : 50);
  const tensionContactoExcedida = tensionContactoPresuntaMaxVolts > tensionLimite;

  if (tensionContactoExcedida) {
    recommendations.push(
      `⚠️ La tensión presunta de contacto Uc = ${tensionContactoPresuntaMaxVolts} V (R_pat ${maxRes} Ω × IΔn ${maxIdA} A) supera el límite de seguridad de ${tensionLimite} V (AEA 90364-4-41). Riesgo de choque eléctrico peligroso por contacto indirecto.`
    );
  }

  // Verificar fecha de calibración del telurímetro (vigencia 24 meses - Res. SRT 900/15 Anexo I)
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
    !calibracionVencida &&
    !tensionContactoExcedida;

  // Dictamen y estado de riesgo eléctrico
  let dictamenGeneral: GroundingAuditSummary['dictamenGeneral'] = 'CONFORME';
  let estadoInstalacion: GroundingAuditSummary['estadoInstalacion'] = 'Excelente';

  if (!isFullyCompliant) {
    if (tieneFallaGraveDiferencial || maxRes > 100 || tensionContactoExcedida || masasConformes < masas.length / 2) {
      dictamenGeneral = 'NO CONFORME';
      estadoInstalacion = 'Peligro Eléctrico Inminente';
    } else {
      dictamenGeneral = 'OBSERVADO CON PLAZO DE ADECUACIÓN';
      estadoInstalacion = 'Peligro Eléctrico Potencial';
    }
  }

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
    calibracionVencida,
    tensionContactoPresuntaMaxVolts,
    tensionContactoExcedida,
    dictamenGeneral,
    estadoInstalacion
  };
}

// ── 2. Res. SRT 84/12 — Iluminación (Dec. 351/79 Anexo IV) ─────────────────
import type { LightingPointMeasurement, LightingProtocolSRT84, LightingAuditMetrics } from '../types/lighting';

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

export const OFFICIAL_SRT_VISUAL_TASKS = [
  { id: 'circulacion', label: 'Vías de circulación, pasillos y escaleras', minLux: 100, norma: 'Dec. 351/79 Anexo IV' },
  { id: 'depositos', label: 'Depósitos, almacenes, zonas de carga y vestuarios', minLux: 200, norma: 'Dec. 351/79 Anexo IV' },
  { id: 'maquinaria_gruesa', label: 'Trabajos con maquinaria pesada y soldadura bruta', minLux: 200, norma: 'Dec. 351/79 Anexo IV' },
  { id: 'oficinas_gral', label: 'Oficinas, tareas administrativas, lectura y computación', minLux: 500, norma: 'Dec. 351/79 Anexo IV' },
  { id: 'mecanizado_medio', label: 'Mecanizado en tornos, fresadoras y bancos de ajuste', minLux: 500, norma: 'Dec. 351/79 Anexo IV' },
  { id: 'laboratorios', label: 'Laboratorios de control de calidad y ensayos', minLux: 500, norma: 'Dec. 351/79 Anexo IV' },
  { id: 'dibujo_tecnico', label: 'Dibujo técnico, diseño e inspección de piezas finas', minLux: 1000, norma: 'Dec. 351/79 Anexo IV' },
  { id: 'electronica_relojeria', label: 'Montaje electrónico fino, microcirugía y relojería', minLux: 2000, norma: 'Dec. 351/79 Anexo IV' }
];

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

export function evaluateFullLightingProtocolSRT84(
  puntos: LightingPointMeasurement[],
  instrumentoFechaCalibracion?: string
): LightingAuditMetrics {
  const total = puntos.length;
  if (total === 0) {
    return {
      totalPuntos: 0,
      puntosConformes: 0,
      puntosDeficientes: 0,
      porcentajeConformidad: 0,
      iluminanciaMedia: 0,
      iluminanciaMinima: 0,
      iluminanciaMaxima: 0,
      factorUniformidad: 0,
      uniformidadConforme: false,
      calibracionVencida: false,
      dictamenGeneral: 'DEFICIENTE'
    };
  }

  const luxValues = puntos.map(p => Number(p.luxMedido) || 0);
  const eMin = Math.min(...luxValues);
  const eMax = Math.max(...luxValues);
  const sum = luxValues.reduce((a, b) => a + b, 0);
  const eMed = Math.round(sum / total);
  const factorUniformidad = eMed > 0 ? Number((eMin / eMed).toFixed(2)) : 0;
  const uniformidadConforme = factorUniformidad >= 0.50;

  let conformes = 0;
  puntos.forEach(p => {
    if (p.luxMedido >= p.luxRequeridoNorma) conformes++;
  });
  const deficientes = total - conformes;
  const porcentaje = Math.round((conformes / total) * 100);

  // Calibración de luxómetro (vigencia 24 meses según INTI / Res. 84/12)
  let calibracionVencida = false;
  if (instrumentoFechaCalibracion) {
    const fCal = new Date(instrumentoFechaCalibracion);
    const ahora = new Date();
    const difMeses = (ahora.getFullYear() - fCal.getFullYear()) * 12 + (ahora.getMonth() - fCal.getMonth());
    if (difMeses > 24) calibracionVencida = true;
  }

  let dictamen: LightingAuditMetrics['dictamenGeneral'] = 'CONFORME';
  if (deficientes > 0) {
    dictamen = 'DEFICIENTE';
  } else if (!uniformidadConforme) {
    dictamen = 'OBSERVADO (UNIFORMIDAD)';
  }

  return {
    totalPuntos: total,
    puntosConformes: conformes,
    puntosDeficientes: deficientes,
    porcentajeConformidad: porcentaje,
    iluminanciaMedia: eMed,
    iluminanciaMinima: eMin,
    iluminanciaMaxima: eMax,
    factorUniformidad,
    uniformidadConforme,
    calibracionVencida,
    dictamenGeneral: dictamen
  };
}

// ── 3. Res. SRT 85/12 — Ruido en Ambiente Laboral ──────────────────────────
import type { NoiseInstrumentData, NoiseLevelsData, NoiseHearingProtectionData, NoiseEvaluationMetrics } from '../types/noise';

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

export function evaluateFullNoiseProtocolSRT85(data: {
  laeq: number;
  duracionJornadaHoras?: number;
  duracionMedicionHoras?: number;
  ruidoFondoDb?: number;
  instrument?: {
    fechaCalibracionLaboratorio?: string;
    verificacionInicialDb?: number;
    verificacionFinalDb?: number;
  };
  hearingProtection?: {
    usaEPP?: boolean;
    nrr_snr?: number;
    factorDesclasificacion?: number;
  };
}): NoiseEvaluationMetrics {
  const laeq = Number(data.laeq) || 0;
  const jornadaHs = Number(data.duracionJornadaHoras) || 8;
  const fondoDb = data.ruidoFondoDb !== undefined && data.ruidoFondoDb !== null && !isNaN(Number(data.ruidoFondoDb)) && Number(data.ruidoFondoDb) > 0
    ? Number(data.ruidoFondoDb)
    : undefined;

  // 1. Corrección por ruido de fondo (Res. SRT 85/12)
  let ruidoFondoInvalido = false;
  let correccionFondoDb = 0;
  let nivelCorregidoLaeq = laeq;

  if (fondoDb !== undefined) {
    const delta = laeq - fondoDb;
    if (delta < 3) {
      ruidoFondoInvalido = true;
    } else if (delta <= 10) {
      // Corrección logarítmica: L_corr = 10 * log10(10^(L/10) - 10^(Fondo/10))
      const pTotal = Math.pow(10, laeq / 10);
      const pFondo = Math.pow(10, fondoDb / 10);
      const pFuente = Math.max(0.1, pTotal - pFondo);
      nivelCorregidoLaeq = Number((10 * Math.log10(pFuente)).toFixed(1));
      correccionFondoDb = Number((laeq - nivelCorregidoLaeq).toFixed(1));
    }
  }

  // 2. Verificación in-situ del instrumental (deriva <= 0.5 dB)
  let derivaCalibracionInSituExcedida = false;
  const vi = Number(data.instrument?.verificacionInicialDb);
  const vf = Number(data.instrument?.verificacionFinalDb);
  if (!isNaN(vi) && !isNaN(vf) && vi > 0 && vf > 0) {
    const drift = Math.abs(vf - vi);
    if (drift > 0.5) {
      derivaCalibracionInSituExcedida = true;
    }
  }

  // 3. Calibración periódica en laboratorio (máx 24 meses)
  let calibracionLaboratorioVencida = false;
  if (data.instrument?.fechaCalibracionLaboratorio) {
    const fCal = new Date(data.instrument.fechaCalibracionLaboratorio);
    const ahora = new Date();
    const difMeses = (ahora.getFullYear() - fCal.getFullYear()) * 12 + (ahora.getMonth() - fCal.getMonth());
    if (difMeses > 24) {
      calibracionLaboratorioVencida = true;
    }
  }

  // 4. Tiempo máximo permitido T y Dosis según Res. 295/03 (tasa de intercambio 3 dB)
  const calcTMax = (l: number) => {
    if (l < 80) return 24;
    return Number((8 / Math.pow(2, (l - 85) / 3)).toFixed(2));
  };
  const tiempoPermitidoHoras = calcTMax(nivelCorregidoLaeq);
  const dosisDiariaPercent = Math.round((jornadaHs / (tiempoPermitidoHoras || 1)) * 100);

  // 5. Nivel Diario Equivalente LEX, 8h = LAeq + 10 * log10(T / 8)
  const lex8h = Number((nivelCorregidoLaeq + 10 * Math.log10(jornadaHs / 8)).toFixed(1));

  const limiteExcedido = lex8h > 85 || dosisDiariaPercent > 100;
  const nivelAccionAlcanzado = lex8h >= 80;

  // 6. Evaluación de EPP Auditivo
  let eppAtenuacionAdecuada = false;
  if (data.hearingProtection?.usaEPP && data.hearingProtection?.nrr_snr) {
    const nrr = Number(data.hearingProtection.nrr_snr);
    const desclas = data.hearingProtection.factorDesclasificacion ?? 0.70;
    const atenuacionEfectiva = Math.max(0, (nrr - 7) * desclas);
    const nivelAlOido = nivelCorregidoLaeq - atenuacionEfectiva;
    eppAtenuacionAdecuada = nivelAlOido <= 80;
  } else if (!limiteExcedido) {
    eppAtenuacionAdecuada = true;
  }

  // 7. Dictamen General y Recomendaciones
  let dictamenGeneral: NoiseEvaluationMetrics['dictamenGeneral'] = 'CONFORME';
  const recomendaciones: string[] = [];

  if (ruidoFondoInvalido) {
    dictamenGeneral = 'MEDICIÓN INVÁLIDA (FONDO/CALIBRACIÓN)';
    recomendaciones.push('La diferencia entre el nivel de ruido total y el ruido de fondo es menor a 3 dB(A). La medición es INVÁLIDA según Res. SRT 85/12. Se debe medir en condiciones con menor ruido ambiental.');
  } else if (derivaCalibracionInSituExcedida) {
    dictamenGeneral = 'MEDICIÓN INVÁLIDA (FONDO/CALIBRACIÓN)';
    recomendaciones.push('La deriva de calibración in situ antes y después de la medición superó los 0.5 dB permitidos por la Res. SRT 85/12. Se debe descartar la muestra y calibrar el instrumental.');
  } else if (limiteExcedido) {
    dictamenGeneral = 'SUPERA LMPE (>85 dBA)';
    recomendaciones.push(`Nivel sonoro diario equivalente (${lex8h} dBA) o dosis (${dosisDiariaPercent}%) SUPERAN el Límite Máximo Permisible de 85 dBA (Dec. 351/79 y Res. 295/03).`);
    recomendaciones.push('Uso OBLIGATORIO de protección auditiva certificada bajo norma IRAM 4060.');
    recomendaciones.push('Implementar plan de ingeniería y control de fuente (encerramientos acústicos, amortiguadores, mantenimiento predictivo).');
    recomendaciones.push('Ingresar a los trabajadores expuestos en el Programa de Vigilancia Médica de la Salud Auditiva (Audiometrías tonales anuales).');
  } else if (nivelAccionAlcanzado) {
    dictamenGeneral = 'ALERTA (80-85 dBA)';
    recomendaciones.push(`El nivel (${lex8h} dBA) alcanza el Nivel de Acción (80 dBA). Se recomienda proveer protectores auditivos opcionales y monitorear periódicamente.`);
  } else {
    dictamenGeneral = 'CONFORME';
    recomendaciones.push('Niveles acústicos dentro de los límites legales permitidos para la jornada laboral evaluada.');
  }

  if (calibracionLaboratorioVencida) {
    recomendaciones.push('⚠️ El certificado de calibración en laboratorio del sonómetro/dosímetro tiene más de 24 meses. Se requiere calibración periódica con patrones trazables a INTI/SAC (Res. SRT 85/12).');
  }

  return {
    tiempoPermitidoHoras,
    dosisDiariaPercent,
    lex8h,
    limiteExcedido,
    nivelAccionAlcanzado,
    calibracionLaboratorioVencida,
    derivaCalibracionInSituExcedida,
    ruidoFondoInvalido,
    correccionFondoDb,
    nivelCorregidoLaeq,
    eppAtenuacionAdecuada,
    dictamenGeneral,
    recomendacionesAutomaticas: recomendaciones
  };
}

// ── 4. Res. MTEySS 295/03 Anexo II & Res. SRT 30/2023 — Carga Térmica y Estrés por Frío ─────

export const CLOTHING_CAV_OPTIONS: ThermalClothingOption[] = [
  { id: 'standard', label: 'Ropa de Trabajo Estándar (Algodón liviano)', cav: 0.0, description: 'Pantalón y camisa de algodón o tela ligera de verano' },
  { id: 'coverall', label: 'Mameluco / Overol de Algodón Pesado', cav: 1.5, description: 'Overol de trabajo entero de tela pesada' },
  { id: 'double_layer', label: 'Doble Capa de Ropa de Trabajo', cav: 3.0, description: 'Ropa interior térmica o dos capas superpuestas de tela' },
  { id: 'tyvek', label: 'Traje de Polietileno Impermeable (Tyvek / SMS)', cav: 3.0, description: 'Mono descartable para partículas/líquidos sin ventilación' },
  { id: 'barrier', label: 'Traje de Barrera Química / Estanco / PVC', cav: 10.0, description: 'Protección encapsulada o impermeable a vapor' }
];

export const VLE_THERMAL_ACCLIMATIZED: Record<WorkRestCycle, Record<MetabolicWorkload, number>> = {
  'continuo': { 'liviano': 29.0, 'moderado': 26.7, 'pesado': 25.0, 'muy_pesado': 23.5 },
  '75_25':    { 'liviano': 30.6, 'moderado': 27.5, 'pesado': 25.9, 'muy_pesado': 24.5 },
  '50_50':    { 'liviano': 31.4, 'moderado': 29.4, 'pesado': 27.9, 'muy_pesado': 26.5 },
  '25_75':    { 'liviano': 32.2, 'moderado': 31.1, 'pesado': 30.0, 'muy_pesado': 28.5 }
};

export const ACCLIMATIZATION_PENALTY_C = 2.0; // Descuento de 2.0°C en VLE para personal no aclimatado
export const VLA_OFFSET_C = 1.5; // VLA = VLE - 1.5°C

/**
 * Evalúa el protocolo completo de Carga Térmica por TGBH (Res. 295/03 y Res. SRT 30/2023)
 */
export function evaluateFullThermalStressProtocol(
  protocol: Partial<ThermalAssessmentProtocol>
): ThermalEvaluationMetrics {
  const amb = protocol.ambiental || { tbh: 0, tg: 0, cargaSolar: false };
  const worker = protocol.trabajador || {
    puesto: '', sector: '', tarea: '',
    ritmo: 'moderado' as MetabolicWorkload,
    ciclo: 'continuo' as WorkRestCycle,
    indumentariaId: 'standard',
    cav: 0,
    aclimatado: true,
    aptaMedica: true
  };
  const inst = protocol.instrumento;

  // 1. Cálculo de TGBH Medido
  let tgbhRaw = 0;
  if (amb.cargaSolar && amb.tbs !== undefined && !isNaN(Number(amb.tbs))) {
    // Al aire libre con carga solar directa: 0.7 Tbh + 0.2 Tg + 0.1 Tbs
    tgbhRaw = 0.7 * Number(amb.tbh) + 0.2 * Number(amb.tg) + 0.1 * Number(amb.tbs);
  } else {
    // Interior o al aire libre sin carga solar directa: 0.7 Tbh + 0.3 Tg
    tgbhRaw = 0.7 * Number(amb.tbh) + 0.3 * Number(amb.tg);
  }
  const tgbhMedido = Number(tgbhRaw.toFixed(1));

  // 2. Corrección de Indumentaria (CAV)
  let cav = worker.cav ?? 0;
  if (worker.indumentariaId) {
    const foundClothing = CLOTHING_CAV_OPTIONS.find(c => c.id === worker.indumentariaId);
    if (foundClothing) cav = foundClothing.cav;
  }
  const tgbhEfectivo = Number((tgbhMedido + cav).toFixed(1));

  // 3. Determinación de VLE y VLA según aclimatación
  const ciclo = worker.ciclo || 'continuo';
  const ritmo = worker.ritmo || 'moderado';
  const baseVle = VLE_THERMAL_ACCLIMATIZED[ciclo]?.[ritmo] ?? 26.7;
  const vlePermisible = worker.aclimatado
    ? baseVle
    : Number((baseVle - ACCLIMATIZATION_PENALTY_C).toFixed(1));
  const vlaAccion = Number((vlePermisible - VLA_OFFSET_C).toFixed(1));

  // 4. Comparación y Dictamen
  const diferenciaConVle = Number((tgbhEfectivo - vlePermisible).toFixed(1));
  const limiteExcedido = tgbhEfectivo > vlePermisible;
  const nivelAccionAlcanzado = tgbhEfectivo >= vlaAccion && !limiteExcedido;

  // Criterio de suspensión / trabajo crítico (supera por >3°C o supera el límite de 25_75)
  const maxAllowableRegimenVle = (VLE_THERMAL_ACCLIMATIZED['25_75']?.[ritmo] ?? 30.0) - (!worker.aclimatado ? ACCLIMATIZATION_PENALTY_C : 0);
  const trabajoCriticoSuspendido = tgbhEfectivo > maxAllowableRegimenVle || tgbhEfectivo > vlePermisible + 3.0;

  // 5. Régimen Sugerido
  let regimenRecomendado = 'Continuo (100% Trabajo)';
  const vleCont = (VLE_THERMAL_ACCLIMATIZED['continuo']?.[ritmo] ?? 26.7) - (!worker.aclimatado ? ACCLIMATIZATION_PENALTY_C : 0);
  const vle75 = (VLE_THERMAL_ACCLIMATIZED['75_25']?.[ritmo] ?? 27.5) - (!worker.aclimatado ? ACCLIMATIZATION_PENALTY_C : 0);
  const vle50 = (VLE_THERMAL_ACCLIMATIZED['50_50']?.[ritmo] ?? 29.4) - (!worker.aclimatado ? ACCLIMATIZATION_PENALTY_C : 0);
  const vle25 = (VLE_THERMAL_ACCLIMATIZED['25_75']?.[ritmo] ?? 31.1) - (!worker.aclimatado ? ACCLIMATIZATION_PENALTY_C : 0);

  if (tgbhEfectivo <= vleCont) {
    regimenRecomendado = 'Continuo (100% Trabajo)';
  } else if (tgbhEfectivo <= vle75) {
    regimenRecomendado = '75% Trabajo / 25% Descanso cada hora (45 min trabajo x 15 min pausa)';
  } else if (tgbhEfectivo <= vle50) {
    regimenRecomendado = '50% Trabajo / 50% Descanso cada hora (30 min trabajo x 30 min pausa)';
  } else if (tgbhEfectivo <= vle25) {
    regimenRecomendado = '25% Trabajo / 75% Descanso cada hora (15 min trabajo x 45 min pausa)';
  } else {
    regimenRecomendado = '🚨 TRABAJO PROHIBIDO / SUSPENDIDO (Supera tolerancia fisiológica admisible)';
  }

  // 6. Hidratación
  let tasaHidratacionMlPorHora = 500;
  if (trabajoCriticoSuspendido) tasaHidratacionMlPorHora = 1200;
  else if (limiteExcedido) tasaHidratacionMlPorHora = 1000;
  else if (nivelAccionAlcanzado) tasaHidratacionMlPorHora = 750;

  // 7. Calibración del Instrumental
  let calibracionLaboratorioVencida = false;
  if (inst?.fechaCalibracionLaboratorio) {
    const fechaCal = new Date(inst.fechaCalibracionLaboratorio);
    const ahora = new Date();
    const meses = (ahora.getFullYear() - fechaCal.getFullYear()) * 12 + (ahora.getMonth() - fechaCal.getMonth());
    if (meses > 24) calibracionLaboratorioVencida = true;
  }

  // 8. Dictamen General
  let dictamenGeneral: ThermalEvaluationMetrics['dictamenGeneral'] = 'CONFORME';
  if (trabajoCriticoSuspendido) {
    dictamenGeneral = 'CRÍTICO / TRABAJO SUSPENDIDO';
  } else if (limiteExcedido) {
    dictamenGeneral = 'SUPERA LMPE (VLE)';
  } else if (nivelAccionAlcanzado) {
    dictamenGeneral = 'ZONA DE ACCIÓN (VLA)';
  } else {
    dictamenGeneral = 'CONFORME';
  }

  // 9. Recomendaciones Técnicas
  const recomendaciones: string[] = [];
  if (trabajoCriticoSuspendido) {
    recomendaciones.push('🛑 DETENCIÓN INMEDIATA DE TAREAS: El TGBH efectivo supera los límites admisibles absolutos de la Res. SRT 30/2023.');
    recomendaciones.push('Trasladar al personal inmediatamente a un área climatizada o sombreada con ventilación forzada (< 25°C).');
    recomendaciones.push('Suspender actividades físicas hasta que disminuya la carga térmica ambiental.');
  } else if (limiteExcedido) {
    recomendaciones.push(`⚠️ SUPERA VALOR LÍMITE DE EXPOSICIÓN (VLE = ${vlePermisible}°C): Se requiere aplicar régimen de rotación trabajo/descanso: ${regimenRecomendado}.`);
    recomendaciones.push('Habilitar áreas de descanso sombreadas o climatizadas con provisión continua de agua fresca potable (10°C a 15°C).');
    recomendaciones.push('Establecer control médico de pulso cardíaco y síntomas tempranos de golpe de calor.');
  } else if (nivelAccionAlcanzado) {
    recomendaciones.push(`🟡 ZONA DE ACCIÓN PREVENTIVA (VLA = ${vlaAccion}°C alcanzado): Iniciar protocolo de hidratación programada (${tasaHidratacionMlPorHora} ml/h) y descansos cortos.`);
    recomendaciones.push('Monitorear periódicamente las condiciones ambientales y la aclimatación de los operadores.');
  } else {
    recomendaciones.push(`🟢 CONDICIÓN ADMISIBLE: El TGBH efectivo (${tgbhEfectivo}°C) se encuentra dentro de los límites permisibles para jornada laboral continua.`);
    recomendaciones.push(`Mantener hidratación preventiva continua (${tasaHidratacionMlPorHora} ml/h).`);
  }

  if (!worker.aptaMedica) {
    recomendaciones.push('📋 OBLIGATORIO: El trabajador debe contar con apto médico ocupacional específico previo para tareas con sobrecarga térmica (Res. SRT 30/2023).');
  }

  if (!worker.aclimatado) {
    recomendaciones.push('⚠️ ACLIMATACIÓN REQUERIDA: El trabajador no está aclimatado. Aplicar régimen progresivo de 5 a 14 días (Día 1: 20% exposición, incrementando 20% diario).');
  }

  if (cav > 0) {
    recomendaciones.push(`👕 INDUMENTARIA: Se adicionó un ajuste de +${cav}°C (CAV) al TGBH debido al aislamiento del tipo de ropa seleccionada.`);
  }

  if (calibracionLaboratorioVencida) {
    recomendaciones.push('⚠️ CALIBRACIÓN: El certificado de calibración en laboratorio del equipo TGBH tiene más de 24 meses de antigüedad. Se requiere re-calibración trazable.');
  }

  return {
    tgbhMedido,
    cavAplicado: cav,
    tgbhEfectivo,
    vlePermisible,
    vlaAccion,
    diferenciaConVle,
    limiteExcedido,
    nivelAccionAlcanzado,
    trabajoCriticoSuspendido,
    calibracionLaboratorioVencida,
    regimenRecomendado,
    tasaHidratacionMlPorHora,
    dictamenGeneral,
    recomendacionesAutomaticas: recomendaciones
  };
}

/**
 * Evaluación de Estrés por Frío — Índice de Enfriamiento por Viento (Wind Chill)
 * Según Res. MTEySS 295/03 Anexo II (Estrés por Frío)
 */
export function evaluateColdStressWindChill(
  tempAireSecoC: number,
  velocidadVientoKmH: number
): ColdStressData {
  let sensacionTermica = tempAireSecoC;
  const v = Math.max(0, velocidadVientoKmH);

  // Fórmula oficial de temperatura equivalente de enfriamiento (Wind Chill) para V >= 4.8 km/h
  if (v >= 4.8) {
    sensacionTermica = 13.12 + (0.6215 * tempAireSecoC) - (11.37 * Math.pow(v, 0.16)) + (0.3965 * tempAireSecoC * Math.pow(v, 0.16));
  }
  const twc = Number(sensacionTermica.toFixed(1));

  let categoria: ColdStressData['categoriaRiesgoFrio'] = 'Poco Riesgo';
  let tiempoMaximoMin: number | undefined = undefined;
  let requiereProteccionFacial = false;

  if (twc < -40) {
    categoria = 'Peligro Extremo';
    tiempoMaximoMin = 5;
    requiereProteccionFacial = true;
  } else if (twc < -25) {
    categoria = 'Alto Riesgo (Congelación)';
    tiempoMaximoMin = 30;
    requiereProteccionFacial = true;
  } else if (twc < -10) {
    categoria = 'Riesgo Moderado';
    tiempoMaximoMin = 120;
    requiereProteccionFacial = false;
  } else {
    categoria = 'Poco Riesgo';
    tiempoMaximoMin = undefined;
    requiereProteccionFacial = false;
  }

  return {
    evaluarFrio: true,
    temperaturaAireSeco: tempAireSecoC,
    velocidadVientoKmH: v,
    sensacionTermicaViento: twc,
    tiempoMaximoExposicionMin: tiempoMaximoMin,
    categoriaRiesgoFrio: categoria,
    requiereProteccionFacial
  };
}

// ── 5. Decreto 351/79 Anexo VII — Carga de Fuego y Protección contra Incendios ─

/**
 * Evalúa el estudio completo de Carga de Fuego según Decreto 351/79 Anexo VII (Capítulo 18)
 * e IRAM 3517-2 (Dotación de extintores y potencial extintor)
 */
export function evaluateFullFireLoadProtocol(
  protocol: Partial<FireLoadAssessmentProtocol>
): FireLoadEvaluationMetrics {
  const superficie = Math.max(protocol.superficie || 1, 1);
  const riesgo = (protocol.riesgo || 'R4') as FireRiskLevel;
  const ventilacion = (protocol.ventilacion || 'natural') as FireVentilationType;
  const materiales = protocol.materiales || [];

  // 1. Carga Térmica Total
  const totalKcal = materiales.reduce((acc, m) => {
    const peso = Number(m.peso) || 0;
    const poder = Number(m.poderCalorifico) || 0;
    return acc + (peso * poder);
  }, 0);

  const totalMcal = Number((totalKcal / 1000).toFixed(2));
  const totalMJ = Number((totalKcal * 0.004184).toFixed(2));

  // 2. Madera Equivalente (Patrón 4.400 kcal/kg = 18.41 MJ/kg de madera)
  const maderaEquivKg = Number((totalKcal / 4400).toFixed(2));

  // 3. Carga de Fuego Qf (kg Madera / m2)
  const cargaFuegoKgM2 = Number((maderaEquivKg / superficie).toFixed(2));

  // 4. Resistencia al Fuego Requerida (Tabla 2.2.1 Anexo VII Dec. 351/79)
  let resistenciaFuegoRequerida = 'F30';
  if (ventilacion === 'natural') {
    if (cargaFuegoKgM2 <= 15) {
      resistenciaFuegoRequerida = (riesgo === 'R1' || riesgo === 'R2' || riesgo === 'R3') ? 'F60' : 'F30';
    } else if (cargaFuegoKgM2 <= 30) {
      resistenciaFuegoRequerida = (riesgo === 'R1' || riesgo === 'R2') ? 'F90' : 'F60';
    } else if (cargaFuegoKgM2 <= 60) {
      resistenciaFuegoRequerida = (riesgo === 'R1' || riesgo === 'R2') ? 'F120' : (riesgo === 'R3') ? 'F90' : 'F60';
    } else if (cargaFuegoKgM2 <= 100) {
      resistenciaFuegoRequerida = (riesgo === 'R1' || riesgo === 'R2') ? 'F180' : (riesgo === 'R3') ? 'F120' : 'F90';
    } else {
      resistenciaFuegoRequerida = (riesgo === 'R4' || riesgo === 'R5') ? 'F120' : 'F180';
    }
  } else {
    // Sin ventilación natural o subsuelos / confinamientos
    if (cargaFuegoKgM2 <= 15) {
      resistenciaFuegoRequerida = (riesgo === 'R1' || riesgo === 'R2') ? 'F90' : 'F60';
    } else if (cargaFuegoKgM2 <= 30) {
      resistenciaFuegoRequerida = (riesgo === 'R1' || riesgo === 'R2') ? 'F120' : (riesgo === 'R3') ? 'F90' : 'F60';
    } else if (cargaFuegoKgM2 <= 60) {
      resistenciaFuegoRequerida = (riesgo === 'R1' || riesgo === 'R2') ? 'F180' : (riesgo === 'R3') ? 'F120' : 'F90';
    } else if (cargaFuegoKgM2 <= 100) {
      resistenciaFuegoRequerida = (riesgo === 'R4' || riesgo === 'R5') ? 'F120' : 'F180';
    } else {
      resistenciaFuegoRequerida = 'F180';
    }
  }

  // 5. Potencial Extintor Clase A (Cuadro 1 Cap. 18 Anexo VII Dec. 351/79)
  let potencialClaseA = '1A';
  if (cargaFuegoKgM2 <= 15) {
    potencialClaseA = '1A';
  } else if (cargaFuegoKgM2 <= 30) {
    potencialClaseA = (riesgo === 'R4' || riesgo === 'R5') ? '1A' : '2A';
  } else if (cargaFuegoKgM2 <= 60) {
    potencialClaseA = (riesgo === 'R1' || riesgo === 'R2') ? '3A' : '2A';
  } else if (cargaFuegoKgM2 <= 100) {
    potencialClaseA = (riesgo === 'R1' || riesgo === 'R2') ? '6A' : (riesgo === 'R3') ? '4A' : '3A';
  } else {
    potencialClaseA = (riesgo === 'R1' || riesgo === 'R2') ? '10A' : (riesgo === 'R3') ? '6A' : '4A';
  }

  // 6. Potencial Extintor Clase B (Cuadro 2 Cap. 18 Anexo VII Dec. 351/79)
  let potencialClaseB = '6B';
  if (riesgo === 'R1' || riesgo === 'R2') {
    potencialClaseB = cargaFuegoKgM2 > 30 ? '20B' : '10B';
  } else if (riesgo === 'R3') {
    potencialClaseB = cargaFuegoKgM2 > 30 ? '10B' : '6B';
  } else {
    potencialClaseB = cargaFuegoKgM2 > 60 ? '10B' : '6B';
  }

  const potencialExtintorNominal = `${potencialClaseA}-${potencialClaseB}:C`;

  // 7. Dotación Mínima de Extintores Portátiles (IRAM 3517-2 y Dec. 351/79)
  // 1 cada 200 m2 o fracción, con un mínimo absoluto de 2 unidades por sector de incendio
  const minExtintores = Math.max(2, Math.ceil(superficie / 200));
  const distanciaMaximaRecorridoMetros = (riesgo === 'R1' || riesgo === 'R2') ? 15 : 20;

  // 8. Condiciones Específicas de Extinción (E1, E2, E4)
  const requiereRedHidrantes = (superficie > 600 && (riesgo === 'R1' || riesgo === 'R2' || riesgo === 'R3')) ||
                               (superficie > 1000) ||
                               (cargaFuegoKgM2 > 60);

  const requiereRociadoresAutomaticos = (superficie > 1000 && cargaFuegoKgM2 > 60) ||
                                       (cargaFuegoKgM2 > 100);

  const condicionesAplicables: FireExtinctionCondition[] = [
    {
      codigo: 'Condición E4',
      nombre: 'Extintores Portátiles Manuales',
      aplica: true,
      descripcion: `Dotación mínima de ${minExtintores} extintores de polvo químico seco ABC con potencial no menor a ${potencialExtintorNominal}, a distancia máxima de ${distanciaMaximaRecorridoMetros} m.`
    }
  ];

  if (requiereRedHidrantes) {
    condicionesAplicables.push({
      codigo: 'Condición E1',
      nombre: 'Instalación de Agua contra Incendios (Red de Hidrantes)',
      aplica: true,
      descripcion: `Superficie (${superficie} m²) o Carga de Fuego (${cargaFuegoKgM2} kg/m²) exigen instalación fija de agua presurizada con bocas de impulsión de 45 o 63.5 mm y reserva exclusiva (Anexo VII Punto 4.1).`
    });
  }

  if (requiereRociadoresAutomaticos) {
    condicionesAplicables.push({
      codigo: 'Condición E2',
      nombre: 'Rociadores Automáticos de Agua (Sprinklers)',
      aplica: true,
      descripcion: `La elevada densidad de carga térmica (${cargaFuegoKgM2} kg/m²) y superficie exige protección activa automática por rociadores bajo normas IRAM/NFPA 13.`
    });
  }

  // 9. Recomendaciones Técnicas
  const recomendacionesTecnicas: string[] = [
    `Carga de fuego calculada: ${cargaFuegoKgM2} kg/m² de madera equivalente para un sector de ${superficie} m² clasificado como ${riesgo}.`,
    `Resistencia al fuego reglamentaria exigida para muros y estructuras portantes: ${resistenciaFuegoRequerida} (${ventilacion === 'natural' ? 'con ventilación natural' : 'sin ventilación natural / forzada'}).`,
    `Instalar como mínimo ${minExtintores} extintores manuales de Polvo Químico Seco (PQS) de 5 kg o 10 kg con potencial mínimo certificado no inferior a ${potencialExtintorNominal} (IRAM 3517-2).`,
    `Distribución de extintores: Ubicados a una altura reglamentaria (1.20 m a 1.50 m del nivel de piso terminado), con libre acceso, señalizados con balizas normalizadas IRAM 10005-2 y a no más de ${distanciaMaximaRecorridoMetros} m de recorrido.`
  ];

  if (requiereRedHidrantes) {
    recomendacionesTecnicas.push('⚠️ CONDICIÓN E1 OBLIGATORIA: Por superar los umbrales reglamentarios, el establecimiento debe disponer de Red Fija de Hidrantes con reserva de agua y grupo motobomba.');
  }

  if (requiereRociadoresAutomaticos) {
    recomendacionesTecnicas.push('🛑 CONDICIÓN E2: Por carga de fuego superior a 60 kg/m² en gran superficie, se recomienda instalación de rociadores automáticos (Sprinklers).');
  }

  return {
    cargaTermicaTotalKcal: totalKcal,
    cargaTermicaTotalMcal: totalMcal,
    cargaTermicaTotalMJ: totalMJ,
    maderaEquivalenteKg: maderaEquivKg,
    cargaFuegoKgM2,
    clasificacionRiesgo: riesgo,
    ventilacion,
    resistenciaFuegoRequerida,
    minExtintores,
    potencialExtintorClaseA: potencialClaseA,
    potencialExtintorClaseB: potencialClaseB,
    potencialExtintorNominal,
    distanciaMaximaRecorridoMetros,
    requiereRedHidrantes,
    requiereRociadoresAutomaticos,
    condicionesAplicables,
    recomendacionesTecnicas
  };
}

// ── 6. Resolución S.R.T. N° 886/15 — Protocolo de Ergonomía Laboral ──────────

export const OFFICIAL_PLANILLA1_FACTORS: Planilla1Item[] = [
  {
    id: '1_levantamiento',
    numero: 1,
    nombre: 'Levantamiento y/o descenso manual de cargas sin transporte',
    planillaDerivada: 'Planilla 2.A',
    presente: false,
    requierePlanilla2: true,
    criterioSrt: 'Cargas ≥ 3 kg manipuladas manualmente de manera repetida o con flexión de tronco.'
  },
  {
    id: '2_empuje',
    numero: 2,
    nombre: 'Empuje y/o tracción manual de cargas',
    planillaDerivada: 'Planilla 2.B',
    presente: false,
    requierePlanilla2: true,
    criterioSrt: 'Uso de carretillas, transpaletas o carros donde la fuerza inicial o sostenida sea perceptible.'
  },
  {
    id: '3_transporte',
    numero: 3,
    nombre: 'Transporte manual de cargas con desplazamiento',
    planillaDerivada: 'Planilla 2.C',
    presente: false,
    requierePlanilla2: true,
    criterioSrt: 'Carga ≥ 3 kg transportada manualmente por una distancia superior a 1 metro.'
  },
  {
    id: '4_bipedestacion',
    numero: 4,
    nombre: 'Bipedestación estática o dinámica prolongada',
    planillaDerivada: 'Planilla 2.D',
    presente: false,
    requierePlanilla2: true,
    criterioSrt: 'Permanencia de pie sin caminar más de 2 horas seguidas o más de 4 horas en la jornada.'
  },
  {
    id: '5_movimientos_repetitivos',
    numero: 5,
    nombre: 'Movimientos repetitivos de miembros superiores',
    planillaDerivada: 'Planilla 2.E',
    presente: false,
    requierePlanilla2: true,
    criterioSrt: 'Ciclos de trabajo menores a 30 segundos o repetición del mismo gesto más del 50% del ciclo.'
  },
  {
    id: '6_posturas_forzadas',
    numero: 6,
    nombre: 'Posturas forzadas de tronco, cuello y extremidades',
    planillaDerivada: 'Planilla 2.F',
    presente: false,
    requierePlanilla2: true,
    criterioSrt: 'Inclinación de tronco > 20°, brazos por encima del nivel de hombros o cuclillas prolongadas.'
  },
  {
    id: '7_vibraciones_mano_brazo',
    numero: 7,
    nombre: 'Vibraciones transmitidas a la mano y al brazo',
    planillaDerivada: 'Planilla 2.G',
    presente: false,
    requierePlanilla2: true,
    criterioSrt: 'Uso continuado de herramientas neumáticas, rotopercutoras, amoladoras o motosierras.'
  },
  {
    id: '8_vibraciones_cuerpo_entero',
    numero: 8,
    nombre: 'Vibraciones de cuerpo entero',
    planillaDerivada: 'Planilla 2.H',
    presente: false,
    requierePlanilla2: true,
    criterioSrt: 'Conducción de autoelevadores, camiones pesados, tractores o maquinaria sobre suelo irregular.'
  },
  {
    id: '9_confort_termico',
    numero: 9,
    nombre: 'Estrés térmico o disconfort térmico ambiental',
    planillaDerivada: 'Res. 295/03 Anexo II',
    presente: false,
    requierePlanilla2: false,
    criterioSrt: 'Exposición a temperaturas extremas de frío (< 16°C) o sobrecarga térmica por calor.'
  },
  {
    id: '10_estres_contacto',
    numero: 10,
    nombre: 'Estrés de contacto o impacto repetido',
    planillaDerivada: 'Evaluación Técnica',
    presente: false,
    requierePlanilla2: false,
    criterioSrt: 'Presión continua de bordes duros sobre palma, muñeca, antebrazo o muslos, o uso de la mano como martillo.'
  }
];

/**
 * Cálculo del Límite de Peso Recomendado (LPR) e Índice de Levantamiento (IL)
 * Ecuación de NIOSH reglamentada por la Resolución S.R.T. N° 886/15 (Planilla 2.A)
 */
export function calculateNioshSrt886(input: {
  pesoCargaKg: number;
  distanciaHCm: number;
  distanciaVCm: number;
  desplazamientoDCm?: number;
  anguloTorsionDeg?: number;
  frecuenciaLiftsMin?: number;
  duracionHoras?: number;
  calidadAgarre?: 'Bueno' | 'Regular' | 'Malo';
}): Planilla2NioshData {
  const LC = 25; // Constante de Carga Estándar Res. SRT 886/15 (25 kg)

  // 1. Factor de Distancia Horizontal: HM = 25 / H (25 cm <= H <= 63 cm)
  const hClamped = Math.max(25, Math.min(63, input.distanciaHCm || 25));
  const HM = Number((25 / hClamped).toFixed(2));

  // 2. Factor de Altura Vertical: VM = 1 - (0.003 * |V - 75|) (0 cm <= V <= 175 cm)
  const vClamped = Math.max(0, Math.min(175, input.distanciaVCm ?? 75));
  const VM = Number(Math.max(0, 1 - (0.003 * Math.abs(vClamped - 75))).toFixed(2));

  // 3. Factor de Desplazamiento Vertical: DM = 0.82 + (4.5 / D) (25 cm <= D <= 175 cm)
  const dClamped = Math.max(25, Math.min(175, input.desplazamientoDCm || 25));
  const DM = Number(Math.min(1.0, 0.82 + (4.5 / dClamped)).toFixed(2));

  // 4. Factor de Asimetría / Torsión: AM = 1 - (0.0032 * A) (0° <= A <= 135°)
  const aClamped = Math.max(0, Math.min(135, input.anguloTorsionDeg || 0));
  const AM = Number(Math.max(0, 1 - (0.0032 * aClamped)).toFixed(2));

  // 5. Factor de Frecuencia: FM (Aproximación reglamentaria según tabla Res. 886/15)
  const freq = input.frecuenciaLiftsMin || 0.2;
  let FM = 1.0;
  if (freq > 10) FM = 0.40;
  else if (freq > 5) FM = 0.60;
  else if (freq > 2) FM = 0.75;
  else if (freq > 1) FM = 0.85;
  else if (freq > 0.5) FM = 0.94;

  // 6. Factor de Agarre: CM
  const agarre = input.calidadAgarre || 'Bueno';
  let CM = 1.0;
  if (agarre === 'Regular') CM = 0.95;
  if (agarre === 'Malo') CM = 0.90;

  // 7. Límite de Peso Recomendado: LPR = LC * HM * VM * DM * AM * FM * CM
  const lprCalculado = LC * HM * VM * DM * AM * FM * CM;
  const lprKg = Number(lprCalculado.toFixed(2));

  // 8. Índice de Levantamiento: IL = Peso / LPR
  const peso = Number(input.pesoCargaKg) || 0;
  const indiceLevantamiento = lprKg > 0 ? Number((peso / lprKg).toFixed(2)) : 0;

  // 9. Nivel de Riesgo Oficial Res. SRT 886/15
  let nivelRiesgo: ErgonomicsRiskLevel = 'Nivel 1 (Aceptable)';
  if (indiceLevantamiento > 1.5 || peso > 25) {
    nivelRiesgo = 'Nivel 3 (No Aceptable)';
  } else if (indiceLevantamiento > 1.0) {
    nivelRiesgo = 'Nivel 2 (Moderado)';
  } else {
    nivelRiesgo = 'Nivel 1 (Aceptable)';
  }

  return {
    pesoCargaKg: peso,
    distanciaHCm: hClamped,
    distanciaVCm: vClamped,
    desplazamientoDCm: dClamped,
    anguloTorsionDeg: aClamped,
    frecuenciaLiftsMin: freq,
    duracionHoras: input.duracionHoras || 1,
    calidadAgarre: agarre,
    lprKg,
    indiceLevantamiento,
    multiplicadores: { HM, VM, DM, AM, FM, CM },
    nivelRiesgo
  };
}

/**
 * Evaluación Integral del Protocolo de Ergonomía Laboral (Res. SRT 886/15)
 */
export function evaluateFullErgonomicsProtocol(
  protocol: Partial<ErgonomicsAssessmentProtocol>
): {
  factoresIdentificadosCount: number;
  factoresRequierenPlanilla2: string[];
  nivelRiesgoGlobal: ErgonomicsRiskLevel;
  riesgoRetro: 'Tolerable' | 'Moderado' | 'Alto';
  medidasSugeridas: Planilla3ActionMeasure[];
  conclusionesAutomaticas: string[];
} {
  const p1 = protocol.planilla1 || ({} as Record<ErgonomicsRiskFactorKey, boolean>);
  
  // 1. Contar factores identificados
  const activeKeys = Object.entries(p1)
    .filter(([_, val]) => Boolean(val))
    .map(([key]) => key as ErgonomicsRiskFactorKey);

  const factoresIdentificadosCount = activeKeys.length;

  const factoresRequierenPlanilla2 = OFFICIAL_PLANILLA1_FACTORS
    .filter(f => p1[f.id] && f.requierePlanilla2)
    .map(f => f.nombre);

  // 2. Evaluar Levantamiento si está activo
  const nioshData = protocol.calculoLevantamiento
    ? calculateNioshSrt886(protocol.calculoLevantamiento)
    : calculateNioshSrt886({ pesoCargaKg: 0, distanciaHCm: 25, distanciaVCm: 75 });

  // 3. Determinar Nivel de Riesgo Global
  let nivelRiesgoGlobal: ErgonomicsRiskLevel = 'Nivel 1 (Aceptable)';
  let riesgoRetro: 'Tolerable' | 'Moderado' | 'Alto' = 'Tolerable';

  if (p1['1_levantamiento'] && nioshData.nivelRiesgo === 'Nivel 3 (No Aceptable)') {
    nivelRiesgoGlobal = 'Nivel 3 (No Aceptable)';
    riesgoRetro = 'Alto';
  } else if (
    factoresIdentificadosCount >= 4 ||
    (p1['1_levantamiento'] && nioshData.nivelRiesgo === 'Nivel 2 (Moderado)') ||
    (p1['5_movimientos_repetitivos'] && protocol.repetitivos?.nivelRiesgo === 'Nivel 3 (No Aceptable)') ||
    (p1['6_posturas_forzadas'] && protocol.posturas?.nivelRiesgo === 'Nivel 3 (No Aceptable)')
  ) {
    nivelRiesgoGlobal = 'Nivel 2 (Moderado)';
    riesgoRetro = 'Moderado';
  } else if (factoresIdentificadosCount >= 1) {
    nivelRiesgoGlobal = 'Nivel 2 (Moderado)';
    riesgoRetro = 'Moderado';
  }

  // 4. Medidas sugeridas para Planilla 3
  const medidasSugeridas: Planilla3ActionMeasure[] = [];

  if (p1['1_levantamiento']) {
    if (nioshData.pesoCargaKg > 25) {
      medidasSugeridas.push({
        id: 'med_lev_1',
        factorRiesgo: 'Levantamiento de Cargas',
        medidaPropuesta: 'Fraccionar la carga en unidades ≤ 25 kg o implementar manipulador mecánico / autoelevador.',
        tipoMedida: 'Ingeniería',
        plazo: 'Inmediato (30 días)',
        responsable: 'Jefatura de Operaciones / Mantenimiento',
        estado: 'Pendiente'
      });
    } else if (nioshData.indiceLevantamiento > 1.0) {
      medidasSugeridas.push({
        id: 'med_lev_2',
        factorRiesgo: 'Levantamiento de Cargas',
        medidaPropuesta: 'Acercar el plano de carga al cuerpo (reducir distancia horizontal H) y ubicar pallets a altura de cintura.',
        tipoMedida: 'Ingeniería',
        plazo: '60 días',
        responsable: 'Higiene y Seguridad / Logística',
        estado: 'Pendiente'
      });
    }
  }

  if (p1['4_bipedestacion']) {
    medidasSugeridas.push({
      id: 'med_bip_1',
      factorRiesgo: 'Bipedestación Prolongada',
      medidaPropuesta: 'Proveer alfombras o tapetes antifatiga de poliuretano y banqueta ergonómica semi-sentado / alternancia postural.',
      tipoMedida: 'Ingeniería',
      plazo: '45 días',
      responsable: 'Servicio de Higiene y Seguridad',
      estado: 'Pendiente'
    });
  }

  if (p1['5_movimientos_repetitivos']) {
    medidasSugeridas.push({
      id: 'med_rep_1',
      factorRiesgo: 'Movimientos Repetitivos',
      medidaPropuesta: 'Implementar programa de micropausas activas y rotación programada de puestos cada 2 horas.',
      tipoMedida: 'Administrativa / Organizacional',
      plazo: '30 días',
      responsable: 'Recursos Humanos / Producción',
      estado: 'Pendiente'
    });
  }

  if (p1['6_posturas_forzadas']) {
    medidasSugeridas.push({
      id: 'med_pos_1',
      factorRiesgo: 'Posturas Forzadas',
      medidaPropuesta: 'Ajustar la altura de las superficies de trabajo para evitar flexión de tronco > 20° y elevación excesiva de brazos.',
      tipoMedida: 'Ingeniería',
      plazo: '60 días',
      responsable: 'Mantenimiento / Ingeniería de Procesos',
      estado: 'Pendiente'
    });
  }

  // Capacitación obligatoria transversal
  if (factoresIdentificadosCount > 0) {
    medidasSugeridas.push({
      id: 'med_cap_1',
      factorRiesgo: 'Capacitación en Ergonomía',
      medidaPropuesta: 'Capacitar a los trabajadores en técnicas seguras de manipulación manual de cargas y pausas saludables (Res. SRT 886/15).',
      tipoMedida: 'Capacitación',
      plazo: '90 días',
      responsable: 'Servicio de Higiene y Seguridad Laboral',
      estado: 'Pendiente'
    });
  }

  // 5. Conclusiones técnicas automáticas
  const conclusionesAutomaticas: string[] = [
    `El relevamiento ergonómico inicial conforme a la Planilla 1 (Res. SRT 886/15) identificó ${factoresIdentificadosCount} factor(es) de riesgo en el puesto.`,
    `Nivel de Riesgo Global Dictaminado: ${nivelRiesgoGlobal}.`
  ];

  if (p1['1_levantamiento']) {
    conclusionesAutomaticas.push(
      `Evaluación de Levantamiento NIOSH (Planilla 2.A): Peso manipulado = ${nioshData.pesoCargaKg} kg, LPR calculado = ${nioshData.lprKg} kg, Índice de Levantamiento IL = ${nioshData.indiceLevantamiento} (${nioshData.nivelRiesgo}).`
    );
  }

  if (nivelRiesgoGlobal === 'Nivel 3 (No Aceptable)') {
    conclusionesAutomaticas.push('🚨 INTERVENCIÓN PRIORITARIA: El puesto presenta condiciones de riesgo no aceptables que requieren rediseño ingenieril o asistencia mecánica inmediata.');
  } else if (nivelRiesgoGlobal === 'Nivel 2 (Moderado)') {
    conclusionesAutomaticas.push('⚠️ MEDIDAS PREVENTIVAS: Se requiere ejecutar el plan de acción de la Planilla 3 para corregir factores de riesgo moderados y mitigar TME.');
  } else {
    conclusionesAutomaticas.push('🟢 CONDICIÓN ACEPTABLE: Las tareas se desarrollan dentro de parámetros biomecánicos tolerables. Se recomienda mantener capacitaciones periódicas.');
  }

  return {
    factoresIdentificadosCount,
    factoresRequierenPlanilla2,
    nivelRiesgoGlobal,
    riesgoRetro,
    medidasSugeridas,
    conclusionesAutomaticas
  };
}

// ── 7. Resolución MTEySS N° 295/03 Anexo IV — Contaminantes Químicos ─────────

export const COMMON_CHEMICAL_SUBSTANCES: ChemicalSubstanceReference[] = [
  {
    id: 'tolueno',
    nombreQuimico: 'Tolueno (Metilbenceno)',
    nombreComercial: 'Tolueno Industrial',
    casNumber: '108-88-3',
    unNumber: '1294',
    cmpPpm: 50,
    cmpMgM3: 188,
    viaDermica: true,
    sensibilizante: false,
    carcinogenicidad: 'A4 (No clasificable en humanos)',
    bei: 'Ácido hipúrico en orina (1.6 g/g creatinina al final del turno)',
    sinonimos: ['Metilbenceno', 'Fenilmetano', 'Toluol']
  },
  {
    id: 'xileno',
    nombreQuimico: 'Xileno (isómeros o, m, p)',
    nombreComercial: 'Xilol / Solvente Xileno',
    casNumber: '1330-20-7',
    unNumber: '1307',
    cmpPpm: 100,
    cmpMgM3: 434,
    cmpCptPpm: 150,
    cmpCptMgM3: 651,
    viaDermica: false,
    sensibilizante: false,
    carcinogenicidad: 'A4 (No clasificable en humanos)',
    bei: 'Ácidos metilhipúricos en orina (1.5 g/g creatinina)',
    sinonimos: ['Dimetilbenceno', 'Xilol']
  },
  {
    id: 'benceno',
    nombreQuimico: 'Benceno',
    nombreComercial: 'Benzol',
    casNumber: '71-43-2',
    unNumber: '1114',
    cmpPpm: 0.5,
    cmpMgM3: 1.6,
    cmpCptPpm: 2.5,
    cmpCptMgM3: 8.0,
    viaDermica: true,
    sensibilizante: false,
    carcinogenicidad: 'A1 (Carcinógeno humano confirmado)',
    bei: 'Ácido S-fenilmercaptúrico en orina (25 µg/g creatinina)',
    sinonimos: ['Benzol', 'Ciclohexatrieno']
  },
  {
    id: 'acetona',
    nombreQuimico: 'Acetona (2-Propanona)',
    nombreComercial: 'Acetona pura',
    casNumber: '67-64-1',
    unNumber: '1090',
    cmpPpm: 500,
    cmpMgM3: 1188,
    cmpCptPpm: 750,
    cmpCptMgM3: 1782,
    viaDermica: false,
    sensibilizante: false,
    carcinogenicidad: 'A4 (No clasificable en humanos)',
    bei: 'Acetona en orina (50 mg/L al final del turno)',
    sinonimos: ['Dimetilcetona', 'Propanona']
  },
  {
    id: 'etanol',
    nombreQuimico: 'Etanol (Alcohol Etílico)',
    nombreComercial: 'Alcohol Etílico 96° / Desnaturalizado',
    casNumber: '64-17-5',
    unNumber: '1170',
    cmpPpm: 1000,
    cmpMgM3: 1880,
    viaDermica: false,
    sensibilizante: false,
    carcinogenicidad: 'A4 (No clasificable en humanos)',
    sinonimos: ['Alcohol etílico', 'Espíritu de vino']
  },
  {
    id: 'amoniaco',
    nombreQuimico: 'Amoníaco Anhidro',
    nombreComercial: 'Gas Amoníaco / Refrigerante R-717',
    casNumber: '7664-41-7',
    unNumber: '1005',
    cmpPpm: 25,
    cmpMgM3: 17,
    cmpCptPpm: 35,
    cmpCptMgM3: 24,
    viaDermica: false,
    sensibilizante: false,
    carcinogenicidad: 'No clasificado',
    sinonimos: ['Espíritu de Hartshorn', 'Amoníaco gaseoso']
  },
  {
    id: 'monoxido_carbono',
    nombreQuimico: 'Monóxido de Carbono',
    nombreComercial: 'Gas CO',
    casNumber: '630-08-0',
    unNumber: '1016',
    cmpPpm: 25,
    cmpMgM3: 29,
    viaDermica: false,
    sensibilizante: false,
    carcinogenicidad: 'No clasificado',
    bei: 'Carboxihemoglobina en sangre (3.5% al final del turno)',
    sinonimos: ['Óxido de carbono (II)']
  },
  {
    id: 'acido_sulfurico',
    nombreQuimico: 'Ácido Sulfúrico (Niebla torácica)',
    nombreComercial: 'Ácido de baterías / Sulfúrico industrial',
    casNumber: '7664-93-9',
    unNumber: '1830',
    cmpMgM3: 0.2, // Fracción torácica
    viaDermica: false,
    sensibilizante: false,
    carcinogenicidad: 'A2 (Sospechoso en humanos)',
    sinonimos: ['Aceite de vitriolo', 'Sulfato de hidrógeno']
  },
  {
    id: 'cloro',
    nombreQuimico: 'Cloro',
    nombreComercial: 'Cloro gas / Cloro licuado',
    casNumber: '7782-50-5',
    unNumber: '1017',
    cmpPpm: 0.5,
    cmpMgM3: 1.5,
    cmpCptPpm: 1.0,
    cmpCptMgM3: 2.9,
    viaDermica: false,
    sensibilizante: false,
    carcinogenicidad: 'A4 (No clasificable en humanos)',
    sinonimos: ['Cloro elemental']
  },
  {
    id: 'tricloroetileno',
    nombreQuimico: 'Tricloroetileno',
    nombreComercial: 'Tricloro / Desengrasante clorado',
    casNumber: '79-01-6',
    unNumber: '1710',
    cmpPpm: 50,
    cmpMgM3: 269,
    cmpCptPpm: 100,
    cmpCptMgM3: 537,
    viaDermica: false,
    sensibilizante: false,
    carcinogenicidad: 'A2 (Sospechoso en humanos)',
    bei: 'Ácido tricloroacético en orina (100 mg/g creatinina)',
    sinonimos: ['Tricloretileno', 'TCE']
  }
];

/**
 * Evaluación de Exposición a un Contaminante Químico Individual
 * Conforme a la Resolución MTEySS N° 295/03 Anexo IV
 */
export function evaluateChemicalAgentExposure(
  agent: Partial<ChemicalAgentAssessment>
): {
  indiceExposicion: number;
  porcentajeCMP: number;
  dictamenExposicion: ChemicalAgentAssessment['dictamenExposicion'];
  superaCMP: boolean;
  alcanzaNivelAccion: boolean;
  recomendacionesTecnicas: string[];
} {
  const cmp = Math.max(Number(agent.cmp) || 0, 0.0001);
  const concentracion = Math.max(Number(agent.concentracionMedida) || 0, 0);

  // 1. Índice de Exposición: IE = Concentración / CMP
  const ieRaw = concentracion / cmp;
  const indiceExposicion = Number(ieRaw.toFixed(2));
  const porcentajeCMP = Number((indiceExposicion * 100).toFixed(1));

  // 2. Clasificación Reglamentaria
  const superaCMP = indiceExposicion > 1.0;
  const alcanzaNivelAccion = indiceExposicion >= 0.50 && !superaCMP;

  let dictamenExposicion: ChemicalAgentAssessment['dictamenExposicion'] = 'Conforme (IE < 0.50)';
  if (superaCMP) {
    dictamenExposicion = 'No Conforme / Supera CMP (IE > 1.0)';
  } else if (alcanzaNivelAccion) {
    dictamenExposicion = 'Nivel de Acción (0.50 ≤ IE ≤ 1.0)';
  } else {
    dictamenExposicion = 'Conforme (IE < 0.50)';
  }

  // 3. Recomendaciones Técnicas Oficiales
  const recomendacionesTecnicas: string[] = [];

  if (superaCMP) {
    recomendacionesTecnicas.push(
      `🛑 NO CONFORME: La concentración medida (${concentracion} ${agent.unidadMedicion || 'ppm'}) supera la Concentración Máxima Permisible (CMP = ${cmp} ${agent.unidadMedicion || 'ppm'}) con un IE de ${indiceExposicion} (${porcentajeCMP}% de la CMP).`
    );
    recomendacionesTecnicas.push(
      'Intervención ingenieril inmediata: Mejorar el sistema de extracción localizada en la fuente de emisión o encapsulamiento de procesos.'
    );
    recomendacionesTecnicas.push(
      'Uso obligatorio e inmediato de protección respiratoria certificada adecuada (cartucho para vapores/gases específicos).'
    );
    recomendacionesTecnicas.push(
      'Limitar el tiempo de permanencia de los trabajadores y rotar puestos hasta verificar la reducción de la concentración.'
    );
  } else if (alcanzaNivelAccion) {
    recomendacionesTecnicas.push(
      `⚠️ NIVEL DE ACCIÓN ALCANZADO: La concentración medida (${concentracion} ${agent.unidadMedicion || 'ppm'}) se encuentra entre el 50% y el 100% de la CMP (IE = ${indiceExposicion}).`
    );
    recomendacionesTecnicas.push(
      'Establecer vigilancia médica ocupacional periódica y monitoreo ambiental semestral.'
    );
    recomendacionesTecnicas.push(
      'Revisar el caudal de extracción y las prácticas operativas de manipulación para evitar el incremento de vapores/polvos.'
    );
  } else {
    recomendacionesTecnicas.push(
      `🟢 CONFORME: Concentración ambiental (${concentracion} ${agent.unidadMedicion || 'ppm'}) dentro de parámetros higiénicos seguros (< 50% de la CMP, IE = ${indiceExposicion}).`
    );
    recomendacionesTecnicas.push(
      'Mantener los controles de ventilación existentes y las capacitaciones en manipulación segura de sustancias químicas.'
    );
  }

  if (agent.viaDermica) {
    recomendacionesTecnicas.push(
      '✋ NOTACIÓN VÍA DÉRMICA (Skin): Esta sustancia se absorbe significativamente a través de la piel intacta. El uso de guantes y traje de protección química es obligatorio e imperativo.'
    );
  }

  if (agent.carcinogenicidad && (agent.carcinogenicidad.startsWith('A1') || agent.carcinogenicidad.startsWith('A2'))) {
    recomendacionesTecnicas.push(
      `☣️ SUSTANCIA CARCINÓGENA (${agent.carcinogenicidad}): Aplicar el principio ALARA (tan bajo como sea técnicamente posible) e inscribir al personal en el Registro Nacional de Sustancias Cancerígenas (Res. SRT 415/02).`
    );
  }

  if (agent.bei) {
    recomendacionesTecnicas.push(
      `🧪 ÍNDICE BIOLÓGICO DE EXPOSICIÓN (BEI): Se recomienda realizar control biológico: ${agent.bei}.`
    );
  }

  return {
    indiceExposicion,
    porcentajeCMP,
    dictamenExposicion,
    superaCMP,
    alcanzaNivelAccion,
    recomendacionesTecnicas
  };
}

/**
 * Evaluación del Efecto Aditivo de Mezclas de Contaminantes Químicos
 * Fórmula oficial según Res. MTEySS 295/03 Anexo IV (Punto 2):
 * Em = (C1 / CMP1) + (C2 / CMP2) + ... + (Cn / CMPn)
 */
export function evaluateChemicalAdditiveEffect(
  componentes: ChemicalMixtureComponent[]
): ChemicalMixtureEvaluation {
  if (!componentes || componentes.length === 0) {
    return {
      componentes: [],
      indiceEfectoAditivo: 0,
      superaLimiteAditivo: false,
      dictamen: 'Mezcla Conforme (Em ≤ 1.0)',
      recomendaciones: ['No hay componentes evaluados en la mezcla.']
    };
  }

  let totalEm = 0;
  componentes.forEach(c => {
    const cmp = Math.max(c.cmp || 0, 0.0001);
    const conc = Math.max(c.concentracionMedida || 0, 0);
    totalEm += (conc / cmp);
  });

  const indiceEfectoAditivo = Number(totalEm.toFixed(2));
  const superaLimiteAditivo = indiceEfectoAditivo > 1.0;

  const dictamen: ChemicalMixtureEvaluation['dictamen'] = superaLimiteAditivo
    ? 'Mezcla Crítica / Supera Límite Aditivo (Em > 1.0)'
    : 'Mezcla Conforme (Em ≤ 1.0)';

  const recomendaciones: string[] = [
    `Índice de Efecto Aditivo calculado: Em = ${indiceEfectoAditivo} (Límite admisible: Em ≤ 1.0).`
  ];

  if (superaLimiteAditivo) {
    recomendaciones.push(
      '🚨 EFECTO ADITIVO SUPERADO: Aunque individualmente alguna sustancia pudiera estar por debajo de su CMP, la combinación tóxica sinérgica supera la capacidad de tolerancia biológica del organismo.'
    );
    recomendaciones.push(
      'Se requiere ventilación por dilución o extracción localizada generalizada y uso de EPP con protección combinada.'
    );
  } else {
    recomendaciones.push(
      '🟢 Condición de la mezcla admisible: El índice aditivo acumulado se encuentra por debajo de la unidad.'
    );
  }

  return {
    componentes,
    indiceEfectoAditivo,
    superaLimiteAditivo,
    dictamen,
    recomendaciones
  };
}

// ── 7. Res. S.R.T. N° 953/10 & Res. 295/03 — Espacios Confinados ──────────

/**
 * Límites atmosféricos reglamentarios oficiales en Argentina:
 * - O2: 19.5% a 23.5% (Res. SRT 953/10 Anexo I y OSHA)
 * - LEL: ≤ 10% del Límite Inferior de Explosividad (Res. SRT 953/10)
 * - CO: ≤ 25 ppm (Res. MTEySS 295/03 Anexo IV - CMP Argentina, NO 35 ppm)
 * - H2S: ≤ 10 ppm (Res. MTEySS 295/03 Anexo IV - CMP Argentina)
 */
export const OFFICIAL_CONFINED_SPACE_ATMOSPHERIC_LIMITS = {
  o2: { min: 19.5, max: 23.5, unit: '%', name: 'Oxígeno', norm: 'Res. SRT 953/10' },
  lel: { min: 0, max: 10, unit: '%', name: 'Inflamabilidad (LEL)', norm: 'Res. SRT 953/10' },
  co: { min: 0, max: 25, unit: 'ppm', name: 'Monóxido de Carbono (CO)', norm: 'Res. MTEySS 295/03 Anexo IV' },
  h2s: { min: 0, max: 10, unit: 'ppm', name: 'Ácido Sulfhídrico (H2S)', norm: 'Res. MTEySS 295/03 Anexo IV' },
  co2: { min: 0, max: 5000, unit: 'ppm', name: 'Dióxido de Carbono (CO2)', norm: 'Res. MTEySS 295/03 Anexo IV' }
};

/**
 * Evalúa las lecturas de gases atmosféricos conforme a la Res. SRT 953/10 y Res. 295/03.
 */
export function evaluateAtmosphericConditions(
  reading: AtmosphericGasReading
): AtmosphericEvaluationResult {
  const o2 = Number(reading.o2) || 0;
  const lel = Number(reading.lel) || 0;
  const co = Number(reading.co) || 0;
  const h2s = Number(reading.h2s) || 0;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // 1. Oxígeno (19.5% - 23.5%)
  let o2Status: AtmosphericEvaluationResult['details']['o2Status'] = 'NORMAL';
  if (o2 < 19.5) {
    o2Status = 'DEFICIENTE';
    warnings.push(`🔴 ATMÓSFERA ASFIXIANTE / DEFICIENTE EN OXÍGENO: ${o2}% O2 (Mínimo legal: 19.5%). Riesgo inminente de hipoxia, pérdida de conciencia y muerte.`);
  } else if (o2 > 23.5) {
    o2Status = 'ENRIQUECIDO';
    warnings.push(`🔴 ATMÓSFERA ENRIQUECIDA EN OXÍGENO: ${o2}% O2 (Máximo legal: 23.5%). Riesgo extremo de combustión violenta y explosión espontánea.`);
  }

  // 2. LEL (Explosividad / Inflamabilidad <= 10%)
  let lelStatus: AtmosphericEvaluationResult['details']['lelStatus'] = 'SEGURO';
  if (lel > 10) {
    lelStatus = 'PELIGROSO';
    warnings.push(`💥 ATMÓSFERA INFLAMABLE / EXPLOSIVA: ${lel}% LEL (Límite máximo permitido: 10% LEL). PROHIBIDO EL INGRESO.`);
  }

  // 3. Monóxido de Carbono (CMP = 25 ppm Res. 295/03)
  let coStatus: AtmosphericEvaluationResult['details']['coStatus'] = 'SEGURO';
  if (co > 25) {
    coStatus = 'SUPERA_CMP';
    warnings.push(`⚠️ TÓXICO: Concentración de Monóxido de Carbono (CO = ${co} ppm) supera la Concentración Máxima Permisible (CMP = 25 ppm, Res. 295/03).`);
  }

  // 4. Ácido Sulfhídrico (CMP = 10 ppm Res. 295/03)
  let h2sStatus: AtmosphericEvaluationResult['details']['h2sStatus'] = 'SEGURO';
  if (h2s > 10) {
    h2sStatus = 'SUPERA_CMP';
    warnings.push(`⚠️ TÓXICO LETAL: Concentración de Ácido Sulfhídrico (H2S = ${h2s} ppm) supera la CMP (10 ppm, Res. 295/03). Riesgo de parálisis olfativa y edema agudo.`);
  }

  // Dictamen General
  const isAtmosphereCompromised = o2Status !== 'NORMAL' || lelStatus !== 'SEGURO' || coStatus !== 'SEGURO' || h2sStatus !== 'SEGURO';
  const isCritical = lel > 10 || o2 < 18.0 || o2 > 24.0 || co > 50 || h2s > 20;

  let status: AtmosphericStatus = 'APROBADO_SEGURO';
  let isSafeToEnter = false;

  if (isCritical) {
    status = 'CRITICO_PROHIBIDO_INGRESO';
    isSafeToEnter = false;
    recommendations.push('🛑 PROHIBICIÓN TOTAL DE INGRESO: Atmósfera inmediatamente peligrosa para la vida o la salud (IDLH).');
    recommendations.push('Forzar ventilación mecánica continua durante un mínimo de 15 a 30 minutos y realizar nuevo muestreo estratificado completo antes de reevaluar.');
  } else if (isAtmosphereCompromised) {
    status = 'ALERTA_VENTILACION';
    isSafeToEnter = false;
    recommendations.push('⚠️ INGRESO CONDICIONADO / NO HABILITADO: Los valores superan los umbrales de seguridad admisibles.');
    recommendations.push('Encender ventilación forzada mecánica y mantener monitoreo continuo con equipo multigás calibrado.');
  } else {
    status = 'APROBADO_SEGURO';
    isSafeToEnter = true;
    recommendations.push('🟢 ATMÓSFERA SEGURA APTA PARA INGRESO: Los 4 gases reglamentarios se encuentran dentro de los parámetros de la Res. SRT 953/10 y Res. 295/03.');
    recommendations.push('Mantener monitoreo continuo in-situ y ventilación mecánica durante toda la permanencia del personal en el recinto.');
  }

  if (reading.stratum && reading.stratum !== 'general') {
    recommendations.push(`📌 Muestreo estratificado registrado en nivel: ${reading.stratum.toUpperCase()}. Recuerde verificar siempre piso, media altura y techo.`);
  }

  return {
    status,
    isSafeToEnter,
    warnings,
    recommendations,
    details: {
      o2Status,
      lelStatus,
      coStatus,
      h2sStatus
    }
  };
}

/**
 * Evalúa la preparación operativa y de seguridad integral para habilitar el Permiso de Trabajo (PTSEC)
 * según los requerimientos mandatorios de la Res. SRT 953/10.
 */
export function evaluateConfinedSpaceReadiness(
  atmospheric: AtmosphericEvaluationResult,
  isolation: ConfinedSpaceIsolationLoto,
  ventilation: ConfinedSpaceVentilation,
  rescue: ConfinedSpaceRescueEquipment,
  attendantAssigned: boolean
): {
  isPermitIssuable: boolean;
  blockers: string[];
  verifications: string[];
} {
  const blockers: string[] = [];
  const verifications: string[] = [];

  // 1. Atmósfera
  if (!atmospheric.isSafeToEnter) {
    blockers.push('Atmósfera no apta: los parámetros gaseosos no cumplen con la Res. SRT 953/10.');
  } else {
    verifications.push('Medición atmosférica inicial aprobada y dentro de límites seguros.');
  }

  // 2. Aislamiento LOTO
  if (!isolation.valvesClosedAndLocked || !isolation.electricalLockoutApplied || !isolation.linesPurgedAndCleaned) {
    blockers.push('Aislamiento LOTO incompleto: es obligatorio el bloqueo de válvulas, corte eléctrico y purga de cañerías antes del ingreso.');
  } else {
    verifications.push('Bloqueo mecánico, eléctrico y purga/enclavamiento de fluidos verificado.');
  }

  // 3. Ventilación
  if (!ventilation.isOperatingContinuously || !ventilation.sufficientVentilation) {
    blockers.push('Ventilación deficiente: se exige ventilación mecánica forzada continua en funcionamiento.');
  } else {
    verifications.push('Sistema de ventilación forzada continua activo y verificado.');
  }

  // 4. Rescate y Vigía
  if (!attendantAssigned) {
    blockers.push('Falta vigía exterior permanente (Standby): es obligatoria la presencia de un vigía con comunicación ininterrumpida que no ingrese al recinto.');
  } else {
    verifications.push('Vigía exterior permanente designado y apostado en el acceso.');
  }

  if (!rescue.tripodAndWinchAvailable || !rescue.fullBodyHarnessClassAorE || !rescue.retractableLifeline) {
    blockers.push('Sistema de rescate incompleto: se requiere trípode con malacate de izaje, línea retráctil y arnés integral para rescate exterior sin ingreso asistido.');
  } else {
    verifications.push('Dispositivo de extracción y rescate exterior listo y operativo.');
  }

  const isPermitIssuable = blockers.length === 0;

  return {
    isPermitIssuable,
    blockers,
    verifications
  };
}

// ── 8. Res. S.R.T. N° 61/23 & Dec. 911/96 — Trabajo en Altura ─────────────

export const OFFICIAL_HEIGHT_REGULATORY_LIMITS = {
  minHeightThresholdM: 2.0, // Altura mínima reglamentaria en Argentina (Dec. 911/96 Art. 54 y Res. SRT 61/23)
  anchorMinCapacityKn: 22.0, // 22 kN (aprox. 2260 kg / 5000 lbs) por persona (IRAM 3626)
  maxSafeWindSpeedKmh: 35.0, // Velocidad máxima segura de viento según Res. SRT 61/23
  typicalLanyardLengthM: 1.8, // Longitud estándar del cabo con absorbedor (IRAM 3622-1)
  typicalAbsorberElongationM: 1.2, // Apertura máxima del amortiguador de energía
  typicalWorkerHeightOffsetM: 1.5, // Distancia argolla dorsal a pies
  minSafetyMarginM: 1.0 // Margen de seguridad libre al suelo
};

/**
 * Calcula la Distancia Libre de Caída (DLC) requerida según la fórmula técnica oficial:
 * DLC = Longitud_Cabo + Elongación_Absorbedor + Estatura_Operario_Argolla + Margen_Seguridad
 */
export function calculateFallClearanceDistance(
  params: FallClearanceParams,
  anchorFactor: 0 | 1 | 2 = 1
): FallClearanceResult {
  const lanyard = Math.max(Number(params.lanyardLengthM) || OFFICIAL_HEIGHT_REGULATORY_LIMITS.typicalLanyardLengthM, 0.5);
  const absorber = Math.max(Number(params.deceleratorDistanceM) || OFFICIAL_HEIGHT_REGULATORY_LIMITS.typicalAbsorberElongationM, 0);
  const workerHeight = Math.max(Number(params.workerHeightM) || OFFICIAL_HEIGHT_REGULATORY_LIMITS.typicalWorkerHeightOffsetM, 1.2);
  const safetyMargin = Math.max(Number(params.safetyMarginM) || OFFICIAL_HEIGHT_REGULATORY_LIMITS.minSafetyMarginM, 0.5);
  const availableHeight = Number(params.availableFallHeightM) || 0;

  // Ajuste por factor de caída (si el anclaje está por encima de la cabeza, factor 0 reduce la caída libre)
  let factorCorrection = 0;
  if (anchorFactor === 0) factorCorrection = -0.5; // anclaje elevado sobre la cabeza
  if (anchorFactor === 2) factorCorrection = 0.5; // anclaje a nivel de los pies (peligro máximo)

  const requiredClearanceM = Number(Math.max(lanyard + absorber + workerHeight + safetyMargin + factorCorrection, 3.0).toFixed(2));
  const safetyMarginRemainingM = Number((availableHeight - requiredClearanceM).toFixed(2));
  const isClearanceSafe = safetyMarginRemainingM > 0;

  let warning: string | undefined;
  let recommendation: string;

  if (!isClearanceSafe) {
    warning = `🚨 DISTANCIA INSUFICIENTE: Se requiere un espacio libre mínimo de ${requiredClearanceM} m desde el punto de anclaje, pero sólo se dispone de ${availableHeight} m. Si ocurre una caída, el operario impactará contra el suelo/estructura antes de que el absorbedor se abra por completo.`;
    recommendation = `Reemplazar el cabo de amarre estándar por un dispositivo anticaídas retráctil (línea autorretráctil que detiene la caída en ≤ 0.60 m) o reubicar el punto de anclaje a mayor altura por encima de la cabeza.`;
  } else {
    recommendation = `🟢 Espacio libre seguro: El margen residual de ${safetyMarginRemainingM} m garantiza que el sistema amortiguará la caída sin impacto contra el nivel inferior (Res. SRT 61/23).`;
  }

  return {
    requiredClearanceM,
    availableHeightM: availableHeight,
    safetyMarginRemainingM,
    isClearanceSafe,
    fallFactor: anchorFactor,
    warning,
    recommendation
  };
}

/**
 * Evaluación integral de aptitud y seguridad para trabajos en altura (Res. SRT 61/23)
 */
export function evaluateHeightWorkSafety(data: {
  workHeightMeters: number;
  medicalFitnessOk: boolean;
  anchorCapacityKn: number;
  anchorType: AnchorCertificationType;
  clearance: FallClearanceResult;
  harness: HarnessPreUseCheck;
  weather: WeatherConditions;
  rescuePlanDefined: boolean;
}): {
  isAuthorized: boolean;
  criticalBlockers: string[];
  preventiveAlerts: string[];
  recommendations: string[];
} {
  const criticalBlockers: string[] = [];
  const preventiveAlerts: string[] = [];
  const recommendations: string[] = [];

  // 1. Apto Médico
  if (!data.medicalFitnessOk) {
    criticalBlockers.push('Operario sin Apto Médico Ocupacional específico para tareas en altura (Res. SRT 61/23).');
  }

  // 2. Altura y Distancia Libre de Caída
  if (data.workHeightMeters >= OFFICIAL_HEIGHT_REGULATORY_LIMITS.minHeightThresholdM && !data.clearance.isClearanceSafe) {
    criticalBlockers.push(data.clearance.warning || 'Distancia Libre de Caída (DLC) insuficiente para evitar impacto contra el suelo.');
  }

  // 3. Anclaje
  if (data.anchorType === 'untested_unapproved') {
    criticalBlockers.push('Punto de anclaje no certificado ni ensayado. Prohibido anclarse a elementos improvisados (tuberías finas, bandejas portacables).');
  } else if (data.anchorCapacityKn < OFFICIAL_HEIGHT_REGULATORY_LIMITS.anchorMinCapacityKn) {
    criticalBlockers.push(`Capacidad del anclaje insuficiente (${data.anchorCapacityKn} kN). La normativa argentina exige un mínimo de 22 kN (5000 lbf / 2260 kg) por persona.`);
  }

  // 4. Arnés
  if (!data.harness.webbingFreeOfCutsOrBurns || !data.harness.stitchingIntact || !data.harness.dRingUndamaged) {
    criticalBlockers.push('El arnés presenta daños estructurales (cintas cortadas, costuras descosidas o argollas deformadas). Retirar de servicio inmediatamente.');
  }
  if (!data.harness.impactIndicatorNotTripped) {
    criticalBlockers.push('El arnés presenta el testigo/indicador de impacto activado (sufrió una caída previa). Debe ser destruido y descartado.');
  }
  if (!data.harness.lanyardDoubleWithAbsorber) {
    preventiveAlerts.push('Se recomienda fuertemente el uso de cabo doble en "Y" con absorbedor para garantizar enganche 100% permanente durante desplazamientos.');
  }

  // 5. Clima
  if (data.weather.hasRainOrThunderstorm) {
    criticalBlockers.push('Condición meteorológica crítica: Lluvia o tormenta eléctrica activa. Prohibido trabajar en altura a la intemperie (Dec. 911/96).');
  }
  if (data.weather.windSpeedKmh > OFFICIAL_HEIGHT_REGULATORY_LIMITS.maxSafeWindSpeedKmh) {
    criticalBlockers.push(`Viento excesivo (${data.weather.windSpeedKmh} km/h). El límite operativo máximo seguro es de 35 km/h (Res. SRT 61/23).`);
  } else if (data.weather.windSpeedKmh >= 25) {
    preventiveAlerts.push(`Viento moderado (${data.weather.windSpeedKmh} km/h). Extremar precauciones al manipular chapas, perfiles o paneles.`);
  }

  // 6. Plan de Rescate
  if (!data.rescuePlanDefined) {
    criticalBlockers.push('No se ha definido el procedimiento de rescate en altura. En caso de caída, el síndrome de arnés (trauma por suspensión) puede causar síncope en 10-15 minutos.');
  }

  const isAuthorized = criticalBlockers.length === 0;

  if (isAuthorized) {
    recommendations.push('🟢 Tarea habilitada: Todos los parámetros de seguridad, anclaje de 22 kN, aptitud médica y cálculo de DLC cumplen con la Res. SRT 61/23 y Dec. 911/96.');
    recommendations.push('Mantener conexión continua del cabo de amarre al 100% y verificar periódicamente las condiciones de viento.');
  } else {
    recommendations.push('🛑 TRABAJO NO AUTORIZADO: Subsanar todos los bloqueos críticos antes de iniciar cualquier labor por encima de 2.00 metros.');
  }

  return {
    isAuthorized,
    criticalBlockers,
    preventiveAlerts,
    recommendations
  };
}

// ── 9. Bloqueo y Etiquetado LOTO (Dec. 351/79 Cap. 14 y 15 & OSHA 1910.147) ──────

export const OFFICIAL_LOTO_REGULATORY_CRITERIA = {
  normativeReference: 'Decreto 351/79 (Cap. 14 "Instalaciones Eléctricas" Anexo VI, Cap. 15 "Máquinas y Herramientas") y OSHA 29 CFR 1910.147',
  fiveGoldenRulesTitles: [
    '1. Corte visible o efectivo de todas las fuentes de tensión',
    '2. Bloqueo y enclavamiento mecánico de los aparatos de corte (candados de consignación)',
    '3. Verificación y comprobación obligatoria de ausencia de tensión (0V) en todos los conductores activos',
    '4. Puesta a tierra y en cortocircuito temporaria de todas las fases y neutro',
    '5. Señalización y delimitación de la zona de trabajo protegida (Cartelería "PELIGRO - NO OPERAR")'
  ],
  corePrinciples: [
    'Un operario = Un candado = Una llave (Personal, intransferible y con llave única)',
    'Prohibición taxativa de que un tercero retire un candado ajeno sin protocolo extraordinario',
    'Prueba obligatoria de arranque local en vacío ("Try-Out") antes de cualquier contacto físico',
    'Disipación total de energías secundarias residuales (purga de presión neumática/hidráulica, descarga de condensadores, bloqueo mecánico de masas con riesgo gravitacional)'
  ]
};

export interface LotoEvaluationResult {
  isAuthorized: boolean;
  zeroEnergyConfirmed: boolean;
  goldenRulesCompliancePercent: number;
  criticalBlockers: string[];
  preventiveAlerts: string[];
  recommendations: string[];
}

/**
 * Evaluación integral de seguridad para Procedimientos de Bloqueo y Etiquetado LOTO
 * Conforme a Decreto 351/79 (Cap. 14 y 15) y OSHA 29 CFR 1910.147
 */
export function evaluateLotoProcedureSafety(
  procedure: Partial<LotoProcedureProtocol>
): LotoEvaluationResult {
  const criticalBlockers: string[] = [];
  const preventiveAlerts: string[] = [];
  const recommendations: string[] = [];

  // 1. Identificación básica del equipo
  if (!procedure.equipmentName || procedure.equipmentName.trim() === '') {
    criticalBlockers.push('Falta indicar el nombre o descripción del equipo / instalación a bloquear.');
  }

  // 2. Fuentes de energía identificadas
  const energyList = procedure.energyTypes || [];
  if (energyList.length === 0) {
    criticalBlockers.push('No se ha seleccionado ninguna fuente de energía peligrosa a aislar.');
  }

  // 3. Dispositivos de bloqueo asignados
  const deviceList = procedure.lotoDevices || [];
  if (deviceList.length === 0) {
    criticalBlockers.push('No se ha especificado ningún dispositivo físico de bloqueo (candado, aldaba, traba de válvula/disyuntor).');
  }

  // 4. Riesgo Eléctrico y Cinco Reglas de Oro (Dec. 351/79 Anexo VI)
  const isElectrical = energyList.includes('electrical') || procedure.hasElectricalRisk === true;
  let goldenRulesCompliancePercent = 100;

  if (isElectrical) {
    const gr = procedure.fiveGoldenRulesElectrical || {
      corteEfectivo: false,
      bloqueoEnclavamiento: false,
      verificacionAusencia: false,
      puestaATierraCorto: false,
      senalizacionZona: false
    };

    const rules = [
      { key: 'corteEfectivo', name: 'Regla 1: Corte efectivo/visible de fuentes de tensión', ok: gr.corteEfectivo },
      { key: 'bloqueoEnclavamiento', name: 'Regla 2: Bloqueo y enclavamiento de aparatos de corte', ok: gr.bloqueoEnclavamiento },
      { key: 'verificacionAusencia', name: 'Regla 3: Verificación de ausencia de tensión (0V)', ok: gr.verificacionAusencia },
      { key: 'puestaATierraCorto', name: 'Regla 4: Puesta a tierra y en cortocircuito', ok: gr.puestaATierraCorto },
      { key: 'senalizacionZona', name: 'Regla 5: Señalización y delimitación de la zona de trabajo', ok: gr.senalizacionZona }
    ];

    const fulfilledCount = rules.filter(r => r.ok).length;
    goldenRulesCompliancePercent = Math.round((fulfilledCount / rules.length) * 100);

    rules.forEach(r => {
      if (!r.ok) {
        criticalBlockers.push(`Incumplimiento del Dec. 351/79 Anexo VI: ${r.name}.`);
      }
    });

    if (goldenRulesCompliancePercent < 100) {
      preventiveAlerts.push(`Cumplimiento de las 5 Reglas de Oro: ${goldenRulesCompliancePercent}% (${fulfilledCount}/5 cumplidas). Prohibido iniciar tareas en circuitos con cumplimiento parcial.`);
    }
  }

  // 5. Estado de Energía Cero (Zero Energy State)
  const zeroEnergy = procedure.zeroEnergyVerification;
  const zeroEnergyConfirmed = Boolean(zeroEnergy && zeroEnergy.tested);

  if (!zeroEnergyConfirmed) {
    criticalBlockers.push('ESTADO DE ENERGÍA CERO NO CONFIRMADO: Es mandatorio realizar y documentar la prueba de energía cero residual (Try-Out, medición con multímetro o purga).');
  } else {
    if (zeroEnergy?.method === 'visual') {
      preventiveAlerts.push('La verificación visual debe complementarse siempre con una prueba física de intento de arranque local (Try-Out) o medición con voltímetro.');
    }
  }

  // 6. Puntos de Aislamiento
  const points = procedure.isolationPointsList || [];
  if (points.length > 0) {
    const unverifiedPoints = points.filter(p => !p.verified);
    if (unverifiedPoints.length > 0) {
      criticalBlockers.push(`Hay ${unverifiedPoints.length} punto(s) de aislamiento sin verificar bloqueo físico: ${unverifiedPoints.map(p => p.name || 'Punto').join(', ')}.`);
    }
  } else {
    preventiveAlerts.push('Se sugiere detallar cada punto de aislamiento individual en la tabla técnica para mayor trazabilidad en planta.');
  }

  // 7. Personal y Responsables
  if (!procedure.supervisor || procedure.supervisor.trim() === '') {
    criticalBlockers.push('No se ha designado al Encargado / Supervisor responsable del bloqueo.');
  }

  // 8. Bloqueo Grupal
  if (procedure.lockoutType === 'group' && (!procedure.lockBoxNumber || procedure.lockBoxNumber.trim() === '')) {
    preventiveAlerts.push('En bloqueos grupales se recomienda asignar explícitamente el número de caja de bloqueo (Lockbox) para custodia de llaves.');
  }

  // 9. Dictamen Final
  const isAuthorized = criticalBlockers.length === 0;

  if (isAuthorized) {
    recommendations.push('🟢 PROCEDIMIENTO LOTO AUTORIZADO: Todas las fuentes de energía han sido consignadas y el estado de energía cero fue verificado según Decreto 351/79 y OSHA 1910.147.');
    recommendations.push('Cada trabajador interviniente debe colocar su propio candado y conservar su llave personal de forma indelegable.');
  } else {
    recommendations.push('🛑 BLOQUEO NO AUTORIZADO: Corregir de forma obligatoria las no conformidades y completar la prueba de energía cero antes de que cualquier persona acceda al equipo.');
  }

  return {
    isAuthorized,
    zeroEnergyConfirmed,
    goldenRulesCompliancePercent,
    criticalBlockers,
    preventiveAlerts,
    recommendations
  };
}

// ── 10. Relevamiento General de Riesgos Laborales (RGRL - Res. SRT 463/09) ──────

export const OFFICIAL_RGRL_REGULATORY_CRITERIA = {
  normativeReferences: 'Resoluciones S.R.T. N° 463/09 (Dec. 351/79), 529/09 (Dec. 911/96) y 74/10 (Dec. 617/97)',
  declarationType: 'Declaración Jurada Anual obligatoria ante la A.R.T. y Superintendencia de Riesgos del Trabajo',
  thresholds: {
    optimoMinPercent: 90,
    aceptableMinPercent: 75
  },
  resolutionMap: {
    anexo1_351: 'Res. SRT 463/09 Anexo I — Industria, Comercio y Servicios (Decreto 351/79)',
    anexo2_911: 'Res. SRT 529/09 Anexo I — Industria de la Construcción (Decreto 911/96)',
    anexo3_617: 'Res. SRT 74/10 Anexo I — Actividad Agropecuaria (Decreto 617/97)'
  }
};

export interface RgrlEvaluationResult {
  isCompliant: boolean;
  compliancePercent: number;
  estadoGeneral: 'Óptimo (≥ 90%)' | 'Aceptable (75-89%)' | 'Crítico (< 75%)';
  totalItems: number;
  cumpleCount: number;
  noCumpleCount: number;
  noAplicaCount: number;
  criticalDeficiencies: RGRLItem[];
  alerts: string[];
  recommendations: string[];
}

/**
 * Evaluación analítica del Relevamiento General de Riesgos Laborales (RGRL)
 * Conforme a Res. SRT 463/09, Res. 529/09 y Res. 74/10
 */
export function evaluateRgrlSurveySafety(survey: Partial<RGRLSurvey>): RgrlEvaluationResult {
  const items = survey.items || [];
  const totalItems = items.length;
  let cumpleCount = 0;
  let noCumpleCount = 0;
  let noAplicaCount = 0;
  const criticalDeficiencies: RGRLItem[] = [];
  const alerts: string[] = [];
  const recommendations: string[] = [];

  // Conteo por estado
  items.forEach((it) => {
    if (it.estado === 'CUMPLE') {
      cumpleCount++;
    } else if (it.estado === 'NO_CUMPLE') {
      noCumpleCount++;
      // Chequear si es un punto de alta criticidad normativa
      const normLower = (it.normativa || '').toLowerCase();
      const pregLower = (it.pregunta || '').toLowerCase();
      if (
        normLower.includes('900/15') ||
        normLower.includes('1338/96') ||
        normLower.includes('886/15') ||
        pregLower.includes('puesta a tierra') ||
        pregLower.includes('disyuntor') ||
        pregLower.includes('programa de seguridad') ||
        pregLower.includes('arnés') ||
        pregLower.includes('carga de fuego')
      ) {
        criticalDeficiencies.push(it);
      }
    } else if (it.estado === 'NO_APLICA') {
      noAplicaCount++;
    }
  });

  const evaluables = cumpleCount + noCumpleCount;
  const compliancePercent = evaluables > 0 ? Math.round((cumpleCount / evaluables) * 100) : 100;

  let estadoGeneral: RgrlEvaluationResult['estadoGeneral'] = 'Óptimo (≥ 90%)';
  if (compliancePercent < OFFICIAL_RGRL_REGULATORY_CRITERIA.thresholds.aceptableMinPercent) {
    estadoGeneral = 'Crítico (< 75%)';
  } else if (compliancePercent < OFFICIAL_RGRL_REGULATORY_CRITERIA.thresholds.optimoMinPercent) {
    estadoGeneral = 'Aceptable (75-89%)';
  }

  // Validación de datos formales
  if (!survey.cuit || survey.cuit.trim() === '') {
    alerts.push('Falta consignar el C.U.I.T. patronal de la empresa relevada.');
  }
  if (!survey.artNombre || survey.artNombre.trim() === '') {
    alerts.push('Falta especificar la A.R.T. a la que se presentará la Declaración Jurada.');
  }
  if (!survey.profesionalHySNombre || survey.profesionalHySNombre.trim() === '') {
    alerts.push('Falta designar al Profesional de Higiene y Seguridad responsable con firma y matrícula.');
  }

  // Generación de dictamen y recomendaciones oficiales
  if (compliancePercent >= 90) {
    recommendations.push(
      `🟢 CUMPLIMIENTO LEGAL ÓPTIMO (${compliancePercent}%): El establecimiento satisface ampliamente los requisitos normativos del ${OFFICIAL_RGRL_REGULATORY_CRITERIA.resolutionMap[survey.anexo || 'anexo1_351']}.`
    );
    if (noCumpleCount > 0) {
      recommendations.push(
        `Se detectaron ${noCumpleCount} desvíos menores. Cumplimentar las adecuaciones acordadas dentro de los plazos establecidos en el Plan de Regularización.`
      );
    }
  } else if (compliancePercent >= 75) {
    recommendations.push(
      `🟡 CUMPLIMIENTO ACEPTABLE CON DESVÍOS (${compliancePercent}%): Se registraron ${noCumpleCount} no conformidades. La empresa debe remitir el Plan de Regularización con plazos perentorios a la A.R.T.`
    );
  } else {
    recommendations.push(
      `🛑 ESTADO CRÍTICO DE CUMPLIMIENTO (${compliancePercent}%): Nivel inferior al 75% reglamentario (${noCumpleCount} no conformidades). Riesgo inminente de intimaciones, multas o inclusión en programas de alta siniestralidad (Empresas Muestra).`
    );
  }

  if (criticalDeficiencies.length > 0) {
    alerts.push(
      `Existen ${criticalDeficiencies.length} no conformidades de alto impacto en seguridad de vida: ${criticalDeficiencies.map((c) => c.codigo).join(', ')}.`
    );
  }

  const isCompliant = compliancePercent >= 75;

  return {
    isCompliant,
    compliancePercent,
    estadoGeneral,
    totalItems,
    cumpleCount,
    noCumpleCount,
    noAplicaCount,
    criticalDeficiencies,
    alerts,
    recommendations
  };
}

// ── 11. Relevamiento de Agentes de Riesgo (RAR - Res. SRT 37/10 y Res. 81/19) ─

export const OFFICIAL_RAR_REGULATORY_CRITERIA = {
  normativeReferences: 'Resolución S.R.T. N° 37/10 (Exámenes Médicos en Salud), Decreto 658/96 (Enfermedades Profesionales), Dec. 1167/03 y Resolución S.R.T. N° 81/19 (Agentes Cancerígenos)',
  obligation: 'Declaración Jurada anual obligatoria ante la A.R.T. para coordinar los Exámenes Médicos Periódicos (ESOP)',
  carcinogenicNorm: 'Resolución S.R.T. N° 81/19 — Sistema de Vigilancia y Registro de Sustancias y Agentes Cancerígenos (SVRC)',
  ppeNorm: 'Resolución S.R.T. N° 299/11 — Provisión y registro de Elementos de Protección Personal certificados con sello IRAM/S',
  cuilFormat: 'CUIL de 11 dígitos con algoritmo de Módulo 11 (20/23/24/27/30/33/34)'
};

/**
 * Evaluación técnico-legal de la Nómina de Trabajadores Expuestos (RAR)
 * Conforme a Res. S.R.T. N° 37/10 y Res. S.R.T. N° 81/19
 */
export function evaluateRarProtocolSafety(survey: Partial<RARSurvey>): RarEvaluationResult {
  const trabajadores = survey.trabajadores || [];
  const totalTrabajadores = trabajadores.length;
  let trabajadoresExpuestos = 0;
  let trabajadoresNoExpuestos = 0;
  const alertasNormativas: string[] = [];
  const recomendaciones: string[] = [];

  // 1. Validación de datos patronales y profesionales
  if (!survey.cuit || survey.cuit.trim() === '') {
    alertasNormativas.push('Falta consignar el C.U.I.T. del empleador.');
  }
  if (!survey.razonSocial || survey.razonSocial.trim() === '') {
    alertasNormativas.push('Falta consignar la Razón Social del empleador.');
  }
  if (!survey.artNombre || survey.artNombre.trim() === '') {
    alertasNormativas.push('Falta especificar la A.R.T. aseguradora.');
  }
  if (!survey.profesionalNombre || survey.profesionalNombre.trim() === '') {
    alertasNormativas.push('Falta el nombre y apellido del Profesional de Higiene y Seguridad responsable.');
  }
  if (!survey.profesionalMatricula || survey.profesionalMatricula.trim() === '') {
    alertasNormativas.push('Falta la matrícula profesional habilitante del responsable de Higiene y Seguridad.');
  }

  // 2. Mapeo de agentes, cancerígenos y exámenes médicos
  const examMap: Record<string, number> = {};
  const cancerMap: Record<string, { nombre: string; count: number }> = {};
  let invalidCuilsCount = 0;
  let exposedWithoutPpeCount = 0;

  trabajadores.forEach((w, idx) => {
    // Validar CUIL
    const cuilVal = validateCuilFormat(w.cuil || '');
    if (!cuilVal.isValid) {
      invalidCuilsCount++;
    }

    const uniqueCodes = Array.from(new Set(w.agentesCodigos || []));
    if (uniqueCodes.length > 0) {
      trabajadoresExpuestos++;

      // Verificar EPP bajo Res. 299/11
      if (!w.eppAdecuado) {
        exposedWithoutPpeCount++;
      }

      uniqueCodes.forEach(code => {
        const ag = getAgentByCode(code);
        if (ag) {
          if (ag.esCancerigeno) {
            if (!cancerMap[code]) {
              cancerMap[code] = { nombre: ag.nombre, count: 0 };
            }
            cancerMap[code].count++;
          }
          if (ag.estudiosRequeridos) {
            ag.estudiosRequeridos.forEach(est => {
              examMap[est] = (examMap[est] || 0) + 1;
            });
          }
        }
      });
    } else {
      trabajadoresNoExpuestos++;
    }
  });

  if (invalidCuilsCount > 0) {
    alertasNormativas.push(`Se detectaron ${invalidCuilsCount} operario(s) con formato o dígito de C.U.I.L. inválido. La extranet de la A.R.T. rechazará la presentación.`);
  }

  if (exposedWithoutPpeCount > 0) {
    alertasNormativas.push(`⚠️ ${exposedWithoutPpeCount} trabajador(es) expuesto(s) a agentes de riesgo no cuentan con EPP adecuado registrado bajo Res. SRT 299/11.`);
  }

  const porcentajeExpuestos = totalTrabajadores > 0 ? Math.round((trabajadoresExpuestos / totalTrabajadores) * 100) : 0;

  // 3. Cancerígenos Res. SRT 81/19
  const cancerigenosDetectados = Object.entries(cancerMap).map(([codigo, val]) => ({
    codigo,
    nombre: val.nombre,
    trabajadoresAfectados: val.count
  }));

  const requiereRegistroCancerigenos = cancerigenosDetectados.length > 0;

  if (requiereRegistroCancerigenos) {
    alertasNormativas.push(
      `☣️ ATENCIÓN RES. S.R.T. N° 81/19: Se declararon ${cancerigenosDetectados.length} sustancia(s) o agente(s) cancerígeno(s) (${cancerigenosDetectados.map(c => c.codigo).join(', ')}). Es imperativo inscribir al personal en el Sistema de Vigilancia y Registro de Sustancias Cancerígenas (SVRC) de la SRT.`
    );
  }

  // 4. Exámenes médicos consolidados
  const examenesMedicosConsolidados = Object.entries(examMap)
    .map(([examen, cantidadTrabajadores]) => ({ examen, cantidadTrabajadores }))
    .sort((a, b) => b.cantidadTrabajadores - a.cantidadTrabajadores);

  // 5. Recomendaciones técnicas
  if (totalTrabajadores === 0) {
    recomendaciones.push('La nómina se encuentra vacía. Cargue los operarios del establecimiento para coordinar exámenes periódicos.');
  } else {
    recomendaciones.push(
      `Nómina consolidada: ${totalTrabajadores} operarios relevados, de los cuales ${trabajadoresExpuestos} (${porcentajeExpuestos}%) presentan exposición a agentes de riesgo del Dec. 658/96.`
    );
    if (examenesMedicosConsolidados.length > 0) {
      recomendaciones.push(
        `Coordinar con la A.R.T. (${survey.artNombre || 'Aseguradora'}) la logística de los Exámenes Médicos Periódicos (Res. SRT 37/10), priorizando: ${examenesMedicosConsolidados.slice(0, 3).map(e => `${e.examen} (${e.cantidadTrabajadores} personas)`).join(', ')}.`
      );
    }
    if (exposedWithoutPpeCount > 0) {
      recomendaciones.push(
        'Regularizar de forma urgente las constancias de entrega de EPP según Resolución S.R.T. 299/11 para todos los puestos con exposición declarada.'
      );
    }
    if (requiereRegistroCancerigenos) {
      recomendaciones.push(
        'Remitir la declaración jurada especial de cancerígenos (Res. SRT 81/19) dentro de los plazos reglamentarios previstos por la Superintendencia.'
      );
    }
  }

  const isCompliant =
    Boolean(survey.cuit && survey.razonSocial && survey.artNombre) &&
    totalTrabajadores > 0 &&
    invalidCuilsCount === 0;

  return {
    isCompliant,
    totalTrabajadores,
    trabajadoresExpuestos,
    trabajadoresNoExpuestos,
    porcentajeExpuestos,
    cancerigenosDetectados,
    requiereRegistroCancerigenos,
    examenesMedicosConsolidados,
    alertasNormativas,
    recomendaciones
  };
}

// ── 12. Exámenes Médicos en Salud y Aptitudes Laborales (Res. S.R.T. N° 37/10) ─

export const OFFICIAL_MEDICAL_APTITUDE_REGULATORY_CRITERIA = {
  normativeReference: 'Resolución S.R.T. N° 37/2010 (Exámenes Médicos en Salud) y Ley de Higiene y Seguridad N° 19.587',
  examTypesMap: {
    preocupacional: 'Preocupacional o de Ingreso (Art. 2° Res. SRT 37/10)',
    periodico: 'Periódico de Salud Ocupacional / ESOP (Art. 3° Res. SRT 37/10)',
    transferencia: 'Previo a una Transferencia de Actividad (Art. 4° Res. SRT 37/10)',
    ausencia_prolongada: 'Posterior a Ausencias Prolongadas (Art. 5° Res. SRT 37/10)',
    egreso: 'De Egreso o Terminación Laboral (Art. 6° Res. SRT 37/10)'
  },
  verdictsMap: {
    apto: 'Apto (Sin patologías ni restricciones)',
    apto_con_preexistencias: 'Apto con Preexistencias (Con patologías previas registradas ante ART)',
    apto_con_restricciones: 'Apto con Restricciones (Limitaciones operativas específicas)',
    no_apto: 'No Apto (No reúne condiciones psicofísicas requeridas para el puesto)',
    no_apto_temporario: 'No Apto Temporario (Afección aguda reversible que posterga dictamen)'
  },
  mandatoryBasicStudiesPreoccupational: [
    'Examen físico completo (anamnesis, clínico, agudeza visual, bucodental)',
    'Radiografía panorámica de tórax frente con técnica reglamentaria',
    'Laboratorio completo (Hemograma, Eritrosedimentación, Glucemia, Uremia, Orina completa)',
    'Electrocardiograma (ECG) informado por médico especialista'
  ],
  legalProhibitions: [
    'Prohibición taxativa de test de embarazo como requisito de ingreso (Art. 2° Res. SRT 37/10)',
    'Prohibición de serología de VIH sin consentimiento expreso e informado (Ley 23.798 y Res. SRT 37/10)'
  ]
};

/**
 * Evaluación técnico-médica de la certificación de aptitud psicofísica laboral
 * Conforme a Resolución S.R.T. N° 37/2010 y Ley N° 19.587
 */
export function evaluateMedicalFitnessCompliance(record: Partial<MedicalRecord>): MedicalEvaluationResult {
  const alerts: string[] = [];
  const recommendations: string[] = [];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const expStr = record.expirationDate || todayStr;
  const expDate = new Date(expStr);

  // 1. Cálculo de vigencia temporal
  const diffTime = expDate.getTime() - now.getTime();
  const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiration < 0;

  let urgencyStatus: MedicalEvaluationResult['urgencyStatus'] = 'vigente';
  if (isExpired) {
    urgencyStatus = 'vencido';
    alerts.push(`🛑 CERTIFICADO VENCIDO: La aptitud médica venció hace ${Math.abs(daysUntilExpiration)} día(s). El operario no puede realizar tareas operativas hasta su renovación clínica.`);
  } else if (daysUntilExpiration <= 30) {
    urgencyStatus = 'por_vencer';
    alerts.push(`⚠️ PRÓXIMO A VENCER: La aptitud médica expira en ${daysUntilExpiration} día(s). Coordinar turno para examen periódico.`);
  }

  // 2. Dictamen y aptitud para el puesto
  const result = record.result || 'apto';
  const verdictLabel = OFFICIAL_MEDICAL_APTITUDE_REGULATORY_CRITERIA.verdictsMap[result] || 'Apto';

  let isFitForTask = true;
  let requiresImmediateAction = false;

  if (result === 'no_apto') {
    isFitForTask = false;
    requiresImmediateAction = true;
    alerts.push('🛑 DICTAMEN NO APTO: El trabajador no reúne las condiciones psicofísicas para el puesto. Prohibida la asignación de tareas operativas.');
  } else if (result === 'no_apto_temporario') {
    isFitForTask = false;
    requiresImmediateAction = true;
    alerts.push('⏳ NO APTO TEMPORARIO: El trabajador presenta un cuadro clínico agudo en tratamiento. Reevaluar tras el alta médica.');
  } else if (isExpired) {
    isFitForTask = false;
    requiresImmediateAction = true;
  }

  // 3. Coherencia lógica de habilitaciones de alto riesgo
  const hasHighRiskClearance = Boolean(
    record.allowHeight || record.allowConfined || record.allowMachinery || record.allowElectrical
  );

  if ((result === 'no_apto' || result === 'no_apto_temporario') && hasHighRiskClearance) {
    alerts.push('🚨 CONTRADICCIÓN CLÍNICA CRÍTICA: Se han tildado habilitaciones de alto riesgo (Altura / Confinados / Maquinaria / Eléctrico) para un operario calificado como NO APTO.');
  }

  if (result === 'apto_con_restricciones') {
    if (!record.restricciones || record.restricciones.trim() === '') {
      alerts.push('⚠️ FALTA DETALLE DE RESTRICCIONES: El dictamen es "Apto con Restricciones" pero no se especificaron las limitaciones operativas en el informe.');
    } else {
      recommendations.push(`Verificar en planta el estricto cumplimiento de las restricciones: "${record.restricciones}".`);
    }
  }

  if (result === 'apto_con_preexistencias') {
    if (!record.preexistencias || record.preexistencias.trim() === '') {
      alerts.push('⚠️ FALTA ASIENTO DE PREEXISTENCIAS: Es mandatorio describir las patologías preexistentes para deslinde de responsabilidad civil y de la A.R.T.');
    }
  }

  // 4. Auditoría de datos del profesional médico
  if (!record.doctor || record.doctor.trim() === '') {
    alerts.push('Falta el nombre y apellido del Médico Evaluador Otorgante.');
  }

  // 5. Recomendaciones de habilitaciones
  if (isFitForTask) {
    recommendations.push(`🟢 Trabajador habilitado bajo dictamen: ${verdictLabel}. Vigencia válida hasta el ${expDate.toLocaleDateString('es-AR')}.`);
    if (record.allowHeight) {
      recommendations.push('Trabajador habilitado para Trabajos en Altura (> 2 m) conforme a Res. SRT 61/23.');
    }
    if (record.allowConfined) {
      recommendations.push('Trabajador habilitado para Espacios Confinados conforme a Res. SRT 953/10.');
    }
    if (record.allowMachinery) {
      recommendations.push('Trabajador habilitado para Conducción de Autoelevadores / Maquinaria conforme a Dec. 351/79.');
    }
  } else {
    recommendations.push('🛑 TRABAJADOR NO HABILITADO: Gestionar de inmediato la reubicación de tareas o la renovación del examen médico.');
  }

  return {
    isExpired,
    daysUntilExpiration,
    urgencyStatus,
    isFitForTask,
    verdictLabel,
    requiresImmediateAction,
    alerts,
    recommendations
  };
}

// ── 13. Investigación de Accidentes de Trabajo (Res. SRT 475/06, Res. 503/14) ───

export const OFFICIAL_ACCIDENT_REGULATORY_CRITERIA = {
  legalFramework: [
    'Resolución S.R.T. N° 475/2006 — Régimen de Investigación y Notificación de Accidentes Mortales y Graves',
    'Ley N° 24.557 de Riesgos del Trabajo — Denuncia de Siniestros Laborales',
    'Resolución S.R.T. N° 503/2014 & Res. 230/2019 — Índices Oficiales de Siniestralidad (IF, IG, II)',
    'Metodología Oficial del Árbol de Causas (S.R.T. / I.N.R.S.)',
    'Decreto N° 351/79 Reglamentario de la Ley N° 19.587'
  ],

  accidentTypesMap: {
    accidente_trabajo: 'Accidente de Trabajo (Típico en ocasión laboral)',
    in_itinere: 'Accidente In Itinere (Trayecto Domicilio-Trabajo)',
    incidente_sin_lesion: 'Incidente de Alto Potencial (Cuasi-accidente HIPPO)'
  },

  severityLevelsMap: {
    Leve: {
      label: 'Leve (Sin baja / Asistencia ambulatoria)',
      daysThreshold: '0 a 3 días',
      color: '#3b82f6',
      badgeBg: '#eff6ff'
    },
    Moderado: {
      label: 'Moderado (Con baja / Incapacidad Laboral Temporaria)',
      daysThreshold: '4 a 30 días de ILT',
      color: '#f59e0b',
      badgeBg: '#fffbeb'
    },
    Grave: {
      label: 'Grave (Internación > 24hs o secuela permanente - Res. SRT 475/06)',
      daysThreshold: '> 30 días de ILT o secuela',
      color: '#f97316',
      badgeBg: '#fff7ed'
    },
    Mortal: {
      label: 'Mortal (Fallecimiento del trabajador - Res. SRT 475/06)',
      daysThreshold: 'Fatal',
      color: '#dc2626',
      badgeBg: '#fef2f2'
    }
  },

  formasAccidenteSRT: [
    'Caída de personas a distinto nivel (altura, escaleras, andamios)',
    'Caída de personas al mismo nivel (resbalón, tropiezo)',
    'Caída de objetos o derrumbes sobre el trabajador',
    'Atrapamiento por o entre objetos o partes móviles de maquinarias',
    'Pisadas, choques o golpes por o contra objetos',
    'Sobreesfuerzo físico o falso movimiento biomecánico',
    'Exposición a temperaturas extremas (contacto térmico / fuego / frío)',
    'Contacto eléctrico directo o por arco eléctrico',
    'Contacto o inhalación de sustancias químicas / asfixia',
    'Accidente de tránsito o transporte vehicular (choferes / in itinere)',
    'Agresión por terceros o mordedura animal'
  ],

  agentesMaterialesSRT: [
    'Maquinarias fijas industriales y herramientas motrices',
    'Medios de transporte y autoelevadores / clarks / zorras',
    'Herramientas manuales no motorizadas',
    'Aparatos de izaje, grúas, puentes grúa y cables',
    'Instalaciones y tableros eléctricos bajo tensión',
    'Sustancias químicas peligrosas, inflamables o tóxicas',
    'Superficies de tránsito, pisos, desniveles y andamios',
    'Cargas, bultos y recipientes manipulados manualmente',
    'Factores ambientales (ruido, radiaciones, temperaturas extremas)'
  ],

  naturalezaLesionesSRT: [
    'Contusión, hematoma o golpe cerrado',
    'Herida cortante, incisa, punzante o laceración',
    'Fractura ósea cerrada o expuesta',
    'Luxación, esguince o desgarro muscular/ligamentario',
    'Traumatismo craneoencefálico (TEC) o conmoción cerebral',
    'Quemadura térmica, eléctrica o química',
    'Intoxicación aguda o asfixia respiratoria',
    'Cuerpo extraño en globo ocular',
    'Amputación traumática o avulsión de miembro',
    'Lumbalgia aguda o hernia discal por esfuerzo'
  ],

  partesCuerpoSRT: [
    'Cabeza / Cráneo / Rostro',
    'Ojos / Visión',
    'Cuello / Región Cervical',
    'Tronco / Espalda / Columna Lumbar',
    'Miembro Superior (Hombro, Brazo, Antebrazo, Codo)',
    'Mano / Muñeca / Dedos',
    'Miembro Inferior (Cadera, Muslo, Rodilla, Pierna)',
    'Pie / Tobillo / Dedos del pie',
    'Múltiples localizaciones / Sistémica'
  ],

  controlHierarchyMap: {
    eliminacion: { level: 1, label: '1. Eliminación del Peligro', tag: 'Eliminación' },
    sustitucion: { level: 2, label: '2. Sustitución', tag: 'Sustitución' },
    ingenieria: { level: 3, label: '3. Controles de Ingeniería (Guardas/Aislamiento)', tag: 'Ingeniería' },
    administrativo: { level: 4, label: '4. Controles Administrativos (POEs/Capacitación)', tag: 'Administrativo' },
    epp: { level: 5, label: '5. Elementos de Protección Personal (Res. SRT 299/11)', tag: 'EPP' }
  }
};

/**
 * Cálculo de Índices Oficiales de Siniestralidad (Res. S.R.T. N° 503/2014)
 * @param accidentsCount Cantidad de accidentes de trabajo con baja (días de ILT)
 * @param lostDays Total de jornadas laborales perdidas (días de baja médica)
 * @param hht Horas Hombre Trabajadas por la dotación en el período
 * @param dotacion Dotación total de trabajadores expuestos en nómina
 */
export function calculateSiniestralityRates(
  accidentsCount: number,
  lostDays: number,
  hht: number,
  dotacion: number
): SiniestralityIndicators {
  const safeHht = hht > 0 ? hht : 100000;
  const safeDotacion = dotacion > 0 ? dotacion : 10;
  const safeAccidents = accidentsCount >= 0 ? accidentsCount : 0;
  const safeLostDays = lostDays >= 0 ? lostDays : 0;

  // IF = (N° Accidentes con baja * 1.000.000) / HHT
  const ifRate = Number(((safeAccidents * 1000000) / safeHht).toFixed(2));

  // IG = (Días Perdidos * 1.000.000) / HHT
  const igRate = Number(((safeLostDays * 1000000) / safeHht).toFixed(2));

  // II = (N° Accidentes con baja * 1.000) / Dotación
  const iiRate = Number(((safeAccidents * 1000) / safeDotacion).toFixed(2));

  return {
    hhtTotal: safeHht,
    dotacionExpuesta: safeDotacion,
    diasIltEstimados: safeLostDays,
    indiceFrecuencia: ifRate,
    indiceGravedad: igRate,
    indiceIncidencia: iiRate
  };
}

/**
 * Evaluación técnico-legal de la investigación del siniestro conforme a la Res. S.R.T. N° 475/2006
 */
export function evaluateAccidentInvestigationCompliance(
  report: Partial<AccidentInvestigationProtocol>
): AccidentEvaluationResult {
  const alerts: string[] = [];
  const recommendations: string[] = [];

  const gravedad = report.gravedad || 'Leve';
  const isGraveOrMortal = gravedad === 'Grave' || gravedad === 'Mortal';
  let requiresImmediateSrtNotification = false;

  // 1. Verificación Res. S.R.T. N° 475/2006 (Accidentes Graves y Mortales)
  if (isGraveOrMortal) {
    requiresImmediateSrtNotification = true;
    alerts.push(
      '🚨 NOTIFICACIÓN OBLIGATORIA INMEDIATA (Res. S.R.T. N° 475/2006): Accidente clasificado como GRAVE o MORTAL. ' +
      'Debe cursarse denuncia fehaciente ante la Aseguradora de Riesgos del Trabajo (A.R.T.) dentro de las 48 horas de ocurrido ' +
      'y remitirse copia circunstanciada de la investigación a la Superintendencia de Riesgos del Trabajo.'
    );
  }

  // 2. Control de denuncia ART
  if (!report.numeroSiniestro || report.numeroSiniestro.trim() === '') {
    alerts.push('Falta asentar el Número de Siniestro / Denuncia ante la A.R.T. (Obligatorio Ley 24.557).');
  }

  // 3. Auditoría del Método del Árbol de Causas
  const porquesCount = (report.porques || []).filter(p => p && p.trim().length > 0).length;
  const hasRootCause = Boolean(
    (report.causaRaizIdentificada && report.causaRaizIdentificada.trim().length > 0) ||
    porquesCount >= 3 ||
    (report.arbolCausas && report.arbolCausas.some(n => n.esCausaRaiz))
  );

  if (!hasRootCause) {
    alerts.push(
      '⚠️ ANÁLISIS CAUSAL INCOMPLETO: El Método del Árbol de Causas (SRT) exige profundizar la cadena explicativa ' +
      'hasta identificar la Causa Raíz Sistémica u Organizacional (falla en procedimientos, mantenimiento o supervisión).'
    );
  }

  // 4. Auditoría del Plan de Acción Correctiva y Preventiva (CAPA)
  const validMedidas = (report.medidas || []).filter(m => m.accion && m.accion.trim().length > 0);
  const hasCapaAction = validMedidas.length > 0;

  if (!hasCapaAction) {
    alerts.push(
      '🛑 PLAN DE ACCIÓN VACÍO: La Res. SRT 475/2006 exige establecer medidas correctivas y preventivas con asignación de ' +
      'responsables y fechas límites perentorias.'
    );
  }

  // 5. Verificación de la Jerarquía de Controles
  const hasEngineeringControls = validMedidas.some(m =>
    m.jerarquia === 'eliminacion' || m.jerarquia === 'sustitucion' || m.jerarquia === 'ingenieria'
  );

  if (hasCapaAction && !hasEngineeringControls) {
    recommendations.push(
      '💡 Jerarquía de Controles: Se recomienda incorporar al menos una medida de Ingeniería o Eliminación/Sustitución en la fuente ' +
      'para evitar que la prevención descanse únicamente en la conducta humana o el uso de EPP.'
    );
  }

  // 6. Cálculo de Índices de Siniestralidad
  const accidentsCount = (gravedad === 'Leve' && (!report.diasIltEstimados || Number(report.diasIltEstimados) === 0)) ? 0 : 1;
  const lostDays = Number(report.diasIltEstimados) || 0;
  const hht = Number(report.hhtTotal) || 100000;
  const dotacion = Number(report.dotacionExpuesta) || 25;

  const indicators = calculateSiniestralityRates(accidentsCount, lostDays, hht, dotacion);

  // 7. Recomendaciones preventivas de cierre
  if (isGraveOrMortal) {
    recommendations.push('Efectuar reunión extraordinaria del Comité Mixto de Seguridad o convocar al Delegado de Personal para informar las conclusiones.');
    recommendations.push('Registrar la reinducción y reentrenamiento específico de todo el personal del sector antes del reinicio de las tareas.');
  } else {
    recommendations.push(`Índice de Frecuencia calculado: ${indicators.indiceFrecuencia} | Índice de Gravedad: ${indicators.indiceGravedad}.`);
    recommendations.push('Dar seguimiento al cumplimiento de las medidas correctivas en las fechas límites programadas.');
  }

  return {
    requiresImmediateSrtNotification,
    hasRootCause,
    hasCapaAction,
    hasEngineeringControls,
    indicators,
    alerts,
    recommendations
  };
}

