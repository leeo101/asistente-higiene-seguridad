export interface ATEXEquipmentItem {
  id: string;
  tag: string;
  description: string;
  exMarking: string; // ej. II 2G Ex d IIC T4 Gb
  protectionMode: 'Ex_d' | 'Ex_e' | 'Ex_ia' | 'Ex_ib' | 'Ex_p' | 'Ex_t' | 'standard_non_ex';
  gasGroup: 'IIA' | 'IIB' | 'IIC' | 'IIIA' | 'IIIB' | 'IIIC';
  tempClass: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  ipRating: string; // IP65, IP66
  certificateNumber: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending_verification';
}

export interface ATEXZoneAssessment {
  id: string;
  companyId?: string;
  assessmentNumber: string;
  date: string;
  facilityName: string;
  areaName: string;
  substanceType: 'gas_vapor' | 'combustible_dust' | 'hybrid';
  substanceName: string;
  flashPointC?: number;
  lelPercent?: number;
  ignitionTempC?: number;
  
  assignedZone: '0' | '1' | '2' | '20' | '21' | '22' | 'unclassified';
  ventilationType: 'natural' | 'forced_mechanical' | 'none';
  ventilationDegree: 'high' | 'medium' | 'low';
  
  safetyControls: {
    groundingBonding: boolean;
    gasDetectionSystem: boolean;
    nonSparkingTools: boolean;
    antistaticFootwearRequired: boolean;
    hotWorkPermitMandatory: boolean;
  };

  equipmentList: ATEXEquipmentItem[];
  auditorName: string;
  auditorEnrollment: string;
  status: 'valid' | 'action_required' | 'under_review';
  notes?: string;
  createdAt: string;
}

export const ATEX_ZONES_GUIDE = {
  '0': { label: 'Zona 0 (Gases)', desc: 'Presencia continua o prolongada (> 1000 h/año). Ej. Interior de tanques de combustible.' },
  '1': { label: 'Zona 1 (Gases)', desc: 'Probable en operación normal (10 a 1000 h/año). Ej. Alrededor de bocas de carga, bombas.' },
  '2': { label: 'Zona 2 (Gases)', desc: 'Poco probable y de corta duración (< 10 h/año). Ej. Sala de compresores bien ventilada.' },
  '20': { label: 'Zona 20 (Polvos)', desc: 'Nube de polvo combustible permanente. Ej. Interior de silos de granos o tolvas de molienda.' },
  '21': { label: 'Zona 21 (Polvos)', desc: 'Probable en operación normal. Ej. Boca de embolsado o puntos de transferencia.' },
  '22': { label: 'Zona 22 (Polvos)', desc: 'Poco probable y por corto tiempo. Ej. Depósito de bolsas de harina/azúcar.' }
};
