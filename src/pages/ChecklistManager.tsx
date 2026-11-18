import React, { useState, useEffect, useRef } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import {
  useNavigate, useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck, Printer, Plus,
  Settings, TriangleAlert, Building2, Calendar,
  Check, ShieldCheck, Trash2, Edit3, X,
  Share2, Save, ArrowLeft, ArrowRight, Info, Pencil, Camera,
  Flame, Zap, Siren, Lightbulb, Activity, CheckCircle2,
  Search, QrCode, Download, FileText, ClipboardList,
  HardHat, Ear, Eye as EyeIcon, Mic, Wrench, BookOpen, Pickaxe, Package, Tractor,
  ChevronDown, Sparkles, Layers, XCircle
} from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { downloadCSV } from '../services/exportCsv';
import QRModal from '../components/QRModal';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useLanguage } from '../contexts/LanguageContext';
import ShareModal from '../components/ShareModal';
import CompanyLogo from '../components/CompanyLogo';
import ChecklistPdfGenerator from '../components/ChecklistPdfGenerator';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { ModuleFormLayout, ModuleFormDocument, ModuleFormSection, ModuleActionBar, ModuleFormToolbar } from '../components/module';
import { generatePdfBlob, printElementAsDocument } from '../utils/pdfHelper';
import { savePdfBlob, getPdfBlob } from '../utils/indexedDBHelper';
import IndustryChecklistModal from '../components/IndustryChecklistModal';
import type { IndustryChecklistTemplate } from '../data/industryChecklists';
import { compressImage } from '../utils/imageCompressor';
import { safeSetLocalStorage, safeGetLocalStorage, safeJsonParse } from '../utils/storageHelper';

interface DefaultTemplateItem {
  title: string;
  category: 'construccion' | 'industria' | 'mineria' | 'general';
  icon: React.ReactElement;
  items: string[];
}

const DEFAULT_TEMPLATES: Record<string, DefaultTemplateItem> = {
  // ==========================================
  // CONSTRUCCIÓN (DEC. 911/96)
  // ==========================================
  'scaffolding': {
    title: 'Andamios y Estructuras',
    category: 'construccion',
    icon: <Building2 size={18} />,
    items: [
      'Apoyos sobre base firme y nivelada con durmientes de madera o placas base de acero',
      'Estructura libre de oxidación severa, deformaciones, fisuras ni soldaduras precarias',
      'Plataforma de trabajo completa, con tablones metálicos o de madera de 2 pulgadas trabados sin basculamiento',
      'Barandas reglamentarias completas a 1,00 m, baranda intermedia a 0,50 m y zócalos de 15 cm en todo el perímetro',
      'Arriostramiento a estructura fija cada 2 módulos para evitar volteo o pandeo lateral',
      'Escalera de acceso segura incorporada con peldaños antideslizantes'
    ]
  },
  'circular_saw': {
    title: 'Sierra Circular y Bancos de Corte',
    category: 'construccion',
    icon: <Wrench size={18} />,
    items: [
      'Resguardo retráctil o capota basculante cubre el disco y funciona suavemente',
      'Hoja de sierra sin dientes rotos, con filo adecuado y compatible con las RPM nominales',
      'Cuchillo divisor alineado detrás del disco y firmemente sujeto para evitar rechazos (kickback)',
      'Empujador de madera o polímero disponible para corte de piezas estrechas',
      'Botón de parada de emergencia tipo golpe de puño accesible y operable'
    ]
  },
  'trabajos_altura': {
    title: 'Trabajos en Altura & Líneas de Vida',
    category: 'construccion',
    icon: <TriangleAlert size={18} />,
    items: [
      'Arnés de seguridad de cuerpo entero con sello IRAM/AR certificado y costuras íntegras',
      'Cabo de vida doble en "Y" con amortiguador de caídas (absorbedor de impacto) intacto',
      'Puntos de anclaje certificados independientes capaces de resistir 22 kN (2260 kgf)',
      'Línea de vida horizontal/vertical certificada, con cable de acero tensado y grapas correctas',
      'Señalización, vallado perimetral y prohibición de tránsito en el nivel inferior a pie de obra',
      'Permiso de Trabajo Seguro en Altura (PTSA) autorizado y firmado en campo'
    ]
  },
  'izaje_gruas': {
    title: 'Grúas, Autogrúas y Maniobras de Izaje',
    category: 'construccion',
    icon: <Building2 size={18} />,
    items: [
      'Plan de izaje (Rigging Plan) calculado y verificado (tablas de carga, radios y pesos)',
      'Estabilizadores hidráulicos totalmente extendidos apoyados sobre durmientes de madera firme',
      'Eslingas sintéticas, cadenas y grilletes inspeccionados (sin roturas, estiramientos ni fisuras)',
      'Gancho de izaje con pestillo de seguridad operativo y sin apertura de garganta excesiva',
      'Radio de giro de la grúa acordonado impidiendo estrictamente el paso de personas bajo la carga',
      'Operador y Rigger (señalero) calificados con chalecos de alta visibilidad identificados'
    ]
  },
  'const_excavaciones': {
    title: 'Excavaciones, Zanjas y Submuraciones',
    category: 'construccion',
    icon: <HardHat size={18} />,
    items: [
      'Entibado, tablestacado o talud natural conforme al tipo de suelo en profundidades > 1,20 m',
      'Acopio de tierra excavada y materiales a más de 0,60 m de los bordes de la zanja',
      'Escaleras marineras de escape colocadas a intervalos menores a 15 metros en zanjas profundas',
      'Baranda perimetral de protección a 1 metro de altura y señalización nocturna luminosa',
      'Verificación de interferencias de cañerías de gas, agua o conductores eléctricos subterráneos'
    ]
  },
  'const_demolicion': {
    title: 'Demolición y Derribo de Estructuras',
    category: 'construccion',
    icon: <HardHat size={18} />,
    items: [
      'Desconexión y corte efectivo de servicios (gas natural, electricidad, agua y cloacas)',
      'Apuntalamiento preventivo de muros linderos y estructuras adyacentes potencialmente inestables',
      'Conductos cerrados o canaletas de descarga para evacuación segura de escombros',
      'Lona antipolvo y humectación continua para supresión de polvo particulado respirable',
      'Uso estricto de casco, calzado dieléctrico con plantilla de acero, antiparras y arnés si aplica'
    ]
  },

  // ==========================================
  // INDUSTRIA & METALMECÁNICA (DEC. 351/79)
  // ==========================================
  'manual_tools': {
    title: 'Herramientas Manuales',
    category: 'industria',
    icon: <Plus size={18} />,
    items: [
      'Mangos de madera o fibra en buen estado (sin fisuras, astillas ni holguras)',
      'Cabezas de herramientas de golpe (martillos, cortafríos) sin rebabas ni hongos metálicos',
      'Herramientas limpias, secas y libres de lubricantes o grasas resbaladizas',
      'Sin oxidación profunda que debilite la resistencia estructural de la herramienta',
      'Filo protegido con fundas y almacenamiento en paneles o cajas portaherramientas'
    ]
  },
  'electric_tools': {
    title: 'Herramientas Eléctricas Portátiles',
    category: 'industria',
    icon: <Settings size={18} />,
    items: [
      'Cables de alimentación con doble aislación, sin cortes, peladuras ni empalmes encintados',
      'Ficha macho normalizada de 3 espigas planas con puesta a tierra o doble aislación clase II',
      'Carcasa plástica o metálica sin fisuras, fracturas ni tornillos de ensamble faltantes',
      'Gatillo interruptor con resorte que desconecta la energía automáticamente al soltarlo',
      'Protecciones, resguardos y empuñaduras laterales originales fijadas firmemente'
    ]
  },
  'grinder': {
    title: 'Amoladora Angular y Discos Abrasivos',
    category: 'industria',
    icon: <TriangleAlert size={18} />,
    items: [
      'Guarda protectora metálica cubre como mínimo 180° del disco abrasivo',
      'Mango lateral antivibratorio colocado firmemente en la carcasa',
      'Velocidad nominal máxima del disco abrasivo (RPM) mayor o igual a las RPM de la máquina',
      'Disco sin melladuras, golpes, fisuras ni vencimiento de fecha de fabricación excedida',
      'Uso obligatorio de protección facial integral de policarbonato además de lentes de seguridad'
    ]
  },
  'orden_limpieza': {
    title: 'Orden y Limpieza 5S en Planta',
    category: 'industria',
    icon: <Trash2 size={18} />,
    items: [
      'Pasillos peatonales y vías de circulación vehicular claramente demarcadas y 100% despejadas',
      'Pisos secos, libres de virutas, recortes metálicos, charcos de aceite o sustancias deslizantes',
      'Materiales, piezas y herramientas ubicados en sus racks o casilleros correspondientes',
      'Disposición diferenciada de residuos con contenedores rotulados e ignífugos para trapos empapados',
      'Accesos frontales a extintores, tableros y estaciones de emergencia libres en 1 metro a la redonda'
    ]
  },
  'tableros_electricos': {
    title: 'Tableros e Instalaciones Eléctricas',
    category: 'industria',
    icon: <Zap size={18} />,
    items: [
      'Gabinete cerrado con llave, contrafrente cubrecables colocado y señal de riesgo eléctrico visible',
      'Interruptor diferencial (disyuntor) operativo con verificación del botón de prueba (test)',
      'Termomagnéticas calibradas adecuadamente según sección de conductores, sin signos de sobrecalentamiento',
      'Conductor de protección de puesta a tierra (verde-amarillo) conectado sólidamente a la bornera',
      'Identificación unifilar legible de circuitos e interruptores en el frente del tablero'
    ]
  },
  'autoelevadores': {
    title: 'Autoelevadores & Clarke (Res. 960/15)',
    category: 'industria',
    icon: <Settings size={18} />,
    items: [
      'Cinturón de seguridad de 2 o 3 puntos colocado y operativo',
      'Freno de servicio (pedal) y freno de estacionamiento de mano retienen con carga en rampa',
      'Alarma sonora de marcha atrás y baliza destellante estroboscópica operativa',
      'Horquillas sin deformaciones, sin fisuras en los talones y con pasadores de traba colocados',
      'Estructura de protección contra caída de objetos (FOPS) y antivuelco (ROPS) en perfecto estado',
      'Matafuegos triclase ABC de 2,5 o 5 kg con precinto y manómetro en verde instalado en el soporte'
    ]
  },
  'trabajos_caliente': {
    title: 'Soldadura, Oxicorte y Trabajos en Caliente',
    category: 'industria',
    icon: <Flame size={18} />,
    items: [
      'Permiso de Trabajo en Caliente (PTC) emitido con medición de atmósferas explosivas si aplica',
      'Extintor triclase ABC de 10 kg cargado y presurizado a menos de 5 metros de la operación',
      'Retiro o cobertura con mantas ignífugas certificadas de materiales combustibles en radio de 10 m',
      'Mamparas ignífugas para protección visual de trabajadores circundantes contra rayos UV/IR',
      'Cilindros de gases comprimidos encadenados en posición vertical y mangueras con arrestallamas en ambos extremos'
    ]
  },
  'productos_quimicos': {
    title: 'Sustancias Químicas y Matriz SGA/GHS',
    category: 'industria',
    icon: <Activity size={18} />,
    items: [
      'Hojas de Datos de Seguridad (FDS / MSDS) en idioma español disponibles en el puesto de trabajo',
      'Recipientes rotulados con pictogramas de peligro, palabras de advertencia e indicaciones de peligro SGA',
      'Almacenamiento sobre bateas de retención o pallets antiderrame con capacidad para el 110% del envase mayor',
      'Separación física según matriz de incompatibilidad química (ácidos lejos de bases, inflamables de comburentes)',
      'Kit para control de derrames equipado y duchas de emergencia / lavaojos con caudal probado semanalmente'
    ]
  },
  'espacios_confinados': {
    title: 'Espacios Confinados (Res. 295/03)',
    category: 'industria',
    icon: <ShieldCheck size={18} />,
    items: [
      'Permiso de ingreso confeccionado, firmado y exhibido en el acceso al recinto',
      'Medición atmosférica previa y continua (Oxígeno 19,5% a 23,5%, explosividad LEL 0%, gases tóxicos CO y H2S)',
      'Ventilación forzada continua con caudal suficiente hacia el fondo del recinto',
      'Vigía exterior permanente con radio y protocolo de rescate no invasivo coordinado',
      'Operador equipado con arnés, línea de vida sujeta a trípode de rescate y malacate exterior'
    ]
  },
  'ind_loto_bloqueo': {
    title: 'Bloqueo, Consignación y Etiquetado (LOTO)',
    category: 'industria',
    icon: <ShieldCheck size={18} />,
    items: [
      'Desconexión total y corte visible de todas las fuentes de energía (eléctrica, neumática, hidráulica, gravitatoria)',
      'Colocación de candado de consignación personal e intransferible con llave única por operario',
      'Tarjeta de advertencia LOTO colocada con nombre del técnico, motivo y fecha visible',
      'Disipación y purga de presiones residuales acumuladas en cilindros, cañerías o acumuladores',
      'Prueba de "Cero Energía" pulsando los comandos de marcha locales para comprobar la desenergización'
    ]
  },

  // ==========================================
  // MINERÍA (DEC. 249/07)
  // ==========================================
  'min_ventilacion': {
    title: 'Ventilación y Atmósfera en Minas Subterráneas',
    category: 'mineria',
    icon: <Pickaxe size={18} />,
    items: [
      'Concentración de oxígeno en aire medida en frentes de trabajo superior o igual a 19,5% en volumen',
      'Medición de monóxido de carbono (CO < 25 ppm) y óxidos de nitrógeno (NO2 < 3 ppm) tras tronaduras y tránsito diésel',
      'Ventiladores principales y secundarios operando de forma continua con caudal acorde al personal y equipos',
      'Mangas de ventilación secundaria extendidas a menos de 15 metros del frente ciego de avance sin fugas',
      'Detector portátil multigás calibrado y en servicio activo portado por el supervisor o capataz de frente'
    ]
  },
  'min_fortificacion': {
    title: 'Sostenimiento, Acuñadura y Fortificación',
    category: 'mineria',
    icon: <Pickaxe size={18} />,
    items: [
      'Acuñadura / desatado sistemático de rocas sueltas en techo y hastiales realizado antes de ingresar',
      'Pernos de sostenimiento (helicoidales, split sets o cables) colocados según la malla geotécnica aprobada',
      'Malla electrosoldada tensada, adosada a la roca y asegurada con planchuelas con torque reglamentario',
      'Hormigón proyectado (shotcrete) sin fisuras abiertas, desprendimientos laminares ni filtraciones severas',
      'Prohibición terminante de permanencia o circulación de personal bajo frentes sin acuñar o fortificar'
    ]
  },
  'min_voladuras': {
    title: 'Manejo de Explosivos, Polvorines y Tronaduras',
    category: 'mineria',
    icon: <Pickaxe size={18} />,
    items: [
      'Vehículo de transporte de explosivos habilitado por ANMaC con puesta a tierra, extintores y parachispas',
      'Separación física estricta entre detonadores/iniciadores y altos explosivos en transporte y polvorines',
      'Personal manipulador con carnet de polvorillero / dinamitero habilitado por autoridad minera',
      'Despeje y evacuación total del radio de influencia con loros vivos (vigías) en todos los accesos',
      'Toque de sirena de voladura reglamentario en tres tiempos y verificación posterior de tiros quedados'
    ]
  },
  'min_equipos_pesados': {
    title: 'Equipos Pesados de Minería (Dumpers, Scoops, Palas)',
    category: 'mineria',
    icon: <Pickaxe size={18} />,
    items: [
      'Sistema automático y manual de supresión de incendios (Ansul) presurizado y con precintos intactos',
      'Frenos de servicio, retardador dinámico y freno de estacionamiento verificados con carga nominal',
      'Dirección secundaria / acumulador de dirección de emergencia operativo ante corte repentino del motor',
      'Cabina con estructura certificada ROPS/FOPS contra vuelcos y caída de rocas con cinturón de 3 puntos',
      'Radio bidireccional operativa en frecuencia de mina, pértiga con baliza estroboscópica y alarma de retroceso'
    ]
  },
  'min_diques_chancado': {
    title: 'Plantas de Tratamiento, Chancado y Relaves',
    category: 'mineria',
    icon: <Pickaxe size={18} />,
    items: [
      'Cordones de parada de emergencia (cable pull switch) a lo largo de toda la extensión de las cintas transportadoras',
      'Sistemas de captación y supresión de polvo sílice en tolvas de recepción y trituradores',
      'Resguardos fijos en tambores de accionamiento y rodillos de retorno que impidan atrapamiento',
      'Estaciones de emergencia de neutralización de reactivos químicos con duchas y lavaojos probados semanalmente',
      'Nivel de revancha libre (freeboard) del dique de colas conforme al diseño hidrológico registrado'
    ]
  },

  // ==========================================
  // GENERALES, EDIFICIOS & EPP
  // ==========================================
  'epp': {
    title: 'Elementos de Protección Personal (EPP)',
    category: 'general',
    icon: <ShieldCheck size={18} />,
    items: [
      'Casco de seguridad sin fisuras, golpes severos y con arnés/tafilete correctamente regulado',
      'Protección visual/facial limpia, sin rayaduras que distorsionen y con sello de impacto certificado',
      'Protección auditiva adecuada al nivel sonoro del área (tapones o copas) limpia e higiénica',
      'Guantes de protección específicos según riesgo mecánico, térmico, químico o dieléctrico',
      'Calzado de seguridad con puntera de acero/composite, suela antideslizante y dieléctrica si aplica',
      'Ropa de trabajo ignífuga o de alta visibilidad según tarea, sin partes sueltas ni rasgaduras'
    ]
  },
  'extintores_checklist': {
    title: 'Matafuegos y Extintores Portátiles',
    category: 'general',
    icon: <Flame size={18} />,
    items: [
      'Extintor en su soporte reglamentario entre 1,20 m y 1,50 m del suelo señalizado con chapa baliza',
      'Manómetro con aguja indicadora en la zona verde de presión nominal de trabajo',
      'Tarjeta de recarga anual vigente con sello DPS / IRAM y prueba hidráulica dentro de los 5 años',
      'Acceso al extintor completamente despejado en 1 metro frontal sin cajas ni objetos',
      'Cuerpo del extintor sin abolladuras, corrosión ni manguera resquebrajada, precinto y pasador intactos'
    ]
  },
  'salida_emergencia': {
    title: 'Salidas de Emergencia y Vías de Escape',
    category: 'general',
    icon: <Siren size={18} />,
    items: [
      'Vías de evacuación y pasillos libres de mercadería, obstáculos o cables en todo su ancho útil',
      'Puertas de emergencia abren hacia el sentido de evacuación sin cerrojos ni llaves puestas',
      'Barral antipánico operativo y suave en su accionamiento con simple empuje del cuerpo',
      'Cartelería de señalización de salida fotoluminiscente visible desde cualquier ángulo de visión',
      'Salida exterior final a punto de reunión libre de acumulaciones de vehículos o materiales'
    ]
  },
  'luces_emergencia': {
    title: 'Luces de Emergencia Autónomas',
    category: 'general',
    icon: <Lightbulb size={18} />,
    items: [
      'Equipo conectado a la red eléctrica con testigo LED de carga de batería encendido',
      'Prueba de simulación de corte de energía satisfactoria (encendido instantáneo de luminarias)',
      'Autonomía de batería suficiente (mínimo 1 hora de funcionamiento ininterrumpido)',
      'Luminarias fijadas firmemente orientadas hacia escaleras, cambios de nivel y puertas de escape',
      'Difusores y carcasas limpios de polvo o suciedad que atenúen el flujo luminoso'
    ]
  },
  'botiquin': {
    title: 'Botiquín de Primeros Auxilios',
    category: 'general',
    icon: <Activity size={18} />,
    items: [
      'Gabinete señalizado con cruz verde o roja, accesible y sin candado o llave',
      'Contenido básico completo (gasas estériles, apósitos, vendas elásticas, apósitos adhesivos, antisépticos)',
      'Elementos y soluciones desinfectantes dentro de su fecha de vencimiento vigente',
      'Presencia de guantes descartables de látex o nitrilo y tijera corta trauma listos para uso',
      'Teléfonos de emergencia de ART, ambulancia y bomberos pegados en el frente del botiquín'
    ]
  },
  'ergonomia_oficina': {
    title: 'Ergonomía en Oficinas y PVD (Res. 886/15)',
    category: 'general',
    icon: <Activity size={18} />,
    items: [
      'Borde superior de la pantalla del monitor situado a la altura o ligeramente bajo el nivel de los ojos',
      'Distancia entre el operador y la pantalla adecuada (entre 50 cm y 70 cm)',
      'Silla ergonómica regulable con respaldo que ofrece apoyo lumbar firme y base de 5 ramas con ruedas',
      'Teclado y mouse ubicados en el mismo plano dejando espacio anterior para reposo de muñecas',
      'Luminarias orientadas adecuadamente sin generar reflejos directos sobre la pantalla de trabajo'
    ]
  },
  'audit_2026': {
    title: 'Relevamiento Legal SRT 2026',
    category: 'general',
    icon: <ShieldCheck size={18} />,
    items: [
      'Todos los EPP cuentan con certificación vigente y Sello "AR" con código QR trazable (Res. SIyC 18/25)',
      'Se verifican los certificados médicos de "Apto Calor" e hidratación según Res. SRT 30/2023',
      'Protocolos de ergonomía adecuados a la Res. SRT 7/2026 y Res. 886/15',
      'Declaración Jurada de Riesgos del Trabajo anual presentada ante la ART (Res. SRT 45/2026)',
      'Evaluación y plan de intervención de riesgos psicosociales y salud mental implementado (Res. SRT 28/2026 y 8/2026)',
      'Procedimiento de recolección de pruebas ante Comisiones Médicas adecuado a Res. SRT 5/2026'
    ]
  },
  'general_audit': {
    title: 'Relevamiento General de Empresa / Planta',
    category: 'general',
    icon: <Building2 size={18} />,
    items: [
      'Orden y Limpieza: Pasillos, accesos y vías de circulación despejadas y libres de obstáculos',
      'Protección contra Incendios: Extintores con carga vigente, señalizados y sin obstrucciones frontales',
      'Seguridad Eléctrica: Tableros cerrados, señalizados, con disyuntor y puesta a tierra efectiva',
      'Medios de Escape: Puertas abren hacia el exterior con barral antipánico y luces de emergencia operativas',
      'Equipos Móviles: Autoelevadores con luces, bocina, alarma de marcha atrás y cinturón de seguridad',
      'Primeros Auxilios: Botiquín completo, accesible y teléfonos de emergencia visibles',
      'Uso de EPP: Personal utiliza obligatoriamente calzado de seguridad, casco y protección auditiva/visual según área'
    ]
  }
};

const MANDATORY_SECTIONS = [
{
  id: 'epp', title: 'Elementos de Protección Personal (EPP)', items: [
  'Casco de seguridad con barbijofle',
  'Proteccion ocular / facial',
  'Calzado de seguridad con puntera',
  'Proteccion auditiva',
  'Guantes adecuados a la tarea']

},
{
  id: 'entorno', title: 'Condiciones del Entorno', items: [
  'Iluminacion adecuada',
  'Orden y limpieza del sector',
  'Extintor de incendios cercano',
  'Señalización de seguridad']

}];


// Normativas aplicables por país (Mercosur + Chile)
const NORMS_BY_COUNTRY = {
  argentina: [
  { id: 'ley19587', name: 'Ley 19.587 - Higiene y Seguridad en el Trabajo', category: 'Nacional' },
  { id: 'dec351', name: 'Decreto 351/79 - Reglamento General de H&S', category: 'Nacional' },
  { id: 'ley24557', name: 'Ley 24.557 - Riesgos del Trabajo (LRT)', category: 'Nacional' },
  { id: 'dec911', name: 'Decreto 911/96 - Industria de la Construcción', category: 'Nacional' },
  { id: 'dec249', name: 'Decreto 249/07 - Minería e Instalaciones Subterráneas', category: 'Nacional' },
  { id: 'dec617', name: 'Decreto 617/97 - Actividad Agraria', category: 'Nacional' },
  { id: 'dec1338', name: 'Decreto 1338/96 - Servicios de Medicina y de H&S', category: 'Nacional' },
  { id: 'res905', name: 'Res. SRT 905/15 - Funciones Servicios H&S', category: 'SRT' },
  { id: 'res886', name: 'Res. SRT 886/15 - Protocolo de Ergonomía', category: 'SRT' },
  { id: 'res85_84', name: 'Res. SRT 85/12 y 84/12 - Protocolos Ruido/Iluminación', category: 'SRT' },
  { id: 'res481', name: 'Res. SRT 481/16 - Estiba y Desestiba', category: 'SRT' },
  { id: 'res299', name: 'Res. SRT 299/11 - Trabajo en Altura / EPP', category: 'SRT' },
  { id: 'res295', name: 'Res. SRT 295/03 - Espacios Confinados / Contaminantes', category: 'SRT' },
  { id: 'res101', name: 'Res. SRT 101/17 - Soldadura', category: 'SRT' },
  { id: 'res594', name: 'Res. SRT 594/15 - Agentes Químicos', category: 'SRT' },
  { id: 'res_srt_45_2026', name: 'Res. SRT 45/2026 - Declaración Jurada de Riesgos', category: 'SRT' },
  { id: 'res_srt_28_2026', name: 'Res. SRT 28/2026 - Prevención de Riesgos Psicosociales', category: 'SRT' },
  { id: 'res_srt_8_2026', name: 'Res. SRT 8/2026 - Protocolo de Salud Mental', category: 'SRT' },
  { id: 'res_srt_7_2026', name: 'Res. SRT 7/2026 - Valoración del Daño Corporal', category: 'SRT' },
  { id: 'res_srt_30_2023', name: 'Res. SRT 30/23 - Estrés por Calor', category: 'SRT' },
  { id: 'res_siyc_18_25', name: 'Res. SIyC 18/25 - Certificación y Marcado AR en EPP', category: 'Nacional' },
  { id: 'art_reglamento', name: 'Reglamento Interno de ART', category: 'ART' }],

  chile: [
  { id: 'dl109', name: 'D.L. 109/1970 - Código del Trabajo', category: 'Nacional' },
  { id: 'dec594', name: 'Decreto 594/1999 - Condiciones Sanitarias', category: 'Ministerio Salud' },
  { id: 'dec40', name: 'Decreto 40/1969 - Reglamento Higiene y Seguridad', category: 'Ministerio Trabajo' },
  { id: 'dec32', name: 'Decreto 32/2014 - Elementos Protección Personal', category: 'Ministerio Trabajo' },
  { id: 'ley16744', name: 'Ley 16.744 - Accidentes del Trabajo', category: 'Nacional' },
  { id: 'dec109', name: 'Decreto 109/2012 - Trabajo en Altura', category: 'Ministerio Trabajo' },
  { id: 'dec118', name: 'Decreto 118/2020 - Espacios Confinados', category: 'Ministerio Trabajo' },
  { id: 'mutual', name: 'Reglamento Mutual de Seguridad', category: 'Mutual' }],

  uruguay: [
  { id: 'dec351_uy', name: 'Decreto 351/007 - Reglamento de Higiene y Seguridad', category: 'Nacional' },
  { id: 'ley18320', name: 'Ley 18.320 - Accidentes de Trabajo', category: 'Nacional' },
  { id: 'dec488', name: 'Decreto 488/013 - Trabajo en Altura', category: 'MTSS' },
  { id: 'dec182', name: 'Decreto 182/018 - Espacios Confinados', category: 'MTSS' },
  { id: 'bps', name: 'Normativa BPS - Seguros de Accidentes', category: 'BPS' }],

  bolivia: [
  { id: 'ley548', name: 'Ley 548 - Código Niña, Niño y Adolescente', category: 'Nacional' },
  { id: 'dec16998', name: 'Decreto Supremo 16998 - Seguridad Industrial', category: 'Nacional' },
  { id: 'dec24266', name: 'Decreto Supremo 24266 - Reglamento Higiene y Seguridad', category: 'Nacional' },
  { id: 'res068', name: 'Res. Min. 068/94 - Salud Ocupacional', category: 'Ministerio Salud' },
  { id: 'cnss', name: 'Reglamento CNSS - Seguridad Social', category: 'CNSS' }],

  paraguay: [
  { id: 'ley213', name: 'Ley 213/93 - Seguridad y Salud en el Trabajo', category: 'Nacional' },
  { id: 'dec14390', name: 'Decreto 14.390/92 - Reglamento General Técnico de SST', category: 'Nacional' },
  { id: 'ley5804', name: 'Ley 5804/17 - Sistema Nacional de Prevención de Riesgos Laborales', category: 'MTESS' },
  { id: 'ips', name: 'Reglamento IPS - Instituto de Previsión Social', category: 'IPS' }],

  brasil: [
  { id: 'clt_sst', name: 'CLT Cap. V (Ley 6.514/77) - Seguridad y Medicina del Trabajo', category: 'Federal' },
  { id: 'nr01', name: 'NR-01 - Disposições Gerais e Gerenciamento de Riscos (PGR)', category: 'MTE' },
  { id: 'nr06', name: 'NR-06 - Equipamento de Proteção Individual (EPI)', category: 'MTE' },
  { id: 'nr10', name: 'NR-10 - Segurança em Instalações e Serviços em Eletricidade', category: 'MTE' },
  { id: 'nr12', name: 'NR-12 - Segurança no Trabalho em Máquinas e Equipamentos', category: 'MTE' },
  { id: 'nr18', name: 'NR-18 - Segurança na Indústria da Construção', category: 'MTE' },
  { id: 'nr33', name: 'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados', category: 'MTE' },
  { id: 'nr35', name: 'NR-35 - Trabalho em Altura', category: 'MTE' }],

  mexico: [
  { id: 'lft_rfshmat', name: 'Ley Federal del Trabajo y Reglamento Federal de SST', category: 'Federal' },
  { id: 'nom001', name: 'NOM-001-STPS - Edificios, Locales e Instalaciones', category: 'STPS' },
  { id: 'nom002', name: 'NOM-002-STPS - Prevención y Protección contra Incendios', category: 'STPS' },
  { id: 'nom004', name: 'NOM-004-STPS - Sistemas de Protección en Maquinaria', category: 'STPS' },
  { id: 'nom009', name: 'NOM-009-STPS - Trabajos en Altura', category: 'STPS' },
  { id: 'nom017', name: 'NOM-017-STPS - Equipo de Protección Personal (EPP)', category: 'STPS' },
  { id: 'nom029', name: 'NOM-029-STPS - Mantenimiento de Instalaciones Eléctricas', category: 'STPS' },
  { id: 'nom031', name: 'NOM-031-STPS - Construcción', category: 'STPS' },
  { id: 'nom033', name: 'NOM-033-STPS - Trabajos en Espacios Confinados', category: 'STPS' }],

  espana: [
  { id: 'ley31_1995', name: 'Ley 31/1995 - Prevención de Riesgos Laborales (LPRL)', category: 'Nacional' },
  { id: 'rd39_1997', name: 'RD 39/1997 - Reglamento de los Servicios de Prevención', category: 'INSST' },
  { id: 'rd486_1997', name: 'RD 486/1997 - Lugares de Trabajo', category: 'INSST' },
  { id: 'rd773_1997', name: 'RD 773/1997 - Equipos de Protección Individual (EPI)', category: 'INSST' },
  { id: 'rd1215_1997', name: 'RD 1215/1997 - Equipos de Trabajo y Maquinaria', category: 'INSST' },
  { id: 'rd614_2001', name: 'RD 614/2001 - Riesgo Eléctrico', category: 'INSST' },
  { id: 'rd1627_1997', name: 'RD 1627/1997 - Obras de Construcción', category: 'INSST' }],

  usa_osha: [
  { id: 'osha_1910', name: 'OSHA 29 CFR 1910 - General Industry Standards', category: 'OSHA' },
  { id: 'osha_1926', name: 'OSHA 29 CFR 1926 - Construction Standards', category: 'OSHA' },
  { id: 'osha_1910_147', name: '29 CFR 1910.147 - The Control of Hazardous Energy (LOTO)', category: 'OSHA' },
  { id: 'osha_1910_146', name: '29 CFR 1910.146 - Permit-Required Confined Spaces', category: 'OSHA' },
  { id: 'osha_1926_501', name: '29 CFR 1926.501 - Duty to Have Fall Protection', category: 'OSHA' }],

  iso_global: [
  { id: 'iso45001_main', name: 'ISO 45001:2018 - Sistemas de Gestión de la SST', category: 'ISO' },
  { id: 'iso45003', name: 'ISO 45003:2021 - Riesgos Psicosociales en el Trabajo', category: 'ISO' },
  { id: 'oit_c155', name: 'Convenio OIT 155 y 187 - Seguridad y Salud de los Trabajadores', category: 'OIT' }],

  internacional: [
  { id: 'iso45001', name: 'ISO 45001:2018 - Sistema de Gestión SST', category: 'ISO' },
  { id: 'iso14001', name: 'ISO 14001 - Gestión Ambiental', category: 'ISO' },
  { id: 'iso9001', name: 'ISO 9001 - Gestión de Calidad', category: 'ISO' },
  { id: 'nfpa10', name: 'NFPA 10 - Extintores Portátiles', category: 'NFPA' },
  { id: 'nfpa30', name: 'NFPA 30 - Líquidos Inflamables y Combustibles', category: 'NFPA' },
  { id: 'nfpa70e', name: 'NFPA 70E - Seguridad Eléctrica', category: 'NFPA' },
  { id: 'nfpa101', name: 'NFPA 101 - Código de Seguridad Humana', category: 'NFPA' },
  { id: 'oshact', name: 'OSHA Act - Seguridad y Salud Ocupacional', category: 'OSHA' },
  { id: 'ansi_z89', name: 'ANSI Z89.1 - Requisitos para cascos', category: 'ANSI' },
  { id: 'ansi_z87', name: 'ANSI Z87.1 - Protección ocular y facial', category: 'ANSI' }]

};

// Función para obtener normativas según el país
const getNormsForCountry = (country) => {
  const countryNorms = NORMS_BY_COUNTRY[country] || [];
  const internationalNorms = NORMS_BY_COUNTRY.internacional || [];
  return [...countryNorms, ...internationalNorms];
};

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar registro?"
      message="Esta acción no se puede deshacer."
      iconEmoji="🗑️" />);


}

const getChecklistStatus = (id: string, fallbackItem?: any) => {
  let parsed: any = safeGetLocalStorage(`checklist_${id}`, null);
  if (!parsed || (!parsed.activeSections && !parsed.items && !parsed.checks)) {
    if (fallbackItem && (fallbackItem.activeSections || fallbackItem.items || fallbackItem.checks)) {
      parsed = fallbackItem;
    } else {
      const hist = safeGetLocalStorage<any[]>('tool_checklists_history', []);
      parsed = hist.find((h: any) => h.id === id);
    }
  }
  if (!parsed) return { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.12)', ok: 0, total: 0, pct: 100 };
  try {
    let items = parsed.items || parsed.checks || [];
    if (parsed.activeSections) {
      items = parsed.activeSections.flatMap((s: any) => s.items || []);
    } else if (!Array.isArray(items) && Object.keys(items).length > 0) {
      items = Object.values(items);
    }

    const arr = Array.isArray(items) ? items : [];
    const ok = arr.filter((c: any) => c.status === 'OK' || c.status === 'CUMPLE' || c.value === 'SI' || c.estado === 'SI').length;
    const nok = arr.filter((c: any) => c.status === 'NC' || c.status === 'FAIL' || c.value === 'NO' || c.estado === 'NO' || c.checked === false || c.result === 'no').length;
    const na = arr.filter((c: any) => c.status === 'NA').length;
    const obs = arr.filter((c: any) => c.observation || c.observacion || c.observaciones).length;
    const eligible = Math.max(0, arr.length - na);
    const pct = eligible > 0 ? Math.round((ok / eligible) * 100) : arr.length > 0 ? Math.round((ok / arr.length) * 100) : 100;

    if (arr.length === 0) return { label: 'Sin Ítems', color: '#64748b', bg: 'rgba(100,116,139,0.12)', ok: 0, total: 0, pct: 0 };
    if (nok > 0) return { label: 'Rechazado', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', ok, total: arr.length, pct };
    if (obs > 0 || (parsed.actionPlan && parsed.actionPlan.length > 0)) return { label: 'Con Obs.', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', ok, total: arr.length, pct };
    return { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.12)', ok, total: arr.length, pct };
  } catch {
    return { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.12)', ok: 0, total: 0, pct: 100 };
  }
};

const EPP_CATALOG_OPTIONS = [
  { id: 'casco', label: 'Casco de Seguridad', norm: 'IRAM 3620', icon: HardHat },
  { id: 'calzado', label: 'Calzado de Seguridad', norm: 'IRAM 3610', icon: ShieldCheck },
  { id: 'anteojos', label: 'Protección Ocular', norm: 'IRAM 3630', icon: EyeIcon },
  { id: 'protector_facial', label: 'Protector Facial Integral', norm: 'ANSI Z87.1', icon: ShieldCheck },
  { id: 'auditiva', label: 'Protección Auditiva', norm: 'IRAM 4060', icon: Ear },
  { id: 'guantes', label: 'Guantes de Protección', norm: 'IRAM 3607', icon: ShieldCheck },
  { id: 'guantes_dielectricos', label: 'Guantes Dieléctricos', norm: 'IRAM 3604', icon: Zap },
  { id: 'arnes', label: 'Arnés Anticaídas', norm: 'IRAM 3622-1', icon: Activity },
  { id: 'respiratoria', label: 'Protección Respiratoria', norm: 'IRAM 3648', icon: Activity },
  { id: 'chaleco', label: 'Chaleco Reflectivo', norm: 'EN 20471', icon: Flame },
  { id: 'calzado_dielectrico', label: 'Calzado Dieléctrico', norm: 'ASTM F2413', icon: Zap },
  { id: 'ropa_ignifuga', label: 'Ropa de Trabajo / Ignífuga', norm: 'NFPA 2112', icon: Flame }
];

export default function ChecklistManager(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncCollection, syncPulse } = useSync();
  const { selectedFramework } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [viewAllSteps, setViewAllSteps] = useState(false);
  const [history, setHistory] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [directPrintItem, setDirectPrintItem] = useState<any>(null);

  const handleDirectPrint = (item: any) => {
    requirePro(() => {
      let parsed = safeGetLocalStorage('checklist_' + item.id, item);
      setDirectPrintItem(parsed);
      setTimeout(() => {
        printElementAsDocument('checklist-direct-print');
      }, 120);
    });
  };

  const handleDownloadFromPreview = async (targetElementId: string, nameHint?: string) => {
    requirePro(async () => {
      const toastId = toast.loading('Generando archivo PDF...');
      try {
        const blob = await generatePdfBlob(targetElementId, false);
        const safeName = `Checklist_${String(nameHint || checklistTitle || 'Inspeccion').replace(/[^a-z0-9]/gi, '_')}.pdf`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1500);
        toast.success('¡PDF descargado con éxito!', { id: toastId });
      } catch (err) {
        console.error('Error al descargar PDF de checklist:', err);
        toast.dismiss(toastId);
        printElementAsDocument(targetElementId);
      }
    });
  };

  const handlePreview = (item: any) => {
    let parsed = safeGetLocalStorage('checklist_' + item.id, item);
    setPreviewItem(parsed);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [autoPrintShare, setAutoPrintShare] = useState(false);
  // Static PDF sharing from history (uses frozen IndexedDB blob)

  const [isStaticSharing, setIsStaticSharing] = useState(false);
  // Flag to prevent clearing activeSections when navigating away after save
  const isCreatingNewRef = useRef(false);

  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    inspector: '',
    address: '',
    responsable: ''
  });

  const [inspectionInfo, setInspectionInfo] = useState({
    item: '',
    serial: '',
    date: new Date().toISOString().split('T')[0],
    expirationDate: '',
    extinguisherObs: '',
    marca: '',
    patente: '',
    horometro: '',
    pt: '',
    responsableArea: ''
  });

  const [activeSections, setActiveSections] = useState([]);
  const [observations, setObservations] = useState('');
  const [epps, setEpps] = useState<string[]>([]);
  const [fotos, setFotos] = useState<string[]>([]);
  const [onlyNcFilter, setOnlyNcFilter] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const nextStep = () => {if (currentStep < totalSteps) {setCurrentStep((c) => c + 1);window.scrollTo(0, 0);}};
  const prevStep = () => {if (currentStep > 1) {setCurrentStep((c) => c - 1);window.scrollTo(0, 0);}};

  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });
  const [showFooter, setShowFooter] = useState(true);
  const [actionPlan, setActionPlan] = useState([]);
  const [nextReview, setNextReview] = useState('');

  const [operatorSignature, setOperatorSignature] = useState('');
  const [signature, setSignature] = useState('');
  const [supervisorSignature, setSupervisorSignature] = useState('');
  const [professional, setProfessional] = useState({ name: '', license: '', signature: null as string | null, stamp: null as string | null });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      const pd = localStorage.getItem('personalData');
      const sd = localStorage.getItem('signatureStampData');
      const lg = localStorage.getItem('capturedSignature');
      let sig = lg || null;
      let stamp = null as string | null;
      if (sd) {const p = JSON.parse(sd);sig = p.signature || sig;stamp = p.stamp || null;}
      const name = pd ? JSON.parse(pd).name || '' : '';
      const license = pd ? JSON.parse(pd).license || '' : '';
      setProfessional({ name, license, signature: sig, stamp });
    } catch {}
  }, []);
  const [newAction, setNewAction] = useState({ action: '', responsible: '', dueDate: '', priority: 'medio' });
  const [checklistTitle, setChecklistTitle] = useState('CHECKLIST');
  const [selectedNorms, setSelectedNorms] = useState([]);
  const [userCountry, setUserCountry] = useState('argentina');
  const [availableNorms, setAvailableNorms] = useState([]);
  const [showTutorialBanner, setShowTutorialBanner] = useState(false);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [templateCategoryTab, setTemplateCategoryTab] = useState<'all' | 'construccion' | 'industria' | 'mineria' | 'general'>('all');

  const startNewBlankChecklist = () => {
    setActiveSections([]);
    setEpps([]);
    setFotos([]);
    setObservations('');
    setActionPlan([]);
    setNextReview('');
    setSelectedNorms([]);
    setChecklistTitle('CHECKLIST');
    setCompanyInfo({ name: '', inspector: '', address: '', responsable: '' });
    setInspectionInfo({
      item: '', serial: '',
      date: new Date().toISOString().split('T')[0],
      expirationDate: '', extinguisherObs: '',
      marca: '', patente: '', horometro: '', pt: '', responsableArea: ''
    });
    setOperatorSignature('');
    setSignature('');
    setSupervisorSignature('');
    isCreatingNewRef.current = false;
    setSearchParams({});
    setShowForm(true);
    setCurrentStep(1);
  };

  const handleLoadIndustryChecklist = (template: IndustryChecklistTemplate) => {
    isCreatingNewRef.current = false;
    setChecklistTitle(`CHECKLIST DE ${template.title}`.toUpperCase());

    const newSection = {
      id: template.id,
      title: template.title,
      isMandatory: false,
      items: template.items.map((text) => ({ text, status: null, observation: '' }))
    };

    setActiveSections([newSection]);

    if (template.suggestedEpp && template.suggestedEpp.length > 0) {
      setEpps((prev) => Array.from(new Set([...prev, ...template.suggestedEpp])));
    }

    setShowIndustryModal(false);
    setShowForm(true);
    setCurrentStep(1);

    toast.success(`Checklist cargado: ${template.title} (${template.items.length} puntos)`);
  };

  useEffect(() => {
    if (!localStorage.getItem('checklist_tutorial_seen')) {
      setShowTutorialBanner(true);
    }
  }, []);

  useEffect(() => {
    const country = selectedFramework || 'argentina';
    setUserCountry(country);
    setAvailableNorms(getNormsForCountry(country));
  }, [selectedFramework]);

  useEffect(() => {
    const list = safeGetLocalStorage<any[]>('tool_checklists_history', []);
    setHistory(list);
  }, [syncPulse]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setShowForm(true);
      setCurrentStep(1); // Jump to step 1 so they can see templates and company info

      let parsed: any = safeGetLocalStorage(`checklist_${id}`, null);
      if (!parsed || (!parsed.activeSections && !parsed.items && !parsed.checks)) {
        const hist = safeGetLocalStorage<any[]>('tool_checklists_history', []);
        const found = hist.find((h: any) => h.id === id);
        if (found) parsed = found;
      }

      if (parsed) {
        if (parsed.checklistTitle || parsed.title) setChecklistTitle(parsed.checklistTitle || parsed.title);
        if (parsed.companyInfo) {
          setCompanyInfo({
            name: parsed.companyInfo.name || parsed.empresa || '',
            inspector: parsed.companyInfo.inspector || '',
            address: parsed.companyInfo.address || '',
            responsable: parsed.companyInfo.responsable || parsed.responsable || ''
          });
        } else {
          setCompanyInfo({
            name: parsed.empresa || '',
            inspector: '',
            address: '',
            responsable: parsed.responsable || ''
          });
        }

        if (parsed.inspectionInfo) {
          setInspectionInfo({
            item: parsed.inspectionInfo.item || parsed.equipo || '',
            serial: parsed.inspectionInfo.serial || parsed.serial || '',
            date: parsed.inspectionInfo.date || (parsed.fecha ? parsed.fecha.split('T')[0] : new Date().toISOString().split('T')[0]),
            expirationDate: parsed.inspectionInfo.expirationDate || '',
            extinguisherObs: parsed.inspectionInfo.extinguisherObs || '',
            marca: parsed.inspectionInfo.marca || parsed.marca || '',
            patente: parsed.inspectionInfo.patente || parsed.patente || '',
            horometro: parsed.inspectionInfo.horometro || parsed.horometro || '',
            pt: parsed.inspectionInfo.pt || '',
            responsableArea: parsed.inspectionInfo.responsableArea || ''
          });
        } else {
          setInspectionInfo({
            item: parsed.equipo || '',
            serial: parsed.serial || '',
            date: parsed.fecha ? parsed.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
            expirationDate: '',
            extinguisherObs: '',
            marca: parsed.marca || '',
            patente: parsed.patente || '',
            horometro: parsed.horometro || '',
            pt: '',
            responsableArea: ''
          });
        }

        let loadedSections = parsed.activeSections;
        if (!loadedSections) {
          let legacyItems = parsed.items || parsed.checks || [];
          if (!Array.isArray(legacyItems) && typeof legacyItems === 'object') {
            legacyItems = Object.values(legacyItems);
          }
          if (legacyItems.length > 0) {
            loadedSections = [{
              id: 'legacy',
              title: 'PUNTOS DE INSPECCIÓN',
              isMandatory: false,
              items: legacyItems
            }];
          } else {
            loadedSections = [];
          }
        }
        setActiveSections(loadedSections);

        setObservations(parsed.observations || '');
        setActionPlan(parsed.actionPlan || []);
        setNextReview(parsed.nextReview || '');
        setEpps(parsed.epps || []);
        setFotos(parsed.fotos || []);
        setSelectedNorms(parsed.selectedNorms || []);
        if (parsed.showSignatures) setShowSignatures(parsed.showSignatures);
        if (parsed.showFooter !== undefined) setShowFooter(parsed.showFooter);
        setOperatorSignature(parsed.operatorSignature || '');
        setSignature(parsed.signature || '');
        setSupervisorSignature(parsed.supervisorSignature || '');
      }
    }
  }, [searchParams]);

  const handleSave = async () => {
    const id = searchParams.get('id') || Date.now().toString();

    const data = {
      id,
      checklistTitle,
      companyInfo,
      inspectionInfo,
      activeSections,
      observations,
      actionPlan,
      nextReview,
      selectedNorms,
      epps,
      fotos,
      showSignatures,
      showFooter,
      operatorSignature,
      signature,
      supervisorSignature,
      updatedAt: new Date().toISOString()
    };

    setIsSaving(true);
    let hasStaticPdf = false;

    toast.loading('Guardando y archivando checklist...', { 
      id: 'save-checklist',
      style: {
        background: 'linear-gradient(135deg, #2563eb 0%, #4338ca 100%)',
        color: '#fff',
        fontWeight: 'bold',
        borderRadius: '12px',
        padding: '12px 20px',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#2563eb'
      }
    });

    try {
      // Capturar el PDF actual para congelarlo en el tiempo
      try {
        const pdfBlob = await generatePdfBlob('pdf-content-editor');
        if (pdfBlob) {
          await savePdfBlob(id, pdfBlob);
          hasStaticPdf = true;
        }
      } catch (pdfErr) {
        console.warn('PDF static blob generation note:', pdfErr);
      }

      const fullData = {
        ...data,
        empresa: companyInfo.name || 'Sin Empresa',
        equipo: inspectionInfo.item || 'Inspección General',
        serial: inspectionInfo.serial || 'S/N',
        fecha: data.updatedAt,
        title: checklistTitle,
        type: 'Checklist',
        hasStaticPdf
      };

      // Deep save for specific report persistence with quota protection
      safeSetLocalStorage(`checklist_${id}`, JSON.stringify(fullData));

      // Sync with history list
      let history: any[] = safeGetLocalStorage<any[]>('tool_checklists_history', []);

      // Para el historial global guardamos un registro optimizado sin fotos pesadas duplicadas
      const historyItem = {
        ...fullData,
        fotos: [],
      };

      const existingIndex = history.findIndex((h: any) => h.id === id);
      if (existingIndex >= 0) {
        history[existingIndex] = historyItem;
      } else {
        history.unshift(historyItem);
      }

      // Guardar historial protegido con safeSetLocalStorage (máximo 50 registros)
      safeSetLocalStorage('tool_checklists_history', JSON.stringify(history.slice(0, 50)));

      setHistory(history);

      // Sincronización en la nube con SyncContext
      try {
        await syncCollection('tool_checklists_history', history);
      } catch (syncErr) {
        console.warn('SyncCollection warning (offline or network):', syncErr);
      }

      toast.success('Checklist guardado con éxito y registrado en el historial ✅', { id: 'save-checklist' });

      // Volver a la lista del módulo
      setSearchParams({});
      setShowForm(false);
      setCurrentStep(1);
    } catch (saveError) {
      console.error('Error fatal al guardar checklist:', saveError);
      toast.error('Error al guardar el checklist. Intente nuevamente.', { id: 'save-checklist' });
    } finally {
      setIsSaving(false);
    }
  };


  // Limpieza manejada de forma explícita y segura por startNewBlankChecklist()

  const toggleTemplate = (templateKey) => {
    const template = DEFAULT_TEMPLATES[templateKey];
    const existingIdx = activeSections.findIndex((s) => s.id === templateKey);

    if (existingIdx >= 0) {
      setActiveSections((prev) => prev.filter((s) => s.id !== templateKey));
    } else {
      const newSection = {
        id: templateKey,
        title: template.title,
        isMandatory: false,
        items: template.items.map((text) => ({ text, status: null }))
      };
      setActiveSections((prev) => [...prev, newSection]);
      setChecklistTitle(`CHECKLIST DE ${template.title}`.toUpperCase());
    }
  };

  const updateSectionTitle = (sectionId, newTitle) => {
    setActiveSections((prev) => prev.map((section) =>
    section.id === sectionId ? { ...section, title: newTitle } : section
    ));
  };

  const removeSection = (sectionId) => {
    setActiveSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const updateItem = (sectionId, itemIdx, field, value) => {
    setActiveSections((prev) => prev.map((section) => {
      if (section.id !== sectionId) return section;
      const newItems = [...section.items];
      newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
      return { ...section, items: newItems };
    }));
  };

  const addItem = (sectionId) => {
    setActiveSections((prev) => prev.map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: [...section.items, { text: 'Nuevo punto de inspección', status: null }]
      };
    }));
  };

  const removeItem = (sectionId, itemIdx) => {
    setActiveSections((prev) => prev.map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: section.items.filter((_, idx) => idx !== itemIdx)
      };
    }));
  };

  const checkAllOk = (sectionId) => {
    setActiveSections((prev) => prev.map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: section.items.map((item) => ({ ...item, status: 'OK' }))
      };
    }));
  };

  const checkAllGlobalOk = () => {
    setActiveSections((prev) => prev.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item, status: 'OK' }))
    })));
    toast.success('Todos los ítems marcados como CUMPLE (C) ✅');
  };

  const addCustomSection = () => {
    const customId = `custom_${Date.now()}`;
    const newSec = {
      id: customId,
      title: `SECCIÓN PERSONALIZADA #${activeSections.length + 1}`,
      isMandatory: false,
      items: [
        { text: 'Verificar condiciones operativas y protecciones físicas del sector', status: 'OK', observation: '' },
        { text: 'Verificar orden, limpieza, demarcación y ausencia de riesgos visibles', status: 'OK', observation: '' },
        { text: 'Verificar provisión y uso efectivo de EPP certificados (Res. 299/11)', status: 'OK', observation: '' }
      ]
    };
    setActiveSections((prev) => [...prev, newSec]);
    toast.success('Sección personalizada agregada');
  };

  const generateActionPlanFromNc = () => {
    const failedItems: { text: string; observation?: string; sectionTitle: string }[] = [];
    activeSections.forEach((sec: any) => {
      (sec.items || []).forEach((it: any) => {
        if (it.status === 'FAIL' || it.status === 'NC') {
          failedItems.push({
            text: it.text || 'Punto observado',
            observation: it.observation,
            sectionTitle: sec.title || 'Inspección'
          });
        }
      });
    });

    if (failedItems.length === 0) {
      toast('No hay ítems marcados como NO CUMPLE (NC) para generar acciones.', { icon: 'ℹ️' });
      return;
    }

    const existingTexts = new Set(actionPlan.map((a: any) => a.action));
    const defaultDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const generated = failedItems
      .map((fi, i) => ({
        id: Date.now() + i,
        action: `Corregir desvío en [${fi.sectionTitle}]: ${fi.text}${fi.observation ? ` (${fi.observation})` : ''}`,
        responsible: inspectionInfo.responsableArea || companyInfo.responsable || 'Supervisión Operativa',
        dueDate: defaultDue,
        priority: 'alto'
      }))
      .filter((a) => !existingTexts.has(a.action));

    if (generated.length === 0) {
      toast.success('Las no conformidades ya están incluidas en el Plan de Acción');
      return;
    }

    setActionPlan((prev) => [...prev, ...generated]);
    toast.success(`Se agregaron ${generated.length} acciones correctivas al Plan de Acción 🎯`);
  };

  const suggestNormsFromTemplates = () => {
    const normsSet = new Set<string>(selectedNorms);
    normsSet.add('ley19587');
    normsSet.add('dec351');
    normsSet.add('res299');
    normsSet.add('iso45001');

    const activeIds = activeSections.map((s: any) => s.id);
    if (activeIds.some((id: string) => ['scaffolding', 'circular_saw', 'trabajos_altura', 'izaje_gruas', 'const_excavaciones', 'const_demolicion'].includes(id))) {
      normsSet.add('dec911');
    }
    if (activeIds.some((id: string) => id.startsWith('min_'))) {
      normsSet.add('dec249');
    }
    if (activeIds.includes('extintores_checklist')) {
      normsSet.add('nfpa10');
    }
    if (activeIds.includes('tableros_electricos')) {
      normsSet.add('nfpa70e');
    }
    if (activeIds.includes('espacios_confinados')) {
      normsSet.add('res295');
    }
    if (activeIds.includes('ergonomia_oficina')) {
      normsSet.add('res886');
    }

    setSelectedNorms(Array.from(normsSet));
    toast.success('Normativas aplicables sugeridas seleccionadas ⚖️');
  };

  // Progress calculation
  const progressPct = Math.round((currentStep / totalSteps) * 100);
  const progressLabel = progressPct === 100 ? 'Listo para guardar y exportar ✅' : progressPct >= 66 ? 'Casi completo' : progressPct >= 33 ? 'En progreso' : 'Pendiente';
  const progressColor = progressPct === 100 ? '#10b981' : progressPct >= 66 ? '#f59e0b' : progressPct >= 33 ? '#3b82f6' : '#94a3b8';

  const confirmDelete = () => {
    const updated = history.filter((item: any) => item.id !== deleteTarget);
    setHistory(updated);
    safeSetLocalStorage('tool_checklists_history', JSON.stringify(updated));
    syncCollection('tool_checklists_history', updated);
    try { localStorage.removeItem(`checklist_${deleteTarget}`); } catch {}
    setDeleteTarget(null);
  };

  const handleExportCSV = () => {
    requirePro(() => downloadCSV(history.map((i: any) => {
      const st = getChecklistStatus(i.id);
      return { fecha: new Date(i.fecha).toLocaleDateString('es-AR'), equipo: i.equipo, marca: i.marca, serial: i.serial, empresa: i.empresa, estado: st.label };
    }), 'checklists_herramientas', { fecha: 'Fecha', equipo: 'Equipo', marca: 'Marca', serial: 'Número Serie', empresa: 'Empresa', estado: 'Estado' }, 'Reporte de Checklists'));
  };

  const buildShareMessage = (item: any) => {
    if (!item) return '';
    const title = item.checklistTitle || item.equipo || 'Checklist de Inspección';
    const equipo = item.equipo || item.inspectionInfo?.item || 'General';
    const empresa = item.empresa || item.companyInfo?.name || '-';
    const fecha = item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR');
    const horometro = item.inspectionInfo?.horometro ? `\n⏱️ Kilometraje / Horómetro: ${item.inspectionInfo.horometro}` : '';

    const allSections = item.activeSections || [];
    const failedItems: string[] = [];
    allSections.forEach((sec: any) => {
      (sec.items || []).forEach((it: any) => {
        if (it.status === 'FAIL' || it.status === 'NC') {
          const obsText = it.observation ? ` (${it.observation})` : '';
          failedItems.push(`• ${it.text}${obsText}`);
        }
      });
    });

    const activeIds = allSections.map((s: any) => s.id);
    const isVehicle = activeIds.includes('autoelevadores') || title.toLowerCase().includes('autoelevador');

    let statusHeader = '✅ Estado: APROBADO SIN DESVÍOS';
    if (failedItems.length > 0) {
      statusHeader = isVehicle
        ? '🛑 Estado: EQUIPO FUERA DE SERVICIO - BLOQUEO PREVENTIVO'
        : `⚠️ Estado: CON NO CONFORMIDADES (${failedItems.length})`;
    } else if ((item.actionPlan && item.actionPlan.length > 0) || item.observations) {
      statusHeader = '⚠️ Estado: APROBADO CON OBSERVACIONES';
    }

    let msg = `📋 *${title.toUpperCase()}*\n`;
    msg += `🏗️ Empresa: ${empresa}\n`;
    msg += `🔧 Equipo / Sector: ${equipo}\n`;
    msg += `📅 Fecha: ${fecha}${horometro}\n`;
    msg += `${statusHeader}\n`;

    if (failedItems.length > 0) {
      msg += `\n🚨 *DESVÍOS DETECTADOS:*\n${failedItems.join('\n')}\n`;
    }

    if (item.actionPlan && item.actionPlan.length > 0) {
      msg += `\n🛠️ *PLAN DE ACCIÓN:*\n`;
      item.actionPlan.forEach((act: any) => {
        const resp = act.responsible ? ` (Resp: ${act.responsible})` : '';
        msg += `• ${act.action}${resp}\n`;
      });
    }

    return msg;
  };

  /**
   * Intenta compartir el PDF estático archivado en IndexedDB.
   * Si no existe, hace fallback al flujo estándar de re-renderizado.
   */
  const handleShareFromHistory = async (item: any) => {
    requirePro(async () => {
      // 1. Cargar datos completos desde localStorage de forma segura
      let parsed = safeGetLocalStorage('checklist_' + item.id, item);

      // 2. Abrir ShareModal estándar con regeneración fresca de ChecklistPdfGenerator
      setShareItem(parsed);
    });
  };

  const columns = [
  {
    header: 'Nº',
    accessor: 'index',
    width: '60px',
    render: (_: any, idx: number) =>
    <div className="font-[900] text-[var(--color-text-muted)] text-[1rem] text-center bg-[var(--color-background)] p-[0.2rem_0.5rem] rounded-[8px]">
                    {idx + 1}
                </div>

  },
  {
    header: 'Fecha',
    accessor: 'fecha',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] whitespace-">
                    <Calendar size={14} /> {new Date(item.fecha).toLocaleDateString('es-AR')}
                </span>

  },
  {
    header: 'Checklist / Equipo',
    accessor: 'equipo',
    sortable: true,
    render: (item: any) => {
      let title = item.title;
      if (!title) {
        const parsed = safeGetLocalStorage<any>('checklist_' + item.id, {});
        title = parsed.checklistTitle;
        if (!title && parsed.activeSections && parsed.activeSections.length > 0) {
          title = parsed.activeSections.map((s: any) => s.title).join(' + ');
        }
        title = title || 'General';
      }

      // Limpiar prefijo "Checklist (de)"
      title = title.replace(/^CHECKLISTs*(DEs*)?/i, '').trim();

      return (
        <div className="flex items-center gap-[0.8rem]">
                        <div className="bg-[rgba(59,130,246,0.1)] p-[0.5rem] rounded-[8px] text-[#3b82f6]">
                            <ClipboardList size={16} />
                        </div>
                        <div>
                            <div className="font-[800] text-[0.85rem]">{title}</div>
                            <div className="text-[0.72rem] text-[var(--color-text-muted)] font-[600]">{item.equipo || 'Sin equipo'} • #{item.serial || 'S/N'}</div>
                        </div>
                    </div>);

    }
  },
  {
    header: 'Empresa',
    accessor: 'empresa',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-[0.4rem]">
                    <Building2 size={14} /> {item.empresa}
                </span>

  },
  {
    header: 'Cumplimiento / Estado',
    accessor: 'id',
    render: (item: any) => {
      const st = getChecklistStatus(item.id, item);
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span style={{ background: st.bg, color: st.color }} className="px-2.5 py-0.5 rounded-full text-[0.7rem] font-extrabold uppercase tracking-wide">
              {st.label}
            </span>
            {st.total > 0 && (
              <span className="text-[0.68rem] font-black text-[var(--color-text-muted)]">
                {st.pct}% ({st.ok}/{st.total})
              </span>
            )}
          </div>
          {st.total > 0 && (
            <div className="w-28 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                style={{ width: `${st.pct}%`, backgroundColor: st.color }}
                className="h-full rounded-full transition-all"
              />
            </div>
          )}
        </div>
      );
    }
  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <button
          onClick={() => handlePreview(item)}
          title="Vista Previa A4"
          style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <EyeIcon size={12} /> Previa A4
        </button>

        <button
          onClick={() => handleDirectPrint(item)}
          title="Imprimir PDF Directo"
          style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Printer size={12} /> PDF
        </button>

        <button
          onClick={() => { setSearchParams({ id: item.id }); setShowForm(true); }}
          title="Ver / Editar Checklist"
          style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <FileText size={12} /> Editar
        </button>

        <button
          onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/checklist/${item.id}?print=true`; setQrTarget({ text: url, title: `Checklist — ${item.equipo}`, details: <><p className="m-[0_0_0.3rem]"><strong>Empresa:</strong> {item.empresa}</p><p className="m-[0_0_0.3rem]"><strong>Equipo:</strong> {item.equipo}</p><p className="m-[0]"><strong>Fecha:</strong> {new Date(item.fecha).toLocaleDateString('es-AR')}</p></> } as any); })}
          title="Ver Código QR"
          style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <QrCode size={12} /> QR
        </button>

        <button
          onClick={() => handleShareFromHistory(item)}
          title="Compartir Informe"
          disabled={isStaticSharing}
          style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: isStaticSharing ? 0.7 : 1 }}>
          {isStaticSharing ? <div style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Share2 size={12} />}
          {isStaticSharing ? 'Cargando...' : 'Compartir'}
        </button>
        <button
          onClick={() => setDeleteTarget(item.id)}
          title="Eliminar Checklist"
          style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Trash2 size={12} /> Eliminar
        </button>
      </div>
    )
  }];


  const uniqueEmpresas = [...new Set(history.map((e: any) => e.empresa).filter(Boolean))];

  const filteredHistory = history.filter((e: any) => {
    const matchesSearch = (e.equipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.serial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.marca || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmpresa = filterEmpresa === '' || e.empresa === filterEmpresa;
    const stLabel = getChecklistStatus(e.id).label;
    const matchesNc = !onlyNcFilter || stLabel === 'Rechazado' || stLabel === 'Con Obs.';
    return matchesSearch && matchesEmpresa && matchesNc;
  });

  return (
    <div className="container max-w-[1100px] pb-[8rem]">
            <Breadcrumbs />

            <PremiumHeader onBack={showForm ? () => {setShowForm(false);if (typeof setSearchParams !== 'undefined') setSearchParams({});} : undefined}
      title="Control de Checklists"
      subtitle="Relevamiento preventivo y control de condiciones de seguridad"
      icon={<ClipboardCheck size={36} />} />
      

            {!showForm ?
      <>
                    {/* 4 Tarjetas Ejecutivas de KPIs */}
                    <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
                        <div
                            onClick={() => setOnlyNcFilter(false)}
                            className="p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 shadow-xs"
                        >
                            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1.5">
                                <span className="text-[11px] font-black uppercase tracking-wider">Total Checklists</span>
                                <ClipboardCheck size={19} />
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{history.length}</div>
                            <span className="text-[11px] font-semibold text-slate-500">Protocolos registrados</span>
                        </div>

                        <div
                            onClick={() => setOnlyNcFilter(false)}
                            className="p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 shadow-xs"
                        >
                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1.5">
                                <span className="text-[11px] font-black uppercase tracking-wider">Aprobados (OK)</span>
                                <CheckCircle2 size={19} />
                            </div>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {history.filter((h: any) => getChecklistStatus(h.id, h).label === 'Aprobado').length}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">Sin desvíos críticos</span>
                        </div>

                        <div
                            onClick={() => setOnlyNcFilter(!onlyNcFilter)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none shadow-xs ${
                                onlyNcFilter
                                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
                            }`}
                        >
                            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1.5">
                                <span className="text-[11px] font-black uppercase tracking-wider">Con Desvíos / NC</span>
                                <TriangleAlert size={19} />
                            </div>
                            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                {history.filter((h: any) => {
                                  const lbl = getChecklistStatus(h.id, h).label;
                                  return lbl === 'Rechazado' || lbl === 'Con Obs.';
                                }).length}
                            </div>
                            <span className="text-[11px] font-bold text-rose-500">
                                {onlyNcFilter ? 'Filtrando desvíos (clic ver todos)' : 'Clic para filtrar observados'}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl border transition-all bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 shadow-xs">
                            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1.5">
                                <span className="text-[11px] font-black uppercase tracking-wider">Últimos 7 Días</span>
                                <Activity size={19} />
                            </div>
                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                {history.filter((h: any) => new Date(h.fecha) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">Relevamientos recientes</span>
                        </div>
                    </div>

                    {/* Barra Principal de Búsqueda, Filtro y Acciones Primarias (Responsiva para Celular) */}
                    <div className="no-print mb-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 flex-wrap items-stretch sm:items-center">
                        <div className="w-full sm:flex-[2_1_300px] relative h-[50px] sm:h-[52px]">
                            <Search
                              size={20}
                              className="text-[var(--color-text-muted)] pointer-events-none z-10"
                              style={{
                                position: 'absolute',
                                left: '1rem',
                                top: 0,
                                bottom: 0,
                                marginTop: 'auto',
                                marginBottom: 'auto',
                                display: 'block'
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Buscar por equipo, sector, empresa o serie..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ width: '100%', height: '100%', paddingLeft: '3rem', paddingRight: '1rem', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                              className="rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-bold focus:border-blue-500 transition-all shadow-xs"
                            />
                        </div>

                        <div className="w-full sm:flex-[1_1_190px]">
                            <select
                                value={filterEmpresa}
                                onChange={(e) => setFilterEmpresa(e.target.value)}
                                style={{ color: filterEmpresa ? 'var(--color-text)' : 'var(--color-text-muted)', height: '50px' }}
                                className="w-full px-4 rounded-2xl border-2 border-[var(--color-border)] text-sm font-bold outline-none bg-[var(--color-surface)] shadow-xs"
                            >
                                <option value="">Todas las Empresas</option>
                                {uniqueEmpresas.map((emp: any) => (
                                    <option key={emp} value={emp}>{emp}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                          <button
                              type="button"
                              onClick={() => setShowIndustryModal(true)}
                              style={{ height: '50px' }}
                              className="px-3 sm:px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[11px] sm:text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md whitespace-nowrap border-none"
                          >
                              <BookOpen size={16} /> Catálogo Industria
                          </button>

                          <button
                              onClick={startNewBlankChecklist}
                              style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', fontWeight: '900', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)', height: '50px' }}
                              className="px-3 sm:px-5 text-[11px] sm:text-xs uppercase flex items-center justify-center gap-1.5 transition-transform hover:-translate-y-0.5 whitespace-nowrap"
                          >
                              <Plus size={17} strokeWidth={2.5} /> NUEVO CHECKLIST
                          </button>
                        </div>
                    </div>

                    {/* Apartado Desplegable de Herramientas, Plantillas Rápidas y Exportación */}
                    <div className="no-print mb-5">
                      <button
                        type="button"
                        onClick={() => setShowTools(!showTools)}
                        className="w-full py-2.5 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-extrabold text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all shadow-2xs"
                      >
                        <span className="flex items-center gap-2">
                          <Settings size={15} className="text-blue-500" />
                          Herramientas de Gestión, Plantillas Rápidas y Exportación
                        </span>
                        <ChevronDown
                          size={17}
                          style={{
                            transform: showTools ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      </button>

                      {showTools && (
                        <div className="mt-2 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md flex flex-col gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setOnlyNcFilter(!onlyNcFilter)}
                              className={`px-3.5 py-2 rounded-xl font-extrabold text-xs uppercase flex items-center gap-2 cursor-pointer border transition-all ${
                                onlyNcFilter
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                              }`}
                            >
                              <TriangleAlert size={14} />
                              {onlyNcFilter ? 'Mostrando Solo Desvíos (Ver Todos)' : 'Filtrar Solo Desvíos / NC'}
                            </button>

                            <button
                              type="button"
                              onClick={handleExportCSV}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-extrabold text-xs uppercase flex items-center gap-2 cursor-pointer transition-all"
                            >
                              <Download size={14} /> Exportar Historial CSV
                            </button>
                          </div>

                          <div className="border-t border-[var(--color-border)] pt-2.5">
                            <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-wider block mb-2">
                              ⚡ Iniciar Inspección Rápida desde Plantilla Oficial:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { key: 'general_audit', label: '🏢 Relevamiento General Planta' },
                                { key: 'scaffolding', label: '🏗️ Andamios (Dec. 911)' },
                                { key: 'trabajos_altura', label: '🧗 Trabajo en Altura' },
                                { key: 'tableros_electricos', label: '⚡ Tableros Eléctricos' },
                                { key: 'autoelevadores', label: '🚜 Autoelevadores (Res. 960/15)' },
                                { key: 'extintores_checklist', label: '🧯 Matafuegos (NFPA 10)' },
                                { key: 'ind_loto_bloqueo', label: '🔒 Bloqueo LOTO' },
                                { key: 'espacios_confinados', label: '🕳️ Espacios Confinados' }
                              ].map((tpl) => (
                                <button
                                  key={tpl.key}
                                  type="button"
                                  onClick={() => {
                                    startNewBlankChecklist();
                                    setTimeout(() => toggleTemplate(tpl.key), 50);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-[var(--color-text)] text-xs font-bold border border-[var(--color-border)] cursor-pointer transition-all"
                                >
                                  {tpl.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <DataTable
          data={filteredHistory}
          columns={columns}
          hideHeader={true}
          searchPlaceholder="Buscar..."
          emptyMessage="No se encontraron registros de Checklists."
          emptyIcon={<ClipboardList size={48} />} />
        

                    {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} details={(qrTarget as any).details} onClose={() => setQrTarget(null)} />}
                    {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                </> :

      <>
            <div className="animate-fade-in ats-editor-panel">
            {showTutorialBanner &&
        <div className="no-print bg-[linear-gradient(135deg,_#3b82f6_0%,_#2563eb_100%)] text-[#fff] p-[1rem_1.5rem] rounded-[16px] mb-[1.5rem] mt-[1.5rem] flex justify-space-between items-center shadow-[] relative flex-wrap gap-[1rem]">
                    <div className="flex items-start gap-[1rem] flex-[1]">
                        <div className="bg-[rgba(255,255,255,0.2)] p-[0.6rem] rounded-[12px]">
                            <Info size={24} />
                        </div>
                        <div>
                            <h4 className="m-[0] text-[1.1rem] font-[900]">¡Todo es editable!</h4>
                            <p className="m-[0.3rem_0_0_0] text-[0.85rem] font-[600] text-[rgba(255,255,255,0.9)] leading-[]">
                                Recuerda que puedes hacer clic en el <strong>Título Principal</strong>, en los <strong>Títulos de las Secciones</strong> o en las <strong>Preguntas</strong> para modificarlas y adaptarlas a la inspección que necesites.
                            </p>
                        </div>
                    </div>
                    <button
            onClick={() => {
              setShowTutorialBanner(false);
              localStorage.setItem('checklist_tutorial_seen', 'true');
            }} className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-none p-[0.6rem_1.2rem] rounded-[10px] font-[900] cursor-pointer shrink-0 shadow-[]">

            
                        Entendido
                    </button>
                </div>
        }

            <ShareModal
          isOpen={showShare}
          open={showShare}
          onClose={() => setShowShare(false)}
          title={`Checklist – ${companyInfo?.name || ''}`}
          text={`📋 Checklist de Inspección\n🏗️ Empresa: ${companyInfo?.name || '-'}\n📍 Ubicación: ${companyInfo?.address || '-'}\n👷 Responsable: ${companyInfo?.responsable || '-'}\n\nGenerado con Asistente H&S`}
          rawMessage={`📋 Checklist de Inspección\n🏗️ Empresa: ${companyInfo?.name || '-'}\n📍 Ubicación: ${companyInfo?.address || '-'}\n👷 Responsable: ${companyInfo?.responsable || '-'}\n\nGenerado con Asistente H&S`}
          elementIdToPrint="pdf-content-editor"
          fileName={`Checklist_${companyInfo?.name || 'Reporte'}.pdf`} />
        
            {/* PDF Generator offscreen para el editor — capturado al compartir */}
            <div className="ats-pdf-offscreen" style={{ zIndex: -9999 }}>
                <ChecklistPdfGenerator
            checklistData={{
              checklistTitle,
              companyInfo,
              inspectionInfo,
              activeSections,
              observations,
              actionPlan,
              nextReview,
              selectedNorms,
              availableNorms,
              showSignatures,
              showFooter,
              epps,
              fotos,
              operatorSignature,
              signature,
              supervisorSignature
            }}
            pdfElementId="pdf-content-editor"
            isHeadless={true} />
          
            </div>
            </div>

            <ModuleFormLayout>
            {/* Panel Ejecutivo de Estado en Vivo y Navegación de Secciones */}
            {(() => {
              const allItems = activeSections.flatMap((s: any) => s.items || []);
              const totalCount = allItems.length;
              const okCount = allItems.filter((i: any) => i.status === 'OK' || i.status === 'CUMPLE').length;
              const failCount = allItems.filter((i: any) => i.status === 'FAIL' || i.status === 'NC').length;
              const naCount = allItems.filter((i: any) => i.status === 'NA').length;
              const answeredCount = okCount + failCount + naCount;
              const completionPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
              const eligible = Math.max(0, totalCount - naCount);
              const conformityPct = eligible > 0 ? Math.round((okCount / eligible) * 100) : 100;

              return (
                <div className="no-print mb-5 mt-3 p-5 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black ${
                        failCount > 0
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      }`}>
                        {failCount > 0 ? <TriangleAlert size={22} /> : <ShieldCheck size={22} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="m-0 text-base sm:text-lg font-black text-[var(--color-text)]">
                            {checklistTitle || 'PROTOCOLO DE CHECKLIST'}
                          </h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            failCount > 0
                              ? 'bg-rose-500 text-white'
                              : totalCount > 0 && okCount > 0
                              ? 'bg-emerald-500 text-white'
                              : 'bg-blue-600 text-white'
                          }`}>
                            {failCount > 0
                              ? `⚠ ${failCount} DESVÍO${failCount > 1 ? 'S' : ''} (NC)`
                              : totalCount > 0
                              ? `✓ ${conformityPct}% CONFORME`
                              : 'EN CONFIGURACIÓN'}
                          </span>
                        </div>
                        <p className="m-0 text-xs text-[var(--color-text-muted)] font-semibold mt-0.5">
                          {activeSections.length} {activeSections.length === 1 ? 'sección activa' : 'secciones activas'} • {answeredCount}/{totalCount} puntos evaluados ({completionPct}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-black uppercase">
                        Paso {currentStep} de {totalSteps}
                      </span>
                    </div>
                  </div>

                  {/* Mini KPIs en vivo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-[var(--color-text-muted)] block">Total Puntos</span>
                        <span className="text-base sm:text-lg font-black text-[var(--color-text)]">{totalCount}</span>
                      </div>
                      <ClipboardList size={18} className="text-blue-500 shrink-0" />
                    </div>
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 block">Cumple (C)</span>
                        <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">{okCount}</span>
                      </div>
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400 block">No Cumple (NC)</span>
                        <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">{failCount}</span>
                      </div>
                      <XCircle size={18} className="text-rose-500 shrink-0" />
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-500/10 border border-slate-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-[var(--color-text-muted)] block">No Aplica (N/A)</span>
                        <span className="text-base sm:text-lg font-black text-[var(--color-text)]">{naCount}</span>
                      </div>
                      <Activity size={18} className="text-slate-400 shrink-0" />
                    </div>
                  </div>

                  {/* Pestañas de navegación por pasos responsivas */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5">
                    {[
                      { step: 1, label: '1. Datos' },
                      { step: 2, label: `2. Puntos (${totalCount})` },
                      { step: 3, label: `3. EPP y Fotos (${epps.length + fotos.length})` },
                      { step: 4, label: `4. Plan y Normas (${actionPlan.length})` },
                      { step: 5, label: '5. Firma y Cierre' }
                    ].map((t) => {
                      const active = currentStep === t.step;
                      return (
                        <button
                          key={t.step}
                          type="button"
                          onClick={() => {
                            setViewAllSteps(false);
                            setCurrentStep(t.step);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap cursor-pointer border transition-all text-center flex-1 ${
                            t.step === 5 ? 'col-span-2 sm:col-span-1' : ''
                          } ${
                            active
                              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                              : 'bg-[var(--color-background)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {(viewAllSteps || currentStep === 1) &&
        <ModuleFormDocument>
            <div id="checklist-editor-content" className="card ats-editor-panel w-full box-border p-5 sm:p-6 mx-auto mb-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 border-b border-[var(--color-border)] pb-4 mb-5">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Building2 size={22} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 block">
                            SECCIÓN 1 • ENCABEZADO Y TRAZABILIDAD
                          </span>
                          <h3 className="m-0 text-base font-black text-[var(--color-text)]">
                            Datos del Establecimiento y Equipo / Sector Auditado
                          </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <CompanyLogo className="h-[36px] max-w-[110px]" />
                    </div>
                </div>

                {/* Título Editable del Protocolo */}
                <div className="mb-4 p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                    TÍTULO OFICIAL DEL CHECKLIST / PROTOCOLO (EDITABLE)
                  </label>
                  <input
                    type="text"
                    value={checklistTitle}
                    onChange={(e) => setChecklistTitle(e.target.value)}
                    placeholder="Ej: CHECKLIST DE INSPECCIÓN DE SEGURIDAD"
                    className="w-full bg-transparent border-none outline-none font-black text-base sm:text-xl text-[var(--color-text)] uppercase tracking-tight"
                  />
                </div>

                {(() => {
              const activeIds = activeSections.map((s: any) => s.id);
              const hasTools = activeIds.some((id) => ['manual_tools', 'electric_tools', 'circular_saw', 'grinder'].includes(id));
              const hasVehicles = activeIds.includes('autoelevadores') || (checklistTitle && checklistTitle.toLowerCase().includes('autoelevador'));
              const hasPermits = activeIds.some((id) => ['espacios_confinados', 'trabajos_caliente', 'trabajos_altura'].includes(id));
              const hasHeavy = activeIds.some((id) => ['scaffolding', 'izaje_gruas'].includes(id));
              const hasExtinguishers = activeIds.includes('extintores_checklist');
              const failCount = activeSections.flatMap((s: any) => s.items || []).filter((i: any) => i.status === 'FAIL' || i.status === 'NC').length;

              return (
                <div>
                  {hasVehicles && failCount > 0 && (
                    <div className="mb-4 p-3 bg-red-600 text-white font-black text-xs sm:text-sm rounded-xl text-center shadow-lg uppercase tracking-wider flex items-center justify-center gap-2">
                      <span>🛑 EQUIPO FUERA DE SERVICIO — BLOQUEO PREVENTIVO ({failCount} {failCount === 1 ? 'DESVÍO CRÍTICO' : 'DESVÍOS CRÍTICOS'})</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <DocBox label="CLIENTE / EMPRESA / RAZÓN SOCIAL" value={companyInfo.name} onChange={(v) => setCompanyInfo({ ...companyInfo, name: v })} large />
                    </div>
                    <div className="sm:col-span-2">
                      <DocBox label="UBICACIÓN / PLANTA / OBRA" value={companyInfo.address} onChange={(v) => setCompanyInfo({ ...companyInfo, address: v })} />
                    </div>

                    <div>
                      <DocBox label="FECHA DE INSPECCIÓN" value={inspectionInfo.date} onChange={(v) => setInspectionInfo({ ...inspectionInfo, date: v })} type="date" />
                    </div>
                    <div className="sm:col-span-2">
                      <DocBox label={hasPermits ? "SECTOR / ÁREA OPERATIVA" : "EQUIPO / MÁQUINA / SECTOR AUDITADO"} value={inspectionInfo.item} onChange={(v) => setInspectionInfo({ ...inspectionInfo, item: v })} />
                    </div>
                    <div>
                      <DocBox label={hasExtinguishers ? "CHAPA / N° EXTINTOR" : "N° SERIE / CÓDIGO INTERNO"} value={inspectionInfo.serial} onChange={(v) => setInspectionInfo({ ...inspectionInfo, serial: v })} />
                    </div>

                    {hasVehicles && (
                      <>
                        <div>
                          <DocBox label="MARCA / MODELO" value={inspectionInfo.marca || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, marca: v })} />
                        </div>
                        <div>
                          <DocBox label="DOMINIO (PATENTE)" value={inspectionInfo.patente || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, patente: v })} />
                        </div>
                        <div className="sm:col-span-2">
                          <DocBox label="KILOMETRAJE / HORÓMETRO" value={inspectionInfo.horometro || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, horometro: v })} />
                        </div>
                      </>
                    )}

                    {(hasTools || hasHeavy) && !hasVehicles && (
                      <div className="sm:col-span-2">
                        <DocBox label="MARCA / MODELO DEL EQUIPO" value={inspectionInfo.marca || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, marca: v })} />
                      </div>
                    )}

                    {hasPermits && (
                      <>
                        <div className="sm:col-span-2">
                          <DocBox label="N° PERMISO DE TRABAJO (PT)" value={inspectionInfo.pt || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, pt: v })} />
                        </div>
                        <div className="sm:col-span-2">
                          <DocBox label="RESPONSABLE DEL ÁREA / SUPERVISOR" value={inspectionInfo.responsableArea || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, responsableArea: v })} />
                        </div>
                      </>
                    )}

                    {hasExtinguishers && (
                      <>
                        <div>
                          <DocBox label="VENCIMIENTO DE CARGA" value={inspectionInfo.expirationDate || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, expirationDate: v })} type="date" />
                        </div>
                        <div className="sm:col-span-3">
                          <DocBox label="OBSERVACIÓN TÉCNICA EXTINTOR" value={inspectionInfo.extinguisherObs || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, extinguisherObs: v })} />
                        </div>
                      </>
                    )}

                    <div className="sm:col-span-2">
                      <DocBox label="INSPECTOR ACTUANTE / AUDITOR" value={companyInfo.inspector} onChange={(v) => setCompanyInfo({ ...companyInfo, inspector: v })} />
                    </div>
                    <div className="sm:col-span-2">
                      <DocBox label="RESPONSABLE DEL SECTOR / OPERADOR" value={companyInfo.responsable} onChange={(v) => setCompanyInfo({ ...companyInfo, responsable: v })} />
                    </div>
                  </div>
                </div>
              );
            })()}
            </div>
        </ModuleFormDocument>
        }

            {/* SECCIÓN 2: SELECTOR DE PLANTILLAS Y EVALUACIÓN DE PUNTOS DE INSPECCIÓN */}
            {(viewAllSteps || currentStep === 2) && (
            <div className="no-print mb-6 space-y-4">
              <div className="p-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-sm gap-3 flex-wrap border border-blue-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 block">
                        SECCIÓN 2 • PLANTILLAS Y PROTOCOLOS DE VERIFICACIÓN
                      </span>
                      <h4 className="text-sm sm:text-base font-black m-0 text-white flex items-center gap-2 flex-wrap">
                        Seleccioná Plantillas Oficiales o Creá una Sección a Medida
                      </h4>
                      <p className="text-xs text-blue-200 mt-0.5 m-0">
                        Podés combinar múltiples plantillas en una misma acta de inspección.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap ml-auto">
                    <button
                      type="button"
                      onClick={addCustomSection}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer border-none shadow-md flex items-center gap-1.5"
                    >
                      <Plus size={15} /> + Sección Personalizada
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowIndustryModal(true)}
                      className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer border-none shadow-md flex items-center gap-1.5"
                    >
                      <BookOpen size={15} /> Catálogo por Industria
                    </button>
                  </div>
                </div>

                {/* Pestañas de Categoría */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {[
                    { id: 'all', label: 'Todos', icon: null, count: Object.keys(DEFAULT_TEMPLATES).length },
                    { id: 'construccion', label: 'Construcción (Dec. 911)', icon: <HardHat size={14} />, count: Object.values(DEFAULT_TEMPLATES).filter(t => t.category === 'construccion').length },
                    { id: 'industria', label: 'Industria & Planta (Dec. 351)', icon: <Wrench size={14} />, count: Object.values(DEFAULT_TEMPLATES).filter(t => t.category === 'industria').length },
                    { id: 'mineria', label: 'Minería (Dec. 249/07)', icon: <Pickaxe size={14} />, count: Object.values(DEFAULT_TEMPLATES).filter(t => t.category === 'mineria').length },
                    { id: 'general', label: 'Generales & EPP', icon: <ShieldCheck size={14} />, count: Object.values(DEFAULT_TEMPLATES).filter(t => t.category === 'general').length }
                  ].map(cat => {
                    const isCurrent = templateCategoryTab === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setTemplateCategoryTab(cat.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                            : 'bg-[var(--color-background)] text-[var(--color-text)] border-[var(--color-border)] hover:border-blue-400'
                        }`}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isCurrent ? 'bg-blue-800/80 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {Object.entries(DEFAULT_TEMPLATES)
                    .filter(([_, value]) => templateCategoryTab === 'all' || value.category === templateCategoryTab)
                    .map(([key, value]) => {
                    const active = activeSections.some((s) => s.id === key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleTemplate(key)}
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center min-h-[78px] cursor-pointer transition-all border ${
                          active
                            ? 'bg-blue-600/15 border-2 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text)] hover:border-blue-400/60'
                        }`}
                      >
                        <div className={active ? 'text-blue-500' : 'text-[var(--color-text-muted)]'}>
                          {React.cloneElement(value.icon as React.ReactElement<any>, { size: 20 })}
                        </div>
                        <span className="text-[0.7rem] font-extrabold leading-tight">{value.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            )}

            {/* SECCIONES ACTIVAS EDITABLES */}
            {(viewAllSteps || currentStep === 2) &&
        <div className="no-print mb-6">
                {activeSections.length === 0 ? (
                  <div className="p-8 rounded-3xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-center flex flex-col items-center gap-3">
                    <ClipboardList size={38} className="text-blue-500 opacity-80" />
                    <div>
                      <h4 className="m-0 text-base font-black text-[var(--color-text)]">Aún no seleccionaste puntos de inspección</h4>
                      <p className="m-0 mt-1 text-xs text-[var(--color-text-muted)] max-w-md">
                        Hacé clic en cualquiera de las tarjetas de plantillas de arriba o creá una sección personalizada para empezar a evaluar.
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center mt-1">
                      <button
                        type="button"
                        onClick={() => toggleTemplate('general_audit')}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold uppercase border-none cursor-pointer"
                      >
                        Cargar Relevamiento General
                      </button>
                      <button
                        type="button"
                        onClick={addCustomSection}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase border-none cursor-pointer"
                      >
                        + Crear Sección Vacía
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-xl">
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase text-[var(--color-text)] m-0">Evaluación Técnica de Puntos</h4>
                        <p className="text-xs text-[var(--color-text-muted)] m-0">
                          Calificá cada criterio como <strong>C (Cumple)</strong>, <strong>NC (No Cumple)</strong> o <strong>N/A (No Aplica)</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap ml-auto">
                      <button
                        type="button"
                        onClick={generateActionPlanFromNc}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs uppercase px-3.5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer border-none transition-all"
                      >
                        <Sparkles size={15} /> Generar Plan desde NC
                      </button>
                      <button
                        type="button"
                        onClick={checkAllGlobalOk}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer border-none transition-all active:scale-95"
                      >
                        <CheckCircle2 size={16} /> MARCAR TODO OK (C)
                      </button>
                    </div>
                  </div>
                )}

                {activeSections.map((section, secIndex) => {
                  const secOk = (section.items || []).filter((i: any) => i.status === 'OK').length;
                  const secFail = (section.items || []).filter((i: any) => i.status === 'FAIL' || i.status === 'NC').length;
                  return (
                    <div key={section.id} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden mb-5 shadow-sm">
                      <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {secIndex + 1}
                          </span>
                          <input
                            className="font-black text-sm sm:text-base uppercase tracking-tight bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 outline-none w-full rounded-xl px-3 py-1.5 text-white placeholder:text-slate-400"
                            value={section.title}
                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                            title="Editar nombre de la sección"
                          />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <span className="text-[11px] font-extrabold text-slate-300 px-2.5 py-1 rounded-lg bg-white/10">
                            {secOk}/{section.items.length} OK {secFail > 0 ? `• ${secFail} NC` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => checkAllOk(section.id)}
                            className="px-3 py-1.5 text-[11px] font-black uppercase bg-emerald-600 hover:bg-emerald-500 text-white border-none rounded-xl cursor-pointer flex items-center gap-1"
                          >
                            <Check size={13} /> Todo OK
                          </button>
                          <button
                            type="button"
                            onClick={() => addItem(section.id)}
                            className="px-3 py-1.5 text-[11px] font-black uppercase bg-blue-600 hover:bg-blue-500 text-white border-none rounded-xl cursor-pointer flex items-center gap-1"
                          >
                            <Plus size={13} /> + Punto
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSection(section.id)}
                            className="px-2.5 py-1.5 text-[11px] font-black uppercase bg-rose-600/90 hover:bg-rose-600 text-white border-none rounded-xl cursor-pointer flex items-center gap-1"
                            title="Quitar sección"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-[var(--color-border)]">
                        {section.items.map((item, idx) => {
                          const isFail = item.status === 'FAIL' || item.status === 'NC';
                          const isOk = item.status === 'OK';
                          return (
                            <div
                              key={idx}
                              className={`p-3.5 sm:p-4 transition-colors ${
                                isFail
                                  ? 'bg-rose-500/5'
                                  : isOk
                                  ? 'bg-emerald-500/[0.02]'
                                  : 'bg-transparent'
                              }`}
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                {/* Número + Criterio */}
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                                      isFail
                                        ? 'bg-rose-600 text-white'
                                        : isOk
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <textarea
                                    rows={1}
                                    value={item.text}
                                    onInput={(e) => {
                                      const target = e.target as any;
                                      target.style.height = 'auto';
                                      target.style.height = target.scrollHeight + 'px';
                                    }}
                                    onChange={(e) => updateItem(section.id, idx, 'text', e.target.value)}
                                    className="flex-1 w-full px-2.5 py-1.5 font-bold text-sm outline-none bg-[var(--color-background)] border border-[var(--color-border)] focus:border-blue-500 resize-none rounded-xl text-[var(--color-text)]"
                                  />
                                </div>

                                {/* Botones de Estado (C / NC / N/A) + Eliminar */}
                                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto">
                                  <div className="flex flex-1 sm:flex-initial items-center gap-1.5 bg-[var(--color-background)] p-1 rounded-xl border border-[var(--color-border)]">
                                    <StatusBtn active={item.status === 'OK'} type="OK" onClick={() => updateItem(section.id, idx, 'status', 'OK')} label="✓ C" />
                                    <StatusBtn active={item.status === 'FAIL'} type="FAIL" onClick={() => updateItem(section.id, idx, 'status', 'FAIL')} label="✕ NC" />
                                    <StatusBtn active={item.status === 'NA'} type="NA" onClick={() => updateItem(section.id, idx, 'status', 'NA')} label="— N/A" />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeItem(section.id, idx)}
                                    title="Eliminar punto"
                                    className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 cursor-pointer transition-colors shrink-0"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* Barra de observación, dictado y evidencia por ítem */}
                              <div className="mt-2.5 pl-0 sm:pl-9 flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  placeholder={isFail ? 'Describa la no conformidad o desvío detectado...' : 'Agregar observación opcional para este punto...'}
                                  value={item.observation || ''}
                                  onChange={(e) => updateItem(section.id, idx, 'observation', e.target.value)}
                                  className={`flex-1 min-w-[180px] px-3 py-1.5 rounded-xl text-xs font-semibold outline-none border ${
                                    isFail
                                      ? 'bg-rose-500/10 border-rose-500/40 text-[var(--color-text)]'
                                      : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text)]'
                                  }`}
                                />
                                <SpeechButton onTranscript={(text) => updateItem(section.id, idx, 'observation', item.observation ? `${item.observation} ${text}` : text)} />

                                <input
                                  type="file"
                                  id={`file-input-${section.id}-${idx}`}
                                  onChange={async (e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length === 0) return;
                                    const compressedPhotos = [];
                                    for (const file of files) {
                                      try {
                                        const comp = await compressImage(file, { maxDimension: 640, quality: 0.65 });
                                        if (comp) compressedPhotos.push(comp);
                                      } catch (err) {
                                        console.warn('Error compressing item photo:', err);
                                      }
                                    }
                                    if (compressedPhotos.length > 0) {
                                      updateItem(section.id, idx, 'photos', [...(item.photos || []), ...compressedPhotos]);
                                    }
                                  }}
                                  accept="image/*"
                                  capture="environment"
                                  multiple
                                  style={{ display: 'none' }}
                                />

                                <button
                                  type="button"
                                  onClick={() => document.getElementById(`file-input-${section.id}-${idx}`)?.click()}
                                  title="Adjuntar foto de evidencia"
                                  className="px-3 py-1.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center gap-1.5 text-xs font-extrabold transition-colors"
                                >
                                  <Camera size={14} />
                                  <span>Foto ({item.photos?.length || 0})</span>
                                </button>
                              </div>

                              {item.photos && item.photos.length > 0 && (
                                <div className="flex gap-2 flex-wrap mt-2 pl-0 sm:pl-9">
                                  {item.photos.map((photo, pIdx) => (
                                    <div key={pIdx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-[var(--color-border)]">
                                      <img src={photo} alt="" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedPhotos = item.photos.filter((_, i) => i !== pIdx);
                                          updateItem(section.id, idx, 'photos', updatedPhotos);
                                        }}
                                        className="absolute top-0 right-0 bg-red-600 text-white border-none w-4 h-4 flex items-center justify-center cursor-pointer text-[10px] p-0"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
        }

            {/* FORMULARIOS EDITABLES - NO PRINT */}
            
          {/* SECCIÓN 3: EPP CERTIFICADOS (RES. SRT 299/11) Y EVIDENCIA FOTOGRÁFICA */}
          {(viewAllSteps || currentStep === 3) && (
            <div className="no-print mb-6 p-5 sm:p-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[var(--color-border)] pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <HardHat size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                      SECCIÓN 3 • DOTACIÓN PREVENTIVA Y REGISTRO VISUAL
                    </span>
                    <h3 className="m-0 text-base font-black text-[var(--color-text)]">
                      EPP Obligatorios Verificados (Res. SRT 299/11) y Evidencia Fotográfica
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEpps(['casco', 'calzado', 'anteojos', 'guantes'])}
                  className="px-3.5 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white text-xs font-extrabold uppercase cursor-pointer transition-all"
                >
                  ✓ Seleccionar Kit Básico EPP
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Catálogo de 12 EPPs Certificados */}
                <div className="lg:col-span-7">
                  <label className="text-xs font-black uppercase text-[var(--color-text-muted)] block mb-3">
                    Seleccioná los EPP auditados en el sector ({epps.length} seleccionados):
                  </label>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {EPP_CATALOG_OPTIONS.map((epp) => {
                      const isSelected = epps?.includes(epp.id);
                      const Icon = epp.icon;
                      return (
                        <button
                          key={epp.id}
                          type="button"
                          onClick={() => {
                            const current = epps || [];
                            const updated = isSelected ? current.filter((e) => e !== epp.id) : [...current, epp.id];
                            setEpps(updated);
                          }}
                          className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600/15 border-2 border-blue-500 text-blue-600 dark:text-blue-300 shadow-xs'
                              : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text)] hover:border-blue-400/60'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-[var(--color-text-muted)]'}`}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-xs block leading-snug">{epp.label}</span>
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)] block mt-0.5">{epp.norm}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Evidencia Fotográfica Global (hasta 4 fotos) */}
                <div className="lg:col-span-5">
                  <label className="text-xs font-black uppercase text-[var(--color-text-muted)] block mb-3">
                    Fotografías Generales del Relevamiento ({fotos?.filter(Boolean).length || 0}/4):
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((index) => {
                      const photoUrl = fotos?.[index];
                      return (
                        <div
                          key={index}
                          className="aspect-video sm:aspect-square rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-center relative overflow-hidden hover:border-blue-400 transition-colors"
                        >
                          {photoUrl ? (
                            <>
                              <img src={photoUrl} alt={`Evidencia ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  const newFotos = [...(fotos || [])];
                                  newFotos.splice(index, 1);
                                  setFotos(newFotos);
                                }}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md border-none cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] p-3 text-center">
                              <Camera size={22} className="mb-1.5 text-blue-500" />
                              <span className="text-[11px] font-extrabold uppercase">Foto #{index + 1}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressImage(file, { maxDimension: 640, quality: 0.65 });
                                      const newFotos = [...(fotos || [])];
                                      newFotos[index] = compressed || '';
                                      setFotos(newFotos.filter(Boolean));
                                    } catch (err) {
                                      console.warn('Error compressing general photo:', err);
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        const newFotos = [...(fotos || [])];
                                        newFotos[index] = reader.result as string;
                                        setFotos(newFotos.filter(Boolean));
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 4: OBSERVACIONES, PLAN DE ACCIÓN (CAPA) Y NORMATIVA LEGAL */}
          {(viewAllSteps || currentStep === 4) &&
        <div className="no-print mb-6 space-y-5">
                {/* OBSERVACIONES GENERALES */}
                <div className="rounded-3xl border border-[var(--color-border)] p-5 sm:p-6 bg-[var(--color-surface)] shadow-sm">
                    <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 block">
                            SECCIÓN 4A • DICTAMEN Y COMENTARIOS
                          </span>
                          <label className="text-sm font-black uppercase text-[var(--color-text)]">
                            Observaciones Generales y Conclusiones del Inspector
                          </label>
                        </div>
                        <SpeechButton onTranscript={(text) => setObservations((prev) => prev ? `${prev} ${text}` : text)} />
                    </div>
                    <textarea
                        rows={3}
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Ingrese observaciones generales, recomendaciones operativas o conclusiones técnicas..."
                        className="w-full p-3.5 border border-[var(--color-border)] focus:border-blue-500 rounded-2xl text-sm font-semibold outline-none bg-[var(--color-background)] text-[var(--color-text)]"
                    />
                </div>

                {/* PLAN DE ACCIÓN CORRECTIVA (CAPA) */}
                <div className="rounded-3xl border border-amber-500/40 p-5 sm:p-6 bg-[var(--color-surface)] shadow-sm">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block">
                            SECCIÓN 4B • SEGUIMIENTO DE DESVÍOS (CAPA)
                          </span>
                          <label className="text-sm font-black uppercase text-[var(--color-text)]">
                            Plan de Acción Correctiva ({actionPlan.length})
                          </label>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={generateActionPlanFromNc}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white text-xs font-extrabold uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Sparkles size={14} /> Autocompletar desde Desvíos (NC)
                          </button>
                          <SpeechButton onTranscript={(text) => setNewAction((prev) => ({ ...prev, action: prev.action ? `${prev.action} ${text}` : text }))} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mb-4">
                        <input
                          type="text"
                          placeholder="Describir acción correctiva o preventiva..."
                          value={newAction.action}
                          onChange={(e) => setNewAction({ ...newAction, action: e.target.value })}
                          className="sm:col-span-5 px-3.5 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-semibold outline-none bg-[var(--color-background)] text-[var(--color-text)]"
                        />
                        <input
                          type="text"
                          placeholder="Responsable asignado"
                          value={newAction.responsible}
                          onChange={(e) => setNewAction({ ...newAction, responsible: e.target.value })}
                          className="sm:col-span-3 px-3.5 py-2.5 border border-[var(--color-border)] rounded-xl text-sm font-semibold outline-none bg-[var(--color-background)] text-[var(--color-text)]"
                        />
                        <input
                          type="date"
                          value={newAction.dueDate}
                          onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
                          className="sm:col-span-2 px-3 py-2.5 border border-[var(--color-border)] rounded-xl text-xs font-bold outline-none bg-[var(--color-background)] text-[var(--color-text)]"
                        />
                        <div className="sm:col-span-2 flex gap-2">
                          <select
                            value={newAction.priority}
                            onChange={(e) => setNewAction({ ...newAction, priority: e.target.value })}
                            className="flex-1 px-2.5 py-2.5 border border-[var(--color-border)] rounded-xl text-xs font-bold outline-none bg-[var(--color-background)] text-[var(--color-text)]"
                          >
                            <option value="bajo">🟢 Bajo</option>
                            <option value="medio">🟡 Medio</option>
                            <option value="alto">🟠 Alto</option>
                            <option value="critico">🔴 Crítico</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (newAction.action.trim()) {
                                setActionPlan([...actionPlan, { ...newAction, id: Date.now() }]);
                                setNewAction({ action: '', responsible: '', dueDate: '', priority: 'medio' });
                                toast.success('Acción agregada ✅');
                              }
                            }}
                            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl border-none cursor-pointer flex items-center justify-center shrink-0"
                            title="Agregar acción"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                    </div>

                    {actionPlan.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {actionPlan.map((action, idx) => (
                          <div key={action.id} className="bg-[var(--color-background)] border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                            <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="m-0 font-bold text-xs sm:text-sm text-[var(--color-text)]">{action.action}</p>
                              <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] font-bold">
                                {action.responsible && <span className="text-[var(--color-text-muted)]">👤 {action.responsible}</span>}
                                {action.dueDate && <span className="text-rose-500">📅 {new Date(action.dueDate).toLocaleDateString('es-AR')}</span>}
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase text-[10px] font-black">
                                  {action.priority}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActionPlan(actionPlan.filter((a) => a.id !== action.id));
                                toast.success('Acción eliminada');
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-none cursor-pointer shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {/* PRÓXIMA REVISIÓN + NORMATIVA APLICABLE */}
                <div className="rounded-3xl border border-[var(--color-border)] p-5 sm:p-6 bg-[var(--color-surface)] shadow-sm space-y-5">
                  <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar size={22} className="text-blue-500" />
                      <div>
                        <p className="m-0 font-black text-sm text-[var(--color-text)] uppercase">Próxima Revisión Programada</p>
                        <p className="m-0 text-xs text-[var(--color-text-muted)]">Fecha sugerida para la próxima auditoría periódica</p>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={nextReview}
                      onChange={(e) => setNextReview(e.target.value)}
                      className="px-3.5 py-2 border border-[var(--color-border)] rounded-xl text-sm font-bold outline-none bg-[var(--color-surface)] text-[var(--color-text)]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 block">
                          SECCIÓN 4C • ENCUADRE REGULATORIO
                        </span>
                        <h4 className="m-0 text-sm font-black uppercase text-[var(--color-text)]">
                          Normativa Legal Aplicable ({selectedNorms.length} seleccionadas)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={suggestNormsFromTemplates}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white text-xs font-extrabold uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Sparkles size={14} /> Sugerir Normativa Automática
                      </button>
                    </div>

                    {Array.from(new Set(availableNorms.map((norm) => norm.category))).map((category) => (
                      <div key={category} className="mb-3">
                        <h5 className="text-[11px] font-black text-[var(--color-text-muted)] uppercase mb-2">{category}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {availableNorms
                            .filter((norm) => norm.category === category)
                            .map((norm) => {
                              const isSelected = selectedNorms.includes(norm.id);
                              return (
                                <label
                                  key={norm.id}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer border transition-all ${
                                    isSelected
                                      ? 'bg-purple-500/15 border-purple-500 text-[var(--color-text)]'
                                      : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-purple-400/50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedNorms([...selectedNorms, norm.id]);
                                      } else {
                                        setSelectedNorms(selectedNorms.filter((id) => id !== norm.id));
                                      }
                                    }}
                                    className="w-4 h-4 mt-0.5 cursor-pointer shrink-0"
                                    style={{ accentColor: '#9333ea' }}
                                  />
                                  <span className="text-xs font-extrabold leading-tight flex-1 text-left">{norm.name}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
        }

            {/* SECCIÓN 5: FIRMAS Y AUTORIZACIONES */}
            {(viewAllSteps || currentStep === 5) &&
        <div className="no-print mt-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4 mb-5">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Pencil size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                      SECCIÓN 5 • VALIDACIÓN Y CIERRE DE INSPECCIÓN
                    </span>
                    <h3 className="m-0 text-base font-black text-[var(--color-text)]">
                      Firmas Digitales y Pie Institucional con QR
                    </h3>
                  </div>
                </div>

                {/* Selector de firmas e información institucional */}
                <div className="no-print mb-6 p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[var(--color-text)] font-extrabold text-xs uppercase tracking-wider">
                        Seleccioná las firmas a incluir en el PDF:
                      </span>
                      <label
                        className="flex items-center gap-2 cursor-pointer select-none px-3.5 py-1.5 rounded-full font-extrabold text-xs transition-all"
                        style={{
                          border: showFooter ? '1px solid #10b981' : '1px solid #cbd5e1',
                          background: showFooter ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                          color: showFooter ? '#10b981' : '#64748b'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={showFooter}
                          onChange={(e) => setShowFooter(e.target.checked)}
                          className="hidden"
                        />
                        <CheckCircle2 size={14} />
                        <span>Incluir Pie Legal y QR</span>
                      </label>
                    </div>

                    <div className="flex gap-2.5 flex-wrap">
                        {[
                          { id: 'operator', label: 'Responsable / Operador' },
                          { id: 'professional', label: 'Profesional Actuante H&S' },
                          { id: 'supervisor', label: 'Supervisión / Verificador' }
                        ].map((sig) => {
                          const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                          return (
                            <label
                              key={sig.id}
                              className="flex items-center gap-2 cursor-pointer select-none px-4 py-2 rounded-xl font-extrabold text-xs transition-all"
                              style={{
                                border: isChecked ? '1.5px solid #3b82f6' : '1px solid var(--color-border)',
                                background: isChecked ? 'rgba(59, 130, 246, 0.12)' : 'var(--color-surface)',
                                color: isChecked ? '#3b82f6' : 'var(--color-text-muted)'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => setShowSignatures((s) => ({ ...s, [sig.id]: e.target.checked }))}
                                className="hidden"
                              />
                              <div
                                style={{
                                  border: isChecked ? '2px solid #3b82f6' : '2px solid #94a3b8',
                                  background: isChecked ? '#3b82f6' : 'transparent'
                                }}
                                className="w-4 h-4 rounded flex items-center justify-center transition-all shrink-0"
                              >
                                {isChecked && <Check size={11} color="white" strokeWidth={3} />}
                              </div>
                              <span>{sig.label}</span>
                            </label>
                          );
                        })}
                    </div>
                </div>

                {/* Vista previa en vivo del bloque de firmas sobre papel claro (Responsiva en celular) */}
                <div
                  className="mb-6 p-3 sm:p-4 rounded-2xl border border-slate-300 bg-white text-slate-900 overflow-x-auto"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                >
                    <div className="min-w-[540px] sm:min-w-0">
                      <PdfSignatures
                        compact={true}
                        hideFooter={true}
                        data={{
                          operatorSignature,
                          signature,
                          supervisorSignature,
                          showSignatures,
                          professionalSignature: professional.signature,
                          professionalName: professional.name,
                          professionalLicense: professional.license,
                          professionalStamp: professional.stamp
                        }}
                        box1={showSignatures.operator ? {
                          title: 'RESPONSABLE / OPERADOR',
                          subtitle: inspectionInfo.responsableArea || companyInfo.responsable || 'Control Operativo',
                          signatureUrl: operatorSignature || null,
                          isProfessional: false
                        } : null}
                        box2={showSignatures.professional ? {
                          title: 'PROFESIONAL ACTUANTE H&S',
                          subtitle: (professional.name || companyInfo.inspector || 'Firma de Especialista').toUpperCase(),
                          signatureUrl: signature || professional.signature || null,
                          stampUrl: professional.stamp || null,
                          isProfessional: true,
                          license: professional.license
                        } : null}
                        box3={showSignatures.supervisor ? {
                          title: 'SUPERVISIÓN / VERIFICADOR',
                          subtitle: 'Cierre de Inspección',
                          signatureUrl: supervisorSignature || null,
                          isProfessional: false
                        } : null}
                      />
                      {showFooter && <PdfBrandingFooter />}
                    </div>
                </div>

                {/* Pizarras de Firma Digital */}
                <div className="pt-4 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {showSignatures.operator && (
                      <SignatureCanvas
                        onSave={(sig) => setOperatorSignature(sig || '')}
                        initialImage={operatorSignature}
                        label="Firma de Responsable / Operador"
                      />
                    )}
                    {showSignatures.professional && (
                      <SignatureCanvas
                        onSave={(sig) => setSignature(sig || '')}
                        initialImage={signature}
                        label="Firma de Profesional / Inspector"
                      />
                    )}
                    {showSignatures.supervisor && (
                      <SignatureCanvas
                        onSave={(sig) => setSupervisorSignature(sig || '')}
                        initialImage={supervisorSignature}
                        label="Firma de Supervisión / Verificador"
                      />
                    )}
                </div>
        </div>
      }
      </ModuleFormLayout>

      {/* Barra de Navegación Centrada: En pasos 1 a 4 solo muestra Cancelar/Anterior y Siguiente; en paso 5 (Firma y Cierre) habilita Previa A4, Compartir, Imprimir y Guardar */}
      <div className="flex flex-col items-center justify-center gap-3 mt-6 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md no-print w-full">
          {currentStep < totalSteps ? (
            <div className="flex items-center justify-center gap-3 w-full max-w-md mx-auto">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  style={{ backgroundColor: '#475569', color: '#fff' }}
                  className="flex-1 py-3 px-5 rounded-xl font-extrabold cursor-pointer flex items-center justify-center gap-2 border-none shadow-xs text-xs sm:text-sm uppercase transition-transform active:scale-95"
                >
                  <ArrowLeft size={16} /> PASO ANTERIOR
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setCurrentStep(1); setSearchParams({}); }}
                  style={{ backgroundColor: '#ef4444', color: '#fff' }}
                  className="flex-1 py-3 px-5 rounded-xl font-extrabold cursor-pointer flex items-center justify-center gap-2 border-none shadow-xs text-xs sm:text-sm uppercase transition-transform active:scale-95"
                >
                  <ArrowLeft size={16} /> CANCELAR
                </button>
              )}

              <button
                type="button"
                onClick={nextStep}
                style={{ backgroundColor: '#2563eb', color: '#fff' }}
                className="flex-1 py-3 px-5 rounded-xl font-extrabold cursor-pointer flex items-center justify-center gap-2 border-none shadow-md text-xs sm:text-sm uppercase transition-transform active:scale-95"
              >
                SIGUIENTE PASO <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 w-full">
              <div className="grid grid-cols-2 sm:flex items-center justify-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={prevStep}
                  style={{ backgroundColor: '#475569', color: '#fff' }}
                  className="py-3 px-4 rounded-xl font-extrabold cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs text-xs uppercase transition-transform active:scale-95"
                >
                  <ArrowLeft size={16} /> PASO ANTERIOR
                </button>

                <button
                  type="button"
                  onClick={() => { setShowForm(false); setCurrentStep(1); setSearchParams({}); }}
                  style={{ backgroundColor: '#ef4444', color: '#fff' }}
                  className="py-3 px-4 rounded-xl font-extrabold cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs text-xs uppercase transition-transform active:scale-95"
                >
                  <X size={16} /> CANCELAR
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const data = { id: searchParams.get('id') || Date.now().toString(), checklistTitle, companyInfo, inspectionInfo, activeSections, observations, actionPlan, nextReview, selectedNorms, epps, fotos, showSignatures, showFooter, operatorSignature, signature, supervisorSignature, equipo: inspectionInfo?.item || checklistTitle || 'Checklist', empresa: companyInfo?.name || '-', fecha: inspectionInfo?.date || new Date().toISOString() };
                    setPreviewItem(data);
                  }}
                  style={{ backgroundColor: '#0284c7', color: '#fff' }}
                  className="py-3 px-4 rounded-xl font-extrabold cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs text-xs uppercase transition-transform active:scale-95"
                >
                  <EyeIcon size={16} /> PREVIA A4
                </button>

                <button
                  type="button"
                  onClick={() => requirePro(() => {
                    const data = { id: searchParams.get('id') || Date.now().toString(), checklistTitle, companyInfo, inspectionInfo, activeSections, observations, actionPlan, nextReview, selectedNorms, epps, fotos, showSignatures, showFooter, operatorSignature, signature, supervisorSignature, equipo: inspectionInfo?.item || checklistTitle || 'Checklist', empresa: companyInfo?.name || '-', fecha: inspectionInfo?.date || new Date().toISOString() };
                    setAutoPrintShare(false);
                    setShareItem(data as any);
                  })}
                  style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                  className="py-3 px-4 rounded-xl font-extrabold cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs text-xs uppercase transition-transform active:scale-95"
                >
                  <Share2 size={16} /> COMPARTIR
                </button>

                <button
                  type="button"
                  onClick={() => requirePro(() => {
                    const data = { id: searchParams.get('id') || Date.now().toString(), checklistTitle, companyInfo, inspectionInfo, activeSections, observations, actionPlan, nextReview, selectedNorms, epps, fotos, showSignatures, showFooter, operatorSignature, signature, supervisorSignature, equipo: inspectionInfo?.item || checklistTitle || 'Checklist', empresa: companyInfo?.name || '-', fecha: inspectionInfo?.date || new Date().toISOString() };
                    setDirectPrintItem(data);
                    setTimeout(() => {
                      printElementAsDocument('checklist-direct-print');
                    }, 120);
                  })}
                  style={{ backgroundColor: '#1e293b', color: '#fff' }}
                  className="col-span-2 sm:col-span-1 py-3 px-4 rounded-xl font-extrabold cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-xs text-xs uppercase transition-transform active:scale-95"
                >
                  <Printer size={16} /> IMPRIMIR
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => requirePro(() => handleSave())}
                  style={{ backgroundColor: isSaving ? '#94a3b8' : '#059669', color: '#fff' }}
                  className="col-span-2 sm:col-span-1 py-3 px-6 rounded-xl font-black cursor-pointer flex items-center justify-center gap-2 border-none shadow-[0_4px_14px_rgba(5,150,105,0.4)] text-xs sm:text-sm uppercase transition-transform active:scale-95"
                >
                  <Save size={16} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR CHECKLIST'}
                </button>
              </div>
            </div>
          )}
      </div>
      </>
      }
    
      {/* Modal de Previsualización A4 Realista */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[960px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-800/90 select-none flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white leading-tight m-0">
                    Vista Previa A4 • Checklist de Inspección
                  </h2>
                  <p className="text-xs text-slate-400 m-0">
                    {previewItem.checklistTitle || previewItem.equipo || 'Inspección de Seguridad'} • Visualización exacta para impresión y descarga
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadFromPreview('checklist-preview-modal-content', previewItem.equipo || previewItem.checklistTitle)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border-none"
                >
                  <Download size={16} /> Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={() => requirePro(() => printElementAsDocument('checklist-preview-modal-content'))}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer border-none"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
                  title="Cerrar vista previa"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/70 flex justify-center">
              <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
                <ChecklistPdfGenerator
                  checklistData={{ ...previewItem, availableNorms }}
                  isHeadless={true}
                  customId="checklist-preview-modal-content"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-700/80 bg-slate-800/90 flex items-center justify-between text-xs text-slate-400">
              <span>Formato reglamentario Ley 19.587 / Dec. 351 / Dec. 911 • Firmas y sellos protegidos contra cortes de página</span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor Offscreen para Impresión Directa */}
      {directPrintItem && (
        <div className="ats-pdf-offscreen" id="checklist-direct-print" aria-hidden="true">
          <ChecklistPdfGenerator
            checklistData={{ ...directPrintItem, availableNorms }}
            isHeadless={true}
            customId="checklist-direct-print"
          />
        </div>
      )}

      <ShareModal 
        isOpen={!!shareItem} 
        open={!!shareItem} 
        onClose={() => {setShareItem(null); setAutoPrintShare(false);}} 
        autoPrint={autoPrintShare} 
        title={`Checklist — ${(shareItem as any)?.equipo || (shareItem as any)?.checklistTitle || ''}`} 
        text={buildShareMessage(shareItem)} 
        rawMessage={buildShareMessage(shareItem)} 
        elementIdToPrint="pdf-content" 
        fileName={`Checklist_${(shareItem as any)?.equipo || (shareItem as any)?.checklistTitle || 'Reporte'}.pdf`} 
      />
      <div className="ats-pdf-offscreen">
        {shareItem && <ChecklistPdfGenerator checklistData={{ ...shareItem, availableNorms }} isHeadless={true} pdfElementId="pdf-content" />}
      </div>
      {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} details={(qrTarget as any).details} onClose={() => setQrTarget(null)} />}
      {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
      {showIndustryModal && (
        <IndustryChecklistModal
          isOpen={showIndustryModal}
          onClose={() => setShowIndustryModal(false)}
          onSelectChecklist={handleLoadIndustryChecklist}
        />
      )}
    </div>
  );
}

function DocBox({ label, value, onChange, type = "text", large = false, highlight = false, flex = 1, list = null }) {
  return (
    <div className={`p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] flex flex-col justify-center transition-colors focus-within:border-blue-500 ${highlight ? 'ring-1 ring-blue-500/30' : ''}`}>
      <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-wider block mb-1 leading-tight text-left">
        {label}
      </label>
      <input
        type={type}
        list={list}
        className={`w-full px-2 py-1.5 rounded-lg outline-none bg-transparent border-none font-extrabold ${large ? 'text-base tracking-tight' : 'text-sm'} text-[var(--color-text)] text-left min-w-0`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Completar..."
      />
    </div>
  );
}

function StatusBtn({ active, type, onClick, label }) {
  const activeStyle =
    type === 'OK'
      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
      : type === 'FAIL'
      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
      : 'bg-slate-600 text-white border-slate-600 shadow-xs';
  const idleStyle =
    'bg-transparent text-[var(--color-text-muted)] border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-700/50';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black uppercase border cursor-pointer transition-all text-center justify-center ${
        active ? activeStyle : idleStyle
      }`}
    >
      {label}
    </button>
  );
}

function SpeechButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Dictado por voz no soportado en este navegador');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-AR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onTranscript(transcript);
          toast.success('Texto dictado agregado ✅');
        }
      };
      recognition.start();
    } catch {
      setIsListening(false);
      toast.error('Error al activar el micrófono');
    }
  };

  return (
    <button
      type="button"
      onClick={startListening}
      className={`px-2.5 py-1 rounded-lg border-none cursor-pointer text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
        isListening
          ? 'bg-red-600 text-white animate-pulse'
          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
      }`}
      title="Dictar observaciones por voz"
    >
      <Mic size={14} />
      <span>{isListening ? 'Escuchando...' : 'Dictar'}</span>
    </button>
  );
}