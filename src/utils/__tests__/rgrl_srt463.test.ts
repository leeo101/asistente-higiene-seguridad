import { describe, it, expect } from 'vitest';
import {
  getDefaultQuestionsForAnnex,
  calculateRGRLMetrics,
  generatePlanRegularizacion
} from '../rgrlEngine';
import {
  OFFICIAL_RGRL_REGULATORY_CRITERIA,
  evaluateRgrlSurveySafety
} from '../srtProtocols';
import type { RGRLSurvey } from '../../types/rgrl';

describe('Módulo RGRL — Resoluciones S.R.T. N° 463/09, 529/09 y 74/10', () => {
  it('debe contener las referencias normativas y umbrales reglamentarios oficiales', () => {
    expect(OFFICIAL_RGRL_REGULATORY_CRITERIA.normativeReferences).toContain('463/09');
    expect(OFFICIAL_RGRL_REGULATORY_CRITERIA.thresholds.optimoMinPercent).toBe(90);
    expect(OFFICIAL_RGRL_REGULATORY_CRITERIA.thresholds.aceptableMinPercent).toBe(75);
    expect(OFFICIAL_RGRL_REGULATORY_CRITERIA.resolutionMap.anexo1_351).toContain('351/79');
    expect(OFFICIAL_RGRL_REGULATORY_CRITERIA.resolutionMap.anexo2_911).toContain('911/96');
    expect(OFFICIAL_RGRL_REGULATORY_CRITERIA.resolutionMap.anexo3_617).toContain('617/97');
  });

  it('debe inicializar correctamente los cuestionarios para cada Anexo legal', () => {
    const q351 = getDefaultQuestionsForAnnex('anexo1_351');
    const q911 = getDefaultQuestionsForAnnex('anexo2_911');
    const q617 = getDefaultQuestionsForAnnex('anexo3_617');

    expect(q351.length).toBeGreaterThan(15);
    expect(q911.length).toBeGreaterThan(5);
    expect(q617.length).toBeGreaterThan(5);

    // Todos inicializados con estado CUMPLE
    expect(q351.every(q => q.estado === 'CUMPLE')).toBe(true);
  });

  it('debe calcular métricas del RGRL excluyendo adecuadamente los ítems NO APLICA', () => {
    const items = getDefaultQuestionsForAnnex('anexo1_351');
    // 20 ítems aprox:
    // Marcamos 2 como NO_CUMPLE y 2 como NO_APLICA
    items[0].estado = 'NO_CUMPLE';
    items[1].estado = 'NO_CUMPLE';
    items[2].estado = 'NO_APLICA';
    items[3].estado = 'NO_APLICA';

    const metrics = calculateRGRLMetrics(items);
    expect(metrics.noCumpleCount).toBe(2);
    expect(metrics.noAplicaCount).toBe(2);
    expect(metrics.evaluablesCount).toBe(items.length - 2);

    const expectedPercent = Math.round((metrics.cumpleCount / metrics.evaluablesCount) * 100);
    expect(metrics.porcentajeCumplimiento).toBe(expectedPercent);
  });

  it('debe generar el Plan de Regularización ante la ART para ítems con NO_CUMPLE', () => {
    const items = getDefaultQuestionsForAnnex('anexo1_351');
    items[4].estado = 'NO_CUMPLE';
    items[4].codigo = '5.1';
    items[4].observacion = 'Protocolo de puesta a tierra vencido.';

    const metrics = calculateRGRLMetrics(items);
    const plan = generatePlanRegularizacion(metrics.itemsNoCumple, 45);

    expect(plan).toHaveLength(1);
    expect(plan[0].codigo).toBe('5.1');
    expect(plan[0].plazoEstimadoDias).toBe(45);
    expect(plan[0].medidaCorrectiva).toContain('puesta a tierra');
    expect(plan[0].fechaLimite).toBeDefined();
  });

  it('debe evaluar integralmente la auditoría y detectar deficiencias críticas y estado general', () => {
    const items = getDefaultQuestionsForAnnex('anexo1_351');
    // Puesta a tierra y disyuntor en NO CUMPLE (críticos)
    items.find(i => i.codigo === '5.1')!.estado = 'NO_CUMPLE';
    items.find(i => i.codigo === '5.2')!.estado = 'NO_CUMPLE';

    const survey: Partial<RGRLSurvey> = {
      cuit: '30-71234567-9',
      artNombre: 'La Segunda ART',
      profesionalHySNombre: 'Lic. Juan Pérez',
      anexo: 'anexo1_351',
      items
    };

    const evalResult = evaluateRgrlSurveySafety(survey);
    expect(evalResult.criticalDeficiencies.length).toBeGreaterThanOrEqual(2);
    expect(evalResult.alerts.some(a => a.includes('no conformidades de alto impacto'))).toBe(true);
    expect(evalResult.recommendations.length).toBeGreaterThan(0);
  });

  it('debe clasificar el cumplimiento como Crítico si es menor al 75%', () => {
    const items = getDefaultQuestionsForAnnex('anexo2_911'); // p. ej. 10 items
    // Marcamos la mitad como NO_CUMPLE
    for (let i = 0; i < 5; i++) {
      items[i].estado = 'NO_CUMPLE';
    }

    const survey: Partial<RGRLSurvey> = {
      cuit: '30-11111111-1',
      artNombre: 'Prevención ART',
      profesionalHySNombre: 'Ing. Seguridad',
      anexo: 'anexo2_911',
      items
    };

    const evalResult = evaluateRgrlSurveySafety(survey);
    expect(evalResult.compliancePercent).toBeLessThan(75);
    expect(evalResult.estadoGeneral).toBe('Crítico (< 75%)');
    expect(evalResult.isCompliant).toBe(false);
    expect(evalResult.recommendations[0]).toContain('ESTADO CRÍTICO');
  });
});
