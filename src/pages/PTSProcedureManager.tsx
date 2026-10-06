import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, Search, Calendar, Download,
  Trash2, AlertTriangle, CheckCircle2,
  Users, CheckSquare, Ban, Eye, Edit2, Sparkles,
  FileSpreadsheet, ShieldCheck, X, HardHat, Info,
  AlertOctagon, Check, ArrowRight, RefreshCw, BookmarkCheck
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import toast from 'react-hot-toast';
import {
  PTSProcedure,
  PTSStep,
  PTSWorkerAcknowledge,
  PTSCategory,
  PTS_CATEGORY_LABELS,
  DEFAULT_PTS_PROCEDURES,
  PTS_TEMPLATES
} from '../data/ptsProcedureData';
import { generatePTSDocumentPdf } from '../utils/ptsPdfGenerator';

const STORAGE_KEY = 'hys_pts_procedures_data';

export default function PTSProcedureManager(): React.ReactElement | null {
  const { activeCompany } = useCompany();

  // Estados principales
  const [procedures, setProcedures] = useState<PTSProcedure[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modales
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeProcedureForSign, setActiveProcedureForSign] = useState<PTSProcedure | null>(null);
  const [activeProcedureForPreview, setActiveProcedureForPreview] = useState<PTSProcedure | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<PTSProcedure | null>(null);

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Formulario del PTS
  const [formData, setFormData] = useState<Partial<PTSProcedure>>({
    code: 'PTS-OP-01',
    version: 'Rev. 01',
    title: '',
    category: 'operaciones_generales',
    categoryLabel: 'Operaciones Generales de Planta',
    status: 'vigente',
    effectiveDate: new Date().toISOString().split('T')[0],
    nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    objective: '',
    scope: '',
    responsibilities: '• Operador: Cumplir estrictamente el presente procedimiento y usar EPP.\n• Supervisor: Verificar condiciones seguras antes de iniciar tareas.\n• Servicio HyS: Auditar el cumplimiento y actualizar el documento.',
    requiredPPE: ['Calzado de seguridad con puntera', 'Protección ocular / antiparras', 'Guantes de trabajo específicos'],
    preliminaryChecks: '1. Verificar el área de trabajo limpia y sin obstáculos.\n2. Inspeccionar herramientas y equipos antes de su energización.\n3. Asegurar iluminación y ventilación adecuada.',
    steps: [
      {
        id: 's-1',
        stepNumber: 1,
        activityTitle: 'Inspección previa del sector y herramientas',
        hazardRisk: 'Equipos defectuosos o área con riesgos no identificados.',
        controlMeasure: 'Revisión visual de cables, protecciones mecánicas y EPP obligatorio.'
      },
      {
        id: 's-2',
        stepNumber: 2,
        activityTitle: 'Ejecución de la maniobra u operación',
        hazardRisk: 'Atrapamiento, cortes o sobreesfuerzo postural.',
        controlMeasure: 'Operar respetando las distancias de seguridad y ergonomía adecuada.'
      }
    ],
    prohibitions: [
      'PROHIBIDO anular, remover o puentear dispositivos de seguridad o resguardos.',
      'PROHIBIDO realizar la tarea sin los Equipos de Protección Personal indicados.',
      'PROHIBIDO utilizar teléfonos celulares o distractores durante la maniobra.'
    ],
    emergencyProtocol: 'En caso de accidente o emergencia: Detener la maniobra inmediatamente. Dar aviso al supervisor y llamar al servicio médico interno o a la ART contratada.',
    preparedBy: 'Lic. en Higiene y Seguridad en el Trabajo',
    reviewedBy: 'Jefe de Planta / Operaciones',
    approvedBy: 'Gerencia General',
    acknowledgements: []
  });

  // Input temporal de nuevo EPP y prohibición en el form
  const [newPpeInput, setNewPpeInput] = useState('');
  const [newProhibitionInput, setNewProhibitionInput] = useState('');

  // Input temporal para registrar nuevo trabajador en acuse de recibo
  const [newWorkerForm, setNewWorkerForm] = useState<Partial<PTSWorkerAcknowledge>>({
    workerName: '',
    workerDni: '',
    sector: '',
    acknowledgedDate: new Date().toISOString().split('T')[0],
    signed: true
  });

  // Carga inicial de datos con almacenamiento en LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProcedures(parsed);
          return;
        }
      }
      setProcedures(DEFAULT_PTS_PROCEDURES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PTS_PROCEDURES));
    } catch {
      setProcedures(DEFAULT_PTS_PROCEDURES);
    }
  }, []);

  const saveProceduresToStorage = (updatedList: PTSProcedure[]) => {
    setProcedures(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error guardando PTS:', e);
    }
  };

  // Filtrado de procedimientos
  const filteredProcedures = useMemo(() => {
    return procedures.filter(proc => {
      const matchesSearch =
        proc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proc.objective.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'all' || proc.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || proc.status === selectedStatus;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [procedures, searchTerm, selectedCategory, selectedStatus]);

  // KPIs
  const totalProcedures = procedures.length;
  const activeCount = procedures.filter(p => p.status === 'vigente').length;
  const reviewCount = procedures.filter(p => p.status === 'en_revision').length;
  const totalSignedWorkers = procedures.reduce((acc, p) => acc + (p.acknowledgements?.length || 0), 0);

  // Manejo de apertura de modal para crear
  const handleOpenCreateModal = () => {
    setEditingProcedure(null);
    setFormData({
      code: `PTS-${String(procedures.length + 1).padStart(2, '0')}`,
      version: 'Rev. 01',
      title: '',
      category: 'operaciones_generales',
      categoryLabel: 'Operaciones Generales de Planta',
      status: 'vigente',
      effectiveDate: new Date().toISOString().split('T')[0],
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      objective: '',
      scope: 'Aplica a todo el personal de planta permanente y eventual que ejecute las tareas especificadas.',
      responsibilities: '• Operador: Cumplir estrictamente el presente procedimiento y usar EPP.\n• Supervisor: Verificar condiciones seguras antes de iniciar tareas.\n• Servicio HyS: Auditar el cumplimiento y actualizar el documento.',
      requiredPPE: ['Calzado de seguridad con puntera', 'Protección ocular / antiparras', 'Guantes de trabajo específicos'],
      preliminaryChecks: '1. Verificar el área de trabajo limpia y sin obstáculos.\n2. Inspeccionar herramientas y equipos antes de su energización.\n3. Asegurar iluminación y ventilación adecuada.',
      steps: [
        {
          id: 's-1',
          stepNumber: 1,
          activityTitle: 'Inspección previa del sector y herramientas',
          hazardRisk: 'Equipos defectuosos o área con riesgos no identificados.',
          controlMeasure: 'Revisión visual de cables, protecciones mecánicas y EPP obligatorio.'
        },
        {
          id: 's-2',
          stepNumber: 2,
          activityTitle: 'Ejecución de la maniobra u operación',
          hazardRisk: 'Atrapamiento, cortes o sobreesfuerzo postural.',
          controlMeasure: 'Operar respetando las distancias de seguridad y ergonomía adecuada.'
        }
      ],
      prohibitions: [
        'PROHIBIDO anular, remover o puentear dispositivos de seguridad o resguardos.',
        'PROHIBIDO realizar la tarea sin los Equipos de Protección Personal indicados.',
        'PROHIBIDO utilizar teléfonos celulares o distractores durante la maniobra.'
      ],
      emergencyProtocol: 'En caso de accidente o emergencia: Detener la maniobra inmediatamente. Dar aviso al supervisor y llamar al servicio médico interno o a la ART contratada.',
      preparedBy: 'Lic. en Higiene y Seguridad en el Trabajo',
      reviewedBy: 'Jefe de Planta / Operaciones',
      approvedBy: 'Gerencia General',
      acknowledgements: []
    });
    setShowProcedureModal(true);
  };

  // Manejo de edición
  const handleEditProcedure = (proc: PTSProcedure) => {
    setEditingProcedure(proc);
    setFormData({ ...proc });
    setShowProcedureModal(true);
  };

  // Guardar procedimiento (crear o editar)
  const handleSaveProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.code) {
      toast.error('Complete el título y código del procedimiento');
      return;
    }

    const catKey = (formData.category || 'operaciones_generales') as PTSCategory;
    const catLabel = PTS_CATEGORY_LABELS[catKey]?.label || 'Operaciones Generales';

    if (editingProcedure) {
      const updated = procedures.map(p =>
        p.id === editingProcedure.id
          ? ({
              ...p,
              ...formData,
              category: catKey,
              categoryLabel: catLabel
            } as PTSProcedure)
          : p
      );
      saveProceduresToStorage(updated);
      toast.success('Procedimiento actualizado exitosamente');
    } else {
      const newProc: PTSProcedure = {
        ...(formData as PTSProcedure),
        id: `pts-${Date.now()}`,
        category: catKey,
        categoryLabel: catLabel,
        acknowledgements: formData.acknowledgements || [],
        createdAt: new Date().toISOString().split('T')[0]
      };
      saveProceduresToStorage([newProc, ...procedures]);
      toast.success('Nuevo PTS incorporado al catálogo');
    }

    setShowProcedureModal(false);
  };

  // Eliminar procedimiento
  const handleDeleteProcedure = () => {
    if (!confirmDeleteId) return;
    const updated = procedures.filter(p => p.id !== confirmDeleteId);
    saveProceduresToStorage(updated);
    setConfirmDeleteId(null);
    toast.success('Procedimiento eliminado');
  };

  // Cargar plantilla rápida
  const handleApplyTemplate = (templateKey: string) => {
    const tmpl = PTS_TEMPLATES[templateKey];
    if (!tmpl) return;

    setFormData(prev => ({
      ...prev,
      title: tmpl.title || prev.title,
      category: tmpl.category || prev.category,
      categoryLabel: tmpl.categoryLabel || prev.categoryLabel,
      objective: tmpl.objective || prev.objective,
      requiredPPE: tmpl.requiredPPE ? [...tmpl.requiredPPE] : prev.requiredPPE,
      preliminaryChecks: tmpl.preliminaryChecks || prev.preliminaryChecks,
      prohibitions: tmpl.prohibitions ? [...tmpl.prohibitions] : prev.prohibitions,
      emergencyProtocol: tmpl.emergencyProtocol || prev.emergencyProtocol
    }));

    setShowTemplateModal(false);
    setShowProcedureModal(true);
    toast.success(`Plantilla "${tmpl.title}" cargada en el generador`);
  };

  // Manejo de pasos en el formulario
  const handleAddStep = () => {
    const currentSteps = formData.steps || [];
    const newStepNumber = currentSteps.length + 1;
    const newStep: PTSStep = {
      id: `s-${Date.now()}`,
      stepNumber: newStepNumber,
      activityTitle: '',
      hazardRisk: '',
      controlMeasure: ''
    };
    setFormData({ ...formData, steps: [...currentSteps, newStep] });
  };

  const handleUpdateStep = (index: number, field: keyof PTSStep, value: string) => {
    const currentSteps = [...(formData.steps || [])];
    currentSteps[index] = { ...currentSteps[index], [field]: value };
    setFormData({ ...formData, steps: currentSteps });
  };

  const handleRemoveStep = (index: number) => {
    const currentSteps = (formData.steps || []).filter((_, i) => i !== index);
    // Renumerar
    const renumbered = currentSteps.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setFormData({ ...formData, steps: renumbered });
  };

  // Manejo de EPP
  const handleAddPPE = () => {
    if (!newPpeInput.trim()) return;
    const current = formData.requiredPPE || [];
    if (!current.includes(newPpeInput.trim())) {
      setFormData({ ...formData, requiredPPE: [...current, newPpeInput.trim()] });
    }
    setNewPpeInput('');
  };

  const handleRemovePPE = (index: number) => {
    const current = (formData.requiredPPE || []).filter((_, i) => i !== index);
    setFormData({ ...formData, requiredPPE: current });
  };

  // Manejo de Prohibiciones
  const handleAddProhibition = () => {
    if (!newProhibitionInput.trim()) return;
    const current = formData.prohibitions || [];
    setFormData({ ...formData, prohibitions: [...current, newProhibitionInput.trim()] });
    setNewProhibitionInput('');
  };

  const handleRemoveProhibition = (index: number) => {
    const current = (formData.prohibitions || []).filter((_, i) => i !== index);
    setFormData({ ...formData, prohibitions: current });
  };

  // Manejo de Difusión y Firmas
  const handleOpenSignModal = (proc: PTSProcedure) => {
    setActiveProcedureForSign(proc);
    setNewWorkerForm({
      workerName: '',
      workerDni: '',
      sector: '',
      acknowledgedDate: new Date().toISOString().split('T')[0],
      signed: true
    });
    setShowSignModal(true);
  };

  const handleAddWorkerSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProcedureForSign || !newWorkerForm.workerName || !newWorkerForm.workerDni) {
      toast.error('Complete el nombre y DNI del trabajador');
      return;
    }

    const newAck: PTSWorkerAcknowledge = {
      id: `ack-${Date.now()}`,
      workerName: newWorkerForm.workerName.trim(),
      workerDni: newWorkerForm.workerDni.trim(),
      sector: newWorkerForm.sector?.trim() || 'Operaciones',
      acknowledgedDate: newWorkerForm.acknowledgedDate || new Date().toISOString().split('T')[0],
      signed: !!newWorkerForm.signed
    };

    const updatedAcknowledgements = [...(activeProcedureForSign.acknowledgements || []), newAck];
    const updatedProc = { ...activeProcedureForSign, acknowledgements: updatedAcknowledgements };

    const updatedList = procedures.map(p => (p.id === activeProcedureForSign.id ? updatedProc : p));
    saveProceduresToStorage(updatedList);
    setActiveProcedureForSign(updatedProc);

    setNewWorkerForm({
      workerName: '',
      workerDni: '',
      sector: '',
      acknowledgedDate: new Date().toISOString().split('T')[0],
      signed: true
    });
    toast.success('Trabajador registrado en la planilla de difusión');
  };

  const handleRemoveWorkerSign = (ackId: string) => {
    if (!activeProcedureForSign) return;
    const updatedAcknowledgements = (activeProcedureForSign.acknowledgements || []).filter(a => a.id !== ackId);
    const updatedProc = { ...activeProcedureForSign, acknowledgements: updatedAcknowledgements };

    const updatedList = procedures.map(p => (p.id === activeProcedureForSign.id ? updatedProc : p));
    saveProceduresToStorage(updatedList);
    setActiveProcedureForSign(updatedProc);
    toast.success('Registro de firma retirado');
  };

  // Generación de PDF
  const handleDownloadPdf = (proc: PTSProcedure) => {
    try {
      const companyName = activeCompany?.name || 'Establecimiento Industrial S.A.';
      const companyCuit = activeCompany?.cuit || '30-71234567-8';
      generatePTSDocumentPdf(proc, companyName, companyCuit);
      toast.success(`PDF de ${proc.code} generado y descargado`);
    } catch (e) {
      console.error('Error generando PDF de PTS:', e);
      toast.error('No se pudo generar el documento PDF');
    }
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (procedures.length === 0) {
      toast.error('No hay procedimientos para exportar');
      return;
    }

    const headers = ['Código', 'Versión', 'Título', 'Categoría', 'Estado', 'Fecha Vigencia', 'Próxima Revisión', 'Cant. Pasos', 'Trabajadores Notificados'];
    const rows = procedures.map(p => [
      p.code,
      p.version,
      `"${p.title.replace(/"/g, '""')}"`,
      p.categoryLabel,
      p.status,
      p.effectiveDate,
      p.nextReviewDate,
      p.steps.length,
      p.acknowledgements.length
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inventario_Procedimientos_PTS_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Inventario descargado en formato CSV');
  };

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* Encabezado Premium */}
        <PremiumHeader
          title="Procedimientos de Trabajo Seguro (PTS)"
          subtitle="Biblioteca y Generador Asistido de Procedimientos Operativos Estandarizados (SOP/POETS) bajo ISO 45001 y Ley 19.587 con matriz de control de riesgos y registro de difusión con firmas."
          badge="ISO 45001 / RES. SRT"
          icon={<FileText className="w-7 h-7 text-indigo-400" />}
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Plantillas Modelo
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Exportar CSV
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo Procedimiento
            </button>
          </div>
        </PremiumHeader>

        {/* Tarjetas KPI de Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total en Biblioteca</p>
              <p className="text-2xl font-bold text-white mt-1">{totalProcedures}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Procedimientos normalizados</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Vigentes y Activos</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
              <p className="text-[11px] text-emerald-500/80 mt-0.5">Sin vencimiento inmediato</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">En Revisión / Borrador</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{reviewCount}</p>
              <p className="text-[11px] text-amber-500/80 mt-0.5">Requieren auditoría HyS</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Trabajadores Notificados</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{totalSignedWorkers}</p>
              <p className="text-[11px] text-cyan-500/80 mt-0.5">Firmas de difusión registradas</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, título o tarea..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Categorías */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por rubro o categoría"
              className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todas las Categorías</option>
              {Object.entries(PTS_CATEGORY_LABELS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Estado */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              aria-label="Filtrar por estado del procedimiento"
              className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todos los Estados</option>
              <option value="vigente">Vigente</option>
              <option value="en_revision">En Revisión</option>
              <option value="obsoleto">Obsoleto</option>
            </select>
          </div>
        </div>

        {/* Listado de Procedimientos */}
        {filteredProcedures.length === 0 ? (
          <EmptyStateIllustrated
            title="No se encontraron procedimientos"
            description={searchTerm || selectedCategory !== 'all' ? "No hay registros que coincidan con los filtros seleccionados." : "Comience creando un nuevo Procedimiento de Trabajo Seguro o cargue una plantilla prediseñada."}
            actionLabel="Crear Primer PTS"
            onAction={handleOpenCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProcedures.map(proc => {
              const catInfo = PTS_CATEGORY_LABELS[proc.category] || { label: proc.categoryLabel, color: '#6366f1' };
              const isExpired = new Date(proc.nextReviewDate) < new Date();

              return (
                <div
                  key={proc.id}
                  className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group hover:shadow-xl hover:shadow-indigo-950/20"
                >
                  <div>
                    {/* Header de la tarjeta */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {proc.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {proc.version}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          proc.status === 'vigente'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : proc.status === 'en_revision'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-400 border border-slate-600'
                        }`}
                      >
                        {proc.status === 'vigente' ? 'Vigente' : proc.status === 'en_revision' ? 'En Revisión' : 'Obsoleto'}
                      </span>
                    </div>

                    {/* Título y Categoría */}
                    <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors line-clamp-2 mb-2 leading-snug">
                      {proc.title}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-3">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: catInfo.color }}
                      />
                      <span className="text-xs text-slate-400 truncate">
                        {catInfo.label}
                      </span>
                    </div>

                    {/* Objetivo sintético */}
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                      {proc.objective || 'Sin objetivo detallado cargado.'}
                    </p>

                    {/* Fila de metadatos rápidos */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-4 bg-slate-800/30 p-2.5 rounded-xl border border-slate-800/40">
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span><strong>{proc.steps.length}</strong> pasos seguros</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HardHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>{proc.requiredPPE.length}</strong> EPP exigidos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className={isExpired ? 'text-rose-400 font-semibold' : ''}>
                          Rev: {proc.nextReviewDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span><strong>{proc.acknowledgements?.length || 0}</strong> firmas</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones del Procedimiento */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDownloadPdf(proc)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all"
                        title="Descargar documento oficial en formato PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar PDF
                      </button>

                      <button
                        onClick={() => handleOpenSignModal(proc)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                        title="Registrar firmas de notificación a trabajadores"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Difusión ({proc.acknowledgements?.length || 0})
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          setActiveProcedureForPreview(proc);
                          setShowPreviewModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Vista Rápida
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditProcedure(proc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                          title="Editar Procedimiento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(proc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Eliminar Procedimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL 1: CREAR / EDITAR PTS */}
        {showProcedureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {editingProcedure ? 'Editar Procedimiento de Trabajo Seguro' : 'Nuevo Procedimiento de Trabajo Seguro (PTS)'}
                    </h3>
                    <p className="text-xs text-slate-400">Estructura normalizada ISO 45001 / Ley 19.587</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProcedureModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveProcedure} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Datos Identificatorios */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookmarkCheck className="w-4 h-4" /> 1. Datos Generales y Control Documental
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Código Oficial *</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Ej: PTS-MEC-01"
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Versión / Revisión</label>
                      <input
                        type="text"
                        value={formData.version || ''}
                        onChange={e => setFormData({ ...formData, version: e.target.value })}
                        placeholder="Rev. 01"
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Categoría Operativa</label>
                      <select
                        value={formData.category || 'operaciones_generales'}
                        onChange={e => setFormData({ ...formData, category: e.target.value as PTSCategory })}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {Object.entries(PTS_CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Estado</label>
                      <select
                        value={formData.status || 'vigente'}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="vigente">Vigente</option>
                        <option value="en_revision">En Revisión</option>
                        <option value="obsoleto">Obsoleto</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Título de la Tarea / Procedimiento *</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ej: Operación Segura de Amoladora Angular y Corte de Metales"
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de Entrada en Vigencia</label>
                      <input
                        type="date"
                        value={formData.effectiveDate || ''}
                        onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Próxima Revisión Periódica</label>
                      <input
                        type="date"
                        value={formData.nextReviewDate || ''}
                        onChange={e => setFormData({ ...formData, nextReviewDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Objetivo, Alcance y Responsabilidades */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> 2. Objetivo, Alcance y Responsabilidades
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Objetivo del Procedimiento</label>
                    <textarea
                      rows={2}
                      value={formData.objective || ''}
                      onChange={e => setFormData({ ...formData, objective: e.target.value })}
                      placeholder="Describir qué se busca prevenir y cuál es la finalidad operativa..."
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Alcance</label>
                      <textarea
                        rows={2}
                        value={formData.scope || ''}
                        onChange={e => setFormData({ ...formData, scope: e.target.value })}
                        placeholder="A quiénes y en qué sectores aplica..."
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Responsabilidades Asignadas</label>
                      <textarea
                        rows={2}
                        value={formData.responsibilities || ''}
                        onChange={e => setFormData({ ...formData, responsibilities: e.target.value })}
                        placeholder="Rol del operador, supervisor y Servicio HyS..."
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. EPP y Verificaciones Previas */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HardHat className="w-4 h-4" /> 3. EPP Requerido y Chequeo Pre-Operacional
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Equipos de Protección Personal (EPP Obligatorio)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(formData.requiredPPE || []).map((ppe, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-xs"
                        >
                          <HardHat className="w-3.5 h-3.5 text-amber-400" />
                          {ppe}
                          <button
                            type="button"
                            onClick={() => handleRemovePPE(i)}
                            className="text-amber-400 hover:text-rose-400 ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPpeInput}
                        onChange={e => setNewPpeInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPPE();
                          }
                        }}
                        placeholder="Agregar otro elemento de protección (ej: Protección auditiva > 25 dB)..."
                        className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddPPE}
                        className="px-3 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Verificaciones Previas al Inicio de Tareas
                    </label>
                    <textarea
                      rows={3}
                      value={formData.preliminaryChecks || ''}
                      onChange={e => setFormData({ ...formData, preliminaryChecks: e.target.value })}
                      placeholder="Chequeos indispensables antes de encender o comenzar (cables, resguardos, 3 puntos de apoyo, etc.)..."
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* 4. Paso a Paso Seguro (Matriz de Control) */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4" /> 4. Pasos Operativos y Medidas de Control
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Paso
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(formData.steps || []).map((step, idx) => (
                      <div
                        key={step.id || idx}
                        className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                            Paso #{step.stepNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Quitar
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={step.activityTitle}
                            onChange={e => handleUpdateStep(idx, 'activityTitle', e.target.value)}
                            placeholder="Título de la acción (Ej: Sujeción de la pieza en morsa)"
                            className="w-full px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-rose-400 font-medium mb-1">
                              Peligro / Riesgo Asociado
                            </label>
                            <textarea
                              rows={2}
                              value={step.hazardRisk}
                              onChange={e => handleUpdateStep(idx, 'hazardRisk', e.target.value)}
                              placeholder="Ej: Atrapamiento o giro violento de la pieza"
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-emerald-400 font-medium mb-1">
                              Medida de Prevención Obligatoria
                            </label>
                            <textarea
                              rows={2}
                              value={step.controlMeasure}
                              onChange={e => handleUpdateStep(idx, 'controlMeasure', e.target.value)}
                              placeholder="Ej: Utilizar mordazas fijas, prohibido sostener con las manos"
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Prohibiciones y Emergencias */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Ban className="w-4 h-4" /> 5. Prohibiciones Expresas y Protocolo de Emergencia
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Prácticas Expresamente Prohibidas
                    </label>
                    <div className="space-y-2 mb-2">
                      {(formData.prohibitions || []).map((proh, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-2 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-xs"
                        >
                          <div className="flex items-start gap-1.5">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <span>{proh}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProhibition(i)}
                            className="text-rose-400 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProhibitionInput}
                        onChange={e => setNewProhibitionInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddProhibition();
                          }
                        }}
                        placeholder="PROHIBIDO operar sin la guarda colocada..."
                        className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddProhibition}
                        className="px-3 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Protocolo de Actuación ante Emergencias y Accidentes
                    </label>
                    <textarea
                      rows={2}
                      value={formData.emergencyProtocol || ''}
                      onChange={e => setFormData({ ...formData, emergencyProtocol: e.target.value })}
                      placeholder="Medidas inmediatas de primeros auxilios y teléfonos de emergencia de ART..."
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* 6. Firmas de Control */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> 6. Firmantes Responsables
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Elaboró (Servicio HyS)</label>
                      <input
                        type="text"
                        value={formData.preparedBy || ''}
                        onChange={e => setFormData({ ...formData, preparedBy: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Revisó (Supervisión)</label>
                      <input
                        type="text"
                        value={formData.reviewedBy || ''}
                        onChange={e => setFormData({ ...formData, reviewedBy: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Aprobó (Dirección / Gerencia)</label>
                      <input
                        type="text"
                        value={formData.approvedBy || ''}
                        onChange={e => setFormData({ ...formData, approvedBy: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Modal Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProcedureModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {editingProcedure ? 'Guardar Cambios' : 'Crear Procedimiento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: ASISTENTE DE PLANTILLAS INTELIGENTES */}
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Plantillas Inteligentes Pre-armadas</h3>
                    <p className="text-xs text-slate-400">Seleccione un modelo para precargar la estructura del procedimiento</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                {Object.entries(PTS_TEMPLATES).map(([key, tmpl]) => (
                  <div
                    key={key}
                    onClick={() => handleApplyTemplate(key)}
                    className="p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 cursor-pointer transition-all flex items-start justify-between gap-4 group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {tmpl.categoryLabel}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                        {tmpl.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {tmpl.objective}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>🛡️ {tmpl.requiredPPE?.length || 0} EPPs sugeridos</span>
                        <span>🚫 {tmpl.prohibitions?.length || 0} prohibiciones</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl bg-amber-500/20 group-hover:bg-amber-500 text-amber-300 group-hover:text-slate-950 font-bold text-xs transition-all shrink-0 mt-1 flex items-center gap-1">
                      Cargar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: REGISTRO DE DIFUSIÓN Y FIRMAS */}
        {showSignModal && activeProcedureForSign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Planilla de Difusión y Toma de Conocimiento</h3>
                    <p className="text-xs text-slate-400">
                      {activeProcedureForSign.code} - {activeProcedureForSign.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSignModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Formulario para añadir trabajador */}
                <form
                  onSubmit={handleAddWorkerSign}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3"
                >
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Registrar Nuevo Trabajador Notificado
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Nombre y Apellido *</label>
                      <input
                        type="text"
                        required
                        value={newWorkerForm.workerName || ''}
                        onChange={e => setNewWorkerForm({ ...newWorkerForm, workerName: e.target.value })}
                        placeholder="Ej: Pérez Juan Carlos"
                        className="w-full px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">DNI / CUIL *</label>
                      <input
                        type="text"
                        required
                        value={newWorkerForm.workerDni || ''}
                        onChange={e => setNewWorkerForm({ ...newWorkerForm, workerDni: e.target.value })}
                        placeholder="Ej: 35.890.123"
                        className="w-full px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Sector / Puesto</label>
                      <input
                        type="text"
                        value={newWorkerForm.sector || ''}
                        onChange={e => setNewWorkerForm({ ...newWorkerForm, sector: e.target.value })}
                        placeholder="Ej: Taller Metalúrgico"
                        className="w-full px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={newWorkerForm.acknowledgedDate || ''}
                        onChange={e => setNewWorkerForm({ ...newWorkerForm, acknowledgedDate: e.target.value })}
                        className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newWorkerForm.signed || false}
                          onChange={e => setNewWorkerForm({ ...newWorkerForm, signed: e.target.checked })}
                          className="rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
                        />
                        Constancia de firma asentada
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30"
                    >
                      Registrar Notificación
                    </button>
                  </div>
                </form>

                {/* Tabla de registros actuales */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Nómina de Personal Notificado ({activeProcedureForSign.acknowledgements?.length || 0})
                    </h4>
                    <button
                      onClick={() => handleDownloadPdf(activeProcedureForSign)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar Planilla en PDF
                    </button>
                  </div>

                  {(!activeProcedureForSign.acknowledgements || activeProcedureForSign.acknowledgements.length === 0) ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">
                      Aún no hay trabajadores registrados en la planilla de difusión para este procedimiento.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Trabajador</th>
                            <th className="py-2.5 px-3">DNI</th>
                            <th className="py-2.5 px-3">Sector</th>
                            <th className="py-2.5 px-3">Fecha</th>
                            <th className="py-2.5 px-3">Firma</th>
                            <th className="py-2.5 px-3 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {activeProcedureForSign.acknowledgements.map((ack, idx) => (
                            <tr key={ack.id} className="hover:bg-slate-800/40">
                              <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                              <td className="py-2 px-3 font-medium text-white">{ack.workerName}</td>
                              <td className="py-2 px-3 text-slate-400 font-mono">{ack.workerDni}</td>
                              <td className="py-2 px-3 text-slate-400">{ack.sector}</td>
                              <td className="py-2 px-3 text-slate-400">{ack.acknowledgedDate}</td>
                              <td className="py-2 px-3">
                                <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Asentada
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => handleRemoveWorkerSign(ack.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: VISTA RÁPIDA (PREVIEW) */}
        {showPreviewModal && activeProcedureForPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {activeProcedureForPreview.code} - {activeProcedureForPreview.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Versión {activeProcedureForPreview.version} | Vigente hasta: {activeProcedureForPreview.nextReviewDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPdf(activeProcedureForPreview)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar PDF
                  </button>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
                <div>
                  <h5 className="font-bold text-indigo-400 uppercase tracking-wider mb-1">Objetivo y Alcance</h5>
                  <p className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                    {activeProcedureForPreview.objective}
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-amber-400 uppercase tracking-wider mb-2">EPP Obligatorio</h5>
                  <div className="flex flex-wrap gap-2">
                    {activeProcedureForPreview.requiredPPE.map((ppe, i) => (
                      <span key={i} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg">
                        🛡️ {ppe}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    Paso a Paso Seguro ({activeProcedureForPreview.steps.length} etapas)
                  </h5>
                  <div className="space-y-2.5">
                    {activeProcedureForPreview.steps.map(step => (
                      <div key={step.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                            {step.stepNumber}
                          </span>
                          {step.activityTitle}
                        </div>
                        <p className="text-rose-400/90 pl-7">
                          <strong>Peligro:</strong> {step.hazardRisk}
                        </p>
                        <p className="text-emerald-400/90 pl-7">
                          <strong>Control:</strong> {step.controlMeasure}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-rose-400 uppercase tracking-wider mb-2">Prohibiciones Expresas</h5>
                  <div className="space-y-1.5">
                    {activeProcedureForPreview.prohibitions.map((proh, i) => (
                      <div key={i} className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{proh}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-cyan-400 uppercase tracking-wider mb-1">Protocolo ante Emergencias</h5>
                  <p className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                    {activeProcedureForPreview.emergencyProtocol}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          isOpen={!!confirmDeleteId}
          title="¿Eliminar Procedimiento?"
          message="Esta acción removerá el PTS de la biblioteca. Las copias PDF ya emitidas conservarán su validez física."
          confirmText="Eliminar Definitivamente"
          onConfirm={handleDeleteProcedure}
          onClose={() => setConfirmDeleteId(null)}
          type="danger"
        />
      </div>
    </AnimatedPage>
  );
}
