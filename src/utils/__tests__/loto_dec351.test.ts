import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_LOTO_REGULATORY_CRITERIA,
  evaluateLotoProcedureSafety
} from '../srtProtocols';
import type { LotoProcedureProtocol } from '../../types/loto';

describe('Módulo de Bloqueo y Etiquetado LOTO — Dec. 351/79 Cap. 14 y 15 & OSHA 1910.147', () => {
  it('debe contener las referencias normativas y principios fundamentales oficiales', () => {
    expect(OFFICIAL_LOTO_REGULATORY_CRITERIA.normativeReference).toContain('Decreto 351/79');
    expect(OFFICIAL_LOTO_REGULATORY_CRITERIA.fiveGoldenRulesTitles).toHaveLength(5);
    expect(OFFICIAL_LOTO_REGULATORY_CRITERIA.corePrinciples[0]).toContain('Un operario = Un candado');
  });

  it('debe autorizar un procedimiento seguro con energía cero confirmada y las 5 reglas de oro', () => {
    const validProcedure: Partial<LotoProcedureProtocol> = {
      equipmentName: 'Bomba Centrífuga Principal BC-01',
      equipmentTag: 'BC-01',
      energyTypes: ['electrical', 'hydraulic'],
      lotoDevices: ['padlock', 'breaker_lock', 'valve_lock'],
      hasElectricalRisk: true,
      fiveGoldenRulesElectrical: {
        corteEfectivo: true,
        bloqueoEnclavamiento: true,
        verificacionAusencia: true,
        puestaATierraCorto: true,
        senalizacionZona: true
      },
      zeroEnergyVerification: {
        tested: true,
        method: 'try_start',
        result: 'safe'
      },
      isolationPointsList: [
        { id: 1, name: 'Interruptor Q1 Tablero General', energyType: 'electrical', device: 'breaker_lock', location: 'TG-01', verified: true },
        { id: 2, name: 'Válvula Entrada V-101', energyType: 'hydraulic', device: 'valve_lock', location: 'Línea de succión', verified: true }
      ],
      supervisor: 'Ing. Carlos Mendoza (Mat. CIPBA 48291)',
      lockoutType: 'individual'
    };

    const evalResult = evaluateLotoProcedureSafety(validProcedure);
    expect(evalResult.isAuthorized).toBe(true);
    expect(evalResult.criticalBlockers).toHaveLength(0);
    expect(evalResult.goldenRulesCompliancePercent).toBe(100);
    expect(evalResult.zeroEnergyConfirmed).toBe(true);
    expect(evalResult.recommendations[0]).toContain('PROCEDIMIENTO LOTO AUTORIZADO');
  });

  it('debe bloquear taxativamente la autorización si NO se confirmó la energía cero', () => {
    const unverifiedProcedure: Partial<LotoProcedureProtocol> = {
      equipmentName: 'Molino de Mandíbula',
      energyTypes: ['mechanical'],
      lotoDevices: ['padlock'],
      hasElectricalRisk: false,
      zeroEnergyVerification: {
        tested: false,
        method: 'try_start',
        result: 'pending'
      },
      supervisor: 'Supervisor Planta'
    };

    const evalResult = evaluateLotoProcedureSafety(unverifiedProcedure);
    expect(evalResult.isAuthorized).toBe(false);
    expect(evalResult.zeroEnergyConfirmed).toBe(false);
    expect(evalResult.criticalBlockers).toContain(
      'ESTADO DE ENERGÍA CERO NO CONFIRMADO: Es mandatorio realizar y documentar la prueba de energía cero residual (Try-Out, medición con multímetro o purga).'
    );
  });

  it('debe detectar incumplimiento de las 5 Reglas de Oro en riesgo eléctrico (Dec. 351/79 Anexo VI)', () => {
    const electricalIncomplete: Partial<LotoProcedureProtocol> = {
      equipmentName: 'Compresor de Aire Tornillo',
      energyTypes: ['electrical', 'pneumatic'],
      lotoDevices: ['padlock'],
      hasElectricalRisk: true,
      fiveGoldenRulesElectrical: {
        corteEfectivo: true,
        bloqueoEnclavamiento: true,
        verificacionAusencia: false, // Falta verificar 0V
        puestaATierraCorto: false, // Falta puesta a tierra
        senalizacionZona: true
      },
      zeroEnergyVerification: {
        tested: true,
        method: 'try_start',
        result: 'safe'
      },
      supervisor: 'Téc. Seguridad'
    };

    const evalResult = evaluateLotoProcedureSafety(electricalIncomplete);
    expect(evalResult.isAuthorized).toBe(false);
    expect(evalResult.goldenRulesCompliancePercent).toBe(60); // 3 de 5
    expect(evalResult.criticalBlockers.some(b => b.includes('Regla 3: Verificación de ausencia de tensión'))).toBe(true);
    expect(evalResult.criticalBlockers.some(b => b.includes('Regla 4: Puesta a tierra'))).toBe(true);
  });

  it('debe bloquear si existen puntos de aislamiento sin verificación física', () => {
    const unverifiedPointsProc: Partial<LotoProcedureProtocol> = {
      equipmentName: 'Prensa Hidráulica 50T',
      energyTypes: ['hydraulic'],
      lotoDevices: ['valve_lock'],
      zeroEnergyVerification: {
        tested: true,
        method: 'gauge',
        result: 'safe'
      },
      isolationPointsList: [
        { id: 1, name: 'Válvula de alivio principal', energyType: 'hydraulic', device: 'valve_lock', location: 'Bomba', verified: false }
      ],
      supervisor: 'Jefe de Mantenimiento'
    };

    const evalResult = evaluateLotoProcedureSafety(unverifiedPointsProc);
    expect(evalResult.isAuthorized).toBe(false);
    expect(evalResult.criticalBlockers.some(b => b.includes('sin verificar bloqueo físico'))).toBe(true);
  });
});
