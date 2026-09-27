export interface HotWorkPermitData {
  id: string;
  companyId?: string;
  permitNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  area: string;
  activityType: string;
  description: string;
  operatorName: string;
  operatorCuil?: string;
  supervisorName: string;
  fireWatchName: string;
  fireWatchPostCheckTime: number; // 30 o 60 min
  
  // Mediciones de Atmósfera
  gasMeasurement: {
    required: boolean;
    oxygenPercent: number; // 19.5 - 23.5%
    lelPercent: number; // < 10% LEL
    coPpm: number;
    h2sPpm: number;
    testedAt: string;
    testerName: string;
    equipmentModel: string;
  };

  // Checklist NFPA 51B (Radio 11m)
  checklist: {
    combustiblesCleared11m: boolean;
    floorsProtected: boolean;
    wallHolesCovered: boolean;
    pipesPurgedInerted: boolean;
    extinguisherOnSite: boolean;
    extinguisherType: string;
    fireScreensInstalled: boolean;
    ventilationActive: boolean;
    sprinklersProtected: boolean;
    fireWatchAssigned: boolean;
  };

  // EPP Obligatorio
  ppe: {
    weldingHelmet: boolean;
    leatherGloves: boolean;
    leatherApron: boolean;
    safetyBoots: boolean;
    respiratorFumes: boolean;
    earProtection: boolean;
  };

  status: 'active' | 'completed' | 'suspended' | 'expired';
  notes: string;
  operatorSignature?: string;
  supervisorSignature?: string;
  fireWatchSignature?: string;
  createdAt: string;
}

export const HOT_WORK_ACTIVITIES = [
  { id: 'smaw', name: 'Soldadura por Arco Eléctrico (SMAW/Electrodo)', icon: '⚡' },
  { id: 'mig_mag', name: 'Soldadura Semiautomática (MIG/MAG)', icon: '⚡' },
  { id: 'tig', name: 'Soldadura TIG (Argón)', icon: '⚡' },
  { id: 'oxyacetylene', name: 'Oxicorte y Soldadura Autógena (Oxi-Gas)', icon: '🔥' },
  { id: 'grinding', name: 'Amolado y Esmerilado (Disco de Desbaste/Corte)', icon: '✨' },
  { id: 'plasma', name: 'Corte por Arco de Plasma', icon: '⚡' },
  { id: 'torch_heating', name: 'Calentamiento con Soplete / Membranas', icon: '🔥' },
  { id: 'other', name: 'Otra Tarea Generadora de Chispas/Calor', icon: '🛠️' }
];

export const NFPA_51B_REQUIREMENTS = [
  {
    id: 'combustiblesCleared11m',
    label: 'Radio de 11 metros (35 ft)',
    description: 'Materiales combustibles, basura y líquidos inflamables retirados a más de 11 m de la fuente.',
    critical: true
  },
  {
    id: 'floorsProtected',
    label: 'Pisos protegidos e ignífugos',
    description: 'Pisos combustibles humedecidos, cubiertos con arena o mantas resistentes al fuego.',
    critical: true
  },
  {
    id: 'wallHolesCovered',
    label: 'Aberturas y grietas selladas',
    description: 'Huecos en paredes, conductos y rejillas de desagüe tapados herméticamente contra chispas.',
    critical: false
  },
  {
    id: 'pipesPurgedInerted',
    label: 'Tuberías y tanques inertizados',
    description: 'Recipientes o cañerías purgados, vaporizados o inertizados y libres de hidrocarburos.',
    critical: true
  },
  {
    id: 'extinguisherOnSite',
    label: 'Extintor manual al pie (< 3m)',
    description: 'Extintor ABC mín. 5kg o CO2 presurizado y con tarjeta de control IRAM al día.',
    critical: true
  },
  {
    id: 'fireScreensInstalled',
    label: 'Mamparas / Biombos ignífugos',
    description: 'Pantallas instaladas para contención de chispas y protección UV para trabajadores linderos.',
    critical: false
  },
  {
    id: 'ventilationActive',
    label: 'Ventilación / Extracción localizada',
    description: 'Extracción forzada de humos metálicos o ventilación adecuada en el puesto.',
    critical: false
  },
  {
    id: 'fireWatchAssigned',
    label: 'Vigía de Incendio (Fire Watch)',
    description: 'Personal designado con dedicación exclusiva, extintor y alarma durante y 30-60 min post-tarea.',
    critical: true
  }
];
