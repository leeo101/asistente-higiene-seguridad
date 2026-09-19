import { describe, it, expect } from 'vitest';
import {
  SRT_RISK_AGENTS_CATALOG,
  getAgentByCode,
  calculateRARStats,
  validateCuilFormat,
  getRecommendedMedicalExams
} from '../rarCatalog';
import {
  evaluateRarProtocolSafety,
  OFFICIAL_RAR_REGULATORY_CRITERIA
} from '../srtProtocols';
import type { RARSurvey, WorkerExposure } from '../../types/rar';

describe('Módulo RAR (Res. S.R.T. N° 37/10 y Res. S.R.T. N° 81/19)', () => {
  describe('Catálogo y Helpers de Agentes de Riesgo', () => {
    it('debe contener los agentes oficiales físicos, químicos, biológicos y ergonómicos', () => {
      expect(SRT_RISK_AGENTS_CATALOG.length).toBeGreaterThanOrEqual(15);
      const ruido = getAgentByCode('80001');
      expect(ruido).toBeDefined();
      expect(ruido?.categoria).toBe('Físico');
      expect(ruido?.estudiosRequeridos).toContain('Audiometría tonal liminar bianual / anual');
    });

    it('debe identificar agentes cancerígenos bajo Res. SRT 81/19', () => {
      const benceno = getAgentByCode('40002');
      const silice = getAgentByCode('40003');
      const asbesto = getAgentByCode('40010');
      const cromoVI = getAgentByCode('40040');
      const radIoniz = getAgentByCode('80002');

      expect(benceno?.esCancerigeno).toBe(true);
      expect(silice?.esCancerigeno).toBe(true);
      expect(asbesto?.esCancerigeno).toBe(true);
      expect(cromoVI?.esCancerigeno).toBe(true);
      expect(radIoniz?.esCancerigeno).toBe(true);
    });

    it('debe consolidar los exámenes médicos requeridos para una lista de agentes', () => {
      const exams = getRecommendedMedicalExams(['80001', '40003']);
      expect(exams).toContain('Audiometría tonal liminar bianual / anual');
      expect(exams).toContain('Radiografía de tórax con lectura OIT oficial');
      expect(exams).toContain('Espirometría computarizada anual');
    });
  });

  describe('Validador Oficial de CUIL (Módulo 11)', () => {
    it('debe validar CUILs argentinos correctos con o sin guiones', () => {
      // 20-35894120-7 -> 2*5 + 0*4 + 3*3 + 5*2 + 8*7 + 9*6 + 4*5 + 1*4 + 2*3 + 0*2 = 10+0+9+10+56+54+20+4+6+0 = 169. 169%11 = 4. 11-4=7.
      const val1 = validateCuilFormat('20-35894120-7');
      expect(val1.isValid).toBe(true);

      const val2 = validateCuilFormat('20358941207');
      expect(val2.isValid).toBe(true);
    });

    it('debe rechazar CUILs con longitud errónea, prefijo no válido o dígito verificador falso', () => {
      expect(validateCuilFormat('').isValid).toBe(false);
      expect(validateCuilFormat('12345').isValid).toBe(false);
      expect(validateCuilFormat('99-12345678-0').isValid).toBe(false); // Prefijo 99 inválido
      expect(validateCuilFormat('20-35894120-0').isValid).toBe(false); // Dígito verificador incorrecto
    });
  });

  describe('Estadísticas y Métricas de Exposición (calculateRARStats)', () => {
    it('debe computar correctamente trabajadores expuestos, no expuestos y presencia de cancerígenos', () => {
      const workers: WorkerExposure[] = [
        {
          id: '1',
          cuil: '20-35894120-7',
          nombre: 'Juan Pérez',
          puesto: 'Soldador',
          sector: 'Producción',
          fechaIngreso: '2020-01-01',
          agentesCodigos: ['80001', '40001'],
          horasExposicionDiaria: 8,
          diasExposicionSemanal: 5,
          eppAdecuado: true
        },
        {
          id: '2',
          cuil: '20-38491024-3',
          nombre: 'Pedro Gómez',
          puesto: 'Arenador',
          sector: 'Preparación',
          fechaIngreso: '2021-02-01',
          agentesCodigos: ['40003'], // Sílice - cancerígeno
          horasExposicionDiaria: 6,
          diasExposicionSemanal: 5,
          eppAdecuado: true
        },
        {
          id: '3',
          cuil: '27-36192834-2',
          nombre: 'Ana López',
          puesto: 'Administrativa',
          sector: 'Oficinas',
          fechaIngreso: '2022-03-01',
          agentesCodigos: [], // Sin exposición
          horasExposicionDiaria: 8,
          diasExposicionSemanal: 5,
          eppAdecuado: true
        }
      ];

      const stats = calculateRARStats(workers);
      expect(stats.totalTrabajadores).toBe(3);
      expect(stats.trabajadoresExpuestos).toBe(2);
      expect(stats.trabajadoresNoExpuestos).toBe(1);
      expect(stats.porcentajeExpuestos).toBe(67);
      expect(stats.trabajadoresConCancerigenos).toBe(1);
      expect(stats.conteoPorCategoria.Físico).toBe(1);
      expect(stats.conteoPorCategoria.Químico).toBe(2);
    });
  });

  describe('Evaluación Técnico-Legal de la Nómina (evaluateRarProtocolSafety)', () => {
    const baseSurvey: Partial<RARSurvey> = {
      razonSocial: 'Metalmecánica Austral S.A.',
      cuit: '30-71948210-3',
      artNombre: 'Prevención ART',
      profesionalNombre: 'Lic. Mariano Castro',
      profesionalMatricula: 'Mat. 1024',
      trabajadores: [
        {
          id: 'w1',
          cuil: '20-35894120-7',
          nombre: 'Roberto Gómez',
          puesto: 'Soldador',
          sector: 'Taller',
          fechaIngreso: '2020-05-10',
          agentesCodigos: ['80001', '40002'], // Ruido y Benceno (Cancerígeno)
          horasExposicionDiaria: 8,
          diasExposicionSemanal: 5,
          eppAdecuado: true
        }
      ]
    };

    it('debe alertar y exigir registro en SVRC bajo Res. SRT 81/19 ante sustancias cancerígenas', () => {
      const result = evaluateRarProtocolSafety(baseSurvey);

      expect(result.requiereRegistroCancerigenos).toBe(true);
      expect(result.cancerigenosDetectados.length).toBe(1);
      expect(result.cancerigenosDetectados[0].codigo).toBe('40002');
      expect(result.alertasNormativas.some(a => a.includes('81/19'))).toBe(true);
    });

    it('debe consolidar la batería de exámenes médicos para la ART', () => {
      const result = evaluateRarProtocolSafety(baseSurvey);

      expect(result.examenesMedicosConsolidados.length).toBeGreaterThan(0);
      const examNames = result.examenesMedicosConsolidados.map(e => e.examen);
      expect(examNames).toContain('Audiometría tonal liminar bianual / anual');
      expect(examNames.some(e => e.includes('Hepatograma'))).toBe(true);
    });

    it('debe detectar operarios expuestos sin EPP bajo Res. SRT 299/11', () => {
      const surveyWithoutPpe: Partial<RARSurvey> = {
        ...baseSurvey,
        trabajadores: [
          {
            id: 'w2',
            cuil: '20-35894120-7',
            nombre: 'Carlos Ruiz',
            puesto: 'Pintor',
            sector: 'Planta',
            fechaIngreso: '2021-01-10',
            agentesCodigos: ['80001'],
            horasExposicionDiaria: 8,
            diasExposicionSemanal: 5,
            eppAdecuado: false // Sin EPP
          }
        ]
      };

      const result = evaluateRarProtocolSafety(surveyWithoutPpe);
      expect(result.alertasNormativas.some(a => a.includes('299/11'))).toBe(true);
    });

    it('debe declarar la nómina como no conforme para presentación electrónica si hay CUILs inválidos', () => {
      const surveyWithBadCuil: Partial<RARSurvey> = {
        ...baseSurvey,
        trabajadores: [
          {
            id: 'w3',
            cuil: '00-00000000-0', // CUIL falso
            nombre: 'Juan Desconocido',
            puesto: 'Operario',
            sector: 'Planta',
            fechaIngreso: '2021-01-10',
            agentesCodigos: ['80001'],
            horasExposicionDiaria: 8,
            diasExposicionSemanal: 5,
            eppAdecuado: true
          }
        ]
      };

      const result = evaluateRarProtocolSafety(surveyWithBadCuil);
      expect(result.isCompliant).toBe(false);
      expect(result.alertasNormativas.some(a => a.includes('C.U.I.L.'))).toBe(true);
    });
  });
});
