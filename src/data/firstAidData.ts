export interface AEDDevice {
  id: string;
  companyId?: string;
  code: string;
  location: string;
  brandModel: string;
  serialNumber: string;
  batteryLevelPercent: number;
  batteryExpiryDate: string;
  padsAdultExpiryDate: string;
  padsPediatricExpiryDate?: string;
  lastTestDate: string;
  status: 'operational' | 'battery_warning' | 'pads_expired' | 'fault';
  responsiblePerson: string;
  hasCabinetAlarm?: boolean;
  hasIlcorSignage?: boolean;
  hasRescueKit?: boolean; // Tijera corta-todo, rasuradora, guantes, mascarilla RCP
  notes?: string;
}

export interface FirstAidKitItem {
  name: string;
  requiredQty: number;
  currentQty: number;
  unit: string;
  expiredDate?: string;
}

export interface FirstAidKit {
  id: string;
  companyId?: string;
  code: string;
  location: string;
  sector?: string;
  type: 'type_a_small' | 'type_b_medium' | 'type_c_industrial';
  lastInspectionDate: string;
  inspectorName: string;
  status: 'complete' | 'restock_needed' | 'expired_items';
  items: FirstAidKitItem[];
  photos?: string[];
  notes?: string;
}

export interface MinorInjuryRecord {
  id: string;
  companyId?: string;
  date: string;
  time: string;
  workerName: string;
  workerCuil: string;
  area: string;
  injuryType:
    | 'corte_superficial'
    | 'raspon_escoriacion'
    | 'cuerpo_extrano_ocular'
    | 'quemadura_menor'
    | 'contusion_leve'
    | 'esguince_torcedura'
    | 'malestar_presion_arterial';
  vitalSigns?: string; // Ej: TA 120/80 mmHg · FC 76 lpm · SatO2 98%
  treatmentDescription: string;
  itemsUsed: string;
  kitCodeUsed?: string;
  firstResponderName: string;
  outcome: 'returned_to_work' | 'referred_to_art_clinic' | 'medical_rest';
}

export interface FirstAidBrigadier {
  id: string;
  companyId?: string;
  fullName: string;
  roleSector: string;
  shift: 'Mañana' | 'Tarde' | 'Noche' | 'Rotativo / Central';
  phone: string;
  certificationEntity: string; // Ej: Cruz Roja Argentina / AHA / Servicio Médico ART
  certificationDate: string;
  expiryDate: string;
  status: 'vigente' | 'por_vencer' | 'vencido';
}

export interface EmergencyProtocolGuide {
  id: string;
  title: string;
  normative: string;
  severity: 'CRÍTICA' | 'ALTA' | 'MEDIA';
  color: string;
  steps: string[];
  warnings: string[];
}

export const DEFAULT_KIT_ITEMS: Record<'type_a_small' | 'type_b_medium' | 'type_c_industrial', FirstAidKitItem[]> = {
  type_a_small: [
    { name: 'Gasas estériles individuales (10x10 cm)', requiredQty: 10, currentQty: 10, unit: 'sobres' },
    { name: 'Vendas de gasa cambric (7 cm x 3 m)', requiredQty: 2, currentQty: 2, unit: 'rollos' },
    { name: 'Cinta adhesiva hipoalergénica (2.5 cm)', requiredQty: 1, currentQty: 1, unit: 'rollo' },
    { name: 'Apósitos adhesivos protectores ("curitas")', requiredQty: 15, currentQty: 15, unit: 'unidades' },
    { name: 'Guantes descartables de nitrilo (sin látex)', requiredQty: 4, currentQty: 4, unit: 'pares' },
    { name: 'Solución antiséptica Clorhexidina digluconato 2%', requiredQty: 1, currentQty: 1, unit: 'frasco' },
    { name: 'Solución fisiológica estéril (100 ml)', requiredQty: 2, currentQty: 2, unit: 'ampollas' },
    { name: 'Tijera punta roma corta-todo', requiredQty: 1, currentQty: 1, unit: 'unidad' },
    { name: 'Manta térmica aluminizada de emergencia', requiredQty: 1, currentQty: 1, unit: 'unidad' }
  ],
  type_b_medium: [
    { name: 'Gasas estériles individuales (10x10 cm)', requiredQty: 20, currentQty: 20, unit: 'sobres' },
    { name: 'After-burn / Gasas vaselinadas estériles p/ quemaduras', requiredQty: 5, currentQty: 5, unit: 'sobres' },
    { name: 'Vendas de gasa cambric (10 cm x 3 m)', requiredQty: 5, currentQty: 5, unit: 'rollos' },
    { name: 'Venda elástica cohesiva para inmovilización', requiredQty: 2, currentQty: 2, unit: 'rollos' },
    { name: 'Cinta adhesiva hipoalergénica (2.5 cm)', requiredQty: 2, currentQty: 2, unit: 'rollos' },
    { name: 'Apósitos adhesivos ("curitas")', requiredQty: 30, currentQty: 30, unit: 'unidades' },
    { name: 'Tijera multipropósito corta-todo acero inox', requiredQty: 1, currentQty: 1, unit: 'unidad' },
    { name: 'Pinza de mano sin dientes (extracción de astillas)', requiredQty: 1, currentQty: 1, unit: 'unidad' },
    { name: 'Guantes de examen descartables de nitrilo', requiredQty: 10, currentQty: 10, unit: 'pares' },
    { name: 'Antiséptico de Clorhexidina / Iodopovidona', requiredQty: 1, currentQty: 1, unit: 'frasco' },
    { name: 'Solución fisiológica para lavado ocular/heridas (250 ml)', requiredQty: 2, currentQty: 2, unit: 'frascos' },
    { name: 'Férula semirrígida moldeable p/ inmovilización', requiredQty: 1, currentQty: 1, unit: 'unidad' },
    { name: 'Mascarilla facial Pocket Mask con válvula unidireccional RCP', requiredQty: 1, currentQty: 1, unit: 'unidad' }
  ],
  type_c_industrial: [
    { name: 'Gasas estériles hidrofílicas individuales (10x10 cm)', requiredQty: 40, currentQty: 40, unit: 'sobres' },
    { name: 'Apósitos compresivos estériles p/ hemorragias', requiredQty: 6, currentQty: 6, unit: 'unidades' },
    { name: 'Gel / Apósitos estériles Hydrogel p/ quemaduras térmicas', requiredQty: 6, currentQty: 6, unit: 'sobres' },
    { name: 'Vendas de gasa cambric (10 cm x 3 m)', requiredQty: 10, currentQty: 10, unit: 'rollos' },
    { name: 'Vendas elásticas de sujeción (10 cm)', requiredQty: 4, currentQty: 4, unit: 'rollos' },
    { name: 'Cinta adhesiva hipoalergénica médica (2.5 cm)', requiredQty: 4, currentQty: 4, unit: 'rollos' },
    { name: 'Apósitos adhesivos impermeables', requiredQty: 50, currentQty: 50, unit: 'unidades' },
    { name: 'Guantes descartables de nitrilo alta resistencia', requiredQty: 20, currentQty: 20, unit: 'pares' },
    { name: 'Solución antiséptica Clorhexidina 2% spray/frasco', requiredQty: 2, currentQty: 2, unit: 'frascos' },
    { name: 'Solución lavaojos estéril neutralizante (500 ml)', requiredQty: 4, currentQty: 4, unit: 'frascos' },
    { name: 'Férulas inflables o moldeables para miembros', requiredQty: 2, currentQty: 2, unit: 'kits' },
    { name: 'Collar cervical regulable tipo Philadelphia', requiredQty: 1, currentQty: 1, unit: 'unidad' },
    { name: 'Torniquete táctico homologado p/ control de hemorragias graves', requiredQty: 1, currentQty: 1, unit: 'unidad' },
    { name: 'Manta térmica aluminizada isotérmica (frío/calor)', requiredQty: 2, currentQty: 2, unit: 'unidades' },
    { name: 'Mascarilla de reanimación RCP Pocket Mask con filtro', requiredQty: 2, currentQty: 2, unit: 'unidades' },
    { name: 'Tijera corta-todo + Pinza estéril + Linterna pupilar', requiredQty: 1, currentQty: 1, unit: 'set' }
  ]
};

export const EMERGENCY_PROTOCOLS_DATA: EmergencyProtocolGuide[] = [
  {
    id: 'rcp-dea',
    title: '1. Paro Cardiorrespiratorio: RCP + Uso de DEA',
    normative: 'Ley Nacional 27.159 · Guías AHA / ILCOR',
    severity: 'CRÍTICA',
    color: '#e11d48',
    steps: [
      'Aplicar conducta PAS (Proteger la escena, Avisar al 107 / Emergencia Médica ART y pedir el DEA más cercano, Socorrer).',
      'Verificar respuesta de la víctima sacudiendo suavemente los hombros y comprobar si respira normalmente (no más de 10 segundos).',
      'Iniciar compresiones torácicas firmes y rápidas en el centro del pecho: frecuencia de 100 a 120 compresiones por minuto, profundidad de 5 a 6 cm.',
      'Apenas llegue el DEA: encenderlo, descubrir y secar el tórax, adherir los parches según el dibujo (infraclavicular derecho y lateral izquierdo).',
      'Nadie debe tocar a la víctima mientras el DEA analiza el ritmo. Si indica descarga: gritar "¡Todos fuera!", presionar el botón de choque y reanudar RCP inmediatamente por 2 minutos.'
    ],
    warnings: [
      'No demorar el inicio de las compresiones ni interrumpirlas por más de 10 segundos.',
      'Si el tórax está mojado o con sudor excesivo, secarlo antes de pegar los parches del DEA.'
    ]
  },
  {
    id: 'electrocuted',
    title: '2. Accidente por Choque Eléctrico / Electrocución',
    normative: 'Dec. 351/79 Anexo VI · Res. SRT 3068/14',
    severity: 'CRÍTICA',
    color: '#d97706',
    steps: [
      '¡NO TOCAR a la víctima directamente mientras esté en contacto con la fuente de tensión!',
      'Cortar de inmediato el suministro eléctrico desde el interruptor general / parada de emergencia o separar el conductor con pértiga dieléctrica.',
      'Una vez asegurada la ausencia de tensión, evaluar conciencia y respiración: el choque eléctrico suele provocar fibrilación ventricular (aplicar RCP + DEA de inmediato si no responde).',
      'Cubrir las quemaduras eléctricas (punto de entrada y salida) con gasas estériles secas sin aplicar cremas ni ungüentos.',
      'Trasladar obligatoriamente a centro médico de ART para monitoreo electrocardiográfico aunque el trabajador parezca recuperado.'
    ],
    warnings: [
      'Jamás utilizar objetos metálicos o húmedos para apartar un cable energizado.',
      'Todo accidentado eléctrico requiere evaluación médica hospitalaria por riesgo de arritmias tardías.'
    ]
  },
  {
    id: 'hemorrhage',
    title: '3. Hemorragias Severas, Cortes Profundos y Amputaciones',
    normative: 'Protocolo STOP THE BLEED · Dec. 351/79 Anexo VII',
    severity: 'ALTA',
    color: '#dc2626',
    steps: [
      'Colocarse guantes de nitrilo estériles por bioseguridad.',
      'Aplicar presión directa firme y continua sobre la herida utilizando un apósito compresivo o paquete de gasas estériles.',
      'Si el apósito se empapa de sangre, NO retirarlo: colocar otro paquete de gasas encima y mantener la compresión firme.',
      'En sangrado arterial exanguinante en extremidades que no cede con presión directa: aplicar torniquete homologado de 5 a 7 cm por encima de la herida y anotar la hora exacta de colocación.',
      'En caso de amputación traumática: envolver la parte amputada en gasa estéril humedecida con solución fisiológica, colocarla en bolsa plástica cerrada y ésta en recipiente con agua y hielo (sin contacto directo con el hielo).'
    ],
    warnings: [
      'No retirar objetos empalados o incrustados (fijarlos en su lugar para evitar hemorragia masiva).',
      'Prohibido colocar alcohol, algodón deshilachado, café o remedios caseros dentro de la herida.'
    ]
  },
  {
    id: 'burns-eyes',
    title: '4. Quemaduras Térmicas / Químicas y Salpicadura Ocular',
    normative: 'Norma ANSI Z358.1 (Lavaojos) · Res. SRT 801/15 SGA',
    severity: 'ALTA',
    color: '#0284c7',
    steps: [
      'Salpicadura química en ojos o piel: irrigar inmediatamente en ducha de emergencia / estación lavaojos con abundante agua corriente o solución fisiológica durante al menos 15 a 20 minutos continuos, manteniendo los párpados abiertos.',
      'Consultar la Ficha de Datos de Seguridad (FDS / SGA) del producto químico involucrado y entregarla al equipo médico.',
      'Quemadura térmica (fuego, vapor, contacto caliente): enfriar la zona con agua corriente limpia a temperatura ambiente (no helada) durante 10 a 15 minutos.',
      'Cubrir la lesión con apósito estéril tipo Hydrogel o gasa vaselinada sin comprimir; retirar anillos, relojes o pulseras antes de que aparezca edema.'
    ],
    warnings: [
      'No pinchar ni reventar las ampollas (flictenas) ni despegar ropa adherida a la piel quemada.',
      'No aplicar hielo directo, dentífrico, manteca ni aceites sobre la quemadura.'
    ]
  },
  {
    id: 'choking-heimlich',
    title: '5. Obstrucción Grave de la Vía Aérea (Maniobra de Heimlich)',
    normative: 'Guías Internacionales de Socorrismo Laboral',
    severity: 'ALTA',
    color: '#059669',
    steps: [
      'Identificar obstrucción total: el trabajador se lleva las manos al cuello (signo universal de asfixia), no puede hablar, toser ni respirar.',
      'Ubicarse por detrás de la persona, rodear su cintura con ambos brazos e inclinar su tronco levemente hacia adelante.',
      'Cerrar un puño colocando el pulgar justo por encima del ombligo y por debajo de la punta del esternón (boca del estómago).',
      'Sujetar el puño con la otra mano y realizar compresiones abdominales rápidas y firmes hacia adentro y hacia arriba ("en forma de J") hasta que expulse el cuerpo extraño.',
      'Si la persona pierde el conocimiento, recostarla con cuidado en el suelo, activar emergencias (107) e iniciar maniobras de RCP.'
    ],
    warnings: [
      'Si la persona puede toser con fuerza o hablar, NO golpear la espalda ni hacer Heimlich: alentarla a seguir tosiendo.'
    ]
  }
];

