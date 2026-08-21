export interface ContractorDocStatus {
  contractorName: string;
  cuit: string;
  hasF931: boolean;
  f931ExpirationDate: string;
  hasARTClause: boolean;
  artExpirationDate: string;
  hasLifeInsurance: boolean;
  lifeInsuranceExpirationDate: string;
  hasPPEDeliveryRecord: boolean;
}

export interface ContractorComplianceResult {
  status: 'Apto (Verde)' | 'Observado (Amarillo)' | 'Bloqueado (Rojo)';
  canEnterSite: boolean;
  expiredDocs: string[];
  missingDocs: string[];
}

export function evaluateContractorStatus(doc: ContractorDocStatus): ContractorComplianceResult {
  const todayStr = new Date().toISOString().split('T')[0];
  const expiredDocs: string[] = [];
  const missingDocs: string[] = [];

  if (!doc.hasF931) missingDocs.push('Formulario 931 AFIP');
  else if (doc.f931ExpirationDate < todayStr) expiredDocs.push(`Formulario 931 Vencido (${doc.f931ExpirationDate})`);

  if (!doc.hasARTClause) missingDocs.push('Cláusula de No Repetición ART');
  else if (doc.artExpirationDate < todayStr) expiredDocs.push(`ART Vencida (${doc.artExpirationDate})`);

  if (!doc.hasLifeInsurance) missingDocs.push('Seguro de Vida Obligatorio');
  else if (doc.lifeInsuranceExpirationDate < todayStr) expiredDocs.push(`Seguro de Vida Vencido (${doc.lifeInsuranceExpirationDate})`);

  if (!doc.hasPPEDeliveryRecord) missingDocs.push('Planilla de Entrega de EPP (Res. 299/11)');

  let status: ContractorComplianceResult['status'] = 'Apto (Verde)';
  let canEnterSite = true;

  if (expiredDocs.length > 0 || missingDocs.includes('ART') || missingDocs.includes('Formulario 931 AFIP')) {
    status = 'Bloqueado (Rojo)';
    canEnterSite = false;
  } else if (missingDocs.length > 0) {
    status = 'Observado (Amarillo)';
    canEnterSite = true; // Ingreso condicional por 48 hs
  }

  return {
    status,
    canEnterSite,
    expiredDocs,
    missingDocs
  };
}
