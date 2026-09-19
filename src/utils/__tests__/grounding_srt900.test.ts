import { describe, it, expect } from 'vitest';
import {
  evaluateFullGroundingProtocol,
  evaluatePATMeasurement,
  OFFICIAL_GROUNDING_REGULATORY_CRITERIA
} from '../srtProtocols';
import type { GroundingProtocol } from '../../types/grounding';

describe('Res. S.R.T. 900/15 - Protocolo de Puesta a Tierra y Continuidad de Masas', () => {
  it('debe contener los criterios regulatorios oficiales de la Res. SRT 900/15 y AEA 90364', () => {
    expect(OFFICIAL_GROUNDING_REGULATORY_CRITERIA.esquemasPuestaTierra.TT.maxResistenciaConDiferencial).toBe(40);
    expect(OFFICIAL_GROUNDING_REGULATORY_CRITERIA.esquemasPuestaTierra.TT.maxResistenciaSinDiferencial).toBe(10);
    expect(OFFICIAL_GROUNDING_REGULATORY_CRITERIA.limiteContinuidadMasasOhms).toBe(1.0);
    expect(OFFICIAL_GROUNDING_REGULATORY_CRITERIA.diferencialMaxTiempoDisparoMs).toBe(200);
    expect(OFFICIAL_GROUNDING_REGULATORY_CRITERIA.vigenciaProtocoloMeses).toBe(12);
    expect(OFFICIAL_GROUNDING_REGULATORY_CRITERIA.vigenciaCalibracionMeses).toBe(24);
  });

  it('debe evaluar exitosamente una medición individual con evaluatePATMeasurement', () => {
    const okRes = evaluatePATMeasurement({
      pointId: '1',
      location: 'Tablero Principal',
      resistanceValueOhms: 4.2,
      maxAllowedOhms: 10,
      continuityVerified: true,
      differentialSwitchTest: true
    });
    expect(okRes.isCompliant).toBe(true);
    expect(okRes.statusText).toBe('Conforme');

    const failRes = evaluatePATMeasurement({
      pointId: '2',
      location: 'Depósito Inflamables',
      resistanceValueOhms: 15.5,
      maxAllowedOhms: 10,
      continuityVerified: false,
      differentialSwitchTest: false
    });
    expect(failRes.isCompliant).toBe(false);
    expect(failRes.recommendations.length).toBeGreaterThanOrEqual(2);
  });

  it('debe evaluar un protocolo completo conforme en esquema TT (<= 40 Ω con ID)', () => {
    const protocol: Partial<GroundingProtocol> = {
      esquemaConexionTierra: 'TT',
      tensionSeguridadContacto: 50,
      instrumentoFechaCalibracion: new Date().toISOString().split('T')[0],
      jabalinas: [
        {
          id: '1',
          codigo: 'PAT-01',
          ubicacion: 'Tablero General',
          tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
          resistenciaMedida: 8.5,
          resistenciaMaximaAdmisible: 40,
          camaraInspeccion: true,
          borneDesconexion: true,
          estadoFisico: 'Bueno',
          conforme: true
        }
      ],
      continuidadMasas: [
        {
          id: '1',
          codigo: 'CM-01',
          elemento: 'Chasis Tablero General',
          ubicacion: 'Sala Técnica',
          resistenciaContinuidad: 0.18,
          continuidadConforme: true
        }
      ],
      diferenciales: [
        {
          id: '1',
          codigo: 'ID-01',
          tableroUbicacion: 'Tablero General',
          circuitoProtegido: 'Iluminación y Tomas',
          corrienteSensibilidadMa: 30,
          tiempoDisparoMs: 28,
          pulsadorTestFunciona: true,
          conforme: true
        }
      ]
    };

    const evalResult = evaluateFullGroundingProtocol(protocol);
    expect(evalResult.isFullyCompliant).toBe(true);
    expect(evalResult.dictamenGeneral).toBe('CONFORME');
    expect(evalResult.estadoInstalacion).toBe('Excelente');
    expect(evalResult.jabalinasConformes).toBe(1);
    expect(evalResult.masasConformes).toBe(1);
    expect(evalResult.diferencialesConformes).toBe(1);
    expect(evalResult.calibracionVencida).toBe(false);
    expect(evalResult.tensionContactoExcedida).toBe(false);
    expect(evalResult.tensionContactoPresuntaMaxVolts).toBe(0.3);
  });

  it('debe detectar no conformidad cuando la resistencia de jabalina supera el límite admisible', () => {
    const protocol: Partial<GroundingProtocol> = {
      esquemaConexionTierra: 'TT',
      jabalinas: [
        {
          id: '1',
          codigo: 'PAT-01',
          ubicacion: 'Compresores',
          tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
          resistenciaMedida: 45.0,
          resistenciaMaximaAdmisible: 40,
          camaraInspeccion: true,
          borneDesconexion: true,
          estadoFisico: 'Bueno',
          conforme: false
        }
      ],
      continuidadMasas: [],
      diferenciales: []
    };

    const evalResult = evaluateFullGroundingProtocol(protocol);
    expect(evalResult.isFullyCompliant).toBe(false);
    expect(evalResult.jabalinasConformes).toBe(0);
    expect(evalResult.autoRecommendations.some(r => r.includes('supera el máximo'))).toBe(true);
  });

  it('debe alertar por falta de continuidad en las masas eléctricas (> 1.0 Ω)', () => {
    const protocol: Partial<GroundingProtocol> = {
      esquemaConexionTierra: 'TT',
      jabalinas: [
        {
          id: '1',
          codigo: 'PAT-01',
          ubicacion: 'Tablero',
          tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
          resistenciaMedida: 5.0,
          resistenciaMaximaAdmisible: 10,
          camaraInspeccion: true,
          borneDesconexion: true,
          estadoFisico: 'Bueno',
          conforme: true
        }
      ],
      continuidadMasas: [
        {
          id: '1',
          codigo: 'CM-01',
          elemento: 'Motor Puente Grúa',
          ubicacion: 'Nave Central',
          resistenciaContinuidad: 2.8,
          continuidadConforme: false
        }
      ],
      diferenciales: []
    };

    const evalResult = evaluateFullGroundingProtocol(protocol);
    expect(evalResult.isFullyCompliant).toBe(false);
    expect(evalResult.masasConformes).toBe(0);
    expect(evalResult.autoRecommendations.some(r => r.includes('límite de 1.0 Ω'))).toBe(true);
  });

  it('debe alertar y dictaminar peligro inminente si el disyuntor no corta o falla el botón de prueba', () => {
    const protocol: Partial<GroundingProtocol> = {
      esquemaConexionTierra: 'TT',
      jabalinas: [],
      continuidadMasas: [],
      diferenciales: [
        {
          id: '1',
          codigo: 'ID-01',
          tableroUbicacion: 'Tablero Fuerza Motriz',
          circuitoProtegido: 'Maquinaria',
          corrienteSensibilidadMa: 300,
          tiempoDisparoMs: 350,
          pulsadorTestFunciona: false,
          conforme: false
        }
      ]
    };

    const evalResult = evaluateFullGroundingProtocol(protocol);
    expect(evalResult.isFullyCompliant).toBe(false);
    expect(evalResult.diferencialesConformes).toBe(0);
    expect(evalResult.dictamenGeneral).toBe('NO CONFORME');
    expect(evalResult.estadoInstalacion).toBe('Peligro Eléctrico Inminente');
    expect(evalResult.autoRecommendations.some(r => r.includes('supera los 200 ms'))).toBe(true);
    expect(evalResult.autoRecommendations.some(r => r.includes('botón de test no funciona'))).toBe(true);
  });

  it('debe alertar por certificado de calibración del telurímetro mayor a 24 meses', () => {
    const protocol: Partial<GroundingProtocol> = {
      instrumentoFechaCalibracion: '2020-01-01',
      jabalinas: [],
      continuidadMasas: [],
      diferenciales: []
    };

    const evalResult = evaluateFullGroundingProtocol(protocol);
    expect(evalResult.calibracionVencida).toBe(true);
    expect(evalResult.isFullyCompliant).toBe(false);
    expect(evalResult.autoRecommendations.some(r => r.includes('más de 24 meses'))).toBe(true);
  });

  it('debe calcular la tensión presunta de contacto Uc y advertir si excede los 24V en obra/ambiente húmedo', () => {
    const protocol: Partial<GroundingProtocol> = {
      esquemaConexionTierra: 'TT',
      tipoInstalacion: 'Obra en Construcción (Dec. 911/96)',
      tensionSeguridadContacto: 24,
      jabalinas: [
        {
          id: '1',
          codigo: 'PAT-01',
          ubicacion: 'Tablero Principal de Obra',
          tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)',
          resistenciaMedida: 90.0,
          resistenciaMaximaAdmisible: 100,
          camaraInspeccion: true,
          borneDesconexion: true,
          estadoFisico: 'Bueno',
          conforme: true
        }
      ],
      continuidadMasas: [],
      diferenciales: [
        {
          id: '1',
          codigo: 'ID-01',
          tableroUbicacion: 'Tablero de Obra',
          circuitoProtegido: 'Fuerza Motriz',
          corrienteSensibilidadMa: 300,
          tiempoDisparoMs: 40,
          pulsadorTestFunciona: true,
          conforme: true
        }
      ]
    };

    const evalResult = evaluateFullGroundingProtocol(protocol);
    expect(evalResult.tensionContactoPresuntaMaxVolts).toBe(27);
    expect(evalResult.tensionContactoExcedida).toBe(true);
    expect(evalResult.isFullyCompliant).toBe(false);
    expect(evalResult.autoRecommendations.some(r => r.includes('supera el límite de seguridad de 24 V'))).toBe(true);
  });
});
