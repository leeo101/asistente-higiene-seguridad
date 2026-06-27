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
  HardHat, Ear, Eye as EyeIcon
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

const DEFAULT_TEMPLATES = {
  'manual_tools': {
    title: 'Herramientas Manuales',
    icon: <Plus size={18} />,
    items: [
    'Mangos en buen estado (sin fisuras, astillas ni flojos)',
    'Cabezas de herramientas de golpe sin rebabas ni deformaciones (hongos)',
    'Herramienta limpia, seca y libre de grasa/aceite',
    'No presenta oxidacion excesiva que debilite la estructura',
    'Filo adecuado y protegido cuando no esta en uso',
    'Sujecion firme de las partes moviles',
    'Almacenamiento en portaherramientas adecuados']

  },
  'electric_tools': {
    title: 'Herramientas Electricas Portatiles',
    icon: <Settings size={18} />,
    items: [
    'Cables sin peladuras, cortes ni empalmes precarios',
    'Ficha de conexion original y en buen estado (con puesta a tierra)',
    'Carcasa sin roturas, fisuras ni tornillos faltantes',
    'Gatillo de accionamiento funciona correctamente',
    'Protecciones/resguardos en su lugar y firmes',
    'Escobillas sin chispas excesivas']

  },
  'circular_saw': {
    title: 'Sierra Circular de Mano',
    icon: <ShieldCheck size={18} />,
    items: [
    'Resguardo retractil funciona suavemente',
    'Hoja de sierra sin dientes rotos y con filo',
    'Cuchillo divisor alineado y firmemente sujeto',
    'Boton de bloqueo de seguridad operativo',
    'Disco adecuado para las RPM de la maquina']

  },
  'grinder': {
    title: 'Amoladora Angular',
    icon: <TriangleAlert size={18} />,
    items: [
    'Resguardo metalico cubre como minimo el 50% del disco',
    'Mango lateral colocado y permanentemente firme',
    'Disco adecuado para la velocidad (RPM) de la maquina',
    'Disco sin rajaduras ni golpes']

  },
  'scaffolding': {
    title: 'Andamios y Estructuras',
    icon: <Building2 size={18} />,
    items: [
    'Apoyos sobre base firme y nivelada',
    'Estructura libre de oxidacion y deformaciones',
    'Tablones metalicos o madera sin fisuras',
    'Plataforma de trabajo completa y trabada']

  },
  'orden_limpieza': {
    title: 'Orden y Limpieza',
    icon: <Trash2 size={18} />,
    items: [
    'Pasillos, pasarelas y vias de circulacion libres de obstaculos',
    'Residuos debidamente segregados y recipientes tapados e identificados',
    'Herramientas y materiales correctamente almacenados en sus estantes/paneles',
    'Suelos limpios, secos y libres de derrames (aceite, grasa, agua)',
    'Apilamiento de materiales seguro, estable y respetando la altura maxima']

  },
  'tableros_electricos': {
    title: 'Tableros Eléctricos',
    icon: <Zap size={18} />,
    items: [
    'Gabinete cerrado con llave, sin cables expuestos ni aberturas',
    'Señalizacion de riesgo electrico visible en el exterior',
    'Identificacion clara de llaves termicas, disyuntores y circuitos',
    'Disyuntor diferencial operativo (prueba de boton de test satisfactoria)',
    'Llave termomagnetica en buen estado (sin recalentamientos ni signos de cortocircuito)',
    'Puesta a tierra conectada firmemente a la estructura metalica',
    'Area frontal del tablero despejada (minimo 1 metro de espacio libre)']

  },
  'salida_emergencia': {
    title: 'Salidas de Emergencia',
    icon: <Siren size={18} />,
    items: [
    'Via de evacuacion completamente despejada y libre de obstaculos en todo su recorrido',
    'Puertas de emergencia abren hacia el exterior sin trabas ni picaportes con llave',
    'Barral antipanico operativo y suave en su accionamiento',
    'Carteleria de salida de emergencia / via de escape visible en la oscuridad (fotoluminiscente)',
    'Salida exterior final libre de acumulaciones de materiales o vehiculos']

  },
  'luces_emergencia': {
    title: 'Luces de Emergencia',
    icon: <Lightbulb size={18} />,
    items: [
    'Equipo encendido bajo tension de red (LED indicador de carga activo)',
    'Prueba de corte de energia satisfactoria (enciende instantaneamente al simular corte)',
    'Autonomia de bateria adecuada (minimo 1 hora de funcionamiento continuo)',
    'Luminarias fijadas firmemente en la pared o techo',
    'Direccionamiento de los focos hacia las vias de escape y salidas']

  },
  'autoelevadores': {
    title: 'Auto Elevadores',
    icon: <Settings size={18} />,
    items: [
    'Luces delanteras, traseras, de giro y destellador operativo',
    'Alarma sonora de retroceso y bocina funcionan correctamente',
    'Cinturon de seguridad instalado, operativo y sin deshilacharse',
    'Frenos de servicio y de mano (estacionamiento) responden eficazmente',
    'Sistema hidraulico sin fugas de aceite en mangueras ni pistones',
    'Uñas/horquillas sin fisuras, soldaduras precarias ni deformaciones',
    'Neumaticos con presion adecuada, sin deformaciones ni desgaste excesivo']

  },
  'botiquin': {
    title: 'Botiquín de Emergencia',
    icon: <Activity size={18} />,
    items: [
    'Botiquin señalizado, visible, accesible y libre de llave',
    'Contenido completo segun listado obligatorio (gasa, apositos, vendas, antisepticos)',
    'Medicamentos y desinfectantes dentro de su fecha de vencimiento vigente',
    'Elementos limpios, secos y debidamente resguardados',
    'Presencia de guantes descartables de latex/nitrilo listos para usar']

  },
  'epp': {
    title: 'Elementos de Protección Personal',
    icon: <ShieldCheck size={18} />,
    items: [
    'Casco en buen estado, sin fisuras y con el arnés ajustado correctamente',
    'Gafas de seguridad limpias, sin rayaduras que impidan la visión',
    'Protección auditiva (tapones/auriculares) en buen estado y limpios',
    'Guantes adecuados a la tarea, sin agujeros ni desgaste excesivo',
    'Calzado de seguridad con puntera, suela antideslizante y sin roturas',
    'Ropa de trabajo en buenas condiciones, sin partes sueltas o desgarros',
    'Arnés de seguridad con costuras, cabo de vida y herrajes sin desgaste']

  },
  'extintores_checklist': {
    title: 'Matafuegos / Extintores',
    icon: <Flame size={18} />,
    items: [
    'Extintor en su ubicacion asignada, suspendido en el soporte correspondiente',
    'Señalizacion reglamentaria (chapa baliza) visible y numero de equipo legible',
    'Manometro con aguja indicadora en la zona verde de presion',
    'Fecha de recarga vigente (menos de 1 año desde el ultimo mantenimiento)',
    'Prueba hidraulica (P.H.) vigente (menos de 5 años desde la ultima prueba)',
    'Acceso al extintor completamente despejado de mercaderia u obstaculos',
    'Estado fisico excelente (sin abolladuras, corrosion ni manguera cuarteada)',
    'Precinto de seguridad y pasador metalico colocados intactos']

  },
  'audit_2026': {
    title: 'Auditoría Legal 2026',
    icon: <ShieldCheck size={18} />,
    items: [
    'Todos los EPP cuentan con certificación vigente y Sello "AR"',
    'Los EPP entregados cuentan con código QR de trazabilidad legible (Res. SIyC 18/25)',
    'Se verifican los certificados médicos de "Apto Calor" (Res. SRT 30/2023)',
    'Monitoreo de estrés térmico con mediciones VLA y VLE actualizadas',
    'Los protocolos ergonómicos contemplan Res. SRT 7/2026 y Res. 886/15']

  },
  'general_audit': {
    title: 'Relevamiento General Empresa',
    icon: <Building2 size={18} />,
    items: [
    'Orden y Limpieza: Pasillos, accesos y salidas libres de obstáculos',
    'Orden y Limpieza: Residuos debidamente segregados y recipientes adecuados',
    'Control de Tableros: Puertas cerradas, señalizados, matafuego cercano',
    'Control de Tableros: Llaves térmicas y disyuntores operativos identificados',
    'Salida de Emergencia: Puertas abren hacia afuera, barral antipánico operativo',
    'Salida de Emergencia: Señalización luminosa y despejado su recorrido',
    'Luces de Emergencia: Equipos encienden al corte, autonomía mínima 1h',
    'Auto Elevadores: Luces, bocina, alarma retroceso, cinturón seguridad operativos',
    'Auto Elevadores: Frenos, dirección, cubiertas en correcto estado',
    'Botiquín de Primeros Auxilios: Contenido completo y elementos vigentes',
    'Elementos de Protección Personal (EPP): Personal con calzado y casco obligatorio']

  },
  'trabajos_altura': {
    title: 'Trabajos en Altura',
    icon: <TriangleAlert size={18} />,
    items: [
    'Arnés de seguridad de cuerpo entero con correas y costuras íntegras',
    'Cabo de vida (eslinga) con amortiguador de caídas en buen estado',
    'Puntos de anclaje firmes, resistentes e independientes',
    'Línea de vida (horizontal/vertical) correctamente tensada y fijada',
    'Señalización y vallado preventivo en el nivel inferior',
    'Permiso de trabajo en altura confeccionado y firmado']

  },
  'trabajos_caliente': {
    title: 'Trabajos en Caliente',
    icon: <Flame size={18} />,
    items: [
    'Permiso de trabajo en caliente (soldadura/corte) autorizado',
    'Extintor de incendios operativo a menos de 5 metros de distancia',
    'Área libre de materiales combustibles o inflamables (radio de 10m)',
    'Uso de mantas ignífugas o biombos para contención de chispas',
    'Equipos de soldadura/oxicorte en buenas condiciones (cables, mangueras, válvulas arrestallamas)',
    'El soldador utiliza EPP completo (máscara, delantal, guantes, polainas de descarne)']

  },
  'productos_quimicos': {
    title: 'Sustancias Químicas',
    icon: <Activity size={18} />,
    items: [
    'Hojas/Fichas de Datos de Seguridad (FDS) disponibles y accesibles',
    'Todos los envases correctamente rotulados según sistema SGA/GHS',
    'Productos químicos almacenados sobre bateas antiderrame o pallets de contención',
    'Almacenamiento respetando matrices de incompatibilidad química',
    'Kit de control de derrames cercano y completo (absorbentes, barreras)',
    'Duchas de emergencia y lavaojos operativos y sin obstrucciones']

  },
  'espacios_confinados': {
    title: 'Espacios Confinados',
    icon: <ShieldCheck size={18} />,
    items: [
    'Permiso de ingreso a espacio confinado (PT) completado y firmado',
    'Medición de gases (O2, LEL, CO, H2S) realizada y dentro de rangos seguros',
    'Sistema de ventilación forzada o extracción operando correctamente',
    'Vigía / Observador posicionado permanentemente en el exterior',
    'Equipos de rescate y trípode armados y listos para uso',
    'Iluminación interior a 24V (antiexplosiva si corresponde)',
    'Bloqueo y etiquetado (LOTO) de energías e ingresos de fluidos efectivo']

  },
  'izaje_gruas': {
    title: 'Izaje y Grúas',
    icon: <TriangleAlert size={18} />,
    items: [
    'Plan de izaje documentado y verificado (capacidades y radios)',
    'Grúa apoyada firmemente sobre estabilizadores con bases/tacos',
    'Eslingas, fajas y grilletes inspeccionados (sin desgarros ni deformaciones)',
    'Área de izaje completamente delimitada y señalizada (prohibido paso inferior)',
    'Operador y Rigger (señalero) calificados e identificados',
    'Sistemas de seguridad de la grúa operativos (corte por sobrecarga, anemómetro)']

  },
  'ergonomia_oficina': {
    title: 'Ergonomía (Oficinas)',
    icon: <Activity size={18} />,
    items: [
    'Monitor a la altura de los ojos y a distancia adecuada (50-70 cm)',
    'Silla ergonómica en buen estado (ajuste de altura, apoyo lumbar)',
    'Apoyapiés disponible si el usuario no alcanza el suelo correctamente',
    'Teclado y mouse alineados permitiendo apoyo de antebrazos',
    'Iluminación general sin reflejos directos en la pantalla',
    'Espacio suficiente debajo del escritorio para mover las piernas']

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
  { id: 'dec1338', name: 'Decreto 1338/96 - Servicios de Medicina y de H&S', category: 'Nacional' },
  { id: 'res905', name: 'Res. SRT 905/15 - Funciones Servicios H&S', category: 'SRT' },
  { id: 'res886', name: 'Res. SRT 886/15 - Protocolo de Ergonomía', category: 'SRT' },
  { id: 'res85_84', name: 'Res. SRT 85/12 y 84/12 - Protocolos Ruido/Iluminación', category: 'SRT' },
  { id: 'res481', name: 'Res. SRT 481/16 - Estiba y Desestiba', category: 'SRT' },
  { id: 'res299', name: 'Res. SRT 299/11 - Trabajo en Altura / EPP', category: 'SRT' },
  { id: 'res295', name: 'Res. SRT 295/03 - Espacios Confinados / Contaminantes', category: 'SRT' },
  { id: 'res101', name: 'Res. SRT 101/17 - Soldadura', category: 'SRT' },
  { id: 'res594', name: 'Res. SRT 594/15 - Agentes Químicos', category: 'SRT' },
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

const getChecklistStatus = (id) => {
  const stored = localStorage.getItem(`checklist_${id}`);
  if (!stored) return { label: 'Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  try {
    const parsed = JSON.parse(stored);
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
      const savedData = localStorage.getItem(`checklist_${id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.checklistTitle) setChecklistTitle(parsed.checklistTitle);
        setCompanyInfo(parsed.companyInfo || { name: parsed.empresa || '', inspector: '', address: '', responsable: parsed.responsable || '' });
        setInspectionInfo(parsed.inspectionInfo || { item: parsed.equipo || '', serial: parsed.serial || '', date: parsed.fecha?.split('T')[0] || new Date().toISOString().split('T')[0], expirationDate: '', extinguisherObs: '', marca: '', patente: '', horometro: '', pt: '', responsableArea: '' });

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
      operatorSignature,
      signature,
      supervisorSignature,
      updatedAt: new Date().toISOString()
    };

    // Deep save for specific report persistence
    localStorage.setItem(`checklist_${id}`, JSON.stringify(data));

    // Sync with history list
    const history = JSON.parse(localStorage.getItem('tool_checklists_history') || '[]');
    const existingIndex = history.findIndex((h) => h.id === id);

    const summaryData = {
      id,
      empresa: companyInfo.name || 'Sin Empresa',
      equipo: inspectionInfo.item || 'Inspección General',
      serial: inspectionInfo.serial || 'S/N',
      fecha: new Date().toISOString(),
      title: checklistTitle,
      type: 'Checklist'
    };

    if (existingIndex >= 0) {
      history[existingIndex] = summaryData;
    } else {
      history.unshift(summaryData);
    }

    localStorage.setItem('tool_checklists_history', JSON.stringify(history));
    setHistory(history);
    await syncCollection('tool_checklists_history', history);
    toast.success('Checklist guardado con éxito y registrado en el historial ✅');

    // Go back to the list
    setSearchParams({});
    setShowForm(false);
    setCurrentStep(1);
  };


  useEffect(() => {
    if (!searchParams.get('id')) {
      // Empezar en blanco sin ningún checklist seleccionado por defecto
      setActiveSections([]);
      setEpps([]);
      setFotos([]);
    }
  }, [searchParams]);

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

  // Progress calculation
  const progressItems = [
  { label: 'Empresa', done: !!companyInfo.name?.trim() },
  { label: 'Inspector', done: !!companyInfo.inspector?.trim() },
  { label: 'Área / Equipo', done: !!inspectionInfo.item?.trim() },
  { label: 'Puntos de Control', done: activeSections.length > 0 && activeSections.every((s) => s.items.length > 0 && s.items.every((i) => i.status !== null)) },
  { label: 'Firmas', done: !!signature || !!operatorSignature || !!supervisorSignature }];

  const completedCount = progressItems.filter((p) => p.done).length;
  const progressPct = Math.round(completedCount / progressItems.length * 100);
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
    render: (item: any) =>
    <div className="flex gap-[0.4rem]">
                    <button onClick={() => {setSearchParams({ id: item.id });setShowForm(true);}} className="p-[0.4rem_0.8rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[8px] cursor-pointer text-[0.75rem] font-[700] text-[var(--color-text)] flex items-center gap-[4px]"><FileText size={15} /> Ver</button>
                    <button onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/checklist/${item.id}?print=true`;setQrTarget({ text: url, title: `Checklist — ${item.equipo}`, details: <><p className="m-[0_0_0.3rem]"><strong>Empresa:</strong> {item.empresa}</p><p className="m-[0_0_0.3rem]"><strong>Equipo:</strong> {item.equipo}</p><p className="m-[0]"><strong>Fecha:</strong> {new Date(item.fecha).toLocaleDateString('es-AR')}</p></> } as any);})} title="QR" className="p-[0.4rem] bg-[rgba(139,92,246,0.08)] border-[1px_solid_rgba(139,92,246,0.2)] rounded-[8px] text-[#8b5cf6] cursor-pointer"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(JSON.parse(localStorage.getItem('checklist_' + item.id) || 'null') || item))} title="Compartir" className="p-[0.4rem] bg-[rgba(22,163,74,0.08)] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] text-[#16a34a] cursor-pointer"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} className="p-[0.4rem] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] text-[#ef4444] cursor-pointer"><Trash2 size={15} /></button>
                </div>

  }];


  const uniqueEmpresas = [...new Set(history.map((e: any) => e.empresa).filter(Boolean))];

  const filteredHistory = history.filter((e: any) => {
    const matchesSearch = (e.equipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.serial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.marca || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmpresa = filterEmpresa === '' || e.empresa === filterEmpresa;
    return matchesSearch && matchesEmpresa;
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
                    <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-[1rem] mb-[2rem]">
                        <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)] flex items-center gap-[1rem]">
                            <div className="bg-blue-100 text-blue-600 p-[1rem] rounded-[12px]"><ClipboardCheck size={28} /></div>
                            <div>
                                <div className="text-[0.8rem] font-[800] text-[var(--color-text-muted)] uppercase">Total Checklists</div>
                                <div className="text-[1.8rem] font-[900] text-[var(--color-text)]">{history.length}</div>
                            </div>
                        </div>
                        <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)] flex items-center gap-[1rem]">
                            <div className="bg-red-100 text-red-600 p-[1rem] rounded-[12px]"><TriangleAlert size={28} /></div>
                            <div>
                                <div className="text-[0.8rem] font-[800] text-[var(--color-text-muted)] uppercase">Rechazados / NC</div>
                                <div className="text-[1.8rem] font-[900] text-[var(--color-text)]">{history.filter(h => getChecklistStatus(h.id).label === 'Rechazado').length}</div>
                            </div>
                        </div>
                        <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)] flex items-center gap-[1rem]">
                            <div className="bg-green-100 text-green-600 p-[1rem] rounded-[12px]"><CheckCircle2 size={28} /></div>
                            <div>
                                <div className="text-[0.8rem] font-[800] text-[var(--color-text-muted)] uppercase">Última Semana</div>
                                <div className="text-[1.8rem] font-[900] text-[var(--color-text)]">{history.filter(h => new Date(h.fecha) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-[1.5rem] flex gap-[1rem] flex-wrap items-center">
                        <></>
                        <button
            onClick={() => {setSearchParams({});setShowForm(true);setCurrentStep(1);}} className="flex-[0_1_auto] p-[1rem_1.5rem] rounded-[16px] bg-[#36B37E] text-[#fff] border-none font-[800] text-[1rem] cursor-pointer flex items-center gap-[0.5rem] box-shadow-[0_4px_15px_rgba(54,179,126,0.3)] white-space-[nowrap]">

            
                            <Plus size={20} /> Nuevo Checklist
                        </button>
                        <div className="flex-[1_1_300px] relative">
                            <Search size={20} className="absolute left-[1rem] top-[50%] transform-[translateY(-50%)] text-[var(--color-text-muted)]" />
                            <input
              type="text"
              placeholder="Buscar por equipo, empresa o serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="w-[100%] p-[1rem_1rem_1rem_3rem] rounded-[16px] border-[2px_solid_var(--color-border)] text-[1rem] outline-[none] bg-[var(--color-surface)] box-shadow-[0_4px_20px_rgba(0,0,0,0.05)]" />

            
                        </div>
                        <div className="flex-[0_1_250px]">
                            <select
              value={filterEmpresa}
              onChange={(e) => setFilterEmpresa(e.target.value)}
              style={{ color: filterEmpresa ? 'var(--color-text)' : 'var(--color-text-muted)' }} className="w-[100%] p-[1rem] rounded-[16px] border-[2px_solid_var(--color-border)] text-[1rem] outline-[none] bg-[var(--color-surface)] box-shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              
                                <option value="">Todas las Empresas</option>
                                {uniqueEmpresas.map((emp: any) =>
              <option key={emp} value={emp}>{emp}</option>
              )}
                            </select>
                        </div>

                    </div>

                    <DataTable
          data={filteredHistory}
          columns={columns}
          searchPlaceholder="Buscar..."
          emptyMessage="No se encontraron registros de Checklists."
          emptyIcon={<ClipboardList size={48} />} />
        

                    {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} details={(qrTarget as any).details} onClose={() => setQrTarget(null)} />}
                    {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                    <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Checklist - ${(shareItem as any)?.equipo || ''}`} text={shareItem ? `📋 Checklist de Seguridadn🔧 Equipo: ${(shareItem as any).equipo}n🏗️ Empresa: ${(shareItem as any).empresa}n📅 Fecha: ${new Date((shareItem as any).fecha).toLocaleDateString('es-AR')}` : ''} rawMessage={``} elementIdToPrint="pdf-content" fileName={`Checklist_${(shareItem as any)?.equipo || 'Reporte'}.pdf`} />
                    <div className="ats-pdf-offscreen">
                        {shareItem && <ChecklistPdfGenerator checklistData={{ ...shareItem, availableNorms }} isHeadless={true} />}
                    </div>
                </> :

      <>
                    <div className="my-6 z-10 no-print">
                        <></>
                    </div>

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
            }} className="bg-[#ffffff] text-[#2563eb] border-none p-[0.6rem_1.2rem] rounded-[10px] font-[900] cursor-pointer flex-shrink-[0] box-shadow-[0_4px_12px_rgba(0,0,0,0.1)]">

            
                        Entendido
                    </button>
                </div>
        }

            <ShareModal
          isOpen={showShare}
          open={showShare}
          onClose={() => setShowShare(false)}
          title={`Checklist – ${companyInfo?.name || ''}`}
          text={`📋 Checklist de Inspecciónn🏗️ Empresa: ${companyInfo?.name || '-'}n📍 Ubicación: ${companyInfo?.address || '-'}n👷 Responsable: ${companyInfo?.responsable || '-'}nnGenerado con Asistente H&S`}
          rawMessage={`📋 Checklist de Inspecciónn🏗️ Empresa: ${companyInfo?.name || '-'}n📍 Ubicación: ${companyInfo?.address || '-'}n👷 Responsable: ${companyInfo?.responsable || '-'}nnGenerado con Asistente H&S`}
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
              operatorSignature,
              signature,
              supervisorSignature
            }}
            pdfElementId="pdf-content-editor"
            isHeadless={true} />
          
            </div>



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
                    <div className="h-[8px] bg-[var(--color-background)] rounded-[999px] overflow-[hidden]">
                        <div style={{

                width: `${currentStep / totalSteps * 100}%`




              }} className="h-[100%] bg-[var(--gradient-premium)] rounded-[999px] transition-[width_0.5s_cubic-bezier(0.4,_0,_0.2,_1)] box-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                    <div className="flex justify-space-between p-[0_4px]">
                        {['Datos', 'Inspección', 'Plan/Obs', 'Firmas'].map((label, idx) =>
              <span key={label} style={{

                color: currentStep >= idx + 1 ? 'var(--color-primary)' : 'var(--color-text-muted)'



              }} className="text-[0.75rem] font-[900] transition-[color_0.3s] uppercase letter-spacing-[0.5px]">
                                {label}
                            </span>
              )}
                    </div>
                </div>
            </div>

            {currentStep === 1 &&
        <>
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
              const hasVehicles = activeIds.includes('autoelevadores');
              const hasPermits = activeIds.some((id) => ['espacios_confinados', 'trabajos_caliente', 'trabajos_altura'].includes(id));
              const hasHeavy = activeIds.some((id) => ['scaffolding', 'izaje_gruas'].includes(id));
              const hasExtinguishers = activeIds.includes('extintores_checklist');

              return (
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
                                        <div className="sm:col-span-1 print:col-span-1"><DocBox label="HORÓMETRO / KM" value={inspectionInfo.horometro || ''} onChange={(v) => setInspectionInfo({ ...inspectionInfo, horometro: v })} /></div>
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
                        </div>);

            })()}
            </div> {/* End of checklist-editor-content */}

            {/* TEMPLATE SELECTOR - Responsive Grid */}
            <div className="no-print grid grid-template-columns-[repeat(auto-fit,_minmax(100px,_1fr))] gap-[0.8rem] mb-[1.5rem]">




            
                {Object.entries(DEFAULT_TEMPLATES).map(([key, value]) => {
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
                                {React.cloneElement(value.icon, { size: 20 })}
                            </div>
                            <span className="text-[0.65rem] font-[800] line-height-[1.1]">{value.title}</span>
                        </button>);

            })}
            </div>
                </>
        }

            {/* EDITABLE SECTIONS - Responsive */}
            {currentStep === 2 &&
        <div className="no-print mb-8">
                {activeSections.map((section) => {
            return (
              <div key={section.id} className="card p-[0] mb-[1.5rem]">
                            <div className="bg-[var(--color-background)] p-[1rem] border-bottom-[2px_solid_var(--color-border)] flex flex-col gap-[0.8rem] items-center">
                                <input
                    className="font-black text-xl uppercase tracking-tighter bg-transparent outline-none w-full border-none focus:ring-0 text-center placeholder:text-slate-400 text-center m-[0] w-[100%] text-[var(--color-text)]"

                    value={section.title}
                    onChange={(e) => updateSectionTitle(section.id, e.target.value)} />
                  
                                <div className="flex gap-[0.5rem] flex-wrap justify-center">
                                    <button
                      onClick={() => removeSection(section.id)} className="p-[0.4rem_0.8rem] bg-[var(--color-danger)] text-[#ffffff] text-[0.65rem] font-[900] border-none rounded-[4px] cursor-pointer flex items-center gap-[0.4rem] white-space-[nowrap]">

                      
                                        <X size={12} strokeWidth={4} /> QUITAR
                                    </button>
                                    <button
                      onClick={() => checkAllOk(section.id)} className="p-[0.4rem_0.8rem] bg-[var(--color-text)] text-[#ffffff] text-[0.65rem] font-[900] border-none rounded-[4px] cursor-pointer white-space-[nowrap]">

                      
                                        TODO OK
                                    </button>
                                    <button
                      onClick={() => addItem(section.id)} className="p-[0.4rem_0.8rem] bg-[var(--color-primary)] text-[#ffffff] text-[0.65rem] font-[900] border-none rounded-[4px] cursor-pointer white-space-[nowrap]">

                      
                                        + ITEM
                                    </button>
                                </div>
                            </div>

                            <div>
                                {section.items.map((item, idx) =>
                  <div key={idx} style={{ borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid var(--color-border)' }} className="flex flex-col gap-[0]">
                                        <div className="flex items-center p-[1rem] gap-[0.8rem] flex-wrap">
                                            <div className="min-width-[24px] h-[24px] bg-[var(--color-background)] text-[var(--color-text-muted)] rounded-[6px] flex items-center justify-center text-[0.65rem] font-[900] flex-shrink-[0]">
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
                        onChange={(e) => updateItem(section.id, idx, 'text', e.target.value)} className="flex-[1] min-width-[200px] p-[0.5rem] font-[700] text-[0.9rem] outline-[none] bg-[transparent] resize-[none] border-none text-[var(--color-text)]" />
                      
                                            <button
                        onClick={() => {
                          const toastId = toast(
                            <div className="flex items-center gap-[0.8rem]">
                                                            <span className="text-[0.9rem]">¿Eliminar este punto?</span>
                                                            <button
                                onClick={() => {removeItem(section.id, idx);toast.dismiss(toastId);}} className="bg-[#ef4444] text-[#ffffff] border-none rounded-[8px] p-[0.3rem_0.7rem] cursor-pointer font-[800] text-[0.8rem]">

                                Sí</button>
                                                        </div>,
                            { duration: 4000, icon: '🗑️' }
                          );
                        }}

                        title="Eliminar" className="bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] cursor-pointer text-[#ef4444] p-[0.3rem_0.45rem] flex items-center flex-shrink-[0]">
                        
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-[0.5rem] p-[0.5rem_1rem] bg-[var(--color-background)] border-top-[1px_dashed_var(--color-border)]">
                                            <div className="flex items-center justify-space-between gap-[1rem] flex-wrap">
                                                <div className="ats-status-group flex-shrink-[0]">
                                                    <StatusBtn active={item.status === 'OK'} type="OK" onClick={() => updateItem(section.id, idx, 'status', 'OK')} label="C" />
                                                    <StatusBtn active={item.status === 'FAIL'} type="FAIL" onClick={() => updateItem(section.id, idx, 'status', 'FAIL')} label="NC" />
                                                    <StatusBtn active={item.status === 'NA'} type="NA" onClick={() => updateItem(section.id, idx, 'status', 'NA')} label="N/A" />
                                                </div>

                                                <div className="flex-[1] flex gap-[0.5rem] items-center min-width-[280px]">
                                                    <input
                            type="text"
                            placeholder="Observación / Anomalía..."
                            value={item.observation || ''}
                            onChange={(e) => updateItem(section.id, idx, 'observation', e.target.value)} className="flex-[1] p-[0.4rem_0.8rem] border-[1px_solid_var(--color-border)] rounded-[8px] text-[0.8rem] outline-[none] bg-[var(--color-surface)] text-[var(--color-text)]" />

                          

                                                    <input
                            type="file"
                            id={`file-input-${section.id}-${idx}`}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              let loadedCount = 0;
                              const itemPhotos = [];
                              files.forEach((file) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  itemPhotos.push(reader.result);
                                  loadedCount++;
                                  if (loadedCount === files.length) {
                                    updateItem(section.id, idx, 'photos', [...(item.photos || []), ...itemPhotos]);
                                  }
                                };
                                reader.readAsDataURL(file);
                              });
                            }}
                            accept="image/*"
                            capture="environment"
                            multiple className="none" />

                          

                                                    <button
                            onClick={() => document.getElementById(`file-input-${section.id}-${idx}`)?.click()}














                            title="Capturar foto de evidencia" className="p-[0.4rem_0.8rem] bg-[rgba(37,99,235,0.1)] border-[1px_solid_rgba(37,99,235,0.2)] rounded-[8px] cursor-pointer flex items-center gap-[0.3rem] text-[var(--color-primary)] text-[0.75rem] font-[bold] m-[0]">
                            
                                                        <Camera size={14} />
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
                            }} className="absolute top-[0] right-[0] bg-[#ef4444] text-[#fff] border-none w-[14px] h-[14px] flex items-center justify-center cursor-pointer text-[0.55rem] p-[0]">

                            
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
                  <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)]">
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
                                      className={`flex items-center gap-[0.5rem] p-[0.6rem_1rem] rounded-[12px] border transition-[all_0.2s] ${isSelected ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-blue-300'}`}
                                  >
                                      <Icon size={18} />
                                      <span className="font-[800] text-[0.8rem]">{epp.label}</span>
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  {/* Photo Upload */}
                  <div className="bg-[var(--color-surface)] p-[1.5rem] rounded-[16px] border-[1px_solid_var(--color-border)] box-shadow-[var(--shadow-sm)]">
                      <h4 className="m-[0_0_1rem_0] text-[0.9rem] font-[800] uppercase text-[var(--color-text)]">Evidencia Fotográfica</h4>
                      <p className="text-[0.8rem] text-[var(--color-text-muted)] mb-[1rem]">Adjunte hasta 2 fotografías de los hallazgos de la inspección.</p>
                      
                      <div className="flex gap-[1rem]">
                          {[0, 1].map(index => {
                              const photoUrl = fotos?.[index];
                              return (
                                  <div key={index} className="flex-[1] aspect-square rounded-[12px] border-[2px_dashed_var(--color-border)] flex items-center justify-center relative overflow-hidden bg-[var(--color-background)] hover:border-blue-400 transition-colors">
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
                                                  onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                          const reader = new FileReader();
                                                          reader.onloadend = () => {
                                                              const newFotos = [...(fotos || [])];
                                                              newFotos[index] = reader.result as string;
                                                              setFotos(newFotos);
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
              </div>
            </div>
          )}


          {currentStep === 5 &&
        <div className="no-print mb-8">
                {/* PLAN DE ACCIÓN - FORMULARIO */}
                <div className="border-[2px_solid_#f59e0b] rounded-[12px] p-[1.5rem] bg-[linear-gradient(135deg,_#fffbeb_0%,_#fef3c7_100%)] relative">
                    <div className="absolute top-[-12px] left-[20px] bg-[#f59e0b] text-[#fff] p-[4px_12px] text-[0.65rem] font-[900] uppercase letter-spacing-[0.1em] rounded-[4px]">
                        🎯 Plan de Acción
                    </div>
                    <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(150px,_1fr))] gap-[0.8rem] mb-[1rem] mt-[0.5rem]">
                        <input type="text" placeholder="Acción correctiva" value={newAction.action} onChange={(e) => setNewAction({ ...newAction, action: e.target.value })} className="p-[0.6rem_0.8rem] border-[1px_solid_#d1d5db] rounded-[8px] text-[0.85rem] font-[600] outline-[none]" />
                        <input type="text" placeholder="Responsable" value={newAction.responsible} onChange={(e) => setNewAction({ ...newAction, responsible: e.target.value })} className="p-[0.6rem_0.8rem] border-[1px_solid_#d1d5db] rounded-[8px] text-[0.85rem] font-[600] outline-[none]" />
                        <div className="flex gap-[0.5rem]">
                            <input type="date" value={newAction.dueDate} onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })} className="flex-[1] p-[0.6rem_0.8rem] border-[1px_solid_#d1d5db] rounded-[8px] text-[0.85rem] font-[600] outline-[none]" />
                            <select value={newAction.priority} onChange={(e) => setNewAction({ ...newAction, priority: e.target.value })} className="p-[0.6rem_0.8rem] border-[1px_solid_#d1d5db] rounded-[8px] text-[0.85rem] font-[600] outline-[none] bg-[#fff]">
                                <option value="bajo">🟢 Bajo</option>
                                <option value="medio">🟡 Medio</option>
                                <option value="alto">🟠 Alto</option>
                                <option value="critico">🔴 Crítico</option>
                            </select>
                        </div>
                        <button onClick={() => {if (newAction.action.trim()) {setActionPlan([...actionPlan, { ...newAction, id: Date.now() }]);setNewAction({ action: '', responsible: '', dueDate: '', priority: 'medio' });toast.success('Acción agregada ✅');}}} className="p-[0.6rem_1rem] bg-[#f59e0b] text-[#fff] font-[900] text-[0.85rem] rounded-[8px] border-none cursor-pointer flex items-center justify-center gap-[0.5rem]">
                            <Plus size={16} /> AGREGAR
                        </button>
                    </div>
                    {actionPlan.length > 0 &&
            <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(280px,_1fr))] gap-[0.8rem]">
                            {actionPlan.map((action, idx) =>
              <div key={action.id} className="bg-[#fff] border-[1px_solid_#fcd34d] rounded-[8px] p-[0.8rem] flex flex-col gap-[0.5rem]">
                                    <div className="flex items-start gap-[0.5rem]">
                                        <div className="min-width-[24px] h-[24px] bg-[#f59e0b] text-[#fff] rounded-[50%] flex items-center justify-center text-[0.75rem] font-[900] flex-shrink-[0]">{idx + 1}</div>
                                        <div className="flex-[1]">
                                            <p className="m-[0] font-[700] text-[0.85rem] text-[#1e293b]">{action.action}</p>
                                            <div className="flex flex-wrap gap-[0.5rem] mt-[0.3rem] text-[0.75rem]">
                                                {action.responsible && <span className="text-[#475569]">👤 {action.responsible}</span>}
                                                {action.dueDate && <span className="text-[#dc2626]">📅 {new Date(action.dueDate).toLocaleDateString('es-AR')}</span>}
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
                <div className="mt-[1rem] p-[1rem] bg-[#eff6ff] border-[1px_solid_#bfdbfe] rounded-[12px] flex flex-wrap gap-[1rem] items-center justify-space-between">
                    <div className="flex items-center gap-[0.8rem]">
                        <Calendar size={24} color="#2563eb" />
                        <div>
                            <p className="m-[0] font-[900] text-[0.85rem] text-[#1e3a8a] uppercase">Próxima Revisión Programada</p>
                            <p className="m-[0] text-[0.75rem] text-[#64748b]">Seleccioná la fecha para el próximo control</p>
                        </div>
                    </div>
                    <input type="date" value={nextReview} onChange={(e) => setNextReview(e.target.value)} className="p-[0.6rem_0.8rem] border-[1px_solid_#93c5fd] rounded-[8px] text-[0.85rem] font-[600] outline-[none] bg-[#fff]" />
                </div>

                {/* NORMATIVA APLICABLE */}
                <div className="mt-[1rem] border-[2px_solid_#c084fc] rounded-[12px] p-[1.5rem] bg-[linear-gradient(135deg,_#faf5ff_0%,_#f3e8ff_100%)] relative">
                    <div className="absolute top-[-12px] left-[20px] bg-[#9333ea] text-[#fff] p-[4px_12px] text-[0.65rem] font-[900] uppercase letter-spacing-[0.1em] rounded-[4px]">
                        📚 Normativa Aplicable
                    </div>
                    <p className="text-[0.8rem] text-[#475569] mb-[1rem] mt-[0.5rem]">Seleccioná las normativas que aplican a esta inspección:</p>
                    {Array.from(new Set(availableNorms.map((norm) => norm.category))).map((category) =>
            <div key={category} className="mb-[1rem]">
                            <h4 className="text-[0.75rem] font-[900] text-[#64748b] uppercase mb-[0.5rem]">{category}</h4>
                            <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(200px,_1fr))] gap-[0.5rem]">
                                {availableNorms.filter((norm) => norm.category === category).map((norm) =>
                <label key={norm.id} style={{ background: selectedNorms.includes(norm.id) ? '#f3e8ff' : '#fff', border: `1px solid ${selectedNorms.includes(norm.id) ? '#a855f7' : '#e2e8f0'}` }} className="flex items-center gap-[0.5rem] p-[0.6rem_0.8rem] rounded-[8px] cursor-pointer transition-[all_0.2s]">
                                        <input type="checkbox" checked={selectedNorms.includes(norm.id)} onChange={(e) => {if (e.target.checked) {setSelectedNorms([...selectedNorms, norm.id]);} else {setSelectedNorms(selectedNorms.filter((id) => id !== norm.id));}}} className="w-4 h-4" />
                                        <span className="text-[0.75rem] font-[600] text-[#1e293b]">{norm.name}</span>
                                    </label>
                )}
                            </div>
                        </div>
            )}
                </div>
            </div>
        }

            {/* Firmas y Autorizaciones */}
            {currentStep === 4 &&
        <div className="no-print card mt-[1.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[var(--radius-xl)] p-[2rem]">
                <h3 className="mt-[0] mb-[2rem] flex items-center gap-[0.7rem] text-[var(--color-primary)] font-[900] text-[1.2rem] uppercase letter-spacing-[1px]">
                    <Pencil size={24} /> Firmas y Autorizaciones
                </h3>

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
                    className="flex items-center gap-2 cursor-pointer select-none p-[0.55rem_1.1rem] rounded-[var(--radius-full)] font-[750] text-[0.8rem] transition-[all_0.2s_ease]"
                    style={{


                      border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                      color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',



                      boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                    }}>
                    
                                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setShowSignatures((s) => ({ ...s, [sig.id]: e.target.checked }))} className="none" />

                    
                                    <div style={{



                      border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                      background: isChecked ? 'var(--color-primary)' : 'transparent'




                    }} className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-[all_0.2s_ease]">
                                        {isChecked && <CheckCircle2 size={12} color="white" />}
                                    </div>
                                    {sig.label}
                                </label>);

              })}
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
                title: 'PROFESIONAL / INSTRUCTOR',
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
            
            <PdfBrandingFooter />
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

            {/* Botones de Navegación del Wizard */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-[var(--color-border)] no-print">
                <button
            onClick={prevStep}
            className="btn-wizard prev-btn p-[0.8rem_1.5rem] rounded-[var(--radius-xl)] bg-[var(--color-surface)] text-[var(--color-text)] font-[800] text-[0.9rem] border-[1px_solid_var(--color-border)] flex items-center gap-[0.5rem]"
            disabled={currentStep === 1}
            style={{







              opacity: currentStep === 1 ? 0.5 : 1,
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer'



            }}>
            
                    <ArrowLeft size={18} /> ANTERIOR
                </button>

                {currentStep < totalSteps ?
          <button
            onClick={nextStep}

            className="hover-scale p-[0.8rem_2rem] rounded-[14px] bg-[var(--gradient-premium)] border-none text-[#fff] font-[900] cursor-pointer transition-[all_0.2s] flex items-center gap-[0.5rem] box-shadow-[0_4px_15px_rgba(59,130,246,0.3)]">
            
                        SIGUIENTE <ArrowRight size={18} />
                    </button> :

          <div className="flex gap-[0.8rem] items-center flex-wrap">
                        <button
              onClick={() => {
                setCompanyInfo({ name: '', inspector: '', address: '', responsable: '' });
                setInspectionInfo({ item: '', serial: '', date: new Date().toISOString().split('T')[0], expirationDate: '', extinguisherObs: '', marca: '', patente: '', horometro: '', pt: '', responsableArea: '' });
                setActiveSections([]);
                setObservations('');
                setActionPlan([]);
                setOperatorSignature('');
                setSignature('');
                setSupervisorSignature('');
                setCurrentStep(1);
              }}

              className="hover:bg-red-50 dark:hover:bg-red-900/10 p-[0.8rem_1.2rem] rounded-[14px] bg-[transparent] border-[2px_solid_rgba(239,_68,_68,_0.3)] text-[#ef4444] font-[800] cursor-pointer transition-[all_0.2s] flex items-center gap-[0.5rem]">
              
                            <Trash2 size={18} /> Limpiar
                        </button>
                        <button
              onClick={() => window.print()}

              className="hover:bg-amber-50 dark:hover:bg-amber-900/10 p-[0.8rem_1.2rem] rounded-[14px] bg-[var(--color-surface)] border-[2px_solid_rgba(245,_158,_11,_0.3)] text-[#f59e0b] font-[800] cursor-pointer transition-[all_0.2s] flex items-center gap-[0.5rem]">
              
                            <Printer size={18} /> Imprimir
                        </button>
                        <button
              onClick={() => {
                requirePro(() => setShowShare(true));
              }}

              className="hover:bg-blue-50 dark:hover:bg-blue-900/10 p-[0.8rem_1.2rem] rounded-[14px] bg-[var(--color-surface)] border-[2px_solid_rgba(59,_130,_246,_0.3)] text-[#3b82f6] font-[800] cursor-pointer transition-[all_0.2s] flex items-center gap-[0.5rem]">
              
                            <Share2 size={18} /> Compartir
                        </button>
                        <button
              onClick={handleSave}

              className="hover-scale p-[0.8rem_2rem] rounded-[14px] bg-[#10b981] border-none text-[#fff] font-[900] cursor-pointer transition-[all_0.2s] flex items-center gap-[0.5rem] box-shadow-[0_4px_15px_rgba(16,185,129,0.3)]">
              
                            <Save size={18} /> GUARDAR
                        </button>
                    </div>
          }
            </div>

            {/* El PDF del editor se genera desde el ats-pdf-offscreen con pdfElementId="pdf-content-editor" (línea ~877) */}
            {/* Se eliminó el tercer generador redundante que causaba duplicación al imprimir */}
                </>
      }
        </div>);

}

function DocBox({ label, value, onChange, type = "text", large = false, highlight = false, flex = 1, list = null }) {
  return (
    <div className={`p-3 min-w-0 flex flex-col justify-center sm:border-r-2 last:border-r-0 sm:print:border-r-2 border-slate-200 ${highlight ? 'bg-slate-50/50' : ''}`}>
            <label className="text-[0.55rem] font-black text-slate-400 uppercase tracking-widest block mb-1 whitespace-nowrap leading-none text-left">{label}</label>
            <input
        type={type}
        list={list}
        className={`w-full outline-none bg-transparent font-black ${large ? 'text-lg tracking-tight' : 'text-xs uppercase'} text-black focus:bg-yellow-50 text-left transition-colors min-w-0`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={large ? "Ej: Amoladora, Andamio..." : ""} />
      
        </div>);

}

function StatusBtn({ active, type, onClick, label }) {
  const classes = `ats-status-btn ${active ? type === 'OK' ? 'active-ok' : type === 'FAIL' ? 'active-fail' : 'active-na' : ''}`;
  return (
    <button className={classes} onClick={onClick}>
            {label}
        </button>);

}