export interface IndustryChecklistTemplate {
  id: string;
  title: string;
  industry: 'construccion' | 'metalmecanica' | 'logistica' | 'agro' | 'oficinas' | 'quimica';
  industryLabel: string;
  normative: string;
  description: string;
  frequency: 'Previo al uso' | 'Diario' | 'Semanal' | 'Mensual' | 'Semestral';
  suggestedEpp: string[];
  items: string[];
  criticalItems?: number[]; // indices of zero-tolerance / critical items
}

export const INDUSTRY_CATEGORIES = [
  { id: 'todas', label: 'Todos los Sectores', icon: 'LayoutGrid' },
  { id: 'construccion', label: 'Construcción (Dec. 911/96)', icon: 'HardHat' },
  { id: 'metalmecanica', label: 'Metalmecánica & Planta (Dec. 351/79)', icon: 'Wrench' },
  { id: 'logistica', label: 'Logística & Racks', icon: 'Package' },
  { id: 'agro', label: 'Agropecuario (Dec. 617/97)', icon: 'Tractor' },
  { id: 'oficinas', label: 'Oficinas & Servicios (PVD / Ergonomía)', icon: 'Building2' },
  { id: 'quimica', label: 'Sustancias Químicas (SGA / Res. 295/03)', icon: 'FlaskConical' },
] as const;

export const INDUSTRY_CHECKLISTS: IndustryChecklistTemplate[] = [
  // ==========================================
  // CONSTRUCCIÓN (Dec. 911/96)
  // ==========================================
  {
    id: 'const_andamios',
    title: 'Andamios Tubulares y Plataformas de Trabajo',
    industry: 'construccion',
    industryLabel: 'Construcción (Dec. 911/96)',
    normative: 'Decreto 911/96 Arts. 196 a 224 - Trabajos en Altura',
    description: 'Inspección técnica de estabilidad estructural, tablones, arriostramiento y barandas de andamios tubulares de obra.',
    frequency: 'Semanal',
    suggestedEpp: ['casco', 'calzado', 'arnes', 'guantes'],
    criticalItems: [0, 3, 5, 8],
    items: [
      'Bases y apoyos nivelados sobre placas base de acero o madera (prohibido apoyar sobre ladrillos o tacos precarios).',
      'Estructura metálica vertical (pies derechos) perfectamente aplomada y sin deformaciones ni corrosión profunda.',
      'Crucetas y arriostramientos diagonales colocados en todas las caras y asegurados con pernos pasantes.',
      'Plataforma de trabajo completa, con ancho mínimo reglamentario de 60 cm y sin huecos entre tablones.',
      'Tablones de madera de 2 pulgadas de espesor seleccionados, sin nudos pasantes ni rajaduras, con flejes en los extremos.',
      'Tablones trabados mecánicamente o amarrados con grampas para impedir desplazamientos axiales.',
      'Baranda perimetral de seguridad superior a 1,00 m de altura, baranda intermedia a 0,50 m en todos los laterales libres.',
      'Zócalos o rodapiés perimetrales de madera o chapa con altura mínima de 15 cm colocados en la plataforma.',
      'Línea de vida vertical independiente instalada para enganche de cabo anticaídas durante ascenso y descenso.',
      'Escalera interior de acceso con trampilla de cierre operativo en cada nivel de descanso.',
      'Andamio arriostrado a la estructura fija de la obra a intervalos verticales que no superen 3 veces su menor base.',
      'Tarjeta de habilitación visible (Verde: Apto / Roja: Fuera de servicio) firmada por el capataz o profesional HyS.'
    ]
  },
  {
    id: 'const_excavaciones',
    title: 'Excavaciones, Zanjas y Movimiento de Suelos',
    industry: 'construccion',
    industryLabel: 'Construcción (Dec. 911/96)',
    normative: 'Decreto 911/96 Arts. 142 a 160 - Excavaciones y Demoliciones',
    description: 'Control de estabilidad de taludes, entibaciones, accesos y prevención de derrumbes en pozos y zanjas.',
    frequency: 'Diario',
    suggestedEpp: ['casco', 'calzado', 'guantes', 'visual'],
    criticalItems: [0, 1, 3, 6],
    items: [
      'Estudio e inspección previa de canalizaciones e interferencias subterráneas (gas, agua, cloaca, media/baja tensión).',
      'Talud natural del suelo respetado según tipo de terreno (cohesivo o granular); entibado obligatorio si profundidad > 1,20 m.',
      'Entibado o tablestacado sin fisuras, apoyado firmemente con puntales y cuñas de madera dura aseguradas.',
      'Acopio de material excavado y maquinaria situado a una distancia mínima de seguridad de 0,60 m del borde de zanja.',
      'Escaleras reglamentarias de acceso y salida rápida instaladas cada 15 metros a lo largo de la zanja.',
      'Escalera sobrepasa 1,00 m por encima del nivel de coronamiento de la excavación y está amarrada en su cabecera.',
      'Vallado perimetral rígido de 1,00 m de altura y señalización de peligro reflectiva en todo el perímetro exterior.',
      'Control diario de presencia de agua en el fondo de la excavación y bomba de achique operativa si corresponde.',
      'Inspección del terreno posterior a lluvias torrenciales o vibraciones por tránsito pesado antes del reingreso.'
    ]
  },
  {
    id: 'const_tableros_obra',
    title: 'Tableros Eléctricos Provisorios de Obra',
    industry: 'construccion',
    industryLabel: 'Construcción (Dec. 911/96)',
    normative: 'Decreto 911/96 Arts. 85 a 104 y Reglamentación AEA 90364-7-771',
    description: 'Seguridad eléctrica de tableros seccionales y principales de obra, interruptores diferenciales y tomas industriales.',
    frequency: 'Semanal',
    suggestedEpp: ['calzado', 'guantes', 'visual'],
    criticalItems: [1, 2, 4, 7],
    items: [
      'Gabinete con grado de estanqueidad adecuado a intemperie (IP54 o superior), con puerta y cierre con llave operativo.',
      'Disyuntor diferencial de alta sensibilidad (≤ 30 mA) operativo y verificado mediante pulsador de prueba (TEST).',
      'Interruptores termomagnéticos (llaves térmicas) con calibre adecuado para la sección de los cables que protegen.',
      'Toma de tierra (jabalina) conectada a la barra colectora de tierra y a la masa del gabinete con cable verde-amarillo.',
      'Tomacorrientes industriales normalizados según norma IEC 60309 con traba mecánica (prohibido tomas domésticos a la intemperie).',
      'Cables de alimentación con doble aislación (tipo subterráneo o bajo goma IRAM 2178 / 247-5) elevados o protegidos contra pisadas.',
      'Frente muerto o contrapuerta que impida contacto accidental con bornes y barras con tensión.',
      'Parada de emergencia exterior tipo golpe de puño visible y con retención mecánica.',
      'Cartelería de advertencia de riesgo eléctrico (Rayo / Peligro 220V/380V) y esquema unifilar legible en el interior.',
      'Área frontal del tablero despejada en un radio mínimo de 1 metro, libre de acopios de materiales o charcos de agua.'
    ]
  },
  {
    id: 'const_hormigonera',
    title: 'Hormigoneras y Mezcladoras de Obra',
    industry: 'construccion',
    industryLabel: 'Construcción (Dec. 911/96)',
    normative: 'Decreto 911/96 Art. 248 a 253 - Máquinas para Trabajar Hormigón',
    description: 'Verificación mecánica y eléctrica de hormigoneras de volteo y mezcladoras móviles de obra.',
    frequency: 'Semanal',
    suggestedEpp: ['casco', 'calzado', 'guantes', 'auditivo', 'visual'],
    criticalItems: [0, 2, 4],
    items: [
      'Guarda protectora de chapa envolvente en engranaje piñón-corona y correas de transmisión del motor.',
      'Carcasa del motor eléctrico con conexión equipotencial a tierra efectiva (jabalina local o cable PE en la ficha).',
      'Cable de alimentación sin empalmes con cinta aisladora ni peladuras, con ficha industrial con espiga de tierra.',
      'Botonera o interruptor de marcha y parada en gabinete estanco protegido contra salpicaduras de agua y barro.',
      'Volante de basculamiento del tambor con traba mecánica de posición segura que impida volteos accidentales.',
      'Estructura de chasis estable, sin rajaduras de soldadura en los ejes y con ruedas trabadas durante el amasado.',
      'Limpieza interior y exterior al término de cada jornada sin arrojar chorros de agua directos al motor eléctrico.'
    ]
  },

  // ==========================================
  // METALMECÁNICA & PLANTA INDUSTRIAL (Dec. 351/79)
  // ==========================================
  {
    id: 'ind_amoladora',
    title: 'Amoladora Angular y de Banco',
    industry: 'metalmecanica',
    industryLabel: 'Metalmecánica & Planta (Dec. 351/79)',
    normative: 'Decreto 351/79 Anexo I Cap. 15 - Máquinas y Herramientas',
    description: 'Inspección de resguardos perimetrales, velocidad de giro (RPM), discos abrasivos y pantallas anti-proyección.',
    frequency: 'Previo al uso',
    suggestedEpp: ['facial', 'visual', 'auditivo', 'guantes', 'calzado'],
    criticalItems: [0, 2, 3, 5],
    items: [
      'Guarda o resguardo metálico de protección instalado cubriendo como mínimo 180° del disco abrasivo.',
      'Mango lateral antivibratorio colocado firmemente en la rosca correspondiente según la lateralidad del operador.',
      'Disco abrasivo compatible con las RPM máximas nominales de la amoladora (RPM del disco ≥ RPM de la máquina).',
      'Disco sin melladuras, golpes, deformaciones, fisuras ni desgaste excesivo que alcance el borde de brida.',
      'Brida de ajuste y tuerca original colocadas en la posición correcta según el espesor del disco (corte o desbaste).',
      'Cable de alimentación sin conductores al descubierto ni empalmes caseros, con alivio de tracción en la entrada de carcasa.',
      'Gatillo o pulsador con interruptor de seguridad de hombre muerto que corte la energía al soltarlo.',
      'Uso obligatorio de protección facial integral (careta de policarbonato) adicional a los lentes de seguridad.'
    ]
  },
  {
    id: 'ind_prensa',
    title: 'Prensas Mecánicas, Excéntricas e Hidráulicas',
    industry: 'metalmecanica',
    industryLabel: 'Metalmecánica & Planta (Dec. 351/79)',
    normative: 'Decreto 351/79 Cap. 15 Arts. 103 a 113 - Resguardos de Prensas',
    description: 'Validación de dispositivos de seguridad, barreras fotoeléctricas, comando bimanual y parada de emergencia.',
    frequency: 'Diario',
    suggestedEpp: ['calzado', 'auditivo', 'visual', 'guantes'],
    criticalItems: [0, 1, 2, 4],
    items: [
      'Cortinas ópticas / barreras fotoeléctricas alineadas que detienen inmediatamente el descenso del carro al interrumpir el haz.',
      'Comando bimanual sincronizado que exige accionar ambos pulsadores con una diferencia menor a 0,5 segundos.',
      'Distancia de seguridad del comando bimanual a la zona de atrapamiento conforme a norma IRAM / ISO 13855.',
      'Resguardos fijos o con enclavamiento con microinterruptores de seguridad en laterales y parte posterior de la matriz.',
      'Pulsador de parada de emergencia tipo golpe de puño de acción positiva en el puesto de comando y laterales.',
      'Calza mecánica o traba de seguridad colocada en el carro durante tareas de cambio de matriz o ajuste de herramental.',
      'Freno y embrague de la máquina sin resbalamiento ni accionamientos intempestivos en punto muerto superior.',
      'Indicadores de presión hidráulica o neumática dentro de los valores de consigna del fabricante.'
    ]
  },
  {
    id: 'ind_puente_grua',
    title: 'Puente Grúa, Aparejos y Polipastos',
    industry: 'metalmecanica',
    industryLabel: 'Metalmecánica & Planta (Dec. 351/79)',
    normative: 'Decreto 351/79 Cap. 15 y Anexo I Art. 114 a 132 - Aparatos de Izaje',
    description: 'Control de cables de acero, finales de carrera, pestillo de gancho, botonera y alarma de traslación.',
    frequency: 'Semanal',
    suggestedEpp: ['casco', 'calzado', 'guantes', 'visual'],
    criticalItems: [0, 1, 3, 5],
    items: [
      'Cables de acero de elevación sin aplastamiento, cocas, corrosión, alambres cortados ni deformaciones de jaula de pájaro.',
      'Gancho de elevación con pestillo de seguridad con resorte operativo y sin apertura de boca superior al 10%.',
      'Final de carrera superior e inferior del polipasto probado sin carga y funcionando correctamente.',
      'Finales de carrera de traslación del carro y del puente sobre vigas carrilera operativos.',
      'Botonera colgante o radiocontrol con carcasa aislada, pulsadores identificados con flechas legibles y parada de emergencia.',
      'Cable portante de acero exterior de la botonera para absorber la tracción mecánica e impedir tirones en cables eléctricos.',
      'Alarma acústica y destellador luminoso de traslación del puente grúa operando durante el movimiento.',
      'Cartelería de Carga Máxima Admisible (SWL) visible desde el suelo en ambas caras del puente grúa.',
      'Eslingas y grilletes de carga codificados por color con capacidad de carga legible y fecha de inspección periódica.'
    ]
  },
  {
    id: 'ind_compresor',
    title: 'Compresores de Aire y Recipientes a Presión',
    industry: 'metalmecanica',
    industryLabel: 'Metalmecánica & Planta (Dec. 351/79)',
    normative: 'Decreto 351/79 Cap. 16 - Aparatos que Pueden Desarrollar Presión Interna',
    description: 'Comprobación de válvulas de seguridad, manómetros, purgas de condensado y habilitación de prueba hidráulica.',
    frequency: 'Mensual',
    suggestedEpp: ['auditivo', 'visual', 'calzado'],
    criticalItems: [0, 1, 3],
    items: [
      'Válvula de seguridad contrastada, calibrada por profesional habilitado y con precinto de plomo intacto.',
      'Manómetro con esfera legible, zona de presión de trabajo demarcada y aguja en cero al despresurizar.',
      'Placa identificatoria metálica del tanque pulmón legible con número de registro, presión de diseño y fabricante.',
      'Prueba hidráulica (PH) y ensayo de espesores por ultrasonido vigente y documentado en el Libro de Calderas y Recipientes.',
      'Válvula de purga inferior de condensado operada periódicamente (sin acumulación excesiva de agua y aceite).',
      'Resguardo protector de correas y poleas del motor-cabezal compresor sin aberturas que permitan acceso accidental.',
      'Presostato de corte automático por presión máxima y reanudación por presión mínima calibrado correctamente.',
      'Filtro de aspiración de aire limpio y sin roturas que permitan ingreso de partículas abrasivas al cilindro.'
    ]
  },

  // ==========================================
  // LOGÍSTICA & ALMACENES
  // ==========================================
  {
    id: 'log_autoelevador',
    title: 'Autoelevadores a Combustión y Eléctricos',
    industry: 'logistica',
    industryLabel: 'Logística & Almacenes',
    normative: 'Resolución SRT 960/15 - Vehículos Autopropulsados de Carga',
    description: 'Inspección pre-operacional diaria del conductor: frenos, dirección, mástil, uñas, luces y dispositivos sonoros.',
    frequency: 'Previo al uso',
    suggestedEpp: ['calzado', 'chaleco', 'auditivo', 'visual'],
    criticalItems: [0, 1, 2, 4, 6],
    items: [
      'Cinturón de seguridad de dos o tres puntos con retractor inercial colocado y funcionando sin trabas.',
      'Frenos de servicio (pedal) y freno de estacionamiento de mano retienen el vehículo con firmeza en rampa.',
      'Alarma acústica de retroceso (mínimo 85 dBA) y luz destellante / estroboscópica operativa al colocar marcha atrás.',
      'Dirección hidráulica suave sin juego excesivo en el volante y bocina del centro operativa.',
      'Horquillas / uñas sin fisuras en los talones, sin curvaturas laterales y con desgaste en la base menor al 10%.',
      'Pasadores de traba de posición de las uñas en el tablero portahorquillas colocados y bloqueados.',
      'Mástil, cilindro de elevación e inclinación sin pérdidas de aceite hidráulico en retenes ni mangueras.',
      'Cadenas de elevación lubricadas, con tensión uniforme y sin eslabones agrietados o desgastados.',
      'Estructura de protección contra caída de objetos (FOPS) y jaula antivuelco (ROPS) sin reformas caseras ni cortes.',
      'Extintor triclase ABC de 2,5 kg o 5 kg con carga vigente y manómetro en verde fijado en el soporte metálico.',
      'Neumáticos (macizos o inflables) con banda de rodamiento sin cortes profundos, desprendimientos ni alambres a la vista.'
    ]
  },
  {
    id: 'log_racks',
    title: 'Estanterías Industriales Racks y Almacenamiento',
    industry: 'logistica',
    industryLabel: 'Logística & Almacenes',
    normative: 'Res. SRT 481/16 - Estiba y Desestiba / IRAM 3801',
    description: 'Evaluación de seguridad estructural de racks pesados, protectores de puntal, largueros y estabilidad de carga.',
    frequency: 'Mensual',
    suggestedEpp: ['casco', 'calzado', 'chaleco'],
    criticalItems: [0, 2, 3, 5],
    items: [
      'Protectores de puntal instalados y anclados al piso en todas las esquinas y cabeceras de túneles de circulación.',
      'Puntales y columnas verticales sin deformaciones o abolladuras por impacto de autoelevador (límite < 3 mm en 1 m).',
      'Largueros horizontales con pasadores de seguridad metálicos colocados en ambos extremos para impedir desenganche.',
      'Placas de capacidad máxima admisible (CMA) visibles indicando carga por nivel y por módulo en kilogramos.',
      'Pallets o tarimas de madera en buen estado (sin tablas rotas, clavos sobresalientes ni fisuras en largueros de apoyo).',
      'Mercadería ensunchada o termoencogida (film stretch) que garantice un bloque compacto sin desmoronamientos.',
      'Pasillos de circulación entre racks libres de bultos caídos, residuos o pallets fuera de alineación.',
      'Distancia mínima de seguridad de 50 cm entre la parte superior del último pallet y las cabezas de rociadores de incendio.'
    ]
  },
  {
    id: 'log_muelle_carga',
    title: 'Muelles de Carga y Rampas Niveladoras',
    industry: 'logistica',
    industryLabel: 'Logística & Almacenes',
    normative: 'Decreto 351/79 Cap. 18 & Normas Técnicas de Logística',
    description: 'Seguridad en dársenas de carga, calzos de ruedas de camión, labios de rampa y prevención de caídas a distinto nivel.',
    frequency: 'Semanal',
    suggestedEpp: ['calzado', 'chaleco', 'guantes'],
    criticalItems: [0, 1, 3],
    items: [
      'Calzos de seguridad o trabarruedas mecánicos colocados en ambos lados de los ejes traseros del camión atracado.',
      'Labio de la rampa niveladora apoya con solape mínimo de 10 cm sobre el piso de la caja o semirremolque.',
      'Rampa niveladora hidráulica o mecánica opera con movimientos continuos sin desniveles ni escalonamientos bruscos.',
      'Barandas de contención en laterales del muelle o cadenas de cierre colocadas cuando la compuerta está abierta sin camión.',
      'Topes de goma (bumpers) de la dársena en buen estado amortiguando el impacto del chasis del vehículo.',
      'Iluminación direccionable de interior de caja de camión operativa para permitir carga y descarga segura sin penumbra.',
      'Semáforo exterior/interior de atraque en funcionamiento (Rojo: No mover vehículo / Verde: Bahía liberada).'
    ]
  },

  // ==========================================
  // AGROPECUARIO (Dec. 617/97)
  // ==========================================
  {
    id: 'agro_tractor',
    title: 'Tractores y Maquinaria Agrícola Móvil',
    industry: 'agro',
    industryLabel: 'Agropecuario (Dec. 617/97)',
    normative: 'Decreto 617/97 Título IV - Maquinarias, Herramientas y Motores',
    description: 'Verificación de toma de fuerza, estructura antivuelco, protecciones de correas y condiciones de rodaje.',
    frequency: 'Semanal',
    suggestedEpp: ['calzado', 'auditivo', 'visual', 'sombrero'],
    criticalItems: [0, 1, 3],
    items: [
      'Estructura de protección contra vuelco (ROPS) o cabina de seguridad homologada instalada y fijada sin fisuras.',
      'Toma de fuerza (TDP / PTO) con protector envolvente tubular completo que gira libremente sobre el eje cardánico.',
      'Cinturón de seguridad instalado en el asiento con suspensión y utilizado obligatoriamente por el maquinista.',
      'Escalones de acceso y peldaños con superficie antideslizante limpios de barro, aceite o grasa animal.',
      'Luces delanteras, de freno, de giro y baliza destellante operativa para tránsito en caminos y rutas rurales.',
      'Espejos retrovisores en ambos costados sin roturas y limpios.',
      'Frenos independientes y traba de pedales de freno unida para desplazamiento sobre caminos o calzadas.',
      'Extintor de incendios a base de polvo químico ABC cargado con soporte de desenganche rápido a bordo.'
    ]
  },
  {
    id: 'agro_fitosanitarios',
    title: 'Depósito y Aplicación de Fitosanitarios / Agroquímicos',
    industry: 'agro',
    industryLabel: 'Agropecuario (Dec. 617/97)',
    normative: 'Decreto 617/97 Título III Cap. 4 - Contaminantes y Fitosanitarios',
    description: 'Control de depósito exclusivo, ventilación, batea antiderrame, kit de absorción, triple lavado y EPP específico.',
    frequency: 'Mensual',
    suggestedEpp: ['respirador', 'guantes_quimicos', 'mameluco_tyvek', 'botas_goma', 'antiparras'],
    criticalItems: [0, 1, 3, 6],
    items: [
      'Depósito exclusivo para fitosanitarios, cerrado con llave, alejado de viviendas, fuentes de agua y acopios de granos.',
      'Ventilación natural permanente cruzada que impida la concentración de vapores tóxicos en el interior.',
      'Piso impermeable con pendiente hacia canaleta de contención o batea para recolección de posibles derrames.',
      'Kit de respuesta ante derrames disponible con pala antichispas, material absorbente inerte (tierra de diatomeas/arena) y tambor rotulado.',
      'Ducha de emergencia y lavaojos cercanos con caudal continuo de agua limpia no contaminada.',
      'Productos estibados por clase toxicológica (etiqueta Roja, Amarilla, Azul, Verde) con Fichas FDS / Hoja de Seguridad accesibles.',
      'Prohibición estricta de comer, beber o fumar debidamente señalizada en el ingreso.',
      'Sillón o sector para depósito de envases vacíos sometidos a técnica de Triple Lavado y perforado de base (Ley 27.279).'
    ]
  },
  {
    id: 'agro_silos',
    title: 'Silos y Celdas de Almacenamiento de Granos',
    industry: 'agro',
    industryLabel: 'Agropecuario (Dec. 617/97)',
    normative: 'Decreto 617/97 Título V - Espacios Confinados e Instalaciones de Granos',
    description: 'Seguridad en ingreso a silos, riesgo de engullimiento, bloqueo de norias/sinfines y atmósfera explosiva de polvillo.',
    frequency: 'Previo al uso',
    suggestedEpp: ['arnes', 'respirador_polvo', 'casco', 'calzado'],
    criticalItems: [0, 1, 2, 4],
    items: [
      'Procedimiento de Bloqueo y Etiquetado (LOTO) aplicado con candado en interruptor eléctrico de sinfines y norias de descarga.',
      'Medición de concentración de oxígeno (> 19,5%) y gases de fermentación (CO2, monóxido, fosfina si hubo fumigación).',
      'Vigía exterior permanente con comunicación visual o por radio y sistema de llamada rápida de emergencias.',
      'Operador ingresa con arnés de seguridad de cuerpo entero amarrado a línea de vida y trípode o pescante de rescate superior.',
      'Prohibición absoluta de ingresar sobre grano en movimiento o conos de descarga en vaciado (riesgo letal de atrapamiento/engullimiento).',
      'Instalación eléctrica y luminarias interiores estancas a prueba de explosión de polvo combustible (certificación Ex / ATEX).',
      'Escalera exterior tipo marinera con canasto quitamiedos a partir de los 2,00 m y descansos intermedios cada 9 metros.'
    ]
  },

  // ==========================================
  // OFICINAS & COMERCIOS
  // ==========================================
  {
    id: 'ofi_pvd',
    title: 'Puestos de Trabajo con Pantallas (PVD) & Ergonomía',
    industry: 'oficinas',
    industryLabel: 'Oficinas & Servicios',
    normative: 'Decreto 351/79 & Resolución SRT 886/15 - Protocolo de Ergonomía',
    description: 'Evaluación ergonómica del puesto informático: monitor, silla regulable, teclado, iluminación y confort térmico.',
    frequency: 'Semestral',
    suggestedEpp: [],
    criticalItems: [0, 1, 3],
    items: [
      'Borde superior de la pantalla del monitor situado a la misma altura o ligeramente por debajo del nivel de los ojos.',
      'Distancia de visión entre el operador y la pantalla adecuada (entre 50 cm y 70 cm).',
      'Silla ergonómica operativa con regulación de altura neumática, respaldo reclinable con apoyo lumbar y base rodante de 5 ramas.',
      'Superficie de trabajo a la altura de los codos permitiendo apoyo relajado de los antebrazos sobre la mesa.',
      'Apoyapiés disponible para usuarios que no alcancen apoyar firmemente la planta de ambos pies sobre el suelo.',
      'Teclado y mouse ubicados en el mismo plano, dejando un espacio libre mínimo de 10 cm delante para reposo de muñecas.',
      'Luminarias dispuestas en paralelo a la línea de visión para evitar reflejos molestos en la pantalla o deslumbramiento directo.',
      'Cables de computadoras y fuentes de alimentación canalizados u ordenados con pasacables sin generar riesgo de tropiezos.'
    ]
  },
  {
    id: 'ofi_evacuacion',
    title: 'Vías de Evacuación y Medios de Escape en Edificios',
    industry: 'oficinas',
    industryLabel: 'Oficinas & Servicios',
    normative: 'Decreto 351/79 Anexo VII Cap. 18 - Protección contra Incendios',
    description: 'Inspección de pasillos de evacuación, puertas cortafuego con barral antipánico, luces de emergencia y cartelería.',
    frequency: 'Mensual',
    suggestedEpp: [],
    criticalItems: [0, 1, 2, 4],
    items: [
      'Pasillos de evacuación libres de cajas, muebles, mercadería, cables o cualquier elemento que reduzca el ancho útil.',
      'Puertas de salida de emergencia abren hacia el sentido de escape, sin trabas, cerrojos ni llaves puestas.',
      'Barrales antipánico en puertas de salida de emergencia operan suavemente con simple presión del cuerpo.',
      'Luces de emergencia autónomas operativas en todo el recorrido con prueba de corte de tensión realizada.',
      'Cartelería de señalización de salida y sentidos de escape fotoluminiscente visible desde cualquier ángulo.',
      'Planos de evacuación "Usted está aquí" actualizados colocados en accesos, palieres y zonas comunes de tránsito.',
      'Escaleras de evacuación con pasamanos en ambos lados y bandas antideslizantes en el borde de todos los escalones.'
    ]
  }
];
