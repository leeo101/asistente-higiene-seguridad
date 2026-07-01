import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft, Plus, Trash2, HardHat, TriangleAlert, CheckCircle, Clock, Shield,
  Download, QrCode, ExternalLink, Info, Footprints, Hand, Glasses, Ear, Shirt,
  Wind, Eye, Flame, Activity, HelpCircle, User, Calendar, ShieldCheck, Award, X } from
'lucide-react';
import toast from 'react-hot-toast';
import { useSync } from '../contexts/SyncContext';
import { downloadCSV } from '../services/exportCsv';
import { usePaywall } from '../hooks/usePaywall';
import PPEReceiptPdfGenerator from '../components/PPEReceiptPdfGenerator';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import { ModuleFormLayout, ModuleFormSection, ModuleActionBar } from '../components/module';

const EPP_TYPES = [
'Casco de seguridad', 'Calzado de seguridad', 'Guantes de trabajo',
'Lentes de seguridad', 'Protector auditivo', 'Arnés de seguridad',
'Chaleco reflectivo', 'Mascarilla / Respirador', 'Careta facial',
'Ropa ignífuga', 'Botas de goma', 'Rodilleras', 'Otro'];


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

const EMPTY_FORM = { type: '', custom: '', responsible: '', purchaseDate: '', lifeMonths: '', certStandard: '', certNumber: '' };

export default function PPETracker(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const [items, setItems] = useState<any[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

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
      id: Date.now(),
      type: form.type === 'Otro' ? form.custom || 'Otro' : form.type,
      responsible: form.responsible,
      purchaseDate: form.purchaseDate,
      lifeMonths: form.lifeMonths || 12,
      certStandard: form.certStandard,
      certNumber: form.certNumber,
      addedAt: new Date().toISOString()
    };

    const updated = [newItem, ...items];
    await save(updated);

    toast.success('EPP registrado');
    setForm(EMPTY_FORM);
    setIsFormVisible(false);
  };

  const handleDelete = (id) => {
    save(items.filter((i) => i.id !== id));
    toast.success('EPP eliminado');
  };

  const handleExport = () => {
    downloadCSV(items, 'ppe_tracker', {
      type: 'Tipo de EPP', responsible: 'Responsable',
      purchaseDate: 'Fecha Compra/Entrega', lifeMonths: 'Vida Útil (meses)',
      certStandard: 'Certificación', certNumber: 'N° Certificado'
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



  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-[8rem]">
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
        <div className="flex gap-2">
                            <button onClick={() => requirePro(() => window.print())} style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }} className="text-white border-none rounded-lg px-4 py-2 text-xs font-extrabold cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all">
                                <span className="hidden sm:inline">IMPRIMIR RES. 299/11</span><span className="inline sm:hidden">RES 299/11</span>
                            </button>
                            <button onClick={handleExport} style={{ background: 'linear-gradient(135deg, #10b981, #047857)', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }} className="text-white border-none rounded-lg px-4 py-2 text-xs font-extrabold cursor-pointer hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1 transition-all">
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
                        <span className="text-[0.72rem] font-black uppercase text-blue-600 tracking-wide">🆕 Res. SIyC 18/25 — Vigente desde Feb 2025</span>
                    </div>
                    <p className="m-0 text-[0.78rem] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Los EPP comercializados en Argentina ahora deben contar con el <strong className="text-slate-800 dark:text-slate-200">Marcado "AR" ✓✓ + Código QR de trazabilidad</strong>.
                        Se aceptan certificaciones <strong className="text-slate-800 dark:text-slate-200">ISO, EN, ANSI, NIOSH, NFPA, IEC</strong> (ya no solo IRAM).
                        El uso obligatorio en planta sigue rigiendo por Res. SRT 299/11.
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

            {!isFormVisible ?
      <>
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
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700/50 relative overflow-hidden transition-all stagger-item border-left-width-[5px]" style={{ borderLeftColor: statusColor, animationDelay: `${index * 0.08}s` }}>
                
                                {/* Brillo sutil de fondo del estado */}
                                <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: `linear-gradient(90deg, ${statusColorLight} 0%, transparent 100%)` }} />

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
                                    
                                    <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/25 rounded-lg text-red-500 cursor-pointer shrink-0 transition-all flex items-center justify-center hover:scale-105">


                    
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>);

          })}
                </div>
        }
            
            <div className="print-only fixed left-[0] opacity-[0.01] top-[0]">
                <PPEReceiptPdfGenerator />
            </div>
            </> :

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
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'border-[2.5px] scale-[1.02] shadow-md' : 'border-[1.5px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm'}`} style={{ borderColor: isSelected ? config.color : undefined, background: isSelected ? config.bg : undefined, boxShadow: isSelected ? `0 4px 10px ${config.bg}` : undefined }}>
                      
                                                <div className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${isSelected ? 'bg-white shadow-sm' : ''}`} style={{ background: !isSelected ? config.bg : undefined, color: config.color }}>
                                                    <IconComponent size={15} strokeWidth={2.2} />
                                                </div>
                                                <span className={`text-[0.68rem] text-center leading-tight break-words ${isSelected ? 'font-extrabold text-slate-800 dark:text-slate-100' : 'font-semibold text-slate-500 dark:text-slate-400'}`}>
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
                  placeholder="Nombre del trabajador" />
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
      }
            </div>
        </ModuleFormLayout>
    </div>);

}