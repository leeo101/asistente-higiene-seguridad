import { describe, it, expect } from 'vitest';
import {
  calculatePermitValidityHours,
  evaluateWorkPermitCompliance,
  evaluateATSSafetyCompliance,
  OFFICIAL_WORK_PERMIT_REGULATORY_CRITERIA
} from '../srtProtocols';
import type { WorkPermitData, ATSSurvey } from '../../types/workPermit';

describe('Módulo 15 — Permisos de Trabajo (PT) y Análisis de Trabajo Seguro (ATS)', () => {
  describe('calculatePermitValidityHours', () => {
    it('calcula duración normal en el mismo día', () => {
      expect(calculatePermitValidityHours('08:00', '16:00')).toBe(8);
      expect(calculatePermitValidityHours('07:30', '17:00')).toBe(9.5);
    });

    it('calcula duración para turno noche que cruza medianoche', () => {
      expect(calculatePermitValidityHours('22:00', '06:00')).toBe(8);
    });

    it('retorna 0 ante datos vacíos o inválidos', () => {
      expect(calculatePermitValidityHours('', '18:00')).toBe(0);
      expect(calculatePermitValidityHours('abc', '18:00')).toBe(0);
    });
  });

  describe('evaluateWorkPermitCompliance — Permisos Críticos', () => {
    it('PT Altura con controles conformes y firmas completas -> LIBERADO', () => {
      const permit: Partial<WorkPermitData> = {
        tipoPermiso: 'altura',
        validezDesde: '08:00',
        validezHasta: '16:00',
        checklist: [
          { id: 1, pregunta: '¿Se verificó el estado de arneses y líneas de vida?', estado: 'Cumple' },
          { id: 2, pregunta: '¿Los puntos de anclaje son seguros y estructurales?', estado: 'Cumple' },
          { id: 3, pregunta: '¿Se delimitó el área inferior de caída de objetos?', estado: 'Cumple' }
        ],
        personal: [
          { id: 1, nombre: 'Juan Pérez', dni: '30123456', aptoMedicoVigente: true }
        ],
        operatorSignature: 'data:sig-op',
        supervisorSignature: 'data:sig-sup',
        professionalSignature: 'data:sig-pro'
      };

      const result = evaluateWorkPermitCompliance(permit);
      expect(result.verdict).toBe('LIBERADO');
      expect(result.isApproved).toBe(true);
      expect(result.isBlocked).toBe(false);
      expect(result.criticalNonCompliances.length).toBe(0);
      expect(result.hasRequiredSignatures).toBe(true);
    });

    it('PT Altura sin arnés o anclaje verificado -> BLOQUEADO (Res. SRT 61/23)', () => {
      const permit: Partial<WorkPermitData> = {
        tipoPermiso: 'altura',
        validezDesde: '08:00',
        validezHasta: '14:00',
        checklist: [
          { id: 1, pregunta: '¿Se verificó el estado de arneses y líneas de vida?', estado: 'No Cumple' },
          { id: 2, pregunta: '¿Los puntos de anclaje son seguros y estructurales?', estado: 'No Cumple' }
        ],
        operatorSignature: 'data:sig-op',
        supervisorSignature: 'data:sig-sup',
        professionalSignature: 'data:sig-pro'
      };

      const result = evaluateWorkPermitCompliance(permit);
      expect(result.verdict).toBe('BLOQUEADO');
      expect(result.isBlocked).toBe(true);
      expect(result.criticalNonCompliances.length).toBeGreaterThanOrEqual(1);
    });

    it('PT Espacio Confinado sin vigía o sin medición de atmósfera -> BLOQUEADO (Res. SRT 953/10)', () => {
      const permit: Partial<WorkPermitData> = {
        tipoPermiso: 'confinado',
        validezDesde: '08:00',
        validezHasta: '12:00',
        checklist: [
          { id: 1, pregunta: '¿Se realizó la medición de atmósfera (O2, LEL, CO)?', estado: 'No Cumple' },
          { id: 2, pregunta: '¿Existe un vigía permanente en el exterior?', estado: 'No Cumple' }
        ],
        operatorSignature: 'data:sig-op',
        supervisorSignature: 'data:sig-sup',
        professionalSignature: 'data:sig-pro'
      };

      const result = evaluateWorkPermitCompliance(permit);
      expect(result.verdict).toBe('BLOQUEADO');
      expect(result.criticalNonCompliances.some(c => c.toLowerCase().includes('atmós') || c.toLowerCase().includes('atmos'))).toBe(true);
      expect(result.criticalNonCompliances.some(c => c.toLowerCase().includes('vigía') || c.toLowerCase().includes('vigia'))).toBe(true);
    });

    it('PT Trabajo en Caliente sin extintor verificado -> BLOQUEADO (Dec. 351/79 Cap. 18)', () => {
      const permit: Partial<WorkPermitData> = {
        tipoPermiso: 'caliente',
        validezDesde: '09:00',
        validezHasta: '15:00',
        checklist: [
          { id: 1, pregunta: '¿Se dispone de extintor cargado en el lugar?', estado: 'No Cumple' },
          { id: 2, pregunta: '¿Se retiraron materiales combustibles en un radio de 10m?', estado: 'Cumple' }
        ],
        operatorSignature: 'data:sig-op',
        supervisorSignature: 'data:sig-sup',
        professionalSignature: 'data:sig-pro'
      };

      const result = evaluateWorkPermitCompliance(permit);
      expect(result.verdict).toBe('BLOQUEADO');
      expect(result.criticalNonCompliances.some(c => c.toLowerCase().includes('extintor'))).toBe(true);
    });

    it('PT Riesgo Eléctrico sin LOTO vinculado -> BLOQUEADO (Dec. 351/79 Anexo VI)', () => {
      const permit: Partial<WorkPermitData> = {
        tipoPermiso: 'electrico',
        validezDesde: '08:00',
        validezHasta: '12:00',
        lotoId: '',
        checklist: [
          { id: 1, pregunta: '¿Se verificó la ausencia de tensión?', estado: 'Cumple' }
        ],
        operatorSignature: 'data:sig-op',
        supervisorSignature: 'data:sig-sup',
        professionalSignature: 'data:sig-pro'
      };

      const result = evaluateWorkPermitCompliance(permit);
      expect(result.verdict).toBe('BLOQUEADO');
      expect(result.criticalNonCompliances.some(c => c.toLowerCase().includes('loto'))).toBe(true);
    });

    it('PT con validez mayor a 12 horas -> CONDICIONADO por exceso de jornada', () => {
      const permit: Partial<WorkPermitData> = {
        tipoPermiso: 'altura',
        validezDesde: '06:00',
        validezHasta: '20:00', // 14 horas
        checklist: [
          { id: 1, pregunta: '¿Se verificó el estado de arneses y líneas de vida?', estado: 'Cumple' },
          { id: 2, pregunta: '¿Los puntos de anclaje son seguros y estructurales?', estado: 'Cumple' }
        ],
        operatorSignature: 'data:sig-op',
        supervisorSignature: 'data:sig-sup',
        professionalSignature: 'data:sig-pro'
      };

      const result = evaluateWorkPermitCompliance(permit);
      expect(result.isShiftExceeded).toBe(true);
      expect(result.verdict).toBe('CONDICIONADO');
      expect(result.alerts.some(a => a.includes('VALIDEZ EXCEDIDA'))).toBe(true);
    });

    it('PT con firmas pendientes -> CONDICIONADO', () => {
      const permit: Partial<WorkPermitData> = {
        tipoPermiso: 'altura',
        validezDesde: '08:00',
        validezHasta: '14:00',
        checklist: [
          { id: 1, pregunta: '¿Se verificó el estado de arneses y líneas de vida?', estado: 'Cumple' },
          { id: 2, pregunta: '¿Los puntos de anclaje son seguros y estructurales?', estado: 'Cumple' }
        ],
        operatorSignature: 'data:sig-op',
        supervisorSignature: null,
        professionalSignature: null
      };

      const result = evaluateWorkPermitCompliance(permit);
      expect(result.hasRequiredSignatures).toBe(false);
      expect(result.missingSignatures).toContain('Supervisor de Trabajo');
      expect(result.missingSignatures).toContain('Responsable de Higiene y Seguridad');
      expect(result.verdict).toBe('CONDICIONADO');
    });

    it('PT con trabajador con Apto Médico vencido -> BLOQUEADO (Res. SRT 37/10)', () => {
      const permit: Partial<WorkPermitData> = {
        tipoPermiso: 'altura',
        validezDesde: '08:00',
        validezHasta: '14:00',
        checklist: [
          { id: 1, pregunta: '¿Se verificó el estado de arneses y líneas de vida?', estado: 'Cumple' }
        ],
        personal: [
          { id: 1, nombre: 'Carlos Gomez', dni: '28999888', aptoMedicoVigente: false }
        ],
        operatorSignature: 'data:sig-op',
        supervisorSignature: 'data:sig-sup',
        professionalSignature: 'data:sig-pro'
      };

      const result = evaluateWorkPermitCompliance(permit);
      expect(result.verdict).toBe('BLOQUEADO');
      expect(result.medicalFitnessAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateATSSafetyCompliance — Análisis de Trabajo Seguro', () => {
    it('ATS completo con controles de ingeniería y firmas -> CONFORME', () => {
      const ats: Partial<ATSSurvey> = {
        tarea: 'Montaje de estructura',
        tareas: [
          {
            paso: 'Montaje de andamio',
            riesgo: 'Vuelco y colapso',
            control: 'Instalación de durmientes de apoyo y barandas perimetrales',
            nivelRiesgo: 'Alto',
            jerarquiaControl: 'Ingenieria'
          },
          {
            paso: 'Ajuste de bulonería',
            riesgo: 'Caída de herramientas',
            control: 'Uso de cabo anticaída para herramientas y casco con barbijera',
            nivelRiesgo: 'Medio',
            jerarquiaControl: 'EPP'
          }
        ],
        operatorSignature: 'data:sig-op',
        capatazSignature: 'data:sig-cap'
      };

      const result = evaluateATSSafetyCompliance(ats);
      expect(result.dictamen).toBe('CONFORME');
      expect(result.totalSteps).toBe(2);
      expect(result.stepsWithControls).toBe(2);
      expect(result.engineeringControlsCount).toBeGreaterThanOrEqual(1);
    });

    it('ATS vacío o con pasos sin controles -> NO CONFORME', () => {
      const ats: Partial<ATSSurvey> = {
        tarea: 'Demolición',
        tareas: [
          {
            paso: 'Picar muro',
            riesgo: 'Proyección de escombros',
            control: '' // Sin control
          }
        ]
      };

      const result = evaluateATSSafetyCompliance(ats);
      expect(result.dictamen).toBe('NO CONFORME');
      expect(result.alerts.some(a => a.includes('ATS INCOMPLETO'))).toBe(true);
    });

    it('ATS con riesgo crítico sin controles de ingeniería -> OBSERVADO', () => {
      const ats: Partial<ATSSurvey> = {
        tarea: 'Trabajo en tejado',
        tareas: [
          {
            paso: 'Caminar sobre chapas',
            riesgo: 'Caída al vacío de 10 metros',
            control: 'Usar casco y botas', // Solo EPP ante riesgo crítico
            nivelRiesgo: 'Critico',
            jerarquiaControl: 'EPP'
          }
        ],
        operatorSignature: 'data:sig-op'
      };

      const result = evaluateATSSafetyCompliance(ats);
      expect(result.dictamen).toBe('OBSERVADO');
      expect(result.alerts.some(a => a.includes('JERARQUÍA DE CONTROL DÉBIL'))).toBe(true);
    });
  });
});
