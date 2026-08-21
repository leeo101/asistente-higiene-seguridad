import { describe, it, expect } from 'vitest';
import { calculateNIOSH } from '../ergonomicsCalculators';
import { evaluateChemicalRisk } from '../ghsChemicalSafety';
import { evaluateContractorStatus } from '../contractorCompliance';

describe('Ergonomic Calculators (NIOSH)', () => {
  it('debe calcular correctamente el Índice de Levantamiento NIOSH (LI)', () => {
    const res = calculateNIOSH({
      loadWeightKg: 15,
      horizontalDistanceCm: 30,
      verticalDistanceCm: 75,
      verticalTravelCm: 25,
      asymmetryAngleDeg: 0,
      frequencyLiftsPerMin: 1,
      durationHours: 1,
      couplingQuality: 'Buena'
    });

    expect(res.rwlKg).toBeGreaterThan(15);
    expect(res.liftingIndex).toBeLessThanOrEqual(1.0);
    expect(res.riskLevel).toBe('Bajo (Aceptable)');
  });

  it('debe alertar cuando el peso supera holgadamente el límite seguro', () => {
    const res = calculateNIOSH({
      loadWeightKg: 35,
      horizontalDistanceCm: 50,
      verticalDistanceCm: 30,
      verticalTravelCm: 50,
      asymmetryAngleDeg: 45,
      frequencyLiftsPerMin: 6,
      durationHours: 2,
      couplingQuality: 'Mala'
    });

    expect(res.liftingIndex).toBeGreaterThan(1.0);
    expect(res.recommendations.length).toBeGreaterThan(0);
  });
});

describe('GHS Chemical Safety & NFPA 704', () => {
  it('debe clasificar una sustancia corrosiva y tóxica con nivel de riesgo extremo/alto', () => {
    const risk = evaluateChemicalRisk({
      id: 'CHEM-01',
      productName: 'Ácido Sulfúrico 98%',
      supplier: 'Química Industrial',
      signalWord: 'Peligro',
      pictograms: ['GHS05', 'GHS06'],
      hStatements: ['H314', 'H330'],
      pStatements: ['P280', 'P305'],
      nfpa704: { health: 4, flammability: 0, instability: 2, special: 'W' }
    });

    expect(risk.overallRiskLevel).toBe('Extremo');
    expect(risk.recommendedPPE).toContain('Guantes de nitrilo/butilo resistentes a químicos');
  });
});

describe('Contractor Document Compliance', () => {
  it('debe bloquear a un contratista con la ART vencida', () => {
    const evalRes = evaluateContractorStatus({
      contractorName: 'Electromecánica SRL',
      cuit: '30-71123456-8',
      hasF931: true,
      f931ExpirationDate: '2027-01-01',
      hasARTClause: true,
      artExpirationDate: '2020-01-01', // Vencida
      hasLifeInsurance: true,
      lifeInsuranceExpirationDate: '2027-01-01',
      hasPPEDeliveryRecord: true
    });

    expect(evalRes.canEnterSite).toBe(false);
    expect(evalRes.status).toBe('Bloqueado (Rojo)');
  });
});
