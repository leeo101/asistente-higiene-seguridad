import React, { useState, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, FileText, AlertCircle, GraduationCap, ClipboardCheck, Package, Plus, Trash2, History, Share2, Printer, Clock, Edit2, CheckCircle2, Download, Calendar, X } from 'lucide-react';
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
import { generatePdfBlob } from '../utils/pdfHelper';

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem 1rem',
  borderRadius: '12px',
  border: '1px solid var(--glass-border)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: 'var(--color-text)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'all 0.3s ease',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.85rem',
  fontWeight: 800,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

function DeleteConfirm({ onConfirm, onCancel }: any) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="¿Eliminar registro?"
      message="Esta acción no se puede deshacer."
      iconEmoji="🗑️" />);


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
    const hist = JSON.parse(localStorage.getItem('reports_history') || '[]');
    setReportsHistory(hist);
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
        if (sd) {const p = JSON.parse(sd);sig = p.signature || sig;stamp = p.stamp || null;}
        setProfessional({ name: parsed.name, license: parsed.license, signature: sig, stamp });
      }
    }
  }, [location.state]);

  const handleDirectPrintFromHistory = (item: any) => {
      setPrintData(item);
      setIsPrinting(true);
      setTimeout(() => {
          const element = document.getElementById('pdf-direct-print');
          if (!element) {
              toast.error('No se pudo generar el documento para imprimir.');
              setIsPrinting(false);
              setPrintData(null);
              return;
          }
          
          document.body.classList.add('printing-isolated');
          element.classList.add('isolated-print-target');
          
          const cleanup = () => {
              document.body.classList.remove('printing-isolated');
              element.classList.remove('isolated-print-target');
              window.removeEventListener('afterprint', cleanup);
              window.removeEventListener('focus', cleanup);
              setIsPrinting(false);
              setPrintData(null);
          };
          
          window.addEventListener('afterprint', cleanup);
          window.addEventListener('focus', cleanup);
          
          setTimeout(() => {
              window.print();
          }, 300);
      }, 500);
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
    localStorage.setItem('current_report', JSON.stringify(newReport));
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
    toast.success('Informe eliminado');
  };

  const DeleteBtn = ({ id }: {id: any;}) =>
  <button
    onClick={(e) => {e.stopPropagation();setDeleteTarget(id);}}
    title="Eliminar"
    style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center">
            <Trash2 size={16} />
        </button>;


  const templates = [
  { id: 'general', label: 'Informe Técnico', icon: <FileText /> },
  { id: 'accident', label: 'Incidente / Acc.', icon: <AlertCircle /> },
  { id: 'training', label: 'Capacitación', icon: <GraduationCap /> },
  { id: 'rgrl', label: 'RGRL', icon: <ClipboardCheck /> },
  { id: 'epp', label: 'Entrega EPP', icon: <Package /> }];


  if (!isFormVisible) {
    return (
      <div className="container min-h-[100vh] bg-[var(--color-background)] pb-[7rem] pt-[5.5rem]">
          <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
              {printData && <ProfessionalReportPdfGenerator currentReport={printData} customId="pdf-direct-print" />}
          </div>
                <PremiumHeader onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
        title="Informes Profesionales"
        subtitle="Gestión e historial de informes técnicos."
        icon={<FileText size={32} color="#ffffff" />}
        color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
        

                {deleteTarget && <DeleteConfirm onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
                
                <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Informe - ${shareItem?.data?.title || ''}`}
          text={shareItem ? `📄 Informe Profesional\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}\n📅 ${new Date(shareItem.data.createdAt).toLocaleDateString('es-AR')}` : ''}
          rawMessage={shareItem ? `📄 Informe Profesional\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}\n📅 ${new Date(shareItem.data.createdAt).toLocaleDateString('es-AR')}` : ''}
          elementIdToPrint="pdf-content"
          fileName={`Informe_${shareItem?.data?.title || 'Profesional'}.pdf`} />
        

                <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                    {shareItem?.type === 'report' && <ProfessionalReportPdfGenerator currentReport={shareItem.data} />}
                </div>

                <main className="p-[0_0_2rem_0] max-w-[1000px] m-[0_auto] w-[100%]">
                    <div className="flex items-center justify-between gap-[1rem] mb-[2rem] flex-wrap p-[0_1rem]">
                        <div className="flex items-center gap-[0.8rem] ml-auto">
                            <button onClick={() => {
                                // downloadCSV
                            }} className="btn-secondary hover-lift flex items-center justify-center gap-[0.5rem] px-5 py-3 h-[48px] w-[auto] m-[0] text-white border-none rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/30" style={{ background: '#10b981' }}>
                                <Download size={18} /> EXCEL
                            </button>
                            <button onClick={() => {
                                setProjectData({
                                    title: '', company: '', location: '', date: new Date().toISOString().split('T')[0],
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
                            }} className="btn-primary hover-lift flex items-center justify-center gap-[0.5rem] px-5 py-3 h-[48px] w-[auto] m-[0] text-white border-none rounded-xl font-bold shadow-lg shadow-emerald-500/30" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <Plus size={18} /> NUEVO INFORME
                            </button>
                        </div>
                    </div>

                <div className="p-[0_0_2rem_0]">
                    <DataTable
              data={reportsHistory}
              searchPlaceholder="Buscar por título o empresa..."
              searchFields={['title', 'company']}
              emptyMessage="No hay informes registrados."
              emptyIcon={<FileText size={48} />}
              columns={[
              {
                header: 'Fecha',
                accessor: 'createdAt',
                sortable: true,
                render: (item: any) =>
                <span className="flex items-center gap-[0.4rem] text-[var(--color-text-muted)]">
                                        <Calendar size={14} /> 
                                        {new Date(item.createdAt).toLocaleDateString('es-AR')}
                                    </span>

              },
              {
                header: 'Título',
                accessor: 'title',
                sortable: true,
                render: (item: any) =>
                <div className="flex items-center gap-[0.8rem]">
                                        <div className="bg-[rgba(236,72,153,0.1)] p-[0.5rem] rounded-[8px] text-[#ec4899]">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <div className="font-[700]">{item.title || 'Sin Título'}</div>
                                            <div className="text-[0.75rem] text-[var(--color-text-muted)]">{item.template?.toUpperCase() || 'GENERAL'}</div>
                                        </div>
                                    </div>

              },
              {
                header: 'Empresa',
                accessor: 'company',
                sortable: true
              },
              {
                header: 'Acciones',
                accessor: 'id',
                render: (item: any) =>
                <div className="flex gap-[0.5rem]">
                                        <button
                    onClick={() => {
                      navigate('/reports', { state: { editData: item } });
                      setIsFormVisible(true);
                    }}

                    title="Editar" style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center">
                    
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                    onClick={() => handleDirectPrintFromHistory(item)}

                    title="Ver PDF" style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-[4px]">
                    
                                            <FileText size={16} /> <span className="text-[0.75rem] font-[700] ml-1">PDF</span>
                                        </button>
                                        <button
                    onClick={() => setShareItem({ type: 'report', data: item })}

                    title="Compartir" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }} className="p-[0.5rem] rounded-[8px] cursor-pointer shadow-sm hover:-translate-y-0.5 transition-transform flex items-center justify-center">
                    
                                            <Share2 size={16} />
                                        </button>
                                        <DeleteBtn id={item.id} />
                                    </div>

              }]
              } />
            
                </div>
                </main>
            </div>);

  }

  return (
    <ReportErrorBoundary>
      <div className="min-h-[100vh] bg-[var(--color-background)] pb-[6rem] pt-[5.5rem]">
              <PremiumHeader onBack={isFormVisible ? () => {setIsFormVisible(false);} : undefined}
        title="Generar Informe"
        subtitle="Documentación Profesional de Seguridad e Higiene"
      icon={<FileText />}
      color="linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" />
      

      <main className="p-[2rem_1.5rem] max-w-[1000px] m-[0_auto]">
          <ShareModal
            isOpen={!!shareItem}
            open={!!shareItem}
            onClose={() => setShareItem(null)}
            title={`Informe - ${shareItem?.data?.title || ''}`}
            text={shareItem ? `📄 Informe Profesional\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}\n📅 ${new Date(shareItem.data.createdAt).toLocaleDateString('es-AR')}` : ''}
            rawMessage={shareItem ? `📄 Informe Profesional\n🏗️ ${shareItem.data.title}\n🏢 ${shareItem.data.company}\n📅 ${new Date(shareItem.data.createdAt).toLocaleDateString('es-AR')}` : ''}
            elementIdToPrint="pdf-content"
            fileName={`Informe_${shareItem?.data?.title || 'Profesional'}.pdf`}
          />
          <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
              {shareItem?.type === 'report' && <ProfessionalReportPdfGenerator currentReport={shareItem.data} />}
              {printData && <ProfessionalReportPdfGenerator currentReport={printData} customId="pdf-direct-print" />}
          </div>

          <ModuleActionBar
            actions={[
              { id: 'cancel', label: 'CANCELAR', icon: <X size={18} />, variant: 'secondary', onClick: () => setIsFormVisible(false) },
              { id: 'share', label: 'COMPARTIR', icon: <Share2 size={18} />, variant: 'info', onClick: () => {
                  const data = { id: projectData.id || Date.now(), template, ...projectData, content, extraFields, photos, personnel: template === 'training' || template === 'epp' ? personnel : [], createdAt: new Date().toISOString(), showSignatures, operatorSignature, signature, supervisorSignature, professionalSignature: professional?.signature, professionalName: professional?.name, professionalLicense: professional?.license };
                  setShareItem({ type: 'report', data });
              }},
              { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer size={18} />, variant: 'warning', onClick: () => {
                  const data = { id: projectData.id || Date.now(), template, ...projectData, content, extraFields, photos, personnel: template === 'training' || template === 'epp' ? personnel : [], createdAt: new Date().toISOString(), showSignatures, operatorSignature, signature, supervisorSignature, professionalSignature: professional?.signature, professionalName: professional?.name, professionalLicense: professional?.license };
                  setPrintData(data);
                  setIsPrinting(true);
                  setTimeout(() => {
                      const element = document.getElementById('pdf-direct-print');
                      if (!element) {
                          toast.error('No se pudo generar el documento para imprimir.');
                          setIsPrinting(false);
                          setPrintData(null);
                          return;
                      }
                      
                      document.body.classList.add('printing-isolated');
                      element.classList.add('isolated-print-target');
                      
                      const cleanup = () => {
                          document.body.classList.remove('printing-isolated');
                          element.classList.remove('isolated-print-target');
                          window.removeEventListener('afterprint', cleanup);
                          window.removeEventListener('focus', cleanup);
                          setIsPrinting(false);
                          setPrintData(null);
                      };
                      
                      window.addEventListener('afterprint', cleanup);
                      window.addEventListener('focus', cleanup);
                      
                      setTimeout(() => {
                          window.print();
                      }, 100);
                  }, 500);
              }},
              { id: 'save', label: 'GUARDAR', icon: <Save size={18} />, variant: 'primary', onClick: () => requirePro(handleSave) }
            ]}
          />
                <div className="mb-6">
                    <></>
                </div>

                {/* Template Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-[0.5rem] md:gap-[1rem] mb-[2.5rem]">
                    {templates.map((t) =>
          <div
            key={t.id}
            onClick={() => {
              setTemplate(t.id);
              if ((t.id === 'training' || t.id === 'epp') && personnel.length === 0) {
                setPersonnel([{ id: Date.now(), name: '', dni: '' }]);
              }
            }}
            className="card hover-lift text-center p-[0.75rem_0.5rem] cursor-pointer transition-[all_0.3s_ease] rounded-[12px] flex flex-col items-center gap-[0.5rem]"
            style={{
              border: template === t.id ? '2px solid var(--color-primary)' : '1px solid var(--glass-border)',
              background: template === t.id ? 'rgba(var(--color-primary-rgb), 0.08)' : 'var(--gradient-card)'
            }}>
            
                            <div style={{
              color: template === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: template === t.id ? 'rgba(255,255,255,0.1)' : 'transparent'
            }} className="p-[0.5rem] rounded-[50%]">
                                {React.cloneElement(t.icon, { size: 24 })}
                            </div>
                            <div style={{ color: template === t.id ? 'var(--color-text)' : 'var(--color-text-muted)' }} className="text-[0.75rem] md:text-[0.8rem] font-[700] leading-tight">{t.label}</div>
                        </div>
          )}
                </div>

                {/* General Info */}
                <div className="card mb-[2.5rem] p-[2.5rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)] rounded-[20px]">
                    <h3 className="mt-[0] mb-[1.5rem] text-[var(--color-primary)] flex items-center gap-[0.5rem] text-[1.2rem]">
                        <FileText size={20} /> Datos Generales
                    </h3>
                    
                    <div className="grid grid-template-columns-[1fr_1fr] gap-[1.5rem]">
                        <div className="grid-column-[span_2]">
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Título del Informe</label>
                            <input
                type="text"
                value={projectData.title}
                onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                placeholder="Ej: Relevamiento de Condiciones de Seguridad"
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
              
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Empresa / Cliente</label>
                            <input
                type="text"
                value={projectData.company}
                onChange={(e) => setProjectData({ ...projectData, company: e.target.value })}
                placeholder="Nombre de la empresa"
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
              
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Ubicación / Planta</label>
                            <input
                type="text"
                value={projectData.location}
                onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                placeholder="Ej: Sede Central"
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
              
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Fecha</label>
                            <input
                type="date"
                value={projectData.date}
                onChange={(e) => setProjectData({ ...projectData, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
              
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-slate-400">Responsable / Profesional</label>
                            <input
                type="text"
                value={projectData.responsable}
                onChange={(e) => setProjectData({ ...projectData, responsable: e.target.value })}
                placeholder="Nombre del responsable"
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
              
                        </div>
                    </div>
                </div>

                {/* Template Content */}
                <div className="card mb-[2.5rem] p-[2.5rem] bg-[var(--gradient-card)] border-[1px_solid_var(--glass-border)] rounded-[20px]">
                    <h3 className="mt-[0] mb-[1.5rem] text-[var(--color-primary)] flex items-center gap-[0.5rem] text-[1.2rem]">
                        <ClipboardCheck size={20} /> Desarrollo del Informe
                    </h3>

                    {template === 'training' &&
          <div className="mb-[2rem] p-[1.5rem] bg-[rgba(255,255,255,0.03)] rounded-[16px] border-[1px_solid_var(--glass-border)]">
                            <div className="grid grid-template-columns-[2fr_1fr] gap-[1.5rem]">
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Tema de la Capacitación</label>
                                    <input
                  type="text"
                  placeholder="Ej: Uso de Extintores, RCP, etc."
                  value={extraFields.topic || ''}
                  onChange={(e) => setExtraFields({ ...extraFields, topic: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Duración (minutos)</label>
                                    <input
                  type="number"
                  placeholder="60"
                  value={extraFields.duration || ''}
                  onChange={(e) => setExtraFields({ ...extraFields, duration: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                
                                </div>
                            </div>
                        </div>
          }

                    {template === 'accident' &&
          <div className="mb-[2rem] p-[1.5rem] bg-[rgba(255,255,255,0.03)] rounded-[16px] border-[1px_solid_var(--glass-border)]">
                            <div className="grid grid-template-columns-[1fr_1fr] gap-[1.5rem]">
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Hora del Evento</label>
                                    <input
                  type="time"
                  value={extraFields.eventTime || ''}
                  onChange={(e) => setExtraFields({ ...extraFields, eventTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Persona Afectada</label>
                                    <input
                  type="text"
                  placeholder="Nombre del afectado"
                  value={extraFields.affectedPerson || ''}
                  onChange={(e) => setExtraFields({ ...extraFields, affectedPerson: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                
                                </div>
                            </div>
                        </div>
          }

                    {(template === 'training' || template === 'epp') &&
          <div className="mb-[2rem] p-[1.5rem] bg-[rgba(255,255,255,0.03)] rounded-[16px] border-[1px_solid_var(--glass-border)]">
                            <div className="flex justify-space-between items-center mb-[1.5rem]">
                                <label className="m-[0] text-[0.9rem] font-[800] text-[var(--color-primary)] uppercase">Personal Interviniente / Receptores</label>
                                <button
                onClick={handleAddPerson}
                className="btn-outline hover-lift p-[0.4rem_0.8rem] text-[0.75rem] flex items-center gap-[0.4rem] rounded-[8px]">

                
                                    <Plus size={14} /> Añadir Persona
                                </button>
                            </div>
                            <div className="flex flex-col gap-4">
                                {personnel.map((p, index) =>
              <div key={p.id} className="flex gap-[1rem] items-center">
                                        <div className="flex-[2]">
                                            <input
                    type="text"
                    placeholder="Nombre completo"
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={p.name}
                    onChange={(e) => handlePersonChange(p.id, 'name', e.target.value)} />
                  
                                        </div>
                                        <div className="flex-[1]">
                                            <input
                    type="text"
                    placeholder="DNI/CUIL"
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={p.dni}
                    onChange={(e) => handlePersonChange(p.id, 'dni', e.target.value)} />
                  
                                        </div>
                                        <button
                  onClick={() => handleRemovePerson(p.id)}

                  disabled={personnel.length === 1}
                  className="hover-lift bg-[rgba(239,_68,_68,_0.1)] border-none text-[#ef4444] cursor-pointer p-[0.8rem] rounded-[12px] flex items-center justify-center">
                  
                                            <Trash2 size={18} />
                        </button>
                                    </div>
              )}
                            </div>
                        </div>
          }

                    <label className="block mb-2 text-sm font-semibold text-slate-400">Contenido Principal / Observaciones</label>
                    <textarea
            style={{ ...inputStyle }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describa los hallazgos, recomendaciones o el cuerpo del informe..." className="min-h-[350px] resize-[vertical] line-height-[1.6]" />
          

                    <div className="mt-[2.5rem]">
                        <PhotoAttachments
              photos={photos}
              onChange={setPhotos}
              maxPhotos={8}
              label="Fotos de Evidencia" />
            
                    </div>
                </div>

                {/* Interactive Signature Drawing Pads */}
                <div className="card animate-fade-in mt-[2.5rem] bg-[rgba(var(--color-surface-rgb),_0.3)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] p-[2.5rem] box-shadow-[0_8px_32px_0_rgba(0,_0,_0,_0.08)]">
                    <h3 className="mt-[0] mb-[2rem] flex items-center gap-[0.7rem] text-[var(--color-primary)] font-[900] text-[1.25rem] uppercase letter-spacing-[1.2px]">
                        ✍️ Firmas y Autorizaciones
                    </h3>

                    {/* Custom visual switches */}
                    <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center">
                        <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                        <div className="flex gap-[1rem] flex-wrap justify-center">
                            {[
              { id: 'operator', label: 'Operador / Empleado' },
              { id: 'supervisor', label: 'Supervisor / Responsable' },
              { id: 'professional', label: 'Profesional HYS' }].
              map((sig) => {
                const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                return (
                  <label
                    key={sig.id}
                    className="flex items-center gap-2 cursor-pointer select-none p-[0.55rem_1.1rem] rounded-[var(--radius-full)] font-[750] text-[0.8rem] transition-[all_0.2s_ease] whitespace-nowrap"
                    style={{


                      border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                      color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',



                      boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                    }}>
                    
                                        <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setShowSignatures((s) => ({ ...s, [sig.id]: e.target.checked }))} className="hidden" />

                    
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
                    {/* On-Sheet Visual Preview of PDF signature blocks */}
                    <div className="mb-8">
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
              } : null} />
            
            <PdfBrandingFooter />
                    </div>

                    {/* Interactive Signature Drawing Pads */}
                    <div className="no-print mt-8 pt-8 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {showSignatures?.operator &&
            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                onSave={(sig) => setOperatorSignature(sig || '')}
                initialImage={operatorSignature}
                title="Firma Operador" />
              
                            </div>
            }
                        {showSignatures?.supervisor &&
            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                onSave={(sig) => setSupervisorSignature(sig || '')}
                initialImage={supervisorSignature}
                title="Firma Supervisor" />
              
                            </div>
            }
                        {showSignatures?.professional &&
            <div className="p-6 bg-slate-50/5 dark:bg-slate-900/10 border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                <SignatureCanvas
                onSave={(sig) => setSignature(sig || '')}
                initialImage={signature}
                title="Firma Profesional" />
              
                            </div>
            }
                    </div>
                </div>
            </main>
        </div>
    </ReportErrorBoundary>
  );
}