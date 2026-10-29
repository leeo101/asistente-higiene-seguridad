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

export interface ATEXSafetyControls {
  groundingBonding: boolean;
  gasDetectionSystem: boolean;
  nonSparkingTools: boolean;
  antistaticFootwearRequired: boolean;
  hotWorkPermitMandatory: boolean;
  exConduitSealsVerified?: boolean;
  explosionReliefVenting?: boolean;
  areaSignageAtExPosted?: boolean;
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

  safetyControls: ATEXSafetyControls;

  equipmentList: ATEXEquipmentItem[];
  auditorName: string;
  auditorEnrollment: string;

  // Personal de sector / planta y firmas digitalizadas (estilo ATS)
  operatorName?: string;
  operatorLicense?: string;
  plantResponsible?: string;
  plantResponsibleRole?: string;
  operatorSignature?: string | null;
  plantResponsibleSignature?: string | null;
  auditorSignature?: string | null;
  professionalStamp?: string | null;
  professionalTitle?: string;
  showSignatures?: {
    operator: boolean;
    supervisor: boolean;
    professional: boolean;
  };

  status: 'valid' | 'action_required' | 'under_review';
  notes?: string;
  createdAt: string;
}

export const ATEX_ZONES_GUIDE: Record<
  string,
  {
    label: string;
    shortLabel: string;
    type: 'gas' | 'dust';
    epl: string;
    category: string;
    hours: string;
    desc: string;
    protectionReq: string;
  }
> = {
  '0': {
    label: 'Zona 0 (Gases / Vapores Continuos)',
    shortLabel: 'ZONA 0 — GAS CONTINUO',
    type: 'gas',
    epl: 'EPL Ga',
    category: 'Categoría 1G',
    hours: '> 1.000 h/año',
    desc: 'Presencia continua o por largos períodos de mezcla explosiva gas/aire. Ej.: Interior de tanques de almacenamiento o reactores cerrados.',
    protectionReq: 'Exige equipos de Seguridad Intrínseca Ex ia (Categoría 1G / EPL Ga). Prohibido todo equipo eléctrico estándar.'
  },
  '1': {
    label: 'Zona 1 (Gases / Vapores en Operación Normal)',
    shortLabel: 'ZONA 1 — GAS OPERACIÓN NORMAL',
    type: 'gas',
    epl: 'EPL Gb',
    category: 'Categoría 2G',
    hours: '10 a 1.000 h/año',
    desc: 'Probable formación de atmósfera explosiva durante la operación normal. Ej.: Salas de bombas de solventes, bocas de carga/trasvase.',
    protectionReq: 'Exige equipos antideflagrantes Ex d, seguridad aumentada Ex e o presurizados Ex p (Categoría 2G / EPL Gb o superior).'
  },
  '2': {
    label: 'Zona 2 (Gases / Vapores Ocasionales)',
    shortLabel: 'ZONA 2 — GAS OCASIONAL / FALLA',
    type: 'gas',
    epl: 'EPL Gc',
    category: 'Categoría 3G',
    hours: '< 10 h/año',
    desc: 'Poco probable en operación normal; si ocurre, persiste por corto tiempo (fuga accidental). Ej.: Alrededor de bridas o salas bien ventiladas.',
    protectionReq: 'Permite equipos Ex n / Ex ec (Categoría 3G / EPL Gc) o superiores (2G / 1G).'
  },
  '20': {
    label: 'Zona 20 (Polvos Combustibles Continuos)',
    shortLabel: 'ZONA 20 — POLVO CONTINUO',
    type: 'dust',
    epl: 'EPL Da',
    category: 'Categoría 1D',
    hours: '> 1.000 h/año',
    desc: 'Nube de polvo combustible presente de forma continua o prolongada. Ej.: Interior de silos de cereal, ciclones, filtros de mangas y molinos.',
    protectionReq: 'Exige protección por envolvente estanca al polvo Ex ta (Categoría 1D / EPL Da) e IP6X.'
  },
  '21': {
    label: 'Zona 21 (Polvos en Operación Normal)',
    shortLabel: 'ZONA 21 — POLVO OPERACIÓN NORMAL',
    type: 'dust',
    epl: 'EPL Db',
    category: 'Categoría 2D',
    hours: '10 a 1.000 h/año',
    desc: 'Probable formación de nube de polvo combustible en operación normal. Ej.: Puntos de embolsado, descarga de tolvas y zarandas.',
    protectionReq: 'Exige equipos protegidos contra polvo Ex tb (Categoría 2D / EPL Db) con grado IP65/IP66.'
  },
  '22': {
    label: 'Zona 22 (Polvos Ocasionales / Capas)',
    shortLabel: 'ZONA 22 — POLVO OCASIONAL',
    type: 'dust',
    epl: 'EPL Dc',
    category: 'Categoría 3D',
    hours: '< 10 h/año',
    desc: 'No es probable en operación normal, pero puede ocurrir brevemente por levantamiento de capas de polvo acumulado. Ej.: Depósitos de bolsas.',
    protectionReq: 'Exige equipos Ex tc (Categoría 3D / EPL Dc) con protección mínima IP54/IP65 y plan de limpieza de capas.'
  }
};

export const ATEX_MANDATORY_CONTROLS: {
  key: keyof ATEXSafetyControls;
  label: string;
  law: string;
  desc: string;
}[] = [
  {
    key: 'groundingBonding',
    label: 'Puesta a tierra disipativa e interconexión equipotencial (Bonding)',
    law: 'NFPA 77 / IEC 60079-32-1 / Res. SRT 900/15',
    desc: 'Pinzas y cables de vinculación equipotencial en tambores, bombas, cañerías y camiones cisterna (< 10 Ω).'
  },
  {
    key: 'gasDetectionSystem',
    label: 'Sistema de detección fija/portátil de gases (Explosímetro LEL 10% / 20%)',
    law: 'IEC 60079-29 / Dec. 351/79 Cap. 18',
    desc: 'Enclavamiento de corte y alarma acústico-luminosa calibrada al 10% LEL (pre-alarma) y 20% LEL (corte).'
  },
  {
    key: 'nonSparkingTools',
    label: 'Herramientas manuales antichispa certificadas (Aleación Cu-Be / Bronce-Aluminio)',
    law: 'EN 1127-1 / Dec. 351/79 Art. 165',
    desc: 'Prohibición de herramientas ferrosas que generen chispas mecánicas por impacto o fricción en Zonas 0/1/20/21.'
  },
  {
    key: 'antistaticFootwearRequired',
    label: 'Calzado de seguridad antiestático / disipativo e indumentaria ignífuga',
    law: 'IRAM 3610 / ISO 20345 / NFPA 2112',
    desc: 'Prohibido el uso de fibras sintéticas generadoras de descarga electrostática (ESD) en áreas clasificadas.'
  },
  {
    key: 'hotWorkPermitMandatory',
    label: 'Permiso de Trabajo en Caliente y monitoreo continuo de LEL obligatorio',
    law: 'NFPA 51B / Dec. 351/79 Cap. 18',
    desc: 'Prohibido soldar, amolar o cortar sin desgasificación previa, bloqueo LOTO y medición 0% LEL.'
  },
  {
    key: 'exConduitSealsVerified',
    label: 'Sellos cortafuego (Y / EYS) y prensaestopas Ex d/e verificados',
    law: 'IEC 60079-14 / AEA 90364 / NFPA 70 Art. 500',
    desc: 'Sellado con compuesto certificado a menos de 45 cm de cada envolvente antideflagrante para impedir propagación.'
  },
  {
    key: 'explosionReliefVenting',
    label: 'Paneles de venteo de deflagración / arrestallamas y limpieza de polvos',
    law: 'NFPA 68 / NFPA 652 / IEC 60079-10-2',
    desc: 'Arrestallamas en venteos de tanques de inflamables y control de capas de polvo (< 0.8 mm en superficies).'
  },
  {
    key: 'areaSignageAtExPosted',
    label: 'Señalización perimetral normalizada "EX — ATMÓSFERA EXPLOSIVA" y control de acceso',
    law: 'Directiva 1999/92/CE / IRAM 10005',
    desc: 'Cartelería triangular amarilla EX en todos los ingresos y prohibición de ingreso con celulares o encendedores.'
  }
];
