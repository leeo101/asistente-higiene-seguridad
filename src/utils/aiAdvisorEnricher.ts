export interface RecommendedModule {
  nombre: string;
  ruta: string;
  motivo: string;
  comoUsarlo?: string;
}

export interface CatalogModule extends RecommendedModule {
  keywords: string[];
  pasosGuia: string[];
  riesgosTipicos: string[];
  eppTipico: string[];
  recomendacionesTipicas: string[];
  normativaTipica: string[];
}

export const PLATFORM_MODULES_CATALOG: CatalogModule[] = [
  {
    nombre: 'Generador de Planos de Evacuación y Mapas de Riesgo',
    ruta: '/risk-maps',
    motivo: 'Diseñar el plano o croquis de evacuación con rutas de escape, salidas de emergencia, ubicación de extintores, botiquines, tableros y punto de encuentro ("Usted está aquí").',
    comoUsarlo: 'Entrá a /risk-maps, subí la imagen del plano de planta o dibujá los sectores en el lienzo interactivo, arrastrá los íconos normalizados (flechas verdes de ruta de escape, salidas de emergencia, matafuegos ABC/CO2, hidrantes, botiquín, "Usted está aquí" y Punto de Encuentro) y descargá el plano oficial en PDF A4/A3 listo para imprimir y exhibir.',
    keywords: ['plano de evacuacion', 'plano de evacuación', 'planos de evacuacion', 'croquis de evacuacion', 'croquis', 'mapa de riesgo', 'mapas de riesgo', 'rutas de escape', 'usted esta aqui', 'plano', 'evacuacion', 'evacuación', 'salidas de emergencia'],
    pasosGuia: [
      'Relevar en el establecimiento el layout de planta: ubicación de puertas de salida, sentido de apertura (hacia el exterior en sentido de escape), pasillos de circulación, escaleras, tableros eléctricos generales, llaves de corte de gas y posición exacta de cada matafuego, luz de emergencia y botiquín.',
      'Ingresar al módulo "Generador de Planos de Evacuación y Mapas de Riesgo" (/risk-maps) para cargar o dibujar la planta arquitectónica, trazar con flechas direccionales las rutas principales y secundarias de escape, marcar el indicador "Usted está aquí" según la orientación real del cartel y señalar el Punto de Reunión exterior seguro.',
      'Abrir el módulo "Simulador y Cálculo de Evacuación" (/evacuation-form) y cargar la superficie en m² y el uso del local para calcular técnicamente el Factor de Ocupación, las Unidades de Ancho de Salida (u.a.s.) requeridas y el tiempo estimado de escape según el Anexo VII del Dec. 351/79.',
      'Completar el módulo "Plan de Emergencias y Brigadas" (/emergency-plan) asignando los roles del personal (Director de evacuación, Líderes de sector, Encargado de corte de suministros de luz/gas y Primeros Auxilios) junto con los números de emergencia locales (Bomberos 100, SAME 107, Defensa Civil 103, Policía 911).',
      'Verificar el inventario y vencimiento de los matafuegos en el módulo "Gestión de Extintores" (/extintores) y calcular si la dotación cubre el riesgo mediante el módulo "Carga de Fuego" (/fire-load).',
      'Planificar y dejar asentado el ejercicio periódico obligatorio con todo el personal en el módulo "Actas de Simulacros de Emergencia" (/drills).'
    ],
    riesgosTipicos: [
      'Obstrucción o bloqueo de pasillos y medios exigidos de salida durante una emergencia.',
      'Atrapamiento por humo tóxico o gases de combustión ante falta de señalización fotoluminiscente o luces de emergencia.',
      'Pánico colectivo y embotellamiento en puertas que abren en sentido contrario a la evacuación o carecen de barra antipánico.',
      'Falta de identificación de tableros de corte general de energía eléctrica y válvula de corte de gas.',
      'Desconocimiento del Punto de Encuentro exterior por parte del personal o visitantes.'
    ],
    eppTipico: [
      'Chalecos reflectivos identificatorios de alta visibilidad para Líderes de Evacuación y Brigadistas.',
      'Silbatos de emergencia o megáfono autónomo para guiar la evacuación.',
      'Linternas estancas autónomas y equipos de iluminación de emergencia operativos.',
      'Extintores portátiles Triclase ABC y CO2 señalizados y accesibles en el recorrido de escape.',
      'Botiquín de primeros auxilios portátil y férula/tabla espinal para traslado al Punto de Encuentro.'
    ],
    recomendacionesTipicas: [
      'Orientar cada plano de evacuación ("Usted está aquí") de acuerdo con la posición real del observador frente a la pared donde se instala (altura 1,40 m a 1,60 m).',
      'Garantizar que ningún punto del establecimiento diste más de 40 metros de una salida o escalera protegida (Dec. 351/79 Anexo VII).',
      'Instalar señalización fotoluminiscente según norma IRAM 10005 / ISO 7010 en todos los cambios de dirección, dinteles de puertas y equipos contra incendio.',
      'Verificar mensualmente el encendido autónomo de las luminarias de emergencia ante corte de suministro eléctrico (autonomía mínima 90 minutos).',
      'Realizar al menos 1 o 2 simulacros de evacuación anuales cronometrados y documentar las mejoras en el módulo /drills.'
    ],
    normativaTipica: [
      'Ley Nacional N° 19.587 de Higiene y Seguridad en el Trabajo.',
      'Decreto 351/79 — Capítulo 18 (Protección contra Incendios) y Anexo VII (Medios de Escape, Factor de Ocupación y Unidades de Ancho de Salida).',
      'Norma IRAM 10005 (Colores y señales de seguridad) e ISO 7010 (Pictogramas de evacuación y equipos contra incendio).',
      'Norma IRAM 3517-2 (Dotación, control y mantenimiento de extintores).',
      'Ley 5920 (CABA - Sistema de Autoprotección) / Normativas provinciales y municipales de Defensa Civil.'
    ]
  },
  {
    nombre: 'Simulador y Cálculo de Evacuación (Dec. 351/79)',
    ruta: '/evacuation-form',
    motivo: 'Calcular técnicamente el factor de ocupación, unidades de ancho de salida (UAS), cantidad de puertas exigidas y tiempo estimado de evacuación.',
    comoUsarlo: 'Abrí /evacuation-form, ingresá la superficie del sector (m²), el tipo de uso/actividad según el Anexo VII y la cantidad de ocupantes para obtener el cálculo reglamentario de anchos de salida y el informe técnico firmable.',
    keywords: ['simulacion de evacuacion', 'ancho de salida', 'factor de ocupacion', 'unidades de ancho', 'salida de emergencia', 'escape', 'evacuacion', 'evacuación'],
    pasosGuia: [
      'Medir la superficie de piso libre (m²) de cada planta o sector del establecimiento.',
      'Ingresar a "/evacuation-form" para determinar el Factor de Ocupación ($m^2$ por persona) y las Unidades de Ancho de Salida ($n = N / 100$).',
      'Complementar el cálculo técnico con el diseño gráfico del plano en "/risk-maps" y el protocolo de brigada en "/emergency-plan".'
    ],
    riesgosTipicos: [
      'Subdimensionamiento de anchos de puertas y escaleras respecto a la población máxima real.',
      'Tiempo de evacuación superior al tiempo disponible antes de condiciones críticas por humo o calor.'
    ],
    eppTipico: [
      'Señalización fotoluminiscente de salidas de emergencia y barras antipánico certificadas.',
      'Iluminación de emergencia autónoma en rutas de escape y desniveles.'
    ],
    recomendacionesTipicas: [
      'Respetar el ancho mínimo libre de 1,10 m (2 u.a.s.) para medios exigidos de salida nuevos.',
      'Mantener las puertas de salida libres de cerraduras con llave durante todo el horario laboral.'
    ],
    normativaTipica: [
      'Decreto 351/79 Anexo VII Inciso 3 (Medios de Escape, Factor de Ocupación y Unidades de Ancho de Salida).',
      'NFPA 101 (Código de Seguridad Humana).'
    ]
  },
  {
    nombre: 'Plan de Emergencias y Brigadas',
    ruta: '/emergency-plan',
    motivo: 'Redactar el protocolo de actuación ante emergencias, designar roles de brigadistas, teléfonos útiles y puntos de reunión.',
    comoUsarlo: 'En /emergency-plan completá los datos del establecimiento, asigná los responsables de evacuación, corte de energía/gas, lucha contra el fuego y primeros auxilios, e imprimí el plan oficial.',
    keywords: ['plan de emergencia', 'plan de emergencias', 'emergencias', 'brigada', 'contingencia', 'punto de encuentro', 'autoproteccion'],
    pasosGuia: [
      'Definir el organigrama de la brigada de emergencias (Director de evacuación, líderes de sector, encargado de corte de suministros y suplentes).',
      'Establecer los procedimientos de alarma, llamada a servicios externos y recuento en el Punto de Encuentro.',
      'Cargar y emitir el documento en "/emergency-plan", diseñar el plano en "/risk-maps" y registrar el simulacro en "/drills".'
    ],
    riesgosTipicos: [
      'Falta de coordinación o roles indefinidos durante un principio de incendio o fuga de gas.',
      'Electrocución de brigadistas o bomberos por no cortar el suministro eléctrico general.'
    ],
    eppTipico: [
      'Chalecos identificatorios por rol, silbatos, linternas, botiquín de primeros auxilios y extintores.'
    ],
    recomendacionesTipicas: [
      'Publicar la lista de teléfonos de emergencia y los roles de brigada en cartelera visible.',
      'Capacitar a los brigadistas en uso práctico de extintores y RCP/DEA.'
    ],
    normativaTipica: [
      'Ley 19.587 y Decreto 351/79 Cap. 18 (Protección contra Incendios y Plan de Evacuación).'
    ]
  },
  {
    nombre: 'Actas de Simulacros de Emergencia',
    ruta: '/drills',
    motivo: 'Registrar y certificar la realización de simulacros de evacuación e incendio con tiempos de respuesta y oportunidades de mejora.',
    comoUsarlo: 'Ingresá a /drills/new, cargá la hipótesis de emergencia, el tiempo total de evacuación cronometrado, la cantidad de personas evacuadas y las firmas.',
    keywords: ['simulacro', 'simulacros', 'acta de simulacro', 'entrenamiento de emergencia'],
    pasosGuia: [
      'Definir la hipótesis de emergencia (incendio, derrame, fuga de gas) y avisar a los líderes de sector.',
      'Cronometrar el tiempo desde la activación de la alarma hasta el recuento final en el Punto de Reunión.',
      'Emitir el acta oficial firmada en el módulo "Simulacros" (/drills/new).'
    ],
    riesgosTipicos: [
      'Tropezones o caídas en escaleras por correr durante la práctica de evacuación.',
      'Puntos ciegos o sectores donde no se escucha la sirena de alarma.'
    ],
    eppTipico: [
      'Chalecos reflectivos para líderes de evacuación, cronómetro, megáfono y lista de presentes.'
    ],
    recomendacionesTipicas: [
      'Evaluar en reunión post-simulacro los cuellos de botella detectados y cargar las mejoras en el módulo CAPA (/capa/new).'
    ],
    normativaTipica: [
      'Decreto 351/79 Anexo VII (Obligatoriedad de planes y prácticas de evacuación).'
    ]
  },
  {
    nombre: 'Análisis de Trabajo Seguro (ATS / APR)',
    ruta: '/ats',
    motivo: 'Desglosar cualquier tarea operativa paso a paso, identificando los peligros de cada etapa, las medidas de control, los EPP obligatorios y las firmas digitalizadas de la cuadrilla.',
    comoUsarlo: 'Entrá a /ats, hacé clic en "Nuevo ATS", escribí la tarea y ubicación (podés tocar el botón "Autocompletar con IA" dentro del formulario), revisá o agregá cada etapa con su riesgo y medida preventiva, tildá los EPP requeridos, recolectá las firmas en pantalla y descargá o imprimí el PDF A4.',
    keywords: ['ats', 'analisis de trabajo seguro', 'análisis de trabajo seguro', 'apr', 'art', 'tarea', 'paso a paso', 'montaje', 'mantenimiento', 'obra', 'operativo', 'procedimiento', 'hacer un ats'],
    pasosGuia: [
      'Reunir a la cuadrilla en el lugar exacto de la tarea antes de empezar para realizar la inspección visual del entorno (líneas eléctricas aéreas, estado del piso, interferencias con otros gremios, clima).',
      'Dividir el trabajo en 4 a 7 etapas cronológicas claras: 1) Vallado y preparación de zona, 2) Inspección de herramientas y equipos, 3) Ejecución paso a paso de la maniobra principal, 4) Desarme, orden, limpieza y retiro.',
      'Por cada etapa, identificar los peligros reales (caída a distinto nivel, contacto eléctrico, atrapamiento, proyección de partículas, sobreesfuerzo) y definir la barrera de control concreta.',
      'Abrir el módulo "Análisis de Trabajo Seguro (ATS)" (/ats), cargar la secuencia operativa, seleccionar los EPP obligatorios y firmar digitalmente tanto el supervisor/profesional como los trabajadores ejecutantes.',
      'Si la tarea incluye un riesgo crítico (trabajo en altura, en caliente/soldadura, con tensión eléctrica, espacio confinado o excavación), emitir en paralelo el Permiso de Trabajo específico en su módulo correspondiente y registrar la entrega de EPP en /ppe-tracker.'
    ],
    riesgosTipicos: [
      'Golpes, cortes o atrapamientos por uso de herramientas manuales o eléctricas portátiles sin protección.',
      'Caídas al mismo o distinto nivel por superficies irregulares, falta de orden y limpieza o trabajo en altura.',
      'Contacto eléctrico directo o indirecto por cables deteriorados o tableros sin disyuntor diferencial ni puesta a tierra.',
      'Proyección de partículas incandescentes o esquirlas oculares durante corte, amolado o perforación.',
      'Sobreesfuerzo muscular o posturas forzadas durante el movimiento manual de materiales.'
    ],
    eppTipico: [
      'Casco de seguridad certificado (IRAM 3620) con barbijo si hay altura.',
      'Calzado de seguridad con puntera de acero o composite y suela dieléctrica/antideslizante (IRAM 3610).',
      'Anteojos de seguridad policarbonato (IRAM 3630) o protector facial completo.',
      'Guantes de protección mecánica, vaqueta, anticorte o dieléctricos según la etapa de la tarea.',
      'Protector auditivo endoaural o de copa (IRAM 4060) y ropa de trabajo reglamentaria.'
    ],
    recomendacionesTipicas: [
      'Confeccionar y leer el ATS en el frente de trabajo junto a todos los operarios involucrados antes de iniciar la tarea (complementar con la Charla de 5 Minutos en /toolbox-talk).',
      'Demarcar y señalizar el perímetro operativo con conos, cintas de peligro o vallado rígido para impedir el paso de terceros.',
      'Verificar que todas las herramientas eléctricas cuenten con doble aislación, carcasa protectora original y sean conectadas a tableros con disyuntor diferencial ≤ 30 mA.',
      'Aplicar el derecho a detener la tarea (Stop Work Authority) si cambian las condiciones climáticas o del entorno, reevaluando el ATS.'
    ],
    normativaTipica: [
      'Ley Nacional N° 19.587 de Higiene y Seguridad en el Trabajo.',
      'Decreto 351/79 (Reglamentación General) / Decreto 911/96 (Reglamento para la Industria de la Construcción).',
      'Resolución SRT 299/11 (Provisión de Elementos de Protección Personal certificados).',
      'Resolución SRT 51/97, 35/98 y 319/99 (Programas de Seguridad y procedimientos de trabajo seguro).'
    ]
  },
  {
    nombre: 'Permiso de Trabajo con Tensión / Arc Flash (NFPA 70E)',
    ruta: '/arc-flash/new',
    motivo: 'Autorizar trabajos en tableros o instalaciones eléctricas energizadas, calculando energía incidente (cal/cm²), frontera de arco eléctrico y categoría de EPP ignífugo.',
    comoUsarlo: 'Abrí /arc-flash/new, ingresá tensión (V), corriente de cortocircuito (kA), tiempo de despeje y distancia de trabajo; el sistema calcula las cal/cm² y la Categoría NFPA 70E, verificás el checklist y firmás digitalmente.',
    keywords: ['electrico', 'eléctrico', 'tension', 'tensión', 'arc flash', 'arco electrico', 'arco eléctrico', 'tablero', 'subestacion', 'celda', 'energizado', 'nfpa 70e', '3068'],
    pasosGuia: [
      'Evaluar primero si es posible desenergizar aplicando las 5 Reglas de Oro en el módulo "Bloqueo LOTO" (/loto/new). Si debe hacerse con tensión, continuar con el permiso.',
      'Abrir el módulo "Permiso con Tensión / Arc Flash" (/arc-flash/new) e ingresar tensión nominal, corriente de falla y tiempo de apertura de la protección para calcular la energía incidente (cal/cm²) y las fronteras de aproximación.',
      'Equipar al personal habilitado (BT1/MT1/AT1 según Res. SRT 3068/14) con indumentaria ignífuga ATPV acorde a la categoría calculada (CAT 1 a 4), careta facial anti-arco, guantes dieléctricos y alfombra aislante.',
      'Completar la lista de verificación pre-tarea (herramientas aisladas IEC 60900 1000V, detector de tensión, pértiga de rescate, vallado de frontera de arco) y firmar digitalmente antes de intervenir.'
    ],
    riesgosTipicos: [
      'Quemaduras graves de 3° grado por relámpago de arco eléctrico (Arc Flash) con temperaturas superiores a 19.000 °C.',
      'Onda expansiva de presión (Arc Blast), proyección de cobre fundido y trauma acústico severo.',
      'Electrocución / fibrilación ventricular por contacto directo o indirecto con partes activas bajo tensión.'
    ],
    eppTipico: [
      'Traje o indumentaria ignífuga certificada (ASTM F1506 / IEC 61482) con valor ATPV superior a las cal/cm² calculadas.',
      'Casco dieléctrico Clase E con pantalla facial anti-arco eléctrico y mentonera + capucha ignífuga (balaclava).',
      'Guantes dieléctricos certificadas (IEC 60903 Clase 00 a 4) con guantes de cuero protector encima.',
      'Calzado de seguridad dieléctrico sin componentes metálicos y alfombra/banqueta aislante.'
    ],
    recomendacionesTipicas: [
      'Prohibir estrictamente cualquier trabajo con tensión cuando la energía incidente supere las 40 cal/cm² (peligro extremo de onda expansiva).',
      'Retirar anillos, relojes, cadenas y cualquier objeto metálico conductor antes de ingresar a la frontera limitada.',
      'Contar obligatoriamente con un segundo electricista vigía en el exterior de la frontera de arco entrenado en RCP, uso de DEA y rescate con pértiga.'
    ],
    normativaTipica: [
      'Resolución SRT 3068/14 (Reglamento para la Ejecución de Trabajos con Tensión en instalaciones ≤ 1 kV) y Res. SRT 592/04 (> 1 kV).',
      'Norma NFPA 70E (Seguridad Eléctrica en Lugares de Trabajo) e IEEE 1584 (Cálculo de Energía Incidente).',
      'Decreto 351/79 Anexo VI (Instalaciones Eléctricas) y Reglamentación AEA 90364 / 95702.'
    ]
  },
  {
    nombre: 'Bloqueo y Etiquetado de Energías Peligrosas (LOTO)',
    ruta: '/loto/new',
    motivo: 'Documentar el aislamiento de fuentes de energía (eléctrica, neumática, hidráulica, térmica, mecánica) con candado y tarjeta personal para garantizar Energía Cero.',
    comoUsarlo: 'En /loto/new registrá la máquina o tablero, los puntos de corte, la disipación de energía residual, la prueba de arranque fallido (energía cero) y los candados colocados.',
    keywords: ['loto', 'bloqueo', 'etiquetado', 'candado', 'energia cero', 'energía cero', 'desenergizar', '5 reglas de oro', 'mantenimiento de maquina'],
    pasosGuia: [
      'Identificar todas las fuentes de alimentación primaria y energías residuales (condensadores, aire comprimido, resortes, gravedad, presión hidráulica).',
      'Aplicar las 5 Reglas de Oro: 1° Corte efectivo y visible, 2° Bloqueo mecánico con candado personal y tarjeta LOTO, 3° Purga/disipación de energía residual, 4° Verificación de ausencia de tensión/energía cero (prueba de botonera), 5° Puesta a tierra y en cortocircuito.',
      'Documentar el bloqueo y las firmas de cada técnico interviniente en el módulo "Bloqueo LOTO" (/loto/new).'
    ],
    riesgosTipicos: [
      'Arranque inesperado o energización accidental de la máquina mientras el operario se encuentra en el interior.',
      'Liberación brusca de energía neumática, hidráulica o gravitacional acumulada.'
    ],
    eppTipico: [
      'Candado de bloqueo dieléctrico personal (1 candado = 1 trabajador = 1 llave única), pinza multiplicadora y tarjeta LOTO.',
      'Detector de ausencia de tensión bipolar certificado, guantes dieléctricos y lentes de seguridad.'
    ],
    recomendacionesTipicas: [
      'Cada técnico que interviene debe colocar su propio candado personal en la pinza multiplicadora; nadie puede retirar el candado de otro.',
      'Realizar siempre la prueba de intento de marcha desde el panel de control luego de bloquear para confirmar Energía Cero.'
    ],
    normativaTipica: [
      'Decreto 351/79 Anexo VI (Trabajos y Maniobras en Instalaciones Eléctricas - 5 Reglas de Oro).',
      'Norma OSHA 29 CFR 1910.147 (Control de Energía Peligrosa - Lockout/Tagout).'
    ]
  },
  {
    nombre: 'Permiso de Trabajo en Altura',
    ruta: '/working-at-height/new',
    motivo: 'Autorizar tareas a más de 2,00 metros de altura (andamios, escaleras, plataformas elevadoras, techos, estructuras) verificando arnés, cabo de vida y puntos de anclaje.',
    comoUsarlo: 'Ingresá a /working-at-height/new, completá el checklist de inspección de arnés de cuerpo completo, doble cola de amarre con amortiguador, línea de vida / punto de anclaje (22 kN), estado del andamio o hidroelevador y firmas.',
    keywords: ['altura', 'trabajo en altura', 'andamio', 'andamios', 'arnes', 'arnés', 'techo', 'cubierta', 'hidroelevador', 'escalera', 'silleta', 'caida a distinto nivel', 'linea de vida'],
    pasosGuia: [
      'Verificar que el trabajador cuente con Aptitud Médica específica para Trabajo en Altura vigente (sin vértigo ni patologías cardíacas/neurológicas) en el módulo "Aptitudes Médicas" (/medical).',
      'Inspeccionar el arnés anticaídas de cuerpo completo (cintas sin cortes ni quemaduras, hebillas, argolla dorsal D) y el doble cabo de vida con amortiguador de impacto o salvacaídas retráctil.',
      'Comprobar que el punto de anclaje estructural resista al menos 22 kN (2.200 kg) por operario y esté ubicado por encima del nivel de los hombros (factor de caída < 1).',
      'Si se usan andamios, verificar base firme, tablones trabados cubriendo el 100% del ancho, baranda superior a 1,00 m, intermedia a 0,50 m y rodapié de 15 cm.',
      'Emitir el "Permiso de Trabajo en Altura" (/working-at-height/new) y acompañarlo con el "Análisis de Trabajo Seguro (ATS)" (/ats).'
    ],
    riesgosTipicos: [
      'Caída libre a distinto nivel (> 2,00 m) con riesgo de politraumatismos graves o fatalidad.',
      'Síndrome del arnés (trauma por suspensión inerte) si el rescate demora más de 15 minutos tras una caída.',
      'Desplome o vuelco de andamios por falta de arriostramiento, nivelación o sobrecarga.',
      'Caída de herramientas o materiales desde altura sobre personas en niveles inferiores.'
    ],
    eppTipico: [
      'Arnés de seguridad de cuerpo completo certificado (IRAM 3622-1 / EN 361) con argolla dorsal y frontal.',
      'Doble cabo de amarre en "Y" con amortiguador de impacto (IRAM 3622-1) o dispositivo retráctil (EN 360).',
      'Casco de seguridad con barbijo de 3 o 4 puntos de anclaje (evita desprendimiento en caída).',
      'Calzado de seguridad antideslizante, guantes de agarre (grip) y portaherramientas con cinta de retención.'
    ],
    recomendacionesTipicas: [
      'Mantener el 100% del tiempo al menos un mosquetón conectado (técnica de doble cabo al desplazarse).',
      'Calcular el espacio libre de caída (tirante de aire) antes de usar amortiguador de impacto (mínimo 5,50 m libres; si es menor, usar retráctil).',
      'Suspender inmediatamente las tareas en altura en exterior si la velocidad del viento supera los 40-45 km/h o hay tormenta eléctrica.'
    ],
    normativaTipica: [
      'Decreto 911/96 Art. 52 a 57 y 221 a 245 (Trabajos en Altura, Andamios y Silletas en Construcción).',
      'Decreto 351/79 Anexo I Art. 200 (Protección contra caídas a distinto nivel).',
      'Resolución SRT 61/23 (Medidas de seguridad en altura) y Norma IRAM 3622 (Sistemas anticaídas).'
    ]
  },
  {
    nombre: 'Permiso de Trabajo en Caliente (Soldadura / Amolado / Oxicorte)',
    ruta: '/hot-work/new',
    motivo: 'Controlar riesgos de incendio y explosión en tareas de soldadura, corte con oxicorte, amoladora angular o uso de llama abierta.',
    comoUsarlo: 'En /hot-work/new verificá el radio libre de combustibles de 11 metros (regla de los 35 pies NFPA 51B), biombos ignífugos, válvula arrestallamas, extintor al pie de obra, guardia de cenizas post-tarea y firmá el permiso.',
    keywords: ['caliente', 'trabajo en caliente', 'trabajos en caliente', 'soldadura', 'soldar', 'amoladora', 'oxicorte', 'chispas', 'llama abierta', 'corte y soldadura'],
    pasosGuia: [
      'Retirar todo material combustible o inflamable en un radio mínimo de 11 metros (o cubrirlo herméticamente con mantas ignífugas y sellar aberturas/rejillas del piso).',
      'Instalar biombos o pantallas incombustibles para contener la proyección de chispas y proteger a terceros de la radiación UV/IR.',
      'Colocar un extintor Triclase ABC de 10 kg (o CO2) exclusivo al pie del puesto de trabajo y designar un Vigía de Incendio.',
      'En oxicorte, verificar válvulas antirretorno de llama (arrestallamas) tanto en salida de reguladores como en entrada del soplete, y cilindros verticales encadenados al carro.',
      'Emitir el "Permiso de Trabajo en Caliente" (/hot-work/new) junto con el "ATS" (/ats), y realizar guardia de cenizas durante 60 minutos tras finalizar.'
    ],
    riesgosTipicos: [
      'Incendio o explosión por contacto de chispas/escoria incandescente con materiales combustibles o vapores inflamables.',
      'Quemaduras térmicas por contacto con piezas calientes, proyecciones metálicas y radiación ultravioleta/infrarroja (fotoqueratitis).',
      'Inhalación de humos metálicos de soldadura y gases tóxicos en ambientes poco ventilados.',
      'Rotura y proyección de disco abrasivo en amoladoras angulares.'
    ],
    eppTipico: [
      'Careta de soldador fotosensible o con cristal inactínico DIN 10-13 / Protector facial policarbonato para amolado.',
      'Campera, delantal, polainas y mangas de cuero descarne ignífugo.',
      'Guantes largos de cuero descarne para soldador (kevlar) y botines con cubrecordones.',
      'Semimáscara con filtros P2/P3 para humos metálicos de soldadura y protección auditiva.'
    ],
    recomendacionesTipicas: [
      'En amoladoras angulares: verificar que las RPM del disco sean superiores a las RPM de la máquina, conservar siempre la guarda metálica original y jamás usar discos de corte para desbastar.',
      'Conectar la pinza de masa de la soldadora directamente sobre la pieza a soldar lo más cerca posible del arco.',
      'Realizar inspección de guardia de cenizas a los 30 y 60 minutos posteriores a la terminación del trabajo.'
    ],
    normativaTipica: [
      'Decreto 351/79 Cap. 17 (Soldadura y Corte) y Cap. 18 (Protección contra Incendios).',
      'Decreto 911/96 Art. 196 a 203 (Trabajos de Soldadura y Corte en Obra).',
      'Norma NFPA 51B (Prevención de Incendios durante Soldadura, Corte y Otros Trabajos en Caliente).'
    ]
  },
  {
    nombre: 'Permiso de Ingreso a Espacios Confinados',
    ruta: '/confined-space/new',
    motivo: 'Autorizar el ingreso a tanques, cisternas, silos, cámaras subterráneas, pozos o conductos con monitoreo atmosférico (O2, LEL, CO, H2S) y vigía externo.',
    comoUsarlo: 'Ingresá a /confined-space/new, registrá las mediciones de gases (% Oxígeno entre 19.5% y 23.5%, LEL < 10%, CO y H2S), ventilación forzada, trípode de rescate, arnés y firma del vigía permanente.',
    keywords: ['confinado', 'espacio confinado', 'espacios confinados', 'tanque', 'cisterna', 'silo', 'camara', 'cámara', 'pozo', 'cloaca', 'atmosfera', 'gases'],
    pasosGuia: [
      'Aislar y bloquear mediante candado LOTO (/loto/new) todas las válvulas, cañerías de entrada de fluidos/vapor y agitadores mecánicos del recinto.',
      'Purgar y ventilar mecánicamente el espacio confinado antes de medir.',
      'Medir la atmósfera desde el exterior con detector multigás calibrado en 3 niveles (superior, medio e inferior): Oxígeno entre 19,5% y 23,5%, LEL 0% (< 10%), CO < 25 ppm y H2S < 10 ppm.',
      'Instalar trípode de rescate con malacate en la boca de hombre, conectar al ingresante con arnés de cuerpo completo y línea de vida, y posicionar al Vigía Permanente en el exterior.',
      'Emitir el permiso oficial en el módulo "Espacios Confinados" (/confined-space/new).'
    ],
    riesgosTipicos: [
      'Asfixia por deficiencia de oxígeno (< 19,5%) por desplazamiento de gases o oxidación interna.',
      'Intoxicación aguda por sulfuro de hidrógeno (H2S), monóxido de carbono (CO) o vapores orgánicos.',
      'Explosión o deflagración por atmósfera inflamable (LEL > 10%).',
      'Atrapamiento o sepultamiento por sólidos granulares en silos o ingreso accidental de fluidos.'
    ],
    eppTipico: [
      'Detector multigás portátil de 4 gases (O2, LEL, CO, H2S) encendido de forma continua en la zona respiratoria del operario.',
      'Arnés de cuerpo completo con argolla dorsal/esternal vinculado a trípode de rescate y malacate.',
      'Equipo de respiración autónoma (ERA) o línea de aire asistido si la atmósfera no es respirable.',
      'Iluminación portátil antiexplosiva (Ex) de muy baja tensión de seguridad (12V / 24V).'
    ],
    recomendacionesTipicas: [
      'El Vigía Externo jamás debe ingresar al recinto sin relevo ni equipo de respiración autónoma; el rescate debe ejecutarse desde el exterior mediante el trípode y malacate.',
      'Mantener ventilación mecánica forzada continua durante toda la permanencia del personal.'
    ],
    normativaTipica: [
      'Resolución SRT 953/10 (Criterios de Seguridad en Espacios Confinados) y Norma IRAM 3625.',
      'Decreto 351/79 Cap. 9 y Anexo III (Contaminación Ambiental) / OSHA 29 CFR 1910.146.'
    ]
  },
  {
    nombre: 'Seguridad en Excavaciones y Zanjeo',
    ruta: '/excavations/new',
    motivo: 'Evaluar la estabilidad del suelo, entibamiento/tablestacado, detección de interferencias subterráneas (gas, electricidad, fibra) y accesos seguros en zanjas.',
    comoUsarlo: 'En /excavations/new clasificá el tipo de suelo, profundidad de excavación, distancia de acopio de tierra (> 1,00 m del borde), escaleras de escape cada 7,5 m y vallado perimetral.',
    keywords: ['excavacion', 'excavación', 'excavaciones', 'zanja', 'zanjeo', 'movimiento de suelo', 'entibado', 'derrumbe', 'submuracion'],
    pasosGuia: [
      'Solicitar planos de interferencias subterráneas (cables de MT/BT, caños de gas, agua, fibra óptica) y realizar cateos manuales previos antes de meter retroexcavadora.',
      'En excavaciones de más de 1,20 m de profundidad, instalar entibamiento, tablestacado o talud acorde al tipo de suelo.',
      'Colocar escaleras de acceso y salida aseguradas que sobresalgan 1 m del borde a no más de 7,5 m de recorrido horizontal.',
      'Acopiar la tierra extraída y materiales a una distancia mínima de 1,00 m a 1,50 m del borde de la zanja para evitar sobrecarga.',
      'Registrar la inspección diaria y firmas en el módulo "Seguridad en Excavaciones" (/excavations/new).'
    ],
    riesgosTipicos: [
      'Derrumbe o desmoronamiento de las paredes de la zanja con riesgo de sepultamiento y asfixia.',
      'Electrocución o explosión por rotura accidental de cables eléctricos subterráneos o cañerías de gas.',
      'Caída de personas o vehículos al interior de la excavación por falta de vallado y topes.',
      'Anegamiento por filtración de napa freática o lluvias.'
    ],
    eppTipico: [
      'Casco de seguridad, calzado de seguridad con puntera y plantilla antiperforación (o botas de goma con puntera).',
      'Chaleco reflectivo de alta visibilidad para trabajar cerca de maquinaria vial.',
      'Guantes de descarne y anteojos de seguridad.'
    ],
    recomendacionesTipicas: [
      'Reinspeccionar obligatoriamente las paredes y el entibado después de cualquier lluvia o vibración intensa.',
      'Mantener al personal fuera del radio de giro del brazo de la retroexcavadora.'
    ],
    normativaTipica: [
      'Decreto 911/96 Art. 141 a 176 (Trabajos de Demolición, Excavaciones y Submuraciones).'
    ]
  },
  {
    nombre: 'Programa de Seguridad en Obra (Res. SRT 51/97, 35/98, 319/99)',
    ruta: '/construction-safety-program/new',
    motivo: 'Confeccionar el Programa Único o específico de Seguridad para obras de construcción para presentar ante la ART y el comitente.',
    comoUsarlo: 'Abrí /construction-safety-program/new, cargá los datos de la empresa constructora, comitente, C.U.I.T., ubicación de obra, nómina de personal, cronograma de etapas constructivas y medidas de prevención por etapa.',
    keywords: ['programa de seguridad', 'obra', 'construccion', 'construcción', '51/97', '35/98', '319/99', '911/96', 'aviso de obra', 'legajo de obra'],
    pasosGuia: [
      'Relevar los datos legales del Comitente y Contratista (Razón Social, CUIT, N° de Contrato ART), dirección exacta de la obra y fechas de inicio y finalización.',
      'Confeccionar la memoria descriptiva de la obra, el cronograma de etapas constructivas (demolición, excavación, estructura, albañilería, instalaciones, terminaciones) y la nómina de personal con CUIL.',
      'Generar el documento completo en el módulo "Programa de Seguridad en Obra" (/construction-safety-program/new) con firmas del Empleador y del Profesional H&S para presentar a la ART al menos 5 días hábiles antes del inicio (junto al Aviso de Obra).',
      'Armar la carpeta de obra con el "Legajo Técnico" (/legajos), los "ATS" (/ats), la "Entrega de EPP" (/ppe-tracker) y las "Capacitaciones" (/training-management).'
    ],
    riesgosTipicos: [
      'Caídas de altura desde losas, bordes de forjado, andamios y aberturas sin barandas ni redes.',
      'Riesgo eléctrico provisorio de obra (tableros sin disyuntor diferencial de 30 mA ni puesta a tierra).',
      'Golpes por caída de objetos, uso de hormigoneras, guinches y herramientas de corte.',
      'Derrumbes en excavaciones o submuraciones.'
    ],
    eppTipico: [
      'Casco de seguridad, botines con puntera de acero, guantes según tarea, lentes de seguridad, protector auditivo y arnés anticaídas.'
    ],
    recomendacionesTipicas: [
      'Instalar el tablero eléctrico provisorio de obra estanco (IP65) con llave térmica, disyuntor diferencial de 30 mA y jabalina de puesta a tierra medida (/grounding/new).',
      'Garantizar baños químicos / vestuarios y agua potable apta para consumo desde el día 1 de obra.'
    ],
    normativaTipica: [
      'Decreto 911/96 (Reglamento de Higiene y Seguridad para la Industria de la Construcción).',
      'Resoluciones SRT 51/97, 35/98 (Contratista Principal), 319/99 (Obras repetitivas y de corta duración) y 231/96.'
    ]
  },
  {
    nombre: 'Carga de Fuego y Potencial Extintor (Dec. 351/79 Anexo VII)',
    ruta: '/fire-load',
    motivo: 'Calcular la carga de fuego equivalente en madera (kg/m²), resistencia al fuego exigida (F30, F60, F90) y dotación mínima de matafuegos.',
    comoUsarlo: 'En /fire-load ingresá el sector de incendio, la superficie (m²), el tipo de riesgo (R1 a R7) y los materiales combustibles presentes con sus pesos en kg para obtener automáticamente los Mcal, los kg/m² de madera equivalente y el potencial extintor requerido (Clase A y B).',
    keywords: ['carga de fuego', 'estudio de carga de fuego', 'potencial extintor', 'incendio', 'anexo vii', 'poder calorifico', 'resistencia al fuego'],
    pasosGuia: [
      'Delimitar los sectores de incendio del establecimiento y medir su superficie en m².',
      'Relevar todos los materiales combustibles permanentes y transitorios (madera, papel/cartón, plásticos, textiles, líquidos inflamables) y estimar su masa en kg.',
      'Cargar los datos en el módulo "Carga de Fuego" (/fire-load) para obtener la densidad de carga de fuego ($q_f$ en kg/m² de madera equivalente de 4.400 kcal/kg), la resistencia al fuego constructiva (F) y el Potencial Extintor mínimo (ej. 1A, 4B).',
      'Auditar los matafuegos instalados en el módulo "Gestión de Extintores" (/extintores) para verificar que cubran el potencial calculado y la superficie (mínimo 1 cada 200 m²).'
    ],
    riesgosTipicos: [
      'Propagación rápida del incendio por exceso de carga combustible o falta de sectorización cortafuego.',
      'Potencial extintor insuficiente o agentes extintores inadecuados para la clase de fuego presente (A, B, C, K).'
    ],
    eppTipico: [
      'Extintores portátiles certificados IRAM con sello DPS/OPDS vigentes.',
      'Detectores autónomos o centralizados de humo/temperatura y pulsadores manuales de alarma.'
    ],
    recomendacionesTipicas: [
      'Distribuir los extintores de modo que no sea necesario recorrer más de 20 metros para alcanzar un matafuego Clase A ni más de 15 metros para Clase B.',
      'Instalar un extintor de Dióxido de Carbono (CO2) o agente limpio HCFC-123 próximo a los tableros eléctricos principales.'
    ],
    normativaTipica: [
      'Decreto 351/79 Capítulo 18 y Anexo VII (Protección contra Incendios y Cálculo de Carga de Fuego).',
      'Norma IRAM 3517-2 (Dotación, control, mantenimiento y recarga de extintores).'
    ]
  },
  {
    nombre: 'Gestión e Inspección de Extintores (IRAM 3517)',
    ruta: '/extintores',
    motivo: 'Llevar el padrón de matafuegos, controlar vencimientos de carga anual y prueba hidráulica (PH), manómetro, precinto, señalización y accesibilidad.',
    comoUsarlo: 'En /extintores registrá cada unidad (N° de chapa, tipo ABC/CO2/HCFC, capacidad, ubicación y vencimiento) o usá el Escáner con IA (/extinguisher-ai) para auditar el estado físico.',
    keywords: ['extintor', 'extintores', 'matafuego', 'matafuegos', 'iram 3517', 'recarga', 'prueba hidraulica'],
    pasosGuia: [
      'Relevar cada extintor del establecimiento: número de serie/chapa, agente extintor, capacidad (kg), ubicación, fecha de vencimiento de carga anual y fecha de vencimiento de Prueba Hidráulica (cada 5 años).',
      'Inspeccionar mensualmente que la aguja del manómetro esté en zona verde, con precinto y pasador intactos, manguera sin fisuras, chapa baliza y soporte entre 1,20 m y 1,50 m del suelo.',
      'Cargar el padrón y emitir la planilla de control en el módulo "Gestión de Extintores" (/extintores).'
    ],
    riesgosTipicos: [
      'Falla de disparo del extintor ante un principio de incendio por despresurización o apelmazamiento del polvo químico.',
      'Demora en el ataque inicial al fuego por extintores obstruidos por mercadería o sin señalización.'
    ],
    eppTipico: [
      'Matafuegos certificados bajo normas IRAM con tarjeta de control oficial y chapa baliza reglamentaria.'
    ],
    recomendacionesTipicas: [
      'Demarcar en el piso un recuadro amarillo/rojo libre de obstáculos debajo de cada matafuego.',
      'Reponer con unidades sustitutas equivalentes mientras los equipos propios son enviados al taller de recarga anual.'
    ],
    normativaTipica: [
      'Decreto 351/79 Cap. 18 Art. 176 y Anexo VII.',
      'Norma IRAM 3517 Parte 2 (Control, mantenimiento y recarga de extintores).'
    ]
  },
  {
    nombre: 'Matriz de Riesgos IPER (Identificación de Peligros y Evaluación de Riesgos)',
    ruta: '/risk-matrix',
    motivo: 'Evaluar puestos de trabajo cruzando Probabilidad x Severidad para clasificar el nivel de riesgo (Trivial, Tolerable, Moderado, Importante, Intolerable) y definir controles.',
    comoUsarlo: 'Entrá a /risk-matrix, definí el sector/puesto, agregá los peligros detectados, asigná probabilidad y severidad, y documentá los controles de ingeniería, administrativos y EPP.',
    keywords: ['matriz de riesgo', 'matriz de riesgos', 'iper', 'iperc', 'evaluacion de riesgo', 'evaluación de riesgos', 'probabilidad', 'severidad', 'puesto de trabajo'],
    pasosGuia: [
      'Listar todos los puestos de trabajo y sus actividades rutinarias, no rutinarias y de mantenimiento.',
      'Identificar los peligros por categoría (mecánicos, eléctricos, físicos, químicos, biológicos, ergonómicos, locativos).',
      'Ingresar al módulo "Matriz de Riesgos IPER" (/risk-matrix), valorar Probabilidad x Consecuencia y establecer controles siguiendo la Jerarquía de Control (Eliminación, Sustitución, Controles de Ingeniería, Controles Administrativos y EPP).'
    ],
    riesgosTipicos: [
      'Peligros no identificados en tareas esporádicas o de mantenimiento.',
      'Dependencia exclusiva de los EPP sin aplicar antes barreras de ingeniería o protecciones colectivas.'
    ],
    eppTipico: [
      'EPP definido específicamente por puesto según el resultado de la Matriz IPER y registrado en /ppe-tracker.'
    ],
    recomendacionesTipicas: [
      'Actualizar la Matriz IPER anualmente, cada vez que se incorpore una nueva máquina/sustancia o tras ocurrir un incidente.'
    ],
    normativaTipica: [
      'Ley 19.587, Decreto 351/79 y Norma ISO 45001 (Sistemas de Gestión de la Seguridad y Salud en el Trabajo).'
    ]
  },
  {
    nombre: 'Protocolo de Puesta a Tierra y Continuidad (Res. SRT 900/15)',
    ruta: '/grounding/new',
    motivo: 'Confeccionar el protocolo oficial SRT 900/15 de medición de resistencia de puesta a tierra (PAT) y verificación de interruptores diferenciales (disyuntores).',
    comoUsarlo: 'En /grounding/new cargá los datos del telurímetro (marca, modelo, N° de serie y certificado de calibración vigente), esquema de conexión a tierra (TT/TN-S), valores medidos en Ohms (Ω) por jabalina/tablero, continuidad de masas y tiempos de disparo de disyuntores.',
    keywords: ['puesta a tierra', 'pat', '900/15', 'srt 900', 'disyuntor', 'diferencial', 'telurimetro', 'continuidad de las masas', 'protocolo electrico'],
    pasosGuia: [
      'Medir con telurímetro/multifunción calibrado (certificado < 1 año) la resistencia de cada toma de tierra (jabalina) y verificar que sea acorde a la sensibilidad del diferencial (idealmente ≤ 10 Ω o ≤ 40 Ω con diferencial de 30 mA según AEA 90364).',
      'Verificar la continuidad eléctrica del conductor de protección (PE verde-amarillo) en todas las masas metálicas y tomacorrientes.',
      'Realizar el ensayo de disparo de cada interruptor diferencial (disyuntor) en tiempo (ms) y corriente de fuga (mA), además del botón de prueba "T".',
      'Cargar todos los valores y firmar el protocolo oficial en el módulo "Protocolo de Puesta a Tierra SRT 900/15" (/grounding/new) con validez anual (12 meses).'
    ],
    riesgosTipicos: [
      'Electrocución por contacto indirecto con carcasas metálicas energizadas accidentalmente sin descarga a tierra ni corte diferencial.',
      'Incendio de origen eléctrico por fallas de aislación a tierra no despejadas.'
    ],
    eppTipico: [
      'Guantes dieléctricos Clase 00 (500V), calzado dieléctrico, anteojos de seguridad e instrumental categoría CAT III / CAT IV.'
    ],
    recomendacionesTipicas: [
      'Adjuntar siempre copia del certificado de calibración del instrumento emitido por laboratorio acreditado (INTI / SAC) al protocolo impreso.'
    ],
    normativaTipica: [
      'Resolución SRT 900/15 (Protocolo para la Medición del Valor de Puesta a Tierra y la Verificación de la Continuidad de las Masas).',
      'Decreto 351/79 Anexo VI y Reglamentación AEA 90364.'
    ]
  },
  {
    nombre: 'Protocolo de Iluminación Laboral (Res. SRT 84/12)',
    ruta: '/lighting',
    motivo: 'Elaborar el protocolo oficial SRT 84/12 de medición de iluminación (lux) por puesto/sector y verificar uniformidad según el Anexo IV del Dec. 351/79.',
    comoUsarlo: 'En /lighting ingresá los datos del luxómetro calibrado, las dimensiones del local (para el método de la cuadrícula) o los puestos específicos, los valores medidos en lux y el tipo de tarea visual para verificar automáticamente el cumplimiento de iluminancia media y uniformidad.',
    keywords: ['iluminacion', 'iluminación', 'lux', 'luxometro', '84/12', 'srt 84', 'protocolo de iluminacion'],
    pasosGuia: [
      'Calcular el Índice del Local ($K = (a \\cdot b) / [h_m \\cdot (a + b)]$) para determinar el número mínimo de puntos de la cuadrícula de medición ($N = (K + 2)^2$).',
      'Medir con luxómetro calibrado a la altura del plano de trabajo (0,80 m del suelo), tanto la iluminación general como la localizada en puestos operativos.',
      'Ingresar los puntos en el módulo "Protocolo de Iluminación SRT 84/12" (/lighting) para que el sistema verifique si la Iluminancia Media ($E_m$) alcanza el mínimo legal del Anexo IV y si se cumple la relación de uniformidad ($E_{min} \\ge E_m / 2$).'
    ],
    riesgosTipicos: [
      'Fatiga visual, cefaleas y aumento de accidentes mecánicos por niveles insuficientes de iluminación o deslumbramiento.',
      'Efecto estroboscópico en máquinas rotativas o contrastes bruscos entre sectores.'
    ],
    eppTipico: [
      'Luxómetro con fotocélula corregida al coseno y certificado de calibración vigente.'
    ],
    recomendacionesTipicas: [
      'Limpiar periódicamente las luminarias y reemplazar artefactos agotados para mantener la uniformidad lumínica.',
      'Renovar el protocolo anualmente (validez legal: 12 meses).'
    ],
    normativaTipica: [
      'Resolución SRT 84/12 (Protocolo para la Medición de la Iluminación en el Ambiente Laboral).',
      'Decreto 351/79 Capítulo 12 y Anexo IV.'
    ]
  },
  {
    nombre: 'Protocolo de Nivel Sonoro / Ruido (Res. SRT 85/12)',
    ruta: '/noise-assessment/new',
    motivo: 'Registrar mediciones de nivel sonoro continuo equivalente (NSCE dBA) y dosis de ruido diaria según Res. SRT 85/12 (límite 85 dBA para 8 hs).',
    comoUsarlo: 'En /noise-assessment/new cargá el decibelímetro integrador o dosímetro utilizado, los puestos medidos, el tiempo de exposición diario y los dBA obtenidos.',
    keywords: ['ruido', 'nivel sonoro', '85/12', 'srt 85', 'decibeles', 'dba', 'sonometro', 'dosimetria', 'proteccion auditiva'],
    pasosGuia: [
      'Verificación de calibración acústica en campo antes y después de la jornada y colocación del micrófono a 10 cm del oído más expuesto del trabajador.',
      'Medir el Nivel Sonoro Continuo Equivalente ponderado A ($L_{Aeq,T}$) durante un período representativo del ciclo de trabajo.',
      'Cargar los resultados en el módulo "Protocolo de Ruido SRT 85/12" (/noise-assessment/new). Si supera los 80 dBA (nivel de acción) u 85 dBA (límite máximo para 8 hs), indicar protección auditiva e incluir al personal en el RAR (/rar/new).'
    ],
    riesgosTipicos: [
      'Hipoacusia neurosensorial inducida por ruido (irreversible) por exposición crónica > 85 dBA.',
      'Interferencia en la comunicación verbal y en la percepción de alarmas acústicas.'
    ],
    eppTipico: [
      'Protectores auditivos de copa o endoaurales certificados (IRAM 4060) con atenuación SNR/NRR calculada para dejar el nivel efectivo en oído por debajo de 80 dBA.'
    ],
    recomendacionesTipicas: [
      'Priorizar controles de ingeniería en la fuente (encapsulado acústico, silenciadores en escapes neumáticos, tacos antivibratorios).'
    ],
    normativaTipica: [
      'Resolución SRT 85/12 (Protocolo para la Medición del Nivel de Ruido en el Ambiente Laboral).',
      'Decreto 351/79 Anexo V y Resolución MTESS 295/03 (Límite 85 dBA para 8 horas).'
    ]
  },
  {
    nombre: 'Estudio de Ergonomía Integrado (Res. SRT 886/15)',
    ruta: '/ergonomics-form',
    motivo: 'Desarrollar las Planillas 1, 2, 3 y 4 de la Res. SRT 886/15 para levantamiento manual de cargas, empuje/tracción, movimientos repetitivos y bipedestación.',
    comoUsarlo: 'Abrí /ergonomics-form, identificá los factores de riesgo biomecánicos del puesto (Planilla 1), evaluá el nivel de riesgo inicial y avanzado (Planilla 2) y definí las mejoras de ingeniería y administrativas (Planilla 3).',
    keywords: ['ergonomia', 'ergonomía', '886/15', 'srt 886', 'levantamiento de carga', 'movimientos repetitivos', 'postura', 'trastornos musculoesqueleticos'],
    pasosGuia: [
      'Observar y cronometrar el puesto de trabajo identificando si existen los 9 factores de riesgo de la Planilla 1 (levantamiento/descenso, empuje/arrastre, transporte, bipedestación, movimientos repetitivos, posturas forzadas, vibraciones, confort térmico, estrés de contacto).',
      'Completar la evaluación inicial en la Planilla 2 dentro del módulo "Ergonomía Res. SRT 886/15" (/ergonomics-form).',
      'Definir la matriz de medidas preventivas y correctivas en la Planilla 3 con plazos de ejecución.'
    ],
    riesgosTipicos: [
      'Lumbalgias, hernias discales y trastornos musculoesqueléticos de miembro superior (túnel carpiano, tendinitis, epicondilitis).'
    ],
    eppTipico: [
      'Ayudas mecánicas (zorras hidráulicas, aparejos, mesas elevadoras, carros ergonómicos) y asientos de descanso para puestos de pie.'
    ],
    recomendacionesTipicas: [
      'Evitar el levantamiento manual individual de cargas superiores a 25 kg (o límites menores según tabla de frecuencia y altura de agarre de Res. 295/03).',
      'Implementar rotación de puestos y pausas activas.'
    ],
    normativaTipica: [
      'Resolución SRT 886/15 (Protocolo de Ergonomía) y Resolución MTESS 295/03 Anexo I.'
    ]
  },
  {
    nombre: 'Evaluación de Estrés Térmico y Carga Térmica (TGBH)',
    ruta: '/thermal-stress',
    motivo: 'Calcular el índice TGBH (Temperatura Globo Bulbo Húmedo) según Dec. 351/79 Anexo III y determinar regímenes de trabajo-descanso e hidratación.',
    comoUsarlo: 'En /thermal-stress ingresá temperatura de bulbo húmedo natural (TBH), bulbo seco (TBS) y globo (TG), indicá si hay exposición solar y seleccioná la carga metabólica.',
    keywords: ['estres termico', 'estrés térmico', 'carga termica', 'calor', 'tgbh', 'temperatura', 'horno', 'frio'],
    pasosGuia: [
      'Medir TBH, TBS y TG en el puesto operativo a la altura del abdomen del trabajador.',
      'Ingresar los datos en "/thermal-stress" para obtener el índice TGBH y el régimen reglamentario de trabajo/descanso por cada hora (75%/25%, 50%/50%, 25%/75%).'
    ],
    riesgosTipicos: [
      'Deshidratación, agotamiento por calor, calambres térmicos y golpe de calor.'
    ],
    eppTipico: [
      'Ropa de trabajo liviana y transpirable (o delantales aluminizados frente a fuentes radiantes como hornos) y provisión permanente de agua fresca.'
    ],
    recomendacionesTipicas: [
      'Aclimatar progresivamente al personal nuevo y garantizar hidratación fraccionada cada 20 minutos.'
    ],
    normativaTipica: [
      'Decreto 351/79 Capítulo 8 y Anexo II (Carga Térmica) y Resolución MTESS 295/03.'
    ]
  },
  {
    nombre: 'Control y Entrega de EPP (Res. SRT 299/11)',
    ruta: '/ppe-tracker',
    motivo: 'Registrar la entrega nominal de Elementos de Protección Personal con marca, modelo, certificación (Sello S / IRAM) y firma de recepción del trabajador.',
    comoUsarlo: 'Ingresá a /ppe-tracker, seleccioná al trabajador, cargá cada EPP entregado (casco, botines, guantes, lentes, arnés), indicá si posee certificación y firmá la planilla oficial.',
    keywords: ['epp', 'entrega de epp', '299/11', 'srt 299', 'casco', 'botines', 'guantes', 'proteccion personal', 'planilla de epp'],
    pasosGuia: [
      'Identificar los EPP requeridos por puesto de trabajo y verificar que posean certificación reconocida (IRAM / UL / Sello S).',
      'Cargar en "/ppe-tracker" los datos del trabajador, producto, marca, modelo, número de certificación, cantidad, fecha de entrega y firma de conformidad.'
    ],
    riesgosTipicos: [
      'Exposición directa del trabajador a agentes agresivos por falta de provisión, vencimiento o uso incorrecto del EPP.',
      'Contingencia legal y sanciones de ART/Ministerio por no contar con la planilla Res. 299/11 firmada por el empleado.'
    ],
    eppTipico: [
      'Casco, calzado de seguridad, protección ocular, auditiva, respiratoria, guantes y arnés certificados.'
    ],
    recomendacionesTipicas: [
      'Capacitar al trabajador en el uso, conservación y recambio del EPP al momento de la entrega y registrar el curso en /training-management.'
    ],
    normativaTipica: [
      'Resolución SRT 299/11 (Formulario obligatorio de Registro de Entrega de Ropa de Trabajo y EPP) y Dec. 351/79 Cap. 19.'
    ]
  },
  {
    nombre: 'Aptitudes Médicas Laborales (Res. SRT 37/10)',
    ruta: '/medical',
    motivo: 'Gestionar certificados de aptitud médica preocupacionales, periódicos y de tareas de riesgo especial (altura, espacios confinados, autoelevadores, tensión eléctrica).',
    comoUsarlo: 'En /medical creá el certificado del trabajador indicando el dictamen médico (Apto, Apto con preexistencias, No Apto), las habilitaciones psicofísicas especiales y las firmas digitalizadas del médico, profesional H&S y trabajador.',
    keywords: ['aptitud medica', 'aptitudes medicas', 'examen medico', 'preocupacional', 'periodico', '37/10', 'salud ocupacional', 'psicotecnico'],
    pasosGuia: [
      'Realizar el examen preocupacional o periódico obligatorio y, si el operario realizará tareas críticas, incluir los estudios específicos (ECG, electroencefalograma, espirometría, agudeza visual, audiometría, psicotécnico).',
      'Registrar y emitir la constancia firmada en una sola hoja A4 en el módulo "Aptitudes Médicas" (/medical).'
    ],
    riesgosTipicos: [
      'Descompensación aguda en altura, espacios confinados o conducción de maquinaria por patologías no detectadas.'
    ],
    eppTipico: [
      'Adaptación de EPP y puesto de trabajo según eventuales restricciones o preexistencias médicas.'
    ],
    recomendacionesTipicas: [
      'No autorizar permisos de trabajo en altura, espacios confinados, tensión eléctrica ni autoelevadores sin verificar antes el Apto Médico vigente en /medical.'
    ],
    normativaTipica: [
      'Resolución SRT 37/10 (Exámenes Médicos en Salud) y Ley 24.557 de Riesgos del Trabajo.'
    ]
  },
  {
    nombre: 'Gestión de Capacitaciones y Asistencias',
    ruta: '/training-management',
    motivo: 'Registrar el Plan Anual de Capacitación y las actas de capacitación dictadas al personal con temario, duración, evaluaciones y firmas.',
    comoUsarlo: 'En /training-management creá una nueva capacitación, cargá el tema, instructor, contenido, nómina de asistentes (incluso escaneando planillas físicas con IA) y emití el certificado/acta.',
    keywords: ['capacitacion', 'capacitación', 'capacitaciones', 'curso', 'induccion', 'inducción', 'entrenamiento', 'acta de capacitacion'],
    pasosGuia: [
      'Elaborar el cronograma anual de capacitación abarcando riesgos específicos, uso de EPP, prevención de incendios y evacuación, ergonomía y primeros auxilios.',
      'Dictar la capacitación y registrar la asistencia firmada en "/training-management".'
    ],
    riesgosTipicos: [
      'Ocurrencia de accidentes por desconocimiento de los procedimientos operativos seguros y de actuación ante emergencias.'
    ],
    eppTipico: [
      'Muestras físicas de los EPP del sector para demostración práctica de colocación y ajuste durante el curso.'
    ],
    recomendacionesTipicas: [
      'Todo trabajador ingresante debe recibir su Inducción de Higiene y Seguridad antes de incorporarse al puesto operativo.'
    ],
    normativaTipica: [
      'Decreto 351/79 Capítulo 21 (Capacitación - Art. 208 a 214) y Decreto 911/96 Art. 10 y 11.'
    ]
  },
  {
    nombre: 'Charlas Operativas de 5 Minutos (Toolbox Talk)',
    ruta: '/toolbox-talk',
    motivo: 'Documentar charlas diarias pre-tarea en obra o planta sobre un riesgo puntual del día con firma de la cuadrilla.',
    comoUsarlo: 'Abrí /toolbox-talk, elegí el tema del día, registrá los puntos conversados y tomá la asistencia rápida de los operarios.',
    keywords: ['charla de 5 minutos', 'charla', 'toolbox', 'charla diaria', 'pre tarea'],
    pasosGuia: [
      'Reunir a la cuadrilla 5 minutos al inicio de la jornada para repasar el foco preventivo del día.',
      'Emitir el registro firmado en "/toolbox-talk".'
    ],
    riesgosTipicos: [
      'Exceso de confianza y omisión de controles básicos en tareas rutinarias.'
    ],
    eppTipico: [
      'Revisión visual rápida del estado de casco, botines, lentes y guantes de toda la cuadrilla durante la charla.'
    ],
    recomendacionesTipicas: [
      'Vincular el tema de la charla de 5 minutos con la tarea principal del ATS del día (/ats).'
    ],
    normativaTipica: [
      'Ley 19.587 Art. 9 inc. k (Promover la capacitación del personal en materia de higiene y seguridad).'
    ]
  },
  {
    nombre: 'Relevamiento General de Riesgos Laborales (RGRL - Res. SRT 463/09)',
    ruta: '/rgrl/new',
    motivo: 'Completar la declaración jurada oficial sobre el estado de cumplimiento de las condiciones de higiene y seguridad del establecimiento para la ART.',
    comoUsarlo: 'En /rgrl/new respondé el cuestionario normativo aplicable (Sí / No / No Aplica) y establecé las fechas de regularización para el Plan de Acción.',
    keywords: ['rgrl', '463/09', 'relevamiento general', 'declaracion jurada art'],
    pasosGuia: [
      'Auditar el establecimiento ítem por ítem según el formulario aplicable (Dec. 351/79 Indústria/Comercio, Dec. 911/96 Construcción o Dec. 617/97 Agro).',
      'Completar y exportar el formulario oficial en "/rgrl/new".'
    ],
    riesgosTipicos: [
      'Incumplimientos formales o técnicos detectables en inspecciones de la ART o del Ministerio de Trabajo.'
    ],
    eppTipico: [
      'Verificación de registros de entrega de EPP Res. 299/11 y protocolos anuales (84/12, 85/12, 900/15, 886/15).'
    ],
    recomendacionesTipicas: [
      'Renovar anualmente el RGRL al renovar el contrato de afiliación con la ART y hacer seguimiento de los ítems pendientes en /capa/new.'
    ],
    normativaTipica: [
      'Resoluciones SRT 463/09, 529/09 y 741/10 (Relevamiento General de Riesgos Laborales).'
    ]
  },
  {
    nombre: 'Relevamiento de Agentes de Riesgo (RAR - Res. SRT 37/10 / 81/19)',
    ruta: '/rar/new',
    motivo: 'Declarar la nómina de trabajadores expuestos a agentes de riesgo físicos, químicos, biológicos o ergonómicos (ESOP) para los exámenes médicos periódicos de la ART.',
    comoUsarlo: 'En /rar/new cargá los datos de la empresa y asociá a cada trabajador por CUIL/sector los códigos de agentes de riesgo (Anexo V Res. 37/10) a los que está expuesto.',
    keywords: ['rar', 'agentes de riesgo', '81/19', 'nomina de expuestos', 'esop'],
    pasosGuia: [
      'Relevar por puesto qué trabajadores están expuestos a ruido (> 85 dBA), calor, polvos, solventes, soldadura o gestos repetitivos.',
      'Cargar la nómina y los códigos ESOP en "/rar/new" para presentar ante la ART.'
    ],
    riesgosTipicos: [
      'Enfermedades profesionales no detectadas a tiempo por falta de exámenes médicos periódicos específicos.'
    ],
    eppTipico: [
      'EPP específico según el agente de riesgo declarado (protección auditiva, respiratoria con filtros adecuados, guantes químicos).'
    ],
    recomendacionesTipicas: [
      'Presentar el RAR anualmente ante la ART para que programe los Exámenes Médicos Periódicos gratuitos.'
    ],
    normativaTipica: [
      'Resolución SRT 37/10 y Resolución SRT 81/19 (Sistema de Vigilancia y Control de Sustancias y Agentes Cancerígenos).'
    ]
  },
  {
    nombre: 'Autoelevadores y Sampis (Res. SRT 960/15)',
    ruta: '/forklifts',
    motivo: 'Inspeccionar condiciones de seguridad de autoelevadores (frenos, uñas, cadenas, alarma de retroceso, cinturón, matafuego, jaula ROPS/FOPS) y credencial del operador.',
    comoUsarlo: 'En /forklifts completá el checklist diario/periódico exigido por la Res. SRT 960/15 y verificá la vigencia del curso anual y carnet habilitante.',
    keywords: ['autoelevador', 'autoelevadores', 'sampi', 'clark', 'montacargas', '960/15', 'srt 960'],
    pasosGuia: [
      'Verificar que el operador tenga carnet habilitante vigente, curso anual de 10 horas (Res. SRT 960/15) y apto médico.',
      'Realizar antes del inicio del turno el checklist diario en "/forklifts": uñas, cadenas de izaje, mangueras hidráulicas, freno de mano, cinturón de seguridad, bocina, baliza giratoria, alarma acústica de retroceso, espejos y matafuego ABC.'
    ],
    riesgosTipicos: [
      'Vuelco lateral del autoelevador con aplastamiento del conductor si no lleva colocado el cinturón de seguridad.',
      'Atropellamiento de peatones en cruces de pasillos o puntos ciegos de depósito.',
      'Caída de pallets o cargas mal estibadas desde las horquillas.'
    ],
    eppTipico: [
      'Casco de seguridad, calzado de seguridad con puntera, chaleco reflectivo de alta visibilidad y uso obligatorio del cinturón de seguridad del equipo.'
    ],
    recomendacionesTipicas: [
      'Circular siempre con las horquillas bajas (a 15-20 cm del suelo) e inclinadas hacia atrás, respetando la velocidad máxima de planta (10 km/h).',
      'Si se detecta falla crítica en frenos, dirección o sistema hidráulico, colocar cartel de "FUERA DE SERVICIO" y bloquear la llave (/loto/new).'
    ],
    normativaTipica: [
      'Resolución SRT 960/15 (Condiciones de Seguridad para la Operación de Autoelevadores) y Dec. 351/79 Cap. 15.'
    ]
  },
  {
    nombre: 'Inspección de Flota, Vehículos y Casillas / Rodantes',
    ruta: '/fleet-form',
    motivo: 'Realizar el checklist técnico-preventivo de vehículos, camionetas, camiones, trailers, casas rodantes o casillas móviles (enganches, cadenas, luces, frenos, GLP, matafuego).',
    comoUsarlo: 'En /fleet-form cargá el dominio/patente, kilometraje, estado de neumáticos, luces reglamentarias, elementos de emergencia (matafuego, balizas, botiquín) y seguridad del habitáculo.',
    keywords: ['flota', 'vehiculo', 'vehículo', 'camioneta', 'camion', 'casa rodante', 'motorhome', 'casilla', 'trailer', 'remolque', 'vtv', 'transito'],
    pasosGuia: [
      'Inspeccionar el estado mecánico y documental: VTV/RTO vigente, seguro, licencia profesional, neumáticos, frenos, luces y enganche con cadenas de seguridad cruzadas.',
      'Controlar matafuego vehicular ABC con carga vigente fijado en soporte metálico, balizas triangulares, chaleco reflectivo y botiquín.',
      'En casillas móviles o casas rodantes, verificar además ventilación permanente, detector autónomo de Monóxido de Carbono (CO) y GLP, regulador y mangueras de gas aprobadas y disyuntor diferencial de 30 mA en 220V.',
      'Registrar la inspección completa en el módulo "Inspección de Flota y Vehículos" (/fleet-form).'
    ],
    riesgosTipicos: [
      'Siniestro vial por falla en sistema de frenos, neumáticos desgastados, luces inoperativas o desprendimiento de remolque.',
      'Intoxicación por Monóxido de Carbono (CO) o explosión por fuga de gas envasado (GLP) en casillas y habitáculos móviles.'
    ],
    eppTipico: [
      'Chaleco reflectivo de alta visibilidad, calzado cerrado de seguridad, guantes para maniobras de enganche, matafuego ABC y botiquín.'
    ],
    recomendacionesTipicas: [
      'Asegurar siempre el enganche de remolques con perno con chaveta de seguridad más dos cadenas de acero cruzadas por debajo de la lanza.'
    ],
    normativaTipica: [
      'Ley Nacional de Tránsito N° 24.449 y Decreto 779/95.',
      'Decreto 351/79 Cap. 18 y Normas ENARGAS NAG-200 (para instalaciones de gas en habitáculos).'
    ]
  },
  {
    nombre: 'Operaciones de Izaje, Grúas y Aparejos',
    ruta: '/lifting-form',
    motivo: 'Planificar maniobras de izaje crítico verificando carga máxima de utilización (WLL), factor de utilización de grúa, estado de eslingas, grilletes y ganchos con seguro.',
    comoUsarlo: 'En /lifting-form ingresá el peso de la carga, radio de giro, capacidad de tabla de la grúa, inspección de eslingas/estrobos y firma del señalero (rigger) y gruista.',
    keywords: ['izaje', 'grua', 'grúa', 'aparejo', 'puente grua', 'eslinga', 'eslingas', 'grillete', 'hidrogrua', 'carga suspendida'],
    pasosGuia: [
      'Determinar el peso exacto de la carga + aparejos y verificar en la tabla de carga de la grúa que el porcentaje de utilización no supere el 75-80%.',
      'Inspeccionar eslingas sintéticas (sin cortes en costuras y con etiqueta legible), cables de acero, grilletes certificados y pestillo de seguridad del gancho.',
      'Extender al 100% las vigas de los estabilizadores sobre tacos de madera dura en terreno firme, vallar el radio de giro y utilizar sogas guía (vientos) para no tocar la carga con las manos.',
      'Emitir el permiso de izaje en "/lifting-form" junto al "/ats".'
    ],
    riesgosTipicos: [
      'Caída de carga suspendida por rotura de eslinga deteriorada o sobrecarga.',
      'Vuelco de la grúa/hidrogrúa por terreno inestable o estabilizadores mal desplegados.',
      'Contacto de la pluma con líneas eléctricas aéreas de media o alta tensión.'
    ],
    eppTipico: [
      'Casco de seguridad, botines con puntera, guantes de vaqueta, anteojos y chaleco reflectivo para el rigger/señalero.'
    ],
    recomendacionesTipicas: [
      'Prohibir terminantemente que cualquier persona transite o permanezca debajo de una carga suspendida.',
      'Designar un único Señalero (Rigger) identificado para dirigir al operador de la grúa.'
    ],
    normativaTipica: [
      'Decreto 351/79 Capítulo 15 (Aparatos para Izar - Art. 122 a 137) y Decreto 911/96 Art. 265 a 288.',
      'Normas ASME B30.5 (Grúas Móviles) y ASME B30.9 (Eslingas).'
    ]
  },
  {
    nombre: 'Seguridad Química y Fichas SGA / SDS (Res. SRT 801/15)',
    ruta: '/chemical-safety/new',
    motivo: 'Inventariar sustancias químicas peligrosas, pictogramas del Sistema Globalmente Armonizado (SGA/GHS), incompatibilidades de almacenamiento, FDS/SDS y duchas lavaojos.',
    comoUsarlo: 'En /chemical-safety/new registrá el producto químico, N° CAS/ONU, pictogramas SGA, matriz de compatibilidad, batea de contención antiderrame (110%) y EPP químico.',
    keywords: ['quimico', 'químico', 'quimicos', 'sga', '801/15', 'fds', 'sds', 'hoja de seguridad', 'solvente', 'acido', 'inflamable', 'derrame'],
    pasosGuia: [
      'Relevar todos los productos químicos del establecimiento y reunir sus Fichas de Datos de Seguridad (FDS / SDS) de 16 secciones en idioma español.',
      'Etiquetar todos los envases originales y bidones de trasvase con la etiqueta reglamentaria SGA (palabra de advertencia, pictogramas romboidales rojos, indicaciones H y consejos P).',
      'Disponer bateas de contención antiderrame con capacidad del 110% del envase de mayor volumen, kit absorbente antiderrame y ducha/lavaojos de emergencia.',
      'Registrar cada sustancia en "/chemical-safety/new".'
    ],
    riesgosTipicos: [
      'Quemaduras químicas dérmicas u oculares por salpicaduras de ácidos, álcalis o solventes.',
      'Intoxicación por inhalación de vapores orgánicos o reacción violenta por mezcla de sustancias incompatibles.'
    ],
    eppTipico: [
      'Guantes de nitrilo, neopreno o butilo según FDS, antiparras herméticas antisalpicaduras, delantal impermeable y semimáscara con cartuchos para vapores orgánicos/gases ácidos.'
    ],
    recomendacionesTipicas: [
      'Prohibir de forma absoluta el trasvase de productos químicos a botellas de bebidas o envases alimenticios.'
    ],
    normativaTipica: [
      'Resolución SRT 801/15 (Implementación del Sistema Globalmente Armonizado SGA/GHS en el ámbito laboral) y Dec. 351/79 Cap. 9 y 17.'
    ]
  },
  {
    nombre: 'Atmósferas Explosivas (Clasificación de Áreas ATEX / NFPA)',
    ruta: '/atex/new',
    motivo: 'Evaluar y clasificar zonas con riesgo de explosión por gases/vapores inflamables (Zona 0, 1, 2) o polvos combustibles (Zona 20, 21, 22) y equipamiento antiexplosivo Ex.',
    comoUsarlo: 'En /atex/new definí la sustancia inflamable o polvo, la clasificación de zona, el control de fuentes de ignición (electricidad estática, puesta a tierra, herramientas antichispa) y ventilación.',
    keywords: ['atex', 'atmosfera explosiva', 'atmósfera explosiva', 'antiexplosivo', 'polvo combustible', 'zona 0', 'zona 1', 'explosivo'],
    pasosGuia: [
      'Identificar sustancias con punto de inflamación bajo, gases o polvos combustibles (cereales, harinas, aluminio, madera) y clasificar las zonas (0/1/2 o 20/21/22).',
      'Asegurar que toda instalación eléctrica, luminaria y motor dentro del área clasificada sea certificado Antiexplosivo (Ex d / Ex e / Ex i) y conectar pinzas de puesta a tierra equipotencial durante trasvases.',
      'Documentar el estudio en "/atex/new".'
    ],
    riesgosTipicos: [
      'Deflagración o explosión por ignición de nube de vapores inflamables o polvo en suspensión por chispa eléctrica o descarga electrostática.'
    ],
    eppTipico: [
      'Ropa de trabajo ignífuga y antiestática (algodón 100% o fibra antiestática), calzado conductivo/antiestático y herramientas manuales antichispa (bronce-aluminio / cobre-berilio).'
    ],
    recomendacionesTipicas: [
      'Evitar el barrido en seco en zonas con polvos combustibles; utilizar aspiración industrial certificada ATEX.'
    ],
    normativaTipica: [
      'Decreto 351/79 Anexo VI Punto 3.3.2 (Locales con Riesgo de Explosión), Norma IRAM-IAP-IEC 60079 y Directiva ATEX.'
    ]
  },
  {
    nombre: 'Gestión de Residuos Peligrosos (Ley 24.051)',
    ruta: '/hazardous-waste/new',
    motivo: 'Controlar la generación, acopio transitorio, corrientes de desecho (Y1-Y48), etiquetado, manifiestos de transporte y certificados de disposición final.',
    comoUsarlo: 'En /hazardous-waste/new registrá la corriente de residuo (ej. Y8 aceites minerales usados, Y9 hidrocarburos, Y48 trapos y envases contaminados), cantidad generada, transportista habilitado y operador.',
    keywords: ['residuo peligroso', 'residuos peligrosos', '24051', '24.051', 'corriente y', 'manifiesto', 'acopio de residuos', 'disposicion final'],
    pasosGuia: [
      'Segregar los residuos peligrosos en el punto de generación en tambores o contenedores homologados, rotulados con la Corriente Y y fecha de inicio de llenado.',
      'Acondicionar el depósito transitorio bajo techo, con piso impermeable, batea de contención, ventilación y extintor.',
      'Registrar cada retiro con transportista habilitado, Manifiesto y Certificado de Disposición Final en "/hazardous-waste/new".'
    ],
    riesgosTipicos: [
      'Contaminación de suelo y napas por derrames sin contención e incendio en sector de acopio.'
    ],
    eppTipico: [
      'Guantes de nitrilo/PVC, calzado de seguridad, antiparras y delantal impermeable para manipulación de tambores.'
    ],
    recomendacionesTipicas: [
      'No mezclar aceites usados (Y8) con solventes clorados ni trapos contaminados (Y48) con residuos domiciliarios.'
    ],
    normativaTipica: [
      'Ley Nacional N° 24.051 de Residuos Peligrosos (y Ley 11.720 en Prov. de Buenos Aires).'
    ]
  },
  {
    nombre: 'Investigación de Accidentes e Incidentes (Árbol de Causas)',
    ruta: '/accident-investigation',
    motivo: 'Investigar siniestros laborales o cuasi-accidentes aplicando el método del Árbol de Causas y los 5 Porqués para hallar las causas raíz y evitar su repetición.',
    comoUsarlo: 'En /accident-investigation cargá los datos del accidentado, descripción objetiva del hecho, factores inmediatos y causas básicas, árbol causal y plan de acciones correctivas.',
    keywords: ['accidente', 'investigacion de accidente', 'investigación de accidente', 'incidente', 'siniestro', 'arbol de causas', 'lesion', 'denuncia art'],
    pasosGuia: [
      'Brindar primeros auxilios, trasladar al centro médico y realizar la denuncia inmediata del siniestro ante la ART.',
      'Relevar en el lugar del hecho únicamente hechos objetivos y verificables (sin juicios de valor ni búsqueda de culpables) y entrevistar testigos.',
      'Construir el Árbol de Causas ("¿Qué fue necesario para que ocurra X?") en "/accident-investigation" y cargar las medidas preventivas en "/capa/new".'
    ],
    riesgosTipicos: [
      'Repetición del mismo accidente en el corto plazo si solo se señala "error humano" en lugar de corregir la causa raíz técnica/organizativa.'
    ],
    eppTipico: [
      'Revisión del estado y adecuación del EPP que utilizaba el trabajador al momento del evento.'
    ],
    recomendacionesTipicas: [
      'Difundir una Alerta de Seguridad / Lección Aprendida a todo el personal mediante una charla en /toolbox-talk.'
    ],
    normativaTipica: [
      'Ley 24.557 de Riesgos del Trabajo y Guía SRT de Investigación de Accidentes mediante el Método del Árbol de Causas.'
    ]
  },
  {
    nombre: 'Inspección de Estanterías Metálicas y Racks (IRAM / UNE-EN 15635)',
    ruta: '/racks',
    motivo: 'Inspeccionar racks selectivos o penetrables en depósitos: verticalidad de puntales, largueros, clavijas de seguridad, protecciones de pie, carteles de carga máxima y pallets.',
    comoUsarlo: 'En /racks completá la inspección técnica clasificando los daños por nivel (Verde, Ámbar, Rojo) y emití el certificado de seguridad del depósito.',
    keywords: ['rack', 'racks', 'estanteria', 'estanterías', 'deposito', 'depósito', 'almacen', 'pallets', '15635'],
    pasosGuia: [
      'Verificar que cada batería de racks tenga exhibido el cartel de Carga Máxima Admisible por nivel y por módulo.',
      'Inspeccionar puntales (abolladuras por impactos de autoelevador), largueros (flecha máxima L/200), presencia del 100% de las clavijas/pasadores de seguridad, anclajes al piso y defensas de puntera.',
      'Emitir el informe técnico en "/racks".'
    ],
    riesgosTipicos: [
      'Colapso progresivo (efecto dominó) de la estantería por impacto de autoelevador en puntal sin defensa o sobrecarga.'
    ],
    eppTipico: [
      'Casco de seguridad con barbijo, calzado de seguridad con puntera y chaleco reflectivo dentro del depósito.'
    ],
    recomendacionesTipicas: [
      'Ante un daño Nivel Rojo en un puntal o larguero, descargar inmediatamente el módulo afectado y clausurarlo hasta el reemplazo de la pieza original.'
    ],
    normativaTipica: [
      'Norma UNE-EN 15635 / IRAM (Almacenaje en estanterías metálicas - Uso y mantenimiento) y Dec. 351/79 Cap. 5.'
    ]
  },
  {
    nombre: 'Estudio de Ventilación y Renovación de Aire (Dec. 351/79 Cap. 11)',
    ruta: '/ventilation',
    motivo: 'Calcular el caudal de aire necesario (m³/h) y renovaciones por hora según el cubaje del local, cantidad de ocupantes y contaminantes.',
    comoUsarlo: 'En /ventilation ingresá largo, ancho y alto del local, cantidad de personas, tipo de actividad y caudal de extractores/inyectores.',
    keywords: ['ventilacion', 'ventilación', 'renovacion de aire', 'extraccion localizada', 'caudal de aire', 'capitulo 11'],
    pasosGuia: [
      'Medir largo, ancho y altura del local para obtener el volumen ($m^3$) y relevar la dotación máxima de personas.',
      'Cargar los datos en "/ventilation" para verificar el caudal mínimo exigido por la tabla del Art. 66 del Dec. 351/79.'
    ],
    riesgosTipicos: [
      'Acumulación de calor, dióxido de carbono, vapores o polvos en suspensión por renovación de aire insuficiente.'
    ],
    eppTipico: [
      'Protección respiratoria complementaria mientras se adecúan los sistemas de extracción localizada o ventilación general.'
    ],
    recomendacionesTipicas: [
      'Priorizar la ventilación natural cruzada y, donde existan fuentes puntuales de humos o polvos, instalar campanas de aspiración localizada.'
    ],
    normativaTipica: [
      'Decreto 351/79 Capítulo 11 (Ventilación - Art. 64 a 70).'
    ]
  },
  {
    nombre: 'Legajo Técnico de Higiene y Seguridad',
    ruta: '/legajos',
    motivo: 'Centralizar y organizar toda la documentación legal obligatoria de la empresa o cliente (planos, protocolos, capacitaciones, cargas de fuego, mediciones).',
    comoUsarlo: 'En /legajos/nuevo armá la carátula y el índice del Legajo Técnico del establecimiento, y en /dossier podés exportar todo el paquete en un archivo ZIP.',
    keywords: ['legajo', 'legajo tecnico', 'legajo técnico', 'expediente', 'carpeta de seguridad', 'inspeccion ministerio'],
    pasosGuia: [
      'Conformar el Legajo Técnico reuniendo: Estudio de Carga de Fuego (/fire-load), Plan y Plano de Evacuación (/emergency-plan y /risk-maps), Protocolos anuales de Iluminación (/lighting), Ruido (/noise-assessment/new), Puesta a Tierra (/grounding/new) y Ergonomía (/ergonomics-form), Plan Anual y Actas de Capacitación (/training-management), Entrega de EPP (/ppe-tracker) y RGRL/RAR (/rgrl/new, /rar/new).',
      'Registrar el índice oficial en "/legajos" y exportar el paquete completo en "/dossier".'
    ],
    riesgosTipicos: [
      'Multas o infracciones ante inspecciones del Ministerio de Trabajo, SRT o Municipio por documentación dispersa o vencida.'
    ],
    eppTipico: [
      'Planillas de entrega de EPP Res. 299/11 archivadas y foliadas dentro del Legajo Técnico.'
    ],
    recomendacionesTipicas: [
      'Mantener una copia física o digital accesible en el establecimiento firmada en original por el profesional con matrícula vigente.'
    ],
    normativaTipica: [
      'Ley 19.587, Decreto 351/79, Decreto 1338/96 (Servicios de Higiene y Seguridad en el Trabajo) y Resoluciones SRT.'
    ]
  },
  {
    nombre: 'Control de Contratistas y Documentación de Ingreso',
    ruta: '/contractors',
    motivo: 'Controlar el vencimiento de pólizas de ART con cláusula de no repetición, Seguro de Vida Obligatorio, altas tempranas y entrega de EPP de empresas tercerizadas.',
    comoUsarlo: 'En /contractors cargá las empresas contratistas y sus operarios (podés escanear los certificados de ART/DNI con IA) para ver en semáforo quién está habilitado para ingresar a planta/obra.',
    keywords: ['contratista', 'contratistas', 'tercerizados', 'clausula de no repeticion', 'certificado art', 'ingreso a planta', 'seguro de vida'],
    pasosGuia: [
      'Solicitar previo al ingreso: Certificado de cobertura ART vigente con nómina y Cláusula de No Repetición a favor de la empresa principal, Seguro de Vida Obligatorio (o Seguro de Accidentes Personales para monotributistas), constancia de capacitación e inducción y planilla de EPP Res. 299/11.',
      'Cargar y auditar las fechas de vencimiento en "/contractors".'
    ],
    riesgosTipicos: [
      'Responsabilidad solidaria de la empresa principal (Art. 30 LCT) por ingreso de personal contratista sin cobertura de ART ni capacitación.'
    ],
    eppTipico: [
      'Exigencia de EPP certificado idéntico al requerido para el personal propio de planta.'
    ],
    recomendacionesTipicas: [
      'Bloquear el ingreso en portería a cualquier contratista cuyo certificado de ART tenga más de 30 días de emisión.'
    ],
    normativaTipica: [
      'Ley de Contrato de Trabajo N° 20.744 Art. 30 (Solidaridad), Ley 24.557 y Res. SRT 35/98.'
    ]
  }
];

function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Encuentra los módulos del catálogo que mejor responden a la consulta libre del usuario.
 */
export function matchCatalogModulesForQuery(query: string): CatalogModule[] {
  const normQuery = normalizeText(query);

  const scored = PLATFORM_MODULES_CATALOG.map((mod) => {
    let score = 0;
    for (const kw of mod.keywords) {
      const normKw = normalizeText(kw);
      if (normQuery.includes(normKw)) {
        score += normKw.includes(' ') ? 6 : 2;
      }
    }
    return { mod, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored.slice(0, 5).map((s) => s.mod);
  }

  // Si es una consulta general de tarea operativa (ej. "pintura", "limpieza", "reparación", "corte", etc.),
  // devolver los módulos troncales: ATS, Matriz de Riesgos IPER y Entrega de EPP.
  return PLATFORM_MODULES_CATALOG.filter((m) =>
    ['/ats', '/risk-matrix', '/ppe-tracker', '/training-management'].includes(m.ruta)
  );
}

/**
 * Encuentra los módulos recomendados (combinando lo que devuelva la IA con nuestro catálogo completo).
 */
export function matchModulesForQuery(query: string, existingModules?: RecommendedModule[]): RecommendedModule[] {
  const matchedCatalog = matchCatalogModulesForQuery(query);
  const combined: RecommendedModule[] = [];
  const seenRoutes = new Set<string>();

  if (Array.isArray(existingModules)) {
    for (const m of existingModules) {
      if (m && m.ruta && !seenRoutes.has(m.ruta)) {
        const catalogHit = PLATFORM_MODULES_CATALOG.find((c) => c.ruta === m.ruta);
        combined.push({
          nombre: m.nombre || catalogHit?.nombre || 'Módulo del Sistema',
          ruta: m.ruta,
          motivo: m.motivo || catalogHit?.motivo || '',
          comoUsarlo: (m as any).comoUsarlo || catalogHit?.comoUsarlo
        });
        seenRoutes.add(m.ruta);
      }
    }
  }

  for (const mod of matchedCatalog) {
    if (!seenRoutes.has(mod.ruta)) {
      combined.push({
        nombre: mod.nombre,
        ruta: mod.ruta,
        motivo: mod.motivo,
        comoUsarlo: mod.comoUsarlo
      });
      seenRoutes.add(mod.ruta);
    }
  }

  return combined.slice(0, 6);
}

/**
 * Genera una respuesta experta completa (o enriquece una parcial) para CUALQUIER consulta del usuario,
 * funcionando tanto cuando la API de Gemini responde como cuando los créditos prepagos de la API Key están agotados (402/500).
 */
export function enrichAdvisorResponse(rawResponse: any, userQuery: string, country: string = 'argentina'): any {
  const data = rawResponse && typeof rawResponse === 'object' ? { ...rawResponse } : {};
  const cleanQuery = (userQuery || data.task || 'Consulta de Higiene y Seguridad').trim();
  const matchedCatalog = matchCatalogModulesForQuery(cleanQuery);
  const primaryCatalog = matchedCatalog[0] || PLATFORM_MODULES_CATALOG[4]; // ATS por defecto

  const taskTitle =
    data.task && data.task.length > 3
      ? data.task
      : cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1);

  const modulosRecomendados = matchModulesForQuery(cleanQuery + ' ' + taskTitle, data.modulosRecomendados);

  // Construir Plan de Acción combinando los pasos de los módulos detectados si no vino del servidor
  let planDeAccion: string[] =
    Array.isArray(data.planDeAccion) && data.planDeAccion.length > 0 ? [...data.planDeAccion] : [];

  if (planDeAccion.length === 0) {
    const mergedSteps: string[] = [];
    for (const mod of matchedCatalog.slice(0, 2)) {
      for (const step of mod.pasosGuia) {
        if (!mergedSteps.includes(step)) {
          mergedSteps.push(step);
        }
      }
    }
    planDeAccion =
      mergedSteps.length > 0
        ? mergedSteps.slice(0, 6)
        : [
            `Relevar en el lugar de trabajo las condiciones operativas, del entorno e instalaciones para: "${taskTitle}".`,
            'Identificar paso a paso cada etapa de la tarea, sus peligros asociados y las barreras preventivas necesarias.',
            'Confeccionar el documento técnico correspondiente utilizando los módulos recomendados de la plataforma.',
            'Verificar la provisión y uso de los Elementos de Protección Personal (EPP) certificados y recolectar las firmas digitales de los intervinientes.'
          ];
  }

  // Construir Riesgos específicos
  let riesgos: string[] = Array.isArray(data.riesgos) && data.riesgos.length > 0 ? [...data.riesgos] : [];
  if (riesgos.length === 0) {
    const setR = new Set<string>();
    for (const mod of matchedCatalog.slice(0, 3)) {
      mod.riesgosTipicos.forEach((r) => setR.add(r));
    }
    riesgos = Array.from(setR).slice(0, 6);
  }

  // Construir EPP específico
  let epp: string[] = Array.isArray(data.epp) && data.epp.length > 0 ? [...data.epp] : [];
  if (epp.length === 0) {
    const setE = new Set<string>();
    for (const mod of matchedCatalog.slice(0, 3)) {
      mod.eppTipico.forEach((e) => setE.add(e));
    }
    epp = Array.from(setE).slice(0, 6);
  }

  // Construir Recomendaciones preventivas
  let recomendaciones: string[] =
    Array.isArray(data.recomendaciones) && data.recomendaciones.length > 0 ? [...data.recomendaciones] : [];
  if (recomendaciones.length === 0) {
    const setRec = new Set<string>();
    for (const mod of matchedCatalog.slice(0, 3)) {
      mod.recomendacionesTipicas.forEach((r) => setRec.add(r));
    }
    recomendaciones = Array.from(setRec).slice(0, 6);
  }

  // Construir Normativa aplicable
  let normativa: string[] = Array.isArray(data.normativa) && data.normativa.length > 0 ? [...data.normativa] : [];
  if (normativa.length === 0) {
    const setN = new Set<string>();
    for (const mod of matchedCatalog.slice(0, 3)) {
      mod.normativaTipica.forEach((n) => setN.add(n));
    }
    normativa = Array.from(setN).slice(0, 6);
  }

  // Construir chatResponse completo y pedagógico si no vino del servidor
  let chatResponse: string = typeof data.chatResponse === 'string' ? data.chatResponse.trim() : '';

  if (!chatResponse) {
    const sections: string[] = [];
    sections.push(`## 📋 Guía del Asesor H&S: ${taskTitle}`);
    sections.push(
      `Para resolver **"${cleanQuery}"** de forma profesional y reglamentaria, acá tenés exactamente **qué tenés que hacer en campo**, **cómo confeccionarlo paso a paso** y **qué módulo(s) de la plataforma usar para cada parte**:`
    );

    sections.push(`### 🛠️ 1. ¿Qué tenés que hacer y cómo realizarlo paso a paso?`);
    planDeAccion.forEach((step, idx) => {
      const cleanStep = step.replace(/^(Paso\s*\d+[:.-]?\s*|\d+[.)-]\s*)/i, '');
      sections.push(`${idx + 1}. ${cleanStep}`);
    });

    if (modulosRecomendados.length > 0) {
      sections.push(`### 🧩 2. ¿Qué módulos de la aplicación usar para cada cosa y cómo cargarlos?`);
      modulosRecomendados.forEach((mod) => {
        sections.push(
          `• **${mod.nombre}** (ruta \`${mod.ruta}\`): **¿Para qué sirve?:** ${mod.motivo}${
            mod.comoUsarlo ? ` **¿Cómo hacerlo en la app?:** ${mod.comoUsarlo}` : ''
          }`
        );
      });
    }

    sections.push(`### 🚨 3. Puntos críticos de control y prevención`);
    recomendaciones.slice(0, 4).forEach((rec) => sections.push(`• ${rec}`));

    sections.push(
      `💡 **Tip rápido:** Podés tocar cualquiera de los botones **"Ir al Módulo"** de arriba para abrir directamente la herramienta correspondiente y emitir el PDF firmado.`
    );

    chatResponse = sections.join('\n');
  }

  return {
    ...data,
    task: taskTitle,
    chatResponse,
    planDeAccion,
    riesgos,
    epp,
    recomendaciones,
    normativa,
    modulosRecomendados
  };
}
