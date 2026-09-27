export interface HazardousWasteRecord {
  id: string;
  companyId?: string;
  entryDate: string;
  currentY: string; // Ej. Y8, Y9, Y12, Y31
  hazardR: string; // Ej. R3 (Inflamable), R6 (Tóxico)
  description: string;
  quantityKg: number;
  containerType: 'drum_200l' | 'ibc_1000l' | 'bag_bigbag' | 'bin_container' | 'other';
  containerQuantity: number;
  physicalState: 'liquido' | 'solido' | 'semisolido' | 'gaseoso';
  generatorArea: string;
  storageLocation: string; // Depósito de residuos
  status: 'stored' | 'in_transit' | 'disposed';
  
  // Despacho / Manifiesto
  manifestNumber?: string;
  transportDate?: string;
  transporterName?: string;
  transporterCuit?: string;
  transporterRegistryNumber?: string;
  vehiclePlate?: string;
  
  // Disposición Final
  disposalCertificateNumber?: string;
  disposalFacilityName?: string;
  disposalMethod?: 'incineracion' | 'confinamiento_celda' | 'reciclado_regeneracion' | 'tratamiento_fisicoquimico';
  disposalDate?: string;

  notes?: string;
  createdAt: string;
}

export const HAZARDOUS_Y_STREAMS = [
  { code: 'Y8', name: 'Y8 - Desechos de aceites minerales no aptos para el uso al que estaban destinados' },
  { code: 'Y9', name: 'Y9 - Mezclas y emulsiones de aceite y agua o de hidrocarburos y agua' },
  { code: 'Y12', name: 'Y12 - Desechos resultantes de la producción y utilización de tintas, colorantes, pinturas y barnices' },
  { code: 'Y13', name: 'Y13 - Desechos resultantes de la producción y utilización de resinas, látex, plastificantes o colas' },
  { code: 'Y18', name: 'Y18 - Residuos resultantes de las operaciones de eliminación de desechos industriales' },
  { code: 'Y29', name: 'Y29 - Mercurio y compuestos de mercurio' },
  { code: 'Y31', name: 'Y31 - Plomo y compuestos de plomo (baterías, soldaduras)' },
  { code: 'Y34', name: 'Y34 - Soluciones ácidas o ácidos en forma sólida' },
  { code: 'Y35', name: 'Y35 - Soluciones básicas o bases en forma sólida' },
  { code: 'Y48', name: 'Y48 - Materiales con asbesto / amianto' },
  { code: 'Y1', name: 'Y1 - Desechos clínicos resultantes de atención médica en centros o enfermería' }
];

export const HAZARD_R_CODES = [
  { code: 'R1', label: 'R1 - Explosivo' },
  { code: 'R3', label: 'R3 - Líquidos Inflamables' },
  { code: 'R4', label: 'R4 - Sólidos Inflamables' },
  { code: 'R5', label: 'R5 - Sustancias propensas a combustión espontánea' },
  { code: 'R6', label: 'R6 - Sustancias tóxicas (venenosas)' },
  { code: 'R8', label: 'R8 - Sustancias corrosivas' },
  { code: 'R9', label: 'R9 - Ecotóxicos (peligrosos para el medio ambiente acuático)' }
];
