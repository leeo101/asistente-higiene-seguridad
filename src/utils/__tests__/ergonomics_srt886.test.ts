import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_PLANILLA1_FACTORS,
  calculateNioshSrt886,
  evaluateFullErgonomicsProtocol
} from '../srtProtocols';

describe('Protocolo de Ergonomía Laboral — Resolución S.R.T. N° 886/15', () => {
  it('debe contener los 10 factores de riesgo oficiales en Planilla 1', () => {
    expect(OFFICIAL_PLANILLA1_FACTORS).toHaveLength(10);
    const ids = OFFICIAL_PLANILLA1_FACTORS.map(f => f.id);
    expect(ids).toContain('1_levantamiento');
    expect(ids).toContain('2_empuje');
    expect(ids).toContain('3_transporte');
    expect(ids).toContain('4_bipedestacion');
    expect(ids).toContain('5_movimientos_repetitivos');
    expect(ids).toContain('6_posturas_forzadas');
    expect(ids).toContain('7_vibraciones_mano_brazo');
    expect(ids).toContain('8_vibraciones_cuerpo_entero');
    expect(ids).toContain('9_confort_termico');
    expect(ids).toContain('10_estres_contacto');
  });

  describe('Planilla 2.A — Ecuación de Levantamiento NIOSH (Res. SRT 886/15)', () => {
    it('debe calcular Nivel 1 (Aceptable) con carga ligera y geometría óptima', () => {
      const res = calculateNioshSrt886({
        pesoCargaKg: 10,
        distanciaHCm: 25, // Óptimo (HM = 1.0)
        distanciaVCm: 75, // Óptimo (VM = 1.0)
        desplazamientoDCm: 25, // Óptimo (DM = 1.0)
        anguloTorsionDeg: 0, // AM = 1.0
        frecuenciaLiftsMin: 0.2, // FM = 1.0
        calidadAgarre: 'Bueno' // CM = 1.0
      });

      expect(res.lprKg).toBe(25);
      expect(res.indiceLevantamiento).toBe(0.4);
      expect(res.nivelRiesgo).toBe('Nivel 1 (Aceptable)');
      expect(res.multiplicadores.HM).toBe(1.0);
      expect(res.multiplicadores.VM).toBe(1.0);
    });

    it('debe calcular Nivel 2 (Moderado) cuando el IL se encuentra entre 1.0 y 1.5', () => {
      const res = calculateNioshSrt886({
        pesoCargaKg: 16,
        distanciaHCm: 40, // HM = 25 / 40 = 0.63
        distanciaVCm: 75,
        desplazamientoDCm: 25,
        anguloTorsionDeg: 0,
        frecuenciaLiftsMin: 1,
        calidadAgarre: 'Bueno'
      });

      // LPR aproximado: 25 * 0.63 * 1.0 * 1.0 * 1.0 * 0.85 = ~13.38 kg
      // IL: 16 / 13.38 = ~1.20
      expect(res.indiceLevantamiento).toBeGreaterThan(1.0);
      expect(res.indiceLevantamiento).toBeLessThanOrEqual(1.5);
      expect(res.nivelRiesgo).toBe('Nivel 2 (Moderado)');
    });

    it('debe clasificar como Nivel 3 (No Aceptable) si excede 25 kg o IL > 1.5', () => {
      const res = calculateNioshSrt886({
        pesoCargaKg: 32, // Supera límite legal de 25 kg
        distanciaHCm: 50,
        distanciaVCm: 50,
        desplazamientoDCm: 50,
        anguloTorsionDeg: 30,
        frecuenciaLiftsMin: 4,
        calidadAgarre: 'Regular'
      });

      expect(res.indiceLevantamiento).toBeGreaterThan(1.5);
      expect(res.nivelRiesgo).toBe('Nivel 3 (No Aceptable)');
    });
  });

  describe('Evaluación Integral del Protocolo (Planilla 1 + 2 + 3)', () => {
    it('debe generar Planilla 3 y dictaminar Nivel 3 cuando hay levantamiento crítico', () => {
      const evalResult = evaluateFullErgonomicsProtocol({
        planilla1: {
          '1_levantamiento': true,
          '2_empuje': false,
          '3_transporte': false,
          '4_bipedestacion': true,
          '5_movimientos_repetitivos': false,
          '6_posturas_forzadas': false,
          '7_vibraciones_mano_brazo': false,
          '8_vibraciones_cuerpo_entero': false,
          '9_confort_termico': false,
          '10_estres_contacto': false
        },
        calculoLevantamiento: {
          pesoCargaKg: 28, // > 25 kg
          distanciaHCm: 45,
          distanciaVCm: 75,
          desplazamientoDCm: 50,
          anguloTorsionDeg: 0,
          frecuenciaLiftsMin: 2,
          duracionHoras: 1,
          calidadAgarre: 'Bueno',
          lprKg: 12,
          indiceLevantamiento: 2.33,
          multiplicadores: { HM: 0.56, VM: 1.0, DM: 0.91, AM: 1.0, FM: 0.75, CM: 1.0 },
          nivelRiesgo: 'Nivel 3 (No Aceptable)'
        }
      });

      expect(evalResult.factoresIdentificadosCount).toBe(2);
      expect(evalResult.nivelRiesgoGlobal).toBe('Nivel 3 (No Aceptable)');
      expect(evalResult.riesgoRetro).toBe('Alto');
      expect(evalResult.medidasSugeridas.length).toBeGreaterThan(0);

      // Debe sugerir medida de ingeniería para carga > 25 kg
      const ingenieria = evalResult.medidasSugeridas.find(m => m.tipoMedida === 'Ingeniería');
      expect(ingenieria).toBeDefined();
    });

    it('debe dictaminar Nivel 1 (Aceptable) cuando no hay factores o son despreciables', () => {
      const evalResult = evaluateFullErgonomicsProtocol({
        planilla1: {
          '1_levantamiento': false,
          '2_empuje': false,
          '3_transporte': false,
          '4_bipedestacion': false,
          '5_movimientos_repetitivos': false,
          '6_posturas_forzadas': false,
          '7_vibraciones_mano_brazo': false,
          '8_vibraciones_cuerpo_entero': false,
          '9_confort_termico': false,
          '10_estres_contacto': false
        }
      });

      expect(evalResult.factoresIdentificadosCount).toBe(0);
      expect(evalResult.nivelRiesgoGlobal).toBe('Nivel 1 (Aceptable)');
      expect(evalResult.riesgoRetro).toBe('Tolerable');
    });
  });
});
