import { describe, it, expect } from 'vitest';
import {
  calculateTrainingManHours,
  detectMandatoryTrainingTopic,
  evaluateTrainingSessionCompliance,
  evaluateAnnualTrainingPlanCompliance,
  OFFICIAL_TRAINING_REGULATORY_CRITERIA
} from '../srtProtocols';
import type { TrainingSession } from '../../types/training';
import { MANDATORY_TRAINING_TOPICS } from '../../types/training';

describe('Módulo 16 — Plan de Capacitación Anual (Res. SRT 905/15 & Dec. 351/79 Cap. 21)', () => {
  describe('calculateTrainingManHours', () => {
    it('calcula Horas-Hombre de Capacitación (HHC) correctamente', () => {
      expect(calculateTrainingManHours(10, 1.5)).toBe(15);
      expect(calculateTrainingManHours(25, '2.0')).toBe(50);
      expect(calculateTrainingManHours(0, 2)).toBe(0);
      expect(calculateTrainingManHours(10, 0)).toBe(0);
      expect(calculateTrainingManHours(10, -1)).toBe(0);
      expect(calculateTrainingManHours(10, 'invalido')).toBe(0);
    });
  });

  describe('detectMandatoryTrainingTopic', () => {
    it('detecta correctamente las 6 temáticas obligatorias por palabras clave', () => {
      expect(detectMandatoryTrainingTopic('Uso de extintores y rol de evacuación')).toBe('incendio_evacuacion');
      expect(detectMandatoryTrainingTopic('Primeros Auxilios básicos y RCP en obra')).toBe('primeros_auxilios');
      expect(detectMandatoryTrainingTopic('Uso, cuidado y limitaciones de EPP')).toBe('epp');
      expect(detectMandatoryTrainingTopic('Riesgo eléctrico y Cinco Reglas de Oro')).toBe('electrico');
      expect(detectMandatoryTrainingTopic('Ergonomía y levantamiento manual de cargas')).toBe('ergonomia');
      expect(detectMandatoryTrainingTopic('Manipulación de químicos y rotulado SGA')).toBe('quimico');
      expect(detectMandatoryTrainingTopic('Inducción general a la empresa')).toBeNull();
    });

    it('detecta temática obligatoria a partir del objetivo si el tema es genérico', () => {
      expect(detectMandatoryTrainingTopic('Taller operativo', 'Enseñar el uso correcto del matafuego y brigada')).toBe('incendio_evacuacion');
      expect(detectMandatoryTrainingTopic('Capacitación mensual', 'Prevención de trastornos musculoesqueléticos y posturas')).toBe('ergonomia');
    });
  });

  describe('evaluateTrainingSessionCompliance', () => {
    it('sesión válida con expositor matriculado y eficacia aprobada -> CONFORME', () => {
      const session: Partial<TrainingSession> = {
        fecha: '2026-08-15',
        tema: 'Prevención de Incendios y Manejo de Matafuegos',
        tipoCapacitacion: 'Emergencias',
        duracion: 2.0,
        expositor: 'Lic. Juan Manuel Paz',
        matriculaExpositor: 'COPIME Mat. 12345',
        asistentes: [
          { nombre: 'Carlos Gomez', dni: '30111222', puesto: 'Operario', nota: 9, firma: true },
          { nombre: 'María Lopez', dni: '28333444', puesto: 'Supervisora', nota: 10, firma: true }
        ]
      };

      const result = evaluateTrainingSessionCompliance(session);
      expect(result.dictamen).toBe('CONFORME');
      expect(result.manHours).toBe(4);
      expect(result.totalAttendees).toBe(2);
      expect(result.passedAttendees).toBe(2);
      expect(result.averageScore).toBe(9.5);
      expect(result.hasMatricula).toBe(true);
      expect(result.detectedMandatoryTopic).toBe('incendio_evacuacion');
    });

    it('sesión sin asistentes o con duración 0 -> NO CONFORME', () => {
      const session: Partial<TrainingSession> = {
        tema: 'Charla de seguridad',
        duracion: 0,
        expositor: 'Pedro Perez',
        asistentes: []
      };

      const result = evaluateTrainingSessionCompliance(session);
      expect(result.dictamen).toBe('NO CONFORME');
      expect(result.alerts.length).toBeGreaterThanOrEqual(2);
    });

    it('sesión con duración menor a 30 min o mayor a 8 hs emite alertas específicas', () => {
      const shortSession = evaluateTrainingSessionCompliance({
        tema: 'Charla rápida',
        duracion: 0.2, // 12 min
        expositor: 'Juan',
        asistentes: [{ nombre: 'A', dni: '1' }]
      });
      expect(shortSession.alerts.some(a => a.includes('mínimo reglamentario de 30 minutos'))).toBe(true);

      const longSession = evaluateTrainingSessionCompliance({
        tema: 'Jornada maratónica',
        duracion: 10,
        expositor: 'Juan',
        asistentes: [{ nombre: 'A', dni: '1' }]
      });
      expect(longSession.alerts.some(a => a.includes('superior a 8 horas'))).toBe(true);
    });

    it('sesión sin matrícula del expositor -> OBSERVADO', () => {
      const session: Partial<TrainingSession> = {
        tema: 'Uso de EPP en planta',
        duracion: 1.0,
        expositor: 'Capataz Obra',
        matriculaExpositor: '',
        asistentes: [
          { nombre: 'Operario 1', dni: '12345678', firma: true, nota: 8 }
        ]
      };

      const result = evaluateTrainingSessionCompliance(session);
      expect(result.dictamen).toBe('OBSERVADO');
      expect(result.hasMatricula).toBe(false);
      expect(result.recommendations.some(r => r.includes('matrícula profesional'))).toBe(true);
    });

    it('sesión con alta tasa de reprobación -> OBSERVADO con recomendación de reentrenamiento', () => {
      const session: Partial<TrainingSession> = {
        tema: 'Bloqueo LOTO y Cinco Reglas de Oro',
        duracion: 2.0,
        expositor: 'Ing. Electricista',
        matriculaExpositor: 'Mat. 9988',
        asistentes: [
          { nombre: 'Op 1', dni: '11', nota: 4, firma: true },
          { nombre: 'Op 2', dni: '22', nota: 5, firma: true },
          { nombre: 'Op 3', dni: '33', nota: 9, firma: true }
        ]
      };

      const result = evaluateTrainingSessionCompliance(session);
      expect(result.dictamen).toBe('OBSERVADO');
      expect(result.failedAttendees).toBe(2);
      expect(result.passedAttendees).toBe(1);
      expect(result.passRatePercent).toBeLessThan(70);
      expect(result.recommendations.some(r => r.includes('reentrenamiento'))).toBe(true);
    });
  });

  describe('evaluateAnnualTrainingPlanCompliance', () => {
    it('plan anual con las 6 temáticas obligatorias cubiertas y horas suficientes -> CONFORME', () => {
      const sessions: Partial<TrainingSession>[] = [
        { tema: 'Prevención de Incendios y Evacuación', duracion: 2, asistentes: new Array(20).fill({ nombre: 'X', dni: '1' }) },
        { tema: 'Primeros Auxilios y RCP Básico', duracion: 2, asistentes: new Array(20).fill({ nombre: 'X', dni: '1' }) },
        { tema: 'Uso y Cuidado de EPP', duracion: 2, asistentes: new Array(20).fill({ nombre: 'X', dni: '1' }) },
        { tema: 'Riesgo Eléctrico y Cinco Reglas de Oro', duracion: 2, asistentes: new Array(20).fill({ nombre: 'X', dni: '1' }) },
        { tema: 'Ergonomía y Levantamiento Manual de Cargas', duracion: 2, asistentes: new Array(20).fill({ nombre: 'X', dni: '1' }) },
        { tema: 'Manejo Seguro de Químicos y Fichas SGA', duracion: 2, asistentes: new Array(20).fill({ nombre: 'X', dni: '1' }) }
      ];

      const result = evaluateAnnualTrainingPlanCompliance(sessions, 20);
      expect(result.dictamen).toBe('CONFORME');
      expect(result.coveredMandatoryTopics.length).toBe(6);
      expect(result.missingMandatoryTopics.length).toBe(0);
      expect(result.coveragePercent).toBe(100);
      expect(result.averageHoursPerWorker).toBe(12);
    });

    it('plan anual con temáticas obligatorias faltantes -> OBSERVADO y lista faltantes', () => {
      const sessions: Partial<TrainingSession>[] = [
        { tema: 'Prevención de Incendios y Evacuación', duracion: 1, asistentes: [{ nombre: 'A', dni: '1' }] },
        { tema: 'Uso de EPP', duracion: 1, asistentes: [{ nombre: 'A', dni: '1' }] }
      ];

      const result = evaluateAnnualTrainingPlanCompliance(sessions, 10);
      expect(result.dictamen).toBe('OBSERVADO');
      expect(result.missingMandatoryTopics.length).toBe(4);
      expect(result.alerts.some(a => a.includes('PROGRAMA ANUAL INCOMPLETO'))).toBe(true);
    });

    it('plan anual vacío -> NO CONFORME', () => {
      const result = evaluateAnnualTrainingPlanCompliance([], 20);
      expect(result.dictamen).toBe('NO CONFORME');
      expect(result.totalSessions).toBe(0);
    });
  });
});
