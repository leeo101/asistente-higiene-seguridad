/**
 * Tipos oficiales para el módulo de Bloqueo y Etiquetado LOTO (Lockout / Tagout)
 * Homologado con Decreto 351/79 Reglamentario de Ley 19.587 (Cap. 14 "Instalaciones Eléctricas" y Cap. 15 "Máquinas y Herramientas")
 * y la norma técnica internacional OSHA 29 CFR 1910.147 ("The Control of Hazardous Energy").
 */

export type EnergyTypeId =
  | 'electrical'
  | 'mechanical'
  | 'hydraulic'
  | 'pneumatic'
  | 'chemical'
  | 'thermal'
  | 'gravitational'
  | 'radiation';

export interface EnergyTypeDefinition {
  id: EnergyTypeId;
  name: string;
  icon: string;
  color: string;
  bg?: string;
  border?: string;
  description: string;
}

export type LotoDeviceId =
  | 'padlock'
  | 'hasp'
  | 'breaker_lock'
  | 'valve_lock'
  | 'plug_lock'
  | 'cable_lock'
  | 'blind_flange'
  | 'tagout';

export interface LotoDeviceDefinition {
  id: LotoDeviceId;
  name: string;
  icon: string;
  description: string;
}

export interface IsolationPoint {
  id: number | string;
  name: string; // Nombre o identificador del punto (Ej: Interruptor Q1, Válvula V-02)
  energyType: EnergyTypeId | string;
  device: LotoDeviceId | string;
  location: string;
  lockNumber?: string;
  verified: boolean;
}

/**
 * Las Cinco Reglas de Oro de la Electricidad (Decreto 351/79 Anexo VI y Reglamentación AEA 90364)
 * Obligatorias para toda intervención en circuitos eléctricos desenergizados.
 */
export interface FiveGoldenRulesElectrical {
  corteEfectivo: boolean; // 1. Corte visible o efectivo de las fuentes de tensión
  bloqueoEnclavamiento: boolean; // 2. Bloqueo y enclavamiento de los aparatos de corte (candados)
  verificacionAusencia: boolean; // 3. Verificación de ausencia de tensión en todas las fases y neutro
  puestaATierraCorto: boolean; // 4. Puesta a tierra y en cortocircuito de los conductores
  senalizacionZona: boolean; // 5. Señalización y delimitación de la zona de trabajo protegida
}

export type ZeroEnergyMethod =
  | 'try_start' // Intento de arranque local ("Try-Out")
  | 'tester' // Medición con multímetro / detector de tensión
  | 'gauge' // Verificación de manómetro a 0 bar / psi
  | 'bleed_valve' // Purga y despresurización de válvula
  | 'visual'; // Desconexión mecánica visible (acoplamiento desacoplado)

export interface ZeroEnergyVerification {
  tested: boolean;
  method: ZeroEnergyMethod | string;
  result: 'safe' | 'hazardous' | 'pending';
  voltageVerifiedVolts?: number;
  pressureVerifiedBar?: number;
  notes?: string;
}

export interface RestorationChecklist {
  guardsReinstalled: boolean; // Guardas mecánicas y resguardos reinstalados
  toolsRemoved: boolean; // Herramientas, cables auxiliares y materiales retirados
  personnelClear: boolean; // Todo el personal despejado del radio de peligro
  locksRemoved: boolean; // Candados y tarjetas retirados por los propios titulares
  authorizedRestart: boolean; // Notificación formal y orden de re-energización autorizada
}

export interface LotoProcedureProtocol {
  id: string;
  procedureNumber?: string;
  // Identificación Patronal
  cuit: string;
  companyName: string;
  establishmentAddress: string;
  art: string;
  sector: string;
  department: string;
  // Equipo e Instalación
  equipmentName: string;
  equipmentTag: string;
  location: string;
  lockoutType: 'individual' | 'group';
  lockBoxNumber?: string;
  // Energías y Dispositivos
  energyTypes: (EnergyTypeId | string)[];
  lotoDevices: (LotoDeviceId | string)[];
  isolationPointsList: IsolationPoint[];
  isolationPoints?: string;
  // Reglas de Seguridad Eléctrica Dec. 351/79
  hasElectricalRisk: boolean;
  fiveGoldenRulesElectrical?: FiveGoldenRulesElectrical;
  // Energía Cero
  zeroEnergyVerification: ZeroEnergyVerification;
  // Procedimiento y Observaciones
  observations?: string;
  // Desbloqueo y Restitución
  restorationChecklist: RestorationChecklist;
  // Personal Asignado
  supervisor: string;
  authorizedOperator?: string;
  operatorDni?: string;
  status: 'active' | 'pending' | 'completed' | 'suspended' | 'emergency';
  // Dictamen de Seguridad
  isAuthorized: boolean;
  // Firmas y Metadatos
  operatorSignature?: string;
  supervisorSignature?: string;
  signature?: string;
  professionalSignature?: string;
  professionalName?: string;
  professionalLicense?: string;
  professionalStamp?: string;
  showSignatures?: { operator: boolean; professional: boolean; supervisor: boolean };
  createdAt?: string;
  updatedAt?: string;
}
