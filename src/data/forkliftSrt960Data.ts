export interface ForkliftVehicle {
  id: string;
  companyId?: string;
  internalCode: string; // Ej: AE-01, CLARK-02
  brand: string; // Ej: Toyota, Hyster, Linde, Crown, Caterpillar
  model: string; // Ej: 8FGU25, H50FT
  serialNumber: string;
  year: number;
  type: 'combustion_glp' | 'combustion_diesel' | 'combustion_nafta' | 'electric' | 'reach_truck' | 'order_picker' | 'stacker';
  capacityKg: number; // Ej: 2500 kg
  maxLiftHeightMeters: number; // Ej: 4.5 m
  mastType: 'simplex' | 'duplex' | 'triplex' | 'cuadruplex';
  tireType: 'solidas_macizas' | 'neumaticas' | 'poliuretano';
  status: 'operativo' | 'mantenimiento' | 'fuera_de_servicio';
  currentHours: number;
  lastServiceHours: number;
  nextServiceHours: number;
  fireExtinguisherNumber: string;
  fireExtinguisherExpiry: string; // YYYY-MM-DD
  sectorLocation: string; // Ej: Depósito Central, Expedición
  hasRopsFops: boolean;
  hasSeatbelt: boolean;
  hasBackupAlarm: boolean;
  hasStrobeLight: boolean;
  hasBlueSpotlight: boolean;
  hasLoadChart: boolean;
  notes?: string;
  createdAt: string;
}

export interface ForkliftDriver {
  id: string;
  companyId?: string;
  fullName: string;
  cuil: string;
  dni: string;
  licenseNumber: string; // Ej: HAB-960-2026-001
  issueDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD (1 año según Art. 4 Res 960/15)
  courseHours: number; // Min 10 hs obligatorias
  courseEntity: string;
  courseCertificateNumber: string;
  medicalFitDate: string;
  medicalFitExpiry: string;
  medicalFitStatus: 'apto' | 'apto_con_restriccion' | 'no_apto';
  authorizedVehicleTypes: string[];
  status: 'habilitado' | 'vencido' | 'suspendido';
  bloodType?: string;
  emergencyContact?: string;
  photoUrl?: string;
  notes?: string;
}

export interface DailyInspectionItem {
  id: string;
  category: 'mecanica_operativa' | 'seguridad_activa' | 'fluidos_motor' | 'cabina_mandos';
  title: string;
  description: string;
  isCritical: boolean; // Si no es conforme -> Bloqueo preventivo obligatorio Res. 960/15
}

export const DAILY_INSPECTION_ITEMS: DailyInspectionItem[] = [
  {
    id: 'frenos',
    category: 'mecanica_operativa',
    title: 'Frenos de Servicio y Estacionamiento',
    description: 'Pedal firme sin esponjosidad; freno de mano traba con firmeza el equipo detenido en rampa.',
    isCritical: true
  },
  {
    id: 'direccion',
    category: 'mecanica_operativa',
    title: 'Dirección y Volante de Conducción',
    description: 'Giro suave y continuo sin juego excesivo ni trabas en la perilla de maniobra.',
    isCritical: true
  },
  {
    id: 'mastil_horquillas',
    category: 'mecanica_operativa',
    title: 'Mástil, Cadenas y Horquillas (Uñas)',
    description: 'Elevación y descenso parejos; cadenas lubricadas y tensas; uñas sin fisuras, simétricas y con trabas.',
    isCritical: true
  },
  {
    id: 'alarma_retroceso',
    category: 'seguridad_activa',
    title: 'Alarma Acústica de Marcha Atrás',
    description: 'Suena automáticamente con volumen superior al ruido ambiente al colocar la palanca en reversa.',
    isCritical: true
  },
  {
    id: 'bocina',
    category: 'seguridad_activa',
    title: 'Bocina de Accionamiento Voluntario',
    description: 'Pulsador accesible y sonido claro para advertencia en cruces de pasillos y curvas ciegas.',
    isCritical: true
  },
  {
    id: 'cinturon_seguridad',
    category: 'seguridad_activa',
    title: 'Cinturón de Seguridad Retráctil / 3 Puntos',
    description: 'Hebilla traba y destraba con precisión; cinta sin deshilachados ni nudos.',
    isCritical: true
  },
  {
    id: 'baliza_destellador',
    category: 'seguridad_activa',
    title: 'Baliza Destelladora Estroboscópica (Ámbar 360°)',
    description: 'Destella de forma ininterrumpida mientras el vehículo está en marcha.',
    isCritical: false
  },
  {
    id: 'luces_trabajo',
    category: 'seguridad_activa',
    title: 'Luces Reglamentarias y Blue Light / Proyección',
    description: 'Faros delanteros de trabajo y luz azul proyectada sobre el piso para peatones.',
    isCritical: false
  },
  {
    id: 'fugas_fluidos',
    category: 'fluidos_motor',
    title: 'Ausencia de Fugas (Hidráulico / Combustible / Frenos)',
    description: 'Piso y mangueras secas sin pérdidas de aceite hidráulico, gasoil o fluido de frenos.',
    isCritical: true
  },
  {
    id: 'cilindro_gas_bateria',
    category: 'fluidos_motor',
    title: 'Cilindro de Gas GLP / Batería Eléctrica',
    description: 'Cilindro bien anclado con válvula estanca sin olor a gas; bornes y cables de batería limpios y aislados.',
    isCritical: true
  },
  {
    id: 'neumaticos',
    category: 'mecanica_operativa',
    title: 'Neumáticos y Bandas de Rodadura',
    description: 'Sin cortes profundos, desprendimientos de caucho, bulones de rueda completos y ajustados.',
    isCritical: false
  },
  {
    id: 'matafuego',
    category: 'seguridad_activa',
    title: 'Matafuego Triclase ABC con Soporte Seguro',
    description: 'Manómetro en zona verde de carga, precinto intacto y soporte firme al chasis.',
    isCritical: true
  },
  {
    id: 'espejos_visibilidad',
    category: 'cabina_mandos',
    title: 'Espejos Retrovisores Parabólicos y Parabrisas',
    description: 'Limpios, sin rajaduras y regulados para visión total trasera y lateral.',
    isCritical: false
  },
  {
    id: 'placa_cargas',
    category: 'cabina_mandos',
    title: 'Placa Identificatoria y Diagrama de Cargas',
    description: 'Legible y fija en el tablero con indicación de carga máxima según centro de gravedad.',
    isCritical: false
  },
  {
    id: 'estructura_fops_rops',
    category: 'cabina_mandos',
    title: 'Estructura de Protección Antivuelco (ROPS / FOPS)',
    description: 'Sin deformaciones estructurales por impacto, sin cortes ni soldaduras caseras no autorizadas.',
    isCritical: true
  }
];

export interface ForkliftDailyCheck {
  id: string;
  companyId?: string;
  vehicleId: string;
  vehicleCode: string;
  driverId: string;
  driverName: string;
  driverCuil: string;
  date: string; // YYYY-MM-DD
  shift: 'manana' | 'tarde' | 'noche';
  startHours: number;
  endHours?: number;
  responses: { [itemId: string]: 'conforme' | 'no_conforme' | 'no_aplica' };
  observations: string;
  hasCriticalFailure: boolean;
  result: 'aprobado' | 'bloqueado_fuera_de_servicio' | 'aprobado_con_observacion';
  driverSignatureName: string;
  supervisorSignatureName?: string;
  resolved: boolean;
  createdAt: string;
}

export interface ForkliftMaintenance {
  id: string;
  companyId?: string;
  vehicleId: string;
  vehicleCode: string;
  date: string; // YYYY-MM-DD
  type: 'preventivo_programado' | 'correctivo_urgente' | 'inspeccion_anual_cadenas_horquillas';
  operatingHours: number;
  provider: string;
  technicianName: string;
  description: string;
  replacedItems: string;
  cost?: number;
  nextDueHours: number;
  status: 'completado' | 'en_taller';
  createdAt: string;
}

// Defaults iniciales con datos representativos
export const DEFAULT_FORKLIFT_VEHICLES: ForkliftVehicle[] = [
  {
    id: 'forklift-v-01',
    internalCode: 'AE-01',
    brand: 'Toyota',
    model: '8FGU25 (2.5 Ton)',
    serialNumber: '8FGU25-63821',
    year: 2022,
    type: 'combustion_glp',
    capacityKg: 2500,
    maxLiftHeightMeters: 4.8,
    mastType: 'triplex',
    tireType: 'solidas_macizas',
    status: 'operativo',
    currentHours: 1420,
    lastServiceHours: 1250,
    nextServiceHours: 1500,
    fireExtinguisherNumber: 'EXT-AE01-ABC',
    fireExtinguisherExpiry: '2026-11-30',
    sectorLocation: 'Depósito Central - Bahía 3',
    hasRopsFops: true,
    hasSeatbelt: true,
    hasBackupAlarm: true,
    hasStrobeLight: true,
    hasBlueSpotlight: true,
    hasLoadChart: true,
    notes: 'Equipo principal de estiba en racks pesados. Horquillas ensayadas en julio.',
    createdAt: '2026-01-15'
  },
  {
    id: 'forklift-v-02',
    internalCode: 'AE-02',
    brand: 'Crown',
    model: 'RR 5700 Reach Truck (Eléctrico)',
    serialNumber: 'CR-RR57-1109',
    year: 2023,
    type: 'reach_truck',
    capacityKg: 2000,
    maxLiftHeightMeters: 7.2,
    mastType: 'triplex',
    tireType: 'poliuretano',
    status: 'operativo',
    currentHours: 890,
    lastServiceHours: 750,
    nextServiceHours: 1000,
    fireExtinguisherNumber: 'EXT-AE02-CO2',
    fireExtinguisherExpiry: '2027-02-15',
    sectorLocation: 'Cámara Frigorífica y Racks Selectivos',
    hasRopsFops: true,
    hasSeatbelt: true,
    hasBackupAlarm: true,
    hasStrobeLight: true,
    hasBlueSpotlight: true,
    hasLoadChart: true,
    notes: 'Retráctil eléctrico para pasillos angostos de 2.80 m.',
    createdAt: '2026-02-10'
  },
  {
    id: 'forklift-v-03',
    internalCode: 'AE-03',
    brand: 'Hyster',
    model: 'H50XT (Diésel Pesado)',
    serialNumber: 'HY-H50-9844',
    year: 2020,
    type: 'combustion_diesel',
    capacityKg: 3000,
    maxLiftHeightMeters: 4.2,
    mastType: 'duplex',
    tireType: 'neumaticas',
    status: 'mantenimiento',
    currentHours: 3120,
    lastServiceHours: 3000,
    nextServiceHours: 3250,
    fireExtinguisherNumber: 'EXT-AE03-ABC',
    fireExtinguisherExpiry: '2026-10-20',
    sectorLocation: 'Patio de Maniobras / Carga de Camiones',
    hasRopsFops: true,
    hasSeatbelt: true,
    hasBackupAlarm: true,
    hasStrobeLight: true,
    hasBlueSpotlight: false,
    hasLoadChart: true,
    notes: 'En taller por reemplazo de manguera de desplazamiento lateral.',
    createdAt: '2026-03-01'
  }
];

export const DEFAULT_FORKLIFT_DRIVERS: ForkliftDriver[] = [
  {
    id: 'forklift-d-01',
    fullName: 'González Martín Alejandro',
    cuil: '20-33458921-3',
    dni: '33.458.921',
    licenseNumber: 'SRT960-2026-014',
    issueDate: '2026-04-10',
    expiryDate: '2027-04-10',
    courseHours: 10,
    courseEntity: 'Instituto Argentino de Seguridad (IAS)',
    courseCertificateNumber: 'CERT-IAS-960-8812',
    medicalFitDate: '2026-03-15',
    medicalFitExpiry: '2027-03-15',
    medicalFitStatus: 'apto',
    authorizedVehicleTypes: ['Autoelevador Frontal (GLP/Diésel)', 'Retráctil Reach Truck', 'Apilador Eléctrico'],
    status: 'habilitado',
    bloodType: '0 Rh+',
    emergencyContact: 'Esposa: 11-4589-2233',
    notes: 'Conductor capacitado y autorizado para operar en pasillos angostos.'
  },
  {
    id: 'forklift-d-02',
    fullName: 'Benítez Juan Carlos',
    cuil: '20-29841235-8',
    dni: '29.841.235',
    licenseNumber: 'SRT960-2025-089',
    issueDate: '2025-10-20',
    expiryDate: '2026-10-20',
    courseHours: 12,
    courseEntity: 'Fundación IRAM - Seguridad en Logística',
    courseCertificateNumber: 'IRAM-OP-960-4410',
    medicalFitDate: '2025-10-10',
    medicalFitExpiry: '2026-10-10',
    medicalFitStatus: 'apto_con_restriccion',
    authorizedVehicleTypes: ['Autoelevador Frontal (GLP)'],
    status: 'habilitado',
    bloodType: 'A Rh+',
    emergencyContact: 'Hijo: 11-6677-8899',
    notes: 'Restricción médica: uso obligatorio de lentes de corrección visual al conducir.'
  }
];

export const DEFAULT_FORKLIFT_CHECKS: ForkliftDailyCheck[] = [
  {
    id: 'check-001',
    vehicleId: 'forklift-v-01',
    vehicleCode: 'AE-01',
    driverId: 'forklift-d-01',
    driverName: 'González Martín Alejandro',
    driverCuil: '20-33458921-3',
    date: '2026-10-05',
    shift: 'manana',
    startHours: 1420,
    responses: {
      frenos: 'conforme',
      direccion: 'conforme',
      mastil_horquillas: 'conforme',
      alarma_retroceso: 'conforme',
      bocina: 'conforme',
      cinturon_seguridad: 'conforme',
      baliza_destellador: 'conforme',
      luces_trabajo: 'conforme',
      fugas_fluidos: 'conforme',
      cilindro_gas_bateria: 'conforme',
      neumaticos: 'conforme',
      matafuego: 'conforme',
      espejos_visibilidad: 'conforme',
      placa_cargas: 'conforme',
      estructura_fops_rops: 'conforme'
    },
    observations: 'Equipo en óptimas condiciones mecánicas y de seguridad para operar en turno mañana.',
    hasCriticalFailure: false,
    result: 'aprobado',
    driverSignatureName: 'Martín A. González',
    supervisorSignatureName: 'Ing. Carlos Mendoza (HyS)',
    resolved: true,
    createdAt: '2026-10-05T06:45:00'
  }
];
