import { describe, it, expect } from 'vitest';
import {
  calculateSiniestralityRates,
  evaluateAccidentInvestigationCompliance,
  OFFICIAL_ACCIDENT_REGULATORY_CRITERIA
} from '../srtProtocols';
import type { AccidentInvestigationProtocol } from '../../types/accident';

describe('Módulo de Investigación de Accidentes (Res. S.R.T. N° 475/2006, Res. 503/2014 y Árbol de Causas)', () => {
  describe('Criterios Normativos y Codificación Oficial OIT / SRT', () => {
    it('debe contener las 4 gravedades reglamentarias con sus descripciones', () => {
      const sev = OFFICIAL_ACCIDENT_REGULATORY_CRITERIA.severityLevelsMap;
      expect(sev.Leve.label).toContain('Sin baja');
      expect(sev.Moderado.label).toContain('Incapacidad Laboral Temporaria');
      expect(sev.Grave.label).toContain('Res. SRT 475/06');
      expect(sev.Mortal.label).toContain('Fallecimiento');
    });

    it('debe incluir las formas de accidente reglamentarias de la SRT', () => {
      const formas = OFFICIAL_ACCIDENT_REGULATORY_CRITERIA.formasAccidenteSRT;
      expect(formas.some(f => f.toLowerCase().includes('distinto nivel'))).toBe(true);
      expect(formas.some(f => f.toLowerCase().includes('atrapamiento'))).toBe(true);
      expect(formas.some(f => f.toLowerCase().includes('sobreesfuerzo'))).toBe(true);
      expect(formas.some(f => f.toLowerCase().includes('eléctrico'))).toBe(true);
    });

    it('debe incluir la jerarquía de 5 niveles de control de riesgos', () => {
      const hier = OFFICIAL_ACCIDENT_REGULATORY_CRITERIA.controlHierarchyMap;
      expect(hier.eliminacion.level).toBe(1);
      expect(hier.sustitucion.level).toBe(2);
      expect(hier.ingenieria.level).toBe(3);
      expect(hier.administrativo.level).toBe(4);
      expect(hier.epp.level).toBe(5);
    });
  });

  describe('Cálculo de Índices de Siniestralidad (Res. S.R.T. N° 503/2014)', () => {
    it('debe calcular exactamente los índices IF, IG e II según fórmulas SRT', () => {
      // 2 accidentes con baja, 30 días perdidos, 200.000 HHT, 50 operarios en dotación
      // IF = (2 * 1.000.000) / 200.000 = 10.00
      // IG = (30 * 1.000.000) / 200.000 = 150.00
      // II = (2 * 1.000) / 50 = 40.00
      const rates = calculateSiniestralityRates(2, 30, 200000, 50);
      expect(rates.indiceFrecuencia).toBe(10);
      expect(rates.indiceGravedad).toBe(150);
      expect(rates.indiceIncidencia).toBe(40);
    });

    it('debe manejar valores seguros y evitar división por cero', () => {
      const rates = calculateSiniestralityRates(0, 0, 0, 0);
      expect(rates.indiceFrecuencia).toBe(0);
      expect(rates.indiceGravedad).toBe(0);
      expect(rates.indiceIncidencia).toBe(0);
      expect(rates.hhtTotal).toBeGreaterThan(0);
      expect(rates.dotacionExpuesta).toBeGreaterThan(0);
    });
  });

  describe('Evaluación de Cumplimiento Res. S.R.T. N° 475/2006', () => {
    it('debe activar la notificación obligatoria inmediata para accidentes GRAVES', () => {
      const result = evaluateAccidentInvestigationCompliance({
        gravedad: 'Grave',
        numeroSiniestro: 'SIN-123456',
        problemaCentral: 'Caída desde andamio',
        porques: ['Falta baranda', 'Tablón suelto', 'Falla en procedimiento de armado'],
        medidas: [{
          accion: 'Instalar barandas reglamentarias',
          jerarquia: 'ingenieria',
          responsable: 'Jefe de Mantenimiento',
          fechaLimite: '2026-09-30'
        }]
      });

      expect(result.requiresImmediateSrtNotification).toBe(true);
      expect(result.alerts.some(a => a.includes('NOTIFICACIÓN OBLIGATORIA INMEDIATA (Res. S.R.T. N° 475/2006)'))).toBe(true);
      expect(result.hasRootCause).toBe(true);
      expect(result.hasCapaAction).toBe(true);
      expect(result.hasEngineeringControls).toBe(true);
    });

    it('debe alertar cuando falta asentar el número de siniestro ante la ART', () => {
      const result = evaluateAccidentInvestigationCompliance({
        gravedad: 'Moderado',
        numeroSiniestro: '', // Falta
        porques: ['Hecho 1', 'Hecho 2', 'Causa raíz'],
        medidas: [{ accion: 'Medida 1', jerarquia: 'administrativo', responsable: 'Sup', fechaLimite: '2026-10-01' }]
      });

      expect(result.alerts.some(a => a.includes('Número de Siniestro'))).toBe(true);
    });

    it('debe alertar si el análisis causal está incompleto o carece de causa raíz', () => {
      const result = evaluateAccidentInvestigationCompliance({
        gravedad: 'Leve',
        numeroSiniestro: 'SIN-888',
        porques: ['Solo un hecho superficial'],
        causaRaizIdentificada: '',
        medidas: [{ accion: 'Uso de guantes', jerarquia: 'epp', responsable: 'Op', fechaLimite: '2026-10-01' }]
      });

      expect(result.hasRootCause).toBe(false);
      expect(result.alerts.some(a => a.includes('ANÁLISIS CAUSAL INCOMPLETO'))).toBe(true);
    });

    it('debe recomendar medidas de ingeniería si el plan solo incluye EPP o controles administrativos', () => {
      const result = evaluateAccidentInvestigationCompliance({
        gravedad: 'Moderado',
        numeroSiniestro: 'SIN-999',
        porques: ['Falta EPP', 'No usó guante', 'Falla de supervisión'],
        medidas: [{ accion: 'Capacitar en uso de EPP', jerarquia: 'administrativo', responsable: 'H&S', fechaLimite: '2026-10-01' }]
      });

      expect(result.hasEngineeringControls).toBe(false);
      expect(result.recommendations.some(r => r.includes('Jerarquía de Controles'))).toBe(true);
    });
  });
});
