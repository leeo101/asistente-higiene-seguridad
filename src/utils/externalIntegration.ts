import { calculateExecutiveKPIs } from './safetyMetrics';

export interface PowerBIPayload {
  generatedAt: string;
  companyName: string;
  kpis: ReturnType<typeof calculateExecutiveKPIs>;
  extinguishersSummary: {
    total: number;
    operative: number;
    expired: number;
  };
  openCAPAsCount: number;
}

/**
  Genera un esquema JSON normalizado listo para Power BI / Google Looker Studio / OData
 */
export function exportToPowerBIJson(companyName: string = 'Mi Empresa'): PowerBIPayload {
  let extinguishers = [];
  let capas = [];

  try {
    const extStr = localStorage.getItem('extinguishers_inventory');
    if (extStr) extinguishers = JSON.parse(extStr);

    const capaStr = localStorage.getItem('ehs_capa_db');
    if (capaStr) capas = JSON.parse(capaStr);
  } catch (e) {}

  const operativeExt = extinguishers.filter((e: any) => e.estadoFisico === 'Operativo').length;
  const expiredExt = extinguishers.length - operativeExt;
  const closedCAPAs = capas.filter((c: any) => c.status === 'Cerrado' || c.status === 'Verificado').length;

  const kpis = calculateExecutiveKPIs({
    accidentsCount: 0,
    daysLostCount: 0,
    totalWorkersCount: 45,
    extinguishersTotal: extinguishers.length,
    extinguishersOperative: operativeExt,
    capasTotal: capas.length,
    capasClosed: closedCAPAs
  });

  return {
    generatedAt: new Date().toISOString(),
    companyName,
    kpis,
    extinguishersSummary: {
      total: extinguishers.length,
      operative: operativeExt,
      expired: expiredExt
    },
    openCAPAsCount: capas.length - closedCAPAs
  };
}

/**
  Descarga el JSON de exportación para Power BI
 */
export function downloadPowerBIJson(companyName: string = 'Mi Empresa') {
  const data = exportToPowerBIJson(companyName);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PowerBI_Dataset_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
