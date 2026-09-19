import { describe, it, expect } from 'vitest';
import {
  COMMON_CHEMICAL_SUBSTANCES,
  evaluateChemicalAgentExposure,
  evaluateChemicalAdditiveEffect
} from '../srtProtocols';

describe('Sustancias y Contaminantes Químicos — Res. MTEySS N° 295/03 Anexo IV & Res. SRT 801/15', () => {
  it('debe tener precargado el catálogo de sustancias argentinas con CMP oficial', () => {
    expect(COMMON_CHEMICAL_SUBSTANCES.length).toBeGreaterThanOrEqual(10);
    const tolueno = COMMON_CHEMICAL_SUBSTANCES.find(s => s.id === 'tolueno');
    expect(tolueno).toBeDefined();
    expect(tolueno?.cmpPpm).toBe(50);
    expect(tolueno?.viaDermica).toBe(true);

    const benceno = COMMON_CHEMICAL_SUBSTANCES.find(s => s.id === 'benceno');
    expect(benceno?.cmpPpm).toBe(0.5);
    expect(benceno?.carcinogenicidad).toContain('A1');
  });

  describe('Evaluación Individual de Contaminantes (CMP e Índice de Exposición)', () => {
    it('debe dictaminar Conforme cuando la concentración es inferior al 50% de la CMP', () => {
      const res = evaluateChemicalAgentExposure({
        name: 'Tolueno',
        cmp: 50,
        concentracionMedida: 15,
        unidadMedicion: 'ppm',
        viaDermica: true
      });

      expect(res.indiceExposicion).toBe(0.3);
      expect(res.porcentajeCMP).toBe(30);
      expect(res.superaCMP).toBe(false);
      expect(res.alcanzaNivelAccion).toBe(false);
      expect(res.dictamenExposicion).toBe('Conforme (IE < 0.50)');
      expect(res.recomendacionesTecnicas.some(r => r.includes('VÍA DÉRMICA'))).toBe(true);
    });

    it('debe activar Nivel de Acción cuando la concentración está entre 50% y 100% de la CMP', () => {
      const res = evaluateChemicalAgentExposure({
        name: 'Xileno',
        cmp: 100,
        concentracionMedida: 75,
        unidadMedicion: 'ppm'
      });

      expect(res.indiceExposicion).toBe(0.75);
      expect(res.porcentajeCMP).toBe(75);
      expect(res.superaCMP).toBe(false);
      expect(res.alcanzaNivelAccion).toBe(true);
      expect(res.dictamenExposicion).toBe('Nivel de Acción (0.50 ≤ IE ≤ 1.0)');
    });

    it('debe dictaminar No Conforme / Supera CMP cuando IE > 1.0', () => {
      const res = evaluateChemicalAgentExposure({
        name: 'Amoníaco',
        cmp: 25,
        concentracionMedida: 32,
        unidadMedicion: 'ppm'
      });

      expect(res.indiceExposicion).toBe(1.28);
      expect(res.superaCMP).toBe(true);
      expect(res.dictamenExposicion).toBe('No Conforme / Supera CMP (IE > 1.0)');
    });
  });

  describe('Evaluación de Efecto Aditivo para Mezclas de Contaminantes (Res. 295/03 Anexo IV Punto 2)', () => {
    it('debe detectar superación de efecto aditivo cuando la suma fraccionaria supera 1.0', () => {
      // Ambas sustancias están individualmente por debajo de su CMP:
      // Tolueno: 25 ppm (CMP = 50 ppm -> 0.50)
      // Xileno: 70 ppm (CMP = 100 ppm -> 0.70)
      // Efecto aditivo: Em = 0.50 + 0.70 = 1.20 > 1.0
      const res = evaluateChemicalAdditiveEffect([
        {
          nombre: 'Tolueno',
          concentracionMedida: 25,
          cmp: 50,
          unidad: 'ppm',
          organoBlanco: 'Sistema Nervioso Central / Hepático'
        },
        {
          nombre: 'Xileno',
          concentracionMedida: 70,
          cmp: 100,
          unidad: 'ppm',
          organoBlanco: 'Sistema Nervioso Central / Hepático'
        }
      ]);

      expect(res.indiceEfectoAditivo).toBe(1.2);
      expect(res.superaLimiteAditivo).toBe(true);
      expect(res.dictamen).toContain('Supera Límite Aditivo');
    });

    it('debe dictaminar Mezcla Conforme si la suma fraccionaria es <= 1.0', () => {
      const res = evaluateChemicalAdditiveEffect([
        {
          nombre: 'Tolueno',
          concentracionMedida: 10,
          cmp: 50,
          unidad: 'ppm',
          organoBlanco: 'SNC'
        },
        {
          nombre: 'Acetona',
          concentracionMedida: 100,
          cmp: 500,
          unidad: 'ppm',
          organoBlanco: 'SNC'
        }
      ]);

      expect(res.indiceEfectoAditivo).toBe(0.4);
      expect(res.superaLimiteAditivo).toBe(false);
      expect(res.dictamen).toBe('Mezcla Conforme (Em ≤ 1.0)');
    });
  });
});
