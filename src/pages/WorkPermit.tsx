import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ArrowLeft, Save, Plus, Trash2, Printer,
  ShieldCheck, Building2, User, Calendar,
  CheckCircle2, AlertCircle, HelpCircle, Pencil, Info, Share2,
  Users, Clock, Zap, Flame, HardHat, Construction, QrCode } from
'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import PdfSignatures from '../components/PdfSignatures';
import SignatureCanvas from '../components/SignatureCanvas';
import { usePaywall } from '../hooks/usePaywall';
import { permitTypes } from '../data/workPermits';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import CompanyLogo from '../components/CompanyLogo';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import QRModal from '../components/QRModal';
import { downloadCSV } from '../services/exportCsv';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import WorkPermitPdfGenerator from '../components/WorkPermitPdfGenerator';

export default function WorkPermit(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { syncCollection } = useSync();
  const editData = location.state?.editData;
  useDocumentTitle(editData ? 'Editar Permiso de Trabajo' : 'Permiso de Trabajo');

  const [showForm, setShowForm] = useState(!!editData);
  const [history, setHistory] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [activeLOTOs, setActiveLOTOs] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('loto_active_db');
    if (saved) setActiveLOTOs(JSON.parse(saved));
  }, []);

  // Default state
  const [formData, setFormData] = useState<any>(() => ({
    id: null,
    numeroPermiso: '',
    empresa: '',
    obra: '',
    fecha: new Date().toISOString().split('T')[0],
    tipoPermiso: permitTypes[0].id,
    validezDesde: '08:00',
    validezHasta: '18:00',
    checklist: permitTypes[0].questions.map((q, i) => ({ id: Date.now() + i, pregunta: q, estado: 'Cumple', observaciones: '' })),
    personal: [
    { id: 1, nombre: '', dni: '', firma: true }],

    eppRequeridos: ['Casco', 'Calzado de Seguridad', 'Guantes', 'Anteojos'],
    lotoId: '', // Link a LOTO activo
    observacionesGenerales: '',
    estado: 'Borrador', // 'Borrador' | 'Pendiente Supervisor' | 'Pendiente EHS' | 'Aprobado'
    firmas: {
      solicitante: null,
      supervisor: null,
      ehs: null
    },
    operatorSignature: '',
    professionalSignature: '',
    supervisorSignature: '',
    showSignatures: { operator: true, professional: true, supervisor: true }
  }));

  const [professional, setProfessional] = useState<any>({
    name: 'Profesional',
    license: '',
    signature: null,
    stamp: null
  });

  const setShowSignatures = (updater: any) => {
    setFormData((prev: any) => {
      const updated = typeof updater === 'function' ? updater(prev.showSignatures) : updater;
      return { ...prev, showSignatures: updated };
    });
  };

  const showSignatures = formData.showSignatures || { operator: true, professional: true, supervisor: true };

  const [showShare, setShowShare] = useState(false);

  // Load data for editing
  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.editData) {
      const ed = location.state.editData;
      setFormData({
        ...ed,
        operatorSignature: ed.operatorSignature || ed.firmas?.solicitante?.sign || '',
        professionalSignature: ed.professionalSignature || ed.firmas?.ehs?.sign || '',
        supervisorSignature: ed.supervisorSignature || ed.firmas?.supervisor?.sign || '',
        showSignatures: ed.showSignatures || { operator: true, professional: true, supervisor: true }
      });
      setShowForm(true);
    }
  }, [location.state]);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem('work_permits_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, [showForm]);

  // Load professional data
  useEffect(() => {
    const savedData = localStorage.getItem('personalData');
    const savedSigData = localStorage.getItem('signatureStampData');
    const legacySignature = localStorage.getItem('capturedSignature');

    let signature = legacySignature || null;
    let stamp = null;
    if (savedSigData) {
      const parsed = JSON.parse(savedSigData);
      signature = parsed.signature || signature;
      stamp = parsed.stamp || null;
    }

    if (savedData) {
      const data = JSON.parse(savedData);
      setProfessional({
        name: data.name || 'Profesional',
        license: data.license || '',
        signature: signature,
        stamp: stamp
      });
    } else {
      setProfessional((prev: any) => ({ ...prev, signature, stamp }));
    }
  }, []);

  const handleTypeChange = (typeId) => {
    const selectedType = permitTypes.find((t) => t.id === typeId);
    if (selectedType) {
      setFormData({
        ...formData,
        tipoPermiso: typeId,
        lotoId: typeId === 'electrico' || typeId === 'confinado' ? formData.lotoId : '',
        checklist: selectedType.questions.map((q, i) => ({ id: Date.now() + i, pregunta: q, estado: 'Cumple', observaciones: '' }))
      });
    }
  };

  const updateChecklist = (id, field, value) => {
    const newList = formData.checklist.map((item) =>
    item.id === id ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, checklist: newList });
  };

  const addChecklistItem = () => {
    const newItem = {
      id: Date.now(),
      pregunta: '',
      estado: 'Cumple',
      observaciones: ''
    };
    setFormData({
      ...formData,
      checklist: [...formData.checklist, newItem]
    });
  };

  const removeChecklistItem = (id) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((item) => item.id !== id)
    });
  };

  const addPersonnel = () => {
    const newId = Math.max(0, ...formData.personal.map((p) => p.id)) + 1;
    setFormData({
      ...formData,
      personal: [...formData.personal, { id: newId, nombre: '', dni: '', firma: true }]
    });
  };

  const removePersonnel = (id) => {
    if (formData.personal.length > 1) {
      setFormData({
        ...formData,
        personal: formData.personal.filter((p) => p.id !== id)
      });
    }
  };

  const updatePersonnel = (id, field, value) => {
    setFormData({
      ...formData,
      personal: formData.personal.map((p) => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const handleSave = async () => {
    if (!formData.empresa) {
      toast.error('Por favor complete el nombre de la empresa');
      return;
    }
    const historyRaw = localStorage.getItem('work_permits_history');
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    const entryId = formData.id || Date.now().toString();

    const newEntry = {
      ...formData,
      id: entryId,
      professionalName: formData.professionalName || professional.name,
      professionalLicense: formData.professionalLicense || professional.license,
      professionalSignature: formData.professionalSignature || professional.signature,
      professionalStamp: formData.professionalStamp || professional.stamp,
      createdAt: (formData as any).createdAt || new Date().toISOString()
    };

    let updated;
    if (formData.id) {
      updated = history.map((h) => h.id === entryId ? newEntry : h);
    } else {
      updated = [newEntry, ...history];
    }

    localStorage.setItem('work_permits_history', JSON.stringify(updated));
    await syncCollection('work_permits_history', updated);
    toast.success('Permiso de Trabajo guardado con éxito');
    setShowForm(false);
  };

  const handlePrint = () => requirePro(() => window.print());
  const handleShare = () => requirePro(() => setShowShare(true));

  const selectedTypeLabel = permitTypes.find((t) => t.id === formData.tipoPermiso)?.label || 'Permiso de Trabajo';

  // --- Progress tracking ---
  const wpProgressItems = [
  { label: 'Empresa', done: !!formData.empresa?.trim() },
  { label: 'Obra', done: !!formData.obra?.trim() },
  { label: 'Tipo de Permiso', done: !!formData.tipoPermiso },
  { label: 'Horario', done: !!formData.validezDesde && !!formData.validezHasta },
  { label: 'Personal autorizado', done: formData.personal.some((p) => p.nombre?.trim()) },
  { label: 'Checklist completo', done: formData.checklist.length > 0 && formData.checklist.every((c) => c.estado !== '') }];

  const wpDone = wpProgressItems.filter((p) => p.done).length;
  const wpPct = Math.round(wpDone / wpProgressItems.length * 100);
  const wpColor = wpPct === 100 ? '#10b981' : wpPct >= 66 ? '#f59e0b' : '#3b82f6';

  // Quick templates per permit type
  const QUICK_TEMPLATES = [
  { id: 'hot_work', label: 'Trabajo en Caliente', emoji: '🔥', color: '#ef4444', eppPreset: ['Casco', 'Calzado de Seguridad', 'Guantes de Cuero', 'Careta de Soldar', 'Mandil de Cuero', 'Extintor a Mano'] },
  { id: 'height', label: 'Trabajo en Altura', emoji: '⛰️', color: '#f97316', eppPreset: ['Casco', 'Calzado de Seguridad', 'Arnés de Cuerpo Completo', 'Cabo de Vida', 'Guantes', 'Anteojos'] },
  { id: 'elec', label: 'Trabajo Eléctrico', emoji: '⚡', color: '#eab308', eppPreset: ['Casco Dieléctrico', 'Guantes Dieléctricos', 'Calzado Dieléctrico', 'Anteojos', 'Herramienta Aislada'] },
  { id: 'confined', label: 'Espacio Confinado', emoji: '🕒', color: '#8b5cf6', eppPreset: ['Equipo de Respiración', 'Arnés', 'Detector de Gas', 'Radio Comunicación', 'Casco', 'Guantes'] }];


  const applyQuickTemplate = (tpl) => {
    const matched = permitTypes.find((t) => t.id === tpl.id) || permitTypes[0];
    setFormData((prev) => ({
      ...prev,
      tipoPermiso: matched.id,
      checklist: matched.questions.map((q, i) => ({ id: Date.now() + i, pregunta: q, estado: 'Cumple', observaciones: '' })),
      eppRequeridos: tpl.eppPreset
    }));
    toast.success(`Plantilla ${tpl.label} aplicada`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const updated = history.filter((item: any) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('work_permits_history', JSON.stringify(updated));
    await syncCollection('work_permits_history', updated);
    toast.success('Permiso eliminado');
    setDeleteTarget(null);
  };

  const handleExportCSV = () => {
    downloadCSV(history.map((i: any) => ({
      id: i.id, fecha: i.fecha, empresa: i.empresa, obra: i.obra,
      tipo: permitTypes.find((t) => t.id === i.tipoPermiso)?.label || 'Permiso',
      desde: i.validezDesde, hasta: i.validezHasta
    })), 'permisos_de_trabajo', {
      id: 'ID Permiso', fecha: 'Fecha', empresa: 'Empresa', obra: 'Obra',
      tipo: 'Tipo de Tarea', desde: 'Hora Inicio', hasta: 'Hora Fin'
    }, 'Reporte de Permisos');
  };

  const columns = [
  {
    header: 'Fecha',
    accessor: 'fecha',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <Calendar size={14} /> {item.fecha}
                </span>

  },
  {
    header: 'Empresa',
    accessor: 'empresa',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-500">
                        <Building2 size={16} />
                    </div>
                    <span className="font-[700]">{item.empresa}</span>
                </div>

  },
  {
    header: 'Obra',
    accessor: 'obra',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-1.5">
                    <Construction size={14} /> {item.obra}
                </span>

  },
  {
    header: 'Tipo',
    accessor: 'tipoPermiso',
    sortable: true,
    render: (item: any) =>
    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md text-[0.7rem] font-extrabold uppercase tracking-wider">
                    {permitTypes.find((t) => t.id === item.tipoPermiso)?.label || 'Permiso'}
                </span>

  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex gap-[0.4rem]">
                    <button onClick={() => {setFormData(item);setShowForm(true);}} title="Ver" className="p-[0.4rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[8px] text-[var(--color-text)] cursor-pointer"><Pencil size={15} /></button>
                    <button onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/permit/${item.id}?print=true`;setQrTarget({ text: url, title: `Permiso — ${item.empresa}` });})} title="QR" className="p-[0.4rem] bg-[rgba(139,92,246,0.08)] border-[1px_solid_rgba(139,92,246,0.2)] rounded-[8px] text-[#8b5cf6] cursor-pointer"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} title="Compartir" className="p-[0.4rem] bg-[rgba(22,163,74,0.08)] border-[1px_solid_rgba(22,163,74,0.2)] rounded-[8px] text-[#16a34a] cursor-pointer"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} className="p-[0.4rem] bg-[rgba(239,68,68,0.08)] border-[1px_solid_rgba(239,68,68,0.2)] rounded-[8px] text-[#ef4444] cursor-pointer"><Trash2 size={15} /></button>
                </div>

  }];


  return (
    <div className="container max-w-5xl pb-32">
            {deleteTarget &&
      <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl max-w-md w-[90%] text-center shadow-xl border border-slate-200 dark:border-slate-700">
                        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h3 className="m-0 mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">¿Eliminar este permiso?</h3>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg border-none bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-sm shadow-red-500/30">Eliminar</button>
                        </div>
                    </div>
                </div>
      }
            
            {!showForm ?
      <AnimatedPage>
                    <div className="mb-6">
                        <Breadcrumbs />
                    </div>

                    <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
        title="Permisos de Trabajo"
        subtitle="Gestión de Tareas Críticas y Especiales"
        icon={<ShieldCheck size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        

                    <div className="flex gap-[1rem] mb-[1.5rem] mt-[1.5rem] flex-wrap">
                        <></>
                    </div>

                    <div className="mb-6 flex gap-4 flex-wrap items-center">
                        <button onClick={() => setShowForm(true)} className="hover-lift flex items-center gap-2 bg-emerald-500 text-white border-none rounded-xl px-6 py-3 text-sm font-extrabold cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition-all">
                            <Plus size={18} /> NUEVA TAREA
                        </button>
                        {history.length > 0 &&
          <button onClick={() => requirePro(handleExportCSV)} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-sm font-extrabold cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                EXCEL
                            </button>
          }
                    </div>

                    <div className="ats-pdf-offscreen">
                        {shareItem && <WorkPermitPdfGenerator data={shareItem} id="pdf-content-list" />}
                    </div>

                    <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Permiso de Trabajo - ${shareItem?.empresa || ''}`}
          text={shareItem ? `🔐 Permiso de Trabajo\n🏗️ Empresa: ${shareItem.empresa}\n🚧 Obra: ${shareItem.obra}\n📅 Fecha: ${shareItem.fecha}` : ''}
          rawMessage={``}
          elementIdToPrint="pdf-content-list"
          fileName={`Permiso_${shareItem?.empresa || 'Trabajo'}`} />
        

                    <div className="mt-8">
                        <DataTable
            data={history}
            columns={columns}
            searchPlaceholder="Buscar por empresa, obra o tipo..."
            searchFields={['empresa', 'obra']}
            emptyMessage="No hay permisos registrados."
            emptyIcon={<ShieldCheck size={48} />} />
          
                    </div>

                    {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
                </AnimatedPage> :

      <AnimatedPage>
                    <div className="no-print mb-8">
                        <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
          title={editData ? 'Editar Permiso de Trabajo' : 'Nuevo Permiso de Trabajo'}
          subtitle="Gestión de Riesgos Especiales"
          icon={<ShieldCheck size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
          
                        <div className="flex justify-space-between items-center flex-wrap gap-[1rem] mt-[1rem]">
                            <></>
                        </div>
                    </div>
            <ShareModal
          isOpen={showShare}
          open={showShare}
          onClose={() => setShowShare(false)}
          title={`Permiso de Trabajo – ${formData.empresa}`}
          text={`📄 Permiso de Trabajo: ${selectedTypeLabel}\n🏗️ Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏰ Validez: ${formData.validezDesde} a ${formData.validezHasta}\n\nGenerado con Asistente HYS`}
          rawMessage={`📄 Permiso de Trabajo: ${selectedTypeLabel}\n🏗️ Empresa: ${formData.empresa}\n📅 Fecha: ${formData.fecha}\n⏰ Validez: ${formData.validezDesde} a ${formData.validezHasta}\n\nGenerado con Asistente HYS`}
          elementIdToPrint="pdf-content"
          fileName={`Permiso_${formData.empresa || 'Trabajo'}.pdf`} />
        

            {/* Action Bar */}
            <div className="no-print floating-action-bar">
                <button onClick={(e) => {e.preventDefault();requirePro(handleSave);}} className="btn-floating-action bg-[#36B37E] text-[#ffffff]">
                    <Save size={18} /> GUARDAR
                </button>
                <button onClick={handleShare} className="btn-floating-action bg-[#0052CC] text-[#ffffff]">
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button onClick={handlePrint} className="btn-floating-action bg-[#FF8B00] text-[#ffffff]">
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>



            {/* Quick Templates + Progress */}
            <div className="no-print mb-8 flex flex-col gap-4 p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-sm">
                <div className="flex items-center justify-end flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <span style={{ color: wpColor }} className="text-[1.3rem] font-[900]">{wpPct}%</span>
                        <span className="text-[0.72rem] font-[700] text-[var(--color-text-muted)]">{wpPct === 100 ? 'Listo ✅' : 'Completando...'}</span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-[6px] bg-[var(--color-background)] rounded-[999px] overflow-[hidden]">
                    <div style={{ width: `${wpPct}%`, background: wpColor, boxShadow: `0 0 6px ${wpColor}88` }} className="h-[100%] rounded-[999px] transition-[width_0.4s_ease]" />
                </div>

                {/* Quick Templates */}
                <div>
                    <p className="m-0 mb-2.5 text-[0.65rem] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Plantillas Rápidas por Tipo de Riesgo:</p>
                    <div className="flex gap-[0.5rem] flex-wrap">
                        {QUICK_TEMPLATES.map((tpl) =>
              <button
                key={tpl.id}
                onClick={() => applyQuickTemplate(tpl)}
                style={{

                  background: `${tpl.color}15`,
                  border: `1.5px solid ${tpl.color}40`,




                  color: tpl.color


                }}
                onMouseEnter={(e) => {(e.currentTarget as HTMLButtonElement).style.background = `${tpl.color}28`;}}
                onMouseLeave={(e) => {(e.currentTarget as HTMLButtonElement).style.background = `${tpl.color}15`;}} className="p-[0.45rem_0.85rem] rounded-[12px] text-[0.75rem] font-[800] cursor-pointer flex items-center gap-[0.4rem] transition-[all_0.2s]">
                
                                {tpl.emoji} {tpl.label}
                            </button>
              )}
                    </div>
                </div>
            </div>

            {/* Print Area */}
            <div id="pdf-content" className="bg-white text-black p-6 sm:p-10 shadow-2xl mx-auto print-area border border-slate-200 rounded-3xl print:shadow-none print:border-none w-[100%] box-sizing-[border-box]">

                {/* Header */}
                <div className="grid grid-template-columns-[1fr_2fr_1fr] items-center border-bottom-[4px_solid_#333] pb-[1.5rem] mb-[2rem] w-[100%] gap-[1.5rem]">
                    <div className="text-left">
                        <p className="m-[0] font-[700] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.05em]">Sistema de Gestión</p>
                        <p className="m-[0] font-[900] text-[0.75rem] uppercase text-[#1e293b]">Control H&S</p>
                    </div>

                    <div className="text-center">
                        <h2 className="m-[0] text-[1.2rem] font-[900] text-[var(--color-primary)] uppercase letter-spacing-[1px] line-height-[1.2]">
                            Permiso de Trabajo
                        </h2>
                        <p className="m-[4px_0_0_0] text-[0.65rem] text-[#64748b] font-[600]">{selectedTypeLabel}</p>
                    </div>

                    <div className="flex justify-end items-center gap-[10px]">
                        <div className="text-right flex flex-col">
                             <span className="text-[0.6rem] font-[800] text-[#999]">N° PERMISO</span>
                             <span className="text-[1rem] font-[900]">{formData.numeroPermiso || '____'}</span>
                        </div>
                        <CompanyLogo className="h-[40px] w-[auto] max-w-[120px] object-fit-[contain]" />
                    </div>
                </div>

                {/* Form Grid */}
                <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-8 bg-white dark:bg-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2">
                        <DocBox label="CLIENTE / EMPRESA" value={formData.empresa} onChange={(v) => setFormData({ ...formData, empresa: v })} />
                        <DocBox label="OBRA / UBICACIÓN" value={formData.obra} onChange={(v) => setFormData({ ...formData, obra: v })} borderLeft />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4">
                        <DocBox label="FECHA" value={formData.fecha} onChange={(v) => setFormData({ ...formData, fecha: v })} type="date" borderTop />
                        <DocBox label="HORA INICIO" value={formData.validezDesde} onChange={(v) => setFormData({ ...formData, validezDesde: v })} type="time" borderLeft borderTop />
                        <DocBox label="HORA FIN" value={formData.validezHasta} onChange={(v) => setFormData({ ...formData, validezHasta: v })} type="time" borderLeft borderTop />
                        <DocBox label="TIPO DE TRABAJO" borderLeft borderTop noInput>
                            <select
                  value={formData.tipoPermiso}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="no-print border-none bg-[transparent] font-[800] w-[100%] outline-[none]">

                  
                                {permitTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                            <div className="print-only font-[800]">{selectedTypeLabel}</div>
                        </DocBox>
                    </div>
                    {(formData.tipoPermiso === 'electrico' || formData.tipoPermiso === 'confinado' || formData.tipoPermiso === 'elec' || formData.tipoPermiso === 'confined') &&
            <div className="grid grid-cols-1">
                            <DocBox label="PROCEDIMIENTO LOTO VINCULADO (OPCIONAL)" borderTop noInput>
                                <select
                  value={formData.lotoId || ''}
                  onChange={(e) => setFormData({ ...formData, lotoId: e.target.value })}
                  className="no-print border-none bg-[transparent] font-[800] w-[100%] outline-[none]"
                  style={{ color: formData.lotoId ? '#16a34a' : 'inherit' }}>
                  
                                    <option value="">-- Sin LOTO vinculado --</option>
                                    {activeLOTOs.map((l) => <option key={l.id} value={l.id}>{l.equipmentName} ({l.location})</option>)}
                                </select>
                                <div className="print-only font-[800]" style={{ color: formData.lotoId ? '#16a34a' : 'inherit' }}>
                                    {formData.lotoId ? activeLOTOs.find((l) => l.id === formData.lotoId)?.equipmentName : 'No especificado'}
                                </div>
                            </DocBox>
                        </div>
            }
                </div>

                {/* Checklist Section */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-black m-0 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <ShieldCheck size={20} /> VERIFICACIÓN PREVENTIVA (CHECKLIST)
                        </h3>
                        <button className="no-print bg-blue-500 hover:bg-blue-600 text-white border-none px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-colors" onClick={addChecklistItem}>
                            + AGREGAR PREGUNTA
                        </button>
                    </div>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                        <div className="hidden sm:grid grid-cols-[2fr_100px_1.5fr_40px] bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 border-b-2 border-slate-200 dark:border-slate-700 font-extrabold text-[0.7rem] text-slate-500 dark:text-slate-400 uppercase">
                            <div>PREGUNTA / ITEM</div>
                            <div className="text-center">ESTADO</div>
                            <div>OBSERVACIONES</div>
                            <div className="no-print"></div>
                        </div>
                        {formData.checklist.map((item, idx) =>
              <div key={item.id} className={`grid grid-cols-1 sm:grid-cols-[2fr_100px_1.5fr_40px] gap-4 items-center p-4 border-b border-slate-100 dark:border-slate-800 ${idx % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-800/30" : "bg-white dark:bg-slate-800"}`}>
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase mb-1">Item/Pregunta:</span>
                                    <input
                    type="text"
                    value={item.pregunta}
                    onChange={(e) => updateChecklist(item.id, 'pregunta', e.target.value)}

                    placeholder="Descripción de la tarea o riesgo..." className="border-none bg-[transparent] w-[100%] outline-[none] font-[600] text-[0.85rem]" />
                  
                                </div>
                                <div className="flex items-center justify-between sm:justify-center">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase">Estado:</span>
                                    <div className="no-print flex gap-[5px]">
                                        <StatusBtn active={item.estado === 'Cumple'} onClick={() => updateChecklist(item.id, 'estado', 'Cumple')} label="SI" />
                                        <StatusBtn active={item.estado === 'No Cumple'} onClick={() => updateChecklist(item.id, 'estado', 'No Cumple')} label="NO" color="#FF4D4F" />
                                    </div>
                                    <div className="print-only font-[900]" style={{ color: item.estado === 'No Cumple' ? '#FF4D4F' : 'inherit' }}>{item.estado === 'Cumple' ? 'SI' : 'NO'}</div>
                                </div>
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase mb-1">Observaciones:</span>
                                    <input
                    type="text"
                    value={item.observaciones}
                    onChange={(e) => updateChecklist(item.id, 'observaciones', e.target.value)}

                    placeholder="Detalle / Sector..." className="border-none border-bottom-[1px_solid_#eee] bg-[transparent] w-[100%] outline-[none] text-[0.8rem]" />
                  
                                </div>
                                <div className="no-print text-right">
                                    <button onClick={() => removeChecklistItem(item.id)} className="bg-[transparent] border-none text-[#ff4d4f] cursor-pointer">
                                        <Trash2 size={16} />
                        </button>
                                </div>
                            </div>
              )}
                    </div>
                </div>

                {/* Personnel Section */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-black m-0 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Users size={20} /> PERSONAL AUTORIZADO
                        </h3>
                        <button className="no-print bg-blue-500 hover:bg-blue-600 text-white border-none px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-colors" onClick={addPersonnel}>
                            + AGREGAR PERSONAL
                        </button>
                    </div>
                    <div className="border-[1px_solid_#ddd] rounded-[12px] overflow-[hidden]">
                        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_40px] bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 border-b-2 border-slate-200 dark:border-slate-700 font-extrabold text-[0.7rem] text-slate-500 dark:text-slate-400 uppercase">
                            <div>NOMBRE Y APELLIDO</div>
                            <div>DNI</div>
                            <div>FIRMA</div>
                            <div></div>
                        </div>
                        {formData.personal.map((p, idx) =>
              <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_40px] gap-3 sm:items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase mb-1">Nombre:</span>
                                    <input
                    type="text"
                    value={p.nombre}
                    placeholder="Nombre Completo"
                    onChange={(e) => updatePersonnel(p.id, 'nombre', e.target.value)} className="border-none bg-[transparent] w-[100%] outline-[none] font-[600]" />

                  
                                </div>
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase mb-1">DNI:</span>
                                    <input
                    type="text"
                    value={p.dni}
                    placeholder="DNI"
                    onChange={(e) => updatePersonnel(p.id, 'dni', e.target.value)} className="border-none bg-[transparent] w-[100%] outline-[none]" />

                  
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="sm:hidden text-[0.6rem] font-bold text-blue-500 uppercase">Firma:</span>
                                    <div className="hidden sm:block w-[100%] h-[1px] bg-[#ccc]"></div>
                                </div>
                                <button className="no-print bg-[transparent] border-none text-[#ff4d4f] cursor-pointer text-right" onClick={() => removePersonnel(p.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
              )}
                    </div>
                </div>

                {/* Signatures */}
                <div className="card animate-fade-in mt-[2.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[2.5rem] box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.08)]">
                    <h3 className="mt-[0] mb-[2rem] flex items-center gap-[0.7rem] text-[var(--color-primary)] font-[900] text-[1.25rem] uppercase letter-spacing-[1.2px]">
                        <Pencil size={22} className="text-[var(--color-primary)]" /> Firmas y Aprobaciones del Permiso
                    </h3>

                    <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                        <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div className="flex gap-[1rem] flex-wrap justify-center">
                            {[
                { id: 'operator', label: 'Solicitante' },
                { id: 'professional', label: 'Gerencia EHS' },
                { id: 'supervisor', label: 'Supervisor' }].
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
                        onChange={(e) => setShowSignatures((s: any) => ({ ...s, [sig.id]: e.target.checked }))} className="none" />

                      
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

                    <div className="mb-8">
                        <PdfSignatures
                data={{
                  ...formData,
                  professionalSignature: professional.signature,
                  professionalName: professional.name,
                  professionalLicense: professional.license,
                  professionalStamp: professional.stamp
                }}
                box1={showSignatures.operator ? {
                  title: 'SOLICITANTE / OPERADOR',
                  subtitle: 'Aclaración y Firma',
                  signatureUrl: formData.operatorSignature || formData.firmas?.solicitante?.sign || null,
                  isProfessional: false
                } : null}
                box2={showSignatures.professional ? {
                  title: 'GERENCIA EHS / EMISOR',
                  subtitle: (professional.name || 'Firma y Sello H&S').toUpperCase(),
                  signatureUrl: formData.professionalSignature || professional.signature || formData.firmas?.ehs?.sign || null,
                  stampUrl: formData.professionalStamp || professional.stamp || null,
                  isProfessional: true,
                  license: professional.license
                } : null}
                box3={showSignatures.supervisor ? {
                  title: 'SUPERVISOR DE TRABAJO',
                  subtitle: 'Aprobación / Autorización',
                  signatureUrl: formData.supervisorSignature || formData.firmas?.supervisor?.sign || null,
                  isProfessional: false
                } : null} />
              
                    </div>

                    {/* Signature Tactile Drawing Pads */}
                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {showSignatures.operator &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                  onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                  initialImage={formData.operatorSignature || formData.firmas?.solicitante?.sign}
                  title="Firma de Solicitante" />
                
                            </div>
              }
                        
                        {showSignatures.professional &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                  onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                  initialImage={formData.professionalSignature || professional.signature || formData.firmas?.ehs?.sign}
                  title="Firma de Gerencia EHS" />
                
                            </div>
              }

                        {showSignatures.supervisor &&
              <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                  onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                  initialImage={formData.supervisorSignature || formData.firmas?.supervisor?.sign}
                  title="Firma de Supervisor" />
                
                            </div>
              }
                    </div>
                    
                    {/* Sello de Estado */}
                    <div className="mt-[2rem] text-center">
                         <span style={{

                border: `3px solid ${formData.estado === 'Aprobado' ? '#10b981' : formData.estado === 'Borrador' ? '#64748b' : '#f59e0b'}`,
                color: formData.estado === 'Aprobado' ? '#10b981' : formData.estado === 'Borrador' ? '#64748b' : '#f59e0b'






              }} className="inline-block p-[0.5rem_2rem] font-[900] text-[1.2rem] uppercase transform-[rotate(-5deg)] opacity-[0.8]">
                             ESTADO: {formData.estado}
                         </span>
                    </div>
                </div>

                {/* Footer Notes */}
                <PdfBrandingFooter />
            </div>
            </AnimatedPage>
      }
        </div>);

}

function StatusBtn({ active, onClick, label, color = '#36B37E' }) {
  return (
    <button
      onClick={onClick}
      style={{



        background: active ? color : 'var(--color-surface)',
        color: active ? 'white' : '#666'



      }} className="p-[4px_12px] rounded-[6px] border-[1px_solid_#ddd] text-[0.7rem] font-[800] cursor-pointer">
      
            {label}
        </button>);

}

function DocBox({ label, value = '', onChange = () => {}, type = "text", borderLeft = false, borderTop = false, noInput = false, children = null }: any) {
  return (
    <div style={{

      borderLeft: borderLeft ? '1px solid var(--color-border)' : 'none',
      borderTop: borderTop ? '1px solid var(--color-border)' : 'none'





    }} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 p-[1.2rem] flex flex-col gap-[8px] bg-[rgba(248,_250,_252,_0.4)] transition-[background_0.2s_ease]">
            <span className="text-[0.65rem] font-[900] text-[var(--color-primary)] uppercase letter-spacing-[0.5px]">{label}</span>
            {noInput ? children :
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)} className="border-none bg-[transparent] font-[800] text-[0.95rem] outline-[none] w-[100%] text-[var(--color-text)]" />


      }
        </div>);

}