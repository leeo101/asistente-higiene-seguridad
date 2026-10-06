export type RackType =
  | 'selectivo' // Rack selectivo convencional
  | 'drive_in' // Compacto penetrable
  | 'cantilever' // Brazos en voladizo (barras/perfiles)
  | 'dinamico' // Gravedad con rodillos
  | 'push_back' // Carros telescópicos
  | 'entrepiso'; // Estructura con entrepiso metálico

export type RackRiskLevel = 'verde' | 'ambar' | 'rojo';

export interface RackSystem {
  id: string;
  companyId?: string;
  rackCode: string; // Ej: "RACK-A01"
  warehouseSector: string; // Ej: "Nave Central - Pasillo 3"
  rackType: RackType;
  rackTypeLabel: string;
  manufacturer: string; // Ej: "Mecalux / Sotic / AR Racking"
  installationYear: number;
  totalBays: number; // Módulos / Vanos
  totalLevels: number; // Niveles de altura
  maxBayLoadKg: number; // Carga admisible total por vano (Kg)
  maxLevelLoadKg: number; // Carga admisible por par de largueros (Kg)
  lastInspectionDate: string; // YYYY-MM-DD
  nextInspectionDate: string; // YYYY-MM-DD
  currentStatus: 'conforme' | 'riesgo_ambar' | 'peligro_rojo';
}

export interface RackDamageItem {
  id: string;
  bayNumber: number; // Vano #
  levelNumber: number; // Nivel # (0 = Base)
  component: 'puntal' | 'larguero' | 'diagonal_arriostramiento' | 'placa_base' | 'clavija_seguridad' | 'protector_puntal';
  componentLabel: string;
  damageLevel: RackRiskLevel; // Verde, Ámbar o Rojo
  measuredDeformationMm: number; // Deformación medida en mm
  allowableToleranceMm: number; // Tolerancia admisible de norma en mm
  description: string;
  correctiveAction: string;
  isResolved: boolean;
}

export interface RackInspectionReport {
  id: string;
  companyId?: string;
  rackId: string;
  rackCode: string;
  warehouseSector: string;
  inspectionDate: string; // YYYY-MM-DD
  inspectorName: string;
  inspectorRegistration: string; // Matrícula HyS o Ing.
  overallResult: 'conforme' | 'riesgo_ambar' | 'peligro_rojo_descarga_inmediata';

  // Verificaciones Generales IRAM 38500 / EN 15635
  generalChecks: {
    loadPlatesPresent: boolean; // Placa de características con carga máxima admisible colocada
    safetyPinsPresent: boolean; // 100% clavijas de bloqueo colocadas en conectores de largueros
    groundAnchorsSecured: boolean; // Anclajes a solera (bulones químicos/expansivos sin flojedad)
    columnProtectorsPresent: boolean; // Protectores de puntal en cabeceras de pasillos y túneles
    verticalityCompliant: boolean; // Desplome o verticalidad < H/200 (IRAM 38500)
    clearAisles: boolean; // Pasillos con ancho libre normativo sin interferencias
    palletConditionGood: boolean; // Pallets en uso sin tablas quebradas o deformadas
  };

  damages: RackDamageItem[];
  conclusions: string;
  actionPlan: string;
  immediateUnloadRequired: boolean; // Si hay nivel ROJO -> Descarga obligatoria
  createdAt: string;
}

export const RACK_TYPE_LABELS: Record<RackType, string> = {
  selectivo: 'Selectivo Convencional',
  drive_in: 'Drive-In (Compacto)',
  cantilever: 'Cantilever (Cargas Largas)',
  dinamico: 'Dinámico por Gravedad',
  push_back: 'Push-Back (Carros)',
  entrepiso: 'Entrepiso Metálico'
};

export const RACK_RISK_INFO: Record<
  RackRiskLevel,
  {
    title: string;
    actionDescription: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  verde: {
    title: 'Nivel Verde (Vigilancia)',
    actionDescription: 'Daño leve dentro o al límite de tolerancia. No requiere reducción de carga. Monitorear en la próxima inspección periódica.',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.3)'
  },
  ambar: {
    title: 'Nivel Ámbar (Reparación Requerida)',
    actionDescription: 'Daño superior a tolerancia pero sin colapso inminente. Reemplazar o reparar en un plazo máximo de 4 semanas. PROHIBIDO recargar el nivel una vez retirado el pallet actual.',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)'
  },
  rojo: {
    title: 'Nivel Rojo (Peligro Crítico - Descarga Inmediata)',
    actionDescription: 'Daño grave que compromete la estabilidad estructural. DESCARGA INMEDIATA OBLIGATORIA de los vanos adyacentes y clausura del sector hasta reemplazo de elementos.',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)'
  }
};

// Criterios normativos de deformación IRAM 38500 / EN 15635
export const IRAM_38500_LIMITS = {
  puntalLongitudinal: {
    name: 'Puntal en plano del bastidor (Transversal / Fondo)',
    limitFormula: 'Flecha máxima medida con regla de 1m > 3.0 mm',
    redThresholdMm: 6.0,
    amberThresholdMm: 3.0
  },
  puntalTransversal: {
    name: 'Puntal en plano del pasillo (Longitudinal / Frente)',
    limitFormula: 'Flecha máxima medida con regla de 1m > 5.0 mm',
    redThresholdMm: 10.0,
    amberThresholdMm: 5.0
  },
  largueroVertical: {
    name: 'Larguero flecha vertical bajo carga',
    limitFormula: 'Flecha admisible bajo carga permanente < L/200 (Ej: en 2.70m = 13.5 mm)',
    toleranceDivisor: 200
  },
  diagonalBastidor: {
    name: 'Diagonales / Arriostramientos de bastidor',
    limitFormula: 'Deformación residual con regla de 1m > 10.0 mm',
    redThresholdMm: 15.0,
    amberThresholdMm: 10.0
  }
};

// Datos iniciales de demostración
export const DEFAULT_RACKS: RackSystem[] = [
  {
    id: 'rack-01',
    rackCode: 'RACK-01',
    warehouseSector: 'Nave Central - Pasillo 02 (Almacén Principal)',
    rackType: 'selectivo',
    rackTypeLabel: 'Selectivo Convencional',
    manufacturer: 'Mecalux',
    installationYear: 2022,
    totalBays: 6,
    totalLevels: 4,
    maxBayLoadKg: 12000,
    maxLevelLoadKg: 2000,
    lastInspectionDate: '2026-04-15',
    nextInspectionDate: '2027-04-15',
    currentStatus: 'conforme'
  },
  {
    id: 'rack-02',
    rackCode: 'RACK-02',
    warehouseSector: 'Nave Central - Pasillo 03 (Cabecera Logística)',
    rackType: 'selectivo',
    rackTypeLabel: 'Selectivo Convencional',
    manufacturer: 'AR Racking',
    installationYear: 2021,
    totalBays: 8,
    totalLevels: 5,
    maxBayLoadKg: 15000,
    maxLevelLoadKg: 2500,
    lastInspectionDate: '2026-05-10',
    nextInspectionDate: '2026-11-10',
    currentStatus: 'riesgo_ambar'
  },
  {
    id: 'rack-03',
    rackCode: 'RACK-03',
    warehouseSector: 'Sector Expedición - Pasillo 01 (Zona Tránsito Pesado)',
    rackType: 'drive_in',
    rackTypeLabel: 'Drive-In (Compacto)',
    manufacturer: 'Sotic',
    installationYear: 2020,
    totalBays: 4,
    totalLevels: 3,
    maxBayLoadKg: 18000,
    maxLevelLoadKg: 3000,
    lastInspectionDate: '2026-06-02',
    nextInspectionDate: '2026-07-02',
    currentStatus: 'peligro_rojo'
  }
];

export const DEFAULT_RACK_INSPECTIONS: RackInspectionReport[] = [
  {
    id: 'insp-01',
    rackId: 'rack-02',
    rackCode: 'RACK-02',
    warehouseSector: 'Nave Central - Pasillo 03 (Cabecera Logística)',
    inspectionDate: '2026-05-10',
    inspectorName: 'Lic. Mariano Valenzuela',
    inspectorRegistration: 'Mat. HyS CPSP-8842',
    overallResult: 'riesgo_ambar',
    generalChecks: {
      loadPlatesPresent: true,
      safetyPinsPresent: false, // Faltan 2 pasadores
      groundAnchorsSecured: true,
      columnProtectorsPresent: true,
      verticalityCompliant: true,
      clearAisles: true,
      palletConditionGood: true
    },
    damages: [
      {
        id: 'dmg-1',
        bayNumber: 3,
        levelNumber: 1,
        component: 'puntal',
        componentLabel: 'Puntal Frontal Exterior',
        damageLevel: 'ambar',
        measuredDeformationMm: 6.2,
        allowableToleranceMm: 5.0,
        description: 'Impacto lateral de uña de autoelevador en zona media del puntal a 600 mm de la base.',
        correctiveAction: 'No volver a colocar carga una vez vaciado el pallet. Reemplazar tramo de puntal o colocar refuerzo certificado antes de 30 días.',
        isResolved: false
      },
      {
        id: 'dmg-2',
        bayNumber: 5,
        levelNumber: 2,
        component: 'clavija_seguridad',
        componentLabel: 'Clavijas de Seguridad de Conector',
        damageLevel: 'ambar',
        measuredDeformationMm: 0,
        allowableToleranceMm: 0,
        description: 'Faltan pasadores elásticos de seguridad en ambos conectores del larguero naranja.',
        correctiveAction: 'Colocar de inmediato las 2 clavijas de seguridad normalizadas tipo perno con resorte.',
        isResolved: false
      }
    ],
    conclusions: 'La estantería presenta un puntal con deformación en clasificación Ámbar según Norma IRAM 38500 y faltante de clavijas de seguridad. Requiere mantenimiento programado sin permitir nueva recarga en el vano afectado.',
    actionPlan: '1. Colocar clavijas faltantes en forma inmediata.\n2. Vence plazo de reparación de puntal el 10/06/2026.\n3. Instalar refuerzo protector de puntal en piso.',
    immediateUnloadRequired: false,
    createdAt: '2026-05-10'
  },
  {
    id: 'insp-02',
    rackId: 'rack-03',
    rackCode: 'RACK-03',
    warehouseSector: 'Sector Expedición - Pasillo 01 (Zona Tránsito Pesado)',
    inspectionDate: '2026-06-02',
    inspectorName: 'Ing. Rodrigo Almada',
    inspectorRegistration: 'CIPBA Mat. 45.291',
    overallResult: 'peligro_rojo_descarga_inmediata',
    generalChecks: {
      loadPlatesPresent: true,
      safetyPinsPresent: true,
      groundAnchorsSecured: false, // Anclaje arrancado
      columnProtectorsPresent: false, // Falta protector
      verticalityCompliant: false, // Desplome evidente
      clearAisles: false,
      palletConditionGood: true
    },
    damages: [
      {
        id: 'dmg-3',
        bayNumber: 2,
        levelNumber: 0,
        component: 'puntal',
        componentLabel: 'Puntal de Esquina con Placa Base',
        damageLevel: 'rojo',
        measuredDeformationMm: 14.5,
        allowableToleranceMm: 3.0,
        description: 'Abolladura severa con corte de sección metálica por colisión directa de autoelevador de 2.5 Tn. Anclaje al suelo fisurado.',
        correctiveAction: 'DESCARGA INMEDIATA de los vanos 1, 2 y 3. Vallado perimetral con cinta de peligro y clausura física del sector.',
        isResolved: false
      }
    ],
    conclusions: 'ALTO RIESGO DE COLAPSO ESTRUCTURAL (Semáforo ROJO IRAM 38500). Se constata daño severo en puntal principal con corte de chapa y pérdida de anclaje a la solera.',
    actionPlan: '1. Descargar de inmediato todos los niveles superiores de los vanos adyacentes de manera controlada.\n2. Colocar cartel de clausura y vallado perimetral.\n3. Desmonte y sustitución íntegra del bastidor dañado por personal técnico calificado.',
    immediateUnloadRequired: true,
    createdAt: '2026-06-02'
  }
];
