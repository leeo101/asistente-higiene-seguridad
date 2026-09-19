import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_CONFINED_SPACE_ATMOSPHERIC_LIMITS,
  evaluateAtmosphericConditions,
  evaluateConfinedSpaceReadiness
} from '../srtProtocols';

describe('Módulo de Espacios Confinados — Res. S.R.T. N° 953/10 & Res. MTEySS 295/03', () => {
  it('debe contener los límites reglamentarios argentinos oficiales con CO a 25 ppm', () => {
    expect(OFFICIAL_CONFINED_SPACE_ATMOSPHERIC_LIMITS.o2.min).toBe(19.5);
    expect(OFFICIAL_CONFINED_SPACE_ATMOSPHERIC_LIMITS.o2.max).toBe(23.5);
    expect(OFFICIAL_CONFINED_SPACE_ATMOSPHERIC_LIMITS.lel.max).toBe(10);
    expect(OFFICIAL_CONFINED_SPACE_ATMOSPHERIC_LIMITS.co.max).toBe(25); // Res. 295/03 Anexo IV
    expect(OFFICIAL_CONFINED_SPACE_ATMOSPHERIC_LIMITS.h2s.max).toBe(10); // Res. 295/03 Anexo IV
  });

  it('debe aprobar una atmósfera segura con parámetros normales', () => {
    const safeReading = {
      o2: 20.9,
      lel: 0,
      co: 2,
      h2s: 0,
      stratum: 'general' as const
    };

    const result = evaluateAtmosphericConditions(safeReading);
    expect(result.status).toBe('APROBADO_SEGURO');
    expect(result.isSafeToEnter).toBe(true);
    expect(result.warnings.length).toBe(0);
    expect(result.details.o2Status).toBe('NORMAL');
    expect(result.details.lelStatus).toBe('SEGURO');
    expect(result.details.coStatus).toBe('SEGURO');
    expect(result.details.h2sStatus).toBe('SEGURO');
  });

  it('debe prohibir ingreso por deficiencia crítica de oxígeno (O2 < 19.5%) o enriquecimiento (O2 > 23.5%)', () => {
    // Atmósfera asfixiante
    const deficientO2 = evaluateAtmosphericConditions({ o2: 17.5, lel: 0, co: 0, h2s: 0 });
    expect(deficientO2.isSafeToEnter).toBe(false);
    expect(deficientO2.details.o2Status).toBe('DEFICIENTE');
    expect(deficientO2.status).toBe('CRITICO_PROHIBIDO_INGRESO');

    // Atmósfera enriquecida
    const enrichedO2 = evaluateAtmosphericConditions({ o2: 24.5, lel: 0, co: 0, h2s: 0 });
    expect(enrichedO2.isSafeToEnter).toBe(false);
    expect(enrichedO2.details.o2Status).toBe('ENRIQUECIDO');
    expect(deficientO2.status).toBe('CRITICO_PROHIBIDO_INGRESO');
  });

  it('debe prohibir ingreso por explosividad (LEL > 10%)', () => {
    const explosiveReading = evaluateAtmosphericConditions({ o2: 20.9, lel: 12, co: 0, h2s: 0 });
    expect(explosiveReading.isSafeToEnter).toBe(false);
    expect(explosiveReading.details.lelStatus).toBe('PELIGROSO');
    expect(explosiveReading.status).toBe('CRITICO_PROHIBIDO_INGRESO');
  });

  it('debe alertar y no autorizar si el CO supera 25 ppm (límite Res. 295/03) o H2S supera 10 ppm', () => {
    // CO a 30 ppm (en OSHA antigua era permitido hasta 35, pero en Argentina Res. 295/03 CMP es 25)
    const toxicCO = evaluateAtmosphericConditions({ o2: 20.9, lel: 2, co: 30, h2s: 0 });
    expect(toxicCO.isSafeToEnter).toBe(false);
    expect(toxicCO.details.coStatus).toBe('SUPERA_CMP');

    // H2S a 15 ppm
    const toxicH2S = evaluateAtmosphericConditions({ o2: 20.9, lel: 0, co: 0, h2s: 15 });
    expect(toxicH2S.isSafeToEnter).toBe(false);
    expect(toxicH2S.details.h2sStatus).toBe('SUPERA_CMP');
  });

  it('debe validar la preparación completa para emitir el permiso (LOTO, ventilación, vigía y rescate)', () => {
    const safeAtmosphere = evaluateAtmosphericConditions({ o2: 20.9, lel: 0, co: 0, h2s: 0 });

    const isolationOk = {
      valvesClosedAndLocked: true,
      blindFlangesInstalled: true,
      electricalLockoutApplied: true,
      linesPurgedAndCleaned: true,
      mechanicalDrivesDeenergized: true
    };

    const ventilationOk = {
      type: 'forced_positive' as const,
      isOperatingContinuously: true,
      sufficientVentilation: true
    };

    const rescueOk = {
      tripodAndWinchAvailable: true,
      fullBodyHarnessClassAorE: true,
      retractableLifeline: true,
      standbySCBAAvailable: true,
      directCommunicationTested: true,
      firstAidKitReady: true
    };

    // Todo listo
    const readyResult = evaluateConfinedSpaceReadiness(
      safeAtmosphere,
      isolationOk,
      ventilationOk,
      rescueOk,
      true // vigía asignado
    );
    expect(readyResult.isPermitIssuable).toBe(true);
    expect(readyResult.blockers.length).toBe(0);

    // Sin vigía exterior asignado -> bloquea
    const noAttendant = evaluateConfinedSpaceReadiness(
      safeAtmosphere,
      isolationOk,
      ventilationOk,
      rescueOk,
      false
    );
    expect(noAttendant.isPermitIssuable).toBe(false);
    expect(noAttendant.blockers.some(b => b.includes('vigía'))).toBe(true);

    // Con LOTO incompleto -> bloquea
    const badIsolation = evaluateConfinedSpaceReadiness(
      safeAtmosphere,
      { ...isolationOk, valvesClosedAndLocked: false },
      ventilationOk,
      rescueOk,
      true
    );
    expect(badIsolation.isPermitIssuable).toBe(false);
    expect(badIsolation.blockers.some(b => b.includes('LOTO'))).toBe(true);
  });
});
