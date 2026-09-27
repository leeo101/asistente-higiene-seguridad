export interface AEDDevice {
  id: string;
  companyId?: string;
  code: string;
  location: string;
  brandModel: string;
  serialNumber: string;
  batteryLevelPercent: number;
  batteryExpiryDate: string;
  padsAdultExpiryDate: string;
  padsPediatricExpiryDate?: string;
  lastTestDate: string;
  status: 'operational' | 'battery_warning' | 'pads_expired' | 'fault';
  responsiblePerson: string;
  notes?: string;
}

export interface FirstAidKitItem {
  name: string;
  requiredQty: number;
  currentQty: number;
  unit: string;
  expiredDate?: string;
}

export interface FirstAidKit {
  id: string;
  companyId?: string;
  code: string;
  location: string;
  type: 'type_a_small' | 'type_b_medium' | 'type_c_industrial';
  lastInspectionDate: string;
  inspectorName: string;
  status: 'complete' | 'restock_needed' | 'expired_items';
  items: FirstAidKitItem[];
}

export interface MinorInjuryRecord {
  id: string;
  companyId?: string;
  date: string;
  time: string;
  workerName: string;
  workerCuil: string;
  area: string;
  injuryType: 'corte_superficial' | 'raspon_escoriacion' | 'cuerpo_extrano_ocular' | 'quemadura_menor' | 'contusion_leve';
  treatmentDescription: string;
  itemsUsed: string;
  firstResponderName: string;
  outcome: 'returned_to_work' | 'referred_to_art_clinic';
}

export const DEFAULT_KIT_ITEMS: Record<string, FirstAidKitItem[]> = {
  type_b_medium: [
    { name: 'Gasas estériles individuales (10x10 cm)', requiredQty: 20, currentQty: 20, unit: 'sobres' },
    { name: 'Vendas de gasa cambric (10 cm x 3 m)', requiredQty: 5, currentQty: 5, unit: 'rollos' },
    { name: 'Cinta adhesiva hipoalergénica (2.5 cm)', requiredQty: 2, currentQty: 2, unit: 'rollos' },
    { name: 'Apósitos adhesivos ("curitas")', requiredQty: 30, currentQty: 30, unit: 'unidades' },
    { name: 'Tijera multipropósito corta-todo', requiredQty: 1, currentQty: 1, unit: 'unidad' },
    { name: 'Guantes de examen descartables (nitrilo/látex)', requiredQty: 10, currentQty: 10, unit: 'pares' },
    { name: 'Antiséptico de Clorhexidina / Iodo', requiredQty: 1, currentQty: 1, unit: 'frasco' },
    { name: 'Solución fisiológica para lavado ocular (250 ml)', requiredQty: 2, currentQty: 2, unit: 'frascos' },
    { name: 'Férula semirrígida moldeable p/ inmovilizar', requiredQty: 1, currentQty: 1, unit: 'unidad' }
  ]
};
