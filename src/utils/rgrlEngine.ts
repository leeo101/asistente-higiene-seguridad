import type { RGRLItem, RGRLPlanItem, RGRLAnnexType } from '../types/rgrl';

/**
 * Banco de preguntas oficiales del Relevamiento General de Riesgos Laborales
 * Res. SRT 463/09, 529/09 y 74/10
 */

export const ANEXO1_DEC351_QUESTIONS: Omit<RGRLItem, 'id' | 'estado'>[] = [
  // 1. Servicio de Higiene y Seguridad
  {
    codigo: '1.1',
    seccion: '1. Servicio de Higiene y Seguridad',
    pregunta: '¿Posee Servicio de Higiene y Seguridad en el Trabajo interno o externo?',
    normativa: 'Dec. 351/79 Cap. 4 Art. 14 / Dec. 1338/96'
  },
  {
    codigo: '1.2',
    seccion: '1. Servicio de Higiene y Seguridad',
    pregunta: '¿Cumple con la asignación de horas profesionales mensuales exigidas por ley?',
    normativa: 'Dec. 1338/96 Art. 11 y 12'
  },
  {
    codigo: '1.3',
    seccion: '1. Servicio de Higiene y Seguridad',
    pregunta: '¿Posee Legajo Técnico de Higiene y Seguridad actualizado con firma profesional?',
    normativa: 'Dec. 351/79 Anexo I Cap. 4'
  },

  // 2. Servicio de Medicina del Trabajo
  {
    codigo: '2.1',
    seccion: '2. Servicio de Medicina Laboral',
    pregunta: '¿Posee Servicio de Medicina del Trabajo con profesional médico asignado?',
    normativa: 'Dec. 1338/96 Art. 4'
  },
  {
    codigo: '2.2',
    seccion: '2. Servicio de Medicina Laboral',
    pregunta: '¿Se realizan los exámenes médicos periódicos anuales a través de la ART?',
    normativa: 'Res. SRT 37/10 Art. 3'
  },
  {
    codigo: '2.3',
    seccion: '2. Servicio de Medicina Laboral',
    pregunta: '¿Dispone de botiquín de primeros auxilios completo y señalizado?',
    normativa: 'Dec. 351/79 Anexo I Cap. 22'
  },

  // 3. Capacitación
  {
    codigo: '3.1',
    seccion: '3. Capacitación y Adiestramiento',
    pregunta: '¿Existe un Programa Anual de Capacitación en materia de Higiene y Seguridad?',
    normativa: 'Dec. 351/79 Cap. 21 Art. 208'
  },
  {
    codigo: '3.2',
    seccion: '3. Capacitación y Adiestramiento',
    pregunta: '¿Se imparten capacitaciones con constancia escrita y firmas de los trabajadores?',
    normativa: 'Dec. 351/79 Cap. 21 Art. 211'
  },

  // 4. Elementos de Protección Personal (EPP)
  {
    codigo: '4.1',
    seccion: '4. Elementos de Protección Personal (EPP)',
    pregunta: '¿Se provee de EPP adecuados y certificados (sello IRAM / S) según los riesgos del puesto?',
    normativa: 'Dec. 351/79 Cap. 19 / Res. SRT 299/11'
  },
  {
    codigo: '4.2',
    seccion: '4. Elementos de Protección Personal (EPP)',
    pregunta: '¿Se registra la entrega de EPP en las planillas oficiales con firma del trabajador?',
    normativa: 'Res. SRT 299/11 Anexo I'
  },

  // 5. Instalaciones Eléctricas
  {
    codigo: '5.1',
    seccion: '5. Instalaciones Eléctricas',
    pregunta: '¿Cuenta con protocolo de medición de Puesta a Tierra y Continuidad con validez anual?',
    normativa: 'Res. SRT 900/15'
  },
  {
    codigo: '5.2',
    seccion: '5. Instalaciones Eléctricas',
    pregunta: '¿Todos los circuitos cuentan con interruptor diferencial (disyuntor 30mA) operativo?',
    normativa: 'Reglamentación AEA 90364 / Dec. 351/79 Anexo VI'
  },
  {
    codigo: '5.3',
    seccion: '5. Instalaciones Eléctricas',
    pregunta: '¿Los tableros eléctricos están cerrados, señalizados con peligro eléctrico y esquema unifilar?',
    normativa: 'Dec. 351/79 Anexo VI Cap. 14'
  },

  // 6. Prevención y Protección contra Incendios
  {
    codigo: '6.1',
    seccion: '6. Protección contra Incendios',
    pregunta: '¿Dispone de estudio de Carga de Fuego y cálculo de potencial extintor mínimo?',
    normativa: 'Dec. 351/79 Anexo VII Cap. 18'
  },
  {
    codigo: '6.2',
    seccion: '6. Protección contra Incendios',
    pregunta: '¿Los extintores cuentan con control periódico, tarjeta de mantenimiento y oblea IRAM 3517 vigente?',
    normativa: 'IRAM 3517-2 / Dec. 351/79 Cap. 18'
  },
  {
    codigo: '6.3',
    seccion: '6. Protección contra Incendios',
    pregunta: '¿Las salidas de emergencia se encuentran libres de obstáculos, señalizadas e iluminadas?',
    normativa: 'Dec. 351/79 Anexo VII Art. 172'
  },
  {
    codigo: '6.4',
    seccion: '6. Protección contra Incendios',
    pregunta: '¿Se realizan simulacros de evacuación al menos 1 o 2 veces al año con registro de tiempos?',
    normativa: 'Dec. 351/79 Anexo VII Art. 187'
  },

  // 7. Aparatos Sometidos a Presión (ASP)
  {
    codigo: '7.1',
    seccion: '7. Aparatos Sometidos a Presión',
    pregunta: '¿Los compresores y calderas cuentan con habilitación e inspección periódica vigente?',
    normativa: 'Dec. 351/79 Cap. 16'
  },
  {
    codigo: '7.2',
    seccion: '7. Aparatos Sometidos a Presión',
    pregunta: '¿Las válvulas de seguridad y manómetros se encuentran calibrados y precintados?',
    normativa: 'Dec. 351/79 Anexo I Cap. 16'
  },

  // 8. Condiciones Ambientales y Ergonomía
  {
    codigo: '8.1',
    seccion: '8. Ergonomía y Contaminantes Físicos',
    pregunta: '¿Dispone de protocolo de medición de Iluminación conforme a Res. SRT 84/12?',
    normativa: 'Res. SRT 84/12 / Dec. 351/79 Anexo IV'
  },
  {
    codigo: '8.2',
    seccion: '8. Ergonomía y Contaminantes Físicos',
    pregunta: '¿Dispone de protocolo de medición de Ruido en los puestos de trabajo?',
    normativa: 'Res. SRT 85/12 / Res. SRT 295/03'
  },
  {
    codigo: '8.3',
    seccion: '8. Ergonomía y Contaminantes Físicos',
    pregunta: '¿Se implementó el protocolo de Ergonomía según Res. SRT 886/15 (Planillas 1, 2 y 3)?',
    normativa: 'Res. SRT 886/15'
  },

  // 9. Sustancias Químicas
  {
    codigo: '9.1',
    seccion: '9. Sustancias Químicas Peligrosas',
    pregunta: '¿Dispone de Fichas de Datos de Seguridad (FDS/SDS) con etiquetado bajo Sistema GHS/SGA?',
    normativa: 'Res. SRT 801/15 (GHS/SGA)'
  },

  // 10. Sanitarios y Vestuarios
  {
    codigo: '10.1',
    seccion: '10. Instalaciones Sanitarias',
    pregunta: '¿Los sanitarios y vestuarios se encuentran limpios, diferenciados por sexo y con agua potable?',
    normativa: 'Dec. 351/79 Cap. 5'
  }
];

export const ANEXO2_DEC911_QUESTIONS: Omit<RGRLItem, 'id' | 'estado'>[] = [
  {
    codigo: '1.1',
    seccion: '1. Programa de Seguridad en Obra',
    pregunta: '¿Posee Programa de Seguridad aprobado por la ART con aviso de inicio de obra?',
    normativa: 'Res. SRT 51/97, 35/98 o 319/99'
  },
  {
    codigo: '1.2',
    seccion: '1. Programa de Seguridad en Obra',
    pregunta: '¿Cuenta con profesional de Higiene y Seguridad asignado a la obra con visitas documentadas?',
    normativa: 'Dec. 911/96 Cap. 3 Art. 16'
  },
  {
    codigo: '2.1',
    seccion: '2. Trabajos en Altura y Andamios',
    pregunta: '¿Los andamios cuentan con barandas reglamentarias (a 1m y 0.5m), zócalos y piso completo?',
    normativa: 'Dec. 911/96 Cap. 12 Art. 210'
  },
  {
    codigo: '2.2',
    seccion: '2. Trabajos en Altura y Andamios',
    pregunta: '¿Los trabajadores en altura utilizan arnés de cuerpo entero con cabo de vida anclado a punto fijo?',
    normativa: 'Dec. 911/96 Cap. 7 / Res. 299/11'
  },
  {
    codigo: '3.1',
    seccion: '3. Instalaciones Eléctricas de Obra',
    pregunta: '¿Los tableros de obra cuentan con disyuntor diferencial de 30mA y puesta a tierra efectiva?',
    normativa: 'Dec. 911/96 Cap. 6 Art. 88 / AEA 90364-7-771'
  },
  {
    codigo: '4.1',
    seccion: '4. Excavaciones y Demoliciones',
    pregunta: '¿Las excavaciones de más de 1.5m cuentan con apuntalamiento o talud natural de seguridad?',
    normativa: 'Dec. 911/96 Cap. 9 / Res. SRT 35/98'
  },
  {
    codigo: '5.1',
    seccion: '5. Orden y Limpieza',
    pregunta: '¿Las zonas de paso y escaleras se encuentran libres de escombros y materiales acopiados?',
    normativa: 'Dec. 911/96 Cap. 4 Art. 40'
  }
];

export const ANEXO3_DEC617_QUESTIONS: Omit<RGRLItem, 'id' | 'estado'>[] = [
  {
    codigo: '1.1',
    seccion: '1. Servicio y Prevención',
    pregunta: '¿Cuenta con asesoramiento en Higiene y Seguridad en el Trabajo en el establecimiento rural?',
    normativa: 'Dec. 617/97 Cap. 2'
  },
  {
    codigo: '2.1',
    seccion: '2. Maquinaria y Tractores',
    pregunta: '¿Los tractores poseen estructura de protección antivuelco (ROPS) y cinturón de seguridad?',
    normativa: 'Dec. 617/97 Cap. 3 Art. 12'
  },
  {
    codigo: '2.2',
    seccion: '2. Maquinaria y Tractores',
    pregunta: '¿Las tomas de fuerza, poleas y engranajes de la maquinaria cuentan con protección integral?',
    normativa: 'Dec. 617/97 Cap. 3 Art. 15'
  },
  {
    codigo: '3.1',
    seccion: '3. Agroquímicos y Plaguicidas',
    pregunta: '¿Los productos fitosanitarios se almacenan en depósito exclusivo cerrado y ventilado?',
    normativa: 'Dec. 617/97 Cap. 6 Art. 30'
  },
  {
    codigo: '3.2',
    seccion: '3. Agroquímicos y Plaguicidas',
    pregunta: '¿Los aplicadores cuentan con EPP específico (mameluco impermeable, máscara c/filtros, guantes de nitrilo)?',
    normativa: 'Dec. 617/97 Cap. 6 Art. 35'
  },
  {
    codigo: '4.1',
    seccion: '4. Instalaciones y Silos',
    pregunta: '¿Los silos cuentan con escaleras seguras con guardahombre y ventilación previa al ingreso?',
    normativa: 'Dec. 617/97 Cap. 4'
  }
];

export function getDefaultQuestionsForAnnex(anexo: RGRLAnnexType): RGRLItem[] {
  let list = ANEXO1_DEC351_QUESTIONS;
  if (anexo === 'anexo2_911') list = ANEXO2_DEC911_QUESTIONS;
  if (anexo === 'anexo3_617') list = ANEXO3_DEC617_QUESTIONS;

  return list.map((q, idx) => ({
    ...q,
    id: `item-${idx + 1}`,
    estado: 'CUMPLE',
    observacion: '',
    plazoRegularizacion: '',
    responsable: ''
  }));
}

export interface RGRLAuditMetrics {
  totalItems: number;
  cumpleCount: number;
  noCumpleCount: number;
  noAplicaCount: number;
  evaluablesCount: number;
  porcentajeCumplimiento: number;
  estadoGeneral: 'Óptimo (≥ 90%)' | 'Aceptable (75-89%)' | 'Crítico (< 75%)';
  itemsNoCumple: RGRLItem[];
}

export function calculateRGRLMetrics(items: RGRLItem[]): RGRLAuditMetrics {
  const total = items.length;
  let cumple = 0;
  let noCumple = 0;
  let noAplica = 0;
  const itemsNoCumple: RGRLItem[] = [];

  items.forEach(it => {
    if (it.estado === 'CUMPLE') cumple++;
    else if (it.estado === 'NO_CUMPLE') {
      noCumple++;
      itemsNoCumple.push(it);
    } else if (it.estado === 'NO_APLICA') {
      noAplica++;
    }
  });

  const evaluables = cumple + noCumple;
  const porcentaje = evaluables > 0 ? Math.round((cumple / evaluables) * 100) : 100;

  let estadoGeneral: RGRLAuditMetrics['estadoGeneral'] = 'Óptimo (≥ 90%)';
  if (porcentaje < 75) estadoGeneral = 'Crítico (< 75%)';
  else if (porcentaje < 90) estadoGeneral = 'Aceptable (75-89%)';

  return {
    totalItems: total,
    cumpleCount: cumple,
    noCumpleCount: noCumple,
    noAplicaCount: noAplica,
    evaluablesCount: evaluables,
    porcentajeCumplimiento: porcentaje,
    estadoGeneral,
    itemsNoCumple
  };
}

export function generatePlanRegularizacion(itemsNoCumple: RGRLItem[], diasDefault = 30): RGRLPlanItem[] {
  return itemsNoCumple.map((item, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + diasDefault);
    return {
      id: `plan-${idx + 1}`,
      codigo: item.codigo,
      seccion: item.seccion,
      descripcionIncumplimiento: item.pregunta,
      medidaCorrectiva: item.observacion || `Adecuar las instalaciones según ${item.normativa}.`,
      plazoEstimadoDias: diasDefault,
      fechaLimite: d.toISOString().split('T')[0],
      responsable: item.responsable || 'Higiene y Seguridad / Mantenimiento'
    };
  });
}
