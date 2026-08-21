import { describe, it, expect } from 'vitest';
import { evaluatePATMeasurement, evaluateLightingMeasurement, calculateNoiseDose } from '../srtProtocols';
import { calculateExecutiveKPIs } from '../safetyMetrics';
import { createCAPAFromFinding } from '../capaWorkflow';

describe('Res. SRT Protocol Calculators', () => {
  it('debe evaluar correctamente una medición de Puesta a Tierra (Res. SRT 900/15)', () => {
    const resOK = evaluatePATMeasurement({
      pointId: 'PAT-01',
      location: 'Tablero General',
      resistanceValueOhms: 3.5,
      continuityVerified: true,
      differentialSwitchTest: true
    });
    expect(resOK.isCompliant).toBe(true);
    expect(resOK.statusText).toBe('Conforme');

    const resFail = evaluatePATMeasurement({
      pointId: 'PAT-02',
      location: 'Depósito',
      resistanceValueOhms: 15.2,
      continuityVerified: true,
      differentialSwitchTest: true
    });
    expect(resFail.isCompliant).toBe(false);
    expect(resFail.statusText).toBe('No Conforme (Resistencia Alta)');
  });

  it('debe evaluar la iluminación media según Dec. 351/79 (Res. SRT 84/12)', () => {
    const res = evaluateLightingMeasurement([350, 400, 320, 380], 'Oficinas / Tareas Normales');
    expect(res.isCompliant).toBe(true);
    expect(res.avgLux).toBeGreaterThanOrEqual(300);
  });

  it('debe calcular la dosis diaria de ruido (Res. SRT 85/12)', () => {
    const dose = calculateNoiseDose([
      { exposureTimeHours: 4, measuredLAeq: 85 }, // 50% dosis
      { exposureTimeHours: 2, measuredLAeq: 88 }  // 50% dosis
    ]);
    expect(dose.totalDosePercent).toBe(100);
    expect(dose.isExceeded).toBe(false);
  });
});

describe('Safety Executive KPIs & CAPA Workflow', () => {
  it('debe calcular el Índice de Frecuencia (IF) e Índice de Gravedad (IG)', () => {
    const kpis = calculateExecutiveKPIs({
      accidentsCount: 2,
      daysLostCount: 10,
      totalWorkersCount: 100,
      workedHoursMonth: 16000
    });
    expect(kpis.indiceFrecuencia).toBe(125); // (2 * 1000000) / 16000 = 125
    expect(kpis.indiceGravedad).toBe(625);   // (10 * 1000000) / 16000 = 625
  });

  it('debe generar una CAPA desde un hallazgo', () => {
    const capa = createCAPAFromFinding({
      title: 'Extintor despresurizado en Pasillo B',
      description: 'Manómetro marca zona roja',
      sourceModule: 'extingushers',
      severity: 'Alta'
    });

    expect(capa.id).toMatch(/^CAPA-/);
    expect(capa.status).toBe('Pendiente');
    expect(capa.severity).toBe('Alta');
  });
});
