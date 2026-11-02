export interface ConstructionStage {
  id: string;
  name: string;
  risks: string[];
  preventiveMeasures: string[];
  applicableStandards: string;
  included: boolean;
  photos?: string[];
}

export interface ConstructionReasons {
  excavationDeep: boolean; // > 1.20 m
  heightWork: boolean; // > 4 m
  demolition: boolean;
  largeSurface: boolean; // > 1000 m2
  highVoltage: boolean;
  confinedSpacesOrTunnels: boolean;
  submuracionApuntalamiento?: boolean; // Res. SRT 550/11
  movimientoSuelos503?: boolean; // Res. SRT 503/14
  liftingAndCranes?: boolean; // Grúas e izaje
  subcontractorsCoordination?: boolean; // Res. SRT 35/98
}

export interface ConstructionProgramData {
  id: string;
  companyId?: string;
  programNumber: string;
  avisoObraNumber?: string;
  resolutionType?: 'res_51_97' | 'res_35_98' | 'res_319_99';
  contractorName: string;
  contractorCuit: string;
  artName: string;
  comitenteName: string;
  comitenteCuit?: string;
  directorObraName?: string;
  siteAddress: string;
  city: string;
  province: string;
  siteSurfaceM2: number;
  estimatedWorkers: number;
  startDate: string;
  endDate?: string;
  estimatedDurationMonths: number;
  workType: 'edificacion' | 'infraestructura' | 'demolicion' | 'montaje_industrial' | 'mantenimiento_319' | 'otra';
  reasons: ConstructionReasons;
  stages: ConstructionStage[];
  requiredPpe?: string[];
  trainingPlan?: string[];
  obradorInfra?: string[];
  sitePhotos?: string[];
  hygieneService: {
    professionalName: string;
    enrollmentNumber: string; // Matricula
    weeklyVisitHours: number;
    emergencyClinic: string;
    emergencyPhone: string;
    meetingPoint?: string;
  };
  operatorSignature?: string;
  supervisorSignature?: string;
  professionalSignature?: string;
  professionalStamp?: string;
  showSignatures?: {
    operator: boolean;
    professional: boolean;
    supervisor: boolean;
  };
  notes: string;
  status: 'draft' | 'submitted_to_art' | 'approved_by_art' | 'in_execution' | 'closed';
  createdAt: string;
}

export const CAUSALES_CATALOG = [
  {
    id: 'excavationDeep',
    label: 'Excavaciones con profundidad mayor a 1,20 metros',
    norm: 'Res. SRT 51/97 Art. 1 • Res. SRT 550/11 • Dec. 911/96 Art. 142',
    desc: 'Incluye zanjas, pozos de fundación, sótanos y subsuelos con riesgo de desmoronamiento o atrapamiento.',
    requirement: 'Exige estudio geotécnico previo, cálculo de entibamiento/tablestacado, vallado perimetral a 1,00 m y escaleras cada 7,50 m.'
  },
  {
    id: 'heightWork',
    label: 'Trabajos en altura con riesgo de caída superior a 4,00 metros',
    norm: 'Res. SRT 51/97 Art. 1 • Res. SRT 61/23 • Dec. 911/96 Art. 54',
    desc: 'Tareas sobre andamios, losas sin cerramiento, cubiertas, silletas, plataformas suspendidas o estructuras en elevación.',
    requirement: 'Exige sistema anticaídas certificado (IRAM 3622-1), líneas de vida calculadas, barandas de 1,00 m con rodapié y permiso de altura.'
  },
  {
    id: 'demolition',
    label: 'Tareas de demolición total o parcial de edificios o estructuras',
    norm: 'Res. SRT 550/11 Anexo I • Dec. 911/96 Arts. 138-141',
    desc: 'Remoción de muros portantes, losas, estructuras metálicas o de hormigón armado.',
    requirement: 'Exige memoria técnica firmada, corte certificado de suministros (gas, electricidad, agua), apuntalamiento aledaños y vallado ciego.'
  },
  {
    id: 'submuracionApuntalamiento',
    label: 'Submuración, recalce de muros medianeros o apuntalamientos críticos',
    norm: 'Res. SRT 550/11 Anexo II • Dec. 911/96 Art. 147',
    desc: 'Ejecución de troneras o banquetas por paños alternados bajo cimientos existentes o linderos.',
    requirement: 'Exige secuencia ejecutiva por paños numerados, control diario de fisuras/testigos en muros linderos y supervisión permanente.'
  },
  {
    id: 'movimientoSuelos503',
    label: 'Movimiento de suelos a cielo abierto con maquinaria pesada',
    norm: 'Res. SRT 503/14 • Dec. 911/96 Arts. 142-160',
    desc: 'Uso de retroexcavadoras, palas cargadoras, motoniveladoras o piloteras para perfilado y excavación mecánica.',
    requirement: 'Exige caminos de circulación consolidados, señalero en retroceso, alarma acústica, ROPS/FOPS y distancia de seguridad al giro.'
  },
  {
    id: 'largeSurface',
    label: 'Superficie cubierta de obra mayor a 1.000 m² (o más de 1 planta)',
    norm: 'Res. SRT 51/97 Art. 1 inc. a)',
    desc: 'Obras civiles, comerciales, industriales o residenciales cuya superficie proyectada supere los 1.000 m².',
    requirement: 'Exige legajo técnico integral en obrador, registro de visitas semanales del Servicio HyS y coordinación de gremios.'
  },
  {
    id: 'highVoltage',
    label: 'Proximidad a líneas o instalaciones de Media o Alta Tensión (> 1.000 V)',
    norm: 'Res. SRT 51/97 Art. 1 • Res. SRT 3068/14 • Dec. 911/96 Art. 86',
    desc: 'Trabajos con grúas, andamios, bombas de hormigón o estructuras dentro de la zona de influencia de líneas aéreas o subterráneas.',
    requirement: 'Exige respetar distancias mínimas de seguridad eléctrica (0,80 m a 3,00 m según kV), pórticos limitadores de altura y consignación.'
  },
  {
    id: 'confinedSpacesOrTunnels',
    label: 'Trabajos en túneles, galerías subterráneas, cámaras o espacios confinados',
    norm: 'Res. SRT 953/10 • Dec. 911/96 Cap. 11 (Arts. 338-352)',
    desc: 'Cisternas, conductos pluviales/cloacales, pozos profundos o recintos con ventilación natural desfavorable.',
    requirement: 'Exige medición previa y continua de atmósfera (O2, LEL, CO, H2S), ventilación forzada, vigía externo y trípode de rescate.'
  },
  {
    id: 'liftingAndCranes',
    label: 'Montaje de estructuras pesadas, premoldeados o izaje con grúas',
    norm: 'Dec. 911/96 Cap. 15 (Arts. 265-320) • Res. SRT 960/15',
    desc: 'Operación de grúas torre, hidrogrúas, autoelevadores, guinches o montaje de cabriadas y vigas.',
    requirement: 'Exige plan de izaje, tablas de carga en cabina, certificación de eslingas/grilletes, pestillos de seguridad y operario habilitado.'
  },
  {
    id: 'subcontractorsCoordination',
    label: 'Concurrencia simultánea de múltiples contratistas y subcontratistas',
    norm: 'Res. SRT 35/98 (Programa Único de Obra) • Dec. 911/96 Art. 6',
    desc: 'Intervención de dos o más empresas o gremios tercerizados trabajando en el mismo predio de obra.',
    requirement: 'El Contratista Principal o Comitente coordina el Programa Único de Seguridad y verifica la cobertura ART de cada subcontratista.'
  }
] as const;

export const DEFAULT_REQUIRED_PPE: string[] = [
  'Casco de seguridad dieléctrico con barbijo para trabajos en altura (Certificado IRAM 3620)',
  'Calzado de seguridad con puntera de acero o composite y planta antideslizante (IRAM 3610)',
  'Anteojos de seguridad contra impactos con protección UV y lateral (IRAM 3630)',
  'Protectores auditivos endoaurales o de copa según nivel sonoro en obra (IRAM 4126)',
  'Guantes de protección mecánica (vaqueta/moteados), dieléctricos o químicos según tarea (IRAM 3607)',
  'Arnés de cuerpo completo anticaídas con doble cabo de vida y amortiguador (IRAM 3622-1)',
  'Chaleco o indumentaria de alta visibilidad con bandas retrorreflectivas en zonas de maquinaria',
  'Semimáscara o barbijo con filtro para partículas (P2/N95) o vapores orgánicos en corte y pintura'
];

export const DEFAULT_TRAINING_PLAN: string[] = [
  '1. Inducción de Seguridad en Obra al ingreso: Riesgos generales, normas internas y rol de emergencias',
  '2. Uso correcto, conservación y obligatoriedad de Elementos de Protección Personal (Res. SRT 299/11)',
  '3. Prevención de caídas de altura, armado seguro de andamios y uso de arnés (Res. SRT 61/23)',
  '4. Seguridad en excavaciones, submuraciones, movimiento de suelos y riesgo de derrumbe (Res. 550/11)',
  '5. Riesgo eléctrico en obra: Uso de tableros provisorios, herramientas portátiles y cables aéreos',
  '6. Orden y limpieza en obra, acopio seguro de materiales y prevención de caída de objetos',
  '7. Prevención de incendios, manejo de extintores portátiles y simulacro de evacuación en obra',
  '8. Ergonomía laboral, levantamiento manual de cargas y prevención de trastornos musculoesqueléticos (Res. 886/15)'
];

export const DEFAULT_OBRADOR_INFRA: string[] = [
  'Cerco perimetral reglamentario de cierre de obra y señalización de seguridad visible en accesos',
  'Servicios sanitarios y vestuarios adecuados a la cantidad de trabajadores (Dec. 911/96 Arts. 23-29)',
  'Provisión permanente de agua potable fresca para consumo humano en frentes de trabajo (Art. 32)',
  'Comedor de obra con mesa, asientos, recipiente de residuos con tapa y medios de calefacción/refrigeración',
  'Tablero eléctrico general y seccionales de obra estancos (IP65), con disyuntor diferencial (≤30mA), llaves térmicas y puesta a tierra',
  'Botiquín de primeros auxilios completo en obrador y afiche con teléfonos de emergencia y centro médico ART'
];

export const DEFAULT_CONSTRUCTION_STAGES: ConstructionStage[] = [
  {
    id: 'stage_obrador',
    name: '1. Implantación de Obrador, Vallado Perimetral y Servicios Provisorios',
    risks: [
      'Atropellamiento o interferencia con tránsito peatonal y vehicular en acceso de obra',
      'Contacto eléctrico directo o indirecto en conexión de tablero provisorio',
      'Caída al mismo nivel por falta de orden y delimitación de sectores de acopio',
      'Deficiencias higiénico-sanitarias en baños, vestuarios y provisión de agua'
    ],
    preventiveMeasures: [
      'Ejecución de cerco perimetral continuo de h ≥ 2,00 m y pasarela techada peatonal si corresponde',
      'Instalación de tablero eléctrico de obra con disyuntor diferencial 30 mA, llave térmica y jabalina de puesta a tierra medida (Res. 900/15)',
      'Habilitación de sanitarios, vestuarios, comedor y agua potable antes del inicio de tareas operativas',
      'Colocación de cartelería reglamentaria de obligatoriedad de EPP, prohibición de ingreso a ajenos y teléfonos de emergencia ART'
    ],
    applicableStandards: 'Dec. 911/96 Caps. 3, 4 y 5',
    included: true
  },
  {
    id: 'stage_demolition',
    name: '2. Demolición, Desmonte Previo y Apuntalamientos (Res. SRT 550/11)',
    risks: [
      'Derrumbe imprevisto o colapso prematuro de muros y estructuras linderas',
      'Caída de mampostería y escombros a distinto nivel sobre operarios',
      'Electrocución o explosión por cañerías o conductores ocultos activos',
      'Inhalación de polvo en suspensión y proyección de partículas a los ojos'
    ],
    preventiveMeasures: [
      'Corte certificado y retiro de medidores de servicios públicos (gas, electricidad, agua) previo al inicio',
      'Relevamiento estructural y apuntalamiento previo de muros medianeros y losas según memoria técnica',
      'Demolición sistemática de arriba hacia abajo, prohibiendo el socavado de muros portantes',
      'Humectación constante de escombros para abatimiento de polvo y bajada por conductos cerrados (trompas)'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 138-141 & Res. SRT 550/11',
    included: false
  },
  {
    id: 'stage_earthmoving',
    name: '3. Movimiento de Suelos, Excavación, Submuración y Fundaciones',
    risks: [
      'Desmoronamiento o colapso de paredes de excavación y atrapamiento en zanjas',
      'Caída de personas, herramientas o vehículos al interior de la excavación',
      'Afectación de fundaciones de edificios linderos durante la submuración',
      'Interferencia con redes subterráneas de media tensión o gasoductos'
    ],
    preventiveMeasures: [
      'Entibado, tablestacado o talud natural seguro para toda excavación de profundidad mayor a 1,20 m',
      'Submuración ejecutada estrictamente por paños alternados (troneras) según secuencia de cálculo estructural',
      'Acopio de tierra extraída, materiales y circulación de equipos a más de 1,00 m del borde de la zanja',
      'Colocación de barandas perimetrales a 1,00 m en bordes de pozo y escaleras de egreso cada 7,50 m'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 142-160 • Res. 550/11 & 503/14',
    included: true
  },
  {
    id: 'stage_structure',
    name: '4. Estructuras Resistentes, Encofrados y Hormigón Armado',
    risks: [
      'Caída de personas al vacío desde perímetros de losa, huecos de ascensor o bordes de encofrado',
      'Colapso o falla de puntales y arriostramientos durante el colado de hormigón',
      'Empalamiento o cortes graves con hierros de armadura en espera (pelos de columnas)',
      'Golpes por movimiento de balde de hormigón, manguera de bomba o caída de herramientas'
    ],
    preventiveMeasures: [
      'Instalación inmediata de barandas rígidas perimetrales (1,00 m superior, 0,50 m intermedia y zócalo de 0,15 m) y tapado de plenos',
      'Uso obligatorio de arnés anticaídas amarrado a línea de vida estructural o punto fijo independiente',
      'Colocación de capuchones plásticos protectores o doblado en "U" de todos los hierros de espera expuestos',
      'Verificación formal de apuntalamientos, cuñas y arriostramientos antes de iniciar el hormigonado'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 161-195 & Res. SRT 61/23',
    included: true
  },
  {
    id: 'stage_masonry',
    name: '5. Mampostería, Albañilería, Cerramientos y Andamios',
    risks: [
      'Caída de altura desde andamios tubulares, caballetes o plataformas de trabajo incompletas',
      'Vuelco o desplome de andamios por falta de amarre a la estructura o apoyo inestable',
      'Caída de ladrillos, bloques, mezcla o herramientas sobre niveles inferiores',
      'Sobreesfuerzos y lesiones dorsolumbares por manipulación manual de bolsas y mampuestos'
    ],
    preventiveMeasures: [
      'Armado de andamios con plataforma completa de ancho mínimo 0,60 m, tablones trabados, barandas completas y rodapié',
      'Arriostramiento firme del andamio a la estructura resistente y apoyo sobre bases regulables con soleras de reparto',
      'Colocación de bandejas atrapa-escombros y redes protectoras perimetrales según avance de niveles',
      'Habilitación diaria mediante tarjeta de andamio (Verde: habilitado / Roja: en armado-prohibido usar)'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 196-234',
    included: true
  },
  {
    id: 'stage_roofing',
    name: '6. Cubiertas, Techos, Montaje Metálico y Trabajos en Altura',
    risks: [
      'Caída al vacío desde bordes de cubierta o por rotura de chapas traslúcidas / superficies frágiles',
      'Caída de perfiles metálicos, correas o herramientas durante el izaje y montaje',
      'Deslizamiento en techos con pendiente o presencia de humedad, viento fuerte o escarcha'
    ],
    preventiveMeasures: [
      'Tendido previo de líneas de vida horizontales de cable de acero y redes de seguridad bajo cabriadas',
      'Uso de tablones de circulación o pasarelas de reparto de carga sobre cubiertas livianas o frágiles',
      'Suspensión inmediata de tareas en altura ante vientos superiores a 40 km/h, lluvias o tormentas eléctricas',
      'Uso permanente de arnés de cuerpo completo con doble cabo de vida y casco con barbijo abrochado'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 52-57 & Res. SRT 61/23',
    included: false
  },
  {
    id: 'stage_installations',
    name: '7. Instalaciones Eléctricas, Sanitarias, Gas y Termomecánicas',
    risks: [
      'Choque eléctrico por uso de prolongaciones precarias, herramientas dañadas o tableros sin protección',
      'Incendio o quemaduras por trabajos de soldadura, termofusión o corte con amoladora',
      'Proyección de esquirlas incandescentes y cortes por rotura de discos abrasivos',
      'Caída desde escaleras de mano o plataformas móviles durante el tendido de bandejas y cañerías'
    ],
    preventiveMeasures: [
      'Uso exclusivo de herramientas eléctricas con doble aislación, carcasa protectora original y mango lateral',
      'Tendido de cables eléctricos de obra de forma aérea (h ≥ 2,40 m) o protegidos contra el paso de carretillas y agua',
      'Emisión de Permiso de Trabajo en Caliente, pantalla facial, delantal de cuero y extintor ABC de 10 kg en el puesto',
      'Aplicación de las 5 Reglas de Oro y bloqueo LOTO antes de intervenir tableros o circuitos eléctricos'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 85-104 & 122-127',
    included: true
  },
  {
    id: 'stage_lifting',
    name: '8. Operación de Grúas, Autoelevadores, Guinches e Izaje de Materiales',
    risks: [
      'Caída de carga suspendida por rotura de eslingas, falla de freno o mal estrobado',
      'Vuelco de grúa o autoelevador por exceso de carga o terreno sin compactar',
      'Atrapamiento o golpes por balanceo de la carga y circulación bajo cargas suspendidas'
    ],
    preventiveMeasures: [
      'Prohibición absoluta de permanecer o circular debajo de cargas suspendidas; vallado del radio de giro',
      'Uso de ganchos con pestillo de seguridad, eslingas certificadas sin cortes y guiado de carga con sogas (vientos)',
      'Operadores con carnet habilitante vigente (Res. SRT 960/15 para autoelevadores) y checklist diario pre-operacional'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 265-320 & Res. SRT 960/15',
    included: false
  },
  {
    id: 'stage_finishes',
    name: '9. Revoques, Terminaciones, Pintura, Colocación de Vidrios y Limpieza Final',
    risks: [
      'Inhalación de vapores orgánicos de pinturas, diluyentes, adhesivos o impermeabilizantes',
      'Cortes profundos en manos y antebrazos durante el traslado y colocación de paños vidriados',
      'Caídas desde escaleras de tijera o caballetes en tareas de yesería, cielo raso y pintura',
      'Dermatitis de contacto por cemento, cal o productos químicos de limpieza final'
    ],
    preventiveMeasures: [
      'Ventilación natural o forzada continua en ambientes interiores y uso de respirador con filtros para vapores orgánicos',
      'Manipulación de vidrios con ventosas de sujeción y guantes anticorte certificados; señalización con cinta en paños colocados',
      'Uso de escaleras con zapatas antideslizantes y limitador de apertura, prohibiendo trabajar en los últimos dos peldaños',
      'Disponibilidad de Fichas de Datos de Seguridad (FDS/SGA) en obra y almacenamiento de inflamables en recinto ventilado'
    ],
    applicableStandards: 'Dec. 911/96 Arts. 235-247 & Res. SRT 801/15',
    included: true
  }
];
