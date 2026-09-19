import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_HEIGHT_REGULATORY_LIMITS,
  calculateFallClearanceDistance,
  evaluateHeightWorkSafety
} from '../srtProtocols';

describe('Módulo de Trabajo en Altura — Res. S.R.T. N° 61/23 & Dec. 911/96', () => {
  it('debe contener los límites reglamentarios argentinos oficiales (2.00m, 22 kN anclaje, 35 km/h viento)', () => {
    expect(OFFICIAL_HEIGHT_REGULATORY_LIMITS.minHeightThresholdM).toBe(2.0); // Dec. 911/96 Art. 54 y Res. SRT 61/23
    expect(OFFICIAL_HEIGHT_REGULATORY_LIMITS.anchorMinCapacityKn).toBe(22.0); // IRAM 3626 (22 kN / 5000 lbs)
    expect(OFFICIAL_HEIGHT_REGULATORY_LIMITS.maxSafeWindSpeedKmh).toBe(35.0); // Res. SRT 61/23
  });

  it('debe calcular correctamente la Distancia Libre de Caída (DLC) estándar', () => {
    const params = {
      lanyardLengthM: 1.8,
      deceleratorDistanceM: 1.2,
      workerHeightM: 1.5,
      safetyMarginM: 1.0,
      availableFallHeightM: 6.0
    };

    const result = calculateFallClearanceDistance(params, 1);
    // 1.8 + 1.2 + 1.5 + 1.0 = 5.5 m
    expect(result.requiredClearanceM).toBe(5.5);
    expect(result.safetyMarginRemainingM).toBe(0.5);
    expect(result.isClearanceSafe).toBe(true);
  });

  it('debe advertir y marcar inseguro cuando la altura disponible es menor al DLC requerido', () => {
    // Si la persona trabaja a 4 metros con cabo de 1.8m y absorbedor de 1.2m, el DLC es 5.5m. Chocaría contra el piso.
    const dangerousParams = {
      lanyardLengthM: 1.8,
      deceleratorDistanceM: 1.2,
      workerHeightM: 1.5,
      safetyMarginM: 1.0,
      availableFallHeightM: 4.0
    };

    const result = calculateFallClearanceDistance(dangerousParams, 1);
    expect(result.isClearanceSafe).toBe(false);
    expect(result.safetyMarginRemainingM).toBe(-1.5);
    expect(result.warning).toBeDefined();
    expect(result.recommendation).toContain('retráctil');
  });

  it('debe evaluar integralmente la seguridad del permiso y detectar bloqueos críticos', () => {
    const validClearance = calculateFallClearanceDistance({
      lanyardLengthM: 1.8,
      deceleratorDistanceM: 1.2,
      workerHeightM: 1.5,
      safetyMarginM: 1.0,
      availableFallHeightM: 7.0
    });

    const goodHarness = {
      webbingFreeOfCutsOrBurns: true,
      stitchingIntact: true,
      dRingUndamaged: true,
      bucklesOperateCorrectly: true,
      impactIndicatorNotTripped: true,
      lanyardDoubleWithAbsorber: true
    };

    const goodWeather = {
      windSpeedKmh: 15,
      hasRainOrThunderstorm: false,
      isSurfaceSlippery: false
    };

    // Caso 100% aprobado
    const safeEval = evaluateHeightWorkSafety({
      workHeightMeters: 6.5,
      medicalFitnessOk: true,
      anchorCapacityKn: 22,
      anchorType: 'certified_structural_22kn',
      clearance: validClearance,
      harness: goodHarness,
      weather: goodWeather,
      rescuePlanDefined: true
    });
    expect(safeEval.isAuthorized).toBe(true);
    expect(safeEval.criticalBlockers.length).toBe(0);

    // Caso con viento excesivo (> 35 km/h)
    const windyEval = evaluateHeightWorkSafety({
      workHeightMeters: 6.5,
      medicalFitnessOk: true,
      anchorCapacityKn: 22,
      anchorType: 'certified_structural_22kn',
      clearance: validClearance,
      harness: goodHarness,
      weather: { ...goodWeather, windSpeedKmh: 42 },
      rescuePlanDefined: true
    });
    expect(windyEval.isAuthorized).toBe(false);
    expect(windyEval.criticalBlockers.some(b => b.includes('Viento'))).toBe(true);

    // Caso con arnés impactado previamente
    const badHarnessEval = evaluateHeightWorkSafety({
      workHeightMeters: 6.5,
      medicalFitnessOk: true,
      anchorCapacityKn: 22,
      anchorType: 'certified_structural_22kn',
      clearance: validClearance,
      harness: { ...goodHarness, impactIndicatorNotTripped: false },
      weather: goodWeather,
      rescuePlanDefined: true
    });
    expect(badHarnessEval.isAuthorized).toBe(false);
    expect(badHarnessEval.criticalBlockers.some(b => b.includes('testigo'))).toBe(true);
  });
});
