import React, { useState, useEffect, useMemo } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, FileText, AlertCircle, GraduationCap, ClipboardCheck,
  Package, Plus, Trash2, History, Share2, Printer, Clock, Edit2, CheckCircle2,
  Download, Calendar, X, Copy, Eye, Building2, User, Sparkles, Filter,
  FileCheck, ShieldAlert, Award, FileSpreadsheet
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import toast from 'react-hot-toast';
import PhotoAttachments from '../components/PhotoAttachments';
import CompanyLogo from '../components/CompanyLogo';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PremiumHeader from '../components/PremiumHeader';
import { DataTable } from '../components/DataTable';
import { ModuleActionBar } from '../components/module/ModuleActionBar';

import ShareModal from '../components/ShareModal';
import ProfessionalReportPdfGenerator from '../components/ProfessionalReportPdfGenerator';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { printElementAsDocument } from '../utils/pdfHelper';
import ReportRichEditor from '../components/reports/ReportRichEditor';
import ReportPreviewModal from '../components/reports/ReportPreviewModal';

class ReportErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', margin: '2rem', borderRadius: '12px' }}>
          <h2>Algo salió mal al abrir el formulario:</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{this.state.error?.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#dc2626', color: 'white', borderRadius: '6px' }}>Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar informe?"
      message="Esta acción no se puede deshacer. Se eliminará del historial local y de la nube."
      iconEmoji="🗑️"
    />
  );
}

export default function Reports(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { syncCollection } = useSync();

  // Core state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [shareItem, setShareItem] = useState<any>(null);
  const [filterTemplate, setFilterTemplate] = useState<string>('all');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Form state
  const [template, setTemplate] = useState('general'); // general, accident, training, rgrl, epp
  const [projectData, setProjectData] = useState<{
    id?: number | string;
    title: string;
    company: string;
    location: string;
    date: string;
    responsable: string;
  }>({
    title: '',
    company: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    responsable: ''
  });

  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [extraFields, setExtraFields] = useState<Record<string, any>>({});
  const [personnel, setPersonnel] = useState(() => [{ id: Date.now(), name: '', dni: '' }]);

  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });
  const [operatorSignature, setOperatorSignature] = useState('');
  const [signature, setSignature] = useState('');
  const [supervisorSignature, setSupervisorSignature] = useState('');
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [professional, setProfessional] = useState({ name: '', license: '', signature: null as string | null, stamp: null as string | null });

  const loadHistory = () => {
    try {
      const hist = JSON.parse(localStorage.getItem('reports_history') || '[]');
      setReportsHistory(Array.isArray(hist) ? hist : []);
    } catch {
      setReportsHistory([]);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadHistory();

    if (location.state?.editData) {
      setIsFormVisible(true);
      const data = location.state.editData;
      setTemplate(data.template || 'general');
      setProjectData({
        id: data.id,
        title: data.title || '',
        company: data.company || '',
        location: data.location || '',
        date: data.date || new Date().toISOString().split('T')[0],
        responsable: data.responsable || ''
      });
      setContent(data.content || '');
      setExtraFields(data.extraFields || {});
      setPhotos(data.photos || []);
      if (data.personnel && data.personnel.length > 0) {
        setPersonnel(data.personnel);
      }
      if (data.showSignatures !== undefined) {
        if (typeof data.showSignatures === 'object') setShowSignatures(data.showSignatures);
        else if (typeof data.showSignatures === 'boolean') setShowSignatures({ operator: data.showSignatures, supervisor: data.showSignatures, professional: data.showSignatures });
      }
      setOperatorSignature(data.operatorSignature || '');
      setSignature(data.signature || '');
      setSupervisorSignature(data.supervisorSignature || '');
    } else {
      const savedProfile = localStorage.getItem('personalData');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProjectData((prev) => ({ ...prev, responsable: parsed.name || '' }));

        const sd = localStorage.getItem('signatureStampData');
        const lg = localStorage.getItem('capturedSignature');
        let sig = lg || null;
        let stamp = null;
        if (sd) {
          const p = JSON.parse(sd);
          sig = p.signature || sig;
          stamp = p.stamp || null;
        }
        setProfessional({ name: parsed.name, license: parsed.license, signature: sig, stamp });
      }
    }
  }, [location.state]);

  // Métricas calculadas para el dashboard
  const metrics = useMemo(() => {
    const total = reportsHistory.length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonth = reportsHistory.filter(r => {
      const d = new Date(r.createdAt || r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const companies = new Set(reportsHistory.map(r => r.company?.trim()).filter(Boolean)).size;

    // Conteo por plantilla
    const templateCounts: Record<string, number> = {};
    reportsHistory.forEach(r => {
      const t = r.template || 'general';
      templateCounts[t] = (templateCounts[t] || 0) + 1;
    });

    let topTemplate = 'General';
    let maxCount = 0;
    Object.entries(templateCounts).forEach(([tpl, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topTemplate = tpl === 'accident' ? 'Accidentes' : tpl === 'training' ? 'Capacitaciones' : tpl === 'rgrl' ? 'RGRL' : tpl === 'epp' ? 'EPP' : 'Técnico';
      }
    });

    return { total, thisMonth, companies, topTemplate };
  }, [reportsHistory]);

  // Filtrado de historial
  const filteredHistory = useMemo(() => {
    if (filterTemplate === 'all') return reportsHistory;
    return reportsHistory.filter(r => (r.template || 'general') === filterTemplate);
  }, [reportsHistory, filterTemplate]);

  const handleDirectPrintFromHistory = async (item: any) => {
    setPrintData(item);
    setIsPrinting(true);
    const toastId = toast.loading('Preparando impresión del informe...');
    try {
      await new Promise((r) => setTimeout(r, 400));
      const element = document.getElementById('pdf-direct-print');
      if (!element) {
        throw new Error('No se pudo generar el documento para imprimir.');
      }
      await printElementAsDocument('pdf-direct-print', `Informe - ${item.title || 'Profesional'}`, false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('[Reports] Error al imprimir:', err);
      toast.dismiss(toastId);
      const element = document.getElementById('pdf-direct-print');
      if (element) {
        document.body.classList.add('printing-isolated');
        element.classList.add('isolated-print-target');
      }
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-isolated');
        if (element) element.classList.remove('isolated-print-target');
      }, 1000);
    } finally {
      setIsPrinting(false);
      setTimeout(() => {
        setPrintData(null);
      }, 1500);
    }
  };

  const handlePrintFromForm = async () => {
    const data = {
      id: projectData.id || Date.now(),
      template,
      ...projectData,
      content,
      extraFields,
      photos,
      personnel: template === 'training' || template === 'epp' ? personnel : [],
      createdAt: new Date().toISOString(),
      showSignatures,
      operatorSignature,
      signature,
      supervisorSignature,
      professionalSignature: professional?.signature,
      professionalName: professional?.name,
      professionalLicense: professional?.license
    };

    setPrintData(data);
    setIsPrinting(true);
    const toastId = toast.loading('Preparando impresión...');
    try {
      await new Promise((r) => setTimeout(r, 400));
      const element = document.getElementById('pdf-direct-print');
      if (!element) {
        throw new Error('No se pudo generar el documento para imprimir.');
      }
      await printElementAsDocument('pdf-direct-print', `Informe - ${projectData.title || 'Profesional'}`, false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('[Reports] Error al imprimir:', err);
      toast.dismiss(toastId);
      const element = document.getElementById('pdf-direct-print');
      if (element) {
        document.body.classList.add('printing-isolated');
        element.classList.add('isolated-print-target');
      }
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-isolated');
        if (element) element.classList.remove('isolated-print-target');
      }, 1000);
    } finally {
      setIsPrinting(false);
      setTimeout(() => {
        setPrintData(null);
      }, 1500);
    }
  };

  const handleOpenPreview = () => {
    const data = {
      id: projectData.id || Date.now(),
      template,
      ...projectData,
      content,
      extraFields,
      photos,
      personnel: template === 'training' || template === 'epp' ? personnel : [],
      createdAt: new Date().toISOString(),
      showSignatures,
      operatorSignature,
      signature,
      supervisorSignature,
      professionalSignature: professional?.signature,
      professionalName: professional?.name,
      professionalLicense: professional?.license
    };
    setPreviewData(data);
    setPreviewModalOpen(true);
  };

  const handleDuplicateReport = (item: any) => {
    setProjectData({
      title: `${item.title || 'Informe'} (Copia)`,
      company: item.company || '',
      location: item.location || '',
      date: new Date().toISOString().split('T')[0],
      responsable: professional?.name || item.responsable || ''
    });
    setTemplate(item.template || 'general');
    setContent(item.content || '');
    setExtraFields(item.extraFields ? { ...item.extraFields } : {});
    setPhotos([]); // Se limpian fotos para nueva inspección
    if (item.personnel && item.personnel.length > 0) {
      setPersonnel(item.personnel.map((p: any) => ({ ...p, id: Date.now() + Math.random() })));
    } else {
      setPersonnel([{ id: Date.now(), name: '', dni: '' }]);
    }
    setShowSignatures(item.showSignatures || { operator: true, supervisor: true, professional: true });
    setOperatorSignature('');
    setSignature('');
    setSupervisorSignature('');
    setIsFormVisible(true);
    toast.success('Informe duplicado como nuevo borrador.');
  };

  const handleExportCSV = () => {
    if (reportsHistory.length === 0) {
      toast.error('No hay informes registrados para exportar.');
      return;
    }

    const headers = ['ID', 'Fecha', 'Titulo', 'Empresa', 'Ubicacion', 'Tipo', 'Responsable'];
    const rows = reportsHistory.map(r => [
      `"${r.id || ''}"`,
      `"${new Date(r.createdAt || r.date).toLocaleDateString('es-AR')}"`,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.company || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${(r.template || 'general').toUpperCase()}"`,
      `"${(r.responsable || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Historial_Informes_HYS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Historial exportado en formato CSV / Excel');
  };

  const handleAddPerson = () => {
    setPersonnel([...personnel, { id: Date.now(), name: '', dni: '' }]);
  };

  const handleRemovePerson = (id: any) => {
    if (personnel.length > 1) {
      setPersonnel(personnel.filter((p) => p.id !== id));
    }
  };

  const handlePersonChange = (id: any, field: string, value: string) => {
    setPersonnel(personnel.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    if (!projectData.title || !projectData.company) {
      toast.error('Por favor, complete al menos el título y la empresa.');
      return;
    }

    const entryId = projectData.id || Date.now();
    const newReport = {
      id: entryId,
      template,
      ...projectData,
      content,
      extraFields,
      photos,
      personnel: template === 'training' || template === 'epp' ? personnel : [],
      createdAt: new Date().toISOString(),
      showSignatures,
      operatorSignature,
      signature,
      supervisorSignature
    };

    const history = JSON.parse(localStorage.getItem('reports_history') || '[]');
    let updated;
    if (projectData.id) {
      updated = history.map((h: any) => h.id === entryId ? newReport : h);
    } else {
      updated = [newReport, ...history];
    }

    await syncCollection('reports_history', updated);
    localStorage.setItem('reports_history', JSON.stringify(updated));
    localStorage.setItem('current_report', JSON.stringify(newReport));
    setReportsHistory(updated);
    toast.success('Informe guardado con éxito');
    setIsFormVisible(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const current = JSON.parse(localStorage.getItem('reports_history') || '[]');
    const updated = current.filter((item: any) => String(item.id) !== String(deleteTarget));
    localStorage.setItem('reports_history', JSON.stringify(updated));
    syncCollection('reports_history', updated);
    setReportsHistory(updated);
    setDeleteTarget(null);
    toast.success('Informe eliminado del registro.');
  };

  const templates = [
    { id: 'general', label: 'Informe Técnico', desc: 'Relevamiento general de condiciones de seguridad', icon: <FileText size={22} />, color: '#3b82f6' },
    { id: 'accident', label: 'Incidente / Accidente', desc: 'Investigación con análisis de causas inmediatas y básicas', icon: <AlertCircle size={22} />, color: '#ef4444' },
    { id: 'training', label: 'Capacitación', desc: 'Registro de charla con nómina de participantes y firma', icon: <GraduationCap size={22} />, color: '#10b981' },
    { id: 'rgrl', label: 'RGRL', desc: 'Protocolo de Relevamiento General de Riesgos Laborales', icon: <ClipboardCheck size={22} />, color: '#f59e0b' },
    { id: 'epp', label: 'Entrega EPP', desc: 'Constancia de entrega y reposición de protección personal', icon: <Package size={22} />, color: '#8b5cf6' }
  ];

  // ==========================================
  // VISTA 1: DASHBOARD E HISTORIAL DE INFORMES
  // ==========================================
  if (!isFormVisible) {
    return (
      <div className="container min-h-[100vh] bg-[var(--color-background)] pb-[7rem] pt-[5.5rem]">
        {/* Contenedor offscreen para impresión vectorizada */}
        <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
          {printData && <ProfessionalReportPdfGenerator currentReport={printData} customId="pdf-direct-print" />}
        </div>

        <PremiumHeader
          title="Módulo de Informes Técnicos"
          subtitle="Redacción profesional con formato tipo Word, impresión garantizada y archivo digital."
          icon={<FileText size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
        />

        {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
        
        {/* Modal para previsualizar documento en tamaño real */}
        <ReportPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          reportData={previewData}
          onPrint={() => {
            setPreviewModalOpen(false);
            if (previewData) handleDirectPrintFromHistory(previewData);
          }}
        />

        {/* Modal de Compartir */}
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Informe - ${shareItem?.data?.title || ''}`}
          text={shareItem ? `📄 Informe Profesional de Higiene y Seguridad\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}\n📅 ${new Date(shareItem.data.createdAt || shareItem.data.date).toLocaleDateString('es-AR')}` : ''}
          rawMessage={shareItem ? `📄 Informe Profesional de Higiene y Seguridad\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}` : ''}
          elementIdToPrint="pdf-content"
          fileName={`Informe_${shareItem?.data?.title || 'Profesional'}.pdf`}
        />

        <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
          {shareItem?.type === 'report' && <ProfessionalReportPdfGenerator currentReport={shareItem.data} />}
        </div>

        <main className="p-0 max-w-[1100px] mx-auto w-full px-4">
          
          {/* TARJETAS DE MÉTRICAS EJECUTIVAS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-900 dark:text-slate-200 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-black dark:text-slate-100">Total Informes</span>
                <div className="p-1.5 rounded-lg bg-amber-500 text-black font-bold shadow-xs">
                  <FileCheck size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-black dark:text-white" style={{ color: '#000000' }}>{metrics.total}</div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-300 mt-1">Registrados en el sistema</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-900 dark:text-slate-200 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-black dark:text-slate-100">Este Mes</span>
                <div className="p-1.5 rounded-lg bg-blue-600 text-white font-bold shadow-xs">
                  <Calendar size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-black dark:text-white" style={{ color: '#000000' }}>{metrics.thisMonth}</div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-300 mt-1 capitalize">Generados en {new Date().toLocaleDateString('es-AR', { month: 'long' })}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-900 dark:text-slate-200 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-black dark:text-slate-100">Empresas</span>
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold shadow-xs">
                  <Building2 size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-black dark:text-white" style={{ color: '#000000' }}>{metrics.companies}</div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-300 mt-1">Clientes auditados</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-900 dark:text-slate-200 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-black dark:text-slate-100">Más Frecuente</span>
                <div className="p-1.5 rounded-lg bg-purple-600 text-white font-bold shadow-xs">
                  <Award size={18} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-black dark:text-white truncate" style={{ color: '#000000' }}>{metrics.topTemplate}</div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-300 mt-1">Tipo de informe principal</span>
            </div>
          </div>

          {/* BARRA DE ACCIÓN PRINCIPAL */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-sm">
            {/* Píldoras de Filtro por tipo de informe */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'general', label: 'Técnico' },
                { id: 'accident', label: 'Accidente' },
                { id: 'training', label: 'Capacitación' },
                { id: 'rgrl', label: 'RGRL' },
                { id: 'epp', label: 'EPP' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTemplate(tab.id)}
                  style={{
                    backgroundColor: filterTemplate === tab.id ? '#f59e0b' : '#e2e8f0',
                    color: '#0f172a',
                    minHeight: 'unset'
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                    filterTemplate === tab.id
                      ? 'shadow-md shadow-amber-500/25 border-2 border-amber-600'
                      : 'hover:bg-slate-300 border border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                onClick={handleExportCSV}
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  minHeight: 'unset'
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 hover:opacity-90 font-black border border-emerald-700 rounded-xl text-xs transition-all shadow-md cursor-pointer active:scale-95"
                title="Descargar listado en formato Excel / CSV"
              >
                <FileSpreadsheet size={16} color="#ffffff" className="stroke-[2.5]" /> EXCEL
              </button>

              <button
                onClick={() => {
                  setProjectData({
                    title: '',
                    company: '',
                    location: '',
                    date: new Date().toISOString().split('T')[0],
                    responsable: professional?.name || ''
                  });
                  setContent('');
                  setPhotos([]);
                  setTemplate('general');
                  setPersonnel([{ id: Date.now(), name: '', dni: '' }]);
                  setShowSignatures({ operator: true, supervisor: true, professional: true });
                  setOperatorSignature('');
                  setSignature('');
                  setSupervisorSignature('');
                  setExtraFields({});
                  setIsFormVisible(true);
                }}
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#000000',
                  minHeight: 'unset'
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 hover:opacity-90 rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border-2 border-amber-600"
              >
                <Plus size={18} color="#000000" className="stroke-[3]" /> NUEVO INFORME
              </button>
            </div>
          </div>

          {/* TABLA DE HISTORIAL CON DATATABLE */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
            <DataTable
              data={filteredHistory}
              searchPlaceholder="Buscar por título, empresa o responsable..."
              searchFields={['title', 'company', 'responsable']}
              emptyMessage="No se encontraron informes con los filtros aplicados."
              emptyIcon={<FileText size={48} className="text-slate-400 dark:text-slate-600" />}
              columns={[
                {
                  header: 'Fecha',
                  accessor: 'createdAt',
                  sortable: true,
                  render: (item: any) => (
                    <span className="flex items-center gap-1.5 text-xs text-black dark:text-slate-100 font-extrabold whitespace-nowrap">
                      <Calendar size={14} className="text-amber-600 shrink-0 stroke-[2.5]" /> 
                      {new Date(item.createdAt || item.date).toLocaleDateString('es-AR')}
                    </span>
                  )
                },
                {
                  header: 'Título y Tipo',
                  accessor: 'title',
                  sortable: true,
                  render: (item: any) => {
                    const tpl = templates.find(t => t.id === (item.template || 'general'));
                    return (
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white"
                          style={{
                            backgroundColor: tpl?.color || '#3b82f6'
                          }}
                        >
                          <FileText size={20} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-black dark:text-white text-sm hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-2">
                            {item.title || 'Sin Título'}
                          </div>
                          <div className="text-[11px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider mt-0.5">
                            {tpl?.label || 'INFORME GENERAL'}
                          </div>
                        </div>
                      </div>
                    );
                  }
                },
                {
                  header: 'Empresa / Ubicación',
                  accessor: 'company',
                  sortable: true,
                  render: (item: any) => (
                    <div>
                      <div className="font-black text-black dark:text-white text-sm">
                        {item.company || '-'}
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-300 flex items-center gap-1 mt-0.5 font-bold">
                        <Building2 size={13} className="text-slate-600 dark:text-slate-400 shrink-0 stroke-[2.2]" /> 
                        <span>{item.location || 'Sede principal'}</span>
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Acciones',
                  accessor: 'id',
                  render: (item: any) => (
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <button
                        onClick={() => {
                          setPreviewData(item);
                          setPreviewModalOpen(true);
                        }}
                        style={{
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          minHeight: 'unset'
                        }}
                        title="Vista Previa A4"
                        className="p-2 rounded-xl hover:opacity-90 border border-sky-700 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Eye size={16} color="#ffffff" className="stroke-[2.5]" />
                      </button>

                      <button
                        onClick={() => handleDirectPrintFromHistory(item)}
                        style={{
                          backgroundColor: '#7c3aed',
                          color: '#ffffff',
                          minHeight: 'unset'
                        }}
                        title="Imprimir / Descargar PDF"
                        className="px-2.5 py-2 rounded-xl hover:opacity-90 border border-purple-700 transition-all shadow-sm cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95"
                      >
                        <Printer size={16} color="#ffffff" className="stroke-[2.5]" />
                        <span style={{ color: '#ffffff' }} className="text-[11px] font-black tracking-wide">PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/reports', { state: { editData: item } });
                          setIsFormVisible(true);
                        }}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: '#000000',
                          minHeight: 'unset'
                        }}
                        title="Editar Informe"
                        className="p-2 rounded-xl hover:opacity-90 border border-amber-600 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Edit2 size={16} color="#000000" className="stroke-[2.5]" />
                      </button>

                      <button
                        onClick={() => handleDuplicateReport(item)}
                        style={{
                          backgroundColor: '#4f46e5',
                          color: '#ffffff',
                          minHeight: 'unset'
                        }}
                        title="Duplicar como nuevo borrador"
                        className="p-2 rounded-xl hover:opacity-90 border border-indigo-700 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Copy size={16} color="#ffffff" className="stroke-[2.5]" />
                      </button>

                      <button
                        onClick={() => setShareItem({ type: 'report', data: item })}
                        style={{
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          minHeight: 'unset'
                        }}
                        title="Compartir (WhatsApp / Email)"
                        className="p-2 rounded-xl hover:opacity-90 border border-emerald-700 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Share2 size={16} color="#ffffff" className="stroke-[2.5]" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item.id);
                        }}
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          minHeight: 'unset'
                        }}
                        title="Eliminar Informe"
                        className="p-2 rounded-xl hover:opacity-90 border border-rose-700 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Trash2 size={16} color="#ffffff" className="stroke-[2.5]" />
                      </button>
                    </div>
                  )
                }
              ]}
            />
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: FORMULARIO Y EDITOR TIPO WORD
  // ==========================================
  return (
    <ReportErrorBoundary>
      <div className="min-h-[100vh] bg-[var(--color-background)] pb-[6rem] pt-[5.5rem]">
        {/* Contenedor offscreen para impresión */}
        <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
          {shareItem?.type === 'report' && <ProfessionalReportPdfGenerator currentReport={shareItem.data} />}
          {printData && <ProfessionalReportPdfGenerator currentReport={printData} customId="pdf-direct-print" />}
        </div>

        {/* Modal de Previsualización */}
        <ReportPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          reportData={previewData}
          onPrint={() => {
            setPreviewModalOpen(false);
            handlePrintFromForm();
          }}
        />

        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Informe - ${shareItem?.data?.title || ''}`}
          text={shareItem ? `📄 Informe Profesional\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}\n📅 ${new Date(shareItem.data.createdAt || shareItem.data.date).toLocaleDateString('es-AR')}` : ''}
          rawMessage={shareItem ? `📄 Informe Profesional\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}` : ''}
          elementIdToPrint="pdf-content"
          fileName={`Informe_${shareItem?.data?.title || 'Profesional'}.pdf`}
        />

        <PremiumHeader
          onBack={() => setIsFormVisible(false)}
          title={projectData.id ? 'Editando Informe Técnico' : 'Nuevo Informe Técnico'}
          subtitle="Redacción profesional con editor enriquecido, espaciado de renglones y firmas digitales."
          icon={<FileText size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
        />

        <main className="p-4 sm:p-6 max-w-[1100px] mx-auto">
          {/* BARRA DE ACCIÓN PRINCIPAL DEL FORMULARIO */}
          <div className="mb-6">
            <ModuleActionBar
              actions={[
                {
                  id: 'cancel',
                  label: 'VOLVER',
                  icon: <X size={18} />,
                  variant: 'secondary',
                  onClick: () => setIsFormVisible(false)
                },
                {
                  id: 'preview',
                  label: 'PREVISUALIZAR',
                  icon: <Eye size={18} />,
                  variant: 'info',
                  onClick: handleOpenPreview
                },
                {
                  id: 'share',
                  label: 'COMPARTIR',
                  icon: <Share2 size={18} />,
                  variant: 'info',
                  onClick: () => {
                    const data = {
                      id: projectData.id || Date.now(),
                      template,
                      ...projectData,
                      content,
                      extraFields,
                      photos,
                      personnel: template === 'training' || template === 'epp' ? personnel : [],
                      createdAt: new Date().toISOString(),
                      showSignatures,
                      operatorSignature,
                      signature,
                      supervisorSignature,
                      professionalSignature: professional?.signature,
                      professionalName: professional?.name,
                      professionalLicense: professional?.license
                    };
                    setShareItem({ type: 'report', data });
                  }
                },
                {
                  id: 'print',
                  label: 'IMPRIMIR PDF',
                  icon: <Printer size={18} />,
                  variant: 'warning',
                  onClick: handlePrintFromForm
                },
                {
                  id: 'save',
                  label: 'GUARDAR',
                  icon: <Save size={18} />,
                  variant: 'primary',
                  onClick: () => requirePro(handleSave)
                }
              ]}
            />
          </div>

          {/* SELECTOR DE PLANTILLAS CON DISEÑO MEJORADO */}
          <div className="mb-8">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Tipo de Documento / Plantilla Base
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {templates.map((t) => {
                const isSelected = template === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setTemplate(t.id);
                      if ((t.id === 'training' || t.id === 'epp') && personnel.length === 0) {
                        setPersonnel([{ id: Date.now(), name: '', dni: '' }]);
                      }
                    }}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center text-center border ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/15 scale-[1.02]'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl mb-2 transition-colors ${
                        isSelected ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.icon}
                    </div>
                    <div className={`text-xs font-bold ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DATOS GENERALES */}
          <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md">
            <h3 className="text-amber-600 dark:text-amber-400 font-black text-base uppercase tracking-wider flex items-center gap-2 mb-6">
              <FileText size={20} /> Datos Generales del Informe
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="md:col-span-2">
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Título del Informe
                </label>
                <input
                  type="text"
                  value={projectData.title}
                  onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                  placeholder="Ej: Relevamiento de Condiciones de Seguridad e Higiene"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Empresa / Cliente
                </label>
                <input
                  type="text"
                  value={projectData.company}
                  onChange={(e) => setProjectData({ ...projectData, company: e.target.value })}
                  placeholder="Nombre de la empresa o cliente"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Ubicación / Planta / Sector
                </label>
                <input
                  type="text"
                  value={projectData.location}
                  onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                  placeholder="Ej: Sede Central / Depósito Logístico"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Fecha del Relevamiento
                </label>
                <input
                  type="date"
                  value={projectData.date}
                  onChange={(e) => setProjectData({ ...projectData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Profesional Actuante
                </label>
                <input
                  type="text"
                  value={projectData.responsable}
                  onChange={(e) => setProjectData({ ...projectData, responsable: e.target.value })}
                  placeholder="Nombre y apellido del profesional"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors outline-none shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* CAMPOS ESPECÍFICOS PARA ACCIDENTES O CAPACITACIONES */}
          {template === 'training' && (
            <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md">
              <h3 className="text-emerald-600 dark:text-emerald-400 font-black text-base uppercase tracking-wider flex items-center gap-2 mb-4">
                <GraduationCap size={20} /> Datos de la Capacitación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Tema Central de Capacitación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Uso seguro de extintores y plan de evacuación"
                    value={extraFields.topic || ''}
                    onChange={(e) => setExtraFields({ ...extraFields, topic: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-none shadow-xs"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    placeholder="60"
                    value={extraFields.duration || ''}
                    onChange={(e) => setExtraFields({ ...extraFields, duration: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-emerald-500 outline-none shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {template === 'accident' && (
            <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md">
              <h3 className="text-red-600 dark:text-red-400 font-black text-base uppercase tracking-wider flex items-center gap-2 mb-4">
                <AlertCircle size={20} /> Datos del Incidente / Accidente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Hora del Evento
                  </label>
                  <input
                    type="time"
                    value={extraFields.eventTime || ''}
                    onChange={(e) => setExtraFields({ ...extraFields, eventTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-red-500 outline-none shadow-xs"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Trabajador / Persona Afectada
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo del damnificado"
                    value={extraFields.affectedPerson || ''}
                    onChange={(e) => setExtraFields({ ...extraFields, affectedPerson: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-red-500 outline-none shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* NÓMINA DE PERSONAL INTERVINIENTE (CAPACITACIÓN / ENTREGA EPP) */}
          {(template === 'training' || template === 'epp') && (
            <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Nómina de Personal Interviniente / Firmas
                </label>
                <button
                  type="button"
                  onClick={handleAddPerson}
                  className="px-3.5 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-amber-300 dark:border-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus size={14} className="stroke-[2.5]" /> Añadir Persona
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {personnel.map((p) => (
                  <div key={p.id} className="flex gap-2 sm:gap-4 items-center">
                    <div className="flex-[2]">
                      <input
                        type="text"
                        placeholder="Nombre completo del trabajador"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none shadow-xs"
                        value={p.name}
                        onChange={(e) => handlePersonChange(p.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="flex-[1]">
                      <input
                        type="text"
                        placeholder="DNI / CUIL"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:border-amber-500 outline-none shadow-xs"
                        value={p.dni}
                        onChange={(e) => handlePersonChange(p.id, 'dni', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePerson(p.id)}
                      disabled={personnel.length === 1}
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
                      title="Eliminar fila"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN DEL EDITOR DE TEXTO ENRIQUECIDO TIPO WORD */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="block text-sm font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Desarrollo del Informe (Editor Tipo Word)
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Utilice la barra para formatear letras, colores, insertar tablas, avisos y dejar renglones.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-800 dark:text-slate-300 bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-sky-300 dark:border-slate-700 rounded-xl transition-colors cursor-pointer w-fit shadow-xs"
              >
                <Eye size={14} className="text-sky-600 dark:text-amber-400 stroke-[2.2]" /> Vista Previa A4
              </button>
            </div>

            {/* EDITOR ENRIQUECIDO */}
            <ReportRichEditor
              value={content}
              onChange={setContent}
              templateType={template}
              placeholder="Comience a redactar su informe aquí. Puede aplicar negrita, títulos, cambiar fuentes, colores, insertar tablas y dejar renglones..."
            />
          </div>

          {/* FOTOS DE EVIDENCIA */}
          <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md">
            <PhotoAttachments
              photos={photos}
              onChange={setPhotos}
              maxPhotos={8}
              label="Registro Fotográfico de Evidencia"
            />
          </div>

          {/* FIRMAS Y AUTORIZACIONES */}
          <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md">
            <h3 className="text-amber-600 dark:text-amber-400 font-black text-base uppercase tracking-wider flex items-center gap-2 mb-6">
              ✍️ Firmas Digitales y Sellos
            </h3>

            {/* Conmutadores de firmas a incluir */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Firmas a incluir en el documento impreso:
              </span>
              <div className="flex gap-2 flex-wrap justify-center">
                {[
                  { id: 'operator', label: 'Operador / Trabajador' },
                  { id: 'supervisor', label: 'Supervisor' },
                  { id: 'professional', label: 'Profesional HYS' }
                ].map((sig) => {
                  const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                  return (
                    <label
                      key={sig.id}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border ${
                        isChecked
                          ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setShowSignatures((s) => ({ ...s, [sig.id]: e.target.checked }))}
                        className="hidden"
                      />
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${isChecked ? 'bg-amber-500 border-amber-500' : 'border-slate-400 dark:border-slate-500'}`}>
                        {isChecked && <CheckCircle2 size={10} className="text-slate-950 font-bold" />}
                      </div>
                      {sig.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Previsualización de los bloques de firma */}
            <div className="mb-8 p-4 rounded-xl bg-white border border-slate-200">
              <PdfSignatures
                data={{
                  ...projectData,
                  professionalSignature: professional?.signature,
                  professionalName: professional?.name,
                  professionalLicense: professional?.license
                }}
                box1={showSignatures?.operator ? {
                  title: 'OPERADOR',
                  subtitle: 'Firma / Aclaración',
                  signatureUrl: operatorSignature || null,
                  isProfessional: false
                } : null}
                box2={showSignatures?.supervisor ? {
                  title: 'SUPERVISOR',
                  subtitle: 'Firma / Aclaración',
                  signatureUrl: supervisorSignature || null,
                  isProfessional: false
                } : null}
                box3={showSignatures?.professional ? {
                  title: 'PROFESIONAL ACTUANTE',
                  subtitle: (professional?.name || 'Firma y Sello').toUpperCase(),
                  signatureUrl: signature || professional?.signature || null,
                  isProfessional: true,
                  license: professional?.license
                } : null}
              />
              <PdfBrandingFooter />
            </div>

            {/* PADS DE DIBUJO DE FIRMAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {showSignatures?.operator && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <SignatureCanvas
                    onSave={(sig) => setOperatorSignature(sig || '')}
                    initialImage={operatorSignature}
                    title="Firma Operador"
                  />
                </div>
              )}
              {showSignatures?.supervisor && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <SignatureCanvas
                    onSave={(sig) => setSupervisorSignature(sig || '')}
                    initialImage={supervisorSignature}
                    title="Firma Supervisor"
                  />
                </div>
              )}
              {showSignatures?.professional && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <SignatureCanvas
                    onSave={(sig) => setSignature(sig || '')}
                    initialImage={signature}
                    title="Firma Profesional"
                  />
                </div>
              )}
            </div>
          </div>

          {/* BARRA DE ACCIÓN INFERIOR */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl">
            <button
              type="button"
              onClick={() => setIsFormVisible(false)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleOpenPreview}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-400 border border-sky-300 dark:border-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
              >
                <Eye size={18} className="stroke-[2.2]" /> Previsualizar
              </button>
              <button
                type="button"
                onClick={handlePrintFromForm}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
              >
                <Printer size={18} className="stroke-[2.2]" /> Imprimir PDF
              </button>
              <button
                type="button"
                onClick={() => requirePro(handleSave)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
              >
                <Save size={18} className="stroke-[2.2]" /> Guardar
              </button>
            </div>
          </div>
        </main>
      </div>
    </ReportErrorBoundary>
  );
}