export interface SafetyKPIs {
  indiceFrecuencia: number; // IF = (Accidentes * 1.000.000) / Horas Hombre
  indiceGravedad: number;   // IG = (Días Perdidos * 1.000.000) / Horas Hombre
  tasaIncidencia: number;   // TI = (Accidentes * 1.000) / N° Trabajadores
  daysWithoutAccidents: number;
  totalAccidents: number;
  totalDaysLost: number;
  totalWorkers: number;
  manHoursWorked: number;
  extinguishersComplianceRate: number;
  capasResolutionRate: number;
}

export function calculateExecutiveKPIs(params: {
  accidentsCount: number;
  daysLostCount: number;
  totalWorkersCount: number;
  workedHoursMonth?: number;
  lastAccidentDateStr?: string;
  extinguishersTotal?: number;
  extinguishersOperative?: number;
  capasTotal?: number;
  capasClosed?: number;
}): SafetyKPIs {
  const {
    accidentsCount = 0,
    daysLostCount = 0,
    totalWorkersCount = 50,
    workedHoursMonth,
    lastAccidentDateStr,
    extinguishersTotal = 0,
    extinguishersOperative = 0,
    capasTotal = 0,
    capasClosed = 0
  } = params;

  // Si no se especifican las horas trabajadas, estimar 170 hs por trabajador al mes
  const manHoursWorked = workedHoursMonth || (totalWorkersCount * 170);

  // Índice de Frecuencia (IF) = (Accidentes con Baja * 1.000.000) / Horas Hombre
  const IF = Number(((accidentsCount * 1000000) / (manHoursWorked || 1)).toFixed(2));

  // Índice de Gravedad (IG) = (Días Perdidos * 1.000.000) / Horas Hombre
  const IG = Number(((daysLostCount * 1000000) / (manHoursWorked || 1)).toFixed(2));

  // Tasa de Incidencia = (Accidentes * 1.000) / N° Trabajadores
  const TI = Number(((accidentsCount * 1000) / (totalWorkersCount || 1)).toFixed(2));

  // Días sin accidentes
  let daysWithoutAccidents = 365;
  if (lastAccidentDateStr) {
    const lastDate = new Date(lastAccidentDateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    daysWithoutAccidents = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Cumplimientos
  const extinguishersComplianceRate = extinguishersTotal > 0
    ? Math.round((extinguishersOperative / extinguishersTotal) * 100)
    : 100;

  const capasResolutionRate = capasTotal > 0
    ? Math.round((capasClosed / capasTotal) * 100)
    : 100;

  return {
    indiceFrecuencia: IF,
    indiceGravedad: IG,
    tasaIncidencia: TI,
    daysWithoutAccidents,
    totalAccidents: accidentsCount,
    totalDaysLost: daysLostCount,
    totalWorkers: totalWorkersCount,
    manHoursWorked,
    extinguishersComplianceRate,
    capasResolutionRate
  };
}
