import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  ArrowLeft, Save, Plus, Trash2, Printer, Download,
  ShieldCheck, Building2, User, Calendar,
  CheckCircle2, AlertCircle, HelpCircle, Pencil, Info, Share2,
  Users, Clock, Zap, Flame, HardHat, Construction, QrCode, UserCheck } from
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
import QRSignatureModal from '../components/QRSignatureModal';
import { downloadCSV } from '../services/exportCsv';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import WorkPermitPdfGenerator from '../components/WorkPermitPdfGenerator';
import { validateWorkerMedicalStatus } from '../utils/workerValidation';

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
  const [filterType, setFilterType] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [activeLOTOs, setActiveLOTOs] = useState<any[]>([]);
  const [showLegajosModal, setShowLegajosModal] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);
  const [qrSignatureModal, setQrSignatureModal] = useState<{
    isOpen: boolean;
    role: 'operator' | 'professional' | 'supervisor';
    roleTitle: string;
  }>({
    isOpen: false,
    role: 'operator',
    roleTitle: 'Solicitante / Operador'
  });

  const handleQRSignatureReceived = (sigData: string) => {
    setFormData((prev: any) => {
      if (qrSignatureModal.role === 'professional') {
        return { ...prev, professionalSignature: sigData };
      }
      if (qrSignatureModal.role === 'supervisor') {
        return { ...prev, supervisorSignature: sigData };
      }
      return { ...prev, operatorSignature: sigData };
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('loto_active_db');
    if (saved) setActiveLOTOs(JSON.parse(saved));
  }, []);

  const openLegajosModal = () => {
    try {
      const rawLegajos = localStorage.getItem('legajos_cache') || localStorage.getItem('legajos_db') || '[]';
      const rawMedical = localStorage.getItem('ehs_medical_db') || localStorage.getItem('medical_aptitudes_db') || '[]';
      const rawContractors = localStorage.getItem('contractors_matrix_workers') || '[]';

      const legajos = JSON.parse(rawLegajos);
      const medical = JSON.parse(rawMedical);
      const contractors = JSON.parse(rawContractors);

      const map = new Map();
      legajos.forEach((item: any) => {
        const dni = item.dni || item.documento;
        if (dni) {
          map.set(String(dni), {
            dni: String(dni),
            nombre: item.name || item.nombre || `${item.apellido || ''} ${item.nombre || ''}`.trim(),
            medicalExpiry: item.medicalExpiry || item.vencimientoApto
          });
        }
      });

      medical.forEach((item: any) => {
        const dni = item.workerDni || item.dni;
        if (dni && !map.has(String(dni))) {
          map.set(String(dni), {
            dni: String(dni),
            nombre: item.workerName || item.nombre,
            medicalExpiry: item.expirationDate || item.vencimiento
          });
        }
      });

      contractors.forEach((item: any) => {
        const dni = item.dni;
        if (dni && !map.has(String(dni))) {
          map.set(String(dni), {
            dni: String(dni),
            nombre: item.workerName || item.nombre,
            medicalExpiry: item.aptoMedicoDate
          });
        }
      });

      const list = Array.from(map.values());
      if (list.length === 0) {
        toast.error('No se encontraron legajos registrados. Puedes ingresar personal manualmente.');
      } else {
        setAvailableWorkers(list);
        setShowLegajosModal(true);
      }
    } catch {
      toast.error('Error al cargar la nómina de trabajadores.');
    }
  };

  const selectWorkerFromModal = (worker: any) => {
    const exists = formData.personal.some((p: any) => p.dni && String(p.dni).trim() === String(worker.dni).trim());
    if (exists) {
      toast.error('El trabajador ya está agregado en la lista.');
      return;
    }
    setFormData((prev: any) => ({
      ...prev,
      personal: [
        ...prev.personal.filter((p: any) => p.nombre.trim() !== '' || p.dni.trim() !== ''),
        { id: Date.now(), nombre: worker.nombre, dni: worker.dni, firma: true }
      ]
    }));
    toast.success(`Agregado: ${worker.nombre}`);
  };

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
    render: (item: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => { setFormData(item); setShowForm(true); }}
          title="Editar Permiso"
          style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Pencil size={12} /> Editar
        </button>
        <button
          onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/permit/${item.id}?print=true`; setQrTarget({ text: url, title: `Permiso — ${item.empresa}` }); })}
          title="Ver Código QR"
          style={{ backgroundColor: '#8b5cf6', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <QrCode size={12} /> QR
        </button>
        <button
          onClick={() => requirePro(() => setShareItem(item))}
          title="Exportar PDF / Compartir"
          style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Share2 size={12} /> PDF
        </button>
        <button
          onClick={() => setDeleteTarget(item.id)}
          title="Eliminar Permiso"
          style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Trash2 size={12} /> Eliminar
        </button>
      </div>
    )
  }];


  return (
    <div className="container max-w-5xl pb-32">
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl max-w-md w-[90%] text-center shadow-xl border border-slate-200 dark:border-slate-700">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="m-0 mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">¿Eliminar este permiso de trabajo?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Esta acción eliminará el registro permanentemente.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-bold text-xs cursor-pointer">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg border-none bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-sm text-xs cursor-pointer">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {!showForm ? (
        <AnimatedPage>
          <div className="mb-6">
            <Breadcrumbs />
          </div>

          <PremiumHeader
            onBack={showForm ? () => setShowForm(false) : undefined}
            title="Permisos de Trabajo"
            subtitle="Gestión de Tareas Críticas y Permisos Especiales (Res. 311/03 / SRT)"
            icon={<ShieldCheck size={32} color="#ffffff" />}
            color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
          />

          {/* Tarjetas Resumen KPI Estilo Aptitudes Médicas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div
              onClick={() => setFilterType('all')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400'
              }`}>
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Permisos</span>
                <ShieldCheck size={18} />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{history.length}</div>
            </div>

            <div
              onClick={() => setFilterType('aprobado')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                filterType === 'aprobado'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
              }`}>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Permisos Aprobados</span>
                <CheckCircle2 size={18} />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {history.filter((h: any) => h.estado === 'Aprobado').length}
              </div>
            </div>

            <div
              onClick={() => setFilterType('pendiente')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                filterType === 'pendiente'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-amber-400'
              }`}>
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Pendientes / Borrador</span>
                <Clock size={18} />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {history.filter((h: any) => h.estado !== 'Aprobado').length}
              </div>
            </div>

            <div
              onClick={() => setFilterType('criticos')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                filterType === 'criticos'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-md'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-rose-400'
              }`}>
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Tareas Críticas</span>
                <Flame size={18} />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {history.filter((h: any) => ['altura', 'fuego', 'confinado', 'electrico'].includes(h.tipoPermiso)).length}
              </div>
            </div>
          </div>

          {/* Toolbar con Botones de Filtro Vibrantes */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {[
                { id: 'all', label: 'Todos los Permisos', bg: '#2563eb', activeBg: '#1d4ed8' },
                { id: 'altura', label: '🧗 Altura', bg: '#dc2626', activeBg: '#b91c1c' },
                { id: 'fuego', label: '🔥 Trabajo en Caliente', bg: '#ea580c', activeBg: '#c2410c' },
                { id: 'electrico', label: '⚡ Eléctrico / LOTO', bg: '#d97706', activeBg: '#b45309' },
                { id: 'confinado', label: '📦 Espacio Confinado', bg: '#9333ea', activeBg: '#7e22ce' },
                { id: 'aprobado', label: '✅ Aprobados', bg: '#059669', activeBg: '#047857' }
              ].map((tab) => {
                const isSelected = filterType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id)}
                    style={{
                      backgroundColor: isSelected ? tab.activeBg : tab.bg,
                      color: '#ffffff',
                      boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 6px rgba(0,0,0,0.12)',
                      transform: isSelected ? 'scale(1.04)' : 'none',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => requirePro(handleExportCSV)}
                style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none' }}
                className="px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-colors cursor-pointer">
                <Download size={16} /> Exportar Excel / CSV
              </button>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none' }}
                className="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-emerald-700 transition-colors cursor-pointer">
                <Plus size={16} /> Nueva Tarea
              </button>
            </div>
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
            fileName={`Permiso_${shareItem?.empresa || 'Trabajo'}`}
          />

          <div className="mt-4">
            <DataTable
              data={history.filter((item: any) => {
                if (filterType === 'all') return true;
                if (filterType === 'aprobado') return item.estado === 'Aprobado';
                if (filterType === 'pendiente') return item.estado !== 'Aprobado';
                if (filterType === 'criticos') return ['altura', 'fuego', 'confinado', 'electrico'].includes(item.tipoPermiso);
                return item.tipoPermiso === filterType;
              })}
              columns={columns}
              searchPlaceholder="Buscar por empresa, obra o tipo..."
              searchFields={['empresa', 'obra']}
              emptyMessage="No hay permisos registrados."
              emptyIcon={<ShieldCheck size={48} />}
            />
          </div>

          {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}
        </AnimatedPage>
      ) : (

      <AnimatedPage>
                    <div className="no-print mb-8">
                        <PremiumHeader onBack={showForm ? () => {setShowForm(false);} : undefined}
          title={editData ? 'Editar Permiso de Trabajo' : 'Nuevo Permiso de Trabajo'}
          subtitle="Gestión de Riesgos Especiales"
          icon={<ShieldCheck size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
          
                        <div className="flex justify-between items-center flex-wrap gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                                style={{ backgroundColor: '#1e293b', color: '#ffffff' }}
                            >
                                <ArrowLeft size={16} /> VOLVER AL LISTADO
                            </button>
                            <div className="flex items-center gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wide"
                                    style={{ backgroundColor: '#ea580c', color: '#ffffff' }}
                                >
                                    <Printer size={16} /> IMPRIMIR PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wide"
                                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                >
                                    <Share2 size={16} /> COMPARTIR
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); requirePro(handleSave); }}
                                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wide"
                                    style={{ backgroundColor: '#059669', color: '#ffffff' }}
                                >
                                    <Save size={16} /> GUARDAR PERMISO
                                </button>
                            </div>
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
              fileName={`Permiso_${formData.empresa || 'Trabajo'}.pdf`}
            />

            {/* Action Bar Flotante */}
            <div className="no-print floating-action-bar flex gap-3">
                <button
                    onClick={(e) => { e.preventDefault(); requirePro(handleSave); }}
                    className="btn-floating-action flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs text-white shadow-xl hover:scale-105 transition-all cursor-pointer"
                    style={{ backgroundColor: '#059669', color: '#ffffff' }}
                >
                    <Save size={18} /> GUARDAR
                </button>
                <button
                    onClick={handleShare}
                    className="btn-floating-action flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs text-white shadow-xl hover:scale-105 transition-all cursor-pointer"
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
                    onClick={handlePrint}
                    className="btn-floating-action flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs text-white shadow-xl hover:scale-105 transition-all cursor-pointer"
                    style={{ backgroundColor: '#ea580c', color: '#ffffff' }}
                >
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
                <div className="h-[6px] bg-[var(--color-background)] rounded-[999px] overflow-hidden">
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
            <div id="pdf-content" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 sm:p-10 shadow-2xl mx-auto print-area border border-slate-200 dark:border-slate-800 rounded-3xl print:shadow-none print:border-none print:bg-white print:text-black print:p-2 w-full box-border">

                {/* Top Accent Line for Print */}
                <div className="hidden print:block w-full h-2 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-t mb-4"></div>

                {/* Header */}
                <div className="grid grid-cols-[1fr_2fr_1fr] items-center border-b-2 border-slate-800 dark:border-slate-200 pb-5 mb-6 w-full gap-4">
                    <div className="text-left flex flex-col gap-1">
                        <span className="font-black text-[10px] uppercase text-blue-700 dark:text-blue-400 tracking-wider">SISTEMA DE GESTIÓN HYS</span>
                        <span className="font-bold text-xs uppercase text-slate-600 dark:text-slate-400">CONTROL DE RIESGOS</span>
                    </div>

                    <div className="text-center">
                        <h2 className="m-0 text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-tight">
                            PERMISO DE TRABAJO
                        </h2>
                        <span className="inline-block mt-1 px-3 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-xs rounded-full border border-blue-200 dark:border-blue-800 uppercase">
                            {selectedTypeLabel}
                        </span>
                    </div>

                    <div className="flex justify-end items-center gap-3">
                        <div className="text-right flex flex-col bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                             <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">N° PERMISO</span>
                             <span className="text-base font-black text-blue-700 dark:text-blue-400">{formData.numeroPermiso || 'S/N'}</span>
                        </div>
                        <CompanyLogo className="h-10 w-auto max-w-[120px] object-contain" />
                    </div>
                </div>

                {/* Form Grid */}
                <div className="border-2 border-slate-800 dark:border-slate-700 rounded-2xl overflow-hidden mb-8 bg-white dark:bg-slate-800 shadow-sm print:border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2">
                        <DocBox label="CLIENTE / EMPRESA" value={formData.empresa} onChange={(v: string) => setFormData({ ...formData, empresa: v })} />
                        <DocBox label="OBRA / UBICACIÓN" value={formData.obra} onChange={(v: string) => setFormData({ ...formData, obra: v })} borderLeft />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4">
                        <DocBox label="FECHA" value={formData.fecha} onChange={(v: string) => setFormData({ ...formData, fecha: v })} type="date" borderTop />
                        <DocBox label="HORA INICIO" value={formData.validezDesde} onChange={(v: string) => setFormData({ ...formData, validezDesde: v })} type="time" borderLeft borderTop />
                        <DocBox label="HORA FIN" value={formData.validezHasta} onChange={(v: string) => setFormData({ ...formData, validezHasta: v })} type="time" borderLeft borderTop />
                        <DocBox label="TIPO DE TRABAJO" borderLeft borderTop noInput>
                            <select
                                value={formData.tipoPermiso}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="no-print border-none bg-transparent font-extrabold text-sm w-full outline-none text-slate-900 dark:text-slate-100 cursor-pointer">
                                {permitTypes.map((t) => <option key={t.id} value={t.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t.label}</option>)}
                            </select>
                            <div className="print-only font-extrabold text-slate-900">{selectedTypeLabel}</div>
                        </DocBox>
                    </div>
                    {(formData.tipoPermiso === 'electrico' || formData.tipoPermiso === 'confinado' || formData.tipoPermiso === 'elec' || formData.tipoPermiso === 'confined') &&
                        <div className="grid grid-cols-1">
                            <DocBox label="PROCEDIMIENTO LOTO VINCULADO (OPCIONAL)" borderTop noInput>
                                <select
                                    value={formData.lotoId || ''}
                                    onChange={(e) => setFormData({ ...formData, lotoId: e.target.value })}
                                    className="no-print border-none bg-transparent font-extrabold text-sm w-full outline-none text-emerald-600 dark:text-emerald-400 cursor-pointer">
                                    <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">-- Sin LOTO vinculado --</option>
                                    {activeLOTOs.map((l) => <option key={l.id} value={l.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{l.equipmentName} ({l.location})</option>)}
                                </select>
                                <div className="print-only font-extrabold text-emerald-600">
                                    {formData.lotoId ? activeLOTOs.find((l) => l.id === formData.lotoId)?.equipmentName : 'No especificado'}
                                </div>
                            </DocBox>
                        </div>
                    }
                </div>

                {/* Checklist Section */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-black m-0 text-slate-900 flex items-center gap-2 uppercase tracking-wide" style={{ color: '#000000' }}>
                            <ShieldCheck size={22} className="text-blue-600" style={{ color: '#2563eb' }} /> VERIFICACIÓN PREVENTIVA (CHECKLIST)
                        </h3>
                        <button
                            className="no-print bg-blue-600 hover:bg-blue-700 active:scale-95 text-white border-none px-4 py-2 rounded-xl text-xs font-black cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 uppercase tracking-wide"
                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                            onClick={addChecklistItem}>
                            + AGREGAR PREGUNTA
                        </button>
                    </div>
                    <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm print:border-slate-400">
                        <div className="hidden sm:grid grid-cols-[2fr_110px_1.5fr_40px] print:grid-cols-[2.5fr_110px_1.5fr] bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b-2 border-slate-300 dark:border-slate-700 font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            <div>PREGUNTA / ITEM</div>
                            <div className="text-center">ESTADO</div>
                            <div>OBSERVACIONES</div>
                            <div className="no-print"></div>
                        </div>
                        {formData.checklist.map((item: any, idx: number) =>
                            <div key={item.id} className={`grid grid-cols-1 sm:grid-cols-[2fr_110px_1.5fr_40px] print:grid-cols-[2.5fr_110px_1.5fr] gap-4 items-center p-4 border-b border-slate-200 dark:border-slate-800 page-break-inside-avoid ${idx % 2 === 0 ? "bg-slate-50/70 dark:bg-slate-800/40 print:bg-white" : "bg-white dark:bg-slate-900 print:bg-slate-50"}`}>
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.65rem] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">Item/Pregunta:</span>
                                    <input
                                        type="text"
                                        value={item.pregunta}
                                        onChange={(e) => updateChecklist(item.id, 'pregunta', e.target.value)}
                                        placeholder="Descripción de la tarea o riesgo..."
                                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-full outline-none font-bold text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 rounded-xl px-3 h-[38px] transition-all shadow-sm print:border-none print:shadow-none print:bg-transparent print:p-0 print:text-slate-900 print:font-extrabold" />
                                </div>
                                <div className="flex items-center justify-between sm:justify-center">
                                    <span className="sm:hidden text-[0.65rem] font-black text-blue-600 dark:text-blue-400 uppercase">Estado:</span>
                                    <div className="no-print flex gap-2 items-center">
                                        <StatusBtn active={item.estado === 'Cumple'} onClick={() => updateChecklist(item.id, 'estado', 'Cumple')} label="SI" />
                                        <StatusBtn active={item.estado === 'No Cumple'} onClick={() => updateChecklist(item.id, 'estado', 'No Cumple')} label="NO" />
                                    </div>
                                    <div className="print-only flex justify-center">
                                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                                            item.estado === 'No Cumple' 
                                                ? 'bg-rose-100 text-rose-800 border-rose-300' 
                                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        }`}>
                                            {item.estado === 'No Cumple' ? '✗ NO' : '✓ SI'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.65rem] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">Observaciones:</span>
                                    <input
                                        type="text"
                                        value={item.observaciones}
                                        onChange={(e) => updateChecklist(item.id, 'observaciones', e.target.value)}
                                        placeholder="Detalle / Sector..."
                                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-full outline-none font-medium text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 rounded-xl px-3 h-[38px] transition-all shadow-sm print:border-none print:shadow-none print:bg-transparent print:p-0 print:text-slate-800" />
                                </div>
                                <div className="no-print flex justify-end items-center">
                                    <button
                                        type="button"
                                        onClick={() => removeChecklistItem(item.id)}
                                        title="Eliminar pregunta"
                                        className="h-[38px] w-[38px] rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                                        style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Personnel Section */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h3 className="text-base font-black m-0 text-slate-900 flex items-center gap-2 uppercase tracking-wide" style={{ color: '#000000' }}>
                            <Users size={22} className="text-blue-600" style={{ color: '#2563eb' }} /> PERSONAL AUTORIZADO Y APTITUDES MÉDICAS
                        </h3>
                        <div className="no-print flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white border-none px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 uppercase tracking-wide"
                                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                                onClick={openLegajosModal}>
                                <UserCheck size={16} /> IMPORTAR DE LEGAJOS
                            </button>
                            <button
                                type="button"
                                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white border-none px-4 py-2 rounded-xl text-xs font-black cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 uppercase tracking-wide"
                                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                onClick={addPersonnel}>
                                + AGREGAR PERSONAL
                            </button>
                        </div>
                    </div>
                    <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm print:border-slate-400">
                        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_40px] print:grid-cols-[2fr_1fr_1.5fr] bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b-2 border-slate-300 dark:border-slate-700 font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            <div>NOMBRE Y APELLIDO / APTITUD</div>
                            <div>DNI</div>
                            <div>FIRMA</div>
                            <div className="no-print"></div>
                        </div>
                        {formData.personal.map((p: any, idx: number) => {
                            const medVal = (p.dni || p.nombre) ? validateWorkerMedicalStatus(p.dni || p.nombre, 'general') : null;
                            return (
                            <div key={p.id} className={`grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_40px] print:grid-cols-[2fr_1fr_1.5fr] gap-3 sm:items-center p-4 border-b border-slate-200 dark:border-slate-800 page-break-inside-avoid ${idx % 2 === 0 ? "bg-slate-50/70 dark:bg-slate-800/40 print:bg-white" : "bg-white dark:bg-slate-900 print:bg-slate-50"}`}>
                                <div className="flex flex-col">
                                    <span className="sm:hidden text-[0.65rem] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">Nombre:</span>
                                    <input
                                        type="text"
                                        value={p.nombre}
                                        placeholder="Nombre Completo"
                                        onChange={(e) => updatePersonnel(p.id, 'nombre', e.target.value)}
                                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-full outline-none font-bold text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-3 h-[38px] print:border-none print:shadow-none print:bg-transparent print:p-0 print:text-slate-900 print:font-extrabold" />
                                    {medVal && medVal.status !== 'no_registrado' && (
                                        <div className="no-print mt-1.5 flex items-center gap-1.5 flex-wrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-black text-[10px] uppercase shadow-2xs ${
                                                medVal.status === 'apto'
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                    : medVal.status === 'vencido'
                                                    ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                                    : medVal.status === 'no_apto'
                                                    ? 'bg-rose-900 text-white border border-rose-700 font-extrabold'
                                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                            }`}>
                                                {medVal.status === 'apto' && '✓ APTO MÉDICO VIGENTE'}
                                                {medVal.status === 'vencido' && '⚠️ APTITUD VENCIDA'}
                                                {medVal.status === 'no_apto' && '⛔ NO APTO MÉDICO'}
                                                {medVal.status === 'sin_permiso_especifico' && '⚠️ SIN PERMISO ESPECÍFICO'}
                                            </span>
                                            {medVal.expirationDate && (
                                                <span className="text-[10px] font-bold text-slate-500">
                                                    (Vence: {medVal.expirationDate})
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col sm:block">
                                    <span className="sm:hidden text-[0.65rem] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">DNI:</span>
                                    <input
                                        type="text"
                                        value={p.dni}
                                        placeholder="DNI"
                                        onChange={(e) => updatePersonnel(p.id, 'dni', e.target.value)}
                                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-full outline-none font-bold text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-3 h-[38px] print:border-none print:shadow-none print:bg-transparent print:p-0 print:text-slate-800" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="sm:hidden text-[0.65rem] font-black text-blue-600 dark:text-blue-400 uppercase">Firma:</span>
                                    <div className="w-full h-[1px] bg-slate-300 dark:bg-slate-600 print:border-b print:border-dashed print:border-slate-400 print:bg-transparent"></div>
                                </div>
                                <div className="no-print flex justify-end items-center">
                                    <button
                                        type="button"
                                        className="h-[38px] w-[38px] rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                                        style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
                                        onClick={() => removePersonnel(p.id)}
                                        title="Eliminar persona"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                </div>

                {/* Signatures */}
                <div className="card animate-fade-in mt-10 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-10 shadow-lg">
                    <h3 className="mt-0 mb-8 flex items-center gap-3 text-blue-600 dark:text-blue-400 font-black text-xl uppercase tracking-wider">
                        <Pencil size={24} className="text-blue-600 dark:text-blue-400" /> Firmas y Aprobaciones del Permiso
                    </h3>

                    <div className="p-4 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-700 shadow-lg space-y-3 mb-6 no-print">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm shadow-inner">
                          ✍️
                        </div>
                        <div>
                          <span className="text-amber-400 text-xs font-black uppercase tracking-wider block">
                            Visibilidad de Bloques de Firma en el PDF
                          </span>
                          <span className="text-slate-400 text-[11px] font-medium block">
                            Selecciona las firmas que deseas incluir en el permiso imprimible
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2.5 flex-wrap pt-1">
                        {[
                          { id: 'operator', label: 'Solicitante / Operador', color: '#2563eb', icon: '👤' },
                          { id: 'professional', label: 'Gerencia EHS / Emisor', color: '#9333ea', icon: '🛡️' },
                          { id: 'supervisor', label: 'Supervisor de Trabajo', color: '#059669', icon: '📋' }
                        ].map((sig) => {
                          const isChecked = !!showSignatures[sig.id as keyof typeof showSignatures];
                          return (
                            <button
                              type="button"
                              key={sig.id}
                              onClick={() => setShowSignatures((s: any) => ({ ...s, [sig.id]: !isChecked }))}
                              style={{
                                backgroundColor: isChecked ? sig.color : '#1e293b',
                                color: '#ffffff',
                                border: isChecked ? 'none' : '1px solid #334155',
                                boxShadow: isChecked ? `0 4px 14px ${sig.color}60` : 'none',
                                transform: isChecked ? 'scale(1.02)' : 'scale(1)'
                              }}
                              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-95">
                              <div style={{
                                backgroundColor: isChecked ? 'rgba(255,255,255,0.25)' : '#0f172a',
                                borderColor: isChecked ? 'transparent' : '#475569'
                              }} className="w-5 h-5 rounded-md flex items-center justify-center border transition-all">
                                {isChecked ? (
                                  <CheckCircle2 size={13} className="text-white" />
                                ) : (
                                  <span className="text-[10px]">{sig.icon}</span>
                                )}
                              </div>
                              <span>{sig.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Signature Tactile Drawing Pads */}
                    <div className="no-print mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {showSignatures.operator &&
                            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                                <SignatureCanvas
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, operatorSignature: sig || '' }))}
                                    initialImage={formData.operatorSignature || formData.firmas?.solicitante?.sign}
                                    title="Firma de Solicitante" />
                                <button
                                    type="button"
                                    onClick={() => setQrSignatureModal({ isOpen: true, role: 'operator', roleTitle: 'Solicitante / Operador' })}
                                    className="mt-3 w-full py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-extrabold text-xs rounded-xl border border-blue-200 dark:border-blue-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <QrCode size={15} /> 📱 FIRMAR CON QR (CELULAR)
                                </button>
                            </div>
                        }
                        
                        {showSignatures.professional &&
                            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                                <SignatureCanvas
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, professionalSignature: sig || '' }))}
                                    initialImage={formData.professionalSignature || professional.signature || formData.firmas?.ehs?.sign}
                                    title="Firma de Gerencia EHS" />
                                <button
                                    type="button"
                                    onClick={() => setQrSignatureModal({ isOpen: true, role: 'professional', roleTitle: 'Gerencia EHS / Emisor' })}
                                    className="mt-3 w-full py-2 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-extrabold text-xs rounded-xl border border-purple-200 dark:border-purple-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <QrCode size={15} /> 📱 FIRMAR CON QR (CELULAR)
                                </button>
                            </div>
                        }

                        {showSignatures.supervisor &&
                            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                                <SignatureCanvas
                                    onSave={(sig) => setFormData((prev: any) => ({ ...prev, supervisorSignature: sig || '' }))}
                                    initialImage={formData.supervisorSignature || formData.firmas?.supervisor?.sign}
                                    title="Firma de Supervisor" />
                                <button
                                    type="button"
                                    onClick={() => setQrSignatureModal({ isOpen: true, role: 'supervisor', roleTitle: 'Supervisor de Trabajo' })}
                                    className="mt-3 w-full py-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <QrCode size={15} /> 📱 FIRMAR CON QR (CELULAR)
                                </button>
                            </div>
                        }
                    </div>
                </div>

                {/* Printable Signatures */}
                <div className="mt-8 page-break-inside-avoid">
                    <PdfSignatures
                        data={formData}
                        box1={showSignatures?.operator !== false ? {
                            title: 'SOLICITANTE / OPERADOR',
                            subtitle: 'Aclaración y Firma',
                            signatureUrl: formData.operatorSignature || formData.firmas?.solicitante?.sign || null,
                            isProfessional: false
                        } : null}
                        box2={showSignatures?.professional !== false ? {
                            title: 'GERENCIA EHS / EMISOR',
                            subtitle: (professional?.name || formData.professionalName || 'Firma y Sello H&S').toUpperCase(),
                            signatureUrl: formData.professionalSignature || professional.signature || formData.firmas?.ehs?.sign || null,
                            stampUrl: formData.professionalStamp || professional.stamp || null,
                            isProfessional: true,
                            license: professional?.license || formData.professionalLicense || null
                        } : null}
                        box3={showSignatures?.supervisor !== false ? {
                            title: 'SUPERVISOR DE TRABAJO',
                            subtitle: 'Aprobación / Autorización',
                            signatureUrl: formData.supervisorSignature || formData.firmas?.supervisor?.sign || null,
                            isProfessional: false
                        } : null}
                    />
                </div>

                {/* Footer Notes */}
                <PdfBrandingFooter />
            </div>

        {showLegajosModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-indigo-600 dark:text-indigo-400" size={24} />
                  <h3 className="text-lg font-black text-slate-900 dark:text-white m-0 uppercase tracking-tight">
                    Importar Trabajador Registrado
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLegajosModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-sm px-2 py-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 m-0">
                Selecciona un empleado registrado en la empresa para agregarlo al permiso con su validación médica en tiempo real.
              </p>

              <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                {availableWorkers.map((w: any) => {
                  const medVal = validateWorkerMedicalStatus(w.dni || w.nombre, 'general');
                  return (
                    <div
                      key={w.dni}
                      onClick={() => { selectWorkerFromModal(w); setShowLegajosModal(false); }}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl cursor-pointer flex items-center justify-between transition-all hover:scale-[1.01]"
                    >
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white">{w.nombre}</div>
                        <div className="text-xs font-bold text-slate-500">DNI: {w.dni}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {medVal && medVal.status !== 'no_registrado' && (
                          <span className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase ${
                            medVal.status === 'apto' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            medVal.status === 'vencido' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {medVal.status === 'apto' ? '✓ APTO' : medVal.status === 'vencido' ? '⚠️ VENCIDO' : '⚠️ NO APTO'}
                          </span>
                        )}
                        <span className="bg-indigo-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                          + Agregar
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowLegajosModal(false)}
                  className="px-5 py-2 bg-slate-800 text-white font-black text-xs rounded-xl"
                >
                  CERRAR
                </button>
              </div>
            </div>
          </div>
        )}

        <QRSignatureModal
          isOpen={qrSignatureModal.isOpen}
          onClose={() => setQrSignatureModal((prev) => ({ ...prev, isOpen: false }))}
          role={qrSignatureModal.role}
          roleTitle={qrSignatureModal.roleTitle}
          permitId={formData.id || 'draft'}
          onSignatureReceived={handleQRSignatureReceived}
        />
            </AnimatedPage>
      )}
        </div>);
}

function StatusBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  const isNo = label === 'NO';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 h-[38px] rounded-xl border text-xs font-black transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center ${
        active
          ? isNo
            ? 'bg-rose-600 text-white border-rose-600 shadow-rose-500/30 scale-105'
            : 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/30 scale-105'
          : isNo
          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/40'
          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
      }`}
      style={active ? { backgroundColor: isNo ? '#dc2626' : '#059669', color: '#ffffff', borderColor: isNo ? '#dc2626' : '#059669' } : undefined}
    >
      {label}
    </button>
  );
}

function DocBox({ label, value = '', onChange = () => {}, type = "text", borderLeft = false, borderTop = false, noInput = false, children = null }: any) {
  return (
    <div
      className={`p-4 flex flex-col gap-1.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors ${
        borderLeft ? 'sm:border-l border-slate-200 dark:border-slate-700' : ''
      } ${borderTop ? 'border-t border-slate-200 dark:border-slate-700' : ''}`}
    >
      <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">{label}</span>
      {noInput ? children : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-none bg-transparent font-bold text-sm outline-none w-full text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
        />
      )}
    </div>
  );
}