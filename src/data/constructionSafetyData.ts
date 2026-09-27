export interface ConstructionStage {
  id: string;
  name: string;
  risks: string[];
  preventiveMeasures: string[];
  applicableStandards: string;
  included: boolean;
}

export interface ConstructionProgramData {
  id: string;
  companyId?: string;
  programNumber: string;
  contractorName: string;
  contractorCuit: string;
  artName: string;
  comitenteName: string;
  siteAddress: string;
  city: string;
  province: string;
  siteSurfaceM2: number;
  estimatedWorkers: number;
  startDate: string;
  estimatedDurationMonths: number;
  workType: 'edificacion' | 'infraestructura' | 'demolicion' | 'montaje_industrial' | 'otra';
  reasons: {
    excavationDeep: boolean; // > 1.20 m
    heightWork: boolean; // > 4 m
    demolition: boolean;
    largeSurface: boolean; // > 1000 m2
    highVoltage: boolean;
    confinedSpacesOrTunnels: boolean;
  };
  stages: ConstructionStage[];
  hygieneService: {
    professionalName: string;
    enrollmentNumber: string; // Matricula
    weeklyVisitHours: number;
    emergencyClinic: string;
    emergencyPhone: string;
  };
  notes: string;
  status: 'draft' | 'submitted_to_art' | 'approved_by_art' | 'in_execution' | 'closed';
  createdAt: string;
}

export const DEFAULT_CONSTRUCTION_STAGES: ConstructionStage[] = [
  {
    id: 'stage_demolition',
    name: '1. Demolición y Desmonte Previo',
    risks: ['Derrumbe imprevisto de muros', 'Caída de mampostería a distinto nivel', 'Cortes y proyecciones', 'Exposición a polvo'],
    preventiveMeasures: [
      'Apuntalamiento estructural previo según cálculo',
      'Corte de servicios públicos (gas, luz, agua)',
      'Delimitación de perímetro con vallado ciego h=2.00m',
      'Uso obligatorio de casco, calzado c/ puntera y gafas'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 138-141',
    included: false
  },
  {
    id: 'stage_earthmoving',
    name: '2. Movimiento de Suelos, Excavación y Subsuelos',
    risks: ['Desmoronamiento de talud', 'Atrapamiento en zanjas', 'Interferencia con cañerías subterráneas', 'Vuelco de maquinaria pesada'],
    preventiveMeasures: [
      'Entibado o talud reglamentario para profundidad > 1.20m',
      'Acopio de tierra y maquinaria a más de 1.00m del borde',
      'Escaleras reglamentarias de escape cada 7.50m',
      'Sondeo previo de servicios subterráneos de gas y luz'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 142-160 & Res. SRT 550/11',
    included: true
  },
  {
    id: 'stage_structure',
    name: '3. Estructuras Resistentes, Encofrados y Hormigón Armado',
    risks: ['Caída de altura de personas u objetos', 'Colapso de apuntalamiento de encofrados', 'Golpes con balde de grúa/hormigón', 'Contacto con hierro de armadura'],
    preventiveMeasures: [
      'Arnés de seguridad con cabo de vida y línea de vida estructural',
      'Barandas perimetrales reglamentarias (h=1.00m, intermedia 0.50m y zócalo 0.15m)',
      'Colocación de capuchones de protección en hierros salientes (rebar caps)',
      'Verificación de encofrados y apuntalamientos antes del colado'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 161-195 & Res. SRT 61/23',
    included: true
  },
  {
    id: 'stage_masonry',
    name: '4. Mampostería, Albañilería y Andamios',
    risks: ['Caída desde andamio tubular', 'Vuelco o colapso de plataforma', 'Caída de ladrillos o mezcla sobre transeúntes'],
    preventiveMeasures: [
      'Andamios arriostrados a la estructura con tablones metálicos trabados',
      'Redes de seguridad perimetrales tipo cortina o bandejas de protección',
      'Señalización de zonas de paso inferior y uso de casco',
      'Inspección diaria de tarjeta de habilitación de andamio'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 196-224',
    included: true
  },
  {
    id: 'stage_installations',
    name: '5. Instalaciones Eléctricas, Sanitarias y Termomecánicas',
    risks: ['Electrocución por cables provisorios', 'Quemaduras por soldadura de caños', 'Cortes con amoladoras'],
    preventiveMeasures: [
      'Tableros eléctricos provisorios de obra con disyuntor diferencial y puesta a tierra',
      'Tendido de cables aéreo a más de 2.50m de altura',
      'Permiso de trabajo en caliente y extintor al pie',
      'Herramientas eléctricas con doble aislación y protección'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 85-104',
    included: true
  },
  {
    id: 'stage_finishes',
    name: '6. Terminaciones, Yesería, Pintura y Vidrios',
    risks: ['Intoxicación por vapores de solventes', 'Cortes con bordes vidriados', 'Caídas desde escaleras de mano'],
    preventiveMeasures: [
      'Ventilación forzada en locales cerrados al pintar',
      'Protección respiratoria para vapores orgánicos y antiparras',
      'Escaleras de mano con zapatas antideslizantes y atadas en extremo superior'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 235-247',
    included: true
  }
];
