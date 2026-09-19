/**
 * Tipos e interfaces para el Protocolo Oficial de Medición de
 * Puesta a Tierra y Continuidad de las Masas (Res. SRT 900/15)
 * Superintendencia de Riesgos del Trabajo (República Argentina)
 */

export type GroundingSystemType = 'TT' | 'TN-S' | 'TN-C' | 'IT';
export type SoilCondition = 'Húmedo' | 'Normal' | 'Seco' | 'Rocoso';
export type ElectrodeType = 
  | 'Jabalina Cobre/Acero (Hincada)' 
  | 'Malla de Puesta a Tierra' 
  | 'Anillo Perimetral' 
  | 'Placa de Puesta a Tierra' 
  | 'Electrodo de Fundación';

export interface JabalinaMeasurement {
  id: string;
  codigo: string; // Ej: PAT-01
  ubicacion: string; // Ej: Tablero General Principal
  tipoElectrodo: ElectrodeType;
  resistenciaMedida: number; // Valor en Ohms (Ω)
  resistenciaMaximaAdmisible: number; // 10 Ω por defecto, 40 Ω con protección diferencial
  camaraInspeccion: boolean; // ¿Posee cámara de inspección accesible?
  borneDesconexion: boolean; // ¿Posee seccionador / tomamuestra?
  estadoFisico: 'Bueno' | 'Regular' | 'Malo' | 'Inaccesible';
  conforme: boolean;
  observaciones?: string;
}

export interface ContinuityPoint {
  id: string;
  codigo: string; // Ej: CM-01
  elemento: string; // Ej: Carcasa Tablero Seccional Iluminación
  ubicacion: string; // Ej: Nave Principal
  resistenciaContinuidad: number; // Valor en Ohms (Ω) - Admisible <= 1.0 Ω
  continuidadConforme: boolean;
  observaciones?: string;
}

export interface DifferentialTest {
  id: string;
  codigo: string; // Ej: ID-01
  tableroUbicacion: string; // Ej: Tablero Seccional Fuerza Motriz
  circuitoProtegido: string; // Ej: Tomas de uso especial máquinas
  corrienteSensibilidadMa: number; // Ej: 30 mA o 300 mA
  tiempoDisparoMs: number; // Tiempo medido en milisegundos (límite <= 200 ms)
  pulsadorTestFunciona: boolean;
  conforme: boolean;
  observaciones?: string;
}

export interface ProtocolPhoto {
  id: string;
  url: string; // Base64 o Storage URL
  titulo: string;
  descripcion?: string;
}

export interface GroundingProtocol {
  id: string;
  // Datos Generales de la Empresa / Establecimiento (Res. SRT 900/15 Anexo I)
  razonSocial: string;
  cuit: string;
  artNombre?: string;
  establecimiento?: string;
  direccion: string;
  localidad: string;
  provincia: string;
  actividadPrincipal: string;
  tipoInstalacion?: 'Industrial' | 'Comercial' | 'Obra en Construcción (Dec. 911/96)' | 'Hospitalaria / Crítica';
  fechaMedicion: string;
  fechaVencimiento: string; // 1 año desde la fecha de medición (Art. 3°)

  // Datos del Profesional actuante
  profesionalNombre: string;
  profesionalMatricula: string;
  profesionalTitulo: string;
  colegioProfesional?: string;

  // Datos del Instrumento (Telurímetro / Miliohmímetro)
  instrumentoMarca: string;
  instrumentoModelo: string;
  instrumentoNroSerie: string;
  instrumentoFechaCalibracion: string;
  instrumentoCertificadoNro: string;
  instrumentoLaboratorio: string;

  // Características de la Instalación Eléctrica
  tensionSuministro: string; // Ej: "380 V Trifásica + Neutro / 220 V"
  esquemaConexionTierra: GroundingSystemType;
  tipoAcometida: 'Aérea' | 'Subterránea' | 'Mixta';
  potenciaContratadaKw?: string;
  transformadorPropio: boolean;
  estadoSuelo: SoilCondition;
  tensionSeguridadContacto?: 24 | 50; // 24V ambientes húmedos/mojados, 50V locales secos (AEA 90364)

  // Tablas del Anexo I Res. SRT 900/15
  jabalinas: JabalinaMeasurement[];
  continuidadMasas: ContinuityPoint[];
  diferenciales: DifferentialTest[];

  // Fotos y Evidencia
  fotos: ProtocolPhoto[];
  croquisUrl?: string;

  // Dictamen Técnico y Conclusiones
  cumpleNormativa: boolean;
  conclusiones: string;
  recomendaciones: string[];
  plazoAdecuacionDias?: number;

  // Firmas digitales
  firmaProfesionalUrl?: string;
  firmaClienteUrl?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  userId?: string;
}
