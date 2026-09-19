import { describe, it, expect } from 'vitest';
import { evaluatePATMeasurement, evaluateLightingMeasurement, calculateNoiseDose } from '../srtProtocols';
import { calculateExecutiveKPIs } from '../safetyMetrics';
import { createCAPAFromFinding } from '../capaWorkflow';

describe('Res. SRT Protocol Calculators', () => {
  it('debe evaluar correctamente una medición de Puesta a Tierra (Res. SRT 900/15)', () => {
    const resOK = evaluatePATMeasurement({
      pointId: 'PAT-01',
      location: 'Tablero General',
      resistanceValueOhms: 3.5,
      continuityVerified: true,
      differentialSwitchTest: true
    });
    expect(resOK.isCompliant).toBe(true);
    expect(resOK.statusText).toBe('Conforme');

    const resFail = evaluatePATMeasurement({
      pointId: 'PAT-02',
      location: 'Depósito',
      resistanceValueOhms: 15.2,
      continuityVerified: true,
      differentialSwitchTest: true
    });
    expect(resFail.isCompliant).toBe(false);
    expect(resFail.statusText).toBe('No Conforme (Resistencia Alta)');
  });

  it('debe evaluar un protocolo completo de Puesta a Tierra (evaluateFullGroundingProtocol)', async () => {
    const { evaluateFullGroundingProtocol } = await import('../srtProtocols');
    const result = evaluateFullGroundingProtocol({
      esquemaConexionTierra: 'TT',
      jabalinas: [
        { id: '1', codigo: 'PAT-01', ubicacion: 'Tablero Principal', tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)', resistenciaMedida: 3.5, resistenciaMaximaAdmisible: 10, camaraInspeccion: true, borneDesconexion: true, estadoFisico: 'Bueno', conforme: true },
        { id: '2', codigo: 'PAT-02', ubicacion: 'Compresor', tipoElectrodo: 'Jabalina Cobre/Acero (Hincada)', resistenciaMedida: 5.5, resistenciaMaximaAdmisible: 10, camaraInspeccion: true, borneDesconexion: true, estadoFisico: 'Bueno', conforme: true }
      ],
      continuidadMasas: [
        { id: '1', codigo: 'CM-01', elemento: 'Carcasa Tablero', ubicacion: 'Sala Tableros', resistenciaContinuidad: 0.15, continuidadConforme: true }
      ],
      diferenciales: [
        { id: '1', codigo: 'ID-01', tableroUbicacion: 'Tablero Principal', circuitoProtegido: 'Tomas', corrienteSensibilidadMa: 30, tiempoDisparoMs: 25, pulsadorTestFunciona: true, conforme: true }
      ]
    });

    expect(result.totalJabalinas).toBe(2);
    expect(result.jabalinasConformes).toBe(2);
    expect(result.promedioResistenciaOhms).toBe(4.5);
    expect(result.maxResistenciaMedida).toBe(5.5);
    expect(result.masasConformes).toBe(1);
    expect(result.diferencialesConformes).toBe(1);
    expect(result.isFullyCompliant).toBe(true);
    expect(result.autoRecommendations.length).toBe(0);
  });

  it('debe evaluar la iluminación media según Dec. 351/79 (Res. SRT 84/12)', () => {
    const res = evaluateLightingMeasurement([350, 400, 320, 380], 'Oficinas / Tareas Normales');
    expect(res.isCompliant).toBe(true);
    expect(res.avgLux).toBeGreaterThanOrEqual(300);
  });

  it('debe calcular la dosis diaria de ruido (Res. SRT 85/12)', () => {
    const dose = calculateNoiseDose([
      { exposureTimeHours: 4, measuredLAeq: 85 }, // 50% dosis
      { exposureTimeHours: 2, measuredLAeq: 88 }  // 50% dosis
    ]);
    expect(dose.totalDosePercent).toBe(100);
    expect(dose.isExceeded).toBe(false);
  });
});

describe('Safety Executive KPIs & CAPA Workflow', () => {
  it('debe calcular el Índice de Frecuencia (IF) e Índice de Gravedad (IG)', () => {
    const kpis = calculateExecutiveKPIs({
      accidentsCount: 2,
      daysLostCount: 10,
      totalWorkersCount: 100,
      workedHoursMonth: 16000
    });
    expect(kpis.indiceFrecuencia).toBe(125); // (2 * 1000000) / 16000 = 125
    expect(kpis.indiceGravedad).toBe(625);   // (10 * 1000000) / 16000 = 625
  });

  it('debe generar una CAPA desde un hallazgo', () => {
    const capa = createCAPAFromFinding({
      title: 'Extintor despresurizado en Pasillo B',
      description: 'Manómetro marca zona roja',
      sourceModule: 'extingushers',
      severity: 'Alta'
    });

    expect(capa.id).toMatch(/^CAPA-/);
    expect(capa.status).toBe('Pendiente');
    expect(capa.severity).toBe('Alta');
  });
});

describe('RGRL Res. SRT 463/09 Engine', () => {
  it('debe calcular métricas del RGRL y generar el Plan de Regularización', async () => {
    const { calculateRGRLMetrics, generatePlanRegularizacion, getDefaultQuestionsForAnnex } = await import('../rgrlEngine');

    const baseItems = getDefaultQuestionsForAnnex('anexo1_351');
    expect(baseItems.length).toBeGreaterThanOrEqual(15);

    // Modificar 2 ítems como no cumple
    const items = baseItems.map(it => {
      if (it.codigo === '1.1') return { ...it, estado: 'NO_CUMPLE' as const, observacion: 'Falta contrato con profesional externo' };
      if (it.codigo === '5.1') return { ...it, estado: 'NO_CUMPLE' as const, observacion: 'Falta protocolo PAT' };
      return it;
    });

    const metrics = calculateRGRLMetrics(items);
    expect(metrics.totalItems).toBe(baseItems.length);
    expect(metrics.noCumpleCount).toBe(2);
    expect(metrics.cumpleCount).toBe(baseItems.length - 2);
    expect(metrics.porcentajeCumplimiento).toBeLessThan(100);

    const plan = generatePlanRegularizacion(metrics.itemsNoCumple, 60);
    expect(plan.length).toBe(2);
    expect(plan[0].codigo).toBe('1.1');
    expect(plan[0].plazoEstimadoDias).toBe(60);
    expect(plan[1].codigo).toBe('5.1');
  });
});

describe('RAR Res. SRT 37/10 Catalog & Engine', () => {
  it('debe buscar agentes SRT correctamente y calcular estadísticas de nómina', async () => {
    const { getAgentByCode, calculateRARStats, SRT_RISK_AGENTS_CATALOG } = await import('../rarCatalog');

    expect(SRT_RISK_AGENTS_CATALOG.length).toBeGreaterThanOrEqual(15);

    const ruido = getAgentByCode('80001');
    expect(ruido).toBeDefined();
    expect(ruido?.nombre).toContain('Ruido');
    expect(ruido?.categoria).toBe('Físico');

    const fakeWorkers = [
      {
        id: 'w1',
        cuil: '20-30111222-4',
        nombre: 'Juan Pérez',
        fechaIngreso: '2020-01-01',
        sector: 'Taller',
        puesto: 'Soldador',
        horasExposicionDiaria: 8,
        diasExposicionSemanal: 5,
        agentesCodigos: ['80001', '40001'],
        eppAdecuado: true,
        observaciones: 'Usa copa auditiva y máscara de soldar'
      },
      {
        id: 'w2',
        cuil: '27-32444555-8',
        nombre: 'María Gómez',
        fechaIngreso: '2021-03-15',
        sector: 'Depósito',
        puesto: 'Operario de Autoelevador',
        horasExposicionDiaria: 8,
        diasExposicionSemanal: 5,
        agentesCodigos: ['80005'],
        eppAdecuado: true
      },
      {
        id: 'w3',
        cuil: '20-40555666-1',
        nombre: 'Carlos López',
        fechaIngreso: '2022-05-10',
        sector: 'Administración',
        puesto: 'Administrativo',
        horasExposicionDiaria: 8,
        diasExposicionSemanal: 5,
        agentesCodigos: [],
        eppAdecuado: true
      }
    ];

    const stats = calculateRARStats(fakeWorkers);
    expect(stats.totalTrabajadores).toBe(3);
    expect(stats.trabajadoresExpuestos).toBe(2);
    expect(stats.trabajadoresNoExpuestos).toBe(1);
    expect(stats.porcentajeExpuestos).toBe(67);
    expect(stats.conteoPorCategoria.Físico).toBe(2);
    expect(stats.conteoPorCategoria.Químico).toBe(1);
    expect(stats.conteoPorCategoria.Biológico).toBe(0);
  });
});

describe('Res. SRT 84/12 Full Lighting Protocol Engine', () => {
  it('debe evaluar un protocolo conforme con factor de uniformidad U >= 0.50', async () => {
    const { evaluateFullLightingProtocolSRT84 } = await import('../srtProtocols');

    const puntos = [
      {
        id: '1',
        codigoPunto: 'P1',
        sector: 'Oficina Técnica',
        puestoTrabajo: 'Cadista 1',
        tareaVisual: 'Dibujo técnico',
        alturaPlanoTrabajoM: 0.8,
        tipoIluminacion: 'Artificial' as const,
        luxRequeridoNorma: 500,
        luxMedido: 550,
        conformeNivel: true
      },
      {
        id: '2',
        codigoPunto: 'P2',
        sector: 'Oficina Técnica',
        puestoTrabajo: 'Cadista 2',
        tareaVisual: 'Dibujo técnico',
        alturaPlanoTrabajoM: 0.8,
        tipoIluminacion: 'Artificial' as const,
        luxRequeridoNorma: 500,
        luxMedido: 520,
        conformeNivel: true
      },
      {
        id: '3',
        codigoPunto: 'P3',
        sector: 'Oficina Técnica',
        puestoTrabajo: 'Mesa de Planos',
        tareaVisual: 'Dibujo técnico',
        alturaPlanoTrabajoM: 0.8,
        tipoIluminacion: 'Artificial' as const,
        luxRequeridoNorma: 500,
        luxMedido: 580,
        conformeNivel: true
      }
    ];

    // Calibración reciente (dentro de 24 meses)
    const result = evaluateFullLightingProtocolSRT84(puntos, new Date().toISOString());

    expect(result.totalPuntos).toBe(3);
    expect(result.puntosConformes).toBe(3);
    expect(result.puntosDeficientes).toBe(0);
    expect(result.iluminanciaMedia).toBe(550);
    expect(result.iluminanciaMinima).toBe(520);
    expect(result.iluminanciaMaxima).toBe(580);
    expect(result.factorUniformidad).toBeGreaterThanOrEqual(0.50);
    expect(result.uniformidadConforme).toBe(true);
    expect(result.calibracionVencida).toBe(false);
    expect(result.dictamenGeneral).toBe('CONFORME');
  });

  it('debe detectar no conformidad por puntos deficientes y por calibración vencida (>24 meses)', async () => {
    const { evaluateFullLightingProtocolSRT84 } = await import('../srtProtocols');

    const puntos = [
      {
        id: '1',
        codigoPunto: 'P1',
        sector: 'Nave Fabril',
        puestoTrabajo: 'Mecanizado',
        tareaVisual: 'Torno CNC',
        alturaPlanoTrabajoM: 0.8,
        tipoIluminacion: 'Artificial' as const,
        luxRequeridoNorma: 500,
        luxMedido: 320, // Deficiente (<500)
        conformeNivel: false
      },
      {
        id: '2',
        codigoPunto: 'P2',
        sector: 'Nave Fabril',
        puestoTrabajo: 'Banco de Ajuste',
        tareaVisual: 'Ajuste fino',
        alturaPlanoTrabajoM: 0.8,
        tipoIluminacion: 'Artificial' as const,
        luxRequeridoNorma: 500,
        luxMedido: 510,
        conformeNivel: true
      }
    ];

    // Calibración de hace 3 años
    const fechaVieja = new Date();
    fechaVieja.setFullYear(fechaVieja.getFullYear() - 3);

    const result = evaluateFullLightingProtocolSRT84(puntos, fechaVieja.toISOString());

    expect(result.totalPuntos).toBe(2);
    expect(result.puntosConformes).toBe(1);
    expect(result.puntosDeficientes).toBe(1);
    expect(result.calibracionVencida).toBe(true);
    expect(result.dictamenGeneral).toBe('DEFICIENTE');
  });
});

describe('Res. SRT 85/12 Full Noise Protocol Engine', () => {
  it('debe evaluar un protocolo con nivel de acción (80-85 dBA) y dosis conforme', async () => {
    const { evaluateFullNoiseProtocolSRT85 } = await import('../srtProtocols');

    const result = evaluateFullNoiseProtocolSRT85({
      laeq: 82,
      duracionJornadaHoras: 8,
      ruidoFondoDb: 70, // Delta = 12 dB > 10 dB (sin corrección de fondo)
      instrument: {
        fechaCalibracionLaboratorio: new Date().toISOString(),
        verificacionInicialDb: 94.0,
        verificacionFinalDb: 94.1
      },
      hearingProtection: {
        usaEPP: true,
        nrr_snr: 25
      }
    });

    expect(result.limiteExcedido).toBe(false);
    expect(result.nivelAccionAlcanzado).toBe(true);
    expect(result.dictamenGeneral).toBe('ALERTA (80-85 dBA)');
    expect(result.dosisDiariaPercent).toBeLessThan(100);
    expect(result.ruidoFondoInvalido).toBe(false);
    expect(result.derivaCalibracionInSituExcedida).toBe(false);
    expect(result.eppAtenuacionAdecuada).toBe(true);
  });

  it('debe calcular correctamente exceso de dosis para 91 dBA en 8hs y evaluar EPP', async () => {
    const { evaluateFullNoiseProtocolSRT85 } = await import('../srtProtocols');

    // Para 91 dBA con tasa 3dB, el tiempo permitido es exactamente 2 horas.
    // Con 8 horas de jornada, la dosis diaria calculada es 400%.
    const result = evaluateFullNoiseProtocolSRT85({
      laeq: 91,
      duracionJornadaHoras: 8,
      hearingProtection: {
        usaEPP: true,
        nrr_snr: 29 // Atenuación = (29 - 7) * 0.7 = 15.4 dB -> Oído = 75.6 dBA (Adecuado)
      }
    });

    expect(result.tiempoPermitidoHoras).toBe(2);
    expect(result.dosisDiariaPercent).toBe(400);
    expect(result.limiteExcedido).toBe(true);
    expect(result.dictamenGeneral).toBe('SUPERA LMPE (>85 dBA)');
    expect(result.eppAtenuacionAdecuada).toBe(true);
  });

  it('debe invalidar la medición si la diferencia con el ruido de fondo es menor a 3 dB', async () => {
    const { evaluateFullNoiseProtocolSRT85 } = await import('../srtProtocols');

    const result = evaluateFullNoiseProtocolSRT85({
      laeq: 84,
      duracionJornadaHoras: 8,
      ruidoFondoDb: 82 // Delta = 2 dB < 3 dB
    });

    expect(result.ruidoFondoInvalido).toBe(true);
    expect(result.dictamenGeneral).toBe('MEDICIÓN INVÁLIDA (FONDO/CALIBRACIÓN)');
  });

  it('debe invalidar la medición si la deriva in situ del instrumental supera 0.5 dB', async () => {
    const { evaluateFullNoiseProtocolSRT85 } = await import('../srtProtocols');

    const result = evaluateFullNoiseProtocolSRT85({
      laeq: 83,
      duracionJornadaHoras: 8,
      instrument: {
        verificacionInicialDb: 94.0,
        verificacionFinalDb: 94.8 // Deriva = 0.8 dB > 0.5 dB
      }
    });

    expect(result.derivaCalibracionInSituExcedida).toBe(true);
    expect(result.dictamenGeneral).toBe('MEDICIÓN INVÁLIDA (FONDO/CALIBRACIÓN)');
  });
});

describe('Protocolo Oficial de Carga Térmica y Frío — Res. MTEySS 295/03 & Res. SRT 30/2023', () => {
  it('debe calcular TGBH interior y exterior con sol, aplicando factor de ropa CAV', async () => {
    const { evaluateFullThermalStressProtocol } = await import('../srtProtocols');

    // Caso 1: Interior (Tbh 24, Tg 30) -> TGBH = 0.7*24 + 0.3*30 = 16.8 + 9 = 25.8 °C
    // Con ropa estándar (CAV = 0), trabajo moderado continuo (VLE = 26.7 °C, VLA = 25.2 °C)
    // 25.8 °C está entre VLA (25.2) y VLE (26.7) -> ZONA DE ACCIÓN (VLA)
    const resInterior = evaluateFullThermalStressProtocol({
      ambiental: { tbh: 24, tg: 30, cargaSolar: false },
      trabajador: {
        puesto: 'Operario', sector: 'Nave', tarea: 'Ensamble',
        ritmo: 'moderado', ciclo: 'continuo', indumentariaId: 'standard', cav: 0,
        aclimatado: true, aptaMedica: true
      }
    });

    expect(resInterior.tgbhMedido).toBe(25.8);
    expect(resInterior.tgbhEfectivo).toBe(25.8);
    expect(resInterior.vlePermisible).toBe(26.7);
    expect(resInterior.vlaAccion).toBe(25.2);
    expect(resInterior.nivelAccionAlcanzado).toBe(true);
    expect(resInterior.limiteExcedido).toBe(false);
    expect(resInterior.dictamenGeneral).toBe('ZONA DE ACCIÓN (VLA)');

    // Caso 2: Exterior con carga solar (Tbh 25, Tg 35, Tbs 32)
    // TGBH = 0.7*25 + 0.2*35 + 0.1*32 = 17.5 + 7.0 + 3.2 = 27.7 °C
    // Con mameluco tyvek (CAV = +3.0 °C) -> TGBH Efectivo = 30.7 °C
    // Con trabajo pesado continuo (VLE = 25.0 °C) -> Supera VLE ampliamente
    const resExteriorTyvek = evaluateFullThermalStressProtocol({
      ambiental: { tbh: 25, tg: 35, tbs: 32, cargaSolar: true },
      trabajador: {
        puesto: 'Pintor', sector: 'Patio', tarea: 'Pintura exterior',
        ritmo: 'pesado', ciclo: 'continuo', indumentariaId: 'tyvek', cav: 3.0,
        aclimatado: true, aptaMedica: true
      }
    });

    expect(resExteriorTyvek.tgbhMedido).toBe(27.7);
    expect(resExteriorTyvek.cavAplicado).toBe(3.0);
    expect(resExteriorTyvek.tgbhEfectivo).toBe(30.7);
    expect(resExteriorTyvek.limiteExcedido).toBe(true);
    expect(resExteriorTyvek.tasaHidratacionMlPorHora).toBeGreaterThanOrEqual(1000);
  });

  it('debe penalizar con -2.0 °C el VLE para trabajadores no aclimatados', async () => {
    const { evaluateFullThermalStressProtocol } = await import('../srtProtocols');

    // Moderado continuo aclimatado: VLE = 26.7 °C
    // No aclimatado: VLE = 26.7 - 2.0 = 24.7 °C
    const resNoAclimatado = evaluateFullThermalStressProtocol({
      ambiental: { tbh: 23, tg: 27, cargaSolar: false }, // TGBH = 0.7*23 + 0.3*27 = 24.2 °C
      trabajador: {
        puesto: 'Nuevo Ingreso', sector: 'Planta', tarea: 'Ayudante',
        ritmo: 'moderado', ciclo: 'continuo', indumentariaId: 'standard', cav: 0,
        aclimatado: false, aptaMedica: true
      }
    });

    expect(resNoAclimatado.vlePermisible).toBe(24.7);
    expect(resNoAclimatado.vlaAccion).toBe(23.2);
    expect(resNoAclimatado.tgbhEfectivo).toBe(24.2);
    expect(resNoAclimatado.nivelAccionAlcanzado).toBe(true);
    expect(resNoAclimatado.recomendacionesAutomaticas.some(r => r.includes('ACLIMATACIÓN'))).toBe(true);
  });

  it('debe evaluar correctamente el estrés por frío y sensación térmica de viento', async () => {
    const { evaluateColdStressWindChill } = await import('../srtProtocols');

    // Temp -15 °C, viento 30 km/h
    const coldEval = evaluateColdStressWindChill(-15, 30);

    expect(coldEval.evaluarFrio).toBe(true);
    expect(coldEval.sensacionTermicaViento).toBeLessThan(-20);
    expect(coldEval.categoriaRiesgoFrio).toBe('Alto Riesgo (Congelación)');
    expect(coldEval.tiempoMaximoExposicionMin).toBe(30);
    expect(coldEval.requiereProteccionFacial).toBe(true);
  });
});

describe('Estudio Técnico de Carga de Fuego — Decreto 351/79 Anexo VII', () => {
  it('debe calcular madera equivalente y carga de fuego Qf con precisión', async () => {
    const { evaluateFullFireLoadProtocol } = await import('../srtProtocols');

    // 100 m2 con 880 kg de madera (4400 kcal/kg)
    // Total kcal = 880 * 4400 = 3,872,000 kcal
    // Madera equiv = 880 kg
    // Qf = 880 / 100 = 8.80 kg/m2
    // Con R4 y ventilación natural -> F30, 2 extintores mínimo (1A-6B:C)
    const res = evaluateFullFireLoadProtocol({
      superficie: 100,
      riesgo: 'R4',
      ventilacion: 'natural',
      materiales: [
        { nombre: 'Madera (General)', peso: 880, poderCalorifico: 4400 }
      ]
    });

    expect(res.cargaTermicaTotalKcal).toBe(3872000);
    expect(res.maderaEquivalenteKg).toBe(880);
    expect(res.cargaFuegoKgM2).toBe(8.8);
    expect(res.resistenciaFuegoRequerida).toBe('F30');
    expect(res.minExtintores).toBe(2);
    expect(res.potencialExtintorClaseA).toBe('1A');
    expect(res.potencialExtintorClaseB).toBe('6B');
    expect(res.potencialExtintorNominal).toBe('1A-6B:C');
    expect(res.requiereRedHidrantes).toBe(false);
  });

  it('debe diferenciar resistencia al fuego entre local ventilado naturalmente y no ventilado', async () => {
    const { evaluateFullFireLoadProtocol } = await import('../srtProtocols');

    // 100 m2 con Qf = 45 kg/m2 (de 31 a 60 kg/m2) y riesgo R4
    // Natural: F60
    // Sin ventilación: F90
    const resVentilado = evaluateFullFireLoadProtocol({
      superficie: 100,
      riesgo: 'R4',
      ventilacion: 'natural',
      materiales: [
        { nombre: 'Madera', peso: 4500, poderCalorifico: 4400 }
      ]
    });

    const resNoVentilado = evaluateFullFireLoadProtocol({
      superficie: 100,
      riesgo: 'R4',
      ventilacion: 'sin_ventilacion',
      materiales: [
        { nombre: 'Madera', peso: 4500, poderCalorifico: 4400 }
      ]
    });

    expect(resVentilado.cargaFuegoKgM2).toBe(45);
    expect(resVentilado.resistenciaFuegoRequerida).toBe('F60');
    expect(resNoVentilado.resistenciaFuegoRequerida).toBe('F90');
    expect(resVentilado.potencialExtintorClaseA).toBe('2A');
  });

  it('debe activar exigencia de red de hidrantes (Condición E1) por superficie y riesgo', async () => {
    const { evaluateFullFireLoadProtocol } = await import('../srtProtocols');

    // 800 m2 con riesgo R3 (Muy Combustible) supera umbral de 600 m2
    const res = evaluateFullFireLoadProtocol({
      superficie: 800,
      riesgo: 'R3',
      ventilacion: 'natural',
      materiales: [
        { nombre: 'Telas / Algodón', peso: 2000, poderCalorifico: 4000 }
      ]
    });

    expect(res.requiereRedHidrantes).toBe(true);
    expect(res.condicionesAplicables.some(c => c.codigo === 'Condición E1')).toBe(true);
    expect(res.minExtintores).toBe(4); // 800 / 200 = 4 extintores
  });
});




