import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, HardHat, TriangleAlert, CheckCircle, Clock, Shield,
  Download, QrCode, Info, Footprints, Hand, Glasses, Ear, Shirt,
  Wind, Eye, Flame, Activity, HelpCircle, User, Calendar, ShieldCheck, Award, X,
  Zap, Snowflake, Droplets, Briefcase, Pencil, Tag, AlertTriangle, Printer,
  Sparkles, Check, Building, FileSignature, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { safeGetLocalStorage } from '../utils/storageHelper';
import { useSync } from '../contexts/SyncContext';
import { downloadCSV } from '../services/exportCsv';
import { usePaywall } from '../hooks/usePaywall';
import PPEReceiptPdfGenerator from '../components/PPEReceiptPdfGenerator';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import { ModuleFormLayout } from '../components/module';
import QRSignatureModal from '../components/QRSignatureModal';
import type { PPEItem } from '../types/ppe';
import { OFFICIAL_PPE_USEFUL_LIFE, CRITICAL_PPE_TYPES } from '../types/ppe';
import { evaluatePPEFleetCompliance, calculatePPEExpiryDays } from '../utils/srtProtocols';
import { printElementAsDocument } from '../utils/pdfHelper';

const EPP_TYPES = [
  'Casco de seguridad', 'Calzado de seguridad', 'Guantes de trabajo',
  'Lentes de seguridad', 'Protector auditivo', 'Arnés de seguridad',
  'Chaleco reflectivo', 'Mascarilla / Respirador', 'Careta facial',
  'Ropa ignífuga', 'Botas de goma', 'Rodilleras', 'Faja lumbar',
  'Guantes dieléctricos', 'Traje para frío', 'Traje químico', 
  'Cofia / Redecilla', 'Delantal de cuero', 'Botiquín personal', 'Otro'
];

// Categorías anatómicas para filtrar visualmente los EPPs
const EPP_CATEGORIES = [
  { id: 'todos', label: 'Todos (20)' },
  { id: 'cabeza', label: 'Cabeza y Ojos' },
  { id: 'auditivo_resp', label: 'Auditiva y Resp.' },
  { id: 'manos_pies', label: 'Manos y Pies' },
  { id: 'cuerpo', label: 'Cuerpo e Indumentaria' },
  { id: 'altura_otros', label: 'Altura y Otros' },
];

const EPP_CATEGORY_MAP: Record<string, string> = {
  'Casco de seguridad': 'cabeza',
  'Careta facial': 'cabeza',
  'Lentes de seguridad': 'cabeza',
  'Protector auditivo': 'auditivo_resp',
  'Mascarilla / Respirador': 'auditivo_resp',
  'Guantes de trabajo': 'manos_pies',
  'Guantes dieléctricos': 'manos_pies',
  'Calzado de seguridad': 'manos_pies',
  'Botas de goma': 'manos_pies',
  'Rodilleras': 'manos_pies',
  'Chaleco reflectivo': 'cuerpo',
  'Ropa ignífuga': 'cuerpo',
  'Traje para frío': 'cuerpo',
  'Traje químico': 'cuerpo',
  'Delantal de cuero': 'cuerpo',
  'Cofia / Redecilla': 'cuerpo',
  'Faja lumbar': 'cuerpo',
  'Arnés de seguridad': 'altura_otros',
  'Botiquín personal': 'altura_otros',
  'Otro': 'altura_otros',
};

// Sugerencias de normas técnicas argentinas oficiales por tipo de EPP
const SUGGESTED_STANDARDS: Record<string, { standard: string; certNumber: string }> = {
  'Casco de seguridad': { standard: 'IRAM', certNumber: 'IRAM 3620 (Tipo I Clase B/E)' },
  'Calzado de seguridad': { standard: 'IRAM', certNumber: 'IRAM 3610 (Puntera Acero/Comp.)' },
  'Guantes de trabajo': { standard: 'IRAM', certNumber: 'IRAM 3601 (Riesgos Mecánicos)' },
  'Lentes de seguridad': { standard: 'IRAM', certNumber: 'IRAM 3630 / ANSI Z87.1' },
  'Protector auditivo': { standard: 'IRAM', certNumber: 'IRAM 4060 / ANSI S3.19 (NRR)' },
  'Arnés de seguridad': { standard: 'IRAM', certNumber: 'IRAM 3622-1 (Anticaídas 22 kN)' },
  'Chaleco reflectivo': { standard: 'IRAM', certNumber: 'IRAM 3859 (Alta Visibilidad)' },
  'Mascarilla / Respirador': { standard: 'NIOSH', certNumber: 'NIOSH N95 / IRAM 3648' },
  'Careta facial': { standard: 'IRAM', certNumber: 'IRAM 3630 (Impacto)' },
  'Ropa ignífuga': { standard: 'NFPA', certNumber: 'NFPA 2112 / IRAM 3870' },
  'Botas de goma': { standard: 'IRAM', certNumber: 'IRAM 3610 / Res. 299' },
  'Guantes dieléctricos': { standard: 'IRAM', certNumber: 'IRAM 3604 (Clase 0 1000V)' },
  'Traje para frío': { standard: 'EN (Europeo)', certNumber: 'EN 342' },
  'Traje químico': { standard: 'EN (Europeo)', certNumber: 'EN 14605 / Tipo 3-4' },
  'Delantal de cuero': { standard: 'IRAM', certNumber: 'IRAM 3608 (Soldador)' },
};

// Motivos de entrega según Res. SRT 299/11
const DELIVERY_REASONS = [
  'Dotación Inicial / Ingreso',
  'Reposición por Desgaste Normal',
  'Reposición por Rotura / Daño',
  'Reposición por Vencimiento',
  'Tarea Extraordinaria / Específica',
];

// Marcas comunes en Argentina para agilizar la carga
const COMMON_BRANDS = [
  '3M', 'Libus', 'MSA', 'Steelpro', 'Ombú', 'Voran', 'Funcional',
  'Delta Plus', 'Honeywell', 'Petzl', 'Dupont', 'Carboflex', 'Venitex'
];

// Configuración visual de colores e iconos premium para cada tipo de EPP
const EPP_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  'Casco de seguridad': { icon: HardHat, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'Calzado de seguridad': { icon: Footprints, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  'Guantes de trabajo': { icon: Hand, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  'Lentes de seguridad': { icon: Glasses, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  'Protector auditivo': { icon: Ear, color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
  'Arnés de seguridad': { icon: Shield, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  'Chaleco reflectivo': { icon: Shirt, color: '#84CC16', bg: 'rgba(132,204,22,0.12)' },
  'Mascarilla / Respirador': { icon: Wind, color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
  'Careta facial': { icon: Eye, color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  'Ropa ignífuga': { icon: Flame, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  'Botas de goma': { icon: Footprints, color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)' },
  'Rodilleras': { icon: Activity, color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
  'Faja lumbar': { icon: Activity, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  'Guantes dieléctricos': { icon: Zap, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'Traje para frío': { icon: Snowflake, color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  'Traje químico': { icon: Droplets, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  'Cofia / Redecilla': { icon: User, color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
  'Delantal de cuero': { icon: Shirt, color: '#A16207', bg: 'rgba(161,98,7,0.12)' },
  'Botiquín personal': { icon: Briefcase, color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  'Otro': { icon: HelpCircle, color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' }
};

function getPPEConfig(type: string) {
  if (EPP_CONFIG[type]) return EPP_CONFIG[type];
  const foundKey = Object.keys(EPP_CONFIG).find((key) => type.toLowerCase().includes(key.toLowerCase()));
  return foundKey ? EPP_CONFIG[foundKey] : EPP_CONFIG['Otro'];
}

// Normas de certificación aceptadas por Res. SIyC 18/25
const CERT_STANDARDS = ['IRAM', 'ISO', 'EN (Europeo)', 'ANSI', 'NIOSH', 'NFPA', 'IEC', 'Otra'];

function getDaysUntilExpiry(purchaseDate: string, lifeMonths: number | string) {
  if (!purchaseDate || !lifeMonths) return null;
  const expiry = new Date(purchaseDate);
  expiry.setMonth(expiry.getMonth() + Number(lifeMonths));
  return Math.ceil(((expiry as any) - (new Date() as any)) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0) return (
    <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-[0.68rem] font-black flex items-center gap-1 border border-red-500/20">
      <TriangleAlert size={11} /> VENCIDO
    </span>
  );

  if (days <= 30) return (
    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[0.68rem] font-black flex items-center gap-1 border border-amber-500/20">
      <Clock size={11} /> {days}d restantes
    </span>
  );

  return (
    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[0.68rem] font-black flex items-center gap-1 border border-emerald-500/20">
      <CheckCircle size={11} /> Vigente · {days}d
    </span>
  );
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
  id: '',
  type: '',
  custom: '',
  responsible: '',
  workerDni: '',
  puesto: '',
  company: '',
  deliveryReason: 'Dotación Inicial / Ingreso',
  size: '',
  brand: '',
  model: '',
  quantity: '1',
  purchaseDate: getTodayDate(),
  lifeMonths: '12',
  certStandard: '',
  certNumber: '',
  trained: true,
  notes: '',
  signature: null as string | null,
  addedAt: ''
};

export default function PPETracker(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const [items, setItems] = useState<PPEItem[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedEppCategory, setSelectedEppCategory] = useState<string>('todos');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptFilterWorker, setReceiptFilterWorker] = useState<string>('all');
  const [receiptMeta, setReceiptMeta] = useState({
    razonSocial: '',
    cuit: '',
    direccion: '',
    localidad: '',
    trabajadorNombre: '',
    trabajadorDni: '',
    puestoTrabajo: '',
    observaciones: ''
  });
  const [showQrSignModal, setShowQrSignModal] = useState(false);
  const [workerSignature, setWorkerSignature] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);

  // Cargar perfil y empresa por defecto
  useEffect(() => {
    try {
      const saved = localStorage.getItem('personalData');
      if (saved) {
        const pd = JSON.parse(saved);
        if (pd.company && !form.company) {
          setForm(prev => ({ ...prev, company: pd.company }));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    setItems(safeGetLocalStorage<PPEItem[]>('ppe_items', []));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isFormVisible]);

  // Lista de trabajadores registrados previamente para sugerencias rápidas
  const existingWorkers = useMemo(() => {
    const map = new Map<string, { name: string; dni: string; puesto: string; company?: string }>();
    items.forEach(i => {
      if (i.responsible && !map.has(i.responsible.toLowerCase().trim())) {
        map.set(i.responsible.toLowerCase().trim(), {
          name: i.responsible,
          dni: i.workerDni || '',
          puesto: i.puesto || '',
          company: i.company || ''
        });
      }
    });
    return Array.from(map.values());
  }, [items]);

  const save = async (updated: PPEItem[]) => {
    setItems(updated);
    localStorage.setItem('ppe_items', JSON.stringify(updated));
    await syncCollection('ppe_items', updated);
  };

  const handleSelectEPP = (t: string) => {
    const suggestedLife = OFFICIAL_PPE_USEFUL_LIFE[t];
    const suggestedNorm = SUGGESTED_STANDARDS[t];
    setForm(prev => ({
      ...prev,
      type: t,
      lifeMonths: suggestedLife ? String(suggestedLife) : prev.lifeMonths || '12',
      certStandard: prev.certStandard || suggestedNorm?.standard || 'IRAM',
      certNumber: prev.certNumber || suggestedNorm?.certNumber || '',
    }));
  };

  const handleWorkerNameChange = (name: string) => {
    const match = existingWorkers.find(w => w.name.toLowerCase() === name.toLowerCase().trim());
    if (match) {
      setForm(prev => ({
        ...prev,
        responsible: name,
        workerDni: match.dni || prev.workerDni,
        puesto: match.puesto || prev.puesto,
        company: match.company || prev.company
      }));
    } else {
      setForm(prev => ({ ...prev, responsible: name }));
    }
  };

  // Cálculo en vivo de la fecha de vencimiento estimada
  const calculatedExpiry = useMemo(() => {
    if (!form.purchaseDate || !form.lifeMonths) return null;
    const expiry = new Date(form.purchaseDate);
    expiry.setMonth(expiry.getMonth() + Number(form.lifeMonths));
    const diffDays = Math.ceil(((expiry as any) - (new Date() as any)) / (1000 * 60 * 60 * 24));
    return {
      dateFormatted: expiry.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }),
      isoDate: expiry.toISOString().split('T')[0],
      diffDays,
      isExpired: diffDays < 0,
      isExpiringSoon: diffDays >= 0 && diffDays <= 30
    };
  }, [form.purchaseDate, form.lifeMonths]);

  const handleAdd = async (keepWorker: boolean = false) => {
    if (!form.type) {
      toast.error('Seleccioná un tipo de EPP');
      return;
    }
    if (!form.responsible?.trim()) {
      toast.error('Ingresá el nombre del trabajador receptor');
      return;
    }
    if (!form.purchaseDate) {
      toast.error('Ingresá la fecha de entrega');
      return;
    }

    const newItem: PPEItem = {
      id: form.id || Date.now(),
      type: form.type === 'Otro' ? form.custom || 'Otro' : form.type,
      responsible: form.responsible.trim(),
      workerDni: form.workerDni?.trim() || '',
      puesto: form.puesto?.trim() || '',
      company: form.company?.trim() || '',
      deliveryReason: form.deliveryReason || 'Dotación Inicial / Ingreso',
      size: form.size?.trim() || '',
      brand: form.brand?.trim() || '',
      model: form.model?.trim() || '',
      quantity: form.quantity || '1',
      purchaseDate: form.purchaseDate,
      lifeMonths: Number(form.lifeMonths) || 12,
      certStandard: form.certStandard || 'IRAM',
      certNumber: form.certNumber?.trim() || '',
      trained: form.trained ?? true,
      notes: form.notes?.trim() || '',
      signature: form.signature || workerSignature || null,
      addedAt: form.id ? form.addedAt : new Date().toISOString()
    };

    const updated = [newItem, ...items.filter(i => i.id !== newItem.id)];
    await save(updated);

    toast.success(form.id ? '¡EPP actualizado con éxito!' : '¡Entrega de EPP registrada con éxito!');

    if (keepWorker) {
      // Dejar precargado el mismo trabajador para seguir sumando EPPs (ej: calzado, luego arnés, etc.)
      setForm({
        ...EMPTY_FORM,
        responsible: form.responsible,
        workerDni: form.workerDni,
        puesto: form.puesto,
        company: form.company,
        purchaseDate: form.purchaseDate,
      });
      setWorkerSignature(null);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    } else {
      setForm(EMPTY_FORM);
      setWorkerSignature(null);
      setIsFormVisible(false);
    }
  };

  const handleEdit = (item: any) => {
    const isStandard = EPP_TYPES.includes(item.type);
    setForm({
      ...EMPTY_FORM,
      ...item,
      type: isStandard ? item.type : 'Otro',
      custom: isStandard ? '' : item.type,
      deliveryReason: item.deliveryReason || 'Dotación Inicial / Ingreso',
      size: item.size || '',
      trained: item.trained ?? true,
      company: item.company || '',
      notes: item.notes || '',
      signature: item.signature || null,
    });
    if (item.signature) {
      setWorkerSignature(item.signature);
    }
    setIsFormVisible(true);
  };

  const handleDelete = (id: any) => {
    save(items.filter((i) => i.id !== id));
    toast.success('EPP eliminado del inventario');
  };

  const handleExport = () => {
    const enrichedItems = items.map((item: any) => {
      const { days, expiryDate } = calculatePPEExpiryDays(item.purchaseDate || '', Number(item.lifeMonths) || 12);
      const isCritical = CRITICAL_PPE_TYPES.some((ct) => (item.type || '').toLowerCase().includes(ct.toLowerCase()));
      return {
        ...item,
        fechaVencimiento: expiryDate || '-',
        diasRestantes: days !== null ? days : '-',
        estado: days === null ? '-' : days < 0 ? 'VENCIDO' : days <= 30 ? 'POR VENCER' : 'VIGENTE',
        eppCritico: isCritical ? 'SÍ' : 'NO',
      };
    });
    downloadCSV(enrichedItems, 'ppe_tracker_res299', {
      type: 'Tipo de EPP', responsible: 'Trabajador', workerDni: 'DNI/CUIL',
      puesto: 'Puesto/Sector', company: 'Empresa', deliveryReason: 'Motivo Entrega',
      size: 'Talle', brand: 'Marca', model: 'Modelo', quantity: 'Cantidad',
      purchaseDate: 'Fecha Entrega', lifeMonths: 'Vida Útil (meses)',
      fechaVencimiento: 'Fecha Vencimiento', diasRestantes: 'Días Restantes',
      estado: 'Estado', certStandard: 'Certificación', certNumber: 'N° Certificado',
      trained: 'Capacitado Art. 3', eppCritico: 'EPP Crítico (Res. SIyC 18/25)',
    });
  };

  const handlePrintReceipt = async () => {
    setIsPrintingReceipt(true);
    const toastId = toast.loading('Preparando constancia oficial Res. SRT 299/11...');
    try {
      await new Promise((r) => setTimeout(r, 400));
      const element = document.getElementById('ppe-receipt-pdf');
      if (!element) throw new Error('No se encontró el elemento de la constancia');
      await printElementAsDocument('ppe-receipt-pdf', `Constancia_EPP_Res299_${receiptMeta.trabajadorNombre || 'Trabajador'}`, true);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('[PPETracker] Error al imprimir constancia:', err);
      toast.dismiss(toastId);
      window.print();
    } finally {
      setIsPrintingReceipt(false);
    }
  };

  const handleOpenWorkerReceipt = (workerName: string) => {
    const workerItems = items.filter((i) => i.responsible === workerName);
    const first = workerItems[0];
    try {
      const saved = localStorage.getItem('personalData');
      if (saved) {
        const pd = JSON.parse(saved);
        setReceiptMeta({
          razonSocial: pd.company || pd.name || '',
          cuit: pd.cuit || '',
          direccion: pd.address || '',
          localidad: pd.city || pd.province || '',
          trabajadorNombre: workerName || '',
          trabajadorDni: first?.workerDni || '',
          puestoTrabajo: first?.puesto || '',
          observaciones: ''
        });
      } else {
        setReceiptMeta({
          razonSocial: '',
          cuit: '',
          direccion: '',
          localidad: '',
          trabajadorNombre: workerName || '',
          trabajadorDni: first?.workerDni || '',
          puestoTrabajo: first?.puesto || '',
          observaciones: ''
        });
      }
    } catch {
      setReceiptMeta({
        razonSocial: '',
        cuit: '',
        direccion: '',
        localidad: '',
        trabajadorNombre: workerName || '',
        trabajadorDni: first?.workerDni || '',
        puestoTrabajo: first?.puesto || '',
        observaciones: ''
      });
    }
    setReceiptFilterWorker(workerName || 'all');
    setIsReceiptModalOpen(true);
  };

  // Cálculos estadísticos para el panel de salud superior
  const total = items.length;
  const expired = items.filter((i) => getDaysUntilExpiry(i.purchaseDate, i.lifeMonths) !== null && getDaysUntilExpiry(i.purchaseDate, i.lifeMonths)! < 0).length;
  const expiring = items.filter((i) => {
    const d = getDaysUntilExpiry(i.purchaseDate, i.lifeMonths);
    return d !== null && d >= 0 && d <= 30;
  }).length;
  const active = total - expired - expiring;
  const protectionScore = total > 0 ? Math.round((active + expiring) / total * 100) : 100;

  // Motor normativo Res. SRT 299/11 — evaluación de cumplimiento
  const fleetCompliance = useMemo(() => {
    if (items.length === 0) return null;
    return evaluatePPEFleetCompliance(items);
  }, [items]);

  // Filtrado de tipos de EPP en el selector visual
  const filteredEppTypes = useMemo(() => {
    if (selectedEppCategory === 'todos') return EPP_TYPES;
    return EPP_TYPES.filter(t => EPP_CATEGORY_MAP[t] === selectedEppCategory);
  }, [selectedEppCategory]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
      <div className="print:hidden">
        <ModuleFormLayout>
          <Breadcrumbs />
          <div className="mt-20">
            <PremiumHeader
              title="Control y Entrega de EPP"
              subtitle="Constancia Oficial Res. SRT 299/11 · Marcado AR Res. SIyC 18/25"
              icon={<HardHat size={36} color="#ffffff" />}
              onBack={isFormVisible ? () => setIsFormVisible(false) : undefined}
            />
          </div>

          <div className="p-4 sm:p-8 max-w-5xl mx-auto">
            {/* Segmented Tabs: Inventario vs Nueva Entrega */}
            <div className="flex gap-2 mb-6 bg-slate-200/70 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className={`flex-1 py-3 px-4 rounded-xl border-none font-extrabold text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  !isFormVisible
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shield size={18} />
                <span>Inventario Activo ({items.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFormVisible(true)}
                className={`flex-1 py-3 px-4 rounded-xl border-none font-extrabold text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  isFormVisible
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Plus size={18} />
                <span>+ Nueva Entrega de EPP</span>
              </button>
            </div>

            {/* VISTA 1: INVENTARIO */}
            {!isFormVisible ? (
              <React.Fragment>
                {/* Botonera de acciones superiores */}
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {items.length} Elementos Asignados
                  </div>
                  {items.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const saved = localStorage.getItem('personalData');
                            if (saved) {
                              const pd = JSON.parse(saved);
                              setReceiptMeta((prev) => ({
                                ...prev,
                                razonSocial: pd.company || pd.name || '',
                                cuit: pd.cuit || '',
                                direccion: pd.address || '',
                                localidad: pd.city || pd.province || ''
                              }));
                            }
                          } catch {}
                          setIsReceiptModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white border-none rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Award size={15} />
                        <span>Generar Constancia Res. 299/11</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExport}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white border-none rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Download size={15} />
                        <span>Exportar Excel / CSV</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Dashboard de estado si hay ítems */}
                {items.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 mb-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h3 className="m-0 text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <ShieldCheck size={18} className="text-emerald-500" />
                          Estado de Protección del Personal
                        </h3>
                        <p className="m-0 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          Control de vigencia técnica s/ normas IRAM y Res. SRT 299/11.
                        </p>
                      </div>

                      <div className={`px-3 py-1 rounded-full text-xs font-black tracking-wide border flex items-center gap-1 ${
                        protectionScore >= 80
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : protectionScore >= 50
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>
                        <span>{protectionScore}% PROTECCIÓN VIGENTE</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-3 text-center">
                        <div className="text-2xl font-black text-emerald-600">{active}</div>
                        <div className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Vigentes</div>
                      </div>
                      <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-3 text-center">
                        <div className="text-2xl font-black text-amber-600">{expiring}</div>
                        <div className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Por Vencer</div>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-3 text-center">
                        <div className="text-2xl font-black text-red-600">{expired}</div>
                        <div className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Vencidos</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Listado de ítems */}
                {items.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                      <HardHat size={32} />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">No hay EPPs registrados todavía</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Comenzá registrando las entregas a tus operarios para emitir la constancia oficial de la Resolución SRT 299/11.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFormVisible(true)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md border-none cursor-pointer"
                    >
                      + Cargar Primera Entrega
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {items.map((item) => {
                      const days = getDaysUntilExpiry(item.purchaseDate, item.lifeMonths);
                      const isExpired = days !== null && days < 0;
                      const config = getPPEConfig(item.type);
                      const IconComponent = config.icon;
                      const maxDays = Number(item.lifeMonths || 12) * 30.4;
                      const pct = days !== null ? Math.max(0, Math.min(100, (days / maxDays) * 100)) : 100;
                      const statusColor = isExpired ? '#ef4444' : days !== null && days <= 30 ? '#f59e0b' : '#10b981';

                      return (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                          style={{ borderLeftWidth: '5px', borderLeftColor: statusColor }}
                        >
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                              style={{ background: config.bg, borderColor: `${config.color}30`, color: config.color }}
                            >
                              <IconComponent size={22} strokeWidth={2.2} />
                            </div>

                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">
                                  {item.type}
                                </h4>
                                {item.size && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                                    Talle: {item.size}
                                  </span>
                                )}
                                <StatusBadge days={days} />
                              </div>

                              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  👤 {item.responsible} {item.workerDni ? `(${item.workerDni})` : ''}
                                </span>
                                {item.puesto && <span>💼 {item.puesto}</span>}
                                {item.brand && <span>🏷️ {item.brand} {item.model ? `· ${item.model}` : ''}</span>}
                                <span>📅 Entrega: {item.purchaseDate}</span>
                                <span>⏳ Vida útil: {item.lifeMonths}m</span>
                                {item.certStandard && (
                                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                                    ✓✓ {item.certStandard} {item.certNumber ? `(${item.certNumber})` : ''}
                                  </span>
                                )}
                              </div>

                              {/* Barra de vida útil */}
                              {days !== null && days > 0 && (
                                <div className="pt-1.5 max-w-sm">
                                  <div className="flex justify-between text-[0.65rem] text-slate-400 font-bold mb-1 uppercase">
                                    <span>Vigencia restante</span>
                                    <span>{Math.round(pct)}% ({days} días)</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: statusColor }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            {item.responsible && (
                              <button
                                type="button"
                                onClick={() => handleOpenWorkerReceipt(item.responsible)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold border-none cursor-pointer flex items-center gap-1"
                              >
                                <Award size={13} />
                                <span>Planilla 299</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold border-none cursor-pointer flex items-center gap-1"
                            >
                              <Pencil size={13} />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold border-none cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            ) : (
              /* VISTA 2: NUEVA ENTREGA DE EPP (REDISEÑADA Y COMPLETA) */
              <div className="space-y-6 animate-fade-in">
                {/* Banner de Título de la Entrega */}
                <div className="bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-blue-600/10 border border-emerald-500/20 rounded-3xl p-5 sm:p-6 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[0.7rem] font-black uppercase tracking-wider">
                        <Sparkles size={13} />
                        <span>Res. SRT 299/11 · Anexo I</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {form.id ? 'Editar Entrega de EPP' : 'Registro de Nueva Entrega de EPP'}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                        Completá la información del elemento asignado. Los datos se incorporan automáticamente a la constancia oficial legal firmada por el trabajador.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFormVisible(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      Volver
                    </button>
                  </div>
                </div>

                {/* BLOQUE 1: SELECTOR DE EPP AGRUPADO */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm">
                        1
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">
                        Selección del Elemento de Protección (EPP)
                      </h3>
                    </div>

                    {/* Selector de subcategoría para filtrar */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                      {EPP_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedEppCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-[0.7rem] font-bold whitespace-nowrap cursor-pointer border transition-all ${
                            selectedEppCategory === cat.id
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grilla visual de EPPs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {filteredEppTypes.map(t => {
                      const cfg = getPPEConfig(t);
                      const IconComp = cfg.icon;
                      const isSelected = form.type === t;

                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleSelectEPP(t)}
                          className={`relative flex flex-col items-center justify-center p-3 rounded-2xl cursor-pointer transition-all border text-center ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}

                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            <IconComp size={20} strokeWidth={2.2} />
                          </div>

                          <span className={`text-[0.72rem] leading-tight line-clamp-2 ${isSelected ? 'font-black text-emerald-700 dark:text-emerald-400' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                            {t}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Asistencia técnica del EPP seleccionado */}
                  {form.type && form.type !== 'Otro' && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={15} className="text-emerald-600" />
                        <span>
                          <strong>{form.type}</strong> seleccionado · Norma técnica sugerida: <strong>{SUGGESTED_STANDARDS[form.type]?.certNumber || 'IRAM'}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        Vida útil ref: {OFFICIAL_PPE_USEFUL_LIFE[form.type] || 12} meses
                      </span>
                    </div>
                  )}

                  {/* Si seleccionó Otro */}
                  {form.type === 'Otro' && (
                    <div className="animate-fade-in pt-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre / Descripción del EPP Especial
                      </label>
                      <input
                        type="text"
                        value={form.custom}
                        onChange={(e) => setForm({ ...form, custom: e.target.value })}
                        placeholder="Ej: Pantalla facial para arco eléctrico / Traje aluminizado"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* BLOQUE 2: DATOS DEL TRABAJADOR Y ESTABLECIMIENTO */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-sm">
                      2
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">
                      Datos del Trabajador y Establecimiento (Res. SRT 299/11)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Responsable con datalist de autocompletado */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Responsable / Trabajador Receptor *
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          list="workers-suggestions"
                          value={form.responsible}
                          onChange={(e) => handleWorkerNameChange(e.target.value)}
                          placeholder="Nombre y Apellido del operario"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                        <datalist id="workers-suggestions">
                          {existingWorkers.map((w, idx) => (
                            <option key={idx} value={w.name}>
                              {w.dni ? `DNI: ${w.dni}` : ''} {w.puesto ? `· ${w.puesto}` : ''}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* DNI */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        D.N.I. / C.U.I.L.
                      </label>
                      <input
                        type="text"
                        value={form.workerDni}
                        onChange={(e) => setForm({ ...form, workerDni: e.target.value })}
                        placeholder="Ej: 35.123.456"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Puesto / Sector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Puesto / Tarea Habitual
                      </label>
                      <input
                        type="text"
                        value={form.puesto}
                        onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                        placeholder="Ej: Soldador / Montador"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Empresa / Obra */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Empresa / Obra / Establecimiento
                      </label>
                      <div className="relative">
                        <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={form.company}
                          onChange={(e) => setForm({ ...form, company: e.target.value })}
                          placeholder="Razón Social o nombre de la obra"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Motivo de Entrega */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Motivo / Condición de Entrega (Res. SRT 299/11)
                      </label>
                      <select
                        value={form.deliveryReason}
                        onChange={(e) => setForm({ ...form, deliveryReason: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      >
                        {DELIVERY_REASONS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BLOQUE 3: DETALLES TÉCNICOS Y CERTIFICACIÓN */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
                      3
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">
                      Detalles Técnicos, Marca y Certificación Homologada
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Marca con sugerencias */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Marca / Fabricante
                      </label>
                      <input
                        type="text"
                        list="brands-suggestions"
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        placeholder="Ej: 3M, Libus, Voran, MSA"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                      <datalist id="brands-suggestions">
                        {COMMON_BRANDS.map(b => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>

                    {/* Modelo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Modelo / Especificación
                      </label>
                      <input
                        type="text"
                        value={form.model}
                        onChange={(e) => setForm({ ...form, model: e.target.value })}
                        placeholder="Ej: Milenium c/ Arnés Textil / N95"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                    </div>

                    {/* Talle / Medida */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Talle / Medida (si aplica)
                      </label>
                      <input
                        type="text"
                        value={form.size}
                        onChange={(e) => setForm({ ...form, size: e.target.value })}
                        placeholder="Ej: 42, L, 9, Universal"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                    </div>

                    {/* Cantidad Entregada */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cantidad Entregada
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={form.quantity}
                          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                          placeholder="1 unidad / 1 par"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, quantity: '1 par' })}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-200"
                        >
                          1 par
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, quantity: '1 un' })}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-200"
                        >
                          1 un
                        </button>
                      </div>
                    </div>

                    {/* Norma de Certificación */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Norma de Certificación (Res. SIyC 18/25)
                      </label>
                      <select
                        value={form.certStandard}
                        onChange={(e) => setForm({ ...form, certStandard: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      >
                        <option value="">— Seleccionar Norma —</option>
                        {CERT_STANDARDS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* N° Certificado / Sello AR */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        N° Certificado / Sello AR
                      </label>
                      <input
                        type="text"
                        value={form.certNumber}
                        onChange={(e) => setForm({ ...form, certNumber: e.target.value })}
                        placeholder="Ej: AR-2026-00123 / IRAM 3620"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Sello AR Homologado Badge */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <Award size={18} className="text-amber-600 shrink-0" />
                      <span>
                        <strong>Marcado AR Obligatorio (Res. SIyC 18/25):</strong> Los EPP deben comercializarse con sello oficial y código QR de trazabilidad vigente en 2026.
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase shrink-0">
                      Vigente 2026
                    </span>
                  </div>
                </div>

                {/* BLOQUE 4: FECHAS, VIDA ÚTIL Y VENCIMIENTO AUTOMÁTICO */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black text-sm">
                      4
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">
                      Fechas, Vida Útil y Calculadora de Vencimiento
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Fecha de Entrega */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fecha de Entrega al Trabajador *
                      </label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          value={form.purchaseDate}
                          onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Vida Útil en Meses con botones rápidos */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Vida Útil Estimada (Meses)
                      </label>
                      <div className="space-y-1.5">
                        <div className="relative">
                          <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={form.lifeMonths}
                            onChange={(e) => setForm({ ...form, lifeMonths: e.target.value })}
                            placeholder="12"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          {[6, 12, 24, 60].map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setForm({ ...form, lifeMonths: String(m) })}
                              className={`flex-1 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-all ${
                                Number(form.lifeMonths) === m
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Calculadora en vivo del Vencimiento */}
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Control de Vigencia Automática
                      </label>
                      {calculatedExpiry ? (
                        <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
                          calculatedExpiry.isExpired
                            ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                            : calculatedExpiry.isExpiringSoon
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          <div className="flex items-center justify-between text-xs font-extrabold">
                            <span>Vence: {calculatedExpiry.dateFormatted}</span>
                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded font-black bg-white/40">
                              {calculatedExpiry.isExpired ? 'Vencido' : calculatedExpiry.isExpiringSoon ? 'Por vencer' : 'Vigente'}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold mt-1">
                            {calculatedExpiry.diffDays > 0 ? `🛡️ ${calculatedExpiry.diffDays} días restantes de uso seguro` : '⚠️ Este elemento ya cumplió su vida útil recomendada'}
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-400 text-center">
                          Ingresá fecha y meses para calcular vencimiento
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BLOQUE 5: CAPACITACIÓN Y FIRMA DE RECEPCIÓN */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-black text-sm">
                      5
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">
                      Capacitación Obligatoria y Firma de Recepción (Res. SRT 299/11 Art. 3°)
                    </h3>
                  </div>

                  {/* Switch de Capacitación Obligatoria */}
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.trained}
                      onChange={(e) => setForm({ ...form, trained: e.target.checked })}
                      className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 block">
                        Constancia de Capacitación Efectiva (Art. 3° Res. SRT 299/11)
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 leading-relaxed">
                        Declaro que el trabajador fue capacitado e instruido sobre el uso correcto, colocación, mantenimiento, limpieza y limitaciones de protección de este elemento.
                      </p>
                    </div>
                  </label>

                  {/* Firma Digital del Operario */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 m-0 flex items-center gap-1.5 justify-center sm:justify-start">
                        <FileSignature size={16} className="text-blue-500" />
                        Firma Digital de Recepción del Trabajador
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                        {workerSignature || form.signature
                          ? 'Firma registrada con éxito en la constancia de entrega.'
                          : 'Podés solicitar la firma en pantalla o por código QR desde el celular del trabajador.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {workerSignature || form.signature ? (
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Firmado</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setWorkerSignature(null);
                              setForm(prev => ({ ...prev, signature: null }));
                            }}
                            className="text-xs text-red-500 hover:text-red-600 underline cursor-pointer bg-transparent border-none"
                          >
                            Borrar firma
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowQrSignModal(true)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
                        >
                          <QrCode size={15} />
                          <span>Firmar por Pantalla / QR</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Observaciones adicionales o detalle de entrega
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Ej: Se entregó con bolsa de transporte y manual de instrucciones del fabricante en idioma nacional."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* BOTONERA FINAL DE ACCIÓN */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(EMPTY_FORM);
                      setWorkerSignature(null);
                      setIsFormVisible(false);
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar y Volver al Inventario
                  </button>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleAdd(true)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 border border-slate-700 shadow-sm cursor-pointer transition-all"
                    >
                      <RefreshCw size={14} />
                      <span>Guardar y Cargar Otro EPP para este Trabajador</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdd(false)}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 border-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <ShieldCheck size={18} />
                      <span>{form.id ? 'ACTUALIZAR EPP' : 'GUARDAR ENTREGA DE EPP'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModuleFormLayout>
      </div>

      {/* Modal para emisión oficial de Constancia Res. SRT 299/11 */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 m-0">
                    Constancia Oficial Res. SRT 299/11
                  </h3>
                  <p className="text-xs text-slate-500 m-0">
                    Registro de Entrega de EPP y Ropa de Trabajo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Filtrar por Trabajador (o imprimir todos)
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold outline-none focus:border-blue-500"
                  value={receiptFilterWorker}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setReceiptFilterWorker(selected);
                    if (selected !== 'all') {
                      const matchedItem = items.find((i) => i.responsible === selected);
                      if (matchedItem) {
                        setReceiptMeta((prev) => ({
                          ...prev,
                          trabajadorNombre: matchedItem.responsible || '',
                          trabajadorDni: matchedItem.workerDni || '',
                          puestoTrabajo: matchedItem.puesto || ''
                        }));
                      }
                    }
                  }}
                >
                  <option value="all">📋 Todos los EPPs registrados ({items.length} ítems)</option>
                  {Array.from(new Set(items.map((i) => i.responsible).filter(Boolean))).map((worker) => (
                    <option key={worker} value={worker}>
                      👤 {worker} ({items.filter((i) => i.responsible === worker).length} EPPs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Razón Social Empleador
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                    value={receiptMeta.razonSocial}
                    onChange={(e) => setReceiptMeta({ ...receiptMeta, razonSocial: e.target.value })}
                    placeholder="Empresa S.A."
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    C.U.I.T. Empleador
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                    value={receiptMeta.cuit}
                    onChange={(e) => setReceiptMeta({ ...receiptMeta, cuit: e.target.value })}
                    placeholder="30-XXXXXXXX-X"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nombre del Trabajador
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                    value={receiptMeta.trabajadorNombre}
                    onChange={(e) => setReceiptMeta({ ...receiptMeta, trabajadorNombre: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    DNI / CUIL Trabajador
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                    value={receiptMeta.trabajadorDni}
                    onChange={(e) => setReceiptMeta({ ...receiptMeta, trabajadorDni: e.target.value })}
                    placeholder="35.XXX.XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Observaciones / Condiciones de Entrega
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium resize-none"
                  value={receiptMeta.observaciones || ''}
                  onChange={(e) => setReceiptMeta({ ...receiptMeta, observaciones: e.target.value })}
                  placeholder="Ej: Se entregó EPP nuevo con certificación IRAM/AR. Inducción práctica realizada según art. 3 Res. SRT 299/11."
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl text-[0.75rem] text-blue-700 dark:text-blue-300">
                📄 Se generará la constancia en formato apaisado A4 reglamentaria de la Res. SRT 299/11 lista para ser rubricada por el trabajador y el responsable técnico.
              </div>

              {workerSignature && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span><strong>¡Firma del trabajador registrada!</strong> Se adjuntó a la constancia oficial.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWorkerSignature(null)}
                    className="text-[10px] text-red-500 underline cursor-pointer bg-transparent border-0"
                  >
                    Borrar
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white shadow-xs border-none cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Eye size={15} /> Previsualizar A4
              </button>
              <button
                type="button"
                onClick={() => setShowQrSignModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs border-none cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <QrCode size={15} /> Firmar por QR
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg border-none cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Printer size={15} /> IMPRIMIR CONSTANCIA A4
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrSignModal && (
        <QRSignatureModal
          isOpen={showQrSignModal}
          onClose={() => setShowQrSignModal(false)}
          role="operator"
          roleTitle={`Constancia EPP - ${form.responsible || receiptMeta.trabajadorNombre || 'Operario'}`}
          permitId={`epp_${form.workerDni || receiptMeta.trabajadorDni || Date.now()}`}
          onSignatureReceived={(sig) => {
            setWorkerSignature(sig);
            setForm(prev => ({ ...prev, signature: sig }));
            setShowQrSignModal(false);
            toast.success('¡Firma de recepción de EPP registrada con éxito!');
          }}
        />
      )}

      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print">
          <div className="relative w-full max-w-[1050px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-800/90 select-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Award size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                    Vista Previa de Constancia Oficial A4 (Apaisado)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Resolución S.R.T. N° 299/11 • {receiptMeta.trabajadorNombre || 'Trabajador'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/70 flex justify-center">
              <div className="w-full max-w-[297mm] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
                <PPEReceiptPdfGenerator
                  items={receiptFilterWorker === 'all' ? items : items.filter((i) => i.responsible === receiptFilterWorker)}
                  receiptData={{ ...receiptMeta, workerSignature }}
                  customId="ppe-receipt-pdf-preview"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-700/80 bg-slate-800/90 flex items-center justify-between text-xs text-slate-400">
              <span>Formato oficial A4 horizontal (Landscape) • Res. SRT 299/11 y Res. SIyC 18/25</span>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ats-pdf-offscreen" id="ppe-receipt-pdf">
        <PPEReceiptPdfGenerator
          items={receiptFilterWorker === 'all' ? items : items.filter((i) => i.responsible === receiptFilterWorker)}
          receiptData={{ ...receiptMeta, workerSignature }}
        />
      </div>
    </div>
  );
}
