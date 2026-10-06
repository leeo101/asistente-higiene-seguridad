export type PTSCategory =
  | 'metalmecanica'
  | 'logistica_almacen'
  | 'quimicos_peligrosos'
  | 'mantenimiento_electrico'
  | 'construccion_obras'
  | 'agroindustria'
  | 'alimentos_sanidad'
  | 'operaciones_generales';

export interface PTSStep {
  id: string;
  stepNumber: number;
  activityTitle: string;
  hazardRisk: string; // Peligro y riesgo asociado
  controlMeasure: string; // Medida preventiva obligatoria
}

export interface PTSWorkerAcknowledge {
  id: string;
  workerName: string;
  workerDni: string;
  sector: string;
  acknowledgedDate: string; // YYYY-MM-DD
  signed: boolean;
}

export interface PTSProcedure {
  id: string;
  companyId?: string;
  code: string; // Ej: "PTS-MEC-01"
  version: string; // Ej: "Rev. 02"
  title: string; // Ej: "Operación Segura de Amoladora Angular y Corte de Metales"
  category: PTSCategory;
  categoryLabel: string;
  effectiveDate: string; // YYYY-MM-DD
  nextReviewDate: string; // YYYY-MM-DD
  status: 'vigente' | 'en_revision' | 'obsoleto';

  // Contenido estructural del procedimiento
  objective: string;
  scope: string; // Alcance
  responsibilities: string;
  requiredPPE: string[]; // EPP obligatorio
  preliminaryChecks: string; // Verificaciones antes de comenzar
  steps: PTSStep[]; // Paso a paso seguro
  prohibitions: string[]; // Lo que NO se debe hacer
  emergencyProtocol: string; // Actuación ante emergencias

  // Control de firmas
  preparedBy: string; // Elaboró (HyS)
  reviewedBy: string; // Revisó (Supervisor/Planta)
  approvedBy: string; // Aprobó (Gerencia)

  // Registro de difusión
  acknowledgements: PTSWorkerAcknowledge[];
  createdAt: string;
}

export const PTS_CATEGORY_LABELS: Record<PTSCategory, { label: string; color: string }> = {
  metalmecanica: { label: 'Metalmecánica y Mecanizado', color: '#6366f1' },
  logistica_almacen: { label: 'Logística, Racks y Almacenes', color: '#f59e0b' },
  quimicos_peligrosos: { label: 'Químicos y Sustancias Peligrosas', color: '#ec4899' },
  mantenimiento_electrico: { label: 'Mantenimiento e Instalaciones', color: '#eab308' },
  construccion_obras: { label: 'Construcción y Obras Civiles', color: '#d97706' },
  agroindustria: { label: 'Agroindustria y Silos', color: '#10b981' },
  alimentos_sanidad: { label: 'Alimentos y Sanidad', color: '#06b6d4' },
  operaciones_generales: { label: 'Operaciones Generales de Planta', color: '#64748b' }
};

export const DEFAULT_PTS_PROCEDURES: PTSProcedure[] = [
  {
    id: 'pts-001',
    code: 'PTS-MEC-01',
    version: 'Rev. 02',
    title: 'Operación Segura de Amoladora Angular y Disco de Corte',
    category: 'metalmecanica',
    categoryLabel: 'Metalmecánica y Mecanizado',
    effectiveDate: '2026-05-10',
    nextReviewDate: '2027-05-10',
    status: 'vigente',
    objective: 'Establecer las directivas de seguridad obligatorias para el uso, inspección y maniobras con amoladoras angulares portátiles para evitar accidentes por rotura de disco o proyección de partículas incandescentes.',
    scope: 'Aplica a todo el personal propio y contratista que realice tareas de corte, desbaste o pulido en talleres mecánicos, montajes y obras.',
    responsibilities: '• Operador: Inspeccionar el equipo y usar los EPP obligatorios.\n• Supervisor: Verificar el estado del disco y la guarda protectora antes del inicio de tareas.\n• Servicio HyS: Auditar el cumplimiento del procedimiento y capacitar al personal.',
    requiredPPE: [
      'Protector facial de policarbonato con arnés',
      'Antiparras de seguridad bajo pantalla',
      'Protección auditiva de copa o tapón (NRR > 25 dB)',
      'Guantes de descarne o cuero tipo soldador',
      'Delantal de descarne y polainas ignífugas',
      'Calzado de seguridad con puntera de acero'
    ],
    preliminaryChecks: '1. Verificar que el cable y ficha eléctrica estén sin fisuras ni empalmes precarios.\n2. Comprobar que la guarda o carcasa de protección cubra al menos 180° del disco y esté firmemente ajustada.\n3. Chequear que las RPM máximas del disco sean SUPERIORES a las RPM de la amoladora.\n4. Comprobar que el disco no presente golpes, fisuras ni deformaciones.',
    steps: [
      {
        id: 's-1',
        stepNumber: 1,
        activityTitle: 'Inspección previa y montaje del disco',
        hazardRisk: 'Rotura de disco por montaje inadecuado o incompatibilidad de revoluciones.',
        controlMeasure: 'Desenchufar la amoladora antes de cambiar el disco. Usar exclusivamente la llave de dos pernos provista por el fabricante (prohibido usar cortafríos o martillo). Verificar ajuste de bridas.'
      },
      {
        id: 's-2',
        stepNumber: 2,
        activityTitle: 'Prueba de giro en vacío',
        hazardRisk: 'Estallido de disco defectuoso en proximidad al cuerpo.',
        controlMeasure: 'Hacer girar la máquina en vacío durante 30 segundos apuntando en dirección opuesta a personas y al propio cuerpo.'
      },
      {
        id: 's-3',
        stepNumber: 3,
        activityTitle: 'Sujeción de la pieza de trabajo',
        hazardRisk: 'Atrapamiento, trabado del disco y retroceso violento (kickback).',
        controlMeasure: 'Sujetar firmemente la pieza en morsa o con sargentos mecánicos. Prohibido sostener la pieza con la mano o con el pie durante el corte.'
      },
      {
        id: 's-4',
        stepNumber: 4,
        activityTitle: 'Corte y desbaste',
        hazardRisk: 'Proyección de chispas a ojos, incendio de materiales combustibles cercanos.',
        controlMeasure: 'Sostener la amoladora con ambas manos (una en el mango lateral). Mantener la trayectoria de chispas dirigida lejos de sustancias inflamables (radio 10m libre o mantas ignífugas). No ejercer presión excesiva.'
      },
      {
        id: 's-5',
        stepNumber: 5,
        activityTitle: 'Finalización y detención del equipo',
        hazardRisk: 'Corte por contacto involuntario con disco aún en rotación.',
        controlMeasure: 'Esperar a que el disco se detenga completamente antes de apoyar la máquina en el banco de trabajo. Desconectar de la toma de corriente al finalizar.'
      }
    ],
    prohibitions: [
      'PROHIBIDO utilizar la amoladora sin la guarda o protector de disco colocado.',
      'PROHIBIDO usar discos de corte para realizar tareas de desbaste lateral.',
      'PROHIBIDO utilizar discos húmedos, vencidos o con diámetro superior al diseñado para la máquina.',
      'PROHIBIDO operar la amoladora con una sola mano o retirar la empuñadura lateral.',
      'PROHIBIDO usar ropa holgada, cadenas o cabello suelto que puedan ser atrapados por el eje rotativo.'
    ],
    emergencyProtocol: 'En caso de rotura de disco o corte: Desconectar inmediatamente la máquina. Aplicar presión directa con gasa estéril sobre la herida para contener hemorragia. Notificar al servicio médico de planta y llamar al número de emergencias médicas de la ART. Si hay proyección ocular, no frotar el ojo y lavar con lavaojos de emergencia.',
    preparedBy: 'Lic. Higiene y Seguridad',
    reviewedBy: 'Jefe de Taller Metalúrgico',
    approvedBy: 'Gerencia de Operaciones',
    acknowledgements: [
      { id: 'ack-1', workerName: 'Rodríguez Matías', workerDni: '34.892.110', sector: 'Mecanizado', acknowledgedDate: '2026-05-15', signed: true },
      { id: 'ack-2', workerName: 'Fernández Lucas', workerDni: '38.221.450', sector: 'Mantenimiento', acknowledgedDate: '2026-05-15', signed: true },
      { id: 'ack-3', workerName: 'Alonso Cristian', workerDni: '36.410.890', sector: 'Herrería', acknowledgedDate: '2026-05-16', signed: true }
    ],
    createdAt: '2026-05-10'
  },
  {
    id: 'pts-002',
    code: 'PTS-QUI-02',
    version: 'Rev. 01',
    title: 'Manipulación y Fraccionamiento de Sustancias Químicas Corrosivas',
    category: 'quimicos_peligrosos',
    categoryLabel: 'Químicos y Sustancias Peligrosas',
    effectiveDate: '2026-06-01',
    nextReviewDate: '2027-06-01',
    status: 'vigente',
    objective: 'Estandarizar el procedimiento operativo para el trasvase, fraccionamiento y preparación de baños químicos con ácidos y álcalis para evitar quemaduras químicas e inhalación de vapores tóxicos.',
    scope: 'Aplica a todo el personal de laboratorio, galvanoplastia y limpieza técnica que manipule ácido clorhídrico, sulfúrico o soda cáustica.',
    responsibilities: '• Operador: Verificar la FDS (Ficha de Datos de Seguridad SGA) y usar EPP químico completo.\n• Supervisor: Asegurar la operatividad de duchas de emergencia y lavaojos.\n• Servicio HyS: Auditar el rotulado SGA Res. 801/15 y bandejas antiderrame.',
    requiredPPE: [
      'Máscara facial completa con filtros para vapores ácidos y gases',
      'Traje o delantal de PVC resistente a químicos de alta densidad',
      'Guantes de nitrilo o butilo de caña larga (resistencia química ensayada)',
      'Botas de seguridad de goma/PVC impermeables con puntera',
      'Protector visual hermético antiparras químicas bajo máscara'
    ],
    preliminaryChecks: '1. Comprobar que la ducha de emergencia y lavaojos más cercano funcionen correctamente con agua limpia a presión adecuada.\n2. Verificar la presencia del kit antiderrame químico (material absorbente inerte, pala plástica y bolsa rotulada).\n3. Confirmar que la ventilación forzada o campana de extracción esté encendida.',
    steps: [
      {
        id: 's-1',
        stepNumber: 1,
        activityTitle: 'Revisión de envases y rotulación SGA',
        hazardRisk: 'Confusión de producto y reacción violenta incompatible.',
        controlMeasure: 'Verificar etiqueta SGA y pictogramas de peligro del envase original antes de iniciar el trasvase. Consultar la FDS.'
      },
      {
        id: 's-2',
        stepNumber: 2,
        activityTitle: 'Disposición en bandeja de contención',
        hazardRisk: 'Derrame al piso y contacto con desagües o suelos.',
        controlMeasure: 'Colocar los bidones sobre bandeja plástica de polietileno con capacidad para retener el 110% del volumen del envase más grande.'
      },
      {
        id: 's-3',
        stepNumber: 3,
        activityTitle: 'Trasvase y dosificación (Regla de Oro)',
        hazardRisk: 'Reacción exotérmica violenta y salpicaduras hirvientes.',
        controlMeasure: 'SIEMPRE verter el ácido sobre el agua, NUNCA el agua sobre el ácido ("El ácido se echa al agua despacio"). Realizar el trasvase con bomba manual sifón o embudo de caña larga.'
      },
      {
        id: 's-4',
        stepNumber: 4,
        activityTitle: 'Cierre de recipientes y limpieza',
        hazardRisk: 'Emanación continua de vapores tóxicos en el ambiente.',
        controlMeasure: 'Cerrar herméticamente las tapas inmediatamente después de su uso. Limpiar el exterior de los recipientes y enjuagar los embudos.'
      }
    ],
    prohibitions: [
      'PROHIBIDO trasvasar químicos corrosivos sin utilizar la máscara facial y guantes químicos.',
      'PROHIBIDO pipetear o succionar con la boca bajo ninguna circunstancia.',
      'PROHIBIDO verter restos de ácidos o químicos en piletas o desagües cloacales no neutralizados.',
      'PROHIBIDO comer, beber o fumar en áreas donde se manipulen sustancias químicas.',
      'PROHIBIDO utilizar envases de bebidas o alimentos para fraccionar químicos.'
    ],
    emergencyProtocol: 'En caso de salpicadura química a piel u ojos: Llevar inmediatamente a la víctima a la ducha de emergencia o lavaojos. Lavar con abundante agua corriente durante un mínimo de 15 a 20 minutos ininterrumpidos retirando la ropa contaminada bajo el agua. Solicitar atención médica urgente con la Ficha de Datos de Seguridad del producto.',
    preparedBy: 'Lic. Higiene y Seguridad',
    reviewedBy: 'Jefe de Laboratorio Químico',
    approvedBy: 'Director Técnico Industrial',
    acknowledgements: [
      { id: 'ack-1', workerName: 'Sánchez Laura', workerDni: '32.115.890', sector: 'Laboratorio', acknowledgedDate: '2026-06-05', signed: true },
      { id: 'ack-2', workerName: 'Gómez Pablo', workerDni: '35.409.221', sector: 'Baños Químicos', acknowledgedDate: '2026-06-05', signed: true }
    ],
    createdAt: '2026-06-01'
  }
];

// Plantillas inteligentes para el Generador IA / Asistido
export const PTS_TEMPLATES: Record<string, Partial<PTSProcedure>> = {
  'trabajo_en_altura_escalera': {
    title: 'Uso Seguro de Escaleras de Mano y Extensibles',
    category: 'construccion_obras',
    categoryLabel: 'Construcción y Obras Civiles',
    objective: 'Prevenir caídas a distinto nivel durante el posicionamiento y ascenso por escaleras portátiles en tareas de mantenimiento.',
    requiredPPE: ['Casco de seguridad con barbiquejo de 3 puntos', 'Calzado de seguridad antideslizante', 'Arnés de seguridad con cabo de amarre si h > 2m'],
    preliminaryChecks: 'Verificar zapatas antideslizantes de goma, peldaños sin grasa y largueros sin torceduras. Regla 4 a 1 (inclinación 75°).',
    prohibitions: ['PROHIBIDO trabajar en los dos últimos peldaños de la escalera.', 'PROHIBIDO transportar herramientas en las manos al subir (mantener 3 puntos de apoyo).', 'PROHIBIDO apoyar escaleras sobre cajas, andamios o superficies inestables.'],
    emergencyProtocol: 'Ante caída: Inmovilizar a la víctima, no mover la columna cervical y llamar al servicio de emergencias médicas de la ART.'
  },
  'bloqueo_loto_electrico': {
    title: 'Bloqueo y Etiquetado LOTO para Intervención de Maquinarias',
    category: 'mantenimiento_electrico',
    categoryLabel: 'Mantenimiento e Instalaciones',
    objective: 'Garantizar energía cero antes de cualquier reparación o mantenimiento en equipos mecánicos y eléctricos.',
    requiredPPE: ['Guantes dieléctricos según nivel de tensión', 'Protección facial contra arco eléctrico', 'Calzado dieléctrico'],
    preliminaryChecks: 'Identificar todas las fuentes de energía (eléctrica, neumática, hidráulica, gravitacional). Portar candado y tarjeta personal.',
    prohibitions: ['PROHIBIDO retirar el candado de otro operario sin autorización formal de la gerencia.', 'PROHIBIDO trabajar sin verificar tensión cero con voltímetro verificado.'],
    emergencyProtocol: 'Si se detecta re-energización accidental: Cortar interruptor principal general de emergencia de la sala de tableros.'
  },
  'autoelevador_estiba': {
    title: 'Operación Segura de Autoelevador y Carga en Racks',
    category: 'logistica_almacen',
    categoryLabel: 'Logística, Racks y Almacenes',
    objective: 'Regular la circulación, velocidad y manipulación de pallets en estanterías metálicas de almacenamiento pesado.',
    requiredPPE: ['Calzado de seguridad', 'Chaleco reflectivo de alta visibilidad', 'Cinturón de seguridad colocado', 'Protección auditiva en caso de motor a combustión'],
    preliminaryChecks: 'Checklist pre-operacional diario Res. SRT 960/15 (frenos, alarma retroceso, pérdidas hidráulicas, baliza y bocina).',
    prohibitions: ['PROHIBIDO transportar pasajeros en uñas o contrapeso.', 'PROHIBIDO circular a más de 10 km/h o con la carga elevada a más de 20 cm del suelo.'],
    emergencyProtocol: 'En caso de vuelco lateral: Sujetar firmemente el volante, apoyar los pies en el piso e inclinarse en sentido opuesto a la caída sin saltar de la cabina.'
  }
};
