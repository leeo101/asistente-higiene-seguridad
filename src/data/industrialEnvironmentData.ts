export interface EmissionSampleRecord {
  id: string;
  companyId?: string;
  reportNumber: string;
  date: string;
  sampleType: 'gas_emission' | 'liquid_effluent';
  pointName: string; // ej. Chimenea Caldera 1 o Cámara de Toma de Efluentes
  laboratoryName: string;
  sampleProtocolNumber: string;
  responsibleAuditor: string;

  // Si es Emisiones
  gasParameters?: {
    particulateMatterMgNm3: number; // Lim: 150 mg/Nm3
    coPpm: number; // Lim: 500 ppm
    noxMgNm3: number; // Lim: 300 mg/Nm3
    so2MgNm3: number; // Lim: 500 mg/Nm3
    gasFlowM3H: number;
    gasTempC: number;
  };

  // Si es Efluentes
  liquidParameters?: {
    ph: number; // Lim: 6.5 - 8.5
    tempC: number; // Lim: < 35°C
    dbo5MgL: number; // Lim: 200 mg/L (vuelco cloacal) o 50 mg/L (curso de agua)
    dqoMgL: number; // Lim: 500 mg/L
    oilsAndGreaseMgL: number; // Lim: 50 mg/L
    settleableSolidsMlL: number; // Lim: 1.0 ml/L
    dailyFlowM3Day: number;
  };

  complianceOverall: 'compliant' | 'exceeded_limits';
  dischargeDestination?: 'cloaca' | 'pluvial' | 'curso_agua_superficial' | 'suelo';
  auditorSignature?: string;
  notes?: string;
  createdAt: string;
}

export const LEGAL_LIMITS = {
  gas: {
    pmMax: 150, // mg/Nm3
    coMax: 500, // ppm
    noxMax: 300, // mg/Nm3
    so2Max: 500 // mg/Nm3
  },
  liquid: {
    phMin: 6.5,
    phMax: 8.5,
    tempMax: 35,
    dbo5Max: 200,
    dqoMax: 500,
    oilsMax: 50,
    settleableMax: 1.0
  }
};
