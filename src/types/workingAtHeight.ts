/**
 * Tipos oficiales para el módulo de Trabajo en Altura
 * Homologado con la Resolución S.R.T. N° 61/2023, Decreto 911/96 (Arts. 54-70) y Decreto 351/79
 */

export type HeightWorkType =
  | 'scaffolding' // Andamios tubulares / multidireccionales (Dec. 911/96)
  | 'ladder' // Escaleras de mano / fijas
  | 'roof' // Techos / cubiertas frágiles
  | 'platform' // Plataformas elevadoras móviles de personal (PEMP)
  | 'lift' // Guindolas / silletas
  | 'structure' // Montaje de estructuras metálicas
  | 'rope_access' // Acceso por cuerdas / trabajo vertical
  | 'other';

export type AnchorCertificationType =
  | 'certified_structural_22kn' // Estructural certificado >= 22 kN (5000 lbs)
  | 'engineered_lifeline' // Línea de vida horizontal/vertical certificada por profesional habilitado
  | 'temporary_strap' // Faja de anclaje textil certificada IRAM/EN
  | 'untested_unapproved'; // No verificado (PROHIBIDO)

export interface FallClearanceParams {
  lanyardLengthM: number; // Longitud del cabo de vida (típico 1.50m - 1.80m)
  deceleratorDistanceM: number; // Elongación del absorbedor de impacto (típico 1.00m - 1.20m)
  workerHeightM: number; // Estatura del operario (distancia argolla dorsal a pies, aprox. 1.50m)
  safetyMarginM: number; // Margen de seguridad libre al suelo (mínimo 1.00m)
  availableFallHeightM: number; // Altura libre real disponible desde el anclaje hasta el suelo/obstáculo
}

export interface FallClearanceResult {
  requiredClearanceM: number; // DLC Total = L_cabo + D_absorbedor + H_operario + Margen
  availableHeightM: number;
  safetyMarginRemainingM: number;
  isClearanceSafe: boolean; // true si Altura disponible > DLC
  fallFactor: 0 | 1 | 2; // Factor de caída según ubicación del anclaje
  warning?: string;
  recommendation: string;
}

export interface HarnessPreUseCheck {
  webbingFreeOfCutsOrBurns: boolean; // Cintas sin cortes, desgaste o quemaduras
  stitchingIntact: boolean; // Costuras de seguridad sin roturas
  dRingUndamaged: boolean; // Argollas en D sin deformaciones ni corrosión
  bucklesOperateCorrectly: boolean; // Hebillas cierran y traban correctamente
  impactIndicatorNotTripped: boolean; // Indicador de impacto intacto (no sufrió caída previa)
  lanyardDoubleWithAbsorber: boolean; // Cabo doble en Y con absorbedor de energía (100% atado)
}

export interface WeatherConditions {
  windSpeedKmh: number; // Viento en km/h (límite operativo: 35-40 km/h)
  hasRainOrThunderstorm: boolean; // Lluvia o tormenta eléctrica (PROHIBIDO)
  isSurfaceSlippery: boolean; // Superficie mojada, con aceite o hielo
}

export interface WorkingAtHeightPermitProtocol {
  id: string;
  permitNumber: string;
  // Identificación Patronal
  cuit: string;
  companyName: string;
  establishmentAddress: string;
  art: string;
  sector: string;
  // Detalle de la Tarea
  workDescription: string;
  workType: HeightWorkType;
  workHeightMeters: number;
  location: string;
  // Vigencia
  date: string;
  validFromTime: string;
  validUntilTime: string;
  // Operario y Salud
  workerName: string;
  workerDni: string;
  medicalFitnessOk: boolean; // Apto médico específico para altura
  // Seguridad Anticaídas y Anclaje
  anchorType: AnchorCertificationType;
  anchorCapacityKn: number; // Mínimo 22 kN
  clearanceCalculation: FallClearanceResult;
  harnessCheck: HarnessPreUseCheck;
  weather: WeatherConditions;
  // Plan de Rescate en Altura (Res. SRT 61/23 Art. 9)
  rescuePlanDefined: boolean;
  rescuePlanDetails: string;
  // Personal Responsable
  supervisorName: string;
  professionalName: string;
  professionalLicense: string;
  // Dictamen y Firmas
  isAuthorized: boolean;
  technicalObservations?: string;
  workerSignature?: string;
  supervisorSignature?: string;
  professionalSignature?: string;
  createdAt?: string;
}
