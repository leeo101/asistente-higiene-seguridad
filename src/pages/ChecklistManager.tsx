import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ClipboardCheck, Printer, Plus,
    Settings, TriangleAlert, Building2, Calendar,
    Check, ShieldCheck, Trash2, Edit3, X,
    Share2, Save, ArrowLeft, Info, Pencil, Camera,
    Flame, Zap, Siren, Lightbulb, Activity, CheckCircle2,
    Search, QrCode, Download, FileText, ClipboardList
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
            'Almacenamiento en portaherramientas adecuados'
        ]
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
            'Escobillas sin chispas excesivas'
        ]
    },
    'circular_saw': {
        title: 'Sierra Circular de Mano',
        icon: <ShieldCheck size={18} />,
        items: [
            'Resguardo retractil funciona suavemente',
            'Hoja de sierra sin dientes rotos y con filo',
            'Cuchillo divisor alineado y firmemente sujeto',
            'Boton de bloqueo de seguridad operativo',
            'Disco adecuado para las RPM de la maquina'
        ]
    },
    'grinder': {
        title: 'Amoladora Angular',
        icon: <TriangleAlert size={18} />,
        items: [
            'Resguardo metalico cubre como minimo el 50% del disco',
            'Mango lateral colocado y permanentemente firme',
            'Disco adecuado para la velocidad (RPM) de la maquina',
            'Disco sin rajaduras ni golpes'
        ]
    },
    'scaffolding': {
        title: 'Andamios y Estructuras',
        icon: <Building2 size={18} />,
        items: [
            'Apoyos sobre base firme y nivelada',
            'Estructura libre de oxidacion y deformaciones',
            'Tablones metalicos o madera sin fisuras',
            'Plataforma de trabajo completa y trabada'
        ]
    },
    'orden_limpieza': {
        title: 'Orden y Limpieza',
        icon: <Trash2 size={18} />,
        items: [
            'Pasillos, pasarelas y vias de circulacion libres de obstaculos',
            'Residuos debidamente segregados y recipientes tapados e identificados',
            'Herramientas y materiales correctamente almacenados en sus estantes/paneles',
            'Suelos limpios, secos y libres de derrames (aceite, grasa, agua)',
            'Apilamiento de materiales seguro, estable y respetando la altura maxima'
        ]
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
            'Area frontal del tablero despejada (minimo 1 metro de espacio libre)'
        ]
    },
    'salida_emergencia': {
        title: 'Salidas de Emergencia',
        icon: <Siren size={18} />,
        items: [
            'Via de evacuacion completamente despejada y libre de obstaculos en todo su recorrido',
            'Puertas de emergencia abren hacia el exterior sin trabas ni picaportes con llave',
            'Barral antipanico operativo y suave en su accionamiento',
            'Carteleria de salida de emergencia / via de escape visible en la oscuridad (fotoluminiscente)',
            'Salida exterior final libre de acumulaciones de materiales o vehiculos'
        ]
    },
    'luces_emergencia': {
        title: 'Luces de Emergencia',
        icon: <Lightbulb size={18} />,
        items: [
            'Equipo encendido bajo tension de red (LED indicador de carga activo)',
            'Prueba de corte de energia satisfactoria (enciende instantaneamente al simular corte)',
            'Autonomia de bateria adecuada (minimo 1 hora de funcionamiento continuo)',
            'Luminarias fijadas firmemente en la pared o techo',
            'Direccionamiento de los focos hacia las vias de escape y salidas'
        ]
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
            'Neumaticos con presion adecuada, sin deformaciones ni desgaste excesivo'
        ]
    },
    'botiquin': {
        title: 'Botiquín de Emergencia',
        icon: <Activity size={18} />,
        items: [
            'Botiquin señalizado, visible, accesible y libre de llave',
            'Contenido completo segun listado obligatorio (gasa, apositos, vendas, antisepticos)',
            'Medicamentos y desinfectantes dentro de su fecha de vencimiento vigente',
            'Elementos limpios, secos y debidamente resguardados',
            'Presencia de guantes descartables de latex/nitrilo listos para usar'
        ]
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
            'Arnés de seguridad con costuras, cabo de vida y herrajes sin desgaste'
        ]
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
            'Precinto de seguridad y pasador metalico colocados intactos'
        ]
    },
    'audit_2026': {
        title: 'Auditoría Legal 2026',
        icon: <ShieldCheck size={18} />,
        items: [
            'Todos los EPP cuentan con certificación vigente y Sello "AR"',
            'Los EPP entregados cuentan con código QR de trazabilidad legible (Res. SIyC 18/25)',
            'Se verifican los certificados médicos de "Apto Calor" (Res. SRT 30/2023)',
            'Monitoreo de estrés térmico con mediciones VLA y VLE actualizadas',
            'Los protocolos ergonómicos contemplan Res. SRT 7/2026 y Res. 886/15'
        ]
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
            'Elementos de Protección Personal (EPP): Personal con calzado y casco obligatorio'
        ]
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
            'Permiso de trabajo en altura confeccionado y firmado'
        ]
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
            'El soldador utiliza EPP completo (máscara, delantal, guantes, polainas de descarne)'
        ]
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
            'Duchas de emergencia y lavaojos operativos y sin obstrucciones'
        ]
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
            'Bloqueo y etiquetado (LOTO) de energías e ingresos de fluidos efectivo'
        ]
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
            'Sistemas de seguridad de la grúa operativos (corte por sobrecarga, anemómetro)'
        ]
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
            'Espacio suficiente debajo del escritorio para mover las piernas'
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
            'Guantes adecuados a la tarea'
        ]
    },
    {
        id: 'entorno', title: 'Condiciones del Entorno', items: [
            'Iluminacion adecuada',
            'Orden y limpieza del sector',
            'Extintor de incendios cercano',
            'Señalización de seguridad'
        ]
    }
];

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
        { id: 'art_reglamento', name: 'Reglamento Interno de ART', category: 'ART' }
    ],
    chile: [
        { id: 'dl109', name: 'D.L. 109/1970 - Código del Trabajo', category: 'Nacional' },
        { id: 'dec594', name: 'Decreto 594/1999 - Condiciones Sanitarias', category: 'Ministerio Salud' },
        { id: 'dec40', name: 'Decreto 40/1969 - Reglamento Higiene y Seguridad', category: 'Ministerio Trabajo' },
        { id: 'dec32', name: 'Decreto 32/2014 - Elementos Protección Personal', category: 'Ministerio Trabajo' },
        { id: 'ley16744', name: 'Ley 16.744 - Accidentes del Trabajo', category: 'Nacional' },
        { id: 'dec109', name: 'Decreto 109/2012 - Trabajo en Altura', category: 'Ministerio Trabajo' },
        { id: 'dec118', name: 'Decreto 118/2020 - Espacios Confinados', category: 'Ministerio Trabajo' },
        { id: 'mutual', name: 'Reglamento Mutual de Seguridad', category: 'Mutual' }
    ],
    uruguay: [
        { id: 'dec351_uy', name: 'Decreto 351/007 - Reglamento de Higiene y Seguridad', category: 'Nacional' },
        { id: 'ley18320', name: 'Ley 18.320 - Accidentes de Trabajo', category: 'Nacional' },
        { id: 'dec488', name: 'Decreto 488/013 - Trabajo en Altura', category: 'MTSS' },
        { id: 'dec182', name: 'Decreto 182/018 - Espacios Confinados', category: 'MTSS' },
        { id: 'bps', name: 'Normativa BPS - Seguros de Accidentes', category: 'BPS' }
    ],
    bolivia: [
        { id: 'ley548', name: 'Ley 548 - Código Niña, Niño y Adolescente', category: 'Nacional' },
        { id: 'dec16998', name: 'Decreto Supremo 16998 - Seguridad Industrial', category: 'Nacional' },
        { id: 'dec24266', name: 'Decreto Supremo 24266 - Reglamento Higiene y Seguridad', category: 'Nacional' },
        { id: 'res068', name: 'Res. Min. 068/94 - Salud Ocupacional', category: 'Ministerio Salud' },
        { id: 'cnss', name: 'Reglamento CNSS - Seguridad Social', category: 'CNSS' }
    ],
    paraguay: [
        { id: 'ley213', name: 'Ley 213/93 - Seguridad y Salud en el Trabajo', category: 'Nacional' },
        { id: 'dec4234', name: 'Decreto 4.234 - Reglamento General', category: 'Nacional' },
        { id: 'res616', name: 'Res. MTES 616/14 - Trabajo en Altura', category: 'MTES' },
        { id: 'ips', name: 'Reglamento IPS - Instituto de Previsión Social', category: 'IPS' }
    ],
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
        { id: 'ansi_z87', name: 'ANSI Z87.1 - Protección ocular y facial', category: 'ANSI' }
    ]
};

// Función para obtener normativas según el país
const getNormsForCountry = (country) => {
    const countryNorms = NORMS_BY_COUNTRY[country] || [];
    const internationalNorms = NORMS_BY_COUNTRY.internacional || [];
    return [...countryNorms, ...internationalNorms];
};

function DeleteConfirm({ onConfirm, onCancel }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🗑️</div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 900 }}>¿Eliminar checklist?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--color-background)', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Cancelar</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#fff' }}>Eliminar</button>
                </div>
            </div>
        </div>
    );
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
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { syncCollection, syncPulse } = useSync();
    const { requirePro } = usePaywall();
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
    const [showShare, setShowShare] = useState(false);
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
            if (sd) { const p = JSON.parse(sd); sig = p.signature || sig; stamp = p.stamp || null; }
            const name = pd ? JSON.parse(pd).name || '' : '';
            const license = pd ? JSON.parse(pd).license || '' : '';
            setProfessional({ name, license, signature: sig, stamp });
        } catch { }
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
            const savedData = localStorage.getItem(`checklist_${id}`);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed.checklistTitle) setChecklistTitle(parsed.checklistTitle);
                setCompanyInfo(parsed.companyInfo);
                setInspectionInfo(parsed.inspectionInfo);
                setActiveSections(parsed.activeSections);
                setObservations(parsed.observations || '');
                setActionPlan(parsed.actionPlan || []);
                setNextReview(parsed.nextReview || '');
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
        const existingIndex = history.findIndex(h => h.id === id);

        const summaryData = {
            id,
            empresa: companyInfo.name || 'Sin Empresa',
            equipo: inspectionInfo.item || 'Inspección General',
            serial: inspectionInfo.serial || 'S/N',
            fecha: (new Date()).toISOString(),
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
    };

    
    useEffect(() => {
        if (!searchParams.get('id')) {
            // Empezar en blanco sin ningún checklist seleccionado por defecto
            setActiveSections([]);
        }
    }, [searchParams]);

    const toggleTemplate = (templateKey) => {
        const template = DEFAULT_TEMPLATES[templateKey];
        const existingIdx = activeSections.findIndex(s => s.id === templateKey);

        if (existingIdx >= 0) {
            setActiveSections(prev => prev.filter(s => s.id !== templateKey));
        } else {
            const newSection = {
                id: templateKey,
                title: template.title,
                isMandatory: false,
                items: template.items.map(text => ({ text, status: null }))
            };
            setActiveSections(prev => [...prev, newSection]);
            setChecklistTitle(`CHECKLIST DE ${template.title}`.toUpperCase());
        }
    };

    const updateSectionTitle = (sectionId, newTitle) => {
        setActiveSections(prev => prev.map(section =>
            section.id === sectionId ? { ...section, title: newTitle } : section
        ));
    };

    const removeSection = (sectionId) => {
        setActiveSections(prev => prev.filter(s => s.id !== sectionId));
    };

    const updateItem = (sectionId, itemIdx, field, value) => {
        setActiveSections(prev => prev.map(section => {
            if (section.id !== sectionId) return section;
            const newItems = [...section.items];
            newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
            return { ...section, items: newItems };
        }));
    };

    const addItem = (sectionId) => {
        setActiveSections(prev => prev.map(section => {
            if (section.id !== sectionId) return section;
            return {
                ...section,
                items: [...section.items, { text: 'Nuevo punto de inspección', status: null }]
            };
        }));
    };

    const removeItem = (sectionId, itemIdx) => {
        setActiveSections(prev => prev.map(section => {
            if (section.id !== sectionId) return section;
            return {
                ...section,
                items: section.items.filter((_, idx) => idx !== itemIdx)
            };
        }));
    };

    const checkAllOk = (sectionId) => {
        setActiveSections(prev => prev.map(section => {
            if (section.id !== sectionId) return section;
            return {
                ...section,
                items: section.items.map(item => ({ ...item, status: 'OK' }))
            };
        }));
    };

    // Progress calculation
    const progressItems = [
        { label: 'Empresa', done: !!companyInfo.name?.trim() },
        { label: 'Inspector', done: !!companyInfo.inspector?.trim() },
        { label: 'Área / Equipo', done: !!inspectionInfo.item?.trim() },
        { label: 'Puntos de Control', done: activeSections.length > 0 && activeSections.every(s => s.items.length > 0 && s.items.every(i => i.status !== null)) },
        { label: 'Firmas', done: !!signature || !!operatorSignature || !!supervisorSignature }
    ];
    const completedCount = progressItems.filter(p => p.done).length;
    const progressPct = Math.round((completedCount / progressItems.length) * 100);
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
            header: 'Fecha',
            accessor: 'fecha',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} /> {new Date(item.fecha).toLocaleDateString('es-AR')}
                </span>
            )
        },
        {
            header: 'Equipo',
            accessor: 'equipo',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#3b82f6' }}>
                        <ClipboardList size={16} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700 }}>{item.equipo || 'Sin nombre'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>#{item.serial}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Empresa',
            accessor: 'empresa',
            sortable: true,
            render: (item: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={14} /> {item.empresa}
                </span>
            )
        },
        {
            header: 'Estado',
            accessor: 'id',
            render: (item: any) => {
                const st = getChecklistStatus(item.id);
                return (
                    <span style={{ background: st.bg, color: st.color, padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                        {st.label}
                    </span>
                );
            }
        },
        {
            header: 'Acciones',
            accessor: 'id',
            render: (item: any) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => { setSearchParams({ id: item.id }); setShowForm(true); }} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={15} /> Ver</button>
                    <button onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/checklist/${item.id}?print=true`; setQrTarget({ text: url, title: `Checklist — ${item.equipo}` } as any); })} style={{ padding: '0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', color: '#8b5cf6', cursor: 'pointer' }} title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(JSON.parse(localStorage.getItem('checklist_' + item.id) || 'null') || item))} style={{ padding: '0.4rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px', color: '#16a34a', cursor: 'pointer' }} title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                </div>
            )
        }
    ];

    const uniqueEmpresas = [...new Set(history.map((e: any) => e.empresa).filter(Boolean))];

    const filteredHistory = history.filter((e: any) => {
        const matchesSearch = (e.equipo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (e.serial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.marca || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEmpresa = filterEmpresa === '' || e.empresa === filterEmpresa;
        return matchesSearch && matchesEmpresa;
    });

    return (
        <div className="container" style={{ maxWidth: '1100px', paddingBottom: '8rem' }}>
            <Breadcrumbs />

            <PremiumHeader
                title="Control de Checklists"
                subtitle="Relevamiento preventivo y control de condiciones de seguridad"
                icon={<ClipboardCheck size={36} />}
            />

            {!showForm ? (
                <>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            onClick={() => { setSearchParams({}); setShowForm(true); }}
                            style={{ flex: '0 1 auto', padding: '1rem 1.5rem', borderRadius: '16px', background: '#36B37E', color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(54,179,126,0.3)', whiteSpace: 'nowrap' }}
                        >
                            <Plus size={20} /> Nuevo Checklist
                        </button>
                        <div style={{ flex: '1 1 300px', position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar por equipo, empresa o serial..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '16px', border: '2px solid var(--color-border)', fontSize: '1rem', outline: 'none', background: 'var(--color-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                            />
                        </div>
                        <div style={{ flex: '0 1 250px' }}>
                            <select 
                                value={filterEmpresa} 
                                onChange={e => setFilterEmpresa(e.target.value)}
                                style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '2px solid var(--color-border)', fontSize: '1rem', outline: 'none', background: 'var(--color-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', color: filterEmpresa ? 'var(--color-text)' : 'var(--color-text-muted)' }}
                            >
                                <option value="">Todas las Empresas</option>
                                {uniqueEmpresas.map((emp: any) => (
                                    <option key={emp} value={emp}>{emp}</option>
                                ))}
                            </select>
                        </div>
                        {history.length > 0 && (
                            <button onClick={handleExportCSV} style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-primary)', border: 'none', borderRadius: '16px', padding: '1rem 1.5rem', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', color: '#ffffff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                <Download size={20} /> Excel
                            </button>
                        )}
                    </div>

                    <DataTable
                        data={filteredHistory}
                        columns={columns}
                        searchPlaceholder="Buscar..."
                        emptyMessage="No se encontraron registros de Checklists."
                        emptyIcon={<ClipboardList size={48} />}
                        onEmptyAction={() => { setSearchParams({}); setShowForm(true); }}
                        emptyActionLabel="Realizar Control Nuevo"
                    />

                    {qrTarget && <QRModal text={(qrTarget as any).text} title={(qrTarget as any).title} onClose={() => setQrTarget(null)} />}
                    {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                    <ShareModal isOpen={!!shareItem} open={!!shareItem} onClose={() => setShareItem(null)} title={`Checklist - ${(shareItem as any)?.equipo || ''}`} text={shareItem ? `📋 Checklist de Seguridad\n🔧 Equipo: ${(shareItem as any).equipo}\n🏗️ Empresa: ${(shareItem as any).empresa}\n📅 Fecha: ${new Date((shareItem as any).fecha).toLocaleDateString('es-AR')}` : ''} rawMessage={``} elementIdToPrint="pdf-content" fileName={`Checklist_${(shareItem as any)?.equipo || 'Reporte'}.pdf`} />
                    <div className="ats-pdf-offscreen">
                        {shareItem && <ChecklistPdfGenerator checklistData={shareItem} isHeadless={true} />}
                    </div>
                </>
            ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <button onClick={() => { setShowForm(false); setSearchParams({}); }} style={{ background: 'var(--color-background)', border: '2px solid var(--color-border)', borderRadius: '12px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, cursor: 'pointer', color: 'var(--color-text)' }}>
                            <ArrowLeft size={18} /> Volver
                        </button>
                    </div>

            {showTutorialBanner && (
                <div className="no-print" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 30px rgba(37,99,235,0.2)', position: 'relative', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.6rem', borderRadius: '12px' }}>
                            <Info size={24} />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>¡Todo es editable!</h4>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
                                Recuerda que puedes hacer clic en el <strong>Título Principal</strong>, en los <strong>Títulos de las Secciones</strong> o en las <strong>Preguntas</strong> para modificarlas y adaptarlas a la inspección que necesites.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setShowTutorialBanner(false);
                            localStorage.setItem('checklist_tutorial_seen', 'true');
                        }}
                        style={{ background: '#ffffff', color: '#2563eb', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    >
                        Entendido
                    </button>
                </div>
            )}

            <ShareModal
                isOpen={showShare}
                open={showShare}
                onClose={() => setShowShare(false)}
                title={`Checklist – ${companyInfo?.name || ''}`}
                text={`📋 Checklist de Inspección\n🏗️ Empresa: ${companyInfo?.name || '-'}\n📍 Ubicación: ${companyInfo?.address || '-'}\n👷 Responsable: ${companyInfo?.responsable || '-'}\n\nGenerado con Asistente H&S`}
                rawMessage={`📋 Checklist de Inspección\n🏗️ Empresa: ${companyInfo?.name || '-'}\n📍 Ubicación: ${companyInfo?.address || '-'}\n👷 Responsable: ${companyInfo?.responsable || '-'}\n\nGenerado con Asistente H&S`}
                elementIdToPrint="pdf-content"
                fileName={`Checklist_${companyInfo?.name || 'Reporte'}.pdf`}
            />

            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button
                    onClick={handleSave}
                    className="btn-floating-action"
                    style={{ background: '#36B37E', color: '#ffffff' }}
                >
                    <Save size={18} /> GUARDAR
                </button>
                <button
                    onClick={() => requirePro(() => setShowShare(true))}
                    className="btn-floating-action"
                    style={{ background: '#0052CC', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={() => requirePro(() => window.print())}
                    className="btn-floating-action"
                    style={{ background: '#FF8B00', color: '#ffffff' }}
                >
                    <Printer size={18} /> IMPRIMIR
                </button>
            </div>

            {/* Progress Section */}
            <div className="no-print" style={{
                marginBottom: '2rem',
                marginTop: '1.5rem',
                padding: '2.5rem 2rem',
                background: 'var(--color-surface)',
                borderRadius: '24px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/#tools')} style={{ padding: '0.6rem', background: 'var(--color-background)', borderRadius: '12px', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex' }}>
                            <ArrowLeft size={22} />
                        </button>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <ShieldCheck className="text-blue-600" size={24} />
                                Relevamiento de Condiciones
                            </h2>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Progreso del Checklist</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: progressColor }}>{progressPct}%</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{progressLabel}</span>
                    </div>
                </div>

                {/* Progress Bar Graphic */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ height: '8px', background: 'var(--color-background)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${progressPct}%`,
                            background: progressColor,
                            borderRadius: '999px',
                            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: `0 0 8px ${progressColor}88`
                        }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {progressItems.map((item) => (
                            <span key={item.label} style={{
                                fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                                borderRadius: '999px',
                                background: item.done ? 'rgba(16,185,129,0.12)' : 'var(--color-background)',
                                color: item.done ? '#10b981' : 'var(--color-text-muted)',
                                border: `1px solid ${item.done ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,
                                display: 'flex', alignItems: 'center', gap: '0.3rem'
                            }}>
                                {item.done ? '✓' : '○'} {item.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div id="checklist-editor-content" className="card ats-editor-panel" style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', margin: '0 auto', marginBottom: '2rem' }}>
                <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 sm:gap-6 border-b-4 pb-6 mb-8" style={{ borderColor: 'var(--color-border)' }}>
                    {/* Top Left Text */}
                    <div className="w-full sm:w-auto sm:flex-1 text-center sm:text-left">
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Sistema de Gestión</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text)' }}>Control HYS</p>
                    </div>

                    {/* Center Main Title */}
                    <div className="w-full sm:w-auto sm:flex-1 flex flex-col items-center justify-center text-center">
                        <input
                            value={checklistTitle}
                            onChange={(e) => setChecklistTitle(e.target.value)}
                            style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, textAlign: 'center', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--color-border)', outline: 'none', color: 'var(--color-text)', width: '100%', maxWidth: '500px' }}
                            title="Haz clic para editar el título"
                        />
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4em', marginTop: '0.25rem' }}>Inspección de Seguridad</p>
                    </div>

                    {/* Right Document Counter + Logo */}
                    <div className="w-full sm:w-auto sm:flex-1 flex flex-col items-center sm:items-end gap-2 text-center sm:text-right">
                        <CompanyLogo style={{ height: '40px', maxWidth: '120px' }} />
                        <div>
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--color-border)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>PÁGINA</div>
                            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--color-text)' }}>01 / 01</div>
                        </div>
                    </div>
                </div>

                <div style={{ border: '2px solid var(--color-border)', borderRadius: '16px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden', background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s' }} className="hover:border-blue-400/50 hover:shadow-md">
                    <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ borderBottom: '2px solid var(--color-border)', width: '100%' }}>
                        <div className="sm:col-span-2 print:col-span-2"><DocBox label="CLIENTE / EMPRESA" value={companyInfo.name} onChange={v => setCompanyInfo({ ...companyInfo, name: v })} large /></div>
                        <div className="sm:col-span-2 print:col-span-2"><DocBox label="UBICACIÓN / DIRECCIÓN" value={companyInfo.address} onChange={v => setCompanyInfo({ ...companyInfo, address: v })} /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%', borderBottom: '2px solid var(--color-border)' }}>
                        <div className="sm:col-span-1 print:col-span-1"><DocBox label="FECHA" value={inspectionInfo.date} onChange={v => setInspectionInfo({ ...inspectionInfo, date: v })} type="date" /></div>
                        <div className="sm:col-span-2 print:col-span-2"><DocBox label="ÁREA / EQUIPO INSPECCIONADO" value={inspectionInfo.item} onChange={v => setInspectionInfo({ ...inspectionInfo, item: v })} /></div>
                        <div className="sm:col-span-1 print:col-span-1"><DocBox label="Nº IDENTIFICACIÓN (SERIAL)" value={inspectionInfo.serial} onChange={v => setInspectionInfo({ ...inspectionInfo, serial: v })} /></div>
                    </div>
                    {activeSections.some(s => s.id === 'extintores_checklist') && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%', borderBottom: '2px solid var(--color-border)' }}>
                            <div className="sm:col-span-1 print:col-span-1" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                                <DocBox label="VENCIMIENTO CARGA" value={inspectionInfo.expirationDate || ''} onChange={v => setInspectionInfo({ ...inspectionInfo, expirationDate: v })} type="date" />
                            </div>
                            <div className="sm:col-span-3 print:col-span-3" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                                <DocBox label="OBSERVACIONES EXTINTOR" value={inspectionInfo.extinguisherObs || ''} onChange={v => setInspectionInfo({ ...inspectionInfo, extinguisherObs: v })} />
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%' }}>
                        <div className="sm:col-span-2 print:col-span-2"><DocBox label="INSPECTOR / RESPONSABLE" value={companyInfo.inspector} onChange={v => setCompanyInfo({ ...companyInfo, inspector: v })} /></div>
                        <div className="sm:col-span-2 print:col-span-2"><DocBox label="PROFESIONAL HYS" value={professional.name} onChange={() => { }} /></div>
                    </div>
                </div>
            </div>

            {/* TEMPLATE SELECTOR - Responsive Grid */}
            <div className="no-print" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '0.8rem',
                marginBottom: '1.5rem'
            }}>
                {(() => {
                    const activeIds = activeSections.map((s: any) => s.id);
                    const hasTools = activeIds.some(id => ['manual_tools', 'electric_tools', 'circular_saw', 'grinder'].includes(id));
                    const hasVehicles = activeIds.includes('autoelevadores');
                    const hasPermits = activeIds.some(id => ['espacios_confinados', 'trabajos_caliente', 'trabajos_altura'].includes(id));
                    const hasHeavy = activeIds.some(id => ['scaffolding', 'izaje_gruas'].includes(id));
                    const hasExtinguishers = activeIds.includes('extintores_checklist');

                    return (
                        <div style={{ border: '2px solid var(--color-border)', borderRadius: '16px', marginBottom: '2.5rem', width: '100%', overflow: 'hidden', background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s', gridColumn: '1 / -1' }} className="hover:border-blue-400/50 hover:shadow-md">
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ borderBottom: '2px solid var(--color-border)', width: '100%' }}>
                                <div className="sm:col-span-2 print:col-span-2"><DocBox label="CLIENTE / EMPRESA" value={companyInfo.name} onChange={v => setCompanyInfo({ ...companyInfo, name: v })} large /></div>
                                <div className="sm:col-span-2 print:col-span-2"><DocBox label="UBICACIÓN / DIRECCIÓN" value={companyInfo.address} onChange={v => setCompanyInfo({ ...companyInfo, address: v })} /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%', borderBottom: '2px solid var(--color-border)' }}>
                                <div className="sm:col-span-1 print:col-span-1"><DocBox label="FECHA" value={inspectionInfo.date} onChange={v => setInspectionInfo({ ...inspectionInfo, date: v })} type="date" /></div>
                                
                                {!(hasVehicles && !hasTools && !hasPermits && !hasHeavy && !hasExtinguishers) && (
                                    <div className="sm:col-span-2 print:col-span-2"><DocBox label={hasPermits ? "SECTOR / ÁREA" : "ÁREA / EQUIPO INSPECCIONADO"} value={inspectionInfo.item} onChange={v => setInspectionInfo({ ...inspectionInfo, item: v })} /></div>
                                )}
                                
                                {(!hasPermits && !hasVehicles) && (
                                   <div className="sm:col-span-1 print:col-span-1"><DocBox label={hasExtinguishers ? "CHAPA / NÚMERO" : "Nº IDENTIFICACIÓN (SERIAL)"} value={inspectionInfo.serial} onChange={v => setInspectionInfo({ ...inspectionInfo, serial: v })} /></div>
                                )}
                                
                                {hasVehicles && (
                                    <>
                                        <div className="sm:col-span-1 print:col-span-1"><DocBox label="MARCA / MODELO" value={inspectionInfo.marca || ''} onChange={v => setInspectionInfo({ ...inspectionInfo, marca: v })} /></div>
                                        <div className="sm:col-span-1 print:col-span-1"><DocBox label="DOMINIO (PATENTE)" value={inspectionInfo.patente || ''} onChange={v => setInspectionInfo({ ...inspectionInfo, patente: v })} /></div>
                                        <div className="sm:col-span-1 print:col-span-1"><DocBox label="HORÓMETRO / KM" value={inspectionInfo.horometro || ''} onChange={v => setInspectionInfo({ ...inspectionInfo, horometro: v })} /></div>
                                    </>
                                )}
                            </div>
                            
                            {(hasTools || hasHeavy) && !hasVehicles && (
                                <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%', borderBottom: '2px solid var(--color-border)' }}>
                                    <div className="sm:col-span-2 print:col-span-2"><DocBox label="MARCA / MODELO" value={inspectionInfo.marca || ''} onChange={v => setInspectionInfo({ ...inspectionInfo, marca: v })} /></div>
                                </div>
                            )}

                            {hasPermits && (
                                <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%', borderBottom: '2px solid var(--color-border)' }}>
                                    <div className="sm:col-span-2 print:col-span-2"><DocBox label="Nº PERMISO DE TRABAJO (PT)" value={inspectionInfo.pt || ''} onChange={v => setInspectionInfo({ ...inspectionInfo, pt: v })} /></div>
                                    <div className="sm:col-span-2 print:col-span-2"><DocBox label="RESPONSABLE DEL ÁREA / SUPERVISOR" value={inspectionInfo.responsableArea || ''} onChange={v => setInspectionInfo({ ...inspectionInfo, responsableArea: v })} /></div>
                                </div>
                            )}

                            {hasExtinguishers && (
                                <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%', borderBottom: '2px solid var(--color-border)' }}>
                                    <div className="sm:col-span-1 print:col-span-1" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                                        <DocBox label="VENCIMIENTO CARGA" value={inspectionInfo.expirationDate || ''} onChange={v => setInspectionInfo({ ...inspectionInfo, expirationDate: v })} type="date" />
                                    </div>
                                    <div className="sm:col-span-3 print:col-span-3" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                                        <DocBox label="OBSERVACIONES EXTINTOR" value={inspectionInfo.extinguisherObs || ''} onChange={v => setInspectionInfo({ ...inspectionInfo, extinguisherObs: v })} />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-4 print:grid-cols-4" style={{ width: '100%' }}>
                                <div className="sm:col-span-2 print:col-span-2"><DocBox label="INSPECTOR / RESPONSABLE" value={companyInfo.inspector} onChange={v => setCompanyInfo({ ...companyInfo, inspector: v })} /></div>
                                <div className="sm:col-span-2 print:col-span-2"><DocBox label="PROFESIONAL HYS" value={professional.name} onChange={() => { }} /></div>
                            </div>
                        </div>
                    );
                })()}

                {Object.entries(DEFAULT_TEMPLATES).map(([key, value]) => {
                    const active = activeSections.some(s => s.id === key);
                    return (
                        <button
                            key={key}
                            onClick={() => toggleTemplate(key)}
                            className="card"
                            style={{
                                padding: '0.8rem 0.5rem',
                                margin: 0,
                                border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: active ? 'var(--color-background)' : 'var(--color-surface)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                textAlign: 'center',
                                minHeight: '80px'
                            }}
                        >
                            <div style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                {React.cloneElement(value.icon, { size: 20 })}
                            </div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, lineHeight: 1.1 }}>{value.title}</span>
                        </button>
                    );
                })}
            </div>

            {/* EDITABLE SECTIONS - Responsive */}
            <div className="no-print" style={{ marginBottom: '2rem' }}>
                {activeSections.map(section => {
                                        return (
                        <div key={section.id} className="card" style={{ padding: 0, marginBottom: '1.5rem' }}>
                            <div style={{ background: 'var(--color-background)', padding: '1rem', borderBottom: '2px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
                                <input
                                    className="font-black text-xl uppercase tracking-tighter bg-transparent outline-none w-full border-none focus:ring-0 text-center placeholder:text-slate-400"
                                    style={{ textAlign: 'center', margin: 0, width: '100%', color: 'var(--color-text)' }}
                                    value={section.title}
                                    onChange={e => updateSectionTitle(section.id, e.target.value)}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => removeSection(section.id)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--color-danger)', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                                    >
                                        <X size={12} strokeWidth={4} /> QUITAR
                                    </button>
                                    <button
                                        onClick={() => checkAllOk(section.id)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--color-text)', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                        TODO OK
                                    </button>
                                    <button
                                        onClick={() => addItem(section.id)}
                                        style={{ padding: '0.4rem 0.8rem', background: 'var(--color-primary)', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                        + ITEM
                                    </button>
                                </div>
                            </div>

                            <div>
                                {section.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0', borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', gap: '0.8rem', flexWrap: 'wrap' }}>
                                            <div style={{ minWidth: '24px', height: '24px', background: 'var(--color-background)', color: 'var(--color-text-muted)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, flexShrink: 0 }}>
                                                {idx + 1}
                                            </div>
                                            <textarea
                                                rows={1}
                                                style={{ flex: 1, minWidth: '200px', padding: '0.5rem', fontWeight: 700, fontSize: '0.9rem', outline: 'none', background: 'transparent', resize: 'none', border: 'none', color: 'var(--color-text)' }}
                                                value={item.text}
                                                onInput={(e) => {
                                                    const target = e.target as any;
                                                    target.style.height = 'auto';
                                                    target.style.height = target.scrollHeight + 'px';
                                                }}
                                                onChange={e => updateItem(section.id, idx, 'text', e.target.value)}
                                            />
                                            <button
                                                onClick={() => {
                                                    const toastId = toast(
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                            <span style={{ fontSize: '0.9rem' }}>¿Eliminar este punto?</span>
                                                            <button
                                                                onClick={() => { removeItem(section.id, idx); toast.dismiss(toastId); }}
                                                                style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem' }}
                                                            >Sí</button>
                                                        </div>,
                                                        { duration: 4000, icon: '🗑️' }
                                                    );
                                                }}
                                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', padding: '0.3rem 0.45rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--color-background)', borderTop: '1px dashed var(--color-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                                <div className="ats-status-group" style={{ flexShrink: 0 }}>
                                                    <StatusBtn active={item.status === 'OK'} type="OK" onClick={() => updateItem(section.id, idx, 'status', 'OK')} label="C" />
                                                    <StatusBtn active={item.status === 'FAIL'} type="FAIL" onClick={() => updateItem(section.id, idx, 'status', 'FAIL')} label="NC" />
                                                    <StatusBtn active={item.status === 'NA'} type="NA" onClick={() => updateItem(section.id, idx, 'status', 'NA')} label="N/A" />
                                                </div>

                                                <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: '280px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Observación / Anomalía..."
                                                        value={item.observation || ''}
                                                        onChange={e => updateItem(section.id, idx, 'observation', e.target.value)}
                                                        style={{ flex: 1, padding: '0.4rem 0.8rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                                    />

                                                    <input 
                                                        type="file" 
                                                        id={`file-input-${section.id}-${idx}`}
                                                        onChange={e => {
                                                            const files = Array.from(e.target.files || []);
                                                            let loadedCount = 0;
                                                            const itemPhotos = [];
                                                            files.forEach(file => {
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
                                                        multiple 
                                                        style={{ display: 'none' }} 
                                                    />

                                                    <button
                                                        onClick={() => document.getElementById(`file-input-${section.id}-${idx}`)?.click()}
                                                        style={{ 
                                                            padding: '0.4rem 0.8rem', 
                                                            background: 'rgba(37,99,235,0.1)', 
                                                            border: '1px solid rgba(37,99,235,0.2)', 
                                                            borderRadius: '8px', 
                                                            cursor: 'pointer', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '0.3rem', 
                                                            color: 'var(--color-primary)', 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: 'bold',
                                                            margin: 0
                                                        }}
                                                        title="Capturar foto de evidencia"
                                                    >
                                                        <Camera size={14} />
                                                        <span>{item.photos?.length || 0}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {item.photos && item.photos.length > 0 && (
                                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                                                    {item.photos.map((photo, pIdx) => (
                                                        <div key={pIdx} style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                                            <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button 
                                                                onClick={() => {
                                                                    const updatedPhotos = item.photos.filter((_, i) => i !== pIdx);
                                                                    updateItem(section.id, idx, 'photos', updatedPhotos);
                                                                }}
                                                                style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', border: 'none', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.55rem', padding: 0 }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FORMULARIOS EDITABLES - NO PRINT */}
            <div className="no-print" style={{ marginBottom: '2rem' }}>
                {/* PLAN DE ACCIÓN - FORMULARIO */}
                <div style={{ border: '2px solid #f59e0b', borderRadius: '12px', padding: '1.5rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '20px', background: '#f59e0b', color: '#fff', padding: '4px 12px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '4px' }}>
                        🎯 Plan de Acción
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.8rem', marginBottom: '1rem', marginTop: '0.5rem' }}>
                        <input type="text" placeholder="Acción correctiva" value={newAction.action} onChange={(e) => setNewAction({ ...newAction, action: e.target.value })} style={{ padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
                        <input type="text" placeholder="Responsable" value={newAction.responsible} onChange={(e) => setNewAction({ ...newAction, responsible: e.target.value })} style={{ padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="date" value={newAction.dueDate} onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })} style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
                            <select value={newAction.priority} onChange={(e) => setNewAction({ ...newAction, priority: e.target.value })} style={{ padding: '0.6rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none', background: '#fff' }}>
                                <option value="bajo">🟢 Bajo</option>
                                <option value="medio">🟡 Medio</option>
                                <option value="alto">🟠 Alto</option>
                                <option value="critico">🔴 Crítico</option>
                            </select>
                        </div>
                        <button onClick={() => { if (newAction.action.trim()) { setActionPlan([...actionPlan, { ...newAction, id: Date.now() }]); setNewAction({ action: '', responsible: '', dueDate: '', priority: 'medio' }); toast.success('Acción agregada ✅'); } }} style={{ padding: '0.6rem 1rem', background: '#f59e0b', color: '#fff', fontWeight: 900, fontSize: '0.85rem', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Plus size={16} /> AGREGAR
                        </button>
                    </div>
                    {actionPlan.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.8rem' }}>
                            {actionPlan.map((action, idx) => (
                                <div key={action.id} style={{ background: '#fff', border: '1px solid #fcd34d', borderRadius: '8px', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <div style={{ minWidth: '24px', height: '24px', background: '#f59e0b', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, flexShrink: 0 }}>{idx + 1}</div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{action.action}</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.3rem', fontSize: '0.75rem' }}>
                                                {action.responsible && <span style={{ color: '#475569' }}>👤 {action.responsible}</span>}
                                                {action.dueDate && <span style={{ color: '#dc2626' }}>📅 {new Date(action.dueDate).toLocaleDateString('es-AR')}</span>}
                                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem', background: action.priority === 'critico' ? '#fef2f2' : action.priority === 'alto' ? '#fff7ed' : action.priority === 'medio' ? '#fefce8' : '#f0fdf4', color: action.priority === 'critico' ? '#dc2626' : action.priority === 'alto' ? '#ea580c' : action.priority === 'medio' ? '#ca8a04' : '#16a34a' }}>
                                                    {action.priority === 'critico' ? '🔴' : action.priority === 'alto' ? '🟠' : action.priority === 'medio' ? '🟡' : '🟢'} {action.priority.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => { setActionPlan(actionPlan.filter(a => a.id !== action.id)); toast.success('Acción eliminada'); }} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', padding: '0.3rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* PRÓXIMA REVISIÓN */}
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Calendar size={24} color="#2563eb" />
                        <div>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.85rem', color: '#1e3a8a', textTransform: 'uppercase' }}>Próxima Revisión Programada</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Seleccioná la fecha para el próximo control</p>
                        </div>
                    </div>
                    <input type="date" value={nextReview} onChange={(e) => setNextReview(e.target.value)} style={{ padding: '0.6rem 0.8rem', border: '1px solid #93c5fd', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none', background: '#fff' }} />
                </div>

                {/* NORMATIVA APLICABLE */}
                <div style={{ marginTop: '1rem', border: '2px solid #c084fc', borderRadius: '12px', padding: '1.5rem', background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '20px', background: '#9333ea', color: '#fff', padding: '4px 12px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '4px' }}>
                        📚 Normativa Aplicable
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1rem', marginTop: '0.5rem' }}>Seleccioná las normativas que aplican a esta inspección:</p>
                    {Array.from(new Set(availableNorms.map(norm => norm.category))).map(category => (
                        <div key={category} style={{ marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{category}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                                {availableNorms.filter(norm => norm.category === category).map(norm => (
                                    <label key={norm.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', background: selectedNorms.includes(norm.id) ? '#f3e8ff' : '#fff', border: `1px solid ${selectedNorms.includes(norm.id) ? '#a855f7' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <input type="checkbox" checked={selectedNorms.includes(norm.id)} onChange={(e) => { if (e.target.checked) { setSelectedNorms([...selectedNorms, norm.id]); } else { setSelectedNorms(selectedNorms.filter(id => id !== norm.id)); } }} className="w-4 h-4" />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{norm.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Firmas y Autorizaciones */}
            <div className="no-print card" style={{ marginTop: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <Pencil size={24} /> Firmas y Autorizaciones
                </h3>

                {/* Custom visual switches */}
                <div className="no-print mb-8 p-6" style={{ background: 'rgba(30, 41, 59, 0.2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ color: 'var(--color-text)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {[
                            { id: 'operator', label: 'Responsable / Operador' },
                            { id: 'supervisor', label: 'Supervisión / Verificador' },
                            { id: 'professional', label: 'Profesional / Inspector' }
                        ].map(sig => {
                            const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                            return (
                                <label
                                    key={sig.id}
                                    className="flex items-center gap-2 cursor-pointer select-none"
                                    style={{
                                        padding: '0.55rem 1.1rem',
                                        borderRadius: 'var(--radius-full)',
                                        border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                                        color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',
                                        fontWeight: 750,
                                        fontSize: '0.8rem',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={e => setShowSignatures(s => ({ ...s, [sig.id]: e.target.checked }))}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '4px',
                                        border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                                        background: isChecked ? 'var(--color-primary)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        {isChecked && <CheckCircle2 size={12} color="white" />}
                                    </div>
                                    {sig.label}
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* On-Sheet Visual Preview of PDF signature blocks */}
                <div style={{ marginBottom: '2.5rem' }}>
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
                        } : null}
                    />
                </div>

                {/* Interactive Signature Drawing Pads */}
                <div className="mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
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

            {/* PDF Generator - Fuera de pantalla, solo visible al imprimir o generar PDF */}
            <div
                id="pdf-generator-container"
                className="print-only"
                style={{
                    position: 'fixed',
                    left: '-99999px',
                    top: 0,
                    width: '210mm',
                    visibility: 'hidden'
                }}
            >
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
                        showSignatures,
                        availableNorms,
                        operatorSignature,
                        signature,
                        supervisorSignature,
                        professionalSignature: professional.signature,
                        professionalName: professional.name,
                        professionalLicense: professional.license,
                        professionalStamp: professional.stamp
                    }}
                />
                </div>
                </>
            )}
        </div>
    );
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
                onChange={e => onChange(e.target.value)}
                placeholder={large ? "Ej: Amoladora, Andamio..." : ""}
            />
        </div>
    );
}

function StatusBtn({ active, type, onClick, label }) {
    const classes = `ats-status-btn ${active ? (type === 'OK' ? 'active-ok' : type === 'FAIL' ? 'active-fail' : 'active-na') : ''}`;
    return (
        <button className={classes} onClick={onClick}>
            {label}
        </button>
    );
}
