import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Users, Calendar, Clock, BookOpen,
  UserPlus, Trash2, CheckCircle2, FileText, Briefcase,
  Plus, Share2, Printer, Pencil, QrCode, Timer } from
'lucide-react';
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
import { ModuleFormLayout, ModuleFormToolbar, ModuleFormSection, ModuleActionBar } from '../components/module';

function StatCard({ icon, label, value, color, gradient }: {icon: React.ReactNode;label: string;value: string | number;color: string;gradient: string;}) {
  return (
    <div className="training-stat-card cursor-pointer">
            <div className="training-stat-glow" style={{ background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }} />
            <div className="flex items-center gap-[0.75rem] mb-[1rem] relative z-[1]">
                <div style={{


          background: gradient,




          boxShadow: `0 8px 24px ${color}30`

        }} className="w-[44px] h-[44px] rounded-[var(--radius-xl)] flex items-center justify-center text-[#ffffff]">
                    {React.cloneElement(icon as React.ReactElement<any>, { color: '#ffffff', size: 20 })}
                </div>
            </div>
            <div className="relative z-[1] text-[2rem] font-[900] text-[var(--color-text)] line-height-[1] letter-spacing-[-1px] mb-[0.25rem]">
                {value}
            </div>
            <div className="relative z-[1] text-[0.75rem] font-[700] text-[var(--color-text-muted)] uppercase letter-spacing-[0.5px]">
                {label}
            </div>
        </div>);

}

export default function TrainingManagement(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { syncCollection, syncing } = useSync();
  const [searchParams] = useSearchParams();

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

  const initialFormState = {
    tema: '',
    expositor: currentUser?.displayName || '',
    fecha: new Date().toISOString().split('T')[0],
    duracion: '1',
    empresa: '',
    ubicacion: '',
    observaciones: '',
    preguntas: [
    { texto: '¿Comprendió los riesgos asociados a la tarea?' },
    { texto: '¿Identificó las medidas preventivas correctas?' }],

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
        setHistory(Array.isArray(h) ? h.sort((a, b) => (new Date(b.fecha) as any) - (new Date(a.fecha) as any)) : []);
      } else {
        setHistory([]);
      }
    } catch (e) {
      setHistory([]);
    }
  }, [syncing]);

  // Handle deep links (e.g. from history hub)
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (index, field, value) => {
    setFormData((prev) => {
      const newAsistentes = [...prev.asistentes];
      newAsistentes[index] = { ...newAsistentes[index], [field]: value };
      return { ...prev, asistentes: newAsistentes };
    });
  };

  const addAsistente = () => setFormData((prev) => ({ ...prev, asistentes: [...prev.asistentes, { nombre: '', dni: '', puesto: '', nota: '', firma: '', showSignatureModal: false }] }));
  const removeAsistente = (index) => setFormData((prev) => ({ ...prev, asistentes: prev.asistentes.filter((_, i) => i !== index) }));

  const handlePreguntaChange = (index, value) => {
    setFormData((prev) => {
      const newPreguntas = [...(prev.preguntas || [])];
      newPreguntas[index] = { ...newPreguntas[index], texto: value };
      return { ...prev, preguntas: newPreguntas };
    });
  };

  const addPregunta = () => setFormData((prev) => ({ ...prev, preguntas: [...(prev.preguntas || []), { texto: '' }] }));
  const removePregunta = (index) => setFormData((prev) => ({ ...prev, preguntas: (prev.preguntas || []).filter((_, i) => i !== index) }));

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

  const handleEdit = (item) => {
    setFormData(item);
    setShowSignatures(item.showSignatures || initialFormState.showSignatures);
    setEditingId(item.id);
    setShowForm(true);
  };

  if (selectedTraining) {
    return <TrainingPdfGenerator data={selectedTraining} onBack={() => setSelectedTraining(null)} />;
  }

  const totalCharlas = history.length;
  const totalAsistentes = history.reduce((acc, item) => acc + (item.asistentes?.length || 0), 0);
  const totalHours = history.reduce((acc, item) => acc + (parseFloat(item.duracion) || 0), 0);
  const avgDuration = totalCharlas > 0 ? (totalHours / totalCharlas).toFixed(1) : '0';

  const columns = [
  {
    header: 'Fecha',
    accessor: 'fecha',
    sortable: true,
    render: (item: any) =>
    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <Calendar size={14} /> {new Date(item.fecha + 'T12:00:00Z').toLocaleDateString('es-AR')}
                </span>

  },
  {
    header: 'Tema',
    accessor: 'tema',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <BookOpen size={16} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.tema}</span>
                </div>

  },
  {
    header: 'Expositor',
    accessor: 'expositor',
    sortable: true,
    render: (item: any) => <span className="text-slate-500 dark:text-slate-400">{item.expositor || '—'}</span>
  },
  {
    header: 'Asistentes',
    accessor: 'asistentes',
    render: (item: any) =>
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-extrabold w-fit text-slate-700 dark:text-slate-300">
                    <Users size={13} /> {item.asistentes?.length || 0}
                </span>

  },
  {
    header: 'Duración',
    accessor: 'duracion',
    render: (item: any) =>
    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                    <Timer size={14} /> {item.duracion} hs
                </span>

  },
  {
    header: 'Acciones',
    accessor: 'id',
    render: (item: any) =>
    <div className="flex items-center gap-1.5">
                    <button onClick={() => setSelectedTraining(item)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Ver</button>
                    <button onClick={() => handleEdit(item)} className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500 cursor-pointer flex items-center hover:bg-blue-500/20 transition-colors" title="Editar"><Pencil size={15} /></button>
                    <button onClick={() => requirePro(() => {const url = `${window.location.origin}/v/${currentUser?.uid}/training/${item.id}?print=true`;setQrTarget({ text: url, title: `Capacitación — ${item.tema}` });})} className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-500 cursor-pointer flex items-center hover:bg-purple-500/20 transition-colors" title="QR"><QrCode size={15} /></button>
                    <button onClick={() => requirePro(() => setShareItem(item))} className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-500 cursor-pointer flex items-center hover:bg-green-500/20 transition-colors" title="Compartir"><Share2 size={15} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 cursor-pointer flex items-center hover:bg-red-500/20 transition-colors" title="Eliminar"><Trash2 size={15} /></button>
                </div>

  }];


  return (
    <AnimatedPage>
      <div className="container min-h-screen bg-[var(--color-background)] pb-[8rem]">
        {(!showForm && !showExamForm) ? (
                    <div className="no-print">
                        <PremiumHeader
                            title="Gestión de Capacitaciones"
                            subtitle="Registros de formación del personal"
                            icon={<Users size={36} color="#ffffff" />}
                        />
                    </div>
                ) : (
                    <ModuleFormToolbar
                        title={showExamForm ? 'Generador de Exámenes' : (editingId ? 'Editar Capacitación' : 'Nueva Capacitación')}
                        subtitle={showExamForm ? "Cree plantillas en blanco para evaluar capacitaciones" : "Complete los detalles y la asistencia de la charla"}
                        icon={showExamForm ? <FileText size={36} color="#ffffff" /> : <BookOpen size={36} color="#ffffff" />}
                        onBack={() => {setShowForm(false); setShowExamForm(false);}}
                    />
                )}
                
                {(!showForm && !showExamForm) ? (
                    <div className="p-[2rem] max-w-[1200px] m-[0_auto] flex flex-col relative">
                        {deleteTarget &&
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
        }
                
                {shareItem &&
        <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title={`Capacitación - ${shareItem?.tema || ''}`}
          text={`📊 Capacitación\n📚 Tema: ${shareItem.tema}\n🧑‍🏫 Expositor: ${shareItem.expositor}\n📅 Fecha: ${shareItem.fecha}\n👥 Asistentes: ${shareItem.asistentes?.length}`}
          rawMessage={''}
          elementIdToPrint="pdf-content"
          fileName={`Capacitacion_${shareItem?.tema || 'registro'}.pdf`} />

        }
                {createPortal(
          <div id="pdf-content" className="ats-pdf-offscreen" aria-hidden="true">
                        {(shareItem || showForm || showExamForm) && (
            printType === 'examen' ?
            <TrainingExamPdfGenerator data={shareItem || { ...formData, showSignatures }} /> :

            <TrainingPdfGenerator
              data={shareItem || { ...formData, showSignatures }}
              isHeadless={true} />)


            }
                    </div>,
          document.body
        )}

                {qrTarget && <QRModal text={qrTarget.text} title={qrTarget.title} onClose={() => setQrTarget(null)} />}

                    </div>
                ) : (
                    <ModuleFormLayout>
                        <div className="p-[2rem] max-w-[1200px] m-[0_auto] flex flex-col relative">
                {showExamForm ?
        <div className="w-full">
                        {/* EXAM BUILDER VIEW */}
                        <div className="mt-[1.5rem] mb-[1.5rem] z-[10]">
                            <></>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-8 mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                            <h2 className="text-lg font-extrabold mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                <BookOpen size={20} /> Metadatos del Examen
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-full flex flex-col gap-2">
                                    <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400">TEMA / TÍTULO DE LA CAPACITACIÓN</label>
                                    <input type="text" placeholder="Ej. Inducción de Seguridad..." value={formData.tema} onChange={(e) => handleInputChange('tema', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400">EXPOSITOR / INSTRUCTOR</label>
                                    <input type="text" value={formData.expositor} onChange={(e) => handleInputChange('expositor', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400">FECHA DE EVALUACIÓN</label>
                                    <input type="date" value={formData.fecha} onChange={(e) => handleInputChange('fecha', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>
                                <div className="col-span-full flex flex-col gap-2">
                                    <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400">EMPRESA / CONTRATISTA</label>
                                    <input type="text" placeholder="Si aplica a una subcontratista" value={formData.empresa} onChange={(e) => handleInputChange('empresa', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-8 mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="m-0 text-lg font-extrabold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <FileText size={20} /> Preguntas de Evaluación
                                </h2>
                                <button onClick={addPregunta} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm font-bold flex items-center gap-2 transition-colors">
                                    <Plus size={16} /> Agregar Pregunta
                                </button>
                            </div>
                            
                            {(!formData.preguntas || formData.preguntas.length === 0) &&
            <p className="text-sm text-slate-500 dark:text-slate-400 italic m-0">No se cargaron preguntas. El examen saldrá solo con un renglón.</p>
            }
                            
                            <div className="flex flex-col gap-4">
                                {(formData.preguntas || []).map((pregunta, idx) =>
              <div key={idx} className="flex gap-4 items-center">
                                        <span className="font-extrabold text-blue-600 dark:text-blue-400">{idx + 1}.</span>
                                        <input
                  type="text"
                  value={pregunta.texto}
                  onChange={(e) => handlePreguntaChange(idx, e.target.value)}
                  placeholder="Escriba la pregunta a evaluar..."
                  className="input-professional capa-focus-glow m-[0] h-[44px] flex-[1] rounded-[10px]" />

                
                                        <button onClick={() => removePregunta(idx)} className="w-11 h-11 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border-none flex items-center justify-center cursor-pointer transition-colors shrink-0">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
              )}
                            </div>
                        </div>
                        <ModuleActionBar actions={[
                            { id: 'print', label: 'IMPRIMIR EXAMEN', icon: <FileText size={18} />, variant: 'secondary', onClick: () => handlePrint('examen') }
                        ]} />
                    </div> :
        showForm ?
        <div className="w-full">
                        {/* FORM VIEW */}
                        <div className="mt-[1.5rem] mb-[1.5rem] z-[10]">
                            <></>
                        </div>

                        {/* General Metadata Panel */}
                        <div className="bg-white dark:bg-slate-800 p-8 mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                            <h2 className="text-lg font-extrabold mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                <BookOpen size={20} /> Metadatos de la Charla
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-full flex flex-col gap-2">
                                    <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                                        <BookOpen size={16} /> Tema / Título de la Capacitación
                                    </label>
                                    <input type="text" placeholder="Ej. Inducción de Seguridad..." value={formData.tema} onChange={(e) => handleInputChange('tema', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                                        <Users size={16} /> Expositor / Instructor
                                    </label>
                                    <input type="text" value={formData.expositor} onChange={(e) => handleInputChange('expositor', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                                        <Briefcase size={16} /> Sector / Lugar de Dictado
                                    </label>
                                    <input type="text" placeholder="Ej. Sala de Reuniones 1" value={formData.ubicacion} onChange={(e) => handleInputChange('ubicacion', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                                        <Calendar size={16} /> Fecha
                                    </label>
                                    <input type="date" value={formData.fecha} onChange={(e) => handleInputChange('fecha', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                                        <Clock size={16} /> Duración (Horas)
                                    </label>
                                    <input type="number" min="0.5" step="0.5" value={formData.duracion} onChange={(e) => handleInputChange('duracion', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>

                                <div className="col-span-full flex flex-col gap-2">
                                    <label className="text-sm font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                                        <FileText size={16} /> Empresa / Contratista (Opcional)
                                    </label>
                                    <input type="text" placeholder="Si aplica a una subcontratista específica" value={formData.empresa} onChange={(e) => handleInputChange('empresa', e.target.value)} className="w-full px-4 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Attendee Planilla Panel */}
                        <div className="flex-1 p-8 mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 shadow-xl">
                            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                                <h2 className="m-0 text-lg font-extrabold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <Users size={20} /> Planilla de Asistentes
                                </h2>
                                <div className="flex gap-[1rem] items-center">
                                    <span className="text-xs font-extrabold bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg shadow-blue-500/30">
                                        {formData.asistentes.length} {formData.asistentes.length === 1 ? 'asistente' : 'asistentes'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {formData.asistentes.map((asistente, i) =>
              <div key={i} className="training-asistente-card">
                                        <span className="training-asistente-badge">Asistente #{i + 1}</span>
                                        <div className={`grid gap-5 items-end mt-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-[2fr_1.2fr_1.5fr_1fr_auto_auto]'}`}>
                                            <div className="flex flex-col gap-[0.4rem]">
                                                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nombre Completo</label>
                                                <input type="text" placeholder="Apellido y Nombre" value={asistente.nombre} onChange={(e) => handleArrayChange(i, 'nombre', e.target.value)} className="m-0 h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex flex-col gap-[0.4rem]">
                                                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">DNI / CUIL</label>
                                                <input type="text" placeholder="Número de documento" value={asistente.dni} onChange={(e) => handleArrayChange(i, 'dni', e.target.value)} className="m-0 h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex flex-col gap-[0.4rem]">
                                                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Puesto / Sector</label>
                                                <input type="text" placeholder="Ej. Operario" value={asistente.puesto} onChange={(e) => handleArrayChange(i, 'puesto', e.target.value)} className="m-0 h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex flex-col gap-[0.4rem]">
                                                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nota / Eval.</label>
                                                <input type="text" placeholder="Ej. Aprobado, 8" value={asistente.nota || ''} onChange={(e) => handleArrayChange(i, 'nota', e.target.value)} className="m-0 h-11 w-full px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex flex-col gap-[0.4rem]">
                                                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Firma</label>
                                                {asistente.firma ?
                    <div className="h-11 border border-emerald-500 bg-emerald-500/5 rounded-xl flex items-center justify-center text-emerald-500 cursor-pointer px-2 transition-colors hover:bg-emerald-500/10 shrink-0" onClick={() => handleArrayChange(i, 'showSignatureModal', true)}>
                                                        <CheckCircle2 size={16} className="mr-[0.4rem]" /> Firmado
                                                    </div> :

                    <button className="h-11 m-0 rounded-xl px-4 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors shrink-0" onClick={() => handleArrayChange(i, 'showSignatureModal', true)}>
                                                        <Pencil size={15} /> Firmar
                                                    </button>
                    }
                                            </div>

                                            {formData.asistentes.length > 1 ?
                  <div className={`flex ${isMobile ? 'justify-end w-full' : 'justify-center w-auto'}`}>
                                                    <button onClick={() => removeAsistente(i)} title="Eliminar Asistente" className={`h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center cursor-pointer transition-colors hover:bg-red-500/20 ${isMobile ? 'w-full mt-2' : 'w-11 mt-0'}`}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div> :

                  <div className="hidden sm:block w-[44px]"></div>
                  }
                                        </div>
                                        {asistente.showSignatureModal &&
                <div className="p-5 mt-4 rounded-xl border border-blue-500 bg-white dark:bg-slate-800 shadow-lg">
                                                <div className="flex justify-space-between items-center mb-[1rem]">
                                                    <span className="font-extrabold text-blue-600 dark:text-blue-400">Firma de {asistente.nombre || `Asistente #${i + 1}`}</span>
                                                    <button onClick={() => handleArrayChange(i, 'showSignatureModal', false)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-none rounded-lg px-3 py-1.5 cursor-pointer font-bold text-sm transition-colors">Cerrar</button>
                                                </div>
                                                <SignatureCanvas
                    onSave={(sig) => {handleArrayChange(i, 'firma', sig);handleArrayChange(i, 'showSignatureModal', false);}}
                    initialImage={asistente.firma}
                    title={`Firmar asistencia - ${asistente.nombre || 'Asistente'}`} />
                  
                                            </div>
                }
                                    </div>
              )}
                            </div>

                            <button onClick={addAsistente} className="w-full p-5 border-2 border-dashed border-blue-400 dark:border-blue-500/50 rounded-xl flex items-center justify-center gap-2 mt-6 text-blue-600 dark:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 font-extrabold cursor-pointer transition-colors">
                                <UserPlus size={18} /> Añadir Fila de Asistente
                            </button>
                        </div>

                        {/* Signatures & Approvals Panel */}
                        <div className="bg-white dark:bg-slate-800 p-8 mt-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                            <h3 className="m-0 mb-8 flex items-center gap-3 text-blue-600 dark:text-blue-400 font-black text-xl uppercase tracking-widest">
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
                box3={showSignatures.supervisor ? { title: 'SUPERVISIÓN / VERIFICADOR', subtitle: 'Verificación de Capacitación', signatureUrl: formData.supervisorSignature || null, isProfessional: false } : null} />
              
            <PdfBrandingFooter />
                            </div>

                            {(showSignatures.operator || showSignatures.professional || showSignatures.supervisor) &&
            <div className="no-print mt-[2rem] pt-[2rem] border-top-[1px_solid_var(--color-border)] grid gap-[1.5rem]" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                                    {showSignatures.operator &&
              <div className="glass-card p-[1rem] rounded-[16px] border-[1px_solid_var(--glass-border-subtle)]">
                                            <SignatureCanvas onSave={(sig) => setFormData((prev) => ({ ...prev, operatorSignature: sig || '' }))} initialImage={formData.operatorSignature} label="Firma de Delegado / Asistente" />
                                        </div>
              }
                                    {showSignatures.professional &&
              <div className="glass-card p-[1rem] rounded-[16px] border-[1px_solid_var(--glass-border-subtle)]">
                                            <SignatureCanvas onSave={(sig) => setFormData((prev) => ({ ...prev, signature: sig || '' }))} initialImage={formData.signature} label="Firma de Instructor / Expositor" />
                                        </div>
              }
                                    {showSignatures.supervisor &&
              <div className="glass-card p-[1rem] rounded-[16px] border-[1px_solid_var(--glass-border-subtle)]">
                                            <SignatureCanvas onSave={(sig) => setFormData((prev) => ({ ...prev, supervisorSignature: sig || '' }))} initialImage={formData.supervisorSignature} label="Firma de Supervisión / Verificador" />
                                        </div>
              }
                                </div>
            }
                        </div>
                        
                        <ModuleActionBar actions={[
                            { id: 'save', label: 'GUARDAR', icon: <Save size={18} />, variant: 'primary', onClick: (e) => {e.preventDefault();requirePro(handleSave);} },
                            { id: 'share', label: 'COMPARTIR', icon: <Share2 size={18} />, variant: 'secondary', onClick: () => requirePro(() => setShareItem(formData)) },
                            { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer size={18} />, variant: 'secondary', onClick: () => handlePrint('asistencia') }
                        ]} />

                    </div> :

        <div className="w-full">
                        {/* HISTORY VIEW */}
                        <div className="flex items-center justify-between gap-[1rem] mt-[1.5rem] mb-[2rem] flex-wrap">
                            <div className="flex gap-[1rem] flex-wrap">
                                <></>
                                <button
                onClick={() => setShowExamForm(true)} className="flex-[0_1_auto] p-[0.8rem_1.5rem] rounded-[12px] bg-[#8E44AD] text-[#fff] border-none font-[800] text-[0.95rem] cursor-pointer flex items-center gap-[0.5rem] box-shadow-[0_4px_15px_rgba(142,68,173,0.3)] white-space-[nowrap] m-[0]">

                
                                    <FileText size={20} strokeWidth={3} /> Crear Examen
                                </button>
                                <button
                onClick={() => setShowForm(true)} className="flex-[0_1_auto] p-[0.8rem_1.5rem] rounded-[12px] bg-[linear-gradient(135deg,_#36B37E_0%,_#2A9365_100%)] text-[#fff] border-none font-[800] text-[0.95rem] cursor-pointer flex items-center gap-[0.5rem] box-shadow-[0_4px_15px_rgba(54,179,126,0.3)] white-space-[nowrap] m-[0]">

                
                                    <Plus size={20} strokeWidth={3} /> Nueva Charla
                                </button>
                            </div>
                        </div>

                        {/* EHS Training Hub Dashboard Stats */}
                        <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(220px,_1fr))] gap-[1rem] mb-[2rem]">
                            <StatCard icon={<BookOpen />} label="Charlas Dictadas" value={totalCharlas} color="#8b5cf6" gradient="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" />
                            <StatCard icon={<Users />} label="Personal Capacitado" value={totalAsistentes} color="#10b981" gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
                            <StatCard icon={<Timer />} label="Horas Totales" value={`${totalHours} hs`} color="#f59e0b" gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
                            <StatCard icon={<Timer />} label="Duración Promedio" value={`${avgDuration} hs`} color="#3b82f6" gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" />
                        </div>

                        <div className="glass-card p-[1.5rem] rounded-[var(--radius-2xl)] border-[1px_solid_var(--glass-border)] box-shadow-[var(--glass-shadow)] backdrop-filter-[blur(12px)]">
                            <DataTable
              data={history}
              columns={columns}
              searchPlaceholder="Buscar por tema, expositor o empresa..."
              searchFields={['tema', 'expositor', 'empresa']}
              emptyMessage="No hay capacitaciones registradas."
              emptyIcon={<BookOpen size={48} />} />
            
                        </div>
                    </div>
                }
                                    </div>
                    </ModuleFormLayout>
                )}
        </div>
            
            {!showForm && !showExamForm && <AdBanner />}
        </AnimatedPage>);

}