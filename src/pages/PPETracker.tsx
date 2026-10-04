import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft, Plus, Trash2, HardHat, TriangleAlert, CheckCircle, Clock, Shield,
  Download, QrCode, ExternalLink, Info, Footprints, Hand, Glasses, Ear, Shirt,
  Wind, Eye, Flame, Activity, HelpCircle, User, Calendar, ShieldCheck, Award, X,
  Zap, Thermometer, Droplets, Snowflake, Beaker, Briefcase, Pencil, Tag, AlertTriangle, Printer, FileText } from
'lucide-react';
import toast from 'react-hot-toast';
import { useSync } from '../contexts/SyncContext';
import { downloadCSV } from '../services/exportCsv';
import { usePaywall } from '../hooks/usePaywall';
import PPEReceiptPdfGenerator from '../components/PPEReceiptPdfGenerator';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import { ModuleFormLayout, ModuleFormSection, ModuleActionBar } from '../components/module';
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
'Cofia / Redecilla', 'Delantal de cuero', 'Botiquín personal', 'Otro'];


// Configuración visual de colores e iconos premium para cada tipo de EPP
const EPP_CONFIG = {
  'Casco de seguridad': { icon: HardHat, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  'Calzado de seguridad': { icon: Footprints, color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  'Guantes de trabajo': { icon: Hand, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  'Lentes de seguridad': { icon: Glasses, color: '#06B6D4', bg: 'rgba(6,182,212,0.08)' },
  'Protector auditivo': { icon: Ear, color: '#14B8A6', bg: 'rgba(20,184,166,0.08)' },
  'Arnés de seguridad': { icon: Shield, color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
  'Chaleco reflectivo': { icon: Shirt, color: '#84CC16', bg: 'rgba(132,204,22,0.08)' },
  'Mascarilla / Respirador': { icon: Wind, color: '#A855F7', bg: 'rgba(168,85,247,0.08)' },
  'Careta facial': { icon: Eye, color: '#EC4899', bg: 'rgba(236,72,153,0.08)' },
  'Ropa ignífuga': { icon: Flame, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  'Botas de goma': { icon: Footprints, color: '#0EA5E9', bg: 'rgba(14,165,233,0.08)' },
  'Rodilleras': { icon: Activity, color: '#64748B', bg: 'rgba(100,116,139,0.08)' },
  'Faja lumbar': { icon: Activity, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  'Guantes dieléctricos': { icon: Zap, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  'Traje para frío': { icon: Snowflake, color: '#38BDF8', bg: 'rgba(56,189,248,0.08)' },
  'Traje químico': { icon: Droplets, color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  'Cofia / Redecilla': { icon: User, color: '#F43F5E', bg: 'rgba(244,63,94,0.08)' },
  'Delantal de cuero': { icon: Shirt, color: '#A16207', bg: 'rgba(161,98,7,0.08)' },
  'Botiquín personal': { icon: Briefcase, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  'Otro': { icon: HelpCircle, color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' }
};

function getPPEConfig(type) {
  // Buscar coincidencia exacta o por palabra, sino retornar el fallback 'Otro'
  if (EPP_CONFIG[type]) return EPP_CONFIG[type];
  const foundKey = Object.keys(EPP_CONFIG).find((key) => type.toLowerCase().includes(key.toLowerCase()));
  return foundKey ? EPP_CONFIG[foundKey] : EPP_CONFIG['Otro'];
}

// Normas de certificación aceptadas por Res. SIyC 18/25
const CERT_STANDARDS = ['IRAM', 'ISO', 'EN (Europeo)', 'ANSI', 'NIOSH', 'NFPA', 'IEC', 'Otra'];

function getDaysUntilExpiry(purchaseDate, lifeMonths) {
  if (!purchaseDate || !lifeMonths) return null;
  const expiry = new Date(purchaseDate);
  expiry.setMonth(expiry.getMonth() + Number(lifeMonths));
  return Math.ceil(((expiry as any) - (new Date() as any)) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ days }) {
  if (days === null) return null;
  if (days < 0) return (
    <span className="bg-[rgba(239,68,68,0.12)] text-[#ef4444] p-[0.25rem_0.7rem] rounded-[20px] text-[0.7rem] font-[800] flex items-center gap-[0.3rem] border-[1px_solid_rgba(239,68,68,0.2)]">
            <TriangleAlert size={11} /> VENCIDO
        </span>);

  if (days <= 30) return (
    <span className="bg-[rgba(245,158,11,0.12)] text-[#f59e0b] p-[0.25rem_0.7rem] rounded-[20px] text-[0.7rem] font-[800] flex items-center gap-[0.3rem] border-[1px_solid_rgba(245,158,11,0.2)]">
            <Clock size={11} /> {days}d restantes
        </span>);

  return (
    <span className="bg-[rgba(16,185,129,0.12)] text-[#10b981] p-[0.25rem_0.7rem] rounded-[20px] text-[0.7rem] font-[800] flex items-center gap-[0.3rem] border-[1px_solid_rgba(16,185,129,0.2)]">
            <CheckCircle size={11} /> Vigente · {days}d
        </span>);

}

const EMPTY_FORM = {
  type: '',
  custom: '',
  responsible: '',
  workerDni: '',
  puesto: '',
  brand: '',
  model: '',
  quantity: '1',
  purchaseDate: '',
  lifeMonths: '',
  certStandard: '',
  certNumber: '',
  id: '',
  addedAt: ''
};

export default function PPETracker(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const [items, setItems] = useState<any[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
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
    } catch (e) {
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

  // Check if device is mobile to adjust padding
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('ppe_items');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [isFormVisible]);

  const save = async (updated) => {
    setItems(updated);
    localStorage.setItem('ppe_items', JSON.stringify(updated));
    await syncCollection('ppe_items', updated);
  };

  const handleAdd = async () => {
    if (!form.type) {toast.error('Seleccioná un tipo de EPP');return;}
    if (!form.purchaseDate) {toast.error('Ingresá la fecha de compra/entrega');return;}

    const newItem = {
      id: form.id || Date.now(),
      type: form.type === 'Otro' ? form.custom || 'Otro' : form.type,
      responsible: form.responsible,
      workerDni: form.workerDni || '',
      puesto: form.puesto || '',
      brand: form.brand || '',
      model: form.model || '',
      quantity: form.quantity || '1',
      purchaseDate: form.purchaseDate,
      lifeMonths: form.lifeMonths || 12,
      certStandard: form.certStandard,
      certNumber: form.certNumber,
      addedAt: form.id ? form.addedAt : new Date().toISOString()
    };

    const updated = [newItem, ...items.filter(i => i.id !== newItem.id)];
    await save(updated);

    toast.success(form.id ? 'EPP actualizado' : 'EPP registrado');
    setForm(EMPTY_FORM);
    setIsFormVisible(false);
  };

  const handleEdit = (item) => {
    const isStandard = EPP_TYPES.includes(item.type);
    setForm({
      ...EMPTY_FORM,
      ...item,
      type: isStandard ? item.type : 'Otro',
      custom: isStandard ? '' : item.type
    });
    setIsFormVisible(true);
  };

  const handleDelete = (id) => {
    save(items.filter((i) => i.id !== id));
    toast.success('EPP eliminado');
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
      puesto: 'Puesto/Sector', brand: 'Marca', model: 'Modelo',
      quantity: 'Cantidad', purchaseDate: 'Fecha Entrega',
      lifeMonths: 'Vida Útil (meses)', fechaVencimiento: 'Fecha Vencimiento',
      diasRestantes: 'Días Restantes', estado: 'Estado',
      certStandard: 'Certificación', certNumber: 'N° Certificado',
      eppCritico: 'EPP Crítico (Res. SIyC 18/25)',
    });
  };

  const showARStamp = form.certStandard && form.certNumber;

  // Cálculos estadísticos para el panel de salud superior
  const total = items.length;
  const expired = items.filter((i) => getDaysUntilExpiry(i.purchaseDate, i.lifeMonths) !== null && getDaysUntilExpiry(i.purchaseDate, i.lifeMonths)! < 0).length;
  const expiring = items.filter((i) => {
    const d = getDaysUntilExpiry(i.purchaseDate, i.lifeMonths);
    return d !== null && d >= 0 && d <= 30;
  }).length;
  const active = total - expired - expiring;

  // Puntuación de protección general (EPP seguros del equipo)
  const protectionScore = total > 0 ? Math.round((active + expiring) / total * 100) : 100;

  // Motor normativo Res. SRT 299/11 — evaluación de cumplimiento
  const fleetCompliance = useMemo(() => {
    if (items.length === 0) return null;
    return evaluatePPEFleetCompliance(items);
  }, [items]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-[8rem]">
      <div className="print:hidden">
        <ModuleFormLayout>
            <Breadcrumbs />
            <div className="mt-24">
                <PremiumHeader
                    title="Control de EPP"
                    subtitle="Res. SIyC 18/25 · Res. SRT 299/11"
                    icon={<HardHat size={36} color="#ffffff" />}
                    onBack={isFormVisible ? () => setIsFormVisible(false) : undefined}
                />
            </div>
            <div className="p-[2rem] max-w-[1000px] m-[0_auto]">
      

            {!isFormVisible &&
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                    <div className="flex gap-4 items-center">
                        <></>
                    </div>
                    {items.length > 0 &&
                        <div className="flex gap-2 relative z-50">
                            <button
                                type="button"
                                onClick={() => {
                                    // Pre-cargar datos del empleador desde perfil
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
                                    } catch (e) {}
                                    setIsReceiptModalOpen(true);
                                }}
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}
                                className="text-white border-none rounded-lg px-4 py-2 text-xs font-extrabold cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all relative z-50 flex items-center gap-1.5"
                            >
                                <Award size={14} />
                                <span className="hidden sm:inline">CONSTANCIA RES. 299/11</span>
                                <span className="inline sm:hidden">RES 299/11</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleExport}
                                style={{ background: 'linear-gradient(135deg, #10b981, #047857)', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}
                                className="text-white border-none rounded-lg px-4 py-2 text-xs font-extrabold cursor-pointer hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1 transition-all relative z-50"
                            >
                                <Download size={14} /> <span className="hidden sm:inline">EXCEL</span>
                            </button>
                        </div>
                    }
                </div>
      }

            {/* Banner normativa actualizada */}
            <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 mb-5 flex items-start gap-3 shadow-sm">
                <div className="mt-0.5 shrink-0">
                    <QrCode size={22} color="#2563eb" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[0.72rem] font-black uppercase text-blue-600 tracking-wide">🛡️ Res. SIyC 18/25 — PLENA VIGENCIA EN 2026</span>
                    </div>
                    <p className="m-0 text-[0.78rem] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Los EPP comercializados en Argentina deben contar con el <strong className="text-slate-800 dark:text-slate-200">Marcado "AR" ✓✓ + Código QR de trazabilidad</strong>.
                        Se aceptan certificaciones internacionales bajo normas <strong className="text-slate-800 dark:text-slate-200">ISO, EN, ANSI, NIOSH, NFPA, IEC</strong> (además de IRAM).
                        El uso obligatorio y el registro de entrega en planta sigue rigiendo por la <strong className="text-slate-800 dark:text-slate-200">Res. SRT 299/11</strong>.
                    </p>
                </div>
            </div>

            {/* 📊 Premium Safety Hub Dashboard (Siempre visible si hay EPPs) */}
            {items.length > 0 &&
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-5 px-6 mb-6 flex flex-col gap-4 shadow-sm animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h3 className="m-0 text-[1.05rem] font-extrabold text-slate-800 dark:text-slate-100">
                                Estado de Protección del Equipo
                            </h3>
                            <p className="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Monitoreo de cumplimiento de normas y vida útil.
                            </p>
                        </div>
                        
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-extrabold text-xs tracking-wide ${protectionScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : protectionScore >= 50 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                            <ShieldCheck size={13} />
                            <span>{protectionScore}% SEGURO</span>
                        </div>
                    </div>

                    {/* Barra de progreso de protección lineal */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden relative">
                        <div className="h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.4)] bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${protectionScore}%` }} />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-1">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 text-center flex flex-col items-center gap-0.5">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 mb-0.5">
                                <ShieldCheck size={14} />
                            </div>
                            <div className="text-xl font-black text-emerald-500 leading-none">{active}</div>
                            <div className="text-[0.62rem] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Vigentes</div>
                        </div>
                        
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5 text-center flex flex-col items-center gap-0.5">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 mb-0.5">
                                <Clock size={14} />
                            </div>
                            <div className="text-xl font-black text-amber-500 leading-none">{expiring}</div>
                            <div className="text-[0.62rem] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Por Vencer</div>
                        </div>
                        
                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-2.5 text-center flex flex-col items-center gap-0.5">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 text-red-500 mb-0.5">
                                <TriangleAlert size={14} />
                            </div>
                            <div className="text-xl font-black text-red-500 leading-none">{expired}</div>
                            <div className="text-[0.62rem] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Vencidos</div>
                        </div>
                    </div>
                </div>
      }

            {/* 🔬 Banner de Cumplimiento Normativo Res. SRT 299/11 */}
            {fleetCompliance && !isFormVisible && (
              <div className={`rounded-2xl py-4 px-5 mb-5 border shadow-sm animate-fade-in ${
                fleetCompliance.fleetDictamen === 'CONFORME'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : fleetCompliance.fleetDictamen === 'OBSERVADO'
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className={
                      fleetCompliance.fleetDictamen === 'CONFORME' ? 'text-emerald-500' :
                      fleetCompliance.fleetDictamen === 'OBSERVADO' ? 'text-amber-500' : 'text-red-500'
                    } />
                    <span className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                      Dictamen Res. SRT 299/11
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[0.7rem] font-black uppercase tracking-wider border ${
                    fleetCompliance.fleetDictamen === 'CONFORME'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : fleetCompliance.fleetDictamen === 'OBSERVADO'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      : 'bg-red-500/10 text-red-600 border-red-500/20'
                  }`}>
                    {fleetCompliance.fleetDictamen}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[0.7rem] font-semibold text-slate-600 dark:text-slate-400">
                  <span>👥 {fleetCompliance.totalWorkers} trabajador{fleetCompliance.totalWorkers !== 1 ? 'es' : ''}</span>
                  <span>✅ {fleetCompliance.totalVigentes} vigentes</span>
                  <span>⚠️ {fleetCompliance.totalPorVencer} por vencer</span>
                  <span>🛑 {fleetCompliance.totalVencidos} vencidos</span>
                </div>
                {fleetCompliance.totalSinCertCritica > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-[0.72rem] font-bold text-red-600">
                    <AlertTriangle size={13} />
                    {fleetCompliance.totalSinCertCritica} EPP crítico{fleetCompliance.totalSinCertCritica > 1 ? 's' : ''} sin certificación IRAM/ISO — Res. SIyC 18/25
                  </div>
                )}
              </div>
            )}

            {/* Segmented Tabs */}
            <div className="flex gap-1.5 mb-6 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                <button
          onClick={() => setIsFormVisible(false)}
          style={!isFormVisible ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 20px rgba(16,185,129,0.3)', color: '#fff' } : {}}
          className={`flex-1 py-3 px-4 rounded-xl border-none font-extrabold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${!isFormVisible ? '' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
          
                    <Shield size={18} /> Inventario
                </button>
                <button
          onClick={() => setIsFormVisible(true)}
          style={isFormVisible ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 20px rgba(16,185,129,0.3)', color: '#fff' } : {}}
          className={`flex-1 py-3 px-4 rounded-xl border-none font-extrabold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${isFormVisible ? '' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
          
                    <Plus size={18} /> Nueva Entrega
                </button>
            </div>

            {!isFormVisible ? (
      <React.Fragment>
                    {/* List */}
                    {items.length === 0 ?
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
                            <Shield size={48} className="mx-auto block mb-4 opacity-15" />
                            <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">Sin EPPs registrados.</p>
                            <p className="text-sm">Registrá los elementos de protección del equipo para controlar sus vencimientos.</p>
                        </div> :

        <div className="flex flex-col gap-3">
                    {items.map((item, index) => {
            const days = getDaysUntilExpiry(item.purchaseDate, item.lifeMonths);
            const isExpired = days !== null && days < 0;
            const config = getPPEConfig(item.type);
            const IconComponent = config.icon;

            // Cálculos para la "Barra de Vida Útil"
            const maxDays = Number(item.lifeMonths || 12) * 30.4;
            const pct = days !== null ? Math.max(0, Math.min(100, days / maxDays * 100)) : 100;

            // Color de estado correspondiente
            const statusColor = isExpired ? '#ef4444' : days !== null && days <= 30 ? '#f59e0b' : '#10b981';
            const statusColorLight = isExpired ? 'rgba(239,68,68,0.1)' : days !== null && days <= 30 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700/50 relative overflow-hidden transition-all stagger-item border-left-width-[6px]" style={{ borderLeftColor: statusColor, borderColor: config.color, animationDelay: `${index * 0.08}s` }}>
                
                                {/* Brillo sutil de fondo del estado y del EPP */}
                                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `linear-gradient(135deg, ${config.bg} 0%, transparent 100%)` }} />

                                <div className="flex justify-between items-start gap-4 flex-wrap relative z-10">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                                            {/* Icono circular del tipo de EPP */}
                                            <div style={{
                        background: config.bg,
                        color: config.color,
                        border: `1px solid rgba(var(--color-primary-rgb), 0.08)`
                      }} className="flex items-center justify-center w-[28px] h-[28px] rounded-[50%]">
                                                <IconComponent size={15} strokeWidth={2.2} />
                                            </div>
                                            <strong className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-heading">
                                                {item.type}
                                            </strong>
                                            <StatusBadge days={days} />
                                        </div>

                                        <div className="text-xs text-slate-500 dark:text-slate-400 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 mt-2">
                                            {item.responsible &&
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                                                    👤 <span className="opacity-75">Responsable:</span> {item.responsible}
                                                </span>
                      }
                                            <span className="flex items-center gap-1.5">
                                                📅 <span className="opacity-75">Entrega:</span> {new Date(item.purchaseDate).toLocaleDateString('es-AR')}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                ⏳ <span className="opacity-75">Vida útil:</span> {item.lifeMonths} meses
                                            </span>
                                            {item.certStandard &&
                      <span className="flex items-center gap-1 text-blue-600 font-bold">
                                                    ✓✓ {item.certStandard}{item.certNumber ? ` · ${item.certNumber}` : ''}
                                                </span>
                      }
                                        </div>

                                        {/* 📊 Barra de progreso de Vida Útil Restante */}
                                        {days !== null && days > 0 &&
                    <div className="mt-3.5 max-w-[380px]">
                                                <div className="flex justify-between text-[0.65rem] text-slate-500 font-bold mb-1 uppercase tracking-wider">
                                                    <span>Vida útil restante</span>
                                                    <span>{Math.round(pct)}% ({days} días)</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: statusColor }} />
                                                </div>
                                            </div>
                    }
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} className="shrink-0 self-center">
                                        {item.responsible && (
                                          <button
                                              onClick={() => handleOpenWorkerReceipt(item.responsible)}
                                              title="Generar constancia Res. 299/11 de este trabajador"
                                              style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '4px 8px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                              <Award size={12} /> Planilla 299
                                          </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(item)}
                                            title="Ver / Editar EPP"
                                            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Pencil size={12} /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            title="Eliminar EPP"
                                            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Trash2 size={12} /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>);

          })}
                </div>
          }
            </React.Fragment>
      ) : (

      <div className="animate-fade-in">
                    <ModuleFormSection title="Registro de Nuevo EPP" icon={<Plus size={20} />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 🪖 EPP Visual Grid Selector */}
                            <div className="col-span-full mb-1">
                                <label className="block mb-2 font-bold text-sm text-slate-800 dark:text-slate-200">
                                    Tipo de EPP
                                </label>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 max-h-52 overflow-y-auto p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 slim-scrollbar">
                                    {EPP_TYPES.map((t) => {
                  const config = getPPEConfig(t);
                  const IconComponent = config.icon;
                  const isSelected = form.type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const suggestedLife = OFFICIAL_PPE_USEFUL_LIFE[t];
                        setForm({ ...form, type: t, ...(suggestedLife && !form.lifeMonths ? { lifeMonths: String(suggestedLife) } : {}) });
                      }}
                      className={`relative flex flex-col items-center justify-center gap-2 py-3 px-1.5 rounded-xl cursor-pointer transition-all duration-300 border-[2px] overflow-hidden ${isSelected ? 'scale-[1.02] z-10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'}`} 
                      style={{ 
                          borderColor: isSelected ? config.color : undefined, 
                          backgroundColor: isSelected ? config.bg : undefined,
                          boxShadow: isSelected ? `0 6px 16px -4px ${config.color}50` : undefined
                      }}>
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300`} 
                                                     style={{ 
                                                         backgroundColor: isSelected ? config.color : config.bg, 
                                                         color: isSelected ? '#ffffff' : config.color,
                                                         boxShadow: isSelected ? `0 2px 6px ${config.color}80` : undefined
                                                     }}>
                                                    <IconComponent size={16} strokeWidth={isSelected ? 2.5 : 2} />
                                                </div>
                                                <span className={`text-[0.68rem] text-center leading-tight break-words px-1 z-10 ${isSelected ? 'font-extrabold' : 'font-semibold text-slate-500 dark:text-slate-400'}`}
                                                      style={{ color: isSelected ? config.color : undefined }}>
                                                    {t}
                                                </span>
                                            </button>);

                })}
                                </div>
                            </div>
                            
                            {form.type === 'Otro' &&
            <div className="col-span-full animate-fade-in">
                                    <label className="font-bold text-sm mb-1 block">Descripción del EPP Especial</label>
                                    <div className="relative">
                                        <Info size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <input
                    className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                    value={form.custom}
                    onChange={(e) => setForm({ ...form, custom: e.target.value })}
                    placeholder="Ej: Pantalla de soldadura fotosensible" />
                                    </div>
                                </div>
            }
                            
                            <div>
                                <label className="font-bold text-sm mb-1 block">Responsable (Trabajador)</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                  className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                  value={form.responsible}
                  onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                  placeholder="Nombre y Apellido" />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-sm mb-1 block">DNI / CUIL del Trabajador</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                  className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                  value={form.workerDni}
                  onChange={(e) => setForm({ ...form, workerDni: e.target.value })}
                  placeholder="Ej: 35.123.456" />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-sm mb-1 block">Puesto / Sector</label>
                                <div className="relative">
                                    <Briefcase size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                  className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                  value={form.puesto}
                  onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                  placeholder="Ej: Operario de Soldadura / Mantenimiento" />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-sm mb-1 block">Marca / Fabricante</label>
                                <div className="relative">
                                    <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                  className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Ej: 3M, Libus, MSA, Steelpro" />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-sm mb-1 block">Modelo / Tipo</label>
                                <div className="relative">
                                    <Tag size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                  className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Ej: Con visor tonalizado / N95 / Dieléctrico" />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-sm mb-1 block">Cantidad Entregada</label>
                                <div className="relative">
                                    <CheckCircle size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                  className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="1 par / 1 unidad" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="font-bold text-sm mb-1 block">Fecha de compra / entrega</label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                  className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
                                </div>
                            </div>
                            
                            <div>
                                <label className="font-bold text-sm mb-1 block">Vida útil (meses)</label>
                                <div className="relative">
                                    <Clock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                    className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                    type="number"
                    min="1"
                    max="120"
                    value={form.lifeMonths}
                    onChange={(e) => setForm({ ...form, lifeMonths: e.target.value })}
                    placeholder="12" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="font-bold text-sm mb-1 block">Norma de Certificación</label>
                                <div className="relative">
                                    <ShieldCheck size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <select
                    className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors appearance-none"
                    value={form.certStandard}
                    onChange={(e) => setForm({ ...form, certStandard: e.target.value })}>
                    
                                        <option value="">— Seleccioná —</option>
                                        {CERT_STANDARDS.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className={form.certStandard ? '' : 'col-span-full'}>
                                <label className="font-bold text-sm mb-1 block">N° de Certificado / Sello AR</label>
                                <div className="relative">
                                    <QrCode size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                    className="w-full pl-[2.8rem] pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                    value={form.certNumber}
                    onChange={(e) => setForm({ ...form, certNumber: e.target.value })}
                    placeholder="Ej: AR-2025-001234" />
                                </div>
                            </div>

                            {showARStamp &&
            <div className="col-span-full bg-gradient-to-br from-amber-500/5 to-blue-500/5 border border-dashed border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 animate-fade-in shadow-sm">
                                    <div className="shrink-0 w-12 h-12 rounded-full bg-[radial-gradient(circle,#fcd34d_0%,#d97706_100%)] border-2 border-white shadow-[0_0_12px_rgba(217,119,6,0.3),inset_0_0_6px_rgba(255,255,255,0.5)] flex flex-col items-center justify-center text-amber-900 font-heading text-[0.5rem] font-black tracking-widest relative overflow-hidden">
                                        <Award size={14} strokeWidth={2.5} className="-mb-[1px]" />
                                        <span>CONFORME</span>
                                        <span className="text-[0.35rem] opacity-85">Sello AR</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="m-0 text-[0.78rem] font-extrabold text-amber-700 flex items-center gap-1">
                                            <CheckCircle size={12} /> Marcado AR Homologado
                                        </h4>
                                        <p className="m-0 mt-0.5 text-[0.7rem] text-slate-500 dark:text-slate-400 leading-tight">
                                            Este EPP cumple las directivas de trazabilidad y QR exigidas por la **Res. SIyC 18/25**.
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100 shadow-sm animate-pulse">
                                        <QrCode size={18} strokeWidth={2.2} />
                                    </div>
                                </div>
            }
                        </div>
                    </ModuleFormSection>
                    <div className="mt-12 flex justify-center">
                        <button
                            type="button"
                            onClick={handleAdd}
                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}
                            className="flex items-center gap-2 px-10 py-3.5 rounded-full font-extrabold shadow-md transition-all hover:scale-105 active:scale-95 text-white border-none cursor-pointer"
                        >
                            <ShieldCheck size={20} />
                            GUARDAR EPP
                        </button>
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
          roleTitle={`Constancia EPP - ${receiptMeta.trabajadorNombre || 'Operario'}`}
          permitId={`epp_${receiptMeta.trabajadorDni || Date.now()}`}
          onSignatureReceived={(sig) => {
            setWorkerSignature(sig);
            setShowQrSignModal(false);
            toast.success('¡Firma de recepción de EPP recibida y rubricada!');
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