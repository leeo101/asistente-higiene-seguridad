import { describe, it, expect } from 'vitest';
import {
  evaluateMedicalFitnessCompliance,
  OFFICIAL_MEDICAL_APTITUDE_REGULATORY_CRITERIA
} from '../srtProtocols';
import type { MedicalRecord } from '../../types/medical';

describe('Módulo de Aptitudes Médicas Laborales (Res. S.R.T. N° 37/10 y Ley 19.587)', () => {
  describe('Criterios Normativos y Mapeos Oficiales', () => {
    it('debe contener los 5 tipos oficiales de exámenes médicos en salud', () => {
      const types = OFFICIAL_MEDICAL_APTITUDE_REGULATORY_CRITERIA.examTypesMap;
      expect(types.preocupacional).toContain('Art. 2°');
      expect(types.periodico).toContain('Art. 3°');
      expect(types.transferencia).toContain('Art. 4°');
      expect(types.ausencia_prolongada).toContain('Art. 5°');
      expect(types.egreso).toContain('Art. 6°');
    });

    it('debe contener los 5 dictámenes oficiales de aptitud médica laboral', () => {
      const verdicts = OFFICIAL_MEDICAL_APTITUDE_REGULATORY_CRITERIA.verdictsMap;
      expect(verdicts.apto).toContain('Sin patologías');
      expect(verdicts.apto_con_preexistencias).toContain('Preexistencias');
      expect(verdicts.apto_con_restricciones).toContain('Restricciones');
      expect(verdicts.no_apto).toContain('No Apto');
      expect(verdicts.no_apto_temporario).toContain('No Apto Temporario');
    });

    it('debe incluir las prohibiciones taxativas de test de embarazo y VIH', () => {
      const prohib = OFFICIAL_MEDICAL_APTITUDE_REGULATORY_CRITERIA.legalProhibitions;
      expect(prohib.some(p => p.toLowerCase().includes('embarazo'))).toBe(true);
      expect(prohib.some(p => p.toLowerCase().includes('vih'))).toBe(true);
    });
  });

  describe('Evaluación de Vigencia Temporal y Vencimientos', () => {
    it('debe catalogar como vigente un certificado con vencimiento a más de 30 días', () => {
      const futureDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const result = evaluateMedicalFitnessCompliance({
        workerName: 'Esteban Morales',
        dni: '20-33458912-4',
        result: 'apto',
        expirationDate: futureDate,
        doctor: 'Dr. Alejandro Bianchi'
      });

      expect(result.isExpired).toBe(false);
      expect(result.urgencyStatus).toBe('vigente');
      expect(result.isFitForTask).toBe(true);
      expect(result.daysUntilExpiration).toBeGreaterThan(30);
    });

    it('debe alertar como por vencer un certificado con vencimiento dentro de los 30 días', () => {
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const result = evaluateMedicalFitnessCompliance({
        workerName: 'Carlos Martínez',
        dni: '20-35894120-7',
        result: 'apto',
        expirationDate: soonDate,
        doctor: 'Dr. Alejandro Bianchi'
      });

      expect(result.isExpired).toBe(false);
      expect(result.urgencyStatus).toBe('por_vencer');
      expect(result.isFitForTask).toBe(true);
      expect(result.alerts.some(a => a.includes('PRÓXIMO A VENCER'))).toBe(true);
    });

    it('debe deshabilitar al trabajador e indicar vencido si la fecha expiró', () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const result = evaluateMedicalFitnessCompliance({
        workerName: 'Diego Navarro',
        dni: '20-38491024-3',
        result: 'apto',
        expirationDate: pastDate,
        doctor: 'Dr. Alejandro Bianchi'
      });

      expect(result.isExpired).toBe(true);
      expect(result.urgencyStatus).toBe('vencido');
      expect(result.isFitForTask).toBe(false);
      expect(result.requiresImmediateAction).toBe(true);
      expect(result.alerts.some(a => a.includes('CERTIFICADO VENCIDO'))).toBe(true);
    });
  });

  describe('Evaluación de Dictámenes y Coherencia Clínica', () => {
    const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    it('debe deshabilitar inmediatamente al operario en dictamen NO APTO', () => {
      const result = evaluateMedicalFitnessCompliance({
        workerName: 'Juan Desconocido',
        dni: '20-22333444-5',
        result: 'no_apto',
        expirationDate: futureDate,
        doctor: 'Dra. Romina Ferreyra'
      });

      expect(result.isFitForTask).toBe(false);
      expect(result.requiresImmediateAction).toBe(true);
      expect(result.alerts.some(a => a.includes('DICTAMEN NO APTO'))).toBe(true);
    });

    it('debe detectar contradicción clínica si un NO APTO tiene habilitación para tareas de alto riesgo', () => {
      const result = evaluateMedicalFitnessCompliance({
        workerName: 'Mario Gómez',
        dni: '20-33444555-6',
        result: 'no_apto',
        allowHeight: true, // Inconsistencia grave
        expirationDate: futureDate,
        doctor: 'Dra. Romina Ferreyra'
      });

      expect(result.alerts.some(a => a.includes('CONTRADICCIÓN CLÍNICA CRÍTICA'))).toBe(true);
    });

    it('debe exigir detalle de restricciones cuando el dictamen es Apto con Restricciones', () => {
      const withoutDetail = evaluateMedicalFitnessCompliance({
        workerName: 'Roberto Álvarez',
        dni: '20-34981204-5',
        result: 'apto_con_restricciones',
        restricciones: '',
        expirationDate: futureDate,
        doctor: 'Dra. Romina Ferreyra'
      });

      expect(withoutDetail.alerts.some(a => a.includes('FALTA DETALLE DE RESTRICCIONES'))).toBe(true);

      const withDetail = evaluateMedicalFitnessCompliance({
        workerName: 'Roberto Álvarez',
        dni: '20-34981204-5',
        result: 'apto_con_restricciones',
        restricciones: 'No manipular cargas superiores a 10 kg',
        expirationDate: futureDate,
        doctor: 'Dra. Romina Ferreyra'
      });

      expect(withDetail.alerts.some(a => a.includes('FALTA DETALLE DE RESTRICCIONES'))).toBe(false);
      expect(withDetail.recommendations.some(r => r.includes('No manipular cargas'))).toBe(true);
    });

    it('debe exigir asiento de preexistencias cuando el dictamen es Apto con Preexistencias', () => {
      const result = evaluateMedicalFitnessCompliance({
        workerName: 'Lucía Romero',
        dni: '27-36192834-2',
        result: 'apto_con_preexistencias',
        preexistencias: '',
        expirationDate: futureDate,
        doctor: 'Dra. Romina Ferreyra'
      });

      expect(result.alerts.some(a => a.includes('FALTA ASIENTO DE PREEXISTENCIAS'))).toBe(true);
    });
  });
});
