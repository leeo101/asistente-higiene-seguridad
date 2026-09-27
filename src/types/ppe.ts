export interface PPECertification {
  standard: string;       // 'IRAM' | 'ISO' | 'EN' | 'ANSI' | 'NIOSH' | 'NFPA' | 'IEC' | 'Otra'
  certNumber: string;     // N° de certificado / Sello AR
  hasARMark: boolean;     // Marcado "AR" Res. SIyC 18/25
  issueDate?: string;     // Fecha emisión certificado
}

export interface PPEItem {
  id: string | number;
  type: string;                  // Tipo de EPP (casco, calzado, etc.)
  responsible: string;           // Nombre del trabajador
  workerDni: string;             // DNI / CUIL del trabajador
  puesto: string;                // Puesto de trabajo / sector
  brand: string;                 // Marca / Fabricante
  model: string;                 // Modelo / Tipo específico
  quantity: string | number;     // Cantidad entregada
  purchaseDate: string;          // Fecha de compra/entrega (ISO string)
  lifeMonths: number;            // Vida útil en meses
  certStandard: string;          // Norma de certificación
  certNumber: string;            // N° de certificado
  addedAt: string;               // Fecha de registro (ISO string)
  custom?: string;               // Descripción para tipo "Otro"
}

/** EPP de seguridad crítica que EXIGEN certificación obligatoria según Dec. 351/79 y Res. SRT 299/11 */
export const CRITICAL_PPE_TYPES: string[] = [
  'Casco de seguridad',
  'Calzado de seguridad',
  'Arnés de seguridad',
  'Guantes dieléctricos',
  'Mascarilla / Respirador',
  'Ropa ignífuga',
  'Traje químico',
  'Careta facial',
];

/**
 * Vida útil referencial por tipo de EPP según normas IRAM, recomendaciones de fabricantes
 * y buenas prácticas del sector HyS en Argentina.
 * Valores en MESES. Puede variar según fabricante — usar como referencia inicial.
 */
export const OFFICIAL_PPE_USEFUL_LIFE: Record<string, number> = {
  'Casco de seguridad':       60,   // IRAM 3620 — 5 años o según fabricante
  'Calzado de seguridad':     12,   // Desgaste normal — 1 año
  'Guantes de trabajo':        6,   // Desgaste normal — 6 meses
  'Lentes de seguridad':      24,   // 2 años salvo deterioro
  'Protector auditivo':       12,   // Copas: 2 años, endoaurales descartables: uso único
  'Arnés de seguridad':       60,   // IRAM 3622 — 5 años con inspección anual obligatoria
  'Chaleco reflectivo':       12,   // 1 año o pérdida de reflectividad
  'Mascarilla / Respirador':   6,   // IRAM 3648 — 6 meses (filtros antes)
  'Careta facial':            24,   // 2 años salvo impacto
  'Ropa ignífuga':            24,   // 2 años o 50 lavados (lo que ocurra primero)
  'Botas de goma':            12,   // 1 año
  'Rodilleras':               12,   // 1 año
  'Faja lumbar':              12,   // 1 año (Res. SRT 886/15 — uso restringido)
  'Guantes dieléctricos':      6,   // IRAM 3625 — 6 meses o re-ensayo cada 6 meses
  'Traje para frío':          24,   // 2 años
  'Traje químico':            12,   // 1 año o según fabricante
  'Cofia / Redecilla':         3,   // 3 meses (descartable con frecuencia)
  'Delantal de cuero':        12,   // 1 año
  'Botiquín personal':        12,   // Verificar insumos cada 12 meses
};

export interface PPEItemEvaluation {
  item: PPEItem;
  daysUntilExpiry: number | null;     // Días hasta vencimiento (null si no se puede calcular)
  expiryDate: string | null;          // Fecha de vencimiento ISO
  isExpired: boolean;
  isExpiringSoon: boolean;            // ≤ 30 días
  isCriticalType: boolean;            // Es EPP de seguridad crítica
  hasCertification: boolean;          // Tiene norma + N° certificado
  certificationRequired: boolean;     // Requiere certificación obligatoria
  certificationMissing: boolean;      // Requiere cert. y no la tiene
  status: 'VIGENTE' | 'POR_VENCER' | 'VENCIDO';
}

export interface PPEWorkerCompliance {
  workerName: string;
  workerDni: string;
  puesto: string;
  totalItems: number;
  vigentes: number;
  porVencer: number;
  vencidos: number;
  sinCertificacion: number;
  sinCertCritica: number;          // EPP críticos sin certificación
  coveragePercent: number;         // % de EPP vigentes sobre total
  dictamen: 'CONFORME' | 'OBSERVADO' | 'NO CONFORME';
  observaciones: string[];
  evaluations: PPEItemEvaluation[];
}

export interface PPEFleetCompliance {
  totalWorkers: number;
  totalItems: number;
  totalVigentes: number;
  totalPorVencer: number;
  totalVencidos: number;
  totalSinCertificacion: number;
  totalSinCertCritica: number;
  fleetCoveragePercent: number;
  fleetDictamen: 'CONFORME' | 'OBSERVADO' | 'NO CONFORME';
  workerResults: PPEWorkerCompliance[];
}
