import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, Users, Calendar, Clock, BookOpen,
  UserPlus, Trash2, CheckCircle2, FileText, Briefcase,
  Plus, Share2, Printer, Pencil, QrCode, Timer, Download, Filter, Eye
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import TrainingPdfGenerator from '../components/TrainingPdfGenerator';
import TrainingExamPdfGenerator from '../components/TrainingExamPdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PremiumHeader from '../components/PremiumHeader';
import toast from 'react-hot-toast';
import { usePaywall } from '../hooks/usePaywall';
import AdBanner from '../components/AdBanner';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import { DataTable } from '../components/DataTable';
import AnimatedPage from '../components/AnimatedPage';
import QRModal from '../components/QRModal';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { ModuleFormLayout, ModuleFormToolbar, ModuleActionBar } from '../components/module';
import { downloadCSV } from '../services/exportCsv';

function StatCard({ icon, label, value, color, gradient }: { icon: React.ReactNode; label: string; value: string | number; color: string; gradient: string; }) {
  return (
    <div className="training-stat-card cursor-pointer">
      <div className="training-stat-glow" style={{ background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }} />
      <div className="flex items-center gap-[0.75rem] mb-[1rem] relative z-[1]">
        <div style={{ background: gradient, boxShadow: `0 8px 24px ${color}30` }} className="w-[44px] h-[44px] rounded-[var(--radius-xl)] flex items-center justify-center text-[#ffffff]">
          {React.cloneElement(icon as React.ReactElement<any>, { color: '#ffffff', size: 20 })}
        </div>
      </div>
      <div className="relative z-[1] text-[2rem] font-[900] text-[var(--color-text)] line-height-[1] letter-spacing-[-1px] mb-[0.25rem]">
        {value}
      </div>
      <div className="relative z-[1] text-[0.75rem] font-[700] text-[var(--color-text-muted)] uppercase letter-spacing-[0.5px]">
        {label}
      </div>
    </div>
  );
}

const defaultDemoTrainings = [
  {
    id: 'demo-tr-1',
    fecha: '2026-07-22',
    tema: 'Uso y Cuidado de Equipos de Protección Personal (EPP)',
    tipoCapacitacion: 'Seguridad e Higiene',
    duracion: '1.5',
    expositor: 'Lic. Roberto Gómez',
    lugar: 'Planta Industrial - Sector A',
    empresa: 'Servicios Industriales S.A.',
    objetivo: 'Capacitar al personal en la correcta selección, colocación y mantenimiento de los EPP.',
    asistentes: [
      { nombre: 'Carlos Rodríguez', dni: '32.456.789', puesto: 'Operario de Planta', nota: '10' },
      { nombre: 'María Fernández', dni: '29.876.543', puesto: 'Supervisora de Calidad', nota: '9' },
      { nombre: 'Juan Pérez', dni: '35.123.987', puesto: 'Mantenimiento Mecánico', nota: '10' }
    ]
  },
  {
    id: 'demo-tr-2',
    fecha: '2026-07-18',
    tema: 'Prevención de Incendios y Manejo de Extintores Portátiles',
    tipoCapacitacion: 'Emergencias',
    duracion: '2.0',
    expositor: 'Ing. Alejandro Silva',
    lugar: 'Sector Depósito Principal',
    empresa: 'Logística & Almacenes S.R.L.',
    objetivo: 'Instruir sobre la clasificación de fuegos y la técnica correcta de extinción.',
    asistentes: [
      { nombre: 'Ana Martínez', dni: '31.654.987', puesto: 'Logística', nota: '9' },
      { nombre: 'Diego López', dni: '34.987.654', puesto: 'Operario', nota: '8' }
    ]
  },
  {
    id: 'demo-tr-3',
    fecha: '2026-07-10',
    tema: 'Ergonomía en Puestos de Trabajo y Pausas Activas',
    tipoCapacitacion: 'Ergonomía',
    duracion: '1.0',
    expositor: 'Lic. Sofía Rossi',
    lugar: 'Oficinas Administrativas',
    empresa: 'Servicios Industriales S.A.',
    objetivo: 'Posturas adecuadas y prevención de trastornos musculoesqueléticos en puestos de pantallas.',
    asistentes: [
      { nombre: 'Lucía Benítez', dni: '36.789.123', puesto: 'Administrativa', nota: '10' },
      { nombre: 'Gonzalo Morales', dni: '33.456.123', puesto: 'Analista de Datos', nota: '9' },
      { nombre: 'Patricia Romero', dni: '28.901.234', puesto: 'Recursos Humanos', nota: '10' }
    ]
  }
];

// Vibrant category colors for pills
const categoryColorMap: Record<string, { activeBg: string; activeText: string; inactiveBg: string; inactiveText: string; border: string }> = {
  'todos': {
    activeBg: '#10b981',
    activeText: '#ffffff',
    inactiveBg: '#ecfdf5',
    inactiveText: '#047857',
    border: '#10b981'
  },
  'Seguridad e Higiene': {
    activeBg: '#2563eb',
    activeText: '#ffffff',
    inactiveBg: '#eff6ff',
    inactiveText: '#1d4ed8',
    border: '#3b82f6'
  },
  'Emergencias': {
    activeBg: '#dc2626',
    activeText: '#ffffff',
    inactiveBg: '#fef2f2',
    inactiveText: '#b91c1c',
    border: '#ef4444'
  },
  'Ergonomía': {
    activeBg: '#9333ea',
    activeText: '#ffffff',
    inactiveBg: '#faf5ff',
    inactiveText: '#6b21a8',
    border: '#a855f7'
  },
  'Medio Ambiente': {
    activeBg: '#059669',
    activeText: '#ffffff',
    inactiveBg: '#f0fdf4',
    inactiveText: '#15803d',
    border: '#10b981'
  }
};

export default function TrainingManagement(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { syncCollection, syncing } = useSync();

  // Core state
  const [history, setHistory] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [qrTarget, setQrTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printType, setPrintType] = useState<'asistencia' | 'examen'>('asistencia');
  const [showExamForm, setShowExamForm] = useState(false);
  const [selectedTipoFilter, setSelectedTipoFilter] = useState<string>('todos');

  const initialFormState = {
    tema: '',
    tipoCapacitacion: 'Seguridad e Higiene',
    expositor: currentUser?.displayName || '',
    fecha: new Date().toISOString().split('T')[0],
    duracion: '1',
    empresa: '',
    ubicacion: '',
    observaciones: '',
    preguntas: [
      { texto: '¿Comprendió los riesgos asociados a la tarea?' },
      { texto: '¿Identificó las medidas preventivas correctas?' }
    ],
    asistentes: [{ nombre: '', dni: '', puesto: '', nota: '', firma: '', showSignatureModal: false }],
    operatorSignature: '',
    signature: '',
    supervisorSignature: '',
    showSignatures: { operator: false, professional: true, supervisor: false }
  };

  const [formData, setFormData] = useState(initialFormState);
  const [showSignatures, setShowSignatures] = useState(initialFormState.showSignatures);

  const [professional, setProfessional] = useState({ name: '', license: '', signature: '', stamp: '' });
  const [isMobile, setIsMobile] = useState(false);

  useDocumentTitle(showExamForm ? 'Generador de Exámenes' : showForm ? editingId ? 'Editar Capacitación' : 'Nueva Capacitación' : 'Gestión de Capacitaciones');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [showForm, showExamForm]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      const personal = localStorage.getItem('personalData');
      const stamp = localStorage.getItem('signatureStampData');
      if (personal) {
        const p = JSON.parse(personal);
        setProfessional((prev) => ({ ...prev, name: p.name || '', license: p.license || '' }));
      }
      if (stamp) {
        const s = JSON.parse(stamp);
        setProfessional((prev) => ({ ...prev, signature: s.signature || '', stamp: s.stamp || '' }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('training_history');
      if (raw && raw !== 'undefined') {
        const h = JSON.parse(raw);
        setHistory(Array.isArray(h) && h.length > 0 ? h.sort((a, b) => (new Date(b.fecha) as any) - (new Date(a.fecha) as any)) : defaultDemoTrainings);
      } else {
        setHistory(defaultDemoTrainings);
        localStorage.setItem('training_history', JSON.stringify(defaultDemoTrainings));
      }
    } catch (e) {
      setHistory(defaultDemoTrainings);
    }
  }, [syncing]);

  useEffect(() => {
    const editData = location.state?.editData;
    if (editData && !showForm) {
      setFormData(editData);
      setShowSignatures(editData.showSignatures || initialFormState.showSignatures);
      setEditingId(editData.id);
      setShowForm(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showForm]);

  const handlePrint = (type: 'asistencia' | 'examen' = 'asistencia') => requirePro(() => {
    setPrintType(type);
    setTimeout(() => {
      document.body.classList.add('printing-isolated');
      const element = document.getElementById('pdf-content');
      if (element) {
        element.classList.add('isolated-print-target');
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing-isolated');
          element.classList.remove('isolated-print-target');
        }, 8000);
      } else {
        window.print();
      }
    }, 50);
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newAsistentes = [...prev.asistentes];
      newAsistentes[index] = { ...newAsistentes[index], [field]: value };
      return { ...prev, asistentes: newAsistentes };
    });
  };

  const addAsistente = () => setFormData((prev) => ({ ...prev, asistentes: [...prev.asistentes, { nombre: '', dni: '', puesto: '', nota: '', firma: '', showSignatureModal: false }] }));
  const removeAsistente = (index: number) => setFormData((prev) => ({ ...prev, asistentes: prev.asistentes.filter((_, i) => i !== index) }));

  const handlePreguntaChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newPreguntas = [...(prev.preguntas || [])];
      newPreguntas[index] = { ...newPreguntas[index], texto: value };
      return { ...prev, preguntas: newPreguntas };
    });
  };

  const addPregunta = () => setFormData((prev) => ({ ...prev, preguntas: [...(prev.preguntas || []), { texto: '' }] }));
  const removePregunta = (index: number) => setFormData((prev) => ({ ...prev, preguntas: (prev.preguntas || []).filter((_, i) => i !== index) }));

  const handleSave = () => {
    if (!formData.tema || !formData.fecha) {
      toast.error('El tema y la fecha son obligatorios.');
      return;
    }

    const asistentesValidos = formData.asistentes.filter((a) => a.nombre.trim() !== '' || a.dni.trim() !== '');
    if (asistentesValidos.length === 0) {
      toast.error('Debe ingresar al menos 1 asistente a la capacitación.');
      return;
    }

    const report = {
      id: editingId || Date.now().toString(),
      date: editingId ? (formData as any).date : new Date().toISOString(),
      ...formData,
      showSignatures,
      asistentes: asistentesValidos
    };

    let updatedHistory;
    if (editingId) {
      updatedHistory = history.map((item) => item.id === editingId ? report : item);
    } else {
      updatedHistory = [report, ...history];
    }

    localStorage.setItem('training_history', JSON.stringify(updatedHistory));
    syncCollection('training_history', updatedHistory);
    setHistory(updatedHistory);

    toast.success(editingId ? 'Capacitación actualizada correctamente.' : 'Capacitación registrada correctamente.');
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormState);
    setShowSignatures(initialFormState.showSignatures);
  };

  const confirmDelete = () => {
    const updated = history.filter((item) => item.id !== deleteTarget);
    setHistory(updated);
    localStorage.setItem('training_history', JSON.stringify(updated));
    syncCollection('training_history', updated);
    setDeleteTarget(null);
    toast.success("Capacitación eliminada.");
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setShowSignatures(item.showSignatures || initialFormState.showSignatures);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleExportCSV = () => {
    if (!history || history.length === 0) {
      toast.error("No hay capacitaciones para exportar.");
      return;
    }
    const exportRows = history.map((h) => ({
      Fecha: h.fecha ? new Date(h.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : '—',
      Tema: h.tema || '—',
      Tipo: h.tipoCapacitacion || 'Seguridad e Higiene',
      Expositor: h.expositor || '—',
      Empresa: h.empresa || '—',
      Lugar: h.lugar || h.ubicacion || '—',
      DuracionHoras: h.duracion || '0',
      CantidadAsistentes: h.asistentes?.length || 0,
      Objetivo: h.objetivo || '—'
    }));

    downloadCSV(exportRows, `Capacitaciones_EHS_${new Date().toISOString().split('T')[0]}`, null, "Reporte de Capacitaciones EHS");
    toast.success("Historial exportado a Excel correctamente.");
  };

  if (selectedTraining) {
    return <TrainingPdfGenerator data={selectedTraining} onBack={() => setSelectedTraining(null)} />;
  }

  const filteredHistory = selectedTipoFilter === 'todos' 
    ? history 
    : history.filter(item => (item.tipoCapacitacion || 'Seguridad e Higiene').toLowerCase() === selectedTipoFilter.toLowerCase());

  const totalCharlas = history.length;
  const totalAsistentes = history.reduce((acc, item) => acc + (item.asistentes?.length || 0), 0);
  const totalHours = history.reduce((acc, item) => acc + (parseFloat(item.duracion) || 0), 0);
  const avgDuration = totalCharlas > 0 ? (totalHours / totalCharlas).toFixed(1) : '0';

  const columns = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      sortable: true,
      render: (item: any) => (
        <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 whitespace-nowrap font-bold text-sm">
          <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" /> {item.fecha ? new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : '—'}
        </span>
      )
    },
    {
      header: 'Tema y Categoría',
      accessor: 'tema',
      sortable: true,
      render: (item: any) => (
        <div className="flex items-center gap-3 py-1">
          <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm shrink-0">
            <BookOpen size={18} />
          </div>
          <div className="flex flex-col">
            {/* TEMA MAS OSCURO Y DESTACADO */}
            <span style={{ color: '#0f172a' }} className="font-extrabold text-[0.98rem] dark:text-slate-100 leading-tight">
              {item.tema}
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {item.tipoCapacitacion || 'Seguridad e Higiene'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Expositor / Lugar',
      accessor: 'expositor',
      sortable: true,
      render: (item: any) => (
        <div className="flex flex-col text-xs">
          <span className="font-extrabold text-slate-900 dark:text-slate-100">{item.expositor || '—'}</span>
          <span className="text-slate-600 dark:text-slate-400 font-medium">{item.lugar || item.ubicacion || 'Planta Industrial'}</span>
        </div>
      )
    },
    {
      header: 'Asistentes',
      accessor: 'asistentes',
      render: (item: any) => (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-full text-xs font-black w-fit text-emerald-900 dark:text-emerald-300">
          <Users size={14} className="text-emerald-700 dark:text-emerald-400" /> {item.asistentes?.length || 0} personas
        </span>
      )
    },
    {
      header: 'Duración',
      accessor: 'duracion',
      render: (item: any) => (
        <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200 text-sm font-extrabold">
          <Timer size={14} className="text-amber-600" /> {item.duracion} hs
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleEdit(item)} 
            title="Ver / Editar Capacitación" 
            style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Pencil size={12} /> Editar
          </button>

          <button 
            onClick={() => requirePro(() => { const url = `${window.location.origin}/v/${currentUser?.uid}/training/${item.id}?print=true`; setQrTarget({ text: url, title: `Capacitación — ${item.tema}` }); })} 
            title="Ver Código QR" 
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <QrCode size={12} /> QR
          </button>

          <button 
            onClick={() => requirePro(() => setShareItem(item))} 
            title="Compartir Informe" 
            style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Share2 size={12} /> Compartir
          </button>

          <button 
            onClick={() => setDeleteTarget(item.id)} 
            title="Eliminar Registro" 
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '4px 10px', fontSize: '11px', fontWeight: '800', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )
    }
  ];

  return (
    <AnimatedPage>
      {/* Global Modals */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center backdrop-blur-md">
          <div className="bg-white/90 dark:bg-slate-900/90 max-w-[360px] w-[95%] text-center p-10 rounded-3xl border border-white/20 dark:border-slate-700 shadow-2xl relative backdrop-blur-xl">
            <Trash2 size={48} className="text-red-500 mx-auto mb-6" />
            <h3 className="m-0 text-xl font-extrabold text-slate-800 dark:text-slate-100">¿Eliminar capacitación?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">Esta acción es permanente y no se podrá deshacer.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white border-none cursor-pointer font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF offscreen para compartir/imprimir desde la lista — renderizado directo en el ciclo actual */}
      <div className="ats-pdf-offscreen" aria-hidden="true">
        {shareItem && (
          printType === 'examen'
            ? <TrainingExamPdfGenerator data={shareItem} />
            : <TrainingPdfGenerator data={shareItem} isHeadless={true} id="pdf-content-share" />
        )}
      </div>

      {/* PDF offscreen para imprimir desde el formulario */}
      <div id="pdf-content" className="ats-pdf-offscreen" aria-hidden="true">
        {(showForm || showExamForm) && (
          printType === 'examen'
            ? <TrainingExamPdfGenerator data={{ ...formData, showSignatures }} />
            : <TrainingPdfGenerator data={{ ...formData, showSignatures }} isHeadless={true} />
        )}
      </div>

      {shareItem && (
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Capacitación - ${shareItem?.tema || ''}`}
          text={`📊 Capacitación\n📚 Tema: ${shareItem.tema}\n🧑‍🏫 Expositor: ${shareItem.expositor}\n📅 Fecha: ${shareItem.fecha}\n👥 Asistentes: ${shareItem.asistentes?.length}`}
          rawMessage={''}
          elementIdToPrint="pdf-content-share"
          fileName={`Capacitacion_${shareItem?.tema || 'registro'}.pdf`}
        />
      )}

      {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

      <div className="container min-h-screen bg-[var(--color-background)] pb-[8rem]">
        {(!showForm && !showExamForm) ? (
          /* ==================== HISTORY / MAIN VIEW ==================== */
          <div className="max-w-[1200px] m-[0_auto] px-[1rem] py-[1.5rem]">
            {/* Header con toque Dorado conservado */}
            <div className="no-print mb-6">
              <PremiumHeader
                title="Gestión de Capacitaciones"
                subtitle="Registros de formación, planillas de asistencia y evaluaciones del personal"
                icon={<Users size={36} color="#ffffff" />}
              />
            </div>

            {/* Action Bar Superior — BOTONES CON COLORES VÍVIDOS Y FORZADOS */}
            <div className="flex items-center justify-between gap-4 mb-8 flex-wrap bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Botón Nueva Capacitación — SIEMPRE VERDE */}
                <button
                  onClick={() => {
                    setEditingId(null);
                    setFormData(initialFormState);
                    setShowForm(true);
                  }}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                    border: 'none'
                  }}
                  className="px-6 py-3.5 rounded-xl font-black text-sm cursor-pointer flex items-center gap-2 transition-all hover:bg-emerald-600 hover:scale-[1.02]"
                >
                  <Plus size={20} strokeWidth={3} /> Nueva Capacitación
                </button>

                {/* Botón Crear Examen — PÚRPURA CON COLOR FORZADO */}
                <button
                  onClick={() => setShowExamForm(true)}
                  style={{
                    backgroundColor: '#8e44ad',
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(142, 68, 173, 0.4)',
                    border: 'none'
                  }}
                  className="px-6 py-3.5 rounded-xl font-black text-sm cursor-pointer flex items-center gap-2 transition-all hover:bg-purple-700 hover:scale-[1.02]"
                >
                  <FileText size={20} strokeWidth={2.5} /> Crear Examen
                </button>
              </div>

              {/* Botón Exportar Excel — AZUL CON COLOR FORZADO */}
              <button
                onClick={handleExportCSV}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                  border: 'none'
                }}
                className="px-5 py-3 rounded-xl font-black text-sm cursor-pointer flex items-center gap-2 transition-all hover:bg-blue-700 hover:scale-[1.02] ml-auto"
              >
                <Download size={18} strokeWidth={2.5} /> Exportar Excel / CSV
              </button>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<BookOpen />} label="Charlas Dictadas" value={totalCharlas} color="#8b5cf6" gradient="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" />
              <StatCard icon={<Users />} label="Personal Capacitado" value={totalAsistentes} color="#10b981" gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
              <StatCard icon={<Timer />} label="Horas Totales" value={`${totalHours} hs`} color="#f59e0b" gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
              <StatCard icon={<Timer />} label="Duración Promedio" value={`${avgDuration} hs`} color="#3b82f6" gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" />
            </div>

            {/* Filtros por Categoría — BOTONES DE FILTRO CON COLORES DISTINTIVOS Y FORZADOS */}
            <div className="flex items-center gap-2.5 mb-6 overflow-x-auto pb-2 scrollbar-none flex-wrap">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mr-2">
                <Filter size={15} /> Categorías:
              </span>
              {['todos', 'Seguridad e Higiene', 'Emergencias', 'Ergonomía', 'Medio Ambiente'].map((cat) => {
                const isActive = selectedTipoFilter.toLowerCase() === cat.toLowerCase();
                const colors = categoryColorMap[cat] || categoryColorMap['todos'];
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedTipoFilter(cat)}
                    style={{
                      backgroundColor: isActive ? colors.activeBg : colors.inactiveBg,
                      color: isActive ? colors.activeText : colors.inactiveText,
                      border: `2px solid ${colors.border}`,
                      boxShadow: isActive ? `0 4px 12px ${colors.activeBg}40` : 'none'
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer hover:scale-105"
                  >
                    {cat === 'todos' ? 'Todas las Capacitaciones' : cat}
                  </button>
                );
              })}
            </div>

            {/* Tabla de Resultados */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
              <DataTable
                data={filteredHistory}
                columns={columns}
                searchPlaceholder="Buscar por tema, expositor, empresa o lugar..."
                searchFields={['tema', 'expositor', 'empresa', 'lugar', 'ubicacion']}
                emptyMessage="No hay capacitaciones registradas en esta categoría."
                emptyIcon={<BookOpen size={48} className="text-emerald-500/40" />}
              />
            </div>
          </div>
        ) : (
          /* ==================== FORM / EXAM VIEW ==================== */
          <>
            <ModuleFormToolbar
              title={showExamForm ? 'Generador de Exámenes' : (editingId ? 'Editar Capacitación' : 'Nueva Capacitación')}
              subtitle={showExamForm ? "Cree plantillas en blanco para evaluar capacitaciones" : "Complete los detalles y la asistencia de la charla"}
              icon={showExamForm ? <FileText size={36} color="#ffffff" /> : <BookOpen size={36} color="#ffffff" />}
              onBack={() => { setShowForm(false); setShowExamForm(false); }}
            />

            <ModuleFormLayout>
              <div className="p-[2rem] max-w-[1200px] m-[0_auto] flex flex-col relative">
                {showExamForm ? (
                  /* ===== EXAM BUILDER FORM ===== */
                  <div className="w-full">
                    <div className="bg-white dark:bg-slate-800 p-8 mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                      <h2 className="text-lg font-extrabold mb-6 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <BookOpen size={20} /> Metadatos del Examen
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-full flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400">TEMA / TÍTULO DE LA CAPACITACIÓN</label>
                          <input type="text" placeholder="Ej. Inducción de Seguridad..." value={formData.tema} onChange={(e) => handleInputChange('tema', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400">EXPOSITOR / INSTRUCTOR</label>
                          <input type="text" value={formData.expositor} onChange={(e) => handleInputChange('expositor', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400">FECHA DE EVALUACIÓN</label>
                          <input type="date" value={formData.fecha} onChange={(e) => handleInputChange('fecha', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                        </div>
                        <div className="col-span-full flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400">EMPRESA / CONTRATISTA</label>
                          <input type="text" placeholder="Si aplica a una subcontratista" value={formData.empresa} onChange={(e) => handleInputChange('empresa', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="m-0 text-lg font-extrabold flex items-center gap-2 text-purple-600 dark:text-purple-400">
                          <FileText size={20} /> Preguntas de Evaluación
                        </h2>
                        <button onClick={addPregunta} className="px-4 py-2 bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-full text-sm font-bold flex items-center gap-2 transition-colors">
                          <Plus size={16} /> Agregar Pregunta
                        </button>
                      </div>

                      {(!formData.preguntas || formData.preguntas.length === 0) && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic m-0">No se cargaron preguntas. El examen saldrá solo con un renglón.</p>
                      )}

                      <div className="flex flex-col gap-4">
                        {(formData.preguntas || []).map((pregunta, idx) => (
                          <div key={idx} className="flex gap-4 items-center">
                            <span className="font-extrabold text-purple-600 dark:text-purple-400">{idx + 1}.</span>
                            <input
                              type="text"
                              value={pregunta.texto}
                              onChange={(e) => handlePreguntaChange(idx, e.target.value)}
                              placeholder="Escriba la pregunta a evaluar..."
                              className="input-professional capa-focus-glow m-[0] h-[44px] flex-[1] rounded-[10px]"
                            />
                            <button onClick={() => removePregunta(idx)} className="w-11 h-11 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border-none flex items-center justify-center cursor-pointer transition-colors shrink-0">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <ModuleActionBar actions={[
                      { id: 'print', label: 'IMPRIMIR EXAMEN', icon: <FileText size={18} />, variant: 'secondary', onClick: () => handlePrint('examen') }
                    ]} />
                  </div>
                ) : (
                  /* ===== REGULAR TRAINING FORM ===== */
                  <div className="w-full">
                    {/* General Metadata Panel */}
                    <div className="bg-white dark:bg-slate-800 p-8 mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                      <h2 className="text-lg font-extrabold mb-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <BookOpen size={20} /> Metadatos de la Charla
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-full flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                            <BookOpen size={16} /> Tema / Título de la Capacitación
                          </label>
                          <input type="text" placeholder="Ej. Inducción de Seguridad..." value={formData.tema} onChange={(e) => handleInputChange('tema', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                            <Filter size={16} /> Tipo de Capacitación
                          </label>
                          <select value={formData.tipoCapacitacion || 'Seguridad e Higiene'} onChange={(e) => handleInputChange('tipoCapacitacion', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold outline-none focus:border-emerald-500 transition-all">
                            <option value="Seguridad e Higiene">Seguridad e Higiene</option>
                            <option value="Emergencias">Emergencias / Incendios</option>
                            <option value="Ergonomía">Ergonomía / Salud Ocupacional</option>
                            <option value="Medio Ambiente">Medio Ambiente</option>
                            <option value="Calidad / Operaciones">Calidad / Operaciones</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                            <Users size={16} /> Expositor / Instructor
                          </label>
                          <input type="text" value={formData.expositor} onChange={(e) => handleInputChange('expositor', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                            <Briefcase size={16} /> Sector / Lugar de Dictado
                          </label>
                          <input type="text" placeholder="Ej. Sala de Reuniones 1" value={formData.ubicacion} onChange={(e) => handleInputChange('ubicacion', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                            <Calendar size={16} /> Fecha
                          </label>
                          <input type="date" value={formData.fecha} onChange={(e) => handleInputChange('fecha', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                            <Clock size={16} /> Duración (Horas)
                          </label>
                          <input type="number" min="0.5" step="0.5" value={formData.duracion} onChange={(e) => handleInputChange('duracion', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                        </div>

                        <div className="col-span-full flex flex-col gap-2">
                          <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                            <FileText size={16} /> Empresa / Contratista (Opcional)
                          </label>
                          <input type="text" placeholder="Si aplica a una subcontratista específica" value={formData.empresa} onChange={(e) => handleInputChange('empresa', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                        </div>
                      </div>
                    </div>

                    {/* Attendee Planilla Panel */}
                    <div className="flex-1 p-8 mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 shadow-xl">
                      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                        <h2 className="m-0 text-lg font-extrabold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <Users size={20} /> Planilla de Asistentes
                        </h2>
                        <div className="flex gap-[1rem] items-center">
                          <span className="text-xs font-extrabold bg-emerald-600 text-white px-3 py-1 rounded-full shadow-lg shadow-emerald-500/30">
                            {formData.asistentes.length} {formData.asistentes.length === 1 ? 'asistente' : 'asistentes'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        {formData.asistentes.map((asistente, i) => (
                          <div key={i} className="training-asistente-card">
                            <span className="training-asistente-badge">Asistente #{i + 1}</span>
                            <div className={`grid gap-5 items-end mt-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-[2fr_1.2fr_1.5fr_1fr_auto_auto]'}`}>
                              <div className="flex flex-col gap-[0.4rem]">
                                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nombre Completo</label>
                                <input type="text" placeholder="Apellido y Nombre" value={asistente.nombre} onChange={(e) => handleArrayChange(i, 'nombre', e.target.value)} className="m-0 h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors" />
                              </div>
                              <div className="flex flex-col gap-[0.4rem]">
                                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">DNI / CUIL</label>
                                <input type="text" placeholder="Número de documento" value={asistente.dni} onChange={(e) => handleArrayChange(i, 'dni', e.target.value)} className="m-0 h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors" />
                              </div>
                              <div className="flex flex-col gap-[0.4rem]">
                                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Puesto / Sector</label>
                                <input type="text" placeholder="Ej. Operario" value={asistente.puesto} onChange={(e) => handleArrayChange(i, 'puesto', e.target.value)} className="m-0 h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors" />
                              </div>
                              <div className="flex flex-col gap-[0.4rem]">
                                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nota / Eval.</label>
                                <input type="text" placeholder="Ej. Aprobado, 8" value={asistente.nota || ''} onChange={(e) => handleArrayChange(i, 'nota', e.target.value)} className="m-0 h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-colors" />
                              </div>
                              <div className="flex flex-col gap-[0.4rem]">
                                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Firma</label>
                                {asistente.firma ? (
                                  <div className="h-11 border border-emerald-500 bg-emerald-500/5 rounded-xl flex items-center justify-center text-emerald-500 cursor-pointer px-2 transition-colors hover:bg-emerald-500/10 shrink-0" onClick={() => handleArrayChange(i, 'showSignatureModal', true)}>
                                    <CheckCircle2 size={16} className="mr-[0.4rem]" /> Firmado
                                  </div>
                                ) : (
                                  <button className="h-11 m-0 rounded-xl px-4 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors shrink-0" onClick={() => handleArrayChange(i, 'showSignatureModal', true)}>
                                    <Pencil size={15} /> Firmar
                                  </button>
                                )}
                              </div>

                              {formData.asistentes.length > 1 ? (
                                <div className={`flex ${isMobile ? 'justify-end w-full' : 'justify-center w-auto'}`}>
                                  <button onClick={() => removeAsistente(i)} title="Eliminar Asistente" className={`h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center cursor-pointer transition-colors hover:bg-red-500/20 ${isMobile ? 'w-full mt-2' : 'w-11 mt-0'}`}>
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              ) : (
                                <div className="hidden sm:block w-[44px]"></div>
                              )}
                            </div>
                            {asistente.showSignatureModal && (
                              <div className="p-5 mt-4 rounded-xl border border-emerald-500 bg-white dark:bg-slate-800 shadow-lg">
                                <div className="flex justify-between items-center mb-[1rem]">
                                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Firma de {asistente.nombre || `Asistente #${i + 1}`}</span>
                                  <button onClick={() => handleArrayChange(i, 'showSignatureModal', false)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-none rounded-lg px-3 py-1.5 cursor-pointer font-bold text-sm transition-colors">Cerrar</button>
                                </div>
                                <SignatureCanvas
                                  onSave={(sig) => { handleArrayChange(i, 'firma', sig); handleArrayChange(i, 'showSignatureModal', false); }}
                                  initialImage={asistente.firma}
                                  title={`Firmar asistencia - ${asistente.nombre || 'Asistente'}`}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <button onClick={addAsistente} className="w-full p-5 border-2 border-dashed border-emerald-400 dark:border-emerald-500/50 rounded-xl flex items-center justify-center gap-2 mt-6 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 font-extrabold cursor-pointer transition-colors">
                        <UserPlus size={18} /> Añadir Fila de Asistente
                      </button>
                    </div>

                    {/* Signatures & Approvals Panel */}
                    <div className="bg-white dark:bg-slate-800 p-8 mt-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                      <h3 className="m-0 mb-8 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-black text-xl uppercase tracking-widest">
                        <Pencil size={24} /> Firmas y Autorizaciones
                      </h3>

                      <div className={`no-print mb-8 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-4 ${isMobile ? 'flex-col' : 'flex-row'}`}>
                        <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Incluir Firmas en el Documento:</div>
                        <div className="flex gap-3 flex-wrap justify-center">
                          <button type="button" className={`training-signature-pill ${showSignatures.operator ? 'training-signature-pill-active' : ''}`} onClick={() => setShowSignatures((s) => ({ ...s, operator: !s.operator }))}>
                            <CheckCircle2 size={16} style={{ opacity: showSignatures.operator ? 1 : 0.4 }} /> Delegado / Asistente
                          </button>
                          <button type="button" className={`training-signature-pill ${showSignatures.professional ? 'training-signature-pill-active' : ''}`} onClick={() => setShowSignatures((s) => ({ ...s, professional: !s.professional }))}>
                            <CheckCircle2 size={16} style={{ opacity: showSignatures.professional ? 1 : 0.4 }} /> Instructor / Expositor
                          </button>
                          <button type="button" className={`training-signature-pill ${showSignatures.supervisor ? 'training-signature-pill-active' : ''}`} onClick={() => setShowSignatures((s) => ({ ...s, supervisor: !s.supervisor }))}>
                            <CheckCircle2 size={16} style={{ opacity: showSignatures.supervisor ? 1 : 0.4 }} /> Supervisión / Verificador
                          </button>
                        </div>
                      </div>

                      <div className="mb-[2.5rem]">
                        <PdfSignatures
                          data={{ ...formData, professionalSignature: professional.signature, professionalName: professional.name, professionalLicense: professional.license, professionalStamp: professional.stamp }}
                          box1={showSignatures.operator ? { title: 'DELEGADO / ASISTENTE', subtitle: 'En representación de asistentes', signatureUrl: formData.operatorSignature || null, isProfessional: false } : null}
                          box2={showSignatures.professional ? { title: 'INSTRUCTOR / EXPOSITOR', subtitle: (professional.name || 'Firma de Especialista').toUpperCase(), signatureUrl: formData.signature || professional.signature || null, stampUrl: professional.stamp || null, isProfessional: true, license: professional.license } : null}
                          box3={showSignatures.supervisor ? { title: 'SUPERVISIÓN / VERIFICADOR', subtitle: 'Verificación de Capacitación', signatureUrl: formData.supervisorSignature || null, isProfessional: false } : null}
                        />

                        <PdfBrandingFooter />
                      </div>

                      {(showSignatures.operator || showSignatures.professional || showSignatures.supervisor) && (
                        <div className="no-print mt-[2rem] pt-[2rem] border-t border-slate-200 dark:border-slate-700 grid gap-[1.5rem]" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                          {showSignatures.operator && (
                            <div className="glass-card p-[1rem] rounded-[16px] border border-slate-200 dark:border-slate-700">
                              <SignatureCanvas onSave={(sig) => setFormData((prev) => ({ ...prev, operatorSignature: sig || '' }))} initialImage={formData.operatorSignature} label="Firma de Delegado / Asistente" />
                            </div>
                          )}
                          {showSignatures.professional && (
                            <div className="glass-card p-[1rem] rounded-[16px] border border-slate-200 dark:border-slate-700">
                              <SignatureCanvas onSave={(sig) => setFormData((prev) => ({ ...prev, signature: sig || '' }))} initialImage={formData.signature} label="Firma de Instructor / Expositor" />
                            </div>
                          )}
                          {showSignatures.supervisor && (
                            <div className="glass-card p-[1rem] rounded-[16px] border border-slate-200 dark:border-slate-700">
                              <SignatureCanvas onSave={(sig) => setFormData((prev) => ({ ...prev, supervisorSignature: sig || '' }))} initialImage={formData.supervisorSignature} label="Firma de Supervisión / Verificador" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <ModuleActionBar actions={[
                      { id: 'save', label: 'GUARDAR', icon: <Save size={18} />, variant: 'primary', onClick: (e) => { e.preventDefault(); requirePro(handleSave); } },
                      { id: 'share', label: 'COMPARTIR', icon: <Share2 size={18} />, variant: 'secondary', onClick: () => requirePro(() => setShareItem(formData)) },
                      { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer size={18} />, variant: 'secondary', onClick: () => handlePrint('asistencia') }
                    ]} />
                  </div>
                )}
              </div>
            </ModuleFormLayout>
          </>
        )}
      </div>

      {!showForm && !showExamForm && <AdBanner />}
    </AnimatedPage>
  );
}