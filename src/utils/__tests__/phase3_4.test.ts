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

