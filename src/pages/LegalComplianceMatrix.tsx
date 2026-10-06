import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, Plus, Search, Calendar, FileText, Download,
  Trash2, AlertTriangle, CheckCircle2, ShieldAlert,
  Activity, User, MapPin, Clock, ArrowRight,
  FileSpreadsheet, Eye, X, ShieldCheck, Printer, Check,
  Sparkles, Info, ChevronRight, Ban, Edit3, Filter,
  Building, Zap, Flame, Sun, Volume2, FlaskConical,
  Award, AlertOctagon, HelpCircle
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmModal from '../components/ConfirmModal';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import toast from 'react-hot-toast';
import {
  LegalRequirement,
  ComplianceStatus,
  LegalRequirementCategory,
  CATEGORY_LABELS,
  DEFAULT_LEGAL_REQUIREMENTS
} from '../data/legalMatrixData';
import { generateLegalCompliancePdf } from '../utils/legalMatrixPdfGenerator';

export default function LegalComplianceMatrix(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  // Estados
  const [requirements, setRequirements] = useState<LegalRequirement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReq, setEditingReq] = useState<LegalRequirement | null>(null);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newReqForm, setNewReqForm] = useState<Partial<LegalRequirement>>({
    category: 'instalaciones_edilicia',
    normative: '',
    articles: '',
    jurisdiction: 'nacional',
    title: '',
    obligationDescription: '',
    requiredEvidence: '',
    periodicity: 'anual',
    status: 'conforme',
    evidenceNotes: '',
    actionPlan: '',
    deadlineDate: '',
    responsiblePerson: ''
  });

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfForm, setPdfForm] = useState({
    auditorName: 'Lic. / Ing. Especialista en Higiene y Seguridad',
    auditorLicense: 'COPIME / CIPBA N° 12450',
    establishmentName: 'Planta Principal - Sector Operativo'
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Storage key por empresa
  const storageKey = useMemo(() => {
    return activeCompany ? `legal_matrix_db_${activeCompany.id}` : 'legal_matrix_db_default';
  }, [activeCompany]);

  // Carga inicial
  useEffect(() => {
    window.scrollTo(0, 0);
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setRequirements(JSON.parse(raw));
      } catch (e) {
        setRequirements(DEFAULT_LEGAL_REQUIREMENTS);
      }
    } else {
      setRequirements(DEFAULT_LEGAL_REQUIREMENTS);
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_LEGAL_REQUIREMENTS));
    }
  }, [storageKey]);

  // Guardado
  const saveRequirements = (data: LegalRequirement[]) => {
    setRequirements(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  // Cálculo de Métricas y KPIs
  const metrics = useMemo(() => {
    const applicable = requirements.filter(r => r.status !== 'no_aplica');
    const conformes = applicable.filter(r => r.status === 'conforme').length;
    const noConformes = applicable.filter(r => r.status === 'no_conforme').length;
    const enProceso = applicable.filter(r => r.status === 'en_proceso').length;
    const noAplica = requirements.filter(r => r.status === 'no_aplica').length;

    const complianceRate = applicable.length > 0
      ? Math.round((conformes / applicable.length) * 100)
      : 100;

    const isHighRisk = complianceRate < 65;
    const isModerateRisk = complianceRate >= 65 && complianceRate < 85;

    return {
      total: requirements.length,
      applicableCount: applicable.length,
      conformes,
      noConformes,
      enProceso,
      noAplica,
      complianceRate,
      isHighRisk,
      isModerateRisk
    };
  }, [requirements]);

  // Filtro
  const filteredRequirements = useMemo(() => {
    return requirements.filter(req => {
      if (selectedCategory !== 'all' && req.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && req.status !== selectedStatus) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          req.title.toLowerCase().includes(q) ||
          req.normative.toLowerCase().includes(q) ||
          req.articles.toLowerCase().includes(q) ||
          req.obligationDescription.toLowerCase().includes(q) ||
          (req.evidenceNotes && req.evidenceNotes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [requirements, selectedCategory, selectedStatus, searchTerm]);

  // Cambio rápido de estado
  const handleQuickStatusChange = (reqId: string, nextStatus: ComplianceStatus) => {
    const updated = requirements.map(r => {
      if (r.id === reqId) {
        return { ...r, status: nextStatus };
      }
      return r;
    });
    saveRequirements(updated);
    toast.success(`Estado actualizado a: ${nextStatus.replace('_', ' ').toUpperCase()}`, {
      id: 'quick-status'
    });
  };

  // Edición de evidencia y plan
  const handleOpenEdit = (req: LegalRequirement) => {
    setEditingReq({ ...req });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReq) return;

    const updated = requirements.map(r => r.id === editingReq.id ? editingReq : r);
    saveRequirements(updated);
    toast.success('Requisito legal actualizado');
    setShowEditModal(false);
  };

  // Alta de nuevo requisito personalizado
  const handleSaveNewReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqForm.title || !newReqForm.normative) {
      toast.error('Complete el título y la norma de referencia');
      return;
    }

    const catKey = (newReqForm.category || 'instalaciones_edilicia') as LegalRequirementCategory;
    const catLabel = CATEGORY_LABELS[catKey]?.label || 'General';

    const newReq: LegalRequirement = {
      ...newReqForm,
      id: `req-custom-${Date.now()}`,
      category: catKey,
      categoryLabel: catLabel,
      articles: newReqForm.articles || 'Art. General',
      jurisdiction: newReqForm.jurisdiction || 'nacional',
      title: newReqForm.title,
      obligationDescription: newReqForm.obligationDescription || '',
      requiredEvidence: newReqForm.requiredEvidence || '',
      periodicity: newReqForm.periodicity || 'anual',
      status: newReqForm.status || 'conforme',
      custom: true
    } as LegalRequirement;

    saveRequirements([newReq, ...requirements]);
    toast.success('Requisito legal incorporado a la matriz');
    setShowNewModal(false);
  };

  // Eliminación
  const confirmDelete = () => {
    if (!deleteTargetId) return;
    saveRequirements(requirements.filter(r => r.id !== deleteTargetId));
    toast.success('Requisito eliminado de la matriz');
    setDeleteTargetId(null);
  };

  // Exportar PDF
  const handleDownloadPdf = () => {
    generateLegalCompliancePdf({
      companyName: activeCompany?.name || 'Establecimiento Industrial',
      companyCuit: activeCompany?.cuit || '30-XXXXXXXX-X',
      establishmentName: pdfForm.establishmentName,
      auditorName: pdfForm.auditorName,
      auditorLicense: pdfForm.auditorLicense,
      auditDate: new Date().toISOString().split('T')[0],
      requirements
    });
    toast.success('Informe Oficial de Conformidad Legal generado en PDF');
    setShowPdfModal(false);
  };

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'CATEGORIA',
      'NORMATIVA',
      'ARTICULOS',
      'REQUISITO',
      'FRECUENCIA',
      'ESTADO',
      'EVIDENCIA_OBJETIVA',
      'PLAN_ACCION',
      'PLAZO',
      'RESPONSABLE'
    ];

    const rows = requirements.map(r => [
      `"${r.id}"`,
      `"${r.categoryLabel}"`,
      `"${r.normative}"`,
      `"${r.articles}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.periodicity}"`,
      `"${r.status}"`,
      `"${(r.evidenceNotes || '').replace(/"/g, '""')}"`,
      `"${(r.actionPlan || '').replace(/"/g, '""')}"`,
      `"${r.deadlineDate || ''}"`,
      `"${(r.responsiblePerson || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Matriz_Cumplimiento_Legal_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Matriz exportada a archivo CSV');
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header Premium */}
        <PremiumHeader
          title="Matriz de Cumplimiento Legal"
          subtitle="Evaluación Periódica de Conformidad Legal — ISO 45001:2018 (Cláusula 9.1.2) & Ley N° 19.587"
          badge="ISO 45001 & Ley 19587"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Exportar CSV
            </button>
            <button
              onClick={() => setShowPdfModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Informe Oficial PDF
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Requisito
            </button>
          </div>
        </PremiumHeader>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          {/* Tarjeta de Score Global de Conformidad */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Velocímetro / Porcentaje */}
              <div className="flex items-center gap-6">
                <div className={`w-28 h-28 rounded-2xl flex flex-col items-center justify-center border-4 shadow-inner ${
                  metrics.isHighRisk
                    ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                    : metrics.isModerateRisk
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <span className="text-3xl font-black tracking-tight">{metrics.complianceRate}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Conforme</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      Índice Global de Cumplimiento Legal
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                      metrics.isHighRisk
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : metrics.isModerateRisk
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}>
                      {metrics.isHighRisk ? 'Riesgo Legal Crítico' : metrics.isModerateRisk ? 'Riesgo Medio' : 'Conformidad Satisfactoria'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 max-w-xl">
                    Evaluación sistemática de obligaciones legales aplicables al establecimiento según Decreto 351/79, Resoluciones S.R.T. y Cláusula 9.1.2 de la Norma ISO 45001.
                  </p>

                  <div className="flex items-center gap-3 pt-2 text-xs font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> {metrics.conformes} Conformes
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {metrics.enProceso} En Plan
                    </span>
                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> {metrics.noConformes} No Conformes
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Ban className="w-4 h-4" /> {metrics.noAplica} No Aplica
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón rápido de acción */}
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Descargar Dictamen de Auditoría
                </button>
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por norma, ley, artículo o requisito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro por Categoría */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="all">Todas las Categorías</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>

              {/* Filtro por Estado */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="all">Todos los Estados</option>
                <option value="conforme">Conformes (Cumple)</option>
                <option value="en_proceso">En Proceso (Con Plan)</option>
                <option value="no_conforme">No Conformes (Desvío)</option>
                <option value="no_aplica">No Aplica</option>
              </select>

              {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                  }}
                  className="px-3 py-2 text-xs rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Lista de Requisitos Legales */}
          {filteredRequirements.length === 0 ? (
            <EmptyStateIllustrated
              title="No se encontraron requisitos legales"
              description="No hay requisitos que coincidan con los filtros seleccionados o la búsqueda."
              actionLabel="Ver Todos los Requisitos"
              onAction={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
            />
          ) : (
            <div className="space-y-3">
              {filteredRequirements.map((req) => {
                const isConforme = req.status === 'conforme';
                const isNoConforme = req.status === 'no_conforme';
                const isEnProceso = req.status === 'en_proceso';
                const isNoAplica = req.status === 'no_aplica';

                return (
                  <div
                    key={req.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                      isNoConforme
                        ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20'
                        : isEnProceso
                        ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Información Principal */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {req.categoryLabel}
                          </span>
                          <span className="font-black text-xs text-blue-600 dark:text-blue-400">
                            {req.normative}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            ({req.articles})
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            • Frecuencia: {req.periodicity}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {req.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {req.obligationDescription}
                        </p>

                        {/* Evidencia y Notas cargadas */}
                        <div className="pt-2 text-xs space-y-1">
                          <div className="flex items-start gap-1.5 text-slate-500">
                            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">Prueba Exigida:</span>
                            <span className="text-slate-600 dark:text-slate-400 italic">{req.requiredEvidence}</span>
                          </div>

                          {req.evidenceNotes && (
                            <div className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Evidencia Cargada:</span> {req.evidenceNotes}
                              </div>
                            </div>
                          )}

                          {/* Alerta de Plan de Acción si está en proceso o no cumple */}
                          {(isNoConforme || isEnProceso) && req.actionPlan && (
                            <div className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200 dark:border-amber-900/40">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Plan de Adecuación:</span> {req.actionPlan}
                                {req.deadlineDate && <span className="ml-2 font-bold">(Plazo: {req.deadlineDate})</span>}
                                {req.responsiblePerson && <span className="ml-2">• Resp: {req.responsiblePerson}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selectores de Estado y Acciones */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                        {/* Selector directo de estado con 4 botones */}
                        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(req.id, 'conforme')}
                            title="Marcar Conforme"
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              isConforme
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            Cumple
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(req.id, 'en_proceso')}
                            title="Marcar En Plan de Adecuación"
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              isEnProceso
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            En Plan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(req.id, 'no_conforme')}
                            title="Marcar No Conforme"
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              isNoConforme
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            No Cumple
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(req.id, 'no_aplica')}
                            title="Marcar No Aplica"
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              isNoAplica
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            N/A
                          </button>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(req)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/10 hover:text-blue-600 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Evidencia / Plan
                          </button>

                          {req.custom && (
                            <button
                              onClick={() => setDeleteTargetId(req.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                              title="Eliminar requisito personalizado"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: EDITAR EVIDENCIA Y PLAN DE ACCIÓN */}
        {showEditModal && editingReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 my-8 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Evidencia y Plan de Acción
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {editingReq.normative} — {editingReq.title}
                  </p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Estado de Conformidad
                  </label>
                  <select
                    value={editingReq.status}
                    onChange={(e) => setEditingReq({ ...editingReq, status: e.target.value as ComplianceStatus })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="conforme">CONFORME (Cumple con la exigencia legal)</option>
                    <option value="en_proceso">EN PROCESO (Plan de adecuación en ejecución)</option>
                    <option value="no_conforme">NO CONFORME (Incumplimiento / Falta documental)</option>
                    <option value="no_aplica">NO APLICA (Actividad o instalación no alcanzada)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Evidencia Objetiva / Número de Protocolo / Documento de Respaldo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Protocolo Res. SRT 900/15 N° 451/26 con certificado de calibración vigente del telurímetro."
                    value={editingReq.evidenceNotes || ''}
                    onChange={(e) => setEditingReq({ ...editingReq, evidenceNotes: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>

                {editingReq.status !== 'conforme' && editingReq.status !== 'no_aplica' && (
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-3">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block">
                      Plan de Adecuación Correctivo (ISO 45001):
                    </span>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Acción Correctiva Propuesta
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ej: Gestionar presupuesto para instalación de sistema de detección y alarma contra incendios..."
                        value={editingReq.actionPlan || ''}
                        onChange={(e) => setEditingReq({ ...editingReq, actionPlan: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Fecha Límite de Regularización
                        </label>
                        <input
                          type="date"
                          value={editingReq.deadlineDate || ''}
                          onChange={(e) => setEditingReq({ ...editingReq, deadlineDate: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Responsable de Ejecución
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Mantenimiento / RRHH"
                          value={editingReq.responsiblePerson || ''}
                          onChange={(e) => setEditingReq({ ...editingReq, responsiblePerson: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ALTA DE REQUISITO LEGAL PERSONALIZADO */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 my-8 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-600" />
                  Agregar Requisito Legal a la Matriz
                </h3>
                <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNewReq} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Categoría Temática</label>
                    <select
                      value={newReqForm.category}
                      onChange={(e) => setNewReqForm({ ...newReqForm, category: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Jurisdicción</label>
                    <select
                      value={newReqForm.jurisdiction}
                      onChange={(e) => setNewReqForm({ ...newReqForm, jurisdiction: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="nacional">Nacional (Leyes, Decretos, Res. SRT)</option>
                      <option value="provincial">Provincial (OPDS, Ley 5920 CABA, etc.)</option>
                      <option value="municipal">Municipal / Ordenanza Local</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Normativa (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Ley 5920 CABA / Ordenanza N° 451"
                      value={newReqForm.normative}
                      onChange={(e) => setNewReqForm({ ...newReqForm, normative: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Artículos</label>
                    <input
                      type="text"
                      placeholder="Ej: Arts. 4 a 9"
                      value={newReqForm.articles}
                      onChange={(e) => setNewReqForm({ ...newReqForm, articles: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Título del Requisito (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sistema de Autoprotección y Plan de Evacuación Obligatorio"
                    value={newReqForm.title}
                    onChange={(e) => setNewReqForm({ ...newReqForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Descripción de la Obligación Legal</label>
                  <textarea
                    rows={2}
                    placeholder="Detalle exactamente qué exige la ley al empleador..."
                    value={newReqForm.obligationDescription}
                    onChange={(e) => setNewReqForm({ ...newReqForm, obligationDescription: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Prueba o Evidencia Exigida</label>
                    <input
                      type="text"
                      placeholder="Ej: Disposición de aprobación de Defensa Civil"
                      value={newReqForm.requiredEvidence}
                      onChange={(e) => setNewReqForm({ ...newReqForm, requiredEvidence: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Frecuencia</label>
                    <select
                      value={newReqForm.periodicity}
                      onChange={(e) => setNewReqForm({ ...newReqForm, periodicity: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="anual">Anual</option>
                      <option value="semestral">Semestral</option>
                      <option value="mensual">Mensual</option>
                      <option value="por_evento">Por evento / Cada ingreso</option>
                      <option value="permanente">Permanente</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    Guardar Requisito
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DESCARGAR INFORME OFICIAL PDF */}
        {showPdfModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-600" />
                  Emitir Dictamen Oficial de Auditoría Legal
                </h3>
                <button onClick={() => setShowPdfModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Auditor / Responsable Técnico HyS
                  </label>
                  <input
                    type="text"
                    value={pdfForm.auditorName}
                    onChange={(e) => setPdfForm({ ...pdfForm, auditorName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Matrícula y Colegio Profesional
                  </label>
                  <input
                    type="text"
                    value={pdfForm.auditorLicense}
                    onChange={(e) => setPdfForm({ ...pdfForm, auditorLicense: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Establecimiento / Planta Auditada
                  </label>
                  <input
                    type="text"
                    value={pdfForm.establishmentName}
                    onChange={(e) => setPdfForm({ ...pdfForm, establishmentName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Descargar PDF Oficial
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmación Borrado */}
        <ConfirmModal
          isOpen={!!deleteTargetId}
          title="¿Eliminar requisito de la matriz?"
          message="Esta acción quitará el requisito de las evaluaciones futuras."
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      </div>
    </AnimatedPage>
  );
}
