export type ComplianceStatus = 'conforme' | 'no_conforme' | 'en_proceso' | 'no_aplica';

export type LegalJurisdiction = 'nacional' | 'provincial' | 'municipal';

export type LegalRequirementCategory =
  | 'instalaciones_edilicia'
  | 'riesgo_electrico'
  | 'incendio_evacuacion'
  | 'iluminacion_color'
  | 'ruido_vibraciones'
  | 'quimicos_ventilacion'
  | 'ergonomia_termico'
  | 'epp_proteccion'
  | 'servicios_hys_medicina'
  | 'capacitacion_formacion'
  | 'relevamientos_srt'
  | 'maquinaria_aparatos'
  | 'trabajos_criticos'
  | 'medio_ambiente';

export interface LegalRequirement {
  id: string;
  category: LegalRequirementCategory;
  categoryLabel: string;
  normative: string; // Ej: "Ley 19.587 / Dec. 351/79 Anexo I Cap. 14"
  articles: string; // Ej: "Arts. 95 a 102"
  jurisdiction: LegalJurisdiction;
  title: string;
  obligationDescription: string;
  requiredEvidence: string; // Qué documento o prueba objetiva se exige
  periodicity: 'anual' | 'semestral' | 'trimestral' | 'mensual' | 'por_evento' | 'permanente';
  status: ComplianceStatus;
  evidenceNotes?: string; // Lo que cargó el usuario: Ej: "Protocolo Res 900/15 N° 451/26"
  actionPlan?: string; // Plan correctivo si no cumple
  deadlineDate?: string; // YYYY-MM-DD
  responsiblePerson?: string; // Ej: "Jefe de Mantenimiento / Ing. Pérez"
  custom?: boolean;
}

export const CATEGORY_LABELS: Record<LegalRequirementCategory, { label: string; color: string; icon: string }> = {
  instalaciones_edilicia: { label: 'Instalaciones y Edilicia', color: '#64748b', icon: 'Building' },
  riesgo_electrico: { label: 'Riesgo Eléctrico y PAT', color: '#f59e0b', icon: 'Zap' },
  incendio_evacuacion: { label: 'Protección Contra Incendios', color: '#ef4444', icon: 'Flame' },
  iluminacion_color: { label: 'Iluminación y Color', color: '#eab308', icon: 'Sun' },
  ruido_vibraciones: { label: 'Ruido y Acústica Laboral', color: '#8b5cf6', icon: 'Volume2' },
  quimicos_ventilacion: { label: 'Químicos y Ventilación', color: '#ec4899', icon: 'Flask' },
  ergonomia_termico: { label: 'Ergonomía y Carga Térmica', color: '#3b82f6', icon: 'Activity' },
  epp_proteccion: { label: 'Elementos de Protección (EPP)', color: '#10b981', icon: 'ShieldCheck' },
  servicios_hys_medicina: { label: 'Servicios HyS y Medicina', color: '#06b6d4', icon: 'HeartPulse' },
  capacitacion_formacion: { label: 'Capacitación y Formación', color: '#6366f1', icon: 'GraduationCap' },
  relevamientos_srt: { label: 'Relevamientos Oficiales SRT', color: '#0ea5e9', icon: 'FileText' },
  maquinaria_aparatos: { label: 'Maquinaria y Autoelevadores', color: '#d97706', icon: 'Truck' },
  trabajos_criticos: { label: 'Trabajos de Alto Riesgo', color: '#dc2626', icon: 'AlertTriangle' },
  medio_ambiente: { label: 'Medio Ambiente y Residuos', color: '#059669', icon: 'Leaf' }
};

export const DEFAULT_LEGAL_REQUIREMENTS: LegalRequirement[] = [
  // 1. RIESGO ELÉCTRICO Y PAT
  {
    id: 'req-elec-01',
    category: 'riesgo_electrico',
    categoryLabel: 'Riesgo Eléctrico y PAT',
    normative: 'Resolución S.R.T. N° 900/15',
    articles: 'Protocolo Oficial Anexo I',
    jurisdiction: 'nacional',
    title: 'Medición de Puesta a Tierra y Continuidad de Masas',
    obligationDescription: 'Medición anual del valor de resistencia de puesta a tierra (máx 40 Ω / AEA 10 Ω), verificación de disyuntores diferenciales y continuidad de masas.',
    requiredEvidence: 'Protocolo oficial Res. 900/15 firmado con encomienda del colegio profesional y certificado de calibración del telurímetro.',
    periodicity: 'anual',
    status: 'conforme',
    evidenceNotes: 'Medición realizada conforme a Res. 900/15. Protocolo N° PAT-2026-01 con jabalinas conformes (<5 Ω).',
    responsiblePerson: 'Servicio de Higiene y Seguridad'
  },
  {
    id: 'req-elec-02',
    category: 'riesgo_electrico',
    categoryLabel: 'Riesgo Eléctrico y PAT',
    normative: 'Dec. 351/79 Anexo VI Cap. 14 / Reglamentación AEA 90364',
    articles: 'Arts. 95 a 102',
    jurisdiction: 'nacional',
    title: 'Protección de Tableros Eléctricos y Contratapas',
    obligationDescription: 'Tableros cerrados con cerradura o traba, contratapa o cubre-bornes de material aislante/policarbonato, señalización de peligro y puesta a tierra de puertas metálicas.',
    requiredEvidence: 'Relevamiento visual técnico e informe fotográfico en legajo de tableros.',
    periodicity: 'semestral',
    status: 'conforme',
    evidenceNotes: 'Todos los tableros principales y seccionales cuentan con contratapa reglamentaria y señal de advertencia de 380V/220V.',
    responsiblePerson: 'Mantenimiento Eléctrico'
  },

  // 2. PROTECCIÓN CONTRA INCENDIOS
  {
    id: 'req-inc-01',
    category: 'incendio_evacuacion',
    categoryLabel: 'Protección Contra Incendios',
    normative: 'Dec. 351/79 Anexo VII Cap. 18 / Norma IRAM 3517-II',
    articles: 'Arts. 160 a 187',
    jurisdiction: 'nacional',
    title: 'Dotación, Recarga Anual y Prueba Hidráulica de Extintores',
    obligationDescription: 'Dotación de matafuegos según carga de fuego y potencial extintor (mínimo 1 cada 200 m² o distancia máxima de 20 m). Recarga anual y prueba hidráulica quinquenal con tarjeta reglamentaria.',
    requiredEvidence: 'Marbetes de recarga vigentes, planilla de inventario con número de fabricación y sello IRAM de empresa recargadora habilitada.',
    periodicity: 'anual',
    status: 'conforme',
    evidenceNotes: '100% de la dotación recargada con marbete vigente. Vencimiento lote principal en noviembre 2026.',
    responsiblePerson: 'Responsable HyS'
  },
  {
    id: 'req-inc-02',
    category: 'incendio_evacuacion',
    categoryLabel: 'Protección Contra Incendios',
    normative: 'Dec. 351/79 Anexo VII / Ley 5920 CABA / Ley 19.587',
    articles: 'Art. 187',
    jurisdiction: 'nacional',
    title: 'Plan de Evacuación y Realización de Simulacros Periódicos',
    obligationDescription: 'Plan de autoprotección y evacuación documentado, roles de brigadistas definidos, planos de evacuación visibles y realización de al menos dos simulacros anuales.',
    requiredEvidence: 'Actas de simulacro de evacuación firmadas con tiempos de salida registrados y plano de evacuación con salidas de emergencia y punto de encuentro.',
    periodicity: 'semestral',
    status: 'conforme',
    evidenceNotes: 'Último simulacro realizado con tiempo de evacuación de 2 min 40 seg para 85 personas.',
    responsiblePerson: 'Comité de Emergencias'
  },
  {
    id: 'req-inc-03',
    category: 'incendio_evacuacion',
    categoryLabel: 'Protección Contra Incendios',
    normative: 'Dec. 351/79 Anexo VII / Cuadro 2.2.1',
    articles: 'Arts. 162 a 165',
    jurisdiction: 'nacional',
    title: 'Estudio Técnico Oficial de Carga de Fuego Ponderada',
    obligationDescription: 'Cálculo de madera equivalente (kg/m²) por sector de incendio para determinar la resistencia al fuego de muros portantes (RF) y demanda de agua contra incendios.',
    requiredEvidence: 'Memoria técnica de carga de fuego firmada por profesional matriculado con firma intervenida por colegio profesional.',
    periodicity: 'por_evento',
    status: 'conforme',
    evidenceNotes: 'Estudio vigente en legajo técnico. Sector productivo q = 24 kg/m² (Riesgo 3).',
    responsiblePerson: 'Asesor HyS'
  },

  // 3. ILUMINACIÓN Y COLOR
  {
    id: 'req-ilu-01',
    category: 'iluminacion_color',
    categoryLabel: 'Iluminación y Color',
    normative: 'Resolución S.R.T. N° 84/12 / Dec. 351/79 Cap. 12',
    articles: 'Protocolo Oficial Anexo I',
    jurisdiction: 'nacional',
    title: 'Medición de Nivel de Iluminación Laboral (Luxometría)',
    obligationDescription: 'Medición anual de los niveles de iluminancia en puestos y áreas de trabajo, comparación contra valores mínimos de tabla y cálculo de uniformidad ($E_m / E_{min}$).',
    requiredEvidence: 'Protocolo oficial Res. 84/12 con croquis de puntos medidos y certificado de calibración vigente del luxómetro.',
    periodicity: 'anual',
    status: 'conforme',
    evidenceNotes: 'Protocolo anual 84/12 realizado. Todos los sectores superan el umbral de 300/500 lux exigido.',
    responsiblePerson: 'Servicio HyS'
  },
  {
    id: 'req-ilu-02',
    category: 'iluminacion_color',
    categoryLabel: 'Iluminación y Color',
    normative: 'Dec. 351/79 Anexo IV / IRAM 10005',
    articles: 'Arts. 79 a 84',
    jurisdiction: 'nacional',
    title: 'Luces de Emergencia Autónomas y Señalización de Salidas',
    obligationDescription: 'Sistemas autónomos de iluminación de emergencia en vías de escape y puertas de egreso (autonomía mínima de 1.5 horas). Salidas señalizadas con pictogramas fotoluminiscentes.',
    requiredEvidence: 'Planilla de verificación mensual de accionamiento de luces de emergencia y corte de energía.',
    periodicity: 'mensual',
    status: 'conforme',
    evidenceNotes: 'Chequeo mensual de baterías de equipos autónomos realizado en fecha.',
    responsiblePerson: 'Mantenimiento'
  },

  // 4. RUIDO Y VIBRACIONES
  {
    id: 'req-rui-01',
    category: 'ruido_vibraciones',
    categoryLabel: 'Ruido y Acústica Laboral',
    normative: 'Resolución S.R.T. N° 85/12 / Res. MTEySS 295/03 Anexo V',
    articles: 'Protocolo Oficial Anexo I',
    jurisdiction: 'nacional',
    title: 'Medición de Nivel Sonoro Continuo Equivalente (NSCE / Leq)',
    obligationDescription: 'Evaluación anual de exposición a ruido en puestos donde se supere 80 dBA. Cálculo de dosis diaria de ruido (Límite: 85 dBA para 8 horas con tasa de intercambio de 3 dB).',
    requiredEvidence: 'Protocolo oficial Res. 85/12 con sonómetro integrador / dosímetro calibrado acústicamente antes y después de cada medición.',
    periodicity: 'anual',
    status: 'conforme',
    evidenceNotes: 'Medición anual efectuada. Puestos con Leq > 82 dBA identificados y provistos de EPP auditivo NRR 27.',
    responsiblePerson: 'Servicio HyS'
  },

  // 5. ERGONOMÍA Y ESFUERZO FÍSICO
  {
    id: 'req-ergo-01',
    category: 'ergonomia_termico',
    categoryLabel: 'Ergonomía y Carga Térmica',
    normative: 'Resolución S.R.T. N° 886/15',
    articles: 'Anexo I Planillas 1 y 2',
    jurisdiction: 'nacional',
    title: 'Protocolo de Ergonomía Laboral (Identificación de Factores de Riesgo)',
    obligationDescription: 'Relevamiento anual inicial de factores de riesgo ergonómico (levantamiento manual de cargas, empuje/tracción, movimientos repetitivos, posturas forzadas, bipedestación).',
    requiredEvidence: 'Planilla 1 y Planillas 2.A a 2.E oficiales de la Res. 886/15 suscriptas por profesional con posgrado o capacitación en ergonomía.',
    periodicity: 'anual',
    status: 'conforme',
    evidenceNotes: 'Planillas 1 y 2 completadas e incorporadas al legajo técnico anual.',
    responsiblePerson: 'Ergónomo / Servicio HyS'
  },
  {
    id: 'req-ergo-02',
    category: 'ergonomia_termico',
    categoryLabel: 'Ergonomía y Carga Térmica',
    normative: 'Res. MTEySS 295/03 Anexo II / Res. SRT 30/23',
    articles: 'Valores Límite Permisibles (VLP)',
    jurisdiction: 'nacional',
    title: 'Evaluación de Carga Térmica y Estrés por Calor / Frío (TGBH)',
    obligationDescription: 'Medición de Índice de Temperatura de Globo y Bulbo Húmedo (TGBH) en épocas estivales o puestos con fuentes radiantes. Régimen de trabajo-descanso y suministro de agua.',
    requiredEvidence: 'Protocolo oficial de estrés térmico con cálculo de gasto metabólico (kcal/h) y comprobante de provisión de agua fresca.',
    periodicity: 'semestral',
    status: 'conforme',
    evidenceNotes: 'Mediciones realizadas en sala de hornos y calderas con régimen de descanso 75/25 reglamentario.',
    responsiblePerson: 'Servicio HyS'
  },

  // 6. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)
  {
    id: 'req-epp-01',
    category: 'epp_proteccion',
    categoryLabel: 'Elementos de Protección (EPP)',
    normative: 'Resolución S.R.T. N° 299/11',
    articles: 'Arts. 1 a 4 / Formulario Oficial',
    jurisdiction: 'nacional',
    title: 'Constancia Oficial de Entrega de EPP y Ropa de Trabajo',
    obligationDescription: 'Registro individualizado por trabajador de cada EPP entregado con marca, modelo y certificación de seguridad (Sello IRAM / Marca de Conformidad).',
    requiredEvidence: 'Planillas individuales Res. 299/11 firmadas por cada operario ante cada entrega o reposición de EPP.',
    periodicity: 'por_evento',
    status: 'conforme',
    evidenceNotes: 'Trazabilidad digital activa con firmas registradas para el 100% de la nómina.',
    responsiblePerson: 'Responsable HyS'
  },

  // 7. SERVICIOS DE HYS Y MEDICINA LABORAL
  {
    id: 'req-serv-01',
    category: 'servicios_hys_medicina',
    categoryLabel: 'Servicios HyS y Medicina',
    normative: 'Decreto 1338/96 / Res. S.R.T. N° 905/15',
    articles: 'Arts. 1 a 15',
    jurisdiction: 'nacional',
    title: 'Asignación de Horas Profesionales de HyS y Medicina Laboral',
    obligationDescription: 'Cumplimiento de la carga horaria profesional obligatoria mensual según categoría del establecimiento (A, B o C) y cantidad de trabajadores equivalentes.',
    requiredEvidence: 'Libro de Actas foliado del Servicio de Higiene y Seguridad rubricado por la autoridad laboral con constancia de visitas y tareas.',
    periodicity: 'mensual',
    status: 'conforme',
    evidenceNotes: 'Horas mensuales profesionales cumplimentadas y asentadas en el Libro de Actas foliado.',
    responsiblePerson: 'Dirección / Asesor HyS'
  },
  {
    id: 'req-serv-02',
    category: 'servicios_hys_medicina',
    categoryLabel: 'Servicios HyS y Medicina',
    normative: 'Resolución S.R.T. N° 37/10',
    articles: 'Arts. 1 a 3',
    jurisdiction: 'nacional',
    title: 'Exámenes Médicos en Salud (Preocupacionales y Periódicos)',
    obligationDescription: 'Realización de exámenes preocupacionales a todos los ingresantes y exámenes periódicos anuales obligatorios (ESOP) coordinados con la ART para personal expuesto a agentes de riesgo.',
    requiredEvidence: 'Certificados de aptitud médica en legajos de personal y constancias de realización del ESOP de la ART.',
    periodicity: 'anual',
    status: 'en_proceso',
    evidenceNotes: 'Coordinando con la ART la fecha del operativo médico en planta para los 25 operarios expuestos.',
    actionPlan: 'Confirmar con la ART la visita del móvil sanitario antes del 30 de noviembre.',
    deadlineDate: '2026-11-30',
    responsiblePerson: 'Recursos Humanos / Médico Laboral'
  },

  // 8. CAPACITACIÓN Y FORMACIÓN
  {
    id: 'req-cap-01',
    category: 'capacitacion_formacion',
    categoryLabel: 'Capacitación y Formación',
    normative: 'Dec. 351/79 Cap. 21 / Dec. 911/96 Cap. 3',
    articles: 'Arts. 208 a 214',
    jurisdiction: 'nacional',
    title: 'Programa Anual de Capacitación en Prevención de Riesgos',
    obligationDescription: 'Confección y ejecución de un cronograma anual de capacitaciones en temas generales y específicos (extintores y evacuación, primeros auxilios, EPP, ergonomía, riesgos específicos).',
    requiredEvidence: 'Programa anual aprobado, actas de asistencia con temario, fecha, duración, evaluación y firma de los participantes.',
    periodicity: 'mensual',
    status: 'conforme',
    evidenceNotes: 'Cronograma anual 2026 en ejecución al 82% de cumplimiento acumulado.',
    responsiblePerson: 'Capacitador HyS'
  },

  // 9. RELEVAMIENTOS OFICIALES SRT (RGRL Y RAR)
  {
    id: 'req-srt-01',
    category: 'relevamientos_srt',
    categoryLabel: 'Relevamientos Oficiales SRT',
    normative: 'Resolución S.R.T. N° 463/09, 529/09 y 74/10',
    articles: 'Anexo I RGRL',
    jurisdiction: 'nacional',
    title: 'Relevamiento General de Riesgos Laborales (RGRL Anual)',
    obligationDescription: 'Confección y presentación anual ante la ART del formulario oficial de relevamiento de condiciones de higiene y seguridad de todos los establecimientos activos.',
    requiredEvidence: 'Formulario RGRL oficial presentado con sello de recepción o acuse electrónico de la ART.',
    periodicity: 'anual',
    status: 'conforme',
    evidenceNotes: 'Presentado ante la ART en término. Constancia archivada en legajo.',
    responsiblePerson: 'Responsable HyS'
  },
  {
    id: 'req-srt-02',
    category: 'relevamientos_srt',
    categoryLabel: 'Relevamientos Oficiales SRT',
    normative: 'Resolución S.R.T. N° 37/10 y 81/19',
    articles: 'Nómina de Personal Expuesto',
    jurisdiction: 'nacional',
    title: 'Nómina de Personal Expuesto a Agentes de Riesgo (RAR)',
    obligationDescription: 'Identificación y declaración anual de los trabajadores expuestos a agentes físicos, químicos, biológicos o ergonómicos según código de agente oficial de la SRT.',
    requiredEvidence: 'Planilla RAR con CUIL de trabajadores expuestos, código de agente, nivel de exposición y constancia de recepción de la ART.',
    periodicity: 'anual',
    status: 'conforme',
    evidenceNotes: 'Nómina RAR vigente presentada con códigos 80001 (Ruido), 90001 (Posiciones forzadas).',
    responsiblePerson: 'Responsable HyS'
  },

  // 10. MAQUINARIA Y AUTOELEVADORES
  {
    id: 'req-maq-01',
    category: 'maquinaria_aparatos',
    categoryLabel: 'Maquinaria y Autoelevadores',
    normative: 'Resolución S.R.T. N° 960/15',
    articles: 'Arts. 1 a 8 / Anexos I, II y III',
    jurisdiction: 'nacional',
    title: 'Operación Segura de Autoelevadores y Carnet Anual',
    obligationDescription: 'Capacitación teórico-práctica mínima de 10 hs, credencial habilitante anual para conductores, verificación preoperacional diaria obligatoria y mantenimiento preventivo.',
    requiredEvidence: 'Registro de credenciales habilitantes vigentes, planillas de check pre-operacional diario y libro de mantenimiento por horómetro.',
    periodicity: 'anual',
    status: 'conforme',
    evidenceNotes: 'Conductores habilitados con credencial SRT 960/15 al día y check pre-operacional digital implementado.',
    responsiblePerson: 'Jefe de Operaciones / HyS'
  },

  // 11. TRABAJOS DE ALTO RIESGO
  {
    id: 'req-crit-01',
    category: 'trabajos_criticos',
    categoryLabel: 'Trabajos de Alto Riesgo',
    normative: 'Resolución S.R.T. N° 61/23',
    articles: 'Protocolo Trabajo en Altura',
    jurisdiction: 'nacional',
    title: 'Permiso y Medidas de Protección para Trabajo en Altura (> 2m)',
    obligationDescription: 'Permiso de trabajo seguro en altura (PTSA), aptitud médica psicofísica específica para altura, arnés de cuerpo completo con absorbedor de impacto y puntos de anclaje certificados (22 kN).',
    requiredEvidence: 'Permisos PTSA firmados antes de cada tarea, certificados de arneses y líneas de vida, aptitudes médicas vigentes.',
    periodicity: 'por_evento',
    status: 'conforme',
    evidenceNotes: 'Procedimiento operativo vigente. Inspección previa de arneses y cabo de vida registrada.',
    responsiblePerson: 'Supervisor de Tarea / HyS'
  },
  {
    id: 'req-crit-02',
    category: 'trabajos_criticos',
    categoryLabel: 'Trabajos de Alto Riesgo',
    normative: 'Resolución S.R.T. N° 953/10',
    articles: 'Criterios de Entrada Segura',
    jurisdiction: 'nacional',
    title: 'Permiso de Ingreso a Espacios Confinados y Monitoreo de Gases',
    obligationDescription: 'Medición atmosférica previa y continua (O2, LEL, CO, H2S), vigía exterior permanente, bloqueo LOTO de energías y plan de rescate asistido sin ingreso.',
    requiredEvidence: 'Permiso de trabajo seguro en espacio confinado (PTSEC) con registro de valores de gases y firma del vigía y supervisor.',
    periodicity: 'por_evento',
    status: 'conforme',
    evidenceNotes: 'Detector multigás calibrado disponible con bomba de muestreo para trabajos en tanques y fosas.',
    responsiblePerson: 'Servicio HyS'
  },

  // 12. MEDIO AMBIENTE Y RESIDUOS
  {
    id: 'req-amb-01',
    category: 'medio_ambiente',
    categoryLabel: 'Medio Ambiente y Residuos',
    normative: 'Ley Nacional 24.051 / Leyes Provinciales de Residuos Peligrosos',
    articles: 'Arts. 1 a 22',
    jurisdiction: 'nacional',
    title: 'Gestión de Residuos Peligrosos y Manifiestos de Transporte',
    obligationDescription: 'Inscripción como generador, libro foliado de movimientos, acopio en sector estanco con contención de derrames y disposición final con manifiestos y certificados de destrucción.',
    requiredEvidence: 'Certificado de aptitud ambiental / número de generador vigente y manifiestos de retiro de operador habilitado con certificado de disposición final.',
    periodicity: 'semestral',
    status: 'conforme',
    evidenceNotes: 'Libro de residuos peligrosos al día (Corrientes Y8, Y9 e Y48). Último retiro con manifiesto oficial certificado.',
    responsiblePerson: 'Gestión Ambiental / HyS'
  }
];
