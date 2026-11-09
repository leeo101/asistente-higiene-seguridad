import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { evaluateATSSafetyCompliance } from '../utils/srtProtocols';
import type { ATSAuditResult } from '../types/workPermit';
import {
  Save,
  Plus,
  Trash2,
  Printer,
  ShieldCheck,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Pencil,
  Info,
  Share2,
  Sparkles,
  Loader2,
  MapPin,
  FileText,
  Search,
  QrCode,
  Download,
  ClipboardList,
  HardHat,
  Ear,
  Eye as EyeIcon,
  Trash2 as TrashIcon,
  Camera as CameraIcon,
  ShieldAlert,
  Activity,
  Mic,
  XCircle,
  Copy,
  ArrowUp,
  ArrowDown,
  CloudSun,
  FileSignature,
  Users
} from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { downloadCSV } from '../services/exportCsv';
import QRModal from '../components/QRModal';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSync } from '../contexts/SyncContext';
import { auth } from '../firebase';
import ShareModal from '../components/ShareModal';
import ConfirmModal from '../components/ConfirmModal';
import ATSPdfGenerator from '../components/ATSPdfGenerator';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import { safeGetLocalStorage } from '../utils/storageHelper';
import { printElementAsDocument } from '../utils/pdfHelper';
import { validateWorkerMedicalStatus } from '../utils/workerValidation';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import { API_BASE_URL } from '../config';
import AdModal from '../components/ads/AdModal';
import VoiceDictationButton from '../components/VoiceDictationButton';
import { getErrorMessage } from '../utils/errorUtils';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleWizardFooter
} from '../components/module';
import { generateAtsStepsWithAi } from '../services/aiFormAssistant';

const ATS_WIZARD_STEPS = ['Datos', 'Tareas', 'EPPs & Fotos', 'Checklist', 'Firmas'];

const printStyles = `
@media print {
    .no-print { display: none !important; }
    .print-area { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
    .checklist-print-box { display: flex !important; gap: 4px !important; }
}
@keyframes atsTickerScroll {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-55%); }
}
.ats-preset-card {
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.ats-preset-card:hover {
    border-color: #2563eb !important;
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.16) !important;
    transform: translateY(-2px) !important;
}
.ats-preset-ticker-wrap {
    overflow: hidden;
    width: 100%;
    position: relative;
}
.ats-preset-ticker-track {
    display: inline-block;
    white-space: nowrap;
    will-change: transform;
}
.ats-preset-card:hover .ats-preset-ticker-track {
    animation: atsTickerScroll 8.5s linear infinite;
}
`;

const defaultChecklist = [
  // General
  { id: 1, categoria: 'General', pregunta: '¿Se cuenta con el Programa de Seguridad aprobado por ART?', estado: 'Cumple', observaciones: '' },
  { id: 2, categoria: 'General', pregunta: '¿Se realizó charla de seguridad previa a la tarea (5 min)?', estado: 'Cumple', observaciones: '' },
  { id: 3, categoria: 'General', pregunta: '¿La zona de trabajo está señalizada y delimitada?', estado: 'Cumple', observaciones: '' },
  { id: 4, categoria: 'General', pregunta: '¿Se verificó el estado de máquinas y herramientas a utilizar?', estado: 'Cumple', observaciones: '' },
  { id: 5, categoria: 'General', pregunta: '¿El personal fue capacitado para esta tarea específica?', estado: 'Cumple', observaciones: '' },

  // EPP y Calzado
  { id: 6, categoria: 'EPP y Calzado', pregunta: '¿Se dispone de los EPP necesarios (Casco, Anteojos, Guantes)?', estado: 'Cumple', observaciones: '' },
  { id: 7, categoria: 'EPP y Calzado', pregunta: '¿El calzado de seguridad es el adecuado para el terreno/riesgo?', estado: 'Cumple', observaciones: '' },
  { id: 8, categoria: 'EPP y Calzado', pregunta: '¿Los EPP se encuentran en buen estado de conservación?', estado: 'Cumple', observaciones: '' },

  // Instalaciones Eléctricas y LOTO
  { id: 9, categoria: 'LOTO y Energías Peligrosas', pregunta: '¿Se aplicó Bloqueo y Etiquetado (LOTO) y se verificó ausencia de tensión/energía residual?', estado: 'Cumple', observaciones: '' },
  { id: 10, categoria: 'LOTO y Energías Peligrosas', pregunta: '¿El tablero eléctrico cuenta con disyuntor diferencial y puesta a tierra verificada?', estado: 'Cumple', observaciones: '' },
  { id: 11, categoria: 'LOTO y Energías Peligrosas', pregunta: '¿Los cables y prolongaciones están sin empalmes precarios y protegidos?', estado: 'Cumple', observaciones: '' },

  // Trabajo en Altura
  { id: 12, categoria: 'Trabajo en Altura', pregunta: '¿Se utiliza arnés de seguridad de cuerpo completo (si >2m)?', estado: 'N/A', observaciones: '' },
  { id: 13, categoria: 'Trabajo en Altura', pregunta: '¿El punto de anclaje es estructural y lo suficientemente fuerte?', estado: 'N/A', observaciones: '' },
  { id: 14, categoria: 'Trabajo en Altura', pregunta: '¿Las escaleras/andamios están nivelados y asegurados?', estado: 'N/A', observaciones: '' },
  { id: 15, categoria: 'Trabajo en Altura', pregunta: '¿Se ha delimitado el área inferior para evitar golpes por caída de objetos?', estado: 'N/A', observaciones: '' },

  // Orden y Limpieza
  { id: 16, categoria: 'Orden y Limpieza', pregunta: '¿Se mantienen los pasillos y vías de escape despejadas?', estado: 'Cumple', observaciones: '' },
  { id: 17, categoria: 'Orden y Limpieza', pregunta: '¿Existen recipientes para la disposición de residuos?', estado: 'Cumple', observaciones: '' },
  { id: 18, categoria: 'Orden y Limpieza', pregunta: '¿Se almacenan los materiales de forma estable y segura?', estado: 'Cumple', observaciones: '' },
  { id: 19, categoria: 'Orden y Limpieza', pregunta: '¿Se dispone de iluminación adecuada en el área?', estado: 'Cumple', observaciones: '' }
];

interface PresetDefinition {
  categoria: string;
  icon: string;
  epps?: string[];
  tasks: {
    paso: string;
    riesgo: string;
    control: string;
    nivelRiesgo: string;
    normativa: string;
  }[];
}

const PRESETS: Record<string, PresetDefinition> = {
  'Andamios (Altura)': {
    categoria: 'Construcción / Altura',
    icon: '🪜',
    epps: ['casco', 'arnes', 'guantes', 'calzado'],
    tasks: [
      { paso: 'Verificación de nivelación, apoyos y rodapiés de andamio', riesgo: 'Caída de estructura / Desnivel / Vuelco', control: 'Uso de durmientes de madera, husillos niveladores y trabas de seguridad', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 221-232 (Andamios)' },
      { paso: 'Montaje de tablones metálicos antideslizantes y barandas dobles', riesgo: 'Caída de personas u objetos al vacío', control: 'Doble baranda rígida (1m y 0.5m) y rodapié perimetral de 15 cm obligatorio', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 54 / Res. SRT 295/03' },
      { paso: 'Anclaje de arnés a línea de vida vertical independiente', riesgo: 'Caída a distinto nivel (>2 m) con consecuencias graves', control: 'Arnés de cuerpo completo IRAM 3622-1 y doble cabo de vida con amortiguador', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 51-57 / IRAM 3622' }
    ]
  },
  'Uso de Hidroelevador / PEMP': {
    categoria: 'Construcción / Altura',
    icon: '🏗️',
    epps: ['casco', 'arnes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Inspección pre-operacional de plataforma elevadora (PEMP) y estabilizadores', riesgo: 'Falla hidráulica / Vuelco por desnivel o terreno blando', control: 'Prueba de mandos de emergencia en base, nivelación con inclinómetro y vallado inferior', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 51 / ANSI A92' },
      { paso: 'Ingreso a barquilla y amarre de cabo de retención al punto certificado', riesgo: 'Efecto catapulta / Caída desde cesta elevadora', control: 'Uso de arnés con cabo de retención corto anclado al cáncamo interno de la cesta', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 55 / IRAM 3622' },
      { paso: 'Elevación y posicionamiento verificando líneas eléctricas aéreas', riesgo: 'Electrocución por arco eléctrico / Atrapamiento contra estructuras', control: 'Respetar distancia mínima de seguridad (3m en MT) y vigía en nivel cero', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 76-82' }
    ]
  },
  'Pintura en Altura / Silleta / Balancín': {
    categoria: 'Construcción / Altura',
    icon: '🎨',
    epps: ['casco', 'arnes', 'anteojos', 'guantes', 'calzado'],
    tasks: [
      { paso: 'Verificación de puntos de anclaje estructurales y contrapesos en azotea', riesgo: 'Desprendimiento del sistema de suspensión / Caída libre', control: 'Anclaje independiente para soga de trabajo y soga salvavidas con salvacaídas deslizante', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 233-238 (Silletas y Balancines)' },
      { paso: 'Preparación de superficie, hidrolavado o lijado de fachada', riesgo: 'Proyección de partículas a ojos / Caída de herramientas a vía pública', control: 'Antiparras herméticas, herramientas atadas con rabiza y pantalla/vallado peatonal', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 21 y 59' },
      { paso: 'Aplicación de pintura o revestimiento impermeable', riesgo: 'Inhalación de vapores orgánicos / Salpicadura ocular', control: 'Semimáscara con filtros para vapores orgánicos (si base solvente) y guantes nitrilo', nivelRiesgo: 'Medio', normativa: 'Res. SRT 295/03 Anexo III' }
    ]
  },
  'Trabajos en Techos / Cubiertas': {
    categoria: 'Construcción / Altura',
    icon: '🏠',
    epps: ['casco', 'arnes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Tendido de líneas de vida horizontales de cable de acero certificadas', riesgo: 'Caída de altura por rotura de chapas traslúcidas o fibrocemento', control: 'Instalación previa de pasarelas/tablones de reparto de carga y línea de vida', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 51-58 / IRAM 3622-1' },
      { paso: 'Fijación de chapas, zinguería y canaletas con atornilladora', riesgo: 'Cortes con bordes filosos / Viento fuerte en cubierta', control: 'Suspensión inmediata con ráfagas > 35 km/h y guantes anticorte nivel 5', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 59' },
      { paso: 'Descenso controlado de recortes de chapa y herramientas', riesgo: 'Caída de objetos cortantes sobre personal en planta baja', control: 'Uso de soga de servicio con aparejo y exclusión perimetral en nivel inferior', nivelRiesgo: 'Medio', normativa: 'Dec. 911/96 Art. 21' }
    ]
  },
  'Montaje de Estructuras Metálicas': {
    categoria: 'Construcción / Altura',
    icon: '🔩',
    epps: ['casco', 'arnes', 'guantes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Izaje y presentación de columnas y cabreadas metálicas', riesgo: 'Golpe por giro de pieza suspendida / Caída de estructura inestable', control: 'Guiado mediante dos sogas viento desde piso y apuntalamiento provisorio inmediato', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 301-318' },
      { paso: 'Abulonado y torqueado de uniones estructurales en altura', riesgo: 'Caída del montador / Caída de bulones o llaves de impacto', control: 'Doble cabo de vida 100% amarrado (Y) y portaherramientas con sujeción', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 51-56' },
      { paso: 'Alineación final y liberación de eslingas de grúa', riesgo: 'Atrapamiento de manos entre bridas o perfiles', control: 'Guantes de vaqueta reforzados y comunicación por señas normalizadas con gruísta', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 315' }
    ]
  },
  'Hormigonado / Llenado': {
    categoria: 'Construcción',
    icon: '🧱',
    epps: ['casco', 'guantes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Inspección de encofrados, puntales y arriostramientos', riesgo: 'Colapso de encofrado por peso dinámico del hormigón', control: 'Revisión y firma de liberación previa por Jefe de Obra / Calculista', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 162-169' },
      { paso: 'Guiado de manguerote de bomba y vertido de hormigón', riesgo: 'Golpe por latigazo de manguera de bombeo / Salpicadura alcalina', control: 'Sujeción con dos operarios, prohibido doblar manguerote, gafas estancas', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 170 / Res. SRT 295/03' },
      { paso: 'Vibrado mecánico de losa / vigas', riesgo: 'Contacto eléctrico con cable de vibrador / Sobreesfuerzo', control: 'Vibrador conectado a tablero con disyuntor diferencial y puesta a tierra', nivelRiesgo: 'Medio', normativa: 'Dec. 351/79 Anexo VI' }
    ]
  },
  'Excavación (Zanjas ySubmuración)': {
    categoria: 'Construcción',
    icon: '⛏️',
    epps: ['casco', 'guantes', 'calzado', 'auditiva'],
    tasks: [
      { paso: 'Cateo manual y detección de interferencias subterráneas', riesgo: 'Rotura de cañerías de gas, agua o cables eléctricos subterráneos', control: 'Verificación de planos de interferencias y cateo manual con herramientas aisladas', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 142-145 (Excavaciones)' },
      { paso: 'Señalización perimetral, acopio retirado y pasarelas', riesgo: 'Caída de personas o máquinas al interior de la excavación', control: 'Vallado rígido a 1.5m del borde y tierra acopiada a más de 1.20m del labio', nivelRiesgo: 'Medio', normativa: 'Dec. 911/96 Art. 148' },
      { paso: 'Entibado de paredes y colocación de escalera de emergencia', riesgo: 'Derrumbe de taludes y atrapamiento por sepultamiento', control: 'Entibado obligatorio en profundidades > 1.20m y escalera sobresaliendo 1m cada 15m', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 149-155' }
    ]
  },
  'Demolición / Picado': {
    categoria: 'Construcción',
    icon: '🔨',
    epps: ['casco', 'anteojos', 'auditiva', 'guantes', 'calzado'],
    tasks: [
      { paso: 'Corte y bloqueo certificado de suministros (luz, gas, agua)', riesgo: 'Electrocución / Explosión por rotura de caño de gas / Inundación', control: 'Constancia escrita de corte de suministros antes de iniciar el picado', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 138-141 (Demoliciones)' },
      { paso: 'Instalación de pantallas protectoras y cierre de circulación inferior', riesgo: 'Caída de mampostería sobre operarios o terceros', control: 'Bandejas colectoras rígidas y vallado total del radio de caída', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 139' },
      { paso: 'Demolición progresiva descendente con humectación', riesgo: 'Derrumbe prematuro / Inhalación de polvo de sílice y ruido', control: 'Apuntalamiento de muros linderos, riego para abatir polvo, filtro P100 y protector auditivo', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 140 / Res. SRT 85/12' }
    ]
  },
  'Trabajos en Vía Pública / Bacheo Vial': {
    categoria: 'Construcción',
    icon: '🚧',
    epps: ['casco', 'auditiva', 'guantes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Canalización vehicular con conos, vallas, balizas luminosas y banderillero', riesgo: 'Atropellamiento por tránsito vehicular externo', control: 'Señalización anticipada a 100m/50m, chaleco reflectivo Clase 2 y banderillero dedicado', nivelRiesgo: 'Crítico', normativa: 'Ley Nac. Tránsito 24.449 / Dec. 911/96 Art. 62' },
      { paso: 'Aserrado de pavimento y rotura con martillo neumático/hidráulico', riesgo: 'Hipoacusia por ruido >85 dBA / Vibraciones mano-brazo / Proyección', control: 'Protector auditivo de copa SNR 28dB, rotación de operarios y pantalla facial', nivelRiesgo: 'Alto', normativa: 'Res. SRT 85/12 / Res. SRT 295/03 (Vibraciones)' },
      { paso: 'Compactación y limpieza final de calzada', riesgo: 'Atrapamiento con rodillo compactador / Quemaduras por asfalto caliente', control: 'Alarma de retroceso acústica operativa y calzado de seguridad con suela resistente al calor', nivelRiesgo: 'Medio', normativa: 'Dec. 911/96 Art. 265' }
    ]
  },
  'Soldadura (Trabajo en Caliente)': {
    categoria: 'Metalmecánica / Caliente',
    icon: '🔥',
    epps: ['casco', 'guantes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Inspección de máquina soldadora, cables, pinza portaelectrodo y masa', riesgo: 'Contacto eléctrico / Recalentamiento de aislaciones', control: 'Cables sin empalmes expuestos, pinza aislada y conexión a tablero con diferencial', nivelRiesgo: 'Medio', normativa: 'Dec. 351/79 Anexo VI / Dec. 911/96 Art. 129' },
      { paso: 'Despeje de inflamables a 10 metros y colocación de biombos ignífugos', riesgo: 'Incendio o explosión por proyección de escoria incandescente / Radiación UV', control: 'Careta fotosensible DIN 11-13, campera/delantal de descarne y manta ignífuga', nivelRiesgo: 'Alto', normativa: 'Dec. 351/79 Anexo VII / Dec. 911/96 Art. 130' },
      { paso: 'Guardia de cenizas durante 30 minutos posteriores al cierre', riesgo: 'Reignición oculta por chispas alojadas en intersticios', control: 'Extintor ABC de 10 kg en el puesto de trabajo y verificación térmica al finalizar', nivelRiesgo: 'Medio', normativa: 'Dec. 351/79 Cap. 18 / IRAM 3517' }
    ]
  },
  'Corte y Desbaste con Amoladora': {
    categoria: 'Metalmecánica / Caliente',
    icon: '⚙️',
    epps: ['anteojos', 'auditiva', 'guantes', 'calzado'],
    tasks: [
      { paso: 'Verificación de disco abrasivo (fecha de vencimiento y RPM) y carcasa protectora', riesgo: 'Estallido del disco a alta velocidad con proyección de fragmentos', control: 'Prohibido retirar guarda protectora ni empuñadura lateral; RPM disco >= RPM máquina', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 196-203 (Herramientas Portátiles)' },
      { paso: 'Fijación firme de la pieza en morsa o banco de trabajo', riesgo: 'retroceso violento (kickback) de la amoladora y cortes profundos', control: 'Sujeción mecánica de la pieza; prohibido sostener piezas pequeñas con la mano o el pie', nivelRiesgo: 'Alto', normativa: 'Dec. 351/79 Art. 103-110' },
      { paso: 'Ejecución del corte con doble protección ocular/facial', riesgo: 'Impacto de esquirlas metálicas en córnea o rostro / Ruido', control: 'Uso simultáneo de anteojos de seguridad IRAM 3630 + protector facial de policarbonato', nivelRiesgo: 'Medio', normativa: 'Res. SRT 299/11 / IRAM 3630' }
    ]
  },
  'Corte Eléctrico y Bloqueo (LOTO)': {
    categoria: 'Eléctrico / Mantenimiento',
    icon: '⚡',
    epps: ['casco', 'guantes', 'anteojos', 'calzado'],
    tasks: [
      { paso: '1ª y 2ª Regla de Oro: Corte efectivo y bloqueo mecánico con candado personal (LOTO)', riesgo: 'Reconectado accidental por terceros durante la intervención', control: 'Apertura con corte visible, colocación de pinza multiplicadora, candado y tarjeta personal', nivelRiesgo: 'Crítico', normativa: 'Dec. 351/79 Anexo VI / Res. SRT 592/04' },
      { paso: '3ª y 4ª Regla de Oro: Comprobación de ausencia de tensión y puesta a tierra en cortocircuito', riesgo: 'Electrocución por tensión residual, backfeed o retorno de grupo electrógeno', control: 'Medición con detector de tensión verificado y colocación de tierras transitorias', nivelRiesgo: 'Crítico', normativa: 'Dec. 351/79 Anexo VI Pto. 3.3 / AEA 90364' },
      { paso: '5ª Regla de Oro: Delimitación y señalización de la zona protegida', riesgo: 'Invasión accidental de puntos adyacentes con tensión', control: 'Vallado dieléctrico, mantas aislantes y uso de guantes dieléctricos Clase 00/0', nivelRiesgo: 'Alto', normativa: 'IRAM 10005 / Res. SRT 3068/14 (Trabajos BT)' }
    ]
  },
  'Intervención en Tableros Eléctricos': {
    categoria: 'Eléctrico / Mantenimiento',
    icon: '🔌',
    epps: ['casco', 'guantes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Delimitación de zona de aproximación y tendido de alfombra dieléctrica', riesgo: 'Contacto directo con barras o bornes energizados / Arco eléctrico', control: 'Alfombra aislante certificada, ropa ignífuga (Arc Flash) sin elementos metálicos', nivelRiesgo: 'Crítico', normativa: 'Res. SRT 3068/14 (Trabajos con Tensión <1kV)' },
      { paso: 'Ajuste de borneras, termografía o reemplazo de protecciones termomagnéticas', riesgo: 'Cortocircuito franco entre fases por zafado de herramienta', control: 'Herramientas manuales 100% aisladas bajo norma IEC 60900 (1000V) y pantalla antiarco', nivelRiesgo: 'Crítico', normativa: 'Dec. 351/79 Anexo VI / Res. SRT 900/15' },
      { paso: 'Cierre de contratapa protectora (IP2X), peinado de cables y rotulado', riesgo: 'Quedar partes activas expuestas al tacto accidental', control: 'Colocación de contratapa aislante interna, llave de cierre y pictograma de riesgo eléctrico', nivelRiesgo: 'Bajo', normativa: 'AEA 90364-7-771' }
    ]
  },
  'Ingreso a Espacio Confinado': {
    categoria: 'Crítico / Industria',
    icon: '🕳️',
    epps: ['casco', 'arnes', 'guantes', 'calzado'],
    tasks: [
      { paso: 'Aislamiento de cañerías (bridas ciegas/LOTO) y medición atmosférica multigas', riesgo: 'Deficiencia de oxígeno (<19.5%), presencia de H2S, CO o mezcla explosiva (>10% LEL)', control: 'Medición previa estratificada desde el exterior con detector 4 gases calibrado', nivelRiesgo: 'Crítico', normativa: 'Res. SRT 953/10 (Espacios Confinados) / Dec. 351/79' },
      { paso: 'Ventilación mecánica forzada continua del recinto', riesgo: 'Estratificación o desprendimiento de gases tóxicos durante la tarea', control: 'Insuflación continua de aire limpio y monitoreo permanente con alarma sonora/vibratoria', nivelRiesgo: 'Alto', normativa: 'Res. SRT 953/10 Anexo I' },
      { paso: 'Acceso con trípode de rescate, malacate y vigía permanente en boca de hombre', riesgo: 'Desvanecimiento del operario sin posibilidad de auto-evacuación', control: 'Vigía externo permanente con comunicación constante y arnés vinculado a línea retráctil de rescate', nivelRiesgo: 'Crítico', normativa: 'Res. SRT 953/10 Pto. 6 (Plan de Rescate)' }
    ]
  },
  'Limpieza de Tanques y Cisternas': {
    categoria: 'Crítico / Industria',
    icon: '🚰',
    epps: ['casco', 'arnes', 'guantes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Vaciado, bloqueo de bombas de llenado y ventilación previa de cisterna', riesgo: 'Arranque automático de electrobombas / Acumulación de vapores de cloro', control: 'Bloqueo LOTO en tablero de bombas, ventilación por 30 min y medición de O2', nivelRiesgo: 'Crítico', normativa: 'Res. SRT 953/10 / Dec. 351/79 Cap. 6' },
      { paso: 'Ingreso con iluminación portátil de Muy Baja Tensión de Seguridad (24V)', riesgo: 'Electrocución en ambiente húmedo y conductor', control: 'Uso exclusivo de luminarias estancas IP67 en 12V/24V con transformador de seguridad externo', nivelRiesgo: 'Crítico', normativa: 'Dec. 351/79 Anexo VI Pto. 3.1 (MBTS)' },
      { paso: 'Cepillado y desinfección con hipoclorito diluido', riesgo: 'Irritación respiratoria y dérmica por vapores clorados', control: 'Traje impermeable Tyvek, botas de PVC, antiparras estancas y semimáscara para gases ácidos', nivelRiesgo: 'Alto', normativa: 'Res. SRT 801/15 (SGA)' }
    ]
  },
  'Calderas y Aparatos Sometidos a Presión': {
    categoria: 'Crítico / Industria',
    icon: '🌡️',
    epps: ['casco', 'guantes', 'anteojos', 'auditiva', 'calzado'],
    tasks: [
      { paso: 'Despresurización total, enfriamiento y bloqueo de válvulas de vapor/combustible', riesgo: 'Quemaduras graves por chorro de vapor vivo o retorno de condensado', control: 'Verificación de manómetro en cero (0 bar), apertura de venteos y bloqueo LOTO de válvulas', nivelRiesgo: 'Crítico', normativa: 'Dec. 351/79 Cap. 16 (Aparatos a Presión)' },
      { paso: 'Inspección de válvulas de seguridad, presostatos y nivel óptico', riesgo: 'Sobrepresión por enclavamiento de válvula de alivio', control: 'Control de timbre de calibración vigente y ensayo periódico hidráulico/ultrasonido', nivelRiesgo: 'Alto', normativa: 'Dec. 351/79 Art. 138-144' },
      { paso: 'Puesta en marcha gradual y purga de fondo', riesgo: 'Golpe de ariete en líneas de vapor / Proyección de agua hirviendo', control: 'Apertura lenta de válvulas principales, guantes térmicos y protección facial', nivelRiesgo: 'Alto', normativa: 'Dec. 351/79 Art. 140' }
    ]
  },
  'Izaje con Grúa Móvil / Hidrogrúa': {
    categoria: 'Logística / Cargas',
    icon: '🏗️',
    epps: ['casco', 'guantes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Inspección de eslingas, fajas, grilletes y seguro de gancho', riesgo: 'Corte de eslinga y caída libre de la carga izada', control: 'Rechazo de fajas deshilachadas o sin etiqueta WLL; pestillo de seguridad del gancho operativo', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 289-329 (Aparatos de Izar)' },
      { paso: 'Extensión al 100% de estabilizadores sobre tacos de reparto y vallado de giro', riesgo: 'Vuelco de la grúa por hundimiento de suelo o exceso de radio', control: 'Tacos de madera dura (3x área del plato), nivelación y vallado del radio de contrapeso', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 312' },
      { paso: 'Maniobra de izaje dirigida por señalero (Rigger) con sogas guía', riesgo: 'Aplastamiento por carga suspendida / Contacto con líneas eléctricas', control: 'Prohibición absoluta de transitar bajo carga suspendida; uso de 2 sogas viento', nivelRiesgo: 'Crítico', normativa: 'Dec. 911/96 Art. 315-322' }
    ]
  },
  'Operación de Puente Grúa / Aparejos': {
    categoria: 'Logística / Cargas',
    icon: '⛓️',
    epps: ['casco', 'guantes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Prueba de fin de carrera superior/inferior, freno electromagnético y botonera', riesgo: 'Corte de cable por sobre-elevación o caída de carga por falla de freno', control: 'Verificación previa en vacío de parada de emergencia y límites de carrera', nivelRiesgo: 'Alto', normativa: 'Dec. 351/79 Art. 114-137 (Aparatos de Izar)' },
      { paso: 'Eslingado balanceado del centro de gravedad de la pieza', riesgo: 'Deslizamiento o giro brusco de la pieza al despegar del piso', control: 'Elevación de prueba a 15 cm del suelo para verificar nivelación antes de trasladar', nivelRiesgo: 'Alto', normativa: 'Dec. 351/79 Art. 122' },
      { paso: 'Traslado longitudinal a baja velocidad con sirena luminosa/sonora', riesgo: 'Golpe o atrapamiento de operarios en nave industrial', control: 'Traslado por pasillos despejados a altura segura sin pasar sobre puestos de trabajo', nivelRiesgo: 'Alto', normativa: 'Dec. 351/79 Art. 126' }
    ]
  },
  'Autoelevador / Logística (SRT 960/15)': {
    categoria: 'Logística / Depósito',
    icon: '🚜',
    epps: ['casco', 'calzado', 'anteojos'],
    tasks: [
      { paso: 'Check-list diario pre-operacional según Res. SRT 960/15', riesgo: 'Falla de frenos, dirección, pérdida hidráulica o fisura en uñas', control: 'Inspección firmada antes del turno: cinturón, alarma retroceso, luces, extintor y horquillas', nivelRiesgo: 'Medio', normativa: 'Res. SRT 960/15 Art. 12 (Control Diario)' },
      { paso: 'Circulación en pasillos y cruces con prioridad peatonal', riesgo: 'Atropellamiento de peatones en puntos ciegos / Vuelco en giros', control: 'Uso obligatorio de cinturón de seguridad, velocidad máx. 10 km/h y toque de bocina en esquinas', nivelRiesgo: 'Alto', normativa: 'Res. SRT 960/15 Art. 5-9' },
      { paso: 'Estiba y desestiba de pallets en estanterías metálicas (Racks)', riesgo: 'Caída de mercadería en altura o colapso de largueros de rack', control: 'Respetar carga máxima de viga, pallet sano filmado y horquillas a 15 cm del suelo al circular', nivelRiesgo: 'Alto', normativa: 'Res. SRT 960/15 / Norma IRAM 38500' }
    ]
  },
  'Carga y Descarga de Camiones': {
    categoria: 'Logística / Depósito',
    icon: '🚛',
    epps: ['casco', 'guantes', 'calzado'],
    tasks: [
      { paso: 'Atraque en dársena, freno de mano y colocación de tacos de bloqueo en ruedas', riesgo: 'Desplazamiento imprevisto del camión durante el ingreso de zorra/autoelevador', control: 'Doble taco acuñado en ruedas traseras, motor apagado y rampa niveladora asegurada', nivelRiesgo: 'Crítico', normativa: 'Dec. 351/79 Cap. 15 / Res. SRT 960/15' },
      { paso: 'Desenlonado y apertura de compuertas laterales de semirremolque', riesgo: 'Caída desde la batea del camión (>2 m) / Golpe por caída de bultos desplazados', control: 'Prohibido trepar sobre la carga sin línea de vida aérea; apertura progresiva desde piso', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 51 / Res. SRT 295/03' },
      { paso: 'Movimiento manual o con transpaleta de bultos', riesgo: 'Trastornos musculoesqueléticos lumbares / Atrapamiento de pies', control: 'Respetar límite de levantamiento manual (<25 kg) y técnica de piernas flexionadas', nivelRiesgo: 'Medio', normativa: 'Res. SRT 295/03 Anexo I / Res. SRT 886/15 (Ergonomía)' }
    ]
  },
  'Manipulación de Sustancias Químicas': {
    categoria: 'Químico / Medio Ambiente',
    icon: '🧪',
    epps: ['anteojos', 'guantes', 'calzado'],
    tasks: [
      { paso: 'Lectura de Ficha de Datos de Seguridad (FDS) y etiquetado SGA', riesgo: 'Reacción violenta por mezcla incompatible / Intoxicación por inhalación', control: 'Disponibilidad de FDS de 16 secciones en el sector y envases rotulados según SGA', nivelRiesgo: 'Medio', normativa: 'Res. SRT 801/15 (Sistema Globalmente Armonizado)' },
      { paso: 'Trasvase mediante bomba manual/eléctrica sobre batea antiderrame', riesgo: 'Salpicadura corrosiva en ojos o piel / Derrame ambiental', control: 'Batea de contención (110% volumen), lavaojos de emergencia a <10 seg y guantes de nitrilo/neopreno', nivelRiesgo: 'Alto', normativa: 'Dec. 351/79 Art. 61 y Cap. 17' },
      { paso: 'Gestión de trapos contaminados y envases vacíos como residuo peligroso', riesgo: 'Autocombustión de trapos con solvente / Contaminación de efluentes', control: 'Acopio en tambores identificados con kit absorbente (musgo/sepiolita) disponible', nivelRiesgo: 'Medio', normativa: 'Ley Nacional 24.051 (Residuos Peligrosos)' }
    ]
  },
  'Poda en Altura y Desmalezado': {
    categoria: 'Mantenimiento / Servicios',
    icon: '🌳',
    epps: ['casco', 'anteojos', 'auditiva', 'guantes', 'calzado'],
    tasks: [
      { paso: 'Relevamiento de red eléctrica aérea cercana a la copa y vallado de vereda/calzada', riesgo: 'Electrocución por contacto de ramas con línea de media/baja tensión / Golpe a peatones', control: 'Distancia mínima de seguridad a cables, vallado de radio de caída (2x altura) y vigía en piso', nivelRiesgo: 'Crítico', normativa: 'Dec. 351/79 Anexo VI / Dec. 617/97' },
      { paso: 'Corte controlado de ramas con motosierra y descenso con soga de apeo', riesgo: 'Corte grave por rebote de espada (kickback) / Caída del podador', control: 'Pantalón anticorte para motosierra, casco forestal con visor mallado, auditivos y doble amarre', nivelRiesgo: 'Crítico', normativa: 'IRAM 3622 / Res. SRT 299/11' },
      { paso: 'Desmalezado de predios con motoguadaña y chipeado', riesgo: 'Proyección violenta de piedras o vidrios a alta velocidad (hasta 15 metros)', control: 'Delimitación a 15m a la redonda, protector facial integral, delantal y canilleras de cuero', nivelRiesgo: 'Alto', normativa: 'Dec. 351/79 Art. 103' }
    ]
  },
  'Mantenimiento HVAC / Aire Acondicionado': {
    categoria: 'Mantenimiento / Servicios',
    icon: '❄️',
    epps: ['casco', 'guantes', 'anteojos', 'arnes', 'calzado'],
    tasks: [
      { paso: 'Corte térmico/bloqueo eléctrico del equipo condensador e interior', riesgo: 'Choque eléctrico con capacitores cargados o arranque de ventilador forzado', control: 'Bloqueo LOTO en seccionador local, descarga de capacitores y verificación con tester', nivelRiesgo: 'Alto', normativa: 'Dec. 351/79 Anexo VI / Res. SRT 592/04' },
      { paso: 'Montaje de unidad exterior en ménsula o azotea', riesgo: 'Caída a distinto nivel / Caída de unidad condensadora al vacío', control: 'Arnés de seguridad amarrado a punto firme y aparejo para izar el equipo condensador', nivelRiesgo: 'Alto', normativa: 'Dec. 911/96 Art. 51' },
      { paso: 'Carga de gas refrigerante (R410A / R32) y soldadura oxiacetilénica de cañería de cobre', riesgo: 'Quemadura por congelamiento (contacto con refrigerante líquido) / Incendio por soplete', control: 'Válvulas arrestallamas en soplete, guantes criogénicos/cuero, antiparras y extintor ABC', nivelRiesgo: 'Medio', normativa: 'Dec. 351/79 Cap. 16 y 18' }
    ]
  },
  'Instalación de Cañerías de Gas / Termofusión': {
    categoria: 'Mantenimiento / Servicios',
    icon: '🔥',
    epps: ['casco', 'guantes', 'anteojos', 'calzado'],
    tasks: [
      { paso: 'Cierre de válvula de corte general, venteo y verificación con detector de gas', riesgo: 'Explosión o deflagración por gas remanente en cañería existente', control: 'Medición de 0% LEL con explosímetro antes de cortar o calentar cañerías', nivelRiesgo: 'Crítico', normativa: 'NAG-200 (ENARGAS) / Dec. 911/96 Art. 129' },
      { paso: 'Termofusión o roscado y sellado de cañerías y accesorios', riesgo: 'Quemaduras de 2° grado por contacto con plancha termofusora (260 °C)', control: 'Soporte estable para termofusora, guantes térmicos de kevlar/cuero y área despejada', nivelRiesgo: 'Medio', normativa: 'Dec. 911/96 Art. 196' },
      { paso: 'Prueba de hermeticidad neumática con manómetro calibrado', riesgo: 'Proyección de tapones o rotura por sobrepresión de prueba', control: 'Presurización progresiva con aire/nitrógeno (prohibido oxígeno) y control manométrico', nivelRiesgo: 'Medio', normativa: 'NAG-200 / Dec. 351/79 Cap. 16' }
    ]
  }
};

const WEATHER_OPTIONS = [
  { id: 'Soleado / Normal', label: '☀️ Soleado / Despejado', alert: false },
  { id: 'Nublado / Templado', label: '⛅ Nublado / Templado', alert: false },
  { id: 'Viento Fuerte (>35 km/h)', label: '💨 Viento Fuerte (>35 km/h)', alert: true },
  { id: 'Lluvia / Superficie Húmeda', label: '🌧️ Lluvia / Húmedo', alert: true },
  { id: 'Alta Temperatura (>30°C)', label: '🌡️ Calor Extremo (>30°C)', alert: true },
  { id: 'Nocturno / Ilum. Artificial', label: '🌙 Turno Nocturno', alert: false }
];

export default function ATS(): React.ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const { requirePro } = usePaywall();
  const { syncCollection, syncPulse } = useSync();
  const { currentUser } = useAuth();
  const { activeCompany } = useCompany();
  const editData = location.state?.editData;
  useDocumentTitle(editData ? 'Editar ATS' : 'Análisis de Trabajo Seguro (ATS)');

  const [showForm, setShowForm] = useState(location.pathname.includes('/nuevo'));
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>('Todas');
  const [presetSearch, setPresetSearch] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'low'>('all');

  useEffect(() => {
    const isNew = location.pathname.includes('/nuevo');
    setShowForm(isNew);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const [history, setHistory] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', payload: null as any });
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewATS, setPreviewATS] = useState<any | null>(null);
  const [printATS, setPrintATS] = useState<any | null>(null);

  const handleDirectPrintATS = async (atsItem: any) => {
    setPrintATS(atsItem);
    const toastId = toast.loading('Preparando impresión del ATS...');
    try {
      await new Promise((r) => setTimeout(r, 400));
      const element = document.getElementById('pdf-direct-ats-print');
      if (!element) throw new Error('Elemento de impresión no encontrado');
      await printElementAsDocument('pdf-direct-ats-print', `ATS - ${atsItem.empresa || 'Trabajo_Seguro'}`, false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('[ATS] Error al imprimir:', err);
      toast.dismiss(toastId);
      window.print();
    } finally {
      setTimeout(() => setPrintATS(null), 1500);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    empresa: activeCompany?.name || '',
    cuit: activeCompany?.cuit || '',
    obra: activeCompany?.establishment || activeCompany?.address || '',
    tarea: '',
    clima: 'Soleado / Normal',
    fecha: new Date().toISOString().split('T')[0],
    capatazNombre: '',
    operatorSignature: '',
    capatazSignature: '',
    checklist: defaultChecklist,
    tareas: [
      {
        id: 1,
        paso: 'Reconocimiento, señalización y delimitación del área de trabajo',
        riesgo: 'Caídas al mismo nivel / Ingreso de terceros no autorizados',
        control: 'Colocación de conos, cinta de peligro y charla previa de 5 minutos',
        nivelRiesgo: 'Medio',
        normativa: 'Dec. 911/96 Art. 51 / Ley 19.587',
        realizado: true
      },
      {
        id: 2,
        paso: 'Verificación de herramientas, tableros y elementos de protección personal',
        riesgo: 'Golpes, cortes o contacto eléctrico por herramientas defectuosas',
        control: 'Inspección visual previa y uso obligatorio de EPP certificados (Res. 299/11)',
        nivelRiesgo: 'Bajo',
        normativa: 'Dec. 351/79 Anexo V y VI',
        realizado: false
      }
    ] as {
      id: number;
      paso: string;
      riesgo: string;
      control: string;
      nivelRiesgo: string;
      normativa?: string;
      realizado: boolean;
    }[],
    epps: ['casco', 'guantes', 'anteojos', 'calzado'] as string[],
    fotos: [] as string[],
    equiposEmergencia: ['Matafuego ABC', 'Botiquín'] as string[],
    trabajadores: [] as { id: number; nombre: string; dni: string; funcion: string }[]
  });

  // Autocompletar empresa activa cuando se abre un nuevo ATS vacío
  useEffect(() => {
    if (showForm && !formData.id && activeCompany) {
      setFormData((prev) => ({
        ...prev,
        empresa: prev.empresa || activeCompany.name || '',
        cuit: prev.cuit || activeCompany.cuit || '',
        obra: prev.obra || activeCompany.establishment || activeCompany.address || ''
      }));
    }
  }, [showForm, activeCompany]);

  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });

  const [matrixTask, setMatrixTask] = useState<number | null>(null);
  const [matrixP, setMatrixP] = useState<number>(2);
  const [matrixS, setMatrixS] = useState<number>(2);
  const [showShare, setShowShare] = useState(false);
  const [isGeneratingATS, setIsGeneratingATS] = useState(false);
  const [isVisionATS, setIsVisionATS] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTaskInput, setAiTaskInput] = useState('');
  const [isAdModalOpen, setIsAdModalOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const atsCompliance = useMemo<ATSAuditResult>(() => {
    return evaluateATSSafetyCompliance(formData);
  }, [formData]);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((c) => c + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((c) => c - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGenerateAI = () => {
    setAiTaskInput(formData.tarea || '');
    setShowAIModal(true);
  };

  const runAIGeneration = async () => {
    const taskTitle = aiTaskInput.trim();
    if (!taskTitle) return;
    setShowAIModal(false);

    setIsGeneratingATS(true);
    const loadingToast = toast.loading('Calculando pasos, riesgos y protocolos con IA...');

    try {
      const { steps, suggestedEpps } = await generateAtsStepsWithAi(taskTitle);

      const newTasks = steps.map((item, index) => ({
        id: Date.now() + index,
        paso: item.paso || '',
        riesgo: item.riesgo || '',
        control: item.control || '',
        nivelRiesgo: item.nivelRiesgo || 'Medio',
        normativa: item.normativa || 'Dec. 351/79',
        realizado: false
      }));

      setFormData((prev) => ({
        ...prev,
        tarea: prev.tarea || taskTitle,
        tareas: newTasks,
        epps: Array.from(new Set([...prev.epps, ...(suggestedEpps as any)]))
      }));

      toast.success('ATS y EPPs autocompletados con IA ✨', { id: loadingToast });
    } catch (error) {
      console.error('Error generating ATS:', error);
      toast.error(`Error al generar: ${getErrorMessage(error)}`, { id: loadingToast });
    } finally {
      setIsGeneratingATS(false);
    }
  };

  const handleVisionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    requirePro(async () => {
      setIsVisionATS(true);
      const loadingToast = toast.loading('Analizando foto de obra con IA...');

      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const imageBase64 = reader.result as string;

          const res = await fetch(`${API_BASE_URL}/api/vision-ats`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await auth.currentUser?.getIdToken(true)}`
            },
            body: JSON.stringify({ imageBase64 })
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Fallo en la conexión');
          }

          const data = await res.json();

          if (!Array.isArray(data) || data.length === 0) {
            throw new Error('La respuesta de la IA no tiene el formato correcto');
          }

          const newTasks = data.map((item, index) => ({
            id: Date.now() + index,
            paso: item.paso || '',
            riesgo: item.riesgo || '',
            control: item.control || '',
            nivelRiesgo: item.nivelRiesgo || 'Medio',
            normativa: item.normativa || 'Dec. 911/96',
            realizado: false
          }));

          setFormData((prev) => ({
            ...prev,
            tareas: newTasks
          }));

          toast.success('ATS completado desde foto ✨', { id: loadingToast });
          setIsVisionATS(false);
        };
        reader.onerror = () => {
          throw new Error('Error al leer el archivo');
        };
      } catch (error) {
        console.error('Error generating vision ATS:', error);
        toast.error(`Error al generar: ${getErrorMessage(error)}`, { id: loadingToast });
        setIsVisionATS(false);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyPresetTasks = (name: string) => {
    const preset = PRESETS[name];
    if (!preset) return;
    const tasks = preset.tasks;

    setFormData((prev) => {
      const currentEpps = prev.epps || [];
      const newEpps = preset.epps ? [...new Set([...currentEpps, ...preset.epps])] : currentEpps;

      return {
        ...prev,
        tarea: prev.tarea ? prev.tarea : name,
        tareas: tasks.map((t, i) => ({ ...t, id: Date.now() + i, realizado: false })),
        epps: newEpps
      };
    });

    toast.success(`Plantilla "${name}" aplicada (+${tasks.length} pasos y EPPs)`);
  };

  const handleApplyPreset = (name: string) => {
    const tasks = PRESETS[name];
    if (!tasks) return;

    if (formData.tareas.length > 2) {
      setConfirmModal({ isOpen: true, type: 'template', payload: name });
      return;
    }

    applyPresetTasks(name);
  };

  const executeClearForm = () => {
    setFormData({
      id: '',
      empresa: activeCompany?.name || '',
      cuit: activeCompany?.cuit || '',
      obra: activeCompany?.establishment || '',
      tarea: '',
      clima: 'Soleado / Normal',
      fecha: new Date().toISOString().split('T')[0],
      capatazNombre: '',
      operatorSignature: '',
      capatazSignature: '',
      checklist: defaultChecklist,
      tareas: [],
      epps: ['casco', 'guantes', 'anteojos', 'calzado'],
      fotos: [],
      equiposEmergencia: ['Matafuego ABC', 'Botiquín'],
      trabajadores: []
    });
    toast.success('Formulario reiniciado');
  };

  const handleClearForm = () => {
    setConfirmModal({ isOpen: true, type: 'clear', payload: null });
  };

  const [professional, setProfessional] = useState({
    name: 'Profesional H&S',
    license: '',
    signature: null as string | null
  });

  // Nómina de legajos guardados para selector rápido
  const savedWorkersList = useMemo(() => {
    return safeGetLocalStorage<any[]>('ehs_workers_roster', []);
  }, [showForm]);

  // Cargar historial
  useEffect(() => {
    const list = safeGetLocalStorage<any[]>('ats_history', []);
    setHistory(list);
  }, [syncPulse]);

  // Cargar datos del profesional
  useEffect(() => {
    const savedData = localStorage.getItem('personalData');
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');

    let signature = legacySignature || null;
    if (savedSigData) {
      try {
        const parsed = JSON.parse(savedSigData);
        signature = parsed?.signature || signature;
      } catch {
        if (savedSigData.startsWith('data:')) signature = savedSigData;
      }
    }

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setProfessional({
          name: data?.fullName || data?.name || 'Profesional H&S',
          license: data?.license || data?.matricula || '',
          signature: data?.signature || signature
        });
      } catch {
        // ignore
      }
    } else {
      setProfessional((prev) => ({ ...prev, signature }));
    }
  }, []);

  const updateChecklist = (id: any, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      checklist: (prev.checklist || []).map((item: any) =>
        String(item.id) === String(id) ? { ...item, [field]: value } : item
      )
    }));
  };

  const addQuestion = (categoria: string) => {
    setFormData((prev: any) => {
      const currentList = prev.checklist || [];
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      const newQuestion = {
        id: newId,
        categoria,
        pregunta: 'Nueva pregunta de verificación preventiva',
        estado: 'Cumple',
        observaciones: ''
      };
      return { ...prev, checklist: [...currentList, newQuestion] };
    });
  };

  const removeQuestion = (id: any) => {
    setFormData((prev: any) => ({
      ...prev,
      checklist: (prev.checklist || []).filter((item: any) => String(item.id) !== String(id))
    }));
  };

  const updateTask = (id: any, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      tareas: (prev.tareas || []).map((t: any) =>
        String(t.id) === String(id) ? { ...t, [field]: value } : t
      )
    }));
  };

  const addTask = () => {
    setFormData((prev: any) => {
      const currentTasks = prev.tareas || [];
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      const newTask = {
        id: newId,
        paso: '',
        riesgo: '',
        control: '',
        nivelRiesgo: 'Medio',
        normativa: 'Dec. 911/96 / Dec. 351/79',
        realizado: false
      };
      return { ...prev, tareas: [...currentTasks, newTask] };
    });
    toast.success('Nuevo paso agregado');
  };

  const duplicateTask = (taskItem: any, index: number) => {
    setFormData((prev: any) => {
      const currentTasks = [...(prev.tareas || [])];
      const copy = {
        ...taskItem,
        id: Date.now() + Math.floor(Math.random() * 1000)
      };
      currentTasks.splice(index + 1, 0, copy);
      return { ...prev, tareas: currentTasks };
    });
    toast.success(`Paso ${index + 1} duplicado`);
  };

  const moveTask = (index: number, direction: 'up' | 'down') => {
    setFormData((prev: any) => {
      const currentTasks = [...(prev.tareas || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentTasks.length) return prev;
      const temp = currentTasks[index];
      currentTasks[index] = currentTasks[targetIndex];
      currentTasks[targetIndex] = temp;
      return { ...prev, tareas: currentTasks };
    });
  };

  const removeTask = (id: any) => {
    setFormData((prev: any) => ({
      ...prev,
      tareas: (prev.tareas || []).filter((t: any) => String(t.id) !== String(id))
    }));
  };

  const updateCategoryName = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    setFormData((prev: any) => ({
      ...prev,
      checklist: (prev.checklist || []).map((item: any) =>
        item.categoria === oldName ? { ...item, categoria: newName } : item
      )
    }));
  };

  const handleSave = async () => {
    const savedHistory = safeGetLocalStorage<any[]>('ats_history', []);
    const entryId = formData.id || Date.now().toString();
    const newEntry = {
      ...formData,
      id: entryId,
      showSignatures: showSignatures,
      professionalSignature: professional.signature,
      professionalName: professional.name,
      professionalLicense: professional.license
    };

    let updated;
    if (formData.id) {
      updated = savedHistory.map((h) => (h.id === entryId ? newEntry : h));
    } else {
      updated = [newEntry, ...savedHistory];
    }

    localStorage.setItem('ats_history', JSON.stringify(updated));
    setHistory(updated);
    await syncCollection('ats_history', updated);
    toast.success('Análisis de Trabajo Seguro guardado con éxito ✅');
    setShowForm(false);
    navigate('/ats');
  };

  const handleCloneATS = (item: any) => {
    const cloned = {
      ...item,
      id: '',
      fecha: new Date().toISOString().split('T')[0],
      operatorSignature: '',
      capatazSignature: ''
    };
    setFormData(cloned);
    setCurrentStep(1);
    setShowForm(true);
    toast.success('ATS clonado con fecha de hoy. Revisá y guardá.');
  };

  const handleShare = () => requirePro(() => setShowShare(true));
  const handlePrint = () => {
    requirePro(async () => {
      const element = document.getElementById('pdf-content');
      if (!element) {
        toast.error('No se pudo generar el documento para imprimir.');
        return;
      }
      try {
        await printElementAsDocument('pdf-content', `ATS - ${formData.empresa || 'Reporte'}`, false);
      } catch {
        window.print();
      }
    });
  };

  const categories = [...new Set(formData.checklist.map((i) => i.categoria))];

  const progressItems = [
    { label: 'Empresa', done: !!formData.empresa?.trim() },
    { label: 'Obra/Ubicación', done: !!formData.obra?.trim() },
    { label: 'Descripción de tarea', done: !!formData.tarea?.trim() },
    { label: 'Responsable', done: !!formData.capatazNombre?.trim() },
    {
      label: 'Secuencia de tareas',
      done: formData.tareas.length > 0 && formData.tareas.every((t) => t.paso?.trim() && t.riesgo?.trim())
    },
    { label: 'Checklist preventivo', done: formData.checklist.every((c) => c.estado !== '') }
  ];

  const completedCount = progressItems.filter((p) => p.done).length;
  const progressPct = Math.round((completedCount / progressItems.length) * 100);
  const progressLabel =
    progressPct === 100
      ? 'Listo para guardar ✅'
      : progressPct >= 66
      ? 'Casi completo'
      : progressPct >= 33
      ? 'En progreso'
      : 'Pendiente';
  const progressColor =
    progressPct === 100 ? '#10b981' : progressPct >= 66 ? '#f59e0b' : progressPct >= 33 ? '#3b82f6' : '#94a3b8';

  const executeConfirmAction = () => {
    if (confirmModal.type === 'delete') {
      const updated = history.filter((item: any) => item.id !== confirmModal.payload);
      setHistory(updated);
      localStorage.setItem('ats_history', JSON.stringify(updated));
      syncCollection('ats_history', updated);
      toast.success('ATS eliminado del historial');
    } else if (confirmModal.type === 'template') {
      applyPresetTasks(confirmModal.payload);
    } else if (confirmModal.type === 'clear') {
      executeClearForm();
    }
    setConfirmModal({ isOpen: false, type: '', payload: null });
  };

  const handleExportCSV = () => {
    requirePro(() => {
      downloadCSV(
        history.map((i: any) => ({
          empresa: i.empresa,
          obra: i.obra,
          fecha: i.fecha,
          responsable: i.capatazNombre || '',
          tarea: i.tarea || '',
          pasos: (i.tareas || []).length
        })),
        'ats_historial',
        {
          empresa: 'Empresa',
          obra: 'Obra/Proyecto',
          fecha: 'Fecha',
          responsable: 'Responsable',
          tarea: 'Tarea',
          pasos: 'Cant. Pasos'
        }
      );
    });
  };
  const columns = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      sortable: true,
      render: (item: any) => (
        <span
          className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap"
          style={{ color: 'var(--color-text-light)' }}
        >
          <Calendar size={14} color="#f59e0b" /> {item.fecha}
        </span>
      )
    },
    {
      header: 'Empresa y Tarea',
      accessor: 'empresa',
      sortable: true,
      render: (item: any) => {
        const hasCrit = item.tareas?.some((t: any) => t.nivelRiesgo === 'Crítico');
        const hasHigh = item.tareas?.some((t: any) => t.nivelRiesgo === 'Alto');
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: hasCrit
                  ? 'rgba(225, 29, 72, 0.14)'
                  : hasHigh
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(16, 185, 129, 0.14)',
                color: hasCrit ? '#e11d48' : hasHigh ? '#d97706' : '#059669'
              }}
            >
              <ClipboardList size={17} />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs sm:text-sm truncate" style={{ color: 'var(--color-text)' }}>
                {item.empresa || 'Sin nombre'}
              </div>
              <div className="text-[11px] truncate" style={{ color: 'var(--color-text-light)' }}>
                {item.tarea || `${(item.tareas || []).length} pasos preventivos`}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Obra / Proyecto',
      accessor: 'obra',
      sortable: true,
      render: (item: any) => (
        <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--color-text)' }}>
          <Building2 size={14} color="#3b82f6" /> {item.obra || '—'}
        </span>
      )
    },
    {
      header: 'Responsable',
      accessor: 'capatazNombre',
      render: (item: any) => (
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-light)' }}>
          {item.capatazNombre || '—'}
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPreviewATS(item)}
            title="Vista previa A4"
            style={{
              marginBottom: 0,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <EyeIcon size={12} /> Previa
          </button>

          <button
            type="button"
            onClick={() => handleDirectPrintATS(item)}
            title="Imprimir PDF directo"
            style={{
              marginBottom: 0,
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Printer size={12} /> PDF
          </button>

          <button
            type="button"
            onClick={() => {
              setFormData(item);
              setCurrentStep(1);
              setShowForm(true);
            }}
            title="Ver / Editar ATS"
            style={{
              marginBottom: 0,
              backgroundColor: '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FileText size={12} /> Editar
          </button>

          <button
            type="button"
            onClick={() => handleCloneATS(item)}
            title="Duplicar ATS con fecha de hoy"
            style={{
              marginBottom: 0,
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Copy size={12} /> Clonar
          </button>

          <button
            type="button"
            onClick={() =>
              requirePro(() => {
                const url = `${window.location.origin}/v/${currentUser?.uid}/ats/${item.id}?print=true`;
                setQrTarget({ text: url, title: `ATS — ${item.empresa}` });
              })
            }
            title="Ver Código QR"
            style={{
              marginBottom: 0,
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <QrCode size={12} /> QR
          </button>

          <button
            type="button"
            onClick={() => requirePro(() => setShareItem(safeGetLocalStorage<any>('ats_' + item.id, null) || item))}
            title="Compartir Informe"
            style={{
              marginBottom: 0,
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Share2 size={12} /> Compartir
          </button>

          <button
            type="button"
            onClick={() => setConfirmModal({ isOpen: true, type: 'delete', payload: item.id })}
            title="Eliminar ATS"
            style={{
              marginBottom: 0,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Trash2 size={13} style={{ flexShrink: 0 }} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  const filteredHistory = useMemo(() => {
    return history.filter((e: any) => {
      const query = searchTerm.toLowerCase();
      const matchesText =
        (e.empresa || '').toLowerCase().includes(query) ||
        (e.obra || '').toLowerCase().includes(query) ||
        (e.tarea || '').toLowerCase().includes(query) ||
        (e.capatazNombre || '').toLowerCase().includes(query);

      if (!matchesText) return false;

      if (riskFilter === 'high') {
        return e.tareas?.some((t: any) => t.nivelRiesgo === 'Alto' || t.nivelRiesgo === 'Crítico');
      }
      if (riskFilter === 'low') {
        return !e.tareas?.some((t: any) => t.nivelRiesgo === 'Alto' || t.nivelRiesgo === 'Crítico');
      }
      return true;
    });
  }, [history, searchTerm, riskFilter]);

  const presetCategories = useMemo(() => {
    const cats = new Set<string>(['Todas']);
    Object.values(PRESETS).forEach((p) => {
      const mainCat = p.categoria.split('/')[0].trim();
      cats.add(mainCat);
    });
    return Array.from(cats);
  }, []);

  const filteredPresets = useMemo(() => {
    return Object.entries(PRESETS).filter(([name, p]) => {
      const matchesCat =
        presetCategoryFilter === 'Todas' || p.categoria.toLowerCase().includes(presetCategoryFilter.toLowerCase());
      const matchesSearch =
        !presetSearch.trim() ||
        name.toLowerCase().includes(presetSearch.toLowerCase()) ||
        p.categoria.toLowerCase().includes(presetSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [presetCategoryFilter, presetSearch]);

  const buildATSShareMessage = (item: any) => {
    if (!item) return '';
    const tareas = item.tareas || [];
    const hasCrit = tareas.some((t: any) => t.nivelRiesgo === 'Crítico');
    const hasHigh = tareas.some((t: any) => t.nivelRiesgo === 'Alto');
    const hasMed = tareas.some((t: any) => t.nivelRiesgo === 'Medio');
    const riskLabel = hasCrit
      ? '🔴 RIESGO CRÍTICO'
      : hasHigh
      ? '🟠 RIESGO ALTO'
      : hasMed
      ? '🟡 RIESGO MEDIO'
      : '🟢 RIESGO BAJO';

    const keywords = [
      'altura',
      'andamio',
      'soldad',
      'caliente',
      'excava',
      'zanja',
      'loto',
      'bloqueo',
      'electri',
      'confinado',
      'izada',
      'grua',
      'autoelevador'
    ];
    const matchesKeyword = keywords.some(
      (kw) =>
        (item.tarea || '').toLowerCase().includes(kw) ||
        tareas.some(
          (t: any) => (t.paso || '').toLowerCase().includes(kw) || (t.riesgo || '').toLowerCase().includes(kw)
        )
    );
    const ptText =
      hasCrit || hasHigh || matchesKeyword ? '\n🛑 *PERMISO DE TRABAJO (PTAR):* OBLIGATORIO ADJUNTO' : '';

    const eppsList = (item.epps || []).length > 0 ? `\n🦺 *EPPs Obligatorios:* ${item.epps.join(', ')}` : '';
    const eqEmergencia =
      (item.equiposEmergencia || []).length > 0
        ? `\n🧯 *Equipos Emergencia:* ${item.equiposEmergencia.join(', ')}`
        : '';
    const trabajadoresCount = (item.trabajadores || []).length;
    const trabajadoresText =
      trabajadoresCount > 0 ? `\n👥 *Personal Acreditado:* ${trabajadoresCount} operario(s)` : '';

    return `🔐 *ANÁLISIS DE TRABAJO SEGURO (ATS)*\n🏗️ *Empresa:* ${item.empresa || '-'}\n🚧 *Obra/Ubicación:* ${
      item.obra || '-'
    }\n📅 *Fecha:* ${item.fecha || '-'}\n👷 *Capataz/Resp:* ${item.capatazNombre || '-'}\n📋 *Tarea:* ${
      item.tarea || '-'
    }\n\n📊 *Nivel de Riesgo:* ${riskLabel}${ptText}${eppsList}${eqEmergencia}${trabajadoresText}\n\n_Generado con Asistente H&S_`;
  };

  return (
    <>
      <style>{printStyles}</style>
      <AdModal isOpen={isAdModalOpen} onClose={() => setIsAdModalOpen(false)} adSlot="ats-popup" />

      <div
        className="container max-w-6xl mx-auto px-3 sm:px-6 animate-fade-in"
        style={{
          paddingTop: '7.25rem',
          paddingBottom: '6.5rem',
          margin: '0 auto',
          width: '100%'
        }}
      >
        <Breadcrumbs />

        <div className="mb-5 sm:mb-6">
          <PremiumHeader
            onBack={
              showForm
                ? () => {
                    setShowForm(false);
                  }
                : undefined
            }
            title="Generador de ATS (Análisis de Trabajo Seguro)"
            subtitle="Identificación paso a paso de peligros, jerarquía de controles Ley 19.587 / Dec. 911/96 y matriz P×S."
            icon={<ClipboardList size={32} color="#ffffff" />}
            gradient="linear-gradient(135deg, #d97706 0%, #ea580c 50%, #b45309 100%)"
            badge={`${Object.keys(PRESETS).length} Plantillas Técnicas`}
          />
        </div>

        {!showForm ? (
          <>
            {/* 4 KPIs Superiores */}
            <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                className="p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider block"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    ATS Emitidos
                  </span>
                  <span className="text-xl sm:text-2xl font-black block mt-1" style={{ color: '#d97706' }}>
                    {history.length}
                  </span>
                  <span className="text-[11px] block mt-0.5 truncate" style={{ color: 'var(--color-text-light)' }}>
                    Historial en dispositivo
                  </span>
                </div>
                <div
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.14)', color: '#d97706' }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                >
                  <ClipboardList size={22} />
                </div>
              </div>

              <div
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                className="p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider block"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    Riesgo Alto / Crítico
                  </span>
                  <span className="text-xl sm:text-2xl font-black block mt-1" style={{ color: '#dc2626' }}>
                    {
                      history.filter((h: any) =>
                        h.tareas?.some((t: any) => t.nivelRiesgo === 'Alto' || t.nivelRiesgo === 'Crítico')
                      ).length
                    }
                  </span>
                  <span className="text-[11px] block mt-0.5 truncate" style={{ color: 'var(--color-text-light)' }}>
                    Requieren Permiso PTAR
                  </span>
                </div>
                <div
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.14)', color: '#dc2626' }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                >
                  <ShieldAlert size={22} />
                </div>
              </div>

              <div
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                className="p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider block"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    Últimos 7 Días
                  </span>
                  <span className="text-xl sm:text-2xl font-black block mt-1" style={{ color: '#2563eb' }}>
                    {
                      history.filter(
                        (h: any) => new Date(h.fecha) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length
                    }
                  </span>
                  <span className="text-[11px] block mt-0.5 truncate" style={{ color: 'var(--color-text-light)' }}>
                    Actividad semanal
                  </span>
                </div>
                <div
                  style={{ backgroundColor: 'rgba(37, 99, 235, 0.14)', color: '#2563eb' }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                >
                  <Activity size={22} />
                </div>
              </div>

              <div
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                className="p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider block"
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    Plantillas Rápidas
                  </span>
                  <span className="text-xl sm:text-2xl font-black block mt-1" style={{ color: '#059669' }}>
                    {Object.keys(PRESETS).length}
                  </span>
                  <span className="text-[11px] block mt-0.5 truncate" style={{ color: 'var(--color-text-light)' }}>
                    Rubros precargados
                  </span>
                </div>
                <div
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.14)', color: '#059669' }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                >
                  <Sparkles size={22} />
                </div>
              </div>
            </div>

            {/* Action Bar & Search Input */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '1.35rem',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.85rem',
                width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
              }}
            >
              {/* Buscador + Filtros de Riesgo */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flex: '1 1 460px',
                  minWidth: '260px'
                }}
              >
                {/* Caja de Búsqueda con Lupa Centrada */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    flex: '1 1 260px',
                    minWidth: '220px',
                    height: '46px',
                    padding: '0 1rem',
                    borderRadius: '0.85rem',
                    backgroundColor: 'var(--color-background)',
                    border: '1.5px solid var(--color-border)',
                    boxSizing: 'border-box'
                  }}
                >
                  <Search size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Buscar por empresa, obra, tarea o responsable..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                      height: '100%',
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-text)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      title="Limpiar búsqueda"
                      style={{
                        marginBottom: 0,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        background: 'rgba(100, 116, 139, 0.15)',
                        color: 'var(--color-text-light)',
                        border: 'none',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filtro por Nivel de Riesgo */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.3rem',
                    borderRadius: '0.85rem',
                    backgroundColor: 'var(--color-background)',
                    border: '1.5px solid var(--color-border)',
                    flexShrink: 0
                  }}
                >
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'high', label: '🔴 Críticos/Altos' },
                    { id: 'low', label: '🟢 Medios/Bajos' }
                  ].map((f) => {
                    const active = riskFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setRiskFilter(f.id as any)}
                        style={{
                          marginBottom: 0,
                          padding: '0.45rem 0.8rem',
                          borderRadius: '0.65rem',
                          background: active
                            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                            : 'transparent',
                          color: active ? '#ffffff' : 'var(--color-text)',
                          border: 'none',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          boxShadow: active ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none'
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botones de Acción Derecha */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  flexWrap: 'wrap',
                  flexShrink: 0
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      id: '',
                      empresa: activeCompany?.name || '',
                      cuit: activeCompany?.cuit || '',
                      obra: activeCompany?.establishment || '',
                      tarea: '',
                      clima: 'Soleado / Normal',
                      fecha: new Date().toISOString().split('T')[0],
                      capatazNombre: '',
                      operatorSignature: '',
                      capatazSignature: '',
                      checklist: defaultChecklist,
                      tareas: [
                        {
                          id: 1,
                          paso: 'Reconocimiento, señalización y delimitación del área de trabajo',
                          riesgo: 'Caídas al mismo nivel / Ingreso de terceros no autorizados',
                          control: 'Colocación de conos, cinta de peligro y charla previa de 5 minutos',
                          nivelRiesgo: 'Medio',
                          normativa: 'Dec. 911/96 Art. 51 / Ley 19.587',
                          realizado: true
                        },
                        {
                          id: 2,
                          paso: 'Verificación de herramientas, tableros y elementos de protección personal',
                          riesgo: 'Golpes, cortes o contacto eléctrico por herramientas defectuosas',
                          control: 'Inspección visual previa y uso obligatorio de EPP certificados (Res. 299/11)',
                          nivelRiesgo: 'Bajo',
                          normativa: 'Dec. 351/79 Anexo V y VI',
                          realizado: false
                        }
                      ],
                      epps: ['casco', 'guantes', 'anteojos', 'calzado'],
                      fotos: [],
                      equiposEmergencia: ['Matafuego ABC', 'Botiquín'],
                      trabajadores: []
                    });
                    setCurrentStep(1);
                    navigate('/ats/nuevo');
                  }}
                  style={{
                    marginBottom: 0,
                    height: '46px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0 1.35rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    borderRadius: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(16,185,129,0.32)',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Plus size={18} style={{ flexShrink: 0 }} /> Nuevo ATS
                </button>

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    style={{
                      marginBottom: 0,
                      height: '46px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0 1.2rem',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: '#ffffff',
                      fontWeight: 800,
                      borderRadius: '0.85rem',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(59,130,246,0.3)',
                      fontSize: '0.84rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Download size={16} style={{ flexShrink: 0 }} /> Exportar CSV
                  </button>
                )}
              </div>
            </div>

            <DataTable
              data={filteredHistory}
              columns={columns}
              searchPlaceholder="Buscar..."
              hideHeader={true}
              emptyMessage="No se encontraron registros de ATS."
              emptyIcon={<ClipboardList size={48} />}
            />

            {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

            <ConfirmModal
              isOpen={confirmModal.isOpen}
              onClose={() => setConfirmModal({ isOpen: false, type: '', payload: null })}
              onConfirm={executeConfirmAction}
              title={
                confirmModal.type === 'delete'
                  ? '¿Eliminar ATS?'
                  : confirmModal.type === 'template'
                  ? '¿Reemplazar tareas?'
                  : '¿Reiniciar formulario?'
              }
              message={
                confirmModal.type === 'delete'
                  ? 'Esta acción no se puede deshacer.'
                  : confirmModal.type === 'template'
                  ? 'Se reemplazarán los pasos actuales por los de la plantilla seleccionada.'
                  : 'Se perderán todos los datos y tareas que no hayas guardado.'
              }
              type={confirmModal.type === 'delete' ? 'danger' : 'warning'}
              iconEmoji={
                confirmModal.type === 'delete' ? '🗑️' : confirmModal.type === 'template' ? '🔄' : '⚠️'
              }
            />

            <ShareModal
              isOpen={!!shareItem}
              open={!!shareItem}
              onClose={() => setShareItem(null)}
              title={`ATS - ${shareItem?.obra || ''}`}
              rawMessage={buildATSShareMessage(shareItem)}
              text={buildATSShareMessage(shareItem)}
              elementIdToPrint="pdf-content"
              fileName={`ATS_${shareItem?.empresa?.replace(/\s+/g, '_') || 'Reporte'}.pdf`}
            />
            <div className="ats-pdf-offscreen">
              <ATSPdfGenerator atsData={shareItem} />
            </div>
          </>
        ) : (
          <>
            <ShareModal
              isOpen={showShare}
              open={showShare}
              onClose={() => setShowShare(false)}
              title={`ATS – ${formData.empresa} (${formData.obra})`}
              text={buildATSShareMessage(formData)}
              elementIdToPrint="pdf-content"
              rawMessage={buildATSShareMessage(formData)}
              fileName={`ATS_${formData.empresa || 'Reporte'}.pdf`}
            />

            <div className="ats-pdf-offscreen" aria-hidden="true">
              <ATSPdfGenerator
                atsData={{
                  ...formData,
                  showSignatures,
                  professionalName: professional.name,
                  professionalLicense: professional.license,
                  professionalSignature: professional.signature
                }}
              />
            </div>

            <ModuleFormLayout>
              <ModuleFormToolbar
                title={editData ? 'Editar ATS' : 'Análisis de Trabajo Seguro'}
                subtitle="Control HYS"
                icon={<ShieldCheck className="text-blue-600" size={28} />}
                progress={{ percent: progressPct, label: progressLabel, color: progressColor }}
                steps={ATS_WIZARD_STEPS}
                currentStep={currentStep}
                onBack={() => {
                  setShowForm(false);
                  navigate('/ats');
                }}
                onStepClick={(step) => {
                  setCurrentStep(step);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              <ModuleFormDocument id="ats-editor-content" className="ats-editor-panel">
                {/* Encabezado de Hoja ATS */}
                <div
                  className="flex flex-col sm:flex-row justify-between items-center pb-5 mb-6 w-full gap-4"
                  style={{ borderBottom: '3px solid var(--color-border)' }}
                >
                  <div className="text-center sm:text-left">
                    <p
                      className="m-0 font-bold text-[11px] uppercase tracking-wider"
                      style={{ color: 'var(--color-text-light)' }}
                    >
                      Sistema de Gestión Preventiva
                    </p>
                    <p className="m-0 font-black text-xs uppercase" style={{ color: 'var(--color-text)' }}>
                      Ley 19.587 • Dec. 911/96 • Dec. 351/79
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center">
                    <h1
                      className="m-0 font-black text-3xl sm:text-4xl tracking-tight uppercase leading-none"
                      style={{ color: 'var(--color-text)' }}
                    >
                      A.T.S.
                    </h1>
                    <p
                      className="m-0 font-black text-[10px] uppercase tracking-widest mt-1"
                      style={{ color: 'var(--color-text-light)' }}
                    >
                      Análisis de Trabajo Seguro
                    </p>
                  </div>

                  <div className="text-center sm:text-right flex flex-col items-center sm:items-end gap-1.5">
                    <CompanyLogo className="h-[38px] max-w-[120px]" />
                    <span
                      className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.14)',
                        color: '#d97706'
                      }}
                    >
                      Paso {currentStep} de {totalSteps}
                    </span>
                  </div>
                </div>

                {/* Banner Normativo Jerarquía de Controles */}
                <div
                  className="mb-6 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  style={{
                    backgroundColor:
                      atsCompliance.dictamen === 'CONFORME'
                        ? 'rgba(16, 185, 129, 0.08)'
                        : atsCompliance.dictamen === 'OBSERVADO'
                        ? 'rgba(245, 158, 11, 0.08)'
                        : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${
                      atsCompliance.dictamen === 'CONFORME'
                        ? 'rgba(16, 185, 129, 0.3)'
                        : atsCompliance.dictamen === 'OBSERVADO'
                        ? 'rgba(245, 158, 11, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)'
                    }`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                      style={{
                        backgroundColor:
                          atsCompliance.dictamen === 'CONFORME'
                            ? '#059669'
                            : atsCompliance.dictamen === 'OBSERVADO'
                            ? '#d97706'
                            : '#dc2626'
                      }}
                    >
                      {atsCompliance.dictamen === 'CONFORME'
                        ? '✓'
                        : atsCompliance.dictamen === 'OBSERVADO'
                        ? '⚠️'
                        : '🛑'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-black uppercase tracking-wider"
                          style={{ color: 'var(--color-text-light)' }}
                        >
                          AUDITORÍA DE RIESGOS · LEY 19.587 / DEC. 911/96
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                          style={{
                            backgroundColor:
                              atsCompliance.dictamen === 'CONFORME'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : atsCompliance.dictamen === 'OBSERVADO'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)',
                            color:
                              atsCompliance.dictamen === 'CONFORME'
                                ? '#047857'
                                : atsCompliance.dictamen === 'OBSERVADO'
                                ? '#b45309'
                                : '#b91c1c'
                          }}
                        >
                          {atsCompliance.dictamen}
                        </span>
                      </div>
                      <p className="m-0 text-xs font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
                        {atsCompliance.dictamen === 'CONFORME'
                          ? 'Matriz de tareas con controles adecuados y jerarquía preventiva'
                          : atsCompliance.alerts[0] || 'Revisar medidas preventivas'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-bold flex-wrap">
                    <span
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)'
                      }}
                    >
                      🏗️ Ingeniería: <strong style={{ color: '#2563eb' }}>{atsCompliance.engineeringRatio}%</strong>
                    </span>
                    <span
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)'
                      }}
                    >
                      📋 Pasos: <strong>{atsCompliance.stepsWithControls}/{atsCompliance.totalSteps}</strong>
                    </span>
                  </div>
                </div>

                {/* STEP 1: DATOS GENERALES Y CLIMA */}
                {currentStep === 1 && (
                  <div className="wizard-step-anim">
                    {(() => {
                      const hasCritRisk = formData.tareas?.some((t: any) => t.nivelRiesgo === 'Crítico');
                      const hasHighRisk = formData.tareas?.some((t: any) => t.nivelRiesgo === 'Alto');
                      const keywords = [
                        'altura',
                        'andamio',
                        'soldad',
                        'caliente',
                        'excava',
                        'zanja',
                        'loto',
                        'bloqueo',
                        'electri',
                        'confinado',
                        'izada',
                        'grua',
                        'autoelevador'
                      ];
                      const matchesKeyword = keywords.some(
                        (kw) =>
                          (formData.tarea || '').toLowerCase().includes(kw) ||
                          formData.tareas?.some(
                            (t: any) =>
                              (t.paso || '').toLowerCase().includes(kw) ||
                              (t.riesgo || '').toLowerCase().includes(kw)
                          )
                      );
                      const requiresPT = hasCritRisk || hasHighRisk || matchesKeyword;

                      return requiresPT ? (
                        <div
                          className="mb-6 p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3"
                          style={{
                            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                            color: '#ffffff'
                          }}
                        >
                          <div className="text-xs sm:text-sm font-black uppercase tracking-wide text-center sm:text-left">
                            🛑 TRABAJO DE ALTO RIESGO DETECTADO — REQUIERE PERMISO DE TRABAJO (PTAR) ADJUNTO
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate('/work-permit')}
                            style={{
                              marginBottom: 0,
                              padding: '0.5rem 0.9rem',
                              borderRadius: '0.75rem',
                              backgroundColor: '#ffffff',
                              color: '#be123c',
                              border: 'none',
                              fontWeight: 900,
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            <FileSignature size={14} /> Abrir Permiso PTAR
                          </button>
                        </div>
                      ) : null;
                    })()}

                    <ModuleFormSection title="Datos del Proyecto y Entorno" icon={<Building2 size={20} />}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="flex flex-col gap-1.5 lg:col-span-2">
                          <label
                            className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--color-text-light)' }}
                          >
                            <Building2 size={14} /> Cliente / Empresa
                          </label>
                          <input
                            type="text"
                            value={formData.empresa}
                            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                            placeholder="Ej: Constructora del Sur S.A."
                            className="module-form-input font-bold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label
                            className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--color-text-light)' }}
                          >
                            <ShieldCheck size={14} /> CUIT / CUIL
                          </label>
                          <input
                            type="text"
                            value={formData.cuit}
                            onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                            placeholder="Ej: 30-71234567-9"
                            className="module-form-input"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5 lg:col-span-2">
                          <label
                            className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--color-text-light)' }}
                          >
                            <MapPin size={14} /> Ubicación / Obra / Sector
                          </label>
                          <input
                            type="text"
                            value={formData.obra}
                            onChange={(e) => setFormData({ ...formData, obra: e.target.value })}
                            placeholder="Ej: Nave Industrial N° 2 - Sector Montaje"
                            className="module-form-input"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label
                            className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--color-text-light)' }}
                          >
                            <Calendar size={14} /> Fecha de Ejecución
                          </label>
                          <input
                            type="date"
                            value={formData.fecha}
                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                            className="module-form-input"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5 lg:col-span-3">
                          <label
                            className="text-[11px] font-black uppercase tracking-wider flex items-center justify-between flex-wrap gap-1"
                            style={{ color: 'var(--color-text-light)' }}
                          >
                            <span className="flex items-center gap-1.5">
                              <FileText size={14} color="#10b981" /> Descripción de la Tarea a Realizar
                            </span>
                            <span className="text-[10px] font-extrabold flex items-center gap-1" style={{ color: '#10b981' }}>
                              <Mic size={12} /> Dictado por Voz Activo
                            </span>
                          </label>
                          <div className="relative flex items-center w-full">
                            <input
                              type="text"
                              value={formData.tarea}
                              onChange={(e) => setFormData({ ...formData, tarea: e.target.value })}
                              className="module-form-input w-full font-bold"
                              style={{ paddingRight: '4.8rem' }}
                              placeholder="Ej: Montaje de andamio tubular y pintura de fachada..."
                            />
                            <div
                              style={{
                                position: 'absolute',
                                right: '0.5rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 20
                              }}
                            >
                              <VoiceDictationButton
                                size="sm"
                                enableAI={true}
                                placeholder="Dictar tarea por voz..."
                                onTranscript={(text) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    tarea: prev.tarea ? `${prev.tarea} ${text}` : text
                                  }));
                                }}
                                onSmartExtract={(extracted) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    empresa: extracted.empresa || prev.empresa,
                                    obra: extracted.obra || prev.obra,
                                    tarea: extracted.tarea || prev.tarea
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Condición Climática / Entorno Operativo */}
                        <div className="flex flex-col gap-2 lg:col-span-3">
                          <label
                            className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--color-text-light)' }}
                          >
                            <CloudSun size={14} color="#0284c7" /> Condiciones Climáticas y del Entorno en Obra
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {WEATHER_OPTIONS.map((w) => {
                              const selected = (formData as any).clima === w.id;
                              return (
                                <button
                                  key={w.id}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, clima: w.id })}
                                  style={{
                                    marginBottom: 0,
                                    padding: '0.55rem 0.65rem',
                                    borderRadius: '0.85rem',
                                    backgroundColor: selected
                                      ? w.alert
                                        ? 'rgba(245, 158, 11, 0.16)'
                                        : 'rgba(37, 99, 235, 0.12)'
                                      : 'var(--color-background)',
                                    border: `1.5px solid ${
                                      selected ? (w.alert ? '#f59e0b' : '#2563eb') : 'var(--color-border)'
                                    }`,
                                    color: selected
                                      ? w.alert
                                        ? '#d97706'
                                        : '#2563eb'
                                      : 'var(--color-text)',
                                    fontWeight: 800,
                                    fontSize: '0.73rem',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                  }}
                                >
                                  {w.label}
                                </button>
                              );
                            })}
                          </div>
                          {((formData as any).clima?.includes('Viento') ||
                            (formData as any).clima?.includes('Lluvia')) && (
                            <div
                              className="p-3 rounded-xl text-xs font-bold flex items-center gap-2"
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                color: '#b45309'
                              }}
                            >
                              ⚠️ Alerta Climática (Dec. 911/96 Art. 59): Con vientos mayores a 35 km/h o lluvia se deben suspender tareas en altura, cubiertas e izajes al exterior.
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5 lg:col-span-3">
                          <label
                            className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--color-text-light)' }}
                          >
                            <User size={14} /> Capataz / Supervisor Responsable en Campo
                          </label>
                          <input
                            type="text"
                            value={formData.capatazNombre}
                            onChange={(e) => setFormData({ ...formData, capatazNombre: e.target.value })}
                            placeholder="Nombre y Apellido del encargado en campo..."
                            className="module-form-input"
                          />
                        </div>
                      </div>
                    </ModuleFormSection>
                  </div>
                )}

                {/* STEP 2: SECUENCIA DE TAREAS Y PLANTILLAS RÁPIDAS (CORREGIDO SIN RECORTE HORIZONTAL) */}
                {currentStep === 2 && (
                  <div className="wizard-step-anim mt-6 mb-8">
                    <div className="no-print mb-6">
                      {/* Barra Superior de Acciones de Tareas */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                          <h3
                            className="m-0 flex items-center gap-2 font-black text-base sm:text-lg uppercase tracking-wide"
                            style={{ color: 'var(--color-text)' }}
                          >
                            <Pencil size={20} color="#2563eb" /> Secuencia Operativa de Tareas ({formData.tareas.length}{' '}
                            pasos)
                          </h3>
                          <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                            Elegí una plantilla rápida abajo, usá IA Mágica o editá cada paso con su nivel de riesgo
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <button
                            type="button"
                            onClick={handleGenerateAI}
                            disabled={isGeneratingATS || isVisionATS}
                            style={{
                              marginBottom: 0,
                              padding: '0.7rem 1.1rem',
                              borderRadius: '0.9rem',
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 900,
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              cursor: isGeneratingATS || isVisionATS ? 'wait' : 'pointer',
                              boxShadow: '0 6px 16px rgba(139, 92, 246, 0.3)'
                            }}
                          >
                            {isGeneratingATS ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                            {isGeneratingATS ? 'PENSANDO...' : 'IA MÁGICA'}
                          </button>

                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={fileInputRef}
                            onChange={handleVisionUpload}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isGeneratingATS || isVisionATS}
                            style={{
                              marginBottom: 0,
                              padding: '0.7rem 1.1rem',
                              borderRadius: '0.9rem',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 900,
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              cursor: isGeneratingATS || isVisionATS ? 'wait' : 'pointer',
                              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.28)'
                            }}
                          >
                            {isVisionATS ? <Loader2 size={15} className="animate-spin" /> : <CameraIcon size={15} />}
                            {isVisionATS ? 'ANALIZANDO...' : 'DESDE FOTO'}
                          </button>

                          <button
                            type="button"
                            onClick={addTask}
                            style={{
                              marginBottom: 0,
                              padding: '0.7rem 1.1rem',
                              borderRadius: '0.9rem',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 900,
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              cursor: 'pointer',
                              boxShadow: '0 6px 16px rgba(16, 185, 129, 0.28)'
                            }}
                          >
                            <Plus size={16} /> AGREGAR PASO
                          </button>
                        </div>
                      </div>

                      {/* Buscador y Selector de 24 Plantillas Rápidas por Rubro */}
                      <div
                        className="rounded-3xl p-4 sm:p-5 mb-6"
                        style={{
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} color="#7c3aed" />
                            <span
                              className="text-xs sm:text-sm font-black uppercase tracking-wide"
                              style={{ color: 'var(--color-text)' }}
                            >
                              Plantillas Rápidas por Rubro ({filteredPresets.length} disponibles)
                            </span>
                          </div>

                          <input
                            type="text"
                            value={presetSearch}
                            onChange={(e) => setPresetSearch(e.target.value)}
                            placeholder="Filtrar plantilla (ej: altura, grúa, poda, eléctrico)..."
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '0.75rem',
                              backgroundColor: 'var(--color-surface)',
                              color: 'var(--color-text)',
                              border: '1px solid var(--color-border)',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              minWidth: '240px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        {/* Pestañas de Categoría */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-3 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                          {presetCategories.map((cat) => {
                            const active = presetCategoryFilter === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setPresetCategoryFilter(cat)}
                                style={{
                                  marginBottom: 0,
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '9999px',
                                  backgroundColor: active ? '#2563eb' : 'var(--color-surface)',
                                  color: active ? '#ffffff' : 'var(--color-text)',
                                  border: `1px solid ${active ? '#2563eb' : 'var(--color-border)'}`,
                                  fontWeight: 800,
                                  fontSize: '0.72rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>

                        {/* Botones de Plantillas con Nombre Completo + Carrusel al Pasar el Mouse */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {filteredPresets.map(([name, p]) => {
                            const catShort = p.categoria.split('/')[0].trim();
                            const stepsPreview = p.tasks
                              .map((tItem, i) => `Paso ${i + 1}: ${tItem.paso} (${tItem.normativa})`)
                              .join('   •   ');
                            return (
                              <button
                                key={name}
                                type="button"
                                onClick={() => handleApplyPreset(name)}
                                title={`${name} — ${p.categoria} (${p.tasks.length} pasos)`}
                                className="ats-preset-card"
                                style={{
                                  marginBottom: 0,
                                  padding: '0.75rem 0.9rem',
                                  borderRadius: '0.95rem',
                                  background: 'var(--color-surface)',
                                  color: 'var(--color-text)',
                                  border: '1.5px solid var(--color-border)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'stretch',
                                  justifyContent: 'space-between',
                                  gap: '0.45rem',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  width: '100%',
                                  overflow: 'hidden'
                                }}
                              >
                                {/* Fila 1: Ícono + Nombre Completo Visible (sin cortar con ...) */}
                                <div className="flex items-start justify-between gap-2.5 w-full">
                                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                    <span
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '9px',
                                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.05rem',
                                        flexShrink: 0
                                      }}
                                    >
                                      {p.icon}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <span
                                        style={{
                                          color: 'var(--color-text)',
                                          fontSize: '0.8rem',
                                          fontWeight: 900,
                                          lineHeight: 1.3,
                                          display: 'block',
                                          whiteSpace: 'normal',
                                          wordBreak: 'break-word'
                                        }}
                                      >
                                        {name}
                                      </span>
                                    </div>
                                  </div>

                                  <span
                                    className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0"
                                    style={{
                                      backgroundColor: 'rgba(37, 99, 235, 0.12)',
                                      color: '#2563eb',
                                      border: '1px solid rgba(37, 99, 235, 0.22)'
                                    }}
                                  >
                                    {catShort}
                                  </span>
                                </div>

                                {/* Fila 2: Carrusel / Marquesina de Pasos y Normativa al pasar el mouse */}
                                <div
                                  className="ats-preset-ticker-wrap rounded-lg px-2 py-1"
                                  style={{
                                    backgroundColor: 'var(--color-background)',
                                    border: '1px solid var(--color-border)'
                                  }}
                                >
                                  <div
                                    className="ats-preset-ticker-track text-[10px] font-bold"
                                    style={{ color: 'var(--color-text-light)' }}
                                  >
                                    <span style={{ color: '#2563eb', fontWeight: 900 }}>
                                      ⚡ {name} ({p.tasks.length} pasos):{' '}
                                    </span>
                                    {stepsPreview}
                                    {'     •     '}
                                    <span style={{ color: '#2563eb', fontWeight: 900 }}>
                                      ⚡ {name}:{' '}
                                    </span>
                                    {stepsPreview}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* LISTA DE PASOS EN TARJETAS RESPONSIVAS (SIN DESBORDE NI RECORTE) */}
                    <div className="space-y-4">
                      {formData.tareas.map((t, index) => {
                        const riskBg =
                          t.nivelRiesgo === 'Crítico'
                            ? '#881337'
                            : t.nivelRiesgo === 'Alto'
                            ? '#dc2626'
                            : t.nivelRiesgo === 'Medio'
                            ? '#d97706'
                            : '#059669';

                        return (
                          <div
                            key={t.id}
                            className="rounded-2xl p-4 sm:p-5 shadow-sm transition-all"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              border: '1.5px solid var(--color-border)',
                              borderLeft: `5px solid ${riskBg}`
                            }}
                          >
                            {/* Barra Superior del Paso: Número + Orden + Nivel de Riesgo + Matriz PxS + Eliminar */}
                            <div
                              className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b"
                              style={{ borderColor: 'var(--color-border)' }}
                            >
                              {/* Izquierda: Badge de Paso + Subir/Bajar + Duplicar */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  style={{
                                    padding: '0.35rem 0.8rem',
                                    borderRadius: '0.65rem',
                                    backgroundColor: riskBg,
                                    color: '#ffffff',
                                    fontWeight: 900,
                                    fontSize: '0.76rem',
                                    letterSpacing: '0.04em'
                                  }}
                                >
                                  PASO #{index + 1}
                                </span>

                                <div className="no-print flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => moveTask(index, 'up')}
                                    disabled={index === 0}
                                    title="Subir paso"
                                    style={{
                                      marginBottom: 0,
                                      padding: '0.36rem 0.65rem',
                                      width: 'auto',
                                      height: 'auto',
                                      borderRadius: '8px',
                                      backgroundColor: 'var(--color-background)',
                                      color: 'var(--color-text)',
                                      border: '1px solid var(--color-border)',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.28rem',
                                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                                      opacity: index === 0 ? 0.45 : 1
                                    }}
                                  >
                                    <ArrowUp size={13} style={{ flexShrink: 0 }} /> Subir
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveTask(index, 'down')}
                                    disabled={index === formData.tareas.length - 1}
                                    title="Bajar paso"
                                    style={{
                                      marginBottom: 0,
                                      padding: '0.36rem 0.65rem',
                                      width: 'auto',
                                      height: 'auto',
                                      borderRadius: '8px',
                                      backgroundColor: 'var(--color-background)',
                                      color: 'var(--color-text)',
                                      border: '1px solid var(--color-border)',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.28rem',
                                      cursor: index === formData.tareas.length - 1 ? 'not-allowed' : 'pointer',
                                      opacity: index === formData.tareas.length - 1 ? 0.45 : 1
                                    }}
                                  >
                                    <ArrowDown size={13} style={{ flexShrink: 0 }} /> Bajar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => duplicateTask(t, index)}
                                    title="Duplicar este paso"
                                    style={{
                                      marginBottom: 0,
                                      padding: '0.36rem 0.7rem',
                                      width: 'auto',
                                      height: 'auto',
                                      borderRadius: '8px',
                                      backgroundColor: 'var(--color-background)',
                                      color: 'var(--color-text)',
                                      border: '1px solid var(--color-border)',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.32rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Copy size={13} style={{ flexShrink: 0 }} /> Duplicar
                                  </button>
                                </div>
                              </div>

                              {/* Derecha: Selector Nivel de Riesgo Bien Visible + Matriz PxS + Eliminar */}
                              <div className="no-print flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="text-[11px] font-black uppercase"
                                    style={{ color: 'var(--color-text-light)' }}
                                  >
                                    4. Riesgo:
                                  </span>
                                  <select
                                    value={t.nivelRiesgo || 'Bajo'}
                                    onChange={(e) => updateTask(t.id, 'nivelRiesgo', e.target.value)}
                                    style={{
                                      marginBottom: 0,
                                      minWidth: '140px',
                                      padding: '0.45rem 0.75rem',
                                      borderRadius: '0.65rem',
                                      fontWeight: 900,
                                      fontSize: '0.78rem',
                                      cursor: 'pointer',
                                      backgroundColor:
                                        t.nivelRiesgo === 'Crítico'
                                          ? '#881337'
                                          : t.nivelRiesgo === 'Alto'
                                          ? '#fee2e2'
                                          : t.nivelRiesgo === 'Medio'
                                          ? '#fef3c7'
                                          : '#dcfce7',
                                      color:
                                        t.nivelRiesgo === 'Crítico'
                                          ? '#ffffff'
                                          : t.nivelRiesgo === 'Alto'
                                          ? '#dc2626'
                                          : t.nivelRiesgo === 'Medio'
                                          ? '#b45309'
                                          : '#15803d',
                                      border: `1.5px solid ${riskBg}`,
                                      outline: 'none'
                                    }}
                                  >
                                    <option value="Bajo">🟢 Riesgo Bajo</option>
                                    <option value="Medio">🟡 Riesgo Medio</option>
                                    <option value="Alto">🟠 Riesgo Alto</option>
                                    <option value="Crítico">🔴 Riesgo Crítico</option>
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setMatrixTask(t.id)}
                                  title="Calcular riesgo con Matriz 5x5 (Probabilidad x Severidad)"
                                  style={{
                                    marginBottom: 0,
                                    padding: '0.45rem 0.75rem',
                                    width: 'auto',
                                    height: 'auto',
                                    borderRadius: '0.65rem',
                                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                                    color: '#2563eb',
                                    border: '1px solid rgba(37, 99, 235, 0.3)',
                                    fontWeight: 900,
                                    fontSize: '0.74rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Activity size={13} style={{ flexShrink: 0 }} /> Matriz P×S
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeTask(t.id)}
                                  title="Eliminar paso"
                                  style={{
                                    marginBottom: 0,
                                    padding: '0.45rem 0.8rem',
                                    width: 'auto',
                                    height: 'auto',
                                    borderRadius: '0.65rem',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.74rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.35rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 3px 10px rgba(239, 68, 68, 0.25)'
                                  }}
                                >
                                  <Trash2 size={14} style={{ flexShrink: 0 }} /> Eliminar
                                </button>
                              </div>
                            </div>

                            {/* Grilla de 3 Columnas: 1. Paso a seguir | 2. Riesgos | 3. Controles + Norma */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                              {/* Columna 1: Paso a seguir */}
                              <div className="flex flex-col gap-1.5">
                                <label
                                  className="text-[11px] font-black uppercase tracking-wider"
                                  style={{ color: '#2563eb' }}
                                >
                                  1. Paso a Seguir (Secuencia)
                                </label>
                                <textarea
                                  rows={2}
                                  value={t.paso}
                                  onChange={(e) => updateTask(t.id, 'paso', e.target.value)}
                                  placeholder="Describí la etapa de la tarea..."
                                  style={{
                                    width: '100%',
                                    padding: '0.65rem 0.8rem',
                                    borderRadius: '0.75rem',
                                    backgroundColor: 'var(--color-background)',
                                    color: 'var(--color-text)',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    lineHeight: 1.45,
                                    outline: 'none',
                                    resize: 'vertical'
                                  }}
                                />
                              </div>

                              {/* Columna 2: Riesgos asociados */}
                              <div className="flex flex-col gap-1.5">
                                <label
                                  className="text-[11px] font-black uppercase tracking-wider"
                                  style={{ color: '#d97706' }}
                                >
                                  2. Peligros y Riesgos Asociados
                                </label>
                                <textarea
                                  rows={2}
                                  value={t.riesgo}
                                  onChange={(e) => updateTask(t.id, 'riesgo', e.target.value)}
                                  placeholder="Ej: Caída a distinto nivel, contacto eléctrico, proyección..."
                                  style={{
                                    width: '100%',
                                    padding: '0.65rem 0.8rem',
                                    borderRadius: '0.75rem',
                                    backgroundColor: 'var(--color-background)',
                                    color: 'var(--color-text)',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    lineHeight: 1.45,
                                    outline: 'none',
                                    resize: 'vertical'
                                  }}
                                />
                              </div>

                              {/* Columna 3: Medidas de control + Cita Normativa */}
                              <div className="flex flex-col gap-1.5">
                                <label
                                  className="text-[11px] font-black uppercase tracking-wider"
                                  style={{ color: '#059669' }}
                                >
                                  3. Medidas de Control Preventivas
                                </label>
                                <textarea
                                  rows={2}
                                  value={t.control}
                                  onChange={(e) => updateTask(t.id, 'control', e.target.value)}
                                  placeholder="Ej: Bloqueo LOTO, doble cabo de vida, vallado perimetral..."
                                  style={{
                                    width: '100%',
                                    padding: '0.65rem 0.8rem',
                                    borderRadius: '0.75rem',
                                    backgroundColor: 'var(--color-background)',
                                    color: 'var(--color-text)',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    lineHeight: 1.45,
                                    outline: 'none',
                                    resize: 'vertical'
                                  }}
                                />

                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="text-[10px] font-black uppercase shrink-0"
                                    style={{ color: '#2563eb' }}
                                  >
                                    ⚖️ Norma:
                                  </span>
                                  <input
                                    type="text"
                                    value={t.normativa || ''}
                                    onChange={(e) => updateTask(t.id, 'normativa', e.target.value)}
                                    placeholder="Ej: Dec. 911/96 Art. 51 / Dec. 351/79"
                                    style={{
                                      width: '100%',
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '0.55rem',
                                      backgroundColor: 'var(--color-background)',
                                      color: 'var(--color-text)',
                                      border: '1px solid var(--color-border)',
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      outline: 'none'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Botón Inferior Rápido para Agregar Otro Paso */}
                    <div className="no-print mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={addTask}
                        style={{
                          marginBottom: 0,
                          padding: '0.75rem 1.4rem',
                          borderRadius: '0.9rem',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669',
                          border: '1.5px dashed rgba(16, 185, 129, 0.45)',
                          fontWeight: 900,
                          fontSize: '0.82rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={16} /> Agregar otro paso a la secuencia
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: EPPs Y EVIDENCIA FOTOGRÁFICA */}
                {currentStep === 3 && (
                  <div className="wizard-step-anim mt-6">
                    <ModuleFormSection title="EPPs Obligatorios y Evidencia" icon={<HardHat size={20} />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* EPPs Selector */}
                        <div
                          className="p-5 rounded-2xl"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)'
                          }}
                        >
                          <h4 className="m-0 mb-3 text-xs sm:text-sm font-black uppercase" style={{ color: 'var(--color-text)' }}>
                            Selección de EPPs Obligatorios (Res. SRT 299/11)
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: 'casco', label: 'Casco Seguridad', icon: HardHat },
                              { id: 'guantes', label: 'Guantes Prot.', icon: ShieldCheck },
                              { id: 'anteojos', label: 'Protección Ocular', icon: EyeIcon },
                              { id: 'auditiva', label: 'Prot. Auditiva', icon: Ear },
                              { id: 'arnes', label: 'Arnés / Cabo Vida', icon: Activity },
                              { id: 'calzado', label: 'Calzado Seg.', icon: ShieldCheck },
                              { id: 'respiratoria', label: 'Máscara / Filtro', icon: ShieldAlert },
                              { id: 'chaleco', label: 'Chaleco Reflectivo', icon: User }
                            ].map((epp) => {
                              const isSelected = formData.epps?.includes(epp.id);
                              const Icon = epp.icon;
                              return (
                                <button
                                  key={epp.id}
                                  type="button"
                                  onClick={() => {
                                    const current = formData.epps || [];
                                    const updated = isSelected
                                      ? current.filter((e) => e !== epp.id)
                                      : [...current, epp.id];
                                    setFormData({ ...formData, epps: updated });
                                  }}
                                  style={{
                                    marginBottom: 0,
                                    padding: '0.6rem 0.9rem',
                                    borderRadius: '0.8rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    cursor: 'pointer',
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                    background: isSelected
                                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                                      : 'var(--color-background)',
                                    color: isSelected ? '#ffffff' : 'var(--color-text)',
                                    border: `1.5px solid ${isSelected ? '#2563eb' : 'var(--color-border)'}`
                                  }}
                                >
                                  <Icon size={16} />
                                  <span>{epp.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Photo Upload */}
                        <div
                          className="p-5 rounded-2xl"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)'
                          }}
                        >
                          <h4 className="m-0 mb-1 text-xs sm:text-sm font-black uppercase" style={{ color: 'var(--color-text)' }}>
                            Evidencia Fotográfica del Entorno
                          </h4>
                          <p className="text-xs m-0 mb-3" style={{ color: 'var(--color-text-light)' }}>
                            Adjuntá hasta 2 fotografías del área de trabajo o equipos verificados.
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {[0, 1].map((index) => {
                              const photoUrl = formData.fotos?.[index];
                              return (
                                <div
                                  key={index}
                                  className="rounded-2xl relative overflow-hidden"
                                  style={{
                                    minHeight: '190px',
                                    backgroundColor: 'var(--color-background)',
                                    border: '2px dashed var(--color-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {photoUrl ? (
                                    <>
                                      <img
                                        src={photoUrl}
                                        alt={`Evidencia ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        style={{ minHeight: '190px', maxHeight: '220px' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newFotos = [...(formData.fotos || [])];
                                          newFotos.splice(index, 1);
                                          setFormData({ ...formData, fotos: newFotos });
                                        }}
                                        style={{
                                          marginBottom: 0,
                                          position: 'absolute',
                                          top: '10px',
                                          right: '10px',
                                          padding: '0.38rem 0.7rem',
                                          width: 'auto',
                                          height: 'auto',
                                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                          color: '#ffffff',
                                          border: 'none',
                                          borderRadius: '9999px',
                                          fontSize: '0.72rem',
                                          fontWeight: 800,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '0.3rem',
                                          cursor: 'pointer',
                                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
                                        }}
                                      >
                                        <TrashIcon size={13} style={{ flexShrink: 0 }} /> Eliminar
                                      </button>
                                    </>
                                  ) : (
                                    <label
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                        width: '100%',
                                        height: '100%',
                                        minHeight: '190px',
                                        margin: 0,
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        gap: '0.6rem',
                                        color: 'var(--color-text)'
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: '54px',
                                          height: '54px',
                                          borderRadius: '9999px',
                                          backgroundColor: 'rgba(37, 99, 235, 0.12)',
                                          border: '1.5px solid rgba(37, 99, 235, 0.28)',
                                          color: '#2563eb',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          margin: '0 auto',
                                          flexShrink: 0
                                        }}
                                      >
                                        <CameraIcon size={25} style={{ flexShrink: 0 }} />
                                      </div>
                                      <span
                                        style={{
                                          fontSize: '0.76rem',
                                          fontWeight: 900,
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.03em',
                                          color: 'var(--color-text)',
                                          display: 'block',
                                          textAlign: 'center',
                                          lineHeight: 1.3
                                        }}
                                      >
                                        Subir / Tomar Foto #{index + 1}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: '0.68rem',
                                          fontWeight: 700,
                                          color: 'var(--color-text-light)',
                                          display: 'block',
                                          textAlign: 'center'
                                        }}
                                      >
                                        Tocá para abrir cámara o galería
                                      </span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              const newFotos = [...(formData.fotos || [])];
                                              newFotos[index] = reader.result as string;
                                              setFormData({ ...formData, fotos: newFotos });
                                            };
                                            reader.readAsDataURL(file);
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

                        {/* Emergency Equipment Selector */}
                        <div
                          className="md:col-span-2 p-5 rounded-2xl"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)'
                          }}
                        >
                          <h4
                            className="m-0 mb-3 text-xs sm:text-sm font-black uppercase flex items-center gap-2"
                            style={{ color: 'var(--color-text)' }}
                          >
                            <ShieldAlert size={18} color="#dc2626" /> Equipos de Emergencia y Respuesta en Zona
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: 'Matafuego ABC', label: '🧯 Matafuego PQS / ABC' },
                              { id: 'Botiquín', label: '🧰 Botiquín Primeros Auxilios' },
                              { id: 'Lavaojos', label: '🚿 Lavaojos de Emergencia' },
                              { id: 'Ventilación', label: '🌀 Extractor / Ventilación' },
                              { id: 'Delimitación', label: '🚧 Conos / Vallas de Cerco' },
                              { id: 'Trípode Rescate', label: '🪢 Trípode / Kit de Rescate' },
                              { id: 'Detector Multigas', label: '📟 Detector Multigas' },
                              { id: 'Kit Antiderrame', label: '🛢️ Kit Absorbente Derrames' }
                            ].map((eq) => {
                              const isSelected = (formData.equiposEmergencia || []).includes(eq.id);
                              return (
                                <button
                                  key={eq.id}
                                  type="button"
                                  onClick={() => {
                                    const current = formData.equiposEmergencia || [];
                                    const updated = isSelected
                                      ? current.filter((e) => e !== eq.id)
                                      : [...current, eq.id];
                                    setFormData({ ...formData, equiposEmergencia: updated });
                                  }}
                                  style={{
                                    marginBottom: 0,
                                    padding: '0.6rem 0.9rem',
                                    borderRadius: '0.8rem',
                                    cursor: 'pointer',
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                    background: isSelected
                                      ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                                      : 'var(--color-background)',
                                    color: isSelected ? '#ffffff' : 'var(--color-text)',
                                    border: `1.5px solid ${isSelected ? '#dc2626' : 'var(--color-border)'}`
                                  }}
                                >
                                  {eq.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </ModuleFormSection>
                  </div>
                )}

                {/* STEP 4: CHECKLIST PREVENTIVO */}
                {currentStep === 4 && (
                  <div className="wizard-step-anim mt-6">
                    <ModuleFormSection title="Verificación Preventiva en Campo" icon={<ShieldCheck size={20} />}>
                      <div className="space-y-5">
                        {categories.map((cat) => (
                          <div
                            key={cat}
                            className="p-4 sm:p-5 rounded-2xl"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <div
                              className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b flex-wrap"
                              style={{ borderColor: 'var(--color-border)' }}
                            >
                              <h4
                                className="m-0 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2"
                                style={{ color: '#2563eb' }}
                              >
                                <Info size={16} style={{ flexShrink: 0 }} />
                                <span
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => updateCategoryName(cat, e.target.innerText)}
                                  style={{ color: 'var(--color-text)' }}
                                >
                                  {cat}
                                </span>
                              </h4>
                              <div className="no-print flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => addQuestion(cat)}
                                  style={{
                                    marginBottom: 0,
                                    padding: '0.4rem 0.85rem',
                                    width: 'auto',
                                    height: 'auto',
                                    borderRadius: '0.65rem',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Plus size={13} style={{ flexShrink: 0 }} /> AGREGAR ÍTEM
                                </button>
                                {categories.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        checklist: prev.checklist.filter((item) => item.categoria !== cat)
                                      }));
                                    }}
                                    title={`Eliminar sección ${cat}`}
                                    style={{
                                      marginBottom: 0,
                                      padding: '0.4rem 0.8rem',
                                      width: 'auto',
                                      height: 'auto',
                                      borderRadius: '0.65rem',
                                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                      color: '#ffffff',
                                      border: 'none',
                                      fontWeight: 800,
                                      fontSize: '0.72rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Trash2 size={13} style={{ flexShrink: 0 }} /> Eliminar Sección
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-3">
                              {formData.checklist
                                .filter((i) => i.categoria === cat)
                                .map((item) => {
                                  const isSI = item.estado === 'Cumple' || item.estado === 'SI';
                                  const isNO = item.estado === 'No Cumple' || item.estado === 'NO';
                                  const isNA = item.estado === 'N/A' || item.estado === 'NA';

                                  return (
                                    <div
                                      key={item.id}
                                      className="p-3.5 rounded-xl"
                                      style={{
                                        backgroundColor: 'var(--color-background)',
                                        border: '1px solid var(--color-border)'
                                      }}
                                    >
                                      <div
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => updateChecklist(item.id, 'pregunta', e.target.innerText)}
                                        className="font-bold text-xs sm:text-sm outline-none mb-2"
                                        style={{ color: 'var(--color-text)' }}
                                      >
                                        {item.pregunta}
                                      </div>

                                      <textarea
                                        rows={1}
                                        placeholder="Observaciones o desvíos detectados..."
                                        value={item.observaciones}
                                        onChange={(e) => updateChecklist(item.id, 'observaciones', e.target.value)}
                                        style={{
                                          width: '100%',
                                          padding: '0.45rem 0.7rem',
                                          borderRadius: '0.6rem',
                                          backgroundColor: 'var(--color-surface)',
                                          color: 'var(--color-text)',
                                          border: '1px solid var(--color-border)',
                                          fontSize: '0.78rem',
                                          outline: 'none'
                                        }}
                                      />

                                      <div className="no-print flex items-center justify-between gap-2 mt-2.5 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => updateChecklist(item.id, 'estado', 'Cumple')}
                                            style={{
                                              marginBottom: 0,
                                              background: isSI
                                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                : 'rgba(16, 185, 129, 0.12)',
                                              color: isSI ? '#ffffff' : '#059669',
                                              border: isSI ? 'none' : '1px solid rgba(16, 185, 129, 0.3)',
                                              height: '28px',
                                              padding: '0 12px',
                                              fontSize: '0.73rem',
                                              fontWeight: 800,
                                              borderRadius: '7px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            {isSI && <CheckCircle2 size={12} />} CUMPLE
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => updateChecklist(item.id, 'estado', 'No Cumple')}
                                            style={{
                                              marginBottom: 0,
                                              background: isNO
                                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                                : 'rgba(239, 68, 68, 0.12)',
                                              color: isNO ? '#ffffff' : '#dc2626',
                                              border: isNO ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                                              height: '28px',
                                              padding: '0 12px',
                                              fontSize: '0.73rem',
                                              fontWeight: 800,
                                              borderRadius: '7px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            {isNO && <AlertCircle size={12} />} NO CUMPLE
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => updateChecklist(item.id, 'estado', 'N/A')}
                                            style={{
                                              marginBottom: 0,
                                              background: isNA
                                                ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
                                                : 'rgba(100, 116, 139, 0.12)',
                                              color: isNA ? '#ffffff' : '#475569',
                                              border: isNA ? 'none' : '1px solid rgba(100, 116, 139, 0.3)',
                                              height: '28px',
                                              padding: '0 12px',
                                              fontSize: '0.73rem',
                                              fontWeight: 800,
                                              borderRadius: '7px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            {isNA && <HelpCircle size={12} />} N/A
                                          </button>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => removeQuestion(item.id)}
                                          title="Eliminar pregunta"
                                          style={{
                                            marginBottom: 0,
                                            padding: '0.35rem 0.75rem',
                                            width: 'auto',
                                            height: 'auto',
                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                            color: '#ffffff',
                                            borderRadius: '7px',
                                            fontSize: '0.72rem',
                                            fontWeight: 800,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.3rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <Trash2 size={13} style={{ flexShrink: 0 }} /> Eliminar
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ModuleFormSection>
                  </div>
                )}

                {/* STEP 5: CUADRILLA AUTORIZADA Y FIRMAS */}
                {currentStep === 5 && (
                  <div className="wizard-step-anim mt-6">
                    <ModuleFormSection title="Nómina de Cuadrilla y Firmas" icon={<Pencil size={20} />}>
                      {/* Authorized Workers Roster Form */}
                      <div
                        className="no-print mb-6 p-4 sm:p-5 rounded-2xl"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2.5">
                          <div>
                            <h4
                              className="m-0 font-black text-xs sm:text-sm uppercase flex items-center gap-2"
                              style={{ color: 'var(--color-text)' }}
                            >
                              <Users size={18} color="#2563eb" /> Nómina de Trabajadores Autorizados (Cuadrilla)
                            </h4>
                            <p className="m-0 text-xs mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                              Registrá a los operarios intervinientes y verificá su aptitud médica en tiempo real.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {savedWorkersList.length > 0 && (
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  const workerId = e.target.value;
                                  if (!workerId) return;
                                  const found = savedWorkersList.find(
                                    (w: any) => String(w.id || w.dni) === String(workerId)
                                  );
                                  if (found) {
                                    const current = formData.trabajadores || [];
                                    setFormData({
                                      ...formData,
                                      trabajadores: [
                                        ...current,
                                        {
                                          id: Date.now(),
                                          nombre: found.nombre || found.fullName || found.name || '',
                                          dni: found.dni || found.document || '',
                                          funcion: found.puesto || found.role || 'Operario'
                                        }
                                      ]
                                    });
                                    toast.success('Operario importado desde Legajos');
                                  }
                                  e.target.value = '';
                                }}
                                style={{
                                  marginBottom: 0,
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '0.75rem',
                                  backgroundColor: 'var(--color-background)',
                                  color: 'var(--color-text)',
                                  border: '1px solid var(--color-border)',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="">+ Importar de Legajos...</option>
                                {savedWorkersList.map((w: any, idx: number) => (
                                  <option key={w.id || idx} value={w.id || w.dni}>
                                    {w.nombre || w.fullName || w.name} ({w.dni || 'S/DNI'})
                                  </option>
                                ))}
                              </select>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const current = formData.trabajadores || [];
                                const newWorker = { id: Date.now(), nombre: '', dni: '', funcion: 'Operario' };
                                setFormData({ ...formData, trabajadores: [...current, newWorker] });
                              }}
                              style={{
                                marginBottom: 0,
                                padding: '0.55rem 0.95rem',
                                borderRadius: '0.75rem',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={14} /> Agregar Trabajador
                            </button>
                          </div>
                        </div>

                        {(formData.trabajadores || []).length === 0 ? (
                          <div
                            className="p-4 rounded-xl text-center text-xs font-bold"
                            style={{
                              backgroundColor: 'var(--color-background)',
                              border: '1px dashed var(--color-border)',
                              color: 'var(--color-text-light)'
                            }}
                          >
                            No se registraron operarios adicionales. Tocá "Agregar Trabajador" para incluir la cuadrilla.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {(formData.trabajadores || []).map((w, idx) => {
                              const query = w.dni || w.nombre;
                              const medVal = query.trim().length > 1 ? validateWorkerMedicalStatus(query) : null;
                              const isApto = medVal?.isValid && medVal?.status === 'apto';
                              const isVencido = medVal?.status === 'vencido';
                              const isNoApto = medVal?.status === 'no_apto';

                              return (
                                <div
                                  key={w.id || idx}
                                  className="flex flex-col gap-2 p-3 rounded-xl"
                                  style={{
                                    backgroundColor: 'var(--color-background)',
                                    border: '1px solid var(--color-border)'
                                  }}
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                                    <input
                                      type="text"
                                      placeholder="Nombre y Apellido..."
                                      value={w.nombre}
                                      onChange={(e) => {
                                        const updated = [...(formData.trabajadores || [])];
                                        updated[idx].nombre = e.target.value;
                                        setFormData({ ...formData, trabajadores: updated });
                                      }}
                                      style={{
                                        padding: '0.55rem 0.75rem',
                                        borderRadius: '0.6rem',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text)',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        outline: 'none'
                                      }}
                                    />
                                    <input
                                      type="text"
                                      placeholder="DNI / Legajo..."
                                      value={w.dni}
                                      onChange={(e) => {
                                        const updated = [...(formData.trabajadores || [])];
                                        updated[idx].dni = e.target.value;
                                        setFormData({ ...formData, trabajadores: updated });
                                      }}
                                      style={{
                                        padding: '0.55rem 0.75rem',
                                        borderRadius: '0.6rem',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text)',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        outline: 'none'
                                      }}
                                    />
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        placeholder="Función / Rol (ej: Soldador, Vigía)..."
                                        value={w.funcion}
                                        onChange={(e) => {
                                          const updated = [...(formData.trabajadores || [])];
                                          updated[idx].funcion = e.target.value;
                                          setFormData({ ...formData, trabajadores: updated });
                                        }}
                                        style={{
                                          width: '100%',
                                          padding: '0.55rem 0.75rem',
                                          borderRadius: '0.6rem',
                                          border: '1px solid var(--color-border)',
                                          backgroundColor: 'var(--color-surface)',
                                          color: 'var(--color-text)',
                                          fontSize: '0.8rem',
                                          fontWeight: 700,
                                          outline: 'none'
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...(formData.trabajadores || [])];
                                          updated.splice(idx, 1);
                                          setFormData({ ...formData, trabajadores: updated });
                                        }}
                                        style={{
                                          marginBottom: 0,
                                          padding: '0.52rem 0.78rem',
                                          width: 'auto',
                                          height: 'auto',
                                          borderRadius: '0.6rem',
                                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                          color: '#ffffff',
                                          border: 'none',
                                          fontSize: '0.73rem',
                                          fontWeight: 800,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '0.3rem',
                                          cursor: 'pointer',
                                          flexShrink: 0
                                        }}
                                      >
                                        <Trash2 size={14} style={{ flexShrink: 0 }} /> Eliminar
                                      </button>
                                    </div>
                                  </div>

                                  {medVal && query.trim().length > 2 && (
                                    <div
                                      className="text-[11px] px-2.5 py-1 rounded-lg flex items-center justify-between gap-2"
                                      style={{
                                        backgroundColor: isApto
                                          ? 'rgba(16, 185, 129, 0.12)'
                                          : isVencido
                                          ? 'rgba(245, 158, 11, 0.14)'
                                          : isNoApto
                                          ? 'rgba(239, 68, 68, 0.14)'
                                          : 'var(--color-surface)',
                                        color: isApto
                                          ? '#047857'
                                          : isVencido
                                          ? '#b45309'
                                          : isNoApto
                                          ? '#b91c1c'
                                          : 'var(--color-text-light)'
                                      }}
                                    >
                                      <div className="flex items-center gap-1.5 font-bold">
                                        <span>{isApto ? '✅' : isVencido ? '⚠️' : isNoApto ? '🛑' : 'ℹ️'}</span>
                                        <span>{medVal.message}</span>
                                      </div>
                                      {medVal.expirationDate && (
                                        <span className="text-[10px] font-black uppercase">
                                          Venc: {medVal.expirationDate}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Selector de Firmas a Incluir */}
                      <div
                        className="no-print mb-6 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3"
                        style={{
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <span className="font-black text-xs uppercase" style={{ color: 'var(--color-text)' }}>
                          Incluir Firmas en el PDF:
                        </span>
                        <div className="flex gap-2 flex-wrap justify-center">
                          {[
                            { id: 'operator', label: 'Operador / Capataz' },
                            { id: 'supervisor', label: 'Supervisor' },
                            { id: 'professional', label: 'Profesional H&S' }
                          ].map((sig) => {
                            const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                            return (
                              <button
                                key={sig.id}
                                type="button"
                                onClick={() =>
                                  setShowSignatures((s) => ({
                                    ...s,
                                    [sig.id]: !s[sig.id as keyof typeof showSignatures]
                                  }))
                                }
                                style={{
                                  marginBottom: 0,
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '9999px',
                                  backgroundColor: isChecked ? 'rgba(37, 99, 235, 0.12)' : 'var(--color-surface)',
                                  color: isChecked ? '#2563eb' : 'var(--color-text-light)',
                                  border: `1.5px solid ${isChecked ? '#2563eb' : 'var(--color-border)'}`,
                                  fontWeight: 800,
                                  fontSize: '0.76rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {isChecked && <CheckCircle2 size={14} />}
                                {sig.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <PdfSignatures
                        data={{
                          ...formData,
                          professionalSignature: professional.signature,
                          professionalName: professional.name,
                          professionalLicense: professional.license
                        }}
                        box1={
                          showSignatures.operator
                            ? {
                                title: 'OPERADOR / CAPATAZ',
                                subtitle: (formData.capatazNombre || 'Firma / Aclaración').toUpperCase(),
                                signatureUrl: formData.operatorSignature || null,
                                isProfessional: false
                              }
                            : null
                        }
                        box2={
                          showSignatures.supervisor
                            ? {
                                title: 'SUPERVISOR / JEFE OBRA',
                                subtitle: 'FIRMA DEL SUPERVISOR',
                                signatureUrl: formData.capatazSignature || null,
                                isProfessional: false
                              }
                            : null
                        }
                        box3={
                          showSignatures.professional
                            ? {
                                title: 'PROFESIONAL ACTUANTE',
                                subtitle: (professional.name || 'Firma y Sello').toUpperCase(),
                                signatureUrl: professional.signature || null,
                                isProfessional: true,
                                license: professional.license
                              }
                            : null
                        }
                      />

                      <div className="no-print mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-5" style={{ borderColor: 'var(--color-border)' }}>
                        {showSignatures.operator && (
                          <div
                            className="p-4 rounded-2xl"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <SignatureCanvas
                              onSave={(sig) => setFormData((prev) => ({ ...prev, operatorSignature: sig || '' }))}
                              initialImage={formData.operatorSignature}
                              label="Firma del Operador / Responsable"
                            />
                          </div>
                        )}

                        {showSignatures.supervisor && (
                          <div
                            className="p-4 rounded-2xl"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <SignatureCanvas
                              onSave={(sig) => setFormData((prev) => ({ ...prev, capatazSignature: sig || '' }))}
                              initialImage={formData.capatazSignature}
                              label="Firma del Supervisor"
                            />
                          </div>
                        )}
                      </div>
                    </ModuleFormSection>
                  </div>
                )}

                <ModuleWizardFooter
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onPrev={prevStep}
                  onNext={nextStep}
                  finalActions={[
                    {
                      id: 'clear',
                      label: 'Limpiar',
                      icon: <Trash2 size={18} />,
                      variant: 'danger',
                      onClick: handleClearForm
                    },
                    {
                      id: 'preview',
                      label: 'Previa',
                      icon: <EyeIcon size={18} />,
                      variant: 'info',
                      onClick: () =>
                        setPreviewATS({
                          ...formData,
                          showSignatures,
                          professionalSignature: professional.signature,
                          professionalName: professional.name,
                          professionalLicense: professional.license
                        })
                    },
                    {
                      id: 'print',
                      label: 'Imprimir',
                      icon: <Printer size={18} />,
                      variant: 'warning',
                      onClick: handlePrint
                    },
                    {
                      id: 'share',
                      label: 'Compartir',
                      icon: <Share2 size={18} />,
                      variant: 'info',
                      onClick: handleShare
                    },
                    {
                      id: 'save',
                      label: 'Guardar ATS',
                      icon: <Save size={18} />,
                      variant: 'primary',
                      onClick: (e) => {
                        e.preventDefault();
                        requirePro(handleSave);
                      }
                    }
                  ]}
                />

                <PdfBrandingFooter />
              </ModuleFormDocument>
            </ModuleFormLayout>
          </>
        )}
      </div>

      {/* Modal IA Mágica */}
      {showAIModal && (
        <div
          onClick={() => setShowAIModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(2, 6, 23, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--color-surface)',
              border: '2px solid rgba(168, 85, 247, 0.45)',
              borderRadius: '24px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  borderRadius: '14px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={22} color="#ffffff" />
              </div>
              <div>
                <h2 className="m-0 text-lg font-black" style={{ color: 'var(--color-text)' }}>
                  IA Mágica — Generador ATS
                </h2>
                <p className="m-0 text-xs font-semibold" style={{ color: 'var(--color-text-light)' }}>
                  Autocompletado inteligente de pasos, riesgos y EPPs
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label
                className="text-xs font-black uppercase block mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                Tarea a Analizar
              </label>
              <input
                autoFocus
                type="text"
                value={aiTaskInput}
                onChange={(e) => setAiTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiTaskInput.trim()) runAIGeneration();
                }}
                placeholder="Ej: Limpieza de fachada en altura con balancín..."
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                style={{
                  marginBottom: 0,
                  padding: '0.8rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={runAIGeneration}
                disabled={!aiTaskInput.trim()}
                style={{
                  marginBottom: 0,
                  padding: '0.8rem',
                  borderRadius: '12px',
                  background: aiTaskInput.trim()
                    ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                    : 'var(--color-border)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: aiTaskInput.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                <Sparkles size={16} /> Generar ATS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vista Previa A4 */}
      {previewATS && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(2, 6, 23, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem'
          }}
        >
          <div className="relative w-full max-w-[960px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-700/80 bg-slate-800/90">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white m-0">
                    Vista Previa de Impresión A4
                  </h2>
                  <p className="text-xs text-slate-400 m-0">
                    ATS • {previewATS.empresa || 'Sin empresa'} • {previewATS.obra || 'Obra'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDirectPrintATS(previewATS)}
                  style={{
                    marginBottom: 0,
                    padding: '0.5rem 0.95rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#0f172a',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={15} /> Imprimir / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewATS(null)}
                  style={{
                    marginBottom: 0,
                    backgroundColor: 'transparent',
                    color: '#cbd5e1',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.35rem'
                  }}
                >
                  <XCircle size={22} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-8 bg-slate-950/70 flex justify-center">
              <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
                <ATSPdfGenerator atsData={previewATS} pdfElementId="pdf-modal-preview-ats" />
              </div>
            </div>
          </div>
        </div>
      )}

      {printATS && (
        <div className="ats-pdf-offscreen" id="pdf-direct-ats-print">
          <ATSPdfGenerator atsData={printATS} pdfElementId="pdf-direct-ats-print" />
        </div>
      )}

      {/* Modal Matriz PxS 5x5 */}
      {matrixTask !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '24px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '540px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}
                >
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base uppercase m-0" style={{ color: 'var(--color-text)' }}>
                    Matriz de Riesgo 5×5 (P × S)
                  </h3>
                  <p className="text-[11px] font-bold m-0" style={{ color: 'var(--color-text-light)' }}>
                    Tocá cualquier celda para evaluar Probabilidad × Severidad
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMatrixTask(null)}
                style={{
                  marginBottom: 0,
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-light)',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-6 gap-1 text-center text-[10px] font-bold">
                <div className="p-1 font-black" style={{ color: 'var(--color-text-light)' }}>
                  P \ S
                </div>
                <div className="p-1 font-extrabold" style={{ color: 'var(--color-text)' }}>
                  1. Insig.
                </div>
                <div className="p-1 font-extrabold" style={{ color: 'var(--color-text)' }}>
                  2. Menor
                </div>
                <div className="p-1 font-extrabold" style={{ color: 'var(--color-text)' }}>
                  3. Moder.
                </div>
                <div className="p-1 font-extrabold" style={{ color: 'var(--color-text)' }}>
                  4. Grave
                </div>
                <div className="p-1 font-extrabold" style={{ color: 'var(--color-text)' }}>
                  5. Catast.
                </div>

                {[5, 4, 3, 2, 1].map((pVal) => {
                  const pLabels: Record<number, string> = {
                    5: '5. Frec.',
                    4: '4. Prob.',
                    3: '3. Posib.',
                    2: '2. Improb.',
                    1: '1. Raro'
                  };
                  return (
                    <React.Fragment key={pVal}>
                      <div
                        className="p-1 font-black flex items-center justify-start text-[9px] truncate"
                        style={{ color: 'var(--color-text-light)' }}
                      >
                        {pLabels[pVal]}
                      </div>
                      {[1, 2, 3, 4, 5].map((sVal) => {
                        const cellScore = pVal * sVal;
                        const isSelected = matrixP === pVal && matrixS === sVal;
                        let cellBg = '#10b981';
                        if (cellScore >= 17) cellBg = '#881337';
                        else if (cellScore >= 10) cellBg = '#e11d48';
                        else if (cellScore >= 5) cellBg = '#f59e0b';

                        return (
                          <button
                            key={sVal}
                            type="button"
                            onClick={() => {
                              setMatrixP(pVal);
                              setMatrixS(sVal);
                            }}
                            style={{
                              marginBottom: 0,
                              height: '34px',
                              borderRadius: '8px',
                              backgroundColor: cellBg,
                              color: '#ffffff',
                              fontWeight: 900,
                              fontSize: '0.78rem',
                              border: isSelected ? '2.5px solid #2563eb' : 'none',
                              transform: isSelected ? 'scale(1.06)' : 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {cellScore}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {(() => {
              const score = matrixP * matrixS;
              let level = 'Bajo';
              let bg = '#059669';
              let badgeText = 'Riesgo Aceptable con controles rutinarios';

              if (score >= 17) {
                level = 'Crítico';
                bg = '#881337';
                badgeText = '🛑 Requiere Detención y Permiso de Trabajo (PTAR) Exclusivo';
              } else if (score >= 10) {
                level = 'Alto';
                bg = '#dc2626';
                badgeText = '⚠️ Requiere Permiso de Trabajo (PTAR) y Supervisión Permanente';
              } else if (score >= 5) {
                level = 'Medio';
                bg = '#d97706';
                badgeText = 'Requiere Procedimiento Escrito y EPPs Específicos';
              }

              return (
                <div
                  style={{
                    backgroundColor: bg,
                    color: '#ffffff',
                    padding: '0.9rem',
                    borderRadius: '16px',
                    textAlign: 'center',
                    marginBottom: '1rem'
                  }}
                >
                  <div className="text-[11px] font-black uppercase opacity-90">
                    Índice P ({matrixP}) × S ({matrixS}) = Score {score}
                  </div>
                  <div className="text-lg font-black uppercase my-0.5">Nivel Calculado: {level}</div>
                  <div className="text-xs font-bold opacity-95">{badgeText}</div>
                </div>
              );
            })()}

            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setMatrixTask(null)}
                style={{
                  marginBottom: 0,
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const score = matrixP * matrixS;
                  let level = 'Bajo';
                  if (score >= 17) level = 'Crítico';
                  else if (score >= 10) level = 'Alto';
                  else if (score >= 5) level = 'Medio';

                  updateTask(matrixTask, 'nivelRiesgo', level);
                  setMatrixTask(null);
                  toast.success(`Riesgo ${level} (Score ${score}) aplicado al paso.`);
                }}
                style={{
                  marginBottom: 0,
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Aplicar Nivel al Paso
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
