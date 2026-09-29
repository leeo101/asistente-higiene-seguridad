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
  HardHat, Ear, Eye as EyeIcon, Mic, Wrench, BookOpen, Pickaxe, Package, Tractor
} from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { downloadCSV } from '../services/exportCsv';
import QRModal from '../components/QRModal';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
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
import { generatePdfBlob } from '../utils/pdfHelper';
import { savePdfBlob, getPdfBlob } from '../utils/indexedDBHelper';
import IndustryChecklistModal from '../components/IndustryChecklistModal';
import type { IndustryChecklistTemplate } from '../data/industryChecklists';
import { compressImage } from '../utils/imageCompressor';

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
  { id: 'dec4234', name: 'Decreto 4.234 - Reglamento General', category: 'Nacional' },
  { id: 'res616', name: 'Res. MTES 616/14 - Trabajo en Altura', category: 'MTES' },
  { id: 'ips', name: 'Reglamento IPS - Instituto de Previsión Social', category: 'IPS' }],

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
  let parsed: any = null;
  const stored = localStorage.getItem(`checklist_${id}`);
  if (stored) {
    try { parsed = JSON.parse(stored); } catch {}
  }
  if (!parsed || (!parsed.activeSections && !parsed.items && !parsed.checks)) {
    if (fallbackItem && (fallbackItem.activeSections || fallbackItem.items || fallbackItem.checks)) {
      parsed = fallbackItem;
    } else {
      const historyRaw = localStorage.getItem('tool_checklists_history');
      if (historyRaw) {
        try {
          const hist = JSON.parse(historyRaw);
          parsed = hist.find((h: any) => h.id === id);
        } catch {}
      }
    }
  }
  if (!parsed) return { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  try {
    let items = parsed.items || parsed.checks || [];
    if (parsed.activeSections) {
      items = parsed.activeSections.flatMap((s: any) => s.items || []);
    } else if (!Array.isArray(items) && Object.keys(items).length > 0) {
      items = Object.values(items);
    }

    const arr = Array.isArray(items) ? items : [];
    const nok = arr.filter((c: any) => c.status === 'NC' || c.status === 'FAIL' || c.value === 'NO' || c.estado === 'NO' || c.checked === false || c.result === 'no').length;
    const obs = arr.filter((c: any) => c.observation || c.observacion || c.observaciones).length;
    if (arr.length === 0) return { label: 'Vacío', color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
    if (nok > 0) return { label: 'Rechazado', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (obs > 0) return { label: 'Con Obs.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  } catch {
    return { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  }
};

export default function ChecklistManager(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncCollection, syncPulse } = useSync();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [history, setHistory] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);
  const [shareItem, setShareItem] = useState(null);
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
    // Obtener país del usuario desde personalData
    const savedData = localStorage.getItem('personalData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      const country = parsed.country || 'argentina';
      setUserCountry(country);
      setAvailableNorms(getNormsForCountry(country));
    } else {
      setAvailableNorms(getNormsForCountry('argentina'));
    }
  }, []);

  useEffect(() => {
    const historyRaw = localStorage.getItem('tool_checklists_history');
    if (historyRaw) setHistory(JSON.parse(historyRaw));
  }, [syncPulse]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setShowForm(true);
      setCurrentStep(1); // Jump to step 1 so they can see templates and company info

      let parsed: any = null;
      const savedData = localStorage.getItem(`checklist_${id}`);
      if (savedData) {
        try { parsed = JSON.parse(savedData); } catch {}
      }
      if (!parsed || (!parsed.activeSections && !parsed.items && !parsed.checks)) {
        const historyRaw = localStorage.getItem('tool_checklists_history');
        if (historyRaw) {
          try {
            const hist = JSON.parse(historyRaw);
            const found = hist.find((h: any) => h.id === id);
            if (found) parsed = found;
          } catch {}
        }
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
      try {
        localStorage.setItem(`checklist_${id}`, JSON.stringify(fullData));
      } catch (storageErr) {
        console.warn('Quota exceeded saving deep checklist, saving without heavy media:', storageErr);
        try {
          const lightweight = { ...fullData, fotos: [] };
          localStorage.setItem(`checklist_${id}`, JSON.stringify(lightweight));
        } catch {}
      }

      // Sync with history list
      let history: any[] = [];
      try {
        history = JSON.parse(localStorage.getItem('tool_checklists_history') || '[]');
      } catch {
        history = [];
      }

      const existingIndex = history.findIndex((h: any) => h.id === id);
      if (existingIndex >= 0) {
        history[existingIndex] = fullData;
      } else {
        history.unshift(fullData);
      }

      try {
        localStorage.setItem('tool_checklists_history', JSON.stringify(history));
      } catch (histErr) {
        console.warn('History storage quota reached, saving trimmed history:', histErr);
        const trimmed = history.slice(0, 40).map(h => ({ ...h, fotos: [] }));
        try {
          localStorage.setItem('tool_checklists_history', JSON.stringify(trimmed));
        } catch {}
      }

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
    toast.success('Todos los ítems marcados como OK');
  };

  // Progress calculation
  const progressPct = Math.round((currentStep / totalSteps) * 100);
  const progressLabel = progressPct === 100 ? 'Listo para guardar y exportar ✅' : progressPct >= 66 ? 'Casi completo' : progressPct >= 33 ? 'En progreso' : 'Pendiente';
  const progressColor = progressPct === 100 ? '#10b981' : progressPct >= 66 ? '#f59e0b' : progressPct >= 33 ? '#3b82f6' : '#94a3b8';

  const confirmDelete = () => {
    const updated = history.filter((item: any) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('tool_checklists_history', JSON.stringify(updated));
    syncCollection('tool_checklists_history', updated);
    localStorage.removeItem(`checklist_${deleteTarget}`);
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
      // 1. Cargar datos completos desde localStorage
      let stored = localStorage.getItem('checklist_' + item.id);
      let parsed = stored ? JSON.parse(stored) : item;

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
    <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)] white-space-[nowrap]">
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
        try {
          const parsed = JSON.parse(localStorage.getItem('checklist_' + item.id) || '{}');
          title = parsed.checklistTitle;
          if (!title && parsed.activeSections && parsed.activeSections.length > 0) {
            title = parsed.activeSections.map((s: any) => s.title).join(' + ');
          }
          title = title || 'General';
        } catch {title = 'General';}
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
    header: 'Estado',
    accessor: 'id',
    render: (item: any) => {
      const st = getChecklistStatus(item.id);
      return (
        <span style={{ background: st.bg, color: st.color }} className="p-[0.25rem_0.7rem] rounded-[999px] text-[0.72rem] font-[800]">
                        {st.label}
                    </span>);

    }
  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
                    
                    {/* KPIs */}
                    <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div 
                            onClick={() => setOnlyNcFilter(false)}
                            className="p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400"
                        >
                            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Total Checklists</span>
                                <ClipboardCheck size={20} />
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{history.length}</div>
                            <span className="text-[11px] text-slate-500">Formularios registrados</span>
                        </div>

                        <div 
                            onClick={() => setOnlyNcFilter(!onlyNcFilter)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                                onlyNcFilter 
                                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md ring-2 ring-rose-500/30' 
                                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
                            }`}
                        >
                            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Rechazados / NC</span>
                                <TriangleAlert size={20} />
                            </div>
                            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                {history.filter(h => getChecklistStatus(h.id).label === 'Rechazado').length}
                            </div>
                            <span className="text-[11px] font-bold text-rose-500">
                                {onlyNcFilter ? 'Filtrando desvíos (haz clic para ver todos)' : 'Con observaciones críticas (clic para filtrar)'}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl border transition-all bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80">
                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Última Semana</span>
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {history.filter(h => new Date(h.fecha) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                            </div>
                            <span className="text-[11px] text-slate-500">Inspeccionados recientemente</span>
                        </div>
                    </div>

                    <div className="mb-[1.5rem] flex gap-[1rem] flex-wrap items-center">
                        <button
                            onClick={startNewBlankChecklist}
                            style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', fontSize: '0.85rem', fontWeight: '800', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                            className="transition-transform hover:-translate-y-0.5 whitespace-nowrap h-[54px]">
                            <Plus size={18} strokeWidth={2.5} /> NUEVO CHECKLIST
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowIndustryModal(true)}
                            className="h-[54px] px-4 rounded-[16px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase flex items-center gap-2 cursor-pointer transition-all shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 whitespace-nowrap border-none"
                        >
                            <BookOpen size={17} /> Catálogo por Industria
                        </button>
                        <button
                            onClick={() => setOnlyNcFilter(!onlyNcFilter)}
                            className={`h-[54px] px-4 rounded-[16px] border-[2px_solid_var(--color-border)] font-extrabold text-xs uppercase flex items-center gap-2 cursor-pointer transition-all shadow-[0_4px_20px_rgba(0,0,0,0.05)] ${
                                onlyNcFilter 
                                    ? 'bg-rose-600 text-white border-rose-600' 
                                    : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:border-rose-400'
                            }`}
                        >
                            <TriangleAlert size={16} /> {onlyNcFilter ? 'VER TODOS LOS CHECKLISTS' : 'VER SOLO DESVÍOS PENDIENTES'}
                        </button>
                        <div className="flex-[1_1_300px] relative h-[54px]">
                            <Search 
                              size={20} 
                              className="text-[var(--color-text-muted)] pointer-events-none z-10" 
                              style={{ 
                                position: 'absolute', 
                                left: '1.2rem', 
                                top: 0, 
                                bottom: 0, 
                                marginTop: 'auto', 
                                marginBottom: 'auto', 
                                display: 'block' 
                              }} 
                            />
                            <input
                              type="text"
                              placeholder="Buscar por equipo, empresa o serial..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)} 
                              style={{ width: '100%', height: '54px', paddingLeft: '3.5rem', paddingRight: '1rem', outline: 'none', boxSizing: 'border-box' }}
                              className="rounded-[16px] border-[2px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[1rem] font-medium focus:border-[var(--color-primary)] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.05)]" 
                            />
                        </div>
                        <div className="flex-[0_1_250px]">
                            <select
                                value={filterEmpresa}
                                onChange={(e) => setFilterEmpresa(e.target.value)}
                                style={{ color: filterEmpresa ? 'var(--color-text)' : 'var(--color-text-muted)' }}
                                className="w-[100%] h-[54px] px-[1rem] rounded-[16px] border-[2px_solid_var(--color-border)] text-[1rem] outline-[none] bg-[var(--color-surface)] box-shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                            >
                                <option value="">Todas las Empresas</option>
                                {uniqueEmpresas.map((emp: any) => (
                                    <option key={emp} value={emp}>{emp}</option>
                                ))}
                            </select>
                        </div>
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
        <div className="no-print bg-[linear-gradient(135deg,_#3b82f6_0%,_#2563eb_100%)] text-[#fff] p-[1rem_1.5rem] rounded-[16px] mb-[1.5rem] mt-[1.5rem] flex justify-space-between items-center box-shadow-[0_8px_30px_rgba(37,99,235,0.2)] relative flex-wrap gap-[1rem]">
                    <div className="flex items-start gap-[1rem] flex-[1]">
                        <div className="bg-[rgba(255,255,255,0.2)] p-[0.6rem] rounded-[12px]">
                            <Info size={24} />
                        </div>
                        <div>
                            <h4 className="m-[0] text-[1.1rem] font-[900]">¡Todo es editable!</h4>
                            <p className="m-[0.3rem_0_0_0] text-[0.85rem] font-[600] text-[rgba(255,255,255,0.9)] line-height-[1.4]">
                                Recuerda que puedes hacer clic en el <strong>Título Principal</strong>, en los <strong>Títulos de las Secciones</strong> o en las <strong>Preguntas</strong> para modificarlas y adaptarlas a la inspección que necesites.
                            </p>
                        </div>
                    </div>
                    <button
            onClick={() => {
              setShowTutorialBanner(false);
              localStorage.setItem('checklist_tutorial_seen', 'true');
            }} className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-none p-[0.6rem_1.2rem] rounded-[10px] font-[900] cursor-pointer flex-shrink-[0] box-shadow-[0_4px_12px_rgba(0,0,0,0.1)]">

            
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
            {/* Progress Section */}
            <div className="no-print mb-[2rem] mt-[1.5rem] p-[2.5rem_2rem] bg-[var(--color-surface)] rounded-[24px] border-[1px_solid_var(--color-border)] flex flex-col gap-[1.2rem] box-shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-space-between gap-[1.5rem] flex-wrap">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="m-[0] text-[clamp(1.1rem,_4vw,_1.4rem)] font-[900] text-[var(--color-text)] letter-spacing-[-0.5px] flex items-center gap-[0.6rem]">
                                <ShieldCheck className="text-blue-600" size={24} />
                                Relevamiento de Condiciones
                            </h2>
                            <p className="m-[0] text-[var(--color-text-muted)] font-[600] text-[0.75rem] uppercase letter-spacing-[1px]">Progreso del Checklist</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-[0.6rem] flex-shrink-[0]">
                        <span style={{ color: progressColor }} className="text-[1.4rem] font-[900]">{progressPct}%</span>
                        <span className="text-[0.75rem] font-[700] text-[var(--color-text-muted)]">{progressLabel}</span>
                    </div>
                </div>

                {/* Progress Bar Graphic */}
                <div className="flex flex-col gap-[0.6rem] mt-[1rem]">
                    <div className="h-[8px] bg-[var(--color-background)] rounded-[999px] overflow-hidden">
                        <div style={{
                width: `${progressPct}%`
              }} className="h-full bg-blue-600 rounded-[999px] transition-[width_0.5s_cubic-bezier(0.4,_0,_0.2,_1)] shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                </div>
            </div>

            {currentStep === 1 &&
        <ModuleFormDocument>
            <div id="checklist-editor-content" className="card ats-editor-panel w-[100%] box-sizing-[border-box] p-[1rem] m-[0_auto] mb-[2rem]">
                <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 sm:gap-6 border-b-4 pb-6 mb-8 border-color-[var(--color-border)]">
                    {/* Top Left Text */}
                    <div className="w-full sm:w-auto sm:flex-1 text-center sm:text-left">
                        <p className="m-[0] font-[700] text-[0.65rem] uppercase text-[var(--color-text-muted)] letter-spacing-[0.05em]">Sistema de Gestión</p>
                        <p className="m-[0] font-[900] text-[0.75rem] uppercase text-[var(--color-text)]">Control HYS</p>
                    </div>

                    {/* Center Main Title */}
                    <div className="w-full sm:w-auto sm:flex-1 flex flex-col items-center justify-center text-center">
                        <input
                  value={checklistTitle}
                  onChange={(e) => setChecklistTitle(e.target.value)}

                  title="Haz clic para editar el título" className="m-[0] font-[900] text-[clamp(1.5rem,_4vw,_2.5rem)] letter-spacing-[-0.02em] uppercase line-height-[1] text-center bg-[transparent] border-none border-bottom-[1px_dashed_var(--color-border)] outline-[none] text-[var(--color-text)] w-[100%] max-w-[500px]" />
                
                        <p className="m-[0] text-[var(--color-text-muted)] font-[900] text-[0.6rem] uppercase letter-spacing-[0.4em] mt-[0.25rem]">Inspección de Seguridad</p>
                    </div>

                    {/* Right Document Counter + Logo */}
                    <div className="w-full sm:w-auto sm:flex-1 flex flex-col items-center sm:items-end gap-2 text-center sm:text-right">
                        <CompanyLogo className="h-[40px] max-w-[120px]" />
                        <div>
                            <div className="text-[0.6rem] font-[900] text-[var(--color-border)] uppercase letter-spacing-[0.1em] mb-[0.25rem]">PÁGINA</div>
                            <div className="font-[900] text-[1.5rem] text-[var(--color-text)]">01 / 01</div>
                        </div>
                    </div>
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
                  <div className="hover:border-blue-400/50 hover:shadow-md border-[2px_solid_var(--color-border)] rounded-[16px] mb-[2.5rem] w-[100%] overflow-[hidden] bg-[var(--color-surface)] box-shadow-[var(--shadow-sm)] transition-[all_0.3s] grid-column-[1_/_-1]">
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 border-bottom-[2px_solid_var(--color-border)] w-[100%]">
                                <div className="sm:col-span-2 print:col-span-2"><DocBox label="CLIENTE / EMPRESA" value={companyInfo.name} onChange={(v) => setCompanyInfo({ ...companyInfo, name: v })} large /></div>
                                <div className="sm:col-span-2 print:col-span-2"><DocBox label="UBICACIÓN / DIRECCIÓN" value={companyInfo.address} onChange={(v) => setCompanyInfo({ ...companyInfo, address: v })} /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 w-[100%] border-bottom-[2px_solid_var(--color-border)]">
                                <div className="sm:col-span-1 print:col-span-1"><DocBox label="FECHA" value={inspectionInfo.date} onChange={(v) => setInspectionInfo({ ...inspectionInfo, date: v })} type="date" /></div>
                                
                                {!(hasVehicles && !hasTools && !hasPermits && !hasHeavy && !hasExtinguishers) &&
                    <div className="sm:col-span-2 print:col-span-2"><DocBox label={hasPermits ? "SECTOR / ÁREA" : "ÁREA / EQUIPO INSPECCIONADO"} value={inspectionInfo.item} onChange={(v) => setInspectionInfo({ ...inspectionInfo, item: v })} /></div>
                    }
                                
                                {!hasPermits && !hasVehicles &&
                    <div className="sm:col-span-1 print:col-span-1"><DocBox label={hasExtinguishers ? "CHAPA / NÚMERO" : "Nº IDENTIFICACIÓN (SERIAL)"} value={inspectionInfo.serial} onChange={(v) => setInspectionInfo({ ...inspectionInfo, serial: v })} /></div>
                    }
                                
                                {hasVehicles &&
                    <>
                                        <div className="sm:col-span-1 print:col-span-1"><DocBox label="MARCA / MODELO" value={inspectionInfo.marca || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, marca: v })} /></div>
                                        <div className="sm:col-span-1 print:col-span-1"><DocBox label="DOMINIO (PATENTE)" value={inspectionInfo.patente || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, patente: v })} /></div>
                                        <div className="sm:col-span-1 print:col-span-1"><DocBox label="KILOMETRAJE / HORÓMETRO" value={inspectionInfo.horometro || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, horometro: v })} /></div>
                                    </>
                    }
                            </div>
                            
                            {(hasTools || hasHeavy) && !hasVehicles &&
                  <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 w-[100%] border-bottom-[2px_solid_var(--color-border)]">
                                    <div className="sm:col-span-2 print:col-span-2"><DocBox label="MARCA / MODELO" value={inspectionInfo.marca || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, marca: v })} /></div>
                                </div>
                  }

                            {hasPermits &&
                  <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 w-[100%] border-bottom-[2px_solid_var(--color-border)]">
                                    <div className="sm:col-span-2 print:col-span-2"><DocBox label="Nº PERMISO DE TRABAJO (PT)" value={inspectionInfo.pt || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, pt: v })} /></div>
                                    <div className="sm:col-span-2 print:col-span-2"><DocBox label="RESPONSABLE DEL ÁREA / SUPERVISOR" value={inspectionInfo.responsableArea || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, responsableArea: v })} /></div>
                                </div>
                  }

                            {hasExtinguishers &&
                  <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 w-[100%] border-bottom-[2px_solid_var(--color-border)]">
                                    <div className="sm:col-span-1 print:col-span-1 bg-[rgba(239,_68,_68,_0.05)]">
                                        <DocBox label="VENCIMIENTO CARGA" value={inspectionInfo.expirationDate || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, expirationDate: v })} type="date" />
                                    </div>
                                    <div className="sm:col-span-3 print:col-span-3 bg-[rgba(239,_68,_68,_0.05)]">
                                        <DocBox label="OBSERVACIONES EXTINTOR" value={inspectionInfo.extinguisherObs || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, extinguisherObs: v })} />
                                    </div>
                                </div>
                  }
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4 w-[100%]">
                                <div className="sm:col-span-2 print:col-span-2"><DocBox label="INSPECTOR / RESPONSABLE" value={companyInfo.inspector} onChange={(v) => setCompanyInfo({ ...companyInfo, inspector: v })} /></div>
                                <div className="sm:col-span-2 print:col-span-2"><DocBox label="PROFESIONAL HYS" value={professional.name} onChange={() => {}} /></div>
                            </div>
                        </div>
                    </div>);

            })()}
            </div>
        </ModuleFormDocument>
        }

            {/* TEMPLATE SELECTOR - Responsive Grid */}
            {currentStep === 2 && (
            <div className="no-print mb-[1.5rem] space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-sm gap-3 flex-wrap border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black m-0 text-white flex items-center gap-2">
                      Catálogo Normativo por Industria
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">Construcción / Industria / Minería / Agro</span>
                    </h4>
                    <p className="text-xs text-blue-200 mt-0.5 m-0">Explora checklists técnicos predefinidos con marcos legales específicos, frecuencias recomendadas y puntos críticos.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIndustryModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer border-none shadow-md flex items-center gap-1.5 ml-auto"
                >
                  <BookOpen size={15} /> Abrir Catálogo
                </button>
              </div>

              {/* Pestañas de Categoría para evitar aglomeración */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {[
                  { id: 'all', label: 'Todos', icon: null, count: Object.keys(DEFAULT_TEMPLATES).length },
                  { id: 'construccion', label: 'Construcción', icon: <HardHat size={14} />, count: Object.values(DEFAULT_TEMPLATES).filter(t => t.category === 'construccion').length },
                  { id: 'industria', label: 'Industria & Planta', icon: <Wrench size={14} />, count: Object.values(DEFAULT_TEMPLATES).filter(t => t.category === 'industria').length },
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
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
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

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[0.8rem]">
                {Object.entries(DEFAULT_TEMPLATES)
                  .filter(([_, value]) => templateCategoryTab === 'all' || value.category === templateCategoryTab)
                  .map(([key, value]) => {
                  const active = activeSections.some((s) => s.id === key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleTemplate(key)}
                      className="card p-[0.8rem_0.5rem] m-[0] flex flex-col items-center justify-center gap-[0.4rem] text-center min-h-[80px]"
                      style={{
                        border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: active ? 'var(--color-background)' : 'var(--color-surface)'
                      }}>
                      <div style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                        {React.cloneElement(value.icon as React.ReactElement<any>, { size: 20 })}
                      </div>
                      <span className="text-[0.65rem] font-[800] line-height-[1.1]">{value.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            )}
            
            {/* EDITABLE SECTIONS - Responsive */}
            {currentStep === 2 &&
        <div className="no-print mb-8">
                {activeSections.length > 0 && (
                  <div className="flex justify-between items-center mb-4 p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 text-emerald-600 rounded-lg">
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase text-[var(--color-text)] m-0">Evaluación de Ítems</h4>
                        <p className="text-xs text-[var(--color-text-muted)] m-0">Valida los puntos del relevamiento. Puedes marcar todos de una sola vez.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={checkAllGlobalOk}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer border-none transition-all active:scale-95 ml-auto"
                    >
                      <CheckCircle2 size={16} /> MARCAR TODO COMO OK
                    </button>
                  </div>
                )}
                {activeSections.map((section) => {
            return (
              <div key={section.id} className="card p-[0] mb-[1.5rem]">
                            <div className="bg-[var(--color-background)] p-[1rem] border-bottom-[2px_solid_var(--color-border)] flex flex-col gap-[0.8rem] items-center">
                                <input
                    className="font-black text-xl uppercase tracking-tighter bg-transparent outline-none w-full rounded-lg p-2 focus:ring-0 text-center placeholder:text-slate-400 m-[0] text-[var(--color-text)]"
                    style={{ border: '2px solid #1e293b' }}
                    value={section.title}
                    onChange={(e) => updateSectionTitle(section.id, e.target.value)} />
                  
                                <div className="flex gap-[0.5rem] flex-wrap justify-center">
                                    <button
                      onClick={() => removeSection(section.id)} 
                      style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                      className="p-[0.4rem_0.8rem] text-[0.65rem] font-[900] border-none rounded-[4px] cursor-pointer flex items-center gap-[0.4rem] white-space-[nowrap]">
                                        <X size={12} strokeWidth={4} /> QUITAR
                                    </button>
                                    <button
                      onClick={() => checkAllOk(section.id)} 
                      style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                      className="p-[0.4rem_0.8rem] text-[0.65rem] font-[900] border-none rounded-[4px] cursor-pointer white-space-[nowrap]">
                                        TODO OK
                                    </button>
                                    <button
                      onClick={() => addItem(section.id)} 
                      style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                      className="p-[0.4rem_0.8rem] text-[0.65rem] font-[900] border-none rounded-[4px] cursor-pointer white-space-[nowrap]">
                                        + ITEM
                                    </button>
                                </div>
                            </div>

                            <div>
                                {section.items.map((item, idx) =>
                  <div key={idx} style={{ borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid var(--color-border)' }} className="flex flex-col gap-[0]">
                                        <div className="flex items-center p-[1rem] gap-[0.8rem] flex-wrap">
                                            <div 
                                                style={{ backgroundColor: '#1e293b', color: '#ffffff', minWidth: '32px', height: '32px', fontSize: '0.9rem' }}
                                                className="rounded-[6px] flex items-center justify-center font-[900] flex-shrink-[0]">
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
                        style={{ border: '2px solid #1e293b' }}
                        className="flex-[1] min-w-[200px] p-2 font-bold text-[0.9rem] outline-none bg-transparent resize-none rounded-md text-[var(--color-text)]" />
                      
                                            <button
                        onClick={() => {
                          const toastId = toast(
                            <div className="flex items-center gap-[0.8rem]">
                                                            <span className="text-[0.9rem]">¿Eliminar este punto?</span>
                                                            <button
                                onClick={() => {removeItem(section.id, idx);toast.dismiss(toastId);}} className="bg-red-500 hover:bg-red-600 text-[#ffffff] border-none rounded-[8px] p-[0.3rem_0.7rem] cursor-pointer font-[800] text-[0.8rem]">

                                Sí</button>
                                                        </div>,
                            { duration: 4000, icon: '🗑️' }
                          );
                        }}

                        title="Eliminar" 
                        style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}
                        className="rounded-[8px] cursor-pointer p-[0.3rem_0.45rem] flex items-center flex-shrink-[0]">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-[0.5rem] p-[0.5rem_1rem] bg-[var(--color-background)] border-top-[1px_dashed_var(--color-border)]">
                                            <div className="flex items-center justify-space-between gap-[1rem] flex-wrap">
                                                <div className="ats-status-group flex-shrink-[0]" style={{ border: '2px solid #cbd5e1', borderRadius: '10px', padding: '4px', display: 'flex', gap: '4px' }}>
                                                    <StatusBtn active={item.status === 'OK'} type="OK" onClick={() => updateItem(section.id, idx, 'status', 'OK')} label="C" />
                                                    <StatusBtn active={item.status === 'FAIL'} type="FAIL" onClick={() => updateItem(section.id, idx, 'status', 'FAIL')} label="NC" />
                                                    <StatusBtn active={item.status === 'NA'} type="NA" onClick={() => updateItem(section.id, idx, 'status', 'NA')} label="N/A" />
                                                </div>

                                                <div className="flex-[1] flex gap-[0.5rem] items-center min-width-[280px]">
                                                    <input
                            type="text"
                            placeholder="Observación / Anomalía..."
                            value={item.observation || ''}
                            style={{ border: '2px solid #1e293b', padding: '0.5rem', borderRadius: '0.5rem', flex: 1, minWidth: '150px' }}
                            onChange={(e) => updateItem(section.id, idx, 'observation', e.target.value)} 
                            className="text-sm font-bold outline-none text-slate-900 dark:text-slate-100 bg-transparent" />
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
                                  const comp = await compressImage(file, { maxDimension: 900, quality: 0.72 });
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
                            style={{ display: 'none' }} />

                          

                                                    <button
                            onClick={() => document.getElementById(`file-input-${section.id}-${idx}`)?.click()}
                            title="Capturar foto de evidencia" 
                            style={{ backgroundColor: '#6366f1', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px' }}
                            className="cursor-pointer flex items-center gap-[0.3rem] text-[0.75rem] font-bold m-0 shadow-sm">
                            
                                                        <Camera size={16} />
                                                        <span>{item.photos?.length || 0}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {item.photos && item.photos.length > 0 &&
                      <div className="flex gap-[0.4rem] flex-wrap mt-[0.2rem]">
                                                    {item.photos.map((photo, pIdx) =>
                        <div key={pIdx} className="relative w-[40px] h-[40px] rounded-[6px] overflow-[hidden] border-[1px_solid_var(--color-border)]">
                                                            <img src={photo} alt="" className="w-[100%] h-[100%] object-fit-[cover]" />
                                                            <button
                            onClick={() => {
                              const updatedPhotos = item.photos.filter((_, i) => i !== pIdx);
                              updateItem(section.id, idx, 'photos', updatedPhotos);
                            }} className="absolute top-[0] right-[0] bg-red-500 hover:bg-red-600 text-[#fff] border-none w-[14px] h-[14px] flex items-center justify-center cursor-pointer text-[0.55rem] p-[0]">

                            
                                                                ✕
                                                            </button>
                                                        </div>
                        )}
                                                </div>
                      }
                                        </div>
                                    </div>
                  )}
                            </div>
                        </div>);

          })}
            </div>
        }

            {/* FORMULARIOS EDITABLES - NO PRINT */}
            
          {currentStep === 3 && (
            <div className="wizard-step-anim">
              <h3 className="mt-[0] mb-[2rem] flex items-center gap-[0.8rem] text-[var(--color-primary)] font-[900] text-[1.2rem] uppercase letter-spacing-[1px]">
                  <HardHat size={24} className="text-blue-600" /> EPPs Obligatorios y Evidencia
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[2rem]">
                  {/* EPPs Selector */}
                  <div style={{ border: '2px solid #cbd5e1', borderRadius: '16px', padding: '1.5rem', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                      <h4 className="m-[0_0_1rem_0] text-[0.9rem] font-[800] uppercase text-[var(--color-text)]">Selección de EPPs</h4>
                      <div className="flex flex-wrap gap-[0.8rem]">
                          {[
                              { id: 'casco', label: 'Casco', icon: HardHat },
                              { id: 'guantes', label: 'Guantes', icon: ShieldCheck },
                              { id: 'anteojos', label: 'Anteojos', icon: EyeIcon },
                              { id: 'auditiva', label: 'Prot. Auditiva', icon: Ear },
                              { id: 'arnes', label: 'Arnés', icon: Activity },
                              { id: 'calzado', label: 'Calzado Seg.', icon: ShieldCheck }
                          ].map(epp => {
                              const isSelected = epps?.includes(epp.id);
                              const Icon = epp.icon;
                              return (
                                  <button
                                      key={epp.id}
                                      onClick={() => {
                                          const current = epps || [];
                                          const updated = isSelected ? current.filter(e => e !== epp.id) : [...current, epp.id];
                                          setEpps(updated);
                                      }}
                                      style={{ 
                                          border: isSelected ? '2px solid #3b82f6' : '2px solid #cbd5e1', 
                                          backgroundColor: isSelected ? '#eff6ff' : '#f8fafc', 
                                          color: isSelected ? '#1d4ed8' : '#475569',
                                          padding: '0.6rem 1rem', 
                                          borderRadius: '12px',
                                          cursor: 'pointer'
                                      }}
                                      className="flex items-center gap-[0.5rem] transition-colors"
                                  >
                                      <Icon size={18} />
                                      <span className="font-[800] text-[0.8rem]">{epp.label}</span>
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  {/* Photo Upload */}
                  <div style={{ border: '2px solid #cbd5e1', borderRadius: '16px', padding: '1.5rem', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                      <h4 className="m-[0_0_1rem_0] text-[0.9rem] font-[800] uppercase text-[var(--color-text)]">Evidencia Fotográfica</h4>
                      <p className="text-[0.8rem] text-[var(--color-text-muted)] mb-[1rem]">Adjunte hasta 2 fotografías de los hallazgos de la inspección.</p>
                      
                      <div className="flex gap-[1rem]">
                          {[0, 1].map(index => {
                              const photoUrl = fotos?.[index];
                              return (
                                  <div key={index} 
                                      style={{ border: '2px dashed #94a3b8', borderRadius: '12px', backgroundColor: '#f8fafc', minHeight: '120px' }}
                                      className="flex-[1] aspect-square flex items-center justify-center relative overflow-hidden transition-colors">
                                      {photoUrl ? (
                                          <>
                                              <img src={photoUrl} alt={`Evidencia ${index + 1}`} className="w-full h-full object-cover" />
                                              <button
                                                  onClick={() => {
                                                      const newFotos = [...(fotos || [])];
                                                      newFotos.splice(index, 1);
                                                      setFotos(newFotos);
                                                  }}
                                                  className="absolute top-[0.5rem] right-[0.5rem] bg-red-500 text-white p-[0.4rem] rounded-full shadow-md hover:bg-red-600"
                                              >
                                                  <Trash2 size={14} />
                                              </button>
                                          </>
                                      ) : (
                                          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                                              <Camera size={24} className="mb-[0.5rem]" />
                                              <span className="text-[0.7rem] font-[700] uppercase">Subir Foto</span>
                                              <input
                                                  type="file"
                                                  accept="image/*"
                                                  className="hidden"
                                                  onChange={async (e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                          try {
                                                              const compressed = await compressImage(file, { maxDimension: 900, quality: 0.72 });
                                                              const newFotos = [...(fotos || [])];
                                                              newFotos[index] = compressed || '';
                                                              setFotos(newFotos);
                                                          } catch (err) {
                                                              console.warn('Error compressing general photo:', err);
                                                              const reader = new FileReader();
                                                              reader.onloadend = () => {
                                                                  const newFotos = [...(fotos || [])];
                                                                  newFotos[index] = reader.result as string;
                                                                  setFotos(newFotos);
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


          {currentStep === 4 &&
        <div className="no-print mb-8">
                {/* OBSERVACIONES GENERALES */}
                <div className="border-[2px_solid_#3b82f6] rounded-[12px] p-[1.5rem] bg-blue-50/50 dark:bg-slate-800/80 mb-[1.5rem] relative">
                    <div className="absolute top-[-12px] left-[20px] bg-blue-600 text-white p-[4px_12px] text-[0.65rem] font-[900] uppercase letter-spacing-[0.1em] rounded-[4px]">
                        📝 Observaciones Generales
                    </div>
                    <div className="flex justify-between items-center mb-2 mt-2">
                        <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Resumen u observaciones adicionales</label>
                        <SpeechButton onTranscript={(text) => setObservations((prev) => prev ? `${prev} ${text}` : text)} />
                    </div>
                    <textarea
                        rows={3}
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Ingrese observaciones generales dictando por voz o escribiendo aquí..."
                        className="w-full p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                </div>

                {/* PLAN DE ACCIÓN - FORMULARIO */}
                <div className="border-[2px_solid_#f59e0b] rounded-[12px] p-[1.5rem] bg-[linear-gradient(135deg,_#fffbeb_0%,_#fef3c7_100%)] relative">
                    <div className="absolute top-[-12px] left-[20px] bg-amber-500 hover:bg-amber-600 text-[#fff] p-[4px_12px] text-[0.65rem] font-[900] uppercase letter-spacing-[0.1em] rounded-[4px]">
                        🎯 Plan de Acción
                    </div>
                    <div className="flex justify-between items-center mb-2 mt-2">
                        <label className="text-xs font-black uppercase text-amber-900">Agregar Medida Correctiva</label>
                        <SpeechButton onTranscript={(text) => setNewAction((prev) => ({ ...prev, action: prev.action ? `${prev.action} ${text}` : text }))} />
                    </div>
                    <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(150px,_1fr))] gap-[0.8rem] mb-[1rem]">
                        <input type="text" placeholder="Acción correctiva" value={newAction.action} onChange={(e) => setNewAction({ ...newAction, action: e.target.value })} className="p-[0.6rem_0.8rem] border border-slate-300 dark:border-slate-600 rounded-[8px] text-[0.85rem] font-[600] outline-[none]" />
                        <input type="text" placeholder="Responsable" value={newAction.responsible} onChange={(e) => setNewAction({ ...newAction, responsible: e.target.value })} className="p-[0.6rem_0.8rem] border border-slate-300 dark:border-slate-600 rounded-[8px] text-[0.85rem] font-[600] outline-[none]" />
                        <div className="flex gap-[0.5rem]">
                            <input type="date" value={newAction.dueDate} onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })} className="flex-[1] p-[0.6rem_0.8rem] border border-slate-300 dark:border-slate-600 rounded-[8px] text-[0.85rem] font-[600] outline-[none]" />
                            <select value={newAction.priority} onChange={(e) => setNewAction({ ...newAction, priority: e.target.value })} className="p-[0.6rem_0.8rem] border border-slate-300 dark:border-slate-600 rounded-[8px] text-[0.85rem] font-[600] outline-[none] bg-white dark:bg-slate-800">
                                <option value="bajo">🟢 Bajo</option>
                                <option value="medio">🟡 Medio</option>
                                <option value="alto">🟠 Alto</option>
                                <option value="critico">🔴 Crítico</option>
                            </select>
                        </div>
                        <button onClick={() => {if (newAction.action.trim()) {setActionPlan([...actionPlan, { ...newAction, id: Date.now() }]);setNewAction({ action: '', responsible: '', dueDate: '', priority: 'medio' });toast.success('Acción agregada ✅');}}} className="p-[0.6rem_1rem] bg-amber-500 hover:bg-amber-600 text-[#fff] font-[900] text-[0.85rem] rounded-[8px] border-none cursor-pointer flex items-center justify-center gap-[0.5rem]">
                            <Plus size={16} /> AGREGAR
                        </button>
                    </div>
                    {actionPlan.length > 0 &&
            <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(280px,_1fr))] gap-[0.8rem]">
                            {actionPlan.map((action, idx) =>
              <div key={action.id} className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-[8px] p-[0.8rem] flex flex-col gap-[0.5rem]">
                                    <div className="flex items-start gap-[0.5rem]">
                                        <div className="min-width-[24px] h-[24px] bg-amber-500 hover:bg-amber-600 text-[#fff] rounded-[50%] flex items-center justify-center text-[0.75rem] font-[900] flex-shrink-[0]">{idx + 1}</div>
                                        <div className="flex-[1]">
                                            <p className="m-[0] font-[700] text-[0.85rem] text-slate-800 dark:text-slate-200">{action.action}</p>
                                            <div className="flex flex-wrap gap-[0.5rem] mt-[0.3rem] text-[0.75rem]">
                                                {action.responsible && <span className="text-slate-600 dark:text-slate-400">👤 {action.responsible}</span>}
                                                {action.dueDate && <span className="text-red-600 dark:text-red-400">📅 {new Date(action.dueDate).toLocaleDateString('es-AR')}</span>}
                                                <span style={{ background: action.priority === 'critico' ? '#fef2f2' : action.priority === 'alto' ? '#fff7ed' : action.priority === 'medio' ? '#fefce8' : '#f0fdf4', color: action.priority === 'critico' ? '#dc2626' : action.priority === 'alto' ? '#ea580c' : action.priority === 'medio' ? '#ca8a04' : '#16a34a' }} className="p-[0.2rem_0.5rem] rounded-[4px] font-[700] text-[0.7rem]">
                                                    {action.priority === 'critico' ? '🔴' : action.priority === 'alto' ? '🟠' : action.priority === 'medio' ? '🟡' : '🟢'} {action.priority.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => {setActionPlan(actionPlan.filter((a) => a.id !== action.id));toast.success('Acción eliminada');}} className="bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[6px] cursor-pointer text-[#ef4444] p-[0.3rem] flex items-center flex-shrink-[0]">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
              )}
                        </div>
            }
                </div>

                {/* PRÓXIMA REVISIÓN */}
                <div className="mt-[1rem] p-[1rem] bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-[12px] flex flex-wrap gap-[1rem] items-center justify-space-between">
                    <div className="flex items-center gap-[0.8rem]">
                        <Calendar size={24} color="#2563eb" />
                        <div>
                            <p className="m-[0] font-[900] text-[0.85rem] text-[#1e3a8a] uppercase">Próxima Revisión Programada</p>
                            <p className="m-[0] text-[0.75rem] text-[#64748b]">Seleccioná la fecha para el próximo control</p>
                        </div>
                    </div>
                    <input type="date" value={nextReview} onChange={(e) => setNextReview(e.target.value)} className="p-[0.6rem_0.8rem] border border-blue-300 dark:border-blue-700 rounded-[8px] text-[0.85rem] font-[600] outline-[none] bg-white dark:bg-slate-800" />
                </div>

                {/* NORMATIVA APLICABLE */}
                <div className="mt-[1rem] border-[2px_solid_#c084fc] rounded-[12px] p-[1.5rem] bg-[linear-gradient(135deg,_#faf5ff_0%,_#f3e8ff_100%)] relative">
                    <div className="absolute top-[-12px] left-[20px] bg-[#9333ea] text-[#fff] p-[4px_12px] text-[0.65rem] font-[900] uppercase letter-spacing-[0.1em] rounded-[4px]">
                        📚 Normativa Aplicable
                    </div>
                    <p className="text-[0.8rem] text-slate-600 dark:text-slate-400 mb-[1rem] mt-[0.5rem]">Seleccioná las normativas que aplican a esta inspección:</p>
                    {Array.from(new Set(availableNorms.map((norm) => norm.category))).map((category) =>
            <div key={category} className="mb-[1rem]">
                            <h4 className="text-[0.75rem] font-[900] text-[#64748b] uppercase mb-[0.5rem]">{category}</h4>
                            <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(200px,_1fr))] gap-[0.5rem]">
                                {availableNorms.filter((norm) => norm.category === category).map((norm) =>
                <label key={norm.id} style={{ background: selectedNorms.includes(norm.id) ? '#faf5ff' : '#ffffff', border: `1px solid ${selectedNorms.includes(norm.id) ? '#a855f7' : '#e2e8f0'}` }} className="flex items-start gap-[0.8rem] p-[0.8rem] rounded-[8px] cursor-pointer transition-[all_0.2s] hover:border-purple-400 shadow-sm">
                                        <div className="flex-shrink-0 mt-[1px] flex items-center justify-center">
                                            <input type="checkbox" checked={selectedNorms.includes(norm.id)} onChange={(e) => {if (e.target.checked) {setSelectedNorms([...selectedNorms, norm.id]);} else {setSelectedNorms(selectedNorms.filter((id) => id !== norm.id));}}} className="w-[18px] h-[18px] cursor-pointer outline-none focus:ring-0 focus:outline-none m-0 p-0" style={{ accentColor: '#9333ea' }} />
                                        </div>
                                        <span className="text-[0.85rem] font-[900] text-[#0f172a] leading-tight flex-1 text-left">{norm.name}</span>
                                    </label>
                )}
                            </div>
                        </div>
            )}
                </div>
            </div>
        }

            {/* Firmas y Autorizaciones */}
            {currentStep === 5 &&
        <div className="no-print card mt-[1.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-xl)] p-[2rem]">
                <h3 className="mt-[0] mb-[2rem] flex items-center gap-[0.7rem] text-[var(--color-primary)] font-[900] text-[1.2rem] uppercase letter-spacing-[1px]">
                    <Pencil size={24} /> Firmas y Autorizaciones
                </h3>

                {/* Custom visual switches */}
                {/* Custom visual switches */}
                <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                    <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-[1rem] flex-wrap justify-center">
                        {[
              { id: 'operator', label: 'Responsable / Operador' },
              { id: 'supervisor', label: 'Supervisión / Verificador' },
              { id: 'professional', label: 'Profesional / Inspector' }].
              map((sig) => {
                const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                return (
                  <label
                    key={sig.id}
                    className="flex items-center gap-2 cursor-pointer select-none p-[0.6rem_1.2rem] rounded-full font-[800] text-[0.8rem] transition-all"
                    style={{
                      border: isChecked ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                      background: isChecked ? '#eff6ff' : 'transparent',
                      color: isChecked ? '#2563eb' : '#64748b',
                    }}>
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
                      className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-all flex-shrink-0">
                      {isChecked && <CheckCircle2 size={12} color="white" />}
                    </div>
                    <span className="whitespace-nowrap leading-none mt-[1px]">{sig.label}</span>
                  </label>
                );
              })}
                    </div>

                    <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px] mt-2">PIE DE PÁGINA INSTITUCIONAL / QR:</div>
                    <div className="flex gap-[1rem] flex-wrap justify-center">
                        <label
                          className="flex items-center gap-2 cursor-pointer select-none p-[0.6rem_1.2rem] rounded-full font-[800] text-[0.8rem] transition-all"
                          style={{
                            border: showFooter ? '1px solid #10b981' : '1px solid #cbd5e1',
                            background: showFooter ? '#ecfdf5' : 'transparent',
                            color: showFooter ? '#059669' : '#64748b',
                          }}>
                          <input
                            type="checkbox"
                            checked={showFooter}
                            onChange={(e) => setShowFooter(e.target.checked)}
                            className="hidden"
                          />
                          <div
                            style={{
                              border: showFooter ? '2px solid #10b981' : '2px solid #94a3b8',
                              background: showFooter ? '#10b981' : 'transparent'
                            }}
                            className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-all flex-shrink-0">
                            {showFooter && <CheckCircle2 size={12} color="white" />}
                          </div>
                          <span className="whitespace-nowrap leading-none mt-[1px]">Incluir Pie de Página institucional con QR</span>
                        </label>
                    </div>
                </div>

                {/* On-Sheet Visual Preview of PDF signature blocks */}
                <div className="mb-[2.5rem]">
                    <PdfSignatures
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
                subtitle: 'Control Operativo',
                signatureUrl: operatorSignature || null,
                isProfessional: false
              } : null}
              box2={showSignatures.professional ? {
                title: 'PROFESIONAL',
                subtitle: (professional.name || 'Firma de Especialista').toUpperCase(),
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
              } : null} />
            
            {showFooter && <PdfBrandingFooter />}
                </div>

                {/* Interactive Signature Drawing Pads */}
                <div className="mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8 grid gap-[2rem]" style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                    {showSignatures.operator &&
            <SignatureCanvas
              onSave={(sig) => setOperatorSignature(sig || '')}
              initialImage={operatorSignature}
              label="Firma de Responsable / Operador" />

            }
                    
                    {showSignatures.professional &&
            <SignatureCanvas
              onSave={(sig) => setSignature(sig || '')}
              initialImage={signature}
              label="Firma de Profesional / Inspector" />

            }

                    {showSignatures.supervisor &&
            <SignatureCanvas
              onSave={(sig) => setSupervisorSignature(sig || '')}
              initialImage={supervisorSignature}
              label="Firma de Supervisión / Verificador" />
            }

        </div>
        </div>
      }
      </ModuleFormLayout>

      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 no-print w-full">
          {currentStep > 1 
              ? <button onClick={prevStep} style={{ backgroundColor: '#475569', color: '#fff' }} className="px-3 py-2 rounded-[8px] font-[800] cursor-pointer flex items-center justify-center gap-[0.4rem] border-none shadow-sm text-xs flex-1 min-w-[120px] sm:flex-none transition-transform active:scale-95"><ArrowLeft size={16} /> ANTERIOR</button>
              : <button onClick={() => { setShowForm(false); setCurrentStep(1); }} style={{ backgroundColor: '#ef4444', color: '#fff' }} className="px-3 py-2 rounded-[8px] font-[800] cursor-pointer flex items-center justify-center gap-[0.4rem] border-none shadow-sm text-xs flex-1 min-w-[120px] sm:flex-none transition-transform active:scale-95"><ArrowLeft size={16} /> CANCELAR</button>
          }
          
          {currentStep < totalSteps && 
              <button onClick={nextStep} style={{ backgroundColor: '#2563eb', color: '#fff' }} className="px-3 py-2 rounded-[8px] font-[800] cursor-pointer flex items-center justify-center gap-[0.4rem] border-none shadow-sm text-xs flex-1 min-w-[120px] sm:flex-none transition-transform active:scale-95">SIGUIENTE <ArrowRight size={16} /></button>
          }
          {currentStep === totalSteps && 
              <>
                 <button onClick={() => requirePro(() => {
                   const data = { id: searchParams.get('id') || Date.now().toString(), checklistTitle, companyInfo, inspectionInfo, activeSections, observations, actionPlan, nextReview, selectedNorms, epps, fotos, showSignatures, showFooter, operatorSignature, signature, supervisorSignature, equipo: inspectionInfo?.item || checklistTitle || 'Checklist', empresa: companyInfo?.name || '-', fecha: inspectionInfo?.date || new Date().toISOString() };
                   setAutoPrintShare(true);
                   setShareItem(data as any);
                 })} style={{ backgroundColor: '#1e293b', color: '#fff' }} className="px-3 py-2 rounded-[8px] font-[800] cursor-pointer flex items-center justify-center gap-[0.4rem] border-none shadow-sm text-xs flex-1 min-w-[120px] sm:flex-none transition-transform active:scale-95"><Printer size={16} /> IMPRIMIR</button>
                 <button onClick={() => requirePro(() => {
                   const data = { id: searchParams.get('id') || Date.now().toString(), checklistTitle, companyInfo, inspectionInfo, activeSections, observations, actionPlan, nextReview, selectedNorms, epps, fotos, showSignatures, showFooter, operatorSignature, signature, supervisorSignature, equipo: inspectionInfo?.item || checklistTitle || 'Checklist', empresa: companyInfo?.name || '-', fecha: inspectionInfo?.date || new Date().toISOString() };
                   setAutoPrintShare(false);
                   setShareItem(data as any);
                 })} style={{ backgroundColor: '#3b82f6', color: '#fff' }} className="px-3 py-2 rounded-[8px] font-[800] cursor-pointer flex items-center justify-center gap-[0.4rem] border-none shadow-sm text-xs flex-1 min-w-[120px] sm:flex-none transition-transform active:scale-95"><Share2 size={16} /> COMPARTIR</button>
                 <button disabled={isSaving} onClick={(e) => requirePro(() => handleSave())} style={{ backgroundColor: isSaving ? '#94a3b8' : '#059669', color: '#fff' }} className="px-3 py-2 rounded-[8px] font-[800] cursor-pointer flex items-center justify-center gap-[0.4rem] border-none shadow-[0_4px_12px_rgba(5,150,105,0.3)] text-xs flex-1 min-w-[120px] sm:flex-none transition-transform active:scale-95"><Save size={16} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR'}</button>
              </>
          }
      </div>
      </>
      }
    
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
        <div className={`p-3 min-w-0 flex flex-col justify-center sm:border-r-2 last:border-r-0 sm:print:border-r-2 border-slate-200 ${highlight ? 'bg-slate-50/50 dark:bg-slate-800' : ''}`}>
            <label className="text-[0.65rem] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest block mb-2 leading-tight text-left">{label}</label>
            <input
        type={type}
        list={list}
        className={`w-full p-2 border-2 border-slate-800 dark:border-slate-400 rounded-md outline-none bg-transparent font-black ${large ? 'text-lg tracking-tight' : 'text-sm uppercase'} text-black dark:text-white focus:bg-yellow-50 dark:focus:bg-slate-700 text-left transition-colors min-w-0`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="" />
      
        </div>);

}

function StatusBtn({ active, type, onClick, label }) {
  const classes = `ats-status-btn ${active ? type === 'OK' ? 'active-ok' : type === 'FAIL' ? 'active-fail' : 'active-na' : ''}`;
  return (
    <button className={classes} onClick={onClick}>
            {label}
        </button>);

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